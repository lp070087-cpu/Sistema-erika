/**
 * OS INDICADORES COMERCIAIS — cálculo puro, decisão de fora.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A DIFERENÇA ENTRE ESTE ARQUIVO E O MOTOR DE CUSTOS                    │
 * │                                                                      │
 * │ `./custos` responde "quanto custa". A resposta sai de números que     │
 * │ alguém mediu: peso comprado, peso limpo, preço da nota. Não há nada   │
 * │ a decidir, há uma divisão a fazer.                                    │
 * │                                                                      │
 * │ Este arquivo responde "e daí?". CMV, markup, margem de segurança e    │
 * │ preço sugerido são indicadores COMERCIAIS, e cada um depende de uma    │
 * │ escolha: qual CMV é aceitável, se existe margem de segurança e de     │
 * │ quanto, qual múltiplo de markup a casa pratica.                       │
 * │                                                                      │
 * │ ┌────────────────────────────────────────────────────────────────┐   │
 * │ │ A REGRA QUE GOVERNA ESTE ARQUIVO, E QUE É FÁCIL DE QUEBRAR     │   │
 * │ │                                                                │   │
 * │ │ NENHUMA FUNÇÃO DAQUI TEM UM NÚMERO DE DECISÃO EMBUTIDO.        │   │
 * │ │                                                                │   │
 * │ │ Não existe `const MARGEM_PADRAO = 0.05`. Não existe             │   │
 * │ │ `const CMV_ALVO = 30`. Toda decisão entra por PARÂMETRO, e      │   │
 * │ │ quando o parâmetro não existe a função devolve `null` — não um  │   │
 * │ │ valor de partida.                                               │   │
 * │ │                                                                │   │
 * │ │ É o que impede o defeito mais caro desta área: a Érika vê       │   │
 * │ │ "margem: 5%" numa tela por dois meses, acha que é o sistema     │   │
 * │ │ aplicando a prática dela, e descobre numa auditoria que aquele  │   │
 * │ │ 5% foi invenção. Um padrão silencioso vira regra pelo uso.      │   │
 * │ └────────────────────────────────────────────────────────────────┘   │
 * │                                                                      │
 * │ O que ESTE arquivo sabe fazer é aplicar a regra que ela informar.     │
 * │ Se ela disser "uso 5% de margem de segurança na linha de custo",      │
 * │ o sistema aplica 5% na hora — porque aí o número é dela.              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/*
  ┌──────────────────────────────────────────────────────────────────────┐
  │ POR QUE ESTE ARQUIVO NÃO IMPORTA NADA                                │
  │                                                                      │
  │ A tentação era importar `CASAS_CUSTO` do motor de custos para        │
  │ reexportar como "as casas do indicador". Seria uma linha — e criaria  │
  │ uma dependência de RUNTIME entre a camada comercial e a camada de     │
  │ medição, que hoje não se conhecem.                                   │
  │                                                                      │
  │ Sem ela, este arquivo é aritmética pura: entra número, sai número.   │
  │ Ele pode ser exercitado sozinho, num script, sem arrastar o motor     │
  │ inteiro junto — que é o que permite conferir as contas desta fase     │
  │ uma a uma contra valores esperados.                                  │
  │                                                                      │
  │ Quem exibe escolhe as casas no ponto de exibição, de `./custos`.      │
  └──────────────────────────────────────────────────────────────────────┘
*/

// ---------------------------------------------------------------------------
// Os parâmetros — o que ainda falta a Érika decidir
// ---------------------------------------------------------------------------

/**
 * O QUE O SISTEMA PRECISA QUE ELA DECIDA, E AINDA NÃO SABE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ TODOS OS CAMPOS SÃO OPCIONAIS — E ISSO É O DESENHO, NÃO UM DESCUIDO   │
 * │                                                                      │
 * │ `undefined` significa "ela ainda não disse", e o sistema se comporta  │
 * │ de acordo: não aplica nada, mostra o custo puro, e marca na tela o    │
 * │ que falta para o indicador existir.                                   │
 * │                                                                      │
 * │ `0` significaria "ela disse que é zero" — uma resposta diferente, e   │
 * │ legítima. Os dois casos não se confundem em nenhum ponto do código.   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type ParametrosComerciais = {
  /**
   * Margem de segurança, em percentual sobre o custo.
   *
   * É o acréscimo que cobre o que não entrou na ficha: a queima de um lote,
   * o ingrediente que cresceu de preço entre a cotação e a compra. Muitas
   * consultorias usam algo entre 3% e 10% — mas "muitas usam" não é
   * resposta para a consultoria DESTA cliente, e por isso o campo começa
   * vazio.
   */
  margemSegurancaPct?: number | null;

  /**
   * CMV alvo, em percentual do preço de venda.
   *
   * Serve para o caminho inverso: em vez de informar o preço e ver o CMV
   * que ele dá, informar o CMV desejado e ver o preço que ele exige. O
   * sistema NÃO escolhe esse alvo.
   */
  cmvAlvoPct?: number | null;

  /**
   * Markup-alvo, como MULTIPLICADOR sobre o custo.
   *
   * 3 significa "vendo por três vezes o custo". É a forma que parte do
   * mercado usa; a outra parte raciocina por CMV. Os dois chegam ao mesmo
   * preço por caminhos diferentes, e o sistema aceita os dois — quem decide
   * qual deles é o da casa é ela.
   */
  markupAlvo?: number | null;
};

/** Vazio = nada decidido. É o estado inicial de toda ficha e de todo cliente. */
export const PARAMETROS_VAZIOS: ParametrosComerciais = Object.freeze({});

/**
 * O que ainda falta para os indicadores aparecerem, em uma frase cada.
 *
 * Existe para a tela não ter de deduzir a partir de três `if`, e para a
 * mesma frase valer na ficha, na lista e na planilha. Três telas escrevendo
 * "falta a margem" cada uma do seu jeito dariam três avisos diferentes para
 * o mesmo vazio.
 */
export function pendenciasComerciais(p: ParametrosComerciais): string[] {
  const faltas: string[] = [];
  if (!temNumero(p.margemSegurancaPct)) {
    faltas.push("margem de segurança");
  }
  if (!temNumero(p.cmvAlvoPct) && !temNumero(p.markupAlvo)) {
    faltas.push("CMV alvo ou markup alvo");
  }
  return faltas;
}

function temNumero(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

// ---------------------------------------------------------------------------
// Custo com margem de segurança
// ---------------------------------------------------------------------------

/**
 * O custo com a margem de segurança aplicada — quando ela foi informada.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UMA FUNÇÃO SEPARADA, E NÃO UMA LINHA NA FICHA          │
 * │                                                                      │
 * │ Existem dois números de custo em jogo, e eles não podem se misturar   │
 * │ sem que alguém saiba qual está lendo:                                 │
 * │                                                                      │
 * │   CUSTO MEDIDO   — a soma do que a ficha realmente consome.           │
 * │   CUSTO COM MARGEM — o mesmo custo mais o percentual que ela decidiu  │
 * │                      reservar para as perdas que não estão na ficha.  │
 * │                                                                      │
 * │ O primeiro é fato. O segundo é decisão. Guardar só o segundo          │
 * │ apagaria o fato; guardar só o primeiro esconderia a decisão. Por isso │
 * │ os dois convivem, e a tela mostra os dois lado a lado, rotulados.     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function custoComMargem(
  custoMedido: number | null,
  p: ParametrosComerciais
): { valor: number; margemAplicadaPct: number } | null {
  if (custoMedido === null || !Number.isFinite(custoMedido) || custoMedido <= 0) return null;
  if (!temNumero(p.margemSegurancaPct)) return null;
  if (p.margemSegurancaPct < 0) return null;
  return {
    valor: custoMedido * (1 + p.margemSegurancaPct / 100),
    margemAplicadaPct: p.margemSegurancaPct,
  };
}

// ---------------------------------------------------------------------------
// Indicadores a partir do preço de venda informado
// ---------------------------------------------------------------------------

/**
 * OS DOIS INDICADORES QUE SÓ DEPENDEM DE UM PREÇO DE VENDA INFORMADO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTES DOIS NÃO PRECISAM DE DECISÃO NENHUMA                            │
 * │                                                                      │
 * │ Dado o custo e dado o preço pelo qual o prato é vendido, o CMV        │
 * │ percentual e o markup são DIVISÕES. Não há alvo, não há escolha:      │
 * │                                                                      │
 * │   CMV %  = custo ÷ preço de venda × 100                               │
 * │   Markup = preço de venda ÷ custo                                     │
 * │                                                                      │
 * │ Quem decide o preço é ela — na tela, no cardápio, na conversa com o   │
 * │ dono. O sistema recebe esse preço e mostra o que ele implica.         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * `custoBase` é o custo que ela escolher olhar: o medido, ou o medido com a
 * margem de segurança já aplicada. Os indicadores mudam de valor conforme a
 * escolha, e é por isso que a tela diz QUAL custo usou ao lado do número —
 * um CMV calculado sobre o custo com margem é de 5% a 10% maior que o
 * mesmo CMV sobre o custo medido, e os dois apareceriam iguais.
 */
export type IndicadoresDeVenda = {
  precoVenda: number;
  custoBase: number;
  /** Custo como percentual do preço de venda. */
  cmvPct: number;
  /** Preço de venda como múltiplo do custo. */
  markup: number;
  /** O que sobra do preço depois do custo, em reais. Nome: contribuição. */
  sobraReais: number;
  /** A sobra como percentual do preço. É o complemento do CMV. */
  sobraPct: number;
};

export function indicadoresDeVenda(
  custoBase: number | null,
  precoVenda: number | null
): IndicadoresDeVenda | null {
  if (custoBase === null || precoVenda === null) return null;
  if (!Number.isFinite(custoBase) || !Number.isFinite(precoVenda)) return null;
  if (custoBase <= 0 || precoVenda <= 0) return null;

  const cmvPct = (custoBase / precoVenda) * 100;
  const sobraReais = precoVenda - custoBase;

  return {
    precoVenda,
    custoBase,
    cmvPct,
    markup: precoVenda / custoBase,
    sobraReais,
    sobraPct: (sobraReais / precoVenda) * 100,
  };
}

// ---------------------------------------------------------------------------
// O caminho inverso — o preço que um alvo exige
// ---------------------------------------------------------------------------

/**
 * O PREÇO QUE UM ALVO EXIGE — e por que isto NÃO é o sistema decidindo preço.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A FRONTEIRA, ESCRITA PARA NÃO SER ATRAVESSADA POR ENGANO              │
 * │                                                                      │
 * │ Seria fácil fazer uma função `precoIdeal(custo)` que devolvesse        │
 * │ custo × 3 — é o que um sistema de precificação tolo faz. Ela seria     │
 * │ lida como recomendação, e a recomendação teria saído do nada.          │
 * │                                                                      │
 * │ O que existe aqui exige que o alvo venha de fora, e ele tem nome       │
 * │ explícito na assinatura: `cmvAlvoPct` ou `markupAlvo`. Quem chama      │
 * │ está dizendo "aplicando o SEU alvo de 28%, o preço teria de ser X".    │
 * │                                                                      │
 * │ Sem alvo informado, a função devolve `null` e a tela mostra o custo    │
 * │ e o campo de preço de venda vazio, esperando ela digitar. Esse         │
 * │ silêncio é o produto: o sistema não opina sobre o preço da Érika.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type PrecoSugerido = {
  valor: number;
  /** Qual alvo produziu este número. A tela é obrigada a dizer. */
  origem: "CMV_ALVO" | "MARKUP_ALVO";
  /** O alvo, como foi informado. */
  alvo: number;
};

export function precoQueOAlvoExige(
  custoBase: number | null,
  p: ParametrosComerciais
): PrecoSugerido | null {
  if (custoBase === null || !Number.isFinite(custoBase) || custoBase <= 0) return null;

  /*
    O CMV alvo vem primeiro porque ele é o mais restritivo dos dois: um alvo
    de CMV acima de 100% não existe (o custo seria maior que o preço, e a
    "venda" daria prejuízo). Quando os dois estão informados e discordam, a
    tela mostra os dois preços — não escolhe um por ela.
  */
  if (temNumero(p.cmvAlvoPct) && p.cmvAlvoPct > 0 && p.cmvAlvoPct < 100) {
    return {
      valor: custoBase / (p.cmvAlvoPct / 100),
      origem: "CMV_ALVO",
      alvo: p.cmvAlvoPct,
    };
  }

  if (temNumero(p.markupAlvo) && p.markupAlvo > 1) {
    return { valor: custoBase * p.markupAlvo, origem: "MARKUP_ALVO", alvo: p.markupAlvo };
  }

  return null;
}

/** Os dois preços, quando os dois alvos existem — para a tela mostrar a divergência. */
export function precosDosDoisAlvos(
  custoBase: number | null,
  p: ParametrosComerciais
): ReadonlyArray<PrecoSugerido> {
  if (custoBase === null || !Number.isFinite(custoBase) || custoBase <= 0) return [];

  const saida: PrecoSugerido[] = [];

  if (temNumero(p.cmvAlvoPct) && p.cmvAlvoPct > 0 && p.cmvAlvoPct < 100) {
    saida.push({
      valor: custoBase / (p.cmvAlvoPct / 100),
      origem: "CMV_ALVO",
      alvo: p.cmvAlvoPct,
    });
  }
  if (temNumero(p.markupAlvo) && p.markupAlvo > 1) {
    saida.push({ valor: custoBase * p.markupAlvo, origem: "MARKUP_ALVO", alvo: p.markupAlvo });
  }

  return saida;
}

// ---------------------------------------------------------------------------
// O quadro completo — o que a ficha mostra na área comercial
// ---------------------------------------------------------------------------

/**
 * TUDO O QUE A FICHA SABE DIZER SOBRE PREÇO — e tudo o que ela ainda não sabe.
 *
 * Devolve os números E as ausências, no mesmo objeto. É o mesmo desenho de
 * `ResumoCustoFicha`: quem exibe não precisa deduzir nada, e uma tela que
 * esquecesse de mostrar a ausência mostraria um número sozinho.
 */
export type QuadroComercial = {
  custoMedido: number | null;
  custoComMargem: number | null;
  margemAplicadaPct: number | null;
  precoVenda: number | null;
  /** Indicadores derivados do preço informado, quando ele existe. */
  venda: IndicadoresDeVenda | null;
  /** Preço que cada alvo informado exigiria. Vazio quando não há alvo. */
  precosAlvo: ReadonlyArray<PrecoSugerido>;
  /** O que falta para o quadro fechar. Texto, não código de erro. */
  pendencias: string[];
};

/**
 * Monta o quadro a partir do custo medido e dos dados informados.
 *
 * `precoVenda` e `parametros` vêm da ficha (declarados por ela) ou do cliente
 * (padrão da casa). A precedência é resolvida por quem chama — este arquivo
 * não sabe o que é cliente nem ficha, e é assim que ele continua sendo
 * aritmética em vez de regra de negócio.
 */
export function quadroComercial(
  custoMedido: number | null,
  precoVenda: number | null,
  parametros: ParametrosComerciais
): QuadroComercial {
  const margem = custoComMargem(custoMedido, parametros);

  /*
    ── QUAL CUSTO ENTRA NO CMV ──────────────────────────────────────────
    Quando a margem de segurança foi informada, o CMV REAL de uma venda é o
    que usa o custo COM a margem: a margem existe justamente porque parte do
    custo ainda vai aparecer. Usar o custo medido daria um CMV otimista — e
    otimista é pior do que ausente, porque ninguém verifica um número bom.
  */
  const base = margem?.valor ?? custoMedido;

  const pendencias: string[] = [];
  if (custoMedido === null || custoMedido <= 0) {
    pendencias.push("custo da ficha");
  }
  if (precoVenda === null || precoVenda <= 0) {
    pendencias.push("preço de venda");
  }
  if (!temNumero(parametros.margemSegurancaPct)) {
    pendencias.push("margem de segurança");
  }
  if (!temNumero(parametros.cmvAlvoPct) && !temNumero(parametros.markupAlvo)) {
    pendencias.push("CMV alvo ou markup alvo");
  }

  return {
    custoMedido,
    custoComMargem: margem?.valor ?? null,
    margemAplicadaPct: margem?.margemAplicadaPct ?? null,
    precoVenda,
    venda: indicadoresDeVenda(base, precoVenda),
    precosAlvo: precosDosDoisAlvos(base, parametros),
    pendencias,
  };
}

// ---------------------------------------------------------------------------
// Leitura do markup
// ---------------------------------------------------------------------------

/**
 * O markup em palavras, com o sinal de multiplicação.
 *
 * "Markup ×3,00" é como a consultora lê, e não "Markup 3". A diferença é
 * que o segundo pode ser lido como 3% por quem está com a cabeça em CMV —
 * e 3% de markup é um número completamente diferente de ×3.
 */
export function markupEmTexto(markup: number | null): string {
  if (markup === null || !Number.isFinite(markup)) return "—";
  return `×${markup.toFixed(2).replace(".", ",")}`;
}
