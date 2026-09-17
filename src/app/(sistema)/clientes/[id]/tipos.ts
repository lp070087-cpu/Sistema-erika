import type { Aba } from "@/components/ui/abas";

/**
 * AS OITO ABAS DO CLIENTE.
 *
 * A ordem é a ordem em que a história do cliente acontece, não a ordem de
 * importância: ele respondeu um diagnóstico (1), a consultoria começou (2),
 * o plano saiu, as fichas nasceram, os processos foram mapeados, os
 * acompanhamentos aconteceram, os documentos foram entregues — e tudo isso
 * está no histórico (8).
 *
 * Quem abre a tela quer saber "como está agora", por isso VISÃO GERAL é a
 * primeira e é a que abre por padrão. Mas as abas seguintes não estão
 * ordenadas por frequência de uso: estão ordenadas pela narrativa, para que
 * a régua de abas seja legível como um método.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO EXISTE                                          │
 * │                                                                      │
 * │ A página precisa da lista para montar a régua e precisa do tipo para  │
 * │ validar o `?aba=` da URL. Se a lista morasse dentro da página, os      │
 * │ oito arquivos de aba importariam da página que os importa — um ciclo. │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export type AbaChave =
  | "visao-geral"
  | "diagnostico"
  | "consultoria"
  | "fichas"
  | "processos"
  | "acompanhamentos"
  | "documentos"
  | "historico";

export const ABA_ORDEM: readonly AbaChave[] = [
  "visao-geral",
  "diagnostico",
  "consultoria",
  "fichas",
  "processos",
  "acompanhamentos",
  "documentos",
  "historico",
];

export const ABAS: readonly Aba[] = [
  { chave: "visao-geral", titulo: "Visão geral" },
  { chave: "diagnostico", titulo: "Diagnóstico" },
  { chave: "consultoria", titulo: "Consultoria" },
  { chave: "fichas", titulo: "Fichas técnicas" },
  { chave: "processos", titulo: "Processos" },
  { chave: "acompanhamentos", titulo: "Acompanhamentos" },
  { chave: "documentos", titulo: "Documentos" },
  { chave: "historico", titulo: "Histórico" },
];
