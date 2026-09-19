import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * PRÉVIA TABULAR — a planilha, antes do arquivo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE COMPONENTE EXISTE, E POR QUE ELE NÃO É UMA LISTA        │
 * │                                                                      │
 * │ A Central de Planilhas é usada por quem já trabalha em planilha. O    │
 * │ formato que ela reconhece de relance é a GRADE: cabeçalho, colunas,   │
 * │ linhas, alinhamento à direita para número, total embaixo.             │
 * │                                                                      │
 * │ A tentação era entregar isso como cartões — é o que o resto do        │
 * │ sistema faz, e ficaria coerente com as outras telas. Só que cartão    │
 * │ destrói justamente o que a planilha tem de melhor: a COLUNA. Com      │
 * │ cartão, não se compara o preço de duas linhas de relance, não se vê   │
 * │ qual linha está fora da ordem de grandeza, e o total não tem onde     │
 * │ morar. Dado tabular precisa parecer tabular.                          │
 * │                                                                      │
 * │ Por isso este componente NÃO usa `ListaResponsiva`: aquela transforma  │
 * │ tabela em cartão no celular, o que é certo para uma lista de clientes  │
 * │ e errado aqui. No celular, esta prévia continua tabela e rola de lado  │
 * │ — DENTRO dela, nunca na página.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS QUATRO DECISÕES QUE FAZEM ISTO PARECER UMA PLANILHA               │
 * │                                                                      │
 * │ 1. COLUNA NÃO SE COMPRIME ATÉ FICAR ILEGÍVEL. A tabela tem largura     │
 * │    mínima (`min-w-max`) e as células não quebram linha. Numa tela      │
 * │    estreita, o resultado é rolagem horizontal DENTRO do contêiner da   │
 * │    tabela — e não uma coluna de números apertada em 30px, que é o      │
 * │    pior dos dois mundos: cabe na tela e não se lê.                     │
 * │                                                                      │
 * │ 2. NÚMERO À DIREITA, EM ALGARISMO TABULAR. Coluna de dinheiro          │
 * │    alinhada à esquerda não se soma de relance, porque a casa das       │
 * │    unidades de cada linha cai em posição diferente. É a mesma decisão  │
 * │    que `Tabela`/`Celula` já tomam com `align="dir"`.                   │
 * │                                                                      │
 * │ 3. CABEÇALHO FIXO. Numa prévia longa, o cabeçalho rola junto e a       │
 * │    pessoa passa a ler número sem saber de que coluna ele é. O          │
 * │    `sticky` mantém o rótulo à vista; com `alturaMaxima`, a tabela      │
 * │    ganha altura própria e a fixação passa a valer de verdade.          │
 * │                                                                      │
 * │ 4. FECHAMENTO EM RODAPÉ. Total não é uma linha qualquer: ele é         │
 * │    separado por uma linha mais forte e vem depois de todos os dados.   │
 * │    Se o total existe, ele tem lugar próprio — não vira um cartão       │
 * │    solto embaixo da tabela, longe das linhas que o compõem.            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE COMPONENTE NÃO CALCULA NADA                                     │
 * │                                                                      │
 * │ Ele recebe as células JÁ PRONTAS, formatadas, e as posiciona. Não     │
 * │ existe soma aqui dentro, não existe média, não existe arredondamento.  │
 * │                                                                      │
 * │ A regra que governa o resto do sistema vale aqui também: quem faz     │
 * │ conta é o domínio, em função pura, a partir de valor informado. Uma    │
 * │ prévia que somasse por conta própria seria um segundo lugar onde os    │
 * │ números nascem — e dois lugares para o mesmo número divergem.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export type ColunaPrevia = {
  chave: string;
  titulo: string;
  /** Coluna numérica: alinha à direita e usa algarismo tabular. */
  align?: "esq" | "dir" | "centro";
  /**
   * Largura mínima da coluna, em pixels.
   *
   * Existe para as colunas de texto curto que, sem ela, encolheriam até o
   * cabeçalho quebrar em três linhas. Não é largura fixa: a coluna pode
   * crescer, e só não pode ficar menor que isto.
   */
  larguraMinima?: number;
};

export type LinhaPrevia = {
  id: string;
  celulas: Readonly<Record<string, ReactNode>>;
  /** Linha de fechamento (subtotal, total) — recebe peso visual. */
  fechamento?: boolean;
};

/**
 * A PRÉVIA.
 *
 * `rodape` é separado de `linhas` de propósito. Um total no meio da lista de
 * dados faria o leitor somar a linha errada; e um total que fosse só "mais uma
 * linha" não se distinguiria do que ele soma.
 */
export function PreviaTabular({
  colunas,
  linhas,
  rodape,
  legenda,
  rotulo,
  vazio,
  alturaMaxima,
  className,
}: {
  colunas: readonly ColunaPrevia[];
  linhas: readonly LinhaPrevia[];
  rodape?: Readonly<Record<string, ReactNode>>;
  /** Uma linha de leitura sobre o que a tabela mostra. Opcional. */
  legenda?: ReactNode;
  /**
   * Nome da tabela para quem não a vê — leitor de tela.
   *
   * Uma `<table>` sem rótulo é uma grade de números sem significado para
   * quem navega por leitor: ele anuncia "tabela com 8 colunas e 12 linhas" e
   * não diz de quê.
   */
  rotulo: string;
  /** O que mostrar quando não há linha nenhuma. */
  vazio?: ReactNode;
  /** Altura em pixels. Sem ela, a tabela cresce o quanto precisar. */
  alturaMaxima?: number;
  className?: string;
}) {
  if (linhas.length === 0) {
    return <>{vazio ?? null}</>;
  }

  return (
    <figure className={cn("w-full", className)}>
      {/*
        O contêiner que rola é ESTE, e não a página.

        `overflow-x-auto` no div da tabela é o que garante que a rolagem
        lateral exista DENTRO da área da tabela. Se a grade pudesse esticar
        livremente, quem rolasse a tela de lado rolaria a página inteira — e
        o cabeçalho, o menu e o botão sairiam de vista junto.
      */}
      <div
        className="w-full overflow-x-auto rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie-solida)]"
        style={alturaMaxima ? { maxHeight: `${alturaMaxima}px` } : undefined}
      >
        <table className="w-full min-w-max border-collapse text-[0.875rem]">
          <caption className="sr-only">{rotulo}</caption>

          <thead>
            <tr>
              {colunas.map((c) => (
                <th
                  key={c.chave}
                  scope="col"
                  style={c.larguraMinima ? { minWidth: `${c.larguraMinima}px` } : undefined}
                  className={cn(
                    "sticky top-0 z-10 border-b border-[var(--linha-forte)]",
                    "bg-[var(--superficie-areia)] px-3.5 py-2.5",
                    "text-[0.6875rem] font-semibold tracking-[0.14em] whitespace-nowrap",
                    "text-[var(--tinta-suave)] uppercase",
                    c.align === "dir" && "text-right",
                    c.align === "centro" && "text-center",
                    (!c.align || c.align === "esq") && "text-left"
                  )}
                >
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {linhas.map((linha, i) => (
              <tr
                key={linha.id}
                className={cn(
                  "border-b border-[var(--linha)]",
                  /*
                    A faixa alternada é leitura, não decoração: numa grade
                    larga, o olho perde a linha no meio do caminho. O
                    `last:border-b-0` só vale quando não há rodapé — com
                    rodapé, a última linha de dado precisa da divisória que
                    separa o fechamento.
                  */
                  i % 2 === 1 && "bg-[rgba(242,236,226,0.45)]",
                  linha.fechamento && "font-medium",
                  !rodape && "last:border-b-0"
                )}
              >
                {colunas.map((c) => (
                  <td
                    key={c.chave}
                    className={cn(
                      "px-3.5 py-2.5 align-middle whitespace-nowrap",
                      c.align === "dir" && "text-right tabular",
                      c.align === "centro" && "text-center",
                      // A primeira coluna é a identificação da linha (o
                      // ingrediente, o prato): recebe peso, como em `Celula`.
                      c === colunas[0]
                        ? "font-medium text-tinta"
                        : c.align === "dir"
                          ? "text-tinta"
                          : "text-[var(--tinta-suave)]"
                    )}
                  >
                    {linha.celulas[c.chave]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

          {rodape ? (
            <tfoot>
              <tr className="border-t border-[var(--linha-forte)] bg-[rgba(107,122,70,0.07)]">
                {colunas.map((c) => (
                  <td
                    key={c.chave}
                    className={cn(
                      "px-3.5 py-3 align-middle font-medium whitespace-nowrap text-tinta",
                      c.align === "dir" && "text-right tabular"
                    )}
                  >
                    {rodape[c.chave]}
                  </td>
                ))}
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>

      {legenda ? (
        <figcaption className="mt-2.5 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
          {legenda}
        </figcaption>
      ) : null}
    </figure>
  );
}
