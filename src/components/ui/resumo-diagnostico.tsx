import Link from "next/link";
import { BlocoRespostas } from "./respostas";
import type { BlocoRespondido } from "@/lib/dados/derivacoes";
import type { BlocoChave } from "@/lib/dados/perguntas";
import type { LeituraBloco } from "@/lib/dados/tipos";

/**
 * O DIAGNÓSTICO INTEIRO, AGRUPADO PELOS BLOCOS QUE A ÉRIKA JÁ USA.
 *
 * O índice à esquerda existe porque o diagnóstico tem 29 respostas — rolar
 * até achar o bloco de insumos é o tipo de atrito que faz uma ferramenta
 * não ser usada. O índice é âncora pura, sem JavaScript: funciona com o
 * teclado, funciona no celular, e não depende de estado de cliente.
 *
 * OS SEIS BLOCOS DE DIAGNÓSTICO VÊM MARCADOS. A proposta da Fase 0 foi
 * dividir a leitura em seis blocos (lucratividade, estrutura, padronização,
 * precificação, insumos, equipe). Identificação e intenção ficam fora —
 * descrevem o negócio e a disposição, não a saúde da operação.
 *
 * A marcação no índice é literalmente isso: uma marcação de quais blocos
 * entram na proposta. Não é pontuação, não soma nada, e o ponto 11 — que
 * pergunta se ela concorda com essa divisão — continua aberto.
 */
export function ResumoDiagnostico({
  blocos,
  leitura = [],
}: {
  blocos: BlocoRespondido[];
  leitura?: LeituraBloco[];
}) {
  const leituraPorBloco = new Map<BlocoChave, LeituraBloco>(leitura.map((l) => [l.bloco, l]));
  const comRespostas = blocos.filter((b) => b.respostas.length > 0);

  if (comRespostas.length === 0) {
    return (
      <p className="text-[0.875rem] text-[var(--tinta-suave)]">
        Nenhuma resposta registrada neste diagnóstico.
      </p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,200px)_minmax(0,1fr)]">
      {/* Índice ---------------------------------------------------------- */}
      <nav aria-label="Blocos do diagnóstico" className="lg:sticky lg:top-[calc(var(--altura-topo)+1.5rem)] lg:self-start">
        <p className="mb-2.5 text-[0.625rem] font-semibold uppercase tracking-[0.2em] text-[var(--tinta-fraca)]">
          Blocos
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5 lg:flex-col lg:gap-x-0">
          {comRespostas.map((b) => {
            const lido = leituraPorBloco.has(b.chave);
            return (
              <li key={b.chave}>
                <Link
                  href={`#bloco-${b.chave}`}
                  className="group flex items-baseline gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
                >
                  <span className="text-[var(--tinta-fraca)]">{String(b.respostas.length).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block leading-snug group-hover:underline underline-offset-4">
                      {b.titulo}
                    </span>
                    {lido ? (
                      <span className="text-[0.6875rem] text-oliva">lido</span>
                    ) : b.diagnostico ? (
                      <span className="text-[0.6875rem] text-[var(--tinta-fraca)]">
                        bloco de diagnóstico
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Conteúdo -------------------------------------------------------- */}
      <div className="space-y-10">
        {comRespostas.map((b) => (
          <BlocoRespostas key={b.chave} bloco={b} leitura={leituraPorBloco.get(b.chave)} />
        ))}
      </div>
    </div>
  );
}
