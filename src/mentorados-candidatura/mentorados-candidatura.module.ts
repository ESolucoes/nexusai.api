import { Module } from '@nestjs/common';
import { MentoradosCandidaturaService } from './mentorados-candidatura.service';
import { MentoradosCandidaturaController } from './mentorados-candidatura.controller';

@Module({
  controllers: [MentoradosCandidaturaController],
  providers: [MentoradosCandidaturaService],
})
export class MentoradosCandidaturaModule {}
