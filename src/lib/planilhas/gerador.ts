/**
 * O GERADOR DE PLANILHAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ÚNICA PORTA DE ENTRADA DA CENTRAL                                  │
 * │                                                                      │
 * │ Nenhuma tela importa `exceljs`, nenhuma tela importa um modelo        │
 * │ diretamente. Quem quer uma planilha chama `gerarPlanilha()`, e é aqui  │
 * │ que o arquivo nasce. Isso deixa três coisas possíveis:                │
 * │                                                                      │
 * │   1. Trocar o exceljs por outra biblioteca mexendo em UM arquivo.     │
 * │   2. Testar um modelo sem subir uma tela.                             │
 * │   3. Contar quantas planilhas o sistema sabe fazer: `MODELOS.length`.  │
 * │                                                                      │
 * │ A regra que sustenta as três: este arquivo conhece o exceljs, e o     │
 * │ resto do sistema não.                                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO COMPILA EM SERVIDOR E SÓ                         │
 * │                                                                      │
 * │ O `import "server-only"` no topo é uma trava, não um comentário: ele  │
 * │ faz o BUILD FALHAR se algum componente cliente importar daqui. Sem     │
 * │ ela, um `import` distraído num card da Central arrastaria o exceljs    │
 * │ inteiro para o navegador — centenas de KB, num bundle que hoje        │
 * │ carrega rápido — e nada quebraria. O sintoma seria a tela mais lenta   │
 * │ de abrir, e ninguém ligaria uma coisa à outra.                        │
 * │                                                                      │
 * │ A tela lê `MODELOS` e os mapas de estado por `./estado` e `./tipos`,  │
 * │ que são arquivos puros sem dependência de biblioteca.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import "server-only";
import ExcelJS from "exceljs";
import type { ContextoPlanilha, ArquivoGerado } from "./tipos";
import { MODELO_FUNCIONAL, obterModelo } from "./modelos";
import { escreverRelatorioConsultoria } from "./modelos/relatorio-consultoria";

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O EXCELJS, E NÃO ESCREVER O .XLSX À MÃO                       │
 * │                                                                      │
 * │ Um .xlsx é um ZIP com XML dentro. Dá para gerar com `zlib`, que o     │
 * │ Node já traz, sem instalar nada — e a primeira versão desta fase      │
 * │ considerou isso. Não foi o caminho escolhido, por três razões:        │
 * │                                                                      │
 * │ 1. O FORMATO É UMA ARMADILHA. Um .xlsx válido depende de seis         │
 * │    arquivos XML amarrados por relacionamentos, com namespaces e       │
 * │    ordem de elementos que o Excel aceita com tolerância zero. O       │
 * │    arquivo abre no LibreOffice e o Excel recusa; abre no Excel e o     │
 * │    Google Sheets lê em branco. Depurar isso é dias de trabalho, e o    │
 * │    erro aparece longe de onde está.                                   │
 * │                                                                      │
 * │ 2. O QUE SE PERDE PRIMEIRO É O QUE A ÉRIKA PRECISA. Os enfeites       │
 * │    fáceis (cor de fundo, negrito) são os primeiros a funcionar num     │
 * │    gerador próprio. Os que ela usa de verdade vêm depois e são         │
 * │    exatamente os difíceis: FILTRO no cabeçalho, painel CONGELADO,      │
 * │    formato de moeda e data que o Excel reconhece como número, quebra   │
 * │    de texto. Um gerador caseiro entregaria uma planilha bonita e       │
 * │    inútil.                                                            │
 * │                                                                      │
 * │ 3. O CUSTO DE OPORTUNIDADE. Cada hora gasta depurando XML é uma hora   │
 * │    não gasta nos quatro modelos que ainda faltam.                     │
 * │                                                                      │
 * │ O exceljs é mantido, resolve os três, e é a biblioteca que o briefing │
 * │ indicou. Uma dependência a mais na lista, contra uma semana de         │
 * │ trabalho e um formato que quebra em silêncio: a troca é boa.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */

// ---------------------------------------------------------------------------
// Os modelos
// ---------------------------------------------------------------------------

/*
  A LISTA DE MODELOS NÃO ESTÁ AQUI.

  Ela mora em `./modelos`, um arquivo puro que a tela também lê — e essa
  separação é o que impede `exceljs` de vazar para o navegador. Um card da
  Central precisa saber que existe um modelo "Custos e precificação" e que
  ele espera decisão dela; se essa informação viesse daqui, o card arrastaria
  a biblioteca inteira junto.

  O que fica AQUI é o que a lista não pode decidir sozinha: se existe gerador
  para o modelo. A lista é o catálogo; este arquivo é a oficina.
*/

// ---------------------------------------------------------------------------
// Geração
// ---------------------------------------------------------------------------

export class PlanilhaIndisponivelError extends Error {
  constructor(
    readonly modeloId: string,
    readonly motivo: string
  ) {
    super(motivo);
    this.name = "PlanilhaIndisponivelError";
  }
}

/**
 * Gera a planilha e devolve o arquivo pronto para download.
 *
 * `async` porque a serialização do exceljs é assíncrona — ela monta o ZIP
 * internamente. Poderia ser síncrona na aparência com a variante `writeBuffer`
 * antiga, mas a assíncrona não bloqueia o servidor, e uma planilha de mil
 * linhas já é trabalho suficiente para isso importar.
 */
export async function gerarPlanilha(
  modeloId: string,
  ctx: ContextoPlanilha
): Promise<ArquivoGerado> {
  const modelo = obterModelo(modeloId);

  if (!modelo) {
    throw new PlanilhaIndisponivelError(modeloId, `Modelo "${modeloId}" não existe.`);
  }

  /*
    O PORTÃO. A tela já esconde o botão de gerar quando o modelo não está
    disponível — mas esconder botão não é garantia, e a checagem de verdade
    fica aqui, no servidor, porque é aqui que o arquivo nasce. Se alguém
    chamar a rota direto, a resposta é um erro, não uma planilha vazia.
  */
  if (modelo.estado !== "DISPONIVEL") {
    throw new PlanilhaIndisponivelError(modelo.id, modelo.motivo ?? "Modelo em preparação.");
  }

  if (modeloId !== MODELO_FUNCIONAL) {
    throw new PlanilhaIndisponivelError(
      modeloId,
      `O modelo "${modelo.nome}" está marcado como disponível, mas não tem gerador implementado.`
    );
  }

  const wb = new ExcelJS.Workbook();

  /*
    METADADOS DO ARQUIVO.

    `creator` e `title` aparecem nas propriedades do documento e no rodapé de
    algumas telas de impressão. É o mesmo motivo de a planilha usar as cores
    da marca: quem recebe o arquivo, recebe junto um sinal de onde ele veio.
  */
  wb.creator = "Sistema Érika Bruna";
  wb.lastModifiedBy = "Sistema Érika Bruna";
  wb.title = `Relatório de consultoria — ${ctx.cliente.nomeFantasia}`;
  wb.subject = "Relatório de consultoria gastronômica";
  wb.company = "Érika Bruna · Consultoria Gastronômica";
  wb.created = ctx.geradoEm;
  wb.modified = ctx.geradoEm;

  escreverRelatorioConsultoria(wb, ctx);

  const buffer = await wb.xlsx.writeBuffer();

  return {
    // `writeBuffer` devolve `ExcelJS.Buffer`, que é um alias para `ArrayBuffer`
    // — não um Buffer do Node. A conversão é explícita porque um `ArrayBuffer`
    // atravessando a fronteira da rota vira um objeto vazio, e o download
    // chegaria corrompido sem nenhum erro aparecendo.
    conteudo: Buffer.from(buffer),
    nomeArquivo: nomeSeguroDoArquivo(ctx),
    nomeExibido: nomeLegivelDoArquivo(ctx),
    abas: [...(modelo.abas ?? [])],
  };
}

// ---------------------------------------------------------------------------
// Nomes do arquivo
// ---------------------------------------------------------------------------

/**
 * O nome SEGURO — sem acento, sem espaço, sem barra.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UMA FUNÇÃO, E NÃO UMA CONCATENAÇÃO                    │
 * │                                                                      │
 * │ O nome do arquivo é montado com dado que veio do CADASTRO. "Empório  │
 * │ Verde & Cia." vira, numa concatenação ingênua,                      │
 * │ `consultoria-Empório Verde & Cia.-2026-09-18.xlsx` — e o "&" e os    │
 * │ espaços são tratados de forma diferente por cada sistema. Pior: um   │
 * │ cliente com "/" no nome criaria um CAMINHO em vez de um arquivo, e o  │
 * │ download falharia sem explicação.                                     │
 * │                                                                      │
 * │ A normalização NFD separa cada letra do seu acento; o `replace` tira  │
 * │ as marcas soltas; o resto vira hífen. "Empório Verde & Cia." sai como  │
 * │ "emporio-verde-cia". Nenhuma letra importante se perde.                │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function nomeSeguroDoArquivo(ctx: ContextoPlanilha): string {
  const cliente = slug(ctx.cliente.nomeFantasia);
  const data = dataISO(ctx.geradoEm);
  return `consultoria-${cliente}-${data}.xlsx`;
}

/**
 * O nome BONITO — com acento e espaço, para a tela mostrar.
 *
 * É o mesmo dado com outra roupa. A tela mostra este; o sistema de arquivos
 * recebe o outro. Dois nomes derivados de uma fonte só, para nunca
 * divergirem sobre de quem é a planilha.
 */
export function nomeLegivelDoArquivo(ctx: ContextoPlanilha): string {
  return `Relatório de consultoria — ${ctx.cliente.nomeFantasia} — ${dataCurtaISO(ctx.geradoEm)}.xlsx`;
}

/**
 * Um pedaço de texto utilizável como parte de nome de arquivo.
 *
 * A ordem das operações importa e não é a óbvia: normalizar ANTES de
 * substituir. Se o `replace` de caracteres proibidos viesse primeiro, "ó"
 * seria poupado e depois o NFD o quebraria em "o" + acento solto, deixando o
 * acento para trás. Normalizar primeiro faz o acento virar marca solta, que
 * o segundo `replace` remove junto com o resto.
 *
 * A limpeza de hífen no fim é estética, e evita `consultoria-cia--2026`.
 */
function slug(texto: string): string {
  return texto
    .normalize("NFD")
    /*
      A faixa U+0300–U+036F são as MARCAS COMBINANTES que o NFD acabou de
      separar das letras — o acento de "ó" vira um caractere próprio, e é ele
      que sai aqui.

      Escrita com escape `\u` e não com os caracteres literais: eles são
      invisíveis no editor, e qualquer normalização do arquivo-fonte os
      apagaria. O `replace` continuaria compilando, deixaria de remover acento,
      e o único sintoma seria um nome de arquivo com acento — longe daqui.
    */
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * A data no formato que ordena.
 *
 * "2026-09-18" e não "18-09-2026": a pasta de downloads fica ordenada por
 * nome, e a ISO ordena cronologicamente sem ninguém pensar nisso. Com
 * "18-09" e "02-10", a listagem por nome poria outubro antes de setembro.
 */
function dataISO(d: Date): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return p;
}

/** A data no formato que se lê — para o nome exibido, não para o arquivo. */
function dataCurtaISO(d: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

// ---------------------------------------------------------------------------
// Resposta HTTP
// ---------------------------------------------------------------------------

/**
 * Empacota o arquivo numa resposta de download.
 *
 * Mora aqui, e não na rota, porque toda rota que baixar planilha precisa das
 * mesmas quatro decisões — e três delas são fáceis de errar:
 *
 * 1. `Content-Type` do .xlsx, e não `application/octet-stream`. É o que faz o
 *    navegador abrir no Excel em vez de perguntar "com que programa?".
 * 2. `Content-Disposition` com o nome do arquivo. Sem ele, o download chega
 *    chamado "download" ou com o nome da rota.
 * 3. `filename*` além de `filename`: o nome pode ter acento, e cabeçalho HTTP
 *    é ASCII. O `filename*` com UTF-8 é o que preserva "Relatório" em vez de
 *    "RelatÃ³rio" no nome do arquivo. Os dois vão juntos porque navegador
 *    antigo ignora o `filename*` e moderno prefere ele.
 * 4. `no-store`: planilha é dado de cliente e não pode ficar em cache
 *    intermediário.
 *
 * O `Buffer` precisa virar `Uint8Array` antes de entrar no corpo da resposta
 * — é o que o `Response` do padrão Web aceita, e o TypeScript reclama se não.
 */
export function respostaDeDownload(arquivo: ArquivoGerado): Response {
  return new Response(new Uint8Array(arquivo.conteudo), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": contentDisposition(arquivo.nomeArquivo, arquivo.nomeExibido),
      "Content-Length": String(arquivo.conteudo.byteLength),
      "Cache-Control": "no-store, must-revalidate",
    },
  });
}

/**
 * O cabeçalho `Content-Disposition`, com os dois nomes.
 *
 * `encodeURIComponent` no `filename*` é exigido pela RFC 5987 — e ele escapa
 * aspas e parênteses, que quebrariam o cabeçalho. No `filename` comum, as
 * aspas são removidas em vez de escapadas: é o único caractere que pode
 * encerrar o valor antes da hora.
 */
function contentDisposition(nomeArquivo: string, nomeExibido: string): string {
  const ascii = nomeArquivo.replace(/"/g, "");
  const utf8 = encodeURIComponent(nomeExibido);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}
