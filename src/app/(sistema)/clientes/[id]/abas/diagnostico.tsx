import Link from "next/link";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import { ListaSinais } from "@/components/ui/sinais";
import { Dado, ListaDados } from "@/components/ui/dados";
import {
  ROTULO_ORIGEM,
  ROTULO_STATUS,
  TOM_STATUS,
  dataEHora,
  desdeQuando,
  sinaisEmTexto,
} from "@/lib/dados";
import { declaracaoPrincipal } from "@/lib/dados/derivacoes";
import type { ClienteOperacao, Diagnostico, Lead } from "@/lib/dados";

/**
 * ABA 2 — DIAGNÓSTICO.
 *
 * O diagnóstico é a origem de tudo: o cliente declarou um problema, alguém
 * leu, e o problema virou cliente. Esta aba mostra essa origem, e por isso
 * ela faz uma coisa que as outras não fazem — devolve o link para o LEAD.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O LEAD DE ORIGEM APARECE AQUI                                  │
 * │                                                                      │
 * │ Depois que alguém vira cliente, é tentador esquecer que um dia foi     │
 * │ lead. Mas é o diagnóstico dele que justifica o escopo contratado — e   │
 * │ quando a consultoria estiver no terceiro mês, é ali que ela vai        │
 * │ reconferir o que ele declarou no começo.                               │
 * │                                                                      │
 * │ Quatro dos cinco clientes da demonstração têm essa ligação. O quinto,  │
 * │ Quintal da Maria, não tem — entrou por indicação — e a tela diz isso   │
 * │ em vez de mostrar uma seção vazia sem explicação.                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function AbaDiagnostico({
  cliente,
  lead,
  diagnostico,
}: {
  cliente: ClienteOperacao;
  lead: Lead | null;
  diagnostico: Diagnostico | null;
}) {
  if (!lead) {
    return (
      <div className="space-y-6">
        <Secao
          rotulo="Origem"
          titulo="Este cliente não veio de um diagnóstico"
          descricao="Ele foi cadastrado direto na carteira, por indicação ou contato direto. Não existe formulário respondido para ler — e isso é uma informação, não uma falta."
        >
          <ListaDados colunas={2}>
            <Dado rotulo="Como chegou">{ROTULO_ORIGEM[cliente.origem]}</Dado>
            <Dado rotulo="Cliente desde">{desdeQuando(cliente.iniciadoEm)}</Dado>
            <Dado rotulo="Problema declarado" largo>
              {cliente.problemaDeclarado}
            </Dado>
          </ListaDados>
        </Secao>

        <Aviso tom="info" titulo="O que o cadastro manual não traz">
          <p>
            Quando o cliente chega por indicação, o contexto do negócio vem de
            conversa, não de formulário: porte, turnos, equipe e o que trava a
            operação. Fica registrado o que a consultora anotou — o que não
            existe é o diagnóstico estruturado que o site produz.
          </p>
        </Aviso>
      </div>
    );
  }

  if (!diagnostico) {
    return (
      <EstadoVazio
        titulo="Lead de origem sem diagnóstico vinculado"
        descricao={`${lead.nomeFantasia} está registrado como origem deste cliente, mas o formulário não ficou vinculado a ele.`}
        acao={
          <Link
            href={`/leads/${lead.id}`}
            className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
          >
            Abrir o lead de origem
          </Link>
        }
      />
    );
  }

  const sinais = sinaisEmTexto(diagnostico);

  return (
    <div className="space-y-6">
      <Secao
        rotulo="Origem do cliente"
        titulo="O diagnóstico que trouxe este cliente"
        descricao="O que ele declarou antes de virar cliente. É o documento que justifica o escopo combinado — e o que serve de linha de base quando a consultoria avançar."
        acoes={
          <div className="flex items-center gap-2.5">
            <Etiqueta tom={TOM_STATUS[lead.status]}>{ROTULO_STATUS[lead.status]}</Etiqueta>
            <Link
              href={`/leads/${lead.id}`}
              className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
            >
              Abrir lead
            </Link>
          </div>
        }
      >
        <ListaDados colunas={3}>
          <Dado rotulo="Recebido em">{dataEHora(diagnostico.respondidoEm)}</Dado>
          <Dado rotulo="Origem">{ROTULO_ORIGEM[lead.origem]}</Dado>
          <Dado rotulo="Chegou">{desdeQuando(lead.criadoEm)}</Dado>
        </ListaDados>

        <div className="mt-6 border-t border-[var(--linha)] pt-5">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            O que ele declarou como maior problema
          </p>
          <blockquote className="mt-3 border-l-2 border-l-oliva/50 pl-4 text-[0.9375rem] leading-relaxed text-tinta">
            {declaracaoPrincipal(diagnostico)}
          </blockquote>
          <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
            Quando ele virou cliente, a consultora resumiu o problema assim:{" "}
            <span className="text-tinta">{cliente.problemaDeclarado}</span>
          </p>
        </div>
      </Secao>

      <Secao
        rotulo="Leitura objetiva"
        titulo="O que o formulário registrou"
        descricao="Cada item é a resposta literal traduzida para linguagem de operação. Nenhum é nota, peso ou classificação — a ordem é a do formulário."
        acoes={
          <Link
            href={`/diagnosticos/${diagnostico.id}`}
            className="text-[0.6875rem] font-semibold tracking-[0.13em] text-oliva uppercase hover:underline"
          >
            Respostas completas
          </Link>
        }
      >
        {sinais.length > 0 ? (
          <ListaSinais sinais={sinais} />
        ) : (
          <p className="text-[0.875rem] text-[var(--tinta-suave)]">
            Nenhum ponto objetivo foi registrado neste diagnóstico — as respostas
            foram abertas.
          </p>
        )}
      </Secao>

      <Aviso tom="info" titulo="A leitura não é uma nota">
        <p>
          Esta tela não diz se o negócio está bem ou mal, nem ordena os pontos
          por gravidade. Os dois exigiriam atribuir peso a cada resposta, e essa
          é uma decisão da consultora — não do sistema. O que está aqui é o que
          o formulário registrou, na ordem em que perguntou.
        </p>
      </Aviso>
    </div>
  );
}
