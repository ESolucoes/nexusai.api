import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { join, extname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { randomUUID } from 'crypto'
import type { Request, Response } from 'express'
import { MentoradoAudioService, MentoradoAudioInfo } from './mentorados-audio.service'

@ApiTags('Mentorados - Áudio')
@Controller('mentorados')
export class MentoradoAudioController {
  constructor(private readonly service: MentoradoAudioService) {}

  private static readonly ALLOWED_MIME = new Set<string>([
    // MP3
    'audio/mpeg',
    'audio/mp3',
    // WAV
    'audio/wav',
    'audio/x-wav',
    'audio/wave',
    'audio/vnd.wave',
  ])

  private static readonly ALLOWED_EXT = new Set<string>(['.mp3', '.wav'])

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
          try {
            const id = String(req.params['id'] || '').trim()
            if (!id) return cb(new BadRequestException('ID do mentorado inválido'), '')
            const base = process.env.UPLOADS_PRIVATE_DIR || join(process.cwd(), 'uploads', 'private')
            const folder = join(base, 'mentorados', id, 'audios')
            if (!existsSync(folder)) mkdirSync(folder, { recursive: true })
            cb(null, folder)
          } catch (e) {
            cb(e as Error, '')
          }
        },
        filename: (req, file, cb) => {
          // Decide a extensão final com base no MIME ou no nome original
          const originalExt = (extname(file.originalname) || '').toLowerCase()
          let ext = ''

          const mime = (file.mimetype || '').toLowerCase()
          if (mime.includes('mpeg') || mime.includes('mp3')) ext = '.mp3'
          else if (mime.includes('wav') || mime.includes('wave')) ext = '.wav'

          // Fallback: se o MIME não ajudou, usa a extensão original se for válida
          if (!ext && MentoradoAudioController.ALLOWED_EXT.has(originalExt)) {
            ext = originalExt
          }

          // Último fallback (não deve ocorrer porque o fileFilter já bloqueia): força .mp3
          if (!ext) ext = '.mp3'

          cb(null, `${Date.now()}-${randomUUID()}${ext}`)
        },
      }),
      limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
      fileFilter: (req, file, cb) => {
        const mime = (file.mimetype || '').toLowerCase()
        const originalExt = (extname(file.originalname) || '').toLowerCase()

        const mimeOk = MentoradoAudioController.ALLOWED_MIME.has(mime)
        const extOk = MentoradoAudioController.ALLOWED_EXT.has(originalExt)

        // Aceita se (MIME permitido) OU (extensão .mp3/.wav)
        if (!mimeOk && !extOk) {
          return cb(
            new BadRequestException('Formato inválido. Envie um áudio MP3 ou WAV.'),
            false,
          )
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
      example: {
        ok: true,
        total: 1,
        audios: [
          {
            filename: 'x.mp3',
            url: '/mentorados/ID/audios/x.mp3',
            size: 123,
            mime: 'audio/mpeg',
            savedAt: '...',
          },
        ],
      },
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
    req: Request,
    res: Response,
  ) {
    return this.service.stream(mentoradoId, filename, req, res)
  }
}
