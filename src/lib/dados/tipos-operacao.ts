/**
 * TIPOS DA OPERAÇÃO — cliente, consultoria, tarefa, processo, ficha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA QUE GOVERNA ESTE ARQUIVO                                     │
 * │                                                                      │
 * │ NENHUM TIPO AQUI CARREGA UM NÚMERO CALCULADO.                        │
 * │                                                                      │
 * │ Não existe `cmv`, não existe `custoTotal`, não existe `margem`, não  │
 * │ existe `indiceCoccao`, não existe `fatorCorrecaoAplicado`, não       │
 * │ existe `score`. Todos esses dependem dos pontos 4, 5, 6, 7, 9, 11 e  │
 * │ 19 da Seção 17, que seguem sem resposta.                             │
 * │                                                                      │
 * │ O que existe é o que é FATO OBSERVÁVEL: quem é o cliente, o que foi  │
 * │ combinado, o que está pendente, o que foi declarado, que ingrediente │
 * │ tem que preço, em que dia, e — desde o motor de custos — quanto o     │
 * │ insumo pesou antes e depois de cada etapa. Um sistema que demonstra   │
 * │ a operação sem inventar a matemática dela.                           │
 * │                                                                      │
 * │ ┌────────────────────────────────────────────────────────────────┐   │
 * │ │ O QUE MUDOU COM O MOTOR DE CUSTOS, E O QUE NÃO MUDOU           │   │
 * │ │                                                                │   │
 * │ │ O que mudou: entrou PESO MEDIDO. `Transformacao` guarda o peso  │   │
 * │ │ bruto, o limpo e o preparado — três medições, três fatos. Com   │   │
 * │ │ eles, perda, rendimento e custo unitário por etapa passaram a   │   │
 * │ │ ser ARITMÉTICA, e por isso saíram deste arquivo: quem os        │   │
 * │ │ calcula é `./custos`, em funções puras, na leitura.             │   │
 * │ │                                                                │   │
 * │ │ O que NÃO mudou: nenhum campo de alvo. Não entrou CMV alvo,     │   │
 * │ │ não entrou margem, não entrou markup, não entrou preço de       │   │
 * │ │ venda, não entrou fator de correção de tabela. O motor calcula  │   │
 * │ │ o que foi medido e para onde não há medição.                    │   │
 * │ │                                                                │   │
 * │ │ A diferença é a linha inteira: `rendimentoFinalPct` sai de dois │   │
 * │ │ pesos que alguém pôs na balança. `fator de correção 1,25`      │   │
 * │ │ sairia de uma tabela que ninguém escreveu. O primeiro é conta;  │   │
 * │ │ o segundo seria a metodologia dela, inventada pelo sistema.     │   │
 * │ │                                                                │   │
 * │ │ `situacaoCalculo` continua em `Ficha` porque ainda diz algo     │   │
 * │ │ verdadeiro: se os dados para calcular existem ou não. Ele só    │   │
 * │ │ deixou de significar "o sistema não sabe calcular".             │   │
 * │ └────────────────────────────────────────────────────────────────┘   │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { BlocoChave } from "./perguntas";
import type { ParametrosComerciais } from "./indicadores-comerciais";
import type { LeadStatus, OrigemLead, TipoServico } from "./tipos";

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------

export type SituacaoCliente = "ATIVO" | "EM_IMPLANTACAO" | "PAUSADO" | "ENCERRADO";

export type Modalidade = "PRESENCIAL" | "ONLINE" | "MISTA";

export type PorteEstabelecimento = "PEQUENO" | "MEDIO" | "GRANDE";

/**
 * O cliente.
 *
 * Os campos de contexto (`porte`, `funcionarios`, `controlaEstoque`) vêm
 * das respostas que ELE deu no diagnóstico — não são dedução do sistema.
 * É por isso que podem existir agora: são declarações, e o relatório da
 * Fase 0 pediu que o cadastro carregasse o contexto do negócio.
 *
 * O que NÃO existe aqui: CMV alvo, margem desejada, origem do preço de
 * insumo. São decisões da consultora (pontos 7 e 10) e virarão campos
 * quando ela responder — não antes.
 */
export type Cliente = {
  id: string;
  nomeFantasia: string;
  nomeContato: string;
  email: string;
  whatsapp: string;
  tipoNegocio: TipoServico;
  porte: PorteEstabelecimento;
  cidade: string;
  situacao: SituacaoCliente;
  modalidade: Modalidade;
  iniciadoEm: Date;
  ultimaAtividadeEm: Date;
  /** Número de funcionários declarado no diagnóstico. Faixa, não estimativa. */
  funcionariosDeclarados: string;
  /** De onde este cliente veio — liga a história de volta ao lead. */
  leadOrigemId: string | null;
  origem: OrigemLead;
  /** O que ele declarou como maior problema, quando virou cliente. */
  problemaDeclarado: string;
};

// ---------------------------------------------------------------------------
// Consultoria
// ---------------------------------------------------------------------------

/**
 * Status da consultoria.
 *
 * São rótulos que a consultora ATRIBUI. Não existe transição automática
 * entre eles: o sistema não decide que uma consultoria "passou" para
 * acompanhamento porque uma data chegou. Isso seria regra de negócio
 * inventada, e ela não pediu automação.
 */
export type StatusConsultoria =
  | "PLANEJAMENTO"
  | "EM_ANDAMENTO"
  | "AGUARDANDO_CLIENTE"
  | "EM_ACOMPANHAMENTO"
  | "CONCLUIDA";

/** As etapas do método dela, na ordem que o site dela já publica. */
export type EtapaConsultoria =
  | "DIAGNOSTICO"
  | "ANALISE"
  | "PLANO_DE_ACAO"
  | "IMPLANTACAO"
  | "TREINAMENTO"
  | "ACOMPANHAMENTO"
  | "RESULTADO";

export type EstadoEtapa = "NAO_INICIADA" | "EM_ANDAMENTO" | "CONCLUIDA" | "AGUARDANDO_DADOS";

/**
 * Uma etapa da jornada.
 *
 * `progresso` e `total` existem para o caso "3 de 12 fichas" — uma
 * CONTAGEM, que é fato verificável. Repare que não existe percentual de
 * conclusão geral da consultoria: somar etapas de naturezas diferentes
 * exigiria pesos, e peso é decisão (ponto 11).
 */
export type EtapaJornada = {
  etapa: EtapaConsultoria;
  estado: EstadoEtapa;
  /** Contagem quando faz sentido (fichas feitas, processos mapeados). */
  progresso?: number;
  total?: number;
  /** Frase curta de situação. Escrita, não calculada. */
  nota: string;
};

export type Consultoria = {
  id: string;
  clienteId: string;
  titulo: string;
  status: StatusConsultoria;
  modalidade: Modalidade;
  iniciadaEm: Date;
  ultimoAcompanhamentoEm: Date | null;
  proximaAcao: string;
  proximaAcaoEm: Date | null;
  /** Escopo combinado, em texto. O que ela vai entregar. */
  escopo: string[];
  jornada: EtapaJornada[];
};

// ---------------------------------------------------------------------------
// Plano de ação
// ---------------------------------------------------------------------------

export type Prioridade = "ALTA" | "MEDIA" | "BAIXA";

export type StatusAcao = "A_FAZER" | "EM_ANDAMENTO" | "AGUARDANDO_CLIENTE" | "CONCLUIDO";

export type AcaoPlano = {
  id: string;
  consultoriaId: string;
  clienteId: string;
  titulo: string;
  descricao: string;
  responsavel: string;
  prioridade: Prioridade;
  status: StatusAcao;
  prazo: Date | null;
  observacao: string;
  criadoEm: Date;
};

// ---------------------------------------------------------------------------
// Tarefa
// ---------------------------------------------------------------------------

/**
 * Tarefa é a ação do dia a dia da consultora — distinta da ação do plano,
 * que é o combinado com o cliente. Uma tarefa pode não ter cliente
 * (lembrar de comprar café) e uma ação de plano sempre tem.
 */
export type StatusTarefa = "A_FAZER" | "EM_ANDAMENTO" | "CONCLUIDA";

export type Tarefa = {
  id: string;
  titulo: string;
  clienteId: string | null;
  consultoriaId: string | null;
  prazo: Date | null;
  status: StatusTarefa;
  prioridade: Prioridade;
  concluidaEm: Date | null;
};

// ---------------------------------------------------------------------------
// Acompanhamento
// ---------------------------------------------------------------------------

export type TipoAcompanhamento = "REUNIAO" | "VISITA" | "ANALISE" | "RETORNO" | "REVISAO";

export type Acompanhamento = {
  id: string;
  clienteId: string;
  consultoriaId: string;
  tipo: TipoAcompanhamento;
  data: Date;
  modalidade: Modalidade;
  titulo: string;
  resumo: string;
  /** O que ficou combinado de fazer — em texto, escrito por ela. */
  pendencias: string[];
  proximaAcao: string;
  /** O sistema não calcula duração nem produtividade. Só registra o fato. */
  registradoEm: Date;
};

// ---------------------------------------------------------------------------
// Processo / praça
// ---------------------------------------------------------------------------

/**
 * Passo do fluxo de finalização.
 *
 * `tempoEstimadoMin` é o que a equipe DECLAROU, não cronometragem. O
 * sistema não mede tempo — ele guarda o que foi informado, com o número
 * redondo que veio. É diferente de um indicador calculado.
 */
export type PassoProcesso = {
  ordem: number;
  descricao: string;
  responsavel: string;
  tempoEstimadoMin: number | null;
};

export type Processo = {
  id: string;
  clienteId: string;
  praca: string;
  turno: string;
  responsavel: string;
  /** Pratos que passam por esta praça. Nomes, não ids — é o que ela vê. */
  pratos: string[];
  passos: PassoProcesso[];
  /** Soma dos tempos declarados. Calculada porque é soma de fato, não regra. */
  observacoes: string;
};

// ---------------------------------------------------------------------------
// Ficha técnica — ESTRUTURA, SEM MOTOR
// ---------------------------------------------------------------------------

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA FICHA NÃO TEM CUSTO                                     │
 * │                                                                      │
 * │ Uma ficha técnica é, no fim, uma conta. E a conta depende de cinco   │
 * │ decisões que ainda não existem:                                      │
 * │                                                                      │
 * │   · fator de correção aplicado onde?      → pontos 5 e 6            │
 * │   · índice de cocção existe e como?       → ponto 4                 │
 * │   · o que se faz com a perda declarada?   → ponto 4                 │
 * │   · arredonda em que casa?                → ponto 19                │
 * │                                                                      │
 * │ Por isso `ItemFicha` guarda QUANTIDADE e PREÇO DE REFERÊNCIA — os    │
 * │ dois fatos — e NÃO guarda custo. O custo é o produto dos dois, mas   │
 * │ qual dos dois é ajustado antes de multiplicar ainda é decisão dela.  │
 * │                                                                      │
 * │ O campo `situacaoCalculo` é a resposta honesta para a tela: em vez   │
 * │ de mostrar um número inventado, ela mostra que o número depende de   │
 * │ uma configuração. Quando os pontos forem respondidos, este campo     │
 * │ passa a "DISPONIVEL" e o servidor preenche os valores.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type SituacaoCalculo = "PENDENTE_METODOLOGIA" | "AGUARDANDO_DADOS" | "DISPONIVEL";

/**
 * EM QUE PESO A QUANTIDADE DA FICHA FOI DECLARADA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE CAMPO É A PEÇA QUE FALTAVA PARA A CONTA FECHAR                   │
 * │                                                                      │
 * │ Uma ficha que pede "1,200 kg de mandioca" está pedindo o quê? O quilo │
 * │ como se compra, o quilo depois de descascar, ou o quilo depois de     │
 * │ cozinhar? Na cozinha, quem escreve a ficha sabe. No sistema, sem este │
 * │ campo, a pergunta ficava sem resposta — e as três respostas dão custos │
 * │ diferentes para a mesma linha.                                        │
 * │                                                                      │
 * │ Com a etapa declarada, a conta vira aritmética: a quantidade vezes o  │
 * │ custo unitário DAQUELA etapa. Sem ela, o sistema teria que escolher   │
 * │ por conta própria — e escolher seria inventar metodologia.            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type EtapaPeso = "COMPRA" | "LIMPO" | "PREPARADO";

export const ROTULO_ETAPA_PESO: Record<EtapaPeso, string> = {
  COMPRA: "peso de compra",
  LIMPO: "peso limpo",
  PREPARADO: "peso preparado",
};

export type ItemFicha = {
  ingredienteId: string;
  /** Quantidade declarada. Como texto: "0,120" ou "a gosto". */
  quantidade: string;
  unidade: string;
  /** Preço de referência do ingrediente no momento do uso. */
  precoReferencia: number | null;
  /**
   * Em que peso a quantidade acima está expressa.
   *
   * `COMPRA` é o padrão de quem escreve a ficha olhando a nota fiscal;
   * `PREPARADO` é o de quem pesa o prato pronto. As duas são declarações
   * legítimas, e o sistema não converte uma na outra sem os pesos medidos.
   */
  etapa: EtapaPeso;
  /** O que a cozinha anotou sobre esta linha — corte, marca, substituição. */
  observacao: string;
};

/*
  POR QUE NÃO EXISTE MAIS UM CAMPO `custo` AQUI.

  Ele existia e era `null` em todas as fichas, como registro honesto de que a
  metodologia ainda não estava definida. Com o motor de aritmética, o custo
  passou a ser CALCULÁVEL a partir do preço de referência e dos pesos medidos
  — e um campo calculável não se guarda: ele se deriva na leitura, pelo mesmo
  motivo que o total do contrato é a soma das parcelas e não um campo ao lado
  delas. Dois lugares para o mesmo número divergem no dia em que um deles for
  atualizado.

  Quem lê o custo de um item agora é `derivarCustoDaFicha`, em `./custos`.
*/

export type SituacaoFicha = "COMPLETA" | "AGUARDANDO_DADOS" | "EM_REVISAO";

/**
 * POR QUE UMA LINHA DA FICHA NÃO ENTROU NA CONTA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ CADA MOTIVO PEDE UMA AÇÃO DIFERENTE DELA                             │
 * │                                                                      │
 * │   OK                    — a linha entrou na soma.                     │
 * │   SEM_PRECO             — falta o preço do insumo. Ela resolve na     │
 * │                           biblioteca, não na ficha.                   │
 * │   SEM_PESO_ETAPA        — a ficha diz "peso preparado" e o insumo só  │
 * │                           foi pesado na compra. Isso se resolve com   │
 * │                           uma balança, não com um cadastro.           │
 * │   QUANTIDADE_ILEGIVEL   — a quantidade não é número ("a gosto").      │
 * │   SEM_UNIDADE_COMPATIVEL— o preço é por unidade de outra grandeza.    │
 * │   AGUARDANDO_CONFERENCIA— a linha não fecha, e quem decide é ela.      │
 * │                                                                      │
 * │ Um único "faltam dados" juntaria quatro problemas distintos num       │
 * │ aviso só, e a consultora não saberia o que fazer com ele.             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O ÚLTIMO CASO NÃO VEM DO MOTOR — VEM DA IMPORTAÇÃO DE DOCUMENTO       │
 * │                                                                      │
 * │ Os quatro primeiros são o motor dizendo "com o que tenho, não dá".     │
 * │ O quinto é diferente, e é por isso que ele não podia ser nenhum deles: │
 * │ ali o motor CONSEGUE calcular — o número está completo e legível — e a │
 * │ conta seria feita com um dado que ninguém confirmou.                   │
 * │                                                                      │
 * │ O caso que o justifica: uma leitura automática multiplica por mil. Um  │
 * │ documento diz "5000 kg" onde dizia "0,5 kg". A quantidade é um número  │
 * │ legível, o preço é um preço, a unidade é um peso — `resolverItem`      │
 * │ devolveria "calculado" com toda a confiança, e o prato carregaria um   │
 * │ custo cinco mil vezes maior.                                           │
 * │                                                                      │
 * │ Por isso a linha não entra no motor: o motor não tem como saber que o  │
 * │ número ainda está em dúvida. Quem sabe é `podeCalcular` — ver          │
 * │ `planilhas/importacao/validar.ts` — e é ela que marca a linha.         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type EstadoCalculoItem =
  | "OK"
  | "SEM_PRECO"
  | "SEM_PESO_ETAPA"
  | "QUANTIDADE_ILEGIVEL"
  | "SEM_UNIDADE_COMPATIVEL"
  | "AGUARDANDO_CONFERENCIA";

export const ROTULO_ESTADO_ITEM: Record<EstadoCalculoItem, string> = {
  OK: "calculado",
  SEM_PRECO: "sem preço",
  SEM_PESO_ETAPA: "falta o peso",
  QUANTIDADE_ILEGIVEL: "quantidade não numérica",
  SEM_UNIDADE_COMPATIVEL: "unidade incompatível",
  AGUARDANDO_CONFERENCIA: "aguardando conferência",
};

/** O que fazer a respeito de cada motivo — em uma frase, para a tela. */
export const ACAO_DO_ESTADO_ITEM: Record<EstadoCalculoItem, string> = {
  OK: "",
  SEM_PRECO: "Registre o preço deste insumo na biblioteca.",
  SEM_PESO_ETAPA:
    "Este insumo ainda não foi pesado nesta etapa. Pese na cozinha e informe o peso.",
  QUANTIDADE_ILEGIVEL:
    "A quantidade desta linha não é um número. Se ela não tiver medida exata, deixe fora da soma.",
  SEM_UNIDADE_COMPATIVEL:
    "O preço deste insumo está numa unidade de grandeza diferente da quantidade da ficha.",
  /*
    A frase não repete o aviso que ela já leu na conferência: manda de volta
    para lá. A conferência é o lugar onde o dado se resolve — é lá que estão
    as duas leituras possíveis do número que a leitura automática não soube
    escolher, e é lá que ela decide qual vale.
  */
  AGUARDANDO_CONFERENCIA:
    "Esta linha ainda não foi confirmada na conferência. Volte à conferência e resolva o que está marcado.",
};

export type Ficha = {
  id: string;
  clienteId: string;
  nome: string;
  categoria: string;
  /** Rendimento em porções. Número declarado, não calculado. */
  rendimentoPorcoes: number | null;
  /** Peso da porção em gramas, quando declarado. */
  porcaoGramas: number | null;
  itens: ItemFicha[];
  modoPreparo: string[];
  finalizacao: string[];
  observacoes: string;
  situacao: SituacaoFicha;
  situacaoCalculo: SituacaoCalculo;
  atualizadaEm: Date;
  /** Histórico de alterações da ficha — o que mudou e quando. */
  historico: Array<{ em: Date; oQue: string; quem: string }>;

  /*
    ┌────────────────────────────────────────────────────────────────────┐
    │ OS DOIS CAMPOS COMERCIAIS — E POR QUE ELES NÃO CONTRARIAM A REGRA  │
    │ DESTE ARQUIVO                                                      │
    │                                                                    │
    │ A regra lá em cima é sobre NÚMERO CALCULADO. Não existe `cmv`, não │
    │ existe `custoTotal`, não existe `margem` — e continua não         │
    │ existindo: o CMV desta ficha é uma divisão feita na leitura, e não │
    │ um campo.                                                          │
    │                                                                    │
    │ Estes dois são outra coisa, e é a distinção inteira:               │
    │                                                                    │
    │   `precoVenda` é FATO DECLARADO. Alguém decidiu vender o prato por │
    │   aquele preço, e o sistema registra o que foi decidido. Ele não   │
    │   tem como recalcular isso a partir de nada.                       │
    │                                                                    │
    │   `parametros` é DECISÃO DE MÉTODO: a margem da casa, o CMV alvo,  │
    │   o markup alvo. É o critério profissional dela, informado — e     │
    │   nenhum dos três traz valor de partida, porque o sistema não      │
    │   escolhe a metodologia de ninguém.                                │
    │                                                                    │
    │ Os dois são opcionais e ausentes por padrão. Ficha sem preço de    │
    │ venda e sem parâmetro é o estado normal, não uma ficha incompleta: │
    │ significa "ainda não decidimos", e o sistema mostra a ausência em  │
    │ vez de supor um número.                                            │
    └────────────────────────────────────────────────────────────────────┘
  */
  precoVenda?: number | null;
  parametros?: ParametrosComerciais;
};

// ---------------------------------------------------------------------------
// Ingrediente e histórico de preço
// ---------------------------------------------------------------------------

export type PrecoIngrediente = {
  id: string;
  /** Data em que este preço passou a valer. */
  em: Date;
  valor: number;
  unidade: string;
  fornecedor: string;
  /** De onde veio o número: ela digitou, o cliente informou, ou é antigo. */
  origem: "CONSULTORA" | "CLIENTE" | "IMPORTADO";
};

/**
 * UMA COMPRA — o que foi pago por quanto.
 *
 * Os três campos são FATOS registrados: quanto veio, por qual valor, em que
 * unidade veio. O preço unitário NÃO mora aqui: ele é `valorTotal /
 * quantidade`, derivado em `./custos`, para que não existam dois números
 * discordando sobre a mesma compra.
 */
export type Compra = {
  quantidade: number;
  unidade: string;
  valorTotal: number;
};

/** Um peso medido numa etapa, com a unidade em que foi pesado. */
export type PesoInformado = {
  peso: number;
  unidade: string;
};

/**
 * AS TRÊS ETAPAS DA TRANSFORMAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE CADA ETAPA É OPCIONAL, E POR QUE ISSO É O PONTO              │
 * │                                                                      │
 * │ Nem todo insumo tem as três. A farinha não perde na limpeza; o        │
 * │ queijo ralado não encolhe no fogo. Obrigar a preencher três pesos     │
 * │ faria a consultora digitar o mesmo número três vezes para calar o     │
 * │ formulário — e aí o dado deixaria de significar "eu medi" para         │
 * │ significar "eu preenchi".                                            │
 * │                                                                      │
 * │ Cada etapa presente é uma MEDIÇÃO. Cada etapa ausente é uma pergunta  │
 * │ que ela ainda não respondeu, e o sistema mostra "não informado".      │
 * │ Nenhuma etapa ausente é preenchida por estimativa.                    │
 * │                                                                      │
 * │ O bruto é o único que a contagem usa como âncora: sem ele não há      │
 * │ perda nenhuma para calcular, porque perda precisa de um ANTES.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type Transformacao = {
  /** O peso como veio, antes de limpar. É o "antes" de toda perda. */
  bruto: PesoInformado | null;
  /** Depois de descascar, limpar, aparar. */
  limpo: PesoInformado | null;
  /** Depois de cozinhar, assar, grelhar — o peso utilizável. */
  preparado: PesoInformado | null;
  /** O que ela anotou sobre o preparo: corte, tempo, ponto. */
  observacao: string;
};

/**
 * O INGREDIENTE — a biblioteca e a transformação.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE MUDOU NESTA VERSÃO, E POR QUE ARQUITETURA                       │
 * │                                                                      │
 * │ A versão anterior era uma lista de preços com nome. Esta é o insumo   │
 * │ como a cozinha o conhece: quanto se compra, por quanto, e o que       │
 * │ acontece com ele entre a compra e o prato.                            │
 * │                                                                      │
 * │ A distinção entre a BIBLIOTECA (o insumo em si) e o DADO DO CLIENTE   │
 * │ (o preço que aquele cliente paga) está feita em TIPO: o preço e o     │
 * │ fornecedor saíram daqui e passaram para `IngredienteDoCliente`, que   │
 * │ aponta para cá. O mesmo "Batata inglesa" existe uma vez, e cada       │
 * │ cliente tem a sua linha de preço.                                     │
 * │                                                                      │
 * │ `precoAtual`, `atualizadoEm`, `fornecedor` e `historico` continuam    │
 * │ existindo aqui como CAMPOS DERIVADOS da biblioteca global — o preço   │
 * │ de referência quando não há um preço específico do cliente. Eles são  │
 * │ preenchidos pelo repositório, nunca digitados na tela.                │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type Ingrediente = {
  id: string;
  nome: string;
  categoria: string;
  /** Unidade em que a biblioteca expressa o preço de referência. */
  unidade: string;
  /** Como este insumo é comprado, na maioria das vezes. Declarado. */
  compra: Compra | null;
  /** Os pesos medidos da transformação. Cada um é opcional. */
  transformacao: Transformacao;
  /** O que ela anotou sobre o insumo em geral — não sobre um cliente. */
  observacoes: string;
  /**
   * O preço de referência da BIBLIOTECA, quando nenhum cliente tem o seu.
   * Derivado do topo de `historico`.
   */
  precoAtual: number | null;
  atualizadoEm: Date;
  fornecedor: string;
  /**
   * Histórico de preços de referência da biblioteca, do mais recente para o
   * mais antigo. É o preço GENÉRICO do insumo — para o preço de um cliente
   * específico, ver `IngredienteDoCliente.historico`.
   */
  historico: PrecoIngrediente[];
};

/**
 * O INSUMO VISTO POR UM CLIENTE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA SEPARAÇÃO EXISTE                                        │
 * │                                                                      │
 * │ É o ponto 6 da arquitetura, e ele é o que impede o erro mais caro da  │
 * │ área: misturar o preço de um cliente com o do outro.                  │
 * │                                                                      │
 * │ O "Batata inglesa" é um insumo só — a mesma coisa, a mesma compra, a  │
 * │ mesma perda na limpeza. Mas a Empório Verde paga R$ 6,10 o quilo no   │
 * │ hortifrúti da esquina e o Sabor da Serra paga R$ 5,40 no atacado. Se  │
 * │ o preço morasse na biblioteca, o custo de um prato do Sabor da Serra   │
 * │ sairia com o preço da Empório — e ninguém veria, porque o número      │
 * │ sairia com aparência perfeitamente normal.                            │
 * │                                                                      │
 * │ A transformação NÃO se duplica por cliente: quanto a batata rende     │
 * │ depende da batata, não de quem comprou. Duplicá-la por cliente         │
 * │ criaria duas versões do mesmo fato, e a segunda a ser editada venceria │
 * │ — sem ninguém saber qual das duas vale.                               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type IngredienteDoCliente = {
  id: string;
  clienteId: string;
  ingredienteId: string;
  /** O preço vigente PARA ESTE CLIENTE. Derivado do topo do histórico. */
  precoAtual: number | null;
  unidade: string;
  fornecedor: string;
  atualizadoEm: Date;
  /** Histórico de preços deste cliente, do mais recente para o mais antigo. */
  historico: PrecoIngrediente[];
  /** O que vale só para este cliente: marca, embalagem, substituição. */
  observacoes: string;
};

// ---------------------------------------------------------------------------
// Documento
// ---------------------------------------------------------------------------

export type TipoDocumento = "RELATORIO" | "FICHA" | "PLANO_DE_ACAO" | "PROCESSO" | "OUTRO";

export type SituacaoDocumento = "RASCUNHO" | "PRONTO" | "ENTREGUE";

export type Documento = {
  id: string;
  clienteId: string;
  nome: string;
  tipo: TipoDocumento;
  criadoEm: Date;
  situacao: SituacaoDocumento;
  /** Vazio nesta fase: não existe storage de arquivo. */
  arquivo: null;
};

// ---------------------------------------------------------------------------
// Histórico unificado do cliente
// ---------------------------------------------------------------------------

export type TipoEvento =
  | "diagnostico_recebido"
  | "lead_convertido"
  | "consultoria_iniciada"
  | "acompanhamento_registrado"
  | "ficha_criada"
  | "preco_atualizado"
  | "processo_mapeado"
  | "tarefa_concluida"
  | "documento_gerado";

export type EventoHistorico = {
  id: string;
  clienteId: string;
  tipo: TipoEvento;
  descricao: string;
  em: Date;
};

// ---------------------------------------------------------------------------
// Compromisso (agenda)
// ---------------------------------------------------------------------------

export type Compromisso = {
  id: string;
  clienteId: string;
  consultoriaId: string | null;
  titulo: string;
  tipo: TipoAcompanhamento;
  modalidade: Modalidade;
  quando: Date;
};

// ---------------------------------------------------------------------------
// Notificação interna
// ---------------------------------------------------------------------------

export type TipoNotificacao =
  | "diagnostico_novo"
  | "tarefa_proxima"
  | "cliente_aguardando"
  | "acompanhamento_previsto";

export type Notificacao = {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  quando: Date;
  /** Para onde a notificação leva. */
  href: string;
  lida: boolean;
};

// ---------------------------------------------------------------------------
// Atenção — o bloco "precisa da sua atenção"
// ---------------------------------------------------------------------------

export type TipoAtencao =
  | "INFORMACAO_AGUARDANDO_CLIENTE"
  | "FICHA_AGUARDANDO_DADOS"
  | "PROCESSO_AGUARDANDO_REVISAO"
  | "ACOMPANHAMENTO_PENDENTE"
  | "DIAGNOSTICO_NAO_LIDO"
  | "CONTRATO_AGUARDANDO_ACEITE"
  | "PARCELA_ATRASADA";

export type ItemAtencao = {
  id: string;
  tipo: TipoAtencao;
  titulo: string;
  detalhe: string;
  clienteId: string | null;
  /** Rota para agir. Nunca vazio — atenção sem ação é só preocupação. */
  href: string;
  desde: Date;
};

// ---------------------------------------------------------------------------
// Helpers de leitura — o que a UI usa para rotular
// ---------------------------------------------------------------------------

export type OpcaoRotulada<T extends string> = { valor: T; texto: string };

// ---------------------------------------------------------------------------
// Contrato
// ---------------------------------------------------------------------------

/**
 * O CONTRATO — a formalização comercial de uma consultoria.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE É FATO AQUI, E O QUE NÃO É                                     │
 * │                                                                      │
 * │ Valor do projeto, valor de cada parcela, datas, status: tudo isso é   │
 * │ FATO DECLARADO. Alguém combinou esses números, e o sistema só os      │
 * │ guarda. Não há nada calculado neste tipo — nem juros, nem multa, nem  │
 * │ projeção, nem total "esperado".                                       │
 * │                                                                      │
 * │ Repare que NÃO existe campo `valorTotal` no contrato. O total é a     │
 * │ soma das parcelas, e somar é fato, não decisão: `somarParcelas()`     │
 * │ faz isso na derivação. Guardar o total ao lado das parcelas criaria   │
 * │ duas fontes para o mesmo número — e no dia em que uma parcela fosse   │
 * │ editada, uma das duas estaria errada.                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type StatusContrato =
  | "RASCUNHO"
  | "AGUARDANDO_ACEITE"
  | "ASSINADO"
  | "EM_ANDAMENTO"
  | "CONCLUIDO"
  | "CANCELADO";

/**
 * Estado do documento do contrato.
 *
 * Existe separado do `StatusContrato` porque são duas perguntas diferentes:
 * "em que ponto do trabalho estamos" e "o papel foi assinado". Um contrato
 * assinado e um contrato em rascunho podem estar os dois em `EM_ANDAMENTO`,
 * e a consultora precisa ver a diferença.
 */
export type EstadoDocumentoContrato = "NAO_ENVIADO" | "AGUARDANDO_ACEITE" | "ASSINADO";

/** Como o aceite aconteceu, quando aconteceu. */
export type TipoAceite = "ASSINATURA_DIGITAL" | "ASSINATURA_MANUSCRITA" | "ACEITE_POR_EMAIL";

export type Aceite = {
  tipo: TipoAceite;
  em: Date;
  /** Quem aceitou. Nome declarado, não usuário de sistema. */
  por: string;
};

export type StatusParcela = "PENDENTE" | "PAGO" | "ATRASADO" | "CANCELADO";

/**
 * UMA PARCELA DO CONTRATO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O SISTEMA NÃO SABE QUANTAS PARCELAS UM CONTRATO TEM                  │
 * │                                                                      │
 * │ Não existe "1º pagamento", "2º pagamento" como campos. Uma parcela é  │
 * │ uma LINHA numa lista, e o contrato carrega N delas — duas, quatro,    │
 * │ seis, doze. O rótulo que aparece na tela ("2ª parcela") é derivado da │
 * │ POSIÇÃO na lista, não gravado.                                        │
 * │                                                                      │
 * │ A alternativa — quatro campos fixos — funcionaria para o contrato de  │
 * │ hoje e quebraria no primeiro cliente que negociasse entrada + 3x.     │
 * │ Como o contrato é justamente onde as condições variam por cliente, é  │
 * │ ali que fixar estrutura custa mais caro.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type ParcelaContrato = {
  id: string;
  /** Posição na lista, começando em 1. Gravada para ordenar sem ambiguidade. */
  numero: number;
  /** O que esta parcela representa: entrada, mensalidade, parcela, entrega. */
  descricao: string;
  valor: number;
  /** Condição declarada em texto — "na assinatura", "todo dia 10". */
  condicao: string;
  /** Quando vence. `null` quando a condição ainda não virou data. */
  venceEm: Date | null;
  /** Quando foi paga. `null` enquanto não foi. */
  pagoEm: Date | null;
  status: StatusParcela;
  /**
   * Recorrente ou não.
   *
   * É o que separa a ENTRADA (uma vez) da MENSALIDADE (todo mês). Sem esta
   * marca, a tela não teria como dizer "mensalidade" sem deduzir do texto da
   * descrição — e deduzir texto é como o sistema passaria a inventar.
   */
  recorrente: boolean;
};

/** Eventos da vida do contrato. Mesma ideia de `TipoEvento`, outro escopo. */
export type TipoEventoContrato =
  | "criado"
  | "enviado"
  | "visualizado"
  | "aceito"
  | "pagamento_registrado"
  | "projeto_iniciado"
  | "projeto_entregue"
  | "cancelado";

export type EventoContrato = {
  id: string;
  tipo: TipoEventoContrato;
  descricao: string;
  em: Date;
  /** Quem provocou. "Érika Bruna" ou o nome de quem aceitou. */
  por: string;
};

export type Contrato = {
  id: string;
  clienteId: string;
  /** A consultoria que este contrato formaliza. `null` antes de vincular. */
  consultoriaId: string | null;
  /** Número do contrato, como ela o chama. Texto, não sequência do sistema. */
  numero: string;
  titulo: string;
  status: StatusContrato;
  criadoEm: Date;
  /** Data de início do trabalho, combinada. */
  inicioEm: Date | null;
  /** Previsão de entrega. Compromisso declarado, não prazo calculado. */
  entregaPrevistaEm: Date | null;
  /** Aceite formal, quando existir. */
  aceite: Aceite | null;
  estadoDocumento: EstadoDocumentoContrato;
  /** Quantas parcelas, de quantas pagas. Contagem — não percentual. */
  parcelas: ParcelaContrato[];
  eventos: EventoContrato[];
  /** O que está combinado, em texto. Igual a `escopo` da consultoria. */
  escopo: string[];
  observacoes: string;
};

/** Reexportação para as telas não precisarem cavar em dois arquivos. */
export type { BlocoChave, LeadStatus, OrigemLead, TipoServico };
