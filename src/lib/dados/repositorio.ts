/**
 * O CONTRATO DE DADOS.
 *
 * Isto é a peça que a Fase 2 entrega de mais durável. As telas não falam
 * com o banco, não falam com arquivo e não sabem de onde o dado veio —
 * elas falam com este contrato. Trocar a demonstração pela persistência
 * real passa a ser escrever UMA implementação nova desta interface, sem
 * tocar em nenhuma tela.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O CONTRATO É ASSÍNCRONO NUMA FASE QUE NÃO GRAVA            │
 * │                                                                    │
 * │ Porque Prisma é assíncrono. Se as funções fossem síncronas agora,  │
 * │ a troca pela implementação real obrigaria a mexer em toda tela que │
 * │ as consome — exatamente o retrabalho que este arquivo existe para  │
 * │ evitar. Assinatura é a parte cara de mudar; é ela que fica certa   │
 * │ desde o começo.                                                    │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * O QUE A IMPLEMENTAÇÃO REAL VAI PRECISAR DE DECISÃO — e que ainda não
 * foi tomada:
 *
 *   · A ESCRITA DE OBSERVAÇÃO E DE MUDANÇA DE STATUS é feita pelo
 *     formulário público e pela fila. Persistir isso exige saber quem é o
 *     autor (hoje é sempre a consultora) e se o diagnóstico público grava
 *     direto ou passa por uma aprovação. Ponto 15, em aberto.
 *   · A CONVERSÃO DE LEAD EM CLIENTE depende do cadastro completo de
 *     cliente, que depende dos pontos 1, 2, 3 e 10. Por isso `converter`
 *     existe no contrato mas não é oferecida em nenhuma tela.
 */

import type {
  Atividade,
  Diagnostico,
  Lead,
  LeadStatus,
  Observacao,
} from "./tipos";

export type ResumoEntrada = {
  leadsTotal: number;
  leadsAbertos: number;
  leadsNovos: number;
  diagnosticosRecebidos: number;
  /** Leads que chegaram sem que ninguém tenha lido o diagnóstico. */
  aguardandoLeitura: number;
};

export interface RepositorioEntrada {
  /** Todo o conteúdo da Visão geral em uma chamada só. */
  resumo(): Promise<ResumoEntrada>;

  listarLeads(): Promise<Lead[]>;
  obterLead(id: string): Promise<Lead | null>;

  listarDiagnosticos(): Promise<Diagnostico[]>;
  obterDiagnostico(id: string): Promise<Diagnostico | null>;
  /** O diagnóstico do lead, quando houver — usado no detalhe do lead. */
  obterDiagnosticoDoLead(leadId: string): Promise<Diagnostico | null>;

  listarObservacoes(leadId: string): Promise<Observacao[]>;
  listarAtividade(limite?: number): Promise<Atividade[]>;
}

/**
 * ESCRITA — declarada, não conectada.
 *
 * Estas operações dependem de decisões que ainda não existem (ponto 15,
 * e o cadastro de cliente). Elas ficam aqui registradas para que a
 * interface fique estável, mas o formulário público da Fase 2 NÃO grava:
 * ele mostra a conclusão e a promessa de retorno, que é o comportamento
 * honesto enquanto não há banco e enquanto não se sabe se o lead entra
 * direto na fila ou passa por triagem.
 *
 * Quando a persistência entrar, é esta interface que muda de "declarada"
 * para "implementada" — e as telas seguem sem alteração.
 */
export interface RepositorioEntradaEscrita {
  criarLead(dados: Omit<Lead, "id" | "criadoEm">): Promise<Lead>;
  alterarStatusLead(id: string, status: LeadStatus): Promise<Lead>;
  registrarObservacao(leadId: string, texto: string): Promise<Observacao>;
  salvarDiagnostico(dados: Omit<Diagnostico, "id">): Promise<Diagnostico>;
}

/**
 * A dependência do banco está instalada e configurada?
 *
 * Mesma função que `authConfigurado()` cumpre para o Auth.js: permite que
 * uma tela diga "o banco ainda não está configurado" em vez de estourar
 * uma exceção de conexão na cara do usuário.
 */
export function persistenciaConfigurada(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
