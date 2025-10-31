import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MentoradosCandidaturaService } from './mentorados-candidatura.service';
import { MentoradosCandidaturaController } from './mentorados-candidatura.controller';
import { LinkedInCandidatorService } from './linkedin/linkedin-candidator.service';
import { MentoradosModule } from '../mentorados/mentorados.module';
import { VagaAplicada } from './entities/vaga-aplicada.entity'; // IMPORTE A ENTIDADE

@Module({
  imports: [
    forwardRef(() => MentoradosModule),
    TypeOrmModule.forFeature([VagaAplicada]), // ADICIONE A ENTIDADE AQUI
  ],
  controllers: [MentoradosCandidaturaController],
  providers: [MentoradosCandidaturaService, LinkedInCandidatorService],
  exports: [LinkedInCandidatorService],
})
export class MentoradosCandidaturaModule {}