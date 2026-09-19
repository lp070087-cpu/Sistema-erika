"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Aviso } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { ROTULO_MODALIDADE, dataCurta } from "@/lib/dados";
import type { Modalidade } from "@/lib/dados";

/**
 * NOVA CONSULTORIA — abrir um trabalho para um cliente que já existe.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE FORMULÁRIO TEM DOIS CAMPOS A MENOS DO QUE TERIA, DE PROPÓSITO    │
 * │                                                                      │
 * │ Não existe campo de VALOR. Não existe campo de DURAÇÃO. Não existe    │
 * │ campo de número de visitas.                                          │
 * │                                                                      │
 * │ Não é esquecimento: ninguém definiu ainda como a Érika precifica nem  │
 * │ quanto tempo cada trabalho leva. Um campo desses, vazio, seria um     │
 * │ convite para ela digitar um número que o sistema passaria a tratar    │
 * │ como combinado. E um valor inventado num contrato de consultoria é    │
 * │ pior do que nenhum valor.                                            │
 * │                                                                      │
 * │ Quando a metodologia for configurada (§29, Metodologia), os campos    │
 * │ aparecem — com a faixa que ela mesma definiu.                         │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O STATUS INICIAL NÃO É ESCOLHA. Toda consultoria nasce em "Planejamento",
 * que é o primeiro estado do método e o único honesto: nada foi combinado
 * ainda. O status muda depois, por decisão dela, na tela da consultoria.
 */

const MODALIDADES: readonly Modalidade[] = ["PRESENCIAL", "ONLINE", "MISTA"];

/** Hoje, no fuso de quem está usando — não em UTC, que adianta um dia à noite. */
function hojeLocal(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function NovaConsultoria({
  clientes,
}: {
  /** Os clientes que podem receber um trabalho. Vem do servidor. */
  clientes: readonly { id: string; nome: string }[];
}) {
  const [aberta, setAberta] = useState(false);
  const [revisando, setRevisando] = useState(false);

  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [modalidade, setModalidade] = useState<Modalidade>("PRESENCIAL");
  const [inicio, setInicio] = useState(hojeLocal());
  const [objetivo, setObjetivo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const cliente = clientes.find((c) => c.id === clienteId);
  const podeRevisar = clienteId !== "" && objetivo.trim().length > 0;

  function fechar() {
    setAberta(false);
    setRevisando(false);
    setObjetivo("");
    setObservacoes("");
    setModalidade("PRESENCIAL");
    setInicio(hojeLocal());
  }

  // Sem cliente nenhum não há consultoria a abrir — e a tela diz para onde ir
  // em vez de mostrar um seletor vazio.
  if (clientes.length === 0) {
    return null;
  }

  return (
    <>
      <Botao variante="primario" tamanho="sm" onClick={() => setAberta(true)}>
        Nova consultoria
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={fechar}
        titulo={revisando ? "Confira antes de abrir" : "Nova consultoria"}
        descricao={
          revisando
            ? "Este é o trabalho como ele ficaria. Ainda não foi aberto."
            : "Um trabalho novo para um cliente que já está na carteira."
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
                Abrir consultoria
              </Botao>
            </>
          )
        }
      >
        {revisando ? (
          <div className="space-y-5">
            <Aviso tom="atencao" titulo="Nada foi salvo ao recarregar">
              <p>
                O sistema ainda não tem banco conectado. Se você recarregar
                esta página, a consultoria que acabou de abrir não vai estar
                na lista.
              </p>
            </Aviso>

            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Como este trabalho ficaria
              </p>
              <div className="mt-3 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-4">
                <ListaDados colunas={2}>
                  <Dado rotulo="Cliente">{cliente?.nome ?? "—"}</Dado>
                  <Dado rotulo="Modalidade">{ROTULO_MODALIDADE[modalidade]}</Dado>
                  <Dado rotulo="Data de início">
                    {inicio ? dataCurta(new Date(`${inicio}T12:00:00`)) : "hoje"}
                  </Dado>
                  <Dado rotulo="Status inicial">Planejamento</Dado>
                  <Dado rotulo="Objetivo principal" largo>
                    {objetivo}
                  </Dado>
                  {observacoes ? (
                    <Dado rotulo="Observações" largo>
                      {observacoes}
                    </Dado>
                  ) : null}
                </ListaDados>
              </div>
            </div>

            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
              <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <span className="font-medium text-tinta">
                  Sem valor e sem prazo de término.
                </span>{" "}
                Os dois dependem de como a Érika define a metodologia dela —
                enquanto isso, o sistema não pergunta nem guarda nenhum dos
                dois.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <CampoSelecao
                label="Cliente"
                name="cliente"
                value={clienteId}
                opcoes={clientes.map((c) => ({ valor: c.id, texto: c.nome }))}
                onChange={(e) => setClienteId(e.target.value)}
                obrigatorio
                ajuda="Só clientes da carteira. Quem ainda é lead precisa ser convertido primeiro."
              />
              <CampoSelecao
                label="Modalidade"
                name="modalidade"
                value={modalidade}
                opcoes={MODALIDADES.map((m) => ({ valor: m, texto: ROTULO_MODALIDADE[m] }))}
                onChange={(e) => setModalidade(e.target.value as Modalidade)}
              />
              <Campo
                label="Data de início"
                name="inicio"
                type="date"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                ajuda="Quando o trabalho começou de fato, não quando foi combinado."
              />
              <div>
                <label
                  htmlFor="objetivo"
                  className="mb-1.5 block text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-suave)] uppercase"
                >
                  Objetivo principal
                  <span className="ml-1 text-dourado">*</span>
                </label>
                <textarea
                  id="objetivo"
                  name="objetivo"
                  rows={3}
                  value={objetivo}
                  onChange={(e) => setObjetivo(e.target.value)}
                  placeholder="O que este trabalho precisa resolver, nas palavras dela."
                  className={
                    "w-full resize-y rounded-[var(--raio-sm)] border border-[var(--linha-forte)] " +
                    "bg-white/70 px-3 py-2 text-[0.9375rem] text-tinta transition-colors " +
                    "placeholder:text-[var(--tinta-fraca)] hover:border-[var(--tinta-fraca)] " +
                    "focus:border-oliva focus:bg-white focus:outline-none"
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="observacoes"
                  className="mb-1.5 block text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-suave)] uppercase"
                >
                  Observações
                </label>
                <textarea
                  id="observacoes"
                  name="observacoes"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="O que já foi combinado, o que ficou de fora…"
                  className={
                    "w-full resize-y rounded-[var(--raio-sm)] border border-[var(--linha-forte)] " +
                    "bg-white/70 px-3 py-2 text-[0.9375rem] text-tinta transition-colors " +
                    "placeholder:text-[var(--tinta-fraca)] hover:border-[var(--tinta-fraca)] " +
                    "focus:border-oliva focus:bg-white focus:outline-none"
                  }
                />
              </div>
            </div>

            <div className="rounded-[var(--raio)] border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.08)] px-4 py-3.5">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[#8a6d1f] uppercase">
                Antes de preencher
              </p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <strong className="font-semibold text-tinta">
                  Nada é salvo ao recarregar.
                </strong>{" "}
                A consultoria não é criada de verdade enquanto o banco não
                estiver conectado.
              </p>
            </div>
          </div>
        )}
      </Gaveta>
    </>
  );
}
