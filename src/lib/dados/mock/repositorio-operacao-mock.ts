/**
 * Implementação de DEMONSTRAÇÃO do contrato da operação.
 *
 * Espelha `repositorio-mock.ts` em espírito: ordena, filtra e conta com os
 * mesmos critérios que as consultas SQL vão usar. Nada aqui decide regra de
 * negócio — se uma tela depender de uma ordenação que só existe aqui, o erro
 * aparece agora e não quando o banco entrar.
 *
 * Os derivados (atenção e notificações) NÃO são recalculados aqui: eles
 * chamam as funções puras de ../derivacoes-operacao, que é o mesmo código que
 * a implementação real vai usar. Uma segunda cópia da regra seria uma segunda
 * chance de as duas discordarem.
 */

import type {
  FichaDoIngrediente,
  IngredienteEmUso,
  LinhaCliente,
  LinhaConsultoria,
  LinhaContrato,
  LinhaIngredienteDoCliente,
  RepositorioOperacao,
  ResumoOperacao,
} from "../repositorio-operacao";
import type {
  AcaoPlano,
  Acompanhamento,
  Cliente,
  Compromisso,
  Consultoria,
  Contrato,
  Documento,
  EventoHistorico,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
  Notificacao,
  Processo,
  Tarefa,
} from "../tipos-operacao";
import {
  contarParcelas,
  derivarAtencao,
  derivarNotificacoes,
  mensalidadeDoContrato,
  proximaParcela,
  ROTULO_PRIORIDADE,
  ROTULO_SITUACAO_CLIENTE,
  ROTULO_STATUS_CONSULTORIA,
  ROTULO_STATUS_TAREFA,
  ROTULO_TIPO_ACOMPANHAMENTO,
  ROTULO_TIPO_NEGOCIO,
  somarPagas,
  somarParcelas,
} from "../derivacoes-operacao";
import { ROTULO_ORIGEM, ROTULO_STATUS } from "../formato";
import type { ItemBusca } from "../busca";
import { DIAGNOSTICOS, LEADS } from "./dados";
import { CONTRATOS } from "./contratos";
import {
  ACOES,
  ACOMPANHAMENTOS,
  CLIENTES,
  COMPROMISSOS,
  CONSULTORIAS,
  DOCUMENTOS,
  EVENTOS,
  FICHAS,
  INGREDIENTES,
  INGREDIENTES_DO_CLIENTE,
  PROCESSOS,
  TAREFAS,
} from "./operacao";

/** Dias entre hoje e uma data — para achar a consultoria ativa mais recente. */
function maisRecente(a: Date, b: Date): Date {
  return a.getTime() >= b.getTime() ? a : b;
}

/**
 * A consultoria "ativa" de um cliente: a mais recente que não está concluída.
 *
 * Se todas estiverem concluídas, devolve a última mesmo assim — porque uma
 * tela que mostra "sem consultoria" para um cliente que teve uma precisa
 * dizer que ela terminou, não que nunca existiu.
 */
function consultoriaAtivaDe(clienteId: string): Consultoria | null {
  const doCliente = CONSULTORIAS.filter((c) => c.clienteId === clienteId);
  if (doCliente.length === 0) return null;

  const abertas = doCliente.filter((c) => c.status !== "CONCLUIDA");
  const candidatas = abertas.length > 0 ? abertas : doCliente;

  return candidatas.reduce((melhor, c) => (c.iniciadaEm > melhor.iniciadaEm ? c : melhor));
}

/**
 * Leads que responderam o diagnóstico e ainda não foram lidos.
 *
 * A regra é a mesma da Fase 2: lead NOVO ou EM_ANALISE com diagnóstico
 * vinculado. Aqui ela é reaplicada porque a operação precisa do mesmo fato
 * que a fila de leads — e não porque o dado mudou de lugar.
 */
function diagnosticosNaoLidos() {
  return LEADS.filter(
    (l) => l.diagnosticoId !== null && (l.status === "NOVO" || l.status === "EM_ANALISE")
  ).map((l) => {
    const dg = DIAGNOSTICOS.find((d) => d.id === l.diagnosticoId);
    return {
      leadId: l.id,
      leadNome: l.nomeFantasia,
      quando: dg?.respondidoEm ?? l.criadoEm,
    };
  });
}

export const repositorioOperacaoMock: RepositorioOperacao = {
  // -- Resumo --------------------------------------------------------------
  async resumoOperacao(): Promise<ResumoOperacao> {
    const agora = new Date();
    const abertas = TAREFAS.filter((t) => t.status !== "CONCLUIDA");
    const hoje = abertas.filter(
      (t) =>
        t.prazo !== null &&
        t.prazo.getFullYear() === agora.getFullYear() &&
        t.prazo.getMonth() === agora.getMonth() &&
        t.prazo.getDate() === agora.getDate()
    );
    const atrasadas = abertas.filter(
      (t) => t.prazo !== null && t.prazo.getTime() < new Date(agora).setHours(0, 0, 0, 0)
    );

    return {
      clientesAtivos: CLIENTES.filter(
        (c) => c.situacao === "ATIVO" || c.situacao === "EM_IMPLANTACAO"
      ).length,
      consultoriasEmAndamento: CONSULTORIAS.filter(
        (c) => c.status !== "CONCLUIDA" && c.status !== "PLANEJAMENTO"
      ).length,
      fichasTotal: FICHAS.length,
      fichasAguardandoDados: FICHAS.filter((f) => f.situacao === "AGUARDANDO_DADOS").length,
      processosTotal: PROCESSOS.length,
      ingredientesTotal: INGREDIENTES.length,
      tarefasHoje: hoje.length,
      tarefasAtrasadas: atrasadas.length,
      acompanhamentosPendentes: CONSULTORIAS.filter((c) => c.status === "AGUARDANDO_CLIENTE")
        .length,
    };
  },

  // -- Clientes ------------------------------------------------------------
  async listarClientes(): Promise<Cliente[]> {
    return [...CLIENTES].sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia, "pt-BR"));
  },

  async obterCliente(id: string): Promise<Cliente | null> {
    return CLIENTES.find((c) => c.id === id) ?? null;
  },

  async listarLinhasCliente(): Promise<LinhaCliente[]> {
    return CLIENTES.map((cliente) => {
      const consultoria = consultoriaAtivaDe(cliente.id);
      const fichas = FICHAS.filter((f) => f.clienteId === cliente.id);
      const processos = PROCESSOS.filter((p) => p.clienteId === cliente.id);
      const acoes = ACOES.filter(
        (a) => a.clienteId === cliente.id && a.status !== "CONCLUIDO"
      );

      return {
        id: cliente.id,
        cliente,
        consultoriaAtiva: consultoria,
        fichasTotal: fichas.length,
        processosTotal: processos.length,
        pendencias:
          acoes.filter((a) => a.status === "AGUARDANDO_CLIENTE").length +
          fichas.filter((f) => f.situacao === "AGUARDANDO_DADOS").length,
        // A última atividade é o mais recente entre o que já está no cadastro
        // e o que aconteceu depois — acompanhamento, tarefa concluída.
        ultimaAtividadeEm: [
          cliente.ultimaAtividadeEm,
          ...ACOMPANHAMENTOS.filter((a) => a.clienteId === cliente.id).map((a) => a.data),
          ...TAREFAS.filter((t) => t.clienteId === cliente.id && t.concluidaEm !== null).map(
            (t) => t.concluidaEm as Date
          ),
          ...EVENTOS.filter((e) => e.clienteId === cliente.id).map((e) => e.em),
        ].reduce(maisRecente),
      };
    }).sort((a, b) => b.ultimaAtividadeEm.getTime() - a.ultimaAtividadeEm.getTime());
  },

  // -- Consultorias --------------------------------------------------------
  async listarConsultorias(): Promise<Consultoria[]> {
    return [...CONSULTORIAS].sort((a, b) => b.iniciadaEm.getTime() - a.iniciadaEm.getTime());
  },

  async obterConsultoria(id: string): Promise<Consultoria | null> {
    return CONSULTORIAS.find((c) => c.id === id) ?? null;
  },

  async listarLinhasConsultoria(): Promise<LinhaConsultoria[]> {
    return CONSULTORIAS.map((consultoria) => {
      const cliente = CLIENTES.find((c) => c.id === consultoria.clienteId);
      const acoes = ACOES.filter((a) => a.consultoriaId === consultoria.id);

      return {
        id: consultoria.id,
        consultoria,
        // Se o cliente sumisse, isto seria um erro de dado — e o tipo não
        // permite `undefined`. Um cliente vazio expõe o problema na tela em
        // vez de quebrar a página inteira.
        cliente:
          cliente ??
          ({
            id: consultoria.clienteId,
            nomeFantasia: "—",
          } as Cliente),
        acoesTotal: acoes.length,
        acoesConcluidas: acoes.filter((a) => a.status === "CONCLUIDO").length,
        ultimoAcompanhamentoEm: consultoria.ultimoAcompanhamentoEm,
      };
    }).sort((a, b) => b.consultoria.iniciadaEm.getTime() - a.consultoria.iniciadaEm.getTime());
  },

  async consultoriaDoCliente(clienteId: string): Promise<Consultoria | null> {
    return consultoriaAtivaDe(clienteId);
  },

  // -- Plano de ação -------------------------------------------------------
  async listarAcoes(consultoriaId: string): Promise<AcaoPlano[]> {
    const ordem: Record<AcaoPlano["status"], number> = {
      EM_ANDAMENTO: 0,
      AGUARDANDO_CLIENTE: 1,
      A_FAZER: 2,
      CONCLUIDO: 3,
    };
    return ACOES.filter((a) => a.consultoriaId === consultoriaId).sort((a, b) => {
      const porStatus = ordem[a.status] - ordem[b.status];
      if (porStatus !== 0) return porStatus;
      const pa = a.prazo?.getTime() ?? Infinity;
      const pb = b.prazo?.getTime() ?? Infinity;
      return pa - pb;
    });
  },

  async listarAcoesDoCliente(clienteId: string): Promise<AcaoPlano[]> {
    return ACOES.filter((a) => a.clienteId === clienteId).sort(
      (a, b) => b.criadoEm.getTime() - a.criadoEm.getTime()
    );
  },

  async listarTodasAsAcoes(): Promise<AcaoPlano[]> {
    return [...ACOES];
  },

  // -- Tarefas -------------------------------------------------------------
  async listarTarefas(): Promise<Tarefa[]> {
    return [...TAREFAS];
  },

  // -- Acompanhamentos -----------------------------------------------------
  async listarAcompanhamentos(): Promise<Acompanhamento[]> {
    return [...ACOMPANHAMENTOS].sort((a, b) => b.data.getTime() - a.data.getTime());
  },

  async listarAcompanhamentosDoCliente(clienteId: string): Promise<Acompanhamento[]> {
    return ACOMPANHAMENTOS.filter((a) => a.clienteId === clienteId).sort(
      (a, b) => b.data.getTime() - a.data.getTime()
    );
  },

  async listarCompromissos(): Promise<Compromisso[]> {
    return [...COMPROMISSOS].sort((a, b) => a.quando.getTime() - b.quando.getTime());
  },

  // -- Processos -----------------------------------------------------------
  async listarProcessos(): Promise<Processo[]> {
    return [...PROCESSOS];
  },

  async obterProcesso(id: string): Promise<Processo | null> {
    return PROCESSOS.find((p) => p.id === id) ?? null;
  },

  async listarProcessosDoCliente(clienteId: string): Promise<Processo[]> {
    return PROCESSOS.filter((p) => p.clienteId === clienteId);
  },

  // -- Fichas --------------------------------------------------------------
  async listarFichas(): Promise<Ficha[]> {
    return [...FICHAS].sort((a, b) => b.atualizadaEm.getTime() - a.atualizadaEm.getTime());
  },

  async obterFicha(id: string): Promise<Ficha | null> {
    return FICHAS.find((f) => f.id === id) ?? null;
  },

  async listarFichasDoCliente(clienteId: string): Promise<Ficha[]> {
    return FICHAS.filter((f) => f.clienteId === clienteId).sort(
      (a, b) => b.atualizadaEm.getTime() - a.atualizadaEm.getTime()
    );
  },

  // -- Ingredientes --------------------------------------------------------
  async listarIngredientes(): Promise<Ingrediente[]> {
    return [...INGREDIENTES].sort(
      (a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime()
    );
  },

  async obterIngrediente(id: string): Promise<Ingrediente | null> {
    return INGREDIENTES.find((i) => i.id === id) ?? null;
  },

  /**
   * O insumo com tudo o que aponta para ele.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ AS TRÊS DIREÇÕES DA PERGUNTA "ONDE ISTO ENTRA"                     │
   * │                                                                    │
   * │ A varredura passa por TODAS as fichas, de todos os clientes — não   │
   * │ só pelas do cliente atual. Um insumo que só aparecesse nas fichas   │
   * │ de um cliente esconderia da consultora que ele já foi usado em      │
   * │ outro lugar, e essa é justamente a informação que faz uma           │
   * │ biblioteca valer a pena.                                            │
   * │                                                                    │
   * │ `precosDeClientes` só traz os clientes que têm registro PRÓPRIO.    │
   * │ Os que caem para o preço de referência não aparecem aqui — se       │
   * │ aparecessem, a lista diria "o Empório paga R$ 6,10" para um preço   │
   * │ que na verdade é o da biblioteca, e ninguém saberia a diferença.    │
   * └────────────────────────────────────────────────────────────────────┘
   */
  async obterIngredienteEmUso(id: string): Promise<IngredienteEmUso | null> {
    const ingrediente = INGREDIENTES.find((i) => i.id === id);
    if (!ingrediente) return null;

    const usos: FichaDoIngrediente[] = [];
    for (const ficha of FICHAS) {
      const item = ficha.itens.find((it) => it.ingredienteId === id);
      if (!item) continue;
      const cliente = CLIENTES.find((c) => c.id === ficha.clienteId);
      if (!cliente) continue;
      usos.push({ ficha, cliente, item });
    }

    const precosDeClientes = INGREDIENTES_DO_CLIENTE.filter(
      (r) => r.ingredienteId === id
    ).flatMap((registro) => {
      const cliente = CLIENTES.find((c) => c.id === registro.clienteId);
      return cliente ? [{ cliente, registro }] : [];
    });

    return {
      ingrediente,
      usos: usos.sort((a, b) => b.ficha.atualizadaEm.getTime() - a.ficha.atualizadaEm.getTime()),
      precosDeClientes,
    };
  },

  /**
   * A biblioteca vista por um cliente.
   *
   * Devolve TODOS os insumos, inclusive os que este cliente não tem preço
   * registrado — e é aí que está a decisão. Uma lista que mostrasse só os
   * insumos com preço do cliente pareceria completa, e a consultora não
   * saberia que metade da ficha dela está rodando com preço genérico.
   *
   * `usosNoCliente` é a contagem de fichas DESTE cliente que usam o insumo.
   * É o que permite responder "este insumo importa para este cliente?" sem
   * que a tela precise cruzar ficha por ficha.
   */
  async listarIngredientesDoCliente(clienteId: string): Promise<LinhaIngredienteDoCliente[]> {
    const porIngrediente = new Map(
      INGREDIENTES_DO_CLIENTE.filter((r) => r.clienteId === clienteId).map((r) => [
        r.ingredienteId,
        r,
      ])
    );

    const fichasDoCliente = FICHAS.filter((f) => f.clienteId === clienteId);

    return INGREDIENTES.map((ingrediente) => {
      const registro = porIngrediente.get(ingrediente.id) ?? null;
      const doCliente = registro?.precoAtual != null && registro.precoAtual > 0;

      const usosNoCliente = fichasDoCliente.filter((f) =>
        f.itens.some((it) => it.ingredienteId === ingrediente.id)
      ).length;

      return {
        id: `${clienteId}_${ingrediente.id}`,
        ingrediente,
        precoAtual: doCliente ? registro.precoAtual : ingrediente.precoAtual,
        origemDoPreco: doCliente ? ("CLIENTE" as const) : ("BIBLIOTECA" as const),
        fornecedor: doCliente ? registro.fornecedor : ingrediente.fornecedor,
        atualizadoEm: doCliente ? registro.atualizadoEm : ingrediente.atualizadoEm,
        historico: doCliente ? registro.historico : ingrediente.historico,
        usosNoCliente,
      };
    }).sort((a, b) => {
      // Primeiro o que este cliente realmente usa; depois o resto da
      // biblioteca. Dentro de cada grupo, o mais recente primeiro — é a
      // ordem em que ela olha a lista.
      if (a.usosNoCliente !== b.usosNoCliente) return b.usosNoCliente - a.usosNoCliente;
      return b.atualizadoEm.getTime() - a.atualizadoEm.getTime();
    });
  },

  async obterIngredienteDoCliente(
    clienteId: string,
    ingredienteId: string
  ): Promise<IngredienteDoCliente | null> {
    return (
      INGREDIENTES_DO_CLIENTE.find(
        (r) => r.clienteId === clienteId && r.ingredienteId === ingredienteId
      ) ?? null
    );
  },

  async mapaDePrecosDoCliente(
    clienteId: string
  ): Promise<Map<string, IngredienteDoCliente>> {
    return new Map(
      INGREDIENTES_DO_CLIENTE.filter((r) => r.clienteId === clienteId).map((r) => [
        r.ingredienteId,
        r,
      ])
    );
  },

  // -- Contratos -----------------------------------------------------------
  async listarContratos(): Promise<Contrato[]> {
    // Mais recente primeiro: o contrato que ela acabou de mexer é o que ela
    // quer ver ao abrir a tela.
    return [...CONTRATOS].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  },

  async obterContrato(id: string): Promise<Contrato | null> {
    return CONTRATOS.find((c) => c.id === id) ?? null;
  },

  async listarContratosDoCliente(clienteId: string): Promise<Contrato[]> {
    return CONTRATOS.filter((c) => c.clienteId === clienteId).sort(
      (a, b) => b.criadoEm.getTime() - a.criadoEm.getTime()
    );
  },

  /**
   * As linhas da lista, com as somas já feitas.
   *
   * As somas vêm de `derivacoes-operacao`, e não de um `reduce` escrito
   * aqui: é a MESMA função que a tela do detalhe usa para mostrar o resumo
   * financeiro. Se a regra de "cancelada não conta como dívida" mudar, ela
   * muda num lugar só, e a lista e o detalhe continuam concordando.
   */
  async listarLinhasContrato(): Promise<LinhaContrato[]> {
    const porId = new Map(CLIENTES.map((c) => [c.id, c]));

    return CONTRATOS.map((contrato) => {
      const cliente = porId.get(contrato.clienteId);
      if (!cliente) {
        // Um contrato sem cliente não deveria existir. Falhar alto é melhor
        // que exibir a linha com "cliente não identificado" e seguir.
        throw new Error(
          `Contrato ${contrato.id} aponta para o cliente ${contrato.clienteId}, que não existe.`
        );
      }
      const contagem = contarParcelas(contrato);
      return {
        id: contrato.id,
        contrato,
        cliente,
        valorTotal: somarParcelas(contrato),
        valorPago: somarPagas(contrato),
        parcelasTotal: contrato.parcelas.length,
        parcelasPagas: contagem.PAGO,
        proximaParcela: proximaParcela(contrato),
        mensalidade: mensalidadeDoContrato(contrato),
      };
    }).sort((a, b) => b.contrato.criadoEm.getTime() - a.contrato.criadoEm.getTime());
  },

  // -- Documentos ----------------------------------------------------------
  async listarDocumentos(): Promise<Documento[]> {
    return [...DOCUMENTOS].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  },

  async listarDocumentosDoCliente(clienteId: string): Promise<Documento[]> {
    return DOCUMENTOS.filter((d) => d.clienteId === clienteId).sort(
      (a, b) => b.criadoEm.getTime() - a.criadoEm.getTime()
    );
  },

  // -- Histórico -----------------------------------------------------------
  async listarEventos(clienteId: string): Promise<EventoHistorico[]> {
    return EVENTOS.filter((e) => e.clienteId === clienteId).sort(
      (a, b) => b.em.getTime() - a.em.getTime()
    );
  },

  // -- Derivados -----------------------------------------------------------
  async listarAtencao() {
    // A ficha do cliente e o processo entram porque a atenção nasce deles —
    // e nenhum dos dois carrega o nome do cliente, só o id.
    return derivarAtencao(
      {
        acoes: ACOES,
        fichas: FICHAS,
        processos: PROCESSOS,
        consultorias: CONSULTORIAS,
        clientes: CLIENTES,
        diagnosticosNaoLidos: diagnosticosNaoLidos(),
      },
      new Date()
    );
  },

  async listarNotificacoes(): Promise<Notificacao[]> {
    return derivarNotificacoes(
      {
        tarefas: TAREFAS,
        clientes: CLIENTES,
        compromissos: COMPROMISSOS,
        diagnosticosNaoLidos: diagnosticosNaoLidos(),
      },
      new Date()
    );
  },

  // -- Busca ---------------------------------------------------------------
  async listarIndiceBusca(): Promise<ItemBusca[]> {
    return [
      // Todo cliente é resultado — ele é o destino mais comum da busca.
      ...CLIENTES.map((c) => ({
        id: `cliente:${c.id}`,
        tipo: "CLIENTE" as const,
        titulo: c.nomeFantasia,
        detalhe: `Responsável: ${c.nomeContato} · ${ROTULO_TIPO_NEGOCIO[c.tipoNegocio]}`,
        href: `/clientes/${c.id}`,
        termos: `${c.cidade} ${c.nomeContato} ${ROTULO_SITUACAO_CLIENTE[c.situacao]}`,
      })),

      // A consultoria entra pelo título E pelo nome do cliente: procurar
      // "Emporio" precisa achar a consultoria do Emporio, não só a empresa.
      ...CONSULTORIAS.map((co) => {
        const cl = CLIENTES.find((c) => c.id === co.clienteId);
        return {
          id: `consultoria:${co.id}`,
          tipo: "CONSULTORIA" as const,
          titulo: co.titulo,
          detalhe: `${cl?.nomeFantasia ?? "—"} · ${ROTULO_STATUS_CONSULTORIA[co.status]}`,
          href: `/consultorias/${co.id}`,
          termos: `${cl?.nomeFantasia ?? ""} ${cl?.cidade ?? ""}`,
        };
      }),

      // Lead puro: já virou cliente é cadastro, não lead. Mostrar os dois
      // faria a busca devolver duas linhas para a mesma empresa.
      ...LEADS.filter((l) => l.clienteId === null).map((l) => ({
        id: `lead:${l.id}`,
        tipo: "LEAD" as const,
        titulo: l.nomeFantasia,
        detalhe: `Lead · ${ROTULO_STATUS[l.status]} · ${ROTULO_ORIGEM[l.origem]}`,
        href: `/leads/${l.id}`,
        termos: `${l.nomeContato} ${l.email}`,
      })),

      ...FICHAS.map((f) => {
        const cl = CLIENTES.find((c) => c.id === f.clienteId);
        return {
          id: `ficha:${f.id}`,
          tipo: "FICHA" as const,
          titulo: f.nome,
          detalhe: `${f.categoria} · ${cl?.nomeFantasia ?? "—"}`,
          href: `/fichas/${f.id}`,
          termos: `${cl?.nomeFantasia ?? ""}`,
        };
      }),

      ...INGREDIENTES.map((i) => ({
        id: `ingrediente:${i.id}`,
        tipo: "INGREDIENTE" as const,
        titulo: i.nome,
        detalhe: `Ingrediente · ${i.categoria} · ${i.fornecedor}`,
        href: `/ingredientes/${i.id}`,
        termos: `${i.fornecedor} ${i.unidade}`,
      })),

      ...PROCESSOS.map((p) => {
        const cl = CLIENTES.find((c) => c.id === p.clienteId);
        return {
          id: `processo:${p.id}`,
          tipo: "PROCESSO" as const,
          titulo: `${p.praca} — ${cl?.nomeFantasia ?? "—"}`,
          detalhe: `Processo · ${p.turno} · ${p.pratos.length} pratos`,
          href: `/processos/${p.id}`,
          termos: `${p.responsavel} ${p.turno} ${p.pratos.join(" ")}`,
        };
      }),

      // Acompanhamento entra pelo TÍTULO, que é como ela o chama depois:
      // "aquela visita do passe", "a devolutiva do diagnóstico".
      ...ACOMPANHAMENTOS.map((a) => {
        const cl = CLIENTES.find((c) => c.id === a.clienteId);
        return {
          id: `acompanhamento:${a.id}`,
          tipo: "ACOMPANHAMENTO" as const,
          titulo: a.titulo,
          detalhe: `${cl?.nomeFantasia ?? "—"} · ${ROTULO_TIPO_ACOMPANHAMENTO[a.tipo]}`,
          href: "/acompanhamentos",
          termos: `${cl?.nomeFantasia ?? ""} ${a.resumo} ${a.pendencias.join(" ")}`,
        };
      }),

      // Tarefa não tem página própria — o destino é o centro de tarefas,
      // que é onde ela existe. Um link para o nada seria pior.
      // Só as abertas: tarefa concluída não é o que se procura.
      ...TAREFAS.filter((t) => t.status !== "CONCLUIDA").map((t) => {
        const cl = t.clienteId ? CLIENTES.find((c) => c.id === t.clienteId) : null;
        return {
          id: `tarefa:${t.id}`,
          tipo: "TAREFA" as const,
          titulo: t.titulo,
          detalhe: `${cl?.nomeFantasia ?? "sem cliente"} · ${ROTULO_STATUS_TAREFA[t.status]}`,
          href: "/tarefas",
          termos: `${cl?.nomeFantasia ?? ""} ${ROTULO_PRIORIDADE[t.prioridade]}`,
        };
      }),
    ];
  },
};
