import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { ArquivosService } from '../arquivos/arquivos.service';
import { join } from 'path';

@Injectable()
export class UsuariosAvatarService {
  constructor(
    @InjectRepository(Usuario) private readonly repo: Repository<Usuario>,
    private readonly arquivos: ArquivosService,
  ) {}

  async processarUpload(id: string, file: Express.Multer.File) {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // 🔥 CORREÇÃO: Usar caminho relativo consistente
    const relativePath = join('images', 'avatars', file.filename);
    const storageKey = relativePath.replace(/\\/g, '/');

    // 🔥 CORREÇÃO: Garantir que o caminho seja salvo corretamente
    user.avatarPath = storageKey;
    await this.repo.save(user);

    // 🔥 CORREÇÃO: Usar URL absoluta para produção
    const url = this.arquivos.buildPublicUrl(storageKey, { absolute: true });

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