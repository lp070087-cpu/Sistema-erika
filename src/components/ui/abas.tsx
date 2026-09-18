import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * ABAS INTERNAS DE UMA PÁGINA.
 *
 * Usadas no detalhe do cliente, que tem oito seções e ficaria gigante se
 * todas ficassem empilhadas — foi o pedido explícito da Seção 3 do briefing:
 * "Não criar páginas gigantes".
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A ABA VIVE NA URL E NÃO EM `useState`                        │
 * │                                                                      │
 * │ Com estado local, o botão "voltar" do navegador sai da página inteira │
 * │ em vez de voltar para a aba anterior, o link não pode ser mandado     │
 * │ para ninguém, e recarregar joga a pessoa na primeira aba.             │
 * │                                                                      │
 * │ Com `?aba=diagnostico`, tudo isso funciona de graça — e a aba ativa   │
 * │ continua sendo decidida no servidor, o que mantém o componente sem    │
 * │ estado e sem `"use client"`.                                          │
 * │                                                                      │
 * │ Custa uma navegação de servidor por troca de aba. Em compensação, a   │
 * │ aba nunca fica dessincronizada do conteúdo: ela É a URL.              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * Em telas estreitas a régua rola na horizontal. Isso é aceitável em abas —
 * é o único lugar do sistema onde a rolagem horizontal é esperada, e o
 * conteúdo continua acessível sem que a página inteira estique.
 */

export type Aba = {
  chave: string;
  titulo: string;
  /** Contagem opcional ao lado do título. Nunca um percentual. */
  contagem?: number;
};

export function Abas({
  abas,
  atual,
  base,
  className,
}: {
  abas: readonly Aba[];
  /** Chave da aba ativa. Quem decide é a página, a partir da URL. */
  atual: string;
  /** Rota sem query. A primeira aba não carrega parâmetro. */
  base: string;
  className?: string;
}) {
  const primeira = abas[0]?.chave;

  return (
    <nav aria-label="Seções desta página" className={cn("nao-imprimir", className)}>
      <ul
        className={cn(
          "flex gap-x-0.5 overflow-x-auto border-b border-[var(--linha)]",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        )}
      >
        {abas.map((aba) => {
          const ativa = aba.chave === atual;
          return (
            <li key={aba.chave} className="shrink-0">
              <Link
                href={aba.chave === primeira ? base : `${base}?aba=${aba.chave}`}
                aria-current={ativa ? "page" : undefined}
                className={cn(
                  /*
                    `whitespace-nowrap` é o certo aqui: o rótulo da aba não deve
                    quebrar no meio. O que ele NÃO pode é virar mais um motivo
                    de a faixa passar da largura do celular — por isso a
                    rolagem horizontal com barra escondida na <ul> acima, e o
                    `min-w-0` no contêiner de quem usa o componente. O toque
                    também fica maior do que a caixa do texto, para o dedo não
                    errar entre duas abas vizinhas.
                  */
                  "relative flex items-center gap-2 px-3.5 py-3 text-[0.8125rem] whitespace-nowrap sm:py-2.5",
                  "transition-colors duration-150",
                  "-mb-px border-b-2 border-transparent",
                  ativa
                    ? "font-semibold text-tinta"
                    : "text-[var(--tinta-suave)] hover:text-tinta"
                )}
              >
                {aba.titulo}
                {aba.contagem !== undefined ? (
                  <span
                    className={cn(
                      "tabular text-[0.6875rem]",
                      ativa ? "text-oliva" : "text-[var(--tinta-fraca)]"
                    )}
                  >
                    {aba.contagem}
                  </span>
                ) : null}
                {/*
                  O traço da aba ativa — a mesma linguagem do rótulo de seção.
                  Fica na borda DE BAIXO do próprio link (`bottom-0`, e não
                  `-bottom-px`), porque agora o link carrega a borda
                  transparente que mantém a altura igual entre ativa e inativa.
                  Assim o traço não depende mais de a borda da <ul> coincidir
                  exatamente de pixel com a do item — que é o tipo de detalhe
                  que quebra só em uma densidade de tela.
                */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-2 bottom-0 h-[2px] transition-opacity duration-200",
                    ativa ? "bg-oliva opacity-100" : "opacity-0"
                  )}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/**
 * Painel de uma aba. Existe para que a página possa listar as abas e o
 * conteúdo sem repetir a estrutura de cartão oito vezes.
 */
export function PainelAba({
  titulo,
  descricao,
  acoes,
  children,
}: {
  titulo?: string;
  descricao?: string;
  acoes?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      {titulo || descricao || acoes ? (
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            {titulo ? <h2 className="text-[1.0625rem]">{titulo}</h2> : null}
            {descricao ? (
              <p className="mt-1.5 max-w-[68ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                {descricao}
              </p>
            ) : null}
          </div>
          {acoes ? <div className="flex shrink-0 items-center gap-2">{acoes}</div> : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
