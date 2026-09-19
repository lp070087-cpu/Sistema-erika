import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Indicador } from "@/components/ui/indicador";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { FUSO_HORARIO, MARCA_PRIMEIRO_NOME } from "@/lib/configuracao-publica";
import { ListaAtencao } from "@/components/ui/atencao";
import { LinhaDoTempo } from "@/components/ui/linha-do-tempo";
import {
  ROTULO_TIPO_ACOMPANHAMENTO,
  agruparTarefas,
  contarParcelas,
  dataCurta,
  desdeQuando,
  derivarAtencao,
  obterRepositorio,
  obterRepositorioOperacao,
  proximaParcela,
  saudacao,
  valorEmReais,
} from "@/lib/dados";

export const metadata: Metadata = { title: "Visão geral" };

/**
 * A DASHBOARD — VISÃO EXECUTIVA DA OPERAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A PERGUNTA QUE ESTA TELA RESPONDE                                    │
 * │                                                                      │
 * │ Uma só: "o que precisa de mim agora?". Tudo que não responde a essa   │
 * │ pergunta saiu daqui — inclusive coisas úteis, e é essa a parte         │
 * │ difícil.                                                            │
 * │                                                                      │
 * │ O que saiu, e por quê:                                               │
 * │                                                                      │
 * │   · "Meu site" — o endereço público e os botões de copiar e abrir.    │
 * │     É atalho de divulgação, e tem tela própria em `/meu-site`.        │
 * │   · "Atalhos — ir direto para" — repetia o menu lateral item por      │
 * │     item, com as mesmas contagens.                                    │
 * │   · "O movimento da fila" — listava quatro leads, e o número de       │
 * │     diagnósticos sem leitura já estava no resumo, duas vezes.         │
 * │   · Os cartões grandes de cada consultoria aberta — a contagem já     │
 * │     está no resumo, e a consultoria que precisa de ação aparece em    │
 * │     "Precisa da sua atenção".                                         │
 * │   · A nota final sobre "variação de custo no período", que explicava  │
 * │     um campo que não existe. É assunto de documentação, não de tela.  │
 * │                                                                      │
 * │ A ORDEM QUE FICOU: identificação, o tamanho da operação em seis       │
 * │ números, o que está travado, dinheiro, encontros à frente, e o que se │
 * │ moveu. O bloco acionável vem ANTES do financeiro porque é o único     │
 * │ que pede decisão dela hoje.                                          │
 * │                                                                      │
 * │ NENHUM DADO FOI INVENTADO. Tudo aqui sai dos mesmos repositórios que  │
 * │ alimentavam a versão anterior — o que mudou foi o quanto de tela      │
 * │ cada número ocupa.                                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A SAUDAÇÃO USA O FUSO DELA E NÃO O DO SERVIDOR                │
 * │                                                                      │
 * │ O servidor roda em UTC. Às 21h de São Paulo ele já está no dia         │
 * │ seguinte, e a tela cumprimentaria com "Bom dia" quem está fechando a   │
 * │ cozinha. `FUSO_HORARIO` é o fuso da parede dela, declarado num lugar   │
 * │ só — e `saudacao()` recebe a data como argumento para que o HTML do    │
 * │ servidor e o do navegador digam a mesma palavra.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export default async function PaginaVisaoGeral() {
  const entrada = obterRepositorio();
  const operacao = obterRepositorioOperacao();

  const [
    resumo,
    leads,
    acoes,
    fichas,
    processos,
    consultorias,
    clientes,
    tarefas,
    acompanhamentos,
    compromissos,
    linhasContrato,
  ] = await Promise.all([
    entrada.resumo(),
    entrada.listarLeads(),
    operacao.listarTodasAsAcoes(),
    operacao.listarFichas(),
    operacao.listarProcessos(),
    operacao.listarConsultorias(),
    operacao.listarClientes(),
    operacao.listarTarefas(),
    operacao.listarAcompanhamentos(),
    operacao.listarCompromissos(),
    operacao.listarLinhasContrato(),
  ]);

  const agora = new Date();
  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  const naoLidos = leads.filter(
    (l) => (l.status === "NOVO" || l.status === "EM_ANALISE") && l.diagnosticoId !== null
  );

  const atencao = derivarAtencao(
    {
      acoes,
      fichas,
      processos,
      consultorias,
      clientes,
      contratos: linhasContrato,
      diagnosticosNaoLidos: naoLidos.map((l) => ({
        leadId: l.id,
        leadNome: l.nomeFantasia,
        quando: l.criadoEm,
      })),
    },
    agora
  );

  const gavetas = agruparTarefas(tarefas, agora);
  const consultoriasAbertas = consultorias.filter((c) => c.status !== "CONCLUIDA");
  const fichasPendentes = fichas.filter((f) => f.situacao === "AGUARDANDO_DADOS");
  const tarefasPendentes = gavetas.hoje.length + gavetas.atrasadas.length + gavetas.proximas.length;

  const contratosAguardandoAceite = linhasContrato.filter(
    (l) => l.contrato.status === "AGUARDANDO_ACEITE"
  );

  const proximaParcelaGeral = linhasContrato
    .map((l) => ({
      linha: l,
      parcela: proximaParcela(l.contrato),
    }))
    .filter(
      (x): x is { linha: (typeof linhasContrato)[number]; parcela: NonNullable<typeof x.parcela> } =>
        x.parcela !== null && x.parcela.venceEm !== null && x.parcela.venceEm.getTime() >= agora.getTime()
    )
    .sort((a, b) => (a.parcela.venceEm?.getTime() ?? 0) - (b.parcela.venceEm?.getTime() ?? 0))
    .slice(0, 4);

  const proximosCompromissos = compromissos
    .filter((c) => c.quando.getTime() >= agora.getTime())
    .sort((a, b) => a.quando.getTime() - b.quando.getTime())
    .slice(0, 4);

  const minhaSaudacao = saudacao(agora, FUSO_HORARIO);

  /*
    A FRASE DO CABEÇALHO DIZ O QUE ESTÁ TRAVADO, e não o que a tela é.

    "Veja o que precisa da sua atenção hoje" descreve a tela; ela não diz
    nada que o título já não diga. A frase que serve é a que muda de dia para
    dia: quantos itens esperam ação — ou, quando não há nenhum, que não há.
  */
  const fraseDoDia =
    atencao.length === 0
      ? "Nada travado por aqui hoje — a operação está em dia."
      : atencao.length === 1
        ? "1 item espera uma ação sua hoje."
        : `${atencao.length} itens esperam uma ação sua hoje.`;

  return (
    <div className="space-y-6">
      {/* ── SAUDAÇÃO ─────────────────────────────────────────────────── */}
      <CabecalhoPagina
        rotulo="Visão geral da operação"
        titulo={`${minhaSaudacao}, ${MARCA_PRIMEIRO_NOME}.`}
        descricao={fraseDoDia}
      />

      {/* ── RESUMO ───────────────────────────────────────────────────── */}
      <Secao rotulo="Resumo" titulo="O tamanho do dia">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Indicador
            emCard
            rotulo="Diagnósticos novos"
            valor={resumo.aguardandoLeitura}
            tom={resumo.aguardandoLeitura > 0 ? "atencao" : "neutro"}
          />
          <Indicador
            emCard
            rotulo="Clientes ativos"
            valor={clientes.filter((c) => c.situacao === "ATIVO").length}
          />
          <Indicador emCard rotulo="Consultorias em andamento" valor={consultoriasAbertas.length} />
          <Indicador
            emCard
            rotulo="Tarefas pendentes"
            valor={tarefasPendentes}
            tom={gavetas.atrasadas.length > 0 ? "critico" : "neutro"}
            contexto={
              gavetas.atrasadas.length > 0
                ? `${gavetas.atrasadas.length} ${gavetas.atrasadas.length === 1 ? "atrasada" : "atrasadas"}`
                : undefined
            }
          />
          <Indicador
            emCard
            rotulo="Fichas pendentes"
            valor={fichasPendentes.length}
            tom={fichasPendentes.length > 0 ? "atencao" : "neutro"}
          />
          <Indicador
            emCard
            rotulo="Contratos aguardando ação"
            valor={contratosAguardandoAceite.length}
            tom={contratosAguardandoAceite.length > 0 ? "atencao" : "neutro"}
          />
        </div>
      </Secao>

      {/* ── PRECISA DA SUA ATENÇÃO ───────────────────────────────────── */}
      <Secao
        rotulo="Precisa da sua atenção"
        titulo={
          atencao.length === 0
            ? "Nada travado neste momento"
            : `${atencao.length} ${atencao.length === 1 ? "item" : "itens"} travando o trabalho`
        }
        acoes={
          <BotaoLink href="/tarefas" variante="secundario" tamanho="sm">
            Ver todas as tarefas
          </BotaoLink>
        }
      >
        <ListaAtencao
          itens={atencao}
          maximo={6}
          vazio={
            <EstadoVazio
              titulo="Nada esperando você"
              descricao="Nenhuma tarefa atrasada, nenhuma parcela vencida, nenhuma ficha sem dado e nenhum contrato esperando aceite."
            />
          }
        />
      </Secao>

      {/* ── FINANCEIRO ───────────────────────────────────────────────── */}
      <Secao
        rotulo="Financeiro"
        titulo="Contratos e parcelas"
        acoes={
          <BotaoLink href="/contratos" variante="secundario" tamanho="sm">
            Ver contratos
          </BotaoLink>
        }
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="min-w-0">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Contratos
            </p>

            {linhasContrato.length === 0 ? (
              <p className="mt-3 text-[0.875rem] text-[var(--tinta-suave)]">
                Nenhum contrato registrado.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {linhasContrato.slice(0, 4).map((l) => {
                  const parcelas = contarParcelas(l.contrato);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/contratos/${l.id}`}
                        className="block border-l-2 border-l-[var(--linha-forte)] pl-3 transition-colors duration-150 hover:border-l-oliva"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <span className="min-w-0 truncate text-[0.875rem] font-medium text-tinta">
                            {l.cliente.nomeFantasia}
                          </span>
                          <span className="tabular shrink-0 text-[0.875rem] text-tinta">
                            {valorEmReais(l.valorTotal, { centavos: false })}
                          </span>
                        </div>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.75rem] text-[var(--tinta-fraca)]">
                          <span className="min-w-0 truncate">{l.contrato.titulo}</span>
                          {parcelas.ATRASADO > 0 ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="font-semibold text-red-800">
                                {parcelas.ATRASADO}{" "}
                                {parcelas.ATRASADO === 1 ? "parcela atrasada" : "parcelas atrasadas"}
                              </span>
                            </>
                          ) : null}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Próximos vencimentos
            </p>

            {proximaParcelaGeral.length === 0 ? (
              <p className="mt-3 text-[0.875rem] text-[var(--tinta-suave)]">
                Nenhuma parcela à frente.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {proximaParcelaGeral.map(({ linha, parcela }) => (
                  <li
                    key={parcela.id}
                    className="flex items-baseline justify-between gap-4 border-l-2 border-l-[var(--linha-forte)] pl-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[0.875rem] text-tinta">
                        {linha.cliente.nomeFantasia}
                      </p>
                      <p className="mt-0.5 truncate text-[0.75rem] text-[var(--tinta-fraca)]">
                        {parcela.descricao}
                      </p>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="tabular block text-[0.8125rem] text-tinta">
                        {valorEmReais(parcela.valor)}
                      </span>
                      <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                        {parcela.venceEm ? dataCurta(parcela.venceEm) : "sem data"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Secao>

      {/* ── PRÓXIMOS ACOMPANHAMENTOS ─────────────────────────────────── */}
      {/*
        Só aparece quando há encontro marcado. Um bloco com estado vazio
        fixo na tela custaria altura para dizer "nada aqui" — e quem chega
        numa segunda-feira sem agenda não precisa ler isso todo dia.
      */}
      {proximosCompromissos.length > 0 ? (
        <Secao
          rotulo="Próximos acompanhamentos"
          titulo="Os encontros à frente"
          acoes={
            <BotaoLink href="/acompanhamentos" variante="secundario" tamanho="sm">
              Ver histórico
            </BotaoLink>
          }
        >
          <ul className="grid gap-x-8 gap-y-3.5 lg:grid-cols-2">
            {proximosCompromissos.map((c) => {
              const dono = clientePorId.get(c.clienteId);
              return (
                <li key={c.id} className="flex items-baseline justify-between gap-4 border-l-2 border-l-[var(--linha-forte)] pl-3">
                  <div className="min-w-0">
                    <p className="truncate text-[0.875rem] leading-snug text-tinta">{c.titulo}</p>
                    <p className="mt-0.5 truncate text-[0.75rem] text-[var(--tinta-fraca)]">
                      {dono ? dono.nomeFantasia : "cliente não identificado"} ·{" "}
                      {ROTULO_TIPO_ACOMPANHAMENTO[c.tipo]}
                    </p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block tabular text-[0.8125rem] text-tinta">
                      {dataCurta(c.quando)}
                    </span>
                    <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                      {desdeQuando(c.quando, agora).replace("há ", "em ")}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </Secao>
      ) : null}

      {/* ── ATIVIDADE RECENTE ────────────────────────────────────────── */}
      <Secao rotulo="Atividade recente" titulo="O que se moveu">
        {acompanhamentos.length === 0 ? (
          <p className="text-[0.875rem] text-[var(--tinta-suave)]">
            Nenhum acompanhamento registrado ainda.
          </p>
        ) : (
          <LinhaDoTempo
            eventos={acompanhamentos.slice(0, 5).map((a) => {
              const dono = clientePorId.get(a.clienteId);
              return {
                id: a.id,
                quando: dataCurta(a.data),
                titulo: a.titulo,
                descricao: dono ? dono.nomeFantasia : "cliente não identificado",
                tipo: ROTULO_TIPO_ACOMPANHAMENTO[a.tipo],
              };
            })}
          />
        )}
      </Secao>
    </div>
  );
}
