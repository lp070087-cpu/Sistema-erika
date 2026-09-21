/**
 * O LEITOR DE LISTA — o de TEXTO e o de arquivo `.txt`/`.csv`.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE É O ÚNICO DOS QUATRO QUE FUNCIONA INTEIRO HOJE                  │
 * │                                                                      │
 * │ E não é coincidência. PDF precisa de um serviço de leitura que ainda   │
 * │ não existe; foto precisa de reconhecimento de imagem, que é o mesmo    │
 * │ serviço com outra entrada; planilha precisa de uma biblioteca e de uma  │
 * │ ida ao servidor. Texto não precisa de nada disso: o dado já está       │
 * │ escrito, e escrever é exatamente o que não precisa ser reconhecido.     │
 * │                                                                      │
 * │ É a razão pela qual ele vem antes na prática, mesmo vindo depois na    │
 * │ lista: é o caminho que ela pode usar hoje, e é o que faz a esteira      │
 * │ inteira — conferência, normalização, destino — ser exercitada de       │
 * │ verdade em vez de só existir.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS DUAS ENTRADAS, E POR QUE SÃO O MESMO LEITOR                       │
 * │                                                                      │
 * │ Ela pode ARRASTAR um `.txt` salvo, ou COLAR a lista no campo. São dois │
 * │ gestos diferentes chegando com o mesmo dado — texto.                 │
 * │                                                                      │
 * │ Ter dois leitores para o mesmo dado seria ter duas interpretações: no  │
 * │ dia em que a regra de "onde está o preço" mudasse, uma das duas        │
 * │ ficaria para trás, e a mesma lista daria resultados diferentes         │
 * │ conforme o jeito de trazê-la.                                          │
 * │                                                                      │
 * │ Por isso `extract` e `extrairDeTexto` terminam na MESMA função: o      │
 * │ arquivo é só um jeito de chegar ao texto, e depois disso não há         │
 * │ diferença nenhuma entre o que foi colado e o que foi lido do disco.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { cabecalhoVazio, lerLista } from "./ler-lista";
import type { DocumentExtractor, ResultadoDaExtracao } from "./tipos";

/**
 * O NOME DESTE LEITOR, do jeito que ele aparece na tela.
 *
 * Ele é gravado no documento e mostrado na conferência, na linha "de onde
 * veio". Por isso ele responde à pergunta que ela faria — "quem leu isso?" —
 * e não à pergunta técnica sobre o formato.
 */
export const NOME_DO_LEITOR_DE_TEXTO = "Lista escrita à mão";

/* ─────────────────────────────────────────────────────────────────────── *
 * A codificação — o defeito que já apareceu neste projeto
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * O TEXTO DO ARQUIVO, SEM TRANSFORMAR ACENTO EM SÍMBOLO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO NÃO É UM `arquivo.text()` E PRONTO                      │
 * │                                                                      │
 * │ `arquivo.text()` decodifica como UTF-8, sempre. E um `.txt` salvo pelo │
 * │ Bloco de Notas do Windows — que é o caso mais comum de todos, porque   │
 * │ é o editor que já vem instalado — costuma estar em Windows-1252. Nessa │
 * │ codificação, "Açaí" é guardado com um byte 0xE7; lido como UTF-8, esse │
 * │ byte não forma caractere válido, e o resultado é "A��aí".              │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ O QUE ISSO CUSTA SE PASSAR DESPERCEBIDO                           │ │
 * │ │                                                                  │ │
 * │ │ Não é só feiúra na tela. O NOME DO INGREDIENTE chega corrompido   │ │
 * │ │ na conferência, e a ficha nasce com "A��aí" no lugar de "Açaí".    │ │
 * │ │ Pior: a busca por insumo semelhante compara texto, e um nome       │ │
 * │ │ corrompido não casa com nada — então ela cadastraria o mesmo       │ │
 * │ │ ingrediente duas vezes, com dois nomes que ninguém reconhece.      │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ A ORDEM DAS TENTATIVAS IMPORTA, E É DO MAIS ESTRITO PARA O MAIS   │ │
 * │ │ FROUXO                                                            │ │
 * │ │                                                                  │ │
 * │ │ UTF-8 vem primeiro com `fatal: true`, que faz a decodificação     │ │
 * │ │ FALHAR em vez de substituir o byte por "�". É isso que permite    │ │
 * │ │ usar o fracasso como resposta: se decodificou sem reclamar, era    │ │
 * │ │ UTF-8 de verdade.                                                  │ │
 * │ │                                                                  │ │
 * │ │ Só então o Windows-1252, que aceita QUALQUER byte — é por isso    │ │
 * │ │ que ele não pode vir primeiro: ele nunca falha, e um arquivo       │ │
 * │ │ UTF-8 lido como 1252 sairia com "Ã©" onde havia "é". Ele é a       │ │
 * │ │ última tentativa porque é a única que não sabe dizer não.          │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function textoDoArquivo(bytes: ArrayBuffer): string {
  // A marca de ordem de bytes, que alguns editores gravam no começo.
  const inicio = new Uint8Array(bytes, 0, Math.min(3, bytes.byteLength));
  const temBom = inicio[0] === 0xef && inicio[1] === 0xbb && inicio[2] === 0xbf;

  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes).replace(/^﻿/, "");
  } catch {
    void temBom;
    /*
      O Windows-1252 não é uma escolha: é a única alternativa que existe para
      texto sem marca nenhuma, e ele cobre o português inteiro. Se nem ele
      servir, o `TextDecoder` já teria devolvido o que deu — e o pior caso é
      uma letra estranha no meio de uma lista que ela vai conferir de qualquer
      forma.
    */
    return new TextDecoder("windows-1252").decode(bytes);
  }
}

/* ─────────────────────────────────────────────────────────────────────── *
 * A leitura — uma só, para as duas entradas
 * ─────────────────────────────────────────────────────────────────────── */

/**
 * TEXTO VIRA `ResultadoDaExtracao`, e é aqui que este arquivo encosta na
 * esteira.
 *
 * O `leitor` no documento é o que a tela mostra e o que fica registrado. Ele
 * é passado de fora porque as duas entradas têm nomes diferentes — arquivo e
 * texto colado — e ela merece saber qual dos dois foi.
 */
export function extrairDeTexto(texto: string, leitor: string): ResultadoDaExtracao {
  /*
    ARQUIVO SEM NENHUM CARACTERE VISÍVEL NÃO É DOCUMENTO VAZIO: é arquivo
    vazio, e as duas coisas pedem coisas diferentes dela.

    A distinção é a mesma que `leitor-local.ts` faz entre `INDISPONIVEL` e
    `VAZIO`, e pelo mesmo motivo: aqui, "o arquivo não tem nada escrito" é
    uma afirmação sobre o arquivo — e ela pode conferir isso abrindo ele. Não
    é uma falha do sistema, e tentar de novo com o mesmo arquivo daria o
    mesmo resultado.
  */
  if (texto.trim() === "") {
    return {
      estado: "VAZIO",
      motivo:
        "O texto chegou vazio — não há nenhuma linha escrita nele. Se você colou, confira se a cópia pegou o conteúdo; se escolheu um arquivo, abra ele e veja se está em branco.",
    };
  }

  const linhas = lerLista(texto);

  /*
    NENHUMA LINHA APROVEITÁVEL.

    Isso acontece quando o conteúdo tem texto (então não é `VAZIO`), mas nenhuma
    linha produziu descrição nem número — um arquivo com um único parágrafo de
    cabeçalho, por exemplo. É `VAZIO` e não `FALHOU` porque nada quebrou: o
    texto foi lido, e ele simplesmente não tem uma lista dentro.
  */
  if (linhas.length === 0) {
    return {
      estado: "VAZIO",
      motivo:
        "O sistema leu o texto, mas não encontrou nenhuma linha que parecesse um ingrediente. Cada linha da lista deve ter pelo menos o nome do item — e, se tiver, a quantidade e o valor.",
    };
  }

  return {
    estado: "OK",
    documento: {
      /*
        A LISTA COLADA NÃO TRAZ CABEÇALHO DE PRATO, e `cabecalhoVazio()` diz
        isso com campos ausentes em vez de strings vazias. É a diferença entre
        "a lista não disse o nome do prato" e "o nome do prato é vazio" — e a
        conferência trata as duas de forma diferente: a primeira ela
        preenche, a segunda ela teria de descobrir que era a mesma coisa.
      */
      cabecalho: cabecalhoVazio(),
      linhas,
      textoBruto: texto,
      /** Texto não tem página. Ver a mesma nota em `mapear-planilha.ts`. */
      paginas: null,
      leitor,
    },
  };
}

/* ─────────────────────────────────────────────────────────────────────── *
 * As duas entradas
 * ─────────────────────────────────────────────────────────────────────── */

/** O nome estável do leitor, do arquivo de texto. */
export const NOME_DO_LEITOR_DE_ARQUIVO = "Arquivo de texto";

/**
 * A ENTRADA POR ARQUIVO — o `.txt`, `.csv` ou `.tsv` que ela arrasta.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE LÊ O ARQUIVO INTEIRO AQUI, E O DE PDF NÃO LÊ NADA        │
 * │                                                                      │
 * │ `leitor-local.ts` recebe o arquivo e não o abre, porque abrir um PDF   │
 * │ de vinte megabytes para responder "não consigo ler" seria gastar a     │
 * │ memória de um celular para nada. Está certo lá.                        │
 * │                                                                      │
 * │ Aqui é o inverso: a leitura VAI dar resultado, e o resultado depende   │
 * │ do conteúdo inteiro. Ler só o começo devolveria uma lista pela metade  │
 * │ — e uma lista pela metade, numa tela que só mostra o que leu, é pior   │
 * │ que nenhuma: ela conferiria e confirmaria setenta ingredientes sem      │
 * │ saber que havia oitenta.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const leitorTexto: DocumentExtractor = {
  nome: NOME_DO_LEITOR_DE_ARQUIVO,

  disponivel(): boolean {
    return true;
  },

  motivoDaIndisponibilidade(): string {
    return "";
  },

  async extract(arquivo: File): Promise<ResultadoDaExtracao> {
    try {
      const texto = textoDoArquivo(await arquivo.arrayBuffer());
      return extrairDeTexto(texto, NOME_DO_LEITOR_DE_ARQUIVO);
    } catch {
      /*
        A ÚNICA FALHA POSSÍVEL AQUI É O ARQUIVO NÃO SER LEGÍVEL.

        Não é o formato nem o conteúdo — esses já foram lidos, e leitura de
        bytes não erra por causa do que o texto diz. O que pode falhar é o
        arquivo não abrir: ele estar num pen drive que foi removido no meio,
        ou o navegador perder o acesso a ele. "Tente escolher de novo" é
        conselho que funciona, e é por isso que é `FALHOU` e não `VAZIO`.
      */
      return {
        estado: "FALHOU",
        motivo:
          "Não foi possível ler o arquivo escolhido. Ele pode ter sido movido ou removido. Escolha de novo.",
      };
    }
  },
};
