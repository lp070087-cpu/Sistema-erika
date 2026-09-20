"use client";

import { useEffect, useRef, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Aviso, EstadoVazio } from "@/components/ui/superficie";
import { cn } from "@/lib/utils/cn";
import { montarContexto } from "@/lib/planilhas/contexto";
import { montarGradeDoRelatorio } from "@/lib/planilhas/modelos/relatorio-consultoria";
import { montarGradeDaFichaTecnica } from "@/lib/planilhas/modelos/ficha-tecnica";
import { montarGradeDeCustos } from "@/lib/planilhas/modelos/custos-precificacao";
import type { GradeDaPlanilha } from "@/lib/planilhas/grade";
import type { ModeloPlanilha } from "@/lib/planilhas/tipos";
import { modeloDisponivel } from "@/lib/planilhas/modelos";
import { PreviaDaPlanilha } from "@/components/ui/previa-tabular";
import { BotaoGerarPlanilha } from "./gerar";
import { SeletorDeCliente } from "./seletor";
import { SeletorDeModelo } from "./seletor-modelo";

/**
 * O AMBIENTE DE PLANILHA DA CENTRAL.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ORDEM DA TELA É A ORDEM DO TRABALHO                                │
 * │                                                                      │
 * │   SELETORES COMPACTOS   cliente, planilha, consultoria — uma linha    │
 * │        ↓                                                             │
 * │   BARRA COMPACTA        quem, quando, e o que dá para fazer           │
 * │        ↓                                                             │
 * │   ABAS DAS FOLHAS       Resumo | Tarefas | Acompanhamentos | ...      │
 * │        ↓                                                             │
 * │   UMA GRANDE GRADE      o conteúdo da aba escolhida                   │
 * │                                                                      │
 * │ E é isso. Não há faixa de aviso explicando o que se está vendo, não   │
 * │ há título de seção por cima de cada tabela, não há cartão envolvendo  │
 * │ a grade. Quem trabalha em planilha lê a planilha.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE ARQUIVO É DE CLIENTE, E POR QUE ISSO É UM GANHO         │
 * │                                                                      │
 * │ A versão anterior recortava os dados na PÁGINA (servidor), montava a  │
 * │ prévia lá, e só o seletor era de cliente. Trocar de modelo exigia     │
 * │ recarregar — porque modelo não estava na URL, e porque o servidor     │
 * │ não tem como reagir a um clique.                                      │
 * │                                                                      │
 * │ Aqui, `montarContexto` e os três `montarGrade*` rodam NO NAVEGADOR.   │
 * │ Funciona porque todos eles são PUROS: nenhum importa `exceljs`,       │
 * │ nenhum importa `server-only`. É exatamente para isso que a separação  │
 * │ entre `grade.ts` (puro) e `escrever-grade.ts` (servidor) existe — e   │
 * │ era o objetivo declarado dela desde o começo.                         │
 * │                                                                      │
 * │ O ganho é concreto: trocar de planilha é instantâneo, e as abas       │
 * │ dentro de uma planilha trocam sem tocar no servidor.                  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO NÃO FAZ — E O QUE ELE NÃO FINGE                   │
 * │                                                                      │
 * │ NÃO HÁ EDIÇÃO AQUI. A grade é somente-leitura, e o botão de editar    │
 * │ abre a TELA DE ORIGEM do dado — a ficha, o ingrediente — que é onde   │
 * │ a edição sempre morou. Criar um segundo caminho de escrita faria da   │
 * │ Central uma segunda fonte de dados, que é o que o briefing proíbe.    │
 * │                                                                      │
 * │ E não há promessa de persistência: o banco não está ligado, então     │
 * │ editar numa tela não sobrevive ao recarregamento. A tela não diz que  │
 * │ salva.                                                                │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** Os modelos que sabem montar uma grade hoje. Os outros não têm gerador. */
const GERADORES: Record<string, (ctx: Parameters<typeof montarGradeDoRelatorio>[0]) => GradeDaPlanilha> = {
  "relatorio-consultoria": montarGradeDoRelatorio,
  "ficha-tecnica": montarGradeDaFichaTecnica,
  "custos-precificacao": montarGradeDeCustos,
};

/**
 * A ONDE O DADO SE EDITA — por modelo.
 *
 * O botão de editar não edita: ele LEVA à tela onde a edição já existe. É a
 * diferença entre "a planilha é a fonte" e "a planilha é uma vista da fonte",
 * e é a segunda que o sistema sustenta desde o começo.
 */
const TELA_DE_ORIGEM: Record<string, { href: string; rotulo: string }> = {
  "relatorio-consultoria": { href: "/tarefas", rotulo: "Editar tarefas" },
  "ficha-tecnica": { href: "/fichas", rotulo: "Editar fichas" },
  "custos-precificacao": { href: "/precificacao", rotulo: "Ver precificação" },
};

export function AmbienteDaPlanilha({
  modelos,
  clientes,
  clienteInicial,
  modeloInicial,
}: {
  /** O catálogo inteiro, para o seletor — inclusive o que ainda não sai. */
  modelos: readonly ModeloPlanilha[];
  clientes: readonly { id: string; nomeFantasia: string; cidade: string }[];
  /** O cliente que veio da URL — a tela já abre na planilha dele. */
  clienteInicial?: string | null;
  /** O modelo escolhido pela URL, quando veio de uma tela específica. */
  modeloInicial?: string | null;
}) {
  const [modeloId, definirModeloId] = useState(
    modeloInicial && modeloDisponivel(modeloInicial) ? modeloInicial : "relatorio-consultoria"
  );

  /*
    O CLIENTE INICIAL, E A CARGA QUE ELE DISPARA.

    Quando ela chega de `/clientes/[id]` ou da consultoria, a URL já traz o
    cliente — e aí a planilha deve estar montada na primeira pintura, não
    esperando um clique. É o estado inicial do `useState` fazendo o trabalho
    de um efeito: o valor já está certo antes do primeiro render, e o efeito
    abaixo só precisa buscar os dados uma vez.

    Sem cliente na URL, o seletor começa vazio e a tela convida a escolher.
    */
  const [clienteId, definirClienteId] = useState(clienteInicial ?? "");
  const [consultoriaTitulo, definirConsultoriaTitulo] = useState<string | null>(null);
  const [grade, definirGrade] = useState<GradeDaPlanilha | null>(null);
  const [problema, definirProblema] = useState<string | null>(null);
  const [montando, definirMontando] = useState(false);

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const modelo = modelos.find((m) => m.id === modeloId) ?? null;

  /*
    A GRADE É MONTADA UMA VEZ POR ESCOLHA, e não a cada render.

    `montarContexto` é assíncrona e lê o repositório inteiro — tarefas,
    acompanhamentos, fichas, ingredientes. Chamá-la no corpo do componente
    dispararia uma leitura por repintura. Ela roda dentro do `carregar()`,
    que é chamado quando o cliente ou o modelo muda.

    O estado guarda a GRADE, não o contexto: a grade é o que a tela desenha,
    e guardá-la evita remontar tudo a cada clique de aba.
  */
  async function carregar(escolhidoCliente: string, escolhidoModelo: string) {
    definirProblema(null);

    const gerador = GERADORES[escolhidoModelo];
    if (!escolhidoCliente || !gerador) {
      definirGrade(null);
      definirConsultoriaTitulo(null);
      return;
    }

    definirMontando(true);
    try {
      const contexto = await montarContexto(escolhidoCliente, { geradoEm: new Date() });
      if (!contexto) {
        definirGrade(null);
        definirProblema("O cliente escolhido não foi encontrado.");
        return;
      }
      definirConsultoriaTitulo(contexto.consultoria?.titulo ?? null);
      definirGrade(gerador(contexto));
    } catch {
      definirGrade(null);
      definirProblema(
        "Não foi possível montar a planilha com os dados de agora. Os dados continuam intactos — tente escolher de novo."
      );
    } finally {
      definirMontando(false);
    }
  }

  /*
    A CARGA AUTOMÁTICA QUANDO A URL JÁ TRAZIA O CLIENTE.

    Um `useEffect` com lista de dependências VAZIA, e não `[clienteId]`. Isso é
    deliberado: com `[clienteId]` o efeito dispararia também nas trocas feitas
    pelo seletor, e o `carregar` do handler rodaria junto — duas leituras por
    troca. A lista vazia diz o que se quer: buscar uma vez, na montagem, e só
    quando a montagem já tem cliente.

    A trava de `useRef` existe para o StrictMode do React em desenvolvimento,
    que monta o componente duas vezes de propósito. Sem ela, a bancada de
    desenvolvimento faria duas leituras por abertura de tela.
  */
  const jaCarregou = useRef(false);
  useEffect(() => {
    if (jaCarregou.current) return;
    if (!clienteId) return;
    jaCarregou.current = true;
    void carregar(clienteId, modeloId);
    /*
      As dependências são de propósito somente estas duas: o efeito reage ao
      que veio do servidor, e nada mais. `carregar` é recriada a cada render —
      incluí-la faria o efeito rodar sempre, que é o defeito clássico.
    */
  }, [clienteId, modeloId]);

  return (
    <div className="space-y-3">
      <Seletores
        modelos={modelos}
        clientes={clientes}
        modeloId={modeloId}
        clienteId={clienteId}
        consultoriaTitulo={consultoriaTitulo}
        clienteEscolhido={cliente !== null}
        aoTrocarCliente={(id) => {
          definirClienteId(id);
          void carregar(id, modeloId);
        }}
        aoTrocarModelo={(id) => {
          definirModeloId(id);
          void carregar(clienteId, id);
        }}
        aoCarregar={() => void carregar(clienteId, modeloId)}
        carregando={montando}
      />

      {problema ? (
        <Aviso tom="atencao" titulo="A planilha não foi montada">
          <p>{problema}</p>
        </Aviso>
      ) : null}

      {!cliente ? (
        <EstadoVazio
          titulo="Escolha um cliente"
          descricao="A planilha é sempre de um cliente. Escolha ao lado e a grade aparece aqui, com as abas do arquivo."
        />
      ) : !grade ? (
        <EstadoVazio
          titulo={montando ? "Montando a planilha…" : "Monte a planilha"}
          descricao={`Cliente escolhido: ${cliente.nomeFantasia}. ${modelo ? `Modelo: ${modelo.nome}.` : "Escolha também a planilha."} Clique em abrir planilha para ver a grade.`}
        />
      ) : (
        <PreviaDaPlanilha
          grade={grade}
          nomeCliente={cliente.nomeFantasia}
          altura={620}
          acoes={
            <>
              {TELA_DE_ORIGEM[modeloId] ? (
                <a
                  href={TELA_DE_ORIGEM[modeloId].href}
                  className="text-[0.75rem] text-oliva underline-offset-2 hover:underline"
                >
                  {TELA_DE_ORIGEM[modeloId].rotulo}
                </a>
              ) : null}

              <BotaoGerarPlanilha
                modeloId={modeloId}
                clienteId={cliente.id}
                nomeCliente={cliente.nomeFantasia}
              />
            </>
          }
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Os seletores
// ---------------------------------------------------------------------------

/**
 * A FAIXA DE SELETORES.
 *
 * Uma linha, três campos e um botão. É o bloco de comando da Central, e ele
 * fica compacto de propósito: nesta tela, cada pixel gasto em cromo é um
 * pixel a menos de planilha.
 */
function Seletores({
  modelos,
  clientes,
  modeloId,
  clienteId,
  consultoriaTitulo,
  clienteEscolhido,
  aoTrocarCliente,
  aoTrocarModelo,
  aoCarregar,
  carregando,
}: {
  modelos: readonly ModeloPlanilha[];
  clientes: readonly { id: string; nomeFantasia: string; cidade: string }[];
  modeloId: string;
  clienteId: string;
  consultoriaTitulo: string | null;
  clienteEscolhido: boolean;
  aoTrocarCliente: (id: string) => void;
  aoTrocarModelo: (id: string) => void;
  aoCarregar: () => void;
  carregando: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-3 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5">
      <Campo rotulo="Cliente" htmlFor="cliente-planilha">
        <SeletorDeCliente clientes={clientes} selecionado={clienteId} aoTrocar={aoTrocarCliente} />
      </Campo>

      <Campo rotulo="Planilha" htmlFor="modelo-planilha">
        <SeletorDeModelo modelos={modelos} selecionado={modeloId} aoTrocar={aoTrocarModelo} />
      </Campo>

      {/*
        A CONSULTORIA É MOSTRADA, NÃO ESCOLHIDA.

        `montarContexto` já resolve a consultoria ativa do cliente quando
        nenhuma é pedida. Oferecer um terceiro seletor para escolher entre
        consultorias de um cliente que costuma ter uma só seria cromo. O nome
        aparece porque ele entra no subtítulo do arquivo — e quem lê a planilha
        precisa saber de que escopo ela é.
      */}
      <Campo rotulo="Consultoria" htmlFor={undefined}>
        <p className="flex h-9 items-center px-0.5 text-[0.8125rem] text-[var(--tinta-suave)]">
          {consultoriaTitulo ?? (
            <span className="text-[var(--tinta-fraca)]">a ativa do cliente</span>
          )}
        </p>
      </Campo>

      <div className="pb-0.5">
        {/*
          O BOTÃO DE ABRIR.

          Ele existe porque a carga é um ato — e porque `carregar` é assíncrona.
          Disparar a leitura no `onChange` de cada seletor faria três leituras
          ao arrastar o dedo pela lista; com o botão, é uma só, no momento em
          que ela decide.
        */}
        <Botao variante="secundario" tamanho="sm" onClick={aoCarregar} disabled={!clienteEscolhido || carregando}>
          {carregando ? "Montando…" : "Abrir planilha"}
        </Botao>
      </div>
    </div>
  );
}

/** Um campo rotulado da faixa de seletores. Altura fixa, para alinharem. */
function Campo({
  rotulo,
  htmlFor,
  children,
}: {
  rotulo: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className={cn(
          "block text-[0.625rem] font-semibold tracking-[0.13em] uppercase",
          "text-[var(--tinta-fraca)]"
        )}
      >
        {rotulo}
      </label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
