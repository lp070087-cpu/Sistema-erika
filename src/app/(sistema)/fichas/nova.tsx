"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Aviso } from "@/components/ui/superficie";
import { RegraAConfirmar } from "@/components/ui/metodologia";
import { criarFicha } from "@/lib/dados/demonstracao";
import type { EtapaPeso, Ficha, Ingrediente, ItemFicha } from "@/lib/dados";

/**
 * NOVA FICHA TÉCNICA — o cabeçalho, e depois a composição.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA GAVETA CRIA UMA FICHA DE VERDADE                               │
 * │                                                                      │
 * │ Antes, o último botão era "Entendi — fechar": explicava que nada      │
 * │ havia sido salvo e fechava. A pessoa preenchia o formulário inteiro   │
 * │ para receber uma explicação.                                          │
 * │                                                                      │
 * │ Agora "Criar ficha" grava a ficha no estado da sessão e ABRE ELA.     │
 * │ A ficha nasce com os ingredientes que foram escolhidos aqui, e        │
 * │ termina de ser montada na tela dela — que é onde a quantidade de      │
 * │ cada insumo tem lugar ao lado do preço e do rendimento.               │
 * │                                                                      │
 * │ Isso não é adiar trabalho: é a divisão certa. Criar a ficha é decidir │
 * │ o que é (prato, cliente, categoria); compor é medir. Duas tarefas     │
 * │ diferentes, e a segunda se faz olhando os números.                    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O FORMULÁRIO NÃO PEDE CUSTO — E ISSO MUDOU DE MOTIVO          │
 * │                                                                      │
 * │ Na fase anterior, custo não era pedido porque não havia como          │
 * │ calculá-lo. Hoje há: o preço de cada insumo vem da biblioteca, e a    │
 * │ conta é multiplicação e soma.                                          │
 * │                                                                      │
 * │ O motivo de continuar sem campo de custo é outro, e melhor: um        │
 * │ campo digitado à mão poderia DISCORDAR da soma das linhas. Duas       │
 * │ versões do custo do mesmo prato, e a digitada teria a mesma           │
 * │ aparência da calculada. Onde o custo aparece é na ficha, calculado,   │
 * │ com a procedência de cada número visível.                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O RENDIMENTO É EM PORÇÕES, E NÃO EM UNIDADE ESCOLHIDA                 │
 * │                                                                      │
 * │ Havia aqui um seletor de unidade — porções, unidades, quilos, litros. │
 * │ O campo que ele alimenta, no domínio, é `rendimentoPorcoes`: um       │
 * │ NÚMERO DE PORÇÕES. Escolher "litros" gravava 12 no mesmo lugar que    │
 * │ guardava 12 porções, e o custo por porção depois saía dividido por um │
 * │ número cuja unidade ninguém sabia.                                    │
 * │                                                                      │
 * │ Permitir uma escolha que o dado não suporta é pior do que não         │
 * │ oferecê-la. Se a metodologia render pratos em outra unidade, é uma    │
 * │ pergunta para a Érika, e não uma decisão para o sistema.              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** Um id de ficha que nasce na sessão. O prefixo diz que ele não é do banco. */
function idDaSessao(nome: string): string {
  const slug = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
  return `fi_demo_${slug || "ficha"}_${Date.now().toString(36)}`;
}

type Linha = {
  /** Chave local estável — não é id de banco, e o prefixo diz isso. */
  chave: number;
  ingredienteId: string;
  quantidade: string;
  unidade: string;
  etapa: EtapaPeso;
};

/** Quem assina o que for criado nesta sessão. Não é um nome inventado. */
const QUEM = "sessão de trabalho";

export function NovaFicha({
  clientes,
  ingredientes,
  categorias,
}: {
  clientes: readonly { id: string; nome: string }[];
  /** O insumo inteiro: a ficha precisa do preço e do rendimento dele. */
  ingredientes: readonly Ingrediente[];
  /** Categorias que já existem no acervo — para não inventar taxonomia. */
  categorias: readonly string[];
}) {
  const router = useRouter();

  const [aberta, setAberta] = useState(false);
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState(categorias[0] ?? "");
  const [categoriaNova, setCategoriaNova] = useState("");
  const [rendimento, setRendimento] = useState("");
  const [porcao, setPorcao] = useState("");
  const [linhas, setLinhas] = useState<Linha[]>([]);

  // Contador de chave das linhas. Fica num ref, e não numa variável de
  // módulo: um contador de módulo sobrevive entre montagens e vaza entre
  // aberturas da gaveta, o que faria duas linhas de duas sessões
  // diferentes colidirem num id que já não corresponde a nada.
  const proximaChave = useRef(1);

  const SEM_CATEGORIA = "__nova__";
  const categoriaFinal =
    categoria === SEM_CATEGORIA ? categoriaNova.trim() : categoria;

  const podeCriar = clienteId !== "" && nome.trim().length > 0 && categoriaFinal.length > 0;

  function adicionarLinha() {
    const primeiro = ingredientes[0];
    if (!primeiro) return;
    setLinhas((l) => [
      ...l,
      {
        chave: proximaChave.current++,
        ingredienteId: primeiro.id,
        quantidade: "",
        unidade: primeiro.unidade,
        // Compra é o padrão porque é o peso que se conhece sem ter pesado
        // nada: é o que está na nota. Quem mediu a limpeza troca na ficha.
        etapa: "COMPRA",
      },
    ]);
  }

  function alterarLinha(chave: number, mudanca: Partial<Linha>) {
    setLinhas((lista) =>
      lista.map((l) => {
        if (l.chave !== chave) return l;
        const nova = { ...l, ...mudanca };
        // Trocar o ingrediente troca a unidade de compra junto — é a
        // unidade do insumo, não uma escolha livre.
        if (mudanca.ingredienteId) {
          const escolhido = ingredientes.find((i) => i.id === mudanca.ingredienteId);
          if (escolhido) nova.unidade = escolhido.unidade;
        }
        return nova;
      })
    );
  }

  function lerNumero(texto: string): number | null {
    const limpo = texto.trim().replace(",", ".");
    if (limpo === "") return null;
    const n = Number(limpo);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function fechar() {
    setAberta(false);
    setNome("");
    setCategoria(categorias[0] ?? "");
    setCategoriaNova("");
    setRendimento("");
    setPorcao("");
    setLinhas([]);
  }

  /**
   * CRIA A FICHA — e leva para ela.
   *
   * A ficha nasce com `itens` montados a partir das linhas escolhidas aqui,
   * cada um com o preço de referência do insumo naquele momento. Guardar o
   * preço junto é o que permite, depois, saber com que preço a ficha foi
   * escrita — e é o que o painel usa para avisar quando ele divergir do
   * preço vigente.
   */
  function criar() {
    const agora = new Date();

    const itens: ItemFicha[] = linhas.flatMap((l) => {
      const insumo = ingredientes.find((i) => i.id === l.ingredienteId);
      if (!insumo) return [];
      return [
        {
          ingredienteId: insumo.id,
          quantidade: l.quantidade.trim(),
          unidade: insumo.unidade,
          precoReferencia: insumo.precoAtual,
          etapa: l.etapa,
          observacao: "",
        },
      ];
    });

    const ficha: Ficha = {
      id: idDaSessao(nome.trim()),
      clienteId,
      nome: nome.trim(),
      categoria: categoriaFinal,
      rendimentoPorcoes: lerNumero(rendimento),
      porcaoGramas: lerNumero(porcao),
      itens,
      modoPreparo: [],
      finalizacao: [],
      observacoes: "",
      // Nasce em revisão porque ninguém a conferiu ainda: a composição tem
      // linhas sem quantidade e o rendimento pode estar em branco.
      situacao: "EM_REVISAO",
      situacaoCalculo: "AGUARDANDO_DADOS",
      atualizadaEm: agora,
      historico: [
        {
          em: agora,
          oQue: `Ficha criada com ${itens.length} ${
            itens.length === 1 ? "ingrediente" : "ingredientes"
          }.`,
          quem: QUEM,
        },
      ],
    };

    criarFicha(ficha);
    fechar();
    router.push(`/fichas/${ficha.id}`);
  }

  return (
    <>
      <Botao variante="primario" tamanho="sm" onClick={() => setAberta(true)}>
        Nova ficha
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={fechar}
        titulo="Nova ficha técnica"
        descricao="O que o prato é e para qual cliente. A composição se completa na ficha, onde cada linha mostra o custo enquanto se digita."
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={fechar}>
              Cancelar
            </Botao>
            <Botao variante="primario" tamanho="sm" disabled={!podeCriar} onClick={criar}>
              Criar ficha
            </Botao>
          </>
        }
      >
        <div className="space-y-6">
          {/* Identificação -------------------------------------------- */}
          <div className="space-y-4">
            <CampoSelecao
              label="Cliente"
              name="cliente"
              value={clienteId}
              opcoes={clientes.map((c) => ({ valor: c.id, texto: c.nome }))}
              onChange={(e) => setClienteId(e.target.value)}
              obrigatorio
              ajuda="A ficha pertence a um cliente — é o acervo dele."
            />
            <Campo
              label="Nome do prato"
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Costela ao molho madeira"
              obrigatorio
            />

            {/* Categoria: escolher uma existente ou criar uma nova. Não
                existe lista fixa no código — a taxonomia é do acervo. */}
            <CampoSelecao
              label="Categoria"
              name="categoria"
              value={categoria}
              opcoes={[
                ...categorias.map((c) => ({ valor: c, texto: c })),
                { valor: SEM_CATEGORIA, texto: "Nova categoria…" },
              ]}
              onChange={(e) => setCategoria(e.target.value)}
              obrigatorio
            />
            {categoria === SEM_CATEGORIA ? (
              <Campo
                label="Nome da nova categoria"
                name="categoriaNova"
                value={categoriaNova}
                onChange={(e) => setCategoriaNova(e.target.value)}
                placeholder="Ex.: Entradas"
              />
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                label="Rendimento (porções)"
                name="rendimento"
                inputMode="decimal"
                value={rendimento}
                onChange={(e) => setRendimento(e.target.value)}
                placeholder="Ex.: 12"
                ajuda="Quantas porções o prato rende. Pode ficar em branco e ser preenchido depois — sem ele não há custo por porção."
              />
              <Campo
                label="Porção (g)"
                name="porcao"
                inputMode="decimal"
                value={porcao}
                onChange={(e) => setPorcao(e.target.value)}
                placeholder="Ex.: 320"
                ajuda="O peso de uma porção, medido no passe."
              />
            </div>
          </div>

          {/* Ingredientes --------------------------------------------- */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                O que leva
              </p>
              {linhas.length > 0 ? (
                <span className="text-[0.75rem] text-[var(--tinta-fraca)] tabular">
                  {linhas.length} {linhas.length === 1 ? "item" : "itens"}
                </span>
              ) : null}
            </div>

            {ingredientes.length === 0 ? (
              <p className="mt-3 rounded-[var(--raio-sm)] border border-dashed border-[var(--linha-forte)] px-3.5 py-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
                Nenhum ingrediente cadastrado ainda. A ficha precisa de
                ingredientes para existir — cadastre os insumos primeiro, na
                tela de Ingredientes.
              </p>
            ) : (
              <>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                  Opcional nesta etapa. Dá para criar a ficha agora e montar a
                  composição na tela dela, com o custo aparecendo a cada linha.
                </p>

                {linhas.length > 0 ? (
                  <ul className="mt-3 space-y-3">
                    {linhas.map((l) => {
                      const insumo = ingredientes.find((i) => i.id === l.ingredienteId);
                      return (
                        <li
                          key={l.chave}
                          className="rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[var(--superficie)] px-3.5 py-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1 space-y-3">
                              <CampoSelecao
                                label="Ingrediente"
                                name={`ing-${l.chave}`}
                                value={l.ingredienteId}
                                opcoes={ingredientes.map((i) => ({
                                  valor: i.id,
                                  texto: i.nome,
                                }))}
                                onChange={(e) =>
                                  alterarLinha(l.chave, { ingredienteId: e.target.value })
                                }
                              />
                              <div className="grid gap-3 sm:grid-cols-2">
                                <Campo
                                  label="Quantidade"
                                  name={`qtd-${l.chave}`}
                                  inputMode="decimal"
                                  value={l.quantidade}
                                  onChange={(e) =>
                                    alterarLinha(l.chave, { quantidade: e.target.value })
                                  }
                                  placeholder="Ex.: 1,400"
                                  ajuda="Como no caderno da cozinha."
                                />
                                <div className="flex items-end">
                                  <p className="pb-2 text-[0.8125rem] text-[var(--tinta-suave)]">
                                    Unidade: <span className="text-tinta">{l.unidade}</span>
                                    <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                                      Vem do insumo, não é escolha livre.
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <CampoSelecao
                                label="Em que peso esta quantidade foi medida"
                                name={`etapa-${l.chave}`}
                                value={l.etapa}
                                opcoes={[
                                  { valor: "COMPRA", texto: "Compra — o peso que se paga" },
                                  { valor: "LIMPO", texto: "Limpo — depois de descascar" },
                                  { valor: "PREPARADO", texto: "Preparado — depois de cozinhar" },
                                ]}
                                onChange={(e) =>
                                  alterarLinha(l.chave, { etapa: e.target.value as EtapaPeso })
                                }
                                ajuda={
                                  insumo && insumo.precoAtual !== null
                                    ? `O preço deste insumo é ${insumo.precoAtual
                                        .toFixed(2)
                                        .replace(".", ",")} por ${insumo.unidade} na compra.`
                                    : "Este insumo ainda não tem preço cadastrado."
                                }
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setLinhas((lista) => lista.filter((x) => x.chave !== l.chave))
                              }
                              aria-label={`Remover ${insumo?.nome ?? "ingrediente"}`}
                              className="mt-6 flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--raio-sm)] text-[var(--tinta-suave)] transition-colors hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta"
                            >
                              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                                <path
                                  d="M2 2l8 8M10 2l-8 8"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                    Nenhum ingrediente escolhido ainda.
                  </p>
                )}

                <div className="mt-3">
                  <Botao variante="secundario" tamanho="sm" onClick={adicionarLinha}>
                    Adicionar ingrediente
                  </Botao>
                </div>
              </>
            )}
          </div>

          {/*
            O QUE O CUSTO DEPENDE, AQUI, E NÃO UM "NÃO HÁ CUSTO".
            A frase mudou porque o fato mudou: a soma existe. O que continua
            fora é a formação de preço.
          */}
          <RegraAConfirmar oQue="O custo da ficha é calculado a partir do preço de cada insumo e da quantidade declarada. Preço de venda, CMV alvo e markup continuam dependendo de como a sua metodologia forma preço." />

          <Aviso tom="info" titulo="Esta ficha vive nesta sessão">
            <p>
              Ela entra no acervo na hora, com as linhas que você escolher aqui,
              e pode ser editada na tela dela. Ao recarregar a página, o acervo
              volta ao estado inicial — o banco ainda não está conectado.
            </p>
          </Aviso>
        </div>
      </Gaveta>
    </>
  );
}
