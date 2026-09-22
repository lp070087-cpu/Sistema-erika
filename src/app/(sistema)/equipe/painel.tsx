"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Aviso, EstadoVazio, Painel, Secao } from "@/components/ui/superficie";
import { Etiqueta } from "@/components/ui/indicador";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { ROTULO_FUNCAO, ROTULO_TURNO, ordenarEquipe, responsaveisDosProcessos, resumirEquipe } from "@/lib/dados/equipe";
import type { Pessoa, Processo, Treinamento } from "@/lib/dados";
import type { ClienteOperacao } from "@/lib/dados";
import { acervoDaEquipe, treinamentosDaEquipe } from "@/lib/dados/demonstracao";
import { NovaPessoa } from "./nova";
import { FichaDaPessoa } from "./ficha-da-pessoa";

/**
 * EQUIPE — o painel.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A TELA ABRE ÚTIL COM O CADASTRO VAZIO                         │
 * │                                                                      │
 * │ Nada foi inventado para preencher a lista: `mock/operacao.ts` não tem  │
 * │ equipe, e uma pessoa com nome, função e turno seria alguém que a       │
 * │ consultora não cadastrou.                                             │
 * │                                                                      │
 * │ Mas o repositório TEM nomes de execução — dentro dos processos. Eles   │
 * │ estão escritos de todos os jeitos: `"Érika Bruna"`, `"Juliana"`,       │
 * │ `"Juliana (auxiliar de cozinha)"`, `"Cozinha"`, `"Salão"`, `"A definir  │
 * │ com o Marcelo"`. Ler esses nomes e dizer quais NÃO correspondem a      │
 * │ ninguém do cadastro é resposta suficiente para a tela abrir útil: a    │
 * │ lista de nomes sem cadastro é a primeira pergunta a responder, e ela   │
 * │ não depende de nada estar preenchido.                                  │
 * │                                                                      │
 * │ A DEDUPLICAÇÃO POR TEXTO é por isso e não é cosmética: "Cozinha"       │
 * │ aparece em três processos e é a MESMA pergunta uma vez só. Sem ela, a  │
 * │ lista pareceria maior do que a pendência é.                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA DELIBERADAMENTE NÃO MOSTRA                            │
 * │                                                                      │
 * │ Não há "cobertura de treinamento em %". Cem por cento numa cozinha     │
 * │ onde ninguém executa nada é um número perfeito e vazio. O que aparece  │
 * │ são CONTAGENS — quantas pessoas, quantos preparos sem registro — e     │
 * │ cada uma responde uma pergunta que ela fez. Ver `resumirEquipe`.       │
 * │                                                                      │
 * │ Não há hierarquia. `ORDEM_FUNCAO` é ordem de apresentação, e o menu de │
 * │ função diz isso na ajuda. O sistema não sabe quem manda em quem.        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ISOLAÇÃO POR CLIENTE É ESTRUTURAL                                   │
 * │                                                                      │
 * │ `responsaveisDosProcessos` monta a equipe do cliente DE DENTRO do      │
 * │ processo — quem chama não escolhe o cliente e por isso não escolhe     │
 * │ errado. É a mesma regra do `resolver()` da precificação: para um nome  │
 * │ de outro cliente entrar na conta, alguém teria de trocar a chave de    │
 * │ propósito.                                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export type CenarioDaEquipe = {
  pessoas: readonly Pessoa[];
  treinamentos: readonly Treinamento[];
  clientes: readonly ClienteOperacao[];
  processos: readonly Processo[];
  pratosPorCliente: Readonly<Record<string, readonly string[]>>;
};

/** O que conta como "sem cadastro": o texto escrito, com quantos processos o usam. */
type NomeForaDoCadastro = {
  id: string;
  escrito: string;
  onde: readonly string[];
};

export function PainelDaEquipe({ doCenario }: { doCenario: CenarioDaEquipe }) {
  /*
    A versão entra na lista de dependências e isso não é detalhe: as funções do
    store leem estado do módulo, e o React não tem como saber disso — para ele
    a função é a mesma de antes. Este número é a única coisa que muda quando uma
    pessoa é cadastrada, um treinamento é registrado ou alguém sai da equipe.

    Por que da chave, e não só da dependência: `PESSOAS_POR_ENQUANTO` e
    `TREINAMENTOS_POR_ENQUANTO` são constantes VAZIAS fora do React, então elas
    NÃO mudam de identidade quando alguém é cadastrado. As listas são
    reconstruídas quando elas mudam E quando o invalidador muda. O `void` é a
    leitura que declara isso ao lint — a mesma que `cardapios/editor.tsx` já faz.
  */
  const versao = useDemonstracao();

  const [cliente, setCliente] = useState("");
  const [funcao, setFuncao] = useState("");
  /*
    `aberta` guarda o ID, e não a pessoa. É o que torna a leitura resistente ao
    que a própria ficha escreve: salvar o nome de alguém cria um registro novo
    no store, e um `Pessoa` capturado no `useState` continuaria sendo o antigo
    — o cabeçalho mostraria o nome velho depois de salvar o novo.
  */
  const [aberta, setAberta] = useState<string | null>(null);

  const pessoas = useMemo(() => {
    void versao;
    return acervoDaEquipe(doCenario.pessoas);
  }, [doCenario.pessoas, versao]);
  const treinamentos = useMemo(
    () => {
      void versao;
      return treinamentosDaEquipe(doCenario.treinamentos);
    },
    [doCenario.treinamentos, versao]
  );

  const clientePorId = useMemo(
    () => new Map(doCenario.clientes.map((c) => [c.id, c])),
    [doCenario.clientes]
  );

  const pessoaPorId = useMemo(() => new Map(pessoas.map((p) => [p.id, p])), [pessoas]);

  /*
    Os responsáveis escritos nos processos do cenário, já casados com a equipe.
    Lidos dos PROCESSOS e não das ações: a ação é "o que ela combinou com o
    cliente", e quem executa na cozinha está no processo. Misturar os dois
    daria uma lista de nomes sem cadastro que incluiria a própria consultora.
  */
  const lidos = useMemo(
    () => responsaveisDosProcessos(doCenario.processos, pessoaPorId),
    [doCenario.processos, pessoaPorId]
  );

  /*
    O resumo é sobre a CARTEIRA, não sobre o filtro — pelo mesmo motivo que o
    contador de uma lista diz "x de y": o filtro é uma lente, e um resumo que
    mudasse com ele faria "3 pessoas" virar "1 pessoa" ao filtrar por função, o
    que ninguém leria como "3 no total, 1 mostrada".
  */
  const resumo = useMemo(
    () => resumirEquipe(pessoas, treinamentos, lidos),
    [pessoas, treinamentos, lidos]
  );

  const linhas = useMemo(() => {
    const ordenadas = ordenarEquipe(pessoas);
    return ordenadas.filter((p) => {
      if (cliente && p.clienteId !== cliente) return false;
      if (funcao && p.funcao !== funcao) return false;
      return true;
    });
  }, [pessoas, cliente, funcao]);

  /*
    ── O FIM DA COBERTURA POR CLIENTE ─────────────────────────────────────
    Cada pessoa precisa do próprio recorte: quem executa o quê, sem registro.
    O resumo geral já traz a lista, mas indexada por pessoa — e uma busca
    linear dentro do `map` da lista faria a coluna ser O(n²) sem necessidade.
  */
  const pendenciaPorPessoa = useMemo(() => {
    const indice = new Map<string, number>();
    for (const c of resumo.executandoSemTreinamento) {
      indice.set(c.pessoa.id, c.semTreinamento.length);
    }
    return indice;
  }, [resumo]);

  /*
    Os nomes fora do cadastro, agrupados por TEXTO — não por pessoa, porque
    não há pessoa. O agrupamento é o que evita a mesma pergunta repetida
    cinco vezes, e o "onde" mostra em que processos o nome aparece.
  */
  const foraDoCadastro = useMemo<NomeForaDoCadastro[]>(() => {
    const porTexto = new Map<string, NomeForaDoCadastro>();

    for (const lido of lidos) {
      if (lido.pessoa !== null) continue;
      const existente = porTexto.get(lido.escrito);
      if (existente) {
        if (!existente.onde.includes(lido.onde)) {
          porTexto.set(lido.escrito, { ...existente, onde: [...existente.onde, lido.onde] });
        }
        continue;
      }
      porTexto.set(lido.escrito, { id: lido.escrito, escrito: lido.escrito, onde: [lido.onde] });
    }

    return [...porTexto.values()].sort((a, b) => a.escrito.localeCompare(b.escrito, "pt-BR"));
  }, [lidos]);

  /*
    Os nomes já cadastrados, POR CLIENTE, para o formulário poder avisar antes
    de cadastrar um nome repetido. Calculado aqui porque é aqui que a equipe
    inteira está na memória.
  */
  const nomesDoCliente = useMemo(() => {
    const indice = new Map<string, string[]>();
    for (const p of pessoas) {
      indice.set(p.clienteId, [...(indice.get(p.clienteId) ?? []), p.nome]);
    }
    return indice as ReadonlyMap<string, readonly string[]>;
  }, [pessoas]);

  /*
    ── OS PREPAROS QUE A OPERAÇÃO JÁ CONHECE ──────────────────────────────
    De duas fontes, e as duas são nomes que JÁ existem: os nomes das fichas do
    cliente e os preparos que os processos dele citam. É o que o `<datalist>`
    da ficha da pessoa oferece.

    O que NÃO entra: nada inventado a partir da função ou do turno. Um preparo
    sugerido que não existe faria ela declarar execução de um prato que a
    cozinha não faz.
  */
  const preparosPorCliente = useMemo(() => {
    const indice = new Map<string, string[]>();
    for (const c of doCenario.clientes) {
      const deFichas = doCenario.pratosPorCliente[c.id] ?? [];
      const deProcessos = doCenario.processos
        .filter((p) => p.clienteId === c.id)
        .flatMap((p) => p.pratos);
      indice.set(c.id, [...new Set([...deFichas, ...deProcessos])].sort((a, b) => a.localeCompare(b, "pt-BR")));
    }
    return indice;
  }, [doCenario.clientes, doCenario.pratosPorCliente, doCenario.processos]);

  const clienteNome = (id: string) => clientePorId.get(id)?.nomeFantasia ?? "Cliente não encontrado";

  const colunas: ColunaLista<Pessoa>[] = [
    {
      chave: "nome",
      titulo: "Pessoa",
      destaque: true,
      noCartao: "topo",
      valor: (p) => (
        <>
          <button
            type="button"
            onClick={() => setAberta(p.id)}
            className="text-left text-[0.9375rem] font-medium text-tinta underline-offset-4 hover:underline"
          >
            {p.nome}
          </button>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {clienteNome(p.clienteId)}
          </span>
        </>
      ),
    },
    {
      chave: "funcao",
      titulo: "Função",
      noCartao: "linha",
      valor: (p) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">{ROTULO_FUNCAO[p.funcao]}</span>
      ),
    },
    {
      chave: "turno",
      titulo: "Turno",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (p) => (
        <span className="text-[0.875rem] text-[var(--tinta-suave)]">{ROTULO_TURNO[p.turno]}</span>
      ),
    },
    {
      chave: "executa",
      titulo: "Executa",
      align: "dir",
      noCartao: "linha",
      valor: (p) => (
        <span className="tabular text-[0.9375rem] text-tinta">
          {p.pratos.length === 0 ? (
            <span className="text-[0.875rem] text-[var(--tinta-fraca)]">—</span>
          ) : (
            p.pratos.length
          )}
        </span>
      ),
    },
    {
      chave: "pendencia",
      titulo: "Sem treinamento",
      noCartao: "linha",
      valor: (p) => {
        const quantos = pendenciaPorPessoa.get(p.id) ?? 0;
        if (quantos === 0) {
          return <span className="text-[0.875rem] text-[var(--tinta-fraca)]">—</span>;
        }
        return (
          <Etiqueta tom="dourado">
            {quantos} {quantos === 1 ? "preparo" : "preparos"}
          </Etiqueta>
        );
      },
    },
    {
      chave: "situacao",
      titulo: "Situação",
      noCartao: "linha",
      valor: (p) => (
        <Etiqueta tom={p.situacao === "DESLIGADA" ? "neutro" : "oliva"}>
          {p.situacao === "DESLIGADA" ? "Saiu da equipe" : "Na ativa"}
        </Etiqueta>
      ),
    },
    {
      chave: "acao",
      titulo: "",
      noCartao: "linha",
      valor: (p) => (
        <button
          type="button"
          onClick={() => setAberta(p.id)}
          className="text-[0.8125rem] text-oliva underline-offset-4 hover:underline"
        >
          Abrir
        </button>
      ),
    },
  ];

  const pessoaAberta = aberta ? (pessoaPorId.get(aberta) ?? null) : null;

  return (
    <div className="space-y-6">
      {/*
        ── O QUE A TELA RESPONDE HOJE ─────────────────────────────────────
        Quatro contagens, e nenhuma delas é percentual. Cada uma responde uma
        pergunta que ela fez, e as quatro saem do mesmo resumo — não há uma
        segunda conta escrita na tela que pudesse divergir.
      */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Contagem
          rotulo="Pessoas na equipe"
          valor={resumo.total}
          detalhe={
            resumo.total === 0
              ? "Nenhuma cadastrada"
              : `${resumo.ativas} na ativa${resumo.total > resumo.ativas ? ` · ${resumo.total - resumo.ativas} fora` : ""}`
          }
        />
        <Contagem
          rotulo="Nomes nos processos"
          valor={new Set(lidos.map((l) => l.escrito)).size}
          detalhe={
            foraDoCadastro.length === 0
              ? "Todos correspondem a alguém"
              : `${foraDoCadastro.length} sem cadastro`
          }
        />
        <Contagem
          rotulo="Executando sem treinamento"
          valor={resumo.pessoasComPendencia}
          detalhe={
            resumo.pessoasComPendencia === 0
              ? "Nenhuma pendência"
              : `${resumo.pratosSemTreinamento} ${resumo.pratosSemTreinamento === 1 ? "preparo" : "preparos"} sem registro`
          }
        />
        <Contagem
          rotulo="Executam algum preparo"
          valor={resumo.pessoasQueExecutam}
          detalhe={
            resumo.total === 0
              ? "Sem equipe cadastrada"
              : `de ${resumo.total} ${resumo.total === 1 ? "pessoa" : "pessoas"}`
          }
        />
      </div>

      {/*
        A PENDÊNCIA "COZINHA" — as duas listas que a tela entrega, juntas, e por
        isso no alto: é o que ela leva embora desta página.
      */}
      {foraDoCadastro.length > 0 || resumo.pessoasComPendencia > 0 ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {foraDoCadastro.length > 0 ? (
            <Secao
              rotulo={`${foraDoCadastro.length} ${foraDoCadastro.length === 1 ? "nome" : "nomes"}`}
              titulo="Escritos nos processos, sem cadastro"
              descricao="Nomes de execução que a operação já usa e que não correspondem a ninguém da equipe. Um nome aqui é uma pergunta, não um erro."
            >
              <ul className="divide-y divide-[var(--linha)]">
                {foraDoCadastro.map((n) => (
                  <li key={n.id} className="py-2.5">
                    <p className="text-[0.875rem] text-tinta">{n.escrito}</p>
                    <p className="mt-0.5 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                      {n.onde.join(" · ")}
                    </p>
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t border-[var(--linha)] pt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                Nada foi reescrito nos processos. &ldquo;A definir com o Marcelo&rdquo; continua
                exatamente como foi escrito: não é o nome de ninguém, e é uma informação sobre o
                estágio do trabalho. Convertido, viraria &ldquo;sem responsável&rdquo; e esconderia
                que há alguém cuidando disso.
              </p>
            </Secao>
          ) : null}

          {resumo.pessoasComPendencia > 0 ? (
            <Secao
              rotulo={`${resumo.pratosSemTreinamento} ${resumo.pratosSemTreinamento === 1 ? "preparo" : "preparos"}`}
              titulo="Executam preparo sem registro de treinamento"
              descricao="O rótulo é o que foi medido. Não é o mesmo que “não sabe fazer”: pode haver treinamento feito e não anotado."
            >
              <ul className="space-y-3">
                {resumo.executandoSemTreinamento.map((c) => (
                  <li key={c.pessoa.id} className="rounded-[var(--raio-sm)] border border-[var(--linha)] px-3.5 py-3">
                    <button
                      type="button"
                      onClick={() => setAberta(c.pessoa.id)}
                      className="text-[0.875rem] font-medium text-tinta underline-offset-4 hover:underline"
                    >
                      {c.pessoa.nome}
                    </button>
                    <span className="ml-2 text-[0.75rem] text-[var(--tinta-fraca)]">
                      {clienteNome(c.pessoa.clienteId)} · {ROTULO_FUNCAO[c.pessoa.funcao]}
                    </span>
                    <ul className="mt-2 space-y-1">
                      {c.semTreinamento.map((preparo) => (
                        <li
                          key={preparo}
                          className="flex items-baseline gap-2 text-[0.8125rem] text-[var(--tinta-suave)]"
                        >
                          <span aria-hidden className="mt-1.5 h-px w-3 shrink-0 bg-dourado" />
                          {preparo}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </Secao>
          ) : null}
        </div>
      ) : null}

      {resumo.nomesRepetidos.length > 0 ? (
        <Aviso tom="atencao" titulo="Dois cadastros com o mesmo nome no mesmo cliente">
          <p>
            O nome escrito nos processos é comparado por igualdade: os dois vão casar com o mesmo
            registro, e os preparos contados para um vão aparecer contados para o outro. Um
            sobrenome separa os dois — o cadastro continua aceitando os dois, mas o número de
            preparos por pessoa fica ambíguo enquanto isso.
          </p>
          <p className="mt-2">{resumo.nomesRepetidos.join(" · ")}</p>
        </Aviso>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <NovaPessoa clientes={doCenario.clientes} nomesDoCliente={nomesDoCliente} />
      </div>

      <Secao
        rotulo={`${linhas.length} de ${resumo.total}`}
        titulo="Equipe"
        descricao="Quem executa na cozinha do cliente. A lista mostra a carteira inteira — o filtro recorta a visão, não as contagens acima."
      >
        <BarraDaEquipe
          clientes={doCenario.clientes}
          cliente={cliente}
          funcao={funcao}
          aoTrocarCliente={setCliente}
          aoTrocarFuncao={setFuncao}
        />

        <div className="mt-5">
          <ListaResponsiva
            itens={linhas}
            colunas={colunas}
            vazio={
              resumo.total === 0 ? (
                <EstadoVazio
                  titulo="Nenhuma pessoa cadastrada ainda"
                  descricao="Nenhuma equipe foi inventada para preencher esta lista: nome, função e turno seriam alguém que você não cadastrou. O que já dá resultado é a leitura acima — os nomes escritos nos processos que ainda não correspondem a ninguém."
                  acao={<NovaPessoa clientes={doCenario.clientes} nomesDoCliente={nomesDoCliente} />}
                />
              ) : (
                <EstadoVazio
                  titulo="Nenhuma pessoa com esses filtros"
                  descricao="Existem pessoas cadastradas, mas nenhuma bate com a combinação atual."
                  acao={
                    <button
                      type="button"
                      onClick={() => {
                        setCliente("");
                        setFuncao("");
                      }}
                      className="text-[0.8125rem] text-oliva hover:text-tinta"
                    >
                      Limpar os filtros
                    </button>
                  }
                />
              )
            }
          />
        </div>
      </Secao>

      <Secao
        titulo="O caminho até aqui"
        descricao="O nome do processo é texto; o cadastro é o que transforma esse texto em contagem."
      >
        <div className="space-y-3 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          <p>
            Os{" "}
            <Link href="/processos" className="text-oliva hover:underline">
              processos
            </Link>{" "}
            do cliente gravam o responsável de cada praça e de cada passo. Enquanto esse campo for
            texto livre, &ldquo;quantos preparos a Juliana executa&rdquo; não tem resposta — o
            mesmo nome aparece escrito de três jeitos e às vezes aparece como praça
            (&ldquo;Cozinha&rdquo;) em vez de pessoa.
          </p>
          <p>
            Declarar o que cada pessoa executa aqui, com o treinamento ao lado, é o que fecha a
            conta. O que o sistema ainda não faz é o encaminhamento: a pendência aparece, e o que
            fazer com ela continua sendo decisão sua.
          </p>
        </div>
      </Secao>

      {/*
        ── A `key` NÃO É DECORAÇÃO ────────────────────────────────────────
        A ficha guarda os campos em estado local até o botão Salvar. Sem
        trocar a `key` a cada pessoa, o React REAPROVEITA o mesmo componente:
        fechar a ficha da Juliana e abrir a do Marcelo mostraria os campos da
        Juliana preenchidos com o nome do Marcelo no cabeçalho — e um clique
        em Salvar gravaria isso.

        Com a `key`, trocar de pessoa REMONTA o componente e os rascunhos
        nascem do zero a partir do registro certo. É o que faz o descarte
        silencioso (fechar sem salvar) ser descarte de verdade.
      */}
      <FichaDaPessoa
        key={pessoaAberta?.id ?? "nenhuma"}
        pessoa={pessoaAberta}
        pessoas={pessoas}
        treinamentos={treinamentos}
        cliente={pessoaAberta ? clienteNome(pessoaAberta.clienteId) : ""}
        preparos={pessoaAberta ? (preparosPorCliente.get(pessoaAberta.clienteId) ?? []) : []}
        aoFechar={() => setAberta(null)}
      />
    </div>
  );
}

/**
 * UMA CONTAGEM DO TOPO.
 *
 * Não é um `Indicador`: indicador compara com uma meta ou com o período
 * anterior, e aqui não há meta nenhuma definida nem histórico. É o que o número
 * é — uma contagem do que existe hoje.
 */
function Contagem({
  rotulo,
  valor,
  detalhe,
}: {
  rotulo: string;
  valor: number;
  detalhe: string;
}) {
  return (
    <Painel>
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </p>
      <p className="tabular mt-2 text-[1.75rem] leading-none text-profundo">{valor}</p>
      <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">{detalhe}</p>
    </Painel>
  );
}

/**
 * OS DOIS FILTROS DA EQUIPE.
 *
 * Escritos à mão em vez de usar a `BarraFiltros` — e a diferença é a URL. A
 * `BarraFiltros` é de OUTRA tela: ela navega para a mesma rota sem query,
 * ou seja, apagaria o recorte que outra lista tivesse declarado. Aqui o
 * recorte é local de propósito: esta tela não é endereçável por link, e
 * inventar uma URL para ela criaria um endereço que ninguém compartilha.
 */
function BarraDaEquipe({
  clientes,
  cliente,
  funcao,
  aoTrocarCliente,
  aoTrocarFuncao,
}: {
  clientes: readonly ClienteOperacao[];
  cliente: string;
  funcao: string;
  aoTrocarCliente: (v: string) => void;
  aoTrocarFuncao: (v: string) => void;
}) {
  const estilo =
    "h-9 min-w-[150px] cursor-pointer appearance-none rounded-[var(--raio-sm)] border " +
    "border-[var(--linha-forte)] bg-white/70 px-3 text-[0.875rem] text-tinta " +
    "transition-colors duration-150 hover:border-[var(--tinta-fraca)] " +
    "focus:border-oliva focus:bg-white focus:outline-none";

  return (
    <div className="nao-imprimir flex flex-wrap items-center gap-2.5">
      <label htmlFor="equipe-cliente" className="sr-only">
        Cliente
      </label>
      <select
        id="equipe-cliente"
        value={cliente}
        onChange={(e) => aoTrocarCliente(e.target.value)}
        className={estilo}
      >
        <option value="">Cliente</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nomeFantasia}
          </option>
        ))}
      </select>

      <label htmlFor="equipe-funcao" className="sr-only">
        Função
      </label>
      <select
        id="equipe-funcao"
        value={funcao}
        onChange={(e) => aoTrocarFuncao(e.target.value)}
        className={estilo}
      >
        <option value="">Função</option>
        {Object.entries(ROTULO_FUNCAO).map(([valor, texto]) => (
          <option key={valor} value={valor}>
            {texto}
          </option>
        ))}
      </select>

      {cliente || funcao ? (
        <button
          type="button"
          onClick={() => {
            aoTrocarCliente("");
            aoTrocarFuncao("");
          }}
          className="h-9 rounded-[var(--raio-sm)] px-2.5 text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-suave)] uppercase transition-colors hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta"
        >
          Limpar
        </button>
      ) : null}
    </div>
  );
}

