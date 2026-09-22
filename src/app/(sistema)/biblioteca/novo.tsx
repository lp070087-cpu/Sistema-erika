"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao, CampoTexto } from "@/components/ui/campo";import { Gaveta, useGaveta } from "@/components/ui/gaveta";
import { Aviso } from "@/components/ui/superficie";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { criarMaterial, idDaSessao } from "@/lib/dados/demonstracao";
import { ORDEM_MATERIAL, ROTULO_MATERIAL } from "@/lib/dados";
import type { ClienteOperacao, TipoDeMaterial } from "@/lib/dados";

/**
 * NOVO MATERIAL — o registro de um material que já existe.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA GAVETA PEDE, E O QUE ELA NÃO PEDE                          │
 * │                                                                      │
 * │ Pede o REGISTRO: título, tipo, para que serve, a quem vale e onde o    │
 * │ material está.                                                       │
 * │                                                                      │
 * │ NÃO pede o material. Não há campo de arquivo, não há upload, não há    │
 * │ "anexar", não há "colar o conteúdo aqui". E a ausência é a decisão     │
 * │ mais importante do módulo — ver o cabeçalho de `@/lib/dados/          │
 * │ biblioteca`.                                                          │
 * │                                                                      │
 * │ Se ela colasse o conteúdo num campo, o conteúdo viveria em memória e   │
 * │ sumiria ao recarregar. Ela teria escrito um guia inteiro que não       │
 * │ existe mais. O sistema endereça; não hospeda.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ "PARA QUE SERVE" É O CAMPO QUE IMPORTA, E POR ISSO ELE É AJUDADO      │
 * │                                                                      │
 * │ O título diz o que o material é ("Guia de limpeza da cozinha"). Ele    │
 * │ não diz quando usar. Numa consultoria com o cliente do lado, ela       │
 * │ procura "o que eu mostro para resolver isto?" — e a pergunta que ela   │
 * │ tem na cabeça é uma SITUAÇÃO, não um nome de arquivo.                  │
 * │                                                                      │
 * │ Por isso ele vem DEPOIS do título mas com a ajuda mais longa, e a      │
 * │ ajuda dá o formato: "quando...". É por este campo que a busca acha, e   │
 * │ é ele que a lista mostra antes do título.                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function NovoMaterial({ clientes }: { clientes: readonly ClienteOperacao[] }) {
  const gaveta = useGaveta();
  useDemonstracao();

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoDeMaterial>("LIMPEZA");
  const [servePara, setServePara] = useState("");
  const [onde, setOnde] = useState("");
  const [clientesEscolhidos, setClientesEscolhidos] = useState<string[]>([]);
  const [criado, setCriado] = useState<string | null>(null);

  const tituloLimpo = titulo.trim();
  const valido = tituloLimpo !== "";

  function limpar() {
    setTitulo("");
    setTipo("LIMPEZA");
    setServePara("");
    setOnde("");
    setClientesEscolhidos([]);
    setCriado(null);
  }

  function fecharELimpar() {
    limpar();
    gaveta.fechar();
  }

  function alternarCliente(id: string) {
    setClientesEscolhidos((atual) =>
      atual.includes(id) ? atual.filter((c) => c !== id) : [...atual, id]
    );
  }

  function criar() {
    if (!valido) return;

    criarMaterial({
      id: idDaSessao("bi", tituloLimpo),
      titulo: tituloLimpo,
      tipo,
      servePara: servePara.trim(),
      onde: onde.trim(),
      /*
        Lista vazia é GERAL, e é o caso comum: um guia de limpeza não é de um
        restaurante só. A tela diz isso no lugar de deixar a lista vazia
        parecer um cadastro incompleto.
      */
      clientes: clientesEscolhidos,
      /*
        Sem origens no cadastro novo. A ligação com ingrediente, ficha ou
        processo é declarada na ficha do material, depois — e ali ela pode
        escolher de uma lista, que é melhor do que digitar um nome que talvez
        não exista.
      */
      origens: [],
      atualizadoEm: new Date(),
    });

    setCriado(tituloLimpo);
    setTitulo("");
    setServePara("");
    setOnde("");
    setClientesEscolhidos([]);
  }

  return (
    <>
      <Botao variante="secundario" onClick={gaveta.abrir}>
        Registrar material
      </Botao>

      <Gaveta
        aberta={gaveta.aberta}
        aoFechar={fecharELimpar}
        titulo="Registrar material"
        descricao="O material continua onde você já o mantém. Aqui entra só o registro e o endereço — o sistema não guarda o arquivo."
      >
        <div className="space-y-5">
          {criado !== null ? (
            <Aviso tom="sucesso" titulo={`“${criado}” registrado`}>
              O registro entrou no acervo desta sessão. O endereço pode ficar em branco — se você
              ainda não sabe onde o material está, ele aparece na lista dos que não têm endereço, e
              não como erro.
            </Aviso>
          ) : null}

          {/*
            ── `Campo` PARA UMA LINHA, `CampoTexto` PARA O QUE NÃO CABE ────
            `Campo` é um `<input>`; `CampoTexto` é um `<textarea>` com a MESMA
            moldura. Deixar "para que serve" e "onde está" no `Campo` faria o
            texto rolar de lado dentro de uma caixa de uma linha — e é
            justamente nesses dois que ela escreve mais de uma frase.
          */}
          <Campo
            label="Título"
            obrigatorio
            ajuda="Como você chama este material. É o que aparece na lista."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            name="titulo-do-material"
            placeholder="Guia de limpeza da cozinha"
          />

          <CampoSelecao
            label="Tipo"
            obrigatorio
            ajuda="É por ele que a lista agrupa."
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoDeMaterial)}
            name="tipo-do-material"
            opcoes={ORDEM_MATERIAL.map((t) => ({ valor: t, texto: ROTULO_MATERIAL[t] }))}
          />

          <CampoTexto
            label="Para que serve"
            rows={3}
            ajuda="A situação que este material responde, escrita como ela aparece no dia: “quando a equipe não sabe a ordem da limpeza pesada”. É por aqui que a busca encontra — o título sozinho não acha."
            value={servePara}
            onChange={(e) => setServePara(e.target.value)}
            name="serve-para-do-material"
            placeholder="Quando a equipe não sabe a ordem da limpeza pesada"
          />

          <CampoTexto
            label="Onde está"
            rows={2}
            ajuda="O link do Drive, o nome da pasta, onde no caderno — ou em branco. Em branco não é erro: é o material que existe e ainda não foi endereçado aqui."
            value={onde}
            onChange={(e) => setOnde(e.target.value)}
            name="onde-esta-o-material"
            placeholder="https://drive.google.com/… ou “caderno de campo, p. 12”"
          />

          <div>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Vale para
            </p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
              Nenhum marcado significa GERAL — serve a qualquer cliente, e é o caso comum de um
              guia de limpeza. Marque clientes só quando o material for daquele restaurante.
            </p>

            {clientes.length === 0 ? (
              <p className="mt-3 text-[0.8125rem] text-[var(--tinta-fraca)]">
                Não há clientes na carteira.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {clientes.map((c) => (
                  <li key={c.id} className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      id={`mat-cli-${c.id}`}
                      checked={clientesEscolhidos.includes(c.id)}
                      onChange={() => alternarCliente(c.id)}
                      className="size-4 rounded border-[var(--linha-forte)]"
                    />
                    <label
                      htmlFor={`mat-cli-${c.id}`}
                      className="text-[0.875rem] text-[var(--tinta-suave)]"
                    >
                      {c.nomeFantasia}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex gap-3 pt-1">
            <Botao variante="primario" onClick={criar} disabled={!valido}>
              Registrar
            </Botao>
            <Botao variante="linha" onClick={fecharELimpar}>
              Fechar
            </Botao>
          </div>

          {!valido && titulo !== "" ? (
            <p className="text-[0.8125rem] text-[var(--tinta-fraca)]">
              O título está em branco — só espaços não conta como nome.
            </p>
          ) : null}
        </div>
      </Gaveta>
    </>
  );
}
