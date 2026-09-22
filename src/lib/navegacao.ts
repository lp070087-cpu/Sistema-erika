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
 * │ Os quatro módulos que ainda não abriam ficaram num grupo no fim,       │
 * │ "Em preparo". Antes eles dividiam espaço com Configurações, o que     │
 * │ fazia uma tela de sistema parecer irmã de Precificação — e fazia o    │
 * │ menu parecer maior do que o produto é. Continuavam visíveis, porque   │
 * │ esconder o escopo seria pior: ela precisa saber o que vem.            │
 * │                                                                      │
 * │ ── E ESSE GRUPO FOI DESFEITO QUANDO AS TELAS NASCERAM ──────────────── │
 * │                                                                      │
 * │ "Em preparo" era um grupo de PROMESSA, e por isso ele tinha prazo de   │
 * │ validade: no dia em que as telas existissem, manter uma delas lá      │
 * │ dentro seria o menu dizendo "disponível em breve" sobre uma tela que   │
 * │ responde.                                                            │
 * │                                                                      │
 * │ As quatro saíram, e não todas para o mesmo lugar — o grupo de destino  │
 * │ de cada uma é decidido pelo TRABALHO que ela faz, não pela fase:       │
 * │                                                                      │
 * │ · Precificação, Cardápios e Equipe → Operação. É o caminho do dado na  │
 * │   cozinha, e a ordem delas ali é essa: insumo → ficha → custo →        │
 * │   preço anunciado, com a equipe executando o que está na ficha.        │
 * │                                                                      │
 * │ · Biblioteca → Sistema, ao lado de Configurações. Ela é o acervo de    │
 * │   material de APOIO — guia, checklist, procedimento —, e não entra em  │
 * │   nenhuma conta. A biblioteca que entra em conta é a de insumos, e     │
 * │   essa já tem tela: Ingredientes, em Operação.                         │
 * │                                                                      │
 * │ O grupo ficou vazio e foi removido. Um grupo vazio no menu é uma       │
 * │ promessa de que algo vem, e não vem.                                   │
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
      /*
        ── A CADEIA TÉCNICA FECHA AQUI, E A ORDEM DO GRUPO É A DELA ────────
        Precificação, Cardápios e Equipe estavam em "Em preparo" com
        `estado: "previsto"` e o aviso "Disponível em breve". As três telas já
        existem e fazem o que prometem — o menu é que não sabia.

        A ordem abaixo não é a ordem em que foram programadas: é o caminho do
        dado. O insumo entra pela ficha (Ingredientes → Fichas, logo acima),
        a ficha vira custo (Precificação), o custo vira preço anunciado
        (Cardápios), e a Equipe é quem executa o que está nas fichas. Ler o
        grupo de cima para baixo é ler como o número nasce.

        │ POR QUE "parcial" NAS TRÊS, E NÃO "no-ar" │

        Nenhuma das três é um módulo inteiro, e chamá-las de prontas seria o
        mesmo erro que este arquivo foi escrito para não cometer — a primeira
        versão deduzia "está pronto" de `fase <= 2` e o menu pintava de cheio
        telas que não existiam.

        O que falta nas três é A MESMA COISA: persistência. Elas calculam,
        montam e leem de verdade sobre o cenário, e o que foi criado na sessão
        vive em memória (`demonstracao.ts`). Não é pendência de metodologia —
        é a Fase 3, e por isso o aviso nomeia o registro, e não uma definição.

        O aviso é escrito para ela, como a regra deste arquivo pede: "Registro
        em preparação" diz o que falta sem exigir que ela saiba o que é
        sessionStorage.
      */
      {
        chave: "precificacao",
        titulo: "Precificação e CMV",
        href: "/precificacao",
        fase: 4,
        // O custo fecha, e CMV, markup e o preço que um alvo exige são contas
        // sobre números declarados. O que NÃO existe continua nomeado DENTRO
        // da tela: não há CMV alvo por cliente, margem padrão da casa nem
        // regra de arredondamento — nenhuma das três foi inventada.
        estado: "parcial",
        aviso: "Registro em preparação",
      },
      {
        chave: "cardapios",
        titulo: "Cardápios",
        href: "/cardapios",
        fase: 5,
        // Monta de verdade — seção, ordem e nome de anúncio — referenciando
        // fichas que já existem. O cardápio não guarda preço próprio: ele
        // PUBLICA o preço que mora na ficha. O custo do período continua fora,
        // porque depende do volume vendido, e o sistema não presume quanto
        // cada prato vende.
        estado: "parcial",
        aviso: "Registro em preparação",
      },
      {
        chave: "equipe",
        titulo: "Equipe",
        href: "/equipe",
        fase: 6,
        // Quem executa: nome, função, turno, o que executa e o que já foi
        // treinada a fazer. Lê os responsáveis escritos nos processos SEM
        // reescrevê-los — "A definir com o Marcelo" continua como ela
        // escreveu. NÃO é RH: sem salário, folha, férias, benefício ou ponto.
        estado: "parcial",
        aviso: "Registro em preparação",
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
      /*
        ── BIBLIOTECA FICA AQUI, E NÃO NA OPERAÇÃO ──────────────────────────
        Ela quer dizer duas coisas diferentes, e a diferença é o que decide o
        grupo.

        Se "Biblioteca" fosse a biblioteca de INSUMOS — preço, fornecedor,
        histórico —, ela seria Operação: é matéria-prima do custo, e o preço
        dela entra na ficha. Essa biblioteca JÁ EXISTE, e é a tela de
        Ingredientes, que está no grupo Operação logo acima. Criar outra
        chamada "Biblioteca" ao lado seria a segunda tela para o mesmo dado.

        Esta é outra coisa: o material de APOIO da consultoria — o guia, o
        checklist, o procedimento, a referência. Não entra em cálculo nenhum.
        É o acervo de trabalho dela, e por isso fica junto de Configurações,
        no grupo das telas do sistema.

        A própria página declara `rotulo="Sistema"`, e o menu passa a
        concordar com ela. Antes desta rodada os dois discordavam: a tela
        dizia "Sistema" e o menu a listava em "Em preparo".

        │ POR QUE "parcial" │

        Registrar, editar, ligar a um insumo/ficha/processo e excluir
        funcionam sobre a sessão. O que falta é o mesmo dos outros três —
        persistência — e, por ser o único módulo cujo CONTEÚDO é escrito por
        ela, é o que mais depende disso.

        Um detalhe que a tela diz e o menu não pode deixar implícito: o
        sistema NÃO guarda o material. Ele guarda o REGISTRO e o ENDEREÇO.
        Não há upload, nem anexo, nem campo de arquivo em lugar nenhum — ver
        `src/lib/dados/biblioteca.ts`, onde a ausência está documentada como
        decisão, e não como falta.
      */
      {
        chave: "biblioteca",
        titulo: "Biblioteca",
        href: "/biblioteca",
        fase: 9,
        estado: "parcial",
        aviso: "Registro em preparação",
      },
    ],
  },
  /*
    ── O GRUPO "EM PREPARO" DEIXOU DE EXISTIR, E ISSO É O RESULTADO ─────────

    Ele foi criado para segurar os quatro módulos que ainda não abriam —
    "quem ainda não abre fica aqui, visível, em vez de escondido". A ideia
    era boa e o grupo era o lugar certo enquanto as telas não existiam.

    As quatro passaram a existir nesta fase, e todas as quatro telas JÁ
    diziam isso quando eram abertas pela rota direta: cada uma declara no
    próprio cabeçalho que tirou o `ModuloPendente` porque o que ele listava
    como bloqueio já estava resolvido. O menu é que continuava anunciando
    "Disponível em breve" para telas que respondiam.

    Então o grupo não foi substituído por outro: ele ficou VAZIO, e um grupo
    vazio no menu é uma promessa de que algo vem. As quatro foram para os
    grupos a que pertencem pelo trabalho que fazem — três para Operação, que
    é o caminho do dado na cozinha, e a Biblioteca para o lado de
    Configurações, porque ela não entra em cálculo nenhum.

    │ O QUE ISSO NÃO QUER DIZER │

    Não quer dizer que os quatro estejam prontos. Nenhum está — o estado
    deles é "parcial", e é a persistência que falta nos quatro. O que mudou
    é onde essa informação mora: antes ela era uma frase no menu dizendo que
    a tela não abria; agora ela é a tela abrindo e nomeando dentro de si o
    que ainda não tem. A segunda é mais honesta e é mais útil, porque a
    pendência aparece onde ela trabalha, e não num item de menu que ela não
    abriria justamente por causa do aviso.
  */
];

/** Todos os itens, achatados — usado para casar a rota atual com o item ativo. */
export const ITENS_NAVEGACAO: ItemNavegacao[] = NAVEGACAO.flatMap((g) => g.itens);
