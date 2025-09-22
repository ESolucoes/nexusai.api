import { Body, Controller, Get, Post, Put, Query, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SsiService } from './ssi.service';
import { QuerySsiDto } from './dto/query-ssi.dto';
import { PostSsiBatchDto } from './dto/post-ssi-batch.dto';
import { PutSsiDto } from './dto/put-ssi.dto';
import { PutSsiBatchDto } from './dto/put-ssi-batch.dto';
import { PutSsiMetaDto } from './dto/put-ssi-meta.dto';
import { PutSsiMetasBatchDto } from './dto/put-ssi-metas-batch.dto';
import { AuthGuard } from '@nestjs/passport';

function pickUserIdFromReq(req: any): string {
  const u = req?.user || {};
  const candidates = [u.id, u.sub, u.usuarioId, u.userId, u.uid];
  const found = candidates.find((v: any) => typeof v === 'string' && v.trim().length > 0);
  if (!found) throw new Error('Usuário inválido no token');
  return String(found);
}

@ApiTags('ssi')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('ssi')
export class SsiController {
  constructor(private readonly service: SsiService) {}

  /** Lista resultados com paginação; se não vier usuarioId, usa o do JWT */
  @Get()
  @ApiOkResponse({ description: 'Lista resultados de SSI' })
  listar(@Req() req: any, @Query() q: QuerySsiDto) {
    const userId = pickUserIdFromReq(req);
    return this.service.listar({ ...q, usuarioId: q.usuarioId ?? userId });
  }

  /** Lista as semanas (segundas normalizadas) que têm registros do usuário */
  @Get('semanas')
  @ApiOkResponse({ description: 'Lista datas de referência (segunda-feira) com registros' })
  listarSemanas(@Req() req: any) {
    const userId = pickUserIdFromReq(req);
    return this.service.listarSemanas(userId);
  }

  /** Retorna todos os registros de UMA semana (data é normalizada para segunda) */
  @Get('por-semana')
  @ApiQuery({ name: 'data', required: true, description: "Qualquer data da semana, ex: '2025-09-01'" })
  @ApiOkResponse({ description: 'Resultados de uma semana específica' })
  obterPorSemana(@Req() req: any, @Query('data') data: string) {
    const userId = pickUserIdFromReq(req);
    return this.service.obterPorSemana(userId, data);
  }

  /** ===================== NOVO: Tabela de evolução por semanas (linhas KPIs x colunas Semanas) ===================== */
  @Get('dashboard-tabela')
  @ApiQuery({ name: 'dataInicio', required: false, description: "Filtro opcional: YYYY-MM-DD (início do intervalo)" })
  @ApiQuery({ name: 'dataFim', required: false, description: "Filtro opcional: YYYY-MM-DD (fim do intervalo)" })
  @ApiOkResponse({ description: 'Tabela de evolução por semanas (sem status/meta), própria para o dashboard' })
  evolucaoPorSemanas(
    @Req() req: any,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
  ) {
    const userId = pickUserIdFromReq(req);
    return this.service.listarEvolucaoSemanas(userId, { dataInicio, dataFim });
  }

  /** POST em lote — grava para o usuário do JWT e normaliza a semana */
  @Post('batch')
  @ApiOkResponse({ description: 'Cria/atualiza resultados em lote (POST)' })
  criarBatch(@Req() req: any, @Body() dto: PostSsiBatchDto) {
    const userId = pickUserIdFromReq(req);
    return this.service.criarBatch({ ...dto, usuarioId: userId });
  }

  /** PUT 1 item (upsert) — usuário do JWT + normaliza semana */
  @Put()
  @ApiOkResponse({ description: 'Cria/atualiza (upsert) 1 registro de SSI' })
  upsertUm(@Req() req: any, @Body() dto: PutSsiDto) {
    const userId = pickUserIdFromReq(req);
    return this.service.upsertUm({ ...dto, usuarioId: userId });
  }

  /** PUT em lote (upsert) — usuário do JWT + normaliza semana */
  @Put('batch')
  @ApiOkResponse({ description: 'Cria/atualiza (upsert) registros em lote (PUT)' })
  upsertBatch(@Req() req: any, @Body() dto: PutSsiBatchDto) {
    const userId = pickUserIdFromReq(req);
    return this.service.upsertBatch({ ...dto, usuarioId: userId });
  }

  @Get('metas')
  @ApiOkResponse({ description: 'Lista as metas de SSI' })
  listarMetas() {
    return this.service.listarMetas();
  }

  @Put('metas')
  @ApiQuery({ name: 'recalcular', required: false, type: Boolean, description: 'Recalcula históricos após atualizar a meta' })
  @ApiOkResponse({ description: 'Upsert de meta (single)' })
  upsertMeta(@Body() dto: PutSsiMetaDto, @Query('recalcular') recalcular?: string) {
    const recalc = String(recalcular ?? '').toLowerCase() === 'true';
    return this.service.upsertMeta(dto, recalc);
  }

  @Put('metas/batch')
  @ApiQuery({ name: 'recalcular', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Upsert de metas (batch)' })
  upsertMetasBatch(@Body() dto: PutSsiMetasBatchDto, @Query('recalcular') recalcular?: string) {
    const recalc = String(recalcular ?? '').toLowerCase() === 'true';
    return this.service.upsertMetasBatch(dto, recalc);
  }
}
