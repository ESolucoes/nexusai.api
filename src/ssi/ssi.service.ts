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

/** Normaliza qualquer 'YYYY-MM-DD' para a segunda-feira dessa semana (ISO) */
function normalizeToMonday(dateStr: string): string {
  if (!dateStr) throw new BadRequestException('dataReferencia inválida');
  const d = new Date(dateStr + 'T00:00:00Z');
  if (isNaN(d.getTime())) throw new BadRequestException('dataReferencia inválida');
  const day = d.getUTCDay(); // 0=dom,1=seg,...6=sab
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diffToMonday);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

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

  /** Lista com paginação; SEMPRE escopado por usuarioId */
  async listar(q: QuerySsiDto & { usuarioId: string }) {
    const where: FindOptionsWhere<SsiResultado> = { usuarioId: q.usuarioId };
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

  /** Lista todas as datas de referência (segundas) do usuário */
  async listarSemanas(usuarioId: string) {
    const rows = await this.resultados
      .createQueryBuilder('r')
      .select('r.dataReferencia', 'dataReferencia')
      .addSelect('COUNT(*)', 'total')
      .where('r.usuarioId = :usuarioId', { usuarioId })
      .groupBy('r.dataReferencia')
      .orderBy('r.dataReferencia', 'DESC')
      .getRawMany<{ datareferencia: string; total: string }>();

    return rows.map((r) => ({
      dataReferencia: (r as any).dataReferencia ?? (r as any).datareferencia,
      totalMetricas: Number((r as any).total),
    }));
  }

  /** Retorna todos os registros de UMA semana (normalizada) do usuário */
  async obterPorSemana(usuarioId: string, data: string) {
    const semana = normalizeToMonday(data);
    const itens = await this.resultados.find({
      where: { usuarioId, dataReferencia: semana },
      order: { metrica: 'ASC' },
    });
    return { semana, itens };
  }

  /** ===================== NOVO: Tabela de evolução por semanas (linhas KPIs, colunas semanas) ===================== */
  async listarEvolucaoSemanas(
    usuarioId: string,
    { dataInicio, dataFim }: { dataInicio?: string; dataFim?: string },
  ) {
    const whereDate = dataInicio && dataFim ? `AND r.data_referencia BETWEEN $2 AND $3` : ``;

    // 1) semanas distintas (segunda-feira) em ordem crescente
    const paramsSemanas: any[] = [usuarioId];
    if (whereDate) paramsSemanas.push(dataInicio, dataFim);

    const semanas = await this.resultados.query(
      `
      SELECT DISTINCT r.data_referencia AS semana
      FROM ssi_resultados r
      WHERE r.usuario_id = $1
      ${whereDate}
      ORDER BY semana ASC
      `,
      paramsSemanas,
    );

    // 2) valores por (métrica x semana), SEM status/meta_aplicada (não usamos metas aqui)
    const params: any[] = [usuarioId];
    if (whereDate) params.push(dataInicio, dataFim);

    const rows = await this.resultados.query(
      `
      SELECT 
        r.metrica,
        r.data_referencia AS semana,
        r.valor::numeric AS valor,
        r.unidade
      FROM ssi_resultados r
      WHERE r.usuario_id = $1
      ${whereDate}
      ORDER BY r.metrica ASC, r.data_referencia ASC
      `,
      params,
    );

    const semanasArr = semanas.map((s: any) => s.semana);
    const map: Record<
      string,
      { metrica: string; unidade: SsiUnidade; valores: Record<string, number> }
    > = {};

    for (const r of rows) {
      const key = r.metrica as string;
      if (!map[key]) {
        map[key] = { metrica: r.metrica, unidade: r.unidade, valores: {} };
      }
      map[key].valores[r.semana] = Number(r.valor);
    }

    const itens = Object.values(map).sort((a, b) => a.metrica.localeCompare(b.metrica));
    return { semanas: semanasArr, itens };
  }

  /** POST batch — normaliza a semana e upserta por (usuario, metrica, semana) */
  async criarBatch(dto: PostSsiBatchDto & { usuarioId: string }) {
    const semana = normalizeToMonday(dto.dataReferencia);
    const out: SsiResultado[] = [];
    for (const item of dto.itens) {
      const meta = await this.getMeta(item.metrica);
      const status = this.calcularStatus(item.valor, meta.valor);
      out.push(
        this.resultados.create({
          usuarioId: dto.usuarioId,
          metrica: item.metrica,
          dataReferencia: semana,
          valor: String(item.valor),
          unidade: meta.unidade,
          status,
          metaAplicada: String(meta.valor),
        }),
      );
    }
    await this.resultados
      .createQueryBuilder()
      .insert()
      .into(SsiResultado)
      .values(out)
      .orUpdate(
        ['valor', 'status', 'meta_aplicada', 'atualizado_em', 'unidade'],
        ['usuario_id', 'metrica', 'data_referencia'],
        { skipUpdateIfNoValuesChanged: true },
      )
      .execute();
    return { sucesso: true, dataReferencia: semana };
  }

  /** PUT 1 item — normaliza a semana e upserta */
  async upsertUm(dto: PutSsiDto & { usuarioId: string }) {
    const semana = normalizeToMonday(dto.dataReferencia);
    const meta = await this.getMeta(dto.metrica);
    const status = this.calcularStatus(dto.valor, meta.valor);
    const entity = this.resultados.create({
      usuarioId: dto.usuarioId,
      metrica: dto.metrica,
      dataReferencia: semana,
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
        ['valor', 'status', 'meta_aplicada', 'atualizado_em', 'unidade'],
        ['usuario_id', 'metrica', 'data_referencia'],
        { skipUpdateIfNoValuesChanged: true },
      )
      .execute();
    return { sucesso: true, dataReferencia: semana };
  }

  /** PUT batch — normaliza a semana e upserta */
  async upsertBatch(dto: PutSsiBatchDto & { usuarioId: string }) {
    const semana = normalizeToMonday(dto.dataReferencia);
    const out: SsiResultado[] = [];
    for (const item of dto.itens) {
      const meta = await this.getMeta(item.metrica);
      const status = this.calcularStatus(item.valor, meta.valor);
      out.push(
        this.resultados.create({
          usuarioId: dto.usuarioId,
          metrica: item.metrica,
          dataReferencia: semana,
          valor: String(item.valor),
          unidade: meta.unidade,
          status,
          metaAplicada: String(meta.valor),
        }),
      );
    }
    await this.resultados
      .createQueryBuilder()
      .insert()
      .into(SsiResultado)
      .values(out)
      .orUpdate(
        ['valor', 'status', 'meta_aplicada', 'atualizado_em', 'unidade'],
        ['usuario_id', 'metrica', 'data_referencia'],
        { skipUpdateIfNoValuesChanged: true },
      )
      .execute();
    return { sucesso: true, dataReferencia: semana };
  }

  async listarMetas() {
    return this.metas.find({ order: { metrica: 'ASC' } });
  }

  /** Upsert de meta. Se recalc=true, recalcula históricos da métrica */
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

  /** Upsert de metas (batch). Se recalc=true, recalcula cada métrica atualizada */
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
