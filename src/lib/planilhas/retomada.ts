/**
 * A RETOMADA DA PLANILHA NÃO FINALIZADA — a decisão 4, em tipo e função pura.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE A DECISÃO 4 PEDE, EM UMA FRASE                                 │
 * │                                                                      │
 * │ "Retomar planilha não finalizada → TUDO COMO DEIXOU."                 │
 * │                                                                      │
 * │ E ela lista o que conta como "tudo": valores, textos, números, linhas, │
 * │ colunas, cores, negrito, alinhamento, formatação, aba ativa, modelo,   │
 * │ cliente, consultoria.                                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A DECISÃO DE ARQUITETURA: NÃO SE GUARDA A GRADE. GUARDA-SE O QUE ELA  │
 * │ FEZ SOBRE A GRADE.                                                   │
 * │                                                                      │
 * │ A tentação é fotografar a grade inteira e devolvê-la pronta. Ela       │
 * │ funcionaria, e traria três problemas:                                 │
 * │                                                                      │
 * │   · A grade de uma ficha técnica tem centenas de células. Guardá-la    │
 * │     inteira é caro à toa — e o navegador tem um teto de alguns         │
 * │     megabytes por origem, que a planilha do cliente grande estouraria. │
 * │                                                                      │
 * │   · O MODELO SABE REMONTAR A GRADE. `carregar` já faz isso a partir do │
 * │     modelo e do contexto, e o resultado é idêntico ao da primeira vez. │
 * │     Guardá-la seria manter uma SEGUNDA CÓPIA que envelhece: no dia em  │
 * │     que o gerador mudar de leiaute, a planilha retomada mostraria o    │
 * │     leiaute velho e a nova mostraria o novo.                          │
 * │                                                                      │
 * │   · A decisão 3 já estabeleceu que um retrato precisa ser explícito    │
 * │     sobre o que ele é. Uma grade inteira guardada sem procedência seria │
 * │     exatamente o tipo de cópia silenciosa que ela proíbe.              │
 * │                                                                      │
 * │ Então o que se guarda é o DELTA: o que ela digitou, pintou, criou e    │
 * │ abriu. Tudo o mais o modelo reconstrói. É menor, não envelhece, e o    │
 * │ que é restaurado é literalmente "o trabalho dela".                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O DEFEITO QUE ESTE ARQUIVO EXISTE PARA NÃO TER: A DATA                 │
 * │                                                                      │
 * │ `CelulaGrade` é `string | number | Date | null` (ver `grade.ts`). E    │
 * │ `JSON.stringify(new Date(...))` NÃO FALHA — ele devolve uma STRING     │
 * │ ISO, calada. Quem lesse de volta receberia uma string onde esperava    │
 * │ uma data.                                                            │
 * │                                                                      │
 * │ O sintoma não é um erro: é uma célula de data que passa a se          │
 * │ comportar como texto. A coluna para de ordenar por data, o formato     │
 * │ cai para o da coluna, e nada na tela diz por quê. É a mesma família do │
 * │ id composto: funciona por acidente até o dia em que não funciona.      │
 * │                                                                      │
 * │ Por isso a ida e a volta passam por um CODEC explícito, e a prova de   │
 * │ que ele é fiel é a bancada: ida e volta, e `instanceof Date` no fim.   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A MARCA NÃO É "data:" — E ISSO É UMA ESCOLHA, NÃO UM CAPRICHO        │
 * │                                                                      │
 * │ Um marcador legível colidiria com o conteúdo: uma célula onde ela      │
 * │ digitasse literalmente "data:2026-01-01T00:00:00.000Z" voltaria como   │
 * │ uma Date, e a planilha teria inventado um tipo que ninguém digitou.    │
 * │ Improvável, mas improvável-e-errado continua errado.                   │
 * │                                                                      │
 * │ O marcador é um NULO (`\u0000`), um "d" e outro NULO — escrito como  │
 * │ escape no código, e não como byte cru dentro deste arquivo. NULO não  │
 * │ é texto que se digite numa célula. Um valor que comece com ele só     │
 * │ pode ter vindo daqui — e a volta separa os dois casos sem ambiguidade.│
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE MÓDULO **NÃO** É: PERSISTÊNCIA                            │
 * │                                                                      │
 * │ O briefing é explícito: "NÃO diga que existe persistência definitiva   │
 * │ enquanto Neon não estiver conectado."                                 │
 * │                                                                      │
 * │ Este arquivo converte um objeto em texto e texto em objeto. ONDE esse  │
 * │ texto é guardado não é problema dele — e quem o guarda é              │
 * │ `retomada-sessao.ts`, no `sessionStorage`: memória da ABA, que morre   │
 * │ ao fechá-la. Não é banco, não é arquivo, e a tela diz isso com estas   │
 * │ mesmas palavras.                                                      │
 * │                                                                      │
 * │ A separação é a mesma de `procedencia.ts`: a parte que DECIDE é pura e │
 * │ provável por execução; a parte que ESCREVE mora com quem sabe onde o   │
 * │ dado pode morar.                                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { CelulaGrade, FolhaGrade, LinhaGrade } from "./grade";
import type { EstiloGrade } from "./grade";

/**
 * A VERSÃO DO FORMATO — e ela é o que impede uma retomada velha de mentir.
 *
 * Um texto salvo por uma versão anterior do sistema tem campos que o código de
 * hoje não conhece. Sem esta marca, `JSON.parse` devolveria o objeto velho e a
 * tela o aplicaria como se fosse novo: campos faltando virariam `undefined`, e
 * o defeito apareceria longe da causa — numa célula que não pinta, numa aba que
 * não abre.
 *
 * Com a marca, um texto de versão diferente é RECUSADO INTEIRO, e a tela abre
 * limpa. Perder uma retomada é chato; aplicar meia retomada é pior.
 */
export const VERSAO_DA_RETOMADA = 1;

/**
 * O ESTADO DA SESSÃO, DO JEITO QUE ELE SOBREVIVE.
 *
 * Note o que NÃO está aqui: a `grade`. Ela é do modelo, e o modelo a remonta.
 * Guardá-la seria manter duas fontes para a mesma planilha.
 */
export type Retomada = {
  versao: number;
  /** Quando o estado foi guardado, em ISO. É o que a tela mostra na nota. */
  salvadaEm: string;
  /** O modelo e o cliente — os dois que decidem se esta retomada SERVE. */
  modeloId: string;
  clienteId: string;
  consultoriaId: string;
  /** A aba que estava aberta, por ÍNDICE. */
  aba: number;
  /** O que ela digitou, por `"<aba>::<endereço>"`. */
  edicoes: Record<string, CelulaGrade>;
  /** O que ela pintou, pela mesma chave. */
  pincel: Record<string, EstiloGrade>;
  /** As abas que ela criou com o `[+]`. Não são deriváveis de nada. */
  folhasExtras: FolhaGrade[];
  /** A planilha do "+ Criar planilha", se ela criou uma. Também não se deriva. */
  criada: { nome: string; folha: FolhaGrade } | null;
};

/** O que basta saber para decidir se uma retomada ainda serve. */
export type OndeEstou = { modeloId: string; clienteId: string };

// ---------------------------------------------------------------------------
// O CODEC DA DATA
// ---------------------------------------------------------------------------

/**
 * O marcador, embrulhado em NUL. Ver a nota do topo sobre por que não é "data:".
 */
const MARCA = "\u0000d\u0000";

/**
 * IDA — o valor pronto para virar JSON.
 *
 * Só a `Date` precisa de tradução: string, number e null já são JSON puro. O
 * `null` fica `null` de propósito — ele é ausência de dado neste domínio
 * inteiro, e virar `"null"` o transformaria em texto.
 */
function codificar(valor: CelulaGrade): CelulaGrade {
  return valor instanceof Date ? `${MARCA}${valor.toISOString()}` : valor;
}

/**
 * VOLTA — e ela é DELIBERADAMENTE CONSERVADORA.
 *
 * Só vira `Date` o que é string, começa com a marca E traz uma data que o
 * `Date` consegue ler. Se o pedaço depois da marca não for uma data válida, o
 * valor volta como STRING, sem a marca.
 *
 * A alternativa — confiar no prefixo e devolver `new Date("lixo")` — daria uma
 * `Invalid Date`, que não é erro em JavaScript: é um objeto que responde `NaN`
 * a tudo e chega na tela como "Invalid Date". Um valor estranho tem de virar
 * texto estranho, e não uma data quebrada.
 */
function decodificar(valor: unknown): CelulaGrade {
  if (typeof valor === "string" && valor.startsWith(MARCA)) {
    const bruto = valor.slice(MARCA.length);
    const data = new Date(bruto);
    return Number.isNaN(data.getTime()) ? bruto : data;
  }
  if (typeof valor === "string" || typeof valor === "number" || valor === null) return valor;
  /*
    QUALQUER OUTRA COISA VIRA `null`, e não o valor original.

    Um objeto ou array numa célula não tem como ter vindo daqui — a célula só
    aceita os quatro tipos. Deixá-lo passar colocaria um valor impossível dentro
    da grade, e o defeito apareceria na renderização, longe daqui.
  */
  return null;
}

/** O mapa de células de uma linha, com o codec aplicado. */
function mapearCelulas(
  celulas: Readonly<Record<string, CelulaGrade>>,
  fn: (v: CelulaGrade) => CelulaGrade
): Record<string, CelulaGrade> {
  const novas: Record<string, CelulaGrade> = {};
  for (const [chave, valor] of Object.entries(celulas)) novas[chave] = fn(valor);
  return novas;
}

/**
 * UMA LINHA, COM O CODEC APLICADO NAS CÉLULAS.
 *
 * Os ramos são escritos UM A UM, e não num grupo com `switch` compartilhado,
 * porque o TypeScript só estreita `linha` para o membro certo da união quando o
 * caso é individual — e é esse estreitamento que faz o objeto devolvido ser
 * provadamente uma `LinhaGrade`, sem conversão de tipo.
 *
 * As linhas que não guardam célula (`secao`, `texto`, `cabecalho`, `rotulos`)
 * passam intactas: elas não têm o que traduzir.
 */
function mapearLinha(linha: LinhaGrade, fn: (v: CelulaGrade) => CelulaGrade): LinhaGrade {
  switch (linha.tipo) {
    case "campo":
      return { ...linha, valor: fn(linha.valor) };
    case "dados":
      return { ...linha, celulas: mapearCelulas(linha.celulas, fn) };
    case "subtotal":
      return { ...linha, celulas: mapearCelulas(linha.celulas, fn) };
    case "total":
      return { ...linha, celulas: mapearCelulas(linha.celulas, fn) };
    case "vazia":
      /*
        `vazia` é a única com `celulas` OPCIONAL — uma linha em branco pode não
        ter mapa nenhum. Recriar um `{}` para ela mudaria o objeto sem mudar o
        significado, e a bancada confere a igualdade profunda: devolver a linha
        como veio é o que mantém a ida e a volta idênticas.
      */
      return linha.celulas ? { ...linha, celulas: mapearCelulas(linha.celulas, fn) } : linha;
    default:
      return linha;
  }
}

function mapearFolha(folha: FolhaGrade, fn: (v: CelulaGrade) => CelulaGrade): FolhaGrade {
  return { ...folha, linhas: folha.linhas.map((l) => mapearLinha(l, fn)) };
}

// ---------------------------------------------------------------------------
// A IDA
// ---------------------------------------------------------------------------

/** O que o ambiente entrega para ser guardado. Sem `versao` e sem `salvadaEm`. */
export type EstadoDaSessao = Omit<Retomada, "versao" | "salvadaEm">;

/**
 * O ESTADO VIRA TEXTO.
 *
 * O parâmetro `em` existe para a bancada poder fixar o instante: uma função que
 * chama `new Date()` por dentro não é provável por execução — o resultado muda
 * entre duas chamadas com a mesma entrada.
 */
export function paraTexto(estado: EstadoDaSessao, em: Date): string {
  const retomada: Retomada = {
    versao: VERSAO_DA_RETOMADA,
    salvadaEm: em.toISOString(),
    modeloId: estado.modeloId,
    clienteId: estado.clienteId,
    consultoriaId: estado.consultoriaId,
    aba: estado.aba,
    edicoes: mapearCelulas(estado.edicoes, codificar) as Record<string, CelulaGrade>,
    pincel: estado.pincel,
    folhasExtras: estado.folhasExtras.map((f) => mapearFolha(f, codificar)),
    criada: estado.criada === null ? null : { ...estado.criada, folha: mapearFolha(estado.criada.folha, codificar) },
  };
  return JSON.stringify(retomada);
}

// ---------------------------------------------------------------------------
// A VOLTA
// ---------------------------------------------------------------------------

/**
 * O TEXTO VIRA ESTADO — ou `null`, e `null` é a resposta honesta para lixo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ELA RECUSA EM VEZ DE ADIVINHAR                                       │
 * │                                                                      │
 * │ Toda checagem aqui existe para que um texto estranho não chegue à     │
 * │ grade. A regra é uma só: na dúvida, devolver `null` e abrir a          │
 * │ planilha limpa. Uma retomada que não acontece é um aborrecimento; uma  │
 * │ retomada meio aplicada é um defeito que aparece três telas depois.     │
 * │                                                                      │
 * │ O `JSON.parse` está dentro do `try` porque o texto vem de um lugar que │
 * │ este módulo não controla — o armazenamento da aba. Ele pode ter sido    │
 * │ truncado, ou ser de outra aplicação, ou ser lixo de uma versão antiga.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function deTexto(texto: string | null | undefined): Retomada | null {
  if (typeof texto !== "string" || texto.length === 0) return null;

  let bruto: unknown;
  try {
    bruto = JSON.parse(texto);
  } catch {
    return null;
  }

  if (typeof bruto !== "object" || bruto === null) return null;
  const r = bruto as Record<string, unknown>;

  /*
    A VERSÃO VEM PRIMEIRO. Um texto de outra versão tem campos com outra forma,
    e checá-lo campo a campo seria conferir o formato errado.
  */
  if (r.versao !== VERSAO_DA_RETOMADA) return null;

  if (typeof r.modeloId !== "string") return null;
  if (typeof r.clienteId !== "string") return null;
  if (typeof r.consultoriaId !== "string") return null;
  if (typeof r.salvadaEm !== "string") return null;
  if (typeof r.edicoes !== "object" || r.edicoes === null) return null;
  if (typeof r.pincel !== "object" || r.pincel === null) return null;
  if (!Array.isArray(r.folhasExtras)) return null;

  const edicoes = mapearCelulas(r.edicoes as Record<string, CelulaGrade>, decodificar);
  const folhasExtras = r.folhasExtras.map((f) => mapearFolha(f as FolhaGrade, decodificar));

  const criadaCrua = r.criada;
  const criada =
    typeof criadaCrua === "object" && criadaCrua !== null
      ? (() => {
          const c = criadaCrua as { nome?: unknown; folha?: unknown };
          if (typeof c.nome !== "string" || typeof c.folha !== "object" || c.folha === null) return null;
          return { nome: c.nome, folha: mapearFolha(c.folha as FolhaGrade, decodificar) };
        })()
      : null;

  /*
    A ABA É UM ÍNDICE, E ÍNDICE FORA DA FAIXA É DEFEITO CLÁSSICO.

    Se a retomada foi salva com três abas e o modelo hoje tem duas, o índice 2
    apontaria para uma aba que não existe — e a grade abriria em branco, sem
    nada dizendo por quê. `Math.max(0, ...)` garante que ele nunca é negativo;
    o teto quem aplica é o ambiente, que conhece a lista de abas e pode
    simplesmente abrir a primeira.
  */
  const aba = typeof r.aba === "number" && Number.isFinite(r.aba) ? Math.max(0, Math.trunc(r.aba)) : 0;

  return {
    versao: VERSAO_DA_RETOMADA,
    salvadaEm: r.salvadaEm,
    modeloId: r.modeloId,
    clienteId: r.clienteId,
    consultoriaId: r.consultoriaId,
    aba,
    edicoes,
    pincel: r.pincel as Record<string, EstiloGrade>,
    folhasExtras,
    criada,
  };
}

// ---------------------------------------------------------------------------
// A REGRA DE QUEM PODE RETOMAR O QUÊ
// ---------------------------------------------------------------------------

/**
 * ESTA RETOMADA SERVE PARA ONDE EU ESTOU?
 *
 * A regra é do PAR (modelo, cliente), e ela é de negócio, não técnica.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O CLIENTE E O MODELO PRECISAM BATER                           │
 * │                                                                      │
 * │ Uma edição é endereçada por `"<aba>::<endereço>"` — só o nome da aba e │
 * │ a célula. Duas fichas técnicas de clientes DIFERENTES têm abas com o   │
 * │ mesmo nome ("Base", "Custos") e as mesmas posições.                   │
 * │                                                                      │
 * │ Então aplicar a edição de um cliente na planilha de outro não daria    │
 * │ erro nenhum: escreveria um número CERTEZA no lugar errado. O custo do  │
 * │ prato do Empório apareceria na ficha do outro cliente, com a cor dela, │
 * │ e nada na tela diria que aquele número veio de outro lugar.           │
 * │                                                                      │
 * │ É o mesmo vazamento que `carregar` já evita limpando `edicoes` e       │
 * │ `pincel` na troca de cliente — a retomada entraria pela porta dos      │
 * │ fundos por cima dessa limpeza.                                        │
 * │                                                                      │
 * │ O MODELO entra pela mesma razão, um nível acima: trocar de ficha       │
 * │ técnica para custos muda o SIGNIFICADO das colunas. A aba "Custos" de  │
 * │ um modelo não tem as mesmas colunas da do outro, e o valor guardado em │
 * │ `Custos::C7` de um cairia em `Custos::C7` do outro — que é outro        │
 * │ campo.                                                                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * A `consultoria` NÃO entra na conta, de propósito. Ela é um recorte DENTRO do
 * mesmo cliente: as abas continuam com os mesmos nomes e as mesmas colunas, e
 * só a consultoria que assina o cabeçalho muda. Recusar a retomada por causa
 * dela faria perder trabalho por uma diferença que não muda célula nenhuma.
 */
export function valePara(retomada: Retomada, onde: OndeEstou): boolean {
  return retomada.modeloId === onde.modeloId && retomada.clienteId === onde.clienteId;
}

/**
 * QUANTO TEMPO FAZ QUE ESTE ESTADO FOI GUARDADO, EM PALAVRAS.
 *
 * Ele entra na nota da tela porque "retomado" sozinho não diz nada: retomar uma
 * planilha de dois minutos atrás é continuar o trabalho; retomar uma de ontem é
 * reencontrar trabalho antigo, e é bom saber qual dos dois está acontecendo.
 *
 * `agora` é parâmetro pelo mesmo motivo de `paraTexto`: uma função que lê o
 * relógio por dentro não se prova.
 */
export function haQuantoTempo(salvadaEm: string, agora: Date): string {
  const entao = new Date(salvadaEm);
  if (Number.isNaN(entao.getTime())) return "há algum tempo";

  const minutos = Math.floor((agora.getTime() - entao.getTime()) / 60000);

  if (minutos < 1) return "agora mesmo";
  if (minutos < 60) return minutos === 1 ? "há 1 minuto" : `há ${minutos} minutos`;

  const horas = Math.floor(minutos / 60);
  if (horas < 24) return horas === 1 ? "há 1 hora" : `há ${horas} horas`;

  const dias = Math.floor(horas / 24);
  return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
}

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ATÉ QUANDO UM RASCUNHO AINDA É "NÃO FINALIZADO"                       │
 * │                                                                      │
 * │ `sessionStorage` morre quando a ABA fecha, então em teoria ele não    │
 * │ precisaria de prazo: enquanto houver aba, ele é do trabalho de agora.  │
 * │ Mas uma aba pode ficar aberta por dias — e aí "retomar" deixaria de    │
 * │ ser continuar o trabalho e passaria a ser reencontrar trabalho velho   │
 * │ sem saber.                                                            │
 * │                                                                      │
 * │ Vinte e quatro horas é o corte, e ele é generoso de propósito: cobre   │
 * │ deixar a máquina dormir e voltar no dia seguinte — que é um gesto      │
 * │ real de quem trabalha — e não cobre uma aba esquecida desde a semana   │
 * │ passada.                                                              │
 * │                                                                      │
 * │ Passado o prazo, o rascunho NÃO é aplicado sozinho. Ele continua       │
 * │ guardado, e a nota oferece: quem reconhece o trabalho é ela.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const VALIDADE_DA_RETOMADA_MS = 24 * 60 * 60 * 1000;

/**
 * O RASCUNHO É DE AGORA, OU É DE ANTES?
 *
 * Ele tem de ser uma função e não um `if` no componente porque a resposta muda
 * com o relógio, e uma resposta que muda com o relógio precisa ser provável —
 * daí o `agora` ser parâmetro, como em `paraTexto` e `haQuantoTempo`.
 *
 * Uma data ilegível é tratada como VELHA: um rascunho cujo carimbo não se
 * consegue ler não é um rascunho em que se possa confiar.
 */
export function estaFresca(retomada: Retomada, agora: Date): boolean {
  const salvada = new Date(retomada.salvadaEm);
  if (Number.isNaN(salvada.getTime())) return false;
  return agora.getTime() - salvada.getTime() < VALIDADE_DA_RETOMADA_MS;
}
