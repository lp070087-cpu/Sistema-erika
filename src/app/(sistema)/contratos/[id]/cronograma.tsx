"use client";

import { useState } from "react";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso } from "@/components/ui/superficie";
import { Botao } from "@/components/ui/botao";
import { Gaveta } from "@/components/ui/gaveta";
import { Dado, ListaDados } from "@/components/ui/dados";
import { cn } from "@/lib/utils/cn";
import {
  ROTULO_STATUS_PARCELA,
  TOM_STATUS_PARCELA,
  dataCurta,
  rotuloParcela,
  valorEmReais,
} from "@/lib/dados";
import type { ParcelaContrato, StatusParcela } from "@/lib/dados";

/**
 * CRONOGRAMA DE PAGAMENTOS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UMA LISTA E NÃO QUATRO CARTÕES                         │
 * │                                                                      │
 * │ A primeira versão desta tela desenhava as parcelas em grade de quatro │
 * │ colunas — porque o cenário de demonstração tinha quatro. Isso teria    │
 * │ ensinado, sem escrever em lugar nenhum, que contrato tem quatro        │
 * │ parcelas.                                                              │
 * │                                                                      │
 * │ O briefing foi direto: "O sistema precisa aceitar N parcelas." Uma     │
 * │ lista vertical aceita 1, 2, 4, 12 sem mudar uma linha de CSS, e a       │
 * │ ordem lê-se de cima para baixo, que é como um cronograma se lê.        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O NÚMERO DA PARCELA É POSIÇÃO, NÃO IDENTIDADE                         │
 * │                                                                      │
 * │ `rotuloParcela(parcela.numero)` monta "2ª parcela" a partir do         │
 * │ campo `numero`, que é a posição na lista. Não é um texto gravado: se   │
 * │ uma parcela for inserida no meio, as seguintes se renumeram sozinhas.  │
 * │                                                                      │
 * │ É por isso que a tela nunca mostra "parcela 2 de 4" com o "de 4"      │
 * │ escrito no dado — o total é `parcelas.length`, contado agora.          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE O BOTÃO "REGISTRAR PAGAMENTO" FAZ — E O QUE NÃO FAZ             │
 * │                                                                      │
 * │ Não grava. Abre a gaveta com os campos que ele usaria e diz, ali      │
 * │ dentro, que nada foi salvo. É o mesmo padrão dos outros cadastros da  │
 * │ fase: a função aparece, porque ela existe no produto final, e a tela   │
 * │ diz a verdade sobre o estado dela hoje.                               │
 * │                                                                      │
 * │ A GAVETA NÃO CONFUNDE PAGAMENTO COM RECEBIMENTO. A pergunta que ela    │
 * │ responde é "quanto ENTROU, quando, como e de quem foi a nota" — não    │
 * │ "qual parcela foi quitada". Por isso o valor recebido é um campo       │
 * │ separado do valor da parcela: um cliente que paga R$ 900 de uma        │
 * │ parcela de R$ 1.800 pagou parte, e um formulário que só aceitasse o    │
 * │ valor cheio obrigaria a mentir ou a não registrar.                    │
 * │                                                                      │
 * │ Nada aqui fala com banco, com Pix ou com gateway. A "forma de          │
 * │ pagamento" é uma etiqueta que ela escolhe para lembrar depois — não um │
 * │ meio de pagamento conectado.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const TOM_BORDA: Record<StatusParcela, string> = {
  PAGO: "border-l-medio",
  PENDENTE: "border-l-[var(--linha-forte)]",
  ATRASADO: "border-l-red-800",
  CANCELADO: "border-l-[var(--linha-forte)]",
};

/**
 * As formas de pagamento que a gaveta oferece.
 *
 * É uma lista de ETIQUETAS, não de integrações: escolher "Pix" aqui não
 * conecta nada a banco nenhum. Serve para ela lembrar depois como aquele
 * dinheiro entrou — que é a informação que hoje vive no caderno.
 */
type FormaPagamento =
  | "PIX"
  | "TRANSFERENCIA"
  | "DINHEIRO"
  | "CARTAO"
  | "BOLETO"
  | "CHEQUE"
  | "OUTRO";

const FORMAS: readonly { valor: FormaPagamento; texto: string }[] = [
  { valor: "PIX", texto: "Pix" },
  { valor: "TRANSFERENCIA", texto: "Transferência" },
  { valor: "DINHEIRO", texto: "Dinheiro" },
  { valor: "CARTAO", texto: "Cartão" },
  { valor: "BOLETO", texto: "Boleto" },
  { valor: "CHEQUE", texto: "Cheque" },
  { valor: "OUTRO", texto: "Outro" },
];

export function CronogramaParcelas({
  parcelas,
  agora,
}: {
  parcelas: readonly ParcelaContrato[];
  /** Injetado pela página para que o render seja determinístico. */
  agora: Date;
}) {
  const [registrando, setRegistrando] = useState<ParcelaContrato | null>(null);

  // Ordenadas por posição, não por data: parcela sem vencimento continua no
  // lugar dela na sequência, em vez de cair para o fim.
  const ordenadas = [...parcelas].sort((a, b) => a.numero - b.numero);
  const total = parcelas.length;

  return (
    <>
      <ol className="space-y-3">
        {ordenadas.map((p) => {
          const vencida =
            p.status === "ATRASADO" ||
            (p.status === "PENDENTE" && p.venceEm !== null && p.venceEm.getTime() < agora.getTime());

          return (
            <li
              key={p.id}
              className={cn(
                "rounded-[var(--raio)] border border-[var(--linha)] border-l-2 bg-white/55 px-4 py-4",
                TOM_BORDA[p.status]
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                    <span className="text-[0.9375rem] font-medium text-tinta">
                      {rotuloParcela(p.numero)}
                    </span>
                    <span aria-hidden className="text-[var(--tinta-fraca)]">
                      ·
                    </span>
                    <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">
                      {p.numero} de {total}
                    </span>
                    <Etiqueta tom={TOM_STATUS_PARCELA[p.status]}>
                      {ROTULO_STATUS_PARCELA[p.status]}
                    </Etiqueta>
                    {p.recorrente ? (
                      <span className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase">
                        Recorrente
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1.5 text-[0.875rem] leading-snug text-[var(--tinta-suave)]">
                    {p.descricao}
                    {p.condicao ? ` · ${p.condicao}` : ""}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="tabular text-[1.0625rem] leading-none text-tinta">
                    {valorEmReais(p.valor)}
                  </p>
                  <p className="mt-1.5 text-[0.75rem] text-[var(--tinta-fraca)]">
                    {p.pagoEm
                      ? `pago em ${dataCurta(p.pagoEm)}`
                      : p.venceEm
                        ? `vence em ${dataCurta(p.venceEm)}`
                        : "sem data marcada"}
                  </p>
                </div>
              </div>

              {/*
                Os quatro campos que o briefing pediu, em linha — número,
                descrição, valor e vencimento já estão acima; aqui entram o
                status por escrito e a data de pagamento quando ela existe.

                Status e data de pagamento lado a lado porque é assim que se
                confere: quem lê "Pago" quer ver a data ao lado, e quem lê
                "Pendente" precisa ver a data que ainda não chegou.
              */}
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 border-t border-[var(--linha)] pt-3">
                <div className="flex items-baseline gap-2">
                  <dt className="text-[0.75rem] text-[var(--tinta-fraca)]">Situação</dt>
                  <dd className="text-[0.8125rem] text-[var(--tinta-suave)]">
                    {ROTULO_STATUS_PARCELA[p.status]}
                  </dd>
                </div>
                <div className="flex items-baseline gap-2">
                  <dt className="text-[0.75rem] text-[var(--tinta-fraca)]">Vencimento</dt>
                  <dd className="text-[0.8125rem] text-[var(--tinta-suave)]">
                    {p.venceEm ? dataCurta(p.venceEm) : "não marcado"}
                  </dd>
                </div>
                <div className="flex items-baseline gap-2">
                  <dt className="text-[0.75rem] text-[var(--tinta-fraca)]">Pagamento</dt>
                  <dd className="text-[0.8125rem] text-[var(--tinta-suave)]">
                    {p.pagoEm ? dataCurta(p.pagoEm) : "ainda não registrado"}
                  </dd>
                </div>
              </dl>

              {vencida && p.status !== "ATRASADO" ? (
                <p className="mt-3 border-t border-[var(--linha)] pt-3 text-[0.8125rem] text-[#8a6d1f]">
                  A data passou e o pagamento não foi registrado. O sistema não marca atraso sozinho
                  — quem sabe se recebeu é você.
                </p>
              ) : null}

              {p.status !== "PAGO" && p.status !== "CANCELADO" ? (
                <div className="mt-3 border-t border-[var(--linha)] pt-3">
                  <Botao variante="secundario" tamanho="sm" onClick={() => setRegistrando(p)}>
                    Registrar pagamento
                  </Botao>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>

      <RegistrarPagamento parcela={registrando} aoFechar={() => setRegistrando(null)} />
    </>
  );
}

/**
 * A gaveta do registro de pagamento.
 *
 * Existe para que o fluxo seja visível, e diz em dois lugares que não grava.
 * Um botão que abre uma gaveta e não faz nada seria pior que um botão morto:
 * pareceria que funcionou.
 *
 * Os quatro campos são os que o briefing listou — data do pagamento, valor
 * recebido, forma de pagamento e observação. Eles existem porque são o que
 * ela anota hoje no caderno; a gaveta só organiza isso.
 */
function RegistrarPagamento({
  parcela,
  aoFechar,
}: {
  parcela: ParcelaContrato | null;
  aoFechar: () => void;
}) {
  const [data, setData] = useState("");
  const [valorRecebido, setValorRecebido] = useState("");
  const [forma, setForma] = useState<FormaPagamento>("PIX");
  const [observacao, setObservacao] = useState("");

  if (!parcela) return null;

  /**
   * Quanto do valor da parcela o valor digitado cobre.
   *
   * É DIVISÃO ARITMÉTICA, e nada mais. Não é "percentual de recebimento da
   * consultoria", não é indicador de desempenho e não é margem — é só a
   * conta de quanto falta quando o cliente paga uma parte.
   *
   * `null` quando não há valor digitado: sem número não há o que comparar, e
   * "faltam R$ 1.800" num campo vazio seria falso.
   */
  const recebido = emNumero(valorRecebido);
  const falta = recebido === null ? null : Math.round((parcela.valor - recebido) * 100) / 100;
  const parcial = falta !== null && falta > 0.005;
  const excedente = falta !== null && falta < -0.005;

  return (
    <Gaveta
      aberta
      aoFechar={aoFechar}
      titulo="Registrar pagamento"
      descricao={`${rotuloParcela(parcela.numero)} · ${valorEmReais(parcela.valor)}`}
      acoes={
        <>
          <Botao variante="linha" tamanho="sm" onClick={aoFechar}>
            Cancelar
          </Botao>
          <Botao variante="primario" tamanho="sm" onClick={aoFechar}>
            Entendi — fechar
          </Botao>
        </>
      }
    >
      <div className="space-y-5">
        <Aviso tom="atencao" titulo="Este registro não é salvo">
          <p>
            O sistema ainda não tem banco conectado. O que você preencher aqui serve para ver como o
            fluxo funciona — ao recarregar a página, a parcela volta ao estado anterior.
          </p>
        </Aviso>

        <ListaDados colunas={2}>
          <Dado rotulo="Parcela">{rotuloParcela(parcela.numero)}</Dado>
          <Dado rotulo="Valor combinado">{valorEmReais(parcela.valor)}</Dado>
          <Dado rotulo="Condição">{parcela.condicao || "sem condição declarada"}</Dado>
          <Dado rotulo="Vencimento">
            {parcela.venceEm ? dataCurta(parcela.venceEm) : "não informado"}
          </Dado>
        </ListaDados>

        <div>
          <label
            htmlFor="data-pagamento"
            className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase"
          >
            Data do pagamento
          </label>
          <input
            id="data-pagamento"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="mt-1.5 h-10 w-full rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.9375rem] text-tinta focus:border-oliva focus:bg-white focus:outline-none"
          />
          <p className="mt-1.5 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
            A data em que o dinheiro entrou, que pode ser diferente da data combinada.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="valor-recebido"
              className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase"
            >
              Valor recebido
            </label>
            <input
              id="valor-recebido"
              type="text"
              inputMode="decimal"
              value={valorRecebido}
              onChange={(e) => setValorRecebido(e.target.value)}
              placeholder="Ex.: 1800,00"
              className="mt-1.5 h-10 w-full rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.9375rem] text-tinta placeholder:text-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
            />
            <p className="mt-1.5 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
              O que entrou de fato. Pode ser parte da parcela.
            </p>
          </div>

          <div>
            <label
              htmlFor="forma-pagamento"
              className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase"
            >
              Forma de pagamento
            </label>
            <select
              id="forma-pagamento"
              value={forma}
              onChange={(e) => setForma(e.target.value as FormaPagamento)}
              className="mt-1.5 h-10 w-full cursor-pointer rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.9375rem] text-tinta focus:border-oliva focus:bg-white focus:outline-none"
            >
              {FORMAS.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.texto}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
              É uma anotação sua. Nenhum meio de pagamento está conectado.
            </p>
          </div>
        </div>

        {/* Confronto entre combinado e recebido — só aritmética. */}
        {falta !== null ? (
          <div
            role="status"
            className={cn(
              "rounded-[var(--raio)] border border-l-2 px-4 py-3",
              excedente
                ? "border-[var(--linha)] border-l-dourado bg-[rgba(201,165,78,0.09)]"
                : parcial
                  ? "border-[var(--linha)] border-l-dourado bg-[rgba(201,165,78,0.09)]"
                  : "border-[var(--linha)] border-l-medio bg-[rgba(29,82,54,0.07)]"
            )}
          >
            <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              {excedente ? (
                <>
                  <span className="font-medium text-tinta">Valor acima do combinado.</span> O
                  registro está {valorEmReais(Math.abs(falta))} maior que a parcela. Confira se é
                  acréscimo combinado ou erro de digitação.
                </>
              ) : parcial ? (
                <>
                  <span className="font-medium text-tinta">Pagamento parcial.</span> Faltam{" "}
                  {valorEmReais(falta)} para completar esta parcela. A parcela continua em aberto —
                  o sistema não a marca como paga com valor menor.
                </>
              ) : (
                <>
                  <span className="font-medium text-tinta">Cobre o valor combinado.</span> O
                  registro é igual ao valor da parcela.
                </>
              )}
            </p>
          </div>
        ) : null}

        <div>
          <label
            htmlFor="obs-pagamento"
            className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase"
          >
            Observação
          </label>
          <textarea
            id="obs-pagamento"
            rows={3}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Ex.: pagou metade agora e o resto na entrega. Combinado por telefone."
            className="mt-1.5 w-full resize-y rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 py-2 text-[0.9375rem] text-tinta placeholder:text-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
          />
        </div>

        <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
          <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
            <span className="font-medium text-tinta">O sistema não confirma com banco.</span> Quem
            registra que a parcela foi paga é você. Não há conciliação automática, não há meio de
            pagamento conectado, e não há cobrança sendo enviada ao cliente. Nada aqui vira
            comprovante nem tem valor fiscal.
          </p>
        </div>
      </div>
    </Gaveta>
  );
}

/** O mesmo leitor de número dos outros formulários. Vazio vira `null`. */
function emNumero(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.-]/g, "").trim();
  if (!limpo) return null;
  const normalizado = limpo.includes(",") ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) && n > 0 ? n : null;
}
