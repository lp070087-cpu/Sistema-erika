"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { endereco, letraDaColuna, textoDaCelula } from "@/lib/planilhas/grade";
import type {
  CelulaGrade,
  FolhaGrade,
  GradeDaPlanilha,
  LinhaGrade,
} from "@/lib/planilhas/grade";

/**
 * A PLANILHA DESENHADA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE MUDOU NESTA RODADA, E POR QUE                               │
 * │                                                                   │
 * │ A versão anterior já tinha aba, grade e rolagem própria. Ela          │
 * │ continuava parecendo uma TABELA BEM FEITA, e não uma PLANILHA — e o    │
 * │ que faltava era o cromo que faz a planilha ser planilha: a faixa de    │
 * │ LETRAS em cima, a coluna de NÚMEROS à esquerda, o quadrado de          │
 * │ SELEÇÃO, e a célula que aceita digitação.                             │
 * │                                                                      │
 * │ É uma diferença que parece cosmética e não é. Sem letra e sem número,  │
 * │ não se diz "some a linha 12" nem "a coluna G está errada" — e é assim  │
 * │ que duas pessoas conferem uma planilha por telefone.                   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ELE NÃO CALCULA, NÃO FORMATA E NÃO DECIDE COLUNA                      │
 * │                                                                      │
 * │ `textoDaCelula`, `letraDaColuna` e `endereco` vêm de                   │
 * │ `@/lib/planilhas/grade`, que é puro e é a única tradução de valor      │
 * │ para texto do módulo. Se ele formatasse aqui, o arquivo diria          │
 * │ "R$ 1.234,50" e a tela diria "1234.5" — e as duas estariam "certas".   │
 * │                                                                      │
 * │ Pelas mesmas razões, a ordenação das linhas, o rótulo do total e a     │
 * │ frase da assinatura vêm prontos do modelo. Esta peça POSICIONA e,      │
 * │ quando a folha é editável, COLETA DIGITAÇÃO.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A EDIÇÃO É DO PAI, E ISSO NÃO É DETALHE                              │
 * │                                                                      │
 * │ Este componente não guarda o que foi digitado. Ele recebe um mapa de   │
 * │ edições por endereço e avisa quando uma célula é confirmada.           │
 * │                                                                      │
 * │ Guardar aqui funcionaria e quebraria em dois gestos: trocar de aba     │
 * │ desmonta a folha (e o valor ia junto), e a grade é reconstruída        │
 * │ quando ela troca de modelo. Com o mapa no pai, o que ela digitou na    │
 * │ ficha sobrevive à ida até a aba Base e à volta.                       │
 * │                                                                      │
 * │ NÃO HÁ PERSISTÊNCIA, e a tela não finge que há: o mapa vive na         │
 * │ memória da aba do navegador, e recarregar a página o apaga.            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ROLAGEM: DENTRO DA GRADE, NUNCA NA PÁGINA                          │
 * │                                                                      │
 * │ O contêiner que rola é o da grade. Os dois eixos rolam ali dentro:     │
 * │ de lado quando a soma das colunas passa da largura, e de cima para     │
 * │ baixo quando as linhas passam da altura. A página em volta fica        │
 * │ parada, e a barra lateral do sistema — que é `fixed` — não se move     │
 * │ com ela em nenhum dos casos. `overscroll-x-contain` impede que, ao     │
 * │ chegar na ponta, a rolagem transborde para o layout de trás.           │
 * │                                                                      │
 * │ NO CELULAR A GRADE CONTINUA GRADE. Não há conversão para cartão: o     │
 * │ componente não importa `ListaResponsiva` e não tem caminho de render   │
 * │ alternativo. O que existe é rolagem horizontal dentro dela, com a      │
 * │ coluna de números presa à esquerda — que é como uma planilha se lê no  │
 * │ telefone.                                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** A folha que está aberta quando nada foi clicado ainda. */
const ABA_PADRAO = 0;

/**
 * A altura de cada faixa fixa do topo, em pixels. Precisa casar com o CSS.
 *
 * Só a faixa de letras tem altura declarada, e por um motivo: é ela que
 * posiciona a linha de títulos logo abaixo (`top: ALTURA_LETRAS`), porque as
 * duas ficam presas no topo e a segunda não pode rolar por cima da primeira.
 * O corpo da tabela não é preso, então não precisa de deslocamento nenhum.
 *
 * Aqui havia também uma `ALTURA_TITULOS`, que media a faixa de títulos para
 * empurrar o corpo. A grade passou a usar `sticky` de verdade e o número
 * perdeu o uso — ficou como constante que ninguém lia, que é pior que não
 * existir: um número ao lado de outro pede para ser mantido em dia, e este
 * não tinha mais o que manter.
 */
const ALTURA_LETRAS = 19;

/** A largura da coluna de números de linha, em pixels. */
const LARGURA_GUTTER = 46;

/** Quantas linhas a seta move a seleção, e onde ela para. */
type Posicao = { linha: number; coluna: number };

export function PreviaDaPlanilha({
  grade,
  nomeCliente,
  altura,
  acoes,
  className,
  edicoes,
  aoEditar,
  folhasExtras,
  aoCriarFolha,
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
  /**
   * O QUE FOI DIGITADO, por endereço.
   *
   * A chave é `"<aba>::<endereço>"` — `"Planilha::G4"`. A aba entra na chave
   * porque dois modelos diferentes podem ter uma folha com o mesmo nome, e o
   * valor de uma não pode aparecer na outra.
   *
   * Ausente significa folha SOMENTE-LEITURA: sem mapa, nenhuma célula abre
   * para digitação, por mais que o conteúdo pareça editável. É o que mantém
   * as folhas derivadas protegidas sem precisar de uma lista de exceções.
   */
  edicoes?: Readonly<Record<string, CelulaGrade>>;
  /** Chamado quando uma célula é confirmada com Enter ou Tab. */
  aoEditar?: (chave: string, valor: CelulaGrade) => void;
  /** Folhas criadas nesta sessão, depois das do modelo. */
  folhasExtras?: readonly FolhaGrade[];
  /** Habilita o `[+]` ao lado da última aba. Sem ele, o botão não aparece. */
  aoCriarFolha?: () => void;
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
  const folhas = [...grade.folhas, ...(folhasExtras ?? [])];
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

      <Grade
        folha={folha}
        indice={indice}
        altura={altura}
        edicoes={edicoes}
        aoEditar={aoEditar}
      />

      {/*
        AS ABAS FICAM DEPOIS DA GRADE — na base, como no Excel.

        A versão anterior as tinha em cima, e a razão registrada era boa: com
        altura fixa e rolagem por dentro, uma faixa no rodapé ficaria colada
        na borda de um contêiner que já rola. O que mudou foi o desenho da
        grade: agora ela tem a faixa de LETRAS de coluna no topo, e uma faixa
        de abas logo abaixo dela empilharia duas barras horizontais antes da
        primeira célula — o oposto de "a planilha é o centro da tela".

        Embaixo, a faixa fica exatamente onde o olho procura a aba de uma
        planilha, e o quadrado de seleção continua visível quando ela rola.
      */}
      <FaixaDeAbas
        folhas={folhas}
        aberta={indice}
        aoAbrir={definirAberta}
        aoCriar={aoCriarFolha}
      />
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

        {folha.editavel ? (
          <span
            className="rounded-[var(--raio-sm)] border border-[var(--linha-forte)] px-1.5 py-[1px] text-[0.625rem] tracking-[0.08em] uppercase text-[var(--tinta-fraca)]"
            /*
              A ETIQUETA QUE IMPEDE UMA PERDA DE TRABALHO.

              Sem ela, quem digita uma ficha inteira na grade só descobre que
              nada foi gravado ao recarregar a página. O texto é curto porque
              ele vai ficar à vista o tempo todo — e um aviso que ocupa espaço
              é um aviso que se aprende a ignorar.
            */
            title="O conteúdo desta folha vive na memória do navegador. Recarregar a página limpa a planilha."
          >
            Digitável · nesta sessão
          </span>
        ) : null}
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
 * │ planilha encosta na grade, tem o canto de BAIXO arredondado quando     │
 * │ fica na base, o fundo igual ao da folha aberta e uma borda que a       │
 * │ liga ao conteúdo. É essa continuidade que faz o olho entender que o    │
 * │ conteúdo ACIMA pertence àquela aba.                                   │
 * │                                                                      │
 * │ A aba fechada fica com fundo igual ao da faixa. Parece detalhe; é o     │
 * │ que a faz recuar em vez de competir com o conteúdo.                    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O papel é `tablist`/`tab`/`tabpanel` de verdade: seta esquerda e direita
 * trocam de aba no teclado, e o `aria-selected` diz ao leitor de tela qual
 * está aberta. A grade acima é o `tabpanel`.
 */
function FaixaDeAbas({
  folhas,
  aberta,
  aoAbrir,
  aoCriar,
}: {
  folhas: readonly FolhaGrade[];
  aberta: number;
  aoAbrir: (indice: number) => void;
  aoCriar?: () => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Folhas da planilha"
      className="flex items-end gap-px overflow-x-auto border-t border-[var(--linha-forte)] bg-[var(--superficie-areia)] px-2 pt-1.5 pb-0"
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
      {aoCriar ? (
        <button
          type="button"
          onClick={aoCriar}
          aria-label="Nova folha"
          title="Nova folha nesta sessão — sem armazenamento definitivo"
          className={cn(
            "mb-[1px] mr-1 shrink-0 rounded-[var(--raio-sm)] px-2 py-0.5",
            "text-[0.875rem] leading-none font-medium text-[var(--tinta-fraca)]",
            "transition-colors hover:bg-[rgba(107,122,70,0.12)] hover:text-tinta"
          )}
        >
          +
        </button>
      ) : null}

      {folhas.map((f, i) => {
        const ativa = i === aberta;
        return (
          <button
            key={`${f.nome}-${i}`}
            type="button"
            role="tab"
            id={`aba-${i}`}
            aria-selected={ativa}
            aria-controls="planilha-grade"
            tabIndex={ativa ? 0 : -1}
            onClick={() => aoAbrir(i)}
            className={cn(
              "shrink-0 rounded-b-[4px] border border-t-0 px-3 py-1.5",
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
 * Tudo que ela desenha vem de `LinhaGrade` — os oito tipos que o modelo já
 * sabe produzir. Ela não conhece "tarefa", "ingrediente" nem "custo": se um
 * quinto modelo chegar com um bloco novo, esta peça o desenha sem alteração.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `border-collapse: separate`                                   │
 * │                                                                      │
 * │ Parece detalhe de CSS e decide se a planilha funciona. Com             │
 * │ `collapse`, as bordas de uma célula pertencem à TABELA e não à célula  │
 * │ — e ao prender a faixa de letras no topo ou a coluna de números à      │
 * │ esquerda, a borda que deveria acompanhar a célula simplesmente não     │
 * │ rola com ela. O resultado é uma linha de letras flutuando sem divisão  │
 * │ nenhuma, que é pior que não ter letras.                               │
 * │                                                                      │
 * │ Com `separate` e `border-spacing: 0`, cada célula desenha a própria    │
 * │ borda e ela viaja junto. O preço é que a divisão entre duas células     │
 * │ vizinhas seria dobrada — e por isso cada célula desenha só a borda      │
 * │ DIREITA e a de BAIXO. Vizinha à direita e abaixo já desenham as outras.│
 * └──────────────────────────────────────────────────────────────────────┘
 */
function Grade({
  folha,
  indice,
  altura,
  edicoes,
  aoEditar,
}: {
  folha: FolhaGrade;
  indice: number;
  altura?: number;
  edicoes?: Readonly<Record<string, CelulaGrade>>;
  aoEditar?: (chave: string, valor: CelulaGrade) => void;
}) {
  const totalColunas = Math.max(1, folha.colunas.length);
  const primeiraColunaFixa = totalColunas > 3;
  const linhaInicial = folha.linhaInicial ?? 3;

  const [selecao, definirSelecao] = useState<Posicao | null>(null);

  /*
    A CHAVE DA EDIÇÃO, montada num lugar só.

    Se ela fosse escrita à mão em três pontos — ao ler, ao gravar e ao
    comparar —, bastaria um deles divergir para uma célula digitada não
    aparecer, e o defeito pareceria "a digitação não funciona às vezes".
  */
  const chaveDe = (end: string) => `${folha.nome}::${end}`;

  const editavel = Boolean(folha.editavel && edicoes && aoEditar);

  /** O número que a folha mostra na coluna de linhas, para a linha física `i`. */
  const numeroDaLinha = (i: number) => linhaInicial + i;

  const calculadas = folha.calculadas ?? [];

  /** A célula é resultado calculado? Ela existe, mostra valor, e não se digita. */
  function ehCalculada(i: number, coluna: number): boolean {
    return calculadas.includes(endereco(numeroDaLinha(i), coluna));
  }

  return (
    <div
      id="planilha-grade"
      role="tabpanel"
      aria-labelledby={`aba-${indice}`}
      className="w-full overflow-auto overscroll-x-contain"
      style={altura ? { maxHeight: `${altura}px` } : { maxHeight: "62vh" }}
      tabIndex={0}
      /*
        A GRADE TOMA O FOCO, e é isso que habilita as setas.

        Sem `tabIndex` no contêiner, quem navega por teclado ficaria preso na
        primeira célula: as setas só chegam em quem tem foco, e depois de
        confirmar um valor o foco volta para o corpo do documento.
      */
    >
      <table
        className="border-separate border-spacing-0 text-[0.75rem] leading-tight"
        /*
          A largura mínima é a soma das larguras declaradas por coluna, mais a
          coluna de números. É o que faz a grade passar da largura da tela e
          rolar de lado em vez de espremer as colunas — numa planilha,
          espremer destrói a comparação entre linhas, que é a razão de ela
          existir.
        */
        style={{ minWidth: `${LARGURA_GUTTER + somaDasLarguras(folha)}px` }}
      >
        <caption className="sr-only">{folha.titulo}</caption>

        <thead>
          {/*
            A FAIXA DE LETRAS.

            É a primeira coisa que faz a grade ser lida como planilha, e a
            única pista de posição quando alguém dita um endereço em voz alta.
            Ela fica presa no topo junto com o cabeçalho — as duas rolam
            horizontalmente com o conteúdo e continuam à vista na vertical.
          */}
          <tr>
            <th
              scope="col"
              aria-label="Número da linha"
              style={{ width: `${LARGURA_GUTTER}px`, top: 0 }}
              className={cn(
                "sticky left-0 z-30 border-r border-b border-[var(--linha-forte)]",
                "bg-[var(--superficie-areia)]",
                // O canto superior esquerdo é o único ponto que precisa ficar
                // acima de tudo: ele é, ao mesmo tempo, topo e esquerda.
                "after:absolute after:inset-0 after:bg-[var(--superficie-areia)]"
              )}
            />
            {folha.colunas.map((c, i) => (
              <th
                key={`letra-${c.chave}`}
                scope="col"
                style={{ top: 0, minWidth: `${larguraDaColuna(c)}px` }}
                className={cn(
                  "sticky z-20 border-r border-b border-[var(--linha-forte)]",
                  "bg-[var(--superficie-areia)] px-1 py-[2px] text-center",
                  "text-[0.625rem] font-semibold tracking-[0.06em] text-[var(--tinta-fraca)]",
                  primeiraColunaFixa && i === 0 && "left-0 z-[25]"
                )}
              >
                {letraDaColuna(i + 1)}
              </th>
            ))}
          </tr>

          {/*
            A LINHA DE TÍTULOS DAS COLUNAS.

            Ela só existe quando a folha é uma tabela. Nas folhas de texto —
            resumo, informações — o título de coluna não existe, e uma faixa
            vazia gastaria altura sem dizer nada. As letras acima e os números
            ao lado continuam, porque esses não são conteúdo: são coordenada.
          */}
          {folha.mostrarCabecalho ? (
            <tr>
              <th
                scope="col"
                aria-hidden="true"
                style={{ top: `${ALTURA_LETRAS}px`, width: `${LARGURA_GUTTER}px` }}
                className="sticky left-0 z-30 border-r border-b border-[var(--linha-forte)] bg-[var(--superficie-areia)]"
              />
              {folha.colunas.map((c, i) => (
                <th
                  key={`titulo-${c.chave}`}
                  scope="col"
                  style={{
                    top: `${ALTURA_LETRAS}px`,
                    minWidth: `${larguraDaColuna(c)}px`,
                  }}
                  className={cn(
                    "sticky z-20 border-r border-b border-[var(--linha-forte)]",
                    "bg-[var(--superficie-areia)] px-2 py-[3px]",
                    "text-[0.625rem] font-semibold tracking-[0.1em] whitespace-nowrap uppercase",
                    "text-[var(--tinta-suave)]",
                    alinhamento(c.formato) === "dir" && "text-right",
                    alinhamento(c.formato) === "centro" && "text-center",
                    alinhamento(c.formato) === "esq" && "text-left",
                    primeiraColunaFixa && i === 0 && "left-0 z-[25]"
                  )}
                >
                  {c.titulo}
                </th>
              ))}
            </tr>
          ) : null}
        </thead>

        <tbody>
          {folha.linhas.map((item, i) => (
            <Linha
              key={`${item.tipo}-${i}`}
              item={item}
              folha={folha}
              indice={i}
              numero={numeroDaLinha(i)}
              primeiraColunaFixa={primeiraColunaFixa}
              editavel={editavel}
              selecao={selecao}
              definirSelecao={definirSelecao}
              chaveDe={chaveDe}
              edicoes={edicoes}
              ehCalculada={ehCalculada}
              aoEditar={aoEditar}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * UMA LINHA DA FOLHA — os oito tipos, cada um com o seu peso visual.
 *
 * A escolha do peso é a única decisão de desenho deste arquivo, e ela é sobre
 * HIERARQUIA, não sobre cor: `secao` é uma faixa que separa; `campo` é um par
 * rótulo/valor; `total` é o que fecha a conta. Nada aqui é enfeite.
 */
function Linha({
  item,
  folha,
  indice,
  numero,
  primeiraColunaFixa,
  editavel,
  selecao,
  definirSelecao,
  chaveDe,
  edicoes,
  ehCalculada,
  aoEditar,
}: {
  item: LinhaGrade;
  folha: FolhaGrade;
  indice: number;
  numero: number;
  primeiraColunaFixa: boolean;
  editavel: boolean;
  selecao: Posicao | null;
  definirSelecao: (p: Posicao | null) => void;
  chaveDe: (end: string) => string;
  edicoes?: Readonly<Record<string, CelulaGrade>>;
  ehCalculada: (indice: number, coluna: number) => boolean;
  aoEditar?: (chave: string, valor: CelulaGrade) => void;
}) {
  const colunas = folha.colunas;

  /**
   * O NÚMERO DA LINHA, preso à esquerda.
   *
   * Ele é o outro endereço da célula — sem ele não se diz "a linha 12 está
   * errada". Fica `sticky left-0` para não se perder na rolagem lateral, que
   * é o gesto constante numa grade de doze colunas.
   */
  const gutter = (extra?: string) => (
    <th
      scope="row"
      style={{ width: `${LARGURA_GUTTER}px` }}
      className={cn(
        "sticky left-0 z-10 border-r border-b border-[var(--linha-forte)]",
        "bg-[var(--superficie-areia)] px-1 text-center",
        "tabular text-[0.625rem] font-medium text-[var(--tinta-fraca)]",
        extra
      )}
    >
      {numero}
    </th>
  );

  if (item.tipo === "secao") {
    const sozinha = colunas.length <= 1;
    return (
      <tr>
        {gutter()}
        <th
          scope="colgroup"
          colSpan={Math.max(1, colunas.length)}
          className={cn(
            "border-b border-[var(--linha)] bg-[rgba(107,122,70,0.1)] px-2 py-[3px] text-left",
            "text-[0.6875rem] font-semibold tracking-[0.08em] uppercase text-[var(--tinta)]",
            sozinha && "bg-[var(--superficie-areia)] px-3 pt-3 pb-1"
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
        {gutter()}
        <td
          colSpan={Math.max(1, colunas.length)}
          className={cn(
            "border-b border-[var(--linha)] px-2 py-[4px] align-top text-[0.75rem] leading-snug whitespace-normal",
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
    return (
      <tr>
        {gutter()}
        <th
          scope="row"
          className={cn(
            "border-r border-b border-[var(--linha)] px-2 py-[3px] text-left",
            "text-[0.75rem] font-medium whitespace-nowrap text-[var(--tinta-suave)]"
          )}
        >
          {item.rotulo}
        </th>
        <td
          className={cn(
            "border-r border-b border-[var(--linha)] px-2 py-[3px] text-[0.75rem] whitespace-nowrap text-tinta",
            ehNumerico(item.formato) && "tabular text-right"
          )}
        >
          {textoDaCelula(item.valor, item.formato ?? "texto")}
        </td>
        {Array.from({ length: Math.max(0, colunas.length - 2) }, (_, k) => (
          <td
            key={k}
            style={{
              minWidth: `${larguraDaColuna(colunas[k + 2] ?? colunas[colunas.length - 1]!)}px`,
            }}
            className="border-r border-b border-[var(--linha)]"
          />
        ))}
      </tr>
    );
  }

  if (item.tipo === "cabecalho") {
    return (
      <tr>
        {gutter()}
        {colunas.map((c) => (
          <th
            key={c.chave}
            scope="col"
            style={{ minWidth: `${larguraDaColuna(c)}px` }}
            className={cn(
              "border-r border-b border-[var(--linha-forte)] bg-[var(--superficie-areia)] px-2 py-[3px]",
              "text-[0.625rem] font-semibold tracking-[0.1em] whitespace-nowrap uppercase",
              "text-[var(--tinta-suave)]",
              alinhamento(c.formato) === "dir" && "text-right",
              alinhamento(c.formato) === "centro" && "text-center",
              alinhamento(c.formato) === "esq" && "text-left"
            )}
          >
            {c.titulo}
          </th>
        ))}
      </tr>
    );
  }

  /*
    `vazia`, `dados`, `subtotal` e `total` — a linha de célula.

    A `vazia` cai junto com `dados` de propósito: a diferença entre as duas é
    só o fundo e a possibilidade de digitar, e separar os dois caminhos daria
    duas implementações de célula que precisariam ser mantidas iguais.
  */
  const total = item.tipo === "total";
  const subtotal = item.tipo === "subtotal";
  const vazia = item.tipo === "vazia";
  const rotulo = "rotulo" in item ? item.rotulo : undefined;

  const fundo = vazia
    ? "bg-[var(--superficie-solida)]"
    : total
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
        subtotal && "border-t border-t-[var(--linha-forte)]",
        total && "border-t-2 border-t-[var(--linha-forte)] text-tinta"
      )}
    >
      {gutter()}
      {colunas.map((c, j) => {
        const coluna = j + 1;

        /*
          QUEM MANDA NO CONTEÚDO DA CÉLULA: a digitação, depois o modelo.

          A ordem importa. Se o modelo ganhasse, ela digitaria por cima de uma
          célula preenchida, trocaria de aba e o texto dela desapareceria — o
          modelo é reconstruído do zero a cada troca, e a digitação não.
        */
        const doModelo =
          j === 0 && (total || subtotal) && rotulo ? rotulo : item.celulas?.[c.chave];
        const digitado = edicoes?.[chaveDe(endereco(numero, coluna))];
        const celula = digitado !== undefined ? digitado : (doModelo ?? null);

        const calculada = ehCalculada(indice, coluna);
        /*
          A ÚLTIMA CÉLULA DE UM FECHAMENTO NÃO SE DIGITA.

          Subtotal e total são resultado, não entrada — pela mesma razão que a
          célula calculada não é: um total que se pode sobrescrever à mão
          deixa de ser um total, e passa a ser mais um número na linha.
        */
        const ehEditavel = editavel && !calculada && !total && !subtotal;
        const selecionada =
          selecao !== null && selecao.linha === indice && selecao.coluna === j;

        return (
          <Celula
            key={c.chave}
            coluna={c}
            colunaNumero={coluna}
            largura={larguraDaColuna(c)}
            fundo={fundo}
            celula={celula}
            primeiraColunaFixa={primeiraColunaFixa}
            primeira={j === 0}
            calculada={calculada}
            editavel={ehEditavel}
            selecionada={selecionada}
            onSelecionar={() => definirSelecao({ linha: indice, coluna: j })}
            onConfirmar={(valor) => aoEditar?.(chaveDe(endereco(numero, coluna)), valor)}
            onMover={(passo) => definirSelecao({ linha: Math.max(0, indice + passo), coluna: j })}
          />
        );
      })}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// A célula
// ---------------------------------------------------------------------------

/**
 * UMA CÉLULA.
 *
 * Ela é a peça onde a maior parte das decisões desta rodada mora, porque é
 * onde a planilha deixa de ser desenho e vira instrumento de trabalho.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS TRÊS FORMAS DE UMA CÉLULA, E POR QUE ELAS PRECISAM SER TRÊS       │
 * │                                                                      │
 * │ ENTRADA   fundo claro, texto normal. Aceita digitação. É o que ela    │
 * │           informa: peso, preço, nome, quantidade.                     │
 * │                                                                      │
 * │ CALCULADA fundo levemente esverdeado, texto em tinta mais fechada,    │
 * │           e SEM cursor de edição. É o que o sistema respondeu:        │
 * │           correção, peso bruto, custo. Um valor calculado que se pode │
 * │           reescrever à mão deixa de ser cálculo.                      │
 * │                                                                      │
 * │ LEITURA   fundo normal, sem interação. É a folha derivada inteira —   │
 * │           ficha, custos, relatório. Nada ali é digitável, e a célula  │
 * │           não promete o contrário.                                    │
 * │                                                                      │
 * │ A DISTINÇÃO É VISUAL, E NÃO UM AVISO. Não há legenda explicando qual  │
 * │ célula é qual: o que é calculado parece calculado, e o que é entrada  │
 * │ parece entrada. É a mesma economia de cromo que o resto da tela.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function Celula({
  coluna,
  colunaNumero,
  largura,
  fundo,
  celula,
  primeiraColunaFixa,
  primeira,
  calculada,
  editavel,
  selecionada,
  onSelecionar,
  onConfirmar,
  onMover,
}: {
  coluna: FolhaGrade["colunas"][number];
  /** O número da coluna, para rotular o campo de digitação com o endereço. */
  colunaNumero: number;
  largura: number;
  fundo: string;
  celula: CelulaGrade;
  primeiraColunaFixa: boolean;
  primeira: boolean;
  calculada: boolean;
  editavel: boolean;
  selecionada: boolean;
  onSelecionar: () => void;
  onConfirmar: (valor: CelulaGrade) => void;
  onMover: (passo: number) => void;
}) {
  const [digitando, definirDigitando] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  /*
    O FOCO É DADO QUANDO A CÉLULA ABRE, e por efeito — não por `autoFocus`.

    `autoFocus` dispara na MONTAGEM do elemento, e o elemento já existe desde
    sempre: o que muda é ele passar a ser um input. Sem este efeito, a célula
    abriria para digitação e o teclado continuaria no corpo da página.
  */
  useEffect(() => {
    if (digitando === null) return;
    campo.current?.focus();
    campo.current?.select();
  }, [digitando]);

  const exibicao = textoDaCelula(ausente(celula), coluna.formato);

  /** O texto inicial do editor: o valor cru quando existe, vazio quando é ausência. */
  const valorCru =
    celula instanceof Date
      ? textoDaCelula(celula, coluna.formato)
      : celula === null || celula === undefined
        ? ""
        : String(celula);

  /** O que se digitou vira número quando a coluna é numérica e o texto é número. */
  function interpretar(texto: string): CelulaGrade {
    const limpo = texto.trim();
    if (limpo === "") return null;
    if (!ehNumerico(coluna.formato)) return limpo;

    /*
      A VÍRGULA É O DECIMAL — E O PONTO NÃO.

      Este é o sistema inteiro em português, e no teclado numérico brasileiro
      a vírgula é o separador decimal. Aceitar o ponto como decimal seria o
      erro que transforma "1.500" em um e meio, e é o tipo de troca silenciosa
      que este projeto trata como defeito grave.

      Então: ponto de MILHAR é removido, vírgula vira ponto para a conversão,
      e o resultado tem de ser um número inteiro de ponta a ponta. Qualquer
      outra coisa — "5kg", "R$ 10", "cinco" — é recusada e o texto fica como
      está: numa planilha, o que não é número não pode virar número.
    */
    const normalizado = limpo.replace(/\./g, "").replace(",", ".");
    const n = Number(normalizado);
    if (!Number.isFinite(n)) return limpo;
    return n;
  }

  function fechar(confirmar: boolean) {
    if (digitando === null) return;
    if (confirmar) onConfirmar(interpretar(digitando));
    definirDigitando(null);
  }

  const classes = cn(
    "relative border-r border-b border-[var(--linha)] px-2 py-[3px] align-middle whitespace-nowrap",
    fundo,
    primeira && "font-medium text-tinta",
    alinhamento(coluna.formato) === "dir" && !primeira && "tabular text-right text-tinta",
    alinhamento(coluna.formato) === "dir" && primeira && "tabular text-right",
    alinhamento(coluna.formato) === "centro" && "text-center",
    alinhamento(coluna.formato) === "esq" && !primeira && "text-[var(--tinta-suave)]",
    calculada && "bg-[rgba(107,122,70,0.05)] text-[var(--tinta-suave)]",
    selecionada && "outline outline-2 -outline-offset-1 outline-[var(--color-oliva)]",
    primeiraColunaFixa && primeira && cn("sticky left-0 z-[1]", fundo)
  );

  // ── O modo de digitação ───────────────────────────────────────────────
  if (digitando !== null) {
    return (
      <td
        style={{ minWidth: `${largura}px`, width: `${largura}px` }}
        className={cn(classes, "p-0")}
      >
        <input
          ref={campo}
          value={digitando}
          onChange={(e) => definirDigitando(e.target.value)}
          /*
            A NAVEGAÇÃO É A DO EXCEL, e é a razão de isto ser um input e não
            um campo de formulário: `Enter` desce, `Tab` anda para o lado,
            `Escape` desfaz. Quem usa planilha há vinte anos tem esses três
            gestos no músculo, e trocá-los por um botão "salvar" seria fazer
            a ferramenta trabalhar contra a mão de quem a usa.
          */
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              fechar(true);
              onMover(1);
            } else if (e.key === "Tab") {
              // O Tab NÃO é prevenido: o foco segue para a célula seguinte
              // sozinho, e a confirmação acontece antes de ele sair.
              fechar(true);
            } else if (e.key === "Escape") {
              e.preventDefault();
              fechar(false);
            }
          }}
          onBlur={() => fechar(true)}
          aria-label={`${letraDaColuna(colunaNumero)} — ${coluna.titulo || "célula"}`}
          className={cn(
            "h-full w-full bg-white px-2 py-[3px] text-[0.75rem] text-tinta",
            "outline-none",
            ehNumerico(coluna.formato) && "tabular text-right"
          )}
        />
      </td>
    );
  }

  // ── A célula de leitura ───────────────────────────────────────────────
  if (!editavel) {
    return (
      <td style={{ minWidth: `${largura}px` }} className={classes} title={tituloDaCelula(calculada)}>
        {exibicao}
      </td>
    );
  }

  // ── A célula de entrada ───────────────────────────────────────────────
  return (
    <td
      style={{ minWidth: `${largura}px` }}
      className={cn(classes, "cursor-cell")}
      tabIndex={-1}
      title={tituloDaCelula(false)}
      onClick={() => {
        onSelecionar();
        definirDigitando(valorCru);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== "F2") return;
        e.preventDefault();
        definirDigitando(valorCru);
      }}
    >
      {exibicao === "—" ? <span className="text-[var(--tinta-fraca)]">—</span> : exibicao}
    </td>
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

/** O alinhamento de uma coluna — re-exportado do vocabulário puro da grade. */
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

/**
 * O QUE A CÉLULA DIZ QUANDO O MOUSE PARA EM CIMA DELA.
 *
 * Numa folha digitável, o título explica a distinção que o fundo insinua —
 * porque "por que esta célula não abre?" é a pergunta que ela vai fazer, e a
 * resposta precisa estar a um segundo de distância, não numa legenda.
 */
function tituloDaCelula(calculada: boolean): string | undefined {
  return calculada ? "Valor calculado pelo sistema — não é editável aqui." : undefined;
}
