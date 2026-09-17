/**
 * Implementação de DEMONSTRAÇÃO do contrato de dados.
 *
 * Lê de ./dados.ts e responde exatamente como o banco responderá.
 *
 * As únicas coisas que ela faz além de repassar são as que o banco também
 * faria — ordenar por data decrescente, recortar um limite, contar — e ela
 * as faz com os mesmos critérios que as consultas SQL vão usar. Se uma
 * tela depender de uma ordenação que só existe aqui, o erro aparece agora
 * e não quando o banco entrar.
 *
 * `SINAIS` são derivados, não digitados: cada resposta é traduzida pelos
 * mesmos `sinaisDaResposta()` que a implementação real usará. Isso existe
 * para que a demonstração NÃO esconda um erro de derivação — se a função
 * errar, ela erra aqui também, à vista.
 */

import type { RepositorioEntrada, ResumoEntrada } from "../repositorio";
import type { Atividade, Diagnostico, Lead, Observacao } from "../tipos";
import { ATIVIDADES, DIAGNOSTICOS, LEADS, OBSERVACOES } from "./dados";

function porDataDecrescente<T extends { quando?: Date; criadoEm?: Date; respondidoEm?: Date }>(
  a: T,
  b: T
): number {
  const data = (x: T) => (x.quando ?? x.criadoEm ?? x.respondidoEm ?? new Date(0)).getTime();
  return data(b) - data(a);
}

export const repositorioMock: RepositorioEntrada = {
  async resumo(): Promise<ResumoEntrada> {
    const abertos = LEADS.filter((l) => l.status !== "CONVERTIDO" && l.status !== "ARQUIVADO");
    const novos = LEADS.filter((l) => l.status === "NOVO");
    const aguardando = LEADS.filter(
      (l) => l.diagnosticoId !== null && (l.status === "NOVO" || l.status === "EM_ANALISE")
    );

    return {
      leadsTotal: LEADS.length,
      leadsAbertos: abertos.length,
      leadsNovos: novos.length,
      diagnosticosRecebidos: DIAGNOSTICOS.length,
      aguardandoLeitura: aguardando.length,
    };
  },

  async listarLeads(): Promise<Lead[]> {
    return [...LEADS].sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime());
  },

  async obterLead(id: string): Promise<Lead | null> {
    return LEADS.find((l) => l.id === id) ?? null;
  },

  async listarDiagnosticos(): Promise<Diagnostico[]> {
    return [...DIAGNOSTICOS].sort((a, b) => b.respondidoEm.getTime() - a.respondidoEm.getTime());
  },

  async obterDiagnostico(id: string): Promise<Diagnostico | null> {
    return DIAGNOSTICOS.find((d) => d.id === id) ?? null;
  },

  async obterDiagnosticoDoLead(leadId: string): Promise<Diagnostico | null> {
    return DIAGNOSTICOS.find((d) => d.leadId === leadId) ?? null;
  },

  async listarObservacoes(leadId: string): Promise<Observacao[]> {
    return OBSERVACOES.filter((o) => o.leadId === leadId).sort(
      (a, b) => b.criadoEm.getTime() - a.criadoEm.getTime()
    );
  },

  async listarAtividade(limite = 12): Promise<Atividade[]> {
    return [...ATIVIDADES].sort(porDataDecrescente).slice(0, limite);
  },
};
