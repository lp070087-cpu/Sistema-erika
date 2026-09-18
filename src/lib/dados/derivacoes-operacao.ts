/**
 * DERIVAÇÕES DA OPERAÇÃO — o que a tela calcula a partir dos fatos.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A LINHA QUE SEPARA ESTE ARQUIVO DO QUE É PROIBIDO                    │
 * │                                                                      │
 * │ Aqui só se faz CONTAGEM, COMPARAÇÃO DE DATA e SOMA DE VALORES        │
 * │ DECLARADOS. Nada aqui pondera, nada atribui nota, nada estima.       │
 * │                                                                      │
 * │ `tarefasAtrasadas` é contagem — fato.                                │
 * │ `indiceDeSaudeDaOperacao` seria nota — invenção.                     │
 * │                                                                      │
 * │ A diferença não é semântica: uma contagem se confere contra a lista  │
 * │ de origem e qualquer pessoa chega ao mesmo número. Uma nota precisa  │
 * │ de peso, e peso é decisão da consultora (ponto 11), não do código.   │
 * │                                                                      │
 * │ Por isso `somaDosTemposDeclarados()` existe e `tempoMedioDaOperacao` │
 * │ não: a primeira soma o que a equipe informou, a segunda precisaria   │
 * │ decidir o que conta como operação.                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Este arquivo é PURO e sem dependência de mock: quando o repositório do
 * Prisma existir, ele vai importar daqui as mesmas funções. É o que garante
 * que a demonstração e a produção concordem sobre onde um número nasce.
 */

import type {
  AcaoPlano,
  Acompanhamento,
  Cliente,
  Consultoria,
  Contrato,
  EstadoDocumentoContrato,
  Ficha,
  ItemAtencao,
  Notificacao,
  ParcelaContrato,
  Processo,
  SituacaoCliente,
  StatusConsultoria,
  StatusContrato,
  StatusParcela,
  StatusTarefa,
  Tarefa,
  TipoAceite,
  TipoAtencao,
  TipoEventoContrato,
} from "./tipos-operacao";
import type { LinhaContrato } from "./repositorio-operacao";

// ---------------------------------------------------------------------------
// Datas — comparação simples, sem fuso e sem biblioteca
// ---------------------------------------------------------------------------

/** O mesmo dia do calendário? Compara ano, mês e dia — ignora a hora. */
export function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Zerado no começo do dia — para comparar "vence hoje" sem a hora atrapalhar. */
export function inicioDoDia(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function terminou(d: Date, agora: Date): boolean {
  return inicioDoDia(d).getTime() < inicioDoDia(agora).getTime();
}

/** Dias inteiros entre duas datas, positivo quando `b` é depois de `a`. */
export function diasEntre(a: Date, b: Date): number {
  const ms = inicioDoDia(b).getTime() - inicioDoDia(a).getTime();
  return Math.round(ms / 86400000);
}

// ---------------------------------------------------------------------------
// Agrupamento de tarefas — as quatro gavetas da tela /tarefas
// ---------------------------------------------------------------------------

export type GavetasTarefas = {
  hoje: Tarefa[];
  atrasadas: Tarefa[];
  proximas: Tarefa[];
  concluidas: Tarefa[];
};

/**
 * Distribui as tarefas nas quatro gavetas da tela.
 *
 * Uma tarefa SEM PRAZO não entra em "hoje" nem em "atrasada" — ela entra em
 * "próximas". Inventar um prazo para ela seria decidir por ela quando o
 * trabalho tem que acontecer.
 */
export function agruparTarefas(tarefas: readonly Tarefa[], agora: Date): GavetasTarefas {
  const abertas = tarefas.filter((t) => t.status !== "CONCLUIDA");

  return {
    hoje: abertas.filter((t) => t.prazo !== null && mesmoDia(t.prazo, agora)),
    atrasadas: abertas.filter((t) => t.prazo !== null && terminou(t.prazo, agora)),
    proximas: abertas.filter(
      (t) => t.prazo === null || (!mesmoDia(t.prazo, agora) && !terminou(t.prazo, agora))
    ),
    concluidas: tarefas.filter((t) => t.status === "CONCLUIDA"),
  };
}

/** Ordena por prazo, com as sem prazo no fim. Estável, para a lista não pular. */
export function ordenarPorPrazo(tarefas: readonly Tarefa[]): Tarefa[] {
  return [...tarefas].sort((a, b) => {
    if (a.prazo === null && b.prazo === null) return 0;
    if (a.prazo === null) return 1;
    if (b.prazo === null) return -1;
    return a.prazo.getTime() - b.prazo.getTime();
  });
}

// ---------------------------------------------------------------------------
// "Precisa da sua atenção"
// ---------------------------------------------------------------------------
// Derivado, nunca armazenado — ver a nota em repositorio-operacao.ts.

const ROTULO_ATENCAO: Record<TipoAtencao, string> = {
  INFORMACAO_AGUARDANDO_CLIENTE: "Informação aguardando o cliente",
  FICHA_AGUARDANDO_DADOS: "Ficha aguardando dados",
  PROCESSO_AGUARDANDO_REVISAO: "Processo aguardando revisão",
  ACOMPANHAMENTO_PENDENTE: "Acompanhamento pendente",
  DIAGNOSTICO_NAO_LIDO: "Diagnóstico não lido",
  CONTRATO_AGUARDANDO_ACEITE: "Contrato aguardando aceite",
  PARCELA_ATRASADA: "Parcela atrasada",
};

export function rotuloAtencao(t: TipoAtencao): string {
  return ROTULO_ATENCAO[t];
}

/**
 * Ordem de gravidade — o que trava o trabalho dela vem primeiro.
 *
 * O critério é um só: quanto tempo o item já está parado esperando alguém.
 * Por isso "aguardando aceite" e "parcela atrasada" entram perto do topo —
 * são os dois casos em que quem espera é ela, com data marcada, e o atraso
 * custa dinheiro ou começa o trabalho.
 */
const ORDEM_ATENCAO: readonly TipoAtencao[] = [
  "ACOMPANHAMENTO_PENDENTE",
  "PARCELA_ATRASADA",
  "INFORMACAO_AGUARDANDO_CLIENTE",
  "CONTRATO_AGUARDANDO_ACEITE",
  "DIAGNOSTICO_NAO_LIDO",
  "FICHA_AGUARDANDO_DADOS",
  "PROCESSO_AGUARDANDO_REVISAO",
];

export type FontesAtencao = {
  acoes: readonly AcaoPlano[];
  fichas: readonly Ficha[];
  processos: readonly Processo[];
  consultorias: readonly Consultoria[];
  clientes: readonly Cliente[];
  /** Leads com diagnóstico ainda não lido — vêm da camada de entrada. */
  diagnosticosNaoLidos: readonly { leadId: string; leadNome: string; quando: Date }[];
  /**
   * Contratos, para os dois avisos que só eles podem dar: proposta parada
   * esperando aceite e parcela vencida não paga.
   *
   * Opcional porque a tela que monta a lista sem contrato ainda precisa
   * funcionar — e porque "não perguntei sobre contratos" e "não há contrato
   * nenhum" são estados diferentes. Ausente = não perguntei.
   */
  contratos?: readonly LinhaContrato[];
};

/**
 * Monta a lista de atenção a partir dos fatos.
 *
 * Cada item tem um `href` porque atenção sem ação é só preocupação — se o
 * sistema diz que algo precisa dela, ele precisa dizer para onde ir.
 */
export function derivarAtencao(fontes: FontesAtencao, agora: Date): ItemAtencao[] {
  const nomeDoCliente = new Map(fontes.clientes.map((c) => [c.id, c.nomeFantasia] as const));
  const itens: ItemAtencao[] = [];

  // Consultorias paradas no cliente e sem data à frente: o trabalho travou.
  for (const c of fontes.consultorias) {
    if (c.status !== "AGUARDANDO_CLIENTE") continue;
    itens.push({
      id: `at_cs_${c.id}`,
      tipo: "ACOMPANHAMENTO_PENDENTE",
      titulo: c.titulo,
      detalhe: `${nomeDoCliente.get(c.clienteId) ?? "Cliente"} · ${c.proximaAcao}`,
      clienteId: c.clienteId,
      href: `/consultorias/${c.id}`,
      desde: c.ultimoAcompanhamentoEm ?? c.iniciadaEm,
    });
  }

  // Ações de plano paradas no cliente: ela está esperando uma resposta.
  for (const acao of fontes.acoes) {
    if (acao.status !== "AGUARDANDO_CLIENTE") continue;
    if (acao.prazo !== null && !terminou(acao.prazo, agora)) continue;
    itens.push({
      id: `at_${acao.id}`,
      tipo: "INFORMACAO_AGUARDANDO_CLIENTE",
      titulo: acao.titulo,
      detalhe: `${nomeDoCliente.get(acao.clienteId) ?? "Cliente"} · aguardando ${acao.responsavel}`,
      clienteId: acao.clienteId,
      href: `/clientes/${acao.clienteId}`,
      desde: acao.prazo ?? acao.criadoEm,
    });
  }

  // Fichas sem dado: existe ficha pela metade, e ficha pela metade não serve.
  for (const ficha of fontes.fichas) {
    if (ficha.situacao !== "AGUARDANDO_DADOS") continue;
    itens.push({
      id: `at_${ficha.id}`,
      tipo: "FICHA_AGUARDANDO_DADOS",
      titulo: ficha.nome,
      detalhe: `${nomeDoCliente.get(ficha.clienteId) ?? "Cliente"} · falta dado para fechar`,
      clienteId: ficha.clienteId,
      href: `/fichas/${ficha.id}`,
      desde: ficha.atualizadaEm,
    });
  }

  // Processos sem tempo declarado em algum passo: o fluxo existe, o tempo não.
  for (const processo of fontes.processos) {
    const semTempo = processo.passos.filter((p) => p.tempoEstimadoMin === null).length;
    if (semTempo === 0) continue;
    itens.push({
      id: `at_${processo.id}`,
      tipo: "PROCESSO_AGUARDANDO_REVISAO",
      titulo: `${processo.praca} — ${processo.clienteId ? nomeDoCliente.get(processo.clienteId) : ""}`,
      detalhe:
        semTempo === 1
          ? "1 passo sem tempo declarado"
          : `${semTempo} passos sem tempo declarado`,
      clienteId: processo.clienteId,
      href: `/processos/${processo.id}`,
      desde: agora,
    });
  }

  // Diagnósticos que chegaram e ninguém leu.
  for (const d of fontes.diagnosticosNaoLidos) {
    itens.push({
      id: `at_dg_${d.leadId}`,
      tipo: "DIAGNOSTICO_NAO_LIDO",
      titulo: d.leadNome,
      detalhe: "Respondeu o diagnóstico e ainda não foi lido",
      clienteId: null,
      href: `/leads/${d.leadId}`,
      desde: d.quando,
    });
  }

  /*
    ── CONTRATOS ────────────────────────────────────────────────────────────
    Dois avisos, e só dois. O contrato NÃO gera aviso por estar em rascunho:
    rascunho é trabalho em curso, não pendência — e um painel que aponta
    rascunho como problema ensina a ignorar o painel.

    Uma nota sobre `desde`: a parcela atrasada conta o tempo desde o
    VENCIMENTO, não desde a criação do contrato. É o vencimento que está
    passando, e é ele que a frase "vencida há 8 dias" deve medir.
  */
  for (const linha of fontes.contratos ?? []) {
    const { contrato, cliente } = linha;
    const quem = cliente.nomeFantasia;

    if (contrato.status === "AGUARDANDO_ACEITE") {
      const enviado = contrato.eventos.find((e) => e.tipo === "enviado");
      itens.push({
        id: `at_ct_${contrato.id}`,
        tipo: "CONTRATO_AGUARDANDO_ACEITE",
        titulo: contrato.titulo,
        detalhe: `${quem} · proposta enviada${enviado ? "" : " e ainda não assinada"}`,
        clienteId: contrato.clienteId,
        href: `/contratos/${contrato.id}`,
        desde: enviado?.em ?? contrato.criadoEm,
      });
    }

    const vencidas = contrato.parcelas.filter(
      (p) => p.status === "ATRASADO" && p.venceEm !== null && terminou(p.venceEm, agora)
    );
    if (vencidas.length > 0) {
      // A mais antiga é a que define a gravidade: três parcelas atrasadas
      // com a primeira vencida há 60 dias é um problema mais velho do que
      // a contagem de parcelas sugere.
      const maisAntiga = vencidas.reduce((a, b) =>
        (a.venceEm?.getTime() ?? 0) <= (b.venceEm?.getTime() ?? 0) ? a : b
      );
      itens.push({
        id: `at_ct_${contrato.id}_atraso`,
        tipo: "PARCELA_ATRASADA",
        titulo: contrato.titulo,
        detalhe:
          vencidas.length === 1
            ? `${quem} · 1 parcela vencida`
            : `${quem} · ${vencidas.length} parcelas vencidas`,
        clienteId: contrato.clienteId,
        href: `/contratos/${contrato.id}`,
        desde: maisAntiga.venceEm ?? contrato.criadoEm,
      });
    }
  }

  return itens.sort((a, b) => {
    const pa = ORDEM_ATENCAO.indexOf(a.tipo);
    const pb = ORDEM_ATENCAO.indexOf(b.tipo);
    if (pa !== pb) return pa - pb;
    return a.desde.getTime() - b.desde.getTime();
  });
}

// ---------------------------------------------------------------------------
// Contagens de ficha por situação
// ---------------------------------------------------------------------------

export function contarFichas(fichas: readonly Ficha[]) {
  return {
    total: fichas.length,
    completas: fichas.filter((f) => f.situacao === "COMPLETA").length,
    aguardandoDados: fichas.filter((f) => f.situacao === "AGUARDANDO_DADOS").length,
    emRevisao: fichas.filter((f) => f.situacao === "EM_REVISAO").length,
  };
}

export function contarAcoes(acoes: readonly AcaoPlano[]) {
  return {
    total: acoes.length,
    concluidas: acoes.filter((a) => a.status === "CONCLUIDO").length,
    emAndamento: acoes.filter((a) => a.status === "EM_ANDAMENTO").length,
    aguardandoCliente: acoes.filter((a) => a.status === "AGUARDANDO_CLIENTE").length,
    aFazer: acoes.filter((a) => a.status === "A_FAZER").length,
  };
}

// ---------------------------------------------------------------------------
// Tempo declarado de um processo
// ---------------------------------------------------------------------------

/**
 * Soma os tempos que a EQUIPE declarou.
 *
 * Devolve `null` quando nenhum passo tem tempo — porque soma de nada não é
 * zero, é ausência de informação. Zero diria que o processo leva zero
 * minutos, o que é uma afirmação falsa sobre a cozinha de alguém.
 */
export function somaDosTemposDeclarados(processo: Processo, tipo: "todos" | "comTempo"): number | null {
  const comTempo = processo.passos.filter((p) => p.tempoEstimadoMin !== null);
  if (tipo === "comTempo" && comTempo.length === 0) return null;
  if (processo.passos.length === 0) return null;
  return comTempo.reduce((soma, p) => soma + (p.tempoEstimadoMin ?? 0), 0);
}

/** Quantos passos ainda estão sem tempo declarado. Contagem, não percentual. */
export function passosSemTempo(processo: Processo): number {
  return processo.passos.filter((p) => p.tempoEstimadoMin === null).length;
}

// ---------------------------------------------------------------------------
// Situação do cliente na lista
// ---------------------------------------------------------------------------

export const ROTULO_SITUACAO_CLIENTE: Record<SituacaoCliente, string> = {
  ATIVO: "Ativo",
  EM_IMPLANTACAO: "Em implantação",
  PAUSADO: "Pausado",
  ENCERRADO: "Encerrado",
};

export type TomSituacao = "neutro" | "oliva" | "dourado" | "critico" | "verde";

export const TOM_SITUACAO_CLIENTE: Record<SituacaoCliente, TomSituacao> = {
  ATIVO: "verde",
  EM_IMPLANTACAO: "dourado",
  PAUSADO: "neutro",
  ENCERRADO: "neutro",
};

export const ROTULO_STATUS_CONSULTORIA: Record<StatusConsultoria, string> = {
  PLANEJAMENTO: "Planejamento",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  EM_ACOMPANHAMENTO: "Em acompanhamento",
  CONCLUIDA: "Concluída",
};

export const TOM_STATUS_CONSULTORIA: Record<StatusConsultoria, TomSituacao> = {
  PLANEJAMENTO: "oliva",
  EM_ANDAMENTO: "verde",
  AGUARDANDO_CLIENTE: "dourado",
  EM_ACOMPANHAMENTO: "verde",
  CONCLUIDA: "neutro",
};

export const ROTULO_ETAPA = {
  DIAGNOSTICO: "Diagnóstico",
  ANALISE: "Análise",
  PLANO_DE_ACAO: "Plano de ação",
  IMPLANTACAO: "Implantação",
  TREINAMENTO: "Treinamento",
  ACOMPANHAMENTO: "Acompanhamento",
  RESULTADO: "Resultado",
} as const;

export const ROTULO_PRIORIDADE = {
  ALTA: "Alta",
  MEDIA: "Média",
  BAIXA: "Baixa",
} as const;

export const TOM_PRIORIDADE: Record<"ALTA" | "MEDIA" | "BAIXA", TomSituacao> = {
  ALTA: "critico",
  MEDIA: "dourado",
  BAIXA: "neutro",
};

export const ROTULO_STATUS_ACAO = {
  A_FAZER: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  CONCLUIDO: "Concluído",
} as const;

/**
 * Rótulo do status de TAREFA — que não é o mesmo de ação.
 *
 * Os dois começam com "A_FAZER" e "EM_ANDAMENTO", o que convida a reaproveitar
 * o mapa de cima. Só que o terminal de cada um é diferente: ação termina em
 * CONCLUIDO (masculino, o item), tarefa termina em CONCLUIDA (feminino, a
 * tarefa) e não tem AGUARDANDO_CLIENTE. Indexar um mapa com o tipo do outro
 * compila até alguém concluir uma tarefa — e aí a tela fica sem rótulo.
 */
export const ROTULO_STATUS_TAREFA: Record<StatusTarefa, string> = {
  A_FAZER: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
};

export const ROTULO_TIPO_ACOMPANHAMENTO = {
  REUNIAO: "Reunião",
  VISITA: "Visita",
  ANALISE: "Análise",
  RETORNO: "Retorno",
  REVISAO: "Revisão",
} as const;

export const ROTULO_MODALIDADE = {
  PRESENCIAL: "Presencial",
  ONLINE: "Online",
  MISTA: "Mista",
} as const;

export const ROTULO_SITUACAO_FICHA = {
  COMPLETA: "Completa",
  AGUARDANDO_DADOS: "Aguardando dados",
  EM_REVISAO: "Em revisão",
} as const;

export const TOM_SITUACAO_FICHA: Record<"COMPLETA" | "AGUARDANDO_DADOS" | "EM_REVISAO", TomSituacao> = {
  COMPLETA: "verde",
  AGUARDANDO_DADOS: "dourado",
  EM_REVISAO: "oliva",
};

export const ROTULO_TIPO_NEGOCIO = {
  BUFFET: "Buffet",
  A_LA_CARTE: "À la carte",
  BUFFET_E_A_LA_CARTE: "Buffet e à la carte",
  DELIVERY: "Delivery",
  OUTRO: "Outro",
} as const;

export const ROTULO_TIPO_DOCUMENTO = {
  RELATORIO: "Relatório",
  FICHA: "Ficha",
  PLANO_DE_ACAO: "Plano de ação",
  PROCESSO: "Processo",
  OUTRO: "Outro",
} as const;

export const ROTULO_SITUACAO_DOCUMENTO = {
  RASCUNHO: "Rascunho",
  PRONTO: "Pronto",
  ENTREGUE: "Entregue",
} as const;

export const TOM_SITUACAO_DOCUMENTO: Record<"RASCUNHO" | "PRONTO" | "ENTREGUE", TomSituacao> = {
  RASCUNHO: "neutro",
  PRONTO: "dourado",
  ENTREGUE: "verde",
};

// ---------------------------------------------------------------------------
// Contratos — vocabulário
// ---------------------------------------------------------------------------

export const ROTULO_STATUS_CONTRATO: Record<StatusContrato, string> = {
  RASCUNHO: "Rascunho",
  AGUARDANDO_ACEITE: "Aguardando aceite",
  ASSINADO: "Assinado",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDO: "Concluído",
  CANCELADO: "Cancelado",
};

export const ORDEM_STATUS_CONTRATO: readonly StatusContrato[] = [
  "RASCUNHO",
  "AGUARDANDO_ACEITE",
  "ASSINADO",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "CANCELADO",
];

export const ROTULO_STATUS_PARCELA: Record<StatusParcela, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  ATRASADO: "Atrasado",
  CANCELADO: "Cancelado",
};

/**
 * O TOM DE CADA ESTADO — e a regra de não depender só de cor.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO NÃO É UM SEMÁFORO                                       │
 * │                                                                      │
 * │ Seria fácil pintar PAGO de verde, ATRASADO de vermelho e PENDENTE de  │
 * │ amarelo. O problema é que "em andamento" e "assinado" não são         │
 * │ melhores nem piores que um do outro — são ETAPAS. Tratá-los como      │
 * │ graus de sucesso faria a tela mentir sobre a natureza do dado.        │
 * │                                                                      │
 * │ Então o tom marca só onde há uma distinção que ela precisa ver de     │
 * │ longe: o que está esperando ela (dourado), o que terminou (verde), o  │
 * │ que está parado (crítico) e o resto (neutro).                         │
 * │                                                                      │
 * │ E o tom NUNCA aparece sozinho: sempre acompanha o rótulo escrito.     │
 * │ Quem não distingue cor lê a mesma informação.                         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const TOM_STATUS_CONTRATO: Record<StatusContrato, TomSituacao> = {
  RASCUNHO: "neutro",
  AGUARDANDO_ACEITE: "dourado",
  ASSINADO: "oliva",
  EM_ANDAMENTO: "oliva",
  CONCLUIDO: "verde",
  CANCELADO: "critico",
};

export const TOM_STATUS_PARCELA: Record<StatusParcela, TomSituacao> = {
  PENDENTE: "neutro",
  PAGO: "verde",
  ATRASADO: "critico",
  CANCELADO: "neutro",
};

export const ROTULO_ESTADO_DOCUMENTO: Record<EstadoDocumentoContrato, string> = {
  NAO_ENVIADO: "Não enviado",
  AGUARDANDO_ACEITE: "Aguardando aceite",
  ASSINADO: "Assinado",
};

export const ROTULO_TIPO_ACEITE: Record<TipoAceite, string> = {
  ASSINATURA_DIGITAL: "Assinatura digital",
  ASSINATURA_MANUSCRITA: "Assinatura manuscrita",
  ACEITE_POR_EMAIL: "Aceite por e-mail",
};

export const ROTULO_EVENTO_CONTRATO: Record<TipoEventoContrato, string> = {
  criado: "Contrato criado",
  enviado: "Enviado para o cliente",
  visualizado: "Cliente visualizou",
  aceito: "Contrato aceito",
  pagamento_registrado: "Pagamento registrado",
  projeto_iniciado: "Projeto iniciado",
  projeto_entregue: "Projeto entregue",
  cancelado: "Contrato cancelado",
};

// ---------------------------------------------------------------------------
// Contratos — contas
// ---------------------------------------------------------------------------

/**
 * AS CONTAS DO CONTRATO — e por que só existem estas.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ SOMA, CONTAGEM E COMPARAÇÃO DE DATA. NADA MAIS.                      │
 * │                                                                      │
 * │ Um contrato tem dinheiro, então é tentador que este arquivo comece a  │
 * │ calcular juros de atraso, multa, valor corrigido, "total a receber    │
 * │ até o fim do contrato". Nada disso está aqui.                         │
 * │                                                                      │
 * │ Juros e multa são CLÁUSULA — dependem do que foi assinado, e nem todo │
 * │ contrato tem. "Total a receber" precisaria decidir se conta parcela   │
 * │ atrasada como provável, o que é projeção. Somar as parcelas que       │
 * │ existem não é projeção: é a única soma que os dados sustentam.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** Soma das parcelas, ignorando as canceladas. Cancelada não é dívida. */
export function somarParcelas(contrato: Contrato): number {
  return contrato.parcelas
    .filter((p) => p.status !== "CANCELADO")
    .reduce((total, p) => total + p.valor, 0);
}

/** Soma do que já foi pago. */
export function somarPagas(contrato: Contrato): number {
  return contrato.parcelas
    .filter((p) => p.status === "PAGO")
    .reduce((total, p) => total + p.valor, 0);
}

/** O que falta. Diferença de duas somas — não é previsão de recebimento. */
export function somarPendentes(contrato: Contrato): number {
  return contrato.parcelas
    .filter((p) => p.status === "PENDENTE" || p.status === "ATRASADO")
    .reduce((total, p) => total + p.valor, 0);
}

/** Quantas parcelas de cada estado. Contagem, para o resumo do topo. */
export function contarParcelas(contrato: Contrato): Record<StatusParcela, number> {
  const base: Record<StatusParcela, number> = {
    PENDENTE: 0,
    PAGO: 0,
    ATRASADO: 0,
    CANCELADO: 0,
  };
  for (const p of contrato.parcelas) {
    base[p.status] += 1;
  }
  return base;
}

/**
 * A parcela recorrente — a mensalidade.
 *
 * Devolve o valor da primeira parcela marcada como recorrente, ou `null`.
 * Não soma nem multiplica meses: o contrato não sabe quantos meses o
 * acompanhamento vai durar, e chutar seria inventar.
 */
export function mensalidadeDoContrato(contrato: Contrato): number | null {
  const recorrente = contrato.parcelas.find((p) => p.recorrente);
  return recorrente ? recorrente.valor : null;
}

/**
 * A próxima parcela em aberto.
 *
 * "Próxima" = a de menor vencimento entre as que ainda não foram pagas.
 * Parcela sem data de vencimento não entra na escolha — ela pode ser a
 * próxima na prática, mas o sistema não tem como afirmar qual é, e ordenar
 * por `null` colocaria uma parcela sem prazo no topo da lista.
 */
export function proximaParcela(contrato: Contrato): ParcelaContrato | null {
  const abertas = contrato.parcelas.filter(
    (p) => (p.status === "PENDENTE" || p.status === "ATRASADO") && p.venceEm !== null
  );
  if (abertas.length === 0) return null;
  return abertas.reduce((maisProxima, p) => {
    const a = p.venceEm as Date;
    const b = maisProxima.venceEm as Date;
    return a.getTime() < b.getTime() ? p : maisProxima;
  });
}

/**
 * O rótulo de posição da parcela — "2ª parcela", "4ª parcela".
 *
 * Derivado da POSIÇÃO, não gravado: se uma parcela do meio for removida, as
 * seguintes se renumeram sozinhas e o rótulo nunca fica fora de sequência.
 */
export function rotuloParcela(numero: number): string {
  return `${numero}ª parcela`;
}

/** Contratos que ainda pedem movimento da consultora. */
export const STATUS_CONTRATO_ABERTOS: readonly StatusContrato[] = [
  "RASCUNHO",
  "AGUARDANDO_ACEITE",
  "ASSINADO",
  "EM_ANDAMENTO",
];

// ---------------------------------------------------------------------------
// Notificações derivadas
// ---------------------------------------------------------------------------

/**
 * As notificações nascem dos mesmos fatos que a atenção — tarefa vencendo,
 * cliente esperando, acompanhamento previsto. Não existe tabela de
 * notificação: é a mesma escolha de derivar, pelo mesmo motivo.
 */
export function derivarNotificacoes(
  fontes: {
    tarefas: readonly Tarefa[];
    clientes: readonly Cliente[];
    compromissos: readonly { id: string; titulo: string; quando: Date; clienteId: string }[];
    diagnosticosNaoLidos: readonly { leadId: string; leadNome: string; quando: Date }[];
  },
  agora: Date
): Notificacao[] {
  const nome = new Map(fontes.clientes.map((c) => [c.id, c.nomeFantasia] as const));
  const lista: Notificacao[] = [];

  for (const d of fontes.diagnosticosNaoLidos) {
    lista.push({
      id: `nt_dg_${d.leadId}`,
      tipo: "diagnostico_novo",
      titulo: "Novo diagnóstico recebido",
      descricao: `${d.leadNome} respondeu o diagnóstico e ainda não foi lido.`,
      quando: d.quando,
      href: `/leads/${d.leadId}`,
      lida: false,
    });
  }

  for (const t of fontes.tarefas) {
    if (t.status === "CONCLUIDA" || t.prazo === null) continue;
    const atrasada = terminou(t.prazo, agora);
    if (!atrasada && !mesmoDia(t.prazo, agora)) continue;
    lista.push({
      id: `nt_tr_${t.id}`,
      tipo: "tarefa_proxima",
      titulo: atrasada ? "Tarefa atrasada" : "Tarefa vence hoje",
      descricao: t.titulo,
      quando: t.prazo,
      href: "/tarefas",
      lida: false,
    });
  }

  for (const c of fontes.compromissos) {
    const dias = diasEntre(agora, c.quando);
    if (dias < 0 || dias > 2) continue;
    lista.push({
      id: `nt_cp_${c.id}`,
      tipo: "acompanhamento_previsto",
      titulo: dias === 0 ? "Acompanhamento hoje" : "Acompanhamento previsto",
      descricao: `${c.titulo} — ${nome.get(c.clienteId) ?? "Cliente"}`,
      quando: c.quando,
      href: "/acompanhamentos",
      lida: false,
    });
  }

  return lista.sort((a, b) => b.quando.getTime() - a.quando.getTime());
}

// ---------------------------------------------------------------------------
// Jornada da consultoria — leitura dos números que já vêm prontos
// ---------------------------------------------------------------------------

/**
 * Quantas etapas da jornada estão concluídas, para o rótulo "4 de 7 etapas".
 *
 * É contagem de etapas, NÃO percentual de conclusão da consultoria. A
 * diferença importa: as etapas têm tamanhos muito diferentes, e transformar
 * a contagem em percentual afirmaria que "Implantação" pesa o mesmo que
 * "Diagnóstico". Peso é o ponto 11.
 */
export function etapasConcluidas(consultoria: Consultoria): { feitas: number; total: number } {
  return {
    feitas: consultoria.jornada.filter((e) => e.estado === "CONCLUIDA").length,
    total: consultoria.jornada.length,
  };
}

// ---------------------------------------------------------------------------
// Acompanhamentos — o que ficou combinado
// ---------------------------------------------------------------------------

/**
 * O último acompanhamento de cada cliente.
 *
 * "Último" é por DATA do encontro, não por ordem de cadastro. A diferença
 * aparece quando alguém lança uma visita antiga depois: pelo cadastro, ela
 * seria a mais recente; pela data, continua sendo o que é.
 */
export function ultimoAcompanhamentoPorCliente(
  acompanhamentos: readonly Acompanhamento[]
): Map<string, Acompanhamento> {
  const ultimo = new Map<string, Acompanhamento>();

  for (const a of acompanhamentos) {
    const atual = ultimo.get(a.clienteId);
    if (!atual || a.data.getTime() > atual.data.getTime()) {
      ultimo.set(a.clienteId, a);
    }
  }

  return ultimo;
}

/**
 * O próximo passo declarado no encontro mais recente de cada cliente.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO NÃO É "PENDÊNCIAS EM ABERTO"                            │
 * │                                                                      │
 * │ Uma pendência em aberto é uma afirmação sobre o mundo: "isto ainda    │
 * │ não foi feito". Só que o sistema não tem como saber disso — ninguém   │
 * │ marca a pendência como resolvida em lugar nenhum, porque o modelo de  │
 * │ dados não tem esse estado, e criar um seria inventar um fluxo que a   │
 * │ consultora não pediu.                                                │
 * │                                                                      │
 * │ O que dá para afirmar com segurança é outra coisa: o que ela mesma    │
 * │ escreveu como próximo passo no último encontro daquele cliente. Isso  │
 * │ é fato registrado, e é o que esta função devolve.                     │
 * │                                                                      │
 * │ Se o encontro seguinte já aconteceu e trouxe outro próximo passo, o   │
 * │ antigo sai sozinho — porque só o último de cada cliente entra.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function proximosEncontros(
  acompanhamentos: readonly Acompanhamento[]
): Array<{ acompanhamento: Acompanhamento; clienteId: string }> {
  const ultimos = ultimoAcompanhamentoPorCliente(acompanhamentos);

  return [...ultimos.values()]
    .filter((a) => a.proximaAcao.trim().length > 0)
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .map((a) => ({ acompanhamento: a, clienteId: a.clienteId }));
}
