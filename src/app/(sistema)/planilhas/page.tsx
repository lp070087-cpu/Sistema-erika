import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina, Rotulo } from "@/components/ui/rotulo";
import { Etiqueta, Indicador } from "@/components/ui/indicador";
import { Aviso, EstadoVazio, Painel, Secao } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { obterRepositorioOperacao } from "@/lib/dados";
import type { ClienteOperacao } from "@/lib/dados";
import {
  EXPLICACAO_ESTADO_MODELO,
  ROTULO_ESTADO_MODELO,
  TOM_ESTADO_MODELO,
} from "@/lib/planilhas/estado";
import { MODELOS, TOTAL_DISPONIVEIS, TOTAL_MODELOS } from "@/lib/planilhas/modelos";
import { listarPlanilhasGeradas } from "@/lib/planilhas/historico";
import type { ModeloPlanilha } from "@/lib/planilhas/tipos";
import { BotaoGerarPlanilha } from "./gerar";
import { SeletorDeCliente } from "./seletor";
import { HistoricoDePlanilhas } from "./historico";

export const metadata: Metadata = { title: "Planilhas" };

/**
 * A CENTRAL DE PLANILHAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA É — E O QUE ELA NÃO É                                │
 * │                                                                      │
 * │ É uma CENTRAL, e não um gerador. A diferença é que ela mostra o       │
 * │ catálogo inteiro — inclusive o que ainda não funciona — e diz por quê. │
 * │ Uma tela que só listasse o modelo pronto pareceria completa e         │
 * │ esconderia justamente a informação que destrava os outros quatro:     │
 * │ que três esperam programação e um espera uma resposta dela.           │
 * │                                                                      │
 * │ Não é uma tela de configuração nem um construtor de planilha. Não há  │
 * │ "monte sua planilha escolhendo colunas": escolher coluna é decidir o  │
 * │ que o documento deve conter, e isso é a metodologia dela, não uma     │
 * │ preferência de interface.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ORDEM DOS BLOCOS, E POR QUE ELA É ESTA                            │
 * │                                                                      │
 * │ 1. RESUMO     — quantos modelos existem, quantos funcionam.           │
 * │ 2. O QUE SAI  — o modelo que já gera arquivo, com o botão. É o que    │
 * │                 ela veio fazer aqui.                                  │
 * │ 3. CATÁLOGO   — os outros quatro, com o motivo de cada um.            │
 * │ 4. HISTÓRICO  — as planilhas já geradas. Hoje, sempre vazio.          │
 * │                                                                      │
 * │ O que funciona vem PRIMEIRO e ocupa mais espaço. Numa lista onde a    │
 * │ maioria dos itens está desabilitada, o item habilitado precisa ser    │
 * │ inconfundível — senão a tela inteira lê como "nada funciona aqui".    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O HISTÓRICO APARECE VAZIO, EM VEZ DE NÃO APARECER            │
 * │                                                                      │
 * │ A planilha é gerada e entregue: os bytes vão para o computador de     │
 * │ quem clicou e o servidor não guarda cópia. Não existe histórico real  │
 * │ hoje — e a lista abaixo diz isso com todas as letras, em vez de        │
 * │ esconder a ausência ou preenchê-la com exemplos inventados.           │
 * │                                                                      │
 * │ O formato de cada registro, porém, já está definido em                │
 * │ `@/lib/planilhas/historico`, campo por campo. É o que permite que a    │
 * │ lista vazia já tenha as colunas certas — e que, no dia em que houver   │
 * │ onde guardar, o registro nasça completo em vez de faltar justamente o  │
 * │ dado que não dá para reconstruir depois.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = { searchParams: Promise<{ cliente?: string }> };

export default async function PaginaPlanilhas({ searchParams }: Props) {
  const { cliente: clienteId } = await searchParams;
  const operacao = obterRepositorioOperacao();

  const clientes = await operacao.listarClientes();
  /*
    O cliente vem da URL e é VALIDADO contra a lista. Sem a validação, um id
    inexistente na barra de endereços chegaria ao seletor como um valor que
    não corresponde a nenhuma opção — e o `<select>` mostraria o primeiro
    cliente da lista enquanto o id errado seguiria no estado. Validar aqui
    faz "cliente que não existe" virar "nenhum cliente escolhido", que é o
    que a tela sabe representar.
  */
  const clienteEscolhido = clienteId ? (clientes.find((c) => c.id === clienteId) ?? null) : null;

  const disponivel = MODELOS.find((m) => m.estado === "DISPONIVEL") ?? null;
  const restantes = MODELOS.filter((m) => m.estado !== "DISPONIVEL");

  /*
    O histórico vem do módulo de planilhas, e não de um `[]` escrito aqui.

    Hoje a função devolve lista vazia — é a ESTRUTURA do histórico, ainda sem
    armazenamento por trás. Pedir a lista por função, em vez de escrever o
    array vazio nesta página, é o que faz "ligar o histórico" ser uma troca
    dentro de `src/lib/planilhas/historico.ts`, e não uma edição na tela.
  */
  const geradas = listarPlanilhasGeradas();

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Documentos"
        titulo="Central de planilhas"
        descricao="Transforme os dados da consultoria em documentos organizados e prontos para análise ou envio."
      />

      <FaixaDemonstracao oQue="A planilha gerada aqui é um arquivo .xlsx de verdade, que abre no Excel — mas os dados dentro dela vêm do cenário de demonstração, não de um banco conectado." />

      {/* ── RESUMO ─────────────────────────────────────────────────────── */}
      <Secao
        rotulo="Resumo"
        titulo="O que esta central sabe fazer"
        descricao="São contagens do catálogo abaixo — conferem com os cards, um por um."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Indicador
            emCard
            rotulo="Modelos no catálogo"
            valor={TOTAL_MODELOS}
            contexto="Todas as planilhas que o sistema conhece"
          />
          <Indicador
            emCard
            rotulo="Gerando arquivo"
            valor={TOTAL_DISPONIVEIS}
            tom="positivo"
            contexto="Prontas para baixar hoje"
          />
          <Indicador
            emCard
            rotulo="Em preparação"
            valor={TOTAL_MODELOS - TOTAL_DISPONIVEIS}
            contexto="Dependem de trabalho ou de uma definição sua"
          />
        </div>
      </Secao>

      {/* ── O QUE JÁ GERA ARQUIVO ──────────────────────────────────────── */}
      {disponivel ? (
        <CardDisponivel modelo={disponivel} clientes={clientes} cliente={clienteEscolhido} />
      ) : null}

      {/* ── O RESTANTE DO CATÁLOGO ─────────────────────────────────────── */}
      <Secao
        rotulo="Catálogo"
        titulo="O que ainda está por vir"
        descricao="Cada card diz por que ainda não está pronto. Três esperam trabalho de programação; um espera uma decisão sua — e está marcado como tal."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {restantes.map((m) => (
            <CardIndisponivel key={m.id} modelo={m} />
          ))}
        </div>
      </Secao>

      {/*
        ── POR QUE O HISTÓRICO VEM DEPOIS DO CATÁLOGO ───────────────────────

        A ordem da tela é a ordem da pergunta: o que eu posso gerar agora
        (o card disponível), o que ainda não posso (o catálogo), e só então o
        que já foi gerado. Quem entra aqui vem gerar uma planilha; quem vem
        procurar uma planilha antiga já sabe que ela existe e desce direto.

        Posto antes do catálogo, o histórico empurraria para baixo o único
        card que funciona — e a primeira coisa que se veria numa tela de
        geração seria uma lista vazia.
      */}
      <HistoricoDePlanilhas registros={geradas} />

      <Aviso titulo="O que esta área ainda não faz">
        <p>
          A planilha gerada aqui é um arquivo real. O que não existe ainda é o que a alimenta: o
          sistema continua em modo de demonstração, sem banco conectado, e os nomes e datas que
          aparecem no arquivo são os do cenário de demonstração.
        </p>
        <p className="mt-2.5">
          Não há envio automático por e-mail, não há integração com Google Sheets ou Drive, e nada é
          importado de uma planilha existente. O arquivo é baixado e fica com você.
        </p>
      </Aviso>

      <Painel escuro className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Rotulo claro>Um arquivo de verdade</Rotulo>
          <p className="mt-2 font-display text-[1.25rem] text-off">
            Você baixa, abre no Excel e usa.
          </p>
          <p className="mt-1.5 max-w-[62ch] text-[0.875rem] text-creme/65">
            Com filtro no cabeçalho, painel congelado, datas e valores formatados e uma aba que
            explica de onde vieram os dados.
          </p>
        </div>
        <span className="assina text-[1.5rem] text-oliva-palha">Da cozinha para a planilha</span>
      </Painel>
    </div>
  );
}

/**
 * O CARD DO MODELO QUE FUNCIONA.
 *
 * A escolha do cliente acontece AQUI, e não numa tela anterior. A Central é a
 * primeira tela da área, e obrigar a passar por `/clientes` para gerar uma
 * planilha acrescentaria dois cliques a uma tarefa que é essencialmente
 * "baixar um arquivo deste cliente".
 */
function CardDisponivel({
  modelo,
  clientes,
  cliente,
}: {
  modelo: ModeloPlanilha;
  clientes: readonly ClienteOperacao[];
  cliente: ClienteOperacao | null;
}) {
  return (
    <Secao
      rotulo="Pronto para usar"
      titulo={modelo.nome}
      descricao={modelo.descricao}
      acoes={
        <Etiqueta tom={TOM_ESTADO_MODELO[modelo.estado]}>
          {ROTULO_ESTADO_MODELO[modelo.estado]}
        </Etiqueta>
      }
    >
      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        {clientes.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum cliente cadastrado"
            descricao="O relatório é de um cliente. Assim que houver um cadastro, ele aparece aqui para ser escolhido."
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
            <div className="min-w-0">
              <label
                htmlFor="cliente-planilha"
                className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase"
              >
                De qual cliente
              </label>

              <SeletorDeCliente clientes={clientes} selecionado={cliente?.id ?? ""} />

              <p className="mt-2 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
                A escolha troca o cliente do botão ao lado.{" "}
                <Link href="/clientes" className="text-oliva hover:underline">
                  Ver os clientes cadastrados
                </Link>
              </p>
            </div>

            <div className="lg:pt-6">
              {cliente ? (
                <BotaoGerarPlanilha
                  modeloId={modelo.id}
                  clienteId={cliente.id}
                  nomeCliente={cliente.nomeFantasia}
                />
              ) : (
                <p className="text-[0.8125rem] text-[var(--tinta-fraca)]">
                  Escolha um cliente para gerar.
                </p>
              )}
            </div>
          </div>
        )}

        {modelo.abas ? (
          <div className="mt-5 border-t border-[var(--linha)] pt-5">
            <Rotulo className="mb-3">O arquivo terá {modelo.abas.length} abas</Rotulo>
            <ul className="flex flex-wrap gap-2">
              {modelo.abas.map((aba, i) => (
                <li
                  key={aba}
                  className="rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[rgba(107,122,70,0.06)] px-2.5 py-1.5 text-[0.8125rem] text-[var(--tinta-suave)]"
                >
                  <span
                    aria-hidden
                    className="tabular mr-1.5 text-[0.6875rem] text-[var(--tinta-fraca)]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {aba}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-5 border-t border-[var(--linha)] pt-5">
          <ListaDados colunas={2}>
            <Dado rotulo="O que sai daqui">
              Um arquivo <span className="tabular">.xlsx</span>, que abre no Excel e no
              LibreOffice.
            </Dado>
            <Dado rotulo="O que não acontece">
              Nada é enviado a ninguém. O arquivo é baixado direto para o seu computador.
            </Dado>
          </ListaDados>
        </div>
      </div>
    </Secao>
  );
}

/**
 * O CARD DE UM MODELO QUE AINDA NÃO SAI.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O MOTIVO APARECE, E NÃO SÓ O ESTADO                          │
 * │                                                                      │
 * │ "Em preparação" sozinho é um cadeado sem placa: não diz se falta uma  │
 * │ semana de programação ou uma decisão que ninguém tomou. As duas        │
 * │ situações pedem coisas diferentes dela — numa, esperar; na outra,      │
 * │ responder.                                                            │
 * │                                                                      │
 * │ O tom do card também separa as duas: dourado para o que é trabalho de  │
 * │ programação, traço neutro para o que espera definição. De longe já se  │
 * │ vê o que depende dela.                                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function CardIndisponivel({ modelo }: { modelo: ModeloPlanilha }) {
  const esperaDefinicao = modelo.estado === "AGUARDANDO_DEFINICAO";

  return (
    <article className="flex flex-col rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="font-display text-[1.0625rem] leading-snug text-tinta">{modelo.nome}</h3>
        <Etiqueta tom={TOM_ESTADO_MODELO[modelo.estado]}>
          {ROTULO_ESTADO_MODELO[modelo.estado]}
        </Etiqueta>
      </div>

      <p className="mt-2.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
        {modelo.descricao}
      </p>

      {modelo.motivo ? (
        <div
          className={
            "mt-4 rounded-[var(--raio-sm)] border border-dashed px-3.5 py-3 " +
            (esperaDefinicao
              ? "border-[rgba(201,165,78,0.55)] bg-[rgba(201,165,78,0.07)]"
              : "border-[var(--linha-forte)]")
          }
        >
          <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
            {esperaDefinicao ? "Depende de você" : "O que falta"}
          </p>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
            {modelo.motivo}
          </p>
        </div>
      ) : null}

      <div className="mt-auto pt-4">
        <p className="text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
          {EXPLICACAO_ESTADO_MODELO[modelo.estado]}
        </p>
        {modelo.abas ? (
          <p className="mt-1.5 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
            {modelo.abas.length} abas previstas:{" "}
            <span className="text-[var(--tinta-suave)]">{modelo.abas.join(", ")}</span>
          </p>
        ) : null}
      </div>
    </article>
  );
}
