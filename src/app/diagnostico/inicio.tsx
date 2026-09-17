"use client";

import { useState } from "react";
// Módulo-folha, não o barril — este componente vai no pacote público.
// Ver a nota em formulario.tsx.
import { TOTAL_PERGUNTAS } from "@/lib/dados/perguntas";
import { Formulario } from "./formulario";

/**
 * A PORTA DE ENTRADA DO FORMULÁRIO.
 *
 * Um botão de começar entre a apresentação e a primeira pergunta, em vez
 * de cair direto no campo.
 *
 * Não é enfeite. Quem chega por um link do Instagram não sabe o tamanho do
 * compromisso: cair numa tela com 29 perguntas sem aviso produz abandono
 * no meio, e um diagnóstico pela metade é pior que nenhum — a leitura fica
 * incompleta sem ninguém saber. A tela anterior diz quanto tempo leva e o
 * que a pessoa recebe. O botão é o consentimento.
 *
 * É componente de cliente por um motivo só: trocar a apresentação pelo
 * formulário sem recarregar a página, para que a rolagem e o contexto não
 * se percam.
 */
export function IniciarDiagnostico() {
  const [comecou, setComecou] = useState(false);

  if (comecou) {
    return <Formulario />;
  }

  return (
    <div className="mx-auto max-w-[46rem]">
      <div className="rounded-[var(--raio)] border border-[var(--linha-forte)] bg-[var(--superficie)] px-6 py-8 sm:px-8 sm:py-10">
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-oliva">
          Antes de começar
        </p>

        <h2 className="mt-4 text-balance text-[1.375rem] sm:text-[1.625rem]">
          São {TOTAL_PERGUNTAS} perguntas, cerca de cinco minutos.
        </h2>

        <p className="mt-3 max-w-[58ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
          Não existe resposta certa — o que me ajuda é a resposta verdadeira.
          A maioria é de marcar, e as poucas de escrever são onde você fala
          por conta própria; é de lá que sai o direcionamento mais útil.
        </p>

        <dl className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-3">
          {[
            [`${TOTAL_PERGUNTAS} perguntas`, "Em cinco etapas curtas"],
            ["5 minutos", "Dá para responder de uma vez"],
            ["Sem custo", "É um diagnóstico, não uma proposta"],
          ].map(([titulo, apoio]) => (
            <div key={titulo}>
              <dt className="font-display text-[1.0625rem] text-tinta">{titulo}</dt>
              <dd className="mt-1 text-[0.8125rem] leading-snug text-[var(--tinta-fraca)]">
                {apoio}
              </dd>
            </div>
          ))}
        </dl>

        <button
          type="button"
          onClick={() => {
            setComecou(true);
            // A apresentação sai e o formulário entra no mesmo lugar. Sem
            // isto, a página mantém a posição antiga e a primeira pergunta
            // pode nascer fora da tela.
            requestAnimationFrame(() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            );
          }}
          className={
            "mt-8 inline-flex h-12 w-full items-center justify-center gap-2 " +
            "rounded-[var(--raio-sm)] bg-profundo px-6 text-[0.75rem] font-medium " +
            "uppercase tracking-[0.15em] text-off transition-colors duration-200 " +
            "hover:bg-medio sm:w-auto"
          }
        >
          Começar o diagnóstico <span aria-hidden>→</span>
        </button>

        <p className="mt-5 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
          Suas respostas ficam guardadas enquanto você navega entre as etapas.
          Se preferir parar no meio, o ideal é terminar de uma vez — a página
          ainda não retoma de onde parou.
        </p>
      </div>
    </div>
  );
}
