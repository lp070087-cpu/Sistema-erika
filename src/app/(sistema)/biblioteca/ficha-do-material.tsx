"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao, CampoTexto } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Aviso } from "@/components/ui/superficie";
import { Etiqueta } from "@/components/ui/indicador";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import {
  ORDEM_MATERIAL,
  ROTULO_MATERIAL,
  ROTULO_ORIGEM_DO_MATERIAL,
  ROTA_ORIGEM_DO_MATERIAL,
} from "@/lib/dados";
import type {
  ClienteOperacao,
  Material,
  OrigemDoMaterial,
  TipoDeMaterial,
  TipoDeOrigem,
} from "@/lib/dados";
import { excluirMaterial, salvarMaterial } from "@/lib/dados/demonstracao";
import { dataCurta } from "@/lib/dados";
import Link from "next/link";

/**
 * A FICHA DO MATERIAL — o detalhe, e o lugar onde a ligação aparece.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A SEÇÃO DE ORIGENS É O QUE FAZ ISTO SER UM SISTEMA, E NÃO UMA LISTA   │
 * │                                                                      │
 * │ Um material nunca encosta só em si mesmo. O guia de limpeza encosta    │
 * │ no insumo (o produto de limpeza tem preço), no processo (a praça que é │
 * │ limpa) ou na ficha. Mostrar essas ligações é o que transforma uma       │
 * │ lista de arquivos num mapa do que já está cadastrado.                  │
 * │                                                                      │
 * │ E cada ligação oferece o CAMINHO de volta: clicar em "Cozinha" leva    │
 * │ para o processo. Sem isso a ligação seria decorativa — uma frase que   │
 * │ diz que dois assuntos se tocam e não leva a lugar nenhum.              │
 * │                                                                      │
 * │ As origens são cadastradas na FICHA e não no cadastro novo porque      │
 * │ aqui ela escolhe de uma lista de tipos, e lá teria de digitar um nome  │
 * │ que talvez não exista.                                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O BOTÃO DE EXCLUIR DIZ O QUE ELE NÃO FAZ                      │
 * │                                                                      │
 * │ O texto do botão de confirmação é "Remover o registro" e não           │
 * │ "Excluir o material", e o aviso abaixo dele explica por quê: o que sai │
 * │ é a linha daqui. O material continua no Drive, no caderno, publicado — │
 * │ o sistema nunca teve o arquivo para apagar.                            │
 * │                                                                      │
 * │ A diferença não é preciosismo. "Excluir o material" faria ela pensar   │
 * │ que perdeu o guia; ela hesitaria em limpar a lista, ou clicaria com o  │
 * │ cliente junto e passaria por um susto. Dizer o que acontece de        │
 * │ verdade é o que permite ela usar o botão sem medo.                    │
 * │                                                                      │
 * │ É por isso também que NÃO há "arquivar" aqui, ao contrário do insumo:  │
 * │ arquivar existe para preservar o que sustenta um cálculo, e nenhum     │
 * │ cálculo usa um material de apoio. Ver `excluirMaterial` no store.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function FichaDoMaterial({
  material,
  clientes,
  aoFechar,
}: {
  material: Material | null;
  clientes: readonly ClienteOperacao[];
  aoFechar: () => void;
}) {
  useDemonstracao();

  const [titulo, setTitulo] = useState(material?.titulo ?? "");
  const [tipo, setTipo] = useState<TipoDeMaterial>(material?.tipo ?? "LIMPEZA");
  const [servePara, setServePara] = useState(material?.servePara ?? "");
  const [onde, setOnde] = useState(material?.onde ?? "");
  const [clientesEscolhidos, setClientesEscolhidos] = useState<string[]>(
    material?.clientes ?? []
  );
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  /*
    ── A ORIGEM NOVA É DIGITADA EM DOIS CAMPOS PEQUENOS ────────────────────
    O tipo sai de uma lista fechada (não há como inventar um tipo de coisa que
    o sistema não conhece) e o nome é texto livre, porque as opções reais de
    cada tipo vivem em telas diferentes.
  */
  const [novaOrigemTipo, setNovaOrigemTipo] = useState<TipoDeOrigem>("FICHA");
  const [novaOrigemNome, setNovaOrigemNome] = useState("");

  if (material === null) return null;

  const tituloLimpo = titulo.trim();
  const mudou =
    tituloLimpo !== material.titulo ||
    tipo !== material.tipo ||
    servePara.trim() !== material.servePara ||
    onde.trim() !== material.onde ||
    [...clientesEscolhidos].sort().join("|") !== [...material.clientes].sort().join("|");

  function alternarCliente(id: string) {
    setClientesEscolhidos((atual) =>
      atual.includes(id) ? atual.filter((c) => c !== id) : [...atual, id]
    );
  }

  function salvar() {
    if (material === null || tituloLimpo === "") return;

    salvarMaterial(material.id, {
      titulo: tituloLimpo,
      tipo,
      servePara: servePara.trim(),
      onde: onde.trim(),
      clientes: clientesEscolhidos,
      atualizadoEm: new Date(),
    });
  }

  function acrescentarOrigem() {
    if (material === null) return;
    const nome = novaOrigemNome.trim();
    if (nome === "") return;

    /*
      Duas ligações iguais não se repetem. A chave é o par (tipo, nome
      normalizado) e não o id, porque a ligação pode ter sido declarada sem id
      — e duas linhas "Processo · Cozinha" na mesma ficha seriam a mesma frase
      escrita duas vezes.
    */
    const jaTem = material.origens.some(
      (o) =>
        o.tipo === novaOrigemTipo &&
        o.nome.trim().toLowerCase() === nome.toLowerCase()
    );
    if (jaTem) return;

    const origem: OrigemDoMaterial = { tipo: novaOrigemTipo, nome };
    salvarMaterial(material.id, { origens: [...material.origens, origem] });
    setNovaOrigemNome("");
  }

  function removerOrigem(indice: number) {
    if (material === null) return;
    salvarMaterial(material.id, {
      origens: material.origens.filter((_, i) => i !== indice),
    });
  }

  return (
    <Gaveta
      aberta
      aoFechar={aoFechar}
      titulo={material.titulo}
      descricao={`${ROTULO_MATERIAL[material.tipo]} · registro atualizado em ${dataCurta(material.atualizadoEm)}`}
    >
      <div className="space-y-6">
        <section>
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            O registro
          </p>

          <div className="mt-3 space-y-4">
            <Campo
              label="Título"
              obrigatorio
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              name="titulo-do-material"
            />

            <CampoSelecao
              label="Tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoDeMaterial)}
              name="tipo-do-material-ficha"
              opcoes={ORDEM_MATERIAL.map((t) => ({ valor: t, texto: ROTULO_MATERIAL[t] }))}
            />

            <CampoTexto
              label="Para que serve"
              rows={3}
              ajuda="A situação que ele responde. É por aqui que a busca encontra."
              value={servePara}
              onChange={(e) => setServePara(e.target.value)}
              name="serve-para-do-material-ficha"
            />

            <CampoTexto
              label="Onde está"
              rows={2}
              ajuda="Link, pasta, caderno — ou em branco. O sistema guarda o endereço; nunca o arquivo."
              value={onde}
              onChange={(e) => setOnde(e.target.value)}
              name="onde-esta-o-material-ficha"
            />
          </div>

          {onde.trim() !== "" ? (
            /*
              O endereço como LINK, quando é link. `rel="noreferrer"` porque o
              destino é externo e não tem por que saber de onde veio.
            */
            /^https?:\/\//.test(onde.trim()) ? (
              <p className="mt-3 text-[0.875rem]">
                <a
                  href={onde.trim()}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-[var(--acento)] underline underline-offset-2"
                >
                  Abrir o material
                </a>
              </p>
            ) : (
              <p className="mt-3 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                Endereço anotado: <span className="text-[var(--tinta)]">{onde.trim()}</span> — não é
                um link, então o sistema não abre sozinho.
              </p>
            )
          ) : null}
        </section>

        <section>
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            Vale para
          </p>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
            Nenhum marcado significa GERAL — serve a qualquer cliente.
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
                    id={`fmat-cli-${c.id}`}
                    checked={clientesEscolhidos.includes(c.id)}
                    onChange={() => alternarCliente(c.id)}
                    className="size-4 rounded border-[var(--linha-forte)]"
                  />
                  <label
                    htmlFor={`fmat-cli-${c.id}`}
                    className="text-[0.875rem] text-[var(--tinta-suave)]"
                  >
                    {c.nomeFantasia}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            Ligado a
          </p>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
            O que no sistema este material encosta: o ingrediente que ele usa, a ficha que ele
            documenta, o processo onde ele se aplica. Cada linha leva ao lugar.
          </p>

          {material.origens.length === 0 ? (
            <p className="mt-3 text-[0.8125rem] text-[var(--tinta-fraca)]">
              Nada ligado ainda. Um material geral normalmente não está ligado a nada — e isso não é
              falha.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {material.origens.map((o, i) => (
                <li key={`${o.tipo}-${i}`} className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
                  <Etiqueta tom="neutro">{ROTULO_ORIGEM_DO_MATERIAL[o.tipo]}</Etiqueta>
                  {/*
                    Com id, o nome é o CAMINHO. Sem id, é texto: a ligação foi
                    declarada, mas a coisa ainda não existe no sistema — e
                    fingir um link que leva a lugar nenhum seria pior do que
                    mostrar o nome sem link.
                  */}
                  {o.id !== undefined ? (
                    <Link
                      href={ROTA_ORIGEM_DO_MATERIAL[o.tipo]}
                      className="text-[0.875rem] font-medium text-[var(--acento)] underline underline-offset-2"
                    >
                      {o.nome}
                    </Link>
                  ) : (
                    <span className="text-[0.875rem] text-[var(--tinta-suave)]">{o.nome}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removerOrigem(i)}
                    className="text-[0.8125rem] text-[var(--tinta-fraca)] underline underline-offset-2"
                  >
                    desligar
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label>
              <span className="mb-1 block text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Tipo
              </span>
              <select
                value={novaOrigemTipo}
                onChange={(e) => setNovaOrigemTipo(e.target.value as TipoDeOrigem)}
                className="rounded-md border border-[var(--linha-forte)] bg-[var(--papel)] px-3 py-2 text-[0.875rem] text-[var(--tinta)]"
              >
                {(Object.keys(ROTULO_ORIGEM_DO_MATERIAL) as TipoDeOrigem[]).map((t) => (
                  <option key={t} value={t}>
                    {ROTULO_ORIGEM_DO_MATERIAL[t]}
                  </option>
                ))}
              </select>
            </label>

            <label className="min-w-[12rem] flex-1">
              <span className="mb-1 block text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Nome
              </span>
              <input
                type="text"
                value={novaOrigemNome}
                onChange={(e) => setNovaOrigemNome(e.target.value)}
                placeholder="Costela ao molho"
                className="w-full rounded-md border border-[var(--linha-forte)] bg-[var(--papel)] px-3 py-2 text-[0.875rem] text-[var(--tinta)] placeholder:text-[var(--tinta-fraca)]"
              />
            </label>

            <Botao
              variante="secundario"
              onClick={acrescentarOrigem}
              disabled={novaOrigemNome.trim() === ""}
            >
              Ligar
            </Botao>
          </div>
        </section>

        <div className="flex flex-wrap gap-3 border-t border-[var(--linha)] pt-5">
          <Botao variante="primario" onClick={salvar} disabled={!mudou || tituloLimpo === ""}>
            Salvar
          </Botao>

          {confirmandoExclusao ? (
            <>
              <Botao
                variante="secundario"
                onClick={() => {
                  excluirMaterial(material.id);
                  aoFechar();
                }}
              >
                Remover o registro
              </Botao>
              <Botao variante="linha" onClick={() => setConfirmandoExclusao(false)}>
                Cancelar
              </Botao>
            </>
          ) : (
            <Botao variante="linha" onClick={() => setConfirmandoExclusao(true)}>
              Excluir
            </Botao>
          )}
        </div>

        {confirmandoExclusao ? (
          <Aviso tom="atencao" titulo="O que sai é a linha daqui, e não o material">
            O material continua exatamente onde ele está — no Drive, no caderno, publicado. O
            sistema nunca teve o arquivo, então não há arquivo para apagar. O que se perde é o
            registro e o endereço: depois de remover, esta tela não sabe mais chegar até ele.
          </Aviso>
        ) : null}
      </div>
    </Gaveta>
  );
}
