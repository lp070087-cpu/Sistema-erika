"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { AlinhamentoGrade, EstiloGrade, FormatoGrade } from "@/lib/planilhas/grade";

/**
 * A BARRA DE FORMATAÇÃO — PINTAR A CÉLULA E A LINHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ELA É, NA PLANILHA DE TRABALHO DA ÉRIKA                        │
 * │                                                                      │
 * │ Marcar uma linha de amarelo, destacar o subtotal, separar uma seção,  │
 * │ pôr um aviso em verde. Nada disso é enfeite: é como uma planilha de    │
 * │ cozinha se comunica com quem a lê depois — e é a razão de a marcação   │
 * │ precisar ATRAVESSAR para o arquivo. Uma cor que existe só na tela      │
 * │ seria trabalho que se perde no momento de exportar.                    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELA NÃO É UM CLONE DO EXCEL                                  │
 * │                                                                      │
 * │ O briefing diz "não precisa criar um clone completo do Excel", e o     │
 * │ corte foi feito no que muda o CONTEÚDO visual e não a composição:      │
 * │ fonte, tamanho, borda, mesclar célula, congelar painel — nada disso    │
 * │ está aqui. O que ficou é o que se usa para marcar: fundo, cor do       │
 * │ texto, negrito, alinhamento, e o formato do número.                    │
 * │                                                                      │
 * │ As duas últimas são as que parecem dispensáveis e não são: negrito é   │
 * │ o destaque mais barato que existe numa planilha, e o formato é o que   │
 * │ faz "12,5" virar "R$ 12,50" sem ninguém digitar cifrão.                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE NÃO TEM AQUI, E POR QUE                                        │
 * │                                                                      │
 * │ Não há "desfazer". A marcação é um mapa em memória, e desfazer exigiria │
 * │ uma pilha de estados — uma peça que não cabe nesta rodada e que, feita  │
 * │ pela metade, seria pior que a ausência. O que existe é o caminho de     │
 * │ volta: pintar de novo, ou "limpar" a seleção, que devolve a célula ao   │
 * │ estilo do modelo.                                                      │
 * │                                                                      │
 * │ Não há "aplicar a um intervalo" — o briefing o lista como futuro, e     │
 * │ implementá-lo agora exigiria seleção por arrasto, que é um gesto        │
 * │ inteiro por si só. Hoje a seleção é uma célula ou uma linha, e as duas  │
 * │ cobrem os gestos que o briefing descreve: "marcar uma linha de          │
 * │ amarelo" e "destacar subtotal".                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * A PALETA DA IDENTIDADE, MAIS AS CORES DE MARCAR.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO SÓ AS CORES DA MARCA                                     │
 * │                                                                      │
 * │ Uma paleta só de verdes e cremes não marca nada: para destacar, é       │
 * │ preciso CONTRASTE, e é por isso que o amarelo e o vermelho claro        │
 * │ estão aqui. São as cores de quem marca planilha, e não as da           │
 * │ identidade — o briefing é explícito que a marca não limita.            │
 * │                                                                      │
 * │ Os valores são claros de propósito: a marcação entra ATRÁS do texto    │
 * │ preto da célula. Um azul-marinho cheio apagaria o número, e o gesto     │
 * │ de marcar teria PIORADO a leitura — que é o oposto do que ele serve    │
 * │ para fazer.                                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const PALETA: readonly { cor: string; nome: string }[] = [
  { cor: "#fdf0b2", nome: "Amarelo — o destaque de sempre" },
  { cor: "#d9edc8", nome: "Verde claro" },
  { cor: "#e8dfd0", nome: "Creme — separa uma seção" },
  { cor: "#f6d3cb", nome: "Vermelho claro — chama atenção" },
  { cor: "#cfe4f2", nome: "Azul claro" },
  { cor: "#e6dcf2", nome: "Lilás" },
  { cor: "#ffffff", nome: "Branco" },
];

const CORES_DE_TEXTO: readonly { cor: string; nome: string }[] = [
  { cor: "#0e1a14", nome: "Tinta — o texto normal" },
  { cor: "#1d5236", nome: "Verde escuro" },
  { cor: "#8a6b10", nome: "Dourado escuro" },
  { cor: "#8f2f22", nome: "Vermelho escuro — aviso" },
  { cor: "#35507a", nome: "Azul escuro" },
  { cor: "#ffffff", nome: "Branco — sobre fundo escuro" },
];

const ALINHAMENTOS: readonly { valor: AlinhamentoGrade; rotulo: string; titulo: string }[] = [
  { valor: "esq", rotulo: "⯇", titulo: "Alinhar à esquerda" },
  { valor: "centro", rotulo: "≡", titulo: "Centralizar" },
  { valor: "dir", rotulo: "⯈", titulo: "Alinhar à direita" },
];

const FORMATOS: readonly { valor: FormatoGrade; rotulo: string; titulo: string }[] = [
  { valor: "moeda", rotulo: "R$", titulo: "Mostrar como valor em reais" },
  { valor: "percentual", rotulo: "%", titulo: "Mostrar como porcentagem" },
  { valor: "numero", rotulo: "#", titulo: "Mostrar como número simples" },
];

/**
 * A BARRA INTEIRA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ELA FAZ QUANDO NADA ESTÁ SELECIONADO                           │
 * │                                                                      │
 * │ Ela NÃO desaparece. Uma barra que aparece e some faz a tela pular de   │
 * │ altura a cada clique, e — pior — esconderia a existência do recurso de  │
 * │ quem ainda não selecionou nada. Ela fica, desabilitada, com a frase    │
 * │ que diz o gesto que falta: "Escolha uma célula ou uma linha".          │
 * │                                                                      │
 * │ Desabilitar em vez de esconder é a mesma escolha do seletor de modelo  │
 * │ que mostra o que ainda não sai: o recurso existe, e o estado da tela    │
 * │ diz por que ele não responde agora.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function BarraDeFormatacao({
  alvo,
  atual,
  aoAplicar,
  aoLimpar,
}: {
  /** O que está escolhido, em palavras: "Célula C4" ou "Linha 12". */
  alvo: string | null;
  /** O que já está aplicado no alvo, para os controles mostrarem o estado. */
  atual: EstiloGrade;
  aoAplicar: (mudanca: EstiloGrade) => void;
  aoLimpar: () => void;
}) {
  const [corAberta, definirCorAberta] = useState<"fundo" | "texto" | null>(null);
  const ativo = alvo !== null;
  /*
    `{...atual}` é a marcação inteira do alvo, e os controles leem dela o que
    está ligado. Um estado paralelo no componente seria uma segunda resposta
    para "esta célula está em negrito?" — e a segunda resposta é a que fica
    errada quando a marcação chega de outro lugar (de uma linha pintada, por
    exemplo).
  */
  const negrito = atual.negrito === true;

  return (
    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 border-b border-[var(--linha)] bg-[var(--superficie-areia)] px-3 py-2">
      <span
        className={cn(
          "tabular mr-1 shrink-0 text-[0.6875rem] font-medium tracking-[0.06em]",
          ativo ? "text-[var(--tinta-suave)]" : "text-[var(--tinta-fraca)]"
        )}
      >
        {alvo ?? "Escolha uma célula ou uma linha para marcar"}
      </span>

      <Controles ativo={ativo}>
        <button
          type="button"
          onClick={() => aoAplicar({ negrito: !negrito })}
          aria-pressed={negrito}
          title="Negrito"
          className={cn(
            "h-6 w-6 rounded-[var(--raio-sm)] border text-[0.75rem] font-bold leading-none transition-colors",
            negrito
              ? "border-[var(--color-oliva)] bg-[rgba(107,122,70,0.18)] text-tinta"
              : "border-[var(--linha)] text-[var(--tinta-suave)] hover:bg-[rgba(14,26,20,0.05)]"
          )}
        >
          B
        </button>

        {ALINHAMENTOS.map((a) => (
          <button
            key={a.valor}
            type="button"
            onClick={() => aoAplicar({ alinhamento: a.valor })}
            aria-pressed={atual.alinhamento === a.valor}
            title={a.titulo}
            className={cn(
              "h-6 w-6 rounded-[var(--raio-sm)] border text-[0.6875rem] leading-none transition-colors",
              atual.alinhamento === a.valor
                ? "border-[var(--color-oliva)] bg-[rgba(107,122,70,0.18)] text-tinta"
                : "border-[var(--linha)] text-[var(--tinta-suave)] hover:bg-[rgba(14,26,20,0.05)]"
            )}
          >
            {a.rotulo}
          </button>
        ))}

        <span aria-hidden className="mx-0.5 h-5 w-px bg-[var(--linha-forte)]" />

        {FORMATOS.map((f) => (
          <button
            key={f.valor}
            type="button"
            onClick={() => aoAplicar({ formato: f.valor })}
            aria-pressed={atual.formato === f.valor}
            title={f.titulo}
            className={cn(
              "h-6 w-7 rounded-[var(--raio-sm)] border text-[0.6875rem] leading-none transition-colors",
              atual.formato === f.valor
                ? "border-[var(--color-oliva)] bg-[rgba(107,122,70,0.18)] text-tinta"
                : "border-[var(--linha)] text-[var(--tinta-suave)] hover:bg-[rgba(14,26,20,0.05)]"
            )}
          >
            {f.rotulo}
          </button>
        ))}

        <span aria-hidden className="mx-0.5 h-5 w-px bg-[var(--linha-forte)]" />

        <SeletorDeCor
          rotulo="Fundo"
          cor={atual.fundo}
          aberta={corAberta === "fundo"}
          paleta={PALETA}
          aoAbrir={() => definirCorAberta(corAberta === "fundo" ? null : "fundo")}
          aoEscolher={(cor) => {
            aoAplicar({ fundo: cor });
            definirCorAberta(null);
          }}
        />

        <SeletorDeCor
          rotulo="Texto"
          cor={atual.texto}
          aberta={corAberta === "texto"}
          paleta={CORES_DE_TEXTO}
          aoAbrir={() => definirCorAberta(corAberta === "texto" ? null : "texto")}
          aoEscolher={(cor) => {
            aoAplicar({ texto: cor });
            definirCorAberta(null);
          }}
        />
      </Controles>

      <button
        type="button"
        onClick={aoLimpar}
        disabled={!ativo}
        className={cn(
          "ml-auto shrink-0 rounded-[var(--raio-sm)] px-2 py-1 text-[0.6875rem] tracking-[0.06em] uppercase transition-colors",
          ativo
            ? "text-[var(--tinta-suave)] hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta"
            : "cursor-not-allowed text-[var(--tinta-fraca)] opacity-50"
        )}
      >
        Limpar marcação
      </button>
    </div>
  );
}

/**
 * O GRUPO DESABILITADO, SEM REPETIR `disabled` EM OITO BOTÕES.
 *
 * `disabled` num `<fieldset>` desabilita todo controle dentro dele — é o
 * comportamento nativo, e é o único jeito de o estado "sem seleção" valer
 * para a barra inteira sem que um botão novo criado amanhã esqueça de checar.
 */
function Controles({ ativo, children }: { ativo: boolean; children: React.ReactNode }) {
  return (
    <fieldset
      disabled={!ativo}
      className={cn(
        "flex flex-wrap items-center gap-x-1 gap-y-1.5 border-0 p-0",
        !ativo && "opacity-45"
      )}
    >
      <legend className="sr-only">Formatação da seleção</legend>
      {children}
    </fieldset>
  );
}

/**
 * A COR, COM PALETA E CAMPO LIVRE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O `<input type="color">` DO NAVEGADOR E NÃO UM SELETOR PURO  │
 * │                                                                      │
 * │ Uma paleta fixa seria mais rápida de clicar e recusaria a cor que ela  │
 * │ precisa — a cor exata do arquivo dela, a que o cliente pediu. O        │
 * │ briefing diz "pode oferecer cores da identidade + seletor de cor       │
 * │ personalizada", e as duas juntas é o que dá as duas coisas: o clique   │
 * │ rápido no caso comum e a saída livre no caso que ninguém previu.       │
 * │                                                                      │
 * │ O seletor nativo do sistema operacional entrega `#rrggbb` sempre, que  │
 * │ é exatamente o vocabulário que `grade.ts` valida. Nada a converter.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function SeletorDeCor({
  rotulo,
  cor,
  aberta,
  paleta,
  aoAbrir,
  aoEscolher,
}: {
  rotulo: string;
  cor: string | undefined;
  aberta: boolean;
  paleta: readonly { cor: string; nome: string }[];
  aoAbrir: () => void;
  aoEscolher: (cor: string) => void;
}) {
  return (
    <span className="relative">
      <button
        type="button"
        onClick={aoAbrir}
        aria-expanded={aberta}
        title={`Cor de ${rotulo.toLowerCase()}`}
        className="flex h-6 items-center gap-1.5 rounded-[var(--raio-sm)] border border-[var(--linha)] px-1.5 text-[0.625rem] tracking-[0.04em] text-[var(--tinta-suave)] uppercase transition-colors hover:bg-[rgba(14,26,20,0.05)]"
      >
        <span
          aria-hidden
          className="h-3 w-3 shrink-0 rounded-[2px] border border-[var(--linha-forte)]"
          // Sem cor escolhida, o quadradinho mostra o que está valendo hoje —
          // branco — e não um vazio que pareceria defeito.
          style={{ background: cor ?? "#ffffff" }}
        />
        {rotulo}
      </button>

      {aberta ? (
        <span className="absolute top-7 left-0 z-40 block w-[188px] rounded-[var(--raio)] border border-[var(--linha-forte)] bg-[var(--superficie-solida)] p-2 shadow-[0_10px_28px_rgba(7,30,20,0.22)]">
          <span className="grid grid-cols-7 gap-1">
            {paleta.map((p) => (
              <button
                key={p.cor}
                type="button"
                onClick={() => aoEscolher(p.cor)}
                title={p.nome}
                aria-label={p.nome}
                className={cn(
                  "h-5 w-5 rounded-[2px] border transition-transform hover:scale-110",
                  cor === p.cor
                    ? "border-[var(--color-oliva)] ring-2 ring-[rgba(107,122,70,0.35)]"
                    : "border-[var(--linha-forte)]"
                )}
                style={{ background: p.cor }}
              />
            ))}
          </span>

          <span className="mt-2 flex items-center gap-2 border-t border-[var(--linha)] pt-2">
            <input
              type="color"
              value={cor ?? "#ffffff"}
              onChange={(e) => aoEscolher(e.target.value)}
              aria-label={`Escolher outra cor de ${rotulo.toLowerCase()}`}
              className="h-6 w-9 cursor-pointer rounded-[2px] border border-[var(--linha-forte)] bg-transparent p-0"
            />
            <span className="text-[0.6875rem] text-[var(--tinta-fraca)]">outra cor</span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
