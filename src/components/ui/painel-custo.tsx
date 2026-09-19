import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Etiqueta, Indicador, type Tom } from "./indicador";
import {
  ACAO_DO_ESTADO_ITEM,
  CASAS_CUSTO,
  CASAS_PERCENTUAL,
  CASAS_PESO,
  ROTULO_ESTADO_ITEM,
  type EstadoCalculoItem,
  type PesoDaFicha,
  type ResumoCustoFicha,
} from "@/lib/dados";
import { valorEmReais } from "@/lib/dados";

/**
 * O PAINEL DE CUSTO E RENDIMENTO — os seis números de uma ficha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA QUE GOVERNA ESTE ARQUIVO                                     │
 * │                                                                      │
 * │ NENHUM NÚMERO AQUI É INVENTADO. Onde o dado não existe, aparece "—"   │
 * │ ou "Aguardando dados", e aparece uma frase dizendo do que se está     │
 * │ esperando.                                                            │
 * │                                                                      │
 * │ A tentação é preencher. Um painel com cinco números e um traço parece │
 * │ inacabado, e é muito fácil "resolver" mostrando o custo de compra no   │
 * │ lugar do custo preparado, ou um rendimento de 100%. Os dois números    │
 * │ teriam a aparência exata de números certos — e levariam a consultora   │
 * │ a fechar um preço de venda em cima deles.                              │
 * │                                                                      │
 * │ Um traço é feio e é verdadeiro. É a escolha.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ E QUANDO O TOTAL NÃO FECHA                                           │
 * │                                                                      │
 * │ O custo total tem duas versões, e a diferença entre elas é o que      │
 * │ torna este painel honesto:                                            │
 * │                                                                      │
 * │   · FECHADO   — todas as linhas entraram na soma. É o custo.          │
 * │   · PARCIAL   — algumas linhas ficaram de fora. É um PISO: o custo    │
 * │                 real é maior, e ninguém sabe quanto.                  │
 * │                                                                      │
 * │ O painel não mostra a segunda versão com a mesma tipografia da        │
 * │ primeira. Ela vem marcada, com a contagem de linhas de fora, e o      │
 * │ custo por porção SOME — porque dividir um piso por doze daria um       │
 * │ número menor que o real com cara de custo por porção.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */

function moeda(valor: number | null): string {
  return valor === null ? "—" : valorEmReais(valor);
}

function quantidade(valor: number | null, unidade: string | null): string {
  if (valor === null) return "—";
  return `${valor.toFixed(CASAS_PESO).replace(".", ",")}${unidade ? ` ${unidade}` : ""}`;
}

/**
 * O texto que diz POR QUE uma linha ficou de fora — em uma frase, por motivo.
 *
 * Os motivos vêm agrupados e contados, e não numa linha por item: numa ficha
 * de doze ingredientes sem preço, doze frases iguais seriam ruído. "3 linhas
 * sem preço" é a informação; qual linha é cada uma está na própria tabela,
 * marcada ao lado do item.
 */
function resumoDosMotivos(
  motivos: ResumoCustoFicha["motivos"]
): Array<{ estado: EstadoCalculoItem; quantidade: number; rotulo: string; acao: string }> {
  return motivos.map((m) => ({
    ...m,
    rotulo: ROTULO_ESTADO_ITEM[m.estado],
    acao: ACAO_DO_ESTADO_ITEM[m.estado],
  }));
}

// ---------------------------------------------------------------------------

export function PainelCustoERendimento({
  resumo,
  peso,
  /** Unidade do peso inicial/final, quando conhecida. */
  unidadeDoPeso,
  /** O rendimento declarado em porções, para o rótulo do custo por porção. */
  porcoes,
  className,
}: {
  resumo: ResumoCustoFicha;
  peso: PesoDaFicha;
  unidadeDoPeso?: string | null;
  porcoes: number | null;
  className?: string;
}) {
  const u = unidadeDoPeso ?? peso.unidade;
  const motivos = resumoDosMotivos(resumo.motivos);

  /*
    O TOM DO TOTAL. Não é um julgamento sobre o valor — é sobre a COMPLETUDE
    da conta. Um total parcial fica em "atenção" porque o número que está na
    tela não é o número que a consultora precisa; um total fechado fica
    neutro. Nenhum dos dois diz se o custo é alto ou baixo: o sistema não
    sabe o que é caro para o negócio dela.
  */
  const tomTotal: Tom = resumo.vazio ? "neutro" : resumo.completo ? "neutro" : "atencao";

  /*
    O PAINEL INTEIRO, QUANDO NÃO HÁ O QUE SOMAR.

    Uma ficha sem itens não é uma ficha com custo zero — é uma ficha que
    ainda não foi escrita. Mostrar seis indicadores com "—" daria a impressão
    de que falta preencher campos, quando falta a ficha.
  */
  if (resumo.vazio) {
    return (
      <div
        className={cn(
          "rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] " +
            "bg-[rgba(242,236,226,0.45)] px-5 py-5",
          className
        )}
      >
        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
          Custo e rendimento
        </p>
        <p className="mt-1.5 max-w-[70ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          Aguardando dados. Esta ficha ainda não tem ingrediente nenhum
          lançado — sem item, não há custo a somar nem peso a totalizar.
        </p>
      </div>
    );
  }

  /*
    O PESO INICIAL SÓ EXISTE QUANDO TODAS AS LINHAS ESTÃO NA MESMA ETAPA.

    `pesarFicha` devolve `etapa: null` quando as linhas foram pesadas em
    etapas diferentes — juntar o peso de compra da mandioca com o peso
    preparado do frango daria um número que não corresponde a nada que exista
    na cozinha. Nesse caso o total vem `null`, e o painel diz por quê.
  */
  const pesoInicial = peso.etapa !== null ? peso.total : null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Indicador
          emCard
          rotulo={resumo.completo ? "Custo total" : "Custo total (parcial)"}
          valor={moeda(resumo.custoTotal)}
          tom={tomTotal}
          contexto={
            resumo.completo
              ? `${resumo.itensSomados} ${resumo.itensSomados === 1 ? "ingrediente" : "ingredientes"} somados`
              : `${resumo.itensSomados} somados · ${resumo.itensFora} fora`
          }
        />

        <Indicador
          emCard
          rotulo="Custo por porção"
          valor={moeda(resumo.custoPorPorcao)}
          contexto={
            resumo.custoPorPorcao === null
              ? resumo.completo
                ? "Rendimento em porções não declarado"
                : "Aguardando as linhas que faltam"
              : porcoes !== null
                ? `dividido em ${porcoes} ${porcoes === 1 ? "porção" : "porções"}`
                : undefined
          }
        />

        <Indicador
          emCard
          rotulo="Peso inicial"
          valor={quantidade(pesoInicial, u)}
          contexto={
            pesoInicial === null
              ? peso.etapasEncontradas.length > 1
                ? "As linhas estão em etapas diferentes"
                : "Nenhuma linha com peso"
              : "Soma das quantidades declaradas"
          }
        />

        <Indicador
          emCard
          rotulo="Peso final"
          valor="—"
          contexto="Nenhuma ficha tem peso do prato pronto medido ainda"
        />

        <Indicador
          emCard
          rotulo="Rendimento"
          valor="—"
          contexto="Depende do peso do prato pronto"
        />

        <Indicador
          emCard
          rotulo="Perda total"
          valor="—"
          contexto="Depende do peso do prato pronto"
        />
      </div>

      {/*
        A EXPLICAÇÃO DAS LINHAS DE FORA.

        Só aparece quando há linha de fora — e não é um aviso genérico: cada
        motivo diz o que aconteceu e o que resolve, porque os quatro motivos
        pedem quatro ações diferentes.
      */}
      {motivos.length > 0 ? (
        <div className="rounded-[var(--raio)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.06)] px-4 py-3.5">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[#7a6119] uppercase">
            O que ficou fora da soma
          </p>
          <ul className="mt-2 space-y-2">
            {motivos.map((m) => (
              <li key={m.estado} className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Etiqueta tom="dourado">
                  {m.quantidade} {m.quantidade === 1 ? "linha" : "linhas"}
                </Etiqueta>
                <span className="text-[0.875rem] font-medium text-tinta">{m.rotulo}</span>
                <span className="text-[0.8125rem] text-[var(--tinta-suave)]">{m.acao}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 border-t border-dashed border-dourado/40 pt-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
            O custo total acima soma apenas as linhas que entraram. Enquanto
            houver linha de fora, ele é o <strong className="font-semibold">piso</strong> do
            custo — o custo real é maior, e não dá para saber quanto.
          </p>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * A TABELA DO QUE A FICHA CALCULOU — as colunas do §8, na ordem do §8.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE AS COLUNAS APARECEM E DESAPARECEM                            │
 * │                                                                      │
 * │ O briefing pede nove colunas "quando aplicáveis". Aplicáveis é a      │
 * │ palavra que decide: uma ficha em que nenhum insumo tem peso medido    │
 * │ mostraria quatro colunas de "—", e a tabela ficaria mais difícil de   │
 * │ ler do que a versão sem elas.                                         │
 * │                                                                      │
 * │ Então as colunas de peso só entram quando existe pelo menos uma linha │
 * │ com peso medido. Não é economia de espaço — é não poluir com         │
 * │ coluna vazia.                                                         │
 * │                                                                      │
 * │ A DECISÃO SOBRE MOBILE É DO COMPONENTE DE LISTA, não daqui: a ficha    │
 * │ usa `ListaResponsiva`, que vira cartão abaixo de `lg`. Esta tabela     │
 * │ existe para o desktop, e o celular nunca a vê espremida.              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function LegendaDeCusto({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]",
        className
      )}
    >
      Os pesos vêm das medições feitas na cozinha. Onde não houve medição, a
      célula mostra — em vez de repetir o peso da etapa anterior.
      {" "}Custos em reais, com {CASAS_CUSTO} casas. Pesos com {CASAS_PESO}.
      Percentuais com {CASAS_PERCENTUAL}.
    </p>
  );
}

/** Um valor monetário já formatado, com traço para ausência. */
export function ValorOuTraco({ children }: { children: ReactNode }) {
  return <span className="tabular">{children ?? "—"}</span>;
}
