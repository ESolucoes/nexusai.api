import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { SsiResultado } from './entities/ssi-resultado.entity';
import { SsiMeta } from './entities/ssi-meta.entity';
import { PostSsiBatchDto } from './dto/post-ssi-batch.dto';
import { QuerySsiDto } from './dto/query-ssi.dto';
import { PutSsiDto } from './dto/put-ssi.dto';
import { PutSsiBatchDto } from './dto/put-ssi-batch.dto';
import { SsiMetrica } from './enums/ssi-metrica.enum';
import { SsiUnidade } from './enums/ssi-unidade.enum';
import { SsiStatus } from './enums/ssi-status.enum';
import { PutSsiMetaDto } from './dto/put-ssi-meta.dto';
import { PutSsiMetasBatchDto } from './dto/put-ssi-metas-batch.dto';

@Injectable()
export class SsiService {
  constructor(
    @InjectRepository(SsiResultado) private readonly resultados: Repository<SsiResultado>,
    @InjectRepository(SsiMeta) private readonly metas: Repository<SsiMeta>,
  ) {}

  private async getMeta(metrica: SsiMetrica): Promise<{ valor: number; unidade: SsiUnidade }> {
    const meta = await this.metas.findOne({ where: { metrica } });
    if (!meta) throw new BadRequestException(`Meta não configurada para ${metrica}`);
    return { valor: Number(meta.valorMeta), unidade: meta.unidade };
  }

  private calcularStatus(valor: number, meta: number): SsiStatus {
    if (valor > meta) return SsiStatus.OTIMO;
    if (valor === meta) return SsiStatus.BOM;
    return SsiStatus.RUIM;
  }

  async listar(q: QuerySsiDto) {
    const where: FindOptionsWhere<SsiResultado> = {};
    if (q.usuarioId) where.usuarioId = q.usuarioId;
    if (q.metrica) where.metrica = q.metrica as any;
    if (q.dataInicio && q.dataFim) where.dataReferencia = Between(q.dataInicio, q.dataFim);
    const take = q.quantidade ?? 20;
    const skip = ((q.pagina ?? 1) - 1) * take;
    const [items, total] = await this.resultados.findAndCount({
      where,
      order: { dataReferencia: 'DESC', metrica: 'ASC' },
      take,
      skip,
    });
    return { total, pagina: q.pagina ?? 1, quantidade: take, items };
  }

  /** POST batch (compat) */
  async criarBatch(dto: PostSsiBatchDto) {
    const out: SsiResultado[] = [];
    for (const item of dto.itens) {
      const meta = await this.getMeta(item.metrica);
      const status = this.calcularStatus(item.valor, meta.valor);
      const entity = this.resultados.create({
        usuarioId: dto.usuarioId ?? null,
        metrica: item.metrica,
        dataReferencia: dto.dataReferencia,
        valor: String(item.valor),
        unidade: meta.unidade,
        status,
        metaAplicada: String(meta.valor),
      });
      out.push(entity);
    }
    await this.resultados
      .createQueryBuilder()
      .insert()
      .into(SsiResultado)
      .values(out)
      .orUpdate(
        ['valor', 'status', 'meta_aplicada', 'atualizado_em'],
        ['usuario_id', 'metrica', 'data_referencia'],
        { skipUpdateIfNoValuesChanged: true },
      )
      .execute();
    return { sucesso: true };
  }

  /** PUT 1 item (upsert pela unique) */
  async upsertUm(dto: PutSsiDto) {
    const meta = await this.getMeta(dto.metrica);
    const status = this.calcularStatus(dto.valor, meta.valor);
    const entity = this.resultados.create({
      usuarioId: dto.usuarioId ?? null,
      metrica: dto.metrica,
      dataReferencia: dto.dataReferencia,
      valor: String(dto.valor),
      unidade: meta.unidade,
      status,
      metaAplicada: String(meta.valor),
    });
    await this.resultados
      .createQueryBuilder()
      .insert()
      .into(SsiResultado)
      .values(entity)
      .orUpdate(
        ['valor', 'status', 'meta_aplicada', 'atualizado_em'],
        ['usuario_id', 'metrica', 'data_referencia'],
        { skipUpdateIfNoValuesChanged: true },
      )
      .execute();
    return { sucesso: true };
  }

  /** PUT batch (upsert em lote) */
  async upsertBatch(dto: PutSsiBatchDto) {
    const out: SsiResultado[] = [];
    for (const item of dto.itens) {
      const meta = await this.getMeta(item.metrica);
      const status = this.calcularStatus(item.valor, meta.valor);
      const entity = this.resultados.create({
        usuarioId: dto.usuarioId ?? null,
        metrica: item.metrica,
        dataReferencia: dto.dataReferencia,
        valor: String(item.valor),
        unidade: meta.unidade,
        status,
        metaAplicada: String(meta.valor),
      });
      out.push(entity);
    }
    await this.resultados
      .createQueryBuilder()
      .insert()
      .into(SsiResultado)
      .values(out)
      .orUpdate(
        ['valor', 'status', 'meta_aplicada', 'atualizado_em'],
        ['usuario_id', 'metrica', 'data_referencia'],
        { skipUpdateIfNoValuesChanged: true },
      )
      .execute();
    return { sucesso: true };
  }

  async listarMetas() {
    return this.metas.find({ order: { metrica: 'ASC' } });
  }

  /** Upsert de uma meta. Se recalc=true, recalc status/meta_aplicada/unidade em ssi_resultados dessa métrica */
  async upsertMeta(dto: PutSsiMetaDto, recalc = false) {
    await this.metas
      .createQueryBuilder()
      .insert()
      .into(SsiMeta)
      .values({
        metrica: dto.metrica,
        valorMeta: String(dto.valorMeta),
        unidade: dto.unidade,
      })
      .orUpdate(['valorMeta', 'unidade', 'atualizado_em'], ['metrica'], {
        skipUpdateIfNoValuesChanged: true,
      })
      .execute();

    if (recalc) {
      await this.recalcularResultadosPorMetrica(dto.metrica, dto.valorMeta, dto.unidade);
    }

    return { sucesso: true };
  }

  /** Upsert de várias metas. Se recalc=true, aplica recálculo para cada métrica atualizada */
  async upsertMetasBatch(dto: PutSsiMetasBatchDto, recalc = false) {
    if (!dto.itens?.length) return { sucesso: true };

    await this.metas
      .createQueryBuilder()
      .insert()
      .into(SsiMeta)
      .values(
        dto.itens.map((i) => ({
          metrica: i.metrica,
          valorMeta: String(i.valorMeta),
          unidade: i.unidade,
        })),
      )
      .orUpdate(['valorMeta', 'unidade', 'atualizado_em'], ['metrica'], {
        skipUpdateIfNoValuesChanged: true,
      })
      .execute();

    if (recalc) {
      for (const i of dto.itens) {
        await this.recalcularResultadosPorMetrica(i.metrica, i.valorMeta, i.unidade);
      }
    }

    return { sucesso: true };
  }

  /** Recalcula status/meta_aplicada/unidade para TODOS os resultados de uma métrica */
  private async recalcularResultadosPorMetrica(
    metrica: SsiMetrica,
    valorMeta: number,
    unidade: SsiUnidade,
  ) {
    await this.resultados.query(
      `
      UPDATE "ssi_resultados"
      SET
        "status" = CASE
          WHEN "valor"::numeric > $1 THEN 'OTIMO'::ssi_status
          WHEN "valor"::numeric = $1 THEN 'BOM'::ssi_status
          ELSE 'RUIM'::ssi_status
        END,
        "meta_aplicada" = $1,
        "unidade" = $2::ssi_unidade,
        "atualizado_em" = now()
      WHERE "metrica" = $3::ssi_metrica
      `,
      [valorMeta, unidade, metrica],
    );
  }
}
