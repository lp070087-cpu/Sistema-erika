/**
 * AS UNIDADES QUE O CADASTRO OFERECE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA LISTA NÃO É A LISTA DO QUE O MOTOR SABE CALCULAR                 │
 * │                                                                      │
 * │ São coisas diferentes, e confundi-las custaria caro:                  │
 * │                                                                      │
 * │   · ESTA lista é o vocabulário de CADASTRO. Ela tem "caixa", "dúzia",  │
 * │     "maço" — porque a consultora compra assim, e um campo que não      │
 * │     aceitasse "maço" a obrigaria a mentir sobre a compra.             │
 * │                                                                      │
 * │   · `UNIDADES_DE_PESO` (em `./custos`) é a lista do que dá para SOMAR  │
 * │     E DIVIDIR com sentido. Ela tem quatro itens, e não tem "caixa":    │
 * │     converter uma caixa em quilo exigiria saber quantos quilos tem a   │
 * │     caixa, e isso é medir, não converter.                              │
 * │                                                                      │
 * │ Por isso a lista mora aqui, num arquivo próprio: enquanto ela era     │
 * │ copiada em três formulários, bastava alguém acrescentar "bandeja" num  │
 * │ deles para os três passarem a oferecer escolhas diferentes para o      │
 * │ mesmo dado.                                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export const UNIDADES_COMUNS = [
  "kg",
  "g",
  "L",
  "ml",
  "un",
  "dúzia",
  "maço",
  "cx",
  "pct",
] as const;

export type UnidadeComum = (typeof UNIDADES_COMUNS)[number];
