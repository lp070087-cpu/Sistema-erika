import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, Painel, Secao } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { LinhaDoTempo } from "@/components/ui/linha-do-tempo";
import { dataCurta, desdeQuando, obterRepositorioOperacao } from "@/lib/dados";
import type { PrecoIngrediente } from "@/lib/dados";

export const metadata: Metadata = { title: "Ingrediente" };

/**
 * DETALHE DO INSUMO — o histórico de preço, e onde ele entra.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA TELA VALE MAIS QUE A LISTA                              │
 * │                                                                      │
 * │ A lista responde "quanto está". Esta tela responde as duas perguntas  │
 * │ que vêm depois, e que são as que dão trabalho:                        │
 * │                                                                      │
 * │   1. desde quando está assim, e quanto estava antes                   │
 * │   2. em quais fichas esse preço entrou                                 │
 * │                                                                      │
 * │ A segunda é a que fecha o ciclo. Ver a mussarela subir não leva a     │
 * │ nada; ver a mussarela subir E as quatro fichas que carregam aquele    │
 * │ preço antigo é o que faz a revisão acontecer.                         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA NÃO FAZ — E A FRASE ESTÁ NO CORPO DELA, NÃO SÓ AQUI  │
 * │                                                                      │
 * │ Não recalcula nada. Não estima o impacto no custo de nenhum prato.    │
 * │ Não sugere reprecificar.                                              │
 * │                                                                      │
 * │ O motivo é concreto: não se sabe de onde o preço vem (ela digita na   │
 * │ visita? o cliente manda por mensagem? sai de nota?) nem de quanto em  │
 * │ quanto tempo é atualizado. Sem isso, um "impacto no custo" seria uma  │
 * │ multiplicação sobre uma base de que ninguém sabe a procedência.       │
 * │ Mostrar a variação é fato; calcular o efeito dela é metodologia — e   │
 * │ metodologia aqui ainda não existe.                                    │
 * │                                                                      │
 * │ A lista de decisões que travam o custo fica na tela da ficha, junto    │
 * │ da composição — que é onde a pergunta nasce. Repeti-la aqui seria     │
 * │ pedir que a consultora lesse o mesmo bloqueio duas vezes.              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = { params: Promise<{ id: string }> };

/** De onde veio o número. É procedência, não confiabilidade. */
const ROTULO_ORIGEM: Record<PrecoIngrediente["origem"], string> = {
  CONSULTORA: "informado pela consultoria",
  CLIENTE: "informado pelo cliente",
  IMPORTADO: "importado de planilha antiga",
};

export default async function PaginaIngrediente({ params }: Props) {
  const { id } = await params;
  const operacao = obterRepositorioOperacao();

  const ingrediente = await operacao.obterIngrediente(id);
  if (!ingrediente) notFound();

  const [fichas, clientes] = await Promise.all([
    operacao.listarFichas(),
    operacao.listarClientes(),
  ]);

  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  // Em quais fichas este insumo entra. É a pergunta "onde esse preço
  // aparece" — a que transforma um número solto em trabalho a fazer.
  const fichasComInsumo = fichas
    .map((ficha) => {
      const item = ficha.itens.find((i) => i.ingredienteId === ingrediente.id);
      return item ? { ficha, item } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const historico = [...ingrediente.historico].sort((a, b) => b.em.getTime() - a.em.getTime());

  // Quantas fichas guardaram um preço de referência diferente do vigente.
  // É uma CONTAGEM de igualdade — não uma estimativa de impacto.
  const comPrecoDiferente = fichasComInsumo.filter(
    ({ item }) => item.precoReferencia !== null && item.precoReferencia !== ingrediente.precoAtual
  ).length;

  return (
    <div className="space-y-6">
      <Link
        href="/ingredientes"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para a biblioteca
      </Link>

      <CabecalhoPagina
        rotulo={ingrediente.categoria}
        titulo={ingrediente.nome}
        descricao={
          ingrediente.precoAtual === null
            ? "Sem preço registrado."
            : `R$ ${ingrediente.precoAtual.toFixed(2).replace(".", ",")} por ${
                ingrediente.unidade
              }, vigente desde ${dataCurta(ingrediente.atualizadoEm)}.`
        }
        acoes={
          <div className="flex flex-wrap items-center gap-2">
            <Etiqueta tom="oliva">Demonstração</Etiqueta>
            {historico.length > 1 ? (
              <Etiqueta>{historico.length} registros</Etiqueta>
            ) : null}
          </div>
        }
      />

      <FaixaDemonstracao oQue="Este insumo, os preços e o fornecedor são inventados para demonstração. Nenhum valor corresponde a um fornecedor real." />

      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        <ListaDados colunas={3}>
          <Dado rotulo="Categoria">{ingrediente.categoria}</Dado>
          <Dado rotulo="Unidade de compra">{ingrediente.unidade}</Dado>
          <Dado rotulo="Preço vigente">
            {ingrediente.precoAtual === null
              ? "sem preço"
              : `R$ ${ingrediente.precoAtual.toFixed(2).replace(".", ",")}`}
          </Dado>
          <Dado rotulo="Fornecedor atual">{ingrediente.fornecedor || "não informado"}</Dado>
          <Dado rotulo="Vigente desde">
            {dataCurta(ingrediente.atualizadoEm)} · {desdeQuando(ingrediente.atualizadoEm)}
          </Dado>
          <Dado rotulo="Usado em">
            {fichasComInsumo.length === 0
              ? "nenhuma ficha"
              : `${fichasComInsumo.length} ${fichasComInsumo.length === 1 ? "ficha" : "fichas"}`}
          </Dado>
        </ListaDados>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        {/* HISTÓRICO ------------------------------------------------------ */}
        <Secao
          rotulo={`${historico.length} ${historico.length === 1 ? "registro" : "registros"}`}
          titulo="Histórico de preço"
          descricao="Do mais recente para o mais antigo. Cada linha é um preço que passou a valer numa data — não uma estimativa."
        >
          <LinhaDoTempo
            eventos={historico.map((p, i) => ({
              id: p.id,
              quando: dataCurta(p.em),
              titulo: `R$ ${p.valor.toFixed(2).replace(".", ",")} por ${p.unidade}`,
              descricao: p.fornecedor || "fornecedor não informado",
              tipo: i === 0 ? "vigente" : ROTULO_ORIGEM[p.origem],
              valor: <Variacao atual={p.valor} anterior={historico[i + 1]?.valor ?? null} />,
            }))}
            vazio={
              <p className="text-[0.875rem] text-[var(--tinta-suave)]">
                Nenhum preço registrado para este insumo ainda.
              </p>
            }
          />

          <p className="mt-5 max-w-[75ch] text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
            A variação ao lado de cada linha é a diferença em relação ao
            registro anterior — uma subtração, com o sinal do lado. Ela não
            indica se a alta é preocupante: um hortifrúti que sobe em julho e
            volta em agosto é sazonalidade, e quem lê isso é a consultora,
            olhando o cliente. O sistema não classifica o que é “muita” alta
            nem marca nada em vermelho, porque essa régua não é dele.
          </p>
        </Secao>

        {/* LADO: onde entra, procedência ---------------------------------- */}
        <div className="space-y-6">
          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              De onde vêm estes preços
            </p>
            <ul className="mt-3 space-y-2.5">
              {(["CONSULTORA", "CLIENTE", "IMPORTADO"] as const).map((origem) => {
                const quantos = historico.filter((p) => p.origem === origem).length;
                if (quantos === 0) return null;
                return (
                  <li key={origem} className="flex items-baseline justify-between gap-3">
                    <span className="text-[0.8125rem] leading-snug text-[var(--tinta-suave)]">
                      {ROTULO_ORIGEM[origem]}
                    </span>
                    <span className="shrink-0 tabular text-[0.8125rem] text-[var(--tinta-fraca)]">
                      {quantos}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
              Isto é procedência, não confiabilidade: um preço de planilha
              antiga importada pode estar certo. A origem fica registrada para
              que dê para saber o que perguntar depois.
            </p>
          </Painel>

          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              O que ainda não acontece
            </p>
            <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Atualizar o preço aqui <span className="font-medium text-tinta">não</span>{" "}
              recalcula as fichas que usam este insumo. A ficha guarda o preço
              do dia em que foi escrita, e ele continua lá.
            </p>
            <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              O recálculo automático depende de duas coisas que ainda não foram
              decididas: de onde vem o preço e de quanto em quanto tempo ele é
              atualizado, e o que deve acontecer com as fichas antigas quando
              ele mudar. Enquanto isso não fecha, o sistema mostra a diferença
              e deixa a decisão com você.
            </p>
          </Painel>
        </div>
      </div>

      {/* ONDE ESTE PREÇO ENTRA ---------------------------------------------- */}
      <Secao
        rotulo={`${fichasComInsumo.length} ${fichasComInsumo.length === 1 ? "ficha" : "fichas"}`}
        titulo="Onde este insumo entra"
        descricao="Cada ficha guarda o preço de referência do dia em que foi escrita. A comparação com o preço vigente aparece ao lado do valor — sem juízo sobre o que fazer com ele."
      >
        {fichasComInsumo.length === 0 ? (
          <p className="text-[0.875rem] text-[var(--tinta-suave)]">
            Este insumo ainda não aparece em nenhuma ficha. Ele entra na
            biblioteca e passa a ser reutilizável a partir da primeira ficha
            que o mencionar.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--linha)]">
            {fichasComInsumo.map(({ ficha, item }) => {
              const dono = clientePorId.get(ficha.clienteId);
              const diferente =
                item.precoReferencia !== null && item.precoReferencia !== ingrediente.precoAtual;
              return (
                <li key={ficha.id} className="py-3.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
                    <div className="min-w-0">
                      <Link
                        href={`/fichas/${ficha.id}`}
                        className="text-[0.9375rem] text-tinta hover:text-oliva"
                      >
                        {ficha.nome}
                      </Link>
                      <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
                        {dono ? dono.nomeFantasia : "cliente não identificado"} ·{" "}
                        <span className="tabular">
                          {item.quantidade} {item.unidade}
                        </span>
                      </span>
                    </div>
                    <div className="text-right">
                      {item.precoReferencia === null ? (
                        <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem preço</span>
                      ) : (
                        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
                          R$ {item.precoReferencia.toFixed(2).replace(".", ",")}
                          <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                            preço de referência da ficha
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  {diferente ? (
                    <p className="mt-1.5 text-[0.75rem] text-[var(--tinta-fraca)]">
                      O preço guardado nesta ficha é diferente do vigente hoje.
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}

        {comPrecoDiferente > 0 ? (
          <p className="mt-4 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
            {comPrecoDiferente === 1
              ? "Uma ficha carrega um preço de referência diferente do vigente."
              : `${comPrecoDiferente} fichas carregam um preço de referência diferente do vigente.`}{" "}
            Isso não é erro nem alerta: é o registro de quando cada ficha foi
            escrita. Serve para saber quais valem uma releitura.
          </p>
        ) : null}
      </Secao>

      <Aviso tom="info" titulo="O que ainda não está nesta tela">
        <p>
          Impacto no custo dos pratos, CMV, sugestão de novo preço de venda e
          qualquer comparação entre fornecedores não aparecem — nem como
          estimativa. Todos dependem de decisões de metodologia que ainda não
          foram tomadas, e um número inventado aqui seria lido como certo,
          porque teria a aparência exata de um número certo.
        </p>
        <p className="mt-2.5">
          O que esta tela já faz é o que não depende de decisão nenhuma:
          guardar o preço com a data e a origem, mostrar a variação e apontar
          em quais fichas aquele preço entrou. O resto entra depois, sem que
          nenhum preço precise ser redigitado.
        </p>
      </Aviso>
    </div>
  );
}

/**
 * A variação entre esta linha e a anterior, com o sinal do lado.
 *
 * Sem cor de alarme e sem seta: alta e queda recebem o mesmo tratamento,
 * pelo mesmo motivo que a lista não classifica. O que é "muita" alta
 * depende do insumo, do prato e do cliente.
 */
function Variacao({ atual, anterior }: { atual: number; anterior: number | null }) {
  if (anterior === null || anterior <= 0) {
    return (
      <span className="text-[0.75rem] text-[var(--tinta-fraca)]">primeiro registro</span>
    );
  }

  const variacao = ((atual - anterior) / anterior) * 100;

  return (
    <span className="tabular text-[0.8125rem] text-[var(--tinta-suave)]">
      {variacao > 0 ? "+" : ""}
      {variacao.toFixed(1).replace(".", ",")}%
      <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
        sobre R$ {anterior.toFixed(2).replace(".", ",")}
      </span>
    </span>
  );
}
