import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Req,
  Res,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import type { Request, Response } from 'express'
import { MentoradoAudioService, MentoradoAudioInfo } from './mentorados-audio.service'

@ApiTags('Mentorados - Áudio')
@Controller('mentorados')
export class MentoradoAudioController {
  constructor(private readonly service: MentoradoAudioService) {}

  /** Upload: campo do form deve ser `audio` (igual ao front). */
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
          const base = process.env.UPLOADS_PRIVATE_DIR || join(process.cwd(), 'uploads', 'private')
          const folder = join(base, 'mentorados', id, 'audios')
          if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
          cb(null, folder)
        },
        filename: (req, file, cb) => {
          const defaultExt = (file.mimetype?.split('/')[1] || 'webm').replace(/[^a-z0-9]/gi, '').toLowerCase()
          const ext = defaultExt ? `.${defaultExt}` : '.webm'
          cb(null, `${Date.now()}-${randomUUID()}${ext}`)
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
  async upload(
    @Param('id') mentoradoId: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ ok: true; audio: MentoradoAudioInfo }> {
    if (!file) throw new BadRequestException('Arquivo não recebido')
    this.service.ensureDir(mentoradoId)
    const audio = this.service.savedInfo(mentoradoId, file)
    return { ok: true, audio }
  }

  /** Lista os áudios (mais recentes primeiro). */
  @Get(':id/audios')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOkResponse({
    schema: {
      example: { ok: true, total: 1, audios: [{ filename: 'x.webm', url: '/mentorados/ID/audios/x.webm', size: 123, mime: 'audio/webm', savedAt: '...' }] },
    },
  })
  async list(@Param('id') mentoradoId: string) {
    const audios = this.service.list(mentoradoId)
    return { ok: true, total: audios.length, audios }
  }

  /** Download/stream de um áudio específico (suporta Range). */
  @Get(':id/audios/:filename')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async stream(
    @Param('id') mentoradoId: string,
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.service.stream(mentoradoId, filename, req, res)
  }
}
