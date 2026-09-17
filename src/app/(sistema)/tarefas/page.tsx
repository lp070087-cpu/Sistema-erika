import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import {
  ROTULO_MODALIDADE,
  ROTULO_TIPO_ACOMPANHAMENTO,
  agruparTarefas,
  dataCurta,
  desdeQuando,
  obterRepositorioOperacao,
} from "@/lib/dados";
import { GavetasDeTarefas } from "./gavetas";

export const metadata: Metadata = { title: "Tarefas" };

/**
 * TAREFAS — o centro operacional do dia.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA TELA NÃO É "A LISTA DE TAREFAS"                         │
 * │                                                                      │
 * │ Uma tela que só lista tarefas responde "o que eu tenho". Esta         │
 * │ responde "o que eu faço agora" — e por isso ela traz, junto com as    │
 * │ quatro gavetas, os PRÓXIMOS ACOMPANHAMENTOS.                          │
 * │                                                                      │
 * │ Tarefa e compromisso são coisas diferentes e a consultora trata as    │
 * │ duas no mesmo momento do dia: uma é algo que ela faz, a outra é onde  │
 * │ ela precisa estar. Separá-las em duas telas faria ela abrir duas       │
 * │ telas toda manhã para descobrir o mesmo dia.                          │
 * │                                                                      │
 * │ A agenda aparece como LISTA, não como calendário. A Seção 10 do       │
 * │ briefing pediu para não construir módulo de agenda nem integrar com   │
 * │ calendário externo — e um calendário sem integração seria uma grade   │
 * │ bonita que ela teria que manter em dois lugares.                      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE O SERVIDOR FAZ E O QUE A TELA FAZ                              │
 * │                                                                      │
 * │ O agrupamento em hoje/atrasadas/próximas é feito aqui, com a MESMA    │
 * │ função (`agruparTarefas`) que as outras telas usam — não é uma regra  │
 * │ reescrita na página. É por isso que a contagem do topo sempre bate    │
 * │ com o tamanho das listas.                                             │
 * │                                                                      │
 * │ O instante atual é congelado no servidor e desce como texto ISO.      │
 * │ Se cada componente chamasse `new Date()`, uma tarefa poderia mudar de │
 * │ gaveta entre dois renders e a tela acusaria hidratação divergente.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export default async function PaginaTarefas() {
  const operacao = obterRepositorioOperacao();

  const [tarefas, clientes, consultorias, compromissos, eventos] = await Promise.all([
    operacao.listarTarefas(),
    operacao.listarClientes(),
    operacao.listarConsultorias(),
    operacao.listarCompromissos(),
    operacao.listarAcompanhamentos(),
  ]);

  const agora = new Date();
  const gavetas = agruparTarefas(tarefas, agora);

  const clientePorId = new Map(clientes.map((c) => [c.id, c]));
  const consultoriaPorId = new Map(consultorias.map((c) => [c.id, c]));

  const proximos = [...compromissos].sort((a, b) => a.quando.getTime() - b.quando.getTime());

  const ultimos = [...eventos]
    .sort((a, b) => b.data.getTime() - a.data.getTime())
    .filter((a) => a.proximaAcao.trim().length > 0)
    .slice(0, 4);

  const totalAberto = gavetas.hoje.length + gavetas.atrasadas.length + gavetas.proximas.length;

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Operação"
        titulo="Tarefas"
        descricao="O dia de trabalho: o que atrasou, o que é de hoje, o que vem à frente e onde a consultora precisa estar. Tarefas e compromissos juntos, porque é assim que a manhã dela começa."
        acoes={<Etiqueta tom="oliva">Demonstração</Etiqueta>}
      />

      <FaixaDemonstracao oQue="As tarefas, compromissos e acompanhamentos desta tela são inventados para demonstração. Concluir ou criar tarefas aqui não grava nada: ao recarregar, o estado original volta." />

      {/* Contagens do topo. São contagens — número que se confere abrindo a
          gaveta logo abaixo — e não indicadores de produtividade. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Contagem rotulo="Atrasadas" valor={gavetas.atrasadas.length} tom="dourado" />
        <Contagem rotulo="Hoje" valor={gavetas.hoje.length} />
        <Contagem rotulo="Próximas" valor={gavetas.proximas.length} />
        <Contagem rotulo="Concluídas" valor={gavetas.concluidas.length} tom="verde" />
      </div>

      {/* O aviso de interação fica dentro de <GavetasDeTarefas>, colado nas
          listas que ele descreve — assim as duas coisas não se separam numa
          futura reorganização da página. */}

      {/* As quatro gavetas (§9) ------------------------------------------- */}
      <GavetasDeTarefas
        tarefas={tarefas}
        clientes={clientes}
        consultorias={consultorias}
        agoraISO={agora.toISOString()}
      />

      {/* PRÓXIMOS ACOMPANHAMENTOS (§10) ----------------------------------- */}
      <Secao
        rotulo="Próximos acompanhamentos"
        titulo={proximos.length === 0 ? "Nada na agenda" : `${proximos.length} compromisso(s) marcado(s)`}
        descricao="Visitas, reuniões e retornos já combinados com os clientes, em ordem de data. É uma lista, não um calendário: não há integração com agenda externa, e o sistema não marca nada sozinho."
      >
        {proximos.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum compromisso marcado"
            descricao="Os encontros combinados com os clientes aparecem aqui. Enquanto não houver, esta lista fica vazia — o sistema não sugere datas por conta própria."
          />
        ) : (
          <ul className="divide-y divide-[var(--linha)]">
            {proximos.map((c) => {
              const cliente = clientePorId.get(c.clienteId);
              const consultoria = c.consultoriaId ? consultoriaPorId.get(c.consultoriaId) : null;
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-baseline gap-x-5 gap-y-1.5 py-3.5 first:pt-0 last:pb-0"
                >
                  <span className="w-[104px] shrink-0 text-[0.8125rem] text-[var(--tinta-suave)] tabular">
                    {dataCurta(c.quando)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.9375rem] leading-snug text-tinta">
                      {c.titulo}
                    </span>
                    <span className="mt-1 block text-[0.8125rem] text-[var(--tinta-fraca)]">
                      {cliente ? (
                        <Link href={`/clientes/${cliente.id}`} className="text-oliva hover:underline">
                          {cliente.nomeFantasia}
                        </Link>
                      ) : (
                        "cliente não identificado"
                      )}
                      {consultoria ? ` · ${consultoria.titulo}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Etiqueta>{ROTULO_TIPO_ACOMPANHAMENTO[c.tipo]}</Etiqueta>
                    <span className="text-[0.8125rem] text-[var(--tinta-suave)]">
                      {ROTULO_MODALIDADE[c.modalidade]}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Secao>

      {/* Próximos passos combinados nos últimos encontros ------------------ */}
      <Secao
        rotulo="Ficou combinado"
        titulo="Próximos passos dos últimos encontros"
        descricao="O que ficou de ser feito depois de cada conversa. É por aqui que um compromisso verbal deixa de depender da memória de alguém."
        acoes={
          <Link
            href="/acompanhamentos"
            className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
          >
            Ver acompanhamentos
          </Link>
        }
      >
        {ultimos.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum encontro com próximo passo"
            descricao="Ao registrar um acompanhamento, o próximo passo combinado é anotado junto — e é ele que aparece nesta lista."
          />
        ) : (
          <ul className="divide-y divide-[var(--linha)]">
            {ultimos.map((a) => {
              const cliente = clientePorId.get(a.clienteId);
              return (
                <li key={a.id} className="py-3.5 first:pt-0 last:pb-0">
                  <p className="text-[0.9375rem] leading-snug text-tinta">{a.proximaAcao}</p>
                  <p className="mt-1.5 text-[0.8125rem] text-[var(--tinta-suave)]">
                    {cliente ? (
                      <Link
                        href={`/clientes/${cliente.id}`}
                        className="text-oliva hover:underline"
                      >
                        {cliente.nomeFantasia}
                      </Link>
                    ) : null}
                    {" · "}
                    <span className="text-[var(--tinta-fraca)]">
                      {dataCurta(a.data)} · {desdeQuando(a.data)}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Secao>

      <p className="text-[0.8125rem] text-[var(--tinta-fraca)]">
        {totalAberto} tarefa(s) em aberto e {gavetas.concluidas.length} concluída(s) — contagem
        própria desta tela, sem peso nem pontuação. O sistema não calcula
        produtividade: quem sabe se a semana rendeu é a consultora.
      </p>
    </div>
  );
}

function Contagem({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: number;
  tom?: "dourado" | "verde";
}) {
  const cor =
    valor === 0
      ? "text-[var(--tinta-fraca)]"
      : tom === "dourado"
        ? "text-[#8a6d1f]"
        : tom === "verde"
          ? "text-medio"
          : "text-tinta";

  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5">
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </p>
      <p className={`mt-1.5 tabular text-[1.5rem] leading-none ${cor}`}>{valor}</p>
    </div>
  );
}
