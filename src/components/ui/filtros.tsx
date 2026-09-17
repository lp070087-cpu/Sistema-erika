"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * BARRA DE FILTROS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O FILTRO VIVE NA URL — E ISSO NÃO É DETALHE DE IMPLEMENTAÇÃO         │
 * │                                                                      │
 * │ Com o filtro em estado local, três coisas quebram: o botão "voltar"   │
 * │ do navegador, o link colado no WhatsApp para um colega, e o recarregar│
 * │ a página. A Fase 2 já tinha resolvido assim para os leads           │
 * │ (`/leads?status=NOVO`) e a Fase 2.5 mantém o mesmo padrão em todas    │
 * │ as listas.                                                            │
 * │                                                                      │
 * │ `useSearchParams` NÃO é usado aqui de propósito. Ele obriga a página  │
 * │ a ficar dentro de um `<Suspense>`, porque suspende na renderização    │
 * │ estática — e isso é uma armadilha silenciosa: a página compila, o     │
 * │ build passa, e a rota só quebra quando alguém a abre sem JavaScript.  │
 * │                                                                      │
 * │ Em vez disso o componente RECEBE os valores atuais por prop e monta   │
 * │ a URL à mão. Custa algumas linhas e elimina a classe inteira de erro. │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * A busca dispara sozinha depois de 300ms. Os seletores, na hora da troca.
 * Não existe botão "aplicar": em lista de operação, um botão a mais é um
 * clique a mais por consulta, e a pessoa vem aqui muitas vezes por dia.
 */

export type FiltroSelecao = {
  chave: string;
  rotulo: string;
  opcoes: ReadonlyArray<{ valor: string; texto: string }>;
};

const baseControle =
  "h-9 w-full rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 " +
  "px-3 text-[0.875rem] text-tinta transition-colors duration-150 " +
  "placeholder:text-[var(--tinta-fraca)] hover:border-[var(--tinta-fraca)] " +
  "focus:border-oliva focus:bg-white focus:outline-none";

export function BarraFiltros({
  base,
  valores,
  busca,
  selecoes = [],
  placeholderBusca = "Buscar…",
  acoes,
}: {
  /** Rota sem query. */
  base: string;
  /** Valores atuais, lidos da URL pela página. */
  valores: Record<string, string>;
  /** Nome do parâmetro de busca. `null` esconde o campo. */
  busca: string | null;
  selecoes?: readonly FiltroSelecao[];
  placeholderBusca?: string;
  /** Botões à direita — normalmente "novo alguma coisa". */
  acoes?: ReactNode;
}) {
  const router = useRouter();
  const [pendente, iniciar] = useTransition();

  const [texto, setTexto] = useState(busca ? (valores[busca] ?? "") : "");
  const primeiroRender = useRef(true);

  /**
   * Monta a URL com o valor trocado. Chave com valor vazio sai da URL.
   *
   * Os parâmetros são os que a PÁGINA declarou em `valores` — este
   * componente não inventa nenhum. Assim uma lista que amanhã ganhe
   * paginação só precisa passar `pagina` em `valores` para que os filtros
   * parem de descartá-la.
   */
  function comValor(chave: string, valor: string): string {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...valores, [chave]: valor })) {
      if (v) params.set(k, v);
    }
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  }

  // Busca com atraso: 300ms depois da última tecla.
  useEffect(() => {
    if (!busca) return;
    if (primeiroRender.current) {
      primeiroRender.current = false;
      return;
    }
    const atual = valores[busca] ?? "";
    if (texto === atual) return;

    const t = setTimeout(() => {
      iniciar(() => router.replace(comValor(busca, texto), { scroll: false }));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto, busca]);

  const ativos = Object.entries(valores).filter(([, v]) => v.length > 0).length;

  return (
    <div className="nao-imprimir flex flex-wrap items-center gap-2.5">
      {busca ? (
        <div className="relative min-w-[200px] flex-1 sm:max-w-[320px]">
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 14 14"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--tinta-fraca)]"
          >
            <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
            <path d="M9.3 9.3 12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          <label htmlFor="filtro-busca" className="sr-only">
            {placeholderBusca}
          </label>
          <input
            id="filtro-busca"
            type="search"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={placeholderBusca}
            className={cn(baseControle, "pl-8.5")}
          />
        </div>
      ) : null}

      {selecoes.map((s) => (
        <div key={s.chave} className="min-w-[140px] flex-1 sm:max-w-[190px]">
          <label htmlFor={`filtro-${s.chave}`} className="sr-only">
            {s.rotulo}
          </label>
          <select
            id={`filtro-${s.chave}`}
            value={valores[s.chave] ?? ""}
            onChange={(e) => iniciar(() => router.replace(comValor(s.chave, e.target.value), { scroll: false }))}
            className={cn(baseControle, "cursor-pointer appearance-none pr-8")}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='7' viewBox='0 0 11 7'%3E%3Cpath d='M1 1.25 5.5 5.75 10 1.25' fill='none' stroke='%230e1a14' stroke-opacity='0.6' stroke-width='1.4' stroke-linecap='round'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
            }}
          >
            <option value="">{s.rotulo}</option>
            {s.opcoes.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.texto}
              </option>
            ))}
          </select>
        </div>
      ))}

      {ativos > 0 ? (
        <button
          type="button"
          onClick={() => iniciar(() => router.replace(base, { scroll: false }))}
          className="h-9 rounded-[var(--raio-sm)] px-2.5 text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-suave)] uppercase transition-colors hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta"
        >
          Limpar
        </button>
      ) : null}

      {/* Aviso de carregamento discreto: a lista já está na tela, então
          trocar tudo por um esqueleto piscaria sem necessidade. */}
      <span
        aria-live="polite"
        className={cn(
          "text-[0.75rem] text-[var(--tinta-fraca)] transition-opacity duration-150",
          pendente ? "opacity-100" : "opacity-0"
        )}
      >
        Filtrando…
      </span>

      {acoes ? <div className="ml-auto flex items-center gap-2">{acoes}</div> : null}
    </div>
  );
}
