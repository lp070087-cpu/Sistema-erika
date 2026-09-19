"use client";

import { IdentidadeDoCliente } from "./identidade-do-cliente";
import { registrarEventoDaSessao } from "@/lib/dados/demonstracao";
import type { ClienteOperacao as Cliente } from "@/lib/dados";

/**
 * AS AÇÕES DO CABEÇALHO DO CLIENTE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA CASCA EXISTE                                             │
 * │                                                                      │
 * │ A página do cliente é um componente de SERVIDOR — ela lê o            │
 * │ repositório uma vez e entrega tudo pronto. A gaveta de edição é de    │
 * │ cliente, porque é no navegador que o estado da sessão existe.         │
 * │                                                                      │
 * │ Faltava o degrau do meio: quem ASSINA o acontecimento. A gaveta       │
 * │ grava o dado, mas quem sabe que aquilo vira uma linha no histórico    │
 * │ do cliente é aqui — e aqui é o único lugar que pode chamar o store    │
 * │ sem obrigar a gaveta a conhecer o vocabulário de acontecimentos,      │
 * │ que é do cliente e não do formulário.                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O que a gaveta devolve é a FRASE, montada por comparação com o que
 * estava gravado. Aqui só se decide sob que tipo ela entra no histórico:
 * `lead_convertido` é o acontecimento de um cliente passar a existir, e é
 * o mais próximo do que é uma correção de cadastro. Inventar um tipo novo
 * deixaria a linha sem rótulo, porque o mapa de rótulos da aba Histórico é
 * fechado sobre os tipos que existem.
 */
export function AcoesDoCliente({ cliente }: { cliente: Cliente }) {
  return (
    <IdentidadeDoCliente
      cliente={cliente}
      aoSalvar={(oQue) => registrarEventoDaSessao(cliente.id, "lead_convertido", oQue)}
    />
  );
}
