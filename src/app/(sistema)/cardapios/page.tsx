import type { Metadata } from "next";
import { ModuloPendente } from "@/components/ui/modulo-pendente";

export const metadata: Metadata = { title: "Cardápios" };

/**
 * Cardápios — agrupa fichas que já existem.
 *
 * A montagem do cardápio em si é trabalho de programação. O que trava de
 * verdade é o custo do período: ele precisa do volume vendido, e de onde
 * esse número vem é decisão da consultora — o sistema não presume que o
 * prato mais caro vende menos.
 */
export default function PaginaCardapios() {
  return (
    <ModuloPendente
      rotulo="Operação"
      titulo="Cardápios"
      descricao="O cardápio como agrupador de fichas já existentes. É também a unidade sobre a qual o custo total do período é calculado — o número que a consultora publica como resultado do trabalho."
      decisoes={["origem-do-preco", "custo-do-prato", "formacao-de-preco"]}
      escopo={[
        "Montagem do cardápio escolhendo fichas já cadastradas, com praça, turno e ordem.",
        "Lista de compras gerada a partir do cardápio e do volume previsto.",
        "Exportação e impressão profissional do cardápio e da lista.",
        "Base para o cálculo de custo do cardápio no período.",
      ]}
    />
  );
}
