"use client";

// Módulo-folha, não o barril — este componente vai no pacote público.
// Ver a nota em formulario.tsx.
import { PERGUNTAS } from "@/lib/dados/perguntas";
import { ENVIO_DO_DIAGNOSTICO_ATIVO } from "@/lib/configuracao-publica";

/**
 * A EXPERIÊNCIA DE CONCLUSÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA TELA NÃO PODE DIZER "RECEBEMOS SUAS RESPOSTAS"                  │
 * │                                                                      │
 * │ Porque o sistema ainda não grava. Não existe banco configurado, e o  │
 * │ repositório de dados é de demonstração — nada que a pessoa acabou de │
 * │ responder saiu do navegador dela.                                    │
 * │                                                                      │
 * │ Seria fácil escrever a frase tranquilizadora. Seria também a única   │
 * │ coisa que este sistema faria que realmente prejudica alguém: a dona  │
 * │ de restaurante fecharia a aba achando que a consultora tinha os      │
 * │ dados dela, e o diagnóstico simplesmente não existiria.              │
 * │                                                                      │
 * │ Então a tela comemora o esforço — que é real, a pessoa respondeu o   │
 * │ formulário inteiro — e diz com todas as letras o que aconteceu e o   │
 * │ que não aconteceu. Ela sai sabendo o que fazer a seguir.             │
 * │                                                                      │
 * │ A contagem exibida é calculada de PERGUNTAS, não escrita à mão: se   │
 * │ a lacuna das quatro perguntas não transcritas for fechada, o número  │
 * │ acompanha sozinho.                                                   │
 * │                                                                      │
 * │ Quando o envio real entrar, é AQUI que a promessa muda, e só aqui.
 * │
 * │ E A FRASE NÃO DIZ "BACKEND" NEM "API". Quem lê esta tela é dono de
 * │ restaurante, não é desenvolvedor: o que ele precisa entender é que
 * │ esta é uma demonstração do fluxo, e que as respostas dele não foram
 * │ enviadas. Termo técnico aqui só confundiria — e "mock" seria pior
 * │ ainda, porque não significa nada para quem lê.
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * A ESTRUTURA JÁ ESTÁ PRONTA PARA O ENVIO. `respostas` chega completa,
 * indexada por id de pergunta — é exatamente o formato que o
 * `RepositorioEntradaEscrita.salvarDiagnostico()` vai receber. Falta a
 * chamada, não a montagem do dado.
 */
export function Conclusao({ respostas }: { respostas: Record<string, string> }) {
  const respondidas = PERGUNTAS.filter(
    (p) => (respostas[p.id] ?? "").trim().length > 0
  ).length;

  const nome = (respostas["nome-fantasia"] ?? "").trim();
  const contato = (respostas["whatsapp-retorno"] ?? "").trim();

  return (
    <div className="mx-auto max-w-[42rem]">
      {/* Cabeçalho ------------------------------------------------------ */}
      <div className="text-center">
        <span
          aria-hidden
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(107,122,70,0.12)]"
        >
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden>
            <path
              d="M6 13.5 11 18.5 20 8"
              fill="none"
              stroke="var(--color-oliva)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <h2 className="mt-6 text-balance text-[1.625rem] sm:text-[2rem]">
          {nome ? `Obrigada, ${nome}.` : "Obrigada por responder."}
        </h2>

        <p className="mx-auto mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
          Você respondeu {respondidas} {respondidas === 1 ? "pergunta" : "perguntas"} sobre a sua
          operação. É mais do que a maioria faz — e é a partir daqui que a
          leitura fica possível.
        </p>
      </div>

      {/* O estado real -------------------------------------------------- */}
      {ENVIO_DO_DIAGNOSTICO_ATIVO ? (
        <div className="mt-9 rounded-[var(--raio)] border-2 border-oliva/60 bg-[rgba(107,122,70,0.07)] px-5 py-5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-oliva">
            Recebido
          </p>
          <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
            <strong className="font-semibold text-tinta">
              Suas respostas chegaram para a Érika.
            </strong>{" "}
            Ela vai ler cada bloco e entrar em contato pelo WhatsApp que você
            deixou para combinar o retorno.
          </p>
        </div>
      ) : (
        <div className="mt-9 rounded-[var(--raio)] border-2 border-dashed border-dourado/70 bg-[rgba(201,165,78,0.08)] px-5 py-5">
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-[#8a6d1f]">
            Importante — leia antes de fechar
          </p>
          <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
            <strong className="font-semibold text-tinta">
              Esta é uma demonstração do fluxo de diagnóstico.
            </strong>{" "}
            As suas respostas não foram enviadas para a Érika e ficaram apenas
            nesta tela. É assim que o formulário se comporta enquanto o sistema
            está em construção.
          </p>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
            {contato ? (
              <>
                Para não perder o trabalho, envie uma mensagem para a Érika pelo
                WhatsApp{" "}
                <strong className="font-semibold text-tinta">{contato}</strong>{" "}
                dizendo que respondeu o diagnóstico — ela já vai saber do que se
                trata.
              </>
            ) : (
              <>
                Para não perder o trabalho, avise a Érika pelo WhatsApp que você
                respondeu o diagnóstico dela.
              </>
            )}
          </p>
          <p className="mt-3 text-[0.875rem] leading-relaxed text-[var(--tinta-fraca)]">
            Enquanto isso, mantenha esta aba aberta se quiser reler as suas
            respostas.
          </p>
        </div>
      )}

      {/* O que acontece depois ------------------------------------------ */}
      <div className="mt-9">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-oliva">
          O que acontece a seguir
        </p>
        <ol className="mt-4 space-y-5">
          {[
            {
              titulo: "A Érika lê o que você declarou",
              texto:
                "Ela vai olhar bloco por bloco: como está o resultado, a estrutura da cozinha, o padrão de produção, a precificação, os insumos e a equipe.",
            },
            {
              titulo: "Ela monta o direcionamento",
              texto:
                "Não é um relatório automático nem uma nota. É a leitura dela, com o que ela viu na sua cozinha e o que costuma resolver cada caso.",
            },
            {
              titulo: "Ela te chama",
              texto:
                "Pelo WhatsApp que você deixou, para te entregar o resultado e conversar sobre o que faz sentido para o seu negócio.",
            },
          ].map((passo, i) => (
            <li key={passo.titulo} className="flex gap-4">
              <span
                aria-hidden
                className="mt-0.5 shrink-0 font-display text-[0.9375rem] text-oliva tabular"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0">
                <p className="text-[0.9375rem] font-medium text-tinta">{passo.titulo}</p>
                <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                  {passo.texto}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Assinatura ----------------------------------------------------- */}
      <div className="mt-11 border-t border-[var(--linha)] pt-7 text-center">
        <span className="assina block text-[1.75rem] leading-none text-oliva">
          Érika Bruna
        </span>
        <p className="mt-2 text-[0.75rem] uppercase tracking-[0.18em] text-[var(--tinta-fraca)]">
          Consultoria em operação de cozinha
        </p>
        <p className="mx-auto mt-5 max-w-[44ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          Obrigada pela confiança de abrir a sua cozinha para mim. Isso não é
          pouco.
        </p>
      </div>
    </div>
  );
}
