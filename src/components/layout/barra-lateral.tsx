"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { NAVEGACAO } from "@/lib/navegacao";
import { SISTEMA_VERSAO } from "@/lib/configuracao-publica";
import { Logotipo } from "@/components/marca/logotipo";
import { cn } from "@/lib/utils/cn";

/**
 * Barra lateral.
 *
 * Comportamento por contexto de uso — foi assim que a Fase 0 descreveu
 * o trabalho dela:
 *
 *   ≥ 1024px  fixa, sempre visível. É o modo de trabalho: notebook,
 *             durante uma consultoria, com o cliente do lado.
 *   < 1024px  vira gaveta sobreposta, aberta por um botão na barra de topo.
 *             É o modo de consulta: celular, durante uma visita presencial.
 *
 * Item ainda não implementado aparece esmaecido, com um AVISO EM PORTUGUÊS
 * logo abaixo do nome. Nada de esconder o menu futuro — ela precisa ver para
 * onde o sistema vai.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O AVISO MUDOU DE LUGAR E DE FORMA                            │
 * │                                                                      │
 * │ Antes ele era um código curto alinhado à direita (`f4`, `parcial`).    │
 * │ Cabia bem ao lado do título justamente porque não significava nada    │
 * │ para quem lê: era um símbolo para quem constrói.                      │
 * │                                                                      │
 * │ Agora que o aviso é uma frase — "Custo aguardando definição" — ele    │
 * │ não cabe mais na mesma linha, e nem deveria: ficaria espremido       │
 * │ contra o título e truncado no meio da ideia. Virou uma SEGUNDA LINHA, │
 * │ menor e mais clara, do jeito que uma legenda se lê.                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function BarraLateral({
  aberta,
  aoFechar,
}: {
  aberta: boolean;
  aoFechar: () => void;
}) {
  const caminho = usePathname();

  // Fecha a gaveta ao trocar de rota.
  useEffect(() => {
    aoFechar();
  }, [caminho, aoFechar]);

  // Bloqueia a rolagem do fundo enquanto a gaveta está aberta.
  useEffect(() => {
    if (!aberta) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberta]);

  // Esc fecha a gaveta.
  useEffect(() => {
    if (!aberta) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberta, aoFechar]);

  return (
    <>
      {/* Fundo escurecido no modo gaveta */}
      <div
        aria-hidden
        onClick={aoFechar}
        className={cn(
          "fixed inset-0 z-40 bg-noite/45 backdrop-blur-[2px] transition-opacity duration-200 lg:hidden",
          aberta ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        id="menu-principal"
        aria-label="Navegação principal"
        className={cn(
          "nao-imprimir fixed inset-y-0 left-0 z-50 flex w-[var(--largura-menu)] flex-col",
          "border-r border-[var(--linha)] bg-[var(--superficie-solida)]",
          "transition-transform duration-300 ease-[var(--ease-marca)]",
          "lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          aberta ? "translate-x-0 shadow-xl lg:shadow-none" : "-translate-x-full"
        )}
      >
        {/* Cabeçalho da marca */}
        <div className="flex h-[var(--altura-topo)] shrink-0 items-center justify-between border-b border-[var(--linha)] px-5">
          <Link
            href="/"
            className="rounded-[var(--raio-sm)] transition-opacity hover:opacity-75"
            aria-label="Ir para a visão geral"
          >
            <Logotipo />
          </Link>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar menu"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--raio-sm)] text-[var(--tinta-suave)] hover:bg-[rgba(14,26,20,0.06)] lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Grupos de navegação */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {NAVEGACAO.map((grupo) => (
            <div key={grupo.chave} className="mb-5 last:mb-0">
              <p className="mb-1.5 px-2 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[var(--tinta-fraca)]">
                {grupo.titulo}
              </p>
              <ul>
                {grupo.itens.map((item) => {
                  const ativo =
                    item.href === "/"
                      ? caminho === "/"
                      : caminho === item.href || caminho.startsWith(`${item.href}/`);
                  // O estado vem DECLARADO do item, não inferido do número
                  // da fase. A versão anterior usava `item.fase <= 2`, e
                  // isso pintava /consultorias — que é só um aviso de
                  // "módulo futuro" — com a mesma cor cheia de uma tela
                  // pronta. Quem lê o menu não tinha como perceber.
                  const noAr = item.estado === "no-ar";
                  const aberto = item.estado !== "previsto";

                  return (
                    <li key={item.chave}>
                      <Link
                        href={item.href}
                        aria-current={ativo ? "page" : undefined}
                        className={cn(
                          "group block rounded-[var(--raio-sm)] px-2 py-1.5",
                          "transition-colors duration-150",
                          ativo
                            ? "bg-profundo text-off font-medium"
                            : aberto
                              ? "text-tinta hover:bg-[rgba(107,122,70,0.08)]"
                              : "text-[var(--tinta-fraca)] hover:bg-[rgba(107,122,70,0.05)] hover:text-[var(--tinta-suave)]"
                        )}
                      >
                        <span className="block truncate text-[0.875rem]">{item.titulo}</span>
                        {/*
                          O aviso é lido por leitores de tela como parte do
                          link — e deve ser. "Fichas técnicas, custo aguardando
                          definição" é exatamente o que a pessoa precisa ouvir
                          antes de decidir clicar.
                        */}
                        {!noAr && item.aviso ? (
                          <span
                            className={cn(
                              "mt-0.5 block truncate text-[0.6875rem] leading-snug",
                              ativo ? "text-oliva-palha" : "text-[var(--tinta-fraca)]"
                            )}
                          >
                            {item.aviso}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Rodapé — assinatura da marca, discreta */}
        <div className="shrink-0 border-t border-[var(--linha)] px-5 py-3">
          <p className="assina text-[0.9375rem] leading-none text-oliva">Cozinha organizada</p>
          <p className="mt-1 text-[0.625rem] uppercase tracking-[0.18em] text-[var(--tinta-fraca)]">
            Demonstração · v{SISTEMA_VERSAO}
          </p>
        </div>
      </aside>
    </>
  );
}

/** Botão de abrir menu, usado na barra de topo em telas pequenas. */
export function BotaoMenu({ aoAbrir }: { aoAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={aoAbrir}
      aria-label="Abrir menu"
      aria-controls="menu-principal"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--raio-sm)] border border-[var(--linha-forte)] text-tinta transition-colors hover:bg-[rgba(107,122,70,0.08)] lg:hidden"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <path
          d="M2 4h12M2 8h12M2 12h12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
