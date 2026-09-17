import { CabecalhoPagina } from "./rotulo";
import { Aviso, Secao } from "./superficie";
import { Etiqueta } from "./indicador";
import { BotaoLink } from "./botao";

/**
 * Tela de módulo ainda não implementado.
 *
 * EXISTE POR UMA RAZÃO ESPECÍFICA.
 *
 * O sistema tem treze módulos aprovados e apenas a fundação construída.
 * Uma rota que devolvesse 404 daria a impressão de erro; uma tela vazia
 * daria a impressão de sistema quebrado. Esta diz exatamente três coisas:
 * o que o módulo vai fazer, em que fase ele entra, e de quais decisões
 * ele depende.
 *
 * O bloco de pendências é lido da Seção 17 do relatório da Fase 0 —
 * são as perguntas que ainda não foram respondidas pela consultora.
 * Nenhuma delas é resolvida aqui por suposição.
 */
export function ModuloPendente({
  rotulo,
  titulo,
  descricao,
  fase,
  pendencias,
  escopo,
}: {
  rotulo?: string;
  titulo: string;
  descricao: string;
  fase: number;
  pendencias?: string[];
  escopo?: string[];
}) {
  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo={rotulo}
        titulo={titulo}
        descricao={descricao}
        acoes={<Etiqueta tom="oliva">Previsto para a Fase {fase}</Etiqueta>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
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
              Escopo definido no relatório da Fase 0.
            </p>
          )}
        </Secao>

        <div className="space-y-4">
          <Secao rotulo="Estado">
            <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Apenas a fundação do sistema foi construída. Nenhuma regra de
              negócio gastronômica foi implementada — por decisão explícita,
              até que as perguntas abaixo sejam respondidas.
            </p>
            <BotaoLink href="/" variante="secundario" tamanho="sm" className="mt-4">
              Voltar à visão geral
            </BotaoLink>
          </Secao>

          {pendencias && pendencias.length > 0 ? (
            <Aviso tom="atencao" titulo="Depende de decisão da consultora">
              <p>
                {pendencias.length === 1
                  ? "Aguardando resposta do ponto"
                  : "Aguardando resposta dos pontos"}{" "}
                <strong className="font-semibold text-tinta tabular">
                  {pendencias.join(", ")}
                </strong>{" "}
                da Seção 17 do relatório da Fase 0.
              </p>
            </Aviso>
          ) : null}
        </div>
      </div>
    </div>
  );
}
