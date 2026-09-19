"use client";

import { useState } from "react";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, Secao } from "@/components/ui/superficie";
import { Botao } from "@/components/ui/botao";
import { Gaveta } from "@/components/ui/gaveta";
import { Dado, ListaDados } from "@/components/ui/dados";
import type { ReferenciaDocumento } from "@/lib/contratos/documento";
import { dataCurta } from "@/lib/dados";
import {
  ROTULO_ESTADO_DOCUMENTO,
  ROTULO_EVENTO_CONTRATO,
  ROTULO_TIPO_ACEITE,
} from "@/lib/dados";
import type { Aceite, EstadoDocumentoContrato, EventoContrato } from "@/lib/dados";

/**
 * DOCUMENTO DO CONTRATO — a área do arquivo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA ÁREA EXISTE SEPARADA DO RESTO DO CONTRATO                │
 * │                                                                      │
 * │ "Em que ponto do trabalho estamos" e "o papel foi assinado" são duas   │
 * │ perguntas diferentes, e por isso são dois campos no domínio           │
 * │ (`status` e `estadoDocumento`) e dois blocos na tela.                  │
 * │                                                                      │
 * │ Um contrato assinado pode ainda não ter começado — é o caso do        │
 * │ Sabor da Serra, que começa depois da reforma do salão. E um contrato   │
 * │ em andamento pode ter o documento assinado desde o primeiro dia. Se    │
 * │ os dois fossem um campo só, um dos dois estados ficaria sem nome.      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO SE COPIOU O PROJETO DE CONTRATO EXTERNO                   │
 * │                                                                      │
 * │ Existe um projeto separado que gera o documento do contrato. Ele não   │
 * │ foi copiado para cá, e isso é decisão, não esquecimento: são dois      │
 * │ produtos com ritmos diferentes, e colar o código de um dentro do outro │
 * │ faria os dois ficarem presos um ao outro.                              │
 * │                                                                      │
 * │ O que esta área faz é o que cabe ao SISTEMA: dizer em que ponto o      │
 * │ documento está, mostrar onde ele vai morar e registrar quem aceitou.   │
 * │ O endereço do arquivo NÃO está escrito aqui — ele vem de               │
 * │ `@/lib/contratos/documento`, num lugar só, para não virar quatro       │
 * │ endereços divergentes em quatro telas.                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ OS TRÊS BOTÕES, E POR QUE NENHUM DELES MENTE                          │
 * │                                                                      │
 * │ "Abrir contrato", "Copiar link" e "Imprimir" só aparecem habilitados   │
 * │ quando existe endereço. Sem ele, o botão fica desabilitado COM A       │
 * │ RAZÃO ESCRITA AO LADO — não um botão que promete abrir e devolve 404.  │
 * │                                                                      │
 * │ O "Copiar link" é o único que faz algo de verdade hoje: ele copia o    │
 * │ endereço do documento do próprio sistema. Quando a ligação com o       │
 * │ gerador existir, ele passa a copiar o endereço do arquivo — e o botão  │
 * │ não muda de lugar nem de nome.                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const TOM_ESTADO: Record<EstadoDocumentoContrato, "neutro" | "dourado" | "verde"> = {
  NAO_ENVIADO: "neutro",
  AGUARDANDO_ACEITE: "dourado",
  ASSINADO: "verde",
};

export function AreaDocumento({
  estado,
  aceite,
  numero,
  referencia,
  eventos,
}: {
  estado: EstadoDocumentoContrato;
  aceite: Aceite | null;
  numero: string;
  /** Resolvida no servidor por `resolverDocumento()`. Ver `@/lib/contratos`. */
  referencia: ReferenciaDocumento;
  /** O histórico do contrato, já ordenado do mais recente. */
  eventos: readonly EventoContrato[];
}) {
  const [gaveta, setGaveta] = useState<"nenhuma" | "visualizar" | "aceite" | "link">("nenhuma");
  const [linkCopiado, definirLinkCopiado] = useState(false);

  const podeAbrir = referencia.url !== null;

  /**
   * Os eventos que tocaram no DOCUMENTO.
   *
   * A lista de tipos é escrita aqui, e não derivada de "tudo menos
   * pagamento": um tipo novo de evento — "reenviado", por exemplo — precisa
   * ser POSICIONADO de propósito. Derivado por exclusão, ele cairia nesta
   * lista por acidente e o histórico do documento passaria a mostrar coisas
   * que não são do documento.
   */
  const TIPOS_DE_DOCUMENTO: readonly EventoContrato["tipo"][] = [
    "criado",
    "enviado",
    "visualizado",
    "aceito",
  ];
  const eventosDoDocumento = eventos.filter((e) => TIPOS_DE_DOCUMENTO.includes(e.tipo));

  /**
   * O link que se copia hoje é o do próprio contrato no sistema.
   *
   * Não é o link do PDF — esse ainda não existe. É honesto: o que se copia
   * é um endereço que abre ESTE contrato, e a tela diz isso. Copiar uma URL
   * inventada do arquivo seria pior, porque colada no WhatsApp de um cliente
   * viraria um 404 da parte da Érika.
   */
  const linkDoContrato = `/contratos/${numero}`;

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(
        typeof window === "undefined" ? linkDoContrato : `${window.location.origin}${linkDoContrato}`
      );
      definirLinkCopiado(true);
    } catch {
      /*
        A área de transferência pode ser negada pelo navegador — sem HTTPS,
        ou sem permissão. Nesse caso a gaveta mostra o endereço em texto
        para ela copiar à mão, em vez de um botão que não faz nada.
      */
      definirLinkCopiado(false);
    }
    setGaveta("link");
  }

  return (
    <>
      <Secao
        rotulo="Documento do contrato"
        titulo="O contrato em si"
        descricao="O arquivo, a versão do documento e o registro do aceite. O sistema guarda o documento e anota quem aceitou — ele não gera o PDF nem assina por ninguém."
        acoes={<Etiqueta tom={TOM_ESTADO[estado]}>{ROTULO_ESTADO_DOCUMENTO[estado]}</Etiqueta>}
      >
        <ListaDados colunas={3}>
          <Dado rotulo="Versão do documento">{referencia.versao}</Dado>
          <Dado rotulo="Estado">{ROTULO_ESTADO_DOCUMENTO[estado]}</Dado>
          <Dado rotulo="Arquivo">
            {referencia.arquivo ?? <span className="text-[var(--tinta-fraca)]">Nenhum anexado</span>}
          </Dado>
          <Dado rotulo="Contratante">{referencia.contratante}</Dado>
          <Dado rotulo="Enviado ao cliente">
            {referencia.enviadoEm ? (
              dataCurta(referencia.enviadoEm)
            ) : (
              <span className="text-[var(--tinta-fraca)]">ainda não enviado</span>
            )}
          </Dado>
          <Dado rotulo="Aceite">
            {referencia.aceitoEm ? (
              `${dataCurta(referencia.aceitoEm)}${referencia.aceitoPor ? ` · ${referencia.aceitoPor}` : ""}`
            ) : (
              <span className="text-[var(--tinta-fraca)]">nenhum registrado</span>
            )}
          </Dado>
          {aceite ? (
            <Dado rotulo="Como foi o aceite" largo>
              {ROTULO_TIPO_ACEITE[aceite.tipo]}
            </Dado>
          ) : null}
        </ListaDados>

        <div className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-[var(--linha)] pt-5">
          <Botao
            variante="primario"
            tamanho="sm"
            onClick={() => setGaveta("visualizar")}
            aria-haspopup="dialog"
            // Desabilitado, mas com a razão logo abaixo — e o motivo muda
            // conforme o estado, porque "não enviado" e "sem ligação com o
            // gerador" pedem coisas diferentes dela.
            disabled={!podeAbrir}
          >
            Abrir contrato
          </Botao>
          <Botao
            variante="secundario"
            tamanho="sm"
            onClick={copiarLink}
            aria-haspopup="dialog"
          >
            Copiar link
          </Botao>
          <Botao
            variante="linha"
            tamanho="sm"
            onClick={() => setGaveta("visualizar")}
            aria-haspopup="dialog"
            disabled={!podeAbrir}
          >
            Imprimir
          </Botao>
          {estado !== "ASSINADO" ? (
            <Botao
              variante="secundario"
              tamanho="sm"
              onClick={() => setGaveta("aceite")}
              aria-haspopup="dialog"
            >
              Registrar aceite
            </Botao>
          ) : null}
        </div>

        {!podeAbrir ? (
          <p className="mt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
            {estado === "NAO_ENVIADO"
              ? "“Abrir contrato” e “Imprimir” ficam desabilitados enquanto não houver documento gerado para este contrato."
              : "“Abrir contrato” e “Imprimir” ficam desabilitados enquanto a ligação com o projeto que gera o PDF não existir."}
          </p>
        ) : null}

        {/*
          O aviso fica FORA da gaveta, na própria seção. Quem passa o olho
          pela tela sem clicar em nada precisa ver que o documento ainda não
          é real — não só quem abre a gaveta.
        */}
        <Aviso tom="atencao" className="mt-5" titulo="O documento ainda não é gerado aqui">
          <p>
            Quem gera o contrato é um projeto separado, e a ligação entre os dois ainda não foi
            feita. O que este sistema faz hoje é mostrar o estado do documento, guardar a versão e
            anotar quem aceitou — o arquivo em si ainda não passa por aqui.
          </p>
        </Aviso>

        {/*
          ── HISTÓRICO DO DOCUMENTO ────────────────────────────────────────

          Só os eventos que mexeram no DOCUMENTO — criado, enviado,
          visualizado, aceito. O histórico completo, com pagamento e projeto,
          fica na seção própria mais abaixo.

          A separação não é decorativa: quem abre a área do documento quer
          saber "esse papel já foi assinado?", e a resposta não deve vir
          misturada com o registro de uma parcela paga.
        */}
        <div className="mt-5 border-t border-[var(--linha)] pt-5">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            Histórico do documento
          </p>
          {eventosDoDocumento.length === 0 ? (
            <p className="mt-3 text-[0.875rem] text-[var(--tinta-suave)]">
              Nada aconteceu com este documento ainda — nenhum envio, nenhuma visualização, nenhum
              aceite.
            </p>
          ) : (
            <ol className="mt-3 space-y-2.5">
              {eventosDoDocumento.map((e) => (
                <li key={e.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="tabular w-[5.5rem] shrink-0 text-[0.75rem] text-[var(--tinta-fraca)]">
                    {dataCurta(e.em)}
                  </span>
                  <span className="text-[0.875rem] text-tinta">
                    {ROTULO_EVENTO_CONTRATO[e.tipo]}
                  </span>
                  <span className="text-[0.8125rem] text-[var(--tinta-suave)]">· {e.por}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </Secao>

      {/* ── Visão do documento / impressão ──────────────────────────────── */}
      <Gaveta
        aberta={gaveta === "visualizar"}
        aoFechar={() => setGaveta("nenhuma")}
        titulo={podeAbrir ? `Contrato ${numero}` : "Nenhum documento ainda"}
        descricao="A área onde o arquivo do contrato vai viver."
        acoes={
          <Botao variante="primario" tamanho="sm" onClick={() => setGaveta("nenhuma")}>
            Entendi — fechar
          </Botao>
        }
      >
        <div className="space-y-5">
          <Aviso tom="atencao" titulo="Nada para abrir aqui ainda">
            <p>
              {estado === "NAO_ENVIADO"
                ? "Nenhum documento foi anexado a este contrato. Quando o PDF for gerado e enviado, ele fica guardado nesta área."
                : "Este contrato tem documento associado no cenário de exemplo, mas o arquivo não existe de verdade — não há PDF para abrir, imprimir ou baixar."}
            </p>
          </Aviso>

          <ListaDados colunas={1}>
            <Dado rotulo="Versão">{referencia.versao}</Dado>
            <Dado rotulo="Estado">{ROTULO_ESTADO_DOCUMENTO[estado]}</Dado>
            <Dado rotulo="Arquivo">{referencia.arquivo ?? "nenhum"}</Dado>
            <Dado rotulo="Endereço">
              {referencia.url ?? "ainda não existe — o arquivo mora no projeto de contrato"}
            </Dado>
          </ListaDados>

          <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
            <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              <span className="font-medium text-tinta">Como isso vai funcionar.</span> O documento é
              gerado pelo projeto de contrato, anexado ao registro aqui, e o sistema passa a mostrar
              em que ponto o aceite está. A assinatura com validade legal depende de escolher um
              serviço — e essa decisão é sua.
            </p>
          </div>
        </div>
      </Gaveta>

      {/* ── Copiar link ────────────────────────────────────────────────── */}
      <Gaveta
        aberta={gaveta === "link"}
        aoFechar={() => {
          setGaveta("nenhuma");
          definirLinkCopiado(false);
        }}
        titulo="Link do contrato"
        descricao="O endereço que abre este contrato dentro do sistema."
        acoes={
          <Botao
            variante="primario"
            tamanho="sm"
            onClick={() => {
              setGaveta("nenhuma");
              definirLinkCopiado(false);
            }}
          >
            Entendi — fechar
          </Botao>
        }
      >
        <div className="space-y-5">
          <Aviso tom={linkCopiado ? "sucesso" : "atencao"} titulo={linkCopiado ? "Endereço copiado" : "Não foi possível copiar"}>
            <p>
              {linkCopiado
                ? "O endereço está na área de transferência."
                : "O navegador não liberou a área de transferência. Copie o endereço abaixo à mão."}
            </p>
          </Aviso>

          <div className="rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3.5 py-3">
            <code className="block text-[0.8125rem] break-all text-tinta select-all">
              {linkDoContrato}
            </code>
          </div>

          <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
            <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              <span className="font-medium text-tinta">Este é o link do contrato no sistema</span>,
              não o link do arquivo. O PDF mora no projeto de contrato, e a ligação entre os dois
              ainda não existe — então não há o que copiar do arquivo. Quando houver, o botão passa
              a copiar o endereço dele, sem mudar de lugar.
            </p>
          </div>
        </div>
      </Gaveta>

      {/* ── Registrar aceite ───────────────────────────────────────────── */}
      <Gaveta
        aberta={gaveta === "aceite"}
        aoFechar={() => setGaveta("nenhuma")}
        titulo="Registrar aceite"
        descricao="Anotar que o cliente aceitou, e como."
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={() => setGaveta("nenhuma")}>
              Cancelar
            </Botao>
            <Botao variante="primario" tamanho="sm" onClick={() => setGaveta("nenhuma")}>
              Entendi — fechar
            </Botao>
          </>
        }
      >
        <div className="space-y-5">
          <Aviso tom="atencao" titulo="Este registro não é salvo">
            <p>
              O sistema ainda não tem banco conectado. O que você preencher aqui mostra como o fluxo
              funcionaria — ao recarregar a página, o contrato volta ao estado anterior.
            </p>
          </Aviso>

          <div>
            <label
              htmlFor="aceite-por"
              className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase"
            >
              Quem aceitou
            </label>
            <input
              id="aceite-por"
              type="text"
              placeholder="Nome de quem aceitou pelo cliente"
              className="mt-1.5 h-10 w-full rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.9375rem] text-tinta placeholder:text-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="aceite-tipo"
              className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase"
            >
              Como foi o aceite
            </label>
            <select
              id="aceite-tipo"
              className="mt-1.5 h-10 w-full cursor-pointer rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.9375rem] text-tinta focus:border-oliva focus:bg-white focus:outline-none"
            >
              {(["ASSINATURA_DIGITAL", "ASSINATURA_MANUSCRITA", "ACEITE_POR_EMAIL"] as const).map(
                (t) => (
                  <option key={t} value={t}>
                    {ROTULO_TIPO_ACEITE[t]}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="aceite-data"
              className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase"
            >
              Data do aceite
            </label>
            <input
              id="aceite-data"
              type="date"
              className="mt-1.5 h-10 w-full rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.9375rem] text-tinta focus:border-oliva focus:bg-white focus:outline-none"
            />
          </div>

          <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
            <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              <span className="font-medium text-tinta">Isto é um registro, não uma assinatura.</span>{" "}
              O sistema guarda a data e o nome de quem aceitou, do jeito que ele é anotado hoje no
              papel. Assinatura com validade jurídica é outro assunto, e depende de contratar um
              serviço de assinatura.
            </p>
          </div>
        </div>
      </Gaveta>
    </>
  );
}
