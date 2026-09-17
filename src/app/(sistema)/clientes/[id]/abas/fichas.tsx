import Link from "next/link";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import {
  ROTULO_SITUACAO_FICHA,
  TOM_SITUACAO_FICHA,
  contarFichas,
  dataCurta,
} from "@/lib/dados";
import type { ClienteOperacao, Ficha } from "@/lib/dados";

/**
 * ABA 4 — FICHAS TÉCNICAS DO CLIENTE.
 *
 * Lista o acervo deste cliente com nome, categoria, rendimento e situação.
 * Cada linha abre a ficha completa.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO APARECE CUSTO NEM PREÇO SUGERIDO NA LISTA                 │
 * │                                                                      │
 * │ "Custo por porção" seria a coluna mais útil de uma lista de fichas —  │
 * │ e é justamente a que não pode existir ainda. Ela depende do índice de  │
 * │ cocção (ponto 4), do fator de correção por contexto (pontos 5 e 6) e  │
 * │ do arredondamento (ponto 19).                                         │
 * │                                                                      │
 * │ Uma coluna com número inventado numa lista é pior do que uma coluna   │
 * │ ausente: ninguém confere cada linha, e o número passa a ser tratado    │
 * │ como fato pela própria consultora.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AbaFichas({
  cliente,
  fichas,
}: {
  cliente: ClienteOperacao;
  fichas: readonly Ficha[];
}) {
  const contagem = contarFichas(fichas);

  const colunas: ColunaLista<Ficha>[] = [
    {
      chave: "nome",
      titulo: "Prato",
      destaque: true,
      noCartao: "topo",
      valor: (f) => (
        <>
          <span className="block text-[0.9375rem] font-medium text-tinta">{f.nome}</span>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {f.categoria}
          </span>
        </>
      ),
    },
    {
      chave: "rendimento",
      titulo: "Rendimento",
      noCartao: "linha",
      valor: (f) =>
        f.rendimentoPorcoes !== null ? (
          <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
            {f.rendimentoPorcoes} {f.rendimentoPorcoes === 1 ? "porção" : "porções"}
            {f.porcaoGramas !== null ? ` · ${f.porcaoGramas} g` : ""}
          </span>
        ) : (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">a definir</span>
        ),
    },
    {
      chave: "itens",
      titulo: "Itens",
      align: "dir",
      ocultaEm: "md",
      noCartao: "linha",
      valor: (f) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {f.itens.length}
        </span>
      ),
    },
    {
      chave: "situacao",
      titulo: "Situação",
      noCartao: "linha",
      valor: (f) => (
        <Etiqueta tom={TOM_SITUACAO_FICHA[f.situacao]}>
          {ROTULO_SITUACAO_FICHA[f.situacao]}
        </Etiqueta>
      ),
    },
    {
      chave: "atualizada",
      titulo: "Última atualização",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (f) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {dataCurta(f.atualizadaEm)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Secao
        rotulo="Fichas técnicas"
        titulo={
          fichas.length === 0
            ? "Nenhuma ficha registrada"
            : `${fichas.length} ${fichas.length === 1 ? "ficha" : "fichas"} · ${contagem.completas} completas`
        }
        descricao={`As fichas de ${cliente.nomeFantasia}. Cada uma guarda o que a produção declarou: ingredientes com quantidade, rendimento, modo de preparo e finalização.`}
      >
        <ListaResponsiva
          itens={fichas}
          colunas={colunas}
          href={(f) => `/fichas/${f.id}`}
          vazio={
            <EstadoVazio
              titulo="Nenhuma ficha técnica ainda"
              descricao="As fichas nascem do levantamento com a produção. Quando a primeira for registrada, ela aparece aqui com o rendimento e os ingredientes declarados."
            />
          }
        />

        {contagem.aguardandoDados > 0 || contagem.emRevisao > 0 ? (
          <p className="mt-5 border-t border-[var(--linha)] pt-4 text-[0.8125rem] text-[var(--tinta-suave)]">
            {contagem.aguardandoDados > 0
              ? `${contagem.aguardandoDados} aguardando dados`
              : null}
            {contagem.aguardandoDados > 0 && contagem.emRevisao > 0 ? " · " : null}
            {contagem.emRevisao > 0 ? `${contagem.emRevisao} em revisão` : null}
            {" — "}
            ficha incompleta não é ficha pela metade: é uma ficha que ainda não
            pode ser usada no passe.
          </p>
        ) : null}
      </Secao>

      <Aviso tom="info" titulo="Sem custo por porção, por enquanto">
        <p>
          A ficha guarda o que é fato: a quantidade declarada de cada
          ingrediente e o preço de referência de cada um. O custo é o produto
          dos dois — mas QUAL dos dois recebe ajuste antes de multiplicar
          depende de decisões de metodologia que ainda não foram tomadas.
        </p>
        <p className="mt-2.5">
          Por isso a ficha mostra os dois números separados e diz que o cálculo
          está em preparação, em vez de exibir um valor que ninguém pode
          conferir.
        </p>
      </Aviso>

      <p className="text-[0.8125rem] text-[var(--tinta-fraca)]">
        A biblioteca completa de fichas, de todos os clientes, fica em{" "}
        <Link href="/fichas" className="text-oliva hover:underline">
          Fichas técnicas
        </Link>
        .
      </p>
    </div>
  );
}
