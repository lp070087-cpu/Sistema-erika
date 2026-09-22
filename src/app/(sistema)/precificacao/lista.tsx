"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Etiqueta } from "@/components/ui/indicador";
import { BotaoLink } from "@/components/ui/botao";
import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import { BarraFiltros } from "@/components/ui/filtros";
import { ListaResponsiva } from "@/components/ui/lista-responsiva";
import type { ColunaLista } from "@/components/ui/lista-responsiva";
import { useAcervoVivo } from "@/components/operacao/use-acervo";
import type { CenarioDoAcervo } from "@/components/operacao/use-acervo";
import {
  ROTULO_ESTADO_COMERCIAL,
  TOM_ESTADO_COMERCIAL,
  linhaDePrecificacao,
  markupEmTexto,
  numeroFixo,
  resumirPrecificacao,
  somarCustos,
  somarPrecos,
  valorEmReais,
} from "@/lib/dados";
import type { LinhaPrecificacao, ParametrosComerciais } from "@/lib/dados";
import { DetalheDePrecificacao } from "./detalhe";

/**
 * PRECIFICAÇÃO E CMV — todos os pratos de um cliente, lado a lado.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA TELA NÃO ESCREVE NENHUMA FÓRMULA                                │
 * │                                                                      │
 * │ Custo, custo por porção, CMV, markup, sobra e preço sugerido saem de  │
 * │ `custos-ficha` e `indicadores-comerciais`, pela montagem de           │
 * │ `linhaDePrecificacao`. Aqui só há exibição.                           │
 * │                                                                      │
 * │ A tentação era calcular o CMV direto na coluna — é uma divisão de uma │
 * │ linha. O problema aparece seis meses depois, quando alguém ajusta a   │
 * │ regra no domínio e esquece esta tela: a coluna passa a mostrar um CMV │
 * │ que nenhum outro lugar do sistema reconhece, com a mesma aparência de │
 * │ número certo.                                                         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CUSTO DESTA LISTA É O MESMO DA FICHA                               │
 * │                                                                      │
 * │ A sobreposição da sessão — preço de insumo atualizado hoje, preço     │
 * │ por cliente, ficha criada agora — vem de `useAcervoVivo`, que é o      │
 * │ mesmo caminho que a lista de fichas usa. Sem ele, esta tela mostraria │
 * │ o custo do cenário e a ficha mostraria outro, e as duas estariam      │
 * │ certas dentro de si.                                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * A LINHA COMO A LISTA GENÉRICA A ENTENDE.
 *
 * `ListaResponsiva` exige um `id` na linha, para servir de chave. Um prato
 * não tem `id` próprio — o dele é o da ficha. Em vez de duplicar o campo no
 * domínio só para agradar a lista, o `id` é derivado aqui, no ponto em que a
 * exigência aparece.
 */
type LinhaDaTela = LinhaPrecificacao & { id: string };

export function ListaDePrecificacao({ doCenario }: { doCenario: CenarioDoAcervo }) {
  const { clientePorId, acervo, resolver } = useAcervoVivo(doCenario);

  const [busca, setBusca] = useState("");
  const [cliente, setCliente] = useState("");
  const [categoria, setCategoria] = useState("");
  const [situacao, setSituacao] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);

  /*
    ── TODAS AS LINHAS, MONTADAS UMA VEZ ──────────────────────────────────
    `resolver` e `linhaDePrecificacao` percorrem N fichas × M insumos, como
    já acontece no acervo de fichas. Guardar aqui, e não recalcular por
    coluna, evita resolver a mesma ficha seis vezes por render.
  */
  const linhas = useMemo<LinhaDaTela[]>(
    () =>
      acervo.map((f) => ({
        ...linhaDePrecificacao(f, resolver(f)),
        id: f.id,
      })),
    [acervo, resolver]
  );

  const categorias = useMemo(
    () =>
      [...new Set(acervo.map((f) => f.categoria))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [acervo]
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return linhas.filter((l) => {
      if (cliente && l.ficha.clienteId !== cliente) return false;
      if (categoria && l.ficha.categoria !== categoria) return false;
      if (situacao && l.ficha.situacao !== situacao) return false;
      if (termo) {
        const dono = clientePorId.get(l.ficha.clienteId);
        const alvo = `${l.ficha.nome} ${l.ficha.categoria} ${dono?.nomeFantasia ?? ""}`.toLowerCase();
        if (!alvo.includes(termo)) return false;
      }
      return true;
    });
  }, [linhas, busca, cliente, categoria, situacao, clientePorId]);

  const resumo = useMemo(() => resumirPrecificacao(filtradas), [filtradas]);
  const custos = useMemo(() => somarCustos(filtradas), [filtradas]);
  const precos = useMemo(() => somarPrecos(filtradas), [filtradas]);

  const linhaAberta = useMemo(
    () => linhas.find((l) => l.ficha.id === aberta) ?? null,
    [linhas, aberta]
  );

  const colunas: ColunaLista<LinhaDaTela>[] = [
    {
      chave: "prato",
      titulo: "Prato",
      destaque: true,
      noCartao: "topo",
      valor: (l) => (
        <>
          <span className="text-[0.9375rem] font-medium text-tinta">{l.ficha.nome}</span>
          <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
            {l.ficha.categoria}
          </span>
        </>
      ),
    },
    {
      chave: "cliente",
      titulo: "Cliente",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) => {
        const dono = clientePorId.get(l.ficha.clienteId);
        return dono ? (
          <Link href={`/clientes/${dono.id}`} className="text-[0.875rem] text-oliva hover:underline">
            {dono.nomeFantasia}
          </Link>
        ) : (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">—</span>
        );
      },
    },
    {
      chave: "custo",
      titulo: "Custo",
      align: "dir",
      noCartao: "linha",
      valor: (l) =>
        l.custo.vazio ? (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem linhas</span>
        ) : (
          <span className="tabular text-[0.9375rem] text-tinta">
            {valorEmReais(l.custo.custoTotal)}
            {l.custo.completo ? (
              <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                {l.custo.custoPorPorcao === null
                  ? "sem rendimento"
                  : `${valorEmReais(l.custo.custoPorPorcao)} / porção`}
              </span>
            ) : (
              <span className="mt-0.5 block text-[0.75rem] text-[#8a6d1f]">
                piso — {l.custo.itensFora} fora
              </span>
            )}
          </span>
        ),
    },
    {
      chave: "preco",
      titulo: "Preço de venda",
      align: "dir",
      noCartao: "linha",
      valor: (l) =>
        l.ficha.precoVenda === null || l.ficha.precoVenda === undefined ? (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">não informado</span>
        ) : (
          <span className="tabular text-[0.9375rem] text-tinta">
            {valorEmReais(l.ficha.precoVenda)}
          </span>
        ),
    },
    {
      chave: "markup",
      titulo: "Markup",
      align: "dir",
      ocultaEm: "lg",
      noCartao: "linha",
      valor: (l) =>
        l.comercial.venda === null ? (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">—</span>
        ) : (
          <span className="tabular text-[0.9375rem] text-tinta">
            {markupEmTexto(l.comercial.venda.markup)}
          </span>
        ),
    },
    {
      chave: "cmv",
      titulo: "CMV",
      align: "dir",
      noCartao: "linha",
      valor: (l) =>
        l.comercial.venda === null ? (
          <span className="text-[0.875rem] text-[var(--tinta-fraca)]">—</span>
        ) : (
          <span className="tabular text-[0.9375rem] text-tinta">
            {numeroFixo(l.comercial.venda.cmvPct, 1)}%
            <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
              {l.comercial.margemAplicadaPct === null ? "custo medido" : "custo com margem"}
            </span>
          </span>
        ),
    },
    {
      chave: "estado",
      titulo: "Situação",
      noCartao: "linha",
      valor: (l) => (
        <Etiqueta tom={TOM_ESTADO_COMERCIAL[l.estado]}>{ROTULO_ESTADO_COMERCIAL[l.estado]}</Etiqueta>
      ),
    },
    {
      chave: "acao",
      titulo: "",
      noCartao: "linha",
      valor: (l) => (
        <button
          type="button"
          onClick={() => setAberta(l.ficha.id)}
          className="text-[0.8125rem] text-oliva underline-offset-4 hover:underline"
        >
          Abrir precificação
        </button>
      ),
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        <BotaoLink href="/fichas" variante="secundario" tamanho="sm">
          Ver fichas técnicas
        </BotaoLink>
      </div>

      {/*
        ── AS CONTAGENS ───────────────────────────────────────────────────
        Números que se conferem contra a lista abaixo. São CONTAGENS, não
        indicadores: não há "CMV médio" aqui, pelo motivo que `resumirPrecificacao`
        documenta — média de percentual não descreve prato nenhum, e sem os
        parâmetros dela não existe referência contra a qual comparar.
      */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Contagem rotulo="Pratos" valor={resumo.pratos} />
        <Contagem rotulo="Com preço informado" valor={resumo.comPreco} tom="verde" />
        <Contagem rotulo="Sem preço informado" valor={resumo.semPreco} tom="dourado" />
        <Contagem
          rotulo="Preço abaixo do custo"
          valor={resumo.abaixoDoCusto}
          tom={resumo.abaixoDoCusto > 0 ? "critico" : undefined}
        />
      </div>

      {resumo.abaixoDoCusto > 0 ? (
        <Aviso tom="critico" titulo="Há prato com preço abaixo do custo">
          {resumo.abaixoDoCusto === 1
            ? "Um prato"
            : `${resumo.abaixoDoCusto} pratos`}{" "}
          {resumo.abaixoDoCusto === 1 ? "tem" : "têm"} preço de venda menor do que o custo somado
          da ficha. É uma constatação aritmética — o sistema não diz qual preço deveria ser
          praticado.
        </Aviso>
      ) : null}

      <Secao
        rotulo={`${filtradas.length} de ${linhas.length}`}
        titulo="Pratos"
        descricao="O custo vem da ficha técnica e o preço de venda é o declarado. Sem um dos dois, o CMV não aparece — e é assim de propósito: um número calculado sobre dado faltante teria a mesma aparência de um número certo."
      >
        <BarraFiltros
          base="/precificacao"
          valores={{ q: busca, cliente, categoria, situacao }}
          busca="q"
          placeholderBusca="Prato, categoria ou cliente…"
          selecoes={[
            {
              chave: "cliente",
              rotulo: "Cliente",
              opcoes: doCenario.clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia })),
            },
            {
              chave: "categoria",
              rotulo: "Categoria",
              opcoes: categorias.map((c) => ({ valor: c, texto: c })),
            },
            {
              chave: "situacao",
              rotulo: "Situação da ficha",
              opcoes: [
                { valor: "COMPLETA", texto: "Completa" },
                { valor: "AGUARDANDO_DADOS", texto: "Aguardando dados" },
                { valor: "EM_REVISAO", texto: "Em revisão" },
              ],
            },
          ]}
        />

        <div className="mt-5">
          <ListaResponsiva
            itens={filtradas}
            colunas={colunas}
            vazio={
              linhas.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhuma ficha técnica no acervo"
                  descricao="A precificação trabalha sobre fichas técnicas existentes: é delas que sai o custo de cada prato. Crie a primeira ficha para que os pratos apareçam aqui."
                  acao={
                    <BotaoLink href="/fichas" variante="primario" tamanho="sm">
                      Ir para fichas técnicas
                    </BotaoLink>
                  }
                />
              ) : (
                <EstadoVazio
                  titulo="Nenhum prato com esses filtros"
                  descricao="Existem pratos no acervo, mas nenhum bate com a combinação atual."
                  acao={
                    <button
                      type="button"
                      onClick={() => {
                        setBusca("");
                        setCliente("");
                        setCategoria("");
                        setSituacao("");
                      }}
                      className="text-[0.8125rem] text-oliva hover:text-tinta"
                    >
                      Limpar os filtros
                    </button>
                  }
                />
              )
            }
          />
        </div>
      </Secao>

      {/*
        ── AS SOMAS, E O QUE ELAS NÃO SÃO ─────────────────────────────────
        `somarPrecos` soma preços CADASTRADOS. Chamar isso de faturamento
        seria a troca mais fácil de fazer e a mais enganosa: não há venda
        nenhuma atrás, e a consultora poderia tomar decisão de preço achando
        que estava olhando receita.
      */}
      <Secao
        titulo="Somas do conjunto filtrado"
        descricao="Somas de valores declarados — não há projeção, venda nem projeção de receita aqui."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--raio)] border border-[var(--linha)] px-4 py-3.5">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Custo somado
            </p>
            <p className="mt-1.5 tabular text-[1.375rem] text-tinta">
              {valorEmReais(custos.total)}
            </p>
            <p className="mt-1 text-[0.8125rem] text-[var(--tinta-suave)]">
              {custos.pratosSomados} de {filtradas.length}{" "}
              {custos.pratosFora === 0
                ? "pratos somados"
                : `pratos — ${custos.pratosFora} fora, por custo não fechado`}
            </p>
          </div>
          <div className="rounded-[var(--raio)] border border-[var(--linha)] px-4 py-3.5">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Preços de venda cadastrados
            </p>
            <p className="mt-1.5 tabular text-[1.375rem] text-tinta">
              {valorEmReais(precos.total)}
            </p>
            <p className="mt-1 text-[0.8125rem] text-[var(--tinta-suave)]">
              {precos.pratosComPreco} com preço
              {precos.pratosSemPreco > 0 ? ` · ${precos.pratosSemPreco} sem preço` : ""}
            </p>
          </div>
        </div>
      </Secao>

      <DetalheDePrecificacao
        linha={linhaAberta}
        cliente={linhaAberta ? (clientePorId.get(linhaAberta.ficha.clienteId) ?? null) : null}
        parametrosDoCliente={PARAMETROS_DO_CLIENTE}
        aoFechar={() => setAberta(null)}
      />
    </>
  );
}

/**
 * OS PARÂMETROS DA CASA — hoje ausentes, e o nome disso importa.
 *
 * Não existe, em lugar nenhum do sistema, um CMV alvo por cliente: o campo
 * não foi modelado porque a decisão não foi tomada. Esta constante é o
 * ponto único para o dia em que ela for — e, até lá, é `null`.
 *
 * `null` e não `{}` de propósito: `{}` afirma "este cliente não tem
 * parâmetros", `null` diz "o sistema não sabe se ele tem". É a mesma
 * distinção entre zero decidido e campo ausente que o resto do projeto
 * respeita — e é o que permite a gaveta distinguir "a ficha não declarou"
 * de "a casa não tem regra".
 */
const PARAMETROS_DO_CLIENTE: ParametrosComerciais | null = null;

function Contagem({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: number;
  tom?: "dourado" | "verde" | "critico";
}) {
  const cor =
    valor === 0
      ? "text-[var(--tinta-fraca)]"
      : tom === "dourado"
        ? "text-[#8a6d1f]"
        : tom === "verde"
          ? "text-medio"
          : tom === "critico"
            ? "text-red-800"
            : "text-tinta";

  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5">
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </p>
      <p className={`mt-1.5 tabular text-[1.5rem] leading-none ${cor}`}>{valor}</p>
    </div>
  );
}
