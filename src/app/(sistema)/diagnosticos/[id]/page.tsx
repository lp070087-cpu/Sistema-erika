import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina, Rotulo } from "@/components/ui/rotulo";
import { Etiqueta, Indicador } from "@/components/ui/indicador";
import { Aviso, Painel, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { ListaSinais } from "@/components/ui/sinais";
import { ResumoDiagnostico } from "@/components/ui/resumo-diagnostico";
import {
  BLOCOS_DIAGNOSTICO,
  LACUNA,
  PERGUNTAS,
  ROTULO_STATUS,
  TOM_STATUS,
  dataEHora,
  desdeQuando,
  obterRepositorio,
  sinaisEmTexto,
} from "@/lib/dados";
import { declaracaoPrincipal, obrigatoriasEmFalta, respostasPorBloco } from "@/lib/dados/derivacoes";

export const metadata: Metadata = { title: "Diagnóstico" };

/**
 * DETALHE DO DIAGNÓSTICO
 *
 * A tela que substitui abrir o Google Forms. Ela existe para uma coisa:
 * deixar a consultora ler as respostas de uma pessoa inteira e chegar à
 * própria conclusão.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AUSÊNCIA DE VEREDITO É A CARACTERÍSTICA, NÃO UMA FALTA               │
 * │                                                                      │
 * │ Não há score. Não há "saúde da operação: 62%". Não há selo de bom ou │
 * │ ruim. Não há lista de "prioridades" ordenada pelo sistema.          │
 * │                                                                      │
 * │ Não é modéstia de programador. É que cada uma dessas coisas exige um │
 * │ peso por resposta — o ponto 11 — e um veredito gerado por suposição  │
 * │ apareceria na tela idêntico a um veredito correto. A Érika tomaria   │
 * │ decisão comercial com base nele.                                     │
 * │                                                                      │
 * │ O que a tela faz é o trabalho braçal: agrupar as 29 respostas nos    │
 * │ blocos dela, marcar o que ficou em branco, mostrar o que ela já      │
 * │ escreveu sobre cada bloco, e destacar as respostas abertas — que são │
 * │ onde a pessoa fala com as próprias palavras.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
type Props = { params: Promise<{ id: string }> };

export default async function PaginaDiagnostico({ params }: Props) {
  const { id } = await params;
  const repo = obterRepositorio();

  const diagnostico = await repo.obterDiagnostico(id);
  if (!diagnostico) notFound();

  const lead = await repo.obterLead(diagnostico.leadId);

  const blocos = respostasPorBloco(diagnostico);
  const sinais = sinaisEmTexto(diagnostico);
  const faltando = obrigatoriasEmFalta(diagnostico);
  const respondidas = PERGUNTAS.filter((p) => {
    const r = diagnostico.respostas.find((x) => x.perguntaId === p.id);
    if (!r) return false;
    if (r.valor.tipo === "texto") return r.valor.valor.trim().length > 0;
    if (r.valor.tipo === "selecao") return r.valor.valor.trim().length > 0;
    if (r.valor.tipo === "multipla") return r.valor.valores.length > 0;
    return false;
  }).length;

  const abertas = [
    {
      id: "maior-problema",
      titulo: "O maior problema hoje",
      texto: declaracaoPrincipal(diagnostico),
    },
    {
      id: "o-que-mudaria",
      titulo: "O que mudaria se fosse resolvido",
      texto:
        diagnostico.respostas.find((r) => r.perguntaId === "o-que-mudaria")?.valor.tipo === "texto"
          ? (
              diagnostico.respostas.find((r) => r.perguntaId === "o-que-mudaria")?.valor as {
                tipo: "texto";
                valor: string;
              }
            ).valor.trim()
          : "",
    },
    {
      id: "observacoes-livres",
      titulo: "O que ela quis dizer por conta própria",
      texto:
        diagnostico.respostas.find((r) => r.perguntaId === "observacoes-livres")?.valor.tipo ===
        "texto"
          ? (
              diagnostico.respostas.find((r) => r.perguntaId === "observacoes-livres")?.valor as {
                tipo: "texto";
                valor: string;
              }
            ).valor.trim()
          : "",
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/diagnosticos"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para os diagnósticos
      </Link>

      <CabecalhoPagina
        rotulo="Diagnóstico de Lucro e Operação da Cozinha"
        titulo={lead?.nomeFantasia ?? "Diagnóstico"}
        descricao={`Respondido ${desdeQuando(diagnostico.respondidoEm)} por ${lead?.nomeContato ?? "—"}. As ${PERGUNTAS.length} respostas abaixo estão agrupadas pelos blocos temáticos do formulário.`}
        acoes={
          diagnostico.leitura.length > 0 ? (
            <Etiqueta tom="verde">Leitura feita</Etiqueta>
          ) : (
            <Etiqueta tom="oliva">Aguardando leitura</Etiqueta>
          )
        }
      />

      {/* Números objetivos ------------------------------------------------ */}
      <Secao
        rotulo="Estado das respostas"
        titulo="O que veio preenchido"
        descricao="Contagens diretas. Nenhuma delas mede a qualidade da operação — medem o preenchimento do formulário."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Indicador
            emCard
            rotulo="Perguntas respondidas"
            valor={respondidas}
            contexto={`De ${PERGUNTAS.length} no formulário`}
          />
          <Indicador
            emCard
            rotulo="Obrigatórias em branco"
            valor={faltando}
            tom={faltando > 0 ? "atencao" : "neutro"}
            contexto={faltando === 0 ? "Nenhuma pendência" : "A leitura considera o que existe"}
          />
          <Indicador
            emCard
            rotulo="Pontos declarados"
            valor={sinais.length}
            contexto="Fatos objetivos que a pessoa informou"
          />
          <Indicador
            emCard
            rotulo="Blocos lidos"
            valor={`${diagnostico.leitura.length} de ${BLOCOS_DIAGNOSTICO.length}`}
            contexto="Blocos com direcionamento escrito"
          />
        </div>
      </Secao>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-6">
          {/* Respostas abertas ------------------------------------------ */}
          <Secao
            rotulo="Nas palavras dela"
            titulo="As respostas abertas"
            descricao="É onde a pessoa fala sem opção pronta para escolher. Na experiência da consultoria, é daqui que sai o direcionamento mais útil."
          >
            <div className="space-y-5">
              {abertas.map((a) => (
                <div key={a.id}>
                  <Rotulo>{a.titulo}</Rotulo>
                  {a.texto ? (
                    <p className="mt-2 border-l-2 border-l-oliva/50 pl-4 text-[0.9375rem] leading-relaxed whitespace-pre-line text-tinta">
                      {a.texto}
                    </p>
                  ) : (
                    <p className="mt-2 text-[0.9375rem] text-[var(--tinta-fraca)] italic">
                      Sem resposta
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Secao>

          {/* Todas as respostas por bloco ------------------------------- */}
          <Secao
            rotulo="Respostas completas"
            titulo="Bloco por bloco"
            descricao="Os 29 itens na ordem do formulário, agrupados pelos blocos que você já usa. Onde há leitura escrita, ela aparece antes das respostas."
          >
            <ResumoDiagnostico blocos={blocos} leitura={diagnostico.leitura} />
          </Secao>
        </div>

        {/* Coluna lateral ------------------------------------------------- */}
        <div className="space-y-4">
          {/* Pontos objetivos ------------------------------------------- */}
          <Secao rotulo="Pontos objetivos" titulo="O que foi declarado">
            {sinais.length > 0 ? (
              <ListaSinais sinais={sinais} />
            ) : (
              <p className="text-[0.875rem] text-[var(--tinta-suave)]">
                Nenhum ponto objetivo declarado neste diagnóstico.
              </p>
            )}
          </Secao>

          {/* Lead ------------------------------------------------------- */}
          {lead ? (
            <Secao rotulo="Lead">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[0.9375rem] font-medium text-tinta">{lead.nomeFantasia}</p>
                  <p className="mt-0.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
                    {lead.nomeContato}
                  </p>
                </div>
                <Etiqueta tom={TOM_STATUS[lead.status]}>{ROTULO_STATUS[lead.status]}</Etiqueta>
              </div>
              <p className="mt-3 text-[0.8125rem] text-[var(--tinta-fraca)]">
                Recebido em {dataEHora(lead.criadoEm)}
              </p>
              <BotaoLink
                href={`/leads/${lead.id}`}
                variante="secundario"
                tamanho="sm"
                className="mt-4"
              >
                Abrir o lead e as observações
              </BotaoLink>
            </Secao>
          ) : null}

          {/* Intenção --------------------------------------------------- */}
          <Painel>
            <Rotulo>Intenção declarada</Rotulo>
            <p className="mt-2 text-[0.9375rem] text-tinta">
              {diagnostico.pretendeMelhorar === "SIM"
                ? "Pretende melhorar a operação nos próximos 30 dias."
                : diagnostico.pretendeMelhorar === "TALVEZ"
                  ? "Talvez mexa na operação nos próximos 30 dias."
                  : "Não pretende mexer na operação nos próximos 30 dias."}
            </p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
              Resposta literal à pergunta 29 do formulário. Não é previsão de
              compra nem classificação de temperatura — é o que a pessoa
              declarou.
            </p>
          </Painel>

          {/* Lacuna declarada ------------------------------------------ */}
          <Aviso tom="atencao" titulo="Perguntas que ainda não foram transcritas">
            <p>
              O formulário tem{" "}
              <strong className="font-semibold text-tinta tabular">
                {LACUNA.declaradasNoRelatorio}
              </strong>{" "}
              perguntas; a transcrição cobre{" "}
              <strong className="font-semibold text-tinta tabular">
                {LACUNA.transcritas}
              </strong>
              . As finais não apareceram no material de origem e não foram
              inventadas.
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {LACUNA.reconstruidas.map((n) => (
                <li key={n} className="text-[0.8125rem] leading-relaxed">
                  Pergunta{" "}
                  <strong className="font-semibold text-tinta tabular">{n}</strong>: opções
                  reconstruídas a partir do padrão do próprio formulário — o
                  print está cortado.
                </li>
              ))}
            </ul>
          </Aviso>

          {/* Próximo passo do sistema ---------------------------------- */}
          <Aviso tom="info" titulo="O que falta para o diagnóstico automático">
            <p>
              Para o sistema dizer o que as respostas significam — em vez de
              só organizá-las — falta o peso de cada resposta. Esse peso é
              critério seu, e ainda não foi definido.
            </p>
          </Aviso>
        </div>
      </div>
    </div>
  );
}
