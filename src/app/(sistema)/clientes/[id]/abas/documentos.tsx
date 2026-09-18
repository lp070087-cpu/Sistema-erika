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
import type { ClienteOperacao, Contrato, Documento } from "@/lib/dados";
import { CartaoPlanilhasDoCliente } from "../../../planilhas/cartao-cliente";
import { CartaoContratosDoCliente } from "../../../contratos/cartao-cliente";

/**
 * ABA 7 — DOCUMENTOS.
 *
 * O que foi combinado, o que sai agora e o que já foi entregue a este
 * cliente: o contrato que autoriza o trabalho, as planilhas que podem ser
 * geradas a partir dos dados dele, e os documentos registrados como
 * produzidos — leitura do diagnóstico, plano de ação, lotes de ficha.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O CONTRATO ENTROU AQUI, E NÃO NUMA ABA PRÓPRIA               │
 * │                                                                      │
 * │ Contrato é documento. A régua de abas já é lida como o método —        │
 * │ diagnóstico, consultoria, fichas, processos, acompanhamentos — e uma   │
 * │ aba "Contratos" ao lado de "Documentos" recriaria a duplicação que     │
 * │ este arquivo existe para evitar: duas abas para a mesma família de     │
 * │ coisa, com a consultora tendo de adivinhar qual tem o quê.             │
 * │                                                                      │
 * │ O cartão de contratos é o MESMO componente que a tela da consultoria   │
 * │ usa. Nenhuma linha de lista foi escrita duas vezes.                    │
 * └──────────────────────────────────────────────────────────────────────┘
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
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A EXCEÇÃO — O QUE SAI DE VERDADE                                     │
 * │                                                                      │
 * │ A regra acima vale para o documento REGISTRADO. A planilha é outra    │
 * │ coisa: ela não é um registro parado esperando um arquivo, é um        │
 * │ arquivo gerado na hora, a partir dos dados que já estão nesta ficha.  │
 * │ Nada precisa ser armazenado para que ela exista.                      │
 * │                                                                      │
 * │ Por isso o cartão de planilhas fica ACIMA da lista, e não dentro      │
 * │ dela: em cima é o que sai agora; embaixo é o que foi registrado. A    │
 * │ distância entre os dois blocos é o que evita ler "gerar planilha"     │
 * │ como mais um botão que não faz nada.                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AbaDocumentos({
  cliente,
  documentos,
  contratos,
  consultoriaId,
}: {
  cliente: ClienteOperacao;
  documentos: readonly Documento[];
  /** Os contratos deste cliente, já filtrados pelo repositório. */
  contratos: readonly Contrato[];
  /**
   * A consultoria em curso, quando existe. Ela não entra na planilha como
   * conteúdo — serve só para o relatório saber a qual contrato de trabalho
   * esta ficha pertence. Opcional porque um cliente recém-cadastrado ainda
   * não tem consultoria aberta, e nesse caso o arquivo sai só com o cadastro.
   */
  consultoriaId?: string | null;
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
      {/*
        ── A ORDEM DESTES TRÊS BLOCOS ────────────────────────────────────

        Contrato primeiro, planilha depois, documentos registrados por último.
        A ordem é a mesma do tempo verbal da aba: o contrato é o COMBINADO que
        autoriza o trabalho, a planilha é o que sai AGORA a partir dos dados, e
        a lista de baixo é o que já foi REGISTRADO como entregue. Quem abre
        esta aba deveria conseguir ler de cima para baixo e entender a história
        do que saiu daqui — combinar, produzir, entregar.
      */}
      <CartaoContratosDoCliente
        clienteId={cliente.id}
        nomeCliente={cliente.nomeFantasia}
        contratos={contratos}
      />

      <CartaoPlanilhasDoCliente
        clienteId={cliente.id}
        nomeCliente={cliente.nomeFantasia}
        consultoriaId={consultoriaId}
      />

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
