import type { DefaultSession } from "next-auth";

/**
 * Extensão de tipos do Auth.js.
 *
 * `papel` já existe desde a Fase 1, mesmo com usuário único, para que
 * a introdução de CONSULTORA / CLIENTE / EQUIPE_CLIENTE nas fases 8 e 9
 * seja uma mudança de dados, não uma mudança de arquitetura.
 */
declare module "next-auth" {
  interface User {
    papel?: "ADMIN" | "CONSULTORA" | "CLIENTE" | "EQUIPE_CLIENTE";
  }

  interface Session {
    user: {
      papel?: "ADMIN" | "CONSULTORA" | "CLIENTE" | "EQUIPE_CLIENTE";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    papel?: string;
  }
}
