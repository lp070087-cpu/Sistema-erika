import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina, Rotulo } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, EstadoVazio, Painel, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { ListaSinais } from "@/components/ui/sinais";
import {
  DETALHE_ORIGEM,
  ROTULO_ORIGEM,
  ROTULO_STATUS,
  TOM_STATUS,
  dataEHora,
  desdeQuando,
  obterRepositorio,
  sinaisEmTexto,
} from "@/lib/dados";
import {
  declaracaoPrincipal,
  obrigatoriasEmFalta,
  respostasPorBloco,
  textoDe,
} from "@/lib/dados/derivacoes";
import { ResumoDiagnostico } from "@/components/ui/resumo-diagnostico";
import { ConverterEmCliente } from "./converter";

export const metadata: Metadata = { title: "Lead" };

/**
 * DETALHE DO LEAD
 *
 * Uma tela só, com tudo que existe sobre esta pessoa: o contato, o que ela
 * declarou no diagnóstico, e o que a consultora anotou sobre ela.
 *
 * AS DUAS COLUNAS SÃO COISAS DIFERENTES
 *
 *   · O que o LEAD escreveu — pergunta 27 e as abertas 25 e 26. É a voz
 *     dele, transcrita, sem edição.
 *   · O que a CONSULTORA escreveu — as observações internas. É leitura
 *     profissional, não sai daqui e não vai para o cliente.
 *
 * Misturar as duas numa lista só de "comentários" seria perder a distinção
 * entre o que a pessoa disse e o que a consultora concluiu — que é
 * exatamente a distinção que faz um diagnóstico ser útil.
 *
 * O BLOCO DE OBSERVAÇÕES ESTÁ PREPARADO, NÃO LIGADO. A caixa de escrita
 * existe para a tela poder ser avaliada; gravar depende do banco. O
 * componente deixa isso explícito em vez de aceitar texto e descartar em
 * silêncio, que seria a pior das opções.
 */
type Props = { params: Promise<{ id: string }> };

export default async function PaginaLead({ params }: Props) {
  const { id } = await params;
  const repo = obterRepositorio();

  const lead = await repo.obterLead(id);
  if (!lead) notFound();

  const [diagnostico, observacoes] = await Promise.all([
    repo.obterDiagnosticoDoLead(lead.id),
    repo.listarObservacoes(lead.id),
  ]);

  const sinais = diagnostico ? sinaisEmTexto(diagnostico) : [];
  const faltando = diagnostico ? obrigatoriasEmFalta(diagnostico) : 0;
  const blocos = diagnostico ? respostasPorBloco(diagnostico) : [];

  /**
   * O que a conversão em cliente aproveita do diagnóstico.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ POR QUE ESTA LISTA É CURTA                                        │
   * │                                                                    │
   * │ Poderiam entrar aqui quinze respostas. Não entram — porque um      │
   * │ cadastro preenchido com quinze campos herdados vira uma ficha que  │
   * │ ninguém conferiu, e um dado errado no cadastro é mais caro do que  │
   * │ um campo vazio.                                                    │
   * │                                                                    │
   * │ Entram só as respostas que já são, literalmente, o cadastro: o     │
   * │ número de funcionários e o maior problema declarado. O resto       │
   * │ continua no diagnóstico, a um clique de distância, na aba que já   │
   * │ existe para isso.                                                  │
   * │                                                                    │
   * │ Os valores vêm de `textoDe`, que lê o rótulo da opção escolhida —  │
   * │ não o código do enum. Ninguém deveria ler "CINCO_A_DEZ" numa tela. │
   * └────────────────────────────────────────────────────────────────────┘
   */
  const herdados = diagnostico
    ? [
        { rotulo: "Equipe declarada", valor: textoDe(diagnostico, "numero-funcionarios") },
        { rotulo: "Turnos de funcionamento", valor: textoDe(diagnostico, "turnos") },
      ].filter((h) => h.valor.length > 0)
    : [];

  const problemaDeclarado = diagnostico ? declaracaoPrincipal(diagnostico) : null;

  // A origem já vem com a explicação junto — ver a nota em formato.ts sobre
  // por que esta frase é um mapa e não um `if` escrito nesta tela.
  const detalheOrigem = DETALHE_ORIGEM[lead.origem];

  return (
    <div className="space-y-6">
      {/* Voltar — a fila é o ponto de partida desta tela. */}
      <Link
        href="/leads"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para a fila de leads
      </Link>

      <CabecalhoPagina
        rotulo={ROTULO_ORIGEM[lead.origem]}
        titulo={lead.nomeFantasia}
        descricao={lead.sinal}
        acoes={
          <div className="flex flex-wrap items-center gap-3">
            <Etiqueta tom={TOM_STATUS[lead.status]}>{ROTULO_STATUS[lead.status]}</Etiqueta>
            {/* A conversão fica no cabeçalho porque é a decisão que esta tela
                existe para apoiar: lido o diagnóstico, o próximo passo é
                decidir se vira cliente. */}
            {lead.clienteId === null ? (
              <ConverterEmCliente
                lead={lead}
                problemaDeclarado={problemaDeclarado}
                herdados={herdados}
              />
            ) : (
              <BotaoLink
                href={`/clientes/${lead.clienteId}`}
                variante="secundario"
                tamanho="md"
              >
                Ver cliente
              </BotaoLink>
            )}
          </div>
        }
      />

      {/* Cabeçalho de contato --------------------------------------------- */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="space-y-6">
          {/* Sinais objetivos ------------------------------------------- */}
          <Secao
            rotulo="O que a pessoa declarou"
            titulo="Pontos objetivos do diagnóstico"
            descricao="Cada item é a resposta literal dela traduzida para linguagem de operação. Nenhum deles é nota, peso ou classificação — a ordem é a do formulário."
          >
            {sinais.length > 0 ? (
              <ListaSinais sinais={sinais} />
            ) : (
              <p className="text-[0.875rem] text-[var(--tinta-suave)]">
                {diagnostico
                  ? "Nenhum ponto objetivo foi declarado neste diagnóstico."
                  : "Este lead ainda não tem diagnóstico vinculado."}
              </p>
            )}
          </Secao>

          {/* Respostas completas ---------------------------------------- */}
          {diagnostico ? (
            <>
              <ResumoDiagnostico blocos={blocos} />

              <div className="flex flex-wrap gap-3">
                <BotaoLink
                  href={`/diagnosticos/${diagnostico.id}`}
                  variante="secundario"
                  tamanho="sm"
                >
                  Abrir o diagnóstico completo
                </BotaoLink>
              </div>
            </>
          ) : (
            <EstadoVazio
              titulo="Sem diagnóstico vinculado"
              descricao="Este lead entrou por outro caminho. Quando houver um diagnóstico, as respostas aparecem aqui agrupadas por bloco."
            />
          )}

          {/* Histórico --------------------------------------------------- */}
          {/*
            O HISTÓRICO É MONTADO, NÃO INVENTADO.

            Cada linha abaixo é um fato que já está nesta página: a data de
            entrada, a data em que o diagnóstico foi respondido, e cada
            observação que a consultora escreveu. Nada aqui é uma suposição
            sobre o que aconteceu entre um evento e outro — não existe
            registro disso, e preencher a lacuna com "possivelmente entrou em
            contato" seria escrever história.

            É por isso que o histórico tem três linhas e não quinze. Quando o
            sistema gravar, cada mudança de status vira uma linha aqui
            sozinha.
          */}
          <Secao
            rotulo="Histórico"
            titulo="O que aconteceu com este lead"
            descricao="Só o que está registrado. Mudanças de status passam a aparecer aqui quando o sistema gravar em banco."
          >
            <ol className="space-y-0">
              {[
                {
                  id: "entrada",
                  texto: `Lead entrou pelo canal “${ROTULO_ORIGEM[lead.origem]}”.`,
                  quando: lead.criadoEm,
                  autor: lead.nomeContato,
                },
                ...(diagnostico
                  ? [
                      {
                        id: "diagnostico",
                        texto:
                          "Diagnóstico respondido: " +
                          `${diagnostico.respostas.length} respostas registradas.`,
                        quando: diagnostico.respondidoEm,
                        autor: lead.nomeContato,
                      },
                    ]
                  : []),
                ...observacoes.map((o) => ({
                  id: o.id,
                  texto: o.texto,
                  quando: o.criadoEm,
                  autor: o.autor,
                })),
              ]
                .sort((a, b) => a.quando.getTime() - b.quando.getTime())
                .map((evento, i, lista) => (
                  <li key={evento.id} className="flex gap-4">
                    <div className="flex flex-col items-center pt-1.5">
                      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-oliva" />
                      {i < lista.length - 1 ? (
                        <span aria-hidden className="mt-1 w-px flex-1 bg-[var(--linha)]" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 pb-4">
                      <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                        {evento.texto}
                      </p>
                      <p className="mt-1.5 text-[0.75rem] text-[var(--tinta-fraca)]">
                        {dataEHora(evento.quando)} · {evento.autor}
                      </p>
                    </div>
                  </li>
                ))}
            </ol>
          </Secao>
        </div>

        {/* Coluna lateral ---------------------------------------------- */}
        <div className="space-y-4">
          {/* Contato --------------------------------------------------- */}
          <Secao rotulo="Contato">
            <dl className="space-y-3.5">
              {[
                ["Nome", lead.nomeContato],
                ["E-mail", lead.email],
                ["WhatsApp", lead.whatsapp],
                ["Recebido em", dataEHora(lead.criadoEm)],
                ["Há quanto tempo", desdeQuando(lead.criadoEm)],
              ].map(([rotulo, valor]) => (
                <div key={rotulo}>
                  <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--tinta-fraca)]">
                    {rotulo}
                  </dt>
                  <dd className="mt-0.5 break-words text-[0.875rem] text-tinta">{valor}</dd>
                </div>
              ))}
            </dl>
          </Secao>

          {/* Origem do lead -------------------------------------------- */}
          {/*
            A origem vem com a frase, não só com o nome do canal. "Instagram"
            sozinho não diz nada que a consultora já não saiba — o que ela
            precisa lembrar é se aquele contato chegou sozinho ou se foi ela
            que cadastrou, porque isso muda quem deve o próximo passo.
            A frase é a mesma da fila: vem de DETALHE_ORIGEM.
          */}
          <Secao rotulo="Origem do lead">
            <div className="flex items-center gap-2.5">
              <Etiqueta tom={detalheOrigem.automatica ? "oliva" : "neutro"}>
                {ROTULO_ORIGEM[lead.origem]}
              </Etiqueta>
              <span className="text-[0.75rem] uppercase tracking-[0.12em] text-[var(--tinta-fraca)]">
                {detalheOrigem.automatica ? "Chegou sozinho" : "Cadastrado à mão"}
              </span>
            </div>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              {detalheOrigem.como}
            </p>
          </Secao>

          {/* Diagnóstico relacionado ------------------------------------ */}
          <Secao rotulo="Diagnóstico relacionado">
            {diagnostico ? (
              <>
                <dl className="space-y-3.5">
                  <div>
                    <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--tinta-fraca)]">
                      Respondido em
                    </dt>
                    <dd className="mt-0.5 text-[0.875rem] text-tinta tabular">
                      {dataEHora(diagnostico.respondidoEm)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--tinta-fraca)]">
                      Respostas registradas
                    </dt>
                    <dd className="mt-0.5 text-[0.875rem] text-tinta tabular">
                      {diagnostico.respostas.length}
                    </dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <BotaoLink
                    href={`/diagnosticos/${diagnostico.id}`}
                    variante="secundario"
                    tamanho="sm"
                    className="w-full justify-center"
                  >
                    Abrir o diagnóstico
                  </BotaoLink>
                </div>
              </>
            ) : (
              <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                Este lead entrou por outro caminho e não tem diagnóstico
                vinculado. O contato foi registrado à mão, sem formulário
                respondido.
              </p>
            )}
          </Secao>

          {/* Próximo passo --------------------------------------------- */}
          <Secao rotulo="Próximo passo">
            {lead.proximoPasso ? (
              <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                {lead.proximoPasso}
              </p>
            ) : (
              <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-fraca)]">
                Nenhum próximo passo definido ainda. É a primeira coisa a
                decidir depois de ler o diagnóstico.
              </p>
            )}
          </Secao>

          {/* Integridade do diagnóstico -------------------------------- */}
          {diagnostico ? (
            <Painel>
              <Rotulo>Integridade das respostas</Rotulo>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                {faltando === 0 ? (
                  <>
                    Todas as perguntas obrigatórias foram respondidas. São{" "}
                    <span className="tabular">29</span> itens no total.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-tinta tabular">{faltando}</span>{" "}
                    {faltando === 1 ? "pergunta obrigatória ficou" : "perguntas obrigatórias ficaram"}{" "}
                    sem resposta. A leitura abaixo considera o que existe.
                  </>
                )}
              </p>
              <Aviso tom="info" className="mt-4">
                <p>
                  O formulário atual tem mais perguntas do que as{" "}
                  <span className="tabular">29</span> transcritas. O material
                  de origem registra <span className="tabular">33</span> — as
                  finais não foram lidas, e a pergunta 17 teve as opções
                  reconstruídas porque o print está cortado.
                </p>
              </Aviso>
            </Painel>
          ) : null}
        </div>
      </div>

      {/* Observações internas --------------------------------------------- */}
      <Secao
        rotulo="Observações internas"
        titulo="O que você anotou sobre este lead"
        descricao="Anotações de trabalho. Diferente do que a pessoa escreveu no formulário — isto aqui não sai do sistema e não é enviado a ninguém."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
          {/* Histórico ------------------------------------------------- */}
          <div>
            {observacoes.length === 0 ? (
              <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                Nenhuma observação registrada ainda.
              </p>
            ) : (
              <ol className="space-y-0">
                {observacoes.map((o, i) => (
                  <li key={o.id} className="flex gap-4">
                    <div className="flex flex-col items-center pt-1.5">
                      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-oliva" />
                      {i < observacoes.length - 1 ? (
                        <span aria-hidden className="mt-1 w-px flex-1 bg-[var(--linha)]" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 pb-4">
                      <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                        {o.texto}
                      </p>
                      <p className="mt-1.5 text-[0.75rem] text-[var(--tinta-fraca)]">
                        {o.autor} · {desdeQuando(o.criadoEm)} · {dataEHora(o.criadoEm)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Escrita --------------------------------------------------- */}
          <div>
            <label
              htmlFor="nova-observacao"
              className="mb-1.5 block text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--tinta-suave)]"
            >
              Nova observação
            </label>
            <textarea
              id="nova-observacao"
              rows={5}
              disabled
              aria-describedby="observacao-aviso"
              placeholder="Anotação interna sobre este lead…"
              className={
                "w-full resize-y rounded-[var(--raio-sm)] border border-[var(--linha-forte)] " +
                "bg-[rgba(242,236,226,0.5)] px-3 py-2 text-[0.9375rem] text-tinta " +
                "placeholder:text-[var(--tinta-fraca)] disabled:cursor-not-allowed disabled:opacity-70"
              }
            />
            <p id="observacao-aviso" className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
              O campo está desabilitado porque o sistema ainda não grava em
              banco. Aceitar o texto e descartá-lo em silêncio seria pior do
              que não aceitar — a anotação some e parece que foi salva.
            </p>
          </div>
        </div>
      </Secao>
    </div>
  );
}
