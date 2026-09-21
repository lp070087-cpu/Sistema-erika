"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { cn } from "@/lib/utils/cn";
import type { ColunaGrade, FolhaGrade, LinhaGrade } from "@/lib/planilhas/grade";
import { linhasVazias, nota } from "@/lib/planilhas/grade";

/**
 * "CRIAR PLANILHA" — UMA GRADE EM BRANCO, NA HORA, COM O NOME QUE ELA DER.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE FLUXO É, E O QUE ELE NÃO É                                │
 * │                                                                      │
 * │ É o "novo documento" da Central: um nome, um modelo, e opcionalmente   │
 * │ um cliente e uma consultoria para o cabeçalho. Ao confirmar, a         │
 * │ planilha aparece IMEDIATAMENTE no editor — porque criar dentro do      │
 * │ sistema e baixar um arquivo são coisas diferentes, e o download é um   │
 * │ passo separado (ver `gerar.tsx`).                                     │
 * │                                                                      │
 * │ NÃO é o caminho dos modelos que leem dado de cliente. Esses continuam  │
 * │ no seletor "Planilha" e são montados a partir do repositório: pedir    │
 * │ "nome" para uma ficha técnica sugeriria que o nome gera o conteúdo, e  │
 * │ o conteúdo dela vem das fichas cadastradas.                           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE OS QUATRO MODELOS OFERECIDOS NÃO SÃO OS QUATRO DO CATÁLOGO   │
 * │                                                                      │
 * │ O catálogo tem "Ficha técnica" e "Custos e precificação" — e os dois   │
 * │ são montados a partir do que já está cadastrado. Um botão "Criar" que  │
 * │ produzisse uma ficha vazia seria uma segunda forma de criar ficha,     │
 * │ divergindo da primeira no primeiro ajuste de coluna.                   │
 * │                                                                      │
 * │ O que este fluxo cria é ESTRUTURA VAZIA: uma grade livre, uma grade    │
 * │ livre com colunas de custo, e uma grade livre com os blocos de um      │
 * │ relatório. É o que o briefing pede — "Em Branco" entre os modelos — e  │
 * │ é honesto: nada aqui mostra número que ninguém informou.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export type ModeloLivre = "branco" | "custos" | "relatorio";

/**
 * AS COLUNAS DE UMA GRADE LIVRE — A–L, sem título.
 *
 * Sem título de propósito, e a razão é a mesma de `em-branco.ts`: uma coluna
 * chamada "Peso" sugere que aquela coluna É peso, e ela vai usá-la para outra
 * coisa. Cabeçalho é a primeira coisa que se digita numa planilha em branco.
 */
function colunasLivres(): ColunaGrade[] {
  return Array.from({ length: 12 }, (_, i) => ({
    chave: `c${i + 1}`,
    titulo: "",
    formato: "texto" as const,
    largura: i === 0 ? 34 : 15,
    larguraMinima: i === 0 ? 260 : 118,
  }));
}

/**
 * AS COLUNAS DE CUSTO — com cabeçalho, porque aqui o sentido é declarado.
 *
 * Diferente da grade livre: a Érika escolheu "Custos e Precificação", então
 * as colunas de peso, preço e custo SÃO o que ela pediu. Sem cabeçalho, ela
 * teria de digitar doze rótulos antes de começar — e o modelo não teria
 * serventia nenhuma.
 *
 * O CUSTO E O CMV FICAM FORA: os dois são resultado de conta, e nesta versão
 * a grade não calcula (não há fórmula). Uma coluna "Custo" que aceita
 * digitação e não soma é a pior das duas: parece calculada e não é.
 */
const COLUNAS_CUSTO: readonly ColunaGrade[] = [
  { chave: "item", titulo: "Item", formato: "texto", largura: 34, larguraMinima: 260 },
  { chave: "unidade", titulo: "Unid.", formato: "texto", largura: 10, larguraMinima: 84 },
  { chave: "quantidade", titulo: "Qtde", formato: "numero", largura: 12, larguraMinima: 96 },
  { chave: "peso", titulo: "Peso (kg)", formato: "peso", largura: 13, larguraMinima: 106 },
  { chave: "precoKg", titulo: "Preço/kg", formato: "moeda", largura: 14, larguraMinima: 110 },
  { chave: "observacao", titulo: "Observação", formato: "texto", largura: 26, larguraMinima: 200 },
];

const ABAS_CRIADAS: Record<ModeloLivre, string> = {
  branco: "Planilha 1",
  custos: "Custos",
  relatorio: "Resumo",
};

/**
 * A PLANILHA CRIADA — a grade que aparece no editor no instante do clique.
 *
 * `numero` entra no nome da folha porque dois "Criar" seguidos criariam duas
 * abas com o mesmo nome, e o Excel recusa nome de aba repetido: o arquivo
 * exportado sairia com uma delas renomeada, sem aviso.
 */
export function criarFolhaDoModelo(
  modelo: ModeloLivre,
  numeroDaFolha: number
): FolhaGrade {
  const nome = modelo === "branco" && numeroDaFolha > 1
    ? `Planilha ${numeroDaFolha}`
    : ABAS_CRIADAS[modelo];

  return {
    nome,
    titulo: nome.toUpperCase(),
    colunas: modelo === "custos" ? COLUNAS_CUSTO : colunasLivres(),
    linhas: linhasDaFolhaCriada(modelo),
    congelarLinhas: 0,
    congelarColunas: 1,
    mostrarCabecalho: modelo === "custos",
    editavel: true,
    assinatura:
      "Planilha criada nesta sessão · sem fórmula nesta versão · conteúdo válido apenas enquanto a página estiver aberta",
  };
}

function linhasDaFolhaCriada(modelo: ModeloLivre): LinhaGrade[] {
  if (modelo !== "custos") {
    return [
      ...linhasVazias(30),
      nota(
        "Grade livre, sem fórmula. O que você digitar vale nesta sessão: recarregar a página limpa a planilha, porque o armazenamento definitivo ainda não foi ligado."
      ),
    ];
  }

  /*
    A ABA DE CUSTOS NASCE COM O CABEÇALHO DA TABELA NA PRIMEIRA LINHA, e não
    com trinta linhas anônimas. É a diferença entre uma grade e uma tabela:
    sem o cabeçalho, as colunas Peso e Preço/kg seriam doze colunas iguais com
    uma promessa invisível de que a quarta é peso.
  */
  return [
    { tipo: "cabecalho" },
    ...linhasVazias(30),
    nota(
      "Grade de custos sem fórmula nesta versão: as colunas são as da planilha, e o cálculo automático entra quando a fonte dos dados estiver definida. O conteúdo vale nesta sessão."
    ),
  ];
}

// ---------------------------------------------------------------------------
// A janela
// ---------------------------------------------------------------------------

const OPCOES: readonly { id: ModeloLivre; nome: string; descricao: string }[] = [
  {
    id: "branco",
    nome: "Em branco",
    descricao: "Trinta linhas por doze colunas, sem cabeçalho — para digitar do zero.",
  },
  {
    id: "custos",
    nome: "Custos e precificação",
    descricao: "Grade com as colunas de item, quantidade, peso e preço por quilo.",
  },
  {
    id: "relatorio",
    nome: "Relatório",
    descricao: "Folha livre em branco, para escrever o relatório à mão.",
  },
];

export function JanelaCriarPlanilha({
  aberta,
  clientes,
  clienteId,
  consultoriaTitulo,
  aoFechar,
  aoCriar,
}: {
  aberta: boolean;
  clientes: readonly { id: string; nomeFantasia: string }[];
  clienteId: string;
  consultoriaTitulo: string | null;
  aoFechar: () => void;
  aoCriar: (dados: {
    nome: string;
    modelo: ModeloLivre;
    clienteId: string;
  }) => void;
}) {
  const [nome, definirNome] = useState("");
  const [modelo, definirModelo] = useState<ModeloLivre>("branco");
  const [cliente, definirCliente] = useState(clienteId);

  if (!aberta) return null;

  const escolhido = clientes.find((c) => c.id === cliente) ?? null;
  const podeCriar = nome.trim() !== "";

  return (
    /*
      A JANELA É MODAL, E O FUNDO ESCURO É O QUE DIZ ISSO.

      Sem ele, o formulário seria um bloco a mais na página e a grade
      continuaria parecendo clicável — ela clicaria numa célula, nada
      aconteceria (o modal está por cima), e a conclusão seria que a grade
      travou. O fundo resolve o mal-entendido antes que ele aconteça.
    */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Criar planilha"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[rgba(7,30,20,0.42)] p-4 pt-[12vh]"
      onKeyDown={(e) => {
        if (e.key === "Escape") aoFechar();
      }}
    >
      <div className="w-full max-w-[520px] rounded-[var(--raio)] border border-[var(--linha-forte)] bg-[var(--superficie-solida)] shadow-[0_18px_48px_rgba(7,30,20,0.28)]">
        <div className="flex items-center justify-between border-b border-[var(--linha)] px-5 py-3.5">
          <h2 className="font-display text-[1.0625rem] text-tinta">Criar planilha</h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded-[var(--raio-sm)] px-2 py-0.5 text-[1rem] leading-none text-[var(--tinta-fraca)] transition-colors hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <label className="block">
            <span className="block text-[0.625rem] font-semibold tracking-[0.13em] uppercase text-[var(--tinta-fraca)]">
              Nome da planilha
            </span>
            <input
              // O foco vai para o nome: é o único campo obrigatório, e é o
              // primeiro que ela quer preencher.
              autoFocus
              value={nome}
              onChange={(e) => definirNome(e.target.value)}
              placeholder="Ex.: Ficha do bolo de cenoura"
              className="mt-1.5 h-9 w-full rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-[var(--superficie-solida)] px-3 text-[0.875rem] text-tinta outline-none focus:border-[var(--color-oliva)]"
            />
          </label>

          <fieldset>
            <legend className="text-[0.625rem] font-semibold tracking-[0.13em] uppercase text-[var(--tinta-fraca)]">
              Modelo
            </legend>
            <div className="mt-1.5 space-y-1">
              {OPCOES.map((o) => (
                <label
                  key={o.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-[var(--raio-sm)] border px-3 py-2 transition-colors",
                    modelo === o.id
                      ? "border-[var(--color-oliva)] bg-[rgba(107,122,70,0.08)]"
                      : "border-[var(--linha)] hover:bg-[rgba(14,26,20,0.03)]"
                  )}
                >
                  <input
                    type="radio"
                    name="modelo-criar"
                    checked={modelo === o.id}
                    onChange={() => definirModelo(o.id)}
                    className="mt-[3px] accent-[var(--color-oliva)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[0.8125rem] font-medium text-tinta">{o.nome}</span>
                    <span className="mt-0.5 block text-[0.75rem] leading-snug text-[var(--tinta-suave)]">
                      {o.descricao}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="block text-[0.625rem] font-semibold tracking-[0.13em] uppercase text-[var(--tinta-fraca)]">
                Cliente <span className="font-normal normal-case">(opcional)</span>
              </span>
              <select
                value={cliente}
                onChange={(e) => definirCliente(e.target.value)}
                className="mt-1.5 h-9 w-full rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-[var(--superficie-solida)] px-2 text-[0.8125rem] text-tinta outline-none focus:border-[var(--color-oliva)]"
              >
                <option value="">Sem cliente</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nomeFantasia}
                  </option>
                ))}
              </select>
            </label>

            <div>
              <span className="block text-[0.625rem] font-semibold tracking-[0.13em] uppercase text-[var(--tinta-fraca)]">
                Consultoria <span className="font-normal normal-case">(opcional)</span>
              </span>
              {/*
                A CONSULTORIA É MOSTRADA, E NÃO OFERECIDA — como na barra.
                `montarContexto` resolve a consultoria ativa do cliente, e
                escolher entre consultorias de um cliente que costuma ter uma
                só seria cromo. O nome fica no subtítulo da planilha.
              */}
              <p className="mt-1.5 flex h-9 items-center text-[0.8125rem] text-[var(--tinta-suave)]">
                {escolhido === null ? (
                  <span className="text-[var(--tinta-fraca)]">escolha um cliente</span>
                ) : (
                  (consultoriaTitulo ?? (
                    <span className="text-[var(--tinta-fraca)]">a ativa do cliente</span>
                  ))
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--linha)] px-5 py-3.5">
          <Botao
            variante="primario"
            tamanho="sm"
            disabled={!podeCriar}
            onClick={() => {
              if (!podeCriar) return;
              aoCriar({ nome: nome.trim(), modelo, clienteId: cliente });
              definirNome("");
            }}
          >
            Criar planilha
          </Botao>
          <Botao variante="linha" tamanho="sm" onClick={aoFechar}>
            Cancelar
          </Botao>
          <p className="ml-auto text-[0.75rem] text-[var(--tinta-fraca)]">
            Abre no editor. Nada é baixado.
          </p>
        </div>
      </div>
    </div>
  );
}

