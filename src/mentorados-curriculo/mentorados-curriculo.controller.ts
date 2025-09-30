import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  Res,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard'
import {
  AnyFilesInterceptor,
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import type { Response } from 'express'
import { MentoradoCurriculoService } from './mentorados-curriculo.service'

/** ======= Multer (armazenamento + validação) ======= */
function getMulterOptions() {
  return {
    storage: diskStorage({
      destination: (req, _file, cb) => {
        const id = String(req.params['id'] || '')
        const base =
          process.env.UPLOADS_PRIVATE_DIR ||
          join(process.cwd(), 'uploads', 'private')
        const folder = join(base, 'mentorados', id, 'curriculo')
        if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
        cb(null, folder)
      },
      filename: (_req, file, cb) => {
        const orig = (file.originalname || '').toLowerCase()
        const ext = orig.endsWith('.docx')
          ? '.docx'
          : orig.endsWith('.doc')
          ? '.doc'
          : orig.endsWith('.pdf')
          ? '.pdf'
          : '.pdf'
        cb(null, `${Date.now()}-${randomUUID()}${ext}`)
      },
    }),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
    fileFilter: (_req, file, cb) => {
      const t = (file.mimetype || '').toLowerCase()
      const ok =
        t === 'application/pdf' ||
        t === 'application/msword' ||
        t ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      if (!ok) return cb(new BadRequestException('Envie PDF, DOC ou DOCX.'), false)
      cb(null, true)
    },
  }
}

@ApiTags('Mentorados - Currículo')
@Controller('mentorados')
export class MentoradoCurriculoController {
  constructor(private readonly service: MentoradoCurriculoService) {}

  /** ======= Upload ÚNICO (retrocompatível) ======= */
  @Post(':id/curriculo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', getMulterOptions()))
  async uploadUnico(
    @Param('id') mentoradoId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo não recebido')
    this.service.ensureDir(mentoradoId)
    const info = this.service.saveFile(mentoradoId, file, file.originalname || file.filename)
    return {
      sucesso: true,
      arquivo: info,
    }
  }

  /** ======= Upload MÚLTIPLO (novo) ======= */
  @Post(':id/curriculos')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 20, getMulterOptions()))
  async uploadMultiplo(
    @Param('id') mentoradoId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo recebido')
    }
    this.service.ensureDir(mentoradoId)
    const infos = this.service.saveFiles(
      mentoradoId,
      files.map((f) => ({ file: f, originalName: f.originalname || f.filename })),
    )
    return {
      sucesso: true,
      total: infos.length,
      arquivos: infos,
    }
  }

  /** ======= Upload (qualquer campo) — opcional para máxima compat ======= */
  @Post(':id/curriculo-any')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(AnyFilesInterceptor(getMulterOptions()))
  async uploadQualquerCampo(
    @Param('id') mentoradoId: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo recebido')
    }
    this.service.ensureDir(mentoradoId)
    const infos = this.service.saveFiles(
      mentoradoId,
      files.map((f) => ({ file: f, originalName: f.originalname || f.filename })),
    )
    return {
      sucesso: true,
      total: infos.length,
      arquivos: infos,
    }
  }

  /** ======= Listar TODOS os currículos ======= */
  @Get(':id/curriculo/list')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    description: 'Lista todos os currículos do mentorado (mais recentes primeiro)',
  })
  async list(@Param('id') mentoradoId: string) {
    const list = this.service.listFiles(mentoradoId)
    return { total: list.length, arquivos: list }
  }
  
  // 👈 CORREÇÃO: Novo endpoint para o front-end obter o status após o F5
  /** ======= Status/Info do Último Currículo (para display) ======= */
  @Get(':id/curriculo/latest-info')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    description: 'Retorna os metadados do último currículo salvo (ou 404 se não houver)',
  })
  async getLatestInfo(@Param('id') mentoradoId: string) {
    return this.service.getLatestFileInfo(mentoradoId) 
  }

  /** ======= Baixar o ÚLTIMO (compatível) ======= */
  @Get(':id/curriculo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Baixa o último currículo do mentorado' })
  downloadUltimo(@Param('id') mentoradoId: string, @Res() res: Response) {
    return this.service.downloadLatest(mentoradoId, res)
  }

  /** ======= Baixar por NOME (alias novo mais limpo) ======= */
  @Get(':id/curriculo/:filename')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  downloadPorNomeAlias(
    @Param('id') mentoradoId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.service.downloadByName(mentoradoId, filename, res)
  }

  /** ======= Baixar por NOME (compatível com rota antiga) ======= */
  @Get(':id/curriculo/by-name/:filename')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  downloadPorNomeLegacy(
    @Param('id') mentoradoId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.service.downloadByName(mentoradoId, filename, res)
  }
}