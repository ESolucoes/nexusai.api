// src/mentorado-ssi/mentorado-ssi.module.ts
import { Module } from '@nestjs/common';
import { MentoradoSsiService } from './mentorado-ssi.service';
import { MentoradoSsiController } from './mentorado-ssi.controller';

@Module({
  providers: [MentoradoSsiService],
  controllers: [MentoradoSsiController],
})
export class MentoradoSsiModule {}
