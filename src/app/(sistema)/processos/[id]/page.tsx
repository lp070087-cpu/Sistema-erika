import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, Painel, Secao } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import {
  ROTULO_MODALIDADE,
  obterRepositorioOperacao,
  passosSemTempo,
  somaDosTemposDeclarados,
} from "@/lib/dados";

export const metadata: Metadata = { title: "Processo" };

/**
 * DETALHE DO PROCESSO — a sequência de finalização, passo a passo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A SEQUÊNCIA É NUMERADA E IMPRESSA                             │
 * │                                                                      │
 * │ A ordem dos passos é o documento inteiro. Quando ela existe só na    │
 * │ cabeça de quem monta, o prato muda de acordo com quem está no passe   │
 * │ — e a variação de porção come a margem sem aparecer em relatório      │
 * │ nenhum.                                                              │
 * │                                                                      │
 * │ Por isso o passo aparece com número grande, descrição e responsável   │
 * │ na mesma linha visual: é o que se lê no passe, de longe, com a mão    │
 * │ ocupada.                                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ OS PASSOS SEM TEMPO APARECEM, MAS MARCADOS                             │
 * │                                                                      │
 * │ A tentação seria esconder o passo sem tempo ou preencher com uma      │
 * │ média. As duas coisas seriam mentira: esconder some com um passo que  │
 * │ a equipe executa, e a média inventa um número que ninguém declarou.   │
 * │                                                                      │
 * │ O passo fica na lista, na ordem dele, com "tempo não declarado". É     │
 * │ assim que a consultora sabe o que ainda precisa perguntar.            │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = { params: Promise<{ id: string }> };

export default async function PaginaProcesso({ params }: Props) {
  const { id } = await params;
  const operacao = obterRepositorioOperacao();

  const processo = await operacao.obterProcesso(id);
  if (!processo) notFound();

  const cliente = await operacao.obterCliente(processo.clienteId);

  const semTempo = passosSemTempo(processo);
  const total = processo.passos.length;
  const tempoTotal = somaDosTemposDeclarados(processo, "todos");

  // Quem aparece como responsável, sem repetir e sem inventar hierarquia:
  // a ordem é a de aparição nos passos.
  const responsaveis = [...new Set(processo.passos.map((p) => p.responsavel))];

  return (
    <div className="space-y-6">
      <Link
        href="/processos"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para os processos
      </Link>

      <CabecalhoPagina
        rotulo={cliente ? cliente.nomeFantasia : "Cliente não identificado"}
        titulo={processo.praca}
        descricao={processo.turno}
        acoes={
          <div className="flex flex-wrap items-center gap-2">
            <Etiqueta>{total} {total === 1 ? "passo" : "passos"}</Etiqueta>
            {semTempo > 0 ? (
              <Etiqueta tom="dourado">{semTempo} sem tempo</Etiqueta>
            ) : (
              <Etiqueta tom="verde">todos com tempo</Etiqueta>
            )}
          </div>
        }
      />

      <FaixaDemonstracao oQue="Esta praça, seus passos e os tempos declarados são inventados para demonstração. Nenhum número aqui foi medido pelo sistema." />

      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        <ListaDados colunas={3}>
          <Dado rotulo="Praça">{processo.praca}</Dado>
          <Dado rotulo="Turno">{processo.turno}</Dado>
          <Dado rotulo="Responsável pela praça">{processo.responsavel}</Dado>
          {cliente ? (
            <>
              <Dado rotulo="Cliente">
                <Link href={`/clientes/${cliente.id}`} className="text-oliva hover:underline">
                  {cliente.nomeFantasia}
                </Link>
              </Dado>
              <Dado rotulo="Modalidade do atendimento">
                {ROTULO_MODALIDADE[cliente.modalidade]}
              </Dado>
            </>
          ) : null}
          <Dado rotulo="Tempo declarado no total">
            {tempoTotal === null ? (
              <span className="text-[var(--tinta-fraca)]">nenhum passo com tempo</span>
            ) : (
              `${tempoTotal} min`
            )}
          </Dado>
        </ListaDados>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        {/* A SEQUÊNCIA --------------------------------------------------- */}
        <Secao
          rotulo="Sequência de finalização"
          titulo="A ordem em que o prato é montado"
          descricao="Escrita como a equipe executa, não como deveria ser. Cada passo diz o que fazer, quem faz e quanto tempo foi declarado."
        >
          {total === 0 ? (
            <p className="text-[0.875rem] text-[var(--tinta-suave)]">
              Esta praça ainda não tem passos escritos.
            </p>
          ) : (
            <ol className="space-y-0">
              {processo.passos.map((passo, i) => {
                const ultimo = i === total - 1;
                return (
                  <li key={passo.ordem} className="flex gap-4">
                    {/* Coluna do número + trilha */}
                    <div className="flex w-9 shrink-0 flex-col items-center">
                      <span className="flex h-9 w-9 items-center justify-center rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 text-[0.75rem] font-semibold text-tinta tabular">
                        {String(passo.ordem).padStart(2, "0")}
                      </span>
                      {!ultimo ? (
                        <span aria-hidden className="mt-1 w-px flex-1 bg-[var(--linha)]" />
                      ) : null}
                    </div>

                    <div className={ultimo ? "min-w-0 flex-1" : "min-w-0 flex-1 pb-5"}>
                      <p className="text-[0.9375rem] leading-relaxed text-tinta">
                        {passo.descricao}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <span className="text-[0.8125rem] text-[var(--tinta-suave)]">
                          {passo.responsavel}
                        </span>
                        {passo.tempoEstimadoMin === null ? (
                          <span className="text-[0.8125rem] text-[#8a6d1f]">
                            tempo não declarado
                          </span>
                        ) : (
                          <span className="tabular text-[0.8125rem] text-[var(--tinta-suave)]">
                            {passo.tempoEstimadoMin} min declarado(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Secao>

        {/* LADO: pratos, equipe, observações ---------------------------- */}
        <div className="space-y-6">
          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Pratos que passam por aqui
            </p>
            {processo.pratos.length === 0 ? (
              <p className="mt-2.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
                Nenhum prato associado ainda.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {processo.pratos.map((prato) => (
                  <li
                    key={prato}
                    className="border-l-2 border-l-[var(--linha-forte)] pl-3 text-[0.875rem] leading-snug text-[var(--tinta-suave)]"
                  >
                    {prato}
                  </li>
                ))}
              </ul>
            )}
          </Painel>

          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Quem executa
            </p>
            <ul className="mt-3 space-y-2">
              {responsaveis.map((r) => (
                <li key={r} className="text-[0.875rem] text-[var(--tinta-suave)]">
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
              A ordem é a de aparição nos passos. O sistema não define hierarquia
              nem atribui função a ninguém.
            </p>
          </Painel>
        </div>
      </div>

      {processo.observacoes ? (
        <Secao
          rotulo="Observações"
          titulo="O contexto deste fluxo"
          descricao="Escrito por ela, sobre como este processo foi mapeado."
        >
          <p className="max-w-[80ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
            {processo.observacoes}
          </p>
        </Secao>
      ) : null}

      {semTempo > 0 ? (
        <Aviso tom="atencao" titulo={`${semTempo} passo(s) sem tempo declarado`}>
          <p>
            A soma acima considera só os passos que têm tempo. O restante
            continua na lista, na ordem correta, esperando a equipe informar —
            porque um tempo médio inventado pelo sistema esconderia uma etapa
            que ninguém sabe dizer quanto leva.
          </p>
        </Aviso>
      ) : null}

      <Aviso tom="info" titulo="Este documento é para ficar afixado">
        <p>
          É assim que o padrão deixa de depender de quem está no turno. O
          sistema guarda a versão de leitura; levar ao passe, imprimir e
          treinar a equipe é trabalho da consultoria, presencial — e nenhuma
          etapa disso acontece sozinha.
        </p>
      </Aviso>
    </div>
  );
}
