/**
 * O DESTINO DA IMPORTAÇÃO — o que acontece DEPOIS da conferência.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE FALTAVA NA ESTEIRA                                             │
 * │                                                                      │
 * │ A esteira já estava inteira até a conferência: origem → leitura →     │
 * │ normalização → conferência. E a última etapa só sabia fazer UMA coisa: │
 * │ gerar planilha.                                                        │
 * │                                                                      │
 * │ O briefing pede três destinos, e pede que a conferência seja          │
 * │ preservada em todos:                                                  │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ ADICIONAR A INGREDIENTES                                         │ │
 * │ │ CRIAR FICHA TÉCNICA                                              │ │
 * │ │ GERAR PLANILHA                                                   │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ E pede que o CONTEXTO pré-selecione: `/ingredientes` abre com o       │
 * │ destino Ingredientes marcado, `/fichas` com Ficha, `/planilhas` com   │
 * │ Planilha — "mas sempre preservar a conferência".                      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM MÓDULO PURO, E NÃO LÓGICA DENTRO DA JANELA         │
 * │                                                                      │
 * │ As três contas abaixo são as que MAIS importa poder conferir, porque  │
 * │ são as que decidem o que entra no sistema:                            │
 * │                                                                      │
 * │   · quais linhas viram insumo;                                        │
 * │   · quais linhas viram item de ficha, e com que quantidade;            │
 * │   · e por que uma linha ficou de fora.                                │
 * │                                                                      │
 * │ Dentro de um componente de tela, a única forma de conferir seria       │
 * │ clicar. Aqui a bancada chama as funções e compara com o esperado —    │
 * │ e é por isso que elas não importam nada de `@/lib/planilhas/grade`    │
 * │ além de TIPOS: o módulo continua carregável fora do Next.             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA QUE GOVERNA OS TRÊS: NENHUM DESTINO "CONSERTA" A LINHA        │
 * │                                                                      │
 * │ Um destino é uma TRADUÇÃO, não um julgamento novo. Se a conferência   │
 * │ marcou uma linha como REVISAR, é porque o texto é ambíguo — "1.500"   │
 * │ pode ser mil e quinhentos ou um vírgula cinco. Nenhuma das três       │
 * │ traduções abaixo decide isso: as três recusam a linha, e dizem por    │
 * │ quê.                                                                  │
 * │                                                                      │
 * │ Seria fácil "resolver" o ambíguo escolhendo a leitura brasileira e     │
 * │ seguir. Seria exatamente o que o briefing proíbe: transformar dado     │
 * │ ambíguo em verdade automaticamente, sem ela ver.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { Ingrediente, ItemFicha } from "@/lib/dados";
import type { Leitura } from "./normalizar";
import type { CabecalhoConferido, LinhaConferida } from "./validar";
import { podeCalcular } from "./validar";
import {
  ingredienteDaLinha,
  itemDaLinha,
  type AjustesDaLinha,
  type AjustesDoCabecalho,
} from "./para-ficha";

/* ─────────────────────────────────────────────────────────────────────── *
 * OS DESTINOS
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * OS TRÊS DESTINOS, NA ORDEM EM QUE APARECEM.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA ORDEM, E NÃO OUTRA                                      │
 * │                                                                      │
 * │ Ela é a ordem do CRESCIMENTO do dado, e não uma preferência:          │
 * │                                                                      │
 * │   INGREDIENTES — a linha vira insumo. É a unidade: nome, compra,       │
 * │                  pesagens. O que entra aqui serve às fichas depois.    │
 * │                                                                      │
 * │   FICHA        — as linhas viram itens de um prato, com quantidade e   │
 * │                  etapa. É o conjunto.                                  │
 * │                                                                      │
 * │   PLANILHA     — o conjunto vira grade editável. É a forma.            │
 * │                                                                      │
 * │ Quem olha a tela lê a lista de cima para baixo como "quanto mais eu   │
 * │ quero fazer com isto": cadastrar os insumos, montar o prato, ou       │
 * │ abrir como planilha.                                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O tipo é DERIVADO da lista, como em `ETAPAS` e em `ORIGENS`: acrescentar um
 * destino exige mexer num lugar só, e o compilador cobra o resto.
 */
export const DESTINOS = [
  {
    id: "ingredientes",
    rotulo: "Adicionar a ingredientes",
    descricao: "Cada linha vira um insumo da biblioteca, com a compra e as pesagens que o documento trouxe.",
    verbo: "Adicionar à biblioteca",
    /*
      A ROTA DO CONTEXTO — por onde a Érika já está quando este destino é o
      pré-selecionado. É o `?destino=` que a página de importação recebe.
    */
    contexto: "/ingredientes",
  },
  {
    id: "ficha",
    rotulo: "Criar ficha técnica",
    descricao: "As linhas viram os itens de um prato, com quantidade e etapa — e o custo sai calculado.",
    verbo: "Criar a ficha",
    contexto: "/fichas",
  },
  {
    id: "planilha",
    rotulo: "Gerar planilha",
    descricao: "A conferência vira uma grade editável na Central, como ela já faz hoje.",
    verbo: "Gerar planilha",
    contexto: "/planilhas",
  },
] as const;

export type IdDoDestino = (typeof DESTINOS)[number]["id"];

/** A entrada de um destino, ou `undefined` quando não é um dos três. */
export function destinoDe(id: string | null | undefined): (typeof DESTINOS)[number] | undefined {
  if (!id) return undefined;
  return DESTINOS.find((d) => d.id === id);
}

/**
 * O DESTINO QUE O CONTEXTO PRÉ-SELECIONA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE VEM DE `?destino=` E NÃO DO CAMINHO DE ORIGEM             │
 * │                                                                      │
 * │ A tentação era ler o `Referer`, ou passar um caminho por prop e        │
 * │ compará-lo com `/ingredientes`. As duas falham do mesmo jeito: o       │
 * │ `Referer` some quando o navegador decide não mandá-lo, e o caminho     │
 * │ por prop obrigaria a rota `/planilhas/importar` a conhecer as três     │
 * │ telas que a chamam — quer dizer, a saber quem são seus chamadores.     │
 * │                                                                      │
 * │ Um parâmetro explícito na URL é o que mantém a página de importação    │
 * │ sem essa lista: quem manda é o link, e o link é escrito por quem       │
 * │ sabe de onde está saindo.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Sem parâmetro — o link antigo, que não o trazia — o padrão é PLANILHA, que
 * é o que esta esteira fazia antes de os três destinos existirem. Nada muda
 * para quem chega pelo caminho de sempre.
 */
export const DESTINO_PADRAO: IdDoDestino = "planilha";

/**
 * LÊ `?destino=` DA URL — a fronteira, e não o miolo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A VALIDAÇÃO MORA AQUI, E NÃO NA PÁGINA                        │
 * │                                                                      │
 * │ Porque é aqui que estão os três ids. Se a página validasse, ela teria  │
 * │ a própria cópia da lista — e um destino novo nasceria em `DESTINOS` e  │
 * │ não na validação, ficando aceito na tela e recusado na URL (ou o       │
 * │ contrário). Mesmo desenho de `origemDaUrl` em `origens.ts`.            │
 * │                                                                      │
 * │ Devolve `undefined` para qualquer coisa que não seja um dos três —     │
 * │ inclusive para `null` (parâmetro ausente) e para strings vazias. Quem  │
 * │ chama decide o padrão; aqui não se inventa destino.                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function destinoDaUrl(valor: string | null | undefined): IdDoDestino | undefined {
  return destinoDe(valor)?.id;
}

/* ─────────────────────────────────────────────────────────────────────── *
 * O DESTINO "INGREDIENTES"
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * POR QUE UMA LINHA NÃO VIROU INSUMO.
 *
 * Os motivos são declarados como uma união fechada, e não como texto solto,
 * porque a TELA decide o que fazer com cada um — e "uma linha sem preço" e
 * "uma linha ambígua" pedem coisas diferentes dela: a primeira ela resolve
 * na biblioteca, a segunda na conferência.
 */
export type RecusaDeInsumo =
  /** A conferência não conseguiu ler o nome. Sem nome não há insumo. */
  | { motivo: "SEM_NOME" }
  /** O texto é ambíguo — a leitura do valor falhou, e o próprio aviso diz por quê. */
  | { motivo: "AMBIGUA"; detalhe: string }
  /** A linha existe para ser corrigida antes. Ela continua na tela dela. */
  | { motivo: "A_REVISAR"; detalhe: string };

export type InsumoDaImportacao = {
  linha: LinhaConferida;
  /** O insumo montado. `null` quando a linha foi recusada. */
  ingrediente: Ingrediente | null;
  /** Por que ele não foi montado. `null` quando foi. */
  recusa: RecusaDeInsumo | null;
};

/**
 * AS LINHAS VIRAM INSUMOS — uma a uma, com o motivo de cada recusa.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE DEVOLVE TODAS AS LINHAS, E NÃO SÓ AS ACEITAS                  │
 * │                                                                      │
 * │ Devolver só os insumos seria mais cômodo para quem chama, e produziria │
 * │ a pior tela possível: ela confere 38 linhas, clica em adicionar, e     │
 * │ entram 34. As outras quatro sumiram sem que nada fosse dito.           │
 * │                                                                      │
 * │ Com a lista inteira, a tela pode dizer "38 linhas, 34 insumos, e       │
 * │ estas 4 continuam pendentes — por isto". E é a mesma decisão do         │
 * │ `resumoDaFicha`, que conta os itens que ficaram fora da soma em vez de │
 * │ somar os que sobraram em silêncio.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ORDEM DAS RECUSAS, E POR QUE ELA É ESTA                            │
 * │                                                                      │
 * │ AMBÍGUA vem ANTES de A_REVISAR, e não é detalhe de implementação: a    │
 * │ causa é o dado, e o aviso de revisão é consequência dela. Dizer         │
 * │ "precisa revisar" quando se sabe exatamente o que está ambíguo seria    │
 * │ obrigá-la a procurar o defeito numa linha de seis colunas.             │
 * │                                                                      │
 * │ `podeCalcular` responde pela ambiguidade — e é o MESMO julgamento que  │
 * │ o motor de custo usa. Uma segunda regra escrita aqui poderia discordar │
 * │ dele no dia em que a validação mudasse.                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function insumosDaLinha(
  conferencia: { linhas: readonly LinhaConferida[] },
  ajustes?: Readonly<Record<number, AjustesDaLinha>>
): readonly InsumoDaImportacao[] {
  return conferencia.linhas.map((linha) => {
    const nome = (linha.descricao ?? "").trim();

    if (nome === "") {
      return { linha, ingrediente: null, recusa: { motivo: "SEM_NOME" } as const };
    }

    const avisoDeLeitura = avisoAmbiguo(linha);
    if (avisoDeLeitura !== null) {
      return { linha, ingrediente: null, recusa: { motivo: "AMBIGUA", detalhe: avisoDeLeitura } as const };
    }

    /* A linha física é a `ordem`: é ela que aparece na coluna LINHA da conferência. */
    const ingrediente = ingredienteDaLinha(linha, linha.ordem, ajustes?.[linha.ordem]);

    if (ingrediente === null) {
      return { linha, ingrediente: null, recusa: { motivo: "SEM_NOME" } as const };
    }

    if (!podeCalcular(linha)) {
      return {
        linha,
        ingrediente: null,
        recusa: { motivo: "A_REVISAR", detalhe: motivoDaRevisao(linha) } as const,
      };
    }

    return { linha, ingrediente, recusa: null };
  });
}

/**
 * O AVISO AMBÍGUO DA LINHA — a quantidade ou o valor que a validação não
 * conseguiu ler, com a palavra dela.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ DUAS LEITURAS RUINS, E POR QUE SÓ UMA RECUSA AQUI                     │
 * │                                                                      │
 * │ `Leitura` tem dois estados de falha, e eles NÃO pedem a mesma coisa:   │
 * │                                                                      │
 * │   AMBIGUO  — há duas leituras possíveis e materialmente diferentes.    │
 * │              "1.500" pode ser mil e quinhentos ou um vírgula cinco.    │
 * │              É um problema de DECISÃO: alguém precisa escolher.        │
 * │                                                                      │
 * │   INVALIDO — o texto existe e não é número. "cinco quilos" cai aqui,   │
 * │              e não cai em ambiguidade: não há duas leituras, não há     │
 * │              leitura nenhuma. É um problema de DIGITAÇÃO.               │
 * │                                                                      │
 * │ Os dois bloqueiam o item — `podeCalcular` recusa ambos —, mas só o      │
 * │ AMBÍGUO é reportado AQUI, na recusa de insumo, porque é o único em que  │
 * │ o motivo já explica a escolha que falta. O INVALIDO segue para          │
 * │ `podeCalcular`, que o marca como A_REVISAR com os avisos da própria     │
 * │ validação — e esses dizem o que reescrever.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O motivo vem da própria leitura, escrito em português: reescrever a frase
 * aqui criaria uma segunda versão do mesmo diagnóstico, e as duas divergiriam.
 */
function avisoAmbiguo(linha: LinhaConferida): string | null {
  if (linha.leituraQuantidade.estado === "AMBIGUO") return linha.leituraQuantidade.motivo;
  if (linha.leituraValor.estado === "AMBIGUO") return linha.leituraValor.motivo;
  return null;
}

/**
 * O AVISO MAIS GRAVE DA LINHA, quando a recusa é "precisa revisar".
 *
 * Ele lê o CAMPO `mensagem` — que é a frase escrita para ela, dizendo o que
 * foi encontrado. O `codigo` ao lado é o nome interno do teste, e mostrá-lo
 * na tela seria mostrar o diagnóstico em vez do problema.
 */
function motivoDaRevisao(linha: LinhaConferida): string {
  const grave = linha.avisos.find((a) => a.nivel === "REVISAR") ?? linha.avisos[0];
  return grave?.mensagem ?? "A linha precisa de uma conferida antes de entrar.";
}

/** Quantas linhas viraram insumo, e quantas ficaram de fora. */
export function contarInsumos(itens: readonly InsumoDaImportacao[]): {
  total: number;
  aceitos: number;
  recusados: number;
} {
  const aceitos = itens.filter((i) => i.ingrediente !== null).length;
  return { total: itens.length, aceitos, recusados: itens.length - aceitos };
}

/* ─────────────────────────────────────────────────────────────────────── *
 * O DESTINO "FICHA"
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * AS LINHAS VIRAM ITENS DE FICHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE RECEBE OS INSUMOS, E NÃO MONTA OS SEUS                   │
 * │                                                                      │
 * │ `ItemFicha` aponta para um `ingredienteId` — e a única forma de ter   │
 * │ esse id é ter passado por `ingredienteDaLinha`. Montar os insumos de  │
 * │ novo aqui daria a cada linha DOIS ids, tirados da mesma função em     │
 * │ duas chamadas; no dia em que a função passasse a numerar por         │
 * │ sequência em vez de por texto, os dois discordariam e a ficha          │
 * │ apontaria para insumo que não existe.                                 │
 * │                                                                      │
 * │ Receber a lista pronta torna o acoplamento visível na assinatura: o   │
 * │ que virou insumo é o que pode virar item.                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A FICHA SÓ RECEBE O QUE PASSOU PELA CONFERÊNCIA                      │
 * │                                                                      │
 * │ A linha ambígua ou sem nome não vira item — e por isso ela não é      │
 * │ "esquecida": `contarItens` conta as duas coisas, e a tela mostra o    │
 * │ que ficou de fora com o motivo, do mesmo jeito que faz em             │
 * │ ingredientes.                                                         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function itensDaImportacao(
  insumos: readonly InsumoDaImportacao[]
): readonly { item: ItemFicha; linha: LinhaConferida }[] {
  return insumos.flatMap((entrada) => {
    if (entrada.ingrediente === null) return [];
    return [{ item: itemDaLinha(entrada.linha, entrada.ingrediente), linha: entrada.linha }];
  });
}

/**
 * O NOME DO PRATO E A CATEGORIA — do cabeçalho, com o ajuste dela por cima.
 *
 * A mesma precedência de `calcularImportacao`: o que ela corrigiu vence o que
 * o documento dizia. Aqui não há valor de partida inventado — sem título no
 * documento e sem correção, o nome fica vazio, e a tela pede o nome antes de
 * criar a ficha. "Ficha importada" é o rótulo do ARQUIVO de planilha, e
 * usá-lo como nome de um prato que vai para a biblioteca do cliente seria
 * gravar um nome que ninguém escolheu.
 */
/**
 * O RENDIMENTO E A PORÇÃO JÁ VÊM LIDOS — e é por isso que não há conta aqui.
 *
 * `CabecalhoConferido.rendimento` e `.porcaoGramas` são `Leitura<number>`, e
 * não texto: a normalização já rodou na etapa 3, com as regras dos números
 * brasileiros e com a recusa da ambiguidade. Reler um número a partir do texto
 * cru aqui seria uma SEGUNDA conversão do mesmo dado, e a segunda pode
 * discordar da primeira — exatamente o defeito que a esteira existe para não
 * ter.
 *
 * O ajuste dela (`ajustesDoCabecalho`) vence a leitura, porque foi digitado
 * depois e à vista do resultado.
 */
function numeroLido(leitura: Leitura<number>, ajustado: number | null | undefined): number | null {
  /*
    A PRECEDÊNCIA É A MESMA DE `calcularImportacao` — `ajuste ?? leitura` —, e
    é de propósito que ela seja escrita igual: o nome e a categoria do destino
    FICHA e os do destino PLANILHA não podem discordar sobre o que vence.

    `??` cobre `undefined` E `null`, o que importa porque `AjustesDoCabecalho`
    declara os dois: a tela limpa um campo APAGANDO a chave (`delete copia[...]`
    em `ajustarCabecalho`), e o resultado disso é voltar a valer o que o
    documento dizia. Não é um esquecimento — é a mesma regra do motor.
  */
  return ajustado ?? (leitura.estado === "OK" ? leitura.valor : null);
}

export function cabecalhoDaFicha(
  conferencia: { cabecalho: CabecalhoConferido },
  ajustes?: AjustesDoCabecalho
): { nome: string; categoria: string; rendimentoPorcoes: number | null; porcaoGramas: number | null } {
  const cab = conferencia.cabecalho;

  return {
    nome: (ajustes?.titulo ?? cab.titulo ?? "").trim(),
    categoria: (ajustes?.categoria ?? cab.categoria ?? "").trim(),
    rendimentoPorcoes: numeroLido(cab.rendimento, ajustes?.rendimentoPorcoes),
    porcaoGramas: numeroLido(cab.porcaoGramas, ajustes?.porcaoGramas),
  };
}

/* ─────────────────────────────────────────────────────────────────────── *
 * O VEREDITO
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * O QUE A TELA PRECISA SABER ANTES DE DEIXAR ELA CLICAR.
 *
 * Os três destinos têm pré-requisitos diferentes, e nenhum deles é "a lista
 * não está vazia":
 *
 *   INGREDIENTES — pelo menos UMA linha recusável-resolvível, isto é, com
 *                  nome e sem ambiguidade. Sem isso não há insumo a criar.
 *
 *   FICHA        — o mesmo, MAIS o nome do prato. Uma ficha sem nome não é
 *                  ficha: ela apareceria na lista como "—" e não haveria
 *                  como distingui-la de outra igual.
 *
 *   PLANILHA     — nada novo. É o que já funcionava, e continua valendo a
 *                  regra de antes: basta alguma linha.
 *
 * Devolver o motivo junto — e não só o booleano — é o que permite a tela
 * escrever por que o botão está apagado. Um botão apagado sem explicação é a
 * mesma experiência de um botão quebrado.
 */
export type Veredito = {
  pode: boolean;
  /** Por que não pode, escrito para ela. `null` quando pode. */
  motivo: string | null;
};

export function vereditoDoDestino(
  destino: IdDoDestino,
  entrada: {
    conferencia: { cabecalho: CabecalhoConferido; linhas: readonly LinhaConferida[] };
    insumos: readonly InsumoDaImportacao[];
    nomeDaFicha: string;
  }
): Veredito {
  const { aceitos, total } = contarInsumos(entrada.insumos);

  if (total === 0) {
    return { pode: false, motivo: "Acrescente ou digite pelo menos uma linha na tabela acima." };
  }

  if (destino === "planilha") {
    /*
      A PLANILHA CONTINUA ACEITANDO O QUE A FICHA RECUSA.

      É deliberado, e é o que a Central já faz hoje: uma grade com uma linha
      ambígua é justamente onde a Érika quer olhar o número ao lado das
      outras. Exigir aqui o que a conferência ainda está discutindo fecharia
      a única saída de quem quer ver o conjunto antes de decidir.
    */
    return { pode: true, motivo: null };
  }

  if (aceitos === 0) {
    return {
      pode: false,
      motivo:
        "Nenhuma linha está pronta: falta o nome do insumo, ou a quantidade ou o valor precisa de uma conferida.",
    };
  }

  if (destino === "ficha" && entrada.nomeDaFicha.trim() === "") {
    return {
      pode: false,
      motivo: "Dê um nome ao prato — é por ele que a ficha vai aparecer na lista.",
    };
  }

  return { pode: true, motivo: null };
}
