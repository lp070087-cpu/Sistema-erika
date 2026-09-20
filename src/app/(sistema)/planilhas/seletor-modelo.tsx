"use client";

import type { ModeloPlanilha } from "@/lib/planilhas/tipos";

/**
 * O SELETOR DE PLANILHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UM `<select>` E NÃO UMA LISTA DE CARDS                       │
 * │                                                                      │
 * │ A Central já mostrou os modelos como cards, com descrição, etiqueta   │
 * │ de estado e um parágrafo explicando o que falta em cada um. Isso faz   │
 * │ sentido numa PÁGINA DE CATÁLOGO, e não numa barra de comando: ali o    │
 * │ modelo é uma escolha entre quatro, e uma escolha se apresenta como     │
 * │ lista de opções. Os cards ocupavam metade da dobra e empurravam a      │
 * │ grade para fora da tela.                                              │
 * │                                                                      │
 * │ O `<select>` nativo traz busca por digitação, teclado e leitura por    │
 * │ leitor de tela — três coisas que uma lista feita à mão reimplementa    │
 * │ pior. É a mesma escolha do seletor de cliente, e pela mesma razão.     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O MODELO QUE NÃO SAI CONTINUA NA LISTA — DESABILITADO        │
 * │                                                                      │
 * │ Escondê-lo faria o catálogo parecer menor do que é, e a Érika não      │
 * │ teria como saber que existe uma planilha de pratos por praça esperando │
 * │ uma definição dela. Desabilitado, ele aparece, aparece com o motivo no │
 * │ `title`, e não pode ser escolhido — que é exatamente o estado real.    │
 * │                                                                      │
 * │ O motivo vai no `title` e no texto da opção, e não num parágrafo       │
 * │ abaixo: aqui não há espaço para parágrafo, e o que ela precisa saber   │
 * │ é uma coisa só — se dá para usar hoje ou não.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function SeletorDeModelo({
  modelos,
  selecionado,
  aoTrocar,
}: {
  modelos: readonly ModeloPlanilha[];
  selecionado: string;
  aoTrocar: (id: string) => void;
}) {
  return (
    <select
      id="modelo-planilha"
      value={selecionado}
      onChange={(e) => aoTrocar(e.target.value)}
      className="h-9 w-full max-w-[19rem] cursor-pointer rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.875rem] text-tinta focus:border-oliva focus:bg-white focus:outline-none"
    >
      {modelos.map((m) => (
        <option
          key={m.id}
          value={m.id}
          disabled={m.estado !== "DISPONIVEL"}
          title={m.estado !== "DISPONIVEL" ? (m.motivo ?? "Ainda não gera arquivo.") : m.descricao}
        >
          {m.nome}
          {m.estado !== "DISPONIVEL" ? " — ainda não sai" : ""}
        </option>
      ))}
    </select>
  );
}
