import Link from "next/link";
import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { passosSemTempo, somaDosTemposDeclarados } from "@/lib/dados";
import type { ClienteOperacao, Processo } from "@/lib/dados";

/**
 * ABA 5 — PROCESSOS E PRAÇAS.
 *
 * Lista as praças da cozinha deste cliente com turno, responsável, pratos
 * que passam por ali e quantos passos já têm tempo declarado.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O TEMPO AQUI É DECLARADO, NÃO CRONOMETRADO                           │
 * │                                                                      │
 * │ "1 min" no passo não é medição do sistema: é o número que a equipe    │
 * │ informou. O sistema não cronometra nada — ele guarda o que foi dito.  │
 * │                                                                      │
 * │ E quando nenhum passo tem tempo, a soma é `null`, não zero. Zero     │
 * │ afirmaria que o processo leva zero minutos, o que é falso sobre a     │
 * │ cozinha de alguém. A tela mostra "sem tempo declarado" nesse caso.    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AbaProcessos({
  cliente,
  processos,
}: {
  cliente: ClienteOperacao;
  processos: readonly Processo[];
}) {
  const colunas: ColunaLista<Processo>[] = [
    {
      chave: "praca",
      titulo: "Praça",
      destaque: true,
      noCartao: "topo",
      valor: (p) => (
        <>
          <span className="block text-[0.9375rem] font-medium text-tinta">{p.praca}</span>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {p.turno}
          </span>
        </>
      ),
    },
    {
      chave: "responsavel",
      titulo: "Responsável",
      noCartao: "linha",
      valor: (p) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">{p.responsavel}</span>
      ),
    },
    {
      chave: "pratos",
      titulo: "Pratos",
      align: "dir",
      ocultaEm: "md",
      noCartao: "linha",
      valor: (p) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {p.pratos.length}
        </span>
      ),
    },
    {
      chave: "passos",
      titulo: "Passos",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (p) => (
        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
          {p.passos.length}
        </span>
      ),
    },
    {
      chave: "tempo",
      titulo: "Tempo declarado",
      align: "dir",
      noCartao: "linha",
      valor: (p) => {
        const semTempo = passosSemTempo(p);
        if (semTempo === p.passos.length) {
          return <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem tempo</span>;
        }
        const soma = somaDosTemposDeclarados(p, "todos");
        return (
          <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
            {soma} min
            {semTempo > 0 ? (
              <span className="ml-1.5 text-[0.75rem] text-[var(--tinta-fraca)]">
                ({semTempo} sem tempo)
              </span>
            ) : null}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Secao
        rotulo="Processos e praças"
        titulo={
          processos.length === 0
            ? "Nenhum processo mapeado"
            : `${processos.length} ${processos.length === 1 ? "processo mapeado" : "processos mapeados"}`
        }
        descricao={`Os fluxos de finalização de ${cliente.nomeFantasia}, com a ordem dos passos, quem executa e o tempo que a equipe declarou em cada um.`}
      >
        <ListaResponsiva
          itens={processos}
          colunas={colunas}
          href={(p) => `/processos/${p.id}`}
          vazio={
            <EstadoVazio
              titulo="Nenhum processo mapeado ainda"
              descricao="O processo é escrito durante a visita, observando o serviço. Cada passo vira uma linha com quem executa e quanto tempo leva."
            />
          }
        />
      </Secao>

      <Aviso tom="info" titulo="Por que este módulo importa mais do que parece">
        <p>
          Um padrão de montagem afixado no passe é o que faz o prato sair igual
          nos dois turnos. Sem ele, cada pessoa monta de um jeito e a porção
          varia — e é essa variação que come a margem sem aparecer em lugar
          nenhum.
        </p>
        <p className="mt-2.5">
          O sistema não decide a ordem nem o tempo: ele registra o que a equipe
          faz, para que o combinado deixe de depender da memória de quem está
          no turno.
        </p>
      </Aviso>

      <p className="text-[0.8125rem] text-[var(--tinta-fraca)]">
        Todos os processos, de todos os clientes, ficam em{" "}
        <Link href="/processos" className="text-oliva hover:underline">
          Processos e praças
        </Link>
        .
      </p>
    </div>
  );
}
