import type { Metadata } from "next";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { DecisoesQueFaltam } from "@/components/ui/metodologia";
import { obterRepositorioOperacao } from "@/lib/dados";
import type { Cardapio } from "@/lib/dados";
import { Aviso } from "@/components/ui/superficie";
import { ListaDeCardapios } from "./lista";

export const metadata: Metadata = { title: "Cardápios" };

/**
 * CARDÁPIOS — a página de servidor.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA TELA ESTÁ VAZIA HOJE, E POR QUE ISSO É O CERTO           │
 * │                                                                      │
 * │ O repositório não tem cardápio nenhum para entregar: `CARDAPIOS` não   │
 * │ existe no cenário. E a resposta certa para isso NÃO é inventar três    │
 * │ menus de exemplo para a tela parecer acabada.                          │
 * │                                                                      │
 * │ Um cardápio de demonstração seria a mentira mais cara deste projeto:   │
 * │ ele pareceria resultado e não seria. A consultora abriria a lista, ver │
 * │ "Menu de inverno — 12 itens", e não teria como saber se aquilo é o     │
 * │ trabalho dela ou enfeite nosso. É a mesma regra que a planilha já      │
 * │ segue: nada aparece preenchido por conta própria.                      │
 * │                                                                      │
 * │ Então a página entrega a lista vazia, e a lista vazia tem uma frase    │
 * │ dizendo o que fazer. O aviso abaixo nomeia a ausência — porque uma     │
 * │ tela vazia sem explicação é indistinguível de uma tela quebrada.       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CARDÁPIO NÃO PRECISA DE VOLUME VENDIDO PARA EXISTIR                  │
 * │                                                                      │
 * │ O `ModuloPendente` que ficava aqui dizia que o que travava era o       │
 * │ custo do PERÍODO — que precisa do volume vendido, e de onde esse        │
 * │ número vem é decisão da consultora.                                     │
 * │                                                                      │
 * │ A parte dele que está certa: o sistema continua SEM presumir que o      │
 * │ prato mais caro vende menos, e continua sem calcular custo de período.  │
 * │ Nada nesta tela depende de volume.                                      │
 * │                                                                      │
 * │ A parte que estava errada: o cardápio em si — agrupar fichas que já     │
 * │ existem, dar seção e ordem a elas — não depende do volume. Dependia da  │
 * │ decisão de onde o preço do prato mora, e ela já foi tomada: mora na     │
 * │ ficha técnica. O cardápio PUBLICA esse preço, não o guarda.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export default async function PaginaCardapios() {
  const operacao = obterRepositorioOperacao();

  const [fichas, clientes, ingredientes] = await Promise.all([
    operacao.listarFichas(),
    operacao.listarClientes(),
    operacao.listarIngredientes(),
  ]);

  /*
    Os preços por cliente, só para quem tem ficha — mesmo critério da
    precificação. Sem o preço do cliente no acervo, o custo de um prato que
    usa insumo com preço negociado sairia pelo preço de balcão, e o CMV
    mostrado no cardápio não seria o da casa.
  */
  const idsComFicha = [...new Set(fichas.map((f) => f.clienteId))];

  const precosPorCliente = await Promise.all(
    idsComFicha.map(async (clienteId) => ({
      clienteId,
      precos: [...(await operacao.mapaDePrecosDoCliente(clienteId)).values()],
    }))
  );

  /*
    ── ONDE OS CARDÁPIOS VÃO NASCER ───────────────────────────────────────
    Hoje é uma lista vazia escrita aqui, com o tipo declarado, e é de
    propósito que ela seja VISÍVEL em vez de o campo sumir. No dia em que o
    repositório tiver `listarCardapios()`, esta constante vira uma chamada, e
    `CARDAPIOS_POR_ENQUANTO` some — o tipo do cenário já aceita a lista.

    Se esta linha fosse omitida e o campo ficasse de fora, o cenário
    continuaria compilando (o campo é opcional) e a ausência passaria a ser
    invisível: ninguém saberia dizer se o repositório não tem cardápios ou se
    a página esqueceu de pedi-los.
  */
  const cardapios: readonly Cardapio[] = CARDAPIOS_POR_ENQUANTO;

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Operação"
        titulo="Cardápios"
        descricao="Cada cardápio reúne fichas técnicas que já existem, com a seção e a ordem em que o prato é anunciado. O custo, o preço e o CMV de cada prato continuam vindo da ficha — o cardápio não guarda preço próprio."
      />

      {cardapios.length === 0 ? (
        <Aviso tom="info" titulo="Esta tela começa vazia — e não por engano">
          O repositório ainda não devolve cardápios, e nenhum foi inventado para preencher a
          lista: um menu de demonstração seria indistinguível de trabalho feito. O que já funciona
          é a montagem — criar um cardápio, escolher fichas que existem, organizar em seções e
          acompanhar custo, preço e CMV de cada prato. O que ainda não existe é o cardápio
          gravado no banco, e o custo do período, que depende do volume vendido.
        </Aviso>
      ) : null}

      <ListaDeCardapios
        doCenario={{ fichas, clientes, ingredientes, precosPorCliente, cardapios }}
      />

      <DecisoesQueFaltam
        apenas={["custo-do-prato", "formacao-de-preco", "origem-do-preco"]}
        titulo="O que o cardápio já monta, e o que continua sem resposta"
        descricao="A montagem já está de pé: seção, ordem e nome de anúncio são do cardápio; custo, preço e CMV são da ficha, lidos no mesmo motor que a tela de precificação usa. O preço que um alvo exige continua aparecendo só quando o alvo existe — não há CMV alvo nem margem padrão. E o custo do cardápio no período continua fora, porque ele precisa do volume vendido, e o sistema não presume quanto cada prato vende."
      />
    </div>
  );
}

/**
 * OS CARDÁPIOS DO CENÁRIO — hoje nenhum.
 *
 * O nome diz o que a lista é, para que ninguém a confunda com dado real ao
 * ler o código. É a mesma escolha de `PARAMETROS_DO_CLIENTE` na precificação:
 * uma constante nomeada, com o motivo escrito ao lado, em vez de um `[]` solto
 * que pareceria descuido.
 *
 * Um cardápio de demonstração seria pior do que nada aqui: a lista de
 * cardápios é a tela em que a consultora vê o resultado do trabalho dela, e
 * um item que ela não montou contamina justamente a leitura que ela mais
 * precisa confiar.
 */
const CARDAPIOS_POR_ENQUANTO: readonly Cardapio[] = [];
