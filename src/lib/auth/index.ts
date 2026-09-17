import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "./config";
import { conferirSenha } from "./senha";

/**
 * Instância do Auth.js no servidor Node.
 *
 * Usuário único: confere e-mail e hash de senha contra as variáveis de
 * ambiente. Nenhuma senha em texto puro é armazenada ou registrada.
 *
 * Quando a Fase 9 chegar, este provider passa a consultar a tabela
 * `users` — o formato do hash já é compatível com a coluna `senhaHash`.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credenciais) {
        const email = String(credenciais?.email ?? "")
          .trim()
          .toLowerCase();
        const senha = String(credenciais?.senha ?? "");

        if (!email || !senha) return null;

        const emailEsperado = process.env.AUTH_EMAIL?.trim().toLowerCase();
        const hashEsperado = process.env.AUTH_PASSWORD_HASH?.trim();

        // Se o ambiente não está configurado, não autentica ninguém —
        // e a tela de login explica isso em vez de falhar em silêncio.
        if (!emailEsperado || !hashEsperado) return null;

        const emailConfere = email === emailEsperado;
        // A senha é conferida mesmo com e-mail errado, para que o tempo de
        // resposta não revele se o e-mail existe.
        const senhaConfere = await conferirSenha(senha, hashEsperado);

        if (!emailConfere || !senhaConfere) return null;

        return {
          id: "consultora",
          name: "Érika Bruna",
          email: emailEsperado,
          papel: "ADMIN",
        };
      },
    }),
  ],
});
