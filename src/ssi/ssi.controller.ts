import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { SsiService } from './ssi.service';
import { QuerySsiDto } from './dto/query-ssi.dto';
import { PostSsiBatchDto } from './dto/post-ssi-batch.dto';
import { PutSsiDto } from './dto/put-ssi.dto';
import { PutSsiBatchDto } from './dto/put-ssi-batch.dto';
import { PutSsiMetaDto } from './dto/put-ssi-meta.dto';
import { PutSsiMetasBatchDto } from './dto/put-ssi-metas-batch.dto';

@ApiTags('ssi')
@ApiBearerAuth()
@Controller('ssi')
export class SsiController {
  constructor(private readonly service: SsiService) {}

  @Get()
  @ApiOkResponse({ description: 'Lista resultados de SSI' })
  listar(@Query() q: QuerySsiDto) {
    return this.service.listar(q);
  }

  @Post('batch')
  @ApiOkResponse({ description: 'Cria/atualiza resultados em lote (POST)' })
  criarBatch(@Body() dto: PostSsiBatchDto) {
    return this.service.criarBatch(dto);
  }

  @Put()
  @ApiOkResponse({ description: 'Cria/atualiza (upsert) 1 registro de SSI' })
  upsertUm(@Body() dto: PutSsiDto) {
    return this.service.upsertUm(dto);
  }

  @Put('batch')
  @ApiOkResponse({ description: 'Cria/atualiza (upsert) registros em lote (PUT)' })
  upsertBatch(@Body() dto: PutSsiBatchDto) {
    return this.service.upsertBatch(dto);
  }

  @Get('metas')
  @ApiOkResponse({ description: 'Lista as metas de SSI' })
  listarMetas() {
    return this.service.listarMetas();
  }

  // NOVOS: Upsert de meta (single) com opção de recalcular resultados históricos
  @Put('metas')
  @ApiQuery({ name: 'recalcular', required: false, type: Boolean, description: 'Recalcula status históricos após atualizar a meta' })
  @ApiOkResponse({ description: 'Upsert de meta (single)' })
  upsertMeta(@Body() dto: PutSsiMetaDto, @Query('recalcular') recalcular?: string) {
    const recalc = String(recalcular ?? '').toLowerCase() === 'true';
    return this.service.upsertMeta(dto, recalc);
  }

  // NOVOS: Upsert de metas (batch) com recálculo opcional
  @Put('metas/batch')
  @ApiQuery({ name: 'recalcular', required: false, type: Boolean })
  @ApiOkResponse({ description: 'Upsert de metas (batch)' })
  upsertMetasBatch(@Body() dto: PutSsiMetasBatchDto, @Query('recalcular') recalcular?: string) {
    const recalc = String(recalcular ?? '').toLowerCase() === 'true';
    return this.service.upsertMetasBatch(dto, recalc);
  }
}
