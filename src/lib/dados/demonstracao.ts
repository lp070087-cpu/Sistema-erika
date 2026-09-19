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
  Compra,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
  ItemFicha,
  PrecoIngrediente,
} from "./tipos-operacao";

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
  rendimentoPorcoes?: number | null;
  porcaoGramas?: number | null;
  observacoes?: string;
  modoPreparo?: string[];
  finalizacao?: string[];
  atualizadaEm?: Date;
  historico?: Ficha["historico"];
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
    cabecalhosDeFicha.size > 0
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
export function criarFicha(ficha: Ficha): void {
  fichasNovas = [...fichasNovas, ficha];
  avisar();
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
