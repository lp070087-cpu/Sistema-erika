"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * NOTIFICAÇÕES INTERNAS — §23.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE COMPONENTE NÃO FAZ, E POR QUE ISSO ESTÁ ESCRITO AQUI      │
 * │                                                                      │
 * │ · Não envia e-mail                                                   │
 * │ · Não envia WhatsApp                                                 │
 * │ · Não usa notificação push do navegador                               │
 * │ · Não pede permissão de nada                                          │
 * │ · Não marca nada como "lido" de forma permanente                     │
 * │                                                                      │
 * │ Não é limitação técnica: é escopo. A §23 pediu notificação interna    │
 * │ discreta e toda ela mock. Um sistema que começa pedindo permissão de  │
 * │ notificação no primeiro acesso queima a confiança antes de mostrar    │
 * │ qualquer valor — e a Érika abre isso na frente de um cliente.         │
 * │                                                                      │
 * │ Marcar como lida vive em estado local e some ao recarregar. Tudo bem: │
 * │ a lista é de demonstração, e um "lido" que não persiste é menos      │
 * │ mentiroso do que um que persiste em lugar nenhum.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O SINO MOSTRA NÚMERO E NÃO UM PONTO VERMELHO                 │
 * │                                                                      │
 * │ Ponto vermelho diz "tem algo". Número diz QUANTO — e ela decide se    │
 * │ abre agora ou depois de atender o cliente que está na frente dela.    │
 * │                                                                      │
 * │ Acima de nove vira "9+": o número exato deixa de importar, e o        │
 * │ contador não deve crescer e empurrar o resto da barra de topo.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export type NotificacaoExibida = {
  id: string;
  titulo: string;
  descricao: string;
  href: string;
  /** Já formatado no servidor — o componente não formata data. */
  quando: string;
  /** Agrupamento visual: hoje, esta semana, antes. */
  grupo: string;
};

export function SinoDeNotificacoes({ itens }: { itens: readonly NotificacaoExibida[] }) {
  const [aberto, setAberto] = useState(false);
  const [lidas, setLidas] = useState<readonly string[]>([]);
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    const aoClicar = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };

    document.addEventListener("mousedown", aoClicar);
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const naoLidas = itens.filter((i) => !lidas.includes(i.id));
  const contagem = naoLidas.length;

  // Agrupadas por período, na ordem em que a lista chegou (mais recente
  // primeiro). O agrupamento é de leitura, não de prioridade.
  const grupos = itens.reduce<Map<string, NotificacaoExibida[]>>((mapa, item) => {
    const atual = mapa.get(item.grupo) ?? [];
    atual.push(item);
    mapa.set(item.grupo, atual);
    return mapa;
  }, new Map());

  return (
    <div ref={caixa} className="nao-imprimir relative">
      <button
        type="button"
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        aria-haspopup="dialog"
        aria-label={
          contagem === 0
            ? "Notificações"
            : `Notificações — ${contagem} ${contagem === 1 ? "nova" : "novas"}`
        }
        className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-[var(--raio-sm)] border transition-colors",
          aberto
            ? "border-[var(--linha-forte)] bg-white text-tinta"
            : "border-[var(--linha)] bg-[rgba(255,255,255,0.5)] text-[var(--tinta-suave)] hover:border-[var(--linha-forte)] hover:text-tinta"
        )}
      >
        <svg aria-hidden width="15" height="15" viewBox="0 0 16 16">
          <path
            d="M8 2.2a3.6 3.6 0 0 0-3.6 3.6c0 3-1.2 4.1-1.2 4.1h9.6s-1.2-1.1-1.2-4.1A3.6 3.6 0 0 0 8 2.2Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <path
            d="M6.6 12.1a1.5 1.5 0 0 0 2.8 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
        </svg>

        {contagem > 0 ? (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-dourado px-1 text-[0.625rem] font-semibold text-noite tabular"
          >
            {contagem > 9 ? "9+" : contagem}
          </span>
        ) : null}
      </button>

      {aberto ? (
        <div
          role="dialog"
          aria-label="Notificações"
          className={cn(
            "entrar-suave absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),380px)] overflow-hidden",
            "rounded-[var(--raio)] border border-[var(--linha-forte)] bg-[var(--superficie-solida)] shadow-xl"
          )}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--linha)] px-4 py-3">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Notificações
            </p>
            {contagem > 0 ? (
              <button
                type="button"
                onClick={() => setLidas(itens.map((i) => i.id))}
                className="text-[0.75rem] text-oliva hover:underline"
              >
                marcar todas como lidas
              </button>
            ) : null}
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {itens.length === 0 ? (
              <p className="px-4 py-6 text-[0.8125rem] text-[var(--tinta-suave)]">
                Nada por aqui. Tarefas atrasadas, diagnósticos novos e
                acompanhamentos próximos aparecem neste espaço.
              </p>
            ) : (
              [...grupos.entries()].map(([grupo, doGrupo]) => (
                <div key={grupo}>
                  <p className="bg-[rgba(242,236,226,0.5)] px-4 py-1.5 text-[0.625rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
                    {grupo}
                  </p>
                  <ul>
                    {doGrupo.map((item) => {
                      const lida = lidas.includes(item.id);
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={() => {
                              setLidas((l) => (l.includes(item.id) ? l : [...l, item.id]));
                              setAberto(false);
                            }}
                            className={cn(
                              "block border-b border-[var(--linha)] px-4 py-3 transition-colors last:border-b-0 hover:bg-[rgba(107,122,70,0.06)]",
                              lida && "opacity-55"
                            )}
                          >
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="text-[0.8125rem] font-medium text-tinta">
                                {item.titulo}
                              </span>
                              <span className="shrink-0 text-[0.6875rem] text-[var(--tinta-fraca)]">
                                {item.quando}
                              </span>
                            </div>
                            <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                              {item.descricao}
                            </p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))
            )}
          </div>

          <p className="border-t border-[var(--linha)] px-4 py-2.5 text-[0.6875rem] leading-relaxed text-[var(--tinta-fraca)]">
            Avisos internos, só dentro do sistema. O sistema não envia e-mail,
            WhatsApp nem notificação no celular.
          </p>
        </div>
      ) : null}
    </div>
  );
}
