/**
 * O LEITOR DE HOJE — e a resposta honesta dele.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE ARQUIVO NÃO LÊ PDF. E ISSO É A IMPLEMENTAÇÃO CORRETA HOJE.      │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Não fingir que a leitura inteligente do PDF já existe se não     │ │
 * │ │  houver serviço/modelo configurado."                              │ │
 * │ │                                                                  │ │
 * │ │ "Nunca fingir análise de IA."                                     │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Não há serviço de leitura contratado nesta instalação. Não há modelo  │
 * │ configurado. Não há chave de API no ambiente. Quem implementa         │
 * │ `DocumentExtractor` sem nenhuma dessas três coisas tem duas saídas:   │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ 1. INVENTAR                                                        │ │
 * │ │                                                                    │ │
 * │ │    Escrever um punhado de expressões regulares que caçam "kg" e     │ │
 * │ │    "R$" no texto e montam uma tabela. Funciona. É rápido de fazer.  │ │
 * │ │    E acerta em três fichas de cada quatro.                          │ │
 * │ │                                                                    │ │
 * │ │    Na quarta, a linha "Farinha 1.500" entra como mil e quinhentos   │ │
 * │ │    gramas de farinha onde ela comprou um quilo e meio — e a tela    │ │
 * │ │    mostra o resultado com a mesma confiança das três fichas certas. │ │
 * │ │    Ninguém desconfia de um número que aparece sem aviso.            │ │
 * │ │                                                                    │ │
 * │ │ 2. DIZER QUE NÃO DÁ                                                 │ │
 * │ │                                                                    │ │
 * │ │    Devolver `INDISPONIVEL` com a razão escrita, e deixar o caminho  │ │
 * │ │    manual — que já funciona e é o que ela usa hoje — como o         │ │
 * │ │    caminho principal.                                              │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ A segunda é pior de demonstração e melhor de produto. Uma importação  │
 * │ que erra calada é pior que uma importação que não existe, porque a     │
 * │ que não existe ela sabe substituir e a que erra calada ela confia.    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO FAZ DE VERDADE                                    │
 * │                                                                      │
 * │ Ele implementa a interface COMPLETA, com os quatro membros, e é uma    │
 * │ implementação que funciona — funciona dizendo não.                    │
 * │                                                                      │
 * │ Isso não é um placeholder esperando ser trocado. É o formato que a     │
 * │ camada de cima precisa: a tela pergunta `disponivel()`, recebe `false`, │
 * │ lê `motivoDaIndisponibilidade()` e mostra a frase dela. Quando um      │
 * │ leitor real entrar, ele ocupa este arquivo e a tela não muda uma linha │
 * │ — nem quando um segundo leitor for plugado ao lado deste.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { DocumentExtractor, ResultadoDaExtracao } from "./tipos";

/**
 * O NOME ESTÁVEL DESTE LEITOR.
 *
 * Ele aparece na tela, e por isso é escrito para ser lido por ela, não por
 * programador. "Leitura automática de documento" descreve o que o leitor
 * FARIA; é o que ela precisa saber para entender por que o botão está
 * desligado.
 */
export const NOME_DO_LEITOR = "Leitura automática de documento";

/**
 * A RAZÃO, ESCRITA PARA ELA — não para o log.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A FRASE DIZ TRÊS COISAS                                      │
 * │                                                                      │
 * │ O que não está disponível (a leitura automática), por que não (não há │
 * │ serviço de leitura configurado nesta instalação), e o que fazer no     │
 * │ lugar (digitar ou colar, que já funciona).                            │
 * │                                                                      │
 * │ Uma frase que dissesse só "indisponível" faria ela procurar um        │
 * │ defeito onde não há, ou tentar de novo — e tentar de novo não muda     │
 * │ nada, porque o problema não é o arquivo.                             │
 * │                                                                      │
 * │ O texto NÃO menciona IA, modelo, API nem provedor: são palavras        │
 * │ nossas, e ela faz fichas técnicas. O que ela precisa entender é que    │
 * │ essa parte ainda não existe pronta.                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const MOTIVO =
  "Esta instalação ainda não tem um leitor de documentos configurado, então o sistema não consegue " +
  "extrair os dados de dentro do PDF sozinho. Nada foi lido do seu arquivo — o que aparece na tela é " +
  "só o nome e o tamanho dele. Por enquanto, digite ou cole os dados na planilha: é o caminho que já " +
  "funciona hoje, e o que você receber dela passa pelas mesmas contas.";

/**
 * O LEITOR LOCAL.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE RECEBE O ARQUIVO E NÃO O LÊ                               │
 * │                                                                      │
 * │ `extract` aceita o `File` e não toca nele. Isso é deliberado: quem    │
 * │ valida o arquivo é `./seguranca.ts`, e é lá que ele é lido — os cinco  │
 * │ primeiros bytes. Um leitor indisponível que abrisse o arquivo inteiro  │
 * │ para depois dizer "não consigo ler" gastaria memória de um celular     │
 * │ para não fazer nada.                                                  │
 * │                                                                      │
 * │ A assinatura fica igual à de um leitor real porque é ela que a tela    │
 * │ consome. Um leitor que existir amanhã vai precisar do arquivo, e o     │
 * │ contrato não deve mudar só porque hoje ninguém lê.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const leitorLocal: DocumentExtractor = {
  nome: NOME_DO_LEITOR,

  /**
   * `false`, sempre — e é a verdade, não uma configuração faltando.
   *
   * A tela usa isto para decidir o que oferecer. Enquanto for `false`, o
   * botão de importar continua existindo (o fluxo de arquivo, a conferência,
   * a arquitetura), mas ele diz na cara que a leitura automática não vem
   * junto. É melhor que esconder o botão: ela descobre que o recurso existe e
   * que ainda não chegou, em vez de concluir que o sistema não faz isso.
   */
  disponivel(): boolean {
    return false;
  },

  motivoDaIndisponibilidade(): string {
    return MOTIVO;
  },

  /**
   * A RESPOSTA É `INDISPONIVEL`, E ELA NUNCA CHEGA AQUI POR ACIDENTE.
   *
   * `INDISPONIVEL` e não `FALHOU`: não houve falha. Nada quebrou, nada deu
   * errado com o arquivo dela. O sistema simplesmente não tem a peça — e
   * essas duas palavras pedem coisas diferentes dela. "Falhou" convida a
   * tentar de novo; "indisponível" explica que tentar de novo não adianta.
   *
   * `VAZIO` também seria errado, e é o erro mais fácil de cometer: um PDF
   * digitalizado (só imagem, sem camada de texto) é um arquivo legítimo que
   * um leitor real leria e não acharia texto nenhum. Aqui não houve leitura —
   * dizer "o documento não tem texto" seria afirmar sobre um arquivo que
   * ninguém abriu.
   */
  async extract(_: File): Promise<ResultadoDaExtracao> {
    return { estado: "INDISPONIVEL", motivo: MOTIVO };
  },
};
