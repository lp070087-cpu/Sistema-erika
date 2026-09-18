/**
 * A REFERÊNCIA DO DOCUMENTO DO CONTRATO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO EXISTE, TENDO SÓ UM `null` DENTRO               │
 * │                                                                      │
 * │ O documento do contrato mora em OUTRO projeto. Este sistema não gera  │
 * │ o PDF, não assina e não guarda arquivo — ele mostra em que ponto o     │
 * │ documento está e onde ele vive.                                       │
 * │                                                                      │
 * │ A tentação seria escrever o endereço direto dentro do componente da    │
 * │ tela de contrato. Funciona uma vez. Depois alguém precisa do mesmo     │
 * │ endereço na lista, no painel e no e-mail — e passa a existir em        │
 * │ quatro lugares, com quatro jeitos de estar errado.                     │
 * │                                                                      │
 * │ Aqui o endereço é UM valor, declarado num lugar só, e a tela pergunta  │
 * │ à função. No dia em que a ligação com o projeto de contrato existir,  │
 * │ muda uma linha — e nenhum componente precisa saber que mudou.          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `null`, E NÃO UMA URL DE EXEMPLO                             │
 * │                                                                      │
 * │ Um endereço inventado aqui faria o botão "Abrir contrato" levar a um   │
 * │ 404 — e um botão que promete abrir e não abre é pior do que um botão   │
 * │ que diz que ainda não tem o que abrir.                                 │
 * │                                                                      │
 * │ Enquanto for `null`, a tela mostra a referência, explica onde o        │
 * │ arquivo vai morar e desabilita o que não pode funcionar. É o mesmo     │
 * │ princípio de `DIAGNOSTICO_PUBLICO_URL` em `configuracao-publica.ts`:   │
 * │ ausência declarada, não ausência disfarçada.                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { Contrato, EstadoDocumentoContrato } from "@/lib/dados";

/**
 * Onde o documento do contrato vive.
 *
 * `null` até a ligação com o projeto de contrato ser feita. Não é um TODO
 * esquecido: é o estado real do sistema, e a tela diz isso por escrito.
 */
export const DOCUMENTO_URL_BASE: string | null = null;

/**
 * A versão do modelo de documento usada hoje.
 *
 * Existe porque um contrato enviado em janeiro e outro enviado em junho
 * podem ter sido gerados por modelos diferentes, e quem lê o registro
 * precisa conseguir distinguir os dois. Enquanto o documento não é gerado
 * aqui, a versão é declarada — não deduzida da data de criação.
 */
export const DOCUMENTO_VERSAO_ATUAL = "v1";

/**
 * O que a tela de contrato precisa saber sobre o documento.
 *
 * Os quatro campos que o briefing pediu — `documentoUrl`, `documentoVersao`,
 * `documentoStatus` e `aceitoEm` — estão aqui com nomes de domínio, e não
 * espalhados como props soltas. Assim, no dia em que o documento passar a
 * ser gravado no banco, é este tipo que ganha campos, e não cada tela.
 */
export type ReferenciaDocumento = {
  /** Onde o arquivo está. `null` quando ainda não há ligação com o gerador. */
  url: string | null;
  /** Qual versão do modelo gerou este documento. */
  versao: string;
  /** Em que ponto o documento está. Espelha `estadoDocumento` do contrato. */
  status: EstadoDocumentoContrato;
  /** Nome do arquivo, quando existe. `null` quando nada foi anexado. */
  arquivo: string | null;
  /** Quando o documento foi enviado ao cliente. */
  enviadoEm: Date | null;
  /** Quando o cliente aceitou. */
  aceitoEm: Date | null;
  /** Quem aceitou, pelo lado do cliente. */
  aceitoPor: string | null;
  /** Quem contrata, como o documento nomeia. */
  contratante: string;
};

/**
 * Monta a referência do documento a partir do contrato.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A DATA DE ENVIO É DERIVADA DO HISTÓRICO                     │
 * │                                                                      │
 * │ O contrato não tem um campo `enviadoEm`. Ele tem uma LISTA de eventos │
 * │ — e "enviado" é um deles, com data. Guardar `enviadoEm` como campo     │
 * │ ao lado criaria duas fontes para o mesmo fato, e no dia em que o       │
 * │ evento fosse registrado sem o campo (ou o contrário), as duas          │
 * │ discordariam sem que ninguém soubesse qual está certa.                │
 * │                                                                      │
 * │ O aceite é a exceção: ele TEM campo próprio porque carrega mais que    │
 * │ uma data — carrega como o aceite aconteceu.                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function resolverDocumento(
  contrato: Contrato,
  contratante: string
): ReferenciaDocumento {
  const enviado = contrato.eventos
    .filter((e) => e.tipo === "enviado")
    .sort((a, b) => b.em.getTime() - a.em.getTime())[0];

  const temDocumento = contrato.estadoDocumento !== "NAO_ENVIADO";

  return {
    url: temDocumento ? DOCUMENTO_URL_BASE : null,
    versao: DOCUMENTO_VERSAO_ATUAL,
    status: contrato.estadoDocumento,
    arquivo: temDocumento ? `contrato-${contrato.numero}.pdf` : null,
    enviadoEm: enviado ? enviado.em : null,
    aceitoEm: contrato.aceite ? contrato.aceite.em : null,
    aceitoPor: contrato.aceite ? contrato.aceite.por : null,
    contratante,
  };
}

/**
 * O que a tela deve dizer sobre o link, calculado num lugar só.
 *
 * Mesmo padrão de `estadoDoDiagnostico()`: uma frase, decidida uma vez. Se
 * cada botão decidisse o próprio texto, o botão de abrir e o de copiar link
 * diriam coisas diferentes sobre o mesmo estado.
 */
export function estadoDoLink(
  referencia: ReferenciaDocumento
):
  | { disponivel: true; url: string }
  | { disponivel: false; motivo: string; acao: string } {
  if (referencia.status === "NAO_ENVIADO") {
    return {
      disponivel: false,
      motivo:
        "Nenhum documento foi gerado para este contrato ainda. O PDF é produzido pelo projeto de contrato e anexado aqui.",
      acao: "Enviar ao cliente",
    };
  }

  if (referencia.url) return { disponivel: true, url: referencia.url };

  return {
    disponivel: false,
    motivo:
      "Este contrato tem documento no registro, mas a ligação com o projeto que gera o PDF ainda não foi feita. Não há arquivo para abrir, copiar ou imprimir.",
    acao: "Registrar aceite",
  };
}
