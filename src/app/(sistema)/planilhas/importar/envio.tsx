"use client";

import { useRef, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { cn } from "@/lib/utils/cn";
import { TAMANHO_MAXIMO, conferirArquivo, tamanhoLegivel, type Recusa } from "@/lib/planilhas/importacao/seguranca";

/**
 * O ENVIO DO ARQUIVO — a ETAPA 1 do fluxo do PDF.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ETAPA 1 MOSTRA O QUE SABE, E SÓ O QUE SABE                          │
 * │                                                                      │
 * │ O briefing define quatro etapas para o fluxo, e esta é a primeira:     │
 * │ ARQUIVO — escolher ou arrastar, e ver nome, tamanho e status.          │
 * │                                                                      │
 * │ Nome e tamanho são FATO: são propriedades do `File` que o navegador    │
 * │ entrega, e não dependem de ninguém ter lido o documento. É por isso    │
 * │ que eles podem aparecer aqui — antes de qualquer leitura, e sem que    │
 * │ a tela precise prometer nada.                                         │
 * │                                                                      │
 * │ Nada além disso é exibido nesta etapa. Contagem de páginas, título do  │
 * │ documento, lista de ingredientes: tudo isso exigiria ter aberto o      │
 * │ arquivo, e abrir o arquivo é a etapa 2 — que hoje responde            │
 * │ "não há leitor configurado". Mostrar qualquer um desses aqui seria     │
 * │ inventar.                                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A RECUSA APARECE NA HORA, E NÃO NO FIM DO FLUXO              │
 * │                                                                      │
 * │ `conferirArquivo` roda assim que o arquivo é escolhido. Ela poderia    │
 * │ rodar só quando ela clicasse em "continuar" — e aí ela teria          │
 * │ atravessado a tela inteira para descobrir que o arquivo não serve.     │
 * │                                                                      │
 * │ A recusa é uma função assíncrona porque uma das cinco checagens lê os  │
 * │ primeiros bytes do arquivo. Ela continua sendo rápida — cinco bytes —  │
 * │ e mesmo assim o botão fica desabilitado enquanto roda, porque um       │
 * │ clique durante a conferência passaria um arquivo ainda não conferido   │
 * │ para a etapa seguinte.                                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** O que a tela sabe sobre o arquivo escolhido. */
export type ArquivoEscolhido = {
  arquivo: File;
  nome: string;
  tamanho: string;
};

export function EnvioDeArquivo({
  aoEscolher,
  escolhido,
  aoLimpar,
}: {
  aoEscolher: (arquivo: ArquivoEscolhido) => void;
  escolhido: ArquivoEscolhido | null;
  aoLimpar: () => void;
}) {
  const [recusa, definirRecusa] = useState<Recusa | null>(null);
  const [conferindo, definirConferindo] = useState(false);
  const [arrastando, definirArrastando] = useState(false);

  /*
    A REFERÊNCIA DO INPUT, e não um `<label>` envolvendo tudo.

    O `<input type="file">` fica escondido e é aberto pela referência, porque
    o input cru tem um botão "Escolher arquivo" que o navegador desenha com o
    próprio estilo — e ele não combina com nada do resto do sistema. Envolver
    um `<label>` funcionaria e traria outro problema: o clique na área de
    soltar seria o clique no label, e soltar um arquivo sobre um label não
    dispara nada.

    A referência limpa também o valor do input depois de cada escolha, e isso
    importa mais do que parece: sem limpar, escolher o MESMO arquivo duas
    vezes seguidas não dispara `onChange`, porque o valor não mudou. Ela
    tentaria reenviar o arquivo corrigido e nada aconteceria.
  */
  const entrada = useRef<HTMLInputElement>(null);

  async function receber(arquivo: File | undefined | null): Promise<void> {
    if (!arquivo) return;

    definirRecusa(null);
    definirConferindo(true);
    try {
      const problema = await conferirArquivo(arquivo);
      if (problema) {
        definirRecusa(problema);
        return;
      }
      aoEscolher({
        arquivo,
        nome: arquivo.name,
        tamanho: tamanhoLegivel(arquivo.size),
      });
    } finally {
      definirConferindo(false);
      // O input volta a ficar vazio para a próxima escolha disparar `onChange`.
      if (entrada.current) entrada.current.value = "";
    }
  }

  if (escolhido) {
    return (
      <CartaoDoArquivo
        escolhido={escolhido}
        aoTrocar={() => {
          aoLimpar();
          definirRecusa(null);
          entrada.current?.click();
        }}
      >
        <input
          ref={entrada}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => void receber(e.target.files?.[0])}
        />
      </CartaoDoArquivo>
    );
  }

  return (
    <div>
      {/*
        A ÁREA DE SOLTAR E O BOTÃO LEVAM AO MESMO INPUT.

        Os dois caminhos existem porque os dois são usados: quem está no
        computador com o arquivo aberto numa pasta arrasta; quem está com a
        pasta de downloads aberta clica. Oferecer só um deles é escolher por
        ela.
      */}
      <div
        onDragOver={(e) => {
          // Sem o `preventDefault` o navegador abre o PDF numa aba nova — e
          // ela perde o estado da tela sem entender o que aconteceu.
          e.preventDefault();
          definirArrastando(true);
        }}
        onDragLeave={() => definirArrastando(false)}
        onDrop={(e) => {
          e.preventDefault();
          definirArrastando(false);
          void receber(e.dataTransfer.files?.[0]);
        }}
        className={cn(
          "rounded-[var(--raio)] border border-dashed px-5 py-7 text-center transition-colors",
          arrastando
            ? "border-[var(--color-medio)] bg-[rgba(29,82,54,0.06)]"
            : "border-[var(--linha-forte)] bg-[rgba(242,236,226,0.5)]"
        )}
      >
        <p className="text-[0.9375rem] text-[var(--tinta)]">
          Arraste o PDF da ficha aqui, ou escolha o arquivo.
        </p>
        <p className="mx-auto mt-1.5 max-w-[56ch] text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          Um arquivo por vez, até {tamanhoLegivel(TAMANHO_MAXIMO)}. Só PDF — o que a leitura faz com ele
          está explicado abaixo.
        </p>
        <div className="mt-4 flex justify-center">
          <Botao
            variante="secundario"
            tamanho="sm"
            onClick={() => entrada.current?.click()}
            disabled={conferindo}
          >
            {conferindo ? "Conferindo o arquivo…" : "Escolher PDF"}
          </Botao>
        </div>
        <input
          ref={entrada}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={(e) => void receber(e.target.files?.[0])}
        />
      </div>

      {recusa ? (
        <div className="mt-3 rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-red-800 bg-[rgba(153,27,27,0.06)] px-4 py-3.5">
          <p className="font-semibold text-[0.875rem]">{recusa.titulo}</p>
          <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">{recusa.motivo}</p>
          <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            <span className="font-medium text-[var(--tinta)]">O que fazer: </span>
            {recusa.acao}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/**
 * O ARQUIVO ESCOLHIDO, EM UMA FAIXA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO É UM CARTÃO GRANDE                                       │
 * │                                                                      │
 * │ É a mesma razão do cabeçalho desta tela: o arquivo é o COMEÇO do      │
 * │ trabalho, não o resultado dele. Uma faixa de uma linha diz o que       │
 * │ precisa — qual arquivo, de que tamanho, com a opção de trocar — e não  │
 * │ empurra para baixo o que vem depois, que é a planilha.                │
 * │                                                                      │
 * │ O nome é exibido como TEXTO, e nunca interpretado. É conteúdo vindo de │
 * │ fora do sistema, e a única coisa que se faz com ele na tela é         │
 * │ mostrá-lo — ver a nota de segurança em `./seguranca.ts`.              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function CartaoDoArquivo({
  escolhido,
  aoTrocar,
  children,
}: {
  escolhido: ArquivoEscolhido;
  aoTrocar: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3">
      <span
        aria-hidden
        className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--raio-sm)] bg-[rgba(107,122,70,0.14)] text-[0.5625rem] font-semibold tracking-[0.06em] text-[var(--color-medio)]"
      >
        PDF
      </span>
      <div className="min-w-0 flex-1">
        {/* `title` porque nome de arquivo longo é cortado, e ela precisa poder ler inteiro. */}
        <p className="truncate text-[0.875rem] text-[var(--tinta)]" title={escolhido.nome}>
          {escolhido.nome}
        </p>
        <p className="text-[0.75rem] text-[var(--tinta-fraca)]">{escolhido.tamanho}</p>
      </div>
      <Botao variante="linha" tamanho="sm" onClick={aoTrocar}>
        Trocar arquivo
      </Botao>
      {children}
    </div>
  );
}
