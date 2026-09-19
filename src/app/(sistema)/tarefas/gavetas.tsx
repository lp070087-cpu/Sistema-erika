"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio } from "@/components/ui/superficie";
import { AvisoInteracao } from "@/components/ui/demonstracao-interativa";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import {
  ROTULO_PRIORIDADE,
  TOM_PRIORIDADE,
  dataCurta,
  desdeQuando,
  mesmoDia,
} from "@/lib/dados";
import type { ClienteOperacao, Consultoria, Prioridade, Tarefa } from "@/lib/dados";

/**
 * AS QUATRO GAVETAS DE TAREFAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE "HOJE" E "ATRASADAS" SÃO LISTAS SEPARADAS                    │
 * │                                                                      │
 * │ Poderiam ser uma lista só, ordenada por prazo, com o atraso em        │
 * │ vermelho. Não são — e a razão é prática: o que está atrasado precisa  │
 * │ de uma decisão (fazer agora, renegociar o prazo, ou admitir que não   │
 * │ vai sair hoje), e o de hoje não. Misturados, os dois competem pela    │
 * │ mesma atenção e o atrasado some no meio da lista do dia.              │
 * │                                                                      │
 * │ A separação é a mesma que a Seção 9 do briefing pediu, e ela bate com │
 * │ o que a consultora faz de verdade na segunda-feira de manhã.          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA NÃO INVENTA                                          │
 * │                                                                      │
 * │ Não há "tarefa atrasada há 4 dias, urgente!" com tom de alarme: o     │
 * │ número de dias é um fato, o "urgente" seria julgamento do sistema     │
 * │ sobre o trabalho dela. A prioridade que aparece é a que ELA atribuiu. │
 * │                                                                      │
 * │ E concluir uma tarefa aqui não grava nada. A tela responde, a lista   │
 * │ se reorganiza — e o aviso acima diz o que isso significa.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Chave = "hoje" | "atrasadas" | "proximas" | "concluidas";

export function GavetasDeTarefas({
  tarefas: tarefasIniciais,
  clientes,
  consultorias,
  agoraISO,
}: {
  tarefas: readonly Tarefa[];
  clientes: readonly ClienteOperacao[];
  consultorias: readonly Consultoria[];
  /** O instante do servidor, em ISO. Ver a nota na página. */
  agoraISO: string;
}) {
  const [tarefas, setTarefas] = useState<Tarefa[]>(() => [...tarefasIniciais]);
  const [filtroCliente, setFiltroCliente] = useState("");
  const [filtroConsultoria, setFiltroConsultoria] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [rascunho, setRascunho] = useState<Tarefa | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  // `agora` vem do servidor e é fixado no primeiro render: recalcular a cada
  // render faria uma tarefa saltar de gaveta no meio de um clique.
  const agora = useMemo(() => new Date(agoraISO), [agoraISO]);

  const clientePorId = useMemo(
    () => new Map(clientes.map((c) => [c.id, c])),
    [clientes]
  );

  const filtradas = tarefas.filter((t) => {
    if (filtroCliente && t.clienteId !== filtroCliente) return false;
    if (filtroConsultoria && t.consultoriaId !== filtroConsultoria) return false;
    if (filtroPrioridade && t.prioridade !== filtroPrioridade) return false;
    if (filtroStatus && t.status !== filtroStatus) return false;
    return true;
  });

  // A mesma regra do servidor, aplicada aqui — porque a lista muda quando
  // uma tarefa é concluída na tela.
  const abertas = filtradas.filter((t) => t.status !== "CONCLUIDA");
  const gavetas = {
    hoje: abertas.filter((t) => t.prazo !== null && mesmoDia(t.prazo, agora)),
    atrasadas: abertas.filter((t) => t.prazo !== null && t.prazo.getTime() < agora.getTime()),
    proximas: abertas.filter(
      (t) => t.prazo === null || (t.prazo.getTime() >= agora.getTime() && !mesmoDia(t.prazo, agora))
    ),
    concluidas: filtradas.filter((t) => t.status === "CONCLUIDA"),
  };

  const algumFiltro =
    filtroCliente || filtroConsultoria || filtroPrioridade || filtroStatus ? true : false;

  function concluir(t: Tarefa) {
    setTarefas((atuais) =>
      atuais.map((x) =>
        x.id === t.id ? { ...x, status: "CONCLUIDA", concluidaEm: new Date() } : x
      )
    );
    setAviso(
      `“${t.titulo}” foi marcada como concluída — nesta sessão. Ao recarregar a página, ela volta para a gaveta de origem.`
    );
  }

  function reabrir(t: Tarefa) {
    setTarefas((atuais) =>
      atuais.map((x) => (x.id === t.id ? { ...x, status: "A_FAZER", concluidaEm: null } : x))
    );
    setAviso(`“${t.titulo}” voltou para a lista de abertas — nesta sessão.`);
  }

  function salvarNova() {
    if (!rascunho || !rascunho.titulo.trim()) return;
    setTarefas((atuais) => [rascunho, ...atuais]);
    setAviso(`A tarefa “${rascunho.titulo}” entrou na lista — nesta sessão.`);
    setRascunho(null);
  }

  const contexto = (t: Tarefa) => {
    const cliente = t.clienteId ? clientePorId.get(t.clienteId) : null;
    if (!cliente) {
      return (
        <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">sem cliente</span>
      );
    }
    return (
      <Link
        href={`/clientes/${cliente.id}`}
        className="text-[0.8125rem] text-oliva hover:underline"
      >
        {cliente.nomeFantasia}
      </Link>
    );
  };

  return (
    <div className="space-y-6">
      {/* O aviso antes das listas — mesma escolha do plano de ação. */}
      <AvisoInteracao
        oQue="concluir, reabrir e criar tarefas"
        oQueVolta="a lista"
      />

      {/* Filtros. Estado local: são uma lente sobre a lista que já está na
          tela, e trocá-los faz a gaveta se recalcular sem recarregar nada. */}
      <div className="nao-imprimir flex flex-wrap items-center gap-2.5">
        <div className="min-w-[160px] flex-1 sm:max-w-[220px]">
          <label htmlFor="ft-cliente" className="sr-only">
            Cliente
          </label>
          <select
            id="ft-cliente"
            value={filtroCliente}
            onChange={(e) => setFiltroCliente(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.875rem] text-tinta transition-colors hover:border-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
          >
            <option value="">Todos os clientes</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomeFantasia}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px] flex-1 sm:max-w-[220px]">
          <label htmlFor="ft-consultoria" className="sr-only">
            Consultoria
          </label>
          <select
            id="ft-consultoria"
            value={filtroConsultoria}
            onChange={(e) => setFiltroConsultoria(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.875rem] text-tinta transition-colors hover:border-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
          >
            <option value="">Todas as consultorias</option>
            {consultorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[130px] flex-1 sm:max-w-[160px]">
          <label htmlFor="ft-prioridade" className="sr-only">
            Prioridade
          </label>
          <select
            id="ft-prioridade"
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.875rem] text-tinta transition-colors hover:border-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
          >
            <option value="">Toda prioridade</option>
            {(["ALTA", "MEDIA", "BAIXA"] as const).map((p) => (
              <option key={p} value={p}>
                {ROTULO_PRIORIDADE[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[130px] flex-1 sm:max-w-[160px]">
          <label htmlFor="ft-status" className="sr-only">
            Status
          </label>
          <select
            id="ft-status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-9 w-full cursor-pointer rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.875rem] text-tinta transition-colors hover:border-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
          >
            <option value="">Todo status</option>
            <option value="A_FAZER">A fazer</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDA">Concluída</option>
          </select>
        </div>

        {algumFiltro ? (
          <button
            type="button"
            onClick={() => {
              setFiltroCliente("");
              setFiltroConsultoria("");
              setFiltroPrioridade("");
              setFiltroStatus("");
            }}
            className="h-9 rounded-[var(--raio-sm)] px-2.5 text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-suave)] uppercase transition-colors hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta"
          >
            Limpar
          </button>
        ) : null}

        <Botao
          variante="primario"
          tamanho="sm"
          className="ml-auto"
          onClick={() => setRascunho(novaTarefa())}
        >
          Nova tarefa
        </Botao>
      </div>

      {aviso ? (
        <p
          role="status"
          className="rounded-[var(--raio-sm)] border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.09)] px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]"
        >
          {aviso}
        </p>
      ) : null}

      <Lista
        chave="atrasadas"
        titulo="Atrasadas"
        descricao="Passaram do prazo e continuam abertas. Cada uma precisa de uma decisão: fazer agora, combinar outro prazo ou encerrar."
        itens={gavetas.atrasadas}
        contexto={contexto}
        aoConcluir={concluir}
        aoReabrir={reabrir}
        tomContagem="dourado"
        vazio="Nada atrasado."
      />

      <Lista
        chave="hoje"
        titulo="Hoje"
        descricao="O que está combinado para hoje."
        itens={gavetas.hoje}
        contexto={contexto}
        aoConcluir={concluir}
        aoReabrir={reabrir}
        vazio="Nada marcado para hoje."
      />

      <Lista
        chave="proximas"
        titulo="Próximas"
        descricao="O que vem depois, incluindo as tarefas sem prazo — elas ficam aqui justamente porque ninguém decidiu quando precisam acontecer."
        itens={gavetas.proximas}
        contexto={contexto}
        aoConcluir={concluir}
        aoReabrir={reabrir}
        vazio="Nada à frente."
      />

      <Lista
        chave="concluidas"
        titulo="Concluídas"
        descricao="O que já saiu. Fica à vista para dar a dimensão do que andou, e para reabrir quando algo foi encerrado por engano."
        itens={gavetas.concluidas}
        contexto={contexto}
        aoConcluir={concluir}
        aoReabrir={reabrir}
        vazio="Nada concluído ainda."
      />

      {/* Nova tarefa ------------------------------------------------------ */}
      <Gaveta
        aberta={rascunho !== null}
        aoFechar={() => setRascunho(null)}
        titulo="Nova tarefa"
        descricao="O que precisa ser feito, por quem e até quando. Fica nesta sessão: nada é gravado."
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={() => setRascunho(null)}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              tamanho="sm"
              onClick={salvarNova}
              disabled={!rascunho?.titulo.trim()}
            >
              Adicionar à lista
            </Botao>
          </>
        }
      >
        {rascunho ? (
          <div className="space-y-4">
            <Campo
              label="Tarefa"
              name="titulo"
              value={rascunho.titulo}
              onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })}
              placeholder="Ex.: Cobrar o histórico de produção do mês"
              autoFocus
            />
            <CampoSelecao
              label="Cliente"
              name="cliente"
              value={rascunho.clienteId ?? ""}
              opcoes={[
                { valor: "", texto: "Sem cliente (tarefa interna)" },
                ...clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia })),
              ]}
              onChange={(e) => {
                const id = e.target.value || null;
                const consultoria = consultorias.find((c) => c.clienteId === id);
                setRascunho({
                  ...rascunho,
                  clienteId: id,
                  // A consultoria acompanha o cliente quando existe uma —
                  // menos clique, e o vínculo continua verdadeiro.
                  consultoriaId: id ? (consultoria?.id ?? null) : null,
                });
              }}
              ajuda="Ligar a tarefa a um cliente faz ela aparecer na visão geral dele."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoSelecao
                label="Prioridade"
                name="prioridade"
                value={rascunho.prioridade}
                opcoes={(["ALTA", "MEDIA", "BAIXA"] as const).map((p) => ({
                  valor: p,
                  texto: ROTULO_PRIORIDADE[p],
                }))}
                onChange={(e) =>
                  setRascunho({ ...rascunho, prioridade: e.target.value as Prioridade })
                }
              />
              <Campo
                label="Prazo"
                name="prazo"
                type="date"
                value={rascunho.prazo ? paraCampoData(rascunho.prazo) : ""}
                onChange={(e) =>
                  setRascunho({
                    ...rascunho,
                    prazo: e.target.value ? new Date(`${e.target.value}T12:00:00`) : null,
                  })
                }
                ajuda="Sem data, a tarefa vai para “Próximas”."
              />
            </div>

            <p className="rounded-[var(--raio-sm)] border border-dashed border-[var(--linha-forte)] px-3.5 py-2.5 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
              A tarefa entra na lista desta tela e desaparece quando a página
              for recarregada.
            </p>
          </div>
        ) : null}
      </Gaveta>
    </div>
  );
}

/**
 * Uma gaveta. O componente existe porque as quatro listas têm a mesma
 * forma — o que muda é o título, o tom e, nas concluídas, a ação de reabrir
 * em vez de concluir.
 */
function Lista({
  titulo,
  descricao,
  itens,
  contexto,
  aoConcluir,
  aoReabrir,
  vazio,
  tomContagem,
}: {
  chave: Chave;
  titulo: string;
  descricao: string;
  itens: readonly Tarefa[];
  contexto: (t: Tarefa) => React.ReactNode;
  aoConcluir: (t: Tarefa) => void;
  aoReabrir: (t: Tarefa) => void;
  vazio: string;
  tomContagem?: "dourado";
}) {
  const concluida = titulo === "Concluídas";

  return (
    <section className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)]">
      <header className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-b border-[var(--linha)] px-5 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h2 className="text-[1rem]">{titulo}</h2>
            <Etiqueta tom={itens.length === 0 ? "neutro" : tomContagem === "dourado" ? "dourado" : "oliva"}>
              {itens.length}
            </Etiqueta>
          </div>
          <p className="mt-1 max-w-[70ch] text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
            {descricao}
          </p>
        </div>
      </header>

      <div className="px-5 py-4">
        {itens.length === 0 ? (
          <EstadoVazio titulo={vazio} className="py-6" />
        ) : (
          <ul className="divide-y divide-[var(--linha)]">
            {itens.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start gap-x-5 gap-y-2.5 py-3.5 first:pt-0 last:pb-0">
                {/* Concluir é o gesto mais frequente desta tela: fica à
                    esquerda, no caminho do olho, e não no fim da linha. */}
                <button
                  type="button"
                  onClick={() => (concluida ? aoReabrir(t) : aoConcluir(t))}
                  title={concluida ? "Reabrir tarefa" : "Marcar como concluída"}
                  aria-label={
                    concluida
                      ? `Reabrir “${t.titulo}”`
                      : `Marcar “${t.titulo}” como concluída`
                  }
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border transition-colors",
                    concluida
                      ? "border-medio bg-medio text-off"
                      : "border-[var(--linha-forte)] hover:border-oliva hover:bg-[rgba(107,122,70,0.12)]"
                  )}
                >
                  <svg aria-hidden width="11" height="9" viewBox="0 0 11 9">
                    <path
                      d="M1 4.4 4 7.4 10 1.4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={concluida ? "opacity-100" : "opacity-0"}
                    />
                  </svg>
                </button>

                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[0.9375rem] leading-snug",
                      concluida
                        ? "text-[var(--tinta-fraca)] line-through decoration-[var(--linha-forte)]"
                        : "text-tinta"
                    )}
                  >
                    {t.titulo}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                    {contexto(t)}
                    <span className="text-[0.8125rem] text-[var(--tinta-suave)] tabular">
                      {t.prazo
                        ? `${dataCurta(t.prazo)} · ${desdeQuando(t.prazo)}`
                        : "sem prazo"}
                    </span>
                    {t.status === "EM_ANDAMENTO" ? (
                      <Etiqueta tom="oliva">Em andamento</Etiqueta>
                    ) : null}
                  </div>
                </div>

                <Etiqueta tom={TOM_PRIORIDADE[t.prioridade]}>
                  {ROTULO_PRIORIDADE[t.prioridade]}
                </Etiqueta>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function paraCampoData(d: Date): string {
  const ano = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function novaTarefa(): Tarefa {
  return {
    id: `local_${Date.now()}`,
    titulo: "",
    clienteId: null,
    consultoriaId: null,
    prazo: null,
    status: "A_FAZER",
    prioridade: "MEDIA",
    concluidaEm: null,
  };
}
