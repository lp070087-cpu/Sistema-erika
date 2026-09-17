"use client";

import { useTransition } from "react";
import { Botao } from "@/components/ui/botao";
import { sair } from "./acoes";

/** Encerra a sessão. Isolado em componente cliente para manter a página no servidor. */
export function BotaoSair() {
  const [pendente, iniciar] = useTransition();

  return (
    <Botao
      variante="secundario"
      tamanho="sm"
      disabled={pendente}
      onClick={() => iniciar(() => void sair())}
    >
      {pendente ? "Saindo…" : "Sair do sistema"}
    </Botao>
  );
}
