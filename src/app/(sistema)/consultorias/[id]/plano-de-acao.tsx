"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, EstadoVazio, Secao } from "@/components/ui/superficie";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import {
  ROTULO_PRIORIDADE,
  ROTULO_STATUS_ACAO,
  TOM_PRIORIDADE,
  contarAcoes,
  dataCurta,
} from "@/lib/dados";
import type { AcaoPlano, Prioridade, StatusAcao } from "@/lib/dados";

/**
 * PLANO DE AÇÃO — a parte que se move.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA INTERAÇÃO EXISTE, SE A SEÇÃO 30 PROÍBE PERSISTIR         │
 * │                                                                      │
 * │ Uma demonstração de sistema de gestão em que nada se move não         │
 * │ demonstra nada. O plano de ação é justamente onde a consultora passa  │
 * │ o dia: marca o que andou, o que voltou para o cliente, o que fechou.  │
 * │                                                                      │
 * │ Então a interação EXISTE — e é honesta nos três pontos que importam:  │
 * │                                                                      │
 * │ 1. O aviso de que nada é gravado fica ACIMA do plano, não escondido   │
 * │    num rodapé. Quem mexer vê o aviso antes de mexer.                  │
 * │ 2. Recarregar a página devolve tudo ao estado original, e isso está   │
 * │    escrito. É o comportamento esperado, não um defeito surpresa.      │
 * │ 3. O estado vive na MEMÓRIA da tela. `localStorage` não é usado: não  │
 * │    existe decisão arquitetural documentada autorizando usá-lo como    │
 * │    banco, e a Seção 30 foi explícita quanto a isso.                   │
 * │                                                                      │
 * │ Quando o banco entrar, este componente troca as duas funções locais    │
 * │ pelas do contrato `RepositorioOperacaoEscrita` — que já está escrito   │
 * │ com a assinatura certa. Nada de layout muda.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const STATUS: readonly StatusAcao[] = ["A_FAZER", "EM_ANDAMENTO", "AGUARDANDO_CLIENTE", "CONCLUIDO"];
const PRIORIDADES: readonly Prioridade[] = ["ALTA", "MEDIA", "BAIXA"];

type AbaStatus = StatusAcao | "TODAS";

export function PlanoDeAcao({
  consultoriaId,
  clienteId,
  acoes: acoesIniciais,
}: {
  consultoriaId: string;
  clienteId: string;
  acoes: readonly AcaoPlano[];
}) {
  // O estado local é uma CÓPIA da lista que veio do servidor. É ele que muda
  // quando a consultora mexe — e é por isso que a mudança desaparece ao
  // recarregar.
  const [acoes, setAcoes] = useState<AcaoPlano[]>(() => [...acoesIniciais]);
  const [filtro, setFiltro] = useState<AbaStatus>("TODAS");
  const [rascunho, setRascunho] = useState<AcaoPlano | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const contagem = useMemo(() => contarAcoes(acoes), [acoes]);

  const visiveis = filtro === "TODAS" ? acoes : acoes.filter((a) => a.status === filtro);

  function mudarStatus(id: string, status: StatusAcao) {
    setAcoes((atuais) => atuais.map((a) => (a.id === id ? { ...a, status } : a)));
    const alvo = acoes.find((a) => a.id === id);
    setAviso(
      `“${alvo?.titulo ?? "Ação"}” foi marcada como ${ROTULO_STATUS_ACAO[status].toLowerCase()} — na demonstração. Ao recarregar, volta ao estado original.`
    );
  }

  function salvarNova() {
    if (!rascunho || !rascunho.titulo.trim()) return;
    setAcoes((atuais) => [rascunho, ...atuais]);
    setAviso(
      `A ação “${rascunho.titulo}” foi adicionada à lista — na demonstração. Ela desaparece ao recarregar a página.`
    );
    setRascunho(null);
  }

  return (
    <div className="space-y-5">
      {/* O aviso vem ANTES do plano. Ver a nota no topo do arquivo. */}
      <Aviso tom="atencao" titulo="As alterações desta tela não são gravadas">
        <p>
          Você pode mudar o status de uma ação e adicionar novas — a tela
          responde na hora, para que se possa avaliar como seria o uso. Mas
          nada vai para o banco: o sistema ainda não tem conexão configurada
          para isso.
        </p>
        <p className="mt-2.5">
          Recarregar a página devolve o plano ao estado original. Isso é o
          comportamento esperado nesta fase, e não uma falha.
        </p>
      </Aviso>

      <Secao
        rotulo="Plano de ação"
        titulo={
          contagem.total === 0
            ? "Nenhuma ação registrada"
            : `${contagem.concluidas} de ${contagem.total} concluídas`
        }
        descricao="O que foi combinado com este cliente. Mover o status é um clique — e a demonstração deixa claro o que aconteceria."
        acoes={
          <Botao variante="primario" tamanho="sm" onClick={() => setRascunho(novaAcao(consultoriaId, clienteId))}>
            Nova ação
          </Botao>
        }
      >
        {/* Filtro por status. Estado local de propósito: não é navegação, é
            uma lente sobre a mesma lista — e sobrevive ao clique de status. */}
        <div className="flex flex-wrap items-center gap-2">
          <BotaoFiltro ativo={filtro === "TODAS"} aoClicar={() => setFiltro("TODAS")}>
            Todas · {contagem.total}
          </BotaoFiltro>
          {STATUS.map((s) => {
            const n = acoes.filter((a) => a.status === s).length;
            return (
              <BotaoFiltro key={s} ativo={filtro === s} aoClicar={() => setFiltro(s)}>
                {ROTULO_STATUS_ACAO[s]} · {n}
              </BotaoFiltro>
            );
          })}
        </div>

        {aviso ? (
          <p
            role="status"
            className="mt-4 rounded-[var(--raio-sm)] border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.09)] px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]"
          >
            {aviso}
          </p>
        ) : null}

        <div className="mt-5">
          {visiveis.length === 0 ? (
            <EstadoVazio
              titulo={
                acoes.length === 0
                  ? "O plano ainda não foi escrito"
                  : "Nenhuma ação com este status"
              }
              descricao={
                acoes.length === 0
                  ? "O plano de ação nasce da leitura do diagnóstico: cada item é algo combinado com o cliente, com responsável e prazo."
                  : "Existem ações no plano, mas nenhuma neste status agora. Trocar o filtro mostra as demais."
              }
              acao={
                acoes.length === 0 ? (
                  <Botao
                    variante="secundario"
                    tamanho="sm"
                    onClick={() => setRascunho(novaAcao(consultoriaId, clienteId))}
                  >
                    Escrever a primeira ação
                  </Botao>
                ) : (
                  <Botao variante="secundario" tamanho="sm" onClick={() => setFiltro("TODAS")}>
                    Ver todas
                  </Botao>
                )
              }
            />
          ) : (
            <ul className="divide-y divide-[var(--linha)]">
              {visiveis.map((a) => (
                <li key={a.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          "text-[0.9375rem] leading-snug",
                          a.status === "CONCLUIDO"
                            ? "text-[var(--tinta-fraca)] line-through decoration-[var(--linha-forte)]"
                            : "font-medium text-tinta"
                        )}
                      >
                        {a.titulo}
                      </p>
                      <p className="mt-1.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                        {a.descricao}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Etiqueta tom={TOM_PRIORIDADE[a.prioridade]}>
                        {ROTULO_PRIORIDADE[a.prioridade]}
                      </Etiqueta>
                      <Etiqueta>{ROTULO_STATUS_ACAO[a.status]}</Etiqueta>
                    </div>
                  </div>

                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[0.8125rem]">
                    <div className="flex items-baseline gap-1.5">
                      <dt className="text-[var(--tinta-fraca)]">Responsável</dt>
                      <dd className="text-[var(--tinta-suave)]">{a.responsavel}</dd>
                    </div>
                    <div className="flex items-baseline gap-1.5">
                      <dt className="text-[var(--tinta-fraca)]">Prazo</dt>
                      <dd className="tabular text-[var(--tinta-suave)]">
                        {a.prazo ? dataCurta(a.prazo) : "sem prazo"}
                      </dd>
                    </div>
                  </dl>

                  {a.observacao ? (
                    <p className="mt-2.5 border-l-2 border-l-[var(--linha-forte)] pl-3 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
                      {a.observacao}
                    </p>
                  ) : null}

                  {/* A troca de status.
                      São botões, e não um `<select>`: são quatro opções e a
                      consultora alterna entre elas muitas vezes por dia. Um
                      select custaria dois cliques por mudança e esconderia
                      qual é o status atual. */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[0.625rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                      Mover para
                    </span>
                    {STATUS.filter((s) => s !== a.status).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => mudarStatus(a.id, s)}
                        className={cn(
                          "rounded-[2px] border border-[var(--linha)] px-2 py-1 text-[0.6875rem]",
                          "text-[var(--tinta-suave)] uppercase tracking-[0.1em] transition-colors",
                          "hover:border-tinta hover:bg-tinta hover:text-off"
                        )}
                      >
                        {ROTULO_STATUS_ACAO[s]}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Secao>

      {/* Nova ação ------------------------------------------------------- */}
      <Gaveta
        aberta={rascunho !== null}
        aoFechar={() => setRascunho(null)}
        titulo="Nova ação do plano"
        descricao="O que foi combinado com o cliente. Fica na demonstração: nada é gravado."
        acoes={
          <>
            <Botao variante="linha" tamanho="sm" onClick={() => setRascunho(null)}>
              Cancelar
            </Botao>
            <Botao
              variante="primario"
              tamanho="sm"
              onClick={salvarNova}
              disabled={!rascunho?.titulo.trim()}
            >
              Adicionar à lista
            </Botao>
          </>
        }
      >
        {rascunho ? (
          <div className="space-y-4">
            <Campo
              label="Título"
              name="titulo"
              value={rascunho.titulo}
              onChange={(e) => setRascunho({ ...rascunho, titulo: e.target.value })}
              placeholder="Ex.: Pesar três montagens por prato"
              autoFocus
            />
            <Campo
              label="O que precisa ser feito"
              name="descricao"
              value={rascunho.descricao}
              onChange={(e) => setRascunho({ ...rascunho, descricao: e.target.value })}
              placeholder="Contexto suficiente para a ação fazer sentido daqui a um mês"
            />
            <Campo
              label="Responsável"
              name="responsavel"
              value={rascunho.responsavel}
              onChange={(e) => setRascunho({ ...rascunho, responsavel: e.target.value })}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoSelecao
                label="Prioridade"
                name="prioridade"
                value={rascunho.prioridade}
                opcoes={PRIORIDADES.map((p) => ({ valor: p, texto: ROTULO_PRIORIDADE[p] }))}
                onChange={(e) =>
                  setRascunho({ ...rascunho, prioridade: e.target.value as Prioridade })
                }
              />
              <CampoSelecao
                label="Status inicial"
                name="status"
                value={rascunho.status}
                opcoes={STATUS.map((s) => ({ valor: s, texto: ROTULO_STATUS_ACAO[s] }))}
                onChange={(e) => setRascunho({ ...rascunho, status: e.target.value as StatusAcao })}
              />
            </div>
            <Campo
              label="Observação"
              name="observacao"
              value={rascunho.observacao}
              onChange={(e) => setRascunho({ ...rascunho, observacao: e.target.value })}
              placeholder="Opcional — o que é bom não esquecer sobre esta ação"
            />

            <p className="rounded-[var(--raio-sm)] border border-dashed border-[var(--linha-forte)] px-3.5 py-2.5 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
              Adicionar aqui coloca a ação na lista desta tela. Ela não é
              enviada para nenhum banco e desaparece quando a página for
              recarregada.
            </p>
          </div>
        ) : null}
      </Gaveta>
    </div>
  );
}

function BotaoFiltro({
  ativo,
  aoClicar,
  children,
}: {
  ativo: boolean;
  aoClicar: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={aoClicar}
      aria-pressed={ativo}
      className={cn(
        "rounded-[2px] border px-2.5 py-1 text-[0.6875rem] font-semibold tracking-[0.1em] uppercase transition-colors",
        ativo
          ? "border-tinta bg-tinta text-off"
          : "border-[var(--linha-forte)] text-[var(--tinta-suave)] hover:border-tinta hover:text-tinta"
      )}
    >
      {children}
    </button>
  );
}

/**
 * Uma ação em branco, já com consultoria e cliente preenchidos.
 *
 * O id é gerado com `Date.now()` porque estas ações NÃO existem fora desta
 * tela — quem vai gerar id de verdade é o banco. Inventar um formato de id
 * que depois não bate com o do Prisma seria criar trabalho para desfazer.
 */
function novaAcao(consultoriaId: string, clienteId: string): AcaoPlano {
  return {
    id: `local_${Date.now()}`,
    consultoriaId,
    clienteId,
    titulo: "",
    descricao: "",
    responsavel: "Érika Bruna",
    prioridade: "MEDIA",
    status: "A_FAZER",
    prazo: null,
    observacao: "",
    criadoEm: new Date(),
  };
}
