"use client";

import { useEffect, useRef, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Aviso, EstadoVazio } from "@/components/ui/superficie";
import { cn } from "@/lib/utils/cn";
import { montarContexto } from "@/lib/planilhas/contexto";
import { montarGradeDoRelatorio } from "@/lib/planilhas/modelos/relatorio-consultoria";
import { montarGradeDaFichaTecnica } from "@/lib/planilhas/modelos/ficha-tecnica";
import { montarGradeDeCustos } from "@/lib/planilhas/modelos/custos-precificacao";
import { montarGradeEmBranco } from "@/lib/planilhas/modelos/em-branco";
import type { CelulaGrade, ColunaGrade, FolhaGrade, GradeDaPlanilha } from "@/lib/planilhas/grade";
import { linhasVazias, nota } from "@/lib/planilhas/grade";
import type { ContextoPlanilha, ModeloPlanilha } from "@/lib/planilhas/tipos";
import { MODELO_PADRAO, modeloDisponivel } from "@/lib/planilhas/modelos";
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
/** Os geradores que montam a planilha A PARTIR DOS DADOS DO CLIENTE. */
const GERADORES: Record<string, (ctx: ContextoPlanilha) => GradeDaPlanilha> = {
  "relatorio-consultoria": montarGradeDoRelatorio,
  "ficha-tecnica": montarGradeDaFichaTecnica,
  "custos-precificacao": montarGradeDeCustos,
};

/**
 * OS GERADORES QUE MONTAM SEM CLIENTE NENHUM — e hoje só existe um.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UM SEGUNDO MAPA, E NÃO UMA ASSINATURA MAIS FROUXA              │
 * │                                                                      │
 * │ A tentação era alargar o mapa acima para `(ctx: ContextoPlanilha |     │
 * │ null)` e encaixar o modelo em branco junto com os outros. O TypeScript  │
 * │ recusa, e o erro dele diz algo verdadeiro: uma função que EXIGE        │
 * │ contexto não pode ocupar o lugar de uma que o aceita ausente — porque   │
 * │ quem chama pelo mapa prometeria poder não passar nada, e ela receberia  │
 * │ `null` num lugar onde não sabe lidar com ele.                          │
 * │                                                                      │
 * │ A recusa é a certa, e o segundo mapa é o que ela está pedindo: quem     │
 * │ não precisa de cliente é uma categoria DIFERENTE, e não um caso        │
 * │ particular da primeira. Os quatro `exige` do catálogo já diziam isso —  │
 * │ `exige: []` é exatamente a declaração de que este gerador não consome   │
 * │ fonte nenhuma.                                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const GERADORES_SEM_CLIENTE: Record<string, (ctx: ContextoPlanilha | null) => GradeDaPlanilha> = {
  "planilha-em-branco": montarGradeEmBranco,
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
  /*
    A CENTRAL ABRE NA PLANILHA EM BRANCO — e isto é a mudança central da tela.

    O modelo padrão era o relatório de consultoria, que exige cliente. Com ele,
    a primeira pintura era o vazio "Escolha um cliente", e a grade só existia
    depois de duas escolhas. A planilha em branco não exige nada: ela abre na
    primeira pintura, com trinta linhas e doze colunas prontas para digitar.

    Ver `MODELO_PADRAO` em `@/lib/planilhas/modelos`, que é onde a razão mora.
  */
  const [modeloId, definirModeloId] = useState(
    modeloInicial && modeloDisponivel(modeloInicial) ? modeloInicial : MODELO_PADRAO
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

  /*
    O QUE FOI DIGITADO NA GRADE — a camada de edição da sessão.

    A chave é `"<aba>::<endereço>"`, que é o formato que `PreviaDaPlanilha`
    espera. Ela vive aqui, e não dentro da prévia, por um motivo simples: as
    abas trocam sem desmontar o componente, e um mapa guardado lá dentro
    perderia as edições da aba que saiu de vista.

    Sem persistência, e a tela diz isso. O banco não está ligado: o mapa é
    estado de sessão, e recarregar a página limpa a grade — a nota no rodapé
    da folha livre também diz. Ver o briefing: "NÃO fingir persistência".
  */
  const [edicoes, definirEdicoes] = useState<Record<string, CelulaGrade>>({});

  /*
    AS ABAS ACRESCENTADAS NESTA SESSÃO.

    O `[+]` ao lado da última aba cria uma folha em branco. Ela não sobrevive
    ao recarregamento, e a tela não promete que sobreviva.
  */
  const [folhasExtras, definirFolhasExtras] = useState<FolhaGrade[]>([]);

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const modelo = modelos.find((m) => m.id === modeloId) ?? null;

  /*
    O MODELO PRECISA DE CLIENTE? A RESPOSTA JÁ ESTÁ NO CATÁLOGO.

    `ModeloPlanilha.exige` lista as fontes de que o modelo precisa, e é o mesmo
    campo que o seletor usa para desabilitar o que ainda não sai. "Planilha em
    branco" declara `exige: []` — e é exatamente por isso que ela é o padrão.

    Derivar de `exige` em vez de escrever `modeloId === "planilha-em-branco"`
    é o que faz um modelo novo se comportar certo sozinho: quem declara que não
    precisa de nada já abre sem nada escolhido.
  */
  const precisaDeCliente = (modelo?.exige.length ?? 0) > 0;

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

    /*
      AS EDIÇÕES SÃO DA PLANILHA ANTERIOR, E SAEM COM ELA.

      A chave é `"<aba>::<endereço>"` — só o nome da aba e a célula. Duas
      planilhas do mesmo modelo têm abas com o MESMO nome ("Base", "Custos"),
      então sem esta limpeza o que ela digitou na ficha do Empório apareceria
      na ficha do outro cliente, no mesmo endereço. É vazamento de dado entre
      clientes por um caminho que ninguém procuraria: a grade está certa, o
      que está errado é o que ela digitou por cima.
    */
    definirEdicoes({});
    definirFolhasExtras([]);

    /*
      ┌──────────────────────────────────────────────────────────────────────┐
      │ O MODELO EM BRANCO PASSA POR AQUI PRIMEIRO, E POR ÚLTIMO              │
      │                                                                      │
      │ Ele não precisa de cliente para montar, então não faz sentido pedir    │
      │ um. E ele não pode esperar por `montarContexto`, que lê o            │
      │ repositório inteiro — uma grade de trinta linhas vazias não tem o que  │
      │ ir buscar lá.                                                       │
      │                                                                      │
      │ A ordem importa: testá-lo ANTES do `gerador` faz o retorno sair        │
      │ limpo, sem passar pelo `montando`, e a planilha em branco aparece sem  │
      │ um piscar de "carregando" que não teria o que carregar.               │
      └──────────────────────────────────────────────────────────────────────┘
    */
    const semCliente = GERADORES_SEM_CLIENTE[escolhidoModelo];
    if (semCliente) {
      definirConsultoriaTitulo(null);
      definirGrade(semCliente(null));
      return;
    }

    const gerador = GERADORES[escolhidoModelo];

    /*
      O MODELO NÃO TEM GERADOR — os que estão EM_PREPARACAO no catálogo. O
      seletor já os desabilita, e esta guarda existe porque o seletor é
      interface: quem chega pela URL com `?modelo=` passa por fora dele.
    */
    if (!gerador) {
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
    troca. A lista vazia diz o que se quer: buscar uma vez, na montagem.

    A trava de `useRef` existe para o StrictMode do React em desenvolvimento,
    que monta o componente duas vezes de propósito. Sem ela, a bancada de
    desenvolvimento faria duas leituras por abertura de tela.

    ┌────────────────────────────────────────────────────────────────────┐
    │ E ELE RODA SEM CLIENTE — QUE ERA O DEFEITO ANTES DA CORREÇÃO        │
    │                                                                    │
    │ Havia um `if (!clienteId) return` aqui. Fazia sentido enquanto a     │
    │ grade só existia depois de escolher cliente, e passou a ser o que     │
    │ impedia a regra nova de funcionar: o modelo padrão agora é a          │
    │ planilha em branco, que NÃO tem cliente — então o efeito saía na      │
    │ primeira linha e a grade nunca era montada. A tela ficaria vazia até  │
    │ o primeiro clique, que é exatamente o defeito que esta rodada existe  │
    │ para consertar.                                                     │
    │                                                                    │
    │ `carregar` com cliente vazio já trata o caso: o modelo em branco      │
    │ monta sem contexto, e os modelos que precisam de cliente devolvem     │
    │ para o `precisaDeCliente`, no render.                               │
    └────────────────────────────────────────────────────────────────────┘
  */
  const jaCarregou = useRef(false);
  useEffect(() => {
    if (jaCarregou.current) return;
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

      {/*
        ┌──────────────────────────────────────────────────────────────────┐
        │ A GRADE NÃO DESAPARECE — É A REGRA CENTRAL DESTA RODADA            │
        │                                                                  │
        │ Aqui havia três ramos: sem cliente, "Escolha um cliente"; com      │
        │ cliente e sem grade, "Monte a planilha"; e só no terceiro a grade. │
        │ Ou seja: em dois dos três estados a tela não tinha planilha — e o  │
        │ primeiro deles é justamente o de quem abre a Central.              │
        │                                                                  │
        │ A planilha é o centro da tela. Quando o modelo não depende de      │
        │ cliente, ela está ali desde a primeira pintura, mesmo sem nada     │
        │ escolhido. Quando depende, o que aparece é a grade do modelo com   │
        │ o que ele consegue montar — e, se ele não conseguir montar nada,   │
        │ a aviso fica ACIMA da grade, e não no lugar dela.                  │
        └──────────────────────────────────────────────────────────────────┘
      */}
      {problema ? (
        <Aviso tom="atencao" titulo="A planilha não foi montada">
          <p>{problema}</p>
        </Aviso>
      ) : null}

      {precisaDeCliente && !cliente ? (
        /*
          ESTE É O ÚNICO CASO EM QUE A GRADE AINDA ESPERA — e ele é honesto.

          Os modelos de ficha, custos e relatório leem dados do cliente: sem
          cliente não há dado nenhum, e uma grade vazia aqui seria a promessa
          de um conteúdo que não existe. Em vez disso, a folha em branco do
          sistema aparece, pronta para digitar — e a frase diz o que falta para
          a planilha de verdade aparecer.

          Trocar para a planilha em branco é um clique, e o botão está ali.
        */
        <div className="space-y-3">
          <Aviso tom="info" titulo={`"${modelo?.nome ?? "Este modelo"}" é montado a partir dos dados de um cliente`}>
            <p>
              Escolha o cliente na barra acima e a planilha aparece aqui com o conteúdo dele. Se o
              que você quer é uma grade livre para digitar, troque a planilha para{" "}
              <span className="font-medium">Planilha em branco</span> — ela não depende de cadastro
              nenhum.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Botao
                variante="secundario"
                tamanho="sm"
                onClick={() => {
                  definirModeloId(MODELO_PADRAO);
                  definirGrade(montarGradeEmBranco(null));
                }}
              >
                Abrir uma planilha em branco
              </Botao>
            </div>
          </Aviso>

          <GradeEmBrancoDaSessao
            edicoes={edicoes}
            aoEditar={(chave, valor) => definirEdicoes((e) => ({ ...e, [chave]: valor }))}
          />
        </div>
      ) : grade ? (
        <PreviaDaPlanilha
          grade={grade}
          nomeCliente={cliente?.nomeFantasia ?? "sem cliente vinculado"}
          altura={620}
          edicoes={edicoes}
          aoEditar={(chave, valor) => definirEdicoes((e) => ({ ...e, [chave]: valor }))}
          folhasExtras={folhasExtras}
          aoCriarFolha={() =>
            definirFolhasExtras((f) => [...f, folhaNova(f.length + 1)])
          }
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

              {cliente ? (
                <BotaoGerarPlanilha
                  modeloId={modeloId}
                  clienteId={cliente.id}
                  nomeCliente={cliente.nomeFantasia}
                />
              ) : null}
            </>
          }
        />
      ) : (
        /*
          MONTANDO. A espera acontece com a grade anterior à vista, quando há
          uma — trocar de cliente não apaga a tela para depois repintá-la.
        */
        <EstadoVazio
          titulo={montando ? "Montando a planilha…" : "Sem conteúdo para mostrar"}
          descricao={
            montando
              ? "Lendo os dados do cliente para montar a grade."
              : "Este modelo não devolveu nada com os dados de agora. Escolha outro na barra acima."
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
 * A BARRA SUPERIOR — TRÊS SELETORES E TRÊS AÇÕES, NUMA LINHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ÁREA MAIS IMPORTANTE DA TELA É A PLANILHA. NÃO ESTA BARRA.          │
 * │                                                                      │
 * │ A versão anterior gastava a altura de um cartão com os seletores e     │
 * │ mais um cartão com o catálogo dos modelos que ainda não saem. Dois      │
 * │ blocos de cromo antes da primeira célula.                             │
 * │                                                                      │
 * │ Aqui são três campos e três botões, na altura de uma linha. A barra    │
 * │ não tem título, não tem descrição e não tem moldura de cartão — ela    │
 * │ é uma faixa de comando, e o que ela comanda é a grade logo abaixo.     │
 * │                                                                      │
 * │ Em tela estreita ela QUEBRA, e quebrar é o certo: empilhar é pior que  │
 * │ cortar, e a grade continua inteira porque o scroll horizontal dela é    │
 * │ dentro do próprio quadro.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE "ABRIR PLANILHA" SAIU DAQUI                                  │
 * │                                                                      │
 * │ Ele existia porque a leitura do repositório é assíncrona, e o botão     │
 * │ era o momento em que ela decidia pagar esse custo.                      │
 * │                                                                      │
 * │ Com a barra compacta, ele virou um passo a mais entre ela e a grade    │
 * │ — e a grade é o que ela veio ver. O botão continua existindo (ver      │
 * │ "Recarregar", que aparece só quando há o que recarregar), mas ele      │
 * │ deixou de ser obrigatório para a planilha aparecer.                    │
 * └──────────────────────────────────────────────────────────────────────┘
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
    <div className="flex flex-wrap items-end gap-x-3 gap-y-2.5 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3">
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

      {/*
        AS AÇÕES FICAM À DIREITA, EMPURRADAS COM `ml-auto`.

        Elas são secundárias ao que está à esquerda: primeiro ela diz DE QUEM e
        QUAL planilha, depois o que fazer com ela. Quando a barra quebra em
        tela estreita, o `ml-auto` perde o efeito e as ações vão para a linha
        de baixo — que é onde elas devem estar mesmo.
      */}
      <div className="ml-auto flex flex-wrap items-center gap-2 pb-0.5">
        <Botao
          variante="linha"
          tamanho="sm"
          onClick={aoCarregar}
          disabled={!clienteEscolhido || carregando}
          title={
            clienteEscolhido
              ? "Ler de novo os dados deste cliente"
              : "Escolha um cliente para recarregar"
          }
        >
          {carregando ? "Lendo…" : "Recarregar"}
        </Botao>

        {/*
          IMPORTAR PDF — o caminho para o qual esta rodada existe.

          Ele é um LINK e não um botão, porque leva a uma rota: a importação
          tem etapas próprias e vive em `/planilhas/importar`. Fazer dela um
          estado desta tela obrigaria a esconder a grade — e a grade é a regra.
        */}
        <a
          href={clienteId ? `/planilhas/importar?cliente=${encodeURIComponent(clienteId)}` : "/planilhas/importar"}
          className={cn(
            "relative inline-flex h-8 items-center justify-center gap-2 overflow-hidden",
            "rounded-[var(--raio-sm)] border border-[var(--linha-forte)] px-3",
            "text-[0.6875rem] font-medium uppercase tracking-[0.13em] text-tinta",
            "transition-colors duration-200 hover:border-tinta hover:bg-tinta hover:text-off"
          )}
        >
          Importar PDF
        </a>

        {clienteEscolhido ? (
          <BotaoGerarPlanilha
            modeloId={modeloId}
            clienteId={clienteId}
            nomeCliente={""}
            className=""
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * A GRADE EM BRANCO, QUANDO O MODELO ESCOLHIDO PRECISA DE CLIENTE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UMA SEGUNDA GRADE, E NÃO O VAZIO DE ANTES                    │
 * │                                                                      │
 * │ Ela escolheu "Ficha técnica" e ainda não escolheu o cliente. O que a  │
 * │ tela mostrava era um retângulo tracejado escrito "Escolha um cliente". │
 * │ Um retângulo vazio é a negação da tela: em vez de dizer o que falta,   │
 * │ ele diz que não há nada.                                              │
 * │                                                                      │
 * │ Aqui ela ganha a planilha de verdade — a mesma grade livre, com as     │
 * │ letras e os números e a digitação funcionando. O aviso acima diz o que │
 * │ falta para o conteúdo do cliente aparecer. Se a ficha do cliente é o    │
 * │ que ela quer, escolhe o cliente. Se é digitar, já pode digitar.        │
 * │                                                                      │
 * │ A grade é montada pela MESMA função pura do modelo em branco          │
 * │ (`montarGradeEmBranco`), e não por uma grade de reserva escrita aqui.   │
 * │ Uma segunda grade divergiria da primeira no primeiro ajuste de coluna. │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function GradeEmBrancoDaSessao({
  edicoes,
  aoEditar,
}: {
  edicoes: Readonly<Record<string, CelulaGrade>>;
  aoEditar: (chave: string, valor: CelulaGrade) => void;
}) {
  const grade = montarGradeEmBranco(null);
  return (
    <PreviaDaPlanilha
      grade={grade}
      nomeCliente="sem cliente vinculado"
      altura={420}
      edicoes={edicoes}
      aoEditar={aoEditar}
    />
  );
}

/**
 * AS COLUNAS DE UMA ABA NOVA — A–L, vazias.
 *
 * Escritas aqui e não importadas de `em-branco.ts` porque lá elas são `const`
 * de módulo, não exportadas: o modelo em branco é uma GRADE, e a aba nova é
 * uma folha solta dentro de outra planilha. As medidas são as mesmas do
 * briefing — doze colunas, a primeira mais larga porque é onde a descrição vai.
 */
function colunasLivres(): ColunaGrade[] {
  return Array.from({ length: 12 }, (_, i) => ({
    chave: `c${i + 1}`,
    titulo: "",
    formato: "texto" as const,
    largura: i === 0 ? 34 : 15,
    larguraMinima: i === 0 ? 260 : 118,
  }));
}

/**
 * UMA FOLHA NOVA PARA O `[+]`.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELA NÃO PERSISTE, E POR QUE A TELA DIZ ISSO                  │
 * │                                                                      │
 * │ Criar aba é fácil; guardar aba é o que ainda não existe. O Neon não    │
 * │ está ligado, e uma folha que ela acrescentasse e perdesse ao recarregar │
 * │ seria a mentira mais cara desta rodada — ela organizaria o trabalho    │
 * │ inteiro em abas e perderia tudo sem entender por quê.                  │
 * │                                                                      │
 * │ Por isso a folha existe NA SESSÃO, funciona enquanto ela trabalha, e   │
 * │ a assinatura dela diz onde o conteúdo vive. Ver o briefing: "NÃO       │
 * │ fingir persistência".                                                  │
 * │                                                                      │
 * │ O número entra no nome porque dois "+" seguidos criariam duas abas     │
 * │ "Planilha 2" — e o Excel recusa nomes de aba repetidos, então o         │
 * │ arquivo baixado sairia com uma delas renomeada, sem aviso.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function folhaNova(numero: number): FolhaGrade {
  return {
    nome: `Planilha ${numero}`,
    titulo: `PLANILHA ${numero}`,
    colunas: colunasLivres(),
    linhas: [
      ...linhasVazias(30),
      nota(
        "Aba criada nesta sessão. O que você digitar aqui vale enquanto a página estiver aberta — o armazenamento definitivo ainda não foi ligado."
      ),
    ],
    congelarLinhas: 0,
    congelarColunas: 1,
    mostrarCabecalho: false,
    editavel: true,
    assinatura:
      "Aba livre do Sistema Érika Bruna · sem fórmula nesta versão · conteúdo válido apenas nesta sessão",
  };
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
