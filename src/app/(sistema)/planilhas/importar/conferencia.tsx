"use client";

import { Botao } from "@/components/ui/botao";
import { cn } from "@/lib/utils/cn";
import { numero, valorEmReais } from "@/lib/dados";
import {
  ROTULO_DO_NIVEL,
  type Aviso,
  type Conferencia,
  type LinhaConferida,
  type LinhaOriginal,
  type Nivel,
} from "@/lib/planilhas/importacao/validar";
import type { CorrecaoDeTexto } from "@/lib/planilhas/importacao/para-ficha";

/**
 * A TELA DE CONFERÊNCIA — a ETAPA 4 do fluxo do PDF.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA É, EM UMA FRASE                                      │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Nenhum dado duvidoso deve ser tratado como verdade               │ │
 * │ │  silenciosamente."                                                │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ A grade abaixo tem as quatro colunas que o briefing pede, e elas são   │
 * │ a resposta literal a ele: DADO | VALOR LIDO | STATUS | AÇÃO.           │
 * │                                                                      │
 * │   · DADO NO DOCUMENTO  o texto COMO ESTAVA no PDF. É a prova, e não    │
 * │                        se edita — se ela pudesse reescrevê-lo, não     │
 * │                        haveria mais com o que comparar.               │
 * │   · VALOR LIDO         o que o sistema entendeu. É aqui que um         │
 * │                        "1.500" aparece com as suas duas leituras.      │
 * │   · STATUS             Confirmado, Atenção ou Precisa revisar.         │
 * │   · O QUE FAZER        os três campos editáveis, e o motivo de cada    │
 * │                        aviso com a ação que o resolve.                │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ A SEPARAÇÃO ENTRE AS DUAS PRIMEIRAS COLUNAS É O QUE PERMITE ELA    │ │
 * │ │ DISCORDAR DO SISTEMA.                                             │ │
 * │ │                                                                  │ │
 * │ │ Se fossem uma só, ela veria um número já convertido — sem saber de │ │
 * │ │ que texto ele veio, nem por que o sistema escolheu aquele. Com as  │ │
 * │ │ duas, ela lê "o documento dizia 1.500; o sistema entendeu mil e    │ │
 * │ │ quinhentos; eu sei que era um e meio" e escreve a correção.        │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA TELA NÃO CALCULA E NÃO GUARDA ESTADO                            │
 * │                                                                      │
 * │ Ela recebe a conferência pronta e a lista de correções, e devolve      │
 * │ eventos. Quem guarda o estado é a página — e é isso que faz a          │
 * │ correção voltar pela normalização e pela validação em vez de pintar    │
 * │ por cima do resultado: a página reaplica as correções no documento     │
 * │ lido e roda `conferirDocumento` outra vez. Ver `aplicarCorrecoes`.     │
 * │                                                                      │
 * │ Nenhuma conta acontece aqui. O custo aparece na PRÉVIA, depois, e sai  │
 * │ do motor de custos: "NÃO criar segunda calculadora".                   │
 * │                                                                      │
 * │ E ela não julga a receita: nenhum aviso diz que um peso é grande ou    │
 * │ pequeno demais para o prato. O único teste numérico é de               │
 * │ PLAUSIBILIDADE, e ele pergunta se o número é possível — não se ele é   │
 * │ bom. "Não inventar julgamento gastronômico."                           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE É UMA TABELA, E NÃO UMA LISTA DE CARTÕES                     │
 * │                                                                      │
 * │ É a mesma exigência da planilha: "não transformar linhas em cartões".  │
 * │ Doze ingredientes em doze cartões ocupam três telas, e a comparação    │
 * │ entre eles — que é o trabalho de conferir — deixa de ser possível.     │
 * │ Numa tabela as doze cabem juntas, e a que está marcada salta aos olhos │
 * │ por contraste com as onze que estão bem.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * COMO A PÁGINA É AVISADA DE UMA CORREÇÃO.
 *
 * O segundo parâmetro é o que permite a MESMA chamada servir às duas
 * operações: corrigir um campo numa linha, e aplicar a mesma correção nas
 * outras que ainda dizem o texto antigo. Ver `OfertaDeRepetir`.
 *
 * Sem ele seriam duas props, e as duas fariam quase a mesma coisa — que é a
 * definição de um lugar onde alguém vai corrigir só uma no dia em que mexer.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A CORREÇÃO CARREGA SÓ O TEXTO NOVO — E O ANTIGO VEM DE `originais`   │
 * │                                                                      │
 * │ A tentação era a correção guardar também o texto que havia antes,      │
 * │ para a oferta de "aplicar nas outras" saber o que procurar. Ela foi    │
 * │ removida, e o motivo está escrito por extenso em `CorrecaoDeTexto`      │
 * │ (`./para-ficha.ts`). Em uma linha: duas cópias da mesma verdade         │
 * │ divergem — e aqui divergiriam logo na segunda correção do mesmo campo.  │
 * │                                                                      │
 * │ O texto original já existe, e é o `LinhaOriginal` que a validação       │
 * │ entrega ao lado da conferência. Esta tela o recebe pronto, procura      │
 * │ nele, e não guarda cópia nenhuma.                                      │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ POR QUE A COLUNA DE PROVA TAMBÉM LÊ DELE                          │ │
 * │ │                                                                  │ │
 * │ │ A conferência é montada sobre o documento JÁ CORRIGIDO — é assim  │ │
 * │ │ que o texto novo ganha os avisos dele. Efeito colateral:           │ │
 * │ │ `linha[campo]` é o texto de DEPOIS. A coluna que se chama "o      │ │
 * │ │ documento dizia" mostraria a correção dela, e a prova se apagaria  │ │
 * │ │ no instante em que ela discordasse do sistema — que é exatamente   │ │
 * │ │ quando ela mais precisa da prova.                                 │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export type AoCorrigir = (correcao: CorrecaoDeTexto, alvos?: readonly number[]) => void;

const COR_DO_NIVEL: Record<Nivel, string> = {
  OK: "var(--color-medio)",
  ATENCAO: "var(--color-dourado)",
  REVISAR: "#991b1b",
};

/** A chave de uma correção. É a mesma que a página usa para achá-la de volta. */
export function chaveDaCorrecao(ordem: number, campo: CorrecaoDeTexto["campo"]): string {
  return `${ordem}:${campo}`;
}

export function TelaDeConferencia({
  conferencia,
  correcoes,
  aoCorrigir,
  aoRemover,
  aoAdicionar,
}: {
  conferencia: Conferencia;
  correcoes: readonly CorrecaoDeTexto[];
  aoCorrigir: AoCorrigir;
  aoRemover: (ordem: number) => void;
  aoAdicionar: () => void;
}) {
  const { linhas, resumo } = conferencia;
  const porChave = new Map(correcoes.map((c) => [chaveDaCorrecao(c.ordem, c.campo), c]));

  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha-forte)] bg-[var(--superficie-solida)]">
      {/*
        O RESUMO VEM ANTES DA TABELA, E É O QUE DECIDE O TRABALHO.

        "12 linhas, 1 para revisar" é o que faz ela escolher entre conferir
        tudo ou olhar só a marcada. A contagem é de LINHAS e não de avisos:
        doze avisos podem estar todos numa linha, e esse número não diria nada.
      */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[var(--linha)] px-4 py-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <p className="text-[0.875rem] text-[var(--tinta)]">
            {resumo.total === 1 ? "1 linha lida" : `${resumo.total} linhas lidas`}
          </p>
          {resumo.atencao > 0 ? (
            <p className="text-[0.8125rem] text-[var(--tinta-suave)]">
              {resumo.atencao} {resumo.atencao === 1 ? "com dado faltando" : "com dados faltando"}
            </p>
          ) : null}
          {resumo.revisar > 0 ? (
            <p className="text-[0.8125rem] font-medium text-[#991b1b]">
              {resumo.revisar} para revisar
            </p>
          ) : null}
        </div>

        <Botao variante="linha" tamanho="sm" onClick={aoAdicionar}>
          + Acrescentar linha
        </Botao>
      </div>

      {/*
        A GRADE. O scroll horizontal é DESTA CAIXA, e não da página.

        É a mesma regra da planilha: em tela estreita, a tabela rola dentro do
        próprio quadro. Deixar a página inteira rolar de lado empurraria a
        barra superior e as abas para fora da vista junto com ela.
      */}
      <div className="w-full overflow-auto overscroll-x-contain" style={{ maxHeight: 560 }}>
        <table className="w-full min-w-[68rem] border-collapse text-[0.8125rem]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[var(--superficie-areia)]">
              <Cabecalho largura={46}>LINHA</Cabecalho>
              <Cabecalho largura={210}>DADO NO DOCUMENTO</Cabecalho>
              <Cabecalho largura={200}>VALOR LIDO</Cabecalho>
              <Cabecalho largura={132}>STATUS</Cabecalho>
              <Cabecalho>O QUE FAZER</Cabecalho>
              <Cabecalho largura={38}> </Cabecalho>
            </tr>
          </thead>
          <tbody>
            {linhas.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[var(--tinta-suave)]">
                  Nenhuma linha para conferir. Use{" "}
                  <span className="font-medium">Acrescentar linha</span> para digitar os
                  ingredientes à mão.
                </td>
              </tr>
            ) : (
              linhas.map((linha) => (
                <LinhaDaLinha
                  key={linha.ordem}
                  linha={linha}
                  original={conferencia.originais.get(linha.ordem) ?? null}
                  originais={conferencia.originais}
                  porChave={porChave}
                  aoCorrigir={aoCorrigir}
                  aoRemover={aoRemover}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/*
        O RODAPÉ EXPLICA A CONSEQUÊNCIA ANTES DE ELA CLICAR EM GERAR.

        O botão de gerar não é escondido quando há linhas para revisar — seria
        paternalismo, e ela é quem decide se o que sobrou dá para trabalhar. O
        que o rodapé faz é dizer, ANTES, o que vai acontecer com elas: ficam de
        fora do custo, com o motivo escrito. É a mesma regra da ficha digitada
        à mão — um item sem preço não entra como zero, ele sai da conta.
      */}
      <div className="border-t border-[var(--linha)] px-4 py-3">
        <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          {resumo.revisar > 0 ? (
            <>
              As {resumo.revisar} {resumo.revisar === 1 ? "linha" : "linhas"} marcadas como{" "}
              <span className="font-medium text-[#991b1b]">precisa revisar</span> ficam{" "}
              <span className="font-medium text-[var(--tinta)]">fora do custo</span> — o valor
              delas não entra como zero, e o motivo aparece na coluna SITUAÇÃO da planilha. O
              custo total só sai fechado quando não há nenhuma.
            </>
          ) : resumo.atencao === 0 ? (
            "Todas as linhas passaram. O custo sai fechado na prévia."
          ) : (
            "As linhas com dado faltando entram na conta com o que têm. O que faltar aparece como —, e não como zero."
          )}
        </p>
      </div>
    </div>
  );
}

function Cabecalho({ children, largura }: { children: React.ReactNode; largura?: number }) {
  return (
    <th
      scope="col"
      style={largura === undefined ? undefined : { width: largura }}
      className={cn(
        "border-b border-[var(--linha-forte)] px-3 py-2 text-left",
        "text-[0.625rem] font-semibold tracking-[0.1em] uppercase text-[var(--tinta-fraca)]",
      )}
    >
      {children}
    </th>
  );
}

/**
 * UMA LINHA DA CONFERÊNCIA.
 *
 * As três caixas de correção ficam na coluna O QUE FAZER, e não nas duas
 * anteriores, por um motivo que é o coração desta tela: as anteriores são o
 * REGISTRO do que o documento dizia e do que o sistema entendeu. Editar lá
 * apagaria a prova, e ela não teria mais como comparar o que corrigiu com o
 * que estava escrito.
 */
function LinhaDaLinha({
  linha,
  original,
  originais,
  porChave,
  aoCorrigir,
  aoRemover,
}: {
  linha: LinhaConferida;
  /** O que o documento dizia nesta linha, antes de qualquer correção. */
  original: LinhaOriginal | null;
  /** O mesmo, para todas as linhas — é de onde a oferta de repetir procura. */
  originais: ReadonlyMap<number, LinhaOriginal>;
  porChave: ReadonlyMap<string, CorrecaoDeTexto>;
  aoCorrigir: AoCorrigir;
  aoRemover: (ordem: number) => void;
}) {
  const cor = COR_DO_NIVEL[linha.nivel];

  /**
   * O que a caixa mostra: o que ela digitou; sem correção, o que o documento
   * dizia.
   *
   * A correção vem primeiro porque ela é a versão mais recente do que está
   * na tela — o texto que ela acabou de digitar. `linha[campo]` responde pelo
   * resto: quando não há correção nenhuma naquele campo, ele é o texto que o
   * documento trouxe, já passado pela normalização.
   *
   * Note que esta é a ÚNICA leitura da tela que usa `linha[campo]`. A coluna
   * de prova e a oferta de repetir leem `original` — o texto do documento —,
   * e não este. A distinção está explicada no bloco acima de `LinhaDaLinha`.
   */
  const valorDoCampo = (campo: CorrecaoDeTexto["campo"]): string => {
    const correcao = porChave.get(chaveDaCorrecao(linha.ordem, campo));
    if (correcao !== undefined) return correcao.texto;
    return linha[campo] ?? "";
  };

  const corrigir = (campo: CorrecaoDeTexto["campo"], texto: string): void => {
    aoCorrigir({ ordem: linha.ordem, campo, texto });
  };

  return (
    <tr className="border-b border-[var(--linha)] align-top last:border-b-0">
      {/* O número da linha do documento — o mesmo que ela vê no PDF ao lado. */}
      <td className="px-3 py-3 text-[0.75rem] tabular-nums text-[var(--tinta-fraca)]">
        {linha.ordem}
      </td>

      <td className="px-3 py-3">
        <CampoDeProva rotulo="Ingrediente" texto={original?.descricao ?? null} />
        <CampoDeProva rotulo="Quantidade" texto={original?.quantidade ?? null} />
        <CampoDeProva rotulo="Preço pago" texto={original?.valor ?? null} />

        {linha.manual === true ? (
          <p className="mt-1.5 text-[0.6875rem] tracking-[0.06em] uppercase text-[var(--color-oliva)]">
            criada à mão
          </p>
        ) : null}
      </td>

      <td className="px-3 py-3">
        <CampoDeLeitura
          rotulo="Quantidade"
          texto={textoDaQuantidade(linha)}
          ok={linha.leituraQuantidade.estado === "OK"}
        />
        <CampoDeLeitura
          rotulo="Preço pago"
          texto={textoDoDinheiro(linha)}
          ok={linha.leituraValor.estado === "OK"}
        />
      </td>

      <td className="px-3 py-3">
        <span
          className="inline-flex items-center gap-1.5 text-[0.75rem] font-medium"
          style={{ color: cor }}
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: cor }} />
          {ROTULO_DO_NIVEL[linha.nivel]}
        </span>
      </td>

      {/*
        A AÇÃO — as três caixas, os avisos, e a oferta de repetir a correção.
      */}
      <td className="px-3 py-3">
        <div className="grid gap-1.5">
          {/*
            A OFERTA DE REPETIR VEM ANTES DO ERRO, E ISSO É A ORDEM QUE IMPORTA.

            A correção em série é o fluxo PRINCIPAL da conferência, não uma
            conveniência escondida no fim: cinco linhas com o mesmo "1.500" são
            um problema só, e resolvê-las uma a uma é o que faria ela desistir
            de conferir. Posta no fim, depois de cinco avisos em vermelho, a
            oferta chegaria tarde em todas as linhas — menos na última, que é
            justamente a que não tem mais nenhuma para oferecer.
          */}
          <OfertaDeRepetir
            linha={linha}
            original={original}
            originais={originais}
            porChave={porChave}
            aoCorrigir={aoCorrigir}
          />

          <CaixaDeCorrecao
            rotulo="Ingrediente"
            valor={valorDoCampo("descricao")}
            corrigida={porChave.has(chaveDaCorrecao(linha.ordem, "descricao"))}
            aoMudar={(t) => corrigir("descricao", t)}
          />
          <div className="grid grid-cols-2 gap-1.5">
            <CaixaDeCorrecao
              rotulo="Quantidade"
              valor={valorDoCampo("quantidade")}
              corrigida={porChave.has(chaveDaCorrecao(linha.ordem, "quantidade"))}
              aoMudar={(t) => corrigir("quantidade", t)}
            />
            <CaixaDeCorrecao
              rotulo="Preço pago"
              valor={valorDoCampo("valor")}
              corrigida={porChave.has(chaveDaCorrecao(linha.ordem, "valor"))}
              aoMudar={(t) => corrigir("valor", t)}
            />
          </div>

          {/*
            OS AVISOS, DO MAIS GRAVE PARA O MENOS.

            A mensagem e a ação andam juntas: "Esta linha não traz a quantidade
            usada" sozinho faria ela procurar o que fazer. Com "Digite a
            quantidade se ela estiver na ficha", a linha vira uma tarefa.
          */}
          {linha.avisos.length > 0 ? (
            <ul className="mt-1 grid gap-1">
              {[...linha.avisos]
                .sort((a, b) => ordemDoNivel(b.nivel) - ordemDoNivel(a.nivel))
                .map((aviso, i) => (
                  <ItemDeAviso key={`${aviso.codigo}-${i}`} aviso={aviso} />
                ))}
            </ul>
          ) : null}
        </div>
      </td>

      <td className="px-2 py-3">
        <button
          type="button"
          onClick={() => aoRemover(linha.ordem)}
          title="Tirar esta linha do custo"
          aria-label={`Tirar a linha ${linha.ordem} do custo`}
          className={cn(
            "grid h-6 w-6 place-items-center rounded-[var(--raio-sm)] text-[var(--tinta-fraca)]",
            "transition-colors hover:bg-[rgba(153,27,27,0.08)] hover:text-[#991b1b]",
          )}
        >
          ×
        </button>
      </td>
    </tr>
  );
}

function ordemDoNivel(n: Nivel): number {
  return n === "REVISAR" ? 2 : n === "ATENCAO" ? 1 : 0;
}

/**
 * UMA LINHA DA COLUNA DE PROVA.
 *
 * `null` vira "—" e nada mais. É a mesma regra da planilha inteira: ausência
 * aparece como traço, nunca como zero nem como vazio — um campo em branco
 * deixa a dúvida de se o dado não existe ou se a tela não o mostrou.
 */
function CampoDeProva({ rotulo, texto }: { rotulo: string; texto: string | null }) {
  return (
    <p className="flex gap-2 text-[var(--tinta)]">
      <span className="w-[5.5rem] shrink-0 text-[0.6875rem] tracking-[0.06em] uppercase text-[var(--tinta-fraca)]">
        {rotulo}
      </span>
      <span className={cn("min-w-0 break-words", texto === null && "text-[var(--tinta-fraca)]")}>
        {texto ?? "—"}
      </span>
    </p>
  );
}

/**
 * O VALOR LIDO, COM A AMBIGUIDADE À MOSTRA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A AMBIGUIDADE APARECE COM OS DOIS NÚMEROS                     │
 * │                                                                      │
 * │ "1.500" tem duas leituras: mil e quinhentos, ou um vírgula cinco. A    │
 * │ diferença é de mil vezes, e ela é a única que pode decidir — porque    │
 * │ só ela sabe se comprou um quilo e meio de farinha ou uma tonelada.     │
 * │                                                                      │
 * │ As duas leituras vêm prontas de `normalizarNumero`, já escritas em      │
 * │ português. Reescrevê-las aqui criaria uma segunda redação da mesma      │
 * │ dúvida, e as duas divergiriam no dia em que uma mudasse.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function CampoDeLeitura({ rotulo, texto, ok }: { rotulo: string; texto: string; ok: boolean }) {
  return (
    <p className="flex gap-2">
      <span className="w-[5.5rem] shrink-0 text-[0.6875rem] tracking-[0.06em] uppercase text-[var(--tinta-fraca)]">
        {rotulo}
      </span>
      <span
        className={cn(
          "min-w-0 tabular-nums",
          ok ? "text-[var(--tinta)]" : "text-[var(--tinta-suave)]",
        )}
      >
        {texto}
      </span>
    </p>
  );
}

/** A quantidade lida, escrita. */
function textoDaQuantidade(linha: LinhaConferida): string {
  const leitura = linha.leituraQuantidade;
  switch (leitura.estado) {
    case "OK":
      return `${numero(leitura.valor.valor, 3)}${
        leitura.valor.unidade === null ? "" : ` ${leitura.valor.unidade}`
      }`;
    case "AMBIGUO":
      return leitura.leituras.join(" ou ");
    case "INVALIDO":
      return "não é número";
    case "VAZIO":
      return "—";
  }
}

/** O preço lido, escrito. */
function textoDoDinheiro(linha: LinhaConferida): string {
  const leitura = linha.leituraValor;
  switch (leitura.estado) {
    case "OK":
      return valorEmReais(leitura.valor.valor);
    case "AMBIGUO":
      return leitura.leituras.join(" ou ");
    case "INVALIDO":
      return "não é valor";
    case "VAZIO":
      return "—";
  }
}

function ItemDeAviso({ aviso }: { aviso: Aviso }) {
  return (
    <li className="text-[0.75rem] leading-snug">
      <span style={{ color: COR_DO_NIVEL[aviso.nivel] }}>{aviso.mensagem}</span>
      <span className="text-[var(--tinta-fraca)]"> {aviso.acao}</span>
    </li>
  );
}

/**
 * UMA CAIXA DE CORREÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO É UM FORMULÁRIO                                          │
 * │                                                                      │
 * │ O briefing pede edição direta: clicar, mudar, seguir. Este componente  │
 * │ é isso — uma caixa por campo, alinhada na grade, editada no lugar.     │
 * │ Não há botão de salvar, não há modal, não há passo de confirmação:     │
 * │ quem aplica a mudança é a página, a cada tecla.                       │
 * │                                                                      │
 * │ A borda muda quando o campo tem correção. É o "diferenciar entrada     │
 * │ manual de valor calculado" do briefing, aplicado ao que existe aqui:   │
 * │ a coluna VALOR LIDO é do sistema e é só leitura; esta é dela.          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function CaixaDeCorrecao({
  rotulo,
  valor,
  corrigida,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  corrigida: boolean;
  aoMudar: (texto: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="sr-only">{rotulo}</span>
      <input
        type="text"
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        placeholder={rotulo}
        className={cn(
          "h-7 w-full min-w-[6rem] rounded-[var(--raio-sm)] border px-2",
          "text-[0.8125rem] text-[var(--tinta)] placeholder:text-[var(--tinta-fraca)]",
          "focus:border-[var(--color-medio)] focus:outline-none",
          corrigida
            ? "border-[var(--color-medio)] bg-[rgba(29,82,54,0.05)]"
            : "border-[var(--linha-forte)] bg-[var(--superficie-solida)]",
        )}
      />
    </label>
  );
}

/**
 * A OFERTA DE REPETIR A CORREÇÃO NAS OUTRAS LINHAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM BOTÃO, E NÃO UMA CORREÇÃO AUTOMÁTICA                │
 * │                                                                      │
 * │ A leitura automática erra em série: um separador mal lido repete o     │
 * │ mesmo defeito em todas as linhas que traziam o mesmo número. Corrigir  │
 * │ "1.500" cinco vezes é o que faz a conferência parecer interminável.    │
 * │                                                                      │
 * │ E é por isso que a oferta é EXPLÍCITA. Reescrever sozinha todas as     │
 * │ linhas com o mesmo texto seria decidir por ela que os cinco "1.500"    │
 * │ são o mesmo erro — e o quinto pode perfeitamente ser mil e quinhentos  │
 * │ de verdade. A tela diz quantas são, mostra o texto antigo, e deixa a   │
 * │ decisão onde ela pertence.                                            │
 * │                                                                      │
 * │ A lista de alvos exclui as linhas que ELA JÁ corrigiu: reescrever um   │
 * │ valor que ela acabou de conferir seria desfazer o trabalho dela, e a   │
 * │ contagem prometida estaria contando a própria linha corrigida.         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function OfertaDeRepetir({
  linha,
  original,
  originais,
  porChave,
  aoCorrigir,
}: {
  linha: LinhaConferida;
  original: LinhaOriginal | null;
  originais: ReadonlyMap<number, LinhaOriginal>;
  porChave: ReadonlyMap<string, CorrecaoDeTexto>;
  aoCorrigir: AoCorrigir;
}) {
  const ofertas: React.ReactNode[] = [];

  for (const campo of ["descricao", "quantidade", "valor"] as const) {
    const correcao = porChave.get(chaveDaCorrecao(linha.ordem, campo));
    if (correcao === undefined) continue;

    /*
      ┌──────────────────────────────────────────────────────────────────┐
      │ O DEFEITO SE PROCURA NO TEXTO DO DOCUMENTO, E NÃO NO TEXTO ATUAL  │
      │                                                                  │
      │ O que se repete é a LEITURA ERRADA: o mesmo "1.500" mal separado, │
      │ em cinco linhas. Esse texto mora em `originais` — o que o PDF     │
      │ dizia —, e é de lá que a busca tem de sair.                       │
      │                                                                  │
      │ Procurar em `linha[campo]` acharia o texto JÁ CORRIGIDO, e o      │
      │ resultado seria o pior possível: a oferta não encontraria nada    │
      │ (nenhuma outra linha diz "1,50") ou, pior, ofereceria repetir     │
      │ sobre as que ela já conferiu — reescrevendo justamente o valor    │
      │ que ela acabou de decidir.                                        │
      └──────────────────────────────────────────────────────────────────┘
    */
    const anterior = original?.[campo] ?? null;
    if (anterior === null || anterior.trim() === "") continue;

    /*
      AS OUTRAS LINHAS QUE AINDA CARREGAM O MESMO TEXTO NO DOCUMENTO.

      Não há lista de exceções para as que ela já corrigiu, e não é preciso:
      quem já foi corrigida continua com o texto original em `originais` — é
      o que torna o mapa útil —, mas já tem uma correção em `porChave`, e é
      essa que a desqualifica. Sem esta linha, ela veria a oferta de repetir
      sobre as linhas que acabou de conferir.
    */
    const alvos: number[] = [];
    for (const [ordem, outra] of originais) {
      if (ordem === linha.ordem) continue;
      if ((outra[campo] ?? "") !== anterior) continue;
      if (porChave.has(chaveDaCorrecao(ordem, campo))) continue;
      alvos.push(ordem);
    }
    alvos.sort((a, b) => a - b);

    if (alvos.length === 0) continue;

    ofertas.push(
      <button
        key={campo}
        type="button"
        onClick={() => aoCorrigir(correcao, alvos)}
        className={cn(
          "mt-0.5 w-fit rounded-[var(--raio-sm)] px-1.5 py-0.5 text-left",
          "text-[0.6875rem] text-[var(--color-medio)] underline underline-offset-2",
          "hover:bg-[rgba(29,82,54,0.07)]",
        )}
      >
        Aplicar também nas outras {alvos.length} que diziam “{anterior}”
      </button>,
    );
  }

  if (ofertas.length === 0) return null;
  return <div className="grid gap-0.5">{ofertas}</div>;
}
