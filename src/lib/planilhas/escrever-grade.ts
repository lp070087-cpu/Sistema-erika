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
import type { CelulaGrade, EstiloGrade, FolhaGrade, GradeDaPlanilha, LinhaGrade } from "./grade";
import { ALINHAMENTO_DO_FORMATO, FORMATO_EXCEL, estiloDaCelula, estiloDeLinha } from "./grade";
import {
  COR,
  ESTILO_CABECALHO,
  ESTILO_CELULA,
  ESTILO_CELULA_FAIXA,
  ESTILO_FAIXA_NOMES,
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

  /*
    A LINHA DE VALORES QUE VEM LOGO ABAIXO DE UMA FAIXA DE NOMES.

    ┌──────────────────────────────────────────────────────────────────────┐
    │ POR QUE ELA NÃO CONTA COMO LINHA DE DADO                             │
    │                                                                      │
    │ O filtro do Excel nasce do primeiro `cabecalho` e vai até a última    │
    │ linha de dado. Ele é a lista que se ordena e se filtra — e o resumo   │
    │ da ficha, aquele par "nomes em cima / números embaixo", NÃO é uma      │
    │ lista: é um painel de sete números que existe uma vez por ficha.       │
    │                                                                      │
    │ Se ele contasse como dado, o filtro começaria na faixa de nomes e os   │
    │ rótulos "RENDIMENTO", "CUSTO TOTAL" apareceriam na lista suspensa     │
    │ como se fossem valores de coluna — e filtrar por custo ofereceria      │
    │ "CUSTO TOTAL" como opção. São dois registros de natureza diferente     │
    │ na mesma coluna, e o filtro não sabe disso.                           │
    │                                                                      │
    │ A adjacência é o critério porque é o que a estrutura diz: valor logo   │
    │ abaixo de faixa de nomes é o corpo daquela faixa, e não uma linha      │
    │ solta da tabela.                                                      │
    └──────────────────────────────────────────────────────────────────────┘
  */
  let ultimaLinhaDeRotulos = 0;

  for (const item of folha.linhas) {
    switch (item.tipo) {
      case "secao": {
        linha = escreverRotulo(aba, linha, item.texto, totalColunas, estiloDeLinha(item));
        break;
      }

      case "campo": {
        escreverCampo(aba, linha, item.rotulo, item.valor, item.formato, estiloDeLinha(item));
        linha += 1;
        break;
      }

      case "cabecalho": {
        escreverCabecalhoDeTabela(aba, linha, folha, item);

        /*
          ┌────────────────────────────────────────────────────────────────────┐
          │ O CABEÇALHO OCUPA ESTA LINHA — O DADO COMEÇA NA SEGUINTE            │
          │                                                                    │
          │ Aqui estava `= linha`, e o `- 1` do autoFilter transformava isso em  │
          │ "o filtro começa uma linha ACIMA do cabeçalho". Conferido por        │
          │ execução: uma folha com o cabeçalho na linha 3 saía com o filtro     │
          │ em A2:C5, e o Excel põe as setas de filtro na PRIMEIRA linha do      │
          │ intervalo — ou seja, os botões nasciam na faixa de subtítulo e a     │
          │ linha de títulos de coluna virava a primeira linha filtrável.        │
          │                                                                    │
          │ O defeito era invisível para quem só lesse o código, porque o `- 1`  │
          │ do fim parece uma compensação e é uma segunda compensação: a linha   │
          │ já estava sendo contada uma vez a mais aqui.                        │
          │                                                                    │
          │ Consertado no nome, e não na conta: `primeiraLinhaDeDados` passa a   │
          │ significar a primeira linha de DADO nas duas origens — aqui e no    │
          │ `dados` mais abaixo — e o `- 1` do filtro volta a ser o que diz ser: │
          │ a linha do cabeçalho.                                              │
          └────────────────────────────────────────────────────────────────────┘
        */
        if (primeiraLinhaDeDados === 0) primeiraLinhaDeDados = linha + 1;
        linha += 1;
        break;
      }

      case "rotulos": {
        escreverRotulosDeLinha(aba, linha, folha, item, totalColunas);
        ultimaLinhaDeRotulos = linha;
        linha += 1;
        break;
      }

      case "dados":
      case "subtotal":
      case "total": {
        escreverLinhaDeDados(aba, linha, folha, item);

        /*
          O CORPO DA FAIXA DE NOMES não entra no filtro — ver o comentário de
          `ultimaLinhaDeRotulos`. A linha é escrita igual; o que muda é ela
          não contar como registro filtrável.
        */
        const corpoDeRotulos = ultimaLinhaDeRotulos === linha - 1;
        if (!corpoDeRotulos) {
          if (primeiraLinhaDeDados === 0) primeiraLinhaDeDados = linha;
          ultimaLinhaDeDados = linha;
          dadosEscritos += 1;
        }

        linha += 1;
        break;
      }

      case "texto": {
        linha = escreverTexto(aba, linha, item.texto, totalColunas, item.tom, estiloDeLinha(item));
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
        escreverLinhaVazia(aba, linha, folha, item);
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
function escreverRotulo(
  aba: Worksheet,
  linha: number,
  texto: string,
  total: number,
  estilo?: EstiloGrade
): number {
  aba.mergeCells(linha, 1, linha, total);
  const cell = aba.getCell(linha, 1);
  cell.value = texto;
  cell.style = comMarcacao(ESTILO_ROTULO_BLOCO, estilo);
  aba.getRow(linha).height = 20;
  return linha + 1;
}

/** Um par rótulo/valor ocupando as duas primeiras colunas. */
function escreverCampo(
  aba: Worksheet,
  linha: number,
  rotulo: string,
  valor: CelulaGrade,
  formato: keyof typeof FORMATO_EXCEL | undefined,
  estilo?: EstiloGrade
): void {
  const rotuloCell = aba.getCell(linha, 1);
  rotuloCell.value = rotulo;
  rotuloCell.style = comMarcacao(ESTILO_CAMPO_ROTULO, estilo);

  const valorCell = aba.getCell(linha, 2);
  /*
    Ausência vira traço, e traço é texto. Gravar `null` deixaria a célula
    vazia, o que numa planilha de custo se confunde com "zero" — e a diferença
    entre "não sei" e "é zero" é a diferença entre não fechar o preço e fechar
    um preço errado.
  */
  valorCell.value = valor ?? "—";
  valorCell.style = comMarcacao(
    {
      ...ESTILO_CAMPO_VALOR,
      numFmt: valor !== null && formato ? FORMATO_EXCEL[formato] : undefined,
    },
    estilo
  );
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

// ---------------------------------------------------------------------------
// A MARCAÇÃO QUE A ÉRIKA FEZ
// ---------------------------------------------------------------------------

/**
 * A COR NO FORMATO QUE O EXCEL ENTENDE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `FF` NA FRENTE                                             │
 * │                                                                   │
 * │ O ExcelJS não usa `#rrggbb`: ele usa ARGB — oito dígitos, dos quais │
 * │ os dois primeiros são o ALFA. `"FF"` é opaco.                      │
 * │                                                                   │
 * │ Passar `"#fdf0b2"` direto não dá erro de tipo e não pinta nada: o   │
 * │ exceljs grava a string como está, e o Excel encontra uma cor que    │
 * │ ele não sabe ler. O resultado é uma planilha marcada na tela e      │
 * │ branca no arquivo — o defeito silencioso clássico desta camada.      │
 * │                                                                   │
 * │ A entrada já foi validada em `corValida`, então aqui ela é sempre   │
 * │ `#rrggbb` — o `slice(1)` é seguro por construção.                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function argb(hex: string): string {
  return `FF${hex.slice(1).toUpperCase()}`;
}

/**
 * O ESTILO DO MODELO, COM A MARCAÇÃO POR CIMA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE A ÉRIKA MANDA, E O QUE ELA NÃO MANDA                          │
 * │                                                                      │
 * │ Ela escolhe fundo, cor do texto, negrito e alinhamento. Ela NÃO        │
 * │ escolhe borda, formato de número nem altura de linha.                 │
 * │                                                                      │
 * │ A consequência é que a marcação precisa ser APLICADA SOBRE o estilo   │
 * │ do modelo, e não substituí-lo. Se ela substituísse, marcar de         │
 * │ amarelo a linha de um total apagaria a borda dupla que separa o        │
 * │ total do corpo — a hierarquia da planilha se perderia no gesto de      │
 * │ destacar uma linha, que é o oposto do que o gesto quer.                │
 * │                                                                      │
 * │ `font` e `alignment` são clonados com espalhamento porque o ExcelJS   │
 * │ usa o MESMO objeto de estilo em todas as células que o recebem:       │
 * │ alterar `base.font` no lugar mudaria todas as linhas da folha.         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function comMarcacao(base: Partial<Style>, estilo: EstiloGrade | undefined): Partial<Style> {
  if (estilo === undefined) return base;

  const saida: Partial<Style> = { ...base };

  if (estilo.fundo !== undefined) {
    saida.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(estilo.fundo) } };
  }

  if (estilo.texto !== undefined || estilo.negrito !== undefined) {
    saida.font = {
      ...base.font,
      ...(estilo.texto !== undefined ? { color: { argb: argb(estilo.texto) } } : {}),
      ...(estilo.negrito !== undefined ? { bold: estilo.negrito } : {}),
    };
  }

  if (estilo.alinhamento !== undefined) {
    saida.alignment = {
      ...base.alignment,
      horizontal: ALINHAMENTO_EXCEL[estilo.alinhamento],
    };
  }

  /*
    O FORMATO SÓ ENTRA QUANDO ELE EXISTE.

    Ele não é cor: é `[R$]` ou `[%]`, e vem da barra de formatação. Quando ele
    não veio, o `numFmt` que a coluna já montou fica como está — sobrescrevê-lo
    com `undefined` apagaria o formato da coluna inteira, e uma coluna de
    dinheiro passaria a mostrar "12.5".
  */
  if (estilo.formato !== undefined) {
    saida.numFmt = FORMATO_EXCEL[estilo.formato];
  }

  return saida;
}

/**
 * A FAIXA DE NOMES DO TOPO DA FICHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A SOBRA DA FAIXA É PINTADA, E NÃO IGNORADA                   │
 * │                                                                      │
 * │ Sete nomes não preenchem as nove colunas da grade de ingredientes. Se  │
 * │ a faixa terminasse no sétimo, a oitava e a nona ficariam brancas       │
 * │ entre a barra escura e a tabela — e a faixa pareceria um remendo em    │
 * │ vez de um cabeçalho, com um degrau no meio da largura da folha.        │
 * │                                                                      │
 * │ A sobra recebe o MESMO fundo e nenhum texto: a barra fecha na largura  │
 * │ da tabela, que é o que faz as duas se lerem como um bloco só.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function escreverRotulosDeLinha(
  aba: Worksheet,
  linha: number,
  folha: FolhaGrade,
  item: Extract<LinhaGrade, { tipo: "rotulos" }>,
  totalColunas: number
): void {
  const usados = Math.min(item.rotulos.length, totalColunas);

  item.rotulos.slice(0, usados).forEach((texto, i) => {
    /*
      A CHAVE É A DA COLUNA, e não o texto.

      A marcação que a Érika faz chega indexada pela chave da coluna — é o que
      o `aplicarPincelNaFolha` grava e o que a tela consulta. Usar o texto
      funcionaria num lado e não no outro, e o defeito apareceria como uma
      célula pintada na tela e branca no arquivo.
    */
    const chave = folha.colunas[i]?.chave;
    const cell = aba.getCell(linha, i + 1);
    cell.value = texto;
    cell.style = comMarcacao(
      ESTILO_FAIXA_NOMES,
      chave === undefined ? undefined : estiloDaCelula(item, chave)
    );
  });

  for (let coluna = usados + 1; coluna <= totalColunas; coluna += 1) {
    aba.getCell(linha, coluna).style = ESTILO_FAIXA_NOMES;
  }

  aba.getRow(linha).height = 16;
}

/** A linha de títulos de coluna. */
function escreverCabecalhoDeTabela(
  aba: Worksheet,
  linha: number,
  folha: FolhaGrade,
  item: Extract<LinhaGrade, { tipo: "cabecalho" }>
): void {
  folha.colunas.forEach((col, i) => {
    const cell = aba.getCell(linha, i + 1);
    cell.value = col.titulo;
    cell.style = comMarcacao(
      {
        ...ESTILO_CABECALHO,
        alignment: {
          vertical: "middle",
          horizontal: ALINHAMENTO_EXCEL[ALINHAMENTO_DO_FORMATO[col.formato]],
          wrapText: false,
        },
      },
      estiloDaCelula(item, col.chave)
    );
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
    const marcacao = estiloDaCelula(item, col.chave);

    /*
      A primeira célula de um subtotal ou de um total carrega o rótulo quando
      ele existe. Sem isso, a linha "TOTAL" seria uma linha de números sem
      dizer o que eles somam — e o rótulo é a metade útil da linha.
    */
    if (i === 0 && (item.tipo === "subtotal" || item.tipo === "total")) {
      const rotulo = "rotulo" in item ? item.rotulo : undefined;
      cell.value = rotulo ?? bruto ?? "";
      cell.style = comMarcacao(base, marcacao);
      return;
    }

    // Número que não existe fica em branco, e não com traço: numa coluna de
    // dinheiro somada pelo Excel, "—" é texto e quebra a soma da coluna.
    cell.value = bruto ?? null;
    cell.style = comMarcacao(
      {
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
      },
      marcacao
    );
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
  item: Extract<LinhaGrade, { tipo: "vazia" }>
): void {
  folha.colunas.forEach((col, i) => {
    const cell = aba.getCell(linha, i + 1);
    const bruto = item.celulas?.[col.chave] ?? null;
    cell.value = bruto;
    cell.style = comMarcacao(
      {
        ...ESTILO_CELULA,
        alignment: {
          vertical: "middle",
          horizontal: ALINHAMENTO_EXCEL[ALINHAMENTO_DO_FORMATO[col.formato]],
          wrapText: false,
        },
        numFmt:
          bruto !== null && FORMATO_EXCEL[col.formato] ? FORMATO_EXCEL[col.formato] : undefined,
      },
      estiloDaCelula(item, col.chave)
    );
  });
  aba.getRow(linha).height = 17;
}

/** Uma linha de texto corrido — nota de rodapé ou pendência. */
function escreverTexto(
  aba: Worksheet,
  linha: number,
  texto: string,
  total: number,
  tom: "nota" | "pendencia" | undefined,
  estilo?: EstiloGrade
): number {
  aba.mergeCells(linha, 1, linha, total);
  const cell = aba.getCell(linha, 1);
  cell.value = texto;
  cell.style = comMarcacao(
    tom === "pendencia" ? ESTILO_PENDENCIA : tom === "nota" ? ESTILO_NOTA : ESTILO_TEXTO,
    estilo
  );

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
