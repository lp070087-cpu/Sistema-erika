import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import {
  ROTULO_SITUACAO_DOCUMENTO,
  ROTULO_TIPO_DOCUMENTO,
  TOM_SITUACAO_DOCUMENTO,
  dataCurta,
} from "@/lib/dados";
import type { ClienteOperacao, Documento } from "@/lib/dados";

/**
 * ABA 7 — DOCUMENTOS ENTREGUES.
 *
 * O que já foi produzido e entregue a este cliente: leitura do diagnóstico,
 * plano de ação, padrão de montagem, lotes de ficha, relatórios.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO EXISTE BOTÃO DE DOWNLOAD                                  │
 * │                                                                      │
 * │ O tipo `Documento` tem um campo `arquivo` que é `null` em todos os    │
 * │ registros — e é `null` por construção, não por falta de dado. Não      │
 * │ existe armazenamento de arquivo no projeto, e a Seção 30 proíbe criar │
 * │ um improvisado para a demonstração.                                   │
 * │                                                                      │
 * │ Um botão de download que não baixa nada é pior do que botão nenhum:   │
 * │ a pessoa clica, não acontece nada, e ela conclui que o sistema está    │
 * │ quebrado — quando na verdade ele está sendo honesto.                  │
 * │                                                                      │
 * │ Então a lista mostra o que existe (o registro, a data, o estado) e a   │
 * │ área de envio explica por que ainda não dá para anexar.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AbaDocumentos({
  cliente,
  documentos,
}: {
  cliente: ClienteOperacao;
  documentos: readonly Documento[];
}) {
  const colunas: ColunaLista<Documento>[] = [
    {
      chave: "nome",
      titulo: "Documento",
      destaque: true,
      noCartao: "topo",
      valor: (d) => (
        <>
          <span className="block text-[0.9375rem] font-medium text-tinta">{d.nome}</span>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {ROTULO_TIPO_DOCUMENTO[d.tipo]}
          </span>
        </>
      ),
    },
    {
      chave: "situacao",
      titulo: "Situação",
      noCartao: "linha",
      valor: (d) => (
        <Etiqueta tom={TOM_SITUACAO_DOCUMENTO[d.situacao]}>
          {ROTULO_SITUACAO_DOCUMENTO[d.situacao]}
        </Etiqueta>
      ),
    },
    {
      chave: "data",
      titulo: "Data",
      align: "dir",
      noCartao: "linha",
      valor: (d) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {dataCurta(d.criadoEm)}
        </span>
      ),
    },
    {
      chave: "arquivo",
      titulo: "Arquivo",
      align: "dir",
      ocultaEm: "md",
      noCartao: "linha",
      valor: () => (
        <span className="text-[0.875rem] text-[var(--tinta-fraca)]">não anexado</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Secao
        rotulo="Documentos"
        titulo={
          documentos.length === 0
            ? "Nenhum documento registrado"
            : `${documentos.length} ${documentos.length === 1 ? "documento" : "documentos"}`
        }
        descricao={`O que foi produzido para ${cliente.nomeFantasia} e em que estado está. O registro existe; o arquivo ainda não.`}
      >
        <ListaResponsiva
          itens={documentos}
          colunas={colunas}
          vazio={
            <EstadoVazio
              titulo="Nenhum documento produzido ainda"
              descricao="A leitura do diagnóstico, o plano de ação e os relatórios de acompanhamento aparecem aqui conforme forem gerados."
            />
          }
        />
      </Secao>

      {/* Área de envio — desabilitada com explicação, como a Seção 19 permite. */}
      <Secao rotulo="Anexar" titulo="Envio de arquivo">
        <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.5)] px-6 py-9 text-center">
          <p className="text-[0.9375rem] font-medium text-tinta">
            Envio de arquivo ainda não está disponível
          </p>
          <p className="mx-auto mt-2 max-w-[58ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            Não existe armazenamento de arquivo configurado no sistema. A área
            de envio fica visível para que se possa avaliar a tela, mas
            soltar um arquivo aqui não guardaria nada — e um botão que aceita
            um arquivo e o descarta em silêncio seria pior do que não ter o
            botão.
          </p>
        </div>
      </Secao>

      <Aviso tom="info" titulo="O registro já está certo">
        <p>
          Nome, tipo, data e situação de cada documento são reais na estrutura
          do sistema — é o que a lista acima mostra. O que falta é só o
          arquivo em si, que depende de uma decisão de onde armazenar.
        </p>
      </Aviso>
    </div>
  );
}
