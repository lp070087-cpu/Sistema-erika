/**
 * DE UMA LISTA ESCRITA PARA AS LINHAS DA IMPORTAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO RECEBE, E O QUE ELE NÃO FAZ                       │
 * │                                                                      │
 * │ Ele recebe TEXTO e devolve linhas. Não lê arquivo, não conhece PDF     │
 * │ nem planilha, não importa nada. É a mesma escolha de `normalizar.ts`,   │
 * │ e pela mesma razão: a regra que decide "este número é quantidade ou     │
 * │ preço?" é a parte difícil, e ela precisa poder ser conferida por        │
 * │ execução com uma lista de strings — sem subir tela nem arquivo.         │
 * │                                                                      │
 * │ O que ele NÃO faz é converter número. "5 kg" sai daqui como o TEXTO     │
 * │ "5 kg", e quem decide que isso são cinco quilos é `normalizar.ts`.      │
 * │ Aqui só se responde uma pergunta: EM QUAL DAS TRÊS COLUNAS este          │
 * │ pedaço do texto estava.                                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA CENTRAL: O QUE NÃO SE SABE CLASSIFICAR FICA ONDE FOI VISTO    │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Não inventar."                                                   │ │
 * │ │ "Quando não tiver certeza, marcar para revisão."                  │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ A tentação é adivinhar. "Batata 50" quase sempre é cinquenta reais,    │
 * │ e colocar 50 na coluna de valor acertaria na maioria das vezes. É       │
 * │ exatamente por isso que seria perigoso: acerta na maioria, erra em      │
 * │ silêncio na minoria, e um número errado num custo de ficha não parece   │
 * │ errado — parece um custo.                                              │
 * │                                                                      │
 * │ Então a regra é: um número só muda de coluna quando ALGO O IDENTIFICA.  │
 * │ Três coisas identificam: o rótulo ao lado ("Valor: 30"), o cifrão       │
 * │ ("R$ 30"), ou a unidade ("5 kg"). Sem nenhum dos três, o número NÃO      │
 * │ vira campo — ele fica dentro da descrição, onde ela o vê e decide.      │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ A ÚNICA DEDUÇÃO PERMITIDA, E POR QUE ELA NÃO É PALPITE            │ │
 * │ │                                                                  │ │
 * │ │ "Batata 5 kg 50" tem dois números, e só o primeiro está marcado.  │ │
 * │ │ Os campos de número são DOIS — quantidade e valor. Um está cheio, │ │
 * │ │ logo o outro número só pode ser o outro campo.                    │ │
 * │ │                                                                  │ │
 * │ │ Isso não é adivinhar o que o número significa: é contar quantas   │ │
 * │ │ casas existem. A dedução só vale quando sobra EXATAMENTE UM       │ │
 * │ │ número sem rótulo e EXATAMENTE UM campo vazio — duas sobras, ou   │ │
 * │ │ dois campos vazios, e o número volta para a descrição.            │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { papelDoCabecalho } from "./mapear-planilha";
import type { CabecalhoExtraido, LinhaExtraida } from "./tipos";

/* ------------------------------------------------------------------------ */
/* O cabeçalho do prato, quando a lista traz um                              */
/* ------------------------------------------------------------------------ */

/** A lista colada não traz título de prato: ela é a lista, não a ficha. */
export function cabecalhoVazio(): CabecalhoExtraido {
  return { titulo: null, categoria: null, rendimento: null, porcaoGramas: null };
}

/* ------------------------------------------------------------------------ */
/* Os padrões                                                               */
/* ------------------------------------------------------------------------ */

/**
 * O RÓTULO QUE NOMEIA UM CAMPO — "Quantidade: 5kg", "Preço 30".
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE ACEITA ATÉ TRÊS PALAVRAS NO MEIO                         │
 * │                                                                      │
 * │ "Quantidade de laranjas: 5" é uma linha real, e o número está três     │
 * │ palavras depois do rótulo. Exigir que o valor viesse colado faria a    │
 * │ linha inteira cair na descrição, com o 5 dentro dela.                  │
 * │                                                                      │
 * │ O custo é o risco oposto: "Peso do prato 30" casaria o rótulo "Peso"   │
 * │ com o valor 30. É um risco pequeno e visível — o número aparece na     │
 * │ conferência, e ela confere — e o benefício é o caso comum funcionar.    │
 * │                                                                      │
 * │ O que segura o risco é a exigência de o valor COMEÇAR COM DÍGITO.      │
 * │ Sem ela, "Preço do bolo" casaria o rótulo com o texto "do bolo" e      │
 * │ criaria um valor que não existe.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const ROTULOS_QTD = "quantidades?|qtd\\.?|qtde|qtdade|quant|volumes?|gramatura|pesos?(?:\\s+(?:l[íi]quido|bruto|limpo))?";

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O PLURAL PORTUGUÊS QUE O `?` NÃO FAZ                                │
 * │                                                                      │
 * │ "valor" faz plural em "valores" — o "es" inteiro entra, não só o "s". │
 * │ O mesmo vale para "total" → "totais" e "subtotal" → "subtotais".     │
 * │                                                                      │
 * │ Escrito `valores?`, o `?` vale só para o "e" que vem antes dele, e a  │
 * │ lista vira {valore, valores}. "Valore" não é palavra, e o SINGULAR    │
 * │ "valor" — a forma mais comum de um rótulo — não é reconhecida.        │
 * │ A grafia parecia certa e o defeito era invisível: a linha não casava  │
 * │ rótulo nenhum, o número ficava na descrição, e nada avisava.         │
 * │                                                                      │
 * │ Por isso os três vão escritos por extenso. "quantidades?" e           │
 * │ "pre[çc]os?" estão certos porque ali o plural é só o "s".            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const ROTULOS_VALOR =
  "valor(?:es)?|pre[çc]os?(?:\\s+(?:total|unit[áa]rio|unit|por\\s+kg|kg))?|custos?(?:\\s+(?:total|unit[áa]rio|unit))?|(?:sub)?total|(?:sub)?totais|investimento";

/**
 * AS UNIDADES, ESCRITAS UMA VEZ SÓ.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA LISTA NÃO PODE SER DUPLICADA                            │
 * │                                                                      │
 * │ Ela serve a dois lugares, e eles precisam concordar: `RE_UNIDADE` diz  │
 * │ que "5 kg" é uma quantidade, e `VALOR` usa a mesma lista para saber     │
 * │ onde o valor acaba quando vem "R$ 50,00 un".                          │
 * │                                                                      │
 * │ Se fossem duas listas, a primeira grafia nova entraria numa e não na   │
 * │ outra — e o sintoma seria o pior possível: um valor que às vezes para  │
 * │ no lugar certo e às vezes não, dependendo de como a unidade foi        │
 * │ escrita.                                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const UNIDADES =
  "kgs?|quilos?|kilogramas?|gramas?|grs?|g|lt?s?|litros?|mls?|mililitros?|uns?|unds?|unids?|unidades?|pcts?|pacotes?|cxs?|caixas?|dz|d[úu]zia";

/**
 * O VALOR: OPCIONALMENTE COM CIFRÃO — UM NÚMERO, E NO MÁXIMO UMA UNIDADE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE PODE ENTRAR, E O QUE NÃO PODE                                  │
 * │                                                                      │
 * │ O corpo do número é `\\d(?:[\\d.,]|\\s\\d{3})*`: aceita "5", "18,90",   │
 * │ "50.000" e "1 500,00" — a última porque o espaço ali separa           │
 * │ milhares, não campos, e sem essa alternativa o valor pararia no "1".  │
 * │                                                                      │
 * │ A cauda é UMA PALAVRA de unidade: "5 kg", "500 g", "R$ 50,00 un".     │
 * │                                                                      │
 * │ Aqui já houve um `[^|;\\t]*?`, que aceitava QUALQUER texto. Sozinho    │
 * │ ele parecia inofensivo porque o fim do valor exigia um separador; mas  │
 * │ quando o fim passou a admitir também "antes do próximo número", o      │
 * │ valor começou a atravessar palavras, e a quantidade de "qtd 5 kg       │
 * │ valor 50,00" saía "5 kg valor" — com o rótulo seguinte dentro dela.    │
 * │ Aceitar só a unidade resolve na raiz: o valor é um número, e não um    │
 * │ número seguido de qualquer coisa.                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const VALOR = `((?:R\\$\\s*)?\\d(?:[\\d.,]|\\s\\d{3})*(?:\\s*(?:${UNIDADES}))?)`;

/**
 * ONDE O VALOR TERMINA — NUMA FRONTEIRA DE PALAVRA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE NÃO PRECISA DIZER MAIS DO QUE ISSO                        │
 * │                                                                      │
 * │ O valor só pode terminar de três jeitos: no fim da linha, antes de um  │
 * │ separador de campo, ou antes de um espaço. Como o padrão acima já      │
 * │ determina o que é o valor, esta fronteira não escolhe o comprimento    │
 * │ dele — ela só impede que ele pare no meio de um número. É por isso que │
 * │ ela pode ser frouxa sem deixar entrar texto: quem separa é `VALOR`.    │
 * │                                                                      │
 * │ A versão anterior tentava escolher o comprimento por aqui, admitindo   │
 * │ "antes do próximo número". Funcionava enquanto o valor podia ser       │
 * │ qualquer texto — e passou a quebrar exatamente quando o valor ficou     │
 * │ preciso, porque aí "5 kg" seguido de uma palavra ("valor") não casava  │
 * │ nem com separador nem com número. A regra certa era a de cima.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const FIM = "(?=\\s|$)";
/** Até três palavras entre o rótulo e o valor. Ver o bloco acima. */
const ENTRE = "(?:[\\p{L}]+[ \\t]+){0,3}?";

/*
  O FLAG `d`, E POR QUE ELE ESTÁ AQUI.

  ┌────────────────────────────────────────────────────────────────────────┐
  │ O DEFEITO QUE ELE CONSERTA                                             │
  │                                                                        │
  │ O grupo 2 é o valor, e o código antigo achava ONDE ele começava por     │
  │ ARITMÉTICA: o começo do casamento, mais o prefixo do rótulo, mais o      │
  │ `indexOf` do valor dentro do casamento. Um comprimento de prefixo        │
  │ não é um deslocamento de posição — o `(?:^|[\\s|;\\t/])` de abertura     │
  │ consome um caractere de larguras diferentes, e o `\\s*[:=]?\\s*` some     │
  │ com espaços de tamanhos diferentes antes de o valor começar.             │
  │                                                                        │
  │ Com TAB antes do número — que é exatamente o que uma planilha copiada    │
  │ produz — a conta errava por um, e a janela reivindicada cobria a         │
  │ célula VIZINHA:                                                         │
  │                                                                        │
  │   "Arroz<TAB>qtd 5 kg<TAB>R$ 50,00" → a fatia era " kg<TAB>", e não      │
  │   "5 kg". O rótulo então reivindicava um pedaço que não era dele, o      │
  │   campo certo ficava ocupado, e o resultado era                         │
  │   descrição "Arroz qtd 5" — com o rótulo "qtd" e um "5" órfão dentro do  │
  │   nome do ingrediente.                                                  │
  │                                                                        │
  │ O flag `d` faz o próprio motor entregar `match.indices`, a posição      │
  │ EXATA de cada grupo. Não há mais prefixo a supor nem `indexOf` a         │
  │ procurar: onde o motor diz que o grupo está, é onde ele está. A conta    │
  │ que errava deixa de existir — é isso que torna o defeito impossível, e   │
  │ não apenas corrigido neste caso.                                       │
  └────────────────────────────────────────────────────────────────────────┘
*/
const RE_ROTULO_QTD = new RegExp(`(?:^|[\\s|;\\t/])(${ROTULOS_QTD})\\s*[:=]?\\s*${ENTRE}${VALOR}${FIM}`, "gdiu");
const RE_ROTULO_VALOR = new RegExp(`(?:^|[\\s|;\\t/])(${ROTULOS_VALOR})\\s*[:=]?\\s*${ENTRE}${VALOR}${FIM}`, "gdiu");

/** Dinheiro escrito com cifrão. Não precisa de rótulo: o cifrão é o rótulo. */
const RE_CIFRAO = /R\$\s*\d[\d.,]*/giu;

/**
 * NÚMERO COM UNIDADE — "5 kg", "395g", "1,5 L".
 *
 * A fronteira no fim (`\\b`) é o que impede "500 gengibres" de virar
 * quinhentos gramas: depois do "g" vem uma letra, e a fronteira de palavra
 * não acontece.
 */
const RE_UNIDADE = new RegExp(`\\d[\\d.,]*\\s*(?:${UNIDADES})\\b`, "giu");

/** Um número solto, sem nada que o identifique. */
const RE_NUMERO_SOLTO = /\d[\d.,]*/gu;

/** O que sobra depois de tirar rótulo e número não é descrição. */
const RE_SO_SEPARADOR = /^[\s\-–—|;,\/.:]+$/u;

type Ocorrencia = {
  /** Onde a reivindicação COMEÇA — no rótulo, quando há um. */
  inicio: number;
  /** Onde ela TERMINA — no fim do valor. */
  fim: number;
  /** O texto que vai para o campo. No rótulo é só o valor; no resto, o casamento inteiro. */
  valor: string;
  destino: "quantidade" | "valor";
};

/**
 * AS OCORRÊNCIAS QUE IDENTIFICAM UM CAMPO, NA ORDEM EM QUE ELAS MANDAM.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A ORDEM DOS PADRÕES DECIDE O RESULTADO                       │
 * │                                                                      │
 * │ O rótulo vem primeiro porque é o sinal EXPLÍCITO: quem escreveu        │
 * │ "Valor: 30" disse o que o número era. O cifrão e a unidade vêm depois, │
 * │ porque são indícios fortes mas menos diretos.                          │
 * │                                                                      │
 * │ E o que já foi reivindicado por um padrão NÃO pode ser reivindicado    │
 * │ pelo seguinte — é para isso que serve o mapa de ocupação. Sem ele,     │
 * │ "Quantidade: 5kg" casaria o rótulo (certo) e depois o "5kg" casaria a  │
 * │ unidade de novo, e o mesmo pedaço de texto viraria duas vezes o mesmo  │
 * │ campo — ou, pior, o rótulo diria quantidade e a unidade diria outra    │
 * │ coisa.                                                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function ocorrencias(texto: string): readonly Ocorrencia[] {
  const achadas: Ocorrencia[] = [];
  const ocupado = new Array<boolean>(texto.length).fill(false);

  function varrer(re: RegExp, destino: "quantidade" | "valor", captura: boolean): void {
    for (const casamento of texto.matchAll(re)) {
      /*
        A POSIÇÃO VEM DO MOTOR, NÃO DE UMA CONTA.

        ┌────────────────────────────────────────────────────────────────────┐
        │ POR QUE SÃO DOIS CAMINHOS, E NÃO UM                                │
        │                                                                    │
        │ Em modo captura o campo é o GRUPO 2, e o único jeito de saber onde  │
        │ ele começa é `casamento.indices[2]` — que só existe com o flag `d`. │
        │                                                                    │
        │ Fora dele o campo é o CASAMENTO INTEIRO, e aí a posição é          │
        │ `casamento.index` mais o comprimento do texto casado: exato, sem    │
        │ flag nenhum. Exigir `d` também aqui seria uma dependência a mais    │
        │ para nada — e foi o que quebrou quando o flag entrou: as duas       │
        │ varreduras de cifrão e de unidade não têm o flag, `indices` vinha   │
        │ `undefined`, e todo número com unidade era descartado em silêncio. │
        │                                                                    │
        │ O comentário registra isso porque o erro é invisível: nada falha,   │
        │ nada avisa — os campos simplesmente deixam de ser encontrados, e a  │
        │ linha inteira cai na descrição.                                    │
        └────────────────────────────────────────────────────────────────────┘
      */
      let inicioDoCampo: number;
      let fimDoCampo: number;
      /* A reivindicação, que no rótulo é MAIOR que o campo: ela começa no
         rótulo e engole o miolo entre ele e o valor. Ver o comentário abaixo. */
      let inicioReivindicado: number;
      let fimReivindicado: number;

      if (captura) {
        const indices = casamento.indices;
        if (indices === undefined) continue;
        const valor = indices[2];
        if (valor === undefined) continue;
        /*
          ┌──────────────────────────────────────────────────────────────────┐
          │ O RÓTULO É ACHADO PARA SER GASTO, NÃO PARA IR PARA O CAMPO      │
          │                                                                  │
          │ O campo é o valor, e só. Mas o rótulo que o apresentou — e o      │
          │ miolo entre os dois — precisa entrar na área REIVINDICADA, senão  │
          │ eles caem na descrição: "Batata 5 kg valor 50,00" deixava a       │
          │ descrição "Batata valor", com a palavra "valor" dentro do nome    │
          │ do ingrediente.                                                  │
          │                                                                  │
          │ O começo do rótulo é `indices[1]`, e não o começo do casamento,   │
          │ porque o `(?:^|[\\s|;\\t/])` de abertura consome um caractere que  │
          │ PERTENCE À CÉLULA ANTERIOR: em "Arroz, preço 30" a vírgula é de   │
          │ "Arroz," e gastá-la apagaria a pontuação do ingrediente.          │
          └──────────────────────────────────────────────────────────────────┘
        */
        const rotulo = indices[1];
        if (rotulo === undefined) continue;

        inicioDoCampo = valor[0];
        fimDoCampo = valor[1];
        inicioReivindicado = rotulo[0];
        fimReivindicado = valor[1];
      } else {
        const inicio = casamento.index;
        if (inicio === undefined) continue;
        inicioDoCampo = inicio;
        fimDoCampo = inicio + casamento[0].length;
        inicioReivindicado = inicioDoCampo;
        fimReivindicado = fimDoCampo;
      }

      const capturado = texto.slice(inicioDoCampo, fimDoCampo);

      /*
        UM CAMPO VAZIO NÃO É UM CAMPO.

        O grupo 2 permite zero palavras entre o rótulo e o valor, e por isso
        pode casar vazio. Um `CampoExtraido` de texto vazio não é ausência —
        `null` é ausência —, e uma janela de comprimento zero não ocupa
        caractere nenhum para impedir a próxima reivindicação.
      */
      if (capturado === "") continue;

      if (inicioReivindicado < 0 || fimReivindicado > texto.length) continue;

      /*
        A DISPUTA É PELA ÁREA REIVINDICADA, E A OCUPAÇÃO TAMBÉM.

        É o mapa de ocupação de sempre (ver o bloco no topo): o que já foi
        reivindicado não pode ser reivindicado de novo. A diferença é que
        agora ele guarda também o rótulo, e é isso que impede o mesmo
        "valor" de ser achado duas vezes pela mesma varredura — o Motor de
        `String.matchAll` avança pelo casamento INTEIRO, então um casamento
        que caiba dentro de outro seria encontrado nas duas vezes.
      */
      let livre = true;
      for (let i = inicioReivindicado; i < fimReivindicado; i++) {
        if (ocupado[i]) {
          livre = false;
          break;
        }
      }
      if (!livre) continue;

      for (let i = inicioReivindicado; i < fimReivindicado; i++) ocupado[i] = true;
      achadas.push({ inicio: inicioReivindicado, fim: fimReivindicado, valor: capturado, destino });
    }
  }

  varrer(RE_ROTULO_QTD, "quantidade", true);
  varrer(RE_ROTULO_VALOR, "valor", true);
  varrer(RE_CIFRAO, "valor", false);
  varrer(RE_UNIDADE, "quantidade", false);

  return achadas;
}

/** Um número que nenhum padrão reivindicou, com o lugar onde ele está. */
type NumeroSolto = { inicio: number; fim: number; valor: string };

/**
 * OS NÚMEROS QUE NENHUM PADRÃO REIVINDICOU — COM A POSIÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE DEVOLVE A POSIÇÃO E NÃO SÓ O TEXTO                       │
 * │                                                                      │
 * │ Porque quem chama precisa poder GASTAR o número.                     │
 * │                                                                      │
 * │ A dedução por eliminação (ver o bloco no topo) promove um número      │
 * │ solto a campo. Enquanto ela devolvia só o valor, o número era          │
 * │ promovido e CONTINUAVA na descrição: "Cebola 2 kg 18,90" saía com     │
 * │ valor "18,90" e descrição "Cebola 18,90" — o preço dentro do nome do  │
 * │ ingrediente, esperando para ser cadastrado assim.                     │
 * │                                                                      │
 * │ Devolvendo a posição, quem promoveu pode riscar o trecho, e a         │
 * │ descrição passa a ser o que sobrou de verdade.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function numerosSoltos(texto: string, achadas: readonly Ocorrencia[]): readonly NumeroSolto[] {
  const ocupado = new Array<boolean>(texto.length).fill(false);

  for (const a of achadas) {
    for (let i = a.inicio; i < a.fim; i++) ocupado[i] = true;
  }

  const soltos: NumeroSolto[] = [];
  for (const casamento of texto.matchAll(RE_NUMERO_SOLTO)) {
    const inicio = casamento.index;
    if (inicio === undefined) continue;
    const fim = inicio + casamento[0].length;
    let livre = true;
    for (let i = inicio; i < fim; i++) {
      if (ocupado[i]) {
        livre = false;
        break;
      }
    }
    if (livre) soltos.push({ inicio, fim, valor: casamento[0] });
  }
  return soltos;
}

/**
 * A DESCRIÇÃO É O QUE SOBRA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELA NÃO É O PRIMEIRO PEDAÇO DO TEXTO                         │
 * │                                                                      │
 * │ Numa linha como "5 kg de batata", o nome está DEPOIS do número. Numa   │
 * │ como "Batata - 5 kg - R$ 50", está antes. Escolher um lado por         │
 * │ posição deixaria um dos dois casos com o nome errado.                   │
 * │                                                                      │
 * │ Sobrar resolve os dois: tira-se do texto o que já foi reivindicado, e  │
 * │ o que resta é a descrição — venha ela de onde vier.                    │
 * │                                                                      │
 * │ Depois da retirada, sobram os separadores órfãos: "Batata -  - " tem   │
 * │ dois travessões porque as duas células entre eles saíram. Eles são      │
 * │ limpos das pontas e das sequências, e SÓ das pontas: um hífen no meio   │
 * │ de "Peito de frango s/ osso" é parte do nome, e apagá-lo mudaria o      │
 * │ ingrediente.                                                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function descricaoDe(
  texto: string,
  achadas: readonly Ocorrencia[],
  soltos: readonly NumeroSolto[],
  promovidos: readonly NumeroSolto[]
): string {
  const ocupado = new Array<boolean>(texto.length).fill(false);

  for (const a of achadas) {
    for (let i = a.inicio; i < a.fim; i++) ocupado[i] = true;
  }

  /*
    O NÚMERO QUE VIROU CAMPO SAI; O QUE NÃO VIROU FICA.

    É a regra central do arquivo: o que não se soube classificar fica onde foi
    visto. Se "50" de "Batata 50" não é quantidade nem valor, ele não pode
    desaparecer — ela precisa vê-lo para decidir o que ele é.

    Mas o que VIROU campo não pode ficar aqui também: "Cebola 2 kg 18,90" com o
    valor promovido a campo não pode sair com "18,90" ainda dentro do nome. A
    promoção precisa GASTAR o número, e é isso que `promovidos` faz.
  */
  for (const p of promovidos) {
    for (let i = p.inicio; i < p.fim; i++) ocupado[i] = true;
  }

  let sobra = "";
  for (let i = 0; i < texto.length; i++) {
    sobra += ocupado[i] ? " " : (texto[i] ?? " ");
  }

  void soltos;
  void RE_SO_SEPARADOR;

  return sobra
    .replace(/\s+/g, " ")
    // Separadores órfãos nas pontas e entre espaços — nunca dentro de palavra.
    .replace(/(?:^|\s)[-–—|;,\/]+(?=\s|$)/g, " ")
    .replace(/[:=]+\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * UMA LINHA DA LISTA VIRA UMA LINHA DA IMPORTAÇÃO.
 *
 * Devolve `null` quando a linha não tem dado nenhum — e `null` aqui é
 * "não é uma linha de tabela", diferente de "linha com defeito", que
 * continua e vai para a conferência ser julgada.
 */
export function lerLinha(texto: string, ordem: number): LinhaExtraida | null {
  const linha = texto.trim();
  if (linha === "") return null;

  const achadas = ocorrencias(linha);
  const soltos = numerosSoltos(linha, achadas);

  let quantidade: string | null = null;
  let valor: string | null = null;

  for (const a of achadas) {
    const limpo = a.valor.trim();
    if (limpo === "") continue;
    if (a.destino === "quantidade") {
      if (quantidade === null) quantidade = limpo;
    } else if (valor === null) {
      valor = limpo;
    }
  }

  /*
    A DEDUÇÃO POR ELIMINAÇÃO — ver o bloco no topo do arquivo.

    Só vale com UMA sobra e UM campo vazio. Duas sobras e o sistema não sabe
    qual é qual; dois campos vazios e ele não sabe se a sobra é quantidade ou
    valor. Em qualquer dos dois casos a sobra fica na descrição, e a
    conferência mostra a ausência para ela preencher.
  */
  const sobra = soltos[0] ?? null;
  const promovidos: readonly NumeroSolto[] =
    soltos.length === 1 && sobra !== null && (quantidade === null) !== (valor === null)
      ? [sobra]
      : [];

  if (promovidos.length === 1 && sobra !== null) {
    if (quantidade === null) quantidade = sobra.valor;
    else valor = sobra.valor;
  }

  const descricao = descricaoDe(linha, achadas, soltos, promovidos);

  // Nada em campo nenhum e nada de descrição: não é linha de dado.
  if (descricao === "" && quantidade === null && valor === null) return null;

  /*
    A ORDEM É A LINHA FÍSICA DO TEXTO, 1-based.

    É o número que ela vê no editor quando abre o arquivo ao lado, e o mesmo
    que a coluna LINHA da conferência mostra. Uma linha criada à mão na
    conferência recebe ordem negativa — ver `janela.tsx` —, e por isso não há
    colisão possível entre as duas.
  */
  const campo = (t: string | null) => (t === null ? null : { texto: t, pagina: null });

  return {
    descricao: campo(descricao === "" ? null : descricao),
    quantidade: campo(quantidade),
    valor: campo(valor),
    ordem,
  };
}

/**
 * A LISTA INTEIRA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A LINHA DE CABEÇALHO É RECONHECIDA E DESCARTADA                       │
 * │                                                                      │
 * │ Colar de uma planilha traz o cabeçalho junto: "Ingrediente  Quantidade │
 * │ Valor". Sem reconhecê-lo, ele viraria uma linha de dado — e a ficha    │
 * │ ganharia um ingrediente chamado "Ingrediente".                         │
 * │                                                                      │
 * │ A conferência reusa `papelDoCabecalho`, a MESMA função que o leitor de  │
 * │ planilha usa para achar o cabeçalho de um `.xlsx`. Uma segunda lista    │
 * │ de sinônimos aqui divergiria da primeira na primeira grafia nova —     │
 * │ "Insumo" entraria numa e não na outra.                                 │
 * │                                                                      │
 * │ A busca é curta de propósito: só as três primeiras linhas não vazias.  │
 * │ Num texto colado o cabeçalho está no começo; procurar mais fundo        │
 * │ arriscaria descartar uma linha de dado que por acaso trouxesse duas     │
 * │ palavras parecidas com rótulo.                                         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function lerLista(texto: string): readonly LinhaExtraida[] {
  const fisicas = texto.split(/\r\n|\r|\n/);
  const descartadas = acharLinhasDeCabecalho(fisicas);

  const saida: LinhaExtraida[] = [];
  for (let i = 0; i < fisicas.length; i++) {
    if (descartadas.has(i)) continue;
    const linha = lerLinha(fisicas[i] ?? "", i + 1);
    if (linha !== null) saida.push(linha);
  }
  return saida;
}

/** Os índices das linhas que são cabeçalho — no máximo uma, entre as três primeiras. */
function acharLinhasDeCabecalho(fisicas: readonly string[]): ReadonlySet<number> {
  const descartadas = new Set<number>();
  let vistas = 0;

  for (let i = 0; i < fisicas.length && vistas < 3; i++) {
    const bruta = fisicas[i] ?? "";
    if (bruta.trim() === "") continue;
    vistas++;

    const papeis = new Set<string>();
    for (const pedaco of bruta.split(/[\t|;]|\s{2,}/)) {
      const veredito = papelDoCabecalho(pedaco);
      if (typeof veredito === "string") papeis.add(veredito);
    }

    // Duas colunas nomeadas numa linha que não tem número nenhum de dado: é
    // cabeçalho. A exigência dos dois juntos é o que impede uma linha de dado
    // como "Sal e pimenta" de ser descartada.
    if (papeis.size >= 2 && !/\d/.test(bruta)) {
      descartadas.add(i);
      return descartadas;
    }
  }

  return descartadas;
}
