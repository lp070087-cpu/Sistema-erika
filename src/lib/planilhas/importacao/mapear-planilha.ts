/**
 * DE UMA PLANILHA PARA AS LINHAS DA IMPORTAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO É PURO, E O `exceljs` ESTÁ NO OUTRO             │
 * │                                                                      │
 * │ Abrir um `.xlsx` exige `exceljs`, que é biblioteca de servidor — e é   │
 * │ a MESMA separação que sustenta o resto das planilhas deste sistema:    │
 * │ `grade.ts` monta a estrutura sem tocar em biblioteca, e                 │
 * │ `escrever-grade.ts` é quem fala com o ExcelJS. Aqui a fronteira é a     │
 * │ mesma, e ela não é cerimônia: a regra que decide "esta coluna é a       │
 * │ quantidade?" é a parte difícil da leitura, e ela precisa poder ser      │
 * │ conferida por execução, com listas de strings, sem subir um arquivo.    │
 * │                                                                      │
 * │ O que este arquivo recebe é `unknown[][]` — linhas e células cruas.     │
 * │ O leitor de verdade entrega exatamente isso, já convertido dos tipos    │
 * │ que o ExcelJS usa. Aqui não há `import` nenhum.                         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A VANTAGEM HONESTA DE UMA PLANILHA SOBRE UM PDF                      │
 * │                                                                      │
 * │ Numa planilha, quem escreveu JÁ DECIDIU o que era número. Uma célula   │
 * │ com 1,5 está guardada como o número 1.5 — não como o texto "1.500".     │
 * │                                                                      │
 * │ Isso significa que a ambiguidade que assombra a leitura de PDF         │
 * │ ("1.500 é mil e quinhentos ou um e meio?") NÃO EXISTE aqui: o arquivo   │
 * │ já respondeu. A leitura de `.xlsx` é a mais confiável das quatro        │
 * │ portas, e não custa nada dizer isso.                                   │
 * │                                                                      │
 * │ Ela não é perfeita: células gravadas como TEXTO pelo usuário continuam  │
 * │ ambíguas, e é por isso que a normalização continua rodando sobre o      │
 * │ que sai daqui. O ganho é real e não é total.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { normalizarQuantidade } from "./normalizar";
import type { CabecalhoExtraido, DocumentoExtraido, LinhaExtraida } from "./tipos";

/* ------------------------------------------------------------------------ */
/* O papel de cada coluna                                                    */
/* ------------------------------------------------------------------------ */

export const PAPEIS = ["descricao", "quantidade", "unidade", "valor"] as const;

export type Papel = (typeof PAPEIS)[number];

/** O que a coluna virou: um papel, ou uma decisão de não usar. */
export type PapelAtribuido = Papel | "ignorada" | "ambigua";

export type ColunaMapeada = {
  /** Zero-based, como o resto do código de planilha deste sistema. */
  indice: number;
  /** O texto do cabeçalho como ele veio do arquivo. Vazio quando não havia. */
  rotulo: string;
  papel: PapelAtribuido;
  /**
   * QUANDO A COLUNA É AMBÍGUA, QUEM ESTAVA DISPUTANDO.
   *
   * Existe para a mensagem poder dizer "pode ser quantidade ou valor" em vez
   * de "não reconhecida" — e a diferença é o que ela consegue fazer com a
   * frase. "Não reconhecida" não diz o que fazer; dois candidatos, sim.
   */
  candidatos?: readonly Papel[];
};

export type MapaDeColunas = {
  /** A linha do cabeçalho, 1-based. `null` quando nenhuma foi reconhecida. */
  linhaDoCabecalho: number | null;
  colunas: readonly ColunaMapeada[];
  /**
   * NÃO HOUVE CABEÇALHO, E AS COLUNAS FORAM LIDAS PELA POSIÇÃO.
   *
   * É `true` quando o arquivo não trouxe nenhum título reconhecível e o
   * sistema usou o arranjo mais comum — descrição em A, quantidade em B,
   * valor em C. É um palpite, e a tela diz que é: a frase fica no nome do
   * leitor, que aparece na conferência.
   *
   * Ele é `true` em vez de a leitura ser recusada porque uma lista sem
   * cabeçalho é uma planilha perfeitamente normal — e recusá-la deixaria ela
   * sem saída justamente no arquivo mais simples.
   */
  posicional: boolean;
};

/* ------------------------------------------------------------------------ */
/* Os sinônimos                                                              */
/* ------------------------------------------------------------------------ */

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UMA LISTA DE SINÔNIMOS, E NÃO O NOME EXATO                  │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Não depender somente de uma grafia exata."                       │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ O briefing é explícito, e o motivo é prático: não existe planilha de   │
 * │ fornecedor com o cabeçalho padronizado. Cada cliente manda a sua, e a   │
 * │ mesma coluna se chama "Ingrediente", "Insumo", "Produto", "Descrição",  │
 * │ "Item" e "Mercadoria" em cinco arquivos diferentes.                     │
 * │                                                                      │
 * │ A comparação é por CONTER, e não por igualdade: "Preço unitário (R$)"   │
 * │ e "Peso líquido (kg)" são cabeçalhos reais e nenhum deles é igual a     │
 * │ nada desta lista.                                                      │
 * │                                                                      │
 * │ O que decide entre dois candidatos é o TAMANHO do sinônimo encontrado.  │
 * │ "Peso líquido" tem "peso" e "liquido" dentro — e "peso líquido" é o     │
 * │ mais longo, então é ele que classifica. Sem esse critério, "Preço       │
 * │ unitário" seria decidido pela ordem da lista, e a ordem da lista não é   │
 * │ um argumento.                                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A COLUNA DE UNIDADE É SEPARADA, E ELA NÃO É A DE QUANTIDADE           │
 * │                                                                      │
 * │ Muita planilha escreve "5" numa coluna e "kg" na seguinte. Se as duas   │
 * │ virassem a mesma coluna, o sistema leria "5" sem unidade e "kg" sem      │
 * │ número — e as duas linhas iriam para a conferência como defeito.        │
 * │                                                                      │
 * │ Separadas, elas se juntam na hora de montar a linha: 5 e kg viram       │
 * │ "5 kg", que é o que o documento diz. Ver `juntarQuantidade`.            │
 * │                                                                      │
 * │ A junção só acontece quando a coluna de quantidade NÃO TEM LETRA —      │
 * │ senão "5 kg" + "kg" viraria "5 kg kg", que a normalização recusa, e o   │
 * │ defeito apareceria como culpa dela.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const SINONIMOS: Record<Papel, readonly string[]> = {
  descricao: [
    "ingrediente",
    "ingredientes",
    "insumo",
    "insumos",
    "produto",
    "produtos",
    "mercadoria",
    "mercadorias",
    "descricao",
    "descricoes",
    "componente",
    "componentes",
    "item",
    "itens",
    "genero",
    "generos",
    "material",
    "materiais",
    "nome",
    "nome do produto",
    "nome do insumo",
  ],
  quantidade: [
    "quantidade",
    "quantidades",
    "qtd",
    "qtd.",
    "qtde",
    "qtdade",
    "quant",
    "peso liquido",
    "peso limpo",
    "peso bruto",
    "peso",
    "volume",
    "gramatura",
  ],
  unidade: [
    "unidade",
    "unidades",
    "unid",
    "und",
    "un.",
    "un",
    "um",
    "medida",
    "embalagem",
    "tipo de medida",
  ],
  valor: [
    "valor total",
    "valor unitario",
    "valor unit",
    "valor",
    "valores",
    "preco total",
    "preco unitario",
    "preco unit",
    "preco por kg",
    "preco kg",
    "preco",
    "precos",
    "custo total",
    "custo unitario",
    "custo",
    "custos",
    "total",
    "subtotal",
    "investimento",
    "r$",
  ],
};

/**
 * O CABEÇALHO NORMALIZADO: SEM ACENTO, SEM PONTUAÇÃO, EM MINÚSCULA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A PONTUAÇÃO SAI EM VEZ DE SER TRATADA                        │
 * │                                                                      │
 * │ O `\p{Diacritic}` é a marca de acento SEPARADA DA LETRA — o resultado  │
 * │ de `normalize("NFD")`. Tirar o acento depois exigiria substituir por   │
 * │ um mapa de "á" → "a", que é o tipo de tabela que sempre fica           │
 * │ incompleta.                                                           │
 * │                                                                      │
 * │ O `$` sai junto com o resto da pontuação, então "Valor (R$)" vira      │
 * │ "valor r" — e "r$" continua na lista de sinônimos para o caso de a      │
 * │ coluna se chamar só "R$".                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function normalizarCabecalho(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * QUAL PAPEL ESTE CABEÇALHO PEDE — quando não há dúvida.
 *
 * Devolve `null` quando nenhum sinônimo aparece. Devolve a lista de
 * candidatos quando EMPATAM, porque um empate é uma dúvida que ela precisa
 * ver, e escolher por ordem de lista seria esconder a dúvida atrás de uma
 * decisão que ninguém tomou.
 */
export function papelDoCabecalho(rotulo: string): Papel | null | readonly Papel[] {
  const limpo = normalizarCabecalho(rotulo);
  if (limpo === "") return null;

  let melhor: Papel | null = null;
  let tamanhoDoMelhor = 0;
  let empatados: Papel[] = [];

  for (const papel of PAPEIS) {
    for (const sinonimo of SINONIMOS[papel]) {
      if (!limpo.includes(sinonimo)) continue;
      if (sinonimo.length > tamanhoDoMelhor) {
        tamanhoDoMelhor = sinonimo.length;
        melhor = papel;
        empatados = [papel];
      } else if (sinonimo.length === tamanhoDoMelhor && melhor !== papel && !empatados.includes(papel)) {
        empatados.push(papel);
      }
    }
  }

  if (melhor === null) return null;
  return empatados.length > 1 ? empatados : melhor;
}

/* ------------------------------------------------------------------------ */
/* O mapeamento                                                              */
/* ------------------------------------------------------------------------ */

/**
 * AS COLUNAS POSICIONAIS DE RESERVA.
 *
 * Quando não há cabeçalho reconhecível, a ordem mais comum das planilhas de
 * ficha é esta: descrição, quantidade e valor nas três primeiras colunas.
 *
 * A unidade NÃO entra na reserva: numa planilha sem cabeçalho, uma quarta
 * coluna tanto pode ser a unidade quanto a categoria, e adivinhar entre as
 * duas seria inventar. Sem ela, o "5" da coluna B vai para a conferência sem
 * unidade — e sem unidade é ausência declarada, não um erro.
 */
const POSICIONAL: readonly (readonly [number, Papel])[] = [
  [0, "descricao"],
  [1, "quantidade"],
  [2, "valor"],
];

/** Até onde se procura o cabeçalho. Um título de relatório ocupa as primeiras linhas. */
const LIMITE_DO_CABECALHO = 15;

/** Quantas colunas reconhecidas fazem uma linha valer como cabeçalho. */
const MINIMO_PARA_CABECALHO = 2;

/**
 * A LINHA QUE PARECE UM CABEÇALHO, SE HOUVER UMA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A MELHOR LINHA, E NÃO A PRIMEIRA                            │
 * │                                                                      │
 * │ Planilha de fornecedor raramente começa no cabeçalho. As três          │
 * │ primeiras linhas trazem o nome da empresa, o mês da cotação e um        │
 * │ telefone; a tabela começa na quarta ou na sétima.                      │
 * │                                                                      │
 * │ Procurar nas quinze primeiras linhas e ficar com a que TEM MAIS         │
 * │ COLUNAS RECONHECIDAS resolve isso sem entender o arquivo: uma linha     │
 * │ de título reconhece zero colunas, e a de cabeçalho reconhece três.      │
 * │                                                                      │
 * │ Duas colunas é o mínimo, e não uma: uma única palavra reconhecida       │
 * │ ("Produto") numa linha de título bastaria para o sistema tratar a       │
 * │ linha errada como cabeçalho e descartar o cabeçalho de verdade.         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function acharCabecalho(linhas: readonly (readonly unknown[])[]): {
  numero: number;
  mapa: readonly ColunaMapeada[];
  acertos: number;
} | null {
  const limite = Math.min(LIMITE_DO_CABECALHO, linhas.length);
  let melhor: { numero: number; mapa: readonly ColunaMapeada[]; acertos: number } | null = null;

  for (let i = 0; i < limite; i++) {
    const linha = linhas[i];
    if (!linha) continue;

    const mapa: ColunaMapeada[] = [];
    const jaUsados = new Set<Papel>();
    let acertos = 0;

    for (let c = 0; c < linha.length; c++) {
      const rotulo = textoDeCelula(linha[c]) ?? "";
      const veredito = papelDoCabecalho(rotulo);

      if (veredito === null) {
        mapa.push({ indice: c, rotulo, papel: "ignorada" });
        continue;
      }

      /*
        O EMPATE É TESTADO POR `typeof` E NÃO POR `Array.isArray`, e a
        diferença não é de estilo.

        `papelDoCabecalho` devolve `Papel | null | readonly Papel[]`. O
        `Array.isArray` sobre um `readonly Papel[]` NÃO estreita o tipo: o
        predicado do TypeScript é `arg is any[]`, e um vetor somente-leitura
        não é um `any[]` — então o ramo de dentro continuaria vendo a união
        inteira, e o `veredito` de baixo chegaria ao `Set` como três tipos
        possíveis.

        Testar `typeof veredito !== "string"` estreita pelo outro lado e sem
        ambiguidade: sobram o `null` (já tratado acima) e o vetor. É o mesmo
        motivo pelo qual o `ler-lista.ts` testa o resultado do mesmo jeito.
      */
      if (typeof veredito !== "string") {
        /*
          EMPATE ENTRE PAPÉIS NÃO CONTA COMO ACERTO.

          Contar como acerto faria uma linha de título com duas palavras
          ambíguas ganhar de um cabeçalho verdadeiro com três colunas claras.
          Ambígua é ambígua: aparece na conferência, e a linha não é eleita.
        */
        mapa.push({ indice: c, rotulo, papel: "ambigua", candidatos: veredito });
        continue;
      }

      /*
        UM PAPEL SÓ PODE VIR DE UMA COLUNA.

        Duas colunas chamadas "Quantidade" na mesma linha é um arquivo com
        defeito — e a segunda vira `ignorada` de propósito: somar duas
        quantidades numa linha só seria o sistema escolhendo por ela qual das
        duas vale, sem nunca dizer que havia duas.
      */
      if (jaUsados.has(veredito)) {
        mapa.push({ indice: c, rotulo, papel: "ignorada" });
        continue;
      }

      jaUsados.add(veredito);
      acertos++;
      mapa.push({ indice: c, rotulo, papel: veredito });
    }

    if (acertos >= MINIMO_PARA_CABECALHO && (melhor === null || acertos > melhor.acertos)) {
      melhor = { numero: i + 1, mapa, acertos };
    }
  }

  return melhor;
}

/**
 * O MAPA DAS COLUNAS — cabeçalho quando houver, posição quando não houver.
 *
 * Esta é a função que a conferência precisa poder explicar. Se a leitura saiu
 * errada, é aqui que está a resposta: qual coluna virou quantidade, e se
 * alguém decidiu isso por sinônimo ou por posição.
 */
export function mapearColunas(
  linhas: readonly (readonly unknown[])[],
  largura: number
): MapaDeColunas {
  const cabecalho = acharCabecalho(linhas);

  if (cabecalho !== null) {
    // As colunas que o cabeçalho não cobriu continuam contadas, para a linha
    // montada ter o mesmo número de células que o arquivo tem.
    const colunas: ColunaMapeada[] = [];
    for (let c = 0; c < largura; c++) {
      const doCabecalho = cabecalho.mapa.find((m) => m.indice === c);
      colunas.push(doCabecalho ?? { indice: c, rotulo: "", papel: "ignorada" });
    }
    return { linhaDoCabecalho: cabecalho.numero, colunas, posicional: false };
  }

  const colunas: ColunaMapeada[] = [];
  for (let c = 0; c < largura; c++) {
    const reserva = POSICIONAL.find(([indice]) => indice === c);
    colunas.push({ indice: c, rotulo: "", papel: reserva ? reserva[1] : "ignorada" });
  }
  return { linhaDoCabecalho: null, colunas, posicional: true };
}

/* ------------------------------------------------------------------------ */
/* A célula lida como texto                                                  */
/* ------------------------------------------------------------------------ */

/**
 * O VALOR DE UMA CÉLULA ESCRITO COMO TEXTO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO NÃO É UM `String(valor)`                                │
 * │                                                                      │
 * │ O ExcelJS não entrega strings. Ele entrega a forma INTERNA do         │
 * │ formato: número como número, data como `Date`, e texto formatado como  │
 * │ `{ richText: [...] }` — um vetor de pedaços, porque uma célula pode    │
 * │ trocar de fonte no meio da palavra. Um `String()` sobre esse objeto    │
 * │ devolveria "[object Object]", e a descrição do ingrediente viraria      │
 * │ isso na tela.                                                         │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ A FÓRMULA ENTREGA O RESULTADO, E NÃO A FÓRMULA                    │ │
 * │ │                                                                  │ │
 * │ │ Uma célula calculada chega como `{ formula, result }`. O que      │ │
 * │ │ interessa é o `result` — é ele que a célula MOSTRA, e é ele que a  │ │
 * │ │ ficha cobra. A fórmula em si ("B2*C2") não é dado de ficha.        │ │
 * │ │                                                                  │ │
 * │ │ Quando o arquivo veio de outro programa e o resultado não foi     │ │
 * │ │ gravado, o `result` é `undefined` — e aí a célula é tratada como   │ │
 * │ │ VAZIA, que é a resposta honesta: não há valor dentro dela.         │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ O ERRO DE FÓRMULA PASSA, E NÃO É ESCONDIDO                        │ │
 * │ │                                                                  │ │
 * │ │ `#DIV/0!`, `#REF!` e `#N/A` chegam como `{ error }`. Eles PODEM    │ │
 * │ │ ser devolvidos como o próprio texto do erro, e devem: uma planilha │ │
 * │ │ do cliente com uma fórmula quebrada é uma coisa que ela precisa    │ │
 * │ │ saber. O texto do erro não é um número, então a normalização o      │ │
 * │ │ marca para revisão — que é exatamente o tratamento certo.          │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function textoDeCelula(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;

  if (typeof valor === "string") {
    const aparado = valor.trim();
    return aparado === "" ? null : aparado;
  }

  if (typeof valor === "number") {
    if (!Number.isFinite(valor)) return null;
    return numeroEmTexto(valor);
  }

  if (typeof valor === "boolean") return valor ? "SIM" : "NÃO";

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return null;
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(valor);
  }

  if (typeof valor === "object") {
    const objeto = valor as Record<string, unknown>;

    // Texto com formatação no meio: os pedaços são colados de volta.
    if (Array.isArray(objeto["richText"])) {
      const junto = (objeto["richText"] as readonly { text?: unknown }[])
        .map((p) => (typeof p?.text === "string" ? p.text : ""))
        .join("")
        .trim();
      return junto === "" ? null : junto;
    }

    // Célula calculada: vale o resultado, ver o bloco acima.
    const resultado = objeto["result"];
    if (resultado !== undefined) return textoDeCelula(resultado);

    // Célula com erro de fórmula: o erro É o conteúdo, ver o bloco acima.
    if (typeof objeto["error"] === "string") return objeto["error"];

    // Texto com hiperlink.
    if (typeof objeto["text"] === "string") return textoDeCelula(objeto["text"]);
  }

  // Forma desconhecida: nenhuma suposição. A célula é tratada como ausente, e
  // ausência é uma resposta honesta — inventar texto aqui seria pior.
  return null;
}

/**
 * O NÚMERO ESCRITO SEM RUÍDO DE PONTO FLUTUANTE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE                                                  │
 * │                                                                      │
 * │ Uma célula calculada por uma fórmula pode chegar como 33.33333333333  │
 * │ 6 — a representação binária de um terço. O Excel MOSTRA 33,33%, mas o  │
 * │ número guardado é o comprido, e `String()` devolve o comprido.         │
 * │                                                                      │
 * │ Sem esta limpeza, toda linha calculada por fórmula chegaria na         │
 * │ conferência com dezoito dígitos e um aviso de valor suspeito. Seria um  │
 * │ aviso em cima de um dado certo, e aviso que aparece sempre é aviso que  │
 * │ ninguém lê.                                                           │
 * │                                                                      │
 * │ O CORTE É EM SEIS CASAS, e ele não perde nada que importe: custo por   │
 * │ grama é a menor grandeza deste sistema, e ela vive em quatro casas.     │
 * │                                                                      │
 * │ E ele só age quando o texto é LONGO. Números normais saem intactos —   │
 * │ "1500" continua "1500", sem uma casa decimal acrescentada.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function numeroEmTexto(valor: number): string {
  const simples = String(valor);
  if (simples.length <= 15) return simples;

  const cortado = Number(valor.toFixed(6));
  return Number.isFinite(cortado) ? String(cortado) : simples;
}

/* ------------------------------------------------------------------------ */
/* A linha montada                                                           */
/* ------------------------------------------------------------------------ */

/**
 * A QUANTIDADE E A UNIDADE DE COLUNAS DIFERENTES.
 *
 * "5" e "kg" em duas células são "5 kg" — o documento diz isso, e juntar as
 * duas não é inventar: é ler as duas.
 *
 * A junção só acontece quando a quantidade NÃO TEM LETRA NENHUMA. Se ela já
 * diz "5 kg", a coluna de unidade é ignorada — senão sairia "5 kg kg", que a
 * normalização recusaria, e o defeito apareceria como se fosse dela.
 */
function juntarQuantidade(quantidade: string | null, unidade: string | null): string | null {
  if (quantidade === null) return unidade === null ? null : unidade;

  const temLetra = /[A-Za-zÀ-ÿ]/.test(quantidade);
  if (temLetra || unidade === null) return quantidade;

  /*
    SE A COLUNA DE UNIDADE TIVER UM NÚMERO, ELA NÃO É UNIDADE.

    Uma coluna intitulada "Unidade" que traz "12" não está dizendo a unidade
    de medida, está dizendo a contagem — e colar isso na quantidade daria
    "5 12". Nesse caso as duas são descartadas, e a linha vai para a
    conferência sem quantidade: ausência declarada, que é melhor que um
    número inventado por justaposição.
  */
  if (/\d/.test(unidade)) return quantidade;

  return `${quantidade} ${unidade}`;
}

/**
 * AS LINHAS DA PLANILHA VIRAM AS LINHAS DA IMPORTAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA FUNÇÃO NÃO FAZ                                           │
 * │                                                                      │
 * │ Ela não converte número. "5 kg" continua sendo o TEXTO "5 kg" — quem    │
 * │ decide que isso são cinco quilos é `normalizar.ts`, e a decisão fica    │
 * │ registrada com o texto original ao lado.                                │
 * │                                                                      │
 * │ Ela não descarta linha com defeito. Ela descarta linha VAZIA, que é     │
 * │ outra coisa: uma linha em branco no meio de uma tabela é espaçamento,   │
 * │ e trinta avisos sobre espaçamento esconderiam o único aviso que          │
 * │ importava. Uma linha com texto ilegível CONTINUA, e chega na            │
 * │ conferência para ser julgada.                                          │
 * │                                                                      │
 * │ A `pagina` de todo campo é `null`, e isso é a verdade: planilha não     │
 * │ tem página. Inventar "1" faria a conferência prometer uma localização   │
 * │ que não existe — e ela iria procurar a linha 1 do quê?                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function montarLinhas(
  linhas: readonly (readonly unknown[])[],
  mapa: MapaDeColunas
): readonly LinhaExtraida[] {
  const inicio = mapa.linhaDoCabecalho ?? 0;

  const colunaDe = (papel: Papel): number | null => {
    const achada = mapa.colunas.find((c) => c.papel === papel);
    return achada ? achada.indice : null;
  };

  const descricao = colunaDe("descricao");
  const quantidade = colunaDe("quantidade");
  const unidade = colunaDe("unidade");
  const valor = colunaDe("valor");

  const saida: LinhaExtraida[] = [];

  for (let i = inicio; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha) continue;

    const celula = (indice: number | null): string | null =>
      indice === null ? null : textoDeCelula(linha[indice]);

    const textoDescricao = celula(descricao);
    const textoQuantidade = juntarQuantidade(celula(quantidade), celula(unidade));
    const textoValor = celula(valor);

    /*
      LINHA VAZIA NÃO VIRA AVISO.

      A célula da descrição é a que decide: uma linha sem descrição e sem
      número nenhum é espaçamento. Uma linha SEM descrição mas COM quantidade
      continua — pode ser continuação da linha de cima, e quem decide o que
      fazer com ela é ela, na conferência.
    */
    if (textoDescricao === null && textoQuantidade === null && textoValor === null) continue;

    /*
      A ORDEM É A LINHA FÍSICA DA PLANILHA, 1-based — a mesma que o Excel
      mostra na lateral da tela. É o que permite abrir o arquivo ao lado e
      conferir a linha apontada.
    */
    const ordem = i + 1;

    saida.push({
      descricao: textoDescricao === null ? null : { texto: textoDescricao, pagina: null },
      quantidade: textoQuantidade === null ? null : { texto: textoQuantidade, pagina: null },
      valor: textoValor === null ? null : { texto: textoValor, pagina: null },
      ordem,
    });
  }

  return saida;
}

/* ------------------------------------------------------------------------ */
/* O cabeçalho do prato                                                      */
/* ------------------------------------------------------------------------ */

/** Os sinônimos do nome do prato — o título da ficha, quando a planilha traz um. */
const TITULO_DO_PRATO = [
  "prato",
  "receita",
  "preparacao",
  "preparo",
  "nome do prato",
  "nome da receita",
  "ficha tecnica",
];

const TITULO_DA_CATEGORIA = ["categoria", "tipo", "secao", "grupo", "familia"];
const TITULO_DO_RENDIMENTO = ["rendimento", "porcoes", "numero de porcoes", "rende"];
const TITULO_DA_PORCAO = ["porcao", "peso da porcao", "gramatura da porcao", "porcao em gramas"];

/**
 * O CABEÇALHO DO PRATO, QUANDO A PLANILHA TROUXE UM.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE SÓ PROCURA EM DUAS COLUNAS, E NÃO NA PLANILHA TODA       │
 * │                                                                      │
 * │ Uma planilha de ficha costuma trazer o nome do prato assim:             │
 * │                                                                      │
 * │   A1: FICHA TÉCNICA       B1: BOLO DE CENOURA                          │
 * │   A2: Rendimento          B2: 12                                       │
 * │                                                                      │
 * │ O rótulo fica na coluna A e o valor ao lado, na B. Procurar o valor na  │
 * │ planilha inteira faria "Rendimento" casar com a primeira célula que     │
 * │ contivesse a palavra — inclusive uma coluna de observações no fim da    │
 * │ tabela, trinta linhas abaixo.                                          │
 * │                                                                      │
 * │ Por isso a busca é pela ESTRUTURA: o rótulo na coluna A, o valor na     │
 * │ célula seguinte da mesma linha. É a forma que o dado tem, e não um       │
 * │ palpite sobre onde ele costuma estar.                                   │
 * │                                                                      │
 * │ Quando não há rótulo, o título fica ausente — e ausência é a resposta    │
 * │ honesta: a planilha não disse o nome do prato.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function acharCabecalhoDoPrato(
  linhas: readonly (readonly unknown[])[],
  limite: number
): CabecalhoExtraido {
  const vazio: CabecalhoExtraido = {
    titulo: null,
    categoria: null,
    rendimento: null,
    porcaoGramas: null,
  };

  const campo = (valor: string | null): { texto: string; pagina: number | null } | null =>
    valor === null ? null : { texto: valor, pagina: null };

  const fim = Math.min(limite, linhas.length);
  let titulo: { texto: string; pagina: number | null } | null = null;
  let categoria: { texto: string; pagina: number | null } | null = null;
  let rendimento: { texto: string; pagina: number | null } | null = null;
  let porcaoGramas: { texto: string; pagina: number | null } | null = null;

  for (let i = 0; i < fim; i++) {
    const linha = linhas[i];
    if (!linha) continue;

    for (let c = 0; c + 1 < linha.length; c++) {
      const rotulo = normalizarCabecalho(textoDeCelula(linha[c]) ?? "");
      if (rotulo === "") continue;

      const seguinte = textoDeCelula(linha[c + 1]);

      if (titulo === null && TITULO_DO_PRATO.some((t) => rotulo.includes(t)) && seguinte !== null) {
        titulo = campo(seguinte);
        continue;
      }
      if (categoria === null && TITULO_DA_CATEGORIA.some((t) => rotulo === t) && seguinte !== null) {
        categoria = campo(seguinte);
        continue;
      }
      if (rendimento === null && TITULO_DO_RENDIMENTO.some((t) => rotulo.includes(t)) && seguinte !== null) {
        rendimento = campo(seguinte);
        continue;
      }
      if (porcaoGramas === null && TITULO_DA_PORCAO.some((t) => rotulo.includes(t)) && seguinte !== null) {
        porcaoGramas = campo(seguinte);
      }
    }
  }

  // Nada reconhecido: devolver o objeto vazio é dizer "não havia cabeçalho", e
  // é diferente de devolver campos com string vazia, que passariam por dado.
  if (titulo === null && categoria === null && rendimento === null && porcaoGramas === null) {
    return vazio;
  }
  return { titulo, categoria, rendimento, porcaoGramas };
}

/* ------------------------------------------------------------------------ */
/* A largura da tabela                                                       */
/* ------------------------------------------------------------------------ */

/** A largura usada para o mapa: a maior linha que não seja um rodapé de texto. */
export function larguraDaTabela(linhas: readonly (readonly unknown[])[]): number {
  let largura = 0;
  for (const linha of linhas) {
    if (linha && linha.length > largura) largura = linha.length;
  }
  return largura;
}

/**
 * A UNIDADE CANÔNICA DA PRIMEIRA LINHA, para a conferência poder sugerir.
 *
 * Existe porque a planilha costuma ser coerente: se a primeira quantidade
 * está em quilo, as outras provavelmente também estão. Ela não é usada para
 * CONVERTER nada — só para a conferência poder dizer de qual unidade se
 * estava falando. Converter seria inventar, e é o que o briefing proíbe.
 */
export function unidadePredominante(linhas: readonly LinhaExtraida[]): string | null {
  for (const linha of linhas) {
    if (linha.quantidade === null) continue;
    const lido = normalizarQuantidade(linha.quantidade.texto);
    if (lido.estado === "OK" && lido.valor.unidade !== null) return lido.valor.unidade;
  }
  return null;
}

/* ------------------------------------------------------------------------ */
/* A aba inteira vira o documento da importação                              */
/* ------------------------------------------------------------------------ */

/**
 * O NOME DE UM DOCUMENTO LIDO DE DENTRO DE UMA ABA.
 *
 * Ele aparece na tela, é gravado no `DocumentoExtraido.leitor` e é o que
 * responde "de onde veio este dado?". Por isso diz as três coisas que ela
 * precisa saber para abrir o arquivo e conferir: que a leitura foi feita de
 * uma aba, QUAL aba, e quantas existem no arquivo.
 *
 * "Aba 1 de 3" sozinho obrigaria ela a contar as abas do lado esquerdo do
 * Excel para descobrir de qual se está falando. Com o nome, ela acha.
 */
export function nomeDaAba(aba: string, indice: number, total: number): string {
  return `Aba "${aba}" (aba ${indice} de ${total})`;
}

/** Uma aba, do jeito que o leitor de servidor a entrega para a escolha. */
export type AbaLida = {
  readonly nome: string;
  readonly linhas: readonly (readonly unknown[])[];
};

/**
 * QUAL ABA É A DA TABELA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO É SIMPLESMENTE "A PRIMEIRA"                              │
 * │                                                                      │
 * │ Um arquivo de ficha quase nunca começa pela tabela. Ele começa pela    │
 * │ capa: o nome da consultoria, o nome do cliente, a data. Às vezes uma   │
 * │ aba "Instruções". Ler a primeira aba de um arquivo desses devolveria   │
 * │ zero ingredientes — e a conferência diria que a planilha está vazia    │
 * │ quando ela está cheia, três abas adiante.                              │
 * │                                                                      │
 * │ Por isso a escolha é pela CONTAGEM DE LINHAS COM CONTEÚDO. É a medida  │
 * │ mais grosseira possível, e é de propósito: qualquer coisa mais        │
 * │ esperta — "a aba que tem a palavra Ingrediente" — erraria no arquivo   │
 * │ que escreve "Insumo", e aí a escolha seria pior que a contagem.        │
 * │                                                                      │
 * │ O empate fica com a PRIMEIRA. Duas abas com o mesmo número de linhas   │
 * │ é o caso de um arquivo com a tabela duplicada, e aí a ordem do arquivo │
 * │ é a resposta certa — é a que ela veria ao abrir o Excel.              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function escolherAba(abas: readonly AbaLida[]): number {
  let melhor = 0;
  let melhorContagem = -1;

  for (let i = 0; i < abas.length; i++) {
    const linhas = abas[i]?.linhas ?? [];
    let contagem = 0;

    for (const linha of linhas) {
      /*
        Uma linha só conta se tiver ALGUMA célula com texto depois do
        `textoDeCelula` — que é quem sabe transformar número, data e rich
        text em texto. Contar células cruas faria uma aba formatada com
        bordas até a coluna Z parecer cheia.
      */
      const temConteudo = linha.some((c) => textoDeCelula(c) !== null);
      if (temConteudo) contagem++;
    }

    if (contagem > melhorContagem) {
      melhorContagem = contagem;
      melhor = i;
    }
  }

  return melhor;
}

/**
 * O QUE UMA ABA VIRA: UM DOCUMENTO EXTRAÍDO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA FUNÇÃO É A PEÇA QUE FAZ A ESTEIRA SER UMA SÓ            │
 * │                                                                      │
 * │ Ela recebe o conteúdo de uma aba como uma matriz de células e devolve  │
 * │ exatamente a mesma coisa que o leitor de PDF devolveria: um            │
 * │ `DocumentoExtraido` com cabeçalho, linhas e texto bruto.               │
 * │                                                                      │
 * │ Isso é o que permite a conferência não saber de onde o dado veio. Ela  │
 * │ recebe um documento, e um documento de planilha tem a mesma forma de   │
 * │ um documento de PDF — porque a forma é a da CONFERÊNCIA, e não a do    │
 * │ arquivo.                                                              │
 * │                                                                      │
 * │ O leitor de servidor que faz a chamada só tem uma tarefa: trazer a     │
 * │ matriz de células do ExcelJS até aqui. Toda a decisão de leitura —     │
 * │ qual linha é cabeçalho, qual coluna é quantidade, o que fazer com a    │
 * │ unidade — mora neste arquivo, que é PURO e roda sem ExcelJS, sem       │
 * │ servidor e sem navegador.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CABEÇALHO DO PRATO É PROCURADO ANTES, E SÓ NAS PRIMEIRAS LINHAS    │
 * │                                                                      │
 * │ Uma ficha em planilha começa com "FICHA TÉCNICA / BOLO" e "Rendimento  │
 * │ / 12" antes da tabela. Essas linhas ficam FORA do intervalo da tabela  │
 * │ — se entrassem, virariam duas linhas de ingrediente com nome           │
 * │ "Rendimento".                                                          │
 * │                                                                      │
 * │ O limite é o número de linhas do cabeçalho do prato, e nada mais: o    │
 * │ rótulo está sempre acima da tabela, nunca no meio dela. Procurar mais  │
 * │ fundo acharia o "Rendimento" que é coluna de dado.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function documentoDaAba(
  linhas: readonly (readonly unknown[])[],
  leitor: string
): DocumentoExtraido {
  const largura = larguraDaTabela(linhas);
  const mapa = mapearColunas(linhas, largura);

  /*
    O cabeçalho do prato é procurado SÓ acima da tabela.

    `mapa.linhaDoCabecalho` é o número da linha onde o cabeçalho das colunas
    estava (ou `null`, quando a leitura foi por posição). Tudo antes dele é
    candidato a cabeçalho do prato; daí para baixo é dado.
  */
  const limiteDoPrato = mapa.linhaDoCabecalho === null ? linhas.length : mapa.linhaDoCabecalho - 1;
  const cabecalho = acharCabecalhoDoPrato(linhas, Math.max(0, limiteDoPrato));

  const linhasExtraidas = montarLinhas(linhas, mapa);

  return {
    cabecalho,
    linhas: linhasExtraidas,
    /*
      O TEXTO BRUTO É A ABA INTEIRA, CÉLULA A CÉLULA, E É DE PROPÓSITO.

      Ele existe para "o dado estava lá e o sistema não achou". Se a leitura
      estruturada perder uma linha — porque o cabeçalho não foi reconhecido,
      porque a coluna estava trocada —, é aqui que ela confere o que a aba
      dizia de verdade antes de qualquer interpretação.

      As células vazias ficam vazias: preenchê-las com marcador faria o texto
      bruto parecer mais organizado do que o arquivo é, e ele precisa ser
      fiel ao arquivo.
    */
    textoBruto: linhas.map((linha) => linha.map((c) => textoDeCelula(c) ?? "").join("\t")).join("\n"),
    /*
      PÁGINA É `null`, E AQUI ISSO NÃO É PREGUIÇA.

      Planilha não tem página — tem aba, e a aba já está no nome do leitor.
      Inventar "1" faria a conferência prometer uma localização que não
      existe, e ela iria procurar a página 1 de qual arquivo?
    */
    paginas: null,
    leitor,
  };
}
