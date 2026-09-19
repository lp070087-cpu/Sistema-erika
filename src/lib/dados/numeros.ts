/**
 * LER E ESCREVER NÚMERO — em português, e sem arredondar no caminho.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO VIROU ARQUIVO                                           │
 * │                                                                      │
 * │ Existiam três leitores de número no projeto, e eles discordavam:      │
 * │                                                                      │
 * │   · `lerNumero`, dentro do editor de preço da biblioteca              │
 * │   · `lerQuantidade`, dentro do motor de custo da ficha                │
 * │   · `Number(...)` cru, em dois campos de formulário                    │
 * │                                                                      │
 * │ Os três aceitavam coisas diferentes. Um aceitava "R$ 12,90"; outro    │
 * │ recusava. Quando a Érika digitasse o mesmo número em telas           │
 * │ diferentes e uma delas recusasse, ela concluiria que a tela está      │
 * │ quebrada — e não que o campo tem outra regra.                         │
 * │                                                                      │
 * │ Aqui há UM leitor. Quem precisa de regra mais apertada recebe um      │
 * │ parâmetro, e a regra fica visível na chamada em vez de escondida      │
 * │ numa segunda expressão regular.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A AMBIGUIDADE DO PONTO — DECLARADA, E MITIGADA NA TELA                │
 * │                                                                      │
 * │ "1.200" é mil e duzentos, ou um vírgula dois? A pergunta não tem      │
 * │ resposta matemática: depende de quem digitou. No Brasil, ponto é      │
 * │ quase sempre separador de milhar; numa balança digital, é o decimal.  │
 * │                                                                      │
 * │ A regra adotada, e ela é antiga neste projeto: quando há VÍRGULA, o   │
 * │ ponto é milhar e a vírgula é decimal ("1.200,50" = mil e duzentos     │
 * │ reais e cinquenta). Quando não há vírgula, o ponto é decimal          │
 * │ ("1.200" = 1,2).                                                      │
 * │                                                                      │
 * │ Isso NÃO resolve a ambiguidade — só escolhe um lado. Quem resolve é   │
 * │ a tela, e a tela resolve mostrando de volta o número que entendeu,    │
 * │ antes de qualquer gravação: se ela digitou 1.200 pensando em mil e    │
 * │ duzentos, vê "R$ 1,20" na confirmação e corrige. É por isso que      │
 * │ nenhum campo numérico deste sistema salva sem exibir a leitura.       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO NÃO FAZ                                           │
 * │                                                                      │
 * │ Não arredonda. `arredondar` existe só para EXIBIR, e o nome diz isso. │
 * │ O valor que trafega entre o formulário e o cálculo mantém a precisão  │
 * │ inteira do JavaScript — dobrar casas no meio do caminho é escolher a  │
 * │ regra de arredondamento da metodologia antes de ela existir.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

// ---------------------------------------------------------------------------
// Leitura
// ---------------------------------------------------------------------------

/**
 * O que sobra de um número depois de tirar o que não é número.
 *
 * Tira o cifrão, a palavra "reais", os espaços (inclusive o espaço
 * inquebrável, que vem colado do Excel e parece espaço na tela) e o sinal de
 * mais, que ninguém digita mas o celular insere.
 *
 * O sinal de MENOS não é removido: ele é preservado para que a leitura
 * seguinte o encontre e RECUSE. Apagar o sinal transformaria "−3 kg" em
 * "3 kg" — um erro silencioso, que é a pior das duas opções.
 */
function limparNumerico(texto: string): string {
  return texto
    .replace(/R\$/gi, "")
    .replace(/\breais\b|\breal\b/gi, "")
    .replace(/\s| /g, "")
    .replace(/^\+/, "");
}

/**
 * Lê um número escrito em português. Devolve `null` quando não é número
 * válido, ou quando é zero ou negativo.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ZERO E NEGATIVO SAEM COMO `null`, E NÃO COMO 0 E −3        │
 * │                                                                    │
 * │ Porque NENHUM campo deste sistema aceita os dois. Um preço de      │
 * │ R$ 0,00 não é um preço; um peso de 0 kg não é uma pesagem; uma      │
 * │ quantidade de 0 não é uma quantidade. Devolver 0 deixaria o valor   │
 * │ entrar no cálculo como se fosse um dado medido, e o custo sairia    │
 * │ mais baixo do que é, com aparência de certo.                        │
 * │                                                                    │
 * │ Recusar na LEITURA — e não na validação de cada tela — é o que      │
 * │ garante que a regra valha nas seis telas em vez de nas seis         │
 * │ validações, sendo que uma delas estaria errada.                     │
 * └────────────────────────────────────────────────────────────────────┘
 */
export function lerNumero(texto: string): number | null {
  return ler(texto, false);
}

/**
 * Lê uma quantidade declarada numa ficha.
 *
 * Aceita o que a cozinha escreve. Recusa — com `null` — o que não é número:
 * "a gosto", "o quanto baste", "1 punhado". A recusa é a resposta certa,
 * porque "a gosto" não tem preço unitário que multiplique: qualquer número
 * que o sistema produzisse ali seria invenção disfarçada de cálculo.
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELA É IDÊNTICA A `lerNumero`                               │
 * │                                                                    │
 * │ Ela divergiu por um tempo: uma versão recusava separador de milhar  │
 * │ em quantidade, por causa do caso "1.200" — que tanto pode ser mil e │
 * │ duzentos quanto um vírgula dois.                                    │
 * │                                                                    │
 * │ A recusa especializada era pior do que a regra geral. Ela fazia a   │
 * │ MESMA digitação ter respostas diferentes em dois campos do sistema  │
 * │ — e é isso que ensina a consultora a não confiar no que ela digita. │
 * │ Quem resolve a ambiguidade não é uma terceira expressão regular: é a │
 * │ tela, mostrando de volta o número que entendeu antes de gravar.     │
 * │                                                                    │
 * │ A função fica com nome próprio porque a PERGUNTA é outra ("quanto   │
 * │ vai desta vez?" e não "quanto custou?"), e é o nome dela que a tela  │
 * │ usa para escrever "a quantidade não é um número".                   │
 * └────────────────────────────────────────────────────────────────────┘
 */
export function lerQuantidade(texto: string): number | null {
  return ler(texto, false);
}

/**
 * Lê um peso medido.
 *
 * Aceita zero: **não** — e por isso é igual a `lerNumero`. Existe como
 * nome próprio porque a pergunta que ela responde é outra ("o que a balança
 * marcou?") e a mensagem de erro na tela precisa ser outra. Um peso
 * recusado com "informe um valor maior que zero" é claro; recusado com
 * "número inválido" faria a pessoa revisar a vírgula por meia hora.
 */
export function lerPeso(texto: string): number | null {
  return ler(texto, false);
}

/**
 * O leitor de verdade. `permitirZero` fica reservado para o dia em que
 * algum campo precisar dele — hoje nenhum precisa, e um parâmetro aceito
 * mas nunca usado esconde a decisão em vez de documentá-la.
 */
function ler(texto: string, permitirZero: boolean): number | null {
  const limpo = limparNumerico(texto);
  if (limpo === "") return null;

  /*
    ┌───────────────────────────────────────────────────────────────────┐
    │ A VALIDAÇÃO VEM ANTES DA CONVERSÃO                                │
    │                                                                   │
    │ `Number()` é permissivo demais para um campo de dinheiro. Ele      │
    │ aceita "0x1A" (=26), "1e5" (=100000) e "Infinity". Nenhum desses   │
    │ é um preço. A expressão regular abaixo é a lista fechada do que    │
    │ uma pessoa pode digitar numa nota fiscal:                          │
    │                                                                   │
    │   · com vírgula: ponto é milhar, vírgula é decimal                 │
    │   · sem vírgula: ponto é decimal                                   │
    │                                                                   │
    │ O que não casar é recusado — inclusive notação científica, que é    │
    │ como um valor absurdo entra sem ninguém ver.                       │
    └───────────────────────────────────────────────────────────────────┘
  */
  const comVirgula = /^-?\d{1,3}(\.\d{3})*(,\d+)?$/;
  const semVirgula = /^-?\d+(\.\d+)?$/;

  let numero: number;
  if (limpo.includes(",")) {
    if (!comVirgula.test(limpo)) return null;
    numero = Number(limpo.replace(/\./g, "").replace(",", "."));
  } else {
    if (!semVirgula.test(limpo)) return null;
    numero = Number(limpo);
  }

  if (!Number.isFinite(numero)) return null;
  if (!permitirZero && numero <= 0) return null;
  return numero;
}

// ---------------------------------------------------------------------------
// Escrita
// ---------------------------------------------------------------------------

/**
 * Um número para a tela, com a vírgula no lugar certo e sem zeros à toa.
 *
 * `casas` é o MÁXIMO, e não o mínimo: 10,5 com `casas: 3` sai "10,5" e não
 * "10,500". Numa tabela de pesos, "4,5" e "4,500" são o mesmo número escrito
 * de duas formas, e a segunda faz o olho procurar a diferença.
 */
export function numero(valor: number | null, casas = 2): string {
  if (valor === null || !Number.isFinite(valor)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: casas,
  }).format(valor);
}

/**
 * Um peso, sempre com as casas fixas da balança.
 *
 * Aqui as casas são FIXAS, e não máximas, por um motivo de tabela: numa
 * coluna de pesos, "4,5" e "4,25" alinhados à direita deixam a vírgula em
 * posições diferentes e a coluna deixa de se ler de relance. Peso é sempre
 * três casas — é o que a balança de cozinha mostra.
 */
export function numeroFixo(valor: number | null, casas: number): string {
  if (valor === null || !Number.isFinite(valor)) return "—";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(valor);
}

/**
 * ARREDONDAR — para exibir, nunca para calcular.
 *
 * O nome é explícito de propósito. O sistema não arredonda valor nenhum
 * durante o cálculo: o custo por porção sai de um total que nunca foi
 * cortado, e por isso somar duas linhas exibidas pode não dar exatamente o
 * total exibido. Isso é o comportamento CORRETO enquanto a regra de
 * arredondamento da metodologia não existir — um sistema que arredondasse
 * cada linha já teria escolhido a regra no lugar dela.
 */
export function arredondarParaExibir(valor: number, casas: number): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

/**
 * A leitura de volta — o que a tela mostra antes de gravar qualquer número.
 *
 * Existe para fechar a ambiguidade do ponto: quem digitou "1.200" vê aqui
 * o número que o sistema entendeu, com a vírgula no lugar. Ver para crer
 * é mais barato do que uma regra que tente adivinhar.
 */
export function leituraDeVolta(texto: string, casas = 3): string | null {
  const n = lerNumero(texto);
  return n === null ? null : numero(n, casas);
}

// ---------------------------------------------------------------------------
// Comparação
// ---------------------------------------------------------------------------

/**
 * A diferença entre dois números, em percentual do primeiro.
 *
 * Devolve `null` quando o primeiro é zero ou ausente — dividir por zero não
 * dá "infinito por cento", dá pergunta sem resposta. A tela mostra "primeiro
 * registro" nesse caso, e não um número.
 */
export function variacaoPercentual(
  novo: number | null,
  anterior: number | null
): number | null {
  if (novo === null || anterior === null || anterior <= 0) return null;
  return ((novo - anterior) / anterior) * 100;
}

// ---------------------------------------------------------------------------
// Valores iniciais de formulário
// ---------------------------------------------------------------------------

/**
 * Prepara um valor para entrar num campo de texto, mostrando o número que
 * já existe em vez de escondê-lo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE, E POR QUE O `null` NÃO VIRA "0"                  │
 * │                                                                      │
 * │ Um campo vazio e um campo com zero são coisas diferentes. Vazio        │
 * │ significa "não sei ainda"; zero significa "medi e deu zero". O leitor  │
 * │ de número recusa os dois, mas por motivos opostos — e a tela precisa  │
 * │ distinguir para não sugerir um zero a quem só não informou.           │
 * │                                                                      │
 * │ `null` e `undefined` viram string vazia. Um número vira o próprio      │
 * │ número, sem separador de milhar, porque é assim que o campo `number`   │
 * │ do HTML o aceita de volta.                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function paraCampo(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "";
  return String(valor).replace(".", ",");
}

/** Um texto que pode ser nulo vira string vazia — nunca "undefined" na tela. */
export function textoParaCampo(valor: string | null | undefined): string {
  return valor ?? "";
}

/** Uma data vira `AAAA-MM-DD`, que é o que `<input type="date">` entende. */
export function dataParaCampo(d: Date | null | undefined): string {
  if (!d) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/** O caminho de volta de `dataParaCampo`. Meio-dia para não cair no fuso. */
export function dataDoCampo(texto: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;
  return new Date(`${texto}T12:00:00`);
}
