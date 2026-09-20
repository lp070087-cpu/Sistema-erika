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

  const [tarefas, acompanhamentos, fichas, ingredientes, ingredientesDoCliente] =
    await Promise.all([
      operacao.listarTarefas(),
      operacao.listarAcompanhamentos(),
      /*
        As fichas entram AGORA, e não quando o primeiro gerador de ficha
        existir.

        A ordem inversa — escrever o gerador e só então ampliar o contexto —
        tem uma armadilha conhecida: o formato do arquivo é decidido enquanto
        o contexto é estreito, e a primeira versão da aba nasce sem o que não
        estava à mão. Depois, acrescentar o que faltou é mudar formato já
        combinado. Carregar antes custa um `await` a mais hoje, na demonstração
        em memória, e evita essa dívida.

        `listarFichas()` e não `listarFichasDoCliente(clienteId)`: é a mesma
        escolha do bloco abaixo, e pelo mesmo motivo — o contrato tem o método
        por cliente, e usar o recorte amplo aqui faz a regra "só dado deste
        cliente" viver em UM lugar (o modelo que escreve a aba) em vez de
        depender de cada chamador lembrar de pedir a versão filtrada.
      */
      operacao.listarFichas(),
      /*
        OS INSUMOS — e a diferença entre as duas listas.

        `listarIngredientes()` é a BIBLIOTECA: o nome, a unidade de compra, o
        preço de referência e as pesagens de cada insumo. É o que permite
        escrever "Mandioca" em vez de `in_mandioca`, e calcular custo.

        `listarIngredientesDoCliente(clienteId)` é a MESMA biblioteca com o
        preço DESTE cliente resolvido — o preço dele quando existe, o de
        referência quando não. Vem por cliente porque é assim que o contrato
        a expõe, e é o recorte certo: preço é do par (cliente, insumo).

        As duas são necessárias e não se substituem. Sem a biblioteca não há
        nome nem pesagem; sem a do cliente o custo sairia pelo preço genérico
        enquanto a tela de ficha mostra o preço real dele — dois números
        diferentes para o mesmo prato, que é o defeito mais caro que esta
        pasta pode produzir.
      */
      operacao.listarIngredientes(),
      operacao.listarIngredientesDoCliente(clienteId),
    ]);

  return {
    cliente,
    // A consultoria pedida pode não existir, ou pode ser de OUTRO cliente se
    // alguém montar a URL à mão. Nos dois casos, o certo é ignorá-la em vez
    // de exportar o escopo de um cliente na planilha de outro.
    consultoria: consultoria && consultoria.clienteId === clienteId ? consultoria : null,
    tarefas,
    acompanhamentos,
    fichas,
    ingredientes,
    ingredientesDoCliente,
    observacoes: opcoes.observacoes ?? null,
    geradoEm: opcoes.geradoEm ?? new Date(),
  };
}
