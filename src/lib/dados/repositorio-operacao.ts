/**
 * O CONTRATO DA OPERAÇÃO.
 *
 * Mesmo princípio do contrato de entrada: as telas de cliente, consultoria,
 * tarefa, processo, ficha e ingrediente falam com esta interface e não sabem
 * de onde o dado vem. Trocar a demonstração pelo banco é escrever uma
 * implementação nova daqui — nenhuma tela muda.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ UMA DECISÃO SOBRE AGRUPAMENTO, E POR QUE ELA É ASSIM                 │
 * │                                                                      │
 * │ O painel "precisa da sua atenção" e o conjunto de notificações são   │
 * │ DERIVADOS, não armazenados.                                             │
 * │                                                                      │
 * │ Não existe uma tabela de "atenção" no banco, e não deve existir: uma │
 * │ linha de atenção é uma cópia de um estado que já está em outro       │
 * │ lugar. Copiada, ela desatualiza — o cliente responde, a pendência    │
 * │ resolve, e o alerta continua na tela dizendo que precisa de você.    │
 * │                                                                      │
 * │ Aqui elas são calculadas a partir das tarefas atrasadas, das fichas  │
 * │ sem dado, dos acompanhamentos vencidos e dos diagnósticos não lidos. │
 * │ É a mesma escolha que a Fase 2 fez para os sinais do diagnóstico:    │
 * │ derivar em vez de digitar, para que um erro de regra apareça à vista.│
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O QUE ESTE CONTRATO NÃO TEM, DE PROPÓSITO
 *
 * Não existe `calcularCusto()`, não existe `obterCmv()`, não existe
 * `resumoFinanceiro()`. Eles dependeriam dos pontos 4, 5, 6, 7, 9 e 19, que
 * seguem abertos. Quando existirem, entram aqui como MÉTODOS — nunca como
 * campos que a tela preenche.
 */

import type { ItemBusca } from "./busca";
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
  ItemAtencao,
  ItemFicha,
  Notificacao,
  ParcelaContrato,
  PrecoIngrediente,
  Processo,
  StatusAcao,
  Tarefa,
} from "./tipos-operacao";

/** Números do topo do dashboard. Contagens, não indicadores. */
export type ResumoOperacao = {
  clientesAtivos: number;
  consultoriasEmAndamento: number;
  fichasTotal: number;
  fichasAguardandoDados: number;
  processosTotal: number;
  ingredientesTotal: number;
  tarefasHoje: number;
  tarefasAtrasadas: number;
  acompanhamentosPendentes: number;
};

/**
 * Uma linha da lista de clientes, já com os números que ela exibe.
 *
 * O `id` existe mesmo com `cliente.id` ao lado: ele é o que permite que a
 * linha entre numa lista genérica sem que a lista precise saber que tipo de
 * coisa está mostrando. Duas fontes de identidade soam redundantes, mas o
 * custo é zero — e a alternativa seria a lista de clientes ter um formato
 * de linha diferente de todas as outras, só por causa da forma do dado.
 */
export type LinhaCliente = {
  id: string;
  cliente: Cliente;
  consultoriaAtiva: Consultoria | null;
  fichasTotal: number;
  processosTotal: number;
  pendencias: number;
  ultimaAtividadeEm: Date;
};

/** Uma linha da lista de consultorias. Ver a nota acima sobre o `id`. */
export type LinhaConsultoria = {
  id: string;
  consultoria: Consultoria;
  cliente: Cliente;
  acoesTotal: number;
  acoesConcluidas: number;
  ultimoAcompanhamentoEm: Date | null;
};

/**
 * Uma linha da lista de contratos.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE OS NÚMEROS FINANCEIROS VÊM PRONTOS AQUI                      │
 * │                                                                      │
 * │ As somas de valor e de valor pago são feitas UMA VEZ, no repositório, │
 * │ e chegam à tela somadas. A alternativa — a lista receber contratos    │
 * │ crus e somar as parcelas de cada um — repetiria a mesma soma em cada  │
 * │ tela que mostrasse contrato, e bastaria uma delas somar diferente     │
 * │ (esquecer de excluir cancelada, contar duas vezes) para os números    │
 * │ divergirem entre duas páginas do mesmo sistema.                       │
 * │                                                                      │
 * │ São SOMAS de valores declarados. Não há juros, multa, correção ou     │
 * │ projeção em lugar nenhum.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type LinhaContrato = {
  id: string;
  contrato: Contrato;
  cliente: Cliente;
  /** Soma das parcelas não canceladas. */
  valorTotal: number;
  /** Soma das parcelas com status PAGO. */
  valorPago: number;
  parcelasTotal: number;
  parcelasPagas: number;
  /** A próxima parcela em aberto, por data. `null` quando não há. */
  proximaParcela: ParcelaContrato | null;
  /** Valor da parcela recorrente, quando o contrato tem mensalidade. */
  mensalidade: number | null;
};

/**
 * O INSUMO VISTO POR UM CLIENTE — já cruzado com a biblioteca.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE CRUZAMENTO MORA NO REPOSITÓRIO                         │
 * │                                                                      │
 * │ Uma tela que mostrasse "batata — R$ 6,10" precisaria de dois dados:   │
 * │ o preço daquele cliente e o nome/transformação do insumo na           │
 * │ biblioteca. Se ela mesma fizesse o cruzamento, cada tela faria o seu  │
 * │ — e a que esquecesse de filtrar por cliente mostraria o preço do      │
 * │ vizinho, com a mesma aparência de um número certo.                    │
 * │                                                                      │
 * │ Aqui o cruzamento acontece UMA vez. `precoAtual` já é o preço DO      │
 * │ CLIENTE quando ele tem um registrado, e cai para o preço de           │
 * │ referência da biblioteca quando não tem. `origemDoPreco` diz qual dos │
 * │ dois foi usado, para a tela poder mostrar a diferença sem adivinhar.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type LinhaIngredienteDoCliente = {
  id: string;
  ingrediente: Ingrediente;
  /** O preço vigente para ESTE cliente, ou o de referência quando não há. */
  precoAtual: number | null;
  /** Qual preço foi usado — o específico do cliente ou o da biblioteca. */
  origemDoPreco: "CLIENTE" | "BIBLIOTECA";
  fornecedor: string;
  atualizadoEm: Date;
  /** O histórico que vale para este cliente. */
  historico: PrecoIngrediente[];
  /** Quantas fichas deste cliente usam este insumo. */
  usosNoCliente: number;
};

/**
 * ONDE UM INSUMO ENTRA — a resposta para "de que pratos isto faz parte".
 *
 * A ficha aparece com o CLIENTE junto, e não só com o nome. Saber que a
 * batata entra no "Escondidinho" responde metade da pergunta; a outra metade
 * é de quem é esse prato — porque o custo da mesma batata muda de cliente
 * para cliente, e é justamente essa diferença que a consultoria investiga.
 */
export type FichaDoIngrediente = {
  ficha: Ficha;
  cliente: Cliente;
  /** A linha exata onde o insumo entra — quantidade, etapa, observação. */
  item: ItemFicha;
};

/** O insumo com tudo o que aponta para ele. Usado no detalhe do insumo. */
export type IngredienteEmUso = {
  ingrediente: Ingrediente;
  /** As fichas (de todos os clientes) que usam este insumo. */
  usos: FichaDoIngrediente[];
  /** Os clientes que têm preço próprio para este insumo. */
  precosDeClientes: Array<{ cliente: Cliente; registro: IngredienteDoCliente }>;
};

export interface RepositorioOperacao {
  // -- Resumo --------------------------------------------------------------
  resumoOperacao(): Promise<ResumoOperacao>;

  // -- Clientes ------------------------------------------------------------
  listarClientes(): Promise<Cliente[]>;
  obterCliente(id: string): Promise<Cliente | null>;
  listarLinhasCliente(): Promise<LinhaCliente[]>;

  // -- Consultorias --------------------------------------------------------
  listarConsultorias(): Promise<Consultoria[]>;
  obterConsultoria(id: string): Promise<Consultoria | null>;
  listarLinhasConsultoria(): Promise<LinhaConsultoria[]>;
  /** A consultoria ativa de um cliente (a mais recente não concluída). */
  consultoriaDoCliente(clienteId: string): Promise<Consultoria | null>;

  // -- Plano de ação -------------------------------------------------------
  listarAcoes(consultoriaId: string): Promise<AcaoPlano[]>;
  listarAcoesDoCliente(clienteId: string): Promise<AcaoPlano[]>;
  /**
   * Todas as ações, de todas as consultorias.
   *
   * Existe para o painel de atenção, que precisa cruzar as ações de todo
   * mundo para achar o que está parado no cliente. Fazer isso chamando
   * `listarAcoes` uma vez por consultoria seria N consultas para responder
   * uma pergunta só — e a pergunta é justamente "o que está parado AGORA",
   * que não é uma pergunta por consultoria.
   */
  listarTodasAsAcoes(): Promise<AcaoPlano[]>;

  // -- Tarefas -------------------------------------------------------------
  listarTarefas(): Promise<Tarefa[]>;

  // -- Acompanhamentos -----------------------------------------------------
  listarAcompanhamentos(): Promise<Acompanhamento[]>;
  listarAcompanhamentosDoCliente(clienteId: string): Promise<Acompanhamento[]>;
  listarCompromissos(): Promise<Compromisso[]>;

  // -- Processos -----------------------------------------------------------
  listarProcessos(): Promise<Processo[]>;
  obterProcesso(id: string): Promise<Processo | null>;
  listarProcessosDoCliente(clienteId: string): Promise<Processo[]>;

  // -- Fichas --------------------------------------------------------------
  listarFichas(): Promise<Ficha[]>;
  obterFicha(id: string): Promise<Ficha | null>;
  listarFichasDoCliente(clienteId: string): Promise<Ficha[]>;

  // -- Ingredientes --------------------------------------------------------
  listarIngredientes(): Promise<Ingrediente[]>;
  obterIngrediente(id: string): Promise<Ingrediente | null>;

  /**
   * O insumo com tudo o que aponta para ele: as fichas que o usam (com o
   * cliente de cada uma) e os clientes que têm preço próprio.
   *
   * É o que faz o detalhe do ingrediente responder "onde isto entra" e
   * "quem paga quanto por isto" — as duas perguntas que fazem um insumo ser
   * consultável e não só uma linha de lista.
   */
  obterIngredienteEmUso(id: string): Promise<IngredienteEmUso | null>;

  /**
   * A biblioteca de insumos VISTA POR UM CLIENTE.
   *
   * Todos os insumos da biblioteca aparecem — inclusive os que este cliente
   * ainda não tem preço registrado, que saem com o preço de referência e
   * `origemDoPreco: "BIBLIOTECA"`. Esconder os sem preço próprio faria a
   * lista parecer completa quando não é.
   */
  listarIngredientesDoCliente(clienteId: string): Promise<LinhaIngredienteDoCliente[]>;

  /** O preço deste insumo PARA ESTE cliente. `null` quando não há registro. */
  obterIngredienteDoCliente(
    clienteId: string,
    ingredienteId: string
  ): Promise<IngredienteDoCliente | null>;

  /**
   * O preço de cada insumo de um cliente, indexado por `ingredienteId`.
   *
   * Existe porque a ficha resolve N linhas de uma vez: chamar
   * `obterIngredienteDoCliente` por linha seria N consultas para montar uma
   * tela só, e a tela já sabe quais ids quer.
   */
  mapaDePrecosDoCliente(
    clienteId: string
  ): Promise<Map<string, IngredienteDoCliente>>;

  // -- Contratos -----------------------------------------------------------
  listarContratos(): Promise<Contrato[]>;
  obterContrato(id: string): Promise<Contrato | null>;
  listarContratosDoCliente(clienteId: string): Promise<Contrato[]>;
  listarLinhasContrato(): Promise<LinhaContrato[]>;

  // -- Documentos ----------------------------------------------------------
  listarDocumentos(): Promise<Documento[]>;
  listarDocumentosDoCliente(clienteId: string): Promise<Documento[]>;

  // -- Histórico -----------------------------------------------------------
  listarEventos(clienteId: string): Promise<EventoHistorico[]>;

  // -- Derivados -----------------------------------------------------------
  listarAtencao(): Promise<ItemAtencao[]>;
  listarNotificacoes(): Promise<Notificacao[]>;

  /**
   * O índice da busca global.
   *
   * Está aqui, e não montado dentro do componente, porque o índice cruza
   * DUAS camadas: a operação (cliente, ficha, ingrediente, processo) e a
   * entrada (lead). Um componente que importasse as duas listas de mock
   * saberia demais sobre a demonstração — e o contrato existiria só para
   * as telas que não precisam dele.
   */
  listarIndiceBusca(): Promise<ItemBusca[]>;
}

/**
 * ESCRITA — declarada, não conectada.
 *
 * A Fase 2.5 demonstra a OPERAÇÃO, e uma operação em que nada se move não se
 * demonstra. Por isso as telas aceitam criar tarefa, registrar acompanhamento,
 * criar ficha e mover ação de plano — e é exatamente por isso que esta
 * interface existe separada: o que a tela faz hoje vive em estado local do
 * navegador e desaparece ao recarregar, e o aviso disso está visível na tela.
 *
 * O QUE FALTA PARA LIGAR
 *
 *   1. Os modelos Prisma de cliente, consultoria, tarefa, ficha, processo,
 *      ingrediente e documento. Eles NÃO existem no schema — e criar as
 *      migrations a partir dos mocks seria definir o schema a partir da
 *      demonstração, que é o inverso do certo.
 *   2. `DATABASE_URL` do Neon. Não configurado.
 *   3. As decisões da Seção 17 que tocam o cadastro: 1, 2, 7 e 10.
 *
 * Quando os três existirem, é esta interface que vira implementação. As
 * telas continuam iguais.
 */
export interface RepositorioOperacaoEscrita {
  criarTarefa(dados: Omit<Tarefa, "id">): Promise<Tarefa>;
  concluirTarefa(id: string): Promise<Tarefa>;
  criarAcao(dados: Omit<AcaoPlano, "id">): Promise<AcaoPlano>;
  alterarStatusAcao(id: string, status: StatusAcao): Promise<AcaoPlano>;
  registrarAcompanhamento(dados: Omit<Acompanhamento, "id">): Promise<Acompanhamento>;
  criarFicha(dados: Omit<Ficha, "id">): Promise<Ficha>;
  converterLeadEmCliente(leadId: string, dados: Omit<Cliente, "id">): Promise<Cliente>;
}
