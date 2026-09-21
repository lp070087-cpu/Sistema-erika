/**
 * AS QUATRO PORTAS DE ENTRADA — PDF, EXCEL, TEXTO E FOTO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UMA ESTEIRA SÓ, E NÃO QUATRO SISTEMAS                        │
 * │                                                                      │
 * │ A tentação é tratar cada formato como um recurso próprio: uma tela de  │
 * │ PDF, uma de planilha, uma de texto colado, uma de foto. Seriam quatro  │
 * │ caminhos fazendo a mesma coisa em quatro cópias — ler, conferir,       │
 * │ calcular, gerar —, e a segunda cópia começa a divergir da primeira na   │
 * │ primeira correção. Um formato novo viraria um quinto sistema.          │
 * │                                                                      │
 * │ Aqui o formato decide UMA coisa só: QUEM LÊ o arquivo. Depois disso o   │
 * │ caminho é um, e é o do briefing:                                       │
 * │                                                                      │
 * │   origem → extração → normalização → sanitização → validação →         │
 * │   conferência → destino                                               │
 * │                                                                      │
 * │ É por isso que este arquivo existe. Ele é a lista das portas, e a      │
 * │ conferência não sabe — nem precisa saber — por qual delas ela entrou.  │
 * │ Ela não tem quatro telas de conferência porque não tem quatro          │
 * │ conferências: tem uma, e o dado que chega nela tem sempre a mesma       │
 * │ forma (`LinhaExtraida`) venha de onde vier.                           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LISTA CONTINUA MOSTRANDO O QUE AINDA NÃO LÊ                │
 * │                                                                      │
 * │ Excel, texto e foto entram pela mesma porta e continuam na lista       │
 * │ mesmo quando o leitor delas ainda não está ligado. É a mesma decisão    │
 * │ de `SeletorDeModelo`, que mantém na lista a planilha que ainda não      │
 * │ sai: esconder faria o sistema parecer menor do que é, e ela não teria   │
 * │ como saber que existe uma porta esperando ser ligada.                  │
 * │                                                                      │
 * │ Cada uma diz o próprio estado com as palavras dela — e a frase que      │
 * │ importa é a do leitor, não um selo genérico de "indisponível".         │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { DocumentExtractor } from "./tipos";
import { leitorImagem } from "./leitor-imagem";
import { leitorLocal } from "./leitor-local";
import { leitorPlanilha } from "./leitor-planilha";
import { leitorTexto } from "./leitor-texto";

/** As quatro portas. O `as const` é o que permite derivar o tipo delas. */
export const IDS_DAS_ORIGENS = ["pdf", "excel", "texto", "foto"] as const;

export type IdDaOrigem = (typeof IDS_DAS_ORIGENS)[number];

/** A porta de entrada do sistema até esta rodada — a que os links antigos usam. */
export const ORIGEM_PADRAO: IdDaOrigem = "pdf";

/* ─────────────────────────────────────────────────────────────────────── *
 * A ASSINATURA DOS BYTES
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * O QUE DISTINGUE UM ARQUIVO DE VERDADE, E O QUE NÃO DISTINGUE NADA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A PERGUNTA QUE ESTE TIPO RESPONDE                                   │
 * │                                                                      │
 * │ "Existe um começo que todo arquivo deste tipo traga?"                │
 * │                                                                      │
 * │ Para PDF, planilha e imagem: existe. São os primeiros bytes do        │
 * │ arquivo, e é a única checagem da lista de segurança que não se        │
 * │ satisfaz escrevendo a palavra certa num campo — renomear um executável │
 * │ para `.pdf` muda o nome, não os bytes.                                │
 * │                                                                      │
 * │ Para TEXTO: NÃO existe. Não há sequência de bytes que todo `.txt`      │
 * │ comece trazendo, porque texto é exatamente o que sobra quando não há   │
 * │ formato. Inventar uma assinatura aqui seria pior que não ter nenhuma:  │
 * │ ela recusaria arquivos legítimos e daria a impressão de que o conteúdo │
 * │ foi verificado.                                                       │
 * │                                                                      │
 * │ Por isso o tipo tem DOIS casos, e o segundo é uma resposta — com o     │
 * │ motivo escrito — e não um campo vazio. Um `null` no lugar dele seria   │
 * │ indistinguível de "esqueci de preencher".                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type Assinatura =
  | {
      readonly tipo: "bytes";
      /**
       * Quantos bytes precisam ser lidos para decidir.
       *
       * Ele existe para a leitura ser do tamanho da pergunta. PDF se decide
       * com cinco bytes; a planilha precisa de mais porque a assinatura dela
       * não está no começo — ver `reconheceAbaixo`.
       */
      readonly amostra: number;
      readonly reconhece: (cabeca: Uint8Array) => boolean;
      /** O que a assinatura é, em palavras — para a tela poder explicá-la. */
      readonly rotulo: string;
    }
  | {
      readonly tipo: "ausente";
      /** Por que não há assinatura. Escrito para ela ler, não para o log. */
      readonly motivo: string;
    };

/* ─────────────────────────────────────────────────────────────────────── *
 * A ORIGEM
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * UMA DAS QUATRO PORTAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA É UMA TABELA DE DADOS, E NÃO QUATRO `if` NA TELA        │
 * │                                                                      │
 * │ A tela precisa de sete coisas por origem: o rótulo, o selo do arquivo, │
 * │ a frase da área de soltar, a explicação da etapa, a lista de extensões, │
 * │ os tipos declarados e o leitor.                                        │
 * │                                                                      │
 * │ Espalhar isso em `if` pela tela faria acrescentar um formato exigir     │
 * │ mexer em cinco arquivos — e o sexto ficaria esquecido, com o defeito    │
 * │ aparecendo na tela como um rótulo em branco. Numa tabela, o formato     │
 * │ novo é uma entrada, e o compilador cobra o resto: `Origem` tem campos   │
 * │ obrigatórios, e uma entrada incompleta não compila.                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type Origem = {
  readonly id: IdDaOrigem;
  /** O nome da porta, como ela aparece na lista do botão IMPORTAR. */
  readonly rotulo: string;
  /** O que ela traz, em uma linha. */
  readonly descricao: string;
  /** O selo do arquivo escolhido. Até quatro letras: é uma tarja, não um rótulo. */
  readonly sigla: string;
  /** O nome curto, no meio de uma frase: "Arraste a planilha aqui…". */
  readonly curto: string;
  /** A frase da área de soltar. Escrita à mão porque o artigo muda de um para outro. */
  readonly instrucao: string;
  /** A linha da etapa 1. */
  readonly explicacao: string;
  readonly extensoes: readonly string[];
  readonly tipos: readonly string[];
  /**
   * UMA EXTENSÃO PARECIDA QUE MERECE UMA RECUSA PRÓPRIA.
   *
   * O `.xls` é o caso que a criou. Ele cai na recusa genérica de "só arquivos
   * Excel entram aqui", e essa frase não ajuda: o arquivo ESTÁ em Excel — só
   * está na versão antiga, que o leitor não abre. A instrução útil é "exporte
   * como .xlsx", e não "escolha um arquivo do tipo certo" quando ele já é do
   * tipo certo.
   */
  readonly recusaEspecifica?: {
    readonly extensao: string;
    readonly titulo: string;
    readonly motivo: string;
    readonly acao: string;
  };
  readonly assinatura: Assinatura;
  readonly leitor: DocumentExtractor;
  /**
   * Esta porta também aceita COLAR, sem arquivo nenhum?
   *
   * É `true` só no texto, e isso não é simetria faltando: uma ficha em PDF não
   * existe em forma de texto colado, e uma foto não se cola. O que se cola é
   * uma lista de ingredientes, e é exatamente o que a porta de texto recebe.
   */
  readonly colavel: boolean;
};

/* ─────────────────────────────────────────────────────────────────────── *
 * AS ASSINATURAS, UMA A UMA
 * ─────────────────────────────────────────────────────────────────────── */

const INICIO_PDF = [0x25, 0x50, 0x44, 0x46, 0x2d] as const; // "%PDF-"
const INICIO_ZIP = [0x50, 0x4b, 0x03, 0x04] as const; // "PK\3\4"
const INICIO_JPEG = [0xff, 0xd8, 0xff] as const;
const INICIO_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] as const;
const INICIO_RIFF = [0x52, 0x49, 0x46, 0x46] as const; // "RIFF"
const MARCA_WEBP = [0x57, 0x45, 0x42, 0x50] as const; // "WEBP"

/** A marca que o formatos OOXML (`.xlsx`, `.docx`, `.pptx`) traz como primeira entrada. */
const PRIMEIRA_ENTRADA_OOXML = "[Content_Types].xml";

function comecaCom(cabeca: Uint8Array, inicio: readonly number[]): boolean {
  if (cabeca.length < inicio.length) return false;
  for (let i = 0; i < inicio.length; i++) {
    if (cabeca[i] !== inicio[i]) return false;
  }
  return true;
}

/**
 * Os bytes lidos como texto latin-1, para PROCURAR um trecho.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO AQUI É UMA BUSCA DE TEXTO E NÃO UMA DECODIFICAÇÃO       │
 * │                                                                      │
 * │ Um `.xlsx` é um arquivo ZIP, e o ZIP grava o NOME de cada entrada no   │
 * │ cabeçalho local SEM COMPACTAR — inclusive o nome da primeira, que em   │
 * │ todo arquivo do Office é `[Content_Types].xml`.                        │
 * │                                                                      │
 * │ Então o nome procurado aparece literal nos primeiros bytes do arquivo, │
 * │ e encontrá-lo não exige descompactar nada nem entender formato nenhum. │
 * │ O latin-1 é usado porque cada byte vira exatamente um caractere, sem    │
 * │ substituição: nenhum byte é descartado, e um nome em ASCII aparece      │
 * │ inteiro.                                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO BASTA `PK` PARA DIZER QUE É UMA PLANILHA                 │
 * │                                                                      │
 * │ Porque o mesmo `PK\3\4` abre `.docx`, `.pptx`, `.odt`, `.epub`, um     │
 * │ `.jar` e qualquer `.zip` comum. Aceitar só o `PK` seria aceitar um      │
 * │ contrato do Word como planilha de custos — e a recusa aconteceria      │
 * │ depois, dentro do leitor, com uma mensagem sobre formato inválido que   │
 * │ não diz nada sobre o que ela escolheu de errado.                        │
 * │                                                                      │
 * │ A `[Content_Types].xml` é a marca que separa o formato do Office dos    │
 * │ outros pacotes ZIP, e ainda deixa passar um `.docx` — mas esse morre no  │
 * │ leitor, que diz que não achou nenhuma aba. É a diferença entre uma       │
 * │ recusa genérica na porta e uma explicação onde o problema está.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function contemTexto(cabeca: Uint8Array, alvo: string): boolean {
  let texto = "";
  for (let i = 0; i < cabeca.length; i++) texto += String.fromCharCode(cabeca[i] ?? 0);
  return texto.includes(alvo);
}

const ASSINATURA_PDF: Assinatura = {
  tipo: "bytes",
  amostra: INICIO_PDF.length,
  reconhece: (cabeca) => comecaCom(cabeca, INICIO_PDF),
  rotulo: "todo PDF começa com %PDF-",
};

const ASSINATURA_PLANILHA: Assinatura = {
  tipo: "bytes",
  // 512 bytes cobrem o cabeçalho local do ZIP, o nome da primeira entrada e a
  // estrutura do arquivo. Ler o .xlsx inteiro para conferir seria carregar
  // vinte megabytes de planilha para responder uma pergunta de cinco bytes.
  amostra: 512,
  reconhece: (cabeca) =>
    comecaCom(cabeca, INICIO_ZIP) && contemTexto(cabeca, PRIMEIRA_ENTRADA_OOXML),
  rotulo: "todo .xlsx é um pacote ZIP com [Content_Types].xml como primeira entrada",
};

const ASSINATURA_IMAGEM: Assinatura = {
  tipo: "bytes",
  // Doze bytes: os quatro do `RIFF` e os quatro do `WEBP` estão separados por
  // quatro bytes de tamanho, então a WebP é a única que precisa passar dos
  // primeiros quatro.
  amostra: 12,
  reconhece: (cabeca) =>
    comecaCom(cabeca, INICIO_JPEG) ||
    comecaCom(cabeca, INICIO_PNG) ||
    (comecaCom(cabeca, INICIO_RIFF) && comecaCom(cabeca.subarray(8), MARCA_WEBP)),
  rotulo: "JPEG começa com FF D8 FF, PNG com 89 50 4E 47, WebP com RIFF e WEBP",
};

const ASSINATURA_TEXTO: Assinatura = {
  tipo: "ausente",
  motivo:
    "Um arquivo de texto não tem começo próprio: não existe uma sequência de bytes que todo .txt traga no " +
    "início, porque texto é justamente o que sobra quando não há formato. Aqui o nome e o tipo declarado " +
    "são a única identificação — e o conteúdo é lido como TEXTO, nunca como código.",
};

/* ─────────────────────────────────────────────────────────────────────── *
 * AS QUATRO PORTAS
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * A ORDEM DESTA LISTA É A ORDEM DO MENU, e ela não é alfabética: é a ordem em
 * que os formatos chegam na mesa dela. A ficha em PDF é o que existe hoje; a
 * planilha antiga do cliente vem depois; a lista copiada do WhatsApp é o
 * caminho rápido; a foto do caderno é o que ela tem em mãos quando não há mais
 * nada. Trocar a ordem aqui reordena o menu e mais nada.
 */
export const ORIGENS: readonly Origem[] = [
  {
    id: "pdf",
    rotulo: "PDF",
    descricao: "Uma ficha, um orçamento ou uma planilha antiga salva em PDF.",
    sigla: "PDF",
    curto: "PDF",
    instrucao: "Arraste o PDF da ficha aqui, ou escolha o arquivo.",
    explicacao: "O PDF da ficha, do caderno de receitas ou da planilha antiga — o que você tiver em mãos.",
    extensoes: [".pdf"],
    tipos: ["application/pdf"],
    assinatura: ASSINATURA_PDF,
    leitor: leitorLocal,
    colavel: false,
  },
  {
    id: "excel",
    rotulo: "Excel",
    descricao: "O arquivo .xlsx, com as colunas do jeito que estiverem.",
    sigla: "XLSX",
    curto: "planilha",
    instrucao: "Arraste a planilha aqui, ou escolha o arquivo.",
    explicacao: "A planilha de custos ou de fornecedores, em .xlsx — a que já existe no computador.",
    extensoes: [".xlsx"],
    tipos: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
    /*
      O `.xls` ANTIGO MERECE UMA FRASE PRÓPRIA, e ela diz o que fazer.

      "Só arquivos Excel entram aqui" seria uma resposta errada para um arquivo
      que É Excel: ele está na versão antiga, de antes do Office 2007, e nenhum
      leitor de `.xlsx` abre. O caminho dela é abrir no Excel e salvar como
      `.xlsx` — e é isso que a frase precisa dizer.
    */
    recusaEspecifica: {
      extensao: ".xls",
      titulo: "Esta planilha está no formato antigo",
      motivo:
        "O arquivo é um .xls, de antes de 2007. O sistema lê .xlsx, e os dois formatos não são o mesmo arquivo com outra extensão — renomear não resolve.",
      acao: "Abra a planilha no Excel, escolha Salvar como e selecione o tipo .xlsx. Envie o arquivo novo.",
    },
    assinatura: ASSINATURA_PLANILHA,
    leitor: leitorPlanilha,
    colavel: false,
  },
  {
    id: "texto",
    rotulo: "Texto",
    descricao: "Lista digitada ou copiada de outro lugar — uma linha por ingrediente.",
    sigla: "TXT",
    curto: "texto",
    instrucao: "Arraste o arquivo de texto aqui, ou escolha o arquivo.",
    explicacao: "A lista copiada de outro sistema, do WhatsApp ou de um e-mail — ou o arquivo .txt salvo.",
    extensoes: [".txt", ".csv", ".tsv"],
    tipos: ["text/plain", "text/csv", "text/tab-separated-values"],
    assinatura: ASSINATURA_TEXTO,
    leitor: leitorTexto,
    colavel: true,
  },
  {
    id: "foto",
    rotulo: "Foto",
    descricao: "Uma foto da página do caderno ou da ficha em papel.",
    sigla: "IMG",
    curto: "foto",
    instrucao: "Arraste a foto aqui, ou escolha o arquivo.",
    explicacao: "A página do caderno fotografada com o celular. O sistema guarda a imagem; ler o que está escrito nela é outro serviço.",
    extensoes: [".jpg", ".jpeg", ".png", ".webp"],
    tipos: ["image/jpeg", "image/png", "image/webp"],
    assinatura: ASSINATURA_IMAGEM,
    leitor: leitorImagem,
    colavel: false,
  },
];

/* ─────────────────────────────────────────────────────────────────────── *
 * O ACESSO
 * ─────────────────────────────────────────────────────────────────────── */

/** A porta pelo identificador. Nunca devolve `undefined`: ver abaixo. */
export function origemDe(id: IdDaOrigem): Origem {
  /*
    O `?? ORIGENS[0]` PARECE DESCUIDO E É O CONTRÁRIO.

    `id` é uma união fechada de quatro literais, e as quatro existem na lista —
    então o `find` nunca falha. O TypeScript não sabe disso, e o
    `noUncheckedIndexedAccess` do projeto ainda acrescenta um `undefined` por
    conta própria.

    A saída seria `!`, que desliga a checagem para sempre. Esta devolve a porta
    de PDF no caso impossível, e é a resposta certa: PDF é a origem padrão do
    sistema (`ORIGEM_PADRAO`), e uma tela que abrisse a porta errada por um
    instante seria pior que uma tela que abre a porta de sempre.
  */
  return ORIGENS.find((o) => o.id === id) ?? ORIGENS[0]!;
}

/** O `?origem=` da URL, quando ele é uma das quatro. Qualquer outra coisa é `null`. */
export function origemDaUrl(valor: string | undefined | null): IdDaOrigem | null {
  if (!valor) return null;
  const id = valor.trim().toLowerCase();
  return (IDS_DAS_ORIGENS as readonly string[]).includes(id) ? (id as IdDaOrigem) : null;
}

/** O rótulo da extensão de um arquivo, para a recusa dizer o que ela escolheu. */
export function extensaoDe(nome: string): string {
  return /\.[a-z0-9]+$/.exec(nome.toLowerCase())?.[0] ?? "sem extensão";
}
