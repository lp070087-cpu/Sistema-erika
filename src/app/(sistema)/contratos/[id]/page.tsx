import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina, Rotulo } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, EstadoVazio, Painel, Secao } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { LinhaDoTempo } from "@/components/ui/linha-do-tempo";
import { CronogramaParcelas } from "./cronograma";
import { AreaDocumento } from "./documento";
import { resolverDocumento } from "@/lib/contratos/documento";
import {
  ROTULO_ESTADO_DOCUMENTO,
  ROTULO_EVENTO_CONTRATO,
  ROTULO_STATUS_CONTRATO,
  ROTULO_TIPO_ACEITE,
  TOM_STATUS_CONTRATO,
  contarParcelas,
  dataCurta,
  desdeQuando,
  mensalidadeDoContrato,
  obterRepositorioOperacao,
  proximaParcela,
  rotuloParcela,
  somarPagas,
  somarParcelas,
  somarPendentes,
  valorEmReais,
} from "@/lib/dados";

export const metadata: Metadata = { title: "Contrato" };

/**
 * DETALHE DO CONTRATO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ORDEM DESTA PÁGINA, E O QUE CADA BLOCO RESPONDE                    │
 * │                                                                      │
 * │ 1. CABEÇALHO — quem, o que, em que estado, desde quando.              │
 * │ 2. RESUMO FINANCEIRO — quatro números, todos somas de parcelas.       │
 * │ 3. CRONOGRAMA — as N parcelas, na ordem em que vencem.                │
 * │ 4. DOCUMENTO — onde o PDF vive, e em que ponto o aceite está.         │
 * │ 5. HISTÓRICO — o que aconteceu, em ordem.                             │
 * │                                                                      │
 * │ O financeiro vem antes do cronograma porque é ele que responde à      │
 * │ primeira pergunta ("quanto e quanto falta?"); o cronograma responde   │
 * │ a segunda ("quando?"). O documento e o histórico são consulta.        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE OS NÚMEROS DO RESUMO NÃO SÃO UM "PAINEL FINANCEIRO"           │
 * │                                                                      │
 * │ Quatro valores: total, pago, pendente e mensalidade. Os três          │
 * │ primeiros são SOMAS das parcelas que estão listadas logo abaixo —     │
 * │ qualquer pessoa soma a coluna e chega ao mesmo número.                │
 * │                                                                      │
 * │ Não há "receita prevista", não há "valor corrigido", não há juros,    │
 * │ não há projeção de quanto o contrato vai render. Juros e multa são    │
 * │ cláusula, e nem todo contrato tem; projeção é decisão, e ela não foi   │
 * │ tomada.                                                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = { params: Promise<{ id: string }> };

export default async function PaginaContrato({ params }: Props) {
  const { id } = await params;
  const operacao = obterRepositorioOperacao();

  const contrato = await operacao.obterContrato(id);
  if (!contrato) notFound();

  const [cliente, consultoria] = await Promise.all([
    operacao.obterCliente(contrato.clienteId),
    contrato.consultoriaId ? operacao.obterConsultoria(contrato.consultoriaId) : null,
  ]);

  if (!cliente) notFound();

  const agora = new Date();

  const total = somarParcelas(contrato);
  const pago = somarPagas(contrato);
  const pendente = somarPendentes(contrato);
  const mensalidade = mensalidadeDoContrato(contrato);
  const contagem = contarParcelas(contrato);
  const proxima = proximaParcela(contrato);

  /*
    O histórico chega em ordem decrescente (mais recente primeiro) para a
    linha do tempo, que é como o componente foi desenhado: o que acabou de
    acontecer é o que se quer ver primeiro.
  */
  const eventos = [...contrato.eventos].sort((a, b) => b.em.getTime() - a.em.getTime());

  /*
    A referência do documento é resolvida aqui, no servidor, e não dentro do
    componente: o endereço do arquivo é configuração, e um client component
    não deve decidir onde o documento mora. Ver `@/lib/contratos/documento`.
  */
  const documento = resolverDocumento(contrato, cliente.nomeFantasia);

  return (
    <div className="space-y-6">
      <Link
        href="/contratos"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para os contratos
      </Link>

      <CabecalhoPagina
        rotulo={`${cliente.nomeFantasia} · ${contrato.numero}`}
        titulo={contrato.titulo}
        descricao={
          contrato.status === "RASCUNHO"
            ? "Ainda em montagem. Nada foi enviado ao cliente."
            : contrato.status === "AGUARDANDO_ACEITE"
              ? "Enviado ao cliente. O trabalho começa quando ele aceitar."
              : contrato.status === "CANCELADO"
                ? "Cancelado. O histórico abaixo fica registrado."
                : `Vigente desde ${contrato.inicioEm ? dataCurta(contrato.inicioEm) : "—"}.`
        }
        acoes={
          <Etiqueta tom={TOM_STATUS_CONTRATO[contrato.status]}>
            {ROTULO_STATUS_CONTRATO[contrato.status]}
          </Etiqueta>
        }
      />

      <FaixaDemonstracao oQue="Este contrato é inventado para demonstração, e o valor não tem nenhuma relação com o que a Érika cobra. O sistema não emite cobrança nem confirma pagamento com banco — o que está registrado aqui foi digitado por alguém." />

      {/* ── CABEÇALHO FACTUAL ──────────────────────────────────────────── */}
      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        <ListaDados colunas={3}>
          <Dado rotulo="Cliente">
            <Link href={`/clientes/${cliente.id}`} className="text-oliva hover:underline">
              {cliente.nomeFantasia}
            </Link>
          </Dado>
          <Dado rotulo="Empresa">{cliente.nomeContato}</Dado>
          <Dado rotulo="Status">
            <Etiqueta tom={TOM_STATUS_CONTRATO[contrato.status]}>
              {ROTULO_STATUS_CONTRATO[contrato.status]}
            </Etiqueta>
          </Dado>
          <Dado rotulo="Data de início">
            {contrato.inicioEm ? dataCurta(contrato.inicioEm) : "não definida"}
          </Dado>
          <Dado rotulo="Previsão de entrega">
            {contrato.entregaPrevistaEm ? dataCurta(contrato.entregaPrevistaEm) : "não definida"}
          </Dado>
          <Dado rotulo="Criado">
            {dataCurta(contrato.criadoEm)} · {desdeQuando(contrato.criadoEm, agora)}
          </Dado>
          {consultoria ? (
            <Dado rotulo="Consultoria ligada" largo>
              <Link href={`/consultorias/${consultoria.id}`} className="text-oliva hover:underline">
                {consultoria.titulo}
              </Link>
            </Dado>
          ) : (
            <Dado rotulo="Consultoria ligada" largo>
              <span className="text-[var(--tinta-fraca)]">
                Nenhuma ainda — o trabalho não começou.
              </span>
            </Dado>
          )}
        </ListaDados>
      </div>

      {/* ── RESUMO FINANCEIRO ──────────────────────────────────────────── */}
      <Secao
        rotulo="Resumo financeiro"
        titulo="Quanto é, quanto entrou, quanto falta"
        descricao="Os três primeiros números são somas das parcelas listadas logo abaixo — confira parcela por parcela, se quiser. Não há juros, multa ou correção: o sistema não inventa cláusula que o contrato não tem."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Valor rotulo="Valor do projeto" valor={total} />
          <Valor rotulo="Valor pago" valor={pago} tom={pago > 0 ? "verde" : undefined} />
          <Valor
            rotulo="Valor pendente"
            valor={pendente}
            tom={
              contagem.ATRASADO > 0 ? "critico" : pendente > 0 ? "dourado" : undefined
            }
            contexto={
              contagem.ATRASADO > 0
                ? `${contagem.ATRASADO} ${contagem.ATRASADO === 1 ? "parcela atrasada" : "parcelas atrasadas"}`
                : undefined
            }
          />
          <Valor
            rotulo="Mensalidade"
            valor={mensalidade}
            contexto={mensalidade === null ? "Este contrato não tem" : "Acompanhamento recorrente"}
          />
        </div>

        {/* Contagem por estado — confere contra o cronograma abaixo. */}
        <div className="mt-6 border-t border-[var(--linha)] pt-5">
          <Rotulo className="mb-3">As {contrato.parcelas.length} parcelas</Rotulo>
          <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
            {(["PAGO", "PENDENTE", "ATRASADO", "CANCELADO"] as const).map((s) => (
              <li key={s} className="flex items-baseline gap-2">
                <span
                  className={`tabular text-[1.125rem] leading-none ${
                    contagem[s] === 0 ? "text-[var(--tinta-fraca)]" : "text-tinta"
                  }`}
                >
                  {contagem[s]}
                </span>
                <span className="text-[0.8125rem] text-[var(--tinta-suave)]">
                  {s === "PAGO"
                    ? "pagas"
                    : s === "PENDENTE"
                      ? "pendentes"
                      : s === "ATRASADO"
                        ? "atrasadas"
                        : "canceladas"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {proxima ? (
          <div className="mt-5 rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[rgba(242,236,226,0.5)] px-4 py-3.5">
            <p className="text-[0.8125rem] text-[var(--tinta-suave)]">
              <span className="font-medium text-tinta">Próximo vencimento:</span>{" "}
              {rotuloParcela(proxima.numero)} de {valorEmReais(proxima.valor)}
              {proxima.venceEm ? `, em ${dataCurta(proxima.venceEm)}` : ", ainda sem data marcada"}.
            </p>
          </div>
        ) : null}
      </Secao>

      {/* ── CRONOGRAMA DE PAGAMENTOS ───────────────────────────────────── */}
      <Secao
        rotulo="Cronograma de pagamentos"
        titulo="As parcelas, na ordem em que vencem"
        descricao="O contrato pode ter quantas parcelas forem combinadas — duas, quatro, seis, doze. O rótulo da posição é derivado da ordem nesta lista, e não um número gravado: por isso uma parcela pode ser acrescentada sem que as outras mudem de nome."
      >
        {contrato.parcelas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma parcela combinada"
            descricao="Quando o valor e as condições forem acertados, as parcelas aparecem aqui na ordem em que vencem."
          />
        ) : (
          <CronogramaParcelas parcelas={contrato.parcelas} agora={agora} />
        )}
      </Secao>

      {/* ── DOCUMENTO ──────────────────────────────────────────────────── */}
      <AreaDocumento
        estado={contrato.estadoDocumento}
        aceite={contrato.aceite}
        numero={contrato.numero}
        referencia={documento}
        eventos={eventos}
      />

      {/* ── ESCOPO E OBSERVAÇÕES ───────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Secao
          rotulo="Escopo"
          titulo="O que está incluído"
          descricao="Exatamente o que foi combinado. Sem itens inferidos: se não está escrito aqui, não faz parte do contrato."
        >
          {contrato.escopo.length === 0 ? (
            <EstadoVazio
              titulo="Escopo ainda não escrito"
              descricao="O que foi combinado aparece aqui, item por item."
            />
          ) : (
            <ul className="space-y-2.5">
              {contrato.escopo.map((item, i) => (
                <li key={item} className="flex gap-3">
                  <span
                    aria-hidden
                    className="tabular shrink-0 pt-0.5 text-[0.75rem] text-[var(--tinta-fraca)]"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[0.9375rem] leading-relaxed text-tinta">{item}</span>
                </li>
              ))}
            </ul>
          )}
        </Secao>

        <Secao rotulo="Observações" titulo="O que foi combinado por fora">
          {contrato.observacoes ? (
            <p className="text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
              {contrato.observacoes}
            </p>
          ) : (
            <p className="text-[0.9375rem] text-[var(--tinta-fraca)]">
              Nenhuma observação registrada.
            </p>
          )}

          <div className="mt-5 border-t border-[var(--linha)] pt-4">
            <ListaDados colunas={1}>
              <Dado rotulo="Estado do documento">
                {ROTULO_ESTADO_DOCUMENTO[contrato.estadoDocumento]}
              </Dado>
              <Dado rotulo="Aceite">
                {contrato.aceite
                  ? `${ROTULO_TIPO_ACEITE[contrato.aceite.tipo]} em ${dataCurta(
                      contrato.aceite.em
                    )}, por ${contrato.aceite.por}`
                  : "Nenhum aceite registrado."}
              </Dado>
            </ListaDados>
          </div>
        </Secao>
      </div>

      {/* ── HISTÓRICO ──────────────────────────────────────────────────── */}
      <Secao
        rotulo="Histórico"
        titulo="O que aconteceu com este contrato"
        descricao="Do mais recente para o mais antigo. Cada linha é um fato com data — o sistema não deduz etapa a partir do status, ele registra o que foi acontecendo."
      >
        {eventos.length === 0 ? (
          <EstadoVazio
            titulo="Nada registrado ainda"
            descricao="Criação, envio, visualização, aceite e pagamentos aparecem aqui na ordem em que aconteceram."
          />
        ) : (
          <LinhaDoTempo
            eventos={eventos.map((e) => ({
              id: e.id,
              quando: dataCurta(e.em),
              titulo: ROTULO_EVENTO_CONTRATO[e.tipo],
              descricao: `${e.descricao} · ${e.por}`,
            }))}
          />
        )}
      </Secao>

      <Aviso tom="atencao" titulo="O que não é real aqui">
        <p>
          Este contrato é de demonstração. As ações desta tela —{" "}
          <strong className="font-semibold text-tinta">registrar pagamento</strong>,{" "}
          <strong className="font-semibold text-tinta">enviar ao cliente</strong> e{" "}
          <strong className="font-semibold text-tinta">registrar aceite</strong> — mostram como o
          fluxo funcionaria, mas não gravam nada: o sistema ainda não tem banco conectado.
        </p>
        <p className="mt-2.5">
          O documento anexado também é registro, não assinatura jurídica. Guardar o PDF e anotar quem
          aceitou é o que o sistema faz hoje; a assinatura com validade legal depende de escolher um
          serviço, e essa decisão ainda não foi tomada.
        </p>
      </Aviso>

      <Painel escuro className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Rotulo claro>Combinação registrada</Rotulo>
          <p className="mt-2 font-display text-[1.25rem] text-off">
            {valorEmReais(total, { centavos: false })} em {contrato.parcelas.length}{" "}
            {contrato.parcelas.length === 1 ? "parcela" : "parcelas"}.
          </p>
          <p className="mt-1.5 max-w-[62ch] text-[0.875rem] text-creme/65">
            {valorEmReais(pago, { centavos: false })} recebidos e{" "}
            {valorEmReais(pendente, { centavos: false })} por receber, segundo o que está registrado
            neste contrato.
          </p>
        </div>
        <span className="assina text-[1.5rem] text-oliva-palha">Combinado é combinado</span>
      </Painel>
    </div>
  );
}

/**
 * Um dos quatro números do resumo.
 *
 * `valor` aceita `null` para o caso da mensalidade — que é ausência de dado,
 * e não zero. Exibir "R$ 0,00" diria que o contrato tem uma mensalidade de
 * zero reais, o que é diferente de não ter mensalidade nenhuma.
 */
function Valor({
  rotulo,
  valor,
  tom,
  contexto,
}: {
  rotulo: string;
  valor: number | null;
  tom?: "verde" | "critico" | "dourado";
  contexto?: string;
}) {
  const cor =
    valor === null
      ? "text-[var(--tinta-fraca)]"
      : tom === "critico"
        ? "text-red-800"
        : tom === "dourado"
          ? "text-[#8a6d1f]"
          : tom === "verde"
            ? "text-medio"
            : "text-tinta";

  return (
    <div className="min-w-0">
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </p>
      <p className={`mt-1.5 tabular text-[1.375rem] leading-none ${cor}`}>
        {valor === null ? "—" : valorEmReais(valor)}
      </p>
      {contexto ? (
        <p className="mt-1.5 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">{contexto}</p>
      ) : null}
    </div>
  );
}
