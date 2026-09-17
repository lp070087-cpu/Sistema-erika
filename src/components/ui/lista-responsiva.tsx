import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import {
  CabecalhoTabela,
  Celula,
  CelulaCabecalho,
  CorpoTabela,
  LinhaCabecalho,
  LinhaTabela,
  Tabela,
} from "./tabela";

/**
 * LISTA RESPONSIVA — tabela no computador, cartões no celular.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO É SÓ UMA TABELA COM ROLAGEM HORIZONTAL                   │
 * │                                                                      │
 * │ Com sete colunas em 390px, o que aparece na tela são as duas          │
 * │ primeiras — e a pessoa rola de lado para descobrir o resto, sem      │
 * │ saber o que está perdendo. A Seção 25 do briefing foi direta: em      │
 * │ telas pequenas, tabela pode virar lista.                              │
 * │                                                                      │
 * │ Não é só CSS escondido: as duas versões são montadas a partir da      │
 * │ MESMA definição de coluna. Uma coluna não pode existir na tabela e    │
 * │ faltar no cartão, porque as duas leem o mesmo array.                  │
 * │                                                                      │
 * │ A marcação duplicada custa HTML. Em compensação, some a categoria de  │
 * │ bug em que a tabela e o cartão mostram coisas diferentes — que é o    │
 * │ que acontece quando as duas versões são escritas à mão.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export type ColunaLista<T> = {
  chave: string;
  titulo: string;
  /** Célula da tabela e valor do cartão. */
  valor: (item: T) => ReactNode;
  /** Esconde a coluna da tabela abaixo de certo tamanho. */
  ocultaEm?: "sm" | "md" | "lg";
  align?: "esq" | "dir" | "centro";
  /** Coluna de identificação — recebe peso visual na tabela. */
  destaque?: boolean;
  /** No cartão, aparece como linha rotulada em vez de valor solto. */
  noCartao?: "linha" | "topo" | "oculto";
};

const ESCONDE: Record<"sm" | "md" | "lg", string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

export function ListaResponsiva<T extends { id: string }>({
  itens,
  colunas,
  href,
  vazio,
}: {
  itens: readonly T[];
  colunas: readonly ColunaLista<T>[];
  /** Rota de cada item. Sem ela, a lista não é clicável. */
  href?: (item: T) => string;
  vazio: ReactNode;
}) {
  if (itens.length === 0) return <>{vazio}</>;

  const deTopo = colunas.filter((c) => c.noCartao === "topo");
  const deLinha = colunas.filter((c) => c.noCartao === "linha");

  return (
    <>
      {/* Tabela — telas largas */}
      <div className="hidden lg:block">
        <Tabela>
          <CabecalhoTabela>
            <LinhaCabecalho>
              {colunas.map((c) => (
                <CelulaCabecalho
                  key={c.chave}
                  align={c.align}
                  className={c.ocultaEm ? ESCONDE[c.ocultaEm] : undefined}
                >
                  {c.titulo}
                </CelulaCabecalho>
              ))}
            </LinhaCabecalho>
          </CabecalhoTabela>
          <CorpoTabela>
            {itens.map((item) => {
              const destino = href?.(item);
              return (
                <LinhaTabela key={item.id}>
                  {colunas.map((c) => (
                    <Celula
                      key={c.chave}
                      align={c.align}
                      destaque={c.destaque}
                      className={c.ocultaEm ? ESCONDE[c.ocultaEm] : undefined}
                    >
                      {destino && c.destaque ? (
                        <Link href={destino} className="underline-offset-4 hover:underline">
                          {c.valor(item)}
                        </Link>
                      ) : (
                        c.valor(item)
                      )}
                    </Celula>
                  ))}
                </LinhaTabela>
              );
            })}
          </CorpoTabela>
        </Tabela>
      </div>

      {/* Cartões — telas estreitas */}
      <ul className="space-y-3 lg:hidden">
        {itens.map((item) => {
          const destino = href?.(item);
          const conteudo = (
            <>
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  {deTopo.map((c) => (
                    <div key={c.chave}>{c.valor(item)}</div>
                  ))}
                </div>
                {colunas
                  .filter((c) => c.noCartao === undefined && c.align === "dir")
                  .slice(0, 1)
                  .map((c) => (
                    <div key={c.chave} className="shrink-0 text-right">
                      {c.valor(item)}
                    </div>
                  ))}
              </div>

              {deLinha.length > 0 ? (
                <dl className="mt-3 space-y-1.5 border-t border-[var(--linha)] pt-3">
                  {deLinha.map((c) => (
                    <div key={c.chave} className="flex items-baseline justify-between gap-4">
                      <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--tinta-fraca)]">
                        {c.titulo}
                      </dt>
                      <dd
                        className={cn(
                          "text-right text-[0.875rem] text-[var(--tinta-suave)]",
                          c.align === "dir" && "tabular"
                        )}
                      >
                        {c.valor(item)}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </>
          );

          return (
            <li key={item.id}>
              {destino ? (
                <Link
                  href={destino}
                  className={cn(
                    "block rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5",
                    "transition-colors duration-150 hover:border-[var(--linha-forte)] hover:bg-white"
                  )}
                >
                  {conteudo}
                </Link>
              ) : (
                <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5">
                  {conteudo}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
