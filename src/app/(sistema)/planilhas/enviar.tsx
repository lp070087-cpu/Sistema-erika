"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { cn } from "@/lib/utils/cn";

/**
 * ENVIAR PARA CLIENTE — O FLUXO QUE EXISTE, SEM O ENVIO QUE NÃO EXISTE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA JANELA NÃO FAZ, E POR QUE ELA NÃO FAZ                     │
 * │                                                                      │
 * │ Não envia. Não diz "enviado". Não promete que o cliente recebeu.       │
 * │                                                                      │
 * │ O sistema não tem envio de e-mail configurado, não tem armazenamento    │
 * │ de arquivo e não tem link público — as três coisas de que um envio      │
 * │ real precisa. E o briefing proíbe o substituto óbvio: um link de        │
 * │ WhatsApp não oficial, ou uma mensagem que diz "enviado" para o que      │
 * │ apenas ficou pronto para enviar.                                       │
 * │                                                                      │
 * │ O que ela faz é o que dá para fazer com honestidade: mostrar a          │
 * │ escolha inteira — para quem, qual planilha, em que formato — e dizer    │
 * │ com todas as letras que o envio depende de uma integração que ainda     │
 * │ não está ligada.                                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE MOSTRAR OS FORMATOS QUE AINDA NÃO SAEM                       │
 * │                                                                      │
 * │ "Link" e "PDF" aparecem desabilitados, com o motivo. Esconder os dois   │
 * │ faria a janela parecer mais pronta do que é, e — pior — ela não teria   │
 * │ como saber que o formato que ela quer está no caminho. É a mesma        │
 * │ escolha do seletor de modelo: o catálogo mostra o que ainda não sai,     │
 * │ com o motivo, em vez de fingir que não existe.                          │
 * │                                                                      │
 * │ O PDF tem uma segunda razão para estar aqui: ele é o formato que ela    │
 * │ mais vai querer, porque é o que o cliente abre sem ter Excel. Ele não   │
 * │ sai hoje porque não há biblioteca de PDF no projeto — e a janela diz    │
 * │ isso, em vez de deixar uma opção que falharia no clique.                │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const FORMATOS: readonly {
  id: string;
  nome: string;
  descricao: string;
  disponivel: boolean;
  motivo?: string;
}[] = [
  {
    id: "link",
    nome: "Link para o cliente",
    descricao: "Um endereço que abre a planilha no navegador, sem baixar arquivo.",
    disponivel: false,
    motivo:
      "Depende do armazenamento das planilhas, que entra junto com o banco de dados. Hoje não há onde guardar para gerar o link.",
  },
  {
    id: "pdf",
    nome: "PDF",
    descricao: "O formato que o cliente abre sem ter Excel instalado.",
    disponivel: false,
    motivo: "A geração de PDF entra depois da integração de compartilhamento.",
  },
  {
    id: "excel",
    nome: "Excel (.xlsx)",
    descricao: "O arquivo da planilha, para quem vai abrir no Excel e continuar o trabalho.",
    disponivel: false,
    motivo:
      "O arquivo já sai pelo botão Exportar, ao lado da grade — este envio é que ainda não está ligado.",
  },
];

export function JanelaEnviar({
  aberta,
  planilha,
  clientes,
  clienteId,
  aoFechar,
}: {
  aberta: boolean;
  /** O nome da planilha que está aberta na tela. */
  planilha: string;
  clientes: readonly { id: string; nomeFantasia: string }[];
  clienteId: string;
  aoFechar: () => void;
}) {
  const [formato, definirFormato] = useState("excel");

  if (!aberta) return null;

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const escolhido = FORMATOS.find((f) => f.id === formato) ?? FORMATOS[0];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Enviar para cliente"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(7,30,20,0.42)] p-4 pt-[12vh]"
      onKeyDown={(e) => {
        if (e.key === "Escape") aoFechar();
      }}
    >
      <div className="w-full max-w-[520px] rounded-[var(--raio)] border border-[var(--linha-forte)] bg-[var(--superficie-solida)] shadow-[0_18px_48px_rgba(7,30,20,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--linha)] px-5 py-3.5">
          <h2 className="font-display text-[1.0625rem] text-tinta">Enviar para cliente</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-[var(--raio-sm)] px-2 py-0.5 text-[1rem] leading-none text-[var(--tinta-fraca)] transition-colors hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {/*
            AS TRÊS ESCOLHAS, EM LINHA E COMO FATO — não como formulário.

            Elas não são editáveis aqui: o cliente e a planilha são os que já
            estão escolhidos na barra acima, e mudá-los seria uma segunda
            barra de seletores dentro de uma janela. A janela CONFERE, e é o
            que basta.
          */}
          <dl className="space-y-2">
            <Linha rotulo="Cliente">
              {cliente ? (
                cliente.nomeFantasia
              ) : (
                <span className="text-[var(--tinta-fraca)]">
                  nenhum cliente escolhido na barra acima
                </span>
              )}
            </Linha>
            <Linha rotulo="Planilha">{planilha}</Linha>
          </dl>

          <fieldset>
            <legend className="text-[0.625rem] font-semibold tracking-[0.13em] uppercase text-[var(--tinta-fraca)]">
              Formato
            </legend>
            <div className="mt-1.5 space-y-1">
              {FORMATOS.map((f) => (
                <label
                  key={f.id}
                  className={cn(
                    "flex items-start gap-2.5 rounded-[var(--raio-sm)] border px-3 py-2 transition-colors",
                    f.disponivel
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-60",
                    f.id === formato
                      ? "border-[var(--color-oliva)] bg-[rgba(107,122,70,0.08)]"
                      : "border-[var(--linha)]"
                  )}
                  title={f.motivo}
                >
                  <input
                    type="radio"
                    name="formato-envio"
                    checked={f.id === formato}
                    disabled={!f.disponivel}
                    onChange={() => definirFormato(f.id)}
                    className="mt-[3px] accent-[var(--color-oliva)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[0.8125rem] font-medium text-tinta">
                      {f.nome}
                      {!f.disponivel ? (
                        <span className="ml-2 text-[0.6875rem] font-normal tracking-[0.06em] uppercase text-[var(--tinta-fraca)]">
                          ainda não
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-[0.75rem] leading-snug text-[var(--tinta-suave)]">
                      {f.descricao}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {/*
            A FRASE DO ENVIO, NO LUGAR DO BOTÃO DE ENVIAR.

            Ela fica onde o botão estaria, e é a informação que substitui o
            clique. Sem ela, a janela terminaria num botão "Enviar" que não
            envia — e a única coisa pior que não enviar é dizer que enviou.
          */}
          <p className="rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[var(--superficie-areia)] px-3 py-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
            Envio externo será ativado após a integração de persistência/compartilhamento.
            {escolhido?.motivo ? <span className="mt-1 block">{escolhido.motivo}</span> : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--linha)] px-5 py-3.5">
          <Botao variante="linha" tamanho="sm" onClick={aoFechar}>
            Fechar
          </Botao>
          <p className="ml-auto text-[0.75rem] text-[var(--tinta-fraca)]">
            Nada foi enviado ao cliente.
          </p>
        </div>
      </div>
    </div>
  );
}

function Linha({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 text-[0.8125rem]">
      <dt className="w-20 shrink-0 text-[0.625rem] font-semibold tracking-[0.13em] uppercase text-[var(--tinta-fraca)] leading-5">
        {rotulo}
      </dt>
      <dd className="min-w-0 text-tinta">{children}</dd>
    </div>
  );
}
