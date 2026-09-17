#!/usr/bin/env node
/**
 * Gera o hash da senha de acesso ao sistema.
 *
 * Uso:
 *   npm run senha:hash -- "minha-senha"
 *
 * O resultado vai em AUTH_PASSWORD_HASH no arquivo .env.
 * O formato é `scrypt$<saltHex>$<hashHex>` — autocontido, sem dependência
 * externa, e verificável por src/lib/auth/senha.ts.
 */
import { randomBytes, scryptSync } from "node:crypto";

const PARAMETROS = { N: 16384, r: 8, p: 1, keylen: 64 };

const senha = process.argv[2];

if (!senha) {
  console.error("\nInforme a senha.\n");
  console.error('  npm run senha:hash -- "minha-senha"\n');
  process.exit(1);
}

if (senha.length < 8) {
  console.error("\nA senha precisa ter ao menos 8 caracteres.\n");
  process.exit(1);
}

const salt = randomBytes(16);
const derivada = scryptSync(senha, salt, PARAMETROS.keylen, {
  N: PARAMETROS.N,
  r: PARAMETROS.r,
  p: PARAMETROS.p,
});

const hash = `scrypt$${salt.toString("hex")}$${derivada.toString("hex")}`;

console.log("\nHash gerado. Cole no .env:\n");
console.log(`AUTH_PASSWORD_HASH=${hash}\n`);
