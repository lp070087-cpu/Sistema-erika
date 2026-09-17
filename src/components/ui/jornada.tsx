import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Etiqueta } from "./indicador";
import { ROTULO_ETAPA } from "@/lib/dados";
import type { EstadoEtapa, EtapaJornada } from "@/lib/dados";

/**
 * JORNADA DA CONSULTORIA.
 *
 * As sete etapas do método dela, na ordem que o site já publica. Cada uma
 * diz em que estado está e o que existe dentro dela.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO EXISTE UM PERCENTUAL DE CONCLUSÃO AQUI                   │
 * │                                                                      │
 * │ Seria fácil somar as sete etapas e mostrar "57% concluído". Seria     │
 * │ falso. "Diagnóstico" e "Implantação" não pesam o mesmo — uma dura     │
 * │ uma reunião, a outra dura meses e vale por metade do trabalho.        │
 * │ Atribuir peso a cada etapa é exatamente o ponto 11 da Seção 17, que   │
 * │ segue sem resposta.                                                    │
 * │                                                                      │
 * │ O que a tela mostra é o que dá para afirmar sem decidir nada: o       │
 * │ estado de cada etapa, e contagens dentro dela quando existem —        │
 * │ "12 de 22 fichas". Contagem se confere; percentual ponderado, não.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const ROTULO_ESTADO: Record<EstadoEtapa, string> = {
  NAO_INICIADA: "Não iniciada",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  AGUARDANDO_DADOS: "Aguardando dados",
};

const TOM_ESTADO: Record<EstadoEtapa, "neutro" | "oliva" | "dourado" | "verde"> = {
  NAO_INICIADA: "neutro",
  EM_ANDAMENTO: "oliva",
  CONCLUIDA: "verde",
  AGUARDANDO_DADOS: "dourado",
};

export function Jornada({
  etapas,
  className,
}: {
  etapas: readonly EtapaJornada[];
  className?: string;
}) {
  return (
    <ol className={cn("space-y-0", className)}>
      {etapas.map((etapa, i) => (
        <li key={etapa.etapa} className="flex gap-4">
          {/* Coluna do marcador */}
          <div className="flex w-6 shrink-0 flex-col items-center">
            <Marcador estado={etapa.estado} indice={i} />
            {i < etapas.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  "mt-1 w-px flex-1",
                  etapa.estado === "CONCLUIDA" ? "bg-oliva/40" : "bg-[var(--linha)]"
                )}
              />
            ) : null}
          </div>

          {/* Conteúdo */}
          <div className="min-w-0 flex-1 pb-5 last:pb-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <span className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] tabular">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={cn(
                  "text-[0.9375rem] font-medium",
                  etapa.estado === "NAO_INICIADA" ? "text-[var(--tinta-fraca)]" : "text-tinta"
                )}
              >
                {ROTULO_ETAPA[etapa.etapa]}
              </span>
              <Etiqueta tom={TOM_ESTADO[etapa.estado]}>{ROTULO_ESTADO[etapa.estado]}</Etiqueta>

              {etapa.progresso !== undefined && etapa.total !== undefined ? (
                <span className="tabular text-[0.8125rem] text-[var(--tinta-suave)]">
                  {etapa.progresso} de {etapa.total}
                </span>
              ) : null}
            </div>

            {etapa.nota && etapa.nota !== "—" ? (
              <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                {etapa.nota}
              </p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Marcador({ estado, indice }: { estado: EstadoEtapa; indice: number }) {
  const base =
    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[0.625rem] font-semibold tabular";

  if (estado === "CONCLUIDA") {
    return (
      <span className={cn(base, "border-oliva/50 bg-oliva/12 text-oliva")} aria-hidden>
        <svg width="11" height="9" viewBox="0 0 11 9">
          <path
            d="M1 4.6 4 7.6 10 1.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="sr-only">concluída</span>
      </span>
    );
  }

  if (estado === "EM_ANDAMENTO") {
    return (
      <span className={cn(base, "border-oliva bg-white text-tinta")} aria-hidden>
        {String(indice + 1).padStart(2, "0")}
      </span>
    );
  }

  if (estado === "AGUARDANDO_DADOS") {
    return (
      <span className={cn(base, "border-dourado/60 bg-[rgba(201,165,78,0.1)] text-[#8a6d1f]")} aria-hidden>
        {String(indice + 1).padStart(2, "0")}
      </span>
    );
  }

  return (
    <span className={cn(base, "border-[var(--linha-forte)] text-[var(--tinta-fraca)]")} aria-hidden>
      {String(indice + 1).padStart(2, "0")}
    </span>
  );
}

/**
 * Barra de progresso simples, para contagens dentro de uma etapa
 * ("12 de 22 fichas"). Existe separada da Jornada porque a tela de
 * consultoria usa as duas em lugares diferentes.
 */
export function ProgressoContagem({
  feitos,
  total,
  rotulo,
  className,
}: {
  feitos: number;
  total: number;
  rotulo?: string;
  className?: string;
}) {
  if (total <= 0) return null;
  const preenchido = Math.min(100, Math.round((feitos / total) * 100));

  return (
    <div className={className}>
      {rotulo ? (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <span className="text-[0.8125rem] text-[var(--tinta-suave)]">{rotulo}</span>
          <span className="tabular text-[0.8125rem] text-tinta">
            {feitos} de {total}
          </span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={feitos}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={rotulo}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--linha)]"
      >
        <div
          className="h-full rounded-full bg-oliva transition-[width] duration-500 ease-[var(--ease-marca)]"
          style={{ width: `${preenchido}%` }}
        />
      </div>
    </div>
  );
}

/** Onde falta dado, o sistema diz o que falta — não inventa o número. */
export function AvisoMetodologia({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--raio-sm)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.5)] px-3.5 py-3">
      <span
        aria-hidden
        className="mt-0.5 shrink-0 rounded-[2px] border border-[var(--linha-forte)] px-1.5 py-0.5 text-[0.5625rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase"
      >
        Em preparação
      </span>
      <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
        {children ?? "Cálculo disponível após configuração da metodologia."}
      </p>
    </div>
  );
}
