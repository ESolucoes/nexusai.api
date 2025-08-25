import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'
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
import { extname, join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import { PostMentoradoCurriculoDto } from './dto/post-mentorado-curriculo.dto'
import { UploadCurriculoResponseDto } from './dto/upload-curriculo.response.dto'

@ApiTags('Mentorados')
@Controller('mentorados')
export class MentoradosController {
  constructor(private readonly service: MentoradosService) {}

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
      rg: m.rg,
      cpf: m.cpf,
      nomePai: m.nomePai,
      nomeMae: m.nomeMae,
      dataNascimento: m.dataNascimento,
      rua: m.rua,
      numero: m.numero,
      complemento: m.complemento ?? null,
      cep: m.cep,
      cargoObjetivo: m.cargoObjetivo,
      pretensaoClt: m.pretensaoClt,
      pretensaoPj: m.pretensaoPj,
      linkedin: m.linkedin,
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
          const base = process.env.UPLOADS_PRIVATE_DIR || join(process.cwd(), 'uploads/private')
          const relative = join('files', 'curriculum')
          const full = join(base, relative)
          if (!existsSync(full)) mkdirSync(full, { recursive: true })
          cb(null, full)
        },
        filename: (req, file, cb) => {
          const ext = (extname(file.originalname || '') || '.pdf').toLowerCase()
          cb(null, `${randomUUID()}${ext}`)
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const mime = (file.mimetype || '').toLowerCase()
        const ok = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mime)
        if (!ok) return cb(new BadRequestException('Formato inválido. Envie PDF, DOC ou DOCX.'), false)
        cb(null, true)
      },
    }),
  )
  async uploadCurriculo(
    @Param('id') mentoradoId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadCurriculoResponseDto> {
    if (!file) throw new BadRequestException('Arquivo não recebido')
    return this.service.salvarCurriculo(mentoradoId, file)
  }
}
