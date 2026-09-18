import { cn } from "@/lib/utils/cn";
import { ROTULO_ETAPA } from "@/lib/dados";
import type { EstadoEtapa, EtapaJornada } from "@/lib/dados";

/**
 * A SEQUÊNCIA DO TRABALHO — a mesma jornada, lida na horizontal.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE, SE A JORNADA LOGO ABAIXO JÁ MOSTRA AS ETAPAS    │
 * │                                                                      │
 * │ A jornada vertical diz o estado de cada etapa com nota e contagem.    │
 * │ É a leitura de quem já está dentro do trabalho. Falta a outra         │
 * │ leitura — a de quem abre a tela e precisa entender, em cinco          │
 * │ segundos, QUAL É A ORDEM: diagnóstico, análise, plano, implantação,   │
 * │ treinamento, acompanhamento, resultado.                              │
 * │                                                                      │
 * │ Numa lista vertical de sete itens com três linhas cada, a ordem se    │
 * │ perde no meio da rolagem. Na horizontal, ela é a própria forma.       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO HÁ "ETAPA ATUAL" NEM PERCENTUAL                          │
 * │                                                                      │
 * │ Seria natural marcar uma etapa como "a atual" e pintar as anteriores  │
 * │ de verde. Seria falso: o trabalho não anda em fila. No cenário real   │
 * │ desta tela há ACOMPANHAMENTO em andamento enquanto TREINAMENTO ainda  │
 * │ não começou — porque o retorno mensal continua mesmo com o            │
 * │ treinamento adiado. Uma barra que dissesse "você está na etapa 4"     │
 * │ mentiria sobre isso com muita confiança.                              │
 * │                                                                      │
 * │ Então cada etapa traz o PRÓPRIO estado, e nada é inferido da posição  │
 * │ dela na lista. Nenhum peso, nenhum percentual: somar etapas de         │
 * │ naturezas diferentes exigiria decidir quanto cada uma vale, e essa     │
 * │ decisão é o ponto 11 — que continua aberto.                           │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const TOM: Record<EstadoEtapa, { rotulo: string; ponto: string; texto: string }> = {
  CONCLUIDA: {
    rotulo: "Concluída",
    ponto: "bg-oliva",
    texto: "text-[var(--tinta-suave)]",
  },
  EM_ANDAMENTO: {
    rotulo: "Em andamento",
    ponto: "bg-oliva ring-2 ring-oliva/25",
    texto: "text-tinta font-medium",
  },
  AGUARDANDO_DADOS: {
    rotulo: "Aguardando dados",
    ponto: "bg-dourado",
    texto: "text-[var(--tinta-suave)]",
  },
  NAO_INICIADA: {
    rotulo: "Não iniciada",
    ponto: "bg-[var(--linha-forte)]",
    texto: "text-[var(--tinta-fraca)]",
  },
};

export function SequenciaDoTrabalho({
  etapas,
  className,
}: {
  /** As mesmas etapas da jornada. Nenhum dado novo, só outra leitura. */
  etapas: readonly EtapaJornada[];
  className?: string;
}) {
  if (etapas.length === 0) return null;

  return (
    <ol className={cn("flex flex-wrap items-stretch gap-x-0 gap-y-3", className)}>
      {etapas.map((etapa, i) => {
        const tom = TOM[etapa.estado];
        const ultima = i === etapas.length - 1;
        return (
          <li key={etapa.etapa} className="flex items-center">
            <div className="min-w-[7.5rem] pr-1">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tom.ponto)}
                />
                <span className="tabular text-[0.625rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className={cn("mt-1.5 text-[0.8125rem] leading-snug", tom.texto)}>
                {ROTULO_ETAPA[etapa.etapa]}
              </p>
              {/*
                O estado vai em texto, e não só na cor do ponto: quem não
                distingue verde de dourado não teria como ler a etapa, e a
                informação mais importante do bloco ficaria só na cor.
              */}
              <p className="mt-0.5 text-[0.6875rem] text-[var(--tinta-fraca)]">{tom.rotulo}</p>
            </div>
            {!ultima ? (
              <span aria-hidden className="mx-1 h-px w-5 shrink-0 bg-[var(--linha-forte)]" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
