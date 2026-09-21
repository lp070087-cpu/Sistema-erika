"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Etiqueta } from "@/components/ui/indicador";
import { BotaoLink } from "@/components/ui/botao";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import {
  ROTULO_SITUACAO_FICHA,
  TOM_SITUACAO_FICHA,
  contarFichas,
  dataCurta,
  resolverItem,
  resumoDaFicha,
  valorEmReais,
} from "@/lib/dados";
import type {
  ClienteOperacao,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
} from "@/lib/dados";
import {
  acervoDeFichas,
  estadoDePrecoDaBiblioteca,
  fichaDaSessaoNova,
  ingredientesDaSessao,
  precosDeClienteDaSessao,
} from "@/lib/dados/demonstracao";
import { NovaFicha } from "../../../fichas/nova";

/**
 * ABA 4 — AS FICHAS TÉCNICAS DESTE CLIENTE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA ABA PASSOU A SER DE CLIENTE                             │
 * │                                                                      │
 * │ Ela era um componente de servidor que listava o acervo do cliente.     │
 * │ Listava certo — o acervo de antes.                                    │
 * │                                                                      │
 * │ Duas coisas passaram a acontecer no navegador: criar uma ficha, e      │
 * │ atualizar o preço de um insumo. Nenhuma das duas o servidor fica       │
 * │ sabendo. Sem assinar o estado da sessão, esta aba seria a única do     │
 * │ sistema a mostrar o acervo velho — e é justamente a aba onde a         │
 * │ consultora trabalha.                                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE MUDOU NA COLUNA DE CUSTO, E POR QUE ELA PÔDE APARECER           │
 * │                                                                      │
 * │ Antes, esta aba dizia que "custo por porção dependeria do índice de    │
 * │ cocção, do fator de correção e do arredondamento" — e por isso não     │
 * │ existia coluna de custo.                                              │
 * │                                                                      │
 * │ A frase era verdadeira para o custo REAL (o que a produção gasta de    │
 * │ fato, com perda e rendimento aplicados por regra profissional). Não é  │
 * │ verdadeira para o que esta coluna mostra: a soma do preço de cada      │
 * │ insumo vezes a quantidade declarada, na etapa em que ela foi medida.   │
 * │                                                                      │
 * │ São dois números diferentes, e o segundo a ficha já calcula. O que     │
 * │ não se pode é chamá-lo de custo real — e é por isso que, quando há      │
 * │ linha fora da soma, o valor aparece marcado como PARCIAL.              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ "NOVA FICHA" MORA AQUI TAMBÉM, E CRIA UMA FICHA DESTE CLIENTE         │
 * │                                                                      │
 * │ O §18 pede que cliente e ficha se alcancem. A forma mais direta é      │
 * │ poder abrir uma ficha sem sair do cliente: quem está revisando o       │
 * │ acervo de um restaurante é quem acabou de voltar da cozinha dele.      │
 * │                                                                      │
 * │ O formulário recebe o cliente já escolhido, e as categorias e os       │
 * │ insumos vêm da biblioteca de verdade — nenhuma lista inventada.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AbaFichas({
  cliente,
  fichas,
  ingredientes,
  precosDoCliente,
}: {
  cliente: ClienteOperacao;
  fichas: readonly Ficha[];
  ingredientes: readonly Ingrediente[];
  precosDoCliente: Map<string, IngredienteDoCliente>;
}) {
  // Assina o estado demonstrativo: criar ou editar uma ficha repinta a aba.
  useDemonstracao();

  /* A biblioteca de insumos com o preço de hoje — mesma sobreposição da
     tela de ingredientes. Sem ela, o custo aqui divergiria do que a ficha
     mostra ao ser aberta. */
  const insumos = useMemo(() => {
    const idsDaSessao = new Set(ingredientesDaSessao().map((i) => i.id));

    const doCenarioAjustado = ingredientes
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

    return new Map([...ingredientesDaSessao(), ...doCenarioAjustado].map((i) => [i.id, i]));
  }, [ingredientes]);

  /* Os preços deste cliente, com o que foi digitado nesta sessão por cima.
     O mapa do repositório é copiado antes: ele vem do servidor, e escrever
     nele seria escrever no objeto que o React recebeu. */
  const precos = useMemo(() => {
    const mapa = new Map(precosDoCliente);
    for (const [ingredienteId, registro] of precosDeClienteDaSessao(
      cliente.id,
      (id) => insumos.get(id)?.unidade ?? null
    )) {
      mapa.set(ingredienteId, registro);
    }
    return mapa;
  }, [precosDoCliente, cliente.id, insumos]);

  /*
    O acervo deste cliente: as fichas do cenário com as alterações da sessão
    aplicadas, mais as criadas agora — que já nascem com o `clienteId` dele,
    então entram naturalmente na mesma lista.

    `fichasVisiveis` tira as excluídas. Sem ele, uma ficha apagada na tela
    dela continuaria aqui: esta aba remonta a lista do cenário, e o cenário
    não sabe do que foi apagado. É o mesmo defeito que a lista de fichas
    tinha — e é por isso que os dois passam pela mesma função.
  */
  const doCliente = useMemo(
    () => acervoDeFichas(fichas, cliente.id),
    [fichas, cliente.id]
  );

  const contagem = useMemo(() => contarFichas(doCliente), [doCliente]);

  const categorias = useMemo(
    () => [...new Set(doCliente.map((f) => f.categoria))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [doCliente]
  );

  const custoDe = useMemo(
    () => (ficha: Ficha) => {
      const resolvidos = ficha.itens.map((item) =>
        resolverItem(
          item,
          insumos.get(item.ingredienteId) ?? null,
          precos.get(item.ingredienteId) ?? null
        )
      );
      return resumoDaFicha(resolvidos, ficha);
    },
    [insumos, precos]
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
      chave: "rendimento",
      titulo: "Rendimento",
      noCartao: "linha",
      valor: (f) =>
        f.rendimentoPorcoes !== null ? (
          <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
            {f.rendimentoPorcoes} {f.rendimentoPorcoes === 1 ? "porção" : "porções"}
            {f.porcaoGramas !== null ? ` · ${f.porcaoGramas} g` : ""}
          </span>
        ) : (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">a definir</span>
        ),
    },
    {
      chave: "custo",
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
                parcial
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      chave: "porcao",
      titulo: "Por porção",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (f) => {
        const resumo = custoDe(f);
        if (resumo.custoPorPorcao === null) {
          return (
            <span className="text-[0.875rem] text-[var(--tinta-fraca)]">
              {f.rendimentoPorcoes === null && !resumo.vazio
                ? "falta o rendimento"
                : "—"}
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
      titulo: "Itens",
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
      chave: "situacao",
      titulo: "Situação",
      noCartao: "linha",
      valor: (f) => (
        <Etiqueta tom={TOM_SITUACAO_FICHA[f.situacao]}>
          {ROTULO_SITUACAO_FICHA[f.situacao]}
        </Etiqueta>
      ),
    },
    {
      chave: "atualizada",
      titulo: "Última atualização",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (f) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {dataCurta(f.atualizadaEm)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Secao
        rotulo="Fichas técnicas"
        titulo={
          doCliente.length === 0
            ? "Nenhuma ficha registrada"
            : `${doCliente.length} ${doCliente.length === 1 ? "ficha" : "fichas"} · ${contagem.completas} completas`
        }
        descricao={`As fichas de ${cliente.nomeFantasia}. Cada uma guarda o que a produção declarou: ingredientes com quantidade e etapa do peso, rendimento, modo de preparo e finalização.`}
        acoes={
          <NovaFicha
            clientes={[{ id: cliente.id, nome: cliente.nomeFantasia }]}
            ingredientes={[...insumos.values()]}
            categorias={categorias}
          />
        }
      >
        <ListaResponsiva
          itens={doCliente}
          colunas={colunas}
          href={(f) => `/fichas/${f.id}`}
          vazio={
            <EstadoVazio
              titulo="Nenhuma ficha técnica ainda"
              descricao="As fichas nascem do levantamento com a produção. Quando a primeira for registrada, ela aparece aqui com o rendimento e os ingredientes declarados."
            />
          }
        />

        {contagem.aguardandoDados > 0 || contagem.emRevisao > 0 ? (
          <p className="mt-5 border-t border-[var(--linha)] pt-4 text-[0.8125rem] text-[var(--tinta-suave)]">
            {contagem.aguardandoDados > 0
              ? `${contagem.aguardandoDados} aguardando dados`
              : null}
            {contagem.aguardandoDados > 0 && contagem.emRevisao > 0 ? " · " : null}
            {contagem.emRevisao > 0 ? `${contagem.emRevisao} em revisão` : null}
            {" — "}
            ficha incompleta não é ficha pela metade: é uma ficha que ainda não
            pode ser usada no passe.
          </p>
        ) : null}
      </Secao>

      {/*
        O QUE O CUSTO DESTA ABA É, E O QUE ELE NÃO É.
        A explicação antiga dizia que não havia custo. Agora há — e o risco
        mudou de lado: o perigo deixou de ser a coluna ausente e passou a ser
        o número ser lido como custo real quando é soma parcial.
      */}
      <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-4">
        <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
          Como ler o custo desta lista
        </p>
        <p className="mt-2 max-w-[80ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          É a soma do preço de cada insumo —{" "}
          <strong className="font-semibold text-tinta">
            o deste cliente quando ele tem preço próprio
          </strong>{" "}
          — vezes a quantidade declarada, na etapa em que ela foi medida. É
          multiplicação e soma sobre números que a produção informou.
        </p>
        <p className="mt-2.5 max-w-[80ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          O que ele <strong className="font-semibold text-tinta">não é</strong>:
          custo real do prato. Fator de correção, índice de cocção, margem de
          segurança e arredondamento continuam dependendo da metodologia da
          Érika, e nenhum deles entrou nesta conta. Quando uma linha fica sem
          preço ou sem peso, o total aparece marcado como parcial — e o custo
          por porção não é mostrado, porque dividir um piso pelas porções daria
          um número menor do que o real com cara de custo por porção.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <BotaoLink href="/fichas" variante="secundario" tamanho="sm">
          Ver a biblioteca de fichas
        </BotaoLink>
        <BotaoLink
          href={`/clientes/${cliente.id}?aba=documentos`}
          variante="linha"
          tamanho="sm"
        >
          Planilhas e documentos
        </BotaoLink>
      </div>

      <p className="text-[0.8125rem] text-[var(--tinta-fraca)]">
        A biblioteca completa de fichas, de todos os clientes, fica em{" "}
        <Link href="/fichas" className="text-oliva hover:underline">
          Fichas técnicas
        </Link>
        . Os insumos desta ficha, com o preço de cada cliente, ficam em{" "}
        <Link href="/ingredientes" className="text-oliva hover:underline">
          Ingredientes
        </Link>
        .
      </p>
    </div>
  );
}
