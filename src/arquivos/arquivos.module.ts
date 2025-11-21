import { Module } from '@nestjs/common'
import { ArquivosService } from './arquivos.service'
import { UploadsController } from './uploads.controller'
import { ServeStaticModule } from '@nestjs/serve-static'
import { join } from 'path'

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads', 'public'),
      serveRoot: '/uploads',
    }),
  ],
  providers: [ArquivosService],
  controllers: [UploadsController],
  exports: [ArquivosService],
})
export class ArquivosModule {}