"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Etiqueta } from "@/components/ui/indicador";
import { BotaoLink } from "@/components/ui/botao";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { BarraFiltros } from "@/components/ui/filtros";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import {
  ROTULO_SITUACAO_FICHA,
  TOM_SITUACAO_FICHA,
  dataCurta,
  desdeQuando,
  resolverItem,
  resumoDaFicha,
  valorEmReais,
} from "@/lib/dados";
import type {
  ClienteOperacao as Cliente,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
  SituacaoFicha,
} from "@/lib/dados";
import {
  estadoDePrecoDaBiblioteca,
  fichaDaSessao,
  fichaDaSessaoNova,
  fichasDaSessao,
  ingredientesDaSessao,
  precosDeClienteDaSessao,
} from "@/lib/dados/demonstracao";
import { NovaFicha } from "./nova";

/**
 * O ACERVO DE FICHAS — a lista que responde ao que foi criado e editado.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA LISTA É DE CLIENTE                                      │
 * │                                                                      │
 * │ Por dois motivos, e o segundo é novo nesta fase.                      │
 * │                                                                      │
 * │ O primeiro é o de sempre: o servidor entrega o cenário e não sabe que  │
 * │ alguém criou uma ficha ou mexeu no rendimento. Sem a sobreposição, a   │
 * │ ficha recém-criada apareceria no acervo só depois de um recarregar —   │
 * │ o que na prática significa nunca, porque recarregar também apaga.      │
 * │                                                                      │
 * │ O segundo: o CUSTO de cada ficha depende do preço de cada insumo, e    │
 * │ esse preço pode ter sido atualizado nesta sessão. Uma lista que         │
 * │ calculasse com o preço do cenário mostraria um custo diferente do que   │
 * │ a ficha mostra ao ser aberta — dois números para o mesmo prato, e o     │
 * │ errado seria o da lista, que é onde se comparam os pratos.             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CUSTO AQUI É PARCIAL, E A LISTA DIZ ISSO                           │
 * │                                                                      │
 * │ Uma ficha com linha sem preço tem custo menor do que o real. Mostrar   │
 * │ esse número sem marca seria pior do que não mostrar nada: a consultora │
 * │ compararia dois pratos, um completo e outro pela metade, e concluiria   │
 * │ que o segundo é mais barato.                                          │
 * │                                                                      │
 * │ Então quando há linha fora da soma aparece um sinal ao lado do valor,  │
 * │ e o custo por porção não é mostrado — dividir um piso por doze daria   │
 * │ um número com cara de custo por porção.                                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CÁLCULO PASSOU A ACONTECER AQUI, E ISSO MERECE JUSTIFICATIVA        │
 * │                                                                      │
 * │ N fichas × M ingredientes é N×M resoluções por render. Parece caro, e  │
 * │ não é: o acervo de um cliente tem dezenas de fichas e a biblioteca     │
 * │ tem dezenas de insumos, com a resolução sendo comparação de strings e  │
 * │ multiplicação.                                                        │
 * │                                                                      │
 * │ A alternativa — guardar o custo dentro de `Ficha` — seria pior: um     │
 * │ campo derivado gravado no dado envelhece no instante em que o preço do │
 * │ insumo muda, e o acervo passaria a mostrar custos de ontem sem avisar. │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const SITUACOES: readonly SituacaoFicha[] = ["COMPLETA", "AGUARDANDO_DADOS", "EM_REVISAO"];

export function AcervoDeFichas({
  doCenario,
}: {
  doCenario: {
    fichas: readonly Ficha[];
    clientes: readonly Cliente[];
    ingredientes: readonly Ingrediente[];
    precosPorCliente: readonly { clienteId: string; precos: readonly IngredienteDoCliente[] }[];
  };
}) {
  // Assina o estado demonstrativo: criar ou editar uma ficha repinta a lista.
  useDemonstracao();

  const [busca, setBusca] = useState("");
  const [cliente, setCliente] = useState("");
  const [categoria, setCategoria] = useState("");
  const [situacao, setSituacao] = useState("");

  /*
    ── A BIBLIOTECA DE INSUMOS, COM O PREÇO DE HOJE ────────────────────────
    Mesma sobreposição da tela de ingredientes: o preço atualizado nesta
    sessão vale aqui também. Sem isso, o custo da ficha mudaria ao abri-la,
    e a lista teria ficado mostrando outro número.
  */
  const insumos = useMemo(() => {
    const idsDaSessao = new Set(ingredientesDaSessao().map((i) => i.id));

    const doCenarioAjustado = doCenario.ingredientes
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

    return new Map(
      [...ingredientesDaSessao(), ...doCenarioAjustado].map((i) => [i.id, i])
    );
  }, [doCenario.ingredientes]);

  /*
    ── OS PREÇOS DE CADA CLIENTE ──────────────────────────────────────────
    Um índice por cliente, com o que o repositório sabe MAIS o que foi
    digitado nesta sessão. Os dois ficam separados por cliente — é a regra
    do §6, e é o que impede o preço de um cliente de entrar no custo de
    outro.
  */
  const precosPorCliente = useMemo(() => {
    const indice = new Map<string, Map<string, IngredienteDoCliente>>();

    for (const entrada of doCenario.precosPorCliente) {
      indice.set(entrada.clienteId, new Map(entrada.precos.map((p) => [p.ingredienteId, p])));
    }

    for (const cli of doCenario.clientes) {
      const daSessao = precosDeClienteDaSessao(
        cli.id,
        (ingredienteId) => insumos.get(ingredienteId)?.unidade ?? null
      );
      if (daSessao.size === 0) continue;
      const atual = indice.get(cli.id) ?? new Map<string, IngredienteDoCliente>();
      for (const [ingredienteId, registro] of daSessao) {
        atual.set(ingredienteId, registro);
      }
      indice.set(cli.id, atual);
    }

    return indice;
  }, [doCenario.clientes, doCenario.precosPorCliente, insumos]);

  /*
    ── O ACERVO, COM O QUE FOI MEXIDO ─────────────────────────────────────
    As fichas criadas nesta sessão entram no topo; as alteradas substituem a
    versão do cenário. `fichaDaSessao` aplica a mesma regra de mesclagem que
    a tela da ficha usa — itens substituem, cabeçalho mescla.
  */
  const acervo = useMemo(() => {
    const novas = fichasDaSessao();
    const idsNovas = new Set(novas.map((f) => f.id));

    const doCenarioAjustado = doCenario.fichas
      .filter((f) => !idsNovas.has(f.id))
      .map((f) => fichaDaSessao(f));

    return [...novas, ...doCenarioAjustado].sort(
      (a, b) => b.atualizadaEm.getTime() - a.atualizadaEm.getTime()
    );
  }, [doCenario.fichas]);

  const clientePorId = useMemo(
    () => new Map(doCenario.clientes.map((c) => [c.id, c])),
    [doCenario.clientes]
  );

  /**
   * O CUSTO DE UMA FICHA — calculado com o mesmo motor que a ficha usa.
   *
   * Uma conta escrita aqui poderia divergir da tela da ficha: bastaria ela
   * escolher outra etapa para a linha, ou esquecer a precedência do preço do
   * cliente. `resolverItem` é o único lugar que decide isso.
   */
  const custoDe = useMemo(() => {
    return (ficha: Ficha) => {
      const precos = precosPorCliente.get(ficha.clienteId);
      const resolvidos = ficha.itens.map((item) =>
        resolverItem(
          item,
          insumos.get(item.ingredienteId) ?? null,
          precos?.get(item.ingredienteId) ?? null
        )
      );
      return resumoDaFicha(resolvidos, ficha);
    };
  }, [insumos, precosPorCliente]);

  const categorias = useMemo(
    () => [...new Set(acervo.map((f) => f.categoria))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [acervo]
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return acervo.filter((f) => {
      if (cliente && f.clienteId !== cliente) return false;
      if (categoria && f.categoria !== categoria) return false;
      if (situacao && f.situacao !== situacao) return false;
      if (termo) {
        const dono = clientePorId.get(f.clienteId);
        const alvo = `${f.nome} ${f.categoria} ${dono?.nomeFantasia ?? ""}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  }, [acervo, busca, categoria, cliente, situacao, clientePorId]);

  const contagem = useMemo(
    () => ({
      total: acervo.length,
      completas: acervo.filter((f) => f.situacao === "COMPLETA").length,
      aguardandoDados: acervo.filter((f) => f.situacao === "AGUARDANDO_DADOS").length,
      emRevisao: acervo.filter((f) => f.situacao === "EM_REVISAO").length,
    }),
    [acervo]
  );

  const colunas: ColunaLista<Ficha>[] = [
    {
      chave: "nome",
      titulo: "Prato",
      destaque: true,
      noCartao: "topo",
      valor: (f) => (
        <>
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-[0.9375rem] font-medium text-tinta">{f.nome}</span>
            {fichaDaSessaoNova(f.id) ? <Etiqueta tom="dourado">nesta sessão</Etiqueta> : null}
          </span>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {f.categoria}
          </span>
        </>
      ),
    },
    {
      chave: "cliente",
      titulo: "Cliente",
      ocultaEm: "md",
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
      chave: "custoTotal",
      titulo: "Custo da ficha",
      align: "dir",
      noCartao: "linha",
      valor: (f) => {
        const resumo = custoDe(f);
        if (resumo.vazio) {
          return (
            <span className="text-[0.875rem] text-[var(--tinta-fraca)]">
              sem linhas a somar
            </span>
          );
        }
        return (
          <span className="tabular text-[0.9375rem] text-tinta">
            {valorEmReais(resumo.custoTotal)}
            {!resumo.completo ? (
              <span className="mt-0.5 block text-[0.75rem] text-[#8a6d1f]">
                parcial — {resumo.itensFora}{" "}
                {resumo.itensFora === 1 ? "linha fora" : "linhas fora"}
              </span>
            ) : (
              <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                {resumo.itensSomados} de {f.itens.length} linhas
              </span>
            )}
          </span>
        );
      },
    },
    {
      chave: "custoPorcao",
      titulo: "Por porção",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (f) => {
        const resumo = custoDe(f);
        if (resumo.custoPorPorcao === null) {
          return (
            <span className="text-[0.875rem] text-[var(--tinta-fraca)]">
              {resumo.vazio
                ? "—"
                : f.rendimentoPorcoes === null
                  ? "falta o rendimento"
                  : "falta fechar a soma"}
            </span>
          );
        }
        return (
          <span className="tabular text-[0.9375rem] text-tinta">
            {valorEmReais(resumo.custoPorPorcao)}
          </span>
        );
      },
    },
    {
      chave: "itens",
      titulo: "Ingredientes",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (f) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">{f.itens.length}</span>
      ),
    },
    {
      chave: "atualizada",
      titulo: "Última atualização",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (f) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">
          {desdeQuando(f.atualizadaEm)}
          <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)] tabular">
            {dataCurta(f.atualizadaEm)}
          </span>
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
    <>
      <div className="flex flex-wrap items-center justify-end">
        <NovaFicha
          clientes={doCenario.clientes.map((c) => ({ id: c.id, nome: c.nomeFantasia }))}
          ingredientes={[...insumos.values()]}
          categorias={categorias}
        />
      </div>

      {/* Contagens por situação — números que se conferem contra a lista. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Contagem rotulo="Fichas no acervo" valor={contagem.total} />
        <Contagem rotulo="Completas" valor={contagem.completas} tom="verde" />
        <Contagem rotulo="Aguardando dados" valor={contagem.aguardandoDados} tom="dourado" />
        <Contagem rotulo="Em revisão" valor={contagem.emRevisao} />
      </div>

      <Secao
        rotulo={`${filtradas.length} de ${acervo.length}`}
        titulo="Acervo"
        descricao="Ordenado pela última atualização. O custo de cada ficha é somado a partir do preço dos insumos que ela usa — quando há linha sem preço ou sem peso, o total aparece marcado como parcial."
      >
        <BarraFiltros
          base="/fichas"
          valores={{ q: busca, situacao, cliente, categoria }}
          busca="q"
          placeholderBusca="Prato, categoria ou cliente…"
          selecoes={[
            {
              chave: "cliente",
              rotulo: "Cliente",
              opcoes: doCenario.clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia })),
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
              acervo.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhuma ficha no acervo"
                  descricao="A ficha nasce da conferência na cozinha: o que leva, quanto rende e como se monta. É o primeiro documento que a consultoria escreve depois do diagnóstico."
                />
              ) : (
                <EstadoVazio
                  titulo="Nenhuma ficha com esses filtros"
                  descricao="Existem fichas no acervo, mas nenhuma bate com a combinação atual."
                  acao={
                    <button
                      type="button"
                      onClick={() => {
                        setBusca("");
                        setCliente("");
                        setCategoria("");
                        setSituacao("");
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
    </>
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
