import { cn } from "@/lib/utils/cn";
import { BotaoLink } from "./botao";

/**
 * AVISO DE INTERAÇÃO SEM GRAVAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM COMPONENTE, E NÃO UM TEXTO EM CADA TELA            │
 * │                                                                      │
 * │ Três telas deixam a consultora mexer sem gravar: o plano de ação, a   │
 * │ lista de tarefas e o registro de acompanhamento. Nas três, a mesma    │
 * │ promessa precisa ser cumprida com as mesmas palavras — porque a       │
 * │ confiança não se recupera se uma delas for mais vaga que a outra.     │
 * │                                                                      │
 * │ Um texto copiado em três arquivos divergiria na primeira revisão.     │
 * │ Aqui, a frase é uma só, e mudá-la muda as três telas de uma vez.      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE VEM ANTES DA LISTA, E NÃO DEPOIS                          │
 * │                                                                      │
 * │ Um aviso no rodapé é lido depois de a pessoa já ter clicado. Aqui a   │
 * │ ordem é a mesma de um contrato: primeiro o que o sistema faz, depois  │
 * │ o uso. Quem mexer já sabe — e não descobre ao recarregar.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AvisoInteracao({
  /** O que a pessoa pode fazer nesta tela. Ex.: "mudar o status de uma ação". */
  oQue,
  /** O que volta ao estado original. Ex.: "o plano". */
  oQueVolta,
  className,
}: {
  oQue: string;
  oQueVolta: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "nao-imprimir rounded-[var(--raio)] border border-[var(--linha)] border-l-2 " +
          "border-l-dourado bg-[rgba(201,165,78,0.09)] px-4 py-3.5",
        className
      )}
    >
      <p className="text-[0.875rem] font-semibold">
        As alterações desta tela não são gravadas
      </p>
      <p className="mt-1 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
        Você pode {oQue} — a tela responde na hora, para que se possa avaliar como
        seria o uso no dia a dia. Mas o sistema ainda não tem banco conectado: ao
        recarregar a página, {oQueVolta} volta ao estado original. Isso é o
        comportamento esperado nesta fase, e não uma falha.
      </p>
    </div>
  );
}

/**
 * O aviso para quando a tela APENAS EXIBE e não permite mexer.
 *
 * É o caso oposto e merece outra frase: lá fora, dizer "nada é gravado"
 * numa tela que não tem o que gravar confunde — sugere que algo foi salvo.
 * Aqui a informação útil é de onde o dado veio.
 */
export function AvisoExibicao({
  oQue,
  className,
}: {
  oQue: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "nao-imprimir rounded-[var(--raio)] border border-[var(--linha)] border-l-2 " +
          "border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-3.5",
        className
      )}
    >
      <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">{oQue}</p>
    </div>
  );
}

/**
 * ESTADO VAZIO DE MÓDULO AINDA NÃO LIGADO.
 *
 * Existe para o punhado de telas que a Fase 0 previu e que a Fase 2.5 não
 * constrói — precificação, cardápios, equipe, biblioteca. Elas precisam
 * dizer três coisas, nesta ordem:
 *
 *   1. que o módulo é previsto (não é um erro nem uma tela quebrada),
 *   2. o que ele vai fazer quando existir,
 *   3. POR QUE ele ainda não existe — que é a parte honesta e a que mais
 *      costuma faltar.
 *
 * O motivo quase nunca é "falta de tempo": é uma decisão de metodologia
 * ainda aberta. Dizer isso transforma uma tela vazia em informação sobre o
 * projeto.
 */
export function ModuloEmPreparacao({
  titulo,
  descricao,
  porque,
  dependeDe,
  acao,
  className,
}: {
  titulo: string;
  descricao: string;
  /** A razão real. Uma frase direta. */
  porque: string;
  /** Os pontos abertos que travam o módulo, pelo número. Ex.: [4, 5, 6]. */
  dependeDe?: readonly number[];
  acao?: { href: string; texto: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.4)] px-6 py-10",
        className
      )}
    >
      <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
        Em preparação
      </p>
      <h2 className="mt-2.5 text-[1.125rem]">{titulo}</h2>
      <p className="mt-2 max-w-[62ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
        {descricao}
      </p>

      <div className="mt-5 max-w-[62ch] border-l-2 border-l-dourado pl-3.5">
        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
          Por que ainda não existe
        </p>
        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          {porque}
        </p>
        {dependeDe && dependeDe.length > 0 ? (
          <p className="mt-2 text-[0.8125rem] text-[var(--tinta-fraca)]">
            Depende da definição dos pontos{" "}
            {dependeDe.map((n, i) => (
              <span key={n}>
                {i > 0 ? (i === dependeDe.length - 1 ? " e " : ", ") : ""}
                <span className="tabular font-medium text-[var(--tinta-suave)]">{n}</span>
              </span>
            ))}{" "}
            — decisões da consultora, não do sistema.
          </p>
        ) : null}
      </div>

      {acao ? (
        <div className="mt-5">
          <BotaoLink href={acao.href} variante="secundario" tamanho="sm">
            {acao.texto}
          </BotaoLink>
        </div>
      ) : null}
    </div>
  );
}
