/**
 * BUSCA GLOBAL — o índice e a procura.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A BUSCA É UM ÍNDICE MONTADO NO SERVIDOR                      │
 * │                                                                      │
 * │ A alternativa óbvia seria o campo de busca carregar tudo por uma API  │
 * │ a cada tecla. Duas razões para não fazer isso:                        │
 * │                                                                      │
 * │ 1. Não existe API. A Seção 30 proíbe criar rota falsa — e criar uma   │
 * │    rota só para a demonstração seria construir a coisa errada por     │
 * │    um motivo temporário.                                              │
 * │                                                                      │
 * │ 2. Mesmo com API, a busca global é sobre POUCA coisa: cliente, lead,  │
 * │    consultoria, ficha, ingrediente, processo, acompanhamento, tarefa. │
 * │    São centenas de linhas, não milhões. Mandar o índice uma vez é     │
 * │    mais rápido que ir buscar a cada tecla, e funciona sem rede.       │
 * │                                                                      │
 * │ Quando o volume justificar, trocar por consulta ao banco é substituir │
 * │ a montagem do índice — as telas não mudam, porque quem procura é uma  │
 * │ função pura sobre uma lista.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * A função de procura é PURA, sem dependência de mock: é a mesma que o
 * Prisma vai usar quando o índice vier de uma consulta.
 */

export type TipoResultadoBusca =
  | "CLIENTE"
  | "LEAD"
  | "CONSULTORIA"
  | "FICHA"
  | "INGREDIENTE"
  | "PROCESSO"
  | "ACOMPANHAMENTO"
  | "TAREFA";

/** O que a busca precisa saber de cada coisa para poder encontrá-la. */
export type ItemBusca = {
  id: string;
  tipo: TipoResultadoBusca;
  titulo: string;
  /** Linha de contexto. "Cliente · À la carte · Serra Negra". */
  detalhe: string;
  href: string;
  /**
   * Texto adicional indexado que NÃO aparece na tela — nome do responsável,
   * cidade, fornecedor, categoria. É o que faz "Serra Negra" encontrar uma
   * ficha que não tem a cidade no título.
   */
  termos?: string;
};

export type ResultadoBusca = ItemBusca & {
  /** Onde o termo bateu, para a tela poder destacar ou não. */
  relevancia: number;
};

const ROTULO_TIPO: Record<TipoResultadoBusca, string> = {
  CLIENTE: "Cliente",
  LEAD: "Lead",
  CONSULTORIA: "Consultoria",
  FICHA: "Ficha técnica",
  INGREDIENTE: "Ingrediente",
  PROCESSO: "Processo",
  ACOMPANHAMENTO: "Acompanhamento",
  TAREFA: "Tarefa",
};

export const ROTULO_TIPO_BUSCA = ROTULO_TIPO;

/** A ordem em que os grupos aparecem na lista de resultados. */
export const ORDEM_TIPOS: readonly TipoResultadoBusca[] = [
  "CLIENTE",
  "CONSULTORIA",
  "LEAD",
  "FICHA",
  "INGREDIENTE",
  "PROCESSO",
  "ACOMPANHAMENTO",
  "TAREFA",
];

/**
 * Tira acento e caixa.
 *
 * Sem isso, "cafe" não encontra "Café" e "acai" não encontra "Açaí" — que é
 * exatamente como as pessoas digitam com pressa, sem acento, no meio de
 * outra tarefa. A normalização é em NFD e remove os sinais combinantes.
 */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Quanto menor, melhor.
 *
 * 0 — o título começa pelo termo ("empor" → Emporio Verde)
 * 1 — o título contém o termo
 * 2 — bateu no contexto ou nos termos escondidos
 * 3 — bateu só em parte do termo (busca por múltiplas palavras, fora de ordem)
 * `null` — não bateu
 */
function relevanciaDe(item: ItemBusca, termo: string): number | null {
  const titulo = normalizar(item.titulo);
  if (titulo.startsWith(termo)) return 0;
  if (titulo.includes(termo)) return 1;

  const contexto = normalizar(`${item.detalhe} ${item.termos ?? ""}`);
  if (contexto.includes(termo)) return 2;

  // Última tentativa: todas as palavras do termo aparecem em algum lugar,
  // em qualquer ordem. É o que faz "verde emporio" achar "Emporio Verde".
  const palavras = termo.split(/\s+/).filter(Boolean);
  if (palavras.length > 1) {
    const tudo = normalizar(`${item.titulo} ${item.detalhe} ${item.termos ?? ""}`);
    if (palavras.every((p) => tudo.includes(p))) return 3;
  }

  return null;
}

/**
 * Procura no índice.
 *
 * Devolve vazio para termo com menos de 2 letras: com uma letra só, o
 * resultado é a lista inteira em ordem alfabética, o que não ajuda ninguém.
 */
export function buscar(itens: readonly ItemBusca[], termo: string, limite = 8): ResultadoBusca[] {
  const t = normalizar(termo);
  if (t.length < 2) return [];

  const achados: ResultadoBusca[] = [];
  for (const item of itens) {
    const r = relevanciaDe(item, t);
    if (r !== null) achados.push({ ...item, relevancia: r });
  }

  achados.sort((a, b) => {
    if (a.relevancia !== b.relevancia) return a.relevancia - b.relevancia;
    // Empate: a ordem dos grupos decide, e dentro do grupo o alfabeto.
    const ga = ORDEM_TIPOS.indexOf(a.tipo);
    const gb = ORDEM_TIPOS.indexOf(b.tipo);
    if (ga !== gb) return ga - gb;
    return a.titulo.localeCompare(b.titulo, "pt-BR");
  });

  return achados.slice(0, limite);
}

/** Agrupa por tipo, na ordem de `ORDEM_TIPOS`. Sem grupo vazio. */
export function agruparResultados(
  resultados: readonly ResultadoBusca[]
): Array<{ tipo: TipoResultadoBusca; rotulo: string; itens: ResultadoBusca[] }> {
  return ORDEM_TIPOS.map((tipo) => ({
    tipo,
    rotulo: ROTULO_TIPO[tipo],
    itens: resultados.filter((r) => r.tipo === tipo),
  })).filter((g) => g.itens.length > 0);
}
