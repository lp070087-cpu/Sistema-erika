/**
 * A SESSÃO DENTRO DA PLANILHA — o que a Central não vê sozinha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O DEFEITO QUE ESTE ARQUIVO CONSERTA                                  │
 * │                                                                      │
 * │ A Central monta a planilha a partir de `montarContexto`, que lê o     │
 * │ REPOSITÓRIO. O repositório é o cenário: ele não enxerga a ficha que a │
 * │ Érika acabou de criar, nem o insumo que ela acabou de cadastrar.      │
 * │                                                                      │
 * │ O resultado era o pior possível para quem está trabalhando: ela cria  │
 * │ a ficha, abre a planilha "Ficha técnica" do mesmo cliente, e o prato   │
 * │ NÃO ESTÁ LÁ. Não há erro, não há aviso — a planilha parece certa e    │
 * │ está incompleta. É a mesma classe de defeito que a lista de fichas     │
 * │ tinha antes de assinar o estado da sessão.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É PURO, E O QUE ELE **NÃO** FAZ                         │
 * │                                                                      │
 * │ Ele não lê o store. Recebe `{ fichas, ingredientesNovos }` já         │
 * │ resolvidos e devolve um contexto novo — do mesmo jeito que os         │
 * │ geradores recebem um contexto e devolvem uma grade. É o que permite   │
 * │ provar a sobreposição numa bancada de `node`, sem navegador.          │
 * │                                                                      │
 * │ E ELE SÓ ACRESCENTA. Não remove, não corrige preço, não decide o que  │
 * │ sai. As três ausências são deliberadas:                                   │
 * │                                                                      │
 * │   NÃO REMOVE — um insumo excluído continua no contexto, e continua    │
 * │   sendo o aviso de procedência que conta que ele saiu. Filtrá-lo aqui │
 * │   faria a planilha nascer sem ele e o aviso nascer calado, e a        │
 * │   conferência de procedência — que tem bancada própria — deixaria de  │
 * │   disparar sobre o caso que ela existe para cobrir.                   │
 * │                                                                      │
 * │   NÃO ARQUIVA — `insumoForaDaBiblioteca` não é consultado. Arquivar   │
 * │   existe para tirar o insumo das LISTAS de escolha, e não para mexer  │
 * │   no passado; a planilha é um documento sobre o que a ficha usa. A     │
 * │   mesma distinção já está escrita em `ambiente.tsx`, na conferência    │
 * │   de divergência: ARQUIVADO não é exclusão.                           │
 * │                                                                      │
 * │   NÃO TROCA PREÇO — o preço de um insumo que JÁ EXISTIA e foi         │
 * │   alterado nesta sessão continua saindo pelo valor de referência, e o  │
 * │   aviso de procedência é quem diz que ele mudou. Sobrepor o preço aqui │
 * │   faria a planilha concordar com o aviso, e o aviso nunca dispararia   │
 * │   — matando, em silêncio, uma conferência inteira.                    │
 * │                                                                      │
 * │ O preço do insumo NOVO é a exceção que confirma a regra: ele não tem  │
 * │ preço anterior com que divergir. Ele simplesmente passa a existir, e  │
 * │ existe com o preço que ela digitou.                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { Ficha, Ingrediente, LinhaIngredienteDoCliente } from "@/lib/dados";
import type { ContextoPlanilha } from "./tipos";

/** O que a sessão acrescentou, já recortado por quem chama. */
export type SessaoDaPlanilha = {
  /**
   * O acervo deste cliente, do jeito que as telas o mostram — cenário com as
   * edições da sessão, mais as criadas agora, sem as excluídas.
   *
   * Vem pronto porque a regra de montagem é uma só e mora no store
   * (`acervoDeFichas`). Uma segunda montagem aqui divergiria da lista de
   * fichas no dia em que alguém mexesse numa das duas.
   */
  fichas: readonly Ficha[];
  /** Os insumos cadastrados nesta sessão. */
  ingredientesNovos: readonly Ingrediente[];
};

/**
 * Quantas fichas usam este insumo.
 *
 * É a mesma pergunta que o repositório responde em `listarIngredientesDoCliente`
 * — e a única que precisa ser refeita aqui, porque a resposta dele é do cenário
 * e esta é do acervo de agora. Quem manda no número é a lista que ela está
 * vendo, não a que o banco conhecia de manhã.
 */
export function contarUsos(fichas: readonly Ficha[], ingredienteId: string): number {
  return fichas.filter((f) => f.itens.some((i) => i.ingredienteId === ingredienteId)).length;
}

/**
 * Devolve o contexto com a sessão por cima do cenário.
 *
 * Não muta nada: um contexto novo, com as três listas refeitas. Os campos que
 * ele não toca (`cliente`, `consultoria`, `tarefas`, `acompanhamentos`,
 * `observacoes`, `geradoEm`) atravessam por referência e valor — não há motivo
 * para copiar o que não muda.
 */
export function sobreporSessao(
  ctx: ContextoPlanilha,
  sessao: SessaoDaPlanilha
): ContextoPlanilha {
  /*
    ── A BIBLIOTECA, COM OS INSUMOS NOVOS NA FRENTE ────────────────────────

    A ordem importa e é a mesma dos outros cruzamentos do projeto: o que a
    sessão criou vence pelo id. Aqui não há como haver conflito — um insumo
    novo tem id novo, gerado por `idDaSessao` —, mas escrever a sobreposição
    como "o de baixo vence" deixa a regra dita, em vez de depender de os ids
    nunca colidirem.
  */
  const biblioteca = new Map<string, Ingrediente>(
    (ctx.ingredientes ?? []).map((i) => [i.id, i])
  );
  for (const novo of sessao.ingredientesNovos) biblioteca.set(novo.id, novo);

  /*
    ── AS LINHAS POR CLIENTE, REFEITAS ─────────────────────────────────────

    O preço de cada linha continua sendo o que o repositório resolveu — só o
    `usosNoCliente` é recalculado, e é ele que decide se o insumo aparece na
    aba BASE ("só o que este cliente usa"). Sem o recálculo, o insumo que a
    ficha nova trouxe ficaria fora de BASE, e a lista para levar à feira
    mentiria por omissão sobre justamente o prato recém-criado.
  */
  const porId = new Map<string, LinhaIngredienteDoCliente>(
    (ctx.ingredientesDoCliente ?? []).map((l) => [l.ingrediente.id, l])
  );

  const ingredientesDoCliente: LinhaIngredienteDoCliente[] = [...biblioteca.values()].map(
    (ingrediente) => {
      const linha = porId.get(ingrediente.id);

      /*
        A linha do repositório é PREFERIDA quando existe, e não reconstruída a
        partir do insumo. Ela já traz o preço do cliente resolvido, a origem
        dele e o fornecedor — reconstruir seria refazer, pior, o cruzamento que
        o repositório fez.

        O insumo NOVO não tem linha, e é aí que a linha é montada: preço do
        próprio insumo, origem BIBLIOTECA, porque ainda não existe preço de
        cliente para ele.
      */
      return {
        id: linha?.id ?? `${ctx.cliente.id}_${ingrediente.id}`,
        ingrediente,
        precoAtual: linha?.precoAtual ?? ingrediente.precoAtual,
        origemDoPreco: linha?.origemDoPreco ?? "BIBLIOTECA",
        fornecedor: linha?.fornecedor ?? ingrediente.fornecedor,
        atualizadoEm: linha?.atualizadoEm ?? ingrediente.atualizadoEm,
        historico: linha?.historico ?? ingrediente.historico,
        usosNoCliente: contarUsos(sessao.fichas, ingrediente.id),
      };
    }
  );

  return {
    ...ctx,
    ingredientes: [...biblioteca.values()],
    ingredientesDoCliente,
    fichas: sessao.fichas,
  };
}
