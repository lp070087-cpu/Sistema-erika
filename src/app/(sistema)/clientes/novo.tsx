"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Aviso } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { ROTULO_MODALIDADE, ROTULO_TIPO_NEGOCIO } from "@/lib/dados";
import type { Modalidade, TipoServico } from "@/lib/dados";

/**
 * NOVO CLIENTE — o cadastro à mão.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTE FORMULÁRIO EXISTE POR CAUSA DE UM CLIENTE SÓ                     │
 * │                                                                      │
 * │ Quatro dos cinco clientes da carteira vieram da fila de leads. O      │
 * │ quinto, Quintal da Maria, chegou por indicação — não houve            │
 * │ formulário, não houve diagnóstico, ninguém respondeu nada. Uma        │
 * │ conversa, um combinado, e o trabalho começou.                        │
 * │                                                                      │
 * │ Sem um cadastro manual, esse cliente não teria como existir no        │
 * │ sistema. E é o caso mais comum na vida real, não a exceção.           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * O QUE ELE NÃO FAZ
 *
 * Não grava. E diz isso ANTES do clique, no próprio formulário — não numa
 * tela de sucesso depois. A Seção 14 do briefing pediu exatamente isso:
 * "Não usar localStorage. Não fingir persistência."
 *
 * Por isso o rodapé tem um aviso permanente em vez de um aviso que aparece
 * só no fim: quem preencheu seis campos precisa saber, enquanto preenche,
 * que o trabalho dele vai embora ao recarregar. É chato. É a verdade.
 *
 * O ESTADO É LOCAL E MORRE COM A PÁGINA. Nada é escrito em disco, nada vai
 * para a URL, nada sobrevive a um F5 — que é a única prova honesta de que
 * o sistema não está fingindo gravar.
 */

const TIPOS: readonly TipoServico[] = [
  "BUFFET",
  "A_LA_CARTE",
  "BUFFET_E_A_LA_CARTE",
  "DELIVERY",
  "OUTRO",
];
const MODALIDADES: readonly Modalidade[] = ["PRESENCIAL", "ONLINE", "MISTA"];

type Rascunho = {
  nomeFantasia: string;
  nomeContato: string;
  tipoNegocio: TipoServico;
  whatsapp: string;
  email: string;
  modalidade: Modalidade;
  observacao: string;
};

const VAZIO: Rascunho = {
  nomeFantasia: "",
  nomeContato: "",
  tipoNegocio: "A_LA_CARTE",
  whatsapp: "",
  email: "",
  modalidade: "PRESENCIAL",
  observacao: "",
};

export function NovoCliente() {
  const [aberta, setAberta] = useState(false);
  const [rascunho, setRascunho] = useState<Rascunho>(VAZIO);
  const [revisando, setRevisando] = useState(false);

  // O único campo que o sistema exige é o nome. Exigir WhatsApp e e-mail
  // seria copiar a obrigatoriedade do formulário público — e aqui quem
  // digita é a consultora, que muitas vezes anota o contato no papel e
  // completa o resto depois.
  const podeRevisar = rascunho.nomeFantasia.trim().length > 0;

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
        Novo cliente
      </Botao>

      <Gaveta
        aberta={aberta}
        aoFechar={fechar}
        titulo={revisando ? "Confira antes de adicionar" : "Novo cliente"}
        descricao={
          revisando
            ? "Este é o cadastro como ele ficaria. Ainda não foi salvo."
            : "Para clientes que chegaram sem passar pelo formulário do site."
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
                Adicionar cliente
              </Botao>
            </>
          )
        }
      >
        {revisando ? (
          <div className="space-y-5">
            <Aviso tom="atencao" titulo="Dados de demonstração não são salvos ao recarregar">
              <p>
                Nada foi gravado. O sistema ainda não tem banco conectado — se
                você recarregar esta página, o cliente que acabou de preencher
                não vai estar na carteira.
              </p>
            </Aviso>

            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Como este cliente ficaria
              </p>
              <div className="mt-3 rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-4">
                <ListaDados colunas={2}>
                  <Dado rotulo="Estabelecimento">{rascunho.nomeFantasia}</Dado>
                  <Dado rotulo="Responsável">
                    {rascunho.nomeContato || "não informado"}
                  </Dado>
                  <Dado rotulo="Tipo de negócio">
                    {ROTULO_TIPO_NEGOCIO[rascunho.tipoNegocio]}
                  </Dado>
                  <Dado rotulo="Modalidade">
                    {ROTULO_MODALIDADE[rascunho.modalidade]}
                  </Dado>
                  <Dado rotulo="WhatsApp">{rascunho.whatsapp || "não informado"}</Dado>
                  <Dado rotulo="E-mail">{rascunho.email || "não informado"}</Dado>
                  <Dado rotulo="Situação inicial" largo>
                    Em implantação — todo cliente manual começa aqui, e você
                    muda depois.
                  </Dado>
                  {rascunho.observacao ? (
                    <Dado rotulo="Observação" largo>
                      {rascunho.observacao}
                    </Dado>
                  ) : null}
                </ListaDados>
              </div>
            </div>

            <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] px-4 py-3.5">
              <p className="text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <span className="font-medium text-tinta">
                  A carteira continua com cinco clientes.
                </span>{" "}
                É assim que se percebe que nada gravou: volte para a lista e
                conte.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <Campo
                label="Nome do estabelecimento"
                name="nomeFantasia"
                value={rascunho.nomeFantasia}
                onChange={(e) => campo("nomeFantasia", e.target.value)}
                placeholder="Ex.: Quintal da Maria"
                obrigatorio
              />
              <Campo
                label="Responsável"
                name="nomeContato"
                value={rascunho.nomeContato}
                onChange={(e) => campo("nomeContato", e.target.value)}
                placeholder="Quem atende pela casa"
              />
              <CampoSelecao
                label="Tipo de negócio"
                name="tipoNegocio"
                value={rascunho.tipoNegocio}
                opcoes={TIPOS.map((t) => ({ valor: t, texto: ROTULO_TIPO_NEGOCIO[t] }))}
                onChange={(e) => campo("tipoNegocio", e.target.value as TipoServico)}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo
                  label="WhatsApp"
                  name="whatsapp"
                  value={rascunho.whatsapp}
                  onChange={(e) => campo("whatsapp", e.target.value)}
                  placeholder="(51) 90000-0000"
                />
                <Campo
                  label="E-mail"
                  name="email"
                  type="email"
                  value={rascunho.email}
                  onChange={(e) => campo("email", e.target.value)}
                  placeholder="contato@exemplo.com.br"
                />
              </div>
              <CampoSelecao
                label="Modalidade do atendimento"
                name="modalidade"
                value={rascunho.modalidade}
                opcoes={MODALIDADES.map((m) => ({ valor: m, texto: ROTULO_MODALIDADE[m] }))}
                onChange={(e) => campo("modalidade", e.target.value as Modalidade)}
                ajuda="Presencial, online ou os dois. É você quem define."
              />
              <Campo
                label="Observação"
                name="observacao"
                value={rascunho.observacao}
                onChange={(e) => campo("observacao", e.target.value)}
                placeholder="Como o contato chegou, o que já foi combinado…"
                ajuda="Fica no cadastro como anotação interna. Não é enviado a ninguém."
              />
            </div>

            {/*
              O aviso fica DENTRO do formulário, não no rodapé da gaveta.
              Quem preencheu os campos precisa tropeçar nele antes de
              clicar — não depois, e não num canto da tela.
            */}
            <div className="rounded-[var(--raio)] border border-dashed border-dourado/70 bg-[rgba(201,165,78,0.08)] px-4 py-3.5">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[#8a6d1f] uppercase">
                Antes de preencher
              </p>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <strong className="font-semibold text-tinta">
                  Dados de demonstração não são salvos ao recarregar.
                </strong>{" "}
                O cadastro funciona para você ver como seria, mas depende do
                banco de dados — que ainda não está conectado. Ao recarregar a
                página, o formulário volta vazio.
              </p>
            </div>
          </div>
        )}
      </Gaveta>
    </>
  );
}
