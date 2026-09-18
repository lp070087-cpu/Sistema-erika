/**
 * MONTAGEM DO CONTEXTO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO NÃO ESTÁ DENTRO DA ROTA                                 │
 * │                                                                      │
 * │ A rota HTTP deve saber três coisas: qual modelo, qual cliente, e o    │
 * │ que responder. Se ela também lesse o repositório, ela passaria a      │
 * │ saber que existe cliente, que existe consultoria, que existe tarefa   │
 * │ — e a Central de Planilhas deixaria de ser um módulo fechado.         │
 * │                                                                      │
 * │ Aqui é a única ponte entre o mundo dos dados e o mundo dos arquivos.  │
 * │ É esta função que vai mudar quando a persistência real entrar, e ela  │
 * │ é uma só de propósito.                                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { obterRepositorioOperacao } from "@/lib/dados";
import type { ContextoPlanilha } from "./tipos";

/**
 * Reúne tudo que uma planilha pode precisar sobre um cliente.
 *
 * Devolve `null` quando o cliente não existe — e `null` é resposta, não
 * erro: a rota transforma isso em 404, que é o que a situação é. Lançar
 * exceção aqui obrigaria a rota a distinguir "cliente não existe" de "a
 * geração quebrou", e as duas merecem respostas diferentes.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE BUSCA AS LISTAS INTEIRAS E NÃO FILTRA AQUI                   │
 * │                                                                      │
 * │ O repositório tem `listarAcompanhamentosDoCliente`, e não tem o       │
 * │ equivalente para tarefa. Em vez de somar um método ao contrato — que  │
 * │ obrigaria toda implementação futura a atendê-lo — as listas vêm       │
 * │ completas e o filtro acontece dentro do modelo.                       │
 * │                                                                      │
 * │ O modelo é o lugar certo para esse filtro, e não uma conveniência: a  │
 * │ regra "nenhum dado de outro cliente entra nesta planilha" precisa     │
 * │ morar em quem escreve a planilha. Se morasse aqui, o terceiro modelo  │
 * │ a esquecer o filtro vazaria dado entre clientes.                      │
 * │                                                                      │
 * │ Com a demonstração em memória, buscar a lista inteira custa um        │
 * │ `await` sem I/O. Quando o banco entrar, esta é a primeira consulta a  │
 * │ ganhar um `where` — e o lugar de fazer isso é este arquivo.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export async function montarContexto(
  clienteId: string,
  opcoes: { consultoriaId?: string | null; observacoes?: string | null; geradoEm?: Date } = {}
): Promise<ContextoPlanilha | null> {
  const operacao = obterRepositorioOperacao();

  const cliente = await operacao.obterCliente(clienteId);
  if (!cliente) return null;

  /*
    A consultoria vem da URL quando foi pedida a partir da tela de uma
    consultoria específica — a planilha sai daquela consultoria, e não da
    "ativa do cliente". Quando não vem, cai na ativa, que é o palpite certo
    para quem pediu a partir da ficha do cliente.

    `consultoriaDoCliente` já devolve a mais recente não concluída, então não
    há ordenação a fazer aqui.
  */
  const consultoria = opcoes.consultoriaId
    ? await operacao.obterConsultoria(opcoes.consultoriaId)
    : await operacao.consultoriaDoCliente(clienteId);

  const [tarefas, acompanhamentos] = await Promise.all([
    operacao.listarTarefas(),
    operacao.listarAcompanhamentos(),
  ]);

  return {
    cliente,
    // A consultoria pedida pode não existir, ou pode ser de OUTRO cliente se
    // alguém montar a URL à mão. Nos dois casos, o certo é ignorá-la em vez
    // de exportar o escopo de um cliente na planilha de outro.
    consultoria: consultoria && consultoria.clienteId === clienteId ? consultoria : null,
    tarefas,
    acompanhamentos,
    observacoes: opcoes.observacoes ?? null,
    geradoEm: opcoes.geradoEm ?? new Date(),
  };
}
