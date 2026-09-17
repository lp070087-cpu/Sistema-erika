import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { conferirAmbiente } from "@/lib/env";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Aviso, Painel, Secao } from "@/components/ui/superficie";
import { Etiqueta } from "@/components/ui/indicador";
import { BotaoLink } from "@/components/ui/botao";
import {
  Tabela,
  CabecalhoTabela,
  LinhaCabecalho,
  CelulaCabecalho,
  CorpoTabela,
  LinhaTabela,
  Celula,
} from "@/components/ui/tabela";
import {
  MARCA_DESCRICAO,
  MARCA_NOME,
  SISTEMA_VERSAO,
  SITE_PUBLICO_ROTULO,
  estadoDoDiagnostico,
} from "@/lib/configuracao-publica";
import { LACUNA } from "@/lib/dados";
import { BotaoSair } from "./botao-sair";

export const metadata: Metadata = { title: "Configurações" };

/**
 * CONFIGURAÇÕES — quatro seções, na ordem em que a consultora pensa.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA TELA MUDOU DE "AMBIENTE" PARA "QUATRO SEÇÕES"            │
 * │                                                                      │
 * │ A versão anterior mostrava as variáveis de ambiente — AUTH_SECRET,    │
 * │ DATABASE_URL e mais três. É informação correta e necessária, mas é    │
 * │ informação de quem INSTALA o sistema, não de quem USA.                │
 * │                                                                      │
 * │ A Seção 29 pediu quatro blocos: NEGÓCIO, METODOLOGIA, DIVULGAÇÃO e     │
 * │ SISTEMA. Os três primeiros são da consultora; o quarto é técnico e    │
 * │ continua aqui, no fim, porque é onde alguém vai procurar.             │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A SEÇÃO METODOLOGIA É A MAIS IMPORTANTE DESTA PÁGINA, E NÃO TEM       │
 * │ UM ÚNICO CAMPO EDITÁVEL                                              │
 * │                                                                      │
 * │ Ela lista oito decisões que a Érika ainda não tomou — fator de        │
 * │ correção, índice de cocção, CMV alvo, markup, arredondamento, peso    │
 * │ por resposta. Cada uma aparece como "Configuração pendente".          │
 * │                                                                      │
 * │ Não existe campo para preencher. Não existe valor padrão. Não existe  │
 * │ "sugestão do sistema". Se houvesse, alguém digitaria um número para   │
 * │ fazer a tela parar de reclamar — e a partir daí todo custo, todo CMV  │
 * │ e todo preço do sistema estaria apoiado num número que ninguém        │
 * │ decidiu. É o §29 dito de outra forma: não permitir configurar valor   │
 * │ falso.                                                               │
 * │                                                                      │
 * │ A tela mostra a lista como uma PAUTA DE REUNIÃO, não como um          │
 * │ formulário. É para ela levar para o cliente ou para a própria         │
 * │ planilha — e decidir com calma.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export default async function PaginaConfiguracoes() {
  const sessao = await auth();
  const ambiente = conferirAmbiente();
  const diagnostico = estadoDoDiagnostico();

  const variaveis: Array<[string, boolean, string]> = [
    ["AUTH_SECRET", Boolean(process.env.AUTH_SECRET), "Assina a sessão de acesso"],
    ["AUTH_EMAIL", Boolean(process.env.AUTH_EMAIL), "E-mail de entrada"],
    ["AUTH_PASSWORD_HASH", Boolean(process.env.AUTH_PASSWORD_HASH), "Hash da senha"],
    ["DATABASE_URL", Boolean(process.env.DATABASE_URL), "Conexão com o banco (Neon)"],
    ["DIRECT_URL", Boolean(process.env.DIRECT_URL), "Conexão direta, usada pelas migrations"],
  ];

  /**
   * As decisões que faltam para o motor de cálculo existir.
   *
   * Cada linha aponta o ponto do relatório da Fase 0 que ficou sem resposta.
   * O número não é decorativo: é o que permite voltar ao documento original
   * e ver exatamente o que foi perguntado, em vez de discutir de memória.
   */
  const METODOLOGIA: readonly { decisao: string; ponto: string; trava: string }[] = [
    {
      decisao: "Índice de cocção",
      ponto: "4",
      trava: "Sem ele não há como tratar a perda de peso entre o cru e o servido.",
    },
    {
      decisao: "Fator de correção",
      ponto: "5 e 6",
      trava: "Define se o fator é aplicado por insumo ou por prato — e se existe fator duplicado.",
    },
    {
      decisao: "Origem e atualização do preço",
      ponto: "10",
      trava: "Quem informa o preço, com que frequência, e o que acontece com a ficha quando ele muda.",
    },
    {
      decisao: "Peso de cada resposta do diagnóstico",
      ponto: "11",
      trava: "Enquanto não existir, nenhuma resposta vale mais que outra para a leitura.",
    },
    {
      decisao: "Faixas de faturamento",
      ponto: "12",
      trava: "Hoje as faixas são as do formulário. Falta confirmar se são essas.",
    },
    {
      decisao: "Fluxo do diagnóstico até a fila",
      ponto: "15",
      trava: "Se o lead entra direto ou passa por triagem antes de virar trabalho.",
    },
    {
      decisao: "Arredondamento",
      ponto: "19",
      trava: "Em que casa decimal o custo e o preço param. Um centavo de diferença por porção vira muito no mês.",
    },
    {
      decisao: "CMV alvo e markup",
      ponto: "7",
      trava: "O sistema não tem onde guardar isso ainda — de propósito.",
    },
  ];

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Sistema"
        titulo="Configurações"
        descricao="O negócio, a metodologia que ainda falta decidir, o link que você divulga e o estado técnico do sistema."
        acoes={
          <Etiqueta tom={ambiente.pronto ? "verde" : "dourado"}>
            {ambiente.pronto ? "Ambiente pronto" : "Ambiente incompleto"}
          </Etiqueta>
        }
      />

      {/* ── Negócio ────────────────────────────────────────────────────── */}
      <Secao
        rotulo="Negócio"
        titulo="A marca e quem usa o sistema"
        descricao="É o que aparece na assinatura dos documentos e no cabeçalho do sistema."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
            <span className="assina block text-[1.75rem] leading-none text-oliva">
              {MARCA_NOME}
            </span>
            <p className="mt-2 text-[0.75rem] font-medium tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
              {MARCA_DESCRICAO}
            </p>
            <p className="mt-4 max-w-[46ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Este nome e esta assinatura são os que saem impressos nos
              relatórios entregues ao cliente. A troca de marca não é feita
              aqui ainda — o sistema tem uma marca só, e ela está no código.
            </p>
          </div>

          <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
            <dl className="space-y-3.5">
              <div>
                <dt className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
                  Quem está usando
                </dt>
                <dd className="mt-1 text-[0.9375rem] text-tinta">
                  {sessao?.user?.name ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
                  E-mail de acesso
                </dt>
                <dd className="mt-1 text-[0.9375rem] text-tinta [overflow-wrap:anywhere]">
                  {sessao?.user?.email ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
                  Papel
                </dt>
                <dd className="mt-1 text-[0.9375rem] text-tinta">
                  ADMIN · acesso total
                </dd>
              </div>
            </dl>
            <div className="mt-5 border-t border-[var(--linha)] pt-4">
              <BotaoSair />
            </div>
          </div>
        </div>
      </Secao>

      {/* ── Metodologia ────────────────────────────────────────────────── */}
      <Secao
        rotulo="Metodologia"
        titulo="O que ainda falta decidir"
        descricao="Estas são as decisões que definem como o sistema calcula. Enquanto elas não existirem, nenhum custo, CMV ou preço sugerido aparece nas telas — em vez de aparecer errado."
      >
        <Aviso tom="atencao" titulo="Configuração pendente — nada é editável aqui">
          <p>
            Não há campo para preencher nesta seção, e isso é deliberado. Um
            campo aberto seria preenchido por estimativa, e a partir daí todo
            número do sistema estaria apoiado numa estimativa que ninguém
            decidiu. Quando essas decisões forem tomadas, elas entram aqui
            como valores fixos — não como sugestão do sistema.
          </p>
          <p className="mt-2.5">
            A contagem de perguntas do diagnóstico também está em aberto: {LACUNA.descricao}
          </p>
        </Aviso>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {METODOLOGIA.map((m) => (
            <div
              key={m.decisao}
              className="rounded-[var(--raio)] border border-[var(--linha)] border-l-2 border-l-dourado bg-[rgba(201,165,78,0.05)] px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="text-[0.9375rem] font-medium text-tinta">{m.decisao}</p>
                <Etiqueta tom="dourado">Configuração pendente</Etiqueta>
              </div>
              <p className="mt-2 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                {m.trava}
              </p>
              <p className="mt-2 text-[0.75rem] text-[var(--tinta-fraca)]">
                Ponto <span className="tabular">{m.ponto}</span> do relatório da Fase 0
              </p>
            </div>
          ))}
        </div>

        <Painel className="mt-5">
          <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            <span className="font-medium text-tinta">
              Onde isso trava o sistema hoje:
            </span>{" "}
            as telas de Fichas técnicas, Ingredientes e Relatórios mostram
            quantidade, rendimento e preço — fatos declarados — mas nenhuma
            delas calcula custo por porção, CMV ou preço de venda. Não é uma
            limitação técnica; é uma decisão de não inventar.
          </p>
        </Painel>
      </Secao>

      {/* ── Divulgação ─────────────────────────────────────────────────── */}
      <Secao
        rotulo="Divulgação"
        titulo="O link que você divulga"
        descricao="O endereço do site e o estado do formulário de diagnóstico."
        acoes={
          <BotaoLink href="/meu-site" variante="linha" tamanho="sm">
            Ver Meu site
          </BotaoLink>
        }
      >
        <dl className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          <div>
            <dt className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
              Site público
            </dt>
            <dd className="mt-1.5 text-[0.9375rem] text-tinta tabular">
              {SITE_PUBLICO_ROTULO}
            </dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
              Formulário de diagnóstico
            </dt>
            <dd className="mt-1.5 text-[0.9375rem] text-tinta">
              {diagnostico.disponivel ? (
                <Etiqueta tom="verde">Publicado</Etiqueta>
              ) : (
                <Etiqueta tom="dourado">Configuração pendente</Etiqueta>
              )}
            </dd>
            {!diagnostico.disponivel ? (
              <dd className="mt-1.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-fraca)]">
                {diagnostico.motivo}
              </dd>
            ) : null}
          </div>
        </dl>

        <p className="mt-5 max-w-[70ch] text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
          O endereço do site e o do formulário são publicados separadamente.
          Enquanto o sistema não estiver publicado, o formulário abre pelo
          próprio sistema, em modo de demonstração — e o que a pessoa
          responde não é gravado.
        </p>
      </Secao>

      {/* ── Sistema ────────────────────────────────────────────────────── */}
      <Secao
        rotulo="Sistema"
        titulo="Estado técnico"
        descricao="Informação de quem instala, não de quem usa. Está no fim porque é onde alguém vai procurar quando precisar."
      >
        <Tabela>
          <CabecalhoTabela>
            <LinhaCabecalho>
              <CelulaCabecalho>Variável</CelulaCabecalho>
              <CelulaCabecalho>Finalidade</CelulaCabecalho>
              <CelulaCabecalho align="dir">Situação</CelulaCabecalho>
            </LinhaCabecalho>
          </CabecalhoTabela>
          <CorpoTabela>
            {variaveis.map(([nome, presente, finalidade]) => (
              <LinhaTabela key={nome}>
                <Celula destaque>
                  <code className="text-[0.8125rem]">{nome}</code>
                </Celula>
                <Celula>{finalidade}</Celula>
                <Celula align="dir">
                  <Etiqueta tom={presente ? "verde" : "neutro"}>
                    {presente ? "Definida" : "Ausente"}
                  </Etiqueta>
                </Celula>
              </LinhaTabela>
            ))}
          </CorpoTabela>
        </Tabela>

        <dl className="mt-5 grid gap-x-10 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
              Versão do sistema
            </dt>
            <dd className="mt-1 text-[0.9375rem] text-tinta tabular">{SISTEMA_VERSAO}</dd>
          </div>
          <div>
            <dt className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
              Dados
            </dt>
            <dd className="mt-1 text-[0.9375rem] text-tinta">
              Demonstração — nenhum dado real
            </dd>
          </div>
        </dl>

        {!ambiente.pronto ? (
          <Aviso tom="atencao" titulo="Como completar o ambiente" className="mt-5">
            <p>
              Copie <code className="text-[0.8125rem]">.env.example</code> para{" "}
              <code className="text-[0.8125rem]">.env</code>, gere o segredo com{" "}
              <code className="text-[0.8125rem]">openssl rand -base64 32</code> e o hash da
              senha com{" "}
              <code className="text-[0.8125rem]">
                npm run senha:hash -- &quot;sua-senha&quot;
              </code>
              .
            </p>
          </Aviso>
        ) : null}

        <Aviso tom="info" titulo="Banco de dados ainda não conectado" className="mt-4">
          <p>
            O Neon não foi configurado — por decisão explícita desta fase. O schema existe
            em <code className="text-[0.8125rem]">prisma/schema.prisma</code> com as tabelas
            mínimas de acesso, mas nenhuma migration foi criada e nenhum dado é gravado ainda.
          </p>
          <p className="mt-2.5">
            É por isso que os formulários de cadastro funcionam, mas avisam que
            nada é salvo ao recarregar.
          </p>
        </Aviso>
      </Secao>
    </div>
  );
}
