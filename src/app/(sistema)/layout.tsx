import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { authConfigurado } from "@/lib/auth/config";
import { Shell } from "@/components/layout/shell";
import type { NotificacaoExibida } from "@/components/layout/notificacoes";
import { obterRepositorio, obterRepositorioOperacao, dataCurta, derivarNotificacoes } from "@/lib/dados";

/**
 * Área autenticada.
 *
 * O middleware já barra quem não tem sessão; esta verificação é a
 * segunda camada — garante que nenhuma página do grupo renderize
 * conteúdo sem usuário, mesmo se o matcher for alterado por engano.
 *
 * A guarda de ambiente existe porque o Auth.js lança erro quando não há
 * segredo configurado, e na Fase 1 esse é o estado esperado.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS NOTIFICAÇÕES SÃO MONTADAS AQUI, NÃO NO COMPONENTE                 │
 * │                                                                      │
 * │ O sino recebe a lista pronta: título, descrição, destino, data já     │
 * │ formatada e o grupo (Hoje / Esta semana / Antes). Ele não sabe o que  │
 * │ é uma tarefa atrasada nem onde os dados moram.                        │
 * │                                                                      │
 * │ Isso mantém a casca de layout sem regra de negócio — e é o que        │
 * │ permite trocar a demonstração por consulta ao banco sem tocar no      │
 * │ componente. É o mesmo arranjo do índice da busca.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export default async function LayoutSistema({ children }: { children: React.ReactNode }) {
  if (!authConfigurado()) {
    redirect("/entrar");
  }

  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/entrar");
  }

  // O índice da busca e as notificações cruzam a entrada (leads e
  // diagnósticos) com a operação (clientes, tarefas, compromissos).
  const [itensBusca, notificacoes] = await Promise.all([
    obterRepositorioOperacao().listarIndiceBusca(),
    montarNotificacoes(),
  ]);

  return (
    <Shell
      usuario={{
        nome: sessao.user.name ?? "Érika Bruna",
        email: sessao.user.email ?? "",
      }}
      itensBusca={itensBusca}
      notificacoes={notificacoes}
    >
      {children}
    </Shell>
  );
}

/**
 * Lê as duas camadas e devolve o que o sino mostra.
 *
 * Diagnóstico não lido vem da ENTRADA (repositório de leads); tarefas e
 * compromissos vêm da OPERAÇÃO. Juntar as duas aqui, num lugar só, é o que
 * evita uma notificação que só enxerga metade do sistema.
 */
async function montarNotificacoes(): Promise<NotificacaoExibida[]> {
  const entrada = obterRepositorio();
  const operacao = obterRepositorioOperacao();

  const [leads, diagnosticos, tarefas, clientes, compromissos] = await Promise.all([
    entrada.listarLeads(),
    entrada.listarDiagnosticos(),
    operacao.listarTarefas(),
    operacao.listarClientes(),
    operacao.listarCompromissos(),
  ]);

  const leadPorId = new Map(leads.map((l) => [l.id, l]));

  const diagnosticosNaoLidos = diagnosticos
    .filter((d) => {
      const lead = leadPorId.get(d.leadId);
      return lead && (lead.status === "NOVO" || lead.status === "EM_ANALISE");
    })
    .map((d) => ({
      leadId: d.leadId,
      leadNome: leadPorId.get(d.leadId)?.nomeFantasia ?? "Lead",
      quando: d.respondidoEm,
    }));

  const agora = new Date();

  const brutas = derivarNotificacoes(
    { tarefas, clientes, compromissos, diagnosticosNaoLidos },
    agora
  );

  return brutas.map((n) => ({
    id: n.id,
    titulo: n.titulo,
    descricao: n.descricao,
    href: n.href,
    quando: dataCurta(n.quando),
    grupo: agruparPorPeriodo(n.quando, agora),
  }));
}

/** Rótulo de período. É leitura, não prioridade. */
function agruparPorPeriodo(quando: Date, agora: Date): string {
  const dia = 24 * 60 * 60 * 1000;
  const diferenca = agora.getTime() - quando.getTime();

  if (diferenca < dia) return "Hoje";
  if (diferenca < 7 * dia) return "Esta semana";
  return "Antes";
}
