import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * LINHA DO TEMPO.
 *
 * Usada em três lugares com a mesma forma: o histórico do cliente, os
 * acompanhamentos de uma consultoria e o histórico de preço de um insumo.
 * Os três são "coisas que aconteceram, em ordem" — por isso um componente,
 * e não três parecidos.
 *
 * A ordem é sempre a mesma: mais recente em cima. Uma linha do tempo que
 * cresce para baixo obriga a rolar para ver o que acabou de acontecer, que
 * é justamente o que se quer ver primeiro.
 */

export type EventoLinhaDoTempo = {
  id: string;
  /** Data já formatada. O componente não formata — quem chama decide. */
  quando: string;
  titulo: string;
  descricao?: string;
  /** Rótulo curto de categoria. Aparece como etiqueta discreta. */
  tipo?: string;
  /** Valor em destaque, para o histórico de preço. */
  valor?: ReactNode;
};

export function LinhaDoTempo({
  eventos,
  className,
  vazio,
}: {
  eventos: readonly EventoLinhaDoTempo[];
  className?: string;
  /** O que mostrar quando não há evento nenhum. */
  vazio?: ReactNode;
}) {
  if (eventos.length === 0) {
    return <>{vazio ?? null}</>;
  }

  return (
    <ol className={cn("space-y-0", className)}>
      {eventos.map((evento, i) => (
        <li key={evento.id} className="flex gap-4">
          <div className="flex flex-col items-center pt-[7px]">
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                // O primeiro item é o mais recente; ele ganha o oliva cheio
                // para que o olho saiba onde a história está agora.
                i === 0 ? "bg-oliva" : "bg-[var(--linha-forte)]"
              )}
            />
            {i < eventos.length - 1 ? (
              <span aria-hidden className="mt-1 w-px flex-1 bg-[var(--linha)]" />
            ) : null}
          </div>

          <div className="min-w-0 flex-1 pb-5 last:pb-0">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <p className="text-[0.875rem] leading-snug font-medium text-tinta">
                {evento.titulo}
              </p>
              {evento.valor ? (
                <span className="tabular shrink-0 text-[0.875rem] text-tinta">
                  {evento.valor}
                </span>
              ) : null}
            </div>

            {evento.descricao ? (
              <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                {evento.descricao}
              </p>
            ) : null}

            <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.75rem] text-[var(--tinta-fraca)]">
              <span>{evento.quando}</span>
              {evento.tipo ? (
                <>
                  <span aria-hidden>·</span>
                  <span className="uppercase tracking-[0.12em]">{evento.tipo}</span>
                </>
              ) : null}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
