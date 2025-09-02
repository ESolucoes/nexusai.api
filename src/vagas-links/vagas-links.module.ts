import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VagaLink } from './vaga-link.entity';
import { VagasLinksService } from './vagas-links.service';
import { VagasLinksController } from './vagas-links.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VagaLink])],
  controllers: [VagasLinksController],
  providers: [VagasLinksService],
  exports: [TypeOrmModule],
})
export class VagasLinksModule {}
