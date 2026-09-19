"use client";

import { useMemo, useState } from "react";
import { Etiqueta } from "@/components/ui/indicador";
import { BotaoLink } from "@/components/ui/botao";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { BarraFiltros } from "@/components/ui/filtros";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { dataCurta, desdeQuando, valorEmReais } from "@/lib/dados";
import type { Ingrediente, PrecoIngrediente } from "@/lib/dados";
import {
  estadoDePrecoDaBiblioteca,
  ingredientesDaSessao,
} from "@/lib/dados/demonstracao";
import { NovoIngrediente } from "./novo";

/**
 * A BIBLIOTECA DE INGREDIENTES — a lista que responde ao que foi digitado.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA LISTA É DE CLIENTE                                      │
 * │                                                                      │
 * │ A página é de servidor: ela lê o repositório, monta a lista e passa   │
 * │ o HTML pronto. O que ela não pode fazer é reagir a uma edição de      │
 * │ preço — o servidor não sabe que alguém clicou em "salvar".            │
 * │                                                                      │
 * │ Então o servidor entrega o CENÁRIO, e este componente sobrepõe o que  │
 * │ foi mexido nesta sessão: um preço novo no lugar do antigo, um insumo  │
 * │ cadastrado agora entrando na lista na hora certa.                     │
 * │                                                                      │
 * │ O SERVIDOR NÃO É CONTORNADO: ele continua sendo a fonte de tudo o que │
 * │ não foi tocado. É por isso que a sobreposição acontece em                │
 * │ `ingredientesVisiveis` e não numa cópia do array.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O INSUMO DA SESSÃO ENTRA NO TOPO, E ISSO É DE PROPÓSITO               │
 * │                                                                      │
 * │ A lista é ordenada por "atualizado há menos tempo". Um insumo         │
 * │ cadastrado agora tem o carimbo de agora, então ele cai naturalmente   │
 * │ no topo pela MESMA regra dos outros — não por um caso especial.        │
 * │                                                                      │
 * │ Isso importa porque quem acabou de cadastrar precisa conferir o que   │
 * │ cadastrou. Se ele aparecesse no fim da lista, a pessoa ficaria         │
 * │ procurando o próprio trabalho — e concluiria que não salvou.          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A MARCA "NESTA SESSÃO"                                              │
 * │                                                                      │
 * │ Um insumo cadastrado agora PARECE um insumo do cenário: mesma linha,  │
 * │ mesmo tipo de dado. A marca é o que distingue os dois — sem ela, a    │
 * │ consultora não teria como saber o que veio de onde, e o "nada é       │
 * │ gravado" viraria uma surpresa em vez de uma informação.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */

// ---------------------------------------------------------------------------

/** O preço atual, com a variação em relação ao anterior. */
function PrecoAtual({
  preco,
  anterior,
  unidade,
}: {
  preco: number | null;
  anterior: PrecoIngrediente | null;
  unidade: string;
}) {
  if (preco === null) {
    return <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem preço</span>;
  }

  const variacao =
    anterior && anterior.valor > 0 ? ((preco - anterior.valor) / anterior.valor) * 100 : null;

  return (
    <span className="tabular text-[0.9375rem] text-tinta">
      {valorEmReais(preco)}
      <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
        {variacao === null
          ? `por ${unidade} · primeiro registro`
          : `${variacao > 0 ? "+" : ""}${variacao
              .toFixed(1)
              .replace(".", ",")}% desde o anterior`}
      </span>
    </span>
  );
}

export function ListaDeIngredientes({
  doCenario,
  buscaInicial = "",
}: {
  doCenario: readonly Ingrediente[];
  /** O termo que veio da URL, para o campo de busca já abrir preenchido. */
  buscaInicial?: string;
}) {
  // Assina o estado demonstrativo: uma edição de preço repinta a lista.
  useDemonstracao();

  const [categoria, setCategoria] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [busca, setBusca] = useState(buscaInicial);

  /*
    ── A SOBREPOSIÇÃO ──────────────────────────────────────────────────────

    Cada insumo do cenário pode ter sido alterado nesta sessão. O preço
    vigente passa a ser o do store quando existe; o histórico passa a ser o
    que o store acumulou, para que o preço anterior na tabela seja o que ela
    acabou de substituir — e não o do cenário.
  */
  const visiveis = useMemo(() => {
    const idsDaSessao = new Set(ingredientesDaSessao().map((i) => i.id));

    const doCenarioAjustado = doCenario
      .filter((i) => !idsDaSessao.has(i.id))
      .map((i) => {
        const estado = estadoDePrecoDaBiblioteca(i.id);
        if (estado === null) return i;
        return {
          ...i,
          precoAtual: estado.atual.valor,
          atualizadoEm: estado.atual.em,
          fornecedor: estado.atual.fornecedor || i.fornecedor,
          historico: estado.historico,
        };
      });

    return [...ingredientesDaSessao(), ...doCenarioAjustado].sort(
      (a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime()
    );
  }, [doCenario]);

  const categorias = useMemo(
    () =>
      [...new Set([...visiveis.map((i) => i.categoria)])].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [visiveis]
  );

  const fornecedores = useMemo(
    () =>
      [...new Set(visiveis.map((i) => i.fornecedor).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b, "pt-BR")
      ),
    [visiveis]
  );

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return visiveis.filter((i) => {
      if (categoria && i.categoria !== categoria) return false;
      if (fornecedor && i.fornecedor !== fornecedor) return false;
      if (termo && !i.nome.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [visiveis, busca, categoria, fornecedor]);

  const colunas: ColunaLista<Ingrediente>[] = [
    {
      chave: "nome",
      titulo: "Ingrediente",
      destaque: true,
      noCartao: "topo",
      valor: (i) => (
        <>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[0.9375rem] font-medium text-tinta">{i.nome}</span>
            {i.id.startsWith("in_demo_") ? (
              <Etiqueta tom="dourado">nesta sessão</Etiqueta>
            ) : null}
          </span>
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
      valor: (i) => (
        <PrecoAtual
          preco={i.precoAtual}
          anterior={i.historico[0] ?? null}
          unidade={i.unidade}
        />
      ),
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
            {valorEmReais(anterior.valor)}
            <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
              {dataCurta(anterior.em)}
            </span>
          </span>
        );
      },
    },
    {
      chave: "rendimento",
      titulo: "Rendimento",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (i) => <ResumoRendimento ingrediente={i} />,
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
    <Secao
      rotulo={`${filtrados.length} de ${visiveis.length}`}
      titulo="Insumos"
      descricao="Ordenados pelo mais recentemente atualizado. A biblioteca é compartilhada entre clientes: o mesmo insumo tem um preço de referência, com a data em que passou a valer — e cada cliente pode ter um preço próprio, que fica na ficha dele."
      acoes={<NovoIngrediente categorias={categorias} />}
    >
      <BarraFiltros
        base="/ingredientes"
        valores={{ q: busca, categoria, fornecedor }}
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

      {/*
        A BUSCA É LOCAL, e o filtro de categoria também.

        Isso não contradiz a regra "o filtro vive na URL" que governa o resto
        do sistema — é uma diferença de contexto. Naquela, a lista vem do
        servidor a cada troca de filtro, e a URL é o que sobrevive ao recarregar.
        Aqui a lista JÁ ESTÁ INTEIRA na tela: filtrar no servidor seria uma ida
        e volta para esconder linhas que já chegaram.

        O botão de filtros da URL continua existindo e continua funcionando —
        ele é o que faz o filtro sobreviver a um recarregamento.
      */}
      <div className="mt-5">
        <ListaResponsiva
          itens={filtrados}
          colunas={colunas}
          href={(i) => `/ingredientes/${i.id}`}
          vazio={
            visiveis.length === 0 ? (
              <EstadoVazio
                titulo="A biblioteca está vazia"
                descricao="A biblioteca vai sendo montada conforme as fichas são escritas: cada insumo que entra numa ficha entra aqui, com o preço daquele dia."
              />
            ) : (
              <EstadoVazio
                titulo="Nenhum insumo com esses filtros"
                descricao="Existem insumos cadastrados, mas nenhum bate com a combinação atual."
                acao={
                  <button
                    type="button"
                    onClick={() => {
                      setBusca("");
                      setCategoria("");
                      setFornecedor("");
                    }}
                    className="text-[0.8125rem] text-oliva hover:text-tinta"
                  >
                    Limpar os filtros
                  </button>
                }
              />
            )
          }
        />
      </div>
    </Secao>
  );
}

/**
 * O rendimento em uma linha, para dentro da tabela.
 *
 * Lê o mesmo `derivarTransformacao` do fluxo grande — não há segunda conta.
 * Aqui só cabe a versão curta: "5,000 → 4,000 kg (80,0%)".
 */
function ResumoRendimento({ ingrediente }: { ingrediente: Ingrediente }) {
  const t = ingrediente.transformacao;
  const bruto = t.bruto;
  const final = t.preparado ?? t.limpo;

  if (!bruto) {
    return (
      <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">sem pesagem</span>
    );
  }

  const pct = final && bruto.peso > 0 ? (final.peso / bruto.peso) * 100 : null;

  return (
    <span className="tabular text-[0.8125rem] text-[var(--tinta-suave)]">
      {bruto.peso.toFixed(3).replace(".", ",")}
      {final ? ` → ${final.peso.toFixed(3).replace(".", ",")}` : null}
      {pct !== null ? (
        <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
          {pct.toFixed(1).replace(".", ",")}% de rendimento
        </span>
      ) : null}
    </span>
  );
}
