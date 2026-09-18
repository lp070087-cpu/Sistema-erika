"use client";

import { useRouter } from "next/navigation";

/**
 * O SELETOR DE CLIENTE DA CENTRAL.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO É UM CLIENT COMPONENT, E POR QUE USA A URL              │
 * │                                                                      │
 * │ Um `<select>` precisa de `onChange` para reagir, e `onChange` só      │
 * │ existe no navegador. A página da Central é um Server Component, então  │
 * │ o seletor mora aqui — e é o único pedaço da tela que precisa de        │
 * │ JavaScript.                                                            │
 * │                                                                      │
 * │ A escolha vai para a URL (`?cliente=...`) e não para estado local.     │
 * │ Isso parece mais trabalhoso para guardar um id, e é o que torna o     │
 * │ endereço compartilhável: a Érika escolhe o cliente, copia o link da    │
 * │ barra e guarda nos favoritos. Com estado local, o mesmo link abriria   │
 * │ no cliente errado — ou em nenhum.                                     │
 * │                                                                      │
 * │ `router.replace` e não `push`: trocar de cliente é ajustar o filtro da │
 * │ tela atual, e encher o histórico do navegador com uma entrada por      │
 * │ cliente escolhido faria o botão "voltar" ter de ser apertado dez vezes │
 * │ para sair da tela.                                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O `<select>` nativo é escolha deliberada: ele já vem com busca por
 * digitação, navegação por setas, teclado de celular e leitura por leitor de
 * tela — quatro coisas que uma lista feita à mão reimplementaria pior.
 */
export function SeletorDeCliente({
  clientes,
  selecionado,
}: {
  clientes: readonly { id: string; nomeFantasia: string; cidade: string }[];
  selecionado: string;
}) {
  const router = useRouter();

  return (
    <select
      id="cliente-planilha"
      value={selecionado}
      onChange={(e) => {
        const id = e.target.value;
        router.replace(id ? `/planilhas?cliente=${encodeURIComponent(id)}` : "/planilhas");
      }}
      className="mt-1.5 h-10 w-full max-w-[28rem] cursor-pointer rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.9375rem] text-tinta focus:border-oliva focus:bg-white focus:outline-none"
    >
      <option value="">Escolha um cliente…</option>
      {clientes.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nomeFantasia} — {c.cidade}
        </option>
      ))}
    </select>
  );
}
