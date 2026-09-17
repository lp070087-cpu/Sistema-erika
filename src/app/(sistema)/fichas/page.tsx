import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { AvisoMetodologia } from "@/components/ui/jornada";
import { BarraFiltros } from "@/components/ui/filtros";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import {
  ROTULO_SITUACAO_FICHA,
  TOM_SITUACAO_FICHA,
  contarFichas,
  dataCurta,
  obterRepositorioOperacao,
} from "@/lib/dados";
import type { Ficha, SituacaoFicha } from "@/lib/dados";
import { NovaFicha } from "./nova";

export const metadata: Metadata = { title: "Fichas técnicas" };

/**
 * FICHAS TÉCNICAS — a biblioteca, sem o motor de cálculo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA BIBLIOTECA MOSTRA                                          │
 * │                                                                      │
 * │ Nome do prato, categoria, cliente, rendimento, última atualização e   │
 * │ situação. Tudo isso é FATO declarado: alguém pesou, alguém contou as  │
 * │ porções, alguém informou a data.                                       │
 * │                                                                      │
 * │ O que ela NÃO mostra é custo. Toda ficha aqui tem `custo: null` no    │
 * │ item, e `situacaoCalculo: PENDENTE_METODOLOGIA` — porque o cálculo    │
 * │ depende dos pontos 4, 5, 6 e 19, que seguem abertos.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A SITUAÇÃO É TÃO IMPORTANTE AQUI                             │
 * │                                                                      │
 * │ "3 de 12 fichas fechadas" só é informação útil se der para saber      │
 * │ QUAIS três. A situação na linha responde isso sem precisar abrir a    │
 * │ ficha: completa, aguardando dados ou em revisão.                      │
 * │                                                                      │
 * │ E é onde a demonstração fica convincente: a lista tem fichas em       │
 * │ estados diferentes, porque é assim que a biblioteca de um cliente     │
 * │ real fica depois de dois meses de trabalho.                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = {
  searchParams: Promise<{ q?: string; situacao?: string; cliente?: string; categoria?: string }>;
};

export default async function PaginaFichas({ searchParams }: Props) {
  const { q, situacao, cliente, categoria } = await searchParams;
  const operacao = obterRepositorioOperacao();

  const [fichas, clientes, ingredientes] = await Promise.all([
    operacao.listarFichas(),
    operacao.listarClientes(),
    // A ficha só pode usar insumos que já existem no acervo de ingredientes.
    // Sem a lista, o formulário ofereceria um campo de texto livre para o
    // nome do insumo — e aí "mussarela", "Mussarela" e "queijo mussarela"
    // virariam três ingredientes diferentes no mesmo prato.
    operacao.listarIngredientes(),
  ]);

  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  // As categorias saem dos próprios dados — não de uma lista fixa no código,
  // que ficaria desatualizada na primeira ficha de categoria nova.
  const categorias = [...new Set(fichas.map((f) => f.categoria))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  const SITUACOES: readonly SituacaoFicha[] = ["COMPLETA", "AGUARDANDO_DADOS", "EM_REVISAO"];

  const busca = (q ?? "").trim().toLowerCase();
  const fSituacao = SITUACOES.includes(situacao as SituacaoFicha)
    ? (situacao as SituacaoFicha)
    : "";
  const fCliente = clientes.some((c) => c.id === cliente) ? (cliente as string) : "";
  const fCategoria = categorias.includes(categoria ?? "") ? (categoria as string) : "";

  const filtradas = fichas.filter((f) => {
    if (fSituacao && f.situacao !== fSituacao) return false;
    if (fCliente && f.clienteId !== fCliente) return false;
    if (fCategoria && f.categoria !== fCategoria) return false;
    if (busca) {
      const dono = clientePorId.get(f.clienteId);
      const alvo = `${f.nome} ${f.categoria} ${dono?.nomeFantasia ?? ""}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });

  const contagem = contarFichas(fichas);

  const colunas: ColunaLista<Ficha>[] = [
    {
      chave: "nome",
      titulo: "Prato",
      destaque: true,
      noCartao: "topo",
      valor: (f) => (
        <>
          <span className="block text-[0.9375rem] font-medium text-tinta">{f.nome}</span>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {f.categoria}
          </span>
        </>
      ),
    },
    {
      chave: "cliente",
      titulo: "Cliente",
      noCartao: "linha",
      valor: (f) => {
        const dono = clientePorId.get(f.clienteId);
        return dono ? (
          <Link href={`/clientes/${dono.id}`} className="text-[0.875rem] text-oliva hover:underline">
            {dono.nomeFantasia}
          </Link>
        ) : (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">—</span>
        );
      },
    },
    {
      chave: "rendimento",
      titulo: "Rendimento",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (f) =>
        f.rendimentoPorcoes === null ? (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">não declarado</span>
        ) : (
          <span className="text-[0.875rem] text-[var(--tinta-suave)]">
            <span className="tabular">{f.rendimentoPorcoes}</span> porções
            {f.porcaoGramas !== null ? (
              <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)] tabular">
                {f.porcaoGramas} g cada
              </span>
            ) : null}
          </span>
        ),
    },
    {
      chave: "itens",
      titulo: "Ingredientes",
      align: "dir",
      ocultaEm: "md",
      noCartao: "linha",
      valor: (f) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {f.itens.length}
        </span>
      ),
    },
    {
      chave: "atualizada",
      titulo: "Última atualização",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (f) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {dataCurta(f.atualizadaEm)}
        </span>
      ),
    },
    {
      chave: "situacao",
      titulo: "Situação",
      noCartao: "linha",
      valor: (f) => (
        <Etiqueta tom={TOM_SITUACAO_FICHA[f.situacao]}>
          {ROTULO_SITUACAO_FICHA[f.situacao]}
        </Etiqueta>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Técnico"
        titulo="Fichas técnicas"
        descricao="O acervo de pratos de cada cliente: o que leva, quanto rende e como é montado. É o documento que faz o prato sair igual independente de quem está no turno."
        acoes={
          <div className="flex flex-wrap items-center gap-3">
            <Etiqueta tom="oliva">Demonstração</Etiqueta>
            <NovaFicha
              clientes={clientes.map((c) => ({ id: c.id, nome: c.nomeFantasia }))}
              ingredientes={ingredientes.map((i) => ({
                id: i.id,
                nome: i.nome,
                unidade: i.unidade,
              }))}
              categorias={categorias}
            />
          </div>
        }
      />

      <FaixaDemonstracao oQue="As fichas desta tela são inventadas para demonstração. Os rendimentos e as quantidades são declarados — nenhum deles foi medido pelo sistema." />

      {/* Contagens por situação — números que se conferem contra a lista. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Contagem rotulo="Fichas no acervo" valor={contagem.total} />
        <Contagem rotulo="Completas" valor={contagem.completas} tom="verde" />
        <Contagem rotulo="Aguardando dados" valor={contagem.aguardandoDados} tom="dourado" />
        <Contagem rotulo="Em revisão" valor={contagem.emRevisao} />
      </div>

      <AvisoMetodologia>
        Nesta biblioteca não aparece custo, CMV nem preço sugerido — nem por
        ficha, nem no total. O cálculo depende de decisões de metodologia que
        ainda não foram tomadas (fator de correção, índice de cocção,
        arredondamento), e um número inventado aqui teria a mesma aparência de
        um número certo. O que a biblioteca mostra é o que existe de fato: as
        quantidades declaradas e o rendimento informado.
      </AvisoMetodologia>

      <Secao
        rotulo={`${filtradas.length} de ${fichas.length}`}
        titulo="Acervo"
        descricao="Ordenado pela última atualização, da mais recente para a mais antiga."
      >
        <BarraFiltros
          base="/fichas"
          valores={{ q: busca, situacao: fSituacao, cliente: fCliente, categoria: fCategoria }}
          busca="q"
          placeholderBusca="Prato, categoria ou cliente…"
          selecoes={[
            {
              chave: "cliente",
              rotulo: "Cliente",
              opcoes: clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia })),
            },
            {
              chave: "categoria",
              rotulo: "Categoria",
              opcoes: categorias.map((c) => ({ valor: c, texto: c })),
            },
            {
              chave: "situacao",
              rotulo: "Situação",
              opcoes: SITUACOES.map((s) => ({ valor: s, texto: ROTULO_SITUACAO_FICHA[s] })),
            },
          ]}
          acoes={
            <BotaoLink href="/ingredientes" variante="secundario" tamanho="sm">
              Ver ingredientes
            </BotaoLink>
          }
        />

        <div className="mt-5">
          <ListaResponsiva
            itens={filtradas}
            colunas={colunas}
            href={(f) => `/fichas/${f.id}`}
            vazio={
              fichas.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhuma ficha no acervo"
                  descricao="A ficha nasce da conferência na cozinha: o que leva, quanto rende e como se monta. É o primeiro documento que a consultoria escreve depois do diagnóstico."
                />
              ) : (
                <EstadoVazio
                  titulo="Nenhuma ficha com esses filtros"
                  descricao="Existem fichas no acervo, mas nenhuma bate com a combinação atual."
                  acao={
                    <BotaoLink href="/fichas" variante="secundario" tamanho="sm">
                      Limpar filtros
                    </BotaoLink>
                  }
                />
              )
            }
          />
        </div>
      </Secao>
    </div>
  );
}

function Contagem({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: number;
  tom?: "dourado" | "verde";
}) {
  const cor =
    valor === 0
      ? "text-[var(--tinta-fraca)]"
      : tom === "dourado"
        ? "text-[#8a6d1f]"
        : tom === "verde"
          ? "text-medio"
          : "text-tinta";

  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5">
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </p>
      <p className={`mt-1.5 tabular text-[1.5rem] leading-none ${cor}`}>{valor}</p>
    </div>
  );
}
