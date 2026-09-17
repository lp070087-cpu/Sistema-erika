import type { Metadata } from "next";
import { ModuloPendente } from "@/components/ui/modulo-pendente";

export const metadata: Metadata = { title: "Biblioteca" };

export default function PaginaBiblioteca() {
  return (
    <ModuloPendente
      rotulo="Sistema"
      titulo="Biblioteca"
      descricao="Material de apoio reaproveitável entre clientes: guias, checklists e boas práticas. A consultora já publica conteúdo assim nas redes — a Biblioteca é o mesmo material, endereçado ao cliente certo."
      fase={9}
      escopo={[
        "Itens de biblioteca por categoria: limpeza, boas práticas, treinamento, checklist.",
        "Conteúdo em texto estruturado, vinculável a um cliente ou público.",
        "Reaproveitamento entre consultorias, sem duplicar o material.",
        "A definir com a consultora se este módulo é necessário na versão 1.",
      ]}
    />
  );
}
