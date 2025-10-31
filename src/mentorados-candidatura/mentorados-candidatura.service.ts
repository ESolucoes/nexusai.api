import { Injectable } from '@nestjs/common';
import { LinkedInCandidatorService } from './linkedin/linkedin-candidator.service';
import { IniciarAutomacaoDto } from './dto/iniciar-automacao.dto';

@Injectable()
export class MentoradosCandidaturaService {
  constructor(private readonly linkedinCandidator: LinkedInCandidatorService) {}

  async create(config: IniciarAutomacaoDto) {
    // Converte DTO para o formato esperado pelo serviço
    const serviceConfig = {
      ...config,
      empresasBloqueadas: config.empresasBloqueadas || [],
      mentoradoId: config.mentoradoId || '',
      respostasChat: config.respostasChat || {
        disponibilidade: '',
        avisoPrevio: '',
        interesse: '',
        pretensaoSalarial: '',
        pretensaoPj: '',
        localizacao: '',
        experiencia: '',
        outrasPerguntas: '',
        respostaPadrao: ''
      }
    };
    
    return this.linkedinCandidator.iniciarAutomacaoCompleta(serviceConfig);
  }
}