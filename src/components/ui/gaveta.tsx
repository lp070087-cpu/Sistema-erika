"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Botao } from "./botao";

/**
 * GAVETA — o painel lateral que desliza da direita.
 *
 * É onde acontecem as ações que não merecem página própria: converter um
 * lead, criar uma tarefa, registrar um acompanhamento. A Seção 5 do briefing
 * pediu modal ou drawer; a gaveta foi escolhida porque um formulário com
 * seis campos em modal fica apertado no celular, e a gaveta vira tela cheia
 * naturalmente em telas estreitas.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE COMPONENTE FAZ QUE UM `div` POSICIONADO NÃO FAZ          │
 * │                                                                      │
 * │ · Esc fecha                                                            │
 * │ · clique no fundo fecha, clique dentro não                             │
 * │ · foco entra na gaveta ao abrir e VOLTA para o gatilho ao fechar       │
 * │ · Tab não escapa para o conteúdo atrás                                  │
 * │ · a rolagem do fundo trava enquanto ela está aberta                    │
 * │ · `role="dialog"` com `aria-modal`, para o leitor de tela anunciar     │
 * │                                                                      │
 * │ A armadilha de foco não é preciosismo: sem ela, quem navega por       │
 * │ teclado abre a gaveta e continua tabulando pela página de trás, sem   │
 * │ ver onde está.                                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function Gaveta({
  aberta,
  aoFechar,
  titulo,
  descricao,
  children,
  acoes,
}: {
  aberta: boolean;
  aoFechar: () => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
  acoes?: ReactNode;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const gatilho = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!aberta) return;

    // Guarda quem abriu, para devolver o foco ao fechar.
    gatilho.current = document.activeElement as HTMLElement | null;

    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Foca o primeiro elemento focável de dentro, não a caixa em si.
    const primeiro = caixa.current?.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    (primeiro ?? caixa.current)?.focus();

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        aoFechar();
        return;
      }

      if (e.key !== "Tab" || !caixa.current) return;

      // Armadilha de foco: Tab no último volta para o primeiro, e
      // Shift+Tab no primeiro vai para o último.
      const focaveis = Array.from(
        caixa.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null);

      if (focaveis.length === 0) return;

      const primeiroFocavel = focaveis[0];
      const ultimoFocavel = focaveis[focaveis.length - 1];
      if (!primeiroFocavel || !ultimoFocavel) return;

      if (e.shiftKey && document.activeElement === primeiroFocavel) {
        e.preventDefault();
        ultimoFocavel.focus();
      } else if (!e.shiftKey && document.activeElement === ultimoFocavel) {
        e.preventDefault();
        primeiroFocavel.focus();
      }
    };

    window.addEventListener("keydown", aoTeclar);
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = anterior;
      // Devolve o foco. `isConnected` evita devolver para um elemento que
      // saiu do DOM enquanto a gaveta estava aberta — o que aconteceria
      // ao converter um lead e navegar para a página do cliente novo.
      if (gatilho.current?.isConnected) gatilho.current.focus();
    };
  }, [aberta, aoFechar]);

  if (!aberta) return null;

  return (
    <div className="nao-imprimir fixed inset-0 z-50 flex justify-end">
      {/* Fundo */}
      <button
        type="button"
        aria-label="Fechar"
        onClick={aoFechar}
        className="absolute inset-0 cursor-default bg-noite/45 backdrop-blur-[2px]"
        tabIndex={-1}
      />

      {/* Caixa */}
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className={cn(
          "entrar relative flex h-full w-full flex-col border-l border-[var(--linha-forte)]",
          "bg-[var(--superficie-solida)] shadow-2xl outline-none",
          "sm:max-w-[520px]"
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--linha)] px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-[1.0625rem]">{titulo}</h2>
            {descricao ? (
              <p className="mt-1.5 text-[0.8125rem] leading-snug text-[var(--tinta-suave)]">
                {descricao}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--raio-sm)] text-[var(--tinta-suave)] transition-colors hover:bg-[rgba(14,26,20,0.06)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path
                d="M2.5 2.5l9 9M11.5 2.5l-9 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        {/*
          `min-h-0` junto do `flex-1 overflow-y-auto` — os dois, não só o segundo.

          No flex, o padrão de um item é `min-height: auto`: ele se recusa a
          ficar menor que o próprio conteúdo. Sem o `min-h-0`, o corpo da
          gaveta cresce com o formulário em vez de rolar, e empurra o rodapé
          com os botões "Cancelar" e "Salvar" para fora do quadro. O botão de
          salvar some — e some justamente na tela em que a pessoa acabou de
          preencher tudo. É o defeito clássico do flex, e a correção é uma
          classe.
        */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {acoes ? (
          <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-[var(--linha)] px-5 py-4">
            {acoes}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/**
 * O gatilho da gaveta.
 *
 * Existe como componente para que todas as telas abram gaveta do mesmo jeito
 * — e para que o `aria-haspopup` não seja esquecido em uma delas.
 */
export function BotaoGaveta({
  children,
  aoAbrir,
  variante = "secundario",
  tamanho = "md",
  className,
}: {
  children: ReactNode;
  aoAbrir: () => void;
  variante?: "primario" | "secundario" | "linha" | "fantasma";
  tamanho?: "sm" | "md";
  className?: string;
}) {
  return (
    <Botao
      type="button"
      variante={variante}
      tamanho={tamanho}
      className={className}
      aria-haspopup="dialog"
      onClick={aoAbrir}
    >
      {children}
    </Botao>
  );
}

/**
 * Gancho para controlar a gaveta de dentro de um componente de cliente.
 * Mantido aqui para que a abertura e o fechamento tenham um nome só.
 *
 * O nome começa com `use` — e não com `usar`, que seria o português do
 * resto do projeto — por exigência do React: a regra de hooks identifica um
 * gancho pelo prefixo, e um gancho com outro nome fica INVISÍVEL para o
 * lint. O efeito prático seria perder a checagem de ordem de chamada em
 * todas as telas que usam a gaveta. Traduzir o nome custaria a proteção.
 */
export function useGaveta(inicial = false) {
  const [aberta, setAberta] = useState(inicial);
  return {
    aberta,
    abrir: () => setAberta(true),
    fechar: () => setAberta(false),
  };
}
