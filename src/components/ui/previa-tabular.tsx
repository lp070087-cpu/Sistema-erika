"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { endereco, letraDaColuna, medidaDigitada, textoDaCelula } from "@/lib/planilhas/grade";
import {
  aplicarPincelNaFolha,
  estiloDaCelula,
  estiloDeLinha,
} from "@/lib/planilhas/grade";
import type {
  CelulaGrade,
  EstiloGrade,
  FolhaGrade,
  FormatoGrade,
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

/**
 * O QUE ESTÁ SELECIONADO — uma célula, ou uma linha inteira.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE "LINHA" NÃO É "CÉLULA COM A COLUNA A"                        │
 * │                                                                      │
 * │ A tentação era representar a linha escolhida como a célula do          │
 * │ endereço A — o mesmo truque que a marcação de linha usa. Ele            │
 * │ funcionaria para pintar e falharia na TELA: a barra diz "linha 12" e o  │
 * │ quadrado de seleção apareceria só na coluna A, que é exatamente o       │
 * │ contrário do que ela acabou de escolher.                               │
 * │                                                                      │
 * │ São dois gestos diferentes, e por isso dois casos declarados.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type SelecaoDaGrade =
  | { tipo: "celula"; linha: number; coluna: number }
  | { tipo: "linha"; linha: number };

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
  selecao,
  aoSelecionar,
  pincel,
  aba,
  aoAbrirAba,
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
  /** Botões extras na barra de ações — "Exportar", "Editar ficha". */
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
  /**
   * A SELEÇÃO ATUAL, QUANDO QUEM MANDA É A TELA.
   *
   * Sem estas duas props a seleção é interna, como sempre foi — e é o que o
   * resto do sistema usa. A Central passa as duas porque a barra de formatação
   * vive FORA da grade: para ela pintar a célula escolhida, ela precisa saber
   * qual é, e "quem sabe o que está selecionado" tem de ser um só.
   */
  selecao?: SelecaoDaGrade | null;
  aoSelecionar?: (posicao: SelecaoDaGrade | null) => void;
  /**
   * A MARCAÇÃO POR CHAVE — `"Ficha::G4"`.
   *
   * A grade que vem pronta já a traz aplicada. O mapa ainda é preciso aqui por
   * UM caso: a aba criada nesta sessão pelo `[+]`, que nasceu depois de o pai
   * montar a grade e por isso nunca passou por `aplicarPincelNaFolha`.
   *
   * Ele é opcional porque a maior parte das telas que usam esta peça não tem
   * barra de formatação nenhuma — nelas não há marcação para aplicar.
   */
  pincel?: Readonly<Record<string, EstiloGrade>>;
  /**
   * A FOLHA ABERTA, QUANDO QUEM MANDA É A TELA.
   *
   * A barra de formatação vive fora da grade e escreve no mapa `pincel` por
   * `"<aba>::<endereço>"` — ou seja, ela precisa saber QUAL folha está aberta
   * para montar a chave. Como a faixa de abas é desenhada aqui dentro, esse
   * conhecimento só existe aqui.
   *
   * Poderiam existir dois estados: um na tela, para a barra, e um interno,
   * para as abas. Seriam duas respostas para a mesma pergunta, e o dia em que
   * discordassem a barra pintaria uma folha e o olho veria outra — a versão
   * silenciosa de errar a célula. Um estado só, e é este par que o torna
   * controlável.
   *
   * Sem estas props a folha aberta é interna, como sempre foi.
   */
  aba?: number;
  aoAbrirAba?: (indice: number) => void;
}) {
  const [abertaLocal, definirAbertaLocal] = useState(ABA_PADRAO);
  const [selecaoLocal, definirSelecaoLocal] = useState<SelecaoDaGrade | null>(null);

  /*
    A SELEÇÃO CONTROLADA É OPCIONAL, e o teste é a prop existir — não o valor
    dela. `selecao ?? selecaoLocal` pareceria equivalente e não é: uma seleção
    controlada em `null` (nada escolhido) cairia para a local e a tela mostraria
    a célula de uma seleção que o pai acabou de limpar.
  */
  const controlada = aoSelecionar !== undefined;
  const selecaoAtual = controlada ? (selecao ?? null) : selecaoLocal;
  const definirSelecao = controlada ? aoSelecionar : definirSelecaoLocal;

  /*
    O MESMO TESTE PARA AS ABAS, e pelo mesmo motivo: `aba ?? abertaLocal`
    trataria a folha 0 como "não informada" e a tela ficaria presa na
    primeira aba. O teste é a prop existir.
  */
  const abaControlada = aoAbrirAba !== undefined;
  const definirAberta = abaControlada ? aoAbrirAba : definirAbertaLocal;

  /*
    O ÍNDICE É PRESO À FAIXA VÁLIDA.

    Quando o cliente troca, a grade nova pode ter menos abas que a anterior —
    e o índice guardado apontaria para fora. O `?? folhas[0]` devolve a
    primeira folha nesse caso, em vez de a tela quebrar: seria o defeito mais
    chato possível, porque só apareceria ao trocar de um modelo de 4 abas
    para um de 3.
  */
  /*
    A MARCAÇÃO VIROU LINHA AQUI, UMA VEZ.

    `grade` já chega com o pincel aplicado (ver `aplicarPincelNaFolha`), então
    o que a grade desenha é literalmente a mesma estrutura que o arquivo
    recebe. O que falta é a FOLHA NOVA — a aba criada nesta sessão pelo `[+]`,
    que nunca passou pelo `aplicarPincelNaFolha` do pai porque ela nasceu
    depois dele.
  */
  const folhas = [
    ...grade.folhas,
    ...(folhasExtras ?? []).map((f) => aplicarPincelNaFolha(f, pincel)),
  ];
  const pedida = abaControlada ? (aba ?? ABA_PADRAO) : abertaLocal;
  const indice = pedida < folhas.length ? pedida : ABA_PADRAO;
  const folha = folhas[indice] ?? folhas[0];
  if (!folha) return null;

  /*
    A SELEÇÃO É ZERADA QUANDO A ABA MUDA.

    Sem isto, o endereço `Ficha::G4` continuaria escolhido ao abrir "Base": a
    barra de formatação pintaria a G4 da outra folha, sem que nada na tela
    indicasse isso. Marcar a célula errada é a versão silenciosa de perder
    trabalho.
  */
  function abrirAba(alvo: number) {
    definirAberta(alvo);
    if (controlada) aoSelecionar?.(null);
    else definirSelecaoLocal(null);
  }

  /*
    A SELEÇÃO CRUZA A FRONTEIRA EM NÚMERO DE LINHA, E NÃO EM ÍNDICE.

    ┌────────────────────────────────────────────────────────────────────┐
    │ POR QUE A TRADUÇÃO ACONTECE AQUI, E NÃO EM QUEM CHAMA              │
    │                                                                    │
    │ Dentro da grade a linha é um ÍNDICE — a primeira linha é a 0. Fora    │
    │ dela, a linha é o NÚMERO que aparece na coluna da esquerda: a mesma   │
    │ que a Érika diz em voz alta e que a chave da marcação usa.             │
    │                                                                    │
    │ Quem olha a grade de fora não sabe onde o conteúdo começa: o         │
    │ `linhaInicial` da folha é uma propriedade DELA, e uma folha de ficha  │
    │ pode começar na linha 3 enquanto uma grade livre começa na 1. Se o    │
    │ pai fizesse a conta, precisaria do mesmo número — e teria de          │
    │ adivinhá-lo, ou repetir uma constante que mora aqui.                 │
    │                                                                    │
    │ Traduzindo aqui, o que sai desta peça é sempre endereço de planilha:  │
    │ "linha 12" quer dizer a linha 12. É a mesma fronteira que a chave da  │
    │ marcação já respeita.                                              │
    └────────────────────────────────────────────────────────────────────┘
  */
  const linhaInicialDaFolha = folha.linhaInicial ?? 3;

  const selecaoParaGrade: SelecaoDaGrade | null =
    selecaoAtual === null ? null : { ...selecaoAtual, linha: selecaoAtual.linha - linhaInicialDaFolha };

  const selecionarDaGrade = (posicao: SelecaoDaGrade | null) => {
    if (posicao === null) {
      definirSelecao(null);
      return;
    }
    definirSelecao({ ...posicao, linha: posicao.linha + linhaInicialDaFolha });
  };

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
        selecao={selecaoParaGrade}
        definirSelecao={selecionarDaGrade}
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
        aoAbrir={abrirAba}
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
  selecao,
  definirSelecao,
}: {
  folha: FolhaGrade;
  indice: number;
  altura?: number;
  edicoes?: Readonly<Record<string, CelulaGrade>>;
  aoEditar?: (chave: string, valor: CelulaGrade) => void;
  selecao: SelecaoDaGrade | null;
  definirSelecao: ((posicao: SelecaoDaGrade | null) => void) | undefined;
}) {
  const totalColunas = Math.max(1, folha.colunas.length);
  const primeiraColunaFixa = totalColunas > 3;
  const linhaInicial = folha.linhaInicial ?? 3;

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
  selecao: SelecaoDaGrade | null;
  definirSelecao: ((p: SelecaoDaGrade | null) => void) | undefined;
  chaveDe: (end: string) => string;
  edicoes?: Readonly<Record<string, CelulaGrade>>;
  ehCalculada: (indice: number, coluna: number) => boolean;
  aoEditar?: (chave: string, valor: CelulaGrade) => void;
}) {
  const colunas = folha.colunas;

  /*
    A MARCAÇÃO JÁ ESTÁ NA LINHA.

    Ela não é consultada num mapa paralelo: `estiloDeLinha` e `estiloDaCelula`
    leem o `estilo` e os `estilosCelulas` que o `aplicarPincelNaFolha` gravou na
    própria linha. É o que faz a tela desenhar exatamente a estrutura que o
    arquivo vai receber — um mapa consultado aqui por conta própria poderia
    divergir da grade, e a divergência seria a planilha amarela na tela e
    branca no Excel.
  */
  const daLinha = estiloDeLinha(item);

  /** A marcação de uma célula pelo NÚMERO da coluna — 1 é a coluna A. */
  const marcacaoDaColuna = (numeroDaColuna: number) =>
    estiloDaCelula(item, colunas[numeroDaColuna - 1]?.chave ?? "");

  /**
   * O NÚMERO DA LINHA, preso à esquerda.
   *
   * Ele é o outro endereço da célula — sem ele não se diz "a linha 12 está
   * errada". Fica `sticky left-0` para não se perder na rolagem lateral, que
   * é o gesto constante numa grade de doze colunas.
   *
   * E ELE É O BOTÃO DE MARCAR A LINHA INTEIRA: é onde a mão vai para escolher
   * a linha, e é o único ponto da grade que pertence à linha sem pertencer a
   * coluna nenhuma.
   */
  const linhaEscolhida = selecao?.tipo === "linha" && selecao.linha === indice;

  const gutter = (extra?: string) => (
    <th
      scope="row"
      style={{ width: `${LARGURA_GUTTER}px` }}
      onClick={() => definirSelecao?.({ tipo: "linha", linha: indice })}
      title={`Selecionar a linha ${numero}`}
      className={cn(
        "sticky left-0 z-10 cursor-pointer border-r border-b border-[var(--linha-forte)]",
        "bg-[var(--superficie-areia)] px-1 text-center",
        "tabular text-[0.625rem] font-medium text-[var(--tinta-fraca)]",
        linhaEscolhida && "outline outline-2 -outline-offset-1 outline-[var(--color-oliva)]",
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
          style={estiloEmCss(daLinha)}
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
          style={estiloEmCss(daLinha)}
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
    const formatoDoCampo = marcacaoDaColuna(1)?.formato ?? item.formato ?? "texto";
    return (
      <tr>
        {gutter()}
        <th
          scope="row"
          className={cn(
            "border-r border-b border-[var(--linha)] px-2 py-[3px] text-left",
            "text-[0.75rem] font-medium whitespace-nowrap text-[var(--tinta-suave)]"
          )}
          style={estiloEmCss(daLinha)}
        >
          {item.rotulo}
        </th>
        <td
          className={cn(
            "border-r border-b border-[var(--linha)] px-2 py-[3px] text-[0.75rem] whitespace-nowrap text-tinta",
            ehNumerico(formatoDoCampo) && "tabular text-right"
          )}
          style={estiloEmCss(marcacaoDaColuna(1))}
        >
          {textoDaCelula(item.valor, formatoDoCampo)}
        </td>
        {Array.from({ length: Math.max(0, colunas.length - 2) }, (_, k) => (
          <td
            key={k}
            style={{
              ...estiloEmCss(marcacaoDaColuna(k + 3)),
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
            style={{ ...estiloEmCss(estiloDaCelula(item, c.chave)), minWidth: `${larguraDaColuna(c)}px` }}
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
    A FAIXA DE NOMES DO TOPO DE UMA FICHA — uma linha só, um nome por coluna.

    ┌──────────────────────────────────────────────────────────────────────┐
    │ POR QUE ISTO É UMA LINHA, E NÃO UM BLOCO DE CAMPOS                   │
    │                                                                      │
    │ A ficha começa com o que se quer ver de relance: rendimento, custo     │
    │ total, quilo por porção, custo por porção, unidade por porção, margem  │
    │ de segurança. Empilhados como pares rótulo/valor eles ocupam doze      │
    │ linhas e o olho percorre um de cada vez. Lado a lado, cabem numa       │
    │ faixa e o painel se lê de uma só vez — que é o leiaute da planilha de  │
    │ trabalho da Érika.                                                    │
    │                                                                      │
    │ E É UMA LINHA DE VERDADE, com endereço próprio. Ela não pode virar     │
    │ duas linhas físicas no arquivo, porque o número que a tela mostra à    │
    │ esquerda é o número da linha do Excel: se a faixa comesse dois         │
    │ endereços, tudo abaixo dela apareceria com um número a menos do que    │
    │ é — e a marcação que a Érika faz na tela cairia na linha errada do     │
    │ arquivo.                                                              │
    │                                                                      │
    │ A SOBRA É PINTADA, e não ignorada: a barra escura fecha na largura da  │
    │ tabela. Terminando antes, ela pareceria um remendo com um degrau no    │
    │ meio da folha.                                                        │
    └──────────────────────────────────────────────────────────────────────┘
  */
  if (item.tipo === "rotulos") {
    const usados = Math.min(item.rotulos.length, colunas.length);

    return (
      <tr style={estiloEmCss(daLinha)}>
        {gutter()}
        {item.rotulos.slice(0, usados).map((texto, i) => {
          const c = colunas[i];
          if (c === undefined) return null;
          const largura = larguraDaColuna(c);
          return (
            <th
              key={c.chave}
              scope="col"
              style={{ ...estiloEmCss(estiloDaCelula(item, c.chave)), minWidth: `${largura}px` }}
              className={cn(
                "border-r border-b border-[rgba(255,255,255,0.16)] bg-[var(--color-profundo)] px-1.5 py-[3px]",
                "text-center align-middle text-[0.5625rem] font-semibold tracking-[0.08em] whitespace-normal uppercase",
                "text-[rgba(250,247,241,0.86)]"
              )}
            >
              {texto}
            </th>
          );
        })}
        {Array.from({ length: Math.max(0, colunas.length - usados) }, (_, k) => {
          const idx = usados + k;
          return (
            <th
              key={`sobra-${k}`}
              aria-hidden="true"
              style={{
                minWidth: `${larguraDaColuna(colunas[idx] ?? colunas[colunas.length - 1]!)}px`,
              }}
              className="border-r border-b border-[rgba(255,255,255,0.16)] bg-[var(--color-profundo)]"
            />
          );
        })}
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
      style={estiloEmCss(daLinha)}
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
          O FORMATO DA CÉLULA, quando a barra trocou moeda ou porcentagem.

          Ele vence o formato da coluna, e é o mesmo caminho que o arquivo
          percorre: `escrever-grade` lê `estilo.formato` da MESMA marcação. Sem
          isto, "R$" pintado na tela sairia como número cru no Excel, e as duas
          pontas do mesmo dado discordariam.
        */
        const marcacao = marcacaoDaColuna(coluna);
        const formatoDaCelula: FormatoGrade = marcacao?.formato ?? c.formato;

        /*
          A ÚLTIMA CÉLULA DE UM FECHAMENTO NÃO SE DIGITA.

          Subtotal e total são resultado, não entrada — pela mesma razão que a
          célula calculada não é: um total que se pode sobrescrever à mão
          deixa de ser um total, e passa a ser mais um número na linha.
        */
        const ehEditavel = editavel && !calculada && !total && !subtotal;
        const selecionada =
          selecao?.tipo === "celula" &&
          selecao.linha === indice &&
          selecao.coluna === j;
        const naLinhaEscolhida = selecao?.tipo === "linha" && selecao.linha === indice;

        return (
          <Celula
            key={c.chave}
            coluna={{ ...c, formato: formatoDaCelula }}
            colunaNumero={coluna}
            largura={larguraDaColuna(c)}
            fundo={fundo}
            celula={celula}
            primeiraColunaFixa={primeiraColunaFixa}
            primeira={j === 0}
            calculada={calculada}
            editavel={ehEditavel}
            selecionada={selecionada}
            naLinhaEscolhida={naLinhaEscolhida}
            marcacao={estiloEmCss(marcacao)}
            onSelecionar={() => definirSelecao?.({ tipo: "celula", linha: indice, coluna: j })}
            onConfirmar={(valor) => aoEditar?.(chaveDe(endereco(numero, coluna)), valor)}
            onMover={(passo) =>
              definirSelecao?.({ tipo: "celula", linha: Math.max(0, indice + passo), coluna: j })
            }
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
  naLinhaEscolhida,
  marcacao,
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
  /** A linha inteira está escolhida — o realce é mais discreto que o da célula. */
  naLinhaEscolhida: boolean;
  /** O que a Érika pintou nesta célula, já em CSS. `undefined` é "não mexe". */
  marcacao: React.CSSProperties | undefined;
  onSelecionar: () => void;
  onConfirmar: (valor: CelulaGrade) => void;
  onMover: (passo: number) => void;
}) {
  const [digitando, definirDigitando] = useState<string | null>(null);
  const campo = useRef<HTMLInputElement>(null);

  /*
    COMO A EDIÇÃO FOI ABERTA — e isto decide o que acontece com o texto que já
    estava na célula.

    Duas portas levam à mesma edição, e no Excel elas fazem coisas diferentes:
    o clique SUBSTITUI (quer digitar por cima) e o F2/Enter EDITA NO LUGAR (quer
    corrigir uma letra). Tratar as duas igual faria a segunda apagar o valor que
    ela abriu justamente para corrigir.
  */
  const [substituir, definirSubstituir] = useState(true);

  const editando = digitando !== null;

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ A DEPENDÊNCIA DESTE EFEITO ERA `digitando` — E ISSO QUEBRAVA A        │
    │ DIGITAÇÃO INTEIRA.                                                    │
    │                                                                      │
    │ `digitando` é o TEXTO da célula. Ele muda a cada tecla: "" → "B" →    │
    │ "BA" → "BAT". Com ele na lista de dependências, o efeito rodava a     │
    │ cada caractere — e o efeito faz `focus()` e `select()`.               │
    │                                                                      │
    │ O resultado era o defeito relatado, e ele é exatamente este:          │
    │                                                                      │
    │   digita "B"  → o valor vira "B", o efeito roda, `.select()` marca    │
    │                 todo o "B"                                            │
    │   digita "A"  → o navegador SUBSTITUI a seleção: o valor vira "A", e   │
    │                 o "B" some                                            │
    │   digita "T"  → idem. O valor vira "T".                               │
    │                                                                      │
    │ Ou seja: nunca dava para escrever BATATA — só se escrevia UMA letra,   │
    │ sempre a última. Foi provado por execução: com a dependência antiga,   │
    │ escrever B-A-T-A-T-A produz o texto "A".                              │
    │                                                                      │
    │ Não era lentidão, não era o `onChange`, não era o pai re-renderizando  │
    │ nem a chave do React: era este efeito, que existe para ABRIR a edição, │
    │ reabrindo-a a cada tecla.                                            │
    │                                                                      │
    │ A dependência certa é a PERGUNTA "está editando?", e não o conteúdo.  │
    │ Ela só muda duas vezes por sessão de edição — ao abrir e ao fechar.    │
    │                                                                      │
    │ ┌──────────────────────────────────────────────────────────────────┐ │
    │ │ E O `.select()` NÃO SAIU: ELE VIROU CONDICIONAL.                 │ │
    │ │                                                                  │ │
    │ │ Tirá-lo faria o clique deixar de substituir, e quem clica numa     │ │
    │ │ célula com "BATATA" e digita "CEBOLA" passaria a escrever          │ │
    │ │ "BATATACEBOLA". O gesto de substituir é de planilha, e é o certo    │ │
    │ │ para quem clicou.                                                 │ │
    │ │                                                                  │ │
    │ │ Quem quer CORRIGIR usa F2 ou Enter: aí o cursor vai para o fim do  │ │
    │ │ texto, sem selecionar nada, e dá para acrescentar uma letra.       │ │
    │ │ É a mesma divisão do Excel, e é o que o briefing pede quando diz   │ │
    │ │ "NÃO selecionar todo o texto novamente".                          │ │
    │ └──────────────────────────────────────────────────────────────────┘ │
    └──────────────────────────────────────────────────────────────────────┘
  */
  useEffect(() => {
    if (!editando) return;
    const campoAtual = campo.current;
    if (!campoAtual) return;

    campoAtual.focus();
    if (substituir) {
      campoAtual.select();
    } else {
      const fim = campoAtual.value.length;
      campoAtual.setSelectionRange(fim, fim);
    }
  }, [editando, substituir]);

  const exibicao = textoDaCelula(ausente(celula), coluna.formato);

  /** O texto inicial do editor: o valor cru quando existe, vazio quando é ausência. */
  const valorCru =
    celula instanceof Date
      ? textoDaCelula(celula, coluna.formato)
      : celula === null || celula === undefined
        ? ""
        : String(celula);

  /** O que se digitou vira número quando a coluna é numérica e o texto é número. */
  /** Abre a edição. `porCima` é o clique (substitui); `noLugar` é F2/Enter. */
  function abrirEdicao(porCima: boolean) {
    definirSubstituir(porCima);
    definirDigitando(valorCru);
  }

  function interpretar(texto: string): CelulaGrade {
    const limpo = texto.trim();
    if (limpo === "") return null;
    if (!ehNumerico(coluna.formato)) return limpo;

    /*
      ┌────────────────────────────────────────────────────────────────────┐
      │ A COLUNA DE PESO ACEITA A UNIDADE ESCRITA                          │
      │                                                                    │
      │ Ela digita "100 g" tanto quanto digita "0,100" — as duas querem    │
      │ dizer a mesma coisa, e a coluna é em QUILOS. Sem esta linha, "100 g"│
      │ seria recusado e o texto ficaria na célula como está: uma célula    │
      │ de peso com texto dentro, que não soma e não formata.              │
      │                                                                    │
      │ `medidaDigitada` devolve três respostas, e as três têm destinos    │
      │ diferentes:                                                        │
      │                                                                    │
      │   número     — "100 g" vira 0,1; "1,5 kg" vira 1,5                 │
      │   null       — vazio, ou seja, a célula fica vazia                 │
      │   undefined  — "não sei o que é isto". O TEXTO ORIGINAL fica na     │
      │                célula, para ela ver o que digitou e corrigir.       │
      │                                                                    │
      │ É por isso que o `undefined` não vira `null`: apagar o que ela      │
      │ digitou sem entender seria a pior das três respostas.              │
      └────────────────────────────────────────────────────────────────────┘
    */
    if (coluna.formato === "peso") {
      const medida = medidaDigitada(limpo);
      if (medida !== undefined) return medida;
      return limpo;
    }

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

  /*
    A MARCAÇÃO VENCE O FUNDO DO MODELO, E VENCE POR ESTILO INLINE.

    O fundo de uma linha vem de classe Tailwind (a faixa alternada, o verde do
    total), e classe não se sobrepõe a `style`. Como a cor escolhida pela Érika
    precisa vencer — senão pintar uma linha alternada não mudaria nada, e o
    gesto pareceria quebrado —, a marcação entra inline.

    A EXCEÇÃO É O REALCE DE SELEÇÃO, que fica FORA da marcação: ele é cromo da
    tela, não conteúdo, e não deve viajar para o arquivo. Por isso ele é
    `outline` e não `background`: os dois convivem, e uma célula amarela
    selecionada continua amarela com o contorno por cima.
  */
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
    naLinhaEscolhida && !selecionada && "outline outline-1 -outline-offset-1 outline-[rgba(107,122,70,0.5)]",
    primeiraColunaFixa && primeira && cn("sticky left-0 z-[1]", fundo)
  );

  // ── O modo de digitação ───────────────────────────────────────────────
  if (digitando !== null) {
    return (
      <td
        style={{ ...marcacao, minWidth: `${largura}px`, width: `${largura}px` }}
        className={cn(classes, "p-0")}
      >
        <input
          ref={campo}
          value={digitando}
          onChange={(e) => definirDigitando(e.target.value)}
          /*
            ESTE ATRIBUTO É O QUE DIZ AO AMBIENTE QUE UMA CÉLULA ESTÁ ABERTA.

            Enquanto ela digita, o Ctrl+Z é do NAVEGADOR — desfaz o texto que
            está no campo, que é o que se espera de um campo de texto. O
            desfazer da PLANILHA só faz sentido depois que a edição foi
            confirmada, porque é aí que a operação entra no histórico.

            O ambiente lê este atributo no ouvinte de teclado (ver `ambiente.tsx`)
            em vez de manter um estado paralelo de "tem alguém digitando": quem
            sabe a verdade é o DOM, e perguntar a ele é uma resposta só, sempre
            atual.
          */
          data-celula-aberta
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
      <td
        style={{ ...marcacao, minWidth: `${largura}px` }}
        className={classes}
        title={tituloDaCelula(calculada)}
      >
        {exibicao}
      </td>
    );
  }

  // ── A célula de entrada ───────────────────────────────────────────────
  return (
    <td
      style={{ ...marcacao, minWidth: `${largura}px` }}
      className={cn(classes, "cursor-cell")}
      tabIndex={-1}
      title={tituloDaCelula(false)}
      onClick={() => {
        onSelecionar();
        abrirEdicao(true);
      }}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== "F2") return;
        e.preventDefault();
        abrirEdicao(false);
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
 * A MARCAÇÃO, TRADUZIDA PARA CSS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O NOME DA PROPRIEDADE É ESCRITO À MÃO, E POR QUE ISSO É BOM   │
 * │                                                                      │
 * │ `background` e `color` não viram composição dinâmica de classe do     │
 * │ Tailwind — o compilador não enxerga um valor que só existe em tempo   │
 * │ de execução. A alternativa seria `style` inline, e é ele mesmo que    │
 * │ resolve: a cor escolhida pela Érika é um dado, e dado que vira estilo  │
 * │ inline é o caso em que o inline é a ferramenta certa.                  │
 * │                                                                      │
 * │ O ALINHAMENTO AQUI É `vertical-align`, e não `text-align`: o           │
 * │ `text-align` já vem das classes, que o derivam do FORMATO da célula.   │
 * │ Escrever `text-align` aqui apagaria aquele — e uma coluna de dinheiro  │
 * │ marcada de amarelo passaria a alinhar à esquerda, que é um defeito     │
 * │ visível e inexplicável para quem só queria pintar a célula.            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function estiloEmCss(estilo: EstiloGrade | undefined): React.CSSProperties | undefined {
  if (estilo === undefined) return undefined;
  const css: React.CSSProperties = {};
  if (estilo.fundo !== undefined) css.background = estilo.fundo;
  if (estilo.texto !== undefined) css.color = estilo.texto;
  if (estilo.negrito === true) css.fontWeight = 700;
  if (estilo.alinhamento !== undefined) css.textAlign = estilo.alinhamento === "esq" ? "left" : estilo.alinhamento === "dir" ? "right" : "center";
  return css;
}

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
