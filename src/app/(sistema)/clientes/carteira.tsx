"use client";

import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { BarraFiltros } from "@/components/ui/filtros";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import {
  ROTULO_MODALIDADE,
  ROTULO_SITUACAO_CLIENTE,
  ROTULO_TIPO_NEGOCIO,
  TOM_SITUACAO_CLIENTE,
  dataCurta,
  desdeQuando,
} from "@/lib/dados";
import type { LinhaCliente, Modalidade, SituacaoCliente, TipoServico } from "@/lib/dados";
import { carteiraDaSessao } from "@/lib/dados/demonstracao";
import { NovoCliente } from "./novo";

/**
 * A CARTEIRA — a lista, no navegador.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A FILTRAGEM DESCEU PARA CÁ                                     │
 * │                                                                      │
 * │ Antes a página de servidor filtrava e entregava a lista pronta. Isso   │
 * │ funcionava enquanto o cadastro do cliente não podia ser corrigido.      │
 * │                                                                      │
 * │ Com a edição, filtrar do lado de lá passou a estar errado por dois      │
 * │ motivos, e o segundo é o que dói:                                      │
 * │                                                                      │
 * │   1. A lista mostraria o nome antigo por cima de um cadastro que ela   │
 * │      acabou de corrigir na tela do cliente.                            │
 * │                                                                      │
 * │   2. A BUSCA E OS FILTROS RESPONDEM SOBRE O QUE ESTÁ NA TELA. Se ela    │
 * │      corrigir o telefone e digitar o número novo na busca, uma         │
 * │      filtragem feita antes da correção devolveria "nenhum cliente" —   │
 * │      sobre um cliente que ela está vendo na lista, com o número novo    │
 * │      escrito nele. O sistema diria que não existe algo que existe.      │
 * │                                                                      │
 * │ Por isso a ordem aqui é: primeiro a sobreposição da sessão, depois o   │
 * │ filtro. Filtrar é perguntar sobre o que ela lê; então o que ela lê      │
 * │ tem de estar pronto antes da pergunta.                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O que NÃO mudou: os filtros continuam vivendo na URL. A página lê o
 * `?situacao=` e passa o valor validado para cá — quem escreve a URL
 * continua sendo a `BarraFiltros`, e o botão "voltar" continua funcionando.
 */

const SITUACOES: readonly SituacaoCliente[] = ["ATIVO", "EM_IMPLANTACAO", "PAUSADO", "ENCERRADO"];
const MODALIDADES: readonly Modalidade[] = ["PRESENCIAL", "ONLINE", "MISTA"];
const TIPOS: readonly TipoServico[] = [
  "BUFFET",
  "A_LA_CARTE",
  "BUFFET_E_A_LA_CARTE",
  "DELIVERY",
  "OUTRO",
];

export function Carteira({
  linhasDoCenario,
  busca,
  filtroSituacao,
  filtroTipo,
  filtroModalidade,
}: {
  linhasDoCenario: readonly LinhaCliente[];
  /** O `?q=` já normalizado pela página (aparado, em minúsculas). */
  busca: string;
  /** Os filtros já validados contra as listas reais. Vazio = sem filtro. */
  filtroSituacao: SituacaoCliente | "";
  filtroTipo: TipoServico | "";
  filtroModalidade: Modalidade | "";
}) {
  /*
    Assina o estado da sessão: salvar o cadastro de um cliente repinta a
    carteira, que é quem mostra o nome, o responsável, a cidade e a situação
    que a gaveta acabou de alterar.
  */
  useDemonstracao();

  // Primeiro o cadastro corrigido, depois a pergunta.
  const linhas = carteiraDaSessao(linhasDoCenario);

  const filtradas = linhas.filter((l) => {
    const c = l.cliente;
    if (filtroSituacao && c.situacao !== filtroSituacao) return false;
    if (filtroTipo && c.tipoNegocio !== filtroTipo) return false;
    if (filtroModalidade && c.modalidade !== filtroModalidade) return false;
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
    <Secao
      rotulo={`${filtradas.length} de ${linhas.length}`}
      titulo="Carteira"
      descricao="Sem ordenação por oportunidade e sem nota de saúde: a lista está por última atividade, que é um fato com data."
    >
      <BarraFiltros
        base="/clientes"
        valores={{
          q: busca,
          situacao: filtroSituacao,
          tipo: filtroTipo,
          modalidade: filtroModalidade,
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
  );
}
