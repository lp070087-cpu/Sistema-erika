/**
 * A ESFERA DE CADA ROTA.
 *
 * Existe porque a barra lateral não deve aparecer no diagnóstico público:
 * quem responde o formulário é um dono de restaurante que chegou por um
 * link, não a consultora. Sem esta separação, a única forma de tirar o
 * menu da tela pública seria duplicar o layout — e aí o sistema passaria
 * a ter duas raízes que precisam ser mantidas em par.
 *
 * São três esferas:
 *
 *   sistema  Área autenticada da consultora. Barra lateral, sessão,
 *            densidade de ferramenta.
 *
 *   publico  Formulário aberto. Sem sessão, sem menu, ritmo de site —
 *            respira mais, porque é a primeira impressão da marca.
 *
 *   nulo     Rotas que cuidam do próprio quadro: a tela de entrada e o
 *            tratamento de erro. Não recebem moldura nenhuma.
 *
 * A regra é por prefixo de rota e vive em um lugar só. A barra lateral
 * usa para decidir se marca um item como ativo; o layout raiz usa para
 * decidir qual moldura montar.
 */

/** Rotas da esfera pública — acessíveis sem sessão. */
const PREFIXOS_PUBLICOS = ["/diagnostico"] as const;

/** Rotas sem moldura — cada uma monta a própria tela inteira. */
const PREFIXOS_NULOS = ["/entrar"] as const;

/** Utilitários do próprio Next e arquivos estáticos nunca recebem moldura. */
const PREFIXOS_TECNICOS = ["/_next", "/api"] as const;

export type Esfera = "sistema" | "publico" | "nulo";

function comecaCom(caminho: string, prefixos: readonly string[]): boolean {
  return prefixos.some((p) => caminho === p || caminho.startsWith(`${p}/`));
}

export function esferaDe(caminho: string): Esfera {
  if (comecaCom(caminho, PREFIXOS_TECNICOS)) return "nulo";
  if (comecaCom(caminho, PREFIXOS_NULOS)) return "nulo";
  if (comecaCom(caminho, PREFIXOS_PUBLICOS)) return "publico";
  return "sistema";
}

/**
 * A rota é acessível sem sessão? Usado pelo Auth.js e pelo middleware.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O CASO /api NÃO PODE SER "ABERTO POR PADRÃO"                 │
 * │                                                                      │
 * │ A versão anterior respondia `esferaDe(caminho) !== "sistema"`. Como  │
 * │ os prefixos técnicos incluem "/api", TODA rota de API respondia      │
 * │ "pública" — inclusive as que ainda não existem.                     │
 * │                                                                      │
 * │ Hoje isso não faz diferença: só existe /api/auth, que precisa mesmo  │
 * │ ser alcançável sem sessão. Amanhã, a primeira rota de API da Fase 3  │
 * │ nasceria sem autenticação, sem ninguém ter decidido isso — o padrão  │
 * │ é que estaria errado, e padrão errado não aparece em revisão de      │
 * │ código porque nenhuma linha dele parece suspeita.                    │
 * │                                                                      │
 * │ Agora /api é FECHADO por padrão e só o fluxo de login é aberto pelo  │
 * │ nome. Uma rota de API nova precisa se declarar aqui para ficar       │
 * │ pública; se ninguém declarar, ela exige sessão.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function rotaPublica(caminho: string): boolean {
  if (comecaCom(caminho, PREFIXOS_TECNICOS)) {
    // Só o próprio fluxo de autenticação. O resto da API exige sessão.
    return comecaCom(caminho, ["/api/auth"]);
  }
  // /entrar (esfera nula) e /diagnostico (esfera pública) são alcançáveis.
  return esferaDe(caminho) !== "sistema";
}

export const ROTAS_PUBLICAS = PREFIXOS_PUBLICOS;
