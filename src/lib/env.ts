/**
 * Verificação do ambiente.
 *
 * FALHA EXPLÍCITA, NÃO SILENCIOSA.
 *
 * Na Fase 1 o banco e as credenciais ainda não existem — é o estado
 * esperado, não um defeito. Em vez de deixar a tela de login recusar
 * acesso sem explicar, `conferirAmbiente()` responde o que está faltando
 * e a interface mostra isso de forma clara.
 *
 * Não lança erro de propósito: quem chama decide o que fazer. Quem
 * realmente precisa falhar (o acesso ao banco, o Auth.js) já falha
 * sozinho e com mensagem própria.
 */

const ESSENCIAIS = ["AUTH_SECRET", "AUTH_EMAIL", "AUTH_PASSWORD_HASH"] as const;

type VariavelEssencial = (typeof ESSENCIAIS)[number];

export function conferirAmbiente(): {
  pronto: boolean;
  faltando: VariavelEssencial[];
  /** O banco está configurado? Independente das credenciais de acesso. */
  bancoConfigurado: boolean;
} {
  const faltando = ESSENCIAIS.filter((chave) => !process.env[chave]?.trim());

  return {
    pronto: faltando.length === 0,
    faltando: [...faltando],
    bancoConfigurado: Boolean(process.env.DATABASE_URL?.trim()),
  };
}
