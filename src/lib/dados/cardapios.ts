/**
 * CARDÁPIOS — o prato publicado, e o que falta nele.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CARDÁPIO NÃO É UM SEGUNDO CADASTRO DE PRATO                        │
 * │                                                                      │
 * │ A tentação era óbvia: um cardápio precisa de nome, categoria, preço e  │
 * │ descrição para cada prato — e isso é quase uma ficha técnica.         │
 * │ Duplicar os campos criaria dois cadastros do MESMO prato, e no dia em  │
 * │ que a ficha mudasse de preço, o cardápio continuaria mostrando o       │
 * │ antigo, com a mesma aparência de número certo.                        │
 * │                                                                      │
 * │ Aqui, `ItemDeCardapio` guarda TRÊS COISAS, e nenhuma delas é o prato:  │
 * │                                                                      │
 * │   `fichaId`      — de qual ficha técnica este item é.
 * │   `categoriaId`  — em que seção do cardápio ele é publicado.
 * │   `ordem`        — onde ele aparece dentro da seção.
 * │                                                                      │
 * │ Nome, custo, CMV, preço e rendimento saem da ficha, pelo mesmo motor   │
 * │ que a precificação usa. O cardápio acrescenta APRESENTAÇÃO — a seção   │
 * │ e a ordem — e nada mais.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O MESMO PRATO PODE APARECER DUAS VEZES, E ISSO NÃO É UM ERRO          │
 * │                                                                      │
 * │ "Costela" costuma estar na seção Carnes e no "Sugestões do chef". São  │
 * │ dois ANÚNCIOS do mesmo prato, e a ficha é uma só: corrigir o preço na  │
 * │ ficha corrige os dois anúncios de uma vez. É exatamente o que a        │
 * │ duplicação de cadastro não faria.                                     │
 * │                                                                      │
 * │ Por isso a bancada verifica as duas coisas juntas: que a repetição é   │
 * │ permitida entre seções, e que ela NÃO é permitida dentro da mesma      │
 * │ seção — duas linhas iguais na mesma seção seriam um acidente de        │
 * │ digitação, e não uma decisão editorial.                               │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CARDÁPIO NÃO DECIDE O QUE É UM CARDÁPIO BOM                         │
 * │                                                                      │
 * │ Não existe "cardápio equilibrado", "margem ideal da casa",           │
 * │ "quantidade certa de opções por seção", "estrela do chef" nem nota.    │
 * │ Nada disso foi respondido, e o sistema não escolhe por conta própria.  │
 * │                                                                      │
 * │ O que existe é o que se pode MEDIR: quantos itens, quantos com preço,  │
 * │ quantos com custo fechado, quantos com CMV calculável, e a soma dos    │
 * │ preços declarados — que NÃO é faturamento, porque não há venda atrás.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { Cliente, Ficha } from "./tipos-operacao";
import type { ItemResolvido } from "./custos-ficha";
import type { ParametrosComerciais } from "./indicadores-comerciais";
import {
  linhaDePrecificacao,
  temPreco,
  type EstadoComercial,
  type LinhaPrecificacao,
} from "./precificacao";

/**
 * O CARDÁPIO PUBLICADO.
 *
 * `clienteId` é o dono, e é ele que fecha o escopo: o mesmo prato não tem o
 * mesmo custo em dois clientes, porque o preço do insumo é por cliente. Um
 * cardápio que misturasse fichas de dois clientes mostraria um custo médio que
 * não existe em lugar nenhum.
 *
 * `consultoriaId` é opcional e é HISTÓRICO, não escopo: registra de qual
 * trabalho este cardápio nasceu. Ele pode estar ausente (cardápio montado
 * fora de uma consultoria) e não pode apontar para a consultoria de outro
 * cliente — quem garante isso é o construtor, não o tipo.
 */
export type SituacaoCardapio = "RASCUNHO" | "PUBLICADO" | "ARQUIVADO";

export const ROTULO_SITUACAO_CARDAPIO: Record<SituacaoCardapio, string> = {
  RASCUNHO: "Em montagem",
  PUBLICADO: "Publicado",
  ARQUIVADO: "Arquivado",
};

export type CategoriaDoCardapio = {
  id: string;
  nome: string;
  /** A ordem da SEÇÃO na página. `null` = ainda não posicionada. */
  ordem: number | null;
  /** O que a seção quer dizer. Texto do cardápio, não do sistema. */
  descricao: string;
};

export type ItemDeCardapio = {
  /** Identidade da LINHA. O mesmo prato em duas seções são duas linhas. */
  id: string;
  /** A ficha técnica que este item publica. NÃO é uma cópia dela. */
  fichaId: string;
  /** A seção em que ele é publicado. */
  categoriaId: string;
  /** A ordem dentro da seção. `null` = ainda não posicionado. */
  ordem: number | null;
  /** Como este prato é anunciado, quando o anúncio difere do nome da ficha. */
  nomeNoCardapio: string | null;
  /** O que a casa quer dizer sobre ele na página. */
  descricao: string;
  /** "Sugestão do chef", "vegano", "sem glúten". Texto livre, dela. */
  destaque: string;
};

export type Cardapio = {
  id: string;
  clienteId: string;
  /** A consultoria de onde ele nasceu, quando nasceu de uma. */
  consultoriaId: string | null;
  nome: string;
  descricao: string;
  situacao: SituacaoCardapio;
  /** As seções, na ordem em que foram criadas. A ordem de exibição é `ordem`. */
  categorias: readonly CategoriaDoCardapio[];
  /** Os itens publicados. */
  itens: readonly ItemDeCardapio[];
  criadoEm: Date;
  atualizadoEm: Date;
  /** Histórico de alterações, no mesmo formato da ficha. */
  historico: ReadonlyArray<{ em: Date; oQue: string; quem: string }>;
};

// ---------------------------------------------------------------------------
// Arquivar não é apagar
// ---------------------------------------------------------------------------

/**
 * O CARDÁPIO ARQUIVADO SAI DA LISTA E CONTINUA EXISTINDO.
 *
 * É a mesma separação que o insumo já faz, e pelo mesmo motivo: um cardápio
 * publicado é histórico. Ele foi impresso, foi para a mesa, o cliente pagou
 * por ele. Tirá-lo das listas é uma coisa; dizer que ele nunca existiu é
 * outra, e a segunda apaga a prova do trabalho.
 *
 * A diferença entre ARQUIVAR e EXCLUIR, traduzida para esta tela:
 *
 *   ARQUIVAR   "não uso mais este cardápio"  → sai das listas, o registro fica,
 *                                              e ele pode voltar.
 *   EXCLUIR    "este cardápio nunca existiu" → sai das listas E do acervo.
 *                                              O que se perde é irrecuperável.
 *
 * A tela oferece as duas, e a de excluir exige confirmação — porque é a única
 * ação desta tela que não tem volta.
 */
export function cardapiosVisiveis(
  cardapios: readonly Cardapio[],
  opcoes?: { incluirArquivados?: boolean }
): readonly Cardapio[] {
  const todos = opcoes?.incluirArquivados
    ? cardapios
    : cardapios.filter((c) => c.situacao !== "ARQUIVADO");
  return [...todos].sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime());
}

/** O total de itens, contando repetições entre seções — que são intencionais. */
export function contarItens(cardapio: Cardapio): number {
  return cardapio.itens.length;
}

/**
 * OS PRATOS DISTINTOS DO CARDÁPIO.
 *
 * Diferente de `contarItens`: "Costela" em duas seções são dois itens e UM
 * prato. As duas contagens aparecem na tela lado a lado porque as duas são
 * verdadeiras e respondem perguntas diferentes — quantas linhas o cliente lê,
 * e quantas fichas técnicas esta consultora tem de manter em dia.
 */
export function pratosDistintos(cardapio: Cardapio): number {
  return new Set(cardapio.itens.map((i) => i.fichaId)).size;
}

// ---------------------------------------------------------------------------
// A conferência do cardápio — o que impede ele de sair incompleto
// ---------------------------------------------------------------------------

export type PendenciaDoCardapio =
  | "SEM_ITENS"
  | "FICHA_INEXISTENTE"
  | "FICHA_DE_OUTRO_CLIENTE"
  | "ITEM_ORFAO"
  | "SEM_PRECO"
  | "SEM_CUSTO"
  | "SEM_PORCOES"
  | "SEM_CATEGORIA";

export const ACAO_DA_PENDENCIA_DO_CARDAPIO: Record<PendenciaDoCardapio, string> = {
  SEM_ITENS: "Escolher as fichas que entram no cardápio",
  FICHA_INEXISTENTE: "Remover o item — a ficha técnica dele não existe mais",
  FICHA_DE_OUTRO_CLIENTE: "Remover o item ou trocar a ficha por uma deste cliente",
  ITEM_ORFAO: "Mover o item para uma seção que existe",
  SEM_PRECO: "Informar o preço de venda na ficha técnica",
  SEM_CUSTO: "Fechar o custo da ficha técnica",
  SEM_PORCOES: "Declarar o rendimento em porções na ficha técnica",
  SEM_CATEGORIA: "Criar pelo menos uma seção",
};

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE CADA PENDÊNCIA CARREGA O ITEM QUE A CAUSOU                    │
 * │                                                                      │
 * │ Uma pendência sem endereço não é acionável. "3 itens sem preço" faz a  │
 * │ consultora procurar quais; "Costela sem preço" faz ela abrir a ficha.  │
 * │                                                                      │
 * │ Por isso o relatório devolve OS ITENS, e não a contagem. Quem quiser   │
 * │ o número conta a lista — e a lista e o número nunca discordam, porque  │
 * │ o número é derivado dela.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type OcorrenciaDoCardapio = {
  pendencia: PendenciaDoCardapio;
  /** A linha do cardápio, quando a pendência é de um item. */
  itemId: string | null;
  /** O que aparece na tela: o nome do prato ou o da seção. */
  onde: string;
  /** A ação em uma frase, do mesmo mapa acima. */
  acao: string;
};

export type ResumoDoCardapio = {
  itens: number;
  pratosDistintos: number;
  secoes: number;
  comPreco: number;
  semPreco: number;
  comCustoFechado: number;
  semCusto: number;
  /** Itens cujo CMV/custo-da-venda é calculável. */
  comercialCalculavel: number;
  abaixoDoCusto: number;
  ocorrencias: ReadonlyArray<OcorrenciaDoCardapio>;
  /** A soma dos preços DECLARADOS. Não é faturamento — ver `somarPrecosDoCardapio`. */
  somaDosPrecos: number;
  /** Quantos itens entraram nessa soma. */
  itensSomados: number;
};

/**
 * A LINHA JÁ RESOLVIDA — o que o cardápio mostra de cada item.
 *
 * `linha` é a mesma `LinhaPrecificacao` da tela de precificação, produzida
 * pelo mesmo `linhaDePrecificacao`. Não existe uma segunda conta de custo
 * para o cardápio; se existisse, o mesmo prato teria dois custos no sistema.
 */
export type LinhaDoCardapio = {
  item: ItemDeCardapio;
  /** O nome a exibir: o do anúncio, quando houver; senão o da ficha. */
  nome: string;
  /** A ficha resolvida. `null` quando o item aponta para ficha inexistente. */
  ficha: Ficha | null;
  /** O custo/CMV/preço, quando há ficha. `null` quando não há. */
  linha: LinhaPrecificacao | null;
  /** O nome da seção em que este item está. */
  secao: string;
  estado: EstadoComercial;
  ajustes: ReadonlyArray<PendenciaDoCardapio>;
};

export type EntradaDoCardapio = {
  cardapio: Cardapio;
  /** As fichas visíveis do cliente dono do cardápio. */
  fichas: readonly Ficha[];
  /** As linhas resolvidas por ficha — o mesmo `resolver` das outras telas. */
  resolver: (ficha: Ficha) => readonly ItemResolvido[];
  /** O cliente dono. Ausente, o cardápio é tratado como sem dono conhecido. */
  cliente?: Cliente | null;
  /** O padrão comercial do cliente, quando existir. A ficha ganha dele. */
  parametrosDoCliente?: ParametrosComerciais | null;
};

/**
 * MONTA AS LINHAS DE UM CARDÁPIO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ORDEM DE EXIBIÇÃO TEM UMA REGRA, E ELA É DECLARADA                 │
 * │                                                                      │
 * │ Seções: por `ordem`, e as não posicionadas (`null`) vão para o fim,    │
 * │ na ordem em que foram criadas.                                        │
 * │                                                                      │
 * │ Itens: por `ordem` dentro da seção, e os não posicionados vão para o   │
 * │ fim, na ordem do cadastro.                                             │
 * │                                                                      │
 * │ `null` e `0` são coisas diferentes aqui: `0` é "decidi que este vai    │
 * │ primeiro", `null` é "ainda não decidi". Se os dois valessem zero, o    │
 * │ primeiro item de uma seção recém-criada pareceria posicionado de       │
 * │ propósito.                                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function montarLinhasDoCardapio(entrada: EntradaDoCardapio): readonly LinhaDoCardapio[] {
  const { cardapio, resolver } = entrada;

  const secoes = ordenarSecoes(cardapio.categorias);
  const nomeDaSecao = new Map(cardapio.categorias.map((c) => [c.id, c.nome]));

  /*
    O escopo por cliente é conferido AQUI, e não só na tela que monta o
    cardápio. Uma ficha de outro cliente dentro deste cardápio produziria um
    custo calculado com o preço do cliente errado — plausível, e portanto
    perigoso. Ela continua aparecendo (esconder seria pior: a linha sumiria
    sem explicação), mas marcada.
  */
  const fichaPorId = new Map(entrada.fichas.map((f) => [f.id, f]));

  const itens = ordenarItens(cardapio.itens, secoes.map((s) => s.id));

  return itens.map((item) => {
    const ficha = fichaPorId.get(item.fichaId) ?? null;
    const ajustes: PendenciaDoCardapio[] = [];

    if (ficha === null) {
      ajustes.push("FICHA_INEXISTENTE");
    } else if (ficha.clienteId !== cardapio.clienteId) {
      ajustes.push("FICHA_DE_OUTRO_CLIENTE");
    }

    if (!nomeDaSecao.has(item.categoriaId)) ajustes.push("ITEM_ORFAO");

    /*
      A ficha só é resolvida quando ela existe E pertence a este cliente. Uma
      ficha de outro cliente tem preço de outro cliente: calcular o custo dela
      aqui daria um número que nenhuma tela deste cliente reconhece.

      A precedência dos parâmetros NÃO é decidida aqui: ela é do
      `linhaDePrecificacao`, que a recebe no terceiro argumento. Repetir o
      `ficha.parametros ?? doCliente ?? vazio` neste arquivo seria a segunda
      cópia da mesma regra — e a que divergisse daria ao mesmo prato um CMV na
      precificação e outro no cardápio.
    */
    const podeCalcular = ficha !== null && ficha.clienteId === cardapio.clienteId;

    const linha =
      podeCalcular && ficha
        ? linhaDePrecificacao(ficha, resolver(ficha), entrada.parametrosDoCliente ?? null)
        : null;

    if (linha !== null) {
      if (!temPreco(linha.ficha.precoVenda)) ajustes.push("SEM_PRECO");
      if (linha.custo.vazio) ajustes.push("SEM_CUSTO");
      if (!ehNumero(linha.ficha.rendimentoPorcoes)) ajustes.push("SEM_PORCOES");
    }

    return {
      item,
      nome: item.nomeNoCardapio?.trim() || ficha?.nome || "Prato removido",
      ficha,
      linha,
      secao: nomeDaSecao.get(item.categoriaId) ?? "Seção removida",
      estado: linha?.estado ?? "NAO_CALCULAVEL",
      ajustes,
    };
  });
}

function ehNumero(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * A ordenação das seções — `null` depois, e o resto por `ordem`.
 *
 * `Number.POSITIVE_INFINITY` como chave das não posicionadas é o que faz as
 * duas regras caberem numa comparação só. Escrever um `if` para separar os
 * dois grupos antes daria o mesmo resultado com mais linhas e mais chance de
 * uma das metades esquecer o desempate por criação.
 */
function ordenarSecoes(
  categorias: readonly CategoriaDoCardapio[]
): readonly CategoriaDoCardapio[] {
  return categorias
    .map((c, indice) => ({ c, indice }))
    .sort((a, b) => {
      const oa = a.c.ordem ?? Number.POSITIVE_INFINITY;
      const ob = b.c.ordem ?? Number.POSITIVE_INFINITY;
      if (oa !== ob) return oa - ob;
      return a.indice - b.indice;
    })
    .map((x) => x.c);
}

/**
 * A ordenação dos itens.
 *
 * `idsNaOrdemDasSecoes` é a ordem das seções JÁ resolvida. Um item cuja seção
 * não existe vai para o fim: ele não tem lugar na página, e é isso que a
 * pendência `ITEM_ORFAO` diz.
 */
function ordenarItens(
  itens: readonly ItemDeCardapio[],
  idsNaOrdemDasSecoes: readonly string[]
): readonly ItemDeCardapio[] {
  const posicaoDaSecao = new Map(idsNaOrdemDasSecoes.map((id, i) => [id, i]));

  return itens
    .map((item, indice) => ({ item, indice }))
    .sort((a, b) => {
      const sa = posicaoDaSecao.get(a.item.categoriaId) ?? Number.POSITIVE_INFINITY;
      const sb = posicaoDaSecao.get(b.item.categoriaId) ?? Number.POSITIVE_INFINITY;
      if (sa !== sb) return sa - sb;

      const oa = a.item.ordem ?? Number.POSITIVE_INFINITY;
      const ob = b.item.ordem ?? Number.POSITIVE_INFINITY;
      if (oa !== ob) return oa - ob;

      return a.indice - b.indice;
    })
    .map((x) => x.item);
}

/**
 * O RESUMO — contagens conferíveis, e a lista de pendências por item.
 *
 * A `somaDosPrecos` é a soma dos preços DECLARADOS nas fichas. Chamá-la de
 * faturamento seria a troca mais fácil de fazer e a mais enganosa: não há
 * venda nenhuma atrás. Um cardápio é uma lista de intenções de venda.
 */
export function resumirCardapio(
  cardapio: Cardapio,
  linhas: readonly LinhaDoCardapio[]
): ResumoDoCardapio {
  const ocorrencias: OcorrenciaDoCardapio[] = [];

  if (cardapio.categorias.length === 0) {
    ocorrencias.push({
      pendencia: "SEM_CATEGORIA",
      itemId: null,
      onde: "O cardápio",
      acao: ACAO_DA_PENDENCIA_DO_CARDAPIO.SEM_CATEGORIA,
    });
  }

  if (cardapio.itens.length === 0) {
    ocorrencias.push({
      pendencia: "SEM_ITENS",
      itemId: null,
      onde: "O cardápio",
      acao: ACAO_DA_PENDENCIA_DO_CARDAPIO.SEM_ITENS,
    });
  }

  /*
    Cada ajuste de cada linha vira uma ocorrência, sem deduplicação. Duas
    linhas sem preço são duas ocorrências — e as duas precisam de ação
    própria, porque são duas fichas diferentes para corrigir.
  */
  for (const linha of linhas) {
    for (const pendencia of linha.ajustes) {
      ocorrencias.push({
        pendencia,
        itemId: linha.item.id,
        onde: linha.nome,
        acao: ACAO_DA_PENDENCIA_DO_CARDAPIO[pendencia],
      });
    }
  }

  const comPreco = linhas.filter((l) => temPreco(l.ficha?.precoVenda)).length;
  const comCustoFechado = linhas.filter((l) => l.linha?.custo.completo === true).length;

  return {
    itens: cardapio.itens.length,
    pratosDistintos: pratosDistintos(cardapio),
    secoes: cardapio.categorias.length,
    comPreco,
    semPreco: linhas.filter((l) => l.linha !== null).length - comPreco,
    comCustoFechado,
    semCusto: linhas.filter((l) => l.linha !== null).length - comCustoFechado,
    comercialCalculavel: linhas.filter((l) => l.linha?.comercial.venda !== null).length,
    abaixoDoCusto: linhas.filter((l) => l.estado === "CMV_ACIMA_DO_CUSTO").length,
    ocorrencias,
    somaDosPrecos: somarPrecosDoCardapio(linhas).total,
    itensSomados: somarPrecosDoCardapio(linhas).itens,
  };
}

/**
 * A SOMA DOS PREÇOS PUBLICADOS — e o que ela não é.
 *
 * Soma preço de venda de prato, não venda de prato. A diferença é a mesma
 * entre uma lista de intenções e um resultado: ninguém comeu nada ainda.
 *
 * Também não é "preço médio × itens": a média de um cardápio não é um prato
 * que existe, e é dela que sairiam decisões sobre pratos que existem.
 */
export function somarPrecosDoCardapio(linhas: readonly LinhaDoCardapio[]): {
  total: number;
  itens: number;
} {
  let total = 0;
  let itens = 0;
  for (const l of linhas) {
    const preco = l.ficha?.precoVenda ?? null;
    if (!temPreco(preco)) continue;
    total += preco;
    itens += 1;
  }
  return { total, itens };
}

/**
 * O RÓTULO E O TOM DE UMA LINHA — reexportados da precificação.
 *
 * Não há aqui uma segunda tabela de "preço abaixo do custo". O que o cardápio
 * mostra é o mesmo veredito do mesmo módulo, com o mesmo texto e a mesma cor:
 * a única forma de as duas telas discordarem seria escrever duas.
 *
 * O `export ... from` é deliberado, e não `import` seguido de `export`. O
 * segundo traria os três nomes para dentro DESTE módulo só para empurrá-los
 * adiante, e um leitor teria de conferir se eles são passados intactos. Aqui
 * a reexportação declara, por si, que nada foi tocado no caminho.
 */
export {
  ROTULO_ESTADO_COMERCIAL,
  TOM_ESTADO_COMERCIAL,
  estadoComercial,
  type EstadoComercial,
} from "./precificacao";
