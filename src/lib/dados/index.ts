/**
 * O PONTO DE TROCA.
 *
 * Toda tela da Fase 2 importa `obterRepositorio()` daqui — nunca importa
 * ./mock/ diretamente. É esta indireção que faz a migração para o banco
 * ser uma troca de uma linha, e não uma varredura pelo projeto inteiro.
 *
 * O QUE FALTA PARA A PERSISTÊNCIA REAL
 *
 * 1. Resposta do ponto 15 — se o lead do formulário público entra direto
 *    na fila ou passa por triagem antes. Muda o `criarLead`.
 * 2. Resposta dos pontos 1, 2, 3 e 10 — cadastro completo de cliente.
 *    Sem eles não há para onde converter o lead.
 * 3. `DATABASE_URL` do Neon configurado, e a migration com as tabelas
 *    Lead, Diagnostic, DiagnosticAnswer e LeadNote.
 *
 * Enquanto os três não existirem juntos, ligar o banco produziria telas
 * vazias — o que é pior do que telas claramente marcadas como demonstração.
 */

import type { RepositorioEntrada } from "./repositorio";
import type { RepositorioOperacao } from "./repositorio-operacao";
import { repositorioMock } from "./mock/repositorio-mock";
import { repositorioOperacaoMock } from "./mock/repositorio-operacao-mock";

/** A demonstração está ligada? Toda tela que exibe dado precisa perguntar. */
export function usandoDemonstracao(): boolean {
  // Quando a implementação do Prisma existir, a decisão passa a ser:
  //   return !persistenciaConfigurada();
  return true;
}

export function obterRepositorio(): RepositorioEntrada {
  // A implementação do Prisma entra aqui, com o mesmo contrato:
  //   if (persistenciaConfigurada()) return repositorioPrisma;
  return repositorioMock;
}

/**
 * A operação — cliente, consultoria, tarefa, processo, ficha, ingrediente.
 *
 * Contrato separado do de entrada por uma razão prática: são dois ritmos de
 * migração. A entrada já tem decisões de schema encaminhadas; a operação
 * ainda depende dos pontos 1, 2, 7 e 10. Separá-los permite ligar um sem
 * arrastar o outro pela metade.
 */
export function obterRepositorioOperacao(): RepositorioOperacao {
  return repositorioOperacaoMock;
}

// Reexportações — as telas importam tudo de "@/lib/dados", nunca de um
// caminho interno. Assim a mudança de estrutura não quebra import.
export type {
  Atividade,
  Cliente,
  Diagnostico,
  Lead,
  LeadStatus,
  LeituraBloco,
  Observacao,
  Resposta,
  TipoServico,
  ValorResposta,
} from "./tipos";

export type { RepositorioEntrada, ResumoEntrada } from "./repositorio";
export { persistenciaConfigurada } from "./repositorio";

export {
  BLOCOS,
  BLOCOS_DIAGNOSTICO,
  BLOCO_POR_CHAVE,
  LACUNA,
  PERGUNTAS,
  PERGUNTA_POR_ID,
  TEXTO_SINAL,
  TOTAL_PERGUNTAS,
  perguntasDoBloco,
  sinaisDaResposta,
} from "./perguntas";

export type { BlocoChave, Opcao, Pergunta, Sinal, TipoPergunta } from "./perguntas";

export {
  ETAPAS,
  PERGUNTAS_ULTIMA_ETAPA,
  PERGUNTAS_EXTRAS_ULTIMA_ETAPA,
} from "./etapas";

export type { Etapa } from "./etapas";

export {
  declaracaoPrincipal,
  obrigatoriasEmFalta,
  respostaDe,
  respostasPorBloco,
  sinaisDoDiagnostico,
  sinaisEmTexto,
  sinaisResumidos,
  textoDe,
} from "./derivacoes";

export type { BlocoRespondido } from "./derivacoes";

export {
  ORDEM_STATUS,
  ROTULO_ORIGEM,
  DETALHE_ORIGEM,
  ROTULO_STATUS,
  STATUS_ABERTOS,
  TOM_STATUS,
  dataCurta,
  dataEHora,
  desdeQuando,
  respostaEmTexto,
  respostaVazia,
  saudacao,
  valorEmReais,
} from "./formato";

export type { TomStatus } from "./formato";

// --- Operação ---------------------------------------------------------------

export type {
  AcaoPlano,
  Aceite,
  Acompanhamento,
  Cliente as ClienteOperacao,
  Compra,
  Compromisso,
  Consultoria,
  Contrato,
  Documento,
  EstadoCalculoItem,
  EstadoDocumentoContrato,
  EstadoEtapa,
  EtapaConsultoria,
  EtapaJornada,
  EtapaPeso,
  EventoContrato,
  EventoHistorico,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
  ItemAtencao,
  ItemFicha,
  Modalidade,
  Notificacao,
  OpcaoRotulada,
  OrigemLead,
  ParcelaContrato,
  PassoProcesso,
  PesoInformado,
  PorteEstabelecimento,
  PrecoIngrediente,
  Prioridade,
  Processo,
  SituacaoCalculo,
  SituacaoCliente,
  SituacaoDocumento,
  SituacaoFicha,
  StatusAcao,
  StatusConsultoria,
  StatusContrato,
  StatusParcela,
  StatusTarefa,
  Tarefa,
  TipoAceite,
  TipoAcompanhamento,
  TipoAtencao,
  TipoDocumento,
  TipoEvento,
  TipoEventoContrato,
  TipoNotificacao,
  Transformacao,
} from "./tipos-operacao";

export { ACAO_DO_ESTADO_ITEM, ROTULO_ESTADO_ITEM, ROTULO_ETAPA_PESO } from "./tipos-operacao";

// --- Motor de custos --------------------------------------------------------

export {
  CASAS_CUSTO,
  CASAS_PERCENTUAL,
  CASAS_PESO,
  FRASE_DA_RECUSA,
  UNIDADES_DE_PESO,
  custoDaQuantidade,
  custoPorEtapa,
  derivarTransformacao,
  ehUnidadeDePeso,
  mesmaBase,
  precoUnitarioDaCompra,
  recusaDaCompra,
} from "./custos";

export type {
  CustoDeQuantidade,
  CustoPorEtapa,
  IndicadoresTransformacao,
  RecusaDeCompra,
  TransformacaoDerivada,
} from "./custos";

export {
  compararCustos,
  itensComPrecoDeHoje,
  lerQuantidade,
  pesarFicha,
  resolverItem,
  resumoDaFicha,
  somarFicha,
} from "./custos-ficha";

export type {
  ComparacaoDeCustos,
  ItemResolvido,
  PesoDaFicha,
  ResumoCustoFicha,
} from "./custos-ficha";

// --- A calculadora de rendimento -------------------------------------------
//
// `calcularRendimento` monta as LINHAS que a tela e a planilha mostram: a
// perda de cada etapa, o aproveitamento, o fator de correção medido e o custo
// efetivo final — com a conta que produziu cada número escrita ao lado. Ela
// não calcula nada novo; ordena e rotula o que `./custos` já calculava.

export { calcularRendimento, resumoDeRendimento } from "./rendimento";

export type { CalculoDeRendimento, EtapaDoFluxo, LinhaDeRendimento } from "./rendimento";

// --- O vocabulário de unidades do cadastro ---------------------------------
//
// `UNIDADES_COMUNS` é a lista que os formulários oferecem, e ela é mais larga
// que `UNIDADES_DE_PESO`: cabem "maço", "cx" e "dúzia" porque é assim que ela
// compra. Somar e dividir continua sendo só com as quatro de peso.

export { UNIDADES_COMUNS } from "./unidades";

export type { UnidadeComum } from "./unidades";

// --- Leitura e escrita de número -------------------------------------------

export {
  arredondarParaExibir,
  dataDoCampo,
  dataParaCampo,
  leituraDeVolta,
  lerNumero,
  lerPeso,
  numero,
  numeroFixo,
  paraCampo,
  textoParaCampo,
  variacaoPercentual,
} from "./numeros";

// --- Indicadores comerciais (paramétricos, nunca fixos) --------------------
//
// Nenhuma regra comercial da metodologia está fixada aqui: margem de
// segurança, CMV alvo e markup alvo chegam por parâmetro, e a ausência de
// qualquer um deles devolve `null` em vez de um valor padrão.

export {
  PARAMETROS_VAZIOS,
  custoComMargem,
  indicadoresDeVenda,
  markupEmTexto,
  pendenciasComerciais,
  precoQueOAlvoExige,
  precosDosDoisAlvos,
  quadroComercial,
} from "./indicadores-comerciais";

export type {
  IndicadoresDeVenda,
  ParametrosComerciais,
  PrecoSugerido,
  QuadroComercial,
} from "./indicadores-comerciais";

// --- A precificação reunida -------------------------------------------------
//
// A montagem que uma TELA precisa: uma linha por prato, com o custo da ficha
// e o quadro comercial juntos, mais o estado de cada ausência.
//
// Não há fórmula nova aqui — `estadoComercial` relê a mesma relação que
// `indicadoresDeVenda` já calcula, e a soma continua vindo de `custos-ficha`.
// O que existe é a camada que impede a conta de ser reescrita dentro de um
// componente React, onde não haveria script capaz de conferi-la.

export {
  ACAO_DA_PENDENCIA,
  ROTULO_ESTADO_COMERCIAL,
  TOM_ESTADO_COMERCIAL,
  estadoComercial,
  linhaDePrecificacao,
  resumirPrecificacao,
  somarCustos,
  somarPrecos,
  temPreco,
} from "./precificacao";

export type {
  EstadoComercial,
  LinhaPrecificacao,
  PendenciaDaLinha,
  ResumoPrecificacao,
} from "./precificacao";

// --- O cardápio, montado sobre as fichas ------------------------------------
//
// O cardápio acrescenta APRESENTAÇÃO — seção, ordem, nome de anúncio — e não
// um segundo cadastro do prato: cada item aponta para uma ficha que já existe,
// e custo, preço e CMV saem do mesmo `linhaDePrecificacao`. O que este módulo
// traz de próprio é a conferência: item sem ficha, ficha de outro cliente,
// item numa seção que não existe.

export {
  ACAO_DA_PENDENCIA_DO_CARDAPIO,
  ROTULO_SITUACAO_CARDAPIO,
  cardapiosVisiveis,
  contarItens,
  montarLinhasDoCardapio,
  pratosDistintos,
  resumirCardapio,
  somarPrecosDoCardapio,
} from "./cardapios";

export type {
  Cardapio,
  CategoriaDoCardapio,
  EntradaDoCardapio,
  ItemDeCardapio,
  LinhaDoCardapio,
  OcorrenciaDoCardapio,
  PendenciaDoCardapio,
  ResumoDoCardapio,
  SituacaoCardapio,
} from "./cardapios";

// --- A equipe que executa na cozinha do cliente -----------------------------
//
// Nomes de execução, função, turno e treinamento — e nada de folha, salário,
// férias, benefício ou ponto. A ausência desses campos é a garantia de que o
// módulo não vira RH; ela está escrita em `equipe.ts`.

export {
  ORDEM_FUNCAO,
  ROTULO_FUNCAO,
  ROTULO_SITUACAO_PESSOA,
  ROTULO_TURNO,
  casarPessoas,
  coberturaDeTreinamento,
  nomesRepetidos,
  nomesSemCadastro,
  normalizarNome,
  ordenarEquipe,
  pessoasAtivas,
  pessoasDoCliente,
  responsaveisDoProcesso,
  responsaveisDosProcessos,
  resumirEquipe,
} from "./equipe";

export type {
  Casamento,
  CoberturaDeTreinamento,
  FuncaoNaCozinha,
  Pessoa,
  ResumoDaEquipe,
  ResponsavelLido,
  SituacaoPessoa,
  Treinamento,
  Turno,
} from "./equipe";

// --- A biblioteca de material de apoio --------------------------------------
//
// O REGISTRO de um material que já existe — título, tipo, para que serve,
// a quem vale e ONDE ele está. Não há campo de arquivo, e a ausência é o
// ponto: o sistema endereça o material, não o hospeda. Ver `biblioteca.ts`.

export {
  ORDEM_MATERIAL,
  ROTA_ORIGEM_DO_MATERIAL,
  ROTULO_MATERIAL,
  ROTULO_ORIGEM_DO_MATERIAL,
  buscarMateriais,
  materiaisDoCliente,
  materiaisGerais,
  ordenarBiblioteca,
  resumirBiblioteca,
  serveAoCliente,
} from "./biblioteca";

export type {
  Material,
  OrigemDoMaterial,
  ResumoDaBiblioteca,
  TipoDeMaterial,
  TipoDeOrigem,
} from "./biblioteca";

// --- A camada de edição da sessão ------------------------------------------
//
// Enquanto o banco não está conectado, é aqui que uma alteração sobrevive à
// troca de tela. O que estas funções gravam não é persistência — é o que faz
// a edição ser verificável agora e trocável por repositório depois.

export {
  acervoDaBiblioteca,
  acervoDaEquipe,
  acervoDeCardapios,
  acrescentarSecao,
  adicionarItem,
  alterarItemDoCardapio,
  arquivarCardapio,
  arquivarIngrediente,
  cardapioArquivado,
  cardapioDaSessaoNova,
  cardapioFoiExcluido,
  criarCardapio,
  criarMaterial,
  criarPessoa,
  definirSituacaoDoCardapio,
  desarquivarCardapio,
  desarquivarIngrediente,
  duplicarCardapio,
  ehInsumoDaSessao,
  excluirCardapio,
  excluirFicha,
  excluirIngrediente,
  excluirMaterial,
  fichaFoiExcluida,
  fichasVisiveis,
  idsDeCopia,
  ingredienteArquivado,
  ingredienteDaSessao,
  insumoFoiExcluido,
  insumoForaDaBiblioteca,
  limparDemonstracao,
  marcarRetornoDaPessoa,
  marcarSaidaDaPessoa,
  materialDaSessao,
  materialFoiExcluido,
  moverItem,
  moverSecao,
  pessoaDaSessao,
  registrarTreinamento,
  removerItem,
  removerSecao,
  removerTreinamento,
  renomearSecao,
  salvarCadastroDoIngrediente,
  salvarCardapio,
  salvarMaterial,
  salvarPessoa,
  salvarTransformacao,
  secoesDoCardapio,
  semArquivados,
  semExcluidos,
  temAlteracoes,
  transformacaoDaSessao,
  treinamentosDaEquipe,
  trocarItemDeSecao,
} from "./demonstracao";

export type { SituacaoEditavel } from "./demonstracao";

export type {
  FichaDoIngrediente,
  IngredienteEmUso,
  LinhaIngredienteDoCliente,
} from "./repositorio-operacao";

export type {
  LinhaCliente,
  LinhaConsultoria,
  LinhaContrato,
  RepositorioOperacao,
  RepositorioOperacaoEscrita,
  ResumoOperacao,
} from "./repositorio-operacao";

export { agruparResultados, buscar, normalizar, ORDEM_TIPOS, ROTULO_TIPO_BUSCA } from "./busca";

export type { ItemBusca, ResultadoBusca, TipoResultadoBusca } from "./busca";

export {
  agruparTarefas,
  contarAcoes,
  contarFichas,
  contarParcelas,
  derivarAtencao,
  derivarNotificacoes,
  diasEntre,
  etapasConcluidas,
  inicioDoDia,
  mesmoDia,
  mensalidadeDoContrato,
  ordenarPorPrazo,
  passosSemTempo,
  proximaParcela,
  proximosEncontros,
  rotuloAtencao,
  rotuloParcela,
  somaDosTemposDeclarados,
  somarPagas,
  somarParcelas,
  somarPendentes,
  terminou,
  ultimoAcompanhamentoPorCliente,
  ORDEM_STATUS_CONTRATO,
  ROTULO_ESTADO_DOCUMENTO,
  ROTULO_ETAPA,
  ROTULO_EVENTO_CONTRATO,
  ROTULO_MODALIDADE,
  ROTULO_PRIORIDADE,
  ROTULO_SITUACAO_CLIENTE,
  ROTULO_SITUACAO_DOCUMENTO,
  ROTULO_SITUACAO_FICHA,
  ROTULO_STATUS_ACAO,
  ROTULO_STATUS_CONSULTORIA,
  ROTULO_STATUS_CONTRATO,
  ROTULO_STATUS_PARCELA,
  ROTULO_STATUS_TAREFA,
  ROTULO_TIPO_ACEITE,
  ROTULO_TIPO_ACOMPANHAMENTO,
  ROTULO_TIPO_DOCUMENTO,
  ROTULO_TIPO_NEGOCIO,
  STATUS_CONTRATO_ABERTOS,
  TOM_PRIORIDADE,
  TOM_SITUACAO_CLIENTE,
  TOM_SITUACAO_DOCUMENTO,
  TOM_SITUACAO_FICHA,
  TOM_STATUS_CONSULTORIA,
  TOM_STATUS_CONTRATO,
  TOM_STATUS_PARCELA,
} from "./derivacoes-operacao";

export type { FontesAtencao, GavetasTarefas, TomSituacao } from "./derivacoes-operacao";
