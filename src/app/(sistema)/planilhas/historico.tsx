import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { dataCurta } from "@/lib/dados";
import { COLUNAS_HISTORICO, tamanhoLegivel } from "@/lib/planilhas/historico";
import type { RegistroPlanilha } from "@/lib/planilhas/historico";

/**
 * O HISTÓRICO DE PLANILHAS GERADAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE BLOCO APARECE NUMA LISTA QUE ESTÁ SEMPRE VAZIA          │
 * │                                                                      │
 * │ Uma seção que nunca tem conteúdo é candidata óbvia a não existir.     │
 * │ Aqui ela existe por dois motivos, e o segundo é o que importa:        │
 * │                                                                      │
 * │ 1. É o lugar onde a lista vai estar. Quando o histórico for ligado,   │
 * │    ele não muda de posição nem empurra o resto da tela.               │
 * │                                                                      │
 * │ 2. ELA TORNA VISÍVEL UMA AUSÊNCIA. Sem este bloco, ninguém — nem a    │
 * │    consultora, nem quem for continuar o sistema — percebe que o       │
 * │    sistema gera planilhas e não guarda registro nenhum. A tela        │
 * │    pareceria completa. Com ele, a falta está escrita na tela, com o   │
 * │    motivo e com o que falta para resolver.                            │
 * │                                                                      │
 * │ É a mesma escolha dos quatro cards "em preparação" do catálogo: o     │
 * │ que não existe aparece e diz por quê, em vez de sumir.                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS COLUNAS SÃO AS MESMAS QUE O HISTÓRICO VAI TER                     │
 * │                                                                      │
 * │ A lista monta as colunas lendo `COLUNAS_HISTORICO`, do módulo que      │
 * │ define o registro. Não é uma tabela decorativa desenhada aqui: é a     │
 * │ tabela de verdade, lendo o formato de verdade — só sem nenhuma linha   │
 * │ dentro. Quando o primeiro registro for gravado, esta lista o mostra    │
 * │ sem que se toque neste arquivo.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function HistoricoDePlanilhas({
  registros,
}: {
  registros: readonly RegistroPlanilha[];
}) {
  /*
    As colunas são construídas a partir do formato, e não escritas à mão.

    `COLUNAS_HISTORICO` diz a chave e o título; aqui só se decide COMO cada
    valor aparece. Se um campo novo entrar no registro e na lista de colunas,
    ele aparece nesta tabela sem edição — e, se entrar só no registro, esta
    tabela não inventa uma coluna que a tela não sabe desenhar.
  */
  const colunas: ColunaLista<RegistroPlanilha>[] = COLUNAS_HISTORICO.map(({ chave, titulo }) => {
    switch (chave) {
      case "nomeExibido":
        return {
          chave,
          titulo,
          destaque: true,
          noCartao: "topo" as const,
          valor: (r) => (
            <>
              <span className="block text-[0.9375rem] font-medium text-tinta">{r.nomeExibido}</span>
              <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
                {r.modeloNome}
              </span>
            </>
          ),
        };
      case "clienteNome":
        return {
          chave,
          titulo,
          noCartao: "linha" as const,
          valor: (r) => <span className="text-[0.875rem] text-[var(--tinta-suave)]">{r.clienteNome}</span>,
        };
      case "geradoEm":
        return {
          chave,
          titulo,
          noCartao: "linha" as const,
          valor: (r) => (
            <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
              {dataCurta(r.geradoEm)}
            </span>
          ),
        };
      case "versao":
        return {
          chave,
          titulo,
          align: "dir" as const,
          noCartao: "linha" as const,
          valor: (r) => (
            <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">{r.versao}ª</span>
          ),
        };
      case "geradoPor":
        return {
          chave,
          titulo,
          ocultaEm: "lg" as const,
          noCartao: "linha" as const,
          valor: (r) => <span className="text-[0.875rem] text-[var(--tinta-fraca)]">{r.geradoPor}</span>,
        };
      case "tamanhoBytes":
        return {
          chave,
          titulo: "Tamanho",
          align: "dir" as const,
          ocultaEm: "lg" as const,
          noCartao: "linha" as const,
          valor: (r) => (
            <span className="tabular text-[0.875rem] text-[var(--tinta-fraca)]">
              {tamanhoLegivel(r.tamanhoBytes)}
            </span>
          ),
        };
      default:
        /*
          Uma coluna que a tela não sabe desenhar vira célula vazia, e não um
          erro. O `default` existe porque `COLUNAS_HISTORICO` é uma lista de
          dados: no dia em que alguém acrescentar um campo lá e esquecer de
          desenhá-lo aqui, o resultado é uma coluna em branco — visível o
          bastante para ser notada e corrigida, e não uma tela que quebra.
        */
        return {
          chave,
          titulo,
          noCartao: "oculto" as const,
          valor: () => null,
        };
    }
  });

  return (
    <Secao
      rotulo="Histórico"
      titulo={
        registros.length === 0
          ? "Nenhuma planilha registrada ainda"
          : `${registros.length} ${registros.length === 1 ? "planilha gerada" : "planilhas geradas"}`
      }
      descricao="Toda planilha que sair daqui vai ficar listada neste lugar, com o cliente, a data e a versão."
    >
      <ListaResponsiva
        itens={registros}
        colunas={colunas}
        vazio={
          <EstadoVazio
            titulo="Nenhuma planilha registrada ainda"
            descricao="Esta lista vai guardar cada planilha gerada — de quem era, quando saiu e em que versão. Ela está vazia por um motivo, não por falta de uso: o sistema gera o arquivo e o entrega, mas ainda não tem onde guardar o registro."
          />
        }
      />

      {/*
        ── O QUE A LISTA VAI MOSTRAR ────────────────────────────────────────

        Esta é a parte que transforma "lista vazia" em "lista vazia, e aqui
        está o que ela vai ter". Sem ela, o bloco acima é indistinguível de um
        componente que não carregou.

        As colunas vêm de `COLUNAS_HISTORICO`, o mesmo array que a tabela lê —
        então este resumo não pode divergir do que a lista mostra.
      */}
      <div className="mt-5 rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
          O que cada linha vai dizer
        </p>
        <ul className="mt-2.5 flex flex-wrap gap-x-2 gap-y-1.5">
          {COLUNAS_HISTORICO.map((c) => (
            <li
              key={c.chave}
              className="rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[var(--superficie)] px-2.5 py-1 text-[0.8125rem] text-[var(--tinta-suave)]"
            >
              {c.titulo}
            </li>
          ))}
        </ul>
      </div>

      <Aviso tom="info" titulo="Por que a lista está vazia">
        <p>
          A planilha é gerada na hora e vai direto para o seu computador — o
          servidor não guarda cópia dela. Sem um lugar onde guardar o arquivo,
          um histórico não teria como reabrir nada: registraria a data e o
          nome, e não devolveria o documento. Um registro que não devolve o
          documento é pior que nenhum, porque dá a impressão de que a planilha
          está arquivada.
        </p>
        <p className="mt-2.5">
          Por isso esta área fica visível e vazia, em vez de preenchida com
          exemplos. Quando houver onde guardar os arquivos, as planilhas
          geradas passam a aparecer aqui — e as antigas, se ainda existirem,
          vêm junto.
        </p>
      </Aviso>
    </Secao>
  );
}
