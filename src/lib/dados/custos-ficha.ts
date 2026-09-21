/**
 * O CUSTO DA FICHA — a soma do que dá para somar, e a lista do que não dá.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO DEVOLVE MAIS DO QUE UM NÚMERO                    │
 * │                                                                      │
 * │ A resposta fácil seria `custoTotal: number`. Ela esconderia três       │
 * │ coisas que a consultora precisa ver:                                  │
 * │                                                                      │
 * │   1. QUAIS linhas entraram na soma. Uma soma que ignora em silêncio    │
 * │      uma linha sem preço dá um total MENOR do que a realidade, e o     │
 * │      número sai com a mesma aparência de um número certo.             │
 * │                                                                      │
 * │   2. QUANTO FALTA. Se três das sete linhas não têm preço, o total      │
 * │      existe e está errado para baixo. A tela precisa poder dizer       │
 * │      "R$ 48,20 com 3 linhas fora" em vez de mostrar R$ 48,20 sozinho.  │
 * │                                                                      │
 * │   3. POR QUE cada linha ficou de fora. "Sem preço do insumo" e "o      │
 * │      insumo não foi pesado depois de cozinhar" pedem coisas            │
 * │      diferentes dela — a primeira é uma compra a registrar, a          │
 * │      segunda é uma balança.                                            │
 * │                                                                      │
 * │ Por isso todo item sai com o próprio estado, e o resumo carrega a      │
 * │ contagem do que faltou.                                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import {
  custoDaQuantidade,
  custoPorEtapa,
  derivarTransformacao,
  type CustoPorEtapa,
} from "./custos";
import type {
  EstadoCalculoItem,
  EtapaPeso,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
  ItemFicha,
} from "./tipos-operacao";

// ---------------------------------------------------------------------------
// Leitura de quantidade declarada
// ---------------------------------------------------------------------------

/**
 * Lê a quantidade escrita na ficha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA FUNÇÃO MUDOU DE CASA                                    │
 * │                                                                      │
 * │ Ela nasceu aqui, com leitor próprio, e o editor de preço da          │
 * │ biblioteca tinha outro — parecidos o bastante para ninguém notar, e   │
 * │ diferentes nos casos de borda. "1.200" era lido como mil e duzentos    │
 * │ num campo e como um vírgula dois no outro.                            │
 * │                                                                      │
 * │ A função agora mora em `./numeros`, junto com o resto da leitura      │
 * │ numérica, e continua sendo exportada daqui porque dez telas a          │
 * │ importam deste caminho. Trocar o import em dez arquivos só para       │
 * │ mudar o endereço de uma função seria mexer em dez lugares para não     │
 * │ resolver nada.                                                        │
 * │                                                                      │
 * │ O que a ficha ganha com a mudança é a única coisa que importava: a     │
 * │ MESMA resposta que os outros campos do sistema dão para a mesma        │
 * │ digitação.                                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O import e a reexportação são dois comandos porque são coisas diferentes:
 * o import traz o nome para uso DENTRO deste arquivo (o `resolverItem`
 * abaixo chama a função); a reexportação é o que mantém o caminho antigo
 * funcionando para quem importava daqui. Só a reexportação não cria
 * vínculo local nenhum — e a falta dele quebra na primeira linha que usar
 * a função, que é exatamente o que aconteceu.
 */
import { lerQuantidade } from "./numeros";

export { lerQuantidade };

// ---------------------------------------------------------------------------
// O item da ficha, resolvido
// ---------------------------------------------------------------------------

/**
 * UMA LINHA DA FICHA, DEPOIS DE TODAS AS LIGAÇÕES RESOLVIDAS.
 *
 * `precoEfetivo` já é o preço certo para o par (cliente, insumo): o preço do
 * cliente quando existe, o da biblioteca quando não. Esta resolução acontece
 * AQUI, uma vez, e não em cada tela — uma tela que esquecesse de procurar o
 * preço do cliente mostraria o custo de outro cliente sem avisar.
 */
export type ItemResolvido = {
  item: ItemFicha;
  ingrediente: Ingrediente | null;
  /** Preço por unidade de compra que a linha REALMENTE usa. */
  precoEfetivo: number | null;
  /** De onde veio o preço resolvido. A tela mostra isso ao lado do número. */
  origemDoPreco: "CLIENTE" | "BIBLIOTECA" | "FICHA" | "AUSENTE";
  /*
    ── O PREÇO QUE VALE HOJE, AO LADO DO QUE A FICHA GUARDOU ─────────────

    `precoAtual` é o preço corrente (cliente, quando houver; senão a
    biblioteca). Ele NÃO entra no custo — quem entra é `precoEfetivo`, que
    para uma ficha com preço guardado é o preço do DIA em que ela foi escrita.

    Estes dois campos existem para tornar visível a única coisa que a ficha
    não pode esconder: que o preço mudou desde que ela foi montada. Sem eles
    a alta viraria custo novo em silêncio; com eles, a tela mostra quanto
    subiu e oferece a ação de atualizar — que é uma decisão dela, e não um
    efeito colateral de abrir a ficha.
  */
  precoAtual: number | null;
  /** `true` quando o preço de hoje difere do preço guardado na linha. */
  precoMudou: boolean;
  /** Quanto o custo da linha mudaria se o preço de hoje passasse a valer. */
  custoAtual: number | null;
  /** Fornecedor efetivo do par, quando houver. */
  fornecedor: string;
  /** Os pesos medidos deste insumo, derivados. */
  transformacao: ReturnType<typeof derivarTransformacao>;
  /** O custo por unidade em cada etapa. */
  custos: CustoPorEtapa;
  /** Quantidade lida, ou `null` quando o texto não é número. */
  quantidade: number | null;
  /** O que impede esta linha de entrar na soma. Vazio quando entrou. */
  estado: EstadoCalculoItem;
  /** O custo desta linha. `null` quando não entrou na soma. */
  custo: number | null;
};

/**
 * Resolve UMA linha da ficha.
 *
 * A ordem das verificações não é arbitrária: cada uma devolve o motivo mais
 * ESPECÍFICO que se aplica. Dizer "sem preço" para uma linha cuja quantidade
 * é "a gosto" mandaria a consultora cadastrar um preço que não resolveria
 * nada.
 */
export function resolverItem(
  item: ItemFicha,
  ingrediente: Ingrediente | null,
  doCliente: IngredienteDoCliente | null
): ItemResolvido {
  const quantidade = lerQuantidade(item.quantidade);

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ O PREÇO DA FICHA GANHA DO PREÇO DE HOJE — E ISSO FOI UMA CORREÇÃO     │
    │                                                                      │
    │ O comentário aqui EM CIMA sempre disse isto: "a ficha vem ANTES da    │
    │ biblioteca de propósito; substituí-lo pelo preço de hoje apagaria     │
    │ justamente o registro que permite ver o efeito de uma alta depois".  │
    │                                                                      │
    │ E o código ABAIXO dizia o contrário. Os três `if` eram independentes, │
    │ então o ÚLTIMO que casasse vencia: a biblioteca sobrescrevia a ficha, │
    │ e o cliente sobrescrevia os dois. O resultado é que a ficha seguia o  │
    │ preço de hoje calada. Batata a R$ 10 na criação, R$ 13 depois: a      │
    │ ficha passava a custar R$ 13 sem que ninguém tivesse pedido, e o      │
    │ documento histórico passava a afirmar que sempre custou R$ 13.        │
    │                                                                      │
    │ A ordem agora é explícita e tem dois planos separados:               │
    │                                                                      │
    │   O CUSTO usa `precoEfetivo` — o preço GUARDADO na linha, quando      │
    │   existe; senão o de hoje. É o retrato do dia em que a ficha foi      │
    │   montada, e não muda sozinho.                                       │
    │                                                                      │
    │   O PRESENTE vai em `precoAtual` / `custoAtual`, calculados à parte.  │
    │   Eles não entram no custo; existem para a tela poder dizer "o preço   │
    │   mudou", e para a ação explícita de ATUALIZAR CUSTOS ter para onde    │
    │   apontar.                                                            │
    │                                                                      │
    │ O preço do cliente continua na frente do da biblioteca: entre dois    │
    │ preços DE HOJE, o real daquele cliente é o mais específico.           │
    └──────────────────────────────────────────────────────────────────────┘
  */

  /** O preço corrente do par (cliente, insumo) — o "de hoje". */
  const precoDeHoje =
    doCliente?.precoAtual != null && doCliente.precoAtual > 0
      ? doCliente.precoAtual
      : ingrediente?.precoAtual != null && ingrediente.precoAtual > 0
        ? ingrediente.precoAtual
        : null;

  const guardadoNaLinha =
    item.precoReferencia !== null && item.precoReferencia > 0
      ? item.precoReferencia
      : null;

  let precoEfetivo: number | null;
  let origemDoPreco: ItemResolvido["origemDoPreco"];

  if (guardadoNaLinha !== null) {
    precoEfetivo = guardadoNaLinha;
    origemDoPreco = "FICHA";
  } else if (doCliente?.precoAtual != null && doCliente.precoAtual > 0) {
    precoEfetivo = doCliente.precoAtual;
    origemDoPreco = "CLIENTE";
  } else if (ingrediente?.precoAtual != null && ingrediente.precoAtual > 0) {
    precoEfetivo = ingrediente.precoAtual;
    origemDoPreco = "BIBLIOTECA";
  } else {
    precoEfetivo = null;
    origemDoPreco = "AUSENTE";
  }

  const transformacao = derivarTransformacao(ingrediente?.transformacao ?? null);
  const custos = custoPorEtapa(precoEfetivo, transformacao);

  /*
    O CUSTO DE HOJE — a mesma conta, com o preço corrente.

    Ele só é calculado quando o preço realmente mudou: comparar dois números
    iguais e chamar isso de "mudança" encheria a tela de avisos que não
    significam nada.
  */
  const precoMudou = guardadoNaLinha !== null && precoDeHoje !== null && precoDeHoje !== guardadoNaLinha;
  const custosDeHoje = precoMudou ? custoPorEtapa(precoDeHoje, transformacao) : null;

  const fornecedor = doCliente?.fornecedor || ingrediente?.fornecedor || "";

  /*
    ── A VERIFICAÇÃO DE UNIDADE ──────────────────────────────────────────
    O preço efetivo é por unidade de COMPRA do insumo (a unidade em que ele
    é comprado). A quantidade da ficha está na unidade em que ela foi
    pesada. Multiplicar "0,5 kg × R$ 47,90/L" daria um número sem significado
    — e com aparência perfeitamente normal.

    Só comparamos quando as duas unidades são conhecidas. Unidade ausente em
    qualquer das pontas faz a verificação ser PULADA, e não falhar: uma
    ficha declarada sem unidade não é um erro de unidade.
  */
  const unidadeIngrediente = doCliente?.unidade || ingrediente?.unidade || "";
  const unidadesDivergem = unidadeCompativel(item.unidade, unidadeIngrediente);

  let estado: EstadoCalculoItem = "OK";
  let custo: number | null = null;

  if (quantidade === null) {
    estado = "QUANTIDADE_ILEGIVEL";
  } else if (precoEfetivo === null) {
    estado = "SEM_PRECO";
  } else if (unidadesDivergem === false) {
    estado = "SEM_UNIDADE_COMPATIVEL";
  } else {
    const r = custoDaQuantidade(quantidade, item.etapa, custos);
    if (r === null) {
      estado = "SEM_PESO_ETAPA";
    } else {
      custo = r.valor;
    }
  }

  /*
    O MESMO CÁLCULO, COM O PREÇO DE HOJE.

    `custoAtual` não substitui `custo` — ele é a resposta para "quanto esta
    linha custaria se a ficha fosse montada hoje?", e só existe quando a
    pergunta faz sentido (o preço mudou E a linha é calculável). Numa ficha
    cujo preço não mudou, os dois números seriam idênticos e a tela não teria
    nada a dizer.
  */
  let custoAtual: number | null = null;
  if (custosDeHoje !== null && estado === "OK" && quantidade !== null) {
    custoAtual = custoDaQuantidade(quantidade, item.etapa, custosDeHoje)?.valor ?? null;
  }

  return {
    item,
    ingrediente,
    precoEfetivo,
    origemDoPreco,
    precoAtual: precoDeHoje,
    precoMudou,
    custoAtual,
    fornecedor,
    transformacao,
    custos,
    quantidade,
    estado,
    custo,
  };
}

/**
 * As unidades combinam?
 *
 * `true` — combinam (mesma unidade, ou mesma família com conversão de escala).
 * `false` — divergem, e a linha não pode ser multiplicada.
 * `null` — não dá para julgar, porque falta uma das duas. Quem chama trata
 *          `null` como "siga", para não bloquear uma ficha que só não
 *          declarou unidade.
 */
function unidadeCompativel(daFicha: string, doInsumo: string): boolean | null {
  const a = daFicha.trim();
  const b = doInsumo.trim();
  if (a === "" || b === "") return null;
  if (a === b) return true;

  /*
    Massa × massa e volume × volume combinam (kg e g são a mesma grandeza).
    Massa × volume NÃO combina: "kg de óleo" e "litro de óleo" são grandezas
    diferentes, e a ponte entre elas é a densidade — que é uma propriedade
    do produto, não uma conversão.

    Contagem ("un", "dúzia", "maço") não converte para peso: uma dúzia de
    ovos não tem quilo. Se a ficha declara em dúzia e o preço é por dúzia,
    as unidades são iguais e a conta já passou pelo primeiro `if`.
  */
  const familias = (u: string): "massa" | "volume" | null => {
    if (u === "kg" || u === "g") return "massa";
    if (u === "L" || u === "ml") return "volume";
    return null;
  };

  const fa = familias(a);
  const fb = familias(b);
  if (fa === null || fb === null) return false;
  return fa === fb;
}

// ---------------------------------------------------------------------------
// O resumo da ficha
// ---------------------------------------------------------------------------

/**
 * O QUE UMA FICHA CONSEGUE DIZER SOBRE O PRÓPRIO CUSTO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O TOTAL NÃO É "O CUSTO DA FICHA"                              │
 * │                                                                      │
 * │ `custoTotal` é a soma do que ENTROU. Se alguma linha ficou de fora,   │
 * │ o número é um PISO — um limite inferior do custo, não o custo.        │
 * │                                                                      │
 * │ `completo` é o campo que faz essa distinção chegar à tela. Quando é   │
 * │ `false`, quem exibe tem a obrigação de mostrar o total como parcial.  │
 * │ Sem esse campo, a tela mostraria R$ 48,20 com a mesma tipografia de   │
 * │ um total fechado, e ninguém saberia que três linhas ficaram fora.     │
 * │                                                                      │
 * │ É a mesma regra que governa o resto do sistema: ausência de dado não  │
 * │ vira número. Aqui, ela vira um número MARCADO.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type ResumoCustoFicha = {
  /** Soma do que entrou na conta. Piso do custo quando `completo` é falso. */
  custoTotal: number;
  /** Custo por porção, quando o rendimento foi declarado. */
  custoPorPorcao: number | null;
  /** Custo por quilo/grama do prato, quando o peso da porção foi declarado. */
  custoPorGrama: number | null;
  /** Quantas linhas entraram na soma. */
  itensSomados: number;
  /** Quantas ficaram de fora, e por quê. */
  itensFora: number;
  /** Agrupamento dos que ficaram fora, por motivo. */
  motivos: ReadonlyArray<{ estado: EstadoCalculoItem; quantidade: number }>;
  /** `true` só quando TODAS as linhas entraram. */
  completo: boolean;
  /** `true` quando não há linha nenhuma para somar. */
  vazio: boolean;
};

/**
 * Soma a ficha — e conta o que ficou de fora.
 *
 * Não arredonda nada. As duas casas decimais são assunto da EXIBIÇÃO, porque
 * arredondar aqui já seria escolher a regra de arredondamento da metodologia
 * antes de ela existir.
 */
export function somarFicha(resolvidos: readonly ItemResolvido[]): ResumoCustoFicha {
  let total = 0;
  let somados = 0;

  const contagem = new Map<EstadoCalculoItem, number>();

  for (const r of resolvidos) {
    if (r.custo === null) {
      contagem.set(r.estado, (contagem.get(r.estado) ?? 0) + 1);
    } else {
      total += r.custo;
      somados += 1;
    }
  }

  const fora = resolvidos.length - somados;

  return {
    custoTotal: total,
    custoPorPorcao: null,
    custoPorGrama: null,
    itensSomados: somados,
    itensFora: fora,
    motivos: [...contagem.entries()].map(([estado, quantidade]) => ({ estado, quantidade })),
    completo: fora === 0 && resolvidos.length > 0,
    vazio: resolvidos.length === 0,
  };
}

/**
 * O resumo completo, com o custo por porção.
 *
 * O custo por porção só existe quando há rendimento E o custo total está
 * fechado. Dividir um piso por 12 porções daria um número menor do que o
 * custo real da porção — e ele seria lido como o custo da porção, porque
 * teria exatamente a cara de um. Preferimos não ter o número.
 */
export function resumoDaFicha(
  resolvidos: readonly ItemResolvido[],
  ficha: Pick<Ficha, "rendimentoPorcoes" | "porcaoGramas">
): ResumoCustoFicha {
  const base = somarFicha(resolvidos);

  const porcoes =
    ficha.rendimentoPorcoes !== null && ficha.rendimentoPorcoes > 0
      ? ficha.rendimentoPorcoes
      : null;

  return {
    ...base,
    custoPorPorcao:
      base.completo && porcoes !== null ? base.custoTotal / porcoes : null,
    custoPorGrama:
      base.completo && ficha.porcaoGramas !== null && ficha.porcaoGramas > 0
        ? base.custoTotal / (porcoes !== null ? porcoes * ficha.porcaoGramas : ficha.porcaoGramas)
        : null,
  };
}

/**
 * QUANTO A FICHA MUDARIA SE OS PREÇOS DE HOJE PASSASSEM A VALER.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A CONTA EXISTE PARA A AÇÃO SER **CONSCIENTE E VISÍVEL**              │
 * │                                                                      │
 * │ O custo guardado de uma ficha é um retrato: ele não se move quando o  │
 * │ preço da batata sobe. Isso é o certo — mas cria uma pergunta que a    │
 * │ ficha, sozinha, não responde: "e se eu atualizasse?". Se a resposta   │
 * │ só aparecesse DEPOIS do clique, atualizar seria um salto no escuro:   │
 * │ a consultora trocaria o custo dela por um número que ninguém viu.     │
 * │                                                                      │
 * │ Esta função responde ANTES. Ela é o que a tela mostra ao lado do      │
 * │ botão ATUALIZAR CUSTOS, para que a decisão de apertá-lo seja tomada   │
 * │ olhando para o efeito.                                                │
 * │                                                                      │
 * │ ── POR QUE A SOMA É SÓ DAS LINHAS QUE MUDARAM ──────────────────────── │
 * │                                                                      │
 * │ Somar a ficha inteira com preço de hoje e subtrair a ficha inteira    │
 * │ com preço guardado daria o MESMO número — e obrigaria a recalcular    │
 * │ linhas que não mudaram, o que só cria oportunidade de divergência.    │
 * │ Aqui, quem não mudou não entra na conta e não aparece no texto.       │
 * │                                                                      │
 * │ ── E POR QUE ELA NÃO ATUALIZA NADA ─────────────────────────────────── │
 * │                                                                      │
 * │ Ela é uma leitura. Devolver o custo de hoje junto com o de ontem é     │
 * │ tudo o que ela faz; quem decide trocar é a ação explícita da tela,     │
 * │ que passa pelo store e deixa registro no histórico. Preço que muda     │
 * │ em silêncio é exatamente o que a regra de histórico proíbe.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type ComparacaoDeCustos = {
  /** Quantas linhas têm preço de hoje diferente do preço guardado. */
  linhasMudadas: number;
  /** Das mudadas, quantas puderam ser somadas nos dois lados da conta. */
  linhasComparadas: number;
  /** O custo guardado, somando apenas as linhas que mudaram. */
  custoGuardado: number;
  /** O custo das mesmas linhas, com o preço de hoje. */
  custoDeHoje: number;
  /** `custoDeHoje − custoGuardado`. Positivo = o prato ficou mais caro. */
  diferenca: number;
  /** A diferença sobre o custo guardado das mudadas. `null` se ele é zero. */
  variacaoPct: number | null;
  /** `true` quando há ao menos uma linha com preço diferente. */
  haMudanca: boolean;
  /**
   * `false` quando alguma linha mudada não pôde ser comparada — porque não
   * tem preço guardado, ou porque o peso da etapa não existe.
   */
  comparacaoCompleta: boolean;
};

export function compararCustos(
  resolvidos: readonly ItemResolvido[]
): ComparacaoDeCustos {
  const mudadas = resolvidos.filter((r) => r.precoMudou);
  const comparaveis = mudadas.filter((r) => r.custo !== null && r.custoAtual !== null);

  const custoGuardado = comparaveis.reduce((soma, r) => soma + (r.custo ?? 0), 0);
  const custoDeHoje = comparaveis.reduce((soma, r) => soma + (r.custoAtual ?? 0), 0);
  const diferenca = custoDeHoje - custoGuardado;

  return {
    linhasMudadas: mudadas.length,
    linhasComparadas: comparaveis.length,
    custoGuardado,
    custoDeHoje,
    diferenca,
    variacaoPct: custoGuardado > 0 ? diferenca / custoGuardado : null,
    haMudanca: mudadas.length > 0,
    comparacaoCompleta: mudadas.length === comparaveis.length,
  };
}

/**
 * A FICHA COM O PREÇO DE HOJE GRAVADO NAS LINHAS — a única forma de atualizar.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO DEVOLVE UMA FICHA NOVA, E NÃO ESCREVE POR DENTRO         │
 * │                                                                      │
 * │ Atualizar custos não é "recalcular": é trocar o preço guardado de cada │
 * │ linha pelo preço de hoje, de uma vez, de forma que o resultado seja    │
 * │ gravável pelo caminho de sempre — `salvarItensDaFicha`, com histórico. │
 * │                                                                      │
 * │ Uma função que mutasse os itens recebidos escreveria numa lista que    │
 * │ pode ser a do cenário, e o efeito vazaria para fora da sessão sem      │
 * │ passar pelo store. Devolvendo uma cópia, quem chama decide o que fazer │
 * │ com ela — e não existe caminho em que a atualização aconteça por       │
 * │ acidente.                                                             │
 * │                                                                      │
 * │ As linhas que NÃO mudaram ficam exatamente como estavam. Reescrever o  │
 * │ preço delas com o mesmo número não mudaria a conta e sujaria o diff.   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function itensComPrecoDeHoje(
  resolvidos: readonly ItemResolvido[],
  itens: readonly ItemFicha[]
): ItemFicha[] {
  /*
    A CORRESPONDÊNCIA É POR POSIÇÃO, E ISSO ESTÁ CERTO AQUI.

    `resolvidos` nasce de `ficha.itens.map(...)` — mesma ordem, mesmo
    comprimento, um para um. Reassociar por id de ingrediente seria pior: um
    prato pode usar o mesmo insumo em duas linhas com preços guardados
    diferentes, e as duas seriam tratadas como se fossem a mesma.
  */
  return itens.map((item, indice) => {
    const r = resolvidos[indice];
    if (r === undefined || !r.precoMudou || r.precoAtual === null) return { ...item };
    return { ...item, precoReferencia: r.precoAtual };
  });
}

// ---------------------------------------------------------------------------
// Peso da ficha — os mesmos indicadores, aplicados ao prato
// ---------------------------------------------------------------------------

/**
 * O QUE A SOMA DOS INGREDIENTES DIZ SOBRE O PESO DO PRATO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO SOMA PESO E NÃO CUSTO                                    │
 * │                                                                      │
 * │ Somar o peso dos ingredientes é somar PESO — a mesma grandeza em      │
 * │ todas as linhas, depois de normalizada. É conferível na balança.      │
 * │                                                                      │
 * │ Somar custo já é o que `somarFicha` faz, e também é soma de mesma     │
 * │ grandeza (reais). As duas são aritmética.                             │
 * │                                                                      │
 * │ O que NÃO se soma é etapa diferente: juntar o peso de compra da       │
 * │ mandioca com o peso preparado do frango daria um número que não       │
 * │ corresponde a nada que exista na cozinha. Por isso o total de peso    │
 * │ só é calculado quando todas as linhas estão na MESMA etapa, e a tela  │
 * │ diz qual é.                                                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type PesoDaFicha = {
  /** Peso total, quando todas as linhas somáveis estão na mesma etapa. */
  total: number | null;
  unidade: string | null;
  /** A etapa comum. `null` quando as linhas estão em etapas diferentes. */
  etapa: EtapaPeso | null;
  /** Quantas linhas tiveram peso somável. */
  linhasSomadas: number;
  /** As etapas presentes, quando há mais de uma. */
  etapasEncontradas: EtapaPeso[];
};

export function pesarFicha(resolvidos: readonly ItemResolvido[]): PesoDaFicha {
  const somaveis = resolvidos.filter((r) => r.quantidade !== null && r.item.unidade.trim() !== "");

  if (somaveis.length === 0) {
    return {
      total: null,
      unidade: null,
      etapa: null,
      linhasSomadas: 0,
      etapasEncontradas: [],
    };
  }

  const etapas = [...new Set(somaveis.map((r) => r.item.etapa))];
  const unidades = [...new Set(somaveis.map((r) => r.item.unidade.trim()))];

  // Etapas diferentes ou unidades diferentes: não há total de peso honesto.
  if (etapas.length > 1 || unidades.length > 1) {
    return {
      total: null,
      unidade: unidades.length === 1 ? (unidades[0] ?? null) : null,
      etapa: null,
      linhasSomadas: 0,
      etapasEncontradas: etapas,
    };
  }

  const total = somaveis.reduce((s, r) => s + (r.quantidade as number), 0);

  return {
    total,
    unidade: unidades[0] ?? null,
    etapa: etapas[0] ?? null,
    linhasSomadas: somaveis.length,
    etapasEncontradas: etapas,
  };
}
