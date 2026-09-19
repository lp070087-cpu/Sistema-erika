import type { ReactNode } from "react";
import { PreviaTabular } from "@/components/ui/previa-tabular";
import type { ColunaPrevia, LinhaPrevia } from "@/components/ui/previa-tabular";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, EstadoVazio } from "@/components/ui/superficie";
import {
  ROTULO_MODALIDADE,
  ROTULO_PRIORIDADE,
  ROTULO_STATUS_TAREFA,
  ROTULO_TIPO_ACOMPANHAMENTO,
  TOM_PRIORIDADE,
  dataCurta,
} from "@/lib/dados";
import type { Acompanhamento, ClienteOperacao, Tarefa } from "@/lib/dados";
import {
  ordenarAcompanhamentosDoRelatorio,
  ordenarTarefasDoRelatorio,
  situacaoDoPrazo,
} from "@/lib/planilhas/relatorio";

/**
 * A PRÉVIA DO RELATÓRIO — a planilha antes do download.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA PRÉVIA É UM COMPONENTE SEPARADO DE QUEM A USA            │
 * │                                                                      │
 * │ Ela não é um desenho da tela: é a aba TAREFAS e a aba ACOMPANHAMENTOS  │
 * │ do arquivo, na ordem e com o texto que o arquivo vai ter. Quem decide  │
 * │ isso é `@/lib/planilhas/relatorio`, o mesmo módulo que o gerador usa — │
 * │ então a grade que a Érika confere aqui e a grade que ela abre no Excel │
 * │ não têm como divergir.                                                 │
 * │                                                                      │
 * │ Estar separada da página é o que permite a página ser de servidor. Só  │
 * │ esta peça é de cliente, e só porque o cliente escolhido vem da URL,    │
 * │ que troca sem recarregar.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS DUAS ABAS QUE NÃO APARECEM AQUI, E POR QUE NÃO APARECEM            │
 * │                                                                      │
 * │ O arquivo tem quatro abas. Duas são TABELAS e estão abaixo. As outras  │
 * │ duas — o resumo do cliente e a aba que explica de onde vieram os       │
 * │ dados — são páginas de leitura: rótulo à esquerda, valor à direita,     │
 * │ sete blocos numa.                                                      │
 * │                                                                      │
 * │ Reproduzi-las aqui como grade daria uma tabela de vinte linhas de      │
 * │ rótulo, que é o arquivo lido em voz alta e não conferido — e o olho    │
 * │ humano não confere vinte pares rótulo/valor, ele passa reto. A legenda │
 * │ diz que elas existem e o que trazem, para a prévia não esconder nada.   │
 * │                                                                      │
 * │ E há uma terceira razão, mais prática: o resumo é o retrato do         │
 * │ CADASTRO. Quem quiser conferi-lo tem a ficha do cliente aberta a um    │
 * │ clique, na tela de origem do dado — que é onde ele se corrige.         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA PRÉVIA NÃO FAZ                                             │
 * │                                                                      │
 * │ Não soma, não arredonda, não recalcula. Ela posiciona células que já    │
 * │ vêm prontas — a mesma regra de `PreviaTabular`, e a mesma do resto do  │
 * │ sistema: quem faz conta é o domínio, em função pura. Uma prévia que     │
 * │ calculasse por conta própria seria um segundo lugar onde os números     │
 * │ nascem, e dois lugares para o mesmo número divergem.                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const COLUNAS_TAREFAS: readonly ColunaPrevia[] = [
  { chave: "tarefa", titulo: "Tarefa", larguraMinima: 260 },
  { chave: "status", titulo: "Status", larguraMinima: 120 },
  { chave: "prioridade", titulo: "Prioridade", larguraMinima: 100 },
  { chave: "prazo", titulo: "Prazo", align: "centro", larguraMinima: 100 },
  { chave: "situacao", titulo: "Situação do prazo", align: "dir", larguraMinima: 150 },
];

const COLUNAS_ACOMPANHAMENTOS: readonly ColunaPrevia[] = [
  { chave: "data", titulo: "Data", align: "centro", larguraMinima: 100 },
  { chave: "tipo", titulo: "Tipo", larguraMinima: 130 },
  { chave: "modalidade", titulo: "Modalidade", larguraMinima: 110 },
  { chave: "titulo", titulo: "Título", larguraMinima: 220 },
  { chave: "resumo", titulo: "Resumo", larguraMinima: 380 },
  { chave: "pendencias", titulo: "Pendências", larguraMinima: 240 },
];

export function PreviaDoRelatorio({
  cliente,
  tarefas,
  acompanhamentos,
}: {
  cliente: ClienteOperacao | null;
  /** As tarefas JÁ recortadas para este cliente. Recortar é da página. */
  tarefas: readonly Tarefa[];
  acompanhamentos: readonly Acompanhamento[];
}) {
  /*
    A data da prévia é a de agora, e é a mesma coisa que o arquivo vai usar:
    a rota gera com `new Date()` no momento do clique. "Vence hoje" na tela e
    "vence hoje" no arquivo, e não uma divergência de um dia entre os dois.
  */
  const agora = new Date();

  const ordenadas = ordenarTarefasDoRelatorio(tarefas);
  const ordenados = ordenarAcompanhamentosDoRelatorio(acompanhamentos);

  const linhasDeTarefa: LinhaPrevia[] = ordenadas.map((t, i) => ({
    id: `${t.id}-${i}`,
    celulas: {
      tarefa: t.titulo,
      status: ROTULO_STATUS_TAREFA[t.status],
      prioridade: (
        <Etiqueta tom={TOM_PRIORIDADE[t.prioridade]}>
          {ROTULO_PRIORIDADE[t.prioridade]}
        </Etiqueta>
      ),
      prazo: t.prazo ? (
        <span className="tabular">{dataCurta(t.prazo)}</span>
      ) : (
        <span className="text-[var(--tinta-fraca)]">—</span>
      ),
      situacao: (
        <span
          className={
            t.status !== "CONCLUIDA" && t.prazo && situacaoDoPrazo(t, agora).startsWith("venc")
              ? "text-[#8a2b20]"
              : undefined
          }
        >
          {situacaoDoPrazo(t, agora)}
        </span>
      ),
    },
  }));

  const linhasDeAcompanhamento: LinhaPrevia[] = ordenados.map((a, i) => ({
    id: `${a.id}-${i}`,
    celulas: {
      data: <span className="tabular">{dataCurta(a.data)}</span>,
      tipo: ROTULO_TIPO_ACOMPANHAMENTO[a.tipo],
      modalidade: ROTULO_MODALIDADE[a.modalidade],
      titulo: a.titulo,
      resumo: a.resumo,
      pendencias:
        a.pendencias.length === 0 ? (
          <span className="text-[var(--tinta-fraca)]">—</span>
        ) : (
          <span className="block max-w-[38ch] whitespace-normal">
            {a.pendencias.map((p) => (
              <span key={p} className="block">
                • {p}
              </span>
            ))}
          </span>
        ),
    },
  }));

  if (!cliente) {
    return (
      <EstadoVazio
        titulo="Escolha um cliente para ver a prévia"
        descricao="A prévia mostra o que sairia na planilha deste cliente: as tarefas dele, na ordem em que o arquivo grava, e os encontros do mais recente para o mais antigo."
      />
    );
  }

  const total = tarefas.length + acompanhamentos.length;

  return (
    <div className="space-y-6">
      {/*
        A PRIMEIRA COISA É O QUE ESTA GRADE É — e a frase não pode prometer
        mais do que ela entrega. "É uma fotografia do arquivo" seria forte
        demais: o arquivo tem quatro abas e aqui aparecem duas.
      */}
      <Aviso tom="info" titulo="O que você está vendo">
        <p>
          As duas abas do arquivo que têm linha: <strong>Tarefas</strong> e{" "}
          <strong>Acompanhamentos</strong>. As mesmas linhas, na mesma ordem e com o mesmo texto —
          quem decide as três coisas é o mesmo código que escreve o arquivo.
        </p>
        <p className="mt-2.5">
          A grade rola para o lado quando a coluna não cabe; o arquivo tem as quatro colunas
          inteiras. <strong>Resumo</strong> e <strong>Informações</strong> não aparecem aqui: são
          páginas de leitura, com o cadastro do cliente e a explicação de onde vieram os dados.
        </p>
      </Aviso>

      {total === 0 ? (
        <EstadoVazio
          titulo="Nada para este cliente ainda"
          descricao={`${cliente.nomeFantasia} não tem tarefa nem encontro registrado. A planilha sairia com as quatro abas e as duas tabelas vazias — e é isso que a prévia está mostrando, não uma falha de carregamento.`}
        />
      ) : (
        <>
          <BlocoDaAba
            titulo="Tarefas"
            contagem={tarefas.length}
            descricao="Abertas primeiro, por prazo crescente; concluídas por último. Tarefa sem prazo vai para o fim."
          >
            <PreviaTabular
              rotulo="Prévia da aba Tarefas"
              colunas={COLUNAS_TAREFAS}
              linhas={linhasDeTarefa}
              alturaMaxima={340}
              vazio={
                <p className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5 text-[0.875rem] text-[var(--tinta-suave)]">
                  Nenhuma tarefa registrada para este cliente. A aba sai no arquivo, com esta mesma
                  frase no lugar da tabela.
                </p>
              }
            />
          </BlocoDaAba>

          <BlocoDaAba
            titulo="Acompanhamentos"
            contagem={acompanhamentos.length}
            descricao="Do encontro mais recente para o mais antigo. As pendências de cada um ficam dentro da própria célula."
          >
            <PreviaTabular
              rotulo="Prévia da aba Acompanhamentos"
              colunas={COLUNAS_ACOMPANHAMENTOS}
              linhas={linhasDeAcompanhamento}
              alturaMaxima={340}
              vazio={
                <p className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5 text-[0.875rem] text-[var(--tinta-suave)]">
                  Nenhum acompanhamento registrado para este cliente. A aba sai no arquivo, com esta
                  mesma frase no lugar da tabela.
                </p>
              }
            />
          </BlocoDaAba>
        </>
      )}
    </div>
  );
}

/**
 * O CABEÇALHO DE UMA ABA DENTRO DA PRÉVIA.
 *
 * A contagem fica aqui, e não dentro da tabela, porque ela é conferível: o
 * número de linhas da grade abaixo é exatamente este. Um "12" ao lado de uma
 * grade com onze linhas seria um erro visível, e é bom que seja.
 */
function BlocoDaAba({
  titulo,
  contagem,
  descricao,
  children,
}: {
  titulo: string;
  contagem: number;
  descricao: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-display text-[1rem] text-tinta">
            Aba “{titulo}”
          </h3>
          <p className="mt-1 max-w-[70ch] text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
            {descricao}
          </p>
        </div>
        <span className="tabular shrink-0 text-[0.8125rem] text-[var(--tinta-fraca)]">
          {contagem} {contagem === 1 ? "linha" : "linhas"}
        </span>
      </div>
      {children}
    </section>
  );
}
