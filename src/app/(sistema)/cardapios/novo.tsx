"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao, CampoTexto } from "@/components/ui/campo";
import { Gaveta, useGaveta } from "@/components/ui/gaveta";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { cardapioVazio, criarCardapio, idDaSessao } from "@/lib/dados/demonstracao";
import type { ClienteOperacao } from "@/lib/dados";

/**
 * CRIAR UM CARDÁPIO — o ponto de partida de um menu.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE FORMULÁRIO PEDE, E POR QUE POUCO                          │
 * │                                                                      │
 * │ Nome, cliente, e uma descrição opcional. Não há seções, não há pratos,
 * │ e não há sugestão de nenhum dos dois: o cardápio nasce VAZIO de
 * │ propósito.
 * │                                                                      │
 * │ Um formulário que oferecesse "comece por Entradas, Pratos e
 * │ Sobremesas" estaria escrevendo a taxonomia da casa dela — e a decisão
 * │ de que a ficha não tem categorias fixas já foi tomada; o cardápio não
 * │ é o lugar de contrariá-la. As seções são criadas depois, com os nomes
 * │ que ela usa.
 * │                                                                      │
 * │ O CLIENTE é o único campo que não pode faltar, e não é burocracia: é  │
 * │ ele que amarra o cardápio às fichas do mesmo cliente. Sem cliente não │
 * │ há de onde tirar os pratos.
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function NovoCardapio({
  clientes,
  variante = "primario",
  tamanho = "sm",
  rotulo = "Novo cardápio",
}: {
  clientes: readonly ClienteOperacao[];
  variante?: "primario" | "secundario" | "linha" | "fantasma";
  tamanho?: "sm" | "md";
  rotulo?: string;
}) {
  const gaveta = useGaveta();
  useDemonstracao();

  const [nome, setNome] = useState("");
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [descricao, setDescricao] = useState("");
  const [criado, setCriado] = useState<string | null>(null);

  const nomeValido = nome.trim() !== "";
  const clienteValido = clienteId !== "";

  function limpar() {
    setNome("");
    setClienteId(clientes[0]?.id ?? "");
    setDescricao("");
    setCriado(null);
  }

  function fechar() {
    gaveta.fechar();
    limpar();
  }

  return (
    <>
      <Botao variante={variante} tamanho={tamanho} type="button" onClick={gaveta.abrir}>
        {rotulo}
      </Botao>

      <Gaveta
        aberta={gaveta.aberta}
        aoFechar={fechar}
        titulo="Novo cardápio"
        descricao="O cardápio nasce vazio. As seções e os pratos entram depois, dentro dele."
        acoes={
          criado ? (
            <Botao variante="secundario" tamanho="sm" type="button" onClick={fechar}>
              Fechar
            </Botao>
          ) : (
            <>
              <Botao variante="fantasma" tamanho="sm" type="button" onClick={fechar}>
                Cancelar
              </Botao>
              <Botao
                variante="primario"
                tamanho="sm"
                type="button"
                disabled={!nomeValido || !clienteValido}
                onClick={() => {
                  const novo = cardapioVazio({
                    id: idDaSessao("ca", nome),
                    clienteId,
                    consultoriaId: null,
                    nome: nome.trim(),
                    descricao: descricao.trim(),
                  });
                  criarCardapio(novo);
                  setCriado(novo.nome);
                }}
              >
                Criar cardápio
              </Botao>
            </>
          )
        }
      >
        {criado ? (
          /*
            ── O QUE ACONTECE DEPOIS DE CRIAR ──────────────────────────────
            A gaveta NÃO se fecha sozinha, e a lista NÃO navega: o cardápio
            criado não está gravado em lugar nenhum além desta sessão, e a
            frase diz exatamente isso. Fechar sozinha faria parecer que houve
            um salvamento que não houve.
          */
          <div className="space-y-3">
            <p className="text-[0.9375rem] text-tinta">
              <strong>{criado}</strong> foi criado e já aparece na lista, pronto para receber as
              seções e os pratos.
            </p>
            <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Ele está no estado desta sessão, não no banco: fechar o navegador o descarta. O
              banco ainda não está conectado, e nada aqui finge que está.
            </p>
          </div>
        ) : clientes.length === 0 ? (
          <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            Não há cliente cadastrado para receber um cardápio. Um cardápio pertence a um cliente —
            é dele que saem as fichas técnicas que entram no menu.
          </p>
        ) : (
          <div className="space-y-4">
            <Campo
              label="Nome do cardápio"
              obrigatorio
              ajuda='Como você chama este menu — "Menu de inverno", "Almoço executivo".'
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              name="nome-do-cardapio"
            />

            <CampoSelecao
              label="Cliente"
              obrigatorio
              ajuda="O cardápio só aceita fichas técnicas deste cliente."
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              name="cliente-do-cardapio"
              opcoes={[
                { valor: "", texto: "Escolha o cliente…" },
                ...clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia })),
              ]}
            />

            <CampoTexto
              label="Descrição"
              rows={3}
              ajuda="Opcional. Para quem é este cardápio e o que ele muda."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              name="descricao-do-cardapio"
            />
          </div>
        )}
      </Gaveta>
    </>
  );
}
