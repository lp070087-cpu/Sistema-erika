import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import type { ScryptOptions } from "node:crypto";

/**
 * Verificação de senha.
 *
 * Usa apenas o módulo `crypto` do Node — scrypt é uma KDF adequada para
 * senha e evita acrescentar uma dependência (bcrypt/argon2) só para isso.
 *
 * Formato armazenado, autocontido:
 *   scrypt$<saltHex>$<hashHex>
 *
 * É gerado por `npm run senha:hash -- "sua-senha"`.
 */

const PARAMETROS = { N: 16384, r: 8, p: 1, keylen: 64 } as const;
const PREFIXO = "scrypt";

/**
 * `promisify(scrypt)` não serve aqui: o `crypto.scrypt` tem assinaturas
 * sobrepostas e, ao promisificar, o TypeScript resolve para a variante de
 * três argumentos — as opções (`N`, `r`, `p`) deixam de ser aceitas.
 * Envolver a chamada à mão preserva a sobrecarga correta e ainda deixa o
 * erro de callback virar rejeição de promise.
 */
function derivar(senha: string, salt: Buffer, tamanho: number): Promise<Buffer> {
  const opcoes: ScryptOptions = {
    N: PARAMETROS.N,
    r: PARAMETROS.r,
    p: PARAMETROS.p,
  };

  return new Promise((resolver, rejeitar) => {
    scrypt(senha, salt, tamanho, opcoes, (erro, chave) => {
      if (erro) rejeitar(erro);
      else resolver(chave);
    });
  });
}

export async function conferirSenha(senha: string, armazenado: string): Promise<boolean> {
  const partes = armazenado.split("$");
  if (partes.length !== 3) return false;

  const [prefixo, saltHex, hashHex] = partes;
  if (prefixo !== PREFIXO || !saltHex || !hashHex) return false;

  try {
    const salt = Buffer.from(saltHex, "hex");
    const esperado = Buffer.from(hashHex, "hex");

    const derivada = await derivar(senha, salt, esperado.length);

    // timingSafeEqual exige o mesmo tamanho.
    if (derivada.length !== esperado.length) return false;
    return timingSafeEqual(derivada, esperado);
  } catch {
    return false;
  }
}

/** Gera um hash novo. Usado pelo script de linha de comando e por testes. */
export async function gerarHashSenha(senha: string): Promise<string> {
  const salt = randomBytes(16);
  const derivada = await derivar(senha, salt, PARAMETROS.keylen);
  return `${PREFIXO}$${salt.toString("hex")}$${derivada.toString("hex")}`;
}
