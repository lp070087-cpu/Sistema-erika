"use client";

import { Botao } from "@/components/ui/botao";

/**
 * DESFAZER E REFAZER, NA FAIXA DE COMANDO DA CENTRAL.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE DOIS BOTÕES, SE OS ATALHOS JÁ EXISTEM                         │
 * │                                                                      │
 * │ O briefing pede os dois: os atalhos para quem já tem o gesto na mão,   │
 * │ e os botões para quem não tem. Um recurso que só existe atrás de uma   │
 * │ combinação de teclas é um recurso que metade das pessoas nunca          │
 * │ descobre — e desfazer é justamente o que se procura com pressa,         │
 * │ depois do erro.                                                       │
 * │                                                                      │
 * │ Por isso eles ficam VISÍVEIS o tempo todo, e desabilitados quando não   │
 * │ há o que desfazer. Escondê-los faria a faixa mudar de largura a cada    │
 * │ edição — e o botão apareceria no instante exato em que o olho está no   │
 * │ lugar errado.                                                         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O RÓTULO DIZ O QUE VAI SER DESFEITO, E ISSO NÃO É ENFEITE              │
 * │                                                                      │
 * │ "Desfazer" sozinho é uma promessa vaga: ela clica e torce. Com o        │
 * │ rótulo no `title` — "Desfazer: editar Base · B7" —, o gesto é uma       │
 * │ decisão. É a mesma escolha da barra de formatação, que escreve "Célula  │
 * │ C4" em vez de acender um controle sem dizer sobre o quê.               │
 * │                                                                      │
 * │ O rótulo NÃO aparece escrito no botão: a faixa já carrega o nome do     │
 * │ cliente, o da planilha e o da consultoria, e um texto que muda a cada   │
 * │ tecla empurraria os botões ao lado para os lados enquanto ela digita.   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE É O HISTÓRICO DA PLANILHA — NÃO O DO NAVEGADOR                    │
 * │                                                                      │
 * │ `history.back()` devolveria a tela anterior: outra rota, outro          │
 * │ cliente, a grade recarregada. O que ela quer desfazer é a última        │
 * │ coisa que DIGITOU, sem sair de onde está. São duas coisas diferentes    │
 * │ com o mesmo nome, e é por isso que este componente não conhece o        │
 * │ `window.history` — ele chama duas funções que mexem em duas pilhas de   │
 * │ operações, e nada mais.                                               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function BotoesDeHistorico({
  aoDesfazer,
  aoRefazer,
  temDesfazer,
  temRefazer,
  rotuloDesfazer,
  rotuloRefazer,
}: {
  aoDesfazer: () => void;
  aoRefazer: () => void;
  temDesfazer: boolean;
  temRefazer: boolean;
  /** O que o desfazer vai desfazer, em palavras. `null` quando não há nada. */
  rotuloDesfazer: string | null;
  rotuloRefazer: string | null;
}) {
  return (
    <span
      role="group"
      aria-label="Desfazer e refazer na planilha"
      className="flex items-center gap-1"
    >
      <Botao
        variante="linha"
        tamanho="sm"
        onClick={aoDesfazer}
        disabled={!temDesfazer}
        aria-label="Desfazer"
        title={
          rotuloDesfazer === null
            ? "Nada para desfazer"
            : `Desfazer: ${rotuloDesfazer} — Ctrl+Z`
        }
        className="gap-1.5 px-2"
      >
        {/*
          A SETA CURVA E A PALAVRA, juntas: a seta é o que o olho reconhece
          antes de ler, e a palavra é o que não deixa dúvida quando a fonte do
          sistema desenha a seta de um jeito estranho.
        */}
        <span aria-hidden className="text-[0.9375rem] leading-none">
          ↶
        </span>
        <span className="hidden text-[0.625rem] tracking-[0.12em] sm:inline">Desfazer</span>
      </Botao>

      <Botao
        variante="linha"
        tamanho="sm"
        onClick={aoRefazer}
        disabled={!temRefazer}
        aria-label="Refazer"
        title={
          rotuloRefazer === null ? "Nada para refazer" : `Refazer: ${rotuloRefazer} — Ctrl+Y`
        }
        className="gap-1.5 px-2"
      >
        <span aria-hidden className="text-[0.9375rem] leading-none">
          ↷
        </span>
        <span className="hidden text-[0.625rem] tracking-[0.12em] sm:inline">Refazer</span>
      </Botao>
    </span>
  );
}
