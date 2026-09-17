import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { BarraFiltros } from "@/components/ui/filtros";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import {
  ROTULO_MODALIDADE,
  ROTULO_SITUACAO_CLIENTE,
  ROTULO_TIPO_NEGOCIO,
  TOM_SITUACAO_CLIENTE,
  dataCurta,
  desdeQuando,
  obterRepositorioOperacao,
} from "@/lib/dados";
import type { LinhaCliente, SituacaoCliente, Modalidade, TipoServico } from "@/lib/dados";
import { NovoCliente } from "./novo";

export const metadata: Metadata = { title: "Clientes" };

/**
 * CLIENTES — a lista.
 *
 * A pergunta que esta tela responde: "quem eu atendo, e quem está parado?"
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LISTA NÃO É UM ESPELHO DA FILA DE LEADS                    │
 * │                                                                      │
 * │ Quatro dos cinco clientes da demonstração vieram de um lead e        │
 * │ carregam o id dele — a história vai e volta. O quinto, Quintal da    │
 * │ Maria, entrou por indicação e foi cadastrado à mão: `leadOrigemId`   │
 * │ é `null`.                                                            │
 * │                                                                      │
 * │ Isso não é um dado a mais. É a razão de a tela existir separada: se   │
 * │ todo cliente fosse um lead convertido, bastaria filtrar a fila.      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * OS FILTROS VIVEM NA URL, como na fila de leads. Os valores são validados
 * contra as listas reais: um `?situacao=QUALQUER` escrito à mão não filtra
 * por nada em vez de devolver lista vazia sem explicação.
 */

type Props = {
  searchParams: Promise<{
    q?: string;
    situacao?: string;
    tipo?: string;
    modalidade?: string;
  }>;
};

const SITUACOES: readonly SituacaoCliente[] = ["ATIVO", "EM_IMPLANTACAO", "PAUSADO", "ENCERRADO"];
const MODALIDADES: readonly Modalidade[] = ["PRESENCIAL", "ONLINE", "MISTA"];
const TIPOS: readonly TipoServico[] = [
  "BUFFET",
  "A_LA_CARTE",
  "BUFFET_E_A_LA_CARTE",
  "DELIVERY",
  "OUTRO",
];

export default async function PaginaClientes({ searchParams }: Props) {
  const { q, situacao, tipo, modalidade } = await searchParams;

  const linhas = await obterRepositorioOperacao().listarLinhasCliente();

  const busca = (q ?? "").trim().toLowerCase();
  const fSituacao = SITUACOES.includes(situacao as SituacaoCliente)
    ? (situacao as SituacaoCliente)
    : "";
  const fTipo = TIPOS.includes(tipo as TipoServico) ? (tipo as TipoServico) : "";
  const fModalidade = MODALIDADES.includes(modalidade as Modalidade)
    ? (modalidade as Modalidade)
    : "";

  const filtradas = linhas.filter((l) => {
    const c = l.cliente;
    if (fSituacao && c.situacao !== fSituacao) return false;
    if (fTipo && c.tipoNegocio !== fTipo) return false;
    if (fModalidade && c.modalidade !== fModalidade) return false;
    if (busca) {
      const alvo = `${c.nomeFantasia} ${c.nomeContato} ${c.cidade}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });

  const colunas: ColunaLista<LinhaCliente>[] = [
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
            {l.cliente.nomeContato}
          </span>
        </>
      ),
    },
    {
      chave: "situacao",
      titulo: "Situação",
      noCartao: "linha",
      valor: (l) => (
        <Etiqueta tom={TOM_SITUACAO_CLIENTE[l.cliente.situacao]}>
          {ROTULO_SITUACAO_CLIENTE[l.cliente.situacao]}
        </Etiqueta>
      ),
    },
    {
      chave: "tipo",
      titulo: "Tipo",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">
          {ROTULO_TIPO_NEGOCIO[l.cliente.tipoNegocio]}
        </span>
      ),
    },
    {
      chave: "modalidade",
      titulo: "Modalidade",
      ocultaEm: "sm",
      noCartao: "linha",
      valor: (l) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">
          {ROTULO_MODALIDADE[l.cliente.modalidade]}
        </span>
      ),
    },
    {
      chave: "inicio",
      titulo: "Início",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {dataCurta(l.cliente.iniciadoEm)}
        </span>
      ),
    },
    {
      chave: "atividade",
      titulo: "Última atividade",
      align: "dir",
      noCartao: "linha",
      valor: (l) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">
          {desdeQuando(l.ultimaAtividadeEm)}
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
        rotulo="Operação"
        titulo="Clientes"
        descricao="Quem está sendo atendido agora, em que modalidade, desde quando — e quando foi a última vez que alguma coisa se moveu. É o ponto de entrada para o histórico completo de cada um."
        acoes={
          <div className="flex flex-wrap items-center gap-3">
            <Etiqueta tom="oliva">Demonstração</Etiqueta>
            <NovoCliente />
          </div>
        }
      />

      <FaixaDemonstracao oQue="Estes cinco clientes são inventados para demonstração. Nenhum nome, e-mail ou telefone aqui corresponde a uma empresa real, e nenhum veio de cliente da consultoria." />

      <Secao
        rotulo={`${filtradas.length} de ${linhas.length}`}
        titulo="Carteira"
        descricao="Sem ordenação por oportunidade e sem nota de saúde: a lista está por última atividade, que é um fato com data."
      >
        <BarraFiltros
          base="/clientes"
          valores={{
            q: busca,
            situacao: fSituacao,
            tipo: fTipo,
            modalidade: fModalidade,
          }}
          busca="q"
          placeholderBusca="Nome, responsável ou cidade…"
          selecoes={[
            {
              chave: "situacao",
              rotulo: "Situação",
              opcoes: SITUACOES.map((s) => ({ valor: s, texto: ROTULO_SITUACAO_CLIENTE[s] })),
            },
            {
              chave: "tipo",
              rotulo: "Tipo de estabelecimento",
              opcoes: TIPOS.map((t) => ({ valor: t, texto: ROTULO_TIPO_NEGOCIO[t] })),
            },
            {
              chave: "modalidade",
              rotulo: "Modalidade",
              opcoes: MODALIDADES.map((m) => ({ valor: m, texto: ROTULO_MODALIDADE[m] })),
            },
          ]}
          acoes={
            <BotaoLink href="/leads" variante="secundario" tamanho="sm">
              Ver leads
            </BotaoLink>
          }
        />

        <div className="mt-5">
          <ListaResponsiva
            itens={filtradas}
            colunas={colunas}
            href={(l) => `/clientes/${l.cliente.id}`}
            vazio={
              linhas.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhum cliente cadastrado ainda"
                  descricao="Um cliente nasce quando um lead é convertido, ou quando a consultora cadastra à mão quem chegou por indicação."
                  acao={
                    <div className="flex flex-wrap items-center gap-3">
                      <NovoCliente />
                      <BotaoLink href="/leads" variante="secundario" tamanho="sm">
                        Ir para a fila de leads
                      </BotaoLink>
                    </div>
                  }
                />
              ) : (
                <EstadoVazio
                  titulo="Nenhum cliente com esses filtros"
                  descricao="Existem clientes na carteira, mas nenhum bate com a combinação atual. Limpar os filtros volta à lista inteira."
                  acao={
                    <BotaoLink href="/clientes" variante="secundario" tamanho="sm">
                      Limpar filtros
                    </BotaoLink>
                  }
                />
              )
            }
          />
        </div>
      </Secao>
    </div>
  );
}
