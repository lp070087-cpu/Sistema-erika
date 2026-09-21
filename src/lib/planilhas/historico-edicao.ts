/**
 * AS PILHAS DE DESFAZER E REFAZER DA PLANILHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM MÓDULO PURO, E NÃO UM `useState` NA TELA           │
 * │                                                                      │
 * │ A regra que decide o que é "uma operação" é a parte difícil, e ela    │
 * │ não deveria depender de componente nenhum para ser verificada. Aqui   │
 * │ não há React: há uma pilha `passado / presente / futuro` e funções     │
 * │ que a movem. Isso permite conferi-la por execução — e é o que os       │
 * │ testes de desfazer fazem.                                            │
 * │                                                                      │
 * │ A tela guarda o histórico num `useRef` e chama estas funções. A       │
 * │ alternativa — guardar a pilha no estado do React — criaria um         │
 * │ problema sem solução: o histórico guarda o estado ANTERIOR, e cada     │
 * │ `aplicar` mudaria o histórico, que por sua vez re-renderizaria, que    │
 * │ por sua vez chamaria `aplicar`. Aqui não: só o `presente` é estado.    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ENTRADA COMPLETA É UMA OPERAÇÃO                                     │
 * │                                                                      │
 * │ O briefing é explícito: escrever BATATA não pode virar seis operações.│
 * │ A tentação é escutar cada tecla; o resultado é que um Ctrl+Z tira uma  │
 * │ letra, o que não é desfazer — é backspace.                            │
 * │                                                                      │
 * │ O que entra na pilha é o que `aoEditar` recebe: o valor CONFIRMADO,    │
 * │ quando o Enter, o Tab ou o clique fora fecham a edição. Enquanto se    │
 * │ digita, não há operação nenhuma sendo registrada — o texto vive no     │
 * │ estado local do campo, e não neste módulo. É por isso que BATATA entra │
 * │ como UMA operação, sem que nada aqui precise agrupar teclas.          │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ E DUAS EDIÇÕES CONFIRMADAS NA MESMA CÉLULA?                      │ │
 * │ │                                                                  │ │
 * │ │ São DUAS operações. Cada confirmação é um passo do trabalho, e o   │ │
 * │ │ desfazer volta um passo de cada vez: BATATA → BATATA INGLESA →     │ │
 * │ │ um Ctrl+Z devolve BATATA, o segundo devolve o vazio.               │ │
 * │ │                                                                  │ │
 * │ │ Isto foi decidido contra a alternativa óbvia — juntar as duas numa │ │
 * │ │ operação só porque são do mesmo endereço —, e a razão é o TESTE 3  │ │
 * │ │ do briefing: ele pede exatamente que o primeiro desfazer devolva    │ │
 * │ │ BATATA. Um desfazer que pula direto para o vazio não é mais rápido; │ │
 * │ │ é um desfazer que pulou um estado que ela quis ter.                │ │
 * │ │                                                                  │ │
 * │ │ O agrupamento que o briefing recusa é o das TECLAS, e esse morre    │ │
 * │ │ na porta de entrada — o campo de edição só avisa a planilha uma vez,│ │
 * │ │ quando fecha.                                                     │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O `futuro` é descartado por `registrar` — é o comportamento convencional:
 * depois de desfazer, editar de novo abandona a linha de tempo que havia sido
 * desfeita. Sem isso, o refazer devolveria um valor que não é o próximo de
 * nada, e a planilha passaria a mentir.
 */

/** O que a operação fez — só para o rótulo e para o agrupamento. */
export type TipoDeOperacao =
  | "celula"
  | "pincel"
  | "linha"
  | "folha"
  | "importacao";

/**
 * EM QUAL MAPA DA TELA A OPERAÇÃO ESCREVE.
 *
 * A Central guarda dois mapas: `edicoes` (o que foi digitado, por endereço) e
 * `pincel` (o que foi pintado, por endereço). Eles têm o mesmo formato de
 * chave, então "em qual dos dois" não se deduz da chave — precisa ser dito.
 *
 * A alternativa seria um prefixo na chave (`"pincel::Ficha::A4"`), e ela é
 * pior: o prefixo viraria parte da chave em todo lugar que a monta, e um dia
 * alguém compararia a chave com prefixo contra a chave sem, e a operação
 * cairia no mapa errado. Carregar o destino é uma palavra a mais e não tem
 * como dar errado.
 */
export type DestinoDaOperacao = "edicoes" | "pincel";

/**
 * UMA OPERAÇÃO DO HISTÓRICO.
 *
 * `antes` e `depois` são MAPAS PARCIAIS: as chaves tocadas, com o valor que
 * tinham e o valor que passaram a ter. Não é o estado inteiro da planilha, e é
 * de propósito — guardar a grade toda a cada operação faria o desfazer de uma
 * célula também devolver ao passado as células que ela não tocou, inclusive as
 * que foram editadas depois. O parcial é o que mantém cada operação no seu
 * quadrado.
 */
export type Operacao = {
  /**
   * O que a operação tocou — o endereço da célula, ou o da marcação.
   *
   * Ele identifica o alvo no DIAGNÓSTICO: quando duas operações seguidas
   * parecem se anular, é a chave repetida que mostra que foram duas edições na
   * mesma célula, e não uma edição que se perdeu.
   */
  chave: string;
  tipo: TipoDeOperacao;
  destino: DestinoDaOperacao;
  /** O rótulo que aparece no `title` do botão — ela não vê o dado, vê o gesto. */
  rotulo: string;
  antes: Record<string, unknown>;
  depois: Record<string, unknown>;
};

/** O histórico fechado, como as funções devolvem. */
export type Historico = {
  passado: readonly Operacao[];
  futuro: readonly Operacao[];
};

/**
 * O TETO DE OPERAÇÕES GUARDADAS.
 *
 * Não é sobre memória — é sobre o `Ctrl+Z` sem fundo. Uma pilha infinita faz o
 * desfazer voltar a um estado que ela não reconhece mais, com o risco de
 * desfazer sem perceber uma edição que valia. Noventa é folgado para uma
 * sessão de trabalho e curto o bastante para o fundo ser alcançável.
 */
export const LIMITE_DO_HISTORICO = 90;

/** O histórico vazio — o estado inicial de uma planilha recém-aberta. */
export const SEM_HISTORICO: Historico = { passado: [], futuro: [] };

/**
 * Registra uma operação nova, descartando o futuro.
 *
 * Uma operação por chamada, sem agrupar com a anterior — ver o bloco no topo
 * do arquivo: duas confirmações na mesma célula são dois passos, e o desfazer
 * volta um de cada vez. O `antes` de cada uma já guarda o estado da sua
 * própria vez, então cada passo sabe para onde voltar sozinho.
 */
export function registrar(historico: Historico, operacao: Operacao): Historico {
  const passado = [...historico.passado, operacao];

  return {
    passado: passado.length > LIMITE_DO_HISTORICO ? passado.slice(-LIMITE_DO_HISTORICO) : passado,
    // Editar depois de desfazer abandona o que foi desfeito. É convencional.
    futuro: [],
  };
}

/** Há o que desfazer? */
export function podeDesfazer(historico: Historico): boolean {
  return historico.passado.length > 0;
}

/** Há o que refazer? */
export function podeRefazer(historico: Historico): boolean {
  return historico.futuro.length > 0;
}

/** A operação que o desfazer vai desfazer, sem desfazê-la. */
export function proximaDoDesfazer(historico: Historico): Operacao | null {
  return historico.passado[historico.passado.length - 1] ?? null;
}

/** A operação que o refazer vai refazer, sem refazê-la. */
export function proximaDoRefazer(historico: Historico): Operacao | null {
  return historico.futuro[historico.futuro.length - 1] ?? null;
}

/**
 * Desfaz: a última do passado vai para o futuro, e devolve o `antes` dela.
 *
 * Devolver `null` é "não havia o que desfazer" — e é diferente de desfazer e
 * devolver um estado vazio: a chamada não muda nada, e quem chamou não deve
 * aplicar nada.
 */
export function desfazer(historico: Historico): { historico: Historico; operacao: Operacao } | null {
  const operacao = proximaDoDesfazer(historico);
  if (operacao === null) return null;

  return {
    operacao,
    historico: {
      passado: historico.passado.slice(0, -1),
      futuro: [...historico.futuro, operacao],
    },
  };
}

/** Refaz: a última do futuro volta para o passado, e devolve o `depois` dela. */
export function refazer(historico: Historico): { historico: Historico; operacao: Operacao } | null {
  const operacao = proximaDoRefazer(historico);
  if (operacao === null) return null;

  return {
    operacao,
    historico: {
      passado: [...historico.passado, operacao],
      futuro: historico.futuro.slice(0, -1),
    },
  };
}

/**
 * Monta a operação a partir do que foi tocado.
 *
 * `parcial` é um mapa parcial de chave → valor, do jeito que a tela guarda
 * (`edicoes` e `pincel` são mapas). Ele é comparado campo a campo com o valor
 * que já está lá: só entra no `antes` o que de fato vai mudar. O resto é ruído,
 * e ruído no histórico faz o desfazer parecer que não funcionou — ele volta a
 * um estado que é idêntico ao atual, e ela aperta de novo.
 */
export function operacaoDeMapa(
  tipo: TipoDeOperacao,
  destino: DestinoDaOperacao,
  chave: string,
  rotulo: string,
  atual: Readonly<Record<string, unknown>> | null,
  parcial: Record<string, unknown>
): Operacao {
  const antes: Record<string, unknown> = {};
  const depois: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(parcial)) {
    const anterior = atual?.[k];
    if (anterior === v) continue;
    // `null` no `antes` é "não havia nada", e o desfazer apaga a chave com ele.
    antes[k] = anterior ?? null;
    depois[k] = v;
  }

  return { chave, tipo, destino, rotulo, antes, depois };
}

/**
 * Monta a operação de apagar uma chave — o caso do "limpar formatação".
 *
 * Ele não tem `depois`: o que a operação faz é REMOVER. O `antes` guarda o que
 * estava lá para o desfazer poder devolver, e o `null` no `depois` é o sinal
 * que `aplicarParcial` lê para apagar em vez de escrever.
 */
export function operacaoDeRemocao(
  tipo: TipoDeOperacao,
  destino: DestinoDaOperacao,
  chave: string,
  rotulo: string,
  atual: Readonly<Record<string, unknown>>
): Operacao | null {
  // Nada a apagar: devolver uma operação vazia encheria o histórico de passos
  // que não fazem nada, e o Ctrl+Z passaria a "não funcionar" de vez em quando.
  if (Object.keys(atual).length === 0) return null;

  return {
    chave,
    tipo,
    destino,
    rotulo,
    antes: { ...atual },
    depois: Object.fromEntries(Object.keys(atual).map((k) => [k, null])),
  };
}
