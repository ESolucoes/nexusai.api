// backend/src/mentorados-candidatura/mentorados-candidatura.service.ts
import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateCandidaturaDto } from './dto/create-candidatura.dto';
import { candidatarPorTipo } from './linkedin/linkedin-automation';

@Injectable()
export class MentoradosCandidaturaService {
  private readonly logger = new Logger(MentoradosCandidaturaService.name);

  async create(dto: CreateCandidaturaDto) {
    // opcional: salvar no banco antes com status 'pendente'
    // await this.candidaturaRepository.save({ ...dto, status: 'pendente' });

    try {
      const result = await candidatarPorTipo(dto);

      // opcional: atualizar registro no banco com resultado (attempted/applied, erros, etc)
      // await this.candidaturaRepository.update(id, { status: 'concluida', resultado: result });

      return { sucesso: true, result };
    } catch (err) {
      this.logger.error('Erro ao processar candidatura', err as any);
      // opcional: atualizar registro no banco com erro
      // await this.candidaturaRepository.update(id, { status: 'erro', erro: String(err) });
      throw new InternalServerErrorException('Falha ao processar automação de candidatura.');
    }
  }
}
