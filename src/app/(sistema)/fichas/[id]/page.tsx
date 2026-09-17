import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, Painel, Secao } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { LinhaDoTempo } from "@/components/ui/linha-do-tempo";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import {
  ROTULO_SITUACAO_FICHA,
  TOM_SITUACAO_FICHA,
  dataCurta,
  desdeQuando,
  obterRepositorioOperacao,
} from "@/lib/dados";
import type { Ingrediente, ItemFicha } from "@/lib/dados";
import { AvisoMetodologia } from "@/components/ui/jornada";

export const metadata: Metadata = { title: "Ficha técnica" };

/**
 * DETALHE DA FICHA TÉCNICA — a tela onde é mais fácil mentir.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA MOSTRA, E O QUE ELA SE RECUSA A MOSTRAR              │
 * │                                                                      │
 * │ MOSTRA — e mostra bem:                                               │
 * │   · o que o prato leva, item por item, com quantidade e unidade       │
 * │   · o preço de referência do insumo no momento em que a ficha foi     │
 * │     escrita (um FATO, guardado, não um cálculo)                       │
 * │   · o rendimento declarado e o peso da porção                         │
 * │   · modo de preparo e finalização, na ordem                                  │
 * │   · o histórico de alterações da ficha                                │
 * │                                                                      │
 * │ NÃO MOSTRA:                                                          │
 * │   · custo do item — `ItemFicha.custo` é `null` para todos             │
 * │   · custo da porção, CMV, preço sugerido, margem                      │
 * │                                                                      │
 * │ ┌────────────────────────────────────────────────────────────────┐   │
 * │ │ POR QUE A COLUNA DE CUSTO NÃO EXISTE, EM VEZ DE DIZER "—"      │   │
 * │ │                                                                │   │
 * │ │ Uma coluna vazia com traço em todas as linhas parece defeito.  │   │
 * │ │ Ela sugere que o sistema tentou calcular e não conseguiu.      │   │
 * │ │                                                                │   │
 * │ │ Sem a coluna, e com uma frase que explica o motivo, a mesma    │   │
 * │ │ ausência vira informação: o cálculo existe no projeto, está    │   │
 * │ │ esperando uma decisão dela, e nada foi inventado no meio.      │   │
 * │ └────────────────────────────────────────────────────────────────┘   │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = { params: Promise<{ id: string }> };

/**
 * A composição — três colunas, e nenhuma de custo.
 *
 * A tabela antiga tinha rolagem horizontal, o que em 390px esconde a coluna
 * do preço. Aqui a mesma definição serve a tabela e ao cartão: no celular
 * cada ingrediente vira um bloco com quantidade e preço rotulados.
 */
type ItemComposto = ItemFicha & { id: string; ingrediente: Ingrediente | null };

const COLUNAS_COMPOSICAO: readonly ColunaLista<ItemComposto>[] = [
  {
    chave: "insumo",
    titulo: "Ingrediente",
    noCartao: "topo",
    valor: (item) =>
      item.ingrediente ? (
        <Link
          href={`/ingredientes/${item.ingrediente.id}`}
          className="text-[0.9375rem] text-tinta hover:text-oliva"
        >
          {item.ingrediente.nome}
          <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
            {item.ingrediente.categoria}
          </span>
        </Link>
      ) : (
        <span className="text-[0.9375rem] text-[var(--tinta-fraca)]">
          insumo fora da biblioteca
        </span>
      ),
  },
  {
    chave: "quantidade",
    titulo: "Quantidade",
    align: "dir",
    noCartao: "linha",
    valor: (item) => (
      <span className="tabular text-[0.9375rem] text-[var(--tinta-suave)]">
        {item.quantidade} {item.unidade}
      </span>
    ),
  },
  {
    chave: "preco",
    titulo: "Preço de referência",
    align: "dir",
    noCartao: "linha",
    valor: (item) =>
      item.precoReferencia === null ? (
        <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem preço</span>
      ) : (
        <span className="tabular text-[0.9375rem] text-[var(--tinta-suave)]">
          R$ {item.precoReferencia.toFixed(2).replace(".", ",")}
          <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
            por {item.unidade}
          </span>
        </span>
      ),
  },
];

export default async function PaginaFicha({ params }: Props) {
  const { id } = await params;
  const operacao = obterRepositorioOperacao();

  const ficha = await operacao.obterFicha(id);
  if (!ficha) notFound();

  const [cliente, ingredientes] = await Promise.all([
    operacao.obterCliente(ficha.clienteId),
    operacao.listarIngredientes(),
  ]);

  const ingredientePorId = new Map(ingredientes.map((i) => [i.id, i]));

  // Itens da ficha com o nome do insumo resolvido. Ingrediente que não está
  // mais na biblioteca continua aparecendo — apagar uma linha que a ficha
  // declara seria esconder dado da consultora.
  const itens = ficha.itens.map((item) => ({
    ...item,
    ingrediente: ingredientePorId.get(item.ingredienteId) ?? null,
  }));

  const historico = [...ficha.historico].sort((a, b) => b.em.getTime() - a.em.getTime());

  return (
    <div className="space-y-6">
      <Link
        href="/fichas"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para as fichas
      </Link>

      <CabecalhoPagina
        rotulo={ficha.categoria}
        titulo={ficha.nome}
        descricao={
          cliente
            ? `Ficha de ${cliente.nomeFantasia} · atualizada em ${dataCurta(ficha.atualizadaEm)}`
            : `Atualizada em ${dataCurta(ficha.atualizadaEm)}`
        }
        acoes={
          <Etiqueta tom={TOM_SITUACAO_FICHA[ficha.situacao]}>
            {ROTULO_SITUACAO_FICHA[ficha.situacao]}
          </Etiqueta>
        }
      />

      <FaixaDemonstracao oQue="Esta ficha é inventada para demonstração. As quantidades, o rendimento e os preços de referência são declarados — não foram calculados nem medidos pelo sistema." />

      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        <ListaDados colunas={3}>
          <Dado rotulo="Prato">{ficha.nome}</Dado>
          <Dado rotulo="Categoria">{ficha.categoria}</Dado>
          {cliente ? (
            <Dado rotulo="Cliente">
              <Link href={`/clientes/${cliente.id}`} className="text-oliva hover:underline">
                {cliente.nomeFantasia}
              </Link>
            </Dado>
          ) : null}
          <Dado rotulo="Rendimento">
            {ficha.rendimentoPorcoes === null
              ? "não declarado"
              : `${ficha.rendimentoPorcoes} porções`}
          </Dado>
          <Dado rotulo="Peso da porção">
            {ficha.porcaoGramas === null ? "não declarado" : `${ficha.porcaoGramas} g`}
          </Dado>
          <Dado rotulo="Última atualização">
            {dataCurta(ficha.atualizadaEm)} · {desdeQuando(ficha.atualizadaEm)}
          </Dado>
        </ListaDados>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        {/* COMPOSIÇÃO --------------------------------------------------- */}
        <Secao
          rotulo="Composição"
          titulo={`${itens.length} ${itens.length === 1 ? "ingrediente" : "ingredientes"}`}
          descricao="O que o prato leva, com a quantidade líquida declarada e o preço de referência do insumo na data em que a ficha foi escrita."
        >
          {itens.length === 0 ? (
            <p className="text-[0.875rem] text-[var(--tinta-suave)]">
              Esta ficha ainda não tem ingredientes declarados.
            </p>
          ) : (
            <ListaResponsiva
              itens={itens.map((i) => ({ ...i, id: i.ingredienteId }))}
              colunas={COLUNAS_COMPOSICAO}
              vazio={null}
            />
          )}

          <div className="mt-5">
            <AvisoMetodologia />
          </div>

          <p className="mt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
            O preço de referência é o valor do insumo no momento em que a ficha
            foi escrita. Ele fica guardado junto da ficha de propósito: quando o
            preço do insumo mudar, esta linha continua contando o que valia
            naquele dia — e é assim que se enxerga o efeito da alta depois.
          </p>
        </Secao>

        {/* LADO: preparo, finalização, histórico ------------------------ */}
        <div className="space-y-6">
          {ficha.modoPreparo.length > 0 ? (
            <Painel>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Modo de preparo
              </p>
              <ol className="mt-3 space-y-2.5">
                {ficha.modoPreparo.map((passo, i) => (
                  <li key={passo} className="flex gap-3">
                    <span className="shrink-0 pt-0.5 text-[0.6875rem] font-semibold text-[var(--tinta-fraca)] tabular">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                      {passo}
                    </span>
                  </li>
                ))}
              </ol>
            </Painel>
          ) : null}

          {ficha.finalizacao.length > 0 ? (
            <Painel>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Finalização
              </p>
              <ol className="mt-3 space-y-2.5">
                {ficha.finalizacao.map((passo, i) => (
                  <li key={passo} className="flex gap-3">
                    <span className="shrink-0 pt-0.5 text-[0.6875rem] font-semibold text-[var(--tinta-fraca)] tabular">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                      {passo}
                    </span>
                  </li>
                ))}
              </ol>
            </Painel>
          ) : null}

          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Situação do cálculo
            </p>
            <p className="mt-2.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              {ficha.situacaoCalculo === "PENDENTE_METODOLOGIA" ? (
                <>
                  <span className="font-medium text-tinta">Aguardando a metodologia.</span>{" "}
                  A estrutura da ficha está pronta; o que falta é a decisão de
                  como calcular.
                </>
              ) : ficha.situacaoCalculo === "AGUARDANDO_DADOS" ? (
                <>
                  <span className="font-medium text-tinta">Aguardando dados.</span> Falta
                  quantidade ou rendimento para que a ficha possa ser fechada.
                </>
              ) : (
                <span className="font-medium text-tinta">Disponível.</span>
              )}
            </p>
          </Painel>
        </div>
      </div>

      {ficha.observacoes ? (
        <Secao
          rotulo="Observações"
          titulo="O contexto desta ficha"
          descricao="Escrito por ela, sobre como os números foram obtidos."
        >
          <p className="max-w-[80ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
            {ficha.observacoes}
          </p>
        </Secao>
      ) : null}

      {historico.length > 0 ? (
        <Secao
          rotulo={`${historico.length} alteração(ões)`}
          titulo="Histórico da ficha"
          descricao="O que mudou e quando. Existe para que uma alteração de rendimento não apague a versão anterior sem deixar rastro."
        >
          <LinhaDoTempo
            eventos={historico.map((h, i) => ({
              id: `${ficha.id}-h${i}`,
              quando: dataCurta(h.em),
              titulo: h.oQue,
              descricao: h.quem,
            }))}
          />
        </Secao>
      ) : null}

      <Aviso tom="info" titulo="O que ainda não está nesta tela">
        <p>
          Custo por item, custo da porção, CMV e preço sugerido não aparecem —
          e não é limitação técnica: é que a conta depende de como ela trabalha
          com fator de correção, perda e índice de cocção, e essas decisões
          ainda não foram tomadas. Cada um desses números sai com uma casa
          decimal diferente conforme a resposta, e um valor inventado aqui
          seria lido como certo.
        </p>
        <p className="mt-2.5">
          O que a ficha já faz é guardar tudo o que a conta vai precisar:
          quantidade declarada, preço de referência datado, rendimento e peso
          da porção. Quando a metodologia fechar, o cálculo entra sem que
          nenhum dado precise ser redigitado.
        </p>
      </Aviso>
    </div>
  );
}
