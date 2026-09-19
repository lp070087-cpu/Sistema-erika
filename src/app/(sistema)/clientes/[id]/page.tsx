import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obterRepositorio, obterRepositorioOperacao } from "@/lib/dados";
import type { AbaChave } from "./tipos";
import { ABA_ORDEM } from "./tipos";
import { TelaDoCliente } from "./tela-do-cliente";

export const metadata: Metadata = { title: "Cliente" };

/**
 * DETALHE DO CLIENTE — a tela 360°.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA PÁGINA É QUASE VAZIA, E POR QUE ISSO É CORRETO           │
 * │                                                                      │
 * │ Ela lê o repositório UMA vez e entrega o cenário pronto. Todo o        │
 * │ desenho — cabeçalho, painel de identificação, as oito abas — vive no   │
 * │ componente de cliente, e por um motivo só: o cadastro deste cliente    │
 * │ pode ser corrigido, e a correção vive no navegador.                    │
 * │                                                                      │
 * │ Não é preferência de arquitetura. `demonstracao.ts` é um módulo de     │
 * │ NAVEGADOR, com estado em memória. Uma página de servidor que lesse     │
 * │ dele receberia um estado vazio a cada requisição — e mostraria o nome  │
 * │ do cenário por cima de um cadastro que ela acabou de corrigir.         │
 * │                                                                      │
 * │ É o mesmo desenho da ficha técnica, e pela mesma razão.                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA RESPONDE                                              │
 * │                                                                      │
 * │ Todo o resto do sistema existe para alimentá-la. O lead vira cliente   │
 * │ aqui, a consultoria aponta para cá, a ficha, o processo e o            │
 * │ acompanhamento também. Quando a consultora quer saber "como está o     │
 * │ Empório Verde?", é esta página que responde — e por isso ela reúne     │
 * │ OITO seções.                                                          │
 * │                                                                      │
 * │ Oito seções empilhadas viram uma página de dois metros, que é         │
 * │ exatamente o que a Seção 3 do briefing proibiu ("Não criar páginas    │
 * │ gigantes"). Daí as abas.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
};

export default async function PaginaCliente({ params, searchParams }: Props) {
  const { id } = await params;
  const { aba } = await searchParams;

  const entrada = obterRepositorio();
  const operacao = obterRepositorioOperacao();

  const cliente = await operacao.obterCliente(id);
  if (!cliente) notFound();

  const [
    consultoria,
    acoes,
    fichas,
    processos,
    acompanhamentos,
    documentos,
    contratos,
    eventos,
    tarefas,
    ingredientes,
    precosDoCliente,
  ] = await Promise.all([
    operacao.consultoriaDoCliente(id),
    operacao.listarAcoesDoCliente(id),
    operacao.listarFichasDoCliente(id),
    operacao.listarProcessosDoCliente(id),
    operacao.listarAcompanhamentosDoCliente(id),
    operacao.listarDocumentosDoCliente(id),
    operacao.listarContratosDoCliente(id),
    operacao.listarEventos(id),
    operacao.listarTarefas(),
    /*
      A biblioteca inteira de insumos, e não só os que este cliente usa.

      A aba de fichas precisa dos DOIS: os insumos que já entram nas fichas
      dele, para calcular o custo, e a biblioteca completa, para poder montar
      uma ficha nova sem sair daqui. Buscar só os usados obrigaria a criar a
      ficha na biblioteca geral e voltar.
    */
    operacao.listarIngredientes(),
    /*
      Os preços DESTE cliente. Vêm separados dos da biblioteca porque o custo
      de uma ficha usa o preço do cliente dono dela — e um preço de outro
      cliente entrando aqui daria um custo errado com aparência de certo.
    */
    operacao.mapaDePrecosDoCliente(id),
  ]);

  // O diagnóstico de origem, quando o cliente veio de um lead. Sem ele a
  // aba mostra a explicação — não uma ficha vazia sem motivo.
  const leadOrigem = cliente.leadOrigemId ? await entrada.obterLead(cliente.leadOrigemId) : null;
  const diagnostico = leadOrigem
    ? await entrada.obterDiagnosticoDoLead(leadOrigem.id)
    : null;

  // Aba desconhecida na URL cai na primeira, em vez de renderizar vazio.
  const atual: AbaChave = ABA_ORDEM.includes(aba as AbaChave)
    ? (aba as AbaChave)
    : "visao-geral";

  return (
    <TelaDoCliente
      clienteDoCenario={cliente}
      abaAtual={atual}
      consultoria={consultoria}
      acoes={acoes}
      fichas={fichas}
      processos={processos}
      acompanhamentos={acompanhamentos}
      documentos={documentos}
      contratos={contratos}
      eventos={eventos}
      tarefas={tarefas}
      ingredientes={ingredientes}
      precosDoCliente={precosDoCliente}
      leadOrigem={leadOrigem}
      diagnostico={diagnostico}
    />
  );
}
