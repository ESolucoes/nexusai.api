import { Module } from '@nestjs/common'
import { ArquivosService } from './arquivos.service'
import { UploadsController } from './uploads.controller'

@Module({
  controllers: [UploadsController],
  providers: [ArquivosService],
  exports: [ArquivosService],
})
export class ArquivosModule {}
