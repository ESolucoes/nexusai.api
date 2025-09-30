import { Module } from '@nestjs/common'
import { ArquivosService } from './arquivos.service'
import { UploadsController } from './uploads.controller' // <= teu controller

@Module({
  providers: [ArquivosService],
  controllers: [UploadsController],   // <= adiciona aqui
  exports: [ArquivosService],
})
export class ArquivosModule {}
