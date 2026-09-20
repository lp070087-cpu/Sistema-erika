/**
 * A NORMALIZAÇÃO — de texto solto para número e unidade.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO FAZ, EM UMA FRASE                                 │
 * │                                                                      │
 * │ "5kg", "5 kg", "5,000 kg" e "5.000 kg" são quatro escritas do mesmo   │
 * │ número. Este arquivo é o que as transforma numa só — e o que se       │
 * │ RECUSA a transformar quando as quatro não são a mesma coisa.          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA QUE GOVERNA TUDO AQUI: NÃO CONVERTER CALADO                  │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "NÃO converter silenciosamente quando houver ambiguidade."        │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ "1.500" é o caso que obriga esta arquitetura a existir.              │
 * │                                                                      │
 * │   · em português, o ponto é separador de MILHAR → mil e quinhentos    │
 * │   · em inglês, o ponto é separador DECIMAL → um e meio                │
 * │                                                                      │
 * │ Os dois lêem o mesmo texto, e três ordens de grandeza separam os dois │
 * │ resultados. Um custo de mil e quinhentos reais onde era um e meio      │
 * │ não é um erro de arredondamento: é um preço que ela vai praticar.     │
 * │                                                                      │
 * │ Por isso a função devolve `ambiguidade` em vez de escolher. Quem      │
 * │ escolhe é ela, na tela de conferência — onde o dado suspeito aparece   │
 * │ marcado para revisão, e não já convertido.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ESTE ARQUIVO É PURO. Não lê arquivo, não conhece PDF, não importa nada.
 * Ele recebe texto e devolve estrutura — e é o que permite testá-lo com uma
 * lista de strings sem subir uma tela.
 */

import { ehUnidadeDePeso } from "@/lib/dados";

/** O que a leitura conseguiu entender de um valor. */
export type Leitura<T> =
  | { estado: "OK"; valor: T }
  /**
   * Texto que existe e não é número. "cinco quilos" cai aqui, e não em
   * ambiguidade: não há duas leituras possíveis, não há leitura nenhuma.
   */
  | { estado: "INVALIDO"; motivo: string }
  /** Duas leituras possíveis, com resultados materialmente diferentes. */
  | { estado: "AMBIGUO"; motivo: string; leituras: readonly string[] }
  /** Campo em branco. Ausência não é zero — é ausência. */
  | { estado: "VAZIO" };

/** O número com o que ele significa: a unidade e a grandeza. */
export type Quantidade = { valor: number; unidade: string | null };

/** Um valor em dinheiro. */
export type Dinheiro = { valor: number };

/* ------------------------------------------------------------------------ */
/* O número                                                                  */
/* ------------------------------------------------------------------------ */

/**
 * O SEPARADOR DE UMA ÚNICA MARCA, COM TRÊS DÍGITOS DEPOIS DELA.
 *
 * É o padrão que denuncia a ambiguidade, e ele é específico: só existe dúvida
 * quando há UM separador e ele é seguido de exatamente três dígitos. Três,
 * porque é o tamanho de um grupo de milhar — e é também um tamanho legal de
 * parte decimal. É exatamente a faixa em que as duas convenções coincidem na
 * forma e divergem no valor.
 *
 * "1.234,56" não cai aqui: tem dois separadores, e o último (a vírgula) só
 * pode ser o decimal. "1,5" não cai aqui: dois dígitos depois da vírgula não
 * formam grupo de milhar. "1,500" cai.
 */
const SEPARADOR_UNICO_AMBIGUO = /^\d{1,3}([.,])\d{3}$/;

/** Um número, na forma que o `Number` do JavaScript aceita. */
const NUMERO_SIMPLES = /^\d+(\.\d+)?$/;

/**
 * O texto vira número.
 *
 * A ordem das checagens é a ordem da decisão: primeiro a ambiguidade, que
 * manda para a tela de conferência; depois a limpeza, que resolve o resto.
 */
export function normalizarNumero(texto: string): Leitura<number> {
  const cru = texto.trim();
  if (cru === "") return { estado: "VAZIO" };

  /*
    O QUE NÃO É DÍGITO, NEM SEPARADOR, NEM SINAL, SAI FORA.

    "R$", "kg", espaços e qualquer unidade escrita junto saem aqui — o número
    está no meio do texto, e o resto é rótulo. Retirar em vez de recusar é o
    que faz "5 kg" e "R$ 50" serem legíveis; o que sobra depois é que diz se
    havia número.
  */
  const apenasNumero = cru.replace(/[^\d.,-]/g, "");
  if (apenasNumero === "" || !/\d/.test(apenasNumero)) {
    return { estado: "INVALIDO", motivo: "O texto não contém nenhum algarismo." };
  }

  const ambiguo = SEPARADOR_UNICO_AMBIGUO.exec(apenasNumero);
  if (ambiguo) {
    const separador = ambiguo[1];
    /*
      O SEPARADOR NÃO PODE FALTAR — e a linha existe mesmo assim.

      O padrão tem um grupo de captura, então todo casamento traz o separador
      em `[1]`. O `noUncheckedIndexedAccess` do projeto não sabe disso e o
      tipo vem como `string | undefined`.

      A saída barata seria `ambiguo[1]!`, e ela é pior: um `!` desliga a
      checagem para sempre, inclusive no dia em que alguém mexer no padrão e
      o grupo sumir. Se isso acontecer, a linha abaixo devolve `INVALIDO` e o
      número não passa como se tivesse sido lido.
    */
    if (separador === undefined) {
      return { estado: "INVALIDO", motivo: "O texto tem um separador de milhar que não pôde ser identificado." };
    }
    const milhar = Number(apenasNumero.replace(/[.,]/g, ""));
    const decimal = Number(apenasNumero.replace(separador, "."));
    return {
      estado: "AMBIGUO",
      motivo:
        separador === "."
          ? `"${cru}" pode ser ${formatar(milhar)} (ponto de milhar, como se escreve em português) ou ${formatar(decimal)} (ponto decimal, como se escreve em inglês).`
          : `"${cru}" pode ser ${formatar(decimal)} (vírgula decimal, como se escreve em português) ou ${formatar(milhar)} (vírgula de milhar, como se escreve em inglês).`,
      leituras: [formatar(decimal), formatar(milhar)],
    };
  }

  /*
    A VÍRGULA MANDA QUANDO AS DUAS EXISTEM.

    "1.234,56" é inequivocamente português — e é o formato que sai deste
    sistema inteiro. O separador que aparece por ÚLTIMO é o decimal, e essa
    regra resolve os dois casos restantes sem precisar de mais nenhuma.
  */
  const ultimaVirgula = apenasNumero.lastIndexOf(",");
  const ultimoPonto = apenasNumero.lastIndexOf(".");
  const ultimo = Math.max(ultimaVirgula, ultimoPonto);

  let normalizado: string;
  if (ultimo < 0) {
    normalizado = apenasNumero;
  } else {
    const inteira = apenasNumero.slice(0, ultimo).replace(/[.,]/g, "");
    const fracao = apenasNumero.slice(ultimo + 1).replace(/[.,]/g, "");
    normalizado = `${inteira}.${fracao}`;
  }

  if (!NUMERO_SIMPLES.test(normalizado)) {
    return { estado: "INVALIDO", motivo: `"${cru}" não é um número.` };
  }

  const valor = Number(normalizado);
  if (!Number.isFinite(valor)) {
    return { estado: "INVALIDO", motivo: `"${cru}" não é um número.` };
  }
  return { estado: "OK", valor };
}

/**
 * O número escrito para ler, sem depender de formatação de moeda.
 *
 * Existe para as mensagens de ambiguidade, que precisam mostrar OS DOIS
 * valores possíveis lado a lado — e a diferença entre "1.500" e "1,5" precisa
 * saltar aos olhos de quem lê a frase.
 */
function formatar(valor: number): string {
  const inteiro = Number.isInteger(valor);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: inteiro ? 0 : undefined,
    maximumFractionDigits: 4,
  }).format(valor);
}

/* ------------------------------------------------------------------------ */
/* O dinheiro                                                                */
/* ------------------------------------------------------------------------ */

/**
 * O dinheiro.
 *
 * Não tem mistério depois do número: o que caracteriza dinheiro no texto é
 * "R$", "reais" ou o contexto da coluna. A conversão é a mesma, e a única
 * coisa que este wrapper acrescenta é o nome — para quem lê o código saber
 * que aquele número é valor, e não peso.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ELE HERDA A AMBIGUIDADE, E DEVIA                                  │
 * │                                                                      │
 * │ "R$ 1.500" tem a mesma dúvida de "1.500". Deixar o dinheiro passar     │
 * │ resolvido porque "é dinheiro" seria criar uma porta dos fundos        │
 * │ exatamente no campo onde o erro custa mais caro: preço.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function normalizarDinheiro(texto: string): Leitura<Dinheiro> {
  const lido = normalizarNumero(texto);
  switch (lido.estado) {
    case "OK":
      /*
        VALOR NEGATIVO NÃO É DINHEIRO.

        Um preço de compra negativo não existe. A recusa acontece aqui, e não
        mais adiante na validação, porque um negativo que passasse adiante
        entraria numa soma e SUBTRAIRIA — e o custo final pareceria menor sem
        nenhum sinal visível de que havia algo errado.
      */
      return lido.valor < 0
        ? { estado: "INVALIDO", motivo: `"${texto}" é um valor negativo. Preço de compra não é negativo.` }
        : { estado: "OK", valor: { valor: lido.valor } };
    default:
      return lido;
  }
}

/* ------------------------------------------------------------------------ */
/* A quantidade e o peso                                                     */
/* ------------------------------------------------------------------------ */

/** Os nomes de unidade que o sistema reconhece, e o que eles viram. */
const APELIDOS: Record<string, string> = {
  kg: "kg",
  kgs: "kg",
  quilo: "kg",
  quilos: "kg",
  kilograma: "kg",
  kilogramas: "kg",
  g: "g",
  gr: "g",
  grama: "g",
  gramas: "g",
  l: "L",
  lt: "L",
  litro: "L",
  litros: "L",
  ml: "ml",
  mls: "ml",
  mililitro: "ml",
  mililitros: "ml",
  un: "un",
  und: "un",
  unid: "un",
  unidade: "un",
  unidades: "un",
  pct: "pct",
  pacote: "pct",
  cx: "cx",
  caixa: "cx",
  dz: "dz",
  duzia: "dz",
  dúzia: "dz",
};

/**
 * A UNIDADE, SEPARADA DO NÚMERO.
 *
 * Ela sai do mesmo texto que o número, e a ordem importa: o número é lido
 * ignorando as letras, e as letras são lidas ignorando os números. Um
 * "5kg" não precisa de separador nenhum entre as duas partes, e exigir um
 * ("5 kg") faria o parser recusar a forma mais comum de escrever à mão.
 */
export function normalizarQuantidade(texto: string): Leitura<Quantidade> {
  const cru = texto.trim();
  if (cru === "") return { estado: "VAZIO" };

  const lido = normalizarNumero(cru);
  /*
    `VAZIO` TAMBÉM SAI AQUI.

    `texto` já foi aparado na linha de cima, então "vazio" e "só espaços"
    param antes desta função e são `VAZIO` por definição. Um texto não-vazio
    que não produza algarismo nenhum não volta `VAZIO` de `normalizarNumero`
    — volta `INVALIDO` ou `AMBIGUO`.

    Ou seja: este ramo é INALCANÇÁVEL, e existe para o compilador conseguir
    estreitar o tipo. Sem ele, a linha de baixo leria `lido.valor` num tipo
    que ainda inclui `VAZIO`, que não tem `valor`.

    Devolver o próprio `VAZIO` é o comportamento certo no caso impossível:
    nada foi lido, e é isso que se estaria afirmando.
  */
  if (lido.estado !== "OK") return lido;

  /*
    A UNIDADE É O QUE SOBRA DEPOIS DE TIRAR O NÚMERO.

    `match` em vez de `replace`: o que interessa é o pedaço de letras, e não
    o que restou. Sem acento e em minúscula na comparação, porque "KG" e
    "Quilo" são a mesma unidade escrita por duas pessoas diferentes.
  */
  const letras = /[A-Za-zÀ-ÿ]+/.exec(cru);
  const bruta = letras?.[0] ?? null;

  if (bruta === null) {
    /*
      SEM UNIDADE, O NÚMERO PASSA — e a ausência é registrada.

      Não é erro: numa planilha de ingredientes já organizada, a coluna de
      unidade pode estar em outra célula. Recusar aqui obrigaria a inventar um
      "un" para todo número solto, e "un" é uma afirmação sobre o dado que
      ninguém fez.
    */
    return { estado: "OK", valor: { valor: lido.valor, unidade: null } };
  }

  const chave = bruta.toLowerCase();
  const canonica = APELIDOS[chave];
  if (canonica === undefined) {
    /*
      A UNIDADE DESCONHECIDA NÃO VIRA NÚMERO.

      "5 sacos" não é 5. Sem esta recusa, a validação adiante receberia uma
      quantidade sem unidade e o sistema a trataria como soma de quilo — que
      é o erro mais fácil de cometer e o mais difícil de notar, porque o
      número está lá, do tamanho certo.
    */
    return {
      estado: "INVALIDO",
      motivo: `"${bruta}" não é uma unidade conhecida. O sistema soma kg, g, L, ml, un, pct, cx e dz.`,
    };
  }

  return { estado: "OK", valor: { valor: lido.valor, unidade: canonica } };
}

/**
 * A quantidade é de peso ou volume, e portanto somável com as outras?
 *
 * Delega para `ehUnidadeDePeso` de `@/lib/dados` — a MESMA função que a
 * calculadora de rendimento usa para decidir se dois pesos se somam. Uma
 * segunda lista de unidades aqui seria a segunda resposta à mesma pergunta, e
 * a que divergisse faria a importação somar o que a calculadora recusa somar.
 */
export function ehSomavel(unidade: string | null): boolean {
  return unidade !== null && ehUnidadeDePeso(unidade);
}

/**
 * A FAIXA DE PESO PLAUSÍVEL DE UMA LINHA DE FICHA, em quilos.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA CONSTANTE EXISTE, E POR QUE ELA NÃO É METODOLOGIA       │
 * │                                                                      │
 * │ Isto NÃO é um fator de correção, nem um rendimento de referência, nem  │
 * │ um limite de custo. É um teste de SANIDADE: a ficha é de um prato, e   │
 * │ um prato não leva cinco toneladas de nada.                            │
 * │                                                                      │
 * │ Vale porque a leitura automática erra de um jeito previsível: um        │
 * │ separador decimal mal lido multiplica por mil. "0,5 kg" lido como       │
 * │ "500" é o defeito que esta faixa pega — e ela o pega sem afirmar nada   │
 * │ sobre a receita, que é o que a mantém fora da metodologia da Érika.    │
 * │                                                                      │
 * │ O limite superior é generoso de propósito: uma panela de caldo pode    │
 * │ levar vinte litros de água. Ele existe para barrar o absurdo, não para  │
 * │ opinar sobre a receita.                                               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const PESO_MINIMO_KG = 0.001;
export const PESO_MAXIMO_KG = 50;

/** Converte para quilos o que já está em unidade canônica. Sem conversão, só escala. */
export function emQuilos(valor: number, unidade: string | null): number | null {
  switch (unidade) {
    case "kg":
    case "L":
      return valor;
    case "g":
    case "ml":
      return valor / 1000;
    default:
      return null;
  }
}
