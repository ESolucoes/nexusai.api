import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CronogramaSemana } from './cronograma-semana.entity';
import { CronogramaRotina } from './cronograma-rotina.entity';
import { UpdateCronogramaSemanaDto } from './dto/update-semana.dto';
import { UpsertRotinaDto } from './dto/upsert-rotina.dto';

@Injectable()
export class MentoradoCronogramaService {
  constructor(
    @InjectRepository(CronogramaSemana)
    private readonly semanasRepo: Repository<CronogramaSemana>,
    @InjectRepository(CronogramaRotina)
    private readonly rotinaRepo: Repository<CronogramaRotina>,
  ) {}

  /** Seed padrão (template global = usuarioId null) */
  async seedBase(usuarioId?: string) {
    // se já existe qualquer item do usuário (ou template global), não duplica
    const whereCount = usuarioId ? { usuarioId } : { usuarioId: IsNull() };
    const countUser = await this.semanasRepo.count({ where: whereCount });
    if (countUser > 0) return { ok: true, seeded: false };

    const rows: Array<Partial<CronogramaSemana>> = [];

    // Semana 1 — Onboarding
    const semana1 = 'Semana 1';
    const meta1 = 'Onboarding e Preparação de Base';
    const tarefas1 = [
      'Participar da reunião de Onboarding',
      'Entrar nos grupos de WhatsApp (avisos e engajamento) e LinkedIn',
      'Assistir Módulo 1 – Comece por Aqui',
      'Assistir Aula 1 — Introdução à metodologia',
      'Assistir Aula 2 — Planner e escopo',
      'Assistir Módulo 2 – Eremita Profissional',
      'Assistir Aula 3 — Definindo seu objetivo profissional',
      'Assistir Aula 11 — Trajetória profissional',
      'Enviar para o time: Currículo atual',
      'Enviar para o time: Trajetória profissional (texto ou vídeo)',
      'Enviar para o time: Objetivo profissional (Aula 3)',
      'Enviar para o time: 20 vagas alinhadas ao perfil (Aulas 5 e 6)',
      'Enviar para o time: Foto e capa para LinkedIn',
      'Enviar para o time: Planilha de Indicadores preenchida',
      'Validar informações para confecção do CAC',
    ];
    tarefas1.forEach((t, i) =>
      rows.push({ usuarioId: usuarioId ?? null, semana: semana1, meta: meta1, tarefa: t, ordem: i }),
    );

    // Semana 2 a 4 — LinkedIn/Visibilidade
    const semana2 = 'Semana 2 a 4';
    const meta2 = 'Movimentação no LinkedIn e Ações de Visibilidade';
    const tarefas2 = [
      'Assistir Módulo 3 – Colecionador de Candidaturas',
      'Assistir Aula 5 — Mapeando vagas no LinkedIn',
      'Assistir Aula 6 — Planilha de controle de candidaturas',
      'Assistir Aula 7 — Estratégias de candidatura ativa',
      'Assistir Aula 8 — Otimizando buscas no LinkedIn',
      'Publicar 2 a 3 posts por semana (conteúdo, cases, insights)',
      'Interagir diariamente com 10 a 15 posts relevantes no LinkedIn',
      'Conectar-se com 30 a 50 profissionais estratégicos por semana',
      'Aplicar para 5 a 10 vagas por semana',
      'Participar de Hotseats semanais',
      'Participar do Open Room (quinta-feira, 18h)',
      'Atualizar Planilha de Indicadores toda sexta-feira',
    ];
    tarefas2.forEach((t, i) =>
      rows.push({ usuarioId: usuarioId ?? null, semana: semana2, meta: meta2, tarefa: t, ordem: i }),
    );

    // Semana 5 a 6 — Entrevistas
    const semana3 = 'Semana 5 a 6';
    const meta3 = 'Preparação para Entrevistas';
    const tarefas3 = [
      'Assistir Módulo 4 – Mestre das Entrevistas',
      'Assistir Aula 1 — Preparando seu pitch pessoal',
      'Assistir Aula 2 — Como criar storytelling de impacto',
      'Assistir Aula 3 — Estruturando cases de sucesso',
      'Assistir Aula 4 — Simulação de entrevista',
      'Criar 3 a 5 cases de sucesso',
      'Ajustar discurso para diferentes tipos de vaga',
      'Participar da simulação de entrevista com feedback',
      'Continuar movimentação do LinkedIn (postagens, interações e conexões)',
    ];
    tarefas3.forEach((t, i) =>
      rows.push({ usuarioId: usuarioId ?? null, semana: semana3, meta: meta3, tarefa: t, ordem: i }),
    );

    // Semana 7 a 8 — Networking/Blindagem
    const semana4 = 'Semana 7 a 8';
    const meta4 = 'Networking e Blindagem da Carreira';
    const tarefas4 = [
      'Assistir Módulo 5 – Carreira Blindada',
      'Assistir Aula 1 — Construindo sua rede de networking',
      'Assistir Aula 2 — Estratégias para manter relacionamentos profissionais',
      'Assistir Aula 3 — Como se manter ativo e relevante no mercado',
      'Criar planilha de contatos estratégicos',
      'Interagir com sua rede semanalmente',
      'Participar de eventos e grupos de interesse',
      'Manter rotina de movimentação no LinkedIn e candidaturas',
    ];
    tarefas4.forEach((t, i) =>
      rows.push({ usuarioId: usuarioId ?? null, semana: semana4, meta: meta4, tarefa: t, ordem: i }),
    );

    await this.semanasRepo.save(rows);
    // Rotina fixa
    await this.seedRotina(usuarioId);

    return { ok: true, seeded: true };
  }

  async seedRotina(usuarioId?: string) {
    const whereCount = usuarioId ? { usuarioId } : { usuarioId: IsNull() };
    const count = await this.rotinaRepo.count({ where: whereCount });
    if (count > 0) return;

    const itens: Array<Partial<CronogramaRotina>> = [
      { dia: 'Segunda', titulo: 'Aplicar para vagas + revisar indicadores', ordem: 1 },
      { dia: 'Terça',   titulo: 'Criar/publicar conteúdo no LinkedIn', ordem: 2 },
      { dia: 'Quarta',  titulo: 'Networking ativo (novas conexões, interações)', ordem: 3 },
      { dia: 'Quinta',  titulo: 'Participar do Open Room (18h)', ordem: 4 },
      { dia: 'Sexta',   titulo: 'Revisão da semana + atualização de planilhas', ordem: 5 },
    ].map((i) => ({ ...i, usuarioId: usuarioId ?? null, grupo: 'FIXA', ativo: true }));

    await this.rotinaRepo.save(itens);
  }

  // ===== Semanas =====
  async listSemanas(usuarioId?: string) {
    const whereUser = usuarioId ? { usuarioId } : { usuarioId: IsNull() };
    const itens = await this.semanasRepo.find({
      where: whereUser,
      order: { semana: 'ASC', ordem: 'ASC' },
    });

    // Agrupa por semana
    const grouped: Record<string, { meta: string; tarefas: any[] }> = {};
    for (const it of itens) {
      grouped[it.semana] = grouped[it.semana] || { meta: it.meta, tarefas: [] };
      grouped[it.semana].tarefas.push({
        id: it.id,
        tarefa: it.tarefa,
        ordem: it.ordem,
        concluido: it.concluido,
      });
    }
    return grouped;
  }

  async updateSemanaItem(id: string, dto: UpdateCronogramaSemanaDto) {
    await this.semanasRepo.update({ id }, dto);
    return this.semanasRepo.findOneByOrFail({ id });
  }

  // ===== Rotina fixa =====
  async listRotina(usuarioId?: string) {
    const whereUser = usuarioId ? { usuarioId } : { usuarioId: IsNull() };
    return this.rotinaRepo.find({
      where: { ...whereUser, ativo: true },
      order: { ordem: 'ASC' },
    });
  }

  async upsertRotina(usuarioId: string | undefined, dto: UpsertRotinaDto) {
    const rows = dto.itens.map((i, idx) =>
      this.rotinaRepo.create({
        usuarioId: usuarioId ?? null,
        grupo: i.grupo ?? 'FIXA',
        dia: i.dia,
        titulo: i.titulo,
        ordem: i.ordem ?? idx,
        ativo: i.ativo ?? true,
      }),
    );
    // limpa e regrava (grupo FIXA)
    const whereDelete = usuarioId ? { usuarioId, grupo: 'FIXA' } : { usuarioId: IsNull(), grupo: 'FIXA' };
    await this.rotinaRepo.delete(whereDelete as any);
    await this.rotinaRepo.save(rows);
    return { ok: true };
  }
}
