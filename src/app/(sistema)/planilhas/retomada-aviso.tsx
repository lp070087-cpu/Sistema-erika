import { Botao } from "@/components/ui/botao";
import { Etiqueta } from "@/components/ui/indicador";
import { haQuantoTempo, type Retomada } from "@/lib/planilhas/retomada";

/**
 * A NOTA DA RETOMADA — a parte visível da decisão 4.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ELA DIZ, E AS TRÊS COISAS QUE ELA NÃO PODE DIZER                │
 * │                                                                      │
 * │ DIZ: "o trabalho desta aba voltou", de qual planilha ele é, e há       │
 * │ quanto tempo estava parado. É o que a consultora precisa para saber    │
 * │ se o que está na tela é dela ou é do modelo.                          │
 * │                                                                      │
 * │ NÃO DIZ "salvo". Não diz "guardado". Não diz "recuperado do banco".    │
 * │ O briefing foi explícito: "NÃO diga que existe persistência definitiva │
 * │ enquanto Neon não estiver conectado." Aqui não há banco nenhum — há a  │
 * │ memória da ABA —, e o texto abaixo diz isso com estas palavras.        │
 * │                                                                      │
 * │ Também NÃO diz o nome do cliente ou do modelo como se fossem dados     │
 * │ escolhidos agora: eles vêm do rascunho, e é por isso que a nota os     │
 * │ nomeia junto com a hora. Um nome sem a hora viraria "o sistema         │
 * │ escolheu isto por você sem avisar", que é o oposto do que aconteceu.   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O TOM É "info", E NÃO "sucesso" NEM "atencao"                        │
 * │                                                                      │
 * │ Não é novidade boa nem má: é trabalho que voltou, e a cor certa para   │
 * │ isso é a neutra. O verde de sucesso transformaria um fato do sistema   │
 * │ numa comemoração, e o amarelo de atenção faria parecer que algo deu    │
 * │ errado — quando o errado seria justamente NÃO ter voltado.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function NotaDaRetomada({
  retomada,
  agora,
  cliente,
  modelo,
  aoDescartar,
}: {
  retomada: Retomada;
  /** O relógio entra por prop para o texto ser estável entre dois renders. */
  agora: Date;
  /** Os nomes, resolvidos por quem conhece o catálogo. `null` quando não acha. */
  cliente: string | null;
  modelo: string | null;
  aoDescartar: () => void;
}) {
  return (
    <section
      /*
        `aria-live="polite"`: ela aparece sem troca de tela — o efeito de carga
        termina e o bloco já está ali. Anunciar sem interromper é o mesmo
        cuidado de `AvisoDeProcedencia`.
      */
      aria-live="polite"
      className={
        "rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva " +
        "bg-[rgba(107,122,70,0.06)] px-4 py-3"
      }
    >
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <Etiqueta tom="oliva">retomado</Etiqueta>
        <p className="text-[0.875rem] font-medium text-tinta">
          O que você tinha começado nesta planilha voltou como estava.
        </p>
      </div>

      <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
        {modelo ? (
          <>
            <span className="font-medium">Planilha:</span> {modelo}.{" "}
          </>
        ) : null}
        {cliente ? (
          <>
            <span className="font-medium">Cliente:</span> {cliente}.{" "}
          </>
        ) : null}
        Você havia parado <span className="tabular">{haQuantoTempo(retomada.salvadaEm, agora)}</span> —
        os valores digitados, as cores e a aba aberta são os de então.
      </p>

      {/*
        ── A FRASE QUE SEPARA ESTA NOTA DE UMA PROMESSA DE BANCO ─────────────

        Ela é o coração do requisito "não fingir persistência", e é por isso
        que ela fala do que ACONTECE em vez do que o sistema "garante": a
        memória é da aba, e fechar a aba a apaga. Nada aqui depende de Neon.

        O último período evita o mal-entendido oposto — o de que isto ficou
        arquivado em algum lugar e dá para voltar nele na semana que vem. Não
        ficou, e a nota diz.
      */}
      <p className="mt-2 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
        Isto é a memória desta aba do navegador, e não um arquivo salvo: recarregar a página mantém,
        fechar a aba apaga.
      </p>

      {/*
        O BOTÃO É DE CIÊNCIA, E NÃO DE AÇÃO.

        Ele não "salva" nem "aplica" nada — o trabalho já está na grade quando
        esta nota aparece. Ele só fecha o aviso. Sem ele, a nota ficaria na
        tela empurrando a planilha para baixo até a próxima troca de modelo.
      */}
      <div className="mt-3">
        <Botao variante="linha" tamanho="sm" onClick={aoDescartar}>
          Ciente
        </Botao>
      </div>
    </section>
  );
}

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A OFERTA — QUANDO O TRABALHO GUARDADO É DE OUTRO PAR                  │
 * │                                                                      │
 * │ Esta é a nota que não existia antes, e ela é o que impede o trabalho   │
 * │ de ser apagado em silêncio quando a consultora troca de cliente sem    │
 * │ terminar.                                                             │
 * │                                                                      │
 * │ ── A AÇÃO É "ABRIR AQUELA PLANILHA", E NÃO "TRAZER PARA ESTA" ────── │
 * │                                                                      │
 * │ A saída óbvia seria um botão "trazer o que eu digitei para cá". Ela    │
 * │ está ERRADA, e o motivo é o formato do dado: as edições são            │
 * │ endereçadas por `"<aba>::<célula>"` — só o nome da aba e o endereço.   │
 * │                                                                      │
 * │ Trazer as edições do Empório para a ficha de outro cliente escreveria  │
 * │ números CERTOS nos lugares ERRADOS: a célula existe, o valor existe, e  │
 * │ a linha ao redor fala de outro insumo. Se o modelo também for outro,   │
 * │ pior ainda: as colunas mudam de SIGNIFICADO, e um custo cairia na      │
 * │ coluna de preço de venda. Nenhum dos dois dá erro.                     │
 * │                                                                      │
 * │ Então a nota não mistura: ela leva a tela DE VOLTA ao par de origem,   │
 * │ onde cada endereço volta a querer dizer o que dizia. É a única         │
 * │ travessia em que o trabalho não precisa ser reinterpretado — e é a      │
 * │ mesma razão pela qual `valePara` exige o par inteiro.                  │
 * │                                                                      │
 * │ ── O QUE ACONTECE SE ELA NÃO QUISER ───────────────────────────────── │
 * │                                                                      │
 * │ Nada, e é importante que seja nada: o rascunho fica guardado como      │
 * │ está. O efeito de gravação não passa por cima dele — ele só escreve    │
 * │ quando há trabalho nesta tela, e no instante da troca não há.          │
 * │                                                                      │
 * │ O que a nota precisa deixar claro é o PREÇO da recusa, e ele é honesto │
 * │ e pequeno: esta aba lembra de uma planilha por vez, então o trabalho   │
 * │ de lá será esquecido quando ela começar a digitar aqui. É a mesma      │
 * │ frase de `clientes/novo.tsx` — "o estado é local e morre com a página" │
 * │ —, aplicada a um escopo diferente.                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function OfertaDeRetomada({
  retomada,
  agora,
  cliente,
  modelo,
  aoAbrir,
  aoSeguir,
}: {
  retomada: Retomada;
  agora: Date;
  cliente: string | null;
  modelo: string | null;
  aoAbrir: () => void;
  aoSeguir: () => void;
}) {
  return (
    <section
      aria-live="polite"
      className={
        "rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-dourado " +
        "bg-[rgba(201,165,78,0.07)] px-4 py-3"
      }
    >
      <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
        <Etiqueta tom="dourado">trabalho em outro lugar</Etiqueta>
        <p className="text-[0.875rem] font-medium text-tinta">
          Você deixou uma planilha começada sem terminar.
        </p>
      </div>

      <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
        {modelo ? (
          <>
            <span className="font-medium">Planilha:</span> {modelo}.{" "}
          </>
        ) : null}
        {cliente ? (
          <>
            <span className="font-medium">Cliente:</span> {cliente}.{" "}
          </>
        ) : null}
        Ela ficou parada <span className="tabular">{haQuantoTempo(retomada.salvadaEm, agora)}</span> e
        continua guardada.
      </p>

      {/*
        A FRASE QUE EXPLICA POR QUE NÃO EXISTE UM BOTÃO DE TRAZER.

        Ela é a resposta à pergunta que a nota provoca — "por que não posso só
        juntar as duas?" —, e ela responde sem jargão: a célula existe nos dois
        lados, mas a linha em volta fala de outra coisa.
      */}
      <p className="mt-2 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
        O que você digitou lá foi escrito para as células daquela planilha — juntar com esta colocaria
        números certos nas linhas erradas. Abrir aquela planilha devolve o trabalho onde cada célula
        quer dizer o que dizia.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Botao variante="secundario" tamanho="sm" onClick={aoAbrir}>
          Abrir aquela planilha
        </Botao>
        <Botao variante="linha" tamanho="sm" onClick={aoSeguir}>
          Seguir nesta
        </Botao>
        <span className="text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
          Se seguir nesta, o trabalho de lá é esquecido quando você começar a digitar aqui.
        </span>
      </div>
    </section>
  );
}
