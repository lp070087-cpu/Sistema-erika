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

export const metadata: Metadata = { title: "DiagnÃ³sticos" };

/**
 * DIAGNÃ“STICOS RECEBIDOS
 *
 * Substitui a leitura de respostas do Google Forms. A tela responde trÃªs
 * perguntas na ordem em que a consultora as faz: quem respondeu, o que
 * declarou, e eu jÃ¡ li isso?
 *
 * â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
 * â”‚ O QUE ESTA TELA DELIBERADAMENTE NÃƒO FAZ                             â”‚
 * â”‚                                                                      â”‚
 * â”‚ A SeÃ§Ã£o 16 do relatÃ³rio da Fase 0 descreveu a entrega da Fase 2 como â”‚
 * â”‚ "cÃ¡lculo de score por bloco" e a 12.3 como "fila de leads com score, â”‚
 * â”‚ os pontos de atenÃ§Ã£o jÃ¡ escritos em linguagem de operaÃ§Ã£o".         â”‚
 * â”‚                                                                      â”‚
 * â”‚ ESSE CÃLCULO NÃƒO PODE SER ESCRITO AINDA. Ele precisa do peso de cada â”‚
 * â”‚ resposta por gravidade operacional, e esse peso Ã© literalmente o     â”‚
 * â”‚ ponto 11 da SeÃ§Ã£o 17 â€” a pergunta que o relatÃ³rio endereÃ§a Ã  Ã‰rika.  â”‚
 * â”‚                                                                      â”‚
 * â”‚ Inventar um peso aqui teria um efeito especÃ­fico e ruim: a tela      â”‚
 * â”‚ mostraria "Score 42/100" com a mesma aparÃªncia de autoridade de um   â”‚
 * â”‚ nÃºmero correto. Ela tomaria decisÃ£o comercial com base nele, e o     â”‚
 * â”‚ nÃºmero teria saÃ­do da cabeÃ§a de quem escreveu o programa.            â”‚
 * â”‚                                                                      â”‚
 * â”‚ No lugar disso, a tela mostra o que Ã© verificÃ¡vel: os fatos que cada â”‚
 * â”‚ pessoa declarou, contados. "3 dos 5 diagnÃ³sticos declararam que nÃ£o   â”‚
 * â”‚ usam ficha tÃ©cnica" Ã© uma frase que ela pode conferir abrindo os 5.  â”‚
 * â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
 */
export default async function PaginaDiagnosticos() {
  const repo = obterRepositorio();
  const [diagnosticos, leads] = await Promise.all([
    repo.listarDiagnosticos(),
    repo.listarLeads(),
  ]);

  const leadPorId = new Map(leads.map((l) => [l.id, l]));

  // Contagem de sinais recorrentes â€” fato verificÃ¡vel, nÃ£o score.
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
        titulo="DiagnÃ³sticos"
        descricao="As respostas do DiagnÃ³stico de Lucro e OperaÃ§Ã£o da Cozinha, recebidas pelo formulÃ¡rio do sistema. Cada um traz as respostas reais agrupadas pelos blocos temÃ¡ticos que vocÃª jÃ¡ usa. O resultado Ã© leitura â€” o sistema nÃ£o classifica o negÃ³cio de ninguÃ©m."
        acoes={
          <BotaoLink href="/diagnostico" variante="secundario" tamanho="sm">
            Abrir o formulÃ¡rio
          </BotaoLink>
        }
      />

      <FaixaDemonstracao oQue="Estes diagnÃ³sticos sÃ£o de demonstraÃ§Ã£o. As respostas foram escritas para a tela poder ser avaliada â€” nÃ£o vieram de nenhum cliente." />

      {diagnosticos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum diagnÃ³stico recebido"
          descricao="Quando alguÃ©m responder o formulÃ¡rio pÃºblico, as respostas aparecem aqui agrupadas por bloco. O formulÃ¡rio jÃ¡ estÃ¡ no ar em /diagnostico."
          acao={
            <BotaoLink href="/diagnostico" variante="primario" tamanho="sm">
              Abrir o diagnÃ³stico
            </BotaoLink>
          }
        />
      ) : (
        <>
          {/* Lista ------------------------------------------------------- */}
          <Secao
            rotulo="Recebidos"
            titulo={`${diagnosticos.length} ${diagnosticos.length === 1 ? "diagnÃ³stico" : "diagnÃ³sticos"} na ordem em que chegaram`}
            descricao="Ordenados por data de resposta, do mais recente para o mais antigo. A coluna de leitura mostra se vocÃª jÃ¡ escreveu o direcionamento â€” nÃ£o Ã© avaliaÃ§Ã£o do negÃ³cio, Ã© o estado do seu trabalho."
          >
            <Tabela>
              <CabecalhoTabela>
                <LinhaCabecalho>
                  <CelulaCabecalho>NegÃ³cio</CelulaCabecalho>
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
                          {lead?.nomeFantasia ?? "DiagnÃ³stico"}
                        </Link>
                        <span className="mt-0.5 block text-[0.8125rem] font-normal text-[var(--tinta-fraca)]">
                          {lead?.nomeContato ?? "â€”"}
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
              rotulo="PadrÃµes na entrada"
              titulo="O que mais aparece declarado"
              descricao="Contagem simples de quantos diagnÃ³sticos declararam cada ponto. Ã‰ um fato que vocÃª confere abrindo os diagnÃ³sticos um por um â€” nÃ£o Ã© um Ã­ndice de gravidade."
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
              <Secao rotulo="Blocos do diagnÃ³stico" titulo="Como as respostas sÃ£o agrupadas">
                <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                  Os blocos abaixo sÃ£o os que vocÃª jÃ¡ usa no formulÃ¡rio. Os
                  seis marcados entram na proposta de leitura de diagnÃ³stico
                  do relatÃ³rio â€” se essa divisÃ£o estÃ¡ certa Ã© o ponto{" "}
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
                        diagnÃ³stico
                      </span>
                    </li>
                  ))}
                </ul>
              </Secao>

              <Aviso tom="atencao" titulo="O formulÃ¡rio tem perguntas que nÃ£o foram transcritas">
                <p>
                  O material de origem registra{" "}
                  <strong className="font-semibold text-tinta tabular">
                    {LACUNA.declaradasNoRelatorio}
                  </strong>{" "}
                  perguntas no formulÃ¡rio atual. A transcriÃ§Ã£o literal cobre{" "}
                  <strong className="font-semibold text-tinta tabular">
                    {LACUNA.transcritas}
                  </strong>{" "}
                  â€” as finais nÃ£o apareceram nas capturas.
                </p>
                <p className="mt-2.5">
                  Nada foi inventado para preencher a diferenÃ§a. A pergunta{" "}
                  <strong className="font-semibold text-tinta tabular">17</strong>{" "}
                  teve as opÃ§Ãµes reconstruÃ­das a partir do padrÃ£o do prÃ³prio
                  formulÃ¡rio, porque o print estÃ¡ cortado. Confirmar a lista
                  completa Ã© pendÃªncia sua.
                </p>
              </Aviso>
            </div>
          </div>
        </>
      )}

      {/* PreparaÃ§Ã£o ------------------------------------------------------ */}
      <Secao rotulo="Estado desta tela" titulo="O que funciona e o que depende de decisÃ£o">
        <div className="grid gap-6 md:grid-cols-2">
          <ul className="space-y-3">
            {[
              "Respostas reais do formulÃ¡rio, agrupadas pelos blocos que vocÃª jÃ¡ usa.",
              "Contagem de completude por diagnÃ³stico â€” quantas obrigatÃ³rias ficaram em branco.",
              "Blocos que a consultora jÃ¡ leu ficam marcados como lidos.",
              "PadrÃµes recorrentes contados a partir das respostas, conferÃ­veis uma a uma.",
            ].map((linha) => (
              <li key={linha} className="flex gap-3 text-[0.875rem] leading-relaxed">
                <span aria-hidden className="mt-2 h-px w-3.5 shrink-0 bg-oliva" />
                <span className="text-[var(--tinta-suave)]">{linha}</span>
              </li>
            ))}
          </ul>

          <div className="space-y-4">
            <Aviso tom="atencao" titulo="A pontuaÃ§Ã£o do diagnÃ³stico depende de uma decisÃ£o sua">
              <p>
                A pontuaÃ§Ã£o por bloco que a Fase 0 previu nÃ£o estÃ¡
                implementada, e isso Ã© uma decisÃ£o â€” nÃ£o uma pendÃªncia
                tÃ©cnica. Ela exige o peso de cada resposta, e o peso de cada
                resposta Ã© critÃ©rio profissional seu: sÃ³ quem faz o diagnÃ³stico
                sabe se &quot;nÃ£o controla ficha&quot; pesa mais que &quot;nÃ£o mede
                rendimento&quot;.
              </p>
              <p className="mt-2.5">
                Enquanto isso nÃ£o for definido, o diagnÃ³stico mostra as
                respostas e os blocos a que pertencem, sem nota. Um score
                calculado com pesos inventados teria a aparÃªncia de um score
                certo.
              </p>
            </Aviso>
            <Aviso tom="info" titulo="A importaÃ§Ã£o do Google Forms">
              <p>
                A Fase 0 previu importar as respostas que vocÃª jÃ¡ recebeu. Um
                importador teria que adivinhar como as colunas do Forms se
                ligam a cada pergunta â€” e erraria em silÃªncio, misturando
                resposta de um cliente com o campo de outro.
              </p>
              <p className="mt-2.5">
                Por isso ele nÃ£o foi escrito. Fica para quando houver uma
                planilha de exportaÃ§Ã£o real para conferir o mapeamento.
              </p>
            </Aviso>
          </div>
        </div>
      </Secao>

      {/* Nota de rodapÃ© --------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--linha)] pt-5">
        <Rotulo>DiagnÃ³stico de Lucro e OperaÃ§Ã£o da Cozinha</Rotulo>
        <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">
          {LACUNA.transcritas} perguntas transcritas
        </span>
      </div>
    </div>
  );
}

