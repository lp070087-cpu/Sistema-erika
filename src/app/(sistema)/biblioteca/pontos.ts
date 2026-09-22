/**
 * OS PONTOS DE APOIO DA BIBLIOTECA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO É                                                  │
 * │                                                                      │
 * │ Ele lê o que os clientes JÁ têm no sistema e diz onde falta material   │
 * │ de apoio. É o que faz a tela da Biblioteca abrir útil sem nenhum       │
 * │ material registrado: em vez de uma lista vazia, ela mostra as          │
 * │ situações concretas que pedem um material.                            │
 * │                                                                      │
 * │ ── POR QUE CADA PONTO SAI DOS DADOS, E NÃO DE UMA LISTA DE IDEIAS ──  │
 * │                                                                      │
 * │ "Fazer um guia de limpeza" é conselho genérico: serve para qualquer    │
 * │ restaurante e não ajuda em nenhum. "O Restaurante X tem 3 fichas sem   │
 * │ nenhum item preenchido" é situação concreta, com número e nome, e é o  │
 * │ que ela leva para a reunião.                                          │
 * │                                                                      │
 * │ Por isso cada ponto é DERIVADO. Quando a pendência desaparece, o ponto │
 * │ desaparece — e a lista ficar vazia é a resposta certa, não um defeito. │
 * │                                                                      │
 * │ ── POR QUE ELE MORA AQUI, E NÃO DENTRO DA PÁGINA ──────────────────── │
 * │                                                                      │
 * │ Regra pura: sem React, sem repositório, sem `await`. A página busca os │
 * │ dados e entrega; quem decide o que é pendência é esta função.         │
 * │                                                                      │
 * │ A consequência prática é que ela pode ser CONFERIDA. Uma função        │
 * │ escrita dentro de um arquivo de página só roda no servidor do Next e   │
 * │ não pode ser exercitada por bancada nenhuma — e é justamente ela que    │
 * │ decide o que a tela afirma sobre o cliente.                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/*
  `ClienteOperacao` e não `Cliente`, e a distinção não é preciosismo: o barrel
  `@/lib/dados` exporta DOIS tipos chamados `Cliente` — o da entrada (o lead
  que virou cliente, quatro campos) e o da operação (a carteira de verdade,
  com situação, modalidade e contato). Importar o nome curto traria o da
  entrada, que por acaso também tem `id` e `nomeFantasia` — e por isso o erro
  passaria no compilador e só apareceria como campo faltando depois.
*/
import type { ClienteOperacao, Ficha, Ingrediente, Processo } from "@/lib/dados";

export type PontoDeApoio = {
  id: string;
  clienteId: string;
  clienteNome: string;
  /** O que está faltando, COM NÚMERO: "3 fichas sem nenhum item". */
  situacao: string;
  /** Por que isso é um problema — a consequência, não a definição. */
  porque: string;
  /** O material que resolveria. É o que ela registraria na Biblioteca. */
  materialSugerido: string;
};

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LISTA DE PENDÊNCIAS É FECHADA, E NÃO UMA REGRA GENÉRICA     │
 * │                                                                      │
 * │ A tentação era escrever "para cada campo vazio, sugira um material".   │
 * │ Seria pior de três modos: sugeriria material para coisa que não é       │
 * │ problema, encheria a tela de itens sem importância, e cada sugestão     │
 * │ seria genérica porque não saberia do que está falando.                 │
 * │                                                                      │
 * │ As três abaixo são as que a consultoria de fato trava, e cada uma tem   │
 * │ um "porque" que é a CONSEQUÊNCIA no trabalho dela, não a definição do   │
 * │ campo:                                                               │
 * │                                                                      │
 * │   FICHA SEM ITENS   → não há custo por porção, e é o custo por porção   │
 * │                       que sustenta toda a precificação.                │
 * │                                                                      │
 * │   PASSO SEM TEMPO   → a soma da praça fica incompleta, e não dá para    │
 * │                       dizer se a equipe cabe no turno.                 │
 * │                                                                      │
 * │   INSUMO SEM PREÇO  → o custo de toda ficha que o usa fica em aberto.   │
 * │                                                                      │
 * │ O insumo sem preço é o único que NÃO é por cliente, e isso está        │
 * │ comentado no corpo: a biblioteca de insumos é compartilhada.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function derivarPontosDeApoio(dados: {
  clientes: readonly ClienteOperacao[];
  fichas: readonly Ficha[];
  ingredientes: readonly Ingrediente[];
  processos: readonly Processo[];
}): readonly PontoDeApoio[] {
  const pontos: PontoDeApoio[] = [];

  for (const cliente of dados.clientes) {
    const doCliente = dados.fichas.filter((f) => f.clienteId === cliente.id);

    /*
      ── FICHAS SEM NENHUM ITEM ────────────────────────────────────────────
      A ficha existe e está vazia. É a pendência mais comum e a mais cara: a
      tela de fichas mostra o prato, o cliente vê o nome dele ali, e o custo
      não sai de lugar nenhum.

      A contagem é de FICHAS, e não de itens: "3 fichas sem nenhum item" é
      acionável ("vamos preencher estas três"); "47 itens faltando" seria um
      número que não diz por onde começar.
    */
    const vazias = doCliente.filter((f) => f.itens.length === 0).length;

    if (vazias > 0) {
      pontos.push({
        id: `apoio_ficha_vazia_${cliente.id}`,
        clienteId: cliente.id,
        clienteNome: cliente.nomeFantasia,
        situacao:
          vazias === 1
            ? "1 ficha técnica sem nenhum item preenchido"
            : `${vazias} fichas técnicas sem nenhum item preenchido`,
        porque:
          "Sem os itens não há custo por porção, e é o custo por porção que sustenta a precificação do prato.",
        materialSugerido:
          "Um roteiro de levantamento de ficha: o que pesar, como registrar a perda e o que fazer com o preparo que não tem receita escrita.",
      });
    }

    /*
      ── PASSOS SEM TEMPO DECLARADO ────────────────────────────────────────
      `tempoEstimadoMin` é `number | null`, e o null quer dizer "não
      declarado" — nunca "zero". Contar os null é contar o que falta para a
      soma da praça fechar.

      Um passo com zero declarado NÃO entra aqui: zero é uma decisão ("este
      passo é instantâneo"), e tratá-lo como ausência seria o sistema
      discutindo com ela sobre o que ela declarou.
    */
    const semTempo = dados.processos
      .filter((p) => p.clienteId === cliente.id)
      .flatMap((p) => p.passos)
      .filter((p) => p.tempoEstimadoMin === null).length;

    if (semTempo > 0) {
      pontos.push({
        id: `apoio_passo_sem_tempo_${cliente.id}`,
        clienteId: cliente.id,
        clienteNome: cliente.nomeFantasia,
        situacao:
          semTempo === 1
            ? "1 passo de processo sem tempo declarado"
            : `${semTempo} passos de processo sem tempo declarado`,
        porque:
          "Sem o tempo do passo, a soma da praça fica incompleta e não dá para dizer se a equipe cabe no turno.",
        materialSugerido:
          "Um checklist de cronometragem de praça: o que cronometrar, quantas vezes, e como anotar o que varia de um dia para o outro.",
      });
    }
  }

  /*
    ── INSUMOS SEM PREÇO: ESTE NÃO É POR CLIENTE ─────────────────────────
    A biblioteca de insumos é COMPARTILHADA — `Ingrediente` não tem
    `clienteId`. Um insumo sem preço de referência afeta as fichas de todos os
    clientes que o usam, e por isso ele sai como um ponto só, sem nome de
    cliente.

    O preço de um cliente específico é outro registro (`IngredienteDoCliente`)
    e é outra pendência. Não misturar os dois é o que evita a tela dizer "o
    cliente A está sem preço" quando o que falta é o preço de referência da
    biblioteca, que vale para todos.
  */
  const semPreco = dados.ingredientes.filter((i) => i.precoAtual === null).length;

  if (semPreco > 0) {
    pontos.push({
      id: "apoio_insumo_sem_preco",
      clienteId: "",
      clienteNome: "",
      situacao:
        semPreco === 1
          ? "1 ingrediente da biblioteca sem preço de referência"
          : `${semPreco} ingredientes da biblioteca sem preço de referência`,
      porque:
        "O custo de toda ficha que usa este insumo fica em aberto — e não há preço de cliente que o substitua quando ele não existe.",
      materialSugerido:
        "Um procedimento de como levantar preço de compra: onde olhar, o que anotar e de quanto em quanto tempo revisar.",
    });
  }

  return pontos;
}
