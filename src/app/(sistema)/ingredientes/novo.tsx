"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { valorEmReais } from "@/lib/dados";
import type { Ingrediente, PesoInformado, Transformacao } from "@/lib/dados";
import { cadastrarIngrediente, idDaSessao } from "@/lib/dados/demonstracao";

/**
 * CADASTRAR UM INSUMO — e as duas contas que o sistema faz sozinho.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE AQUI PODE HAVER DIVISÃO, E EM OUTROS LUGARES NÃO             │
 * │                                                                      │
 * │ "Preço pago ÷ quantidade comprada" é aritmética pura sobre dois       │
 * │ números que a consultora digitou. Ela comprou 5 kg e pagou R$ 120 —   │
 * │ o quilo custou R$ 24. Não há nenhuma decisão da Érika nessa conta:    │
 * │ não depende de fator de correção, de índice de cocção nem de regra de │
 * │ arredondamento.                                                      │
 * │                                                                      │
 * │ O que o sistema se recusa a fazer é CONVERTER a unidade de compra     │
 * │ para a unidade de uso na ficha. Se ela compra uma caixa de 12 latas e │
 * │ a ficha pede em ml, alguém precisa dizer quantos ml tem a lata — e se │
 * │ ela é aproveitada inteira. Isso é fator de correção e rendimento: é    │
 * │ método, não conta.                                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS PESAGENS SÃO OPCIONAIS, E ISSO É DELIBERADO                       │
 * │                                                                      │
 * │ O formulário poderia exigir as três: peso de compra, peso limpo, peso │
 * │ preparado. Exigir seria mais fácil de escrever e pior de usar.        │
 * │                                                                      │
 * │ Insumo sem pesagem ainda serve — ele tem preço, entra na lista de      │
 * │ compras, aparece nas fichas. O que ele não tem é rendimento, e a tela  │
 * │ mostra "não pesado" em vez de inventar um. E a pesagem acontece na     │
 * │ cozinha, com a balança na mão — não é coisa que se faça sentada na     │
 * │ frente do computador durante a consultoria.                           │
 * │                                                                      │
 * │ Por isso o bloco fica RECOLHIDO e sem asterisco: quem tem a medição    │
 * │ preenche agora, quem não tem preenche depois, e o formulário não       │
 * │ obriga ninguém a digitar número que não mediu.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O PREÇO ENTRA COM DATA, SEMPRE                                      │
 * │                                                                      │
 * │ É a razão de a biblioteca existir. Um preço sem data não permite      │
 * │ saber se ele ainda vale — e é assim que um número de janeiro continua │
 * │ dentro de uma ficha em junho sem ninguém notar.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const UNIDADES = ["kg", "g", "L", "ml", "un", "dúzia", "maço", "cx", "pct"] as const;

/** Hoje, no fuso de quem está usando — a data do preço é o dia da compra. */
function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Lê um número que a consultora digitou do jeito que ela digita.
 *
 * "12,90" e "12.90" são a mesma coisa para quem está olhando uma nota
 * fiscal. Recusar a vírgula obrigaria ela a converter mentalmente o número
 * que está lendo — e é exatamente aí que se digita 1290 sem perceber.
 */
function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, "");
  if (limpo === "") return null;

  if (limpo.includes(",")) {
    const n = Number(limpo.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * O ID DO INSUMO QUE NASCE NA SESSÃO.
 *
 * Ele era uma função local aqui, com o corpo idêntico ao de `fichas/nova.tsx`
 * — só o prefixo mudava. As duas viraram `idDaSessao` no store, que é quem
 * responde pela identidade do que a sessão cria.
 */
const idDeSessao = (nome: string) => idDaSessao("in", nome);

export function NovoIngrediente({
  categorias,
  /** Chamado depois de cadastrar — para a ficha continuar de onde parou. */
  aoCadastrar,
}: {
  categorias: readonly string[];
  aoCadastrar?: (ingrediente: Ingrediente) => void;
}) {
  useDemonstracao();

  const [aberta, setAberta] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [mostrarPesagens, setMostrarPesagens] = useState(false);

  const SEM_CATEGORIA = "__nova__";
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState(categorias[0] ?? SEM_CATEGORIA);
  const [categoriaNova, setCategoriaNova] = useState("");
  const [unidade, setUnidade] = useState<string>("kg");
  const [quantidade, setQuantidade] = useState("");
  const [preco, setPreco] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [data, setData] = useState(hojeLocal());
  const [observacoes, setObservacoes] = useState("");

  const [pBruto, setPBruto] = useState("");
  const [pLimpo, setPLimpo] = useState("");
  const [pPreparado, setPPreparado] = useState("");
  const [obsPreparo, setObsPreparo] = useState("");

  const categoriaFinal = categoria === SEM_CATEGORIA ? categoriaNova.trim() : categoria;

  const qtdNum = lerNumero(quantidade);
  const precoNum = lerNumero(preco);

  /**
   * A DIVISÃO — preço pago pela quantidade comprada.
   *
   * É o preço por unidade de COMPRA: o que a nota diz, normalizado. Nunca
   * chamado de "custo do insumo", que soaria como custo dentro de uma ficha.
   */
  const porUnidade = qtdNum !== null && precoNum !== null ? precoNum / qtdNum : null;

  const podeRevisar = nome.trim().length > 0 && categoriaFinal.length > 0 && data !== "";

  function limpar() {
    setNome("");
    setCategoriaNova("");
    setQuantidade("");
    setPreco("");
    setFornecedor("");
    setObservacoes("");
    setPBruto("");
    setPLimpo("");
    setPPreparado("");
    setObsPreparo("");
    setData(hojeLocal());
    setMostrarPesagens(false);
  }

  function fechar() {
    setAberta(false);
    setRevisando(false);
    limpar();
  }

  /**
   * Monta o insumo e o entrega ao store.
   *
   * O peso informado carrega a PRÓPRIA unidade — a de compra. Isso mantém o
   * cadastro coerente: quem comprou em quilo pesa em quilo. Converter para
   * outra unidade aqui seria inventar uma conversão que o sistema não faz.
   */
  function salvar() {
    const quando = new Date(`${data}T12:00:00`);
    const id = idDeSessao(nome.trim());

    const peso = (texto: string): PesoInformado | null => {
      const n = lerNumero(texto);
      return n === null ? null : { peso: n, unidade };
    };

    const transformacao: Transformacao = {
      bruto: peso(pBruto),
      limpo: peso(pLimpo),
      preparado: peso(pPreparado),
      observacao: obsPreparo.trim(),
    };

    const ingrediente: Ingrediente = {
      id,
      nome: nome.trim(),
      categoria: categoriaFinal,
      unidade,
      compra:
        qtdNum !== null && precoNum !== null
          ? { quantidade: qtdNum, unidade, valorTotal: precoNum }
          : null,
      transformacao,
      observacoes: observacoes.trim(),
      /*
        O preço de referência nasce da divisão, e não de um campo digitado.
        Existindo os dois, existiriam dois números discordando sobre a mesma
        compra — e o segundo a ser editado venceria, sem ninguém saber qual
        dos dois vale.
      */
      precoAtual: porUnidade,
      atualizadoEm: quando,
      fornecedor: fornecedor.trim(),
      historico: [],
    };

    cadastrarIngrediente(ingrediente);
    aoCadastrar?.(ingrediente);
    fechar();
  }

  const linhasDeRevisao: Array<[string, string]> = [
    ["Ingrediente", nome.trim() || "—"],
    ["Categoria", categoriaFinal || "—"],
    ["Unidade", unidade],
    ["Comprado", qtdNum !== null ? `${quantidade} ${unidade}` : "não informado"],
    ["Pago", precoNum !== null ? valorEmReais(precoNum) : "não informado"],
    ["Preço por unidade", porUnidade !== null ? `${valorEmReais(porUnidade)} / ${unidade}` : "—"],
    ["Fornecedor", fornecedor.trim() || "não informado"],
    ["Data do preço", data ? new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR") : "—"],
    [
      "Pesagens",
      [pBruto, pLimpo, pPreparado].filter((p) => lerNumero(p) !== null).length === 0
        ? "nenhuma medida ainda"
        : `${[pBruto, pLimpo, pPreparado].filter((p) => lerNumero(p) !== null).length} de 3`,
    ],
  ];

  return (
    <>
      <Botao variante="primario" tamanho="sm" onClick={() => setAberta(true)}>
        Novo ingrediente
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={fechar}
        titulo={revisando ? "Confira antes de cadastrar" : "Novo ingrediente"}
        descricao={
          revisando
            ? "Este é o insumo como ele entrará na biblioteca."
            : "O insumo, o preço que você pagou e a data da compra."
        }
        acoes={
          revisando ? (
            <>
              <Botao variante="linha" tamanho="sm" onClick={() => setRevisando(false)}>
                Voltar e editar
              </Botao>
              <Botao variante="primario" tamanho="sm" onClick={salvar}>
                Cadastrar insumo
              </Botao>
            </>
          ) : (
            <>
              <Botao variante="linha" tamanho="sm" onClick={fechar}>
                Cancelar
              </Botao>
              <Botao
                variante="primario"
                tamanho="sm"
                disabled={!podeRevisar}
                onClick={() => setRevisando(true)}
              >
                Revisar
              </Botao>
            </>
          )
        }
      >
        {revisando ? (
          <div className="space-y-5">
            <dl className="divide-y divide-[var(--linha)] rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-2">
              {linhasDeRevisao.map(([rotulo, valor]) => (
                <div
                  key={rotulo}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5"
                >
                  <dt className="text-[0.8125rem] text-[var(--tinta-suave)]">{rotulo}</dt>
                  <dd className="text-right text-[0.875rem] text-tinta">{valor}</dd>
                </div>
              ))}
            </dl>

            {porUnidade !== null ? (
              <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-4">
                <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
                  Conta que o sistema fez
                </p>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                  {valorEmReais(precoNum as number)} ÷ {quantidade} {unidade} ={" "}
                  <strong className="font-semibold text-tinta">
                    {valorEmReais(porUnidade)} por {unidade}
                  </strong>
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
                  Foi só uma divisão dos dois números que você digitou. Nenhuma
                  regra da metodologia entrou nisso — e por isso mesmo o
                  sistema não converte essa unidade para outra.
                </p>
              </div>
            ) : null}

            <div className="rounded-[var(--raio)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.07)] px-4 py-3.5">
              <p className="text-[0.8125rem] font-semibold text-tinta">
                O insumo entra na biblioteca nesta sessão
              </p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                Ao cadastrar, ele passa a aparecer na biblioteca e a poder ser
                escolhido nas fichas — sem ser redigitado. O banco ainda não
                está conectado: ao recarregar a página, o insumo volta ao
                estado inicial.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <Campo
                label="Nome"
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Queijo mussarela"
                obrigatorio
              />

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
                ajuda="As categorias vêm do que já existe na biblioteca."
              />
              {categoria === SEM_CATEGORIA ? (
                <Campo
                  label="Nome da nova categoria"
                  name="categoriaNova"
                  value={categoriaNova}
                  onChange={(e) => setCategoriaNova(e.target.value)}
                  placeholder="Ex.: Laticínios"
                />
              ) : null}

              <CampoSelecao
                label="Unidade de compra"
                name="unidade"
                value={unidade}
                opcoes={UNIDADES.map((u) => ({ valor: u, texto: u }))}
                onChange={(e) => setUnidade(e.target.value)}
                ajuda="A unidade em que você compra, não a que a ficha usa."
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  label="Quantidade comprada"
                  name="quantidade"
                  inputMode="decimal"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="Ex.: 5"
                  ajuda="Na unidade acima."
                />
                <Campo
                  label="Preço pago"
                  name="preco"
                  inputMode="decimal"
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="Ex.: 214,50"
                  ajuda="Pelo total comprado, como está na nota."
                />
              </div>

              <Campo
                label="Fornecedor"
                name="fornecedor"
                value={fornecedor}
                onChange={(e) => setFornecedor(e.target.value)}
                placeholder="Onde você comprou"
              />
              <Campo
                label="Data do preço"
                name="data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                obrigatorio
                ajuda="O dia da compra. É esta data que faz o histórico servir para alguma coisa."
              />

              <Campo
                label="Observações"
                name="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Marca, embalagem, o que mais importar"
              />
            </div>

            {/*
              A CONTA APARECE ENQUANTO ELA DIGITA.

              Ver "R$ 42,90 por kg" ao lado do que acabou de digitar é a
              conferência mais rápida que existe: se o número parecer absurdo,
              provavelmente a vírgula escorregou.
            */}
            {porUnidade !== null ? (
              <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-3.5">
                <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
                  Só para você conferir
                </p>
                <p className="mt-2 text-[0.9375rem] text-tinta">
                  {valorEmReais(precoNum as number)} ÷ {quantidade} {unidade} ={" "}
                  <strong className="font-semibold">
                    {valorEmReais(porUnidade)} por {unidade}
                  </strong>
                </p>
                <p className="mt-1.5 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                  Uma divisão simples, com os seus números. Confira se o valor
                  faz sentido antes de seguir.
                </p>
              </div>
            ) : null}

            {/* ── PESAGENS (opcional) ─────────────────────────────────────── */}
            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-4">
              <button
                type="button"
                onClick={() => setMostrarPesagens((v) => !v)}
                className="flex w-full items-baseline justify-between gap-4 text-left"
              >
                <span>
                  <span className="block text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                    Pesagens do preparo — opcional
                  </span>
                  <span className="mt-1 block text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                    Se você já pesou este insumo na cozinha, informe aqui. Se
                    não, deixe em branco: ele entra na biblioteca do mesmo jeito,
                    e a pesagem pode ser feita depois.
                  </span>
                </span>
                <span className="shrink-0 text-[0.8125rem] text-[var(--tinta-suave)]">
                  {mostrarPesagens ? "Fechar" : "Abrir"}
                </span>
              </button>

              {mostrarPesagens ? (
                <div className="mt-4 space-y-4 border-t border-dashed border-[var(--linha-forte)] pt-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Campo
                      label="Peso de compra"
                      name="pBruto"
                      inputMode="decimal"
                      value={pBruto}
                      onChange={(e) => setPBruto(e.target.value)}
                      placeholder="Ex.: 5"
                      ajuda={`Em ${unidade}, como veio.`}
                    />
                    <Campo
                      label="Peso limpo"
                      name="pLimpo"
                      inputMode="decimal"
                      value={pLimpo}
                      onChange={(e) => setPLimpo(e.target.value)}
                      placeholder="Ex.: 4,5"
                      ajuda={`Em ${unidade}, depois de limpar.`}
                    />
                    <Campo
                      label="Peso preparado"
                      name="pPreparado"
                      inputMode="decimal"
                      value={pPreparado}
                      onChange={(e) => setPPreparado(e.target.value)}
                      placeholder="Ex.: 4"
                      ajuda={`Em ${unidade}, depois de cozinhar.`}
                    />
                  </div>

                  <Campo
                    label="Anotação do preparo"
                    name="obsPreparo"
                    value={obsPreparo}
                    onChange={(e) => setObsPreparo(e.target.value)}
                    placeholder="Corte, tempo, ponto"
                  />

                  <p className="text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                    Cada peso é uma medição. O sistema calcula a perda e o
                    rendimento a partir deles — e não estima o que não foi
                    medido. A unidade dos pesos é a mesma da compra, porque é
                    nessa que a balança foi lida.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                O que o sistema não calcula aqui
              </p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                Não há conversão da unidade de compra para a unidade usada na
                ficha, nem custo por porção. As duas dependem de quanto o insumo
                rende depois de limpo e de como a porção é definida — duas
                decisões que ainda não foram tomadas.
              </p>
            </div>
          </div>
        )}
      </Gaveta>
    </>
  );
}
