// src/usuarios-avatar/usuarios-avatar.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { UsuariosAvatarController } from './usuarios-avatar.controller';
import { UsuariosAvatarService } from './usuarios-avatar.service';
import { ArquivosModule } from '../arquivos/arquivos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario]), ArquivosModule],
  controllers: [UsuariosAvatarController],
  providers: [UsuariosAvatarService],
  exports: [UsuariosAvatarService],
})
export class UsuariosAvatarModule {}
