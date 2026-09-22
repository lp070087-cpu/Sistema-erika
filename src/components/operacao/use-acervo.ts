"use client";

import { useMemo } from "react";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { resolverItem, resumoDaFicha } from "@/lib/dados";
import type {
  Cardapio,
  ClienteOperacao,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
  ItemResolvido,
  ResumoCustoFicha,
} from "@/lib/dados";
import {
  acervoDeFichas,
  estadoDePrecoDaBiblioteca,
  ingredientesDaSessao,
  precosDeClienteDaSessao,
} from "@/lib/dados/demonstracao";

/**
 * O ACERVO VIVO — a sobreposição da sessão, escrita UMA vez.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE                                                   │
 * │                                                                      │
 * │ Quatro telas precisam da mesma coisa: as fichas visíveis, a           │
 * │ biblioteca de insumos com o preço de HOJE, os preços de cada cliente  │
 * │ e o custo de cada ficha calculado com o mesmo motor.                  │
 * │                                                                      │
 * │ O acervo de fichas já tinha essa conta escrita dentro de si. Copiá-la │
 * │ para a precificação daria duas — e duas cópias de uma regra divergem: │
 * │ basta uma delas esquecer de sobrepor o preço da sessão, ou de filtrar │
 * │ as excluídas, para que a mesma ficha custe um valor na lista e outro  │
 * │ na precificação, com as duas telas parecendo certas.                  │
 * │                                                                      │
 * │ A regra que o acervo de fichas já documentava — "o cálculo acontece   │
 * │ aqui, e não dentro de `Ficha`" — continua valendo. O que mudou é que  │
 * │ agora ela mora num lugar só.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ISOLAÇÃO POR CLIENTE É ESTRUTURAL, NÃO DISCIPLINA                   │
 * │                                                                      │
 * │ `precosPorCliente` é indexado por `clienteId`, e não por             │
 * │ `ingredienteId`. Para o preço de outro cliente entrar no custo de uma │
 * │ ficha, alguém teria de trocar a chave de propósito — não bastaria     │
 * │ esquecer um filtro. É o §6 tornado impossível de violar por acidente. │
 * │                                                                      │
 * │ `resolver()` lê o preço usando o `clienteId` DA PRÓPRIA FICHA. Quem    │
 * │ chama não escolhe o cliente, e por isso não pode escolher errado.     │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export type CenarioDoAcervo = {
  fichas: readonly Ficha[];
  clientes: readonly ClienteOperacao[];
  ingredientes: readonly Ingrediente[];
  precosPorCliente: readonly {
    clienteId: string;
    precos: readonly IngredienteDoCliente[];
  }[];
  /**
   * OS CARDÁPIOS DO CENÁRIO — opcionais, e não um campo a mais por descuido.
   *
   * As telas de ficha, ingrediente e precificação não têm cardápio nenhum
   * para oferecer: pedir a lista a elas obrigaria cada página a consultar uma
   * coisa que não usa. Opcional aqui significa que só a página de cardápios
   * paga esse custo — e as outras continuam declarando exatamente o que leem.
   *
   * `?? []` na ponta: quem não passa recebe lista vazia, nunca `undefined`
   * circulando por dentro.
   */
  cardapios?: readonly Cardapio[];
};

export type AcervoVivo = {
  /** A biblioteca de insumos, com o que foi digitado nesta sessão por cima. */
  insumos: Map<string, Ingrediente>;
  /** Preços por cliente: a chave de fora é o cliente, a de dentro o insumo. */
  precosPorCliente: Map<string, Map<string, IngredienteDoCliente>>;
  clientePorId: Map<string, ClienteOperacao>;
  /** As fichas visíveis: criadas na sessão no topo, excluídas fora. */
  acervo: readonly Ficha[];
  /** As linhas resolvidas de uma ficha, com o preço que a ficha guardou. */
  resolver: (ficha: Ficha) => ItemResolvido[];
  /** A soma de uma ficha, com `completo`, `motivos` e `custoPorPorcao`. */
  custoDe: (ficha: Ficha) => ResumoCustoFicha;
};

export function useAcervoVivo(doCenario: CenarioDoAcervo): AcervoVivo {
  /*
    Assina o estado demonstrativo: criar ou editar uma ficha, ou registrar um
    preço, repinta quem usa este hook. Sem isso, a ficha recém-criada só
    apareceria depois de um recarregar — que, na demonstração, também apaga.
  */
  useDemonstracao();

  /*
    ── A BIBLIOTECA, COM O PREÇO DE HOJE ──────────────────────────────────
    Os insumos criados na sessão entram inteiros; os do cenário recebem o
    preço que a sessão registrou por cima. A ordem importa: o insumo da
    sessão GANHA do insumo do cenário com o mesmo id, porque foi ele que a
    consultora acabou de editar.
  */
  const insumos = useMemo(() => {
    const idsDaSessao = new Set(ingredientesDaSessao().map((i) => i.id));

    const doCenarioAjustado = doCenario.ingredientes
      .filter((i) => !idsDaSessao.has(i.id))
      .map((i) => {
        const estado = estadoDePrecoDaBiblioteca(i.id);
        if (estado === null) return i;
        return {
          ...i,
          precoAtual: estado.atual.valor,
          atualizadoEm: estado.atual.em,
          fornecedor: estado.atual.fornecedor || i.fornecedor,
          historico: estado.historico,
        };
      });

    return new Map([...ingredientesDaSessao(), ...doCenarioAjustado].map((i) => [i.id, i]));
  }, [doCenario.ingredientes]);

  const precosPorCliente = useMemo(() => {
    const indice = new Map<string, Map<string, IngredienteDoCliente>>();

    for (const entrada of doCenario.precosPorCliente) {
      indice.set(entrada.clienteId, new Map(entrada.precos.map((p) => [p.ingredienteId, p])));
    }

    for (const cli of doCenario.clientes) {
      const daSessao = precosDeClienteDaSessao(
        cli.id,
        (ingredienteId) => insumos.get(ingredienteId)?.unidade ?? null
      );
      if (daSessao.size === 0) continue;
      const atual = indice.get(cli.id) ?? new Map<string, IngredienteDoCliente>();
      for (const [ingredienteId, registro] of daSessao) {
        atual.set(ingredienteId, registro);
      }
      indice.set(cli.id, atual);
    }

    return indice;
  }, [doCenario.clientes, doCenario.precosPorCliente, insumos]);

  /*
    `fichasVisiveis` mora em `acervoDeFichas`, e não aqui. Sem ela, EXCLUIR
    NÃO FAZIA NADA VISÍVEL: o store anotava a exclusão, a tela navegava — e a
    ficha reaparecia, porque o acervo era remontado do cenário sem consultar
    quem tinha sido apagado.
  */
  const acervo = useMemo(() => acervoDeFichas(doCenario.fichas), [doCenario.fichas]);

  const clientePorId = useMemo(
    () => new Map(doCenario.clientes.map((c) => [c.id, c])),
    [doCenario.clientes]
  );

  /*
    ── POR QUE A RESOLUÇÃO SAI DAQUI E NÃO DO COMPONENTE ──────────────────
    `resolverItem` é o ÚNICO lugar que decide a precedência entre o preço
    guardado na ficha, o preço do cliente e o preço da biblioteca. Uma tela
    que montasse esse par sozinha poderia montá-lo com o cliente errado — e o
    custo sairia plausível.
  */
  const resolver = useMemo(() => {
    return (ficha: Ficha): ItemResolvido[] => {
      const precos = precosPorCliente.get(ficha.clienteId);
      return ficha.itens.map((item) =>
        resolverItem(
          item,
          insumos.get(item.ingredienteId) ?? null,
          precos?.get(item.ingredienteId) ?? null
        )
      );
    };
  }, [insumos, precosPorCliente]);

  const custoDe = useMemo(() => {
    return (ficha: Ficha): ResumoCustoFicha => resumoDaFicha(resolver(ficha), ficha);
  }, [resolver]);

  return { insumos, precosPorCliente, clientePorId, acervo, resolver, custoDe };
}
