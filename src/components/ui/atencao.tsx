import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { desdeQuando } from "@/lib/dados";
import { rotuloAtencao } from "@/lib/dados";
import type { ItemAtencao, TipoAtencao } from "@/lib/dados";

/**
 * "PRECISA DA SUA ATENÇÃO".
 *
 * Uma linha por pendência, sempre com dois elementos: o que travou e o
 * caminho para destravar. Um item de atenção sem link é só preocupação — e
 * uma tela que lista preocupações sem saída é pior do que não listar nada.
 *
 * A ordem não é por data. É por TIPO, e por um critério que interessa à
 * consultora: o que já travou o trabalho dela vem antes do que ainda é só
 * uma chegada. Um diagnóstico novo pode esperar uma hora; um cliente
 * parado há duas semanas, não.
 *
 * O TOM NÃO É GRAVIDADE DO CLIENTE. "Aguardando cliente" em dourado não diz
 * que o cliente é ruim — diz que o próximo passo não é dela. Nenhum tom
 * aqui é julgamento sobre pessoa ou negócio.
 */

const TOM_ATENCAO: Record<TipoAtencao, "atencao" | "critico" | "neutro"> = {
  ACOMPANHAMENTO_PENDENTE: "critico",
  INFORMACAO_AGUARDANDO_CLIENTE: "atencao",
  DIAGNOSTICO_NAO_LIDO: "atencao",
  FICHA_AGUARDANDO_DADOS: "neutro",
  PROCESSO_AGUARDANDO_REVISAO: "neutro",
};

const BORDA: Record<"atencao" | "critico" | "neutro", string> = {
  critico: "border-l-red-800",
  atencao: "border-l-dourado",
  neutro: "border-l-[var(--linha-forte)]",
};

export function ListaAtencao({
  itens,
  maximo,
  vazio,
  className,
}: {
  itens: readonly ItemAtencao[];
  /** Corte para os blocos resumidos do dashboard. */
  maximo?: number;
  vazio?: React.ReactNode;
  className?: string;
}) {
  if (itens.length === 0) return <>{vazio ?? null}</>;

  const mostrados = maximo ? itens.slice(0, maximo) : itens;
  const restantes = itens.length - mostrados.length;

  return (
    <div className={className}>
      <ul className="space-y-2.5">
        {mostrados.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={cn(
                "block rounded-[var(--raio)] border border-[var(--linha)] border-l-2 bg-white/55",
                "px-4 py-3 transition-colors duration-150 hover:border-[var(--linha-forte)] hover:bg-white",
                BORDA[TOM_ATENCAO[item.tipo]]
              )}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-[0.625rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                  {rotuloAtencao(item.tipo)}
                </span>
                <span className="text-[0.75rem] text-[var(--tinta-fraca)]">
                  {desdeQuando(item.desde)}
                </span>
              </div>
              <p className="mt-1.5 text-[0.9375rem] leading-snug font-medium text-tinta">
                {item.titulo}
              </p>
              <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                {item.detalhe}
              </p>
            </Link>
          </li>
        ))}
      </ul>

      {restantes > 0 ? (
        <p className="mt-3 text-[0.8125rem] text-[var(--tinta-fraca)]">
          e mais {restantes} {restantes === 1 ? "item" : "itens"}.
        </p>
      ) : null}
    </div>
  );
}

/**
 * Contagem discreta por tipo — usada no cabeçalho do bloco.
 * É contagem, não nota: cada número se confere contra a lista abaixo.
 */
export function ResumoAtencao({ itens }: { itens: readonly ItemAtencao[] }) {
  const porTipo = new Map<TipoAtencao, number>();
  for (const i of itens) porTipo.set(i.tipo, (porTipo.get(i.tipo) ?? 0) + 1);

  if (porTipo.size === 0) return null;

  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.75rem] text-[var(--tinta-suave)]">
      {[...porTipo.entries()].map(([tipo, n]) => (
        <li key={tipo} className="flex items-baseline gap-1.5">
          <span className="tabular font-semibold text-tinta">{n}</span>
          <span>{rotuloAtencao(tipo).toLowerCase()}</span>
        </li>
      ))}
    </ul>
  );
}
