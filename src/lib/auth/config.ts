import type { NextAuthConfig } from "next-auth";
import { rotaPublica } from "@/lib/esfera";

/**
 * Configuração compartilhada do Auth.js.
 *
 * Roda também na borda (middleware), por isso NÃO importa Prisma nem
 * `node:crypto` aqui. A conferência de senha fica no provider, em
 * src/lib/auth/index.ts, que só executa no servidor Node.
 *
 * Usuário único nesta fase: as credenciais vêm de variável de ambiente.
 * A tabela `users` já existe no schema para quando houver mais de uma
 * pessoa com acesso (fases 8 e 9) — criá-la em uso agora seria
 * estrutura vazia.
 */
export const authConfig = {
  // Lido direto do ambiente: este arquivo é avaliado antes de qualquer
  // validação, e o middleware precisa poder carregá-lo sem lançar erro.
  secret: process.env.AUTH_SECRET,

  pages: {
    signIn: "/entrar",
    error: "/entrar",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  },

  trustHost: true,

  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      // A regra de quais rotas são públicas vive em src/lib/esfera.ts, em
      // um lugar só. Aqui basta perguntar. Antes desta mudança a lista
      // estava duplicada neste arquivo e no middleware — duas cópias que
      // divergem no dia em que uma rota pública nova aparece.
      if (pathname.startsWith("/api/auth")) return true;
      if (rotaPublica(pathname)) return true;
      return Boolean(auth?.user);
    },

    jwt({ token, user }) {
      if (user) {
        token.papel = (user as { papel?: string }).papel ?? "ADMIN";
      }
      return token;
    },

    session({ session, token }) {
      if (session.user) {
        (session.user as { papel?: string }).papel =
          (token.papel as string | undefined) ?? "ADMIN";
      }
      return session;
    },
  },

  providers: [],
} satisfies NextAuthConfig;

/**
 * O ambiente tem o essencial para autenticar?
 *
 * Usado pelo middleware e pelo layout protegido para decidir se podem
 * confiar no Auth.js — que lança `MissingSecret` quando não há segredo,
 * em vez de simplesmente não autenticar.
 *
 * Sem segredo, NÃO existe sessão possível: `authorize()` recusa todo
 * mundo, então deixar a requisição passar não expõe nada. E o layout
 * protegido redireciona para a tela de entrada, que explica o que falta.
 */
export function authConfigurado(): boolean {
  return Boolean(
    process.env.AUTH_SECRET?.trim() &&
      process.env.AUTH_EMAIL?.trim() &&
      process.env.AUTH_PASSWORD_HASH?.trim()
  );
}
