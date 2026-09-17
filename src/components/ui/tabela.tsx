import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Tabela.
 *
 * O sistema é, no fundo, uma ferramenta de listas: ingredientes, fichas,
 * pratos por CMV, leads. A tabela é o componente mais importante daqui.
 *
 * Sobre as colunas numéricas: `align="dir"` aplica números tabulares e
 * alinhamento à direita. Isso não é estilo — é o que faz uma coluna de
 * custo ser comparável de relance. A planilha atual acerta nisso e o
 * sistema preserva.
 */

export function Tabela({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)]",
        className
      )}
    >
      <table className="w-full border-collapse text-[0.875rem]">{children}</table>
    </div>
  );
}

export function CabecalhoTabela({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-[var(--linha-forte)] bg-[rgba(242,236,226,0.5)]">
      {children}
    </thead>
  );
}

export function LinhaCabecalho({ children }: { children: ReactNode }) {
  return <tr>{children}</tr>;
}

export function CelulaCabecalho({
  children,
  align = "esq",
  className,
}: {
  children?: ReactNode;
  align?: "esq" | "dir" | "centro";
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={cn(
        "px-3.5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] " +
          "text-[var(--tinta-suave)] whitespace-nowrap",
        align === "dir" && "text-right",
        align === "centro" && "text-center",
        align === "esq" && "text-left",
        className
      )}
    >
      {children}
    </th>
  );
}

export function CorpoTabela({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function LinhaTabela({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--linha)] last:border-b-0 " +
          "transition-colors duration-100 hover:bg-[rgba(107,122,70,0.05)]",
        className
      )}
    >
      {children}
    </tr>
  );
}

export function Celula({
  children,
  align = "esq",
  className,
  destaque = false,
}: {
  children?: ReactNode;
  align?: "esq" | "dir" | "centro";
  className?: string;
  /** Coluna de identificação (nome do ingrediente, nome do prato). */
  destaque?: boolean;
}) {
  return (
    <td
      className={cn(
        "px-3.5 py-2.5 align-middle",
        align === "dir" && "text-right tabular",
        align === "centro" && "text-center",
        destaque && "font-medium text-tinta",
        !destaque && align !== "dir" && "text-[var(--tinta-suave)]",
        className
      )}
    >
      {children}
    </td>
  );
}
