import type { Metadata } from "next";
import { ModuloPendente } from "@/components/ui/modulo-pendente";

export const metadata: Metadata = { title: "Cardápios" };

export default function PaginaCardapios() {
  return (
    <ModuloPendente
      rotulo="Técnico"
      titulo="Cardápios"
      descricao="O cardápio como agrupador de fichas já existentes. É também a unidade sobre a qual o custo total do período é calculado — o número que a consultora publica como resultado do trabalho."
      fase={5}
      pendencias={["8", "17"]}
      escopo={[
        "Montagem do cardápio escolhendo fichas já cadastradas, com praça, turno e ordem.",
        "Lista de compras gerada a partir do cardápio e do volume previsto.",
        "Exportação e impressão profissional do cardápio e da lista.",
        "Base para o cálculo de custo do cardápio no período.",
      ]}
    />
  );
}
