"use client";

import { useState, type ReactNode } from "react";
import { Botao } from "./botao";
import { Aviso, Painel } from "./superficie";
import { cn } from "@/lib/utils/cn";

/**
 * O PADRÃO DE EDIÇÃO DO SISTEMA — editar, salvar, cancelar, excluir.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CONTRATO, QUE É O MESMO EM TODA TELA                                │
 * │                                                                      │
 * │   1. A tela mostra o dado. Nada é campo de formulário por padrão.      │
 * │   2. `[ EDITAR ]` abre os campos JÁ PREENCHIDOS com o que está lá.     │
 * │   3. `[ CANCELAR ]` fecha e DESCARTA o que foi digitado.               │
 * │   4. `[ SALVAR ]` grava, fecha, e a tela mostra o dado novo.           │
 * │   5. `[ EXCLUIR ]` pergunta antes. Sempre. Sem exceção.                │
 * │                                                                      │
 * │ ┌────────────────────────────────────────────────────────────────┐   │
 * │ │ POR QUE O PONTO 2 É O QUE MAIS IMPORTA                          │   │
 * │ │                                                                │   │
 * │ │ O erro que este componente existe para impedir é o campo que    │   │
 * │ │ abre VAZIO. Um formulário em branco sobre um dado que já existe │   │
 * │ │ convida a redigitar — e redigitar é como o preço de R$ 42,90    │   │
 * │ │ vira R$ 4,29, porque ninguém redigita duas casas com cuidado.   │   │
 * │ │                                                                │   │
 * │ │ Abrir com o valor dentro inverte a tarefa: em vez de ESCREVER,  │   │
 * │ │ ela CORRIGE. É a diferença entre um cadastro e uma edição.      │   │
 * │ └────────────────────────────────────────────────────────────────┘   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO NÃO FAZ                                           │
 * │                                                                      │
 * │ Não redige o conteúdo. Ele dá o MECANISMO — estado de aberto/fechado, │
 * │ os três botões, a confirmação, o retorno de erro. Cada tela escreve   │
 * │ os campos dela, porque os campos de uma ficha não são os de um        │
 * │ insumo, e um "formulário genérico" que adivinhasse os dois seria      │
 * │ pior nos dois.                                                        │
 * │                                                                      │
 * │ Não usa `contenteditable`. Texto solto editável na tela parece mais   │
 * │ direto e é pior em tudo: não tem rótulo, não tem validação, não       │
 * │ aceita desfazer, e um clique errado altera o dado sem que ninguém     │
 * │ tenha pedido para alterá-lo.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

// ---------------------------------------------------------------------------
// O corpo de um formulário de edição
// ---------------------------------------------------------------------------

/**
 * A moldura dos campos, com a barra de salvar/cancelar.
 *
 * `rascunho` é quem guarda os valores enquanto se digita. Ele é do tipo que
 * a tela quiser, e quem o conhece é quem passa `aoSalvar` — este componente
 * nunca lê dentro dele.
 */
export function CorpoDeEdicao<T>({
  aberto,
  rascunho,
  aoSalvar,
  aoCancelar,
  rotuloSalvar = "Salvar",
  rotuloCancelar = "Cancelar",
  children,
  className,
}: {
  aberto: boolean;
  /** O estado em edição. Existe para o componente saber se há o que salvar. */
  rascunho: T;
  /**
   * Grava. Pode ser assíncrono — o `[ SALVAR ]` desabilita enquanto corre, e
   * a mensagem de erro aparece dentro do formulário, junto do que falhou.
   *
   * Devolver uma `string` significa RECUSA, e o texto é o motivo. Devolver
   * `null` ou nada significa que gravou.
   */
  aoSalvar: (rascunho: T) => string | null | void | Promise<string | null | void>;
  aoCancelar: () => void;
  rotuloSalvar?: ReactNode;
  rotuloCancelar?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const [salvando, setSalvando] = useState(false);
  const [recusa, setRecusa] = useState<string | null>(null);

  if (!aberto) return null;

  async function salvar() {
    setSalvando(true);
    setRecusa(null);
    try {
      const resposta = await aoSalvar(rascunho);
      if (typeof resposta === "string") {
        setRecusa(resposta);
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {children}

      {recusa !== null ? (
        <Aviso tom="atencao" titulo="Não foi possível salvar">
          <p>{recusa}</p>
        </Aviso>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Botao variante="primario" tamanho="sm" onClick={salvar} disabled={salvando}>
          {salvando ? "Salvando…" : rotuloSalvar}
        </Botao>
        <Botao variante="linha" tamanho="sm" onClick={aoCancelar} disabled={salvando}>
          {rotuloCancelar}
        </Botao>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Excluir — sempre com confirmação
// ---------------------------------------------------------------------------

/**
 * EXCLUIR — o único botão do sistema que pergunta duas vezes.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A CONFIRMAÇÃO É UM PASSO SEPARADO, E NÃO UM `confirm()`       │
 * │                                                                      │
 * │ A caixa cinza do navegador funciona, e tem três defeitos: ela diz     │
 * │ "OK / Cancelar" sem dizer o que vai ser apagado; ela não consegue     │
 * │ explicar a consequência (o insumo está em três fichas?); e ela         │
 * │ bloqueia a aba inteira, o que assusta mais do que informa.            │
 * │                                                                      │
 * │ Este painel fica no lugar do botão, diz o NOME do que vai sair, e     │
 * │ diz o que NÃO vai sair junto. Quem lê isso sobre um insumo em uso      │
 * │ desiste — que é o resultado desejado, e ele acontece antes do clique  │
 * │ e não depois.                                                         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AoExcluir({
  nome,
  consequencia,
  aoConfirmar,
  rotulo = "Excluir",
  className,
}: {
  nome: string;
  /** O que sai junto, e o que não sai. Uma frase, no vocabulário dela. */
  consequencia: ReactNode;
  aoConfirmar: () => void;
  rotulo?: string;
  className?: string;
}) {
  const [confirmando, setConfirmando] = useState(false);

  if (!confirmando) {
    return (
      <Botao
        variante="linha"
        tamanho="sm"
        className={cn("text-[#8a2b20] hover:bg-[rgba(138,43,32,0.07)]", className)}
        onClick={() => setConfirmando(true)}
      >
        {rotulo}
      </Botao>
    );
  }

  return (
    <Painel className={cn("border-[#8a2b20]/35", className)}>
      <p className="text-[0.8125rem] font-semibold text-tinta">
        Excluir &ldquo;{nome}&rdquo;?
      </p>
      <div className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
        {consequencia}
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        <Botao
          variante="primario"
          tamanho="sm"
          className="border-[#8a2b20] bg-[#8a2b20] hover:bg-[#6f221a] hover:border-[#6f221a]"
          onClick={aoConfirmar}
        >
          Sim, excluir
        </Botao>
        <Botao variante="linha" tamanho="sm" onClick={() => setConfirmando(false)}>
          Manter
        </Botao>
      </div>
    </Painel>
  );
}

// ---------------------------------------------------------------------------
// Edição em linha — para tabela
// ---------------------------------------------------------------------------

/**
 * UMA CÉLULA EDITÁVEL EM LINHA.
 *
 * Existe para o caso em que abrir um formulário inteiro seria exagero: mudar
 * a quantidade de uma linha da ficha, o nome de um prato numa lista. Abre um
 * campo no lugar do texto, salva com Enter ou com o botão, cancela com Esc.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O CAMPO ABRE COM O TEXTO DE DENTRO                            │
 * │                                                                      │
 * │ Mesmo motivo do formulário grande: campo vazio convida a redigitar.   │
 * │ Aqui a consequência é mais visível ainda, porque o dado está ao lado  │
 * │ — quem abrisse em branco estaria apagando o que está vendo.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function EdicaoEmLinha({
  valor,
  aoSalvar,
  aoCancelar,
  type = "text",
  inputMode,
  placeholder,
  ariaLabel,
  sufixo,
}: {
  valor: string;
  aoSalvar: (novo: string) => void;
  aoCancelar: () => void;
  type?: "text" | "date";
  inputMode?: "decimal" | "text";
  placeholder?: string;
  ariaLabel: string;
  /** Unidade mostrada depois do campo, só para leitura. */
  sufixo?: string;
}) {
  const [texto, setTexto] = useState(valor);

  const base =
    "h-8 w-full min-w-[5.5rem] rounded-[var(--raio-sm)] border border-oliva " +
    "bg-white px-2 text-[0.875rem] text-tinta outline-none";

  return (
    <span className="inline-flex items-center gap-1.5">
      <input
        /*
          O foco é deliberado: o campo abriu por um clique dela em "editar", e
          o cursor cair aqui é a continuação desse clique. Sem ele, quem edita
          precisa clicar duas vezes para digitar uma vez.
        */
        autoFocus
        type={type}
        inputMode={inputMode}
        aria-label={ariaLabel}
        value={texto}
        placeholder={placeholder}
        onChange={(e) => setTexto(e.target.value)}
        className={base}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            aoSalvar(texto);
          }
          if (e.key === "Escape") {
            e.preventDefault();
            aoCancelar();
          }
        }}
      />
      {sufixo ? (
        <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">{sufixo}</span>
      ) : null}
      <button
        type="button"
        aria-label={`Salvar ${ariaLabel}`}
        onClick={() => aoSalvar(texto)}
        className="rounded-[var(--raio-sm)] px-2 py-1 text-[0.75rem] font-semibold text-oliva hover:bg-[rgba(107,122,70,0.1)]"
      >
        Salvar
      </button>
      <button
        type="button"
        aria-label={`Cancelar edição de ${ariaLabel}`}
        onClick={aoCancelar}
        className="rounded-[var(--raio-sm)] px-2 py-1 text-[0.75rem] text-[var(--tinta-fraca)] hover:bg-[rgba(14,26,20,0.06)]"
      >
        Cancelar
      </button>
    </span>
  );
}

/**
 * O GATILHO DE UMA CÉLULA — o texto que vira botão de editar.
 *
 * Uma célula que não parece clicável não é usada; uma que parece botão em
 * toda linha polui a tabela. O meio-termo é o sublinhado pontilhado, que
 * aparece no hover e não custa altura nenhuma.
 */
export function CelulaEditavel({
  aberta,
  aoAbrir,
  children,
  ariaLabel,
}: {
  aberta: boolean;
  aoAbrir: () => void;
  children: ReactNode;
  ariaLabel: string;
}) {
  if (aberta) return null;
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={aoAbrir}
      className="text-left underline decoration-dotted decoration-[var(--tinta-fraca)] underline-offset-4 transition-colors hover:text-oliva hover:decoration-oliva"
    >
      {children}
    </button>
  );
}
