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
  /** Preço por unidade de compra, já resolvido para o cliente. */
  precoEfetivo: number | null;
  /** De onde veio o preço resolvido. A tela mostra isso ao lado do número. */
  origemDoPreco: "CLIENTE" | "BIBLIOTECA" | "FICHA" | "AUSENTE";
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
    O PREÇO — três fontes, em ordem de precedência decrescente de
    especificidade:

      1. o preço do cliente para este insumo (o mais específico)
      2. o preço de referência guardado na própria ficha (o que valia no dia
         em que ela foi escrita — histórico vivo, não deve ser sobreposto)
      3. o preço de referência da biblioteca (o genérico)

    A ficha vem ANTES da biblioteca de propósito. Ela guarda o preço do dia
    em que foi escrita; substituí-lo pelo preço de hoje apagaria justamente o
    registro que permite ver o efeito de uma alta depois. O preço do cliente
    vem antes de tudo porque é o preço REAL daquele cliente, e não uma
    referência genérica.

    Quando os três existem e discordam, a tela mostra a divergência — sem
    corrigir nada por conta própria.
  */
  let precoEfetivo: number | null = null;
  let origemDoPreco: ItemResolvido["origemDoPreco"] = "AUSENTE";

  if (item.precoReferencia !== null && item.precoReferencia > 0) {
    precoEfetivo = item.precoReferencia;
    origemDoPreco = "FICHA";
  }
  if (ingrediente?.precoAtual != null && ingrediente.precoAtual > 0) {
    precoEfetivo = ingrediente.precoAtual;
    origemDoPreco = "BIBLIOTECA";
  }
  if (doCliente?.precoAtual != null && doCliente.precoAtual > 0) {
    precoEfetivo = doCliente.precoAtual;
    origemDoPreco = "CLIENTE";
  }

  const transformacao = derivarTransformacao(ingrediente?.transformacao ?? null);
  const custos = custoPorEtapa(precoEfetivo, transformacao);

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

  return {
    item,
    ingrediente,
    precoEfetivo,
    origemDoPreco,
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
