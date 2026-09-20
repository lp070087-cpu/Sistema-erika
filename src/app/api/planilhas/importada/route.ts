/**
 * A ROTA QUE ENTREGA O .XLSX DA PLANILHA IMPORTADA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UMA ROTA SEPARADA, E NÃO UM PARÂMETRO NA EXISTENTE           │
 * │                                                                      │
 * │ A rota `/api/planilhas/[modelo]` monta a planilha NO SERVIDOR, a      │
 * │ partir de um `cliente` da URL: ela lê o repositório, resolve os        │
 * │ insumos e chama o gerador do modelo.                                  │
 * │                                                                      │
 * │ A planilha importada não funciona assim. Os dados dela NÃO existem no  │
 * │ servidor — eles existem na tela, onde a Érika conferiu linha por       │
 * │ linha, corrigiu o que estava ambíguo e pesou o que só ela podia pesar. │
 * │ Não há id de cliente que os reconstrua.                                │
 * │                                                                      │
 * │ Por isso o navegador MANDA a grade, e esta rota só a escreve. O que    │
 * │ ela não faz é menos importante do que parece: ela não calcula nada,    │
 * │ não valida nada e não interpreta nada. Se ela calculasse, existiriam   │
 * │ duas contas — a da tela e a do servidor — e a planilha baixada poderia │
 * │ discordar da que ela acabou de ver.                                    │
 * │                                                                      │
 * │ O `include` do tsconfig traz os tipos de `@types/node`, e é por isso   │
 * │ que `Buffer` existe aqui embaixo.                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA ROTA RECUSA, E POR QUE ELA É DESCONFIADA                  │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Não executar conteúdo do documento."                              │ │
 * │ │ "Não usar HTML vindo do PDF diretamente na interface."             │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ O corpo desta requisição é dado que passou por um PDF. O briefing é    │
 * │ explícito que dado de documento não é confiável — e mandar uma grade   │
 * │ pronta pela rede é confiar no navegador.                               │
 * │                                                                      │
 * │ As três checagens abaixo são as que importam, e cada uma responde a um  │
 * │ risco concreto:                                                       │
 * │                                                                      │
 * │  · o formato do corpo, para que um corpo estranho não derrube a rota   │
 * │    com uma exceção ilegível;                                          │
 * │  · o tamanho, porque um PDF de ficha gera uma grade pequena, e uma     │
 * │    requisição de trinta megabytes não é uma ficha;                     │
 * │  · o vocabulário das células, que é a única proteção que vale: cada    │
 * │    célula passa por `celulaSegura`, que aceita número, data e texto    │
 * │    com tamanho limitado — e RECUSA qualquer coisa que não seja isso.   │
 * │                                                                      │
 * │ O que nunca acontece: o conteúdo do documento virar código. Não há     │
 * │ `eval`, não há `new Function`, não há caminho de arquivo, não há       │
 * │ template. O texto vai para dentro de uma célula do Excel como texto.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { arquivoDaGrade, respostaDeDownload } from "@/lib/planilhas/gerador";
import type {
  CelulaGrade,
  ColunaGrade,
  FolhaGrade,
  FormatoGrade,
  GradeDaPlanilha,
  LinhaGrade,
} from "@/lib/planilhas/grade";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
  O TETO DO CORPO, em bytes.

  Uma ficha de sessenta ingredientes, com todas as notas e um rodapé de
  metodologia, cabe folgadamente em duzentos kilobytes. Dois megabytes é dez
  vezes isso — espaço para a planilha em branco com o mês inteiro preenchido à
  mão, e longe de qualquer requisição legítima desta tela.
*/
const LIMITE_DO_CORPO = 2 * 1024 * 1024;

/** O teto de uma célula de texto. O Excel corta em 32.767; aqui muito antes. */
const LIMITE_DA_CELULA = 500;

const FORMATOS = new Set<FormatoGrade>(["texto", "numero", "moeda", "peso", "percentual", "data"]);

/** Aceita o formato só se ele for um dos que a grade conhece. */
function formatoValido(v: unknown): FormatoGrade | null {
  return FORMATOS.has(v as FormatoGrade) ? (v as FormatoGrade) : null;
}

/** Um texto seguro: sempre string, sempre dentro do teto. */
function textoCurto(v: unknown): string {
  return typeof v === "string" ? v.slice(0, LIMITE_DA_CELULA) : "";
}

/**
 * UMA CÉLULA, REDUZIDA AO QUE ELA PODE SER.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO É UM `as CelulaGrade`                                    │
 * │                                                                      │
 * │ O `as` compilaria, não checaria nada, e deixaria passar um objeto —    │
 * │ que o `escreverGrade` tentaria usar como valor de célula. O defeito    │
 * │ apareceria como um arquivo corrompido, longe daqui.                    │
 * │                                                                      │
 * │ Aqui, o que não é número nem texto vira `null` — que é a célula vazia. │
 * │ A recusa é silenciosa DE PROPÓSITO: uma célula a menos é um arquivo    │
 * │ que abre; uma exceção no meio da escrita é um arquivo que não existe.  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A DATA, E POR QUE ELA PRECISA DA COLUNA PARA VOLTAR A SER DATA       │
 * │                                                                      │
 * │ JSON não tem o tipo data. Uma célula que era `Date` na tela chega      │
 * │ aqui como texto — a string ISO que o `JSON.stringify` produziu         │
 * │ ("2026-09-19T00:00:00.000Z"). Se nada fosse feito, o Excel receberia   │
 * │ um texto onde deveria haver uma data, e a célula deixaria de           │
 * │ responder a qualquer conta de data.                                    │
 * │                                                                      │
 * │ O que decide é o FORMATO DECLARADO NA COLUNA, e não a aparência do      │
 * │ texto: numa coluna de formato "data", uma string ISO é uma data; em    │
 * │ qualquer outra, é texto e continua texto. Sem essa regra, um código    │
 * │ de produto que por acaso parecesse uma data viraria data.              │
 * │                                                                      │
 * │ A data só é aceita se for VÁLIDA: `new Date` devolve `Invalid Date`    │
 * │ para texto malformado, e o exceljs gravaria esse inválido dentro do     │
 * │ arquivo. Data inválida volta a ser texto — que é o que ela era.         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function celulaSegura(valor: unknown, formato?: FormatoGrade): CelulaGrade {
  if (valor === null || valor === undefined) return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  if (typeof valor !== "string") return null;

  if (formato === "data" && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
    const d = new Date(valor);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return valor.slice(0, LIMITE_DA_CELULA);
}

/**
 * UM MAPA DE CÉLULAS — O `celulas` DE "dados", "subtotal", "total" e "vazia".
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO É UM ARRAY                                                │
 * │                                                                      │
 * │ `LinhaGrade.celulas` é um objeto com a CHAVE da coluna —             │
 * │ `{ ingrediente: "Farinha", custo: 12.5 }`. A chave é o que liga o      │
 * │ valor ao formato declarado em `colunas`, e é por isso que ela não pode  │
 * │ ser a posição: duas colunas trocadas de lugar mudariam o significado   │
 * │ do dado sem mudar nada visível.                                       │
 * │                                                                      │
 * │ Chave que não é texto é descartada. Valor que não é célula vira `null`  │
 * │ — ausência, que é o que a planilha mostra quando não há dado.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function celulasSeguras(
  v: unknown,
  formatoDaColuna: Readonly<Record<string, FormatoGrade>>
): Record<string, CelulaGrade> {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return {};
  const saida: Record<string, CelulaGrade> = {};
  for (const [chave, valor] of Object.entries(v as Record<string, unknown>)) {
    saida[chave.slice(0, 60)] = celulaSegura(valor, formatoDaColuna[chave]);
  }
  return saida;
}

/**
 * UMA LINHA, CONSTRUÍDA A PARTIR DO QUE "TIPO" DIZ QUE ELA É.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LINHA NÃO É UM SACO DE CÉLULAS                             │
 * │                                                                      │
 * │ São oito variantes, e cada uma carrega campos diferentes: `secao` tem   │
 * │ `texto`, `campo` tem `rotulo`/`valor`/`formato`, `dados` tem `celulas`. │
 * │ Aceitar um objeto genérico e deixar o escritor descobrir o que fazer    │
 * │ produziria uma linha que "quase" funciona — e o defeito apareceria como │
 * │ uma célula faltando no meio do arquivo.                                │
 * │                                                                      │
 * │ Cada caso é lido pelo que ele é. O tipo desconhecido vira linha vazia,  │
 * │ que é o mais inofensivo possível: uma linha em branco a mais numa        │
 * │ planilha, e não um valor no lugar errado.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function linhaSegura(
  linha: unknown,
  formatoDaColuna: Readonly<Record<string, FormatoGrade>>
): LinhaGrade {
  if (typeof linha !== "object" || linha === null) return { tipo: "vazia" };
  const l = linha as Record<string, unknown>;

  switch (l.tipo) {
    case "secao":
      return { tipo: "secao", texto: textoCurto(l.texto) };

    case "campo": {
      const formato = formatoValido(l.formato);
      return {
        tipo: "campo",
        rotulo: textoCurto(l.rotulo),
        valor: celulaSegura(l.valor, formato ?? undefined),
        ...(formato ? { formato } : {}),
      };
    }

    case "cabecalho":
      return { tipo: "cabecalho" };

    case "dados":
      return { tipo: "dados", celulas: celulasSeguras(l.celulas, formatoDaColuna) };

    case "subtotal": {
      const rotulo = typeof l.rotulo === "string" ? l.rotulo.slice(0, LIMITE_DA_CELULA) : "";
      return { tipo: "subtotal", celulas: celulasSeguras(l.celulas, formatoDaColuna), rotulo };
    }

    case "total": {
      const rotulo = typeof l.rotulo === "string" ? l.rotulo.slice(0, LIMITE_DA_CELULA) : "";
      return { tipo: "total", celulas: celulasSeguras(l.celulas, formatoDaColuna), rotulo };
    }

    case "texto":
      return {
        tipo: "texto",
        texto: textoCurto(l.texto),
        tom: l.tom === "pendencia" ? "pendencia" : "nota",
      };

    case "vazia": {
      const celulas =
        l.celulas === undefined ? undefined : celulasSeguras(l.celulas, formatoDaColuna);
      return celulas === undefined ? { tipo: "vazia" } : { tipo: "vazia", celulas };
    }

    default:
      return { tipo: "vazia" };
  }
}

function folhaSegura(folha: unknown): FolhaGrade | null {
  if (typeof folha !== "object" || folha === null) return null;
  const f = folha as Record<string, unknown>;

  if (!Array.isArray(f.colunas) || !Array.isArray(f.linhas)) return null;
  if (typeof f.nome !== "string" || f.nome.trim() === "") return null;

  const colunas: ColunaGrade[] = [];
  for (const c of f.colunas) {
    if (typeof c !== "object" || c === null) return null;
    const col = c as Record<string, unknown>;
    /*
      A COLUNA PRECISA TER CHAVE E FORMATO VÁLIDOS.

      Aqui a recusa é DURA, ao contrário da célula: uma coluna sem chave não é
      uma coluna com conteúdo faltando — é uma grade que não corresponde a
      `COLUNAS_ITENS`, e escrevê-la produziria um arquivo com uma coluna a
      menos do que o cabeçalho promete.
    */
    if (typeof col.chave !== "string" || col.chave.trim() === "") return null;
    const formato = formatoValido(col.formato);
    if (!formato) return null;

    const larguraMinima = col.larguraMinima;
    colunas.push({
      chave: col.chave.slice(0, 60),
      titulo: textoCurto(col.titulo),
      formato,
      largura:
        typeof col.largura === "number" && Number.isFinite(col.largura) && col.largura > 0
          ? col.largura
          : 15,
      ...(typeof larguraMinima === "number" && Number.isFinite(larguraMinima) && larguraMinima > 0
        ? { larguraMinima }
        : {}),
    });
  }

  /*
    O NOME DA ABA, E O LIMITE DE 31 CARACTERES.

    Ele não é decorativo: é o próprio Excel que recusa nomes maiores, e o
    `addWorksheet` lança — o que derrubaria a geração de uma planilha por causa
    de um nome longo. O corte aqui é a diferença entre um arquivo e um erro.
  */
  const nome = f.nome.trim().slice(0, 31);

  /*
    O FORMATO DE CADA COLUNA, PELA CHAVE — montado ANTES das linhas.

    É o que permite a `celulaSegura` saber que a string ISO de uma célula é
    uma data, e não texto. Sem ele, cada célula teria de adivinhar o próprio
    formato — e adivinhar formato a partir do conteúdo é como um código de
    produto vira data na planilha de alguém.
  */
  const formatoDaColuna: Record<string, FormatoGrade> = {};
  for (const c of colunas) formatoDaColuna[c.chave] = c.formato;

  return {
    nome,
    titulo: textoCurto(f.titulo),
    colunas,
    linhas: f.linhas.map((l) => linhaSegura(l, formatoDaColuna)),
    congelarLinhas:
      typeof f.congelarLinhas === "number" && f.congelarLinhas >= 0 ? Math.floor(f.congelarLinhas) : 0,
    ...(typeof f.congelarColunas === "number" && f.congelarColunas >= 0
      ? { congelarColunas: Math.floor(f.congelarColunas) }
      : {}),
    mostrarCabecalho: f.mostrarCabecalho !== false,
    assinatura: textoCurto(f.assinatura),
    ...(typeof f.linhaInicial === "number" && f.linhaInicial > 0
      ? { linhaInicial: Math.floor(f.linhaInicial) }
      : {}),
    ...(f.editavel === true ? { editavel: true } : {}),
    ...(Array.isArray(f.calculadas)
      ? { calculadas: f.calculadas.filter((e): e is string => typeof e === "string").map((e) => e.slice(0, 12)) }
      : {}),
  };
}

/**
 * A GRADE INTEIRA — ou `null`.
 *
 * A recusa é TOTAL, e não parcial: se uma folha qualquer não passar, a
 * requisição é recusada em vez de gerar um arquivo com as folhas que deram
 * certo. Um arquivo com a aba de ingredientes e sem a de custos seria aceito
 * por ela sem desconfiar — e é exatamente o tipo de ausência silenciosa que o
 * sistema inteiro existe para não produzir.
 */
function gradeSegura(corpo: unknown): GradeDaPlanilha | null {
  if (typeof corpo !== "object" || corpo === null) return null;
  const g = corpo as Record<string, unknown>;

  if (!Array.isArray(g.folhas) || g.folhas.length === 0) return null;

  const folhas: FolhaGrade[] = [];
  for (const f of g.folhas) {
    const folha = folhaSegura(f);
    if (!folha) return null;
    folhas.push(folha);
  }

  return {
    titulo: textoCurto(g.titulo) || "Planilha",
    subtitulo: textoCurto(g.subtitulo),
    folhas,
  };
}

export async function POST(requisicao: NextRequest) {
  /*
    O TAMANHO É CHECADO ANTES DE O CORPO SER LIDO.

    `Content-Length` é informado pelo cliente e pode mentir — por isso a
    checagem não substitui o limite real da plataforma, que já existe. O que
    ela faz é evitar a leitura de um corpo obviamente grande, e dar uma
    resposta legível no caso comum.
  */
  const informado = Number(requisicao.headers.get("content-length") ?? "0");
  if (Number.isFinite(informado) && informado > LIMITE_DO_CORPO) {
    return NextResponse.json(
      {
        erro: "A planilha é grande demais para baixar por aqui.",
        detalhe: "Este tamanho não corresponde a uma ficha técnica. Se o problema continuar, avise o suporte.",
      },
      { status: 413 }
    );
  }

  let corpo: unknown;
  try {
    corpo = await requisicao.json();
  } catch {
    return NextResponse.json(
      {
        erro: "O pedido de download chegou em formato inesperado.",
        detalhe: "Isso é um defeito do sistema, não do seu trabalho. Tente de novo; se continuar, avise o suporte.",
      },
      { status: 400 }
    );
  }

  const pacote = corpo as { grade?: unknown; nome?: unknown } | null;
  const grade = gradeSegura(pacote?.grade);
  if (!grade) {
    return NextResponse.json(
      {
        erro: "A planilha não pôde ser lida para o download.",
        detalhe: "A grade chegou incompleta. Recarregue a tela de conferência e gere de novo.",
      },
      { status: 400 }
    );
  }

  /*
    O NOME DO ARQUIVO VEM DO CLIENTE, E É SANITIZADO AQUI.

    `nomeSeguroDoArquivo` espera um `ContextoPlanilha`, e aqui não existe
    contexto nenhum — a planilha importada não é de cliente. O slug é
    repetido nesta linha curta em vez de generalizar aquela função: ela é
    usada em três lugares que têm contexto, e afrouxá-la para servir a um
    quarto que não tem deixaria os três aceitando `undefined`.
  */
  const nomeBase =
    typeof pacote?.nome === "string" && pacote.nome.trim() !== ""
      ? pacote.nome.trim()
      : "ficha-importada";

  const slug = nomeBase
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const agora = new Date();
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(agora);
  const legivel = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(agora);

  try {
    const arquivo = await arquivoDaGrade(grade, {
      nomeArquivo: `${slug || "ficha-importada"}-${iso}.xlsx`,
      nomeExibido: `Ficha importada — ${nomeBase} — ${legivel}.xlsx`,
      geradoEm: agora,
    });

    return respostaDeDownload(arquivo);
  } catch (erro) {
    console.error("[planilhas] falha ao escrever a planilha importada", erro);

    return NextResponse.json(
      {
        erro: "Não foi possível gerar o arquivo.",
        detalhe: "A escrita falhou no servidor. O que você conferiu não se perdeu — tente gerar de novo.",
      },
      { status: 500 }
    );
  }
}
