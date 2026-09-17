import Link from "next/link";
import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { Jornada } from "@/components/ui/jornada";
import { Dado, ListaDados } from "@/components/ui/dados";
import {
  ROTULO_MODALIDADE,
  ROTULO_PRIORIDADE,
  ROTULO_STATUS_ACAO,
  ROTULO_STATUS_CONSULTORIA,
  TOM_PRIORIDADE,
  TOM_STATUS_CONSULTORIA,
  contarAcoes,
  dataCurta,
} from "@/lib/dados";
import type { AcaoPlano, ClienteOperacao, Consultoria } from "@/lib/dados";

/**
 * ABA 3 — CONSULTORIA.
 *
 * O resumo do trabalho em andamento: em que ponto do método ela está, o que
 * foi combinado, e o plano de ação com os status.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AQUI O PLANO É SOMENTE LEITURA — E POR QUÊ                           │
 * │                                                                      │
 * │ Mover uma ação de "a fazer" para "concluído" parece um botão simples   │
 * │ de fazer. Mas o estado de uma ação não vive na tela: vive no registro  │
 * │ de onde a tela o leu. Sem banco, um clique que muda a tela e não      │
 * │ grava nada é a pior das opções — a consultora vê o item riscado,      │
 * │ fecha o navegador e ele volta. Ela perde a confiança no sistema        │
 * │ inteiro por causa de um botão.                                        │
 * │                                                                      │
 * │ Então esta aba mostra o plano e LEVA para a tela de consultoria, onde  │
 * │ a interação acontece com o aviso explícito de que nada é gravado.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AbaConsultoria({
  cliente,
  consultoria,
  acoes,
}: {
  cliente: ClienteOperacao;
  consultoria: Consultoria | null;
  acoes: readonly AcaoPlano[];
}) {
  if (!consultoria) {
    return (
      <EstadoVazio
        titulo="Nenhuma consultoria registrada para este cliente"
        descricao={
          cliente.situacao === "PAUSADO"
            ? "O atendimento deste cliente está pausado. As consultorias anteriores continuam no histórico quando existirem."
            : "Não há consultoria em andamento. Quando uma começar, o escopo combinado e o plano de ação aparecem aqui."
        }
        acao={
          <Link
            href="/consultorias"
            className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
          >
            Ver todas as consultorias
          </Link>
        }
      />
    );
  }

  const contagem = contarAcoes(acoes);
  const emAberto = acoes.filter((a) => a.status !== "CONCLUIDO");

  return (
    <div className="space-y-6">
      <Secao
        rotulo="Consultoria"
        titulo={consultoria.titulo}
        descricao="O escopo combinado com este cliente e o ponto em que o método está."
        acoes={
          <div className="flex items-center gap-2.5">
            <Etiqueta tom={TOM_STATUS_CONSULTORIA[consultoria.status]}>
              {ROTULO_STATUS_CONSULTORIA[consultoria.status]}
            </Etiqueta>
            <Link
              href={`/consultorias/${consultoria.id}`}
              className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
            >
              Abrir consultoria
            </Link>
          </div>
        }
      >
        <ListaDados colunas={3}>
          <Dado rotulo="Início">{dataCurta(consultoria.iniciadaEm)}</Dado>
          <Dado rotulo="Modalidade">{ROTULO_MODALIDADE[consultoria.modalidade]}</Dado>
          <Dado rotulo="Último acompanhamento">
            {consultoria.ultimoAcompanhamentoEm
              ? dataCurta(consultoria.ultimoAcompanhamentoEm)
              : "Nenhum registrado"}
          </Dado>
          <Dado rotulo="Próxima ação" largo>
            {consultoria.proximaAcao}
            {consultoria.proximaAcaoEm ? (
              <span className="ml-2 text-[0.8125rem] text-[var(--tinta-fraca)]">
                · prevista para {dataCurta(consultoria.proximaAcaoEm)}
              </span>
            ) : null}
          </Dado>
        </ListaDados>

        {consultoria.escopo.length > 0 ? (
          <div className="mt-6 border-t border-[var(--linha)] pt-5">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Escopo combinado
            </p>
            <ul className="mt-3 space-y-2.5">
              {consultoria.escopo.map((linha) => (
                <li key={linha} className="flex gap-3 text-[0.9375rem] leading-relaxed">
                  <span aria-hidden className="mt-2.5 h-px w-3.5 shrink-0 bg-oliva" />
                  <span className="text-[var(--tinta-suave)]">{linha}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Secao>

      <Secao
        rotulo="Método"
        titulo="Onde o trabalho está"
        descricao="As sete etapas, com o estado de cada uma. Não há percentual geral porque somar etapas de naturezas diferentes exigiria atribuir peso a cada uma."
      >
        <Jornada etapas={consultoria.jornada} />
      </Secao>

      <Secao
        rotulo="Plano de ação"
        titulo={
          contagem.total === 0
            ? "Nenhuma ação registrada"
            : `${contagem.concluidas} de ${contagem.total} concluídas`
        }
        descricao="O que foi combinado, com responsável, prioridade e prazo. Para mover uma ação de status, abra a consultoria — aqui o plano é leitura."
        acoes={
          <span className="text-[0.75rem] text-[var(--tinta-fraca)]">
            {contagem.emAndamento} em andamento · {contagem.aguardandoCliente} aguardando cliente ·{" "}
            {contagem.aFazer} a fazer
          </span>
        }
      >
        {acoes.length === 0 ? (
          <EstadoVazio
            titulo="O plano ainda não foi montado"
            descricao="As ações combinadas com o cliente aparecem aqui. O plano é escrito na tela da consultoria."
          />
        ) : (
          <ul className="divide-y divide-[var(--linha)]">
            {acoes.map((a) => (
              <li key={a.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                  <div className="min-w-0 flex-1">
                    <p
                      className={
                        "text-[0.9375rem] leading-snug " +
                        (a.status === "CONCLUIDO"
                          ? "text-[var(--tinta-fraca)] line-through decoration-[var(--linha-forte)]"
                          : "font-medium text-tinta")
                      }
                    >
                      {a.titulo}
                    </p>
                    <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                      {a.descricao}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Etiqueta tom={TOM_PRIORIDADE[a.prioridade]}>
                      {ROTULO_PRIORIDADE[a.prioridade]}
                    </Etiqueta>
                    <Etiqueta>{ROTULO_STATUS_ACAO[a.status]}</Etiqueta>
                  </div>
                </div>

                <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[0.8125rem]">
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-[var(--tinta-fraca)]">Responsável</dt>
                    <dd className="text-[var(--tinta-suave)]">{a.responsavel}</dd>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <dt className="text-[var(--tinta-fraca)]">Prazo</dt>
                    <dd className="tabular text-[var(--tinta-suave)]">
                      {a.prazo ? dataCurta(a.prazo) : "sem prazo"}
                    </dd>
                  </div>
                </dl>

                {a.observacao ? (
                  <p className="mt-2.5 border-l-2 border-l-[var(--linha-forte)] pl-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
                    {a.observacao}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {emAberto.length > 0 ? (
          <p className="mt-5 border-t border-[var(--linha)] pt-4 text-[0.8125rem] text-[var(--tinta-fraca)]">
            {emAberto.length === 1
              ? "1 ação ainda em aberto."
              : `${emAberto.length} ações ainda em aberto.`}{" "}
            Mover o status acontece na tela da consultoria — é lá que a
            demonstração mostra que a alteração não é gravada.
          </p>
        ) : null}
      </Secao>
    </div>
  );
}
