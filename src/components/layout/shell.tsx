"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { BarraLateral, BotaoMenu } from "./barra-lateral";
import { BuscaGlobal } from "./busca-global";
import { SinoDeNotificacoes } from "./notificacoes";
import type { NotificacaoExibida } from "./notificacoes";
import { Monograma } from "@/components/marca/logotipo";
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
        {/*
          ┌──────────────────────────────────────────────────────────────────┐
          │ A BARRA DE TOPO USA A MESMA MARGEM E O MESMO TETO DO CONTEÚDO     │
          │                                                                  │
          │ Ela tinha `px-4 sm:px-6` fixos, e a página logo abaixo usava      │
          │ `--margem-conteudo`, que cresce com a tela até 2,75rem. Numa tela │
          │ larga os dois desalinhavam: o menu, o sino e o nome ficavam 20px  │
          │ à esquerda da primeira palavra do título. Numa ferramenta isso   │
          │ lê como desleixo, e é o tipo de desalinho que ninguém sabe        │
          │ nomear mas todo mundo vê.                                         │
          │                                                                  │
          │ Agora os três — barra, conteúdo e rodapé — usam o mesmo token e   │
          │ o mesmo teto. O alinhamento passa a ser consequência de uma       │
          │ variável, não de três números combinados à mão.                   │
          └──────────────────────────────────────────────────────────────────┘
        */}
        <header
          className="nao-imprimir sticky top-0 z-30 flex h-[var(--altura-topo)] shrink-0 items-center border-b border-[var(--linha)] bg-[rgba(250,247,241,0.88)] backdrop-blur-md"
          style={{ paddingInline: "var(--margem-conteudo)" }}
        >
          <div className="mx-auto flex w-full max-w-[var(--largura-conteudo)] items-center gap-3">
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
          </div>
        </header>

        <main
          className="flex-1 py-6 lg:py-8"
          style={{ paddingInline: "var(--margem-conteudo)" }}
        >
          <div className="mx-auto w-full max-w-[var(--largura-conteudo)]">{children}</div>
        </main>

        {/*
          ┌──────────────────────────────────────────────────────────────────┐
          │ O AVISO DE DEMONSTRAÇÃO MORA AQUI, E NÃO EM VINTE TELAS          │
          │                                                                  │
          │ Cada tela trazia a própria faixa dizendo, com outras palavras,    │
          │ que os dados eram inventados. Lida no dia a dia, a repetição não  │
          │ informa — ela apaga o próprio aviso: quem vê a mesma tarja na     │
          │ primeira e na vigésima tela para de ler na terceira.             │
          │                                                                  │
          │ Aqui ele é dito UMA vez, no rodapé, em uma linha discreta. É o    │
          │ lugar onde a informação continua verdadeira e continua           │
          │ encontrável por quem precisa dela — quem for avaliar o sistema    │
          │ com um cliente do lado procura no rodapé.                        │
          │                                                                  │
          │ A honestidade não foi reduzida, foi DESDUPLICADA. O que         │
          │ desapareceu foi a mesma frase escrita vinte vezes.               │
          └──────────────────────────────────────────────────────────────────┘
        */}
        <footer
          className="nao-imprimir shrink-0 pb-6"
          style={{ paddingInline: "var(--margem-conteudo)" }}
        >
          <div className="mx-auto w-full max-w-[var(--largura-conteudo)]">
            <p className="border-t border-[var(--linha)] pt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
              Ambiente de demonstração. Clientes, contratos, fichas e diagnósticos
              são um cenário de exemplo — nenhuma empresa ou pessoa aqui existe, e
              nada foi gravado em banco. As planilhas exportadas são arquivos
              .xlsx de verdade, gerados a partir deste cenário.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
