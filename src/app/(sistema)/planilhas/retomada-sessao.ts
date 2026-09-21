/**
 * ONDE O ESTADO DA SESSÃO MORA ENQUANTO A ABA VIVE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `sessionStorage`, E NÃO `localStorage`                        │
 * │                                                                      │
 * │ O projeto PROÍBE `localStorage` como substituto improvisado de banco,  │
 * │ e a proibição está escrita em três telas (acompanhamentos, clientes/   │
 * │ novo, consultorias/plano-de-acao) com a mesma justificativa: ele faz   │
 * │ a Érika sair da apresentação com a impressão de que o sistema guarda.  │
 * │                                                                      │
 * │ `sessionStorage` é uma coisa diferente, e a diferença é o que torna   │
 * │ ele o instrumento certo aqui:                                          │
 * │                                                                      │
 * │   · `localStorage` sobrevive a fechar o navegador — é um armazém      │
 * │     permanente, e por isso parece banco.                              │
 * │                                                                      │
 * │   · `sessionStorage` morre com a ABA. É memória da sessão de trabalho, │
 * │     exatamente como o estado do React — só que ele sobrevive a um F5,  │
 * │     que é o que a decisão 4 pede.                                     │
 * │                                                                      │
 * │ A decisão 4 pede "retomar planilha não finalizada", e "não finalizada" │
 * │ quer dizer "a aba ainda está aberta". Recarregar a página no meio do   │
 * │ trabalho é o caso real — fechar o navegador e voltar amanhã é outra    │
 * │ coisa, e essa outra coisa é a que precisa de banco, não de atalho.     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ELE NÃO É — E A TELA REPETE ISTO                                │
 * │                                                                      │
 * │ Ele NÃO é persistência. Ele não é banco. Ele não é backup. Fechar a    │
 * │ aba apaga tudo, e a nota que a tela mostra diz isso com estas palavras. │
 * │                                                                      │
 * │ É a mesma honestidade de `clientes/novo.tsx`: "o estado é local e      │
 * │ morre com a página". A diferença é que aqui ele sobrevive ao F5 — e    │
 * │ isso é uma promessa MENOR, não maior: cabe numa frase e não depende de │
 * │ nada que ainda não exista.                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO É TÃO DEFENSIVO                                  │
 * │                                                                      │
 * │ Ele fala com uma API do navegador que FALHA de três jeitos diferentes, │
 * │ e todos os três são comuns:                                           │
 * │                                                                      │
 * │   1. NÃO EXISTE. No servidor não há `window` — e este componente      │
 * │      também é renderizado lá, na primeira pintura.                    │
 * │                                                                      │
 * │   2. EXISTE E RECUSA A ESCRITA. É o caso clássico de aba anônima em    │
 * │      navegador com armazenamento bloqueado: o objeto está lá, e o      │
 * │      `setItem` levanta exceção. Sem a SONDA abaixo, isso apareceria    │
 * │      como um erro a cada tecla digitada.                              │
 * │                                                                      │
 * │   3. EXISTE, ACEITA, E ESTOURA A COTA. A planilha do cliente grande é  │
 * │      maior que o teto por origem, e o `setItem` levanta.              │
 * │                                                                      │
 * │ Nos três, a resposta é a mesma: seguir sem guardar. Perder a retomada  │
 * │ é um aborrecimento; quebrar a planilha por causa dela é um defeito.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { deTexto, paraTexto, type EstadoDaSessao, type Retomada } from "@/lib/planilhas/retomada";

/**
 * A CHAVE.
 *
 * Com prefixo de aplicação porque `sessionStorage` é compartilhado por ORIGEM
 * — no dia em que houver outro sistema no mesmo domínio, "planilha" sozinho
 * seria uma chave que os dois disputariam.
 */
const CHAVE = "erika:planilha:rascunho";

/**
 * O ACESSO, COM A SONDA.
 *
 * A sonda escreve e apaga uma chave minúscula para descobrir se a escrita
 * funciona ANTES de tentar guardar uma planilha inteira. É o que separa "não
 * tem onde guardar" de "não consegui guardar agora" — e as duas merecem
 * silêncio, mas só a primeira é permanente.
 *
 * Devolver `null` em vez de levantar mantém quem chama sem um `try/catch` em
 * volta de cada leitura e de cada escrita.
 */
function caixa(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    const armazem = window.sessionStorage;
    const sonda = "__erika_sonda__";
    armazem.setItem(sonda, "1");
    armazem.removeItem(sonda);
    return armazem;
  } catch {
    return null;
  }
}

/**
 * GUARDA O ESTADO. Falhar aqui não é erro da planilha — é o navegador dizendo
 * que não dá, e a planilha segue funcionando na memória.
 */
export function guardar(estado: EstadoDaSessao): void {
  const armazem = caixa();
  if (armazem === null) return;
  try {
    armazem.setItem(CHAVE, paraTexto(estado, new Date()));
  } catch {
    /* cota estourada — a sessão continua, sem retomada */
  }
}

/** LÊ O ESTADO. Texto corrompido, de outra versão ou ausente devolve `null`. */
export function ler(): Retomada | null {
  const armazem = caixa();
  if (armazem === null) return null;
  try {
    return deTexto(armazem.getItem(CHAVE));
  } catch {
    return null;
  }
}

/** APAGA. É a saída de quem não quer a retomada — e é chamado quando não há nada a guardar. */
export function limpar(): void {
  const armazem = caixa();
  if (armazem === null) return;
  try {
    armazem.removeItem(CHAVE);
  } catch {
    /* nada a fazer — a chave continua lá e será recusada na próxima leitura */
  }
}
