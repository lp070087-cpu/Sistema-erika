"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * SALVAR PLANILHA — E A HONESTIDADE SOBRE O QUE "SALVAR" QUER DIZER HOJE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE BOTÃO NÃO DIZ, E POR QUE ELE NÃO DIZ                      │
 * │                                                                      │
 * │ Ele não diz "salvo no banco". Não diz "salvo com sucesso". Não diz     │
 * │ "sua planilha está segura". O banco não está ligado, e um recado        │
 * │ desses seria a mentira mais cara desta rodada: ela organizaria o        │
 * │ trabalho inteiro, fecharia a aba confiando nele, e perderia tudo sem    │
 * │ entender por quê.                                                      │
 * │                                                                      │
 * │ O que ele diz é o que ele fez, com as palavras do que existe: marcou   │
 * │ um ponto nesta sessão. E diz, na mesma frase, o que isso NÃO protege.  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O BOTÃO EXISTE, SE O ESTADO JÁ ESTÁ GUARDADO                 │
 * │                                                                      │
 * │ Já está: o que ela digita entra no estado da tela no instante em que    │
 * │ confirma a célula, e as abas trocam sem perder nada. Então um botão     │
 * │ que "salva" parece não fazer nada — e é um erro tratá-lo por isso.      │
 * │                                                                      │
 * │ Ele existe por três motivos, e nenhum é decorativo:                    │
 * │                                                                      │
 * │  1. É o gesto que ela espera. Um editor sem "salvar" faz duvidar de    │
 * │     que a digitação valeu, e a dúvida a leva a refazer trabalho.        │
 * │  2. Ele MARCA O PONTO. "Salvo às 14h32" é a fronteira entre o que ela   │
 * │     já revisou e o que mudou desde então — e é por isso que ele volta   │
 * │     a ficar pendente assim que qualquer coisa muda.                     │
 * │  3. É o ponto de troca. No dia em que o Neon for ligado, é AQUI que o   │
 * │     `fetch` entra; a tela não muda, e é por isso que ele é um           │
 * │     componente separado em vez de um botão morto no meio do JSX.        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE "PENDENTE" QUER DIZER, E DE ONDE ELE VEM                       │
 * │                                                                      │
 * │ `revisao` é um número que o pai incrementa a cada mudança — digitação,  │
 * │ marcação, aba nova. O botão guarda o número que viu no último clique e  │
 * │ compara. Se a conta bate, está tudo salvo; se não, há coisa nova.        │
 * │                                                                      │
 * │ É um contador, e não um sinalizador `sujo` que o pai liga e desliga:    │
 * │ o sinalizador obrigaria quem muda a lembrar de ligá-lo, e o dia em que  │
 * │ um caminho novo de edição esquecesse seria o dia em que a tela diria    │
 * │ "salvo" com coisa por salvar. O contador não deixa esquecer — quem      │
 * │ muda, incrementa, e é uma linha.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function BotaoSalvar({
  revisao,
  className,
}: {
  /** Sobe a cada mudança no conteúdo. Ver o bloco acima. */
  revisao: number;
  className?: string;
}) {
  const [salvoEm, definirSalvoEm] = useState<Date | null>(null);
  const [revisaoSalva, definirRevisaoSalva] = useState(0);

  const pendente = revisao !== revisaoSalva;

  function salvar() {
    /*
      AQUI É ONDE O `fetch` PARA O BANCO VAI ENTRAR.

      Hoje não há para onde mandar: não existe tabela de planilha, e a rota
      que existe escreve um .xlsx, que é outra coisa. Inventar uma rota que
      responde 200 e não grava nada seria pior que não ter rota — porque o
      dia em que o banco chegasse, ninguém iria procurar o que já "funciona".
    */
    definirRevisaoSalva(revisao);
    definirSalvoEm(new Date());
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-x-2 gap-y-1", className)}>
      <button
        type="button"
        onClick={salvar}
        className={cn(
          "relative inline-flex h-8 items-center justify-center gap-2 overflow-hidden",
          "rounded-[var(--raio-sm)] border border-[var(--linha-forte)] px-3",
          "text-[0.6875rem] font-medium uppercase tracking-[0.13em] text-tinta",
          "transition-colors duration-200 hover:border-tinta hover:bg-tinta hover:text-off"
        )}
        title="Marca um ponto nesta sessão. O armazenamento definitivo entra com o banco de dados."
      >
        Salvar planilha
        {pendente ? (
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-[var(--color-dourado)]"
            title="Há alterações desde o último salvamento"
          />
        ) : null}
      </button>

      {/*
        O RECADO DIZ O QUE ACONTECEU E O QUE ELE NÃO PROTEGE, na mesma frase.

        "Salvo nesta sessão" sozinho passaria por promessa de persistência
        para quem lê rápido. A segunda parte — "vale enquanto a página estiver
        aberta" — é a parte que impede a perda de trabalho.
      */}
      {salvoEm ? (
        <span role="status" className="text-[0.75rem] leading-snug text-[var(--tinta-suave)]">
          {pendente
            ? "Há alterações desde o último salvamento desta sessão."
            : `Salvo nesta sessão às ${horaCurta(salvoEm)} — vale enquanto a página estiver aberta.`}
        </span>
      ) : (
        <span className="text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
          O armazenamento definitivo entra quando o banco de dados for ligado.
        </span>
      )}
    </div>
  );
}

function horaCurta(data: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}
