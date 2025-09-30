// src/mentorado-ssi/mentorado-ssi.controller.ts
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { MentoradoSsiService } from './mentorado-ssi.service';
import { PostMssBatchDto } from './dto/post-mss-batch.dto';
import { QueryMssDto } from './dto/query-mss.dto';

@ApiTags('mentorado-ssi')
@Controller('mentorado-ssi')
export class MentoradoSsiController {
  constructor(private readonly service: MentoradoSsiService) {}

  /** Definições completas (metas/faixas/textos) */
  @Get('definicoes')
  @ApiOkResponse({ description: 'Definições: metas, faixas, textos (positivo/negativo/plano)' })
  definicoes() {
    return this.service.getDefinicoes();
  }

  /** Esqueleto KPI x 12 semanas vazio (com textos) */
  @Get('tabela')
  @ApiOkResponse({ description: 'Tabela vazia (KPIs x 12 semanas) + textos' })
  tabelaVazia(@Query() _q: QueryMssDto) {
    return this.service.getTabelaVazia();
  }

  /** Classifica 12 semanas por indicador e retorna status + mensagens + plano */
  @Post('batch')
  @ApiOkResponse({ description: 'Classificação semanal (OTIMO/BOM/RUIM) + mensagens + plano' })
  classificar(@Body() dto: PostMssBatchDto) {
    return this.service.classificarBatch(dto.itens || []);
  }
}
