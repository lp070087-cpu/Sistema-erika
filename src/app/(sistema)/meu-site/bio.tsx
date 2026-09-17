"use client";

import { useState } from "react";
import { CopiarLink } from "@/components/ui/link-publico";

/**
 * A SUGESTÃO DE BIO DO INSTAGRAM, COM CÓPIA.
 *
 * É componente de cliente por um motivo pequeno e específico: o texto da bio
 * precisa estar visível e selecionável, e o botão precisa avisar quando copiou.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O TEXTO COPIA E NÃO ABRE O INSTAGRAM                         │
 * │                                                                      │
 * │ O sistema não tem login no Instagram dela, não tem a senha dela, e    │
 * │ não vai pedir. Nenhuma API é chamada. O que existe aqui é uma         │
 * │ ferramenta de trabalho: o texto pronto para ela colar onde quiser.    │
 * │                                                                      │
 * │ Isso é decisão de segurança, não de escopo. Um sistema de consultoria │
 * │ que pede a senha do Instagram para "facilitar" é exatamente o tipo de │
 * │ coisa que não se faz — e ela foi clara sobre não depender de           │
 * │ terceiros para o que é essencial.                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function BioInstagram({ texto }: { texto: string }) {
  const [copiada, setCopiada] = useState(false);

  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] p-4">
      <p className="text-[0.9375rem] leading-relaxed text-tinta">{texto}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <CopiarLink
          texto={texto}
          rotulo="Copiar sugestão de bio"
          variante="secundario"
          tamanho="sm"
          aoCopiar={() => setCopiada(true)}
        />
        {copiada ? (
          <span className="text-[0.75rem] text-[var(--tinta-fraca)]">
            Cole na bio do perfil. O sistema não altera nem acessa o seu Instagram.
          </span>
        ) : null}
      </div>
    </div>
  );
}
