import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { dataCurta } from "@/lib/dados";
import { COLUNAS_HISTORICO, tamanhoLegivel } from "@/lib/planilhas/historico";
import type { RegistroPlanilha } from "@/lib/planilhas/historico";

/**
 * O HISTÓRICO DE PLANILHAS GERADAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE BLOCO JÁ EXPLICOU DEMAIS, E AGORA CALA                         │
 * │                                                                      │
 * │ Ele chegou a ter três parágrafos dizendo por que a lista estava       │
 * │ vazia, mais uma faixa listando as colunas que um registro futuro       │
 * │ teria. A intenção era boa — tornar visível uma ausência — e o          │
 * │ resultado era o oposto: uma área de documentos que abria falando       │
 * │ sobre a ausência de área, com o vocabulário de quem constrói o         │
 * │ sistema ("ainda não tem onde guardar o registro").                     │
 * │                                                                      │
 * │ A ausência continua dita, porque esconder uma lista vazia seria pior:  │
 * │ uma frase. O que saiu foi a explicação de engenharia em volta dela, e   │
 * │ a lista de colunas — que descrevia um registro que ninguém tem em mãos.│
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS COLUNAS AINDA VÊM DO FORMATO, E NÃO DE UMA TABELA DESENHADA AQUI  │
 * │                                                                      │
 * │ Isto não mudou, e é o que faz o bloco valer a pena: a lista monta as  │
 * │ colunas lendo `COLUNAS_HISTORICO`, do módulo que define o registro.   │
 * │ Quando o primeiro registro for gravado, esta lista o mostra sem que se │
 * │ toque neste arquivo — e o formato das colunas já está decidido em um   │
 * │ lugar só.                                                             │
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
      titulo={registros.length === 0 ? "Planilhas geradas" : `${registros.length} ${registros.length === 1 ? "planilha gerada" : "planilhas geradas"}`}
    >
      <ListaResponsiva
        itens={registros}
        colunas={colunas}
        vazio={<EstadoVazio titulo="Nenhuma planilha gerada ainda." />}
      />
    </Secao>
  );
}
