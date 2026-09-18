"use client";

import { useRef, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Aviso } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";

/**
 * NOVA FICHA TÉCNICA — o cabeçalho e a lista de ingredientes.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A TELA NÃO TEM CAMPO DE CUSTO, E NÃO É POR FALTA DE ESPAÇO            │
 * │                                                                      │
 * │ O pedido original queria custo, CMV e preço sugerido por item. Nenhum │
 * │ dos três aparece — nem como campo vazio, nem como campo cinza.        │
 * │                                                                      │
 * │ O motivos é simples: um campo de custo em branco na tela é um convite │
 * │ para preencher "mais ou menos". E "mais ou menos" num custo vira CMV  │
 * │ errado, que vira preço errado, que vira prejuízo no fim do mês.       │
 * │                                                                      │
 * │ As decisões que faltam para o cálculo existir estão listadas em       │
 * │ `@/components/ui/metodologia`, com nome: quanto o alimento rende       │
 * │ depois de cozido, quanto se perde entre a compra e o uso, o que entra  │
 * │ na conta do custo, como o preço de venda é formado e quantas casas     │
 * │ cada número guarda.                                                   │
 * │                                                                      │
 * │ Então o formulário pede o que é fato: o que leva, quanto leva, quanto │
 * │ rende. E onde o custo ficaria, ele explica por que não está lá.       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O "+ ADICIONAR INGREDIENTE" INSERE UMA LINHA DE VERDADE.
 *
 * Não é um botão que abre um modal que promete salvar. As linhas são estado
 * local, aparecem na tela, podem ser removidas e valem enquanto a gaveta
 * estiver aberta. Ao recarregar, somem junto — e o aviso diz isso.
 */

// Não existe lista de unidades aqui de propósito: na ficha, a unidade de
// cada item vem do INSUMO já cadastrado, não de uma escolha livre. Uma lista
// local permitiria dizer "0,5 kg" de um insumo comprado em litro.

type Linha = {
  /** Chave local estável — não é id de banco, e o prefixo diz isso. */
  chave: number;
  ingredienteId: string;
  quantidade: string;
  unidade: string;
};

export function NovaFicha({
  clientes,
  ingredientes,
  categorias,
}: {
  clientes: readonly { id: string; nome: string }[];
  ingredientes: readonly { id: string; nome: string; unidade: string }[];
  /** Categorias que já existem no acervo — para não inventar taxonomia. */
  categorias: readonly string[];
}) {
  const [aberta, setAberta] = useState(false);
  const [revisando, setRevisando] = useState(false);

  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState(categorias[0] ?? "");
  const [categoriaNova, setCategoriaNova] = useState("");
  const [rendimento, setRendimento] = useState("");
  const [unidadeRendimento, setUnidadeRendimento] = useState("porções");
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

  const podeRevisar =
    clienteId !== "" && nome.trim().length > 0 && categoriaFinal.length > 0;

  function adicionarLinha() {
    if (ingredientes.length === 0) return;
    const primeiro = ingredientes[0];
    if (!primeiro) return;
    setLinhas((l) => [
      ...l,
      {
        chave: proximaChave.current++,
        ingredienteId: primeiro.id,
        quantidade: "",
        unidade: primeiro.unidade,
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

  function fechar() {
    setAberta(false);
    setRevisando(false);
    setNome("");
    setCategoria(categorias[0] ?? "");
    setCategoriaNova("");
    setRendimento("");
    setPorcao("");
    setLinhas([]);
  }

  return (
    <>
      <Botao variante="primario" tamanho="sm" onClick={() => setAberta(true)}>
        Nova ficha
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={fechar}
        titulo={revisando ? "Confira antes de criar" : "Nova ficha técnica"}
        descricao={
          revisando
            ? "Esta é a ficha como ela ficaria. Ainda não foi criada."
            : "O que o prato leva, quanto rende e para qual cliente."
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
                Criar ficha
              </Botao>
            </>
          )
        }
      >
        {revisando ? (
          <div className="space-y-5">
            <Aviso tom="atencao" titulo="Nada foi salvo ao recarregar">
              <p>
                A ficha não foi criada. O acervo continua com as mesmas fichas
                enquanto o banco não estiver conectado.
              </p>
            </Aviso>

            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Como esta ficha ficaria
              </p>
              <div className="mt-3 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-4">
                <ListaDados colunas={2}>
                  <Dado rotulo="Cliente">
                    {clientes.find((c) => c.id === clienteId)?.nome ?? "—"}
                  </Dado>
                  <Dado rotulo="Prato">{nome}</Dado>
                  <Dado rotulo="Categoria">{categoriaFinal}</Dado>
                  <Dado rotulo="Rendimento">
                    {rendimento
                      ? `${rendimento} ${unidadeRendimento}`
                      : "não declarado"}
                  </Dado>
                  <Dado rotulo="Porção">
                    {porcao ? `${porcao} g` : "não declarada"}
                  </Dado>
                  <Dado rotulo="Ingredientes">
                    <span className="tabular">{linhas.length}</span>
                  </Dado>
                </ListaDados>

                {linhas.length > 0 ? (
                  <ul className="mt-5 divide-y divide-[var(--linha)] border-t border-[var(--linha)]">
                    {linhas.map((l) => {
                      const ing = ingredientes.find((i) => i.id === l.ingredienteId);
                      return (
                        <li
                          key={l.chave}
                          className="flex items-baseline justify-between gap-4 py-2.5"
                        >
                          <span className="text-[0.875rem] text-tinta">
                            {ing?.nome ?? "—"}
                          </span>
                          <span className="text-right text-[0.875rem] text-[var(--tinta-suave)] tabular">
                            {l.quantidade || "quantidade não informada"} {l.unidade}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            </div>

            <div className="rounded-[var(--raio)] border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.08)] px-4 py-3.5">
              <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <strong className="font-semibold text-tinta">
                  A prévia mostra o que a ficha terá — sem custo.
                </strong>{" "}
                Custo, CMV e preço sugerido ficam de fora enquanto as decisões
                de metodologia estiverem abertas. A lista completa do que
                segura cada um deles está na tela da ficha, junto da composição.
              </p>
            </div>
          </div>
        ) : (
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

              <div className="grid gap-4 sm:grid-cols-3">
                <Campo
                  label="Rendimento"
                  name="rendimento"
                  inputMode="decimal"
                  value={rendimento}
                  onChange={(e) => setRendimento(e.target.value)}
                  placeholder="Ex.: 12"
                  ajuda="Quantas porções a receita rende."
                />
                <CampoSelecao
                  label="Unidade de rendimento"
                  name="unidadeRendimento"
                  value={unidadeRendimento}
                  opcoes={[
                    { valor: "porções", texto: "Porções" },
                    { valor: "unidades", texto: "Unidades" },
                    { valor: "kg", texto: "Quilos" },
                    { valor: "L", texto: "Litros" },
                  ]}
                  onChange={(e) => setUnidadeRendimento(e.target.value)}
                />
                <Campo
                  label="Porção (g)"
                  name="porcao"
                  inputMode="decimal"
                  value={porcao}
                  onChange={(e) => setPorcao(e.target.value)}
                  placeholder="Ex.: 320"
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
                  {linhas.length > 0 ? (
                    <ul className="mt-3 space-y-3">
                      {linhas.map((l) => (
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
                                    Unidade:{" "}
                                    <span className="text-tinta">{l.unidade}</span>
                                    <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                                      Vem do insumo, não é escolha livre.
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                setLinhas((lista) => lista.filter((x) => x.chave !== l.chave))
                              }
                              aria-label={`Remover ${ingredientes.find((i) => i.id === l.ingredienteId)?.nome ?? "ingrediente"}`}
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
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                      Nenhum ingrediente na ficha ainda. Adicione um por vez —
                      é assim que ela é montada na cozinha.
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

            {/* Por que não há custo aqui -------------------------------- */}
            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Por que não há campo de custo
              </p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <strong className="font-semibold text-tinta">
                  O formulário não pede custo porque ninguém decidiu como ele
                  é calculado.
                </strong>{" "}
                Pedir um número de custo aqui sem saber quanto o alimento rende
                depois de cozido, quanto se perde entre a compra e o uso e o que
                entra na conta seria registrar um valor do qual ninguém sabe a
                procedência — e um custo registrado errado vira preço errado sem
                ninguém perceber. O que a ficha pede é o que é fato: quantidade,
                unidade e rendimento.
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
                A ficha e os ingredientes que você adicionar somem ao
                recarregar a página.
              </p>
            </div>

          </div>
        )}
      </Gaveta>
    </>
  );
}
