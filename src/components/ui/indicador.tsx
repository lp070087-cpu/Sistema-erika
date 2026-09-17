import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Indicador numérico.
 *
 * O BRIEFING PEDIU: valor com rótulo e contexto.
 * A REGRA DESTA FASE: o componente NÃO calcula nada.
 *
 * Ele recebe o valor já formatado e o tom já decidido. Quem decide se um
 * CMV é bom ou ruim é o domínio — e essa regra ainda depende do ponto 7
 * da Seção 17, que não foi respondido. Por isso não existe aqui nenhuma
 * função do tipo `tomDoCmv()`.
 */

export type Tom = "neutro" | "positivo" | "atencao" | "critico";

const coresTom: Record<Tom, string> = {
  neutro: "text-tinta",
  positivo: "text-medio",
  atencao: "text-[#8a6d1f]",
  critico: "text-red-800",
};

export function Indicador({
  rotulo,
  valor,
  unidade,
  contexto,
  tom = "neutro",
  className,
}: {
  rotulo: string;
  /** Já formatado. O componente não formata nem calcula. */
  valor: ReactNode;
  unidade?: string;
  contexto?: string;
  tom?: Tom;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--tinta-fraca)]">
        {rotulo}
      </span>
      <span className={cn("mt-1.5 font-display text-[1.5rem] leading-none tabular", coresTom[tom])}>
        {valor}
        {unidade ? (
          <span className="ml-1 font-texto text-[0.8125rem] font-normal text-[var(--tinta-suave)]">
            {unidade}
          </span>
        ) : null}
      </span>
      {contexto ? (
        <span className="mt-1.5 text-[0.8125rem] leading-snug text-[var(--tinta-fraca)]">
          {contexto}
        </span>
      ) : null}
    </div>
  );
}

/** Etiqueta de estado. Sem ícone, sem bolinha colorida — só texto e borda. */
export function Etiqueta({
  children,
  tom = "neutro",
  className,
}: {
  children: ReactNode;
  tom?: "neutro" | "oliva" | "dourado" | "critico" | "verde";
  className?: string;
}) {
  const tons = {
    neutro: "border-[var(--linha-forte)] text-[var(--tinta-suave)]",
    oliva: "border-oliva/50 text-oliva bg-[rgba(107,122,70,0.07)]",
    dourado: "border-dourado/60 text-[#8a6d1f] bg-[rgba(201,165,78,0.1)]",
    critico: "border-red-800/40 text-red-800 bg-[rgba(153,27,27,0.07)]",
    verde: "border-medio/40 text-medio bg-[rgba(29,82,54,0.07)]",
  }[tom];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-[2px] border px-2 py-0.5 " +
          "text-[0.6875rem] font-semibold uppercase tracking-[0.12em] whitespace-nowrap",
        tons,
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Trilha de seções — para telas que já têm etapas definidas
 * (o método de 5 etapas da consultora, ou o diagnóstico em blocos).
 * Puramente apresentacional.
 */
export function Trilha({
  etapas,
  atual,
  className,
}: {
  etapas: ReadonlyArray<{ chave: string; titulo: string }>;
  atual: string;
  className?: string;
}) {
  const indiceAtual = etapas.findIndex((e) => e.chave === atual);

  return (
    <ol className={cn("flex flex-wrap items-center gap-x-4 gap-y-2", className)}>
      {etapas.map((etapa, i) => {
        const feito = i < indiceAtual;
        const ativo = i === indiceAtual;
        return (
          <li key={etapa.chave} className="flex items-center gap-3">
            <span
              className={cn(
                "text-[0.6875rem] font-semibold uppercase tracking-[0.16em]",
                ativo
                  ? "text-tinta"
                  : feito
                    ? "text-oliva"
                    : "text-[var(--tinta-fraca)]"
              )}
            >
              {String(i + 1).padStart(2, "0")} {etapa.titulo}
            </span>
            {i < etapas.length - 1 ? (
              <span
                aria-hidden
                className="h-px w-6 bg-[var(--linha-forte)]"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
