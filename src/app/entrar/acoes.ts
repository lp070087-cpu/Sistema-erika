"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { conferirAmbiente } from "@/lib/env";

export type EstadoEntrar = { erro: string | null };

/**
 * Server Action de entrada.
 *
 * Mensagens genéricas de propósito: a tela nunca revela se o e-mail
 * existe. Erros de ambiente, porém, são ditos claramente — é o que
 * impede a "tela de login que não funciona" sem explicação.
 */
export async function entrar(
  _estadoAnterior: EstadoEntrar,
  dados: FormData
): Promise<EstadoEntrar> {
  const email = String(dados.get("email") ?? "").trim();
  const senha = String(dados.get("senha") ?? "");

  if (!email || !senha) {
    return { erro: "Informe e-mail e senha." };
  }

  const ambiente = conferirAmbiente();
  if (!ambiente.pronto) {
    return {
      erro: `Ambiente incompleto: ${ambiente.faltando.join(", ")} não configurado(s) no arquivo .env.`,
    };
  }

  try {
    await signIn("credentials", { email, senha, redirect: false });
  } catch (erro) {
    if (erro instanceof AuthError) {
      return { erro: "E-mail ou senha incorretos." };
    }
    throw erro;
  }

  // `redirect` fica fora do try: ele sinaliza por exceção e não é erro.
  redirect("/");
}
