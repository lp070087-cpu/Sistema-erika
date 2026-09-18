"use client";

import { useRef, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { cn } from "@/lib/utils/cn";

/**
 * O BOTÃO QUE BAIXA O ARQUIVO DE VERDADE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM CLIENT COMPONENT, E O QUE ELE FAZ DE DIFERENTE      │
 * │                                                                      │
 * │ A rota `/api/planilhas/[modelo]` responde com os BYTES do .xlsx e os  │
 * │ cabeçalhos de download. Um `<a href>` comum já bastaria para baixar — │
 * │ e é o que a primeira versão fazia.                             │
 * │                                                                      │
 * │ O que o link não faz é CONTAR O QUE ESTÁ ACONTECENDO. Gerar uma       │
 * │ planilha leva alguns segundos: o servidor lê os dados, monta o        │
 * │ arquivo e comprime. Num link comum, esse tempo é uma página parada   │
 * │ sem nenhum sinal — e a reação natural é clicar de novo, e de novo,    │
 * │ disparando três gerações e três downloads.                            │
 * │                                                                      │
 * │ Aqui o clique vira um `fetch`, o botão entra em estado de carregando  │
 * │ e desabilita, e a falha vira MENSAGEM em vez de uma aba em branco.    │
 * │ É a diferença entre "parece que travou" e "está gerando".             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O BLOB, E POR QUE ELE PASSA POR UM <a> INVISÍVEL                      │
 * │                                                                      │
 * │ O `fetch` traz os bytes; o navegador só grava em disco se eles        │
 * │ virarem um `Blob` com URL própria e alguém clicar num link para ele.  │
 * │ É o caminho padrão para download disparado por JavaScript, e não tem  │
 * │ alternativa melhor sem passar por base64 (que infla o arquivo).       │
 * │                                                                      │
 * │ O `URL.revokeObjectURL` no fim é OBRIGATÓRIO e é o passo que todo     │
 * │ mundo esquece: sem ele, o Blob fica na memória do navegador até a     │
 * │ aba fechar. Numa tela onde se geram planilhas repetidamente, isso     │
 * │ vira vazamento — pequeno por arquivo, e acumulado ao longo do dia.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * Lê o nome do arquivo de dentro do `Content-Disposition`.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO SE MONTA O NOME AQUI NO CLIENTE                         │
 * │                                                                      │
 * │ Seria mais simples escrever `consultoria-${slug(cliente)}-${data}.xlsx`│
 * │ aqui e não ler cabeçalho nenhum. Duas razões para não:                 │
 * │                                                                      │
 * │ 1. Duas implementações do mesmo nome divergem. O servidor já gera o   │
 * │    nome seguro; repetir a regra aqui garante que no dia em que uma    │
 * │    delas mudar, o arquivo baixado passe a ter nome diferente do que   │
 * │    o servidor registrou.                                              │
 * │                                                                      │
 * │ 2. O NOME É DECISÃO DO SERVIDOR. É ele que sabe de quem é a planilha  │
 * │    e que já resolveu acento e caractere proibido. O cliente só       │
 * │    obedece.                                                           │
 * │                                                                      │
 * │ O `filename*` (com UTF-8) tem PRIORIDADE sobre o `filename` comum —    │
 * │ é a RFC 5987. A ordem das tentativas aqui segue essa regra: se o       │
 * │ `filename*` existe, ele é o nome; o comum é só o reserva para         │
 * │ navegador antigo.                                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function nomeDoArquivo(cabecalho: string | null, reserva: string): string {
  if (!cabecalho) return reserva;

  // `filename*=UTF-8''nome%20com%20acento.xlsx`
  const comUtf8 = /filename\*=UTF-8''([^;]+)/i.exec(cabecalho);
  if (comUtf8?.[1]) {
    try {
      return decodeURIComponent(comUtf8[1]);
    } catch {
      // Header malformado não derruba o download: o nome reserva serve.
    }
  }

  const simples = /filename="([^"]+)"/i.exec(cabecalho);
  return simples?.[1] ?? reserva;
}

/**
 * A leitura do erro quando a geração falha.
 *
 * A rota responde em JSON com `{ erro, detalhe }` — e é o `detalhe` que
 * interessa, porque é ele que diz "este modelo depende de uma regra que
 * ainda não foi definida", em vez de "erro 409". Traduzir código HTTP em
 * frase é o trabalho que a rota já fez; aqui só se aproveita.
 *
 * A rede pode falhar antes de haver resposta, e aí não há JSON para ler —
 * por isso o `try` em volta do `json()`.
 */
async function leituraDoErro(resposta: Response): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { erro?: string; detalhe?: string; motivo?: string };
    return corpo.detalhe ?? corpo.motivo ?? corpo.erro ?? `A geração falhou (${resposta.status}).`;
  } catch {
    return `A geração falhou (${resposta.status}) e o servidor não devolveu detalhe.`;
  }
}

export function BotaoGerarPlanilha({
  modeloId,
  clienteId,
  consultoriaId,
  nomeCliente,
  className,
}: {
  modeloId: string;
  clienteId: string;
  consultoriaId?: string | null;
  /** Usado só no nome de reserva, se o cabeçalho não vier. */
  nomeCliente: string;
  className?: string;
}) {
  const [estado, definirEstado] = useState<"parado" | "gerando" | "ok" | "erro">("parado");
  const [mensagem, definirMensagem] = useState<string | null>(null);

  /*
    A trava contra clique duplo.

    `disabled` no botão já impede o segundo clique na maioria dos casos, mas
    há uma janela entre o clique e o React repintar o botão — e um clique
    duplo rápido cabe nela. A ref muda na hora, sem esperar o render, e é o
    que garante uma geração só.
  */
  const gerando = useRef(false);

  async function gerar() {
    if (gerando.current) return;
    gerando.current = true;
    definirEstado("gerando");
    definirMensagem(null);

    const parametros = new URLSearchParams({ cliente: clienteId });
    if (consultoriaId) parametros.set("consultoria", consultoriaId);

    try {
      const resposta = await fetch(
        `/api/planilhas/${encodeURIComponent(modeloId)}?${parametros.toString()}`,
        { cache: "no-store" }
      );

      if (!resposta.ok) {
        definirEstado("erro");
        definirMensagem(await leituraDoErro(resposta));
        return;
      }

      /*
        A CONFERÊNCIA QUE PARECE EXCESSO E NÃO É.

        ┌────────────────────────────────────────────────────────────────┐
        │ POR QUE `resposta.ok` NÃO BASTA                               │
        │                                                                │
        │ O middleware protege `/api/planilhas/...`: sem sessão, ele     │
        │ REDIRECIONA para `/entrar`. E um redirecionamento seguido pelo │
        │ `fetch` termina em 200 — com a página de login em HTML no      │
        │ corpo.                                                         │
        │                                                                │
        │ Sem esta linha, o navegador gravaria um "consultoria-x.xlsx"   │
        │ que é HTML por dentro. O Excel abriria com erro de formato, e a │
        │ conclusão natural seria "a planilha está quebrada" — quando o  │
        │ problema é que a sessão caiu.                                  │
        │                                                                │
        │ Acontece quando a sessão expira com a aba já aberta, que é     │
        │ exatamente o cenário de quem deixa o sistema aberto o dia      │
        │ inteiro. Custa uma comparação de texto.                        │
        └────────────────────────────────────────────────────────────────┘
      */
      const tipo = resposta.headers.get("Content-Type") ?? "";
      if (!tipo.includes("spreadsheet")) {
        definirEstado("erro");
        definirMensagem(
          "A sessão expirou e o servidor devolveu a tela de entrada em vez do arquivo. Entre de novo e repita a geração."
        );
        return;
      }

      const blob = await resposta.blob();
      const nome = nomeDoArquivo(
        resposta.headers.get("Content-Disposition"),
        `consultoria-${nomeCliente.toLowerCase().replace(/\s+/g, "-")}.xlsx`
      );

      /*
        O link invisível.

        Criado, clicado e removido no mesmo instante — ele nunca aparece na
        árvore da página. O `document.body.appendChild` é necessário no
        Firefox, que ignora o clique de um link que não está no documento.
      */
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = nome;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Sem isto, o arquivo fica na memória do navegador até a aba fechar.
      URL.revokeObjectURL(url);

      definirEstado("ok");
      definirMensagem(nome);
    } catch {
      /*
        Chegar aqui significa que o `fetch` em si falhou — rede caiu, o
        servidor não respondeu. É um erro diferente de "a geração recusou", e
        a mensagem precisa dizer isso: a primeira é "tente de novo", a
        segunda é "isto não está pronto".
      */
      definirEstado("erro");
      definirMensagem(
        "Não foi possível falar com o servidor. Verifique a conexão e tente de novo."
      );
    } finally {
      gerando.current = false;
    }
  }

  const carregando = estado === "gerando";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Botao
        variante="primario"
        tamanho="sm"
        onClick={gerar}
        disabled={carregando}
        // `aria-busy` avisa o leitor de tela que a ação está em curso: sem
        // ele, quem não vê o botão mudar de cor não tem como saber que algo
        // está acontecendo.
        aria-busy={carregando}
      >
        {carregando ? "Gerando…" : "Gerar planilha"}
      </Botao>

      {/*
        O RETORNO É TEXTO, E NÃO SÓ COR.

        "Pronto" em verde e "falhou" em vermelho não dizem nada a quem não
        distingue as duas cores — e há uma diferença de conteúdo real entre as
        duas: uma traz o nome do arquivo, a outra traz o motivo da falha. O
        texto é o conteúdo; a cor é o reforço.
      */}
      {estado === "ok" && mensagem ? (
        <p role="status" className="text-[0.75rem] leading-snug text-medio">
          Arquivo salvo: <span className="font-medium">{mensagem}</span>
        </p>
      ) : null}

      {estado === "erro" && mensagem ? (
        <p role="alert" className="text-[0.75rem] leading-snug text-red-800">
          {mensagem}
        </p>
      ) : null}
    </div>
  );
}
