import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina, Rotulo } from "@/components/ui/rotulo";
import { Etiqueta, Indicador } from "@/components/ui/indicador";
import { Aviso, EstadoVazio, Painel, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { FaixaDemonstracao } from "@/components/ui/faixa-demonstracao";
import { AbrirLink, CopiarLink, EnderecoPublico } from "@/components/ui/link-publico";
import {
  SITE_PUBLICO_URL,
  FUSO_HORARIO,
  MARCA_PRIMEIRO_NOME,
} from "@/lib/configuracao-publica";
import { ListaAtencao } from "@/components/ui/atencao";
import { LinhaDoTempo } from "@/components/ui/linha-do-tempo";
import {
  ROTULO_STATUS,
  ROTULO_STATUS_CONSULTORIA,
  ROTULO_TIPO_ACOMPANHAMENTO,
  TOM_STATUS,
  TOM_STATUS_CONSULTORIA,
  agruparTarefas,
  contarParcelas,
  dataCurta,
  desdeQuando,
  derivarAtencao,
  obterRepositorio,
  obterRepositorioOperacao,
  proximaParcela,
  saudacao,
  valorEmReais,
} from "@/lib/dados";
import { NAVEGACAO } from "@/lib/navegacao";

export const metadata: Metadata = { title: "Visão geral" };

/**
 * PAINEL DE ABERTURA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A ORDEM DESTA TELA É UMA DECISÃO, E NÃO UM LAYOUT                    │
 * │                                                                      │
 * │ 1. SAUDAÇÃO e a frase que diz o que a tela é.                         │
 * │ 2. RESUMO — seis números, todos contagem, todos conferíveis.          │
 * │ 3. PRECISA DA SUA ATENÇÃO — o que travou, com o caminho para destravar.│
 * │ 4. EM ANDAMENTO — o que está vivo.                                    │
 * │ 5. ATIVIDADE RECENTE — o que se moveu.                                │
 * │                                                                      │
 * │ O resumo vem ANTES da atenção porque ele é o mapa: seis números que   │
 * │ dizem onde olhar. A atenção vem em seguida porque é a única parte     │
 * │ acionável. Invertido, a tela abriria numa lista de problemas sem que  │
 * │ a pessoa soubesse de que tamanho é o dia.                             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE NÃO HÁ GRÁFICO FINANCEIRO NESTA TELA                          │
 * │                                                                      │
 * │ Um gráfico de faturamento mês a mês é a coisa mais fácil de desenhar  │
 * │ aqui — e a mais fácil de estar errada. Os valores dos contratos        │
 * │ existem, mas o que eles SOMAM não é medição de nada: são cinco         │
 * │ contratos de demonstração. Um gráfico bonito em cima disso seria lido │
 * │ como o desempenho da consultoria dela.                                │
 * │                                                                      │
 * │ O que aparece é o que se pode conferir: contagem de contrato por      │
 * │ estado, soma das parcelas de cada contrato, próxima parcela a vencer. │
 * │ Cada número desses se confere contra a lista de contratos. Um gráfico │
 * │ de evolução, não.                                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A SAUDAÇÃO USA O FUSO DELA E NÃO O DO SERVIDOR                │
 * │                                                                      │
 * │ O servidor roda em UTC. Às 21h de São Paulo ele já está no dia         │
 * │ seguinte, e a tela cumprimentaria com "Bom dia" quem está fechando a   │
 * │ cozinha. `FUSO_HORARIO` é o fuso da parede dela, declarado num lugar   │
 * │ só — e `saudacao()` recebe a data como argumento para que o HTML do    │
 * │ servidor e o do navegador digam a mesma palavra.                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export default async function PaginaVisaoGeral() {
  const entrada = obterRepositorio();
  const operacao = obterRepositorioOperacao();

  const [
    resumo,
    leads,
    acoes,
    fichas,
    processos,
    consultorias,
    clientes,
    tarefas,
    acompanhamentos,
    compromissos,
    linhasContrato,
  ] = await Promise.all([
    entrada.resumo(),
    entrada.listarLeads(),
    operacao.listarTodasAsAcoes(),
    operacao.listarFichas(),
    operacao.listarProcessos(),
    operacao.listarConsultorias(),
    operacao.listarClientes(),
    operacao.listarTarefas(),
    operacao.listarAcompanhamentos(),
    operacao.listarCompromissos(),
    operacao.listarLinhasContrato(),
  ]);

  const agora = new Date();

  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  const naoLidos = leads.filter(
    (l) => (l.status === "NOVO" || l.status === "EM_ANALISE") && l.diagnosticoId !== null
  );

  const atencao = derivarAtencao(
    {
      acoes,
      fichas,
      processos,
      consultorias,
      clientes,
      contratos: linhasContrato,
      diagnosticosNaoLidos: naoLidos.map((l) => ({
        leadId: l.id,
        leadNome: l.nomeFantasia,
        quando: l.criadoEm,
      })),
    },
    agora
  );

  const gavetas = agruparTarefas(tarefas, agora);
  const consultoriasAbertas = consultorias.filter((c) => c.status !== "CONCLUIDA");

  const contratosAguardandoAceite = linhasContrato.filter(
    (l) => l.contrato.status === "AGUARDANDO_ACEITE"
  );

  const proximaParcelaGeral = linhasContrato
    .map((l) => ({
      linha: l,
      parcela: proximaParcela(l.contrato),
    }))
    .filter(
      (x): x is { linha: (typeof linhasContrato)[number]; parcela: NonNullable<typeof x.parcela> } =>
        x.parcela !== null && x.parcela.venceEm !== null && x.parcela.venceEm.getTime() >= agora.getTime()
    )
    .sort((a, b) => (a.parcela.venceEm?.getTime() ?? 0) - (b.parcela.venceEm?.getTime() ?? 0))
    .slice(0, 4);

  const proximosCompromissos = compromissos
    .filter((c) => c.quando.getTime() >= agora.getTime())
    .sort((a, b) => a.quando.getTime() - b.quando.getTime())
    .slice(0, 5);

  const totalItens = NAVEGACAO.reduce((s, g) => s + g.itens.length, 0);
  const minhaSaudacao = saudacao(agora, FUSO_HORARIO);

  return (
    <div className="space-y-7">
      {/* ── SAUDAÇÃO ─────────────────────────────────────────────────── */}
      <CabecalhoPagina
        rotulo="Visão geral da operação"
        titulo={`${minhaSaudacao}, ${MARCA_PRIMEIRO_NOME}.`}
        descricao="Veja o que precisa da sua atenção hoje."
        acoes={<Etiqueta tom="oliva">Demonstração</Etiqueta>}
      />

      <FaixaDemonstracao oQue="Clientes, consultorias, contratos, tarefas, fichas e diagnósticos desta tela são de demonstração. Nenhuma empresa ou pessoa aqui existe, e nada foi gravado em banco." />

      {/* ── RESUMO ───────────────────────────────────────────────────── */}
      <Secao
        rotulo="Resumo"
        titulo="O tamanho do dia"
        descricao="Seis contagens, todas conferíveis contra as telas de origem. Nenhuma delas é nota, média ou projeção — são coisas que se podem contar."
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Indicador
            rotulo="Diagnósticos novos"
            valor={resumo.aguardandoLeitura}
            tom={resumo.aguardandoLeitura > 0 ? "atencao" : "neutro"}
            contexto="Chegaram e ainda não foram lidos"
          />
          <Indicador
            rotulo="Clientes ativos"
            valor={clientes.filter((c) => c.situacao === "ATIVO").length}
            contexto={`de ${clientes.length} cadastrados`}
          />
          <Indicador
            rotulo="Consultorias"
            valor={consultoriasAbertas.length}
            contexto="Em andamento ou em acompanhamento"
          />
          <Indicador
            rotulo="Tarefas pendentes"
            valor={gavetas.hoje.length + gavetas.atrasadas.length + gavetas.proximas.length}
            tom={gavetas.atrasadas.length > 0 ? "critico" : "neutro"}
            contexto={
              gavetas.atrasadas.length > 0
                ? `${gavetas.atrasadas.length} atrasadas`
                : "Nenhuma atrasada"
            }
          />
          <Indicador
            rotulo="Fichas"
            valor={fichas.filter((f) => f.situacao === "AGUARDANDO_DADOS").length}
            tom={fichas.some((f) => f.situacao === "AGUARDANDO_DADOS") ? "atencao" : "neutro"}
            contexto="Aguardando dados"
          />
          <Indicador
            rotulo="Contratos"
            valor={contratosAguardandoAceite.length}
            tom={contratosAguardandoAceite.length > 0 ? "atencao" : "neutro"}
            contexto="Aguardando aceite"
          />
        </div>
      </Secao>

      {/* ── PRECISA DA SUA ATENÇÃO ───────────────────────────────────── */}
      <Secao
        rotulo="Precisa da sua atenção"
        titulo={
          atencao.length === 0
            ? "Nada travado neste momento"
            : `${atencao.length} ${atencao.length === 1 ? "item" : "itens"} travando o trabalho`
        }
        descricao="O que espera uma ação sua ou do cliente. A ordem é por tipo — o que já travou a consultoria vem antes do que é só uma chegada nova. Não é priorização automática: ordenar por gravidade exigiria o peso de cada situação, que ainda não foi definido."
        acoes={
          <BotaoLink href="/tarefas" variante="secundario" tamanho="sm">
            Ver todas as tarefas
          </BotaoLink>
        }
      >
        <ListaAtencao
          itens={atencao}
          maximo={7}
          vazio={
            <EstadoVazio
              titulo="Nada travado neste momento"
              descricao="Quando um contrato esperar aceite, uma parcela vencer, uma ficha ficar sem dado ou um cliente parar, o item aparece aqui com o caminho para resolver."
            />
          }
        />
      </Secao>

      {/* ── CONTRATOS ────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Secao
          rotulo="Contratos"
          titulo="Propostas e parcelas"
          descricao="O que está formalizado e o que está por receber. Os valores são os declarados em cada contrato — a soma é aritmética, não previsão."
          acoes={
            <BotaoLink href="/contratos" variante="secundario" tamanho="sm">
              Ver contratos
            </BotaoLink>
          }
        >
          {linhasContrato.length === 0 ? (
            <EstadoVazio
              titulo="Nenhum contrato registrado"
              descricao="Uma proposta formalizada aparece aqui com o estado, o valor e o que já foi pago."
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Indicador
                  rotulo="Aguardando aceite"
                  valor={contratosAguardandoAceite.length}
                  tom={contratosAguardandoAceite.length > 0 ? "atencao" : "neutro"}
                />
                <Indicador
                  rotulo="Em andamento"
                  valor={linhasContrato.filter((l) => l.contrato.status === "EM_ANDAMENTO").length}
                />
              </div>

              <ul className="mt-5 space-y-2.5">
                {linhasContrato.slice(0, 4).map((l) => {
                  const parcelas = contarParcelas(l.contrato);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/contratos/${l.id}`}
                        className="block rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[var(--superficie)] px-3.5 py-3 transition-colors duration-150 hover:border-[var(--linha-forte)] hover:bg-white"
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <span className="min-w-0 truncate text-[0.875rem] font-medium text-tinta">
                            {l.cliente.nomeFantasia}
                          </span>
                          <span className="tabular shrink-0 text-[0.875rem] text-tinta">
                            {valorEmReais(l.valorTotal, { centavos: false })}
                          </span>
                        </div>
                        <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[0.75rem] text-[var(--tinta-fraca)]">
                          <span className="truncate">{l.contrato.titulo}</span>
                          {parcelas.ATRASADO > 0 ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="font-semibold text-red-800">
                                {parcelas.ATRASADO}{" "}
                                {parcelas.ATRASADO === 1 ? "parcela atrasada" : "parcelas atrasadas"}
                              </span>
                            </>
                          ) : null}
                        </p>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </Secao>

        <Secao
          rotulo="A receber"
          titulo="Os próximos vencimentos"
          descricao="As parcelas com data marcada à frente, na ordem em que vencem. Só entram parcelas que ainda não foram pagas — paga não é previsão, é fato."
          acoes={
            <BotaoLink href="/contratos" variante="secundario" tamanho="sm">
              Ver todos
            </BotaoLink>
          }
        >
          {proximaParcelaGeral.length === 0 ? (
            <EstadoVazio
              titulo="Nenhuma parcela à frente"
              descricao="Quando um contrato tiver parcela com data de vencimento futura, ela aparece aqui na ordem."
            />
          ) : (
            <ul className="space-y-2.5">
              {proximaParcelaGeral.map(({ linha, parcela }) => (
                <li
                  key={parcela.id}
                  className="flex items-baseline justify-between gap-4 border-l-2 border-l-[var(--linha-forte)] pl-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.875rem] text-tinta">{linha.cliente.nomeFantasia}</p>
                    <p className="mt-0.5 text-[0.75rem] text-[var(--tinta-fraca)]">
                      {parcela.descricao}
                    </p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="tabular block text-[0.8125rem] text-tinta">
                      {valorEmReais(parcela.valor)}
                    </span>
                    <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                      {parcela.venceEm ? dataCurta(parcela.venceEm) : "sem data"}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>

      {/* ── TAREFAS E PRÓXIMOS ACOMPANHAMENTOS ───────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Secao
          rotulo="Tarefas"
          titulo="O que vence hoje"
          descricao="As tarefas com prazo de hoje e as que passaram. Contagem direta do que está cadastrado."
          acoes={
            <BotaoLink href="/tarefas" variante="secundario" tamanho="sm">
              Abrir
            </BotaoLink>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Contagem rotulo="Para hoje" valor={gavetas.hoje.length} tom="dourado" />
            <Contagem
              rotulo="Atrasadas"
              valor={gavetas.atrasadas.length}
              tom={gavetas.atrasadas.length > 0 ? "critico" : undefined}
            />
          </div>

          {gavetas.hoje.length === 0 && gavetas.atrasadas.length === 0 ? (
            <p className="mt-4 text-[0.875rem] text-[var(--tinta-suave)]">
              Nenhuma tarefa com prazo para hoje. As {gavetas.proximas.length} próximas estão no
              centro de tarefas.
            </p>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {[...gavetas.atrasadas, ...gavetas.hoje].slice(0, 4).map((t) => {
                const dono = t.clienteId ? clientePorId.get(t.clienteId) : null;
                return (
                  <li key={t.id} className="border-l-2 border-l-[var(--linha-forte)] pl-3">
                    <p className="text-[0.875rem] leading-snug text-tinta">{t.titulo}</p>
                    <p className="mt-0.5 text-[0.75rem] text-[var(--tinta-fraca)]">
                      {dono ? dono.nomeFantasia : "sem cliente"} ·{" "}
                      {t.prazo ? dataCurta(t.prazo) : "sem prazo"}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Secao>

        <Secao
          rotulo="Próximos acompanhamentos"
          titulo="Os encontros à frente"
          descricao="Agenda declarada da consultoria. O sistema não sincroniza com calendário externo — nem com Google Agenda."
          acoes={
            <BotaoLink href="/acompanhamentos" variante="secundario" tamanho="sm">
              Ver histórico
            </BotaoLink>
          }
        >
          {proximosCompromissos.length === 0 ? (
            <EstadoVazio
              titulo="Nenhum encontro agendado"
              descricao="Reunião, visita ou análise marcada aparece aqui. O acompanhamento registrado fica no histórico, em Acompanhamentos."
            />
          ) : (
            <ul className="space-y-2.5">
              {proximosCompromissos.map((c) => {
                const dono = clientePorId.get(c.clienteId);
                return (
                  <li key={c.id} className="flex items-baseline justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[0.875rem] leading-snug text-tinta">{c.titulo}</p>
                      <p className="mt-0.5 text-[0.75rem] text-[var(--tinta-fraca)]">
                        {dono ? dono.nomeFantasia : "cliente não identificado"} ·{" "}
                        {ROTULO_TIPO_ACOMPANHAMENTO[c.tipo]}
                      </p>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="block tabular text-[0.8125rem] text-tinta">
                        {dataCurta(c.quando)}
                      </span>
                      <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                        {desdeQuando(c.quando, agora).replace("há ", "em ")}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Secao>
      </div>

      {/* ── CONSULTORIAS EM ANDAMENTO ────────────────────────────────── */}
      <Secao
        rotulo="Em andamento"
        titulo={`${consultoriasAbertas.length} ${consultoriasAbertas.length === 1 ? "consultoria aberta" : "consultorias abertas"}`}
        descricao="Cada uma com a etapa atual e o próximo passo declarado. O status é escrito por ela — o sistema não deduz status a partir das etapas concluídas."
        acoes={
          <BotaoLink href="/consultorias" variante="secundario" tamanho="sm">
            Ver todas
          </BotaoLink>
        }
      >
        {consultoriasAbertas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma consultoria em aberto"
            descricao="Uma consultoria nasce da conversão de um lead em cliente. O acompanhamento dela aparece aqui, com a etapa e o próximo passo."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {consultoriasAbertas.map((c) => {
              const dono = clientePorId.get(c.clienteId);
              return (
                <Link
                  key={c.id}
                  href={`/consultorias/${c.id}`}
                  className="group rounded-[var(--raio)] border border-[var(--linha)] bg-white/55 px-4 py-3.5 transition-colors duration-150 hover:border-[var(--linha-forte)] hover:bg-white"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <span className="min-w-0 text-[0.9375rem] font-medium text-tinta">
                      {dono ? dono.nomeFantasia : "cliente não identificado"}
                    </span>
                    <Etiqueta tom={TOM_STATUS_CONSULTORIA[c.status]}>
                      {ROTULO_STATUS_CONSULTORIA[c.status]}
                    </Etiqueta>
                  </div>
                  <p className="mt-1.5 text-[0.8125rem] leading-snug text-[var(--tinta-suave)]">
                    {c.titulo}
                  </p>
                  {c.proximaAcao ? (
                    <p className="mt-2.5 border-t border-[var(--linha)] pt-2.5 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                      Próximo: {c.proximaAcao}
                    </p>
                  ) : null}
                </Link>
              );
            })}
          </div>
        )}
      </Secao>

      {/* ── ATIVIDADE RECENTE ────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <Secao
          rotulo="Atividade recente"
          titulo="O que se moveu"
          descricao="Acompanhamentos registrados, na ordem em que aconteceram. É o começo do histórico que hoje vive em caderno e mensagem solta."
        >
          {acompanhamentos.length === 0 ? (
            <EstadoVazio
              titulo="Nada registrado ainda"
              descricao="Cada reunião, visita ou análise vira um registro com data, resumo e próximo passo."
            />
          ) : (
            <LinhaDoTempo
              eventos={acompanhamentos.slice(0, 6).map((a) => {
                const dono = clientePorId.get(a.clienteId);
                return {
                  id: a.id,
                  quando: dataCurta(a.data),
                  titulo: a.titulo,
                  descricao: dono ? dono.nomeFantasia : "cliente não identificado",
                  tipo: ROTULO_TIPO_ACOMPANHAMENTO[a.tipo],
                };
              })}
            />
          )}
        </Secao>

        <div className="space-y-4">
          {/*
            MEU SITE — atalho, não painel.
            Três linhas e dois botões. A tela inteira vive em /meu-site; aqui
            fica só o que se precisa ter à mão quando alguém pede o endereço,
            que é o caso mais comum de abrir o sistema fora do trabalho.
          */}
          <Secao
            rotulo="Divulgação"
            titulo="Meu site"
            descricao="O endereço que você divulga."
            acoes={
              <BotaoLink href="/meu-site" variante="linha" tamanho="sm">
                Ver mais
              </BotaoLink>
            }
          >
            <EnderecoPublico url={SITE_PUBLICO_URL} className="text-[0.8125rem]" />
            <div className="mt-3 flex flex-wrap items-center gap-2.5">
              <CopiarLink
                texto={SITE_PUBLICO_URL}
                rotulo="Copiar link"
                variante="secundario"
                tamanho="sm"
              />
              <AbrirLink url={SITE_PUBLICO_URL} variante="linha" tamanho="sm">
                Abrir site
              </AbrirLink>
            </div>
          </Secao>

          <Secao rotulo="Atalhos" titulo="Ir direto para">
            <ul className="space-y-2">
              {[
                { href: "/clientes", texto: "Clientes", nota: `${clientes.length} cadastrados` },
                {
                  href: "/contratos",
                  texto: "Contratos",
                  nota: `${linhasContrato.length} registrados`,
                },
                {
                  href: "/planilhas",
                  texto: "Planilhas",
                  nota: "1 modelo disponível",
                },
                { href: "/tarefas", texto: "Tarefas", nota: `${gavetas.proximas.length} à frente` },
                { href: "/fichas", texto: "Fichas técnicas", nota: `${fichas.length} no acervo` },
                { href: "/processos", texto: "Processos", nota: `${processos.length} mapeados` },
              ].map((a) => (
                <li key={a.href}>
                  <Link
                    href={a.href}
                    className="flex items-center justify-between gap-3 rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[var(--superficie)] px-3.5 py-2.5 transition-colors duration-150 hover:border-[var(--linha-forte)] hover:bg-white"
                  >
                    <span className="text-[0.875rem] font-medium text-tinta">{a.texto}</span>
                    <span className="shrink-0 text-[0.75rem] text-[var(--tinta-fraca)]">
                      {a.nota}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Secao>

          <Secao rotulo="Entrada" titulo="O movimento da fila">
            <div className="grid grid-cols-2 gap-3">
              <Indicador rotulo="Leads na fila" valor={resumo.leadsTotal} />
              <Indicador
                rotulo="Sem leitura"
                valor={resumo.aguardandoLeitura}
                tom={resumo.aguardandoLeitura > 0 ? "atencao" : "neutro"}
              />
            </div>
            <ul className="mt-4 space-y-2.5">
              {leads.slice(0, 4).map((lead) => (
                <li key={lead.id} className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="min-w-0 truncate text-[0.875rem] text-tinta underline-offset-4 hover:underline"
                  >
                    {lead.nomeFantasia}
                  </Link>
                  <Etiqueta tom={TOM_STATUS[lead.status]}>{ROTULO_STATUS[lead.status]}</Etiqueta>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-[var(--linha)] pt-3">
              <BotaoLink href="/leads" variante="secundario" tamanho="sm">
                Ver a fila completa
              </BotaoLink>
            </div>
          </Secao>
        </div>
      </div>

      {/* ── O QUE AINDA NÃO ENTRA ────────────────────────────────────── */}
      <Aviso tom="atencao" titulo="O bloco de custo continua fora desta tela">
        <p>
          &ldquo;Variação de custo no período&rdquo; era o quinto bloco pedido para este painel, e é
          o único que ainda não pode existir. Ele depende dos pontos{" "}
          <strong className="font-semibold text-tinta tabular">4, 5, 6, 7 e 9</strong> — índice de
          cocção, fator de correção, CMV alvo e origem do volume.
        </p>
        <p className="mt-2.5">
          Um painel de abertura mostrando &ldquo;variação de custo: 0%&rdquo; teria a aparência de
          operação saudável. O zero não mediria a cozinha de ninguém — mediria que a metodologia não
          existe. É o mesmo defeito que a Fase 0 encontrou nas planilhas: ausência de dado virando
          número.
        </p>
      </Aviso>

      {/* ── MAPA DO SISTEMA ──────────────────────────────────────────── */}
      <Secao
        rotulo="Mapa do sistema"
        titulo={`Os ${totalItens} módulos e o estado de cada um`}
        descricao="O estado é declarado item a item, não deduzido do número da fase. Módulo em preparação abre e explica o que falta; módulo previsto tem rota e escopo."
      >
        <div className="space-y-5">
          {NAVEGACAO.map((grupo) => (
            <div key={grupo.chave}>
              <Rotulo className="mb-2.5">{grupo.titulo}</Rotulo>
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {grupo.itens.map((item) => {
                  const etiqueta =
                    item.estado === "no-ar"
                      ? { tom: "verde" as const, texto: "No ar" }
                      : item.estado === "parcial"
                        ? { tom: "dourado" as const, texto: "Em preparação" }
                        : { tom: "neutro" as const, texto: "Em breve" };
                  return (
                    <li key={item.chave}>
                      <Link
                        href={item.href}
                        className="group flex items-center justify-between gap-3 rounded-[var(--raio-sm)] border border-[var(--linha)] bg-[var(--superficie)] px-3.5 py-2.5 transition-colors duration-150 hover:border-[var(--linha-forte)] hover:bg-white"
                      >
                        <span className="min-w-0 truncate text-[0.875rem] font-medium text-tinta">
                          {item.titulo}
                        </span>
                        <Etiqueta tom={etiqueta.tom}>{etiqueta.texto}</Etiqueta>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </Secao>

      <Painel escuro className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Rotulo claro>Como ler esta fase</Rotulo>
          <p className="mt-2 font-display text-[1.25rem] text-off">
            A operação inteira aparece. O cálculo ainda não.
          </p>
          <p className="mt-1.5 max-w-[62ch] text-[0.875rem] text-creme/65">
            {totalItens} módulos. Cliente, consultoria, contrato, tarefa, ficha, processo,
            acompanhamento e planilha já funcionam de ponta a ponta — o que falta é a metodologia de
            custo, e ela depende de decisão dela.
          </p>
        </div>
        <span className="assina text-[1.5rem] text-oliva-palha">Organização gera lucro</span>
      </Painel>
    </div>
  );
}

function Contagem({
  rotulo,
  valor,
  tom,
}: {
  rotulo: string;
  valor: number;
  tom?: "dourado" | "critico";
}) {
  const cor =
    valor === 0
      ? "text-[var(--tinta-fraca)]"
      : tom === "critico"
        ? "text-red-800"
        : tom === "dourado"
          ? "text-[#8a6d1f]"
          : "text-tinta";

  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-4 py-3.5">
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {rotulo}
      </p>
      <p className={`mt-1.5 tabular text-[1.5rem] leading-none ${cor}`}>{valor}</p>
    </div>
  );
}
