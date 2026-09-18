/**
 * O HISTÓRICO DE PLANILHAS GERADAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO É — E O QUE ELE AINDA NÃO É                       │
 * │                                                                      │
 * │ É a ESTRUTURA do histórico: o formato de um registro de planilha      │
 * │ gerada, com todos os campos que ele vai ter. É o que permite que a    │
 * │ tela mostre hoje a lista vazia com as colunas certas, em vez de       │
 * │ mostrar uma lista vazia sem forma nenhuma.                            │
 * │                                                                      │
 * │ NÃO é o armazenamento. Não há tabela, nem arquivo, nem banco — e a     │
 * │ lista que este módulo devolve é VAZIA de propósito. Ela continuará     │
 * │ vazia enquanto o sistema estiver em demonstração.                      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LISTA É VAZIA, E NÃO PREENCHIDA COM EXEMPLOS               │
 * │                                                                      │
 * │ Seria fácil — e ficaria bonito — inventar cinco planilhas "geradas     │
 * │ em 12/08", "geradas em 03/09". Uma lista com dados inventados, porém,  │
 * │ é indistinguível de uma lista real. Quem abrisse a tela acreditaria    │
 * │ que o sistema registra o que gera. Ele não registra.                   │
 * │                                                                      │
 * │ E o estrago não para no engano: uma lista inventada ESCONDE o          │
 * │ trabalho que falta. A tela parece pronta, o registro nunca é           │
 * │ construído, e a falta só aparece no dia em que alguém precisar achar   │
 * │ uma planilha antiga e ela não estiver lá.                              │
 * │                                                                      │
 * │ Então a lista é vazia e a tela DIZ que é vazia, com o motivo.          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O FORMATO É DEFINIDO AGORA, SE A LISTA ESTÁ VAZIA            │
 * │                                                                      │
 * │ Porque o formato é uma decisão, e decisões de estrutura ficam caras    │
 * │ depois. Cada campo abaixo responde a uma pergunta que alguém vai       │
 * │ fazer sobre uma planilha antiga, e cada um foi escolhido agora para    │
 * │ que o registro, quando existir, já nasça gravando o que interessa.     │
 * │                                                                      │
 * │ Um campo que falta no registro é um dado que se perdeu para sempre:    │
 * │ o arquivo foi gerado com o nome do cliente, e não há como          │
 * │ recuperá-lo depois se ninguém o gravou na hora.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * UMA PLANILHA GERADA, COMO ELA FICA REGISTRADA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE OS NOMES APARECEM DUPLICADOS                                  │
 * │                                                                      │
 * │ `clienteId` e `clienteNome` parecem repetição — o nome poderia ser     │
 * │ buscado pelo id. Não podem: o nome de um cliente MUDA, e um registro   │
 * │ de planilha é um documento com data. Se o Empório Verde virar outra    │
 * │ coisa daqui a um ano, a planilha que saiu em agosto saiu com o nome    │
 * │ de agosto, e é assim que ela precisa reaparecer no histórico.          │
 * │                                                                      │
 * │ O mesmo vale para `modeloNome`: renomear um modelo de planilha não     │
 * │ pode reescrever o passado.                                            │
 * │                                                                      │
 * │ O id continua guardado ao lado do nome porque ele é o que LIGA o       │
 * │ registro às coisas vivas: é por ele que se acha todos os registros de  │
 * │ um cliente, ou todas as gerações de um mesmo modelo.                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type RegistroPlanilha = {
  /** Identificador do próprio registro. */
  id: string;

  /** O modelo que gerou o arquivo, e o nome que ele tinha naquele dia. */
  modeloId: string;
  modeloNome: string;

  /** O cliente, e o nome fantasia que ele tinha naquele dia. */
  clienteId: string;
  clienteNome: string;

  /**
   * A consultoria a que a planilha se refere, quando houver.
   *
   * É `null` com frequência legítima: uma planilha de cadastro sai para um
   * cliente que ainda não tem consultoria aberta.
   */
  consultoriaId: string | null;

  /**
   * O nome do arquivo, nos dois formatos em que ele existe.
   *
   * `nomeArquivo` é o que foi gravado em disco — sem acento, sem espaço.
   * `nomeExibido` é o que aparece na tela. Guardar os dois evita ter de
   * reconstruir um a partir do outro, que é exatamente o tipo de conta que
   * dá diferença entre sistemas operacionais.
   */
  nomeArquivo: string;
  nomeExibido: string;

  /** Quando a geração aconteceu. Com hora, não só data. */
  geradoEm: Date;

  /**
   * Quem pediu a geração.
   *
   * Hoje é sempre a mesma pessoa — a consultora. O campo existe porque o
   * sistema vai ter mais de um usuário, e "quem gerou isto" é a primeira
   * pergunta que se faz sobre um documento que apareceu sem explicação.
   */
  geradoPor: string;

  /**
   * A versão daquele mesmo arquivo, para aquele mesmo cliente e modelo.
   *
   * Começa em 1 e sobe a cada nova geração do mesmo par cliente+modelo. Não
   * é versão do ARQUIVO (o .xlsx não guarda histórico interno): é a enésima
   * vez que aquela planilha foi tirada. Serve para distinguir "refiz porque
   * os dados mudaram" de "baixei de novo o mesmo arquivo".
   */
  versao: number;

  /**
   * O tamanho do arquivo em bytes.
   *
   * Vem do próprio `Buffer` gerado, e por isso é um número REAL no dia em
   * que o registro for gravado — não uma estimativa. É `null` apenas para
   * registros antigos, se algum dia houver importação de fora.
   */
  tamanhoBytes: number | null;

  /** As abas que o arquivo continha. Conferível abrindo o arquivo baixado. */
  abas: readonly string[];

  /**
   * Onde o arquivo está guardado — o campo que hoje é sempre `null`.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ ESTE É O CAMPO QUE O SISTEMA AINDA NÃO SABE PREENCHER              │
   * │                                                                    │
   * │ Hoje a planilha é gerada e ENTREGUE: os bytes vão direto para o     │
   * │ computador de quem clicou, e o servidor não guarda cópia. Não há    │
   * │ armazenamento de arquivo no projeto — é a mesma ausência que faz o  │
   * │ anexo de documento aparecer desabilitado na aba Documentos.         │
   * │                                                                    │
   * │ Sem esse campo, o histórico diria "Planilha do Empório, 12/08" e    │
   * │ não teria como reabrir o arquivo — um registro que só sabe contar   │
   * │ a história, sem devolver o documento.                              │
   * │                                                                    │
   * │ Ele existe agora, nulo, para que a decisão de onde guardar seja     │
   * │ tomada UMA vez e o registro já nasça com o lugar certo.             │
   * └────────────────────────────────────────────────────────────────────┘
   */
  referenciaArmazenamento: string | null;
};

/**
 * AS COLUNAS DO HISTÓRICO, NA ORDEM EM QUE A TELA AS MOSTRA.
 *
 * A ordem responde à pergunta na sequência em que ela é feita: "que planilha
 * é essa, de quem, quando saiu, e o que eu faço com ela". O tamanho fica por
 * último porque é o dado que menos importa no dia a dia — e continua ali
 * porque, no dia em que uma planilha vier vazia demais, é o primeiro número
 * que denuncia.
 */
export const COLUNAS_HISTORICO: readonly { chave: keyof RegistroPlanilha; titulo: string }[] = [
  { chave: "nomeExibido", titulo: "Arquivo" },
  { chave: "clienteNome", titulo: "Cliente" },
  { chave: "geradoEm", titulo: "Gerado em" },
  { chave: "versao", titulo: "Versão" },
  { chave: "geradoPor", titulo: "Por" },
  { chave: "tamanhoBytes", titulo: "Tamanho" },
];

/**
 * O HISTÓRICO, HOJE VAZIO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA FUNÇÃO EXISTE, SE ELA SÓ DEVOLVE UMA LISTA VAZIA         │
 * │                                                                      │
 * │ Ela é o PONTO DE TROCA. No dia em que o banco for conectado, é esta    │
 * │ função que passa a consultar a tabela — e a tela não muda uma linha,   │
 * │ porque já pede a lista por aqui em vez de ter `[]` escrito dentro     │
 * │ dela.                                                                  │
 * │                                                                      │
 * │ Sem esta função, a tela teria um `const registros = []` no meio do    │
 * │ JSX, e "ligar o histórico" seria uma edição na tela, num lugar onde    │
 * │ edição não deveria ser necessária.                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO É `async`, SE UM DIA VAI LER BANCO                       │
 * │                                                                      │
 * │ É — e o momento de virar `async` é o momento em que passar a ler o     │
 * │ banco, junto com a troca do corpo. Deixá-la assíncrona hoje obrigaria  │
 * │ a tela a `await`-ar uma função que não espera nada, e um `await` que   │
 * │ não espera nada é uma mentira pequena que se espalha: quem ler depois  │
 * │ conclui que já há I/O ali.                                             │
 * │                                                                      │
 * │ A assinatura muda quando a implementação mudar — as duas juntas, no    │
 * │ mesmo commit, para não existir um intervalo em que uma promete o que   │
 * │ a outra não faz.                                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function listarPlanilhasGeradas(): readonly RegistroPlanilha[] {
  return [];
}

/**
 * O TAMANHO EM BYTES, ESCRITO PARA LER.
 *
 * Fica neste arquivo, e não em `@/lib/dados/formato`, porque o único
 * consumidor hoje é o histórico — e porque um formatador de bytes ao lado de
 * `valorEmReais` convidaria a usá-lo para medir outra coisa (o custo de um
 * prato é um "peso", mas não é este).
 *
 * Arredonda na primeira casa e para aí: a diferença entre 1,4 MB e 1,43 MB
 * não muda decisão nenhuma, e a segunda casa só ocupa espaço na coluna.
 */
export function tamanhoLegivel(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes < 1024) return `${bytes} B`;

  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb < 10 ? 1 : 0)} kB`;

  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
