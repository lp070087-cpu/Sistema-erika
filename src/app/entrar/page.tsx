import type { Metadata } from "next";
import { conferirAmbiente } from "@/lib/env";
import { FormularioEntrar } from "./formulario";
import { Logotipo } from "@/components/marca/logotipo";
import { Aviso } from "@/components/ui/superficie";
import { Rotulo } from "@/components/ui/rotulo";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Tela de entrada.
 *
 * Painel escuro à esquerda, formulário à direita — a mesma linguagem
 * editorial do site (verde profundo, marca-texto oliva, assinatura
 * manuscrita), aplicada a um contexto funcional.
 *
 * Se o ambiente ainda não estiver configurado, a tela diz exatamente
 * qual variável falta e como gerá-la, em vez de recusar o login sem
 * explicar. Este é o estado real desta fase: o banco ainda não existe.
 */
export default function PaginaEntrar() {
  const ambiente = conferirAmbiente();

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
      {/* Painel da marca */}
      <aside className="relative hidden flex-col justify-between bg-profundo px-10 py-12 lg:flex xl:px-16">
        <Logotipo escuro />

        <div className="max-w-[30ch]">
          <Rotulo claro className="mb-6">
            Gestão de consultoria
          </Rotulo>
          <p className="font-display text-[2.5rem] leading-[1.05] tracking-[-0.022em] text-off">
            O lucro começa pela <em className="destaque">organização</em>.
          </p>
          <p className="mt-6 text-[0.9375rem] leading-relaxed text-creme/65">
            Onde a operação está perdendo dinheiro — e onde ela já ganhou.
          </p>
        </div>

        <p className="assina text-[1.5rem] text-oliva-palha">Cozinha organizada gera lucro real</p>
      </aside>

      {/* Formulário */}
      <main className="flex flex-col justify-center px-6 py-12 sm:px-10">
        <div className="mx-auto w-full max-w-[360px]">
          <div className="mb-8 lg:hidden">
            <Logotipo />
          </div>

          <Rotulo className="mb-3">Acesso restrito</Rotulo>
          <h1 className="text-[1.625rem]">Entrar</h1>
          <p className="mt-2.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            Use as credenciais configuradas no arquivo de ambiente.
          </p>

          {!ambiente.pronto ? (
            <Aviso tom="atencao" titulo="Ambiente ainda não configurado" className="mt-6">
              <p>
                {ambiente.faltando.length === 1
                  ? "Falta a variável"
                  : "Faltam as variáveis"}{" "}
                no arquivo{" "}
                <code className="rounded-[2px] bg-[rgba(14,26,20,0.07)] px-1 py-0.5 text-[0.8125rem]">
                  .env
                </code>
                :{" "}
                <strong className="font-semibold text-tinta">
                  {ambiente.faltando.join(", ")}
                </strong>
                .
              </p>
              <p className="mt-2">
                Copie <code>.env.example</code> para <code>.env</code>, gere o segredo com{" "}
                <code>openssl rand -base64 32</code> e o hash da senha com{" "}
                <code>npm run senha:hash -- &quot;sua-senha&quot;</code>.
              </p>
            </Aviso>
          ) : (
            <FormularioEntrar />
          )}
        </div>
      </main>
    </div>
  );
}
