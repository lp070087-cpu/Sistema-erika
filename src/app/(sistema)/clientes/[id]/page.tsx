import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso } from "@/components/ui/superficie";
import { Abas } from "@/components/ui/abas";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { Dado, ListaDados } from "@/components/ui/dados";
import {
  ROTULO_MODALIDADE,
  ROTULO_ORIGEM,
  ROTULO_SITUACAO_CLIENTE,
  ROTULO_TIPO_NEGOCIO,
  TOM_SITUACAO_CLIENTE,
  dataCurta,
  obterRepositorio,
  obterRepositorioOperacao,
} from "@/lib/dados";
import type { AbaChave } from "./tipos";
import { ABA_ORDEM, ABAS } from "./tipos";
import { AbaVisaoGeral } from "./abas/visao-geral";
import { AbaDiagnostico } from "./abas/diagnostico";
import { AbaConsultoria } from "./abas/consultoria";
import { AbaFichas } from "./abas/fichas";
import { AbaProcessos } from "./abas/processos";
import { AbaAcompanhamentos } from "./abas/acompanhamentos";
import { AbaDocumentos } from "./abas/documentos";
import { AbaHistorico } from "./abas/historico";

export const metadata: Metadata = { title: "Cliente" };

/**
 * DETALHE DO CLIENTE — a tela 360°.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA TELA É A MAIS IMPORTANTE DO SISTEMA                     │
 * │                                                                      │
 * │ Todo o resto existe para alimentá-la. O lead vira cliente aqui, a     │
 * │ consultoria aponta para cá, a ficha, o processo e o acompanhamento    │
 * │ também. Quando a consultora quer saber "como está o Empório Verde?",  │
 * │ é esta página que responde — e por isso ela reúne OITO seções.        │
 * │                                                                      │
 * │ Oito seções empilhadas viram uma página de dois metros, que é        │
 * │ exatamente o que a Seção 3 do briefing proibiu ("Não criar páginas    │
 * │ gigantes"). Daí as abas.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O CABEÇALHO NÃO TEM NÚMERO                                    │
 * │                                                                      │
 * │ Um resumo de cliente costuma trazer "CMV médio", "margem", "custo     │
 * │ por prato". Nenhum deles entra: todos dependem dos pontos 4, 5, 6, 7  │
 * │ e 19, que seguem abertos. O cabeçalho traz o que é FATO — quem é a    │
 * │ empresa, quem responde por ela, o que ela é, como é atendida, em que  │
 * │ ponto está e desde quando. Seis campos, todos verificáveis.          │
 * │                                                                      │
 * │ A quantidade de fichas e processos aparece nas abas, como contagem —  │
 * │ número que se confere contra a lista, não indicador calculado.        │
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

  const base = `/clientes/${cliente.id}`;

  const conteudo = {
    "visao-geral": (
      <AbaVisaoGeral
        cliente={cliente}
        consultoria={consultoria}
        acoes={acoes}
        fichas={fichas}
        processos={processos}
        acompanhamentos={acompanhamentos}
        contratos={contratos}
        tarefas={tarefas.filter((t) => t.clienteId === cliente.id)}
      />
    ),
    diagnostico: (
      <AbaDiagnostico cliente={cliente} lead={leadOrigem} diagnostico={diagnostico} />
    ),
    consultoria: <AbaConsultoria cliente={cliente} consultoria={consultoria} acoes={acoes} />,
    fichas: <AbaFichas cliente={cliente} fichas={fichas} />,
    processos: <AbaProcessos cliente={cliente} processos={processos} />,
    acompanhamentos: (
      <AbaAcompanhamentos cliente={cliente} acompanhamentos={acompanhamentos} />
    ),
    documentos: (
      <AbaDocumentos
        cliente={cliente}
        documentos={documentos}
        contratos={contratos}
        consultoriaId={consultoria?.id ?? null}
      />
    ),
    historico: <AbaHistorico cliente={cliente} eventos={eventos} />,
  }[atual];

  /**
   * A contagem de cada aba é o tamanho da sua lista — número que se confere
   * abrindo a aba. As três primeiras ficam sem contagem de propósito: não há
   * o que contar em "visão geral", e mostrar "1" ao lado de "diagnóstico" ou
   * "consultoria" sugeriria uma medida onde só existe um registro.
   *
   * A aba Documentos conta contratos E documentos porque ela mostra os dois:
   * contar só os documentos faria o número discordar do que se vê ao abrir a
   * aba — o cartão de contratos está logo no topo, e um "2" ali em cima de
   * dois contratos seria lido como erro. As planilhas não entram na conta:
   * não são uma lista deste cliente, são uma ação que pode ser feita.
   */
  const abasComContagem = ABAS.map((a) => ({
    ...a,
    contagem:
      a.chave === "fichas"
        ? fichas.length
        : a.chave === "processos"
          ? processos.length
          : a.chave === "acompanhamentos"
            ? acompanhamentos.length
            : a.chave === "documentos"
              ? documentos.length + contratos.length
              : undefined,
  }));

  return (
    <div className="space-y-5">
      <Link
        href="/clientes"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para a carteira
      </Link>

      <CabecalhoPagina
        rotulo={ROTULO_ORIGEM[cliente.origem]}
        titulo={cliente.nomeFantasia}
        descricao={cliente.problemaDeclarado}
        acoes={
          <Etiqueta tom={TOM_SITUACAO_CLIENTE[cliente.situacao]}>
            {ROTULO_SITUACAO_CLIENTE[cliente.situacao]}
          </Etiqueta>
        }
      />

      <FaixaDemonstracao oQue="Este cliente, suas fichas, processos e acompanhamentos são inventados para demonstração. Nenhuma empresa, pessoa ou telefone aqui existe, e nada nesta tela foi gravado em banco." />

      {/* Os seis campos exigidos pela Seção 3 — todos fato, nenhum cálculo. */}
      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        <ListaDados colunas={3}>
          <Dado rotulo="Empresa">{cliente.nomeFantasia}</Dado>
          <Dado rotulo="Responsável">{cliente.nomeContato}</Dado>
          <Dado rotulo="Tipo de negócio">{ROTULO_TIPO_NEGOCIO[cliente.tipoNegocio]}</Dado>
          <Dado rotulo="Modalidade">{ROTULO_MODALIDADE[cliente.modalidade]}</Dado>
          <Dado rotulo="Situação">
            {ROTULO_SITUACAO_CLIENTE[cliente.situacao]}
          </Dado>
          <Dado rotulo="Início do atendimento">{dataCurta(cliente.iniciadoEm)}</Dado>
          <Dado rotulo="Cidade">{cliente.cidade}</Dado>
          <Dado rotulo="Porte declarado">
            {cliente.porte === "PEQUENO"
              ? "Pequeno"
              : cliente.porte === "MEDIO"
                ? "Médio"
                : "Grande"}
          </Dado>
          <Dado rotulo="Equipe declarada">{cliente.funcionariosDeclarados}</Dado>
        </ListaDados>
      </div>

      <Abas
        abas={abasComContagem}
        atual={atual}
        base={base}
      />

      <div>{conteudo}</div>

      <Aviso tom="info" titulo="O que esta tela ainda não mostra">
        <p>
          Não há, de propósito, custo por prato, CMV, margem nem qualquer
          indicador financeiro. Todos dependem de decisões de metodologia que
          ainda não foram tomadas — e um número inventado aqui teria a mesma
          aparência de um número certo. Onde o cálculo dependeria dessas
          decisões, a tela diz que ele está em preparação.
        </p>
      </Aviso>
    </div>
  );
}
