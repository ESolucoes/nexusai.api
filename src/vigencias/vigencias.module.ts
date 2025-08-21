import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vigencia } from './vigencia.entity';
import { VigenciasService } from './vigencias.service';
import { VigenciasController } from './vigencias.controller';
import { MentoresModule } from '../mentores/mentores.module';
import { Usuario } from '../usuarios/usuario.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vigencia, Usuario]),
    MentoresModule,
  ],
  providers: [VigenciasService],
  controllers: [VigenciasController],
  exports: [VigenciasService],
})
export class VigenciasModule {}
