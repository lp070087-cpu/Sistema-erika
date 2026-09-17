import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import {
  Tabela,
  CabecalhoTabela,
  LinhaCabecalho,
  CelulaCabecalho,
  CorpoTabela,
  LinhaTabela,
  Celula,
} from "@/components/ui/tabela";
import { BotaoLink } from "@/components/ui/botao";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { ListaSinais } from "@/components/ui/sinais";
import {
  DETALHE_ORIGEM,
  ORDEM_STATUS,
  ROTULO_ORIGEM,
  ROTULO_STATUS,
  TOM_STATUS,
  dataCurta,
  desdeQuando,
  obterRepositorio,
  sinaisEmTexto,
} from "@/lib/dados";
import { declaracaoPrincipal } from "@/lib/dados/derivacoes";
import type { LeadStatus, OrigemLead } from "@/lib/dados";

export const metadata: Metadata = { title: "Leads" };

/**
 * FILA DE LEADS
 *
 * A pergunta que esta tela responde: "quem entrou e o que essa pessoa
 * declarou?" — para que a consultora decida com quem falar primeiro.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ DUAS COISAS QUE ESTA TELA NÃO FAZ, DE PROPÓSITO                      │
 * │                                                                      │
 * │ 1. NÃO ORDENA POR OPORTUNIDADE.                                      │
 * │    A Seção 12.3 do relatório da Fase 0 pediu "fila de leads com      │
 * │    score por bloco" e a 5.1 falou em "ordenação automática de leads  │
 * │    por oportunidade". Nenhuma das duas pode existir agora: as duas   │
 * │    dependem do peso de cada resposta (ponto 11), que não foi         │
 * │    definido. A fila está por data — critério que não é opinião.      │
 * │                                                                      │
 * │ 2. NÃO PINTA O LEAD DE VERMELHO.                                     │
 * │    Um lead com dez sinais não é pior que um com dois: ele declarou   │
 * │    mais coisas. Sinais contam fatos, não gravidade.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O FILTRO VIVE NA URL. A Seção 12.4 pediu que os filtros fossem
 * persistidos na URL para poderem ser favoritados. Um link como
 * /leads?status=NOVO reabre exatamente esta visão — e é isso que o
 * parâmetro faz aqui.
 */

type Props = {
  searchParams: Promise<{ status?: string }>;
};

/**
 * COMO A ORIGEM APARECE NA FILA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE "DIAGNÓSTICO PELO SITE" TEM DESTAQUE E OS OUTROS NÃO          │
 * │                                                                      │
 * │ Não é hierarquia de canal. É uma diferença de ESFORÇO: o lead que     │
 * │ respondeu o diagnóstico chegou sozinho, já contou o que está          │
 * │ acontecendo na cozinha dele e está esperando uma resposta — ele não   │
 * │ foi lembrado por ninguém. Os outros quatro chegaram porque ela foi    │
 * │ atrás, e ela já sabe disso, porque foi ela que cadastrou.             │
 * │                                                                      │
 * │ Por isso só esse caso ganha etiqueta. Marcar todos igualmente         │
 * │ transformaria uma informação útil (chegou sozinho) em ruído.          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * A frase de cada origem vem de DETALHE_ORIGEM, não daqui: a mesma
 * explicação aparece no detalhe do lead e a distinção entre "o sistema
 * registrou" e "ela cadastrou à mão" não pode divergir entre duas telas.
 */
function OrigemDoLead({ origem }: { origem: OrigemLead }) {
  const detalhe = DETALHE_ORIGEM[origem];

  if (detalhe.automatica) {
    return <Etiqueta tom="oliva">{ROTULO_ORIGEM[origem]}</Etiqueta>;
  }

  return (
    <span className="text-[0.8125rem] text-[var(--tinta-suave)]">
      {ROTULO_ORIGEM[origem]}
    </span>
  );
}

export default async function PaginaLeads({ searchParams }: Props) {
  const { status } = await searchParams;
  const repo = obterRepositorio();

  const [todosLeads, diagnosticos] = await Promise.all([
    repo.listarLeads(),
    repo.listarDiagnosticos(),
  ]);

  const diagnosticoPorLead = new Map(diagnosticos.map((d) => [d.leadId, d]));

  // O filtro é validado contra a lista real de status — um valor inventado
  // na URL não filtra por nada, em vez de devolver lista vazia sem motivo.
  const filtroAtivo =
    status && ORDEM_STATUS.includes(status as LeadStatus) ? (status as LeadStatus) : null;

  const leads = filtroAtivo ? todosLeads.filter((l) => l.status === filtroAtivo) : todosLeads;

  const contagemPorStatus = ORDEM_STATUS.map((s) => ({
    status: s,
    total: todosLeads.filter((l) => l.status === s).length,
  })).filter((c) => c.total > 0);

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Entrada"
        titulo="Leads"
        descricao="Quem respondeu ao diagnóstico e o que declarou. A ordem é por data de chegada. Os sinais abaixo de cada lead são fatos que a própria pessoa informou, traduzidos para linguagem de operação — não são nota nem classificação."
        acoes={
          <BotaoLink href="/diagnostico" variante="secundario" tamanho="sm">
            Ver o formulário
          </BotaoLink>
        }
      />

      <FaixaDemonstracao oQue="Estes leads e suas respostas são inventados para demonstração. Nenhum é cliente real e nenhum telefone ou e-mail aqui existe." />

      {/* Filtro por status ------------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/leads"
          className={
            "rounded-[2px] border px-2.5 py-1 text-[0.75rem] font-medium uppercase tracking-[0.1em] transition-colors " +
            (filtroAtivo
              ? "border-[var(--linha-forte)] text-[var(--tinta-suave)] hover:border-tinta hover:text-tinta"
              : "border-tinta bg-tinta text-off")
          }
        >
          Todos · {todosLeads.length}
        </Link>
        {contagemPorStatus.map(({ status: s, total }) => {
          const ativo = filtroAtivo === s;
          return (
            <Link
              key={s}
              href={ativo ? "/leads" : `/leads?status=${s}`}
              aria-current={ativo ? "true" : undefined}
              className={
                "rounded-[2px] border px-2.5 py-1 text-[0.75rem] font-medium uppercase tracking-[0.1em] transition-colors " +
                (ativo
                  ? "border-tinta bg-tinta text-off"
                  : "border-[var(--linha-forte)] text-[var(--tinta-suave)] hover:border-tinta hover:text-tinta")
              }
            >
              {ROTULO_STATUS[s]} · {total}
            </Link>
          );
        })}
      </div>

      {/* A fila ------------------------------------------------------------ */}
      {leads.length === 0 ? (
        <EstadoVazio
          titulo={filtroAtivo ? `Nenhum lead em "${ROTULO_STATUS[filtroAtivo]}"` : "A fila está vazia"}
          descricao={
            filtroAtivo
              ? "Nenhum lead nesta etapa agora. Limpe o filtro para ver a fila inteira."
              : "Quando alguém responder o diagnóstico público, o lead aparece aqui com o que declarou. Enquanto isso não acontece, esta tela fica assim — vazia e dizendo por quê."
          }
          acao={
            filtroAtivo ? (
              <BotaoLink href="/leads" variante="secundario" tamanho="sm">
                Ver todos os leads
              </BotaoLink>
            ) : (
              <BotaoLink href="/diagnostico" variante="primario" tamanho="sm">
                Abrir o diagnóstico
              </BotaoLink>
            )
          }
        />
      ) : (
        <>
          {/* Tabela no desktop — a leitura densa de quem trabalha nisso todo dia. */}
          <div className="hidden lg:block">
            <Tabela>
              <CabecalhoTabela>
                <LinhaCabecalho>
                  <CelulaCabecalho>Negócio e contato</CelulaCabecalho>
                  <CelulaCabecalho>O que declarou</CelulaCabecalho>
                  <CelulaCabecalho className="hidden xl:table-cell">Próximo passo</CelulaCabecalho>
                  <CelulaCabecalho>Entrada</CelulaCabecalho>
                  <CelulaCabecalho>Status</CelulaCabecalho>
                </LinhaCabecalho>
              </CabecalhoTabela>
              <CorpoTabela>
                {leads.map((lead) => {
                  const diagnostico = diagnosticoPorLead.get(lead.id);
                  const sinais = diagnostico ? sinaisEmTexto(diagnostico) : [];
                  return (
                    <LinhaTabela key={lead.id}>
                      <Celula destaque className="max-w-[15rem]">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {lead.nomeFantasia}
                        </Link>
                        <span className="mt-0.5 block text-[0.8125rem] font-normal text-[var(--tinta-fraca)]">
                          {lead.nomeContato}
                        </span>
                        <span className="mt-1.5 block">
                          <OrigemDoLead origem={lead.origem} />
                        </span>
                      </Celula>

                      <Celula className="max-w-[26rem]">
                        {diagnostico ? (
                          <div className="space-y-2">
                            <p className="text-[0.8125rem] leading-snug text-[var(--tinta-suave)]">
                              {declaracaoPrincipal(diagnostico)}
                            </p>
                            <ListaSinais sinais={sinais} maximo={2} />
                          </div>
                        ) : (
                          <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">
                            Sem diagnóstico vinculado
                          </span>
                        )}
                      </Celula>

                      <Celula className="hidden max-w-[16rem] xl:table-cell">
                        {lead.proximoPasso ? (
                          <span className="text-[0.8125rem] leading-snug">
                            {lead.proximoPasso}
                          </span>
                        ) : (
                          <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">
                            Não definido
                          </span>
                        )}
                      </Celula>

                      <Celula className="whitespace-nowrap">
                        <span className="tabular">{dataCurta(lead.criadoEm)}</span>
                        <span className="mt-0.5 block text-[0.75rem] font-normal text-[var(--tinta-fraca)]">
                          {desdeQuando(lead.criadoEm)}
                        </span>
                      </Celula>

                      <Celula>
                        <Etiqueta tom={TOM_STATUS[lead.status]}>
                          {ROTULO_STATUS[lead.status]}
                        </Etiqueta>
                      </Celula>
                    </LinhaTabela>
                  );
                })}
              </CorpoTabela>
            </Tabela>
          </div>

          {/* Cartões no celular — a leitura de quem está na visita, em pé. */}
          <ul className="space-y-3 lg:hidden">
            {leads.map((lead) => {
              const diagnostico = diagnosticoPorLead.get(lead.id);
              const sinais = diagnostico ? sinaisEmTexto(diagnostico) : [];
              return (
                <li key={lead.id}>
                  <Link
                    href={`/leads/${lead.id}`}
                    className="block rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5 transition-colors hover:border-[var(--linha-forte)] hover:bg-white"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
                      <div className="min-w-0">
                        <p className="text-[0.9375rem] font-medium text-tinta">
                          {lead.nomeFantasia}
                        </p>
                        <p className="mt-0.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
                          {lead.nomeContato} · {desdeQuando(lead.criadoEm)}
                        </p>
                      </div>
                      <Etiqueta tom={TOM_STATUS[lead.status]}>
                        {ROTULO_STATUS[lead.status]}
                      </Etiqueta>
                    </div>

                    <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                      <OrigemDoLead origem={lead.origem} />
                      <span className="text-[0.75rem] text-[var(--tinta-fraca)]">
                        Entrada em <span className="tabular">{dataCurta(lead.criadoEm)}</span>
                      </span>
                    </p>

                    {diagnostico ? (
                      <p className="mt-3 border-l-2 border-l-oliva/50 pl-3 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                        {declaracaoPrincipal(diagnostico)}
                      </p>
                    ) : null}

                    {sinais.length > 0 ? <ListaSinais sinais={sinais} maximo={4} className="mt-3" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* Preparação para o backend ----------------------------------------- */}
      <Secao
        rotulo="Estado desta tela"
        titulo="O que já funciona e o que depende do banco"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ul className="space-y-3">
            {[
              "Fila com todos os leads e o filtro por status persistido na URL.",
              "Sinais objetivos derivados das respostas em tempo real — o que aparece aqui é calculado, não digitado.",
              "Leitura adaptada: tabela densa no desktop, cartões no celular.",
              "Estado vazio explícito, com o motivo e o caminho de saída.",
            ].map((linha) => (
              <li key={linha} className="flex gap-3 text-[0.875rem] leading-relaxed">
                <span aria-hidden className="mt-2 h-px w-3.5 shrink-0 bg-oliva" />
                <span className="text-[var(--tinta-suave)]">{linha}</span>
              </li>
            ))}
          </ul>

          <Aviso tom="atencao" titulo="Depende do banco e de decisão">
            <p>
              Os leads exibidos são de demonstração. Gravar um lead de verdade
              depende do banco configurado e do ponto{" "}
              <strong className="font-semibold text-tinta tabular">15</strong> —
              se quem responde o diagnóstico entra direto na fila ou passa por
              uma triagem antes.
            </p>
            <p className="mt-2.5">
              A conversão de lead em cliente existe no contrato de dados mas
              não é oferecida em nenhuma tela: o cadastro de cliente depende
              dos pontos 1, 2, 3 e 10.
            </p>
          </Aviso>
        </div>
      </Secao>
    </div>
  );
}
