"use client";

import { useRef, useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Aviso } from "@/components/ui/superficie";

/**
 * NOVO PROCESSO — o fluxo de uma praça, passo por passo.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O "+ ADICIONAR PASSO" É O CORAÇÃO DESTE FORMULÁRIO                    │
 * │                                                                      │
 * │ O valor do módulo de processos não está no cabeçalho — praça e turno  │
 * │ são três palavras. Está em escrever a ORDEM dos passos e quem         │
 * │ executa cada um, porque é isso que faz o prato sair igual nos dois    │
 * │ turnos.                                                              │
 * │                                                                      │
 * │ Por isso os passos são linhas de verdade, numeradas automaticamente,  │
 * │ que podem ser reordenadas, editadas e removidas. O número à esquerda  │
 * │ é a ordem, e ele se renumera sozinho quando uma linha sai do meio.    │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O TEMPO É OPCIONAL, E "SEM TEMPO" É UMA RESPOSTA VÁLIDA.
 *
 * Um passo sem tempo declarado é diferente de um passo de zero minuto. Se o
 * campo ficar vazio, a linha conta como "sem tempo" — exatamente como na
 * biblioteca, onde `somaDosTemposDeclarados` devolve `null` em vez de 0.
 * Um campo vazio que virasse zero estaria afirmando que o passo é
 * instantâneo, o que ninguém disse.
 */

type Linha = {
  chave: number;
  descricao: string;
  responsavel: string;
  tempo: string;
};

export function NovoProcesso({
  clientes,
  pratosDoCliente,
  pracasExistentes,
}: {
  clientes: readonly { id: string; nome: string }[];
  /** Pratos por cliente — montado no servidor a partir das fichas. */
  pratosDoCliente: Readonly<Record<string, readonly string[]>>;
  /** Praças que já existem, para não inventar nomes novos a cada cadastro. */
  pracasExistentes: readonly string[];
}) {
  const [aberta, setAberta] = useState(false);
  const [revisando, setRevisando] = useState(false);

  const SEM_PRACA = "__nova__";
  const [clienteId, setClienteId] = useState(clientes[0]?.id ?? "");
  const [praca, setPraca] = useState(pracasExistentes[0] ?? SEM_PRACA);
  const [pracaNova, setPracaNova] = useState("");
  const [turno, setTurno] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [pratos, setPratos] = useState<string[]>([]);
  const [passos, setPassos] = useState<Linha[]>([]);
  const [observacoes, setObservacoes] = useState("");

  const proximaChave = useRef(1);

  const pracaFinal = praca === SEM_PRACA ? pracaNova.trim() : praca;
  const disponiveis = pratosDoCliente[clienteId] ?? [];

  const podeRevisar =
    clienteId !== "" &&
    pracaFinal.length > 0 &&
    turno.trim().length > 0 &&
    responsavel.trim().length > 0;

  function adicionarPasso() {
    setPassos((p) => [
      ...p,
      { chave: proximaChave.current++, descricao: "", responsavel: "", tempo: "" },
    ]);
  }

  function alterarPasso(chave: number, mudanca: Partial<Linha>) {
    setPassos((lista) =>
      lista.map((p) => (p.chave === chave ? { ...p, ...mudanca } : p))
    );
  }

  function mover(chave: number, direcao: -1 | 1) {
    setPassos((lista) => {
      const i = lista.findIndex((p) => p.chave === chave);
      const j = i + direcao;
      if (i < 0 || j < 0 || j >= lista.length) return lista;
      const copia = [...lista];
      const a = copia[i];
      const b = copia[j];
      if (!a || !b) return lista;
      copia[i] = b;
      copia[j] = a;
      return copia;
    });
  }

  function alternarPrato(nome: string) {
    setPratos((l) => (l.includes(nome) ? l.filter((p) => p !== nome) : [...l, nome]));
  }

  function fechar() {
    setAberta(false);
    setRevisando(false);
    setPracaNova("");
    setTurno("");
    setResponsavel("");
    setPratos([]);
    setPassos([]);
    setObservacoes("");
  }

  if (clientes.length === 0) return null;

  return (
    <>
      <Botao variante="primario" tamanho="sm" onClick={() => setAberta(true)}>
        Novo processo
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={fechar}
        titulo={revisando ? "Confira antes de salvar" : "Novo processo"}
        descricao={
          revisando
            ? "Este é o fluxo como ele ficaria. Ainda não foi salvo."
            : "Os passos de uma praça, na ordem em que a equipe executa."
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
                Salvar processo
              </Botao>
            </>
          )
        }
      >
        {revisando ? (
          <div className="space-y-5">
            <Aviso tom="atencao" titulo="Nada foi salvo ao recarregar">
              <p>
                O processo não foi criado. O fluxo que você escreveu aqui some
                ao recarregar a página, enquanto o banco não estiver conectado.
              </p>
            </Aviso>

            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Como este processo ficaria
              </p>
              <dl className="mt-3 divide-y divide-[var(--linha)] rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-2">
                {[
                  ["Cliente", clientes.find((c) => c.id === clienteId)?.nome ?? "—"],
                  ["Praça", pracaFinal],
                  ["Turno", turno],
                  ["Responsável", responsavel],
                  ["Pratos", pratos.length > 0 ? pratos.join(", ") : "nenhum vinculado"],
                  ["Passos", String(passos.length)],
                ].map(([rotulo, valor]) => (
                  <div
                    key={rotulo}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5"
                  >
                    <dt className="text-[0.8125rem] text-[var(--tinta-suave)]">{rotulo}</dt>
                    <dd className="max-w-[60%] text-right text-[0.875rem] text-tinta">
                      {valor}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {passos.length > 0 ? (
              <div>
                <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                  A sequência
                </p>
                <ol className="mt-3 space-y-2.5">
                  {passos.map((p, i) => (
                    <li key={p.chave} className="flex gap-3.5">
                      <span className="mt-0.5 shrink-0 font-display text-[0.875rem] text-oliva tabular">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.875rem] leading-snug text-tinta">
                          {p.descricao || "passo sem descrição"}
                        </p>
                        <p className="mt-0.5 text-[0.75rem] text-[var(--tinta-fraca)]">
                          {p.responsavel || "sem responsável"} ·{" "}
                          {p.tempo.trim() ? `${p.tempo} min` : "sem tempo declarado"}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            ) : (
              <p className="rounded-[var(--raio-sm)] border border-dashed border-[var(--linha-forte)] px-3.5 py-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                Nenhum passo escrito. Um processo sem passos é só o nome da
                praça — o valor dele está na sequência.
              </p>
            )}

            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
              <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <span className="font-medium text-tinta">
                  O tempo é o que a equipe declarou.
                </span>{" "}
                O sistema não cronometra, não mede produtividade e não compara
                praças. Passo sem tempo continua marcado como sem tempo — não
                vira zero.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Identificação da praça ----------------------------------- */}
            <div className="space-y-4">
              <CampoSelecao
                label="Cliente"
                name="cliente"
                value={clienteId}
                opcoes={clientes.map((c) => ({ valor: c.id, texto: c.nome }))}
                onChange={(e) => {
                  setClienteId(e.target.value);
                  // Prato é do acervo do cliente: trocar de cliente limpa a
                  // seleção, senão sobraria um prato que não é daquela cozinha.
                  setPratos([]);
                }}
                obrigatorio
              />
              <CampoSelecao
                label="Praça"
                name="praca"
                value={praca}
                opcoes={[
                  ...pracasExistentes.map((p) => ({ valor: p, texto: p })),
                  { valor: SEM_PRACA, texto: "Nova praça…" },
                ]}
                onChange={(e) => setPraca(e.target.value)}
                obrigatorio
                ajuda="As praças vêm do que já existe. Criar uma nova é permitido."
              />
              {praca === SEM_PRACA ? (
                <Campo
                  label="Nome da nova praça"
                  name="pracaNova"
                  value={pracaNova}
                  onChange={(e) => setPracaNova(e.target.value)}
                  placeholder="Ex.: Passe, Grill, Confeitaria"
                />
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  label="Turno"
                  name="turno"
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                  placeholder="Ex.: Almoço"
                  obrigatorio
                />
                <Campo
                  label="Responsável"
                  name="responsavel"
                  value={responsavel}
                  onChange={(e) => setResponsavel(e.target.value)}
                  placeholder="Quem executa esta praça"
                  obrigatorio
                />
              </div>
            </div>

            {/* Pratos --------------------------------------------------- */}
            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Pratos que passam por aqui
              </p>
              {disponiveis.length === 0 ? (
                <p className="mt-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
                  Este cliente ainda não tem fichas no acervo. Quando tiver, os
                  pratos aparecem aqui para serem vinculados à praça.
                </p>
              ) : (
                <ul className="mt-2.5 flex flex-wrap gap-2">
                  {disponiveis.map((nome) => {
                    const ativo = pratos.includes(nome);
                    return (
                      <li key={nome}>
                        <button
                          type="button"
                          onClick={() => alternarPrato(nome)}
                          aria-pressed={ativo}
                          className={
                            "rounded-[2px] border px-2.5 py-1 text-[0.75rem] transition-colors " +
                            (ativo
                              ? "border-oliva bg-[rgba(107,122,70,0.1)] text-oliva"
                              : "border-[var(--linha-forte)] text-[var(--tinta-suave)] hover:border-tinta hover:text-tinta")
                          }
                        >
                          {nome}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Passos --------------------------------------------------- */}
            <div>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                  Sequência de finalização
                </p>
                {passos.length > 0 ? (
                  <span className="text-[0.75rem] text-[var(--tinta-fraca)] tabular">
                    {passos.length} {passos.length === 1 ? "passo" : "passos"}
                  </span>
                ) : null}
              </div>

              {passos.length > 0 ? (
                <ul className="mt-3 space-y-3">
                  {passos.map((p, i) => (
                    <li
                      key={p.chave}
                      className="rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[var(--superficie)] px-3.5 py-3"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-2 shrink-0 font-display text-[0.9375rem] text-oliva tabular">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0 flex-1">
                          <label
                            htmlFor={`passo-${p.chave}`}
                            className="sr-only"
                          >
                            Passo {i + 1}
                          </label>
                          <textarea
                            id={`passo-${p.chave}`}
                            rows={2}
                            value={p.descricao}
                            onChange={(e) =>
                              alterarPasso(p.chave, { descricao: e.target.value })
                            }
                            placeholder="O que acontece neste passo"
                            className={
                              "w-full resize-y rounded-[var(--raio-sm)] border border-[var(--linha-forte)] " +
                              "bg-white/70 px-3 py-2 text-[0.9375rem] text-tinta transition-colors " +
                              "placeholder:text-[var(--tinta-fraca)] focus:border-oliva focus:bg-white " +
                              "focus:outline-none"
                            }
                          />
                          <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                            <Campo
                              label="Quem executa"
                              name={`resp-${p.chave}`}
                              value={p.responsavel}
                              onChange={(e) =>
                                alterarPasso(p.chave, { responsavel: e.target.value })
                              }
                              placeholder="Ex.: Cozinheiro do passe"
                            />
                            <Campo
                              label="Tempo (min)"
                              name={`tempo-${p.chave}`}
                              inputMode="numeric"
                              value={p.tempo}
                              onChange={(e) =>
                                alterarPasso(p.chave, { tempo: e.target.value })
                              }
                              placeholder="deixe vazio se não souber"
                              ajuda="Declarado pela equipe. Vazio significa sem tempo."
                            />
                          </div>
                        </div>
                        <div className="mt-1 flex shrink-0 flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => mover(p.chave, -1)}
                            disabled={i === 0}
                            aria-label={`Mover passo ${i + 1} para cima`}
                            className="flex h-7 w-7 items-center justify-center rounded-[var(--raio-sm)] text-[var(--tinta-suave)] transition-colors hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <svg width="11" height="7" viewBox="0 0 11 7" aria-hidden>
                              <path
                                d="M1 5.75 5.5 1.25 10 5.75"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => mover(p.chave, 1)}
                            disabled={i === passos.length - 1}
                            aria-label={`Mover passo ${i + 1} para baixo`}
                            className="flex h-7 w-7 items-center justify-center rounded-[var(--raio-sm)] text-[var(--tinta-suave)] transition-colors hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta disabled:opacity-30 disabled:hover:bg-transparent"
                          >
                            <svg width="11" height="7" viewBox="0 0 11 7" aria-hidden>
                              <path
                                d="M1 1.25 5.5 5.75 10 1.25"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPassos((lista) => lista.filter((x) => x.chave !== p.chave))
                            }
                            aria-label={`Remover passo ${i + 1}`}
                            className="flex h-7 w-7 items-center justify-center rounded-[var(--raio-sm)] text-[var(--tinta-suave)] transition-colors hover:bg-[rgba(14,26,20,0.06)] hover:text-tinta"
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
                              <path
                                d="M2 2l8 8M10 2l-8 8"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                  Nenhum passo ainda. Adicione um por vez, na ordem em que
                  acontecem na cozinha — a ordem pode ser ajustada depois.
                </p>
              )}

              <div className="mt-3">
                <Botao variante="secundario" tamanho="sm" onClick={adicionarPasso}>
                  Adicionar passo
                </Botao>
              </div>
            </div>

            {/* Observações ---------------------------------------------- */}
            <div>
              <label
                htmlFor="obs-processo"
                className="mb-1.5 block text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-suave)] uppercase"
              >
                Observações
              </label>
              <textarea
                id="obs-processo"
                name="obs-processo"
                rows={3}
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="O que muda entre turnos, o que costuma travar…"
                className={
                  "w-full resize-y rounded-[var(--raio-sm)] border border-[var(--linha-forte)] " +
                  "bg-white/70 px-3 py-2 text-[0.9375rem] text-tinta transition-colors " +
                  "placeholder:text-[var(--tinta-fraca)] hover:border-[var(--tinta-fraca)] " +
                  "focus:border-oliva focus:bg-white focus:outline-none"
                }
              />
            </div>

            <div className="rounded-[var(--raio)] border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.08)] px-4 py-3.5">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[#8a6d1f] uppercase">
                Antes de preencher
              </p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <strong className="font-semibold text-tinta">
                  Nada é salvo ao recarregar.
                </strong>{" "}
                O processo e os passos que você escrever somem ao recarregar a
                página.
              </p>
            </div>
          </div>
        )}
      </Gaveta>
    </>
  );
}
