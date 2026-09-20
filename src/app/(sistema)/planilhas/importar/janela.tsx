"use client";

import { useMemo, useState } from "react";
import { Aviso, EstadoVazio } from "@/components/ui/superficie";
import { Botao } from "@/components/ui/botao";
import { cn } from "@/lib/utils/cn";
import { PreviaDaPlanilha } from "@/components/ui/previa-tabular";
import { leitorLocal } from "@/lib/planilhas/importacao/leitor-local";
import {
  aplicarCorrecoes,
  gradeDaImportacao,
  type AjustesDaLinha,
  type AjustesDoCabecalho,
  type CorrecaoDeTexto,
  type DadosParaGerar,
} from "@/lib/planilhas/importacao/para-ficha";
import { conferirDocumento, type Conferencia } from "@/lib/planilhas/importacao/validar";
import type { CabecalhoExtraido, LinhaExtraida } from "@/lib/planilhas/importacao/tipos";
import type { GradeDaPlanilha } from "@/lib/planilhas/grade";
import { EnvioDeArquivo, type ArquivoEscolhido } from "./envio";
import { TelaDeConferencia } from "./conferencia";

/**
 * A JANELA DA IMPORTAÇÃO — as quatro etapas, na ordem do briefing.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO É                                               │
 * │                                                                    │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ ETAPA 1  ARQUIVO        escolher ou arrastar                     │ │
 * │ │ ETAPA 2  LEITURA        o leitor configurado tenta ler            │ │
 * │ │ ETAPA 3  NORMALIZAÇÃO   texto vira número — sem adivinhar          │ │
 * │ │ ETAPA 4  CONFERÊNCIA    ela olha, corrige e confirma               │ │
 * │ │          CÁLCULOS       o motor de sempre, e nada mais             │ │
 * │ │          PRÉVIA         a mesma grade que vai para o Excel         │ │
 * │ │          GERAR          baixa o arquivo                            │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                    │
 * │ A janela é dona de três coisas, e só delas: as linhas lidas, as     │
 * │ correções de texto e os ajustes que ela digita. Todo o resto — a    │
 * │ validação, o cálculo, a grade — é função pura chamada a partir      │
 * │ daqui. Não há estado duplicado: reaplicar as correções e reconferir  │
 * │ dá sempre o mesmo resultado, e é por isso que corrigir uma linha pode│
 * │ mudar o nível dela para melhor OU para pior.                         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE AS CORREÇÕES SÃO APLICADAS AO DOCUMENTO, E NÃO AO RESULTADO  │
 * │                                                                      │
 * │ A ordem é: documento lido → `aplicarCorrecoes` → `conferirDocumento`. │
 * │ Ela parece invertida — ela corrige DEPOIS de ver a conferência — e é  │
 * │ a única que produz a resposta honesta.                               │
 * │                                                                      │
 * │ Corrigindo depois, o texto novo herdaria os avisos do texto velho.    │
 * │ Ela digitaria "1,50" no lugar de um "1.500" ambíguo e a marcação      │
 * │ vermelha continuaria ali, porque o aviso é do texto que já não existe. │
 * │ E o contrário: um texto novo que TAMBÉM fosse ambíguo passaria sem    │
 * │ aviso, porque ninguém o julgou.                                      │
 * │                                                                      │
 * │ Aplicando antes, o ciclo fecha: o texto muda, a validação roda outra  │
 * │ vez, e o nível passa a ser o que o texto NOVO merece — seja qual for. │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA JANELA NÃO FINGE                                         │
 * │                                                                      │
 * │ ┌──────────────────────────────────────────────────────────────────┐ │
 * │ │ "Nunca fingir análise de IA."                                     │ │
 * │ │ "Não fingir que a leitura inteligente do PDF já existe se não     │ │
 * │ │  houver serviço/modelo configurado."                              │ │
 * │ └──────────────────────────────────────────────────────────────────┘ │
 * │                                                                      │
 * │ O leitor de hoje (`leitorLocal`) responde `INDISPONIVEL`, e a etapa   │
 * │ 2 diz isso com as letras dela, na tela. A esteira continua andando     │
 * │ porque ela PODE seguir sem leitura: a conferência aceita linhas        │
 * │ digitadas à mão, e o cálculo é o mesmo. O que não acontece é o        │
 * │ sistema inventar uma tabela a partir de expressões regulares e        │
 * │ apresentá-la com a confiança de uma leitura de verdade.               │
 * │                                                                      │
 * │ A frase acima do botão de conferência diz isso sem rodeio: o que      │
 * │ aparece ali não saiu do arquivo dela.                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * AS ETAPAS, NA ORDEM EM QUE ACONTECEM.
 *
 * O tipo é derivado da lista, e não escrito duas vezes: acrescentar uma etapa
 * exige mexer num lugar só. Ver `Passos`, que desenha o trilho a partir dela.
 */
export const ETAPAS = [
  { id: "arquivo", rotulo: "Arquivo", descricao: "escolher o PDF" },
  { id: "leitura", rotulo: "Leitura", descricao: "o que deu para ler" },
  { id: "conferencia", rotulo: "Conferência", descricao: "o que você confirma" },
  { id: "previa", rotulo: "Prévia", descricao: "como o arquivo sai" },
] as const;

export type IdDaEtapa = (typeof ETAPAS)[number]["id"];

export function JanelaDaImportacao({ nomeCliente }: { nomeCliente?: string | null }) {
  const [etapa, definirEtapa] = useState<IdDaEtapa>("arquivo");
  const [escolhido, definirEscolhido] = useState<ArquivoEscolhido | null>(null);

  /*
    O DOCUMENTO LIDO, OU A RESPOSTA DE QUE NÃO HOUVE LEITURA.

    `linhas` começa vazio e não é preenchido por nenhuma heurística: enquanto
    não existir leitor configurado, o único caminho de entrada é ela digitar
    na conferência. Ver a nota grande no topo deste arquivo.
  */
  const [linhas, definirLinhas] = useState<readonly LinhaExtraida[]>([]);
  const [cabecalho, definirCabecalho] = useState<CabecalhoExtraido>(CABECALHO_VAZIO);
  const [resultado, definirResultado] = useState<
    { estado: "INDISPONIVEL" | "VAZIO" | "FALHOU"; motivo: string } | { estado: "OK" } | null
  >(null);

  const [correcoes, definirCorrecoes] = useState<readonly CorrecaoDeTexto[]>([]);
  const [ajustesDaLinha, definirAjustesDaLinha] = useState<
    Readonly<Record<number, AjustesDaLinha>>
  >({});
  const [ajustesDoCabecalho, definirAjustesDoCabecalho] = useState<AjustesDoCabecalho>({});

  /**
   * A PRÓXIMA ORDEM LIVRE PARA UMA LINHA CRIADA À MÃO.
   *
   * Ela é `-1`, `-2`, e não um número depois da última linha do documento.
   * O motivo é a colisão: a ordem é a chave de `ajustesDaLinha` e a chave de
   * `originais`, e uma linha criada à mão com o número 7 — o primeiro livre
   * depois de um documento de 6 linhas — poderia receber os ajustes de uma
   * linha 7 que aparecesse na próxima leitura. Negativa, ela não colide com
   * documento nenhum.
   *
   * E a coluna LINHA da conferência mostra o número como ele é: uma linha
   * negativa é visivelmente uma linha que não veio do papel.
   */
  const [proximaOrdem, definirProximaOrdem] = useState(-1);

  /* ── A CONFERÊNCIA, RECALCULADA A CADA CORREÇÃO ─────────────────────── */

  const conferencia: Conferencia = useMemo(
    () => conferirDocumento(cabecalho, aplicarCorrecoes(linhas, correcoes)),
    [cabecalho, linhas, correcoes]
  );

  const ajustesDeGeracao = useMemo(
    () => ({
      ajustesDoCabecalho,
      ajustesDaLinha,
    }),
    [ajustesDoCabecalho, ajustesDaLinha]
  );

  /* ── A GRADE — a mesma função pura que o servidor usa para o XLSX ───── */

  const entradaDaGrade: DadosParaGerar = useMemo(
    () => ({
      cabecalho: conferencia.cabecalho,
      linhas: conferencia.linhas,
      ...ajustesDeGeracao,
      origem: escolhido ? `documento importado (${escolhido.nome})` : "linhas digitadas na conferência",
      cliente: nomeCliente ?? null,
    }),
    [conferencia, ajustesDeGeracao, escolhido, nomeCliente]
  );

  const grade: GradeDaPlanilha = useMemo(() => gradeDaImportacao(entradaDaGrade), [entradaDaGrade]);

  /* ── AS AÇÕES ───────────────────────────────────────────────────────── */

  async function lerArquivo(arquivo: ArquivoEscolhido): Promise<void> {
    definirEscolhido(arquivo);
    definirEtapa("leitura");

    /*
      A PERGUNTA À CAMADA DE LEITURA VEM ANTES DA LEITURA.

      É o que permite dizer "não está configurado" em vez de "falhou": as duas
      levam a caminhos diferentes, e só a tela sabe de qual delas se trata.
    */
    if (!leitorLocal.disponivel()) {
      definirResultado({
        estado: "INDISPONIVEL",
        motivo: leitorLocal.motivoDaIndisponibilidade(),
      });
      return;
    }

    try {
      const saida = await leitorLocal.extract(arquivo.arquivo);
      if (saida.estado !== "OK") {
        definirResultado({ estado: saida.estado, motivo: saida.motivo });
        return;
      }
      definirLinhas(saida.documento.linhas);
      definirCabecalho(saida.documento.cabecalho);
      definirResultado({ estado: "OK" });
    } catch {
      definirResultado({
        estado: "FALHOU",
        motivo:
          "A leitura do arquivo foi interrompida. O arquivo continua o mesmo — tente escolhê-lo de novo.",
      });
    }
  }

  /**
   * A CORREÇÃO DE UM CAMPO, E OPCIONALMENTE DE VÁRIAS LINHAS DE UMA VEZ.
   *
   * `alvos` é o caminho da correção em série: quando ela aceita "aplicar também
   * nas outras", o mesmo texto vai para todas as linhas que carregavam o mesmo
   * defeito. Uma escrita, um render, e o problema inteiro resolvido.
   */
  function corrigir(correcao: CorrecaoDeTexto, alvos?: readonly number[]): void {
    const ordens = alvos && alvos.length > 0 ? [correcao.ordem, ...alvos] : [correcao.ordem];
    const chaves = new Set(ordens.map((o) => `${o}:${correcao.campo}`));

    definirCorrecoes((atuais) => {
      const restantes = atuais.filter((c) => !chaves.has(`${c.ordem}:${c.campo}`));
      return [...restantes, ...ordens.map((ordem) => ({ ...correcao, ordem }))].sort(
        (a, b) => a.ordem - b.ordem
      );
    });
  }

  /** Tirar a linha do custo é removê-la do documento conferido. */
  function removerLinha(ordem: number): void {
    definirLinhas((atuais) => atuais.filter((l) => l.ordem !== ordem));
    definirCorrecoes((atuais) => atuais.filter((c) => c.ordem !== ordem));
    definirAjustesDaLinha((atuais) => {
      const copia = { ...atuais };
      delete copia[ordem];
      return copia;
    });
  }

  /** Uma linha nova, vazia, para ela digitar o que o PDF não trouxe. */
  function acrescentarLinha(): void {
    const ordem = proximaOrdem;
    definirProximaOrdem(ordem - 1);
    definirLinhas((atuais) => [
      ...atuais,
      { descricao: null, quantidade: null, valor: null, ordem, manual: true },
    ]);
  }

  function ajustarPeso(ordem: number, campo: "pesoLimpo" | "pesoPreparado", texto: string): void {
    const unidade = unidadeDaLinha(conferencia, ordem);
    const peso = textoDaPesagem(texto, unidade);
    definirAjustesDaLinha((atuais) => {
      const daLinha = { ...(atuais[ordem] ?? {}) };
      if (peso === null) delete daLinha[campo];
      else daLinha[campo] = peso;
      return { ...atuais, [ordem]: daLinha };
    });
  }

  function ajustarCabecalho(chave: keyof AjustesDoCabecalho, texto: string): void {
    definirAjustesDoCabecalho((atuais) => {
      const copia = { ...atuais };
      if (texto.trim() === "") delete copia[chave];
      else if (chave === "rendimentoPorcoes" || chave === "porcaoGramas") {
        const n = Number(texto.replace(",", "."));
        if (!Number.isFinite(n) || n <= 0) delete copia[chave];
        else copia[chave] = n;
      } else {
        copia[chave] = texto;
      }
      return copia;
    });
  }

  /* ── A TELA ─────────────────────────────────────────────────────────── */

  const podeConferir = linhas.length > 0 || resultado?.estado === "OK";

  return (
    <div className="space-y-4">
      <Trilho
        etapa={etapa}
        aoIr={(destino) => {
          /*
            A PRÉVIA SÓ ABRE COM ALGUMA LINHA.

            Não é uma trava de segurança, é uma trava de sentido: uma grade
            montada de zero linhas mostra o cabeçalho do prato e nada mais, e
            uma tela em branco depois de "conferência" pareceria um defeito.
          */
          if (destino === "previa" && linhas.length === 0) return;
          if (destino === "conferencia" && !podeConferir) return;
          definirEtapa(destino);
        }}
        temLinhas={linhas.length > 0}
        podeConferir={podeConferir}
      />

      {etapa === "arquivo" ? (
        <SecaoDaEtapa
          numero={1}
          titulo="Arquivo"
          explicacao="O PDF da ficha, do caderno de receitas ou da planilha antiga — o que você tiver em mãos."
        >
          <EnvioDeArquivo
            escolhido={escolhido}
            aoEscolher={(a) => void lerArquivo(a)}
            aoLimpar={() => {
              definirEscolhido(null);
              definirResultado(null);
              definirLinhas([]);
              definirCorrecoes([]);
              definirEtapa("arquivo");
            }}
          />

          {linhas.length > 0 ? (
            <div className="mt-3">
              <Botao variante="secundario" tamanho="sm" onClick={() => definirEtapa("conferencia")}>
                Ir para a conferência
              </Botao>
            </div>
          ) : null}

          {/*
            O CAMINHO SEM PDF, e ele não é um consolo.

            Um recurso que só funciona com leitor configurado deixaria a tela
            sem saída hoje. Aqui ela entra na conferência com a grade vazia e
            digita — e o cálculo que sai no fim é exatamente o mesmo, porque é
            o mesmo motor.
          */}
          <div className="mt-5 border-t border-[var(--linha)] pt-4">
            <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Sem arquivo? Você pode montar a ficha digitando as linhas direto na conferência —
              o cálculo é o mesmo.
            </p>
            <div className="mt-2.5">
              <Botao
                variante="linha"
                tamanho="sm"
                onClick={() => {
                  definirEscolhido(null);
                  definirResultado(null);
                  definirEtapa("conferencia");
                }}
              >
                Digitar as linhas à mão
              </Botao>
            </div>
          </div>
        </SecaoDaEtapa>
      ) : null}

      {etapa === "leitura" ? (
        <SecaoDaEtapa
          numero={2}
          titulo="Leitura"
          explicacao="O que o sistema conseguiu tirar do arquivo — e o que ele não conseguiu."
        >
          {resultado === null ? (
            <EstadoVazio titulo="Nada foi lido ainda" descricao="Escolha um arquivo para começar." />
          ) : resultado.estado === "INDISPONIVEL" || resultado.estado === "FALHOU" ? (
            <Aviso tom={resultado.estado === "FALHOU" ? "critico" : "atencao"} titulo={leitorLocal.nome}>
              <p>{resultado.motivo}</p>
              <p className="mt-2">
                Você pode seguir para a conferência e digitar as linhas — o cálculo que sai no fim é
                o mesmo.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Botao variante="secundario" tamanho="sm" onClick={() => definirEtapa("conferencia")}>
                  Seguir para a conferência
                </Botao>
                <Botao variante="linha" tamanho="sm" onClick={() => definirEtapa("arquivo")}>
                  Trocar o arquivo
                </Botao>
              </div>
            </Aviso>
          ) : resultado.estado === "VAZIO" ? (
            <Aviso tom="atencao" titulo="O arquivo não tem texto para ler">
              <p>{resultado.motivo}</p>
            </Aviso>
          ) : (
            <Aviso tom="sucesso" titulo="Arquivo lido">
              <p>
                {linhas.length === 1 ? "1 linha" : `${linhas.length} linhas`} encontradas no
                documento. Confira na etapa seguinte — nada entra na conta sem a sua confirmação.
              </p>
              <div className="mt-3">
                <Botao variante="primario" tamanho="sm" onClick={() => definirEtapa("conferencia")}>
                  Conferir as linhas
                </Botao>
              </div>
            </Aviso>
          )}
        </SecaoDaEtapa>
      ) : null}

      {etapa === "conferencia" ? (
        <SecaoDaEtapa
          numero={3}
          titulo="Conferência"
          explicacao="O que o documento dizia, o que o sistema entendeu, e o que você decide."
        >
          {escolhido !== null && resultado?.estado !== "OK" ? (
            /*
              A FRASE QUE IMPEDE A CONFUSÃO MAIS CARA DESTA TELA.

              Ela escolheu um PDF e a tabela abaixo está vazia. Sem esta linha,
              a conclusão natural é "a leitura não achou nada" — e a leitura não
              rodou. Dizer de onde vieram as linhas é a diferença entre uma tela
              honesta e uma tela que parece quebrada.
            */
            <Aviso tom="atencao" titulo="Estas linhas não vieram do seu arquivo">
              <p>
                Nada foi extraído de <span className="font-medium">{escolhido.nome}</span>: esta
                instalação não tem leitura automática de documentos configurada. O que aparecer
                abaixo é o que você digitar — e passa pelas mesmas contas.
              </p>
            </Aviso>
          ) : null}

          <CabecalhoDoPrato
            conferencia={conferencia}
            ajustes={ajustesDoCabecalho}
            aoAjustar={ajustarCabecalho}
          />

          <TelaDeConferencia
            conferencia={conferencia}
            correcoes={correcoes}
            aoCorrigir={corrigir}
            aoRemover={removerLinha}
            aoAdicionar={acrescentarLinha}
          />

          <Pesagens
            conferencia={conferencia}
            ajustes={ajustesDaLinha}
            aoAjustar={ajustarPeso}
          />

          <div className="flex flex-wrap items-center gap-3 border-t border-[var(--linha)] pt-4">
            <Botao
              variante="primario"
              tamanho="md"
              onClick={() => definirEtapa("previa")}
              disabled={!podeConferir}
            >
              Gerar planilha
            </Botao>
            <p className="text-[0.8125rem] text-[var(--tinta-suave)]">
              Você vai ver o arquivo antes de baixar.
            </p>
          </div>
        </SecaoDaEtapa>
      ) : null}

      {etapa === "previa" ? (
        <SecaoDaEtapa
          numero={4}
          titulo="Prévia"
          explicacao="A planilha como ela vai sair. O arquivo baixado vem desta mesma grade."
        >
          <BaixarPlanilha
            grade={grade}
            nome={nomeDoArquivo(escolhido, conferencia, nomeCliente ?? null)}
          />

          <PreviaDaPlanilha
            grade={grade}
            nomeCliente={nomeCliente ?? "sem cliente vinculado"}
            altura={620}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Botao variante="linha" tamanho="sm" onClick={() => definirEtapa("conferencia")}>
              Voltar para a conferência
            </Botao>
          </div>
        </SecaoDaEtapa>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// O trilho das etapas
// ---------------------------------------------------------------------------

/**
 * AS QUATRO ETAPAS, COM A ATUAL ACESA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE UM TRILHO, E NÃO ABAS                                         │
 * │                                                                      │
 * │ Abas dizem "escolha o que ver". Estas quatro não são escolha: são      │
 * │ ordem. Ela não quer "a etapa 3", ela quer chegar ao arquivo — e o      │
 * │ trilho é o que deixa claro onde ela está e quanto falta.              │
 * │                                                                      │
 * │ E ele é o que impede o erro silencioso: quem entra direto na prévia    │
 * │ sem passar pela conferência estaria baixando uma planilha que ninguém  │
 * │ olhou. Por isso a prévia fica desabilitada enquanto não houver linha.  │
 * │                                                                      │
 * │ Clicável, para ela poder voltar sem perder nada.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function Trilho({
  etapa,
  aoIr,
  temLinhas,
  podeConferir,
}: {
  etapa: IdDaEtapa;
  aoIr: (destino: IdDaEtapa) => void;
  temLinhas: boolean;
  podeConferir: boolean;
}) {
  const indiceAtual = ETAPAS.findIndex((e) => e.id === etapa);

  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-3 py-2.5">
      {ETAPAS.map((e, i) => {
        const ativa = e.id === etapa;
        const visitada = i < indiceAtual;
        const bloqueada = (e.id === "previa" && !temLinhas) || (e.id === "conferencia" && !podeConferir);

        return (
          <li key={e.id} className="flex items-center gap-x-1">
            {i > 0 ? (
              <span
                aria-hidden
                className={cn(
                  "mx-1 h-px w-5 shrink-0",
                  visitada || ativa ? "bg-[var(--color-oliva)]" : "bg-[var(--linha)]"
                )}
              />
            ) : null}

            <button
              type="button"
              onClick={() => aoIr(e.id)}
              disabled={bloqueada}
              aria-current={ativa ? "step" : undefined}
              className={cn(
                "flex items-baseline gap-1.5 rounded-[var(--raio-sm)] px-2 py-1 transition-colors",
                "disabled:pointer-events-none disabled:opacity-35",
                ativa
                  ? "bg-[rgba(29,82,54,0.08)] text-[var(--tinta)]"
                  : "text-[var(--tinta-fraca)] hover:bg-[rgba(14,26,20,0.04)]"
              )}
            >
              <span
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-full text-[0.5625rem] tabular-nums",
                  ativa
                    ? "bg-[var(--color-medio)] text-off"
                    : visitada
                      ? "bg-[var(--color-oliva)] text-off"
                      : "border border-[var(--linha-forte)] text-[var(--tinta-fraca)]"
                )}
              >
                {i + 1}
              </span>
              <span className="text-[0.8125rem] font-medium">{e.rotulo}</span>
              <span className="hidden text-[0.75rem] text-[var(--tinta-fraca)] sm:inline">
                {e.descricao}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Uma etapa com número, título e a explicação em uma linha. */
function SecaoDaEtapa({
  numero,
  titulo,
  explicacao,
  children,
}: {
  numero: number;
  titulo: string;
  explicacao: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <h2 className="font-display text-[1.0625rem] text-[var(--tinta)]">
          <span className="mr-1.5 text-[var(--tinta-fraca)] tabular-nums">{numero}.</span>
          {titulo}
        </h2>
        <p className="text-[0.8125rem] text-[var(--tinta-suave)]">{explicacao}</p>
      </div>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// O cabeçalho do prato e as pesagens
// ---------------------------------------------------------------------------

/**
 * O NOME DO PRATO, O RENDIMENTO E A PORÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTES TRÊS SÃO DECISÃO DELA, E NÃO LEITURA DO SISTEMA        │
 * │                                                                      │
 * │ O nome do prato o documento costuma trazer, e quando não traz ela      │
 * │ escreve.                                                                 │
 * │                                                                      │
 * │ O RENDIMENTO e o PESO DA PORÇÃO são outra coisa: são decisão de        │
 * │ método. O sistema não deriva "esta receita rende 12 porções" de nada   │
 * │ que esteja no papel — é ela que sabe, e é ela que responde. Guardá-los │
 * │ aqui como campo vazio, e não com um número de reserva, é o que faz a   │
 * │ planilha mostrar "—" em vez de um rendimento inventado que mudaria     │
 * │ todo o custo por porção.                                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function CabecalhoDoPrato({
  conferencia,
  ajustes,
  aoAjustar,
}: {
  conferencia: Conferencia;
  ajustes: AjustesDoCabecalho;
  aoAjustar: (chave: keyof AjustesDoCabecalho, texto: string) => void;
}) {
  const { cabecalho } = conferencia;

  const doDocumento = (leitura: { estado: string; valor?: number }): string => {
    if (leitura.estado !== "OK") return "—";
    return String(leitura.valor ?? "—");
  };

  return (
    <div className="grid gap-3 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5 sm:grid-cols-2 lg:grid-cols-4">
      <CampoDoPrato
        rotulo="Prato"
        valor={ajustes.titulo ?? cabecalho.titulo ?? ""}
        lido={cabecalho.titulo}
        aoMudar={(t) => aoAjustar("titulo", t)}
      />
      <CampoDoPrato
        rotulo="Categoria"
        valor={ajustes.categoria ?? cabecalho.categoria ?? ""}
        lido={cabecalho.categoria}
        aoMudar={(t) => aoAjustar("categoria", t)}
      />
      <CampoDoPrato
        rotulo="Rendimento (porções)"
        valor={ajustes.rendimentoPorcoes === undefined ? "" : String(ajustes.rendimentoPorcoes)}
        lido={doDocumento(cabecalho.rendimento)}
        aoMudar={(t) => aoAjustar("rendimentoPorcoes", t)}
        numerico
      />
      <CampoDoPrato
        rotulo="Peso da porção (g)"
        valor={ajustes.porcaoGramas === undefined ? "" : String(ajustes.porcaoGramas)}
        lido={doDocumento(cabecalho.porcaoGramas)}
        aoMudar={(t) => aoAjustar("porcaoGramas", t)}
        numerico
      />
    </div>
  );
}

function CampoDoPrato({
  rotulo,
  valor,
  lido,
  aoMudar,
  numerico,
}: {
  rotulo: string;
  valor: string;
  lido: string | null;
  aoMudar: (texto: string) => void;
  numerico?: boolean;
}) {
  return (
    <label className="block min-w-0">
      <span className="block text-[0.625rem] font-semibold tracking-[0.13em] uppercase text-[var(--tinta-fraca)]">
        {rotulo}
      </span>
      <input
        type={numerico ? "number" : "text"}
        value={valor}
        placeholder={lido && lido !== "—" ? lido : "digite"}
        onChange={(e) => aoMudar(e.target.value)}
        className="mt-1 h-9 w-full rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-2.5 text-[0.875rem] text-tinta placeholder:text-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
      />
    </label>
  );
}

/**
 * AS PESAGENS QUE SÓ A BALANÇA PRODUZ.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA CAIXA PRECISA EXISTIR SEPARADA DA CONFERÊNCIA            │
 * │                                                                      │
 * │ Um PDF traz preço e quantidade de compra. Ele NÃO traz o peso depois   │
 * │ de limpar nem o peso depois de cozinhar — esses números saem da        │
 * │ balança da cozinha, e ninguém os escreve no papel.                    │
 * │                                                                      │
 * │ Sem eles, o que a planilha sabe é o preço de compra e mais nada: a     │
 * │ coluna CORREÇÃO fica vazia e o custo do quilo utilizável é o custo da  │
 * │ compra. Com eles, o motor calcula a perda, o rendimento e o custo      │
 * │ efetivo — pelas MESMAS contas da ficha digitada à mão.                 │
 * │                                                                      │
 * │ Deixar de fora não é um erro: é o estado honesto de quem ainda não      │
 * │ pesou. A caixa oferece a pergunta; ela responde se já tiver resposta.  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function Pesagens({
  conferencia,
  ajustes,
  aoAjustar,
}: {
  conferencia: Conferencia;
  ajustes: Readonly<Record<number, AjustesDaLinha>>;
  aoAjustar: (ordem: number, campo: "pesoLimpo" | "pesoPreparado", texto: string) => void;
}) {
  if (conferencia.linhas.length === 0) return null;

  return (
    <details className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)]">
      <summary className="cursor-pointer px-4 py-3">
        <span className="text-[0.875rem] font-medium text-[var(--tinta)]">
          Pesagens da balança
        </span>
        <span className="ml-2 text-[0.8125rem] text-[var(--tinta-suave)]">
          opcional — só se você já pesou
        </span>
      </summary>

      <div className="border-t border-[var(--linha)] px-4 py-3.5">
        <p className="mb-3 max-w-[78ch] text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          O documento traz o preço e o peso da compra. O peso depois de limpar e o peso depois de
          preparar saem da balança, e é com eles que o sistema calcula a perda, o rendimento e o
          custo por quilo utilizável. Deixe em branco o que você não mediu — o sistema mostra “—”
          em vez de supor.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-[0.8125rem]">
            <thead>
              <tr className="border-b border-[var(--linha-forte)]">
                {["LINHA", "INSUMO", "PESO DA COMPRA", "PESO LIMPO", "PESO PREPARADO"].map((t) => (
                  <th
                    key={t}
                    scope="col"
                    className="px-3 py-2 text-left text-[0.625rem] font-semibold tracking-[0.1em] uppercase text-[var(--tinta-fraca)]"
                  >
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conferencia.linhas.map((linha) => {
                const da = ajustes[linha.ordem] ?? {};
                return (
                  <tr key={linha.ordem} className="border-b border-[var(--linha)] last:border-b-0">
                    <td className="px-3 py-2 tabular-nums text-[var(--tinta-fraca)]">{linha.ordem}</td>
                    <td className="px-3 py-2 text-[var(--tinta)]">{linha.descricao ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums text-[var(--tinta-suave)]">
                      {textoDaCompra(linha)}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={da.pesoLimpo == null ? "" : String(da.pesoLimpo.peso)}
                        onChange={(e) => aoAjustar(linha.ordem, "pesoLimpo", e.target.value)}
                        className="h-8 w-28 rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-2 text-right tabular-nums text-tinta focus:border-oliva focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={da.pesoPreparado == null ? "" : String(da.pesoPreparado.peso)}
                        onChange={(e) => aoAjustar(linha.ordem, "pesoPreparado", e.target.value)}
                        className="h-8 w-28 rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-2 text-right tabular-nums text-tinta focus:border-oliva focus:bg-white focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

/** O peso de compra como o documento o trouxe, escrito. */
function textoDaCompra(linha: Conferencia["linhas"][number]): string {
  const leitura = linha.leituraQuantidade;
  if (leitura.estado !== "OK") return "—";
  const { valor, unidade } = leitura.valor;
  return `${valor}${unidade === null ? "" : ` ${unidade}`}`;
}

/** A unidade da linha, para a pesagem entrar na mesma grandeza. */
function unidadeDaLinha(conferencia: Conferencia, ordem: number): string | null {
  const linha = conferencia.linhas.find((l) => l.ordem === ordem);
  if (linha === undefined) return null;
  return linha.leituraQuantidade.estado === "OK" ? linha.leituraQuantidade.valor.unidade : null;
}

/**
 * O QUE ELA DIGITOU VIROU UMA MEDIÇÃO?
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A UNIDADE VEM DA LINHA, E O NÚMERO NÃO VEM DO CHUTE           │
 * │                                                                      │
 * │ `Transformacao` guarda peso COM unidade, porque "4" sem unidade não   │
 * │ é uma medição — é um número. A unidade da linha é a única resposta    │
 * │ disponível: se ela comprou em quilo, o que sai da balança também é    │
 * │ quilo, e não há segunda opção a menos que ela declare uma.            │
 * │                                                                      │
 * │ Sem unidade na linha, a pesagem NÃO vira medição: guardar "4" com     │
 * │ unidade inventada faria o motor comparar quilo com grama e produzir   │
 * │ um rendimento absurdo, apresentado com a confiança de um cálculo.      │
 * │                                                                      │
 * │ Zero também não é medição: é a balança ligada em vazio, ou um campo    │
 * │ que ficou com o "0" de fábrica.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function textoDaPesagem(texto: string, unidade: string | null): { peso: number; unidade: string } | null {
  if (texto.trim() === "") return null;
  if (unidade === null || unidade.trim() === "") return null;
  const peso = Number(texto.replace(",", "."));
  if (!Number.isFinite(peso) || peso <= 0) return null;
  return { peso, unidade };
}

/** O nome do arquivo que vai ser baixado. */
function nomeDoArquivo(
  escolhido: ArquivoEscolhido | null,
  conferencia: Conferencia,
  cliente: string | null
): string {
  const prato = conferencia.cabecalho.titulo;
  if (prato && prato.trim() !== "") return prato.trim();
  if (escolhido) return escolhido.nome.replace(/\.pdf$/i, "");
  if (cliente) return `Ficha — ${cliente}`;
  return "Ficha importada";
}

// ---------------------------------------------------------------------------
// O download
// ---------------------------------------------------------------------------

/**
 * O BOTÃO DE BAIXAR — e ele manda a GRADE, não um segundo modelo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A GARANTIA DE QUE A TELA E O ARQUIVO SÃO O MESMO                      │
 * │                                                                      │
 * │ A rota `/api/planilhas/importada` recebe esta `grade` — a mesma que a  │
 * │ prévia acabou de desenhar — e a escreve com ExcelJS. Não há caminho    │
 * │ paralelo que monte a planilha de novo no servidor: se houvesse, os     │
 * │ dois divergiriam no dia em que o modelo mudasse, e o arquivo baixado   │
 * │ deixaria de ser o que ela conferiu na tela.                            │
 * │                                                                      │
 * │ Por isso o botão mora AQUI, ao lado da prévia, e não na conferência:   │
 * │ quem baixa é quem está olhando o arquivo.                             │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function BaixarPlanilha({ grade, nome }: { grade: GradeDaPlanilha; nome: string }) {
  const [estado, definirEstado] = useState<"parado" | "gerando" | "erro">("parado");
  const [mensagem, definirMensagem] = useState<string | null>(null);

  async function baixar(): Promise<void> {
    definirEstado("gerando");
    definirMensagem(null);

    try {
      const resposta = await fetch("/api/planilhas/importada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, nome }),
      });

      if (!resposta.ok) {
        definirEstado("erro");
        definirMensagem(await leituraDoErro(resposta));
        return;
      }

      /*
        O MESMO CUIDADO DO OUTRO BOTÃO DE DOWNLOAD, E PELO MESMO MOTIVO.

        O middleware protege `/api/...`: sem sessão, ele redireciona para
        `/entrar`, e um redirecionamento seguido pelo `fetch` termina em 200
        com HTML no corpo. Sem esta checagem, o navegador gravaria um arquivo
        de nome ".xlsx" que é uma página de login por dentro — e o Excel
        abriria com erro de formato, levando a conclusão de que a planilha
        está quebrada.
      */
      const tipo = resposta.headers.get("Content-Type") ?? "";
      if (!tipo.includes("spreadsheet")) {
        definirEstado("erro");
        definirMensagem(
          "O download voltou em vez do arquivo — provavelmente a sua sessão expirou. Entre de novo e repita; nada do que você conferiu se perdeu."
        );
        return;
      }

      const arquivo = await resposta.blob();
      const url = URL.createObjectURL(arquivo);
      const link = document.createElement("a");
      link.href = url;
      link.download = nomeDeDownload(resposta, nome);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      definirEstado("parado");
    } catch {
      definirEstado("erro");
      definirMensagem(
        "Não foi possível baixar o arquivo. Verifique a conexão e tente de novo — o que você conferiu continua aqui."
      );
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3">
      <Botao
        variante="primario"
        tamanho="md"
        onClick={() => void baixar()}
        disabled={estado === "gerando"}
      >
        {estado === "gerando" ? "Gerando…" : "Baixar XLSX"}
      </Botao>

      <p className="min-w-0 flex-1 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
        {mensagem ??
          "O arquivo sai com filtro no cabeçalho, painel congelado e valores formatados — igual ao que você está vendo acima."}
      </p>
    </div>
  );
}

/** O nome que veio no `Content-Disposition`, quando o servidor mandou um. */
function nomeDeDownload(resposta: Response, reserva: string): string {
  const disposicao = resposta.headers.get("Content-Disposition") ?? "";
  const achado = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposicao);
  if (achado?.[1]) {
    try {
      return decodeURIComponent(achado[1]);
    } catch {
      return achado[1];
    }
  }
  return `${reserva}.xlsx`;
}

/** A mensagem de erro que o servidor mandou, escrita para ela. */
async function leituraDoErro(resposta: Response): Promise<string> {
  try {
    const corpo = (await resposta.json()) as { erro?: unknown; detalhe?: unknown };
    const erro = typeof corpo.erro === "string" ? corpo.erro : "";
    const detalhe = typeof corpo.detalhe === "string" ? corpo.detalhe : "";
    if (erro && detalhe) return `${erro} ${detalhe}`;
    if (erro) return erro;
  } catch {
    /* O corpo não era JSON. Cai na frase de reserva abaixo. */
  }
  return `A geração falhou (${resposta.status}) e o servidor não devolveu detalhe.`;
}

/** Um documento sem cabeçalho nenhum — o estado inicial de uma ficha digitada. */
const CABECALHO_VAZIO: CabecalhoExtraido = {
  titulo: null,
  categoria: null,
  rendimento: null,
  porcaoGramas: null,
};
