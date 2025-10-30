// src/mentorados-candidatura/mentorados-candidatura.service.ts
import { Injectable } from '@nestjs/common';
import { LinkedInCandidatorService } from './linkedin/linkedin-candidator.service';

@Injectable()
export class MentoradosCandidaturaService {
  constructor(private readonly linkedinCandidator: LinkedInCandidatorService) {}

  async create(config: {
    email: string;
    password: string;
    tipoVaga: string;
    empresasBloqueadas: string[];
    pretensaoClt?: number;
    pretensaoPj?: number;
    maxAplicacoes: number;
  }) {
    return this.linkedinCandidator.iniciarAutomacaoCompleta(config);
  }
}