/**
 * A SEGURANÇA DO UPLOAD.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS QUATRO REGRAS DO BRIEFING, E O QUE CADA UMA IMPEDE                │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Não executar conteúdo do documento."                             │ │
 * │ │ "Não confiar no nome do arquivo."                                 │ │
 * │ │ "Não usar HTML vindo do PDF diretamente na interface."            │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Este arquivo implementa as duas primeiras. A terceira mora onde o      │
 * │ texto é DESENHADO, e a regra lá é simples: texto de documento vai para  │
 * │ o JSX como STRING, e nunca com `dangerouslySetInnerHTML` nem           │
 * │ interpretado como markup. O React escapa string por padrão — o defeito  │
 * │ só nasce de quem pede para ele não escapar.                           │
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
 * │ de ser um PDF.                                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A ASSINATURA, E NÃO SÓ O `type`                              │
 * │                                                                      │
 * │ `File.type` vem do sistema operacional, via a extensão. É a mesma     │
 * │ informação com outro nome, e tem a mesma fraqueza.                    │
 * │                                                                      │
 * │ A assinatura é diferente: são os bytes. Todo PDF começa com `%PDF-`.   │
 * │ Um arquivo que declara ser PDF e não começa com esses cinco bytes não  │
 * │ é um PDF — e é a única checagem desta lista que não pode ser          │
 * │ satisfeita apenas escrevendo a palavra certa num campo.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** O tipo MIME oficial de PDF. Não existe um segundo. */
export const TIPO_PDF = "application/pdf";

/**
 * O TAMANHO MÁXIMO, EM BYTES.
 *
 * Vinte megabytes é folgado para o que esta tela recebe — uma ficha técnica
 * digitalizada, um orçamento exportado, uma tabela de fornecedor — e pequeno
 * o bastante para o arquivo caber na memória de um celular modesto quando a
 * leitura o carregar inteiro.
 *
 * O limite não é sobre segurança de execução (um PDF não executa aqui): é
 * sobre a tela não travar sem explicação. Um arquivo de duzentos megabytes
 * não falha — ele congela, e "congelou" não é uma mensagem que se possa ler.
 */
export const TAMANHO_MAXIMO = 20 * 1024 * 1024;

/** Os cinco bytes que todo PDF traz no começo. */
const ASSINATURA = "%PDF-";

/** A recusa, quando há uma. O `null` é o caminho feliz. */
export type Recusa = { titulo: string; motivo: string; acao: string };

/**
 * AS EXTENSÕES ACEITAS.
 *
 * Só PDF, porque é o que o briefing define. A lista tem uma entrada e isso é
 * deliberado: uma lista que aceita `.pdf` e `.PDF` está dizendo duas vezes a
 * mesma coisa, e a comparação já é feita em minúscula.
 */
const EXTENSOES_ACEITAS = [".pdf"];

/** O tamanho escrito para ler, sem depender do histórico. */
export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} kB`;
  return `${(kb / 1024).toFixed(1)} MB`;
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
 */
export async function conferirArquivo(arquivo: File): Promise<Recusa | null> {
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
      acao: "Reduza o PDF — exporte só as páginas da ficha, ou diminua a qualidade da digitalização.",
    };
  }

  // ── 3. A extensão ─────────────────────────────────────────────────────
  /*
    A extensão vem do NOME, que é texto escolhido por quem enviou. Ela é
    conferida porque uma extensão errada é um engano comum e vale avisar — e
    ela nunca é a única checagem, pelos dois testes que vêm abaixo.
  */
  const nome = arquivo.name.toLowerCase();
  if (!EXTENSOES_ACEITAS.some((ext) => nome.endsWith(ext))) {
    const extensao = /\.[a-z0-9]+$/.exec(nome)?.[0] ?? "sem extensão";
    return {
      titulo: "Só arquivos PDF entram aqui",
      motivo: `O arquivo enviado é ${extensao}.`,
      acao: "Exporte a ficha em PDF e envie o PDF. Foto e planilha ainda não são lidas.",
    };
  }

  // ── 4. O tipo declarado pelo navegador ────────────────────────────────
  /*
    `type` vazio passa de propósito. Alguns sistemas operacionais não
    preenchem o campo, e recusar por causa disso barraria um PDF legítimo por
    uma falha do sistema de arquivos — que não é problema dela e não tem
    conserto do lado dela. A assinatura abaixo é que decide de verdade.
  */
  if (arquivo.type !== "" && arquivo.type !== TIPO_PDF) {
    return {
      titulo: "O arquivo não é um PDF",
      motivo: `O sistema identificou o tipo "${arquivo.type}".`,
      acao: "Confira o arquivo e envie a versão em PDF.",
    };
  }

  // ── 5. A assinatura dos bytes ─────────────────────────────────────────
  /*
    A ÚNICA CHECAGEM QUE NÃO SE FALSIFICA ESCREVENDO UMA PALAVRA.

    Lê os primeiros bytes e compara com `%PDF-`. Um arquivo que passou por
    todas as checagens acima e falha aqui está declarando ser PDF sem ser —
    que é exatamente o caso que as quatro anteriores não pegam.
  */
  try {
    const cabeca = await arquivo.slice(0, ASSINATURA.length).text();
    if (cabeca !== ASSINATURA) {
      return {
        titulo: "O arquivo não é um PDF de verdade",
        motivo:
          "O nome e o tipo dizem PDF, mas o conteúdo do arquivo não começa como um PDF começa.",
        acao: "O arquivo pode estar corrompido ou ter sido renomeado. Envie o original.",
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
