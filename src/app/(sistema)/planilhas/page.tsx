import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina, Rotulo } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio, Painel, Secao } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { obterRepositorioOperacao } from "@/lib/dados";
import type { Acompanhamento, Ficha, Tarefa } from "@/lib/dados";
import {
  EXPLICACAO_ESTADO_MODELO,
  ROTULO_ESTADO_MODELO,
  TOM_ESTADO_MODELO,
} from "@/lib/planilhas/estado";
import { MODELOS, TOTAL_DISPONIVEIS, TOTAL_MODELOS } from "@/lib/planilhas/modelos";
import { listarPlanilhasGeradas } from "@/lib/planilhas/historico";
import { recorteDoCliente } from "@/lib/planilhas/relatorio";
import type { ModeloPlanilha } from "@/lib/planilhas/tipos";
import { BotaoGerarPlanilha } from "./gerar";
import { SeletorDeCliente } from "./seletor";
import { HistoricoDePlanilhas } from "./historico";
import { PreviaDoRelatorio } from "./previa-relatorio";

export const metadata: Metadata = { title: "Planilhas" };

/**
 * A CENTRAL DE PLANILHAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ORDEM DESTA TELA É A ORDEM DA TAREFA                               │
 * │                                                                      │
 * │ 1. GERAR      — escolher o cliente e a planilha, e baixar. É o que    │
 * │                 ela veio fazer aqui, e por isso vem primeiro.         │
 * │ 2. PRÉVIA     — o que o arquivo vai ter, antes de baixar.             │
 * │ 3. MODELOS    — o catálogo inteiro, com o estado de cada um.          │
 * │ 4. HISTÓRICO  — o que já saiu daqui. Hoje, sempre vazio.              │
 * │                                                                      │
 * │ A versão anterior desta tela começava com duas contagens ("quantos    │
 * │ modelos existem", "quantos funcionam") e só depois chegava ao botão.  │
 * │ Quem entra aqui quer UM arquivo de UM cliente, não um panorama do      │
 * │ catálogo — e o panorama ocupava a dobra inteira.                      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA NÃO É                                                 │
 * │                                                                      │
 * │ Não é um gerador nem um construtor de planilha. Não existe "monte sua │
 * │ planilha escolhendo colunas": escolher coluna é decidir o que o        │
 * │ documento deve conter, e isso é a metodologia dela, não uma            │
 * │ preferência de interface.                                             │
 * │                                                                      │
 * │ E ela não tem uma segunda cópia dos dados. A prévia lê o mesmo         │
 * │ repositório que o gerador lê, pelas mesmas funções de recorte e        │
 * │ ordenação (`@/lib/planilhas/relatorio`). A planilha é uma              │
 * │ REPRESENTAÇÃO dos dados do sistema — não uma base paralela.            │
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
    AS LISTAS INTEIRAS, E O RECORTE DEPOIS.

    As tarefas e os acompanhamentos vêm completos — de todos os clientes — e
    o recorte por cliente acontece em `recorteDoCliente`, que é a MESMA
    função que o gerador usa antes de escrever o arquivo.

    Recortar aqui, com um `filter` escrito nesta página, seria a segunda
    implementação da regra mais importante do módulo: "nenhum dado de outro
    cliente entra nesta planilha". Duas implementações divergem, e a que
    divergisse estaria mostrando ao lado de um botão que gera a outra.
  */
  const [tarefas, acompanhamentos] = await Promise.all([
    operacao.listarTarefas(),
    operacao.listarAcompanhamentos(),
  ]);

  const recorte = clienteEscolhido
    ? recorteDoCliente({
        cliente: clienteEscolhido,
        tarefas,
        acompanhamentos,
        geradoEm: new Date(),
      })
    : {
        tarefas: [] as readonly Tarefa[],
        acompanhamentos: [] as readonly Acompanhamento[],
        fichas: [] as readonly Ficha[],
      };

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

      {/* ── 1. GERAR ───────────────────────────────────────────────────── */}
      {disponivel ? (
        <Secao
          rotulo="Ações principais"
          titulo="Gerar planilha"
          descricao="Escolha o cliente, confira a prévia abaixo e baixe o arquivo."
          acoes={
            <Etiqueta tom={TOM_ESTADO_MODELO[disponivel.estado]}>
              {ROTULO_ESTADO_MODELO[disponivel.estado]}
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

                  <SeletorDeCliente clientes={clientes} selecionado={clienteEscolhido?.id ?? ""} />

                  <p className="mt-2 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
                    A escolha troca o cliente do botão e da prévia abaixo.{" "}
                    <Link href="/clientes" className="text-oliva hover:underline">
                      Ver os clientes cadastrados
                    </Link>
                  </p>
                </div>

                <div className="lg:pt-6">
                  {clienteEscolhido ? (
                    <BotaoGerarPlanilha
                      modeloId={disponivel.id}
                      clienteId={clienteEscolhido.id}
                      nomeCliente={clienteEscolhido.nomeFantasia}
                    />
                  ) : (
                    <p className="text-[0.8125rem] text-[var(--tinta-fraca)]">
                      Escolha um cliente para gerar.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 border-t border-[var(--linha)] pt-5">
              <ListaDados colunas={2}>
                <Dado rotulo="O que sai daqui">
                  Um arquivo <span className="tabular">.xlsx</span> com as abas{" "}
                  {disponivel.abas?.join(", ") ?? "do modelo"}, que abre no Excel e no LibreOffice.
                </Dado>
                <Dado rotulo="O que não acontece">
                  Nada é enviado a ninguém. O arquivo é baixado direto para o seu computador.
                </Dado>
              </ListaDados>
            </div>
          </div>
        </Secao>
      ) : null}

      {/* ── 2. PRÉVIA EM FORMATO DE PLANILHA ───────────────────────────── */}
      <Secao
        rotulo="Prévia em formato de planilha"
        titulo={
          clienteEscolhido
            ? `Como vai sair: ${clienteEscolhido.nomeFantasia}`
            : "Como o arquivo vai sair"
        }
        descricao="Antes de baixar, veja as linhas. É a mesma grade do arquivo — as mesmas colunas, a mesma ordem e o mesmo texto."
      >
        <PreviaDoRelatorio
          cliente={clienteEscolhido}
          tarefas={recorte.tarefas}
          acompanhamentos={recorte.acompanhamentos}
        />
      </Secao>

      {/* ── 3. MODELOS ─────────────────────────────────────────────────── */}
      <Secao
        rotulo="Modelos"
        titulo="As planilhas que o sistema conhece"
        descricao={`${TOTAL_MODELOS} no catálogo, ${TOTAL_DISPONIVEIS} gerando arquivo hoje. Cada card abaixo diz em que ponto está.`}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {restantes.map((m) => (
            <CardModelo key={m.id} modelo={m} />
          ))}
        </div>
      </Secao>

      {/* ── 4. HISTÓRICO ───────────────────────────────────────────────── */}
      <HistoricoDePlanilhas registros={geradas} />

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
 * O CARD DE UM MODELO QUE AINDA NÃO SAI.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O MOTIVO APARECE, E NÃO SÓ O ESTADO                          │
 * │                                                                      │
 * │ "Ainda não sai" sozinho é um cadeado sem placa: não diz se é questão   │
 * │ de tempo ou se é uma pergunta que ninguém respondeu. As duas           │
 * │ situações pedem coisas diferentes dela — numa, esperar; na outra,      │
 * │ responder.                                                            │
 * │                                                                      │
 * │ O tom do card também separa as duas: dourado para o que depende de     │
 * │ tempo, traço neutro para o que espera definição. De longe já se vê o    │
 * │ que depende dela.                                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function CardModelo({ modelo }: { modelo: ModeloPlanilha }) {
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
        {/*
          O RODAPÉ DIZ ONDE O MODELO ESTÁ, E NÃO A FORMA QUE ELE TERIA.

          Aqui já esteve escrito "{n} abas previstas: Fichas, Itens,
          Informações". É uma frase sobre a ESTRUTURA de um arquivo que ainda
          não existe — e o efeito era prometer uma forma que ainda pode mudar.
          A aba de um modelo que não sai não é informação: é esboço.

          Quando o modelo sai, as abas dele aparecem no bloco de gerar, lá em
          cima, junto do arquivo de verdade.
        */}
        <p className="text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
          {EXPLICACAO_ESTADO_MODELO[modelo.estado]}
        </p>
      </div>
    </article>
  );
}
