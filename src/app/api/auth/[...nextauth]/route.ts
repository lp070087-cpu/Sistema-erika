import { handlers } from "@/lib/auth";

/**
 * Rotas do Auth.js (login, logout, sessão, CSRF).
 * Ficam fora do middleware, conforme a configuração em src/middleware.ts.
 */
export const { GET, POST } = handlers;
