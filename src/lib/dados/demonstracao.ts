/**
 * O ESTADO DEMONSTRATIVO — o que a consultora digita e o banco ainda não guarda.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE, E POR QUE NÃO É UM useState EM CADA TELA        │
 * │                                                                      │
 * │ O banco ainda não está conectado. Sem alguma memória, "editar o       │
 * │ preço" não faria nada visível — e um botão que não muda nada na tela   │
 * │ é pior do que um botão ausente, porque ensina que o sistema não        │
 * │ responde.                                                             │
 * │                                                                      │
 * │ A saída fácil seria um `useState` em cada componente. Ela quebra de   │
 * │ três jeitos ao mesmo tempo:                                               │
 * │                                                                      │
 * │   1. DUAS TELAS DISCORDAM. A biblioteca guarda o preço num estado e a  │
 * │      ficha noutro. A consultora atualiza na biblioteca, abre a ficha   │
 * │      e vê o preço velho — sem nada explicando a diferença.            │
 * │                                                                      │
 * │   2. O ESTADO NÃO SOBREVIVE À NAVEGAÇÃO. Sair da tela apaga o que foi  │
 * │      digitado, e o trabalho de preencher volta do zero.                │
 * │                                                                      │
 * │   3. QUANDO O BANCO CHEGAR, HÁ DEZ LUGARES PARA DESFAZER. Aqui há um   │
 * │      só: este arquivo passa a conversar com o Prisma, e as telas não   │
 * │      mudam uma linha.                                                 │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐  │
 * │ │ O QUE ELE NÃO É                                                 │  │
 * │ │                                                                  │  │
 * │ │ Não é persistência. Nada aqui vai para disco, e nada aqui        │  │
 * │ │ sobrevive a um recarregamento — o que é exatamente o             │  │
 * │ │ comportamento que a tela precisa declarar em voz alta (§16).     │  │
 * │ │                                                                  │  │
 * │ │ Não é um segundo repositório. Ele não lê nem lista nada: ele     │  │
 * │ │ guarda SÓ o que foi mexido nesta sessão. Quem lê o resto         │  │
 * │ │ continua sendo `obterRepositorioOperacao()`.                     │  │
 * │ │                                                                  │  │
 * │ │ Não roda no servidor. Toda escrita acontece em manipulador de    │  │
 * │ │ evento, no navegador. O módulo do cliente é uma instância        │  │
 * │ │ separada da do servidor — o que uma pessoa digita não vaza para  │  │
 * │ │ a requisição de outra.                                          │  │
 * │ └──────────────────────────────────────────────────────────────────┘  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A CHAVE DE TUDO: O PREÇO NOVO NÃO APAGA O ANTIGO                     │
 * │                                                                      │
 * │ `registrarPreco` EMPURRA o preço que estava vigente para o histórico  │
 * │ antes de gravar o novo. É a diferença entre um histórico de preços e  │
 * │ uma planilha de preços: sem isso, mudar o preço destruiria o único    │
 * │ registro que permite ver a alta depois.                              │
 * │                                                                      │
 * │ E o preço do cliente entra no histórico DO CLIENTE. Um preço de       │
 * │ cliente que caísse no histórico da biblioteca contaminaria o insumo   │
 * │ para todos os outros clientes — o erro mais caro que este módulo      │
 * │ poderia cometer.                                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */

"use client";

import type {
  Cliente,
  Compra,
  EventoHistorico,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
  ItemFicha,
  PrecoIngrediente,
  Transformacao,
} from "./tipos-operacao";
import type {
  Cardapio,
  CategoriaDoCardapio,
  ItemDeCardapio,
  SituacaoCardapio,
} from "./cardapios";
/*
  A equipe entra por TIPO, como o cardápio: o store guarda a forma da pessoa,
  e quem sabe as regras — casar nome, conferir treinamento, ordenar — é
  `./equipe`. Assim as duas metades continuam sendo uma só em cada lugar.

  `chaveDoTreinamento` é a exceção, e é de valor de propósito: "este par é o
  mesmo par?" é uma REGRA, e o store precisava dela para não registrar duas
  vezes o mesmo treinamento. Ele tinha uma cópia própria da regra, que
  divergia da usada na conferência — ver o comentário dela em `./equipe`. A
  cópia importada não é o store sabendo mais: é o store perguntando em vez de
  responder de memória.
*/
import { chaveDoTreinamento, type Pessoa, type Treinamento } from "./equipe";
/*
  A biblioteca entra por TIPO, como a equipe e o cardápio. E aqui a forma é o
  que importa mais do que em qualquer outro módulo: `Material` NÃO TEM campo de
  arquivo, e é o tipo que garante isso. Ver o cabeçalho de `./biblioteca`.
*/
import type { Material } from "./biblioteca";
import type { ParametrosComerciais } from "./indicadores-comerciais";

// ---------------------------------------------------------------------------
// O estado
// ---------------------------------------------------------------------------

type EstadoPreco = {
  atual: PrecoIngrediente;
  historico: PrecoIngrediente[];
};

/**
 * O CABEÇALHO DE UMA FICHA — o que se edita sem mexer na composição.
 *
 * São os campos que a consultora ajusta na visita seguinte: o rendimento que
 * mudou porque a porção foi reajustada, o peso da porção que ela finalmente
 * pesou. Separado dos itens porque editar rendimento e editar ingrediente são
 * duas operações diferentes, com consequências diferentes — a primeira muda o
 * custo POR PORÇÃO, a segunda muda o custo TOTAL.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `atualizadaEm` E `historico` TAMBÉM ESTÃO AQUI              │
 * │                                                                    │
 * │ Porque uma alteração sem data e sem registro não é verificável.     │
 * │ Numa tela onde nada vai para o disco, o único sinal de que o botão  │
 * │ funcionou é a linha de histórico que ele deixou — e essa linha       │
 * │ precisa mudar junto com o dado, pela mesma gravação.                │
 * │                                                                    │
 * │ Deixar a tela manter isso num `useState` próprio faria o fato de ter │
 * │ mexido sobreviver a um recarregamento enquanto o valor mexido não    │
 * │ sobrevivia — que é a pior combinação possível: o sistema afirmaria   │
 * │ ter guardado uma alteração que ele perdeu.                          │
 * └────────────────────────────────────────────────────────────────────┘
 */
export type CabecalhoDeFicha = {
  nome?: string;
  categoria?: string;
  /*
    O CLIENTE DA FICHA É EDITÁVEL, E ISSO MERECE UMA NOTA.

    Não é o mesmo tipo de campo que o nome: trocá-lo não muda um texto, muda
    DE ONDE VÊM OS PREÇOS. O mesmo insumo pode ter preço próprio por cliente,
    então a troca recalcula o custo total sem que nenhum ingrediente tenha
    saído da ficha.

    Ele entra aqui porque a situação é real — ficha cadastrada sob o cliente
    errado — e a alternativa seria refazer a ficha inteira, com os ingredientes
    e os pesos todos por cima. O que a tela faz é avisar antes de salvar.
  */
  clienteId?: string;
  rendimentoPorcoes?: number | null;
  porcaoGramas?: number | null;
  observacoes?: string;
  modoPreparo?: string[];
  finalizacao?: string[];
  atualizadaEm?: Date;
  historico?: Ficha["historico"];
  /*
    OS DOIS CAMPOS COMERCIAIS.

    `precoVenda` é FATO DECLARADO: alguém decidiu vender aquele prato por
    aquele preço, e o sistema só registra. `parametros` é DECISÃO DE
    MÉTODO, e por isso o tipo dele é o mesmo objeto parametrizável da
    camada comercial — sem valor de partida, sem campo obrigatório.

    Os dois moram no cabeçalho porque são propriedades da FICHA, e não do
    ingrediente: o mesmo insumo entra em um prato vendido por R$ 12 e em
    outro vendido por R$ 40, e a margem de segurança de uma casa pode ser
    diferente da de outra.
  */
  precoVenda?: number | null;
  parametros?: ParametrosComerciais;
};

/**
 * O estado vive em variáveis de módulo, e não num objeto exportado mutável.
 *
 * Exportar o objeto deixaria qualquer arquivo escrever nele por fora — e o
 * dia em que alguém fizesse isso, ninguém saberia procurar. Aqui só as
 * funções abaixo mexem, e todas notificam quem estiver ouvindo.
 */
let precosDaBiblioteca = new Map<string, EstadoPreco>();
let precosDeCliente = new Map<string, EstadoPreco>();
let ingredientesNovos: Ingrediente[] = [];
let fichasNovas: Ficha[] = [];
let alteracoesDeFicha = new Map<string, ItemFicha[]>();
let comprasInformadas = new Map<string, Compra>();
let cabecalhosDeFicha = new Map<string, CabecalhoDeFicha>();

/*
  ── OS TRÊS MAPAS DA EDIÇÃO DE INSUMO ─────────────────────────────────

  `identidades` guarda o que se edita SEM consequência de cálculo: nome,
  categoria, unidade, fornecedor, observação, ativo.
  `transformacoes` guarda os pesos medidos.
  `excluidos` guarda o que foi apagado nesta sessão.

  ┌────────────────────────────────────────────────────────────────────┐
  │ POR QUE "EXCLUÍDO" E NÃO "REMOVER DA LISTA"                        │
  │                                                                    │
  │ A lista de insumos que a tela mostra é montada no SERVIDOR, e chega │
  │ aqui como prop. Apagar um item de um array que veio por prop não    │
  │ sobrevive à próxima renderização do servidor — o insumo reaparece.  │
  │                                                                    │
  │ Por isso o store não apaga: ele ANOTA o que foi apagado, e quem     │
  │ exibe filtra. É a mesma lógica da sobreposição de preço, aplicada   │
  │ à ausência em vez de à presença.                                   │
  │                                                                    │
  │ A consequência é declarada na tela, e é real: um insumo apagado     │
  │ nesta sessão continua nas fichas que o usam — porque a exclusão de  │
  │ um insumo usado por uma ficha é uma decisão de dados que precisa    │
  │ de banco para ser feita direito, e o sistema não a simula.          │
  └────────────────────────────────────────────────────────────────────┘
*/
let identidades = new Map<string, Partial<Ingrediente>>();
let transformacoes = new Map<string, Transformacao>();
let insumosExcluidos = new Set<string>();
let fichasExcluidas = new Set<string>();

/*
  ── OS CARDÁPIOS DESTA SESSÃO ─────────────────────────────────────────

  Mesma forma do que já existe para ficha e insumo, e pela mesma razão: a
  lista que a tela exibe vem do repositório (que não enxerga o que foi criado
  agora), então o store ANOTA o que a sessão mexeu e quem exibe sobrepõe.

  ┌────────────────────────────────────────────────────────────────────┐
  │ POR QUE O ITEM DE CARDÁPIO NÃO GUARDA CUSTO NEM PREÇO              │
  │                                                                    │
  │ Porque os dois já estão na ficha, e a ficha é lida ao vivo. Um item │
  │ que guardasse `precoVenda` próprio seria uma cópia: mudar o preço na│
  │ ficha deixaria o cardápio mostrando o antigo, e nada na tela        │
  │ explicaria a diferença.                                            │
  │                                                                    │
  │ É a mesma decisão que a precificação tomou, e vale aqui pelo mesmo  │
  │ motivo — com um agravante: o cardápio é o que vai para a mesa do    │
  │ cliente. Um preço desatualizado aqui não é um número errado numa    │
  │ tela, é um preço errado sendo cobrado.                             │
  └────────────────────────────────────────────────────────────────────┘
*/
let cardapiosNovos: Cardapio[] = [];
let alteracoesDeCardapio = new Map<string, Partial<Cardapio>>();
let cardapiosArquivados = new Set<string>();
let cardapiosExcluidos = new Set<string>();

/*
  ── ARQUIVADOS: QUEM SAI DE CIRCULAÇÃO SEM SAIR DA HISTÓRIA ───────────

  Este conjunto e o de cima parecem o mesmo e respondem perguntas diferentes.
  `insumosExcluidos` diz "este cadastro não existe mais"; `insumosArquivados`
  diz "este cadastro existe, mas não quero mais vê-lo nas listas".

  A diferença aparece na ficha antiga. Um insumo EXCLUÍDO sai da biblioteca e
  a ficha que o usava perde o nome — o custo do dia continua guardado na
  linha, mas não há mais cadastro para explicar de onde veio aquele número.
  Um insumo ARQUIVADO continua existindo, e a ficha antiga abre inteira,
  com nome, categoria e o preço daquele dia.

  Ver `arquivarIngrediente` para a decisão de negócio por trás da separação.
*/
let insumosArquivados = new Set<string>();

/*
  ── O CADASTRO DO CLIENTE, E A MESMA SEPARAÇÃO ────────────────────────

  `cadastrosDeCliente` guarda só o que se CORRIGE num cadastro: nome
  fantasia, responsável, tipo de negócio, modalidade, situação, cidade,
  porte, equipe declarada, WhatsApp, e-mail e a queixa declarada.

  `contratoDoCliente` guarda a data de início.

  ┌────────────────────────────────────────────────────────────────────┐
  │ POR QUE A DATA DE INÍCIO MORA SOZINHA                               │
  │                                                                    │
  │ Os outros campos são dados que a consultora CORRIGE — o WhatsApp    │
  │ digitado errado, o responsável que mudou, o porte que ela mesma     │
  │ declarou por telefone. Ela dá e ela tira.                           │
  │                                                                    │
  │ O início do atendimento é de outra natureza: é o começo do          │
  │ relacionamento. Mexer nele não corrige um texto, REFAZ a história   │
  │ — a carteira inteira mostra "desde quando" a partir dele, e a       │
  │ data de conversão do lead partiu dele.                              │
  │                                                                    │
  │ Ele é editável porque a data real às vezes é outra (o combinado     │
  │ verbal foi no dia 2, o cadastro no dia 9) — mas ele entra sozinho   │
  │ numa gravação própria, com nome próprio, para não se confundir com  │
  │ os campos de correção na hora de auditar o que foi mexido.          │
  └────────────────────────────────────────────────────────────────────┘
*/
let cadastrosDeCliente = new Map<string, DadosDoCadastro>();
let inicioDoAtendimento = new Map<string, Date>();

/**
 * OS ACONTECIMENTOS DESTA SESSÃO.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UMA ALTERAÇÃO PRECISA DEIXAR LINHA NO HISTÓRICO             │
 * │                                                                    │
 * │ A aba Histórico do cliente é a resposta para "o que foi feito       │
 * │ neste ano?". Se corrigir o cadastro não deixasse linha, ela          │
 * │ mostraria um cliente com o nome novo e nenhuma explicação de         │
 * │ quando ele mudou — e a única forma de descobrir seria comparar       │
 * │ com o que ela lembra de ter digitado.                                │
 * │                                                                    │
 * │ Uma alteração sem data e sem registro não é verificável. É a        │
 * │ mesma razão pela qual a ficha guarda a linha dela.                  │
 * │                                                                    │
 * │ ┌──────────────────────────────────────────────────────────────┐   │
 * │ │ O QUE ESTAS LINHAS NÃO SÃO                                    │   │
 * │ │                                                              │   │
 * │ │ Não são registro de auditoria permanente. Vivem na sessão,     │   │
 * │ │ como todo o resto daqui: recarregar a página as apaga junto    │   │
 * │ │ com o dado que elas descrevem. É por isso que a tela do         │   │
 * │ │ histórico diz que elas são desta sessão, e não as mistura       │   │
 * │ │ com os acontecimentos do cenário sem distinguir.                │   │
 * │ └──────────────────────────────────────────────────────────────┘   │
 * └────────────────────────────────────────────────────────────────────┘
 */
let eventosDaSessao: EventoHistorico[] = [];

/**
 * Anota um acontecimento desta sessão.
 *
 * `tipo` é obrigatório e vem do mesmo vocabulário do cenário — um tipo
 * inventado aqui apareceria no histórico sem rótulo, porque o mapa de
 * rótulos é fechado sobre `TipoEvento`.
 */
export function registrarEventoDaSessao(
  clienteId: string,
  tipo: EventoHistorico["tipo"],
  descricao: string
): void {
  eventosDaSessao = [
    {
      /*
        O id carrega o instante. Dois acontecimentos no mesmo milissegundo
        teriam o mesmo id, e a chave de lista do React reclamaria — o
        contador no fim resolve, e não custa consulta nenhuma.
      */
      id: `demo-evento-${clienteId}-${Date.now()}-${eventosDaSessao.length}`,
      clienteId,
      tipo,
      descricao,
      em: new Date(),
    },
    ...eventosDaSessao,
  ];
  avisar();
}

/** Os acontecimentos desta sessão, do mais recente para o mais antigo. */
export function eventosDeSessaoDoCliente(clienteId: string): readonly EventoHistorico[] {
  return eventosDaSessao.filter((e) => e.clienteId === clienteId);
}

/**
 * O HISTÓRICO DO CLIENTE — os acontecimentos desta sessão no topo dos outros.
 *
 * O `clienteId` é argumento próprio, e não lido do primeiro evento. Quando o
 * cliente não tiver nenhum acontecimento no cenário — o caso de quem foi
 * cadastrado à mão e nunca teve diagnóstico nem ficha —, a lista chega vazia
 * e não haveria de onde tirar o id. A alteração que ela acabou de fazer
 * ficaria de fora do histórico exatamente no cliente que mais precisa dele.
 */
export function historicoDoClienteDaSessao(
  clienteId: string,
  eventos: readonly EventoHistorico[]
): readonly EventoHistorico[] {
  return [...eventosDeSessaoDoCliente(clienteId), ...eventos];
}

/**
 * OS CAMPOS DE CADASTRO QUE A CONSULTORA CORRIGE.
 *
 * Não é uma cópia de `Cliente` com tudo opcional: `id`, `origem` e
 * `leadOrigemId` ficam DE FORA de propósito. O primeiro é a chave que liga
 * a ficha ao cliente — editá-lo quebraria a ligação em silêncio. Os outros
 * dois registram de onde aquele cliente veio, e mudá-los seria reescrever a
 * história da aquisição, não corrigir um dado.
 *
 * `ultimaAtividadeEm` também não está aqui: é consequência do que aconteceu,
 * não campo.
 */
export type DadosDoCadastro = Partial<
  Pick<
    Cliente,
    | "nomeFantasia"
    | "nomeContato"
    | "email"
    | "whatsapp"
    | "tipoNegocio"
    | "porte"
    | "cidade"
    | "situacao"
    | "modalidade"
    | "funcionariosDeclarados"
    | "problemaDeclarado"
  >
>;

/** Insumo que existe no cenário, mais tudo que foi editado nesta sessão. */
export function ingredienteDaSessao(ingrediente: Ingrediente): Ingrediente {
  const identidade = identidades.get(ingrediente.id);
  const transformacao = transformacoes.get(ingrediente.id);
  const compra = comprasInformadas.get(ingrediente.id);

  if (identidade === undefined && transformacao === undefined && compra === undefined) {
    return ingrediente;
  }

  return {
    ...ingrediente,
    ...(identidade ?? {}),
    ...(transformacao === undefined ? {} : { transformacao }),
    ...(compra === undefined ? {} : { compra }),
  };
}

/** Um insumo que só existe na sessão? (cadastrado agora, ainda não no banco) */
export function ehInsumoDaSessao(ingredienteId: string): boolean {
  return ingredientesNovos.some((i) => i.id === ingredienteId);
}

/**
 * Grava um campo do cadastro do insumo.
 *
 * Recebe um OBJETO PARCIAL e mescla. Editar o nome não pode apagar o
 * fornecedor que foi corrigido um minuto antes — e é isso que uma
 * substituição do objeto inteiro faria, sem aviso.
 */
export function salvarCadastroDoIngrediente(
  ingredienteId: string,
  alteracao: Partial<Ingrediente>
): void {
  const anterior = identidades.get(ingredienteId) ?? {};
  identidades.set(ingredienteId, { ...anterior, ...alteracao });

  /*
    Um insumo cadastrado nesta sessão é atualizado NA PRÓPRIA LISTA, e não
    por sobreposição: ele não existe no repositório, então não há cenário
    para sobrepor. Sem esta linha, editar o nome de um insumo recém-criado
    apareceria no detalhe e não na lista — duas telas mostrando o mesmo
    insumo com nomes diferentes.
  */
  ingredientesNovos = ingredientesNovos.map((i) =>
    i.id === ingredienteId ? { ...i, ...alteracao } : i
  );

  avisar();
}

/**
 * Grava os pesos medidos da transformação — a CALCULADORA DE RENDIMENTO.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA FUNÇÃO NÃO FAZ: VALIDAR                                │
 * │                                                                    │
 * │ Ela não recusa peso final maior que o inicial — e isso é           │
 * │ deliberado. Arroz, massa e legume seco GANHAM peso ao cozinhar: a   │
 * │ água absorvida entra na panela e sai no prato. Tratar ganho como    │
 * │ erro faria o sistema proibir uma medição verdadeira.                │
 * │                                                                    │
 * │ Também não recusa peso negativo nem zero — quem recusa é            │
 * │ `lerPeso`, na leitura do campo, antes de chegar aqui. Duas camadas  │
 * │ validando o mesmo criaria a possibilidade de aceitarem coisas       │
 * │ diferentes.                                                        │
 * │                                                                    │
 * │ O que ela faz é GUARDAR a medição como ela foi: os três pesos, a    │
 * │ unidade de cada um e a observação de quem pesou. A conta sai        │
 * │ depois, em `derivarTransformacao`, que é função pura.               │
 * └────────────────────────────────────────────────────────────────────┘
 */
export function salvarTransformacao(
  ingredienteId: string,
  transformacao: Transformacao
): void {
  transformacoes.set(ingredienteId, transformacao);
  ingredientesNovos = ingredientesNovos.map((i) =>
    i.id === ingredienteId ? { ...i, transformacao } : i
  );
  avisar();
}

/** A transformação editada nesta sessão, se houver. */
export function transformacaoDaSessao(ingredienteId: string): Transformacao | null {
  return transformacoes.get(ingredienteId) ?? null;
}

/**
 * Apaga um insumo — nesta sessão.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ O QUE A EXCLUSÃO AQUI NÃO FAZ, E POR QUE ISSO É DITO NA TELA        │
 * │                                                                    │
 * │ Ela não remove o insumo das fichas que o usam. Uma ficha apontando   │
 * │ para um insumo inexistente mostraria "sem preço" em vez de "o        │
 * │ insumo foi apagado" — e a consultora procuraria o preço por meia    │
 * │ hora.                                                              │
 * │                                                                    │
 * │ A exclusão de verdade precisa decidir o que acontece com as fichas  │
 * │ — bloquear, avisar, manter o histórico — e essa decisão depende de   │
 * │ perguntar a ela, não de o sistema escolher. Até então, a exclusão    │
 * │ nesta sessão é o que ela é: o insumo sai das listas e das buscas, e  │
 * │ o que já o usava continua funcionando.                             │
 * └────────────────────────────────────────────────────────────────────┘
 */
export function excluirIngrediente(ingredienteId: string): void {
  insumosExcluidos.add(ingredienteId);
  ingredientesNovos = ingredientesNovos.filter((i) => i.id !== ingredienteId);
  identidades.delete(ingredienteId);
  transformacoes.delete(ingredienteId);
  comprasInformadas.delete(ingredienteId);
  avisar();
}

export function insumoFoiExcluido(ingredienteId: string): boolean {
  return insumosExcluidos.has(ingredienteId);
}

// ---------------------------------------------------------------------------
// Arquivar — a saída honesta quando o insumo está em uso
// ---------------------------------------------------------------------------

/**
 * O INSUMO QUE SAI DE CIRCULAÇÃO SEM QUE O PASSADO MUDE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ARQUIVAR E EXCLUIR SÃO COISAS DIFERENTES                     │
 * │                                                                      │
 * │ Duas perguntas, e não uma:                                            │
 * │                                                                      │
 * │   "Não quero mais este insumo nas minhas listas" → ARQUIVAR.          │
 * │   "Este insumo nunca existiu" → EXCLUIR.                             │
 * │                                                                      │
 * │ Elas parecem a mesma coisa e produzem resultados opostos quando há    │
 * │ uma ficha que já usou o insumo. Excluir reescreve o passado: a ficha  │
 * │ de março passaria a apontar para um cadastro inexistente, e o custo   │
 * │ dela deixaria de ter explicação. Arquivar preserva o passado e tira   │
 * │ o insumo do caminho: ele para de aparecer nas buscas e nas listas, e   │
 * │ nenhuma ficha NOVA consegue escolhê-lo — mas quem já o usou continua  │
 * │ abrindo, custando e explicando o preço do dia em que foi escrita.      │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ O ARQUIVAMENTO É EM MEMÓRIA, E A ARQUITETURA É DE BANCO          │ │
 * │ │                                                                  │ │
 * │ │ Não há persistência: o Neon não está conectado. O que existe aqui │ │
 * │ │ é a representação do estado (um insumo arquivado) e o caminho      │ │
 * │ │ que as telas percorrem para lê-lo. Quando o banco existir, o       │ │
 * │ │ `Set` vira a coluna `arquivadoEm` do insumo, e NENHUMA tela muda  │ │
 * │ │ de forma — elas já perguntam `ingredienteArquivado(id)`, ou leem   │ │
 * │ │ a lista que já aplica a regra, em vez de olhar o banco.           │ │
 * │ │                                                                  │ │
 * │ │ Inventar uma tabela agora criaria uma segunda fonte de verdade    │ │
 * │ │ para uma decisão que já está tomada em tipo.                      │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function arquivarIngrediente(ingredienteId: string): void {
  insumosArquivados.add(ingredienteId);
  avisar();
}

/** Devolve um insumo arquivado à circulação. */
export function desarquivarIngrediente(ingredienteId: string): void {
  insumosArquivados.delete(ingredienteId);
  avisar();
}

export function ingredienteArquivado(ingredienteId: string): boolean {
  return insumosArquivados.has(ingredienteId);
}

/**
 * A LISTA DO CENÁRIO, SEM OS ARQUIVADOS.
 *
 * Existe pela mesma razão de `semExcluidos`: a regra é uma só, e mora aqui.
 * Se cada lista filtrasse por conta própria, o dia em que uma delas esquecesse
 * seria o dia em que um insumo arquivado reapareceria numa tela — e só nela.
 */
export function semArquivados<
  T extends { id: string },
>(itens: readonly T[]): readonly T[] {
  return itens.filter((i) => !insumosArquivados.has(i.id));
}

/** A lista do cenário, sem o que foi apagado nesta sessão. */
export function semExcluidos<
  T extends { id: string },
>(itens: readonly T[]): readonly T[] {
  return itens.filter((i) => !insumosExcluidos.has(i.id));
}

/**
 * O INSUMO NÃO PERTENCE À BIBLIOTECA? — PERGUNTA ÚNICA, PARA A BUSCA.
 *
 * A busca global não recebe `{ id }`: ela indexa itens com id PREFIXADO —
 * `ingrediente:in_demo_7`, `cliente:cli_3` — justamente para que o id de um
 * insumo nunca colida com o de uma ficha na mesma lista. Então `semExcluidos`
 * e `semArquivados`, que comparam o id cru, não têm como ser aplicados lá.
 *
 * A alternativa era a busca importar os dois conjuntos e remontar a regra. Aí
 * existiriam duas implementações da mesma decisão de negócio, e no dia em que
 * uma mudasse a busca voltaria a mostrar arquivados — em silêncio, e só nela.
 *
 * Aqui a pergunta é feita uma vez, em função pura, e quem tem o id prefixado
 * separa o prefixo antes de chamar.
 */
export function insumoForaDaBiblioteca(ingredienteId: string): boolean {
  return insumosExcluidos.has(ingredienteId) || insumosArquivados.has(ingredienteId);
}

/**
 * Apaga uma ficha — nesta sessão.
 *
 * Mesma regra do insumo, com uma consequência a mais que a tela declara: o
 * registro de uma ficha que já foi entregue ao cliente é histórico. Apagar
 * da lista é uma coisa; dizer que o trabalho nunca existiu é outra. Aqui só
 * a primeira acontece.
 */
export function excluirFicha(fichaId: string): void {
  fichasExcluidas.add(fichaId);
  fichasNovas = fichasNovas.filter((f) => f.id !== fichaId);
  alteracoesDeFicha.delete(fichaId);
  cabecalhosDeFicha.delete(fichaId);
  avisar();
}

export function fichaFoiExcluida(fichaId: string): boolean {
  return fichasExcluidas.has(fichaId);
}

/** As fichas do cenário, sem as apagadas, com as edições aplicadas. */
export function fichasVisiveis(fichas: readonly Ficha[]): readonly Ficha[] {
  return fichas.filter((f) => !fichasExcluidas.has(f.id)).map(fichaDaSessao);
}

/**
 * O ACERVO INTEIRO: as fichas do cenário e as criadas nesta sessão.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO VIROU FUNÇÃO AQUI, E NÃO CONTINUOU EM CADA TELA          │
 * │                                                                      │
 * │ A regra existia em duas telas — `/fichas` e a aba de fichas do        │
 * │ cliente — como o mesmo `useMemo` escrito duas vezes:               │
 * │ `[...fichasDaSessao(), ...fichasVisiveis(doCenario)]`, com o filtro   │
 * │ das que já estão nas novas e a ordenação por data. As duas concordam  │
 * │ hoje. No dia em que uma passar a ordenar por outro critério, ou a     │
 * │ esquecer de tirar as duplicadas, a mesma ficha apareceria duas vezes  │
 * │ numa lista e uma vez na outra, e a diferença não significaria nada.   │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ O QUE ISTO **NÃO** RESOLVE, E É HONESTO DIZER                     │ │
 * │ │                                                                  │ │
 * │ │ A planilha NÃO chama esta função. `montarContexto` lê o           │ │
 * │ │ REPOSITÓRIO, que não enxerga o que a sessão criou — então a       │ │
 * │ │ ficha criada agora não entra no modelo "Ficha técnica" sem que o  │ │
 * │ │ contexto seja sobreposto antes de gerar. São dois trabalhos: um   │ │
 * │ │ aqui (o acervo das LISTAS, que já está certo e agora é um só) e    │ │
 * │ │ outro na geração (o contexto, que ainda lê do repositório).       │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function acervoDeFichas(
  doCenario: readonly Ficha[],
  /** Só as de um cliente. Omitido, o acervo inteiro. */
  clienteId?: string
): readonly Ficha[] {
  const novas = fichasDaSessao().filter((f) => !clienteId || f.clienteId === clienteId);
  const idsNovas = new Set(novas.map((f) => f.id));

  return [
    ...novas,
    ...fichasVisiveis(doCenario).filter((f) => !idsNovas.has(f.id)),
  ].sort((a, b) => b.atualizadaEm.getTime() - a.atualizadaEm.getTime());
}

// ---------------------------------------------------------------------------
// Cardápios
// ---------------------------------------------------------------------------

/**
 * O CARDÁPIO DA SESSÃO — o do cenário com o que foi mexido por cima.
 *
 * A mesclagem é por campo, e não do objeto inteiro, pelo mesmo motivo que o
 * cabeçalho da ficha: seções e itens são salvos em ações diferentes — criar
 * uma seção numa, mover um item noutra. Substituir o cardápio inteiro faria
 * criar uma seção apagar o item movido cinco minutos antes.
 *
 * `categorias` e `itens` são as exceções: quando vêm na alteração, vêm
 * COMPLETAS, porque são listas ordenadas e uma mesclagem por posição não teria
 * como saber onde uma seção nova entra.
 */
export function cardapioDaSessao(cardapio: Cardapio): Cardapio {
  const alteracao = alteracoesDeCardapio.get(cardapio.id);
  const arquivado = cardapiosArquivados.has(cardapio.id);

  if (alteracao === undefined && !arquivado) return cardapio;

  return {
    ...cardapio,
    ...(alteracao ?? {}),
    ...(arquivado ? { situacao: "ARQUIVADO" as const } : {}),
  };
}

/** O acervo de cardápios: os do cenário sem os apagados, mais os criados agora. */
export function acervoDeCardapios(doCenario: readonly Cardapio[]): readonly Cardapio[] {
  const novos = cardapiosNovos.filter((c) => !cardapiosExcluidos.has(c.id));
  const idsNovos = new Set(novos.map((c) => c.id));

  return [
    ...novos,
    ...doCenario
      .filter((c) => !cardapiosExcluidos.has(c.id) && !idsNovos.has(c.id))
      .map(cardapioDaSessao),
  ].sort((a, b) => b.atualizadoEm.getTime() - a.atualizadoEm.getTime());
}

export function criarCardapio(cardapio: Cardapio): void {
  cardapiosNovos = [...cardapiosNovos, cardapio];
  avisar();
}

/**
 * Grava a alteração de um cardápio, MESCLANDO com o que já havia.
 *
 * Uma alteração num cardápio CRIADO nesta sessão vai direto no registro, e não
 * no mapa de sobreposição: o mapa é uma sobreposição sobre algo que existe no
 * cenário, e sobrepor um objeto que só existe aqui deixaria dois lugares com a
 * mesma verdade — o que a lista mostra seria o do mapa, e o que a exclusão
 * procura seria o da lista.
 */
export function salvarCardapio(cardapioId: string, alteracao: Partial<Cardapio>): void {
  const indice = cardapiosNovos.findIndex((c) => c.id === cardapioId);
  if (indice >= 0) {
    const atual = cardapiosNovos[indice];
    if (atual) cardapiosNovos[indice] = { ...atual, ...alteracao };
  } else {
    alteracoesDeCardapio.set(cardapioId, {
      ...(alteracoesDeCardapio.get(cardapioId) ?? {}),
      ...alteracao,
    });
  }
  avisar();
}

/**
 * ARQUIVAR E EXCLUIR SÃO COISAS DIFERENTES — de novo, e aqui importa mais.
 *
 * Arquivar tira o cardápio das listas e PRESERVA o registro: ele foi impresso,
 * foi para a mesa, o cliente pagou por ele. Excluir tira das listas e do
 * acervo — e o que se perde não volta, porque nesta sessão não há cópia.
 *
 * A separação é a mesma que `arquivarIngrediente` documenta. Escrever as duas
 * operações como uma só seria escolher por ela a que apaga.
 */
export function arquivarCardapio(cardapioId: string): void {
  cardapiosArquivados.add(cardapioId);
  avisar();
}

export function desarquivarCardapio(cardapioId: string): void {
  cardapiosArquivados.delete(cardapioId);
  /*
    Desarquivar precisa DESFAZER a sobreposição de situação quando ela veio
    do arquivamento — mas não quando o cardápio foi arquivado de verdade no
    cenário. Para os novos da sessão, a alteração gravada é a única verdade;
    para os do cenário, tirar do Set já basta.
  */
  const alteracao = alteracoesDeCardapio.get(cardapioId);
  if (alteracao?.situacao === "ARQUIVADO") {
    const { situacao: _descartado, ...resto } = alteracao;
    alteracoesDeCardapio.set(cardapioId, resto);
  }
  avisar();
}

export function cardapioArquivado(cardapioId: string): boolean {
  return cardapiosArquivados.has(cardapioId);
}

export function excluirCardapio(cardapioId: string): void {
  cardapiosExcluidos.add(cardapioId);
  cardapiosNovos = cardapiosNovos.filter((c) => c.id !== cardapioId);
  alteracoesDeCardapio.delete(cardapioId);
  avisar();
}

export function cardapioFoiExcluido(cardapioId: string): boolean {
  return cardapiosExcluidos.has(cardapioId);
}

export function cardapioDaSessaoNova(cardapioId: string): boolean {
  return cardapiosNovos.some((c) => c.id === cardapioId);
}

/**
 * DUPLICA UM CARDÁPIO — a segunda versão do mesmo menu.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE A CÓPIA RECEBE, E O QUE ELA NÃO RECEBE                          │
 * │                                                                      │
 * │ RECEBE: as seções com ids NOVOS e os itens apontando para eles.       │
 * │                                                                      │
 * │ NÃO RECEBE: os ids das seções originais. Se a cópia guardasse os       │
 * │ mesmos `categoriaId`, editar uma seção na cópia mexeria na original —  │
 * │ e o erro seria silencioso, porque as duas listas continuariam         │
 * │ parecendo certas.                                                     │
 * │                                                                      │
 * │ NÃO RECEBE o histórico. Ele é a ata do que aconteceu com o cardápio    │
 * │ ORIGINAL; a cópia afirma uma história que ela não viveu. Ela nasce com │
 * │ uma linha dizendo de onde veio — a única coisa que se sabe sobre ela.  │
 * │                                                                      │
 * │ AS FICHAS SÃO AS MESMAS. E aqui está a diferença central em relação a  │
 * │ duplicar uma FICHA: lá, os itens são copiados um a um, porque a cópia  │
 * │ vai divergir. Aqui, os itens do cardápio apontam para as MESMAS fichas │
 * │ — de propósito. O cardápio de verão e o de inverno anunciam o mesmo    │
 * │ prato, e corrigir o preço dele na ficha corrige os dois.               │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O `id` novo chega de fora, como em `duplicarFicha`, e pelo mesmo motivo: o
 * prefixo `ca_demo_` declara "este cardápio não está no banco", e essa é uma
 * decisão da tela, tomada num só lugar.
 *
 * A mesma regra vale para as SEÇÕES e para as LINHAS: um cardápio tem três
 * espécies de id — o dele, o de cada seção e o de cada item — e as três
 * precisam ser novas na cópia. Reaproveitar os ids das linhas faria duas telas
 * usarem a mesma chave para linhas diferentes, e a lista do React passaria a
 * trocar conteúdo entre elas na reordenação.
 *
 * `montarIds` recebe a ESPÉCIE e a QUANTIDADE, e é chamada duas vezes. A
 * espécie é argumento, e não algo que a função adivinha, porque é ela que
 * decide o prefixo do id — e um prefixo adivinhado deixaria de distinguir
 * seção de item para quem lê o id. A assinatura casa com `idsDeCopia`, que é
 * quem a tela passa; manter as duas iguais é o que permite injetar a função
 * direto, sem uma lambda de adaptação que alguém escreveria errado.
 */
export function duplicarCardapio(
  origem: Cardapio,
  idDoNovo: string,
  montarIds: (especie: "se" | "it", quantidade: number) => readonly string[]
): Cardapio {
  const agora = new Date();
  const idsDeSecao = montarIds("se", origem.categorias.length);
  const idsDeItem = montarIds("it", origem.itens.length);

  /*
    O mapa liga a seção antiga à nova. Sem ele, cada item teria de procurar a
    sua seção por nome — e duas seções com o mesmo nome (o que é permitido)
    fariam os itens caírem todos na primeira.
  */
  const traducao = new Map<string, string>();
  origem.categorias.forEach((c, i) => {
    const novo = idsDeSecao[i];
    if (novo) traducao.set(c.id, novo);
  });

  const copia: Cardapio = {
    ...origem,
    id: idDoNovo,
    nome: `${origem.nome} (cópia)`,
    situacao: "RASCUNHO",
    categorias: origem.categorias.map((c, i) => ({
      ...c,
      id: idsDeSecao[i] ?? c.id,
    })),
    itens: origem.itens.map((item, i) => {
      /*
        O id da LINHA é novo, sempre. O `fichaId` NÃO: ele aponta para a ficha
        técnica, e a cópia anuncia os mesmos pratos — é o que faz corrigir o
        preço na ficha corrigir os dois cardápios de uma vez.
      */
      const novoId = idsDeItem[i] ?? item.id;
      const novaSecao = traducao.get(item.categoriaId);
      /*
        Um item órfão na origem (apontando para seção que não existe) ficaria
        órfão na cópia também, e as duas telas mostrariam o mesmo defeito como
        se fosse intencional. Ele é mantido — esconder seria pior — mas o
        `categoriaId` fica como está, e a pendência `ITEM_ORFAO` continua
        aparecendo para quem copiou.
      */
      if (novaSecao === undefined) return { ...item, id: novoId };
      return { ...item, id: novoId, categoriaId: novaSecao };
    }),
    criadoEm: agora,
    atualizadoEm: agora,
    historico: [
      {
        em: agora,
        oQue: `Criado como cópia de "${origem.nome}".`,
        quem: ASSINATURA_DA_SESSAO,
      },
    ],
  };

  criarCardapio(copia);
  return copia;
}

/**
 * APAGA uma seção — e decide o que fazer com os itens dela.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE OS ITENS NÃO SOMEM JUNTO                                      │
 * │                                                                      │
 * │ Apagar uma seção e os itens dela parece a operação óbvia, e é a que    │
 * │ destrói trabalho sem avisar: o prato já estava escolhido, com o nome   │
 * │ de anúncio escrito, e a seção foi reorganizada por causa disso.        │
 * │                                                                      │
 * │ Aqui a seção sai e os itens FICAM, órfãos e MARCADOS. A pendência      │
 * │ `ITEM_ORFAO` aparece na conferência, e a tela oferece a única saída    │
 * │ honesta: mover para uma seção que existe, ou remover o item.           │
 * │                                                                      │
 * │ Um item a mais numa lista de pendências é recuperável em dez segundos. │
 * │ Um item apagado sem aviso não é recuperável de jeito nenhum.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function removerSecao(cardapio: Cardapio, categoriaId: string): Partial<Cardapio> {
  return {
    categorias: cardapio.categorias.filter((c) => c.id !== categoriaId),
    atualizadoEm: new Date(),
    historico: [
      ...cardapio.historico,
      {
        em: new Date(),
        oQue: `Seção removida. Os itens dela continuam no cardápio, aguardando uma seção.`,
        quem: ASSINATURA_DA_SESSAO,
      },
    ],
  };
}

/**
 * AS SEÇÕES DE UM CARDÁPIO NOVO.
 *
 * Começa vazia de propósito. Uma lista fixa de seções ("Entradas", "Pratos")
 * seria o sistema escrevendo a taxonomia da casa dela — e a mesma decisão que
 * a ficha já tomou ao não ter categorias fixas: a taxonomia é do acervo.
 */
export function cardapioVazio(argumentos: {
  id: string;
  clienteId: string;
  consultoriaId: string | null;
  nome: string;
  descricao: string;
}): Cardapio {
  const agora = new Date();
  return {
    id: argumentos.id,
    clienteId: argumentos.clienteId,
    consultoriaId: argumentos.consultoriaId,
    nome: argumentos.nome,
    descricao: argumentos.descricao,
    situacao: "RASCUNHO",
    categorias: [],
    itens: [],
    criadoEm: agora,
    atualizadoEm: agora,
    historico: [
      {
        em: agora,
        oQue: "Cardápio criado.",
        quem: ASSINATURA_DA_SESSAO,
      },
    ],
  };
}

/**
 * MONTA uma seção e um item — sem id inventado no meio da tela.
 *
 * As duas funções existem para que a tela nunca escreva um id à mão. Um `id`
 * montado no componente seria um segundo lugar decidindo como um id de
 * demonstração se parece, e o prefixo `ca_demo_` deixaria de ser confiável
 * para distinguir o que está no banco do que só existe aqui.
 */
export function novaSecaoDoCardapio(
  id: string,
  nome: string,
  ordem: number | null
): CategoriaDoCardapio {
  return { id, nome, ordem, descricao: "" };
}

export function novoItemDoCardapio(
  id: string,
  fichaId: string,
  categoriaId: string,
  ordem: number | null
): ItemDeCardapio {
  return {
    id,
    fichaId,
    categoriaId,
    ordem,
    nomeNoCardapio: null,
    descricao: "",
    destaque: "",
  };
}

// ---------------------------------------------------------------------------
// Editar a montagem do cardápio
// ---------------------------------------------------------------------------

/**
 * AS SITUAÇÕES QUE UMA EDIÇÃO PODE ESCREVER.
 *
 * `SituacaoCardapio` tem três valores; este tipo tem dois, e a ausência de
 * `"ARQUIVADO"` é a parte que importa.
 *
 * Arquivar passa por `arquivarCardapio`, que anota o id no `Set` consultado
 * pelo desarquivamento. Se `definirSituacaoDoCardapio` aceitasse `"ARQUIVADO"`,
 * existiriam dois caminhos para o mesmo estado — e o que não passa pelo `Set`
 * deixaria o cardápio marcado como arquivado no registro e ausente do `Set`,
 * de modo que o primeiro "desarquivar" não teria o que desfazer e o cardápio
 * voltaria sozinho. Dois caminhos para um estado divergem; um só, não.
 *
 * Derivado de `SituacaoCardapio` em vez de união escrita à mão: uma quarta
 * situação no domínio aparece aqui como erro de compilação, e não como um
 * caso que ninguém tratou.
 */
export type SituacaoEditavel = Extract<SituacaoCardapio, "RASCUNHO" | "PUBLICADO">;

/*
  ┌────────────────────────────────────────────────────────────────────────
  │ TODA EDIÇÃO PASSA POR AQUI, E NÃO POR UM `Partial` ESCRITO NA TELA
  │
  │ Cada operação abaixo devolve um `Partial<Cardapio>` pronto para
  │ `salvarCardapio`. Três coisas precisam ser verdade em todas elas, e
  │ escrevê-las em cada tela seria escrevê-las errado em uma:
  │
  │   · `atualizadoEm` sobe — é por ele que a lista ordena;
  │   · `historico` ganha uma linha — é a ata do cardápio;
  │   · `categorias` e `itens`, quando vêm, vêm COMPLETAS — a mesclagem é
  │     por campo, e uma lista parcial seria mesclada como se fosse lista
  │     inteira.
  │
  │ É o mesmo motivo pelo qual o motor de custos saiu de dentro da ficha.
  └────────────────────────────────────────────────────────────────────────
*/

function mudancaNoCardapio(
  cardapio: Cardapio,
  alteracao: Partial<Cardapio>,
  oQue: string
): Partial<Cardapio> {
  const agora = new Date();
  return {
    ...alteracao,
    atualizadoEm: agora,
    historico: [...cardapio.historico, { em: agora, oQue, quem: ASSINATURA_DA_SESSAO }],
  };
}

/**
 * AS SEÇÕES NA ORDEM EM QUE A PÁGINA AS MOSTRA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A REGRA DE ORDENAÇÃO ESTÁ ESCRITA DUAS VEZES — E POR QUE NÃO  │
 * │ ESTÁ DUPLICADA                                                        │
 * │                                                                      │
 * │ `montarLinhasDoCardapio` ordena as seções para EXIBIR. Esta função    │
 * │ ordena para REORDENAR: para dizer qual é a anterior da que está sendo │
 * │ movida, e para renumerar depois.                                      │
 * │                                                                      │
 * │ Uma reordenar por "ordem" e a outra por criação mostraria a lista na  │
 * │ ordem A e trocaria os itens na ordem B: clicar em "descer" no segundo │
 * │ item mexeria no terceiro, e nada na tela explicaria por quê. Por isso  │
 * │ as duas usam a MESMA chave (`null` vira `Infinity`, desempate pela     │
 * │ criação) — e é isso que as torna duas aplicações de uma regra, e não   │
 * │ duas regras.                                                          │
 * │                                                                      │
 * │ O desempate é pelo índice no array, e não pela data: seções criadas no │
 * │ mesmo milissegundo têm a mesma data, e o `sort` as devolveria em ordem │
 * │ arbitrária. É o mesmo defeito que `idDaSessao` já evita com o          │
 * │ contador.                                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function secoesDoCardapio(cardapio: Cardapio): readonly CategoriaDoCardapio[] {
  return cardapio.categorias
    .map((c, indice) => ({ c, indice }))
    .sort((a, b) => {
      const oa = a.c.ordem ?? Number.POSITIVE_INFINITY;
      const ob = b.c.ordem ?? Number.POSITIVE_INFINITY;
      if (oa !== ob) return oa - ob;
      return a.indice - b.indice;
    })
    .map((x) => x.c);
}

/** Os itens de UMA seção, na ordem em que a página os mostra. */
function itensDaSecao(cardapio: Cardapio, categoriaId: string): readonly ItemDeCardapio[] {
  return cardapio.itens
    .map((item, indice) => ({ item, indice }))
    .filter((x) => x.item.categoriaId === categoriaId)
    .sort((a, b) => {
      const oa = a.item.ordem ?? Number.POSITIVE_INFINITY;
      const ob = b.item.ordem ?? Number.POSITIVE_INFINITY;
      if (oa !== ob) return oa - ob;
      return a.indice - b.indice;
    })
    .map((x) => x.item);
}

/**
 * A ORDEM QUE PÕE UM ITEM NO FIM DE UMA SEÇÃO — e o defeito que ela evita.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `itensDaSecao(...).length` NÃO SERVE                          │
 * │                                                                      │
 * │ Aqui havia `naSecao.length`, e ele acerta só num caso: quando as       │
 * │ ordens da seção são exatamente `0..n-1`, sem buraco. Nesse caso o      │
 * │ próximo número livre É o do fim, e as duas coisas coincidem.           │
 * │                                                                      │
 * │ Fora dele, `length` erra — e erra para o LADO OPOSTO do que promete.   │
 * │ A ordem é lida como `ordem ?? Infinity`, então:                        │
 * │                                                                      │
 * │   · Itens todos com `ordem: null` — uma seção que veio do cenário ou   │
 * │     de uma cópia, onde ninguém posicionou nada. Uma ordem `0` recém-   │
 * │     escrita NÃO vai para o fim: `0` é menor que `Infinity`, e o item    │
 * │     pula para a PRIMEIRA posição da seção.                             │
 * │                                                                      │
 * │   · Ordens esparsas, tipo 5 e 9 — `length` é 2, e o item entra na      │
 * │     frente dos dois.                                                   │
 * │                                                                      │
 * │ Nos dois casos o resultado é o mesmo: a consultora clica em "acrescentar"│
 * │ ou em "mover para esta seção", e o prato aparece no topo. Sem erro na   │
 * │ tela, e a lista do cliente impressa na ordem errada.                    │
 * │                                                                      │
 * │ A regra correta, dita uma vez: se sobrou algum item SEM ordem          │
 * │ decidida, o fim da seção é o grupo dos sem-ordem — e basta devolver    │
 * │ `null`, porque o item novo é acrescentado ao FIM do array e o          │
 * │ desempate é pelo índice. Se todos têm ordem decidida, é o maior deles  │
 * │ mais um. Seção vazia começa em zero.                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * A decisão não é escrita de novo em cada chamador: `adicionarItem` e
 * `trocarItemDeSecao` são os dois que põem item novo numa seção, e os dois
 * perguntam aqui. Duas cópias divergiriam no primeiro caso esquecido.
 */
function ordemNoFimDaSecao(cardapio: Cardapio, categoriaId: string): number | null {
  const naSecao = itensDaSecao(cardapio, categoriaId);
  if (naSecao.length === 0) return 0;

  const decididas = naSecao.map((i) => i.ordem);
  if (decididas.some((o) => o === null)) return null;

  return Math.max(...(decididas as readonly number[])) + 1;
}

/**
 * TROCA UMA SEÇÃO DE LUGAR NA LISTA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE `null` VIRA DEPOIS DO PRIMEIRO MOVIMENTO                        │
 * │                                                                      │
 * │ Uma seção sem `ordem` é uma seção sobre a qual ninguém decidiu nada.   │
 * │ Assim que alguém arrasta, isso deixa de ser verdade: passa a existir   │
 * │ uma ordem pretendida. Por isso a renumeração escreve `0..n-1` em       │
 * │ TODAS as seções da lista, e não só nas duas trocadas.                  │
 * │                                                                      │
 * │ Sem a renumeração, mover uma seção com `ordem: null` para cima não    │
 * │ faria nada visível: ela continuaria empatada com as outras em          │
 * │ `Infinity`, e o desempate pela criação a traria de volta ao lugar de   │
 * │ sempre. O botão pareceria quebrado — e o defeito seria real.           │
 * │                                                                      │
 * │ `null` deixa de significar "não decidido" nas seções de um cardápio    │
 * │ que já foi reordenado. Continua significando isso nas que ninguém      │
 * │ tocou. É a distinção que a tela precisa para não afirmar que houve uma │
 * │ decisão que não houve.                                                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Devolve `null` quando não há para onde mover — a seção já está na ponta.
 * Não é erro: é um clique que não muda nada, e gravar um `atualizadoEm` novo
 * por causa dele faria o cardápio subir na lista sem ter mudado.
 */
export function moverSecao(
  cardapio: Cardapio,
  categoriaId: string,
  direcao: -1 | 1
): Partial<Cardapio> | null {
  const secao = cardapio.categorias.find((c) => c.id === categoriaId) ?? null;
  if (secao === null) return null;

  const ordenadas = [...secoesDoCardapio(cardapio)];
  const de = ordenadas.findIndex((c) => c.id === categoriaId);
  const para = de + direcao;
  if (de < 0 || para < 0 || para >= ordenadas.length) return null;

  const anterior = ordenadas[de];
  const seguinte = ordenadas[para];
  if (!anterior || !seguinte) return null;
  ordenadas[de] = seguinte;
  ordenadas[para] = anterior;

  return mudancaNoCardapio(
    cardapio,
    { categorias: ordenadas.map((c, i) => ({ ...c, ordem: i })) },
    `Seção "${secao.nome}" ${direcao === -1 ? "subiu" : "desceu"} na ordem.`
  );
}

export function renomearSecao(
  cardapio: Cardapio,
  categoriaId: string,
  nome: string,
  descricao: string
): Partial<Cardapio> | null {
  const secao = cardapio.categorias.find((c) => c.id === categoriaId) ?? null;
  if (secao === null) return null;

  /*
    Nome vazio é recusado no domínio, e não só na tela. Uma seção sem nome
    apareceria como um cabeçalho em branco no cardápio do cliente — e a
    validação de tela é a que some quando alguém chamar esta função de outro
    lugar. O vazio não é um nome ruim: é a ausência de um.
  */
  const limpo = nome.trim();
  if (limpo === "") return null;

  if (limpo === secao.nome && descricao.trim() === secao.descricao) return null;

  return mudancaNoCardapio(
    cardapio,
    {
      categorias: cardapio.categorias.map((c) =>
        c.id === categoriaId ? { ...c, nome: limpo, descricao: descricao.trim() } : c
      ),
    },
    `Seção renomeada para "${limpo}".`
  );
}

/** Acrescenta uma seção ao fim. A ordem é explícita: vai depois das existentes. */
export function acrescentarSecao(
  cardapio: Cardapio,
  id: string,
  nome: string,
  descricao: string
): Partial<Cardapio> | null {
  const limpo = nome.trim();
  if (limpo === "") return null;

  const ordem = cardapio.categorias.length;
  const secao = novaSecaoDoCardapio(id, limpo, ordem);

  return mudancaNoCardapio(
    cardapio,
    { categorias: [...secoesDoCardapio(cardapio), { ...secao, descricao: descricao.trim() }] },
    `Seção "${limpo}" criada.`
  );
}

/**
 * PÕE UMA FICHA NOVA NO CARDÁPIO — sempre apontando para uma ficha existente.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CARDÁPIO NÃO CRIA PRATO                                             │
 * │                                                                      │
 * │ Esta é a regra central do módulo, e é aqui que ela pode ser violada    │
 * │ por acidente: bastaria `adicionarItem` receber um nome e uma lista de  │
 * │ insumos, e o cardápio teria virado um segundo cadastro de prato — com  │
 * │ custo próprio, divergindo da ficha no dia seguinte.                    │
 * │                                                                      │
 * │ Por isso o que entra é um `fichaId`, e nada mais. Não há caminho do    │
 * │ cardápio para um prato que não tenha ficha técnica.                    │
 * │                                                                      │
 * │ A mesma ficha pode entrar duas vezes — no mesmo cardápio ou em        │
 * │ seções diferentes. É uso legítimo: o mesmo prato anunciado no almoço    │
 * │ e no jantar é uma decisão comercial, e recusá-la obrigaria a          │
 * │ consultora a criar uma ficha duplicada só para publicar duas vezes.    │
 * │                                                                      │
 * │ O que a função recusa é o que não tem significado: seção inexistente.  │
 * │ Um item numa seção que não existe é órfão desde o nascimento, e a      │
 * │ pendência `ITEM_ORFAO` existe para consertar o que apareceu, não para   │
 * │ criar de propósito.                                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function adicionarItem(
  cardapio: Cardapio,
  id: string,
  fichaId: string,
  categoriaId: string
): Partial<Cardapio> | null {
  if (!cardapio.categorias.some((c) => c.id === categoriaId)) return null;

  const item = novoItemDoCardapio(id, fichaId, categoriaId, ordemNoFimDaSecao(cardapio, categoriaId));

  return mudancaNoCardapio(
    cardapio,
    { itens: [...cardapio.itens, item] },
    "Prato acrescentado ao cardápio."
  );
}

export function removerItem(cardapio: Cardapio, itemId: string): Partial<Cardapio> | null {
  const item = cardapio.itens.find((i) => i.id === itemId) ?? null;
  if (item === null) return null;

  return mudancaNoCardapio(
    cardapio,
    { itens: cardapio.itens.filter((i) => i.id !== itemId) },
    "Prato removido do cardápio. A ficha técnica continua no acervo."
  );
}

/**
 * ESCREVE o que é do cardápio: o nome de anúncio, a descrição e o destaque.
 *
 * O `nomeNoCardapio` existe porque o nome da ficha e o nome no menu são
 * coisas diferentes na prática — "Costela bovina ao molho madeira, 350g" é a
 * ficha; "Costela ao madeira" é o que cabe no menu. Guardar os dois evita a
 * escolha ruim entre renomear a ficha (e perder o nome técnico) e mentir no
 * anúncio.
 *
 * `null` no nome esvaziado é deliberado: volta a valer o nome da ficha. Não é
 * um nome em branco — é a devolução da decisão.
 */
export function alterarItemDoCardapio(
  cardapio: Cardapio,
  itemId: string,
  alteracao: { nomeNoCardapio?: string; descricao?: string; destaque?: string }
): Partial<Cardapio> | null {
  const item = cardapio.itens.find((i) => i.id === itemId) ?? null;
  if (item === null) return null;

  const nome =
    alteracao.nomeNoCardapio === undefined
      ? item.nomeNoCardapio
      : alteracao.nomeNoCardapio.trim() === ""
        ? null
        : alteracao.nomeNoCardapio.trim();

  return mudancaNoCardapio(
    cardapio,
    {
      itens: cardapio.itens.map((i) =>
        i.id === itemId
          ? {
              ...i,
              nomeNoCardapio: nome,
              descricao: alteracao.descricao?.trim() ?? i.descricao,
              destaque: alteracao.destaque?.trim() ?? i.destaque,
            }
          : i
      ),
    },
    nome === null ? "Nome de anúncio voltou a ser o da ficha." : `Anúncio ajustado: "${nome}".`
  );
}

/**
 * TROCA UM ITEM DE LUGAR DENTRO DA PRÓPRIA SEÇÃO.
 *
 * A renumeração vale aqui pelo mesmo motivo das seções, e é ainda mais
 * visível: numa seção recém-montada todos os itens têm `ordem: null` e
 * aparecem na ordem de cadastro. Sem renumerar, "subir" e "descer" seriam
 * botões que não fazem nada.
 *
 * A renumeração toca SÓ a seção do item. As outras mantêm o que tinham —
 * `null` continua significando "não decidido" onde ninguém decidiu.
 */
export function moverItem(
  cardapio: Cardapio,
  itemId: string,
  direcao: -1 | 1
): Partial<Cardapio> | null {
  const item = cardapio.itens.find((i) => i.id === itemId) ?? null;
  if (item === null) return null;

  const ordenados = [...itensDaSecao(cardapio, item.categoriaId)];
  const de = ordenados.findIndex((i) => i.id === itemId);
  const para = de + direcao;
  if (de < 0 || para < 0 || para >= ordenados.length) return null;

  const anterior = ordenados[de];
  const seguinte = ordenados[para];
  if (!anterior || !seguinte) return null;
  ordenados[de] = seguinte;
  ordenados[para] = anterior;

  const posicao = new Map(ordenados.map((i, indice) => [i.id, indice]));

  return mudancaNoCardapio(
    cardapio,
    {
      itens: cardapio.itens.map((i) => {
        const nova = posicao.get(i.id);
        return nova === undefined ? i : { ...i, ordem: nova };
      }),
    },
    `Prato ${direcao === -1 ? "subiu" : "desceu"} na seção.`
  );
}

/** Move um item para outra seção, ao fim dela. */
export function trocarItemDeSecao(
  cardapio: Cardapio,
  itemId: string,
  categoriaId: string
): Partial<Cardapio> | null {
  const item = cardapio.itens.find((i) => i.id === itemId) ?? null;
  if (item === null) return null;
  if (!cardapio.categorias.some((c) => c.id === categoriaId)) return null;

  const ordem = ordemNoFimDaSecao(cardapio, categoriaId);
  const secao = cardapio.categorias.find((c) => c.id === categoriaId) ?? null;

  return mudancaNoCardapio(
    cardapio,
    {
      itens: cardapio.itens.map((i) =>
        i.id === itemId ? { ...i, categoriaId, ordem } : i
      ),
    },
    `Prato movido para a seção "${secao?.nome ?? "?"}".`
  );
}

/**
 * PUBLICA, VOLTA PARA MONTAGEM.
 *
 * A situação é do cardápio, e não do prato: o mesmo prato pode estar
 * publicado num cardápio e em montagem noutro.
 *
 * NÃO existe arquivamento por aqui: `arquivarCardapio` já cuida disso, e
 * deixar `definirSituacaoDoCardapio` aceitar `"ARQUIVADO"` criaria um segundo
 * caminho para o mesmo estado — com a diferença de que este não passaria pelo
 * `cardapiosArquivados`, que é o que o desarquivar consulta. Os dois
 * divergiriam no primeiro desarquivamento.
 */
export function definirSituacaoDoCardapio(
  cardapioId: string,
  situacao: SituacaoEditavel,
  oQue: string
): void {
  const acervo = cardapiosNovos.find((c) => c.id === cardapioId);
  const base = acervo ?? null;
  const historico = base ? base.historico : alteracoesDeCardapio.get(cardapioId)?.historico;
  const agora = new Date();

  salvarCardapio(cardapioId, {
    situacao,
    atualizadoEm: agora,
    historico: [
      ...(historico ?? []),
      { em: agora, oQue, quem: ASSINATURA_DA_SESSAO },
    ],
  });
}

// ---------------------------------------------------------------------------
// A equipe do cliente
// ---------------------------------------------------------------------------

/**
 * AS PESSOAS QUE EXECUTAM, na sessão.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ISTO GRAVA, E O QUE ELE DELIBERADAMENTE NÃO GRAVA               │
 * │                                                                      │
 * │ Grava nomes de execução: quem trabalha na cozinha do cliente, em que   │
 * │ função, em que turno, o que executa, e o que foi treinada a fazer.     │
 * │                                                                      │
 * │ Não grava, e não vai gravar por conveniência: salário, folha, férias,  │
 * │ benefício, ponto, adiantamento. Este módulo não é RH, e a ausência     │
 * │ desses campos é a garantia de que ele não vira um. Se um dia o salário │
 * │ entrar, ele passa a ser leitura obrigatória para tratar de gente — e   │
 * │ aí um nome errado na lista deixa de ser um prato que sai diferente e    │
 * │ passa a ser um problema trabalhista.                                   │
 * │                                                                      │
 * │ ── POR QUE A SESSÃO, E NÃO O ACERVO ────────────────────────────────  │
 * │                                                                      │
 * │ `mock/operacao.ts` não tem lista de pessoas — e inventar uma seria     │
 * │ afirmar que a consultora já cadastrou uma equipe que ela não          │
 * │ cadastrou. O que os dados de demonstração têm são NOMES ESCRITOS nos   │
 * │ processos ("Juliana (auxiliar de cozinha)", "Cozinha", "A definir com  │
 * │ o Marcelo"), e é sobre eles que `lerResponsaveis` trabalha. Então o    │
 * │ cadastro começa vazio, e a tela explica por quê.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
let pessoasDaSessao: Pessoa[] = [];
let treinamentosDaSessao: Treinamento[] = [];
const pessoasAlteradas = new Map<string, Partial<Pessoa>>();

/**
 * A equipe de um cliente: as do cenário sobrepostas pelas da sessão.
 *
 * `doCenario` entra por argumento pelo mesmo motivo dos cardápios: enquanto
 * não há tabela, quem tem os dados é o repositório, e o store só sabe o que
 * foi mexido aqui.
 */
export function acervoDaEquipe(doCenario: readonly Pessoa[]): readonly Pessoa[] {
  const alteradas = doCenario.map((p) => {
    const alteracao = pessoasAlteradas.get(p.id);
    return alteracao === undefined ? p : { ...p, ...alteracao };
  });

  return [...alteradas, ...pessoasDaSessao];
}

export function pessoaDaSessao(pessoaId: string): boolean {
  return pessoasDaSessao.some((p) => p.id === pessoaId);
}

/**
 * Grava a alteração de uma pessoa.
 *
 * Mesma regra do cardápio: se ela foi criada nesta sessão, a alteração vai
 * direto no registro; se veio do cenário, vai para a sobreposição. Gravar nos
 * dois lugares deixaria duas verdades — a tela leria uma e a exclusão
 * procuraria a outra.
 */
export function salvarPessoa(pessoaId: string, alteracao: Partial<Pessoa>): void {
  const indice = pessoasDaSessao.findIndex((p) => p.id === pessoaId);
  if (indice >= 0) {
    const atual = pessoasDaSessao[indice];
    if (atual) pessoasDaSessao[indice] = { ...atual, ...alteracao };
  } else {
    pessoasAlteradas.set(pessoaId, { ...(pessoasAlteradas.get(pessoaId) ?? {}), ...alteracao });
  }
  avisar();
}

export function criarPessoa(pessoa: Pessoa): void {
  pessoasDaSessao = [...pessoasDaSessao, pessoa];
  avisar();
}

/**
 * TIRAR DA ATIVA NÃO É APAGAR — a mesma distinção do insumo arquivado.
 *
 * A pessoa executou preparos. O registro do que ela executou continua sendo
 * verdade quando ela sai da equipe, e apagar o cadastro apagaria junto a
 * resposta de "quem fazia isto em março". Por isso a saída é `situacao`, e a
 * pessoa fica: fora da escala de hoje, dentro do registro.
 */
export function marcarSaidaDaPessoa(pessoaId: string): void {
  salvarPessoa(pessoaId, { situacao: "DESLIGADA" });
}

export function marcarRetornoDaPessoa(pessoaId: string): void {
  salvarPessoa(pessoaId, { situacao: "ATIVA" });
}

/**
 * O PAR (pessoa, preparo) TREINADO.
 *
 * Registrar de novo o mesmo par não acrescenta uma segunda linha: um
 * treinamento é um fato que passou a valer, e dois registros do mesmo par
 * fariam a contagem de "quantos treinamentos" subir sem que nada tivesse
 * acontecido. A releitura do mesmo treinamento é uma coisa a mais — e é
 * justamente por isso que ela não deve parecer um treinamento novo.
 *
 * ── A CHAVE VEM DE `./equipe`, E NÃO É ESCRITA AQUI ────────────────────
 *
 * Este arquivo tinha a própria ideia de "o mesmo par":
 * `trim().toLowerCase()`. A conferência usava `normalizarNome`, que além da
 * caixa e do espaço das pontas tira acento e colapsa espaço no meio. As duas
 * concordavam nos casos fáceis e discordavam em dois que acontecem:
 *
 *   · "costela  ao molho" (espaço duplo, como vem colado de uma ficha)
 *   · "Escondidinho à moda" e "Escondidinho a moda" (acento)
 *
 * Nos dois, o store aceitava o segundo registro e a conferência o via como o
 * mesmo par — o sistema passava a ter dois registros do mesmo fato, e um
 * deles nunca casava com nada. Importar a função faz as duas perguntas
 * serem respondidas pela mesma regra, por construção.
 *
 * `concluidoEm` aceita a data por argumento para a bancada poder exercitá-lo
 * com data fixa; a tela passa `new Date()`.
 */
export function registrarTreinamento(
  treinamento: Treinamento,
  quando: Date
): boolean {
  const jaExiste = treinamentosDaSessao.some(
    (t) => chaveDoTreinamento(t.pessoaId, t.preparo) === chaveDoTreinamento(treinamento.pessoaId, treinamento.preparo)
  );
  if (jaExiste) return false;

  treinamentosDaSessao = [...treinamentosDaSessao, { ...treinamento, concluidoEm: quando }];
  avisar();
  return true;
}

export function removerTreinamento(pessoaId: string, preparo: string): boolean {
  const antes = treinamentosDaSessao.length;
  treinamentosDaSessao = treinamentosDaSessao.filter(
    (t) => chaveDoTreinamento(t.pessoaId, t.preparo) !== chaveDoTreinamento(pessoaId, preparo)
  );

  if (treinamentosDaSessao.length === antes) return false;
  avisar();
  return true;
}

export function treinamentosDaEquipe(doCenario: readonly Treinamento[]): readonly Treinamento[] {
  return [...doCenario, ...treinamentosDaSessao];
}

// ---------------------------------------------------------------------------
// Biblioteca
// ---------------------------------------------------------------------------

/**
 * OS MATERIAIS DE APOIO DA SESSÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE A SESSÃO GUARDA AQUI, E O QUE ELA NÃO GUARDA                    │
 * │                                                                      │
 * │ Guarda o REGISTRO: título, tipo, para que serve, onde o material está  │
 * │ e a quem ele vale. É o que a Biblioteca precisa para endereçar o       │
 * │ material que ela já tem.                                              │
 * │                                                                      │
 * │ Não guarda o material em si. Não há upload, não há anexo, não há       │
 * │ base64, não há blob — e a ausência é deliberada, não uma etapa que     │
 * │ falta. Um material com o arquivo em memória seria a demonstração       │
 * │ mostrando um arquivo que não existe no disco, e ela acharia que subiu  │
 * │ uma coisa que não subiu. A regra está no cabeçalho de `./biblioteca`.  │
 * │                                                                      │
 * │ `onde` é o endereço — e pode ficar vazio. Vazio é o material que ela   │
 * │ tem e que ninguém consegue abrir a partir do sistema; a tela lista     │
 * │ esses à parte, porque é a única pendência real do módulo.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
let materiaisDaSessao: Material[] = [];
const materiaisAlterados = new Map<string, Partial<Material>>();
const materiaisExcluidos = new Set<string>();

/**
 * A biblioteca: os do cenário sobrepostos pelos da sessão.
 *
 * `doCenario` entra por argumento pelo mesmo motivo dos cardápios e da equipe:
 * enquanto não há tabela, quem tem os dados é o repositório, e o store só sabe
 * o que foi mexido aqui.
 *
 * Os excluídos saem DEPOIS da sobreposição, e não durante: um material do
 * cenário que foi editado e depois excluído não pode reaparecer pela edição.
 */
export function acervoDaBiblioteca(doCenario: readonly Material[]): readonly Material[] {
  const alterados = doCenario
    .filter((m) => !materiaisExcluidos.has(m.id))
    .map((m) => {
      const alteracao = materiaisAlterados.get(m.id);
      return alteracao === undefined ? m : { ...m, ...alteracao };
    });

  return [...alterados, ...materiaisDaSessao];
}

export function materialDaSessao(materialId: string): boolean {
  return materiaisDaSessao.some((m) => m.id === materialId);
}

/**
 * Grava a alteração de um material.
 *
 * Mesma regra do cardápio e da pessoa: se ele nasceu nesta sessão, a alteração
 * vai direto no registro; se veio do cenário, vai para a sobreposição. Gravar
 * nos dois lugares deixaria duas verdades — a tela leria uma e a exclusão
 * procuraria a outra.
 */
export function salvarMaterial(materialId: string, alteracao: Partial<Material>): void {
  const indice = materiaisDaSessao.findIndex((m) => m.id === materialId);
  if (indice >= 0) {
    const atual = materiaisDaSessao[indice];
    if (atual) materiaisDaSessao[indice] = { ...atual, ...alteracao };
  } else {
    materiaisAlterados.set(materialId, {
      ...(materiaisAlterados.get(materialId) ?? {}),
      ...alteracao,
    });
  }
  avisar();
}

export function criarMaterial(material: Material): void {
  materiaisDaSessao = [...materiaisDaSessao, material];
  avisar();
}

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ EXCLUIR AQUI É EXCLUIR — E POR QUE NÃO É ARQUIVAR COMO NO INSUMO      │
 * │                                                                      │
 * │ O insumo tem `arquivar` porque ARQUIVAR É A REGRA DELE: ele entra em   │
 * │ fichas, e uma ficha que o usa precisa continuar legível. O registro do │
 * │ preço de um insumo arquivado segue valendo para o custo de março.      │
 * │                                                                      │
 * │ O material de apoio não entra em cálculo nenhum. Ele é um endereço —   │
 * │ e um endereço errado não precisa ser preservado para nada continuar    │
 * │ correto. Excluir é excluir.                                           │
 * │                                                                      │
 * │ Mas excluir NÃO apaga o material dela, e isso a tela diz com todas as  │
 * │ letras: o que sai é o REGISTRO no sistema. O material continua onde    │
 * │ ele está — no Drive, no caderno, publicado. É por isso que o botão     │
 * │ pergunta antes, e é por isso que esta distinção aparece na tela:       │
 * │ apagar um endereço não é apagar a coisa endereçada.                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function excluirMaterial(materialId: string): void {
  materiaisExcluidos.add(materialId);
  materiaisDaSessao = materiaisDaSessao.filter((m) => m.id !== materialId);
  avisar();
}

export function materialFoiExcluido(materialId: string): boolean {
  return materiaisExcluidos.has(materialId);
}

/** Sobe a cada escrita. É o que o React observa para saber que mudou. */
let versao = 0;

const ouvintes = new Set<() => void>();

function avisar() {
  versao += 1;
  for (const fn of ouvintes) fn();
}

/**
 * A assinatura para o `useSyncExternalStore`.
 *
 * O React chama isto uma vez por componente que usa o estado e guarda a
 * função devolvida para cancelar depois. O `Set` é copiado antes de avisar
 * porque um ouvinte pode se cancelar durante o próprio aviso — desmontar uma
 * tela no meio do laço, por exemplo.
 */
export function assinarDemonstracao(fn: () => void): () => void {
  ouvintes.add(fn);
  return () => {
    ouvintes.delete(fn);
  };
}

/** O número que o React compara. Muda a cada escrita. */
export function versaoDaDemonstracao(): number {
  return versao;
}

/** Esquece tudo. Existe para o botão de reiniciar a demonstração. */
export function limparDemonstracao(): void {
  precosDaBiblioteca = new Map();
  precosDeCliente = new Map();
  ingredientesNovos = [];
  fichasNovas = [];
  alteracoesDeFicha = new Map();
  comprasInformadas = new Map();
  cabecalhosDeFicha = new Map();
  identidades = new Map();
  transformacoes = new Map();
  insumosExcluidos = new Set();
  fichasExcluidas = new Set();
  insumosArquivados = new Set();
  cadastrosDeCliente = new Map();
  inicioDoAtendimento = new Map();
  eventosDaSessao = [];
  cardapiosNovos = [];
  alteracoesDeCardapio = new Map();
  cardapiosArquivados = new Set();
  cardapiosExcluidos = new Set();
  /*
    A equipe entra aqui como tudo o mais. Uma lista de pessoas que sobrevivesse
    ao "reiniciar demonstração" faria a tela afirmar uma equipe cadastrada que
    ela acabou de mandar esquecer — e o nome de uma pessoa é o dado que menos
    pode reaparecer por descuido.
  */
  pessoasDaSessao = [];
  treinamentosDaSessao = [];
  pessoasAlteradas.clear();
  /*
    E a biblioteca. Uma lista de materiais que sobrevivesse ao reiniciar faria
    a tela mostrar um acervo que ela acabou de mandar esquecer — e, pior, a
    lista de "sem endereço" continuaria acusando pendências que já não fazem
    parte de nada.
  */
  materiaisDaSessao = [];
  materiaisAlterados.clear();
  materiaisExcluidos.clear();
  avisar();
}

/** Há algo digitado nesta sessão? A tela pergunta para poder avisar. */
export function temAlteracoes(): boolean {
  return (
    precosDaBiblioteca.size > 0 ||
    precosDeCliente.size > 0 ||
    ingredientesNovos.length > 0 ||
    fichasNovas.length > 0 ||
    alteracoesDeFicha.size > 0 ||
    comprasInformadas.size > 0 ||
    cabecalhosDeFicha.size > 0 ||
    identidades.size > 0 ||
    transformacoes.size > 0 ||
    insumosExcluidos.size > 0 ||
    fichasExcluidas.size > 0 ||
    insumosArquivados.size > 0 ||
    cadastrosDeCliente.size > 0 ||
    inicioDoAtendimento.size > 0 ||
    eventosDaSessao.length > 0 ||
    /*
      Os cardápios entram aqui como todos os outros. Sem estas quatro linhas, a
      faixa de "há alterações nesta sessão" apareceria com a carteira de fichas
      mexida e ficaria MUDA depois de montar um cardápio inteiro — que é a
      mesma classe de defeito que um limpar que não limpa: a tela afirma algo
      sobre a sessão que não corresponde ao que a sessão tem.
    */
    cardapiosNovos.length > 0 ||
    alteracoesDeCardapio.size > 0 ||
    cardapiosArquivados.size > 0 ||
    cardapiosExcluidos.size > 0 ||
    /*
      E a equipe, pelo mesmo motivo: cadastrar três pessoas e registrar um
      treinamento é mexer na sessão, e a faixa que diz "há alterações" ficaria
      muda depois disso. `pessoasAlteradas` conta mesmo quando a alteração é
      marcar alguém como desligada — ela continua sendo uma alteração.
    */
    pessoasDaSessao.length > 0 ||
    treinamentosDaSessao.length > 0 ||
    pessoasAlteradas.size > 0 ||
    /*
      E a biblioteca — pelo mesmo motivo de sempre. `materiaisExcluidos` conta
      mesmo quando o material veio do cenário: excluir algo É mexer na sessão,
      e a faixa ficaria muda exatamente depois da ação mais destrutiva da tela.
    */
    materiaisDaSessao.length > 0 ||
    materiaisAlterados.size > 0 ||
    materiaisExcluidos.size > 0
  );
}

// ---------------------------------------------------------------------------
// Chaves
// ---------------------------------------------------------------------------

/**
 * A chave do preço de um cliente para um insumo.
 *
 * O duplo underscore separa as duas partes porque nenhum id do sistema o
 * contém. Uma chave montada com um separador que aparecesse num id faria
 * ("a", "b_c") e ("a_b", "c") colidirem — e o preço de um cliente apareceria
 * no outro.
 */
function chaveDoCliente(clienteId: string, ingredienteId: string): string {
  return `${clienteId}__${ingredienteId}`;
}

// ---------------------------------------------------------------------------
// Preços — biblioteca
// ---------------------------------------------------------------------------

/** O preço vigente da biblioteca, se foi alterado nesta sessão. */
export function estadoDePrecoDaBiblioteca(ingredienteId: string): EstadoPreco | null {
  return precosDaBiblioteca.get(ingredienteId) ?? null;
}

/**
 * Registra um preço novo na biblioteca, guardando o anterior.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O PREÇO ANTIGO VAI PARA O HISTÓRICO, E NÃO PARA O LIXO      │
 * │                                                                    │
 * │ O histórico da biblioteca é uma lista do mais recente para o mais   │
 * │ antigo, e o primeiro item é o vigente. Ao entrar um preço novo, o   │
 * │ que era o primeiro passa a ser o segundo — ele continua lá, com a   │
 * │ data e o fornecedor daquele dia.                                   │
 * │                                                                    │
 * │ Se o preço entrante tiver a MESMA data do vigente, ele substitui em │
 * │ vez de empilhar: corrigir um valor digitado errado no mesmo dia não  │
 * │ é uma mudança de preço, e criar duas linhas com a mesma data        │
 * │ deixaria o histórico mentindo sobre quantas vezes o preço mudou.    │
 * └────────────────────────────────────────────────────────────────────┘
 */
export function registrarPrecoDaBiblioteca(
  ingredienteId: string,
  entrada: { valor: number; unidade: string; fornecedor: string; em: Date; origem: PrecoIngrediente["origem"] },
  estadoInicial: EstadoPreco | null
): void {
  const anterior = precosDaBiblioteca.get(ingredienteId) ?? estadoInicial;
  const novo: PrecoIngrediente = {
    id: `demo-preco-${ingredienteId}-${entrada.em.getTime()}`,
    em: entrada.em,
    valor: entrada.valor,
    unidade: entrada.unidade,
    fornecedor: entrada.fornecedor,
    origem: entrada.origem,
  };

  if (anterior === null) {
    precosDaBiblioteca.set(ingredienteId, { atual: novo, historico: [] });
    avisar();
    return;
  }

  const mesmoDia = anterior.atual.em.toDateString() === novo.em.toDateString();

  precosDaBiblioteca.set(ingredienteId, {
    atual: novo,
    historico: mesmoDia
      ? anterior.historico
      : [anterior.atual, ...anterior.historico],
  });
  avisar();
}

// ---------------------------------------------------------------------------
// Preços — cliente
// ---------------------------------------------------------------------------

export function estadoDePrecoDoCliente(
  clienteId: string,
  ingredienteId: string
): EstadoPreco | null {
  return precosDeCliente.get(chaveDoCliente(clienteId, ingredienteId)) ?? null;
}

/** Mesma regra da biblioteca, mas num espaço separado — o do cliente. */
export function registrarPrecoDoCliente(
  clienteId: string,
  ingredienteId: string,
  entrada: { valor: number; unidade: string; fornecedor: string; em: Date; origem: PrecoIngrediente["origem"] },
  estadoInicial: EstadoPreco | null
): void {
  const chave = chaveDoCliente(clienteId, ingredienteId);
  const anterior = precosDeCliente.get(chave) ?? estadoInicial;
  const novo: PrecoIngrediente = {
    id: `demo-cli-${chave}-${entrada.em.getTime()}`,
    em: entrada.em,
    valor: entrada.valor,
    unidade: entrada.unidade,
    fornecedor: entrada.fornecedor,
    origem: entrada.origem,
  };

  if (anterior === null) {
    precosDeCliente.set(chave, { atual: novo, historico: [] });
    avisar();
    return;
  }

  const mesmoDia = anterior.atual.em.toDateString() === novo.em.toDateString();

  precosDeCliente.set(chave, {
    atual: novo,
    historico: mesmoDia ? anterior.historico : [anterior.atual, ...anterior.historico],
  });
  avisar();
}

// ---------------------------------------------------------------------------
// Insumos novos
// ---------------------------------------------------------------------------

/** Os insumos cadastrados nesta sessão, na ordem em que entraram. */
export function ingredientesDaSessao(): readonly Ingrediente[] {
  return ingredientesNovos;
}

/**
 * Cadastra um insumo nesta sessão.
 *
 * O chamador já monta o `Ingrediente` inteiro — com `compra`, `transformacao`
 * e o primeiro preço no histórico. O store não monta domínio: ele guarda.
 * Essa divisão é o que permite, quando o Prisma entrar, trocar esta função por
 * um `create` sem tocar na tela.
 */
export function cadastrarIngrediente(ingrediente: Ingrediente): void {
  ingredientesNovos = [...ingredientesNovos, ingrediente];
  if (ingrediente.precoAtual !== null) {
    precosDaBiblioteca.set(ingrediente.id, {
      atual: {
        id: `demo-preco-${ingrediente.id}-0`,
        em: ingrediente.atualizadoEm,
        valor: ingrediente.precoAtual,
        unidade: ingrediente.unidade,
        fornecedor: ingrediente.fornecedor,
        origem: "CONSULTORA",
      },
      historico: ingrediente.historico,
    });
  }
  avisar();
}

// ---------------------------------------------------------------------------
// Compras
// ---------------------------------------------------------------------------

export function compraInformada(ingredienteId: string): Compra | null {
  return comprasInformadas.get(ingredienteId) ?? null;
}

export function registrarCompra(ingredienteId: string, compra: Compra): void {
  comprasInformadas.set(ingredienteId, compra);
  avisar();
}

// ---------------------------------------------------------------------------
// Ficha — itens
// ---------------------------------------------------------------------------

/**
 * Os itens de uma ficha depois das alterações desta sessão.
 *
 * Devolve `null` quando a ficha não foi tocada — e não uma cópia dos itens
 * originais. A diferença importa: `null` diz "nada mudou aqui", enquanto uma
 * cópia não diria nada e obrigaria quem chama a comparar as duas listas.
 */
export function itensDaSessao(fichaId: string): readonly ItemFicha[] | null {
  return alteracoesDeFicha.get(fichaId) ?? null;
}

export function salvarItensDaFicha(fichaId: string, itens: readonly ItemFicha[]): void {
  alteracoesDeFicha.set(fichaId, [...itens]);
  avisar();
}

// ---------------------------------------------------------------------------
// Ficha — cabeçalho
// ---------------------------------------------------------------------------

/** O que foi mexido no cabeçalho desta ficha, ou `null` se nada foi. */
export function cabecalhoDaSessao(fichaId: string): CabecalhoDeFicha | null {
  return cabecalhosDeFicha.get(fichaId) ?? null;
}

/**
 * A FICHA COMPLETA — cenário mais tudo o que foi mexido nesta sessão.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A MESCLAGEM VIVE NO STORE, E NÃO NA TELA                    │
 * │                                                                    │
 * │ Se cada tela montasse o "ficha + alterações" por conta própria,     │
 * │ duas telas divergiriam no dia em que uma delas esquecesse de        │
 * │ aplicar o cabeçalho — e a ficha apareceria com rendimento diferente │
 * │ na lista e no detalhe.                                             │
 * │                                                                    │
 * │ Aqui a regra é uma só: os itens da sessão SUBSTITUEM os do cenário  │
 * │ quando existem (a lista inteira é reescrita de uma vez, porque é    │
 * │ assim que a tela edita), e o cabeçalho é MESCLADO campo a campo     │
 * │ (porque cada campo é salvo por uma ação diferente).                 │
 * └────────────────────────────────────────────────────────────────────┘
 */
export function fichaDaSessao(ficha: Ficha): Ficha {
  const itens = alteracoesDeFicha.get(ficha.id);
  const cabecalho = cabecalhosDeFicha.get(ficha.id);

  if (itens === undefined && cabecalho === undefined) return ficha;

  return {
    ...ficha,
    ...(cabecalho ?? {}),
    itens: itens === undefined ? ficha.itens : [...itens],
  };
}

/** A ficha foi mexida nesta sessão? */
export function fichaFoiAlterada(fichaId: string): boolean {
  return alteracoesDeFicha.has(fichaId) || cabecalhosDeFicha.has(fichaId);
}

/** A ficha acabou de ser criada nesta sessão, e ainda não está no cenário. */
export function fichaDaSessaoNova(fichaId: string): boolean {
  return fichasNovas.some((f) => f.id === fichaId);
}

/** As fichas criadas nesta sessão, na ordem em que entraram. */
export function fichasDaSessao(): readonly Ficha[] {
  return fichasNovas;
}

/**
 * Cria uma ficha nesta sessão.
 *
 * O chamador monta a ficha inteira. O store guarda — e separa as novas das
 * alteradas, porque as duas aparecem em lugares diferentes: a nova entra no
 * topo da lista como item próprio, a alterada substitui uma linha que já
 * estava lá.
 */
/**
 * QUEM ASSINA O QUE ESTE STORE GRAVA.
 *
 * Antes esta frase era uma constante privada em DUAS telas — `nova.tsx` e
 * `detalhe.tsx` — cada uma com a sua cópia. Duas cópias da mesma assinatura
 * concordam hoje e divergem no dia em que alguém corrigir a redação numa
 * delas; o histórico passaria a ter duas assinaturas diferentes para o mesmo
 * trabalho, e a diferença não significaria nada.
 *
 * A frase não é um nome próprio de propósito: ela registra que a alteração
 * veio desta sessão de trabalho, sem atribuí-la a uma pessoa que não a fez.
 */
export const ASSINATURA_DA_SESSAO = "sessão de trabalho";

/**
 * UM ID QUE NÃO COLIDE COM OS DO CENÁRIO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O PREFIXO É A DECLARAÇÃO DE QUE O REGISTRO NÃO ESTÁ NO BANCO          │
 * │                                                                      │
 * │ Todo id do cenário começa com `in_` (insumo) ou `fi_` (ficha). Um id  │
 * │ de sessão começa com `in_demo_` / `fi_demo_` — e é por esse prefixo    │
 * │ que as telas decidem "isto é do cenário ou acabou de nascer?".        │
 * │                                                                      │
 * │ É a mesma ideia do "excluído é anotado, e não removido": o id carrega  │
 * │ a procedência, e quem lê não precisa perguntar ao servidor.           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE MORA AQUI, E NÃO EM CADA TELA                            │
 * │                                                                      │
 * │ Ele existia DUAS VEZES: uma em `fichas/nova.tsx` (`fi_demo_`) e uma    │
 * │ em `ingredientes/novo.tsx` (`in_demo_`). O corpo das duas era o mesmo  │
 * │ slug, caractere por caractere; só o prefixo mudava.                   │
 * │                                                                      │
 * │ Duas cópias de uma regra de identidade é uma divergência agendada — e  │
 * │ o sintoma, quando ela chega, é cruel: o registro existe, mas NENHUMA   │
 * │ tela o reconhece como seu. Ele fica invisível, e o botão parece não    │
 * │ ter funcionado.                                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A HORA SOZINHA NÃO BASTA                                    │
 * │                                                                      │
 * │ A primeira versão terminava com `Date.now().toString(36)` e pronto.   │
 * │ A bancada mostrou o defeito: `Date.now()` tem resolução de            │
 * │ MILISSEGUNDO, então duas chamadas no mesmo milissegundo devolvem o     │
 * │ MESMO id.                                                            │
 * │                                                                      │
 * │ E o estrago é silencioso: `criarFicha` acrescenta a lista, e a lista   │
 * │ passa a ter dois itens com o mesmo id. A lista do React usa o id como  │
 * │ `key`; dois iguais fazem o React reaproveitar o mesmo nó, e uma das    │
 * │ duas fichas some da tela sem que ninguém tenha apagado nada.          │
 * │                                                                      │
 * │ Hoje o clique humano não alcança isso. Mas "não alcança hoje" não é    │
 * │ garantia — e a função promete unicidade, então ela tem de entregar.    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O sufixo é a hora em base 36 MAIS um contador da sessão. A hora separa
 * duas sessões (e dois recarregamentos); o contador separa duas chamadas
 * dentro da mesma sessão, que é o caso que a hora não separa.
 *
 * O CONTADOR NÃO É ZERADO POR `limparDemonstracao`, E ISSO É DELIBERADO.
 * Zerá-lo traria a colisão de volta: limpar e criar no mesmo milissegundo
 * devolveria exatamente o id anterior — e a lista, recém-limpa, receberia um
 * id que ela já tinha visto.
 */
let contadorDeId = 0;

/**
 * O prefixo declara QUAL ESPÉCIE de registro o id identifica.
 *
 * `in` insumo, `fi` ficha, `ca` cardápio, `se` seção, `it` item de cardápio,
 * `pe` pessoa da equipe, `tr` treinamento, `bi` material da biblioteca.
 * O prefixo aparece no id e é o que permite, numa lista que mistura espécies,
 * saber de que se está falando sem consultar mais nada — e é por isso que ele
 * é um `union` fechado, e não uma `string`: um prefixo inventado numa tela
 * deixaria de ser reconhecível por todo o resto.
 *
 * `it` e `in` diferem por uma letra, e é de propósito — os dois nomes são os
 * naturais para "item" e "insumo". Quem lê o id separa os dois pelo `_demo_`
 * que vem depois: `it_demo_…` contra `in_demo_…`. `bi` não colide com nenhum
 * dos dois, mas é a mesma escolha de duas letras do nome natural.
 */
export type PrefixoDaSessao = "in" | "fi" | "ca" | "se" | "it" | "pe" | "tr" | "bi";

export function idDaSessao(prefixo: PrefixoDaSessao, nome: string): string {
  const slug = nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);

  contadorDeId += 1;
  return `${prefixo}_demo_${slug || "registro"}_${Date.now().toString(36)}_${contadorDeId.toString(36)}`;
}

/**
 * OS IDS DE UMA CÓPIA — a função que a tela injeta em `duplicarCardapio`.
 *
 * Existe para que a tela não chame `idDaSessao` num laço — e, mais
 * importante, para que a decisão de COMO um id de cópia se parece continue
 * morando aqui. A tela diz a espécie e a quantidade; o formato é deste
 * arquivo.
 *
 * A ordem dos argumentos é a da injeção: `duplicarCardapio` chama
 * `montarIds("se", n)` e `montarIds("it", n)`. Manter as duas assinaturas
 * idênticas é o que permite passar esta função direto, sem uma lambda de
 * adaptação — e uma lambda de adaptação é onde os dois argumentos trocam de
 * lugar sem que ninguém perceba.
 *
 * O nome que entra no slug é o da espécie (`secao`, `item`), e não o da seção:
 * o slug é para quem lê o id conseguir dizer o que ele é, e "secao" diz isso
 * melhor do que "entradas". O que distingue uma seção da outra é o sufixo.
 */
export function idsDeCopia(
  especie: "se" | "it",
  quantidade: number
): readonly string[] {
  return Array.from({ length: quantidade }, () =>
    idDaSessao(especie, especie === "se" ? "secao" : "item")
  );
}

export function criarFicha(ficha: Ficha): void {
  fichasNovas = [...fichasNovas, ficha];
  avisar();
}

/**
 * DUPLICA UMA FICHA — o segundo prato que começa do primeiro.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE                                                  │
 * │                                                                      │
 * │ Um acervo de restaurante é feito de variações. "Costela ao molho      │
 * │ madeira" e "costela ao vinho" diferem em dois insumos e mais nada;    │
 * │ reescrever trinta linhas para chegar à segunda é o caminho mais       │
 * │ longo, e é o que se faz hoje.                                         │
 * │                                                                      │
 * │ E há uma razão a mais, que é de conta e não de conveniência: a cópia  │
 * │ NASCE CALCULANDO. Os itens apontam para os mesmos insumos da          │
 * │ biblioteca, com a mesma etapa de peso e a mesma quantidade — então o  │
 * │ custo dela já aparece montado, e o que ela fizer a partir dali é      │
 * │ divergência visível, e não uma soma refeita do zero.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ELA **NÃO** COPIA                                              │
 * │                                                                      │
 * │ O HISTÓRICO. Ele é a ata do que aconteceu com a ficha ORIGINAL —      │
 * │ quem mexeu, quando, e por causa de quê. Uma cópia que herdasse essas  │
 * │ linhas afirmaria que passou por coisas que nunca aconteceram com ela, │
 * │ e o rastro perderia exatamente o valor que ele tem: distinguir o que  │
 * │ foi decidido naquele prato do que só estava lá quando ele foi criado. │
 * │                                                                      │
 * │ A cópia começa com UMA linha, dizendo de onde ela veio. É a única     │
 * │ coisa que se sabe sobre ela, e por isso é a única que se escreve.     │
 * │                                                                      │
 * │ O `id`, porque identidade não se copia. E `atualizadaEm`, porque a    │
 * │ data da outra não descreve esta.                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O `id` novo chega de fora, e não é gerado aqui. O prefixo `fi_demo_` — que
 * declara "esta ficha não está no banco" — é uma decisão da tela, e `nova.tsx`
 * já a toma num só lugar. Uma segunda função de id neste arquivo seria a
 * segunda chance de as duas discordarem.
 *
 * O que é a cópia, hoje, a tela declara em voz alta: ela existe nesta sessão,
 * e o banco ainda não a guarda.
 */
export function duplicarFicha(origem: Ficha, idDoNovo: string): Ficha {
  const agora = new Date();

  const copia: Ficha = {
    ...origem,
    id: idDoNovo,
    /*
      A MARCA NO NOME É O QUE RESTA DEPOIS DO AVISO.

      O recado de "nesta sessão" aparece na lista, mas some quando o banco
      existir. O nome fica. Sem ele, duas fichas com o nome do mesmo prato
      apareceriam lado a lado no acervo — e nada no registro diria qual delas
      foi derivada da outra.
    */
    nome: `${origem.nome} (cópia)`,
    /*
      Os itens são copiados UM A UM. Guardar as mesmas referências faria a
      cópia e a original compartilharem a linha: editar a quantidade numa
      mexeria na outra, e a divergência seria silenciosa.
    */
    itens: origem.itens.map((item) => ({ ...item })),
    modoPreparo: [...origem.modoPreparo],
    finalizacao: [...origem.finalizacao],
    atualizadaEm: agora,
    historico: [
      {
        em: agora,
        oQue: `Criada como cópia de "${origem.nome}".`,
        quem: ASSINATURA_DA_SESSAO,
      },
    ],
  };

  criarFicha(copia);
  return copia;
}

/**
 * Grava o cabeçalho mexido, MESCLANDO com o que já havia.
 *
 * A mesclagem não é detalhe: a tela salva um campo por vez — o rendimento
 * numa ação, a observação em outra. Substituir o objeto inteiro faria salvar
 * o rendimento apagar a observação editada antes, e o rastro disso é uma
 * perda silenciosa de trabalho.
 */
export function salvarCabecalhoDaFicha(
  fichaId: string,
  alteracao: CabecalhoDeFicha
): void {
  cabecalhosDeFicha.set(fichaId, {
    ...(cabecalhosDeFicha.get(fichaId) ?? {}),
    ...alteracao,
  });
  avisar();
}

// ---------------------------------------------------------------------------
// Cliente — cadastro e início do atendimento
// ---------------------------------------------------------------------------

/** O cliente completo — cenário mais o que foi corrigido nesta sessão. */
export function clienteDaSessao(cliente: Cliente): Cliente {
  const cadastro = cadastrosDeCliente.get(cliente.id);
  const inicio = inicioDoAtendimento.get(cliente.id);

  if (cadastro === undefined && inicio === undefined) return cliente;

  return {
    ...cliente,
    ...(cadastro ?? {}),
    ...(inicio === undefined ? {} : { iniciadoEm: inicio }),
  };
}

/**
 * Grava o cadastro do cliente, MESCLANDO com o que já havia.
 *
 * Mesma regra de `salvarCabecalhoDaFicha`, e pelo mesmo motivo: os campos
 * são salvos por ações diferentes — a situação muda numa gaveta, o telefone
 * noutra. Substituir o objeto inteiro faria corrigir o telefone apagar a
 * situação mudada cinco minutos antes, e o rastro disso é uma perda
 * silenciosa de trabalho que a tela não teria como explicar.
 */
export function salvarCadastroDoCliente(
  clienteId: string,
  alteracao: DadosDoCadastro
): void {
  cadastrosDeCliente.set(clienteId, {
    ...(cadastrosDeCliente.get(clienteId) ?? {}),
    ...alteracao,
  });
  avisar();
}

/**
 * Corrige a data de início do atendimento.
 *
 * Separado de `salvarCadastroDoCliente` de propósito. As duas gravações são
 * de naturezas diferentes — uma corrige um texto, a outra mexe no começo da
 * história — e quem for auditar o que a sessão mexeu precisa conseguir
 * distingui-las sem abrir o valor.
 */
export function salvarInicioDoAtendimento(clienteId: string, em: Date): void {
  inicioDoAtendimento.set(clienteId, em);
  avisar();
}

/** O cadastro foi mexido nesta sessão? A tela pergunta para poder avisar. */
export function cadastroDoClienteFoiAlterado(clienteId: string): boolean {
  return cadastrosDeCliente.has(clienteId) || inicioDoAtendimento.has(clienteId);
}

/**
 * A CARTEIRA INTEIRA — cenário mais as correções desta sessão.
 *
 * Existe porque a lista e o detalhe precisam contar a MESMA história. Se
 * cada um aplicasse a sobreposição por conta própria, o dia em que um
 * esquecesse faria a carteira mostrar um nome e o cliente abrir com outro.
 *
 * Trabalha sobre `LinhaCliente` porque é o que a lista carrega: aplicar a
 * sobreposição ao cliente de dentro da linha é exatamente o que faz o nome
 * corrigido subir para a carteira sem tocar em nada mais.
 */
export function carteiraDaSessao<
  L extends { cliente: Cliente },
>(linhas: readonly L[]): readonly L[] {
  if (cadastrosDeCliente.size === 0 && inicioDoAtendimento.size === 0) {
    return linhas;
  }

  return linhas.map((l) => ({ ...l, cliente: clienteDaSessao(l.cliente) }));
}

// ---------------------------------------------------------------------------
// Preços de cliente — leitura em lote
// ---------------------------------------------------------------------------

/**
 * Os preços de cliente mexidos nesta sessão, indexados por insumo.
 *
 * Existe para a ficha resolver N linhas sem N chamadas. Quem chama sobrepõe
 * isto ao mapa vindo do repositório — o repositório traz o cenário, este mapa
 * traz o que foi digitado por cima.
 */
export function precosDeClienteDaSessao(
  clienteId: string,
  /** A unidade do insumo na biblioteca. Sem ela, o valor sai sem unidade. */
  unidadeDoInsumo: (ingredienteId: string) => string | null
): ReadonlyMap<string, IngredienteDoCliente> {
  const prefixo = `${clienteId}__`;
  const mapa = new Map<string, IngredienteDoCliente>();

  for (const [chave, estado] of precosDeCliente) {
    if (!chave.startsWith(prefixo)) continue;
    const ingredienteId = chave.slice(prefixo.length);
    mapa.set(ingredienteId, {
      id: `demo-cli-${chave}`,
      clienteId,
      ingredienteId,
      /*
        A unidade vem da BIBLIOTECA, e não do que foi digitado.

        Esta é a regra do §6: a unidade de um insumo é propriedade do insumo,
        não do preço. Um cliente que compra em quilo e outro que compra em
        caixa compram o MESMO insumo, e deixar a unidade vir do preço faria o
        cadastro de um cliente redefinir o insumo para todos. O valor que a
        consultora digita é o preço; a grandeza em que ele é medido já está
        decidida.
      */
      unidade: unidadeDoInsumo(ingredienteId) ?? estado.atual.unidade,
      precoAtual: estado.atual.valor,
      fornecedor: estado.atual.fornecedor,
      atualizadoEm: estado.atual.em,
      historico: [estado.atual, ...estado.historico],
      /* Vazio de propósito: a observação do cliente é do cenário, e o que se
         digita aqui é preço. Quem exibe mantém a observação que já tinha. */
      observacoes: "",
    });
  }

  return mapa;
}
