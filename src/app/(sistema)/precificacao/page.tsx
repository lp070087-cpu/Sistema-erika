import type { Metadata } from "next";
import { ModuloPendente } from "@/components/ui/modulo-pendente";

export const metadata: Metadata = { title: "Precificação e CMV" };

export default function PaginaPrecificacao() {
  return (
    <ModuloPendente
      rotulo="Técnico"
      titulo="Precificação e CMV"
      descricao="A generalização da aba 'Controle geral' da planilha. Todos os pratos de um cliente lado a lado, com custo, preço sugerido, preço praticado, markup real e CMV real — e os piores casos no topo."
      fase={4}
      pendencias={["7", "19"]}
      escopo={[
        "Custo, preço sugerido, preço praticado, markup real e CMV real, uma linha por prato.",
        "CMV alvo e margem como parâmetros por cliente, não como constante do sistema.",
        "Pontos de atenção automáticos: prato vendido abaixo do custo ou perigosamente próximo dele.",
        "Ranking de pratos por CMV, do pior para o melhor — a tela que revela o prejuízo antes que ele aconteça.",
      ]}
    />
  );
}
