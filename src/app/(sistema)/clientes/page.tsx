import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { obterRepositorioOperacao } from "@/lib/dados";
import type { Modalidade, SituacaoCliente, TipoServico } from "@/lib/dados";
import { NovoCliente } from "./novo";
import { Carteira } from "./carteira";

export const metadata: Metadata = { title: "Clientes" };

/**
 * CLIENTES — a lista.
 *
 * A pergunta que esta tela responde: "quem eu atendo, e quem está parado?"
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LISTA NÃO É UM ESPELHO DA FILA DE LEADS                    │
 * │                                                                      │
 * │ Quatro dos cinco clientes da demonstração vieram de um lead e        │
 * │ carregam o id dele — a história vai e volta. O quinto, Quintal da    │
 * │ Maria, entrou por indicação e foi cadastrado à mão: `leadOrigemId`   │
 * │ é `null`.                                                            │
 * │                                                                      │
 * │ Isso não é um dado a mais. É a razão de a tela existir separada: se   │
 * │ todo cliente fosse um lead convertido, bastaria filtrar a fila.       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA PÁGINA FAZ, E O QUE ELA DEIXA PARA A CARTEIRA             │
 * │                                                                      │
 * │ Aqui se LÊ e se VALIDA. A leitura são as linhas da carteira, feitas   │
 * │ uma vez no servidor. A validação é dos filtros que vêm na URL: um     │
 * │ `?situacao=QUALQUER` escrito à mão não filtra por nada, em vez de     │
 * │ devolver lista vazia sem explicação.                                  │
 * │                                                                      │
 * │ A validação também protege o seletor: um valor inválido chegando      │
 * │ nele faria o `<select>` abrir na primeira opção e mudar o filtro      │
 * │ sozinho na próxima troca de qualquer outro campo.                     │
 * │                                                                      │
 * │ O FILTRO em si desceu para o componente de cliente, e por um motivo   │
 * │ concreto: o cadastro de um cliente pode ser corrigido no navegador,   │
 * │ e filtrar do lado de lá seria perguntar sobre uma versão dos dados    │
 * │ que não é a que está na tela. Uma busca pelo número novo de telefone  │
 * │ devolveria "nenhum cliente" sobre um cliente visível, com o número    │
 * │ novo escrito nele.                                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * OS FILTROS VIVEM NA URL, como na fila de leads — isso não mudou. A
 * `BarraFiltros` continua escrevendo a URL e o botão "voltar" continua
 * funcionando; o que mudou foi só onde a comparação acontece.
 */

type Props = {
  searchParams: Promise<{
    q?: string;
    situacao?: string;
    tipo?: string;
    modalidade?: string;
  }>;
};

const SITUACOES: readonly SituacaoCliente[] = ["ATIVO", "EM_IMPLANTACAO", "PAUSADO", "ENCERRADO"];
const MODALIDADES: readonly Modalidade[] = ["PRESENCIAL", "ONLINE", "MISTA"];
const TIPOS: readonly TipoServico[] = [
  "BUFFET",
  "A_LA_CARTE",
  "BUFFET_E_A_LA_CARTE",
  "DELIVERY",
  "OUTRO",
];

export default async function PaginaClientes({ searchParams }: Props) {
  const { q, situacao, tipo, modalidade } = await searchParams;

  const linhas = await obterRepositorioOperacao().listarLinhasCliente();

  const busca = (q ?? "").trim().toLowerCase();
  const fSituacao = SITUACOES.includes(situacao as SituacaoCliente)
    ? (situacao as SituacaoCliente)
    : "";
  const fTipo = TIPOS.includes(tipo as TipoServico) ? (tipo as TipoServico) : "";
  const fModalidade = MODALIDADES.includes(modalidade as Modalidade)
    ? (modalidade as Modalidade)
    : "";

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Operação"
        titulo="Clientes"
        descricao="Quem está sendo atendido agora, em que modalidade, desde quando — e quando foi a última vez que alguma coisa se moveu. É o ponto de entrada para o histórico completo de cada um."
        acoes={
          <div className="flex flex-wrap items-center gap-3">
            <NovoCliente />
          </div>
        }
      />

      <Carteira
        linhasDoCenario={linhas}
        busca={busca}
        filtroSituacao={fSituacao}
        filtroTipo={fTipo}
        filtroModalidade={fModalidade}
      />
    </div>
  );
}
