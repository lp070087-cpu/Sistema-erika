import { cn } from "@/lib/utils/cn";

/**
 * FAIXA DE DEMONSTRAÇÃO.
 *
 * Aparece em toda tela que exibe dado que não é real.
 *
 * Ela existe porque a alternativa é pior nos dois sentidos: uma tela com
 * dado falso e sem aviso é mentira; uma tela sem dado nenhum não pode ser
 * avaliada. A faixa resolve os dois — a tela funciona, e ninguém confunde
 * o que está vendo com a operação real da consultora.
 *
 * É deliberadamente discreta e sempre no mesmo lugar: abaixo do título,
 * antes do primeiro número. Quem lê a tela de cima para baixo encontra o
 * aviso antes de encontrar o dado.
 */
export function FaixaDemonstracao({
  oQue,
  className,
}: {
  /** O que, exatamente, é de demonstração. Evita o aviso genérico. */
  oQue?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-[var(--raio-sm)] " +
          "border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.09)] px-3 py-2",
        className
      )}
      role="note"
    >
      <span
        className={
          "shrink-0 rounded-[2px] border border-dourado/70 px-1.5 py-0.5 " +
          "text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-[#8a6d1f]"
        }
      >
        Demonstração
      </span>
      <span className="text-[0.8125rem] leading-snug text-[var(--tinta-suave)]">
        {oQue ??
          "Os dados desta tela são inventados para demonstração. Nada aqui é real e nenhuma resposta veio de cliente."}
      </span>
    </div>
  );
}
