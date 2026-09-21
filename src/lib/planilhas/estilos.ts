/**
 * ESTILOS DAS PLANILHAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A MESMA IDENTIDADE, EM OUTRO MATERIAL                                │
 * │                                                                      │
 * │ A paleta vem do site e do sistema: verde profundo, creme, oliva,      │
 * │ dourado. Mas planilha não é tela, e três coisas mudam:                │
 * │                                                                      │
 * │ 1. A COR É SÓLIDA. Não existe transparência em célula do Excel —     │
 * │    "fundo levemente translúcido" vira uma cor chapada escolhida à mão.│
 * │    Por isso cada tom aqui é o resultado da mistura já resolvido, não   │
 * │    o valor da tela.                                                   │
 * │                                                                      │
 * │ 2. O CONTRASTE É MAIOR. Planilha é impressa, fotografada, aberta em   │
 * │    celular. O creme da tela (#F2ECE2) some no papel branco; o que      │
 * │    sobrevive é a faixa de cabeçalho com fundo escuro e texto claro.    │
 * │                                                                      │
 * │ 3. A DECORAÇÃO É MENOR. Sem borda em toda célula, sem sombra, sem      │
 * │    gradiente. Uma planilha bonita demais é difícil de ler — e esta     │
 * │    vai ser lida por quem precisa conferir número, não admirá-la.       │
 * │                                                                      │
 * │ O que se mantém igual à tela: caixa alta no cabeçalho, hierarquia      │
 * │ clara, e o mesmo verde em toda parte. Quem recebe a planilha reconhece  │
 * │ de quem ela veio antes de ler o título.                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { Style, Worksheet } from "exceljs";
import { letraDaColuna } from "./grade";

/**
 * A PALETA.
 *
 * ARGB com alfa cheio (`FF`) em toda cor. O Excel aceita `RRGGBB`, e o
 * exceljs aceita os dois — mas usar sempre o mesmo formato evita a confusão
 * silenciosa em que uma cor só funciona em uma das duas bibliotecas de
 * leitura. `FF` na frente é redundante e é o preço de não ter surpresa.
 */
export const COR = {
  /** Verde profundo da marca. Faixa de título e cabeçalho de tabela. */
  profundo: "FF0E1A14",
  /** Verde médio. Subtítulo e cabeçalho de segunda ordem. */
  medio: "FF1D5236",
  /** Oliva. Acento e linha de destaque. */
  oliva: "FF6B7A46",
  /** Oliva pálido. Fundo de faixa alternada e de bloco de apoio. */
  olivaPalha: "FFE8E9DD",
  /** Dourado. Acento de atenção — usado com parcimônia. */
  dourado: "FFC9A54E",
  /** Creme. Fundo de bloco de destaque suave. */
  creme: "FFF2ECE2",
  /** Branco, para fundo de célula comum quando a faixa alternada não usa creme. */
  branco: "FFFFFFFF",
  /** Tinta principal. Texto sobre fundo claro. */
  tinta: "FF0E1A14",
  /** Tinta suave. Texto secundário. */
  tintaSuave: "FF4A5A50",
  /** Cinza-esverdeado claro. Borda de tabela. */
  linha: "FFD6D9CE",
  /** Vermelho fechado. Atraso e pendência. O mesmo tom da tela. */
  critico: "FF991B1B",
} as const;

/**
 * Formato de moeda do Excel.
 *
 * `R$ #,##0.00` e não `"R$" #,##0.00` porque o separador de milhar e o
 * decimal seguem a configuração regional de quem abre o arquivo — o que é o
 * comportamento certo: a Érika abre em português e vê vírgula decimal; se o
 * contador dela abrir em outro idioma, vê o separador do idioma dele, com o
 * mesmo número.
 */
export const FORMATO_MOEDA = '"R$" #,##0.00';
export const FORMATO_MOEDA_SEM_CENTAVOS = '"R$" #,##0';
export const FORMATO_DATA = "DD/MM/YYYY";
export const FORMATO_NUMERO = "#,##0";
export const FORMATO_PESO = '#,##0.000 "kg"';
export const FORMATO_PORCAO = '#,##0 "g"';

/** Estilo da faixa de título — a primeira linha da aba. */
export const ESTILO_TITULO: Partial<Style> = {
  font: { name: "Calibri", size: 16, bold: true, color: { argb: COR.branco } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: COR.profundo } },
  alignment: { vertical: "middle", horizontal: "left", indent: 1 },
};

/** Estilo do subtítulo — a segunda linha, com o cliente e a data. */
export const ESTILO_SUBTITULO: Partial<Style> = {
  font: { name: "Calibri", size: 10, color: { argb: COR.tintaSuave } },
  alignment: { vertical: "middle", horizontal: "left", indent: 1 },
};

/** Estilo do cabeçalho de uma tabela dentro da aba. */
export const ESTILO_CABECALHO: Partial<Style> = {
  font: { name: "Calibri", size: 10, bold: true, color: { argb: COR.branco } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: COR.medio } },
  alignment: { vertical: "middle", horizontal: "left", wrapText: true },
  border: {
    bottom: { style: "thin", color: { argb: COR.profundo } },
  },
};

/**
 * A FAIXA DE NOMES DO TOPO DE UMA FICHA — um nome por coluna.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELA NÃO USA O MESMO VERDE DO CABEÇALHO DA TABELA             │
 * │                                                                      │
 * │ Logo abaixo desta faixa vem o cabeçalho da grade de ingredientes —     │
 * │ "INGREDIENTE / PESO LÍQ / PREÇO KG / …". Se os dois tivessem o mesmo    │
 * │ fundo, as duas barras se leriam como uma só, e os nomes de cima         │
 * │ pareceriam pertencer à tabela de baixo.                                │
 * │                                                                      │
 * │ Elas não pertencem: a de cima nomeia o RESUMO da ficha — rendimento,    │
 * │ custo total, custo por porção — e a de baixo nomeia as COLUNAS dos      │
 * │ insumos. É a diferença entre o que a receita é e o que cada linha da    │
 * │ receita é. Duas barras, dois assuntos.                                 │
 * │                                                                      │
 * │ O verde mais escuro da paleta resolve isso sem precisar de borda nem   │
 * │ de espaço em branco: a faixa de cima pesa mais, e por isso se lê        │
 * │ primeiro — que é a ordem em que se lê uma ficha técnica.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const ESTILO_FAIXA_NOMES: Partial<Style> = {
  font: { name: "Calibri", size: 8, bold: true, color: { argb: COR.branco } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: COR.profundo } },
  alignment: { vertical: "middle", horizontal: "center", wrapText: true },
  border: {
    right: { style: "hair", color: { argb: COR.medio } },
    bottom: { style: "thin", color: { argb: COR.medio } },
  },
};

/** Rótulo de bloco — "RESUMO", "TAREFAS". Caixa alta sobre faixa clara. */
export const ESTILO_ROTULO_BLOCO: Partial<Style> = {
  font: { name: "Calibri", size: 10, bold: true, color: { argb: COR.profundo } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: COR.olivaPalha } },
  alignment: { vertical: "middle", horizontal: "left", indent: 1 },
};

/** Nome do campo, à esquerda de um par rótulo/valor. */
export const ESTILO_CAMPO_ROTULO: Partial<Style> = {
  font: { name: "Calibri", size: 10, bold: true, color: { argb: COR.tintaSuave } },
  alignment: { vertical: "top", horizontal: "left" },
};

/** Valor do campo. */
export const ESTILO_CAMPO_VALOR: Partial<Style> = {
  font: { name: "Calibri", size: 10, color: { argb: COR.tinta } },
  alignment: { vertical: "top", horizontal: "left", wrapText: true },
};

/** Texto corrido, para observação e resumo. */
export const ESTILO_TEXTO: Partial<Style> = {
  font: { name: "Calibri", size: 10, color: { argb: COR.tinta } },
  alignment: { vertical: "top", horizontal: "left", wrapText: true },
};

/** Observação de rodapé — a nota que diz o que a planilha não calcula. */
export const ESTILO_NOTA: Partial<Style> = {
  font: { name: "Calibri", size: 9, italic: true, color: { argb: COR.tintaSuave } },
  alignment: { vertical: "top", horizontal: "left", wrapText: true },
};

/** Aviso de pendência — o que ainda depende de decisão. */
export const ESTILO_PENDENCIA: Partial<Style> = {
  font: { name: "Calibri", size: 10, bold: true, color: { argb: COR.critico } },
  alignment: { vertical: "top", horizontal: "left", wrapText: true },
};

/** Célula de dado comum, com borda inferior discreta. */
export const ESTILO_CELULA: Partial<Style> = {
  font: { name: "Calibri", size: 10, color: { argb: COR.tinta } },
  alignment: { vertical: "top", horizontal: "left", wrapText: true },
  border: {
    bottom: { style: "hair", color: { argb: COR.linha } },
  },
};

/** Célula de dado alinhada à direita — números e valores. */
export const ESTILO_CELULA_NUMERO: Partial<Style> = {
  ...ESTILO_CELULA,
  alignment: { vertical: "top", horizontal: "right", wrapText: false },
};

/** Faixa alternada, para leitura de linha longa. */
export const ESTILO_CELULA_FAIXA: Partial<Style> = {
  ...ESTILO_CELULA,
  fill: {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF7F6F1" },
  },
};

/**
 * A LINHA DE SUBTOTAL — fecha um bloco sem ser o total da folha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE SUBTOTAL E TOTAL NÃO PODEM TER A MESMA CARA                 │
 * │                                                                      │
 * │ Uma ficha técnica tem, no mínimo, dois fechamentos: o custo dos itens │
 * │ e o custo total da receita. Se os dois tivessem o mesmo peso visual,   │
 * │ quem lê a planilha impressa não saberia qual número citar — e citar o  │
 * │ subtotal como se fosse o custo da receita é um erro de leitura que     │
 * │ custa dinheiro.                                                       │
 * │                                                                      │
 * │ Por isso o subtotal é claro (fundo oliva pálido, texto escuro) e o     │
 * │ total é escuro (fundo verde médio, texto branco). A diferença se lê à  │
 * │ distância, e sobrevive à impressão em preto e branco, onde o fundo     │
 * │ claro vira branco e o escuro vira preto.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const ESTILO_SUBTOTAL: Partial<Style> = {
  font: { name: "Calibri", size: 10, bold: true, color: { argb: COR.profundo } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: COR.olivaPalha } },
  alignment: { vertical: "middle", horizontal: "left" },
  border: {
    top: { style: "thin", color: { argb: COR.linha } },
    bottom: { style: "hair", color: { argb: COR.linha } },
  },
};

/** A linha de TOTAL — o fechamento da folha. O peso visual mais forte. */
export const ESTILO_TOTAL: Partial<Style> = {
  font: { name: "Calibri", size: 11, bold: true, color: { argb: COR.branco } },
  fill: { type: "pattern", pattern: "solid", fgColor: { argb: COR.medio } },
  alignment: { vertical: "middle", horizontal: "left" },
  border: {
    top: { style: "medium", color: { argb: COR.profundo } },
  },
};

/**
 * Formato de percentual do Excel.
 *
 * O `%` está ENTRE ASPAS, o que faz dele texto literal em vez de operador.
 * Sem as aspas, o Excel multiplicaria o valor por cem na exibição — e
 * "42,9" apareceria como "4.290,0%". É o tipo de erro que passa despercebido
 * porque o número continua parecendo um número.
 */
export const FORMATO_PERCENTUAL = '0.0"%"';

/**
 * As larguras de coluna de uma aba.
 *
 * Excel mede largura em "caracteres da fonte padrão", e não em pixels. O
 * valor certo não se calcula: se olha. Por isso o mapa está aqui, nomeado,
 * em vez de espalhado em números soltos dentro de cada gerador — quando uma
 * coluna ficar apertada, é esta lista que muda.
 */
export const LARGURA = {
  estreita: 12,
  media: 20,
  larga: 32,
  muitoLarga: 52,
  /** Coluna de texto corrido — descrição, resumo, observação. */
  texto: 64,
} as const;

/**
 * Aplica a faixa de título e subtítulo no topo de uma aba.
 *
 * Devolve a linha em que o conteúdo pode começar, para que o gerador não
 * precise manter essa conta. Uma função que devolve "onde você continua" é
 * mais difícil de errar do que três geradores calculando `linha + 2`.
 */
export function aplicarCabecalho(
  aba: Worksheet,
  titulo: string,
  subtitulo: string,
  totalColunas: number
): number {
  aba.mergeCells(1, 1, 1, totalColunas);
  const tituloCell = aba.getCell(1, 1);
  tituloCell.value = titulo;
  tituloCell.style = ESTILO_TITULO;
  aba.getRow(1).height = 30;

  aba.mergeCells(2, 1, 2, totalColunas);
  const subCell = aba.getCell(2, 1);
  subCell.value = subtitulo;
  subCell.style = ESTILO_SUBTITULO;
  aba.getRow(2).height = 18;

  return 4;
}

/**
 * Escreve um rótulo de bloco e devolve a linha seguinte.
 *
 * O rótulo ocupa a largura toda da aba — a faixa clara atravessa a tabela,
 * o que cria a separação entre blocos sem precisar de linha em branco. Uma
 * planilha com blocos separados por linha vazia perde a faixa ao rolar; com
 * faixa colorida, cada bloco continua legível no meio da rolagem.
 */
export function escreverRotuloBloco(
  aba: Worksheet,
  linha: number,
  texto: string,
  totalColunas: number
): number {
  aba.mergeCells(linha, 1, linha, totalColunas);
  const cell = aba.getCell(linha, 1);
  cell.value = texto;
  cell.style = ESTILO_ROTULO_BLOCO;
  aba.getRow(linha).height = 22;
  return linha + 1;
}

/** Escreve um par rótulo/valor em duas colunas. Devolve a linha seguinte. */
export function escreverCampo(
  aba: Worksheet,
  linha: number,
  rotulo: string,
  valor: string | number | Date | null,
  formatoValor?: string
): number {
  const rotuloCell = aba.getCell(linha, 1);
  rotuloCell.value = rotulo;
  rotuloCell.style = ESTILO_CAMPO_ROTULO;

  const valorCell = aba.getCell(linha, 2);
  valorCell.value = valor ?? "—";
  valorCell.style = { ...ESTILO_CAMPO_VALOR, numFmt: formatoValor };

  return linha + 1;
}

/**
 * Escreve uma tabela com cabeçalho, faixa alternada e filtro.
 *
 * `autoFilter` na linha de cabeçalho é o que faz a planilha ser útil de
 * verdade: sem ele, ordenar por cliente significa selecionar o intervalo à
 * mão. Com ele, é um clique — e é o que separa "planilha organizada" de
 * "planilha bonita".
 */
export function escreverTabela<T>(
  aba: Worksheet,
  linhaInicio: number,
  colunas: ReadonlyArray<{
    titulo: string;
    largura: number;
    valor: (item: T) => string | number | Date | null;
    formato?: string;
    alinhamento?: "esq" | "dir";
  }>,
  itens: readonly T[]
): number {
  const linhaCabecalho = linhaInicio;

  colunas.forEach((col, i) => {
    const cell = aba.getCell(linhaCabecalho, i + 1);
    cell.value = col.titulo;
    cell.style = ESTILO_CABECALHO;
    aba.getColumn(i + 1).width = col.largura;
  });
  aba.getRow(linhaCabecalho).height = 20;

  itens.forEach((item, idx) => {
    const linha = linhaCabecalho + 1 + idx;
    colunas.forEach((col, i) => {
      const cell = aba.getCell(linha, i + 1);
      cell.value = col.valor(item);
      const base =
        col.alinhamento === "dir"
          ? ESTILO_CELULA_NUMERO
          : idx % 2 === 1
            ? ESTILO_CELULA_FAIXA
            : ESTILO_CELULA;
      cell.style = col.formato ? { ...base, numFmt: col.formato } : base;
    });
  });

  // O filtro cobre exatamente o intervalo da tabela. Sem `+1` no fim: o
  // filtro vai do cabeçalho à última linha de dado, e incluir a linha
  // seguinte faria o Excel oferecer "(Vazias)" na lista de opções.
  if (itens.length > 0) {
    aba.autoFilter = {
      from: { row: linhaCabecalho, column: 1 },
      to: { row: linhaCabecalho + itens.length, column: colunas.length },
    };
  }

  return linhaCabecalho + itens.length + 2;
}

/**
 * Congela o cabeçalho.
 *
 * `ySplit` é quantas linhas ficam fixas ao rolar. A faixa de título e o
 * cabeçalho da tabela ficam congelados juntos, para que ao descer numa lista
 * de trinta tarefas a pessoa continue sabendo o que cada coluna é.
 */
export function congelar(aba: Worksheet, linhas: number, colunas = 0): void {
  aba.views = [
    {
      state: "frozen",
      xSplit: colunas,
      ySplit: linhas,
      topLeftCell: `${letraDaColuna(colunas + 1)}${linhas + 1}`,
      activeCell: `${letraDaColuna(colunas + 1)}${linhas + 1}`,
    },
  ];
}

/**
 * A letra de uma coluna — RE-EXPORTADA de `grade.ts`, não reescrita aqui.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A IMPLEMENTAÇÃO SAIU DAQUI                                   │
 * │                                                                      │
 * │ Ela nasceu neste arquivo, quando o único consumidor era o             │
 * │ `topLeftCell` do painel congelado. Fazia sentido pelo motivo certo —  │
 * │ nove linhas contra uma dependência a mais — e deixou de fazer quando  │
 * │ a TELA passou a precisar da mesma letra para desenhar a faixa         │
 * │ A B C D em cima da grade.                                            │
 * │                                                                      │
 * │ Um componente de navegador não pode importar daqui: este arquivo      │
 * │ carrega `exceljs`, e importar dele arrastaria a biblioteca inteira    │
 * │ para o bundle do cliente. A função é regra da GRADE, não do Excel.    │
 * │                                                                      │
 * │ A implementação mora em `grade.ts`, que é puro, e é re-exportada      │
 * │ aqui para os geradores continuarem chamando pelo nome de sempre.      │
 * │ Duas cópias divergiriam — e a que divergisse mostraria, na tela, uma  │
 * │ coluna com nome diferente do que o arquivo chama.                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export { letraDaColuna as letraColuna };

/** Assinatura do arquivo, no rodapé de cada aba. */
export function escreverAssinatura(
  aba: Worksheet,
  linha: number,
  totalColunas: number,
  nota: string
): void {
  aba.mergeCells(linha, 1, linha, totalColunas);
  const cell = aba.getCell(linha, 1);
  cell.value = nota;
  cell.style = ESTILO_NOTA;
}
