"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta, useGaveta } from "@/components/ui/gaveta";
import { ComercialDaFicha } from "./comercial-da-ficha";
import type { ControleComercial } from "./comercial-da-ficha";
import { IdentidadeDaFicha } from "./identidade-da-ficha";
import { Dado, ListaDados } from "@/components/ui/dados";
import { Etiqueta } from "@/components/ui/indicador";
import { LegendaDeCusto, PainelCustoERendimento } from "@/components/ui/painel-custo";
import {
  FluxoRendimentoIngrediente,
  ResumoTransformacao,
} from "@/components/ui/fluxo-rendimento";
import { DecisoesQueFaltam, RegraAConfirmar } from "@/components/ui/metodologia";
import { Aviso, Painel, Secao } from "@/components/ui/superficie";
import { LinhaDoTempo } from "@/components/ui/linha-do-tempo";
import {
  CabecalhoTabela,
  Celula,
  CelulaCabecalho,
  CorpoTabela,
  LinhaCabecalho,
  LinhaTabela,
  Tabela,
} from "@/components/ui/tabela";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import {
  ACAO_DO_ESTADO_ITEM,
  CASAS_PESO,
  ROTULO_ESTADO_ITEM,
  ROTULO_ETAPA_PESO,
  ROTULO_SITUACAO_FICHA,
  TOM_SITUACAO_FICHA,
  dataCurta,
  desdeQuando,
  markupEmTexto,
  numeroFixo,
  quadroComercial,
  resolverItem,
  resumoDaFicha,
  pesarFicha,
  valorEmReais,
} from "@/lib/dados";
import type {
  ClienteOperacao as Cliente,
  EtapaPeso,
  Ficha,
  Ingrediente,
  IngredienteDoCliente,
  ItemFicha,
  ItemResolvido,
  ParametrosComerciais,
  PesoDaFicha,
  QuadroComercial,
  ResumoCustoFicha,
  SituacaoCalculo,
} from "@/lib/dados";
import { PARAMETROS_VAZIOS } from "@/lib/dados";
import {
  estadoDePrecoDaBiblioteca,
  fichaDaSessao,
  fichasDaSessao,
  ingredientesDaSessao,
  precosDeClienteDaSessao,
  salvarCabecalhoDaFicha,
  salvarItensDaFicha,
} from "@/lib/dados/demonstracao";
import type { CabecalhoDeFicha } from "@/lib/dados/demonstracao";
import { NovoIngrediente } from "../../ingredientes/novo";

/**
 * A FICHA TÉCNICA — o centro de trabalho, e não um documento morto.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA TELA É, EM UMA FRASE                                      │
 * │                                                                      │
 * │ É o lugar onde o prato é montado: escolher o insumo (que já existe e   │
 * │ já tem preço), dizer quanto leva, e ver o custo aparecer enquanto se   │
 * │ digita. É o que a planilha faz hoje, com a diferença de que o preço     │
 * │ não é redigitado — ele é o mesmo da biblioteca.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA TELA É DE CLIENTE                                       │
 * │                                                                      │
 * │ Pelo mesmo motivo do detalhe do insumo, e por um a mais.              │
 * │                                                                      │
 * │ O primeiro: a página era de servidor, então ler o repositório dava o   │
 * │ cenário — e o cenário não sabe que alguém adicionou uma linha. Ao      │
 * │ salvar, a lista voltaria sem a linha nova, e o sistema pareceria ter   │
 * │ perdido o trabalho.                                                    │
 * │                                                                      │
 * │ O segundo, que só existe aqui: ESTA TELA PRECISA RECALCULAR A CADA     │
 * │ TECLA. O custo por porção depende de quantas porções, e a consultora   │
 * │ ajusta o rendimento para ver o efeito no custo. Uma tela que só        │
 * │ recalculasse ao salvar obrigaria a fechar a gaveta para ver o número.  │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA QUE GOVERNA O CÁLCULO AQUI                                   │
 * │                                                                      │
 * │ NADA É ESTIMADO. Cada linha entra na soma quando tem os DOIS números    │
 * │ que a conta precisa — a quantidade declarada e o custo unitário da     │
 * │ ETAPA em que ela foi pesada — e quando as unidades são da mesma        │
 * │ grandeza. Onde falta um, a linha fica de fora e o painel diz por quê,  │
 * │ nomeando o motivo.                                                    │
 * │                                                                      │
 * │ O total, quando há linha de fora, é um PISO: aparece marcado como       │
 * │ parcial, e o custo por porção some — dividir um piso por doze daria    │
 * │ um número menor que o real com cara de custo por porção.               │
 * │                                                                      │
 * │ O QUE NÃO É CALCULADO, e aparece marcado como regra a confirmar:      │
 * │ preço de venda, CMV alvo, markup e margem. São decisões profissionais  │
 * │ dela, e o sistema não escolhe por ela.                                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ETAPA DO PESO É O CAMPO QUE FAZ A CONTA EXISTIR                    │
 * │                                                                      │
 * │ "1,200 kg de mandioca" não é uma quantidade — é uma quantidade EM      │
 * │ ALGUM MOMENTO. O quilo como se compra, o quilo depois de descascar ou  │
 * │ o quilo depois de cozinhar? As três respostas dão custos diferentes    │
 * │ para a mesma linha, e a diferença entre a primeira e a terceira é o    │
 * │ rendimento inteiro.                                                    │
 * │                                                                      │
 * │ Por isso cada linha declara a etapa, e a conta usa o custo unitário    │
 * │ DAQUELA etapa. Sem isso, o sistema teria que escolher uma — e          │
 * │ escolher seria inventar metodologia.                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** Quem assina o que for mexido nesta sessão. Não é um nome inventado. */
const QUEM = "sessão de trabalho";

const ROTULO_ORIGEM_PRECO: Record<ItemResolvido["origemDoPreco"], string> = {
  CLIENTE: "preço deste cliente",
  BIBLIOTECA: "preço da biblioteca",
  FICHA: "preço guardado na ficha",
  AUSENTE: "sem preço",
};

const ETAPA_CURTA: Record<EtapaPeso, string> = {
  COMPRA: "Compra",
  LIMPO: "Limpo",
  PREPARADO: "Preparado",
};

const OPCOES_ETAPA = (["COMPRA", "LIMPO", "PREPARADO"] as const).map((e) => ({
  valor: e as string,
  texto: `${ETAPA_CURTA[e]} — ${ROTULO_ETAPA_PESO[e]}`,
}));

/** Um peso com casas fixas. Ausente vira traço — nunca zero. */
function pesoTexto(valor: number | null, unidade: string | null): string {
  if (valor === null) return "—";
  const n = valor.toFixed(CASAS_PESO).replace(".", ",");
  return unidade ? `${n} ${unidade}` : n;
}

function percentualTexto(valor: number | null): string {
  if (valor === null) return "—";
  return `${valor.toFixed(1).replace(".", ",")}%`;
}

function dinheiro(valor: number | null): string {
  return valor === null ? "—" : valorEmReais(valor);
}

/** O que a tela recebeu do servidor. Nada aqui é recalculado. */
export type CenarioDaFicha = {
  ficha: Ficha | null;
  cliente: Cliente | null;
  clientes: readonly Cliente[];
  ingredientes: readonly Ingrediente[];
  precosDoCliente: readonly IngredienteDoCliente[];
  /** As outras fichas do mesmo cliente — navegação lateral. */
  outras: readonly Ficha[];
};

export function DetalheDaFicha({
  id,
  doCenario,
}: {
  id: string;
  doCenario: CenarioDaFicha;
}) {
  // Assina o estado demonstrativo: qualquer edição repinta a ficha inteira.
  useDemonstracao();

  const adicionar = useGaveta();

  /*
    A PONTE PARA A GAVETA COMERCIAL.

    A gaveta mora no cabeçalho, junto das outras ações; a seção que FALA sobre
    preço fica lá embaixo, depois do custo. Sem esta referência, quem chega na
    seção lendo "o preço de venda ainda não foi declarado" teria de subir a
    tela e achar o botão certo entre quatro.
  */
  const comercialRef = useRef<ControleComercial>(null);

  /*
    ── QUEM É ESTA FICHA ───────────────────────────────────────────────────

    A ordem é: primeiro a ficha criada nesta sessão, depois o cenário. Uma
    ficha criada agora não existe no repositório, e mandá-la para "não
    encontrada" seria matar o trabalho no instante seguinte a ele existir.
  */
  const criadaAgora = fichasDaSessao().find((f) => f.id === id) ?? null;
  const base = criadaAgora ?? doCenario.ficha;

  if (base === null) return <NaoEncontrada />;

  const ficha = fichaDaSessao(base);
  const cliente =
    doCenario.clientes.find((c) => c.id === ficha.clienteId) ?? doCenario.cliente;

  /*
    ── OS INSUMOS, COM O PREÇO DE HOJE ─────────────────────────────────────

    A biblioteca inteira, com o preço que foi atualizado nesta sessão por
    cima, mais os insumos cadastrados agora. É a mesma sobreposição que a
    lista de ingredientes faz — e ela precisa ser a MESMA, senão a ficha
    calcularia com um preço que a biblioteca não mostra.
  */
  const idsDaSessao = new Set(ingredientesDaSessao().map((i) => i.id));

  const visiveis: Ingrediente[] = [
    ...ingredientesDaSessao(),
    ...doCenario.ingredientes
      .filter((i) => !idsDaSessao.has(i.id))
      .map((i) => {
        const estado = estadoDePrecoDaBiblioteca(i.id);
        if (estado === null) return i;
        return {
          ...i,
          precoAtual: estado.atual.valor,
          atualizadoEm: estado.atual.em,
          fornecedor: estado.atual.fornecedor || i.fornecedor,
          historico: estado.historico,
        };
      }),
  ];

  const indice = new Map(visiveis.map((i) => [i.id, i]));

  /*
    ── OS PREÇOS DESTE CLIENTE ─────────────────────────────────────────────

    O cenário traz o que o repositório sabe; o store traz o que foi digitado
    agora. O segundo sobrepõe o primeiro. Os dois ficam separados dos preços
    da biblioteca — é a regra do §6: o preço de um cliente nunca contamina o
    insumo dos outros.
  */
  const precos = new Map<string, IngredienteDoCliente>(
    doCenario.precosDoCliente.map((p) => [p.ingredienteId, p])
  );

  if (ficha.clienteId) {
    for (const [ingredienteId, registro] of precosDeClienteDaSessao(
      ficha.clienteId,
      (ingId) => indice.get(ingId)?.unidade ?? null
    )) {
      precos.set(ingredienteId, registro);
    }
  }

  /*
    ── A RESOLUÇÃO DAS LINHAS ──────────────────────────────────────────────

    `resolverItem` faz o que nenhuma tela deveria fazer por conta própria:
    decide de qual fonte vem o preço (cliente, biblioteca ou o guardado na
    ficha), verifica se a unidade combina, aplica os pesos medidos do insumo
    e devolve o custo da linha com o motivo quando ele não existe.
  */
  const resolvidos = ficha.itens.map((item) =>
    resolverItem(item, indice.get(item.ingredienteId) ?? null, precos.get(item.ingredienteId) ?? null)
  );

  const resumo = resumoDaFicha(resolvidos, ficha);
  const peso = pesarFicha(resolvidos);
  const unidadeDoPeso = peso.unidade ?? ficha.itens[0]?.unidade ?? null;

  /*
    ── A SITUAÇÃO DO CÁLCULO, DERIVADA ─────────────────────────────────────

    O campo guardado no cenário diz "aguardando metodologia" — e isso deixou
    de ser verdade: a soma existe. Manter o rótulo antigo seria a tela dizer
    uma coisa e mostrar outra.

    O que substitui não é um campo novo, é a leitura do que o cálculo
    conseguiu fazer: fechado, com linha de fora, ou sem nada a somar.
  */
  const situacaoCalculo: SituacaoCalculo = resumo.vazio
    ? "AGUARDANDO_DADOS"
    : resumo.completo
      ? "DISPONIVEL"
      : "AGUARDANDO_DADOS";

  const categorias = [...new Set(visiveis.map((i) => i.categoria))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

  const historico = [...ficha.historico].sort((a, b) => b.em.getTime() - a.em.getTime());
  const responsavel = historico[0]?.quem ?? "";

  /*
    ── O QUADRO COMERCIAL ──────────────────────────────────────────────────

    Os dois campos que alimentam este quadro vêm do cabeçalho da ficha, que é
    onde eles moram desde sempre — `precoVenda` e `parametros` foram
    declarados junto com o store de sessão. O que faltava era a tela.

    O custo que entra é `resumo.custoTotal`, e ele é `null` enquanto houver
    linha fora da soma. Isso não é um detalhe de implementação: um CMV
    calculado sobre um piso seria MENOR que o real, e um número otimista é pior
    do que um número ausente — ninguém confere um número bom.
  */
  const parametros: ParametrosComerciais = ficha.parametros ?? PARAMETROS_VAZIOS;
  const precoDeVenda = ficha.precoVenda ?? null;
  const comercial = quadroComercial(
    resumo.completo ? resumo.custoTotal : null,
    precoDeVenda,
    parametros
  );

  // -------------------------------------------------------------------------
  // Escrita
  // -------------------------------------------------------------------------

  /**
   * Marca a ficha como mexida agora, com uma linha de histórico.
   *
   * O histórico não é enfeite: é a prova de que o botão funcionou. Sem ele, a
   * consultora salva uma alteração e não tem como saber se ela entrou — numa
   * tela sem banco, essa dúvida é a diferença entre confiar e desconfiar.
   */
  function registrar(oQue: string) {
    const agora = new Date();
    salvarCabecalhoDaFicha(ficha.id, {
      atualizadaEm: agora,
      historico: [{ em: agora, oQue, quem: QUEM }, ...ficha.historico],
    });
  }

  function gravarItens(itens: ItemFicha[], oQue: string) {
    salvarItensDaFicha(ficha.id, itens);
    registrar(oQue);
  }

  function adicionarItem(entrada: {
    ingrediente: Ingrediente;
    quantidade: string;
    etapa: EtapaPeso;
    observacao: string;
  }) {
    const doCliente = precos.get(entrada.ingrediente.id);
    const item: ItemFicha = {
      ingredienteId: entrada.ingrediente.id,
      quantidade: entrada.quantidade,
      // A unidade vem do INSUMO. Deixá-la ser escolha livre permitiria dizer
      // "0,5 kg" de um insumo comprado em litro — e a conta sairia normal.
      unidade: entrada.ingrediente.unidade,
      /*
        O preço guardado na linha é o que valia NO MOMENTO do uso: o do
        cliente quando existe, o da biblioteca quando não. Guardar é o que
        permite, meses depois, saber com que preço aquela ficha foi escrita.
      */
      precoReferencia: doCliente?.precoAtual ?? entrada.ingrediente.precoAtual,
      etapa: entrada.etapa,
      observacao: entrada.observacao,
    };

    gravarItens(
      [...ficha.itens, item],
      `Ingrediente "${entrada.ingrediente.nome}" adicionado à composição.`
    );
  }

  function alterarItem(indiceDaLinha: number, mudanca: Partial<ItemFicha>) {
    const atuais = ficha.itens;
    const alvo = atuais[indiceDaLinha];
    if (!alvo) return;

    const novos = atuais.map((item, i) => (i === indiceDaLinha ? { ...item, ...mudanca } : item));
    const nome = indice.get(alvo.ingredienteId)?.nome ?? "insumo";

    gravarItens(novos, `Linha "${nome}" alterada.`);
  }

  function removerItem(indiceDaLinha: number) {
    const atuais = ficha.itens;
    const alvo = atuais[indiceDaLinha];
    if (!alvo) return;

    const nome = indice.get(alvo.ingredienteId)?.nome ?? "insumo";
    gravarItens(
      atuais.filter((_, i) => i !== indiceDaLinha),
      `Ingrediente "${nome}" removido da composição.`
    );
  }

  function salvarRendimento(dados: { porcoes: number | null; porcaoGramas: number | null }) {
    salvarCabecalhoDaFicha(ficha.id, {
      rendimentoPorcoes: dados.porcoes,
      porcaoGramas: dados.porcaoGramas,
    });
    registrar(
      dados.porcoes === null
        ? "Rendimento em porções deixado em branco."
        : `Rendimento ajustado para ${dados.porcoes} porções.`
    );
  }

  /**
   * Grava o cabeçalho, com a frase do que mudou vindo de quem sabe.
   *
   * `IdentidadeDaFicha` compara o rascunho com o que estava gravado e escreve
   * a frase: "Ficha alterada: nome, modo de preparo (6 passos)". É lá que a
   * comparação pode ser feita campo a campo, porque é lá que os campos estão.
   */
  function salvarCabecalho(alteracao: CabecalhoDeFicha, oQue: string) {
    /*
      ── A FRASE E A GRAVAÇÃO SAEM DO MESMO OBJETO ─────────────────────────
      `registrar` monta a linha de histórico a partir de `ficha.historico`, que
      é o estado ANTES desta gravação. Chamar `salvarCabecalhoDaFicha` primeiro
      e `registrar` depois está certo: o store mescla, então a linha nova
      encontra as antigas. Invertendo, a frase descreveria uma alteração que
      ainda não estava lá.
    */
    salvarCabecalhoDaFicha(ficha.id, alteracao);
    registrar(oQue);
  }

  /**
   * O PREÇO DE VENDA E OS PARÂMETROS — UMA GRAVAÇÃO, UMA LINHA DE HISTÓRICO.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ POR QUE OS DOIS SÃO GRAVADOS JUNTOS, E NÃO EM DUAS CHAMADAS        │
   * │                                                                    │
   * │ A gaveta mostra os quatro campos ao mesmo tempo e grava os dois     │
   * │ grupos com um clique. Duas chamadas a `registrar` custariam duas    │
   * │ linhas de histórico — e a segunda apagaria a primeira, porque       │
   * │ `registrar` monta a lista a partir de `ficha.historico`, que veio   │
   * │ da renderização e ainda não conhece a linha que a primeira          │
   * │ acabou de escrever.                                                │
   * │                                                                    │
   * │ O resultado seria o defeito mais difícil de notar: ela digita o     │
   * │ preço, informa o CMV alvo, salva, e o histórico registra só uma das │
   * │ duas coisas. A outra sumiu sem erro nenhum na tela.                 │
   * │                                                                    │
   * │ Com uma gravação só, não há duas listas para reconciliar.           │
   * └────────────────────────────────────────────────────────────────────┘
   *
   * A frase nomeia cada campo e o valor que passou a valer. "Parâmetros
   * alterados" não serviria: daqui a três meses ela abriria a ficha, veria a
   * linha e não saberia se o que mudou foi a margem, o CMV ou o markup — e um
   * histórico que não diz o que mudou não é histórico.
   *
   * Campo deixado em branco aparece como "limpo": apagar uma decisão é uma
   * alteração, e a mais fácil de fazer sem perceber.
   */
  function salvarComercial(valor: number | null, novos: ParametrosComerciais) {
    const partes: string[] = [];

    const descrever = (
      rotulo: string,
      antes: number | null | undefined,
      depois: number | null | undefined
    ) => {
      if ((antes ?? null) === (depois ?? null)) return;
      partes.push(
        depois === null || depois === undefined
          ? `${rotulo} limpo`
          : `${rotulo} ${String(depois).replace(".", ",")}`
      );
    };

    descrever("preço de venda", precoDeVenda, valor);
    descrever("margem de segurança", parametros.margemSegurancaPct, novos.margemSegurancaPct);
    descrever("CMV alvo", parametros.cmvAlvoPct, novos.cmvAlvoPct);
    descrever("markup alvo", parametros.markupAlvo, novos.markupAlvo);

    salvarCabecalhoDaFicha(ficha.id, { precoVenda: valor, parametros: novos });
    registrar(
      partes.length === 0
        ? "Preço e parâmetros comerciais reabertos e salvos sem alteração."
        : `Preço e parâmetros comerciais: ${partes.join(", ")}.`
    );
  }

  // -------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <Link
        href="/fichas"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para as fichas
      </Link>

      {/* ═══ CABEÇALHO ═════════════════════════════════════════════════════ */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
            {ficha.categoria}
          </p>
          <h1 className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-[1.75rem] leading-tight">
            {ficha.nome}
            {criadaAgora !== null ? (
              <Etiqueta tom="dourado">criada nesta sessão</Etiqueta>
            ) : null}
          </h1>
          <p className="mt-2 max-w-[70ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
            {cliente ? (
              <>
                Ficha de{" "}
                <Link href={`/clientes/${cliente.id}`} className="text-oliva hover:underline">
                  {cliente.nomeFantasia}
                </Link>
                {" · "}
              </>
            ) : null}
            {ficha.itens.length} {ficha.itens.length === 1 ? "ingrediente" : "ingredientes"} ·
            atualizada {desdeQuando(ficha.atualizadaEm)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Etiqueta tom={TOM_SITUACAO_FICHA[ficha.situacao]}>
            {ROTULO_SITUACAO_FICHA[ficha.situacao]}
          </Etiqueta>
          {/*
            A ORDEM DAS AÇÕES É A ORDEM DAS PERGUNTAS.

            "Editar ficha" mexe no que a ficha É — nome, cliente, passos.
            "Editar rendimento" e "Parâmetros comerciais" mexem no que ela
            PRODUZ. E "Ver cliente" não mexe em nada, então vai por último.
          */}
          <IdentidadeDaFicha ficha={ficha} clientes={doCenario.clientes} aoSalvar={salvarCabecalho} />
          <EditarRendimento
            porcoes={ficha.rendimentoPorcoes}
            porcaoGramas={ficha.porcaoGramas}
            totalAtual={resumo.completo ? resumo.custoTotal : null}
            aoSalvar={salvarRendimento}
          />
          <ComercialDaFicha
            ref={comercialRef}
            parametros={parametros}
            precoVenda={precoDeVenda}
            custoMedido={resumo.completo ? resumo.custoTotal : null}
            aoSalvar={salvarComercial}
          />
          {cliente ? (
            <BotaoLink href={`/clientes/${cliente.id}`} variante="secundario" tamanho="sm">
              Ver cliente
            </BotaoLink>
          ) : null}
        </div>
      </div>

      {/* ═══ IDENTIFICAÇÃO ═════════════════════════════════════════════════ */}
      <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
        <ListaDados colunas={3}>
          <Dado rotulo="Prato">{ficha.nome}</Dado>
          <Dado rotulo="Categoria">{ficha.categoria}</Dado>
          <Dado rotulo="Cliente">
            {cliente ? (
              <Link href={`/clientes/${cliente.id}`} className="text-oliva hover:underline">
                {cliente.nomeFantasia}
              </Link>
            ) : (
              <span className="text-[var(--tinta-fraca)]">não identificado</span>
            )}
          </Dado>
          <Dado rotulo="Rendimento">
            {ficha.rendimentoPorcoes === null ? (
              <span className="text-[var(--tinta-fraca)]">não declarado</span>
            ) : (
              <>
                <span className="tabular">{ficha.rendimentoPorcoes}</span> porções
                <UnidadeDoRendimento />
              </>
            )}
          </Dado>
          <Dado rotulo="Peso da porção">
            {ficha.porcaoGramas === null ? (
              <span className="text-[var(--tinta-fraca)]">não declarado</span>
            ) : (
              <>
                <span className="tabular">{ficha.porcaoGramas}</span> g
              </>
            )}
          </Dado>
          <Dado rotulo="Responsável">
            {responsavel || <span className="text-[var(--tinta-fraca)]">não registrado</span>}
            {responsavel ? (
              <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                quem assinou a última alteração
              </span>
            ) : null}
          </Dado>
          <Dado rotulo="Última atualização">
            {dataCurta(ficha.atualizadaEm)}
            <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
              {desdeQuando(ficha.atualizadaEm)}
            </span>
          </Dado>
          <Dado rotulo="Situação do cálculo">
            <Etiqueta tom={situacaoCalculo === "DISPONIVEL" ? "verde" : "dourado"}>
              {situacaoCalculo === "DISPONIVEL"
                ? "todas as linhas somadas"
                : resumo.vazio
                  ? "sem linhas a somar"
                  : `${resumo.itensFora} de ${ficha.itens.length} linhas fora`}
            </Etiqueta>
          </Dado>
          <Dado rotulo="Peso inicial declarado">
            {peso.etapa !== null ? (
              <>
                <span className="tabular">{pesoTexto(peso.total, unidadeDoPeso)}</span>
                <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                  soma dos pesos em {ROTULO_ETAPA_PESO[peso.etapa]}
                </span>
              </>
            ) : (
              <span className="text-[var(--tinta-fraca)]">
                {peso.etapasEncontradas.length > 1
                  ? "linhas pesadas em etapas diferentes"
                  : "nenhuma linha com peso"}
              </span>
            )}
          </Dado>
          {/*
            O PREÇO DE VENDA TAMBÉM APARECE AQUI, E NÃO SÓ LÁ EMBAIXO.

            A seção "Preço e margem" cruza custo e preço e é onde o assunto se
            aprofunda. Mas a identificação é o bloco que ela lê correndo, e um
            preço que só existe depois de rolar a tela some da leitura rápida.

            Duas aparições do MESMO campo lido do MESMO lugar não são duas
            verdades: é o mesmo número em dois pontos da página.
          */}
          <Dado rotulo="Preço de venda">
            {precoDeVenda === null ? (
              <span className="text-[var(--tinta-fraca)]">não declarado</span>
            ) : (
              <>
                <span className="tabular">{valorEmReais(precoDeVenda)}</span>
                <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                  {comercial.venda !== null
                    ? `CMV de ${percentualTexto(comercial.venda.cmvPct)}`
                    : "preço declarado"}
                </span>
              </>
            )}
          </Dado>
        </ListaDados>
      </div>

      {/* ═══ CUSTO E RENDIMENTO ════════════════════════════════════════════ */}
      <Secao
        rotulo="Custo e rendimento"
        titulo={
          resumo.vazio
            ? "Aguardando dados"
            : resumo.completo
              ? "O que este prato custa"
              : "O que este prato custa, até agora"
        }
        descricao="Somado a partir do preço de cada insumo e da quantidade declarada, na etapa em que ela foi pesada. Nenhum valor aqui foi estimado."
      >
        <PainelCustoERendimento
          resumo={resumo}
          peso={peso}
          unidadeDoPeso={unidadeDoPeso}
          porcoes={ficha.rendimentoPorcoes}
        />
        <LegendaDeCusto className="mt-4" />

        {/*
          A MARCA DA REGRA QUE FALTA — no ponto exato onde ela faria diferença.

          O TEXTO ANTERIOR DIZIA QUE ESTES NÚMEROS NÃO ERAM CALCULADOS. Isso
          deixou de ser verdade: o preço de venda, o CMV e o markup passaram a
          ser aritmética sobre valores declarados, e a margem de segurança
          passou a ser aplicada quando ela existe. Manter a frase antiga seria
          a tela negando o que ela mesma mostra duas seções abaixo.

          A frase nova diz o que continua em aberto — a ESCOLHA. O sistema
          calcula o que os números dela implicam; não decide quais deveriam ser.
        */}
        <RegraAConfirmar
          className="mt-4"
          oQue="O custo é soma e divisão sobre os números declarados. O preço de venda, o CMV e o markup são calculados a partir de valores que você informa — o sistema não escolhe um preço nem um alvo por você."
        />
      </Secao>

      {/* ═══ PREÇO E MARGEM ════════════════════════════════════════════════ */}
      <Secao
        rotulo="Preço e margem"
        titulo="O que a venda deste prato implica"
        descricao="Tudo aqui sai de dois números: o custo medido, que veio da composição, e o preço de venda, que é uma decisão sua. Nenhum alvo foi sugerido pelo sistema."
      >
        <QuadroDeVenda
          quadro={comercial}
          resumo={resumo}
          porcoes={ficha.rendimentoPorcoes}
          pesoFinal={peso}
          aoEditarPreco={() => comercialRef.current?.abrirPreco()}
          aoEditarParametros={() => comercialRef.current?.abrirParametros()}
        />
      </Secao>

      {/* ═══ COMPOSIÇÃO ════════════════════════════════════════════════════ */}
      <Secao
        rotulo="Composição"
        titulo={`${ficha.itens.length} ${
          ficha.itens.length === 1 ? "ingrediente" : "ingredientes"
        }`}
        descricao="Cada linha aponta para um insumo da biblioteca. O preço e o rendimento não são digitados aqui — são os que já existem no cadastro do insumo."
        acoes={
          <>
            <NovoIngrediente
              categorias={categorias}
              aoCadastrar={(novo) => {
                /*
                  O INSUMO ACABOU DE NASCER, E ELE JÁ ENTRA NA FICHA.

                  É a diferença entre cadastrar e depois procurar, e cadastrar
                  já usando. A linha entra sem quantidade declarada — porque
                  quantidade é uma medição da cozinha, não um dado do cadastro
                  — e aparece na composição marcada para ser preenchida. A
                  ficha continua exatamente onde estava.
                */
                adicionarItem({
                  ingrediente: novo,
                  quantidade: "",
                  etapa: "COMPRA",
                  observacao: "",
                });
              }}
            />
            <Botao variante="primario" tamanho="sm" onClick={adicionar.abrir}>
              Adicionar ingrediente
            </Botao>
          </>
        }
      >
        {ficha.itens.length === 0 ? (
          <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.45)] px-5 py-6">
            <p className="text-[0.9375rem] text-tinta">
              Esta ficha ainda não tem ingrediente nenhum.
            </p>
            <p className="mt-1.5 max-w-[70ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              A composição se monta escolhendo insumos que já existem na
              biblioteca: ao escolher um, o preço e o rendimento vêm com ele, e
              você só informa a quantidade. Se o insumo ainda não existe, o
              cadastro está no botão ao lado — e ele entra nesta ficha na hora.
            </p>
          </div>
        ) : (
          <Composicao
            resolvidos={resolvidos}
            unidadeDoPeso={unidadeDoPeso}
            peso={peso}
            aoAlterar={alterarItem}
            aoRemover={removerItem}
          />
        )}
      </Secao>

      {/* ═══ PREPARO, FINALIZAÇÃO E OBSERVAÇÕES ═══════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="space-y-6">
          {ficha.modoPreparo.length > 0 ? (
            <Secao
              rotulo="Modo de preparo"
              titulo="Como este prato é feito"
              descricao="Na ordem em que é executado."
            >
              <Passos passos={ficha.modoPreparo} />
            </Secao>
          ) : null}

          {ficha.finalizacao.length > 0 ? (
            <Secao
              rotulo="Finalização"
              titulo="Do fim do preparo até a passagem"
              descricao="O que se faz depois que o prato está pronto."
            >
              <Passos passos={ficha.finalizacao} />
            </Secao>
          ) : null}

          {ficha.observacoes ? (
            <Secao
              rotulo="Observações"
              titulo="O contexto desta ficha"
              descricao="Escrito por quem mediu, sobre como os números foram obtidos."
            >
              <p className="max-w-[80ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
                {ficha.observacoes}
              </p>
            </Secao>
          ) : null}
        </div>

        {/* LADO: outras fichas do cliente e histórico --------------------- */}
        <div className="space-y-6">
          {doCenario.outras.length > 0 && cliente ? (
            <Painel>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Outras fichas de {cliente.nomeFantasia}
              </p>
              <ul className="mt-3 divide-y divide-[var(--linha)]">
                {doCenario.outras.slice(0, 8).map((outra) => (
                  <li key={outra.id} className="py-2.5 first:pt-0 last:pb-0">
                    <Link
                      href={`/fichas/${outra.id}`}
                      className="text-[0.9375rem] text-tinta hover:text-oliva"
                    >
                      {outra.nome}
                    </Link>
                    <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                      {outra.categoria} · {outra.itens.length}{" "}
                      {outra.itens.length === 1 ? "ingrediente" : "ingredientes"}
                    </span>
                  </li>
                ))}
              </ul>
              {doCenario.outras.length > 8 ? (
                <p className="mt-3 text-[0.75rem] text-[var(--tinta-fraca)]">
                  e mais {doCenario.outras.length - 8}.
                </p>
              ) : null}
            </Painel>
          ) : null}

          {historico.length > 0 ? (
            <Painel>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Histórico da ficha
              </p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                {historico.length}{" "}
                {historico.length === 1 ? "registro" : "registros"}. As
                alterações desta sessão entram no topo.
              </p>
            </Painel>
          ) : null}
        </div>
      </div>

      {historico.length > 0 ? (
        <Secao
          rotulo="Rastro"
          titulo="O que mudou nesta ficha, e quando"
          descricao="Existe para que uma mudança de rendimento não apague a versão anterior sem deixar rastro."
        >
          <LinhaDoTempo
            eventos={historico.slice(0, 12).map((h, i) => ({
              id: `${ficha.id}-h${i}`,
              quando: dataCurta(h.em),
              titulo: h.oQue,
              descricao: h.quem,
            }))}
          />
        </Secao>
      ) : null}

      {/*
        O QUE SOBRA PARA DECIDIR — e o que isso trava nesta tela.
        O bloco mudou de conteúdo em relação à fase anterior: aqui ele já não
        explica por que não há custo (há), e sim o que ainda depende dela.
      */}
      <DecisoesQueFaltam
        apenas={["formacao-de-preco", "origem-do-preco", "arredondamento"]}
        titulo="O que a ficha já calcula, e o que ainda não"
        descricao="O custo do prato e o custo por porção já saem daqui, porque são soma e divisão sobre o que foi declarado. Preço de venda, CMV e markup continuam parados nas três decisões abaixo — nenhuma delas é o sistema que toma."
      />

      <Aviso tom="info" titulo="O que esta ficha ainda não faz">
        <p>
          Não define preço de venda, CMV, markup nem margem. Os quatro dependem
          de como a sua metodologia forma preço — margem sobre o custo ou sobre
          a venda, imposto antes ou depois — e um número inventado aqui teria a
          aparência exata de um número certo.
        </p>
        <p className="mt-2.5">
          E não grava em disco: as alterações vivem nesta sessão. Ao recarregar
          a página, a ficha volta ao estado inicial — o que os
          registros de histórico acima deixam claro, porque eles também somem.
        </p>
      </Aviso>

      {/* ═══ GAVETA: ADICIONAR INGREDIENTE ═════════════════════════════════ */}
      <AdicionarIngrediente
        aberta={adicionar.aberta}
        aoFechar={adicionar.fechar}
        ingredientes={visiveis}
        precos={precos}
        indice={indice}
        jaNaFicha={new Set(ficha.itens.map((i) => i.ingredienteId))}
        aoAdicionar={adicionarItem}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Composição — tabela no desktop, cartão no celular
// ---------------------------------------------------------------------------

/**
 * AS LINHAS DA COMPOSIÇÃO — as colunas do §8, quando aplicáveis.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A TABELA E O CARTÃO NASCEM DA MESMA LISTA DE CAMPOS          │
 * │                                                                      │
 * │ As nove colunas do briefing somadas às ações dão onze colunas. Escritas │
 * │ duas vezes — uma para a tabela e outra para o cartão — elas divergem no │
 * │ primeiro ajuste: o cartão continua mostrando a perda depois de a tabela │
 * │ parar de mostrá-la, e ninguém percebe, porque as duas telas nunca são   │
 * │ vistas juntas.                                                        │
 * │                                                                      │
 * │ Então existe UMA lista de campos por linha, e as duas versões a leem.   │
 * │ Acrescentar um campo é acrescentar um item na lista.                   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A TABELA SÓ APARECE ACIMA DE 1280px                          │
 * │                                                                      │
 * │ Onze colunas em 1024px viram colunas de 90px, e o número que importa —  │
 * │ o custo — fica espremido no fim, depois de uma rolagem horizontal. O    │
 * │ briefing pediu experiência própria para tela estreita, e "estreita"      │
 * │ aqui começa antes do celular.                                         │
 * │                                                                      │
 * │ Abaixo de 1280px a mesma linha vira cartão, com todos os campos        │
 * │ rotulados — e nada some: o cartão mostra MAIS do que a tabela, porque   │
 * │ espaço vertical não é problema.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function Composicao({
  resolvidos,
  unidadeDoPeso,
  peso,
  aoAlterar,
  aoRemover,
}: {
  resolvidos: readonly ItemResolvido[];
  unidadeDoPeso: string | null;
  peso: ReturnType<typeof pesarFicha>;
  aoAlterar: (indiceDaLinha: number, mudanca: Partial<ItemFicha>) => void;
  aoRemover: (indiceDaLinha: number) => void;
}) {
  /*
    ── AS COLUNAS DE PESO SÓ ENTRAM QUANDO EXISTE PESO ─────────────────────
    "Quando aplicáveis" é a palavra que decide. Uma ficha em que nenhum insumo
    tem pesagem mostraria quatro colunas de traço — mais difíceis de ler do
    que a versão sem elas, e sugerindo um defeito que não existe.
  */
  const temPeso = resolvidos.some(
    (r) => r.transformacao.indicadores.bruto !== null || r.transformacao.etapasInformadas > 0
  );
  const temPerda = resolvidos.some(
    (r) =>
      r.transformacao.indicadores.perdaTotal !== null ||
      r.transformacao.indicadores.rendimentoFinalPct !== null
  );

  return (
    <>
      {/* Tabela — telas largas ------------------------------------------- */}
      <div className="hidden lg:block">
        <Tabela>
          <CabecalhoTabela>
            <LinhaCabecalho>
              <CelulaCabecalho>Ingrediente</CelulaCabecalho>
              <CelulaCabecalho align="dir">Quantidade</CelulaCabecalho>
              <CelulaCabecalho>Un.</CelulaCabecalho>
              <CelulaCabecalho align="dir">Preço de referência</CelulaCabecalho>
              {temPeso ? (
                <>
                  <CelulaCabecalho align="dir">Bruto</CelulaCabecalho>
                  <CelulaCabecalho align="dir">Limpo</CelulaCabecalho>
                  <CelulaCabecalho align="dir">Preparado</CelulaCabecalho>
                </>
              ) : null}
              {temPerda ? (
                <>
                  <CelulaCabecalho align="dir">Perda</CelulaCabecalho>
                  <CelulaCabecalho align="dir">Rend.</CelulaCabecalho>
                </>
              ) : null}
              <CelulaCabecalho align="dir">Custo</CelulaCabecalho>
              <CelulaCabecalho align="dir">Ações</CelulaCabecalho>
            </LinhaCabecalho>
          </CabecalhoTabela>
          <CorpoTabela>
            {resolvidos.map((r, i) => (
              <LinhaTabela key={`${r.item.ingredienteId}-${i}`}>
                <Celula destaque>
                  <NomeDoInsumo resolvido={r} />
                </Celula>
                <Celula align="dir">
                  {r.item.quantidade.trim() === "" ? (
                    <span className="text-[0.875rem] text-[var(--tinta-fraca)]">
                      não informada
                    </span>
                  ) : (
                    <span className="tabular text-[0.9375rem] text-tinta">
                      {r.item.quantidade}
                    </span>
                  )}
                </Celula>
                <Celula>{r.item.unidade || "—"}</Celula>
                <Celula align="dir">
                  <PrecoDeReferencia resolvido={r} />
                </Celula>

                {temPeso ? (
                  <>
                    <Celula align="dir">
                      {pesoTexto(r.transformacao.indicadores.bruto, r.transformacao.unidade)}
                    </Celula>
                    <Celula align="dir">
                      {pesoTexto(r.transformacao.indicadores.limpo, r.transformacao.unidade)}
                    </Celula>
                    <Celula align="dir">
                      {pesoTexto(r.transformacao.indicadores.preparado, r.transformacao.unidade)}
                    </Celula>
                  </>
                ) : null}

                {temPerda ? (
                  <>
                    <Celula align="dir">
                      {r.transformacao.indicadores.perdaTotal === null ? (
                        <span className="text-[var(--tinta-fraca)]">—</span>
                      ) : (
                        <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
                          {pesoTexto(r.transformacao.indicadores.perdaTotal, r.transformacao.unidade)}
                          {r.transformacao.indicadores.perdaTotalPct !== null ? (
                            <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                              {percentualTexto(r.transformacao.indicadores.perdaTotalPct)}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </Celula>
                    <Celula align="dir">
                      <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
                        {percentualTexto(r.transformacao.indicadores.rendimentoFinalPct)}
                      </span>
                    </Celula>
                  </>
                ) : null}

                <Celula align="dir">
                  <CustoDaLinha resolvido={r} />
                </Celula>
                <Celula align="dir">
                  <AcoesDaLinha
                    resolvido={r}
                    unidadeDoPeso={unidadeDoPeso}
                    aoAlterar={(mudanca) => aoAlterar(i, mudanca)}
                    aoRemover={() => aoRemover(i)}
                  />
                </Celula>
              </LinhaTabela>
            ))}
          </CorpoTabela>
        </Tabela>
      </div>

      {/* Cartões — telas estreitas --------------------------------------- */}

      <ul className="space-y-3 lg:hidden">
        {resolvidos.map((r, i) => (
          <li
            key={`${r.item.ingredienteId}-${i}`}
            className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <NomeDoInsumo resolvido={r} />
              </div>
              <div className="shrink-0 text-right">
                <CustoDaLinha resolvido={r} />
              </div>
            </div>

            <dl className="mt-3 space-y-1.5 border-t border-[var(--linha)] pt-3">
              <CampoDaLinha rotulo="Quantidade">
                {r.item.quantidade.trim() === "" ? (
                  <span className="text-[var(--tinta-fraca)]">não informada</span>
                ) : (
                  <span className="tabular">
                    {r.item.quantidade} {r.item.unidade}
                  </span>
                )}
              </CampoDaLinha>
              <CampoDaLinha rotulo="Peso declarado em">
                {ETAPA_CURTA[r.item.etapa]}
              </CampoDaLinha>
              <CampoDaLinha rotulo="Preço de referência">
                <PrecoDeReferencia resolvido={r} />
              </CampoDaLinha>
              <CampoDaLinha rotulo="Peso de compra">
                {pesoTexto(r.transformacao.indicadores.bruto, r.transformacao.unidade)}
              </CampoDaLinha>
              <CampoDaLinha rotulo="Peso limpo">
                {pesoTexto(r.transformacao.indicadores.limpo, r.transformacao.unidade)}
              </CampoDaLinha>
              <CampoDaLinha rotulo="Peso preparado">
                {pesoTexto(r.transformacao.indicadores.preparado, r.transformacao.unidade)}
              </CampoDaLinha>
              <CampoDaLinha rotulo="Perda total">
                {pesoTexto(r.transformacao.indicadores.perdaTotal, r.transformacao.unidade)}
                {r.transformacao.indicadores.perdaTotalPct !== null ? (
                  <>
                    {" "}
                    <span className="text-[var(--tinta-fraca)]">
                      ({percentualTexto(r.transformacao.indicadores.perdaTotalPct)})
                    </span>
                  </>
                ) : null}
              </CampoDaLinha>
              <CampoDaLinha rotulo="Rendimento final">
                {percentualTexto(r.transformacao.indicadores.rendimentoFinalPct)}
              </CampoDaLinha>
            </dl>

            {r.item.observacao ? (
              <p className="mt-3 border-t border-dashed border-[var(--linha)] pt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                {r.item.observacao}
              </p>
            ) : null}

            <div className="mt-3 border-t border-[var(--linha)] pt-3">
              <AcoesDaLinha
                resolvido={r}
                unidadeDoPeso={unidadeDoPeso}
                aoAlterar={(mudanca) => aoAlterar(i, mudanca)}
                aoRemover={() => aoRemover(i)}
              />
            </div>
          </li>
        ))}
      </ul>

      {peso.etapa === null && peso.etapasEncontradas.length > 1 ? (
        <p className="mt-4 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
          As linhas foram pesadas em etapas diferentes ({peso.etapasEncontradas
            .map((e) => ETAPA_CURTA[e])
            .join(", ")}
          ), e por isso não há um peso inicial total: somar o peso de compra de
          um insumo com o peso preparado de outro daria um número que não
          corresponde a nada que exista na cozinha.
        </p>
      ) : null}
    </>
  );
}

/** A unidade de rendimento é sempre porções — o campo do domínio diz isso. */
function UnidadeDoRendimento() {
  return (
    <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
      o rendimento é declarado em porções
    </span>
  );
}

function CampoDaLinha({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </dt>
      <dd className="text-right text-[0.875rem] text-[var(--tinta-suave)]">{children}</dd>
    </div>
  );
}

/**
 * O nome do insumo, clicável para o cadastro dele.
 *
 * ── POR QUE O LINK ESTÁ AQUI, E NÃO NUMA COLUNA DE AÇÕES ───────────────────
 * A pergunta "por que este insumo custa isso?" se responde no cadastro, com os
 * pesos medidos. Ter que voltar para a biblioteca e procurar o nome quebra o
 * raciocínio justamente no meio dele — e é a mesma costura que o §18 pede
 * entre ficha e ingrediente.
 */
function NomeDoInsumo({ resolvido: r }: { resolvido: ItemResolvido }) {
  return (
    <>
      {r.ingrediente ? (
        <Link
          href={`/ingredientes/${r.ingrediente.id}`}
          className="text-[0.9375rem] font-medium text-tinta hover:text-oliva"
        >
          {r.ingrediente.nome}
        </Link>
      ) : (
        <span className="text-[0.9375rem] font-medium text-[var(--tinta-fraca)]">
          insumo fora da biblioteca
        </span>
      )}
      <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
        {r.ingrediente ? `${r.ingrediente.categoria} · ` : ""}
        {ROTULO_ETAPA_PESO[r.item.etapa]}
      </span>
      {r.estado !== "OK" ? (
        <span className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Etiqueta tom="dourado">{ROTULO_ESTADO_ITEM[r.estado]}</Etiqueta>
          <span className="max-w-[46ch] text-[0.75rem] leading-snug text-[var(--tinta-suave)]">
            {ACAO_DO_ESTADO_ITEM[r.estado]}
          </span>
        </span>
      ) : null}
      {r.item.observacao ? (
        <span className="mt-1 block text-[0.75rem] leading-snug text-[var(--tinta-fraca)] lg:hidden">
          {r.item.observacao}
        </span>
      ) : null}
    </>
  );
}

/**
 * O preço usado na conta, e de onde ele veio.
 *
 * ── POR QUE A ORIGEM APARECE AO LADO DO NÚMERO ─────────────────────────────
 * O mesmo insumo pode ter preço do cliente, da biblioteca e o guardado na
 * ficha — e os três podem discordar. Um número sem procedência faz a
 * consultora supor que ele é o que ela pensou, e a suposição errada aqui
 * muda o custo do prato inteiro.
 *
 * Quando o preço guardado na ficha difere do que está sendo usado, a
 * divergência aparece. O sistema não escolhe por conta própria qual dos dois
 * vale — essa é a decisão "de onde vem o preço", ainda aberta.
 */
function PrecoDeReferencia({ resolvido: r }: { resolvido: ItemResolvido }) {
  const guardado = r.item.precoReferencia;
  const divergem =
    guardado !== null &&
    r.precoEfetivo !== null &&
    r.origemDoPreco !== "FICHA" &&
    Math.abs(guardado - r.precoEfetivo) > 0.005;

  return (
    <>
      {r.precoEfetivo === null ? (
        <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem preço</span>
      ) : (
        <span className="tabular text-[0.9375rem] text-tinta">
          {dinheiro(r.precoEfetivo)}
          <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
            {ROTULO_ORIGEM_PRECO[r.origemDoPreco]}
            {r.ingrediente ? ` · por ${r.ingrediente.unidade}` : null}
          </span>
        </span>
      )}
      {divergem ? (
        <span className="mt-1 block text-[0.75rem] leading-snug text-[#8a6d1f]">
          a ficha guardou {dinheiro(guardado)}
        </span>
      ) : null}
    </>
  );
}

/** O custo da linha — com o motivo quando ele não existe. */
function CustoDaLinha({ resolvido: r }: { resolvido: ItemResolvido }) {
  if (r.custo === null) {
    return (
      <span className="text-[0.875rem] text-[var(--tinta-fraca)]">
        fora da soma
        <span className="mt-0.5 block text-[0.6875rem] tracking-[0.1em] uppercase">
          {ROTULO_ESTADO_ITEM[r.estado]}
        </span>
      </span>
    );
  }

  return (
    <span className="tabular text-[0.9375rem] text-tinta">
      {valorEmReais(r.custo)}
      <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
        {r.quantidade !== null ? `${r.quantidade.toString().replace(".", ",")} ` : ""}
        {r.item.unidade} × {ETAPA_CURTA[r.item.etapa].toLowerCase()}
      </span>
    </span>
  );
}

/**
 * AS TRÊS AÇÕES DE UMA LINHA.
 *
 * Editar muda o que é da ficha (quantidade, etapa, anotação). Remover tira a
 * linha. E "rendimento" abre o fluxo do insumo — compra, limpeza, preparo,
 * resultado — porque é ali que se entende por que o quilo utilizado custa mais
 * do que o quilo da nota.
 */
function AcoesDaLinha({
  resolvido: r,
  unidadeDoPeso,
  aoAlterar,
  aoRemover,
}: {
  resolvido: ItemResolvido;
  unidadeDoPeso: string | null;
  aoAlterar: (mudanca: Partial<ItemFicha>) => void;
  aoRemover: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <GavetaRendimentoDoInsumo resolvido={r} unidadeDoPeso={unidadeDoPeso} />
      <GavetaEditarItem resolvido={r} aoAlterar={aoAlterar} aoRemover={aoRemover} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gaveta — editar a linha
// ---------------------------------------------------------------------------

function GavetaEditarItem({
  resolvido: r,
  aoAlterar,
  aoRemover,
}: {
  resolvido: ItemResolvido;
  aoAlterar: (mudanca: Partial<ItemFicha>) => void;
  aoRemover: () => void;
}) {
  const gaveta = useGaveta();
  const [quantidade, setQuantidade] = useState(r.item.quantidade);
  const [etapa, setEtapa] = useState<EtapaPeso>(r.item.etapa);
  const [observacao, setObservacao] = useState(r.item.observacao);

  function abrir() {
    setQuantidade(r.item.quantidade);
    setEtapa(r.item.etapa);
    setObservacao(r.item.observacao);
    gaveta.abrir();
  }

  function salvar() {
    aoAlterar({ quantidade, etapa, observacao });
    gaveta.fechar();
  }

  return (
    <>
      <Botao variante="linha" tamanho="sm" onClick={abrir}>
        Editar
      </Botao>

      <Gaveta
        aberta={gaveta.aberta}
        aoFechar={gaveta.fechar}
        titulo={r.ingrediente?.nome ?? "Linha da composição"}
        descricao="Quantidade, etapa do peso e anotação são desta ficha. O preço e o rendimento vêm do cadastro do insumo."
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={gaveta.fechar}>
              Cancelar
            </Botao>
            <Botao variante="primario" tamanho="sm" onClick={salvar}>
              Salvar linha
            </Botao>
          </>
        }
      >
        <div className="space-y-5">
          {/*
            OS DADOS QUE JÁ EXISTEM — mostrados, não pedidos de novo.
            É o §7 em uma caixa: escolhido o insumo, o resto vem com ele.
          */}
          {r.ingrediente ? (
            <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie-areia)] px-4 py-4">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Vem do cadastro do insumo
              </p>
              <div className="mt-3">
                <ListaDados colunas={2}>
                  <Dado rotulo="Unidade de compra">{r.ingrediente.unidade}</Dado>
                  <Dado rotulo="Preço por unidade">{dinheiro(r.precoEfetivo)}</Dado>
                  <Dado rotulo="Rendimento final">
                    {percentualTexto(r.transformacao.indicadores.rendimentoFinalPct)}
                  </Dado>
                  <Dado rotulo="Fornecedor">
                    {r.fornecedor || (
                      <span className="text-[var(--tinta-fraca)]">não informado</span>
                    )}
                  </Dado>
                </ListaDados>
              </div>
              <p className="mt-3 border-t border-dashed border-[var(--linha-forte)] pt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                Nada aqui é digitado na ficha. Se o preço ou o rendimento
                estiverem errados, o lugar de corrigir é o cadastro do insumo —
                e a correção vale para todas as fichas que o usam.
              </p>
            </div>
          ) : null}

          <Campo
            label="Quantidade usada"
            name="quantidade"
            inputMode="decimal"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Ex.: 1,200"
            ajuda='Na unidade do insumo. Também aceita texto como "a gosto" — a linha fica fora da soma, e o painel diz por quê.'
          />

          <CampoSelecao
            label="Em que peso esta quantidade foi medida"
            name="etapa"
            value={etapa}
            opcoes={OPCOES_ETAPA}
            onChange={(e) => setEtapa(e.target.value as EtapaPeso)}
            ajuda="É este campo que faz a conta existir. Sem ele, o sistema teria que escolher um custo por conta própria."
          />

          {/*
            A CONFERÊNCIA DA MESMA CONTA QUE O PAINEL FAZ.
            Ver o custo mudar enquanto se ajusta a etapa é o que torna o efeito
            do campo visível — e é o que a planilha não dá.
          */}
          <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-3.5">
            <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
              Com o que está aqui hoje
            </p>
            <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              {r.estado === "OK" && r.custo !== null ? (
                <>
                  Esta linha soma{" "}
                  <strong className="font-semibold text-tinta">
                    {valorEmReais(r.custo)}
                  </strong>{" "}
                  na ficha.
                </>
              ) : (
                <>
                  Esta linha está fora da soma:{" "}
                  <strong className="font-semibold text-tinta">
                    {ROTULO_ESTADO_ITEM[r.estado]}
                  </strong>
                  . {ACAO_DO_ESTADO_ITEM[r.estado]}
                </>
              )}
            </p>
            {r.transformacao.etapasInformadas > 0 ? (
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <ResumoTransformacao derivada={r.transformacao} />
              </p>
            ) : null}
          </div>

          <Campo
            label="Anotação da linha"
            name="observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Corte, marca, substituição"
          />

          <div className="rounded-[var(--raio)] border border-dashed border-red-800/40 bg-[rgba(153,27,27,0.05)] px-4 py-3.5">
            <p className="text-[0.8125rem] font-semibold text-tinta">
              Remover esta linha da ficha
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Tira o ingrediente da composição deste prato. O insumo continua na
              biblioteca, com o preço e as pesagens dele — nada é apagado do
              cadastro.
            </p>
            <div className="mt-3">
              <Botao
                variante="secundario"
                tamanho="sm"
                onClick={() => {
                  aoRemover();
                  gaveta.fechar();
                }}
              >
                Remover ingrediente
              </Botao>
            </div>
          </div>
        </div>
      </Gaveta>
    </>
  );
}

// ---------------------------------------------------------------------------
// Gaveta — o rendimento do insumo dentro da ficha
// ---------------------------------------------------------------------------

/**
 * O FLUXO DO INSUMO, DENTRO DA FICHA.
 *
 * ── POR QUE ESTA GAVETA EXISTE, SE O INSUMO TEM UMA PÁGINA INTEIRA ─────────
 * Porque a pergunta acontece AQUI. A consultora está olhando o custo da linha
 * e não entende por que o quilo utilizado custa mais do que o quilo da nota —
 * e a resposta é o rendimento. Mandá-la para a outra página faria perder o
 * lugar na ficha; um link, ao lado, continua existindo para quem quer o
 * cadastro completo.
 *
 * O desenho é o MESMO componente da página do insumo. Uma segunda cópia
 * desenhada aqui mostraria um rendimento na ficha e outro no cadastro.
 */
function GavetaRendimentoDoInsumo({
  resolvido: r,
  unidadeDoPeso,
}: {
  resolvido: ItemResolvido;
  unidadeDoPeso: string | null;
}) {
  const gaveta = useGaveta();
  const ind = r.transformacao.indicadores;

  if (!r.ingrediente) return null;

  return (
    <>
      <Botao variante="linha" tamanho="sm" onClick={gaveta.abrir}>
        Rendimento
      </Botao>

      <Gaveta
        aberta={gaveta.aberta}
        aoFechar={gaveta.fechar}
        titulo={r.ingrediente.nome}
        descricao="O que acontece entre a compra e o prato, e o que isso faz com o custo do quilo utilizado."
        acoes={
          <BotaoLink
            href={`/ingredientes/${r.ingrediente.id}`}
            variante="secundario"
            tamanho="sm"
          >
            Ver cadastro do insumo
          </BotaoLink>
        }
      >
        <div className="space-y-5">
          <FluxoRendimentoIngrediente
            derivada={r.transformacao}
            unidade={unidadeDoPeso ?? r.transformacao.unidade}
          />

          <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-4">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              O que entra nesta linha
            </p>
            <div className="mt-3">
              <ListaDados colunas={2}>
                <Dado rotulo="Quantidade declarada">
                  {r.item.quantidade.trim() === "" ? (
                    <span className="text-[var(--tinta-fraca)]">não informada</span>
                  ) : (
                    <span className="tabular">
                      {r.item.quantidade} {r.item.unidade}
                    </span>
                  )}
                </Dado>
                <Dado rotulo="Peso declarado em">{ROTULO_ETAPA_PESO[r.item.etapa]}</Dado>
                <Dado rotulo="Custo por unidade na etapa">
                  {dinheiro(
                    r.item.etapa === "PREPARADO"
                      ? r.custos.preparado
                      : r.item.etapa === "LIMPO"
                        ? r.custos.limpo
                        : r.custos.compra
                  )}
                </Dado>
                <Dado rotulo="Custo desta linha">
                  {r.custo === null
                    ? ROTULO_ESTADO_ITEM[r.estado]
                    : valorEmReais(r.custo)}
                </Dado>
              </ListaDados>
            </div>
          </div>

          {r.estado !== "OK" ? (
            <Aviso tom="atencao" titulo="Esta linha está fora da soma">
              <p>{ACAO_DO_ESTADO_ITEM[r.estado]}</p>
            </Aviso>
          ) : null}

          <RegraAConfirmar oQue="O rendimento mostrado é o das pesagens feitas na cozinha. Se a sua metodologia tem fator de correção ou índice de cocção de referência, ele ainda não é aplicado aqui." />

          {ind.bruto === null ? (
            <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
              Este insumo ainda não foi pesado. Enquanto não houver medição, o
              sistema não sabe quanto ele rende — e usa o preço de compra, que é
              o único que existe, sem estimar perda nenhuma.
            </p>
          ) : null}
        </div>
      </Gaveta>
    </>
  );
}

// ---------------------------------------------------------------------------
// Gaveta — adicionar ingrediente
// ---------------------------------------------------------------------------

/**
 * ADICIONAR UM INSUMO À FICHA — POR BUSCA, E SEM PEDIR O QUE JÁ SE SABE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ORDEM DOS PASSOS É A DE UMA PESSOA, NÃO A DE UM FORMULÁRIO          │
 * │                                                                      │
 * │ Primeiro ela pensa no INSUMO ("essas fichas levam mussarela"), e só    │
 * │ depois na quantidade. Um formulário que abre com uma lista suspensa de │
 * │ oitenta insumos e um campo de quantidade obriga a rolar a lista antes  │
 * │ de saber se o insumo está lá.                                         │
 * │                                                                      │
 * │ Então: busca primeiro. Escolhido o insumo, aparece o que o sistema já   │
 * │ sabe sobre ele — preço, unidade, rendimento, fornecedor — e só então o  │
 * │ que falta: quantidade, etapa do peso e anotação.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A BUSCA É LOCAL, E NÃO VAI AO SERVIDOR                               │
 * │                                                                      │
 * │ A biblioteca inteira já está na tela — são dezenas de insumos, não     │
 * │ milhares. Filtrar no cliente responde a cada tecla; uma ida ao servidor │
 * │ por tecla digitada daria uma lista que pisca.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function AdicionarIngrediente({
  aberta,
  aoFechar,
  ingredientes,
  precos,
  indice,
  jaNaFicha,
  aoAdicionar,
}: {
  aberta: boolean;
  aoFechar: () => void;
  ingredientes: readonly Ingrediente[];
  precos: ReadonlyMap<string, IngredienteDoCliente>;
  /**
   * O índice por id — e não é enfeite: é por ele que a linha do que foi
   * escolhido se resolve (`escolhidoId` é um id, e o que se mostra é o
   * objeto). Sem ele o campo mostra o id escolhido em vez do nome.
   */
  indice: ReadonlyMap<string, Ingrediente>;
  jaNaFicha: ReadonlySet<string>;
  aoAdicionar: (entrada: {
    ingrediente: Ingrediente;
    quantidade: string;
    etapa: EtapaPeso;
    observacao: string;
  }) => void;
}) {
  const [busca, setBusca] = useState("");
  const [escolhidoId, setEscolhidoId] = useState<string | null>(null);
  const [quantidade, setQuantidade] = useState("");
  const [etapa, setEtapa] = useState<EtapaPeso>("COMPRA");
  const [observacao, setObservacao] = useState("");

  const escolhido = escolhidoId === null ? null : (indice.get(escolhidoId) ?? null);

  const termo = busca.trim().toLowerCase();
  const encontrados = termo
    ? ingredientes.filter((i) =>
        `${i.nome} ${i.categoria}`.toLowerCase().includes(termo)
      )
    : ingredientes;

  function fechar() {
    setBusca("");
    setEscolhidoId(null);
    setQuantidade("");
    setEtapa("COMPRA");
    setObservacao("");
    aoFechar();
  }

  function confirmar() {
    if (!escolhido) return;
    aoAdicionar({ ingrediente: escolhido, quantidade, etapa, observacao });
    fechar();
  }

  const doCliente = escolhido ? precos.get(escolhido.id) : null;
  const precoEfetivo = doCliente?.precoAtual ?? escolhido?.precoAtual ?? null;

  return (
    <Gaveta
      aberta={aberta}
      aoFechar={fechar}
      titulo={escolhido ? `Adicionar ${escolhido.nome}` : "Adicionar ingrediente"}
      descricao={
        escolhido
          ? "Só falta a quantidade: o preço e o rendimento vêm do cadastro."
          : "Procure na biblioteca. O preço e o rendimento já estão cadastrados e não serão pedidos de novo."
      }
      acoes={
        escolhido ? (
          <>
            <Botao variante="linha" tamanho="sm" onClick={() => setEscolhidoId(null)}>
              Trocar insumo
            </Botao>
            <Botao variante="primario" tamanho="sm" onClick={confirmar}>
              Adicionar à ficha
            </Botao>
          </>
        ) : (
          <Botao variante="linha" tamanho="sm" onClick={fechar}>
            Cancelar
          </Botao>
        )
      }
    >
      {escolhido === null ? (
        <div className="space-y-4">
          <Campo
            label="Buscar insumo"
            name="buscaInsumo"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nome ou categoria…"
            ajuda={`${encontrados.length} de ${ingredientes.length} insumos da biblioteca.`}
          />

          {encontrados.length === 0 ? (
            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-4">
              <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                Nenhum insumo com esse nome. Se ele ainda não está cadastrado,
                feche esta gaveta e use <strong className="font-semibold text-tinta">
                  cadastrar novo ingrediente
                </strong>{" "}
                — o insumo entra na biblioteca e nesta ficha no mesmo passo.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--linha)] rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)]">
              {encontrados.map((i) => {
                const doCli = precos.get(i.id);
                const preco = doCli?.precoAtual ?? i.precoAtual;
                return (
                  <li key={i.id}>
                    <button
                      type="button"
                      onClick={() => setEscolhidoId(i.id)}
                      className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-[rgba(107,122,70,0.06)]"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-[0.9375rem] text-tinta">{i.nome}</span>
                          {jaNaFicha.has(i.id) ? (
                            <Etiqueta>já está na ficha</Etiqueta>
                          ) : null}
                        </span>
                        <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
                          {i.categoria} · por {i.unidade}
                          {doCli?.precoAtual != null ? " · preço deste cliente" : ""}
                        </span>
                      </span>
                      <span className="tabular text-right text-[0.875rem] text-[var(--tinta-suave)]">
                        {dinheiro(preco)}
                        {i.transformacao.preparado !== null ||
                        i.transformacao.limpo !== null ? (
                          <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                            rende{" "}
                            {percentualTexto(
                              i.transformacao.bruto && i.transformacao.bruto.peso > 0
                                ? ((i.transformacao.preparado ?? i.transformacao.limpo)!.peso /
                                    i.transformacao.bruto.peso) *
                                    100
                                : null
                            )}
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                            sem pesagem
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {/*
            O QUE JÁ SE SABE — e por isso não se pergunta.
            A caixa existe menos para informar do que para mostrar que o dado
            veio junto: é a diferença entre "o sistema pediu tudo de novo" e
            "o sistema já sabia".
          */}
          <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-4">
            <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
              Já estava cadastrado
            </p>
            <div className="mt-3">
              <ListaDados colunas={2}>
                <Dado rotulo="Categoria">{escolhido.categoria}</Dado>
                <Dado rotulo="Unidade de compra">{escolhido.unidade}</Dado>
                <Dado rotulo="Preço unitário">
                  {dinheiro(precoEfetivo)}
                  <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                    {doCliente?.precoAtual != null
                      ? "preço deste cliente"
                      : "preço da biblioteca"}
                  </span>
                </Dado>
                <Dado rotulo="Rendimento final">
                  {escolhido.transformacao.bruto && escolhido.transformacao.bruto.peso > 0 ? (
                    percentualTexto(
                      ((escolhido.transformacao.preparado ?? escolhido.transformacao.limpo)!
                        .peso /
                        escolhido.transformacao.bruto.peso) *
                        100
                    )
                  ) : (
                    <span className="text-[var(--tinta-fraca)]">sem pesagem</span>
                  )}
                </Dado>
              </ListaDados>
            </div>
          </div>

          <Campo
            label="Quantidade usada"
            name="quantidade"
            inputMode="decimal"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            placeholder="Ex.: 0,180"
            ajuda={`Na unidade do insumo (${escolhido.unidade}). Pode ficar em branco e ser preenchida depois.`}
          />

          <CampoSelecao
            label="Em que peso esta quantidade foi medida"
            name="etapa"
            value={etapa}
            opcoes={OPCOES_ETAPA}
            onChange={(e) => setEtapa(e.target.value as EtapaPeso)}
            ajuda="Compra é o que se paga na nota; preparado é o que se pesa depois de cozinhar."
          />

          <Campo
            label="Anotação da linha"
            name="observacao"
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Corte, marca, substituição"
          />

          {/*
            A CONTA ANTES DE ENTRAR, com o mesmo motor que a ficha usa.
            Aqui vale mais do que no cadastro: é o número que vai virar custo
            do prato, e vê-lo antes de confirmar evita descobrir depois que a
            etapa estava errada.
          */}
          <ContaDaNovaLinha
            ingrediente={escolhido}
            precos={precos}
            quantidade={quantidade}
            etapa={etapa}
          />

          <p className="text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
            Esta linha guarda o preço de referência do dia de hoje. Se o preço
            do insumo mudar depois, a ficha continua contando o que valia
            quando foi escrita — e o painel mostra quando os dois divergirem.
          </p>
        </div>
      )}
    </Gaveta>
  );
}

/**
 * A CONTA DA LINHA NOVA, feita antes de ela existir.
 *
 * Usa `resolverItem` — o MESMO motor da ficha — sobre um item montado na hora.
 * Uma conta própria aqui poderia dar um número diferente do que a linha vai
 * mostrar depois de adicionada, e a consultora veria duas verdades sobre a
 * mesma linha.
 */
function ContaDaNovaLinha({
  ingrediente,
  precos,
  quantidade,
  etapa,
}: {
  ingrediente: Ingrediente;
  precos: ReadonlyMap<string, IngredienteDoCliente>;
  quantidade: string;
  etapa: EtapaPeso;
}) {
  const doCliente = precos.get(ingrediente.id);

  const provisorio: ItemFicha = {
    ingredienteId: ingrediente.id,
    quantidade,
    unidade: ingrediente.unidade,
    precoReferencia: doCliente?.precoAtual ?? ingrediente.precoAtual,
    etapa,
    observacao: "",
  };

  const r = resolverItem(provisorio, ingrediente, doCliente ?? null);

  if (quantidade.trim() === "") return null;

  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie-areia)] px-4 py-3.5">
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        Esta linha vai somar
      </p>
      <p className="mt-1.5 font-display text-[1.375rem] text-tinta">
        {r.custo === null ? "—" : valorEmReais(r.custo)}
      </p>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
        {r.custo === null ? (
          <>
            <strong className="font-semibold text-tinta">
              {ROTULO_ESTADO_ITEM[r.estado]}.
            </strong>{" "}
            {ACAO_DO_ESTADO_ITEM[r.estado]}
          </>
        ) : (
          <>
            <span className="tabular">{quantidade}</span> {ingrediente.unidade} ×{" "}
            {dinheiro(
              etapa === "PREPARADO"
                ? r.custos.preparado
                : etapa === "LIMPO"
                  ? r.custos.limpo
                  : r.custos.compra
            )}{" "}
            por {ingrediente.unidade} {ETAPA_CURTA[etapa].toLowerCase()}
          </>
        )}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// O quadro de venda
// ---------------------------------------------------------------------------

/**
 * O QUE A VENDA DESTE PRATO IMPLICA — a seção que cruza custo e preço.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A DIVISÃO QUE ESTA SEÇÃO FAZ, E QUE É O PONTO INTEIRO                │
 * │                                                                      │
 * │ CUSTO é medição. Sai da composição, dos pesos e dos preços da         │
 * │ biblioteca. Ninguém decide nada: é soma e divisão sobre o que foi      │
 * │ pesado e comprado. Onde falta medição, falta custo — e a seção diz     │
 * │ qual falta.                                                            │
 * │                                                                      │
 * │ PREÇO é decisão. Nenhum número desta seção foi escolhido pelo          │
 * │ sistema. O preço de venda é o que ela declarou; o CMV e o markup são   │
 * │ CONSEQUÊNCIAS aritméticas desse preço; a margem e os alvos são o que   │
 * │ ela informou, e enquanto não informar eles não existem.                │
 * │                                                                      │
 * │ ┌────────────────────────────────────────────────────────────────┐   │
 * │ │ POR QUE A SEÇÃO NÃO MOSTRA UM "PREÇO SUGERIDO" EM DESTAQUE     │   │
 * │ │                                                                │   │
 * │ │ Mostrar seria fácil: uma multiplicação por três e um número     │   │
 * │ │ grande no meio da tela. E ela leria como recomendação — seria   │   │
 * │ │ o sistema opinando sobre o preço dela, com a autoridade de um   │   │
 * │ │ número de tela.                                                 │   │
 * │ │                                                                │   │
 * │ │ O que existe é mais estreito e mais honesto: "aplicando o SEU   │   │
 * │ │ alvo de 28%, o preço teria de ser X". O alvo é dela, a conta é  │   │
 * │ │ do sistema, e a responsabilidade fica onde estava.              │   │
 * │ └────────────────────────────────────────────────────────────────┘   │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function QuadroDeVenda({
  quadro,
  resumo,
  porcoes,
  pesoFinal,
  aoEditarPreco,
  aoEditarParametros,
}: {
  quadro: QuadroComercial;
  resumo: ResumoCustoFicha;
  porcoes: number | null;
  pesoFinal: PesoDaFicha;
  aoEditarPreco: () => void;
  aoEditarParametros: () => void;
}) {
  const custoFechado = resumo.completo;

  /*
    ── O CUSTO POR PORÇÃO E POR QUILO NO MESMO NÚMERO DE VENDA ─────────────

    Um preço de venda é POR PORÇÃO, porque é assim que o prato é vendido. O
    custo por porção existe quando há rendimento declarado. Quando não há, o
    sistema não divide: uma porção suposta daria um custo por porção com a
    mesma aparência de um custo por porção certo.
  */
  const custoPorPorcao = custoFechado ? resumo.custoPorPorcao : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* ─── O CUSTO, QUE É MEDIÇÃO ──────────────────────────────────── */}
        <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie-areia)] px-5 py-4">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            Custo medido
          </p>
          <p className="mt-2 font-display text-[1.75rem] leading-none text-tinta">
            {custoFechado ? valorEmReais(resumo.custoTotal) : "—"}
          </p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
            {custoFechado ? (
              <>
                <span className="tabular">{resumo.itensSomados}</span>{" "}
                {resumo.itensSomados === 1 ? "ingrediente somado" : "ingredientes somados"} ·{" "}
                <span className="tabular">{porcoes ?? "—"}</span>{" "}
                {porcoes === 1 ? "porção" : "porções"}
              </>
            ) : resumo.vazio ? (
              "A composição ainda não tem linha nenhuma para somar."
            ) : (
              `Há ${resumo.itensFora} de ${resumo.itensSomados + resumo.itensFora} linhas fora da soma. Este total é um piso, não um custo.`
            )}
          </p>
        </div>

        {/* ─── O PREÇO, QUE É DECISÃO ─────────────────────────────────── */}
        <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie-areia)] px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Preço de venda
            </p>
            <Botao variante="linha" tamanho="sm" onClick={aoEditarPreco}>
              {quadro.precoVenda === null ? "Informar" : "Alterar"}
            </Botao>
          </div>
          <p className="mt-2 font-display text-[1.75rem] leading-none text-tinta">
            {quadro.precoVenda === null ? "—" : valorEmReais(quadro.precoVenda)}
          </p>
          <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
            {quadro.precoVenda === null
              ? "Ainda não declarado. Sem preço, não há CMV nem markup — os dois só existem em cima de um preço."
              : "Declarado por você. O sistema não sugere preço: ele mostra o que este preço implica."}
          </p>
        </div>
      </div>

      {/* ─── O CRUZAMENTO ──────────────────────────────────────────────── */}
      {quadro.venda !== null ? (
        <ListaDados colunas={3}>
          <Dado rotulo="CMV">
            <span className="tabular text-[1.125rem]">{percentualTexto(quadro.venda.cmvPct)}</span>
            <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
              do preço de venda é custo de insumo
            </span>
          </Dado>
          <Dado rotulo="Markup">
            <span className="tabular text-[1.125rem]">
              {markupEmTexto(quadro.venda.markup)}
            </span>
            <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
              o preço é este múltiplo do custo
            </span>
          </Dado>
          <Dado rotulo="Sobra por porção">
            <span className="tabular text-[1.125rem]">
              {valorEmReais(quadro.venda.sobraReais)}
            </span>
            <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
              {percentualTexto(quadro.venda.sobraPct)} do preço — antes dos outros
              custos da casa
            </span>
          </Dado>
        </ListaDados>
      ) : null}

      {/*
        ── O CUSTO QUE O CMV USOU ───────────────────────────────────────────
        Quando a margem de segurança existe, o CMV acima foi calculado sobre o
        custo COM a margem, e não sobre o medido. Os dois apareceriam quase
        iguais na tela, e o CMV com margem é de 5% a 10% maior. Dizer qual foi
        usado é o que impede a leitura errada de um número certo.
      */}
      {quadro.margemAplicadaPct !== null && quadro.custoComMargem !== null ? (
        <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          Os indicadores acima usam o custo{" "}
          <strong className="font-semibold text-tinta">
            {valorEmReais(quadro.custoComMargem)}
          </strong>
          , que é o custo medido com {numeroFixo(quadro.margemAplicadaPct, 2)}% de margem de
          segurança — e não o medido puro. A margem existe porque parte do custo ainda vai
          aparecer: calcular o CMV sobre o custo medido daria um número otimista.
        </p>
      ) : null}

      {/* ─── OS PREÇOS QUE OS ALVOS EXIGEM ─────────────────────────────── */}
      {quadro.precosAlvo.length > 0 ? (
        <div className="rounded-[var(--raio)] border border-[var(--linha)] px-5 py-4">
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            Aplicando os seus alvos, o preço teria de ser
          </p>
          <ul className="mt-3 divide-y divide-[var(--linha)]">
            {quadro.precosAlvo.map((p) => (
              <li
                key={p.origem}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-[0.875rem] text-[var(--tinta-suave)]">
                  {p.origem === "CMV_ALVO"
                    ? `com o CMV alvo de ${numeroFixo(p.alvo, 2)}%`
                    : `com o markup alvo de ${markupEmTexto(p.alvo)}`}
                </span>
                <span className="tabular text-[1rem] font-semibold text-tinta">
                  {valorEmReais(p.valor)}
                </span>
              </li>
            ))}
          </ul>
          {quadro.precosAlvo.length > 1 ? (
            <p className="mt-3 border-t border-[var(--linha)] pt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
              Os dois caminhos dão preços diferentes. O sistema não escolhe entre eles — quem
              decide qual dos dois é o da casa é você.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* ─── O QUE FALTA PARA ESTA SEÇÃO FECHAR ────────────────────────── */}
      {quadro.pendencias.length > 0 ? (
        <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.5)] px-5 py-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              O que ainda falta
            </p>
            <Botao variante="linha" tamanho="sm" onClick={aoEditarParametros}>
              Informar
            </Botao>
          </div>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            {quadro.pendencias.length === 1
              ? "Falta uma definição para esta seção ficar completa: "
              : "Faltam definições para esta seção ficar completa: "}
            <strong className="font-semibold text-tinta">
              {listar(quadro.pendencias)}
            </strong>
            . O sistema deixa em branco em vez de supor.
          </p>
        </div>
      ) : null}

      {/* ─── PESO FINAL, QUANDO EXISTE ─────────────────────────────────── */}
      {/*
        O PESO É MEDIÇÃO, E POR ISSO ELE VEM DEPOIS DO PREÇO E ROTULADO.
        Sem a etapa declarada, o número não diz de que momento ele é — o quilo
        comprado e o quilo pronto são pesos diferentes do mesmo prato. Sem
        etapa, ele não aparece: dizer "o prato sai com 4 kg" sem dizer de
        quando seria pior do que não dizer nada.
      */}
      {pesoFinal.total !== null &&
      pesoFinal.unidade !== null &&
      pesoFinal.etapa !== null &&
      custoFechado ? (
        <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          Somando os pesos na etapa <strong className="font-semibold text-tinta">
            {ROTULO_ETAPA_PESO[pesoFinal.etapa]}
          </strong>
          , a ficha tem{" "}
          <span className="tabular">{pesoTexto(pesoFinal.total, pesoFinal.unidade)}</span> —{" "}
          <span className="tabular">
            {valorEmReais(resumo.custoTotal / pesoFinal.total)}
          </span>{" "}
          por {pesoFinal.unidade}. Isto é medição; o preço acima é decisão.
        </p>
      ) : null}

      {custoPorPorcao !== null && quadro.precoVenda !== null ? (
        <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          Por porção: custo de{" "}
          <span className="tabular">{valorEmReais(custoPorPorcao)}</span> e venda de{" "}
          <span className="tabular">{valorEmReais(quadro.precoVenda)}</span> —{" "}
          uma diferença de{" "}
          <span className="tabular">
            {valorEmReais(quadro.precoVenda - custoPorPorcao)}
          </span>{" "}
          por porção.
        </p>
      ) : null}
    </div>
  );
}

/** Uma lista em português: "a, b e c". Sem serial comma, que não é daqui. */
function listar(itens: readonly string[]): string {
  if (itens.length === 0) return "";
  if (itens.length === 1) return itens[0] ?? "";
  return `${itens.slice(0, -1).join(", ")} e ${itens[itens.length - 1]}`;
}

// ---------------------------------------------------------------------------
// Gaveta — editar rendimento
// ---------------------------------------------------------------------------

/**
 * O RENDIMENTO EM PORÇÕES — o campo que muda o custo POR PORÇÃO sem mudar o
 * custo total.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE CAMPO MERECE UMA AÇÃO PRÓPRIA                           │
 * │                                                                      │
 * │ Ele é o mais ajustado de todos, e o mais consequente: mexer nele muda   │
 * │ o número que vai para a ficha de custo do cliente, sem que nenhum       │
 * │ ingrediente tenha mudado. E é o campo que mais depende de uma medição   │
 * │ que só a cozinha tem — quantas porções o prato realmente rende,         │
 * │ contadas no passe.                                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function EditarRendimento({
  porcoes,
  porcaoGramas,
  totalAtual,
  aoSalvar,
}: {
  porcoes: number | null;
  porcaoGramas: number | null;
  totalAtual: number | null;
  aoSalvar: (dados: { porcoes: number | null; porcaoGramas: number | null }) => void;
}) {
  const gaveta = useGaveta();
  const [textoPorcoes, setTextoPorcoes] = useState(porcoes === null ? "" : String(porcoes));
  const [textoPorcao, setTextoPorcao] = useState(
    porcaoGramas === null ? "" : String(porcaoGramas)
  );

  function ler(texto: string): number | null {
    const limpo = texto.trim().replace(",", ".");
    if (limpo === "") return null;
    const n = Number(limpo);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const novasPorcoes = ler(textoPorcoes);
  const novaPorcao = ler(textoPorcao);

  function abrir() {
    setTextoPorcoes(porcoes === null ? "" : String(porcoes));
    setTextoPorcao(porcaoGramas === null ? "" : String(porcaoGramas));
    gaveta.abrir();
  }

  function salvar() {
    aoSalvar({ porcoes: novasPorcoes, porcaoGramas: novaPorcao });
    gaveta.fechar();
  }

  return (
    <>
      <Botao variante="secundario" tamanho="sm" onClick={abrir}>
        Editar rendimento
      </Botao>

      <Gaveta
        aberta={gaveta.aberta}
        aoFechar={gaveta.fechar}
        titulo="Rendimento e porção"
        descricao="Quantas porções este prato rende, e quanto pesa cada uma. São os dois números que transformam o custo total em custo por porção."
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={gaveta.fechar}>
              Cancelar
            </Botao>
            <Botao variante="primario" tamanho="sm" onClick={salvar}>
              Salvar rendimento
            </Botao>
          </>
        }
      >
        <div className="space-y-5">
          <Campo
            label="Quantas porções este prato rende"
            name="porcoes"
            inputMode="decimal"
            value={textoPorcoes}
            onChange={(e) => setTextoPorcoes(e.target.value)}
            placeholder="Ex.: 12"
            ajuda="O número que a produção declara. Enquanto estiver em branco, o custo por porção não é calculado."
          />

          <Campo
            label="Quanto pesa cada porção (g)"
            name="porcao"
            inputMode="decimal"
            value={textoPorcao}
            onChange={(e) => setTextoPorcao(e.target.value)}
            placeholder="Ex.: 320"
            ajuda="Pesado no passe, com a concha ou a porcionadeira padrão."
          />

          {/*
            O EFEITO DO CAMPO, AGORA.
            Sem isto, o único jeito de ver o que o rendimento fez no custo por
            porção seria fechar a gaveta e procurar o painel.
          */}
          <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-3.5">
            <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
              Com o que está digitado
            </p>
            {totalAtual === null ? (
              <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                O custo total da ficha ainda não está fechado — há linha fora da
                soma. O custo por porção só aparece quando todas entrarem:
                dividir um piso por {novasPorcoes ?? "doze"} daria um número
                menor do que o real, com cara de custo por porção.
              </p>
            ) : novasPorcoes === null ? (
              <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                Com o rendimento em branco, o sistema não divide o custo por
                porção de{" "}
                <strong className="font-semibold text-tinta">
                  {valorEmReais(totalAtual)}
                </strong>
                . Ele poderia supor uma porção, e supor seria inventar.
              </p>
            ) : (
              <>
                <p className="mt-1.5 font-display text-[1.375rem] text-tinta">
                  {valorEmReais(totalAtual / novasPorcoes)}
                  <span className="ml-1.5 font-texto text-[0.8125rem] font-normal text-[var(--tinta-suave)]">
                    por porção
                  </span>
                </p>
                <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                  <span className="tabular">{valorEmReais(totalAtual)}</span> ÷{" "}
                  <span className="tabular">{novasPorcoes}</span> porções. Uma
                  divisão — nenhuma regra de preço entrou aqui.
                </p>
              </>
            )}
          </div>

          <div className="rounded-[var(--raio)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.07)] px-4 py-3.5">
            <p className="text-[0.8125rem] font-semibold text-tinta">
              O rendimento muda nesta sessão; o banco ainda não guarda
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Ao salvar, o painel de custo passa a mostrar o custo por porção
              novo, e uma linha entra no histórico da ficha. Recarregar a página
              devolve o estado inicial.
            </p>
          </div>
        </div>
      </Gaveta>
    </>
  );
}

// ---------------------------------------------------------------------------
// Peças pequenas
// ---------------------------------------------------------------------------

function Passos({ passos }: { passos: readonly string[] }) {
  return (
    <ol className="space-y-3">
      {passos.map((passo, i) => (
        <li key={`${i}-${passo}`} className="flex gap-3">
          <span className="shrink-0 pt-0.5 text-[0.6875rem] font-semibold text-[var(--tinta-fraca)] tabular">
            {String(i + 1).padStart(2, "0")}
          </span>
          <span className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            {passo}
          </span>
        </li>
      ))}
    </ol>
  );
}

/**
 * A FICHA QUE NÃO EXISTE.
 *
 * Acontece com endereço antigo ou digitado à mão. Não é `notFound()` porque
 * este componente é de cliente — o cliente enxerga o cenário E a sessão, então
 * é ele que sabe dizer se a ficha existe.
 */
function NaoEncontrada() {
  return (
    <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.45)] px-6 py-10">
      <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
        Ficha não encontrada
      </p>
      <p className="mt-2 max-w-[60ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
        Esta ficha não está no acervo. Ela pode ter sido removida, ou o endereço
        pode estar incompleto.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <BotaoLink href="/fichas" variante="secundario" tamanho="sm">
          Ver o acervo de fichas
        </BotaoLink>
        <BotaoLink href="/ingredientes" variante="linha" tamanho="sm">
          Ver ingredientes
        </BotaoLink>
      </div>
    </div>
  );
}
