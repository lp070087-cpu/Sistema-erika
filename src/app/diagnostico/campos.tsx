"use client";

import { cn } from "@/lib/utils/cn";
import type { Pergunta } from "@/lib/dados/perguntas";

/**
 * CAMPOS DO FORMULÁRIO PÚBLICO.
 *
 * Estes campos são diferentes dos do sistema, e a diferença é deliberada.
 *
 * No sistema, `CampoSelecao` é um `<select>` — correto ali, porque a
 * consultora preenche tabela em desktop e o dropdown economiza espaço.
 *
 * Aqui quem responde está no celular, em pé na cozinha, entre um serviço
 * e outro. Um `<select>` no celular abre a roda do sistema operacional,
 * esconde as opções e obriga um toque a mais para ver o que existe. Opções
 * como botões grandes mostram todas as alternativas de uma vez, são
 * alcançáveis com o polegar e dizem de relance quantas são — "Sim / Mais
 * ou menos / Não" precisa ser visto, não descoberto.
 *
 * ACESSIBILIDADE: o agrupamento usa `role="radiogroup"` e as opções são
 * `input type="radio"` de verdade, escondidos visualmente. Teclado, leitor
 * de tela e navegação por seta funcionam sem JavaScript adicional.
 */

/** Perguntas que pedem resposta longa — ganham área de texto, não linha única. */
const RESPOSTAS_LONGAS = new Set([
  "negocio-e-abertura",
  "etapa-perde-tempo",
  "maior-problema",
  "o-que-mudaria",
  "observacoes-livres",
]);

export function CampoPergunta({
  pergunta,
  valor,
  erro,
  aoMudar,
}: {
  pergunta: Pergunta;
  valor: string;
  erro?: string;
  aoMudar: (valor: string) => void;
}) {
  const idBase = `q-${pergunta.id}`;

  if (pergunta.tipo === "selecao" && pergunta.opcoes) {
    return (
      <fieldset
        className="scroll-mt-28"
        id={idBase}
        aria-describedby={erro ? `${idBase}-erro` : undefined}
      >
        <legend className="mb-1 block text-[1.0625rem] leading-snug text-tinta sm:text-[1.125rem]">
          {pergunta.enunciado}
        </legend>
        {pergunta.ajuda ? (
          <p className="mb-3.5 text-[0.875rem] leading-relaxed text-[var(--tinta-fraca)]">
            {pergunta.ajuda}
          </p>
        ) : (
          <div className="mb-3.5" />
        )}

        <div
          role="radiogroup"
          aria-invalid={erro ? true : undefined}
          className="grid gap-2 sm:grid-cols-2"
        >
          {pergunta.opcoes.map((opcao) => {
            const marcado = valor === opcao.valor;
            const radioId = `${idBase}-${opcao.valor}`;
            return (
              <label
                key={opcao.valor}
                htmlFor={radioId}
                className={cn(
                  "group flex min-h-12 cursor-pointer items-center gap-3 rounded-[var(--raio)]",
                  "border px-4 py-3 text-[0.9375rem] leading-snug transition-colors duration-150",
                  "has-[:focus-visible]:outline has-[:focus-visible]:outline-2",
                  "has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-dourado",
                  marcado
                    ? "border-oliva bg-[rgba(107,122,70,0.09)] text-tinta"
                    : "border-[var(--linha-forte)] bg-white/60 text-[var(--tinta-suave)] hover:border-[var(--tinta-fraca)] hover:bg-white"
                )}
              >
                <input
                  type="radio"
                  id={radioId}
                  name={idBase}
                  value={opcao.valor}
                  checked={marcado}
                  onChange={() => aoMudar(opcao.valor)}
                  className="sr-only"
                />
                <span
                  aria-hidden
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
                    marcado ? "border-oliva" : "border-[var(--linha-forte)] group-hover:border-[var(--tinta-fraca)]"
                  )}
                >
                  {marcado ? <span className="h-2 w-2 rounded-full bg-oliva" /> : null}
                </span>
                <span className="min-w-0">{opcao.texto}</span>
              </label>
            );
          })}
        </div>

        {erro ? <MensagemErro id={`${idBase}-erro`}>{erro}</MensagemErro> : null}
      </fieldset>
    );
  }

  // Campos de texto — linha única ou área de texto, conforme a pergunta.
  const longo = RESPOSTAS_LONGAS.has(pergunta.id);
  const tipoHtml =
    pergunta.tipo === "email" ? "email" : pergunta.tipo === "telefone" ? "tel" : "text";

  return (
    <div className="scroll-mt-28" id={idBase}>
      <label
        htmlFor={`${idBase}-campo`}
        className="mb-1 block text-[1.0625rem] leading-snug text-tinta sm:text-[1.125rem]"
      >
        {pergunta.enunciado}
      </label>
      {pergunta.ajuda ? (
        <p className="mb-3 text-[0.875rem] leading-relaxed text-[var(--tinta-fraca)]">
          {pergunta.ajuda}
        </p>
      ) : (
        <div className="mb-3" />
      )}

      {longo ? (
        <textarea
          id={`${idBase}-campo`}
          name={pergunta.id}
          rows={pergunta.id === "observacoes-livres" ? 5 : 3}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${idBase}-erro` : undefined}
          className={cn(campoBaseClasse, "resize-y leading-relaxed", erro && "border-red-700/60")}
        />
      ) : (
        <input
          id={`${idBase}-campo`}
          name={pergunta.id}
          type={tipoHtml}
          inputMode={pergunta.tipo === "telefone" ? "tel" : undefined}
          autoComplete={pergunta.tipo === "email" ? "email" : undefined}
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          aria-invalid={erro ? true : undefined}
          aria-describedby={erro ? `${idBase}-erro` : undefined}
          className={cn(campoBaseClasse, erro && "border-red-700/60")}
        />
      )}

      {erro ? <MensagemErro id={`${idBase}-erro`}>{erro}</MensagemErro> : null}
    </div>
  );
}

const campoBaseClasse =
  "w-full rounded-[var(--raio)] border border-[var(--linha-forte)] bg-white/70 " +
  "px-4 py-3 text-[1rem] text-tinta transition-colors duration-150 " +
  "placeholder:text-[var(--tinta-fraca)] hover:border-[var(--tinta-fraca)] " +
  "focus:border-oliva focus:bg-white focus:outline-none";

function MensagemErro({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} role="alert" className="mt-2 text-[0.8125rem] font-medium text-red-800">
      {children}
    </p>
  );
}
