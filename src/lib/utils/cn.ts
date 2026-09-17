/**
 * Junta classes condicionais sem dependência externa.
 * Aceita strings, falsy e objetos { classe: condicao }.
 */
export type ClasseValor =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean | null | undefined>
  | ClasseValor[];

export function cn(...entradas: ClasseValor[]): string {
  const partes: string[] = [];

  for (const entrada of entradas) {
    if (!entrada) continue;

    if (typeof entrada === "string" || typeof entrada === "number") {
      partes.push(String(entrada));
      continue;
    }

    if (Array.isArray(entrada)) {
      const aninhado = cn(...entrada);
      if (aninhado) partes.push(aninhado);
      continue;
    }

    if (typeof entrada === "object") {
      for (const [classe, ativa] of Object.entries(entrada)) {
        if (ativa) partes.push(classe);
      }
    }
  }

  return partes.join(" ");
}
