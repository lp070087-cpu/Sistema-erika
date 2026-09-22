import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { DecisoesQueFaltam } from "@/components/ui/metodologia";
import { obterRepositorioOperacao } from "@/lib/dados";
import { ListaDePrecificacao } from "./lista";

export const metadata: Metadata = { title: "Precificação e CMV" };

/**
 * PRECIFICAÇÃO E CMV — a página de servidor.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE MUDOU AQUI, E POR QUE                                          │
 * │                                                                      │
 * │ Antes: `ModuloPendente`. A tela existia para dizer quais decisões     │
 * │ seguravam cada coluna — e era honesta enquanto o custo da ficha ainda │
 * │ não fechava.                                                            │
 * │                                                                      │
 * │ Agora o custo fecha, o CMV e o markup são divisões sobre números       │
 * │ declarados, e o preço que cada alvo exige é aritmética reversa. O que  │
 * │ NÃO existe continua não existindo, e aparece nomeado no rodapé: não há  │
 * │ CMV alvo por cliente, não há margem padrão da casa, não há regra de     │
 * │ arredondamento. Nenhuma dessas três foi inventada para a tela ficar    │
 * │ cheia.                                                                  │
 * │                                                                      │
 * │ A leitura do cenário é a mesma das outras telas: o repositório         │
 * │ entrega, a lista sobrepõe o que foi mexido na sessão. Os preços vêm     │
 * │ agrupados POR CLIENTE, e não num mapa único — é o §6 tomado impossível │
 * │ de violar por acidente.                                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export default async function PaginaPrecificacao() {
  const operacao = obterRepositorioOperacao();

  const [fichas, clientes, ingredientes] = await Promise.all([
    operacao.listarFichas(),
    operacao.listarClientes(),
    operacao.listarIngredientes(),
  ]);

  /*
    Os preços por cliente, só para quem tem ficha. Pedir os preços de um
    cliente sem ficha seria uma consulta para alimentar um custo que não
    existe.
  */
  const idsComFicha = [...new Set(fichas.map((f) => f.clienteId))];

  const precosPorCliente = await Promise.all(
    idsComFicha.map(async (clienteId) => ({
      clienteId,
      precos: [...(await operacao.mapaDePrecosDoCliente(clienteId)).values()],
    }))
  );

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Operação"
        titulo="Precificação e CMV"
        descricao="Todos os pratos lado a lado, com o custo que sai da ficha técnica e o preço de venda declarado. O que o preço implica — CMV, markup, sobra — é conta; o que ele deveria ser é decisão sua."
      />

      <ListaDePrecificacao
        doCenario={{ fichas, clientes, ingredientes, precosPorCliente }}
      />

      <DecisoesQueFaltam
        apenas={["formacao-de-preco", "origem-do-preco", "arredondamento"]}
        titulo="O que esta tela já calcula, e o que ainda não"
        descricao="O CMV e o markup já saem daqui, porque são divisões sobre números declarados: o custo somado da ficha e o preço de venda informado. O preço que um alvo exige também — desde que o alvo exista. O que continua parado é justamente o alvo: não há CMV alvo nem margem de segurança por cliente, e por isso a tela mostra a simulação e o silêncio, sem sugerir um número de partida."
      />
    </div>
  );
}
