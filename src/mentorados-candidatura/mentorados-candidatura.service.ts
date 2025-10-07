// backend/src/mentorados-candidatura/mentorados-candidatura.service.ts
import { Injectable } from '@nestjs/common';
import { CreateCandidaturaDto } from './dto/create-candidatura.dto';
import { candidatarLinkedIn } from './linkedin/linkedin-automation';

@Injectable()
export class MentoradosCandidaturaService {
  async create(dto: CreateCandidaturaDto) {
    // Aqui você poderia salvar a candidatura no banco
    // await this.candidaturaRepository.save({ ...dto, status: 'pendente' });

    // Chamar automação do LinkedIn
    await candidatarLinkedIn(dto);

    return { message: 'Candidatura enviada com sucesso!' };
  }
}
