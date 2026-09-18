"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Aviso } from "@/components/ui/superficie";

/**
 * NOVO INGREDIENTE — e a única conta que o sistema faz sozinho.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE AQUI PODE HAVER UMA DIVISÃO, E EM OUTROS LUGARES NÃO          │
 * │                                                                      │
 * │ "Preço pago ÷ quantidade comprada" é aritmética pura sobre dois        │
 * │ números que a consultora digitou. Ela comprou 5 kg e pagou R$ 120 —    │
 * │ o quilo custou R$ 24. Não há nenhuma decisão da Érika nessa conta:     │
 * │ não depende de fator de correção, de índice de cocção nem de regra de  │
 * │ arredondamento. Se ela não quiser, não usa.                           │
 * │                                                                      │
 * │ O QUE O SISTEMA SE RECUSA A FAZER, E A RAZÃO                          │
 * │                                                                      │
 * │ Converter a unidade de COMPRA para a unidade de USO na ficha. Se ela  │
 * │ compra uma caixa de 12 latas e a ficha pede em ml, alguém precisa     │
 * │ dizer quantos ml tem a lata — e se essa lata é aproveitada inteira.   │
 * │ Isso é fator de correção e rendimento: é método, não conta. Então o    │
 * │ formulário para na divisão e diz onde parou.                          │
 * │                                                                      │
 * │ O PREÇO SEMPRE ENTRA COM DATA. É a razão de a biblioteca existir.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const UNIDADES = ["kg", "g", "L", "ml", "un", "dúzia", "maço", "cx", "pct"] as const;

/** Hoje, no fuso de quem está usando — a data do preço é o dia da compra. */
function hojeLocal(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/**
 * Lê um número que a consultora digitou do jeito que ela digita.
 *
 * "12,90" e "12.90" são a mesma coisa para quem está olhando uma nota
 * fiscal. Recusar a vírgula obrigaria ela a converter mentalmente o número
 * que está lendo — e é exatamente aí que se digita 1290 sem perceber.
 */
function lerNumero(texto: string): number | null {
  const limpo = texto.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (limpo === "") return null;
  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Reais, do jeito que se escreve no Brasil. */
function emReais(valor: number): string {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

export function NovoIngrediente({ categorias }: { categorias: readonly string[] }) {
  const [aberta, setAberta] = useState(false);
  const [revisando, setRevisando] = useState(false);

  const SEM_CATEGORIA = "__nova__";
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState(categorias[0] ?? SEM_CATEGORIA);
  const [categoriaNova, setCategoriaNova] = useState("");
  const [unidade, setUnidade] = useState<string>("kg");
  const [quantidade, setQuantidade] = useState("");
  const [preco, setPreco] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [data, setData] = useState(hojeLocal());

  const categoriaFinal = categoria === SEM_CATEGORIA ? categoriaNova.trim() : categoria;

  const qtdNum = lerNumero(quantidade);
  const precoNum = lerNumero(preco);

  /**
   * A divisão. Só acontece quando os dois números existem e a quantidade é
   * maior que zero — e é exibida como "preço por unidade de compra", nunca
   * como "custo do insumo", que soaria como custo de ficha.
   */
  const porUnidade =
    qtdNum !== null && precoNum !== null ? precoNum / qtdNum : null;

  const podeRevisar =
    nome.trim().length > 0 && categoriaFinal.length > 0 && data !== "";

  function fechar() {
    setAberta(false);
    setRevisando(false);
    setNome("");
    setCategoriaNova("");
    setQuantidade("");
    setPreco("");
    setFornecedor("");
    setData(hojeLocal());
  }

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
            ? "Este é o insumo como ele ficaria. Ainda não foi cadastrado."
            : "O insumo, o preço que você pagou e a data da compra."
        }
        acoes={
          revisando ? (
            <>
              <Botao variante="linha" tamanho="sm" onClick={() => setRevisando(false)}>
                Voltar e editar
              </Botao>
              <Botao variante="primario" tamanho="sm" onClick={fechar}>
                Entendi — fechar
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
                Cadastrar insumo
              </Botao>
            </>
          )
        }
      >
        {revisando ? (
          <div className="space-y-5">
            <Aviso tom="atencao" titulo="Nada foi salvo ao recarregar">
              <p>
                A biblioteca continua com os mesmos insumos. O cadastro não é
                gravado enquanto o banco não estiver conectado.
              </p>
            </Aviso>

            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Como este insumo ficaria
              </p>
              <dl className="mt-3 divide-y divide-[var(--linha)] rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-2">
                {[
                  ["Ingrediente", nome],
                  ["Categoria", categoriaFinal],
                  ["Unidade", unidade],
                  ["Comprado", qtdNum !== null ? `${quantidade} ${unidade}` : "não informado"],
                  ["Pago", precoNum !== null ? emReais(precoNum) : "não informado"],
                  ["Fornecedor", fornecedor || "não informado"],
                  [
                    "Data do preço",
                    data
                      ? new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR")
                      : "—",
                  ],
                ].map(([rotulo, valor]) => (
                  <div
                    key={rotulo}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5"
                  >
                    <dt className="text-[0.8125rem] text-[var(--tinta-suave)]">{rotulo}</dt>
                    <dd className="text-right text-[0.875rem] text-tinta">{valor}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {porUnidade !== null ? (
              <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-4">
                <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
                  Conta que o sistema fez
                </p>
                <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                  {emReais(precoNum as number)} ÷ {quantidade} {unidade} ={" "}
                  <strong className="font-semibold text-tinta">
                    {emReais(porUnidade)} por {unidade}
                  </strong>
                </p>
                <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
                  Foi só uma divisão dos dois números que você digitou. O
                  sistema não usou nenhuma regra da metodologia para chegar
                  nisso — e por isso mesmo não converte essa unidade para
                  outra.
                </p>
              </div>
            ) : null}

            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
              <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <span className="font-medium text-tinta">
                  A unidade de compra é a unidade do insumo.
                </span>{" "}
                Se você comprar em caixa e a ficha pedir em ml, a conversão
                depende de quanto rende a caixa — isso é metodologia, e ainda
                não está definida.
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
                ajuda="O dia da compra. É esta data que faz o histórico servir para alguma coisa."
              />
            </div>

            {/*
              A conta aparece ENQUANTO ela digita. Ver "R$ 42,90 por kg" ao
              lado do que acabou de digitar é a conferência mais rápida que
              existe: se o número parecer absurdo, provavelmente a vírgula
              escorregou.
            */}
            {porUnidade !== null ? (
              <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-3.5">
                <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
                  Só para você conferir
                </p>
                <p className="mt-2 text-[0.9375rem] text-tinta">
                  {emReais(precoNum as number)} ÷ {quantidade} {unidade} ={" "}
                  <strong className="font-semibold">{emReais(porUnidade)} por {unidade}</strong>
                </p>
                <p className="mt-1.5 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                  Uma divisão simples, com os seus números. Confira se o valor
                  faz sentido antes de seguir.
                </p>
              </div>
            ) : null}

            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                O que o sistema não calcula aqui
              </p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <strong className="font-semibold text-tinta">
                  O cadastro guarda o preço como ele foi informado.
                </strong>{" "}
                Não há conversão da unidade de compra para a unidade usada na
                ficha, nem custo por porção. As duas dependem de quanto o
                insumo rende depois de limpo e de como a porção é definida —
                duas decisões que ainda não foram tomadas, e que estão
                nomeadas na tela da ficha.
              </p>
            </div>

            <div className="rounded-[var(--raio)] border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.08)] px-4 py-3.5">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[#8a6d1f] uppercase">
                Antes de preencher
              </p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <strong className="font-semibold text-tinta">
                  Dados de demonstração não são salvos ao recarregar.
                </strong>{" "}
                O insumo não entra na biblioteca enquanto o banco não estiver
                conectado.
              </p>
            </div>
          </div>
        )}
      </Gaveta>
    </>
  );
}
