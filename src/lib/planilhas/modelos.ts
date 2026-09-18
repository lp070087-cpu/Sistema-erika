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
 * │ A DIFERENÇA ENTRE "EM PREPARAÇÃO" E "AGUARDANDO DEFINIÇÃO"           │
 * │                                                                      │
 * │ Os dois aparecem como "não está pronto", e são coisas opostas:        │
 * │                                                                      │
 * │   EM_PREPARACAO        falta TRABALHO DE PROGRAMAÇÃO. Esperar resolve │
 * │                        sozinho; nada depende da Érika.                │
 * │                                                                      │
 * │   AGUARDANDO_DEFINICAO falta uma DECISÃO DELA. O sistema poderia ser  │
 * │                        programado hoje e produziria uma planilha com  │
 * │                        número inventado.                              │
 * │                                                                      │
 * │ Distinguir os dois na tela é o que impede a Érika de esperar por algo │
 * │ que ela mesma trava — ou de achar que precisa responder uma pergunta  │
 * │ que ninguém fez.                                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { ModeloPlanilha } from "./tipos";

/**
 * Os nomes das abas do relatório, na ordem em que o arquivo as traz.
 *
 * EXPORTADO porque o gerador usa esta lista como nome de aba de verdade — e
 * não uma cópia dela. Se os nomes divergissem, o card da Central prometeria
 * "Acompanhamentos" e o arquivo traria "Histórico": ninguém notaria até um
 * cliente reclamar que a aba não existe.
 *
 * `as const` para o índice devolver o literal, e não `string | undefined`.
 */
export const ABAS_RELATORIO = ["Resumo", "Tarefas", "Acompanhamentos", "Informações"] as const;

export const MODELOS: readonly ModeloPlanilha[] = [
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
      "As fichas de preparo do cliente, com ingredientes, quantidades e modo de fazer.",
    estado: "EM_PREPARACAO",
    motivo:
      "Falta decidir como o custo entra na ficha. Sem essa decisão, o sistema consegue exportar ingredientes e quantidades, mas a coluna de custo ficaria vazia ou inventada — e as duas hipóteses são piores do que esperar.",
    abas: ["Fichas", "Itens", "Informações"],
    exige: ["fichas"],
    pendencias: ["4", "5"],
  },
  {
    id: "pratos-por-praca",
    nome: "Lista de pratos por praça",
    descricao:
      "O cardápio organizado por praça — entradas, principais, sobremesas — com o responsável e o turno de cada preparo.",
    estado: "EM_PREPARACAO",
    motivo:
      "Depende de fechar a estrutura de praças e turnos, que hoje muda de cliente para cliente e ainda não tem um padrão. Depois disso, é trabalho de programação.",
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
      "A planilha de custo e preço de venda, com CMV, markup e margem por prato.",
    estado: "AGUARDANDO_DEFINICAO",
    motivo:
      "É a planilha que mais depende de você. Cada coluna dela é uma regra da sua metodologia: o que entra no custo, como a perda é tratada, qual margem é a alvo. O sistema não inventa nenhuma das três.",
    abas: ["Resumo de custos", "Ingredientes", "Precificação", "Informações"],
    /*
      Só `fichas`: ingrediente também ainda não está no contexto de planilha.
      A lista cresce junto com o gerador, não antes dele.
    */
    exige: ["fichas"],
    pendencias: ["4", "5", "6", "7", "9", "11", "19"],
  },
  {
    id: "plano-de-acao",
    nome: "Plano de ação",
    descricao:
      "As ações combinadas com o cliente, com responsável, prazo, prioridade e situação de cada uma.",
    estado: "EM_PREPARACAO",
    motivo:
      "O plano de ação já existe dentro do sistema. Falta definir o formato do arquivo e como agrupar as ações por etapa da jornada.",
    abas: ["Plano de ação", "Por responsável", "Informações"],
    exige: ["consultoria"],
    pendencias: ["11"],
  },
];

/**
 * O único modelo com gerador implementado nesta fase.
 *
 * A lista acima pode dizer DISPONIVEL para um modelo sem gerador; o portão
 * de verdade fica em `gerador.ts`, que recusa produzir o que não tem
 * implementação. Esta constante existe para os dois lados concordarem quando
 * um modelo novo entrar.
 */
export const MODELO_FUNCIONAL = "relatorio-consultoria";

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
