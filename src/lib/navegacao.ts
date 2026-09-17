/**
 * Estrutura de navegação do sistema.
 *
 * Deriva da Seção 12 do relatório da Fase 0: treze itens de menu
 * organizados em seis grupos, para não virar uma lista solta de links.
 *
 * CAMPO `fase` — de que fase o módulo é.
 * CAMPO `estado` — o que ele é HOJE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `estado` EXISTE SEPARADO DE `fase`                           │
 * │                                                                      │
 * │ A primeira versão deduzia "está pronto" de `fase <= 2`. Errado: a    │
 * │ Fase 2 inclui telas que NÃO foram construídas — /consultorias, por   │
 * │ exemplo, é um ModuloPendente marcado como fase 2 porque a fase dela  │
 * │ é esta. O menu pintava as duas com a mesma cor cheia e sem selo.     │
 * │                                                                      │
 * │ Numa tela de menu não há como ver a diferença. O item parecia pronto │
 * │ e não estava — exatamente o que este arquivo promete não fazer.      │
 * │                                                                      │
 * │ Agora o estado é DECLARADO item a item, e não inferido de um número  │
 * │ de fase. Um módulo novo não pode entrar no menu "pronto por          │
 * │ acidente": quem escrever precisa dizer o que ele é.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * O estado real do item de menu.
 *
 * `no-ar`          a tela está construída e funciona.
 * `parcial`        parte funciona; a rota abre e explica o que falta.
 * `previsto`       só a rota existe, com o escopo do que virá.
 */
export type EstadoItem = "no-ar" | "parcial" | "previsto";

export type ItemNavegacao = {
  chave: string;
  titulo: string;
  href: string;
  fase: number;
  estado: EstadoItem;
  /** Selo curto mostrado quando o item NÃO está no ar. */
  selo?: string;
  /** Decisões pendentes da Seção 17 que bloqueiam este módulo. */
  pendencias?: string[];
};

export type GrupoNavegacao = {
  chave: string;
  titulo: string;
  itens: ItemNavegacao[];
};

export const NAVEGACAO: GrupoNavegacao[] = [
  {
    chave: "visao-geral",
    titulo: "Visão geral",
    itens: [
      {
        chave: "painel",
        titulo: "Dashboard",
        href: "/",
        fase: 2,
        estado: "no-ar",
      },
    ],
  },
  {
    chave: "entrada",
    titulo: "Entrada",
    itens: [
      {
        chave: "leads",
        titulo: "Leads",
        href: "/leads",
        fase: 2,
        estado: "no-ar",
        pendencias: ["11", "15"],
      },
      {
        chave: "diagnosticos",
        titulo: "Diagnósticos",
        href: "/diagnosticos",
        fase: 2,
        estado: "no-ar",
        pendencias: ["11", "12", "13", "15"],
      },
    ],
  },
  {
    chave: "consultoria",
    titulo: "Consultoria",
    itens: [
      {
        chave: "clientes",
        titulo: "Clientes",
        href: "/clientes",
        fase: 2,
        // A tela mostra a carteira inteira, com cadastro demonstrável desde a
        // Fase 2.6. O que trava o módulo de vez é o cadastro CENTRAL, que
        // depende dos pontos 1, 2, 7 e 10. Parcial é o estado honesto.
        estado: "parcial",
        selo: "parcial",
      },
      {
        chave: "consultorias",
        titulo: "Consultorias",
        href: "/consultorias",
        fase: 2,
        // Construída na Fase 2.5: lista, jornada e plano de ação funcionam.
        // O que ainda não fecha é o que depende de metodologia — e isso
        // aparece dentro da tela, não como selo no menu.
        estado: "no-ar",
      },
      {
        chave: "tarefas",
        titulo: "Tarefas",
        href: "/tarefas",
        fase: 6,
        estado: "no-ar",
      },
      {
        chave: "acompanhamentos",
        titulo: "Acompanhamentos",
        href: "/acompanhamentos",
        fase: 7,
        // A lista, os filtros e o registro funcionam. O que falta é a
        // persistência — e ela não é uma pendência de metodologia, é a
        // Fase 3. Por isso "parcial" e não "previsto": a tela faz o que
        // promete, e o que ainda não faz está dito dentro dela.
        estado: "parcial",
        selo: "parcial",
        pendencias: ["9"],
      },
    ],
  },
  {
    chave: "operacao",
    titulo: "Operação",
    itens: [
      {
        chave: "fichas",
        titulo: "Fichas técnicas",
        href: "/fichas",
        fase: 3,
        // O acervo, o rendimento e a composição existem. O custo não —
        // depende de 4, 5, 6 e 19. Parcial é o estado honesto: a tela abre
        // e faz o que faz, mas não é o módulo inteiro.
        estado: "parcial",
        selo: "parcial",
        pendencias: ["4", "5", "6", "19"],
      },
      {
        chave: "ingredientes",
        titulo: "Ingredientes",
        href: "/ingredientes",
        fase: 3,
        // Biblioteca e histórico de preço funcionam. PARCIAL, e não "no-ar",
        // porque o que justifica o módulo — usar o preço para recalcular as
        // fichas — depende do ponto 10 e ainda não acontece.
        estado: "parcial",
        selo: "parcial",
        pendencias: ["2", "3", "10"],
      },
      {
        chave: "processos",
        titulo: "Processos",
        href: "/processos",
        fase: 6,
        estado: "no-ar",
      },
    ],
  },
  {
    chave: "resultado",
    titulo: "Resultados",
    itens: [
      {
        chave: "relatorios",
        titulo: "Relatórios",
        href: "/relatorios",
        fase: 7,
        // Prévia: mostra os documentos que já existem, permite gerar a folha
        // do cliente e marca o bloco de resultado como dependente de
        // metodologia. Não é o módulo pronto.
        estado: "parcial",
        selo: "prévia",
        pendencias: ["8", "17"],
      },
    ],
  },
  {
    chave: "divulgacao",
    titulo: "Divulgação",
    itens: [
      {
        chave: "meu-site",
        titulo: "Meu site",
        href: "/meu-site",
        fase: 2,
        // O endereço do site é real e já está no ar. O que ainda falta é o
        // endereço público do diagnóstico, que depende da publicação do
        // sistema — e a própria tela diz isso.
        estado: "no-ar",
      },
    ],
  },
  {
    chave: "sistema",
    titulo: "Sistema",
    itens: [
      {
        chave: "configuracoes",
        titulo: "Configurações",
        href: "/configuracoes",
        fase: 1,
        estado: "no-ar",
      },
      // Fora do ar por decisão, e não por esquecimento: são módulos que
      // dependem de decisões abertas da consultora. Ficam no menu para o
      // escopo ficar visível — é lá que cada tela explica do que depende.
      {
        chave: "precificacao",
        titulo: "Precificação e CMV",
        href: "/precificacao",
        fase: 4,
        estado: "previsto",
        selo: "f4",
        pendencias: ["7", "19"],
      },
      {
        chave: "cardapios",
        titulo: "Cardápios",
        href: "/cardapios",
        fase: 5,
        estado: "previsto",
        selo: "f5",
      },
      { chave: "equipe", titulo: "Equipe", href: "/equipe", fase: 6, estado: "previsto", selo: "f6" },
      { chave: "biblioteca", titulo: "Biblioteca", href: "/biblioteca", fase: 9, estado: "previsto", selo: "f9" },
    ],
  },
];

/** Todos os itens, achatados — usado para casar a rota atual com o item ativo. */
export const ITENS_NAVEGACAO: ItemNavegacao[] = NAVEGACAO.flatMap((g) => g.itens);
