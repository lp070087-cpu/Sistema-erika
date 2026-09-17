import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { LinhaDoTempo } from "@/components/ui/linha-do-tempo";
import { dataEHora } from "@/lib/dados";
import type { ClienteOperacao, EventoHistorico, TipoEvento } from "@/lib/dados";

/**
 * ABA 8 — HISTÓRICO.
 *
 * A linha do tempo inteira do relacionamento: quando o diagnóstico chegou,
 * quando o lead virou cliente, quando a consultoria começou, cada ficha
 * criada, cada preço atualizado, cada documento entregue.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA ABA É MAIS ÚTIL DO QUE PARECE                            │
 * │                                                                      │
 * │ Cada aba mostra um pedaço. Esta mostra a ORDEM em que os pedaços       │
 * │ aconteceram — e é a ordem que responde a pergunta que aparece na       │
 * │ reunião de renovação: "o que foi feito neste ano?".                    │
 * │                                                                      │
 * │ Também é onde se percebe o que parou. Um cliente com fichas criadas    │
 * │ até março e nada depois tem um silêncio que nenhuma outra aba mostra   │
 * │ com a mesma clareza.                                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O primeiro item recebe o marcador cheio — ele é onde a história está
 * agora. Não existe "evento mais importante": os fatos estão em ordem, e
 * ordem não é julgamento.
 */

const ROTULO_EVENTO: Record<TipoEvento, string> = {
  diagnostico_recebido: "Diagnóstico",
  lead_convertido: "Cliente",
  consultoria_iniciada: "Consultoria",
  acompanhamento_registrado: "Acompanhamento",
  ficha_criada: "Ficha",
  preco_atualizado: "Preço",
  processo_mapeado: "Processo",
  tarefa_concluida: "Tarefa",
  documento_gerado: "Documento",
};

export function AbaHistorico({
  cliente,
  eventos,
}: {
  cliente: ClienteOperacao;
  eventos: readonly EventoHistorico[];
}) {
  return (
    <div className="space-y-6">
      <Secao
        rotulo="Histórico"
        titulo={
          eventos.length === 0
            ? "Nenhum acontecimento registrado"
            : `${eventos.length} ${eventos.length === 1 ? "acontecimento" : "acontecimentos"}`
        }
        descricao={`Tudo o que aconteceu com ${cliente.nomeFantasia} desde o primeiro contato, do mais recente para o mais antigo.`}
      >
        {eventos.length === 0 ? (
          <EstadoVazio
            titulo="A história começa no primeiro registro"
            descricao="Quando o primeiro diagnóstico chegar ou o cadastro for feito, os acontecimentos passam a aparecer aqui, em ordem."
          />
        ) : (
          <LinhaDoTempo
            eventos={eventos.map((e) => ({
              id: e.id,
              quando: dataEHora(e.em),
              titulo: e.descricao,
              tipo: ROTULO_EVENTO[e.tipo],
            }))}
          />
        )}
      </Secao>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(
          [
            ["Diagnóstico recebido", "Quando a pessoa respondeu o formulário no site."],
            ["Cliente", "O momento em que o lead virou cliente na carteira."],
            ["Consultoria", "O início do trabalho e o escopo combinado."],
            ["Ficha", "Cada ficha técnica criada ou revisada."],
            ["Preço", "Atualização de preço de ingrediente na biblioteca."],
            ["Processo", "Mapeamento de uma praça da cozinha."],
          ] as const
        ).map(([titulo, apoio]) => (
          <div
            key={titulo}
            className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3"
          >
            <p className="text-[0.8125rem] font-medium text-tinta">{titulo}</p>
            <p className="mt-1 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">{apoio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
