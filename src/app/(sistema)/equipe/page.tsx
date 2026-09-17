import type { Metadata } from "next";
import { ModuloPendente } from "@/components/ui/modulo-pendente";

export const metadata: Metadata = { title: "Equipe" };

export default function PaginaEquipe() {
  return (
    <ModuloPendente
      rotulo="Clientes"
      titulo="Equipe"
      descricao="As pessoas que executam na cozinha do cliente. Na Fase 1 são apenas um campo de texto no processo; este módulo só se justifica se a consultora quiser gerir pessoas, e não apenas nomear responsáveis."
      fase={6}
      escopo={[
        "Cadastro de pessoas por cliente, com função e turno.",
        "Vínculo com etapas de processo e com a lista de pratos por praça.",
        "Treinamento: quem já foi treinado em qual preparo.",
        "A definir com a consultora se este módulo é necessário ou se um campo de texto basta.",
      ]}
    />
  );
}
