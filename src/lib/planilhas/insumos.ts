/**
 * O ÍNDICE DE INSUMOS — o cruzamento que os modelos de ficha e de custo usam.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO NÃO MORA DENTRO DE CADA MODELO                          │
 * │                                                                      │
 * │ Duas abas de dois modelos diferentes precisam responder à mesma        │
 * │ pergunta: "dado este `ingredienteId`, qual é o insumo e qual é o       │
 * │ preço DESTE cliente?". A ficha técnica precisa para escrever a coluna  │
 * │ INGREDIENTE e a coluna CUSTO; a planilha de custos precisa para a      │
 * │ mesma coisa.                                                            │
 * │                                                                      │
 * │ A ficha guarda só o `ingredienteId`. Quem traduz id em nome e preço é  │
 * │ este cruzamento — e ele é a única coisa que separa uma ficha técnica   │
 * │ legível de uma coluna cheia de `in_mandioca`.                          │
 * │                                                                      │
 * │ Escrito uma vez, os dois modelos não têm como divergir sobre qual      │
 * │ preço vale. Escrito duas vezes, o dia em que um deles mudar a          │
 * │ precedência é o dia em que a ficha e os custos do mesmo prato passam   │
 * │ a discordar — com as duas aparências de certas.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O QUE ESTE ARQUIVO NÃO FAZ: não decide preço. Ele só monta os dois mapas
 * que `resolverItem` já sabe consumir. A precedência (cliente → ficha →
 * biblioteca) continua morando lá, onde foi validada.
 */

import type { Ingrediente, IngredienteDoCliente, LinhaIngredienteDoCliente } from "@/lib/dados";
import type { ContextoPlanilha } from "./tipos";

export type IndiceDeInsumos = {
  /** O insumo da biblioteca, pelo id. `null` para id que não existe mais. */
  porId: (id: string) => Ingrediente | null;
  /** O preço DESTE cliente para o insumo, pelo id. `null` quando não há. */
  doCliente: (id: string) => IngredienteDoCliente | null;
  /** Quantos insumos o cliente realmente usa em ficha. */
  emUso: readonly LinhaIngredienteDoCliente[];
  /** A biblioteca inteira, para quem precisa listar. */
  todas: readonly LinhaIngredienteDoCliente[];
};

/**
 * Monta os dois mapas — chamado UMA vez por modelo, e não uma vez por ficha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE FUNÇÃO E NÃO `Map` DIRETO                                    │
 * │                                                                      │
 * │ Um `Map.get` devolve `T | undefined`, e o `noUncheckedIndexedAccess`  │
 * │ deste projeto obriga cada chamada a repetir o `?? null`. Com quinze   │
 * │ fichas e oito itens cada, são cento e vinte repetições — e a centésima │
 * │ vigésima primeira, escrita com pressa, esquece o `?? null` e passa um  │
 * │ `undefined` para `resolverItem`.                                       │
 * │                                                                      │
 * │ A função devolve `null` sempre, que é o que `resolverItem` espera.     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function indexarInsumos(ctx: ContextoPlanilha): IndiceDeInsumos {
  const biblioteca = new Map<string, Ingrediente>(
    (ctx.ingredientes ?? []).map((i) => [i.id, i])
  );

  const precos = new Map<string, IngredienteDoCliente>();

  /*
    O preço do cliente vem da LINHA já cruzada pelo repositório — que traz
    `precoAtual` resolvido e `origemDoPreco` dizendo qual dos dois foi usado.
    Reconstruir um `IngredienteDoCliente` a partir dela seria refazer, pior,
    o cruzamento que o repositório já fez.

    O que se perde na conversão são os campos que `resolverItem` não lê:
    `historico` e `observacoes`. Eles continuam disponíveis em
    `linha`/`todas`, para a aba que precisar mostrá-los.
  */
  const todas = ctx.ingredientesDoCliente ?? [];

  for (const linha of todas) {
    precos.set(linha.ingrediente.id, {
      id: linha.id,
      clienteId: ctx.cliente.id,
      ingredienteId: linha.ingrediente.id,
      precoAtual: linha.precoAtual,
      unidade: linha.ingrediente.unidade,
      fornecedor: linha.fornecedor,
      atualizadoEm: linha.atualizadoEm,
      historico: [...linha.historico],
      observacoes: "",
    });
  }

  return {
    porId: (id) => biblioteca.get(id) ?? null,
    doCliente: (id) => precos.get(id) ?? null,
    emUso: todas.filter((l) => l.usosNoCliente > 0),
    todas,
  };
}
