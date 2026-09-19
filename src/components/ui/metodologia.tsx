import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * AS DECISÕES QUE AINDA FALTAM — E O QUE CADA UMA TRAVA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO VIROU UM COMPONENTE, E NÃO UMA FRASE EM CADA TELA       │
 * │                                                                      │
 * │ Cada tela que depende da metodologia dizia a mesma coisa com          │
 * │ palavras diferentes: "cálculo em preparação", "aguardando a           │
 * │ metodologia", "depende de decisões que ainda não foram tomadas".      │
 * │                                                                      │
 * │ Três problemas nisso, e o terceiro é o que importa:                   │
 * │                                                                      │
 * │ 1. A frase genérica não diz O QUÊ falta. "Aguardando a metodologia"   │
 * │    é um cadeado sem placa — a consultora não tem como saber se a      │
 * │    resposta que ela precisa dar é sobre perda, sobre arredondamento   │
 * │    ou sobre preço de fornecedor.                                      │
 * │                                                                      │
 * │ 2. Frases parecidas escritas em lugares diferentes DIVERGEM. Bastava  │
 * │    alguém responder a pergunta sobre arredondamento e atualizar duas  │
 * │    telas das quatro para o sistema passar a dizer coisas               │
 * │    contraditórias sobre o mesmo bloqueio.                             │
 * │                                                                      │
 * │ 3. A LISTA PRECISA SOBREVIVER AO PRIMEIRO DESBLOQUEIO. Estas decisões  │
 * │    não serão respondidas todas no mesmo dia. Uma lista escrita à mão    │
 * │    em cada tela não tem como perder um item só: ou fica inteira, ou    │
 * │    alguém reescreve o bloco e leva os outros junto. Aqui, cada item é  │
 * │    um dado — sai um item, os outros ficam.                            │
 * │                                                                      │
 * │ É a mesma escolha do `derivarAtencao`: um lugar decide, vários leem.   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O TEXTO NÃO CITA NÚMERO DE PERGUNTA                          │
 * │                                                                      │
 * │ O projeto tem uma lista numerada de pontos em aberto, e ela é útil     │
 * │ para quem está construindo o sistema — não para quem usa. "Ponto 10"   │
 * │ não significa nada para a consultora, e uma tela que diz "depende do   │
 * │ ponto 10" transfere para ela o trabalho de descobrir o que é o ponto   │
 * │ 10.                                                                   │
 * │                                                                      │
 * │ Cada item abaixo nomeia a DECISÃO: "de onde vem o preço do insumo",   │
 * │ "quanto a cocção rende". Uma frase que ela lê e responde na hora.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * Uma decisão pendente, e o que ela impede.
 *
 * `trava` é a lista do que depende dela. Escrever o que trava é o que
 * distingue esta lista de um aviso genérico: "de onde vem o preço" sozinho
 * é uma pergunta; com "custo do prato, CMV e preço sugerido" ao lado, é
 * uma pergunta com consequência.
 */
export type DecisaoPendente = {
  id: string;
  /** A decisão, na língua de quem responde — não na de quem programa. */
  decisao: string;
  /** Por que o sistema não pode escolher sozinho. Uma frase. */
  porque: string;
  /** O que fica parado enquanto ela não for tomada. */
  trava: readonly string[];
};

/**
 * AS DECISÕES QUE O SISTEMA ESTÁ ESPERANDO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA LISTA NÃO É UM "PENDÊNCIAS DO PROJETO"                          │
 * │                                                                      │
 * │ São decisões de METODOLOGIA da consultoria — como ela calcula, como   │
 * │ ela mede, como ela arredonda. O sistema não tem opinião sobre nenhuma  │
 * │ delas e não deveria: são o critério profissional dela, e é ele que     │
 * │ faz o trabalho ser o trabalho dela.                                   │
 * │                                                                      │
 * │ Um sistema que escolhesse sozinho "custo inclui gás?" estaria          │
 * │ inventando metodologia e assinando embaixo.                            │
 * │                                                                      │
 * │ Quando um item for respondido, ele sai daqui. Os outros ficam.        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export const DECISOES_PENDENTES: readonly DecisaoPendente[] = [
  {
    id: "coccao",
    decisao: "O rendimento da cocção entra como tabela ou como pesagem",
    /*
      ESTA PERGUNTA MUDOU DE FORMA DEPOIS DO MOTOR DE CUSTOS.

      Antes ela era "quanto o alimento rende depois de cozido" — e o sistema
      não tinha como responder porque não tinha peso nenhum.

      Agora, quando os pesos foram medidos, o rendimento é conta fechada:
      1,75 kg depois de grelhar sobre 2,5 kg antes dá 70%, e esse número não
      depende de decisão nenhuma.

      O que continua em aberto é OUTRA coisa, e é ela que a consultora
      precisa responder: a metodologia dela tem um índice de cocção de
      REFERÊNCIA — um número que vale antes de medir, para prever? Se tiver,
      ele entra como valor de tabela, e o sistema precisa saber quando
      aplicá-lo em vez da medição. Se não tiver, então todo rendimento é
      medido, e o que falta é combinar que a balança entra na rotina.
    */
    porque:
      "O rendimento já medido o sistema calcula sozinho. O que ainda não se sabe é se a sua metodologia usa um índice de cocção de referência, aplicado ANTES da pesagem — e o que fazer quando o medido e o de tabela discordarem.",
    trava: ["Aplicar índice em vez de medir", "Rendimento de insumo ainda não pesado"],
  },
  {
    id: "compra-para-uso",
    decisao: "O fator de correção é tabela da metodologia, ou só o que foi medido",
    porque:
      "Limpar e aparar tira peso, e o sistema já calcula quanto tirou quando existem os dois pesos. Falta decidir se existe um fator de correção oficial por categoria de alimento — e, se existir, se ele substitui a medição da cozinha ou serve só de conferência.",
    trava: ["Estimar perda sem pesar", "Conferência entre medido e tabela"],
  },
  {
    id: "custo-do-prato",
    decisao: "O que entra na conta do custo",
    porque:
      "Só o ingrediente principal? Conta a embalagem? O gás, a luz, a mão de obra da cozinha? Cada resposta dá um custo diferente para o mesmo prato, e o sistema não escolhe por conta própria.",
    trava: ["Custo do prato", "CMV"],
  },
  {
    id: "formacao-de-preco",
    decisao: "Como o preço de venda é formado",
    porque:
      "Margem sobre o custo ou sobre a venda, imposto antes ou depois, taxa do cartão dentro ou fora. São formas de cálculo diferentes, e cada uma leva a um preço final diferente.",
    trava: ["Preço sugerido", "Margem", "Markup"],
  },
  {
    id: "origem-do-preco",
    decisao: "De onde vem o preço do insumo e de quanto em quanto tempo muda",
    porque:
      "A consultora digita na visita, o cliente manda por mensagem, o preço sai da nota? E quando muda, o que fazer com as fichas antigas? Sem saber disso, atualizar um preço viraria uma mudança silenciosa em fichas que já foram entregues.",
    trava: ["Atualizar preço", "Recalcular fichas antigas"],
  },
  {
    id: "arredondamento",
    decisao: "Quantas casas decimais cada número guarda",
    porque:
      "Custo arredondado antes de multiplicar dá resultado diferente de arredondar no fim. A diferença é pequena por prato e grande por mês.",
    trava: ["Preço sugerido", "Totais das planilhas"],
  },
  {
    id: "peso-das-etapas",
    decisao: "Quanto pesa cada etapa do método",
    porque:
      "O trabalho tem sete etapas, e elas não duram o mesmo nem valem o mesmo. Para dizer \"a consultoria está 60% concluída\" seria preciso decidir antes quanto cada etapa representa do total.",
    trava: ["Percentual de conclusão da consultoria"],
  },
];

/**
 * A MARCA DA REGRA AINDA NÃO CONFIRMADA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UM COMPONENTE PARA DIZER "AINDA NÃO SEI"                     │
 * │                                                                      │
 * │ O sistema recebeu uma ordem específica: onde uma regra profissional   │
 * │ ainda não foi confirmada, marcar como "Regra da metodologia a         │
 * │ confirmar" — e NÃO escolher por conta própria.                        │
 * │                                                                      │
 * │ A alternativa seria uma frase cinza explicando isso em cada lugar     │
 * │ onde a regra faltasse. Frases cinzas repetidas divergem, e a          │
 * │ consultora deixa de lê-las — foi o que aconteceu com "em             │
 * │ preparação". A marca precisa ser reconhecível de longe, curta e       │
 * │ igual em todo lugar, para que ela saiba exatamente o que está         │
 * │ olhando quando encontrar uma.                                        │
 * │                                                                      │
 * │ Repare no que ela NÃO faz: não diz que o cálculo está errado, não     │
 * │ esconde o número e não promete uma data. Ela diz uma coisa só — que   │
 * │ aquele ponto depende de uma resposta dela.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function RegraAConfirmar({
  oQue,
  className,
}: {
  /** O que, exatamente, ainda não está definido neste ponto. */
  oQue: string;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-[var(--raio-sm)] " +
          "border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.07)] px-2.5 py-1.5 " +
          "text-[0.75rem] leading-relaxed text-[#7a6119]",
        className
      )}
    >
      <span className="font-semibold tracking-[0.1em] uppercase">
        Regra da metodologia a confirmar
      </span>
      <span className="text-[var(--tinta-suave)]">{oQue}</span>
    </p>
  );
}

/**
 * A LISTA DE BLOQUEIOS, PARA AS TELAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ `apenas` — POR QUE A LISTA SE FILTRA, E NÃO SE REPETE                │
 * │                                                                      │
 * │ A ficha mostra três decisões; a planilha, quatro; a consultoria,     │
 * │ duas. Passar a lista inteira em todas elas seria mais simples de       │
 * │ escrever e pior de ler: a consultora abriria a ficha atrás de "custo  │
 * │ por porção" e teria de atravessar duas decisões que não têm nada a     │
 * │ ver com o que ela está olhando.                                       │
 * │                                                                      │
 * │ O filtro é por ID, e não por texto, porque o id é o que sobrevive a    │
 * │ uma reescrita da frase. Um item renomeado continua sendo filtrado      │
 * │ do mesmo jeito.                                                       │
 * │                                                                      │
 * │ Lista vazia devolve `null`: quando todas as decisões de uma tela       │
 * │ forem respondidas, o bloco desaparece sozinho, sem ninguém precisar    │
 * │ voltar aqui para apagá-lo.                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function DecisoesQueFaltam({
  apenas,
  titulo = "O que o sistema está esperando de você",
  descricao,
  className,
}: {
  /** Os ids de `DECISOES_PENDENTES` que interessam a esta tela. */
  apenas?: readonly string[];
  titulo?: string;
  descricao?: ReactNode;
  className?: string;
}) {
  const decisoes = apenas
    ? DECISOES_PENDENTES.filter((d) => apenas.includes(d.id))
    : DECISOES_PENDENTES;

  if (decisoes.length === 0) return null;

  return (
    <div
      className={cn(
        "rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.5)] px-5 py-5",
        className
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
          Aguardando definição da metodologia
        </p>
        <span className="tabular text-[0.8125rem] text-[var(--tinta-fraca)]">
          {decisoes.length} {decisoes.length === 1 ? "decisão" : "decisões"}
        </span>
      </div>

      {titulo ? (
        <p className="mt-2 font-display text-[1.0625rem] leading-snug text-tinta">{titulo}</p>
      ) : null}

      {descricao ? (
        <p className="mt-1.5 max-w-[72ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          {descricao}
        </p>
      ) : null}

      <ul className="mt-4 space-y-3.5">
        {decisoes.map((d) => (
          <li key={d.id} className="border-t border-dashed border-[var(--linha-forte)] pt-3.5 first:border-t-0 first:pt-0">
            <p className="text-[0.9375rem] leading-snug font-medium text-tinta">{d.decisao}</p>
            <p className="mt-1 max-w-[76ch] text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              {d.porque}
            </p>
            {/*
              O que fica parado aparece em etiquetas, e não em frase corrida:
              é a parte que a consultora vai reler procurando o nome da coisa
              que ela quer ver na tela ("preço sugerido"), e etiqueta se acha
              de longe.
            */}
            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <span className="text-[0.6875rem] font-semibold tracking-[0.12em] text-[var(--tinta-fraca)] uppercase">
                Segura
              </span>
              {d.trava.map((t) => (
                <span
                  key={t}
                  className="rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[var(--superficie)] px-2 py-0.5 text-[0.75rem] text-[var(--tinta-suave)]"
                >
                  {t}
                </span>
              ))}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-dashed border-[var(--linha-forte)] pt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
        Nada aqui foi estimado nem preenchido no lugar. O sistema guarda o que
        foi declarado e espera a sua definição para calcular — em vez de
        mostrar um número que teria a mesma aparência de um número certo.
      </p>
    </div>
  );
}
