"use client";

import { useEffect, useMemo, useState } from "react";
import { Etiqueta } from "@/components/ui/indicador";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao, CampoTexto } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import { FaixaDeAcao, useAvisoDeAcao } from "@/components/ui/aviso-acao";
import { useAcervoVivo } from "@/components/operacao/use-acervo";
import type { CenarioDoAcervo } from "@/components/operacao/use-acervo";
import {
  ACAO_DA_PENDENCIA_DO_CARDAPIO,
  ROTULO_ESTADO_COMERCIAL,
  TOM_ESTADO_COMERCIAL,
  montarLinhasDoCardapio,
  numeroFixo,
  resumirCardapio,
  valorEmReais,
} from "@/lib/dados";
import type { Cardapio, Ficha, LinhaDoCardapio } from "@/lib/dados";
import {
  acrescentarSecao,
  adicionarItem,
  alterarItemDoCardapio,
  definirSituacaoDoCardapio,
  duplicarCardapio,
  idDaSessao,
  idsDeCopia,
  moverItem,
  moverSecao,
  removerItem,
  removerSecao,
  renomearSecao,
  salvarCardapio,
  trocarItemDeSecao,
} from "@/lib/dados/demonstracao";
import { useDemonstracao } from "@/components/ui/use-demonstracao";

/**
 * O EDITOR DO CARDÁPIO — a montagem de um menu.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA FAZ, E O QUE ELA SE RECUSA A FAZER                    │
 * │                                                                      │
 * │ FAZ: escolher fichas que já existem, organizá-las em seções, dar       │
 * │ ordem, escrever o nome de anúncio, publicar.                          │
 * │                                                                      │
 * │ NÃO FAZ: criar prato, editar insumo, mexer em preço de venda, calcular │
 * │ custo. Nada disso é do cardápio — e todas as quatro coisas teriam o     │
 * │ mesmo sintoma se fossem feitas aqui: o custo do prato passaria a ter    │
 * │ dois valores no sistema, um na ficha e um no menu, e nada na tela       │
 * │ diria qual dos dois vale.                                              │
 * │                                                                      │
 * │ Por isso esta tela não tem NENHUMA fórmula. `montarLinhasDoCardapio`   │
 * │ devolve o custo, o preço e o CMV de cada item, e o que se vê abaixo é   │
 * │ formatação do que ela devolveu.                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O ESTADO LOCAL É RASCUNHO, E ELE SE JOGA FORA                         │
 * │                                                                      │
 * │ Cada escrita chama `salvarCardapio` na hora; o store é a verdade.      │
 * │ O `useState` local existe por um motivo só: não gravar a cada tecla    │
 * │ digitada no nome de anúncio. Sem ele, "Costela ao madeira" viraria     │
 * │ vinte e três linhas de histórico.                                      │
 * │                                                                      │
 * │ O rascunho se descarta quando o item aberto muda — ver o `useEffect`.  │
 * │ Sem isso, o nome digitado num item apareceria no próximo que ela abrir. │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export function EditorDoCardapio({
  cardapio,
  doCenario,
  aoFechar,
  aoPedirExclusao,
}: {
  /** `null` fecha a gaveta. */
  cardapio: Cardapio | null;
  doCenario: CenarioDoAcervo;
  aoFechar: () => void;
  aoPedirExclusao: (cardapioId: string) => void;
}) {
  const { acervo, clientePorId, resolver } = useAcervoVivo(doCenario);

  /*
    Assina o store pelo NÚMERO. Os `useMemo` abaixo leem `cardapio`, que é a
    prop vinda do acervo — e o acervo só é remontado quando o pai re-renderiza.
    É este número que provoca esse re-render depois de cada `salvarCardapio`.
  */
  const versao = useDemonstracao();
  const { aviso, anunciar, dispensar } = useAvisoDeAcao();

  const [secaoAberta, setSecaoAberta] = useState<string | null>(null);
  const [itemAberto, setItemAberto] = useState<string | null>(null);

  /* Os campos do item aberto — rascunho até o clique em salvar. */
  const [nomeDeAnuncio, setNomeDeAnuncio] = useState("");
  const [descricaoDoItem, setDescricaoDoItem] = useState("");
  const [destaqueDoItem, setDestaqueDoItem] = useState("");

  const linhas = useMemo(() => {
    if (cardapio === null) return [];
    void versao;
    return montarLinhasDoCardapio({ cardapio, fichas: acervo, resolver });
  }, [cardapio, acervo, resolver, versao]);

  const resumo = useMemo(
    () => (cardapio === null ? null : resumirCardapio(cardapio, linhas)),
    [cardapio, linhas]
  );

  const itemAtual = useMemo(
    () => linhas.find((l) => l.item.id === itemAberto) ?? null,
    [linhas, itemAberto]
  );

  /*
    ── O RASCUNHO PERTENCE AO ITEM ABERTO ─────────────────────────────────
    Quando o item aberto muda, os três campos são recarregados do que a ficha
    diz. Não é sincronização de estado: é o descarte do rascunho anterior.
  */
  useEffect(() => {
    setNomeDeAnuncio(itemAtual?.item.nomeNoCardapio ?? "");
    setDescricaoDoItem(itemAtual?.item.descricao ?? "");
    setDestaqueDoItem(itemAtual?.item.destaque ?? "");
  }, [itemAtual]);

  if (cardapio === null || resumo === null) return null;

  /*
    As fichas que podem entrar: as do cliente DESTE cardápio, e nenhuma outra.
    A lista é filtrada aqui, na origem, e não depois de escolhida — oferecer a
    ficha de outro cliente e recusá-la na hora de salvar seria um erro que a
    tela mesma criou.
  */
  const fichasDoCliente = acervo.filter((f) => f.clienteId === cardapio.clienteId);
  const dono = clientePorId.get(cardapio.clienteId);

  const secoes = [...cardapio.categorias]
    .map((c, indice) => ({ c, indice }))
    .sort((a, b) => {
      const oa = a.c.ordem ?? Number.POSITIVE_INFINITY;
      const ob = b.c.ordem ?? Number.POSITIVE_INFINITY;
      if (oa !== ob) return oa - ob;
      return a.indice - b.indice;
    })
    .map((x) => x.c);

  function gravar(alteracao: ReturnType<typeof moverSecao>, recado: string) {
    if (cardapio === null) return;
    if (alteracao === null) {
      anunciar("Essa mudança não alteraria nada — o cardápio já está assim.", "erro");
      return;
    }
    salvarCardapio(cardapio.id, alteracao);
    anunciar(recado);
  }

  const itensSemSecao = linhas.filter((l) => l.ajustes.includes("ITEM_ORFAO"));

  return (
    <Gaveta
      aberta
      aoFechar={aoFechar}
      titulo={cardapio.nome}
      descricao={
        dono
          ? `${dono.nomeFantasia} · ${resumo.itens} ${resumo.itens === 1 ? "item" : "itens"} em ${resumo.secoes} ${resumo.secoes === 1 ? "seção" : "seções"}`
          : `${resumo.itens} itens — cliente não encontrado`
      }
    >
      <div className="space-y-5">
        <FaixaDeAcao aviso={aviso} aoFechar={dispensar} />

        {/* ── O ESTADO DO CARDÁPIO ─────────────────────────────────────── */}
        <Secao titulo="Situação" descricao="Publicar é o que marca o cardápio como pronto para o cliente. Enquanto está em montagem, ele não sai daqui.">
          <div className="flex flex-wrap items-center gap-2">
            <Etiqueta tom={cardapio.situacao === "PUBLICADO" ? "oliva" : "neutro"}>
              {cardapio.situacao === "PUBLICADO" ? "Publicado" : "Em montagem"}
            </Etiqueta>

            {cardapio.situacao === "PUBLICADO" ? (
              <Botao
                variante="secundario"
                tamanho="sm"
                type="button"
                onClick={() => {
                  definirSituacaoDoCardapio(cardapio.id, "RASCUNHO", "Cardápio voltou para montagem.");
                  anunciar("Cardápio voltou para montagem.");
                }}
              >
                Voltar para montagem
              </Botao>
            ) : (
              <Botao
                variante="primario"
                tamanho="sm"
                type="button"
                onClick={() => {
                  definirSituacaoDoCardapio(cardapio.id, "PUBLICADO", "Cardápio publicado.");
                  anunciar("Cardápio publicado.");
                }}
              >
                Publicar
              </Botao>
            )}

            <Botao
              variante="secundario"
              tamanho="sm"
              type="button"
              onClick={() => {
                const copia = duplicarCardapio(cardapio, idDaSessao("ca", cardapio.nome), idsDeCopia);
                anunciar(`Cópia criada: "${copia.nome}". Ela abre na lista.`);
              }}
            >
              Duplicar
            </Botao>
          </div>

          {/*
            ── O QUE FALTA, POR ITEM ──────────────────────────────────────
            As pendências vêm com o item que as causou e a ação que resolve.
            "3 itens sem preço" faria a consultora procurar quais; isto aqui
            diz o nome do prato e manda para a ficha.
          */}
          {resumo.ocorrencias.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                O que falta · {resumo.ocorrencias.length}
              </p>
              <ul className="space-y-1.5">
                {resumo.ocorrencias.map((o, i) => (
                  <li
                    key={`${o.pendencia}-${o.itemId ?? "secao"}-${i}`}
                    className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[0.8125rem]"
                  >
                    <span className="text-tinta">{o.onde}</span>
                    <span className="text-[var(--tinta-fraca)]">—</span>
                    <span className="text-[var(--tinta-suave)]">{o.acao}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : resumo.itens > 0 ? (
            <p className="mt-4 text-[0.8125rem] text-medio">
              Preço, custo e rendimento informados em todos os itens.
            </p>
          ) : null}
        </Secao>

        {/* ── AS SEÇÕES ────────────────────────────────────────────────── */}
        <Secao
          titulo="Seções"
          descricao="A seção é sua, não do sistema: ele não sugere nenhuma. Entradas, pratos, sobremesas — a taxonomia da casa é decisão da consultora."
        >
          {secoes.length === 0 ? (
            <EstadoVazio
              titulo="Nenhuma seção ainda"
              descricao="Uma seção é o cabeçalho sob o qual os pratos aparecem no menu. Crie a primeira para poder acrescentar pratos."
            />
          ) : (
            <ul className="space-y-2">
              {secoes.map((s, i) => (
                <li
                  key={s.id}
                  className="rounded-[var(--raio-sm)] border border-[var(--linha)] px-3 py-2.5"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-[0.9375rem] text-tinta">{s.nome}</span>
                    <span className="tabular text-[0.75rem] text-[var(--tinta-fraca)]">
                      {linhas.filter((l) => l.item.categoriaId === s.id).length} itens
                    </span>

                    <span className="ml-auto flex items-center gap-2.5">
                      <button
                        type="button"
                        disabled={i === 0}
                        onClick={() => gravar(moverSecao(cardapio, s.id, -1), `"${s.nome}" subiu.`)}
                        className="text-[0.75rem] text-[var(--tinta-suave)] underline-offset-4 hover:underline disabled:opacity-35 disabled:no-underline"
                      >
                        Subir
                      </button>
                      <button
                        type="button"
                        disabled={i === secoes.length - 1}
                        onClick={() => gravar(moverSecao(cardapio, s.id, 1), `"${s.nome}" desceu.`)}
                        className="text-[0.75rem] text-[var(--tinta-suave)] underline-offset-4 hover:underline disabled:opacity-35 disabled:no-underline"
                      >
                        Descer
                      </button>
                      <button
                        type="button"
                        onClick={() => setSecaoAberta(secaoAberta === s.id ? null : s.id)}
                        className="text-[0.75rem] text-oliva underline-offset-4 hover:underline"
                      >
                        {secaoAberta === s.id ? "Fechar" : "Renomear"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          gravar(
                            removerSecao(cardapio, s.id),
                            `Seção "${s.nome}" removida. Os pratos dela continuam no cardápio.`
                          );
                        }}
                        className="text-[0.75rem] text-[var(--tinta-fraca)] underline-offset-4 hover:underline"
                      >
                        Remover
                      </button>
                    </span>
                  </div>

                  {secaoAberta === s.id ? (
                    <FormularioDeSecao
                      nome={s.nome}
                      descricao={s.descricao}
                      aoSalvar={(nome, descricao) => {
                        gravar(
                          renomearSecao(cardapio, s.id, nome, descricao),
                          `Seção renomeada para "${nome}".`
                        );
                        setSecaoAberta(null);
                      }}
                      aoCancelar={() => setSecaoAberta(null)}
                    />
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <NovaSecao
            aoCriar={(nome, descricao) => {
              gravar(
                acrescentarSecao(cardapio, idDaSessao("se", nome), nome, descricao),
                `Seção "${nome}" criada.`
              );
            }}
          />
        </Secao>

        {/* ── OS ITENS ─────────────────────────────────────────────────── */}
        {secoes.map((s) => {
          const daSecao = linhas.filter((l) => l.item.categoriaId === s.id);
          return (
            <Secao
              key={s.id}
              titulo={s.nome}
              rotulo={`${daSecao.length} ${daSecao.length === 1 ? "item" : "itens"}`}
              descricao={s.descricao || undefined}
            >
              {daSecao.length === 0 ? (
                <p className="text-[0.875rem] text-[var(--tinta-fraca)]">
                  Nenhum prato nesta seção ainda.
                </p>
              ) : (
                <ul className="space-y-2">
                  {daSecao.map((l, i) => (
                    <li key={l.item.id}>
                      <LinhaDoItem
                        linha={l}
                        primeira={i === 0}
                        ultima={i === daSecao.length - 1}
                        aberto={itemAberto === l.item.id}
                        aoAbrir={() => setItemAberto(itemAberto === l.item.id ? null : l.item.id)}
                        aoSubir={() => gravar(moverItem(cardapio, l.item.id, -1), "Prato subiu.")}
                        aoDescer={() => gravar(moverItem(cardapio, l.item.id, 1), "Prato desceu.")}
                        aoRemover={() => {
                          gravar(
                            removerItem(cardapio, l.item.id),
                            `"${l.nome}" saiu do cardápio. A ficha técnica continua no acervo.`
                          );
                          if (itemAberto === l.item.id) setItemAberto(null);
                        }}
                        secoes={secoes}
                        secaoAtual={s.id}
                        aoTrocarSecao={(categoriaId) => {
                          gravar(
                            trocarItemDeSecao(cardapio, l.item.id, categoriaId),
                            "Prato movido de seção."
                          );
                        }}
                      />

                      {itemAberto === l.item.id ? (
                        <div className="mt-2 space-y-3 rounded-[var(--raio-sm)] border border-dashed border-[var(--linha-forte)] px-3 py-3">
                          <Campo
                            label="Nome no cardápio"
                            ajuda="Vazio, vale o nome da ficha técnica."
                            value={nomeDeAnuncio}
                            onChange={(e) => setNomeDeAnuncio(e.target.value)}
                            name={`anuncio-${l.item.id}`}
                          />
                          <CampoTexto
                            label="Descrição no menu"
                            rows={2}
                            ajuda="Como o prato é anunciado. Diferente do modo de preparo, que é da ficha."
                            value={descricaoDoItem}
                            onChange={(e) => setDescricaoDoItem(e.target.value)}
                            name={`descricao-${l.item.id}`}
                          />
                          <Campo
                            label="Destaque"
                            ajuda='Uma palavra ou frase curta — "mais pedido", "novo". Sem selo automático: quem escreve é você.'
                            value={destaqueDoItem}
                            onChange={(e) => setDestaqueDoItem(e.target.value)}
                            name={`destaque-${l.item.id}`}
                          />
                          <div className="flex justify-end gap-2">
                            <Botao
                              variante="fantasma"
                              tamanho="sm"
                              type="button"
                              onClick={() => setItemAberto(null)}
                            >
                              Fechar sem gravar
                            </Botao>
                            <Botao
                              variante="primario"
                              tamanho="sm"
                              type="button"
                              onClick={() => {
                                gravar(
                                  alterarItemDoCardapio(cardapio, l.item.id, {
                                    nomeNoCardapio: nomeDeAnuncio,
                                    descricao: descricaoDoItem,
                                    destaque: destaqueDoItem,
                                  }),
                                  `Anúncio de "${l.nome}" ajustado.`
                                );
                                setItemAberto(null);
                              }}
                            >
                              Gravar anúncio
                            </Botao>
                          </div>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}

              <AdicionarPrato
                fichas={fichasDoCliente}
                aoAdicionar={(fichaId) => {
                  gravar(
                    adicionarItem(cardapio, idDaSessao("it", fichaId), fichaId, s.id),
                    "Prato acrescentado ao cardápio."
                  );
                }}
              />
            </Secao>
          );
        })}

        {/*
          ── OS ÓRFÃOS ────────────────────────────────────────────────────
          Aparecem numa seção própria porque não têm lugar na página. Não
          foram apagados quando a seção saiu, de propósito — ver `removerSecao`.
          Aqui elas recebem a única saída honesta: escolher uma seção, ou sair.
        */}
        {itensSemSecao.length > 0 ? (
          <Aviso tom="atencao" titulo="Pratos sem seção">
            Estes pratos continuam no cardápio, mas a seção deles foi removida. Escolha uma seção
            para cada um — ou remova o prato.
            <ul className="mt-3 space-y-2">
              {itensSemSecao.map((l) => (
                <li key={l.item.id} className="flex flex-wrap items-center gap-2">
                  <span className="text-tinta">{l.nome}</span>
                  <select
                    aria-label={`Seção de ${l.nome}`}
                    value=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      gravar(
                        trocarItemDeSecao(cardapio, l.item.id, e.target.value),
                        `"${l.nome}" recebeu uma seção.`
                      );
                    }}
                    className="h-8 rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-2 text-[0.8125rem]"
                  >
                    <option value="">Mover para…</option>
                    {secoes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      gravar(removerItem(cardapio, l.item.id), `"${l.nome}" saiu do cardápio.`);
                    }}
                    className="text-[0.75rem] text-[var(--tinta-fraca)] underline-offset-4 hover:underline"
                  >
                    Remover
                  </button>
                </li>
              ))}
            </ul>
          </Aviso>
        ) : null}

        {/* ── A SOMA, E O QUE ELA NÃO É ────────────────────────────────── */}
        <Secao
          titulo="Somas do cardápio"
          descricao="Soma dos preços declarados nas fichas. Não é faturamento: não há venda nenhuma atrás, e um cardápio é uma lista de intenções de venda."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[var(--raio-sm)] border border-[var(--linha)] px-4 py-3">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Preços declarados
              </p>
              <p className="mt-1.5 tabular text-[1.25rem] text-tinta">
                {valorEmReais(resumo.somaDosPrecos)}
              </p>
              <p className="mt-1 text-[0.8125rem] text-[var(--tinta-suave)]">
                {resumo.itensSomados} de {resumo.itens}{" "}
                {resumo.itensSomados === 1 ? "item com preço" : "itens com preço"}
              </p>
            </div>
            <div className="rounded-[var(--raio-sm)] border border-[var(--linha)] px-4 py-3">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Custo fechado
              </p>
              <p className="mt-1.5 tabular text-[1.25rem] text-tinta">
                {resumo.comCustoFechado} de {resumo.itens}
              </p>
              <p className="mt-1 text-[0.8125rem] text-[var(--tinta-suave)]">
                {resumo.semCusto > 0
                  ? `${resumo.semCusto} com custo incompleto — o total seria um piso, não o custo`
                  : "todos os itens com custo somável"}
              </p>
            </div>
          </div>
        </Secao>

        <Secao titulo="Ações do cardápio">
          <div className="flex flex-wrap gap-2">
            <Botao
              variante="secundario"
              tamanho="sm"
              type="button"
              onClick={() => {
                aoFechar();
                aoPedirExclusao(cardapio.id);
              }}
            >
              Excluir o cardápio
            </Botao>
          </div>
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
            Para tirar o cardápio das listas sem perder o registro, use <strong>Arquivar</strong> na
            lista. A exclusão não tem volta.
          </p>
        </Secao>
      </div>
    </Gaveta>
  );
}

/**
 * UMA LINHA DE PRATO — custo, preço e CMV vêm prontos de `montarLinhasDoCardapio`.
 *
 * Não há conta nesta função. O que ela faz é mostrar `l.linha`, que é a mesma
 * `LinhaPrecificacao` da tela de precificação: o mesmo prato custa o mesmo nas
 * duas telas porque é a mesma conta, e não porque as duas foram conferidas.
 */
function LinhaDoItem({
  linha,
  primeira,
  ultima,
  aberto,
  aoAbrir,
  aoSubir,
  aoDescer,
  aoRemover,
  secoes,
  secaoAtual,
  aoTrocarSecao,
}: {
  linha: LinhaDoCardapio;
  primeira: boolean;
  ultima: boolean;
  aberto: boolean;
  aoAbrir: () => void;
  aoSubir: () => void;
  aoDescer: () => void;
  aoRemover: () => void;
  secoes: readonly { id: string; nome: string }[];
  secaoAtual: string;
  aoTrocarSecao: (categoriaId: string) => void;
}) {
  const comercial = linha.linha?.comercial.venda ?? null;
  const custo = linha.linha?.custoDaVenda ?? null;

  return (
    <div className="rounded-[var(--raio-sm)] border border-[var(--linha)] px-3 py-2.5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <button
          type="button"
          onClick={aoAbrir}
          className="text-left text-[0.9375rem] text-tinta underline-offset-4 hover:underline"
        >
          {linha.nome}
        </button>

        {/*
          O nome de anúncio é diferente do nome da ficha. Mostrar o da ficha
          ao lado evita a confusão de achar que o prato foi renomeado.
        */}
        {linha.item.nomeNoCardapio && linha.ficha ? (
          <span className="text-[0.75rem] text-[var(--tinta-fraca)]">
            ficha: {linha.ficha.nome}
          </span>
        ) : null}

        {linha.item.destaque ? <Etiqueta tom="dourado">{linha.item.destaque}</Etiqueta> : null}

        {/* O que falta neste item, nomeado e com a ação. */}
        {linha.ajustes.map((a) => (
          <Etiqueta key={a} tom={a === "FICHA_DE_OUTRO_CLIENTE" ? "critico" : "dourado"}>
            {ACAO_DA_PENDENCIA_DO_CARDAPIO[a]}
          </Etiqueta>
        ))}

        <span className="ml-auto flex items-center gap-2.5">
          <button
            type="button"
            disabled={primeira}
            onClick={aoSubir}
            className="text-[0.75rem] text-[var(--tinta-suave)] underline-offset-4 hover:underline disabled:opacity-35 disabled:no-underline"
          >
            Subir
          </button>
          <button
            type="button"
            disabled={ultima}
            onClick={aoDescer}
            className="text-[0.75rem] text-[var(--tinta-suave)] underline-offset-4 hover:underline disabled:opacity-35 disabled:no-underline"
          >
            Descer
          </button>
          <button
            type="button"
            onClick={aoRemover}
            className="text-[0.75rem] text-[var(--tinta-fraca)] underline-offset-4 hover:underline"
          >
            Remover
          </button>
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[0.8125rem]">
        <span className="tabular text-[var(--tinta-suave)]">
          custo:{" "}
          <span className="text-tinta">
            {custo === null ? "—" : valorEmReais(custo)}
          </span>
        </span>
        <span className="tabular text-[var(--tinta-suave)]">
          preço:{" "}
          <span className="text-tinta">
            {linha.ficha?.precoVenda ? valorEmReais(linha.ficha.precoVenda) : "—"}
          </span>
        </span>
        <span className="tabular text-[var(--tinta-suave)]">
          CMV:{" "}
          <span className="text-tinta">
            {comercial === null ? "—" : `${numeroFixo(comercial.cmvPct, 1)}%`}
          </span>
        </span>
        {linha.linha ? (
          <Etiqueta tom={TOM_ESTADO_COMERCIAL[linha.estado]}>
            {ROTULO_ESTADO_COMERCIAL[linha.estado]}
          </Etiqueta>
        ) : null}
      </div>

      {/*
        A troca de seção fica na linha, e não só na seção de destino: mover um
        prato é uma decisão sobre ELE. Uma tela que só permitisse mover dentro
        da seção obrigaria a removê-lo e recadastrá-lo para trocá-lo de lugar.
      */}
      <div className="mt-2 flex items-center gap-2">
        <label
          htmlFor={`secao-${linha.item.id}`}
          className="text-[0.75rem] text-[var(--tinta-fraca)]"
        >
          Seção
        </label>
        <select
          id={`secao-${linha.item.id}`}
          value={secaoAtual}
          onChange={(e) => {
            if (e.target.value !== secaoAtual) aoTrocarSecao(e.target.value);
          }}
          className="h-7 rounded-[var(--raio-sm)] border border-[var(--linha)] bg-white/70 px-1.5 text-[0.75rem]"
        >
          {secoes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
        {aberto ? null : (
          <button
            type="button"
            onClick={aoAbrir}
            className="text-[0.75rem] text-oliva underline-offset-4 hover:underline"
          >
            Editar anúncio
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * ADICIONA UM PRATO — escolhendo entre as FICHAS QUE JÁ EXISTEM.
 *
 * Não há campo de nome nem de insumo aqui, e a ausência é o ponto. Um
 * formulário que aceitasse um nome criaria um prato sem ficha, e o cardápio
 * passaria a ter pratos que o resto do sistema não conhece — com custo
 * ausente e sem lugar para informá-lo.
 *
 * Quando o cliente não tem ficha nenhuma, a tela diz o que fazer em vez de
 * mostrar uma lista vazia: o caminho é cadastrar a ficha, e não inventar o
 * prato no cardápio.
 */
function AdicionarPrato({
  fichas,
  aoAdicionar,
}: {
  /*
    O tipo é `Ficha`, e não um objeto com os três campos que esta função lê.

    ┌──────────────────────────────────────────────────────────────────────┐
    │ POR QUE NÃO BASTA DECLARAR "O QUE EU USO"                            │
    │                                                                      │
    │ A versão anterior deste parâmetro era `{ id, nome, precoVenda }` —    │
    │ uma cópia estrutural do que a lista precisa. Ela compilou por dois     │
    │ minutos e depois quebrou duas vezes: primeiro porque `precoVenda`      │
    │ aceita `undefined` numa ficha vinda da sessão, depois porque o campo   │
    │ é OPCIONAL em `Ficha`.                                                │
    │                                                                      │
    │ Cada correção foi um campo a mais escrito à mão, seguindo o rastro do  │
    │ compilador. O tipo de verdade fica em `tipos-operacao.ts`, e já        │
    │ carrega essas três decisões — inclusive a distinção entre o preço     │
    │ AUSENTE (ninguém informou) e o preço zero (decidido). Usar o tipo real │
    │ encerra a série de correções e mantém a distinção, que é de negócio.   │
    └──────────────────────────────────────────────────────────────────────┘
  */
  fichas: readonly Ficha[];
  aoAdicionar: (fichaId: string) => void;
}) {
  const [escolhida, setEscolhida] = useState("");

  if (fichas.length === 0) {
    return (
      <p className="mt-3 border-t border-[var(--linha)] pt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
        Este cliente ainda não tem ficha técnica nenhuma. O cardápio só publica pratos que já
        existem — cadastre a ficha do prato e ele aparece aqui para ser escolhido.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-[var(--linha)] pt-3">
      <div className="min-w-[220px] flex-1">
        <CampoSelecao
          label="Acrescentar prato"
          name={`prato-${fichas[0]?.id ?? "novo"}`}
          value={escolhida}
          onChange={(e) => setEscolhida(e.target.value)}
          opcoes={[
            { valor: "", texto: "Escolha uma ficha técnica…" },
            ...fichas.map((f) => ({
              valor: f.id,
              texto: f.precoVenda ? f.nome : `${f.nome} — sem preço`,
            })),
          ]}
        />
      </div>
      <Botao
        variante="secundario"
        tamanho="sm"
        type="button"
        disabled={escolhida === ""}
        onClick={() => {
          if (escolhida === "") return;
          aoAdicionar(escolhida);
          setEscolhida("");
        }}
      >
        Acrescentar
      </Botao>
    </div>
  );
}

/** O formulário de renomear uma seção. Fica dentro dela, e não numa gaveta. */
function FormularioDeSecao({
  nome,
  descricao,
  aoSalvar,
  aoCancelar,
}: {
  nome: string;
  descricao: string;
  aoSalvar: (nome: string, descricao: string) => void;
  aoCancelar: () => void;
}) {
  const [novoNome, setNovoNome] = useState(nome);
  const [novaDescricao, setNovaDescricao] = useState(descricao);

  return (
    <div className="mt-3 space-y-3 border-t border-dashed border-[var(--linha-forte)] pt-3">
      <Campo
        label="Nome da seção"
        obrigatorio
        value={novoNome}
        onChange={(e) => setNovoNome(e.target.value)}
        name="secao-nome"
      />
      <Campo
        label="Descrição"
        value={novaDescricao}
        onChange={(e) => setNovaDescricao(e.target.value)}
        name="secao-descricao"
      />
      <div className="flex justify-end gap-2">
        <Botao variante="fantasma" tamanho="sm" type="button" onClick={aoCancelar}>
          Cancelar
        </Botao>
        <Botao
          variante="primario"
          tamanho="sm"
          type="button"
          disabled={novoNome.trim() === ""}
          onClick={() => aoSalvar(novoNome, novaDescricao)}
        >
          Salvar seção
        </Botao>
      </div>
    </div>
  );
}

/** Criar uma seção nova. O sistema não sugere nome — a taxonomia é da casa. */
function NovaSecao({
  aoCriar,
}: {
  aoCriar: (nome: string, descricao: string) => void;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");

  return (
    <div className="mt-4 space-y-3 border-t border-[var(--linha)] pt-4">
      <Campo
        label="Nova seção"
        ajuda="O nome que o cliente lê no menu."
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        name="nova-secao"
      />
      <Campo
        label="Descrição da seção"
        ajuda="Opcional. Uma frase de apoio, quando o nome não basta."
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        name="nova-secao-descricao"
      />
      <div className="flex justify-end">
        <Botao
          variante="secundario"
          tamanho="sm"
          type="button"
          disabled={nome.trim() === ""}
          onClick={() => {
            aoCriar(nome, descricao);
            setNome("");
            setDescricao("");
          }}
        >
          Criar seção
        </Botao>
      </div>
    </div>
  );
}

