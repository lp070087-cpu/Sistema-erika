/**
 * MODELO: RELATÃ“RIO DE CONSULTORIA.
 *
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚ O QUE ESTE ARQUIVO Ã‰, E O QUE ELE NÃƒO Ã‰                              â”‚
 * â”‚                                                                      â”‚
 * â”‚ Ã‰ o PRIMEIRO modelo funcional da Central de Planilhas â€” o Ãºnico que   â”‚
 * â”‚ gera arquivo de verdade nesta fase. Os outros quatro estÃ£o descritos  â”‚
 * â”‚ e nÃ£o implementados, e cada um diz por quÃª.                            â”‚
 * â”‚                                                                      â”‚
 * â”‚ NÃ£o Ã© uma ficha tÃ©cnica, nÃ£o Ã© custo, nÃ£o Ã© precificaÃ§Ã£o. Este        â”‚
 * â”‚ relatÃ³rio ORGANIZA o que jÃ¡ estÃ¡ registrado sobre uma consultoria:    â”‚
 * â”‚ quem Ã© o cliente, o que foi combinado, o que estÃ¡ pendente, o que     â”‚
 * â”‚ aconteceu nos encontros. Nenhuma cÃ©lula aqui Ã© resultado de conta que  â”‚
 * â”‚ a Ã‰rika nÃ£o tenha feito.                                              â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 *
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚ POR QUE QUATRO ABAS, E POR QUE NESTA ORDEM                          â”‚
 * â”‚                                                                      â”‚
 * â”‚ RESUMO          â€” a primeira coisa que se lÃª. Uma pÃ¡gina, nÃ£o uma     â”‚
 * â”‚                   tabela: quem Ã© o cliente, o que estÃ¡ combinado, em   â”‚
 * â”‚                   que ponto estÃ¡, e o que ainda falta. Quem abre a     â”‚
 * â”‚                   planilha para "entender rÃ¡pido" nÃ£o precisa ir alÃ©m  â”‚
 * â”‚                   desta aba.                                          â”‚
 * â”‚                                                                      â”‚
 * â”‚ TAREFAS         â€” a lista do que ela precisa fazer. Ã‰ a aba que ela   â”‚
 * â”‚                   abre no dia a dia, e por isso vem antes do histÃ³rico.â”‚
 * â”‚                                                                      â”‚
 * â”‚ ACOMPANHAMENTOS â€” o que aconteceu em cada encontro, do mais recente    â”‚
 * â”‚                   para o mais antigo. Ã‰ a memÃ³ria do trabalho.         â”‚
 * â”‚                                                                      â”‚
 * â”‚ INFORMAÃ‡Ã•ES     â€” de onde vieram os dados, o que a planilha nÃ£o        â”‚
 * â”‚                   calcula e o que ainda depende de decisÃ£o. Esta aba   â”‚
 * â”‚                   existe porque uma planilha que sai daqui vai ser     â”‚
 * â”‚                   lida longe do sistema, por alguÃ©m que nÃ£o viu a tela â”‚
 * â”‚                   e nÃ£o sabe o que estÃ¡ olhando.                       â”‚
 * â”‚                                                                      â”‚
 * â”‚ A ordem vai do resumo para o detalhe, e termina explicando a origem.   â”‚
 * â”‚ Ã‰ a mesma ordem em que se conta uma histÃ³ria.                          â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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
 * Gera o relatÃ³rio dentro de um `Workbook` jÃ¡ criado.
 *
 * Recebe o workbook em vez de criÃ¡-lo porque quem decide o formato do
 * arquivo Ã© o gerador, nÃ£o o modelo. Assim um segundo modelo pode entrar no
 * MESMO arquivo â€” "relatÃ³rio + fichas em uma planilha sÃ³" â€” sem reescrever
 * nada aqui.
 */
export function escreverRelatorioConsultoria(wb: Workbook, ctx: ContextoPlanilha): void {
  const subtitulo = subtituloDoArquivo(ctx);

  /*
    Tarefas e acompanhamentos chegam como listas do repositÃ³rio â€” filtrar por
    cliente Ã© responsabilidade DESTE arquivo, e nÃ£o de quem chama. Se o filtro
    ficasse em quem chama, o segundo modelo a esquecÃª-lo gravaria dado de um
    cliente na planilha de outro. Filtro do lado de dentro nÃ£o tem como ser
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
    A aba ativa Ã© a PRIMEIRA, e nÃ£o a Ãºltima escrita. Sem esta linha o Excel
    abre o arquivo na aba INFORMAÃ‡Ã•ES â€” que Ã© onde o cÃ³digo parou de escrever
    â€” e a pessoa cai num bloco de notas sobre metodologia em vez do resumo do
    cliente. Ã‰ um detalhe de uma linha que decide qual Ã© a primeira impressÃ£o
    do arquivo.
  */
  wb.views = [{ x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, activeTab: 0, visibility: 'visible' }];
}

/**
 * A segunda linha de todo cabeÃ§alho: de quem Ã© a planilha e quando saiu.
 *
 * Repetida nas quatro abas de propÃ³sito. Uma aba impressa sozinha, ou
 * copiada para outro arquivo, precisa continuar dizendo a quem se refere â€”
 * e "Planilha1" nÃ£o diz nada.
 */
function subtituloDoArquivo(ctx: ContextoPlanilha): string {
  const partes = [ctx.cliente.nomeFantasia];
  if (ctx.consultoria) partes.push(ctx.consultoria.titulo);
  partes.push(`gerado em ${dataCurta(ctx.geradoEm)}`);
  return partes.join(" Â· ");
}

// ---------------------------------------------------------------------------
// ABA 1 â€” RESUMO
// ---------------------------------------------------------------------------

/**
 * O resumo Ã© a Ãºnica aba que NÃƒO Ã© uma tabela.
 *
 * Ã‰ uma pÃ¡gina: blocos de rÃ³tulo e valor, um embaixo do outro. Tabela serve
 * para listar muitos itens iguais; o resumo tem sete fatos diferentes sobre
 * um cliente sÃ³, e forÃ§ar isso numa grade de linhas e colunas criaria uma
 * coluna "Campo" que ninguÃ©m filtra e uma coluna "Valor" com tipos mistos.
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
  let linha = aplicarCabecalho(aba, "RELATÃ“RIO DE CONSULTORIA", subtitulo, colunas);

  /*
    As larguras do resumo sÃ£o largas de propÃ³sito. A largura de uma coluna no
    Excel Ã© uma sÃ³ para a aba inteira â€” a coluna 1 Ã© usada tanto pelos rÃ³tulos
    do resumo quanto pela coluna "Etapa" da tabela de jornada. Escolher
    `larga` atende aos dois; `estreita` apertaria os rÃ³tulos.
  */
  aba.getColumn(1).width = LARGURA.larga;
  aba.getColumn(2).width = LARGURA.texto;
  aba.getColumn(3).width = LARGURA.media;
  aba.getColumn(4).width = LARGURA.media;

  // â”€â”€ O CLIENTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  linha = escreverRotuloBloco(aba, linha, "O CLIENTE", colunas);
  linha = escreverCampo(aba, linha, "Nome fantasia", cliente.nomeFantasia);
  linha = escreverCampo(aba, linha, "Contato", cliente.nomeContato);
  linha = escreverCampo(aba, linha, "Tipo de negÃ³cio", ROTULO_TIPO_NEGOCIO[cliente.tipoNegocio]);
  linha = escreverCampo(aba, linha, "Cidade", cliente.cidade);
  linha = escreverCampo(aba, linha, "SituaÃ§Ã£o", ROTULO_SITUACAO_CLIENTE[cliente.situacao]);
  linha = escreverCampo(aba, linha, "Modalidade", ROTULO_MODALIDADE[cliente.modalidade]);
  linha = escreverCampo(aba, linha, "FuncionÃ¡rios (declarado)", cliente.funcionariosDeclarados);
  linha = escreverCampo(aba, linha, "Cliente desde", cliente.iniciadoEm, FORMATO_DATA);
  linha = escreverCampo(aba, linha, "Ãšltima atividade", cliente.ultimaAtividadeEm, FORMATO_DATA);
  linha += 1;

  // â”€â”€ O QUE FOI DECLARADO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  linha = escreverRotuloBloco(aba, linha, "O QUE O CLIENTE DECLAROU", colunas);
  linha = escreverTextoCorrido(
    aba,
    linha,
    cliente.problemaDeclarado || "Nada registrado no cadastro.",
    colunas
  );
  linha += 1;

  // â”€â”€ A CONSULTORIA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  linha = escreverRotuloBloco(aba, linha, "A CONSULTORIA", colunas);
  if (!consultoria) {
    linha = escreverTextoCorrido(
      aba,
      linha,
      "Nenhuma consultoria registrada para este cliente. O que estÃ¡ acima sÃ£o os dados do " +
        "cadastro â€” o trabalho ainda nÃ£o comeÃ§ou.",
      colunas
    );
    linha += 1;
  } else {
    linha = escreverCampo(aba, linha, "TÃ­tulo", consultoria.titulo);
    linha = escreverCampo(aba, linha, "Status", ROTULO_STATUS_CONSULTORIA[consultoria.status]);
    linha = escreverCampo(aba, linha, "Iniciada em", consultoria.iniciadaEm, FORMATO_DATA);
    linha = escreverCampo(
      aba,
      linha,
      "Ãšltimo acompanhamento",
      consultoria.ultimoAcompanhamentoEm ?? "nenhum ainda",
      consultoria.ultimoAcompanhamentoEm ? FORMATO_DATA : undefined
    );
    linha = escreverCampo(aba, linha, "PrÃ³xima aÃ§Ã£o", consultoria.proximaAcao || "nada marcado");
    linha = escreverCampo(
      aba,
      linha,
      "PrÃ³xima aÃ§Ã£o em",
      consultoria.proximaAcaoEm ?? "sem data marcada",
      consultoria.proximaAcaoEm ? FORMATO_DATA : undefined
    );
    linha += 1;

    // â”€â”€ ESCOPO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    linha = escreverRotuloBloco(aba, linha, "ESCOPO COMBINADO", colunas);
    if (consultoria.escopo.length === 0) {
      linha = escreverTextoCorrido(aba, linha, "Escopo ainda nÃ£o escrito.", colunas);
    } else {
      consultoria.escopo.forEach((item, i) => {
        linha = escreverItem(aba, linha, item, colunas, i);
      });
    }
    linha += 1;

    // â”€â”€ JORNADA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
              : "â€”",
        },
        { titulo: "Nota", largura: LARGURA.larga, valor: (e) => e.nota },
      ],
      consultoria.jornada
    );
    linha += 1;
  }

  // â”€â”€ O QUE ESTÃ PENDENTE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  //
  // Bloco derivado de CONTAGEM, nÃ£o de cÃ¡lculo. "4 tarefas em aberto" Ã©
  // `filter().length` â€” conferÃ­vel contando as linhas da aba TAREFAS. NÃ£o hÃ¡
  // percentual de conclusÃ£o, porque somar etapas de naturezas diferentes
  // exigiria pesos, e peso Ã© decisÃ£o da Ã‰rika (pendÃªncia 11).
  linha = escreverRotuloBloco(aba, linha, "O QUE ESTÃ PENDENTE", colunas);
  const abertas = tarefas.filter((t) => t.status !== "CONCLUIDA");
  linha = escreverCampo(aba, linha, "Tarefas em aberto", abertas.length);
  linha = escreverCampo(
    aba,
    linha,
    "Das quais, prioridade alta",
    abertas.filter((t) => t.prioridade === "ALTA").length
  );
  linha = escreverCampo(aba, linha, "Tarefas concluÃ­das", tarefas.length - abertas.length);
  linha += 1;

  // â”€â”€ A NOTA QUE EXPLICA O ESTADO DO ARQUIVO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  //
  // Fica na aba de resumo, e nÃ£o sÃ³ na INFORMAÃ‡Ã•ES, porque Ã© a aba que vai
  // ser lida. Uma nota no fim de uma aba que ninguÃ©m abre nÃ£o Ã© aviso: Ã©
  // arquivo morto.
  linha = escreverRotuloBloco(aba, linha, "SOBRE ESTA PLANILHA", colunas);
  linha = escreverNota(
    aba,
    linha,
    "Gerada pelo Sistema Ã‰rika Bruna a partir dos dados registrados no sistema. Os valores e " +
      "datas aqui sÃ£o os que estÃ£o no cadastro â€” nada foi recalculado, corrigido ou estimado. " +
      "O sistema nÃ£o calcula CMV, preÃ§o de venda, margem, Ã­ndice de cocÃ§Ã£o nem fator de correÃ§Ã£o: " +
      "essas contas dependem de regras que ainda nÃ£o foram definidas, e nÃ£o sÃ£o inventadas aqui.",
    colunas
  );
  linha = escreverNota(
    aba,
    linha,
    `Emitida em ${dataCurta(geradoEm)}. Se um dado aqui estiver errado, corrija no sistema e ` +
      "gere a planilha de novo â€” este arquivo Ã© uma fotografia, nÃ£o a fonte.",
    colunas
  );
}

// ---------------------------------------------------------------------------
// ABA 2 â€” TAREFAS
// ---------------------------------------------------------------------------

/**
 * A lista de tarefas, com o prazo em data E em distÃ¢ncia.
 *
 * As duas colunas juntas porque uma sozinha engana: "12/03/2026" nÃ£o diz
 * nada sem saber que hoje Ã© 17/03, e "3 dias" nÃ£o diz quando foi combinado.
 * A distÃ¢ncia Ã© o que muda a decisÃ£o de quem lÃª; a data Ã© o que serve de
 * prova. Ã‰ a mesma dupla que a tela de tarefas do sistema jÃ¡ usa.
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
    escreverAssinatura(aba, linha + 1, colunas, "Gerado pelo Sistema Ã‰rika Bruna.");
    return;
  }

  /*
    OrdenaÃ§Ã£o: abertas primeiro, por prazo crescente; concluÃ­das por Ãºltimo.
    Ã‰ a ordem em que a lista seria lida em voz alta, respondendo Ã  pergunta
    "o que eu tenho que fazer?".
  */
  const ordenadas = [...tarefas].sort((a, b) => {
    const aConcluida = a.status === "CONCLUIDA" ? 1 : 0;
    const bConcluida = b.status === "CONCLUIDA" ? 1 : 0;
    if (aConcluida !== bConcluida) return aConcluida - bConcluida;

    /*
      Tarefa sem prazo vai para o FIM do bloco, nÃ£o para o comeÃ§o. Se o
      `null` fosse tratado como zero, uma tarefa sem data apareceria como a
      mais urgente de todas â€” e a lista abriria com algo que nÃ£o tem prazo.
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
        titulo: "SituaÃ§Ã£o do prazo",
        largura: LARGURA.media,
        valor: (t) => situacaoDoPrazo(t, geradoEm),
      },
    ],
    ordenadas
  );

  /*
    A coluna Prazo recebe a `Date` crua, e nÃ£o `dataCurta(t.prazo)`. Isso Ã©
    deliberado: assim o Excel guarda um nÃºmero de sÃ©rie de data, e ordenar,
    filtrar por perÃ­odo e usar em fÃ³rmula funcionam. Uma data escrita como
    texto bonito ordena alfabeticamente â€” e "01/12/2026" ficaria antes de
    "05/03/2026". Onde nÃ£o hÃ¡ prazo, a cÃ©lula fica vazia: ausÃªncia de dado
    nÃ£o Ã© a string "â€”".
  */

  escreverAssinatura(
    aba,
    linha,
    colunas,
    "Gerado pelo Sistema Ã‰rika Bruna. As datas estÃ£o gravadas como data, e nÃ£o como texto â€” dÃ¡ para ordenar e filtrar pelo prÃ³prio Excel."
  );
}

/**
 * A distÃ¢ncia atÃ© o prazo, em palavras.
 *
 * Conta dias de CALENDÃRIO no fuso de SÃ£o Paulo, e nÃ£o diferenÃ§a de
 * milissegundos dividida por 24h. A diferenÃ§a importa: um prazo registrado
 * Ã s 21h de hoje fica a menos de 24 horas de distÃ¢ncia de agora, mas Ã©
 * amanhÃ£ â€” e "vence hoje" para um prazo de amanhÃ£ Ã© o tipo de erro que faz
 * alguÃ©m perder uma entrega.
 */
function situacaoDoPrazo(tarefa: Tarefa, agora: Date): string {
  if (tarefa.status === "CONCLUIDA") {
    return tarefa.concluidaEm ? `concluÃ­da em ${dataCurta(tarefa.concluidaEm)}` : "concluÃ­da";
  }
  if (!tarefa.prazo) return "sem prazo";

  const dias = diasDeCalendario(tarefa.prazo, agora);

  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhÃ£";
  if (dias > 1) return `em ${dias} dias`;
  if (dias === -1) return "venceu ontem";
  return `vencida hÃ¡ ${Math.abs(dias)} dias`;
}

/**
 * Dias de calendÃ¡rio entre duas datas, ignorando a hora.
 *
 * Depois de reduzir cada data ao seu dia, a subtraÃ§Ã£o nÃ£o tem como errar por
 * uma hora â€” que Ã© o problema clÃ¡ssico quando se comparam instantes e o
 * horÃ¡rio de verÃ£o entra no meio.
 */
function diasDeCalendario(depois: Date, antes: Date): number {
  const umDia = 86400000;
  return Math.round((inicioDoDiaUTC(depois) - inicioDoDiaUTC(antes)) / umDia);
}

/**
 * O dia em que a data cai em SÃ£o Paulo, expresso como meia-noite UTC.
 *
 * O fuso Ã© explÃ­cito porque sem ele uma data registrada Ã s 21h em SÃ£o Paulo
 * jÃ¡ Ã© o dia seguinte em UTC â€” e um prazo "que vence hoje" apareceria como
 * "venceu ontem". O mesmo cuidado foi tomado no cÃ¡lculo de atraso de parcela,
 * e os dois precisam concordar: sÃ£o a mesma pergunta feita em duas telas.
 *
 * `en-CA` formata como "2026-03-17", que `Date.parse` lÃª como meia-noite UTC.
 * Ã‰ a normalizaÃ§Ã£o que se quer, sem montar a data campo a campo.
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
// ABA 3 â€” ACOMPANHAMENTOS
// ---------------------------------------------------------------------------

/**
 * O histÃ³rico dos encontros, do mais recente para o mais antigo.
 *
 * As pendÃªncias de cada encontro ficam numa coluna sÃ³, uma por linha dentro
 * da cÃ©lula. A alternativa seria uma linha por pendÃªncia, o que repetiria a
 * data e o tipo do encontro em cada uma â€” e transformaria "quantas reuniÃµes
 * houve" numa tarefa de deduplicaÃ§Ã£o para quem lÃª.
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
    escreverAssinatura(aba, linha + 1, colunas, "Gerado pelo Sistema Ã‰rika Bruna.");
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
      { titulo: "TÃ­tulo", largura: LARGURA.larga, valor: (a) => a.titulo },
      { titulo: "Resumo", largura: LARGURA.texto, valor: (a) => a.resumo },
      {
        titulo: "PendÃªncias",
        largura: LARGURA.larga,
        valor: (a) =>
          a.pendencias.length === 0 ? "â€”" : a.pendencias.map((p) => `â€¢ ${p}`).join("\n"),
      },
    ],
    ordenados
  );

  escreverAssinatura(
    aba,
    linha,
    colunas,
    `Gerado pelo Sistema Ã‰rika Bruna em ${dataCurta(geradoEm)}. Os encontros estÃ£o do mais recente para o mais antigo.`
  );
}

// ---------------------------------------------------------------------------
// ABA 4 â€” INFORMAÃ‡Ã•ES
// ---------------------------------------------------------------------------

/**
 * A aba que explica o arquivo.
 *
 * Existe porque a planilha vai ser aberta FORA do sistema â€” anexada num
 * e-mail, num grupo de WhatsApp, impressa numa reuniÃ£o. Quem recebe nÃ£o tem
 * como saber que a coluna "SituaÃ§Ã£o do prazo" foi calculada na data de
 * geraÃ§Ã£o, nem que a ausÃªncia de uma coluna de custo Ã© decisÃ£o e nÃ£o
 * esquecimento. Esta aba Ã© o rÃ³tulo do produto.
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
  let linha = aplicarCabecalho(aba, "INFORMAÃ‡Ã•ES", subtitulo, colunas);

  aba.getColumn(1).width = LARGURA.larga;
  aba.getColumn(2).width = LARGURA.muitoLarga;
  aba.getColumn(3).width = LARGURA.larga;

  // â”€â”€ DE ONDE VIERAM OS DADOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  //
  // Os identificadores aparecem porque esta planilha Ã© uma fotografia de um
  // registro que existe no sistema, e a fotografia precisa ser rastreÃ¡vel:
  // com o id, dÃ¡ para achar o cliente exato de onde ela saiu.
  linha = escreverRotuloBloco(aba, linha, "DE ONDE VIERAM OS DADOS", colunas);
  linha = escreverCampo(aba, linha, "Cliente", cliente.nomeFantasia);
  linha = escreverCampo(aba, linha, "Identificador do cliente", cliente.id);
  linha = escreverCampo(
    aba,
    linha,
    "Consultoria",
    consultoria ? `${consultoria.titulo} (${consultoria.id})` : "nÃ£o vinculada"
  );
  linha = escreverCampo(aba, linha, "Tarefas incluÃ­das", tarefas.length);
  linha = escreverCampo(aba, linha, "Acompanhamentos incluÃ­dos", acompanhamentos.length);
  linha = escreverCampo(aba, linha, "Emitida em", geradoEm, FORMATO_DATA);
  linha += 1;

  // â”€â”€ O QUE ESTA PLANILHA NÃƒO CALCULA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  //
  // Em vermelho, e nÃ£o em nota de rodapÃ© cinza. Ã‰ a parte do arquivo que
  // protege a Ã‰rika de mandar para um cliente um documento que PARECE ter
  // custo e nÃ£o tem.
  linha = escreverRotuloBloco(aba, linha, "O QUE ESTA PLANILHA NÃƒO CALCULA", colunas);
  for (const texto of [
    "CMV â€” depende de decidir o que entra no custo, e isso ainda nÃ£o foi definido.",
    "PreÃ§o de venda e markup â€” dependem da margem alvo, que ainda nÃ£o foi definida.",
    "Ãndice de cocÃ§Ã£o e fator de correÃ§Ã£o â€” dependem da metodologia de perda e limpeza.",
    "Margem por prato â€” depende de todas as decisÃµes acima.",
  ]) {
    linha = escreverPendencia(aba, linha, texto, colunas);
  }
  linha = escreverNota(
    aba,
    linha,
    "Estas colunas nÃ£o aparecem em nenhuma aba deste arquivo, de propÃ³sito. Quando as regras " +
      "forem definidas, elas passam a existir â€” e atÃ© lÃ¡ o sistema nÃ£o mostra nÃºmero inventado.",
    colunas
  );
  linha += 1;

  // â”€â”€ COMO LER O ARQUIVO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  linha = escreverRotuloBloco(aba, linha, "COMO LER ESTE ARQUIVO", colunas);
  for (const texto of [
    "As datas estÃ£o gravadas como data de verdade, e nÃ£o como texto: dÃ¡ para ordenar, filtrar " +
      "por perÃ­odo e usar em fÃ³rmula sem converter nada. O formato exibido Ã© dia/mÃªs/ano e pode " +
      "ser trocado no Excel sem alterar o valor.",
    "As tabelas tÃªm filtro na linha de cabeÃ§alho, e o cabeÃ§alho fica congelado ao rolar. A faixa " +
      "clara alternada Ã© sÃ³ leitura â€” nÃ£o significa nada alÃ©m de linha sim, linha nÃ£o.",
    "A coluna \"SituaÃ§Ã£o do prazo\" foi calculada na data de emissÃ£o desta planilha. Se o arquivo " +
      "for aberto uma semana depois, a coluna continua dizendo o que dizia â€” para atualizar, gere " +
      "a planilha de novo no sistema.",
  ]) {
    linha = escreverTextoCorrido(aba, linha, texto, colunas);
  }
  linha += 1;

  // â”€â”€ O QUE AINDA DEPENDE DE DECISÃƒO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  linha = escreverRotuloBloco(aba, linha, "O QUE AINDA DEPENDE DE VOCÃŠ", colunas);
  for (const texto of [
    "Como o custo de um prato Ã© apurado â€” quais itens entram e como a perda Ã© tratada.",
    "Qual margem Ã© a alvo, e se ela muda por tipo de prato ou de serviÃ§o.",
    "Se a ficha tÃ©cnica deve trazer custo por porÃ§Ã£o, e como ele Ã© rateado.",
    "Quais planilhas vocÃª usa hoje no dia a dia, para o sistema nascer parecido com o que vocÃª jÃ¡ faz.",
  ]) {
    linha = escreverPendencia(aba, linha, texto, colunas);
  }
  linha += 1;

  linha = escreverNota(
    aba,
    linha,
    "Esta planilha foi gerada pelo Sistema Ã‰rika Bruna. O arquivo Ã© uma fotografia dos dados no " +
      "momento da emissÃ£o: alteraÃ§Ãµes feitas no sistema depois disso nÃ£o aparecem aqui.",
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

/** Uma linha de nota â€” itÃ¡lico, cinza, para o que explica e nÃ£o avisa. */
function escreverNota(
  aba: Worksheet,
  linha: number,
  texto: string,
  totalColunas: number
): number {
  return escreverLinhaMesclada(aba, linha, texto, totalColunas, ESTILO_NOTA);
}

/** Uma linha de pendÃªncia â€” vermelha, para o que trava. */
function escreverPendencia(
  aba: Worksheet,
  linha: number,
  texto: string,
  totalColunas: number
): number {
  return escreverLinhaMesclada(aba, linha, texto, totalColunas, ESTILO_PENDENCIA);
}

/**
 * O corpo comum das trÃªs: mesclar, escrever, ajustar a altura.
 *
 * As trÃªs fazem exatamente a mesma operaÃ§Ã£o com estilo diferente, e a altura
 * Ã© o motivo de estarem juntas: cÃ©lula mesclada NÃƒO auto-ajusta a altura no
 * Excel, entÃ£o um parÃ¡grafo de quatro linhas apareceria cortado em duas. Como
 * a biblioteca nÃ£o expÃµe auto-ajuste, a altura Ã© estimada â€” e ter isso num
 * lugar sÃ³ evita que a terceira variante esqueÃ§a o ajuste.
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
 * NÃ£o Ã© exata, e nÃ£o precisa ser: o Excel nÃ£o auto-ajusta linha de cÃ©lula
 * mesclada por API, e o erro nas duas direÃ§Ãµes Ã© barato â€” uma linha de altura
 * a mais Ã© espaÃ§o em branco, a menos corta texto. Por isso a conta arredonda
 * para cima, com folga.
 *
 * O divisor 110 Ã© quantos caracteres cabem por linha na largura mesclada das
 * abas deste modelo. 15 pontos Ã© a altura de uma linha de Calibri 10. Os dois
 * nÃºmeros sÃ£o estimativa declarada, nÃ£o mediÃ§Ã£o â€” e Ã© por isso que a folga
 * existe em vez de um ajuste exato.
 */
function alturaAproximada(texto: string, caracteresPorLinha = 110): number {
  const quebrasExplicitas = texto.split("\n").length;
  const quebrasPorComprimento = Math.ceil(texto.length / caracteresPorLinha);
  const linhas = Math.max(quebrasExplicitas, quebrasPorComprimento);
  return Math.max(15, linhas * 15);
}

