// src/mentorados-candidatura/mentorados-candidatura.module.ts
import { Module } from '@nestjs/common';
import { MentoradosCandidaturaService } from './mentorados-candidatura.service';
import { MentoradosCandidaturaController } from './mentorados-candidatura.controller';
import { LinkedInCandidatorService } from './linkedin/linkedin-candidator.service';

@Module({
  controllers: [MentoradosCandidaturaController],
  providers: [MentoradosCandidaturaService, LinkedInCandidatorService],
  exports: [LinkedInCandidatorService],
})
export class MentoradosCandidaturaModule {}