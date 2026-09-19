"use client";

import { useSyncExternalStore } from "react";
import {
  assinarDemonstracao,
  versaoDaDemonstracao,
} from "@/lib/dados/demonstracao";

/**
 * A PONTE ENTRE O ESTADO DEMONSTRATIVO E O REACT.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM ARQUIVO SEPARADO                                    │
 * │                                                                      │
 * │ `src/lib/dados/demonstracao.ts` é camada de DADOS: tipos, estado e as  │
 * │ operações. Ela não conhece React e não importa `react` — é um módulo   │
 * │ de TypeScript comum.                                                  │
 * │                                                                      │
 * │ Aqui fica a única coisa que sabe que existe uma tela: o gancho. Quem   │
 * │ precisar ler o estado num componente de cliente importa daqui; quem    │
 * │ precisar escrever chama o store direto. As duas metades têm nomes      │
 * │ diferentes e moram em lugares diferentes, então ninguém confunde uma   │
 * │ com a outra ao ler um `import`.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `useSyncExternalStore`, E NÃO `useState` + `useEffect`        │
 * │                                                                      │
 * │ `useState` guardaria uma CÓPIA do preço dentro do componente. Duas     │
 * │ telas abertas teriam duas cópias, e a que não fosse atualizada          │
 * │ mostraria o preço velho sem nada explicando a diferença.               │
 * │                                                                      │
 * │ `useEffect` sozinho tem um defeito pior: ele roda DEPOIS da primeira   │
 * │ pintura. A tela apareceria com o preço do cenário por um instante e    │
 * │ só então trocaria — numa tela de preço, isso é o mais confuso que      │
 * │ poderia acontecer. O `useSyncExternalStore` lê o valor certo já na     │
 * │ primeira pintura.                                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE GANCHO DEVOLVE, E POR QUE NÃO DEVOLVE O ESTADO             │
 * │                                                                      │
 * │ Ele devolve um NÚMERO — a versão do store. Não devolve os preços.      │
 * │                                                                      │
 * │ Devolver o objeto obrigaria o React a comparar dois objetos a cada     │
 * │ renderização, e a comparação seria por identidade: qualquer escrita    │
 * │ criaria um objeto novo e faria TODA tela usando o gancho re-renderizar │
 * │ — inclusive as que não têm nada a ver com o que mudou.                 │
 * │                                                                      │
 * │ Com a versão, o componente lê o que precisa do store depois de saber   │
 * │ que algo mudou, e continua lendo direto do repositório para tudo o     │
 * │ que não foi tocado nesta sessão.                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function useDemonstracao(): number {
  return useSyncExternalStore(
    assinarDemonstracao,
    versaoDaDemonstracao,
    versaoInicial
  );
}

/*
  As funções passadas ao gancho são declaradas no escopo do módulo, e não
  como seta dentro do corpo dele.

  `useSyncExternalStore` guarda a referência de `assinar` para saber o que
  cancelar. Uma seta nova a cada renderização seria uma assinatura nova a
  cada renderização: o React cancelaria e reassinaria sem parar, e o custo
  disso aparece como o app inteiro repintando sem que nada tenha mudado.
*/

/** No servidor não há digitação: a versão é sempre a do cenário. */
function versaoInicial(): number {
  return 0;
}
