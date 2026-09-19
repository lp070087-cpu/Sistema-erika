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
 * Item ainda não implementado aparece esmaecido e continua no menu — nada de
 * esconder o menu futuro, porque ela precisa ver para onde o sistema vai.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE SAIU DO MENU, E POR QUÊ                                        │
 * │                                                                      │
 * │ Cada item trazia uma segunda linha com o estado da CONSTRUÇÃO —        │
 * │ "Cadastro em preparação", "Custo aguardando definição", "Um modelo     │
 * │ disponível". A frase é verdadeira e não serve para nada aqui: ela não  │
 * │ diz o que se faz dentro do módulo, diz em que ponto do trabalho ele    │
 * │ está. Repetida em seis dos dezessete itens, transformava uma lista de  │
 * │ lugares em relatório de obra.                                         │
 * │                                                                      │
 * │ O `estado` continua em `navegacao.ts` e continua decidindo o peso      │
 * │ visual do item logo abaixo. O que saiu foi a frase escrita na tela.    │
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

        {/* Grupos de navegação.
            `min-h-0` porque, sem ele, o menu de dezessete itens se recusa a
            rolar dentro de uma barra de altura fixa — e empurra a assinatura
            do rodapé para fora da tela. É a mesma correção da gaveta. */}
        <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
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
                          ┌──────────────────────────────────────────────────┐
                          │ O AVISO DE ESTADO SAIU DO MENU                   │
                          │                                                  │
                          │ Cada item trazia uma segunda linha — "Cadastro   │
                          │ em preparação", "Custo aguardando definição",    │
                          │ "Um modelo disponível". Lida de fora, a frase    │
                          │ não informa nada a quem trabalha: o que ela      │
                          │ diz é sobre o ESTADO DA CONSTRUÇÃO do módulo,    │
                          │ não sobre o que se faz dentro dele.             │
                          │                                                  │
                          │ Pior: repetida em seis itens de uma lista de     │
                          │ dezessete, ela transformava um menu em relatório │
                          │ de obra. Quem abre o sistema para trabalhar não  │
                          │ precisa saber qual módulo está pronto — precisa  │
                          │ que os que ela usa funcionem.                    │
                          │                                                  │
                          │ O estado NÃO desapareceu: ele continua declarado │
                          │ em `navegacao.ts` e é ele que decide o peso      │
                          │ visual do item aqui embaixo. O que saiu foi a    │
                          │ frase escrita na tela.                          │
                          └──────────────────────────────────────────────────┘
                        */}
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
            Versão {SISTEMA_VERSAO}
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
