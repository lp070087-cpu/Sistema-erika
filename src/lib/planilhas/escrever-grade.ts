/**
 * A GRADE VIRA ARQUIVO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO SUBSTITUIU QUATRO ESCRITORES                    │
 * │                                                                      │
 * │ Antes, cada modelo tinha o seu próprio conjunto de funções de escrita  │
 * │ — `escreverResumo`, `escreverTarefas`, `escreverAcompanhamentos`,      │
 * │ cada uma sabendo escrever rótulo de bloco, mesclar célula, estimar     │
 * │ altura de linha. Três modelos novos seriam doze funções parecidas, e   │
 * │ a terceira cópia já teria perdido o ajuste de altura.                  │
 * │                                                                      │
 * │ Agora existe UM escritor, e ele não sabe o que é tarefa, ficha ou      │
 * │ custo. Ele sabe percorrer uma grade. Os modelos deixaram de escrever   │
 * │ célula e passaram a DESCREVER folha — que é uma tarefa bem menor e     │
 * │ muito mais difícil de errar.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO NÃO FAZ                                           │
 * │                                                                      │
 * │ Não calcula. Não decide coluna. Não conhece domínio. Ele recebe uma   │
 * │ `GradeDaPlanilha` — que já é o resultado de todo o trabalho de        │
 * │ domínio — e a deposita no ExcelJS.                                    │
 * │                                                                      │
 * │ `server-only` no topo: é o exceljs entrando em cena, e a trava é a    │
 * │ mesma de sempre — nenhum componente cliente pode importar daqui. A    │
 * │ tela lê a grade por `./grade`, que é puro.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import "server-only";
import type { Style, Workbook, Worksheet } from "exceljs";
import type { CelulaGrade, FolhaGrade, GradeDaPlanilha, LinhaGrade } from "./grade";
import { ALINHAMENTO_DO_FORMATO, FORMATO_EXCEL } from "./grade";
import {
  COR,
  ESTILO_CABECALHO,
  ESTILO_CELULA,
  ESTILO_CELULA_FAIXA,
  ESTILO_NOTA,
  ESTILO_PENDENCIA,
  ESTILO_ROTULO_BLOCO,
  ESTILO_SUBTOTAL,
  ESTILO_TEXTO,
  ESTILO_TOTAL,
  aplicarCabecalho,
  congelar,
} from "./estilos";

/**
 * Escreve uma grade inteira num workbook, criando uma aba por folha.
 *
 * A aba ativa é fixada no fim. Sem isso o Excel abre o arquivo na ÚLTIMA aba
 * escrita — que é onde o código parou — e a primeira impressão do arquivo
 * passa a ser um bloco de notas em vez do conteúdo.
 */
export function escreverGrade(wb: Workbook, grade: GradeDaPlanilha): void {
  for (const folha of grade.folhas) {
    escreverFolha(wb.addWorksheet(folha.nome), grade, folha);
  }

  wb.views = [
    {
      x: 0,
      y: 0,
      width: 10000,
      height: 20000,
      firstSheet: 0,
      activeTab: 0,
      visibility: "visible",
    },
  ];
}

/**
 * Escreve uma folha.
 *
 * A ordem é sempre a mesma, e é a ordem em que a planilha é lida: faixa de
 * título, faixa de subtítulo, e então o conteúdo. As duas primeiras linhas são
 * fixas em toda folha porque uma aba impressa sozinha, copiada para outro
 * arquivo ou aberta fora do sistema precisa continuar dizendo de quem ela é.
 */
function escreverFolha(aba: Worksheet, grade: GradeDaPlanilha, folha: FolhaGrade): void {
  const totalColunas = Math.max(1, folha.colunas.length);

  /*
    As larguras vêm antes de qualquer célula. O Excel calcula a largura da
    coluna a partir do que ela contém, e escrever primeiro para medir depois
    daria colunas apertadas na primeira abertura.
  */
  folha.colunas.forEach((col, i) => {
    aba.getColumn(i + 1).width = col.largura;
  });

  aplicarCabecalho(aba, folha.titulo, grade.subtitulo, totalColunas);

  let linha = 3;
  let dadosEscritos = 0;
  let primeiraLinhaDeDados = 0;
  let ultimaLinhaDeDados = 0;

  for (const item of folha.linhas) {
    switch (item.tipo) {
      case "secao": {
        linha = escreverRotulo(aba, linha, item.texto, totalColunas);
        break;
      }

      case "campo": {
        escreverCampo(aba, linha, item.rotulo, item.valor, item.formato);
        linha += 1;
        break;
      }

      case "cabecalho": {
        escreverCabecalhoDeTabela(aba, linha, folha);
        if (primeiraLinhaDeDados === 0) primeiraLinhaDeDados = linha;
        linha += 1;
        break;
      }

      case "dados":
      case "subtotal":
      case "total": {
        escreverLinhaDeDados(aba, linha, folha, item);
        if (primeiraLinhaDeDados === 0) primeiraLinhaDeDados = linha;
        ultimaLinhaDeDados = linha;
        dadosEscritos += 1;
        linha += 1;
        break;
      }

      case "texto": {
        linha = escreverTexto(aba, linha, item.texto, totalColunas, item.tom);
        break;
      }

      case "vazia": {
        /*
          A LINHA DE GRADE LIVRE.

          Ela existe para a planilha em branco, e no arquivo ela precisa ser
          o que é na tela: uma linha COM BORDAS e sem conteúdo. Se fosse
          simplesmente pulada, a folha em branco sairia do Excel com zero
          linhas — e a grade que ela preencheu no navegador não estaria lá.

          O `ler`/`escrever` de célula vazia é deliberado: o ExcelJS só
          materializa a borda de uma linha que tem pelo menos uma célula
          estilizada. Escrever o estilo em cada coluna é o que faz a grade
          chegar ao Excel com a mesma cara de grade.
        */
        escreverLinhaVazia(aba, linha, folha, item.celulas);
        linha += 1;
        break;
      }
    }
  }

  /*
    O FILTRO.

    Vai do cabeçalho à última linha de dado — e o cabeçalho é procurado, não
    presumido: nem toda folha é uma tabela, e uma folha de resumo não tem
    filtro nenhum. Sem o filtro, ordenar por custo significa selecionar o
    intervalo à mão, que é o que separa "planilha" de "relatório impresso".
  */
  if (dadosEscritos > 0 && primeiraLinhaDeDados > 0) {
    aba.autoFilter = {
      from: { row: primeiraLinhaDeDados - 1, column: 1 },
      to: { row: ultimaLinhaDeDados, column: totalColunas },
    };
  }

  if (folha.congelarLinhas > 0) {
    congelar(aba, folha.congelarLinhas, folha.congelarColunas ?? 0);
  }

  escreverAssinaturaDeRodape(aba, linha + 1, totalColunas, folha.assinatura);
}

// ---------------------------------------------------------------------------
// Linhas
// ---------------------------------------------------------------------------

/** A faixa de bloco — "O CLIENTE", "INGREDIENTES". */
function escreverRotulo(aba: Worksheet, linha: number, texto: string, total: number): number {
  aba.mergeCells(linha, 1, linha, total);
  const cell = aba.getCell(linha, 1);
  cell.value = texto;
  cell.style = ESTILO_ROTULO_BLOCO;
  aba.getRow(linha).height = 20;
  return linha + 1;
}

/** Um par rótulo/valor ocupando as duas primeiras colunas. */
function escreverCampo(
  aba: Worksheet,
  linha: number,
  rotulo: string,
  valor: CelulaGrade,
  formato: keyof typeof FORMATO_EXCEL | undefined
): void {
  const rotuloCell = aba.getCell(linha, 1);
  rotuloCell.value = rotulo;
  rotuloCell.style = ESTILO_CAMPO_ROTULO;

  const valorCell = aba.getCell(linha, 2);
  /*
    Ausência vira traço, e traço é texto. Gravar `null` deixaria a célula
    vazia, o que numa planilha de custo se confunde com "zero" — e a diferença
    entre "não sei" e "é zero" é a diferença entre não fechar o preço e fechar
    um preço errado.
  */
  valorCell.value = valor ?? "—";
  valorCell.style = {
    ...ESTILO_CAMPO_VALOR,
    numFmt: valor !== null && formato ? FORMATO_EXCEL[formato] : undefined,
  };
  aba.getRow(linha).height = 18;
}

const ESTILO_CAMPO_ROTULO: Partial<Style> = {
  font: { name: "Calibri", size: 10, bold: true, color: { argb: COR.tintaSuave } },
  alignment: { vertical: "middle", horizontal: "left", indent: 1 },
};

const ESTILO_CAMPO_VALOR: Partial<Style> = {
  font: { name: "Calibri", size: 10, color: { argb: COR.tinta } },
  alignment: { vertical: "middle", horizontal: "left", wrapText: false },
};

/**
 * A TRADUÇÃO DO ALINHAMENTO PARA O VOCABULÁRIO DO EXCEL.
 *
 * A grade fala "esq", "dir" e "centro" — as três palavras que o componente da
 * tela usa em classe CSS. O ExcelJS fala "left", "right" e "center". São a
 * mesma ideia com dois nomes, e a conversão precisa existir em algum lugar.
 *
 * Mora aqui, e não em `grade.ts`, porque `grade.ts` é lido também pelo
 * navegador: colocar uma tabela de nomes do ExcelJS lá dentro faria o
 * vocabulário de uma biblioteca de servidor vazar para a camada pura, que é
 * justamente o que a separação existe para impedir.
 *
 * O mapa é total sobre os três valores, e o `Record` garante isso na
 * compilação: acrescentar um alinhamento novo à grade sem traduzi-lo aqui
 * seria erro de tipo, e não uma coluna desalinhada descoberta no Excel.
 */
const ALINHAMENTO_EXCEL: Record<(typeof ALINHAMENTO_DO_FORMATO)[keyof typeof ALINHAMENTO_DO_FORMATO], "left" | "right" | "center"> = {
  esq: "left",
  dir: "right",
  centro: "center",
};

/** A linha de títulos de coluna. */
function escreverCabecalhoDeTabela(aba: Worksheet, linha: number, folha: FolhaGrade): void {
  folha.colunas.forEach((col, i) => {
    const cell = aba.getCell(linha, i + 1);
    cell.value = col.titulo;
    cell.style = {
      ...ESTILO_CABECALHO,
      alignment: {
        vertical: "middle",
        horizontal: ALINHAMENTO_EXCEL[ALINHAMENTO_DO_FORMATO[col.formato]],
        wrapText: false,
      },
    };
  });
  aba.getRow(linha).height = 20;
}

/**
 * Uma linha de dados, subtotal ou total.
 *
 * A escolha do estilo é a única decisão deste arquivo, e ela é sobre PESO
 * VISUAL, não sobre conteúdo: alternada para dado, clara para subtotal, escura
 * para total. Nada mais.
 */
function escreverLinhaDeDados(
  aba: Worksheet,
  linha: number,
  folha: FolhaGrade,
  item: Extract<LinhaGrade, { tipo: "dados" | "subtotal" | "total" }>
): void {
  const base =
    item.tipo === "total"
      ? ESTILO_TOTAL
      : item.tipo === "subtotal"
        ? ESTILO_SUBTOTAL
        : linha % 2 === 0
          ? ESTILO_CELULA_FAIXA
          : ESTILO_CELULA;

  folha.colunas.forEach((col, i) => {
    const cell = aba.getCell(linha, i + 1);
    const bruto = item.celulas[col.chave];

    /*
      A primeira célula de um subtotal ou de um total carrega o rótulo quando
      ele existe. Sem isso, a linha "TOTAL" seria uma linha de números sem
      dizer o que eles somam — e o rótulo é a metade útil da linha.
    */
    if (i === 0 && (item.tipo === "subtotal" || item.tipo === "total")) {
      const rotulo = "rotulo" in item ? item.rotulo : undefined;
      cell.value = rotulo ?? bruto ?? "";
      cell.style = base;
      return;
    }

    // Número que não existe fica em branco, e não com traço: numa coluna de
    // dinheiro somada pelo Excel, "—" é texto e quebra a soma da coluna.
    cell.value = bruto ?? null;
    cell.style = {
      ...base,
      alignment: {
        vertical: "middle",
        horizontal: ALINHAMENTO_EXCEL[ALINHAMENTO_DO_FORMATO[col.formato]],
        wrapText: false,
      },
      numFmt:
        bruto !== undefined && bruto !== null && FORMATO_EXCEL[col.formato]
          ? FORMATO_EXCEL[col.formato]
          : undefined,
    };
  });
  aba.getRow(linha).height = 17;
}

/**
 * Uma linha de grade livre — vazia, ou com o que ela digitou.
 *
 * Diferente de `dados`, esta linha não recebe faixa alternada nem numFmt: ela
 * é grade de digitação, e a única coisa que ela carrega é a divisão fina entre
 * células. A faixa alternada existe para guiar o olho numa lista longa; numa
 * grade em branco, ela pintaria de cinza linhas que ninguém preencheu.
 */
function escreverLinhaVazia(
  aba: Worksheet,
  linha: number,
  folha: FolhaGrade,
  celulas: Readonly<Record<string, CelulaGrade>> | undefined
): void {
  folha.colunas.forEach((col, i) => {
    const cell = aba.getCell(linha, i + 1);
    const bruto = celulas?.[col.chave] ?? null;
    cell.value = bruto;
    cell.style = {
      ...ESTILO_CELULA,
      alignment: {
        vertical: "middle",
        horizontal: ALINHAMENTO_EXCEL[ALINHAMENTO_DO_FORMATO[col.formato]],
        wrapText: false,
      },
      numFmt:
        bruto !== null && FORMATO_EXCEL[col.formato] ? FORMATO_EXCEL[col.formato] : undefined,
    };
  });
  aba.getRow(linha).height = 17;
}

/** Uma linha de texto corrido — nota de rodapé ou pendência. */
function escreverTexto(
  aba: Worksheet,
  linha: number,
  texto: string,
  total: number,
  tom: "nota" | "pendencia" | undefined
): number {
  aba.mergeCells(linha, 1, linha, total);
  const cell = aba.getCell(linha, 1);
  cell.value = texto;
  cell.style = tom === "pendencia" ? ESTILO_PENDENCIA : tom === "nota" ? ESTILO_NOTA : ESTILO_TEXTO;

  /*
    Célula mesclada NÃO auto-ajusta altura no Excel, e o exceljs não expõe
    auto-ajuste. Um parágrafo de quatro linhas apareceria cortado em duas.
    A altura é estimada com folga declarada: uma linha a mais é espaço em
    branco, uma a menos corta texto.
  */
  const porLinha = Math.max(40, Math.round(total * 11));
  const linhas = Math.max(texto.split("\n").length, Math.ceil(texto.length / porLinha));
  aba.getRow(linha).height = Math.max(15, linhas * 15);

  return linha + 1;
}

function escreverAssinaturaDeRodape(
  aba: Worksheet,
  linha: number,
  total: number,
  nota: string
): void {
  aba.mergeCells(linha, 1, linha, total);
  const cell = aba.getCell(linha, 1);
  cell.value = nota;
  cell.style = ESTILO_NOTA;
  aba.getRow(linha).height = 16;
}
