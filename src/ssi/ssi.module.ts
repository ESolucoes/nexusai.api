import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SsiMeta } from './entities/ssi-meta.entity'
import { SsiResultado } from './entities/ssi-resultado.entity'
import { SsiService } from './ssi.service'
import { SsiController } from './ssi.controller'

@Module({
  imports: [TypeOrmModule.forFeature([SsiMeta, SsiResultado])],
  providers: [SsiService],
  controllers: [SsiController],
  exports: [TypeOrmModule],
})
export class SsiModule {}
