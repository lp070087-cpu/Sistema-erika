"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { BarraLateral, BotaoMenu } from "./barra-lateral";
import { BuscaGlobal } from "./busca-global";
import { SinoDeNotificacoes } from "./notificacoes";
import type { NotificacaoExibida } from "./notificacoes";
import { Monograma } from "@/components/marca/logotipo";
import { cn } from "@/lib/utils/cn";
import type { ItemBusca } from "@/lib/dados/busca";

/**
 * Estrutura da aplicação: barra lateral + barra de topo + conteúdo.
 *
 * É um componente cliente apenas porque controla o estado da gaveta
 * em telas pequenas e o da busca. Nenhuma regra de negócio vive aqui —
 * tanto o conteúdo quanto o ÍNDICE DA BUSCA chegam prontos do servidor.
 *
 * O índice vem por prop, e não é montado aqui, porque montar exigiria este
 * componente conhecer a camada de dados — e uma casca de layout que sabe
 * onde os dados moram é exatamente o acoplamento que o resto do sistema
 * evita.
 */
export function Shell({
  children,
  usuario,
  itensBusca = [],
  notificacoes = [],
}: {
  children: ReactNode;
  usuario?: { nome: string; email: string } | null;
  itensBusca?: readonly ItemBusca[];
  /**
   * As notificações também chegam prontas, e já com a data formatada e o
   * grupo resolvido. O componente só abre, lista e risca — não sabe o que é
   * uma tarefa atrasada. Mesmo motivo do índice da busca.
   */
  notificacoes?: readonly NotificacaoExibida[];
}) {
  const [menuAberto, setMenuAberto] = useState(false);
  const fecharMenu = useCallback(() => setMenuAberto(false), []);

  return (
    <div className="flex min-h-dvh bg-[var(--superficie-solida)]">
      <BarraLateral aberta={menuAberto} aoFechar={fecharMenu} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "nao-imprimir sticky top-0 z-30 flex h-[var(--altura-topo)] shrink-0 items-center gap-3",
            "border-b border-[var(--linha)] bg-[rgba(250,247,241,0.88)] px-4 backdrop-blur-md",
            "sm:px-6"
          )}
        >
          <BotaoMenu aoAbrir={() => setMenuAberto(true)} />

          <div className="flex items-center gap-2.5 lg:hidden">
            <Monograma className="h-7 w-7" />
            <span className="font-display text-[0.8125rem] font-semibold tracking-[0.14em] uppercase">
              Érika Bruna
            </span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <BuscaGlobal itens={itensBusca} />

            <SinoDeNotificacoes itens={notificacoes} />

            {usuario ? (
              <div className="hidden items-center gap-2.5 sm:flex">
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-oliva/15 text-[0.6875rem] font-semibold text-oliva uppercase"
                >
                  {usuario.nome.trim().charAt(0) || "E"}
                </span>
                <span className="text-[0.8125rem] text-[var(--tinta-suave)]">
                  {usuario.nome}
                </span>
              </div>
            ) : null}
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[var(--largura-conteudo)]">{children}</div>
        </main>
      </div>
    </div>
  );
}
