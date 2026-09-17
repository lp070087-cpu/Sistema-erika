import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import type { NextAuthRequest } from "next-auth";
import { authConfig, authConfigurado } from "@/lib/auth/config";
import { rotaPublica } from "@/lib/esfera";

/**
 * Protege o sistema inteiro — e libera a esfera pública.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * POR QUE A DECISÃO DE ACESSO ESTÁ ESCRITA AQUI, E NÃO DELEGADA
 * ═══════════════════════════════════════════════════════════════════════
 *
 * O Auth.js v5 tem duas formas de proteger uma rota, e elas NÃO se somam:
 *
 *   1. Exportar `auth` direto como middleware. A biblioteca lê o callback
 *      `authorized` e redireciona para o login quando ele devolve falso.
 *
 *   2. Passar uma função própria — `auth((req) => ...)`. Nesse caso a
 *      biblioteca NÃO redireciona mais: ela entrega a requisição à função
 *      e considera a decisão tomada.
 *
 * Conferido no código instalado (node_modules/next-auth/lib/index.js,
 * função `handleAuth`): o ramo que executa a função própria vem ANTES do
 * ramo `else if (!authorized)`, e o `??` transforma retorno vazio em
 * `NextResponse.next()`. Com uma função própria, o redirecionamento
 * automático nunca acontece.
 *
 * Escrever `auth((req) => NextResponse.next())` — que foi a primeira
 * versão deste arquivo — pareceria proteção e não seria. A requisição
 * passaria e chegaria ao layout, que redirecionaria de qualquer forma; o
 * sistema continuaria fechado, mas a porta da frente estaria aberta e
 * ninguém saberia.
 *
 * Então a decisão é explícita aqui embaixo. É mais linha de código e
 * muito menos suposição.
 */

const { auth } = NextAuth(authConfig);

/**
 * O embrulho do Auth.js, montado UMA VEZ no carregamento do módulo.
 *
 * Construído fora do handler de propósito: `initAuth` chama a função de
 * configuração em toda invocação, e montar isso a cada requisição
 * adicionaria trabalho repetido ao caminho crítico do middleware.
 */
const comSessao = auth((requisicao: NextAuthRequest) => {
  const { pathname } = requisicao.nextUrl;

  // Esfera pública — o formulário que o cliente responde sem conta.
  // A regra vive em src/lib/esfera.ts, junto com a que decide a moldura
  // visual da rota. Uma rota pública nova se declara em um lugar só.
  if (rotaPublica(pathname)) {
    return NextResponse.next();
  }

  // Já tem sessão: segue.
  if (requisicao.auth?.user) {
    return NextResponse.next();
  }

  // Sem sessão: manda para a entrada, guardando para onde a pessoa queria
  // ir. Sem o `callbackUrl`, ela perde o destino e tem de navegar de novo.
  const destino = new URL("/entrar", requisicao.nextUrl);
  destino.searchParams.set(
    "callbackUrl",
    `${pathname}${requisicao.nextUrl.search}`
  );
  return NextResponse.redirect(destino);
});

/**
 * A anotação de tipo é necessária, e vale registrar por quê.
 *
 * Das cinco sobrecargas de `auth`, o TypeScript escolhe a de route handler
 * quando o primeiro argumento é uma função — porque não tem como
 * distinguir uma coisa da outra em tempo de compilação. Em execução, o
 * Auth.js distingue: `isReqWrapper(arg)` é literalmente
 * `typeof arg === "function"`, e o ramo de middleware (o segundo, em
 * `initAuth`) é o que recebe `(request, event)`.
 *
 * O resultado é que o tipo declarado e o tipo real divergem num ponto que
 * o runtime resolve sozinho. O cast documenta isso em vez de escondê-lo.
 */
const middlewareAuth = comSessao as unknown as (
  requisicao: NextRequest,
  evento: NextFetchEvent
) => Promise<Response> | Response;

/**
 * POR QUE A VERIFICAÇÃO DE AMBIENTE VEM ANTES
 *
 * Na Fase 1 o banco e as credenciais ainda não existem, e o Auth.js lança
 * `MissingSecret` quando não há segredo — o que derrubaria a própria tela
 * que deveria explicar o que falta.
 *
 * Sem segredo, porém, NÃO existe sessão possível: `authorize()` recusa
 * qualquer credencial. Deixar a requisição seguir não expõe nada, e o
 * layout protegido redireciona para /entrar. Assim que as variáveis forem
 * preenchidas, esta guarda deixa de ter efeito.
 *
 * O export é uma FUNÇÃO, e isso não é detalhe: `isReqWrapper` testa
 * `typeof arg === "function"`. Se isto fosse um objeto exportado, o
 * Auth.js cairia no ramo de `getServerSideProps` e a sessão nunca seria
 * resolvida no middleware.
 */
export default function middleware(requisicao: NextRequest, evento: NextFetchEvent) {
  if (!authConfigurado()) {
    return NextResponse.next();
  }
  return middlewareAuth(requisicao, evento);
}

export const config = {
  // Ignora arquivos estáticos e imagens; todo o resto passa pela sessão.
  //
  // `/entrar` NÃO é excluído de propósito: ela também passa por aqui, cai
  // na guarda de `authConfigurado()` e, sem sessão, é servida normalmente
  // porque a regra de esfera a considera pública.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
