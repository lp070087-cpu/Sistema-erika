"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { textoDaCelula } from "@/lib/planilhas/grade";
import type { CelulaGrade, FolhaGrade, GradeDaPlanilha, LinhaGrade } from "@/lib/planilhas/grade";

/**
 * A PLANILHA DESENHADA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE MUDOU, E POR QUE ISSO ERA O PEDIDO CENTRAL                     │
 * │                                                                      │
 * │ A versão anterior desta tela já mostrava tabela — e continuava        │
 * │ parecendo um RELATÓRIO. O motivo não era a tabela: era a página em     │
 * │ volta dela. Faixa de aviso explicando o que se estava vendo, título    │
 * │ de seção para cada aba, uma tabela por aba empilhada verticalmente,    │
 * │ cada uma com o seu próprio cabeçalho e a sua própria altura fixa.      │
 * │                                                                      │
 * │ Quem trabalha em planilha não lê assim. Lê assim: seletores em cima,   │
 * │ uma barra de ações, ABAS DE FOLHA, e UMA GRADE que troca de conteúdo   │
 * │ quando se clica numa aba. O resto da tela não se mexe.                 │
 * │                                                                      │
 * │ É isso que este arquivo implementa. Ele recebe a `GradeDaPlanilha` —   │
 * │ a MESMA que o ExcelJS grava — e a desenha como planilha.              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ELE NÃO CALCULA, NÃO FORMATA E NÃO DECIDE COLUNA                     │
 * │                                                                      │
 * │ `textoDaCelula` vem de `@/lib/planilhas/grade`, que é a única         │
 * │ tradução de valor para texto do módulo. Se ele formatasse aqui, o      │
 * │ arquivo diria "R$ 1.234,50" e a tela diria "1234.5" — e as duas        │
 * │ estariam "certas".                                                     │
 * │                                                                      │
 * │ Pelas mesmas razão, a ordenação das linhas, o rótulo do total e a      │
 * │ frase da assinatura vêm prontos do modelo. Esta peça POSICIONA.        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ROLAGEM: DENTRO DA GRADE, NUNCA NA PÁGINA                          │
 * │                                                                      │
 * │ O contêiner que rola é o da grade. Os dois eixos rolam ali dentro:     │
 * │ de lado quando a soma das colunas passa da largura, e de cima para     │
 * │ baixo quando as linhas passam da altura. A página em volta fica        │
 * │ parada, e a barra lateral do sistema — que é `fixed` — não se move     │
 * │ com ela em nenhum dos casos.                                          │
 * │                                                                      │
 * │ NO CELULAR A GRADE CONTINUA GRADE. Não há conversão para cartão: o     │
 * │ componente não importa `ListaResponsiva` e não tem caminho de render  │
 * │ alternativo. O que existe é rolagem horizontal dentro dela, com a      │
 * │ primeira coluna presa — que é como uma planilha se lê no telefone.     │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** A folha que está aberta quando nada foi clicado ainda. */
const ABA_PADRAO = 0;

export function PreviaDaPlanilha({
  grade,
  nomeCliente,
  altura,
  acoes,
  className,
}: {
  grade: GradeDaPlanilha;
  /**
   * O cliente por extenso, para a barra de ações.
   *
   * Vem de fora em vez de sair do `subtitulo` porque o subtítulo é uma frase
   * corrida — "Empório Verde · Padronização · gerado em 19/09/2026" — e cortá-la
   * para achar o nome daríamos uma heurística que quebra no dia em que o nome
   * tiver um "·" dentro.
   */
  nomeCliente: string;
  /** Altura da área da grade, em pixels. */
  altura?: number;
  /** Botões extras na barra de ações — "Baixar XLSX", "Editar ficha". */
  acoes?: React.ReactNode;
  className?: string;
}) {
  const [aberta, definirAberta] = useState(ABA_PADRAO);

  /*
    O ÍNDICE É PRESO À FAIXA VÁLIDA.

    Quando o cliente troca, a grade nova pode ter menos abas que a anterior —
    e o índice guardado apontaria para fora. O `?? folhas[0]` devolve a
    primeira folha nesse caso, em vez de a tela quebrar: seria o defeito mais
    chato possível, porque só apareceria ao trocar de um modelo de 4 abas
    para um de 3.
  */
  const folhas = grade.folhas;
  const indice = aberta < folhas.length ? aberta : ABA_PADRAO;
  const folha = folhas[indice] ?? folhas[0];
  if (!folha) return null;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--raio)] border border-[var(--linha-forte)] bg-[var(--superficie-solida)]",
        className
      )}
    >
      <BarraDeAcoes
        folha={folha}
        indice={indice}
        nomeCliente={nomeCliente}
        totalFolhas={folhas.length}
        acoes={acoes}
      />

      {/*
        AS ABAS FICAM ENTRE A BARRA E A GRADE, e não embaixo.

        É o oposto do Excel, e é de propósito: aqui a grade tem altura fixa e
        rola por dentro, então uma faixa de abas no rodapé ficaria colada na
        borda inferior de um contêiner que já rola — fora do caminho do olho.
        Em cima, ela fica no mesmo bloco visual dos seletores e da barra, que
        é o bloco de comando da tela.
      */}
      <FaixaDeAbas folhas={folhas} aberta={indice} aoAbrir={definirAberta} />

      <Grade folha={folha} indice={indice} altura={altura} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// A barra de ações
// ---------------------------------------------------------------------------

/**
 * A BARRA COMPACTA ACIMA DA GRADE.
 *
 * Ela responde três perguntas em uma linha — de quem é esta planilha, que
 * horas ela saiu, e o que dá para fazer com ela — e não ocupa mais que isso.
 * A altura é fixa de propósito: numa tela que vai ser usada todo dia, o
 * cabeçalho é a parte que se deixa de ler, e ele não pode empurrar a grade
 * para baixo.
 */
function BarraDeAcoes({
  folha,
  indice,
  nomeCliente,
  totalFolhas,
  acoes,
}: {
  folha: FolhaGrade;
  indice: number;
  nomeCliente: string;
  totalFolhas: number;
  /** Botões à direita — o [GERAR XLSX], o [EDITAR FICHA], o que a tela mandar. */
  acoes?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-[var(--linha-forte)] bg-[var(--superficie-areia)] px-3 py-2">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-[0.9375rem] leading-tight text-tinta">
          {nomeCliente}
        </span>

        {/*
          O NOME DA ABA APARECE AQUI TAMBÉM, e não só na aba acesa.

          Na faixa de abas ele é um clique; aqui ele é um RÓTULO. Serve para
          quando a faixa rolou de lado e a aba aberta saiu de vista — a barra
          continua dizendo em que folha se está.
        */}
        <span className="tabular text-[0.75rem] text-[var(--tinta-fraca)]">
          {folha.nome} · folha {indice + 1} de {totalFolhas}
        </span>
      </div>

      {acoes ? <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">{acoes}</div> : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// As abas
// ---------------------------------------------------------------------------

/**
 * A FAIXA DE ABAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO PARECE UMA ABA DE PLANILHA, E NÃO UM BOTÃO              │
 * │                                                                      │
 * │ Botão tem cantos arredondados, respiro e cor de destaque. Aba de       │
 * │ planilha encosta na grade, tem o canto de cima arredondado, o fundo    │
 * │ igual ao da folha aberta e uma borda que a liga ao conteúdo. É essa    │
 * │ continuidade que faz o olho entender que o conteúdo ABAIXO pertence    │
 * │ àquela aba — e não que é mais uma seção da página.                     │
 * │                                                                      │
 * │ A aba fechada fica com fundo mais escuro que a aberta. Parece         │
 * │ detalhe; é o que a faz recuar em vez de competir com o conteúdo.       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O papel é `tablist`/`tab`/`tabpanel` de verdade: seta esquerda e direita
 * trocam de aba no teclado, e o `aria-selected` diz ao leitor de tela qual
 * está aberta. A grade abaixo é o `tabpanel`.
 */
function FaixaDeAbas({
  folhas,
  aberta,
  aoAbrir,
}: {
  folhas: readonly FolhaGrade[];
  aberta: number;
  aoAbrir: (indice: number) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Folhas da planilha"
      className="flex gap-px overflow-x-auto border-b border-[var(--linha-forte)] bg-[var(--superficie-areia)] px-2 pt-1.5"
      onKeyDown={(e) => {
        /*
          A NAVEGAÇÃO POR TECLADO, ESCRITA À MÃO.

          `role="tablist"` promete que as setas andam entre as abas — e o
          navegador não faz isso sozinho. Sem estas quatro linhas, o papel
          estaria anunciando um comportamento que não existe.
        */
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        const passo = e.key === "ArrowRight" ? 1 : -1;
        aoAbrir((aberta + passo + folhas.length) % folhas.length);
      }}
    >
      {folhas.map((f, i) => {
        const ativa = i === aberta;
        return (
          <button
            key={f.nome}
            type="button"
            role="tab"
            id={`aba-${i}`}
            aria-selected={ativa}
            aria-controls="planilha-grade"
            tabIndex={ativa ? 0 : -1}
            onClick={() => aoAbrir(i)}
            className={cn(
              "shrink-0 rounded-t-[4px] border border-b-0 px-3 py-1.5",
              "text-[0.75rem] font-medium tracking-[0.02em] whitespace-nowrap",
              "transition-colors",
              ativa
                ? "border-[var(--linha-forte)] bg-[var(--superficie-solida)] text-tinta"
                : "border-transparent bg-transparent text-[var(--tinta-fraca)] hover:bg-[rgba(107,122,70,0.07)] hover:text-[var(--tinta-suave)]"
            )}
          >
            {f.nome}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// A grade
// ---------------------------------------------------------------------------

/**
 * A GRADE DE UMA FOLHA.
 *
 * Tudo que ela desenha vem de `LinhaGrade` — os sete tipos que o modelo já
 * sabe produzir. Ela não conhece "tarefa", "ingrediente" nem "custo": se um
 * quarto modelo chegar com um bloco novo, esta peça o desenha sem alteração.
 */
function Grade({
  folha,
  indice,
  altura,
}: {
  folha: FolhaGrade;
  indice: number;
  altura?: number;
}) {
  const totalColunas = Math.max(1, folha.colunas.length);
  const primeiraColunaFixa = totalColunas > 3;

  return (
    <div
      id="planilha-grade"
      role="tabpanel"
      aria-labelledby={`aba-${indice}`}
      /*
        O `overscroll-x-contain` impede que, ao chegar na ponta da grade, a
        rolagem lateral "transborde" para a página. Sem ele, empurrar a grade
        até o fim faz o layout de trás andar de lado — que é exatamente o que
        o briefing pede para nunca acontecer.
      */
      className="w-full overflow-auto overscroll-x-contain"
      style={altura ? { maxHeight: `${altura}px` } : { maxHeight: "62vh" }}
      tabIndex={0}
    >
      <table
        className="w-full border-collapse text-[0.75rem] leading-tight"
        /*
          A largura mínima é a soma das larguras declaradas por coluna. É o
          que faz a grade passar da largura da tela e rolar de lado em vez de
          espremer as colunas — numa planilha, espremer destrói a comparação
          entre linhas, que é a razão de ela existir.
        */
        style={{ minWidth: `${somaDasLarguras(folha)}px` }}
      >
        <caption className="sr-only">{folha.titulo}</caption>

        {folha.mostrarCabecalho ? (
          <thead>
            <tr>
              {folha.colunas.map((c, i) => (
                <th
                  key={c.chave}
                  scope="col"
                  style={{ minWidth: `${larguraDaColuna(c)}px` }}
                  className={cn(
                    "sticky top-0 z-10 border-b border-r border-[var(--linha-forte)]",
                    "bg-[var(--superficie-areia)] px-2 py-[5px]",
                    "text-[0.625rem] font-semibold tracking-[0.1em] whitespace-nowrap uppercase",
                    "text-[var(--tinta-suave)]",
                    alinhamento(c.formato) === "dir" && "text-right",
                    alinhamento(c.formato) === "centro" && "text-center",
                    alinhamento(c.formato) === "esq" && "text-left",
                    primeiraColunaFixa && i === 0 && "left-0 z-20"
                  )}
                >
                  {c.titulo}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}

        <tbody>
          {folha.linhas.map((item, i) => (
            <Linha
              key={`${item.tipo}-${i}`}
              item={item}
              folha={folha}
              indice={i}
              primeiraColunaFixa={primeiraColunaFixa}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * UMA LINHA DA FOLHA — os sete tipos, cada um com o seu peso visual.
 *
 * A escolha do peso é a única decisão de desenho deste arquivo, e ela é sobre
 * HIERARQUIA, não sobre cor: `secao` é uma faixa que separa; `campo` é um par
 * rótulo/valor; `total` é o que fecha a conta. Nada aqui é enfeite.
 */
function Linha({
  item,
  folha,
  indice,
  primeiraColunaFixa,
}: {
  item: LinhaGrade;
  folha: FolhaGrade;
  indice: number;
  primeiraColunaFixa: boolean;
}) {
  const colunas = folha.colunas;

  /*
    A FAIXA DE BLOCO atravessa a grade inteira.

    O `colSpan` é o que faz a faixa sobreviver à rolagem horizontal: se ela
    fosse só a primeira célula pintada, rolar até a direita mostraria a faixa
    cortada no meio da tela.
  */
  if (item.tipo === "secao") {
    const sozinha = colunas.length <= 1;
    return (
      <tr>
        <th
          scope="colgroup"
          colSpan={Math.max(1, colunas.length)}
          className={cn(
            "border-y border-[var(--linha)] bg-[rgba(107,122,70,0.1)] px-2 py-[5px] text-left",
            "text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-[var(--tinta)]",
            sozinha && "border-y-0 bg-[var(--superficie-areia)] px-3 pt-3 pb-1"
          )}
        >
          {item.texto}
        </th>
      </tr>
    );
  }

  if (item.tipo === "texto") {
    const pendente = item.tom === "pendencia";
    return (
      <tr>
        <td
          colSpan={Math.max(1, colunas.length)}
          className={cn(
            "border-b border-[var(--linha)] px-2 py-[5px] align-top text-[0.75rem] leading-snug whitespace-normal",
            pendente
              ? "bg-[rgba(201,165,78,0.08)] font-medium text-[#6d5a1e]"
              : "text-[var(--tinta-suave)]"
          )}
        >
          {item.texto}
        </td>
      </tr>
    );
  }

  if (item.tipo === "campo") {
    /*
      O PAR RÓTULO/VALOR ocupa duas colunas, e as restantes ficam vazias de
      propósito. É assim que uma planilha de trabalho guarda um bloco de
      cabeçalho: rótulo na coluna A, valor na B, e o resto da linha em branco
      — não centralizado, não mesclado.
    */
    const vazio = <td key="vazio" className="border-b border-[var(--linha)]" />;
    return (
      <tr>
        <th
          scope="row"
          className={cn(
            "border-b border-r border-[var(--linha)] px-2 py-[5px] text-left",
            "text-[0.75rem] font-medium whitespace-nowrap text-[var(--tinta-suave)]",
            primeiraColunaFixa && "sticky left-0 z-[1] bg-[var(--superficie-solida)]"
          )}
        >
          {item.rotulo}
        </th>
        <td
          className={cn(
            "border-b border-r border-[var(--linha)] px-2 py-[5px] text-[0.75rem] whitespace-nowrap text-tinta",
            ehNumerico(item.formato) && "tabular text-right"
          )}
        >
          {textoDaCelula(item.valor, item.formato ?? "texto")}
        </td>
        {Array.from({ length: Math.max(0, colunas.length - 2) }, (_, k) => (
          <td key={k} className="border-b border-[var(--linha)]" />
        ))}
        {colunas.length === 1 ? vazio : null}
      </tr>
    );
  }

  if (item.tipo === "cabecalho") {
    return (
      <tr>
        {colunas.map((c, i) => (
          <th
            key={c.chave}
            scope="col"
            style={{ minWidth: `${larguraDaColuna(c)}px` }}
            className={cn(
              "border-b border-r border-[var(--linha-forte)] bg-[var(--superficie-areia)] px-2 py-[5px]",
              "text-[0.625rem] font-semibold tracking-[0.1em] whitespace-nowrap uppercase",
              "text-[var(--tinta-suave)]",
              alinhamento(c.formato) === "dir" && "text-right",
              alinhamento(c.formato) === "centro" && "text-center",
              alinhamento(c.formato) === "esq" && "text-left",
              primeiraColunaFixa && i === 0 && "sticky left-0 z-20"
            )}
          >
            {c.titulo}
          </th>
        ))}
      </tr>
    );
  }

  // `dados`, `subtotal` e `total` — a linha de célula.
  const total = item.tipo === "total";
  const subtotal = item.tipo === "subtotal";
  const rotulo = "rotulo" in item ? item.rotulo : undefined;

  const fundo = total
    ? "bg-[rgba(107,122,70,0.22)] font-semibold"
    : subtotal
      ? "bg-[rgba(107,122,70,0.07)] font-medium"
      : indice % 2 === 1
        ? "bg-[rgba(242,236,226,0.45)]"
        : "bg-[var(--superficie-solida)]";

  return (
    <tr
      className={cn(
        "border-b border-[var(--linha)]",
        fundo,
        subtotal && "border-t border-t-[var(--linha-forte)]",
        total && "border-t-2 border-t-[var(--linha-forte)] text-tinta"
      )}
    >
      {colunas.map((c, j) => {
        /*
          A PRIMEIRA CÉLULA DE UM FECHAMENTO CARREGA O RÓTULO.

          Sem isto, a linha "TOTAL" seria uma fila de números sem dizer o que
          eles somam — e o rótulo é a metade útil da linha. Mesma regra que o
          escritor do Excel aplica, para a tela e o arquivo fecharem igual.
        */
        const celula =
          j === 0 && (total || subtotal) && rotulo ? rotulo : item.celulas[c.chave];

        return (
          <td
            key={c.chave}
            style={{ minWidth: `${larguraDaColuna(c)}px` }}
            className={cn(
              "border-r border-[var(--linha)] px-2 py-[4px] align-middle whitespace-nowrap",
              j === 0 && "font-medium text-tinta",
              alinhamento(c.formato) === "dir" && j !== 0 && "tabular text-right text-tinta",
              alinhamento(c.formato) === "centro" && "text-center",
              alinhamento(c.formato) === "esq" && j !== 0 && "text-[var(--tinta-suave)]",
              primeiraColunaFixa && j === 0 && cn("sticky left-0 z-[1]", fundo)
            )}
          >
            {textoDaCelula(ausente(celula), c.formato)}
          </td>
        );
      })}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Auxiliares
// ---------------------------------------------------------------------------

/**
 * A LARGURA DE UMA COLUNA NA TELA.
 *
 * `larguraMinima` é declarada pelo modelo e já vem em pixels (`pixels(l)`).
 * Quando ela não existe, a coluna herda a largura do Excel convertida — que
 * é uma aproximação grosseira declarada em `grade.ts`, e serve como ponto de
 * partida: o navegador cresce a coluna com o conteúdo.
 */
function larguraDaColuna(coluna: FolhaGrade["colunas"][number]): number {
  return coluna.larguraMinima ?? Math.round(coluna.largura * 7 + 16);
}

/** A largura da grade inteira, para a tabela poder rolar de lado. */
function somaDasLarguras(folha: FolhaGrade): number {
  return folha.colunas.reduce((acc, c) => acc + larguraDaColuna(c), 0);
}

/** O alinhamento de uma coluna, pela mesma tabela que o arquivo usa. */
function alinhamento(formato: FolhaGrade["colunas"][number]["formato"]) {
  return ALINHAMENTO[formato];
}

const ALINHAMENTO: Record<FolhaGrade["colunas"][number]["formato"], "esq" | "dir" | "centro"> = {
  texto: "esq",
  numero: "dir",
  moeda: "dir",
  percentual: "dir",
  peso: "dir",
  data: "centro",
};

function ehNumerico(formato: FolhaGrade["colunas"][number]["formato"] | undefined): boolean {
  return formato === "numero" || formato === "moeda" || formato === "peso" || formato === "percentual";
}

/**
 * O TRATO DA AUSÊNCIA.
 *
 * `textoDaCelula` recebe `CelulaGrade`, e `undefined` não é um deles — o
 * formato dos dados usa `null`. Uma célula que o modelo não preencheu chega
 * aqui como `undefined`, e converter para `null` antes é o que faz o traço
 * aparecer em vez de a célula ficar vazia.
 *
 * A diferença importa numa planilha de custo: "—" é "não sei", e vazio é
 * "esqueci de preencher". A primeira é uma resposta; a segunda é um defeito.
 */
function ausente(valor: CelulaGrade | undefined): CelulaGrade {
  return valor === undefined ? null : valor;
}
