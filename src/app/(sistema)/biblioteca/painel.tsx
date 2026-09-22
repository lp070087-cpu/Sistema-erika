"use client";

import { useMemo, useState } from "react";
import { Aviso, EstadoVazio, Painel, Secao } from "@/components/ui/superficie";
import { Etiqueta } from "@/components/ui/indicador";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import {
  ORDEM_MATERIAL,
  ROTULO_MATERIAL,
  buscarMateriais,
  ordenarBiblioteca,
  resumirBiblioteca,
} from "@/lib/dados";
import type { ClienteOperacao, Material, TipoDeMaterial } from "@/lib/dados";
import { acervoDaBiblioteca } from "@/lib/dados/demonstracao";
import type { PontoDeApoio } from "./pontos";
import { NovoMaterial } from "./novo";
import { FichaDoMaterial } from "./ficha-do-material";

/**
 * BIBLIOTECA — o painel.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA MOSTRA, NA ORDEM EM QUE ELA PRECISA                   │
 * │                                                                      │
 * │ Em cima, os PONTOS DE APOIO: onde os clientes de hoje já pedem um      │
 * │ material. É a resposta acionável e não depende de nada estar           │
 * │ registrado — é o que faz a tela abrir útil com o acervo vazio.         │
 * │                                                                      │
 * │ Depois, os MATERIAIS: o acervo em si, buscável e filtrável.           │
 * │                                                                      │
 * │ Por último, os SEM ENDEREÇO, em bloco próprio. É a única pendência     │
 * │ real do módulo: material que ela tem e que ninguém consegue abrir a    │
 * │ partir daqui. Ele NÃO vira um alerta vermelho — o material continua    │
 * │ existindo, o que falta é o endereço.                                  │
 * │                                                                      │
 * │ ── O QUE ESTA TELA DELIBERADAMENTE NÃO FAZ ─────────────────────────  │
 * │                                                                      │
 * │ Não há upload, não há campo de arquivo, não há "anexar". Ver o         │
 * │ cabeçalho de `@/lib/dados/biblioteca`, onde está escrito por que a     │
 * │ ausência do campo é a decisão mais importante do módulo.               │
 * │                                                                      │
 * │ Não há "cobertura da biblioteca" nem percentual de material            │
 * │ endereçado. A tela mostra CONTAGENS e a lista acionável; um percentual │
 * │ não seria acionável — ela não tem o que fazer com "83% endereçado".    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE OS FILTROS SÃO ESTADO LOCAL, E NÃO `BarraFiltros`             │
 * │                                                                      │
 * │ `BarraFiltros` navega: ela reescreve a query da URL. Nesta tela isso   │
 * │ teria dois efeitos ruins. O primeiro é apagar a busca de outra lista   │
 * │ que por acaso esteja na mesma query. O segundo é mais sério:           │
 * │ sugerir que existe um endereço filtrável, uma URL que ela possa        │
 * │ guardar e mandar para alguém — e esta tela não tem isso.               │
 * │                                                                      │
 * │ Mesma decisão da tela de Equipe.                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type CenarioDaBiblioteca = {
  materiais: readonly Material[];
  clientes: readonly ClienteOperacao[];
  pontos: readonly PontoDeApoio[];
};

export function PainelDaBiblioteca({ doCenario }: { doCenario: CenarioDaBiblioteca }) {
  const versao = useDemonstracao();

  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<TipoDeMaterial | "">("");
  const [clienteId, setClienteId] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);

  const acervo = useMemo(
    () => acervoDaBiblioteca(doCenario.materiais),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `versao` é o gatilho: o store é mutável por fora do React.
    [doCenario.materiais, versao]
  );

  /*
    A busca e os filtros são aplicados em CADEIA sobre o acervo já ordenado.
    A ordem das operações importa para a leitura: `buscarMateriais` preserva a
    ordem que recebeu, então ordenar depois de buscar é o que garante que o
    resultado apareça agrupado por tipo — como a lista sem filtro.
  */
  const visiveis = useMemo(() => {
    let lista = ordenarBiblioteca(acervo);

    if (clienteId !== "") {
      lista = lista.filter((m) => m.clientes.length === 0 || m.clientes.includes(clienteId));
    }

    if (tipo !== "") {
      lista = lista.filter((m) => m.tipo === tipo);
    }

    return buscarMateriais(lista, busca);
  }, [acervo, busca, tipo, clienteId]);

  const resumo = useMemo(() => resumirBiblioteca(acervo), [acervo]);

  const filtroAtivo = busca.trim() !== "" || tipo !== "" || clienteId !== "";

  const materialAberto = aberto === null ? null : (acervo.find((m) => m.id === aberto) ?? null);

  const colunas: readonly ColunaLista<Material>[] = [
    {
      chave: "titulo",
      titulo: "Material",
      destaque: true,
      /*
        O título é o BOTÃO, e não o texto de um link. A lista da Biblioteca não
        navega: clicar num material abre a ficha dele aqui mesmo, na mesma
        gaveta. Por isso esta lista é chamada SEM `href` — ver o comentário no
        fim do componente, junto da coluna "Abrir".
      */
      valor: (m) => (
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => setAberto(m.id)}
            className="truncate text-left font-medium text-[var(--tinta)] underline-offset-4 hover:underline"
          >
            {m.titulo}
          </button>
          {m.servePara !== "" ? (
            <p className="mt-0.5 line-clamp-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
              {m.servePara}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      chave: "tipo",
      titulo: "Tipo",
      valor: (m) => <Etiqueta tom="neutro">{ROTULO_MATERIAL[m.tipo]}</Etiqueta>,
    },
    {
      chave: "alcance",
      titulo: "Vale para",
      valor: (m) =>
        m.clientes.length === 0 ? (
          <Etiqueta tom="oliva">Geral</Etiqueta>
        ) : (
          <span className="text-[0.875rem] text-[var(--tinta-suave)]">
            {m.clientes.length === 1 ? "1 cliente" : `${m.clientes.length} clientes`}
          </span>
        ),
    },
    {
      chave: "endereco",
      titulo: "Endereço",
      /*
        A coluna mais importante da lista. "Sem endereço" não é erro: é o
        material que ela tem e que o sistema não consegue abrir. O tom é
        dourado e não crítico de propósito — ver o comentário do bloco próprio
        mais abaixo.
      */
      valor: (m) =>
        m.onde.trim() === "" ? (
          <Etiqueta tom="dourado">sem endereço</Etiqueta>
        ) : (
          <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">
            {m.onde.startsWith("http") ? "link" : "anotado"}
          </span>
        ),
    },
    {
      /*
        ── POR QUE EXISTE UMA COLUNA "ABRIR" SE O TÍTULO JÁ ABRE ────────────
        O título sozinho seria um alvo de clique estreito no celular, e a
        pessoa que varre a lista com o dedo não descobriria que a linha é
        clicável. A coluna diz com todas as letras o que o clique faz.

        Na tabela do computador ela fica oculta até `lg`, onde a linha já é
        larga e o título basta.
      */
      chave: "abrir",
      titulo: "",
      ocultaEm: "sm",
      noCartao: "linha",
      valor: (m) => (
        <button
          type="button"
          onClick={() => setAberto(m.id)}
          className="text-[0.8125rem] font-medium text-[var(--acento)] underline underline-offset-2"
        >
          Abrir
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Painel>
        <div className="grid gap-4 sm:grid-cols-3">
          <Contagem rotulo="Materiais" valor={resumo.total} />
          <Contagem rotulo="Gerais" valor={resumo.gerais} />
          <Contagem rotulo="Sem endereço" valor={resumo.semEndereco.length} />
        </div>
      </Painel>

      {/*
        ── OS PONTOS DE APOIO VÊM PRIMEIRO, E ISSO É A ORDEM DO TRABALHO ───
        A pergunta dela numa consultoria não é "o que eu tenho na biblioteca?"
        — é "o que eu mostro para ele resolver isso?". A segunda tela é
        consulta; a primeira é pauta.
      */}
      {doCenario.pontos.length > 0 ? (
        <Secao
          rotulo="Pontos de apoio"
          titulo="Onde os seus clientes já pedem um material"
          descricao="Cada linha sai dos dados do cliente, e não de uma lista de ideias: quando a pendência desaparece, a linha desaparece."
        >
          <ul className="divide-y divide-[var(--linha)]">
            {doCenario.pontos.map((ponto) => (
              <li key={ponto.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  {ponto.clienteNome !== "" ? (
                    <span className="text-[0.875rem] font-medium text-[var(--tinta)]">
                      {ponto.clienteNome}
                    </span>
                  ) : (
                    <span className="text-[0.875rem] font-medium text-[var(--tinta)]">
                      Biblioteca de ingredientes
                    </span>
                  )}
                  <span className="text-[0.875rem] text-[var(--tinta-suave)]">{ponto.situacao}</span>
                </div>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                  {ponto.porque}
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
                  <span className="font-medium">Material que resolveria: </span>
                  {ponto.materialSugerido}
                </p>
              </li>
            ))}
          </ul>
        </Secao>
      ) : (
        <Aviso tom="sucesso" titulo="Nenhum ponto de apoio em aberto">
          Nada nos dados dos seus clientes está pedindo um material agora. A lista não fica vazia
          por falta de análise — ela fica vazia porque não há pendência, que é a resposta certa.
        </Aviso>
      )}

      <Secao
        rotulo="Acervo"
        titulo="Os materiais registrados"
        descricao="O sistema guarda o registro e o endereço. O material continua onde você já o mantém."
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-[14rem] flex-1">
              <span className="mb-1 block text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Busca
              </span>
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Procure pela situação: “não sabe a ordem da limpeza”"
                className="w-full rounded-md border border-[var(--linha-forte)] bg-[var(--papel)] px-3 py-2 text-[0.875rem] text-[var(--tinta)] placeholder:text-[var(--tinta-fraca)]"
              />
            </label>

            <label>
              <span className="mb-1 block text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Tipo
              </span>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoDeMaterial | "")}
                className="rounded-md border border-[var(--linha-forte)] bg-[var(--papel)] px-3 py-2 text-[0.875rem] text-[var(--tinta)]"
              >
                <option value="">Todos</option>
                {ORDEM_MATERIAL.map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_MATERIAL[t]}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="mb-1 block text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Cliente
              </span>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="rounded-md border border-[var(--linha-forte)] bg-[var(--papel)] px-3 py-2 text-[0.875rem] text-[var(--tinta)]"
              >
                <option value="">Todos</option>
                {doCenario.clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeFantasia}
                  </option>
                ))}
              </select>
            </label>

            <NovoMaterial clientes={doCenario.clientes} />
          </div>

          {/*
            ── A BUSCA PROCURA NA SITUAÇÃO ──────────────────────────────────
            O aviso abaixo só aparece quando o filtro não achou nada, e ele
            diz ONDE a busca procurou. Sem isso, a lista vazia seria
            indistinguível de "a biblioteca não tem nada" — e é justamente
            quando ela está com o cliente do lado procurando o que mostrar
            que essa diferença importa.
          */}
          {visiveis.length === 0 ? (
            filtroAtivo ? (
              <Aviso tom="info" titulo="Nada corresponde ao filtro">
                A busca procura no título, na situação (<em>para que serve</em>) e no nome do
                ingrediente, da ficha ou do processo ligado ao material.{" "}
                {clienteId !== ""
                  ? "O filtro de cliente mostra os materiais gerais e os dele."
                  : ""}
              </Aviso>
            ) : (
              <EstadoVazio
                titulo="Nenhum material registrado ainda"
                descricao="Nada foi inventado para preencher esta lista: um material com título e conteúdo fictícios seria material que você não escreveu, exibido como se fosse seu. Os pontos de apoio acima são por onde vale começar."
              />
            )
          ) : (
            /*
              ── A LISTA VAI SEM `href`, E ISSO É DELIBERADO ─────────────────
              `ListaResponsiva` transforma a linha inteira num `<Link>` quando
              recebe `href` — e link navega. Aqui o clique ABRE, não navega:
              não existe rota `/biblioteca/[id]`, e apontar para uma que não
              existe seria pior do que não ter link nenhum.

              Sem `href`, o componente monta o cartão sem link e a coluna
              "Abrir" fica sendo o alvo. A lista não parece clicável no lugar
              errado, e a URL não promete um endereço que não há.
            */
            <ListaResponsiva itens={[...visiveis]} colunas={colunas} vazio="Nada aqui." />
          )}
        </div>
      </Secao>

      {/*
        ── OS SEM ENDEREÇO, EM BLOCO PRÓPRIO ────────────────────────────────
        Este bloco existe porque "sem endereço" é a única pendência real do
        módulo — e ele é DOURADO, não vermelho.

        A diferença é a afirmação que a cor faz. Vermelho diz "há um problema
        aqui". Dourado diz "falta preencher isto". O material dela continua
        existindo no Drive, no caderno, publicado; o que falta é o registro do
        endereço. Pintar isso de vermelho faria o sistema acusar uma perda que
        não houve.
      */}
      {resumo.semEndereco.length > 0 ? (
        <Secao
          rotulo="Sem endereço"
          titulo="Você tem estes materiais, e o sistema não sabe onde"
          descricao="Não é erro: é material que existe e ainda não foi endereçado aqui. Preencher o endereço não move o material — só faz esta tela conseguir levá-lo até ele."
        >
          <ul className="space-y-3">
            {resumo.semEndereco.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <Etiqueta tom="dourado">{ROTULO_MATERIAL[m.tipo]}</Etiqueta>
                <span className="text-[0.875rem] font-medium text-[var(--tinta)]">{m.titulo}</span>
                <button
                  type="button"
                  onClick={() => setAberto(m.id)}
                  className="text-[0.8125rem] font-medium text-[var(--acento)] underline underline-offset-2"
                >
                  Informar o endereço
                </button>
              </li>
            ))}
          </ul>
        </Secao>
      ) : null}

      <FichaDoMaterial
        /*
          A `key` é o id, e não é enfeite. Sem ela o React REAPROVEITA o
          componente: fechar a ficha de um material e abrir a de outro
          mostraria os campos do anterior sob o título do novo, e um clique em
          Salvar gravaria aqueles valores. É o mesmo cuidado da ficha da pessoa
          na tela de Equipe.
        */
        key={materialAberto?.id ?? "nenhum"}
        material={materialAberto}
        clientes={doCenario.clientes}
        aoFechar={() => setAberto(null)}
      />
    </div>
  );
}

function Contagem({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div>
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </p>
      <p className="mt-1 text-[1.75rem] leading-none font-semibold text-[var(--tinta)] tabular-nums">
        {valor}
      </p>
    </div>
  );
}
