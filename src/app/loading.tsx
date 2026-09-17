/**
 * Carregamento.
 *
 * Discreto e na cor da marca — não usa spinner genérico nem esqueleto
 * cinza de template. Como o sistema roda em servidor, a maior parte da
 * navegação é instantânea; isto cobre o caso das telas com dados.
 */
export default function Carregando() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-6">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-px w-8 animate-pulse bg-oliva"
          style={{ animationDuration: "1.2s" }}
        />
        <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.24em] text-[var(--tinta-fraca)]">
          Carregando
        </span>
      </div>
    </div>
  );
}
