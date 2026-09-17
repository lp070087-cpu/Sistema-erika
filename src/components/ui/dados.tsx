import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * LISTA DE DADOS — o par "rótulo pequeno / valor" em grade.
 *
 * É a forma mais repetida do sistema: ficha do cliente, jornada da
 * consultoria, dados da ficha técnica, histórico de preço do ingrediente,
 * passo do processo. Cinco telas com a mesma estrutura — por isso um
 * componente, e não cinco `<dl>` escritos à mão que divergem em espaçamento.
 *
 * O rótulo vai em caixa alta pequena e o valor em corpo normal, na mesma
 * hierarquia do rótulo de seção da marca. Um `<dl>` de verdade, não uma
 * tabela: leitor de tela anuncia "termo / definição", que é o que é.
 */

export function ListaDados({
  children,
  colunas = 2,
  className,
}: {
  children: ReactNode;
  /** Colunas em telas largas. Abaixo de `sm` é sempre uma. */
  colunas?: 1 | 2 | 3;
  className?: string;
}) {
  const grade = {
    1: "",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
  }[colunas];

  return <dl className={cn("grid gap-x-8 gap-y-5", grade, className)}>{children}</dl>;
}

export function Dado({
  rotulo,
  children,
  largo = false,
  className,
}: {
  rotulo: string;
  children: ReactNode;
  /** Ocupa a largura toda — para texto corrido, que não cabe em coluna. */
  largo?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", largo && "sm:col-span-2 lg:col-span-3", className)}>
      <dt className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </dt>
      <dd className="mt-1.5 text-[0.9375rem] leading-relaxed text-tinta">{children}</dd>
    </div>
  );
}

/**
 * Linha "rótulo à esquerda, valor à direita".
 *
 * Diferente de `Dado`: aqui o par fica na MESMA linha, que é o formato certo
 * quando a lista é longa e os valores são curtos — histórico de preço, passos
 * de um processo. Com duas colunas em grade, uma lista de vinte linhas vira
 * uma parede de rótulos.
 */
export function ListaLinhas({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <dl className={cn("divide-y divide-[var(--linha)]", className)}>{children}</dl>;
}

export function LinhaDado({
  rotulo,
  children,
  className,
}: {
  rotulo: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5 first:pt-0 last:pb-0",
        className
      )}
    >
      <dt className="text-[0.8125rem] text-[var(--tinta-suave)]">{rotulo}</dt>
      <dd className="text-right text-[0.875rem] text-tinta">{children}</dd>
    </div>
  );
}

/**
 * Campo de formulário que ainda não pode ser gravado.
 *
 * A Seção 30 proíbe persistir dado de demonstração, e a Seção 5 proíbe
 * fingir que salvou. A tentação seria desabilitar o campo e pronto — mas um
 * campo cinza sem explicação parece bug. Aqui ele APARECE com o valor que a
 * consultora veria, marcado como não gravável, e a razão vem junto.
 */
export function CampoDemonstracao({
  rotulo,
  valor,
  nota,
}: {
  rotulo: string;
  valor: ReactNode;
  nota?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </p>
      <p className="mt-1.5 text-[0.9375rem] text-tinta">{valor}</p>
      {nota ? (
        <p className="mt-1 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">{nota}</p>
      ) : null}
    </div>
  );
}
