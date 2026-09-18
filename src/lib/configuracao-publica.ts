/**
 * CONFIGURAÇÃO PÚBLICA — o único lugar onde moram os endereços de fora.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO EXISTE                                          │
 * │                                                                      │
 * │ São DOIS produtos, e eles são publicados separadamente:              │
 * │                                                                      │
 * │   SITE PÚBLICO        a vitrine, onde o cliente chega e faz o         │
 * │                       diagnóstico. Já está no ar.                     │
 * │                                                                      │
 * │   SISTEMA             esta aplicação, onde a consultora trabalha.     │
 * │                       Ainda não tem endereço de produção.             │
 * │                                                                      │
 * │ A tela "Meu Site" precisa mostrar os dois, e o segundo não existe     │
 * │ ainda. Se cada componente escrevesse a própria URL, no dia em que o   │
 * │ sistema subir existiriam oito lugares para corrigir — e um deles      │
 * │ ficaria para trás, mandando o cliente para o lugar errado.            │
 * │                                                                      │
 * │ Aqui é um só. Trocar o endereço do diagnóstico é trocar uma linha.    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O QUE **NÃO** SE FAZ AQUI
 *
 * Não se inventa endereço. `DIAGNOSTICO_PUBLICO_URL` está declarado e
 * NULO, porque a rota pública do diagnóstico depende de o sistema ser
 * publicado primeiro. Enquanto for nulo, a tela diz "Disponível após
 * publicação do sistema" em vez de oferecer um link que não leva a lugar
 * nenhum. Localhost jamais é oferecido como link público: um endereço que
 * só funciona na máquina da consultora é pior do que nenhum, porque ela o
 * mandaria para um cliente.
 */

/** O endereço do site público. Publicado e aprovado. */
export const SITE_PUBLICO_URL = "https://erikaconsultoria.vercel.app/";

/** O nome que a consultora reconhece. Aparece na tela "Meu Site". */
export const SITE_PUBLICO_ROTULO = "erikaconsultoria.vercel.app";

/**
 * O endereço público do DIAGNÓSTICO.
 *
 * Nulo enquanto o sistema não é publicado. O §4 do briefing da Fase 2.6
 * pediu explicitamente para não inventar URL final: a rota existe em
 * `/diagnostico` e continuará existindo quando o sistema subir, mas o
 * domínio ainda não foi definido.
 *
 * COMO LIGAR: trocar `null` por `"https://<dominio-do-sistema>/diagnostico"`.
 * Nenhuma tela precisa mudar — `urlDoDiagnostico()` responde à troca.
 */
export const DIAGNOSTICO_PUBLICO_URL: string | null = null;

/**
 * A rota interna do diagnóstico.
 *
 * Serve para ABRIR o diagnóstico durante a demonstração, em qualquer
 * aparelho que esteja rodando o sistema. É o que faz o botão "Abrir
 * diagnóstico" funcionar hoje.
 */
export const DIAGNOSTICO_ROTA_INTERNA = "/diagnostico";

/**
 * O texto que a tela mostra durante a bio do Instagram.
 *
 * É uma sugestão de bio, não um dado da cliente — escrevíamos isso como
 * ponto de partida para ela editar. Não é copiado de nenhum perfil real.
 */
export const SUGESTAO_BIO_INSTAGRAM =
  "Consultoria gastronômica para operações que querem mais organização, controle e resultado.";

/**
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ O ENVIO DO DIAGNÓSTICO ESTÁ LIGADO?                                      │
 * │                                                                          │
 * │ Falso. O sistema não tem banco conectado, e a tela de conclusão do        │
 * │ cliente precisa dizer a verdade sobre isso — sem mentir que recebeu, e    │
 * │ sem falar em "backend", "API" ou "mock" para quem não é técnico.          │
 * │                                                                          │
 * │ Este sinal existe para que o dia em que o envio for ligado seja a troca   │
 * │ de UMA linha, e não a reescrita de uma tela. Quando virar `true`, a       │
 * │ conclusão troca o aviso de demonstração pela confirmação real — e nada    │
 * │ mais no fluxo muda, porque o formulário já entrega as respostas          │
 * │ completas, indexadas por id de pergunta.                                 │
 * │                                                                          │
 * │ Enquanto for `false`, nenhum texto pode prometer que a resposta chegou.   │
 * └──────────────────────────────────────────────────────────────────────────┘
 */
export const ENVIO_DO_DIAGNOSTICO_ATIVO = false;

/**
 * O fuso horário da consultora.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO PRECISA ESTAR DECLARADO, E NÃO SER LIDO DO SISTEMA      │
 * │                                                                      │
 * │ O servidor do sistema roda em UTC. A saudação do painel, o "hoje" da  │
 * │ agenda e a comparação de prazo precisam do horário DA PAREDE DELA —   │
 * │ e às 21h em São Paulo o servidor já está no dia seguinte.             │
 * │                                                                      │
 * │ Declarado aqui, o fuso é um dado só: quando a consultoria atender     │
 * │ alguém em outro estado, é esta linha que muda, e nenhuma tela         │
 * │ precisa saber disso.                                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const FUSO_HORARIO = "America/Sao_Paulo";

/** Linha de rodapé de identificação do produto. */
export const MARCA_NOME = "Érika Bruna";
/**
 * Como o sistema a chama ao falar COM ela.
 *
 * Declarado em vez de derivado de `MARCA_NOME.split(" ")`: a saudação é a
 * primeira coisa que ela lê ao abrir o sistema, e não é lugar para uma
 * expressão que funciona por acidente — no dia em que o nome virar "Érika
 * Bruna Consultoria", o `split` passaria a chamá-la de "Érika" por sorte e
 * o rodapé mudaria junto.
 */
export const MARCA_PRIMEIRO_NOME = "Érika";
export const MARCA_DESCRICAO = "Consultoria Gastronômica";
export const SISTEMA_VERSAO = "0.1.0";

/**
 * O endereço do diagnóstico, ou `null` se ainda não houver.
 *
 * Existe como função e não como constante para que o dia da publicação
 * seja uma troca de valor, não uma caça a referências.
 */
export function urlDoDiagnostico(): string | null {
  return DIAGNOSTICO_PUBLICO_URL;
}

/**
 * O que a tela deve dizer sobre o link do diagnóstico.
 *
 * Uma frase, calculada num lugar só. Se cada tela decidisse o texto, duas
 * telas irmãs diriam coisas diferentes sobre o mesmo estado vazio — que é
 * o defeito clássico de dado ausente tratado em cada tela por si.
 */
export function estadoDoDiagnostico():
  | { disponivel: true; url: string }
  | { disponivel: false; motivo: string } {
  const url = urlDoDiagnostico();
  if (url) return { disponivel: true, url };
  return {
    disponivel: false,
    motivo:
      "Disponível após publicação do sistema. Enquanto isso, use o botão “Abrir diagnóstico” para ver como o cliente responde.",
  };
}
