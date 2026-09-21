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

/**
 * OS FORMATOS QUE A GRADE CONHECE — a lista, e a única porta de entrada.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LISTA MORA AQUI, E NÃO EM CADA LUGAR QUE PRECISA DELA      │
 * │                                                                      │
 * │ Ela já existia duas vezes: como tipo `FormatoGrade`, aqui, e como      │
 * │ `new Set([...])` na rota que recebe a grade pela rede. Duas listas da  │
 * │ mesma verdade divergem — e a divergência apareceria como um formato    │
 * │ que o sistema aceita na tela e recusa no arquivo, ou o contrário.      │
 * │                                                                      │
 * │ O `Record<FormatoGrade, …>` não substitui isto: ele garante que uma    │
 * │ TABELA cobre todos os formatos, não que uma string vinda de fora seja  │
 * │ um deles. Para validar entrada não confiável é preciso a lista.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const FORMATOS_GRADE: readonly FormatoGrade[] = [
  "texto",
  "numero",
  "moeda",
  "percentual",
  "peso",
  "data",
];

/** Aceita o formato só se ele for um dos que a grade conhece. */
export function formatoValido(valor: unknown): FormatoGrade | undefined {
  return typeof valor === "string" && (FORMATOS_GRADE as readonly string[]).includes(valor)
    ? (valor as FormatoGrade)
    : undefined;
}

/** O alinhamento que cada formato pede, quando ninguém diz outra coisa. */
export const ALINHAMENTO_DO_FORMATO: Record<FormatoGrade, AlinhamentoGrade> = {
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

/**
 * O ALINHAMENTO DE UMA CÉLULA, NO VOCABULÁRIO DA GRADE.
 *
 * São três palavras, e elas são as mesmas da tabela `ALINHAMENTO_DO_FORMATO`.
 * O tipo existe separado para a formatação MANUAL poder declarar um
 * alinhamento que não é o do formato — é o caso de uma linha de destaque que
 * se quer centralizada, ou de um rótulo em coluna numérica.
 */
export type AlinhamentoGrade = "esq" | "dir" | "centro";

/**
 * O QUE A ÉRIKA PINTA POR CIMA DO MODELO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO MORA NA GRADE, E NÃO NO COMPONENTE DA TELA              │
 * │                                                                      │
 * │ A tentação era guardar a cor no componente: ele é quem desenha, então  │
 * │ é ele quem saberia pintar. Funcionaria na tela e quebraria no arquivo  │
 * │ — a planilha que ela marcou de amarelo sairia do Excel sem a marcação, │
 * │ e a marcação é trabalho dela.                                          │
 * │                                                                      │
 * │ Como a grade é a MESMA estrutura que vira tela e vira .xlsx, o estilo  │
 * │ declarado aqui atravessa as duas pontas sem tradutor no meio. O        │
 * │ `escrever-grade` lê daqui; o componente da tela lê daqui.              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * AS CORES SÃO HEXADECIMAIS — `"#fdf0b2"`. A conversão para o `ARGB` do
 * Excel acontece no escritor, que é o único que fala ExcelJS. Guardar o
 * formato da biblioteca aqui faria o vocabulário de uma biblioteca de
 * servidor vazar para a camada pura, que é o que a separação existe para
 * impedir.
 *
 * TUDO É OPCIONAL, e campo ausente significa "não mexe": a célula mantém o
 * estilo do modelo. É a diferença entre "pinte de branco" e "deixe como está".
 */
export type EstiloGrade = {
  /** Cor de fundo, em `#rrggbb`. */
  fundo?: string;
  /** Cor do texto, em `#rrggbb`. */
  texto?: string;
  /** Negrito — o destaque mais barato que existe numa planilha. */
  negrito?: boolean;
  /** Alinhamento que sobrepõe o do formato da coluna. */
  alinhamento?: AlinhamentoGrade;
  /**
   * O FORMATO DE NÚMERO, quando a Érika muda a moeda ou a porcentagem de uma
   * célula pela barra.
   *
   * `[R$]` e `[%]` não são cor: são formato, e é o formato que o Excel precisa
   * receber para a célula mostrar "R$ 12,50" em vez de "12,5" — a cor não
   * substitui isso. Por isso ele viaja junto da marcação, em vez de virar um
   * mapa paralelo com o mesmo endereço de chave.
   *
   * Ausente significa "o formato da coluna", que é o comportamento de toda
   * célula que ninguém tocou.
   */
  formato?: FormatoGrade;
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
 *   rotulos   — a faixa de NOMES de topo da ficha técnica, um por coluna. É
 *               `cabecalho` com os nomes vindo da LINHA em vez da folha: a
 *               mesma tabela pode ter dois cabeçalhos de significados
 *               diferentes, e o da folha é um só.
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
/**
 * O CAMPO QUE TODA LINHA TEM, E QUE NENHUMA É OBRIGADA A PREENCHER.
 *
 * Ele entra por interseção, e não repetido em cada variante, porque repetir
 * convidaria ao defeito mais chato possível: acrescentar um tipo de linha novo
 * e esquecer o campo nele. Aí a linha nova existiria, pintar-se-ia na tela e
 * não aceitaria marcação — sem nada indicando por quê.
 */
type LinhaComEstilo = {
  /** O que vale para a LINHA inteira. Vence o estilo do modelo. */
  estilo?: EstiloGrade;
  /**
   * O que vale para CÉLULAS específicas, pela chave da coluna.
   *
   * ┌──────────────────────────────────────────────────────────────────┐
   * │ POR QUE DOIS NÍVEIS, E NÃO UM SÓ                                  │
   * │                                                                  │
   * │ "Marcar uma linha de amarelo" e "destacar o subtotal" são os dois │
   * │ gestos que o briefing descreve, e eles não são o mesmo gesto: um  │
   * │ pinta a faixa inteira, o outro pinta uma célula no meio de uma    │
   * │ faixa que continua normal.                                        │
   * │                                                                  │
   * │ Guardar só a linha obrigaria a marcar a linha toda para destacar  │
   * │ a última célula — e a marcação perderia o sentido, porque uma     │
   * │ linha toda amarela não destaca nada dentro dela.                  │
   * │                                                                  │
   * │ O CELL VENCE O ROW quando os dois existem. É a única precedência  │
   * │ que faz sentido: o gesto mais específico é o mais recente.        │
   * └──────────────────────────────────────────────────────────────────┘
   */
  estilosCelulas?: Readonly<Record<string, EstiloGrade>>;
};

export type LinhaGrade =
  | ({ tipo: "secao"; texto: string } & LinhaComEstilo)
  | ({ tipo: "campo"; rotulo: string; valor: CelulaGrade; formato?: FormatoGrade } & LinhaComEstilo)
  | ({ tipo: "cabecalho" } & LinhaComEstilo)
  | ({ tipo: "rotulos"; rotulos: readonly string[] } & LinhaComEstilo)
  | ({ tipo: "dados"; celulas: Readonly<Record<string, CelulaGrade>> } & LinhaComEstilo)
  | ({
      tipo: "subtotal";
      celulas: Readonly<Record<string, CelulaGrade>>;
      rotulo?: string;
    } & LinhaComEstilo)
  | ({ tipo: "total"; celulas: Readonly<Record<string, CelulaGrade>>; rotulo?: string } & LinhaComEstilo)
  | ({ tipo: "texto"; texto: string; tom?: "nota" | "pendencia" } & LinhaComEstilo)
  | ({ tipo: "vazia"; celulas?: Readonly<Record<string, CelulaGrade>> } & LinhaComEstilo);

/**
 * A COR QUE A ÉRIKA ESCOLHEU, OU NADA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA VALIDAÇÃO EXISTE NUMA CAMADA QUE SÓ DESCREVE FORMATO    │
 * │                                                                      │
 * │ Uma cor chega aqui vinda de um `<input type="color">` — que sempre     │
 * │ entrega `#rrggbb` — e também de um pacote que voltou do navegador numa │
 * │ rota pública. As duas entradas não merecem a mesma confiança.          │
 * │                                                                      │
 * │ O defeito de não validar não é a cor errada: é o EXCELJS receber       │
 * │ `"vermelho"` no campo `argb` e escrever um arquivo que o Excel abre    │
 * │ corrompido. Um arquivo que não abre é pior que uma marcação que não    │
 * │ saiu.                                                                  │
 * │                                                                      │
 * │ A recusa é silenciosa (devolve `undefined`), pela mesma razão da       │
 * │ rota de importação: uma cor a menos é um arquivo que abre.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function corValida(valor: unknown): string | undefined {
  if (typeof valor !== "string") return undefined;
  const limpo = valor.trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(limpo) ? limpo : undefined;
}

/**
 * O ESTILO DE UMA LINHA — o que a Érika pintou, já limpo.
 *
 * `undefined` quando não há nada para pintar, e não um objeto vazio: quem lê
 * pergunta "esta linha foi marcada?" e a resposta `undefined` é a única que
 * não obriga a inspecionar campo por campo. Um `{}` responderia "sim" a uma
 * pergunta cuja resposta é "não".
 */
export function estiloDeLinha(linha: LinhaGrade): EstiloGrade | undefined {
  return limparEstilo(linha.estilo);
}

/**
 * O ESTILO DE UMA CÉLULA — o do ROW somado ao do CELL, nessa ordem.
 *
 * A soma é campo a campo, e não um `{...linha, ...celula}`: com o espalhamento,
 * um estilo de célula que só define a cor do TEXTO apagaria o fundo amarelo da
 * linha, porque o espalhamento raso não sabe que campo ausente significa
 * "não mexe neste aqui".
 *
 * O cell vence o row — o gesto mais específico é o mais recente.
 */
export function estiloDaCelula(linha: LinhaGrade, chave: string): EstiloGrade | undefined {
  const daLinha = limparEstilo(linha.estilo);
  const daCelula = limparEstilo(linha.estilosCelulas?.[chave]);
  if (daLinha === undefined) return daCelula;
  if (daCelula === undefined) return daLinha;

  return limparEstilo({
    fundo: daCelula.fundo ?? daLinha.fundo,
    texto: daCelula.texto ?? daLinha.texto,
    negrito: daCelula.negrito ?? daLinha.negrito,
    alinhamento: daCelula.alinhamento ?? daLinha.alinhamento,
    formato: daCelula.formato ?? daLinha.formato,
  });
}

/**
 * O ESTILO, REDUZIDO AO QUE ELE PODE SER.
 *
 * Ela é o único caminho entre um estilo cru e um estilo usável, e as duas
 * funções acima passam por ela. Uma segunda limpeza escrita à mão num dos dois
 * lados seria a chance de uma cor inválida escapar por um caminho e não pelo
 * outro — e o defeito apareceria como um arquivo que abre às vezes.
 */
function limparEstilo(bruto: EstiloGrade | undefined): EstiloGrade | undefined {
  if (bruto === undefined || bruto === null) return undefined;

  const fundo = corValida(bruto.fundo);
  const texto = corValida(bruto.texto);
  const negrito = bruto.negrito === true ? true : undefined;
  const alinhamento =
    bruto.alinhamento === "esq" || bruto.alinhamento === "dir" || bruto.alinhamento === "centro"
      ? bruto.alinhamento
      : undefined;
  const formato = formatoValido(bruto.formato);

  if (
    fundo === undefined &&
    texto === undefined &&
    negrito === undefined &&
    alinhamento === undefined &&
    formato === undefined
  ) {
    return undefined;
  }
  return {
    ...(fundo !== undefined ? { fundo } : {}),
    ...(texto !== undefined ? { texto } : {}),
    ...(negrito !== undefined ? { negrito } : {}),
    ...(alinhamento !== undefined ? { alinhamento } : {}),
    ...(formato !== undefined ? { formato } : {}),
  };
}

/**
 * O ESTILO DE UMA CÉLULA, SOBREPOSTO AO QUE JÁ EXISTIA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É PÚBLICO, E POR QUE A FUSÃO NÃO É UM ESPALHAMENTO      │
 * │                                                                      │
 * │ A tela escreve `estilo` e `estilosCelulas` a cada gesto de formatação, │
 * │ e o escritor do Excel lê os dois. Se cada ponta fizesse a fusão do     │
 * │ seu jeito, "pintei de amarelo e depois deixei negrito" terminaria com  │
 * │ resultado diferente na tela e no arquivo — que é exatamente o defeito  │
 * │ que a grade existe para impedir.                                       │
 * │                                                                      │
 * │ O ESPALHAMENTO RASSO É O ERRO FÁCIL AQUI. `{...antes, ...depois}`      │
 * │ parece somar os dois, e não soma: um `depois` que só traz `negrito`    │
 * │ não diz "mantenha o fundo", ele simplesmente não tem o campo — e o     │
 * │ objeto fundido fica com o fundo antigo por acaso, não por regra. No    │
 * │ dia em que alguém quiser APAGAR uma cor, é o `undefined` explícito que │
 * │ a apaga, e o espalhamento o ignora silenciosamente.                    │
 * │                                                                      │
 * │ A regra explícita é: campo ausente em `depois` PRESERVA o de `antes`;  │
 * │ `depois` com o campo declarado VENCE.                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function mesclarEstilo(
  antes: EstiloGrade | undefined,
  depois: EstiloGrade
): EstiloGrade {
  const base = antes ?? {};
  return (
    limparEstilo({
      fundo: depois.fundo ?? base.fundo,
      texto: depois.texto ?? base.texto,
      negrito: depois.negrito ?? base.negrito,
      alinhamento: depois.alinhamento ?? base.alinhamento,
      formato: depois.formato ?? base.formato,
    }) ?? {}
  );
}

/**
 * A MARCAÇÃO DE UMA LINHA, COM UM ESTILO APLICADO POR CIMA.
 *
 * Devolve uma LINHA NOVA, e não modifica a recebida: a grade é reconstruída a
 * partir do modelo e o mapa de marcação vive ao lado dela — mutar o objeto do
 * modelo faria a marcação "voltar" depois de um recarregamento, que é o tipo
 * de fantasma que ninguém consegue explicar.
 *
 * `chave` ausente significa "a linha inteira"; presente, "só aquela célula".
 */
export function comEstiloNaLinha(
  linha: LinhaGrade,
  chave: string | undefined,
  estilo: EstiloGrade,
  remover = false
): LinhaGrade {
  const anterior = chave === undefined ? linha.estilo : linha.estilosCelulas?.[chave];

  /*
    APAGAR É POSSÍVEL, E É UMA OPERAÇÃO DIFERENTE DE PINTAR BRANCO.

    `remover` devolve a linha ao estilo do MODELO — inclusive à faixa alternada
    e à borda dupla do total, que pintar de branco não traria de volta. Sem
    este caminho, a única forma de desfazer uma marcação seria escolher a cor
    certa no olho, e "a cor certa" depende da linha ser par ou ímpar.
  */
  const novo =
    remover || Object.keys(estilo).length === 0
      ? undefined
      : mesclarEstilo(anterior, estilo);

  if (chave === undefined) {
    if (novo === undefined) {
      const { estilo: _descartado, ...resto } = linha;
      return resto as LinhaGrade;
    }
    return { ...linha, estilo: novo };
  }

  const mapa = { ...(linha.estilosCelulas ?? {}) };
  if (novo === undefined) {
    delete mapa[chave];
  } else {
    mapa[chave] = novo;
  }

  if (Object.keys(mapa).length === 0) {
    const { estilosCelulas: _descartado, ...resto } = linha;
    return resto as LinhaGrade;
  }
  return { ...linha, estilosCelulas: mapa };
}

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

/**
 * UM NÚMERO DE CÉLULA, A PARTIR DO QUE A ÉRIKA DIGITOU.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE "1.234,50" E "1,5" NÃO PODEM ENTRAR NA MESMA REGRA           │
 * │                                                                      │
 * │ A planilha é brasileira: vírgula é decimal e ponto é milhar. Um       │
 * │ `Number("1.234")` diria 1,234 — e a Érika teria digitado mil duzentos │
 * │ e trinta e quatro. O erro não aparece: o número entra, o custo muda de │
 * │ ordem de grandeza e a célula continua parecendo preenchida.           │
 * │                                                                      │
 * │ A ordem das tentativas resolve, e é a ordem da escrita: primeiro as   │
 * │ duas marcas (aí o ponto é milhar, a vírgula é decimal), depois só a   │
 * │ vírgula (decimal), depois só o ponto (decimal — é o formato que o      │
 * │ teclado numérico do celular entrega).                                 │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ O QUE ESTA FUNÇÃO RECUSA, E POR QUE A RECUSA É O PONTO            │ │
 * │ │                                                                  │ │
 * │ │ "1.234" tem DUAS leituras defensáveis — mil duzentos e trinta e   │ │
 * │ │ quatro, ou um vírgula duzentos e trinta e quatro — e a função     │ │
 * │ │ devolve `null` para ela em vez de escolher. Adivinhar aqui é o    │ │
 * │ │ defeito que a importação de PDF inteira existe para não cometer:   │ │
 * │ │ um número plausível que ninguém confirmou.                        │ │
 * │ │                                                                  │ │
 * │ │ Quem chama decide o que fazer com o `null` — e a decisão certa é  │ │
 * │ │ perguntar, não preencher.                                         │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function numeroDigitado(bruto: string): number | null {
  const texto = bruto.trim();
  if (texto === "") return null;

  if (!/^-?\s*[\d.,\s]+$/.test(texto)) return null;
  const limpo = texto.replace(/\s/g, "");

  const temPonto = limpo.includes(".");
  const temVirgula = limpo.includes(",");

  if (temPonto && temVirgula) {
    // O ponto é milhar e a vírgula é decimal — na ordem em que podem aparecer.
    if (limpo.lastIndexOf(",") < limpo.lastIndexOf(".")) return null;
    return conversao(limpo.replace(/\./g, "").replace(",", "."));
  }

  if (temVirgula) {
    // Uma vírgula só, e até três casas depois dela. Mais que isso é ambíguo.
    if (limpo.indexOf(",") !== limpo.lastIndexOf(",")) return null;
    if ((limpo.split(",")[1] ?? "").length > 3) return null;
    return conversao(limpo.replace(",", "."));
  }

  if (temPonto) {
    /*
      AQUI MORA A AMBIGUIDADE DE VERDADE.

      Um ponto, três dígitos exatos depois e nada antes de zero: "1.234" pode
      ser mil duzentos e trinta e quatro ou um vírgula duzentos e trinta e
      quatro. São leituras diferentes por mil vezes, e nenhuma pista no texto.
      A função não escolhe.
    */
    const partes = limpo.split(".");
    const depois = partes[1] ?? "";
    if (partes.length > 2) return null;
    if (depois.length === 3 && limpo.length > 4) return null;
    return conversao(limpo);
  }

  return conversao(limpo);
}

/** A conversão final, com a guarda contra `NaN` e contra o vazio. */
function conversao(texto: string): number | null {
  if (texto === "" || texto === "-") return null;
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * EM QUANTOS QUILOS ISSO VIRA — e `null` quando isso não é uma medida.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A UNIDADE NÃO É DEDUZIDA DO TAMANHO DO NÚMERO                 │
 * │                                                                      │
 * │ "5" na coluna de peso é cinco quilos, não cinco gramas — quem digita  │
 * │ "5" numa receita quer cinco quilos. Mas quem digita "5" na mesma      │
 * │ coluna pensando em gramas quer cinco gramas. A mesma célula, duas     │
 * │ leituras, e nada no número que as separe.                             │
 * │                                                                      │
 * │ A saída não é adivinhar: é EXIGIR a marca. Quem escreve sem unidade   │
 * │ está dizendo que a unidade é a da coluna — que é `kg` em toda a       │
 * │ planilha. Quem escreve "g" ou "gramas" está dizendo outra coisa, e    │
 * │ dizendo de propósito.                                                 │
 * │                                                                      │
 * │ É a mesma regra que a etapa de normalização da importação já segue:   │
 * │ a unidade declarada manda; sem declaração, vale a do contexto.         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function emQuilos(bruto: string): number | null {
  const texto = bruto.trim().toLowerCase();
  if (texto === "") return null;

  /*
    QUANDO A UNIDADE ESTÁ ESCRITA, "1.234" DEIXA DE SER AMBÍGUO.

    Isolado, um ponto com três dígitos depois tem duas leituras e a função
    acima recusa. Em "1.234 g" não há escolha a fazer: a unidade está
    declarada, e num contexto de peso em português o ponto ali só pode ser
    separador de milhar. Recusar seria recusar uma medida que ela escreveu
    de forma perfeitamente legível.

    A concessão é ESTREITA de propósito — só o padrão de milhar exato
    (`1.234`, `1.234.567`). Todo o resto continua passando por
    `numeroDigitado`, com as recusas dele valendo.
  */
  const comUnidade = /^(-?[\d.,\s]+?)\s*(kg|quilos?|g|gramas?)$/.exec(texto);
  if (comUnidade?.[1] !== undefined) {
    const limpo = comUnidade[1].replace(/\s/g, "");
    const numero = /^-?\d{1,3}(\.\d{3})+$/.test(limpo)
      ? conversao(limpo.replace(/\./g, ""))
      : numeroDigitado(limpo);
    if (numero === null) return null;
    // O grupo 2 é a unidade; `kg` e `quilos` já não são gramas.
    return /^(kg|quilos?)$/.test(comUnidade[2] ?? "") ? numero : numero / 1000;
  }

  return numeroDigitado(texto);
}

/**
 * A MEDIDA DIGITADA, NO FORMATO EM QUE A CÉLULA A GUARDA — ou `undefined`
 * quando o texto não é uma medida reconhecível.
 *
 * `undefined` e `null` querem dizer coisas diferentes aqui, e a diferença é o
 * motivo de esta função existir separada:
 *
 *   `undefined` — "não sei o que isto é". A célula MANTÉM o texto original,
 *                 para a Érika ver o que digitou e corrigir.
 *   `null`      — "sei o que é: vazio". A célula fica vazia, que é diferente
 *                 de conter zero.
 */
export function medidaDigitada(bruto: string): number | null | undefined {
  if (bruto.trim() === "") return null;
  const quilos = emQuilos(bruto);
  return quilos === null ? undefined : quilos;
}

/** Uma linha de dados, a partir de um objeto simples. */
export function dados(celulas: Readonly<Record<string, CelulaGrade>>): LinhaGrade {
  return { tipo: "dados", celulas };
}

/**
 * A CHAVE DE UMA MARCAÇÃO — `"Ficha::G4"`.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A ABA E O ENDEREÇO, NESTA ORDEM E COM ESTE SEPARADOR         │
 * │                                                                      │
 * │ A ABA ENTRA porque dois modelos diferentes podem ter uma folha com o   │
 * │ MESMO nome — "Base" existe na ficha técnica e nos custos — e uma       │
 * │ marcação amarela feita na ficha apareceria na planilha de custos, no    │
 * │ mesmo endereço. É o mesmo vazamento que a camada de edições já teve de  │
 * │ fechar, chegando por um segundo caminho.                              │
 * │                                                                      │
 * │ O ENDEREÇO ENTRA porque é o nome que qualquer pessoa que usa planilha  │
 * │ reconhece: "marquei a G4" é uma frase que se diz em voz alta, e          │
 * │ `linha 12, coluna 7` não é.                                           │
 * │                                                                      │
 * │ A REGRA MORA AQUI, e não escrita à mão no componente, porque ela é      │
 * │ lida em dois pontos — ao gravar a marcação e ao consultá-la — e duas     │
 * │ cópias divergiriam no dia em que uma delas mudasse. Divergir aqui        │
 * │ significaria uma marcação que existe e não pinta.                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function chaveDaMarcacao(aba: string, linha: number, coluna: number): string {
  return `${aba}::${endereco(linha, coluna)}`;
}

/**
 * A MARCAÇÃO DE UMA LINHA INTEIRA, PELA CHAVE DA COLUNA A.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A COLUNA A REPRESENTA A LINHA                                │
 * │                                                                      │
 * │ "Marcar uma linha de amarelo" é o primeiro gesto que o briefing        │
 * │ descreve, e ele precisa de um endereço como qualquer outro. A coluna A │
 * │ é a escolha: é a primeira célula, é onde a linha é nomeada, e é o      │
 * │ endereço que alguém apontaria ao dizer "esta linha aqui".              │
 * │                                                                      │
 * │ A regra fica em FUNÇÃO, e não como um `if (coluna === 1)` no meio da   │
 * │ barra, para que "linha" e "célula" sejam duas perguntas vizinhas — e    │
 * │ para que a barra não precise saber que endereço é esse.                │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function chaveDaLinha(aba: string, linha: number): string {
  return chaveDaMarcacao(aba, linha, 1);
}

/** "G4" → a coluna 7. `null` quando o endereço não tem a forma esperada. */
export function colunaDoEndereco(end: string): number | null {
  const m = /^([A-Z]+)\d+$/.exec(end.trim().toUpperCase());
  if (!m?.[1]) return null;
  let n = 0;
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n > 0 ? n : null;
}

/**
 * A FOLHA COM A MARCAÇÃO JÁ DENTRO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE MATERIALIZAR, EM VEZ DE CONSULTAR O MAPA NA HORA DE DESENHAR  │
 * │                                                                      │
 * │ O mapa de marcação — `"Ficha::G4" → { fundo: "#fdf0b2" }` — é a forma  │
 * │ que a TELA guarda, porque é a forma que sobrevive à troca de aba: o     │
 * │ endereço identifica a célula em qualquer folha.                        │
 * │                                                                      │
 * │ A grade, porém, guarda estilo em `estilo` (a linha) e                 │
 * │ `estilosCelulas` (as células) — porque é a forma que o ARQUIVO entende. │
 * │ Duas representações do mesmo fato, e a ponte entre elas tem de ser UMA   │
 * │ só.                                                                   │
 * │                                                                      │
 * │ Se a tela traduzisse o mapa por conta própria e o arquivo recebesse o   │
 * │ mapa cru, os dois caminhos divergiriam — e a divergência seria a        │
 * │ planilha amarela na tela e branca no Excel, que é o defeito silencioso   │
 * │ que este módulo existe para impedir.                                   │
 * │                                                                      │
 * │ POR ISSO A FUNÇÃO ESTÁ AQUI, NO MÓDULO PURO: ela roda no navegador      │
 * │ (antes de desenhar) e no servidor (antes de escrever), e as duas pontas  │
 * │ executam o MESMO código.                                              │
 * │                                                                      │
 * │ A COLUNA A É A LINHA. Se o endereço tem a coluna 1 e a folha tem mais   │
 * │ de uma coluna, a marcação vale para a linha inteira; senão, para a       │
 * │ célula. Numa folha de uma coluna só — uma aba de anotações — a          │
 * │ distinção não existe, e a marcação de célula pinta a célula, que é a     │
 * │ linha toda de qualquer jeito.                                         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function aplicarPincelNaFolha(
  folha: FolhaGrade,
  pincel: Readonly<Record<string, EstiloGrade>> | undefined
): FolhaGrade {
  if (pincel === undefined) return folha;

  const prefixo = `${folha.nome}::`;
  const daFolha: { linha: number; chave: string | undefined; estilo: EstiloGrade }[] = [];

  for (const [chave, estilo] of Object.entries(pincel)) {
    if (!chave.startsWith(prefixo)) continue;
    const end = chave.slice(prefixo.length);
    const coluna = colunaDoEndereco(end);
    const numeroDaLinha = Number(end.replace(/^[A-Z]+/, ""));
    if (coluna === null || !Number.isInteger(numeroDaLinha)) continue;

    const indice = numeroDaLinha - (folha.linhaInicial ?? 3);
    if (indice < 0 || indice >= folha.linhas.length) continue;

    const ehLinhaInteira = coluna === 1 && folha.colunas.length > 1;
    const chaveDaColuna = ehLinhaInteira ? undefined : folha.colunas[coluna - 1]?.chave;
    if (!ehLinhaInteira && chaveDaColuna === undefined) continue;

    daFolha.push({ linha: indice, chave: chaveDaColuna, estilo });
  }

  if (daFolha.length === 0) return folha;

  const linhas = folha.linhas.map((item, i) => {
    let atual = item;
    for (const marca of daFolha) {
      if (marca.linha !== i) continue;
      atual = comEstiloNaLinha(atual, marca.chave, marca.estilo);
    }
    return atual;
  });

  return { ...folha, linhas };
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

/**
 * A FAIXA DE NOMES DO TOPO DE UMA FICHA — um por coluna.
 *
 * É uma linha só, e é a mesma linha que a grade de ingredientes usa: ao
 * contrário do `campo`, que ocupa duas colunas, esta atravessa a grade inteira,
 * uma célula por coluna. É o que permite os nomes caírem exatamente em cima dos
 * números que eles nomeiam.
 */
export function rotulos(rotulos: readonly string[]): LinhaGrade {
  return { tipo: "rotulos", rotulos };
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
