/**
 * O ESTADO VISUAL DE CADA MODELO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO NÃO ESTÁ NEM NO GERADOR NEM NA TELA                     │
 * │                                                                      │
 * │ O gerador é código de SERVIDOR: ele monta arquivo, e importar         │
 * │ `exceljs` de dentro de um componente cliente arrastaria a biblioteca  │
 * │ inteira para o navegador. Por isso a tela NÃO pode importar o gerador  │
 * │ — e no entanto precisa saber quais modelos existem e em que estado.    │
 * │                                                                      │
 * │ Este arquivo é a ponte: um mapa puro, sem `import` de biblioteca       │
 * │ nenhuma, que os dois lados podem ler. O gerador continua sendo o dono  │
 * │ da VERDADE (ele recusa o que não pode gerar); este arquivo é a cópia   │
 * │ de leitura que a tela usa para desenhar o card antes de tentar.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { EstadoModelo } from "./tipos";

/** O texto do estado, escrito para ela ler — não para quem programa. */
export const ROTULO_ESTADO_MODELO: Record<EstadoModelo, string> = {
  DISPONIVEL: "Disponível",
  EM_PREPARACAO: "Em preparação",
  AGUARDANDO_DEFINICAO: "Aguardando definição",
};

/**
 * O tom de cada estado.
 *
 * Segue o mesmo vocabulário dos outros componentes (`Etiqueta`): verde é
 * pronto, dourado é espera, neutro é ausência. E nenhum dos três é vermelho —
 * um modelo que ainda não existe não é um erro, é uma etapa. O vermelho fica
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
 * o que já funciona hoje.
 */
export const EXPLICACAO_ESTADO_MODELO: Record<EstadoModelo, string> = {
  DISPONIVEL: "Gera o arquivo agora.",
  EM_PREPARACAO: "Falta trabalho de programação, não decisão sua.",
  AGUARDANDO_DEFINICAO: "Depende de uma regra que ainda não foi definida.",
};
