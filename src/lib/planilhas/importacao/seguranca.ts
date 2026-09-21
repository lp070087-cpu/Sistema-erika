/**
 * A SEGURANÇA DA ENTRADA — a mesma para as quatro portas.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS REGRAS DO BRIEFING, E O QUE CADA UMA IMPEDE                       │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Não executar conteúdo do documento."                             │ │
 * │ │ "Não confiar no nome do arquivo."                                 │ │
 * │ │ "Não usar conteúdo vindo do arquivo diretamente na interface."     │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Este arquivo implementa as duas primeiras. A terceira mora onde o      │
 * │ texto é DESENHADO, e a regra lá é simples: conteúdo de documento vai    │
 * │ para o JSX como STRING, e nunca com `dangerouslySetInnerHTML` nem       │
 * │ interpretado como markup. O React escapa string por padrão — o defeito  │
 * │ só nasce de quem pede para ele não escapar.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO PASSOU A RECEBER A ORIGEM                       │
 * │                                                                      │
 * │ Ele era o `conferirArquivo` do PDF: listas fixas de extensão e de      │
 * │ tipo, e a assinatura `%PDF-` escrita dentro do corpo. Funcionava        │
 * │ porque havia uma porta só.                                             │
 * │                                                                      │
 * │ Com quatro portas, o jeito óbvio de crescer seria um `switch` por       │
 * │ formato aqui dentro — e aí a lista de extensões do Excel existiria em   │
 * │ dois lugares: na tabela de `origens.ts`, que a tela usa para montar o   │
 * │ `accept` do campo, e neste arquivo, que confere se o que chegou é       │
 * │ aceitável. Duas listas da mesma verdade divergem, e a divergência       │
 * │ apareceria como um arquivo que o seletor deixa escolher e a conferência │
 * │ recusa — o tipo de "às vezes não funciona" que ninguém reproduz.        │
 * │                                                                      │
 * │ Então a origem ENTRA por parâmetro, e este arquivo não tem nenhuma      │
 * │ lista própria. Ele não sabe o que é PDF, Excel, texto ou foto: ele      │
 * │ conhece o contrato `Origem` e pergunta a ela. Acrescentar um formato    │
 * │ amanhã não muda uma linha aqui.                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO CONFIAR NO NOME DO ARQUIVO                               │
 * │                                                                      │
 * │ A extensão é texto que quem enviou escolheu. Renomear `script.exe`    │
 * │ para `ficha.pdf` leva um segundo, e um sistema que decide o que fazer  │
 * │ pelo nome decide com base na palavra de quem enviou.                   │
 * │                                                                      │
 * │ Então a extensão é CONFERIDA — porque uma extensão errada é um erro    │
 * │ dela que vale a pena avisar — e nunca é a ÚNICA checagem. O que decide │
 * │ são o TIPO declarado pelo navegador e a ASSINATURA dos primeiros bytes  │
 * │ do arquivo, que é o único dado que não dá para falsificar sem deixar   │
 * │ de ser um arquivo daquele tipo.                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { extensaoDe } from "./origens";
import type { Origem } from "./origens";

/**
 * O TAMANHO MÁXIMO, EM BYTES — o mesmo para as quatro portas.
 *
 * Vinte megabytes é folgado para o que esta tela recebe: uma ficha técnica
 * digitalizada, um orçamento exportado, uma planilha de fornecedor, a foto de
 * uma página de caderno. E é pequeno o bastante para o arquivo caber na
 * memória de um celular modesto quando a leitura o carregar inteiro.
 *
 * O limite não é sobre segurança de execução — nenhum destes quatro formatos
 * executa aqui. É sobre a tela não travar sem explicação: um arquivo de
 * duzentos megabytes não falha, ele congela, e "congelou" não é uma mensagem
 * que se possa ler.
 *
 * Ele não muda por origem de propósito. O que a foto permite a mais que o PDF
 * é ruído, não ordem de grandeza, e um limite diferente por porta faria a
 * mesma pasta de arquivos passar num lugar e não no outro sem motivo visível.
 */
export const TAMANHO_MAXIMO = 20 * 1024 * 1024;

/** A recusa, quando há uma. O `null` é o caminho feliz. */
export type Recusa = { titulo: string; motivo: string; acao: string };

/** O tamanho escrito para ler, sem depender do histórico. */
export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} kB`;

  return `${(kb / 1024).toFixed(1)} MB`;
}

/** A lista de extensões escrita para uma frase: ".xlsx" ou ".jpg, .png ou .webp". */
function extensoesEscritas(extensoes: readonly string[]): string {
  if (extensoes.length === 0) return "";
  if (extensoes.length === 1) return extensoes[0] ?? "";
  return `${extensoes.slice(0, -1).join(", ")} ou ${extensoes[extensoes.length - 1] ?? ""}`;
}

/**
 * A CONFERÊNCIA COMPLETA, NA ORDEM EM QUE ELA DEVE ACONTECER.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A ORDEM DAS CHECAGENS É A ORDEM DAS MENSAGENS                │
 * │                                                                      │
 * │ Cada recusa abaixo é a que ela vai ler se aquele teste falhar — e a   │
 * │ ordem decide QUAL das várias falhas possíveis ela vê primeiro.        │
 * │                                                                      │
 * │ Da mais barata e mais óbvia para a mais cara: arquivo vazio, tamanho, │
 * │ extensão, tipo declarado, e só então a assinatura — que exige LER o    │
 * │ arquivo. Fazer a assinatura primeiro obrigaria a carregar vinte        │
 * │ megabytes na memória para depois descobrir que era um `.docx`.        │
 * │                                                                      │
 * │ E o texto de cada uma diz o que aconteceu E o que fazer. "Arquivo     │
 * │ inválido" é a mensagem que faz ela tentar de novo com o mesmo arquivo. │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A RECUSA ESPECÍFICA VEM ANTES DA GENÉRICA                            │
 * │                                                                      │
 * │ O `.xls` é o caso que criou o campo. Ele cai na recusa de extensão, e  │
 * │ a frase genérica — "só arquivos .xlsx entram aqui" — seria uma          │
 * │ resposta errada para um arquivo que É Excel: ele está na versão antiga, │
 * │ e o caminho dela é abrir no Excel e salvar como `.xlsx`.               │
 * │                                                                      │
 * │ Por isso a checagem específica vem PRIMEIRO: se a extensão é a que a   │
 * │ origem marcou, a resposta é a que a origem escreveu, e não a genérica.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export async function conferirArquivo(arquivo: File, origem: Origem): Promise<Recusa | null> {
  // ── 1. O arquivo existe e tem conteúdo ────────────────────────────────
  if (arquivo.size === 0) {
    return {
      titulo: "O arquivo está vazio",
      motivo: "Ele tem zero bytes, então não há nada para ler dentro dele.",
      acao: "Confira se o arquivo terminou de ser salvo ou exportado e envie de novo.",
    };
  }

  // ── 2. O tamanho ──────────────────────────────────────────────────────
  if (arquivo.size > TAMANHO_MAXIMO) {
    return {
      titulo: "O arquivo é grande demais",
      motivo: `Ele tem ${tamanhoLegivel(arquivo.size)} e o limite é ${tamanhoLegivel(TAMANHO_MAXIMO)}.`,
      acao:
        origem.id === "foto"
          ? "Tire a foto com menos resolução, ou recorte só a parte do caderno onde está a lista."
          : "Reduza o arquivo — exporte só as páginas que interessam, ou salve uma versão mais leve.",
    };
  }

  /*
    A extensão vem do NOME, que é texto escolhido por quem enviou. Ela é
    conferida porque uma extensão errada é um engano comum e vale avisar — e
    ela nunca é a única checagem, pelos dois testes que vêm abaixo.
  */
  const extensao = extensaoDe(arquivo.name);

  // ── 3. A extensão parecida que merece resposta própria ────────────────
  const especifica = origem.recusaEspecifica;
  if (especifica && extensao === especifica.extensao) {
    return { titulo: especifica.titulo, motivo: especifica.motivo, acao: especifica.acao };
  }

  // ── 4. A extensão ─────────────────────────────────────────────────────
  if (!origem.extensoes.some((ext) => arquivo.name.toLowerCase().endsWith(ext))) {
    return {
      titulo: `Só ${origem.rotulo} entra por esta porta`,
      motivo: `O arquivo enviado é ${extensao}.`,
      acao: `Use um arquivo ${extensoesEscritas(origem.extensoes)} — ou volte e escolha a porta certa para este arquivo.`,
    };
  }

  // ── 5. O tipo declarado pelo navegador ────────────────────────────────
  /*
    `type` vazio passa de propósito. Alguns sistemas operacionais não
    preenchem o campo, e recusar por causa disso barraria um arquivo legítimo
    por uma falha do sistema de arquivos — que não é problema dela e não tem
    conserto do lado dela. A assinatura abaixo é que decide de verdade.

    Quando o arquivo declara um tipo E ele não está na lista da origem, é
    recusa: um `type` preenchido dizendo `application/pdf` numa porta de
    planilha é um sinal forte de que a porta está errada.
  */
  if (arquivo.type !== "" && !origem.tipos.includes(arquivo.type)) {
    return {
      titulo: `O arquivo não é ${origem.rotulo}`,
      motivo: `O sistema identificou o tipo "${arquivo.type}".`,
      acao: `Confira o arquivo, ou volte e escolha a porta correspondente a esse tipo.`,
    };
  }

  // ── 6. A assinatura dos bytes ─────────────────────────────────────────
  /*
    A ÚNICA CHECAGEM QUE NÃO SE FALSIFICA ESCREVENDO UMA PALAVRA.

    ┌────────────────────────────────────────────────────────────────────┐
    │ POR QUE A PORTA DE TEXTO NÃO TEM ESTA CHECAGEM                     │
    │                                                                    │
    │ Porque não existe assinatura de texto — ver `ASSINATURA_TEXTO` em   │
    │ `origens.ts`, onde isso é um caso do tipo e não um campo vazio.     │
    │                                                                    │
    │ Um `tipo: "ausente"` aqui não é uma checagem pulada por descuido:   │
    │ é a resposta certa para um formato que não tem como ser             │
    │ identificado pelos bytes. Inventar uma assinatura recusaria         │
    │ arquivos legítimos e, pior, daria a impressão de que o conteúdo foi  │
    │ verificado — quando a única coisa que existe para verificar é o      │
    │ nome.                                                              │
    └────────────────────────────────────────────────────────────────────┘
  */
  if (origem.assinatura.tipo === "ausente") return null;

  const { amostra, reconhece } = origem.assinatura;

  try {
    const bytes = new Uint8Array(await arquivo.slice(0, amostra).arrayBuffer());

    if (!reconhece(bytes)) {
      return {
        titulo: `O arquivo não é ${origem.rotulo} de verdade`,
        motivo:
          "O nome e o tipo dizem uma coisa, mas o conteúdo do arquivo não começa como esse tipo de arquivo começa.",
        acao: "O arquivo pode estar corrompido, protegido por senha ou ter sido renomeado. Envie o original.",
      };
    }
  } catch {
    /*
      A LEITURA FALHOU, E ISSO NÃO É "ARQUIVO INVÁLIDO".

      Chegar aqui significa que o navegador não conseguiu abrir o arquivo —
      permissão, arquivo removido do disco entre a escolha e a leitura, ou
      memória. É um problema de acesso, e dizer "arquivo inválido" mandaria
      ela procurar defeito no documento errado.
    */
    return {
      titulo: "Não foi possível ler o arquivo",
      motivo: "O navegador não conseguiu abrir o arquivo para conferir o conteúdo.",
      acao: "Verifique se o arquivo ainda está na pasta de onde foi escolhido e envie de novo.",
    };
  }

  return null;
}

/**
 * A RECUSA PARA QUEM ENVIOU ARQUIVO SEM NENHUM, mas escolheu colar.
 *
 * Existe porque `conferirArquivo` é sobre um arquivo, e a porta de texto aceita
 * texto colado — que não tem nome, tipo nem bytes. Sem esta função, a tela
 * teria de saber que a origem de texto é especial, e a exceção viveria no
 * componente em vez de viver aqui, onde estão as outras.
 */
export function textoVazio(origem: Origem): Recusa {
  return {
    titulo: "Nada foi colado",
    motivo: `A porta de ${origem.rotulo} aceita uma lista escrita, e o campo está em branco.`,
    acao: "Cole a lista de ingredientes, uma linha para cada item, ou escolha um arquivo .txt.",
  };
}
