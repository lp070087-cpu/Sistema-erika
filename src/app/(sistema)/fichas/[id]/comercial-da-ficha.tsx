"use client";

import { useImperativeHandle, useState } from "react";
import type { Ref } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo } from "@/components/ui/campo";
import { Gaveta, useGaveta } from "@/components/ui/gaveta";
import { lerNumero, markupEmTexto, numeroFixo, quadroComercial, valorEmReais } from "@/lib/dados";
import type { ParametrosComerciais, QuadroComercial } from "@/lib/dados";

/**
 * O PREÇO DE VENDA E OS PARÂMETROS COMERCIAIS DA FICHA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA QUE GOVERNA ESTA GAVETA, E QUE É FÁCIL DE QUEBRAR            │
 * │                                                                      │
 * │ NENHUM CAMPO ABRE PREENCHIDO COM UM VALOR QUE O SISTEMA ESCOLHEU.     │
 * │                                                                      │
 * │ O preço de venda abre com o preço que ela declarou, ou vazio. A       │
 * │ margem, o CMV alvo e o markup alvo abrem vazios, e vazio é resposta   │
 * │ legítima: significa "ainda não decidimos". Enquanto estiver vazio, o   │
 * │ indicador correspondente não existe — não aparece valendo zero, e não  │
 * │ aparece com um padrão de mercado no lugar.                            │
 * │                                                                      │
 * │ ┌────────────────────────────────────────────────────────────────┐   │
 * │ │ POR QUE ISSO É MAIS IMPORTANTE DO QUE PARECE                   │   │
 * │ │                                                                │   │
 * │ │ Um campo que vem preenchido com 5% vira regra pelo uso. Ela     │   │
 * │ │ olha a tela duas semanas, passa a repetir "nossa margem é 5%",  │   │
 * │ │ e o número deixa de ser do sistema e passa a ser da casa —      │   │
 * │ │ sem ninguém ter decidido nada. O 5% era do sistema o tempo      │   │
 * │ │ todo.                                                          │   │
 * │ │                                                                │   │
 * │ │ O mesmo vale para o CMV: "a gente trabalha com 30%" é uma       │   │
 * │ │ decisão comercial da Érika e do cliente dela, e um sistema que  │   │
 * │ │ sugere 30% está decidindo no lugar dos dois.                    │   │
 * │ └────────────────────────────────────────────────────────────────┘   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O PREÇO DE VENDA E OS PARÂMETROS ESTÃO NA MESMA GAVETA       │
 * │                                                                      │
 * │ Porque a pergunta é uma só — "e por quanto isso se vende?" — e as     │
 * │ três respostas se cruzam. Quem sabe o preço de venda quer ver o CMV    │
 * │ que ele dá; quem tem um CMV alvo quer ver o preço que ele exige. Duas  │
 * │ gavetas separadas obrigariam a fechar uma para consultar a outra, e o  │
 * │ número do meio ficaria sem lugar para aparecer.                        │
 * │                                                                      │
 * │ As duas continuam sendo coisas diferentes — FATO declarado e DECISÃO   │
 * │ de método — e a gaveta diz isso em cada bloco.                         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A PRÉVIA USA `quadroComercial`, E NÃO UMA CONTA LOCAL        │
 * │                                                                      │
 * │ Seria mais curto calcular aqui dentro: uma multiplicação e uma         │
 * │ divisão. Seria também a segunda implementação da mesma regra — e a     │
 * │ segunda é a que diverge. A prévia mostraria um número, a ficha logo    │
 * │ depois de salvar mostraria outro, e a diferença apareceria exatamente  │
 * │ quando não dá mais para conferir qual dos dois está certo.             │
 * │                                                                      │
 * │ A gaveta chama a MESMA função que a ficha chama. Se as duas           │
 * │ concordam, é porque são a mesma conta.                                 │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** O que a seção da ficha pode pedir a esta gaveta. */
export type ControleComercial = {
  abrirPreco: () => void;
  abrirParametros: () => void;
};

type Rascunho = {
  preco: string;
  margem: string;
  cmv: string;
  markup: string;
};

/**
 * Texto de campo → número, ou `null` quando o campo está em branco.
 *
 * `null` e `0` são respostas diferentes e o sistema não as confunde: em branco
 * é "ainda não decidimos"; zero é "decidimos que é zero". Só o primeiro some
 * da tela.
 */
function numeroDoCampo(texto: string): number | null {
  if (texto.trim() === "") return null;
  return lerNumero(texto);
}

/**
 * Número guardado → texto de campo, com vírgula.
 *
 * `numeroFixo` é para leitura (leva separador de milhar, que num campo
 * atrapalha a digitação). Aqui é valor de `<input>`, e o `replace` do ponto é
 * local de propósito: quem lê a vírgula de volta é `lerNumero`, uma só para o
 * sistema inteiro.
 */
function noCampo(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "";
  return String(valor).replace(".", ",");
}

type Abertura = "PRECO" | "PARAMETROS" | null;

/**
 * O rascunho a partir do que está gravado — os quatro campos de uma vez.
 *
 * Fica fora do componente porque não depende de nada dele: entra o que está
 * gravado, sai o que vai para os campos. Dentro, seria recriada a cada
 * renderização sem ganhar nada.
 */
function rascunhoDe(p: ParametrosComerciais, preco: number | null): Rascunho {
  return {
    preco: noCampo(preco),
    margem: noCampo(p.margemSegurancaPct),
    cmv: noCampo(p.cmvAlvoPct),
    markup: noCampo(p.markupAlvo),
  };
}

export function ComercialDaFicha({
  parametros,
  precoVenda,
  custoMedido,
  aoSalvar,
  ref,
}: {
  parametros: ParametrosComerciais;
  precoVenda: number | null;
  /** O custo total medido, quando a soma está fechada. */
  custoMedido: number | null;
  /**
   * Os quatro campos numa gravação só.
   *
   * Uma função, e não duas, para que a tela escreva UMA linha de histórico: a
   * gaveta salva os quatro campos com um clique, e duas gravações produziriam
   * duas linhas em que a segunda apagaria a primeira.
   */
  aoSalvar: (preco: number | null, parametros: ParametrosComerciais) => void;
  ref?: Ref<ControleComercial>;
}) {
  const gaveta = useGaveta();
  const [abertura, setAbertura] = useState<Abertura>(null);
  const [rascunho, setRascunho] = useState<Rascunho>(() => rascunhoDe(parametros, precoVenda));

  /*
    A SEÇÃO DA FICHA TAMBÉM ABRE ESTA GAVETA.

    O botão do cabeçalho serve para quem já sabe o que procura. A seção, logo
    abaixo das contas, serve para quem chegou ali lendo o custo e pensou "e o
    preço?". Sem esta ponte, ela teria de subir a tela e caçar o botão certo
    entre os outros — e as duas portas dão na mesma sala.
  */
  useImperativeHandle(ref, () => ({
    abrirPreco: () => abrir("PRECO"),
    abrirParametros: () => abrir("PARAMETROS"),
  }));

  function abrir(qual: Exclude<Abertura, null>) {
    /*
      Abre com o que está lá. Campo em branco sobre dado existente convida a
      redigitar — e redigitar "42,90" é como ele vira "4,29".
    */
    setRascunho(rascunhoDe(parametros, precoVenda));
    setAbertura(qual);
    gaveta.abrir();
  }

  function fechar() {
    setAbertura(null);
    gaveta.fechar();
  }

  const precoDigitado = numeroDoCampo(rascunho.preco);
  const digitados: ParametrosComerciais = {
    margemSegurancaPct: numeroDoCampo(rascunho.margem),
    cmvAlvoPct: numeroDoCampo(rascunho.cmv),
    markupAlvo: numeroDoCampo(rascunho.markup),
  };

  const previa = quadroComercial(custoMedido, precoDigitado, digitados);

  /*
    ── OS DOIS BOTÕES DO CABEÇALHO ─────────────────────────────────────────

    O de preço de venda só aparece quando ainda não há preço; depois disso ele
    vira "Preço e margem". Dois botões com o mesmo destino e nomes diferentes
    não são redundância — são a diferença entre "informe o preço", que é o que
    falta, e "mexa no preço", que é o que se faz depois.
  */
  return (
    <>
      <Botao variante="secundario" tamanho="sm" onClick={() => abrir("PRECO")}>
        {precoVenda === null ? "Informar preço de venda" : "Preço e margem"}
      </Botao>
      <Botao variante="linha" tamanho="sm" onClick={() => abrir("PARAMETROS")}>
        Parâmetros comerciais
      </Botao>

      <Gaveta
        aberta={gaveta.aberta}
        aoFechar={fechar}
        titulo={abertura === "PARAMETROS" ? "Parâmetros comerciais" : "Preço de venda"}
        descricao="O preço é uma decisão sua. Os parâmetros são a regra da casa. O sistema aplica o que você informar — e não sugere nenhum dos dois."
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={fechar}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              tamanho="sm"
              onClick={() => {
                /*
                  OS QUATRO CAMPOS SÃO GRAVADOS SEMPRE, INCLUSIVE OS QUE ELA
                  NÃO TOCOU.

                  Um campo visível que não grava é o defeito mais silencioso
                  que um formulário pode ter: ela limpa o preço, clica em
                  salvar, o preço continua lá, e nada na tela explica. Gravar
                  os quatro incondicionalmente custa nada e elimina a classe
                  inteira de defeito. A tela compara antes de escrever o
                  histórico, então uma gravação sem mudança real aparece como
                  "salvo sem alteração" — e não como alteração inventada.
                */
                aoSalvar(precoDigitado, digitados);
                fechar();
              }}
            >
              {precoDigitado === null ? "Limpar preço e salvar" : "Salvar"}
            </Botao>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <Campo
              label="Preço de venda (R$)"
              name="precoVenda"
              inputMode="decimal"
              value={rascunho.preco}
              onChange={(e) => setRascunho((r) => ({ ...r, preco: e.target.value }))}
              placeholder="Deixe em branco enquanto não houver preço definido"
              ajuda="Por quanto este prato é vendido. É um valor declarado, não calculado — quem decide é você."
            />
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
              Deixe em branco e o preço sai da ficha. O custo medido fica — o que
              desaparece é o CMV e o markup, que só existem em cima de um preço.
            </p>
          </div>

          <div className="border-t border-[var(--linha)] pt-5">
            <p className="text-[0.8125rem] font-semibold text-tinta">
              Os parâmetros da casa
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Os três campos abaixo abrem em branco de propósito. Branco quer dizer{" "}
              <strong className="font-semibold text-tinta">ainda não decidimos</strong>, e é uma
              resposta. Enquanto estiver branco, o indicador correspondente não aparece — ele
              não aparece valendo zero, e não aparece com um padrão de mercado no lugar.
            </p>

            <div className="mt-4 space-y-5">
              <Campo
                label="Margem de segurança (%)"
                name="margem"
                inputMode="decimal"
                value={rascunho.margem}
                onChange={(e) => setRascunho((r) => ({ ...r, margem: e.target.value }))}
                placeholder="Deixe em branco se ainda não houver uma regra"
                ajuda="Acréscimo sobre o custo medido, para cobrir o que não entrou na ficha. 5% aqui faz R$ 20,00 virarem R$ 21,00."
              />

              <Campo
                label="CMV alvo (% do preço de venda)"
                name="cmv"
                inputMode="decimal"
                value={rascunho.cmv}
                onChange={(e) => setRascunho((r) => ({ ...r, cmv: e.target.value }))}
                placeholder="Deixe em branco se ainda não houver um alvo"
                ajuda="O caminho inverso: informe o CMV desejado e o sistema mostra o preço que ele exige. Um CMV de 30% pede um preço de custo ÷ 0,30."
              />

              <Campo
                label="Markup alvo (múltiplo do custo)"
                name="markup"
                inputMode="decimal"
                value={rascunho.markup}
                onChange={(e) => setRascunho((r) => ({ ...r, markup: e.target.value }))}
                placeholder="Deixe em branco se ainda não houver um alvo"
                ajuda="O outro caminho para o mesmo lugar. Markup 3 vende por três vezes o custo. Quem escolhe entre CMV e markup é você, não o sistema."
              />
            </div>
          </div>

          <Previa previa={previa} custoMedido={custoMedido} />

          <div className="rounded-[var(--raio)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.07)] px-4 py-3.5">
            <p className="text-[0.8125rem] font-semibold text-tinta">
              O preço e os parâmetros mudam nesta sessão; o banco ainda não guarda
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Ao salvar, a ficha passa a mostrar os indicadores novos e uma linha entra no
              histórico dela. Recarregar a página devolve o estado inicial.
            </p>
          </div>
        </div>
      </Gaveta>
    </>
  );
}

// ---------------------------------------------------------------------------

/**
 * A PRÉVIA — o que os números digitados produzem, antes de salvar.
 *
 * Ela mostra três coisas, em ordem de dependência: o custo com a margem
 * aplicada, o preço que cada alvo exige, e o que o preço de venda informado
 * implica em CMV e markup. Quando falta a entrada de uma delas, ela diz qual
 * falta — e não mostra zero, que seria lido como "de graça".
 */
function Previa({
  previa,
  custoMedido,
}: {
  previa: QuadroComercial;
  custoMedido: number | null;
}) {
  const nadaInformado =
    previa.margemAplicadaPct === null && previa.custoComMargem === null && previa.precosAlvo.length === 0;

  if (custoMedido === null) {
    return (
      <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.45)] px-4 py-3.5">
        <p className="text-[0.8125rem] font-semibold text-tinta">O custo ainda não fechou</p>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          Há linha fora da soma na composição. Sem custo fechado, não há o que acrescentar nem
          preço a deduzir: o CMV e o markup sairiam sobre um piso, e um número otimista é pior
          do que nenhum — ninguém confere um número bom.
        </p>
      </div>
    );
  }

  if (nadaInformado && previa.precoVenda === null) {
    return (
      <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.45)] px-4 py-3.5">
        <p className="text-[0.8125rem] font-semibold text-tinta">Nada informado ainda</p>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          O sistema vai continuar mostrando o custo medido, puro — sem margem acrescentada e sem
          preço sugerido. É o comportamento correto enquanto a metodologia não estiver definida.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-3.5">
      <p className="text-[0.6875rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
        Com o que está digitado
      </p>

      {previa.margemAplicadaPct !== null && previa.custoComMargem !== null ? (
        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          Custo medido {valorEmReais(custoMedido)} com{" "}
          {numeroFixo(previa.margemAplicadaPct, 2)}% de margem ={" "}
          <strong className="font-semibold text-tinta">
            {valorEmReais(previa.custoComMargem)}
          </strong>
          .
        </p>
      ) : (
        <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          Custo medido: {valorEmReais(custoMedido)}. Sem margem de segurança informada, nenhum
          acréscimo é aplicado.
        </p>
      )}

      {previa.precosAlvo.length > 0 ? (
        <div className="mt-3 border-t border-[var(--linha)] pt-3">
          <p className="text-[0.75rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
            Preço que cada alvo exige
          </p>
          <ul className="mt-2 space-y-1.5">
            {previa.precosAlvo.map((p) => (
              <li
                key={p.origem}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
              >
                <span className="text-[0.8125rem] text-[var(--tinta-suave)]">
                  {p.origem === "CMV_ALVO"
                    ? `CMV alvo de ${numeroFixo(p.alvo, 2)}%`
                    : `Markup alvo de ${markupEmTexto(p.alvo)}`}
                </span>
                <span className="tabular text-[0.9375rem] font-semibold text-tinta">
                  {valorEmReais(p.valor)}
                </span>
              </li>
            ))}
          </ul>
          {previa.precosAlvo.length > 1 ? (
            /*
              Os dois caminhos discordando é informação, e não erro: CMV e
              markup são formas diferentes de raciocinar sobre o mesmo preço,
              e duas pessoas podem chegar a números diferentes sem nenhuma
              estar errada. O sistema mostra os dois.
            */
            <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
              Os dois caminhos dão preços diferentes. O sistema não escolhe entre eles — quem
              decide qual dos dois é o da casa é você.
            </p>
          ) : null}
        </div>
      ) : null}

      {previa.venda !== null ? (
        <div className="mt-3 border-t border-[var(--linha)] pt-3">
          <p className="text-[0.75rem] font-semibold tracking-[0.13em] text-[var(--tinta-fraca)] uppercase">
            Pelo preço de venda informado
          </p>
          <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            Vendendo a {valorEmReais(previa.venda.precoVenda)}, o custo representa{" "}
            <strong className="font-semibold text-tinta">
              {numeroFixo(previa.venda.cmvPct, 1)}%
            </strong>{" "}
            do preço, com um markup de{" "}
            <strong className="font-semibold text-tinta">
              {markupEmTexto(previa.venda.markup)}
            </strong>
            . Sobram {valorEmReais(previa.venda.sobraReais)} por unidade vendida.
          </p>
        </div>
      ) : null}
    </div>
  );
}
