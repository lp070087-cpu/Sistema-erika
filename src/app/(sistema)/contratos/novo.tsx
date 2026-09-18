"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Aviso } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";

/**
 * NOVO CONTRATO — a montagem da proposta.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE FORMULÁRIO É VISUAL, E DIZ ISSO EM TRÊS LUGARES                  │
 * │                                                                      │
 * │ 1. Antes de preencher, num aviso dentro do formulário.                 │
 * │ 2. Na revisão, com o contrato como ele ficaria.                       │
 * │ 3. Depois de "adicionar", quando fica claro que nada foi gravado.     │
 * │                                                                      │
 * │ Três lugares, e não um, porque cada um pega uma pessoa diferente:     │
 * │ quem lê antes de digitar, quem confere no fim, e quem clica direto no  │
 * │ botão sem ler nada. É o mesmo padrão dos outros cadastros da Fase 2.6.│
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A QUANTIDADE DE PARCELAS É UM CAMPO, E NÃO QUATRO CAMPOS FIXOS        │
 * │                                                                      │
 * │ O briefing foi explícito: o sistema precisa aceitar N parcelas. Um     │
 * │ formulário com exatamente quatro linhas de parcela ensinaria, sem      │
 * │ dizer, que contrato tem quatro parcelas — e a Érika combina dois,      │
 * │ três, seis, ou uma entrada mais uma parcela única.                     │
 * │                                                                      │
 * │ Aqui se escolhe de 1 a 12, e as linhas de valor aparecem na medida.    │
 * │ O número é do DOMÍNIO (parcelas é uma lista), não do formulário.       │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const MIN_PARCELAS = 1;
const MAX_PARCELAS = 12;

type Rascunho = {
  cliente: string;
  titulo: string;
  valorTotal: string;
  parcelas: number;
  entrada: string;
  observacoes: string;
};

const VAZIO: Rascunho = {
  cliente: "",
  titulo: "",
  valorTotal: "",
  parcelas: 4,
  entrada: "",
  observacoes: "",
};

/** Converte "4.800,00" e "4800" no mesmo número. Vazio vira `null`, não zero. */
function emNumero(texto: string): number | null {
  const limpo = texto.replace(/[^\d,.-]/g, "").trim();
  if (!limpo) return null;
  const normalizado = limpo.includes(",")
    ? limpo.replace(/\./g, "").replace(",", ".")
    : limpo;
  const n = Number(normalizado);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function emReais(n: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

export function NovoContrato() {
  const [aberta, setAberta] = useState(false);
  const [rascunho, setRascunho] = useState<Rascunho>(VAZIO);
  const [revisando, setRevisando] = useState(false);

  const total = emNumero(rascunho.valorTotal);
  const entrada = emNumero(rascunho.entrada);
  const podeRevisar = rascunho.cliente.trim().length > 0 && rascunho.titulo.trim().length > 0;

  /**
   * A divisão das parcelas.
   *
   * Quando o valor total é divisível, todas as parcelas são iguais. Quando
   * não é, a divisão deixa centavos — e centavos perdidos viram um contrato
   * que soma menos do que o combinado. A diferença vai para a PRIMEIRA
   * parcela, que é a maior, para que a soma das parcelas feche exatamente
   * com o total. Não é decisão de metodologia: é aritmética fechando.
   */
  const valorDasParcelas = (() => {
    if (total === null) return null;
    const base = Math.floor((total * 100) / rascunho.parcelas) / 100;
    const primeira = Math.round((total - base * (rascunho.parcelas - 1)) * 100) / 100;
    return { base, primeira };
  })();

  function campo<K extends keyof Rascunho>(chave: K, valor: Rascunho[K]) {
    setRascunho((r) => ({ ...r, [chave]: valor }));
  }

  function fechar() {
    setAberta(false);
    setRevisando(false);
    setRascunho(VAZIO);
  }

  return (
    <>
      <Botao variante="primario" tamanho="sm" onClick={() => setAberta(true)}>
        Novo contrato
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={fechar}
        titulo={revisando ? "Confira antes de adicionar" : "Novo contrato"}
        descricao={
          revisando
            ? "Esta é a proposta como ela ficaria. Ainda não foi salva."
            : "O combinado escrito: escopo, valor, parcelas e condições."
        }
        acoes={
          revisando ? (
            <>
              <Botao variante="linha" tamanho="sm" onClick={() => setRevisando(false)}>
                Voltar e editar
              </Botao>
              <Botao variante="primario" tamanho="sm" onClick={fechar}>
                Entendi — fechar
              </Botao>
            </>
          ) : (
            <>
              <Botao variante="linha" tamanho="sm" onClick={fechar}>
                Cancelar
              </Botao>
              <Botao
                variante="primario"
                tamanho="sm"
                disabled={!podeRevisar}
                onClick={() => setRevisando(true)}
              >
                Adicionar contrato
              </Botao>
            </>
          )
        }
      >
        {revisando ? (
          <div className="space-y-5">
            <Aviso tom="atencao" titulo="Dados de demonstração não são salvos ao recarregar">
              <p>
                Nada foi gravado. O sistema ainda não tem banco conectado — se você recarregar esta
                página, o contrato que acabou de montar não vai estar na lista.
              </p>
            </Aviso>

            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Como esta proposta ficaria
              </p>
              <div className="mt-3 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-4">
                <ListaDados colunas={2}>
                  <Dado rotulo="Cliente">{rascunho.cliente}</Dado>
                  <Dado rotulo="Serviço">{rascunho.titulo}</Dado>
                  <Dado rotulo="Valor total">
                    {total !== null ? emReais(total) : "não informado"}
                  </Dado>
                  <Dado rotulo="Status inicial">
                    Rascunho — nada foi enviado ao cliente ainda.
                  </Dado>
                  <Dado rotulo="Documento">
                    Não enviado — o contrato em PDF é anexado depois.
                  </Dado>
                  <Dado rotulo="Aceite">Nenhum — o cliente ainda não aceitou.</Dado>
                  {rascunho.observacoes ? (
                    <Dado rotulo="Observações" largo>
                      {rascunho.observacoes}
                    </Dado>
                  ) : null}
                </ListaDados>

                {valorDasParcelas !== null ? (
                  <div className="mt-5 border-t border-[var(--linha)] pt-4">
                    <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                      As {rascunho.parcelas}{" "}
                      {rascunho.parcelas === 1 ? "parcela" : "parcelas"}
                    </p>
                    <ol className="mt-3 space-y-1.5">
                      {Array.from({ length: rascunho.parcelas }, (_, i) => {
                        const valor = i === 0 ? valorDasParcelas.primeira : valorDasParcelas.base;
                        return (
                          <li
                            key={i}
                            className="flex items-baseline justify-between gap-4 text-[0.875rem]"
                          >
                            <span className="text-[var(--tinta-suave)]">
                              {i + 1}ª parcela
                              {i === 0 && entrada !== null
                                ? ` — entrada de ${emReais(entrada)}`
                                : ""}
                            </span>
                            <span className="tabular text-tinta">{emReais(valor)}</span>
                          </li>
                        );
                      })}
                    </ol>
                    <p className="mt-2.5 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                      As datas de vencimento são combinadas caso a caso, e por isso não aparecem
                      aqui: o sistema não sabe quando cada parcela vence até que o combinado seja
                      registrado.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
              <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <span className="font-medium text-tinta">A lista continua com cinco contratos.</span>{" "}
                É assim que se percebe que nada gravou: volte para a lista e conte.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <Campo
                label="Cliente"
                name="cliente"
                value={rascunho.cliente}
                onChange={(e) => campo("cliente", e.target.value)}
                placeholder="Ex.: Bella Massa"
                obrigatorio
                ajuda="Use o nome que você reconhece. O sistema liga ao cadastro quando a gravação existir."
              />
              <Campo
                label="Serviço contratado"
                name="titulo"
                value={rascunho.titulo}
                onChange={(e) => campo("titulo", e.target.value)}
                placeholder="Ex.: Diagnóstico e plano de ação"
                obrigatorio
              />
              <Campo
                label="Valor total"
                name="valorTotal"
                value={rascunho.valorTotal}
                onChange={(e) => campo("valorTotal", e.target.value)}
                placeholder="Ex.: 4800,00"
                ajuda="O valor cheio do trabalho. As parcelas são a divisão dele."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoSelecao
                  label="Quantidade de parcelas"
                  name="parcelas"
                  value={String(rascunho.parcelas)}
                  opcoes={Array.from(
                    { length: MAX_PARCELAS - MIN_PARCELAS + 1 },
                    (_, i) => MIN_PARCELAS + i
                  ).map((n) => ({ valor: String(n), texto: n === 1 ? "1 parcela" : `${n} parcelas` }))}
                  onChange={(e) => campo("parcelas", Number(e.target.value))}
                  ajuda="De 1 a 12. O sistema não assume um número — quem define é você."
                />
                <Campo
                  label="Entrada (opcional)"
                  name="entrada"
                  value={rascunho.entrada}
                  onChange={(e) => campo("entrada", e.target.value)}
                  placeholder="Ex.: 1500,00"
                  ajuda="Valor pago na assinatura, parte do total."
                />
              </div>
              <Campo
                label="Observações"
                name="observacoes"
                value={rascunho.observacoes}
                onChange={(e) => campo("observacoes", e.target.value)}
                placeholder="O que foi combinado por telefone, prazos, condições…"
                ajuda="Fica no contrato como anotação interna. Não é enviado ao cliente."
              />
            </div>

            <div className="rounded-[var(--raio)] border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.08)] px-4 py-3.5">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[#8a6d1f] uppercase">
                Antes de preencher
              </p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <strong className="font-semibold text-tinta">
                  Dados de demonstração não são salvos ao recarregar.
                </strong>{" "}
                A montagem funciona para você ver como seria, mas depende do banco de dados — que
                ainda não está conectado. Ao recarregar a página, o formulário volta vazio.
              </p>
            </div>
          </div>
        )}
      </Gaveta>
    </>
  );
}
