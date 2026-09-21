"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { agruparResultados, buscar, ROTULO_TIPO_BUSCA } from "@/lib/dados/busca";
import type { ItemBusca, ResultadoBusca } from "@/lib/dados/busca";
import { insumoForaDaBiblioteca } from "@/lib/dados/demonstracao";
import { useDemonstracao } from "@/components/ui/use-demonstracao";

/**
 * BUSCA GLOBAL.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE A BARRA FAZ SEM SAIR DA PÁGINA                                 │
 * │                                                                      │
 * │ A consultora digita "emporio" onde estiver — na lista de tarefas,     │
 * │ dentro de uma ficha — e vai direto para o cliente. Sem isso, ela      │
 * │ precisa: ir ao menu, abrir clientes, procurar na lista, abrir. São    │
 * │ quatro passos para algo que ela já sabe o nome.                       │
 * │                                                                      │
 * │ Abre com Ctrl+K (e ⌘K no Mac) ou com clique. Setas navegam, Enter     │
 * │ abre, Esc fecha. É o comportamento que qualquer pessoa que usa        │
 * │ sistema no trabalho já tem no dedo — inventar outro seria pior.       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O ÍNDICE CHEGA PRONTO DO SERVIDOR.
 *
 * O componente não importa mock: ele recebe `itens` e só sabe procurar. É o
 * que permite trocar a demonstração por uma consulta ao banco sem tocar
 * aqui — e o que mantém este arquivo sem uma linha de regra de negócio.
 */

export function BuscaGlobal({ itens }: { itens: readonly ItemBusca[] }) {
  /*
    ── A BUSCA TAMBÉM ASSINA O STORE ──────────────────────────────────────

    Sem esta linha, arquivar um insumo nesta sessão não mudaria nada aqui: o
    `useMemo` continuaria com a lista de antes, e o Ctrl+K seguiria achando o
    insumo que acabou de sair de circulação. O gancho devolve só um número —
    a versão —, e é isso que faz o `disponiveis` abaixo recalcular.
  */
  useDemonstracao();

  const [aberta, setAberta] = useState(false);
  const [termo, setTermo] = useState("");
  const [ativo, setAtivo] = useState(0);
  const router = useRouter();
  const idLista = useId();

  const campo = useRef<HTMLInputElement>(null);
  const caixa = useRef<HTMLDivElement>(null);

  /*
    ── A BUSCA NÃO DEVE ENCONTRAR O QUE SAIU DA BIBLIOTECA ─────────────────

    O texto do bloco de arquivamento promete que o insumo arquivado "sai das
    listas e das buscas". Sem este filtro a promessa seria falsa: o índice
    chega pronto do servidor, que não sabe o que foi arquivado nesta sessão,
    e o Ctrl+K continuaria achando o insumo pelo nome — entregando um caminho
    para uma tela que a lista já não oferece.

    O id do índice é PREFIXADO (`ingrediente:in_7`), então o prefixo é
    separado antes de perguntar. Quem responde é `insumoForaDaBiblioteca`, e
    não uma segunda regra escrita aqui: a decisão de negócio é uma só.
  */
  const disponiveis = useMemo(
    () =>
      itens.filter((i) => {
        if (!i.id.startsWith("ingrediente:")) return true;
        return !insumoForaDaBiblioteca(i.id.slice("ingrediente:".length));
      }),
    [itens]
  );

  const resultados = useMemo(() => buscar(disponiveis, termo, 12), [disponiveis, termo]);
  const grupos = useMemo(() => agruparResultados(resultados), [resultados]);

  // Lista achatada na MESMA ordem dos grupos — é ela que as setas percorrem.
  // Se a ordem das duas divergisse, a seta pularia um item na tela.
  const emOrdem: ResultadoBusca[] = useMemo(() => grupos.flatMap((g) => g.itens), [grupos]);

  // Ctrl+K / ⌘K de qualquer lugar do sistema.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberta((a) => !a);
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  useEffect(() => {
    if (aberta) {
      setTermo("");
      setAtivo(0);
      // O campo só existe depois que a caixa monta; o foco vem no próximo
      // quadro, quando ele já está no DOM.
      const t = requestAnimationFrame(() => campo.current?.focus());
      return () => cancelAnimationFrame(t);
    }
  }, [aberta]);

  // Clique fora fecha — mas só quando o termo está vazio. Com resultado na
  // tela, um clique perdido não deve apagar a busca.
  useEffect(() => {
    if (!aberta) return;
    const aoClicar = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberta(false);
    };
    document.addEventListener("mousedown", aoClicar);
    return () => document.removeEventListener("mousedown", aoClicar);
  }, [aberta]);

  function irPara(item: ResultadoBusca | undefined) {
    if (!item) return;
    setAberta(false);
    router.push(item.href);
  }

  function aoTeclarNoCampo(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setAberta(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAtivo((i) => (emOrdem.length === 0 ? 0 : (i + 1) % emOrdem.length));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => (emOrdem.length === 0 ? 0 : (i - 1 + emOrdem.length) % emOrdem.length));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      irPara(emOrdem[ativo]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberta(true)}
        aria-haspopup="dialog"
        className={cn(
          "nao-imprimir group flex h-9 items-center gap-2.5 rounded-[var(--raio-sm)] border border-[var(--linha)]",
          "bg-[rgba(255,255,255,0.5)] px-3 text-[var(--tinta-fraca)] transition-colors",
          "hover:border-[var(--linha-forte)] hover:text-[var(--tinta-suave)]"
        )}
      >
        <svg aria-hidden width="13" height="13" viewBox="0 0 14 14">
          <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
          <path d="M9.3 9.3 12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="hidden text-[0.8125rem] sm:inline">Buscar…</span>
        <kbd className="hidden rounded-[2px] border border-[var(--linha)] px-1.5 py-0.5 text-[0.625rem] tracking-wide lg:inline">
          Ctrl K
        </kbd>
      </button>

      {aberta ? (
        <div className="nao-imprimir fixed inset-0 z-[60] flex justify-center px-4 pt-[10vh]">
          <button
            type="button"
            aria-label="Fechar busca"
            tabIndex={-1}
            onClick={() => setAberta(false)}
            className="absolute inset-0 cursor-default bg-noite/40 backdrop-blur-[2px]"
          />

          <div
            ref={caixa}
            role="dialog"
            aria-modal="true"
            aria-label="Busca global"
            className={cn(
              "entrar-suave relative flex max-h-[70vh] w-full max-w-[560px] flex-col overflow-hidden",
              "rounded-[var(--raio)] border border-[var(--linha-forte)] bg-[var(--superficie-solida)] shadow-2xl"
            )}
            onKeyDown={(e) => {
              if (e.key === "Escape") setAberta(false);
            }}
          >
            <div className="flex shrink-0 items-center gap-3 border-b border-[var(--linha)] px-4">
              <svg
                aria-hidden
                width="14"
                height="14"
                viewBox="0 0 14 14"
                className="shrink-0 text-[var(--tinta-fraca)]"
              >
                <circle cx="6" cy="6" r="4.4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                <path d="M9.3 9.3 12.5 12.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              <input
                ref={campo}
                type="text"
                role="combobox"
                aria-expanded={resultados.length > 0}
                aria-controls={idLista}
                aria-autocomplete="list"
                value={termo}
                onChange={(e) => {
                  setTermo(e.target.value);
                  setAtivo(0);
                }}
                onKeyDown={aoTeclarNoCampo}
                placeholder="Cliente, lead, ficha, ingrediente, consultoria…"
                className={cn(
                  "h-12 w-full bg-transparent text-[0.9375rem] text-tinta",
                  "placeholder:text-[var(--tinta-fraca)] focus:outline-none"
                )}
              />
              <button
                type="button"
                onClick={() => setAberta(false)}
                className="shrink-0 rounded-[2px] border border-[var(--linha)] px-1.5 py-0.5 text-[0.625rem] tracking-wide text-[var(--tinta-fraca)]"
              >
                ESC
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {termo.trim().length < 2 ? (
                <div className="px-4 py-6">
                  <p className="text-[0.8125rem] text-[var(--tinta-suave)]">
                    Digite ao menos duas letras. A busca procura em clientes, consultorias,
                    leads, fichas técnicas, ingredientes, processos, acompanhamentos e
                    tarefas.
                  </p>
                </div>
              ) : emOrdem.length === 0 ? (
                <div className="px-4 py-6">
                  <p className="text-[0.8125rem] text-[var(--tinta-suave)]">
                    Nada encontrado para{" "}
                    <strong className="font-semibold text-tinta">“{termo}”</strong>.
                  </p>
                  <p className="mt-1.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
                    Tente parte do nome, sem acento. A busca não procura dentro do texto do
                    diagnóstico.
                  </p>
                </div>
              ) : (
                <ul id={idLista} role="listbox" className="py-1.5">
                  {grupos.map((g) => (
                    <li key={g.tipo}>
                      <p className="px-4 pt-3 pb-1.5 text-[0.625rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
                        {g.rotulo}
                        <span className="ml-2 font-normal tracking-normal normal-case">
                          {g.itens.length}
                        </span>
                      </p>
                      <ul>
                        {g.itens.map((item) => {
                          const indice = emOrdem.findIndex((x) => x.id === item.id);
                          const selecionado = indice === ativo;
                          return (
                            <li key={item.id} role="option" aria-selected={selecionado}>
                              <button
                                type="button"
                                onMouseEnter={() => setAtivo(indice)}
                                onClick={() => irPara(item)}
                                className={cn(
                                  "flex w-full items-baseline justify-between gap-4 px-4 py-2 text-left transition-colors",
                                  selecionado && "bg-[rgba(107,122,70,0.09)]"
                                )}
                              >
                                <span className="min-w-0">
                                  <span className="block truncate text-[0.875rem] text-tinta">
                                    {item.titulo}
                                  </span>
                                  <span className="mt-0.5 block truncate text-[0.75rem] text-[var(--tinta-fraca)]">
                                    {item.detalhe}
                                  </span>
                                </span>
                                <span className="shrink-0 text-[0.625rem] tracking-[0.12em] text-[var(--tinta-fraca)] uppercase">
                                  {ROTULO_TIPO_BUSCA[item.tipo]}
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {emOrdem.length > 0 ? (
              <div className="shrink-0 border-t border-[var(--linha)] px-4 py-2.5 text-[0.6875rem] text-[var(--tinta-fraca)]">
                <span className="tabular">↑↓</span> navegar · <span className="tabular">↵</span> abrir
                · <span className="tabular">esc</span> fechar
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
