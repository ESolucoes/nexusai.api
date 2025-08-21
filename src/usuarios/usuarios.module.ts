import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from './usuario.entity';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { VigenciasModule } from '../vigencias/vigencias.module';
import { MentoresModule } from '../mentores/mentores.module';
import { MentoradosModule } from '../mentorados/mentorados.module';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario]), VigenciasModule, MentoresModule, MentoradosModule],
  providers: [UsuariosService],
  controllers: [UsuariosController],
  exports: [UsuariosService],
})
export class UsuariosModule {}
