import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Res,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import type { Response } from 'express'
import { MentoradoCurriculoService } from './mentorados-curriculo.service'

@ApiTags('Mentorados - Currículo')
@Controller('mentorados')
export class MentoradoCurriculoController {
  constructor(private readonly service: MentoradoCurriculoService) {}

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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const id = String(req.params['id'] || '')
          const base = process.env.UPLOADS_PRIVATE_DIR || join(process.cwd(), 'uploads', 'private')
          const folder = join(base, 'mentorados', id, 'curriculo')
          if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
          cb(null, folder)
        },
        filename: (_req, file, cb) => {
          const orig = (file.originalname || '').toLowerCase()
          const ext = orig.endsWith('.docx') ? '.docx' :
                      orig.endsWith('.doc')  ? '.doc'  :
                      orig.endsWith('.pdf')  ? '.pdf'  : '.pdf'
          cb(null, `${Date.now()}-${randomUUID()}${ext}`)
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const t = (file.mimetype || '').toLowerCase()
        const ok = t === 'application/pdf' ||
                   t === 'application/msword' ||
                   t === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        if (!ok) return cb(new BadRequestException('Envie PDF, DOC ou DOCX.'), false)
        cb(null, true)
      },
    }),
  )
  async upload(
    @Param('id') mentoradoId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Arquivo não recebido')
    this.service.ensureDir(mentoradoId)
    const info = this.service.savedInfo(mentoradoId, file, file.originalname || file.filename)
    return {
      sucesso: true,
      storageKey: `mentorados/${mentoradoId}/curriculo/${file.filename}`,
      filename: info.originalName,
      mime: info.mime,
      tamanho: info.size,
      url: info.url,
    }
  }

  @Get(':id/curriculo')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({ description: 'Baixa o último currículo do mentorado' })
  downloadUltimo(@Param('id') mentoradoId: string, @Res() res: Response) {
    return this.service.downloadLatest(mentoradoId, res)
  }

  @Get(':id/curriculo/by-name/:filename')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  downloadPorNome(
    @Param('id') mentoradoId: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    return this.service.downloadByName(mentoradoId, filename, res)
  }
}
