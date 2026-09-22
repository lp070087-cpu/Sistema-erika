"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { BarraFiltros } from "@/components/ui/filtros";
import { Etiqueta } from "@/components/ui/indicador";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { useAcervoVivo } from "@/components/operacao/use-acervo";
import type { CenarioDoAcervo } from "@/components/operacao/use-acervo";
import { ROTULO_SITUACAO_CARDAPIO, montarLinhasDoCardapio, resumirCardapio } from "@/lib/dados";
import type { Cardapio, SituacaoCardapio } from "@/lib/dados";
import {
  acervoDeCardapios,
  arquivarCardapio,
  desarquivarCardapio,
  excluirCardapio,
} from "@/lib/dados/demonstracao";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { NovoCardapio } from "./novo";
import { EditorDoCardapio } from "./editor";

/**
 * CARDÁPIOS — a lista dos menus de cada cliente.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ CADA LINHA CUSTA UMA MONTAGEM DE CARDÁPIO INTEIRO                     │
 * │                                                                      │
 * │ O resumo de cada cardápio — quantos itens, quantos sem preço, quantos  │
 * │ abaixo do custo — sai de `resumirCardapio`, que percorre TODOS os      │
 * │ itens e resolve o custo de cada ficha. Não existe um campo "quantos    │
 * │ itens sem preço" guardado no cardápio, e não deve existir: seria um    │
 * │ número derivado, congelado, que ficaria errado no dia seguinte sem     │
 * │ ninguém mexer nele.                                                    │
 * │                                                                      │
 * │ O preço disso é que a lista monta tudo uma vez. Com dezenas de         │
 * │ cardápios de dezenas de itens, isso é trabalho de verdade — e é a      │
 * │ troca certa contra mostrar um número que ninguém pode conferir.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type LinhaDaTela = {
  id: string;
  cardapio: Cardapio;
  cliente: string;
  clienteId: string;
  itens: number;
  pratos: number;
  semPreco: number;
  abaixoDoCusto: number;
  pendenciaDeSecao: boolean;
};

export function ListaDeCardapios({ doCenario }: { doCenario: CenarioDoAcervo }) {
  /*
    O acervo vivo é o MESMO das outras telas: preço de insumo da sessão, preço
    por cliente, ficha criada agora. Sem ele, o custo de um prato mudaria entre
    o cardápio e a ficha — e as duas telas estariam certas dentro de si.
  */
  const { clientePorId, acervo, resolver } = useAcervoVivo(doCenario);

  /*
    ── A VERSÃO ENTRA COMO DEPENDÊNCIA, E ISSO NÃO É DETALHE ──────────────
    `acervoDeCardapios` lê o estado do módulo, e o React não tem como saber
    disso: para ele, a função é a mesma de antes. O número que
    `useDemonstracao` devolve é a única coisa que muda quando um cardápio é
    criado, arquivado ou excluído — então ele precisa estar na lista de
    dependências do `useMemo`. Fora dela, criar um cardápio não mudaria o que
    está na tela até um recarregar da página.

    Por que da chave, e não só da dependência: o `doCenario.cardapios` é uma
    constante VAZIA fora do React, então ele NÃO muda de identidade quando um
    cardápio é criado. A lista é reconstruída quando ele muda E quando o
    invalidador muda. O `void` é a leitura que declara isso ao lint — a mesma
    que `cardapios/editor.tsx` já faz.
  */
  const versao = useDemonstracao();

  const [busca, setBusca] = useState("");
  const [cliente, setCliente] = useState("");
  const [situacao, setSituacao] = useState("");
  const [verArquivados, setVerArquivados] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null);

  const cardapios = useMemo(
    () => {
      void versao;
      return acervoDeCardapios(doCenario.cardapios ?? []);
    },
    [doCenario.cardapios, versao]
  );

  /*
    ── AS LINHAS, MONTADAS UMA VEZ ────────────────────────────────────────
    Cada cardápio é montado com o acervo INTEIRO de fichas e o resolvedor
    comum. `montarLinhasDoCardapio` filtra por conta própria o que é do
    cliente certo — uma ficha de outro cliente aparece marcada, e não somada.
  */
  const linhas = useMemo<LinhaDaTela[]>(
    () =>
      cardapios.map((c) => {
        const linhasDoCardapio = montarLinhasDoCardapio({
          cardapio: c,
          fichas: acervo,
          resolver,
        });
        const resumo = resumirCardapio(c, linhasDoCardapio);
        const dono = clientePorId.get(c.clienteId);

        return {
          id: c.id,
          cardapio: c,
          cliente: dono?.nomeFantasia ?? "Cliente não encontrado",
          clienteId: c.clienteId,
          itens: resumo.itens,
          pratos: resumo.pratosDistintos,
          semPreco: resumo.semPreco,
          abaixoDoCusto: resumo.abaixoDoCusto,
          pendenciaDeSecao: resumo.secoes === 0,
        };
      }),
    [cardapios, acervo, resolver, clientePorId]
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return linhas.filter((l) => {
      if (!verArquivados && l.cardapio.situacao === "ARQUIVADO") return false;
      if (cliente && l.clienteId !== cliente) return false;
      if (situacao && l.cardapio.situacao !== situacao) return false;
      if (termo) {
        const alvo = `${l.cardapio.nome} ${l.cliente} ${l.cardapio.descricao}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  }, [linhas, busca, cliente, situacao, verArquivados]);

  const cardapioAberto = useMemo(
    () => cardapios.find((c) => c.id === editando) ?? null,
    [cardapios, editando]
  );

  const colunas: ColunaLista<LinhaDaTela>[] = [
    {
      chave: "nome",
      titulo: "Cardápio",
      destaque: true,
      noCartao: "topo",
      valor: (l) => (
        <>
          <button
            type="button"
            onClick={() => setEditando(l.id)}
            className="text-left text-[0.9375rem] font-medium text-tinta underline-offset-4 hover:underline"
          >
            {l.cardapio.nome}
          </button>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {l.cliente}
          </span>
        </>
      ),
    },
    {
      chave: "itens",
      titulo: "Itens",
      align: "dir",
      noCartao: "linha",
      valor: (l) => (
        <span className="tabular text-[0.9375rem] text-tinta">
          {l.itens}
          {/*
        O prato DISTINTO ao lado do total de itens, e não no lugar dele: as
        duas contagens respondem perguntas diferentes. "8 itens" é quantas
        linhas o cliente lê; "6 pratos" é quantas fichas a consultora mantém.
      */}
          {l.pratos !== l.itens ? (
            <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
              {l.pratos} {l.pratos === 1 ? "prato distinto" : "pratos distintos"}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      chave: "secoes",
      titulo: "Seções",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) => (
        <span className="tabular text-[0.9375rem] text-tinta">
          {l.cardapio.categorias.length}
        </span>
      ),
    },
    {
      chave: "pendencias",
      titulo: "O que falta",
      noCartao: "linha",
      valor: (l) => {
        if (l.itens === 0) {
          return <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem itens</span>;
        }
        if (l.semPreco === 0 && l.abaixoDoCusto === 0 && !l.pendenciaDeSecao) {
          return (
            <span className="text-[0.875rem] text-medio">
              preço e custo informados
            </span>
          );
        }
        return (
          <span className="flex flex-wrap gap-1.5">
            {l.semPreco > 0 ? (
              <Etiqueta tom="dourado">{l.semPreco} sem preço</Etiqueta>
            ) : null}
            {l.abaixoDoCusto > 0 ? (
              <Etiqueta tom="critico">{l.abaixoDoCusto} abaixo do custo</Etiqueta>
            ) : null}
            {l.pendenciaDeSecao ? <Etiqueta tom="neutro">sem seção</Etiqueta> : null}
          </span>
        );
      },
    },
    {
      chave: "situacao",
      titulo: "Situação",
      noCartao: "linha",
      valor: (l) => (
        <Etiqueta tom={l.cardapio.situacao === "ARQUIVADO" ? "neutro" : "oliva"}>
          {ROTULO_SITUACAO_CARDAPIO[l.cardapio.situacao]}
        </Etiqueta>
      ),
    },
    {
      chave: "acao",
      titulo: "",
      noCartao: "linha",
      valor: (l) => (
        <span className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setEditando(l.id)}
            className="text-[0.8125rem] text-oliva underline-offset-4 hover:underline"
          >
            Abrir
          </button>
          {l.cardapio.situacao === "ARQUIVADO" ? (
            <button
              type="button"
              onClick={() => {
                desarquivarCardapio(l.id);
              }}
              className="text-[0.8125rem] text-[var(--tinta-suave)] underline-offset-4 hover:underline"
            >
              Desarquivar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                arquivarCardapio(l.id);
              }}
              className="text-[0.8125rem] text-[var(--tinta-suave)] underline-offset-4 hover:underline"
            >
              Arquivar
            </button>
          )}
        </span>
      ),
    },
  ];

  const cardapioParaExcluir = confirmandoExclusao
    ? (cardapios.find((c) => c.id === confirmandoExclusao) ?? null)
    : null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <BotaoLink href="/precificacao" variante="secundario" tamanho="sm">
          Ver precificação
        </BotaoLink>
        <NovoCardapio clientes={doCenario.clientes} />
      </div>

      {/*
        ── O AVISO DA EXCLUSÃO, ANTES DE ELA ACONTECER ────────────────────
        Excluir é a única ação desta tela sem volta: nesta sessão não há cópia
        para restaurar. A confirmação diz exatamente isso, e diz também o que
        PRESERVA — arquivar. Quem quiser tirar das listas sem perder o registro
        encontra a saída certa aqui, antes de clicar.
      */}
      {cardapioParaExcluir ? (
        <Aviso tom="critico" titulo={`Excluir "${cardapioParaExcluir.nome}"?`}>
          <p>
            A exclusão tira o cardápio das listas e do acervo desta sessão. Não há como
            desfazer: o banco ainda não está conectado e nada foi gravado em disco.
          </p>
          <p className="mt-2">
            Se a intenção é só parar de usar, <strong>arquivar</strong> faz isso sem apagar o
            registro.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Botao
              variante="fantasma"
              tamanho="sm"
              type="button"
              onClick={() => setConfirmandoExclusao(null)}
            >
              Cancelar
            </Botao>
            <Botao
              variante="secundario"
              tamanho="sm"
              type="button"
              onClick={() => {
                arquivarCardapio(cardapioParaExcluir.id);
                setConfirmandoExclusao(null);
              }}
            >
              Arquivar em vez de excluir
            </Botao>
            <Botao
              variante="primario"
              tamanho="sm"
              type="button"
              onClick={() => {
                excluirCardapio(cardapioParaExcluir.id);
                setConfirmandoExclusao(null);
              }}
            >
              Excluir de vez
            </Botao>
          </div>
        </Aviso>
      ) : null}

      <Secao
        rotulo={`${filtradas.length} de ${linhas.length}`}
        titulo="Cardápios"
        descricao="Cada cardápio reúne fichas técnicas que já existem. O custo e o CMV de cada prato vêm da ficha — o cardápio decide apenas em que seção ele é publicado e em que ordem."
      >
        <BarraFiltros
          base="/cardapios"
          valores={{ q: busca, cliente, situacao }}
          busca="q"
          placeholderBusca="Cardápio, cliente ou descrição…"
          selecoes={[
            {
              chave: "cliente",
              rotulo: "Cliente",
              opcoes: doCenario.clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia })),
            },
            {
              chave: "situacao",
              rotulo: "Situação",
              opcoes: (Object.keys(ROTULO_SITUACAO_CARDAPIO) as SituacaoCardapio[]).map((s) => ({
                valor: s,
                texto: ROTULO_SITUACAO_CARDAPIO[s],
              })),
            },
          ]}
        />

        <label className="mt-4 flex w-fit items-center gap-2.5 text-[0.8125rem] text-[var(--tinta-suave)]">
          <input
            type="checkbox"
            checked={verArquivados}
            onChange={(e) => setVerArquivados(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--linha-forte)]"
          />
          Mostrar os arquivados
        </label>

        <div className="mt-5">
          <ListaResponsiva
            itens={filtradas}
            colunas={colunas}
            vazio={
              linhas.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhum cardápio ainda"
                  descricao="Um cardápio reúne fichas técnicas que já existem, para o mesmo cliente. Comece criando um e escolhendo os pratos dele."
                  acao={<NovoCardapio clientes={doCenario.clientes} />}
                />
              ) : (
                <EstadoVazio
                  titulo="Nenhum cardápio com esses filtros"
                  descricao="Existem cardápios no acervo, mas nenhum bate com a combinação atual."
                  acao={
                    <button
                      type="button"
                      onClick={() => {
                        setBusca("");
                        setCliente("");
                        setSituacao("");
                        setVerArquivados(false);
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

      <Secao
        titulo="Como o custo chega até aqui"
        descricao="O caminho é o mesmo das outras telas, e vale conhecê-lo antes de mexer num preço."
      >
        <div className="space-y-3 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          <p>
            O preço do insumo entra pela{" "}
            <Link href="/ingredientes" className="text-oliva hover:underline">
              biblioteca de ingredientes
            </Link>
            , a ficha técnica o consome pela quantidade declarada, e o cardápio publica a ficha
            com o custo que ela tem hoje.
          </p>
          <p>
            Por isso corrigir o preço de venda de um prato se faz na{" "}
            <Link href="/fichas" className="text-oliva hover:underline">
              ficha técnica
            </Link>{" "}
            e não aqui: o cardápio não guarda preço próprio, e não deve guardar. Se guardasse,
            os dois valores divergiriam e o antigo continuaria indo para a mesa.
          </p>
        </div>
      </Secao>

      <EditorDoCardapio
        cardapio={cardapioAberto}
        doCenario={doCenario}
        aoFechar={() => setEditando(null)}
        aoPedirExclusao={(id) => {
          setEditando(null);
          setConfirmandoExclusao(id);
        }}
      />
    </>
  );
}
