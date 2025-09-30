// src/mentorado-ssi/mentorado-ssi.service.ts
import { Injectable } from '@nestjs/common';
import { MssIndicador } from './enums/mss-indicador.enum';
import { MssStatus } from './enums/mss-status.enum';

type Faixa = { otimo: (v: number) => boolean; bom: (v: number) => boolean; ruim: (v: number) => boolean };
type Definicao = {
  indicador: MssIndicador;
  nome: string;
  meta: string; // texto exibível (ex.: "> 65", "1%")
  faixa: Faixa;
  positivo: string[];
  negativo: string[];
  plano: string[];
};

type SaidaClassificada = {
  indicador: MssIndicador;
  nome: string;
  meta: string;
  semanas: number[];
  statusSemanal: MssStatus[];
  textos: {
    positivo: string[];
    negativo: string[];
    planoDeAcao: string[];
  };
};

type SaidaTabelaVazia = Omit<SaidaClassificada, 'statusSemanal'>;

// Helpers de faixas (regras-padrão)
const gte = (n: number) => (v: number) => v >= n;
const between = (a: number, b: number) => (v: number) => v >= a && v <= b;
const lt = (n: number) => (v: number) => v < n;

// Algumas metas numéricas canonizadas (baseado no que combinamos)
const DEF: Record<MssIndicador, Definicao> = {
  // SSI/Pilares
  [MssIndicador.SSI_SETOR]: {
    indicador: MssIndicador.SSI_SETOR,
    nome: 'SSI no seu Setor',
    meta: '>= 1%',
    faixa: { otimo: gte(1), bom: lt(1), ruim: lt(1) }, // >=1 OTIMO; <1 RUIM
    positivo: [
      'Aumento de credibilidade e presença no setor.',
      'Maior probabilidade de ser indicado para oportunidades.',
    ],
    negativo: [
      'Visibilidade reduzida no setor.',
      'Dificuldade em ser percebido como especialista.',
    ],
    plano: [
      'Compartilhar conteúdos relevantes para o setor.',
      'Interagir com profissionais de destaque e grupos.',
    ],
  },
  [MssIndicador.SSI_REDE]: {
    indicador: MssIndicador.SSI_REDE,
    nome: 'SSI na sua Rede',
    meta: '>= 1%',
    faixa: { otimo: gte(1), bom: lt(1), ruim: lt(1) }, // >=1 OTIMO; <1 RUIM
    positivo: [
      'Aumento do engajamento com a rede.',
      'Visibilidade ampliada, facilitando contatos com recrutadores.',
    ],
    negativo: [
      'Menor interação com a rede.',
      'Perfil menos ativo pode ser interpretado como falta de interesse.',
    ],
    plano: [
      'Interagir mais frequentemente com conexões através de comentários e mensagens.',
      'Compartilhar atualizações profissionais.',
    ],
  },
  [MssIndicador.SSI_TOTAL]: {
    indicador: MssIndicador.SSI_TOTAL,
    nome: 'Social Selling Index',
    meta: '> 65',
    faixa: { otimo: gte(65), bom: between(50, 64), ruim: lt(50) },
    positivo: [
      'Fortalece a presença digital e atrai mais visualizações.',
      'Atração de mais recrutadores.',
    ],
    negativo: [
      'Dificuldade em ser identificado como profissional relevante.',
      'Menor destaque em buscas.',
    ],
    plano: [
      'Atualizar o perfil com as informações do mapeamento.',
      'Participar de discussões em grupos e compartilhar artigos.',
    ],
  },
  [MssIndicador.PILAR_MARCA]: {
    indicador: MssIndicador.PILAR_MARCA,
    nome: 'Estabelecer sua Marca Profissional',
    meta: '> 18',
    faixa: { otimo: gte(18), bom: between(15, 17), ruim: lt(15) },
    positivo: [
      'Posicionamento claro e consistente.',
      'Facilita o networking e gera confiança.',
    ],
    negativo: [
      'Dificuldade em transmitir habilidades e diferenciais.',
      'Falta de reconhecimento como referência.',
    ],
    plano: [
      'Criar e compartilhar conteúdo original que demonstre expertise.',
      'Personalizar o perfil com informações relevantes para as vagas.',
    ],
  },
  [MssIndicador.PILAR_PESSOAS_CERTAS]: {
    indicador: MssIndicador.PILAR_PESSOAS_CERTAS,
    nome: 'Localizar as Pessoas Certas',
    meta: '> 15',
    faixa: { otimo: gte(15), bom: between(12, 14), ruim: lt(12) },
    positivo: [
      'Acesso direto a influenciadores e recrutadores.',
      'Maior chance de receber feedbacks construtivos.',
    ],
    negativo: [
      'Desperdício de tempo com contatos irrelevantes.',
      'Dificuldade em alcançar influenciadores.',
    ],
    plano: [
      'Pesquisar e se conectar com decisores e influenciadores do setor.',
      'Utilizar filtros avançados para encontrar contatos relevantes.',
    ],
  },
  [MssIndicador.PILAR_INSIGHTS]: {
    indicador: MssIndicador.PILAR_INSIGHTS,
    nome: 'Interagir oferecendo Insights',
    meta: '> 15',
    faixa: { otimo: gte(15), bom: between(12, 14), ruim: lt(12) },
    positivo: [
      'Melhoria do relacionamento com a rede.',
      'Aumento de interações e compartilhamentos.',
    ],
    negativo: [
      'Falta de engajamento com a rede.',
      'Perda de oportunidades para se destacar.',
    ],
    plano: [
      'Compartilhar insights e comentários em posts de profissionais da área.',
      'Publicar conteúdo relevante e de valor para a rede.',
    ],
  },
  [MssIndicador.PILAR_RELACIONAMENTOS]: {
    indicador: MssIndicador.PILAR_RELACIONAMENTOS,
    nome: 'Cultivar Relacionamentos',
    meta: '> 15',
    faixa: { otimo: gte(15), bom: between(12, 14), ruim: lt(12) },
    positivo: [
      'Rede de apoio sólida para indicações.',
      'Facilidade para obter referências e recomendações.',
    ],
    negativo: [
      'Relações superficiais com contatos.',
      'Dificuldade em manter comunicação aberta.',
    ],
    plano: [
      'Manter contato frequente com conexões estratégicas.',
      'Enviar mensagens de follow-up para contatos importantes.',
    ],
  },

  // Alcance/Perfil
  [MssIndicador.IMPRESSOES_PUBLICACAO]: {
    indicador: MssIndicador.IMPRESSOES_PUBLICACAO,
    nome: 'Impressões da Publicação',
    meta: '> 1000',
    faixa: { otimo: gte(1000), bom: between(800, 999), ruim: lt(800) },
    positivo: [
      'Maior alcance, gerando mais visualizações.',
      'Aumento do engajamento e atração de seguidores.',
    ],
    negativo: [
      'Menor visibilidade das publicações.',
      'Reduzida interação e engajamento.',
    ],
    plano: [
      'Aumentar a frequência de publicações semanais.',
      'Marcar pessoas relevantes para ampliar o alcance.',
    ],
  },
  [MssIndicador.VISUALIZACOES_PERFIL]: {
    indicador: MssIndicador.VISUALIZACOES_PERFIL,
    nome: 'Visualizações do Perfil',
    meta: '> 100',
    faixa: { otimo: gte(100), bom: between(70, 99), ruim: lt(70) },
    positivo: [
      'Indica que o perfil está otimizado e atraindo interesse.',
      'Aumento de convites para entrevistas.',
    ],
    negativo: [
      'Poucas visualizações indicam baixa atração.',
      'Redução no número de contatos recebidos.',
    ],
    plano: [
      'Otimizar o perfil com base nas vagas e oportunidades desejadas.',
      'Interagir mais com a rede para aumentar a visibilidade.',
    ],
  },
  [MssIndicador.OCORRENCIAS_PESQUISA]: {
    indicador: MssIndicador.OCORRENCIAS_PESQUISA,
    nome: 'Ocorrências em Resultado de Pesquisa',
    meta: '> 100',
    faixa: { otimo: gte(100), bom: between(70, 99), ruim: lt(70) },
    positivo: [
      'Maior exposição nas buscas.',
      'Aumento da percepção de perfil ativo.',
    ],
    negativo: [
      'Pouca visibilidade em pesquisas.',
      'Reduzida chance de ser encontrado.',
    ],
    plano: [
      'Atualizar o perfil com informações das vagas e habilidades específicas.',
      'Participar de discussões em grupos de interesse.',
    ],
  },
  [MssIndicador.CARGOS_ENCONTRARAM_PERFIL]: {
    indicador: MssIndicador.CARGOS_ENCONTRARAM_PERFIL,
    nome: 'Cargos para os quais encontraram seu perfil',
    meta: 'Decisor | RHs',
    // Binário: 1 (alinhado) = OTIMO; 0 = RUIM
    faixa: { otimo: gte(1), bom: lt(1), ruim: lt(1) },
    positivo: [
      'Alinhamento entre habilidades e cargos desejados.',
      'Aumento na taxa de visualizações por posições de interesse.',
    ],
    negativo: [
      'Desalinhamento do perfil com oportunidades.',
      'Menor taxa de convites para vagas desejadas.',
    ],
    plano: [
      'Ajustar o perfil para refletir as qualificações desejadas.',
      'Adicionar detalhes das realizações profissionais e objetivos.',
    ],
  },
  [MssIndicador.TAXA_RECRUTADORES]: {
    indicador: MssIndicador.TAXA_RECRUTADORES,
    nome: 'Taxa de Recrutadores que viram seu perfil (%)',
    meta: '> 5%',
    faixa: { otimo: gte(5), bom: between(3, 4), ruim: lt(3) },
    positivo: [
      'Indicação de que o perfil é atrativo para recrutadores.',
      'Maior engajamento com headhunters.',
    ],
    negativo: [
      'Perfil despercebido por recrutadores.',
      'Menor interação com headhunters.',
    ],
    plano: [
      'Interagir com recrutadores e participar de eventos online.',
      'Solicitar recomendações com pessoas com quem trabalhou.',
    ],
  },

  // Candidaturas
  [MssIndicador.CANDIDATURAS_SIMPLIFICADAS]: {
    indicador: MssIndicador.CANDIDATURAS_SIMPLIFICADAS,
    nome: 'Quantidade de Candidaturas Simplificadas',
    meta: '10',
    faixa: { otimo: gte(10), bom: between(7, 9), ruim: lt(7) },
    positivo: [
      'Aumento da presença nas candidaturas e maior visibilidade.',
      'Maior possibilidade de ser chamado para entrevistas.',
    ],
    negativo: [
      'Reduzida chance de ser considerado para oportunidades.',
      'Menor agilidade no processo de candidatura.',
    ],
    plano: [
      'Utilizar a funcionalidade de candidatura simplificada em vagas compatíveis.',
      'Personalizar o perfil para as oportunidades desejadas.',
    ],
  },
  [MssIndicador.CANDIDATURAS_VISUALIZADAS]: {
    indicador: MssIndicador.CANDIDATURAS_VISUALIZADAS,
    nome: 'Quantidade de Candidaturas Visualizadas',
    meta: '3',
    faixa: { otimo: gte(3), bom: between(2, 2), ruim: lt(2) },
    positivo: [
      'Indicação de que os recrutadores estão considerando o perfil.',
      'Maior chance de receber retorno e avançar no processo.',
    ],
    negativo: [
      'Falta de resposta dos recrutadores.',
      'Dificuldade de medir a eficácia do perfil.',
    ],
    plano: [
      'Acompanhar o status das candidaturas e realizar follow-up.',
      'Ajustar o perfil com palavras-chave específicas para atrair recrutadores.',
    ],
  },
  [MssIndicador.CURRICULOS_BAIXADOS]: {
    indicador: MssIndicador.CURRICULOS_BAIXADOS,
    nome: 'Quantidade de Currículos Baixados',
    meta: '3',
    faixa: { otimo: gte(3), bom: between(2, 2), ruim: lt(2) },
    positivo: [
      'Aumento de recrutadores interessados no perfil.',
      'Demonstra interesse ativo das empresas.',
    ],
    negativo: [
      'Reduzido interesse dos recrutadores.',
      'Dificuldade em gerar contatos e feedbacks.',
    ],
    plano: [
      'Adicionar um resumo atrativo e resultados mensuráveis no currículo.',
      'Manter o CAC atualizado e alinhado com o perfil.',
    ],
  },
  [MssIndicador.CONTATOS_RH]: {
    indicador: MssIndicador.CONTATOS_RH,
    nome: 'Quantidade de Contatos de RHs na semana',
    meta: '2',
    faixa: { otimo: gte(2), bom: between(1, 1), ruim: lt(1) },
    positivo: [
      'Expansão do networking com profissionais de recrutamento.',
      'Maior possibilidade de recomendações.',
    ],
    negativo: [
      'Poucas interações com RHs podem indicar baixa atratividade do perfil.',
      'Dificuldade em expandir o networking.',
    ],
    plano: [
      'Enviar mensagens personalizadas para contatos de RH e acompanhar feedbacks.',
      'Agendar reuniões para discutir oportunidades e feedbacks.',
    ],
  },

  // Conteúdo/Interações
  [MssIndicador.PUBLICACOES_SEMANA]: {
    indicador: MssIndicador.PUBLICACOES_SEMANA,
    nome: 'Quantidade de Publicações na Semana',
    meta: '3',
    faixa: { otimo: gte(3), bom: between(2, 2), ruim: lt(2) },
    positivo: [
      'Aumento da exposição e engajamento com a rede.',
      'Atração de novos contatos e maior interação.',
    ],
    negativo: [
      'Menor visibilidade e engajamento na rede.',
      'Falta de presença ativa e proatividade.',
    ],
    plano: [
      'Definir uma agenda para postagens regulares.',
      'Participar activamente em discussões e comentar em posts de conexões.',
    ],
  },
  [MssIndicador.INTERACOES_COMENTARIOS]: {
    indicador: MssIndicador.INTERACOES_COMENTARIOS,
    nome: 'Quantidade de Interações via comentários',
    meta: '10',
    faixa: { otimo: gte(10), bom: between(7, 9), ruim: lt(7) },
    positivo: [
      'Aumento das interações e construção de relacionamentos.',
      'Demonstração de interesse e engajamento.',
    ],
    negativo: [
      'Redução nas conexões e no engajamento.',
      'Perfil menos ativo e menos notado.',
    ],
    plano: [
      'Comentar em postagens de influenciadores e conexões.',
      'Fazer perguntas e iniciar discussões nos comentários.',
    ],
  },

  // Networking
  [MssIndicador.PEDIDOS_CONEXAO_HEADHUNTERS]: {
    indicador: MssIndicador.PEDIDOS_CONEXAO_HEADHUNTERS,
    nome: 'Quantidade de Pedidos de Conexão com Headhunters',
    meta: '50',
    faixa: { otimo: gte(50), bom: between(35, 49), ruim: lt(35) },
    positivo: [
      'Acesso direto a Headhunters e RHs que possuem vagas abertas.',
      'Aumento de visibilidade e oportunidades com Headhunters e RHs.',
    ],
    negativo: [
      'Dificuldade de acesso a Headhunters e RHs estratégicos.',
      'Menor oportuniade de participar de processos seletivos.',
    ],
    plano: [
      'Enviar solicitações de conexão com uma mensagem personalizada.',
      'Participar de grupos onde headhunters estão ativos.',
    ],
  },
  [MssIndicador.PEDIDOS_CONEXAO_DECISORES]: {
    indicador: MssIndicador.PEDIDOS_CONEXAO_DECISORES,
    nome: 'Quantidade de Pedidos de Conexão com Decisores',
    meta: '50',
    faixa: { otimo: gte(50), bom: between(35, 49), ruim: lt(35) },
    positivo: [
      'Acesso direto a decisores, facilitando recomendações.',
      'Aumento de interações com profissionais-chave.',
    ],
    negativo: [
      'Dificuldade de acesso a profissionais estratégicos.',
      'Menor oportunidade de expandir networking.',
    ],
    plano: [
      'Enviar convites personalizados destacando um interesse comum.',
      'Acompanhar postagens e interagir com os decisores.',
    ],
  },
  [MssIndicador.MENSAGENS_RECRUTADORES]: {
    indicador: MssIndicador.MENSAGENS_RECRUTADORES,
    nome: 'Quantidade de Mensagens Enviadas para Recrutadores',
    meta: '10',
    faixa: { otimo: gte(10), bom: between(7, 9), ruim: lt(7) },
    positivo: [
      'Aumento da possibilidade de interagir diretamente com recrutadores.',
      'Facilita o contato inicial.',
    ],
    negativo: [
      'Pouca proatividade em iniciar conversas.',
      'Menor chance de receber respostas ou feedbacks.',
    ],
    plano: [
      'Personalizar as mensagens para recrutadores com base em vagas específicas.',
      'Realizar follow-up e buscar feedbacks.',
    ],
  },
  [MssIndicador.MENSAGENS_NETWORKING]: {
    indicador: MssIndicador.MENSAGENS_NETWORKING,
    nome: 'Quantidade de Mensagens Enviadas para Networking',
    meta: '10',
    faixa: { otimo: gte(10), bom: between(7, 9), ruim: lt(7) },
    positivo: [
      'Construção de um networking mais ativo e robusto.',
      'Maior chance de gerar oportunidades de colaboração.',
    ],
    negativo: [
      'Falta de comunicação prejudica construção de relacionamentos.',
      'Menor percepção de interesse e proatividade.',
    ],
    plano: [
      'Compartilhar atualizações e ideias com a rede.',
      'Enviar mensagens para novos contatos e acompanhar o progresso.',
    ],
  },
  [MssIndicador.CAFES_AGENDADOS]: {
    indicador: MssIndicador.CAFES_AGENDADOS,
    nome: 'Quantidade de Cafés agendados com Networking',
    meta: '2',
    faixa: { otimo: gte(2), bom: between(1, 1), ruim: lt(1) },
    positivo: [
      'Fortalecimento de laços com contatos importantes.',
      'Maior possibilidade de gerar confiança e qualidade das interações.',
    ],
    negativo: [
      'Reduzida oportunidade de construir relacionamentos pessoais.',
      'Menor possibilidade de expandir o networking.',
    ],
    plano: [
      'Propor reuniões presenciais ou virtuais com contatos estratégicos.',
      'Definir um tema ou objetivo para o encontro.',
    ],
  },
  [MssIndicador.CAFES_TOMADOS]: {
    indicador: MssIndicador.CAFES_TOMADOS,
    nome: 'Quantidade de Cafés Tomados na Semana com Networking',
    meta: '1',
    faixa: { otimo: gte(1), bom: lt(1), ruim: lt(1) }, // >=1 OTIMO; 0 RUIM
    positivo: [
      'Fortalece as conexões existentes.',
      'Aumento das oportunidades de colaboração e parceria.',
    ],
    negativo: [
      'Ausência de interação pessoal dificulta relações fortes.',
      'Menor chance de criar laços e gerar oportunidades.',
    ],
    plano: [
      'Agendar encontros presenciais ou virtuais com contatos estratégicos.',
      'Propor temas de discussão que agreguem valor.',
    ],
  },

  // Entrevistas/Ofertas
  [MssIndicador.ENTREVISTAS_REALIZADAS]: {
    indicador: MssIndicador.ENTREVISTAS_REALIZADAS,
    nome: 'Quantidade de Entrevistas Realizadas',
    meta: '2',
    faixa: { otimo: gte(2), bom: between(1, 1), ruim: lt(1) },
    positivo: [
      'Aumento de convites para entrevistas.',
      'Maior chance de conseguir a vaga desejada.',
    ],
    negativo: [
      'Poucas entrevistas podem indicar baixo interesse das empresas.',
      'Menor prática e feedbacks para aprimorar entrevistas.',
    ],
    plano: [
      'Acompanhar feedbacks de entrevistas anteriores.',
      'Ajustar respostas e preparar-se para questões complexas.',
    ],
  },
  [MssIndicador.ENTREVISTAS_FASE_FINAL]: {
    indicador: MssIndicador.ENTREVISTAS_FASE_FINAL,
    nome: 'Quantidade de Entrevistas em Fase Final',
    meta: '1',
    faixa: { otimo: gte(1), bom: lt(1), ruim: lt(1) }, // >=1 OTIMO; 0 RUIM
    positivo: [
      'Indica forte aderência ao perfil procurado pela empresa.',
      'Aumento da possibilidade de receber ofertas.',
    ],
    negativo: [
      'Dificuldade de avançar para fases finais.',
      'Redução nas chances de contratação.',
    ],
    plano: [
      'Solicitar feedback ao final das entrevistas para entender pontos a melhorar.',
      'Reforçar as qualificações e demonstrar interesse.',
    ],
  },
  [MssIndicador.CARTAS_OFERTA]: {
    indicador: MssIndicador.CARTAS_OFERTA,
    nome: 'Quantidade de Cartas Ofertas Recebida',
    meta: '1',
    faixa: { otimo: gte(1), bom: lt(1), ruim: lt(1) }, // >=1 OTIMO; 0 RUIM
    positivo: [
      'Maior chance de conseguir a vaga desejada.',
      'Possibilidade de negociar melhores condições.',
    ],
    negativo: [
      'Poucas ofertas podem indicar que é necessário melhorar o perfil.',
      'Falta de opções restringe negociação.',
    ],
    plano: [
      'Enviar follow-up após entrevistas para reforçar interesse.',
      'Negociar com base em múltiplas ofertas, se disponíveis.',
    ],
  },
};

@Injectable()
export class MentoradoSsiService {
  getDefinicoes() {
    // devolve definicoes completas para o frontend
    return Object.values(DEF).map((d) => ({
      indicador: d.indicador,
      nome: d.nome,
      meta: d.meta,
      textos: {
        positivo: d.positivo,
        negativo: d.negativo,
        planoDeAcao: d.plano,
      },
    }));
  }

  /** Retorna "esqueleto" KPI x 12 semanas vazio com textos */
  getTabelaVazia(): SaidaTabelaVazia[] {
    return Object.values(DEF).map((d) => ({
      indicador: d.indicador,
      nome: d.nome,
      meta: d.meta,
      semanas: new Array(12).fill(null),
      textos: {
        positivo: d.positivo,
        negativo: d.negativo,
        planoDeAcao: d.plano,
      },
    }));
  }

  private classificarUm(indicador: MssIndicador, valor: number): MssStatus {
    const d = DEF[indicador];
    if (!d) return MssStatus.RUIM;
    if (d.faixa.otimo(valor)) return MssStatus.OTIMO;
    if (d.faixa.bom(valor)) return MssStatus.BOM;
    return MssStatus.RUIM;
  }

  /** Recebe itens com 12 semanas => devolve matriz com status + textos */
  classificarBatch(itens: { indicador: MssIndicador; semanas: number[] }[]): SaidaClassificada[] {
    const out: SaidaClassificada[] = [];
    for (const it of itens) {
      const def = DEF[it.indicador];
      if (!def) continue;

      const semanasArr = (it.semanas ?? []).slice(0, 12);
      const statusSemanal = semanasArr.map((v) => this.classificarUm(it.indicador, Number(v ?? 0)));

      out.push({
        indicador: it.indicador,
        nome: def.nome,
        meta: def.meta,
        semanas: semanasArr,
        statusSemanal, // [OTIMO|BOM|RUIM] x12
        textos: {
          positivo: def.positivo,
          negativo: def.negativo,
          planoDeAcao: def.plano,
        },
      });
    }
    return out;
  }
}
