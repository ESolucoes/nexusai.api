// src/mentorados-candidatura/mentorados-candidatura.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LinkedInCandidatorService, CandidaturaResult } from './linkedin/linkedin-candidator.service';

@ApiTags('Candidaturas LinkedIn')
@Controller('mentorados-candidatura')
export class MentoradosCandidaturaController {
  constructor(private readonly linkedinCandidator: LinkedInCandidatorService) {}

  @Post('iniciar-automacao')
  @ApiOperation({ summary: 'Iniciar automação completa' })
  async iniciarAutomacaoCompleta(
    @Body() config: {
      email: string;
      password: string;
      tipoVaga: string;
      empresasBloqueadas: string[];
      pretensaoClt?: number;
      pretensaoPj?: number;
      maxAplicacoes: number;
    }
  ): Promise<{ success: boolean; results: CandidaturaResult[]; message: string }> {
    return this.linkedinCandidator.iniciarAutomacaoCompleta(config);
  }
}