import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Campos de formulário.
 *
 * O site não tem formulário (o lead vai para o Google Forms), então este
 * componente é novo — mas segue a mesma linguagem: canto quase reto,
 * borda fina, rótulo em caixa alta pequena, e o dourado no foco.
 */

const baseCampo =
  "w-full bg-white/70 border border-[var(--linha-forte)] rounded-[var(--raio-sm)] " +
  "px-3 py-2 text-[0.9375rem] text-tinta transition-colors duration-150 " +
  "placeholder:text-[var(--tinta-fraca)] " +
  "hover:border-[var(--tinta-fraca)] " +
  "focus:border-oliva focus:bg-white focus:outline-none " +
  "disabled:opacity-55 disabled:cursor-not-allowed";

function RotuloCampo({
  htmlFor,
  children,
  obrigatorio,
}: {
  htmlFor?: string;
  children: ReactNode;
  obrigatorio?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--tinta-suave)]"
    >
      {children}
      {obrigatorio ? <span className="ml-1 text-dourado">*</span> : null}
    </label>
  );
}

export interface CampoProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  ajuda?: string;
  erro?: string;
  obrigatorio?: boolean;
}

export function Campo({ label, ajuda, erro, obrigatorio, className, id, ...props }: CampoProps) {
  const campoId = id ?? props.name;
  return (
    <div className="w-full">
      <RotuloCampo htmlFor={campoId} obrigatorio={obrigatorio}>
        {label}
      </RotuloCampo>
      <input
        id={campoId}
        aria-invalid={erro ? true : undefined}
        aria-describedby={ajuda || erro ? `${campoId}-msg` : undefined}
        className={cn(baseCampo, erro && "border-red-700/60", className)}
        {...props}
      />
      {erro ? (
        <p id={`${campoId}-msg`} className="mt-1.5 text-[0.8125rem] text-red-800">
          {erro}
        </p>
      ) : ajuda ? (
        <p id={`${campoId}-msg`} className="mt-1.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
          {ajuda}
        </p>
      ) : null}
    </div>
  );
}

export interface CampoSelecaoProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  ajuda?: string;
  erro?: string;
  obrigatorio?: boolean;
  opcoes: ReadonlyArray<{ valor: string; texto: string }>;
}

export function CampoSelecao({
  label,
  ajuda,
  erro,
  obrigatorio,
  opcoes,
  className,
  id,
  ...props
}: CampoSelecaoProps) {
  const campoId = id ?? props.name;
  return (
    <div className="w-full">
      <RotuloCampo htmlFor={campoId} obrigatorio={obrigatorio}>
        {label}
      </RotuloCampo>
      <div className="relative">
        <select
          id={campoId}
          aria-invalid={erro ? true : undefined}
          className={cn(baseCampo, "cursor-pointer appearance-none pr-9", className)}
          {...props}
        >
          {opcoes.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.texto}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          width="11"
          height="7"
          viewBox="0 0 11 7"
          className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-[var(--tinta-suave)]"
        >
          <path
            d="M1 1.25 5.5 5.75 10 1.25"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {erro ? (
        <p className="mt-1.5 text-[0.8125rem] text-red-800">{erro}</p>
      ) : ajuda ? (
        <p className="mt-1.5 text-[0.8125rem] text-[var(--tinta-fraca)]">{ajuda}</p>
      ) : null}
    </div>
  );
}
