import type { Metadata } from "next";
import { obterRepositorioOperacao } from "@/lib/dados";
import { DetalheDaFicha } from "./detalhe";

export const metadata: Metadata = { title: "Ficha técnica" };

/**
 * A FICHA TÉCNICA — O CENTRO DE TRABALHO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA PÁGINA É QUASE VAZIA, E POR QUE ISSO É CORRETO           │
 * │                                                                      │
 * │ Ela lê o repositório UMA vez e entrega o cenário pronto. Toda a        │
 * │ interação — adicionar insumo, editar quantidade, mudar o rendimento,   │
 * │ remover linha — vive no componente de cliente, porque é lá que o       │
 * │ estado demonstrativo existe.                                           │
 * │                                                                      │
 * │ Não é preferência de arquitetura: `demonstracao.ts` é um módulo de     │
 * │ NAVEGADOR, com estado em memória. Uma tela de servidor que lesse dele  │
 * │ receberia um estado vazio a cada requisição — e mostraria a ficha      │
 * │ sem nada do que a consultora acabou de digitar.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO HÁ `notFound()` AQUI                                     │
 * │                                                                      │
 * │ Existe uma ficha que o repositório não conhece: a que acabou de ser    │
 * │ criada nesta sessão. Ela vive só no navegador até o banco existir.     │
 * │                                                                      │
 * │ Um 404 aqui mataria a ficha no instante seguinte à criação — a         │
 * │ consultora clicaria em "criar ficha", cairia numa página de erro, e    │
 * │ concluiria que o botão não funciona. O servidor então só relata o que  │
 * │ ele sabe (ou `null`), e quem decide se a ficha existe é o cliente,     │
 * │ que enxerga as duas fontes.                                           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O PREÇO DO CLIENTE VAI EM LISTA, E NÃO COMO `Map`                     │
 * │                                                                      │
 * │ `Map` até atravessa a fronteira servidor→cliente, mas é uma estrutura  │
 * │ cujo formato de serialização depende do runtime. A lista de registros  │
 * │ é dada explícita: o cliente monta o índice que quiser, sem depender de │
 * │ como o React decidiu transportar o objeto.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = { params: Promise<{ id: string }> };

export default async function PaginaFicha({ params }: Props) {
  const { id } = await params;
  const operacao = obterRepositorioOperacao();

  const ficha = await operacao.obterFicha(id);
  const clienteId = ficha?.clienteId ?? null;

  const [clientes, ingredientes] = await Promise.all([
    operacao.listarClientes(),
    operacao.listarIngredientes(),
  ]);

  /*
    Todas as consultas abaixo dependem do cliente da ficha, e nenhuma delas
    pode ser feita sem ele. Numa ficha que só existe na sessão, `clienteId` é
    `null` — e o cliente do navegador resolve o resto com o que ele já tem.
  */
  const precosDoCliente = clienteId
    ? [...(await operacao.mapaDePrecosDoCliente(clienteId)).values()]
    : [];

  const outras = clienteId ? await operacao.listarFichasDoCliente(clienteId) : [];

  return (
    <DetalheDaFicha
      id={id}
      doCenario={{
        ficha,
        cliente: clienteId ? (clientes.find((c) => c.id === clienteId) ?? null) : null,
        clientes,
        ingredientes,
        precosDoCliente,
        /*
          As outras fichas do MESMO cliente. Serve para a consultora pular de
          um prato para o outro sem voltar para a biblioteca — que é o caminho
          que ela faz de verdade quando está revisando o acervo de um cliente.
        */
        outras: outras.filter((f) => f.id !== id),
      }}
    />
  );
}
