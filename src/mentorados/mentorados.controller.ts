import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
  Req,
  NotFoundException,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { MentoradosService } from './mentorados.service'
import { Mentorado } from './mentorado.entity'
import { PostMentoradoDto } from './dto/post-mentorado.dto'
import { PutMentoradoDto } from './dto/put-mentorado.dto'
import { GetMentoradoDto } from './dto/get-mentorado.dto'
import { GetMentoradoIDDto } from './dto/get-mentorado-id.dto'
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard'
import { MentorAdminGuard } from '../mentores/guards/mentor-admin.guard'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { basename, extname, join, resolve } from 'path'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  createReadStream,
} from 'fs'
import { randomUUID } from 'crypto'
import { PostMentoradoCurriculoDto } from './dto/post-mentorado-curriculo.dto'
import { UploadCurriculoResponseDto } from './dto/upload-curriculo.response.dto'
import type { Request, Response } from 'express'
import * as mime from 'mime-types'
import contentDisposition from 'content-disposition'

@ApiTags('Mentorados')
@Controller('mentorados')
export class MentoradosController {
  constructor(private readonly service: MentoradosService) {}

  /* ====================== CRUD ====================== */

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: [GetMentoradoDto] })
  async listar(): Promise<GetMentoradoDto[]> {
    return this.service.listar()
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ type: GetMentoradoIDDto })
  async buscarPorId(@Param('id') id: string): Promise<GetMentoradoIDDto> {
    const m = await this.service.buscarPorId(id)
    return {
      id: m.id,
      usuarioId: m.usuarioId,
      mentorId: m.mentorId,
      tipo: m.tipo as any,
      rg: m.rg ?? '',
      cpf: m.cpf ?? '',
      nomePai: m.nomePai ?? '',
      nomeMae: m.nomeMae ?? '',
      dataNascimento: (m.dataNascimento ?? '') as any,
      rua: m.rua ?? '',
      numero: m.numero ?? '',
      complemento: m.complemento ?? null,
      cep: m.cep ?? '',
      cargoObjetivo: m.cargoObjetivo ?? '',
      pretensaoClt: m.pretensaoClt ?? '',
      pretensaoPj: m.pretensaoPj ?? '',
      linkedin: m.linkedin ?? '',
      criadoEm: m.criadoEm,
      atualizadoEm: m.atualizadoEm,
    }
  }

  @Post()
  @ApiCreatedResponse({ type: Mentorado })
  async criar(@Body() dto: PostMentoradoDto): Promise<Mentorado> {
    return this.service.criar(dto)
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, MentorAdminGuard)
  @ApiOkResponse({ type: Mentorado })
  async atualizar(@Param('id') id: string, @Body() dto: PutMentoradoDto) {
    return this.service.atualizar(id, dto)
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, MentorAdminGuard)
  @ApiOkResponse({ schema: { example: { sucesso: true } } })
  async deletar(@Param('id') id: string) {
    return this.service.deletar(id)
  }

  /* ====================== CURRÍCULO ====================== */

  @Post(':id/curriculo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: PostMentoradoCurriculoDto })
  @ApiOkResponse({ type: UploadCurriculoResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const base =
            process.env.UPLOADS_PRIVATE_DIR ||
            join(process.cwd(), 'uploads', 'private')
          const folder = join(base, 'files', 'curriculum')
          if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
          cb(null, folder)
        },
        filename: (req, file, cb) => {
          const ext = (extname(file.originalname || '') || '.pdf').toLowerCase()
          cb(null, `${randomUUID()}${ext}`)
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const t = (file.mimetype || '').toLowerCase()
        const ok =
          t === 'application/pdf' ||
          t === 'application/msword' ||
          t ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        if (!ok)
          return cb(
            new BadRequestException('Formato inválido. Envie PDF, DOC ou DOCX.'),
            false,
          )
        cb(null, true)
      },
    }),
  )
  async uploadCurriculo(
    @Param('id') mentoradoId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadCurriculoResponseDto & { url: string }> {
    if (!file) throw new BadRequestException('Arquivo não recebido')

    const saved = await this.service.salvarCurriculo(mentoradoId, file)
    // URL autenticada de download
    const url = `/mentorados/${mentoradoId}/curriculo/${encodeURIComponent(file.filename)}`
    return { ...saved, url }
  }

  @Get(':id/curriculo/:filename')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async downloadCurriculo(
    @Param('id') mentoradoId: string,
    @Param('filename') filenameParam: string,
    @Res() res: Response,
  ) {
    const base = resolve(
      process.env.UPLOADS_PRIVATE_DIR ?? join(process.cwd(), 'uploads', 'private'),
    )
    // impede path traversal
    const filename = basename(filenameParam)
    const filePath = resolve(base, 'files', 'curriculum', filename)

    if (
      !filePath.startsWith(base) ||
      !existsSync(filePath) ||
      !statSync(filePath).isFile()
    ) {
      throw new NotFoundException('Currículo não encontrado')
    }

    res.setHeader('Content-Type', mime.lookup(filePath) || 'application/octet-stream')
    res.setHeader('Content-Disposition', contentDisposition(filename, { type: 'attachment' }))

    const stream = createReadStream(filePath)
    stream.on('error', () => {
      if (!res.headersSent) res.status(500).end()
    })
    stream.pipe(res)
  }

  /* ====================== ÁUDIO ====================== */

  @Post(':id/audios')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { audio: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('audio', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const id = String(req.params['id'] || '')
          const base =
            process.env.UPLOADS_PRIVATE_DIR ||
            join(process.cwd(), 'uploads', 'private')
          const folder = join(base, 'mentorados', id, 'audios')
          if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
          cb(null, folder)
        },
        filename: (req, file, cb) => {
          const guessed =
            (file.mimetype?.split('/')[1] || 'webm')
              .replace(/[^a-z0-9]/gi, '')
              .toLowerCase() || 'webm'
          cb(null, `${Date.now()}-${randomUUID()}.${guessed}`)
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const t = (file.mimetype || '').toLowerCase()
        if (!t.startsWith('audio/')) {
          return cb(new BadRequestException('Envie um arquivo de áudio.'), false)
        }
        cb(null, true)
      },
    }),
  )
  async uploadAudio(
    @Param('id') mentoradoId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo não recebido')
    const base = resolve(
      process.env.UPLOADS_PRIVATE_DIR ?? join(process.cwd(), 'uploads', 'private'),
    )
    const abs = resolve(base, 'mentorados', mentoradoId, 'audios', file.filename)
    const st = statSync(abs)
    return {
      ok: true,
      audio: {
        filename: file.filename,
        mime: (file.mimetype as string) || ((mime.lookup(abs) as string) || 'application/octet-stream'),
        size: st.size,
        savedAt: new Date(st.mtimeMs).toISOString(),
        url: `/mentorados/${mentoradoId}/audios/${encodeURIComponent(file.filename)}`,
      },
    }
  }

  @Get(':id/audios')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async listAudios(@Param('id') mentoradoId: string) {
    const base = resolve(
      process.env.UPLOADS_PRIVATE_DIR ?? join(process.cwd(), 'uploads', 'private'),
    )
    const dir = resolve(base, 'mentorados', mentoradoId, 'audios')
    if (!dir.startsWith(base) || !existsSync(dir)) {
      return { ok: true, total: 0, audios: [] as any[] }
    }

    const files = readdirSync(dir)
      .filter((f) => statSync(join(dir, f)).isFile())
      .map((f) => {
        const fp = join(dir, f)
        const st = statSync(fp)
        return {
          filename: f,
          mime: (mime.lookup(fp) as string) || 'application/octet-stream',
          size: st.size,
          savedAt: new Date(st.mtimeMs).toISOString(),
          url: `/mentorados/${mentoradoId}/audios/${encodeURIComponent(f)}`,
        }
      })
      .sort((a, b) => Number(new Date(b.savedAt)) - Number(new Date(a.savedAt)))

    return { ok: true, total: files.length, audios: files }
  }

  @Get(':id/audios/:filename')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  streamAudio(
    @Param('id') mentoradoId: string,
    @Param('filename') filenameParam: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const base = resolve(
      process.env.UPLOADS_PRIVATE_DIR ?? join(process.cwd(), 'uploads', 'private'),
    )
    const filename = basename(filenameParam)
    const filePath = resolve(base, 'mentorados', mentoradoId, 'audios', filename)

    if (
      !filePath.startsWith(base) ||
      !existsSync(filePath) ||
      !statSync(filePath).isFile()
    ) {
      throw new NotFoundException('Áudio não encontrado')
    }

    const st = statSync(filePath)
    const type = (mime.lookup(filePath) || 'application/octet-stream') as string
    res.setHeader('Content-Type', type)

    const safePipe = (start?: number, end?: number) => {
      const s = createReadStream(filePath, start !== undefined ? { start, end } : undefined)
      s.on('error', () => {
        if (!res.headersSent) res.status(500).end()
      })
      s.pipe(res)
    }

    const range = req.headers.range
    if (range) {
      const [s, e] = range.replace(/bytes=/, '').split('-')
      let start = parseInt(s, 10)
      let end = e ? parseInt(e, 10) : st.size - 1
      if (Number.isNaN(start)) start = 0
      if (Number.isNaN(end) || end > st.size - 1) end = st.size - 1

      res.status(206)
      res.setHeader('Content-Range', `bytes ${start}-${end}/${st.size}`)
      res.setHeader('Accept-Ranges', 'bytes')
      res.setHeader('Content-Length', String(end - start + 1))
      return safePipe(start, end)
    }

    res.setHeader('Content-Length', String(st.size))
    return safePipe()
  }
}
