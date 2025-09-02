import { Module } from '@nestjs/common'
import { MentoradoCurriculoController } from './mentorados-curriculo.controller'
import { MentoradoCurriculoService } from './mentorados-curriculo.service'

@Module({
  controllers: [MentoradoCurriculoController],
  providers: [MentoradoCurriculoService],
  exports: [MentoradoCurriculoService],
})
export class MentoradoCurriculoModule {}
