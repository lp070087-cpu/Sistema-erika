import type { Metadata } from "next";
import Link from "next/link";
import { CabecalhoPagina } from "@/components/ui/rotulo";
import { Etiqueta } from "@/components/ui/indicador";
import { Aviso, Painel, Secao } from "@/components/ui/superficie";
import { BotaoLink } from "@/components/ui/botao";
import { DecisoesQueFaltam } from "@/components/ui/metodologia";
import {
  ROTULO_SITUACAO_DOCUMENTO,
  ROTULO_TIPO_DOCUMENTO,
  TOM_SITUACAO_DOCUMENTO,
  dataCurta,
  obterRepositorioOperacao,
} from "@/lib/dados";

export const metadata: Metadata = { title: "Relatórios" };

/**
 * RELATÓRIOS — a prévia honesta.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ ESTA É A TELA MAIS PERIGOSA DO SISTEMA                              │
 * │                                                                      │
 * │ Um relatório de consultoria é, por natureza, uma tela de NÚMEROS.     │
 * │ É onde a Érika mostra resultado, onde ela prova o efeito do trabalho  │
 * │ e o que ela publica.                                                 │
 * │                                                                      │
 * │ Ou seja: é exatamente o lugar onde inventar um número faria o maior   │
 * │ estrago. Um gráfico de "economia gerada" bonito e falso seria levado  │
 * │ para uma reunião com cliente — e o sistema teria participado de uma   │
 * │ conversa comercial com dado fabricado.                                │
 * │                                                                      │
 * │ A §20 é clara: não mostrar economia, lucro, CMV nem percentual        │
 * │ inventado. Onde o número não existe, a tela escreve "dado ainda não   │
 * │ registrado" — e isso é o CONTEÚDO da tela, não um vazio no meio dela. │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE MOSTRAR OS DOCUMENTOS QUE JÁ EXISTEM                         │
 * │                                                                      │
 * │ Toda tela de resultado tem algo para mostrar, e aqui não é diferente: │
 * │ os documentos já produzidos e entregues a cada cliente são reais —    │
 * │ eles existem no modelo, com data, tipo e situação.                    │
 * │                                                                      │
 * │ Então a prévia mostra os dois lados: o que a consultoria JÁ produz    │
 * │ (documentos, entregas, acompanhamentos registrados) e o que          │
 * │ Depende de metodologia (variação de custo, CMV, economia). O          │
 * │ contraste é mais convincente do que uma tela só de números.           │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/**
 * As linhas de resultado que o relatório final vai ter.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `depende` NOMEIA A DECISÃO, E NÃO O NÚMERO DELA              │
 * │                                                                      │
 * │ Antes cada linha dizia "Ponto 4 (índice de cocção) e 5 (fator de      │
 * │ correção por contexto)". O parêntese salvava o número, e mesmo assim   │
 * │ era um número de controle interno vazando para a tela de quem usa o    │
 * │ sistema.                                                              │
 * │                                                                      │
 * │ Agora a linha diz a decisão em palavras, do mesmo jeito que           │
 * │ `@/components/ui/metodologia` diz. São dois lugares falando do mesmo   │
 * │ bloqueio, e falar a mesma língua é o que permite que a resposta da     │
 * │ consultora seja reconhecida nos dois.                                  │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const LINHAS_DE_RESULTADO = [
  {
    titulo: "Custo por prato e custo por porção",
    depende: "Quanto o alimento rende depois de cozido, e quanto se perde entre a compra e o uso",
    porque:
      "Os dois mudam o número final. Sem eles, o custo sairia com uma margem de erro que ninguém consegue medir.",
  },
  {
    titulo: "Variação de custo no período do acompanhamento",
    depende: "As mesmas duas decisões acima, mais quantas casas decimais cada número guarda",
    porque:
      "Comparar dois momentos exige que os dois tenham sido calculados do mesmo jeito. Quantas casas sobrevivem à comparação é uma decisão, e ela muda o resultado da conta.",
  },
  {
    titulo: "CMV e margem por prato",
    depende: "Como o preço de venda é formado, e de onde vem o volume vendido de cada prato",
    porque:
      "CMV precisa de um alvo para virar julgamento, e o alvo é decisão sua. E o volume vendido precisa de uma origem — o sistema não presume que o prato mais caro vende menos.",
  },
  {
    titulo: "Cardápio com preço sugerido",
    depende: "As decisões de custo e de formação de preço, mais o peso de cada etapa do método",
    porque:
      "Preço sugerido é o número mais consequente do sistema. É o que vai para o cliente, e é o último a poder sair.",
  },
] as const;

export default async function PaginaRelatorios() {
  const operacao = obterRepositorioOperacao();

  const [documentos, clientes, consultorias] = await Promise.all([
    operacao.listarDocumentos(),
    operacao.listarClientes(),
    operacao.listarConsultorias(),
  ]);

  const entregues = documentos.filter((d) => d.situacao === "ENTREGUE").length;
  const prontos = documentos.filter((d) => d.situacao === "PRONTO").length;

  // Agrupados por cliente, do que tem mais entrega para o que tem menos —
  // é a ordem em que a consultora olharia a tela.
  const porCliente = clientes
    .map((c) => ({
      cliente: c,
      documentos: documentos.filter((d) => d.clienteId === c.id),
    }))
    .filter((g) => g.documentos.length > 0)
    .sort((a, b) => b.documentos.length - a.documentos.length);

  const consultoriasAtivas = consultorias.filter((c) => c.status !== "CONCLUIDA");

  return (
    <div className="space-y-6">
      <CabecalhoPagina
        rotulo="Resultado"
        titulo="Relatórios"
        descricao="O que sai do sistema e vai para o cliente. Esta é uma prévia: mostra o que a consultoria já entrega hoje e marca exatamente o que ainda depende de decisão de metodologia."
        acoes={<Etiqueta tom="oliva">Prévia</Etiqueta>}
      />

      {/* ── O QUE JÁ EXISTE ────────────────────────────────────────────── */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Contagem rotulo="Documentos" valor={documentos.length} />
        <Contagem rotulo="Entregues" valor={entregues} tom="verde" />
        <Contagem rotulo="Prontos, não entregues" valor={prontos} tom="dourado" />
        <Contagem rotulo="Consultorias em aberto" valor={consultoriasAtivas.length} />
      </div>

      <Secao
        rotulo={`${porCliente.length} ${porCliente.length === 1 ? "cliente" : "clientes"}`}
        titulo="Material produzido por cliente"
        descricao="O que já foi escrito para cada cliente, com o tipo e a data. Cada documento nasce de um módulo do sistema — leitura do diagnóstico, plano de ação, ficha, processo."
      >
        {porCliente.length === 0 ? (
          <p className="text-[0.875rem] text-[var(--tinta-suave)]">
            Nenhum documento produzido ainda.
          </p>
        ) : (
          <div className="space-y-5">
            {porCliente.map(({ cliente, documentos: docs }) => (
              <div
                key={cliente.id}
                className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="text-[1rem] text-tinta hover:text-oliva"
                  >
                    {cliente.nomeFantasia}
                  </Link>
                  <span className="tabular text-[0.8125rem] text-[var(--tinta-fraca)]">
                    {docs.length} {docs.length === 1 ? "documento" : "documentos"}
                  </span>
                </div>

                <ul className="mt-3 divide-y divide-[var(--linha)]">
                  {docs
                    .slice()
                    .sort((a, b) => b.criadoEm.getTime() - a.criadoEm.getTime())
                    .map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 py-2.5 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <span className="text-[0.875rem] leading-snug text-tinta">
                            {d.nome}
                          </span>
                          <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                            {ROTULO_TIPO_DOCUMENTO[d.tipo]} · {dataCurta(d.criadoEm)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <Etiqueta tom={TOM_SITUACAO_DOCUMENTO[d.situacao]}>
                            {ROTULO_SITUACAO_DOCUMENTO[d.situacao]}
                          </Etiqueta>
                          {/*
                            O BOTÃO QUE SUBSTITUI O DOWNLOAD.
                            Não baixa arquivo — o arquivo não existe. Ele abre a
                            FOLHA do relatório, que é uma peça real, montada a
                            partir do dado que existe, e que pode ser impressa.
                            É o que a consultora realmente faz com um relatório:
                            abre, lê e entrega.
                          */}
                          <BotaoLink
                            href={`/imprimir/relatorio/${cliente.id}`}
                            variante="linha"
                            tamanho="sm"
                          >
                            Visualizar relatório
                          </BotaoLink>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Secao>

      <Secao
        rotulo="Entrega"
        titulo="Visualizar relatório"
        descricao="A folha que vai para a mão do cliente — cabeçalho da marca, período, e o que foi feito. É a mesma peça que se imprime ou se salva em PDF pelo navegador."
      >
        <p className="max-w-[80ch] text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
          Escolha um cliente para abrir a prévia do relatório dele. A folha é
          montada com o dado que existe de verdade no sistema: as ações do plano,
          as fichas, os processos, os acompanhamentos e o histórico. Onde o
          número dependeria de metodologia, ela escreve o nome do dado e a
          decisão que falta — nunca um valor estimado.
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {porCliente.length === 0 ? (
            <p className="text-[0.875rem] text-[var(--tinta-fraca)]">
              Nenhum cliente com material produzido ainda.
            </p>
          ) : (
            porCliente.map(({ cliente }) => (
              <BotaoLink
                key={cliente.id}
                href={`/imprimir/relatorio/${cliente.id}`}
                variante="secundario"
                tamanho="sm"
              >
                {cliente.nomeFantasia}
              </BotaoLink>
            ))
          )}
        </div>
      </Secao>

      <Aviso tom="info" titulo="Por que não existe botão de download de arquivo">
        <p>
          A lista mostra o registro, a data e a situação — tudo o que existe de
          fato. O arquivo em si não existe ainda: o sistema não tem
          armazenamento de arquivo neste momento, e criar um improvisado só
          para esta versão seria pior do que não ter, porque a Érika sairia
          daqui achando que documento é anexável.
        </p>
        <p className="mt-2.5">
          O relatório acima é diferente: ele não é um arquivo guardado, é uma
          folha montada na hora a partir do dado. Por isso ela abre, imprime e
          salva em PDF normalmente — sem depender de armazenamento nenhum.
        </p>
      </Aviso>

      {/* ── O QUE AINDA NÃO EXISTE ────────────────────────────────────── */}
      <Secao
        rotulo="Bloco de resultado"
        titulo="As linhas do relatório final"
        descricao="O que o relatório de resultado vai mostrar quando a metodologia estiver definida. Cada linha diz de qual decisão ela depende — e nenhuma delas aparece com número agora."
      >
        <ul className="divide-y divide-[var(--linha)]">
          {LINHAS_DE_RESULTADO.map((linha) => (
            <li key={linha.titulo} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-2">
                <span className="text-[0.9375rem] font-medium text-tinta">{linha.titulo}</span>
                <span className="shrink-0 rounded-[var(--raio-sm)] border border-[var(--linha-forte)] bg-[rgba(242,236,226,0.7)] px-2.5 py-1 text-[0.75rem] text-[var(--tinta-suave)]">
                  Dado ainda não registrado
                </span>
              </div>
              <p className="mt-1.5 max-w-[80ch] text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                {linha.porque}
              </p>
              <p className="mt-1 text-[0.75rem] text-[var(--tinta-fraca)]">
                Depende de: {linha.depende}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-5">
          <DecisoesQueFaltam
            apenas={[
              "coccao",
              "compra-para-uso",
              "custo-do-prato",
              "formacao-de-preco",
              "origem-do-preco",
              "arredondamento",
              "peso-das-etapas",
            ]}
            titulo="Por que nenhuma linha tem valor"
            descricao="Nenhum valor aparece nas linhas acima — nem zero, nem traço, nem estimativa. O que aparece é o nome do dado e a decisão que falta para que ele exista. Um relatório de resultado com número inventado seria levado para uma reunião com cliente, e aí o sistema teria participado de uma conversa comercial com dado fabricado. Não vale o risco pela aparência."
          />
        </div>
      </Secao>

      <Secao
        rotulo="Formatos"
        titulo="Como o material deve sair"
        descricao="O escopo previsto para quando o bloco de resultado existir. Escrito aqui para não se perder."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Para a consultora
            </p>
            <p className="mt-2.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Com valores: custo por porção, preço sugerido, CMV, variação no
              período. É o material de trabalho dela, que sustenta a conversa
              com o cliente e a decisão de reprecificar.
            </p>
          </Painel>
          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Para a cozinha
            </p>
            <p className="mt-2.5 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              Sem valores: o que o prato leva, quanto rende e como se monta. A
              equipe precisa do padrão, não do custo — e mostrar preço no passe
              é uma decisão do cliente, não do sistema.
            </p>
          </Painel>
        </div>
      </Secao>

      <div className="flex flex-wrap items-center gap-3">
        <BotaoLink href="/clientes" variante="secundario" tamanho="sm">
          Ver clientes
        </BotaoLink>
        <BotaoLink href="/acompanhamentos" variante="secundario" tamanho="sm">
          Ver acompanhamentos
        </BotaoLink>
        <BotaoLink href="/fichas" variante="secundario" tamanho="sm">
          Ver fichas
        </BotaoLink>
      </div>
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
  tom?: "dourado" | "verde";
}) {
  const cor =
    valor === 0
      ? "text-[var(--tinta-fraca)]"
      : tom === "dourado"
        ? "text-[#8a6d1f]"
        : tom === "verde"
          ? "text-medio"
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
