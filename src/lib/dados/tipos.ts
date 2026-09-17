/**
 * TIPOS DA ENTRADA — lead, diagnóstico, resposta e observação.
 *
 * Estes tipos são o CONTRATO. Eles descrevem o formato que o banco terá
 * quando a persistência entrar, e é por isso que a Fase 2 já os escreve
 * agora, mesmo servindo dados de demonstração: quando o Prisma chegar, o
 * código das telas não precisa mudar — só a implementação do repositório.
 *
 * O QUE ESTÁ FINO DE PROPÓSITO
 *
 * A Seção 17 do relatório da Fase 0 deixou seis decisões em aberto que
 * tocam diretamente esta camada. Nenhuma delas foi respondida, então:
 *
 *   · NÃO existe aqui nenhum campo `score` calculado. O campo
 *     `scoreObservacao` guarda um TEXTO de leitura — o que a consultora
 *     escreveu sobre o bloco — não uma nota. Ver `perguntas.ts`.
 *   · A faixa de faturamento é um enum de FAIXAS (ponto 12), nunca um
 *     número exato: converter texto livre em valor seria decidir sozinho
 *     quais faixas existem.
 *   · Não existe campo de peso por resposta (ponto 11).
 *
 * Nada aqui pode ganhar um número que o negócio ainda não definiu.
 */

import type { BlocoChave } from "./perguntas";

// ---------------------------------------------------------------------------
// Enums espelhados
// ---------------------------------------------------------------------------
// A Seção 11.3 do relatório pediu "14 enums espelhando as opções exatas do
// formulário atual, para que nenhuma resposta se perca na migração do
// Google Forms". Eles vivem aqui e não no schema do Prisma porque a Fase 2
// ainda não grava — mas os valores já são os definitivos.

export type LeadStatus =
  | "NOVO"
  | "EM_ANALISE"
  | "CONTATADO"
  | "QUENTE"
  | "MORNO"
  | "FRIO"
  | "CONVERTIDO"
  | "ARQUIVADO";

/**
 * De onde o lead veio.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE "WHATSAPP" ESTÁ NA LISTA SEM NADA ESCREVER NELE              │
 * │                                                                      │
 * │ O tipo é o CONTRATO, e ele já existe antes do primeiro dado. O        │
 * │ WhatsApp é o canal por onde a maior parte dos contatos dela chega     │
 * │ hoje — uma mensagem que ela mesma cadastraria à mão. Deixar o valor   │
 * │ fora do tipo significaria, no dia em que ela quiser marcar isso, uma   │
 * │ migração de enum para acrescentar uma palavra.                         │
 * │                                                                      │
 * │ NÃO EXISTE integração com WhatsApp. Nem API, nem leitura de conversa, │
 * │ nem número no código. É só uma etiqueta que a consultora escolhe ao    │
 * │ cadastrar. A Cloud API oficial da Meta é assunto de outra fase.       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type OrigemLead =
  | "DIAGNOSTICO_PUBLICO"
  | "WHATSAPP"
  | "INDICACAO"
  | "INSTAGRAM"
  | "MANUAL";

/** O que cada origem significa, para a tela explicar sem abreviar. */
export type OrigemLeadDetalhe = {
  /** Se o lead chegou por um caminho que o sistema registra sozinho. */
  automatica: boolean;
  /** De onde veio, em uma frase. */
  como: string;
};

export type TipoServico =
  | "BUFFET"
  | "A_LA_CARTE"
  | "BUFFET_E_A_LA_CARTE"
  | "DELIVERY"
  | "OUTRO";

/** Faixas, não valores (ponto 12 ainda em aberto). */
export type FaturamentoFaixa =
  | "ATE_10MIL"
  | "DE_10_A_30MIL"
  | "DE_30_A_60MIL"
  | "DE_60_A_120MIL"
  | "ACIMA_120MIL"
  | "PREFIRO_NAO_INFORMAR";

export type SimMaisOuMenosNao = "SIM" | "MAIS_OU_MENOS" | "NAO";
export type SimAsVezesNao = "SIM" | "AS_VEZES" | "NAO";
export type SimNao = "SIM" | "NAO";

export type CozinhaPlanejada = "PLANEJADA" | "ADAPTADA" | "NAO_SEI_DIZER";
export type PerdeTempoMovimentacao = "SIM_BASTANTE" | "AS_VEZES" | "NAO";
export type AguentaVolumeDobrado = "SIM_BASTANTE" | "COM_DIFICULDADE" | "NAO";

export type UsaFichaTecnica = "SIM_TODOS" | "EM_ALGUNS" | "NAO_USO";

export type ComoDefinePreco =
  | "BASEADO_NO_CUSTO"
  | "BASEADO_NA_CONCORRENCIA"
  | "NO_FEELING"
  | "NAO_SEI_EXATAMENTE";

export type FaltaInsumo = "SIM_COM_FREQUENCIA" | "AS_VEZES" | "NUNCA";
export type ControleEstoque = "SIM" | "PARCIAL" | "NAO";

export type FrequenciaCompras =
  | "DIARIAMENTE"
  | "DUAS_A_TRES_VEZES_SEMANA"
  | "SEM_PADRAO_DEFINIDO";

export type DependenciaDono = "SIM" | "PARCIALMENTE" | "NAO";

export type TurnoTrabalho =
  | "SOMENTE_ALMOCO"
  | "SOMENTE_JANTAR"
  | "ALMOCO_E_JANTAR"
  | "CAFE_ALMOCO_LANCHE_JANTAR"
  | "APENAS_DELIVERY";

export type NumeroFuncionarios =
  | "UM_A_CINCO"
  | "CINCO_A_DEZ"
  | "DONO_E_MAIS_UM"
  | "APENAS_DONO"
  | "OUTRO";

export type PadraoOuImproviso = "PADRAO_DEFINIDO" | "UM_POUCO_DOS_DOIS" | "MAIS_IMPROVISO";

export type PretendeMelhorar30Dias = "SIM" | "TALVEZ" | "NAO";

/** Uma resposta do formulário, já normalizada. */
export type ValorResposta =
  | { tipo: "texto"; valor: string }
  | { tipo: "selecao"; valor: string }
  | { tipo: "multipla"; valores: string[] }
  | { tipo: "vazio" };

// ---------------------------------------------------------------------------
// Diagnóstico
// ---------------------------------------------------------------------------

export type Resposta = {
  perguntaId: string;
  bloco: BlocoChave;
  valor: ValorResposta;
};

/**
 * Percepção interna sobre um bloco.
 *
 * NÃO é score. É uma leitura escrita que a consultora faz depois de ler as
 * respostas do bloco — porque o peso de cada resposta é decisão dela
 * (ponto 11, ainda em aberto) e um percentual calculado por suposição
 * seria um veredito falso sobre o negócio de alguém.
 *
 * Quando o ponto 11 for respondido, é este campo que o cálculo preenche.
 */
export type LeituraBloco = {
  bloco: BlocoChave;
  /** Frase curta de operação, escrita por gente. Ex.: "Sem ficha técnica em nenhum prato". */
  resumo: string;
  /** O que merece atenção nesse bloco. Pode ser vazio. */
  atencao: string[];
};

export type Diagnostico = {
  id: string;
  leadId: string;
  respondidoEm: Date;
  respostas: Resposta[];
  /** Preenchido quando a consultora já leu e escreveu. Vazio logo após o envio. */
  leitura: LeituraBloco[];
  /** A maior problema declarado — pergunta 25, repetido aqui para a fila. */
  maiorProblema: string;
  /** Intenção declarada nos próximos 30 dias — pergunta 29. */
  pretendeMelhorar: PretendeMelhorar30Dias;
};

// ---------------------------------------------------------------------------
// Observação interna
// ---------------------------------------------------------------------------
// A Seção 12.4 pediu histórico visível: quem mudou o quê e quando.
// A observação é a anotação de trabalho da consultora sobre o lead —
// distinta da resposta que o lead deu. Nunca sai do sistema.

export type Observacao = {
  id: string;
  leadId: string;
  /** Quem escreveu. Hoje sempre a consultora; o campo já existe para a Fase 9. */
  autor: string;
  texto: string;
  criadoEm: Date;
};

// ---------------------------------------------------------------------------
// Lead
// ---------------------------------------------------------------------------

export type Lead = {
  id: string;
  nomeContato: string;
  nomeFantasia: string;
  email: string;
  whatsapp: string;
  origem: OrigemLead;
  status: LeadStatus;
  criadoEm: Date;
  /** Próximo passo combinado, em texto livre. Vazio quando não há. */
  proximoPasso: string;
  /** Por que este lead merece atenção agora — texto, não nota. */
  sinal: string;
  /** Id do diagnóstico vinculado, quando existe. */
  diagnosticoId: string | null;
  /** Preenchido só quando o lead vira cliente (Fase 2 não converte ainda). */
  clienteId: string | null;
};

// ---------------------------------------------------------------------------
// Atividade recente
// ---------------------------------------------------------------------------
// Alimenta o bloco "Atividade recente" do dashboard. As fases seguintes
// acrescentam tipos novos (ficha, precificação, tarefa); a lista de tipos
// é extensível para não exigir reescrita.

export type TipoAtividade =
  | "diagnostico_respondido"
  | "lead_criado"
  | "lead_status_alterado"
  | "observacao_registrada"
  | "diagnostico_lido";

export type Atividade = {
  id: string;
  tipo: TipoAtividade;
  /** Descrição já em português, pronta para exibir. */
  descricao: string;
  leadId: string | null;
  quando: Date;
};

// ---------------------------------------------------------------------------
// Cliente
// ---------------------------------------------------------------------------
// Nesta fase existe apenas para o lead poder apontar para um cliente quando
// converter. O cadastro completo de cliente é escopo da Fase 2 original,
// mas depende dos pontos 1, 2, 3 e 10 — por isso aqui ele é só um esqueleto
// honesto, e /clientes continua dizendo o que falta.

export type Cliente = {
  id: string;
  nomeFantasia: string;
  nomeContato: string;
  criadoEm: Date;
};
