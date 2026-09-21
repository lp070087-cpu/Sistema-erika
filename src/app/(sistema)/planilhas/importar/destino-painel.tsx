"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Botao } from "@/components/ui/botao";
import { Gaveta } from "@/components/ui/gaveta";
import { Campo } from "@/components/ui/campo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso } from "@/components/ui/superficie";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { cn } from "@/lib/utils/cn";
import { FaixaDeAcao, useAvisoDeAcao } from "@/components/ui/aviso-acao";
import { ASSINATURA_DA_SESSAO, cadastrarIngrediente, criarFicha, idDaSessao } from "@/lib/dados/demonstracao";
import type { Ficha } from "@/lib/dados";
import {
  cabecalhoDaFicha,
  contarInsumos,
  DESTINOS,
  destinoDe,
  insumosDaLinha,
  itensDaImportacao,
  vereditoDoDestino,
  type IdDoDestino,
  type InsumoDaImportacao,
  type RecusaDeInsumo,
} from "@/lib/planilhas/importacao/destino";
import type { AjustesDaLinha, AjustesDoCabecalho } from "@/lib/planilhas/importacao/para-ficha";
import type { Conferencia } from "@/lib/planilhas/importacao/validar";

/**
 * O DESTINO — a última etapa da esteira, e a única que grava.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA PEÇA FAZ, E O QUE ELA DELIBERADAMENTE NÃO FAZ             │
 * │                                                                      │
 * │ FAZ: ela escolhe entre os três destinos, mostra O QUE VAI ENTRAR, e   │
 * │ só grava quando a Érika manda.                                        │
 * │                                                                      │
 * │ NÃO FAZ: não julga uma linha sequer. Todo o julgamento — nome,        │
 * │ ambiguidade, aviso grave — já aconteceu na conferência e nas funções   │
 * │ puras de `destino.ts`. Aqui só se lê o resultado e se escreve o que    │
 * │ passou.                                                                │
 * │                                                                      │
 * │ A razão de separar assim é a mesma que sustenta a Central: uma tela    │
 * │ que recalcula por conta própria é uma tela que pode discordar do       │
 * │ motor — e discordar em silêncio.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ "ADICIONAR A INGREDIENTES" E "CRIAR FICHA" NÃO SÃO O MESMO BOTÃO      │
 * │                                                                      │
 * │ Os dois usam as mesmas linhas conferidas, e a diferença é o que cada   │
 * │ um DEIXA:                                                             │
 * │                                                                      │
 * │   INGREDIENTES escreve na BIBLIOTECA. O efeito é permanente dentro da  │
 * │   sessão e serve a qualquer ficha, de qualquer cliente — é o cadastro  │
 * │   do insumo, com a compra e as pesagens.                               │
 * │                                                                      │
 * │   FICHA escreve uma ficha NOVA, com os itens apontando para os insumos │
 * │   da biblioteca. Ela não cria insumo nenhum.                           │
 * │                                                                      │
 * │ A consequência prática importa e a tela diz: criar a ficha a partir de │
 * │ um documento não cadastra os insumos dele. Quem quer as duas coisas    │
 * │ faz as duas — e é por isso que a tela oferece "fazer os dois" em vez    │
 * │ de esconder a escolha numa frase que ninguém lê.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function PainelDoDestino({
  conferencia,
  ajustesDaLinha,
  ajustesDoCabecalho,
  nomeCliente,
  clienteId,
  destinoInicial,
  aoGerarPlanilha,
}: {
  conferencia: Conferencia;
  ajustesDaLinha: Readonly<Record<number, AjustesDaLinha>>;
  ajustesDoCabecalho: AjustesDoCabecalho;
  nomeCliente: string | null;
  /** O cliente da URL. `""` quando a importação não foi vinculada a nenhum. */
  clienteId: string;
  /** `?destino=` já validado pela página. */
  destinoInicial: IdDoDestino;
  /** Liga o botão GERAR PLANILHA do destino de mesmo nome, na janela. */
  aoGerarPlanilha: () => void;
}) {
  const router = useRouter();
  useDemonstracao();

  const [destino, definirDestino] = useState<IdDoDestino>(destinoInicial);
  const [nomeDoPrato, definirNomeDoPrato] = useState("");
  const [aberta, definirAberta] = useState(false);

  /*
    O AVISO DE AÇÃO ENTROU AQUI PORQUE AQUI HÁ UMA GRAVAÇÃO DE VERDADE.

    O briefing pede retorno visual para as ações, e esta é a única ação da
    esteira que escreve em outra tela: ela cadastra insumos na biblioteca e
    cria fichas que vão aparecer em /fichas. A faixa diz o que foi feito e
    para onde ir — em vez de a tela simplesmente mudar sem explicação.
  */
  const acao = useAvisoDeAcao();

  /* ── O QUE VAI ENTRAR ─────────────────────────────────────────────────── */

  const insumos: readonly InsumoDaImportacao[] = useMemo(
    () => insumosDaLinha(conferencia, ajustesDaLinha),
    [conferencia, ajustesDaLinha]
  );

  const itens = useMemo(() => itensDaImportacao(insumos), [insumos]);

  const cabecalho = useMemo(
    () => cabecalhoDaFicha(conferencia, ajustesDoCabecalho),
    [conferencia, ajustesDoCabecalho]
  );

  const contagem = useMemo(() => contarInsumos(insumos), [insumos]);

  /*
    O NOME DO PRATO NASCE DO DOCUMENTO — e continua editável.

    Ele começa com o que o cabeçalho do PDF dizia, quando dizia alguma coisa
    de útil. Sem título no documento, o campo fica vazio e o destino FICHA
    fica bloqueado com a explicação — ver `vereditoDoDestino`. Inventar um
    nome aqui seria gravar na lista um prato que ninguém nomeou.
  */
  const [nomeTravado, definirNomeTravado] = useState(false);
  const nomeParaVeredito = nomeTravado ? nomeDoPrato : (nomeDoPrato || cabecalho.nome);

  const veredito = useMemo(
    () =>
      vereditoDoDestino(destino, {
        conferencia,
        insumos,
        nomeDaFicha: nomeParaVeredito,
      }),
    [destino, conferencia, insumos, nomeParaVeredito]
  );

  /* ── AS AÇÕES ─────────────────────────────────────────────────────────── */

  function adicionarIngredientes(): number {
    const aceitos = insumos.filter((i) => i.ingrediente !== null);
    for (const entrada of aceitos) {
      /*
        `cadastrarIngrediente` avisa o store a cada chamada — e é ele que faz
        a biblioteca e a busca global se repintarem. Uma escrita por insumo,
        e não uma lista de uma vez, porque é esta a interface que o store tem
        hoje; o custo é um render por item, e a alternativa exigiria uma
        função nova só para este caminho.
      */
      cadastrarIngrediente(entrada.ingrediente as NonNullable<typeof entrada.ingrediente>);
    }
    return aceitos.length;
  }

  function criarFichaDoDocumento(): Ficha {
    const agora = new Date();
    const nome = nomeParaVeredito.trim();

    const ficha: Ficha = {
      id: idDaSessao("fi", nome),
      clienteId,
      nome,
      categoria: cabecalho.categoria || "Importada",
      rendimentoPorcoes: cabecalho.rendimentoPorcoes,
      porcaoGramas: cabecalho.porcaoGramas,
      itens: itens.map((i) => i.item),
      modoPreparo: [],
      finalizacao: [],
      observacoes: "",
      /*
        NASCE EM REVISÃO, como toda ficha nova.

        Ela foi criada a partir de um documento, e o documento não sabe se as
        quantidades são do peso de compra ou do preparado — `itemDaLinha`
        declara COMPRA porque é o único peso que o papel afirmou. Quem sabe
        disso é a Érika, olhando a ficha. Marcar COMPLETA aqui seria afirmar
        que alguém conferiu.
      */
      situacao: "EM_REVISAO",
      situacaoCalculo: "AGUARDANDO_DADOS",
      atualizadaEm: agora,
      historico: [
        {
          em: agora,
          oQue: `Ficha criada a partir de um documento importado, com ${itens.length} ${
            itens.length === 1 ? "ingrediente" : "ingredientes"
          }.`,
          quem: ASSINATURA_DA_SESSAO,
        },
      ],
    };

    criarFicha(ficha);
    return ficha;
  }

  function confirmar() {
    if (destino === "planilha") {
      /* A planilha não grava nada — ela continua sendo a etapa 4 da janela. */
      definirAberta(false);
      aoGerarPlanilha();
      return;
    }

    if (destino === "ingredientes") {
      const quantos = adicionarIngredientes();
      definirAberta(false);
      acao.anunciar(
        quantos === 1
          ? "1 insumo entrou na biblioteca de ingredientes."
          : `${quantos} insumos entraram na biblioteca de ingredientes.`
      );
      router.push("/ingredientes");
      return;
    }

    /* Os dois de uma vez: a biblioteca primeiro, porque a ficha aponta para ela. */
    adicionarIngredientes();
    const ficha = criarFichaDoDocumento();
    definirAberta(false);
    acao.anunciar(`Ficha "${ficha.nome}" criada, com ${ficha.itens.length} ingredientes.`);
    router.push(`/fichas/${ficha.id}`);
  }

  /* ── A TELA ───────────────────────────────────────────────────────────── */

  const escolhido = destinoDe(destino);

  return (
    <section className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
          Destino da importação
        </p>
        <p className="text-[0.8125rem] text-[var(--tinta-suave)]">
          A conferência acima é preservada em qualquer um dos três. Nada foi gravado ainda.
        </p>
      </div>

      {/*
        AS TRÊS OPÇÕES SÃO RADIO DE VERDADE, E NÃO TRÊS BOTÕES.

        `role="radio"` com `aria-checked` faz o leitor de tela anunciar "2 de 3,
        selecionado" — o que três botões iguais não fazem. E o teclado anda
        entre elas com as setas, como em qualquer grupo de rádio.
      */}
      <div role="radiogroup" aria-label="Escolha o destino" className="mt-3 grid gap-2 md:grid-cols-3">
        {DESTINOS.map((opcao) => {
          const ativa = opcao.id === destino;
          return (
            <button
              key={opcao.id}
              type="button"
              role="radio"
              aria-checked={ativa}
              onClick={() => definirDestino(opcao.id)}
              className={cn(
                "rounded-[var(--raio)] border px-3.5 py-3 text-left transition-colors duration-150",
                ativa
                  ? "border-oliva bg-[rgba(107,122,70,0.09)]"
                  : "border-[var(--linha)] hover:border-[var(--linha-forte)] hover:bg-[rgba(29,82,54,0.04)]"
              )}
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn(
                    "grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border",
                    ativa ? "border-oliva" : "border-[var(--linha-forte)]"
                  )}
                >
                  {ativa ? <span className="h-1.5 w-1.5 rounded-full bg-oliva" /> : null}
                </span>
                <span className="text-[0.875rem] font-medium text-tinta">{opcao.rotulo}</span>
              </span>
              <span className="mt-1.5 block text-[0.75rem] leading-snug text-[var(--tinta-suave)]">
                {opcao.descricao}
              </span>
            </button>
          );
        })}
      </div>

      {/*
        A CONTAGEM DO QUE VAI ENTRAR, SEMPRE VISÍVEL.

        Ela é a resposta à pergunta que a recusa provoca — "quantas linhas eu
        perdi?" — e é por isso que ela fica aqui e não dentro da gaveta: quem
        conferiu 38 linhas precisa saber que 34 passaram ANTES de escolher o
        destino, e não depois de já ter clicado.
      */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Etiqueta tom={contagem.recusados === 0 ? "verde" : "dourado"}>
          {contagem.aceitos === 1 ? "1 linha pronta" : `${contagem.aceitos} linhas prontas`}
        </Etiqueta>
        {contagem.recusados > 0 ? (
          <Etiqueta tom="dourado">
            {contagem.recusados === 1
              ? "1 linha fora da conta"
              : `${contagem.recusados} linhas fora da conta`}
          </Etiqueta>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[var(--linha)] pt-4">
        <Botao
          variante="primario"
          tamanho="md"
          disabled={!veredito.pode}
          onClick={() => {
            if (destino === "planilha") confirmar();
            else definirAberta(true);
          }}
        >
          {escolhido?.verbo ?? "Seguir"}
        </Botao>

        {/*
          O BOTÃO APAGADO DIZ POR QUE ESTÁ APAGADO — a mesma regra da barra de
          formatação e do GERAR PLANILHA da janela.
        */}
        <p className="text-[0.8125rem] text-[var(--tinta-suave)]">
          {veredito.pode ? textoDeApoio(destino, contagem.aceitos, nomeCliente) : veredito.motivo}
        </p>
      </div>

      {/*
        A FAIXA DE AÇÃO FICA DENTRO DO PAINEL, e não no topo da página: a ação
        acontece aqui, e um aviso longe de onde o clique foi obriga a pessoa a
        procurá-lo. É a mesma razão da faixa de comando da planilha — ver o
        bloco "por que não um toast" em `aviso-acao.tsx`.
      */}
      <FaixaDeAcao aviso={acao.aviso} aoFechar={acao.dispensar} className="mt-3" />

      <Gaveta
        aberta={aberta}
        aoFechar={() => definirAberta(false)}
        titulo={escolhido?.rotulo ?? "Destino"}
        descricao="Confira o que vai ser gravado. Nada entra sem esta confirmação."
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={() => definirAberta(false)}>
              Cancelar
            </Botao>
            <Botao variante="primario" tamanho="sm" onClick={confirmar} disabled={!veredito.pode}>
              Confirmar
            </Botao>
          </>
        }
      >
        <div className="space-y-5">
          {destino === "ficha" ? (
            <Campo
              label="Nome do prato"
              name="nomeDoPrato"
              value={nomeParaVeredito}
              onChange={(e) => {
                definirNomeTravado(true);
                definirNomeDoPrato(e.target.value);
              }}
              placeholder="Ex.: Escondidinho de carne seca"
              obrigatorio
              ajuda="É por este nome que a ficha aparece na lista."
            />
          ) : null}

          <dl className="divide-y divide-[var(--linha)] rounded-[var(--raio)] border border-[var(--linha)] px-4 py-2">
            <Linha rotulo="Linhas conferidas" valor={String(conferencia.linhas.length)} />
            <Linha
              rotulo={destino === "planilha" ? "Linhas na grade" : "Linhas que entram"}
              valor={String(contagem.aceitos)}
            />
            {destino === "ficha" ? (
              <>
                <Linha rotulo="Cliente" valor={nomeCliente ?? "sem cliente vinculado"} />
                <Linha
                  rotulo="Rendimento"
                  valor={
                    cabecalho.rendimentoPorcoes === null
                      ? "não informado"
                      : `${cabecalho.rendimentoPorcoes} porções`
                  }
                />
              </>
            ) : null}
            {destino === "ingredientes" ? (
              <Linha
                rotulo="Unidade de compra"
                valor="a que cada linha trouxe, ou nenhuma"
              />
            ) : null}
          </dl>

          {/*
            O QUE FICOU DE FORA — com o motivo de cada uma.

            Sem esta lista, o destino gravaria 34 de 38 linhas e a tela mudaria
            de página. As quatro sumiriam, e a única forma de descobrir seria
            voltar e contar. O briefing foi explícito sobre dado ambíguo não
            virar verdade automaticamente — e uma linha que evapora sem aviso
            é a mesma coisa ao contrário.
          */}
          {contagem.recusados > 0 ? (
            <Aviso tom="atencao" titulo="Estas linhas não entram">
              <ul className="space-y-2">
                {insumos
                  .filter((i) => i.recusa !== null)
                  .map((i) => (
                    <li key={i.linha.ordem} className="text-[0.8125rem] leading-relaxed">
                      <span className="font-medium tabular">
                        Linha {i.linha.ordem}
                      </span>
                      {i.linha.descricao ? <> — {i.linha.descricao}</> : null}
                      <span className="block text-[var(--tinta-fraca)]">
                        {fraseDaRecusa(i.recusa as RecusaDeInsumo)}
                      </span>
                    </li>
                  ))}
              </ul>
              <p className="mt-3">
                Elas continuam na conferência, do jeito que você deixou. Corrija lá e volte
                a este passo — a lista de cima se atualiza sozinha.
              </p>
            </Aviso>
          ) : null}

          {destino === "ficha" && itens.length > 0 ? (
            <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-3.5">
              <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                A ficha vai nascer em revisão, com os itens apontando para a biblioteca de
                ingredientes. Ela <strong className="font-semibold">não cadastra</strong> os
                insumos que ainda não estão lá — para isso, escolha “Adicionar a ingredientes”
                e depois volte para criar a ficha.
              </p>
            </div>
          ) : null}
        </div>
      </Gaveta>
    </section>
  );
}

/* ------------------------------------------------------------------------ *
 * Peças pequenas
 * ------------------------------------------------------------------------ */

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5">
      <dt className="text-[0.8125rem] text-[var(--tinta-suave)]">{rotulo}</dt>
      <dd className="text-right text-[0.875rem] text-tinta">{valor}</dd>
    </div>
  );
}

/** O motivo da recusa, na palavra dela. */
function fraseDaRecusa(recusa: RecusaDeInsumo): string {
  if (recusa.motivo === "SEM_NOME") {
    return "A linha não tem nome de insumo. Sem nome não há o que cadastrar — dê um nome a ela na conferência.";
  }
  if (recusa.motivo === "AMBIGUA") {
    return `${recusa.detalhe} Corrija o texto na conferência para o sistema saber qual dos dois números vale.`;
  }
  return `${recusa.detalhe} Resolva na conferência: enquanto isso, ela fica fora da conta.`;
}

/** O texto ao lado do botão quando ele está aceso. */
function textoDeApoio(destino: IdDoDestino, aceitos: number, nomeCliente: string | null): string {
  const quantos = aceitos === 1 ? "1 insumo" : `${aceitos} insumos`;
  if (destino === "planilha") {
    return "A grade abre na próxima etapa desta janela. Nada é baixado sem você mandar.";
  }
  if (destino === "ingredientes") {
    return `${quantos} entram na biblioteca, com a compra e as pesagens que o documento trouxe.`;
  }
  return `A ficha é criada com ${quantos} como itens${
    nomeCliente ? ` e vinculada a ${nomeCliente}` : " e sem cliente vinculado"
  }.`;
}

/* ------------------------------------------------------------------------ *
 * Nota sobre o aviso de ação
 * ------------------------------------------------------------------------ *
 *
 * O retorno desta gravação usa `FaixaDeAcao` — o mesmo componente da Central,
 * e não um desenho novo. Ele já resolve as três decisões que este caso também
 * exige (ver `aviso-acao.tsx`): a faixa mora no fluxo em vez de flutuar, o
 * sucesso some sozinho em cinco segundos e o erro fica até ser lido, e o
 * `role` muda de `status` para `alert` conforme o tom.
 *
 * A única diferença de uso é o tempo de vida: aqui a gravação termina em uma
 * navegação para outra tela, então a faixa de sucesso quase não é vista. Ela
 * continua valendo para o caso em que a navegação demora, e é o mesmo caminho
 * de quem já conhece o componente — um segundo desenho só para esta tela
 * seria mais código para divergir depois.
 */
