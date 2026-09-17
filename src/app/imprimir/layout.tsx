import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { authConfigurado } from "@/lib/auth/config";

/**
 * A CASCA — ou a ausência dela — DA ROTA DE IMPRESSÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA ROTA VIVE FORA DO GRUPO `(sistema)`                     │
 * │                                                                      │
 * │ O relatório é uma folha que vira papel. Se ele estivesse dentro do    │
 * │ grupo, herdaria o menu lateral, o sino e a busca — e o cliente        │
 * │ receberia um recorte do software em vez de um documento.              │
 * │                                                                      │
 * │ Aqui não há casca nenhuma: só a margem do papel e a marca.            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO PROTEGE                                        │
 * │                                                                      │
 * │ Sair do grupo tem um custo que não é visual: a verificação de sessão   │
 * │ do `(sistema)/layout.tsx` deixa de valer, e o middleware sozinho não   │
 * │ é uma camada — é a única. Então a checagem é repetida aqui, e a        │
 * │ página a repete de novo.                                              │
 * │                                                                      │
 * │ Três verificações para a mesma porta parece exagero. Não é: o         │
 * │ middleware pode ser afrouxado por engano numa edição futura, e um      │
 * │ relatório de cliente exposto na web é dado comercial de terceiro      │
 * │ vazando — o tipo de erro que não se corrige depois.                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export default async function LayoutImpressao({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!authConfigurado()) {
    redirect("/entrar");
  }

  const sessao = await auth();

  if (!sessao?.user) {
    redirect("/entrar");
  }

  return <>{children}</>;
}
