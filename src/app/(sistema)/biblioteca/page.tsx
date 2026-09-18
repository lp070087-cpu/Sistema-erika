import type { Metadata } from "next";
import { ModuloPendente } from "@/components/ui/modulo-pendente";

export const metadata: Metadata = { title: "Biblioteca" };

/**
 * Biblioteca — material de apoio reaproveitável entre clientes.
 *
 * O material já existe: a consultora publica conteúdo assim nas redes. O que
 * este módulo acrescenta é endereçar cada item ao cliente certo. Como ele
 * depende de decisão sobre o que entra na versão 1, a tela apresenta o
 * escopo sem afirmar que ele foi aprovado.
 */
export default function PaginaBiblioteca() {
  return (
    <ModuloPendente
      rotulo="Sistema"
      titulo="Biblioteca"
      descricao="Material de apoio reaproveitável entre clientes: guias, checklists e boas práticas. A consultora já publica conteúdo assim nas redes — a Biblioteca é o mesmo material, endereçado ao cliente certo."
      escopo={[
        "Itens de biblioteca por categoria: limpeza, boas práticas, treinamento, checklist.",
        "Conteúdo em texto estruturado, vinculável a um cliente ou público.",
        "Reaproveitamento entre consultorias, sem duplicar o material.",
        "A definir com a consultora se este módulo é necessário na versão 1.",
      ]}
    />
  );
}
