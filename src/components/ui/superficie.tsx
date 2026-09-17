import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Rotulo } from "./rotulo";

/**
 * Superfícies de conteúdo.
 *
 * O pedido foi explícito: nada de "cards genéricos espalhados pela tela".
 * Por isso existem só duas superfícies, e ambas são delimitadas por linha,
 * não por sombra flutuante:
 *
 *   Secao    — bloco de conteúdo com título; é a unidade padrão de página.
 *   Painel   — caixa fechada, para uma informação só.
 *
 * A diferença para um card de template: canto quase reto (4px), borda de
 * 1px na cor de linha da marca, fundo levemente translúcido, e o título
 * usa o rótulo de seção — não um cabeçalho de card com ícone colorido.
 */
export function Secao({
  rotulo,
  titulo,
  descricao,
  acoes,
  children,
  className,
}: {
  rotulo?: string;
  titulo?: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)]",
        className
      )}
    >
      {rotulo || titulo || acoes ? (
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[var(--linha)] px-5 py-4">
          <div className="min-w-0">
            {rotulo ? <Rotulo className="mb-2">{rotulo}</Rotulo> : null}
            {titulo ? <h2 className="text-[1.0625rem]">{titulo}</h2> : null}
            {descricao ? (
              <p className="mt-1.5 max-w-[64ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                {descricao}
              </p>
            ) : null}
          </div>
          {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
        </header>
      ) : null}
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

/** Caixa fechada para um dado só. Sem ícone decorativo, sem gradiente. */
export function Painel({
  children,
  className,
  escuro = false,
}: {
  children: ReactNode;
  className?: string;
  escuro?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--raio)] border p-5",
        escuro
          ? "border-[var(--linha-clara)] bg-profundo text-creme"
          : "border-[var(--linha)] bg-[var(--superficie)]",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Estado vazio.
 *
 * Existe em toda tela do sistema. A Fase 0 identificou que as planilhas
 * atuais mostram `#DIV/0!` e células em branco ao cliente — aqui, ausência
 * de dado vira uma frase que explica o que falta e por quê.
 */
export function EstadoVazio({
  titulo,
  descricao,
  acao,
  className,
}: {
  titulo: string;
  descricao?: string;
  acao?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.4)] px-6 py-10",
        className
      )}
    >
      <h3 className="text-[1rem]">{titulo}</h3>
      {descricao ? (
        <p className="mt-2 max-w-[62ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          {descricao}
        </p>
      ) : null}
      {acao ? <div className="mt-5">{acao}</div> : null}
    </div>
  );
}

/**
 * Aviso. A cor não é decoração: cada tom corresponde a um nível de
 * consequência sobre o negócio, e o texto sempre diz o que fazer.
 */
export function Aviso({
  tom = "info",
  titulo,
  children,
  className,
}: {
  tom?: "info" | "atencao" | "critico" | "sucesso";
  titulo?: string;
  children: ReactNode;
  className?: string;
}) {
  const tons = {
    info: { borda: "border-l-oliva", fundo: "bg-[rgba(107,122,70,0.06)]" },
    atencao: { borda: "border-l-dourado", fundo: "bg-[rgba(201,165,78,0.09)]" },
    critico: { borda: "border-l-red-800", fundo: "bg-[rgba(153,27,27,0.07)]" },
    sucesso: { borda: "border-l-medio", fundo: "bg-[rgba(29,82,54,0.07)]" },
  }[tom];

  return (
    <div
      className={cn(
        "rounded-[var(--raio)] border border-[var(--linha)] border-l-2 px-4 py-3.5",
        tons.borda,
        tons.fundo,
        className
      )}
    >
      {titulo ? <p className="mb-1 font-semibold text-[0.875rem]">{titulo}</p> : null}
      <div className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">{children}</div>
    </div>
  );
}
