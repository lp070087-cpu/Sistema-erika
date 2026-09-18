/**
 * AS PERGUNTAS REAIS DO DIAGNÓSTICO.
 *
 * FONTE: docs/FASE-0-ANALISE-E-ARQUITETURA.md, Seção 2, Grupo C —
 * transcrição literal do Google Forms "Diagnóstico de Lucro e Operação da
 * Cozinha", lida das capturas de tela do formulário em produção.
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ REGRA DESTE ARQUIVO — não negociável                                │
 * │                                                                     │
 * │ O enunciado de cada pergunta é copiado CARACTERE POR CARACTERE do   │
 * │ que a Érika já usa hoje, incluindo a grafia original ("Números de   │
 * │ itens do cardápio", "You analisar suas respostas", "Me deixa seu    │
 * │ WhatsApp"). Pode parecer descuido — não é. Este é o instrumento     │
 * │ dela, aplicado a clientes reais, e o sistema não é lugar para       │
 * │ corrigir o texto dela sem pedir. Qualquer reescrita é uma decisão   │
 * │ de negócio, não de programação.                                     │
 * │                                                                     │
 * │ Se um enunciado precisar mudar, isso vira uma pergunta para ela.    │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * SOBRE O NÚMERO — leia antes de "corrigir"
 *
 * O relatório da Fase 0 chamou este formulário de "33 perguntas" em quatro
 * lugares. Mas a tabela transcrita na Seção 2 tem 29 linhas, e até a
 * pergunta 17 o texto está literal e o tipo declarado; da 17 em diante
 * entram duas marcas de incompletude:
 *
 *   · #17 "Você percebe perda de alimentos no dia a dia?" está seguida de
 *     "*(corte do print)*" — o enunciado veio, as opções de resposta não.
 *   · não existem as perguntas 30, 31, 32 e 33 em nenhuma página.
 *
 * Ou seja: os 29 itens são o que a Fase 0 conseguiu ler das capturas, e a
 * diferença de 4 pode ser exatamente as perguntas 30–33 que ficaram fora
 * do print, ou pode ser outra coisa.
 *
 * NÃO É PAPEL DESTE ARQUIVO ADIVINHAR. Nenhuma pergunta foi inventada, e
 * nenhuma foi preenchida com o que "provavelmente" estava lá. O sistema
 * monta o formulário com as 29 confirmadas e declara a lacuna onde ela
 * importa — na tela de detalhe, com o registro de que existem perguntas
 * finais não transcritas. Inventar quatro perguntas e chamá-las de
 * formulário dela seria a pior coisa que este arquivo poderia fazer.
 *
 * Isso é o ponto 23 da lista de pendências e está registrado em
 * docs/FASE-2-ESTADO.md.
 */

// ---------------------------------------------------------------------------
// Blocos temáticos
// ---------------------------------------------------------------------------

export type BlocoChave =
  | "identificacao"
  | "lucratividade"
  | "estrutura"
  | "padronizacao"
  | "precificacao"
  | "insumos"
  | "equipe"
  | "intencao";

/**
 * Os blocos são os da Seção 2 do relatório da Fase 0 — que por sua vez são
 * os do próprio formulário dela ("Faturamento x lucro", "Estrutura",
 * "Produção", "Tempo de produção", "Retrabalho", "Precificação",
 * "Controle de estoque", "Perda de insumo", "Compras", "Equipe",
 * "Clareza de processo", "Treinamento da equipe", "Custos"), agrupados
 * conforme a proposta de leitura daquele relatório.
 *
 * A divisão em seis blocos de diagnóstico (lucratividade, estrutura,
 * padronização, precificação, insumos, equipe) é uma PROPOSTA — o ponto 11
 * pergunta justamente se ela concorda com ela. Até a resposta, os blocos
 * aqui são apenas agrupamento de leitura para ela navegar pelas respostas.
 * Não entram em fórmula nenhuma.
 *
 * `identificacao` e `intencao` ficam fora dos seis: a primeira descreve o
 * negócio, a segunda mede prontidão — nenhuma das duas mede saúde de
 * operação, então misturá-las com as outras distorceria a leitura.
 */
export const BLOCOS: ReadonlyArray<{
  chave: BlocoChave;
  titulo: string;
  /** O que este bloco responde sobre a operação — texto de leitura, não de UI. */
  mede: string;
  /** Entra no conjunto que a Érika propôs como seis blocos de diagnóstico? */
  diagnostico: boolean;
}> = [
  {
    chave: "identificacao",
    titulo: "Identificação do negócio",
    mede: "Quem é o negócio: tipo de serviço, tempo de casa e porte.",
    diagnostico: false,
  },
  {
    chave: "lucratividade",
    titulo: "Faturamento e lucro",
    mede: "Se o dinheiro sobra no fim do mês e se ela sabe o custo do que vende.",
    diagnostico: true,
  },
  {
    chave: "estrutura",
    titulo: "Estrutura e capacidade",
    mede: "Se a cozinha foi pensada para o volume que ela atende hoje e aguenta dobrar.",
    diagnostico: true,
  },
  {
    chave: "padronizacao",
    titulo: "Padronização e retrabalho",
    mede: "Se o preparo segue padrão ou depende de quem está na cozinha naquele dia.",
    diagnostico: true,
  },
  {
    chave: "precificacao",
    titulo: "Precificação",
    mede: "Como o preço é definido — custo, concorrência ou feeling.",
    diagnostico: true,
  },
  {
    chave: "insumos",
    titulo: "Insumos e estoque",
    mede: "Falta, estoque, perda e compras — o que acontece antes do prato existir.",
    diagnostico: true,
  },
  {
    chave: "equipe",
    titulo: "Equipe",
    mede: "O quanto a operação depende da presença do dono.",
    diagnostico: true,
  },
  {
    chave: "intencao",
    titulo: "Intenção",
    mede: "Se ela pretende mexer na operação nos próximos 30 dias.",
    diagnostico: false,
  },
];

export const BLOCO_POR_CHAVE: Record<BlocoChave, (typeof BLOCOS)[number]> = Object.fromEntries(
  BLOCOS.map((b) => [b.chave, b])
) as Record<BlocoChave, (typeof BLOCOS)[number]>;

/** Os seis blocos que a Érika propôs como leitura de diagnóstico (ponto 11). */
export const BLOCOS_DIAGNOSTICO = BLOCOS.filter((b) => b.diagnostico);

// ---------------------------------------------------------------------------
// Tipos de pergunta
// ---------------------------------------------------------------------------

export type TipoPergunta = "texto" | "email" | "telefone" | "selecao" | "multipla";

export type Opcao = { valor: string; texto: string };

export type Pergunta = {
  /** O número do formulário original. É por ele que a consultora se refere. */
  numero: number;
  /** Id estável para uso em código, formulário e persistência. */
  id: string;
  bloco: BlocoChave;
  /** Enunciado literal, sem correção. Ver a regra no topo do arquivo. */
  enunciado: string;
  tipo: TipoPergunta;
  /**
   * Já era obrigatória no Google Forms? O ponto 14 pergunta se as abertas
   * 27 e 28 continuam obrigatórias — então este campo é estado conhecido,
   * não decisão nova.
   */
  obrigatoria: boolean;
  opcoes?: Opcao[];
  /** Texto de apoio sob o campo. Sempre escrito por nós, nunca pelo cliente. */
  ajuda?: string;
  /**
   * Qual resposta esta pergunta habilita no bloco. Preenchido só onde o
   * significado é inequívoco a partir da própria pergunta — é leitura
   * objetiva, não interpretação.
   */
  sinal?: Sinal;
};

/**
 * SINAIS OBJETIVOS.
 *
 * Não são score, não têm peso e não somam nada. São a resposta literal da
 * pessoa traduzida para uma pergunta de operação, para que a consultora
 * consiga ler uma lista de leads de relance sem abrir cada um.
 *
 * Exemplo: quem respondeu "Não uso" na pergunta 10 gera o sinal
 * "sem-ficha-tecnica". Isso não é uma nota ruim — é um fato que o lead
 * declarou, e é o fato que a consultora precisa ver primeiro.
 *
 * O que decidiria o peso disso é o ponto 11, e ele está em aberto. Até lá,
 * o sistema mostra o fato e não o julga.
 */
export type Sinal =
  | "sem-ficha-tecnica"
  | "ficha-em-parte"
  | "nao-sabe-custo"
  | "custo-em-parte"
  | "dinheiro-nao-sobra"
  | "dinheiro-mais-ou-menos"
  | "preco-por-feeling"
  | "preco-nao-sei"
  | "preco-por-concorrencia"
  | "falta-insumo-frequente"
  | "sem-controle-estoque"
  | "estoque-parcial"
  | "refaz-producao-frequente"
  | "cozinha-nao-aguenta-dobrar"
  | "cozinha-com-dificuldade"
  | "nao-treina-equipe"
  | "depende-do-dono"
  | "depende-do-dono-em-parte"
  | "improviso"
  | "equipe-perdida";

// ---------------------------------------------------------------------------
// AS 29 PERGUNTAS — transcrição literal
// ---------------------------------------------------------------------------

export const PERGUNTAS: ReadonlyArray<Pergunta> = [
  // --- Sem seção no formulário original: identificação -------------------
  {
    numero: 1,
    id: "email",
    bloco: "identificacao",
    enunciado: "E-mail",
    tipo: "email",
    obrigatoria: true,
    ajuda: "É por aqui que o resultado do diagnóstico chega até você.",
  },
  {
    numero: 2,
    id: "negocio-e-abertura",
    bloco: "identificacao",
    enunciado: "Qual negócio de alimentação você possui? E qual a data da abertura?",
    tipo: "texto",
    obrigatoria: true,
    ajuda: "Ex.: restaurante, marmitaria, lanchonete — e desde quando está aberto.",
  },
  {
    numero: 3,
    id: "nome-fantasia",
    bloco: "identificacao",
    enunciado: "Qual nome fantasia do seu negócio de alimentos?",
    tipo: "texto",
    obrigatoria: true,
  },
  {
    numero: 4,
    id: "tipo-servico",
    bloco: "identificacao",
    enunciado: "Qual o tipo de serviço do seu negócio de alimentação?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "BUFFET", texto: "Buffet" },
      { valor: "A_LA_CARTE", texto: "À la carte" },
      { valor: "BUFFET_E_A_LA_CARTE", texto: "Buffet e à la carte" },
      { valor: "DELIVERY", texto: "Delivery" },
      { valor: "OUTRO", texto: "Outro" },
    ],
  },
  {
    numero: 5,
    id: "faturamento",
    bloco: "identificacao",
    enunciado: "Qual a média do faturamento mensal da sua empresa?",
    tipo: "selecao",
    obrigatoria: true,
    // O relatório da Fase 0 apontou esta pergunta como problemática para
    // conversão: era texto livre. O ponto 12 pergunta quais faixas usar —
    // está EM ABERTO. Por isso a tela oferece as faixas da proposta da
    // Fase 0 E a opção de não informar, em vez de obrigar um número.
    opcoes: [
      { valor: "ATE_10MIL", texto: "Até R$ 10 mil" },
      { valor: "DE_10_A_30MIL", texto: "De R$ 10 mil a R$ 30 mil" },
      { valor: "DE_30_A_60MIL", texto: "De R$ 30 mil a R$ 60 mil" },
      { valor: "DE_60_A_120MIL", texto: "De R$ 60 mil a R$ 120 mil" },
      { valor: "ACIMA_120MIL", texto: "Acima de R$ 120 mil" },
      { valor: "PREFIRO_NAO_INFORMAR", texto: "Prefiro não informar agora" },
    ],
    ajuda: "Faixas, não valor exato. Se preferir, pode deixar em branco e falar depois.",
  },

  // --- Faturamento x lucro ----------------------------------------------
  {
    numero: 6,
    id: "dinheiro-sobra",
    bloco: "lucratividade",
    enunciado: "Hoje você sente que o dinheiro sobra no final do mês?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM", texto: "Sim" },
      { valor: "MAIS_OU_MENOS", texto: "Mais ou menos" },
      { valor: "NAO", texto: "Não" },
    ],
  },

  // --- Estrutura ---------------------------------------------------------
  {
    numero: 7,
    id: "cozinha-planejada",
    bloco: "estrutura",
    enunciado: "Sua cozinha foi planejada ou adaptada?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "PLANEJADA", texto: "Planejada" },
      { valor: "ADAPTADA", texto: "Adaptada" },
      { valor: "NAO_SEI_DIZER", texto: "Não sei dizer" },
    ],
  },
  {
    numero: 8,
    id: "perde-tempo-movimentacao",
    bloco: "estrutura",
    enunciado: "Você sente que perde tempo na movimentação da cozinha?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM_BASTANTE", texto: "Sim, bastante" },
      { valor: "AS_VEZES", texto: "Às vezes" },
      { valor: "NAO", texto: "Não" },
    ],
  },
  {
    numero: 9,
    id: "aguenta-volume-dobrado",
    bloco: "estrutura",
    enunciado: "Se a demanda dobrar amanhã, sua cozinha dá conta?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM_BASTANTE", texto: "Sim, bastante" },
      { valor: "COM_DIFICULDADE", texto: "Com dificuldade" },
      { valor: "NAO", texto: "Não" },
    ],
  },

  // --- Produção ----------------------------------------------------------
  {
    numero: 10,
    id: "usa-ficha-tecnica",
    bloco: "padronizacao",
    enunciado: "Você usa ficha técnica?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM_TODOS", texto: "Sim, em todos os pratos" },
      { valor: "EM_ALGUNS", texto: "Em alguns" },
      { valor: "NAO_USO", texto: "Não uso" },
    ],
  },
  {
    numero: 11,
    id: "itens-cardapio",
    bloco: "padronizacao",
    enunciado: "Números de itens do cardápio",
    tipo: "texto",
    obrigatoria: true,
    ajuda: "Uma estimativa serve. Ex.: 24.",
  },

  // --- Tempo de produção -------------------------------------------------
  {
    numero: 12,
    id: "etapa-perde-tempo",
    bloco: "padronizacao",
    enunciado: "Qual etapa da produção mais te faz perder tempo hoje?",
    tipo: "texto",
    obrigatoria: true,
  },

  // --- Retrabalho --------------------------------------------------------
  {
    numero: 13,
    id: "refaz-producao",
    bloco: "padronizacao",
    enunciado: "Você costuma refazer produção por erro ou falta de padrão?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM", texto: "Sim" },
      { valor: "AS_VEZES", texto: "Às vezes" },
      { valor: "NAO", texto: "Não" },
    ],
  },

  // --- Precificação ------------------------------------------------------
  {
    numero: 14,
    id: "como-define-preco",
    bloco: "precificacao",
    enunciado: "Como você define o preço dos seus produtos?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "BASEADO_NO_CUSTO", texto: "Baseado no custo" },
      { valor: "BASEADO_NA_CONCORRENCIA", texto: "Baseado na concorrência" },
      { valor: "NO_FEELING", texto: 'No "feeling"' },
      { valor: "NAO_SEI_EXATAMENTE", texto: "Não sei exatamente" },
    ],
  },

  // --- Sem seção no original --------------------------------------------
  {
    numero: 15,
    id: "faltou-insumo",
    bloco: "insumos",
    enunciado: "Já faltou insumo durante o serviço?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM_COM_FREQUENCIA", texto: "Sim, com frequência" },
      { valor: "AS_VEZES", texto: "Às vezes" },
      { valor: "NUNCA", texto: "Nunca" },
    ],
  },

  // --- Controle de estoque -----------------------------------------------
  {
    numero: 16,
    id: "controle-estoque",
    bloco: "insumos",
    enunciado: "Você tem controle do que entra e sai de estoque?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM", texto: "Sim" },
      { valor: "PARCIAL", texto: "Parcial" },
      { valor: "NAO", texto: "Não" },
    ],
  },

  // --- Perda de insumo ---------------------------------------------------
  {
    numero: 17,
    id: "perda-de-alimento",
    bloco: "insumos",
    enunciado: "Você percebe perda de alimentos no dia a dia?",
    tipo: "selecao",
    obrigatoria: true,
    // ATENÇÃO: o print desta pergunta está CORTADO no material da Fase 0 —
    // o enunciado foi lido, as opções não. As três usadas aqui seguem o
    // padrão de intensidade do próprio formulário dela (frequência
    // declarada: com frequência / às vezes / nunca), que é o padrão da
    // pergunta 15, vizinha de bloco.
    //
    // É uma RECONSTRUÇÃO, não uma transcrição, e está registrada como tal
    // em docs/FASE-2-ESTADO.md e na tela de detalhe. Trocar por uma escala
    // diferente seria decidir o instrumento dela por conta própria.
    opcoes: [
      { valor: "SIM_COM_FREQUENCIA", texto: "Sim, com frequência" },
      { valor: "AS_VEZES", texto: "Às vezes" },
      { valor: "NAO", texto: "Não" },
    ],
    ajuda: "Opções reconstruídas a partir do padrão do formulário — o print original está cortado.",
  },

  // --- Compras -----------------------------------------------------------
  {
    numero: 18,
    id: "frequencia-compras",
    bloco: "insumos",
    enunciado: "Com que frequência você faz compras de insumos?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "DIARIAMENTE", texto: "Diariamente" },
      { valor: "DUAS_A_TRES_VEZES_SEMANA", texto: "2 a 3 vezes por semana" },
      { valor: "SEM_PADRAO_DEFINIDO", texto: "Sem padrão definido" },
    ],
  },

  // --- Equipe ------------------------------------------------------------
  {
    numero: 19,
    id: "equipe-depende-de-voce",
    bloco: "equipe",
    enunciado: "Sua equipe depende de você o tempo todo?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM", texto: "Sim" },
      { valor: "PARCIALMENTE", texto: "Parcialmente" },
      { valor: "NAO", texto: "Não" },
    ],
  },
  {
    numero: 20,
    id: "turnos",
    bloco: "equipe",
    enunciado: "Turno de trabalho",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SOMENTE_ALMOCO", texto: "Somente almoço" },
      { valor: "SOMENTE_JANTAR", texto: "Somente jantar" },
      { valor: "ALMOCO_E_JANTAR", texto: "Almoço e jantar" },
      { valor: "CAFE_ALMOCO_LANCHE_JANTAR", texto: "Café, almoço, lanche e jantar" },
      { valor: "APENAS_DELIVERY", texto: "Apenas delivery dia ou noite" },
    ],
  },
  {
    numero: 21,
    id: "numero-funcionarios",
    bloco: "equipe",
    enunciado: "Número de funcionários?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "UM_A_CINCO", texto: "1 a 5" },
      { valor: "CINCO_A_DEZ", texto: "5 a 10" },
      { valor: "DONO_E_MAIS_UM", texto: "Somente eu (dono) e mais 1 pessoa" },
      { valor: "APENAS_DONO", texto: "Apenas eu (dono)" },
      { valor: "OUTRO", texto: "Outro" },
    ],
  },

  // --- Clareza de processo ----------------------------------------------
  {
    numero: 22,
    id: "padrao-ou-improviso",
    bloco: "padronizacao",
    enunciado: "Hoje sua operação segue um padrão ou depende do improviso?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "PADRAO_DEFINIDO", texto: "Padrão definido" },
      { valor: "UM_POUCO_DOS_DOIS", texto: "Um pouco dos dois" },
      { valor: "MAIS_IMPROVISO", texto: "Mais improviso" },
    ],
  },

  // --- Treinamento da equipe --------------------------------------------
  {
    numero: 23,
    id: "equipe-sabe-executar",
    bloco: "equipe",
    enunciado: "Sua equipe sabe exatamente como executar cada preparo?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM", texto: "Sim" },
      { valor: "MAIS_OU_MENOS", texto: "Mais ou menos" },
      { valor: "NAO", texto: "Não" },
    ],
  },

  // --- Custos ------------------------------------------------------------
  {
    numero: 24,
    id: "sabe-custo-dos-pratos",
    bloco: "lucratividade",
    enunciado: "Você sabe o custo exato dos pratos?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM", texto: "Sim" },
      { valor: "MAIS_OU_MENOS", texto: "Mais ou menos" },
      { valor: "NAO", texto: "Não" },
    ],
  },

  // --- Sem seção no original: as quatro abertas --------------------------
  {
    numero: 25,
    id: "maior-problema",
    bloco: "lucratividade",
    enunciado: "Qual é hoje o maior problema da sua cozinha?",
    tipo: "texto",
    obrigatoria: true,
    ajuda: "Escreva do jeito que você contaria para alguém. Sem formalidade.",
  },
  {
    numero: 26,
    id: "o-que-mudaria",
    bloco: "lucratividade",
    enunciado: "Se esse problema fosse resolvido, o que mudaria no seu restaurante?",
    tipo: "texto",
    obrigatoria: true,
  },
  {
    numero: 27,
    id: "observacoes-livres",
    bloco: "lucratividade",
    enunciado:
      "Sinta-se à vontade para me dizer o que desejar sobre seu estabelecimento, como consultora sou agente de soluções para seu negócio!",
    tipo: "texto",
    obrigatoria: true,
    // Ponto 14 em aberto: as abertas 27 e 28 são obrigatórias no Google
    // Forms e o relatório da Fase 0 as apontou como risco de conversão.
    // Aqui elas continuam obrigatórias — porque continuam sendo o
    // instrumento dela — MAS o texto do formulário explica por que está
    // perguntando. Decidir deixá-las opcionais seria tomar a decisão do
    // ponto 14 sem ela.
    ajuda: "Campo livre. É a parte que costuma render o direcionamento mais útil.",
  },
  {
    numero: 28,
    id: "whatsapp-retorno",
    bloco: "intencao",
    enunciado:
      "You analisar suas respostas e te dar um direcionamento. Me deixa seu WhatsApp pra te enviar o resultado do diagnóstico.",
    tipo: "telefone",
    obrigatoria: true,
    ajuda: "Com DDD. É por aqui que o resultado chega.",
  },
  {
    numero: 29,
    id: "pretende-melhorar-30-dias",
    bloco: "intencao",
    enunciado: "Você pretende melhorar sua operação nos próximos 30 dias?",
    tipo: "selecao",
    obrigatoria: true,
    opcoes: [
      { valor: "SIM", texto: "Sim" },
      { valor: "TALVEZ", texto: "Talvez" },
      { valor: "NAO", texto: "Não" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Índices e consultas
// ---------------------------------------------------------------------------

export const PERGUNTA_POR_ID: Record<string, Pergunta> = Object.fromEntries(
  PERGUNTAS.map((p) => [p.id, p])
);

export const TOTAL_PERGUNTAS = PERGUNTAS.length;

export function perguntasDoBloco(bloco: BlocoChave): Pergunta[] {
  return PERGUNTAS.filter((p) => p.bloco === bloco);
}

/**
 * A LACUNA DECLARADA.
 *
 * O formulário em uso tem mais perguntas do que os 29 itens transcritos na
 * Fase 0 — o próprio relatório fala em 33. Existem três explicações
 * possíveis e nenhuma delas foi confirmada:
 *
 *   1. as perguntas 30–33 não apareceram nas capturas de tela;
 *   2. o número "33" no relatório está errado;
 *   3. parte do que foi contado como pergunta é, na verdade, texto de seção.
 *
 * Enquanto isso não for confirmado, o sistema monta o formulário com as 29
 * confirmadas e MOSTRA esta lacuna nas telas onde ela importa. Declarar o
 * que falta é o oposto de esconder — e é a única forma de ninguém tratar
 * este formulário como completo por engano.
 */
export const LACUNA = {
  transcritas: PERGUNTAS.length,
  declaradasNoRelatorio: 33,
  /** Perguntas cujo material de origem está incompleto. */
  reconstruidas: [17],
  /*
    Texto lido pela consultora em /configuracoes. Por isso ele não cita
    número de fase nem nome de relatório interno: descreve a lacuna em si —
    o formulário tem mais perguntas do que o sistema conhece.
  */
  descricao:
    "O formulário em uso tem mais perguntas do que as 29 que o sistema " +
    "conhece. A pergunta 17 teve as opções de resposta reconstruídas a " +
    "partir do padrão do próprio formulário, porque o material de origem " +
    "está cortado.",
} as const;

/**
 * Sinais objetivos derivados de uma resposta.
 *
 * Retorna lista vazia quando a resposta não declara nada de objetivo —
 * o que é o caso da maioria. NÃO existe aqui nenhum caminho que produza
 * nota, peso, percentual ou classificação.
 */
export function sinaisDaResposta(perguntaId: string, valor: string): Sinal[] {
  switch (perguntaId) {
    case "usa-ficha-tecnica":
      if (valor === "NAO_USO") return ["sem-ficha-tecnica"];
      if (valor === "EM_ALGUNS") return ["ficha-em-parte"];
      return [];
    case "sabe-custo-dos-pratos":
      if (valor === "NAO") return ["nao-sabe-custo"];
      if (valor === "MAIS_OU_MENOS") return ["custo-em-parte"];
      return [];
    case "dinheiro-sobra":
      if (valor === "NAO") return ["dinheiro-nao-sobra"];
      if (valor === "MAIS_OU_MENOS") return ["dinheiro-mais-ou-menos"];
      return [];
    case "como-define-preco":
      if (valor === "NO_FEELING") return ["preco-por-feeling"];
      if (valor === "NAO_SEI_EXATAMENTE") return ["preco-nao-sei"];
      if (valor === "BASEADO_NA_CONCORRENCIA") return ["preco-por-concorrencia"];
      return [];
    case "faltou-insumo":
      if (valor === "SIM_COM_FREQUENCIA") return ["falta-insumo-frequente"];
      return [];
    case "controle-estoque":
      if (valor === "NAO") return ["sem-controle-estoque"];
      if (valor === "PARCIAL") return ["estoque-parcial"];
      return [];
    case "refaz-producao":
      if (valor === "SIM") return ["refaz-producao-frequente"];
      return [];
    case "aguenta-volume-dobrado":
      if (valor === "NAO") return ["cozinha-nao-aguenta-dobrar"];
      if (valor === "COM_DIFICULDADE") return ["cozinha-com-dificuldade"];
      return [];
    case "equipe-sabe-executar":
      if (valor === "NAO") return ["nao-treina-equipe"];
      if (valor === "MAIS_OU_MENOS") return ["equipe-perdida"];
      return [];
    case "equipe-depende-de-voce":
      if (valor === "SIM") return ["depende-do-dono"];
      if (valor === "PARCIALMENTE") return ["depende-do-dono-em-parte"];
      return [];
    case "padrao-ou-improviso":
      if (valor === "MAIS_IMPROVISO") return ["improviso"];
      return [];
    default:
      return [];
  }
}

/** Texto legível de um sinal, em linguagem de operação — nunca de nota. */
export const TEXTO_SINAL: Record<Sinal, string> = {
  "sem-ficha-tecnica": "Não usa ficha técnica",
  "ficha-em-parte": "Ficha técnica em parte do cardápio",
  "nao-sabe-custo": "Não sabe o custo dos pratos",
  "custo-em-parte": "Sabe o custo de parte dos pratos",
  "dinheiro-nao-sobra": "O dinheiro não sobra no fim do mês",
  "dinheiro-mais-ou-menos": "O dinheiro sobra com aperto",
  "preco-por-feeling": "Define preço por feeling",
  "preco-nao-sei": "Não sabe como o preço é definido",
  "preco-por-concorrencia": "Define preço pela concorrência",
  "falta-insumo-frequente": "Falta insumo com frequência",
  "sem-controle-estoque": "Sem controle de estoque",
  "estoque-parcial": "Controle de estoque parcial",
  "refaz-producao-frequente": "Refaz produção por erro",
  "cozinha-nao-aguenta-dobrar": "Cozinha não aguenta volume maior",
  "cozinha-com-dificuldade": "Cozinha dá conta com dificuldade",
  "nao-treina-equipe": "Equipe não sabe executar os preparos",
  "depende-do-dono": "Equipe depende dela o tempo todo",
  "depende-do-dono-em-parte": "Equipe depende dela em parte",
  improviso: "Operação por improviso",
  "equipe-perdida": "Equipe sabe executar mais ou menos",
};
