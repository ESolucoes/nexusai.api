import { Module } from '@nestjs/common'
import { ArquivosService } from './arquivos.service'
import { UploadsController } from './uploads.controller'

@Module({
  imports: [],
  providers: [ArquivosService],
  controllers: [UploadsController],
  exports: [ArquivosService],
})
export class ArquivosModule {}
