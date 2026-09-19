"use client";

import { useState } from "react";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso } from "@/components/ui/superficie";
import { Botao, BotaoLink } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Dado, ListaDados } from "@/components/ui/dados";
import {
  ROTULO_MODALIDADE,
  ROTULO_ORIGEM,
  ROTULO_STATUS,
  ROTULO_TIPO_NEGOCIO,
  dataCurta,
} from "@/lib/dados";
import type {
  Lead,
  Modalidade,
  PorteEstabelecimento,
  SituacaoCliente,
  TipoServico,
} from "@/lib/dados";

/**
 * CONVERTER LEAD EM CLIENTE — a passagem de entrada para operação.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA GAVETA FAZ — E O QUE ELA NÃO FINGE FAZER                  │
 * │                                                                      │
 * │ A conversão é o momento em que um contato vira trabalho. É o clique  │
 * │ mais importante do sistema, e é justamente onde é mais fácil mentir:  │
 * │ mostrar uma tela de sucesso, dizer "cliente criado" e não ter criado  │
 * │ nada.                                                                │
 * │                                                                      │
 * │ Aqui acontece o contrário. A gaveta:                                 │
 * │                                                                      │
 * │  1. MOSTRA o que vai ser aproveitado, campo a campo, distinguindo o   │
 * │     que vem do diagnóstico do que a consultora completa agora;        │
 * │  2. DIZ, antes do clique, exatamente o que vai acontecer — inclusive  │
 * │     que nada é gravado;                                               │
 * │  3. AO CONFIRMAR, mostra a confirmação dizendo que nada foi gravado,  │
 * │     com o caminho para onde o cliente iria.                           │
 * │                                                                      │
 * │ O terceiro passo é o que evita a pior experiência possível: a         │
 * │ consultora converte, fecha o navegador, e o lead continua na fila.    │
 * │ Se o sistema não gravou, ele precisa ter dito.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const TIPOS: readonly TipoServico[] = [
  "BUFFET",
  "A_LA_CARTE",
  "BUFFET_E_A_LA_CARTE",
  "DELIVERY",
  "OUTRO",
];
const PORTES: readonly PorteEstabelecimento[] = ["PEQUENO", "MEDIO", "GRANDE"];
const MODALIDADES: readonly Modalidade[] = ["PRESENCIAL", "ONLINE", "MISTA"];
const SITUACOES: readonly SituacaoCliente[] = ["ATIVO", "EM_IMPLANTACAO", "PAUSADO", "ENCERRADO"];

const ROTULO_PORTE: Record<PorteEstabelecimento, string> = {
  PEQUENO: "Pequeno",
  MEDIO: "Médio",
  GRANDE: "Grande",
};

const ROTULO_SITUACAO: Record<SituacaoCliente, string> = {
  ATIVO: "Ativo",
  EM_IMPLANTACAO: "Em implantação",
  PAUSADO: "Pausado",
  ENCERRADO: "Encerrado",
};

export function ConverterEmCliente({
  lead,
  /** Texto que o lead declarou como maior problema, extraído do diagnóstico. */
  problemaDeclarado,
  /** Campos que o diagnóstico já responde — mostrados como herdados. */
  herdados,
}: {
  lead: Lead;
  problemaDeclarado: string | null;
  herdados: readonly { rotulo: string; valor: string }[];
}) {
  const [aberta, setAberta] = useState(false);
  const [convertido, setConvertido] = useState(false);

  // Os campos que a consultora decide. Começam com o que dá para deduzir do
  // próprio lead e ficam editáveis — nada é preenchido em silêncio.
  const [tipoNegocio, setTipoNegocio] = useState<TipoServico>("A_LA_CARTE");
  const [porte, setPorte] = useState<PorteEstabelecimento>("PEQUENO");
  const [modalidade, setModalidade] = useState<Modalidade>("PRESENCIAL");
  const [situacao, setSituacao] = useState<SituacaoCliente>("EM_IMPLANTACAO");
  const [cidade, setCidade] = useState("");
  const [funcionarios, setFuncionarios] = useState("");
  const [problema, setProblema] = useState(problemaDeclarado ?? "");
  const [aviso, setAviso] = useState<string | null>(null);

  const problemaFinal = problema.trim() || problemaDeclarado || lead.sinal;

  function confirmar() {
    setConvertido(true);
    setAviso(
      `A conversão de “${lead.nomeFantasia}” foi simulada, e nada foi gravado: o sistema ainda não tem banco conectado. O lead continua na fila e nenhum cliente foi criado.`
    );
  }

  function fechar() {
    setAberta(false);
    // O estado de "convertido" é zerado ao fechar de propósito: se a
    // consultora abrir de novo, ela precisa ver o formulário outra vez —
    // não um cartão de sucesso de uma conversão que não aconteceu.
    setConvertido(false);
    setAviso(null);
  }

  return (
    <>
      <Botao
        variante="primario"
        tamanho="md"
        onClick={() => setAberta(true)}
        disabled={convertido}
      >
        {convertido ? "Conversão simulada" : "Converter em cliente"}
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={fechar}
        titulo={convertido ? "Conversão simulada" : "Converter em cliente"}
        descricao={
          convertido
            ? "Nada foi gravado. Veja abaixo o que teria acontecido."
            : "Este é o momento em que um contato vira trabalho. Confira o que vem do diagnóstico e complete o que falta."
        }
        acoes={
          convertido ? (
            <>
              <Botao variante="linha" tamanho="sm" onClick={fechar}>
                Fechar
              </Botao>
              <BotaoLink href="/clientes" variante="secundario" tamanho="sm">
                Ver a carteira
              </BotaoLink>
            </>
          ) : (
            <>
              <Botao variante="linha" tamanho="sm" onClick={fechar}>
                Cancelar
              </Botao>
              <Botao variante="primario" tamanho="sm" onClick={confirmar}>
                Converter em cliente
              </Botao>
            </>
          )
        }
      >
        {convertido ? (
          /* ---- Confirmação: honesta sobre o que NÃO aconteceu ---------- */
          <div className="space-y-5">
            <Aviso tom="atencao" titulo="Nada foi gravado">
              <p>
                A conversão foi simulada para que se possa avaliar como o
                fluxo funcionaria. Nenhum cliente foi criado, o lead
                continua na fila com o status atual e não há registro novo
                em lugar nenhum.
              </p>
            </Aviso>

            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                O que teria sido criado
              </p>
              <div className="mt-3 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-4">
                <ListaDados colunas={2}>
                  <Dado rotulo="Empresa">{lead.nomeFantasia}</Dado>
                  <Dado rotulo="Responsável">{lead.nomeContato}</Dado>
                  <Dado rotulo="Tipo de negócio">{ROTULO_TIPO_NEGOCIO[tipoNegocio]}</Dado>
                  <Dado rotulo="Modalidade">{ROTULO_MODALIDADE[modalidade]}</Dado>
                  <Dado rotulo="Situação inicial">{ROTULO_SITUACAO[situacao]}</Dado>
                  <Dado rotulo="Porte">{ROTULO_PORTE[porte]}</Dado>
                  <Dado rotulo="Cidade">{cidade || "não informada"}</Dado>
                  <Dado rotulo="Equipe declarada">
                    {funcionarios || "não informada"}
                  </Dado>
                  <Dado rotulo="Origem" largo>
                    {ROTULO_ORIGEM[lead.origem]}
                  </Dado>
                  <Dado rotulo="Problema declarado" largo>
                    {problemaFinal}
                  </Dado>
                </ListaDados>
              </div>
            </div>

            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
              <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <span className="font-medium text-tinta">O lead não mudou de status.</span>{" "}
                Continuaria <Etiqueta>{ROTULO_STATUS[lead.status]}</Etiqueta> na fila — é
                assim que se percebe que a conversão não gravou.
              </p>
            </div>
          </div>
        ) : (
          /* ---- O formulário de conversão ------------------------------- */
          <div className="space-y-6">
            {aviso ? (
              <p
                role="status"
                className="rounded-[var(--raio-sm)] border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.09)] px-3.5 py-2.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]"
              >
                {aviso}
              </p>
            ) : null}

            {/* 1. Resumo do lead ---------------------------------------- */}
            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                De quem se trata
              </p>
              <div className="mt-3 rounded-[var(--raio)] border border-[var(--linha)] bg-white/60 px-4 py-4">
                <p className="text-[1rem] font-medium text-tinta">{lead.nomeFantasia}</p>
                <p className="mt-1 text-[0.875rem] text-[var(--tinta-suave)]">
                  {lead.nomeContato} · {lead.whatsapp}
                </p>
                <p className="mt-0.5 text-[0.875rem] text-[var(--tinta-suave)]">{lead.email}</p>
                <p className="mt-2.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
                  Entrou em {dataCurta(lead.criadoEm)} pela origem{" "}
                  {ROTULO_ORIGEM[lead.origem].toLowerCase()} ·{" "}
                  <Etiqueta>{ROTULO_STATUS[lead.status]}</Etiqueta>
                </p>
              </div>
            </div>

            {/* 2. O que vem do diagnóstico ------------------------------ */}
            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                O que já vem preenchido
              </p>
              <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                Estes dados foram declarados por ele no diagnóstico e passam
                direto para o cadastro. Nada aqui foi deduzido pelo sistema.
              </p>
              {herdados.length === 0 ? (
                <p className="mt-3 rounded-[var(--raio-sm)] border border-dashed border-[var(--linha-forte)] px-3.5 py-2.5 text-[0.8125rem] text-[var(--tinta-fraca)]">
                  Este lead não tem diagnóstico vinculado, então nada pode ser
                  aproveitado automaticamente. Os dados abaixo serão
                  preenchidos por você.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {herdados.map((h) => (
                    <li
                      key={h.rotulo}
                      className="flex items-baseline justify-between gap-4 border-l-2 border-l-oliva/60 bg-[rgba(107,122,70,0.05)] px-3.5 py-2.5"
                    >
                      <span className="text-[0.8125rem] text-[var(--tinta-fraca)]">
                        {h.rotulo}
                      </span>
                      <span className="text-right text-[0.875rem] text-tinta">{h.valor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 3. O que a consultora completa --------------------------- */}
            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                O que você completa agora
              </p>
              <div className="mt-3 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <CampoSelecao
                    label="Tipo de negócio"
                    name="tipo"
                    value={tipoNegocio}
                    opcoes={TIPOS.map((t) => ({ valor: t, texto: ROTULO_TIPO_NEGOCIO[t] }))}
                    onChange={(e) => setTipoNegocio(e.target.value as TipoServico)}
                  />
                  <CampoSelecao
                    label="Porte"
                    name="porte"
                    value={porte}
                    opcoes={PORTES.map((p) => ({ valor: p, texto: ROTULO_PORTE[p] }))}
                    onChange={(e) => setPorte(e.target.value as PorteEstabelecimento)}
                  />
                  <CampoSelecao
                    label="Modalidade do atendimento"
                    name="modalidade"
                    value={modalidade}
                    opcoes={MODALIDADES.map((m) => ({
                      valor: m,
                      texto: ROTULO_MODALIDADE[m],
                    }))}
                    onChange={(e) => setModalidade(e.target.value as Modalidade)}
                  />
                  <CampoSelecao
                    label="Situação inicial"
                    name="situacao"
                    value={situacao}
                    opcoes={SITUACOES.map((s) => ({ valor: s, texto: ROTULO_SITUACAO[s] }))}
                    onChange={(e) => setSituacao(e.target.value as SituacaoCliente)}
                    ajuda="O sistema não decide isso sozinho — quem sabe em que ponto o trabalho começa é você."
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo
                    label="Cidade"
                    name="cidade"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    placeholder="Ex.: Gramado"
                  />
                  <Campo
                    label="Equipe declarada"
                    name="funcionarios"
                    value={funcionarios}
                    onChange={(e) => setFuncionarios(e.target.value)}
                    placeholder="Ex.: 8 pessoas na cozinha"
                  />
                </div>
                <Campo
                  label="Problema declarado"
                  name="problema"
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  ajuda="O que ele mesmo disse que precisa resolver. É o que abre a ficha do cliente."
                />
              </div>
            </div>

            {/* 4. O que vai acontecer ----------------------------------- */}
            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                O que acontece ao converter
              </p>
              <ul className="mt-2.5 space-y-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <li>
                  · Um cliente seria criado na carteira, ligado a este lead pelo
                  vínculo de origem.
                </li>
                <li>
                  · O diagnóstico dele passaria a aparecer na aba Diagnóstico
                  do cliente, sem precisar ser digitado de novo.
                </li>
                <li>
                  · O lead sairia da fila com o status{" "}
                  <span className="font-medium text-tinta">Convertido</span>.
                </li>
                <li className="text-[var(--tinta-fraca)]">
                  · Nenhum dos três acontece de verdade: nada é gravado.
                </li>
              </ul>
            </div>
          </div>
        )}
      </Gaveta>

    </>
  );
}
