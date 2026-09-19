import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { DecisoesQueFaltam } from "@/components/ui/metodologia";
import { obterRepositorioOperacao } from "@/lib/dados";
import { AcervoDeFichas } from "./lista";

export const metadata: Metadata = { title: "Fichas técnicas" };

/**
 * FICHAS TÉCNICAS — a página de servidor que entrega o cenário.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE MUDOU NESTA PÁGINA, E POR QUE                                  │
 * │                                                                      │
 * │ Ela lê o repositório e passa tudo pronto para o acervo, que agora é   │
 * │ de cliente. Não é preferência: criar uma ficha e atualizar o preço de │
 * │ um insumo acontecem no NAVEGADOR, e o servidor não fica sabendo. Uma   │
 * │ lista renderizada aqui mostraria o acervo de antes — e a ficha que     │
 * │ acabou de ser criada não apareceria.                                  │
 * │                                                                      │
 * │ Os preços de cliente vêm agrupados por cliente, e não num mapa único: │
 * │ o custo de uma ficha só pode usar o preço do cliente DONO dela. É a    │
 * │ mesma regra do §6, tomada impossível de violar por acidente — para     │
 * │ usar o preço de outro cliente, a lista teria que trocar de chave.      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA BIBLIOTECA PASSOU A MOSTRAR, E O QUE ELA DEIXOU DE DIZER   │
 * │                                                                      │
 * │ Antes: prato, cliente, rendimento, ingredientes, data e situação — e  │
 * │ uma tarja explicando por que não havia custo.                          │
 * │                                                                      │
 * │ Agora: também o CUSTO DA FICHA e o CUSTO POR PORÇÃO, calculados com o  │
 * │ mesmo motor da tela da ficha. A tarja saiu, porque a frase que ela     │
 * │ afirmava — "o cálculo depende de decisões ainda não tomadas" — deixou  │
 * │ de ser verdade: a soma dos itens, o total e a divisão pelas porções    │
 * │ são operações sobre números declarados, e acontecem.                   │
 * │                                                                      │
 * │ O que continua sem aparecer é preço de venda, CMV alvo e markup. Não   │
 * │ por falta de espaço: por falta de definição dela. E essas três          │
 * │ aparecem nomeadas abaixo.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export default async function PaginaFichas() {
  const operacao = obterRepositorioOperacao();

  const [fichas, clientes, ingredientes] = await Promise.all([
    operacao.listarFichas(),
    operacao.listarClientes(),
    // A ficha só pode usar insumos que já existem no acervo de ingredientes.
    // Sem a lista, o formulário ofereceria um campo de texto livre para o
    // nome do insumo — e aí "mussarela", "Mussarela" e "queijo mussarela"
    // virariam três ingredientes diferentes no mesmo prato.
    operacao.listarIngredientes(),
  ]);

  /*
    Os preços por cliente, buscados em paralelo e agrupados. Só para os
    clientes que têm ficha no acervo: pedir os preços de um cliente sem
    ficha seria uma consulta para alimentar um custo que não existe.
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
        rotulo="Técnico"
        titulo="Fichas técnicas"
        descricao="O acervo de pratos de cada cliente: o que leva, quanto rende, como é montado e quanto custa. É o documento que faz o prato sair igual independente de quem está no turno."
      />

      <AcervoDeFichas
        doCenario={{ fichas, clientes, ingredientes, precosPorCliente }}
      />

      {/*
        O QUE SOBRA PARA DECIDIR — e o que isso trava na biblioteca.
        A lista mudou em relação à fase anterior: aqui já não se explica por
        que não há custo (há), e sim o que ainda depende dela.
      */}
      <DecisoesQueFaltam
        apenas={["formacao-de-preco", "origem-do-preco", "arredondamento"]}
        titulo="O que a ficha já calcula, e o que ainda não"
        descricao="O custo do prato e o custo por porção já saem daqui, porque são soma e divisão sobre o que foi declarado — quantidade, preço e rendimento em porções. Preço de venda, CMV alvo e markup continuam parados nas decisões abaixo, e nenhuma delas é o sistema que toma."
      />
    </div>
  );
}
