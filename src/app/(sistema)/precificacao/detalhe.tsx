"use client";

import { useMemo, useState } from "react";
import { Aviso, EstadoVazio, Painel, Secao } from "@/components/ui/superficie";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Etiqueta, Indicador } from "@/components/ui/indicador";
import { Gaveta } from "@/components/ui/gaveta";
import { useAvisoDeAcao, FaixaDeAcao } from "@/components/ui/aviso-acao";
import {
  ACAO_DA_PENDENCIA,
  markupEmTexto,
  numeroFixo,
  quadroComercial,
  valorEmReais,
} from "@/lib/dados";
import type {
  ClienteOperacao as Cliente,
  IndicadoresDeVenda,
  LinhaPrecificacao,
  ParametrosComerciais,
  PrecoSugerido,
} from "@/lib/dados";
import { salvarCabecalhoDaFicha } from "@/lib/dados/demonstracao";

/**
 * O DETALHE DE UM PRATO — o custo por dentro, e a simulação de preço.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A SIMULAÇÃO NÃO ESCREVE NADA                                         │
 * │                                                                      │
 * │ Digitar um preço aqui recalcula CMV e markup NA TELA, na hora, contra │
 * │ os mesmos módulos de domínio que o resto do sistema usa. Nada é        │
 * │ gravado enquanto ela não clicar em "Usar este preço".                  │
 * │                                                                      │
 * │ É a diferença entre experimentar e decidir. Se cada tecla gravasse,   │
 * │ ela não teria como testar "e se eu cobrasse 34,90?" sem deixar a      │
 * │ ficha alterada — e o histórico encheria de preços que nunca          │
 * │ existiram na prática.                                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ GRAVAR É UMA AÇÃO EXPLÍCITA, E O RECADO DIZ O QUE FOI GRAVADO        │
 * │                                                                      │
 * │ O aviso depois de salvar não é "Salvo com sucesso" — é "Preço de      │
 * │ venda R$ 34,90 gravado nesta sessão". A frase nomeia o número e diz   │
 * │ onde ele vive, porque a demonstração NÃO é persistência: recarregar a │
 * │ página apaga. Prometer "salvo" aqui seria a mentira mais fácil de     │
 * │ escrever e a mais cara de descobrir.                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export function DetalheDePrecificacao({
  linha,
  cliente,
  parametrosDoCliente,
  aoFechar,
}: {
  linha: LinhaPrecificacao | null;
  cliente: Cliente | null;
  /** O padrão da casa deste cliente, quando existir. A ficha ganha dele. */
  parametrosDoCliente: ParametrosComerciais | null;
  aoFechar: () => void;
}) {
  const { aviso, anunciar, dispensar } = useAvisoDeAcao();

  const ficha = linha?.ficha ?? null;

  /*
    Os parâmetros que valem: os da ficha quando ela declarou algum; senão o
    padrão do cliente; senão o vazio. A precedência é da ficha, porque é ela
    que representa aquele prato — a regra da casa é o ponto de partida, não
    a palavra final.
  */
  const parametros = useMemo(() => {
    if (ficha?.parametros && Object.keys(ficha.parametros).length > 0) {
      return ficha.parametros;
    }
    return parametrosDoCliente ?? {};
  }, [ficha, parametrosDoCliente]);

  const precoGravado = ficha?.precoVenda ?? null;

  /*
    O preço em edição começa no gravado e só existe nesta tela. `null`
    significa "campo vazio", e é diferente de zero: zero é um preço que ela
    decidiu, vazio é um preço que ela ainda não disse.
  */
  const [rascunhoDePreco, definirRascunhoDePreco] = useState<string | null>(null);
  const textoDoPreco =
    rascunhoDePreco ?? (precoGravado === null ? "" : numeroFixo(precoGravado, 2));

  /* A mesma leitura que a ficha usa: vírgula ou ponto, e vazio vira null. */
  const precoSimulado = useMemo(() => {
    const texto = textoDoPreco.trim();
    if (texto === "") return null;
    const n = Number(texto.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [textoDoPreco]);

  /*
    O quadro da SIMULAÇÃO, recalculado pelo domínio a cada tecla. Se o preço
    digitado for igual ao gravado, o resultado é idêntico ao da lista — e é
    assim que deve ser: a simulação é o mesmo cálculo, não um cálculo
    paralelo que poderia divergir.
  */
  const simulado = useMemo(
    () => quadroComercial(linha?.custo.completo ? linha.custo.custoTotal : null, precoSimulado, parametros),
    [linha, precoSimulado, parametros]
  );

  const houveMudanca = precoGravado !== null && simulado.precoVenda !== precoGravado;

  function usarEstePreco() {
    if (!ficha || precoSimulado === null) return;
    salvarCabecalhoDaFicha(ficha.id, { precoVenda: precoSimulado });
    anunciar(
      `Preço de venda ${valorEmReais(precoSimulado)} gravado nesta sessão. Enquanto o banco não está conectado, recarregar a página devolve o valor anterior.`
    );
    definirRascunhoDePreco(null);
  }

  function limparPreco() {
    if (!ficha) return;
    salvarCabecalhoDaFicha(ficha.id, { precoVenda: null });
    definirRascunhoDePreco(null);
    anunciar("Preço de venda removido nesta sessão. O custo continua calculado.");
  }

  return (
    <Gaveta
      aberta={linha !== null}
      aoFechar={aoFechar}
      titulo={ficha?.nome ?? ""}
      descricao={
        cliente
          ? `${cliente.nomeFantasia} · ${ficha?.categoria ?? ""}`
          : (ficha?.categoria ?? "")
      }
      acoes={
        <>
          <Botao variante="fantasma" tamanho="sm" type="button" onClick={aoFechar}>
            Fechar
          </Botao>
          <Botao
            variante="primario"
            tamanho="sm"
            type="button"
            onClick={usarEstePreco}
            disabled={precoSimulado === null || (precoGravado !== null && !houveMudanca)}
          >
            Usar este preço
          </Botao>
        </>
      }
    >
      {linha === null ? null : (
        <div className="space-y-5">
          <FaixaDeAcao aviso={aviso} aoFechar={dispensar} />

          {/* ── O CUSTO, POR DENTRO ──────────────────────────────────────── */}
          <Secao titulo="O que a ficha consome">
            {linha.custo.vazio ? (
              <EstadoVazio
                titulo="Nenhuma linha somável"
                descricao="Esta ficha não tem linhas que possam entrar na conta — ou nenhuma foi preenchida ainda."
              />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Indicador
                    rotulo="Custo da ficha"
                    valor={valorEmReais(linha.custo.custoTotal)}
                    contexto={
                      linha.custo.completo
                        ? `${linha.custo.itensSomados} de ${ficha?.itens.length ?? 0} linhas`
                        : `parcial — ${linha.custo.itensFora} fora da soma`
                    }
                    tom={linha.custo.completo ? "neutro" : "atencao"}
                  />
                  <Indicador
                    rotulo="Por porção"
                    valor={
                      linha.custo.custoPorPorcao === null
                        ? "—"
                        : valorEmReais(linha.custo.custoPorPorcao)
                    }
                    contexto={
                      linha.custo.custoPorPorcao === null
                        ? "falta o rendimento ou fechar a soma"
                        : `${ficha?.rendimentoPorcoes ?? 0} porções`
                    }
                  />
                  <Indicador
                    rotulo="Rendimento"
                    valor={ficha?.rendimentoPorcoes ?? "—"}
                    unidade={ficha?.rendimentoPorcoes === null ? undefined : "porções"}
                    contexto={
                      ficha?.porcaoGramas === null || ficha?.porcaoGramas === undefined
                        ? "peso da porção não declarado"
                        : `${ficha.porcaoGramas} g cada`
                    }
                  />
                </div>

                {!linha.custo.completo ? (
                  <Aviso tom="atencao" className="mt-4">
                    O total acima é um PISO, e não o custo do prato.{" "}
                    {linha.custo.itensFora === 1
                      ? "Uma linha ficou fora da soma"
                      : `${linha.custo.itensFora} linhas ficaram fora da soma`}{" "}
                    — e é por isso que o CMV não aparece: calculado sobre um piso, ele sairia
                    otimista.
                  </Aviso>
                ) : null}
              </>
            )}
          </Secao>

          {/* ── A SIMULAÇÃO ──────────────────────────────────────────────── */}
          <Secao
            titulo="Simulação de preço"
            descricao="Digite um preço para ver o que ele implica. Nada é gravado até você usar o botão."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                label="Preço de venda"
                name="preco-simulado"
                inputMode="decimal"
                placeholder="0,00"
                value={textoDoPreco}
                onChange={(e) => definirRascunhoDePreco(e.target.value)}
                ajuda="Aceita vírgula ou ponto. Vazio significa que o preço ainda não foi decidido."
              />
              <div className="flex items-end gap-2.5">
                <Botao
                  variante="secundario"
                  tamanho="sm"
                  type="button"
                  onClick={() => definirRascunhoDePreco("")}
                >
                  Limpar o campo
                </Botao>
                {precoGravado !== null ? (
                  <Botao variante="fantasma" tamanho="sm" type="button" onClick={limparPreco}>
                    Remover o preço gravado
                  </Botao>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <QuadroDaSimulacao
                indicadores={simulado.venda}
                precosAlvo={simulado.precosAlvo}
                custoDaVenda={simulado.custoComMargem ?? simulado.custoMedido}
                temMargem={simulado.margemAplicadaPct !== null}
                houveMudanca={houveMudanca}
                precoGravado={precoGravado}
              />
            </div>
          </Secao>

          {/* ── O QUE FALTA ──────────────────────────────────────────────── */}
          {linha.pendencias.length > 0 ? (
            <Secao
              titulo="O que falta nesta linha"
              descricao="Cada item é uma decisão que ainda não foi tomada — nenhuma delas é o sistema que toma."
            >
              <ul className="space-y-2.5">
                {linha.pendencias.map((p) => (
                  <li key={p} className="flex items-baseline justify-between gap-4">
                    <span className="text-[0.875rem] text-[var(--tinta-suave)]">
                      {ACAO_DA_PENDENCIA[p]}
                    </span>
                    <Etiqueta tom={p === "SEM_PARAMETROS" ? "dourado" : "neutro"}>
                      {p.replace(/_/g, " ").toLowerCase()}
                    </Etiqueta>
                  </li>
                ))}
              </ul>
            </Secao>
          ) : null}

          {/* ── A PORTA PARA A FICHA ─────────────────────────────────────── */}
          <Painel className="flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-[46ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              O custo deste prato não nasce aqui: ele vem da ficha técnica. Alterar quantidades,
              pesos e insumos acontece lá.
            </p>
            <a
              href={`/fichas/${ficha?.id ?? ""}`}
              className="text-[0.875rem] text-oliva underline-offset-4 hover:underline"
            >
              Abrir a ficha técnica
            </a>
          </Painel>
        </div>
      )}
    </Gaveta>
  );
}

/**
 * O QUADRO DE NÚMEROS DA SIMULAÇÃO.
 *
 * Ele mostra o CUSTO QUE GEROU o CMV junto do CMV. Sem isso, um CMV sobre
 * custo com margem e o mesmo CMV sobre custo medido apareceriam idênticos, e
 * a diferença de 5% a 10% entre os dois ficaria invisível.
 */
function QuadroDaSimulacao({
  indicadores,
  precosAlvo,
  custoDaVenda,
  temMargem,
  houveMudanca,
  precoGravado,
}: {
  indicadores: IndicadoresDeVenda | null;
  precosAlvo: ReadonlyArray<PrecoSugerido>;
  custoDaVenda: number | null;
  temMargem: boolean;
  houveMudanca: boolean;
  precoGravado: number | null;
}) {
  if (indicadores === null) {
    return (
      <Aviso tom="info">
        Sem custo fechado e sem preço informado não há CMV nem markup a calcular. É o silêncio do
        sistema, e não um erro: ele não preenche essa lacuna com um número de partida.
      </Aviso>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <Indicador
          rotulo="CMV"
          valor={`${numeroFixo(indicadores.cmvPct, 1)}%`}
          contexto={
            temMargem
              ? `sobre ${valorEmReais(custoDaVenda ?? 0)} com margem`
              : `sobre ${valorEmReais(custoDaVenda ?? 0)} medido`
          }
          tom={
            indicadores.cmvPct > 100 ? "critico" : indicadores.cmvPct === 100 ? "atencao" : "neutro"
          }
        />
        <Indicador
          rotulo="Markup"
          valor={markupEmTexto(indicadores.markup)}
          contexto="preço ÷ custo"
        />
        <Indicador
          rotulo="Sobra por venda"
          valor={valorEmReais(indicadores.sobraReais)}
          contexto={`${numeroFixo(indicadores.sobraPct, 1)}% do preço`}
          tom={indicadores.sobraReais < 0 ? "critico" : "neutro"}
        />
        <Indicador rotulo="Preço simulado" valor={valorEmReais(indicadores.precoVenda)} />
      </div>

      {indicadores.cmvPct > 100 ? (
        <Aviso tom="critico" titulo="O preço não cobre o custo">
          Cada venda devolve {valorEmReais(Math.abs(indicadores.sobraReais))} menos do que o prato
          consumiu. É uma constatação aritmética, não uma nota: o sistema não opina sobre qual preço
          ela deve praticar.
        </Aviso>
      ) : null}

      {houveMudanca ? (
        <Aviso tom="atencao">
          Este preço é diferente do gravado ({valorEmReais(precoGravado ?? 0)}). Enquanto você não
          clicar em <strong>Usar este preço</strong>, nada muda na ficha.
        </Aviso>
      ) : null}

      {precosAlvo.length > 0 ? (
        <div className="rounded-[var(--raio)] border border-[var(--linha)] px-4 py-3.5">
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
            O preço que cada alvo informado exigiria
          </p>
          <ul className="mt-2.5 space-y-2">
            {precosAlvo.map((p) => (
              <li
                key={p.origem}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
              >
                <span className="text-[0.875rem] text-[var(--tinta-suave)]">
                  {p.origem === "CMV_ALVO"
                    ? `CMV alvo de ${numeroFixo(p.alvo, 1)}%`
                    : `Markup alvo de ${markupEmTexto(p.alvo)}`}
                </span>
                <span className="tabular text-[0.9375rem] text-tinta">
                  {valorEmReais(p.valor)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
            São os alvos que VOCÊ informou. O sistema não escolhe nenhum deles, e não existe alvo
            padrão.
          </p>
        </div>
      ) : (
        <Aviso tom="info">
          Nenhum alvo informado, então não há preço sugerido. Sem CMV alvo nem markup alvo, o
          sistema não tem de onde tirar um número — e inventar um seria pior do que não mostrar
          nada.
        </Aviso>
      )}
    </div>
  );
}
