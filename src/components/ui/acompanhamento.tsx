import type { ReactNode } from "react";
import Link from "next/link";
import { Etiqueta } from "./indicador";
import { ROTULO_MODALIDADE, ROTULO_TIPO_ACOMPANHAMENTO, dataCurta, desdeQuando } from "@/lib/dados";
import type { Acompanhamento } from "@/lib/dados";

/**
 * CARTAO DE ACOMPANHAMENTO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE VIROU COMPONENTE                                             │
 * │                                                                      │
 * │ O mesmo registro aparece em três lugares: na aba Acompanhamentos do   │
 * │ cliente, na lista geral de /acompanhamentos, e no detalhe de uma      │
 * │ consultoria. São a mesma coisa lida de ângulos diferentes — o que     │
 * │ muda é o que cada tela já sabe e não precisa repetir.                 │
 * │                                                                      │
 * │ Por isso o cartão aceita `contexto`: a lista geral passa o nome do    │
 * │ cliente, a aba do cliente passa vazio. Sem isso, ou o cartão mostra   │
 * │ "Empório Verde" três vezes na mesma tela, ou o componente se         │
 * │ multiplica em três parecidos com uma linha de diferença.              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ PENDÊNCIAS E PRÓXIMA AÇÃO FICAM SEPARADAS DO RESUMO                  │
 * │                                                                      │
 * │ O resumo é o que ACONTECEU. As pendências são o que FICOU ABERTO. A   │
 * │ próxima ação é o que VAI acontecer. Os três costumam vir num bloco    │
 * │ só de texto corrido — e aí, na semana seguinte, ninguém sabe o que    │
 * │ já foi resolvido e o que continua pendente.                          │
 * │                                                                      │
 * │ Separados, a releitura leva segundos: ela bate o olho nas pendências  │
 * │ do último encontro antes de entrar na próxima reunião.                │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function CartaoAcompanhamento({
  acompanhamento,
  contexto,
  destaque = false,
}: {
  acompanhamento: Acompanhamento;
  /** Linha de contexto — normalmente o cliente. Vazio quando já é óbvio. */
  contexto?: ReactNode;
  /** Marca visualmente o mais recente da lista. */
  destaque?: boolean;
}) {
  const a = acompanhamento;

  return (
    <li
      className={
        "rounded-[var(--raio)] border border-[var(--linha)] px-5 py-4 " +
        (destaque ? "border-l-2 border-l-oliva bg-white/60" : "bg-[var(--superficie)]")
      }
    >
      <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <Etiqueta tom={a.tipo === "VISITA" ? "oliva" : "neutro"}>
              {ROTULO_TIPO_ACOMPANHAMENTO[a.tipo]}
            </Etiqueta>
            <span className="text-[0.75rem] text-[var(--tinta-fraca)]">
              {ROTULO_MODALIDADE[a.modalidade]}
            </span>
            {contexto ? (
              <span className="text-[0.75rem] text-[var(--tinta-fraca)]">{contexto}</span>
            ) : null}
          </div>
          <h3 className="mt-2 text-[1rem] leading-snug">{a.titulo}</h3>
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular text-[0.875rem] text-tinta">{dataCurta(a.data)}</p>
          <p className="mt-0.5 text-[0.75rem] text-[var(--tinta-fraca)]">
            {desdeQuando(a.data)}
          </p>
        </div>
      </div>

      <p className="mt-3.5 text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
        {a.resumo}
      </p>

      {a.pendencias.length > 0 ? (
        <div className="mt-4 rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[rgba(242,236,226,0.55)] px-4 py-3">
          <p className="text-[0.625rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            Ficou pendente
          </p>
          <ul className="mt-2 space-y-1.5">
            {a.pendencias.map((p) => (
              <li key={p} className="flex gap-2.5 text-[0.875rem] leading-relaxed">
                <span aria-hidden className="mt-2.5 h-px w-2.5 shrink-0 bg-dourado" />
                <span className="text-[var(--tinta-suave)]">{p}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {a.proximaAcao ? (
        <div className="mt-3.5 border-t border-[var(--linha)] pt-3">
          <p className="text-[0.625rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            Próximo passo
          </p>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-tinta">{a.proximaAcao}</p>
        </div>
      ) : null}
    </li>
  );
}

/**
 * O vínculo com a consultoria, para quando a lista geral precisa dele.
 * Fica aqui e não no cartão porque nem toda tela tem essa informação
 * carregada — e inventar um link para uma consultoria que a página não
 * buscou seria pior do que não ter link nenhum.
 */
export function VinculoConsultoria({ consultoriaId }: { consultoriaId: string }) {
  return (
    <Link
      href={`/consultorias/${consultoriaId}`}
      className="text-[0.75rem] text-oliva hover:underline"
    >
      ver consultoria
    </Link>
  );
}
