/**
 * O CENÁRIO DE DEMONSTRAÇÃO DA OPERAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ UM MUNDO SÓ, INTEIRO, QUE NÃO EXISTE.                                │
 * │                                                                      │
 * │ Os cinco leads de ./dados.ts continuam sendo o começo da história.   │
 * │ Aqui ela continua: três daqueles leads viraram cliente, um está      │
 * │ sendo convertido agora e um nunca vai converter. A partir dos        │
 * │ clientes nascem consultorias; das consultorias nascem plano de ação, │
 * │ acompanhamento e processo; dos clientes nascem ficha e documento.    │
 * │                                                                      │
 * │ A LIGAÇÃO É POR ID, NÃO POR NOME.                                    │
 * │                                                                      │
 * │ `cl_emporio_verde.leadOrigemId === "ld_emporio_verde"` — e não uma   │
 * │ coincidência de string. É isso que faz o histórico do cliente        │
 * │ conseguir dizer "lead convertido" na data em que o lead foi criado,  │
 * │ e o que faz a jornada da consultoria apontar para o diagnóstico que  │
 * │ existe de verdade em ./dados.ts. Se os dois arquivos divergirem, a   │
 * │ demonstração mostra a divergência em vez de escondê-la.             │
 * │                                                                      │
 * │ O QUE ESTE ARQUIVO NÃO TEM                                           │
 * │                                                                      │
 * │ · nenhum CMV, markup ou preço    → depende do ponto 7                │
 * │ · nenhuma margem, lucro, economia→ a origem do volume é o ponto 9    │
 * │ · nenhuma nota, score ou peso    → depende do ponto 11               │
 * │ · nenhum fator de correção de tabela → depende dos pontos 5 e 6      │
 * │                                                                      │
 * │ O que ELE PASSOU A TER, com o motor de custos: os pesos medidos de    │
 * │ cada insumo (`transformacao`), a etapa em que cada item de ficha foi  │
 * │ declarado (`etapa`) e o preço de cada cliente (`INGREDIENTES_DO_      │
 * │ CLIENTE`). Com esses três, perda, rendimento e custo passaram a ser   │
 * │ conta — e deixaram de ser pergunta.                                   │
 * │                                                                      │
 * │ Onde a tela precisaria de um dos números que continuam faltando, ela  │
 * │ mostra o que falta e por quê. Um campo `null` aqui é uma pergunta em  │
 * │ aberto, não um esquecimento.                                          │
 * │                                                                      │
 * │ Nenhum dado pessoal real: os negócios são fictícios, os e-mails são  │
 * │ `*.exemplo` e os telefones são `(5X) 99000-000X`.                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type {
  AcaoPlano,
  Acompanhamento,
  Cliente,
  Compra,
  Compromisso,
  Consultoria,
  Documento,
  EventoHistorico,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
  Notificacao,
  PrecoIngrediente,
  Processo,
  Tarefa,
} from "../tipos-operacao";

// ---------------------------------------------------------------------------
// Datas
// ---------------------------------------------------------------------------

const AGORA = new Date();

/** Uma data de demonstração, contada para trás. */
function atras(dias: number, horas = 0): Date {
  const d = new Date(AGORA);
  d.setDate(d.getDate() - dias);
  d.setHours(d.getHours() - horas);
  return d;
}

/** Uma data de demonstração, contada para frente — prazo, compromisso. */
function daqui(dias: number, hora = 9): Date {
  const d = new Date(AGORA);
  d.setDate(d.getDate() + dias);
  d.setHours(hora, 0, 0, 0);
  return d;
}

// ---------------------------------------------------------------------------
// CLIENTES
// ---------------------------------------------------------------------------
// Três dos cinco leads da entrada viraram cliente. O quarto está no meio da
// conversão (é o que a tela de conversão demonstra) e o quinto não converte —
// porque uma fila em que todos convertem não é uma fila, é uma encenação.

export const CLIENTES: Cliente[] = [
  {
    id: "cl_emporio_verde",
    nomeFantasia: "Empório Verde — Cozinha Natural",
    nomeContato: "Cláudia Nogueira",
    email: "contato@emporioverde.exemplo",
    whatsapp: "(51) 99000-0002",
    tipoNegocio: "BUFFET_E_A_LA_CARTE",
    porte: "PEQUENO",
    cidade: "Porto Alegre · RS",
    situacao: "ATIVO",
    modalidade: "MISTA",
    iniciadoEm: atras(96),
    ultimaAtividadeEm: atras(2),
    funcionariosDeclarados: "De 1 a 5",
    leadOrigemId: "ld_emporio_verde",
    origem: "DIAGNOSTICO_PUBLICO",
    problemaDeclarado:
      "A montagem dos pratos demora e sai diferente. Dependo da equipe acertar de memória.",
  },
  {
    id: "cl_sabor_serra",
    nomeFantasia: "Sabor da Serra",
    nomeContato: "Rodrigo Bastos",
    email: "rodrigo@sabordaserra.exemplo",
    whatsapp: "(54) 99000-0003",
    tipoNegocio: "BUFFET",
    porte: "MEDIO",
    cidade: "Gramado · RS",
    situacao: "ATIVO",
    modalidade: "PRESENCIAL",
    iniciadoEm: atras(58),
    ultimaAtividadeEm: atras(9),
    funcionariosDeclarados: "De 5 a 10",
    leadOrigemId: "ld_sabor_serra",
    origem: "INDICACAO",
    problemaDeclarado:
      "Na alta temporada a cozinha trava. Não consigo servir todo mundo e ainda saio com sobra de comida.",
  },
  {
    id: "cl_doce_ponto",
    nomeFantasia: "Doce Ponto Confeitaria",
    nomeContato: "Simone Alves",
    email: "simone@doceponto.exemplo",
    whatsapp: "(51) 99000-0004",
    tipoNegocio: "OUTRO",
    porte: "PEQUENO",
    cidade: "Canoas · RS",
    situacao: "ATIVO",
    modalidade: "ONLINE",
    iniciadoEm: atras(74),
    ultimaAtividadeEm: atras(6),
    funcionariosDeclarados: "O dono e mais um",
    leadOrigemId: "ld_doce_ponto",
    origem: "INSTAGRAM",
    problemaDeclarado:
      "Compro e não sei se o que entrou na semana bate com o que a gente produziu.",
  },
  {
    id: "cl_bella_massa",
    nomeFantasia: "Cantina Bella Massa",
    nomeContato: "Marcelo Tavares",
    email: "marcelo@bellamassa.exemplo",
    whatsapp: "(51) 99000-0001",
    tipoNegocio: "A_LA_CARTE",
    porte: "MEDIO",
    cidade: "Porto Alegre · RS",
    situacao: "EM_IMPLANTACAO",
    modalidade: "PRESENCIAL",
    iniciadoEm: atras(11),
    ultimaAtividadeEm: atras(1),
    funcionariosDeclarados: "De 5 a 10",
    leadOrigemId: "ld_bella_massa",
    origem: "DIAGNOSTICO_PUBLICO",
    problemaDeclarado:
      "Não sei se estou lucrando. Vendo bem no fim de semana e no fim do mês não sobra nada, e eu não sei dizer qual prato paga a conta.",
  },
  {
    id: "cl_quintal_maria",
    nomeFantasia: "Quintal da Maria",
    nomeContato: "Maria Helena Ribeiro",
    email: "maria@quintaldamaria.exemplo",
    whatsapp: "(51) 99000-0006",
    tipoNegocio: "A_LA_CARTE",
    porte: "PEQUENO",
    cidade: "Novo Hamburgo · RS",
    situacao: "PAUSADO",
    modalidade: "ONLINE",
    iniciadoEm: atras(212),
    ultimaAtividadeEm: atras(48),
    funcionariosDeclarados: "De 1 a 5",
    // Entrou por indicação e foi cadastrada à mão: não veio de lead nenhum.
    // É o caso que prova que a lista de clientes não é um espelho da fila.
    leadOrigemId: null,
    origem: "INDICACAO",
    problemaDeclarado:
      "Cozinha pequena e cardápio grande. Não conseguia servir no horário do almoço.",
  },
];

// ---------------------------------------------------------------------------
// CONSULTORIAS
// ---------------------------------------------------------------------------
// A jornada usa as etapas do método que o site dela já publica. `progresso` e
// `total` são CONTAGEM (3 de 12 fichas), nunca percentual — somar etapas de
// naturezas diferentes exigiria peso, e peso é o ponto 11.

export const CONSULTORIAS: Consultoria[] = [
  {
    id: "co_emporio_verde",
    clienteId: "cl_emporio_verde",
    titulo: "Padronização da montagem e conclusão das fichas",
    status: "EM_ANDAMENTO",
    modalidade: "MISTA",
    iniciadaEm: atras(92),
    ultimoAcompanhamentoEm: atras(2),
    proximaAcao: "Fechar a ficha do escondidinho com o rendimento conferido",
    proximaAcaoEm: daqui(3),
    escopo: [
      "Completar a ficha técnica dos 22 itens do cardápio",
      "Padronizar a montagem dos pratos do delivery",
      "Organizar o fluxo de finalização do passe",
      "Treinar a equipe na execução do padrão escrito",
    ],
    jornada: [
      { etapa: "DIAGNOSTICO", estado: "CONCLUIDA", nota: "Diagnóstico recebido pelo site" },
      { etapa: "ANALISE", estado: "CONCLUIDA", nota: "Blocos lidos e devolutiva entregue" },
      {
        etapa: "PLANO_DE_ACAO",
        estado: "EM_ANDAMENTO",
        progresso: 4,
        total: 9,
        nota: "Plano escrito; 4 ações concluídas",
      },
      {
        etapa: "IMPLANTACAO",
        estado: "EM_ANDAMENTO",
        progresso: 12,
        total: 22,
        nota: "12 de 22 fichas concluídas",
      },
      { etapa: "TREINAMENTO", estado: "NAO_INICIADA", nota: "Começa depois das fichas" },
      { etapa: "ACOMPANHAMENTO", estado: "EM_ANDAMENTO", nota: "Retorno a cada 15 dias" },
      { etapa: "RESULTADO", estado: "AGUARDANDO_DADOS", nota: "Depende do fechamento do mês" },
    ],
  },
  {
    id: "co_sabor_serra",
    clienteId: "cl_sabor_serra",
    titulo: "Dimensionamento de produção do buffet",
    status: "AGUARDANDO_CLIENTE",
    modalidade: "PRESENCIAL",
    iniciadaEm: atras(54),
    ultimoAcompanhamentoEm: atras(16),
    proximaAcao: "Receber o histórico de produção das últimas 4 semanas",
    proximaAcaoEm: daqui(5),
    escopo: [
      "Levantar o consumo real de cada item do buffet",
      "Definir quantidade de referência por item",
      "Reduzir sobra no fim do serviço",
    ],
    jornada: [
      { etapa: "DIAGNOSTICO", estado: "CONCLUIDA", nota: "Diagnóstico recebido por indicação" },
      { etapa: "ANALISE", estado: "CONCLUIDA", nota: "Visita à cozinha realizada" },
      {
        etapa: "PLANO_DE_ACAO",
        estado: "EM_ANDAMENTO",
        progresso: 2,
        total: 7,
        nota: "Plano escrito; 2 ações concluídas",
      },
      {
        etapa: "IMPLANTACAO",
        estado: "AGUARDANDO_DADOS",
        progresso: 1,
        total: 31,
        nota: "1 de 31 fichas — parou por falta do histórico",
      },
      { etapa: "TREINAMENTO", estado: "NAO_INICIADA", nota: "Depende do dimensionamento" },
      { etapa: "ACOMPANHAMENTO", estado: "AGUARDANDO_DADOS", nota: "Sem retorno desde a visita" },
      {
        etapa: "RESULTADO",
        estado: "AGUARDANDO_DADOS",
        nota: "Depende de como o volume do período é apurado",
      },
    ],
  },
  {
    id: "co_doce_ponto",
    clienteId: "cl_doce_ponto",
    titulo: "Fechamento do controle de estoque",
    status: "EM_ACOMPANHAMENTO",
    modalidade: "ONLINE",
    iniciadaEm: atras(70),
    ultimoAcompanhamentoEm: atras(6),
    proximaAcao: "Conferir a conciliação do mês fechado",
    proximaAcaoEm: daqui(8),
    escopo: [
      "Conciliar entrada de insumo e produção",
      "Fechar a ficha de custo dos itens de balcão",
      "Deixar o fechamento mensal rodando sem ela",
    ],
    jornada: [
      { etapa: "DIAGNOSTICO", estado: "CONCLUIDA", nota: "Diagnóstico pelo Instagram" },
      { etapa: "ANALISE", estado: "CONCLUIDA", nota: "Caso curto: preço e padrão já dominados" },
      {
        etapa: "PLANO_DE_ACAO",
        estado: "CONCLUIDA",
        progresso: 5,
        total: 5,
        nota: "Todas as ações concluídas",
      },
      {
        etapa: "IMPLANTACAO",
        estado: "CONCLUIDA",
        progresso: 17,
        total: 17,
        nota: "17 de 17 fichas",
      },
      { etapa: "TREINAMENTO", estado: "CONCLUIDA", nota: "Uma sessão online, gravada" },
      { etapa: "ACOMPANHAMENTO", estado: "EM_ANDAMENTO", nota: "Terceiro mês de acompanhamento" },
      { etapa: "RESULTADO", estado: "AGUARDANDO_DADOS", nota: "Aguardando o fechamento" },
    ],
  },
  {
    id: "co_bella_massa",
    clienteId: "cl_bella_massa",
    titulo: "Custo por prato antes de mexer em preço",
    status: "EM_ANDAMENTO",
    modalidade: "PRESENCIAL",
    iniciadaEm: atras(9),
    ultimoAcompanhamentoEm: atras(3),
    proximaAcao: "Levantar o rendimento real dos 6 pratos que mais saem",
    proximaAcaoEm: daqui(2),
    escopo: [
      "Montar a ficha dos pratos que mais saem, começando pelos 6 primeiros",
      "Mostrar o custo antes de falar em qualquer reajuste",
      "Organizar a finalização do passe",
    ],
    jornada: [
      { etapa: "DIAGNOSTICO", estado: "CONCLUIDA", nota: "Diagnóstico recebido pelo site" },
      { etapa: "ANALISE", estado: "CONCLUIDA", nota: "Prioridade declarada: medo de mexer no preço" },
      {
        etapa: "PLANO_DE_ACAO",
        estado: "EM_ANDAMENTO",
        progresso: 1,
        total: 8,
        nota: "Primeira ação em andamento",
      },
      {
        etapa: "IMPLANTACAO",
        estado: "EM_ANDAMENTO",
        progresso: 2,
        total: 38,
        nota: "2 de 38 fichas iniciadas",
      },
      { etapa: "TREINAMENTO", estado: "NAO_INICIADA", nota: "Sem data" },
      { etapa: "ACOMPANHAMENTO", estado: "NAO_INICIADA", nota: "Começa depois do plano" },
      { etapa: "RESULTADO", estado: "NAO_INICIADA", nota: "—" },
    ],
  },
  {
    id: "co_quintal_maria",
    clienteId: "cl_quintal_maria",
    titulo: "Cardápio enxuto e horário de almoço",
    status: "CONCLUIDA",
    modalidade: "ONLINE",
    iniciadaEm: atras(208),
    ultimoAcompanhamentoEm: atras(48),
    proximaAcao: "Sem ação prevista — consultoria encerrada",
    proximaAcaoEm: null,
    escopo: [
      "Reduzir o cardápio do almoço",
      "Organizar a produção por turno",
      "Padronizar a finalização dos pratos que ficaram",
    ],
    jornada: [
      { etapa: "DIAGNOSTICO", estado: "CONCLUIDA", nota: "Cadastro manual por indicação" },
      { etapa: "ANALISE", estado: "CONCLUIDA", nota: "Duas sessões online" },
      {
        etapa: "PLANO_DE_ACAO",
        estado: "CONCLUIDA",
        progresso: 6,
        total: 6,
        nota: "Todas as ações concluídas",
      },
      { etapa: "IMPLANTACAO", estado: "CONCLUIDA", progresso: 14, total: 14, nota: "14 de 14 fichas" },
      { etapa: "TREINAMENTO", estado: "CONCLUIDA", nota: "Equipe treinada no padrão novo" },
      { etapa: "ACOMPANHAMENTO", estado: "CONCLUIDA", nota: "Encerrado por decisão dela" },
      { etapa: "RESULTADO", estado: "CONCLUIDA", nota: "Relatório de encerramento entregue" },
    ],
  },
];

// ---------------------------------------------------------------------------
// PLANO DE AÇÃO
// ---------------------------------------------------------------------------
// O que foi COMBINADO com o cliente. Distinto de tarefa, que é o que ela
// precisa fazer no dia — ver a nota em tipos-operacao.ts.

export const ACOES: AcaoPlano[] = [
  // Empório Verde
  {
    id: "ac_ev_1",
    consultoriaId: "co_emporio_verde",
    clienteId: "cl_emporio_verde",
    titulo: "Levantar o rendimento real de cada preparo do delivery",
    descricao:
      "Pesar a produção de cada item do delivery por três dias e comparar com o que a equipe declarou. É a base da ficha.",
    responsavel: "Érika Bruna",
    prioridade: "ALTA",
    status: "CONCLUIDO",
    prazo: atras(24),
    observacao: "Rendimento declarado estava 12% acima do real em três itens.",
    criadoEm: atras(86),
  },
  {
    id: "ac_ev_2",
    consultoriaId: "co_emporio_verde",
    clienteId: "cl_emporio_verde",
    titulo: "Escrever o padrão de montagem dos pratos do delivery",
    descricao:
      "Uma folha por prato, no passe, com ordem dos componentes e peso de cada um. Sem isso o prato sai diferente a cada turno.",
    responsavel: "Érika Bruna",
    prioridade: "ALTA",
    status: "CONCLUIDO",
    prazo: atras(18),
    observacao: "Afixado no passe e plastificado.",
    criadoEm: atras(80),
  },
  {
    id: "ac_ev_3",
    consultoriaId: "co_emporio_verde",
    clienteId: "cl_emporio_verde",
    titulo: "Completar as fichas dos itens que faltam",
    descricao:
      "Faltam 10 itens dos 22. Prioridade para os que saem no delivery, porque neles o erro de porção aparece mais rápido.",
    responsavel: "Cláudia Nogueira",
    prioridade: "ALTA",
    status: "EM_ANDAMENTO",
    prazo: daqui(12),
    observacao: "Ritmo de duas fichas por semana, fechadas junto com a produção.",
    criadoEm: atras(46),
  },
  {
    id: "ac_ev_4",
    consultoriaId: "co_emporio_verde",
    clienteId: "cl_emporio_verde",
    titulo: "Reduzir o tempo de espera no horário de pico do almoço",
    descricao:
      "Medir o intervalo entre o pedido e a entrega da marmita por uma semana antes de propor qualquer mudança no fluxo.",
    responsavel: "Érika Bruna",
    prioridade: "MEDIA",
    status: "A_FAZER",
    prazo: daqui(20),
    observacao: "Não começar antes das fichas dos itens do almoço fecharem.",
    criadoEm: atras(30),
  },
  {
    id: "ac_ev_5",
    consultoriaId: "co_emporio_verde",
    clienteId: "cl_emporio_verde",
    titulo: "Definir o responsável por conferir a produção do dia",
    descricao:
      "Uma pessoa por turno confere o que foi produzido contra o padrão escrito e assina a folha.",
    responsavel: "Cláudia Nogueira",
    prioridade: "MEDIA",
    status: "AGUARDANDO_CLIENTE",
    prazo: daqui(9),
    observacao: "Ela vai definir quem, entre as duas pessoas do turno, fica responsável.",
    criadoEm: atras(22),
  },
  {
    id: "ac_ev_6",
    consultoriaId: "co_emporio_verde",
    clienteId: "cl_emporio_verde",
    titulo: "Treinar a equipe na leitura da folha de montagem",
    descricao: "Sessão de uma hora com o turno da manhã, com a folha na mão.",
    responsavel: "Érika Bruna",
    prioridade: "BAIXA",
    status: "A_FAZER",
    prazo: daqui(28),
    observacao: "Depois que as fichas de delivery fecharem.",
    criadoEm: atras(20),
  },
  {
    id: "ac_ev_7",
    consultoriaId: "co_emporio_verde",
    clienteId: "cl_emporio_verde",
    titulo: "Organizar a lista de compras a partir do cardápio",
    descricao:
      "Hoje a compra sai da memória. Passar a sair da quantidade de referência de cada item da ficha.",
    responsavel: "Érika Bruna",
    prioridade: "MEDIA",
    status: "A_FAZER",
    prazo: daqui(35),
    observacao: "Depende das fichas fecharem primeiro — é a mesma informação.",
    criadoEm: atras(19),
  },
  {
    id: "ac_ev_8",
    consultoriaId: "co_emporio_verde",
    clienteId: "cl_emporio_verde",
    titulo: "Fechar o padrão de etiquetagem dos insumos abertos",
    descricao: "Data de abertura e validade em cada pote. Simples e não existia.",
    responsavel: "Cláudia Nogueira",
    prioridade: "BAIXA",
    status: "CONCLUIDO",
    prazo: atras(11),
    observacao: "Feito pela própria equipe, sem custo.",
    criadoEm: atras(28),
  },
  {
    id: "ac_ev_9",
    consultoriaId: "co_emporio_verde",
    clienteId: "cl_emporio_verde",
    titulo: "Revisar o que ficou fora do cardápio",
    descricao:
      "Dos 22 itens, separar os que quase não saem. Decisão do que sai do cardápio é dela, com o número na mão.",
    responsavel: "Érika Bruna",
    prioridade: "BAIXA",
    status: "A_FAZER",
    prazo: daqui(45),
    observacao: "Assunto da próxima reunião de resultado.",
    criadoEm: atras(12),
  },

  // Sabor da Serra
  {
    id: "ac_ss_1",
    consultoriaId: "co_sabor_serra",
    clienteId: "cl_sabor_serra",
    titulo: "Visitar a cozinha durante o serviço do buffet",
    descricao: "Ver a reposição acontecendo, no horário de pico, sem aviso.",
    responsavel: "Érika Bruna",
    prioridade: "ALTA",
    status: "CONCLUIDO",
    prazo: atras(16),
    observacao: "Reposição feita por estimativa visual. Confirmado o que ele declarou.",
    criadoEm: atras(50),
  },
  {
    id: "ac_ss_2",
    consultoriaId: "co_sabor_serra",
    clienteId: "cl_sabor_serra",
    titulo: "Pedir o histórico de produção das últimas 4 semanas",
    descricao:
      "Quantidade produzida por item e quantidade sobrada, por serviço. É o que falta para dimensionar.",
    responsavel: "Rodrigo Bastos",
    prioridade: "ALTA",
    status: "AGUARDANDO_CLIENTE",
    prazo: daqui(5),
    observacao: "Pedido na visita e reforçado por mensagem. Ainda não chegou.",
    criadoEm: atras(16),
  },
  {
    id: "ac_ss_3",
    consultoriaId: "co_sabor_serra",
    clienteId: "cl_sabor_serra",
    titulo: "Dividir o buffet em itens de produção e itens de reposição",
    descricao:
      "Separar o que é feito uma vez do que é reposto ao longo do serviço. Muda a conta de quantos por quantos.",
    responsavel: "Érika Bruna",
    prioridade: "MEDIA",
    status: "EM_ANDAMENTO",
    prazo: daqui(14),
    observacao: "Rascunho pronto, aguardando o histórico para fechar.",
    criadoEm: atras(15),
  },
  {
    id: "ac_ss_4",
    consultoriaId: "co_sabor_serra",
    clienteId: "cl_sabor_serra",
    titulo: "Padronizar a bandeja de reposição por faixa de horário",
    descricao: "Repor aos poucos, em quantidade menor, em vez de encher a cuba.",
    responsavel: "Rodrigo Bastos",
    prioridade: "MEDIA",
    status: "A_FAZER",
    prazo: daqui(25),
    observacao: "Depende do dimensionamento.",
    criadoEm: atras(14),
  },
  {
    id: "ac_ss_5",
    consultoriaId: "co_sabor_serra",
    clienteId: "cl_sabor_serra",
    titulo: "Levantar o que sobra no fim do serviço por três dias",
    descricao: "Pesar a sobra e anotar o item. Sem isso a sobra é impressão, não dado.",
    responsavel: "Rodrigo Bastos",
    prioridade: "ALTA",
    status: "CONCLUIDO",
    prazo: atras(9),
    observacao: "Três dias anotados. A sobra se concentra em dois itens.",
    criadoEm: atras(13),
  },
  {
    id: "ac_ss_6",
    consultoriaId: "co_sabor_serra",
    clienteId: "cl_sabor_serra",
    titulo: "Revisar o horário de abertura do buffet",
    descricao: "Avaliar se abrir meia hora depois reduz a sobra sem perder cliente.",
    responsavel: "Rodrigo Bastos",
    prioridade: "BAIXA",
    status: "A_FAZER",
    prazo: null,
    observacao: "Sem prazo — decidir só depois do dimensionamento.",
    criadoEm: atras(8),
  },
  {
    id: "ac_ss_7",
    consultoriaId: "co_sabor_serra",
    clienteId: "cl_sabor_serra",
    titulo: "Fotografar a montagem do buffet no início e no fim",
    descricao: "Registro visual para comparar o antes e o depois com ele mesmo.",
    responsavel: "Érika Bruna",
    prioridade: "BAIXA",
    status: "CONCLUIDO",
    prazo: atras(16),
    observacao: "Feito na visita.",
    criadoEm: atras(17),
  },

  // Doce Ponto
  {
    id: "ac_dp_1",
    consultoriaId: "co_doce_ponto",
    clienteId: "cl_doce_ponto",
    titulo: "Montar a planilha de conciliação de entrada e produção",
    descricao: "O que entrou na semana contra o que foi produzido. Uma linha por insumo.",
    responsavel: "Érika Bruna",
    prioridade: "ALTA",
    status: "CONCLUIDO",
    prazo: atras(52),
    observacao: "Estrutura simples, feita junto na sessão online.",
    criadoEm: atras(66),
  },
  {
    id: "ac_dp_2",
    consultoriaId: "co_doce_ponto",
    clienteId: "cl_doce_ponto",
    titulo: "Definir a unidade de compra de cada insumo de balcão",
    descricao:
      "Comprar sempre na mesma unidade, para a conciliação fechar sem conversão no meio.",
    responsavel: "Simone Alves",
    prioridade: "MEDIA",
    status: "CONCLUIDO",
    prazo: atras(40),
    observacao: "Ela já tinha quase tudo assim; faltavam dois itens.",
    criadoEm: atras(60),
  },
  {
    id: "ac_dp_3",
    consultoriaId: "co_doce_ponto",
    clienteId: "cl_doce_ponto",
    titulo: "Fechar o primeiro mês de conciliação e comparar com a percepção",
    descricao:
      "Ela achava que sabia onde estava a diferença. A conciliação vai dizer se estava certo.",
    responsavel: "Érika Bruna",
    prioridade: "ALTA",
    status: "CONCLUIDO",
    prazo: atras(20),
    observacao: "A diferença estava em dois itens, não no que ela imaginava.",
    criadoEm: atras(44),
  },
  {
    id: "ac_dp_4",
    consultoriaId: "co_doce_ponto",
    clienteId: "cl_doce_ponto",
    titulo: "Deixar o fechamento rodando sem acompanhamento",
    descricao: "Ela fecha sozinha dois meses, e o terceiro é só conferência.",
    responsavel: "Simone Alves",
    prioridade: "MEDIA",
    status: "EM_ANDAMENTO",
    prazo: daqui(30),
    observacao: "Segundo mês em andamento, sem ajuda.",
    criadoEm: atras(30),
  },
  {
    id: "ac_dp_5",
    consultoriaId: "co_doce_ponto",
    clienteId: "cl_doce_ponto",
    titulo: "Revisar a ficha dos itens de balcão que mudaram de fornecedor",
    descricao: "Fornecedor novo, preço novo. A ficha precisa acompanhar.",
    responsavel: "Érika Bruna",
    prioridade: "BAIXA",
    status: "CONCLUIDO",
    prazo: atras(6),
    observacao: "Três itens atualizados.",
    criadoEm: atras(25),
  },

  // Bella Massa
  {
    id: "ac_bm_1",
    consultoriaId: "co_bella_massa",
    clienteId: "cl_bella_massa",
    titulo: "Levantar o rendimento real dos 6 pratos que mais saem",
    descricao:
      "Antes de qualquer conversa sobre preço, mostrar o custo do que ele mais vende. Foi o pedido dele.",
    responsavel: "Érika Bruna",
    prioridade: "ALTA",
    status: "EM_ANDAMENTO",
    prazo: daqui(2),
    observacao: "Fichas de dois pratos iniciadas; quatro ainda sem rendimento conferido.",
    criadoEm: atras(8),
  },
  {
    id: "ac_bm_2",
    consultoriaId: "co_bella_massa",
    clienteId: "cl_bella_massa",
    titulo: "Separar o custo do que é produzido na casa e do que é comprado pronto",
    descricao:
      "Massa fresca é feita na casa; alguns componentes são comprados. A conta é diferente para cada caso.",
    responsavel: "Érika Bruna",
    prioridade: "ALTA",
    status: "A_FAZER",
    prazo: daqui(10),
    observacao: "Sem isso a ficha de dois pratos fica pela metade.",
    criadoEm: atras(8),
  },
  {
    id: "ac_bm_3",
    consultoriaId: "co_bella_massa",
    clienteId: "cl_bella_massa",
    titulo: "Escrever a ordem de finalização dos pratos do passe",
    descricao:
      "Ele mesmo disse que cada um monta como aprendeu. Uma folha por prato resolve.",
    responsavel: "Érika Bruna",
    prioridade: "MEDIA",
    status: "A_FAZER",
    prazo: daqui(16),
    observacao: "Vem depois do custo — ele quer ver número primeiro.",
    criadoEm: atras(7),
  },
  {
    id: "ac_bm_4",
    consultoriaId: "co_bella_massa",
    clienteId: "cl_bella_massa",
    titulo: "Anotar o preço de compra dos insumos por duas semanas",
    descricao:
      "Ele não tem registro de preço. Duas semanas de anotação já dão base para a ficha.",
    responsavel: "Marcelo Tavares",
    prioridade: "ALTA",
    status: "AGUARDANDO_CLIENTE",
    prazo: daqui(6),
    observacao: "Começou a anotar. Falta a segunda semana.",
    criadoEm: atras(7),
  },
  {
    id: "ac_bm_5",
    consultoriaId: "co_bella_massa",
    clienteId: "cl_bella_massa",
    titulo: "Levantar quantos pratos saem por noite",
    descricao:
      "Sem saber o giro, não dá para dizer qual prato paga a conta — que é exatamente a pergunta dele.",
    responsavel: "Marcelo Tavares",
    prioridade: "ALTA",
    status: "A_FAZER",
    prazo: daqui(11),
    observacao: "O sistema dele já registra a venda; é exportar.",
    criadoEm: atras(6),
  },
  {
    id: "ac_bm_6",
    consultoriaId: "co_bella_massa",
    clienteId: "cl_bella_massa",
    titulo: "Conferir se a ficha de dois pratos fecha com o que é servido de fato",
    descricao: "Comparar a quantidade da ficha com o que sai na balança, no serviço.",
    responsavel: "Érika Bruna",
    prioridade: "MEDIA",
    status: "A_FAZER",
    prazo: daqui(18),
    observacao: "É a conferência que ele nunca fez.",
    criadoEm: atras(5),
  },
  {
    id: "ac_bm_7",
    consultoriaId: "co_bella_massa",
    clienteId: "cl_bella_massa",
    titulo: "Reunir com ele antes de qualquer sugestão de preço",
    descricao:
      "Combinado explícito: nenhuma conversa sobre reajuste antes de ele ver o custo. Ele disse que já perdeu cliente assim.",
    responsavel: "Érika Bruna",
    prioridade: "ALTA",
    status: "A_FAZER",
    prazo: daqui(6),
    observacao: "É o combinado mais importante desta consultoria.",
    criadoEm: atras(9),
  },
  {
    id: "ac_bm_8",
    consultoriaId: "co_bella_massa",
    clienteId: "cl_bella_massa",
    titulo: "Separar os pratos que ele quer tirar do cardápio",
    descricao: "Dos 38, ele já falou que alguns não valem a pena. Decidir junto, com o número.",
    responsavel: "Marcelo Tavares",
    prioridade: "BAIXA",
    status: "A_FAZER",
    prazo: null,
    observacao: "Assunto do fim da consultoria.",
    criadoEm: atras(4),
  },

  // Quintal da Maria — consultoria encerrada, histórico preservado
  {
    id: "ac_qm_1",
    consultoriaId: "co_quintal_maria",
    clienteId: "cl_quintal_maria",
    titulo: "Reduzir o cardápio do almoço de 41 para 18 itens",
    descricao: "Cortar o que não sai e o que só ela sabia fazer.",
    responsavel: "Érika Bruna",
    prioridade: "ALTA",
    status: "CONCLUIDO",
    prazo: atras(180),
    observacao: "Ficou em 18 itens. O almoço passou a sair no horário.",
    criadoEm: atras(200),
  },
  {
    id: "ac_qm_2",
    consultoriaId: "co_quintal_maria",
    clienteId: "cl_quintal_maria",
    titulo: "Padronizar a finalização dos 18 pratos que ficaram",
    descricao: "Ficha e ordem de montagem, uma por prato.",
    responsavel: "Érika Bruna",
    prioridade: "ALTA",
    status: "CONCLUIDO",
    prazo: atras(150),
    observacao: "14 fichas concluídas.",
    criadoEm: atras(175),
  },
  {
    id: "ac_qm_3",
    consultoriaId: "co_quintal_maria",
    clienteId: "cl_quintal_maria",
    titulo: "Treinar a equipe no padrão novo",
    descricao: "Duas sessões, uma por turno.",
    responsavel: "Érika Bruna",
    prioridade: "MEDIA",
    status: "CONCLUIDO",
    prazo: atras(120),
    observacao: "Equipe treinada; ela saiu da linha de produção.",
    criadoEm: atras(160),
  },
  {
    id: "ac_qm_4",
    consultoriaId: "co_quintal_maria",
    clienteId: "cl_quintal_maria",
    titulo: "Acompanhar dois meses e encerrar",
    descricao: "Dois fechamentos com ela e depois alta.",
    responsavel: "Érika Bruna",
    prioridade: "MEDIA",
    status: "CONCLUIDO",
    prazo: atras(60),
    observacao: "Encerrada com ela fechando sozinha.",
    criadoEm: atras(120),
  },
  {
    id: "ac_qm_5",
    consultoriaId: "co_quintal_maria",
    clienteId: "cl_quintal_maria",
    titulo: "Entregar o relatório de encerramento",
    descricao: "O que foi feito, o que ficou organizado e o que ficou pendente.",
    responsavel: "Érika Bruna",
    prioridade: "MEDIA",
    status: "CONCLUIDO",
    prazo: atras(50),
    observacao: "Entregue como link de leitura, sem login.",
    criadoEm: atras(60),
  },
  {
    id: "ac_qm_6",
    consultoriaId: "co_quintal_maria",
    clienteId: "cl_quintal_maria",
    titulo: "Revisar a ficha depois de 30 dias de operação",
    descricao: "Voltar uma vez, um mês depois, para conferir se o padrão pegou.",
    responsavel: "Érika Bruna",
    prioridade: "BAIXA",
    status: "CONCLUIDO",
    prazo: atras(48),
    observacao: "Padrão se manteve nos 18 itens.",
    criadoEm: atras(55),
  },
];

// ---------------------------------------------------------------------------
// TAREFAS
// ---------------------------------------------------------------------------
// O dia a dia dela. Algumas são de hoje, algumas atrasadas, outras à frente —
// porque uma lista de tarefas onde nada atrasa não demonstra nada.

export const TAREFAS: Tarefa[] = [
  {
    id: "tr_1",
    titulo: "Fechar a ficha do escondidinho com o rendimento conferido",
    clienteId: "cl_emporio_verde",
    consultoriaId: "co_emporio_verde",
    prazo: new Date(new Date().setHours(18, 0, 0, 0)),
    status: "EM_ANDAMENTO",
    prioridade: "ALTA",
    concluidaEm: null,
  },
  {
    id: "tr_2",
    titulo: "Cobrar o histórico de produção de 4 semanas do Sabor da Serra",
    clienteId: "cl_sabor_serra",
    consultoriaId: "co_sabor_serra",
    prazo: atras(3),
    status: "A_FAZER",
    prioridade: "ALTA",
    concluidaEm: null,
  },
  {
    id: "tr_3",
    titulo: "Responder a mensagem do Marcelo sobre o preço do fettuccine",
    clienteId: "cl_bella_massa",
    consultoriaId: "co_bella_massa",
    prazo: atras(1),
    status: "A_FAZER",
    prioridade: "ALTA",
    concluidaEm: null,
  },
  {
    id: "tr_4",
    titulo: "Reconfirmar o horário da visita ao Sabor da Serra",
    clienteId: "cl_sabor_serra",
    consultoriaId: "co_sabor_serra",
    prazo: new Date(new Date().setHours(20, 0, 0, 0)),
    status: "A_FAZER",
    prioridade: "MEDIA",
    concluidaEm: null,
  },
  {
    id: "tr_5",
    titulo: "Preparar a devolutiva de custo dos dois pratos do Bella Massa",
    clienteId: "cl_bella_massa",
    consultoriaId: "co_bella_massa",
    prazo: daqui(1, 12),
    status: "A_FAZER",
    prioridade: "ALTA",
    concluidaEm: null,
  },
  {
    id: "tr_6",
    titulo: "Conferir a conciliação do mês fechado do Doce Ponto",
    clienteId: "cl_doce_ponto",
    consultoriaId: "co_doce_ponto",
    prazo: daqui(8, 10),
    status: "A_FAZER",
    prioridade: "MEDIA",
    concluidaEm: null,
  },
  {
    id: "tr_7",
    titulo: "Atualizar o preço da mussarela e do azeite na biblioteca",
    clienteId: null,
    consultoriaId: null,
    prazo: daqui(3, 17),
    status: "A_FAZER",
    prioridade: "BAIXA",
    concluidaEm: null,
  },
  {
    id: "tr_8",
    titulo: "Escrever o resumo do bloco de padronização do Empório Verde",
    clienteId: "cl_emporio_verde",
    consultoriaId: "co_emporio_verde",
    prazo: daqui(5, 11),
    status: "A_FAZER",
    prioridade: "MEDIA",
    concluidaEm: null,
  },
  {
    id: "tr_9",
    titulo: "Ligar para o Fernando da Cozinha da Praça uma última vez",
    clienteId: null,
    consultoriaId: null,
    prazo: daqui(14, 10),
    status: "A_FAZER",
    prioridade: "BAIXA",
    concluidaEm: null,
  },
  {
    id: "tr_10",
    titulo: "Conferir a planilha de conciliação enviada pela Simone",
    clienteId: "cl_doce_ponto",
    consultoriaId: "co_doce_ponto",
    prazo: atras(6),
    status: "CONCLUIDA",
    prioridade: "MEDIA",
    concluidaEm: atras(6, 3),
  },
  {
    id: "tr_11",
    titulo: "Enviar o padrão de montagem plastificado para a Cláudia",
    clienteId: "cl_emporio_verde",
    consultoriaId: "co_emporio_verde",
    prazo: atras(18),
    status: "CONCLUIDA",
    prioridade: "ALTA",
    concluidaEm: atras(18, 2),
  },
  {
    id: "tr_12",
    titulo: "Registrar o acompanhamento do Doce Ponto no sistema",
    clienteId: "cl_doce_ponto",
    consultoriaId: "co_doce_ponto",
    prazo: atras(2),
    status: "CONCLUIDA",
    prioridade: "MEDIA",
    concluidaEm: atras(2, 1),
  },
  {
    id: "tr_13",
    titulo: "Montar o roteiro da primeira visita ao Bella Massa",
    clienteId: "cl_bella_massa",
    consultoriaId: "co_bella_massa",
    prazo: atras(10),
    status: "CONCLUIDA",
    prioridade: "ALTA",
    concluidaEm: atras(10, 5),
  },
  {
    id: "tr_14",
    titulo: "Conferir o material do treinamento do Quintal da Maria",
    clienteId: "cl_quintal_maria",
    consultoriaId: "co_quintal_maria",
    prazo: atras(48),
    status: "CONCLUIDA",
    prioridade: "BAIXA",
    concluidaEm: atras(48, 4),
  },
];

// ---------------------------------------------------------------------------
// ACOMPANHAMENTOS
// ---------------------------------------------------------------------------

export const ACOMPANHAMENTOS: Acompanhamento[] = [
  {
    id: "acp_ev_1",
    clienteId: "cl_emporio_verde",
    consultoriaId: "co_emporio_verde",
    tipo: "REUNIAO",
    data: atras(2, 3),
    modalidade: "ONLINE",
    titulo: "Revisão das fichas de delivery",
    resumo:
      "Revisamos as quatro fichas fechadas na quinzena. Duas precisaram de ajuste no rendimento declarado. Ela trouxe a produção pesada de dois dias.",
    pendencias: [
      "Fechar a ficha do escondidinho com o rendimento conferido",
      "Definir quem confere a produção do turno da tarde",
    ],
    proximaAcao: "Fechar o escondidinho e seguir para os itens do almoço",
    registradoEm: atras(2, 2),
  },
  {
    id: "acp_ev_2",
    clienteId: "cl_emporio_verde",
    consultoriaId: "co_emporio_verde",
    tipo: "VISITA",
    data: atras(22, 5),
    modalidade: "PRESENCIAL",
    titulo: "Visita ao passe no horário de pico",
    resumo:
      "Acompanhei o almoço inteiro no passe. A ordem de montagem é seguida, mas a porção varia bastante entre as duas pessoas do turno.",
    pendencias: ["Pesar três montagens por prato e comparar com a ficha"],
    proximaAcao: "Levar a folha de montagem com peso por componente",
    registradoEm: atras(22, 4),
  },
  {
    id: "acp_ev_3",
    clienteId: "cl_emporio_verde",
    consultoriaId: "co_emporio_verde",
    tipo: "ANALISE",
    data: atras(60, 2),
    modalidade: "ONLINE",
    titulo: "Devolutiva do diagnóstico",
    resumo:
      "Apresentei a leitura dos blocos. O ponto que mais a mobilizou foi a montagem do delivery, não a precificação — o escopo foi ajustado ali.",
    pendencias: ["Fechar o escopo por escrito"],
    proximaAcao: "Enviar o escopo e o plano de ação",
    registradoEm: atras(60, 1),
  },
  {
    id: "acp_ss_1",
    clienteId: "cl_sabor_serra",
    consultoriaId: "co_sabor_serra",
    tipo: "VISITA",
    data: atras(16, 6),
    modalidade: "PRESENCIAL",
    titulo: "Visita à cozinha durante o serviço",
    resumo:
      "Vi a reposição do buffet acontecendo. É feita no olho, enchendo a cuba de uma vez. A sobra se concentra em dois itens.",
    pendencias: [
      "Ele enviar o histórico de produção das últimas 4 semanas",
      "Pesar a sobra por três dias",
    ],
    proximaAcao: "Fechar o dimensionamento quando o histórico chegar",
    registradoEm: atras(16, 5),
  },
  {
    id: "acp_ss_2",
    clienteId: "cl_sabor_serra",
    consultoriaId: "co_sabor_serra",
    tipo: "RETORNO",
    data: atras(34, 4),
    modalidade: "ONLINE",
    titulo: "Retorno sobre o plano de ação",
    resumo: "Ele concordou com o plano e pediu para começar pela divisão do buffet em produção e reposição.",
    pendencias: ["Dividir os itens do buffet nas duas categorias"],
    proximaAcao: "Rascunhar a divisão antes da visita",
    registradoEm: atras(34, 3),
  },
  {
    id: "acp_dp_1",
    clienteId: "cl_doce_ponto",
    consultoriaId: "co_doce_ponto",
    tipo: "REUNIAO",
    data: atras(6, 2),
    modalidade: "ONLINE",
    titulo: "Segundo fechamento feito por ela",
    resumo:
      "Ela fechou o mês praticamente sozinha. A diferença que apareceu não estava no que ela imaginava — ficou claro quando vimos linha por linha.",
    pendencias: ["Revisar a ficha dos itens de balcão que trocaram de fornecedor"],
    proximaAcao: "Conferir o fechamento do mês seguinte",
    registradoEm: atras(6, 1),
  },
  {
    id: "acp_dp_2",
    clienteId: "cl_doce_ponto",
    consultoriaId: "co_doce_ponto",
    tipo: "ANALISE",
    data: atras(44, 3),
    modalidade: "ONLINE",
    titulo: "Primeiro mês de conciliação",
    resumo:
      "O primeiro fechamento revelou diferença em dois itens, e não no que ela suspeitava. O controle passou a fazer sentido para ela ali.",
    pendencias: ["Manter o registro por mais um mês sem ajuda"],
    proximaAcao: "Deixar ela fechar sozinha",
    registradoEm: atras(44, 2),
  },
  {
    id: "acp_bm_1",
    clienteId: "cl_bella_massa",
    consultoriaId: "co_bella_massa",
    tipo: "VISITA",
    data: atras(3, 4),
    modalidade: "PRESENCIAL",
    titulo: "Primeira visita à cozinha e ao passe",
    resumo:
      "Conheci a cozinha e acompanhei parte do serviço. Confirmei o que ele declarou: a finalização é feita de memória e varia por pessoa. Ele repetiu que não quer ouvir falar de aumento de preço antes de ver número.",
    pendencias: [
      "Ele anotar o preço de compra por duas semanas",
      "Levantar o rendimento dos 6 pratos que mais saem",
    ],
    proximaAcao: "Voltar com o custo dos dois primeiros pratos",
    registradoEm: atras(3, 3),
  },
  {
    id: "acp_bm_2",
    clienteId: "cl_bella_massa",
    consultoriaId: "co_bella_massa",
    tipo: "ANALISE",
    data: atras(9, 2),
    modalidade: "ONLINE",
    titulo: "Leitura do diagnóstico com ele",
    resumo:
      "Percorremos os blocos juntos. A prioridade ficou clara: número antes de reajuste. Combinamos que nenhuma conversa sobre preço acontece antes do custo estar na mesa.",
    pendencias: ["Montar o plano de ação"],
    proximaAcao: "Enviar o plano e marcar a visita",
    registradoEm: atras(9, 1),
  },
  {
    id: "acp_qm_1",
    clienteId: "cl_quintal_maria",
    consultoriaId: "co_quintal_maria",
    tipo: "REVISAO",
    data: atras(48, 5),
    modalidade: "ONLINE",
    titulo: "Revisão de 30 dias depois da alta",
    resumo:
      "Conferimos os 18 itens um a um. O padrão se manteve, inclusive nos dois pratos que ela achava que a equipe ia largar.",
    pendencias: [],
    proximaAcao: "Sem ação prevista — consultoria encerrada",
    registradoEm: atras(48, 4),
  },
  {
    id: "acp_qm_2",
    clienteId: "cl_quintal_maria",
    consultoriaId: "co_quintal_maria",
    tipo: "REUNIAO",
    data: atras(52, 2),
    modalidade: "ONLINE",
    titulo: "Encerramento da consultoria",
    resumo:
      "Apresentei o relatório de encerramento. Ela fechou o segundo mês sozinha e decidiu encerrar o acompanhamento.",
    pendencias: [],
    proximaAcao: "Enviar o relatório como link de leitura",
    registradoEm: atras(52, 1),
  },
];

// ---------------------------------------------------------------------------
// PROCESSOS / PRAÇAS
// ---------------------------------------------------------------------------
// `tempoEstimadoMin` é o que a EQUIPE declarou, não cronometragem. O sistema
// não mede tempo — ele guarda o que foi informado.

export const PROCESSOS: Processo[] = [
  {
    id: "pr_ev_passe",
    clienteId: "cl_emporio_verde",
    praca: "Passe / finalização quente",
    turno: "Almoço · 11h30 às 14h30",
    responsavel: "Juliana (auxiliar de cozinha)",
    pratos: [
      "Escondidinho de mandioca com carne seca",
      "Frango grelhado com legumes",
      "Estrogonofe de frango",
      "Arroz com brócolis",
    ],
    passos: [
      {
        ordem: 1,
        descricao:
          "Retirar a porção do recipiente de produção usando a concha-padrão e pesar na balança do passe.",
        responsavel: "Juliana",
        tempoEstimadoMin: 1,
      },
      {
        ordem: 2,
        descricao: "Aquecer a porção no micro-ondas por tempo fixo, no prato já montado.",
        responsavel: "Juliana",
        tempoEstimadoMin: 1,
      },
      {
        ordem: 3,
        descricao: "Finalizar com o componente frio previsto na folha de montagem do prato.",
        responsavel: "Juliana",
        tempoEstimadoMin: 1,
      },
      {
        ordem: 4,
        descricao: "Conferir contra a ficha e liberar para a expedição.",
        responsavel: "Cláudia",
        tempoEstimadoMin: 1,
      },
    ],
    observacoes:
      "Fluxo escrito depois da visita de acompanhamento. Antes dele cada pessoa montava de um jeito, e a porção variava entre os turnos.",
  },
  {
    id: "pr_ev_confeitaria",
    clienteId: "cl_emporio_verde",
    praca: "Confeitaria / sobremesas",
    turno: "Manhã · 8h às 11h",
    responsavel: "Cláudia Nogueira",
    pratos: ["Bolo de cenoura com cobertura", "Mousse de maracujá"],
    passos: [
      {
        ordem: 1,
        descricao: "Separar e pesar todos os ingredientes da receita antes de começar.",
        responsavel: "Cláudia",
        tempoEstimadoMin: 15,
      },
      {
        ordem: 2,
        descricao: "Produzir a massa conforme a ficha, na ordem dos componentes.",
        responsavel: "Cláudia",
        tempoEstimadoMin: 25,
      },
      {
        ordem: 3,
        descricao: "Porcionar no recipiente definitivo e etiquetar com a data de produção.",
        responsavel: "Cláudia",
        tempoEstimadoMin: 15,
      },
    ],
    observacoes:
      "Praça de produção da manhã, separada do passe. Quem produz não finaliza — foi decisão dela depois da análise.",
  },
  {
    id: "pr_ss_buffet",
    clienteId: "cl_sabor_serra",
    praca: "Buffet / reposição",
    turno: "Jantar · 19h às 23h",
    responsavel: "Equipe de salão + cozinha",
    pratos: [
      "Costela de porco ao molho de vinho",
      "Polenta cremosa",
      "Salada de folhas com vinagrete de mostarda",
      "Pão de alho da casa",
    ],
    passos: [
      {
        ordem: 1,
        descricao: "Repor a cuba quando ela atingir metade da capacidade — não quando esvaziar.",
        responsavel: "Salão",
        tempoEstimadoMin: 3,
      },
      {
        ordem: 2,
        descricao: "Registrar no quadro de reposição qual item foi reposto e em que horário.",
        responsavel: "Salão",
        tempoEstimadoMin: 1,
      },
      {
        ordem: 3,
        descricao: "Ao fim do serviço, pesar a sobra de cada item e anotar no quadro.",
        responsavel: "Cozinha",
        tempoEstimadoMin: 10,
      },
    ],
    observacoes:
      "O registro de reposição e de sobra é o que vai alimentar o dimensionamento. Sem ele, a decisão de quanto produzir continua por impressão.",
  },
  {
    id: "pr_bm_passe",
    clienteId: "cl_bella_massa",
    praca: "Passe / finalização de massas",
    turno: "Jantar · 19h às 23h30",
    responsavel: "A definir com o Marcelo",
    pratos: ["Fettuccine à bolonhesa", "Molho bolonhesa da casa"],
    passos: [
      {
        ordem: 1,
        descricao:
          "Cozinhar a massa fresca em água fervente e escorrer no momento do pedido.",
        responsavel: "Cozinha",
        tempoEstimadoMin: 4,
      },
      {
        ordem: 2,
        descricao: "Aquecer a porção de molho e incorporar à massa na panela.",
        responsavel: "Cozinha",
        tempoEstimadoMin: 2,
      },
      {
        ordem: 3,
        descricao:
          "Finalizar e montar no prato, conforme o padrão escrito — que ainda não existe.",
        responsavel: "A definir",
        tempoEstimadoMin: null,
      },
    ],
    observacoes:
      "Mapeado na primeira visita. O terceiro passo está sem responsável e sem tempo porque o padrão de finalização ainda está sendo escrito — é justamente o que a consultoria veio resolver.",
  },
];

// ---------------------------------------------------------------------------
// BIBLIOTECA DE INGREDIENTES
// ---------------------------------------------------------------------------
// ┌──────────────────────────────────────────────────────────────────────┐
// │ O QUE ESTA BIBLIOTECA CARREGA AGORA                                  │
// │                                                                      │
// │ Cada insumo tem quatro coisas, e cada uma responde uma pergunta:      │
// │                                                                      │
// │   · CATEGORIA e UNIDADE  — como ele é organizado e contado            │
// │   · COMPRA                — quanto se leva por vez e por quanto       │
// │   · TRANSFORMAÇÃO         — o que acontece com ele entre a compra e   │
// │                             o prato, em pesos que alguém mediu        │
// │   · HISTÓRICO             — o preço, com data e fornecedor            │
// │                                                                      │
// │ A TRANSFORMAÇÃO ESTÁ PREENCHIDA EM POUCOS, E ISSO É O DADO.           │
// │                                                                      │
// │ Só os insumos que passam por limpeza ou cocção têm pesos medidos. O   │
// │ queijo, a farinha e o azeite não têm — não porque faltou tempo de     │
// │ preencher, mas porque não há perda a medir: o que se compra é o que   │
// │ se usa. Para esses, o custo por quilo é o preço da nota, e o sistema  │
// │ mostra exatamente isso, sem inventar rendimento de 100%.              │
// │                                                                      │
// │ Onde há medição, ela é o que a CONSULTORIA registrou numa visita —    │
// │ não um valor de tabela. Os três números da batata (5,000 / 4,500 /    │
// │ 4,000) são da visita ao Empório Verde, e é por isso que a ficha do    │
// │ escondidinho consegue mostrar o custo por quilo preparado.            │
// │                                                                      │
// │ ┌────────────────────────────────────────────────────────────────┐   │
// │ │ O CASO DA BATATA, MARCADO COMO O QUE É                          │   │
// │ │                                                                │   │
// │ │ A batata é a demonstração de referência desta fase: 5 kg de     │   │
// │ │ compra, 4,5 kg depois de descascar, 4 kg depois de cozinhar.    │   │
// │ │ Ela existe para provar que a conta fecha — 10% de perda na      │   │
// │ │ limpeza, 80% de rendimento final — e NÃO para virar regra.      │   │
// │ │                                                                │   │
// │ │ Nenhuma outra linha desta biblioteca foi preenchida por          │   │
// │ │ semelhança com ela. Cada peso aqui é uma medição própria.        │   │
// │ └────────────────────────────────────────────────────────────────┘   │
// └──────────────────────────────────────────────────────────────────────┘

type OrigemPreco = PrecoIngrediente["origem"];

type EntradaPreco = {
  valor: number;
  fornecedor: string;
  /** Dias atrás. 0 = hoje. */
  dias: number;
  origem?: OrigemPreco;
};

/** Uma etapa medida, na forma curta que este arquivo usa para escrevê-la. */
type EtapaMedida = { peso: number; unidade: string };

type PesosDaTransformacao = {
  bruto?: EtapaMedida;
  limpo?: EtapaMedida;
  preparado?: EtapaMedida;
  observacao?: string;
};

/**
 * Monta o ingrediente a partir do histórico.
 *
 * `precoAtual` e `atualizadoEm` são DERIVADOS da primeira entrada, não
 * digitados de novo. Um ingrediente cujo preço atual discordasse do topo do
 * próprio histórico seria um bug silencioso esperando para aparecer na tela.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `compra` É DERIVADA, E NÃO DIGITADA                          │
 * │                                                                      │
 * │ Seria tentador escrever `valorTotal` à mão em cada ingrediente. Só    │
 * │ que aí o preço unitário teria DUAS fontes: o topo do histórico e a    │
 * │ divisão da compra. No dia em que o preço subisse, uma delas ficaria   │
 * │ para trás — e a contagem do ingrediente discordaria do custo da       │
 * │ ficha que o usa, com os dois números parecendo certos.                │
 * │                                                                      │
 * │ Então a compra é montada a partir do preço vigente: quem informa a    │
 * │ QUANTIDADE comprada (5 kg, 1 caixa, 30 dúzias) é este arquivo; quem   │
 * │ informa o VALOR UNITÁRIO é o histórico. `valorTotal` é o produto dos  │
 * │ dois, e por isso não pode divergir deles.                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function ingrediente(
  id: string,
  nome: string,
  categoria: string,
  unidade: string,
  atual: EntradaPreco,
  anteriores: EntradaPreco[],
  extras: {
    /** Quanto se compra por vez, na unidade do preço. `null` = não declarado. */
    compra?: { quantidade: number; unidade: string } | null;
    transformacao?: PesosDaTransformacao;
    observacoes?: string;
  } = {}
): Ingrediente {
  const historico: PrecoIngrediente[] = [atual, ...anteriores]
    .map((e, i) => ({
      id: `${id}_p${i + 1}`,
      em: atras(e.dias),
      valor: e.valor,
      unidade,
      fornecedor: e.fornecedor,
      origem: e.origem ?? ("CONSULTORA" as OrigemPreco),
    }))
    .sort((a, b) => b.em.getTime() - a.em.getTime());

  const vigente = historico[0];

  const compra: Compra | null = extras.compra
    ? {
        quantidade: extras.compra.quantidade,
        unidade: extras.compra.unidade,
        valorTotal: Number((extras.compra.quantidade * atual.valor).toFixed(2)),
      }
    : null;

  return {
    id,
    nome,
    categoria,
    unidade,
    compra,
    transformacao: {
      bruto: extras.transformacao?.bruto ?? null,
      limpo: extras.transformacao?.limpo ?? null,
      preparado: extras.transformacao?.preparado ?? null,
      observacao: extras.transformacao?.observacao ?? "",
    },
    observacoes: extras.observacoes ?? "",
    precoAtual: vigente ? vigente.valor : null,
    atualizadoEm: vigente ? vigente.em : AGORA,
    fornecedor: vigente ? vigente.fornecedor : "",
    historico,
  };
}

const DISTRIBUIDORA = "Distribuidora Central";
const HORTIFRUTI = "Hortifrúti do Mercado";
const ATACADO = "Atacado Bom Preço";

/** Atalhos de peso, para as linhas com medição ficarem legíveis. */
const kg = (peso: number): EtapaMedida => ({ peso, unidade: "kg" });
const maco = (peso: number): EtapaMedida => ({ peso, unidade: "maço" });

export const INGREDIENTES: Ingrediente[] = [
  // ---- Farináceos e mercearia --------------------------------------------
  ingrediente(
    "in_farinha_trigo",
    "Farinha de trigo tipo 1",
    "Farináceos",
    "kg",
    { valor: 4.89, fornecedor: ATACADO, dias: 12 },
    [
      { valor: 4.59, fornecedor: ATACADO, dias: 46 },
      { valor: 4.35, fornecedor: ATACADO, dias: 88 },
    ],
    {
      compra: { quantidade: 5, unidade: "kg" },
      observacoes: "Insumo de prateleira. Entra na receita pelo peso da embalagem, sem etapa de limpeza.",
    }
  ),
  ingrediente(
    "in_arroz",
    "Arroz branco tipo 1",
    "Mercearia",
    "kg",
    { valor: 6.3, fornecedor: ATACADO, dias: 15 },
    [{ valor: 6.9, fornecedor: ATACADO, dias: 52 }],
    {
      compra: { quantidade: 5, unidade: "kg" },
      observacoes: "O grão ganha peso na cocção. O peso cozido ainda não foi medido nesta cozinha.",
    }
  ),
  ingrediente(
    "in_feijao",
    "Feijão preto",
    "Mercearia",
    "kg",
    { valor: 8.9, fornecedor: ATACADO, dias: 15 },
    [{ valor: 8.2, fornecedor: ATACADO, dias: 50 }],
    {
      compra: { quantidade: 5, unidade: "kg" },
      observacoes: "Remolho e cocção aumentam o peso. Sem uma medição, o sistema não estima o rendimento.",
    }
  ),
  ingrediente(
    "in_quinoa",
    "Quinoa em grãos",
    "Mercearia",
    "kg",
    { valor: 32.0, fornecedor: ATACADO, dias: 43 },
    [{ valor: 29.9, fornecedor: ATACADO, dias: 96 }],
    {
      compra: { quantidade: 1, unidade: "kg" },
      observacoes: "Lavada antes de cozinhar. O peso escorrido depois da cocção ainda não foi medido.",
    }
  ),
  ingrediente(
    "in_chocolate",
    "Chocolate meio amargo",
    "Mercearia",
    "kg",
    { valor: 46.0, fornecedor: ATACADO, dias: 37 },
    [
      { valor: 52.8, fornecedor: ATACADO, dias: 68 },
      { valor: 48.0, fornecedor: ATACADO, dias: 104 },
    ],
    {
      compra: { quantidade: 5, unidade: "kg" },
      observacoes: "Derretido em banho-maria. Não há perda de peso a medir no derretimento.",
    }
  ),
  ingrediente(
    "in_azeite",
    "Azeite de oliva extravirgem",
    "Mercearia",
    "L",
    { valor: 47.9, fornecedor: ATACADO, dias: 29 },
    [
      { valor: 44.9, fornecedor: ATACADO, dias: 70 },
      { valor: 42.5, fornecedor: ATACADO, dias: 112 },
    ],
    {
      compra: { quantidade: 1, unidade: "L" },
      observacoes: "O volume comprado é o volume usado. Não há limpeza nem cocção a medir.",
    }
  ),
  ingrediente(
    "in_polvilho",
    "Fubá para polenta",
    "Mercearia",
    "kg",
    { valor: 5.8, fornecedor: ATACADO, dias: 24 },
    [{ valor: 5.2, fornecedor: ATACADO, dias: 61 }],
    {
      compra: { quantidade: 5, unidade: "kg" },
      observacoes: "Entra seco na receita e absorve o caldo na cocção — o peso final depende do caldo, não do fubá.",
    }
  ),
  ingrediente(
    "in_ovos",
    "Ovos brancos",
    "Laticínios",
    "dúzia",
    { valor: 9.8, fornecedor: ATACADO, dias: 11 },
    [
      { valor: 8.4, fornecedor: ATACADO, dias: 33 },
      { valor: 7.9, fornecedor: ATACADO, dias: 68 },
    ],
    {
      compra: { quantidade: 30, unidade: "dúzia" },
      observacoes: "Comprados em caixa fechada de 30 dúzias. Contados por unidade, não pesados.",
    }
  ),

  // ---- Hortifrúti ---------------------------------------------------------
  ingrediente(
    "in_batata",
    "Batata inglesa",
    "Hortifrúti",
    "kg",
    { valor: 6.1, fornecedor: HORTIFRUTI, dias: 2 },
    [
      { valor: 5.4, fornecedor: HORTIFRUTI, dias: 24 },
      { valor: 7.2, fornecedor: HORTIFRUTI, dias: 62 },
    ],
    {
      compra: { quantidade: 5, unidade: "kg" },
      transformacao: {
        bruto: kg(5),
        limpo: kg(4.5),
        preparado: kg(4),
        observacao:
          "Medição de demonstração, feita na visita ao Empório Verde: 5 kg como veio, 4,5 kg depois de descascar e 4 kg depois de cozinhar e escorrer.",
      },
      observacoes:
        "É a linha de referência desta fase. Os pesos são desta cozinha, medidos uma vez — não um valor de tabela para batata em geral.",
    }
  ),
  ingrediente(
    "in_mandioca",
    "Mandioca descascada",
    "Hortifrúti",
    "kg",
    { valor: 7.6, fornecedor: HORTIFRUTI, dias: 2 },
    [{ valor: 6.9, fornecedor: HORTIFRUTI, dias: 20 }],
    {
      compra: { quantidade: 10, unidade: "kg" },
      transformacao: {
        bruto: kg(5),
        limpo: kg(3.65),
        preparado: kg(3),
        observacao:
          "Pesada antes de descascar, depois de descascar e depois de cozinhar e escorrer na peneira.",
      },
      observacoes:
        "A casca grossa responde pela maior parte da perda. É o insumo que mais pesa no custo do escondidinho.",
    }
  ),
  ingrediente(
    "in_cenoura",
    "Cenoura",
    "Hortifrúti",
    "kg",
    { valor: 4.7, fornecedor: HORTIFRUTI, dias: 2 },
    [{ valor: 5.9, fornecedor: HORTIFRUTI, dias: 18 }],
    {
      compra: { quantidade: 10, unidade: "kg" },
      transformacao: {
        bruto: kg(5),
        limpo: kg(4.4),
        preparado: kg(4),
        observacao: "Descascada e aparada, e depois assada em corte rústico.",
      },
      observacoes: "É usada crua em uma ficha e assada em outra — o rendimento medido é o assado.",
    }
  ),
  ingrediente(
    "in_cebola",
    "Cebola",
    "Hortifrúti",
    "kg",
    { valor: 5.2, fornecedor: HORTIFRUTI, dias: 2 },
    [
      { valor: 4.6, fornecedor: HORTIFRUTI, dias: 21 },
      { valor: 6.1, fornecedor: HORTIFRUTI, dias: 55 },
    ],
    {
      compra: { quantidade: 10, unidade: "kg" },
      transformacao: {
        bruto: kg(5),
        limpo: kg(4.3),
        observacao: "Pesada em uma caixa, antes e depois de descascar e retirar as pontas.",
      },
      observacoes: "Entra em quase todas as fichas como base de refogado.",
    }
  ),
  ingrediente(
    "in_alho",
    "Alho",
    "Hortifrúti",
    "kg",
    { valor: 21.0, fornecedor: HORTIFRUTI, dias: 21 },
    [{ valor: 19.4, fornecedor: HORTIFRUTI, dias: 60 }],
    {
      compra: { quantidade: 1, unidade: "kg" },
      transformacao: {
        bruto: kg(1),
        limpo: kg(0.88),
        observacao: "Pesado antes e depois de descascar, em uma caixa de 1 kg.",
      },
      observacoes: "A perda é casca. O custo por quilo limpo é o número que interessa na ficha.",
    }
  ),
  ingrediente(
    "in_tomate_italiano",
    "Tomate italiano",
    "Hortifrúti",
    "kg",
    { valor: 8.45, fornecedor: HORTIFRUTI, dias: 2 },
    [
      { valor: 9.8, fornecedor: HORTIFRUTI, dias: 16 },
      { valor: 7.4, fornecedor: HORTIFRUTI, dias: 44 },
    ],
    {
      compra: { quantidade: 10, unidade: "kg" },
      transformacao: {
        bruto: kg(5),
        limpo: kg(4.6),
        observacao: "Retirada do pedúnculo e das partes machucadas. Não passa por cocção antes do uso.",
      },
      observacoes: "O preço oscila mais que o dos outros hortifrútis — são três preços no histórico.",
    }
  ),
  ingrediente(
    "in_banana",
    "Banana prata",
    "Hortifrúti",
    "kg",
    { valor: 4.2, fornecedor: HORTIFRUTI, dias: 2 },
    [
      { valor: 5.1, fornecedor: HORTIFRUTI, dias: 15 },
      { valor: 6.3, fornecedor: HORTIFRUTI, dias: 48 },
    ],
    {
      compra: { quantidade: 10, unidade: "kg" },
      transformacao: {
        bruto: kg(5),
        limpo: kg(4.6),
        observacao: "Peso da polpa medido depois de descascar, em uma caixa de 5 kg.",
      },
      observacoes: "O rendimento depende do grau de maturação do lote — por isso a medição está datada.",
    }
  ),
  ingrediente(
    "in_manjericao",
    "Manjericão fresco",
    "Hortifrúti",
    "maço",
    { valor: 3.5, fornecedor: HORTIFRUTI, dias: 2 },
    [{ valor: 3.2, fornecedor: HORTIFRUTI, dias: 19 }],
    {
      compra: { quantidade: 10, unidade: "maço" },
      transformacao: {
        bruto: maco(10),
        limpo: maco(9),
        observacao: "Contado em maços, não pesado: os talos são retirados antes de usar.",
      },
      observacoes:
        "O único insumo contado em maço. A conta aqui é por unidade — não há conversão de maço para quilo.",
    }
  ),

  // ---- Carnes -------------------------------------------------------------
  ingrediente(
    "in_frango_peito",
    "Peito de frango",
    "Carnes",
    "kg",
    { valor: 19.8, fornecedor: DISTRIBUIDORA, dias: 5 },
    [
      { valor: 21.3, fornecedor: DISTRIBUIDORA, dias: 26 },
      { valor: 18.6, fornecedor: DISTRIBUIDORA, dias: 64 },
    ],
    {
      compra: { quantidade: 5, unidade: "kg" },
      transformacao: {
        bruto: kg(2.5),
        limpo: kg(2.4),
        preparado: kg(1.75),
        observacao:
          "Aparado antes de grelhar e pesado depois de descansar cinco minutos na chapa.",
      },
      observacoes:
        "É a maior perda da biblioteca, e é cocção: a água que sai na chapa. Nenhuma tabela preveria isso para esta chapa.",
    }
  ),
  ingrediente(
    "in_carne_moida",
    "Carne moída (patinho)",
    "Carnes",
    "kg",
    { valor: 38.9, fornecedor: DISTRIBUIDORA, dias: 5 },
    [
      { valor: 36.4, fornecedor: DISTRIBUIDORA, dias: 34 },
      { valor: 35.9, fornecedor: DISTRIBUIDORA, dias: 76 },
    ],
    {
      compra: { quantidade: 5, unidade: "kg" },
      observacoes:
        "Moída no balcão antes de sair da loja: chega pronta para a panela e não passa por limpeza na cozinha.",
    }
  ),
  ingrediente(
    "in_carne_seca",
    "Carne seca desfiada",
    "Carnes",
    "kg",
    { valor: 64.5, fornecedor: DISTRIBUIDORA, dias: 20 },
    [{ valor: 61.0, fornecedor: DISTRIBUIDORA, dias: 58 }],
    {
      compra: { quantidade: 2, unidade: "kg" },
      transformacao: {
        bruto: kg(2),
        limpo: kg(1.8),
        preparado: kg(1.2),
        observacao:
          "Dessalgada em três águas, cozida sob pressão e desfiada. Peso medido depois de esfriar.",
      },
      observacoes:
        "O insumo mais caro da biblioteca, e o que mais perde peso. É a razão de o escondidinho precisar de ficha.",
    }
  ),
  ingrediente(
    "in_costela",
    "Costela de porco",
    "Carnes",
    "kg",
    { valor: 27.5, fornecedor: DISTRIBUIDORA, dias: 24 },
    [{ valor: 25.4, fornecedor: DISTRIBUIDORA, dias: 66 }],
    {
      compra: { quantidade: 15, unidade: "kg" },
      transformacao: {
        bruto: kg(5),
        limpo: kg(4.7),
        preparado: kg(3.6),
        observacao:
          "Aparada e depois assada lentamente; pesada sem o osso e sem a gordura que escorreu.",
      },
      observacoes: "O osso sai do peso: o que entra no prato é a carne que sobra dele.",
    }
  ),

  // ---- Laticínios ---------------------------------------------------------
  ingrediente(
    "in_queijo_mussarela",
    "Queijo mussarela",
    "Laticínios",
    "kg",
    { valor: 42.9, fornecedor: DISTRIBUIDORA, dias: 9 },
    [
      { valor: 39.5, fornecedor: DISTRIBUIDORA, dias: 40 },
      { valor: 41.2, fornecedor: DISTRIBUIDORA, dias: 82 },
    ],
    {
      compra: { quantidade: 4, unidade: "kg" },
      transformacao: {
        bruto: kg(3),
        limpo: kg(2.88),
        observacao: "Aparada das bordas mais duras, medida em um bloco de 3 kg.",
      },
      observacoes: "Derrete nas montagens, mas não se pesa queijo derretido na bandeja.",
    }
  ),
  ingrediente(
    "in_manteiga",
    "Manteiga sem sal",
    "Laticínios",
    "kg",
    { valor: 58.0, fornecedor: DISTRIBUIDORA, dias: 33 },
    [{ valor: 54.5, fornecedor: DISTRIBUIDORA, dias: 74 }],
    {
      compra: { quantidade: 1, unidade: "kg" },
      observacoes:
        "O segundo insumo mais caro por quilo. Entra em purês e coberturas, e é onde a porção pequena esconde o custo.",
    }
  ),
  ingrediente(
    "in_leite",
    "Leite integral",
    "Laticínios",
    "L",
    { valor: 5.4, fornecedor: DISTRIBUIDORA, dias: 33 },
    [{ valor: 4.9, fornecedor: DISTRIBUIDORA, dias: 71 }],
    {
      compra: { quantidade: 12, unidade: "L" },
      observacoes: "Comprado em caixa de 12 litros. Reduz na cocção, e a redução não foi medida.",
    }
  ),
  ingrediente(
    "in_creme_leite",
    "Creme de leite",
    "Laticínios",
    "L",
    { valor: 12.9, fornecedor: DISTRIBUIDORA, dias: 37 },
    [{ valor: 11.6, fornecedor: DISTRIBUIDORA, dias: 79 }],
    {
      compra: { quantidade: 12, unidade: "L" },
      observacoes: "Comprado em caixa fechada e usado por litro. Não passa por limpeza.",
    }
  ),
];

// ---------------------------------------------------------------------------
// PREÇO POR CLIENTE
// ---------------------------------------------------------------------------
// ┌──────────────────────────────────────────────────────────────────────┐
// │ POR QUE O PREÇO DO CLIENTE SAI DESTA BIBLIOTECA                       │
// │                                                                      │
// │ `INGREDIENTES` guarda o preço de REFERÊNCIA — o que a consultora      │
// │ anota quando não sabe quem comprou. É o padrão da biblioteca.         │
// │                                                                      │
// │ O preço que VALE na ficha é outro: é o que aquele cliente pagou. O    │
// │ Empório Verde compra no hortifrúti da esquina; o Sabor da Serra       │
// │ compra no atacado, com nota. A batata é a mesma, o preço não.         │
// │                                                                      │
// │ Se o preço do cliente morasse na biblioteca, o custo de um prato do   │
// │ Sabor da Serra sairia com o preço do Empório — e o número sairia com  │
// │ aparência perfeitamente normal.                                       │
// │                                                                      │
// │ ┌────────────────────────────────────────────────────────────────┐   │
// │ │ O QUE ESTE BLOCO DELIBERADAMENTE NÃO FAZ                       │   │
// │ │                                                                │   │
// │ │ Não há entrada para todos os insumos de todos os clientes. O    │   │
// │ │ que não está aqui cai para o preço de referência da biblioteca, │   │
// │ │ e a tela diz que foi esse o usado — com `origemDoPreco`.        │   │
// │ │                                                                │   │
// │ │ Preencher as 24 linhas para os 4 clientes faria a demonstração  │   │
// │ │ parecer um cadastro completo, quando o que ela mostra é que     │   │
// │ │ FALTA preço de cliente registrado. A ausência é o dado.         │   │
// │ └────────────────────────────────────────────────────────────────┘   │
// └──────────────────────────────────────────────────────────────────────┘

type EntradaDeCliente = {
  ingredienteId: string;
  /** O preço que ESTE cliente paga. O histórico é montado a partir daqui. */
  atual: EntradaPreco;
  anteriores: EntradaPreco[];
  observacoes?: string;
};

/**
 * Monta os registros de preço de um cliente.
 *
 * A unidade nunca é digitada aqui: ela vem do insumo na biblioteca. Um preço
 * de cliente em unidade diferente da biblioteca seria uma conversão silenciosa
 * — e o sistema não converte nada sem que alguém tenha medido.
 */
function precosDoCliente(clienteId: string, entradas: EntradaDeCliente[]): IngredienteDoCliente[] {
  return entradas.map((e) => {
    const base = INGREDIENTES.find((i) => i.id === e.ingredienteId);
    const unidade = base?.unidade ?? "";

    const historico: PrecoIngrediente[] = [e.atual, ...e.anteriores]
      .map((p, i) => ({
        id: `${clienteId}_${e.ingredienteId}_p${i + 1}`,
        em: atras(p.dias),
        valor: p.valor,
        unidade,
        fornecedor: p.fornecedor,
        origem: p.origem ?? ("CLIENTE" as OrigemPreco),
      }))
      .sort((a, b) => b.em.getTime() - a.em.getTime());

    const vigente = historico[0];

    return {
      id: `${clienteId}_${e.ingredienteId}`,
      clienteId,
      ingredienteId: e.ingredienteId,
      precoAtual: vigente ? vigente.valor : null,
      unidade,
      fornecedor: vigente ? vigente.fornecedor : "",
      atualizadoEm: vigente ? vigente.em : AGORA,
      historico,
      observacoes: e.observacoes ?? "",
    };
  });
}

const MERCADO_BAIRRO = "Mercado do Bairro";
const ATACADO_INTERIOR = "Atacado do Interior";
const DOCE_FORNECEDOR = "Doce & Cia Atacado";

export const INGREDIENTES_DO_CLIENTE: IngredienteDoCliente[] = [
  /*
    ── EMPÓRIO VERDE ─────────────────────────────────────────────────────
    Compra no varejo do bairro e em quantidade pequena, duas vezes por
    semana. É o cliente com o preço mais alto — e é justamente o que a
    consultoria está tentando mostrar a ele.
  */
  ...precosDoCliente("cl_emporio_verde", [
    {
      ingredienteId: "in_batata",
      atual: { valor: 6.1, fornecedor: MERCADO_BAIRRO, dias: 2 },
      anteriores: [
        { valor: 5.9, fornecedor: MERCADO_BAIRRO, dias: 26 },
        { valor: 7.4, fornecedor: MERCADO_BAIRRO, dias: 63 },
      ],
      observacoes: "Comprada em saco de 5 kg, duas vezes por semana.",
    },
    {
      ingredienteId: "in_mandioca",
      atual: { valor: 7.6, fornecedor: MERCADO_BAIRRO, dias: 2 },
      anteriores: [{ valor: 7.1, fornecedor: MERCADO_BAIRRO, dias: 23 }],
    },
    {
      ingredienteId: "in_carne_seca",
      atual: { valor: 64.5, fornecedor: MERCADO_BAIRRO, dias: 20 },
      anteriores: [{ valor: 62.0, fornecedor: MERCADO_BAIRRO, dias: 55 }],
      observacoes: "Comprada já desfiada, em bandeja de 1 kg.",
    },
    {
      ingredienteId: "in_queijo_mussarela",
      atual: { valor: 44.9, fornecedor: MERCADO_BAIRRO, dias: 9 },
      anteriores: [{ valor: 41.5, fornecedor: MERCADO_BAIRRO, dias: 42 }],
      observacoes: "Mais caro que a referência do atacado — é a diferença que a ficha vai mostrar.",
    },
    {
      ingredienteId: "in_manteiga",
      atual: { valor: 58.0, fornecedor: MERCADO_BAIRRO, dias: 33 },
      anteriores: [{ valor: 55.0, fornecedor: MERCADO_BAIRRO, dias: 76 }],
    },
    {
      ingredienteId: "in_frango_peito",
      atual: { valor: 19.8, fornecedor: MERCADO_BAIRRO, dias: 5 },
      anteriores: [{ valor: 21.9, fornecedor: MERCADO_BAIRRO, dias: 28 }],
    },
  ]),

  /*
    ── SABOR DA SERRA ────────────────────────────────────────────────────
    Compra no atacado do interior, em volume, com nota. Preços abaixo dos
    do Empório em quase todas as linhas — o que reforça que a diferença de
    custo entre os dois não vem da ficha: vem da compra.
  */
  ...precosDoCliente("cl_sabor_serra", [
    {
      ingredienteId: "in_costela",
      atual: { valor: 25.4, fornecedor: ATACADO_INTERIOR, dias: 24 },
      anteriores: [{ valor: 23.9, fornecedor: ATACADO_INTERIOR, dias: 69 }],
      observacoes: "Comprada em caixa fechada de 15 kg, no início do mês.",
    },
    {
      ingredienteId: "in_cebola",
      atual: { valor: 4.55, fornecedor: ATACADO_INTERIOR, dias: 3 },
      anteriores: [
        { valor: 4.2, fornecedor: ATACADO_INTERIOR, dias: 24 },
        { valor: 5.6, fornecedor: ATACADO_INTERIOR, dias: 58 },
      ],
      observacoes: "Saco de 20 kg, dividido entre a cozinha e o buffet.",
    },
    {
      ingredienteId: "in_alho",
      atual: { valor: 18.9, fornecedor: ATACADO_INTERIOR, dias: 22 },
      anteriores: [{ valor: 17.5, fornecedor: ATACADO_INTERIOR, dias: 63 }],
    },
    {
      ingredienteId: "in_arroz",
      atual: { valor: 5.75, fornecedor: ATACADO_INTERIOR, dias: 16 },
      anteriores: [{ valor: 6.4, fornecedor: ATACADO_INTERIOR, dias: 54 }],
    },
  ]),

  /*
    ── DOCE PONTO ────────────────────────────────────────────────────────
    Confeitaria, e por isso o que importa aqui é mercearia e laticínio. O
    chocolate mudou de fornecedor no mês passado — a ficha do brownie
    registra isso no próprio histórico.
  */
  ...precosDoCliente("cl_doce_ponto", [
    {
      ingredienteId: "in_chocolate",
      atual: { valor: 44.5, fornecedor: DOCE_FORNECEDOR, dias: 6 },
      anteriores: [
        { valor: 51.0, fornecedor: ATACADO, dias: 65 },
        { valor: 47.5, fornecedor: ATACADO, dias: 102 },
      ],
      observacoes: "Fornecedor trocado: a barra de 5 kg agora vem da Doce & Cia.",
    },
    {
      ingredienteId: "in_manteiga",
      atual: { valor: 56.4, fornecedor: DOCE_FORNECEDOR, dias: 33 },
      anteriores: [{ valor: 53.2, fornecedor: DOCE_FORNECEDOR, dias: 78 }],
    },
    {
      ingredienteId: "in_farinha_trigo",
      atual: { valor: 4.62, fornecedor: DOCE_FORNECEDOR, dias: 12 },
      anteriores: [{ valor: 4.4, fornecedor: DOCE_FORNECEDOR, dias: 49 }],
      observacoes: "Comprada em saco de 5 kg, junto com o açúcar.",
    },
    {
      ingredienteId: "in_ovos",
      atual: { valor: 9.8, fornecedor: DOCE_FORNECEDOR, dias: 11 },
      anteriores: [{ valor: 8.9, fornecedor: DOCE_FORNECEDOR, dias: 35 }],
    },
    {
      ingredienteId: "in_leite",
      atual: { valor: 5.25, fornecedor: DOCE_FORNECEDOR, dias: 33 },
      anteriores: [{ valor: 4.85, fornecedor: DOCE_FORNECEDOR, dias: 74 }],
    },
    {
      ingredienteId: "in_cenoura",
      atual: { valor: 4.7, fornecedor: HORTIFRUTI, dias: 2 },
      anteriores: [{ valor: 5.7, fornecedor: HORTIFRUTI, dias: 20 }],
    },
  ]),

  /*
    ── BELLA MASSA ───────────────────────────────────────────────────────
    Massa fresca e molho. Compra proteína e tomate em volume, e é o cliente
    cuja ficha mais depende de preço atualizado — carne e tomate são os dois
    insumos que mais oscilam no histórico.
  */
  ...precosDoCliente("cl_bella_massa", [
    {
      ingredienteId: "in_carne_moida",
      atual: { valor: 37.9, fornecedor: ATACADO_INTERIOR, dias: 5 },
      anteriores: [
        { valor: 35.8, fornecedor: ATACADO_INTERIOR, dias: 36 },
        { valor: 35.2, fornecedor: ATACADO_INTERIOR, dias: 79 },
      ],
      observacoes: "Moída na hora, no balcão do atacado.",
    },
    {
      ingredienteId: "in_tomate_italiano",
      atual: { valor: 7.9, fornecedor: ATACADO_INTERIOR, dias: 3 },
      anteriores: [
        { valor: 9.4, fornecedor: ATACADO_INTERIOR, dias: 18 },
        { valor: 7.1, fornecedor: ATACADO_INTERIOR, dias: 46 },
      ],
      observacoes: "Caixa de 20 kg, comprada conforme a cotação da semana.",
    },
    {
      ingredienteId: "in_farinha_trigo",
      atual: { valor: 4.75, fornecedor: ATACADO_INTERIOR, dias: 12 },
      anteriores: [{ valor: 4.5, fornecedor: ATACADO_INTERIOR, dias: 48 }],
    },
    {
      ingredienteId: "in_ovos",
      atual: { valor: 9.4, fornecedor: ATACADO_INTERIOR, dias: 11 },
      anteriores: [{ valor: 8.2, fornecedor: ATACADO_INTERIOR, dias: 34 }],
    },
    {
      ingredienteId: "in_cebola",
      atual: { valor: 4.95, fornecedor: ATACADO_INTERIOR, dias: 3 },
      anteriores: [{ valor: 4.4, fornecedor: ATACADO_INTERIOR, dias: 22 }],
    },
    {
      ingredienteId: "in_alho",
      atual: { valor: 20.5, fornecedor: ATACADO_INTERIOR, dias: 21 },
      anteriores: [{ valor: 18.8, fornecedor: ATACADO_INTERIOR, dias: 62 }],
    },
    {
      ingredienteId: "in_azeite",
      atual: { valor: 46.5, fornecedor: ATACADO_INTERIOR, dias: 30 },
      anteriores: [{ valor: 43.8, fornecedor: ATACADO_INTERIOR, dias: 72 }],
    },
  ]),

  /*
    ── QUINTAL DA MARIA ──────────────────────────────────────────────────
    Consultoria já encerrada. Os preços continuam sendo alimentados por ela,
    e é por isso que estas linhas existem: um cliente encerrado não deixa de
    ter custo, ele deixa de ter acompanhamento.
  */
  ...precosDoCliente("cl_quintal_maria", [
    {
      ingredienteId: "in_frango_peito",
      atual: { valor: 20.4, fornecedor: MERCADO_BAIRRO, dias: 5 },
      anteriores: [
        { valor: 21.8, fornecedor: MERCADO_BAIRRO, dias: 27 },
        { valor: 19.2, fornecedor: MERCADO_BAIRRO, dias: 66 },
      ],
      observacoes: "Frango caipira, comprado direto do produtor da região.",
    },
    {
      ingredienteId: "in_polvilho",
      atual: { valor: 5.4, fornecedor: ATACADO_INTERIOR, dias: 25 },
      anteriores: [{ valor: 5.0, fornecedor: ATACADO_INTERIOR, dias: 63 }],
    },
    {
      ingredienteId: "in_batata",
      atual: { valor: 5.85, fornecedor: MERCADO_BAIRRO, dias: 2 },
      anteriores: [{ valor: 5.2, fornecedor: MERCADO_BAIRRO, dias: 25 }],
    },
    {
      ingredienteId: "in_manteiga",
      atual: { valor: 57.2, fornecedor: MERCADO_BAIRRO, dias: 34 },
      anteriores: [{ valor: 54.0, fornecedor: MERCADO_BAIRRO, dias: 75 }],
    },
    {
      ingredienteId: "in_cebola",
      atual: { valor: 4.9, fornecedor: MERCADO_BAIRRO, dias: 3 },
      anteriores: [{ valor: 4.5, fornecedor: MERCADO_BAIRRO, dias: 23 }],
    },
  ]),
];

// ---------------------------------------------------------------------------
// FICHAS TÉCNICAS
// ---------------------------------------------------------------------------
// ┌──────────────────────────────────────────────────────────────────────┐
// │ O QUE MUDOU AQUI, E POR QUE A FICHA SAIU MAIS HONESTA                 │
// │                                                                      │
// │ Antes, cada item carregava `custo: null` — o registro de que a conta  │
// │ não podia ser feita. Agora ele carrega `etapa`, e a diferença é a     │
// │ diferença entre não calcular e calcular direito.                     │
// │                                                                      │
// │ `etapa` responde a pergunta que faltava: "1,200 kg de mandioca" é     │
// │ quilo comprado, quilo descascado ou quilo cozido? As três respostas   │
// │ dão custos diferentes para a mesma linha, e quem sabe é a cozinha.    │
// │ Com a etapa declarada, o sistema só precisa multiplicar.              │
// │                                                                      │
// │ Não existe mais campo de custo nenhum, e isso é intencional: o custo  │
// │ é DERIVADO de `quantidade × custo unitário da etapa`, em ./custos.    │
// │ Guardá-lo seria manter duas fontes para o mesmo número.               │
// │                                                                      │
// │ AS OBSERVAÇÕES DE LINHA SÃO O OUTRO GANHO.                           │
// │                                                                      │
// │ Cada item pode trazer uma frase do que a cozinha anotou sobre ele —   │
// │ corte, marca, substituição. É o que impede a ficha de virar uma       │
// │ tabela de números sem explicação.                                     │
// │                                                                      │
// │ O QUE CONTINUA FORA: preço de venda, CMV alvo, margem e markup. A     │
// │ ficha calcula o que o prato CUSTA. O que cobrar por ele é a decisão   │
// │ que ainda não foi tomada — e por isso não aparece.                    │
// └──────────────────────────────────────────────────────────────────────┘

export const FICHAS: Ficha[] = [
  // ---- Empório Verde ------------------------------------------------------
  {
    id: "fi_ev_escondidinho",
    clienteId: "cl_emporio_verde",
    nome: "Escondidinho de mandioca com carne seca",
    categoria: "Prato principal",
    rendimentoPorcoes: 12,
    porcaoGramas: 320,
    itens: [
      { ingredienteId: "in_mandioca", quantidade: "1,200", unidade: "kg", precoReferencia: 7.6, etapa: "PREPARADO", observacao: "Peso do purê já cozido e amassado." },
      { ingredienteId: "in_carne_seca", quantidade: "0,600", unidade: "kg", precoReferencia: 64.5, etapa: "PREPARADO", observacao: "Peso depois de dessalgada, cozida e desfiada." },
      { ingredienteId: "in_leite", quantidade: "0,300", unidade: "L", precoReferencia: 5.4, etapa: "COMPRA", observacao: "Medido na jarra, do litro aberto." },
      { ingredienteId: "in_manteiga", quantidade: "0,060", unidade: "kg", precoReferencia: 58.0, etapa: "COMPRA", observacao: "Pesada na balança de bancada." },
      { ingredienteId: "in_cebola", quantidade: "0,150", unidade: "kg", precoReferencia: 5.2, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_alho", quantidade: "0,020", unidade: "kg", precoReferencia: 21.0, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_queijo_mussarela", quantidade: "0,180", unidade: "kg", precoReferencia: 42.9, etapa: "COMPRA", observacao: "" },
    ],
    modoPreparo: [
      "Cozinhar a mandioca descascada em água com sal até ficar macia.",
      "Amassar ainda quente e incorporar o leite e a manteiga até formar um purê homogêneo.",
      "Refogar a cebola e o alho, acrescentar a carne seca desfiada e deixar apurar.",
      "Montar em recipiente de porcionamento, com a carne no centro e o purê cobrindo.",
    ],
    finalizacao: [
      "Cobrir com a mussarela e levar ao forno até dourar.",
      "Porcionar com a concha-padrão e pesar na balança do passe.",
    ],
    observacoes:
      "Rendimento declarado pela produção. O peso da porção foi conferido na visita ao passe, e a variação entre os turnos é o que a folha de montagem veio resolver.",
    situacao: "EM_REVISAO",
    situacaoCalculo: "PENDENTE_METODOLOGIA",
    atualizadaEm: atras(2),
    historico: [
      { em: atras(2), oQue: "Rendimento revisado de 10 para 12 porções após a conferência no passe.", quem: "Érika Bruna" },
      { em: atras(14), oQue: "Ficha criada com os dados declarados pela produção.", quem: "Érika Bruna" },
    ],
  },
  {
    id: "fi_ev_frango_grelhado",
    clienteId: "cl_emporio_verde",
    nome: "Frango grelhado com legumes",
    categoria: "Prato principal",
    rendimentoPorcoes: 10,
    porcaoGramas: 280,
    itens: [
      { ingredienteId: "in_frango_peito", quantidade: "1,400", unidade: "kg", precoReferencia: 19.8, etapa: "PREPARADO", observacao: "Peso depois de grelhado e descansado." },
      { ingredienteId: "in_cenoura", quantidade: "0,300", unidade: "kg", precoReferencia: 4.7, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_batata", quantidade: "0,500", unidade: "kg", precoReferencia: 6.1, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_azeite", quantidade: "0,080", unidade: "L", precoReferencia: 47.9, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_manjericao", quantidade: "1", unidade: "maço", precoReferencia: 3.5, etapa: "COMPRA", observacao: "" },
    ],
    modoPreparo: [
      "Temperar o peito de frango e deixar descansar sob refrigeração.",
      "Grelhar em chapa quente, virando uma única vez.",
      "Cozinhar a batata e a cenoura em corte rústico, com o azeite e o manjericão ao final.",
    ],
    finalizacao: [
      "Cortar o frango no sentido contrário das fibras.",
      "Montar na proporção da folha: proteína, dois acompanhamentos, finalização com o manjericão.",
    ],
    observacoes: "Ficha fechada e conferida. É o prato de maior saída no almoço.",
    situacao: "COMPLETA",
    situacaoCalculo: "PENDENTE_METODOLOGIA",
    atualizadaEm: atras(16),
    historico: [
      { em: atras(16), oQue: "Ficha concluída com rendimento conferido na produção.", quem: "Érika Bruna" },
      { em: atras(30), oQue: "Ficha iniciada a partir do que a produção declarou.", quem: "Cláudia Nogueira" },
    ],
  },
  {
    id: "fi_ev_salada_quinoa",
    clienteId: "cl_emporio_verde",
    nome: "Salada de quinoa com legumes assados",
    categoria: "Acompanhamento",
    rendimentoPorcoes: 8,
    porcaoGramas: 180,
    itens: [
      { ingredienteId: "in_quinoa", quantidade: "0,400", unidade: "kg", precoReferencia: 32.0, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_tomate_italiano", quantidade: "0,300", unidade: "kg", precoReferencia: 8.45, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_cenoura", quantidade: "0,200", unidade: "kg", precoReferencia: 4.7, etapa: "PREPARADO", observacao: "Peso depois de assada e resfriada." },
      { ingredienteId: "in_azeite", quantidade: "0,060", unidade: "L", precoReferencia: null, etapa: "COMPRA", observacao: "Preço não registrado no dia em que a ficha foi escrita." },
    ],
    modoPreparo: [
      "Lavar a quinoa e cozinhar até os grãos abrirem.",
      "Assar o tomate e a cenoura em corte grande e deixar esfriar.",
    ],
    finalizacao: ["Misturar em salad bowl e finalizar com o azeite."],
    observacoes:
      "Ainda faltam o rendimento conferido e o preço de referência do azeite no momento do uso — os dois vieram depois da criação da ficha.",
    situacao: "AGUARDANDO_DADOS",
    situacaoCalculo: "AGUARDANDO_DADOS",
    atualizadaEm: atras(9),
    historico: [{ em: atras(9), oQue: "Ficha criada. Falta rendimento conferido e preço do azeite.", quem: "Érika Bruna" }],
  },
  {
    id: "fi_ev_bolo_cenoura",
    clienteId: "cl_emporio_verde",
    nome: "Bolo de cenoura com cobertura de chocolate",
    categoria: "Sobremesa",
    rendimentoPorcoes: 16,
    porcaoGramas: 110,
    itens: [
      { ingredienteId: "in_farinha_trigo", quantidade: "0,300", unidade: "kg", precoReferencia: 4.89, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_cenoura", quantidade: "0,400", unidade: "kg", precoReferencia: 4.7, etapa: "LIMPO", observacao: "Peso da cenoura descascada, que é como ela vai ao liquidificador." },
      { ingredienteId: "in_ovos", quantidade: "4", unidade: "dúzia", precoReferencia: 9.8, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_chocolate", quantidade: "0,200", unidade: "kg", precoReferencia: 46.0, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_creme_leite", quantidade: "0,200", unidade: "L", precoReferencia: 12.9, etapa: "COMPRA", observacao: "" },
    ],
    modoPreparo: [
      "Bater a cenoura, os ovos e o óleo no liquidificador.",
      "Incorporar a farinha sem bater em excesso.",
      "Assar em forma untada até o palito sair limpo.",
      "Preparar a cobertura em fogo baixo e aplicar sobre o bolo ainda morno.",
    ],
    finalizacao: ["Porcionar em 16 fatias iguais e etiquetar com a data de produção."],
    observacoes:
      "Primeira ficha fechada da praça de confeitaria. Foi produzida depois da visita, quando ficou claro que ela mesma quis padronizar essa parte.",
    situacao: "COMPLETA",
    situacaoCalculo: "PENDENTE_METODOLOGIA",
    atualizadaEm: atras(24),
    historico: [{ em: atras(24), oQue: "Ficha concluída e conferida pela produção.", quem: "Érika Bruna" }],
  },

  // ---- Sabor da Serra -----------------------------------------------------
  {
    id: "fi_ss_costela",
    clienteId: "cl_sabor_serra",
    nome: "Costela de porco ao molho de vinho",
    categoria: "Prato principal",
    rendimentoPorcoes: 14,
    porcaoGramas: 300,
    itens: [
      { ingredienteId: "in_costela", quantidade: "2,800", unidade: "kg", precoReferencia: 27.5, etapa: "PREPARADO", observacao: "Peso da carne assada, já sem osso." },
      { ingredienteId: "in_cebola", quantidade: "0,300", unidade: "kg", precoReferencia: 5.2, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_alho", quantidade: "0,040", unidade: "kg", precoReferencia: 21.0, etapa: "COMPRA", observacao: "" },
    ],
    modoPreparo: [
      "Temperar a costela na véspera e manter sob refrigeração.",
      "Assar lentamente coberta, até a carne soltar do osso.",
      "Reduzir o caldo do assado com a cebola e o alho para o molho.",
    ],
    finalizacao: ["Porcionar por peça e cobrir com o molho no momento da montagem do buffet."],
    observacoes:
      "Rendimento ainda não conferido no serviço. É o item que concentra a sobra junto com a polenta, segundo as três pesagens que ele fez.",
    situacao: "EM_REVISAO",
    situacaoCalculo: "PENDENTE_METODOLOGIA",
    atualizadaEm: atras(14),
    historico: [{ em: atras(14), oQue: "Ficha criada durante a visita à cozinha.", quem: "Érika Bruna" }],
  },

  // ---- Doce Ponto ---------------------------------------------------------
  {
    id: "fi_dp_bolo_cenoura",
    clienteId: "cl_doce_ponto",
    nome: "Bolo de cenoura de balcão",
    categoria: "Balcão",
    rendimentoPorcoes: 20,
    porcaoGramas: 100,
    itens: [
      { ingredienteId: "in_farinha_trigo", quantidade: "0,400", unidade: "kg", precoReferencia: 4.89, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_cenoura", quantidade: "0,500", unidade: "kg", precoReferencia: 4.7, etapa: "LIMPO", observacao: "Peso da cenoura descascada." },
      { ingredienteId: "in_ovos", quantidade: "6", unidade: "dúzia", precoReferencia: 9.8, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_leite", quantidade: "0,150", unidade: "L", precoReferencia: 5.4, etapa: "COMPRA", observacao: "" },
    ],
    modoPreparo: [
      "Bater os líquidos com a cenoura.",
      "Incorporar os secos peneirados.",
      "Assar em forma retangular e cortar em 20 porções.",
    ],
    finalizacao: ["Expor no balcão com etiqueta de produção do dia."],
    observacoes:
      "Ficha dela, já organizada antes da consultoria. Serviu de referência de formato para as das outras clientes.",
    situacao: "COMPLETA",
    situacaoCalculo: "PENDENTE_METODOLOGIA",
    atualizadaEm: atras(66),
    historico: [{ em: atras(66), oQue: "Ficha trazida por ela e registrada no sistema.", quem: "Érika Bruna" }],
  },
  {
    id: "fi_dp_brownie",
    clienteId: "cl_doce_ponto",
    nome: "Brownie de chocolate meio amargo",
    categoria: "Balcão",
    rendimentoPorcoes: 24,
    porcaoGramas: 90,
    itens: [
      { ingredienteId: "in_chocolate", quantidade: "0,500", unidade: "kg", precoReferencia: 46.0, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_manteiga", quantidade: "0,250", unidade: "kg", precoReferencia: 58.0, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_farinha_trigo", quantidade: "0,200", unidade: "kg", precoReferencia: 4.89, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_ovos", quantidade: "5", unidade: "dúzia", precoReferencia: 9.8, etapa: "COMPRA", observacao: "" },
    ],
    modoPreparo: [
      "Derreter o chocolate com a manteiga em banho-maria.",
      "Incorporar os ovos um a um, fora do fogo.",
      "Adicionar a farinha e assar em forma forrada, sem passar do ponto.",
    ],
    finalizacao: ["Resfriar completamente antes de cortar em 24 quadrados."],
    observacoes: "Fornecedor do chocolate trocado no mês passado — o preço de referência foi atualizado junto.",
    situacao: "COMPLETA",
    situacaoCalculo: "PENDENTE_METODOLOGIA",
    atualizadaEm: atras(6),
    historico: [
      { em: atras(6), oQue: "Preço de referência do chocolate atualizado após troca de fornecedor.", quem: "Érika Bruna" },
      { em: atras(64), oQue: "Ficha registrada a partir do caderno dela.", quem: "Érika Bruna" },
    ],
  },

  // ---- Bella Massa --------------------------------------------------------
  {
    id: "fi_bm_fettuccine",
    clienteId: "cl_bella_massa",
    nome: "Fettuccine à bolonhesa",
    categoria: "Massa",
    rendimentoPorcoes: 6,
    porcaoGramas: 380,
    itens: [
      { ingredienteId: "in_farinha_trigo", quantidade: "0,500", unidade: "kg", precoReferencia: 4.89, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_ovos", quantidade: "6", unidade: "dúzia", precoReferencia: 9.8, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_carne_moida", quantidade: "0,700", unidade: "kg", precoReferencia: 38.9, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_tomate_italiano", quantidade: "0,800", unidade: "kg", precoReferencia: 8.45, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_cebola", quantidade: "0,200", unidade: "kg", precoReferencia: 5.2, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_queijo_mussarela", quantidade: "a definir", unidade: "kg", precoReferencia: null, etapa: "COMPRA", observacao: "O que ele compra pronto ainda não foi decidido com a cozinha." },
    ],
    modoPreparo: [
      "Preparar a massa fresca na casa e deixar descansar.",
      "Refogar a cebola, acrescentar a carne e depois o tomate, apurando em fogo baixo.",
      "Cozinhar a massa al dente e finalizar com o molho.",
    ],
    finalizacao: ["Montar no prato do passe com a finalização prevista — padrão ainda não escrito."],
    observacoes:
      "O rendimento dos 6 pratos que mais saem ainda não foi conferido. O último item do molho está sem quantidade definida porque o componente é comprado pronto, e ele ainda não decidiu com o quê.",
    situacao: "AGUARDANDO_DADOS",
    situacaoCalculo: "AGUARDANDO_DADOS",
    atualizadaEm: atras(5),
    historico: [
      { em: atras(5), oQue: "Ficha iniciada com os dados declarados. Falta rendimento conferido.", quem: "Érika Bruna" },
    ],
  },
  {
    id: "fi_bm_bolonhesa_molho",
    clienteId: "cl_bella_massa",
    nome: "Molho bolonhesa da casa",
    categoria: "Base",
    rendimentoPorcoes: 10,
    porcaoGramas: 180,
    itens: [
      { ingredienteId: "in_carne_moida", quantidade: "1,500", unidade: "kg", precoReferencia: 38.9, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_tomate_italiano", quantidade: "2,000", unidade: "kg", precoReferencia: 8.45, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_cebola", quantidade: "0,400", unidade: "kg", precoReferencia: 5.2, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_alho", quantidade: "0,050", unidade: "kg", precoReferencia: 21.0, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_azeite", quantidade: "0,100", unidade: "L", precoReferencia: 47.9, etapa: "COMPRA", observacao: "" },
    ],
    modoPreparo: [
      "Refogar a cebola e o alho no azeite.",
      "Acrescentar a carne e deixar dourar antes de juntar o tomate.",
      "Apurar em fogo baixo por tempo longo, mexendo de vez em quando.",
    ],
    finalizacao: ["Porcionar e etiquetar com data de produção e validade."],
    observacoes:
      "Ficha de produção separada da ficha do prato, porque o molho é feito uma vez e usado em mais de um prato. Está sem rendimento conferido.",
    situacao: "AGUARDANDO_DADOS",
    situacaoCalculo: "AGUARDANDO_DADOS",
    atualizadaEm: atras(5),
    historico: [{ em: atras(5), oQue: "Ficha iniciada para separar produção de finalização.", quem: "Érika Bruna" }],
  },

  // ---- Quintal da Maria ---------------------------------------------------
  {
    id: "fi_qm_frango_caipira",
    clienteId: "cl_quintal_maria",
    nome: "Frango caipira com angu",
    categoria: "Prato principal",
    rendimentoPorcoes: 8,
    porcaoGramas: 400,
    itens: [
      { ingredienteId: "in_frango_peito", quantidade: "1,600", unidade: "kg", precoReferencia: 19.8, etapa: "PREPARADO", observacao: "Peso depois do cozimento na panela de ferro." },
      { ingredienteId: "in_polvilho", quantidade: "0,400", unidade: "kg", precoReferencia: 5.8, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_alho", quantidade: "0,030", unidade: "kg", precoReferencia: 21.0, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_cebola", quantidade: "0,200", unidade: "kg", precoReferencia: 5.2, etapa: "COMPRA", observacao: "" },
    ],
    modoPreparo: [
      "Temperar o frango e deixar tomar gosto.",
      "Cozinhar em panela de ferro até o caldo reduzir.",
      "Preparar o angu com o fubá e o caldo do cozimento.",
    ],
    finalizacao: ["Montar com o angu na base e o frango sobre ele."],
    observacoes:
      "Ficha da consultoria encerrada. O padrão se manteve na revisão de 30 dias e o preço de verdade continua sendo alimentado por ela.",
    situacao: "COMPLETA",
    situacaoCalculo: "PENDENTE_METODOLOGIA",
    atualizadaEm: atras(48),
    historico: [
      { em: atras(48), oQue: "Revisão de 30 dias: padrão mantido, sem alteração na ficha.", quem: "Érika Bruna" },
      { em: atras(160), oQue: "Ficha concluída.", quem: "Érika Bruna" },
    ],
  },
  {
    id: "fi_qm_quibebe",
    clienteId: "cl_quintal_maria",
    nome: "Quibebe de abóbora",
    categoria: "Acompanhamento",
    rendimentoPorcoes: 10,
    porcaoGramas: 200,
    itens: [
      { ingredienteId: "in_batata", quantidade: "0,300", unidade: "kg", precoReferencia: 6.1, etapa: "PREPARADO", observacao: "Peso já cozido, antes de amassar com a abóbora." },
      { ingredienteId: "in_manteiga", quantidade: "0,050", unidade: "kg", precoReferencia: 58.0, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_leite", quantidade: "0,200", unidade: "L", precoReferencia: 5.4, etapa: "COMPRA", observacao: "" },
      { ingredienteId: "in_cebola", quantidade: "0,150", unidade: "kg", precoReferencia: 5.2, etapa: "COMPRA", observacao: "" },
    ],
    modoPreparo: [
      "Cozinhar a abóbora com a batata até desmanchar.",
      "Amassar e incorporar o leite e a manteiga.",
      "Refogar a cebola e misturar ao purê.",
    ],
    finalizacao: ["Servir quente, no recipiente de linha."],
    observacoes: "Ficha de acompanhamento do cardápio enxuto. Faz parte dos 18 itens que ficaram.",
    situacao: "COMPLETA",
    situacaoCalculo: "PENDENTE_METODOLOGIA",
    atualizadaEm: atras(150),
    historico: [{ em: atras(150), oQue: "Ficha concluída durante a implantação.", quem: "Érika Bruna" }],
  },
];

// ---------------------------------------------------------------------------
// DOCUMENTOS
// ---------------------------------------------------------------------------
// Não existe storage de arquivo no sistema. `arquivo` é `null` de propósito,
// e a tela oferece a área de envio desabilitada com a razão visível — aceitar
// um arquivo e descartar em silêncio seria pior do que não aceitar.

export const DOCUMENTOS: Documento[] = [
  {
    id: "doc_ev_1",
    clienteId: "cl_emporio_verde",
    nome: "Diagnóstico — leitura dos blocos",
    tipo: "RELATORIO",
    criadoEm: atras(60),
    situacao: "ENTREGUE",
    arquivo: null,
  },
  {
    id: "doc_ev_2",
    clienteId: "cl_emporio_verde",
    nome: "Plano de ação — Empório Verde",
    tipo: "PLANO_DE_ACAO",
    criadoEm: atras(46),
    situacao: "ENTREGUE",
    arquivo: null,
  },
  {
    id: "doc_ev_3",
    clienteId: "cl_emporio_verde",
    nome: "Padrão de montagem dos pratos do delivery",
    tipo: "PROCESSO",
    criadoEm: atras(18),
    situacao: "ENTREGUE",
    arquivo: null,
  },
  {
    id: "doc_ev_4",
    clienteId: "cl_emporio_verde",
    nome: "Fichas técnicas — lote 1 (4 itens)",
    tipo: "FICHA",
    criadoEm: atras(14),
    situacao: "PRONTO",
    arquivo: null,
  },
  {
    id: "doc_ev_5",
    clienteId: "cl_emporio_verde",
    nome: "Relatório do primeiro trimestre",
    tipo: "RELATORIO",
    criadoEm: atras(3),
    situacao: "RASCUNHO",
    arquivo: null,
  },
  {
    id: "doc_ss_1",
    clienteId: "cl_sabor_serra",
    nome: "Plano de ação — Sabor da Serra",
    tipo: "PLANO_DE_ACAO",
    criadoEm: atras(34),
    situacao: "ENTREGUE",
    arquivo: null,
  },
  {
    id: "doc_dp_1",
    clienteId: "cl_doce_ponto",
    nome: "Plano de ação — Doce Ponto",
    tipo: "PLANO_DE_ACAO",
    criadoEm: atras(64),
    situacao: "ENTREGUE",
    arquivo: null,
  },
  {
    id: "doc_dp_2",
    clienteId: "cl_doce_ponto",
    nome: "Relatório de acompanhamento — mês 2",
    tipo: "RELATORIO",
    criadoEm: atras(6),
    situacao: "PRONTO",
    arquivo: null,
  },
  {
    id: "doc_bm_1",
    clienteId: "cl_bella_massa",
    nome: "Plano de ação — Cantina Bella Massa",
    tipo: "PLANO_DE_ACAO",
    criadoEm: atras(8),
    situacao: "ENTREGUE",
    arquivo: null,
  },
  {
    id: "doc_qm_1",
    clienteId: "cl_quintal_maria",
    nome: "Relatório de encerramento — Quintal da Maria",
    tipo: "RELATORIO",
    criadoEm: atras(50),
    situacao: "ENTREGUE",
    arquivo: null,
  },
];

// ---------------------------------------------------------------------------
// HISTÓRICO
// ---------------------------------------------------------------------------
// Só eventos que ACONTECERAM de verdade dentro da demonstração. Não existe
// aqui "faturamento melhorou" nem "economia de R$ X" — isso exigiria o ponto
// 9 (origem do volume) e o resultado financeiro que a fase proíbe inventar.

export const EVENTOS: EventoHistorico[] = [
  // Empório Verde
  { id: "ev_ev_1", clienteId: "cl_emporio_verde", tipo: "diagnostico_recebido", descricao: "Diagnóstico recebido pelo site.", em: atras(100) },
  { id: "ev_ev_2", clienteId: "cl_emporio_verde", tipo: "lead_convertido", descricao: "Lead convertido em cliente.", em: atras(96) },
  { id: "ev_ev_3", clienteId: "cl_emporio_verde", tipo: "consultoria_iniciada", descricao: "Consultoria de padronização iniciada.", em: atras(92) },
  { id: "ev_ev_4", clienteId: "cl_emporio_verde", tipo: "acompanhamento_registrado", descricao: "Devolutiva do diagnóstico registrada.", em: atras(60) },
  { id: "ev_ev_5", clienteId: "cl_emporio_verde", tipo: "processo_mapeado", descricao: "Fluxo de finalização do passe mapeado.", em: atras(34) },
  { id: "ev_ev_6", clienteId: "cl_emporio_verde", tipo: "acompanhamento_registrado", descricao: "Visita ao passe no horário de pico.", em: atras(22) },
  { id: "ev_ev_7", clienteId: "cl_emporio_verde", tipo: "preco_atualizado", descricao: "Preço do tomate italiano atualizado na biblioteca.", em: atras(16) },
  { id: "ev_ev_8", clienteId: "cl_emporio_verde", tipo: "ficha_criada", descricao: "Ficha do frango grelhado concluída.", em: atras(16) },
  { id: "ev_ev_9", clienteId: "cl_emporio_verde", tipo: "tarefa_concluida", descricao: "Padrão de montagem enviado e afixado no passe.", em: atras(18) },
  { id: "ev_ev_10", clienteId: "cl_emporio_verde", tipo: "preco_atualizado", descricao: "Preço da mussarela atualizado na biblioteca.", em: atras(9) },
  { id: "ev_ev_11", clienteId: "cl_emporio_verde", tipo: "acompanhamento_registrado", descricao: "Reunião de revisão das fichas de delivery.", em: atras(2) },
  { id: "ev_ev_12", clienteId: "cl_emporio_verde", tipo: "ficha_criada", descricao: "Rendimento do escondidinho revisado de 10 para 12 porções.", em: atras(2) },

  // Sabor da Serra
  { id: "ev_ss_1", clienteId: "cl_sabor_serra", tipo: "diagnostico_recebido", descricao: "Diagnóstico recebido por indicação.", em: atras(62) },
  { id: "ev_ss_2", clienteId: "cl_sabor_serra", tipo: "lead_convertido", descricao: "Lead convertido em cliente.", em: atras(58) },
  { id: "ev_ss_3", clienteId: "cl_sabor_serra", tipo: "consultoria_iniciada", descricao: "Consultoria de dimensionamento iniciada.", em: atras(54) },
  { id: "ev_ss_4", clienteId: "cl_sabor_serra", tipo: "acompanhamento_registrado", descricao: "Retorno sobre o plano de ação.", em: atras(34) },
  { id: "ev_ss_5", clienteId: "cl_sabor_serra", tipo: "processo_mapeado", descricao: "Fluxo de reposição do buffet mapeado.", em: atras(16) },
  { id: "ev_ss_6", clienteId: "cl_sabor_serra", tipo: "acompanhamento_registrado", descricao: "Visita à cozinha durante o serviço.", em: atras(16) },
  { id: "ev_ss_7", clienteId: "cl_sabor_serra", tipo: "tarefa_concluida", descricao: "Pesagem da sobra de três dias concluída.", em: atras(9) },

  // Doce Ponto
  { id: "ev_dp_1", clienteId: "cl_doce_ponto", tipo: "diagnostico_recebido", descricao: "Diagnóstico recebido pelo Instagram.", em: atras(80) },
  { id: "ev_dp_2", clienteId: "cl_doce_ponto", tipo: "lead_convertido", descricao: "Lead convertido em cliente.", em: atras(74) },
  { id: "ev_dp_3", clienteId: "cl_doce_ponto", tipo: "consultoria_iniciada", descricao: "Consultoria de controle de estoque iniciada.", em: atras(70) },
  { id: "ev_dp_4", clienteId: "cl_doce_ponto", tipo: "ficha_criada", descricao: "Ficha do bolo de cenoura registrada no sistema.", em: atras(66) },
  { id: "ev_dp_5", clienteId: "cl_doce_ponto", tipo: "acompanhamento_registrado", descricao: "Primeiro mês de conciliação analisado.", em: atras(44) },
  { id: "ev_dp_6", clienteId: "cl_doce_ponto", tipo: "preco_atualizado", descricao: "Preço do chocolate atualizado após troca de fornecedor.", em: atras(6) },
  { id: "ev_dp_7", clienteId: "cl_doce_ponto", tipo: "ficha_criada", descricao: "Ficha do brownie com preço de referência revisado.", em: atras(6) },
  { id: "ev_dp_8", clienteId: "cl_doce_ponto", tipo: "acompanhamento_registrado", descricao: "Segundo fechamento feito por ela.", em: atras(6) },

  // Bella Massa
  { id: "ev_bm_1", clienteId: "cl_bella_massa", tipo: "diagnostico_recebido", descricao: "Diagnóstico recebido pelo site.", em: atras(12) },
  { id: "ev_bm_2", clienteId: "cl_bella_massa", tipo: "lead_convertido", descricao: "Lead convertido em cliente.", em: atras(11) },
  { id: "ev_bm_3", clienteId: "cl_bella_massa", tipo: "consultoria_iniciada", descricao: "Consultoria de custo por prato iniciada.", em: atras(9) },
  { id: "ev_bm_4", clienteId: "cl_bella_massa", tipo: "acompanhamento_registrado", descricao: "Leitura do diagnóstico com ele.", em: atras(9) },
  { id: "ev_bm_5", clienteId: "cl_bella_massa", tipo: "ficha_criada", descricao: "Ficha do fettuccine iniciada.", em: atras(5) },
  { id: "ev_bm_6", clienteId: "cl_bella_massa", tipo: "acompanhamento_registrado", descricao: "Primeira visita à cozinha e ao passe.", em: atras(3) },
  { id: "ev_bm_7", clienteId: "cl_bella_massa", tipo: "tarefa_concluida", descricao: "Roteiro da primeira visita montado.", em: atras(10) },

  // Quintal da Maria
  { id: "ev_qm_1", clienteId: "cl_quintal_maria", tipo: "lead_convertido", descricao: "Cliente cadastrada por indicação.", em: atras(212) },
  { id: "ev_qm_2", clienteId: "cl_quintal_maria", tipo: "consultoria_iniciada", descricao: "Consultoria de cardápio iniciada.", em: atras(208) },
  { id: "ev_qm_3", clienteId: "cl_quintal_maria", tipo: "ficha_criada", descricao: "Ficha do frango caipira concluída.", em: atras(160) },
  { id: "ev_qm_4", clienteId: "cl_quintal_maria", tipo: "processo_mapeado", descricao: "Fluxo de produção por turno mapeado.", em: atras(140) },
  { id: "ev_qm_5", clienteId: "cl_quintal_maria", tipo: "documento_gerado", descricao: "Relatório de encerramento entregue.", em: atras(50) },
  { id: "ev_qm_6", clienteId: "cl_quintal_maria", tipo: "acompanhamento_registrado", descricao: "Revisão de 30 dias depois da alta.", em: atras(48) },
];

// ---------------------------------------------------------------------------
// COMPROMISSOS
// ---------------------------------------------------------------------------
// Agenda simples, sem integração com calendário externo. A Seção 10 do
// briefing pediu explicitamente para não construir um módulo de agenda.

export const COMPROMISSOS: Compromisso[] = [
  {
    id: "cp_1",
    clienteId: "cl_sabor_serra",
    consultoriaId: "co_sabor_serra",
    titulo: "Visita ao buffet — serviço do jantar",
    tipo: "VISITA",
    modalidade: "PRESENCIAL",
    quando: daqui(1, 18),
  },
  {
    id: "cp_2",
    clienteId: "cl_bella_massa",
    consultoriaId: "co_bella_massa",
    titulo: "Devolutiva de custo dos dois primeiros pratos",
    tipo: "REUNIAO",
    modalidade: "MISTA",
    quando: daqui(2, 15),
  },
  {
    id: "cp_3",
    clienteId: "cl_emporio_verde",
    consultoriaId: "co_emporio_verde",
    titulo: "Retorno quinzenal — fichas do almoço",
    tipo: "RETORNO",
    modalidade: "ONLINE",
    quando: daqui(4, 10),
  },
  {
    id: "cp_4",
    clienteId: "cl_doce_ponto",
    consultoriaId: "co_doce_ponto",
    titulo: "Conferência do fechamento do mês",
    tipo: "REUNIAO",
    modalidade: "ONLINE",
    quando: daqui(8, 14),
  },
];

// ---------------------------------------------------------------------------
// NOTIFICAÇÕES
// ---------------------------------------------------------------------------
// Internas e discretas. Não existe push, e-mail nem WhatsApp — a Seção 23 do
// briefing pediu justamente para não construir isso agora.

export const NOTIFICACOES: Notificacao[] = [
  {
    id: "nt_1",
    tipo: "diagnostico_novo",
    titulo: "Novo diagnóstico recebido",
    descricao: "Cantina Bella Massa respondeu o diagnóstico há 1 dia e ainda não foi lido.",
    quando: atras(1, 4),
    href: "/leads/ld_bella_massa",
    lida: false,
  },
  {
    id: "nt_2",
    tipo: "tarefa_proxima",
    titulo: "Tarefa vence hoje",
    descricao: "Fechar a ficha do escondidinho com o rendimento conferido.",
    quando: atras(0, 6),
    href: "/tarefas",
    lida: false,
  },
  {
    id: "nt_3",
    tipo: "cliente_aguardando",
    titulo: "Cliente aguardando retorno",
    descricao: "Sabor da Serra está com o histórico de produção pendente há 16 dias.",
    quando: atras(1, 2),
    href: "/clientes/cl_sabor_serra",
    lida: false,
  },
  {
    id: "nt_4",
    tipo: "acompanhamento_previsto",
    titulo: "Acompanhamento previsto",
    descricao: "Visita ao buffet do Sabor da Serra amanhã às 18h.",
    quando: atras(0, 10),
    href: "/acompanhamentos",
    lida: true,
  },
];
