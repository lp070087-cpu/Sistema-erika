import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Painel, Secao } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { Jornada, AvisoMetodologia } from "@/components/ui/jornada";
import { LinhaDoTempo } from "@/components/ui/linha-do-tempo";
import {
  ROTULO_MODALIDADE,
  ROTULO_STATUS_CONSULTORIA,
  ROTULO_TIPO_ACOMPANHAMENTO,
  TOM_STATUS_CONSULTORIA,
  contarAcoes,
  dataCurta,
  desdeQuando,
  obterRepositorioOperacao,
} from "@/lib/dados";
import { PlanoDeAcao } from "./plano-de-acao";

export const metadata: Metadata = { title: "Consultoria" };

/**
 * DETALHE DA CONSULTORIA — onde o método aparece andando.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A DIVISÃO DESTA PÁGINA, E POR QUE ELA NÃO É OUTRA COISA              │
 * │                                                                      │
 * │  · A JORNADA — as sete etapas e o estado de cada uma. Leitura.        │
 * │  · O PLANO DE AÇÃO — a única parte que se move. Interativa.           │
 * │  · O ESCOPO — o que foi combinado, em texto dela. Leitura.             │
 * │  · OS ENCONTROS — o que já aconteceu. Histórico.                      │
 * │                                                                      │
 * │ A jornada vem primeiro porque é ela que responde à pergunta que faz   │
 * │ a consultora abrir esta tela: "em que ponto eu estou com este         │
 * │ cliente?". O plano vem logo depois porque é ali que ela age. O resto  │
 * │ é consulta.                                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA NÃO TEM                                              │
 * │                                                                      │
 * │ Nenhum "progresso: 62%". As etapas têm naturezas diferentes —         │
 * │ receber um diagnóstico, escrever um plano, treinar equipe, medir      │
 * │ resultado — e somá-las exige peso. Peso é o ponto 11, que segue       │
 * │ aberto. O que existe é o estado de cada etapa e, quando a etapa é     │
 * │ contável, uma contagem: "3 de 12 fichas".                            │
 * │                                                                      │
 * │ Nenhum indicador financeiro do resultado. O resultado desta           │
 * │ consultoria só pode ser dito com CMV, margem e índice de cocção —     │
 * │ os pontos 4, 5, 6, 7 e 19. Enquanto eles não fecharem, a etapa        │
 * │ RESULTADO aparece como "aguardando dados", e é verdade.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = { params: Promise<{ id: string }> };

export default async function PaginaConsultoria({ params }: Props) {
  const { id } = await params;
  const operacao = obterRepositorioOperacao();

  const consultoria = await operacao.obterConsultoria(id);
  if (!consultoria) notFound();

  const [cliente, acoes, acompanhamentos, fichas, processos] = await Promise.all([
    operacao.obterCliente(consultoria.clienteId),
    operacao.listarAcoes(id),
    operacao.listarAcompanhamentosDoCliente(consultoria.clienteId),
    operacao.listarFichasDoCliente(consultoria.clienteId),
    operacao.listarProcessosDoCliente(consultoria.clienteId),
  ]);

  if (!cliente) notFound();

  const contagem = contarAcoes(acoes);
  const daConsultoria = acompanhamentos.filter((a) => a.consultoriaId === consultoria.id);

  /**
   * "Em aberto" é o total menos as concluídas. Não é um número novo que o
   * sistema inventa: é a contagem de tudo o que não terminou, e confere
   * linha a linha contra o plano abaixo.
   */
  const emAberto = contagem.total - contagem.concluidas;

  return (
    <div className="space-y-6">
      <Link
        href="/consultorias"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para as consultorias
      </Link>

      <CabecalhoPagina
        rotulo={cliente.nomeFantasia}
        titulo={consultoria.titulo}
        descricao={`Começada em ${dataCurta(consultoria.iniciadaEm)} · ${ROTULO_MODALIDADE[consultoria.modalidade]}`}
        acoes={
          <Etiqueta tom={TOM_STATUS_CONSULTORIA[consultoria.status]}>
            {ROTULO_STATUS_CONSULTORIA[consultoria.status]}
          </Etiqueta>
        }
      />

      <FaixaDemonstracao oQue="Esta consultoria é inventada para demonstração. As ações e os encontros abaixo são fictícios, e as alterações feitas nesta tela não são gravadas em lugar nenhum." />

      {/* Cabeçalho factual: o que é, de quem, como, desde quando. */}
      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        <ListaDados colunas={3}>
          <Dado rotulo="Cliente">
            <Link href={`/clientes/${cliente.id}`} className="text-oliva hover:underline">
              {cliente.nomeFantasia}
            </Link>
          </Dado>
          <Dado rotulo="Modalidade">{ROTULO_MODALIDADE[consultoria.modalidade]}</Dado>
          <Dado rotulo="Início">{dataCurta(consultoria.iniciadaEm)}</Dado>
          <Dado rotulo="Último contato">
            {consultoria.ultimoAcompanhamentoEm
              ? `${dataCurta(consultoria.ultimoAcompanhamentoEm)} · ${desdeQuando(consultoria.ultimoAcompanhamentoEm)}`
              : "sem registro"}
          </Dado>
          <Dado rotulo="Fichas do cliente" largo>
            {fichas.length === 0
              ? "nenhuma ainda"
              : `${fichas.length} ${fichas.length === 1 ? "ficha" : "fichas"} · ${fichas.filter((f) => f.situacao === "COMPLETA").length} fechada(s)`}
          </Dado>
          <Dado rotulo="Processos mapeados" largo>
            {processos.length === 0 ? "nenhum ainda" : processos.length}
          </Dado>
        </ListaDados>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        {/* JORNADA ------------------------------------------------------- */}
        <Secao
          rotulo="Jornada"
          titulo="Em que ponto o trabalho está"
          descricao="As sete etapas do método, com o estado de cada uma. O estado é atribuído pela consultora — o sistema não avança etapa sozinho, porque um trabalho que muda de fase sem ninguém tocar nele erra em silêncio."
        >
          <Jornada etapas={consultoria.jornada} />
        </Secao>

        {/* PRÓXIMA AÇÃO + ESCOPO ----------------------------------------- */}
        <div className="space-y-6">
          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Próxima ação
            </p>
            <p className="mt-2.5 text-[0.9375rem] leading-snug font-medium text-tinta">
              {consultoria.proximaAcao}
            </p>
            <p className="mt-1.5 text-[0.8125rem] text-[var(--tinta-suave)] tabular">
              {consultoria.proximaAcaoEm
                ? `${dataCurta(consultoria.proximaAcaoEm)} · ${desdeQuando(consultoria.proximaAcaoEm)}`
                : "sem data combinada"}
            </p>
          </Painel>

          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Plano de ação
            </p>
            <div className="mt-3 space-y-2.5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[0.8125rem] text-[var(--tinta-suave)]">Em aberto</span>
                <span className="tabular text-[0.9375rem] font-medium text-tinta">
                  {emAberto}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[0.8125rem] text-[var(--tinta-suave)]">
                  Aguardando o cliente
                </span>
                <span className="tabular text-[0.9375rem] font-medium text-tinta">
                  {contagem.aguardandoCliente}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[0.8125rem] text-[var(--tinta-suave)]">Concluídas</span>
                <span className="tabular text-[0.9375rem] font-medium text-tinta">
                  {contagem.concluidas}
                </span>
              </div>
            </div>
          </Painel>

          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Escopo combinado
            </p>
            <ul className="mt-3 space-y-2.5">
              {consultoria.escopo.map((item) => (
                <li
                  key={item}
                  className="border-l-2 border-l-[var(--linha-forte)] pl-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]"
                >
                  {item}
                </li>
              ))}
            </ul>
          </Painel>
        </div>
      </div>

      {/* PLANO DE AÇÃO — a parte interativa (§8) ------------------------ */}
      <PlanoDeAcao consultoriaId={consultoria.id} clienteId={cliente.id} acoes={acoes} />

      {/* RESULTADO — a etapa que só fecha com metodologia definida ------- */}
      <Secao
        rotulo="Resultado"
        titulo="O que a consultoria mudou"
        descricao="Esta é a etapa que responde se o trabalho deu certo. Ela fica registrada em texto, na leitura da consultora, até que a metodologia de cálculo esteja fechada."
      >
        <AvisoMetodologia />
      </Secao>

      {/* ENCONTROS ----------------------------------------------------- */}
      <Secao
        rotulo={`${daConsultoria.length} registrado(s)`}
        titulo="Encontros desta consultoria"
        descricao="Reuniões, visitas e análises, do mais recente para o mais antigo. Cada um com o que ficou pendente e qual é o próximo passo."
        acoes={
          <Link
            href="/acompanhamentos"
            className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
          >
            Ver todos
          </Link>
        }
      >
        {daConsultoria.length === 0 ? (
          <p className="text-[0.875rem] text-[var(--tinta-suave)]">
            Nenhum encontro registrado para esta consultoria ainda.
          </p>
        ) : (
          <LinhaDoTempo
            eventos={daConsultoria.map((a) => ({
              id: a.id,
              quando: dataCurta(a.data),
              titulo: `${ROTULO_TIPO_ACOMPANHAMENTO[a.tipo]} · ${a.titulo}`,
              descricao: a.resumo,
              tipo: a.tipo.toLowerCase(),
            }))}
          />
        )}
      </Secao>
    </div>
  );
}
