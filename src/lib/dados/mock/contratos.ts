/**
 * CONTRATOS — o cenário de demonstração.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO É SEPARADO DE `operacao.ts`                      │
 * │                                                                      │
 * │ `operacao.ts` já tem 2.064 linhas. Contrato chegou depois, com tipos  │
 * │ próprios (parcelas, aceite, eventos) e cinco registros. Empilhar mais │
 * │ quatrocentos aqui dentro faria o arquivo em que se PROCURA virar o     │
 * │ arquivo em que não se acha nada.                                      │
 * │                                                                      │
 * │ Continuam sendo MOCK, no mesmo diretório dos outros, importados pelo   │
 * │ mesmo repositório — a demonstração segue centralizada. O que mudou é   │
 * │ só o tamanho do arquivo.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ OS NÚMEROS SÃO INVENTADOS, E ISSO É VISÍVEL                          │
 * │                                                                      │
 * │ Os valores abaixo são plausíveis para uma consultoria gastronômica e  │
 * │ não têm nenhuma relação com o que a Érika cobra. Não existe tabela de  │
 * │ preço dela no material recebido — o que existe é a planilha vendida a  │
 * │ R$ 147 no site, que é PRODUTO, não serviço de consultoria.            │
 * │                                                                      │
 * │ Por isso nenhum valor aqui foi "derivado" de nada real, e a tela diz  │
 * │ que são demonstrativos. Inventar um preço e apresentá-lo como se      │
 * │ fosse o dela seria o pior tipo de erro neste projeto.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Os cinco contratos cobrem, de propósito, os estados que a tela precisa
 * demonstrar: um em rascunho, um aguardando aceite, um assinado ainda não
 * iniciado, um em andamento com parcelas pagas, e um concluído. Um cenário
 * em que todos estão no mesmo estado não demonstra filtro nenhum.
 */

import type { Contrato, EventoContrato, ParcelaContrato } from "../tipos-operacao";

const AGORA = new Date();

/** Uma data de demonstração, contada para trás. */
function atras(dias: number): Date {
  const d = new Date(AGORA);
  d.setDate(d.getDate() - dias);
  d.setHours(9, 0, 0, 0);
  return d;
}

/** Uma data de demonstração, contada para frente. */
function daqui(dias: number): Date {
  const d = new Date(AGORA);
  d.setDate(d.getDate() + dias);
  d.setHours(9, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// Parcelas
// ---------------------------------------------------------------------------

/**
 * Helper de parcela.
 *
 * Existe para o cenário abaixo não repetir onze vezes os mesmos seis campos
 * — e para deixar claro, na leitura, que `numero` é POSIÇÃO na lista, não
 * identidade. `status` e `pagoEm` andam juntos: parcela paga sem data de
 * pagamento seria um dado incoerente que a tela teria de desmentir.
 */
function parcela(
  id: string,
  numero: number,
  descricao: string,
  valor: number,
  condicao: string,
  status: ParcelaContrato["status"],
  opcoes: { venceEm?: Date; pagoEm?: Date; recorrente?: boolean } = {}
): ParcelaContrato {
  return {
    id,
    numero,
    descricao,
    valor,
    condicao,
    venceEm: opcoes.venceEm ?? null,
    pagoEm: opcoes.pagoEm ?? null,
    status,
    recorrente: opcoes.recorrente ?? false,
  };
}

function evento(
  id: string,
  tipo: EventoContrato["tipo"],
  descricao: string,
  dias: number,
  por: string
): EventoContrato {
  return { id, tipo, descricao, em: atras(dias), por };
}

const ERIKA = "Érika Bruna";

// ---------------------------------------------------------------------------
// CONTRATOS
// ---------------------------------------------------------------------------

export const CONTRATOS: Contrato[] = [
  // 1 — RASCUNHO: ainda sendo montado, nada enviado.
  {
    id: "ct_quintal",
    clienteId: "cl_quintal_maria",
    consultoriaId: null,
    numero: "2026-014",
    titulo: "Consultoria de operação e ficha técnica",
    status: "RASCUNHO",
    criadoEm: atras(4),
    inicioEm: null,
    entregaPrevistaEm: null,
    aceite: null,
    estadoDocumento: "NAO_ENVIADO",
    escopo: [
      "Leitura da operação atual",
      "Ficha técnica dos pratos principais",
      "Padronização da montagem",
    ],
    observacoes:
      "Valores ainda em discussão. O escopo foi combinado por telefone e precisa ser confirmado antes de enviar.",
    parcelas: [
      parcela("pc_qt_1", 1, "Entrada", 1800, "Na assinatura", "PENDENTE"),
      parcela("pc_qt_2", 2, "Parcela única na entrega", 2500, "Na entrega do material", "PENDENTE"),
    ],
    eventos: [
      evento("ev_qt_1", "criado", "Contrato criado como rascunho.", 4, ERIKA),
    ],
  },

  // 2 — AGUARDANDO ACEITE: enviado, o cliente ainda não respondeu.
  {
    id: "ct_bella_massa",
    clienteId: "cl_bella_massa",
    consultoriaId: null,
    numero: "2026-013",
    titulo: "Diagnóstico e plano de ação",
    status: "AGUARDANDO_ACEITE",
    criadoEm: atras(9),
    inicioEm: daqui(6),
    entregaPrevistaEm: daqui(66),
    aceite: null,
    estadoDocumento: "AGUARDANDO_ACEITE",
    escopo: [
      "Diagnóstico completo da operação",
      "Plano de ação priorizado",
      "Duas reuniões de devolutiva",
    ],
    observacoes:
      "Enviado pelo WhatsApp com o documento em anexo. Ele pediu dois dias para responder.",
    parcelas: [
      parcela("pc_bm_1", 1, "Entrada", 1500, "Na assinatura", "PENDENTE", {
        venceEm: daqui(6),
      }),
      parcela("pc_bm_2", 2, "Parcela 1 de 2", 1500, "30 dias após o início", "PENDENTE", {
        venceEm: daqui(36),
      }),
      parcela("pc_bm_3", 3, "Parcela 2 de 2", 1500, "Na entrega", "PENDENTE", {
        venceEm: daqui(66),
      }),
    ],
    eventos: [
      evento("ev_bm_1", "criado", "Contrato criado.", 9, ERIKA),
      evento("ev_bm_2", "enviado", "Documento enviado para o cliente.", 8, ERIKA),
      evento("ev_bm_3", "visualizado", "O cliente abriu o documento.", 7, "Marcelo Tavares"),
    ],
  },

  // 3 — ASSINADO: aceite dado, trabalho ainda não começou.
  {
    id: "ct_sabor_serra",
    clienteId: "cl_sabor_serra",
    consultoriaId: "co_sabor_serra",
    numero: "2026-011",
    titulo: "Dimensionamento de produção do buffet",
    status: "ASSINADO",
    criadoEm: atras(16),
    inicioEm: daqui(3),
    entregaPrevistaEm: daqui(93),
    aceite: {
      tipo: "ASSINATURA_DIGITAL",
      em: atras(11),
      por: "Rodrigo Bastos",
    },
    estadoDocumento: "ASSINADO",
    escopo: [
      "Padronização dos pratos do buffet",
      "Ficha técnica de 12 preparos",
      "Processo do passe para os dois turnos",
      "Treinamento da equipe",
    ],
    observacoes:
      "Começa depois da reforma do salão. A entrega foi combinada para depois da temporada.",
    parcelas: [
      parcela("pc_ss_1", 1, "Entrada", 2400, "Na assinatura", "PAGO", {
        venceEm: atras(11),
        pagoEm: atras(11),
      }),
      parcela("pc_ss_2", 2, "Parcela 1 de 3", 2400, "30 dias após o início", "PENDENTE", {
        venceEm: daqui(33),
      }),
      parcela("pc_ss_3", 3, "Parcela 2 de 3", 2400, "60 dias após o início", "PENDENTE", {
        venceEm: daqui(63),
      }),
      parcela("pc_ss_4", 4, "Parcela 3 de 3", 2400, "Na entrega", "PENDENTE", {
        venceEm: daqui(93),
      }),
    ],
    eventos: [
      evento("ev_ss_1", "criado", "Contrato criado.", 16, ERIKA),
      evento("ev_ss_2", "enviado", "Documento enviado para o cliente.", 15, ERIKA),
      evento("ev_ss_3", "visualizado", "O cliente abriu o documento.", 13, "Rodrigo Bastos"),
      evento("ev_ss_4", "aceito", "Contrato aceito com assinatura digital.", 11, "Rodrigo Bastos"),
      evento("ev_ss_5", "pagamento_registrado", "Entrada recebida.", 11, ERIKA),
    ],
  },

  // 4 — EM ANDAMENTO: o caso cheio. Tem mensalidade, parcela paga e atrasada.
  {
    id: "ct_emporio_verde",
    clienteId: "cl_emporio_verde",
    consultoriaId: "co_emporio_verde",
    numero: "2026-008",
    titulo: "Padronização da montagem e conclusão das fichas",
    status: "EM_ANDAMENTO",
    criadoEm: atras(92),
    inicioEm: atras(88),
    entregaPrevistaEm: daqui(28),
    aceite: {
      tipo: "ASSINATURA_DIGITAL",
      em: atras(90),
      por: "Cláudia Nogueira",
    },
    estadoDocumento: "ASSINADO",
    escopo: [
      "Diagnóstico da operação",
      "Fichas técnicas do cardápio do delivery",
      "Padronização da montagem",
      "Acompanhamento mensal",
    ],
    observacoes:
      "O acompanhamento mensal segue enquanto ela quiser. A parcela do mês passado atrasou por causa da troca de contador — ela avisou.",
    parcelas: [
      parcela("pc_ev_1", 1, "Entrada", 3200, "Na assinatura", "PAGO", {
        venceEm: atras(90),
        pagoEm: atras(90),
      }),
      parcela("pc_ev_2", 2, "Parcela 1 de 2", 3200, "30 dias após o início", "PAGO", {
        venceEm: atras(58),
        pagoEm: atras(56),
      }),
      parcela("pc_ev_3", 3, "Parcela 2 de 2", 3200, "Na entrega", "PENDENTE", {
        venceEm: daqui(28),
      }),
      parcela("pc_ev_4", 4, "Acompanhamento mensal", 900, "Todo dia 10", "ATRASADO", {
        venceEm: atras(8),
        recorrente: true,
      }),
    ],
    eventos: [
      evento("ev_ev_1", "criado", "Contrato criado.", 92, ERIKA),
      evento("ev_ev_2", "enviado", "Documento enviado para a cliente.", 91, ERIKA),
      evento("ev_ev_3", "visualizado", "A cliente abriu o documento.", 90, "Cláudia Nogueira"),
      evento("ev_ev_4", "aceito", "Contrato aceito com assinatura digital.", 90, "Cláudia Nogueira"),
      evento("ev_ev_5", "pagamento_registrado", "Entrada recebida.", 90, ERIKA),
      evento("ev_ev_6", "projeto_iniciado", "Trabalho iniciado na cozinha.", 88, ERIKA),
      evento(
        "ev_ev_7",
        "pagamento_registrado",
        "Parcela 1 recebida com dois dias de antecipação.",
        56,
        ERIKA
      ),
    ],
  },

  // 5 — CONCLUÍDO: tudo pago, projeto entregue.
  {
    id: "ct_doce_ponto",
    clienteId: "cl_doce_ponto",
    consultoriaId: "co_doce_ponto",
    numero: "2025-031",
    titulo: "Implantação de fichas técnicas",
    status: "CONCLUIDO",
    criadoEm: atras(210),
    inicioEm: atras(205),
    entregaPrevistaEm: atras(25),
    aceite: {
      tipo: "ASSINATURA_MANUSCRITA",
      em: atras(207),
      por: "Simone Alves",
    },
    estadoDocumento: "ASSINADO",
    escopo: [
      "Levantamento dos insumos",
      "Ficha técnica de 18 preparos",
      "Treinamento de pesagem",
    ],
    observacoes: "Entregue dentro do prazo. A cliente pediu orçamento para uma segunda unidade.",
    parcelas: [
      parcela("pc_dp_1", 1, "Entrada", 1200, "Na assinatura", "PAGO", {
        venceEm: atras(207),
        pagoEm: atras(207),
      }),
      parcela("pc_dp_2", 2, "Parcela 1 de 2", 1200, "30 dias após o início", "PAGO", {
        venceEm: atras(175),
        pagoEm: atras(175),
      }),
      parcela("pc_dp_3", 3, "Parcela 2 de 2", 1200, "Na entrega", "PAGO", {
        venceEm: atras(25),
        pagoEm: atras(27),
      }),
    ],
    eventos: [
      evento("ev_dp_1", "criado", "Contrato criado.", 210, ERIKA),
      evento("ev_dp_2", "enviado", "Documento enviado para a cliente.", 209, ERIKA),
      evento("ev_dp_3", "aceito", "Contrato aceito com assinatura manuscrita.", 207, "Simone Alves"),
      evento("ev_dp_4", "pagamento_registrado", "Entrada recebida.", 207, ERIKA),
      evento("ev_dp_5", "projeto_iniciado", "Trabalho iniciado.", 205, ERIKA),
      evento("ev_dp_6", "pagamento_registrado", "Parcela 1 recebida.", 175, ERIKA),
      evento("ev_dp_7", "projeto_entregue", "Material entregue e treinamento concluído.", 25, ERIKA),
      evento("ev_dp_8", "pagamento_registrado", "Parcela final recebida.", 27, ERIKA),
    ],
  },
];
