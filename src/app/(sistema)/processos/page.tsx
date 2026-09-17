import type { Metadata } from "next";
import Link from "next/link";
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
  obterRepositorioOperacao,
  passosSemTempo,
  somaDosTemposDeclarados,
} from "@/lib/dados";
import type { Modalidade, Processo } from "@/lib/dados";
import { NovoProcesso } from "./novo";

export const metadata: Metadata = { title: "Processos e praças" };

/**
 * PROCESSOS E PRAÇAS — a biblioteca dos fluxos de cozinha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE É UMA "PRAÇA" AQUI                                             │
 * │                                                                      │
 * │ Praça é o posto de trabalho da cozinha: o passe, a confeitaria, o    │
 * │ grill. Um processo é o que acontece NAQUELA praça, na ordem em que    │
 * │ acontece, com quem executa cada passo.                                │
 * │                                                                      │
 * │ O módulo existe por um motivo que a Fase 0 registrou e que vale      │
 * │ repetir: quando ninguém escreve o fluxo, cada pessoa monta de um      │
 * │ jeito, e a variação come entre turnos sem aparecer em lugar nenhum.   │
 * │ Um padrão no passe é o que faz o prato sair igual às 11h40 e às 13h50.│
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O TEMPO É DECLARADO, E A TELA DIZ ISSO                               │
 * │                                                                      │
 * │ "4 min" é a soma do que a equipe informou. O sistema não cronometra   │
 * │ nada, não mede produtividade e não compara praças entre si.           │
 * │                                                                      │
 * │ Quando nenhum passo tem tempo declarado, a coluna mostra "sem        │
 * │ tempo" — e não zero. `somaDosTemposDeclarados` devolve `null` nesse   │
 * │ caso justamente para que a tela não possa escrever "0 min", que      │
 * │ seria uma afirmação falsa sobre a cozinha de alguém.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = {
  searchParams: Promise<{ q?: string; cliente?: string; modalidade?: string }>;
};

export default async function PaginaProcessos({ searchParams }: Props) {
  const { q, cliente, modalidade } = await searchParams;
  const operacao = obterRepositorioOperacao();

  const [processos, clientes, fichas] = await Promise.all([
    operacao.listarProcessos(),
    operacao.listarClientes(),
    // Os pratos de um processo são as FICHAS do cliente. Vincular a praça a
    // um texto livre criaria "Costela" e "costela ao molho" como dois pratos
    // diferentes, e o filtro por prato deixaria de funcionar.
    operacao.listarFichas(),
  ]);

  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  // Nome do prato por cliente, para o formulário oferecer o que existe.
  const pratosDoCliente: Record<string, string[]> = {};
  for (const f of fichas) {
    const lista = pratosDoCliente[f.clienteId] ?? [];
    lista.push(f.nome);
    pratosDoCliente[f.clienteId] = lista;
  }

  // As praças que já existem na base — para não inventar nomes novos a cada
  // cadastro. Quem escreve "Passe" e depois "passe" cria duas praças.
  const pracasExistentes = [...new Set(processos.map((p) => p.praca))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  const busca = (q ?? "").trim().toLowerCase();
  const fCliente = clientes.some((c) => c.id === cliente) ? (cliente as string) : "";
  const fModalidade = (["PRESENCIAL", "ONLINE", "MISTA"] as const).includes(
    modalidade as Modalidade
  )
    ? (modalidade as Modalidade)
    : "";

  // A modalidade é do CLIENTE, não do processo — um processo não tem
  // modalidade própria. Filtrar por ela é filtrar pelo atendimento do
  // cliente dono do processo, e a lista precisa dizer isso.
  const filtrados = processos.filter((p) => {
    if (fCliente && p.clienteId !== fCliente) return false;
    if (fModalidade) {
      const dono = clientePorId.get(p.clienteId);
      if (!dono || dono.modalidade !== fModalidade) return false;
    }
    if (busca) {
      const dono = clientePorId.get(p.clienteId);
      const alvo = `${p.praca} ${p.responsavel} ${p.turno} ${p.pratos.join(" ")} ${
        dono?.nomeFantasia ?? ""
      }`.toLowerCase();
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });

  const colunas: ColunaLista<Processo>[] = [
    {
      chave: "praca",
      titulo: "Praça",
      destaque: true,
      noCartao: "topo",
      valor: (p) => {
        const dono = clientePorId.get(p.clienteId);
        return (
          <>
            <span className="block text-[0.9375rem] font-medium text-tinta">{p.praca}</span>
            <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
              {dono ? (
                <Link href={`/clientes/${dono.id}`} className="text-oliva hover:underline">
                  {dono.nomeFantasia}
                </Link>
              ) : (
                "cliente não identificado"
              )}
            </span>
          </>
        );
      },
    },
    {
      chave: "turno",
      titulo: "Turno",
      noCartao: "linha",
      valor: (p) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">{p.turno}</span>
      ),
    },
    {
      chave: "responsavel",
      titulo: "Responsável",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (p) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">{p.responsavel}</span>
      ),
    },
    {
      chave: "pratos",
      titulo: "Pratos",
      align: "dir",
      ocultaEm: "md",
      noCartao: "linha",
      valor: (p) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {p.pratos.length}
        </span>
      ),
    },
    {
      chave: "passos",
      titulo: "Passos",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (p) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {p.passos.length}
        </span>
      ),
    },
    {
      chave: "tempo",
      titulo: "Tempo declarado",
      align: "dir",
      noCartao: "linha",
      valor: (p) => {
        const sem = passosSemTempo(p);
        if (sem === p.passos.length) {
          return (
            <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem tempo</span>
          );
        }
        const soma = somaDosTemposDeclarados(p, "todos");
        return (
          <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
            {soma} min
            {sem > 0 ? (
              <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                {sem} passo(s) sem tempo
              </span>
            ) : null}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Operação"
        titulo="Processos e praças"
        descricao="Os fluxos de finalização de cada cozinha, praça por praça: a ordem dos passos, quem executa e o tempo que a equipe declarou. É o que faz o prato sair igual nos dois turnos."
        acoes={
          <div className="flex flex-wrap items-center gap-3">
            <Etiqueta tom="oliva">Demonstração</Etiqueta>
            <NovoProcesso
              clientes={clientes.map((c) => ({ id: c.id, nome: c.nomeFantasia }))}
              pratosDoCliente={pratosDoCliente}
              pracasExistentes={pracasExistentes}
            />
          </div>
        }
      />

      <FaixaDemonstracao oQue="As praças, os passos e os tempos desta tela são inventados para demonstração. Os tempos são o que a equipe fictícia declarou — o sistema não cronometra nada." />

      <Secao
        rotulo={`${filtrados.length} de ${processos.length}`}
        titulo="Fluxos mapeados"
        descricao="Cada processo é uma praça. A ordem dos passos é a que a equipe executa, escrita durante a visita — o sistema não sugere sequência nem calcula tempo padrão."
      >
        <BarraFiltros
          base="/processos"
          valores={{ q: busca, cliente: fCliente, modalidade: fModalidade }}
          busca="q"
          placeholderBusca="Praça, prato ou responsável…"
          selecoes={[
            {
              chave: "cliente",
              rotulo: "Cliente",
              opcoes: clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia })),
            },
            {
              chave: "modalidade",
              rotulo: "Modalidade do cliente",
              opcoes: (["PRESENCIAL", "ONLINE", "MISTA"] as const).map((m) => ({
                valor: m,
                texto: ROTULO_MODALIDADE[m],
              })),
            },
          ]}
          acoes={
            <BotaoLink href="/clientes" variante="secundario" tamanho="sm">
              Ver clientes
            </BotaoLink>
          }
        />

        <p className="mt-3 text-[0.75rem] text-[var(--tinta-fraca)]">
          A modalidade é do cliente, não do processo: um fluxo de cozinha não é
          presencial nem online. O filtro serve para ver as praças de quem é
          atendido de cada jeito.
        </p>

        <div className="mt-5">
          <ListaResponsiva
            itens={filtrados}
            colunas={colunas}
            href={(p) => `/processos/${p.id}`}
            vazio={
              processos.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhum processo mapeado"
                  descricao="O processo é escrito durante a visita, observando o serviço. Cada passo vira uma linha com quem executa e quanto tempo leva."
                  acao={
                    <NovoProcesso
                      clientes={clientes.map((c) => ({ id: c.id, nome: c.nomeFantasia }))}
                      pratosDoCliente={pratosDoCliente}
                      pracasExistentes={pracasExistentes}
                    />
                  }
                />
              ) : (
                <EstadoVazio
                  titulo="Nenhum processo com esses filtros"
                  descricao="Existem processos cadastrados, mas nenhum bate com a combinação atual."
                  acao={
                    <BotaoLink href="/processos" variante="secundario" tamanho="sm">
                      Limpar filtros
                    </BotaoLink>
                  }
                />
              )
            }
          />
        </div>
      </Secao>

      <Secao
        rotulo="Como este módulo é usado"
        titulo="Os três momentos de um processo"
        descricao="Não é uma regra do sistema — é o uso que a consultoria faz dele. Nenhuma etapa avança sozinha."
      >
        <ol className="space-y-4">
          {[
            {
              n: "01",
              t: "Durante a visita",
              d: "Ela acompanha o serviço e escreve o que vê: a ordem real dos passos, não a ideal. É o momento em que a variação entre turnos aparece.",
            },
            {
              n: "02",
              t: "Depois, com a equipe",
              d: "O fluxo é conferido com quem executa. O tempo de cada passo entra aqui — declarado pela equipe, não medido com cronômetro.",
            },
            {
              n: "03",
              t: "No passe, afixado",
              d: "O padrão impresso é o que faz a montagem não depender da memória de quem está no turno. Os passos sem tempo ficam marcados até alguém informar.",
            },
          ].map((e) => (
            <li key={e.n} className="flex gap-4">
              <span className="shrink-0 pt-0.5 text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] tabular">
                {e.n}
              </span>
              <div className="min-w-0">
                <p className="text-[0.9375rem] font-medium text-tinta">{e.t}</p>
                <p className="mt-1 max-w-[70ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                  {e.d}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Secao>

      <p className="text-[0.8125rem] text-[var(--tinta-fraca)]">
        Cada processo pertence a um cliente e aparece também na aba Processos
        dele. Um processo sem cliente não existe no modelo — praça é sempre a
        praça de alguma cozinha.
      </p>
    </div>
  );
}
