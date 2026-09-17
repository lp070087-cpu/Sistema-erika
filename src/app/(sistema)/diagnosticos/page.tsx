import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina, Rotulo } from "@/components/ui/rotulo";
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
import {
  BLOCOS_DIAGNOSTICO,
  LACUNA,
  ROTULO_STATUS,
  TOM_STATUS,
  dataCurta,
  desdeQuando,
  obterRepositorio,
  sinaisEmTexto,
} from "@/lib/dados";
import { declaracaoPrincipal, obrigatoriasEmFalta } from "@/lib/dados/derivacoes";

export const metadata: Metadata = { title: "Diagnósticos" };

/**
 * DIAGNÓSTICOS RECEBIDOS
 *
 * Substitui a leitura de respostas do Google Forms. A tela responde três
 * perguntas na ordem em que a consultora as faz: quem respondeu, o que
 * declarou, e eu já li isso?
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA DELIBERADAMENTE NÃO FAZ                             │
 * │                                                                      │
 * │ A Seção 16 do relatório da Fase 0 descreveu a entrega da Fase 2 como │
 * │ "cálculo de score por bloco" e a 12.3 como "fila de leads com score, │
 * │ os pontos de atenção já escritos em linguagem de operação".         │
 * │                                                                      │
 * │ ESSE CÁLCULO NÃO PODE SER ESCRITO AINDA. Ele precisa do peso de cada │
 * │ resposta por gravidade operacional, e esse peso é literalmente o     │
 * │ ponto 11 da Seção 17 — a pergunta que o relatório endereça à Érika.  │
 * │                                                                      │
 * │ Inventar um peso aqui teria um efeito específico e ruim: a tela      │
 * │ mostraria "Score 42/100" com a mesma aparência de autoridade de um   │
 * │ número correto. Ela tomaria decisão comercial com base nele, e o     │
 * │ número teria saído da cabeça de quem escreveu o programa.            │
 * │                                                                      │
 * │ No lugar disso, a tela mostra o que é verificável: os fatos que cada │
 * │ pessoa declarou, contados. "3 dos 5 diagnósticos declararam que não   │
 * │ usam ficha técnica" é uma frase que ela pode conferir abrindo os 5.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export default async function PaginaDiagnosticos() {
  const repo = obterRepositorio();
  const [diagnosticos, leads] = await Promise.all([
    repo.listarDiagnosticos(),
    repo.listarLeads(),
  ]);

  const leadPorId = new Map(leads.map((l) => [l.id, l]));

  // Contagem de sinais recorrentes — fato verificável, não score.
  const contagemSinais = new Map<string, number>();
  for (const d of diagnosticos) {
    for (const sinal of sinaisEmTexto(d)) {
      contagemSinais.set(sinal, (contagemSinais.get(sinal) ?? 0) + 1);
    }
  }
  const sinaisRecorrentes = [...contagemSinais.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Entrada"
        titulo="Diagnósticos"
        descricao="As respostas do Diagnóstico de Lucro e Operação da Cozinha, recebidas pelo formulário do sistema. Cada um traz as respostas reais agrupadas pelos blocos temáticos que você já usa. O resultado é leitura — o sistema não classifica o negócio de ninguém."
        acoes={
          <BotaoLink href="/diagnostico" variante="secundario" tamanho="sm">
            Abrir o formulário
          </BotaoLink>
        }
      />

      <FaixaDemonstracao oQue="Estes diagnósticos são de demonstração. As respostas foram escritas para a tela poder ser avaliada — não vieram de nenhum cliente." />

      {diagnosticos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum diagnóstico recebido"
          descricao="Quando alguém responder o formulário público, as respostas aparecem aqui agrupadas por bloco. O formulário já está no ar em /diagnostico."
          acao={
            <BotaoLink href="/diagnostico" variante="primario" tamanho="sm">
              Abrir o diagnóstico
            </BotaoLink>
          }
        />
      ) : (
        <>
          {/* Lista ------------------------------------------------------- */}
          <Secao
            rotulo="Recebidos"
            titulo={`${diagnosticos.length} ${diagnosticos.length === 1 ? "diagnóstico" : "diagnósticos"} na ordem em que chegaram`}
            descricao="Ordenados por data de resposta, do mais recente para o mais antigo. A coluna de leitura mostra se você já escreveu o direcionamento — não é avaliação do negócio, é o estado do seu trabalho."
          >
            <Tabela>
              <CabecalhoTabela>
                <LinhaCabecalho>
                  <CelulaCabecalho>Negócio</CelulaCabecalho>
                  <CelulaCabecalho className="hidden lg:table-cell">
                    O maior problema declarado
                  </CelulaCabecalho>
                  <CelulaCabecalho className="hidden sm:table-cell">Respondido</CelulaCabecalho>
                  <CelulaCabecalho className="hidden md:table-cell">Completude</CelulaCabecalho>
                  <CelulaCabecalho>Leitura</CelulaCabecalho>
                </LinhaCabecalho>
              </CabecalhoTabela>
              <CorpoTabela>
                {diagnosticos.map((d) => {
                  const lead = leadPorId.get(d.leadId);
                  const faltando = obrigatoriasEmFalta(d);
                  const lido = d.leitura.length > 0;

                  return (
                    <LinhaTabela key={d.id}>
                      <Celula destaque className="max-w-[16rem]">
                        <Link
                          href={`/diagnosticos/${d.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {lead?.nomeFantasia ?? "Diagnóstico"}
                        </Link>
                        <span className="mt-0.5 block text-[0.8125rem] font-normal text-[var(--tinta-fraca)]">
                          {lead?.nomeContato ?? "—"}
                        </span>
                        {lead ? (
                          <span className="mt-1 block">
                            <Etiqueta tom={TOM_STATUS[lead.status]}>
                              {ROTULO_STATUS[lead.status]}
                            </Etiqueta>
                          </span>
                        ) : null}
                      </Celula>

                      <Celula className="hidden max-w-[24rem] lg:table-cell">
                        <span className="text-[0.8125rem] leading-snug">
                          {declaracaoPrincipal(d)}
                        </span>
                      </Celula>

                      <Celula className="hidden whitespace-nowrap sm:table-cell">
                        {desdeQuando(d.respondidoEm)}
                        <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                          {dataCurta(d.respondidoEm)}
                        </span>
                      </Celula>

                      <Celula className="hidden md:table-cell">
                        {faltando === 0 ? (
                          <span className="text-[0.8125rem] text-medio">Completo</span>
                        ) : (
                          <span className="text-[0.8125rem] text-[#8a6d1f] tabular">
                            {faltando} sem resposta
                          </span>
                        )}
                      </Celula>

                      <Celula>
                        {lido ? (
                          <Etiqueta tom="verde">Lido</Etiqueta>
                        ) : (
                          <Etiqueta tom="oliva">A ler</Etiqueta>
                        )}
                      </Celula>
                    </LinhaTabela>
                  );
                })}
              </CorpoTabela>
            </Tabela>
          </Secao>

          {/* Sinais recorrentes ----------------------------------------- */}
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]">
            <Secao
              rotulo="Padrões na entrada"
              titulo="O que mais aparece declarado"
              descricao="Contagem simples de quantos diagnósticos declararam cada ponto. É um fato que você confere abrindo os diagnósticos um por um — não é um índice de gravidade."
            >
              <ul className="space-y-3.5">
                {sinaisRecorrentes.map(([sinal, total]) => (
                  <li key={sinal} className="flex items-center gap-4">
                    <span className="w-6 shrink-0 text-right font-display text-[1.0625rem] text-oliva tabular">
                      {total}
                    </span>
                    <span className="min-w-0 flex-1 text-[0.875rem] leading-snug text-[var(--tinta-suave)]">
                      {sinal}
                    </span>
                    <span
                      aria-hidden
                      className="hidden h-1 shrink-0 rounded-full bg-oliva/30 sm:block"
                      style={{ width: `${(total / diagnosticos.length) * 100}px` }}
                    />
                  </li>
                ))}
              </ul>
            </Secao>

            {/* Blocos e a lacuna declarada -------------------------------- */}
            <div className="space-y-4">
              <Secao rotulo="Blocos do diagnóstico" titulo="Como as respostas são agrupadas">
                <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                  Os blocos abaixo são os que você já usa no formulário. Os
                  seis marcados entram na proposta de leitura de diagnóstico
                  do relatório — se essa divisão está certa é o ponto{" "}
                  <strong className="font-semibold text-tinta tabular">11</strong>,
                  que ainda depende da sua resposta.
                </p>
                <ul className="mt-4 space-y-2">
                  {BLOCOS_DIAGNOSTICO.map((b) => (
                    <li
                      key={b.chave}
                      className="flex items-start justify-between gap-3 border-b border-[var(--linha)] pb-2 last:border-b-0 last:pb-0"
                    >
                      <span className="text-[0.875rem] text-[var(--tinta-suave)]">
                        {b.titulo}
                      </span>
                      <span className="shrink-0 text-[0.6875rem] uppercase tracking-[0.12em] text-oliva">
                        diagnóstico
                      </span>
                    </li>
                  ))}
                </ul>
              </Secao>

              <Aviso tom="atencao" titulo="O formulário tem perguntas que não foram transcritas">
                <p>
                  O material de origem registra{" "}
                  <strong className="font-semibold text-tinta tabular">
                    {LACUNA.declaradasNoRelatorio}
                  </strong>{" "}
                  perguntas no formulário atual. A transcrição literal cobre{" "}
                  <strong className="font-semibold text-tinta tabular">
                    {LACUNA.transcritas}
                  </strong>{" "}
                  — as finais não apareceram nas capturas.
                </p>
                <p className="mt-2.5">
                  Nada foi inventado para preencher a diferença. A pergunta{" "}
                  <strong className="font-semibold text-tinta tabular">17</strong>{" "}
                  teve as opções reconstruídas a partir do padrão do próprio
                  formulário, porque o print está cortado. Confirmar a lista
                  completa é pendência sua.
                </p>
              </Aviso>
            </div>
          </div>
        </>
      )}

      {/* Preparação ------------------------------------------------------ */}
      <Secao rotulo="Estado desta tela" titulo="O que funciona e o que depende de decisão">
        <div className="grid gap-6 md:grid-cols-2">
          <ul className="space-y-3">
            {[
              "Respostas reais do formulário, agrupadas pelos blocos que você já usa.",
              "Contagem de completude por diagnóstico — quantas obrigatórias ficaram em branco.",
              "Blocos que a consultora já leu ficam marcados como lidos.",
              "Padrões recorrentes contados a partir das respostas, conferíveis uma a uma.",
            ].map((linha) => (
              <li key={linha} className="flex gap-3 text-[0.875rem] leading-relaxed">
                <span aria-hidden className="mt-2 h-px w-3.5 shrink-0 bg-oliva" />
                <span className="text-[var(--tinta-suave)]">{linha}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-4">
            <Aviso tom="atencao" titulo="O score depende do ponto 11">
              <p>
                A pontuação por bloco que a Fase 0 previu não está
                implementada, e isso é uma decisão — não uma pendência
                técnica. Ela exige o peso de cada resposta, que é sua decisão.
              </p>
            </Aviso>
            <Aviso tom="info" titulo="A importação do Google Forms">
              <p>
                A Fase 0 previu importar as respostas que você já recebeu. Um
                importador teria que adivinhar como as colunas do Forms se
                ligam a cada pergunta — e erraria em silêncio, misturando
                resposta de um cliente com o campo de outro.
              </p>
              <p className="mt-2.5">
                Por isso ele não foi escrito. Fica para quando houver uma
                planilha de exportação real para conferir o mapeamento.
              </p>
            </Aviso>
          </div>
        </div>
      </Secao>

      {/* Nota de rodapé --------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--linha)] pt-5">
        <Rotulo>Diagnóstico de Lucro e Operação da Cozinha</Rotulo>
        <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">
          {LACUNA.transcritas} perguntas transcritas
        </span>
      </div>
    </div>
  );
}
