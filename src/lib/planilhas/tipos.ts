/**
 * TIPOS DA CENTRAL DE PLANILHAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA PASTA É ISOLADA                                         │
 * │                                                                      │
 * │ Gerar uma planilha é uma operação DIFERENTE de desenhar uma tela.     │
 * │ Ela roda no servidor, produz bytes em vez de HTML, e não tem nada a    │
 * │ ver com React. Misturada em `src/lib/dados/`, ela arrastaria junto    │
 * │ preocupações que não são dela e ficaria impossível de testar sozinha. │
 * │                                                                      │
 * │ `src/lib/planilhas/` é um módulo fechado: recebe um CONTEXTO (dados   │
 * │ já resolvidos), devolve um ARQUIVO. Não conhece repositório, não       │
 * │ conhece tela, não conhece banco. Isso é o que vai permitir trocar o    │
 * │ exceljs por outra biblioteca mexendo em um arquivo só.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA DESTA PASTA: NENHUMA FÓRMULA GASTRONÔMICA                     │
 * │                                                                      │
 * │ Nada aqui calcula CMV, markup, preço de venda, índice de cocção,      │
 * │ fator de correção ou margem. Não é timidez técnica: cada uma dessas    │
 * │ contas depende de uma decisão da consultora — o que entra no custo,    │
 * │ como se trata perda, qual margem é alvo — e nenhuma dessas decisões    │
 * │ foi tomada.                                                           │
 * │                                                                      │
 * │ O que esta pasta faz é ORGANIZAR o que já é fato: nomes, datas,        │
 * │ pesos declarados, valores ditados, contagens. Somar uma coluna de      │
 * │ valores que alguém digitou é aritmética. Dividir um pelo outro para    │
 * │ achar um índice é metodologia, e metodologia não se inventa.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type {
  Acompanhamento,
  ClienteOperacao,
  Consultoria,
  Contrato,
  Ficha,
  Ingrediente,
  LinhaIngredienteDoCliente,
  Tarefa,
} from "@/lib/dados";

/**
 * O ESTADO DE UM MODELO DE PLANILHA.
 *
 * A diferença entre `EM_PREPARACAO` e `AGUARDANDO_DEFINICAO` não é
 * decorativa, e é a mesma separação que o menu faz:
 *
 *   EM_PREPARACAO          dá para construir, e vai ser construído. Falta
 *                          trabalho de programação, não decisão dela.
 *
 *   AGUARDANDO_DEFINICAO   não dá para construir: o número que a planilha
 *                          mostraria depende de uma regra que ninguém
 *                          respondeu ainda. Programar agora produziria uma
 *                          coluna com número inventado.
 */
export type EstadoModelo = "DISPONIVEL" | "EM_PREPARACAO" | "AGUARDANDO_DEFINICAO";

/**
 * OS DADOS QUE UMA PLANILHA PODE RECEBER.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM "CONTEXTO" E NÃO UMA LISTA DE PARÂMETROS            │
 * │                                                                      │
 * │ A tentação seria cada gerador receber o que precisa:                  │
 * │                                                                      │
 * │   gerarRelatorioConsultoria(cliente, consultoria, tarefas, acompanhamentos) │
 * │                                                                      │
 * │ Funciona com quatro argumentos. Com doze vira uma chamada que ninguém │
 * │ consegue ler, e cada modelo novo muda a assinatura dos outros por     │
 * │ tabela. Um contexto único custa um `null` a mais no gerador e mantém  │
 * │ a chamada estável quando o quinto modelo chegar.                      │
 * │                                                                      │
 * │ Tudo é opcional MENOS o cliente: não existe planilha de consultoria    │
 * │ sem cliente. Os outros vêm quando vêm — e cada gerador declara, no     │
 * │ próprio tipo, o que ele exige.                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type ContextoPlanilha = {
  /**
   * O cliente da OPERAÇÃO — não o `Cliente` de `tipos.ts`.
   *
   * Existem dois tipos com este nome no projeto, e eles não são a mesma
   * coisa: o de `tipos.ts` é o esqueleto de quatro campos que o lead aponta
   * ao converter; o da operação tem os dados que uma planilha precisa
   * (porte, modalidade, cidade, situação, o que foi declarado).
   *
   * O `import` usa o nome `ClienteOperacao` porque é assim que o barrel
   * `@/lib/dados` exporta o da operação — o outro já ocupa o nome `Cliente`.
   * Escrever `Cliente` aqui e importar do barrel daria o esqueleto, e o erro
   * só apareceria ao tentar ler `cliente.porte`.
   */
  cliente: ClienteOperacao;
  consultoria?: Consultoria | null;
  contrato?: Contrato | null;
  tarefas?: readonly Tarefa[];
  acompanhamentos?: readonly Acompanhamento[];
  /**
   * As fichas técnicas deste cliente.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ POR QUE ESTE CAMPO FALTAVA, E POR QUE ISSO IMPORTAVA               │
   * │                                                                    │
   * │ `ModeloPlanilha.exige` já listava "fichas" como fonte válida — e   │
   * │ os modelos `ficha-tecnica` e `custos-precificacao` a declaravam.   │
   * │ Só que este tipo não tinha o campo, e `montarContexto` não as      │
   * │ buscava: o nome existia no vocabulário e não existia no mundo.     │
   * │                                                                    │
   * │ É a mesma falta que o comentário de `exige` descreve, invertida:   │
   * │ lá, declarar uma fonte que o contexto não carrega dá um card       │
   * │ que promete e falha ao gerar. Aqui, um campo que o contexto não    │
   * │ preenche dá um gerador que existe e nunca recebe dado.             │
   * │                                                                    │
   * │ Fechar isso agora, ANTES de escrever qualquer gerador de ficha, é  │
   * │ o que impede o formato do arquivo de ser decidido em cima de um     │
   * │ contexto estreito demais — e de a ficha técnica nascer como uma     │
   * │ segunda base, editada em paralelo à tela de fichas.                 │
   * └────────────────────────────────────────────────────────────────────┘
   *
   * O RECORTE É DO MODELO, COMO TODO O RESTO. A lista chega completa — de
   * todos os clientes — e quem filtra é quem escreve a aba, pela mesma razão
   * que `tarefas` e `acompanhamentos` chegam completas: a regra "nenhum dado
   * de outro cliente entra nesta planilha" precisa morar em quem escreve a
   * planilha, e não no carregador, que o terceiro modelo esqueceria.
   */
  fichas?: readonly Ficha[];
  /**
   * A biblioteca de insumos — com preço de referência, unidade e as pesagens.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ POR QUE A FICHA TÉCNICA NÃO SAI SEM ISTO                           │
   * │                                                                    │
   * │ A ficha guarda o `ingredienteId` e a quantidade. Ela NÃO guarda o  │
   * │ nome do insumo, nem a unidade, nem as pesagens — e não deve         │
   * │ guardar: nome de insumo é dado da biblioteca, e duplicá-lo dentro   │
   * │ da ficha faria uma ficha antiga continuar dizendo "batata inglesa"  │
   * │ depois de a biblioteca renomear para "batata asterix".              │
   * │                                                                    │
   * │ A consequência é que sem esta lista o gerador escreveria uma coluna │
   * │ "INGREDIENTE" com o id dentro — `in_mandioca` — e uma coluna de     │
   * │ custo vazia, porque o custo depende do preço, que também mora aqui. │
   * │ Uma ficha técnica sem nome de insumo e sem custo não é uma ficha     │
   * │ técnica; é uma lista de códigos.                                    │
   * └────────────────────────────────────────────────────────────────────┘
   *
   * Como todo o resto do contexto, chega COMPLETA e quem filtra é o modelo.
   */
  ingredientes?: readonly Ingrediente[];
  /**
   * O preço que vale para ESTE cliente, insumo por insumo.
   *
   * `LinhaIngredienteDoCliente` já traz a resolução pronta: o preço do
   * cliente quando ele existe, o da biblioteca quando não. Trazer a lista
   * resolvida em vez das duas cruas evita que cada modelo refaça a escolha —
   * e uma escolha refeita é uma chance de um modelo mostrar o custo de outro
   * cliente sem avisar.
   */
  ingredientesDoCliente?: readonly LinhaIngredienteDoCliente[];
  /**
   * O que a consultora escreveu sobre este cliente, se escreveu.
   *
   * Existe separado de `observacoes` do cliente porque é um texto do
   * DOCUMENTO — escrito para ser lido por quem recebe a planilha — e não
   * uma anotação interna do cadastro.
   */
  observacoes?: string | null;
  /** Quando a planilha foi pedida. Injetado, para o resultado ser determinístico. */
  geradoEm: Date;
};

/**
 * O QUE TODO GERADOR DEVOLVE.
 *
 * `nomeArquivo` já vem SANITIZADO — sem acento, sem espaço, sem barra. Quem
 * monta o nome é o gerador, que conhece os dados; quem faz o download não
 * precisa saber que existe um cliente chamado "Empório Verde" e que acento em
 * nome de arquivo é dor de cabeça em três sistemas operacionais.
 *
 * `nomeArquivo` e `nomeExibido` são diferentes de propósito: o arquivo que
 * chega na pasta de downloads precisa ser seguro, e o nome que aparece na
 * tela precisa ser bonito. Os dois nomes, um dado só.
 */
export type ArquivoGerado = {
  /** Nome seguro para o sistema de arquivos. Sem acento, sem espaço. */
  nomeArquivo: string;
  /** Nome legível, para mostrar na tela antes e depois do download. */
  nomeExibido: string;
  /** O conteúdo binário do .xlsx. */
  conteudo: Buffer;
  /** Quantas abas o arquivo tem. Conferível abrindo o arquivo. */
  abas: string[];
};

/**
 * A DESCRIÇÃO DE UM MODELO — o que a Central de Planilhas mostra nos cards.
 *
 * O estado e a razão andam juntos: um card que diz "Aguardando definição" sem
 * dizer O QUÊ fica com a mesma utilidade de um cadeado sem placa.
 */
export type ModeloPlanilha = {
  id: string;
  nome: string;
  /** O que a planilha é, em uma frase — escrita para ela, não para quem programa. */
  descricao: string;
  estado: EstadoModelo;
  /** Por que não está pronta. Vazio quando está disponível. */
  motivo?: string;
  /** As abas que o arquivo terá. Ajuda a decidir antes de gerar. */
  abas?: readonly string[];
  /**
   * O que a planilha vai precisar para ser gerada.
   *
   * São as FONTES do módulo de planilhas, não as entidades do domínio: a
   * lista é o que `ContextoPlanilha` é capaz de carregar hoje. Escrever
   * "processos" aqui daria um card prometendo algo que o gerador não sabe
   * buscar — e o erro só apareceria quando alguém tentasse gerar.
   *
   * Quando o modelo de pratos por praça for implementado, ele traz o
   * `processos` junto: a lista cresce com o gerador, não antes dele.
   */
  exige: readonly (
    | "consultoria"
    | "contrato"
    | "tarefas"
    | "acompanhamentos"
    | "fichas"
    /**
     * A biblioteca de insumos e o preço por cliente.
     *
     * Entrou nesta lista junto com os dois modelos que a consomem — ficha
     * técnica e custos. Antes dela, os dois declaravam só "fichas" e o
     * contexto não carregava insumo nenhum: a planilha sairia com
     * `in_mandioca` na coluna de nome e vazio na de custo.
     */
    | "ingredientes"
  )[];
  /** Decisões pendentes que travam este modelo, quando houver. */
  pendencias?: readonly string[];
};
