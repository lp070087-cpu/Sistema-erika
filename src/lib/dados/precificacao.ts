/**
 * A PRECIFICAÇÃO REUNIDA — a camada entre o custo da ficha e a tela.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO EXISTE, SE AS CONTAS JÁ EXISTEM                 │
 * │                                                                      │
 * │ Todas as fórmulas deste módulo já moravam em outro lugar:            │
 * │                                                                      │
 * │   `./custos-ficha`            soma a ficha e diz o que ficou de fora │
 * │   `./indicadores-comerciais`  CMV, markup, alvo, margem de segurança │
 * │                                                                      │
 * │ O que faltava era o que uma TELA precisa e nenhum dos dois dá: uma    │
 * │ linha por prato, com o custo E o comercial juntos, mais o estado de   │
 * │ cada ausência.                                                        │
 * │                                                                      │
 * │ Esse trabalho poderia ter sido escrito dentro do componente React —   │
 * │ e é exatamente o que este arquivo impede. Uma regra dentro de um      │
 * │ componente não pode ser conferida por script, e a mesma conta feita   │
 * │ em duas telas diverge: uma esquece a margem, a outra esquece o preço  │
 * │ do cliente, e os dois números ficam com a mesma cara de certos.       │
 * │                                                                      │
 * │ AQUI NÃO MORA FÓRMULA NOVA. `cmvPct` continua sendo uma divisão de    │
 * │ `./indicadores-comerciais`; o custo continua sendo a soma de          │
 * │ `./custos-ficha`. O que mora aqui é a MONTAGEM.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ NENHUM NÚMERO DE DECISÃO ENTRA AQUI EMBUTIDO                         │
 * │                                                                      │
 * │ A regra do arquivo comercial vale para este: não existe "CMV bom",    │
 * │ não existe "CMV ideal", não existe faixa verde. O sistema não opina   │
 * │ sobre o preço da Érika — ele mostra o que o preço declarado implica   │
 * │ e nomeia o que ainda falta para ela decidir.                          │
 * │                                                                      │
 * │ Por isso não há função `classificar(cmv)` e não há `status` do tipo   │
 * │ "bom/ruim": `CMV_ACIMA_DO_CUSTO` é uma constatação ARITMÉTICA — o     │
 * │ custo não cabe no preço, a venda dá prejuízo —, não um julgamento de  │
 * │ qualidade. Nada aqui diz se 32% de CMV é muito ou pouco.              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CMV É CALCULADO SOBRE O CUSTO COM MARGEM, QUANDO ELA EXISTE        │
 * │                                                                      │
 * │ A decisão não é tomada aqui: vem de `quadroComercial`, que já a toma  │
 * │ e a documenta. A margem de segurança existe justamente porque parte   │
 * │ do custo ainda vai aparecer; usar o custo medido daria um CMV         │
 * │ otimista — e otimista é pior do que ausente, porque ninguém confere   │
 * │ um número bom.                                                        │
 * │                                                                      │
 * │ `custoDaVenda` é o custo que ESTE módulo usou na conta, exposto para  │
 * │ a tela poder dizer ao lado do número. Um CMV sobre custo com margem   │
 * │ é 5% a 10% maior que o mesmo CMV sobre custo medido, e os dois        │
 * │ apareceriam iguais sem esse campo.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { resumoDaFicha } from "./custos-ficha";
import type { ItemResolvido, ResumoCustoFicha } from "./custos-ficha";
import { PARAMETROS_VAZIOS, quadroComercial } from "./indicadores-comerciais";
import type { ParametrosComerciais, QuadroComercial } from "./indicadores-comerciais";
import type { Ficha } from "./tipos-operacao";

/**
 * POR QUE UMA LINHA ESTÁ INCOMPLETA — como código, e não como frase.
 *
 * A frase é da tela; o código é do domínio. Guardar a frase aqui daria duas
 * redações diferentes para a mesma falta no dia em que alguém "melhorasse" o
 * texto numa das telas.
 *
 * Note o que NÃO está nesta lista: "preço caro", "CMV alto", "margem boa".
 * Não existem porque não há regra que os defina.
 */
export type PendenciaDaLinha =
  /** A ficha não tem nenhuma linha que possa entrar na soma. */
  | "SEM_CUSTO"
  /** Alguma linha ficou fora da soma: sem preço, sem peso da etapa, etc. */
  | "CUSTO_PARCIAL"
  /** Ninguém informou o preço de venda deste prato. */
  | "SEM_PRECO"
  /** O preço informado não permite calcular CMV nem markup. */
  | "SEM_INDICADORES"
  /** Não há rendimento em porções declarado. */
  | "SEM_PORCOES"
  /** Os parâmetros comerciais (margem, alvo) não foram decididos. */
  | "SEM_PARAMETROS";

/** O que fazer a respeito — a ação que fecha cada pendência. */
export const ACAO_DA_PENDENCIA: Record<PendenciaDaLinha, string> = {
  SEM_CUSTO: "Fechar o custo da ficha",
  CUSTO_PARCIAL: "Completar as linhas fora da soma",
  SEM_PRECO: "Informar o preço de venda",
  SEM_INDICADORES: "Conferir custo e preço informados",
  SEM_PORCOES: "Declarar o rendimento em porções",
  SEM_PARAMETROS: "Definir margem de segurança e alvo",
};

/**
 * O ESTADO COMERCIAL DE UMA LINHA — a constatação aritmética da venda.
 *
 * `NAO_CALCULAVEL` não é um quarto tipo de juízo: é o silêncio. Sem custo ou
 * sem preço não há o que afirmar, e o sistema não preenche a lacuna.
 */
export type EstadoComercial =
  /** O preço não cobre o custo: a venda devolve menos do que consumiu. */
  | "CMV_ACIMA_DO_CUSTO"
  /** O preço apenas empata com o custo. Não sobra nada. */
  | "CMV_IGUAL_AO_CUSTO"
  /** O preço cobre o custo e sobra algo. */
  | "CMV_ABAIXO_DO_CUSTO"
  /** Falta custo ou preço — não há o que afirmar. */
  | "NAO_CALCULAVEL";

export const ROTULO_ESTADO_COMERCIAL: Record<EstadoComercial, string> = {
  CMV_ACIMA_DO_CUSTO: "Preço abaixo do custo",
  CMV_IGUAL_AO_CUSTO: "Preço igual ao custo",
  CMV_ABAIXO_DO_CUSTO: "Preço acima do custo",
  NAO_CALCULAVEL: "Ainda não calculável",
};

/**
 * O tom de cada estado — para a tela pintar sem decidir.
 *
 * `CMV_ABAIXO_DO_CUSTO` fica em `neutro` DE PROPÓSITO. Pintar de verde um
 * preço que cobre o custo seria o sistema aprovando o preço: se um CMV de
 * 94% ainda cobre o custo, ele sairia verde como um de 20%. O que a tela
 * pode afirmar com números é só a relação entre preço e custo — e é isso
 * que a etiqueta diz.
 */
export const TOM_ESTADO_COMERCIAL: Record<
  EstadoComercial,
  "neutro" | "dourado" | "critico"
> = {
  CMV_ACIMA_DO_CUSTO: "critico",
  CMV_IGUAL_AO_CUSTO: "dourado",
  CMV_ABAIXO_DO_CUSTO: "neutro",
  NAO_CALCULAVEL: "neutro",
};

/**
 * UM NÚMERO QUE SERVE PARA CALCULAR — e a ausência de todos os outros.
 *
 * `undefined` conta como ausente porque uma ficha vinda da sessão pode
 * trazer o campo assim, e `NaN` porque ele chega fácil de um campo de texto
 * vazio. Tratar os dois como "declarado" faria a linha parecer completa com
 * um número que não existe — e uma soma com `NaN` contamina o total inteiro
 * sem deixar rastro visível.
 *
 * A função é um PREDICADO DE TIPO, e não um `boolean`: é isso que faz o
 * compilador estreitar o valor para `number` depois do `if`. Sem isso, toda
 * conta abaixo precisaria de um `as number` para calar o erro — e um `as`
 * não é uma garantia, é uma promessa que ninguém verifica.
 */
function ehNumero(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/**
 * A RELAÇÃO ENTRE PREÇO E CUSTO, sem juízo de valor.
 *
 * Tolerância de meio centavo: `custoBase` e `precoVenda` chegam de divisões
 * com casas diferentes, e uma diferença de R$ 0,0001 não é "abaixo do
 * custo" — é o mesmo número arredondado duas vezes. Chamar isso de prejuízo
 * seria um alerta falso, e alerta falso treina quem lê a ignorar alerta.
 */
export function estadoComercial(
  custoBase: number | null,
  precoVenda: number | null
): EstadoComercial {
  if (!ehNumero(custoBase) || !ehNumero(precoVenda)) return "NAO_CALCULAVEL";
  if (custoBase <= 0 || precoVenda <= 0) return "NAO_CALCULAVEL";

  const diferenca = precoVenda - custoBase;
  if (Math.abs(diferenca) < 0.005) return "CMV_IGUAL_AO_CUSTO";
  return diferenca < 0 ? "CMV_ACIMA_DO_CUSTO" : "CMV_ABAIXO_DO_CUSTO";
}

/**
 * UMA LINHA DA TELA DE PRECIFICAÇÃO.
 *
 * Tudo derivado, nada digitado: a linha é montada a partir de uma ficha.
 * Não existe uma tabela de precificação no banco — e não deve existir. Uma
 * linha gravada seria uma cópia de um estado que já está na ficha, e cópia
 * desatualiza: o preço do insumo muda, a ficha recalcula, e a precificação
 * continua mostrando o custo de ontem com a mesma aparência de certo.
 *
 * Mesmo desenho de `ResumoOperacao` e de `QuadroComercial`: os números E as
 * ausências no mesmo objeto, para a tela não precisar deduzir a partir de
 * três `if`.
 */
export type LinhaPrecificacao = {
  ficha: Ficha;
  /** O resultado completo da soma — `completo`, `motivos`, `itensFora`. */
  custo: ResumoCustoFicha;
  /** Os parâmetros que valeram: os da ficha, ou o vazio. Nunca um padrão. */
  parametros: ParametrosComerciais;
  /** Tudo o que a ficha sabe dizer sobre preço — e tudo o que ainda não sabe. */
  comercial: QuadroComercial;
  /**
   * O custo que ENTROU no CMV: o medido com a margem de segurança, quando
   * ela foi informada, ou o medido puro quando não foi.
   *
   * `null` quando não há custo somável. É este campo — e não `custoBase` do
   * quadro comercial — que a tela deve exibir ao lado do CMV, para que se
   * saiba QUAL custo gerou aquele percentual.
   */
  custoDaVenda: number | null;
  /** A constatação aritmética entre o preço e o custo. Ver `estadoComercial`. */
  estado: EstadoComercial;
  /** Tudo o que falta nesta linha, nomeado. Vazio quando nada falta. */
  pendencias: ReadonlyArray<PendenciaDaLinha>;
};

/**
 * Monta a linha de um prato a partir da ficha e das suas linhas resolvidas.
 *
 * Não recebe preço de insumo nem cliente: quando a ficha chega aqui, as
 * linhas já foram resolvidas por `resolverItem`, que é o único lugar que
 * decide a precedência entre preço do cliente, preço da biblioteca e preço
 * guardado na ficha. Resolver de novo aqui duplicaria essa decisão.
 */
export function linhaDePrecificacao(
  ficha: Ficha,
  resolvidos: readonly ItemResolvido[],
  /**
   * Os parâmetros que valem quando a FICHA não declarou nenhum.
   *
   * A precedência é da ficha, sempre: ela representa aquele prato, e a regra
   * da casa é o ponto de partida, não a palavra final. O terceiro argumento
   * só entra quando `ficha.parametros` está ausente — e é por isso que ele é
   * opcional. Omitido, o comportamento é o de antes: a ficha, ou o vazio.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ POR QUE ISTO NÃO VIROU UM SEGUNDO CAMINHO DE CÁLCULO                │
   * │                                                                    │
   * │ O cardápio precisa exatamente desta mesma linha — custo, CMV,       │
   * │ estado, pendências — para cada prato publicado. A alternativa era   │
   * │ escrever uma segunda montagem lá, e duas montagens divergem: basta   │
   * │ uma delas escolher os parâmetros em ordem diferente para que o mesmo │
   * │ prato tenha um CMV na precificação e outro no cardápio, com as duas  │
   * │ telas parecendo certas.                                             │
   * │                                                                    │
   * │ O parâmetro é opcional para que as chamadas que não têm regra de     │
   * │ cliente continuem escrevendo o que sempre escreveram.               │
   * └────────────────────────────────────────────────────────────────────┘
   */
  parametrosDoCliente?: ParametrosComerciais | null
): LinhaPrecificacao {
  const custo = resumoDaFicha(resolvidos, ficha);
  const parametros =
    ficha.parametros && Object.keys(ficha.parametros).length > 0
      ? ficha.parametros
      : (parametrosDoCliente ?? PARAMETROS_VAZIOS);
  const precoVenda = ficha.precoVenda ?? null;

  /*
    O custo medido só entra na conta comercial quando a soma FECHOU. Um
    total parcial é um piso: o custo real é maior. Usar o piso daria um CMV
    otimista — exatamente o número que ninguém confere.
  */
  const custoMedido = custo.completo ? custo.custoTotal : null;

  const comercial = quadroComercial(custoMedido, precoVenda, parametros);

  /*
    `custoDaVenda` é reconstruído da mesma decisão que `quadroComercial` já
    tomou: margem aplicada quando existe, custo medido quando não. Não é uma
    segunda regra — é a leitura do mesmo quadro.
  */
  const custoDaVenda =
    comercial.custoComMargem ?? comercial.custoMedido;

  const pendencias: PendenciaDaLinha[] = [];
  if (custo.vazio) pendencias.push("SEM_CUSTO");
  else if (!custo.completo) pendencias.push("CUSTO_PARCIAL");
  if (precoVenda === null || precoVenda <= 0) pendencias.push("SEM_PRECO");
  if (comercial.venda === null) pendencias.push("SEM_INDICADORES");
  if (!ehNumero(ficha.rendimentoPorcoes)) pendencias.push("SEM_PORCOES");
  if (comercial.pendencias.includes("margem de segurança")) pendencias.push("SEM_PARAMETROS");

  return {
    ficha,
    custo,
    parametros,
    comercial,
    custoDaVenda,
    estado: estadoComercial(custoDaVenda, precoVenda),
    pendencias,
  };
}

/**
 * ESTE PRATO TEM PREÇO DE VENDA DECLARADO?
 *
 * É um PREDICADO DE TIPO, e não um `boolean`, pelo mesmo motivo de
 * `ehNumero`: quem chama precisa somar o preço depois de perguntar. Devolver
 * `boolean` obrigaria cada chamada a repetir o `as number` — e um `as` é uma
 * promessa que ninguém verifica. Com o predicado, o compilador estreita o
 * valor e a soma fica conferida de verdade.
 *
 * Zero NÃO é preço: é a ausência dele escrita com outro caractere. Um prato
 * com `precoVenda: 0` não é um prato de graça, é um campo que ninguém
 * preencheu — e somá-lo como zero misturaria as duas coisas na mesma conta.
 */
export function temPreco(precoVenda: number | null | undefined): precoVenda is number {
  return ehNumero(precoVenda) && precoVenda > 0;
}

/** O resumo do conjunto — contagens que se conferem contra a lista. */
export type ResumoPrecificacao = {
  pratos: number;
  comCusto: number;
  comCustoParcial: number;
  semCusto: number;
  comPreco: number;
  semPreco: number;
  /** Quantos têm CMV e markup calculáveis — os dois exigem custo E preço. */
  comercialCalculavel: number;
  /** Os que estão com o preço abaixo do custo. Constatação, não nota. */
  abaixoDoCusto: number;
  semPorcoes: number;
  /** Os parâmetros comerciais que ninguém decidiu, pela frase de origem. */
  pendenciasComuns: ReadonlyArray<{ pendencia: string; pratos: number }>;
};

/**
 * Conta o conjunto SEM inventar média.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO HÁ "CMV MÉDIO" AQUI                                      │
 * │                                                                      │
 * │ Seria uma linha de código, e seria mentira duas vezes.                │
 * │                                                                      │
 * │ Primeiro porque MÉDIA DE PERCENTUAL não é média: um prato de CMV 90%  │
 * │ e cem de CMV 25% dariam 25,6% "em média", e o número não descreve     │
 * │ prato nenhum — a divisão certa seria por custo, não por quantidade.   │
 * │                                                                      │
 * │ Segundo porque, sem os parâmetros comerciais dela, não existe         │
 * │ referência contra a qual comparar. Um "CMV médio de 31%" num painel   │
 * │ vira alvo pelo uso — e vira alvo sem ninguém ter decidido.            │
 * │                                                                      │
 * │ Somar custo e preço do conjunto é aritmética honesta e continua       │
 * │ disponível (`somarCustos`, `somarPrecos`); tirar a média deles é que   │
 * │ seria a invenção. Não há "CMV médio", não há "prato mais lucrativo".   │
 * │ `abaixoDoCusto` é contagem de um fato, não um ranking.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function resumirPrecificacao(
  linhas: readonly LinhaPrecificacao[]
): ResumoPrecificacao {
  const contagem = new Map<string, number>();

  for (const linha of linhas) {
    // Só as pendências de DECISÃO entram no resumo comum. `SEM_CUSTO` e
    // `SEM_PRECO` são da linha, e nomeá-las no topo não levaria a nada.
    for (const p of linha.comercial.pendencias) {
      contagem.set(p, (contagem.get(p) ?? 0) + 1);
    }
  }

  return {
    pratos: linhas.length,
    comCusto: linhas.filter((l) => l.custo.completo).length,
    comCustoParcial: linhas.filter((l) => !l.custo.vazio && !l.custo.completo).length,
    semCusto: linhas.filter((l) => l.custo.vazio).length,
    comPreco: linhas.filter((l) => temPreco(l.ficha.precoVenda)).length,
    semPreco: linhas.filter((l) => !temPreco(l.ficha.precoVenda)).length,
    comercialCalculavel: linhas.filter((l) => l.comercial.venda !== null).length,
    abaixoDoCusto: linhas.filter((l) => l.estado === "CMV_ACIMA_DO_CUSTO").length,
    semPorcoes: linhas.filter((l) => !ehNumero(l.ficha.rendimentoPorcoes)).length,
    pendenciasComuns: [...contagem.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))
      .map(([pendencia, pratos]) => ({ pendencia, pratos })),
  };
}

/**
 * SOMA os custos do conjunto — só as fichas cujo custo FECHOU.
 *
 * Somar totais parciais junto com completos daria um número que parece o
 * custo da casa e não é. A função devolve também quantas ficaram de fora,
 * para a tela poder dizer "somando N de M pratos".
 */
export function somarCustos(
  linhas: readonly LinhaPrecificacao[]
): { total: number; pratosSomados: number; pratosFora: number } {
  const somaveis = linhas.filter((l) => l.custo.completo);
  return {
    total: somaveis.reduce((soma, l) => soma + l.custo.custoTotal, 0),
    pratosSomados: somaveis.length,
    pratosFora: linhas.length - somaveis.length,
  };
}

/**
 * SOMA os preços de venda DECLARADOS.
 *
 * Não é faturamento: é a soma do que foi cadastrado como preço, sem venda
 * nenhuma atrás. A tela é obrigada a dizer isso — é a diferença entre um
 * cadastro completo e uma projeção de receita, e as duas apareceriam iguais.
 */
export function somarPrecos(
  linhas: readonly LinhaPrecificacao[]
): { total: number; pratosComPreco: number; pratosSemPreco: number } {
  const comPreco = linhas.filter((l) => temPreco(l.ficha.precoVenda));
  return {
    total: comPreco.reduce((soma, l) => soma + (l.ficha.precoVenda ?? 0), 0),
    pratosComPreco: comPreco.length,
    pratosSemPreco: linhas.length - comPreco.length,
  };
}
