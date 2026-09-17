import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Rótulo de seção — o elemento-assinatura da marca.
 *
 * Vem direto de `.eb-rotulo` do site: caixa alta, 0.6875rem, tracking 0.26em,
 * com um traço de 34px antes. É o que mantém a identidade reconhecível
 * sem consumir espaço vertical numa ferramenta de uso diário.
 */
export function Rotulo({
  children,
  traco = true,
  className,
  claro = false,
}: {
  children: ReactNode;
  traco?: boolean;
  className?: string;
  /** Sobre fundo escuro: troca o oliva pelo oliva-palha do site. */
  claro?: boolean;
}) {
  return (
    <span
      className={cn("rotulo", traco && "rotulo-traco", claro && "rotulo-claro", className)}
    >
      {children}
    </span>
  );
}

/**
 * Cabeçalho de página. Substitui o par "título grande + subtítulo"
 * do site por uma versão compacta, adequada a telas repetidas.
 */
export function CabecalhoPagina({
  rotulo,
  titulo,
  descricao,
  acoes,
}: {
  rotulo?: string;
  titulo: string;
  descricao?: string;
  acoes?: ReactNode;
}) {
  return (
    <header className="border-b border-[var(--linha)] pb-5">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0 flex-1">
          {rotulo ? <Rotulo className="mb-3">{rotulo}</Rotulo> : null}
          <h1 className="text-balance">{titulo}</h1>
          {descricao ? (
            <p className="mt-2.5 max-w-[68ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
              {descricao}
            </p>
          ) : null}
        </div>
        {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
      </div>
    </header>
  );
}
