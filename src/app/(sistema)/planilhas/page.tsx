import type { Metadata } from "next";
import { CabecalhoPagina, Rotulo } from "@/components/ui/rotulo";
import { EstadoVazio, Painel } from "@/components/ui/superficie";
import { obterRepositorioOperacao } from "@/lib/dados";
import { MODELOS } from "@/lib/planilhas/modelos";
import { listarPlanilhasGeradas } from "@/lib/planilhas/historico";
import { AmbienteDaPlanilha } from "./ambiente";
import { HistoricoDePlanilhas } from "./historico";

export const metadata: Metadata = { title: "Planilhas" };

/**
 * A CENTRAL DE PLANILHAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA PÁGINA PASSOU A SER                                       │
 * │                                                                      │
 * │ Ela era um RELATÓRIO: faixa de ações, prévia com duas tabelas          │
 * │ empilhadas, catálogo de cards, histórico. Quatro seções de página,     │
 * │ cada uma com título e descrição, e a planilha em si ocupava um terço   │
 * │ da altura.                                                            │
 * │                                                                      │
 * │ Agora ela é um AMBIENTE: os seletores em cima, e abaixo deles a grade  │
 * │ com as abas das folhas. Só. O histórico continua no fim, discreto, e   │
 * │ a faixa verde continua no fim como sempre esteve.                      │
 * │                                                                      │
 * │ Isto é o que sobrou para o SERVIDOR fazer: ler a lista de clientes do  │
 * │ repositório e entregá-la. Todo o resto — escolher modelo, montar       │
 * │ contexto, montar a grade — roda no cliente, porque são funções puras.  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O CATÁLOGO DE CARDS SAIU DAQUI                               │
 * │                                                                      │
 * │ Os modelos que ainda não saem apareciam como cards com um parágrafo    │
 * │ explicando o que falta em cada um. Era a resposta certa para uma tela  │
 * │ que era um catálogo, e a resposta errada para uma barra de comando:    │
 * │ empurrava a grade para fora da tela em troca de informação que não se  │
 * │ usa no momento de gerar.                                              │
 * │                                                                      │
 * │ Eles não sumiram: continuam no seletor de planilha, desabilitados, com │
 * │ o motivo no `title`. O que saiu foi a parede de texto sobre eles.      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO HÁ MAIS RECORTE AQUI                                     │
 * │                                                                      │
 * │ A versão anterior recortava tarefas e acompanhamentos por cliente      │
 * │ nesta página, com `recorteDoCliente`, para passar as listas prontas à  │
 * │ prévia. Com a grade montada no cliente, quem recorta é o MODELO — que  │
 * │ é onde a regra "nenhum dado de outro cliente entra nesta planilha"     │
 * │ sempre morou, e onde ela vale para os três modelos em vez de para um.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = {
  searchParams: Promise<{ cliente?: string; modelo?: string }>;
};

export default async function PaginaPlanilhas({ searchParams }: Props) {
  const { cliente: clienteId, modelo: modeloId } = await searchParams;
  const operacao = obterRepositorioOperacao();

  /*
    SÓ OS CLIENTES VÊM DO SERVIDOR.

    É o mínimo que a tela precisa para começar, e é dado que não muda enquanto
    ela está aberta. Tudo o mais — tarefas, fichas, insumos — é buscado pelo
    ambiente no momento em que ela escolhe o cliente, pelo mesmo
    `montarContexto` que a rota de download usa. Uma porta só, e os dois lados
    com o mesmo dado.
  */
  const clientes = await operacao.listarClientes();

  /*
    O RECORTE DE CLIENTES DO SELETOR.

    O cliente vem da URL para o endereço continuar servindo de atalho a partir
    da ficha do cliente ou da consultoria — é de lá que se chega aqui com um
    cliente já em mente. A escolha seguinte acontece sem passar pela URL.
  */
  const clienteDaUrl = clienteId ? (clientes.find((c) => c.id === clienteId) ?? null) : null;

  /*
    O histórico vem do módulo de planilhas, e não de um `[]` escrito aqui.

    Hoje a função devolve lista vazia — é a ESTRUTURA do histórico, ainda sem
    armazenamento por trás. Pedir a lista por função, em vez de escrever o
    array vazio nesta página, é o que faz "ligar o histórico" ser uma troca
    dentro de `src/lib/planilhas/historico.ts`, e não uma edição na tela.
  */
  const geradas = listarPlanilhasGeradas();

  return (
    <div className="space-y-5">
      <CabecalhoPagina
        rotulo="Documentos"
        titulo="Central de planilhas"
        descricao="Transforme os dados da consultoria em documentos organizados e prontos para análise ou envio."
      />

      {clientes.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum cliente cadastrado"
          descricao="As planilhas saem dos dados de um cliente. Assim que houver um cadastro, ele aparece aqui para ser escolhido."
        />
      ) : (
        <AmbienteDaPlanilha
          modelos={MODELOS}
          clientes={clientes}
          /*
            O cliente da URL entra como cliente INICIAL. Isso é diferente de
            abrir a tela com todos os clientes listados e nenhum escolhido:
            quem chega de `/clientes/[id]` já disse de quem quer a planilha, e
            obrigá-la a escolher de novo seria repetir a pergunta.
          */
          clienteInicial={clienteDaUrl?.id ?? null}
          modeloInicial={modeloId ?? null}
        />
      )}

      <HistoricoDePlanilhas registros={geradas} />

      <Painel escuro className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Rotulo claro>Um arquivo de verdade</Rotulo>
          <p className="mt-2 font-display text-[1.25rem] text-off">
            Você baixa, abre no Excel e usa.
          </p>
          <p className="mt-1.5 max-w-[62ch] text-[0.875rem] text-creme/65">
            Com filtro no cabeçalho, painel congelado, datas e valores formatados e uma aba que
            explica de onde vieram os dados.
          </p>
        </div>
        <span className="assina text-[1.5rem] text-oliva-palha">Da cozinha para a planilha</span>
      </Painel>
    </div>
  );
}
