/**
 * O PONTO DE TROCA.
 *
 * Toda tela da Fase 2 importa `obterRepositorio()` daqui — nunca importa
 * ./mock/ diretamente. É esta indireção que faz a migração para o banco
 * ser uma troca de uma linha, e não uma varredura pelo projeto inteiro.
 *
 * O QUE FALTA PARA A PERSISTÊNCIA REAL
 *
 * 1. Resposta do ponto 15 — se o lead do formulário público entra direto
 *    na fila ou passa por triagem antes. Muda o `criarLead`.
 * 2. Resposta dos pontos 1, 2, 3 e 10 — cadastro completo de cliente.
 *    Sem eles não há para onde converter o lead.
 * 3. `DATABASE_URL` do Neon configurado, e a migration com as tabelas
 *    Lead, Diagnostic, DiagnosticAnswer e LeadNote.
 *
 * Enquanto os três não existirem juntos, ligar o banco produziria telas
 * vazias — o que é pior do que telas claramente marcadas como demonstração.
 */

import type { RepositorioEntrada } from "./repositorio";
import type { RepositorioOperacao } from "./repositorio-operacao";
import { repositorioMock } from "./mock/repositorio-mock";
import { repositorioOperacaoMock } from "./mock/repositorio-operacao-mock";

/** A demonstração está ligada? Toda tela que exibe dado precisa perguntar. */
export function usandoDemonstracao(): boolean {
  // Quando a implementação do Prisma existir, a decisão passa a ser:
  //   return !persistenciaConfigurada();
  return true;
}

export function obterRepositorio(): RepositorioEntrada {
  // A implementação do Prisma entra aqui, com o mesmo contrato:
  //   if (persistenciaConfigurada()) return repositorioPrisma;
  return repositorioMock;
}

/**
 * A operação — cliente, consultoria, tarefa, processo, ficha, ingrediente.
 *
 * Contrato separado do de entrada por uma razão prática: são dois ritmos de
 * migração. A entrada já tem decisões de schema encaminhadas; a operação
 * ainda depende dos pontos 1, 2, 7 e 10. Separá-los permite ligar um sem
 * arrastar o outro pela metade.
 */
export function obterRepositorioOperacao(): RepositorioOperacao {
  return repositorioOperacaoMock;
}

// Reexportações — as telas importam tudo de "@/lib/dados", nunca de um
// caminho interno. Assim a mudança de estrutura não quebra import.
export type {
  Atividade,
  Cliente,
  Diagnostico,
  Lead,
  LeadStatus,
  LeituraBloco,
  Observacao,
  Resposta,
  TipoServico,
  ValorResposta,
} from "./tipos";

export type { RepositorioEntrada, ResumoEntrada } from "./repositorio";
export { persistenciaConfigurada } from "./repositorio";

export {
  BLOCOS,
  BLOCOS_DIAGNOSTICO,
  BLOCO_POR_CHAVE,
  LACUNA,
  PERGUNTAS,
  PERGUNTA_POR_ID,
  TEXTO_SINAL,
  TOTAL_PERGUNTAS,
  perguntasDoBloco,
  sinaisDaResposta,
} from "./perguntas";

export type { BlocoChave, Opcao, Pergunta, Sinal, TipoPergunta } from "./perguntas";

export {
  ETAPAS,
  PERGUNTAS_ULTIMA_ETAPA,
  PERGUNTAS_EXTRAS_ULTIMA_ETAPA,
} from "./etapas";

export type { Etapa } from "./etapas";

export {
  declaracaoPrincipal,
  obrigatoriasEmFalta,
  respostaDe,
  respostasPorBloco,
  sinaisDoDiagnostico,
  sinaisEmTexto,
  sinaisResumidos,
  textoDe,
} from "./derivacoes";

export type { BlocoRespondido } from "./derivacoes";

export {
  ORDEM_STATUS,
  ROTULO_ORIGEM,
  DETALHE_ORIGEM,
  ROTULO_STATUS,
  STATUS_ABERTOS,
  TOM_STATUS,
  dataCurta,
  dataEHora,
  desdeQuando,
  respostaEmTexto,
  respostaVazia,
} from "./formato";

export type { TomStatus } from "./formato";

// --- Operação ---------------------------------------------------------------

export type {
  AcaoPlano,
  Acompanhamento,
  Cliente as ClienteOperacao,
  Compromisso,
  Consultoria,
  Documento,
  EstadoEtapa,
  EtapaConsultoria,
  EtapaJornada,
  EventoHistorico,
  Ficha,
  Ingrediente,
  ItemAtencao,
  ItemFicha,
  Modalidade,
  Notificacao,
  OpcaoRotulada,
  OrigemLead,
  PassoProcesso,
  PorteEstabelecimento,
  PrecoIngrediente,
  Prioridade,
  Processo,
  SituacaoCalculo,
  SituacaoCliente,
  SituacaoDocumento,
  SituacaoFicha,
  StatusAcao,
  StatusConsultoria,
  StatusTarefa,
  Tarefa,
  TipoAcompanhamento,
  TipoAtencao,
  TipoDocumento,
  TipoEvento,
  TipoNotificacao,
} from "./tipos-operacao";

export type {
  LinhaCliente,
  LinhaConsultoria,
  RepositorioOperacao,
  RepositorioOperacaoEscrita,
  ResumoOperacao,
} from "./repositorio-operacao";

export { agruparResultados, buscar, normalizar, ORDEM_TIPOS, ROTULO_TIPO_BUSCA } from "./busca";

export type { ItemBusca, ResultadoBusca, TipoResultadoBusca } from "./busca";

export {
  agruparTarefas,
  contarAcoes,
  contarFichas,
  derivarAtencao,
  derivarNotificacoes,
  diasEntre,
  etapasConcluidas,
  inicioDoDia,
  mesmoDia,
  ordenarPorPrazo,
  passosSemTempo,
  proximosEncontros,
  rotuloAtencao,
  somaDosTemposDeclarados,
  terminou,
  ultimoAcompanhamentoPorCliente,
  ROTULO_ETAPA,
  ROTULO_MODALIDADE,
  ROTULO_PRIORIDADE,
  ROTULO_SITUACAO_CLIENTE,
  ROTULO_SITUACAO_DOCUMENTO,
  ROTULO_SITUACAO_FICHA,
  ROTULO_STATUS_ACAO,
  ROTULO_STATUS_CONSULTORIA,
  ROTULO_STATUS_TAREFA,
  ROTULO_TIPO_ACOMPANHAMENTO,
  ROTULO_TIPO_DOCUMENTO,
  ROTULO_TIPO_NEGOCIO,
  TOM_PRIORIDADE,
  TOM_SITUACAO_CLIENTE,
  TOM_SITUACAO_DOCUMENTO,
  TOM_SITUACAO_FICHA,
  TOM_STATUS_CONSULTORIA,
} from "./derivacoes-operacao";

export type { FontesAtencao, GavetasTarefas, TomSituacao } from "./derivacoes-operacao";
