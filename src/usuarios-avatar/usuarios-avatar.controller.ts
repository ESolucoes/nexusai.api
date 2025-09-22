// src/usuarios-avatar/usuarios-avatar.controller.ts
import {
  BadRequestException,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../autenticacao/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { UsuariosAvatarService } from './usuarios-avatar.service';
import { UploadAvatarResponseDto } from '../usuarios/dto/upload-avatar.response.dto';

@ApiTags('Usuários - Avatar')
@Controller('usuarios')
export class UsuariosAvatarController {
  constructor(private readonly service: UsuariosAvatarService) {}

  @Post(':id/avatar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: UploadAvatarResponseDto })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const base =
            process.env.UPLOADS_PUBLIC_DIR ||
            join(process.cwd(), 'uploads', 'public');
          const relative = join('images', 'avatars');
          const full = join(base, relative);
          if (!existsSync(full)) mkdirSync(full, { recursive: true });
          cb(null, full);
        },
        filename: (_req, file, cb) => {
          const ext =
            (extname(file.originalname || '') || '.jpg').toLowerCase() || '.jpg';
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (_req, file, cb) => {
        const mime = (file.mimetype || '').toLowerCase();
        const ok = /^image\/(png|jpe?g|webp|gif)$/.test(mime);
        if (!ok) return cb(new BadRequestException('Tipo de imagem inválido'), false);
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadAvatarResponseDto> {
    if (!file) throw new BadRequestException('Arquivo não recebido');
    return this.service.processarUpload(id, file);
  }
}
