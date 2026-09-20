"use client";

/**
 * O SELETOR DE CLIENTE DA CENTRAL.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ELE DEIXOU DE ESCREVER NA URL                                │
 * │                                                                      │
 * │ Ele já fez `router.replace`, guardando a escolha em `?cliente=`. Isso  │
 * │ tinha uma vantagem real — o endereço virava compartilhável — e um      │
 * │ preço que só apareceu quando a tela virou ambiente de planilha: cada    │
 * │ troca de cliente era uma ida ao servidor. Com a grade montada no       │
 * │ cliente, navegar para buscar dado que já está em memória é voltar ao   │
 * │ servidor para pedir o que se tem na mão.                              │
 * │                                                                      │
 * │ Agora a escolha é estado do `AmbienteDaPlanilha`, que já é dono do     │
 * │ modelo e da grade. O endereço deixa de refletir o cliente — o que se   │
 * │ perde é o link compartilhável, e o que se ganha é a troca instantânea  │
 * │ entre clientes, que é o gesto que se repete dez vezes numa sessão.     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O `<select>` nativo é escolha deliberada: ele já vem com busca por
 * digitação, navegação por setas, teclado de celular e leitura por leitor de
 * tela — quatro coisas que uma lista feita à mão reimplementaria pior.
 */
export function SeletorDeCliente({
  clientes,
  selecionado,
  aoTrocar,
}: {
  clientes: readonly { id: string; nomeFantasia: string; cidade: string }[];
  selecionado: string;
  /** Quem reage é o ambiente, que também guarda a grade. */
  aoTrocar: (id: string) => void;
}) {
  return (
    <select
      id="cliente-planilha"
      value={selecionado}
      onChange={(e) => aoTrocar(e.target.value)}
      className="h-9 w-full max-w-[19rem] cursor-pointer rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 text-[0.875rem] text-tinta focus:border-oliva focus:bg-white focus:outline-none"
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
