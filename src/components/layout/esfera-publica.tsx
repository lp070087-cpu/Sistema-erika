"use client";

import { usePathname } from "next/navigation";
import { ShellPublico } from "./shell-publico";
import { esferaDe } from "@/lib/esfera";

/**
 * DECIDE A MOLDURA DA ESFERA PÚBLICA.
 *
 * Precisa ser componente de cliente porque só ele enxerga o caminho
 * atual com `usePathname()`. O layout raiz é servidor — ele não sabe em
 * que rota está, e por isso não consegue escolher a moldura sozinho.
 *
 * A alternativa seria um route group `(publico)` com o próprio layout.
 * Funcionaria, mas o Next não permite duas raízes — o `<html>` fica no
 * layout raiz, obrigatoriamente. Um segundo layout só acrescentaria
 * moldura, nunca substituiria a raiz, e o resultado seria a barra lateral
 * do sistema aparecendo atrás do formulário público.
 *
 * Então: o layout raiz monta este componente, ele olha a rota, e monta a
 * moldura pública SÓ quando a rota é pública. Nas rotas do sistema ele
 * devolve os filhos sem moldura nenhuma — a moldura delas é montada pelo
 * layout do grupo (sistema).
 */
export function EsferaPublica({ children }: { children: React.ReactNode }) {
  const caminho = usePathname() ?? "/";

  if (esferaDe(caminho) === "publico") {
    return <ShellPublico>{children}</ShellPublico>;
  }

  // Rotas do sistema e rotas sem moldura (/entrar, /api, erros): passa
  // direto. Quem monta a moldura delas é o próprio segmento.
  return <>{children}</>;
}
