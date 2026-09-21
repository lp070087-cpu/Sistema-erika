"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { ORIGENS } from "@/lib/planilhas/importacao/origens";
import type { IdDoDestino } from "@/lib/planilhas/importacao/destino";

/**
 * IMPORTAR — UM BOTÃO, QUATRO PORTAS.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UM BOTÃO, E NÃO QUATRO                                       │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Na Central quero UM ÚNICO botão: IMPORTAR. Ao clicar, abrir      │ │
 * │ │  menu/seletor com: PDF, EXCEL, TEXTO, FOTO. Não colocar quatro    │ │
 * │ │  botões permanentemente na toolbar."                              │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ A razão prática vai além da preferência: a barra de cima já carrega   │
 * │ cliente, planilha, consultoria, desfazer, refazer, criar, salvar,     │
 * │ enviar e o nome da planilha. Quatro botões de importação permanentes  │
 * │ seriam quatro botões que ela NÃO usa na maior parte do tempo,          │
 * │ empurrando para longe os que ela usa toda hora.                       │
 * │                                                                      │
 * │ E há a razão de sentido: importar é UMA decisão — "quero trazer dado   │
 * │ de fora". O formato é a segunda pergunta, e ela só existe depois da   │
 * │ primeira. Quatro botões fazem a segunda pergunta antes da primeira.   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O MENU MOSTRA AS QUATRO PORTAS, INCLUSIVE AS QUE AINDA NÃO LEEM      │
 * │                                                                      │
 * │ Seria fácil esconder PDF e Foto, que hoje não leem nada, e mostrar só  │
 * │ as duas que funcionam. Seria também uma mentira por omissão: ela não   │
 * │ saberia que existe uma porta de foto esperando ser ligada, e concluiria │
 * │ que o sistema não faz isso.                                            │
 * │                                                                      │
 * │ As quatro ficam, e o que muda é o ESTADO escrito em cada uma — com as  │
 * │ palavras do próprio leitor, não um selo genérico. E as quatro são       │
 * │ clicáveis: mesmo sem leitura automática, a porta leva à conferência,   │
 * │ onde ela pode digitar as linhas. Esconder a porta por causa da leitura  │
 * │ seria esconder o caminho manual, que é o que funciona hoje.            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UM LINK E NÃO UM `router.push`                               │
 * │                                                                      │
 * │ Cada porta é um `<a href>` de verdade. Isso dá o que um `onClick` com  │
 * │ navegação programática não dá: abrir em outra aba com o botão do meio, │
 * │ copiar o endereço, e o navegador mostrar para onde o link vai antes de │
 * │ clicar.                                                              │
 * │                                                                      │
 * │ Também é o que mantém a importação onde ela mora: uma rota própria,    │
 * │ com etapas próprias, em vez de um estado desta tela que obrigaria a    │
 * │ esconder a grade — e a grade é a regra.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export function ComandoDeImportacao({
  clienteId,
  destino,
  rotulo = "Importar",
  className,
}: {
  /** Vai junto na URL, para o arquivo sair com o nome do cliente. */
  clienteId: string;
  /**
   * O DESTINO QUE ESTA PORTA PRÉ-SELECIONA — o contexto, dito em voz alta.
   *
   * ┌────────────────────────────────────────────────────────────────────┐
   * │ POR QUE ELE É PROP, E NÃO ADIVINHADO PELO CAMINHO                   │
   * │                                                                    │
   * │ O botão não sabe em que tela está: ele é o mesmo componente na       │
   * │ Central, em /ingredientes e em /fichas. Se ele deduzisse o destino   │
   * │ de `usePathname()`, teria que carregar a lista das três telas — e    │
   * │ uma tela nova passaria a importar para o lugar errado em silêncio.   │
   * │                                                                    │
   * │ Quem sabe de onde está saindo é quem escreve o link, então é ele que │
   * │ declara. Omitido, nenhum destino vai na URL e vale `DESTINO_PADRAO`  │
   * │ — PLANILHA, exatamente o que esta esteira fazia antes.               │
   * └────────────────────────────────────────────────────────────────────┘
   */
  destino?: IdDoDestino;
  /** O rótulo do botão. "Importar" em toda parte; "Importar ingredientes" onde ajuda. */
  rotulo?: string;
  className?: string;
}) {
  const [aberto, definirAberto] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);

  /*
    FECHAR AO CLICAR FORA E AO APERTAR ESC.

    ┌────────────────────────────────────────────────────────────────────┐
    │ POR QUE O `mousedown` E NÃO O `click`                              │
    │                                                                    │
    │ Com `click`, o ouvinte roda DEPOIS que o navegador processa o       │
    │ clique. Se o clique foi no próprio botão, o ouvinte fecharia o menu  │
    │ — e logo em seguida o `onClick` do botão o abriria de novo. O menu   │
    │ ficaria piscando e nunca fecharia.                                  │
    │                                                                    │
    │ O `mousedown` acontece ANTES, e a checagem de "está dentro da       │
    │ caixa?" resolve os dois casos de uma vez: clique fora fecha, clique  │
    │ dentro não faz nada (o link ou o botão trata).                      │
    └────────────────────────────────────────────────────────────────────┘
  */
  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      if (caixa.current && !caixa.current.contains(evento.target as Node)) definirAberto(false);
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") definirAberto(false);
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  /*
    OS PARÂMETROS DA URL, MONTADOS UMA VEZ.

    `destino` só entra quando declarado. Ausente, a URL sai como sempre saiu —
    sem `destino=` — e quem lê aplica o padrão. Escrever
    `?destino=planilha` nas portas da Central seria declarar em toda parte o
    que já é a regra de omissão, e passaria a mentir no dia em que o padrão
    mudasse.
  */
  const parametrosDoCliente = clienteId ? `&cliente=${encodeURIComponent(clienteId)}` : "";
  const parametroDoDestino = destino ? `&destino=${destino}` : "";

  return (
    <div ref={caixa} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => definirAberto((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={aberto}
        title="Trazer dados de um arquivo, de uma lista colada ou de uma foto"
        className={cn(
          "relative inline-flex h-8 items-center justify-center gap-2 overflow-hidden",
          "rounded-[var(--raio-sm)] border px-3",
          "font-medium uppercase whitespace-nowrap select-none",
          "text-[0.6875rem] tracking-[0.13em]",
          "transition-colors duration-200 ease-[var(--ease-suave)]",
          aberto
            ? "border-tinta bg-tinta text-off"
            : "border-[var(--linha-forte)] bg-transparent text-tinta hover:border-tinta hover:bg-tinta hover:text-off"
        )}
      >
        {rotulo}
        {/*
          A SETA GIRA, E ISSO É O RETORNO VISUAL DE QUE O MENU ESTÁ ABERTO.

          Ela não é enfeite: com o painel abaixo do botão e os dois na mesma
          cor quando aberto, a seta é o que marca o estado. E ela também é um
          alvo largo — o botão inteiro abre, não só a seta.
        */}
        <span
          aria-hidden
          className={cn(
            "text-[0.5rem] leading-none transition-transform duration-200",
            aberto && "rotate-180"
          )}
        >
          ▼
        </span>
      </button>

      {aberto ? (
        <div
          role="menu"
          aria-label="De onde trazer os dados"
          className={cn(
            "absolute right-0 z-30 mt-1.5 w-[min(22rem,calc(100vw-2rem))]",
            "overflow-hidden rounded-[var(--raio)] border border-[var(--linha-forte)]",
            "bg-[var(--superficie-solida)] shadow-[0_18px_40px_-18px_rgba(14,26,20,0.45)]"
          )}
        >
          <p className="rotulo border-b border-[var(--linha)] px-3.5 pb-2 pt-3 text-[0.625rem] text-[var(--tinta-fraca)]">
            De onde vêm os dados
          </p>

          {ORIGENS.map((origem) => {
            /*
              O ESTADO DE LEITURA É PERGUNTADO AO LEITOR, e não deduzido do
              formato. É o que permite o menu continuar certo no dia em que um
              serviço de leitura for configurado: nada aqui muda.
            */
            const le = origem.leitor.disponivel();

            return (
              <a
                key={origem.id}
                role="menuitem"
                href={`/planilhas/importar?origem=${origem.id}${parametroDoDestino}${parametrosDoCliente}`}
                onClick={() => definirAberto(false)}
                className={cn(
                  "flex items-start gap-3 border-b border-[var(--linha)] px-3.5 py-2.5 last:border-b-0",
                  "transition-colors duration-150 hover:bg-[rgba(29,82,54,0.06)]"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 grid h-7 w-9 shrink-0 place-items-center rounded-[var(--raio-sm)]",
                    "text-[0.5rem] font-semibold tracking-[0.06em]",
                    le
                      ? "bg-[rgba(107,122,70,0.16)] text-[var(--color-medio)]"
                      : "bg-[rgba(14,26,20,0.06)] text-[var(--tinta-fraca)]"
                  )}
                >
                  {origem.sigla}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-[0.875rem] font-medium text-[var(--tinta)]">
                      {origem.rotulo}
                    </span>
                    {/*
                      SEM LEITURA NÃO É SEM ENTRADA.

                      A etiqueta diz o que falta — a leitura automática — e não
                      "indisponível", que soaria como "esta opção não serve".
                      Ela serve: leva à conferência, e lá ela digita ou cola.
                    */}
                    {!le ? (
                      <span className="text-[0.625rem] uppercase tracking-[0.1em] text-[var(--tinta-fraca)]">
                        leitura ainda não ligada
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[0.75rem] leading-snug text-[var(--tinta-suave)]">
                    {origem.descricao}
                  </span>
                </span>
              </a>
            );
          })}

          {/*
            A SAÍDA DA PORTA DE TEXTO, que é a que funciona hoje inteira.

            Ela não é um atalho novo: é o mesmo `/planilhas/importar` com a
            origem de texto, o mesmo caminho que o item "Texto" acima. Existe
            aqui porque colar uma lista é o gesto mais rápido de todos, e quem
            já sabe o que quer não deveria ter de abrir um menu para isso.
          */}
          <a
            role="menuitem"
            href={`/planilhas/importar?origem=texto${parametroDoDestino}${parametrosDoCliente}`}
            onClick={() => definirAberto(false)}
            className={cn(
              "flex items-center justify-between gap-3 px-3.5 py-3",
              "border-t border-[var(--linha-forte)] bg-[rgba(29,82,54,0.05)]",
              "transition-colors duration-150 hover:bg-[rgba(29,82,54,0.11)]"
            )}
          >
            <span className="text-[0.8125rem] text-[var(--tinta)]">
              Tenho a lista em texto — quero colar
            </span>
            <span aria-hidden className="text-[0.8125rem] text-[var(--color-medio)]">
              →
            </span>
          </a>
        </div>
      ) : null}
    </div>
  );
}
