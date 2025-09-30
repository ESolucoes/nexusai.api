import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MentoradoCronogramaService } from './mentorado-cronograma.service';
import { UpdateCronogramaSemanaDto } from './dto/update-semana.dto';
import { UpsertRotinaDto } from './dto/upsert-rotina.dto';

@Controller('mentorado-cronograma')
export class MentoradoCronogramaController {
  constructor(private readonly svc: MentoradoCronogramaService) {}

  // Seed (global ou por usuário)
  @Post('seed')
  async seed(@Query('usuarioId') usuarioId?: string) {
    return this.svc.seedBase(usuarioId);
  }

  // Semanas (agrupado)
  @Get('semanas')
  async listSemanas(@Query('usuarioId') usuarioId?: string) {
    // seed automático se não houver nada
    await this.svc.seedBase(usuarioId);
    return this.svc.listSemanas(usuarioId);
  }

  // Atualizar um item da semana (concluir, alterar texto, etc.)
  @Patch('semanas/:id')
  async updateSemana(@Param('id') id: string, @Body() dto: UpdateCronogramaSemanaDto) {
    return this.svc.updateSemanaItem(id, dto);
  }

  // Rotina fixa
  @Get('rotina')
  async listRotina(@Query('usuarioId') usuarioId?: string) {
    await this.svc.seedRotina(usuarioId);
    return this.svc.listRotina(usuarioId);
  }

  @Post('rotina')
  async upsertRotina(@Query('usuarioId') usuarioId: string | undefined, @Body() dto: UpsertRotinaDto) {
    return this.svc.upsertRotina(usuarioId, dto);
  }
}
