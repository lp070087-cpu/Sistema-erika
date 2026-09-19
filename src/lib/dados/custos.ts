/**
 * O MOTOR DE ARITMÉTICA — o que o sistema pode calcular sem decidir nada.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A LINHA QUE ESTE ARQUIVO NÃO ATRAVESSA                                │
 * │                                                                      │
 * │ Existem duas famílias de número numa consultoria de custos, e elas    │
 * │ se parecem o suficiente para serem confundidas:                       │
 * │                                                                      │
 * │   1. O que se DERIVA do que foi medido.                               │
 * │      "Comprei 5 kg, depois de descascar ficaram 4,5 kg." A perda de   │
 * │      0,5 kg e os 10% são consequência aritmética desses dois pesos.   │
 * │      Não há nada a decidir — há uma subtração e uma divisão.          │
 * │                                                                      │
 * │   2. O que se APLICA de uma tabela.                                   │
 * │      "Batata tem fator de correção 1,25." Esse número não sai de      │
 * │      medição nenhuma: ele é um valor de REFERÊNCIA, escolhido por     │
 * │      quem escreveu a metodologia. Aplicá-lo é afirmar que a batata    │
 * │      DESTA cozinha se comporta como a batata média da tabela — e      │
 * │      substituir a medição dela por um número de fora.                 │
 * │                                                                      │
 * │ Este arquivo faz a família 1 e não faz a família 2. Nenhuma função    │
 * │ aqui conhece um fator, um índice ou um alvo. Toda saída é uma conta   │
 * │ sobre entradas que alguém informou.                                   │
 * │                                                                      │
 * │ ┌────────────────────────────────────────────────────────────────┐   │
 * │ │ POR QUE ISSO É MAIS DO QUE PREGUIÇA DE ARREDONDAR              │   │
 * │ │                                                                │   │
 * │ │ A relação "quantos kg de compra viram 1 kg utilizável" é        │   │
 * │ │ matematicamente o fator de correção. O sistema CALCULA essa      │   │
 * │ │ relação a partir dos pesos medidos — e não a chama de fator de   │   │
 * │ │ correção, em lugar nenhum, nem na tela nem no código.           │   │
 * │ │                                                                │   │
 * │ │ A diferença não é de vocabulário. Um fator de correção é um      │   │
 * │ │ número que vale ANTES de medir, e serve para prever. A relação   │   │
 * │ │ medida vale DEPOIS de medir, e serve para constatar. Chamar a    │   │
 * │ │ segunda pelo nome da primeira faria a Érika achar que o sistema  │   │
 * │ │ já tem a tabela dela — e ela pararia de medir.                   │   │
 * │ └────────────────────────────────────────────────────────────────┘
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `number | null` EM TUDO                                       │
 * │                                                                      │
 * │ Toda função daqui devolve `null` quando falta entrada. `null` não é   │
 * │ zero: zero afirma "não custa nada" ou "não se perde nada", e as duas  │
 * │ afirmações seriam falsas e perigosas — um custo zero entra numa soma  │
 * │ sem ser notado e derruba o total para baixo.                          │
 * │                                                                      │
 * │ Quem exibe trata `null` como "dado ainda não informado".              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type {
  Compra,
  EtapaPeso,
  PesoInformado,
  Transformacao,
} from "./tipos-operacao";

// ---------------------------------------------------------------------------
// Unidades de peso aceitas como base de cálculo
// ---------------------------------------------------------------------------

/**
 * As unidades em que o motor consegue operar.
 *
 * NÃO é uma lista de unidades permitidas no cadastro — o cadastro aceita
 * caixa, dúzia, maço, o que a compra exigir. É a lista do que dá para somar
 * e dividir com sentido: converter "1 caixa" em quilo exigiria saber quantos
 * quilos tem a caixa, e isso é medir, não converter. Fora desta lista, o
 * cálculo para e diz por quê, em vez de tratar unidade incompatível como se
 * fosse número puro.
 */
export const UNIDADES_DE_PESO: readonly string[] = ["kg", "g", "L", "ml"];

export function ehUnidadeDePeso(unidade: string): boolean {
  return UNIDADES_DE_PESO.includes(unidade.trim());
}

/**
 * Fator de conversão para a unidade-base do grupo (kg para massa, L para
 * volume). É conversão de ESCALA — 1000 g = 1 kg —, não de substância.
 *
 * Massa e volume NÃO se convertem entre si aqui. "1 L de óleo = 0,9 kg" é
 * densidade, e densidade é propriedade do produto: entra na mesma família de
 * tabela de referência que o fator de correção.
 */
const ESCALA: Record<string, number> = {
  kg: 1,
  g: 0.001,
  L: 1,
  ml: 0.001,
};

function grupoDaUnidade(unidade: string): "massa" | "volume" | null {
  const u = unidade.trim();
  if (u === "kg" || u === "g") return "massa";
  if (u === "L" || u === "ml") return "volume";
  return null;
}

/**
 * Converte pesos para a mesma unidade, quando a conversão é só de escala.
 *
 * Devolve `null` quando as duas unidades não são do mesmo grupo (kg × L) ou
 * quando alguma não é unidade de peso. Quem chama trata `null` como "não dá
 * para comparar", nunca como "vale o mesmo".
 */
export function mesmaBase(a: number, unidadeA: string, unidadeB: string): number | null {
  const ua = unidadeA.trim();
  const ub = unidadeB.trim();

  /*
    ┌───────────────────────────────────────────────────────────────────┐
    │ A MESMA UNIDADE NÃO PRECISA DE FAMÍLIA                            │
    │                                                                   │
    │ "3 maços" e "3 maços" são a mesma quantidade — não há nada a       │
    │ converter. Sem esta linha, um insumo pesado em maço ou em dúzia    │
    │ cairia como "unidades incompatíveis" contra ele mesmo, porque      │
    │ maço não pertence a nenhuma das duas famílias que este arquivo     │
    │ conhece. A comparação de unidade idêntica vem antes da família     │
    │ porque ela é sempre verdadeira, e a família é uma pergunta que     │
    │ só se faz quando as unidades DIFEREM.                              │
    └───────────────────────────────────────────────────────────────────┘
  */
  if (ua === ub) return a;

  const grupoA = grupoDaUnidade(ua);
  const grupoB = grupoDaUnidade(ub);
  if (grupoA === null || grupoB === null || grupoA !== grupoB) return null;

  const escalaA = ESCALA[ua];
  const escalaB = ESCALA[ub];
  if (escalaA === undefined || escalaB === undefined) return null;

  return (a * escalaA) / escalaB;
}

// ---------------------------------------------------------------------------
// Compra
// ---------------------------------------------------------------------------

/**
 * O preço unitário da compra: valor total ÷ quantidade comprada.
 *
 * É a conta que já existia no formulário de ingrediente, promovida a função
 * porque agora a usam três lugares — o detalhe, a ficha e a planilha. Três
 * divisões escritas à mão divergiriam na primeira em que alguém digitasse a
 * quantidade no lugar do valor.
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │ O PARÂMETRO QUE NÃO É ÓBVIO: `quantidadeParaPreco`                 │
 * │                                                                   │
 * │ O preço unitário serve para DUAS coisas diferentes, e elas querem   │
 * │ bases diferentes:                                                   │
 * │                                                                   │
 * │   · comparar com o preço do mês passado → base = quantidade comprada│
 * │   · multiplicar pela quantidade usada na ficha → base = quantidade  │
 * │     na unidade em que a ficha declara                               │
 * │                                                                   │
 * │ Se a compra foi "1 caixa" e a ficha usa "kg", o preço por caixa é   │
 * │ um número correto e inútil para a ficha. Por isso a função recebe a │
 * │ base explicitamente: sem ela, a multiplicação aconteceria em cima de │
 * │ um número que não corresponde à unidade do outro lado.              │
 * └───────────────────────────────────────────────────────────────────┘
 */
export function precoUnitarioDaCompra(compra: Compra | null): number | null {
  if (!compra) return null;
  if (compra.quantidade <= 0 || compra.valorTotal <= 0) return null;
  return compra.valorTotal / compra.quantidade;
}

/**
 * A COMPRA INFORMADA É USÁVEL? E SE NÃO, O QUE FALTA?
 *
 * ┌───────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É DOMÍNIO, E NÃO UMA VALIDAÇÃO DE FORMULÁRIO          │
 * │                                                                   │
 * │ Porque a regra é do DADO, não da tela. Uma compra só é usável      │
 * │ quando tem as duas pontas: quantidade e valor. Meia compra não é   │
 * │ um dado incompleto — é um dado que `precoUnitarioDaCompra` recusa  │
 * │ devolvendo `null`, e um `null` que ninguém explicou vira o preço   │
 * │ unitário vazio numa ficha, sem nenhuma frase dizendo por quê.      │
 * │                                                                   │
 * │ Escrita aqui, a regra vale para o formulário do insumo, para o     │
 * │ cadastro de insumo novo e para qualquer tela que venha a pedir     │
 * │ uma compra — e pode ser conferida por um teste, que é o que uma    │
 * │ validação dentro de um `.tsx` nunca pode.                          │
 * └───────────────────────────────────────────────────────────────────┘
 *
 * A ordem das perguntas é a ordem do que ela digitou. Quem escreveu "5 kg" no
 * campo da quantidade precisa ouvir "isso não é número" ANTES de ouvir "falta
 * o valor pago" — senão vai procurar o erro no campo que está certo.
 *
 * `null` significa que a compra está boa — ou que não foi informada, que
 * também não é erro: um insumo sem compra declarada é um insumo que usa o
 * preço de referência.
 */
export type RecusaDeCompra =
  | "QUANTIDADE_NAO_E_NUMERO"
  | "VALOR_NAO_E_NUMERO"
  | "FALTA_VALOR"
  | "FALTA_QUANTIDADE";

/**
 * A recusa, como código. A frase fica na tela, porque é lá que se escreve
 * para a Érika; aqui fica a REGRA, que é o que precisa ser conferível.
 *
 * `textoQuantidade` e `textoValor` chegam como ela digitou, e não como
 * número: é o texto que distingue "não digitei" de "digitei algo inválido".
 * Passar só os números lidos apagaria essa diferença e faria os dois casos
 * receberem a mesma recusa.
 */
export function recusaDaCompra(
  textoQuantidade: string,
  quantidade: number | null,
  textoValor: string,
  valor: number | null
): RecusaDeCompra | null {
  const digitouQuantidade = textoQuantidade.trim() !== "";
  const digitouValor = textoValor.trim() !== "";

  if (digitouQuantidade && quantidade === null) return "QUANTIDADE_NAO_E_NUMERO";
  if (digitouValor && valor === null) return "VALOR_NAO_E_NUMERO";
  if (digitouQuantidade && !digitouValor) return "FALTA_VALOR";
  if (digitouValor && !digitouQuantidade) return "FALTA_QUANTIDADE";
  return null;
}

/**
 * A MESMA RECUSA, EM PORTUGUÊS — PARA A TELA.
 *
 * Mora ao lado da regra de propósito: uma frase de recusa escrita na tela e
 * uma regra escrita no domínio divergem no primeiro dia em que alguém ajusta
 * uma das duas. Aqui, acrescentar um código novo a `RecusaDeCompra` sem
 * escrever a frase não compila — o `Record` abaixo obriga.
 */
export const FRASE_DA_RECUSA: Record<RecusaDeCompra, string> = {
  QUANTIDADE_NAO_E_NUMERO:
    "A quantidade não é um número maior que zero. Confira a vírgula — é ela que separa os centavos.",
  VALOR_NAO_E_NUMERO:
    "O valor pago não é um número maior que zero. Confira a vírgula.",
  FALTA_VALOR:
    "Falta o valor pago. A quantidade sozinha não gera o preço unitário.",
  FALTA_QUANTIDADE:
    "Falta a quantidade comprada. O valor pago sozinho não gera o preço unitário.",
};

// ---------------------------------------------------------------------------
// Transformação — as três etapas medidas
// ---------------------------------------------------------------------------

/**
 * Os indicadores que saem dos pesos medidos.
 *
 * Cada campo é `null` quando falta o peso de alguma das pontas. Repare que
 * não existe "perda na limpeza" sem o peso bruto: quem informou só o peso
 * depois de limpar não informou perda nenhuma — informou o peso limpo.
 *
 * Os percentuais são sempre SOBRE A ETAPA ANTERIOR, que é a pergunta que a
 * cozinha faz ("do que entrou, quanto se perdeu?"). O rendimento final é a
 * única exceção: ele é sobre a COMPRA, porque é o número que interessa a
 * quem compra.
 */
export type IndicadoresTransformacao = {
  /** Peso da compra, normalizado para a unidade-base do grupo. */
  bruto: number | null;
  /** Peso depois de limpar/descascar. */
  limpo: number | null;
  /** Peso depois de cozinhar/preparar. */
  preparado: number | null;

  /** Quanto se perdeu entre a compra e a limpeza. Peso, na unidade do bruto. */
  perdaLimpeza: number | null;
  /** Essa perda em percentual do peso bruto. */
  perdaLimpezaPct: number | null;
  /** Quanto do peso bruto sobreviveu à limpeza. */
  rendimentoLimpezaPct: number | null;

  /** Quanto se perdeu entre a limpeza e o preparo. */
  perdaPreparo: number | null;
  perdaPreparoPct: number | null;
  rendimentoPreparoPct: number | null;

  /** Perda acumulada entre a compra e o peso final. */
  perdaTotal: number | null;
  /** Essa perda em percentual do peso bruto. */
  perdaTotalPct: number | null;
  /** Quanto do peso comprado virou produto utilizável. É o número da compra. */
  rendimentoFinalPct: number | null;

  /**
   * Quantas unidades de compra viram uma unidade utilizável.
   *
   * Ex.: bruto 5 kg e preparado 4 kg → 1,25. Uma unidade de peso final
   * custou 1,25 unidade de peso comprado.
   *
   * ┌─────────────────────────────────────────────────────────────────┐
   * │ ESTE NÚMERO NÃO É "O FATOR DE CORREÇÃO"                         │
   * │                                                                 │
   * │ Matematicamente, coincide. Conceitualmente, é o oposto: o fator  │
   * │ de correção é um valor de referência que valeria ANTES de medir; │
   * │ este número só existe porque ELA mediu. Por isso ele mora com um │
   * │ nome que descreve o que ele é — uma relação entre dois pesos     │
   * │ informados — e não com o nome do conceito da metodologia.        │
   * └─────────────────────────────────────────────────────────────────┘
   */
  relacaoCompraPorUtilizavel: number | null;
};

/** Unidade em que os indicadores foram expressos, quando há peso utilizável. */
export type TransformacaoDerivada = {
  indicadores: IndicadoresTransformacao;
  /** Unidade dos pesos já normalizados. `null` quando não há nenhum peso. */
  unidade: string | null;
  /** Quantas das três etapas foram informadas. Para a tela dizer o que falta. */
  etapasInformadas: number;
  /** Alguma etapa informada está em unidade incompatível com as outras. */
  unidadesIncompativeis: boolean;
};

/**
 * A base dos pesos: a unidade do primeiro peso informado, normalizada.
 *
 * A escolha é a do BRUTO, e não a do preparado, porque o rendimento é lido
 * sobre a compra — e porque o bruto é a etapa que existe sempre que o
 * ingrediente tem algum peso medido. Quando o bruto não foi informado, a
 * base é a primeira etapa que existir, e o relatório diz qual foi.
 */
function baseDosPesos(t: Transformacao): {
  unidade: string | null;
  bruto: number | null;
  limpo: number | null;
  preparado: number | null;
  incompativeis: boolean;
  informadas: number;
} {
  const etapas: PesoInformado[] = [t.bruto, t.limpo, t.preparado].filter(
    (p): p is PesoInformado => p !== null && p.peso > 0
  );

  if (etapas.length === 0) {
    return {
      unidade: null,
      bruto: null,
      limpo: null,
      preparado: null,
      incompativeis: false,
      informadas: 0,
    };
  }

  const referencia = (t.bruto ?? t.limpo ?? t.preparado) as PesoInformado;
  const unidade = referencia.unidade;

  let incompativeis = false;
  let bruto: number | null = null;
  let limpo: number | null = null;
  let preparado: number | null = null;

  if (t.bruto && t.bruto.peso > 0) {
    const v = mesmaBase(t.bruto.peso, t.bruto.unidade, unidade);
    if (v === null) incompativeis = true;
    else bruto = v;
  }
  if (t.limpo && t.limpo.peso > 0) {
    const v = mesmaBase(t.limpo.peso, t.limpo.unidade, unidade);
    if (v === null) incompativeis = true;
    else limpo = v;
  }
  if (t.preparado && t.preparado.peso > 0) {
    const v = mesmaBase(t.preparado.peso, t.preparado.unidade, unidade);
    if (v === null) incompativeis = true;
    else preparado = v;
  }

  return { unidade, bruto, limpo, preparado, incompativeis, informadas: etapas.length };
}

/** As duas grandezas que uma perda precisa para existir: antes e depois. */
function perda(
  antes: number | null,
  depois: number | null
): { absoluta: number | null; pct: number | null; rendimentoPct: number | null } {
  if (antes === null || depois === null || antes <= 0) {
    return { absoluta: null, pct: null, rendimentoPct: null };
  }
  const absoluta = antes - depois;
  return {
    absoluta,
    pct: (absoluta / antes) * 100,
    rendimentoPct: (depois / antes) * 100,
  };
}

/**
 * Deriva tudo o que os pesos medidos permitem derivar — e nada além disso.
 *
 * Nenhum campo aqui olha para uma tabela, para uma categoria de alimento ou
 * para um alvo. Dois pesos entram, uma subtração e uma divisão saem.
 */
export function derivarTransformacao(t: Transformacao | null): TransformacaoDerivada {
  const vazio: TransformacaoDerivada = {
    indicadores: {
      bruto: null,
      limpo: null,
      preparado: null,
      perdaLimpeza: null,
      perdaLimpezaPct: null,
      rendimentoLimpezaPct: null,
      perdaPreparo: null,
      perdaPreparoPct: null,
      rendimentoPreparoPct: null,
      perdaTotal: null,
      perdaTotalPct: null,
      rendimentoFinalPct: null,
      relacaoCompraPorUtilizavel: null,
    },
    unidade: null,
    etapasInformadas: 0,
    unidadesIncompativeis: false,
  };

  if (!t) return vazio;

  const base = baseDosPesos(t);

  const limpeza = perda(base.bruto, base.limpo);
  const preparo = perda(base.limpo, base.preparado);

  /*
    O resultado final é medido contra a COMPRA, não contra a etapa anterior.
    Quando o preparo não foi medido, o peso final é o limpo — é o último peso
    que existe, e usá-lo é mais honesto do que devolver `null` para um
    rendimento que dá para calcular. A tela diz qual peso foi usado.
  */
  const final = base.preparado ?? base.limpo;
  const total = perda(base.bruto, final);

  return {
    indicadores: {
      bruto: base.bruto,
      limpo: base.limpo,
      preparado: base.preparado,

      perdaLimpeza: limpeza.absoluta,
      perdaLimpezaPct: limpeza.pct,
      rendimentoLimpezaPct: limpeza.rendimentoPct,

      perdaPreparo: preparo.absoluta,
      perdaPreparoPct: preparo.pct,
      rendimentoPreparoPct: preparo.rendimentoPct,

      perdaTotal: total.absoluta,
      perdaTotalPct: total.pct,
      rendimentoFinalPct: total.rendimentoPct,

      relacaoCompraPorUtilizavel:
        base.bruto !== null && final !== null && final > 0 ? base.bruto / final : null,
    },
    unidade: base.unidade,
    etapasInformadas: base.informadas,
    unidadesIncompativeis: base.incompativeis,
  };
}

// ---------------------------------------------------------------------------
// Custo por etapa
// ---------------------------------------------------------------------------

/**
 * Quanto custa uma unidade de peso em cada etapa.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTES TRÊS NÚMEROS, E POR QUE ELES SÃO A RESPOSTA CERTA       │
 * │                                                                      │
 * │ A pergunta "quanto custa o quilo da batata?" tem três respostas       │
 * │ diferentes no mesmo dia, e todas verdadeiras:                         │
 * │                                                                      │
 * │   · R$ 10,00 no quilo COMO COMPRADO                                   │
 * │   · R$ 11,11 no quilo DEPOIS DE DESCASCAR                              │
 * │   · R$ 12,50 no quilo DEPOIS DE COZIDO                                 │
 * │                                                                      │
 * │ A diferença entre elas não é imposto nem margem: é a perda. O sistema │
 * │ não escolhe qual das três usar — ele mostra as três, e a ficha         │
 * │ declara em qual delas a quantidade foi pesada. Escolher uma e chamá-la │
 * │ de "o custo da batata" apagaria justamente a informação que a          │
 * │ consultoria existe para revelar.                                       │
 * │                                                                      │
 * │ O divisor de cada etapa vem dos PESOS MEDIDOS. Quando falta o peso, a  │
 * │ etapa correspondente fica `null` — e a ficha não usa outra no lugar.   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type CustoPorEtapa = {
  /** Custo por unidade do peso de compra. É o preço unitário, sem ajuste. */
  compra: number | null;
  /** Custo por unidade do peso limpo. */
  limpo: number | null;
  /** Custo por unidade do peso final. É o número da decisão de preço. */
  preparado: number | null;
};

/**
 * O custo por unidade em cada etapa, a partir de um preço de referência.
 *
 * `precoReferencia` é o preço por unidade de COMPRA — o mesmo número que a
 * ficha guarda com data. O ajuste para as outras etapas é uma razão entre
 * pesos medidos, aplicada ao preço: se 5 kg de compra viram 4 kg utilizáveis,
 * o quilo utilizável custa 5/4 do quilo comprado. Nada aqui olha para a
 * categoria do alimento nem para uma tabela de referência.
 */
export function custoPorEtapa(
  precoReferencia: number | null,
  derivada: TransformacaoDerivada
): CustoPorEtapa {
  const semPreco: CustoPorEtapa = { compra: null, limpo: null, preparado: null };
  if (precoReferencia === null || precoReferencia <= 0) return semPreco;

  const { bruto, limpo, preparado } = derivada.indicadores;
  if (bruto === null || bruto <= 0) {
    /*
      Sem peso bruto medido não há perda conhecida: o único custo que existe
      é o da compra. Devolver um valor para as outras etapas seria supor que
      não há perda — e supor perda zero é tão inventado quanto supor perda
      de 10%.
    */
    return { compra: precoReferencia, limpo: null, preparado: null };
  }

  return {
    compra: precoReferencia,
    limpo: limpo !== null && limpo > 0 ? (precoReferencia * bruto) / limpo : null,
    preparado:
      preparado !== null && preparado > 0 ? (precoReferencia * bruto) / preparado : null,
  };
}

/** O custo de uma quantidade declarada, na etapa em que ela foi pesada. */
export type CustoDeQuantidade = {
  valor: number;
  /** Qual custo por unidade foi usado. A tela diz isso ao lado do número. */
  base: EtapaPeso;
};

/**
 * Multiplica uma quantidade pelo custo unitário da etapa correspondente.
 *
 * Devolve `null` quando a etapa pedida não tem custo — que é o caso de uma
 * ficha que declara a quantidade em peso preparado e cujo ingrediente nunca
 * foi pesado depois de cozinhar. Nesse caso a ficha mostra "aguardando
 * dados" e diz qual peso falta, em vez de multiplicar pelo preço de compra e
 * entregar um número menor do que a realidade.
 */
export function custoDaQuantidade(
  quantidade: number | null,
  etapa: EtapaPeso,
  custos: CustoPorEtapa
): CustoDeQuantidade | null {
  if (quantidade === null || quantidade <= 0) return null;

  const porUnidade = custos[etapa === "COMPRA" ? "compra" : etapa === "LIMPO" ? "limpo" : "preparado"];
  if (porUnidade === null) return null;

  return { valor: quantidade * porUnidade, base: etapa };
}

// ---------------------------------------------------------------------------
// Números de leitura — para a tela não repetir formatação
// ---------------------------------------------------------------------------

/**
 * Quantas casas decimais o sistema MOSTRA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ISTO NÃO É A DECISÃO DE ARREDONDAMENTO                                │
 * │                                                                      │
 * │ Arredondar é uma decisão de metodologia: em que casa o custo é        │
 * │ fechado, e em que momento do cálculo. Ela não foi tomada, e o sistema │
 * │ NÃO arredonda valor nenhum — os números viajam com a precisão         │
 * │ inteira do JavaScript e só a exibição corta casas.                    │
 * │                                                                      │
 * │ A diferença é verificável: somar duas linhas exibidas pode não dar    │
 * │ exatamente o total exibido, porque o total foi calculado com as       │
 * │ casas completas. É o comportamento CORRETO enquanto a regra não       │
 * │ existir — um sistema que arredondasse cada linha antes de somar já     │
 * │ teria escolhido uma regra no lugar dela.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const CASAS_CUSTO = 2 as const;
export const CASAS_PESO = 3 as const;
export const CASAS_PERCENTUAL = 1 as const;
