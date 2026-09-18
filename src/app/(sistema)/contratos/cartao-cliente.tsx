import Link from "next/link";
import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { LinhaDado, ListaLinhas } from "@/components/ui/dados";
import {
  ROTULO_STATUS_CONTRATO,
  TOM_STATUS_CONTRATO,
  contarParcelas,
  dataCurta,
  mensalidadeDoContrato,
  proximaParcela,
  rotuloParcela,
  somarPagas,
  somarParcelas,
  somarPendentes,
  valorEmReais,
} from "@/lib/dados";
import type { Contrato } from "@/lib/dados";

/**
 * "CONTRATOS DESTE CLIENTE" — o combinado que governa o trabalho.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE CARTÃO É UM ARQUIVO SÓ, E NÃO DOIS PARECIDOS            │
 * │                                                                      │
 * │ Ele aparece em dois lugares: na aba Documentos da ficha do cliente e  │
 * │ na tela da consultoria. Escrever a lista duas vezes — uma em cada     │
 * │ lugar, com o mesmo `valorEmReais` e o mesmo `Etiqueta` — funcionaria  │
 * │ na primeira semana. Depois, a lista do cliente ganharia uma coluna    │
 * │ que a da consultoria não tem, e as duas telas passariam a discordar   │
 * │ sobre o mesmo contrato.                                               │
 * │                                                                      │
 * │ Aqui existe UMA lista, e as duas telas a importam. É a mesma decisão  │
 * │ de `CartaoPlanilhasDoCliente`, pelo mesmo motivo.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE AS SOMAS NÃO SÃO CALCULADAS AQUI                             │
 * │                                                                      │
 * │ Os números deste cartão vêm de `somarParcelas`, `somarPagas` e        │
 * │ `somarPendentes` — as MESMAS funções que a lista de contratos e o     │
 * │ detalhe do contrato usam. Nada de `reduce` escrito neste arquivo: um  │
 * │ `reduce` local seria uma segunda régua para a mesma palavra, e no dia │
 * │ em que "cancelada não conta" mudasse, este cartão continuaria         │
 * │ somando do jeito antigo sem que ninguém percebesse.                   │
 * │                                                                      │
 * │ Continuam sendo SOMAS de valores declarados. Não há juros, multa,     │
 * │ correção nem previsão de recebimento.                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE CARTÃO NÃO GRAVA E NÃO COBRA                                    │
 * │                                                                      │
 * │ Ele mostra o que está registrado. Não envia ao cliente, não gera      │
 * │ cobrança, não fala com banco e não emite boleto — o botão "Novo       │
 * │ contrato" leva ao formulário, e o formulário diz, em três lugares,    │
 * │ que nada é salvo enquanto o banco não estiver conectado.              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function CartaoContratosDoCliente({
  clienteId,
  nomeCliente,
  contratos,
}: {
  clienteId: string;
  nomeCliente: string;
  /**
   * Os contratos deste cliente, já filtrados e ordenados pelo repositório.
   *
   * Chegam prontos porque a página já os buscou: pedir de novo aqui dentro
   * faria duas consultas para responder uma pergunta, e uma delas poderia
   * ficar para trás quando a página passasse a filtrar por outra coisa.
   */
  contratos: readonly Contrato[];
}) {
  return (
    <Secao
      rotulo="Contratos"
      titulo={
        contratos.length === 0
          ? "Nenhum contrato com este cliente"
          : contratos.length === 1
            ? "1 contrato com este cliente"
            : `${contratos.length} contratos com este cliente`
      }
      descricao={`O que foi combinado com ${nomeCliente}: valor, parcelas e em que ponto cada contrato está. Os números abaixo são somas das parcelas — confira contrato por contrato, se quiser.`}
      acoes={
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/contratos?cliente=${encodeURIComponent(clienteId)}`}
            className="text-[0.8125rem] text-oliva hover:underline"
          >
            Ver na lista de contratos
          </Link>
          <BotaoLink
            href={`/contratos/novo?cliente=${encodeURIComponent(clienteId)}`}
            variante="primario"
            tamanho="sm"
          >
            Novo contrato
          </BotaoLink>
        </div>
      }
    >
      {contratos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum contrato registrado"
          descricao="Quando um combinado for fechado com este cliente, ele aparece aqui com o valor, as parcelas e o estado do documento."
          acao={
            <BotaoLink
              href={`/contratos/novo?cliente=${encodeURIComponent(clienteId)}`}
              variante="secundario"
              tamanho="sm"
            >
              Montar um contrato
            </BotaoLink>
          }
        />
      ) : (
        <ul className="space-y-4">
          {contratos.map((contrato) => (
            <LinhaDeContrato key={contrato.id} contrato={contrato} />
          ))}
        </ul>
      )}

      <div className="mt-5 rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
        <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          <span className="font-medium text-tinta">Contrato é registro, não cobrança.</span> O
          sistema não emite boleto, não fala com banco e não confirma pagamento sozinho: cada parcela
          marcada como recebida foi alguém que marcou. O documento do contrato vive em outro
          projeto — aqui ele aparece como referência, com versão e estado do aceite.
        </p>
      </div>
    </Secao>
  );
}

/**
 * Um contrato na lista.
 *
 * Os três valores — projeto, recebido e em aberto — somam certo entre si:
 * "recebido" são as parcelas pagas, "em aberto" são as pendentes e atrasadas,
 * e o total exclui as canceladas. Quem somar as linhas do cronograma chega
 * exatamente a estes números.
 */
function LinhaDeContrato({ contrato }: { contrato: Contrato }) {
  const total = somarParcelas(contrato);
  const pago = somarPagas(contrato);
  const pendente = somarPendentes(contrato);
  const contagem = contarParcelas(contrato);
  const proxima = proximaParcela(contrato);
  const mensalidade = mensalidadeDoContrato(contrato);
  const destino = `/contratos/${contrato.id}`;

  return (
    <li className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2.5">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="tabular text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              {contrato.numero}
            </span>
            <Etiqueta tom={TOM_STATUS_CONTRATO[contrato.status]}>
              {ROTULO_STATUS_CONTRATO[contrato.status]}
            </Etiqueta>
          </p>
          <p className="mt-1.5 text-[0.9375rem] leading-snug font-medium text-tinta">
            <Link href={destino} className="underline-offset-4 hover:underline">
              {contrato.titulo}
            </Link>
          </p>
        </div>

        <Link
          href={destino}
          className="shrink-0 text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
        >
          Abrir contrato
        </Link>
      </div>

      <div className="mt-4 border-t border-[var(--linha)] pt-3">
        <ListaLinhas>
          <LinhaDado rotulo="Valor do projeto">
            <span className="tabular">{valorEmReais(total, { centavos: false })}</span>
          </LinhaDado>
          <LinhaDado rotulo="Recebido">
            <span className={`tabular ${pago > 0 ? "text-medio" : ""}`}>
              {valorEmReais(pago, { centavos: false })}
            </span>
          </LinhaDado>
          <LinhaDado rotulo="Em aberto">
            <span className={`tabular ${contagem.ATRASADO > 0 ? "text-red-800" : ""}`}>
              {valorEmReais(pendente, { centavos: false })}
              {contagem.ATRASADO > 0 ? (
                <span className="ml-2 text-[0.75rem] text-[var(--tinta-fraca)]">
                  {contagem.ATRASADO === 1
                    ? "1 parcela atrasada"
                    : `${contagem.ATRASADO} parcelas atrasadas`}
                </span>
              ) : null}
            </span>
          </LinhaDado>
          <LinhaDado rotulo="Parcelas">
            <span className="tabular">
              {contagem.PAGO} de {contrato.parcelas.length} pagas
            </span>
          </LinhaDado>
          <LinhaDado rotulo="Próximo vencimento">
            {proxima ? (
              <span className="tabular">
                {rotuloParcela(proxima.numero)} ·{" "}
                {proxima.venceEm ? dataCurta(proxima.venceEm) : "sem data"}
              </span>
            ) : (
              <span className="text-[var(--tinta-fraca)]">nada em aberto</span>
            )}
          </LinhaDado>
          {mensalidade !== null ? (
            <LinhaDado rotulo="Mensalidade">
              <span className="tabular">{valorEmReais(mensalidade)} por mês</span>
            </LinhaDado>
          ) : null}
        </ListaLinhas>
      </div>
    </li>
  );
}
