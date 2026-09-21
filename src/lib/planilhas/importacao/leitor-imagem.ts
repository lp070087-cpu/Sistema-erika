/**
 * O LEITOR DE FOTO — e a resposta honesta dele.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE ARQUIVO NÃO LÊ FOTO. E ISSO É A IMPLEMENTAÇÃO CORRETA HOJE.     │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Não fingir que a leitura inteligente já existe se não houver     │ │
 * │ │  serviço/modelo configurado."                                     │ │
 * │ │                                                                  │ │
 * │ │ "Nunca fingir análise de IA."                                     │ │
 * │ │                                                                  │ │
 * │ │ "NÃO conectar serviço pago sem necessidade."                      │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Ler uma foto de caderno é reconhecimento de imagem: alguém precisa    │
 * │ olhar a mancha de pixels e dizer que ali está escrito "Farinha 5 kg". │
 * │ Não há serviço de reconhecimento contratado nesta instalação, e não há │
 * │ biblioteca no projeto que faça isso — nem uma que faça isso BEM, que é  │
 * │ a parte que importa.                                                   │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ A TENTAÇÃO, E POR QUE ELA É PIOR AQUI DO QUE EM QUALQUER OUTRO     │ │
 * │ │ LUGAR                                                            │ │
 * │ │                                                                  │ │
 * │ │ Existe uma saída que parece razoável: rodar um OCR simples, ou     │ │
 * │ │ chamar um serviço de tradução de imagem que já tem por aí. Não     │ │
 * │ │ foi feito, e o motivo é específico desta porta.                    │ │
 * │ │                                                                  │ │
 * │ │ Um caderno de cozinha é manuscrito. Letra de mão, caneta, foto de  │ │
 * │ │ celular torta, página com dobra, luz de cozinha. Um OCR de        │ │
 * │ │ documento digitalizado acerta formulário impresso e erra isso de   │ │
 * │ │ forma CRIATIVA: "1,5 kg" vira "1,5 lcg", "R$ 30" vira "RS 3O".     │ │
 * │ │                                                                  │ │
 * │ │ E o erro não chega sozinho. Ele chega como uma linha na           │ │
 * │ │ conferência com a mesma aparência das linhas certas — e a          │ │
 * │ │ conferência existe justamente para ela CONFIAR no que está ali.    │ │
 * │ │ Uma linha inventada com cara de lida é pior que trinta linhas      │ │
 * │ │ faltando: as faltando ela percebe, a inventada ela confirma.       │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ Então a foto entra pela porta e recebe a mesma resposta de hoje: "esta │
 * │ parte ainda não existe — digite ou cole". É pior de demonstração e     │
 * │ muito melhor de produto, pelo mesmo motivo que o leitor de PDF: uma     │
 * │ importação que erra calada é pior que uma importação que não existe,    │
 * │ porque a que não existe ela sabe substituir.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO FAZ DE VERDADE                                    │
 * │                                                                      │
 * │ Ele implementa a interface COMPLETA, com os quatro membros. É uma      │
 * │ implementação que funciona — funciona dizendo não.                    │
 * │                                                                      │
 * │ Isso não é um placeholder esperando ser trocado por outra coisa. É o   │
 * │ formato que a camada de cima precisa: a tela pergunta `disponivel()`,  │
 * │ recebe `false`, e mostra o motivo escrito. Quando existir um serviço    │
 * │ de reconhecimento para plugar, ele ocupa ESTE arquivo, o `disponivel`  │
 * │ passa a responder pela configuração, e a tela não muda uma linha.      │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ A FRONTEIRA QUE FICA GARANTIDA                                    │ │
 * │ │                                                                  │ │
 * │ │ Nenhum provedor é nomeado aqui, e nenhum SDK é importado. A tela  │ │
 * │ │ não sabe — nem pode saber — quem leria essa foto. No dia em que    │ │
 * │ │ houver um, esta é a única linha que muda: este objeto ganha um     │ │
 * │ │ `extract` de verdade. Nem o componente da tela, nem a conferência, │ │
 * │ │ nem a rota, nem `origens.ts` são tocados.                          │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { DocumentExtractor, ResultadoDaExtracao } from "./tipos";

/**
 * O NOME ESTÁVEL DESTE LEITOR.
 *
 * Ele aparece na tela, na linha "de onde veio o dado", e é por isso que é
 * escrito para ser lido por ela. "Leitura de imagem" descreve o que o leitor
 * FARIA; é o que ela precisa saber para entender por que a porta existe e não
 * entrega sozinha.
 */
export const NOME_DO_LEITOR_DE_IMAGEM = "Reconhecimento do texto da foto";

/**
 * A RAZÃO, ESCRITA PARA ELA — não para o log.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A FRASE DIZ QUATRO COISAS                                    │
 * │                                                                      │
 * │ 1. O que não está disponível: ler o que está escrito na foto.          │
 * │ 2. Por que não está: não há serviço de reconhecimento configurado.     │
 * │ 3. O que fazer no lugar: digitar ou colar a lista.                     │
 * │ 4. Onde a foto fica: no computador dela, sem ser enviada a lugar       │
 * │    nenhum.                                                             │
 * │                                                                      │
 * │ A quarta não é detalhe jurídico. É a pergunta que ela vai fazer antes   │
 * │ de qualquer outra — "e a foto do meu caderno, vai para onde?" — e a    │
 * │ resposta precisa estar na tela antes de ela perguntar. Escondê-la      │
 * │ seria deixá-la supor o pior.                                           │
 * │                                                                      │
 * │ O texto NÃO menciona IA, modelo, API nem provedor: são palavras         │
 * │ nossas, e ela faz fichas técnicas. O que ela precisa entender é que     │
 * │ essa parte ainda não existe pronta.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const MOTIVO =
  "Esta instalação ainda não tem um serviço de reconhecimento de texto configurado, então o sistema não " +
  "consegue ler o que está escrito na foto. Nada foi lido da sua imagem — e a foto não saiu do seu " +
  "computador. Por enquanto, digite ou cole a lista de ingredientes: é o caminho que já funciona hoje, e " +
  "o que você receber dele passa pelas mesmas contas.";

/**
 * O LEITOR DE IMAGEM.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE RECEBE O ARQUIVO E NÃO O ABRE                            │
 * │                                                                      │
 * │ `extract` aceita o `File` e não toca nele. Quem valida a assinatura da │
 * │ imagem é `./seguranca.ts`, e é lá que os primeiros bytes são lidos —    │
 * │ e é isso que garante a frase acima: o arquivo não é enviado a lugar     │
 * │ nenhum. Um leitor que lesse a imagem inteira para depois dizer "não     │
 * │ consigo ler" estaria gastando a memória de um celular para não fazer    │
 * │ nada — e, pior, deixando aberta a pergunta sobre para onde foi.        │
 * │                                                                      │
 * │ A assinatura fica igual à de um leitor real porque é ela que a tela    │
 * │ consome. O leitor que existir amanhã vai precisar do arquivo, e o       │
 * │ contrato não deve mudar só porque hoje ninguém lê.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const leitorImagem: DocumentExtractor = {
  nome: NOME_DO_LEITOR_DE_IMAGEM,

  /**
   * `false`, sempre — e é a verdade, não uma configuração faltando.
   *
   * A tela usa isto para decidir o que oferecer. A porta continua na lista
   * (ver `origens.ts`: esconder faria o sistema parecer menor do que é), e o
   * que muda é a frase — que diz na cara que a leitura não vem junto.
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
   * `INDISPONIVEL` e não `FALHOU`: não houve falha. Nada quebrou, e nada deu
   * errado com a foto dela. O sistema simplesmente não tem a peça — e essas
   * duas palavras pedem coisas diferentes dela. "Falhou" convida a tentar de
   * novo; "indisponível" explica que tentar de novo não adianta, porque o
   * problema não é a imagem.
   *
   * `VAZIO` também seria errado, e é o erro mais fácil de cometer: uma foto
   * de página em branco é um arquivo legítimo que um leitor real leria e não
   * acharia nada. Aqui não houve leitura — dizer "a foto não tem texto" seria
   * afirmar sobre uma imagem que ninguém abriu.
   */
  async extract(_: File): Promise<ResultadoDaExtracao> {
    return { estado: "INDISPONIVEL", motivo: MOTIVO };
  },
};
