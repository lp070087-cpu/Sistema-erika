/**
 * Formatação e vocabulário das telas de entrada.
 *
 * Separado do resto porque estas funções são PURAS e vivem tanto no
 * servidor quanto no cliente — o formulário público precisa delas para
 * montar a mensagem de erro, e a fila de leads para montar a etiqueta.
 */

import type { LeadStatus, OrigemLead, ValorResposta } from "./tipos";
import type { Sinal } from "./perguntas";

// ---------------------------------------------------------------------------
// Datas e horas
// ---------------------------------------------------------------------------

const FORMATO_DATA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const FORMATO_DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function dataCurta(d: Date): string {
  return FORMATO_DATA.format(d);
}

export function dataEHora(d: Date): string {
  return FORMATO_DATA_HORA.format(d);
}

/**
 * Distância em palavras. É o que a consultora realmente quer ver na fila
 * ("chegou há 2 dias"), não o carimbo de data — mas o carimbo aparece no
 * detalhe, porque é ele que serve de prova.
 */
export function desdeQuando(d: Date, agora: Date = new Date()): string {
  const ms = agora.getTime() - d.getTime();
  const minutos = Math.floor(ms / 60000);

  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return `há ${minutos} min`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? "há 1 hora" : `há ${horas} horas`;

  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;

  const meses = Math.floor(dias / 30);
  return meses === 1 ? "há 1 mês" : `há ${meses} meses`;
}

// ---------------------------------------------------------------------------
// Vocabulário de status
// ---------------------------------------------------------------------------
// Os rótulos são os mesmos que a fila de leads já anunciava. O tom visual
// acompanha a temperatura do lead — mas nenhum tom aqui é um julgamento
// sobre a pessoa: é sobre onde ele está na fila.

export const ROTULO_STATUS: Record<LeadStatus, string> = {
  NOVO: "Novo",
  EM_ANALISE: "Em análise",
  CONTATADO: "Contatado",
  QUENTE: "Quente",
  MORNO: "Morno",
  FRIO: "Frio",
  CONVERTIDO: "Convertido",
  ARQUIVADO: "Arquivado",
};

export type TomStatus = "neutro" | "oliva" | "dourado" | "critico" | "verde";

export const TOM_STATUS: Record<LeadStatus, TomStatus> = {
  NOVO: "oliva",
  EM_ANALISE: "dourado",
  CONTATADO: "neutro",
  QUENTE: "verde",
  MORNO: "neutro",
  FRIO: "neutro",
  CONVERTIDO: "verde",
  ARQUIVADO: "neutro",
};

/** A ordem em que os status aparecem na fila e no filtro. */
export const ORDEM_STATUS: readonly LeadStatus[] = [
  "NOVO",
  "EM_ANALISE",
  "CONTATADO",
  "QUENTE",
  "MORNO",
  "FRIO",
  "CONVERTIDO",
  "ARQUIVADO",
];

/** Status que ainda pedem algum movimento da consultora. */
export const STATUS_ABERTOS: readonly LeadStatus[] = [
  "NOVO",
  "EM_ANALISE",
  "CONTATADO",
  "QUENTE",
  "MORNO",
  "FRIO",
];

export const ROTULO_ORIGEM: Record<OrigemLead, string> = {
  DIAGNOSTICO_PUBLICO: "Diagnóstico pelo site",
  WHATSAPP: "WhatsApp",
  INDICACAO: "Indicação",
  INSTAGRAM: "Instagram",
  MANUAL: "Cadastro manual",
};

/**
 * A ORIGEM DO LEAD, EXPLICADA — para a tela não precisar deduzir.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM MAPA, E NÃO UM `if` DENTRO DA TELA                  │
 * │                                                                      │
 * │ A diferença que importa para a consultora não é o nome do canal: é    │
 * │ se aquele lead chegou SOZINHO ou se alguém o cadastrou. Quem responde │
 * │ ao diagnóstico pelo site entra sem ela tocar em nada; um contato do   │
 * │ WhatsApp ou uma indicação dependem de ela registrar.                  │
 * │                                                                      │
 * │ Escrever essa distinção em cada tela que mostra origem (lista de      │
 * │ leads, detalhe do lead, cliente) garantiria que uma delas divergisse  │
 * │ na primeira revisão. Aqui é uma frase só, num lugar só.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const DETALHE_ORIGEM: Record<
  OrigemLead,
  { automatica: boolean; como: string }
> = {
  DIAGNOSTICO_PUBLICO: {
    automatica: true,
    como: "O formulário do site foi respondido e o lead entrou sozinho na fila.",
  },
  WHATSAPP: {
    automatica: false,
    como: "A conversa começou pelo WhatsApp e o contato foi cadastrado à mão.",
  },
  INDICACAO: {
    automatica: false,
    como: "Alguém indicou o trabalho dela, e o contato foi cadastrado à mão.",
  },
  INSTAGRAM: {
    automatica: false,
    como: "A pessoa chegou pelo Instagram, e o contato foi cadastrado à mão.",
  },
  MANUAL: {
    automatica: false,
    como: "O contato foi cadastrado diretamente no sistema, sem canal de origem.",
  },
};

// ---------------------------------------------------------------------------
// Respostas
// ---------------------------------------------------------------------------

/** O que exibir para uma resposta, em uma linha. */
export function respostaEmTexto(valor: ValorResposta, rotulo?: string): string {
  switch (valor.tipo) {
    case "texto":
      return valor.valor.trim() || "—";
    case "multipla":
      return valor.valores.length > 0 ? valor.valores.join(", ") : "—";
    case "selecao":
      return rotulo ?? valor.valor;
    case "vazio":
      return "—";
  }
}

/**
 * Uma resposta vazia é ausência de dado, não um zero nem uma negativa.
 * A distinção importa: "não respondeu" e "respondeu que não" são coisas
 * diferentes quando a consultora lê a ficha.
 */
export function respostaVazia(valor: ValorResposta): boolean {
  if (valor.tipo === "vazio") return true;
  if (valor.tipo === "texto") return valor.valor.trim().length === 0;
  if (valor.tipo === "multipla") return valor.valores.length === 0;
  return false;
}

/** Rótulo legível de um sinal — repassa para o mapa em perguntas.ts. */
export type { Sinal };
