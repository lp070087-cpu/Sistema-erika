/**
 * MODELO: RELATÓRIO DE CONSULTORIA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE MUDOU AQUI, E POR QUE MUDOU                                    │
 * │                                                                      │
 * │ Este arquivo escrevia célula no ExcelJS. Agora ele DESCREVE uma grade, │
 * │ e quem escreve no Excel é `../escrever-grade`.                        │
 * │                                                                      │
 * │ A troca não é de estilo. Antes, o conteúdo desta planilha existia duas │
 * │ vezes — uma aqui, para o arquivo, e outra na tela, para a prévia. As   │
 * │ duas eram mantidas por disciplina, e disciplina falha em silêncio: a   │
 * │ tela continuaria dizendo o nome antigo de uma coluna que o arquivo     │
 * │ já tinha renomeado.                                                    │
 * │                                                                      │
 * │ Agora existe uma resposta só. `montarGrade` devolve a grade; o gerador │
 * │ grava a grade no Excel; a tela desenha a MESMA grade. É por isso que   │
 * │ a função é exportada — a página `/planilhas` a chama.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE QUATRO FOLHAS, E POR QUE NESTA ORDEM                          │
 * │                                                                      │
 * │ RESUMO          — quem é o cliente, o que está combinado, em que ponto │
 * │                   está, o que falta. Quem abre a planilha para "entender│
 * │                   rápido" não precisa ir além desta aba.               │
 * │                                                                      │
 * │ TAREFAS         — a lista do que ela precisa fazer. É a aba do dia a   │
 * │                   dia, e por isso vem antes do histórico.              │
 * │                                                                      │
 * │ ACOMPANHAMENTOS — o que aconteceu em cada encontro, do mais recente    │
 * │                   para o mais antigo. É a memória do trabalho.         │
 * │                                                                      │
 * │ INFORMAÇÕES     — de onde vieram os dados, o que a planilha não        │
 * │                   calcula e o que ainda depende de decisão. Existe      │
 * │                   porque a planilha vai ser lida longe do sistema.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { Acompanhamento, Tarefa } from "@/lib/dados";
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
  ordenarAcompanhamentosDoRelatorio,
  ordenarTarefasDoRelatorio,
  recorteDoCliente,
  situacaoDoPrazo,
} from "../relatorio";
import type { ColunaGrade, FolhaGrade, GradeDaPlanilha, LinhaGrade } from "../grade";
import { campo, dados, nota, pendencia, pixels, secao } from "../grade";
import { LARGURA } from "../estilos";

/** O subtítulo de toda folha: de quem é a planilha e quando saiu. */
export function subtituloDoRelatorio(ctx: ContextoPlanilha): string {
  const partes = [ctx.cliente.nomeFantasia];
  if (ctx.consultoria) partes.push(ctx.consultoria.titulo);
  partes.push(`gerado em ${dataCurta(ctx.geradoEm)}`);
  return partes.join(" · ");
}

/** A grade do relatório de consultoria, a partir do contexto. */
export function montarGradeDoRelatorio(ctx: ContextoPlanilha): GradeDaPlanilha {
  const { tarefas, acompanhamentos } = recorteDoCliente(ctx);
  const subtitulo = subtituloDoRelatorio(ctx);

  return {
    titulo: "RELATÓRIO DE CONSULTORIA",
    subtitulo,
    folhas: [
      folhaResumo(ctx, tarefas),
      folhaTarefas(tarefas, subtitulo, ctx.geradoEm),
      folhaAcompanhamentos(acompanhamentos, subtitulo, ctx.geradoEm),
      folhaInformacoes(ctx, tarefas, acompanhamentos, subtitulo),
    ],
  };
}

// ---------------------------------------------------------------------------
// FOLHA 1 — RESUMO
// ---------------------------------------------------------------------------

/**
 * As colunas do resumo.
 *
 * Existem mesmo sendo um par rótulo/valor: no Excel, a largura da coluna é uma
 * só para a aba inteira, e uma folha sem coluna declarada não tem largura
 * nenhuma. Quatro colunas porque é o número que a tabela de jornada no meio da
 * folha usa — e a coluna 1 é compartilhada pelos rótulos e pela primeira
 * coluna da jornada, exatamente como a Érika faz na planilha dela.
 */
const COLUNAS_RESUMO: readonly ColunaGrade[] = [
  { chave: "a", titulo: "", formato: "texto", largura: LARGURA.larga },
  { chave: "b", titulo: "", formato: "texto", largura: LARGURA.texto },
  { chave: "c", titulo: "", formato: "texto", largura: LARGURA.media },
  { chave: "d", titulo: "", formato: "texto", largura: LARGURA.larga },
];

function folhaResumo(
  ctx: ContextoPlanilha,
  tarefas: readonly Tarefa[],
  // A assinatura do rodapé é montada por `folhaInformacoes`, que é a última
  // aba. Esta folha não recebe o subtítulo — ela o PRODUZ, no `geradoEm`.
): FolhaGrade {
  const { cliente, consultoria } = ctx;
  const linhas: LinhaGrade[] = [];

  // ── O CLIENTE ────────────────────────────────────────────────────────
  linhas.push(secao("O CLIENTE"));
  linhas.push(campo("Nome fantasia", cliente.nomeFantasia));
  linhas.push(campo("Contato", cliente.nomeContato));
  linhas.push(campo("Tipo de negócio", ROTULO_TIPO_NEGOCIO[cliente.tipoNegocio]));
  linhas.push(campo("Cidade", cliente.cidade));
  linhas.push(campo("Situação", ROTULO_SITUACAO_CLIENTE[cliente.situacao]));
  linhas.push(campo("Modalidade", ROTULO_MODALIDADE[cliente.modalidade]));
  linhas.push(campo("Funcionários (declarado)", cliente.funcionariosDeclarados, "numero"));
  linhas.push(campo("Cliente desde", cliente.iniciadoEm, "data"));
  linhas.push(campo("Última atividade", cliente.ultimaAtividadeEm, "data"));

  // ── O QUE FOI DECLARADO ──────────────────────────────────────────────
  linhas.push(secao("O QUE O CLIENTE DECLAROU"));
  linhas.push(nota(cliente.problemaDeclarado || "Nada registrado no cadastro."));

  // ── A CONSULTORIA ────────────────────────────────────────────────────
  linhas.push(secao("A CONSULTORIA"));
  if (!consultoria) {
    linhas.push(
      nota(
        "Nenhuma consultoria registrada para este cliente. O que está acima são os dados do " +
          "cadastro — o trabalho ainda não começou."
      )
    );
  } else {
    linhas.push(campo("Título", consultoria.titulo));
    linhas.push(campo("Status", ROTULO_STATUS_CONSULTORIA[consultoria.status]));
    linhas.push(campo("Iniciada em", consultoria.iniciadaEm, "data"));
    linhas.push(
      campo(
        "Último acompanhamento",
        consultoria.ultimoAcompanhamentoEm ?? "nenhum ainda",
        consultoria.ultimoAcompanhamentoEm ? "data" : undefined
      )
    );
    linhas.push(campo("Próxima ação", consultoria.proximaAcao || "nada marcado"));
    linhas.push(
      campo(
        "Próxima ação em",
        consultoria.proximaAcaoEm ?? "sem data marcada",
        consultoria.proximaAcaoEm ? "data" : undefined
      )
    );

    // ── ESCOPO ─────────────────────────────────────────────────────────
    linhas.push(secao("ESCOPO COMBINADO"));
    if (consultoria.escopo.length === 0) {
      linhas.push(nota("Escopo ainda não escrito."));
    } else {
      consultoria.escopo.forEach((item, i) => {
        linhas.push(nota(`${String(i + 1).padStart(2, "0")}   ${item}`));
      });
    }

    // ── JORNADA ────────────────────────────────────────────────────────
    linhas.push(secao("ETAPAS DA JORNADA"));
    linhas.push({ tipo: "cabecalho" });
    for (const etapa of consultoria.jornada) {
      linhas.push(
        dados({
          a: etapa.etapa,
          b: etapa.estado,
          c:
            etapa.progresso !== undefined && etapa.total !== undefined
              ? `${etapa.progresso} de ${etapa.total}`
              : "—",
          d: etapa.nota,
        })
      );
    }
  }

  // ── O QUE ESTÁ PENDENTE ──────────────────────────────────────────────
  //
  // Bloco derivado de CONTAGEM, não de cálculo. "4 tarefas em aberto" é
  // `filter().length` — conferível contando as linhas da aba TAREFAS. Não há
  // percentual de conclusão, porque somar etapas de naturezas diferentes
  // exigiria pesos, e peso é decisão dela.
  linhas.push(secao("O QUE ESTÁ PENDENTE"));
  const abertas = tarefas.filter((t) => t.status !== "CONCLUIDA");
  linhas.push(campo("Tarefas em aberto", abertas.length, "numero"));
  linhas.push(
    campo("Das quais, prioridade alta", abertas.filter((t) => t.prioridade === "ALTA").length, "numero")
  );
  linhas.push(campo("Tarefas concluídas", tarefas.length - abertas.length, "numero"));

  linhas.push(
    nota(
      "Este relatório organiza o que está registrado sobre o cliente: cadastro, escopo, tarefas e " +
        "encontros. Os valores de custo, CMV e preço de venda são de cada PRATO e moram na ficha " +
        "técnica — somá-los aqui daria um número que não corresponde a nada. Onde um número " +
        "dependeria de uma decisão sua, ele fica em branco até você informá-lo."
    )
  );

  return {
    nome: ABAS_RELATORIO[0],
    titulo: "RELATÓRIO DE CONSULTORIA",
    colunas: COLUNAS_RESUMO,
    linhas,
    congelarLinhas: 0,
    mostrarCabecalho: false,
    assinatura: `Emitida em ${dataCurta(ctx.geradoEm)}. Se um dado aqui estiver errado, corrija no sistema e gere a planilha de novo — este arquivo é uma fotografia, não a fonte.`,
  };
}

// ---------------------------------------------------------------------------
// FOLHA 2 — TAREFAS
// ---------------------------------------------------------------------------

const COLUNAS_TAREFAS: readonly ColunaGrade[] = [
  { chave: "tarefa", titulo: "Tarefa", formato: "texto", largura: LARGURA.muitoLarga, larguraMinima: pixels(LARGURA.larga) },
  { chave: "status", titulo: "Status", formato: "texto", largura: LARGURA.media },
  { chave: "prioridade", titulo: "Prioridade", formato: "texto", largura: LARGURA.estreita },
  { chave: "prazo", titulo: "Prazo", formato: "data", largura: LARGURA.media, larguraMinima: 100 },
  { chave: "situacao", titulo: "Situação do prazo", formato: "texto", largura: LARGURA.media },
];

/**
 * A lista de tarefas, com o prazo em data E em distância.
 *
 * As duas colunas juntas porque uma sozinha engana: "12/03/2026" não diz nada
 * sem saber que hoje é 17/03, e "em 3 dias" não diz quando foi combinado.
 */
function folhaTarefas(
  tarefas: readonly Tarefa[],
  subtitulo: string,
  geradoEm: Date
): FolhaGrade {
  const linhas: LinhaGrade[] = [];
  const ordenadas = ordenarTarefasDoRelatorio(tarefas);

  if (ordenadas.length === 0) {
    linhas.push(nota("Nenhuma tarefa registrada para este cliente."));
  } else {
    linhas.push({ tipo: "cabecalho" });
    for (const t of ordenadas) {
      linhas.push(
        dados({
          tarefa: t.titulo,
          status: ROTULO_STATUS_TAREFA[t.status],
          prioridade: ROTULO_PRIORIDADE[t.prioridade],
          /*
            A `Date` crua, e não a data já formatada. Assim o Excel guarda um
            número de série de data, e ordenar, filtrar por período e usar em
            fórmula funcionam. Data escrita como texto bonito ordena
            alfabeticamente — e "01/12/2026" ficaria antes de "05/03/2026".
          */
          prazo: t.prazo,
          situacao: situacaoDoPrazo(t, geradoEm),
        })
      );
    }
  }

  return {
    nome: ABAS_RELATORIO[1],
    titulo: "TAREFAS",
    colunas: COLUNAS_TAREFAS,
    linhas,
    congelarLinhas: 3,
    mostrarCabecalho: true,
    assinatura:
      "As datas estão gravadas como data, e não como texto — dá para ordenar e filtrar pelo próprio Excel.",
  };
}

// ---------------------------------------------------------------------------
// FOLHA 3 — ACOMPANHAMENTOS
// ---------------------------------------------------------------------------

const COLUNAS_ACOMPANHAMENTOS: readonly ColunaGrade[] = [
  { chave: "data", titulo: "Data", formato: "data", largura: LARGURA.media, larguraMinima: 100 },
  { chave: "tipo", titulo: "Tipo", formato: "texto", largura: LARGURA.media },
  { chave: "modalidade", titulo: "Modalidade", formato: "texto", largura: LARGURA.estreita },
  { chave: "titulo", titulo: "Título", formato: "texto", largura: LARGURA.larga, larguraMinima: 200 },
  { chave: "resumo", titulo: "Resumo", formato: "texto", largura: LARGURA.texto, larguraMinima: 320 },
  { chave: "pendencias", titulo: "Pendências", formato: "texto", largura: LARGURA.larga, larguraMinima: 220 },
];

/**
 * O histórico dos encontros, do mais recente para o mais antigo.
 *
 * As pendências de cada encontro ficam numa coluna só, uma por linha dentro da
 * célula. A alternativa — uma linha por pendência — repetiria a data e o tipo
 * do encontro em cada uma e transformaria "quantas reuniões houve" numa tarefa
 * de deduplicação.
 */
function folhaAcompanhamentos(
  acompanhamentos: readonly Acompanhamento[],
  subtitulo: string,
  geradoEm: Date
): FolhaGrade {
  const linhas: LinhaGrade[] = [];
  const ordenados = ordenarAcompanhamentosDoRelatorio(acompanhamentos);

  if (ordenados.length === 0) {
    linhas.push(nota("Nenhum acompanhamento registrado para este cliente."));
  } else {
    linhas.push({ tipo: "cabecalho" });
    for (const a of ordenados) {
      linhas.push(
        dados({
          data: a.data,
          tipo: ROTULO_TIPO_ACOMPANHAMENTO[a.tipo],
          modalidade: ROTULO_MODALIDADE[a.modalidade],
          titulo: a.titulo,
          resumo: a.resumo,
          pendencias: a.pendencias.length === 0 ? "—" : a.pendencias.map((p) => `• ${p}`).join("\n"),
        })
      );
    }
  }

  return {
    nome: ABAS_RELATORIO[2],
    titulo: "ACOMPANHAMENTOS",
    colunas: COLUNAS_ACOMPANHAMENTOS,
    linhas,
    congelarLinhas: 3,
    mostrarCabecalho: true,
    assinatura: `Gerado em ${dataCurta(geradoEm)}. Os encontros estão do mais recente para o mais antigo.`,
  };
}

// ---------------------------------------------------------------------------
// FOLHA 4 — INFORMAÇÕES
// ---------------------------------------------------------------------------

const COLUNAS_INFORMACOES: readonly ColunaGrade[] = [
  { chave: "a", titulo: "", formato: "texto", largura: LARGURA.larga },
  { chave: "b", titulo: "", formato: "texto", largura: LARGURA.muitoLarga },
  { chave: "c", titulo: "", formato: "texto", largura: LARGURA.larga },
];

/**
 * A folha que explica o arquivo.
 *
 * Existe porque a planilha vai ser aberta FORA do sistema — anexada num e-mail,
 * num grupo de WhatsApp, impressa numa reunião. Quem recebe não tem como saber
 * que a coluna "Situação do prazo" foi calculada na data de geração, nem que a
 * ausência de uma coluna de custo é decisão e não esquecimento.
 */
function folhaInformacoes(
  ctx: ContextoPlanilha,
  tarefas: readonly Tarefa[],
  acompanhamentos: readonly Acompanhamento[],
  subtitulo: string
): FolhaGrade {
  const { cliente, consultoria } = ctx;
  const linhas: LinhaGrade[] = [];

  linhas.push(secao("DE ONDE VIERAM OS DADOS"));
  linhas.push(campo("Cliente", cliente.nomeFantasia));
  linhas.push(campo("Identificador do cliente", cliente.id));
  linhas.push(
    campo(
      "Consultoria",
      consultoria ? `${consultoria.titulo} (${consultoria.id})` : "não vinculada"
    )
  );
  linhas.push(campo("Tarefas incluídas", tarefas.length, "numero"));
  linhas.push(campo("Acompanhamentos incluídos", acompanhamentos.length, "numero"));
  linhas.push(campo("Emitida em", ctx.geradoEm, "data"));

  linhas.push(secao("O QUE ESTA PLANILHA NÃO CALCULA"));
  linhas.push(
    pendencia(
      "Custo, CMV e preço de venda — são de cada PRATO, e moram na ficha técnica dele. Somar o " +
        "custo de dois pratos num relatório de cliente daria um número que não corresponde a nada."
    )
  );
  linhas.push(
    nota(
      "Estas colunas não aparecem em nenhuma aba deste arquivo, de propósito. Não é ausência de " +
        "cálculo: é o cálculo estar no lugar certo. A ficha técnica calcula o custo do prato a " +
        "partir dos preços e das pesagens registrados, e o sistema não mostra número inventado."
    )
  );

  linhas.push(secao("COMO LER ESTE ARQUIVO"));
  linhas.push(
    nota(
      "As datas estão gravadas como data de verdade, e não como texto: dá para ordenar, filtrar " +
        "por período e usar em fórmula sem converter nada."
    )
  );
  linhas.push(
    nota(
      "As tabelas têm filtro na linha de cabeçalho, e o cabeçalho fica congelado ao rolar. A faixa " +
        "clara alternada é só leitura — não significa nada além de linha sim, linha não."
    )
  );
  linhas.push(
    nota(
      "A coluna \"Situação do prazo\" foi calculada na data de emissão desta planilha. Se o arquivo " +
        "for aberto uma semana depois, a coluna continua dizendo o que dizia — para atualizar, gere " +
        "a planilha de novo no sistema."
    )
  );

  linhas.push(secao("O QUE AINDA DEPENDE DE VOCÊ"));
  linhas.push(pendencia("Qual margem de segurança usar — o sistema tem o campo, e não tem o número."));
  linhas.push(
    pendencia("Se a margem muda por tipo de prato ou de serviço, e a partir de que porte.")
  );
  linhas.push(
    pendencia(
      "Quais planilhas você usa hoje no dia a dia, para o sistema nascer parecido com o que você já faz."
    )
  );

  linhas.push(
    nota(
      "Esta planilha foi gerada pelo Sistema Érika Bruna. O arquivo é uma fotografia dos dados no " +
        "momento da emissão: alterações feitas no sistema depois disso não aparecem aqui."
    )
  );

  return {
    nome: ABAS_RELATORIO[3],
    titulo: "INFORMAÇÕES",
    colunas: COLUNAS_INFORMACOES,
    linhas,
    congelarLinhas: 0,
    mostrarCabecalho: false,
    assinatura: `Gerada pelo Sistema Érika Bruna · ${subtitulo}`,
  };
}
