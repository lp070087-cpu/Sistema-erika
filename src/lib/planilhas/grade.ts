/**
 * A GRADE — a estrutura de uma planilha, antes de virar tela ou arquivo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA CAMADA EXISTE, E POR QUE ELA NASCEU AGORA               │
 * │                                                                      │
 * │ Antes disto, o conteúdo de uma planilha existia DUAS VEZES:           │
 * │                                                                      │
 * │   · uma vez dentro do gerador, escrevendo célula no ExcelJS;          │
 * │   · outra vez na tela, montando linha de `<table>` à mão.             │
 * │                                                                      │
 * │ As duas eram mantidas em paralelo por disciplina, e disciplina falha   │
 * │ em silêncio: no dia em que uma coluna mudasse de nome no arquivo, a    │
 * │ prévia continuaria dizendo o nome antigo — e a prévia existe            │
 * │ exatamente para ser conferida antes do download. A tela passaria a      │
 * │ mentir sobre o próprio arquivo.                                        │
 * │                                                                      │
 * │ Agora existe UMA resposta para cada pergunta: `montarX(ctx)` devolve    │
 * │ a grade, e as duas pontas desenham a MESMA grade. O gerador não sabe    │
 * │ o que é React, a tela não sabe o que é ExcelJS, e nenhum dos dois       │
 * │ inventa coluna.                                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE ARQUIVO NÃO CALCULA NADA, E NÃO PODE CALCULAR                    │
 * │                                                                      │
 * │ Ele é um FORMATO: tipos, e a tradução de um valor para texto. Nenhuma  │
 * │ fórmula de custo, nenhuma soma, nenhum arredondamento de decisão. As   │
 * │ contas continuam em `@/lib/dados` — `custos`, `custos-ficha`,          │
 * │ `indicadores-comerciais` — que é onde elas foram validadas.            │
 * │                                                                      │
 * │ E ele é PURO de propósito: sem `exceljs`, sem `server-only`, sem       │
 * │ `react`. É o que permite a mesma função rodar no servidor (gerando o   │
 * │ arquivo) e no navegador (desenhando a prévia).                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE A GRADE NÃO É: UMA SEGUNDA BASE                                 │
 * │                                                                      │
 * │ Esta é a distinção que o briefing pede, e ela é fácil de perder de     │
 * │ vista quando se cria um tipo novo. Uma grade é uma REPRESENTAÇÃO:      │
 * │ ela é construída a partir do contexto, a cada geração, e jogada fora   │
 * │ depois. Nada é gravado nela, nada é editado nela, nada sobrevive a     │
 * │ ela.                                                                    │
 * │                                                                      │
 * │ Editar uma ficha continua sendo editar a ficha — na tela de ficha,     │
 * │ pelo mesmo store de sempre. A Central de Planilhas não tem um segundo   │
 * │ caminho de escrita, e não deve ganhar um.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { dataCurta, valorEmReais } from "@/lib/dados/formato";
import { numero, numeroFixo } from "@/lib/dados/numeros";

/**
 * O formato de uma coluna — e, com ele, tudo o que a coluna herda.
 *
 * É o mesmo vocabulário que o componente de grade da tela usa (`FormatoPrevia`).
 * Estão declarados nos dois lugares porque um deles é servidor e o outro é
 * navegador, e importar o tipo de um componente dentro de um modelo de arquivo
 * inverteria a direção da dependência: o modelo de planilha não pode depender
 * de `components/`.
 */
export type FormatoGrade =
  | "texto"
  | "numero"
  | "moeda"
  | "percentual"
  | "peso"
  | "data";

/** O alinhamento que cada formato pede, quando ninguém diz outra coisa. */
export const ALINHAMENTO_DO_FORMATO: Record<FormatoGrade, "esq" | "dir" | "centro"> = {
  texto: "esq",
  numero: "dir",
  moeda: "dir",
  percentual: "dir",
  peso: "dir",
  data: "centro",
};

/**
 * O formato de número do Excel para cada formato da grade.
 *
 * `undefined` significa "sem formato": texto e data crua. A data continua
 * recebendo `FORMATO_DATA` pelo gerador, porque ali o valor é `Date` e precisa
 * do `DD/MM/YYYY` para não aparecer como número de série.
 */
export const FORMATO_EXCEL: Record<FormatoGrade, string | undefined> = {
  texto: undefined,
  numero: "#,##0.00",
  moeda: '"R$" #,##0.00',
  percentual: '0.0"%"',
  peso: "#,##0.000",
  data: "DD/MM/YYYY",
};

/** Uma coluna da grade. */
export type ColunaGrade = {
  chave: string;
  titulo: string;
  formato: FormatoGrade;
  /**
   * Largura da coluna no Excel, em "caracteres da fonte padrão".
   *
   * Não se confunde com a largura em pixels da tela: o Excel mede em
   * caracteres e o navegador mede em pixels, e converter um no outro seria
   * chutar. São duas medidas do mesmo campo, cada uma na unidade do seu
   * material — por isso são dois campos declarados lado a lado, e não um.
   */
  largura: number;
  /** Largura mínima da coluna na tela, em pixels. */
  larguraMinima?: number;
};

/** O que uma célula pode guardar. `null` é ausência de dado, nunca zero. */
export type CelulaGrade = string | number | Date | null;

/**
 * UMA LINHA DA GRADE.
 *
 * São seis tipos, e nenhum deles é decorativo — cada um resolve um problema
 * que a planilha de trabalho tem e o componente de grade também precisa
 * resolver:
 *
 *   secao     — a faixa que separa blocos ("INGREDIENTES", "O CLIENTE"). Sem
 *               ela, a grade é uma parede de linhas sem começo nem fim.
 *   campo     — um par rótulo/valor. É o formato do resumo: sete fatos
 *               diferentes sobre um cliente não viram uma tabela honesta.
 *   cabecalho — um cabeçalho de tabela NO MEIO da folha. Existe porque uma
 *               folha pode ter mais de uma tabela (o resumo tem a jornada
 *               depois dos campos), e o Excel já faz isso naturalmente.
 *   dados     — a linha comum.
 *   subtotal  — fecha um bloco sem ser o total da folha.
 *   total     — o TOTAL.
 *   texto     — nota de rodapé ou pendência, atravessando as colunas.
 */
export type LinhaGrade =
  | { tipo: "secao"; texto: string }
  | { tipo: "campo"; rotulo: string; valor: CelulaGrade; formato?: FormatoGrade }
  | { tipo: "cabecalho" }
  | { tipo: "dados"; celulas: Readonly<Record<string, CelulaGrade>> }
  | { tipo: "subtotal"; celulas: Readonly<Record<string, CelulaGrade>>; rotulo?: string }
  | { tipo: "total"; celulas: Readonly<Record<string, CelulaGrade>>; rotulo?: string }
  | { tipo: "texto"; texto: string; tom?: "nota" | "pendencia" };

/** Uma folha — o que o Excel chama de aba, e o que a tela chama de aba. */
export type FolhaGrade = {
  /** O nome curto, que vira o nome da aba no Excel. Máximo 31 caracteres. */
  nome: string;
  /** O título que atravessa o topo da folha. */
  titulo: string;
  colunas: readonly ColunaGrade[];
  linhas: readonly LinhaGrade[];
  /**
   * Quantas linhas ficam congeladas ao rolar.
   *
   * Conta as linhas FÍSICAS do topo da folha — título e subtítulo — que o
   * gerador escreve antes do conteúdo. É o mesmo número que o `congelar()` do
   * ExcelJS recebe.
   */
  congelarLinhas: number;
  /** Quantas colunas ficam congeladas. Usado só onde melhora a leitura. */
  congelarColunas?: number;
  /**
   * A folha mostra a linha de títulos das colunas no topo?
   *
   * `false` para as folhas que não são tabela — o resumo e as informações. No
   * Excel a diferença não existe (as letras das colunas estão sempre lá); na
   * tela, uma linha de cabeçalho vazia seria só espaço perdido.
   */
  mostrarCabecalho: boolean;
  /** A nota do rodapé, com a origem do arquivo. */
  assinatura: string;
};

/** O que um modelo devolve: o arquivo inteiro descrito em dados. */
export type GradeDaPlanilha = {
  /** O título que aparece na primeira faixa de toda folha. */
  titulo: string;
  /** A segunda linha: de quem é a planilha e quando saiu. Igual em todas as abas. */
  subtitulo: string;
  folhas: readonly FolhaGrade[];
};

// ---------------------------------------------------------------------------
// A tradução de um valor para texto
// ---------------------------------------------------------------------------

/**
 * COMO UM VALOR DA GRADE VIRA TEXTO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UMA FUNÇÃO, E NÃO UM `String(valor)`                  │
 * │                                                                      │
 * │ No Excel o valor viaja cru: `1234.5` é gravado como número, com o     │
 * │ formato de moeda aplicado por cima, e a célula continua somando. Na    │
 * │ tela não existe isso — o que se lê é texto. Se cada ponta formatasse    │
 * │ por conta própria, o arquivo diria "R$ 1.234,50" e a tela diria         │
 * │ "1234.5", e as duas estariam "certas".                                 │
 * │                                                                      │
 * │ Aqui a conversão é uma só, e a mesma que `@/lib/dados/formato` já usa   │
 * │ em todo o sistema: vírgula decimal, ponto de milhar, "R$" na frente,    │
 * │ data em dia/mês/ano.                                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O TRAÇO É A AUSÊNCIA. `null` não vira "0" nem "0,00" — vira "—". É a regra
 * que governa o sistema inteiro, e a que mais importa numa planilha de custo:
 * um custo que ninguém informou não pode parecer um custo que é zero.
 */
export function textoDaCelula(valor: CelulaGrade, formato: FormatoGrade): string {
  if (valor === null || valor === undefined) return "—";
  if (valor instanceof Date) return dataCurta(valor);

  switch (formato) {
    case "moeda":
      return typeof valor === "number" ? valorEmReais(valor) : String(valor);
    case "percentual":
      return typeof valor === "number" ? `${numeroFixo(valor, 1)}%` : String(valor);
    case "peso":
      return typeof valor === "number" ? numeroFixo(valor, 3) : String(valor);
    case "numero":
      return typeof valor === "number" ? numero(valor, 2) : String(valor);
    case "data":
      return typeof valor === "number" ? dataCurta(new Date(valor)) : String(valor);
    case "texto":
      return String(valor);
  }
}

/**
 * O valor de uma célula, com traço no lugar de ausência.
 *
 * Existe para a tela e para a grade de dados: onde o Excel simplesmente não
 * tem valor (célula vazia), a tela precisa mostrar que aquilo é uma ausência
 * e não um espaço em branco que a renderização esqueceu.
 */
export function valorOuTraco(valor: CelulaGrade): CelulaGrade {
  return valor === undefined ? null : valor;
}

// ---------------------------------------------------------------------------
// Auxiliares de montagem — usados pelos modelos
// ---------------------------------------------------------------------------

/** Uma linha de dados, a partir de um objeto simples. */
export function dados(celulas: Readonly<Record<string, CelulaGrade>>): LinhaGrade {
  return { tipo: "dados", celulas };
}

/** Um par rótulo/valor. */
export function campo(
  rotulo: string,
  valor: CelulaGrade,
  formato?: FormatoGrade
): LinhaGrade {
  return { tipo: "campo", rotulo, valor, formato };
}

/** Uma faixa de bloco. */
export function secao(texto: string): LinhaGrade {
  return { tipo: "secao", texto };
}

/** Uma nota de rodapé — o que explica, e não avisa. */
export function nota(texto: string): LinhaGrade {
  return { tipo: "texto", texto, tom: "nota" };
}

/** Um aviso do que trava — o que ainda depende de uma decisão dela. */
export function pendencia(texto: string): LinhaGrade {
  return { tipo: "texto", texto, tom: "pendencia" };
}

/**
 * Uma largura de coluna em pixels, a partir da largura do Excel.
 *
 * Serve para o caso comum em que ninguém quer pensar em duas medidas. A conta
 * é a aproximação usual (7 px por caractere, mais o respiro da célula) e é
 * deliberadamente grosseira: ela não é uma conversão, é um PONTO DE PARTIDA
 * que o navegador ajusta sozinho, já que a grade cresce com o conteúdo.
 */
export function pixels(larguraExcel: number): number {
  return Math.round(larguraExcel * 7 + 16);
}
