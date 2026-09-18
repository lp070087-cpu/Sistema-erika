import { CabecalhoPagina } from "./rotulo";
import { Aviso, Secao } from "./superficie";
import { Etiqueta } from "./indicador";
import { BotaoLink } from "./botao";
import { DecisoesQueFaltam } from "./metodologia";

/**
 * A TELA DE UM MÓDULO QUE AINDA NÃO ABRE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA TELA EXISTE, EM VEZ DE UM 404                           │
 * │                                                                      │
 * │ Uma rota que devolvesse 404 daria a impressão de erro; uma tela vazia │
 * │ daria a impressão de sistema quebrado. Esta diz exatamente três       │
 * │ coisas: o que o módulo vai fazer, que ele ainda não está construído,  │
 * │ e de quais decisões ele depende.                                     │
 * │                                                                      │
 * │ Continuar VISÍVEL é deliberado. Esconder o que ainda não existe faria │
 * │ o menu parecer um sistema fechado, e a consultora precisa saber o que │
 * │ vem — inclusive para dizer se quer.                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A ETIQUETA DIZ "EM PREPARAÇÃO" E NÃO "FASE 4"                │
 * │                                                                      │
 * │ A versão anterior trazia `fase={4}` e imprimia "Previsto para a Fase  │
 * │ 4". O número é útil para quem constrói o sistema e não diz nada para  │
 * │ quem usa: a consultora não sabe o que é a Fase 4 nem o que muda entre │
 * │ a 4 e a 9. Era linguagem interna de obra na parede do cliente.        │
 * │                                                                      │
 * │ A tela agora diz o estado em palavras — "Em preparação" — e o resto  │
 * │ que ela precisa dizer já está dito por extenso: o escopo e as         │
 * │ decisões abaixo. O número da fase continua nos comentários e na       │
 * │ documentação, que é onde ele serve para alguma coisa.                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS PENDÊNCIAS DEIXARAM DE SER NÚMEROS                                │
 * │                                                                      │
 * │ Antes o bloco de decisões escrevia "Aguardando resposta dos pontos 7  │
 * │ e 19 da Seção 17 do relatório da Fase 0". Três camadas de referência │
 * │ interna para dizer que faltava combinar preço e arredondamento.       │
 * │                                                                      │
 * │ Agora as decisões vêm de `@/components/ui/metodologia`, a mesma lista │
 * │ que a ficha e a planilha usam — nomeadas na língua de quem responde.   │
 * │ Um módulo que depende de uma decisão que ainda não está naquela lista  │
 * │ simplesmente não passa `decisoes`, e a tela explica o motivo no texto │
 * │ do escopo, sem inventar um bloqueio que ninguém declarou.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function ModuloPendente({
  rotulo,
  titulo,
  descricao,
  decisoes,
  escopo,
}: {
  rotulo?: string;
  titulo: string;
  descricao: string;
  /** Ids de `DECISOES_PENDENTES` que travam este módulo. */
  decisoes?: readonly string[];
  escopo?: string[];
}) {
  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo={rotulo}
        titulo={titulo}
        descricao={descricao}
        acoes={<Etiqueta tom="oliva">Em preparação</Etiqueta>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <Secao rotulo="O que este módulo vai fazer">
          {escopo && escopo.length > 0 ? (
            <ul className="space-y-3">
              {escopo.map((linha) => (
                <li key={linha} className="flex gap-3 text-[0.875rem] leading-relaxed">
                  <span aria-hidden className="mt-2 h-px w-3.5 shrink-0 bg-oliva" />
                  <span className="text-[var(--tinta-suave)]">{linha}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[0.875rem] text-[var(--tinta-suave)]">
              O escopo deste módulo ainda está sendo levantado com a consultora.
            </p>
          )}
        </Secao>

        <div className="space-y-4">
          <Secao rotulo="Estado">
            <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Esta tela está desenhada e ainda não foi construída. Enquanto ela
              não existir, os números que ela mostraria não aparecem em nenhum
              outro lugar do sistema — nem como estimativa, nem como exemplo.
            </p>
            <BotaoLink href="/" variante="secundario" tamanho="sm" className="mt-4">
              Voltar à visão geral
            </BotaoLink>
          </Secao>

          <Aviso tom="info" titulo="Por que ela não foi construída ainda">
            <p>
              Não é falta de espaço na tela: é que este módulo ainda não foi
              desenhado até o fim com você. Construir antes disso seria decidir
              no seu lugar o que ele deve guardar.
            </p>
          </Aviso>
        </div>
      </div>

      {/*
        As decisões nomeadas ficam no fim e ocupam a largura toda: elas são a
        parte que a consultora leva para decidir, e é o que sobra de acionável
        numa tela de módulo que ainda não existe.
      */}
      {decisoes && decisoes.length > 0 ? (
        <DecisoesQueFaltam
          apenas={decisoes}
          titulo="O que precisa ser decidido para este módulo existir"
          descricao="Enquanto estas decisões não forem tomadas, o sistema não tem como calcular o que esta tela mostraria — e não vai mostrar um número que pareça certo sem ser."
        />
      ) : null}
    </div>
  );
}
