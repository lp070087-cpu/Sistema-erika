import { EstadoVazio, Secao } from "@/components/ui/superficie";
import { CartaoAcompanhamento } from "@/components/ui/acompanhamento";
import type { Acompanhamento, ClienteOperacao } from "@/lib/dados";

/**
 * ABA 6 — ACOMPANHAMENTOS.
 *
 * O diário de relacionamento com o cliente. O cartão de cada registro vem
 * de `components/ui/acompanhamento` porque a mesma peça aparece na lista
 * geral de /acompanhamentos — e aqui ela é chamada sem `contexto`, já que
 * o cliente é o assunto da página inteira e repetir o nome em cada cartão
 * só ocuparia espaço.
 */
export function AbaAcompanhamentos({
  cliente,
  acompanhamentos,
}: {
  cliente: ClienteOperacao;
  acompanhamentos: readonly Acompanhamento[];
}) {
  return (
    <div className="space-y-6">
      <Secao
        rotulo="Acompanhamentos"
        titulo={
          acompanhamentos.length === 0
            ? "Nenhum acompanhamento registrado"
            : `${acompanhamentos.length} ${acompanhamentos.length === 1 ? "registro" : "registros"}`
        }
        descricao={`Reuniões, visitas e análises feitas com ${cliente.nomeFantasia}, do mais recente para o mais antigo.`}
      >
        {acompanhamentos.length === 0 ? (
          <EstadoVazio
            titulo="Nada registrado ainda"
            descricao="Cada reunião, visita ou análise vira um registro com o que foi discutido e o que ficou combinado. O primeiro aparece aqui assim que for lançado."
          />
        ) : (
          <ol className="space-y-5">
            {acompanhamentos.map((a, i) => (
              <CartaoAcompanhamento
                key={a.id}
                acompanhamento={a}
                destaque={i === 0}
              />
            ))}
          </ol>
        )}
      </Secao>
    </div>
  );
}
