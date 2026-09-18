/**
 * DADOS DE DEMONSTRAÇÃO — FASE 2
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE ARQUIVO É A ÚNICA FONTE DE DADO FALSO DO SISTEMA.              │
 * │                                                                      │
 * │ Nada aqui é real. Os negócios, os nomes, os telefones e os e-mails   │
 * │ são inventados para demonstração — nenhum dado de cliente da Érika,  │
 * │ nenhuma resposta real de formulário, nenhum telefone que exista.     │
 * │                                                                      │
 * │ Ele existe por uma razão específica: as telas da Fase 2 precisam     │
 * │ ser vistas funcionando — com fila, com respostas, com estado vazio,  │
 * │ com lead em cada etapa — para poderem ser avaliadas. Uma tela que só │
 * │ mostra "aguardando dados" não é avaliável.                          │
 * │                                                                      │
 * │ COMO ISTO SAI DO SISTEMA                                             │
 * │                                                                      │
 * │ Toda tela que exibe dado daqui mostra a etiqueta                   │
 * │ "Demonstração". Nenhuma delas finge ser produção. Quando a           │
 * │ persistência real entrar, `obterRepositorio()` em ./index.ts passa a │
 * │ devolver a implementação do Prisma e este arquivo deixa de ser       │
 * │ importado por qualquer caminho de execução.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * SOBRE AS RESPOSTAS INVENTADAS
 *
 * Cada resposta abaixo foi escolhida para ser COERENTE com os sinais que
 * ela produz — um lead marcado como "não usa ficha técnica" tem, de fato,
 * "Não uso" na pergunta 10. Isso importa porque as telas derivam os sinais
 * das respostas em tempo real: os sinais que aparecem na fila são
 * calculados, não digitados à mão. Se os dados fossem incoerentes, a
 * demonstração esconderia um erro real de derivação.
 */

import type {
  Atividade,
  Diagnostico,
  Lead,
  Observacao,
  Resposta,
  ValorResposta,
} from "../tipos";
import { PERGUNTAS } from "../perguntas";

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

const AGORA = new Date();

/** Uma data de demonstração, contada para trás a partir de hoje. */
function atras(dias: number, horas = 0): Date {
  const d = new Date(AGORA);
  d.setDate(d.getDate() - dias);
  d.setHours(d.getHours() - horas);
  return d;
}

/**
 * Monta o conjunto completo de respostas a partir de um mapa esparso.
 * Pergunta não citada no mapa vira resposta vazia — nunca um valor
 * presumido. É a mesma postura do resto do sistema: ausência se declara.
 */
function respostas(mapa: Record<string, string>): Resposta[] {
  return PERGUNTAS.map((p) => {
    const bruto = mapa[p.id];
    let valor: ValorResposta;

    if (bruto === undefined) {
      valor = { tipo: "vazio" };
    } else if (p.tipo === "selecao") {
      valor = { tipo: "selecao", valor: bruto };
    } else {
      valor = { tipo: "texto", valor: bruto };
    }

    return { perguntaId: p.id, bloco: p.bloco, valor };
  });
}

// ---------------------------------------------------------------------------
// LEADS
// ---------------------------------------------------------------------------

export const LEADS: Lead[] = [
  {
    id: "ld_bella_massa",
    nomeContato: "Marcelo Tavares",
    nomeFantasia: "Cantina Bella Massa",
    email: "marcelo@bellamassa.exemplo",
    whatsapp: "(51) 99000-0001",
    origem: "DIAGNOSTICO_PUBLICO",
    status: "NOVO",
    criadoEm: atras(1, 4),
    proximoPasso: "",
    sinal: "Declarou que o dinheiro não fecha o mês e que não sabe o custo dos pratos.",
    diagnosticoId: "dg_bella_massa",
    clienteId: null,
  },
  {
    id: "ld_emporio_verde",
    nomeContato: "Cláudia Nogueira",
    nomeFantasia: "Empório Verde — Cozinha Natural",
    email: "contato@emporioverde.exemplo",
    whatsapp: "(51) 99000-0002",
    origem: "DIAGNOSTICO_PUBLICO",
    status: "EM_ANALISE",
    criadoEm: atras(4, 2),
    proximoPasso: "Ler o diagnóstico completo e montar o direcionamento.",
    sinal: "Usa ficha técnica em parte do cardápio e perde tempo na montagem dos pratos.",
    diagnosticoId: "dg_emporio_verde",
    clienteId: null,
  },
  {
    id: "ld_sabor_serra",
    nomeContato: "Rodrigo Bastos",
    nomeFantasia: "Sabor da Serra",
    email: "rodrigo@sabordaserra.exemplo",
    whatsapp: "(54) 99000-0003",
    origem: "INDICACAO",
    status: "QUENTE",
    criadoEm: atras(9),
    proximoPasso: "Marcar visita à cozinha depois do dia 20.",
    sinal: "Quer resolver em 30 dias. Cozinha com dificuldade para volume maior.",
    diagnosticoId: "dg_sabor_serra",
    clienteId: null,
  },
  {
    id: "ld_doce_ponto",
    nomeContato: "Simone Alves",
    nomeFantasia: "Doce Ponto Confeitaria",
    email: "simone@doceponto.exemplo",
    whatsapp: "(51) 99000-0004",
    origem: "INSTAGRAM",
    status: "MORNO",
    criadoEm: atras(18),
    proximoPasso: "Retomar contato no fim do mês — disse que ia conversar com o sócio.",
    sinal: "Estrutura planejada e padrão definido. O gargalo declarado é estoque.",
    diagnosticoId: "dg_doce_ponto",
    clienteId: null,
  },
  {
    id: "ld_cozinha_praca",
    nomeContato: "Fernando Ilha",
    nomeFantasia: "Cozinha da Praça",
    email: "fernando@cozinhadapraca.exemplo",
    whatsapp: "(51) 99000-0005",
    origem: "DIAGNOSTICO_PUBLICO",
    status: "FRIO",
    criadoEm: atras(34),
    proximoPasso: "",
    sinal: "Respondeu há mais de um mês e não retornou às duas tentativas de contato.",
    diagnosticoId: "dg_cozinha_praca",
    clienteId: null,
  },
];

// ---------------------------------------------------------------------------
// DIAGNÓSTICOS
// ---------------------------------------------------------------------------
// Cada `leitura` é uma frase de OPERAÇÃO escrita sobre as respostas do bloco.
// Repare que elas descrevem o que foi declarado e o que merece atenção —
// nenhuma delas atribui nota, percentual ou veredito ao negócio.

export const DIAGNOSTICOS: Diagnostico[] = [
  {
    id: "dg_bella_massa",
    leadId: "ld_bella_massa",
    respondidoEm: atras(1, 4),
    maiorProblema:
      "Não sei se estou lucrando. Vendo bem no fim de semana e no fim do mês não sobra nada, e eu não sei dizer qual prato paga a conta.",
    pretendeMelhorar: "SIM",
    respostas: respostas({
      email: "marcelo@bellamassa.exemplo",
      "negocio-e-abertura": "Cantina italiana. Abrimos em março de 2019.",
      "nome-fantasia": "Cantina Bella Massa",
      "tipo-servico": "A_LA_CARTE",
      faturamento: "DE_30_A_60MIL",
      "dinheiro-sobra": "NAO",
      "cozinha-planejada": "ADAPTADA",
      "perde-tempo-movimentacao": "SIM_BASTANTE",
      "aguenta-volume-dobrado": "NAO",
      "usa-ficha-tecnica": "NAO_USO",
      "itens-cardapio": "38",
      "etapa-perde-tempo": "Finalização dos pratos no passe. Todo mundo pega o prato e monta do jeito que aprendeu.",
      "refaz-producao": "SIM",
      "como-define-preco": "NAO_SEI_EXATAMENTE",
      "faltou-insumo": "SIM_COM_FREQUENCIA",
      "controle-estoque": "NAO",
      "perda-de-alimento": "SIM_COM_FREQUENCIA",
      "frequencia-compras": "SEM_PADRAO_DEFINIDO",
      "equipe-depende-de-voce": "SIM",
      turnos: "ALMOCO_E_JANTAR",
      "numero-funcionarios": "CINCO_A_DEZ",
      "padrao-ou-improviso": "MAIS_IMPROVISO",
      "equipe-sabe-executar": "NAO",
      "sabe-custo-dos-pratos": "NAO",
      "maior-problema":
        "Não sei se estou lucrando. Vendo bem no fim de semana e no fim do mês não sobra nada, e eu não sei dizer qual prato paga a conta.",
      "o-que-mudaria":
        "Eu pararia de trabalhar no escuro. Saberia o que tirar do cardápio e o que vale a pena empurrar.",
      "observacoes-livres":
        "Tenho medo de mexer no preço e perder cliente. Já aconteceu de eu aumentar e o movimento cair.",
      "whatsapp-retorno": "(51) 99000-0001",
      "pretende-melhorar-30-dias": "SIM",
    }),
    leitura: [
      {
        bloco: "lucratividade",
        resumo: "Não sabe o custo dos pratos e o dinheiro não fecha o mês.",
        atencao: [
          "Sem noção de custo por prato, qualquer decisão de preço é chute.",
          "Declarou medo de aumentar preço — o trabalho precisa começar por número, não por reajuste.",
        ],
      },
      {
        bloco: "estrutura",
        resumo: "Cozinha adaptada, com perda de tempo na movimentação e sem folga para volume maior.",
        atencao: ["Disse que não aguentaria se a demanda dobrasse."],
      },
      {
        bloco: "padronizacao",
        resumo: "38 itens no cardápio, nenhum com ficha técnica, e a finalização é feita de memória.",
        atencao: [
          "38 itens sem ficha é um cardápio grande demais para o tamanho da equipe.",
          "Refaz produção por erro — o desperdício não está sendo medido.",
        ],
      },
      {
        bloco: "precificacao",
        resumo: "Não sabe dizer como o preço é definido hoje.",
        atencao: ["É o ponto em que ele mais precisa de direção."],
      },
      {
        bloco: "insumos",
        resumo: "Falta insumo com frequência, sem controle de estoque e sem padrão de compra.",
        atencao: [
          "Falta no meio do serviço indica que a lista de compras não nasce do cardápio.",
          "Percebe perda de alimento e não mede.",
        ],
      },
      {
        bloco: "equipe",
        resumo: "Equipe depende dele o tempo todo e não sabe executar os preparos sozinha.",
        atencao: ["Sem padrão escrito, treinar não tem em cima do quê."],
      },
    ],
  },

  {
    id: "dg_emporio_verde",
    leadId: "ld_emporio_verde",
    respondidoEm: atras(4, 2),
    maiorProblema:
      "A montagem dos pratos demora e sai diferente. Dependo da equipe acertar de memória.",
    pretendeMelhorar: "SIM",
    respostas: respostas({
      email: "contato@emporioverde.exemplo",
      "negocio-e-abertura": "Cozinha natural, self-service e delivery. Aberto desde 2021.",
      "nome-fantasia": "Empório Verde — Cozinha Natural",
      "tipo-servico": "BUFFET_E_A_LA_CARTE",
      faturamento: "DE_10_A_30MIL",
      "dinheiro-sobra": "MAIS_OU_MENOS",
      "cozinha-planejada": "PLANEJADA",
      "perde-tempo-movimentacao": "AS_VEZES",
      "aguenta-volume-dobrado": "COM_DIFICULDADE",
      "usa-ficha-tecnica": "EM_ALGUNS",
      "itens-cardapio": "22",
      "etapa-perde-tempo": "Montagem dos pratos do delivery. Cada um monta de um jeito.",
      "refaz-producao": "AS_VEZES",
      "como-define-preco": "BASEADO_NO_CUSTO",
      "faltou-insumo": "AS_VEZES",
      "controle-estoque": "PARCIAL",
      "perda-de-alimento": "AS_VEZES",
      "frequencia-compras": "DUAS_A_TRES_VEZES_SEMANA",
      "equipe-depende-de-voce": "PARCIALMENTE",
      turnos: "CAFE_ALMOCO_LANCHE_JANTAR",
      "numero-funcionarios": "UM_A_CINCO",
      "padrao-ou-improviso": "UM_POUCO_DOS_DOIS",
      "equipe-sabe-executar": "MAIS_OU_MENOS",
      "sabe-custo-dos-pratos": "MAIS_OU_MENOS",
      "maior-problema":
        "A montagem dos pratos demora e sai diferente. Dependo da equipe acertar de memória.",
      "o-que-mudaria": "Ganhar tempo no horário de pico e padronizar o que sai.",
      "observacoes-livres":
        "Acho que sei o custo dos pratos mas nunca parei para conferir se está certo mesmo.",
      "whatsapp-retorno": "(51) 99000-0002",
      "pretende-melhorar-30-dias": "SIM",
    }),
    leitura: [
      {
        bloco: "lucratividade",
        resumo: "O dinheiro sobra com aperto e o custo é conhecido com ressalva.",
        atencao: ["Ela mesma disse que nunca conferiu se o custo que usa está certo."],
      },
      {
        bloco: "padronizacao",
        resumo: "Ficha técnica em parte do cardápio; montagem feita de memória.",
        atencao: [
          "O gargalo declarado é montagem, não preparo — a ficha dos itens que faltam tende a resolver.",
          "22 itens é volume tratável para completar a ficha em pouco tempo.",
        ],
      },
      {
        bloco: "estrutura",
        resumo: "Cozinha planejada, com dificuldade para volume maior.",
        atencao: [],
      },
      {
        bloco: "insumos",
        resumo: "Estoque parcial, compras com frequência regular.",
        atencao: ["O ponto de partida é fechar o controle de estoque, não mudar a compra."],
      },
      {
        bloco: "equipe",
        resumo: "Depende dela em parte; a equipe sabe executar mais ou menos.",
        atencao: [],
      },
    ],
  },

  {
    id: "dg_sabor_serra",
    leadId: "ld_sabor_serra",
    respondidoEm: atras(9),
    maiorProblema:
      "Na alta temporada a cozinha trava. Não consigo servir todo mundo e ainda saio com sobra de comida.",
    pretendeMelhorar: "SIM",
    respostas: respostas({
      email: "rodrigo@sabordaserra.exemplo",
      "negocio-e-abertura": "Restaurante de serra, alta temporada no inverno. Desde 2015.",
      "nome-fantasia": "Sabor da Serra",
      "tipo-servico": "BUFFET",
      faturamento: "DE_60_A_120MIL",
      "dinheiro-sobra": "MAIS_OU_MENOS",
      "cozinha-planejada": "ADAPTADA",
      "perde-tempo-movimentacao": "SIM_BASTANTE",
      "aguenta-volume-dobrado": "COM_DIFICULDADE",
      "usa-ficha-tecnica": "EM_ALGUNS",
      "itens-cardapio": "31",
      "etapa-perde-tempo": "Reposição do buffet. A gente repõe no olho e sempre sobra ou falta.",
      "refaz-producao": "AS_VEZES",
      "como-define-preco": "BASEADO_NA_CONCORRENCIA",
      "faltou-insumo": "AS_VEZES",
      "controle-estoque": "PARCIAL",
      "perda-de-alimento": "SIM_COM_FREQUENCIA",
      "frequencia-compras": "DUAS_A_TRES_VEZES_SEMANA",
      "equipe-depende-de-voce": "SIM",
      turnos: "ALMOCO_E_JANTAR",
      "numero-funcionarios": "CINCO_A_DEZ",
      "padrao-ou-improviso": "UM_POUCO_DOS_DOIS",
      "equipe-sabe-executar": "SIM",
      "sabe-custo-dos-pratos": "MAIS_OU_MENOS",
      "maior-problema":
        "Na alta temporada a cozinha trava. Não consigo servir todo mundo e ainda saio com sobra de comida.",
      "o-que-mudaria":
        "Atender mais gente sem contratar mais e parar de jogar comida fora no fim do buffet.",
      "observacoes-livres":
        "Meu caso é buffet, então o prato que sobra vira prejuízo todo dia. Isso me incomoda mais que o preço.",
      "whatsapp-retorno": "(54) 99000-0003",
      "pretende-melhorar-30-dias": "SIM",
    }),
    leitura: [
      {
        bloco: "estrutura",
        resumo: "Cozinha adaptada, perde tempo na movimentação e trava em volume maior.",
        atencao: [
          "É o caso de buffet: o gargalo é dimensionar produção, não precificar prato.",
          "A origem do volume do período é decisiva neste caso — e ainda não foi definida.",
        ],
      },
      {
        bloco: "insumos",
        resumo: "Sobra declarada com frequência e reposição feita no olho.",
        atencao: ["Sem ficha completa, não existe quantidade de referência para repor."],
      },
      {
        bloco: "precificacao",
        resumo: "Preço definido pela concorrência.",
        atencao: ["Vale comparar o preço praticado com o custo real antes de qualquer reajuste."],
      },
      {
        bloco: "lucratividade",
        resumo: "Sabe o custo de parte dos pratos; o dinheiro sobra com aperto.",
        atencao: [],
      },
      {
        bloco: "equipe",
        resumo: "A equipe sabe executar, mas depende dele para decidir.",
        atencao: [],
      },
    ],
  },

  {
    id: "dg_doce_ponto",
    leadId: "ld_doce_ponto",
    respondidoEm: atras(18),
    maiorProblema:
      "Compro e não sei se o que entrou na semana bate com o que a gente produziu.",
    pretendeMelhorar: "TALVEZ",
    respostas: respostas({
      email: "simone@doceponto.exemplo",
      "negocio-e-abertura": "Confeitaria de encomenda e balcão. Aberta em 2018.",
      "nome-fantasia": "Doce Ponto Confeitaria",
      "tipo-servico": "OUTRO",
      faturamento: "PREFIRO_NAO_INFORMAR",
      "dinheiro-sobra": "SIM",
      "cozinha-planejada": "PLANEJADA",
      "perde-tempo-movimentacao": "NAO",
      "aguenta-volume-dobrado": "SIM_BASTANTE",
      "usa-ficha-tecnica": "SIM_TODOS",
      "itens-cardapio": "17",
      "etapa-perde-tempo": "Nenhuma em especial. O processo funciona.",
      "refaz-producao": "AS_VEZES",
      "como-define-preco": "BASEADO_NO_CUSTO",
      "faltou-insumo": "AS_VEZES",
      "controle-estoque": "PARCIAL",
      "perda-de-alimento": "AS_VEZES",
      "frequencia-compras": "DUAS_A_TRES_VEZES_SEMANA",
      "equipe-depende-de-voce": "PARCIALMENTE",
      turnos: "APENAS_DELIVERY",
      "numero-funcionarios": "DONO_E_MAIS_UM",
      "padrao-ou-improviso": "PADRAO_DEFINIDO",
      "equipe-sabe-executar": "SIM",
      "sabe-custo-dos-pratos": "SIM",
      "maior-problema":
        "Compro e não sei se o que entrou na semana bate com o que a gente produziu.",
      "o-que-mudaria": "Fechar o controle de estoque e saber o que realmente sobra de insumo.",
      "observacoes-livres": "O preço eu domino. O estoque é que me escapa.",
      "whatsapp-retorno": "(51) 99000-0004",
      "pretende-melhorar-30-dias": "TALVEZ",
    }),
    leitura: [
      {
        bloco: "insumos",
        resumo: "Estoque parcial é o único ponto fraco declarado.",
        atencao: ["Fluxo de compra já é regular — falta só conciliar entrada e produção."],
      },
      {
        bloco: "padronizacao",
        resumo: "Ficha técnica em todos os pratos e padrão definido.",
        atencao: [],
      },
      {
        bloco: "lucratividade",
        resumo: "Sabe o custo e o dinheiro sobra.",
        atencao: ["Escolheu não informar faturamento — legítimo, não é impedimento."],
      },
      {
        bloco: "equipe",
        resumo: "Equipe enxuta, com padrão claro de execução.",
        atencao: [],
      },
    ],
  },

  {
    id: "dg_cozinha_praca",
    leadId: "ld_cozinha_praca",
    respondidoEm: atras(34),
    maiorProblema: "Meu problema é que sobra comida. Muita comida.",
    pretendeMelhorar: "TALVEZ",
    respostas: respostas({
      email: "fernando@cozinhadapraca.exemplo",
      "negocio-e-abertura": "Marmitaria e ponto de almoço. Aberto em 2017.",
      "nome-fantasia": "Cozinha da Praça",
      "tipo-servico": "BUFFET",
      faturamento: "DE_10_A_30MIL",
      "dinheiro-sobra": "NAO",
      "cozinha-planejada": "NAO_SEI_DIZER",
      "perde-tempo-movimentacao": "AS_VEZES",
      "aguenta-volume-dobrado": "NAO",
      "usa-ficha-tecnica": "NAO_USO",
      "itens-cardapio": "9",
      "etapa-perde-tempo": "O fim do dia, jogando fora o que não vendeu.",
      "refaz-producao": "SIM",
      "como-define-preco": "BASEADO_NA_CONCORRENCIA",
      "faltou-insumo": "AS_VEZES",
      "controle-estoque": "NAO",
      "perda-de-alimento": "SIM_COM_FREQUENCIA",
      "frequencia-compras": "DIARIAMENTE",
      "equipe-depende-de-voce": "SIM",
      turnos: "SOMENTE_ALMOCO",
      "numero-funcionarios": "APENAS_DONO",
      "padrao-ou-improviso": "MAIS_IMPROVISO",
      "equipe-sabe-executar": "NAO",
      "sabe-custo-dos-pratos": "NAO",
      "maior-problema": "Meu problema é que sobra comida. Muita comida.",
      "o-que-mudaria": "Produzir o que vende e não vender o que produz.",
      "observacoes-livres": "",
      "whatsapp-retorno": "(51) 99000-0005",
      "pretende-melhorar-30-dias": "TALVEZ",
    }),
    leitura: [
      {
        bloco: "insumos",
        resumo: "Compra diária, sem controle de estoque, com perda percebida todos os dias.",
        atencao: [
          "Caso clássico de produção por estimativa — depende da origem do volume.",
        ],
      },
      {
        bloco: "lucratividade",
        resumo: "Trabalha sozinho, sem ficha e sem noção de custo.",
        atencao: ["Com apenas 9 itens, montar a ficha é trabalho de poucos dias."],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// OBSERVAÇÕES INTERNAS
// ---------------------------------------------------------------------------
// Anotações de trabalho da consultora sobre o lead. A pergunta 27 do
// formulário é o que o LEAD escreveu; isto aqui é o que ELA escreveu sobre
// ele. São coisas diferentes e por isso vivem em lugares diferentes.

export const OBSERVACOES: Observacao[] = [
  {
    id: "ob_1",
    leadId: "ld_bella_massa",
    autor: "Érika Bruna",
    texto:
      "Respondeu tudo com detalhe. O medo de mexer no preço apareceu três vezes em respostas diferentes — começar por mostrar o custo, sem falar em reajuste.",
    criadoEm: atras(1, 3),
  },
  {
    id: "ob_2",
    leadId: "ld_emporio_verde",
    autor: "Érika Bruna",
    texto:
      "22 itens e já tem ficha em parte. O caminho aqui é completar a ficha do resto e padronizar a montagem do delivery.",
    criadoEm: atras(4),
  },
  {
    id: "ob_3",
    leadId: "ld_emporio_verde",
    autor: "Érika Bruna",
    texto: "Ela pediu direcionamento por escrito antes de qualquer conversa. Vou montar um resumo do bloco de padronização.",
    criadoEm: atras(3, 6),
  },
  {
    id: "ob_4",
    leadId: "ld_sabor_serra",
    autor: "Érika Bruna",
    texto:
      "Veio por indicação da Simone. É buffet — o problema dele é dimensionar produção, não precificar. Não encaixar no mesmo roteiro dos outros.",
    criadoEm: atras(8),
  },
  {
    id: "ob_5",
    leadId: "ld_sabor_serra",
    autor: "Érika Bruna",
    texto: "Alta temporada começa em junho. Se for para fazer algo, tem que ser antes disso.",
    criadoEm: atras(2),
  },
  {
    id: "ob_6",
    leadId: "ld_doce_ponto",
    autor: "Érika Bruna",
    texto:
      "Domina custo e padrão; o que falha é estoque. Escopo curto, provavelmente um encontro só. Aguardando resposta do sócio.",
    criadoEm: atras(16),
  },
  {
    id: "ob_7",
    leadId: "ld_cozinha_praca",
    autor: "Érika Bruna",
    texto: "Tentei contato em dois horários diferentes. Não retornou. Deixo na fila fria e reviso no mês que vem.",
    criadoEm: atras(20),
  },
];

// ---------------------------------------------------------------------------
// ATIVIDADE RECENTE
// ---------------------------------------------------------------------------

export const ATIVIDADES: Atividade[] = [
  {
    id: "at_1",
    tipo: "diagnostico_respondido",
    descricao: "Cantina Bella Massa respondeu o diagnóstico.",
    leadId: "ld_bella_massa",
    quando: atras(1, 4),
  },
  {
    id: "at_2",
    tipo: "lead_criado",
    descricao: "Lead novo entrou na fila: Cantina Bella Massa.",
    leadId: "ld_bella_massa",
    quando: atras(1, 4),
  },
  {
    id: "at_3",
    tipo: "observacao_registrada",
    descricao: "Observação registrada sobre Sabor da Serra.",
    leadId: "ld_sabor_serra",
    quando: atras(2),
  },
  {
    id: "at_4",
    tipo: "observacao_registrada",
    descricao: "Observação registrada sobre Empório Verde.",
    leadId: "ld_emporio_verde",
    quando: atras(3, 6),
  },
  {
    id: "at_5",
    tipo: "diagnostico_respondido",
    descricao: "Empório Verde respondeu o diagnóstico.",
    leadId: "ld_emporio_verde",
    quando: atras(4, 2),
  },
  {
    id: "at_6",
    tipo: "lead_status_alterado",
    descricao: "Sabor da Serra passou de Em análise para Quente.",
    leadId: "ld_sabor_serra",
    quando: atras(6),
  },
  {
    id: "at_7",
    tipo: "diagnostico_respondido",
    descricao: "Sabor da Serra respondeu o diagnóstico.",
    leadId: "ld_sabor_serra",
    quando: atras(9),
  },
  {
    id: "at_8",
    tipo: "lead_status_alterado",
    descricao: "Doce Ponto Confeitaria passou de Novo para Morno.",
    leadId: "ld_doce_ponto",
    quando: atras(15),
  },
  {
    id: "at_9",
    tipo: "observacao_registrada",
    descricao: "Observação registrada sobre Cozinha da Praça.",
    leadId: "ld_cozinha_praca",
    quando: atras(20),
  },
  {
    id: "at_10",
    tipo: "diagnostico_respondido",
    descricao: "Cozinha da Praça respondeu o diagnóstico.",
    leadId: "ld_cozinha_praca",
    quando: atras(34),
  },
];
