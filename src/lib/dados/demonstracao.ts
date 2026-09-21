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
    eventosDaSessao.length > 0
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

export function idDaSessao(prefixo: "in" | "fi", nome: string): string {
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
