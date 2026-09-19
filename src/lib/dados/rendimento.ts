/**
 * A CALCULADORA DE RENDIMENTO — o que a balança disse, e o que custou.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE ARQUIVO NÃO CALCULA NADA NOVO                                    │
 * │                                                                      │
 * │ Todas as contas daqui já existiam, em `./custos`. O que este arquivo   │
 * │ faz é outra coisa: ele monta a LISTA DE LINHAS que a tela precisa      │
 * │ mostrar, na ordem em que a cozinha trabalha, com o número, a unidade,  │
 * │ a conta que o produziu e o motivo de cada ausência.                    │
 * │                                                                      │
 * │ ┌────────────────────────────────────────────────────────────────┐   │
 * │ │ POR QUE ISSO VALE UM ARQUIVO PRÓPRIO, E NÃO UMA TELA           │   │
 * │ │                                                                │   │
 * │ │ Porque a MESMA lista aparece em três lugares: a calculadora do  │   │
 * │ │ ingrediente, o painel de custo da ficha, e a planilha           │   │
 * │ │ exportada. Se cada uma montasse as suas linhas, a planilha       │   │
 * │ │ mostraria um rótulo e a tela outro — e a Érika teria de         │   │
 * │ │ descobrir se são o mesmo número.                                │   │
 * │ │                                                                │   │
 * │ │ Montando aqui, a divergência é impossível: o Excel e a tela     │   │
 * │ │ leem a mesma lista.                                             │   │
 * │ └────────────────────────────────────────────────────────────────┘   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ PERDA E GANHO — A PARTE QUE MERECE ATENÇÃO                            │
 * │                                                                      │
 * │ Arroz, massa, feijão e legume seco GANHAM peso ao cozinhar. A água    │
 * │ absorvida entra na panela e sai no prato — o peso final é MAIOR que o │
 * │ inicial, e a medição está certa.                                      │
 * │                                                                      │
 * │ O motor de custo não trata isso como erro, e nem poderia: `perda()`   │
 * │ devolve a subtração como ela é, e a subtração dá negativo. Um número  │
 * │ negativo exibido como "perda: −0,200 kg" seria lido como erro de       │
 * │ digitação — então aqui a LEITURA muda, e só ela: quando a diferença    │
 * │ é negativa, o rótulo vira "ganho" e o sinal aparece na palavra, não   │
 * │ no número.                                                            │
 * │                                                                      │
 * │ Nenhum cálculo muda. O que muda é a frase.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS DUAS ARMADILHAS DE LEITURA, E COMO ELAS FORAM PEGAS                 │
 * │                                                                      │
 * │ 1. O PERCENTUAL TEM DONO DIFERENTE EM CADA ETAPA.                      │
 * │    A perda da limpeza é percentual do peso de COMPRA. A perda do       │
 * │    preparo é percentual do peso LIMPO — que é o "antes" dela. Escrito  │
 * │    com uma frase só ("10% do peso de compra") o número do preparo      │
 * │    sairia certo com o rótulo errado, e ninguém confere um percentual    │
 * │    que parece plausível. Por isso a frase recebe a base.               │
 * │                                                                      │
 * │ 2. A BALANÇA PODE ESTAR EM OUTRA UNIDADE QUE A COMPRA.                 │
 * │    Comprar em kg e pesar a limpeza em gramas é o caso normal de quem   │
 * │    usa balança de cozinha. O cálculo já normaliza — mas a EXIBIÇÃO     │
 * │    não pode mostrar a caixa da compra em "5,000 kg" e a da limpeza em  │
 * │    "4.500,000 g": são o mesmo peso, em duas unidades vizinhas, com o   │
 * │    percentual no meio. A exibição usa a unidade-base do fluxo, e a     │
 * │    caixa diz em que unidade aquilo foi pesado.                         │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import {
  CASAS_PERCENTUAL,
  CASAS_PESO,
  custoPorEtapa,
  derivarTransformacao,
  precoUnitarioDaCompra,
  type CustoPorEtapa,
  type IndicadoresTransformacao,
  type TransformacaoDerivada,
} from "./custos";
import { numeroFixo } from "./numeros";
import type { Compra, PesoInformado, Transformacao } from "./tipos-operacao";

// ---------------------------------------------------------------------------
// A linha
// ---------------------------------------------------------------------------

/**
 * UMA LINHA DA CALCULADORA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LINHA CARREGA A CONTA, E NÃO SÓ O RESULTADO                │
 * │                                                                      │
 * │ "R$ 12,50" sozinho não se confere. "R$ 50,00 ÷ 4,000 kg = R$ 12,50"   │
 * │ se confere de cabeça, e é isso que transforma um número que ela       │
 * │ aceita de fé num número que ela verifica.                              │
 * │                                                                      │
 * │ O `detalhe` é essa conta escrita. Ele não é enfeite de interface:     │
 * │ é o que permite discordar do sistema quando o sistema estiver errado. │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type LinhaDeRendimento = {
  chave: string;
  rotulo: string;
  /** O número já formatado, com unidade. Traço quando não há medição. */
  valor: string;
  /** `PERDA` e `GANHO` mudam a cor na tela. `NULO` é ausência de medição. */
  natureza: "MEDICAO" | "PERDA" | "GANHO" | "CUSTO" | "PERCENTUAL" | "NULO";
  /** A conta que produziu o número, escrita. Vazio quando não há conta. */
  detalhe: string;
  /** O que falta para este número existir. Vazio quando ele existe. */
  falta: string;
};

/** As etapas visuais do fluxo, na ordem em que a cozinha trabalha. */
export type EtapaDoFluxo = {
  chave: "COMPRA" | "LIMPEZA" | "PREPARO" | "RESULTADO";
  titulo: string;
  /** O peso medido desta etapa, cru. `null` quando não foi medida. */
  peso: PesoInformado | null;
  /** Como este peso aparece na tela, na unidade-base do fluxo. */
  pesoEmTexto: string;
  /** A unidade em que ela pesou, quando difere da unidade-base. */
  pesadaEm: string | null;
  /** O aproveitamento sobre a etapa anterior, quando dá para calcular. */
  aproveitamentoPct: number | null;
  /** Sob a etapa: de onde ele veio. */
  nota: string;
};

export type CalculoDeRendimento = {
  /** As quatro etapas visuais, já com o que foi medido. */
  etapas: EtapaDoFluxo[];
  /** Os indicadores derivados, para quem quiser o número cru. */
  derivada: TransformacaoDerivada;
  /** As linhas de perda e rendimento, na ordem de leitura. */
  linhas: LinhaDeRendimento[];
  /** O custo por unidade em cada etapa — os três preços do mesmo insumo. */
  custos: CustoPorEtapa;
  /** O custo efetivo: o preço do peso FINAL. `null` quando não há medição. */
  custoEfetivo: number | null;
  /** A unidade em que os pesos foram medidos. `null` quando nenhum foi medido. */
  unidade: string | null;
  /** A unidade em que a compra foi declarada — outra pergunta, outro campo. */
  unidadeDaCompra: string | null;
  /** Ganho de peso em alguma etapa (água absorvida). A tela explica. */
  temGanho: boolean;
  /** Quantas das três etapas foram medidas. */
  etapasMedidas: number;
  /** Unidades de massa e volume misturadas: o cálculo para e diz por quê. */
  unidadesIncompativeis: boolean;
};

// ---------------------------------------------------------------------------
// O cálculo
// ---------------------------------------------------------------------------

/**
 * Monta a calculadora a partir da compra e das pesagens.
 *
 * `compra` é opcional porque um insumo pode ser pesado sem que a compra tenha
 * sido declarada — e nesse caso o rendimento ainda existe (é a razão entre
 * dois pesos) mas o custo não, porque falta o valor pago. A função não inventa
 * um preço para tapar o buraco: devolve o rendimento e o traço.
 */
export function calcularRendimento(
  compra: Compra | null,
  t: Transformacao
): CalculoDeRendimento {
  const derivada = derivarTransformacao(t);
  const i = derivada.indicadores;

  const custos = custoPorEtapa(precoUnitarioDaCompra(compra), derivada);
  const unidade = derivada.unidade;

  /*
    O CUSTO EFETIVO é o da ÚLTIMA etapa medida — preparado quando existe,
    limpo quando só a limpeza foi pesada. Chamar o custo do quilo limpo de
    "custo final" de um insumo que ainda vai encher a panela daria um número
    menor do que o real, com a mesma aparência de certo.
  */
  const custoEfetivo = custos.preparado ?? custos.limpo ?? null;

  const etapas = montarEtapas(compra, t, i, unidade, custoEfetivo);

  return {
    etapas,
    derivada,
    linhas: montarLinhas(compra, i, custos, unidade),
    custos,
    custoEfetivo,
    unidade,
    unidadeDaCompra: compra?.unidade ?? null,
    temGanho:
      (i.perdaLimpeza ?? 0) < 0 || (i.perdaPreparo ?? 0) < 0 || (i.perdaTotal ?? 0) < 0,
    etapasMedidas: derivada.etapasInformadas,
    unidadesIncompativeis: derivada.unidadesIncompativeis,
  };
}

// ---------------------------------------------------------------------------
// Formatação — uma vez, e igual nos quatro lugares
// ---------------------------------------------------------------------------

/**
 * DINHEIRO SAI SEMPRE COM DUAS CASAS, e isto é uma correção, não um gosto.
 *
 * `numero()` corta zeros à direita — ele é feito para peso e percentual, onde
 * "4,5" e "4,500" são o mesmo número escrito de duas formas. Aplicado a
 * dinheiro, ele escreve "R$ 12,5".
 *
 * "R$ 12,5" não é um preço: é um preço interrompido. Quem lê não sabe se o
 * número acabou ou se a tela cortou, e num sistema de custo essa dúvida cai
 * justamente sobre o número mais importante da tela.
 */
function dinheiro(valor: number | null): string {
  return valor === null ? "—" : `R$ ${numeroFixo(valor, 2)}`;
}

/** Peso, na unidade-base do fluxo, sempre com as três casas da balança. */
function peso(valor: number | null, unidade: string | null): string {
  if (valor === null) return "—";
  return unidade === null
    ? numeroFixo(valor, CASAS_PESO)
    : `${numeroFixo(valor, CASAS_PESO)} ${unidade}`;
}

/** Percentual — uma casa, que é a precisão que a cozinha usa. */
function pct(valor: number | null): string {
  return valor === null ? "—" : `${numeroFixo(valor, CASAS_PERCENTUAL)}%`;
}

// ---------------------------------------------------------------------------
// As etapas
// ---------------------------------------------------------------------------

function montarEtapas(
  compra: Compra | null,
  t: Transformacao,
  i: IndicadoresTransformacao,
  unidade: string | null,
  custoEfetivo: number | null
): EtapaDoFluxo[] {
  /**
   * A caixa mostra o peso NORMALIZADO, e diz em que unidade ela pesou quando
   * as duas diferem. É a correção da segunda armadilha: comprar em kg e pesar
   * em gramas é o caso normal, e a tela não pode mostrar as duas unidades
   * vizinhas como se fossem grandezas diferentes.
   */
  function etapaDePeso(
    chave: EtapaDoFluxo["chave"],
    titulo: string,
    medida: PesoInformado | null,
    normalizado: number | null,
    aproveitamentoPct: number | null,
    nota: string
  ): EtapaDoFluxo {
    return {
      chave,
      titulo,
      peso: medida,
      pesoEmTexto: peso(normalizado, unidade),
      pesadaEm:
        medida !== null && unidade !== null && medida.unidade.trim() !== unidade
          ? medida.unidade
          : null,
      aproveitamentoPct,
      nota,
    };
  }

  /*
    ── A NOTA NÃO PODE DIZER QUE UM PESO NÃO EXISTE QUANDO ELE EXISTE ────
    A primeira versão perguntava só "o percentual saiu?" e, quando não saía,
    escrevia "o peso ainda não foi medido". Isso é falso em dois casos reais:
    ela pode medir o preparo sem ter medido a limpeza (é o arroz — 1 kg seco
    direto para a panela), e medir a limpeza sem ter informado a compra.

    Dizer "não foi medido" sobre um peso que está ali na tela, três linhas
    acima, é o tipo de erro que faz duvidar de todos os outros números. A nota
    pergunta primeiro se o peso DESTA etapa existe, e só depois se há com o
    que comparar.
  */
  function notaDaEtapa(
    medido: number | null,
    anterior: number | null,
    rendimentoPct: number | null,
    quandoFaltaOProprio: string,
    quandoFaltaOAnterior: string,
    base: string,
    ganho: boolean
  ): string {
    if (medido === null) return quandoFaltaOProprio;
    if (anterior === null || rendimentoPct === null) return quandoFaltaOAnterior;
    return ganho
      ? `${pct(rendimentoPct)} ${base} — ganhou peso`
      : `${pct(rendimentoPct)} ${base}`;
  }

  const notaDaLimpeza = notaDaEtapa(
    i.limpo,
    i.bruto,
    i.rendimentoLimpezaPct,
    "o peso depois de limpar ainda não foi medido",
    "o peso limpo existe, mas falta o peso de compra para comparar",
    "do peso de compra",
    (i.perdaLimpeza ?? 0) < 0
  );

  const notaDoPreparo = notaDaEtapa(
    i.preparado,
    i.limpo,
    i.rendimentoPreparoPct,
    "o peso depois de preparar ainda não foi medido",
    "o peso preparado existe, mas falta o peso limpo para comparar",
    "do peso limpo",
    (i.perdaPreparo ?? 0) < 0
  );

  /*
    ── A QUARTA NÃO É UMA PESAGEM ────────────────────────────────────────
    Ela é o resultado do fluxo, e existe para o custo efetivo ficar no mesmo
    lugar em que a cozinha termina de medir — e não num cartão separado
    embaixo, que é onde o número mais importante de uma tela costuma se
    perder.
  */
  const notaDoResultado = (() => {
    if (custoEfetivo === null) return "falta um peso medido depois da compra";

    /*
      A FRASE DIZ QUAL PESO SERVIU DE DIVISOR, e isso não é detalhe. Quando o
      preparo não foi medido, o custo efetivo sai do peso LIMPO — e é menor do
      que o custo verdadeiro do prato pronto, porque o que ainda vai encolher
      no fogo não está contado. Sem esta frase, os dois casos teriam a mesma
      aparência e só um estaria certo.
    */
    const porUnidade = unidade === null ? "por unidade" : `por ${unidade}`;
    return i.preparado !== null
      ? `${porUnidade} do peso final`
      : `${porUnidade} do peso limpo, que é a última etapa medida`;
  })();

  return [
    etapaDePeso(
      "COMPRA",
      "Compra",
      t.bruto,
      i.bruto,
      null,
      compra
        ? `${numeroFixo(compra.quantidade, CASAS_PESO)} ${compra.unidade} por ${dinheiro(
            compra.valorTotal
          )}`
        : "compra não informada — o rendimento sai, o custo não"
    ),
    etapaDePeso(
      "LIMPEZA",
      "Após limpeza",
      t.limpo,
      i.limpo,
      i.rendimentoLimpezaPct,
      notaDaLimpeza
    ),
    etapaDePeso(
      "PREPARO",
      "Após preparo",
      t.preparado,
      i.preparado,
      i.rendimentoPreparoPct,
      notaDoPreparo
    ),
    {
      chave: "RESULTADO",
      titulo: "Custo efetivo",
      peso: null,
      pesoEmTexto: dinheiro(custoEfetivo),
      pesadaEm: null,
      aproveitamentoPct: i.rendimentoFinalPct,
      nota: notaDoResultado,
    },
  ];
}

// ---------------------------------------------------------------------------
// As linhas
// ---------------------------------------------------------------------------

function montarLinhas(
  compra: Compra | null,
  i: IndicadoresTransformacao,
  custos: CustoPorEtapa,
  unidade: string | null
): LinhaDeRendimento[] {
  /*
    ── A NATUREZA DA DIFERENÇA ───────────────────────────────────────────
    Esta é a única decisão deste arquivo, e ela é de LEITURA: uma diferença
    negativa é ganho de peso, não perda negativa. O número sai com o sinal da
    palavra e sem o sinal do menos.

    `baseDoPercentual` não é decoração. Cada perda tem o seu "antes", e o
    percentual é sobre ele: a limpeza sobre a compra, o preparo sobre o peso
    limpo. Uma frase única serviria para as duas e estaria errada para uma.
  */
  function diferenca(
    chave: string,
    rotulo: string,
    valor: number | null,
    valorPct: number | null,
    antes: number | null,
    depois: number | null,
    baseDoPercentual: string
  ): LinhaDeRendimento {
    if (valor === null) {
      return {
        chave,
        rotulo,
        valor: "—",
        natureza: "NULO",
        detalhe: "",
        falta: "faltam os dois pesos desta etapa",
      };
    }

    const ganho = valor < 0;
    const magnitude = Math.abs(valor);
    const conta = `${peso(antes, unidade)} − ${peso(depois, unidade)}`;
    const percentual =
      valorPct === null ? "" : `, que é ${pct(valorPct)} ${baseDoPercentual}`;

    return {
      chave,
      rotulo: ganho ? rotulo.replace(/^Perda /, "Ganho ") : rotulo,
      valor: peso(magnitude, unidade),
      natureza: ganho ? "GANHO" : "PERDA",
      detalhe: ganho
        ? `${conta} — o peso final é MAIOR que o inicial${percentual}`
        : `${conta}${percentual}`,
      falta: "",
    };
  }

  const final = i.preparado ?? i.limpo;

  const linhas: LinhaDeRendimento[] = [
    {
      chave: "precoCompra",
      rotulo: "Preço do quilo comprado",
      valor: dinheiro(custos.compra),
      natureza: custos.compra === null ? "NULO" : "CUSTO",
      detalhe:
        compra && custos.compra !== null
          ? `${dinheiro(compra.valorTotal)} ÷ ${numeroFixo(
              compra.quantidade,
              CASAS_PESO
            )} ${compra.unidade}`
          : "",
      falta: compra ? "" : "a compra ainda não foi informada",
    },

    diferenca(
      "perdaLimpeza",
      "Perda na limpeza",
      i.perdaLimpeza,
      i.perdaLimpezaPct,
      i.bruto,
      i.limpo,
      "do peso de compra"
    ),

    {
      chave: "rendimentoLimpeza",
      rotulo: "Aproveitamento na limpeza",
      valor: pct(i.rendimentoLimpezaPct),
      natureza: i.rendimentoLimpezaPct === null ? "NULO" : "PERCENTUAL",
      detalhe:
        i.limpo !== null && i.bruto !== null
          ? `${peso(i.limpo, unidade)} ÷ ${peso(i.bruto, unidade)} × 100`
          : "",
      falta: i.rendimentoLimpezaPct === null ? "faltam os pesos da limpeza" : "",
    },
  ];

  /*
    ── O FATOR DE CORREÇÃO ───────────────────────────────────────────────
    O número é o mesmo que a metodologia chama de fator de correção, e a
    partir desta fase ele APARECE na tela, porque ela pediu o número. O que
    não muda é a origem: ele sai dos dois pesos medidos, e a frase ao lado
    diz isso. Um insumo que ninguém pesou continua sem fator — nenhum é
    aplicado de tabela.
  */
  if (i.bruto !== null && i.limpo !== null && i.limpo > 0) {
    linhas.push({
      chave: "fatorCorrecao",
      rotulo: "Fator de correção medido",
      valor: numeroMedio(i.bruto / i.limpo),
      natureza: "MEDICAO",
      detalhe: `${peso(i.bruto, unidade)} ÷ ${peso(
        i.limpo,
        unidade
      )} — vem das suas pesagens, não de tabela`,
      falta: "",
    });
  } else {
    linhas.push({
      chave: "fatorCorrecao",
      rotulo: "Fator de correção medido",
      valor: "—",
      natureza: "NULO",
      detalhe: "",
      falta: "precisa do peso de compra e do peso limpo",
    });
  }

  linhas.push(
    diferenca(
      "perdaPreparo",
      "Perda no preparo",
      i.perdaPreparo,
      i.perdaPreparoPct,
      i.limpo,
      i.preparado,
      "do peso limpo"
    ),

    {
      chave: "rendimentoPreparo",
      rotulo: "Aproveitamento no preparo",
      valor: pct(i.rendimentoPreparoPct),
      natureza: i.rendimentoPreparoPct === null ? "NULO" : "PERCENTUAL",
      detalhe:
        i.preparado !== null && i.limpo !== null
          ? `${peso(i.preparado, unidade)} ÷ ${peso(i.limpo, unidade)} × 100`
          : "",
      falta: i.rendimentoPreparoPct === null ? "faltam os pesos do preparo" : "",
    },

    /*
      ── A LINHA DO TOTAL, QUE É A QUE PEGA O GANHO SOZINHO ────────────────
      O arroz dá o exemplo exato. Ela compra 1 kg de arroz seco e pesa 1,2 kg
      depois de cozinhar — e não pesa "depois de limpar", porque arroz não tem
      etapa de limpeza.

      Sem esta linha, o sistema teria o número (o rendimento total já dá 120%)
      mas nenhuma linha de PESO mostrando que ele cresceu: a perda do preparo
      fica nula, porque o "antes" dela — o peso limpo — não foi medido. O
      resultado seria uma tela dizendo "perda no preparo: —" para um insumo
      que ganhou 20% de peso.

      A perda total é medida contra a COMPRA, e é a mesma escolha que o motor
      já faz para `perdaTotal`. Ela existe sempre que houver um peso final.
    */
    diferenca(
      "perdaTotal",
      "Perda total",
      i.perdaTotal,
      i.perdaTotalPct,
      i.bruto,
      final,
      "do peso de compra"
    ),

    {
      chave: "rendimentoTotal",
      rotulo: "Rendimento total",
      valor: pct(i.rendimentoFinalPct),
      natureza:
        i.rendimentoFinalPct === null
          ? "NULO"
          : (i.perdaTotal ?? 0) < 0
            ? "GANHO"
            : "PERCENTUAL",
      detalhe:
        final !== null && i.bruto !== null
          ? `${peso(final, unidade)} ÷ ${peso(i.bruto, unidade)} × 100${
              i.preparado === null && i.limpo !== null
                ? " — sobre o peso limpo, que é a última etapa medida"
                : ""
            }`
          : "",
      falta:
        i.rendimentoFinalPct === null
          ? "precisa do peso de compra e de um peso depois dele"
          : "",
    },

    {
      chave: "custoLimpo",
      rotulo: "Custo do quilo limpo",
      valor: dinheiro(custos.limpo),
      natureza: custos.limpo === null ? "NULO" : "CUSTO",
      detalhe:
        custos.compra !== null && i.bruto !== null && i.limpo !== null && i.limpo > 0
          ? `${dinheiro(custos.compra)} × ${numeroMedio(
              i.bruto / i.limpo
            )} — o mesmo valor pago, dividido pelo que sobrou`
          : "",
      falta: custos.limpo === null ? "precisa da compra e do peso limpo" : "",
    },

    {
      chave: "custoEfetivo",
      rotulo: "Custo efetivo final",
      valor: dinheiro(custoEfetivoDe(custos)),
      natureza: custoEfetivoDe(custos) === null ? "NULO" : "CUSTO",
      detalhe:
        compra && custoEfetivoDe(custos) !== null
          ? `${dinheiro(compra.valorTotal)} ÷ ${peso(
              i.preparado ?? i.limpo,
              unidade
            )} — é o número que entra na ficha`
          : "",
      falta: !compra
        ? "a compra ainda não foi informada"
        : custoEfetivoDe(custos) === null
          ? "precisa de um peso medido depois da compra"
          : "",
    }
  );

  return linhas;
}

/** O custo da última etapa medida. A mesma regra do `custoEfetivo`. */
function custoEfetivoDe(custos: CustoPorEtapa): number | null {
  return custos.preparado ?? custos.limpo ?? null;
}

/**
 * Uma razão entre dois pesos, com quatro casas.
 *
 * Quatro casas porque o fator de correção é multiplicado por preços: com duas,
 * um fator de 1,11 em cima de um quilo de R$ 47,90 erra o centavo. Com quatro,
 * o erro fica abaixo do centavo e some na exibição — que é o ponto. Não é
 * arredondamento de metodologia; é precisão de leitura.
 */
function numeroMedio(valor: number): string {
  return numeroFixo(valor, 4);
}

// ---------------------------------------------------------------------------
// Resumo em uma linha — para tabela e planilha
// ---------------------------------------------------------------------------

/**
 * O resumo de transformação, para caber numa célula de tabela.
 *
 * "5,000 kg → 4,000 kg (80,0%)" diz tudo o que cabe numa linha de planilha.
 * "sem pesagem" diz o que falta, sem inventar um número.
 */
export function resumoDeRendimento(derivada: TransformacaoDerivada): string {
  const i = derivada.indicadores;
  const u = derivada.unidade;

  if (i.bruto === null) {
    return i.limpo !== null || i.preparado !== null
      ? `sem peso de compra (${peso(i.preparado ?? i.limpo, u)})`
      : "sem pesagem";
  }

  const final = i.preparado ?? i.limpo;
  if (final === null) return peso(i.bruto, u);

  return `${peso(i.bruto, u)} → ${peso(final, u)} (${pct(i.rendimentoFinalPct)})`;
}
