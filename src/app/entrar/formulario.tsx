"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { entrar } from "./acoes";
import { Campo } from "@/components/ui/campo";
import { Botao } from "@/components/ui/botao";
import { Aviso } from "@/components/ui/superficie";

/**
 * Formulário de entrada.
 *
 * Usa Server Action, portanto nenhuma chamada de autenticação acontece
 * no navegador e a senha nunca passa por código de cliente.
 * O estado de erro vem da action, não de `useState` local.
 */
export function FormularioEntrar() {
  const [estado, acao] = useActionState(entrar, { erro: null as string | null });

  return (
    <form action={acao} className="mt-7">
      <div className="space-y-4">
        <Campo
          label="E-mail"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="seu@email.com"
          required
          autoFocus
        />
        <Campo
          label="Senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {estado.erro ? (
        <Aviso tom="critico" className="mt-4">
          {estado.erro}
        </Aviso>
      ) : null}

      <BotaoEnviar />
    </form>
  );
}

function BotaoEnviar() {
  const { pending } = useFormStatus();

  return (
    <Botao
      type="submit"
      variante="primario"
      className="mt-6 w-full"
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Verificando…" : "Entrar"}
    </Botao>
  );
}
