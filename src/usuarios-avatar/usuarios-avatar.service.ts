// src/usuarios-avatar/usuarios-avatar.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { ArquivosService } from '../arquivos/arquivos.service';

@Injectable()
export class UsuariosAvatarService {
  constructor(
    @InjectRepository(Usuario) private readonly repo: Repository<Usuario>,
    private readonly arquivos: ArquivosService,
  ) {}

  async processarUpload(id: string, file: Express.Multer.File) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      // evitar circular dep de exception do UsuariosService
      throw new (require('@nestjs/common').NotFoundException)('Usuário não encontrado');
    }

    const storageKey = ['images', 'avatars', file.filename]
      .join('/')
      .replace(/\\/g, '/');

    user.avatarPath = storageKey;
    await this.repo.save(user);

    const url = this.arquivos.buildPublicUrl(storageKey);

    return {
      sucesso: true,
      url,
      storageKey,
      filename: file.filename,
      mime: file.mimetype,
      tamanho: file.size,
    };
  }
}
