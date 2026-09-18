/**
 * Estrutura de navegação do sistema.
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
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ORDEM DOS GRUPOS, E POR QUE ELA MUDOU                              │
 * │                                                                      │
 * │ A sequência segue o CAMINHO DO TRABALHO, não a ordem em que os        │
 * │ módulos foram programados: quem chega vira lead, o lead vira          │
 * │ diagnóstico, o diagnóstico vira cliente, o cliente vira consultoria,  │
 * │ a consultoria gera operação, a operação gera documento, o documento   │
 * │ vira resultado. Ler o menu de cima para baixo é ler o processo.       │
 * │                                                                      │
 * │ Duas mudanças concretas nessa arrumação:                             │
 * │                                                                      │
 * │ · CONTRATOS saiu de "Consultoria" e foi para "Documentos", ao lado    │
 * │   de Planilhas. Contrato é o combinado que vira papel — e quem        │
 * │   procura o contrato de um cliente procura junto com os documentos    │
 * │   dele, não junto com a lista de clientes.                            │
 * │                                                                      │
 * │ · RELATÓRIOS ganhou grupo próprio, "Resultados". Ele estava em        │
 * │   "Documentos" por acidente de implementação; resultado é o que a     │
 * │   consultoria produziu, e é outra pergunta.                           │
 * │                                                                      │
 * │ Os quatro módulos que ainda não abrem ficaram num grupo no fim,       │
 * │ "Em preparo". Antes eles dividiam espaço com Configurações, o que     │
 * │ fazia uma tela de sistema parecer irmã de Precificação — e fazia o    │
 * │ menu parecer maior do que o produto é. Continuam visíveis, porque     │
 * │ esconder o escopo seria pior: ela precisa saber o que vem.            │
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
  /**
   * O aviso mostrado ao lado do item, quando ele não está completo.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ POR QUE ISTO NÃO É MAIS UM "SELO DE FASE"                          │
   * │                                                                    │
   * │ Antes este campo guardava `f4`, `f5`, `parcial`, `prévia` — códigos │
   * │ úteis para quem constrói e ruído para quem usa. A Érika não tem    │
   * │ como saber que "f4" quer dizer Precificação, e um menu cheio de     │
   * │ siglas faz um sistema em construção avançada parecer um rascunho.   │
   * │                                                                    │
   * │ Agora o campo é uma FRASE, escrita para ela: "Em preparação",       │
   * │ "Disponível em breve", "Aguardando definição". Diz a mesma coisa    │
   * │ que o código dizia, sem exigir tradução.                            │
   * │                                                                    │
   * │ O campo `fase` continua no tipo — ele organiza o trabalho e a       │
   * │ documentação — mas a TELA não o mostra mais. Documento interno e    │
   * │ interface de cliente são duas linguagens, e misturá-las foi o erro. │
   * └────────────────────────────────────────────────────────────────────┘
   */
  aviso?: string;
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
        aviso: "Cadastro em preparação",
      },
      {
        chave: "consultorias",
        titulo: "Consultorias",
        href: "/consultorias",
        fase: 2,
        // Construída na Fase 2.5: lista, jornada e plano de ação funcionam.
        // O que ainda não fecha é o que depende de metodologia — e isso
        // aparece dentro da tela, não como aviso no menu.
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
        aviso: "Registro em preparação",
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
        aviso: "Custo aguardando definição",
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
        aviso: "Recálculo em preparação",
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
    chave: "documentos",
    titulo: "Documentos",
    itens: [
      {
        chave: "contratos",
        titulo: "Contratos",
        href: "/contratos",
        fase: 8,
        // Lista, filtros, detalhe, cronograma de N parcelas, documento e
        // histórico funcionam sobre os dados de demonstração. O que não
        // existe é a assinatura jurídica e a cobrança — a tela diz isso.
        estado: "parcial",
        aviso: "Aceite em preparação",
      },
      {
        chave: "planilhas",
        titulo: "Planilhas",
        href: "/planilhas",
        fase: 8,
        // A central existe e a geração de .xlsx é REAL — o arquivo sai de
        // verdade. O que ainda não sai é a planilha que depende de regra
        // gastronômica (custo, CMV, precificação): essas aparecem listadas
        // como "aguardando definição", e a tela explica por quê.
        estado: "parcial",
        aviso: "Um modelo disponível",
        pendencias: ["4", "5", "6", "7", "19"],
      },
    ],
  },
  {
    chave: "resultados",
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
        aviso: "Bloco de resultado aguardando definição",
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
    ],
  },
  {
    chave: "em-preparo",
    titulo: "Em preparo",
    itens: [
      /*
        Os três módulos que ainda não abrem ficam aqui, separados de
        Configurações e agrupados com um título que diz o que eles são.

        Continuam VISÍVEIS de propósito: esconder o que ainda não existe
        faria o menu parecer um sistema fechado, e ela precisa saber o que
        vem. O que mudou é que agora eles se apresentam como um conjunto —
        "isto ainda está sendo preparado" — em vez de parecerem itens
        quebrados espalhados entre os que funcionam.

        O aviso é escrito para ela, não para quem programa: "Disponível em
        breve" no lugar de "f4". O campo `fase` continua no dado, porque
        organiza o trabalho — mas quem lê o menu não precisa dele.
      */
      {
        chave: "precificacao",
        titulo: "Precificação e CMV",
        href: "/precificacao",
        fase: 4,
        estado: "previsto",
        aviso: "Aguardando definição",
        pendencias: ["7", "19"],
      },
      {
        chave: "cardapios",
        titulo: "Cardápios",
        href: "/cardapios",
        fase: 5,
        estado: "previsto",
        aviso: "Disponível em breve",
      },
      {
        chave: "equipe",
        titulo: "Equipe",
        href: "/equipe",
        fase: 6,
        estado: "previsto",
        aviso: "Disponível em breve",
      },
      {
        chave: "biblioteca",
        titulo: "Biblioteca",
        href: "/biblioteca",
        fase: 9,
        estado: "previsto",
        aviso: "Disponível em breve",
      },
    ],
  },
];

/** Todos os itens, achatados — usado para casar a rota atual com o item ativo. */
export const ITENS_NAVEGACAO: ItemNavegacao[] = NAVEGACAO.flatMap((g) => g.itens);
