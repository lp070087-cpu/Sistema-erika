"use client";

import { useEffect } from "react";
import { Botao } from "@/components/ui/botao";
import { Rotulo } from "@/components/ui/rotulo";
import { Logotipo } from "@/components/marca/logotipo";

/**
 * Erro de execução.
 *
 * A Fase 0 identificou que as planilhas atuais mostram `#DIV/0!` ao
 * cliente. Um sistema não pode fazer o equivalente: a mensagem diz o que
 * aconteceu em linguagem de operação, e o detalhe técnico só aparece
 * fora de produção.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[sistema-erika]", error);
  }, [error]);

  const mostrarDetalhe = process.env.NODE_ENV !== "production";

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logotipo className="mb-10" />
      <Rotulo className="mb-4">Algo falhou</Rotulo>
      <h1 className="max-w-[24ch] text-balance">
        Não foi possível carregar esta parte do sistema.
      </h1>
      <p className="mt-3 max-w-[54ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
        Nenhum dado foi perdido. Tente carregar de novo — se o problema
        continuar, é um defeito a ser corrigido.
      </p>

      {mostrarDetalhe && error.message ? (
        <pre className="mt-6 max-w-[70ch] overflow-x-auto rounded-[var(--raio)] border border-[var(--linha)] bg-[rgba(14,26,20,0.04)] px-4 py-3 text-left text-[0.8125rem] text-[var(--tinta-suave)]">
          {error.message}
        </pre>
      ) : null}

      <Botao variante="primario" className="mt-8" onClick={reset}>
        Tentar de novo
      </Botao>
    </div>
  );
}
