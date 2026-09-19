"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao, CampoTexto } from "@/components/ui/campo";
import { Gaveta, useGaveta } from "@/components/ui/gaveta";
import type { ClienteOperacao as Cliente, Ficha } from "@/lib/dados";
import type { CabecalhoDeFicha } from "@/lib/dados/demonstracao";

/**
 * OS DADOS DA FICHA — nome, categoria, cliente, observações e os passos.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE FORMULÁRIO EXISTE                                        │
 * │                                                                      │
 * │ A ficha tinha uma ação para o rendimento e nenhuma para o resto. O     │
 * │ nome do prato, a categoria, a observação e o modo de preparo só         │
 * │ existiam se tivessem vindo prontos do cadastro: corrigir um nome        │
 * │ errado exigia criar a ficha de novo, com os ingredientes e os pesos     │
 * │ todos por cima.                                                        │
 * │                                                                      │
 * │ E havia um campo INALCANÇÁVEL: `modoPreparo` e `finalizacao` só         │
 * │ aparecem na tela quando têm conteúdo. Uma ficha sem passos não tinha    │
 * │ como ganhá-los por lugar nenhum. Um campo que a tela esconde e o        │
 * │ cadastro não pede é um campo que não existe.                           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE FORMULÁRIO NÃO DEIXA EDITAR, E POR QUÊ                     │
 * │                                                                      │
 * │   · O HISTÓRICO. Cada linha é o registro de uma alteração que          │
 * │     aconteceu. Editá-la não seria corrigir um dado — seria reescrever  │
 * │     o passado, e o motivo de existir um histórico é poder olhar para   │
 * │     trás e ver o que foi feito. Corrigir erra-se para a frente, com    │
 * │     uma alteração nova, que deixa rastro.                              │
 * │                                                                      │
 * │   · O RESPONSÁVEL. Ele é lido da última linha do histórico — é quem    │
 * │     assinou. Transformá-lo em campo faria a assinatura deixar de ser   │
 * │     consequência da gravação e virar mais um texto que alguém digita.  │
 * │                                                                      │
 * │   · A DATA DE ATUALIZAÇÃO. Consequência da gravação, não campo.        │
 * │                                                                      │
 * │   · O CUSTO, O CMV E O MARKUP. São calculados a partir dos insumos e   │
 * │     dos pesos. Não são digitáveis em tela nenhuma, e oferecê-los aqui  │
 * │     criaria dois números discordando sobre o mesmo prato — o que        │
 * │     alguém digitou e o que a soma deu. Vale a soma.                    │
 * │                                                                      │
 * │   · A PRAÇA. O modelo da ficha não tem esse campo. Inventá-lo aqui     │
 * │     criaria um campo que nasce vazio em toda ficha e que ninguém sabe  │
 * │     validar. Ele entra quando a metodologia disser o que ele          │
 * │     significa — praça do salão, do buffet ou do delivery são três      │
 * │     coisas diferentes, e escolher uma pelo sistema seria decidir a      │
 * │     operação dela.                                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O CLIENTE MUDA O CUSTO, E O FORMULÁRIO DIZ ISSO              │
 * │                                                                      │
 * │ O preço de um insumo pode ser diferente por cliente — é a regra do     │
 * │ §6, e é o que faz a mesma ficha custar diferente em casas diferentes.  │
 * │ Trocar o cliente de uma ficha troca os PREÇOS que entram na conta: o   │
 * │ custo total se recalcula sozinho, e nenhum ingrediente foi mexido.     │
 * │                                                                      │
 * │ A alteração é permitida porque ela é real e acontece — ficha           │
 * │ cadastrada sob o cliente errado. Mas ela não pode ser silenciosa: o    │
 * │ campo abaixo diz, em uma frase, que os preços mudam junto.             │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Rascunho = {
  nome: string;
  categoria: string;
  clienteId: string;
  observacoes: string;
  modoPreparo: string;
  finalizacao: string;
};

function rascunhoDe(ficha: Ficha): Rascunho {
  return {
    nome: ficha.nome,
    categoria: ficha.categoria,
    clienteId: ficha.clienteId,
    observacoes: ficha.observacoes,
    modoPreparo: ficha.modoPreparo.join("\n"),
    finalizacao: ficha.finalizacao.join("\n"),
  };
}

/** Uma linha por passo. Linha vazia não é passo — é o Enter sobrando. */
function passosDoTexto(texto: string): string[] {
  return texto
    .split("\n")
    .map((linha) => linha.trim())
    .filter((linha) => linha !== "");
}

/**
 * AS OPÇÕES DE CLIENTE, SEM PERDER O QUE JÁ ESTAVA.
 *
 * Mesmo cuidado do seletor de unidade do insumo, e aqui a consequência é pior:
 * um `<select>` cujo valor não está entre as opções abre na PRIMEIRA delas, e
 * salvar um campo qualquer — a categoria, por exemplo — mudaria o cliente da
 * ficha sem ninguém ter pedido. Como o cliente define os preços que entram na
 * conta, o custo sairia diferente e a causa estaria numa tela que ela nem
 * abriu para isso.
 *
 * Por isso o cliente de hoje entra na lista quando não está nela.
 */
function clientesOferecidos(
  clientes: readonly Cliente[],
  clienteIdAtual: string
): ReadonlyArray<{ valor: string; texto: string }> {
  const opcoes = clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia }));

  if (clienteIdAtual === "" || opcoes.some((o) => o.valor === clienteIdAtual)) {
    if (opcoes.length === 0) {
      return [{ valor: "", texto: "nenhum cliente cadastrado" }];
    }
    return opcoes;
  }

  return [{ valor: clienteIdAtual, texto: "cliente de hoje (não está na lista)" }, ...opcoes];
}

export function IdentidadeDaFicha({
  ficha,
  clientes,
  aoSalvar,
}: {
  ficha: Ficha;
  clientes: readonly Cliente[];
  /** Grava o cabeçalho e assina a alteração no histórico da ficha. */
  aoSalvar: (alteracao: CabecalhoDeFicha, oQue: string) => void;
}) {
  const gaveta = useGaveta();
  const [rascunho, setRascunho] = useState<Rascunho>(() => rascunhoDe(ficha));

  const passos = passosDoTexto(rascunho.modoPreparo);
  const finalizacao = passosDoTexto(rascunho.finalizacao);
  const trocouDeCliente = rascunho.clienteId !== ficha.clienteId;

  function abrir() {
    /*
      Abre com o que está lá. O mesmo motivo de sempre: campo em branco sobre
      dado existente convida a redigitar, e redigitar "Escondidinho de
      mandioca" é como ele perde o acento ou o "de".
    */
    setRascunho(rascunhoDe(ficha));
    gaveta.abrir();
  }

  function salvar() {
    const nome = rascunho.nome.trim();
    if (nome === "") return;

    const categoria = rascunho.categoria.trim();

    /*
      O QUE MUDOU VAI PARA O HISTÓRICO, NOMEADO.

      Uma linha "Ficha alterada" não serviria para nada: daqui a três meses
      ela abriria a ficha, veria que algo mudou e não saberia o quê. As frases
      abaixo são montadas a partir da COMPARAÇÃO com o que estava gravado —
      então elas dizem o que realmente mudou, e não o que o formulário teve
      oportunidade de mudar.
    */
    const mudancas: string[] = [];
    if (nome !== ficha.nome) mudancas.push(`nome para "${nome}"`);
    if (categoria !== ficha.categoria) mudancas.push(`categoria para "${categoria}"`);
    if (trocouDeCliente) {
      const destino = clientes.find((c) => c.id === rascunho.clienteId);
      mudancas.push(`cliente para ${destino?.nomeFantasia ?? "outro"}`);
    }
    if (rascunho.observacoes.trim() !== ficha.observacoes.trim()) {
      mudancas.push("observações");
    }
    if (passos.join("\n") !== ficha.modoPreparo.join("\n")) {
      mudancas.push(`modo de preparo (${passos.length} ${
        passos.length === 1 ? "passo" : "passos"
      })`);
    }
    if (finalizacao.join("\n") !== ficha.finalizacao.join("\n")) {
      mudancas.push(`finalização (${finalizacao.length} ${
        finalizacao.length === 1 ? "passo" : "passos"
      })`);
    }

    aoSalvar(
      {
        nome,
        categoria,
        clienteId: rascunho.clienteId,
        observacoes: rascunho.observacoes,
        modoPreparo: passos,
        finalizacao,
      },
      mudancas.length === 0
        ? "Ficha reaberta e salva sem alteração."
        : `Ficha alterada: ${mudancas.join(", ")}.`
    );
    gaveta.fechar();
  }

  return (
    <>
      <Botao variante="secundario" tamanho="sm" onClick={abrir}>
        Editar ficha
      </Botao>

      <Gaveta
        aberta={gaveta.aberta}
        aoFechar={gaveta.fechar}
        titulo="Editar ficha"
        descricao={`${ficha.nome}. O nome do prato, a categoria, o cliente, as observações e os passos do preparo.`}
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={gaveta.fechar}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              tamanho="sm"
              disabled={rascunho.nome.trim() === ""}
              onClick={salvar}
            >
              Salvar ficha
            </Botao>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              label="Nome do prato"
              name="nome"
              value={rascunho.nome}
              onChange={(e) => setRascunho((r) => ({ ...r, nome: e.target.value }))}
              placeholder="Ex.: Escondidinho de mandioca"
              obrigatorio
              ajuda="Como o prato é chamado no cardápio e na ficha de custo."
            />
            <Campo
              label="Categoria"
              name="categoria"
              value={rascunho.categoria}
              onChange={(e) => setRascunho((r) => ({ ...r, categoria: e.target.value }))}
              placeholder="Ex.: Prato principal"
              ajuda="O grupo em que ele entra no acervo."
            />
          </div>

          <CampoSelecao
            label="Cliente"
            name="cliente"
            value={rascunho.clienteId}
            onChange={(e) => setRascunho((r) => ({ ...r, clienteId: e.target.value }))}
            opcoes={clientesOferecidos(clientes, ficha.clienteId)}
            ajuda="De quem é esta ficha. O preço de um insumo pode ser diferente por cliente."
          />

          {trocouDeCliente ? (
            /*
              O AVISO SÓ APARECE QUANDO ELA MEXEU NO CAMPO.
              Deixá-lo fixo embaixo do seletor faria dele paisagem — e um aviso
              que todo mundo já viu mil vezes é um aviso que ninguém lê no dia
              em que ele importa.
            */
            <div className="rounded-[var(--raio)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.07)] px-4 py-3.5">
              <p className="text-[0.8125rem] font-semibold text-tinta">
                Trocar o cliente troca os preços que entram na conta
              </p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                Cada cliente pode ter preço próprio de insumo. Ao salvar, as linhas
                da composição passam a ser resolvidas com os preços do cliente novo,
                e o custo total se recalcula sozinho — nenhum ingrediente foi
                mexido. Se o preço do cliente novo não existir para um insumo, a
                linha passa a usar o preço da biblioteca, e o painel diz isso.
              </p>
            </div>
          ) : null}

          <CampoTexto
            label="Observações"
            name="observacoes"
            rows={4}
            value={rascunho.observacoes}
            onChange={(e) => setRascunho((r) => ({ ...r, observacoes: e.target.value }))}
            placeholder="O contexto desta ficha: como os números foram obtidos, o que muda entre turnos, o que ela pediu para não esquecer."
          />

          <CampoTexto
            label="Modo de preparo"
            name="modoPreparo"
            rows={6}
            value={rascunho.modoPreparo}
            onChange={(e) => setRascunho((r) => ({ ...r, modoPreparo: e.target.value }))}
            placeholder={"Um passo por linha.\nEx.: Descascar a mandioca e pesar o limpo.\nEx.: Cozinhar até desmanchar e pesar de novo."}
            ajuda="Um passo por linha. Linha em branco não conta como passo."
          />

          {/*
            A CONTAGEM É A LEITURA DE VOLTA.
            Sem ela, a única forma de saber se o texto foi entendido como seis
            passos ou como um parágrafo único seria salvar e olhar a ficha.
          */}
          <p className="-mt-3 text-[0.75rem] text-[var(--tinta-fraca)]">
            {passos.length === 0
              ? "Nenhum passo — a seção de preparo não aparece na ficha."
              : `${passos.length} ${passos.length === 1 ? "passo" : "passos"} serão gravados.`}
          </p>

          <CampoTexto
            label="Finalização"
            name="finalizacao"
            rows={4}
            value={rascunho.finalizacao}
            onChange={(e) => setRascunho((r) => ({ ...r, finalizacao: e.target.value }))}
            placeholder={"Um passo por linha.\nEx.: Montar na travessa e passar a mussarela."}
            ajuda="O que se faz depois que o prato está pronto. Um passo por linha."
          />

          <p className="-mt-3 text-[0.75rem] text-[var(--tinta-fraca)]">
            {finalizacao.length === 0
              ? "Nenhum passo — a seção de finalização não aparece na ficha."
              : `${finalizacao.length} ${
                  finalizacao.length === 1 ? "passo" : "passos"
                } serão gravados.`}
          </p>

          <div className="rounded-[var(--raio)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.07)] px-4 py-3.5">
            <p className="text-[0.8125rem] font-semibold text-tinta">
              A ficha muda nesta sessão; o banco ainda não guarda
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Ao salvar, a ficha passa a mostrar os dados novos e uma linha entra no
              histórico dela, dizendo o que mudou. Essa linha, o responsável e a data
              não se editam: são registro do que aconteceu. Recarregar a página
              devolve o estado inicial.
            </p>
          </div>
        </div>
      </Gaveta>
    </>
  );
}
