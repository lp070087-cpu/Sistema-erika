/**
 * A ROTA QUE ABRE UM `.xlsx` E DEVOLVE AS LINHAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LEITURA ACONTECE NO SERVIDOR, SE O ARQUIVO É DELA          │
 * │                                                                      │
 * │ A resposta fácil seria ler no navegador: o arquivo já está lá, o       │
 * │ usuário escolheu no `input`, e `exceljs` sabe rodar no browser. Não     │
 * │ teria ida e volta de rede, e a planilha nem sairia do computador dela. │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ POR QUE ISSO NÃO FOI FEITO                                       │ │
 * │ │                                                                  │ │
 * │ │ Porque `exceljs` no navegador significa `exceljs` no pacote que   │ │
 * │ │ a Érika baixa ao abrir a tela. E a regra que sustenta TODAS as     │ │
 * │ │ planilhas deste sistema — está escrita em `gerador.ts` e em        │ │
 * │ │ `grade.ts` — é que a biblioteca não vaza para o cliente: ela       │ │
 * │ │ arrasta dependências de Node que o navegador não tem, e qualquer   │ │
 * │ │ tela que a importasse passaria a carregar tudo isso antes de       │ │
 * │ │ desenhar o primeiro pixel.                                         │ │
 * │ │                                                                  │ │
 * │ │ Trocar essa regra para economizar uma ida e volta seria pagar com  │ │
 * │ │ o peso de toda tela do sistema para acelerar uma tela que se usa   │ │
 * │ │ de vez em quando. Não compensa, e a regra fica.                    │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ O que volta desta rota NÃO é o arquivo, nem uma grade, nem um `.xlsx`  │
 * │ reescrito: é a leitura — texto. Ela não interpreta, não normaliza       │
 * │ número, não decide unidade, não julga nada. Quem faz isso é a          │
 * │ conferência, no cliente, depois de tudo passar por `normalizar.ts`.    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA ROTA RECUSA, E POR QUE ELA DESCONFIA DO ARQUIVO           │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Não executar conteúdo do documento."                             │ │
 * │ │ "Não usar conteúdo vindo do arquivo diretamente na interface."     │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Um `.xlsx` é um ZIP com XML dentro, e XML pode carregar coisa pior     │
 * │ que texto. Três defesas, e cada uma responde a um risco concreto:      │
 * │                                                                      │
 * │  · o tamanho, antes de qualquer leitura — porque um arquivo de trinta   │
 * │    megabytes não é uma lista de ingredientes, e descobrir isso depois  │
 * │    de carregá-lo inteiro na memória é descobrir tarde;                 │
 * │                                                                      │
 * │  · a assinatura, que confere se os bytes são mesmo um pacote do Office │
 * │    — é a mesma checagem de `origens.ts`, feita aqui de novo porque um  │
 * │    `curl` não passa pela tela;                                      │
 * │                                                                      │
 * │  · o teto de linhas e colunas lidas, porque um ZIP pequeno pode        │
 * │    descompactar para uma planilha de dois milhões de linhas — e a      │
 * │    memória acaba antes da paciência.                                   │
 * │                                                                      │
 * │ O que NUNCA acontece: nada do arquivo vira código. O ExcelJS lê os     │
 * │ dados e devolve VALORES; não há `eval`, não há macro, não há fórmula   │
 * │ executada. Uma célula com `={cmd}` chega aqui como o texto `={cmd}` e  │
 * │ sai daqui como o texto `={cmd}` — e a conferência a mostra como texto  │
 * │ para ela ver que a planilha tinha uma fórmula em vez de um número.     │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import {
  documentoDaAba,
  escolherAba,
  nomeDaAba,
} from "@/lib/planilhas/importacao/mapear-planilha";
import type { AbaLida } from "@/lib/planilhas/importacao/mapear-planilha";
import type { ResultadoDaExtracao } from "@/lib/planilhas/importacao/tipos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * O TETO DO ARQUIVO, e ele é o mesmo da tela.
 *
 * Vinte megabytes é o que `seguranca.ts` já aceita para um PDF. Repetir o
 * número aqui não é redundância: a checagem do cliente protege o usuário de
 * mandar um arquivo que não vai passar, e a do servidor protege o servidor de
 * quem não passou pela tela. As duas precisam existir, e precisam concordar.
 */
const TAMANHO_MAXIMO = 20 * 1024 * 1024;

/*
  OS TETOS DA LEITURA.

  Uma ficha técnica real tem dezenas de ingredientes. Cinco mil linhas é cem
  vezes isso, e vinte colunas é mais do que qualquer tabela de insumos tem —
  inclusive as que vêm com colunas de imposto, fornecedor e código no meio.

  Eles existem porque o tamanho em bytes não limita o que o ZIP CONTÉM: um
  arquivo de duzentos kilobytes pode descompactar para uma planilha enorme, e
  o teto de bytes não veria nada.
*/
const MAXIMO_DE_LINHAS = 5000;
const MAXIMO_DE_COLUNAS = 64;

/** Os primeiros bytes de todo `.xlsx`. Ver a explicação longa em `origens.ts`. */
const INICIO_ZIP = [0x50, 0x4b, 0x03, 0x04] as const;
const PRIMEIRA_ENTRADA_OOXML = "[Content_Types].xml";

function ehPacoteDoOffice(cabeca: Uint8Array): boolean {
  if (cabeca.length < INICIO_ZIP.length) return false;
  for (let i = 0; i < INICIO_ZIP.length; i++) {
    if (cabeca[i] !== INICIO_ZIP[i]) return false;
  }

  let texto = "";
  for (let i = 0; i < cabeca.length; i++) texto += String.fromCharCode(cabeca[i] ?? 0);
  return texto.includes(PRIMEIRA_ENTRADA_OOXML);
}

/** A recusa, no mesmo formato que a tela já sabe ler. */
function recusar(estado: "INDISPONIVEL" | "VAZIO" | "FALHOU", motivo: string): NextResponse {
  return NextResponse.json({ estado, motivo } satisfies ResultadoDaExtracao);
}

/**
 * A EXTRAÇÃO.
 *
 * Ela devolve `ResultadoDaExtracao` — o MESMO tipo que o leitor de PDF
 * devolve —, e isso é o que faz a esteira ser uma só. A tela não tem um
 * caminho para "veio de Excel" e outro para "veio de PDF": ela chama um
 * leitor, recebe um `ResultadoDaExtracao`, e segue.
 */
export async function POST(requisicao: NextRequest): Promise<NextResponse> {
  let arquivo: File | null = null;

  try {
    const formulario = await requisicao.formData();
    const enviado = formulario.get("arquivo");
    if (enviado instanceof File) arquivo = enviado;
  } catch {
    return recusar("FALHOU", "Não foi possível ler o arquivo enviado. Tente escolher de novo.");
  }

  if (arquivo === null) {
    return recusar("FALHOU", "Nenhum arquivo chegou junto com o pedido. Escolha a planilha de novo.");
  }

  if (arquivo.size === 0) {
    return recusar("VAZIO", "O arquivo chegou vazio — nenhum byte. Ele pode ter sido salvo pela metade.");
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    return recusar(
      "FALHOU",
      "A planilha é maior do que o sistema lê de uma vez. Se ela tiver mais de uma aba, salve só a aba da lista em um arquivo novo e envie esse."
    );
  }

  const bytesDaCabeca = new Uint8Array(await arquivo.slice(0, 512).arrayBuffer());
  if (!ehPacoteDoOffice(bytesDaCabeca)) {
    return recusar(
      "FALHOU",
      "Este arquivo não é uma planilha do Excel (.xlsx). Confira se ele não é um .xls, um PDF ou um arquivo compactado renomeado."
    );
  }

  let abas: AbaLida[] = [];
  let nomes: string[] = [];

  try {
    const buffer = await arquivo.arrayBuffer();
    const pasta = new ExcelJS.Workbook();
    await pasta.xlsx.load(buffer as unknown as ExcelJS.Buffer);

    /*
      A ORDEM E OS NOMES SÃO PRESERVADOS.

      O nome da aba vai para a tela — é ele que permite a Érika abrir o
      arquivo no Excel e achar exatamente de onde veio a linha. Perdê-lo
      economizaria um vetor de strings e custaria a única pista de
      localização que a planilha tem.
    */
    const planilhas = pasta.worksheets;
    nomes = planilhas.map((p) => p.name);

    abas = planilhas.map((p) => {
      const linhas: unknown[][] = [];
      const ultima = Math.min(p.rowCount, MAXIMO_DE_LINHAS);

      for (let n = 1; n <= ultima; n++) {
        const linha = p.getRow(n);
        const celulas: unknown[] = [];
        const ultimaColuna = Math.min(linha.cellCount, MAXIMO_DE_COLUNAS);

        for (let c = 1; c <= ultimaColuna; c++) {
          /*
            A CÉLULA É LIDA PELO VALOR, E NÃO PELO RESULTADO EXIBIDO.

            `celula.value` é o que o arquivo guarda: número, texto, data,
            `{ formula, result }` ou `{ richText }`. O texto que o Excel
            MOSTRA depende da formatação e do idioma do Excel de quem abriu —
            formatar aqui daria o número de um jeito numa máquina e de outro
            na outra. Quem decide como o número se escreve é `normalizar.ts`,
            uma vez só, no cliente.

            A única exceção é `result` de fórmula, que `textoDeCelula` já
            sabe extrair — e por isso a fórmula é passada inteira, sem
            tratamento aqui.
          */
          celulas.push(linha.getCell(c).value);
        }

        linhas.push(celulas);
      }

      return { nome: p.name, linhas };
    });
  } catch {
    return recusar(
      "FALHOU",
      "O arquivo tem a assinatura de uma planilha, mas não foi possível abri-lo. Ele pode estar corrompido ou protegido por senha."
    );
  }

  if (abas.length === 0) {
    return recusar("VAZIO", "A planilha não tem nenhuma aba.");
  }

  const escolhida = escolherAba(abas);
  const aba = abas[escolhida];

  if (!aba) {
    return recusar("VAZIO", "A planilha não tem nenhuma aba com conteúdo.");
  }

  const documento = documentoDaAba(aba.linhas, nomeDaAba(aba.nome, escolhida + 1, abas.length));

  if (documento.linhas.length === 0) {
    return recusar(
      "VAZIO",
      `A aba "${aba.nome}" foi aberta, mas não há nenhuma linha com dados nela. Se a lista estiver em outra aba, abra o arquivo e confira qual delas tem a tabela.`
    );
  }

  /*
    O NOME DO ARQUIVO VAI JUNTO, e não é enfeite.

    Uma planilha de ficha costuma trazer o nome do prato escondido no arquivo
    ("FICHA BOLO DE CENOURA.xlsx"). Quando o cabeçalho do documento não tem
    título, é esse nome que a conferência oferece — e é melhor que a Érika
    corrija um palpite razoável do que digite tudo do zero.
  */
  return NextResponse.json({
    estado: "OK",
    documento,
    arquivo: { nome: arquivo.name, abas: nomes, abaEscolhida: escolhida },
  } satisfies ResultadoDaExtracao & {
    arquivo: { nome: string; abas: string[]; abaEscolhida: number };
  });
}
