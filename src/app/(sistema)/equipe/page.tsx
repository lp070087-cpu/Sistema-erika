import type { Metadata } from "next";
import { ModuloPendente } from "@/components/ui/modulo-pendente";

export const metadata: Metadata = { title: "Equipe" };

/**
 * Equipe — o módulo que talvez não precise existir.
 *
 * Hoje o responsável por um preparo é um campo de texto no processo, e isso
 * pode ser suficiente. Registrar pessoas exige manter ficha de funcionário
 * de cliente, com treinamento e turno — o que só se justifica se a
 * consultora quiser gerir pessoas, e não apenas nomear quem executa. Como
 * essa pergunta ainda não foi respondida, a tela não promete nada além do
 * que está em discussão.
 */
export default function PaginaEquipe() {
  return (
    <ModuloPendente
      rotulo="Operação"
      titulo="Equipe"
      descricao="As pessoas que executam na cozinha do cliente. Hoje o responsável por um preparo é apenas um nome escrito no processo; este módulo só se justifica se a consultora quiser gerir pessoas, e não somente nomear responsáveis."
      escopo={[
        "Cadastro de pessoas por cliente, com função e turno.",
        "Vínculo com etapas de processo e com a lista de pratos por praça.",
        "Treinamento: quem já foi treinado em qual preparo.",
        "A definir com a consultora se este módulo é necessário ou se um campo de texto basta.",
      ]}
    />
  );
}
