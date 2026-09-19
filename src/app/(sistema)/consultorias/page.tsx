import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { BarraFiltros } from "@/components/ui/filtros";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import {
  ROTULO_MODALIDADE,
  ROTULO_STATUS_CONSULTORIA,
  TOM_STATUS_CONSULTORIA,
  dataCurta,
  desdeQuando,
  obterRepositorioOperacao,
} from "@/lib/dados";
import type { LinhaConsultoria, StatusConsultoria, Modalidade } from "@/lib/dados";
import { NovaConsultoria } from "./nova";

export const metadata: Metadata = { title: "Consultorias" };

/**
 * CONSULTORIAS — a lista.
 *
 * A pergunta que esta tela responde: "em que pé está cada trabalho?"
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O STATUS É ATRIBUÍDO, NÃO CALCULADO                                   │
 * │                                                                      │
 * │ Seria fácil deduzir "em acompanhamento" quando todas as fichas         │
 * │ estivessem prontas, ou "aguardando cliente" quando nada se move há     │
 * │ dez dias. Não é feito, e a razão é de confiança: um sistema que muda   │
 * │ o estado do trabalho sozinho erra em silêncio. A consultora olha a     │
 * │ lista, vê "em andamento" e age — quando na verdade o trabalho está     │
 * │ parado esperando resposta há duas semanas.                            │
 * │                                                                      │
 * │ Quem decide o status é ela. O que o sistema faz é mostrar os FATOS     │
 * │ que ajudam a decidir: quando foi o último acompanhamento, qual é a     │
 * │ próxima ação e para quando.                                           │
 * │                                                                      │
 * │ (O destaque dourado na linha "sem contato há N dias" é informação,     │
 * │ não alerta automático: ele conta uma distância em dias, não classifica │
 * │ o cliente.)                                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
type Props = {
  searchParams: Promise<{ q?: string; status?: string; modalidade?: string }>;
};

const STATUS: readonly StatusConsultoria[] = [
  "PLANEJAMENTO",
  "EM_ANDAMENTO",
  "AGUARDANDO_CLIENTE",
  "EM_ACOMPANHAMENTO",
  "CONCLUIDA",
];

const MODALIDADES: readonly Modalidade[] = ["PRESENCIAL", "ONLINE", "MISTA"];

/** A partir de quantos dias sem contato o sistema chama atenção para o fato. */
const DIAS_SEM_CONTATO = 21;

export default async function PaginaConsultorias({ searchParams }: Props) {
  const { q, status, modalidade } = await searchParams;

  const linhas = await obterRepositorioOperacao().listarLinhasConsultoria();
  const agora = new Date();

  const busca = (q ?? "").trim().toLowerCase();
  const fStatus = STATUS.includes(status as StatusConsultoria)
    ? (status as StatusConsultoria)
    : "";
  const fModalidade = MODALIDADES.includes(modalidade as Modalidade)
    ? (modalidade as Modalidade)
    : "";

  const filtradas = linhas.filter((l) => {
    if (fStatus && l.consultoria.status !== fStatus) return false;
    if (fModalidade && l.consultoria.modalidade !== fModalidade) return false;
    if (busca) {
      const alvo = `${l.consultoria.titulo} ${l.cliente.nomeFantasia}`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });

  function diasSemContato(l: LinhaConsultoria): number | null {
    const ultimo = l.consultoria.ultimoAcompanhamentoEm;
    if (!ultimo) return null;
    return Math.floor((agora.getTime() - ultimo.getTime()) / 86400000);
  }

  const colunas: ColunaLista<LinhaConsultoria>[] = [
    {
      chave: "titulo",
      titulo: "Consultoria",
      destaque: true,
      noCartao: "topo",
      valor: (l) => (
        <>
          <span className="block text-[0.9375rem] font-medium text-tinta">
            {l.cliente.nomeFantasia}
          </span>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {l.consultoria.titulo}
          </span>
        </>
      ),
    },
    {
      chave: "status",
      titulo: "Status",
      noCartao: "linha",
      valor: (l) => (
        <Etiqueta tom={TOM_STATUS_CONSULTORIA[l.consultoria.status]}>
          {ROTULO_STATUS_CONSULTORIA[l.consultoria.status]}
        </Etiqueta>
      ),
    },
    {
      chave: "modalidade",
      titulo: "Modalidade",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">
          {ROTULO_MODALIDADE[l.consultoria.modalidade]}
        </span>
      ),
    },
    {
      chave: "inicio",
      titulo: "Início",
      ocultaEm: "md",
      noCartao: "linha",
      valor: (l) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {dataCurta(l.consultoria.iniciadaEm)}
        </span>
      ),
    },
    {
      chave: "contato",
      titulo: "Último contato",
      noCartao: "linha",
      valor: (l) => {
        const dias = diasSemContato(l);
        if (dias === null) {
          return (
            <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem registro</span>
          );
        }
        const distante = dias >= DIAS_SEM_CONTATO;
        return (
          <span
            className={
              "text-[0.875rem] " + (distante ? "text-[#8a6d1f]" : "text-[var(--tinta-suave)]")
            }
          >
            {desdeQuando(l.consultoria.ultimoAcompanhamentoEm as Date)}
            {distante ? (
              <span className="mt-0.5 block text-[0.75rem]">sem contato há {dias} dias</span>
            ) : null}
          </span>
        );
      },
    },
    {
      chave: "proxima",
      titulo: "Próxima ação",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) => (
        <span className="text-[0.875rem] leading-snug text-[var(--tinta-suave)]">
          {l.consultoria.proximaAcao}
          {l.consultoria.proximaAcaoEm ? (
            <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)] tabular">
              {dataCurta(l.consultoria.proximaAcaoEm)}
            </span>
          ) : null}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Operação"
        titulo="Consultorias"
        descricao="Cada trabalho em andamento, com o status que a consultora atribuiu, o último contato e a próxima ação combinada. O status não muda sozinho: quem decide em que ponto o trabalho está é ela."
        acoes={
          <div className="flex flex-wrap items-center gap-3">
            <NovaConsultoria
              clientes={linhas.map((l) => ({
                id: l.cliente.id,
                nome: l.cliente.nomeFantasia,
              }))}
            />
          </div>
        }
      />

      <Secao
        rotulo={`${filtradas.length} de ${linhas.length}`}
        titulo="Trabalhos"
        descricao="Ordenadas pelo início, da mais recente para a mais antiga."
      >
        <BarraFiltros
          base="/consultorias"
          valores={{ q: busca, status: fStatus, modalidade: fModalidade }}
          busca="q"
          placeholderBusca="Cliente ou título da consultoria…"
          selecoes={[
            {
              chave: "status",
              rotulo: "Status",
              opcoes: STATUS.map((s) => ({ valor: s, texto: ROTULO_STATUS_CONSULTORIA[s] })),
            },
            {
              chave: "modalidade",
              rotulo: "Modalidade",
              opcoes: MODALIDADES.map((m) => ({ valor: m, texto: ROTULO_MODALIDADE[m] })),
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
            href={(l) => `/consultorias/${l.consultoria.id}`}
            vazio={
              linhas.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhuma consultoria iniciada"
                  descricao="Uma consultoria começa quando um cliente é convertido e o escopo é combinado. A partir daí ela aparece aqui com o ponto em que o método está."
                  acao={
                    <BotaoLink href="/clientes" variante="secundario" tamanho="sm">
                      Ver a carteira de clientes
                    </BotaoLink>
                  }
                />
              ) : (
                <EstadoVazio
                  titulo="Nenhuma consultoria com esses filtros"
                  descricao="Existem consultorias cadastradas, mas nenhuma bate com a combinação atual."
                  acao={
                    <BotaoLink href="/consultorias" variante="secundario" tamanho="sm">
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
