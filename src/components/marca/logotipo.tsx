import { cn } from "@/lib/utils/cn";

/**
 * Marca do sistema.
 *
 * Composta tipograficamente com as fontes reais da marca —
 * Fraunces para "ÉRIKA BRUNA" e a assinatura manuscrita herdada do
 * wordmark. Não usa os arquivos de imagem do site: evita duplicar
 * binário entre dois projetos e não deforma o logo em tamanho de barra
 * de ferramenta.
 *
 * Se a Érika preferir o logo original, é aqui que ele entra — em um
 * arquivo só.
 */
export function Logotipo({
  className,
  escuro = false,
}: {
  className?: string;
  escuro?: boolean;
}) {
  return (
    <span className={cn("flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-display text-[0.9375rem] font-semibold tracking-[0.16em] uppercase",
          escuro ? "text-off" : "text-tinta"
        )}
      >
        Érika Bruna
      </span>
      <span
        className={cn(
          "mt-1 font-texto text-[0.5625rem] font-semibold tracking-[0.24em] uppercase",
          escuro ? "text-oliva-palha" : "text-oliva"
        )}
      >
        Gestão de Consultoria
      </span>
    </span>
  );
}

/**
 * Monograma EB — usado no estado recolhido da barra lateral e no
 * ícone do aplicativo. Canto quase reto, como o resto da marca.
 */
export function Monograma({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--raio-sm)] " +
          "bg-profundo text-off",
        className
      )}
    >
      <span className="font-display text-[0.8125rem] font-semibold tracking-[0.04em]">
        EB
      </span>
    </span>
  );
}
