import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { BarraFiltros } from "@/components/ui/filtros";
import {
  ROTULO_TIPO_ACOMPANHAMENTO,
  obterRepositorioOperacao,
  proximosEncontros,
} from "@/lib/dados";
import type { TipoAcompanhamento } from "@/lib/dados";
import { RegistroDeAcompanhamento } from "./registro";

export const metadata: Metadata = { title: "Acompanhamentos" };

/**
 * §17 — ACOMPANHAMENTOS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE É O MÓDULO QUE DECIDE A CONSULTORIA                     │
 * │                                                                      │
 * │ Diagnóstico, ficha e processo são documentos: existem uma vez e       │
 * │ ficam. Acompanhamento é o que acontece ENTRE eles — e é onde o        │
 * │ trabalho de consultoria realmente vive ou morre.                      │
 * │                                                                      │
 * │ Sem registro, a memória de seis meses de acompanhamento fica na       │
 * │ cabeça dela e em conversa de WhatsApp. Com registro, a próxima        │
 * │ reunião começa com uma releitura de trinta segundos: o que ficou      │
 * │ pendente, o que foi combinado, o que ficou de ser enviado.            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A LISTA É FILTRÁVEL, E O FILTRO É POR TIPO E POR CLIENTE             │
 * │                                                                      │
 * │ "Visitas" e "reuniões online" são conversas diferentes, com preparos  │
 * │ diferentes. Poder ver só um dos dois é o que faz a lista servir para  │
 * │ alguma coisa antes de sair para uma visita: as últimas cinco visitas  │
 * │ daquele cliente dizem mais do que os últimos vinte registros.         │
 * │                                                                      │
 * │ A tela não calcula intervalo médio entre encontros, frequência nem   │
 * │ produtividade — nenhuma dessas contas foi pedida, e todas           │
 * │ dependeriam de uma régua que não existe.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = {
  searchParams: Promise<{ cliente?: string; tipo?: string; consultoria?: string }>;
};

const TIPOS: readonly TipoAcompanhamento[] = ["REUNIAO", "VISITA", "ANALISE", "RETORNO", "REVISAO"];

export default async function PaginaAcompanhamentos({ searchParams }: Props) {
  const { cliente, tipo, consultoria } = await searchParams;
  const operacao = obterRepositorioOperacao();

  const [acompanhamentos, clientes, consultorias] = await Promise.all([
    operacao.listarAcompanhamentos(),
    operacao.listarClientes(),
    operacao.listarConsultorias(),
  ]);

  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  const fCliente = clientes.some((c) => c.id === cliente) ? (cliente as string) : "";
  const fTipo = TIPOS.includes(tipo as TipoAcompanhamento) ? (tipo as TipoAcompanhamento) : "";
  const fConsultoria = consultorias.some((c) => c.id === consultoria)
    ? (consultoria as string)
    : "";

  const filtrados = acompanhamentos.filter((a) => {
    if (fCliente && a.clienteId !== fCliente) return false;
    if (fTipo && a.tipo !== fTipo) return false;
    if (fConsultoria && a.consultoriaId !== fConsultoria) return false;
    return true;
  });

  // O que ficou combinado e ainda não foi feito. Não é uma cobrança
  // automática: é a mesma informação que o cartão mostra, reunida num
  // lugar só, para a leitura antes do próximo encontro.
  const proximos = proximosEncontros(acompanhamentos);

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Operação"
        titulo="Acompanhamentos"
        descricao="O diário do relacionamento: o que foi discutido em cada reunião, visita ou análise, o que ficou pendente e qual é o próximo passo. É a memória que hoje vive em caderno e mensagem solta."
      />

      <BarraFiltros
        base="/acompanhamentos"
        valores={{ cliente: fCliente, tipo: fTipo, consultoria: fConsultoria }}
        busca={null}
        selecoes={[
          {
            chave: "cliente",
            rotulo: "Cliente",
            opcoes: clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia })),
          },
          {
            chave: "tipo",
            rotulo: "Tipo",
            opcoes: TIPOS.map((t) => ({ valor: t, texto: ROTULO_TIPO_ACOMPANHAMENTO[t] })),
          },
          {
            chave: "consultoria",
            rotulo: "Consultoria",
            opcoes: consultorias.map((c) => ({ valor: c.id, texto: c.titulo })),
          },
        ]}
      />

      {/* O que ficou combinado — a leitura de trinta segundos. */}
      {proximos.length > 0 && !fCliente && !fTipo && !fConsultoria ? (
        <section className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-dourado bg-[rgba(201,165,78,0.06)] px-5 py-4">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            Ficou combinado
          </p>
          <p className="mt-1.5 text-[0.8125rem] text-[var(--tinta-suave)]">
            O próximo passo registrado nos encontros mais recentes de cada
            cliente. Não é cobrança automática — é a mesma informação dos
            cartões, reunida para a releitura antes do próximo encontro.
          </p>
          <ul className="mt-3.5 divide-y divide-[var(--linha)]">
            {proximos.map(({ acompanhamento }) => {
              const dono = clientePorId.get(acompanhamento.clienteId);
              return (
              <li
                key={acompanhamento.id}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <span className="text-[0.875rem] leading-snug text-tinta">
                    {acompanhamento.proximaAcao}
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                    {dono ? dono.nomeFantasia : "cliente não identificado"} ·{" "}
                    {ROTULO_TIPO_ACOMPANHAMENTO[acompanhamento.tipo]}
                  </span>
                </div>
              </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <RegistroDeAcompanhamento
        acompanhamentos={filtrados}
        clientes={clientes}
        consultorias={consultorias}
      />

      <p className="text-[0.8125rem] text-[var(--tinta-fraca)]">
        Cada acompanhamento pertence a uma consultoria, e a consultoria a um
        cliente. É esse encadeamento que faz o histórico aparecer na aba do
        cliente e no detalhe da consultoria sem precisar ser redigitado.
      </p>
    </div>
  );
}
