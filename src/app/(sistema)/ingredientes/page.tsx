import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { BarraFiltros } from "@/components/ui/filtros";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { dataCurta, desdeQuando, obterRepositorioOperacao } from "@/lib/dados";
import type { Ingrediente, PrecoIngrediente } from "@/lib/dados";
import { NovoIngrediente } from "./novo";

export const metadata: Metadata = { title: "Ingredientes" };

/**
 * BIBLIOTECA DE INGREDIENTES — e o histórico de preço.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O HISTÓRICO DE PREÇO É O MÓDULO MAIS ÚTIL DAQUI              │
 * │                                                                      │
 * │ Redigitar preço em cada ficha é o trabalho que mais consome tempo     │
 * │ numa consultoria de custos — e o que mais erra, porque um preço       │
 * │ digitado em janeiro continua na ficha em junho sem ninguém notar.     │
 * │                                                                      │
 * │ Com o preço datado num lugar só, a ficha passa a apontar para ele.    │
 * │ Só que USAR esse preço para recalcular é o ponto 10, que segue        │
 * │ aberto: não se sabe ainda de onde vem o preço (ela digita? o cliente  │
 * │ manda? vem de nota?) nem com que frequência atualiza.                 │
 * │                                                                      │
 * │ Então o histórico é VISÍVEL — com data, valor e fornecedor — e o      │
 * │ recálculo automático ainda não acontece. Guardar o fato já resolve     │
 * │ metade; a outra metade depende dela.                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A VARIAÇÃO DE PREÇO NÃO É UM ALERTA                                  │
 * │                                                                      │
 * │ A coluna mostra o preço atual, o anterior e a diferença. Não há       │
 * │ "subiu muito!", não há farol vermelho, não há classificação. Um       │
 * │ insumo que subiu 12% pode ser sazonal e não significar nada — quem    │
 * │ sabe julgar isso é a consultora, olhando o contexto do cliente.       │
 * │                                                                      │
 * │ O sistema faz a subtração. A leitura é dela.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = {
  searchParams: Promise<{ q?: string; categoria?: string; fornecedor?: string }>;
};

export default async function PaginaIngredientes({ searchParams }: Props) {
  const { q, categoria, fornecedor } = await searchParams;
  const operacao = obterRepositorioOperacao();

  const ingredientes = await operacao.listarIngredientes();

  const categorias = [...new Set(ingredientes.map((i) => i.categoria))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  const fornecedores = [...new Set(ingredientes.map((i) => i.fornecedor).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "pt-BR")
  );

  const busca = (q ?? "").trim().toLowerCase();
  const fCategoria = categorias.includes(categoria ?? "") ? (categoria as string) : "";
  const fFornecedor = fornecedores.includes(fornecedor ?? "") ? (fornecedor as string) : "";

  const filtrados = ingredientes.filter((i) => {
    if (fCategoria && i.categoria !== fCategoria) return false;
    if (fFornecedor && i.fornecedor !== fFornecedor) return false;
    if (busca && !i.nome.toLowerCase().includes(busca)) return false;
    return true;
  });

  // Ordenados pelo mais recente, para que o insumo que acabou de ser
  // atualizado apareça no topo de quem abre a biblioteca de manhã.
  const ordenados = [...filtrados].sort(
    (a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime()
  );

  const colunas: ColunaLista<Ingrediente>[] = [
    {
      chave: "nome",
      titulo: "Ingrediente",
      destaque: true,
      noCartao: "topo",
      valor: (i) => (
        <>
          <span className="block text-[0.9375rem] font-medium text-tinta">{i.nome}</span>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {i.categoria} · por {i.unidade}
          </span>
        </>
      ),
    },
    {
      chave: "atual",
      titulo: "Preço atual",
      align: "dir",
      noCartao: "linha",
      valor: (i) => <PrecoAtual ingrediente={i} />,
    },
    {
      chave: "anterior",
      titulo: "Preço anterior",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (i) => {
        const anterior = i.historico[0];
        if (!anterior) {
          return (
            <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem anterior</span>
          );
        }
        return (
          <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
            R$ {anterior.valor.toFixed(2).replace(".", ",")}
            <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
              {dataCurta(anterior.em)}
            </span>
          </span>
        );
      },
    },
    {
      chave: "fornecedor",
      titulo: "Fornecedor",
      ocultaEm: "md",
      noCartao: "linha",
      valor: (i) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">{i.fornecedor || "—"}</span>
      ),
    },
    {
      chave: "atualizado",
      titulo: "Atualizado",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (i) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">
          {desdeQuando(i.atualizadoEm)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Técnico"
        titulo="Biblioteca de ingredientes"
        descricao="Um lugar só para o preço de cada insumo, com a data em que passou a valer. É o que evita redigitar preço em cada ficha — e o que evita que um preço de janeiro continue valendo em junho sem ninguém notar."
        acoes={
          <div className="flex flex-wrap items-center gap-3">
            <Etiqueta tom="oliva">Demonstração</Etiqueta>
            <NovoIngrediente categorias={categorias} />
          </div>
        }
      />

      <FaixaDemonstracao oQue="Os ingredientes, os preços e os fornecedores desta tela são inventados para demonstração. Nenhum valor corresponde a um fornecedor real." />

      <Secao
        rotulo={`${ordenados.length} de ${ingredientes.length}`}
        titulo="Insumos"
        descricao="Ordenados pelo mais recentemente atualizado. A biblioteca é compartilhada entre clientes: o mesmo insumo tem um preço só, com a data em que aquele preço valeu."
      >
        <BarraFiltros
          base="/ingredientes"
          valores={{ q: busca, categoria: fCategoria, fornecedor: fFornecedor }}
          busca="q"
          placeholderBusca="Nome do insumo…"
          selecoes={[
            {
              chave: "categoria",
              rotulo: "Categoria",
              opcoes: categorias.map((c) => ({ valor: c, texto: c })),
            },
            {
              chave: "fornecedor",
              rotulo: "Fornecedor",
              opcoes: fornecedores.map((f) => ({ valor: f, texto: f })),
            },
          ]}
          acoes={
            <BotaoLink href="/fichas" variante="secundario" tamanho="sm">
              Ver fichas
            </BotaoLink>
          }
        />

        <div className="mt-5">
          <ListaResponsiva
            itens={ordenados}
            colunas={colunas}
            href={(i) => `/ingredientes/${i.id}`}
            vazio={
              ingredientes.length === 0 ? (
                <EstadoVazio
                  titulo="A biblioteca está vazia"
                  descricao="A biblioteca vai sendo montada conforme as fichas são escritas: cada insumo que entra numa ficha entra aqui, com o preço daquele dia."
                />
              ) : (
                <EstadoVazio
                  titulo="Nenhum insumo com esses filtros"
                  descricao="Existem insumos cadastrados, mas nenhum bate com a combinação atual."
                  acao={
                    <BotaoLink href="/ingredientes" variante="secundario" tamanho="sm">
                      Limpar filtros
                    </BotaoLink>
                  }
                />
              )
            }
          />
        </div>
      </Secao>

      <Secao
        rotulo="Por que a data importa"
        titulo="O preço sem data não serve para nada"
        descricao="É a diferença entre uma planilha de preços e um histórico de preços."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-red-800/50 bg-[rgba(153,27,27,0.04)] px-4 py-4">
            <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
              Preço sem data
            </p>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              A mussarela está R$ 42,90. Não se sabe desde quando. Se esse número
              entrou na ficha em março e o insumo subiu em maio, o custo do prato
              está errado há dois meses — e ninguém tem como perceber olhando a
              ficha.
            </p>
          </div>

          <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-4">
            <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
              Preço com data
            </p>
            <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              A mussarela está R$ 42,90 desde 09 de setembro, antes R$ 39,50
              desde 08 de agosto. Aí dá para ver a alta, saber em que fichas
              aquele preço entrou, e decidir se é hora de revisar.
            </p>
          </div>
        </div>
      </Secao>
    </div>
  );
}

/**
 * O preço atual, com a variação em relação ao anterior.
 *
 * A variação é uma SUBTRAÇÃO — não é alerta, não é nota, não tem cor de
 * alarme. Sobe ou desce com o mesmo tratamento visual, porque o que é
 * "caro" ou "preocupante" depende do prato e do cliente, e essa leitura
 * não é do sistema.
 */
function PrecoAtual({ ingrediente }: { ingrediente: Ingrediente }) {
  if (ingrediente.precoAtual === null) {
    return <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem preço</span>;
  }

  const anterior: PrecoIngrediente | undefined = ingrediente.historico[0];
  const variacao =
    anterior && anterior.valor > 0
      ? ((ingrediente.precoAtual - anterior.valor) / anterior.valor) * 100
      : null;

  return (
    <span className="tabular text-[0.9375rem] text-tinta">
      R$ {ingrediente.precoAtual.toFixed(2).replace(".", ",")}
      {variacao !== null ? (
        <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
          {variacao > 0 ? "+" : ""}
          {variacao.toFixed(1).replace(".", ",")}% desde o anterior
        </span>
      ) : null}
    </span>
  );
}
