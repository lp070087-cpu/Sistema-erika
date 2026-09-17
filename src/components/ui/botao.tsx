import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Botão da marca.
 *
 * Herda do `.eb-btn` do site: caixa alta, tracking largo, canto quase reto,
 * e um preenchimento que sobe de baixo para cima no hover.
 * A versão do sistema é mais baixa e mais densa — é clicada muitas vezes
 * por dia, não uma vez por página.
 */

type Variante = "primario" | "secundario" | "linha" | "fantasma";
type Tamanho = "sm" | "md";

const base =
  "relative inline-flex items-center justify-center gap-2 overflow-hidden " +
  "font-medium uppercase whitespace-nowrap select-none " +
  "transition-colors duration-200 ease-[var(--ease-suave)] " +
  "disabled:pointer-events-none disabled:opacity-40";

const variantes: Record<Variante, string> = {
  primario: "bg-profundo text-off border border-profundo hover:bg-medio hover:border-medio",
  secundario:
    "bg-transparent text-tinta border border-[var(--linha-forte)] " +
    "hover:border-tinta hover:bg-tinta hover:text-off",
  linha:
    "bg-transparent text-tinta border border-transparent hover:bg-[rgba(14,26,20,0.06)]",
  fantasma:
    "bg-transparent text-off border border-[var(--linha-clara)] " +
    "hover:border-dourado-claro hover:text-dourado-claro",
};

const tamanhos: Record<Tamanho, string> = {
  sm: "h-8 px-3 text-[0.6875rem] tracking-[0.13em] rounded-[var(--raio-sm)]",
  md: "h-10 px-4.5 text-[0.75rem] tracking-[0.15em] rounded-[var(--raio-sm)]",
};

/**
 * `children` é omitido do tipo herdado para poder ser declarado como
 * obrigatório sem conflitar com a definição opcional do React.
 */
export interface BotaoProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variante?: Variante;
  tamanho?: Tamanho;
  children: ReactNode;
}

export function Botao({
  variante = "secundario",
  tamanho = "md",
  className,
  children,
  ...props
}: BotaoProps) {
  return (
    <button className={cn(base, variantes[variante], tamanhos[tamanho], className)} {...props}>
      {children}
    </button>
  );
}

/** Mesmo visual, mas navega. Usado em ações que trocam de rota. */
export function BotaoLink({
  href,
  variante = "secundario",
  tamanho = "md",
  className,
  children,
}: {
  href: string;
  variante?: Variante;
  tamanho?: Tamanho;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(base, variantes[variante], tamanhos[tamanho], className)}
    >
      {children}
    </Link>
  );
}
