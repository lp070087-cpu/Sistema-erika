import Link from "next/link";
import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio, Painel, Secao } from "@/components/ui/superficie";
import { LinhaDoTempo } from "@/components/ui/linha-do-tempo";
import { ListaAtencao } from "@/components/ui/atencao";
import { Jornada, ProgressoContagem } from "@/components/ui/jornada";
import {
  ROTULO_PRIORIDADE,
  ROTULO_STATUS_ACAO,
  ROTULO_STATUS_CONSULTORIA,
  TOM_PRIORIDADE,
  TOM_STATUS_CONSULTORIA,
  dataCurta,
  desdeQuando,
  derivarAtencao,
} from "@/lib/dados";
import type {
  AcaoPlano,
  Acompanhamento,
  ClienteOperacao,
  Consultoria,
  Ficha,
  Processo,
  Tarefa,
} from "@/lib/dados";

/**
 * ABA 1 — VISÃO GERAL.
 *
 * Responde "como está este cliente agora" sem exigir que a consultora abra
 * as outras sete abas. Traz cinco coisas, nesta ordem de importância:
 *
 *   1. O que precisa de atenção — se há algo travado, é o que importa
 *   2. Em que ponto do método ela está
 *   3. O que está aberto no plano de ação
 *   4. As contagens de ficha e processo (situação, não número solto)
 *   5. O que aconteceu por último
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA ABA NÃO TEM                                               │
 * │                                                                      │
 * │ Nenhum indicador de saúde, nenhum percentual de conclusão, nenhum     │
 * │ "risco alto/médio/baixo". Somar etapas de naturezas diferentes exige  │
 * │ peso (ponto 11); classificar risco exige regra que ela não escreveu.  │
 * │ O que existe é contagem de fichas por situação e o estado de cada     │
 * │ etapa — os dois se conferem contra as listas abaixo.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AbaVisaoGeral({
  cliente,
  consultoria,
  acoes,
  fichas,
  processos,
  acompanhamentos,
  tarefas,
}: {
  cliente: ClienteOperacao;
  consultoria: Consultoria | null;
  acoes: readonly AcaoPlano[];
  fichas: readonly Ficha[];
  processos: readonly Processo[];
  acompanhamentos: readonly Acompanhamento[];
  tarefas: readonly Tarefa[];
}) {
  const abertas = acoes.filter((a) => a.status !== "CONCLUIDO");
  const aguardandoCliente = abertas.filter((a) => a.status === "AGUARDANDO_CLIENTE");
  const concluidas = acoes.filter((a) => a.status === "CONCLUIDO");

  const fichasAguardando = fichas.filter((f) => f.situacao === "AGUARDANDO_DADOS");
  const fichasRevisao = fichas.filter((f) => f.situacao === "EM_REVISAO");

  const tarefasAbertas = tarefas.filter((t) => t.status !== "CONCLUIDA");

  // Itens de atenção deste cliente.
  //
  // Passam pela MESMA função que o painel geral usa — `derivarAtencao` — e
  // os itens de outro cliente são descartados depois. Parece trabalho
  // jogado fora, e não é: montar a lista aqui à mão foi o que a versão
  // anterior fazia, e o resultado eram duas réguas diferentes para a mesma
  // palavra. O painel dizia "aguardando cliente" com um critério, esta aba
  // com outro, e o item que aparecia num lugar não aparecia no outro.
  //
  // `base` segue na assinatura porque a aba Consultoria ainda o usa.
  const atencao = derivarAtencao(
    {
      acoes,
      fichas,
      processos,
      consultorias: consultoria ? [consultoria] : [],
      clientes: [cliente],
      // Diagnóstico não lido é da entrada, e não pertence à ficha do
      // cliente — quem respondeu ainda não é cliente.
      diagnosticosNaoLidos: [],
    },
    new Date()
  );

  const ultimoAcompanhamento = acompanhamentos[0];

  return (
    <div className="space-y-6">
      {/* 1. Precisa de atenção -------------------------------------------- */}
      <Secao
        rotulo="Precisa de atenção"
        titulo={
          atencao.length === 0
            ? "Nada travado neste cliente"
            : atencao.length === 1
              ? "1 ponto travado"
              : `${atencao.length} pontos travados`
        }
        descricao="Tudo o que depende de alguém — informação que o cliente não mandou, ficha que falta fechar, processo sem tempo declarado. Cada item diz o que é e onde resolver."
      >
        <ListaAtencao
          itens={atencao}
          vazio={
            <EstadoVazio
              titulo="Nenhuma pendência aberta"
              descricao="Não há ação aguardando o cliente, ficha pela metade nem processo com passo sem tempo. Quando houver, aparece aqui."
            />
          }
        />
      </Secao>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        {/* 2. Jornada ------------------------------------------------------ */}
        <Secao
          rotulo="Onde está o trabalho"
          titulo={consultoria ? consultoria.titulo : "Sem consultoria ativa"}
          descricao={
            consultoria
              ? "As sete etapas do método, com o estado de cada uma. Não há percentual geral porque somar etapas de naturezas diferentes exigiria peso — o que existe é o estado e, quando faz sentido, uma contagem."
              : undefined
          }
          acoes={
            consultoria ? (
              <Etiqueta tom={TOM_STATUS_CONSULTORIA[consultoria.status]}>
                {ROTULO_STATUS_CONSULTORIA[consultoria.status]}
              </Etiqueta>
            ) : null
          }
        >
          {consultoria ? (
            <div className="space-y-6">
              <Jornada etapas={consultoria.jornada} />

              {fichas.length > 0 ? (
                <ProgressoContagem
                  feitos={fichas.filter((f) => f.situacao === "COMPLETA").length}
                  total={fichas.length}
                  rotulo="Fichas fechadas"
                />
              ) : null}
            </div>
          ) : (
            <EstadoVazio
              titulo="Nenhuma consultoria iniciada"
              descricao="Este cliente existe na carteira, mas não tem consultoria em andamento. O escopo combinado aparece aqui quando houver."
            />
          )}
        </Secao>

        {/* Lado: o essencial ------------------------------------------- */}
        <div className="space-y-6">
          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Plano de ação
            </p>
            <div className="mt-3 space-y-2.5">
              <LinhaResumo rotulo="Em aberto" valor={abertas.length} />
              <LinhaResumo rotulo="Aguardando o cliente" valor={aguardandoCliente.length} />
              <LinhaResumo rotulo="Concluídas" valor={concluidas.length} />
            </div>
          </Painel>

          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Situação do acervo
            </p>
            <div className="mt-3 space-y-2.5">
              <LinhaResumo rotulo="Fichas técnicas" valor={fichas.length} />
              <LinhaResumo rotulo="Fichas aguardando dados" valor={fichasAguardando.length} />
              <LinhaResumo rotulo="Fichas em revisão" valor={fichasRevisao.length} />
              <LinhaResumo rotulo="Processos mapeados" valor={processos.length} />
              <LinhaResumo rotulo="Tarefas em aberto" valor={tarefasAbertas.length} />
            </div>
          </Painel>

          {ultimoAcompanhamento ? (
            <Painel>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Último contato
              </p>
              <p className="mt-2.5 text-[0.9375rem] font-medium text-tinta">
                {ultimoAcompanhamento.titulo}
              </p>
              <p className="mt-1 text-[0.8125rem] text-[var(--tinta-suave)]">
                {dataCurta(ultimoAcompanhamento.data)} ·{" "}
                {desdeQuando(ultimoAcompanhamento.data)}
              </p>
              <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                {ultimoAcompanhamento.resumo}
              </p>
            </Painel>
          ) : null}
        </div>
      </div>

      {/* 3. Plano em aberto ---------------------------------------------- */}
      <Secao
        rotulo="Plano de ação"
        titulo={abertas.length === 0 ? "Nada em aberto" : `${abertas.length} em aberto`}
        descricao={`O que foi combinado com ${cliente.nomeFantasia} e ainda não terminou. O plano completo fica na aba Consultoria.`}
        acoes={
          consultoria ? (
            <Link
              href={`/consultorias/${consultoria.id}`}
              className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
            >
              Abrir consultoria
            </Link>
          ) : null
        }
      >
        {abertas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma ação em aberto"
            descricao={
              concluidas.length > 0
                ? `As ${concluidas.length} ações do plano foram concluídas.`
                : "Ainda não há plano de ação montado para este cliente."
            }
          />
        ) : (
          <ul className="divide-y divide-[var(--linha)]">
            {abertas.slice(0, 5).map((a) => (
              <li key={a.id} className="flex flex-wrap items-start justify-between gap-4 py-3 first:pt-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] leading-snug text-tinta">{a.titulo}</p>
                  <p className="mt-1 text-[0.8125rem] text-[var(--tinta-fraca)]">
                    {a.responsavel}
                    {a.prazo ? ` · prazo ${dataCurta(a.prazo)}` : " · sem prazo"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Etiqueta tom={TOM_PRIORIDADE[a.prioridade]}>
                    {ROTULO_PRIORIDADE[a.prioridade]}
                  </Etiqueta>
                  <Etiqueta>{ROTULO_STATUS_ACAO[a.status]}</Etiqueta>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {/* 4. Últimos acontecimentos ---------------------------------------- */}
      <Secao
        rotulo="Atividade recente"
        titulo="O que aconteceu por último"
        descricao="Os cinco acontecimentos mais recentes. O histórico completo está na última aba."
      >
        {acompanhamentos.length === 0 ? (
          <EstadoVazio
            titulo="Nada registrado ainda"
            descricao="Reuniões, visitas e análises aparecem aqui conforme forem registradas."
          />
        ) : (
          <LinhaDoTempo
            eventos={acompanhamentos.slice(0, 5).map((a) => ({
              id: a.id,
              quando: dataCurta(a.data),
              titulo: a.titulo,
              descricao: a.resumo,
              tipo: a.tipo.toLowerCase(),
            }))}
          />
        )}
      </Secao>
    </div>
  );
}

function LinhaResumo({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[0.8125rem] text-[var(--tinta-suave)]">{rotulo}</span>
      <span className="tabular text-[0.9375rem] font-medium text-tinta">{valor}</span>
    </div>
  );
}
