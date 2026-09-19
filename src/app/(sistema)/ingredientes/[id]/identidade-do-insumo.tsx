"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { AoExcluir } from "@/components/ui/edicao";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import {
  FRASE_DA_RECUSA,
  UNIDADES_COMUNS,
  lerNumero,
  lerPeso,
  recusaDaCompra,
  valorEmReais,
} from "@/lib/dados";
import type { Ingrediente, RecusaDeCompra, UnidadeComum } from "@/lib/dados";
import {
  excluirIngrediente,
  salvarCadastroDoIngrediente,
} from "@/lib/dados/demonstracao";

/**
 * OS DADOS DO INSUMO — nome, categoria, fornecedor e compra.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE FORMULÁRIO NÃO DEIXA EDITAR, E POR QUÊ                     │
 * │                                                                      │
 * │ Só o que é DADO entra aqui. Ficam de fora:                            │
 * │                                                                      │
 * │   · O IDENTIFICADOR. É o que liga este insumo às fichas que o usam.    │
 * │     Editá-lo quebraria a ligação em silêncio — a ficha passaria a      │
 * │     apontar para um insumo que não existe, e o custo dela sairia       │
 * │     MENOR, sem erro nenhum na tela para explicar por quê.              │
 * │                                                                      │
 * │   · O HISTÓRICO DE PREÇOS. Ele é registro do que ACONTECEU. Corrigir   │
 * │     uma linha antiga não é editar um dado, é reescrever o passado — e  │
 * │     o motivo de existir um histórico é poder olhar para trás e ver o   │
 * │     que valia antes. Preço se corrige pelo `[ Atualizar preço ]`, que  │
 * │     ACRESCENTA um registro novo com a data em que ele passou a valer.  │
 * │                                                                      │
 * │   · A DATA DE ATUALIZAÇÃO. É consequência da gravação, não campo.      │
 * │                                                                      │
 * │   · O PREÇO UNITÁRIO. Não está aqui porque não existe lado nenhum: é   │
 * │     derivado da compra, e só aparece calculado.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A COMPRA TEM DOIS CAMPOS E O PREÇO POR QUILO NÃO É UM DELES   │
 * │                                                                      │
 * │ Ela digita "5" e "50". O preço por quilo — R$ 10,00 — aparece logo     │
 * │ abaixo, CALCULADO, para ela conferir antes de salvar.                  │
 * │                                                                      │
 * │ Oferecê-lo como terceiro campo criaria dois números discordando sobre  │
 * │ a mesma compra: o que ela digitou e o resultado da divisão. Quando     │
 * │ discordassem não haveria como saber qual vale — e o que vale é sempre  │
 * │ a divisão, porque é ela que reflete o que foi realmente pago.          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A COMPRA É TUDO-OU-NADA, E NÃO DOIS CAMPOS INDEPENDENTES      │
 * │                                                                      │
 * │ Metade de uma compra — a quantidade sem o valor, ou o valor sem a      │
 * │ quantidade — não é um dado incompleto: é um dado que o motor de custo  │
 * │ NÃO CONSEGUE USAR. Guardá-lo deixaria o preço unitário nulo e a ficha  │
 * │ sem custo, com a compra parecendo preenchida na tela.                  │
 * │                                                                      │
 * │ Por isso a recusa diz QUAL dos dois falta, em vez de "preencha os      │
 * │ campos obrigatórios".                                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 */

type Rascunho = {
  nome: string;
  categoria: string;
  fornecedor: string;
  quantidade: string;
  unidade: string;
  valorTotal: string;
};

/** O rascunho a partir do insumo que está na tela agora. */
function rascunhoDe(ingrediente: Ingrediente): Rascunho {
  return {
    nome: ingrediente.nome,
    categoria: ingrediente.categoria,
    fornecedor: ingrediente.fornecedor,
    quantidade: ingrediente.compra ? numeroNoCampo(ingrediente.compra.quantidade) : "",
    unidade: ingrediente.compra?.unidade ?? ingrediente.unidade,
    valorTotal: ingrediente.compra ? numeroNoCampo(ingrediente.compra.valorTotal) : "",
  };
}

/**
 * Um número vira texto de campo, com vírgula.
 *
 * `paraCampo` de `./numeros` faria isto — mas ela troca só o PRIMEIRO ponto, e
 * aqui o número é o que ela digitou: uma quantidade como 1.5 vira "1,5" e está
 * certo. O `replace` é local de propósito, e não uma segunda implementação da
 * regra: quem lê a vírgula de volta é `lerPeso`, que é uma só para o sistema
 * inteiro.
 */
function numeroNoCampo(valor: number): string {
  return String(valor).replace(".", ",");
}

export function IdentidadeDoInsumo({ ingrediente }: { ingrediente: Ingrediente }) {
  // Assina o store: salvar repinta o cabeçalho da tela, que é quem mostra o
  // nome e a categoria que este formulário acabou de alterar.
  useDemonstracao();

  const [aberta, setAberta] = useState(false);
  const [rascunho, setRascunho] = useState<Rascunho>(() => rascunhoDe(ingrediente));
  const [excluindo, setExcluindo] = useState(false);

  function abrir() {
    /*
      Abre com o que está lá. Campo vazio sobre dado existente convida a
      REDIGITAR — e redigitar "42,90" é como ele vira "4,29". Abrir preenchido
      inverte a tarefa: em vez de escrever, ela corrige.
    */
    setRascunho(rascunhoDe(ingrediente));
    setExcluindo(false);
    setAberta(true);
  }

  function fechar() {
    setAberta(false);
    setExcluindo(false);
  }

  /*
    ── A COMPRA, LIDA ANTES DE QUALQUER GRAVAÇÃO ───────────────────────────
    As três linhas abaixo são calculadas a cada digitação, e não dentro de
    `salvar`: é o que permite a leitura aparecer ENQUANTO ela digita, e o
    botão desabilitar antes do clique em vez de depois.

    `motivo` é o código da recusa, e não a frase — quem escreve a frase para
    a tela é `FRASE_DA_RECUSA`, no domínio. Assim a regra e o texto não podem
    divergir.
  */
  const quantidade = lerQuantidade(rascunho.quantidade);
  const valorTotal = lerValor(rascunho.valorTotal);
  const motivo = recusaDaCompra(
    rascunho.quantidade,
    quantidade,
    rascunho.valorTotal,
    valorTotal
  );

  function salvar() {
    const nome = rascunho.nome.trim();
    if (nome === "") return;
    if (motivo !== null) return;

    const categoria = rascunho.categoria.trim();

    const alteracao: Partial<Ingrediente> = {
      nome,
      categoria: categoria === "" ? ingrediente.categoria : categoria,
      fornecedor: rascunho.fornecedor.trim(),
    };

    /*
      ── QUANDO A COMPRA É GRAVADA, E QUANDO NÃO É TOCADA ───────────────────
      Os dois campos informados: a compra inteira é gravada.
      Nenhum dos dois: `motivo` é `null` e nada é gravado — a compra que já
      estava lá continua, e um insumo sem compra continua sem compra.
      Só um dos dois: `motivo` não é `null`, e a função já teria parado acima.
    */
    if (quantidade !== null && valorTotal !== null) {
      alteracao.compra = {
        quantidade,
        unidade: rascunho.unidade,
        valorTotal,
      };
    }

    salvarCadastroDoIngrediente(ingrediente.id, alteracao);
    fechar();
  }

  const registros = ingrediente.historico.length;

  return (
    <>
      <Botao variante="secundario" tamanho="sm" onClick={abrir}>
        Editar dados
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={fechar}
        titulo="Editar dados do insumo"
        descricao={`${ingrediente.nome}. O nome, a categoria, o fornecedor e a compra.`}
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={fechar}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              tamanho="sm"
              disabled={rascunho.nome.trim() === "" || motivo !== null}
              onClick={salvar}
            >
              Salvar dados
            </Botao>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo
              label="Nome do insumo"
              name="nome"
              value={rascunho.nome}
              onChange={(e) => setRascunho((r) => ({ ...r, nome: e.target.value }))}
              placeholder="Ex.: Batata inglesa"
              obrigatorio
              ajuda="Como ele é chamado na sua cozinha."
            />
            <Campo
              label="Categoria"
              name="categoria"
              value={rascunho.categoria}
              onChange={(e) => setRascunho((r) => ({ ...r, categoria: e.target.value }))}
              placeholder="Ex.: Hortifrúti"
              ajuda="O grupo em que ele entra na biblioteca."
            />
          </div>

          <Campo
            label="Fornecedor"
            name="fornecedor"
            value={rascunho.fornecedor}
            onChange={(e) => setRascunho((r) => ({ ...r, fornecedor: e.target.value }))}
            placeholder="Onde este insumo costuma ser comprado"
          />

          <div className="border-t border-[var(--linha)] pt-5">
            <p className="text-[0.8125rem] font-semibold text-tinta">
              Compra mais recente
            </p>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
              Quanto veio e quanto se pagou. O preço unitário sai da divisão —
              ele não é digitado em lugar nenhum.
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <Campo
                label="Quantidade"
                name="quantidade"
                inputMode="decimal"
                value={rascunho.quantidade}
                onChange={(e) => setRascunho((r) => ({ ...r, quantidade: e.target.value }))}
                placeholder="Ex.: 5"
                ajuda="O que a nota diz."
              />
              <CampoSelecao
                label="Unidade"
                name="unidade"
                value={rascunho.unidade}
                onChange={(e) => setRascunho((r) => ({ ...r, unidade: e.target.value }))}
                /*
                  A lista de cadastro é mais larga que a lista de cálculo, e
                  isso é de propósito: aqui cabe "maço", "cx", "pct" — como ela
                  COMPRA. O motor de custo só sabe somar e dividir massa e
                  volume, e quando a unidade fica fora disso ele para e diz, em
                  vez de tratar "1 cx" como o número 1.
                */
                opcoes={unidadesOferecidas(rascunho.unidade).map((u) => ({
                  valor: u,
                  texto: u,
                }))}
                ajuda="Como essa quantidade foi medida."
              />
              <Campo
                label="Valor pago"
                name="valorTotal"
                inputMode="decimal"
                value={rascunho.valorTotal}
                onChange={(e) => setRascunho((r) => ({ ...r, valorTotal: e.target.value }))}
                placeholder="Ex.: 50,00"
                ajuda="O total da nota, em reais."
              />
            </div>

            <LeituraDaCompra
              quantidade={quantidade}
              valorTotal={valorTotal}
              unidade={rascunho.unidade}
              motivo={motivo}
            />
          </div>

          {/*
            ── EXCLUIR FICA AQUI DENTRO, E NÃO NO CABEÇALHO ────────────────
            No cabeçalho ele seria um alvo permanente ao lado de "Editar
            dados", a um clique de distância. Aqui ele só aparece para quem
            abriu o formulário com a intenção de mexer no insumo.
          */}
          <div className="border-t border-[var(--linha)] pt-5">
            {!excluindo ? (
              <Botao
                variante="linha"
                tamanho="sm"
                className="text-[#8a2b20] hover:bg-[rgba(138,43,32,0.07)]"
                onClick={() => setExcluindo(true)}
              >
                Excluir insumo
              </Botao>
            ) : (
              <AoExcluir
                nome={ingrediente.nome}
                aoConfirmar={() => {
                  excluirIngrediente(ingrediente.id);
                  fechar();
                }}
                consequencia={
                  <>
                    Ele sai da biblioteca e deixa de aparecer nas listas e nas
                    buscas.{" "}
                    {registros > 1 ? (
                      <>Os {registros} registros de preço dele saem junto. </>
                    ) : null}
                    As fichas que usam este insumo{" "}
                    <strong className="font-semibold">não</strong> são apagadas:
                    elas passam a mostrar a linha sem preço. Nesta sessão a
                    exclusão pode ser desfeita recarregando a página — depois
                    disso, só a lixeira do navegador devolve.
                  </>
                }
              />
            )}
          </div>
        </div>
      </Gaveta>
    </>
  );
}

// ---------------------------------------------------------------------------

/**
 * Lê a quantidade comprada.
 *
 * Vazio vira `null` e é tratado à parte — "não informei" e "informei algo que
 * não é número" precisam de recusas diferentes. Quem decide o que é número é
 * `lerPeso`, a mesma função que a calculadora de rendimento usa: uma regra de
 * leitura só para o sistema inteiro.
 */
function lerQuantidade(texto: string): number | null {
  if (texto.trim() === "") return null;
  return lerPeso(texto);
}

function lerValor(texto: string): number | null {
  if (texto.trim() === "") return null;
  return lerNumero(texto);
}

/**
 * AS UNIDADES OFERECIDAS, SEM PERDER A QUE JÁ ESTAVA.
 *
 * A lista do cadastro é fixa, mas o insumo pode ter sido cadastrado com uma
 * unidade antiga, fora dela. Um `<select>` cujo valor não está entre as opções
 * abre na primeira delas — e salvar dados sem tocar no campo trocaria "cx" por
 * "kg" sem ninguém ter pedido. Por isso a unidade de hoje entra na lista quando
 * não está nela.
 */
function unidadesOferecidas(atual: string): readonly string[] {
  return UNIDADES_COMUNS.includes(atual as UnidadeComum)
    ? UNIDADES_COMUNS
    : [atual, ...UNIDADES_COMUNS];
}

// ---------------------------------------------------------------------------

/**
 * A LEITURA DA COMPRA — o preço unitário conferido ANTES de salvar.
 *
 * Mesma ideia da leitura de volta da calculadora de rendimento, e por um
 * motivo maior: "1.200" tem duas leituras, e o número que ela digitou aqui
 * vira o preço de tudo o que for feito com este insumo depois. Mostrar a
 * divisão já feita é a conferência mais barata que existe.
 */
function LeituraDaCompra({
  quantidade,
  valorTotal,
  unidade,
  motivo,
}: {
  quantidade: number | null;
  valorTotal: number | null;
  unidade: string;
  motivo: RecusaDeCompra | null;
}) {
  if (motivo !== null) {
    return (
      <div className="mt-4 rounded-[var(--raio)] border border-dashed border-dourado/60 bg-[rgba(201,165,78,0.07)] px-4 py-3.5">
        <p className="text-[0.8125rem] font-semibold text-tinta">Antes de salvar</p>
        <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          {FRASE_DA_RECUSA[motivo]}
        </p>
      </div>
    );
  }

  if (quantidade === null || valorTotal === null) return null;

  const unitario = valorTotal / quantidade;

  return (
    <div className="mt-4 rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-oliva bg-[rgba(107,122,70,0.06)] px-4 py-3.5">
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        Como o sistema vai ler
      </p>
      <p className="tabular mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
        {valorEmReais(valorTotal)} por {numeroNoCampo(quantidade)} {unidade} —{" "}
        <strong className="font-semibold text-tinta">
          {valorEmReais(unitario)} por {unidade}
        </strong>
        .
      </p>
    </div>
  );
}
