import Link from "next/link";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, Secao } from "@/components/ui/superficie";
import { ROTULO_ESTADO_MODELO, TOM_ESTADO_MODELO } from "@/lib/planilhas/estado";
import { MODELOS } from "@/lib/planilhas/modelos";
import { BotaoGerarPlanilha } from "./gerar";

/**
 * "DOCUMENTOS E PLANILHAS" — a seção que aparece na ficha do cliente.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO NÃO É UMA ABA NOVA                                      │
 * │                                                                      │
 * │ A ficha do cliente já tem oito abas, e a oitava é "Documentos" — o   │
 * │ que foi ENTREGUE a ele. Uma aba "Planilhas" ao lado dela criaria duas │
 * │ abas com nomes quase iguais e conteúdos que ninguém distingue de      │
 * │ cabeça: "documentos" e "planilhas" são a mesma família de coisa.      │
 * │                                                                      │
 * │ O que muda é o tempo verbal. A aba Documentos é o PASSADO — o que já  │
 * │ saiu. Esta seção é o PRESENTE — o que sai agora, se ela clicar. Por   │
 * │ isso ela entra DENTRO da aba Documentos, no topo, e não como uma nona  │
 * │ aba. Uma ação de dois segundos não merece uma aba própria.            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA SEÇÃO NÃO TEM GERADOR PRÓPRIO                                   │
 * │                                                                      │
 * │ Ela reaproveita `BotaoGerarPlanilha`, que é o mesmo componente da     │
 * │ Central de Planilhas, apontando para a mesma rota. Zero lógica        │
 * │ duplicada: se a geração mudar de biblioteca, muda num arquivo só, e   │
 * │ esta seção passa a se comportar diferente sem ninguém tocar nela.     │
 * │                                                                      │
 * │ A alternativa — uma função de exportar escrita aqui dentro —          │
 * │ pareceria mais direta e criaria a segunda implementação da mesma      │
 * │ regra. Elas divergiriam na primeira correção, e a planilha baixada da │
 * │ ficha do cliente sairia diferente da baixada da Central.              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function CartaoPlanilhasDoCliente({
  clienteId,
  nomeCliente,
  consultoriaId,
}: {
  clienteId: string;
  nomeCliente: string;
  consultoriaId?: string | null;
}) {
  const disponivel = MODELOS.find((m) => m.estado === "DISPONIVEL") ?? null;
  const emFalta = MODELOS.filter((m) => m.estado !== "DISPONIVEL");

  return (
    <Secao
      rotulo="Documentos e planilhas"
      titulo="Gerar uma planilha deste cliente"
      descricao="O arquivo sai com os dados deste cadastro, as tarefas em aberto e o histórico dos encontros. É um .xlsx de verdade, que abre no Excel."
      acoes={
        <Link
          href={`/planilhas?cliente=${encodeURIComponent(clienteId)}`}
          className="text-[0.8125rem] text-oliva hover:underline"
        >
          Abrir a Central de planilhas
        </Link>
      }
    >
      {disponivel ? (
        <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-[0.9375rem] font-medium text-tinta">{disponivel.nome}</span>
                <Etiqueta tom={TOM_ESTADO_MODELO[disponivel.estado]}>
                  {ROTULO_ESTADO_MODELO[disponivel.estado]}
                </Etiqueta>
              </p>
              <p className="mt-1.5 max-w-[58ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                {disponivel.descricao}
              </p>
              {disponivel.abas ? (
                <p className="mt-2 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">
                  {disponivel.abas.length} abas:{" "}
                  <span className="text-[var(--tinta-suave)]">{disponivel.abas.join(", ")}</span>
                </p>
              ) : null}
            </div>

            <BotaoGerarPlanilha
              modeloId={disponivel.id}
              clienteId={clienteId}
              consultoriaId={consultoriaId}
              nomeCliente={nomeCliente}
            />
          </div>

          {emFalta.length > 0 ? (
            <div className="mt-5 border-t border-[var(--linha)] pt-4">
              <p className="text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                A Central tem mais {emFalta.length}{" "}
                {emFalta.length === 1 ? "modelo" : "modelos"} previstos —{" "}
                {emFalta.map((m) => m.nome).join(", ")} — ainda não disponíveis.{" "}
                <Link
                  href={`/planilhas?cliente=${encodeURIComponent(clienteId)}`}
                  className="text-oliva hover:underline"
                >
                  Ver o motivo de cada um
                </Link>
                .
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <Aviso tom="atencao" titulo="Nenhum modelo disponível">
          <p>
            O catálogo da Central está sem modelo pronto para gerar arquivo. Abra a Central para ver
            o estado de cada um.
          </p>
        </Aviso>
      )}
    </Secao>
  );
}
