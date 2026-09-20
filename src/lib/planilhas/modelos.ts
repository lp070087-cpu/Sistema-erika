/**
 * O CATÁLOGO DE MODELOS DE PLANILHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE ARQUIVO É LIDO DOS DOIS LADOS, E POR ISSO NÃO IMPORTA NADA      │
 * │                                                                      │
 * │ A Central de Planilhas roda no NAVEGADOR e precisa saber quais        │
 * │ modelos existem, em que estado e por quê — para desenhar os cards.    │
 * │                                                                      │
 * │ O gerador roda no SERVIDOR e precisa da mesma lista — para recusar o  │
 * │ que não consegue produzir.                                            │
 * │                                                                      │
 * │ Se a lista morasse no gerador, o card da tela importaria `exceljs`    │
 * │ junto e a biblioteca inteira iria parar no bundle do navegador. Se    │
 * │ morasse na tela, o servidor dependeria de um arquivo de interface.    │
 * │ Aqui ela é só dado: um `import type` de tipo, e mais nada. Nenhum     │
 * │ `import` de biblioteca, nenhuma função, nenhum acesso a repositório.  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A DIFERENÇA ENTRE OS DOIS ESTADOS QUE NÃO GERAM ARQUIVO              │
 * │                                                                      │
 * │ Os dois aparecem como "ainda não sai", e são coisas opostas — e a     │
 * │ diferença é sobre QUEM destrava:                                     │
 * │                                                                      │
 * │   EM_PREPARACAO        destrava sozinha, com tempo. Nada depende dela.│
 * │                                                                      │
 * │   AGUARDANDO_DEFINICAO destrava com uma RESPOSTA. Ela poderia ser     │
 * │                        gerada hoje e sairia com número inventado,     │
 * │                        porque o número depende de uma regra que ela   │
 * │                        ainda não escreveu.                            │
 * │                                                                      │
 * │ Distinguir os dois na tela é o que impede a Érika de esperar por algo │
 * │ que ela mesma trava — ou de achar que precisa responder uma pergunta  │
 * │ que ninguém fez.                                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { ModeloPlanilha } from "./tipos";

/**
 * Os nomes das abas de cada modelo, na ordem em que o arquivo as traz.
 *
 * EXPORTADOS porque cada gerador usa a própria lista como nome de aba de
 * verdade — e não uma cópia dela. Se os nomes divergissem, o card da Central
 * prometeria "Acompanhamentos" e o arquivo traria "Histórico": ninguém
 * notaria até um cliente reclamar que a aba não existe.
 *
 * `as const` para o índice devolver o literal, e não `string | undefined`.
 */
export const ABAS_RELATORIO = ["Resumo", "Tarefas", "Acompanhamentos", "Informações"] as const;
export const ABAS_FICHA = ["Fichas", "Base", "Informações"] as const;
export const ABAS_CUSTOS = ["Custos", "Composição", "Informações"] as const;
export const ABAS_LIVRE = ["Planilha"] as const;

/**
 * O MODELO COM QUE A CENTRAL ABRE QUANDO NADA FOI ESCOLHIDO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO É O RELATÓRIO, COMO ERA ANTES                            │
 * │                                                                      │
 * │ Ele era o padrão por ser o único que não exigia nada além de tarefas  │
 * │ e acompanhamentos. Continuava exigindo CLIENTE — e é justamente por   │
 * │ isso que a tela abria no "Escolha um cliente".                        │
 * │                                                                      │
 * │ A planilha em branco é a única que funciona com zero dado. Abrir a    │
 * │ Central nela é o que faz a grade estar visível na primeira pintura,   │
 * │ que é o pedido central desta rodada.                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const MODELO_PADRAO = "planilha-em-branco";

export const MODELOS: readonly ModeloPlanilha[] = [
  {
    id: "planilha-em-branco",
    nome: "Planilha em branco",
    descricao:
      "Uma grade livre de 30 linhas por 12 colunas para digitar à mão, sem depender de cliente ou consultoria. Sem fórmula nesta versão.",
    estado: "DISPONIVEL",
    abas: ABAS_LIVRE,
    /*
      `exige` VAZIO, E ISSO É O MODELO INTEIRO.

      É a única entrada do catálogo que não pede fonte nenhuma — e é a
      propriedade que a torna o estado inicial da tela. Se ela exigisse
      cliente, a Central voltaria a abrir vazia.
    */
    exige: [],
  },
  {
    id: "relatorio-consultoria",
    nome: "Relatório de consultoria",
    descricao:
      "Um retrato do cliente e do trabalho: o cadastro, o que foi combinado, as tarefas em aberto e o histórico dos encontros.",
    estado: "DISPONIVEL",
    abas: ABAS_RELATORIO,
    exige: ["tarefas", "acompanhamentos"],
  },
  {
    id: "ficha-tecnica",
    nome: "Ficha técnica",
    descricao:
      "As fichas de preparo do cliente numa grade só: ingredientes, peso líquido, preço por quilo, peso bruto, custo e o fechamento de cada receita. Inclui a base de insumos do cliente.",
    estado: "DISPONIVEL",
    abas: ABAS_FICHA,
    exige: ["fichas", "ingredientes"],
  },
  {
    id: "pratos-por-praca",
    nome: "Lista de pratos por praça",
    descricao:
      "O cardápio organizado por praça — entradas, principais, sobremesas — com o responsável e o turno de cada preparo.",
    estado: "EM_PREPARACAO",
    motivo:
      "A lista de pratos depende de a praça e o turno existirem no cadastro, e hoje eles ainda não existem: a mesma informação muda de nome de um cliente para outro, e o sistema não tem onde guardá-la.",
    abas: ["Pratos por praça", "Processos", "Informações"],
    /*
      `exige` vazio, e não ["processos"]: a lista de `exige` descreve o que o
      CONTEXTO de planilha consegue carregar hoje, e processo ainda não está
      nele. Declarar uma fonte que o gerador não busca daria um card completo
      que falharia na hora de gerar.
    */
    exige: [],
    pendencias: ["8"],
  },
  {
    id: "custos-precificacao",
    nome: "Custos e precificação",
    descricao:
      "O custo real de cada prato ao lado do preço de venda, com CMV real e markup real. Só calcula o que tem número dos dois lados.",
    estado: "DISPONIVEL",
    abas: ABAS_CUSTOS,
    exige: ["fichas", "ingredientes"],
  },
  {
    id: "plano-de-acao",
    nome: "Plano de ação",
    descricao:
      "As ações combinadas com o cliente, com responsável, prazo, prioridade e situação de cada uma.",
    estado: "EM_PREPARACAO",
    motivo:
      "O plano de ação já existe dentro do sistema. Falta definir como agrupar as ações no arquivo — por etapa da jornada, por responsável, ou as duas coisas em abas separadas.",
    abas: ["Plano de ação", "Por responsável", "Informações"],
    exige: ["consultoria"],
    pendencias: ["11"],
  },
];

/*
  AQUI HAVIA `MODELO_FUNCIONAL = "relatorio-consultoria"`.

  Fazia sentido enquanto havia UM modelo com gerador, e virou o tipo de
  constante que envelhece mal: com três modelos funcionando, ela diria que os
  outros dois não funcionam. Quem responde "este modelo gera arquivo?" agora é
  `MODELOS_COM_GERADOR`, em `gerador.ts` — a lista ao lado da oficina, e não o
  catálogo adivinhando o que a oficina sabe fazer.
*/

export function obterModelos(): readonly ModeloPlanilha[] {
  return MODELOS;
}

export function obterModelo(id: string): ModeloPlanilha | null {
  return MODELOS.find((m) => m.id === id) ?? null;
}

/** O modelo pode gerar arquivo agora? A tela pergunta antes de mostrar o botão. */
export function modeloDisponivel(id: string): boolean {
  return obterModelo(id)?.estado === "DISPONIVEL";
}

export const TOTAL_MODELOS = MODELOS.length;
export const TOTAL_DISPONIVEIS = MODELOS.filter((m) => m.estado === "DISPONIVEL").length;
