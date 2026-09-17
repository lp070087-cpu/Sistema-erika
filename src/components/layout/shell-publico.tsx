import Link from "next/link";
import type { ReactNode } from "react";
import { Monograma } from "@/components/marca/logotipo";

/**
 * MOLDURA PÚBLICA.
 *
 * Para as telas que não são da consultora: o diagnóstico que o dono de
 * restaurante responde por um link, vindo do Instagram ou de um post.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A DIFERENÇA PARA A MOLDURA DO SISTEMA NÃO É ESTÉTICA — É DE CONTEXTO │
 * │                                                                      │
 * │ O sistema é ferramenta: denso, cabeçalho estreito, muita informação  │
 * │ por tela. Quem usa é a Érika, muitas vezes por dia, e ela quer       │
 * │ velocidade.                                                          │
 * │                                                                      │
 * │ Esta tela é a primeira impressão da marca para um cliente em         │
 * │ potencial. Quem está do outro lado é um dono de restaurante no       │
 * │ celular, entre um serviço e outro. Ele precisa de espaço, de um      │
 * │ ritmo que respire e da sensação de estar sendo bem recebido — não de │
 * │ densidade.                                                           │
 * │                                                                      │
 * │ Mesma paleta, mesma tipografia, mesma linguagem. Densidade diferente.│
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * A barra do topo mostra só a marca. Sem menu, sem link para o sistema,
 * sem nada que distraia de responder. O rodapé traz a assinatura dela,
 * que é o que fecha a página com a marca certa.
 */
export function ShellPublico({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-[var(--superficie-solida)]">
      <header className="border-b border-[var(--linha)]">
        <div className="mx-auto flex w-full max-w-[var(--largura-conteudo)] items-center justify-between gap-4 px-5 py-4 sm:px-8 sm:py-5">
          <Link
            href="/diagnostico"
            className="flex items-center gap-3 rounded-[var(--raio-sm)] transition-opacity hover:opacity-75"
            aria-label="Érika Bruna — Consultoria gastronômica"
          >
            <Monograma />
            <span className="flex flex-col leading-none">
              <span className="font-display text-[0.9375rem] font-semibold tracking-[0.16em] uppercase text-tinta">
                Érika Bruna
              </span>
              <span className="mt-1 font-texto text-[0.5625rem] font-semibold tracking-[0.24em] uppercase text-oliva">
                Consultoria gastronômica
              </span>
            </span>
          </Link>

          <span className="hidden text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-[var(--tinta-fraca)] sm:block">
            Diagnóstico de lucro e operação
          </span>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto w-full max-w-[var(--largura-conteudo)] px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
          {children}
        </div>
      </main>

      <footer className="border-t border-[var(--linha)]">
        <div className="mx-auto flex w-full max-w-[var(--largura-conteudo)] flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
          <span className="assina text-[1.25rem] leading-none text-oliva">
            Cozinha organizada, lucro no fim do mês.
          </span>
          <span className="text-[0.75rem] text-[var(--tinta-fraca)]">
            Érika Bruna · Consultoria em operação de cozinha
          </span>
        </div>
      </footer>
    </div>
  );
}
