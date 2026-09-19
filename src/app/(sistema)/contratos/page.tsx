import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { BarraFiltros } from "@/components/ui/filtros";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import {
  ORDEM_STATUS_CONTRATO,
  ROTULO_ESTADO_DOCUMENTO,
  ROTULO_STATUS_CONTRATO,
  TOM_STATUS_CONTRATO,
  dataCurta,
  desdeQuando,
  obterRepositorioOperacao,
  valorEmReais,
} from "@/lib/dados";
import type { LinhaContrato, StatusContrato } from "@/lib/dados";

export const metadata: Metadata = { title: "Contratos" };

/**
 * CONTRATOS — a lista.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA RESPONDE                                              │
 * │                                                                      │
 * │ "O que eu combinei, o que já foi aceito, o que já foi pago e o que     │
 * │ ainda não." Quem abre Contratos não quer um relatório financeiro —    │
 * │ quer saber, de cada proposta, em que ponto ela está.                  │
 * │                                                                      │
 * │ Por isso o status vem primeiro na linha, e não o valor. Dinheiro sem  │
 * │ estado não diz nada: R$ 9.600 em rascunho é uma conversa, R$ 9.600    │
 * │ assinado é trabalho contratado.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA NÃO TEM, E POR QUE ISSO É UMA ESCOLHA                 │
 * │                                                                      │
 * │ Não há coluna "receita do mês", não há soma de contratos no topo, e   │
 * │ não há gráfico. Os cinco contratos são de demonstração: somá-los      │
 * │ produziria um número com cara de faturamento que na verdade mede a    │
 * │ minha própria ficção.                                                 │
 * │                                                                      │
 * │ O que existe são os valores DECLARADOS de cada contrato — que se      │
 * │ conferem abrindo o contrato e lendo as parcelas — e a contagem por    │
 * │ estado, que se confere contando as linhas da própria lista.           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * OS FILTROS VIVEM NA URL, como em todas as listas do sistema. O valor é
 * validado contra os estados reais: `?status=INVENTADO` na barra de
 * endereços não filtra por nada, em vez de devolver lista vazia sem
 * explicação — que é o defeito clássico de filtro não validado.
 */

type Props = {
  searchParams: Promise<{ q?: string; status?: string; cliente?: string }>;
};

export default async function PaginaContratos({ searchParams }: Props) {
  const { q, status, cliente } = await searchParams;

  const linhas = await obterRepositorioOperacao().listarLinhasContrato();

  const busca = (q ?? "").trim().toLowerCase();
  const fStatus = ORDEM_STATUS_CONTRATO.includes(status as StatusContrato)
    ? (status as StatusContrato)
    : "";

  /*
    `?cliente=` é o filtro que a ficha do cliente usa para mandar a lista já
    recortada ("ver os contratos DESTE cliente"). Ele não é validado contra
    uma lista de valores possíveis como o status, porque o conjunto de ids de
    cliente é o cadastro inteiro — a validação aqui é o próprio `filter`:
    um id que não existe não casa com linha nenhuma, e a tela explica que o
    recorte veio de um cliente em vez de mostrar uma lista vazia sem motivo.
  */
  const fCliente = (cliente ?? "").trim();

  const filtradas = linhas.filter((l) => {
    const c = l.contrato;
    if (fCliente && l.cliente.id !== fCliente) return false;
    if (fStatus && c.status !== fStatus) return false;
    if (busca) {
      const alvo = `${l.cliente.nomeFantasia} ${l.cliente.nomeContato} ${c.titulo} ${c.numero}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });

  /*
    O nome do cliente do recorte, para o cabeçalho poder dizer DE QUEM é esta
    lista. Sai da própria linha já carregada — não é uma segunda consulta ao
    repositório só para buscar um nome que já está na mão.
  */
  const clienteDoRecorte = fCliente
    ? (linhas.find((l) => l.cliente.id === fCliente)?.cliente ?? null)
    : null;

  /*
    A contagem por estado é feita sobre a lista INTEIRA, não sobre a filtrada.
    Um cabeçalho que dissesse "2 contratos" depois de filtrar por "Rascunho"
    seria lido como o total da carteira. O total é o total; o filtro é outra
    frase, e ela aparece em "X de Y" na seção.
  */
  const porStatus = new Map<StatusContrato, number>();
  for (const l of linhas) porStatus.set(l.contrato.status, (porStatus.get(l.contrato.status) ?? 0) + 1);

  const colunas: ColunaLista<LinhaContrato>[] = [
    {
      chave: "cliente",
      titulo: "Cliente",
      destaque: true,
      noCartao: "topo",
      valor: (l) => (
        <>
          <span className="block text-[0.9375rem] font-medium text-tinta">
            {l.cliente.nomeFantasia}
          </span>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {l.contrato.numero} · {l.cliente.nomeContato}
          </span>
        </>
      ),
    },
    {
      chave: "servico",
      titulo: "Serviço",
      noCartao: "linha",
      valor: (l) => (
        <span className="text-[0.875rem] leading-snug text-[var(--tinta-suave)]">
          {l.contrato.titulo}
        </span>
      ),
    },
    {
      chave: "status",
      titulo: "Status",
      noCartao: "linha",
      valor: (l) => (
        <Etiqueta tom={TOM_STATUS_CONTRATO[l.contrato.status]}>
          {ROTULO_STATUS_CONTRATO[l.contrato.status]}
        </Etiqueta>
      ),
    },
    {
      chave: "valor",
      titulo: "Valor total",
      align: "dir",
      noCartao: "linha",
      valor: (l) => (
        <span className="tabular text-[0.875rem] text-tinta">
          {valorEmReais(l.valorTotal, { centavos: false })}
        </span>
      ),
    },
    {
      chave: "aceite",
      titulo: "Aceite",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) =>
        l.contrato.aceite ? (
          <span className="text-[0.875rem] text-[var(--tinta-suave)]">
            {dataCurta(l.contrato.aceite.em)}
          </span>
        ) : (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">
            {ROTULO_ESTADO_DOCUMENTO[l.contrato.estadoDocumento]}
          </span>
        ),
    },
    {
      chave: "proximo",
      titulo: "Próximo pagamento",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) =>
        l.proximaParcela?.venceEm ? (
          <span className="text-[0.875rem] text-[var(--tinta-suave)]">
            {dataCurta(l.proximaParcela.venceEm)}
          </span>
        ) : (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">—</span>
        ),
    },
    {
      chave: "mensalidade",
      titulo: "Mensalidade",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) =>
        l.mensalidade !== null ? (
          <span className="tabular text-[0.875rem] text-tinta">
            {valorEmReais(l.mensalidade, { centavos: false })}
          </span>
        ) : (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">não</span>
        ),
    },
    {
      chave: "criado",
      titulo: "Criado",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">
          {desdeQuando(l.contrato.criadoEm)}
        </span>
      ),
    },
    {
      chave: "abrir",
      titulo: "",
      align: "dir",
      ocultaEm: "md",
      noCartao: "oculto",
      valor: () => (
        <span className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase">
          Abrir
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo={clienteDoRecorte ? `Cliente · ${clienteDoRecorte.nomeFantasia}` : "Documentos"}
        titulo="Contratos"
        descricao="Acompanhe propostas formalizadas, aceites, pagamentos e documentos de cada consultoria."
        acoes={
          <div className="flex flex-wrap items-center gap-3">
            <BotaoLink href="/contratos/novo" variante="primario" tamanho="sm">
              Novo contrato
            </BotaoLink>
          </div>
        }
      />

      {clienteDoRecorte ? (
        <Aviso tom="info" titulo={`Esta lista está recortada para ${clienteDoRecorte.nomeFantasia}`}>
          <p>
            A contagem abaixo é da carteira inteira, não só deste cliente — o total geral e o recorte
            são coisas diferentes.{" "}
            <Link href="/contratos" className="font-medium text-oliva hover:underline">
              Ver todos os contratos
            </Link>
          </p>
        </Aviso>
      ) : null}

      {/* Contagem por estado — conferível contando as linhas da lista. */}
      <Secao
        rotulo="Situação da carteira"
        titulo={`${linhas.length} ${linhas.length === 1 ? "contrato" : "contratos"} registrados`}
        descricao="A contagem é da lista inteira, não do filtro aplicado abaixo — o total da carteira e o resultado do filtro são coisas diferentes."
      >
        <ul className="flex flex-wrap gap-x-6 gap-y-2.5">
          {ORDEM_STATUS_CONTRATO.map((s) => {
            const n = porStatus.get(s) ?? 0;
            return (
              <li key={s} className="flex items-baseline gap-2">
                <span
                  className={`tabular text-[1.125rem] leading-none ${
                    n === 0 ? "text-[var(--tinta-fraca)]" : "text-tinta"
                  }`}
                >
                  {n}
                </span>
                <span className="text-[0.8125rem] text-[var(--tinta-suave)]">
                  {ROTULO_STATUS_CONTRATO[s]}
                </span>
              </li>
            );
          })}
        </ul>
      </Secao>

      <Secao
        rotulo={`${filtradas.length} de ${linhas.length}`}
        titulo="Todos os contratos"
        descricao="Por data de criação, do mais recente para o mais antigo. Não há ordenação por valor: a pergunta que se faz aqui é 'em que ponto isso está', não 'qual vale mais'."
      >
        <BarraFiltros
          base="/contratos"
          /*
            `cliente` entra em `valores` para o recorte SOBREVIVER à troca de
            filtro: a barra remonta a URL a partir do que a página declarou, e
            um parâmetro que não estivesse aqui sumiria no primeiro caractere
            digitado na busca — a pessoa filtraria por status e, sem entender,
            veria os contratos da carteira inteira voltarem.
          */
          valores={{ q: busca, status: fStatus, cliente: fCliente }}
          busca="q"
          placeholderBusca="Cliente, empresa, serviço ou número…"
          selecoes={[
            {
              chave: "status",
              rotulo: "Status",
              opcoes: ORDEM_STATUS_CONTRATO.map((s) => ({
                valor: s,
                texto: ROTULO_STATUS_CONTRATO[s],
              })),
            },
          ]}
          acoes={
            <BotaoLink href="/clientes" variante="secundario" tamanho="sm">
              Ver clientes
            </BotaoLink>
          }
        />

        <div className="mt-5">
          <ListaResponsiva
            itens={filtradas}
            colunas={colunas}
            href={(l) => `/contratos/${l.contrato.id}`}
            vazio={
              linhas.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhum contrato registrado"
                  descricao="Um contrato nasce quando um combinado é formalizado: o escopo, o valor e as condições ficam escritos, e o aceite do cliente fica registrado."
                  acao={
                    <BotaoLink href="/contratos/novo" variante="primario" tamanho="sm">
                      Novo contrato
                    </BotaoLink>
                  }
                />
              ) : (
                <EstadoVazio
                  titulo="Nenhum contrato com esses filtros"
                  descricao={
                    clienteDoRecorte
                      ? `Existem contratos registrados — inclusive de ${clienteDoRecorte.nomeFantasia} — mas nenhum bate com a combinação atual.`
                      : "Existem contratos registrados, mas nenhum bate com a combinação atual. Limpar os filtros volta à lista inteira."
                  }
                  acao={
                    /* Limpar não joga fora o recorte de cliente: quem chegou
                       aqui pela ficha dele está olhando uma pessoa, e voltar
                       para a carteira inteira seria perder o caminho de volta. */
                    <BotaoLink
                      href={
                        fCliente ? `/contratos?cliente=${encodeURIComponent(fCliente)}` : "/contratos"
                      }
                      variante="secundario"
                      tamanho="sm"
                    >
                      {fCliente ? "Limpar os outros filtros" : "Limpar filtros"}
                    </BotaoLink>
                  }
                />
              )
            }
          />
        </div>
      </Secao>

      <Aviso tom="atencao" titulo="O que esta área ainda não faz">
        <p>
          O sistema <strong className="font-semibold text-tinta">não emite cobrança</strong>, não
          conversa com banco ou meio de pagamento, e não confirma recebimento sozinho. Quando uma
          parcela aparece como paga, foi porque alguém registrou que ela foi paga.
        </p>
        <p className="mt-2.5">
          O aceite também é registro, não assinatura jurídica: o sistema anota a data e quem aceitou,
          e guarda o documento anexado. A assinatura com validade legal é o próximo passo, e depende
          de uma decisão sobre qual serviço usar — que ainda não foi tomada.
        </p>
        <p className="mt-2.5">
          E o botão &ldquo;Novo contrato&rdquo; leva a um formulário que monta a proposta inteira —
          cliente, serviço, valor, cronograma de quantas parcelas você combinar e vencimentos — mas
          não grava: o sistema ainda não tem banco conectado. Ele existe para você ver como seria o
          registro, não para fingir que registrou.
        </p>
      </Aviso>

      {/* Liga a lista ao resto da operação: contrato não é documento solto. */}
      <Secao
        rotulo="Para onde ir depois"
        titulo="O contrato ligado ao resto"
        descricao="Um contrato registra um combinado. Quem executa o combinado são as consultorias, as tarefas e os acompanhamentos."
      >
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              href: "/consultorias",
              titulo: "Consultorias",
              nota: "A jornada de cada trabalho contratado",
            },
            {
              href: "/clientes",
              titulo: "Clientes",
              nota: "A ficha de quem contratou",
            },
            {
              href: "/planilhas",
              titulo: "Planilhas",
              nota: "Gerar documento a partir dos dados",
            },
          ].map((a) => (
            <li key={a.href}>
              <Link
                href={a.href}
                className="flex flex-col gap-1 rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[var(--superficie)] px-3.5 py-3 transition-colors duration-150 hover:border-[var(--linha-forte)] hover:bg-white"
              >
                <span className="text-[0.875rem] font-medium text-tinta">{a.titulo}</span>
                <span className="text-[0.75rem] text-[var(--tinta-fraca)]">{a.nota}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Secao>
    </div>
  );
}
