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
import type {
  CelulaGrade,
  ColunaGrade,
  EstiloGrade,
  FolhaGrade,
  GradeDaPlanilha,
} from "@/lib/planilhas/grade";
import {
  aplicarPincelNaFolha,
  chaveDaMarcacao,
  chaveDaLinha,
  endereco,
  estiloDeLinha,
  linhasVazias,
  mesclarEstilo,
  nota,
} from "@/lib/planilhas/grade";
import type { ContextoPlanilha, ModeloPlanilha } from "@/lib/planilhas/tipos";
import { MODELO_PADRAO, modeloDisponivel } from "@/lib/planilhas/modelos";
import { PreviaDaPlanilha, type SelecaoDaGrade } from "@/components/ui/previa-tabular";
import { BotaoExportarXlsx } from "./gerar";
import { SeletorDeCliente } from "./seletor";
import { SeletorDeConsultoria } from "./seletor-consultoria";
import { SeletorDeModelo } from "./seletor-modelo";
import { JanelaCriarPlanilha, criarFolhaDoModelo, type ModeloLivre } from "./criar";
import { BarraDeFormatacao } from "./formatacao";
import { BotaoSalvar } from "./salvar";
import { JanelaEnviar } from "./enviar";

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
  consultorias,
  clienteInicial,
  modeloInicial,
}: {
  /** O catálogo inteiro, para o seletor — inclusive o que ainda não sai. */
  modelos: readonly ModeloPlanilha[];
  clientes: readonly { id: string; nomeFantasia: string; cidade: string }[];
  /**
   * TODAS as consultorias, de todos os clientes.
   *
   * Chega completa e o recorte por cliente é feito aqui — ver
   * `consultoriasDoCliente`, abaixo, que é onde a regra "nenhuma consultoria
   * de outro cliente aparece nesta lista" mora, sozinha.
   */
  consultorias: readonly { id: string; clienteId: string; titulo: string }[];
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

  /*
    A CONSULTORIA ESCOLHIDA — e o vazio é uma escolha, não um branco.

    Vazio quer dizer "a ativa do cliente", que é o comportamento de sempre:
    `montarContexto` resolve a mais recente não concluída. Escolher uma
    consultoria específica é pedir OUTRA — e é o que passou a ser possível
    depois que o campo deixou de ser texto parado.

    O título que a tela mostra NÃO é derivado deste id: ele vem do contexto
    montado, que é quem sabe o nome da consultoria depois de resolver o
    palpite. Guardar o título aqui também daria duas fontes para o mesmo nome.
  */
  const [consultoriaId, definirConsultoriaId] = useState("");
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

  /*
    O QUE A ÉRIKA PINTOU — a chave é `"<aba>::<endereço>"`.

    Ele vive aqui, e não dentro da grade, por uma razão específica: a barra de
    formatação fica FORA da grade, na faixa de comando, e as duas precisam
    escrever e ler o mesmo mapa. Guardado lá dentro, a barra não teria como
    alcançá-lo.

    A chave é a mesma da edição de célula, e isso não é coincidência: as duas
    são "o que ela fez naquele endereço". O que muda é o conteúdo — uma guarda
    um valor, a outra uma cor.

    E ele é limpo em `carregar`, pela mesma razão de `edicoes`: duas planilhas
    do mesmo modelo têm abas com o MESMO nome, e uma linha pintada de amarelo
    na ficha do Empório apareceria na ficha do outro cliente.
  */
  const [pincel, definirPincel] = useState<Record<string, EstiloGrade>>({});

  /*
    A SELEÇÃO, PARA A BARRA DE FORMATAÇÃO SABER ONDE PINTAR.

    A linha vem em NÚMERO de planilha — o que aparece na coluna da esquerda —,
    e não em índice. Ver `PreviaDaPlanilha`, que faz a tradução na fronteira.
  */
  const [selecao, definirSelecao] = useState<SelecaoDaGrade | null>(null);

  /*
    A FOLHA ABERTA, PELO MESMO MOTIVO DA SELEÇÃO: a barra escreve por
    `"<aba>::<endereço>"` e precisa do nome da aba para montar a chave.
  */
  const [aba, definirAba] = useState(0);

  /*
    O CONTADOR DE REVISÃO — quem "salvar" observa para saber se há novidade.

    Ele sobe a cada mudança de conteúdo: digitação, marcação, aba nova,
    planilha criada. É um contador, e não um sinalizador, para que nenhum
    caminho novo de edição possa esquecer de ligá-lo (ver `salvar.tsx`, que
    explica a escolha em detalhe).
  */
  const [revisao, definirRevisao] = useState(0);
  const mudou = () => definirRevisao((r) => r + 1);

  /*
    AS JANELAS, E A PLANILHA CRIADA NESTA SESSÃO.

    `criada` guarda o que o "+ Criar planilha" produziu: um nome e uma folha.
    Guardar a FOLHA, e não uma `GradeDaPlanilha` inteira, é o que permite
    transformá-la em aba ao lado das outras — a grade com o nome no subtítulo
    é derivada no render, por `gradeCriada`, que é pura.

    Guardar a grade pronta obrigaria a duas fontes de verdade: a grade criada
    com a folha dentro, e a lista de abas que a tela desenha. Uma delas
    envelheceria.
  */
  const [janelaCriar, definirJanelaCriar] = useState(false);
  const [janelaEnviar, definirJanelaEnviar] = useState(false);
  const [criada, definirCriada] = useState<{ nome: string; folha: FolhaGrade } | null>(null);

  const cliente = clientes.find((c) => c.id === clienteId) ?? null;
  const modelo = modelos.find((m) => m.id === modeloId) ?? null;

  /*
    AS CONSULTORIAS DESTE CLIENTE — o único recorte, e ele mora aqui.

    A lista chega completa do servidor e é filtrada neste ponto, uma vez, para
    os dois usos: o `<select>` e a janela de criar. Duas expressões iguais em
    dois lugares divergiriam no dia em que uma delas ganhasse um `status !==
    "CONCLUIDA"` — e a que ficasse para trás mostraria consultoria encerrada
    como se ainda fosse uma opção de trabalho.

    Sem cliente, a lista é vazia — e é a resposta certa, porque consultoria
    sem cliente não existe neste domínio.
  */
  const consultoriasDoCliente = clienteId
    ? consultorias.filter((c) => c.clienteId === clienteId)
    : [];

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
  async function carregar(
    escolhidoCliente: string,
    escolhidoModelo: string,
    escolhidaConsultoria: string = ""
  ) {
    definirProblema(null);

    /*
      AS EDIÇÕES SÃO DA PLANILHA ANTERIOR, E SAEM COM ELA.

      A chave é `"<aba>::<endereço>"` — só o nome da aba e a célula. Duas
      planilhas do mesmo modelo têm abas com o MESMO nome ("Base", "Custos"),
      então sem esta limpeza o que ela digitou na ficha do Empório apareceria
      na ficha do outro cliente, no mesmo endereço. É vazamento de dado entre
      clientes por um caminho que ninguém procuraria: a grade está certa, o
      que está errado é o que ela digitou por cima.

      A MESMA RAZÃO VALE PARA O PINCEL, e com o mesmo endereço: uma linha
      pintada de amarelo — "este ingrediente está sem preço" — reapareceria
      destacando a linha equivalente na planilha de outro cliente. A cor é
      uma anotação, e anotação também é dado.

      E vale para a planilha criada nesta sessão: ela é DO CLIENTE que estava
      escolhido quando foi criada. Mantê-la ao trocar de cliente faria uma
      planilha criada para o Empório continuar na tela depois de escolher
      outro — com o nome dele no subtítulo do arquivo exportado.
    */
    definirEdicoes({});
    definirFolhasExtras([]);
    definirPincel({});
    definirSelecao(null);
    definirCriada(null);
    definirAba(0);

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
      definirConsultoriaId("");
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
      definirConsultoriaId("");
      return;
    }

    definirMontando(true);
    try {
      const contexto = await montarContexto(escolhidoCliente, {
        /*
          A CONSULTORIA PEDIDA VAI COMO `null` QUANDO O CAMPO ESTÁ VAZIO.

          `montarContexto` trata `null` e `undefined` do mesmo jeito — cai na
          ativa do cliente —, e converter o vazio aqui é o que mantém a regra
          explícita: a string vazia é o valor do `<select>`, e não uma
          consultoria de id vazio que o repositório iria procurar em vão.
        */
        consultoriaId: escolhidaConsultoria || null,
        geradoEm: new Date(),
      });
      if (!contexto) {
        definirGrade(null);
        definirConsultoriaId("");
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

  /*
    A GRADE COM AS FOLHAS DA SESSÃO — e por que isto está fora do render.

    A lista é derivada no corpo do componente (não é estado), mas PRECISA ser
    a mesma em todos os pontos que a desenham: a prévia, a barra de formatação
    e o botão de exportar. Uma função local devolveria uma lista nova a cada
    chamada, e duas listas iguais em conteúdo com identidades diferentes é a
    porta para alguém "otimizar" um `useMemo` mais tarde e congelar uma delas.
  */
  /*
    O NOME DA PLANILHA ABERTA — o que a janela de envio confere.

    A ordem das respostas é a ordem do que está na tela: se ela CRIOU uma
    planilha nesta sessão, é o nome que ela deu; senão é o nome do modelo do
    catálogo; senão o próprio id, para nunca aparecer vazio.
  */
  const nomeDaPlanilha = criada?.nome ?? modelo?.nome ?? modeloId;

  /*
    AS FOLHAS DA SESSÃO — o que a prévia desenha além da grade.

    A criada vem PRIMEIRO: criá-la é "abrir" uma planilha, e a que se acabou
    de abrir é a que se quer ver. E é este o motivo de ela virar aba em vez
    de substituir a grade — o que ela estava vendo continua ali, ao lado.
  */
  const folhasDaSessao = criada === null ? folhasExtras : [criada.folha, ...folhasExtras];

  /*
    ┌────────────────────────────────────────────────────────────────────────┐
    │ A GRADE MARCADA — UMA SÓ, PARA A TELA E PARA O ARQUIVO                 │
    │                                                                        │
    │ `gradeMarcada` é a grade com o pincel já MATERIALIZADO nas linhas       │
    │ (`aplicarPincelNaFolha`). É ELA que vai para a prévia E é ELA que vai    │
    │ para o botão de exportar.                                                │
    │                                                                        │
    │ A alternativa era mandar o mapa `pincel` junto no corpo da requisição   │
    │ de exportação, e o servidor teria de aplicá-lo por conta própria — duas  │
    │ implementações da mesma tradução, e a divergência apareceria como uma    │
    │ planilha amarela na tela e branca no Excel.                              │
    │                                                                        │
    │ Como a grade já chega com a marcação nas LINHAS, o sanitizador da rota   │
    │ (`estiloSeguro`, em `/api/planilhas/importada`) valida o estilo sem      │
    │ saber que ele veio de um pincel. Um caminho, um validador.               │
    └────────────────────────────────────────────────────────────────────────┘
  */
  const gradeMarcada: GradeDaPlanilha | null = grade
    ? {
        ...grade,
        folhas: grade.folhas.map((f) => aplicarPincelNaFolha(f, pincel)),
      }
    : null;

  /*
    A FOLHA ABERTA, para a barra de formatação endereçar a chave certa.

    ┌────────────────────────────────────────────────────────────────────┐
    │ A ORDEM É A MESMA DA PRÉVIA, E ELA VEM DE UMA FONTE SÓ             │
    │                                                                    │
    │ A prévia desenha `[...grade.folhas, ...folhasExtras]` (já com o     │
    │ pincel aplicado). Se a barra montasse esta lista por conta própria,  │
    │ bastaria acrescentar uma aba para as duas discordarem — e a         │
    │ divergência seria a marcação indo para o endereço de OUTRA folha.    │
    │                                                                    │
    │ Por isso a concatenação está escrita UMA vez, aqui, e o resultado é  │
    │ usado pela barra. (A prévia ainda monta a dela, dentro do próprio    │
    │ componente, porque ela é uma peça reutilizável que não conhece este  │
    │ ambiente — e as duas listas leem as MESMAS props.)                  │
    └────────────────────────────────────────────────────────────────────┘
  */
  const folhasParaBarra = [
    ...(gradeMarcada?.folhas ?? []),
    ...folhasDaSessao.map((f) => aplicarPincelNaFolha(f, pincel)),
  ];
  const folhaAberta = folhasParaBarra[aba] ?? folhasParaBarra[0] ?? null;

  /*
    O ALVO DA MARCAÇÃO, JÁ TRADUZIDO.

    `chave` é o que a barra escreve; `rotulo` é o que ela mostra. Os dois saem
    da MESMA seleção, e é por isso que a frase "Célula C4" não pode discordar
    da célula pintada.
  */
  const alvoDaMarcacao =
    folhaAberta === null || selecao === null
      ? null
      : {
          rotulo:
            selecao.tipo === "linha"
              ? `Linha ${selecao.linha}`
              : `Célula ${endereco(selecao.linha, selecao.coluna)}`,
          chave:
            selecao.tipo === "linha"
              ? chaveDaLinha(folhaAberta.nome, selecao.linha)
              : chaveDaMarcacao(folhaAberta.nome, selecao.linha, selecao.coluna),
          linha: selecao.linha,
          coluna: selecao.tipo === "linha" ? null : selecao.coluna,
        };

  /*
    A MARCAÇÃO QUE JÁ ESTÁ APLICADA NO ALVO.

    A barra lê daqui para acender o negrito, o alinhamento e a cor que já
    valem — e a leitura é da LINHA quando a linha foi escolhida, que é o que
    a precedência do modelo manda (célula vence linha, e a linha é o que está
    selecionado aqui).
  */
  const marcacaoAtual: EstiloGrade = (() => {
    if (alvoDaMarcacao === null || folhaAberta === null) return {};
    const numero = alvoDaMarcacao.linha;
    const indice = numero - (folhaAberta.linhaInicial ?? 3);
    const linha = folhaAberta.linhas[indice];
    if (linha === undefined) return {};
    return alvoDaMarcacao.chave in pincel
      ? (pincel[alvoDaMarcacao.chave] ?? {})
      : (estiloDeLinha(linha) ?? {});
  })();

  function aplicarMarcacao(mudanca: EstiloGrade) {
    if (alvoDaMarcacao === null) return;
    definirPincel((atual) => ({
      ...atual,
      [alvoDaMarcacao.chave]: mesclarEstilo(atual[alvoDaMarcacao.chave], mudanca),
    }));
    mudou();
  }

  function limparMarcacao() {
    if (alvoDaMarcacao === null) return;
    definirPincel((atual) => {
      const proximo = { ...atual };
      delete proximo[alvoDaMarcacao.chave];
      return proximo;
    });
    mudou();
  }

  /**
   * O QUE O "+ CRIAR PLANILHA" FAZ QUANDO ELA CONFIRMA.
   *
   * ┌──────────────────────────────────────────────────────────────────────┐
   * │ POR QUE A PLANILHA CRIADA VIRA ABA, E NÃO SUBSTITUI A GRADE          │
   * │                                                                      │
   * │ O gesto é "abrir uma planilha nova", e a palavra que decide o         │
   * │ desenho é "abrir": ela quer VER o que criou, agora, sem perder o que   │
   * │ estava vendo. Por isso a folha criada entra na frente da lista de      │
   * │ abas e a aba aberta vai para ela — é a única aba que ela ainda não     │
   * │ conhece, e é a que acabou de pedir.                                   │
   * │                                                                      │
   * │ Note que NADA é lido do repositório. `criarFolhaDoModelo` é pura e     │
   * │ devolve uma grade vazia. Não há `await`, não há `montando`: a          │
   * │ planilha aparece no mesmo clique, que é o que o briefing pede —        │
   * │ "GERAR PLANILHA significa montar a planilha NA HORA dentro do          │
   * │ sistema".                                                             │
   * │                                                                      │
   * │ O cliente escolhido na janela NÃO recarrega o contexto: ele entra só   │
   * │ no nome exibido. Uma grade em branco não tem dado de cliente para      │
   * │ ler, e buscar o contexto inteiro para desenhar trinta linhas vazias    │
   * │ seria uma leitura de banco a troco de nada.                           │
   * └──────────────────────────────────────────────────────────────────────┘
   */
  function criarPlanilha(dados: { nome: string; modelo: ModeloLivre; clienteId: string }) {
    const folha = criarFolhaDoModelo(dados.modelo, 1);
    definirCriada({ nome: dados.nome, folha: { ...folha, titulo: dados.nome.toUpperCase() } });

    /*
      A ABA ABERTA VAI PARA A CRIADA — que é a primeira da lista, porque
      `folhasDaSessao` põe `criada.folha` na frente. O zero não é um número
      mágico: é "a primeira", e a primeira é ela.
    */
    definirAba(0);
    definirSelecao(null);
    definirJanelaCriar(false);
    mudou();
  }


  return (
    <div className="space-y-3">
      <Seletores
        modelos={modelos}
        clientes={clientes}
        modeloId={modeloId}
        clienteId={clienteId}
        consultorias={consultoriasDoCliente}
        consultoriaId={consultoriaId}
        consultoriaTitulo={consultoriaTitulo}
        planilhaAberta={nomeDaPlanilha}
        criar={() => definirJanelaCriar(true)}
        salvar={
          /*
            A REVISÃO JÁ NASCE SOMANDO A CHAVE DA PLANILHA.

            Sem isto, trocar de cliente ou de modelo não mexeria no contador —
            e o botão continuaria dizendo "salvo" para uma planilha que acabou
            de ser substituída por outra. `pincel` e `edicoes` são limpos no
            `carregar`; este número precisa acompanhar.
          */
          <BotaoSalvar revisao={revisao + clienteId.length + modeloId.length} />
        }
        enviar={() => definirJanelaEnviar(true)}
        aoTrocarCliente={(id) => {
          definirClienteId(id);
          /*
            TROCAR DE CLIENTE ZERA A CONSULTORIA ESCOLHIDA.

            A consultoria anterior é de OUTRO cliente, e mantê-la no estado
            faria `montarContexto` procurá-la, não achá-la entre as do cliente
            novo, e cair na ativa em silêncio — o que está certo no resultado e
            errado na tela: o `<select>` continuaria exibindo o id antigo,
            apontando para uma opção que não existe mais na lista. Zerar é o
            que faz o campo dizer "A ativa do cliente", que é o que de fato
            vai acontecer.
          */
          definirConsultoriaId("");
          void carregar(id, modeloId, "");
        }}
        aoTrocarModelo={(id) => {
          definirModeloId(id);
          /*
            O MODELO NÃO ZERA A CONSULTORIA — e a diferença é deliberada.

            Ela não é do modelo: é do cliente, e continua valendo quando ela
            troca de ficha técnica para custos, que é a troca mais comum de
            todas. Zerar aqui desfaria uma escolha que ela acabou de fazer.
          */
          void carregar(clienteId, id, consultoriaId);
        }}
        aoTrocarConsultoria={(id) => {
          definirConsultoriaId(id);
          void carregar(clienteId, modeloId, id);
        }}
      />

      {/*
        A BARRA DE FORMATAÇÃO FICA ABAIXO DA FAIXA DE COMANDO, e não dentro dela.

        Ela age sobre a SELEÇÃO da grade, e a seleção está um nível abaixo: pôr
        as duas na mesma linha sugeriria que pintar é uma ação de tela, quando
        ela é uma ação sobre a célula. Embaixo da faixa, ela fica entre o
        comando e o que ele comanda.
      */}
      <BarraDeFormatacao
        alvo={alvoDaMarcacao?.rotulo ?? null}
        atual={marcacaoAtual}
        aoAplicar={aplicarMarcacao}
        aoLimpar={limparMarcacao}
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
        <>
          <PreviaDaPlanilha
            grade={gradeMarcada ?? grade}
            nomeCliente={cliente?.nomeFantasia ?? "sem cliente vinculado"}
            altura={620}
            edicoes={edicoes}
            aoEditar={(chave, valor) => {
              definirEdicoes((e) => ({ ...e, [chave]: valor }));
              mudou();
            }}
            folhasExtras={folhasDaSessao}
            aoCriarFolha={() => {
              definirFolhasExtras((f) => [...f, folhaNova(f.length + 1)]);
              mudou();
            }}
            pincel={pincel}
            selecao={selecao}
            aoSelecionar={definirSelecao}
            aba={aba}
            aoAbrirAba={definirAba}
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

                {/*
                  EXPORTAR FICA AO LADO DA GRADE — e não mais na faixa.

                  É o gesto que tira o arquivo daqui, e quem o pede está
                  olhando a planilha. Foi também onde ele sempre esteve: o que
                  mudou nesta rodada foi só o NOME e o que ele dispara — antes
                  "Gerar planilha" baixava o arquivo, e agora "Exportar" é o
                  passo final, depois de revisar.
                */}
                {cliente ? (
                  <BotaoExportarXlsx
                    modeloId={modeloId}
                    clienteId={cliente.id}
                    /*
                      A CONSULTORIA ESCOLHIDA VAI JUNTO NO DOWNLOAD.

                      Sem esta linha, a tela mostraria a consultoria que ela
                      escolheu e o arquivo sairia com o subtítulo da ativa — o
                      defeito mais confuso possível, porque não parece um
                      defeito: parece que o sistema escolheu outra. A escolha
                      vale para o que se vê E para o que se baixa, e o mesmo id
                      alimenta os dois.

                      Vazio não é passado adiante: vira `null`, que é como a
                      rota distingue "escolha automática" de "esta aqui".
                    */
                    consultoriaId={consultoriaId || null}
                    nomeCliente={cliente.nomeFantasia}
                  />
                ) : null}
              </>
            }
          />
        </>
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

      {/*
        AS DUAS JANELAS FICAM FORA DO CONDICIONAL DA GRADE.

        Elas não dependem de haver grade: "criar planilha" existe justamente
        para quando não há nada na tela, e "enviar" precisa poder dizer o que
        falta sem que a grade tenha de existir primeiro. Dentro dos ramos, a
        segunda ficaria inalcançável no estado vazio — que é onde ela mais
        serve para explicar.
      */}
      <JanelaCriarPlanilha
        aberta={janelaCriar}
        clientes={clientes}
        clienteId={clienteId}
        consultoriaTitulo={consultoriaTitulo}
        aoFechar={() => definirJanelaCriar(false)}
        aoCriar={criarPlanilha}
      />

      <JanelaEnviar
        aberta={janelaEnviar}
        planilha={nomeDaPlanilha}
        clientes={clientes}
        clienteId={clienteId}
        aoFechar={() => definirJanelaEnviar(false)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Os seletores
// ---------------------------------------------------------------------------

/**
 * A BARRA SUPERIOR — TRÊS CAMPOS À ESQUERDA, E AS AÇÕES À DIREITA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ÁREA MAIS IMPORTANTE DA TELA É A PLANILHA. NÃO ESTA BARRA.          │
 * │                                                                      │
 * │ A versão anterior gastava a altura de um cartão com os seletores e     │
 * │ mais um cartão com o catálogo dos modelos que ainda não saem. Dois      │
 * │ blocos de cromo antes da primeira célula.                             │
 * │                                                                      │
 * │ Aqui são três campos e os botões, na altura de uma linha. A barra não  │
 * │ tem título, não tem descrição e não tem moldura de cartão — ela é uma   │
 * │ faixa de comando, e o que ela comanda é a grade logo abaixo.           │
 * │                                                                      │
 * │ Em tela estreita ela QUEBRA, e quebrar é o certo: empilhar é pior que  │
 * │ cortar, e a grade continua inteira porque o scroll horizontal dela é    │
 * │ dentro do próprio quadro.                                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ORDEM DAS AÇÕES — criar, trazer de fora, guardar, mandar            │
 * │                                                                      │
 * │ E é a ordem do trabalho: primeiro se cria ou se importa, depois se      │
 * │ guarda, e só no fim se manda para alguém. Nada aqui é decorativo.       │
 * │                                                                      │
 * │ "Exportar" NÃO está nesta lista, e a ausência é deliberada. Ele fica    │
 * │ colado na grade (ver `acoes` da prévia), porque é o gesto que tira o    │
 * │ arquivo daqui — e quem o pede está com os olhos na planilha. Numa       │
 * │ faixa que fala de escolhas ele passaria por uma quinta escolha.        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE "RECARREGAR" SAIU DAQUI                                      │
 * │                                                                      │
 * │ "Abrir planilha" existia porque a leitura do repositório é assíncrona,  │
 * │ e o botão era o momento em que ela decidia pagar esse custo. Com a      │
 * │ barra compacta ele virou um passo a mais entre ela e a grade — e a      │
 * │ grade é o que ela veio ver.                                            │
 * │                                                                      │
 * │ "Recarregar" era o que sobrava dele. Fazia sentido enquanto a única     │
 * │ forma de ver dado novo era pedir de novo; agora as trocas de cliente e  │
 * │ de modelo releem sozinhas, e o que restava era um botão que quase       │
 * │ sempre devolvia a mesma coisa — no lugar mais caro da tela, que é a     │
 * │ linha de cima.                                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function Seletores({
  modelos,
  clientes,
  modeloId,
  clienteId,
  consultorias,
  consultoriaId,
  consultoriaTitulo,
  planilhaAberta,
  criar,
  salvar,
  enviar,
  aoTrocarCliente,
  aoTrocarModelo,
  aoTrocarConsultoria,
}: {
  modelos: readonly ModeloPlanilha[];
  clientes: readonly { id: string; nomeFantasia: string; cidade: string }[];
  modeloId: string;
  clienteId: string;
  /** Só as consultorias DESTE cliente — o recorte é feito pelo ambiente. */
  consultorias: readonly { id: string; titulo: string }[];
  /** Vazio = "a ativa do cliente". */
  consultoriaId: string;
  /** O nome resolvido da consultoria, para quando a escolha é automática. */
  consultoriaTitulo: string | null;
  /** O nome da planilha na tela — é o que a janela de envio confere. */
  planilhaAberta: string;
  criar: () => void;
  salvar: React.ReactNode;
  enviar: () => void;
  aoTrocarCliente: (id: string) => void;
  aoTrocarModelo: (id: string) => void;
  aoTrocarConsultoria: (id: string) => void;
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
        A CONSULTORIA PASSOU A SER ESCOLHIDA — ver `seletor-consultoria.tsx`.

        O nome não é só informativo: ele entra no subtítulo do arquivo gerado.
        Enquanto era texto parado, um cliente com duas consultorias exportava a
        da mais recente não concluída sem ter como pedir a outra.
      */}
      <Campo rotulo="Consultoria" htmlFor="consultoria-planilha">
        <SeletorDeConsultoria
          consultorias={consultorias}
          selecionada={consultoriaId}
          /* O nome que o sistema resolveu quando a escolha é automática. */
          tituloAutomatico={consultoriaTitulo}
          semCliente={clienteId === ""}
          aoTrocar={aoTrocarConsultoria}
        />
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
          variante="secundario"
          tamanho="sm"
          onClick={criar}
          title="Abrir uma grade nova no editor"
        >
          + Criar planilha
        </Botao>

        {/*
          IMPORTAR PDF — ele é um LINK e não um botão, porque leva a uma rota:
          a importação tem etapas próprias e vive em `/planilhas/importar`.
          Fazer dela um estado desta tela obrigaria a esconder a grade — e a
          grade é a regra.
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

        {salvar}

        <Botao
          variante="secundario"
          tamanho="sm"
          onClick={enviar}
          title="Preparar o envio desta planilha para o cliente"
        >
          Enviar para cliente
        </Botao>

        {/*
          O NOME DA PLANILHA, NO FIM DA FAIXA — é o que o envio confere.

          Ele repete o que o subtítulo da grade já diz, e é de propósito: quem
          está prestes a clicar em "enviar" precisa saber QUAL planilha está
          em foco, e a resposta não pode depender de subir o olho até o
          subtítulo. O `title` devolve o nome inteiro quando ele for cortado.
        */}
        <span
          aria-hidden
          className="max-w-[16rem] truncate text-[0.75rem] text-[var(--tinta-fraca)]"
          title={planilhaAberta}
        >
          {planilhaAberta}
        </span>
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
