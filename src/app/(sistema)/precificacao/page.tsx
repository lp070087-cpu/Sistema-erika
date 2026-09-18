import type { Metadata } from "next";
import { ModuloPendente } from "@/components/ui/modulo-pendente";

export const metadata: Metadata = { title: "Precificação e CMV" };

/**
 * Precificação e CMV — o módulo que depende inteiro da metodologia.
 *
 * É a tela com mais risco do sistema: cada coluna dela é uma regra da
 * consultora (o que entra no custo, qual margem é a alvo, quantas casas
 * decimais sobrevivem). Por isso ela não existe ainda — e a tela diz quais
 * decisões seguram cada parte, em vez de listar números de pergunta.
 */
export default function PaginaPrecificacao() {
  return (
    <ModuloPendente
      rotulo="Operação"
      titulo="Precificação e CMV"
      descricao="Todos os pratos de um cliente lado a lado, com custo, preço sugerido, preço praticado, markup real e CMV real — e os piores casos no topo."
      decisoes={[
        "coccao",
        "compra-para-uso",
        "custo-do-prato",
        "formacao-de-preco",
        "origem-do-preco",
        "arredondamento",
      ]}
      escopo={[
        "Custo, preço sugerido, preço praticado, markup real e CMV real, uma linha por prato.",
        "CMV alvo e margem como parâmetros por cliente, não como constante do sistema.",
        "Pontos de atenção automáticos: prato vendido abaixo do custo ou perigosamente próximo dele.",
        "Ranking de pratos por CMV, do pior para o melhor — a tela que revela o prejuízo antes que ele aconteça.",
      ]}
    />
  );
}
