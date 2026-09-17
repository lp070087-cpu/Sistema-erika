import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { authConfigurado } from "@/lib/auth/config";
import { BotaoImprimir } from "@/components/imprimir/botao-imprimir";
import { MARCA_DESCRICAO, MARCA_NOME } from "@/lib/configuracao-publica";
import {
  ROTULO_MODALIDADE,
  ROTULO_SITUACAO_CLIENTE,
  ROTULO_STATUS_CONSULTORIA,
  ROTULO_TIPO_ACOMPANHAMENTO,
  ROTULO_TIPO_NEGOCIO,
  dataCurta,
  obterRepositorioOperacao,
} from "@/lib/dados";

export const metadata: Metadata = { title: "Relatório do cliente" };

/**
 * A PRÉVIA DO RELATÓRIO — a folha que a consultora entrega.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UMA ROTA, E NÃO UMA ABA                                │
 * │                                                                      │
 * │ Um relatório de consultoria é um documento. Ele tem cabeçalho,        │
 * │ margem, assinatura e folha própria. Se fosse uma aba dentro do        │
 * │ sistema, a impressão sairia com o menu lateral, o sino e a busca na   │
 * │ folha — e o cliente receberia um recorte do software em vez de um     │
 * │ trabalho.                                                            │
 * │                                                                      │
 * │ Rota própria resolve três coisas de uma vez: a impressão sai limpa,   │
 * │ a folha tem margem própria para papel, e o endereço pode ser aberto   │
 * │ direto para apresentar.                                               │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA DESTE ARQUIVO: NENHUM NÚMERO INVENTADO                        │
 * │                                                                      │
 * │ Um relatório é a tela mais perigosa do sistema, porque é onde um      │
 * │ número aparece sozinho, sem a interface em volta para explicá-lo.     │
 * │ Por isso toda seção que dependeria de metodologia diz do que ela      │
 * │ depende, e o que existe de fato é CONTADO, não estimado.              │
 * │                                                                      │
 * │ "Ações realizadas: 9 de 12" confere linha a linha.                    │
 * │ "Economia gerada: R$ 5.500" seria invenção. A diferença entre as duas │
 * │ é o que separa um relatório de um folheto.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O AVISO DE DEMONSTRAÇÃO ESTÁ **DENTRO** DO DOCUMENTO                  │
 * │                                                                      │
 * │ Não é firula. Esta folha é feita para ser impressa e entregue, e uma  │
 * │ folha impressa viaja sozinha: sai da mesa da consultora e chega na    │
 * │ mão de alguém que nunca viu a tela do sistema. Um aviso que ficasse   │
 * │ só na interface não chegaria junto com o papel.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export default async function PaginaImprimirRelatorio({
  params,
}: {
  params: Promise<{ clienteId: string }>;
}) {
  // Mesma guarda do grupo (sistema). Esta rota vive fora dele para não herdar
  // a casca com menu — e por isso precisa repetir a checagem: não herda nada.
  if (!authConfigurado()) redirect("/entrar");
  const sessao = await auth();
  if (!sessao?.user) redirect("/entrar");

  const { clienteId } = await params;
  const operacao = obterRepositorioOperacao();

  const cliente = await operacao.obterCliente(clienteId);
  if (!cliente) notFound();

  const [consultorias, fichas, processos, acompanhamentos, documentos, acoes, eventos] =
    await Promise.all([
      operacao.listarConsultorias(),
      operacao.listarFichasDoCliente(clienteId),
      operacao.listarProcessosDoCliente(clienteId),
      operacao.listarAcompanhamentosDoCliente(clienteId),
      operacao.listarDocumentosDoCliente(clienteId),
      operacao.listarAcoesDoCliente(clienteId),
      operacao.listarEventos(clienteId),
    ]);

  const consultoria = consultorias.find((c) => c.clienteId === clienteId) ?? null;

  const acoesConcluidas = acoes.filter((a) => a.status === "CONCLUIDO");
  const acoesAbertas = acoes.filter((a) => a.status !== "CONCLUIDO");
  const fichasCompletas = fichas.filter((f) => f.situacao === "COMPLETA");
  const fichasPendentes = fichas.filter((f) => f.situacao !== "COMPLETA");
  const acompanhamentosOrdenados = acompanhamentos
    .slice()
    .sort((a, b) => b.data.getTime() - a.data.getTime());

  // O período é DERIVADO do dado, não digitado: vai do início do contrato até
  // o evento mais recente. Escolher um período "bonito" seria decidir por ela.
  const inicio = consultoria?.iniciadaEm ?? cliente.iniciadoEm;
  const maisRecente = eventos.slice().sort((a, b) => b.em.getTime() - a.em.getTime())[0];
  const fim = maisRecente?.em ?? cliente.ultimaAtividadeEm;
  const periodo = `${dataCurta(inicio)} — ${dataCurta(fim)}`;

  return (
    <div className="min-h-screen bg-off text-tinta">
      {/* Barra de ação: NÃO imprime (`.nao-imprimir`). É o que permite gerar
          o PDF pelo navegador sem que o botão saia na folha. */}
      <div className="nao-imprimir sticky top-0 z-10 border-b border-[var(--linha)] bg-[var(--superficie-solida)]">
        <div className="conteudo flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
              Prévia do relatório
            </p>
            <p className="mt-0.5 truncate text-[0.875rem] text-[var(--tinta-suave)]">
              {cliente.nomeFantasia}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <BotaoImprimir />
            <Link
              href={`/clientes/${cliente.id}`}
              className="text-[0.8125rem] text-[var(--tinta-suave)] underline underline-offset-4 hover:text-tinta"
            >
              Voltar ao cliente
            </Link>
          </div>
        </div>
      </div>

      {/* ── A FOLHA ────────────────────────────────────────────────────── */}
      <article className="mx-auto w-full max-w-[820px] px-6 py-10 sm:px-8 sm:py-14">
        <header className="border-b-2 border-noite pb-6">
          <p className="assina text-[1.9rem] leading-none text-oliva">{MARCA_NOME}</p>
          <p className="mt-2 text-[0.6875rem] font-semibold tracking-[0.26em] text-[var(--tinta-fraca)] uppercase">
            {MARCA_DESCRICAO}
          </p>

          <dl className="mt-7 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            <Campo rotulo="Cliente" valor={cliente.nomeFantasia} destaque />
            <Campo rotulo="Responsável" valor={cliente.nomeContato} />
            <Campo rotulo="Período do acompanhamento" valor={periodo} />
            <Campo
              rotulo="Modalidade e situação"
              valor={`${ROTULO_MODALIDADE[consultoria?.modalidade ?? cliente.modalidade]} · ${ROTULO_STATUS_CONSULTORIA[consultoria?.status ?? "PLANEJAMENTO"]}`}
            />
          </dl>
        </header>

        <p className="mt-6 border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.09)] px-3.5 py-2.5 text-[0.75rem] leading-relaxed text-[var(--tinta-suave)]">
          <span className="font-semibold tracking-[0.1em] text-[#8a6d1f] uppercase">
            Demonstração ·{" "}
          </span>
          Este documento é um exemplo gerado com dados fictícios, para mostrar o
          formato de entrega. Os estabelecimentos citados não existem.
        </p>

        <Secao titulo="Cenário inicial">
          <p>
            O que o cliente declarou como principal problema:{" "}
            <span className="text-tinta">{cliente.problemaDeclarado}</span>
          </p>
          <dl className="mt-4 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            <ItemRotulo rotulo="Tipo de negócio" texto={ROTULO_TIPO_NEGOCIO[cliente.tipoNegocio]} />
            <ItemRotulo rotulo="Cidade" texto={cliente.cidade} />
            <ItemRotulo rotulo="Equipe" texto={`${cliente.funcionariosDeclarados} pessoas`} />
            <ItemRotulo rotulo="Situação atual" texto={ROTULO_SITUACAO_CLIENTE[cliente.situacao]} />
          </dl>
        </Secao>

        <Secao titulo="Objetivos">
          <p>
            <span className="text-[var(--tinta-fraca)]">Problema declarado: </span>
            {cliente.problemaDeclarado}
          </p>
          {consultoria && consultoria.escopo.length > 0 ? (
            <>
              <p className="mt-4 text-[var(--tinta-fraca)]">Escopo combinado:</p>
              <ul className="mt-2 space-y-1.5">
                {consultoria.escopo.map((linha) => (
                  <li key={linha} className="text-[0.9375rem] leading-relaxed">
                    {linha}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </Secao>

        <Secao
          titulo="Ações realizadas"
          contagem={`${acoesConcluidas.length} concluídas de ${acoes.length}`}
        >
          {acoes.length === 0 ? (
            <Ausente oQue="plano de ação registrado" />
          ) : (
            <ul className="space-y-2.5">
              {acoes.map((a) => (
                <li key={a.id} className="flex gap-3 text-[0.9375rem] leading-relaxed">
                  <span
                    aria-hidden
                    className={
                      "mt-2 h-1.5 w-1.5 shrink-0 rounded-full " +
                      (a.status === "CONCLUIDO" ? "bg-medio" : "bg-[var(--linha-forte)]")
                    }
                  />
                  <span className="min-w-0">
                    <span className={a.status === "CONCLUIDO" ? "" : "text-[var(--tinta-suave)]"}>
                      {a.titulo}
                    </span>
                    <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
                      {a.status === "CONCLUIDO"
                        ? "concluída"
                        : a.status === "AGUARDANDO_CLIENTE"
                          ? "aguardando retorno do cliente"
                          : "em aberto"}{" "}
                      · {a.responsavel}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {acoesAbertas.length > 0 ? (
            <p className="mt-4 border-t border-[var(--linha)] pt-3 text-[0.8125rem] text-[var(--tinta-suave)]">
              {acoesAbertas.length}{" "}
              {acoesAbertas.length === 1 ? "ação segue em aberto" : "ações seguem em aberto"} e
              aparece no plano de ação do sistema.
            </p>
          ) : null}
        </Secao>

        <Secao titulo="Processos organizados" contagem={String(processos.length)}>
          {processos.length === 0 ? (
            <Ausente oQue="processo mapeado" />
          ) : (
            <ul className="space-y-3">
              {processos.map((p) => (
                <li key={p.id}>
                  <p className="text-[0.9375rem]">
                    {p.praca} · {p.turno}
                  </p>
                  <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                    Responsável declarado: {p.responsavel}. {p.passos.length}{" "}
                    {p.passos.length === 1 ? "passo de finalização" : "passos de finalização"} ·{" "}
                    {p.pratos.length} {p.pratos.length === 1 ? "prato" : "pratos"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao
          titulo="Fichas desenvolvidas"
          contagem={`${fichas.length} no total · ${fichasCompletas.length} completas`}
        >
          {fichas.length === 0 ? (
            <Ausente oQue="ficha técnica" />
          ) : (
            <ul className="space-y-2.5">
              {fichas.map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
                >
                  <span className="text-[0.9375rem]">{f.nome}</span>
                  <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">
                    {f.categoria}
                    {f.rendimentoPorcoes !== null
                      ? ` · rende ${f.rendimentoPorcoes} porções`
                      : ""}
                    {` · ${f.itens.length} ${f.itens.length === 1 ? "ingrediente" : "ingredientes"}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {fichas.length > 0 ? (
            <p className="mt-4 border-t border-[var(--linha)] pt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              O relatório registra o que a ficha contém e quanto rende. Custo por
              porção, CMV e preço sugerido não aparecem aqui: dependem da
              configuração da metodologia, e o sistema não estima esses valores.
            </p>
          ) : null}
        </Secao>

        <Secao titulo="Acompanhamentos" contagem={String(acompanhamentos.length)}>
          {acompanhamentos.length === 0 ? (
            <Ausente oQue="acompanhamento registrado" />
          ) : (
            <ul className="space-y-4">
              {acompanhamentosOrdenados.map((a) => (
                <li key={a.id}>
                  <p className="text-[0.8125rem] font-semibold tracking-[0.08em] text-[var(--tinta-fraca)] uppercase">
                    {dataCurta(a.data)} · {ROTULO_TIPO_ACOMPANHAMENTO[a.tipo]}
                  </p>
                  <p className="mt-1.5 text-[0.9375rem] leading-relaxed">{a.resumo}</p>
                  {a.proximaAcao ? (
                    <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                      Próximo passo combinado: {a.proximaAcao}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Pendências">
          {acoesAbertas.length === 0 && fichasPendentes.length === 0 ? (
            <p>Nada em aberto no momento do fechamento deste relatório.</p>
          ) : (
            <ul className="space-y-2">
              {acoesAbertas.map((a) => (
                <li key={a.id} className="text-[0.9375rem] leading-relaxed">
                  {a.titulo}
                  <span className="ml-2 text-[0.8125rem] text-[var(--tinta-fraca)]">
                    ({a.responsavel})
                  </span>
                </li>
              ))}
              {fichasPendentes.map((f) => (
                <li key={f.id} className="text-[0.9375rem] leading-relaxed">
                  Ficha “{f.nome}” ainda sem todos os dados
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao titulo="Próximos passos">
          {acompanhamentos.length === 0 ? (
            <Ausente oQue="próximo passo combinado" />
          ) : (
            <ul className="space-y-2">
              {acompanhamentosOrdenados
                .filter((a) => a.proximaAcao)
                .slice(0, 4)
                .map((a) => (
                  <li key={a.id} className="text-[0.9375rem] leading-relaxed">
                    {a.proximaAcao}
                  </li>
                ))}
            </ul>
          )}
          {consultoria?.proximaAcao ? (
            <p className="mt-4 border-t border-[var(--linha)] pt-3 text-[0.9375rem] leading-relaxed">
              <span className="text-[var(--tinta-fraca)]">Próxima ação da consultoria: </span>
              {consultoria.proximaAcao}
            </p>
          ) : null}
          {documentos.length > 0 ? (
            <p className="mt-3 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Documentos já produzidos para este cliente:{" "}
              {documentos.map((d) => d.nome).join(", ")}.
            </p>
          ) : null}
        </Secao>

        <footer className="mt-12 border-t border-[var(--linha)] pt-6">
          <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
            Relatório produzido no sistema de gestão da consultoria. Os números de
            custo e de preço passam a constar deste documento quando a metodologia
            de cálculo estiver configurada.
          </p>
          <p className="assina mt-5 text-[1.6rem] leading-none text-oliva">{MARCA_NOME}</p>
          <p className="mt-1.5 text-[0.75rem] tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            {MARCA_DESCRICAO}
          </p>
        </footer>
      </article>
    </div>
  );
}

function Secao({
  titulo,
  contagem,
  children,
}: {
  titulo: string;
  contagem?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-9 break-inside-avoid">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--linha-forte)] pb-2.5">
        <h2 className="text-[0.8125rem] font-semibold tracking-[0.18em] text-noite uppercase">
          {titulo}
        </h2>
        {contagem ? (
          <span className="tabular text-[0.75rem] text-[var(--tinta-fraca)]">{contagem}</span>
        ) : null}
      </div>
      <div className="mt-4 text-[0.9375rem] leading-relaxed text-tinta">{children}</div>
    </section>
  );
}

function Campo({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <dt className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </dt>
      <dd
        className={
          destaque
            ? "font-display mt-1 text-[1.25rem] leading-tight text-noite"
            : "mt-1 text-[0.9375rem] text-tinta"
        }
      >
        {valor}
      </dd>
    </div>
  );
}

function ItemRotulo({ rotulo, texto }: { rotulo: string; texto: string }) {
  return (
    <div className="flex flex-wrap gap-x-2 text-[0.875rem]">
      <dt className="text-[var(--tinta-fraca)]">{rotulo}:</dt>
      <dd className="text-[var(--tinta-suave)]">{texto}</dd>
    </div>
  );
}

/** O marcador de dado que ainda não existe. Nunca zero, nunca traço. */
function Ausente({ oQue }: { oQue: string }) {
  return (
    <p className="rounded-[var(--raio-sm)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.5)] px-3.5 py-2.5 text-[0.875rem] text-[var(--tinta-suave)]">
      Dado ainda não registrado — não há {oQue} para este cliente até o momento.
    </p>
  );
}
