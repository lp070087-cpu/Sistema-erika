import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { PERGUNTA_POR_ID } from "@/lib/dados/perguntas";
import { respostaVazia } from "@/lib/dados/formato";
import type { BlocoRespondido } from "@/lib/dados/derivacoes";

/**
 * AS RESPOSTAS DE UM DIAGNÓSTICO, AGRUPADAS POR BLOCO.
 *
 * Este é o coração da leitura na Fase 2. Ele não interpreta: mostra o
 * enunciado original e a resposta original, na ordem do formulário, com o
 * bloco temático da própria Érika como agrupador.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO HÁ PERCENTUAL, COR DE ALERTA NEM ÍCONE DE GRAVIDADE     │
 * │                                                                    │
 * │ O que definiu o peso de cada resposta é o ponto 11 da Seção 17 —    │
 * │ uma pergunta que ainda não foi respondida. Todo o resto do sistema  │
 * │ depende dela para poder opinar.                                     │
 * │                                                                    │
 * │ A resposta "Não uso" na pergunta 10 vira, na tela, exatamente o     │
 * │ que a pessoa escreveu: "Não uso". Não vira "🔴 Crítico" e nem "0    │
 * │ de 10 pontos". A consultora lê e decide — que é o trabalho dela.    │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * RESPOSTA VAZIA NÃO VIRA ZERO. Quando não há resposta, o campo diz
 * "Sem resposta" em itálico claro — porque "não respondeu" e "respondeu
 * que não" são informações diferentes, e tratá-las igual seria inventar
 * dado no lugar de declarar ausência.
 */

/** Uma linha de resposta: enunciado original + resposta original. */
export function LinhaResposta({
  perguntaId,
  valorTexto,
  auxiliar,
}: {
  perguntaId: string;
  valorTexto: string;
  auxiliar?: ReactNode;
}) {
  const pergunta = PERGUNTA_POR_ID[perguntaId];
  const semResposta = valorTexto === "—" || valorTexto.trim().length === 0;

  return (
    <div className="border-b border-[var(--linha)] py-3.5 last:border-b-0 last:pb-0">
      <div className="flex items-baseline gap-2.5">
        {pergunta ? (
          <span className="shrink-0 text-[0.6875rem] font-semibold text-[var(--tinta-fraca)] tabular">
            {String(pergunta.numero).padStart(2, "0")}
          </span>
        ) : null}
        <p className="min-w-0 text-[0.875rem] leading-snug text-[var(--tinta-suave)]">
          {pergunta?.enunciado ?? perguntaId}
        </p>
      </div>

      <div className="mt-1.5 pl-[1.6rem]">
        {semResposta ? (
          <p className="text-[0.9375rem] text-[var(--tinta-fraca)] italic">
            Sem resposta
          </p>
        ) : (
          <p className="text-[0.9375rem] leading-relaxed whitespace-pre-line text-tinta">
            {valorTexto}
          </p>
        )}
        {auxiliar ? <div className="mt-1.5">{auxiliar}</div> : null}
      </div>
    </div>
  );
}

/**
 * Um bloco inteiro do diagnóstico.
 *
 * `leitura` é a percepção escrita da consultora — não uma nota. Quando
 * existe, aparece antes das respostas, em fundo levemente destacado, para
 * que quem lê saiba o que ela já concluiu antes de ler tudo.
 */
export function BlocoRespostas({
  bloco,
  leitura,
  className,
}: {
  bloco: BlocoRespondido;
  leitura?: { resumo: string; atencao: string[] };
  className?: string;
}) {
  if (bloco.respostas.length === 0) return null;

  return (
    <section className={cn("scroll-mt-24", className)} id={`bloco-${bloco.chave}`}>
      <header className="mb-3">
        <h3 className="text-[1.0625rem]">{bloco.titulo}</h3>
        <p className="mt-1 max-w-[64ch] text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
          {bloco.mede}
        </p>
      </header>

      {leitura ? (
        <div className="mb-4 rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[rgba(107,122,70,0.05)] px-3.5 py-3">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-oliva">
            Leitura da consultora
          </p>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-tinta">{leitura.resumo}</p>
          {leitura.atencao.length > 0 ? (
            <ul className="mt-2.5 space-y-1.5">
              {leitura.atencao.map((a) => (
                <li key={a} className="flex gap-2.5 text-[0.8125rem] leading-relaxed">
                  <span aria-hidden className="mt-2 h-px w-3 shrink-0 bg-dourado" />
                  <span className="text-[var(--tinta-suave)]">{a}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-1">
        {bloco.respostas.map((resposta) => {
          const pergunta = PERGUNTA_POR_ID[resposta.perguntaId];
          // O valor é extraído uma vez, para que o estreitamento de tipo
          // funcione em cada ramo. Encadear `resposta.valor.valor` dentro
          // de ternários aninhados perde a informação do discriminante.
          const valor = resposta.valor;

          let texto: string;
          switch (valor.tipo) {
            case "texto":
              texto = valor.valor.trim();
              break;
            case "selecao":
              texto =
                pergunta?.opcoes?.find((o) => o.valor === valor.valor)?.texto ?? valor.valor;
              break;
            case "multipla":
              texto = valor.valores.join(", ");
              break;
            case "vazio":
              texto = "—";
              break;
          }

          return (
            <LinhaResposta
              key={resposta.perguntaId}
              perguntaId={resposta.perguntaId}
              valorTexto={texto}
              auxiliar={
                pergunta && respostaVazia(resposta.valor) && pergunta.obrigatoria ? (
                  <span className="text-[0.75rem] text-dourado">
                    Campo obrigatório no formulário original
                  </span>
                ) : undefined
              }
            />
          );
        })}
      </div>
    </section>
  );
}
