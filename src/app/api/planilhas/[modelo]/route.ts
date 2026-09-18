/**
 * A ROTA QUE ENTREGA O .XLSX.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UMA ROTA, E NÃO UMA SERVER ACTION                            │
 * │                                                                      │
 * │ Uma server action devolve dados para o React, e o download de arquivo │
 * │ não é dado: é uma RESPOSTA HTTP com cabeçalhos próprios —           │
 * │ `Content-Type` do Excel, `Content-Disposition` com o nome do arquivo  │
 * │ e `no-store`. O navegador precisa ver isso como navegação, não como   │
 * │ valor de retorno de uma função.                                       │
 * │                                                                      │
 * │ A alternativa seria a action devolver o arquivo em base64 e o cliente │
 * │ montar um `Blob` — funciona, e é o caminho errado aqui: base64 infla o │
 * │ arquivo em um terço, e um relatório com trinta acompanhamentos já     │
 * │ pesa. Aqui o binário vai direto do servidor para o disco.             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA ROTA ESTÁ PROTEGIDA PELO MIDDLEWARE                             │
 * │                                                                      │
 * │ O middleware roda em tudo que não seja estático e não seja da esfera   │
 * │ pública (`/diagnostico`). `/api/planilhas/...` não é público, então    │
 * │ quem não tem sessão é redirecionado para o login ANTES de chegar      │
 * │ aqui.                                                                │
 * │                                                                      │
 * │ O matcher do middleware exclui `api/auth` e nada mais dentro de       │
 * │ `api/` — vale conferir isso ao ler o middleware, porque é uma linha   │
 * │ só e é ela que decide se a planilha do cliente fica exposta.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { gerarPlanilha, respostaDeDownload } from "@/lib/planilhas/gerador";
import { modeloDisponivel, obterModelo } from "@/lib/planilhas/modelos";
import { montarContexto } from "@/lib/planilhas/contexto";

export const runtime = "nodejs";

/*
  `nodejs` e não `edge`.

  O exceljs monta um ZIP na memória e usa APIs do Node que o runtime de borda
  não tem. A escolha aqui é explícita porque o padrão do Next mudaria isso em
  silêncio no dia em que alguém ligasse o runtime de borda no projeto — e o
  sintoma seria uma planilha que quebra só em produção.
*/

/** Nunca cacheada. Planilha é dado de cliente, montado na hora. */
export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ modelo: string }>;
};

export async function GET(requisicao: NextRequest, { params }: Props) {
  const { modelo: modeloId } = await params;
  const clienteId = requisicao.nextUrl.searchParams.get("cliente");
  const consultoriaId = requisicao.nextUrl.searchParams.get("consultoria");

  if (!clienteId) {
    return NextResponse.json(
      { erro: "Informe o cliente.", detalhe: "Sem cliente não há planilha de consultoria para gerar." },
      { status: 400 }
    );
  }

  const modelo = obterModelo(modeloId);
  if (!modelo) {
    return NextResponse.json(
      { erro: "Modelo não encontrado.", detalhe: `Não existe modelo "${modeloId}".` },
      { status: 404 }
    );
  }

  /*
    A RECUSA EDUCADA.

    Um modelo em preparação pedido direto pela URL responde 409 com o motivo
    escrito para a Érika — não 403 nem 500. É a diferença entre "você não
    pode" e "isto ainda não está pronto, e aqui está o porquê": a primeira
    faz a pessoa achar que quebrou, a segunda explica.

    A tela já esconde o botão. Esta checagem existe porque esconder botão não
    é proteção — e porque o motivo precisa chegar a quem chamou a URL na mão.
  */
  if (!modeloDisponivel(modeloId)) {
    return NextResponse.json(
      {
        erro: "Modelo ainda não disponível.",
        modelo: modelo.nome,
        motivo: modelo.motivo ?? "Em preparação.",
      },
      { status: 409 }
    );
  }

  const ctx = await montarContexto(clienteId, { consultoriaId });

  if (!ctx) {
    return NextResponse.json(
      { erro: "Cliente não encontrado.", detalhe: `Nenhum cliente com o id "${clienteId}".` },
      { status: 404 }
    );
  }

  try {
    const arquivo = await gerarPlanilha(modeloId, ctx);

    /*
      ┌──────────────────────────────────────────────────────────────────────┐
      │ AQUI É ONDE O HISTÓRICO VAI SER GRAVADO                              │
      │                                                                      │
      │ Este é o único ponto do sistema onde uma planilha passa a existir.   │
      │ É depois desta linha, e antes da resposta, que o registro descrito   │
      │ em `@/lib/planilhas/historico` vai ser criado — e é por isso que o   │
      │ comentário fica aqui, e não num arquivo de documentação: quem for    │
      │ ligar o histórico vai procurar o lugar onde o arquivo nasce.         │
      │                                                                      │
      │ ── O QUE JÁ ESTÁ NA MÃO NESTA LINHA ──────────────────────────────── │
      │                                                                      │
      │   modeloId, modelo.nome          → modeloId, modeloNome              │
      │   clienteId, ctx.cliente         → clienteId, clienteNome            │
      │   consultoriaId                  → consultoriaId                     │
      │   arquivo.nomeArquivo            → nomeArquivo                       │
      │   arquivo.nomeExibido            → nomeExibido                       │
      │   arquivo.conteudo.length        → tamanhoBytes (número REAL, medido │
      │                                     no Buffer gerado — não estimado) │
      │   arquivo.abas                   → abas                              │
      │                                    em: `new Date()`                  │
      │                                                                      │
      │ Todos os campos saem daqui sem conta nenhuma. O `tamanhoBytes` em    │
      │ especial é o que não dá para reconstruir depois: o Buffer morre no   │
      │ fim desta requisição, e o tamanho do arquivo nunca mais é conhecido  │
      │ se ninguém o medir agora.                                            │
      │                                                                      │
      │ ── O QUE ESTA ROTA AINDA NÃO SABE ────────────────────────────────── │
      │                                                                      │
      │ `geradoPor` é o único campo de `RegistroPlanilha` que não tem de     │
      │ onde sair aqui. A rota não lê a sessão: quem chega até ela já         │
      │ passou pelo middleware, mas o middleware protege, não identifica —    │
      │ ele não deixa o nome de quem entrou disponível para a rota.          │
      │                                                                      │
      │ Buscar a sessão aqui (`auth()`) é possível e é a decisão certa, com   │
      │ uma consequência: a rota passaria a depender do módulo de            │
      │ autenticação, que esta fase está proibida de alterar. Fica para o    │
      │ dia em que o histórico for ligado, junto com a tabela.               │
      │                                                                      │
      │ ── E O QUE NÃO VAI ACONTECER AQUI ────────────────────────────────── │
      │                                                                      │
      │ Nada de acumular o registro num array do módulo. Guardar em memória  │
      │ daria um histórico que aparece funcionando e some no primeiro         │
      │ reinício do servidor — pior do que não ter histórico, porque ninguém  │
      │ descobre que ele não persiste até perder alguma coisa.               │
      │                                                                      │
      │ O arquivo é gerado, entregue e esquecido. É o que esta linha faz     │
      │ hoje, e continua sendo o certo enquanto não houver onde gravar.      │
      └──────────────────────────────────────────────────────────────────────┘
    */

    return respostaDeDownload(arquivo);
  } catch (erro) {
    /*
      A falha é registrada no servidor e resumida para quem pediu.

      O `console.error` leva o erro inteiro porque é ele que vai aparecer no
      log da hospedagem quando algo der errado em produção. A resposta leva
      uma frase porque uma pilha de exceção não ajuda quem está na tela — e
      porque mensagem de erro de biblioteca costuma trazer caminho de arquivo
      do servidor, que não é informação para sair daqui.
    */
    console.error("[planilhas] falha ao gerar", modeloId, erro);

    return NextResponse.json(
      {
        erro: "Não foi possível gerar a planilha.",
        detalhe:
          erro instanceof Error && erro.name === "PlanilhaIndisponivelError"
            ? erro.message
            : "A geração falhou no servidor. Tente de novo; se continuar, o problema está registrado no log.",
      },
      { status: 500 }
    );
  }
}
