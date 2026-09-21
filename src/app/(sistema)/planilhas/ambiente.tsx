"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Aviso, EstadoVazio } from "@/components/ui/superficie";
import { cn } from "@/lib/utils/cn";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { montarContexto } from "@/lib/planilhas/contexto";
import { sobreporSessao } from "@/lib/planilhas/sessao-planilha";
import {
  conferirPlanilha,
  dependeDePrecos,
  retratoDoContexto,
} from "@/lib/planilhas/procedencia";
import type {
  AlteracaoDaSessao,
  ContextoParaRetrato,
  RetratoDePrecos,
} from "@/lib/planilhas/procedencia";
import {
  acervoDeFichas,
  estadoDePrecoDaBiblioteca,
  estadoDePrecoDoCliente,
  ingredientesDaSessao,
  insumoFoiExcluido,
} from "@/lib/dados/demonstracao";
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
import {
  SEM_HISTORICO,
  desfazer as desfazerHistorico,
  operacaoDeMapa,
  operacaoDeRemocao,
  podeDesfazer,
  podeRefazer,
  proximaDoDesfazer,
  proximaDoRefazer,
  refazer as refazerHistorico,
  registrar as registrarHistorico,
  type DestinoDaOperacao,
  type Historico,
  type Operacao,
} from "@/lib/planilhas/historico-edicao";
import { PreviaDaPlanilha, type SelecaoDaGrade } from "@/components/ui/previa-tabular";
import { BotaoExportarXlsx } from "./gerar";
import { SeletorDeCliente } from "./seletor";
import { SeletorDeConsultoria } from "./seletor-consultoria";
import { SeletorDeModelo } from "./seletor-modelo";
import { JanelaCriarPlanilha, criarFolhaDoModelo, type ModeloLivre } from "./criar";
import { BarraDeFormatacao } from "./formatacao";
import { BotaoSalvar } from "./salvar";
import { JanelaEnviar } from "./enviar";
import { BotoesDeHistorico } from "./historico-edicao-botoes";
import { ComandoDeImportacao } from "./importar-comando";
import { AvisoDeProcedencia } from "./procedencia-aviso";
import { NotaDaRetomada, OfertaDeRetomada } from "./retomada-aviso";
import * as armazemDaSessao from "./retomada-sessao";
import { estaFresca, paraTexto, valePara, type Retomada } from "@/lib/planilhas/retomada";
import { FaixaDeAcao, useAvisoDeAcao } from "@/components/ui/aviso-acao";

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
  /*
    `useState` COM FUNÇÃO INICIALIZADORA, E NÃO UMA CHAMADA SOLTA.

    `armazemDaSessao.ler()` faz `JSON.parse` de uma planilha inteira. Escrito
    direto no corpo, ele rodaria a CADA render — e a leitura não é idempotente
    só em custo: o objeto devolvido seria novo a cada repintura, e qualquer
    `useMemo`/`useEffect` que dependesse dele dispararia à toa.

    A forma com função o avalia UMA vez, na montagem, e o valor fica estável
    pelo resto da vida do componente. É o mesmo motivo pelo qual os outros
    `useState` deste arquivo não fazem trabalho no corpo.
  */
  const [rascunhoInicial] = useState(() => armazemDaSessao.ler());
  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ A LEITURA DO RASCUNHO ACONTECE AQUI, UMA VEZ                          │
    │                                                                      │
    │ Depois do estado do rascunho, e antes dos `useState` cujos VALORES     │
    │ INICIAIS dependem dela: o modelo e o cliente. É este par que faz a     │
    │ tela abrir onde ela parou, em vez de abrir na planilha em branco.      │
    │                                                                      │
    │ Isto roda no SERVIDOR também, na primeira pintura — e lá não há        │
    │ `sessionStorage`. `retomada-sessao.ts` devolve `null` nesse caso, e é  │
    │ por isso que ele é defensivo: o mesmo componente é renderizado nos     │
    │ dois lugares, e a leitura precisa ser uma resposta e não um estouro.   │
    │                                                                      │
    │ `null` é o normal em três casos, e os três estão certos:               │
    │   · é a primeira vez dela nesta aba;                                  │
    │   · ela fechou a aba, que é o que `sessionStorage` faz;               │
    │   · o rascunho é de outra versão, e `deTexto` o recusou inteiro.      │
    └──────────────────────────────────────────────────────────────────────┘

    ── O QUE A SEED NÃO FAZ ────────────────────────────────────────────────

    Ela NÃO escreve em `edicoes`, `pincel`, `folhasExtras` nem `criada`. Isso é
    do efeito de carga, e a razão é `carregar`: ele LIMPA os cinco ao começar,
    de propósito (duas planilhas do mesmo modelo têm abas com o mesmo nome).
    Se a seed os preenchesse, `carregar` os apagaria na linha seguinte e o
    trabalho dela sumiria sem aviso.

    Aqui só entram o modelo, o cliente e a consultoria — os três que dizem de
    QUAL planilha é o rascunho, e que `carregar` precisa conhecer para montar
    a grade certa antes de restaurar o resto por cima.
  */
  const rascunhoDaqui =
    rascunhoInicial !== null && estaFresca(rascunhoInicial, new Date()) ? rascunhoInicial : null;

  /**
   * A PERGUNTA "O QUE ESTÁ GUARDADO AGORA?" — e ela é feita mais de uma vez.
   *
   * `rascunhoDaqui` é a resposta de QUANDO A TELA ABRIU. Esta função é a
   * resposta de AGORA, e as duas precisam existir pelas duas perguntas
   * diferentes:
   *
   *   · na seed, "onde eu abro?" — e aí só vale o que já existe;
   *   · no efeito de carga, "posso aplicar?" — e aí vale o que a tela abriu;
   *   · na oferta, "há trabalho de outro par para oferecer?" — e aí vale o
   *     que está guardado NESTE instante, porque ela pode ter trocado de
   *     cliente duas vezes desde que a tela abriu.
   *
   * A leitura é relida em vez de reaproveitada de propósito: um valor
   * capturado na montagem é uma fotografia, e a oferta é sobre o presente.
   * O custo é um `JSON.parse` por troca de par — não por render.
   */
  function rascunhoFresco(): Retomada | null {
    const atual = armazemDaSessao.ler();
    if (atual === null) return null;
    return estaFresca(atual, new Date()) ? atual : null;
  }

  /*
    A REGRA DO PAR, APLICADA DUAS VEZES: uma para saber qual cliente e qual
    modelo a tela deve abrir, e outra — no efeito de carga — para saber se o
    rascunho ainda serve para onde a tela foi parar.

    `clienteInicial` VENCE, e a ordem é a mesma do modelo: se ela chegou por um
    link de `/clientes/[id]`, a intenção declarada é aquela, e sobrescrevê-la
    com o rascunho seria desfazer um clique dela.
  */
  const clienteDoRascunho = clienteInicial === null && rascunhoDaqui !== null ? rascunhoDaqui.clienteId : "";

  const [modeloId, definirModeloId] = useState(
    modeloInicial && modeloDisponivel(modeloInicial)
      ? modeloInicial
      : rascunhoDaqui?.modeloId ?? MODELO_PADRAO
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
  const [clienteId, definirClienteId] = useState(clienteInicial ?? clienteDoRascunho);

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
  const [consultoriaId, definirConsultoriaId] = useState(
    /* A consultoria só vem do rascunho quando o rascunho é deste par — senão é
       um id de outro cliente, que `montarContexto` não acharia. Ver `valePara`. */
    clienteDoRascunho !== "" && rascunhoDaqui !== null ? rascunhoDaqui.consultoriaId : ""
  );
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
  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ A APLICAÇÃO DA RETOMADA ACONTECE AQUI — E NÃO DENTRO DE `carregar`     │
    │                                                                      │
    │ Ela precisa rodar quando a grade daquele par EXISTE, e é isso que      │
    │ decide o lugar dela.                                                            │
    │                                                                      │
    │ O efeito de carga roda uma vez e chama `carregar`, que é `async`:      │
    │ quando ele devolve, a grade acabou de ser montada. É o ÚNICO ponto de  │
    │ onde se sabe que "a grade que está na tela é a do par que a retomada   │
    │ descreve", e é exatamente a condição para escrever `edicoes` sem       │
    │ vazar dado de um cliente para outro — `carregar` limpa os cinco mapas  │
    │ no começo, de propósito (ver a nota longa lá dentro), então quem       │
    │ aplica tem de vir DEPOIS dele, nunca antes.                           │
    │                                                                      │
    │ A espera é `await`: sem ela, o `.then` rodaria junto com o `carregar`  │
    │ que ainda não terminou de limpar, e o `carregar` apagaria por cima o   │
    │ que a retomada acabasse de escrever. É o defeito de ordem clássico     │
    │ desta rodada — e é por isso que a chamada é `await` e não `void`.      │
    └──────────────────────────────────────────────────────────────────────┘
  */
  const [revisao, definirRevisao] = useState(0);
  const mudou = () => definirRevisao((r) => r + 1);

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ A RETOMADA — DECISÃO 4, E AS TRÊS PERGUNTAS QUE ELA RESPONDE          │
    │                                                                      │
    │ Tudo o que é aplicado aqui é o DELTA do trabalho dela (ver o topo de   │
    │ `@/lib/planilhas/retomada`). A grade o modelo remonta sozinho: é a     │
    │ MESMA grade que estava na tela, porque sai do mesmo gerador com o      │
    │ mesmo contexto.                                                        │
    │                                                                      │
    │ ── O QUE VOLTA, E É POR ISSO QUE A FUNÇÃO ESTÁ AQUI ──────────────── │
    │                                                                      │
    │ `edicoes` são os valores digitados e os TIPOS deles — texto, número e  │
    │ DATA, que é o que o codec de `retomada.ts` protege. `pincel` traz      │
    │ cor, negrito e alinhamento, pela mesma chave de endereço. `aba` é a    │
    │ aba aberta. `folhasExtras` e `criada` são as abas que não existiriam   │
    │ sem ela — nenhuma das duas se deriva do modelo.                        │
    │                                                                      │
    │ A CONSULTORIA é a única que NÃO é restaurada aqui, e a razão está em   │
    │ `valePara`: ela já foi semeada no `useState` (é ela que faz           │
    │ `carregar` montar o contexto certo) e reescrevê-la depois não mudaria  │
    │ a grade que já está na tela — mudaria só o rótulo. Duas fontes para o  │
    │ mesmo campo é o que o comentário do `<select>` proíbe.                 │
    └──────────────────────────────────────────────────────────────────────┘
  */
  function aplicarRetomada(r: Retomada) {
    definirEdicoes(r.edicoes);
    definirPincel(r.pincel);
    definirFolhasExtras(r.folhasExtras);
    definirCriada(r.criada);
    /*
      A ABA ENTRA COM TETO.

      `deTexto` já garante que ela não é negativa nem fracionária, mas ele não
      conhece a lista de folhas — e o índice pode apontar para fora se ela
      criou a planilha numa versão que tinha mais abas. A prévia já recua para
      a primeira quando o índice não existe (ver `PreviaDaPlanilha`), mas
      deixar o estado mentir sobre qual aba está aberta faria a barra de
      formatação endereçar a folha ERRADA: ela lê a mesma lista, e o índice
      inválido cai no `?? folhasParaBarra[0]`, que é uma folha diferente da que
      a prévia mostra no mesmo instante.
    */
    definirAba(r.aba);
    definirSelecao(null);
    definirRetomada(r);
    definirOferta(null);
    /*
      A PILHA DE DESFAZER NÃO VEM JUNTO, e ela não pode vir.

      Ela guarda o `antes` de cada operação — e o `antes` de uma edição de
      ontem é o valor que a célula tinha ontem. Aplicar a pilha faria o
      primeiro Ctrl+Z devolver valores de uma sessão que já terminou, sobre
      uma grade que pode ter mudado no meio. O trabalho dela volta; o
      HISTÓRICO do que aconteceu no meio do caminho não. `esquecerHistorico`
      roda no `carregar` por este mesmo motivo.
    */
    esquecerHistorico();
    mudou();
  }

  /**
   * O NOME DE UM CLIENTE PELO ID, para as notas da retomada.
   *
   * A nota fala de um cliente que NÃO é o da tela — é o do rascunho. `cliente`,
   * logo acima, é o da tela: `clientes.find((c) => c.id === clienteId)`. Usar
   * aquele ali mostraria o nome errado exatamente no caso em que a nota existe
   * para desfazer a confusão.
   */
  function nomeDoCliente(id: string): string | null {
    return clientes.find((c) => c.id === id)?.nomeFantasia ?? null;
  }

  /**
   * "ABRIR AQUELA PLANILHA" — a única travessia da oferta, e ela é uma TROCA.
   *
   * ── POR QUE NÃO EXISTE "TRAZER PARA ESTA" ────────────────────────────────
   *
   * Ver a nota longa em `retomada-aviso.tsx`: uma edição é endereçada por
   * `"<aba>::<célula>"`, e o mesmo endereço existe em planilhas diferentes
   * querendo dizer coisas diferentes. Copiar de uma para a outra escreveria
   * números certos nas linhas erradas, sem erro nenhum.
   *
   * O que esta função faz é voltar a tela para o par de origem — onde cada
   * endereço volta a significar o que significava — e reaplicar o trabalho lá.
   *
   * ── A ORDEM, E POR QUE A OFERTA NÃO É LIMPA ANTES ───────────────────────
   *
   * `definirOferta(null)` fica para DEPOIS da carga, dentro do `then`. Limpá-la
   * na primeira linha reabriria o efeito de gravação no instante mais perigoso
   * possível: o estado da tela ainda é o da planilha que ela estava vendo, e a
   * primeira passagem do efeito o escreveria por cima do rascunho que ela
   * acabou de pedir para abrir. Deixando a oferta de pé até o fim, o efeito de
   * gravação continua pausado e o rascunho fica intacto até a restauração
   * chegar.
   *
   * `carregar` recebe o cliente e o modelo NOVOS — e não os do estado, que
   * ainda são os antigos nesta linha. O `setState` é assíncrono; ler `clienteId`
   * aqui devolveria a planilha anterior.
   */
  function abrirPlanilhaDaOferta() {
    const alvo = oferta;
    if (alvo === null) return;

    definirClienteId(alvo.clienteId);
    definirModeloId(alvo.modeloId);
    definirConsultoriaId(alvo.consultoriaId);

    void carregar(alvo.clienteId, alvo.modeloId, alvo.consultoriaId).then((montou) => {
      /*
        NÃO MONTou? A oferta sai e a nota some com ela.

        Manter a nota de pé depois de uma carga que falhou criaria o pior dos
        dois mundos: a tela dizendo "seu trabalho está guardado" e a planilha
        que o contém não abrindo. A mensagem de erro do `carregar` já está na
        tela, e é ela que manda.
      */
      if (!montou) {
        definirOferta(null);
        return;
      }
      aplicarRetomada(alvo);
    });
  }

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ O DESFAZER E O REFAZER — E POR QUE A PILHA MORA NUM `useRef`          │
    │                                                                      │
    │ A pilha guarda os estados ANTERIORES. Se ela fosse estado do React,    │
    │ cada operação registrada mudaria a pilha, o que re-renderizaria a      │
    │ tela, o que chamaria de novo quem registra — e o desfazer entraria     │
    │ num laço. Aqui só o PRESENTE é estado (`edicoes` e `pincel`); a pilha  │
    │ é uma anotação que acompanha, e vive fora do ciclo de render.         │
    │                                                                      │
    │ O que a tela precisa saber em tempo real é só SE há o que desfazer e   │
    │ SE há o que refazer, para acender ou apagar os dois botões. Isso é     │
    │ `podeDesfazer`/`podeRefazer`, guardado no estado mínimo que existe     │
    │ para isso: dois booleanos.                                            │
    │                                                                      │
    │ A regra de agrupamento mora em `@/lib/planilhas/historico-edicao`,     │
    │ que é puro e foi conferido por execução — inclusive o caso do          │
    │ briefing: escrever BATATA é UMA operação, não seis.                   │
    └──────────────────────────────────────────────────────────────────────┘
  */
  const historico = useRef<Historico>(SEM_HISTORICO);
  const [temDesfazer, definirTemDesfazer] = useState(false);
  const [temRefazer, definirTemRefazer] = useState(false);

  /*
    O RECADO DA AÇÃO — ver `@/components/ui/aviso-acao`.

    Ele mora aqui, e não dentro da faixa de comando, porque quem SABE o que
    aconteceu é este componente: é ele que tem a pilha, e é dele que sai o
    rótulo da operação desfeita. A faixa só posiciona o que recebe — a mesma
    divisão que os botões de histórico já usam.
  */
  const { aviso, anunciar, dispensar: dispensarAviso } = useAvisoDeAcao();

  /** Sincroniza os dois botões com a pilha. A pilha não é estado. */
  function sincronizarHistorico() {
    definirTemDesfazer(podeDesfazer(historico.current));
    definirTemRefazer(podeRefazer(historico.current));
  }

  /**
   * Registra uma operação e aplica o `depois` dela.
   *
   * A aplicação vem DEPOIS do registro de propósito: se a ordem fosse inversa,
   * o `antes` já teria sido sobrescrito e o desfazer não teria para onde
   * voltar.
   */
  function operar(operacao: Operacao) {
    historico.current = registrarHistorico(historico.current, operacao);
    aplicarParcial(operacao.destino, operacao.depois);
    sincronizarHistorico();
    mudou();
  }

  /**
   * Aplica um mapa parcial no mapa certo.
   *
   * O `null` de um valor não é "o valor nulo": é o sinal de APAGAR a chave.
   * Sem isso, limpar uma formatação no desfazer deixaria um `null` onde havia
   * um estilo, e a barra de formatação passaria a ler um objeto vazio como se
   * fosse marcação — o botão de negrito apareceria apagado, que é o certo por
   * acidente, e a cor herdada da linha voltaria sem ninguém pedir.
   */
  function aplicarParcial(destino: DestinoDaOperacao, parcial: Record<string, unknown>) {
    const entradas = Object.entries(parcial);
    if (entradas.length === 0) return;

    if (destino === "pincel") {
      definirPincel((atual) => {
        const proximo = { ...atual };
        for (const [k, v] of entradas) {
          if (v === null) delete proximo[k];
          else proximo[k] = v as EstiloGrade;
        }
        return proximo;
      });
      return;
    }

    definirEdicoes((atual) => {
      const proximo = { ...atual };
      for (const [k, v] of entradas) {
        if (v === null) delete proximo[k];
        else proximo[k] = v as CelulaGrade;
      }
      return proximo;
    });
  }

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ DESFAZER E REFAZER AGORA DIZEM O QUE FIZERAM                         │
    │                                                                      │
    │ Os dois botões mudavam de estado e mais nada. Numa planilha com       │
    │ trinta edições, Ctrl+Z repetido vira adivinhação: ela olha a célula   │
    │ e tenta lembrar o que havia ali antes.                                │
    │                                                                      │
    │ A frase usa o RÓTULO DA PRÓPRIA OPERAÇÃO — "Célula C4", "limpar       │
    │ Linha 12" —, que já existe na pilha desde a rodada do histórico.      │
    │ Não há texto novo a inventar, e por isso o recado não pode divergir   │
    │ do que o `title` do botão promete: os dois leem a mesma operação.      │
    │                                                                      │
    │ O NADA-TAMBÉM-FALA. Quando não há o que desfazer, o botão está        │
    │ desabilitado e um clique não chega aqui. Mas o ATALHO chega: o        │
    │ ouvinte de teclado chama estas funções direto, e o caminho de saída    │
    │ que era um `return` mudo passou a explicar-se. Sem isso, apertar      │
    │ Ctrl+Z numa planilha recém-aberta não dava sinal nenhum — e a         │
    │ conclusão natural é que o atalho não funciona.                        │
    └──────────────────────────────────────────────────────────────────────┘
  */
  function desfazerEdicao() {
    const resultado = desfazerHistorico(historico.current);
    if (resultado === null) {
      anunciar("Não há nada para desfazer nesta planilha.", "erro");
      return;
    }
    historico.current = resultado.historico;
    aplicarParcial(resultado.operacao.destino, resultado.operacao.antes);
    sincronizarHistorico();
    mudou();
    anunciar(`Desfeito: ${resultado.operacao.rotulo}.`);
  }

  function refazerEdicao() {
    const resultado = refazerHistorico(historico.current);
    if (resultado === null) {
      anunciar("Não há nada para refazer.", "erro");
      return;
    }
    historico.current = resultado.historico;
    aplicarParcial(resultado.operacao.destino, resultado.operacao.depois);
    sincronizarHistorico();
    mudou();
    anunciar(`Refeito: ${resultado.operacao.rotulo}.`);
  }

  /** Zera a pilha. Trocar de cliente ou de modelo é outra planilha. */
  function esquecerHistorico() {
    historico.current = SEM_HISTORICO;
    definirTemDesfazer(false);
    definirTemRefazer(false);
  }

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ QUEM ESCREVE NA PLANILHA PASSA POR `operar` — SEM EXCEÇÃO             │
    │                                                                      │
    │ A edição de célula e a pintura continuam existindo como funções,       │
    │ porque são chamadas de dois lugares cada uma. O que mudou é que elas   │
    │ não escrevem mais direto no estado: elas montam a OPERAÇÃO — o que     │
    │ tocado, o que tinha antes, o que passa a ter — e entregam a `operar`.  │
    │                                                                      │
    │ É a diferença entre um desfazer que existe e um que funciona pela      │
    │ metade. Se um só caminho de escrita escapasse daqui, a pilha passaria  │
    │ a devolver estados que nunca foram verdade, e o defeito apareceria     │
    │ longe do lugar onde foi causado: uma célula que "volta errado" depois  │
    │ de dois Ctrl+Z.                                                      │
    │                                                                      │
    │ O VALOR CONFIRMADO, NÃO A TECLA. `previa-tabular` só chama `aoEditar`  │
    │ quando o Enter, o Tab ou o clique fora fecham a edição — ver `fechar`  │
    │ lá. É por isso que escrever BATATA entra como UMA operação, e não      │
    │ como seis, que é o que o briefing exige.                              │
    └──────────────────────────────────────────────────────────────────────┘
  */

  /**
   * Escreve o valor confirmado de uma célula, registrando a operação.
   *
   * O endereço chega já montado — `"<aba>::<célula>"` —, feito pelo próprio
   * componente da grade. Aqui ele só é repassado: é ele que identifica a célula
   * na operação, e é ele que sobrevive à troca de aba.
   */
  function editarCelula(chave: string, valor: CelulaGrade) {
    /*
      O RÓTULO É SÓ O ENDEREÇO — "Célula C4".

      A chave chega inteira, `"Base::C4"`, porque é assim que ela identifica a
      célula sem ambiguidade. Mas quem lê o `title` do botão está diante de UMA
      aba aberta: o nome dela ali dentro é ruído. O corte é no ÚLTIMO `::`,
      porque o nome da aba pode conter qualquer coisa menos isso — `split` sem
      limite devolveria o nome da aba no primeiro pedaço e o endereço no último,
      que é exatamente o que se quer.
    */
    const enderecoDaChave = chave.slice(chave.lastIndexOf("::") + 2);
    const operacao = operacaoDeMapa("celula", "edicoes", chave, `Célula ${enderecoDaChave}`, edicoes, {
      [chave]: valor,
    });
    /*
      Valor igual ao que já estava não entra: `operacaoDeMapa` devolve um `antes`
      vazio, e `operar` empilharia um passo que não desfaz nada. É este o filtro
      que impede o Ctrl+Z de parecer quebrado — ele "não fazer nada" uma vez
      para só depois desfazer de verdade.
    */
    if (Object.keys(operacao.antes).length === 0) return;
    operar(operacao);
  }

  /*
    O RÓTULO DO PRÓXIMO PASSO, LIDO PELA FUNÇÃO E NÃO PELO ARRAY.

    "A última do passado" é a regra do desfazer, e ela mora no módulo puro —
    inclusive com nome (`proximaDoDesfazer`). Escrever `passado.at(-1)` aqui
    seria uma segunda resposta para a mesma pergunta, e no dia em que a pilha
    mudasse de forma, uma das duas ficaria para trás em silêncio.
  */
  const rotuloDesfazer = proximaDoDesfazer(historico.current)?.rotulo ?? null;
  const rotuloRefazer = proximaDoRefazer(historico.current)?.rotulo ?? null;

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

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ A PROCEDÊNCIA DA PLANILHA QUE ESTÁ NA TELA                            │
    │                                                                      │
    │ ── POR QUE ESTE ESTADO EXISTE ────────────────────────────────────── │
    │                                                                      │
    │ `carregar` monta a grade a partir de um instante dos dados. A partir  │
    │ daí, a grade é uma FOTOGRAFIA — e a fotografia não se atualiza        │
    │ sozinha. Só que os dados por baixo continuam vivos: a Érika abre a    │
    │ biblioteca noutra aba, corrige o preço da batata, volta para cá — e   │
    │ a grade ainda mostra o custo do preço velho, sem nada dizendo isso.   │
    │                                                                      │
    │ É a mesma mentira do arquivo de março do briefing, em escala de       │
    │ minutos em vez de meses: "não recalcular silenciosamente uma          │
    │ planilha histórica porque um ingrediente mudou depois".               │
    │                                                                      │
    │ ── O QUE ELE GUARDA, E O QUE ELE DELIBERADAMENTE NÃO GUARDA ──────── │
    │                                                                      │
    │ Só os PREÇOS dos insumos que a planilha mostra — insumo, nome e valor. │
    │ Guardar o contexto inteiro (`tarefas`, `acompanhamentos`, `fichas`,    │
    │ `cliente`) faria deste estado uma SEGUNDA CÓPIA DO BANCO dentro do     │
    │ componente: dezenas de objetos vivos, cada um com data e identidade,   │
    │ mantidos em memória para conferir um número. E o aviso só tem o que    │
    │ dizer sobre preço, porque é o preço que muda sozinho — tarefa          │
    │ concluída não reescreve uma célula da planilha.                       │
    │                                                                      │
    │ ── POR QUE `null` NÃO É "SEM RETRATO" ────────────────────────────── │
    │                                                                      │
    │ `null` significa "esta planilha não tem preço dentro" — o relatório   │
    │ de consultoria e a planilha em branco. É diferente de um retrato      │
    │ VAZIO, que significaria "tem preço dentro e não havia insumo nenhum". │
    │ A distinção importa porque `conferirPrecos` trata lista vazia como    │
    │ "não há o que afirmar"; sem a distinção, os dois modelos sem preço    │
    │ passariam a comparar nada com nada a cada render.                     │
    └──────────────────────────────────────────────────────────────────────┘
  */
  const [procedencia, definirProcedencia] = useState<RetratoDePrecos | null>(null);

  /*
    O CONTEXTO DE ONDE A GRADE SAIU — guardado para poder CONFERIR.

    ┌────────────────────────────────────────────────────────────────────┐
    │ ELE É A FOTOGRAFIA DO DIA, NÃO O ESTADO DE AGORA                   │
    │                                                                    │
    │ O nome correto seria "contexto da geração": ele é o instantâneo de  │
    │ onde a grade saiu, e serve de base para reconstruir os preços de    │
    │ HOJE — que são este mesmo contexto com o que foi digitado na         │
    │ sessão por cima.                                                    │
    │                                                                    │
    │ Ele não é o "agora" porque o agora muda por fora (noutra tela, no    │
    │ store) e este objeto não. Chamá-lo de "de agora" faria quem ler      │
    │ depois acreditar que ele acompanha o store — e ele não acompanha:    │
    │ acompanha o `useDemonstracao`, que só diz QUE algo mudou.           │
    │                                                                    │
    │ A vantagem de guardá-lo em vez de reler o repositório a cada render  │
    │ é a mesma de sempre: `montarContexto` é assíncrona e lê tudo.       │
    └────────────────────────────────────────────────────────────────────┘
  */
  const [contextoDaGeracao, definirContextoDaGeracao] = useState<ContextoParaRetrato | null>(null);

  /*
    ── QUANDO A GRADE ATUAL FOI MONTADA ─────────────────────────────────────

    O aviso já diz O QUE mudou; esta data diz DESDE QUANDO. As duas informações
    juntas é que dão escala ao problema: "o preço do queijo mudou" num retrato
    de dois minutos atrás é uma conferência rápida; num de dois meses, é um
    custo por prato que pode ter mudado inteiro.

    Ela é do AMBIENTE, e não do componente do aviso, porque quem monta a grade
    é este arquivo — o aviso não tem como saber quando aquilo aconteceu, e
    inventar um `new Date()` lá dentro dataria o aviso em vez do retrato.

    Sem estado de hora: o valor só precisa estar certo quando o aviso aparece.
  */
  const [montadaEm, definirMontadaEm] = useState<Date | null>(null);

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ A RETOMADA — DECISÃO 4, E O QUE EXATAMENTE VOLTA                     │
    │                                                                      │
    │ Lido uma vez, na montagem, de `retomada-sessao.ts` (a memória da ABA, │
    │ que morre quando ela fecha). Ele é guardado em estado porque quem      │
    │ decide APLICAR é o efeito de carga, que precisa saber:                 │
    │                                                                      │
    │   · se há retomada;                                                   │
    │   · se ela é DESTE cliente e DESTE modelo — a regra está em            │
    │     `valePara`, que explica por que a chave é o par e não o cliente    │
    │     sozinho;                                                          │
    │   · se ela é fresca (o teto de 24h, abaixo, para não ressuscitar       │
    │     planilha da semana passada).                                      │
    │                                                                      │
    │ Ela fica em estado porque a NOTA na tela precisa dela: sem o texto     │
    │ guardado ali, não teria como dizer "há 2 minutos".                     │
    └──────────────────────────────────────────────────────────────────────┘
  */
  const [retomada, definirRetomada] = useState<Retomada | null>(null);

  /*
    ── O RELÓGIO DAS NOTAS, PARADO DE PROPÓSITO ─────────────────────────────

    As duas notas dizem "há 2 minutos", e essa frase é calculada a partir de um
    `Date`. Ele entra como ESTADO, fixado na montagem, e não como um
    `new Date()` no render.

    As duas alternativas são piores. `new Date()` no corpo do componente daria
    um valor diferente a cada repintura — dois renders do mesmo instante
    poderiam escrever "há 59 minutos" e "há 1 hora", e o texto mudaria sozinho
    na frente dela sem nada ter acontecido. Um `setInterval` mantendo-o em dia
    custaria uma repintura por minuto da planilha inteira, para atualizar uma
    frase que quase ninguém fica olhando — e que, quando ela recarregar, já
    vem certa de novo.

    A montagem é o momento em que as notas aparecem, e é o momento em que o
    número precisa estar certo.
  */
  const [agora] = useState(() => new Date());

  /*
    ── A OFERTA, E POR QUE ELA NÃO APLICA SOZINHA ────────────────────────────

    Quando o trabalho guardado é de OUTRO cliente ou OUTRO modelo, ele não pode
    ser aplicado — mas descartá-lo em silêncio apagaria o trabalho dela sem
    dizer nada. Aqui ele fica guardado como OFERTA, e a nota pergunta.

    Aplicar por conta própria é a única coisa que este par não pode fazer: a
    planilha abriria com números que ela não digitou NESTA tela, e sem saber.
  */
  const [oferta, definirOferta] = useState<Retomada | null>(null);

  /*
    ── A MEMÓRIA DO QUE JÁ ESTÁ GUARDADO ────────────────────────────────────

    `useRef` e não estado: é a comparação do efeito de gravação, que roda a
    cada mudança. Como estado, cada gravação mudaria o ref → repintaria → o
    efeito rodaria de novo, e a cada gravação a tela faria um ciclo à toa.
    Escrever texto pequeno é barato; repintar a planilha inteira a cada
    Ctrl+Z não é.
  */
  const ultimoGuardado = useRef<string | null>(null);

  /*
    ── O AVISO SÓ ACORDA SE ALGUÉM ESCREVER ────────────────────────────────

    Duas coisas precisam ser verdade para o aviso fazer sentido, e é fácil
    esquecer a segunda: o preço tem de ter mudado, E o ambiente tem de
    re-renderizar para poder perguntar.

    Editar um preço acontece na tela de ingredientes, no store de
    demonstração — que é estado de MÓDULO. Este componente não é notificado
    por nada: sem esta linha, ela editaria o preço, voltaria para a Central
    e o aviso só apareceria no próximo clique em qualquer botão. O gancho é
    o que faz a Central escutar o mesmo store que a outra tela escreve.

    (É o mesmo motivo de `busca-global.tsx` ter ganhado `useDemonstracao()`
    nesta rodada: uma promessa na tela que só se cumpre depois de um clique
    em outro lugar não é uma promessa.)
  */
  const versaoDoStore = useDemonstracao();

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

    ── E ELA DEVOLVE UM VEREDITO, E NÃO `void` ─────────────────────────────

    O `Promise<boolean>` não é sobre a carga: é sobre PODER APLICAR A RETOMADA.
    Quem chama pergunta "a grade que está na tela agora é a do par que o
    rascunho descreve?", e a resposta só existe depois que este método
    terminou de limpar os mapas e montar a grade.

    `false` cobre os três caminhos em que não há grade do par: modelo sem
    gerador, cliente não encontrado, e a leitura que levantou. Nos três, mexer
    em `edicoes` seria escrever sobre uma planilha que não é a certa — que é
    exatamente a classe de defeito que a decisão 4 não pode introduzir.
  */
  async function carregar(
    escolhidoCliente: string,
    escolhidoModelo: string,
    escolhidaConsultoria: string = ""
  ): Promise<boolean> {
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
      E A PROCEDÊNCIA VAI COM ELAS.

      O retrato descreve os PREÇOS DO CLIENTE que estava escolhido — e preço,
      neste domínio, é do par (cliente, insumo). Manter o retrato do Empório
      enquanto o contexto passa a ser o de outro cliente compararia dois
      escopos diferentes: cada insumo cujo preço específico difere apareceria
      como "mudou de preço", e o aviso acusaria uma planilha que acabou de
      ser montada, com os dados de agora, de estar desatualizada.

      É o mesmo vazamento de `edicoes` e `pincel`, entrando pela porta da
      conferência: o dado está certo, o escopo é que é de outro cliente.
    */
    definirProcedencia(null);
    definirContextoDaGeracao(null);
    definirMontadaEm(null);

    /*
      E A PILHA DE DESFAZER VAI COM ELAS.

      Ela guarda o `antes` de operações feitas sobre a planilha ANTERIOR. Manter
      a pilha faria o primeiro Ctrl+Z na ficha do Empório reescrever um endereço
      — "Base::B7" — que existe nas duas planilhas, devolvendo o texto de outro
      cliente. É o mesmo vazamento que a limpeza de `edicoes` evita, por um
      caminho mais escondido: o desfazer escreve sem ela ter digitado nada.
    */
    esquecerHistorico();

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
      /*
        A PLANILHA EM BRANCO NÃO RECEBE RETRATO, e isto é `dependeDePrecos`
        dizendo que não, não um `null` escrito à mão. A pergunta "este modelo
        tem preço dentro?" mora no módulo puro, junto com a comparação — se
        ela fosse respondida por um `if` aqui, o dia em que um modelo novo
        entrasse com preço dentro seria o dia em que ele ficaria sem aviso,
        em silêncio.
      */
      definirProcedencia(dependeDePrecos(escolhidoModelo) ? [] : null);
      definirContextoDaGeracao(null);
      definirMontadaEm(null);
      return true;
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
      return false;
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
        return false;
      }

      /*
        ── A SESSÃO SOBE PARA DENTRO DO CONTEXTO, ANTES DE GERAR ───────────

        Aqui e não antes: `montarContexto` acabou de ler o repositório, e é
        este o instante em que o contexto existe para ser corrigido. A ordem
        importa — sobrepor depois de `gerador(contexto)` seria sobrepor uma
        grade já escrita, e a ficha nova não estaria nela.

        ┌────────────────────────────────────────────────────────────────┐
        │ SÓ AS FICHAS DO CLIENTE ESCOLHIDO ENTRAM                       │
        │                                                                │
        │ `acervoDeFichas` recortado por `escolhidoCliente` é a mesma     │
        │ lista que a aba de fichas do cliente mostra. Passar o acervo    │
        │ inteiro faria a planilha de um cliente citar o prato de outro — │
        │ e o modelo filtra por cliente, mas o filtro deixaria de ser a   │
        │ garantia: quem monta o contexto já teria vazado.               │
        │                                                                │
        │ O recorte é por `clienteId`, e ficha sem cliente (`""`) não     │
        │ entra em planilha de cliente nenhum — está dito em             │
        │ `Ficha.clienteId`.                                             │
        └────────────────────────────────────────────────────────────────┘
      */
      const contextoDaSessao = sobreporSessao(contexto, {
        fichas: acervoDeFichas(contexto.fichas ?? [], escolhidoCliente),
        ingredientesNovos: ingredientesDaSessao(),
      });

      definirConsultoriaTitulo(contextoDaSessao.consultoria?.titulo ?? null);
      definirGrade(gerador(contextoDaSessao));
      /*
        ── A FOTOGRAFIA E A DATA DELA, TIRADAS NO MESMO INSTANTE ──────────

        Este é o ponto exato em que a planilha passa a existir, e é o mesmo
        ponto em que os preços precisam ser retratados: `gerador(contexto)`
        acabou de escrever o custo de cada prato lendo `contexto`, e a partir
        da linha seguinte esse contexto pode envelhecer.

        Retratar DEPOIS de gerar, e não antes, é deliberado. Se os dois
        acontecessem em ordem inversa, uma edição de preço que coubesse entre
        eles deixaria o retrato de um instante e a grade de outro — e o
        aviso compararia a planilha com ela mesma.

        ── O QUE ACONTECE COM OS MODELOS SEM PREÇO ───────────────────────

        `retratoDoContexto` devolveria `[]` para uma planilha em branco, e um
        retrato vazio tem o significado oposto do que se quer: "tem preço
        dentro e não havia insumo". Por isso `dependeDePrecos` decide o tipo
        do valor — `null` para quem não tem preço dentro, o retrato para quem
        tem. É a mesma função que o módulo usa para explicar por que o
        relatório de consultoria não é avisado.
      */
      definirProcedencia(
        dependeDePrecos(escolhidoModelo) ? retratoDoContexto(contextoDaSessao) : null
      );
      definirContextoDaGeracao(contextoDaSessao);
      /*
        A MESMA LINHA DO RETRATO, E ELA É POR ISSO QUE ESTÁ AQUI.

        A data entra no MESMO ponto que o retrato, e não num efeito depois: o
        aviso diz "desde a geração", e "a geração" é exatamente o instante em
        que `gerador(contexto)` escreveu a grade que está na tela. Datá-la em
        outro lugar abriria uma janela em que o retrato seria de um momento e a
        data de outro — e o aviso diria que a planilha é mais nova ou mais
        velha do que ela é.
      */
      definirMontadaEm(new Date());
      return true;
    } catch {
      definirGrade(null);
      definirProblema(
        "Não foi possível montar a planilha com os dados de agora. Os dados continuam intactos — tente escolher de novo."
      );
      return false;
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
    /*
      A ORDEM AQUI É A COISA MAIS FRÁGIL DESTA RODADA, e ela tem duas metades.

      PRIMEIRO: `carregar` decide o que a retomada pode fazer, e por isso ele
      devolve um veredito em vez de ser disparado e esquecido. A pergunta é se
      a tela abriu no MESMO par (modelo, cliente) que o rascunho descreve —
      `valePara`, em `@/lib/planilhas/retomada`, é quem responde, e a razão de
      ser do par está escrita lá.

      SEGUNDO: o `then` só escreve em `edicoes` e `pincel` DEPOIS que `carregar`
      terminou de limpá-los. Inverter isso — aplicar antes, ou sem esperar —
      faria o `carregar` apagar por cima o trabalho recém-restaurado, e o
      sintoma seria o pior possível: a nota dizendo "retomamos" e a planilha
      vazia.
    */
    void carregar(clienteId, modeloId, consultoriaId).then((montou) => {
      if (!montou) return;
      if (rascunhoInicial === null) return;

      const onde = { modeloId, clienteId };
      if (!valePara(rascunhoInicial, onde)) return;

      aplicarRetomada(rascunhoInicial);
    });
    /*
      ┌────────────────────────────────────────────────────────────────────┐
      │ AS DEPENDÊNCIAS SÃO SÓ ESTAS DUAS, E A REGRA NÃO VÊ POR QUÊ         │
      │                                                                    │
      │ O efeito tem de reagir ao que veio do servidor — cliente e modelo —  │
      │ e a NADA MAIS. `carregar` e `aplicarRetomada` são recriadas a cada    │
      │ render; incluí-las faria o efeito rodar sempre, que é o defeito       │
      │ clássico. `rascunhoInicial` é do `useState` inicializador e          │
      │ `consultoriaId` é lido só na primeira volta: os dois são estáveis     │
      │ para o que este efeito faz, que é a carga de abertura.                │
      │                                                                    │
      │ O aviso da regra sugere "inclua ou remova a lista". Incluir quebra o  │
      │ efeito; remover a lista o faria rodar a cada render, que é o mesmo    │
      │ defeito por outro caminho. A lista fica, com esta nota no lugar da    │
      │ supressão silenciosa — quem ler depois precisa saber que a ausência   │
      │ é deliberada, e não um esquecimento.                                  │
      └────────────────────────────────────────────────────────────────────┘
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, modeloId]);

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ A OFERTA DE RETOMADA — O TRABALHO QUE FICOU NO OUTRO PAR              │
    │                                                                      │
    │ ── O CASO QUE ELA COBRE ────────────────────────────────────────────  │
    │                                                                      │
    │ Ela trabalhava na ficha do Empório. Sem finalizar, clica num link      │
    │ para outro cliente, ou troca o cliente no seletor. O `carregar` limpa  │
    │ `edicoes` e `pincel` — de propósito, pelo motivo que está lá dentro —  │
    │ e o trabalho de antes continua guardado na aba.                       │
    │                                                                      │
    │ Sem esta nota, ele seria sobrescrito em silêncio na primeira tecla que  │
    │ ela digitasse no cliente novo. É o "não apagar em silêncio" da decisão │
    │ 4, com o mesmo cuidado da decisão 3.                                   │
    │                                                                      │
    │ ── POR QUE ESTE EFEITO É SEPARADO DO DE CARGA ──────────────────────  │
    │                                                                      │
    │ O de carga pergunta UMA vez, na montagem, e só sobre o par em que a    │
    │ tela abriu. Esta pergunta é CONTÍNUA: cada vez que o par escolhido     │
    │ muda, pode haver um rascunho de outro par para oferecer.               │
    │                                                                      │
    │ ── O QUE ELE NÃO FAZ: APLICAR ──────────────────────────────────────  │
    │                                                                      │
    │ Aplicar por conta própria escreveria em `edicoes` valores endereçados  │
    │ por `"<aba>::<célula>"` de OUTRA planilha: o custo do prato do Empório │
    │ apareceria na ficha de outro cliente, com a cor dela, e nada na tela   │
    │ diria de onde aquele número veio. É a mesma classe de defeito que      │
    │ `valePara` existe para impedir. A diferença é que aqui a escolha passa │
    │ a ser DELA — e é por isso que a nota tem um botão, e não um `if`.      │
    │                                                                      │
    │ ── A GRAVAÇÃO PAUSA ENQUANTO A NOTA ESTÁ DE PÉ ─────────────────────  │
    │                                                                      │
    │ Ver o efeito de gravação: ele sai cedo quando `oferta` não é nulo. Sem │
    │ isso, o estado (vazio) do cliente novo sobrescreveria justamente o     │
    │ rascunho que esta nota está oferecendo — e a oferta passaria a apontar │
    │ para um trabalho que já não existe.                                    │
    └──────────────────────────────────────────────────────────────────────┘
  */
  useEffect(() => {
    /*
      A LEITURA É FEITA AQUI, E NÃO DO `rascunhoInicial` DA MONTAGEM.

      Aquele é a fotografia de quando a tela abriu. Depois de uma troca de
      cliente, o armazenamento já pode ter mudado — e a pergunta desta nota é
      sobre AGORA. Ler de novo é o que a mantém correta, e é barato: uma
      leitura por troca de par.
    */
    const fresco = rascunhoFresco();
    if (fresco !== null && !valePara(fresco, { modeloId, clienteId })) definirOferta(fresco);
    else definirOferta(null);
    /*
      OS DOIS EFEITOS RODAM JUNTOS NA MONTAGEM, e isso é inofensivo: na
      primeira volta a tela está no par do próprio rascunho (foi a seed que o
      semeou), então a resposta é `null` e a nota não pisca. Ela só aparece de
      saída quando a URL trouxe um par DECLARADO e diferente do rascunho — que
      é exatamente quando a nota tem o que dizer: "há trabalho seu no Empório,
      e você pediu para abrir este aqui".
    */
  }, [clienteId, modeloId]);

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ A GRAVAÇÃO DO RASCUNHO — DECISÃO 4, E O QUE ESTE EFEITO NÃO FAZ       │
    │                                                                      │
    │ ┌──────────────────────────────────────────────────────────────────┐ │
    │ │ ELE NÃO GUARDA A GRADE.                                          │ │
    │ │                                                                  │ │
    │ │ Guarda o que ela FEZ sobre a grade: o que digitou, o que pintou,  │ │
    │ │ as abas que criou, a planilha que criou, e onde estava olhando.   │ │
    │ │ A grade em si o modelo remonta na retomada — é a mesma decisão    │ │
    │ │ registrada no topo de `retomada.ts`, e aqui está a consequência:  │ │
    │ │ este efeito não depende de `grade`, e por isso ele não roda       │ │
    │ │ quando a grade é remontada.                                       │ │
    │ └──────────────────────────────────────────────────────────────────┘ │
    │                                                                      │
    │ ┌──────────────────────────────────────────────────────────────────┐ │
    │ │ E ELE NÃO GUARDA UM RASCUNHO VAZIO.                              │ │
    │ │                                                                  │ │
    │ │ Sem esta guarda, abrir a Central uma vez já gravaria um estado    │ │
    │ │ "vazio" — e a próxima abertura ofereceria retomar... nada. Pior:  │ │
    │ │ esse `{}` venceria o rascunho de verdade, porque foi escrito      │ │
    │ │ depois.                                                          │ │
    │ │                                                                  │ │
    │ │ "Vazio" quer dizer: nada digitado, nada pintado, e nenhuma aba    │ │
    │ │ criada. A consultoria e a aba sozinhas não contam — abrir a tela  │ │
    │ │ e escolher um cliente já as define.                              │ │
    │ └──────────────────────────────────────────────────────────────────┘ │
    │                                                                      │
    │ ┌──────────────────────────────────────────────────────────────────┐ │
    │ │ POR QUE A COMPARAÇÃO COM O ÚLTIMO TEXTO                           │ │
    │ │                                                                  │ │
    │ │ O efeito roda a cada mudança de qualquer dependência. Escrever no │ │
    │ │ armazenamento é barato, mas serializar uma planilha inteira a     │ │
    │ │ cada tecla digitada não é. O `useRef` guarda o último texto       │ │
    │ │ escrito, e o que for igual a ele não é escrito de novo.          │ │
    │ │                                                                  │ │
    │ │ O TEXTO É A CHAVE, e não um booleano de "sujo", porque ele já é a │ │
    │ │ resposta exata: dois estados produzem o mesmo texto se, e só se,  │ │
    │ │ forem o mesmo estado. Não há como dessincronizar.                │ │
    │ └──────────────────────────────────────────────────────────────────┘ │
    │                                                                      │
    │ ┌──────────────────────────────────────────────────────────────────┐ │
    │ │ A OFERTA ENTRA NA CONTA DO CLIENTE E DO MODELO                    │ │
    │ │                                                                  │ │
    │ │ Se a nota está perguntando "quer trazer o trabalho do outro       │ │
    │ │ cliente?", o `clienteId` da tela JÁ é o outro. Gravar o estado    │ │
    │ │ atual por cima apagaria justamente o que a nota está oferecendo.  │ │
    │ │ Enquanto a oferta está de pé, este efeito fica quieto — e é a     │ │
    │ │ resposta a ela que volta a ligá-lo.                              │ │
    │ └──────────────────────────────────────────────────────────────────┘ │
    └──────────────────────────────────────────────────────────────────────┘
  */
  useEffect(() => {
    /*
      A GRADE AINDA NÃO MONTou? Então não há o que guardar. Este é também o guarda

      que impede o efeito de gravar o estado "vazio" da primeira pintura, antes
      de `carregar` terminar.
    */
    if (grade === null) return;

    /*
      A OFERTA ESTÁ DE PÉ → quieto, pela razão do bloco acima. Sem esta linha, o
      estado atual (vazio, do cliente novo) sobrescreveria o rascunho que a nota
      acabou de oferecer.
    */
    if (oferta !== null) return;

    const temTrabalho =
      Object.keys(edicoes).length > 0 ||
      Object.keys(pincel).length > 0 ||
      folhasExtras.length > 0 ||
      criada !== null;

    if (!temTrabalho) return;

    const estado = {
      modeloId,
      clienteId,
      consultoriaId,
      aba,
      edicoes,
      pincel,
      folhasExtras,
      criada,
    };

    const texto = paraTexto(estado, new Date());
    if (texto === ultimoGuardado.current) return;
    ultimoGuardado.current = texto;
    armazemDaSessao.guardar(estado);
  }, [grade, modeloId, clienteId, consultoriaId, aba, edicoes, pincel, folhasExtras, criada, oferta]);

  /*
    ┌──────────────────────────────────────────────────────────────────────┐
    │ OS ATALHOS: Ctrl+Z, Ctrl+Y E Ctrl+Shift+Z                             │
    │                                                                      │
    │ O ouvinte fica no `document`, e não no contêiner da grade, porque o    │
    │ foco está DENTRO de um `<input>` de célula enquanto ela digita. Um     │
    │ `onKeyDown` na grade nunca veria a tecla: o input a consome primeiro. │
    │                                                                      │
    │ ┌──────────────────────────────────────────────────────────────────┐ │
    │ │ E QUANDO O FOCO ESTÁ NO INPUT DE UMA CÉLULA ABERTA?              │ │
    │ │                                                                  │ │
    │ │ Aí o Ctrl+Z é do NAVEGADOR: ele anda para trás no texto que está  │ │
    │ │ sendo digitado, que é o que qualquer pessoa espera de um campo    │ │
    │ │ de texto — e é o único momento em que "desfazer" significa outra  │ │
    │ │ coisa que não a planilha. Por isso a edição aberta é DETECTADA e  │ │
    │ │ o atalho é dela: a célula ainda não foi confirmada, então não há  │ │
    │ │ operação nenhuma no histórico para desfazer de qualquer forma.    │ │
    │ │                                                                  │ │
    │ │ A detecção é pelo atributo, e não por um estado novo: quem sabe   │ │
    │ │ que existe uma célula aberta é o próprio DOM, e ler isso dele é   │ │
    │ │ uma resposta só, sempre atual. Um `useState` aqui seria uma       │ │
    │ │ segunda resposta para "tem alguém digitando?", com o risco de     │ │
    │ │ ficar dessincronizado quando a edição fecha por clique fora.      │ │
    │ └──────────────────────────────────────────────────────────────────┘ │
    │                                                                      │
    │ `Ctrl+Y` E `Ctrl+Shift+Z` FAZEM A MESMA COISA — o briefing pede os    │
    │ dois. Quem vem do Word tem Ctrl+Y na mão; quem vem do Excel e do      │
    │ navegador usa Ctrl+Shift+Z. Recusar um deles seria escolher a origem   │
    │ de quem usa o sistema, e não custa nada aceitar as duas.              │
    │                                                                      │
    │ O `Ctrl` sem `Shift` também cobre o `Meta` (⌘ no Mac), porque o       │
    │ navegador não é escolhido por quem usa a Central.                    │
    └──────────────────────────────────────────────────────────────────────┘
  */
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      const tecla = e.key.toLowerCase();
      if (tecla !== "z" && tecla !== "y") return;

      /*
        O CAMPO DE EDIÇÃO ESTÁ ABERTO? Então o desfazer é o de dentro dele.
        `isContentEditable` cobre o caso de o alvo ser o próprio nó editável e
        não o `<input>` — o `closest` não o alcançaria, e sem esta linha um
        Ctrl+Z num campo contenteditable abriria caminho para o da planilha.
      */
      const alvo = e.target;
      if (alvo instanceof HTMLElement) {
        if (alvo.isContentEditable) return;
        /*
          QUALQUER CAMPO DE TEXTO TEM O DESFAZER DELE.

          A checagem era só `[data-celula-aberta]` — o input da célula da
          grade —, e por isso um Ctrl+Z com o foco na busca global era
          capturado por esta função: a planilha desfazia por trás, e o texto
          que ela estava digitando na busca não voltava. Duas telas, uma
          tecla, e a errada respondia.

          Perguntar pelo ELEMENTO e não por um atributo resolve os dois casos
          com uma linha e não exige que todo campo futuro se apresente: se o
          foco está num campo de texto, o desfazer é do campo. O seletor cobre
          `<input>` de todo tipo menos os que não têm texto (`checkbox`,
          `radio`, `range`, `file`) e os botões, que não são lugares onde se
          digita.
        */
        if (alvo.closest("input:not([type='checkbox']):not([type='radio']):not([type='range']):not([type='file']):not([type='button']):not([type='submit']), textarea, select") !== null) {
          return;
        }
      }

      /*
        QUAL DOS DOIS. `Ctrl+Y` e `Ctrl+Shift+Z` refazem; `Ctrl+Z` sozinho
        desfaz. A pergunta é feita uma vez, aqui, para que os dois botões
        abaixo leiam a MESMA decisão — e para que não exista uma combinação
        que caia nos dois caminhos.
      */
      const refazendo = tecla === "y" || e.shiftKey;

      /*
        ┌──────────────────────────────────────────────────────────────────┐
        │ NÃO INTERCEPTA QUANDO NÃO HÁ O QUE FAZER — MAS RESPONDE            │
        │                                                                  │
        │ A guarda continua, e continua sendo o certo: numa planilha         │
        │ recém-aberta o Ctrl+Z não pode roubar o gesto do navegador.        │
        │                                                                  │
        │ O que mudou é o `return` mudo. Ele era o único caminho deste       │
        │ ouvinte que não deixava sinal nenhum — e por isso o atalho          │
        │ parecia quebrado para quem apertava sem ter editado nada. Agora    │
        │ ele diz o que aconteceu, com a mesma frase que o clique no botão   │
        │ desabilitado daria, e por isso os dois caminhos não divergem.       │
        └──────────────────────────────────────────────────────────────────┘
      */
      if (refazendo) {
        if (!temRefazer) {
          anunciar("Não há nada para refazer.", "erro");
          return;
        }
        e.preventDefault();
        refazerEdicao();
        return;
      }

      if (!temDesfazer) {
        anunciar("Não há nada para desfazer nesta planilha.", "erro");
        return;
      }
      e.preventDefault();
      desfazerEdicao();
    }

    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  });

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
    ┌────────────────────────────────────────────────────────────────────────┐
    │ O QUE A SESSÃO MUDOU NOS INSUMOS QUE A PLANILHA MOSTRA                 │
    │                                                                        │
    │ ── POR QUE ESTE MAPA EXISTE ──────────────────────────────────────── │
    │                                                                        │
    │ Os preços que valem AGORA não estão no contexto: o contexto foi lido    │
    │ pelo repositório no instante da montagem, e o repositório é a camada    │
    │ de dados — ele não conhece o store de demonstração, que é onde estão    │
    │ as edições da sessão.                                                   │
    │                                                                        │
    │ Sem esta linha, o aviso compararia o retrato com a MESMA lista de onde  │
    │ ele saiu: seria sempre igual, e o aviso nunca acenderia. Um aviso que   │
    │ nunca acende é indistinguível de um aviso que funciona — até o dia em   │
    │ que importa.                                                            │
    │                                                                        │
    │ ── AS DUAS METADES, NA ORDEM DA ESPECIFICIDADE ───────────────────── │
    │                                                                        │
    │ O preço do CLIENTE vence o da biblioteca, que é a mesma precedência     │
    │ que `listarIngredientesDoCliente` usa no repositório. Invertê-la aqui   │
    │ faria a conferência discordar do gerador: a grade sairia com um preço   │
    │ e a conferência compararia outro, e o aviso apareceria numa planilha    │
    │ que está exatamente como deveria estar.                                │
    │                                                                        │
    │ ── A EXCLUSÃO ENTRA PRIMEIRO, E ELA NÃO É PREÇO ──────────────────── │
    │                                                                        │
    │ `insumoFoiExcluido` e não `insumoForaDaBiblioteca`: arquivado continua  │
    │ no passado e não vira "saiu do cadastro". São os dois predicados que a  │
    │ rodada passada separou de propósito, e esta é a segunda tela que        │
    │ depende da distinção.                                                   │
    │                                                                        │
    │ ── POR QUE `useMemo`, SE O STORE JÁ REPINTA ──────────────────────── │
    │                                                                        │
    │ O `useDemonstracao()` no topo faz este componente repintar a cada       │
    │ escrita no store — e é isso que se quer, é assim que o aviso aparece    │
    │ quando ela muda um preço noutra aba.                                    │
    │                                                                        │
    │ Só que o store é GLOBAL: escreve nele qualquer edição de qualquer       │
    │ coisa — criar uma ficha, renomear um cliente, arquivar um insumo. O     │
    │ memo faz a varredura uma vez por versão do store, e não uma vez por     │
    │ render.                                                                 │
    │                                                                        │
    │ `versaoDoStore` está nas dependências de propósito, embora não seja     │
    │ lida no corpo: é ela que diz QUANDO reler os mapas do store. Sem ela,   │
    │ o memo devolveria a comparação da primeira versão para sempre.          │
    └────────────────────────────────────────────────────────────────────────┘
  */
  const divergencia = useMemo(() => {
    if (procedencia === null) return null;

    /*
      ── SÓ O QUE MUDOU NESTA SESSÃO ENTRA NO MAPA ────────────────────────

      O mapa não é "os preços de hoje": é "o que a sessão mexeu". O preço de
      todo o resto continua sendo o do contexto, e `precosVigentes` atravessa
      quem não está aqui sem copiar nada.

      Um insumo NOVO não entra, e isso é a regra declarada no topo de
      `procedencia.ts`: ele não estava na planilha, então a planilha continua
      correta sobre o que ela contém. Reportá-lo faria o aviso disparar toda
      vez que alguém cadastrasse um insumo — e aviso que aparece sempre é
      aviso que ninguém lê.
    */
    const alteracoes = new Map<string, AlteracaoDaSessao>();

    for (const linha of contextoDaGeracao?.ingredientesDoCliente ?? []) {
      const id = linha.ingrediente.id;
      const nome = linha.ingrediente.nome;

      /*
        ── A ORDEM É A DA ESPECIFICIDADE, E ELA NÃO É ARBITRÁRIA ──────────

        O preço do CLIENTE vence o da BIBLIOTECA — a mesma precedência que
        `listarIngredientesDoCliente` usa no repositório para montar a linha
        que o gerador leu. Invertê-la aqui faria a conferência discordar do
        gerador: a grade sairia com o preço do cliente e o aviso compararia o
        da biblioteca, então ele acusaria uma mudança que não houve na hora
        de gerar, e ficaria calado na hora em que houve.

        ── A EXCLUSÃO VEM PRIMEIRO PORQUE É A MAIS FORTE ──────────────────

        Um insumo excluído não tem preço: o cadastro não existe. Se a
        exclusão fosse testada depois, um preço digitado antes dela continuaria
        no mapa e o aviso diria "mudou de preço" sobre um insumo que saiu do
        cadastro — duas frases diferentes para o mesmo fato, e a mais fraca
        das duas.

        E é `insumoFoiExcluido`, não `insumoForaDaBiblioteca`: ARQUIVADO não
        é exclusão. Arquivar existe para tirar o insumo das listas sem mexer
        no passado, e tratar os dois como um só faria arquivar uma batata
        disparar o aviso de "saiu do cadastro" em toda planilha que a usa.
      */
      if (insumoFoiExcluido(id)) {
        alteracoes.set(id, { tipo: "excluido" });
        continue;
      }

      const doCliente = estadoDePrecoDoCliente(clienteId, id);
      if (doCliente !== null) {
        alteracoes.set(id, { tipo: "preco", nome, precoAtual: doCliente.atual.valor });
        continue;
      }

      const daBiblioteca = estadoDePrecoDaBiblioteca(id);
      if (daBiblioteca !== null) {
        alteracoes.set(id, { tipo: "preco", nome, precoAtual: daBiblioteca.atual.valor });
      }
    }

    return conferirPlanilha(procedencia, contextoDaGeracao ?? {}, alteracoes);
    /*
      O `eslint-disable` ABAIXO NÃO ESCONDE UM DEFEITO — ele protege um acerto.

      A regra `exhaustive-deps` só sabe ver dependências que o corpo do memo LÊ.
      `versaoDoStore` não é lida: ela é a CHAVE DE INVALIDAÇÃO. É o número que
      muda quando o store escreve, e é a única coisa que faz este memo rodar de
      novo depois que ela edita um preço noutra tela.

      Sem o comentário, o aviso apareceria — e um aviso desses é um convite:
      quem passar por aqui depois "limpa a dependência desnecessária", a
      bancada continua verde, e o único sintoma é o aviso parar de acender. Um
      aviso que nunca acende é indistinguível de um aviso que funciona.

      Manter a dependência é o que faz a promessa da tela ser verdadeira: ela
      edita o preço, volta para a Central, e o aviso já está lá — sem precisar
      clicar em nada para descobrir.
    */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [procedencia, contextoDaGeracao, clienteId, versaoDoStore]);

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

  /*
    A MARCAÇÃO TAMBÉM PASSA PELO HISTÓRICO.

    O que entra na pilha é o ESTILO RESULTANTE — o `mesclarEstilo` do que já
    estava com o que ela acabou de pedir —, e não a mudança crua. A diferença
    importa no desfazer: guardar `{ negrito: true }` devolveria "negrito falso"
    a uma célula que era amarela de antes, apagando a cor no caminho. O que o
    desfazer tem de devolver é o estilo que VALIA, inteiro.
  */
  function aplicarMarcacao(mudanca: EstiloGrade) {
    if (alvoDaMarcacao === null) return;
    const chave = alvoDaMarcacao.chave;
    const resultado = mesclarEstilo(pincel[chave], mudanca);
    const operacao = operacaoDeMapa("pincel", "pincel", chave, alvoDaMarcacao.rotulo, pincel, {
      [chave]: resultado,
    });
    if (Object.keys(operacao.antes).length === 0) return;
    operar(operacao);
  }

  /**
   * Limpar devolve o alvo ao estilo do modelo — e é REMOÇÃO, não escrita.
   *
   * A operação guarda o estilo que estava lá para o desfazer poder pintar de
   * novo, e o `null` no `depois` é o que faz `aplicarParcial` APAGAR a chave em
   * vez de escrever um objeto vazio. Sem isso, a barra leria `{}` como se fosse
   * marcação e o botão de negrito apareceria apagado — certo por acidente, com
   * a cor da linha voltando por um caminho que ninguém pediu.
   */
  function limparMarcacao() {
    if (alvoDaMarcacao === null) return;
    const chave = alvoDaMarcacao.chave;
    const atual = pincel[chave];
    if (atual === undefined) return;
    const operacao = operacaoDeRemocao("pincel", "pincel", chave, `limpar ${alvoDaMarcacao.rotulo}`, {
      [chave]: atual,
    });
    if (operacao === null) return;
    operar(operacao);
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
        historico={
          <BotoesDeHistorico
            aoDesfazer={desfazerEdicao}
            aoRefazer={refazerEdicao}
            temDesfazer={temDesfazer}
            temRefazer={temRefazer}
            rotuloDesfazer={rotuloDesfazer}
            rotuloRefazer={rotuloRefazer}
          />
        }
        /*
          O RECADO DA AÇÃO DENTRO DA PRÓPRIA FAIXA DE COMANDO.

          Ele entra como `ReactNode` pelo mesmo motivo de `historico`: quem
          sabe o que aconteceu é o ambiente, que tem a pilha. A faixa só o
          posiciona.

          E ele fica DENTRO da faixa, e não numa camada solta logo abaixo,
          porque é ali que estão os botões que ele descreve — "Desfeito:
          Célula C4" fica embaixo do botão "Desfazer", na mesma caixa. Solto
          na tela, ou flutuando por cima, ele obrigaria o olho a atravessar a
          distância entre o clique e a resposta.
        */
        aviso={
          <FaixaDeAcao aviso={aviso} aoFechar={dispensarAviso} className="w-full" />
        }
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

      {/*
        ┌──────────────────────────────────────────────────────────────────┐
        │ O AVISO DE QUE ESTA PLANILHA ENVELHECEU — DECISÃO 3               │
        │                                                                  │
        │ A posição é deliberada: ACIMA da grade e ABAIXO do erro.         │
        │                                                                  │
        │ Acima da grade porque a planilha não pode ser escondida nem       │
        │ substituída — ela continua inteira logo abaixo, com os valores    │
        │ que ela sempre teve, e quem quiser conferir um número antes de    │
        │ decidir o que fazer confere.                                      │
        │                                                                  │
        │ Abaixo do erro porque são coisas diferentes, e a ordem diz qual   │
        │ é qual: "não deu para montar" é a planilha que não existe, e      │
        │ vem primeiro; "os dados de origem mudaram" é a planilha que       │
        │ existe e está velha, e vem depois. Inverter faria o aviso         │
        │ secundário aparecer antes do principal.                          │
        │                                                                  │
        │ O componente devolve `null` quando não há divergência, então      │
        │ esta linha não custa altura nenhuma na esmagadora maioria das     │
        │ telas — ela só ocupa espaço no dia em que tem o que dizer.        │
        └──────────────────────────────────────────────────────────────────┘
      */}
      {divergencia ? <AvisoDeProcedencia divergencia={divergencia} geradoEm={montadaEm} /> : null}

      {/*
        ┌──────────────────────────────────────────────────────────────────┐
        │ AS DUAS NOTAS DA RETOMADA — DECISÃO 4                            │
        │                                                                  │
        │ Elas vêm DEPOIS do aviso de procedência porque ele é sobre o      │
        │ conteúdo (os preços do cadastro mudaram) e ela é sobre a sessão   │
        │ (o seu trabalho voltou). Quando as duas aparecem juntas, a ordem  │
        │ conta a história na sequência em que ela vai agir: primeiro       │
        │ entende o que a planilha tem, depois o que aconteceu com a tela.  │
        │                                                                  │
        │ ── ELAS NUNCA APARECEM JUNTAS ────────────────────────────────── │
        │                                                                  │
        │ `nota` exige que o rascunho seja DESTE par; `oferta` exige que    │
        │ ele seja de OUTRO. São condições que se excluem, e é por isso que │
        │ a segunda é representada por um estado separado (`oferta`) e não  │
        │ por um `else` no render: quem decide é o efeito, que roda na      │
        │ troca de par — o render só desenha o que ele concluiu.            │
        │                                                                  │
        │ ── A OFERTA ACIMA DA NOTA ────────────────────────────────────── │
        │                                                                  │
        │ Entre as duas, a oferta é a que pede uma decisão: ela pergunta se │
        │ o trabalho continua guardado ou se a tela vai atrás dele. A nota  │
        │ só informa, e informar pode esperar.                              │
        └──────────────────────────────────────────────────────────────────┘
      */}
      {oferta ? (
        <OfertaDeRetomada
          retomada={oferta}
          agora={agora}
          cliente={nomeDoCliente(oferta.clienteId)}
          modelo={modelos.find((m) => m.id === oferta.modeloId)?.nome ?? null}
          aoAbrir={abrirPlanilhaDaOferta}
          aoSeguir={() => definirOferta(null)}
        />
      ) : null}

      {retomada ? (
        <NotaDaRetomada
          retomada={retomada}
          agora={agora}
          cliente={nomeDoCliente(retomada.clienteId)}
          modelo={modelos.find((m) => m.id === retomada.modeloId)?.nome ?? null}
          /*
            "CIENTE" FECHA A NOTA E MAIS NADA.

            Ele não apaga o rascunho nem limpa a grade: o trabalho continua
            guardado — é ele que ainda protege um F5 acidental, e apagá-lo aqui
            faria o "Ciente" custar o trabalho dela. A nota é recusada por
            estado, e a próxima abertura desta aba não a mostra de novo porque
            o rascunho é reaplicado sem nota: `definirRetomada(null)` só dura
            enquanto esta montagem durar.
          */
          aoDescartar={() => definirRetomada(null)}
        />
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

          <GradeEmBrancoDaSessao edicoes={edicoes} aoEditar={editarCelula} />
        </div>
      ) : grade ? (
        <>
          <PreviaDaPlanilha
            grade={gradeMarcada ?? grade}
            nomeCliente={cliente?.nomeFantasia ?? "sem cliente vinculado"}
            altura={620}
            edicoes={edicoes}
            aoEditar={editarCelula}
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
  historico,
  aviso,
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
  /**
   * Os botões de desfazer/refazer.
   *
   * Eles chegam como `ReactNode` — e não como quatro props — porque a pilha
   * mora no AMBIENTE, num `useRef` que a faixa não tem como ler. Passar o
   * componente pronto é o que mantém a faixa burra: ela posiciona, quem sabe
   * desfazer é quem tem o histórico.
   */
  historico: React.ReactNode;
  /**
   * O recado da última ação — "Desfeito: Célula C4".
   *
   * Chega pronto porque quem tem a pilha é o AMBIENTE: a faixa não sabe o
   * que foi desfeito, e pedir isso a ela obrigaria a faixa a conhecer o
   * histórico, que é justamente o que ela não faz. Ver `aviso-acao.tsx`.
   */
  aviso: React.ReactNode;
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
        {/*
          ┌──────────────────────────────────────────────────────────────────┐
          │ AS AÇÕES EM TRÊS FAMÍLIAS — O QUE ESTA FAIXA NÃO TINHA            │
          │                                                                  │
          │ Com a entrada do "Importar", a faixa passou a ter cinco botões    │
          │ da MESMA aparência, lado a lado, sem nada dizendo que eles não    │
          │ são a mesma coisa. Para o olho, uma fileira de botões iguais é    │
          │ uma lista de iguais — e ela tinha de ler cada um para descobrir   │
          │ que dois agem sobre o que já está na grade, dois criam conteúdo   │
          │ novo e dois fecham o trabalho.                                    │
          │                                                                  │
          │ O que resolve é AGRUPAR, e não repintar: o mesmo traço vertical   │
          │ que a barra de formatação já usa para separar negrito de         │
          │ alinhamento e de cor. Nenhum botão mudou de forma, de tamanho ou  │
          │ de cor — o que mudou é que agora dá para ver ONDE CADA UM COMEÇA. │
          │                                                                  │
          │ E a ordem dentro de cada família é a ordem do trabalho:           │
          │                                                                  │
          │   ↶ ↷            agem sobre o que já está na grade                │
          │   criar · importar   trazem conteúdo para dentro                  │
          │   salvar · enviar    tiram o trabalho daqui                       │
          │                                                                  │
          │ `role="group"` com `aria-label` porque o traço é invisível para   │
          │ quem navega por teclado e por áudio: sem ele, quem não vê a tela  │
          │ atravessaria as três famílias sem notar que existem.              │
          └──────────────────────────────────────────────────────────────────┘
        */}
        {/*
          DESFAZER E REFAZER VÊM PRIMEIRO, e a ordem é de PROXIMIDADE: eles
          agem sobre o que está na grade agora, enquanto "criar" abre uma
          grade nova. Quem procura o desfazer está no meio do trabalho e o
          olho já está sobre a planilha — encontrá-lo antes do botão que
          abre outra coisa é o que evita o clique errado na hora do aperto.

          Ele NÃO ganha um `role="group"` aqui: `BotoesDeHistorico` já é um
          grupo rotulado ("Desfazer e refazer na planilha"). Aninhar um
          segundo grupo com o mesmo nome faria o leitor de tela anunciar a
          mesma fronteira duas vezes.
        */}
        {historico}

        <Traco />

        <span role="group" aria-label="Trazer conteúdo para a planilha" className="flex items-center gap-2">
          <Botao
            variante="secundario"
            tamanho="sm"
            onClick={criar}
            title="Abrir uma grade nova no editor"
          >
            + Criar planilha
          </Botao>

          {/*
            IMPORTAR — UM BOTÃO, QUATRO PORTAS.

            Era um link escrito "Importar PDF", quando havia uma porta só. Agora
            ele abre a escolha entre PDF, Excel, Texto e Foto, e cada porta é um
            link de verdade — ver `importar-comando.tsx`, onde está escrito por
            que o menu mostra as quatro mesmo nas que ainda não leem.
          */}
          <ComandoDeImportacao clienteId={clienteId} />
        </span>

        <Traco />

        <span role="group" aria-label="Guardar e enviar" className="flex items-center gap-2">
          {salvar}

          <Botao
            variante="secundario"
            tamanho="sm"
            onClick={enviar}
            title="Preparar o envio desta planilha para o cliente"
          >
            Enviar para cliente
          </Botao>
        </span>

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

      {/*
        O RECADO OCUPA A LINHA INTEIRA, ABAIXO DOS BOTÕES.

        Dentro da mesma caixa da faixa de comando, e numa linha própria: a
        caixa já quebra sozinha em tela estreita, e o `w-full` faz o recado
        descer em vez de espremer os botões. Ele aparece exatamente embaixo
        do grupo de ações que acabou de ser clicado — e desaparece sem deixar
        buraco, porque `FaixaDeAcao` devolve `null` quando não há recado.
      */}
      {aviso}
    </div>
  );
}

/**
 * O TRACO QUE SEPARA AS FAMÍLIAS DE AÇÃO.
 *
 * Ele é `aria-hidden` porque não diz nada a quem lê por áudio — a separação
 * que importa já está no `role="group"` com nome, dos dois lados. Sem o
 * `aria-hidden`, um leitor de tela anunciaria um elemento vazio no meio dos
 * botões.
 *
 * A medida e a cor são as MESMAS que a barra de formatação usa para separar
 * negrito de alinhamento e de cor (`mx-0.5 h-5 w-px bg-[var(--linha-forte)]`).
 * Repetir a medida aqui em vez de extrair um componente comum é deliberado:
 * são duas barras independentes, e um traço compartilhado as amarraria — o
 * dia em que uma precisasse de mais espaço, a outra mudaria junto e sem
 * motivo. São quatro classes; o risco de divergirem é menor que o custo da
 * amarração.
 */
function Traco() {
  return <span aria-hidden className="mx-0.5 h-5 w-px shrink-0 bg-[var(--linha-forte)]" />;
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
