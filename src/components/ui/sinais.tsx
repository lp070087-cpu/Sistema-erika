import { cn } from "@/lib/utils/cn";

/**
 * SINAIS OBJETIVOS.
 *
 * Um sinal é um fato que o lead declarou, traduzido para linguagem de
 * operação: "Não usa ficha técnica", "Cozinha não aguenta volume maior".
 *
 * POR QUE NÃO É UM BADGE COLORIDO DE ALERTA
 *
 * Seria fácil pintar isto de vermelho e amarelo por gravidade — e seria
 * mentira. A gravidade de cada resposta depende do peso que a Érika ainda
 * não definiu (ponto 11). Um tom de alerta aqui seria um julgamento sobre
 * o negócio de alguém, feito por suposição do programador.
 *
 * Então o sinal é neutro: borda fina, semáforo nenhum. Ele informa. Quem
 * decide o que é grave é ela, lendo.
 */
export function ListaSinais({
  sinais,
  maximo,
  restantes,
  className,
}: {
  sinais: string[];
  /** Quantos exibir. O restante vira um contador — não um "ver mais". */
  maximo?: number;
  restantes?: number;
  className?: string;
}) {
  if (sinais.length === 0) {
    return (
      <span className={cn("text-[0.8125rem] text-[var(--tinta-fraca)]", className)}>
        Nenhum ponto objetivo declarado
      </span>
    );
  }

  const visiveis = typeof maximo === "number" ? sinais.slice(0, maximo) : sinais;
  const sobra = restantes ?? Math.max(0, sinais.length - visiveis.length);

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {visiveis.map((sinal) => (
        <li
          key={sinal}
          className={
            "inline-flex items-center rounded-[2px] border border-[var(--linha-forte)] " +
            "bg-[rgba(242,236,226,0.7)] px-2 py-0.5 text-[0.75rem] leading-snug " +
            "text-[var(--tinta-suave)]"
          }
        >
          {sinal}
        </li>
      ))}
      {sobra > 0 ? (
        <li
          className={
            "inline-flex items-center px-1 py-0.5 text-[0.75rem] leading-snug " +
            "text-[var(--tinta-fraca)] tabular"
          }
          title={`Mais ${sobra} ${sobra === 1 ? "ponto" : "pontos"} no diagnóstico`}
        >
          +{sobra}
        </li>
      ) : null}
    </ul>
  );
}
