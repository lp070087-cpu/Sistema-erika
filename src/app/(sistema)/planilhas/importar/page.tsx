import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { obterRepositorioOperacao } from "@/lib/dados";
import { ORIGEM_PADRAO, origemDaUrl, origemDe } from "@/lib/planilhas/importacao/origens";
import { destinoDaUrl } from "@/lib/planilhas/importacao/destino";
import { JanelaDaImportacao } from "./janela";

export const metadata: Metadata = { title: "Importar documento" };

/**
 * A PÁGINA DA IMPORTAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA ROTA EXISTE SEPARADA DA CENTRAL                          │
 * │                                                                      │
 * │ A Central é uma tela de UMA planilha, e a grade é o centro dela. A     │
 * │ importação tem quatro etapas e uma esteira própria — arquivo, leitura, │
 * │ conferência, prévia. Encaixá-la dentro da Central empurraria a grade   │
 * │ para fora da tela justamente no momento em que ela está trabalhando,   │
 * │ que é o defeito que esta rodada existe para consertar.                 │
 * │                                                                      │
 * │ Aqui ela é a tela inteira, e a Central fica a um clique de volta.      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE O SERVIDOR FAZ AQUI — E É SÓ ISSO                              │
 * │                                                                      │
 * │ Ele lê o cliente da URL, quando veio um, para o subtítulo do arquivo   │
 * │ dizer de quem é a ficha. Nada mais.                                    │
 * │                                                                      │
 * │ A janela inteira roda no NAVEGADOR porque tudo o que ela chama é puro: │
 * │ `conferirDocumento`, `aplicarCorrecoes`, `calcularImportacao` e        │
 * │ `gradeDaImportacao` não importam `exceljs` nem `server-only`. É a      │
 * │ mesma separação que sustenta a Central — `grade.ts` puro de um lado,   │
 * │ `escrever-grade.ts` no servidor do outro —, e é ela que faz corrigir   │
 * │ uma linha não custar uma ida ao servidor.                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Props = {
  searchParams: Promise<{ cliente?: string; origem?: string; destino?: string }>;
};

export default async function PaginaImportar({ searchParams }: Props) {
  const {
    cliente: clienteId,
    origem: origemDaUrl_,
    destino: destinoDaUrl_,
  } = await searchParams;

  /*
    A PORTA, VALIDADA PELA CAMADA QUE A CONHECE.

    O `?origem=` é texto da URL, e por isso não é confiável: qualquer valor
    pode chegar ali. `origemDaUrl` devolve `null` para tudo o que não é uma
    das quatro — e o `?? ORIGEM_PADRAO` cobre o link antigo, que não trazia
    parâmetro nenhum.

    É de propósito que a validação more em `origens.ts` e não aqui: a lista
    das quatro portas é dele, e uma segunda cópia da lista nesta página
    ficaria para trás no dia em que a quinta porta chegasse.
  */
  const idDaOrigem = origemDaUrl(origemDaUrl_) ?? ORIGEM_PADRAO;
  const origem = origemDe(idDaOrigem);

  /*
    O DESTINO, VALIDADO PELA MESMA CAMADA QUE O CONHECE.

    Quem pré-seleciona é o link: `/ingredientes` manda `?destino=ingredientes`,
    `/fichas` manda `?destino=ficha`, a Central manda `?destino=planilha`. Não é
    a janela que adivinha pelo caminho de volta — o briefing pede que o
    contexto pré-selecione, e um parâmetro explícito é o contexto dito em voz
    alta, em vez de inferido.

    ┌────────────────────────────────────────────────────────────────────┐
    │ O QUE A PRÉ-SELEÇÃO **NÃO** FAZ                                    │
    │                                                                    │
    │ Ela não pula a conferência, e não decide sozinha. O que ela faz é    │
    │ abrir o painel de destino já com o botão certo embaixo do dedo —    │
    │ as três opções continuam visíveis e trocáveis, e o botão continua    │
    │ desabilitado enquanto `vereditoDoDestino` recusar.                  │
    │                                                                    │
    │ Sem parâmetro nenhum, `undefined` chega à janela e o padrão é        │
    │ PLANILHA: o link antigo, que não trazia destino, segue fazendo       │
    │ exatamente o que fazia.                                             │
    └────────────────────────────────────────────────────────────────────┘
  */
  const idDoDestino = destinoDaUrl(destinoDaUrl_);

  /*
    O CLIENTE É OPCIONAL AQUI, e isso é diferente da Central.

    Uma ficha técnica pode chegar como PDF solto, sem cliente nenhum por trás —
    é o caso de quem está organizando o caderno de receitas antes de ter o
    cliente cadastrado. Exigir um cliente para importar fecharia a única porta
    de entrada que funciona sem leitura automática configurada.

    Quando ele vem, é só para o subtítulo e o nome do arquivo dizerem de onde
    a ficha saiu.
  */
  let nomeCliente: string | null = null;
  if (clienteId) {
    const cliente = await obterRepositorioOperacao().obterCliente(clienteId);
    nomeCliente = cliente?.nomeFantasia ?? null;
  }

  return (
    <div className="space-y-5">
      <CabecalhoPagina
        rotulo="Documentos"
        titulo={`Importar ${origem.rotulo.toLowerCase()}`}
        descricao={`${origem.descricao} Confira o que o sistema leu, ajuste o que precisar e gere a planilha — ou monte as linhas à mão.`}
      />

      <Link
        href="/planilhas"
        className="inline-block text-[0.8125rem] text-oliva underline-offset-2 hover:underline"
      >
        ← Voltar para a Central de Planilhas
      </Link>

      <JanelaDaImportacao
        nomeCliente={nomeCliente}
        clienteId={clienteId ?? ""}
        origem={idDaOrigem}
        destino={idDoDestino}
      />
    </div>
  );
}
