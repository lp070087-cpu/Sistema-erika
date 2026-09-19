/**
 * O ESTADO VISUAL DE CADA MODELO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO NÃO ESTÁ NEM NO GERADOR NEM NA TELA                     │
 * │                                                                      │
 * │ O gerador é código de SERVIDOR: ele monta arquivo, e importar         │
 * │ `exceljs` de dentro de um componente cliente arrastaria a biblioteca   │
 * │ inteira para o navegador. Por isso a tela NÃO pode importar o gerador  │
 * │ — e no entanto precisa saber quais modelos existem e em que estado.    │
 * │                                                                      │
 * │ Este arquivo é a ponte: um mapa puro, sem `import` de biblioteca       │
 * │ nenhuma, que os dois lados podem ler. O gerador continua sendo o dono  │
 * │ da VERDADE (ele recusa o que não pode gerar); este arquivo é a cópia   │
 * │ de leitura que a tela usa para desenhar o card antes de tentar.        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTES TEXTOS JÁ FALARAM DE PROGRAMAÇÃO, E NÃO FALAM MAIS             │
 * │                                                                      │
 * │ A explicação de "Em preparação" dizia "falta trabalho de              │
 * │ programação, não decisão sua". Era verdade, e era uma frase dita para  │
 * │ quem escreve o sistema — não para quem usa. "Trabalho de programação"  │
 * │ descreve como o arquivo nasce; o que interessa a quem lê a tela é que  │
 * │ ele AINDA NÃO SAI.                                                    │
 * │                                                                      │
 * │ A distinção que os dois textos precisam manter é outra, e ela é real:  │
 * │ um estado é espera, o outro é uma pergunta sem resposta. Uma planilha  │
 * │ que depende de uma decisão dela não destrava com o tempo; destrava     │
 * │ com uma resposta. Continuar dizendo isso, sem falar de código, é o     │
 * │ trabalho destes três textos.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { EstadoModelo } from "./tipos";

/** O texto do estado, escrito para ela ler — não para quem programa. */
export const ROTULO_ESTADO_MODELO: Record<EstadoModelo, string> = {
  DISPONIVEL: "Disponível",
  EM_PREPARACAO: "Ainda não sai",
  AGUARDANDO_DEFINICAO: "Aguardando definição",
};

/**
 * O tom de cada estado.
 *
 * Segue o mesmo vocabulário dos outros componentes (`Etiqueta`): verde é
 * pronto, dourado é espera, neutro é ausência. E nenhum dos três é vermelho —
 * uma planilha que ainda não sai não é um erro, é uma etapa. O vermelho fica
 * reservado para o que dá errado de verdade, como a exportação falhar.
 */
export const TOM_ESTADO_MODELO: Record<EstadoModelo, "verde" | "dourado" | "neutro"> = {
  DISPONIVEL: "verde",
  EM_PREPARACAO: "dourado",
  AGUARDANDO_DEFINICAO: "neutro",
};

/**
 * A frase que explica cada estado, para o rodapé do card.
 *
 * Curta porque o motivo detalhado já aparece ao lado do card — esta linha é
 * o que se lê de longe, quando se está passando o olho pela lista para achar
 * o que já funciona hoje. A diferença que ela precisa carregar é só uma:
 * entre esperar e responder.
 */
export const EXPLICACAO_ESTADO_MODELO: Record<EstadoModelo, string> = {
  DISPONIVEL: "Gera o arquivo agora.",
  EM_PREPARACAO: "Ainda não gera arquivo.",
  AGUARDANDO_DEFINICAO: "Espera uma decisão sua para existir.",
};
