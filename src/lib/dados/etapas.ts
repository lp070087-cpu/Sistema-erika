/**
 * AS ETAPAS DO FORMULÁRIO PÚBLICO.
 *
 * O formulário tem 29 perguntas. Mostrar todas de uma vez — como o Google
 * Forms faz hoje — é o que produz o abandono no meio. Este arquivo divide
 * as mesmas 29 perguntas em cinco etapas curtas.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A DIVISÃO É UMA ESCOLHA DE APRESENTAÇÃO, NÃO DE CONTEÚDO             │
 * │                                                                      │
 * │ Nenhuma pergunta foi cortada, reordenada dentro do seu contexto     │
 * │ original, nem teve o enunciado alterado. O que mudou foi só onde     │
 * │ cada uma aparece na tela. As etapas abaixo seguem os agrupamentos    │
 * │ que já existem no formulário dela e a ordem natural de quem         │
 * │ responde: primeiro quem é, depois como está o negócio, depois o     │
 * │ que dói mais, e no fim como falar de volta.                          │
 * │                                                                      │
 * │ A ordem das perguntas DENTRO de cada etapa é a ordem do formulário   │
 * │ original. Nenhum bloco temático foi misturado com outro.            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * POR QUE CINCO E NÃO OITO
 *
 * Os oito blocos temáticos do diagnóstico servem para LER as respostas
 * depois. Como etapas de preenchimento, três deles têm uma ou duas
 * perguntas — o que faria o respondente avançar de tela a cada duas
 * perguntas e ter a sensação de que o formulário não acaba.
 *
 * Cinco etapas de tamanho parecido, com os blocos mantidos inteiros,
 * equilibram as duas coisas: cada tela tem cerca de seis perguntas, e
 * nenhum bloco é partido no meio.
 */

import type { BlocoChave } from "./perguntas";

export type Etapa = {
  chave: string;
  /** Título curto — vira o cabeçalho da tela. */
  titulo: string;
  /** Uma frase sobre por que ele está respondendo isso. */
  descricao: string;
  /** Os blocos que esta etapa cobre, inteiros. */
  blocos: BlocoChave[];
};

export const ETAPAS: ReadonlyArray<Etapa> = [
  {
    chave: "negocio",
    titulo: "O seu negócio",
    descricao:
      "Para eu saber com quem estou falando antes de olhar os números. Leva menos de um minuto.",
    blocos: ["identificacao"],
  },
  {
    chave: "resultado",
    titulo: "Resultado e capacidade",
    descricao:
      "Como o dinheiro está chegando — e se a estrutura que você tem hoje dá conta do que você vende.",
    blocos: ["lucratividade", "estrutura"],
  },
  {
    chave: "padrao",
    titulo: "Padrão de produção",
    descricao:
      "Aqui costuma estar o que mais consome tempo na cozinha sem ninguém perceber.",
    blocos: ["padronizacao", "precificacao"],
  },
  {
    chave: "insumos",
    titulo: "Insumos e equipe",
    descricao:
      "O que acontece antes do prato existir — compra, estoque, perda — e quem está na cozinha com você.",
    blocos: ["insumos", "equipe"],
  },
  {
    chave: "retorno",
    titulo: "Por último",
    descricao:
      "Estas são as perguntas que mais me ajudam. Escreva do jeito que você falaria comigo.",
    blocos: ["intencao"],
    // As abertas 25, 26 e 27 pertencem ao bloco "lucratividade" na leitura,
    // mas como experiência de preenchimento elas são o fecho do formulário —
    // é onde a pessoa fala livremente. Ficam na última etapa, e a lista
    // abaixo declara isso explicitamente em vez de mover a pergunta de
    // bloco, que bagunçaria a leitura posterior.
  },
] as const;

/**
 * Perguntas que a última etapa acrescenta além dos blocos declarados.
 *
 * Estão aqui — e não no bloco — porque o agrupamento de leitura é uma
 * coisa e a ordem de preenchimento é outra. Manter as abertas no bloco
 * "lucratividade" preserva a leitura por bloco que a consultora já usa;
 * mostrá-las no fim preserva a experiência de quem responde.
 */
export const PERGUNTAS_EXTRAS_ULTIMA_ETAPA: readonly string[] = [
  "maior-problema",
  "o-que-mudaria",
  "observacoes-livres",
];

/**
 * A pergunta de WhatsApp fica na última etapa junto com a intenção —
 * pedir o telefone no começo, antes de a pessoa ter recebido qualquer
 * valor, é o que mais derruba conversão em formulário de diagnóstico.
 */
export const PERGUNTAS_ULTIMA_ETAPA: readonly string[] = [
  ...PERGUNTAS_EXTRAS_ULTIMA_ETAPA,
  "whatsapp-retorno",
  "pretende-melhorar-30-dias",
];
