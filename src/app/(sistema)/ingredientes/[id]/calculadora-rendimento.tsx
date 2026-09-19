"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Aviso, Painel } from "@/components/ui/superficie";
import { CorpoDeEdicao } from "@/components/ui/edicao";
import { cn } from "@/lib/utils/cn";
import {
  CASAS_PESO,
  calcularRendimento,
  lerPeso,
  numeroFixo,
  salvarTransformacao,
  type Compra,
  type PesoInformado,
  type Transformacao,
} from "@/lib/dados";

/**
 * A CALCULADORA DE RENDIMENTO — onde a Érika digita o que a balança marcou.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ELA FAZ, E EM QUE ORDEM                                         │
 * │                                                                      │
 * │ Ela compra 5 kg de batata por R$ 50. Descasca e pesa: 4,5 kg. Cozinha  │
 * │ e pesa de novo: 4,0 kg.                                                                │
 * │                                                                      │
 * │ Esses três pesos são TUDO o que este formulário pede. Todo o resto da  │
 * │ tela — a perda de cada etapa, o aproveitamento, o fator de correção,   │
 * │ o custo do quilo limpo e o custo efetivo final de R$ 12,50 — é         │
 * │ consequência aritmética deles, calculada por `calcularRendimento`.     │
 * │                                                                      │
 * │ ┌────────────────────────────────────────────────────────────────┐   │
 * │ │ POR QUE O FORMULÁRIO PEDE PESO, E NÃO PERCENTUAL               │   │
 * │ │                                                                │   │
 * │ │ Seria mais rápido pedir "quantos por cento se perde?" e         │   │
 * │ │ calcular o peso. Seria também o caminho para o sistema inventar  │   │
 * │ │ metodologia: um percentual DIGITADO é uma estimativa, e uma      │   │
 * │ │ estimativa estimada não é medição.                              │   │
 * │ │                                                                │   │
 * │ │ A balança é o instrumento que ela já tem na cozinha. O que o     │   │
 * │ │ sistema faz com dois pesos medidos é aritmética; o que ele faria │   │
 * │ │ com um percentual digitado seria repetir.                        │   │
 * │ └────────────────────────────────────────────────────────────────┘   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS DUAS COISAS QUE A TELA NÃO DEIXA ACONTECER                        │
 * │                                                                      │
 * │ 1. PESO FINAL MAIOR QUE O INICIAL NÃO É ERRO.                          │
 * │    Arroz, massa, feijão e legume seco ganham peso: a água absorvida    │
 * │    entra na panela e sai no prato. O campo aceita, o cálculo soma, e a  │
 * │    tela escreve "ganhou". Recusar isso obrigaria a Érika a mentir na   │
 * │    balança para o formulário calar — e aí o custo sairia errado para   │
 * │    sempre, sem ninguém saber.                                         │
 * │                                                                      │
 * │ 2. CAMPO VAZIO NÃO VIRA ZERO.                                          │
 * │    Cada peso é opcional e independente. O que não foi pesado fica      │
 * │    vazio, e o sistema mostra o traço no lugar do número — nunca o      │
 * │    número da etapa vizinha. Um zero ali entraria na conta como         │
 * │    "medi e deu zero", derrubando o custo.                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** Os três pesos, guardados como TEXTO enquanto ela digita. */
type RascunhoDePesos = {
  bruto: string;
  limpo: string;
  preparado: string;
  observacao: string;
};

/**
 * A unidade em que ela pesou, por etapa.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A UNIDADE É POR ETAPA, E NÃO UMA PARA O FORMULÁRIO TODO       │
 * │                                                                      │
 * │ Comprar em quilo e pesar a limpeza na balança de gramas é o caso      │
 * │ NORMAL, não a exceção: nota fiscal vem em kg, balança de cozinha       │
 * │ mostra g. Com uma unidade só, ela teria de converter de cabeça antes   │
 * │ de digitar — e converter de cabeça é onde o erro de dez vezes entra.   │
 * │                                                                      │
 * │ O motor já sabe normalizar entre kg e g, e entre L e ml. Ele NÃO sabe  │
 * │ converter quilo em litro, porque isso é densidade — e densidade o      │
 * │ sistema não inventa. Por isso a lista oferecida é só massa e volume.   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const UNIDADES = ["kg", "g", "L", "ml"] as const;

function paraTexto(p: PesoInformado | null): string {
  if (!p) return "";
  return String(p.peso).replace(".", ",");
}

function pesoDoCampo(texto: string, unidade: string): PesoInformado | null {
  const valor = lerPeso(texto);
  return valor === null ? null : { peso: valor, unidade };
}

export function CalculadoraRendimento({
  ingredienteId,
  nomeDoInsumo,
  compra,
  transformacao,
  unidadeDaCompra,
}: {
  ingredienteId: string;
  nomeDoInsumo: string;
  compra: Compra | null;
  transformacao: Transformacao;
  unidadeDaCompra: string;
}) {
  const [editando, setEditando] = useState(false);

  /*
    A UNIDADE INICIAL de cada etapa é a mais provável, e não uma escolha
    arbitrária: o peso de compra tende a seguir a unidade da nota fiscal
    (quilo, em quase todo insumo), e os pesos de limpeza e preparo tendem a vir
    da balança de cozinha, que mostra gramas. Se ela pesou em quilo, trocar é
    um clique — e o valor não muda de significado.
  */
  const inicial: RascunhoDePesos = {
    bruto: paraTexto(transformacao.bruto),
    limpo: paraTexto(transformacao.limpo),
    preparado: paraTexto(transformacao.preparado),
    observacao: transformacao.observacao,
  };

  const [rascunho, setRascunho] = useState<RascunhoDePesos>(inicial);
  const [unidades, setUnidades] = useState<Record<keyof Omit<RascunhoDePesos, "observacao">, string>>({
    bruto: transformacao.bruto?.unidade ?? unidadeDaCompra ?? "kg",
    limpo: transformacao.limpo?.unidade ?? "kg",
    preparado: transformacao.preparado?.unidade ?? "kg",
  });

  const calculo = calcularRendimento(compra, transformacao);
  const camposComValor = [rascunho.bruto, rascunho.limpo, rascunho.preparado].filter(
    (t) => t.trim() !== ""
  ).length;

  function abrir() {
    /*
      REABRE COM O QUE ESTÁ GRAVADO. Este é o ponto do padrão de edição: um
      formulário que abrisse vazio sobre dados existentes convidaria a
      redigitar — e redigitar quatro números com vírgula é onde a medição
      vira outro número.
    */
    const atual: RascunhoDePesos = {
      bruto: paraTexto(transformacao.bruto),
      limpo: paraTexto(transformacao.limpo),
      preparado: paraTexto(transformacao.preparado),
      observacao: transformacao.observacao,
    };
    setRascunho(atual);
    setUnidades({
      bruto: transformacao.bruto?.unidade ?? unidadeDaCompra ?? "kg",
      limpo: transformacao.limpo?.unidade ?? "kg",
      preparado: transformacao.preparado?.unidade ?? "kg",
    });
    setEditando(true);
  }

  function salvar(): string | null {
    const bruto = rascunho.bruto.trim() === "" ? null : pesoDoCampo(rascunho.bruto, unidades.bruto);
    const limpo = rascunho.limpo.trim() === "" ? null : pesoDoCampo(rascunho.limpo, unidades.limpo);
    const preparado =
      rascunho.preparado.trim() === "" ? null : pesoDoCampo(rascunho.preparado, unidades.preparado);

    /*
      ── A RECUSA É ESPECÍFICA, E POR CAMPO ──────────────────────────────
      "Valor inválido" no formulário inteiro faria ela revisar quatro campos
      para achar um. Cada recusa diz QUAL campo e POR QUE — e zero e negativo
      são recusados aqui, na leitura, antes de qualquer gravação.
    */
    if (rascunho.bruto.trim() !== "" && bruto === null) {
      return "O peso de compra não é um número maior que zero. Confira a vírgula.";
    }
    if (rascunho.limpo.trim() !== "" && limpo === null) {
      return "O peso depois de limpar não é um número maior que zero. Confira a vírgula.";
    }
    if (rascunho.preparado.trim() !== "" && preparado === null) {
      return "O peso depois de preparar não é um número maior que zero. Confira a vírgula.";
    }

    salvarTransformacao(ingredienteId, {
      bruto,
      limpo,
      preparado,
      observacao: rascunho.observacao,
    });

    setEditando(false);
    return null;
  }

  return (
    <div className="space-y-3">
      {/* ── As quatro etapas, com o que foi medido ─────────────────────── */}
      {calculo.etapasMedidas > 0 && !calculo.unidadesIncompativeis ? (
        <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {calculo.etapas.map((e) => (
            <li
              key={e.chave}
              className={cn(
                "flex flex-col rounded-[var(--raio)] border px-3.5 py-3",
                e.peso !== null || e.chave === "RESULTADO"
                  ? "border-[var(--linha)] bg-[var(--superficie)]"
                  : "border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.4)]"
              )}
            >
              <span className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                {e.titulo}
              </span>
              <span
                className={cn(
                  "tabular mt-1 font-display text-[1.25rem] leading-tight",
                  e.chave === "RESULTADO" && calculo.custoEfetivo !== null
                    ? "text-oliva"
                    : "text-tinta"
                )}
              >
                {e.pesoEmTexto}
              </span>
              {e.pesadaEm ? (
                <span className="mt-0.5 text-[0.6875rem] text-[var(--tinta-fraca)]">
                  pesado em {e.pesadaEm}
                </span>
              ) : null}
              <span className="mt-1.5 text-[0.75rem] leading-snug text-[var(--tinta-suave)]">
                {e.nota}
              </span>
            </li>
          ))}
        </ol>
      ) : null}

      {calculo.unidadesIncompativeis ? (
        <Aviso tom="atencao" titulo="As unidades destas pesagens não se comparam">
          <p>
            Uma etapa foi pesada em unidade de massa e outra em unidade de
            volume — quilo numa, litro na outra. Converter as duas exigiria a
            densidade do produto, que o sistema não conhece e não estima.
            Corrija a unidade de uma das etapas para o cálculo voltar.
          </p>
        </Aviso>
      ) : null}

      {calculo.temGanho ? (
        <Aviso tom="info" titulo="Este insumo ganhou peso">
          <p>
            Uma das etapas terminou mais pesada do que começou. Isso acontece
            com arroz, massa, feijão e legume seco, que absorvem água no
            preparo — e é uma medição correta, não um erro de digitação. O
            sistema usa o peso que você mediu, e o custo do quilo cai, porque
            o mesmo dinheiro comprou mais peso.
          </p>
        </Aviso>
      ) : null}

      {/* ── O botão de editar, ou o formulário aberto ──────────────────── */}
      {!editando ? (
        <div className="flex flex-wrap items-center gap-3">
          <Botao variante="linha" tamanho="sm" onClick={abrir}>
            {camposComValor > 0 ? "Corrigir pesagens" : "Informar pesagens"}
          </Botao>
          <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">
            {camposComValor === 0
              ? "Nenhum peso deste insumo foi medido ainda."
              : `${camposComValor} de 3 pesos medidos.`}
          </span>
        </div>
      ) : (
        <Painel>
          <CorpoDeEdicao
            aberto={editando}
            rascunho={rascunho}
            aoSalvar={salvar}
            aoCancelar={() => setEditando(false)}
            rotuloSalvar="Salvar pesagens"
          >
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Pesagens de {nomeDoInsumo}
            </p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Informe só as etapas que você pesou. Uma etapa em branco fica sem
              número — o sistema não estima no lugar dela.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <CampoDePeso
                rotulo="Peso de compra"
                ajuda="Quanto chegou, antes de limpar."
                texto={rascunho.bruto}
                unidade={unidades.bruto}
                aoMudarTexto={(t) => setRascunho((r) => ({ ...r, bruto: t }))}
                aoMudarUnidade={(u) => setUnidades((s) => ({ ...s, bruto: u }))}
              />
              <CampoDePeso
                rotulo="Depois de limpar"
                ajuda="Descascado, aparado, sem a parte que se joga fora."
                texto={rascunho.limpo}
                unidade={unidades.limpo}
                aoMudarTexto={(t) => setRascunho((r) => ({ ...r, limpo: t }))}
                aoMudarUnidade={(u) => setUnidades((s) => ({ ...s, limpo: u }))}
              />
              <CampoDePeso
                rotulo="Depois de preparar"
                ajuda="Cozido, assado ou grelhado — como vai para o prato."
                texto={rascunho.preparado}
                unidade={unidades.preparado}
                aoMudarTexto={(t) => setRascunho((r) => ({ ...r, preparado: t }))}
                aoMudarUnidade={(u) => setUnidades((s) => ({ ...s, preparado: u }))}
              />
            </div>

            <label className="block">
              <span className="text-[0.8125rem] font-medium text-tinta">
                Observação do preparo
              </span>
              <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                Corte, tempo, ponto, marca. Fica junto da medição.
              </span>
              <textarea
                value={rascunho.observacao}
                onChange={(e) => setRascunho((r) => ({ ...r, observacao: e.target.value }))}
                rows={2}
                className={
                  "mt-1.5 w-full rounded-[var(--raio-sm)] border border-oliva bg-white " +
                  "px-2.5 py-1.5 text-[0.875rem] text-tinta outline-none"
                }
              />
            </label>

            {/* A leitura de volta: o que o sistema entendeu, antes de gravar. */}
            <LeituraDeVolta
              rascunho={rascunho}
              unidades={unidades}
              compra={compra}
              unidadeDaCompra={unidadeDaCompra}
            />
          </CorpoDeEdicao>
        </Painel>
      )}

      {/*
        O QUE A GRAVAÇÃO É, HOJE, DITO COM TODAS AS LETRAS.
        A camada de dados do projeto é de demonstração — não há banco
        conectado. Um botão "Salvar" que fechasse o formulário em silêncio
        faria ela acreditar no dado na próxima recarga, e não haveria.
      */}
      {!editando ? (
        <p className="text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
          As pesagens ficam salvas nesta sessão do navegador. O banco de dados
          ainda não está conectado — ao fechar, elas voltam ao valor de
          demonstração.
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * UM PESO E A UNIDADE DELE, LADO A LADO.
 *
 * A unidade é um `<select>` e não um texto livre porque o motor só sabe
 * operar quatro delas. Aceitar "quilos" ou "quilo" ou "KILO" criaria um valor
 * que ela digita e o cálculo não reconhece — e a linha sairia do cálculo sem
 * explicação.
 */
function CampoDePeso({
  rotulo,
  ajuda,
  texto,
  unidade,
  aoMudarTexto,
  aoMudarUnidade,
}: {
  rotulo: string;
  ajuda: string;
  texto: string;
  unidade: string;
  aoMudarTexto: (t: string) => void;
  aoMudarUnidade: (u: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[0.8125rem] font-medium text-tinta">{rotulo}</span>
      <span className="mt-0.5 block text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
        {ajuda}
      </span>
      <span className="mt-1.5 flex items-stretch gap-1.5">
        <input
          type="text"
          inputMode="decimal"
          value={texto}
          onChange={(e) => aoMudarTexto(e.target.value)}
          placeholder="0,000"
          aria-label={`${rotulo}, em ${unidade}`}
          className={
            "tabular h-9 w-full rounded-[var(--raio-sm)] border border-oliva bg-white " +
            "px-2 text-[0.875rem] text-tinta outline-none placeholder:text-[var(--tinta-fraca)]"
          }
        />
        <select
          value={unidade}
          onChange={(e) => aoMudarUnidade(e.target.value)}
          aria-label={`Unidade de ${rotulo}`}
          className={
            "h-9 rounded-[var(--raio-sm)] border border-oliva bg-white px-1.5 " +
            "text-[0.875rem] text-tinta outline-none"
          }
        >
          {UNIDADES.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

// ---------------------------------------------------------------------------

/**
 * A LEITURA DE VOLTA — o que o sistema entendeu dos pesos, antes de gravar.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE, E POR QUE ELE FICA DENTRO DO FORMULÁRIO          │
 * │                                                                      │
 * │ "1.200" são mil e duzentos gramas, ou um vírgula dois quilos? Nenhuma  │
 * │ expressão regular responde — depende de quem digitou. O sistema não    │
 * │ pode adivinhar, mas pode MOSTRAR: com o número lido de volta em       │
 * │ gramas, "1.200" aparece como "1 g" e ela vê o erro ANTES de gravar.    │
 * │                                                                      │
 * │ É a última linha de defesa contra o erro de mil vezes, que é o mais    │
 * │ caro de todos num sistema de custo e o mais fácil de não notar: um     │
 * │ quilo que virou um grama some do custo, e o total continua com cara    │
 * │ de certo.                                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function LeituraDeVolta({
  rascunho,
  unidades,
  compra,
  unidadeDaCompra,
}: {
  rascunho: RascunhoDePesos;
  unidades: Record<"bruto" | "limpo" | "preparado", string>;
  compra: Compra | null;
  unidadeDaCompra: string;
}) {
  const bruto = rascunho.bruto.trim() === "" ? null : pesoDoCampo(rascunho.bruto, unidades.bruto);
  const limpo = rascunho.limpo.trim() === "" ? null : pesoDoCampo(rascunho.limpo, unidades.limpo);
  const preparado =
    rascunho.preparado.trim() === "" ? null : pesoDoCampo(rascunho.preparado, unidades.preparado);

  const previa = calcularRendimento(compra, {
    bruto,
    limpo,
    preparado,
    observacao: rascunho.observacao,
  });

  const nenhum = bruto === null && limpo === null && preparado === null;
  if (nenhum) {
    return (
      <p className="text-[0.8125rem] text-[var(--tinta-fraca)]">
        Nenhuma pesagem informada — nada foi medido ainda.
      </p>
    );
  }

  const e = (v: number | null, u: string | null) =>
    v === null ? "—" : `${numeroFixo(v, CASAS_PESO)}${u ? ` ${u}` : ""}`;

  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[rgba(242,236,226,0.4)] px-3.5 py-3">
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        Como o sistema leu
      </p>

      <ul className="mt-2 space-y-1">
        {bruto !== null ? (
          <li className="tabular text-[0.8125rem] text-[var(--tinta-suave)]">
            Peso de compra: <strong className="font-semibold text-tinta">{e(bruto.peso, bruto.unidade)}</strong>
          </li>
        ) : null}
        {limpo !== null ? (
          <li className="tabular text-[0.8125rem] text-[var(--tinta-suave)]">
            Depois de limpar: <strong className="font-semibold text-tinta">{e(limpo.peso, limpo.unidade)}</strong>
          </li>
        ) : null}
        {preparado !== null ? (
          <li className="tabular text-[0.8125rem] text-[var(--tinta-suave)]">
            Depois de preparar: <strong className="font-semibold text-tinta">{e(preparado.peso, preparado.unidade)}</strong>
          </li>
        ) : null}
      </ul>

      {previa.unidadesIncompativeis ? (
        <p className="mt-2 text-[0.8125rem] text-[#8a6d1f]">
          As unidades acima não se comparam — o rendimento não vai ser
          calculado até que sejam da mesma grandeza.
        </p>
      ) : (
        <dl className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-[var(--linha)] pt-2.5 sm:grid-cols-3">
          <Indicador rotulo="Perda na limpeza" valor={e(previa.derivada.indicadores.perdaLimpeza, previa.unidade)} />
          <Indicador
            rotulo="Aproveitamento"
            valor={
              previa.derivada.indicadores.rendimentoLimpezaPct === null
                ? "—"
                : `${numeroFixo(previa.derivada.indicadores.rendimentoLimpezaPct, 1)}%`
            }
          />
          <Indicador
            rotulo="Fator de correção"
            valor={
              bruto !== null && limpo !== null && previa.derivada.indicadores.limpo !== null
                ? numeroFixo(bruto.peso / previa.derivada.indicadores.limpo, 4)
                : "—"
            }
          />
          <Indicador rotulo="Rendimento total" valor={
            previa.derivada.indicadores.rendimentoFinalPct === null
              ? "—"
              : `${numeroFixo(previa.derivada.indicadores.rendimentoFinalPct, 1)}%`
          } />
          <Indicador
            rotulo="Custo efetivo final"
            valor={previa.custoEfetivo === null ? "—" : `R$ ${numeroFixo(previa.custoEfetivo, 2)}`}
            destaque
          />
          <Indicador
            rotulo="Preço do peso comprado"
            valor={
              previa.custos.compra === null
                ? "—"
                : `R$ ${numeroFixo(previa.custos.compra, 2)} / ${unidadeDaCompra}`
            }
          />
        </dl>
      )}
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <dt className="text-[0.6875rem] tracking-[0.06em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </dt>
      <dd
        className={cn(
          "tabular text-[0.875rem]",
          destaque ? "font-semibold text-oliva" : "text-tinta"
        )}
      >
        {valor}
      </dd>
    </div>
  );
}
