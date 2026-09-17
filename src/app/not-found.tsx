import Link from "next/link";
import { Rotulo } from "@/components/ui/rotulo";
import { BotaoLink } from "@/components/ui/botao";
import { Logotipo } from "@/components/marca/logotipo";

export default function NaoEncontrado() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logotipo className="mb-10" />
      <Rotulo className="mb-4">Página não encontrada</Rotulo>
      <h1 className="max-w-[22ch] text-balance">
        Esta página não faz parte do sistema.
      </h1>
      <p className="mt-3 max-w-[52ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
        Os módulos previstos para as próximas fases têm rota própria e explicam o
        próprio escopo. Se você chegou aqui por um link do menu, é um defeito —
        vale avisar.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <BotaoLink href="/" variante="primario">
          Ir para a visão geral
        </BotaoLink>
        <Link
          href="/configuracoes"
          className="text-[0.875rem] text-[var(--tinta-suave)] underline decoration-[var(--linha-forte)] underline-offset-4 transition-colors hover:text-tinta"
        >
          Configurações
        </Link>
      </div>
    </div>
  );
}
