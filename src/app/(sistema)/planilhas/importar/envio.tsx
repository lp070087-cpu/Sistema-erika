"use client";

import { useRef, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { cn } from "@/lib/utils/cn";
import { TAMANHO_MAXIMO, conferirArquivo, tamanhoLegivel, textoVazio, type Recusa } from "@/lib/planilhas/importacao/seguranca";
import type { Origem } from "@/lib/planilhas/importacao/origens";

/**
 * A ETAPA 1 — ENTRAR O ARQUIVO, ou colar a lista, conforme a porta.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE COMPONENTE NÃO SABE O QUE É PDF, EXCEL, TEXTO NEM FOTO          │
 * │                                                                      │
 * │ Ele recebe uma `Origem` e pergunta a ela o que precisa: a instrução da │
 * │ área de soltar, as extensões do `accept`, os tipos do seletor de       │
 * │ arquivo, o selo do cartão, se aceita colar.                             │
 * │                                                                      │
 * │ Era um componente de PDF: `accept="application/pdf,.pdf"` e o selo    │
 * │ "PDF" estavam escritos no corpo, duas vezes cada. Com quatro portas,   │
 * │ a tentação seria um `if` por formato aqui dentro — e o quarto          │
 * │ formato seria o que alguém esqueceria de atualizar, aparecendo como    │
 * │ um campo que deixa escolher `.png` e recusa dizendo "só PDF".          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ETAPA 1 MOSTRA O QUE SABE, E SÓ O QUE SABE                          │
 * │                                                                      │
 * │ Nome e tamanho são FATO: propriedades do `File` que o navegador        │
 * │ entrega, e não dependem de ninguém ter lido o documento. É por isso    │
 * │ que eles podem aparecer aqui — antes de qualquer leitura, e sem que    │
 * │ a tela precise prometer nada.                                         │
 * │                                                                      │
 * │ Contagem de linhas, título do documento, lista de ingredientes: tudo   │
 * │ isso exigiria ter aberto o arquivo, e abrir o arquivo é a etapa 2.     │
 * │ Mostrar qualquer um desses aqui seria inventar.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A RECUSA APARECE NA HORA, E NÃO NO FIM DO FLUXO              │
 * │                                                                      │
 * │ `conferirArquivo` roda assim que o arquivo é escolhido. Ela poderia    │
 * │ rodar só quando ela clicasse em "continuar" — e aí ela teria          │
 * │ atravessado a tela inteira para descobrir que o arquivo não serve.     │
 * │                                                                      │
 * │ A recusa é uma função assíncrona porque uma das checagens lê os        │
 * │ primeiros bytes do arquivo. Ela continua sendo rápida — a amostra vai  │
 * │ de cinco a quinhentos bytes — e mesmo assim o botão fica desabilitado  │
 * │ enquanto roda, porque um clique durante a conferência passaria um      │
 * │ arquivo ainda não conferido para a etapa seguinte.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** O que a tela sabe sobre o arquivo escolhido. */
export type ArquivoEscolhido = {
  arquivo: File;
  nome: string;
  tamanho: string;
};

/**
 * O QUE A ETAPA 1 ENTREGA PARA A ETAPA 2.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE DOIS CASOS, E POR QUE O DE TEXTO NÃO É UM ARQUIVO FALSO      │
 * │                                                                      │
 * │ A porta de texto aceita duas entradas: um arquivo `.txt` e um texto    │
 * │ colado. As duas terminam no mesmo lugar — a etapa 2 recebe TEXTO —, e  │
 * │ por isso o caso "colado" carrega a string e nada mais.                 │
 * │                                                                      │
 * │ Fabricar um `File` com o texto colado dentro funcionaria e seria pior: │
 * │ ele teria um nome inventado, um tamanho inventado e um tipo vazio —    │
 * │ e a etapa 1 mostraria um cartão de arquivo para algo que não é arquivo. │
 * │ A distinção existe no dado porque existe na realidade.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type EntradaDaImportacao =
  | { readonly tipo: "arquivo"; readonly arquivo: ArquivoEscolhido }
  | { readonly tipo: "colado"; readonly texto: string };

export function EnvioDeArquivo({
  origem,
  aoEscolher,
  escolhido,
  aoLimpar,
}: {
  origem: Origem;
  aoEscolher: (entrada: EntradaDaImportacao) => void;
  escolhido: EntradaDaImportacao | null;
  aoLimpar: () => void;
}) {
  const [recusa, definirRecusa] = useState<Recusa | null>(null);
  const [conferindo, definirConferindo] = useState(false);
  const [arrastando, definirArrastando] = useState(false);
  const [colado, definirColado] = useState("");

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

  const aceita = `${origem.tipos.join(",")},${origem.extensoes.join(",")}`;

  async function receber(arquivo: File | undefined | null): Promise<void> {
    if (!arquivo) return;

    definirRecusa(null);
    definirConferindo(true);
    try {
      const problema = await conferirArquivo(arquivo, origem);
      if (problema) {
        definirRecusa(problema);
        return;
      }
      aoEscolher({
        tipo: "arquivo",
        arquivo: { arquivo, nome: arquivo.name, tamanho: tamanhoLegivel(arquivo.size) },
      });
    } finally {
      definirConferindo(false);
      // O input volta a ficar vazio para a próxima escolha disparar `onChange`.
      if (entrada.current) entrada.current.value = "";
    }
  }

  function enviarColado(): void {
    definirRecusa(null);
    if (colado.trim() === "") {
      definirRecusa(textoVazio(origem));
      return;
    }
    aoEscolher({ tipo: "colado", texto: colado });
  }

  if (escolhido) {
    return (
      <CartaoDaEntrada
        entrada={escolhido}
        origem={origem}
        aoTrocar={() => {
          aoLimpar();
          definirRecusa(null);
          /*
            O TEXTO COLADO É PRESERVADO AO TROCAR.

            Se ela colou a lista e clicou em "trocar", o texto volta para o
            campo em vez de sumir. Perder uma lista de oitenta linhas por um
            clique de curiosidade seria o tipo de perda que ela não perdoa —
            e ela não tem de onde recuperar, porque o que foi colado não está
            em arquivo nenhum.
          */
          if (escolhido.tipo === "colado") {
            definirColado(escolhido.texto);
            return;
          }
          entrada.current?.click();
        }}
      >
        <input
          ref={entrada}
          type="file"
          accept={aceita}
          className="sr-only"
          onChange={(e) => void receber(e.target.files?.[0])}
        />
      </CartaoDaEntrada>
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
          // Sem o `preventDefault` o navegador abre o arquivo numa aba nova —
          // e ela perde o estado da tela sem entender o que aconteceu.
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
        <p className="text-[0.9375rem] text-[var(--tinta)]">{origem.instrucao}</p>
        <p className="mx-auto mt-1.5 max-w-[56ch] text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          Um arquivo por vez, até {tamanhoLegivel(TAMANHO_MAXIMO)}.
          {/*
            A frase sobre o que a leitura faz com o arquivo muda por porta, e
            não é detalhe de redação: ela é a única indicação, antes do envio,
            de que a leitura do PDF e da foto ainda não acontece. Dizer "está
            explicado abaixo" quando não está faria ela procurar a explicação.
          */}
          {" "}
          {origem.leitor.disponivel()
            ? `O arquivo é lido aqui e o resultado vai para a conferência — nada é gravado sem você confirmar.`
            : `A leitura de ${origem.curto} ainda não está ligada nesta instalação — o motivo está explicado abaixo.`}
        </p>
        <div className="mt-4 flex justify-center">
          <Botao
            variante="secundario"
            tamanho="sm"
            onClick={() => entrada.current?.click()}
            disabled={conferindo}
          >
            {conferindo ? "Conferindo o arquivo…" : `Escolher ${origem.sigla}`}
          </Botao>
        </div>
        <input
          ref={entrada}
          type="file"
          accept={aceita}
          className="sr-only"
          onChange={(e) => void receber(e.target.files?.[0])}
        />
      </div>

      {/*
        O CAMINHO DE COLAR — só na porta de texto.

        "Esta porta também aceita colar, sem arquivo nenhum?" é o campo
        `colavel` da origem, e ele é `true` só aqui. Não é simetria faltando:
        uma ficha em PDF não existe em forma de texto colado, e uma foto não
        se cola. O que se cola é uma lista de ingredientes, e é exatamente o
        que a porta de texto recebe.
      */}
      {origem.colavel ? (
        <div className="mt-4 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5">
          <label
            htmlFor="lista-colada"
            className="rotulo block text-[0.6875rem] text-[var(--tinta-fraca)]"
          >
            Ou cole a lista aqui
          </label>
          <textarea
            id="lista-colada"
            value={colado}
            onChange={(e) => definirColado(e.target.value)}
            rows={7}
            spellCheck={false}
            placeholder={"Batata inglesa 5 kg 50,00\nCebola 2 kg 18,90\nAlho 500 g 12,50"}
            className={cn(
              "mt-2 w-full resize-y rounded-[var(--raio-sm)] border border-[var(--linha-forte)]",
              "bg-[var(--superficie-solida)] px-3 py-2.5",
              "font-mono text-[0.8125rem] leading-relaxed text-[var(--tinta)]",
              "outline-none transition-colors focus:border-[var(--color-medio)]"
            )}
          />
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="max-w-[52ch] text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
              Uma linha por ingrediente. O que o sistema não conseguir identificar fica marcado para
              você revisar — nada é adivinhado.
            </p>
            <Botao variante="secundario" tamanho="sm" onClick={enviarColado} disabled={colado.trim() === ""}>
              Usar esta lista
            </Botao>
          </div>
        </div>
      ) : null}

      {recusa ? <AvisoDeRecusa recusa={recusa} /> : null}
    </div>
  );
}

/**
 * A RECUSA, EM UM LUGAR SÓ.
 *
 * Antes ela era escrita no corpo do componente, e o caminho de colar trouxe a
 * segunda chance de mostrar uma. Duas cópias do mesmo bloco divergiriam no dia
 * em que a cor da borda mudasse — e a que ficasse para trás apareceria como um
 * aviso com aparência diferente conforme o jeito de errar.
 */
function AvisoDeRecusa({ recusa }: { recusa: Recusa }) {
  return (
    <div
      role="alert"
      className="mt-3 rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-red-800 bg-[rgba(153,27,27,0.06)] px-4 py-3.5"
    >
      <p className="font-semibold text-[0.875rem]">{recusa.titulo}</p>
      <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">{recusa.motivo}</p>
      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
        <span className="font-medium text-[var(--tinta)]">O que fazer: </span>
        {recusa.acao}
      </p>
    </div>
  );
}

/**
 * A ENTRADA ESCOLHIDA, EM UMA FAIXA.
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
 * │ fora do sistema, e a única coisa que se faz com ele na tela é          │
 * │ mostrá-lo — ver a nota de segurança em `seguranca.ts`.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function CartaoDaEntrada({
  entrada,
  origem,
  aoTrocar,
  children,
}: {
  entrada: EntradaDaImportacao;
  origem: Origem;
  aoTrocar: () => void;
  children: React.ReactNode;
}) {
  const colado = entrada.tipo === "colado";
  const linhas = colado ? entrada.texto.split(/\r\n|\r|\n/).length : 0;

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3">
      <span
        aria-hidden
        className="grid h-7 w-7 shrink-0 place-items-center rounded-[var(--raio-sm)] bg-[rgba(107,122,70,0.14)] text-[0.5rem] font-semibold tracking-[0.06em] text-[var(--color-medio)]"
      >
        {origem.sigla}
      </span>
      <div className="min-w-0 flex-1">
        {colado ? (
          <>
            <p className="text-[0.875rem] text-[var(--tinta)]">Lista colada</p>
            <p className="text-[0.75rem] text-[var(--tinta-fraca)]">
              {linhas} {linhas === 1 ? "linha" : "linhas"} de texto
            </p>
          </>
        ) : (
          <>
            {/* `title` porque nome de arquivo longo é cortado, e ela precisa poder ler inteiro. */}
            <p className="truncate text-[0.875rem] text-[var(--tinta)]" title={entrada.arquivo.nome}>
              {entrada.arquivo.nome}
            </p>
            <p className="text-[0.75rem] text-[var(--tinta-fraca)]">{entrada.arquivo.tamanho}</p>
          </>
        )}
      </div>
      <Botao variante="linha" tamanho="sm" onClick={aoTrocar}>
        {colado ? "Trocar a lista" : "Trocar arquivo"}
      </Botao>
      {children}
    </div>
  );
}
