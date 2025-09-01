import {
  Body, Controller, Get, Post, Query, Param,
  UseInterceptors, UploadedFiles, BadRequestException, Req,
  ForbiddenException, UnauthorizedException, UseGuards
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger'
import { FileFieldsInterceptor } from '@nestjs/platform-express'
import { AuthGuard } from '@nestjs/passport'
import { memoryStorage } from 'multer'
import { extname } from 'path'

import { AgentesService } from './agentes.service'
import { GetLatestQueryDto } from './dto/get-latest.dto'
import { PostMessageDto } from './dto/post-message.dto'

/** Extensões/MIME aceitos: imagens + documentos comuns */
const ALLOWED_EXT = new Set([
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.bmp', '.svg',
  '.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt',
  '.csv', '.xls', '.xlsx', '.ppt', '.pptx', '.json'
])
const ALLOWED_MIME = new Set([
  // imagens
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/bmp', 'image/svg+xml',
  // documentos
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.oasis.opendocument.text',
  'application/rtf', 'text/rtf',
  'text/plain',
  'text/csv', 'application/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/json'
])

function docsOrImagesFilter(_: any, file: Express.Multer.File, cb: (err: any, acceptFile: boolean) => void) {
  const okByMime = ALLOWED_MIME.has(String(file.mimetype).toLowerCase())
  const okByExt = ALLOWED_EXT.has(extname(file.originalname).toLowerCase())
  if (okByMime || okByExt) return cb(null, true)
  cb(new BadRequestException('Tipo de arquivo não permitido. Envie imagens ou documentos (pdf, docx, xlsx, pptx, etc).'), false)
}

function extractUserId(user: any): string {
  const id = user?.sub || user?.id || user?.userId || user?.uid || user?.usuarioId
  if (!id) throw new UnauthorizedException('Usuário não autenticado')
  return String(id)
}

@ApiTags('Agentes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('agentes')
export class AgentesController {
  constructor(private readonly svc: AgentesService) {}

  @Get('session/latest')
  async latest(@Req() req: any, @Query() query: GetLatestQueryDto) {
    const uid = extractUserId(req.user)
    const { session, messages } = await this.svc.getLatestSession(uid, query.assistantKey as any)
    return {
      sessionId: session?.id ?? null,
      messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })),
    }
  }

  @Get('session/:id')
  async getById(@Req() req: any, @Param('id') id: string) {
    const uid = extractUserId(req.user)
    const { session, messages } = await this.svc.getSessionById(id)
    if (!session || session.userId !== uid) throw new ForbiddenException('Acesso negado à sessão')
    return {
      sessionId: session.id,
      messages: messages.map(m => ({ id: m.id, role: m.role, content: m.content, createdAt: m.createdAt })),
    }
  }

  @Get('sessions')
  async listSessions(@Req() req: any, @Query() query: GetLatestQueryDto) {
    const uid = extractUserId(req.user)
    const { sessions } = await this.svc.listSessions(uid, query.assistantKey as any)
    return { sessions }
  }

  @Post('messages')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        assistantKey: { type: 'string', enum: ['PAUL_GPT','FAQ_NEXUS','TESTE_PERCEPCAO_VAGAS','MSG_HEADHUNTER','CALEIDOSCOPIO_CONTEUDO'] },
        sessionId: { type: 'string', format: 'uuid' },
        content: { type: 'string' },
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' } // aceita qualquer binário
        }
      },
      required: ['assistantKey']
    }
  })
  @UseInterceptors(FileFieldsInterceptor(
    [{ name: 'files', maxCount: 12 }],
    {
      storage: memoryStorage(),                 // precisamos do buffer em memória
      limits: { fileSize: 20 * 1024 * 1024 },   // 20MB/arquivo (ajuste se quiser)
      fileFilter: docsOrImagesFilter,
    },
  ))
  async post(
    @Req() req: any,
    @Body() body: PostMessageDto,
    @UploadedFiles() files?: { files?: Express.Multer.File[] }
  ) {
    const uid = extractUserId(req.user)
    return await this.svc.postMessage({
      userId: uid,
      assistantKey: body.assistantKey as any,
      sessionId: body.sessionId,
      content: body.content ?? '',
      files: files?.files ?? [],
    })
  }
}
