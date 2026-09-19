import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import {
  CASAS_PERCENTUAL,
  CASAS_PESO,
  type IndicadoresTransformacao,
  type TransformacaoDerivada,
} from "@/lib/dados";

/**
 * O FLUXO DE RENDIMENTO DE UM INSUMO — COMPRA → LIMPEZA → PREPARO → RESULTADO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM COMPONENTE, E NÃO UM BLOCO EM CADA TELA            │
 * │                                                                      │
 * │ O mesmo desenho aparece em três lugares, e vai aparecer em mais:      │
 * │                                                                      │
 * │   · no detalhe do ingrediente, para mostrar como a batata rende       │
 * │   · na ficha técnica, para mostrar por que a mandioca custa mais do   │
 * │     que o preço da nota                                              │
 * │   · na planilha de custos, quando ela existir                        │
 * │                                                                      │
 * │ Desenhado três vezes, ele divergiria. E divergiria justamente no      │
 * │ número — a tela do insumo mostraria rendimento de 80% e a da ficha    │
 * │ 78%, porque uma delas arredondou antes de dividir. As duas telas      │
 * │ estariam "certas" isoladamente, e a consultora veria duas verdades    │
 * │ sobre a mesma batata.                                                 │
 * │                                                                      │
 * │ Aqui o desenho é um só e os números vêm de `derivarTransformacao`.    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ELE MOSTRA QUANDO FALTA MEDIÇÃO                                │
 * │                                                                      │
 * │ Uma etapa não medida aparece TRACEJADA e sem número — "não pesado".   │
 * │ Não aparece com o peso da etapa anterior no lugar, e não aparece com  │
 * │ o número da etapa seguinte.                                           │
 * │                                                                      │
 * │ O traço e a ausência de valor são a mesma informação que `null` no    │
 * │ domínio: um peso não medido não é o peso que estava lá antes, e o     │
 * │ desenho precisa dizer isso sem que ninguém leia uma legenda.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * Um peso, com casas fixas e unidade. Ausente vira traço.
 *
 * O número sai com casas decimais FIXAS, e não com o mínimo necessário. É
 * escolha de leitura, não de arredondamento: "4,500 kg" e "0,500 kg" alinhados
 * na mesma coluna deixam a diferença entre as etapas visível de relance, e
 * "4,5 kg" ao lado de "0,5 kg" obriga a contar casas.
 */
function peso(valor: number | null, unidade: string | null): string {
  if (valor === null) return "—";
  const n = valor.toFixed(CASAS_PESO).replace(".", ",");
  return unidade ? `${n} ${unidade}` : n;
}

function percentual(valor: number | null): string {
  if (valor === null) return "—";
  return `${valor.toFixed(CASAS_PERCENTUAL).replace(".", ",")}%`;
}

// ---------------------------------------------------------------------------

type Etapa = {
  chave: "COMPRA" | "LIMPEZA" | "PREPARO" | "RESULTADO";
  rotulo: string;
  /** O peso grande da etapa. */
  valor: string;
  /** O que aconteceu entre esta etapa e a anterior. */
  rotuloPerda: string | null;
  /** Explicação curta do que a etapa é. */
  nota: string;
  /** `false` quando o peso desta etapa não foi medido. */
  medido: boolean;
};

/**
 * Monta as quatro etapas a partir dos indicadores.
 *
 * A divisão em quatro e não em três é deliberada: a COMPRA é o que se paga,
 * o RESULTADO é o que sobra, e as duas etapas do meio são o que aconteceu no
 * caminho. Um desenho de três etapas juntaria "o que se compra" com "o que
 * se perde na limpeza", e é justamente a separação que faz a consultora ver
 * ONDE a perda acontece — se na casca ou no fogo.
 *
 * `unidade` chega por parâmetro porque os indicadores trazem pesos JÁ
 * normalizados, sem unidade — quem sabe em que unidade eles estão é quem
 * chamou `derivarTransformacao`.
 */
function montarEtapas(ind: IndicadoresTransformacao, unidade: string | null): Etapa[] {
  const temLimpeza = ind.limpo !== null;
  const temPreparo = ind.preparado !== null;

  return [
    {
      chave: "COMPRA",
      rotulo: "Compra",
      valor: peso(ind.bruto, unidade),
      rotuloPerda: null,
      nota: "Como o insumo chega, antes de qualquer perda.",
      medido: ind.bruto !== null,
    },
    {
      chave: "LIMPEZA",
      rotulo: "Limpeza",
      valor: peso(ind.limpo, unidade),
      rotuloPerda:
        ind.perdaLimpeza !== null
          ? `perdeu ${peso(ind.perdaLimpeza, unidade)}${
              ind.perdaLimpezaPct !== null ? ` (${percentual(ind.perdaLimpezaPct)})` : ""
            }`
          : null,
      nota: "Casca, aparas e partes descartadas.",
      medido: temLimpeza,
    },
    {
      chave: "PREPARO",
      rotulo: "Preparo",
      valor: peso(ind.preparado, unidade),
      rotuloPerda:
        ind.perdaPreparo !== null
          ? `perdeu ${peso(ind.perdaPreparo, unidade)}${
              ind.perdaPreparoPct !== null ? ` (${percentual(ind.perdaPreparoPct)})` : ""
            }`
          : null,
      nota: "Água que sai no fogo, gordura que escorre.",
      medido: temPreparo,
    },
    {
      chave: "RESULTADO",
      rotulo: "Resultado",
      valor: percentual(ind.rendimentoFinalPct),
      rotuloPerda:
        ind.perdaTotal !== null
          ? `perda total de ${peso(ind.perdaTotal, unidade)}`
          : null,
      nota: "Quanto do peso comprado virou produto utilizável.",
      medido: ind.rendimentoFinalPct !== null,
    },
  ];
}

// ---------------------------------------------------------------------------

export function FluxoRendimentoIngrediente({
  derivada,
  /** Unidade dos pesos, quando quem chama já sabe qual é. */
  unidade,
  /** Linha de contexto abaixo do fluxo — observação do preparo, etc. */
  rodape,
  className,
}: {
  derivada: TransformacaoDerivada;
  unidade?: string | null;
  rodape?: ReactNode;
  className?: string;
}) {
  const u = unidade ?? derivada.unidade;

  // Nenhum peso medido: o fluxo não tem o que desenhar. Dizer isso é melhor
  // do que desenhar quatro caixas com "—" dentro.
  if (derivada.etapasInformadas === 0) {
    return (
      <div
        className={cn(
          "rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] " +
            "bg-[rgba(242,236,226,0.45)] px-4 py-4",
          className
        )}
      >
        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
          Transformação
        </p>
        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          Nenhum peso deste insumo foi medido ainda. Enquanto não houver uma
          pesagem, o sistema não sabe quanto ele rende — e não estima.
        </p>
      </div>
    );
  }

  // Unidades de grandeza diferente entre as etapas: os pesos existem, mas não
  // são comparáveis. Somar kg com L daria um rendimento sem significado.
  if (derivada.unidadesIncompativeis) {
    return (
      <div
        className={cn(
          "rounded-[var(--raio)] border border-dashed border-[var(--tinta-fraca)]/50 " +
            "bg-[rgba(242,236,226,0.45)] px-4 py-4",
          className
        )}
      >
        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
          Transformação
        </p>
        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          As etapas deste insumo foram pesadas em unidades de grandezas
          diferentes — quilo em uma, litro em outra. O sistema não converte
          uma na outra sem que alguém meça, e por isso não calcula o
          rendimento.
        </p>
      </div>
    );
  }

  const etapas = montarEtapas(derivada.indicadores, u);

  return (
    <div className={className}>
      {/*
        A GRADE: quatro colunas no desktop, uma no celular.
        As setas são desenhadas em CSS a partir da coluna do meio, e não
        inseridas como elementos entre as caixas — assim o celular não precisa
        de uma seta apontando para baixo, que seria o único jeito de manter o
        mesmo HTML nas duas larguras.
      */}
      <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3">
        {etapas.map((e) => (
          <li
            key={e.chave}
            className={cn(
              "flex flex-col rounded-[var(--raio)] border px-3.5 py-3",
              e.medido
                ? "border-[var(--linha)] bg-[var(--superficie)]"
                : "border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.4)]"
            )}
          >
            <span className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              {e.rotulo}
            </span>

            <span
              className={cn(
                "tabular mt-1 font-display text-[1.25rem] leading-tight",
                e.medido ? "text-tinta" : "text-[var(--tinta-fraca)]"
              )}
            >
              {e.valor}
            </span>

            {!e.medido ? (
              <span className="mt-1 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
                não pesado
              </span>
            ) : null}

            {e.rotuloPerda ? (
              <span
                className={cn(
                  "tabular mt-1.5 text-[0.75rem] leading-snug",
                  e.chave === "RESULTADO" ? "text-oliva" : "text-[#8a6d1f]"
                )}
              >
                {e.rotuloPerda}
              </span>
            ) : null}

            <span className="mt-2 text-[0.75rem] leading-snug text-[var(--tinta-suave)]">
              {e.nota}
            </span>
          </li>
        ))}
      </ol>

      {rodape ? (
        <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          {rodape}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * A MESMA TRANSFORMAÇÃO, EM UMA LINHA — PARA DENTRO DE UMA TABELA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A VERSÃO CURTA EXISTE                                        │
 * │                                                                      │
 * │ O fluxo de quatro caixas é ótimo numa página e impossível dentro de   │
 * │ uma linha de tabela. Mas a informação que ela carrega — "comprou 5,    │
 * │ virou 4" — é exatamente a que a consultora precisa ver ENQUANTO       │
 * │ compara fichas, na lista.                                             │
 * │                                                                      │
 * │ Sem esta versão, a lista de fichas mostraria o custo sem mostrar de    │
 * │ onde ele vem, e o rendimento ficaria escondido atrás de um clique.     │
 * │                                                                      │
 * │ Ela usa os MESMOS indicadores do fluxo grande. O que muda é a          │
 * │ densidade, não o número.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function ResumoTransformacao({
  derivada,
  unidade,
  className,
}: {
  derivada: TransformacaoDerivada;
  unidade?: string | null;
  className?: string;
}) {
  const u = unidade ?? derivada.unidade;
  const ind = derivada.indicadores;

  if (ind.bruto === null) {
    return (
      <span className={cn("text-[0.8125rem] text-[var(--tinta-fraca)]", className)}>
        sem pesagem
      </span>
    );
  }

  const final = ind.preparado ?? ind.limpo;

  return (
    <span className={cn("tabular text-[0.8125rem] text-[var(--tinta-suave)]", className)}>
      {peso(ind.bruto, u)}
      {final !== null ? ` → ${peso(final, u)}` : null}
      {ind.rendimentoFinalPct !== null ? (
        <span className="ml-1.5 text-[var(--tinta-fraca)]">
          ({percentual(ind.rendimentoFinalPct)})
        </span>
      ) : null}
    </span>
  );
}
