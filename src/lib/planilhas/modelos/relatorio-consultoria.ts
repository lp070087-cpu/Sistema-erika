/**
 * MODELO: RELATÓRIO DE CONSULTORIA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO É, E O QUE ELE NÃO É                              │
 * │                                                                      │
 * │ É o PRIMEIRO modelo funcional da Central de Planilhas — o único que   │
 * │ gera arquivo de verdade nesta fase. Os outros quatro estão descritos  │
 * │ e não implementados, e cada um diz por quê.                            │
 * │                                                                      │
 * │ Não é uma ficha técnica, não é custo, não é precificação. Este        │
 * │ relatório ORGANIZA o que já está registrado sobre uma consultoria:    │
 * │ quem é o cliente, o que foi combinado, o que está pendente, o que     │
 * │ aconteceu nos encontros. Nenhuma célula aqui é resultado de conta que  │
 * │ a Érika não tenha feito.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE QUATRO ABAS, E POR QUE NESTA ORDEM                          │
 * │                                                                      │
 * │ RESUMO          — a primeira coisa que se lê. Uma página, não uma     │
 * │                   tabela: quem é o cliente, o que está combinado, em   │
 * │                   que ponto está, e o que ainda falta. Quem abre a     │
 * │                   planilha para "entender rápido" não precisa ir além  │
 * │                   desta aba.                                          │
 * │                                                                      │
 * │ TAREFAS         — a lista do que ela precisa fazer. É a aba que ela   │
 * │                   abre no dia a dia, e por isso vem antes do histórico.│
 * │                                                                      │
 * │ ACOMPANHAMENTOS — o que aconteceu em cada encontro, do mais recente    │
 * │                   para o mais antigo. É a memória do trabalho.         │
 * │                                                                      │
 * │ INFORMAÇÕES     — de onde vieram os dados, o que a planilha não        │
 * │                   calcula e o que ainda depende de decisão. Esta aba   │
 * │                   existe porque uma planilha que sai daqui vai ser     │
 * │                   lida longe do sistema, por alguém que não viu a tela │
 * │                   e não sabe o que está olhando.                       │
 * │                                                                      │
 * │ A ordem vai do resumo para o detalhe, e termina explicando a origem.   │
 * │ É a mesma ordem em que se conta uma história.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { Workbook, Worksheet } from "exceljs";
import type { Acompanhamento, Consultoria, Tarefa } from "@/lib/dados";
import {
  ROTULO_MODALIDADE,
  ROTULO_PRIORIDADE,
  ROTULO_SITUACAO_CLIENTE,
  ROTULO_STATUS_CONSULTORIA,
  ROTULO_STATUS_TAREFA,
  ROTULO_TIPO_ACOMPANHAMENTO,
  ROTULO_TIPO_NEGOCIO,
  dataCurta,
} from "@/lib/dados";
import type { ContextoPlanilha } from "../tipos";
import { ABAS_RELATORIO } from "../modelos";
import {
  ESTILO_CELULA,
  ESTILO_NOTA,
  ESTILO_PENDENCIA,
  ESTILO_TEXTO,
  FORMATO_DATA,
  LARGURA,
  aplicarCabecalho,
  congelar,
  escreverAssinatura,
  escreverCampo,
  escreverRotuloBloco,
  escreverTabela,
} from "../estilos";

/**
 * Gera o relatório dentro de um `Workbook` já criado.
 *
 * Recebe o workbook em vez de criá-lo porque quem decide o formato do
 * arquivo é o gerador, não o modelo. Assim um segundo modelo pode entrar no
 * MESMO arquivo — "relatório + fichas em uma planilha só" — sem reescrever
 * nada aqui.
 */
export function escreverRelatorioConsultoria(wb: Workbook, ctx: ContextoPlanilha): void {
  const subtitulo = subtituloDoArquivo(ctx);

  /*
    Tarefas e acompanhamentos chegam como listas do repositório — filtrar por
    cliente é responsabilidade DESTE arquivo, e não de quem chama. Se o filtro
    ficasse em quem chama, o segundo modelo a esquecê-lo gravaria dado de um
    cliente na planilha de outro. Filtro do lado de dentro não tem como ser
    esquecido.
  */
  const tarefas = (ctx.tarefas ?? []).filter((t) => t.clienteId === ctx.cliente.id);
  const acompanhamentos = (ctx.acompanhamentos ?? []).filter(
    (a) => a.clienteId === ctx.cliente.id
  );

  escreverResumo(wb.addWorksheet(ABAS_RELATORIO[0]), ctx, tarefas, subtitulo, ctx.geradoEm);
  escreverTarefas(wb.addWorksheet(ABAS_RELATORIO[1]), tarefas, subtitulo, ctx.geradoEm);
  escreverAcompanhamentos(
    wb.addWorksheet(ABAS_RELATORIO[2]),
    acompanhamentos,
    subtitulo,
    ctx.geradoEm
  );
  escreverInformacoes(
    wb.addWorksheet(ABAS_RELATORIO[3]),
    ctx,
    tarefas,
    acompanhamentos,
    subtitulo,
    ctx.geradoEm
  );

  /*
    A aba ativa é a PRIMEIRA, e não a última escrita. Sem esta linha o Excel
    abre o arquivo na aba INFORMAÇÕES — que é onde o código parou de escrever
    — e a pessoa cai num bloco de notas sobre metodologia em vez do resumo do
    cliente. É um detalhe de uma linha que decide qual é a primeira impressão
    do arquivo.
  */
  wb.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];
}

/**
 * A segunda linha de todo cabeçalho: de quem é a planilha e quando saiu.
 *
 * Repetida nas quatro abas de propósito. Uma aba impressa sozinha, ou
 * copiada para outro arquivo, precisa continuar dizendo a quem se refere —
 * e "Planilha1" não diz nada.
 */
function subtituloDoArquivo(ctx: ContextoPlanilha): string {
  const partes = [ctx.cliente.nomeFantasia];
  if (ctx.consultoria) partes.push(ctx.consultoria.titulo);
  partes.push(`gerado em ${dataCurta(ctx.geradoEm)}`);
  return partes.join(" · ");
}

// ---------------------------------------------------------------------------
// ABA 1 — RESUMO
// ---------------------------------------------------------------------------

/**
 * O resumo é a única aba que NÃO é uma tabela.
 *
 * É uma página: blocos de rótulo e valor, um embaixo do outro. Tabela serve
 * para listar muitos itens iguais; o resumo tem sete fatos diferentes sobre
 * um cliente só, e forçar isso numa grade de linhas e colunas criaria uma
 * coluna "Campo" que ninguém filtra e uma coluna "Valor" com tipos mistos.
 */
function escreverResumo(
  aba: Worksheet,
  ctx: ContextoPlanilha,
  tarefas: readonly Tarefa[],
  subtitulo: string,
  geradoEm: Date
): void {
  const { cliente, consultoria } = ctx;
  const colunas = 4;
  let linha = aplicarCabecalho(aba, "RELATÓRIO DE CONSULTORIA", subtitulo, colunas);

  /*
    As larguras do resumo são largas de propósito. A largura de uma coluna no
    Excel é uma só para a aba inteira — a coluna 1 é usada tanto pelos rótulos
    do resumo quanto pela coluna "Etapa" da tabela de jornada. Escolher
    `larga` atende aos dois; `estreita` apertaria os rótulos.
  */
  aba.getColumn(1).width = LARGURA.larga;
  aba.getColumn(2).width = LARGURA.texto;
  aba.getColumn(3).width = LARGURA.media;
  aba.getColumn(4).width = LARGURA.media;

  // ── O CLIENTE ──────────────────────────────────────────────────────────
  linha = escreverRotuloBloco(aba, linha, "O CLIENTE", colunas);
  linha = escreverCampo(aba, linha, "Nome fantasia", cliente.nomeFantasia);
  linha = escreverCampo(aba, linha, "Contato", cliente.nomeContato);
  linha = escreverCampo(aba, linha, "Tipo de negócio", ROTULO_TIPO_NEGOCIO[cliente.tipoNegocio]);
  linha = escreverCampo(aba, linha, "Cidade", cliente.cidade);
  linha = escreverCampo(aba, linha, "Situação", ROTULO_SITUACAO_CLIENTE[cliente.situacao]);
  linha = escreverCampo(aba, linha, "Modalidade", ROTULO_MODALIDADE[cliente.modalidade]);
  linha = escreverCampo(aba, linha, "Funcionários (declarado)", cliente.funcionariosDeclarados);
  linha = escreverCampo(aba, linha, "Cliente desde", cliente.iniciadoEm, FORMATO_DATA);
  linha = escreverCampo(aba, linha, "Última atividade", cliente.ultimaAtividadeEm, FORMATO_DATA);
  linha += 1;

  // ── O QUE FOI DECLARADO ────────────────────────────────────────────────
  linha = escreverRotuloBloco(aba, linha, "O QUE O CLIENTE DECLAROU", colunas);
  linha = escreverTextoCorrido(
    aba,
    linha,
    cliente.problemaDeclarado || "Nada registrado no cadastro.",
    colunas
  );
  linha += 1;

  // ── A CONSULTORIA ──────────────────────────────────────────────────────
  linha = escreverRotuloBloco(aba, linha, "A CONSULTORIA", colunas);
  if (!consultoria) {
    linha = escreverTextoCorrido(
      aba,
      linha,
      "Nenhuma consultoria registrada para este cliente. O que está acima são os dados do " +
        "cadastro — o trabalho ainda não começou.",
      colunas
    );
    linha += 1;
  } else {
    linha = escreverCampo(aba, linha, "Título", consultoria.titulo);
    linha = escreverCampo(aba, linha, "Status", ROTULO_STATUS_CONSULTORIA[consultoria.status]);
    linha = escreverCampo(aba, linha, "Iniciada em", consultoria.iniciadaEm, FORMATO_DATA);
    linha = escreverCampo(
      aba,
      linha,
      "Último acompanhamento",
      consultoria.ultimoAcompanhamentoEm ?? "nenhum ainda",
      consultoria.ultimoAcompanhamentoEm ? FORMATO_DATA : undefined
    );
    linha = escreverCampo(aba, linha, "Próxima ação", consultoria.proximaAcao || "nada marcado");
    linha = escreverCampo(
      aba,
      linha,
      "Próxima ação em",
      consultoria.proximaAcaoEm ?? "sem data marcada",
      consultoria.proximaAcaoEm ? FORMATO_DATA : undefined
    );
    linha += 1;

    // ── ESCOPO ───────────────────────────────────────────────────────────
    linha = escreverRotuloBloco(aba, linha, "ESCOPO COMBINADO", colunas);
    if (consultoria.escopo.length === 0) {
      linha = escreverTextoCorrido(aba, linha, "Escopo ainda não escrito.", colunas);
    } else {
      consultoria.escopo.forEach((item, i) => {
        linha = escreverItem(aba, linha, item, colunas, i);
      });
    }
    linha += 1;

    // ── JORNADA ──────────────────────────────────────────────────────────
    linha = escreverRotuloBloco(aba, linha, "ETAPAS DA JORNADA", colunas);
    linha = escreverTabela<Consultoria["jornada"][number]>(
      aba,
      linha,
      [
        { titulo: "Etapa", largura: LARGURA.larga, valor: (e) => e.etapa },
        { titulo: "Estado", largura: LARGURA.media, valor: (e) => e.estado },
        {
          titulo: "Progresso",
          largura: LARGURA.estreita,
          valor: (e) =>
            e.progresso !== undefined && e.total !== undefined
              ? `${e.progresso} de ${e.total}`
              : "—",
        },
        { titulo: "Nota", largura: LARGURA.larga, valor: (e) => e.nota },
      ],
      consultoria.jornada
    );
    linha += 1;
  }

  // ── O QUE ESTÁ PENDENTE ────────────────────────────────────────────────
  //
  // Bloco derivado de CONTAGEM, não de cálculo. "4 tarefas em aberto" é
  // `filter().length` — conferível contando as linhas da aba TAREFAS. Não há
  // percentual de conclusão, porque somar etapas de naturezas diferentes
  // exigiria pesos, e peso é decisão da Érika (pendência 11).
  linha = escreverRotuloBloco(aba, linha, "O QUE ESTÁ PENDENTE", colunas);
  const abertas = tarefas.filter((t) => t.status !== "CONCLUIDA");
  linha = escreverCampo(aba, linha, "Tarefas em aberto", abertas.length);
  linha = escreverCampo(
    aba,
    linha,
    "Das quais, prioridade alta",
    abertas.filter((t) => t.prioridade === "ALTA").length
  );
  linha = escreverCampo(aba, linha, "Tarefas concluídas", tarefas.length - abertas.length);
  linha += 1;

  // ── A NOTA QUE EXPLICA O ESTADO DO ARQUIVO ─────────────────────────────
  //
  // Fica na aba de resumo, e não só na INFORMAÇÕES, porque é a aba que vai
  // ser lida. Uma nota no fim de uma aba que ninguém abre não é aviso: é
  // arquivo morto.
  linha = escreverRotuloBloco(aba, linha, "SOBRE ESTA PLANILHA", colunas);
  linha = escreverNota(
    aba,
    linha,
    "Gerada pelo Sistema Érika Bruna a partir dos dados registrados no sistema. Os valores e " +
      "datas aqui são os que estão no cadastro — nada foi recalculado, corrigido ou estimado. " +
      "O sistema não calcula CMV, preço de venda, margem, índice de cocção nem fator de correção: " +
      "essas contas dependem de regras que ainda não foram definidas, e não são inventadas aqui.",
    colunas
  );
  linha = escreverNota(
    aba,
    linha,
    `Emitida em ${dataCurta(geradoEm)}. Se um dado aqui estiver errado, corrija no sistema e ` +
      "gere a planilha de novo — este arquivo é uma fotografia, não a fonte.",
    colunas
  );
}

// ---------------------------------------------------------------------------
// ABA 2 — TAREFAS
// ---------------------------------------------------------------------------

/**
 * A lista de tarefas, com o prazo em data E em distância.
 *
 * As duas colunas juntas porque uma sozinha engana: "12/03/2026" não diz
 * nada sem saber que hoje é 17/03, e "3 dias" não diz quando foi combinado.
 * A distância é o que muda a decisão de quem lê; a data é o que serve de
 * prova. É a mesma dupla que a tela de tarefas do sistema já usa.
 */
function escreverTarefas(
  aba: Worksheet,
  tarefas: readonly Tarefa[],
  subtitulo: string,
  geradoEm: Date
): void {
  const colunas = 5;
  let linha = aplicarCabecalho(aba, "TAREFAS", subtitulo, colunas);

  if (tarefas.length === 0) {
    linha = escreverTextoCorrido(
      aba,
      linha,
      "Nenhuma tarefa registrada para este cliente.",
      colunas
    );
    escreverAssinatura(aba, linha + 1, colunas, "Gerado pelo Sistema Érika Bruna.");
    return;
  }

  /*
    Ordenação: abertas primeiro, por prazo crescente; concluídas por último.
    É a ordem em que a lista seria lida em voz alta, respondendo à pergunta
    "o que eu tenho que fazer?".
  */
  const ordenadas = [...tarefas].sort((a, b) => {
    const aConcluida = a.status === "CONCLUIDA" ? 1 : 0;
    const bConcluida = b.status === "CONCLUIDA" ? 1 : 0;
    if (aConcluida !== bConcluida) return aConcluida - bConcluida;

    /*
      Tarefa sem prazo vai para o FIM do bloco, não para o começo. Se o
      `null` fosse tratado como zero, uma tarefa sem data apareceria como a
      mais urgente de todas — e a lista abriria com algo que não tem prazo.
    */
    const aPrazo = a.prazo?.getTime() ?? Number.POSITIVE_INFINITY;
    const bPrazo = b.prazo?.getTime() ?? Number.POSITIVE_INFINITY;
    return aPrazo - bPrazo;
  });

  congelar(aba, 4);

  linha = escreverTabela<Tarefa>(
    aba,
    linha,
    [
      { titulo: "Tarefa", largura: LARGURA.muitoLarga, valor: (t) => t.titulo },
      { titulo: "Status", largura: LARGURA.media, valor: (t) => ROTULO_STATUS_TAREFA[t.status] },
      {
        titulo: "Prioridade",
        largura: LARGURA.estreita,
        valor: (t) => ROTULO_PRIORIDADE[t.prioridade],
      },
      {
        titulo: "Prazo",
        largura: LARGURA.media,
        valor: (t) => t.prazo,
        formato: FORMATO_DATA,
      },
      {
        titulo: "Situação do prazo",
        largura: LARGURA.media,
        valor: (t) => situacaoDoPrazo(t, geradoEm),
      },
    ],
    ordenadas
  );

  /*
    A coluna Prazo recebe a `Date` crua, e não `dataCurta(t.prazo)`. Isso é
    deliberado: assim o Excel guarda um número de série de data, e ordenar,
    filtrar por período e usar em fórmula funcionam. Uma data escrita como
    texto bonito ordena alfabeticamente — e "01/12/2026" ficaria antes de
    "05/03/2026". Onde não há prazo, a célula fica vazia: ausência de dado
    não é a string "—".
  */

  escreverAssinatura(
    aba,
    linha,
    colunas,
    "Gerado pelo Sistema Érika Bruna. As datas estão gravadas como data, e não como texto — dá para ordenar e filtrar pelo próprio Excel."
  );
}

/**
 * A distância até o prazo, em palavras.
 *
 * Conta dias de CALENDÁRIO no fuso de São Paulo, e não diferença de
 * milissegundos dividida por 24h. A diferença importa: um prazo registrado
 * às 21h de hoje fica a menos de 24 horas de distância de agora, mas é
 * amanhã — e "vence hoje" para um prazo de amanhã é o tipo de erro que faz
 * alguém perder uma entrega.
 */
function situacaoDoPrazo(tarefa: Tarefa, agora: Date): string {
  if (tarefa.status === "CONCLUIDA") {
    return tarefa.concluidaEm ? `concluída em ${dataCurta(tarefa.concluidaEm)}` : "concluída";
  }
  if (!tarefa.prazo) return "sem prazo";

  const dias = diasDeCalendario(tarefa.prazo, agora);

  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  if (dias > 1) return `em ${dias} dias`;
  if (dias === -1) return "venceu ontem";
  return `vencida há ${Math.abs(dias)} dias`;
}

/**
 * Dias de calendário entre duas datas, ignorando a hora.
 *
 * Depois de reduzir cada data ao seu dia, a subtração não tem como errar por
 * uma hora — que é o problema clássico quando se comparam instantes e o
 * horário de verão entra no meio.
 */
function diasDeCalendario(depois: Date, antes: Date): number {
  const umDia = 86400000;
  return Math.round((inicioDoDiaUTC(depois) - inicioDoDiaUTC(antes)) / umDia);
}

/**
 * O dia em que a data cai em São Paulo, expresso como meia-noite UTC.
 *
 * O fuso é explícito porque sem ele uma data registrada às 21h em São Paulo
 * já é o dia seguinte em UTC — e um prazo "que vence hoje" apareceria como
 * "venceu ontem". O mesmo cuidado foi tomado no cálculo de atraso de parcela,
 * e os dois precisam concordar: são a mesma pergunta feita em duas telas.
 *
 * `en-CA` formata como "2026-03-17", que `Date.parse` lê como meia-noite UTC.
 * É a normalização que se quer, sem montar a data campo a campo.
 */
function inicioDoDiaUTC(d: Date): number {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  return Date.parse(partes);
}

// ---------------------------------------------------------------------------
// ABA 3 — ACOMPANHAMENTOS
// ---------------------------------------------------------------------------

/**
 * O histórico dos encontros, do mais recente para o mais antigo.
 *
 * As pendências de cada encontro ficam numa coluna só, uma por linha dentro
 * da célula. A alternativa seria uma linha por pendência, o que repetiria a
 * data e o tipo do encontro em cada uma — e transformaria "quantas reuniões
 * houve" numa tarefa de deduplicação para quem lê.
 */
function escreverAcompanhamentos(
  aba: Worksheet,
  acompanhamentos: readonly Acompanhamento[],
  subtitulo: string,
  geradoEm: Date
): void {
  const colunas = 6;
  let linha = aplicarCabecalho(aba, "ACOMPANHAMENTOS", subtitulo, colunas);

  if (acompanhamentos.length === 0) {
    linha = escreverTextoCorrido(
      aba,
      linha,
      "Nenhum acompanhamento registrado para este cliente.",
      colunas
    );
    escreverAssinatura(aba, linha + 1, colunas, "Gerado pelo Sistema Érika Bruna.");
    return;
  }

  const ordenados = [...acompanhamentos].sort((a, b) => b.data.getTime() - a.data.getTime());

  congelar(aba, 4);

  linha = escreverTabela<Acompanhamento>(
    aba,
    linha,
    [
      { titulo: "Data", largura: LARGURA.media, valor: (a) => a.data, formato: FORMATO_DATA },
      {
        titulo: "Tipo",
        largura: LARGURA.media,
        valor: (a) => ROTULO_TIPO_ACOMPANHAMENTO[a.tipo],
      },
      {
        titulo: "Modalidade",
        largura: LARGURA.estreita,
        valor: (a) => ROTULO_MODALIDADE[a.modalidade],
      },
      { titulo: "Título", largura: LARGURA.larga, valor: (a) => a.titulo },
      { titulo: "Resumo", largura: LARGURA.texto, valor: (a) => a.resumo },
      {
        titulo: "Pendências",
        largura: LARGURA.larga,
        valor: (a) =>
          a.pendencias.length === 0 ? "—" : a.pendencias.map((p) => `• ${p}`).join("\n"),
      },
    ],
    ordenados
  );

  escreverAssinatura(
    aba,
    linha,
    colunas,
    `Gerado pelo Sistema Érika Bruna em ${dataCurta(geradoEm)}. Os encontros estão do mais recente para o mais antigo.`
  );
}

// ---------------------------------------------------------------------------
// ABA 4 — INFORMAÇÕES
// ---------------------------------------------------------------------------

/**
 * A aba que explica o arquivo.
 *
 * Existe porque a planilha vai ser aberta FORA do sistema — anexada num
 * e-mail, num grupo de WhatsApp, impressa numa reunião. Quem recebe não tem
 * como saber que a coluna "Situação do prazo" foi calculada na data de
 * geração, nem que a ausência de uma coluna de custo é decisão e não
 * esquecimento. Esta aba é o rótulo do produto.
 */
function escreverInformacoes(
  aba: Worksheet,
  ctx: ContextoPlanilha,
  tarefas: readonly Tarefa[],
  acompanhamentos: readonly Acompanhamento[],
  subtitulo: string,
  geradoEm: Date
): void {
  const { cliente, consultoria } = ctx;
  const colunas = 3;
  let linha = aplicarCabecalho(aba, "INFORMAÇÕES", subtitulo, colunas);

  aba.getColumn(1).width = LARGURA.larga;
  aba.getColumn(2).width = LARGURA.muitoLarga;
  aba.getColumn(3).width = LARGURA.larga;

  // ── DE ONDE VIERAM OS DADOS ────────────────────────────────────────────
  //
  // Os identificadores aparecem porque esta planilha é uma fotografia de um
  // registro que existe no sistema, e a fotografia precisa ser rastreável:
  // com o id, dá para achar o cliente exato de onde ela saiu.
  linha = escreverRotuloBloco(aba, linha, "DE ONDE VIERAM OS DADOS", colunas);
  linha = escreverCampo(aba, linha, "Cliente", cliente.nomeFantasia);
  linha = escreverCampo(aba, linha, "Identificador do cliente", cliente.id);
  linha = escreverCampo(
    aba,
    linha,
    "Consultoria",
    consultoria ? `${consultoria.titulo} (${consultoria.id})` : "não vinculada"
  );
  linha = escreverCampo(aba, linha, "Tarefas incluídas", tarefas.length);
  linha = escreverCampo(aba, linha, "Acompanhamentos incluídos", acompanhamentos.length);
  linha = escreverCampo(aba, linha, "Emitida em", geradoEm, FORMATO_DATA);
  linha += 1;

  // ── O QUE ESTA PLANILHA NÃO CALCULA ────────────────────────────────────
  //
  // Em vermelho, e não em nota de rodapé cinza. É a parte do arquivo que
  // protege a Érika de mandar para um cliente um documento que PARECE ter
  // custo e não tem.
  linha = escreverRotuloBloco(aba, linha, "O QUE ESTA PLANILHA NÃO CALCULA", colunas);
  for (const texto of [
    "CMV — depende de decidir o que entra no custo, e isso ainda não foi definido.",
    "Preço de venda e markup — dependem da margem alvo, que ainda não foi definida.",
    "Índice de cocção e fator de correção — dependem da metodologia de perda e limpeza.",
    "Margem por prato — depende de todas as decisões acima.",
  ]) {
    linha = escreverPendencia(aba, linha, texto, colunas);
  }
  linha = escreverNota(
    aba,
    linha,
    "Estas colunas não aparecem em nenhuma aba deste arquivo, de propósito. Quando as regras " +
      "forem definidas, elas passam a existir — e até lá o sistema não mostra número inventado.",
    colunas
  );
  linha += 1;

  // ── COMO LER O ARQUIVO ─────────────────────────────────────────────────
  linha = escreverRotuloBloco(aba, linha, "COMO LER ESTE ARQUIVO", colunas);
  for (const texto of [
    "As datas estão gravadas como data de verdade, e não como texto: dá para ordenar, filtrar " +
      "por período e usar em fórmula sem converter nada. O formato exibido é dia/mês/ano e pode " +
      "ser trocado no Excel sem alterar o valor.",
    "As tabelas têm filtro na linha de cabeçalho, e o cabeçalho fica congelado ao rolar. A faixa " +
      "clara alternada é só leitura — não significa nada além de linha sim, linha não.",
    "A coluna \"Situação do prazo\" foi calculada na data de emissão desta planilha. Se o arquivo " +
      "for aberto uma semana depois, a coluna continua dizendo o que dizia — para atualizar, gere " +
      "a planilha de novo no sistema.",
  ]) {
    linha = escreverTextoCorrido(aba, linha, texto, colunas);
  }
  linha += 1;

  // ── O QUE AINDA DEPENDE DE DECISÃO ─────────────────────────────────────
  linha = escreverRotuloBloco(aba, linha, "O QUE AINDA DEPENDE DE VOCÊ", colunas);
  for (const texto of [
    "Como o custo de um prato é apurado — quais itens entram e como a perda é tratada.",
    "Qual margem é a alvo, e se ela muda por tipo de prato ou de serviço.",
    "Se a ficha técnica deve trazer custo por porção, e como ele é rateado.",
    "Quais planilhas você usa hoje no dia a dia, para o sistema nascer parecido com o que você já faz.",
  ]) {
    linha = escreverPendencia(aba, linha, texto, colunas);
  }
  linha += 1;

  linha = escreverNota(
    aba,
    linha,
    "Esta planilha foi gerada pelo Sistema Érika Bruna. O arquivo é uma fotografia dos dados no " +
      "momento da emissão: alterações feitas no sistema depois disso não aparecem aqui.",
    colunas
  );
}

// ---------------------------------------------------------------------------
// Auxiliares de escrita
// ---------------------------------------------------------------------------

/** Uma linha de texto corrido atravessando a largura da aba. */
function escreverTextoCorrido(
  aba: Worksheet,
  linha: number,
  texto: string,
  totalColunas: number
): number {
  return escreverLinhaMesclada(aba, linha, texto, totalColunas, ESTILO_TEXTO);
}

/** Uma linha de nota — itálico, cinza, para o que explica e não avisa. */
function escreverNota(
  aba: Worksheet,
  linha: number,
  texto: string,
  totalColunas: number
): number {
  return escreverLinhaMesclada(aba, linha, texto, totalColunas, ESTILO_NOTA);
}

/** Uma linha de pendência — vermelha, para o que trava. */
function escreverPendencia(
  aba: Worksheet,
  linha: number,
  texto: string,
  totalColunas: number
): number {
  return escreverLinhaMesclada(aba, linha, texto, totalColunas, ESTILO_PENDENCIA);
}

/**
 * O corpo comum das três: mesclar, escrever, ajustar a altura.
 *
 * As três fazem exatamente a mesma operação com estilo diferente, e a altura
 * é o motivo de estarem juntas: célula mesclada NÃO auto-ajusta a altura no
 * Excel, então um parágrafo de quatro linhas apareceria cortado em duas. Como
 * a biblioteca não expõe auto-ajuste, a altura é estimada — e ter isso num
 * lugar só evita que a terceira variante esqueça o ajuste.
 */
function escreverLinhaMesclada(
  aba: Worksheet,
  linha: number,
  texto: string,
  totalColunas: number,
  estilo: (typeof ESTILO_TEXTO) | (typeof ESTILO_NOTA) | (typeof ESTILO_PENDENCIA)
): number {
  aba.mergeCells(linha, 1, linha, totalColunas);
  const cell = aba.getCell(linha, 1);
  cell.value = texto;
  cell.style = estilo;
  aba.getRow(linha).height = alturaAproximada(texto);
  return linha + 1;
}

/** Um item numerado, para listas curtas como o escopo. */
function escreverItem(
  aba: Worksheet,
  linha: number,
  texto: string,
  totalColunas: number,
  indice: number
): number {
  aba.mergeCells(linha, 1, linha, totalColunas);
  const cell = aba.getCell(linha, 1);
  cell.value = `${String(indice + 1).padStart(2, "0")}   ${texto}`;
  cell.style = ESTILO_CELULA;
  aba.getRow(linha).height = alturaAproximada(texto);
  return linha + 1;
}

/**
 * Uma altura de linha que caiba o texto.
 *
 * Não é exata, e não precisa ser: o Excel não auto-ajusta linha de célula
 * mesclada por API, e o erro nas duas direções é barato — uma linha de altura
 * a mais é espaço em branco, a menos corta texto. Por isso a conta arredonda
 * para cima, com folga.
 *
 * O divisor 110 é quantos caracteres cabem por linha na largura mesclada das
 * abas deste modelo. 15 pontos é a altura de uma linha de Calibri 10. Os dois
 * números são estimativa declarada, não medição — e é por isso que a folga
 * existe em vez de um ajuste exato.
 */
function alturaAproximada(texto: string, caracteresPorLinha = 110): number {
  const quebrasExplicitas = texto.split("\n").length;
  const quebrasPorComprimento = Math.ceil(texto.length / caracteresPorLinha);
  const linhas = Math.max(quebrasExplicitas, quebrasPorComprimento);
  return Math.max(15, linhas * 15);
}

