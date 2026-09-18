import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Painel, Secao } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { Jornada } from "@/components/ui/jornada";
import { DecisoesQueFaltam } from "@/components/ui/metodologia";
import { LinhaDoTempo } from "@/components/ui/linha-do-tempo";
import {
  ROTULO_MODALIDADE,
  ROTULO_SITUACAO_DOCUMENTO,
  ROTULO_SITUACAO_FICHA,
  ROTULO_STATUS_CONSULTORIA,
  ROTULO_STATUS_TAREFA,
  ROTULO_TIPO_ACOMPANHAMENTO,
  ROTULO_TIPO_DOCUMENTO,
  TOM_SITUACAO_DOCUMENTO,
  TOM_SITUACAO_FICHA,
  TOM_STATUS_CONSULTORIA,
  contarAcoes,
  dataCurta,
  desdeQuando,
  obterRepositorioOperacao,
} from "@/lib/dados";
import { SequenciaDoTrabalho } from "./sequencia";
import { PlanoDeAcao } from "./plano-de-acao";
import { CartaoPlanilhasDoCliente } from "../../planilhas/cartao-cliente";
import { CartaoContratosDoCliente } from "../../contratos/cartao-cliente";

export const metadata: Metadata = { title: "Consultoria" };

/**
 * DETALHE DA CONSULTORIA â€” onde o mÃ©todo aparece andando.
 *
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚ A DIVISÃƒO DESTA PÃGINA, E POR QUE ELA NÃƒO Ã‰ OUTRA COISA              â”‚
 * â”‚                                                                      â”‚
 * â”‚  Â· A JORNADA â€” as sete etapas e o estado de cada uma. Leitura.        â”‚
 * â”‚  Â· O PLANO DE AÃ‡ÃƒO â€” a Ãºnica parte que se move. Interativa.           â”‚
 * â”‚  Â· O ESCOPO â€” o que foi combinado, em texto dela. Leitura.             â”‚
 * â”‚  Â· OS ENCONTROS â€” o que jÃ¡ aconteceu. HistÃ³rico.                      â”‚
 * â”‚                                                                      â”‚
 * â”‚ A jornada vem primeiro porque Ã© ela que responde Ã  pergunta que faz   â”‚
 * â”‚ a consultora abrir esta tela: "em que ponto eu estou com este         â”‚
 * â”‚ cliente?". O plano vem logo depois porque Ã© ali que ela age. O resto  â”‚
 * â”‚ Ã© consulta.                                                          â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚ O QUE ESTA TELA NÃƒO TEM                                              â”‚
 * â”‚                                                                      â”‚
 * â”‚ Nenhum "progresso: 62%". As etapas tÃªm naturezas diferentes â€”         â”‚
 * â”‚ receber um diagnÃ³stico, escrever um plano, treinar equipe, medir      â”‚
 * â”‚ resultado â€” e somÃ¡-las exige peso. Peso Ã© o ponto 11, que segue       â”‚
 * â”‚ aberto. O que existe Ã© o estado de cada etapa e, quando a etapa Ã©     â”‚
 * â”‚ contÃ¡vel, uma contagem: "3 de 12 fichas".                            â”‚
 * â”‚                                                                      â”‚
 * â”‚ Nenhum indicador financeiro do resultado. O resultado desta           â”‚
 * â”‚ consultoria sÃ³ pode ser dito com CMV, margem e Ã­ndice de cocÃ§Ã£o â€”     â”‚
 * â”‚ os pontos 4, 5, 6, 7 e 19. Enquanto eles nÃ£o fecharem, a etapa        â”‚
 * â”‚ RESULTADO aparece como "aguardando dados", e Ã© verdade.               â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 */

type Props = { params: Promise<{ id: string }> };

export default async function PaginaConsultoria({ params }: Props) {
  const { id } = await params;
  const operacao = obterRepositorioOperacao();

  const consultoria = await operacao.obterConsultoria(id);
  if (!consultoria) notFound();

  const [
    cliente,
    acoes,
    acompanhamentos,
    fichas,
    processos,
    documentos,
    contratos,
    tarefas,
  ] = await Promise.all([
    operacao.obterCliente(consultoria.clienteId),
    operacao.listarAcoes(id),
    operacao.listarAcompanhamentosDoCliente(consultoria.clienteId),
    operacao.listarFichasDoCliente(consultoria.clienteId),
    operacao.listarProcessosDoCliente(consultoria.clienteId),
    operacao.listarDocumentosDoCliente(consultoria.clienteId),
    operacao.listarContratosDoCliente(consultoria.clienteId),
    operacao.listarTarefas(),
  ]);

  if (!cliente) notFound();

  const contagem = contarAcoes(acoes);
  const daConsultoria = acompanhamentos.filter((a) => a.consultoriaId === consultoria.id);

  /**
   * As tarefas DESTA consultoria.
   *
   * `listarTarefas()` devolve a agenda inteira â€” a tarefa Ã© uma entidade
   * solta, ligada por `consultoriaId` quando pertence a um trabalho. O filtro
   * acontece aqui e nÃ£o no repositÃ³rio porque a agenda tambÃ©m precisa da
   * lista completa, e criar um mÃ©todo por filtro encheria o contrato de
   * variaÃ§Ãµes da mesma consulta.
   */
  const tarefasDaConsultoria = tarefas.filter((t) => t.consultoriaId === consultoria.id);

  /**
   * Quem responde pelo trabalho.
   *
   * Ã‰ LIDO do plano de aÃ§Ã£o, e nÃ£o um campo novo na consultoria: o
   * responsÃ¡vel Ã© quem ficou com as aÃ§Ãµes. Um campo `responsavel` gravado ao
   * lado criaria duas respostas para a mesma pergunta â€” no dia em que as
   * aÃ§Ãµes passassem para outra pessoa e o campo nÃ£o, as duas discordariam
   * sem que ninguÃ©m soubesse qual estÃ¡ certa.
   *
   * Pode haver mais de um, e Ã© comum que haja: a consultora conduz e a
   * cliente executa parte. Por isso a lista mostra os nomes com quantas
   * aÃ§Ãµes AINDA ABERTAS cada um tem, em vez de eleger um "dono" do trabalho
   * que o dado nÃ£o sustenta.
   */
  const responsaveis = (() => {
    const porNome = new Map<string, { abertas: number; concluidas: number }>();
    for (const a of acoes) {
      const atual = porNome.get(a.responsavel) ?? { abertas: 0, concluidas: 0 };
      if (a.status === "CONCLUIDO") atual.concluidas += 1;
      else atual.abertas += 1;
      porNome.set(a.responsavel, atual);
    }
    // Quem tem mais aÃ§Ã£o em aberto primeiro: Ã© a ordem em que a pergunta
    // "com quem estÃ¡ isso?" costuma ser feita.
    return [...porNome.entries()]
      .map(([nome, n]) => ({ nome, ...n }))
      .sort((a, b) => b.abertas - a.abertas || a.nome.localeCompare(b.nome, "pt-BR"));
  })();

  /**
   * "Em aberto" Ã© o total menos as concluÃ­das. NÃ£o Ã© um nÃºmero novo que o
   * sistema inventa: Ã© a contagem de tudo o que nÃ£o terminou, e confere
   * linha a linha contra o plano abaixo.
   */
  const emAberto = contagem.total - contagem.concluidas;

  return (
    <div className="space-y-6">
      <Link
        href="/consultorias"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>â†</span> Voltar para as consultorias
      </Link>

      <CabecalhoPagina
        rotulo={cliente.nomeFantasia}
        titulo={consultoria.titulo}
        descricao={`ComeÃ§ada em ${dataCurta(consultoria.iniciadaEm)} Â· ${ROTULO_MODALIDADE[consultoria.modalidade]}`}
        acoes={
          <Etiqueta tom={TOM_STATUS_CONSULTORIA[consultoria.status]}>
            {ROTULO_STATUS_CONSULTORIA[consultoria.status]}
          </Etiqueta>
        }
      />

      <FaixaDemonstracao oQue="Esta consultoria Ã© inventada para demonstraÃ§Ã£o. As aÃ§Ãµes e os encontros abaixo sÃ£o fictÃ­cios, e as alteraÃ§Ãµes feitas nesta tela nÃ£o sÃ£o gravadas em lugar nenhum." />

      {/*
        â”€â”€ A SEQUÃŠNCIA, ANTES DOS DADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        "DiagnÃ³stico â†’ AnÃ¡lise â†’ Plano â†’ ImplantaÃ§Ã£o â†’ Treinamento â†’
        Acompanhamento â†’ Resultado" na horizontal, logo abaixo do cabeÃ§alho.

        Aqui em cima porque Ã© a Ãºnica coisa desta tela que responde "como Ã©
        que o trabalho funciona" â€” o resto responde "onde ele estÃ¡ agora", e
        essa segunda pergunta sÃ³ faz sentido para quem jÃ¡ entendeu a primeira.
      */}
      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
          A sequÃªncia do trabalho
        </p>
        <p className="mt-1.5 max-w-[76ch] text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          As sete etapas, na ordem em que acontecem. Cada uma traz o prÃ³prio
          estado â€” nÃ£o hÃ¡ etapa &ldquo;atual&rdquo; nem percentual de avanÃ§o,
          porque o trabalho nÃ£o anda em fila: o acompanhamento continua em
          andamento enquanto o treinamento pode estar esperando.
        </p>
        <SequenciaDoTrabalho etapas={consultoria.jornada} className="mt-4" />
      </div>

      {/* CabeÃ§alho factual: o que Ã©, de quem, como, desde quando. */}
      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        <ListaDados colunas={3}>
          <Dado rotulo="Cliente">
            <Link href={`/clientes/${cliente.id}`} className="text-oliva hover:underline">
              {cliente.nomeFantasia}
            </Link>
          </Dado>
          <Dado rotulo="Modalidade">{ROTULO_MODALIDADE[consultoria.modalidade]}</Dado>
          <Dado rotulo="InÃ­cio">{dataCurta(consultoria.iniciadaEm)}</Dado>
          <Dado rotulo="Ãšltimo contato">
            {consultoria.ultimoAcompanhamentoEm
              ? `${dataCurta(consultoria.ultimoAcompanhamentoEm)} Â· ${desdeQuando(consultoria.ultimoAcompanhamentoEm)}`
              : "sem registro"}
          </Dado>
          <Dado rotulo="Processos mapeados">
            {processos.length === 0 ? "nenhum ainda" : processos.length}
          </Dado>
          <Dado rotulo="Quem responde" largo>
            {responsaveis.length === 0 ? (
              <span className="text-[var(--tinta-fraca)]">
                Sem aÃ§Ã£o atribuÃ­da â€” nenhuma responsabilidade foi distribuÃ­da ainda.
              </span>
            ) : (
              <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
                {responsaveis.map((r) => (
                  <li key={r.nome} className="flex items-baseline gap-2">
                    <span>{r.nome}</span>
                    <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">
                      {r.abertas === 0
                        ? "nada em aberto"
                        : `${r.abertas} ${r.abertas === 1 ? "aÃ§Ã£o em aberto" : "aÃ§Ãµes em aberto"}`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Dado>
        </ListaDados>
      </div>

      {/*
        â”€â”€ O QUE JÃ EXISTE DENTRO DESTE TRABALHO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        Quatro contagens com estado, e um link para o lugar onde cada uma vive.
        NÃ£o sÃ£o indicadores: sÃ£o tamanhos de lista que se conferem abrindo a
        lista. E nÃ£o sÃ£o "progresso" â€” uma consultoria nÃ£o avanÃ§a em percentual
        enquanto o peso de cada etapa for decisÃ£o pendente da consultora.
      */}
      <Secao
        rotulo="Dentro deste trabalho"
        titulo="O que jÃ¡ existe, e onde conferir"
        descricao="Contagens do que estÃ¡ ligado a esta consultoria. Cada nÃºmero abre a lista de onde ele veio â€” nenhum deles Ã© percentual, porque somar etapas de naturezas diferentes exigiria atribuir peso a cada uma."
      >
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ContagemDoTrabalho
            rotulo="Plano de aÃ§Ã£o"
            numero={contagem.total}
            detalhe={
              contagem.total === 0
                ? "nenhuma aÃ§Ã£o escrita"
                : `${emAberto} em aberto Â· ${contagem.concluidas} concluÃ­da${contagem.concluidas === 1 ? "" : "s"}`
            }
            href={`/consultorias/${consultoria.id}`}
          />
          <ContagemDoTrabalho
            rotulo="Tarefas"
            numero={tarefasDaConsultoria.length}
            detalhe={
              tarefasDaConsultoria.length === 0
                ? "nenhuma tarefa ligada"
                : `${tarefasDaConsultoria.filter((t) => t.status !== "CONCLUIDA").length} em aberto`
            }
            href="/tarefas"
          />
          <ContagemDoTrabalho
            rotulo="Encontros"
            numero={daConsultoria.length}
            detalhe={daConsultoria.length === 0 ? "nada registrado" : "reuniÃµes, visitas e anÃ¡lises"}
            href="/acompanhamentos"
          />
          <ContagemDoTrabalho
            rotulo="Fichas tÃ©cnicas"
            numero={fichas.length}
            detalhe={
              fichas.length === 0
                ? "nenhuma ficha ainda"
                : `${fichas.filter((f) => f.situacao === "COMPLETA").length} fechada${fichas.filter((f) => f.situacao === "COMPLETA").length === 1 ? "" : "s"}`
            }
            href={`/clientes/${cliente.id}?aba=fichas`}
          />
        </ul>
      </Secao>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        {/* JORNADA ------------------------------------------------------- */}
        <Secao
          rotulo="Jornada"
          titulo="Em que ponto o trabalho estÃ¡"
          descricao="As sete etapas do mÃ©todo, com o estado de cada uma e a contagem dentro delas quando existe. O estado Ã© atribuÃ­do pela consultora â€” o sistema nÃ£o avanÃ§a etapa sozinho, porque um trabalho que muda de fase sem ninguÃ©m tocar nele erra em silÃªncio."
        >
          <Jornada etapas={consultoria.jornada} />
        </Secao>

        {/* PRÃ“XIMA AÃ‡ÃƒO + ESCOPO ----------------------------------------- */}
        <div className="space-y-6">
          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              PrÃ³xima aÃ§Ã£o
            </p>
            <p className="mt-2.5 text-[0.9375rem] leading-snug font-medium text-tinta">
              {consultoria.proximaAcao}
            </p>
            <p className="mt-1.5 text-[0.8125rem] text-[var(--tinta-suave)] tabular">
              {consultoria.proximaAcaoEm
                ? `${dataCurta(consultoria.proximaAcaoEm)} Â· ${desdeQuando(consultoria.proximaAcaoEm)}`
                : "sem data combinada"}
            </p>
          </Painel>

          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Plano de aÃ§Ã£o
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
                <span className="text-[0.8125rem] text-[var(--tinta-suave)]">ConcluÃ­das</span>
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

      {/* PLANO DE AÃ‡ÃƒO â€” a parte interativa (Â§8) ------------------------ */}
      <PlanoDeAcao consultoriaId={consultoria.id} clienteId={cliente.id} acoes={acoes} />

      {/* RESULTADO â€” a etapa que sÃ³ fecha com metodologia definida ------- */}
      <Secao
        rotulo="Resultado"
        titulo="O que a consultoria mudou"
        descricao="Esta Ã© a etapa que responde se o trabalho deu certo â€” em texto, na leitura da consultora, enquanto a leitura por nÃºmero nÃ£o estiver definida."
      >
        <DecisoesQueFaltam
          apenas={["coccao", "compra-para-uso", "custo-do-prato", "formacao-de-preco", "peso-das-etapas"]}
          titulo="Por que o resultado ainda Ã© descrito, e nÃ£o medido"
          descricao="Medir o resultado exige comparar o antes e o depois â€” e comparar exige que os dois tenham sido calculados do mesmo jeito, com as decisÃµes abaixo jÃ¡ fixadas. Sem elas, a comparaÃ§Ã£o mediria a diferenÃ§a entre duas suposiÃ§Ãµes, nÃ£o a diferenÃ§a entre dois momentos."
        />
      </Secao>

      {/* ENCONTROS E TAREFAS â€” o dia a dia do trabalho ------------------ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Secao
          rotulo={`${daConsultoria.length} registrado(s)`}
          titulo="Encontros desta consultoria"
          descricao="ReuniÃµes, visitas e anÃ¡lises, do mais recente para o mais antigo. Cada um com o que ficou pendente e qual Ã© o prÃ³ximo passo."
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
              eventos={daConsultoria.slice(0, 5).map((a) => ({
                id: a.id,
                quando: dataCurta(a.data),
                titulo: `${ROTULO_TIPO_ACOMPANHAMENTO[a.tipo]} Â· ${a.titulo}`,
                descricao: a.resumo,
                tipo: a.tipo.toLowerCase(),
              }))}
            />
          )}
          {daConsultoria.length > 5 ? (
            <p className="mt-4 border-t border-[var(--linha)] pt-3.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
              Os cinco mais recentes.{" "}
              <Link href="/acompanhamentos" className="text-oliva hover:underline">
                Ver os {daConsultoria.length} encontros
              </Link>
              .
            </p>
          ) : null}
        </Secao>

        <Secao
          rotulo={`${tarefasDaConsultoria.length} ligada(s)`}
          titulo="Tarefas deste trabalho"
          descricao="O que estÃ¡ na agenda e pertence a esta consultoria. A agenda inteira, com as tarefas de todos os clientes, fica no mÃ³dulo de Tarefas."
          acoes={
            <Link
              href="/tarefas"
              className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
            >
              Ver agenda
            </Link>
          }
        >
          {tarefasDaConsultoria.length === 0 ? (
            <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Nenhuma tarefa estÃ¡ ligada a esta consultoria. O plano de aÃ§Ã£o,
              logo acima, Ã© onde o trabalho Ã© descrito â€” a tarefa Ã© o
              compromisso com data.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--linha)]">
              {tarefasDaConsultoria.map((t) => {
                const concluida = t.status === "CONCLUIDA";
                return (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-start justify-between gap-x-6 gap-y-1.5 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p
                        className={
                          "text-[0.9375rem] leading-snug " +
                          (concluida
                            ? "text-[var(--tinta-fraca)] line-through decoration-[var(--linha-forte)]"
                            : "text-tinta")
                        }
                      >
                        {t.titulo}
                      </p>
                      <p className="mt-0.5 text-[0.8125rem] text-[var(--tinta-fraca)] tabular">
                        {t.prazo ? dataCurta(t.prazo) : "sem prazo"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[0.75rem] text-[var(--tinta-suave)]">
                      {ROTULO_STATUS_TAREFA[t.status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Secao>
      </div>

      {/* DOCUMENTOS ENTREGUES ------------------------------------------- */}
      <Secao
        rotulo={`${documentos.length} registrado(s)`}
        titulo="Documentos deste cliente"
        descricao={`O que foi produzido para ${cliente.nomeFantasia} e em que estado estÃ¡. O registro existe; o arquivo ainda nÃ£o â€” nÃ£o hÃ¡ armazenamento de arquivo configurado, e a Ã¡rea de envio diz isso.`}
        acoes={
          <Link
            href={`/clientes/${cliente.id}?aba=documentos`}
            className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
          >
            Abrir na ficha do cliente
          </Link>
        }
      >
        {documentos.length === 0 ? (
          <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            Nenhum documento registrado ainda. A leitura do diagnÃ³stico, o plano
            de aÃ§Ã£o e os relatÃ³rios aparecem aqui conforme forem produzidos.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--linha)]">
            {documentos.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[0.9375rem] leading-snug text-tinta">{d.nome}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
                    {ROTULO_TIPO_DOCUMENTO[d.tipo]} Â· {dataCurta(d.criadoEm)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Etiqueta tom={TOM_SITUACAO_DOCUMENTO[d.situacao]}>
                    {ROTULO_SITUACAO_DOCUMENTO[d.situacao]}
                  </Etiqueta>
                  <span className="text-[0.75rem] text-[var(--tinta-fraca)]">nÃ£o anexado</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {/* FICHAS E PROCESSOS â€” o acervo que a consultoria produziu ------- */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Secao
          rotulo={`${fichas.length} no acervo`}
          titulo="Fichas tÃ©cnicas do cliente"
          descricao="O acervo deste cliente. A ficha guarda o que Ã© declarado â€” rendimento, porÃ§Ã£o, modo de preparo â€” e o custo continua fora atÃ© a metodologia fechar."
          acoes={
            <Link
              href={`/clientes/${cliente.id}?aba=fichas`}
              className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
            >
              Ver no cliente
            </Link>
          }
        >
          {fichas.length === 0 ? (
            <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Nenhuma ficha tÃ©cnica registrada para este cliente ainda.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {fichas.slice(0, 6).map((f) => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5"
                >
                  <Link
                    href={`/fichas/${f.id}`}
                    className="min-w-0 flex-1 text-[0.875rem] text-tinta underline-offset-4 hover:underline"
                  >
                    {f.nome}
                  </Link>
                  <Etiqueta tom={TOM_SITUACAO_FICHA[f.situacao]}>
                    {ROTULO_SITUACAO_FICHA[f.situacao]}
                  </Etiqueta>
                </li>
              ))}
            </ul>
          )}
          {fichas.length > 6 ? (
            <p className="mt-4 border-t border-[var(--linha)] pt-3.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
              Seis das {fichas.length}.{" "}
              <Link
                href={`/clientes/${cliente.id}?aba=fichas`}
                className="text-oliva hover:underline"
              >
                Ver o acervo inteiro
              </Link>
              .
            </p>
          ) : null}
        </Secao>

        <Secao
          rotulo={`${processos.length} mapeado(s)`}
          titulo="Processos do cliente"
          descricao="Os processos de operaÃ§Ã£o que jÃ¡ foram desenhados â€” praÃ§a, turno, responsÃ¡vel e a lista de finalizaÃ§Ã£o de cada um."
          acoes={
            <Link
              href="/processos"
              className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
            >
              Ver processos
            </Link>
          }
        >
          {processos.length === 0 ? (
            <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Nenhum processo mapeado para este cliente ainda.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {processos.slice(0, 6).map((p) => (
                <li key={p.id} className="min-w-0">
                  <Link
                    href={`/processos/${p.id}`}
                    className="block text-[0.875rem] leading-snug text-tinta underline-offset-4 hover:underline"
                  >
                    {p.praca}
                  </Link>
                  <p className="mt-0.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
                    {p.turno} Â· {p.responsavel} Â·{" "}
                    {p.pratos.length === 0
                      ? "nenhum prato listado"
                      : `${p.pratos.length} ${p.pratos.length === 1 ? "prato" : "pratos"}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {processos.length > 6 ? (
            <p className="mt-4 border-t border-[var(--linha)] pt-3.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
              Seis de {processos.length}.{" "}
              <Link href="/processos" className="text-oliva hover:underline">
                Ver todos os processos
              </Link>
              .
            </p>
          ) : null}
        </Secao>
      </div>

      {/*
        â”€â”€ CONTRATO E PLANILHA â€” o que autoriza e o que sai â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

        Os dois cartÃµes no fim, na ordem em que a coisa acontece: primeiro o
        combinado que autoriza o trabalho, depois o documento que se produz a
        partir dos dados dele.

        Os dois sÃ£o componentes IMPORTADOS, nÃ£o reescritos aqui â€” os mesmos que
        a ficha do cliente e a Central de Planilhas usam. Daqui eles recebem o
        cliente e a consultoria jÃ¡ resolvidos no servidor, entÃ£o o botÃ£o nÃ£o
        precisa descobrir de quem Ã© o arquivo: ele jÃ¡ nasce sabendo.
      */}
      <CartaoContratosDoCliente
        clienteId={cliente.id}
        nomeCliente={cliente.nomeFantasia}
        contratos={contratos}
      />

      <CartaoPlanilhasDoCliente
        clienteId={cliente.id}
        nomeCliente={cliente.nomeFantasia}
        consultoriaId={consultoria.id}
      />
    </div>
  );
}

/**
 * Uma contagem do bloco "dentro deste trabalho".
 *
 * Ã‰ um nÃºmero com rÃ³tulo, um detalhe e um caminho para a lista de onde ele
 * veio â€” nunca um percentual e nunca um indicador com tom de bom/ruim. O
 * sistema nÃ£o sabe se 12 fichas Ã© bom ou ruim sem a metodologia, e um nÃºmero
 * pintado de verde afirmaria isso.
 */
function ContagemDoTrabalho({
  rotulo,
  numero,
  detalhe,
  href,
}: {
  rotulo: string;
  numero: number;
  detalhe: string;
  href: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex h-full flex-col justify-between rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-4 transition-colors duration-150 hover:border-[var(--linha-forte)] hover:bg-white"
      >
        <div>
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            {rotulo}
          </p>
          <p
            className={`mt-2 tabular text-[1.5rem] leading-none ${
              numero === 0 ? "text-[var(--tinta-fraca)]" : "text-tinta"
            }`}
          >
            {numero}
          </p>
        </div>
        <p className="mt-2 text-[0.75rem] leading-snug text-[var(--tinta-suave)]">{detalhe}</p>
      </Link>
    </li>
  );
}

