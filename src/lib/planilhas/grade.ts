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
 *   vazia     — uma linha de grade livre, sem conteúdo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE "vazia" PRECISOU EXISTIR                                     │
 * │                                                                      │
 * │ As seis primeiras descrevem uma planilha que o sistema MONTA: cada    │
 * │ linha tem um significado, e a lista termina quando o conteúdo termina. │
 * │                                                                      │
 * │ A planilha em branco é o contrário disso. Trinta linhas de nada, e o  │
 * │ vazio é o CONTEÚDO — é onde ela vai digitar. Sem um tipo que          │
 * │ represente "linha existe e está vazia", a grade em branco teria de    │
 * │ ser uma lista de zero linhas, e a tela desenharia um retângulo vazio  │
 * │ sem linhas, sem números e sem onde clicar.                            │
 * │                                                                      │
 * │ O `altura` é a única concessão: no Excel a linha de uma ficha é mais  │
 * │ alta que a de uma grid de digitação. Ele é opcional e o padrão é a    │
 * │ linha compacta.                                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type LinhaGrade =
  | { tipo: "secao"; texto: string }
  | { tipo: "campo"; rotulo: string; valor: CelulaGrade; formato?: FormatoGrade }
  | { tipo: "cabecalho" }
  | { tipo: "dados"; celulas: Readonly<Record<string, CelulaGrade>> }
  | { tipo: "subtotal"; celulas: Readonly<Record<string, CelulaGrade>>; rotulo?: string }
  | { tipo: "total"; celulas: Readonly<Record<string, CelulaGrade>>; rotulo?: string }
  | { tipo: "texto"; texto: string; tom?: "nota" | "pendencia" }
  | { tipo: "vazia"; celulas?: Readonly<Record<string, CelulaGrade>> };

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
  /**
   * EM QUE LINHA DO ARQUIVO A PRIMEIRA LINHA DESTA FOLHA CAI.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ POR QUE A TELA PRECISA SABER ISTO                                  │
   * │                                                                    │
   * │ O escritor do Excel gasta as linhas 1 e 2 com a faixa de título e   │
   * │ a de subtítulo, e só então começa o conteúdo — na linha 3. É por    │
   * │ isso que `escreverFolha` faz `let linha = 3`.                       │
   * │                                                                    │
   * │ A grade na tela não desenha essas duas faixas: o título e o         │
   * │ subtítulo já estão na barra de cima, e repeti-los aqui gastaria     │
   * │ duas linhas de planilha com texto que ela não lê.                  │
   * │                                                                    │
   * │ A consequência, sem este campo, é que a linha 1 da tela seria a     │
   * │ linha 3 do arquivo. E aí "some a linha 12" — dito ao telefone, ou   │
   * │ escrito num bilhete — apontaria para linhas diferentes conforme     │
   * │ quem olha. Numa planilha de conferência de custo, a linha é          │
   * │ endereço, e dois endereços para a mesma linha é defeito.            │
   * │                                                                    │
   * │ O PADRÃO É 3, que é o que o escritor faz hoje para toda folha. Um   │
   * │ modelo que um dia mude a altura do próprio cabeçalho declara o      │
   * │ número aqui, e a tela acompanha sem saber por quê.                  │
   * └────────────────────────────────────────────────────────────────────┘
   */
  linhaInicial?: number;
  /**
   * A FOLHA ACEITA DIGITAÇÃO?
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ POR QUE ISTO É DECISÃO DA FOLHA, E NÃO UM PADRÃO DO SISTEMA        │
   * │                                                                    │
   * │ As folhas derivadas — ficha técnica, custos, relatório — são        │
   * │ VISTAS de dados que moram em outro lugar. O custo de um prato sai   │
   * │ de `resolverItem`; editá-lo na grade criaria um segundo caminho de  │
   * │ escrita, e um número na planilha que não corresponde a nada no      │
   * │ sistema. Nelas, `editavel` é falso, e toda célula é CALCULADA.      │
   * │                                                                    │
   * │ A planilha em branco é o oposto: não existe dado de origem nenhum.  │
   * │ Se ela não aceitar digitação, ela não serve para nada. Nela,        │
   * │ `editavel` é verdadeiro e a célula é ENTRADA.                       │
   * │                                                                    │
   * │ O padrão é falso porque o padrão precisa ser o SEGURO: uma folha    │
   * │ nova que esqueça de declarar isto nasce somente-leitura, e não      │
   * │ nasce aceitando escrita num dado que ela não governa.               │
   * └────────────────────────────────────────────────────────────────────┘
   */
  editavel?: boolean;
  /**
   * NUMA FOLHA EDITÁVEL, AS CÉLULAS QUE SÃO RESULTADO.
   *
   * Chaves no formato de endereço — `"G4"`, `"H12"`. Elas aparecem na grade
   * com o tratamento de valor calculado e NÃO recebem digitação: são a
   * resposta da conta, e uma resposta que se pode reescrever à mão deixa de
   * ser resposta.
   *
   * É o que separa, numa ficha que veio de um PDF, o que a Érika INFORMOU
   * (peso, preço — entrada) do que o sistema CALCULOU (correção, custo).
   * Sem essa separação, ou tudo vira editável — e o custo passa a poder ser
   * digitado — ou nada vira, e ela não consegue corrigir o peso que o PDF
   * trouxe errado.
   */
  calculadas?: readonly string[];
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

/**
 * A LETRA DE UMA COLUNA, A PARTIR DO NÚMERO — 1 vira "A", 27 vira "AA".
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELA MUDOU DE CASA                                        │
 * │                                                                   │
 * │ Esta função já existia em `estilos.ts`, que importa `exceljs` — é    │
 * │ arquivo de SERVIDOR. Funcionava, e tinha um defeito que só não doeu  │
 * │ ainda: a letra da coluna é uma regra do VOCABULÁRIO da planilha, não │
 * │ um detalhe do ExcelJS. O ExcelJS só precisa dela para escrever       │
 * │ `topLeftCell` à mão.                                                 │
 * │                                                                   │
 * │ Agora a TELA também precisa dela: a faixa A B C D em cima da grade é │
 * │ a mesma letra, e um componente de navegador não pode importar de     │
 * │ `estilos.ts` sem arrastar o exceljs inteiro para o bundle.           │
 * │                                                                   │
 * │ Duas cópias seria pior: no dia em que uma delas errasse a conta da   │
 * │ base 26, a grade mostraria "AB" numa coluna que o arquivo chama de   │
 * │ "AC". `estilos.ts` passa a importar daqui.                           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Funciona por decomposição em base 26 com deslocamento: a coluna 27 é "AA",
 * porque 27 = 1×26 + 1. O `- 1` antes de cada divisão corrige o fato de a
 * base começar em 1 e não em 0.
 */
export function letraDaColuna(numero: number): string {
  let n = Math.floor(numero);
  let letra = "";
  while (n > 0) {
    const resto = (n - 1) % 26;
    letra = String.fromCharCode(65 + resto) + letra;
    n = Math.floor((n - 1) / 26);
  }
  return letra || "A";
}

/**
 * O ENDEREÇO DE UMA CÉLULA — "A1", "G12".
 *
 * É o nome que qualquer pessoa que usa planilha reconhece, e é a chave com
 * que uma folha editável marca as células que são RESULTADO em vez de
 * entrada (`FolhaGrade.calculadas`).
 */
export function endereco(linha: number, coluna: number): string {
  return `${letraDaColuna(coluna)}${linha}`;
}

/** Uma linha de dados, a partir de um objeto simples. */
export function dados(celulas: Readonly<Record<string, CelulaGrade>>): LinhaGrade {
  return { tipo: "dados", celulas };
}

/** Uma linha de grade — existe, está vazia, e é onde se digita. */
export function linhasVazias(quantidade: number): LinhaGrade[] {
  return Array.from({ length: Math.max(0, Math.floor(quantidade)) }, () => ({
    tipo: "vazia" as const,
  }));
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
