"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
// Import direto dos módulos-folha, e não do barril "@/lib/dados".
//
// O barril reexporta `obterRepositorio`, que arrasta o repositório de
// demonstração inteiro. Este é o formulário PÚBLICO: ele roda no
// navegador de quem responde, sem conta. Importar o barril daqui levava
// os dados fictícios dos leads para dentro do pacote que o cliente baixa
// — desnecessário, e o tipo de coisa que ninguém percebe até virar
// problema. Os módulos-folha não importam nada além de tipos.
import { ETAPAS, PERGUNTAS_ULTIMA_ETAPA } from "@/lib/dados/etapas";
import { PERGUNTAS, PERGUNTA_POR_ID, type Pergunta } from "@/lib/dados/perguntas";
import { CampoPergunta } from "./campos";
import { Conclusao } from "./conclusao";

/**
 * O FORMULÁRIO PÚBLICO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ AS RESPOSTAS VIVEM NA MEMÓRIA DESTA PÁGINA — E ISSO É DECLARADO      │
 * │                                                                      │
 * │ A preservação das respostas ao voltar e continuar funciona: o estado │
 * │ fica em `useState`, no topo deste componente, e trocar de etapa não  │
 * │ desmonta nada. Voltar mantém tudo.                                   │
 * │                                                                      │
 * │ Mas o HTML do projeto proíbe `localStorage` — ele não existe no      │
 * │ ambiente onde estes componentes rodam. Consequência real: se a       │
 * │ pessoa recarregar a página, perder o sinal ou o navegador descartar  │
 * │ a aba, as respostas somem.                                           │
 * │                                                                      │
 * │ Isso é limitação conhecida, não descuido. A alternativa seria        │
 * │ gravar em cada etapa — o que resolve a perda E é o que precisa       │
 * │ existir de qualquer forma quando o banco entrar. Enquanto não há     │
 * │ onde gravar, a tela usa os dois recursos que existem: mantém o       │
 * │ estado ao navegar entre etapas e avisa antes de sair.                │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * VALIDAÇÃO FECHA A PORTA, NÃO APONTA O DEDO
 *
 * Ao tentar avançar com obrigatória em branco, as perguntas problemáticas
 * ganham mensagem e o foco vai para a primeira delas. Não existe alerta
 * genérico de "preencha os campos" — a pessoa precisa saber qual campo.
 *
 * A validação do e-mail e do WhatsApp é de FORMATO, e para no formato:
 * confere se parece um endereço e se o telefone tem dígitos suficientes.
 * Nenhuma tentativa de adivinhar se o número existe ou se o endereço é
 * real — isso é trabalho do envio, não da tela.
 */

type Respostas = Record<string, string>;
type Erros = Record<string, string>;

export function Formulario() {
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [erros, setErros] = useState<Erros>({});
  const [concluido, setConcluido] = useState(false);

  const topoRef = useRef<HTMLDivElement>(null);

  const etapa = ETAPAS[indice]!;
  const total = ETAPAS.length;

  // As perguntas de cada etapa: os blocos declarados, mais as extras da
  // última (as abertas e o retorno). A ordem é a do formulário original.
  const perguntasDaEtapa = useMemo<Pergunta[]>(() => {
    const idsFixos = PERGUNTAS.filter((p) => etapa.blocos.includes(p.bloco)).map((p) => p.id);
    const ids =
      etapa.chave === "retorno"
        ? [...idsFixos, ...PERGUNTAS_ULTIMA_ETAPA.filter((i) => !idsFixos.includes(i))]
        : idsFixos;

    return ids
      .map((id) => PERGUNTA_POR_ID[id])
      .filter((p): p is Pergunta => Boolean(p))
      .sort((a, b) => a.numero - b.numero);
  }, [etapa]);

  const definir = useCallback((perguntaId: string, valor: string) => {
    setRespostas((atual) => ({ ...atual, [perguntaId]: valor }));
    // Ao digitar, o erro daquele campo deixa de fazer sentido. Ele volta
    // a aparecer só se a pessoa tentar avançar de novo com ele em branco.
    setErros((atual) => {
      if (!atual[perguntaId]) return atual;
      const copia = { ...atual };
      delete copia[perguntaId];
      return copia;
    });
  }, []);

  const validarEtapa = useCallback((): Erros => {
    const encontrados: Erros = {};

    for (const pergunta of perguntasDaEtapa) {
      if (!pergunta.obrigatoria) continue;
      const valor = (respostas[pergunta.id] ?? "").trim();

      if (!valor) {
        encontrados[pergunta.id] = "Esta pergunta é obrigatória.";
        continue;
      }

      if (pergunta.tipo === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
        encontrados[pergunta.id] = "Confira o e-mail — parece faltar algo.";
        continue;
      }

      if (pergunta.tipo === "telefone") {
        const digitos = valor.replace(/\D/g, "");
        if (digitos.length < 10) {
          encontrados[pergunta.id] =
            "Inclua o DDD. Ex.: (51) 99999-9999.";
        }
      }
    }

    return encontrados;
  }, [perguntasDaEtapa, respostas]);

  const avancar = useCallback(() => {
    const encontrados = validarEtapa();
    if (Object.keys(encontrados).length > 0) {
      setErros(encontrados);
      // Leva a pessoa até a primeira pergunta com problema, em vez de
      // deixá-la procurar. `requestAnimationFrame` espera o React pintar
      // a mensagem antes de medir a posição.
      const primeiro = perguntasDaEtapa.find((p) => encontrados[p.id]);
      requestAnimationFrame(() => {
        if (primeiro) {
          document
            .getElementById(`q-${primeiro.id}`)
            ?.scrollIntoView({ block: "start", behavior: "smooth" });
        }
      });
      return;
    }

    setErros({});

    if (indice < total - 1) {
      setIndice((i) => i + 1);
      topoRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    } else {
      setConcluido(true);
      topoRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    }
  }, [indice, total, validarEtapa, perguntasDaEtapa]);

  const voltar = useCallback(() => {
    // Voltar NUNCA valida: a pessoa está indo corrigir algo, e bloquear a
    // volta por causa de um campo em branco seria hostil.
    setErros({});
    setIndice((i) => Math.max(0, i - 1));
    topoRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, []);

  // Progresso sobre o TOTAL de perguntas, não sobre a etapa. "6 de 29"
  // comunica o tamanho real do compromisso; "etapa 3 de 5" esconde.
  const respondidas = useMemo(
    () => PERGUNTAS.filter((p) => (respostas[p.id] ?? "").trim().length > 0).length,
    [respostas]
  );

  const percentual = Math.round((respondidas / PERGUNTAS.length) * 100);

  if (concluido) {
    return (
      <div ref={topoRef} className="scroll-mt-24">
        <Conclusao respostas={respostas} />
      </div>
    );
  }

  const ultima = indice === total - 1;

  return (
    <div ref={topoRef} className="scroll-mt-24">
      <div className="mx-auto max-w-[46rem]">
        {/* Progresso ---------------------------------------------------- */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-oliva">
              {etapa.titulo}
            </span>
            <span className="shrink-0 text-[0.8125rem] text-[var(--tinta-fraca)] tabular">
              {respondidas} de {PERGUNTAS.length}
            </span>
          </div>

          <div
            className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-[rgba(14,26,20,0.09)]"
            role="progressbar"
            aria-valuenow={respondidas}
            aria-valuemin={0}
            aria-valuemax={PERGUNTAS.length}
            aria-label={`${respondidas} de ${PERGUNTAS.length} perguntas respondidas`}
          >
            <div
              className="h-full rounded-full bg-oliva transition-[width] duration-500 ease-[var(--ease-marca)]"
              style={{ width: `${percentual}%` }}
            />
          </div>

          <h2 className="mt-6 text-balance text-[1.5rem] sm:text-[1.75rem]">{etapa.titulo}</h2>
          <p className="mt-2.5 max-w-[58ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
            {etapa.descricao}
          </p>
        </div>

        {/* Perguntas ---------------------------------------------------- */}
        <div className="space-y-9 sm:space-y-10">
          {perguntasDaEtapa.map((pergunta) => (
            <CampoPergunta
              key={pergunta.id}
              pergunta={pergunta}
              valor={respostas[pergunta.id] ?? ""}
              erro={erros[pergunta.id]}
              aoMudar={(v) => definir(pergunta.id, v)}
            />
          ))}
        </div>

        {/* Resumo de erros ---------------------------------------------- */}
        {Object.keys(erros).length > 0 ? (
          <p
            role="alert"
            className="mt-8 rounded-[var(--raio)] border border-red-800/30 bg-[rgba(153,27,27,0.06)] px-4 py-3 text-[0.875rem] leading-relaxed text-red-900"
          >
            {Object.keys(erros).length === 1
              ? "Falta uma resposta para continuar. O campo está marcado acima."
              : `Faltam ${Object.keys(erros).length} respostas para continuar. Os campos estão marcados acima.`}
          </p>
        ) : null}

        {/* Navegação ---------------------------------------------------- */}
        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-[var(--linha)] pt-7">
          {indice > 0 ? (
            <button
              type="button"
              onClick={voltar}
              className={cn(
                "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--raio-sm)]",
                "border border-[var(--linha-forte)] px-5 text-[0.75rem] font-medium uppercase",
                "tracking-[0.15em] text-tinta transition-colors duration-200",
                "hover:border-tinta hover:bg-tinta hover:text-off"
              )}
            >
              <span aria-hidden>←</span> Voltar
            </button>
          ) : null}

          <button
            type="button"
            onClick={avancar}
            className={cn(
              "inline-flex h-12 items-center justify-center gap-2 rounded-[var(--raio-sm)]",
              "bg-profundo px-6 text-[0.75rem] font-medium uppercase tracking-[0.15em]",
              "text-off transition-colors duration-200 hover:bg-medio"
            )}
          >
            {ultima ? "Enviar diagnóstico" : "Continuar"}
            {!ultima ? <span aria-hidden>→</span> : null}
          </button>

          <span className="ml-auto text-[0.8125rem] text-[var(--tinta-fraca)]">
            Etapa {indice + 1} de {total}
          </span>
        </div>

        {/* Aviso de saída ----------------------------------------------- */}
        <p className="mt-6 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
          Suas respostas ficam guardadas enquanto você navega entre as
          etapas.{" "}
          <strong className="font-medium text-[var(--tinta-suave)]">
            Se você recarregar ou fechar esta página, elas se perdem
          </strong>{" "}
          — o sistema ainda não grava em banco. Se estiver no celular, o
          ideal é responder de uma vez; são cerca de cinco minutos.
        </p>

        {/* Rodapé da marca --------------------------------------------- */}
        <p className="mt-8 text-center text-[0.75rem] text-[var(--tinta-fraca)]">
          Diagnóstico de Lucro e Operação da Cozinha ·{" "}
          <Link href="/diagnostico" className="underline-offset-4 hover:underline">
            Érika Bruna
          </Link>
        </p>
      </div>
    </div>
  );
}
