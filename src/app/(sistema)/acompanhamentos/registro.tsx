"use client";

import { useState } from "react";
import { Botao } from "@/components/ui/botao";
import { Campo, CampoSelecao } from "@/components/ui/campo";
import { Gaveta } from "@/components/ui/gaveta";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, Secao } from "@/components/ui/superficie";
import { CartaoAcompanhamento } from "@/components/ui/acompanhamento";
import { AvisoInteracao } from "@/components/ui/demonstracao-interativa";
import { ROTULO_TIPO_ACOMPANHAMENTO } from "@/lib/dados";
import type { Acompanhamento, ClienteOperacao, Consultoria, TipoAcompanhamento } from "@/lib/dados";

/**
 * §17 — REGISTRO DE ACOMPANHAMENTO, LOCAL.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA É A TELA ONDE MAIS DÁ VONTADE DE MENTIR                         │
 * │                                                                      │
 * │ Registrar um acompanhamento e ver ele aparecer na lista é a coisa     │
 * │ mais convincente que a demonstração pode fazer. É também a mais fácil │
 * │ de fazer errado: bastaria gravar no localStorage e a Érika sairia da   │
 * │ apresentação com a impressão de que o sistema já guarda.              │
 * │                                                                      │
 * │ A §30 é explícita — nada de localStorage como substituto improvisado  │
 * │ de banco. Então o registro acontece de verdade, em memória, e a tela  │
 * │ diz onde ele vive: some ao recarregar, e isso é esperado.             │
 * │                                                                      │
 * │ O que ganha com isso é a única coisa que importa numa demonstração:   │
 * │ ela vê o fluxo inteiro funcionando — preenche, salva, aparece no      │
 * │ topo da lista com a data de hoje. Depois a conversa sobre persistir   │
 * │ acontece com o banco de verdade, na Fase 3, e não com um atalho.      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O CLIENTE VEM DO SELETOR, NÃO DE TEXTO LIVRE                          │
 * │                                                                      │
 * │ Digitar o nome do cliente à mão criaria um acompanhamento que não     │
 * │ pertence a ninguém — e o vínculo cliente↔consultoria↔acompanhamento,  │
 * │ que é o que faz o dado RELACIONAR (§28), se perderia na primeira      │
 * │ linha. Por isso a consultoria é derivada do cliente escolhido, e não  │
 * │ um segundo campo para preencher errado.                               │
 * └──────────────────────────────────────────────────────────────────────┘
 */

const TIPOS: readonly TipoAcompanhamento[] = ["REUNIAO", "VISITA", "ANALISE", "RETORNO", "REVISAO"];

export function RegistroDeAcompanhamento({
  acompanhamentos: acompanhamentosIniciais,
  clientes,
  consultorias,
}: {
  acompanhamentos: readonly Acompanhamento[];
  clientes: readonly ClienteOperacao[];
  consultorias: readonly Consultoria[];
}) {
  const [itens, setItens] = useState<readonly Acompanhamento[]>(acompanhamentosIniciais);
  const [aberta, setAberta] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const clientePorId = new Map(clientes.map((c) => [c.id, c]));
  // Consultoria por cliente: um cliente pode ter mais de uma no histórico,
  // mas só uma em andamento — é essa que recebe o acompanhamento novo.
  const consultoriaDoCliente = (clienteId: string): Consultoria | null =>
    consultorias.find((c) => c.clienteId === clienteId && c.status !== "CONCLUIDA") ??
    consultorias.find((c) => c.clienteId === clienteId) ??
    null;

  const registrar = (novo: Acompanhamento) => {
    setItens((atual) =>
      [novo, ...atual].sort((a, b) => b.data.getTime() - a.data.getTime())
    );
    setAviso(
      `“${novo.titulo}” entrou no topo da lista. Ele vai desaparecer se a página for recarregada — nada foi gravado em banco.`
    );
    setAberta(false);
  };

  return (
    <>
      <Secao
        rotulo={`${itens.length} ${itens.length === 1 ? "registro" : "registros"}`}
        titulo="Acompanhamentos"
        descricao="Reuniões, visitas, análises, retornos e revisões, do mais recente para o mais antigo. Cada registro guarda o que foi discutido, o que ficou pendente e qual é o próximo passo."
        acoes={
          <Botao variante="primario" tamanho="sm" onClick={() => setAberta(true)}>
            Novo acompanhamento
          </Botao>
        }
      >
        <AvisoInteracao
          oQue="registrar um acompanhamento"
          oQueVolta="a lista original"
          className="mb-5"
        />

        {aviso ? (
          <div role="status" className="mb-5">
            <Aviso tom="sucesso" titulo="Registrado nesta sessão">
              <p>{aviso}</p>
            </Aviso>
          </div>
        ) : null}

        {itens.length === 0 ? (
          <p className="text-[0.875rem] text-[var(--tinta-suave)]">
            Nenhum acompanhamento com esses filtros.
          </p>
        ) : (
          <ol className="space-y-5">
            {itens.map((a, i) => {
              const dono = clientePorId.get(a.clienteId);
              return (
                <CartaoAcompanhamento
                  key={a.id}
                  acompanhamento={a}
                  destaque={i === 0}
                  contexto={
                    dono ? (
                      <span className="text-[var(--tinta-suave)]">{dono.nomeFantasia}</span>
                    ) : (
                      <span className="text-[var(--tinta-fraca)]">cliente não identificado</span>
                    )
                  }
                />
              );
            })}
          </ol>
        )}
      </Secao>

      <FormularioDeAcompanhamento
        aberta={aberta}
        aoFechar={() => setAberta(false)}
        clientes={clientes}
        consultoriaDoCliente={consultoriaDoCliente}
        aoRegistrar={registrar}
      />
    </>
  );
}

function FormularioDeAcompanhamento({
  aberta,
  aoFechar,
  clientes,
  consultoriaDoCliente,
  aoRegistrar,
}: {
  aberta: boolean;
  aoFechar: () => void;
  clientes: readonly ClienteOperacao[];
  consultoriaDoCliente: (clienteId: string) => Consultoria | null;
  aoRegistrar: (a: Acompanhamento) => void;
}) {
  const [clienteId, setClienteId] = useState("");
  const [tipo, setTipo] = useState<TipoAcompanhamento>("REUNIAO");
  const [titulo, setTitulo] = useState("");
  const [resumo, setResumo] = useState("");
  const [pendencia, setPendencia] = useState("");
  const [proximaAcao, setProximaAcao] = useState("");

  const consultoria = clienteId ? consultoriaDoCliente(clienteId) : null;
  const cliente = clientes.find((c) => c.id === clienteId) ?? null;

  const podeSalvar = clienteId !== "" && titulo.trim() !== "" && resumo.trim() !== "";

  const limpar = () => {
    setClienteId("");
    setTipo("REUNIAO");
    setTitulo("");
    setResumo("");
    setPendencia("");
    setProximaAcao("");
  };

  const fechar = () => {
    // Limpa ao fechar, sempre. Reabrir e encontrar os campos do último
    // lançamento é como duplicar um acompanhamento sem perceber.
    limpar();
    aoFechar();
  };

  const salvar = () => {
    if (!clienteId || !consultoria) return;

    aoRegistrar({
      // O id é local e temporário — de propósito não imita o formato dos
      // ids dos dados de demonstração, para que ninguém confunda os dois.
      id: `local_${Date.now()}`,
      clienteId,
      consultoriaId: consultoria.id,
      tipo,
      data: new Date(),
      modalidade: cliente?.modalidade ?? "PRESENCIAL",
      titulo: titulo.trim(),
      resumo: resumo.trim(),
      pendencias: pendencia
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0),
      proximaAcao: proximaAcao.trim(),
      registradoEm: new Date(),
    });
    limpar();
  };

  return (
    <Gaveta
      aberta={aberta}
      aoFechar={fechar}
      titulo="Novo acompanhamento"
      descricao="O registro do encontro, do que ficou pendente e do próximo passo."
      acoes={
        <div className="flex items-center gap-2">
          <Botao variante="fantasma" tamanho="sm" onClick={fechar}>
            Cancelar
          </Botao>
          <Botao variante="primario" tamanho="sm" onClick={salvar} disabled={!podeSalvar}>
            Registrar
          </Botao>
        </div>
      }
    >
      <div className="space-y-5">
        <Aviso tom="atencao" titulo="Este registro não é gravado">
          <p>
            Ele aparece na lista desta tela e some ao recarregar a página. O
            sistema ainda não está ligado a um banco de dados — o formulário
            existe para mostrar o fluxo, e é honesto sobre o que faz.
          </p>
        </Aviso>

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelecao
            label="Cliente"
            name="cliente"
            obrigatorio
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
            opcoes={clientes.map((c) => ({ valor: c.id, texto: c.nomeFantasia }))}
            ajuda="A consultoria é vinculada automaticamente."
          />
          <CampoSelecao
            label="Tipo"
            name="tipo"
            obrigatorio
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoAcompanhamento)}
            opcoes={TIPOS.map((t) => ({ valor: t, texto: ROTULO_TIPO_ACOMPANHAMENTO[t] }))}
          />
        </div>

        {/* O vínculo, mostrado antes de salvar e não depois. */}
        <div className="rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[rgba(242,236,226,0.55)] px-4 py-3">
          <p className="text-[0.625rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
            Onde este registro vai entrar
          </p>
          {cliente ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-[0.875rem] text-tinta">{cliente.nomeFantasia}</span>
              {consultoria ? (
                <>
                  <span aria-hidden className="text-[var(--tinta-fraca)]">
                    ·
                  </span>
                  <span className="text-[0.875rem] text-[var(--tinta-suave)]">
                    {consultoria.titulo}
                  </span>
                  <Etiqueta tom="oliva">vinculado</Etiqueta>
                </>
              ) : (
                <Etiqueta tom="dourado">sem consultoria aberta</Etiqueta>
              )}
            </div>
          ) : (
            <p className="mt-2 text-[0.875rem] text-[var(--tinta-fraca)]">
              Escolha o cliente para ver a consultoria que vai receber o registro.
            </p>
          )}
          {cliente && !consultoria ? (
            <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
              Este cliente não tem consultoria em andamento. Na demonstração o
              registro pode ser salvo assim mesmo, mas no sistema real ele
              precisaria de uma consultoria — um acompanhamento não existe
              solto.
            </p>
          ) : null}
        </div>

        <Campo
          label="Título"
          name="titulo"
          obrigatorio
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Revisão das fichas de delivery"
          ajuda="Como você resumiria este encontro numa linha."
        />

        <div>
          <label
            htmlFor="acp-resumo"
            className="block text-[0.8125rem] font-medium text-tinta"
          >
            Resumo
            <span aria-hidden className="ml-1 text-critico">
              *
            </span>
          </label>
          <textarea
            id="acp-resumo"
            name="resumo"
            rows={4}
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            placeholder="O que foi discutido, o que você observou, o que mudou desde o último encontro."
            className="mt-1.5 w-full rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 py-2.5 text-[0.875rem] leading-relaxed text-tinta transition-colors duration-150 placeholder:text-[var(--tinta-fraca)] hover:border-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="acp-pendencias"
            className="block text-[0.8125rem] font-medium text-tinta"
          >
            O que ficou pendente
          </label>
          <textarea
            id="acp-pendencias"
            name="pendencias"
            rows={3}
            value={pendencia}
            onChange={(e) => setPendencia(e.target.value)}
            placeholder={"Uma por linha\nEnviar o histórico de produção\nPesar a sobra por três dias"}
            className="mt-1.5 w-full rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-white/70 px-3 py-2.5 text-[0.875rem] leading-relaxed text-tinta transition-colors duration-150 placeholder:text-[var(--tinta-fraca)] hover:border-[var(--tinta-fraca)] focus:border-oliva focus:bg-white focus:outline-none"
          />
          <p className="mt-1.5 text-[0.75rem] text-[var(--tinta-fraca)]">
            Uma pendência por linha. Elas aparecem separadas do resumo, para que
            a releitura antes da próxima reunião leve segundos.
          </p>
        </div>

        <Campo
          label="Próximo passo"
          name="proximaAcao"
          value={proximaAcao}
          onChange={(e) => setProximaAcao(e.target.value)}
          placeholder="Fechar o dimensionamento quando o histórico chegar"
        />

        <p className="text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
          A data do registro é a de hoje e não pode ser escolhida: acompanhamento
          se escreve depois do encontro, e um campo de data livre só serviria
          para lançar reunião antiga com data errada.
        </p>
      </div>
    </Gaveta>
  );
}
