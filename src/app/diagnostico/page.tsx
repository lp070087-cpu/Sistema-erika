import type { Metadata } from "next";
import { IniciarDiagnostico } from "./inicio";

/**
 * DIAGNÓSTICO PÚBLICO — /diagnostico
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA É A ÚNICA ROTA DO SISTEMA QUE UM CLIENTE VÊ                     │
 * │                                                                      │
 * │ Ela fica FORA do grupo (sistema): não tem barra lateral, não pede    │
 * │ sessão, e o middleware a libera pela regra de esfera em             │
 * │ src/lib/esfera.ts. A moldura dela está no shell público, montado     │
 * │ pelo layout raiz — porque o Next só permite um layout por segmento,  │
 * │ e ter duas raízes obrigaria a manter dois layouts em par.            │
 * │                                                                      │
 * │ O QUE SUBSTITUI:                                                    │
 * │ o Google Forms "Diagnóstico de Lucro e Operação da Cozinha", cujo    │
 * │ link vive na bio do Instagram dela. As 29 perguntas transcritas são  │
 * │ exatamente as do formulário atual — este arquivo não inventa         │
 * │ pergunta, não reescreve enunciado e não cria score.                  │
 * │                                                                      │
 * │ O QUE ELE NÃO FAZ, e está dito na tela:                             │
 * │ não envia nada para lugar nenhum. Não há banco configurado. A tela  │
 * │ de conclusão diz isso com todas as letras em vez de prometer um     │
 * │ envio que não acontece.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * SOBRE INDEXAÇÃO
 *
 * `robots: noindex` porque uma página de diagnóstico público indexada no
 * Google seria encontrada por qualquer pessoa, e este endereço ainda não
 * tem domínio definido (ponto 20 da Seção 17). Quando a decisão de domínio
 * for tomada e o envio estiver ligado, esta linha muda — mas não antes.
 */
export const metadata: Metadata = {
  title: "Diagnóstico de Lucro e Operação da Cozinha",
  description:
    "Identifique onde a sua cozinha está perdendo tempo, dinheiro e eficiência. Diagnóstico gratuito da consultoria de Érika Bruna.",
  robots: { index: false, follow: false },
};

export default function PaginaDiagnosticoPublico() {
  return (
    <>
      {/* Abertura ------------------------------------------------------- */}
      <header className="mx-auto max-w-[46rem]">
        <p className="rotulo rotulo-traco">Diagnóstico gratuito</p>

        <h1 className="mt-5 text-balance text-[1.875rem] leading-[1.08] sm:text-[2.25rem] lg:text-[2.5rem]">
          Diagnóstico de lucro e operação da cozinha
        </h1>

        <p className="mt-5 max-w-[62ch] text-[1.0625rem] leading-relaxed text-[var(--tinta-suave)]">
          Esse diagnóstico foi criado para identificar onde sua cozinha está
          perdendo tempo, dinheiro e eficiência. Se hoje você sente
          desorganização, sobrecarga ou o lucro não aparece como deveria,
          aqui você começa a entender o porquê.
        </p>

        <div className="mt-7 grid gap-x-8 gap-y-4 border-t border-[var(--linha)] pt-6 sm:grid-cols-3">
          {[
            ["Resultado, não nota", "Você recebe uma leitura, não um percentual."],
            ["Feito para cozinha real", "Perguntas de operação, não de teoria."],
            ["Sem compromisso", "Responder não gera cobrança nem proposta."],
          ].map(([titulo, apoio]) => (
            <div key={titulo}>
              <p className="text-[0.875rem] font-medium text-tinta">{titulo}</p>
              <p className="mt-1 text-[0.8125rem] leading-snug text-[var(--tinta-fraca)]">
                {apoio}
              </p>
            </div>
          ))}
        </div>
      </header>

      <div className="mt-10 sm:mt-12">
        <IniciarDiagnostico />
      </div>
    </>
  );
}
