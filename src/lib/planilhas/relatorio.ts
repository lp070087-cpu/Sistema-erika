/**
 * O CONTEÚDO DO RELATÓRIO DE CONSULTORIA — em funções puras.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTAS DECISÕES SAÍRAM DE DENTRO DO GERADOR                    │
 * │                                                                      │
 * │ Três coisas precisam ser IDÊNTICAS na tela e no arquivo:              │
 * │                                                                      │
 * │   1. QUAIS linhas entram — o filtro que impede dado de outro cliente  │
 * │      de atravessar para dentro da planilha;                           │
 * │   2. EM QUE ORDEM elas saem;                                          │
 * │   3. COMO a distância até o prazo é escrita.                          │
 * │                                                                      │
 * │ Enquanto as três moravam dentro do gerador, a Central de Planilhas     │
 * │ não conseguia mostrar prévia nenhuma sem reescrevê-las — e duas        │
 * │ implementações da mesma regra divergem no dia em que uma muda. A       │
 * │ prévia diria "vence amanhã" sobre a linha que o arquivo grava como     │
 * │ "vence hoje": a tela passaria a mentir sobre o próprio arquivo, que é  │
 * │ o defeito mais caro que esta tela pode ter, porque a prévia existe     │
 * │ justamente para ser conferida antes do download.                       │
 * │                                                                      │
 * │ Aqui elas são função pura: sem `exceljs`, sem repositório, sem         │
 * │ `import "server-only"`. O gerador importa daqui para escrever as abas  │
 * │ e a tela importa daqui para desenhar a grade. Uma resposta só, para    │
 * │ cada uma das três perguntas.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O QUE NÃO MORA AQUI: nenhuma fórmula gastronômica. Somar custo, dividir
 * por porção e medir rendimento são assunto de `@/lib/dados`. Este arquivo
 * decide o que ENTRA no relatório e em que ordem — nunca o que um número
 * vale.
 */

import { dataCurta } from "@/lib/dados/formato";
import type { Acompanhamento, Ficha, Tarefa } from "@/lib/dados/tipos-operacao";
import type { ContextoPlanilha } from "./tipos";

/**
 * O RECORTE DO CLIENTE — as linhas que podem entrar nesta planilha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O FILTRO PRECISA SER UM SÓ                                      │
 * │                                                                      │
 * │ O contexto chega com as listas COMPLETAS: as tarefas de todos os       │
 * │ clientes, os acompanhamentos de todos. Isso é deliberado — o            │
 * │ repositório não tem um `listarTarefasDoCliente`, e inventar um método  │
 * │ novo no contrato obrigaria toda implementação futura a atendê-lo.       │
 * │                                                                      │
 * │ A consequência é que o filtro passa a ser a única coisa separando o    │
 * │ dado de um cliente do dado de outro. Enquanto ele vivia escrito dentro │
 * │ do gerador, quem escrevesse o segundo modelo precisava lembrar de      │
 * │ repeti-lo — e o erro de esquecer não aparece como erro: aparece como   │
 * │ a planilha de um cliente trazendo tarefa de outro, com a mesma cara de │
 * │ planilha certa.                                                        │
 * │                                                                      │
 * │ Sendo função, o segundo modelo não tem como esquecer: ele chama esta.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type RecorteDoCliente = {
  tarefas: readonly Tarefa[];
  acompanhamentos: readonly Acompanhamento[];
  /**
   * As fichas técnicas deste cliente.
   *
   * O relatório de consultoria não usa esta lista — as abas dele são resumo,
   * tarefas, acompanhamentos e informações. Ela mora aqui mesmo assim, e o
   * motivo é o parágrafo acima: este é o ÚNICO lugar onde o filtro por
   * cliente existe. Deixar ficha fora dele faria o modelo de ficha técnica
   * escrever o seu próprio `filter`, que é exatamente a segunda
   * implementação que este arquivo foi criado para evitar.
   *
   * Vazia quando o contexto não trouxe fichas — e "não trouxe" e "este
   * cliente não tem" colapsam no mesmo resultado de propósito: para quem
   * escreve a aba, os dois casos são "nenhuma linha para escrever".
   */
  fichas: readonly Ficha[];
};

export function recorteDoCliente(ctx: ContextoPlanilha): RecorteDoCliente {
  return {
    tarefas: (ctx.tarefas ?? []).filter((t) => t.clienteId === ctx.cliente.id),
    acompanhamentos: (ctx.acompanhamentos ?? []).filter(
      (a) => a.clienteId === ctx.cliente.id
    ),
    fichas: (ctx.fichas ?? []).filter((f) => f.clienteId === ctx.cliente.id),
  };
}

/**
 * A ORDEM DAS TAREFAS: abertas primeiro, por prazo crescente; concluídas
 * depois.
 *
 * É a ordem em que a lista seria lida em voz alta, respondendo a "o que eu
 * tenho que fazer?" — e é a ordem da aba TAREFAS do arquivo, que a prévia
 * da tela precisa reproduzir.
 *
 * Tarefa sem prazo vai para o FIM do bloco, e não para o começo: se o
 * `null` fosse tratado como zero, uma tarefa sem data apareceria como a
 * mais urgente de todas, e a lista abriria com algo que não tem prazo.
 */
export function ordenarTarefasDoRelatorio(tarefas: readonly Tarefa[]): Tarefa[] {
  return [...tarefas].sort((a, b) => {
    const aConcluida = a.status === "CONCLUIDA" ? 1 : 0;
    const bConcluida = b.status === "CONCLUIDA" ? 1 : 0;
    if (aConcluida !== bConcluida) return aConcluida - bConcluida;

    const aPrazo = a.prazo?.getTime() ?? Number.POSITIVE_INFINITY;
    const bPrazo = b.prazo?.getTime() ?? Number.POSITIVE_INFINITY;
    return aPrazo - bPrazo;
  });
}

/**
 * A ORDEM DOS ACOMPANHAMENTOS: do mais recente para o mais antigo.
 *
 * Ao contrário das tarefas, aqui a leitura é para trás: o encontro de
 * ontem responde mais sobre o estado do cliente do que o de três meses
 * atrás, e é ele que precisa estar na primeira linha.
 */
export function ordenarAcompanhamentosDoRelatorio(
  acompanhamentos: readonly Acompanhamento[]
): Acompanhamento[] {
  return [...acompanhamentos].sort((a, b) => b.data.getTime() - a.data.getTime());
}

/**
 * A DISTÂNCIA ATÉ O PRAZO, EM PALAVRAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE "3 DIAS" NÃO PODE SER UMA SUBTRAÇÃO DE MILISSEGUNDOS         │
 * │                                                                      │
 * │ Conta dias de CALENDÁRIO no fuso de São Paulo, e não diferença de      │
 * │ instantes dividida por 24h. A diferença decide o resultado: um prazo   │
 * │ registrado às 21h de hoje está a menos de 24 horas de distância de     │
 * │ agora, mas ele é AMANHÃ. "Vence hoje" para um prazo de amanhã é o tipo │
 * │ de erro que faz alguém perder uma entrega — e ele apareceria só à      │
 * │ noite, que é quando ninguém está olhando a planilha.                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function situacaoDoPrazo(tarefa: Tarefa, agora: Date): string {
  if (tarefa.status === "CONCLUIDA") {
    return tarefa.concluidaEm ? `concluída em ${dataCurta(tarefa.concluidaEm)}` : "concluída";
  }
  if (!tarefa.prazo) return "sem prazo";

  const dias = diasDeCalendario(tarefa.prazo, agora);

  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  if (dias > 1) return `em ${dias} dias`;
  if (dias === -1) return "venceu ontem";
  return `vencida há ${Math.abs(dias)} dias`;
}

/**
 * Dias de calendário entre duas datas, ignorando a hora.
 *
 * Depois de reduzir cada data ao seu dia, a subtração não tem como errar por
 * uma hora — que é o problema clássico quando se comparam instantes e o
 * horário de verão entra no meio.
 */
function diasDeCalendario(depois: Date, antes: Date): number {
  const umDia = 86400000;
  return Math.round((inicioDoDiaUTC(depois) - inicioDoDiaUTC(antes)) / umDia);
}

/**
 * O dia em que a data cai em São Paulo, expresso como meia-noite UTC.
 *
 * O fuso é explícito porque o servidor do sistema roda em UTC: sem ele, uma
 * data registrada às 21h em São Paulo já é o dia seguinte lá — e um prazo
 * "que vence hoje" apareceria como "venceu ontem".
 *
 * `en-CA` formata como "2026-03-17", que `Date.parse` lê como meia-noite
 * UTC. É a normalização que se quer, sem montar a data campo a campo.
 */
function inicioDoDiaUTC(d: Date): number {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return Date.parse(partes);
}
