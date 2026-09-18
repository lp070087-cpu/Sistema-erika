"use client";

import { useMemo, useRef, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, Painel, Secao } from "@/components/ui/superficie";
import { Dado, ListaDados, ListaLinhas, LinhaDado } from "@/components/ui/dados";
import { dataCurta, valorEmReais } from "@/lib/dados";

/**
 * O FORMULÁRIO DO CONTRATO — a parte que se preenche.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CRONOGRAMA É UMA LISTA, E NÃO UMA QUANTIDADE DE CAMPOS FIXOS       │
 * │                                                                      │
 * │ A versão anterior deste formulário tinha um seletor "de 1 a 12       │
 * │ parcelas" e desenhava as linhas a partir do número escolhido. Isso    │
 * │ funcionava para dividir um valor em partes iguais e não funcionava    │
 * │ para mais nada: a Érika combina uma entrada de R$ 1.800 na assinatura │
 * │ mais três parcelas diferentes, e uma mensalidade recorrente por fora. │
 * │ Uma lista de valores iguais não representa esse combinado.            │
 * │                                                                      │
 * │ Aqui cada parcela é uma LINHA de verdade, com descrição, valor,       │
 * │ vencimento e tipo próprios, e a lista cresce e encolhe. Adicionar e    │
 * │ remover são as duas operações que um cronograma real precisa.         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE OS TRÊS TOTAIS FICAM FIXOS AO LADO                           │
 * │                                                                      │
 * │ Valor do projeto, total distribuído nas parcelas e diferença ainda não │
 * │ distribuída. Quando o cronograma tem dez linhas, a primeira some da   │
 * │ tela e some junto a resposta de "eu já distribuí tudo?". O painel     │
 * │ acompanha a rolagem porque é o número que se está tentando fazer      │
 * │ fechar — e fechar a conta é a única coisa que esta tela precisa       │
 * │ garantir.                                                             │
 * │                                                                      │
 * │ ISSO É SOMA ARITMÉTICA DE PARCELAS. Não é CMV, não é markup, não é    │
 * │ preço sugerido. O sistema não opina sobre quanto vale o trabalho da   │
 * │ Érika — ele só confere se as partes somam o todo que ela digitou.     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ NADA AQUI É GRAVADO, E ISSO É DITO EM TRÊS LUGARES                   │
 * │                                                                      │
 * │ 1. Na faixa de demonstração da página, antes de tudo.                  │
 * │ 2. No bloco "Antes de preencher", em cada etapa do formulário.         │
 * │ 3. Na revisão, com o contrato como ele ficaria.                        │
 * │                                                                      │
 * │ Três lugares porque cada um pega uma pessoa diferente: quem lê antes   │
 * │ de digitar, quem confere no fim, e quem clica direto sem ler nada.     │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * O teto da lista.
 *
 * Não é regra de negócio: nenhum contrato da Érika tem 48 parcelas. É freio
 * de digitação — sem teto, um "4" digitado a mais num campo numérico viraria
 * quatrocentas linhas e travaria a página. O domínio não tem esse limite; o
 * formulário tem, e o teto está escrito na tela quando se chega nele.
 */
const MAXIMO_DE_PARCELAS = 48;

/** Quantas linhas o formulário abre. Quatro é o combinado mais comum dela. */
const LINHAS_INICIAIS = 4;

type TipoParcela = "PARCELA" | "MENSALIDADE";

type LinhaParcela = {
  /** Identidade da linha no formulário. Não é o id da parcela no contrato. */
  chave: string;
  descricao: string;
  valor: string;
  venceEm: string;
  tipo: TipoParcela;
};

type Rascunho = {
  clienteId: string;
  titulo: string;
  valorTotal: string;
  inicio: string;
  entregaPrevista: string;
  escopo: string;
  observacoes: string;
  parcelas: LinhaParcela[];
};

/**
 * O número digitado, ou `null`.
 *
 * `null` e não `zero`: "não informado" e "custa nada" são coisas diferentes,
 * e um campo vazio tratado como zero faria a diferença do rodapé acusar
 * falta onde não há falta. Aceita "4.800,00", "4800" e "4800.00" — quem
 * digita no celular não troca a vírgula pelo ponto.
 */
function emNumero(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.-]/g, "").trim();
  if (!limpo) return null;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Centavos arredondados, para comparar duas somas sem erro de ponto flutuante. */
function emCentavos(n: number): number {
  return Math.round(n * 100);
}

function emReais(n: number): string {
  return valorEmReais(n, { centavos: true });
}

/**
 * O valor de uma linha, já formatado — ou um traço quando a linha está em
 * branco. Existe para não espalhar `emNumero(...) !== null ? ... : ...` por
 * três lugares, que é como uma das cópias acaba esquecendo o caso vazio.
 */
function textoDoValor(texto: string): string {
  const n = emNumero(texto);
  return n === null ? "—" : emReais(n);
}

/**
 * Soma meses a uma data ISO, sem estourar o mês.
 *
 * "2026-01-31" mais um mês não é "2026-02-31": é 28 ou 29 de fevereiro. O
 * JavaScript faria isso sozinho e devolveria 3 de março — a parcela de
 * fevereiro cairia em março em silêncio, e ninguém entenderia por quê. Aqui
 * o dia é limitado ao último dia do mês de destino.
 *
 * É aritmética de calendário. Nada a ver com data de validade, cocção ou
 * prazo de entrega — nada disso foi definido.
 */
function somarMeses(iso: string, meses: number): string {
  const [anoTexto, mesTexto, diaTexto] = iso.split("-");
  const ano = Number(anoTexto);
  const mes = Number(mesTexto);
  const dia = Number(diaTexto);
  // Data malformada devolve o que veio, em vez de calcular com zero: um
  // vencimento em 01/01/1900 seria pior do que nenhum vencimento.
  if (!anoTexto || !mesTexto || !diaTexto) return iso;
  if (!Number.isFinite(ano) || !Number.isFinite(mes) || !Number.isFinite(dia)) return iso;

  const base = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimoDia = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)
  ).getUTCDate();

  const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), Math.min(dia, ultimoDia)));
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${mm}-${dd}`;
}

function linhaVazia(chave: string): LinhaParcela {
  return { chave, descricao: "", valor: "", venceEm: "", tipo: "PARCELA" };
}

export function FormularioContrato({
  clientes,
  hoje,
}: {
  clientes: readonly { id: string; nome: string; contato: string }[];
  /** Hoje no fuso da marca, calculado no servidor. Ver a página. */
  hoje: string;
}) {
  const proximaChave = useRef(LINHAS_INICIAIS + 1);

  const [rascunho, setRascunho] = useState<Rascunho>(() => ({
    clienteId: clientes[0]?.id ?? "",
    titulo: "",
    valorTotal: "",
    inicio: "",
    entregaPrevista: "",
    escopo: "",
    observacoes: "",
    parcelas: Array.from({ length: LINHAS_INICIAIS }, (_, i) => linhaVazia(`p${i + 1}`)),
  }));

  const [revisando, setRevisando] = useState(false);

  // -- Números do rodapé ----------------------------------------------------

  const valorTotal = emNumero(rascunho.valorTotal);

  /**
   * O total distribuído soma apenas as linhas COM valor. Linha em branco é
   * linha ainda não preenchida — não é uma parcela de zero, e contá-la como
   * zero daria o mesmo resultado mas mentiria sobre o que foi distribuído.
   */
  const distribuido = rascunho.parcelas.reduce((t, p) => t + (emNumero(p.valor) ?? 0), 0);
  const linhasComValor = rascunho.parcelas.filter((p) => emNumero(p.valor) !== null).length;

  /**
   * A diferença. `null` quando não há valor de projeto informado: sem o
   * todo, "falta distribuir" não tem significado — e mostrar "faltam
   * R$ 4.800" quando o campo está vazio seria assustador e falso.
   */
  const diferenca =
    valorTotal === null ? null : (emCentavos(valorTotal) - emCentavos(distribuido)) / 100;

  const mensalidade = useMemo(() => {
    const linha = rascunho.parcelas.find((p) => p.tipo === "MENSALIDADE");
    return linha ? emNumero(linha.valor) : null;
  }, [rascunho.parcelas]);

  const podeRevisar =
    rascunho.clienteId !== "" &&
    rascunho.titulo.trim().length > 0 &&
    valorTotal !== null &&
    linhasComValor > 0;

  // -- Edição ---------------------------------------------------------------

  function campo<K extends keyof Rascunho>(chave: K, valor: Rascunho[K]) {
    setRascunho((r) => ({ ...r, [chave]: valor }));
  }

  function editarParcela(chave: string, mudanca: Partial<LinhaParcela>) {
    setRascunho((r) => ({
      ...r,
      parcelas: r.parcelas.map((p) => (p.chave === chave ? { ...p, ...mudanca } : p)),
    }));
  }

  function adicionarParcela() {
    setRascunho((r) => {
      if (r.parcelas.length >= MAXIMO_DE_PARCELAS) return r;
      const chave = `p${proximaChave.current}`;
      proximaChave.current += 1;
      return { ...r, parcelas: [...r.parcelas, linhaVazia(chave)] };
    });
  }

  function removerParcela(chave: string) {
    setRascunho((r) => {
      // A lista não fica vazia: um contrato sem nenhuma parcela não é um
      // contrato, e a tela ficaria sem onde digitar o valor.
      if (r.parcelas.length <= 1) return r;
      return { ...r, parcelas: r.parcelas.filter((p) => p.chave !== chave) };
    });
  }

  /**
   * Divide o valor do projeto entre as linhas existentes.
   *
   * A sobra dos centavos vai para a PRIMEIRA linha: dividir R$ 100 em três
   * dá 33,333…, e três parcelas de 33,33 somam 99,99. Um centavo perdido não
   * é detalhe — é um contrato que não fecha com o que foi combinado. A
   * diferença é jogada na primeira parcela, que é a maior.
   *
   * Substitui os valores das linhas que já existem e PRESERVA as descrições e
   * os vencimentos digitados: quem já escreveu "Entrada" não perde o rótulo
   * só porque pediu para dividir.
   */
  function dividirIgualmente() {
    if (valorTotal === null) return;
    setRascunho((r) => {
      const n = r.parcelas.length;
      const totalCentavos = emCentavos(valorTotal);
      const base = Math.floor(totalCentavos / n);
      const primeira = totalCentavos - base * (n - 1);

      return {
        ...r,
        parcelas: r.parcelas.map((p, i) => ({
          ...p,
          valor: formatarParaCampo((i === 0 ? primeira : base) / 100),
        })),
      };
    });
  }

  /**
   * Distribui vencimentos mensais a partir da data de início.
   *
   * A primeira parcela vence no dia do início — que é como a entrada é
   * combinada na prática: paga na assinatura. As seguintes caem mês a mês.
   * Não é regra de cobrança, é só um ponto de partida que ela ajusta linha a
   * linha; sem isso, preencher doze datas à mão seria o trabalho de sempre.
   */
  function distribuirVencimentos() {
    const base = rascunho.inicio || hoje;
    setRascunho((r) => ({
      ...r,
      parcelas: r.parcelas.map((p, i) => ({ ...p, venceEm: somarMeses(base, i) })),
    }));
  }

  /** O mesmo número do rodapé, de volta para o campo, sem símbolo de moeda. */
  function formatarParaCampo(n: number): string {
    return n.toFixed(2).replace(".", ",");
  }

  // -- Revisão --------------------------------------------------------------

  function voltar() {
    setRevisando(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const linhaDoCliente = clientes.find((c) => c.id === rascunho.clienteId);

  return (
    <div className="space-y-6">
      {revisando ? (
        <Revisao
          rascunho={rascunho}
          cliente={linhaDoCliente ?? null}
          valorTotal={valorTotal}
          distribuido={distribuido}
          diferenca={diferenca}
          mensalidade={mensalidade}
          aoVoltar={voltar}
        />
      ) : null}

      {!revisando ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
          <div className="space-y-6">
            {/* 1 e 2 — quem contrata e o que foi contratado --------------- */}
            <Secao
              rotulo="Passo 1 de 3"
              titulo="Quem contrata e o que foi contratado"
              descricao="O contrato liga um cliente da carteira a um serviço. Sem cliente não existe contrato — quem ainda é lead precisa ser convertido antes."
            >
              <div className="space-y-4">
                <CampoSelecao
                  label="Cliente"
                  name="cliente"
                  value={rascunho.clienteId}
                  opcoes={clientes.map((c) => ({ valor: c.id, texto: c.nome }))}
                  onChange={(e) => campo("clienteId", e.target.value)}
                  obrigatorio
                  ajuda="Só clientes já cadastrados."
                />
                <Campo
                  label="Serviço contratado"
                  name="titulo"
                  value={rascunho.titulo}
                  onChange={(e) => campo("titulo", e.target.value)}
                  placeholder="Ex.: Consultoria de operação e ficha técnica"
                  obrigatorio
                  ajuda="O nome do trabalho como ele aparece na lista de contratos."
                />
                <div>
                  <label
                    htmlFor="escopo"
                    className="mb-1.5 block text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-suave)] uppercase"
                  >
                    Escopo combinado
                  </label>
                  <textarea
                    id="escopo"
                    name="escopo"
                    rows={4}
                    value={rascunho.escopo}
                    onChange={(e) => campo("escopo", e.target.value)}
                    placeholder={"Uma linha por item.\nEx.: Leitura da operação atual\nEx.: Padronização da montagem"}
                    className="w-full resize-y rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 py-2 text-[0.9375rem] text-tinta transition-colors placeholder:text-[var(--tinta-fraca)] hover:border-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
                  />
                  <p className="mt-1.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
                    Cada linha vira um item da lista de escopo no contrato.
                  </p>
                </div>
              </div>
            </Secao>

            {/* 3, 4, 5 e 6 — valor, mensalidade, datas ------------------- */}
            <Secao
              rotulo="Passo 2 de 3"
              titulo="Valor e prazos"
              descricao="O valor do projeto é o todo. As parcelas, logo abaixo, são a divisão dele — e é o que o sistema confere no rodapé."
            >
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo
                    label="Valor do projeto"
                    name="valorTotal"
                    value={rascunho.valorTotal}
                    onChange={(e) => campo("valorTotal", e.target.value)}
                    placeholder="Ex.: 6300,00"
                    inputMode="decimal"
                    obrigatorio
                    ajuda="O valor cheio do trabalho, antes de dividir."
                  />
                  <Campo
                    label="Data de início"
                    name="inicio"
                    type="date"
                    value={rascunho.inicio}
                    onChange={(e) => campo("inicio", e.target.value)}
                    ajuda="Também é o ponto de partida dos vencimentos mensais."
                  />
                </div>
                <Campo
                  label="Previsão de entrega"
                  name="entregaPrevista"
                  type="date"
                  value={rascunho.entregaPrevista}
                  onChange={(e) => campo("entregaPrevista", e.target.value)}
                  ajuda="A data combinada para a entrega do trabalho. Pode ficar em branco se ainda não foi combinada."
                />
              </div>
            </Secao>

            {/* 7 a 10 — o cronograma ------------------------------------- */}
            <Secao
              rotulo="Passo 3 de 3"
              titulo="Cronograma de pagamentos"
              descricao="Quantas parcelas houver, com valor e vencimento próprios. Uma entrada na assinatura, três parcelas diferentes, ou uma mensalidade recorrente — é a mesma lista."
            >
              <div className="space-y-4">
                <ul className="space-y-3">
                  {rascunho.parcelas.map((p, i) => (
                    <li
                      key={p.chave}
                      className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie-solida)] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                          {p.tipo === "MENSALIDADE"
                            ? `${i + 1} · mensalidade recorrente`
                            : `${i + 1}ª parcela`}
                        </p>
                        <button
                          type="button"
                          onClick={() => removerParcela(p.chave)}
                          disabled={rascunho.parcelas.length <= 1}
                          className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase transition-colors hover:text-red-800 disabled:pointer-events-none disabled:opacity-40"
                        >
                          Remover
                        </button>
                      </div>

                      {/* Grade que vira uma coluna no celular — nunca tabela. */}
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <Campo
                            label="Descrição"
                            id={`${p.chave}-descricao`}
                            name={`${p.chave}-descricao`}
                            value={p.descricao}
                            onChange={(e) => editarParcela(p.chave, { descricao: e.target.value })}
                            placeholder={
                              i === 0 ? "Ex.: Entrada, na assinatura" : "Ex.: Parcela na entrega"
                            }
                          />
                        </div>
                        <Campo
                          label="Valor"
                          id={`${p.chave}-valor`}
                          name={`${p.chave}-valor`}
                          value={p.valor}
                          onChange={(e) => editarParcela(p.chave, { valor: e.target.value })}
                          placeholder="Ex.: 1800,00"
                          inputMode="decimal"
                        />
                        <Campo
                          label="Vencimento"
                          id={`${p.chave}-vence`}
                          name={`${p.chave}-vence`}
                          type="date"
                          value={p.venceEm}
                          onChange={(e) => editarParcela(p.chave, { venceEm: e.target.value })}
                        />
                        <div className="sm:col-span-2">
                          <CampoSelecao
                            label="Tipo"
                            id={`${p.chave}-tipo`}
                            name={`${p.chave}-tipo`}
                            value={p.tipo}
                            opcoes={[
                              { valor: "PARCELA", texto: "Parcela do trabalho" },
                              { valor: "MENSALIDADE", texto: "Mensalidade (recorrente)" },
                            ]}
                            onChange={(e) =>
                              editarParcela(p.chave, { tipo: e.target.value as TipoParcela })
                            }
                            ajuda={
                              p.tipo === "MENSALIDADE"
                                ? "A mensalidade é a única parcela recorrente do contrato. Marcar duas faria a tela do contrato ler só a primeira."
                                : undefined
                            }
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Botao
                    variante="secundario"
                    tamanho="sm"
                    onClick={adicionarParcela}
                    disabled={rascunho.parcelas.length >= MAXIMO_DE_PARCELAS}
                  >
                    Adicionar parcela
                  </Botao>
                  <Botao
                    variante="linha"
                    tamanho="sm"
                    onClick={dividirIgualmente}
                    disabled={valorTotal === null}
                  >
                    Dividir em partes iguais
                  </Botao>
                  <Botao variante="linha" tamanho="sm" onClick={distribuirVencimentos}>
                    Vencimentos mensais
                  </Botao>
                </div>

                <p className="text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                  {rascunho.parcelas.length === 1
                    ? "Uma parcela."
                    : `${rascunho.parcelas.length} parcelas na lista.`}{" "}
                  O sistema não fixa quantidade: o contrato aceita de uma a quantas
                  você combinar.{" "}
                  {rascunho.parcelas.length >= MAXIMO_DE_PARCELAS
                    ? `O formulário trava em ${MAXIMO_DE_PARCELAS} para uma digitação errada não criar mil linhas — o limite é da tela, não do contrato.`
                    : null}
                </p>
              </div>
            </Secao>

            {/* 11 — observações ------------------------------------------ */}
            <Secao
              rotulo="Antes de revisar"
              titulo="Observações"
              descricao="O que foi combinado por telefone, o que ficou de fora, condições que não cabem em campo nenhum. Fica registrado junto do contrato."
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="observacoes"
                    className="mb-1.5 block text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-suave)] uppercase"
                  >
                    Observações
                  </label>
                  <textarea
                    id="observacoes"
                    name="observacoes"
                    rows={4}
                    value={rascunho.observacoes}
                    onChange={(e) => campo("observacoes", e.target.value)}
                    placeholder="O que ficou combinado por telefone, prazos, condições…"
                    className="w-full resize-y rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 py-2 text-[0.9375rem] text-tinta transition-colors placeholder:text-[var(--tinta-fraca)] hover:border-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="rounded-[var(--raio)] border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.08)] px-4 py-3.5">
                  <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[#8a6d1f] uppercase">
                    Antes de preencher
                  </p>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                    <strong className="font-semibold text-tinta">
                      Dados de demonstração não são salvos ao recarregar.
                    </strong>{" "}
                    A montagem funciona para você ver como ficaria, mas a gravação depende do banco
                    de dados — que ainda não está conectado. Ao recarregar, o formulário volta
                    vazio.
                  </p>
                </div>
              </div>
            </Secao>
          </div>

          {/* Painel de totais — acompanha a rolagem --------------------- */}
          <Totais
            valorTotal={valorTotal}
            distribuido={distribuido}
            diferenca={diferenca}
            linhasComValor={linhasComValor}
            totalDeLinhas={rascunho.parcelas.length}
            mensalidade={mensalidade}
            podeRevisar={podeRevisar}
            aoRevisar={() => setRevisando(true)}
          />
        </div>
      ) : null}
    </div>
  );
}

/**
 * Os três totais, e o aviso quando a conta não fecha.
 *
 * O aviso não bloqueia o botão: uma proposta pode legitimamente estar
 * incompleta quando se está montando. O que não pode é o número passar
 * despercebido.
 */
function Totais({
  valorTotal,
  distribuido,
  diferenca,
  linhasComValor,
  totalDeLinhas,
  mensalidade,
  podeRevisar,
  aoRevisar,
}: {
  valorTotal: number | null;
  distribuido: number;
  diferenca: number | null;
  linhasComValor: number;
  totalDeLinhas: number;
  mensalidade: number | null;
  podeRevisar: boolean;
  aoRevisar: () => void;
}) {
  const fechou = diferenca !== null && Math.abs(diferenca) < 0.005;

  return (
    <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
      <Painel>
        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
          A conta do cronograma
        </p>

        <div className="mt-3.5">
          <ListaLinhas>
            <LinhaDado rotulo="Valor do projeto">
              {valorTotal === null ? (
                <span className="text-[var(--tinta-fraca)]">não informado</span>
              ) : (
                <span className="tabular font-medium">{emReais(valorTotal)}</span>
              )}
            </LinhaDado>
            <LinhaDado rotulo="Total distribuído nas parcelas">
              <span className="tabular">
                {linhasComValor === 0 ? (
                  <span className="text-[var(--tinta-fraca)]">nada distribuído</span>
                ) : (
                  emReais(distribuido)
                )}
              </span>
            </LinhaDado>
            <LinhaDado rotulo="Diferença ainda não distribuída">
              {diferenca === null ? (
                <span className="text-[var(--tinta-fraca)]">—</span>
              ) : (
                <span
                  className={`tabular font-medium ${
                    fechou ? "text-medio" : diferenca > 0 ? "text-[#8a6d1f]" : "text-red-800"
                  }`}
                >
                  {emReais(diferenca)}
                </span>
              )}
            </LinhaDado>
            <LinhaDado rotulo="Mensalidade">
              {mensalidade === null ? (
                <span className="text-[var(--tinta-fraca)]">nenhuma marcada</span>
              ) : (
                <span className="tabular">{emReais(mensalidade)}</span>
              )}
            </LinhaDado>
          </ListaLinhas>
        </div>

        <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
          {linhasComValor} de {totalDeLinhas}{" "}
          {totalDeLinhas === 1 ? "linha tem valor" : "linhas têm valor"}.
        </p>

        {/*
          `role="status"` para o leitor de tela anunciar o número quando ele
          muda: quem não vê a cor do valor não tem como saber que a conta
          fechou enquanto digita.
        */}
        {diferenca !== null ? (
          <div role="status" className="mt-3.5">
            {fechou ? (
              <Aviso tom="sucesso" titulo="A conta fecha">
                <p>As parcelas somam exatamente o valor do projeto.</p>
              </Aviso>
            ) : diferenca > 0 ? (
              <Aviso tom="atencao" titulo="Ainda falta distribuir">
                <p>
                  Faltam <strong className="font-semibold text-tinta">{emReais(diferenca)}</strong>{" "}
                  para as parcelas somarem o valor do projeto. Ajuste um valor ou acrescente uma
                  parcela.
                </p>
              </Aviso>
            ) : (
              <Aviso tom="critico" titulo="As parcelas somam mais que o projeto">
                <p>
                  As parcelas passam o valor do projeto em{" "}
                  <strong className="font-semibold text-tinta">
                    {emReais(Math.abs(diferenca))}
                  </strong>
                  . Ou o valor do projeto está menor do que devia, ou alguma parcela está maior.
                </p>
              </Aviso>
            )}
          </div>
        ) : null}

        <div className="mt-4">
          <Botao
            variante="primario"
            tamanho="md"
            disabled={!podeRevisar}
            onClick={aoRevisar}
            className="w-full"
          >
            Revisar contrato
          </Botao>
          {!podeRevisar ? (
            <p className="mt-2 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
              Para revisar, o formulário precisa de cliente, serviço, valor do projeto e pelo menos
              uma parcela com valor.
            </p>
          ) : null}
        </div>
      </Painel>

      <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
        <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          <span className="font-medium text-tinta">O sistema não sugere valor nenhum.</span> Não
          existe tabela de preço da Érika neste sistema, então nada aqui vem preenchido. Os três
          totais acima são soma de parcelas — não são CMV, não são markup e não são preço sugerido.
        </p>
      </div>
    </div>
  );
}

/**
 * A revisão — o contrato como ele ficaria.
 *
 * Repete o mesmo formato de confirmação das outras telas do sistema: os
 * dados em grade, o cronograma inteiro logo abaixo, e o aviso de que nada foi
 * gravado. É a última chance de ver o número antes de a pessoa fechar e
 * concluir que registrou.
 */
function Revisao({
  rascunho,
  cliente,
  valorTotal,
  distribuido,
  diferenca,
  mensalidade,
  aoVoltar,
}: {
  rascunho: Rascunho;
  cliente: { id: string; nome: string; contato: string } | null;
  valorTotal: number | null;
  distribuido: number;
  diferenca: number | null;
  mensalidade: number | null;
  aoVoltar: () => void;
}) {
  const itens = rascunho.escopo
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const fechou = diferenca !== null && Math.abs(diferenca) < 0.005;

  return (
    <div className="space-y-6">
      <Aviso tom="atencao" titulo="Nada foi gravado">
        <p>
          Este é o contrato como ele ficaria. O sistema ainda não tem banco conectado: se você
          recarregar a página, este contrato não vai estar na lista — e é assim que se percebe que
          nada foi salvo.
        </p>
      </Aviso>

      <Secao
        rotulo="Revisão"
        titulo="O contrato como ele ficaria"
        descricao="Confira o combinado antes de fechar. Os campos abaixo são os mesmos que o contrato mostra depois de gravado — nada aqui é diferente do que apareceria na ficha dele."
        acoes={
          <div className="flex flex-wrap items-center gap-2">
            <Botao variante="secundario" tamanho="sm" onClick={aoVoltar}>
              Voltar e editar
            </Botao>
            <Botao variante="linha" tamanho="sm" onClick={aoVoltar}>
              Entendi — fechar
            </Botao>
          </div>
        }
      >
        <div className="space-y-6">
          <ListaDados colunas={3}>
            <Dado rotulo="Cliente">{cliente?.nome ?? "—"}</Dado>
            <Dado rotulo="Responsável">{cliente?.contato ?? "—"}</Dado>
            <Dado rotulo="Serviço">{rascunho.titulo}</Dado>
            <Dado rotulo="Valor do projeto">
              {valorTotal === null ? "não informado" : emReais(valorTotal)}
            </Dado>
            <Dado rotulo="Total distribuído">{emReais(distribuido)}</Dado>
            <Dado rotulo="Diferença">
              {diferenca === null ? "—" : emReais(diferenca)}
            </Dado>
            <Dado rotulo="Início">
              {rascunho.inicio ? dataCurta(new Date(`${rascunho.inicio}T12:00:00`)) : "não informado"}
            </Dado>
            <Dado rotulo="Previsão de entrega">
              {rascunho.entregaPrevista
                ? dataCurta(new Date(`${rascunho.entregaPrevista}T12:00:00`))
                : "não combinada"}
            </Dado>
            <Dado rotulo="Mensalidade">
              {mensalidade === null ? "não há" : emReais(mensalidade)}
            </Dado>
            <Dado rotulo="Status inicial">
              Rascunho — nada foi enviado ao cliente ainda.
            </Dado>
            <Dado rotulo="Documento">
              Não enviado — o arquivo do contrato é anexado depois.
            </Dado>
            <Dado rotulo="Aceite">Nenhum — o cliente ainda não aceitou.</Dado>
            <Dado rotulo="Número do contrato" largo>
              Atribuído quando o contrato for gravado. O sistema não inventa numeração para uma
              proposta que ainda não existe.
            </Dado>
          </ListaDados>

          {itens.length > 0 ? (
            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Escopo combinado
              </p>
              <ul className="mt-3 space-y-2.5">
                {itens.map((item) => (
                  <li
                    key={item}
                    className="border-l-2 border-l-[var(--linha-forte)] pl-3 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {rascunho.observacoes ? (
            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Observações
              </p>
              <p className="mt-3 text-[0.875rem] leading-relaxed whitespace-pre-line text-[var(--tinta-suave)]">
                {rascunho.observacoes}
              </p>
            </div>
          ) : null}

          {/* O cronograma completo — a mesma lista que o contrato desenha --- */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Cronograma — {rascunho.parcelas.length}{" "}
                {rascunho.parcelas.length === 1 ? "linha" : "linhas"}
              </p>
              {diferenca !== null ? (
                <Etiqueta tom={fechou ? "verde" : diferenca > 0 ? "dourado" : "critico"}>
                  {fechou
                    ? "Conta fechada"
                    : diferenca > 0
                      ? `Faltam ${emReais(diferenca)}`
                      : `Excede ${emReais(Math.abs(diferenca))}`}
                </Etiqueta>
              ) : null}
            </div>

            <ol className="mt-3 space-y-2.5">
              {rascunho.parcelas.map((p, i) => (
                <li
                  key={p.chave}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 rounded-[var(--raio-sm)] border border-[var(--linha)] border-l-2 border-l-[var(--linha-forte)] bg-[var(--superficie)] px-3.5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[0.875rem] font-medium text-tinta">
                      {i + 1}. {p.descricao || "sem descrição"}
                      {p.tipo === "MENSALIDADE" ? (
                        <span className="ml-2 text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase">
                          Recorrente
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-[0.75rem] text-[var(--tinta-fraca)]">
                      {p.venceEm
                        ? `vence em ${dataCurta(new Date(`${p.venceEm}T12:00:00`))}`
                        : "sem data marcada"}
                    </p>
                  </div>
                  <span className="tabular text-[0.9375rem] text-tinta">
                    {textoDoValor(p.valor)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Secao>

      <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
        <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          <span className="font-medium text-tinta">A lista continua com cinco contratos.</span> É
          assim que se percebe que nada gravou: volte para a lista e conte. O aceite, o envio do
          documento e o registro de pagamento só existem depois que o contrato estiver salvo.
        </p>
      </div>
    </div>
  );
}
