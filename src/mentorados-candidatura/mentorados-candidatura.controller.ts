import { Body, Controller, Post } from '@nestjs/common';
import { MentoradosCandidaturaService } from './mentorados-candidatura.service';
import { CreateCandidaturaDto } from './dto/create-candidatura.dto';

@Controller('mentorados-candidatura')
export class MentoradosCandidaturaController {
  constructor(private readonly candidaturaService: MentoradosCandidaturaService) {}

  @Post()
  async create(@Body() dto: CreateCandidaturaDto) {
    return this.candidaturaService.create(dto);
  }
}
