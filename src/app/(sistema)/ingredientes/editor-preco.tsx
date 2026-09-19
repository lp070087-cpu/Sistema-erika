"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import { valorEmReais } from "@/lib/dados";
import type { Ingrediente, PrecoIngrediente } from "@/lib/dados";
import {
  registrarPrecoDaBiblioteca,
  registrarPrecoDoCliente,
} from "@/lib/dados/demonstracao";

/**
 * EDITAR O PREÇO DE UM INSUMO — e guardar o que estava antes.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A REGRA QUE FAZ ESTA GAVETA VALER A PENA                              │
 * │                                                                      │
 * │ NENHUM PREÇO É SOBRESCRITO. O que estava vigente desce para o         │
 * │ histórico com a data e o fornecedor daquele dia; o novo assume o      │
 * │ topo. Sem isso, "atualizar o preço" destruiria exatamente o dado que   │
 * │ permite ver a alta depois — e a biblioteca voltaria a ser a planilha   │
 * │ de preços que este módulo existe para substituir.                     │
 * │                                                                      │
 * │ A data entra junto porque preço sem data não serve para nada: é a      │
 * │ diferença entre saber que a mussarela está R$ 42,90 e saber que está   │
 * │ R$ 42,90 desde 09 de setembro, antes R$ 39,50.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE O FORMULÁRIO MOSTRA O PREÇO ANTERIOR ENQUANTO SE DIGITA       │
 * │                                                                      │
 * │ O erro clássico de digitação de preço é a vírgula: "42,90" vira       │
 * │ "4290" e o quilo do queijo salta para quatro mil reais. Esse número    │
 * │ entra na ficha, e a ficha inteira fica errada.                        │
 * │                                                                      │
 * │ Ver "antes: R$ 39,50" ao lado do campo em que se digita é a           │
 * │ conferência mais barata que existe: a diferença fica visível antes    │
 * │ de o preço entrar no histórico.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ELE AINDA NÃO FAZ                                              │
 * │                                                                      │
 * │ Não recalcula ficha nenhuma. Cada ficha guarda o preço de referência  │
 * │ do dia em que foi escrita, e ele continua lá — o que é o             │
 * │ comportamento correto enquanto não se decide o que fazer com as       │
 * │ fichas antigas quando o preço muda (é a decisão "origem-do-preco",    │
 * │ ainda aberta).                                                        │
 * │                                                                      │
 * │ E não grava em disco. A alteração vive nesta sessão; recarregar a     │
 * │ página devolve o cenário. A tela diz isso em voz alta, antes do       │
 * │ primeiro clique.                                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const UNIDADES = ["kg", "g", "L", "ml", "un", "dúzia", "maço", "cx", "pct"] as const;

const ORIGENS: ReadonlyArray<{ valor: PrecoIngrediente["origem"]; texto: string }> = [
  { valor: "CONSULTORA", texto: "Informado pela consultoria" },
  { valor: "CLIENTE", texto: "Informado pelo cliente" },
  { valor: "IMPORTADO", texto: "Importado de planilha antiga" },
];

function hojeLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Lê o número do jeito que se escreve numa nota fiscal.
 *
 * "12,90", "12.90" e "R$ 12,90" são o mesmo número para quem está lendo a
 * nota. Recusar a vírgula obrigaria ela a converter mentalmente — e é
 * exatamente aí que se digita 1290 sem perceber.
 */
function lerNumero(texto: string): number | null {
  const limpo = texto.replace(/R\$/gi, "").trim().replace(/\s/g, "");
  if (limpo === "") return null;

  // Com vírgula: ela é o separador decimal, e o ponto é de milhar.
  if (limpo.includes(",")) {
    const n = Number(limpo.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  const n = Number(limpo);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function EditorDePreco({
  ingrediente,
  clienteId,
  clienteNome,
  precoVigente,
  unidadeVigente,
  fornecedorVigente,
  dataVigente,
}: {
  ingrediente: Ingrediente;
  /** Quando presente, o preço é gravado como preço DESTE cliente. */
  clienteId?: string;
  clienteNome?: string;
  /** O preço vigente hoje, já com as alterações desta sessão aplicadas. */
  precoVigente: number | null;
  unidadeVigente: string;
  fornecedorVigente: string;
  dataVigente: Date | null;
}) {
  // Assina o estado demonstrativo: quando o preço muda, este componente
  // re-renderiza junto com o resto da tela.
  useDemonstracao();

  const [aberta, setAberta] = useState(false);
  const [valor, setValor] = useState("");
  const [unidade, setUnidade] = useState(unidadeVigente);
  const [fornecedor, setFornecedor] = useState(fornecedorVigente);
  const [data, setData] = useState(hojeLocal());
  const [origem, setOrigem] = useState<PrecoIngrediente["origem"]>("CONSULTORA");

  const novo = lerNumero(valor);
  const variacao =
    novo !== null && precoVigente !== null && precoVigente > 0
      ? ((novo - precoVigente) / precoVigente) * 100
      : null;

  const podeSalvar = novo !== null && data !== "";

  function fechar() {
    setAberta(false);
    setValor("");
    setFornecedor(fornecedorVigente);
    setData(hojeLocal());
    setOrigem("CONSULTORA");
  }

  function salvar() {
    if (novo === null) return;

    const quando = new Date(`${data}T12:00:00`);
    const entrada = {
      valor: novo,
      unidade,
      fornecedor: fornecedor.trim(),
      em: quando,
      origem,
    };

    /*
      O ESTADO INICIAL VAI JUNTO, e vem do repositório.

      O store só guarda o que foi mexido nesta sessão; o primeiro preço que
      ela digita precisa de um "antes" para empurrar no histórico. Esse
      "antes" é o preço do cenário, que o servidor leu e passou como prop —
      o store não tem como ir buscá-lo sozinho, e não deveria: quem lê o
      cenário é o repositório.
    */
    const estadoInicial =
      dataVigente !== null && precoVigente !== null
        ? {
            atual: {
              id: `cenario-${ingrediente.id}`,
              em: dataVigente,
              valor: precoVigente,
              unidade: unidadeVigente,
              fornecedor: fornecedorVigente,
              origem: "CONSULTORA" as const,
            },
            historico: ingrediente.historico,
          }
        : null;

    if (clienteId) {
      registrarPrecoDoCliente(
        clienteId,
        ingrediente.id,
        entrada,
        estadoInicial
      );
    } else {
      registrarPrecoDaBiblioteca(ingrediente.id, entrada, estadoInicial);
    }

    fechar();
  }

  const onde = clienteNome ? `para ${clienteNome}` : "da biblioteca";

  return (
    <>
      <Botao
        variante="secundario"
        tamanho="sm"
        onClick={() => {
          setUnidade(unidadeVigente);
          setFornecedor(fornecedorVigente);
          setAberta(true);
        }}
      >
        {precoVigente === null ? "Registrar preço" : "Atualizar preço"}
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={fechar}
        titulo={`${precoVigente === null ? "Registrar" : "Atualizar"} preço ${onde}`}
        descricao={`${ingrediente.nome}. O preço que está valendo hoje vai para o histórico, com a data dele.`}
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={fechar}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              tamanho="sm"
              disabled={!podeSalvar}
              onClick={salvar}
            >
              Salvar preço
            </Botao>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie-areia)] px-4 py-3.5">
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              {precoVigente === null ? "Hoje" : "Antes desta alteração"}
            </p>
            <p className="mt-1.5 font-display text-[1.375rem] text-tinta">
              {precoVigente === null
                ? "Sem preço registrado"
                : `${valorEmReais(precoVigente)} por ${unidadeVigente}`}
            </p>
            {dataVigente ? (
              <p className="mt-1 text-[0.8125rem] text-[var(--tinta-suave)]">
                {fornecedorVigente || "fornecedor não informado"} ·{" "}
                {dataVigente.toLocaleDateString("pt-BR")}
              </p>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo
                label="Preço novo"
                name="valor"
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Ex.: 42,90"
                obrigatorio
                ajuda={`Pelo ${unidade}. Aceita vírgula.`}
              />
              <CampoSelecao
                label="Unidade"
                name="unidade"
                value={unidade}
                opcoes={UNIDADES.map((u) => ({ valor: u, texto: u }))}
                onChange={(e) => setUnidade(e.target.value)}
                ajuda="A unidade em que este preço é medido."
              />
            </div>

            {/*
              A CONFERÊNCIA IMEDIATA.

              A variação aparece assim que há número, antes de salvar. Sobe ou
              desce com o mesmo tratamento — o sistema não chama nenhuma das
              duas de preocupante, porque o que é "muita" alta depende do
              insumo, do prato e do cliente.
            */}
            {novo !== null && variacao !== null ? (
              <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-3.5">
                <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                  {valorEmReais(novo)} é{" "}
                  <strong className="font-semibold text-tinta">
                    {variacao > 0 ? "+" : ""}
                    {variacao.toFixed(1).replace(".", ",")}%
                  </strong>{" "}
                  em relação ao que está valendo. Uma subtração, para conferir a
                  vírgula antes de salvar.
                </p>
              </div>
            ) : null}

            {novo !== null && variacao === null ? (
              <div className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-3.5">
                <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                  O primeiro preço deste insumo. A partir dele, cada
                  atualização guarda a anterior.
                </p>
              </div>
            ) : null}

            <Campo
              label="Fornecedor"
              name="fornecedor"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              placeholder="Onde você comprou"
            />

            <Campo
              label="Data do preço"
              name="data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              obrigatorio
              ajuda="O dia em que este preço passou a valer."
            />

            <CampoSelecao
              label="De onde veio este número"
              name="origem"
              value={origem}
              opcoes={ORIGENS.map((o) => ({ valor: o.valor, texto: o.texto }))}
              onChange={(e) =>
                setOrigem(e.target.value as PrecoIngrediente["origem"])
              }
              ajuda="É procedência, não confiabilidade. Fica registrado no histórico."
            />
          </div>

          {/*
            O AVISO VEM ANTES DO BOTÃO, e não depois do clique.
            Quem mexer já sabe — e não descobre ao recarregar a página. É o
            mesmo contrato do `AvisoInteracao`, mas o texto aqui é específico
            porque a consequência é específica: o preço muda de verdade nesta
            sessão, e volta ao cenário no recarregamento.
          */}
          <div className="rounded-[var(--raio)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.07)] px-4 py-3.5">
            <p className="text-[0.8125rem] font-semibold text-tinta">
              O preço muda nesta sessão; o banco ainda não guarda
            </p>
            <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Ao salvar, a tela toda passa a mostrar o preço novo — inclusive
              as fichas que ainda não têm preço de cliente. Recarregar a página
              devolve o estado inicial.
            </p>
            <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              As fichas já escritas <strong className="font-semibold text-tinta">não</strong>{" "}
              são recalculadas: cada uma guarda o preço do dia em que foi
              escrita, e ele continua lá.
            </p>
          </div>
        </div>
      </Gaveta>
    </>
  );
}
