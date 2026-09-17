/**
 * DERIVAÇÕES DE LEITURA.
 *
 * Funções puras que transformam respostas em listas de leitura para a
 * consultora. Vivem no domínio, não no componente visual — a regra do
 * eslint.config.mjs proíbe que um componente em src/components importe
 * daqui, exatamente para que cálculo não vaze para a interface.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTAS FUNÇÕES **NÃO** FAZEM — e por quê                       │
 * │                                                                    │
 * │ Não somam pontos. Não calculam percentual. Não dizem se o negócio  │
 * │ está bom ou ruim. Não ordenam leads por "oportunidade".            │
 * │                                                                    │
 * │ Cada uma dessas coisas exige o peso de cada resposta, que é o      │
 * │ ponto 11 da Seção 17 — uma pergunta à Érika que segue sem resposta.│
 * │ Um percentual de saúde calculado por suposição apareceria na tela  │
 * │ com a mesma autoridade de um número certo, e seria falso.          │
 * │                                                                    │
 * │ O que elas fazem: traduzir o que a pessoa declarou para linguagem  │
 * │ de operação, contar ocorrências objetivas, e agrupar por bloco.    │
 * │ Tudo verificável contra a resposta original.                       │
 * └────────────────────────────────────────────────────────────────────┘
 */

import {
  BLOCOS,
  PERGUNTAS,
  PERGUNTA_POR_ID,
  TEXTO_SINAL,
  sinaisDaResposta,
  type BlocoChave,
  type Sinal,
} from "./perguntas";
import { respostaVazia } from "./formato";
import type { Diagnostico, Resposta, ValorResposta } from "./tipos";

/** Resposta de uma pergunta específica, ou vazio se não houver. */
export function respostaDe(diagnostico: Diagnostico, perguntaId: string): ValorResposta {
  return (
    diagnostico.respostas.find((r) => r.perguntaId === perguntaId)?.valor ?? { tipo: "vazio" }
  );
}

export function textoDe(diagnostico: Diagnostico, perguntaId: string): string {
  const valor = respostaDe(diagnostico, perguntaId);
  if (valor.tipo === "texto") return valor.valor.trim();
  if (valor.tipo === "selecao") {
    const pergunta = PERGUNTA_POR_ID[perguntaId];
    return pergunta?.opcoes?.find((o) => o.valor === valor.valor)?.texto ?? valor.valor;
  }
  return "";
}

/**
 * Todos os sinais objetivos de um diagnóstico, na ordem das perguntas.
 * Calculado a partir das respostas — nunca armazenado à mão.
 */
export function sinaisDoDiagnostico(diagnostico: Diagnostico): Sinal[] {
  const encontrados: Sinal[] = [];

  const ordenadas = [...diagnostico.respostas].sort(
    (a, b) =>
      (PERGUNTA_POR_ID[a.perguntaId]?.numero ?? 99) -
      (PERGUNTA_POR_ID[b.perguntaId]?.numero ?? 99)
  );

  for (const resposta of ordenadas) {
    if (resposta.valor.tipo !== "selecao") continue;
    for (const sinal of sinaisDaResposta(resposta.perguntaId, resposta.valor.valor)) {
      if (!encontrados.includes(sinal)) encontrados.push(sinal);
    }
  }

  return encontrados;
}

/** Os sinais escritos, prontos para exibir. */
export function sinaisEmTexto(diagnostico: Diagnostico): string[] {
  return sinaisDoDiagnostico(diagnostico).map((s) => TEXTO_SINAL[s]);
}

/**
 * Quantas perguntas obrigatórias ficaram sem resposta.
 *
 * Um número objetivo — não um indicador de qualidade do negócio. Serve
 * para a consultora saber se o diagnóstico está completo antes de ler.
 */
export function obrigatoriasEmFalta(diagnostico: Diagnostico): number {
  return PERGUNTAS.filter((p) => p.obrigatoria).filter((p) => {
    const resposta = diagnostico.respostas.find((r) => r.perguntaId === p.id);
    return !resposta || respostaVazia(resposta.valor);
  }).length;
}

/** Um bloco com as respostas que pertencem a ele, em ordem de formulário. */
export type BlocoRespondido = {
  chave: BlocoChave;
  titulo: string;
  mede: string;
  respostas: Resposta[];
  /** Contribuiu para os seis blocos de diagnóstico propostos? (ponto 11) */
  diagnostico: boolean;
};

export function respostasPorBloco(diagnostico: Diagnostico): BlocoRespondido[] {
  return BLOCOS.map((bloco) => ({
    chave: bloco.chave,
    titulo: bloco.titulo,
    mede: bloco.mede,
    diagnostico: bloco.diagnostico,
    respostas: diagnostico.respostas
      .filter((r) => r.bloco === bloco.chave)
      .sort(
        (a, b) =>
          (PERGUNTA_POR_ID[a.perguntaId]?.numero ?? 99) -
          (PERGUNTA_POR_ID[b.perguntaId]?.numero ?? 99)
      ),
  }));
}

/**
 * O que a pessoa declarou de mais concreto, para a primeira linha da fila.
 *
 * A ordem de preferência é uma escolha de LEITURA, não de gravidade: as
 * perguntas abertas (25 e 26) são as que a própria Érika considera mais
 * úteis, e vêm antes das de múltipla escolha. O que NÃO existe aqui é
 * qualquer juízo de qual problema é "pior".
 */
export function declaracaoPrincipal(diagnostico: Diagnostico): string {
  const aberta = textoDe(diagnostico, "maior-problema");
  return aberta || diagnostico.maiorProblema;
}

/** Os sinais objetivos, já recortados para caber numa linha de tabela. */
export function sinaisResumidos(diagnostico: Diagnostico, maximo = 4): {
  visiveis: string[];
  restantes: number;
} {
  const todos = sinaisEmTexto(diagnostico);
  return { visiveis: todos.slice(0, maximo), restantes: Math.max(0, todos.length - maximo) };
}
