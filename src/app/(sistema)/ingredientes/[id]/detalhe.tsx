"use client";

import Link from "next/link";
import { Etiqueta, Indicador } from "@/components/ui/indicador";
import { Aviso, Painel, Secao } from "@/components/ui/superficie";
import { Dado, ListaDados } from "@/components/ui/dados";
import { FluxoRendimentoIngrediente } from "@/components/ui/fluxo-rendimento";
import { RegraAConfirmar } from "@/components/ui/metodologia";
import { useDemonstracao } from "@/components/ui/use-demonstracao";
import {
  CASAS_PERCENTUAL,
  CASAS_PESO,
  custoPorEtapa,
  dataCurta,
  derivarTransformacao,
  desdeQuando,
  precoUnitarioDaCompra,
  valorEmReais,
} from "@/lib/dados";
import type {
  Compra,
  Ficha,
  Ingrediente,
  ClienteOperacao as Cliente,
  ItemFicha,
  PrecoIngrediente,
  Transformacao,
} from "@/lib/dados";
import {
  estadoDePrecoDaBiblioteca,
  fichaDaSessao,
  fichaFoiExcluida,
  fichasDaSessao,
  ingredienteArquivado,
  ingredienteDaSessao,
  ingredientesDaSessao,
  insumoFoiExcluido,
} from "@/lib/dados/demonstracao";
import { EditorDePreco } from "../editor-preco";
import { CalculadoraRendimento } from "./calculadora-rendimento";
import { IdentidadeDoInsumo } from "./identidade-do-insumo";

/**
 * O INSUMO — o que ele custa, o que ele rende, e onde ele entra.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA TELA É DE CLIENTE                                       │
 * │                                                                      │
 * │ Ela era de servidor, e parecia certa: lê o repositório, monta o HTML. │
 * │ O defeito só aparece quando alguém USA — ao salvar um preço novo, a    │
 * │ gaveta fecha e a página continua mostrando o preço antigo. O store     │
 * │ mudou, e o servidor não tem como saber.                                │
 * │                                                                      │
 * │ Numa tela de preço, isso é o defeito mais caro que existe: a           │
 * │ consultora conclui que o botão não funciona e volta a digitar tudo à   │
 * │ mão — que é exatamente o trabalho que este módulo existe para          │
 * │ eliminar.                                                             │
 * │                                                                      │
 * │ Aqui o servidor entrega o CENÁRIO e este componente sobrepõe o que foi │
 * │ mexido. Salvar um preço repinta o cabeçalho, a compra, o custo do que  │
 * │ sobra e o histórico — tudo na mesma passada, porque tudo lê a mesma    │
 * │ fonte sobreposta.                                                     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O INSUMO NOVO TAMBÉM TEM ESTA TELA                                   │
 * │                                                                      │
 * │ Um insumo cadastrado na sessão não existe no repositório. Se a página  │
 * │ o mandasse para 404, cadastrar um insumo levaria a um beco sem saída  │
 * │ — e a pessoa concluiria que o cadastro falhou.                        │
 * │                                                                      │
 * │ Ele cai aqui igual aos outros, com a diferença que a tela declara:     │
 * │ "cadastrado nesta sessão", e "nenhuma ficha usa este insumo ainda" —   │
 * │ que é a verdade, e não um erro.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A FRONTEIRA DO QUE É CALCULADO AQUI                                  │
 * │                                                                      │
 * │ O QUE SAI DE MEDIÇÃO — aritmética pura sobre números informados:       │
 * │   preço unitário  = valor pago ÷ quantidade comprada                  │
 * │   perda           = peso anterior − peso posterior                    │
 * │   rendimento      = peso posterior ÷ peso anterior                    │
 * │   custo do usável = preço × (peso bruto ÷ peso final)                 │
 * │                                                                      │
 * │ Cada conta só existe quando os DOIS números que ela precisa foram      │
 * │ informados. Onde falta um, a tela mostra um traço — nunca um zero,     │
 * │ nunca uma estimativa.                                                 │
 * │                                                                      │
 * │ O QUE ELA NÃO FAZ, e a marca aparece no corpo da tela: não aplica      │
 * │ fator de correção de tabela, não usa índice de cocção de referência,   │
 * │ não estima rendimento de insumo não pesado, não converte caixa em       │
 * │ quilo, e não define preço de venda. São regras profissionais da        │
 * │ metodologia dela — o sistema não escolhe por ela.                     │
 * └──────────────────────────────────────────────────────────────────────┘
 */

/** De onde veio o número. É procedência, não confiabilidade. */
const ROTULO_ORIGEM: Record<PrecoIngrediente["origem"], string> = {
  CONSULTORA: "informada pela consultoria",
  CLIENTE: "informada pelo cliente",
  IMPORTADO: "importada de planilha antiga",
};

const ROTULO_ETAPA_CURTO = {
  COMPRA: "de compra",
  LIMPO: "limpo",
  PREPARADO: "preparado",
} as const;

/** Um peso, com casas fixas. Ausente vira traço — nunca zero. */
/**
 * O CUSTO EFETIVO NO CABEÇALHO DA SEÇÃO — o número que ela veio buscar.
 *
 * Ele aparece no topo porque é a CONCLUSÃO da seção inteira: os pesos que ela
 * digita abaixo existem para produzir este número. Deixá-lo só no rodapé faria
 * a conta mais importante da tela ser a última coisa a ser lida.
 *
 * Quando não há peso medido depois da compra, ele mostra o traço — e não o
 * preço de compra, que é o erro que faria o custo do prato sair menor do que
 * é.
 */
function IndicadorDeCusto({
  valor,
  unidade,
}: {
  valor: number | null;
  unidade: string | null;
}) {
  return (
    <div className="text-right">
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        Custo efetivo
      </p>
      <p className="tabular font-display text-[1.5rem] leading-tight text-tinta">
        {valor === null ? "—" : valorEmReais(valor)}
      </p>
      <p className="text-[0.75rem] text-[var(--tinta-fraca)]">
        {valor === null
          ? "falta um peso medido"
          : unidade
            ? `por ${unidade} do peso final`
            : "por unidade do peso final"}
      </p>
    </div>
  );
}

function peso(valor: number | null, unidade: string | null): string {
  if (valor === null) return "—";
  const n = valor.toFixed(CASAS_PESO).replace(".", ",");
  return unidade ? `${n} ${unidade}` : n;
}

function percentual(valor: number | null): string {
  if (valor === null) return "—";
  return `${valor.toFixed(CASAS_PERCENTUAL).replace(".", ",")}%`;
}

export type UsoDoIngrediente = {
  ficha: Ficha;
  cliente: Cliente;
  item: ItemFicha;
};

export type PrecoDeCliente = {
  cliente: Cliente;
  registro: {
    precoAtual: number | null;
    unidade: string;
    fornecedor: string;
    atualizadoEm: Date;
  };
};

/**
 * O CLIENTE DE UMA FICHA QUE NÃO TEM CLIENTE.
 *
 * O `Ficha.clienteId` admite `""` — é assim que este domínio declara "sem
 * cliente vinculado", e a ficha técnica importada de um PDF solto nasce
 * assim. O `FichaDoIngrediente` pede um `Cliente` inteiro, e uma ficha sem
 * cliente não tem um.
 *
 * O `id` VAZIO é a parte que importa: a lista de dependências liga o nome do
 * cliente à tela dele, e um id inventado mandaria a Érika para uma página de
 * cliente que não existe — pior do que não ter ligação nenhuma. Com `id: ""`
 * o código da lista sabe que não há para onde ir e escreve o texto puro.
 *
 * ── OS DEMAIS CAMPOS SÃO PREENCHIDOS, E NENHUM DELES É UM PALPITE ─────────
 *
 * `ClienteOperacao` é o cliente OPERACIONAL: ele carrega porte, cidade,
 * situação, origem do lead. De uma ficha sem cliente, nada disso se sabe — e
 * é justamente por isso que os valores abaixo são os VAZIOS de cada tipo, e
 * não uma escolha plausível. O que a tela mostra deste objeto é só o
 * `nomeFantasia`; tudo o mais existe para satisfazer o tipo, e nenhum leitor
 * desta tela o consulta.
 *
 * Os dois campos de data recebem a ÉPOCA, e não `new Date()`: `agora`
 * afirmaria que este cliente "iniciou hoje" e "teve atividade hoje". A época
 * é a declaração de que a data não existe — e é o mesmo valor neutro que o
 * resto do domínio usa quando não há o que dizer.
 *
 * Escolher "ATIVO"/"PEQUENO"/"BUFFET" aqui seria inventar um cliente que não
 * existe. Se algum dia a tela precisar de um destes campos, o certo é a ficha
 * exigir um cliente de verdade — e não este objeto responder por ela.
 */
const SEM_CLIENTE: Cliente = {
  id: "",
  nomeFantasia: "sem cliente vinculado",
  nomeContato: "",
  email: "",
  whatsapp: "",
  tipoNegocio: "OUTRO",
  porte: "PEQUENO",
  cidade: "",
  situacao: "EM_IMPLANTACAO",
  modalidade: "PRESENCIAL",
  iniciadoEm: new Date(0),
  ultimaAtividadeEm: new Date(0),
  funcionariosDeclarados: "",
  leadOrigemId: null,
  origem: "MANUAL",
  problemaDeclarado: "",
};

export function DetalheDoIngrediente({
  id,
  doCenario,
}: {
  id: string;
  /** O insumo do cenário, com os usos e preços de cliente que o servidor leu. */
  doCenario: {
    ingrediente: Ingrediente;
    usos: UsoDoIngrediente[];
    precosDeClientes: PrecoDeCliente[];
  } | null;
}) {
  // Assina o estado demonstrativo: qualquer preço salvo repinta esta tela.
  useDemonstracao();

  /*
    ── QUEM É ESTE INSUMO ──────────────────────────────────────────────────

    A ordem é: primeiro o que foi cadastrado nesta sessão, depois o cenário.
    O id é o mesmo nos dois casos, e um insumo da sessão nunca colide com um
    do cenário porque o prefixo `in_demo_` é reservado para eles.
  */
  const daSessao = ingredientesDaSessao().find((i) => i.id === id) ?? null;

  /*
    ── EXCLUÍDO NÃO É O MESMO QUE NUNCA EXISTIU ────────────────────────────
    Quando a exclusão acontece, o insumo continua no cenário que veio do
    servidor — ele é uma prop, e tirá-lo de um array não sobrevive a um novo
    render. A sessão então ANOTA que ele foi excluído, e esta linha é quem lê
    a anotação.

    Sem ela, abrir o endereço direto de um insumo recém-excluído mostraria a
    ficha inteira, viva, de um dado que a Érika acabou de apagar. Com ela, a
    tela diz o que aconteceu e oferece o caminho de volta.
  */
  if (insumoFoiExcluido(id)) {
    return <NaoEncontrado excluido />;
  }

  if (daSessao === null && doCenario === null) {
    return <NaoEncontrado />;
  }

  const base = daSessao ?? (doCenario as NonNullable<typeof doCenario>).ingrediente;

  /*
    ── A SOBREPOSIÇÃO DO PREÇO ─────────────────────────────────────────────

    Quando o preço foi atualizado nesta sessão, o vigente e o histórico vêm
    do store. O insumo em si — nome, categoria, pesagens — não muda: o que se
    edita aqui é preço, e só.
  */
  const estado = daSessao === null ? estadoDePrecoDaBiblioteca(id) : null;
  const ingrediente: Ingrediente =
    estado === null
      ? base
      : {
          ...base,
          precoAtual: estado.atual.valor,
          atualizadoEm: estado.atual.em,
          fornecedor: estado.atual.fornecedor || base.fornecedor,
          historico: estado.historico,
        };

  /*
    ── OS USOS QUE EXISTEM AGORA ───────────────────────────────────────────

    `usos` vem do cenário que o servidor leu — e o cenário não sabe nem que
    uma ficha foi apagada, nem que uma ficha foi CRIADA nesta sessão. Três
    correções acontecem aqui:

    1. Ficha apagada sai da lista. Sem isso, excluir uma ficha e depois abrir o
       insumo mostraria "em uso em 1 ficha" apontando para uma ficha que não
       abre mais — um bloqueio causado por algo que já não existe.

    2. A ficha entra como `fichaDaSessao`, com o nome que ela tem hoje. Se a
       Érika renomeou a ficha, a lista de dependências precisa dizer o nome
       novo; o antigo mandaria procurar por um nome que não está em lugar
       nenhum.

    3. ── AS FICHAS CRIADAS AGORA ENTRAM ────────────────────────────────────
       Esta é a correção que faltava, e ela fecha um furo grave, e do tipo
       errado: o que o briefing proíbe com todas as letras.

       O `usos` do servidor é a resposta de ONTEM. Se a Érika cria uma ficha
       usando este insumo e depois abre o insumo, a tela diria "nenhuma ficha
       usa este insumo ainda" e o botão de excluir continuaria habilitado.
       Excluir apagaria o insumo — e a ficha que ela acabou de montar ficaria
       sem custo, EM SILÊNCIO. Abriria normalmente, com a linha do insumo
       zerada, e nada na tela diria por quê.

       É o caso exato de "não deixar ficha silenciosamente sem custo": a
       contagem de dependências é o que IMPEDE a exclusão, e uma contagem que
       ignora a sessão não impede nada do que foi criado nela.

       O `cliente` sai do cenário quando ele é conhecido, porque o `Ficha` só
       guarda o `clienteId`. O que não for encontrado — uma ficha sem cliente,
       ou de um cliente que o cenário não tem — cai no rótulo neutro, que é a
       verdade e não um palpite.
  */
  const usosDoCenario = (doCenario?.usos ?? []).filter((u) => !fichaFoiExcluida(u.ficha.id));
  const idsJaContados = new Set(usosDoCenario.map((u) => u.ficha.id));

  const clientesConhecidos = new Map<string, Cliente>();
  for (const u of usosDoCenario) clientesConhecidos.set(u.cliente.id, u.cliente);
  for (const u of doCenario?.precosDeClientes ?? []) clientesConhecidos.set(u.cliente.id, u.cliente);

  const usosDaSessao: UsoDoIngrediente[] = fichasDaSessao()
    .filter((f) => !idsJaContados.has(f.id))
    .flatMap((f) =>
      f.itens
        .filter((item) => item.ingredienteId === id)
        .map((item) => ({
          ficha: f,
          cliente: clientesConhecidos.get(f.clienteId) ?? SEM_CLIENTE,
          item,
        }))
    );

  const usos = [...usosDoCenario, ...usosDaSessao];

  /*
    ESTA LINHA INTEIRA É O QUE IMPEDE A EXCLUSÃO DE UM INSUMO EM USO.

    A contagem de fichas seria uma mentira de uma casa decimal: uma ficha pode
    usar o mesmo insumo em duas linhas — a batata do recheio e a do
    acompanhamento. Contar `usos` mostraria "2", e o aviso falaria em duas
    fichas; a lista mostraria as duas linhas da MESMA ficha. O número tem de
    ser de fichas DISTINTAS, porque é isso que a frase promete.

    O conjunto é das chaves, então a primeira aparição de cada ficha decide a
    ordem — que continua sendo a do servidor.
  */
  const usosDaTela = usos.map((u) => ({ ...u, ficha: fichaDaSessao(u.ficha) }));
  const fichasEnvolvidas = [...new Set(usosDaTela.map((u) => u.ficha.id))].length;
  const precosDeClientes = doCenario?.precosDeClientes ?? [];

  /*
    ── O INSUMO COMO ELE ESTÁ AGORA ────────────────────────────────────────
    `ingredienteDaSessao` é a sobreposição canônica: ela junta o que foi
    cadastrado nesta sessão (nome, categoria, fornecedor, compra) ao que foi
    pesado. É a MESMA função que a lista usa.

    Ela é uma fonte só e tem dois leitores — esta tela e a biblioteca. Se cada
    uma montasse a sua sobreposição, editar um nome apareceria no detalhe e não
    na lista (ou o contrário), e a Érika veria dois valores para o mesmo
    insumo sem saber qual é o certo.
  */
  const ingredienteComPesagens = ingredienteDaSessao(ingrediente);

  /*
    ── DAQUI PARA BAIXO, TUDO LÊ `ingredienteComPesagens` ──────────────────

    Ele é a sobreposição mais completa: preço desta sessão (que veio em
    `ingrediente`) MAIS o que foi cadastrado nesta sessão — nome, categoria,
    fornecedor e compra.

    Ler `ingrediente` numa seção e `ingredienteComPesagens` noutra era um
    defeito silencioso: corrigir a quantidade comprada repintaria a
    calculadora de rendimento e deixaria a seção "Compra" mostrando a
    quantidade antiga, logo acima dela. Duas verdades sobre a mesma nota,
    na mesma tela, sem nada explicando por quê.
  */
  const derivada = derivarTransformacao(ingredienteComPesagens.transformacao);
  const unidadeDosPesos = derivada.unidade ?? ingredienteComPesagens.unidade;

  /*
    O PREÇO UNITÁRIO DA COMPRA é derivado, não digitado.

    Ele poderia ser um campo a mais em `Compra`, e aí existiriam dois números
    discordando sobre a mesma compra: o valor informado e o resultado da
    divisão. Derivando, só existe um.
  */
  const compra = ingredienteComPesagens.compra;
  const precoUnitario = compra ? precoUnitarioDaCompra(compra) : null;

  /*
    ── O CUSTO DO QUE SOBRA ────────────────────────────────────────────────

    A base da conta é o preço por unidade de COMPRA — o da nota, não o de
    referência da biblioteca. Os dois deveriam coincidir, e quando não
    coincidem o da nota é o fato: é o que foi realmente pago por aquele lote.
    O de referência entra só quando não há compra declarada.

    `custoPorEtapa` devolve as três etapas. A que interessa ao custo do prato
    é a ÚLTIMA QUE FOI MEDIDA — o preparado quando existe, o limpo quando só
    a limpeza foi pesada. Chamar de "custo do quilo utilizável" o custo do
    quilo limpo de um insumo que ainda vai encolher no fogo daria um número
    menor do que o real, com a mesma aparência de certo.
  */
  const precoDaCompra = precoUnitario ?? ingredienteComPesagens.precoAtual;

  const custos = custoPorEtapa(precoDaCompra, derivada);

  /*
    A ÚLTIMA ETAPA MEDIDA, e não a última etapa que existe.

    Quando só a limpeza foi pesada, o custo do quilo limpo é o mais próximo
    da verdade que se tem — e a tela diz "por unidade limpa", não "por
    unidade preparada". Chamar as duas de "custo por quilo utilizável" faria
    um insumo que ainda vai encolher no fogo aparecer com o custo de um que
    não vai.
  */
  const custoDoUtilizavel =
    custos.preparado !== null
      ? { valor: custos.preparado, etapa: "preparado" as const }
      : custos.limpo !== null
        ? { valor: custos.limpo, etapa: "limpo" as const }
        : null;

  const historico = [...ingrediente.historico].sort(
    (a, b) => b.em.getTime() - a.em.getTime()
  );

  /*
    `t` é a transformação EFETIVA — a da sessão quando ela acabou de pesar,
    a do cenário quando não. Os três painéis abaixo (pesos medidos, perdas e
    rendimento, custo do que sobra) leem daqui, e é por isso que eles repintam
    quando ela salva uma pesagem na calculadora: uma fonte só, quatro leitores.
  */
  const t = ingredienteComPesagens.transformacao;

  return (
    <div className="space-y-6">
      <Link
        href="/ingredientes"
        className="inline-flex items-center gap-2 text-[0.8125rem] text-[var(--tinta-suave)] transition-colors hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para a biblioteca
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
            {ingredienteComPesagens.categoria}
          </p>
          <h1 className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1.5 text-[1.75rem] leading-tight">
            {ingredienteComPesagens.nome}
            {daSessao !== null ? (
              <Etiqueta tom="dourado">cadastrado nesta sessão</Etiqueta>
            ) : null}
            {/*
              O ESTADO ARQUIVADO PRECISA SER VISÍVEL NO CABEÇALHO, e não só
              dentro da gaveta de edição. Quem abre este insumo pela ficha que
              o usa precisa entender, sem abrir nada, por que ele não aparece
              na biblioteca. A resposta tem de estar na primeira dobra.
            */}
            {ingredienteArquivado(id) ? (
              <Etiqueta tom="neutro">arquivado</Etiqueta>
            ) : null}
          </h1>
          <p className="mt-2 max-w-[70ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
            {ingrediente.precoAtual === null
              ? "Sem preço registrado. Enquanto não houver um preço, este insumo não entra na soma de nenhuma ficha."
              : `${valorEmReais(ingrediente.precoAtual)} por ${
                  ingrediente.unidade
                }, vigente desde ${dataCurta(ingrediente.atualizadoEm)}.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {historico.length > 1 ? <Etiqueta>{historico.length} registros</Etiqueta> : null}
          {/*
            A ORDEM DAS DUAS AÇÕES É A ORDEM DAS PERGUNTAS.
            "Editar dados" corrige o CADASTRO — o nome, a categoria, o que a
            nota dizia. "Atualizar preço" acrescenta um registro ao HISTÓRICO.
            São operações diferentes, com consequências diferentes: a primeira
            muda o insumo, a segunda muda o que ele custa a partir de hoje.
            Empilhá-las na mesma linha faria parecer que são a mesma coisa.
          */}
          <IdentidadeDoInsumo
            ingrediente={ingredienteComPesagens}
            emUso={usosDaTela}
            arquivado={ingredienteArquivado(id)}
          />
          <EditorDePreco
            ingrediente={ingrediente}
            precoVigente={ingrediente.precoAtual}
            unidadeVigente={ingrediente.unidade}
            fornecedorVigente={ingrediente.fornecedor}
            dataVigente={ingrediente.precoAtual === null ? null : ingrediente.atualizadoEm}
          />
        </div>
      </div>

      {/* ═══ 1. A COMPRA ═══════════════════════════════════════════════════ */}
      <Secao
        rotulo="Compra"
        titulo="Quanto se compra, e por quanto"
        descricao="Os dois números que geram o preço unitário. Ele não é digitado — é a divisão do que se pagou pela quantidade que veio."
      >
        {compra === null ? (
          <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.45)] px-4 py-4">
            <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
              A compra ainda não foi informada. Sem a quantidade comprada e o
              valor pago, o sistema não tem como calcular o preço unitário — e
              não estima a partir do preço de referência.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
            <CompraDetalhada compra={compra} precoUnitario={precoUnitario} />
            <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie-areia)] px-4 py-4">
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                A conta
              </p>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
                {valorEmReais(compra.valorTotal)} ÷{" "}
                <span className="tabular">
                  {compra.quantidade.toString().replace(".", ",")} {compra.unidade}
                </span>{" "}
                ={" "}
                <strong className="font-semibold text-tinta">
                  {precoUnitario === null
                    ? "—"
                    : `${valorEmReais(precoUnitario)} por ${compra.unidade}`}
                </strong>
              </p>
              <p className="mt-2 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                Divisão dos dois números informados. Nenhuma regra da
                metodologia entrou aqui.
              </p>
            </div>
          </div>
        )}
      </Secao>

      {/* ═══ 2. A TRANSFORMAÇÃO ════════════════════════════════════════════ */}
      <Secao
        rotulo="Transformação"
        titulo="O que acontece entre a compra e o prato"
        descricao="Cada peso abaixo é uma medição feita na cozinha. Etapa sem medição aparece tracejada — o sistema não repete o peso da etapa anterior no lugar dela."
        acoes={
          <IndicadorDeCusto
            valor={custoDoUtilizavel === null ? null : custoDoUtilizavel.valor}
            unidade={unidadeDosPesos}
          />
        }
      >
        {/*
          ── A CALCULADORA ──────────────────────────────────────────────────
          Ela vem ANTES do fluxo desenhado, e a ordem importa: o primeiro
          bloco é onde se digita, o segundo é o que resultou. Invertido, ela
          leria o resultado antes de saber onde corrigi-lo.
        */}
        <CalculadoraRendimento
          ingredienteId={id}
          nomeDoInsumo={ingredienteComPesagens.nome}
          compra={ingredienteComPesagens.compra}
          transformacao={ingredienteComPesagens.transformacao}
          unidadeDaCompra={ingredienteComPesagens.unidade}
        />

        <div className="mt-6 border-t border-dashed border-[var(--linha-forte)] pt-5">
          <FluxoRendimentoIngrediente
            derivada={derivada}
            unidade={unidadeDosPesos}
            rodape={
              t.observacao ? (
                <>
                  <span className="font-medium text-tinta">Anotação do preparo: </span>
                  {t.observacao}
                </>
              ) : null
            }
          />

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <PesosDaEtapa
              titulo="Pesos medidos"
              pesos={[
                { rotulo: "Peso de compra", quando: "como veio", peso: t.bruto },
                {
                  rotulo: "Peso limpo",
                  quando: "depois de descascar e aparar",
                  peso: t.limpo,
                },
                {
                  rotulo: "Peso preparado",
                  quando: "depois de cozinhar",
                  peso: t.preparado,
                },
              ]}
            />

            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Perdas e rendimento
              </p>
              <dl className="mt-3 space-y-3">
                <LinhaDerivada
                  rotulo="Perda na limpeza"
                  valorPeso={derivada.indicadores.perdaLimpeza}
                  unidade={unidadeDosPesos}
                  valorPct={derivada.indicadores.perdaLimpezaPct}
                  explica="Peso de compra menos peso limpo."
                />
                <LinhaDerivada
                  rotulo="Perda no preparo"
                  valorPeso={derivada.indicadores.perdaPreparo}
                  unidade={unidadeDosPesos}
                  valorPct={derivada.indicadores.perdaPreparoPct}
                  explica="Peso limpo menos peso preparado."
                />
                <LinhaDerivada
                  rotulo="Perda total"
                  valorPeso={derivada.indicadores.perdaTotal}
                  unidade={unidadeDosPesos}
                  valorPct={derivada.indicadores.perdaTotalPct}
                  explica="Tudo o que se perdeu entre a compra e o preparo."
                />
                <LinhaDerivada
                  rotulo="Rendimento final"
                  valorPeso={null}
                  unidade={null}
                  valorPct={derivada.indicadores.rendimentoFinalPct}
                  explica="Quanto do peso comprado virou produto utilizável."
                />
              </dl>

              {derivada.etapasInformadas === 0 ? (
                <p className="mt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                  Nenhum peso foi medido ainda. Todos os indicadores acima ficam
                  em traço — e ficam assim de propósito: um rendimento de 100%
                  num insumo que ninguém pesou teria a aparência exata de um
                  número certo.
                </p>
              ) : null}
            </div>

            <div>
              <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
                Custo do que sobra
              </p>
              <div className="mt-3 space-y-4">
                <Indicador
                  rotulo="Por unidade de compra"
                  valor={precoUnitario === null ? "—" : valorEmReais(precoUnitario)}
                  unidade={
                    precoUnitario === null ? undefined : (compra?.unidade ?? ingrediente.unidade)
                  }
                  contexto="O que a nota diz, dividido pela quantidade."
                />
                <Indicador
                  rotulo={
                    custoDoUtilizavel?.etapa === "limpo"
                      ? "Por unidade limpa"
                      : custoDoUtilizavel?.etapa === "preparado"
                        ? "Por unidade preparada"
                        : "Por unidade utilizável"
                  }
                  valor={
                    custoDoUtilizavel === null
                      ? "—"
                      : valorEmReais(custoDoUtilizavel.valor)
                  }
                  unidade={custoDoUtilizavel === null ? undefined : unidadeDosPesos}
                  contexto={
                    custoDoUtilizavel === null
                      ? "Falta um peso medido depois da compra"
                      : custoDoUtilizavel.etapa === "limpo"
                        ? "Só a limpeza foi pesada; o preparo ainda não."
                        : "O que foi pago, dividido pelo peso que sobrou."
                  }
                />
              </div>

              {custoDoUtilizavel === null ? (
                <p className="mt-3 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
                  Enquanto o insumo não tiver um peso medido depois da compra, o
                  custo do que sobra não existe. Usar o preço de compra no lugar
                  dele faria o custo do prato sair menor do que é.
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/*
          A MARCA DA REGRA QUE AINDA NÃO EXISTE.

          ┌────────────────────────────────────────────────────────────────┐
          │ O QUE MUDOU NESTE TEXTO, E POR QUE                            │
          │                                                                │
          │ A versão anterior dizia que o fator de correção "ainda não é   │
          │ aplicado". Isso deixou de ser verdade pela metade: o fator      │
          │ MEDIDO — a razão entre os dois pesos que ela pesou — agora      │
          │ aparece na calculadora, porque ela pediu o número.              │
          │                                                                │
          │ O que continua não existindo é o fator de TABELA: o número que  │
          │ vale ANTES de pesar, para prever quanto se vai perder. Esse o   │
          │ sistema continua sem ter, e a nota precisa dizer isso — senão a │
          │ Érika lê "fator de correção" na tela e conclui que a tabela     │
          │ dela já está lá dentro.                                          │
          └────────────────────────────────────────────────────────────────┘
        */}
        <RegraAConfirmar
          className="mt-5"
          oQue="Estas contas saem só das pesagens feitas na cozinha. O fator de correção que aparece acima é o que as suas balanças produziram — ele vale depois de medir. Se a sua metodologia tem um fator de tabela, um número de referência que valha antes de pesar, ele ainda não é aplicado, porque o sistema não escolhe por você."
        />
      </Secao>

      {/* ═══ 3. ONDE ESTE INSUMO ENTRA ═════════════════════════════════════ */}
      <Secao
        rotulo={`${fichasEnvolvidas} ${fichasEnvolvidas === 1 ? "ficha" : "fichas"}`}
        titulo="Onde este insumo entra"
        descricao="Cada ficha guarda o preço de referência do dia em que foi escrita, além da quantidade e da etapa em que ela foi pesada."
      >
        {usosDaTela.length === 0 ? (
          <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            {daSessao !== null
              ? "Nenhuma ficha usa este insumo ainda — ele acabou de ser cadastrado. Ao escolhê-lo numa ficha, ele aparece aqui."
              : "Este insumo ainda não aparece em nenhuma ficha. Ele entra na biblioteca e passa a ser reutilizável a partir da primeira ficha que o mencionar — sem que ninguém precise digitá-lo de novo."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--linha)]">
            {usosDaTela.map(({ ficha, cliente, item }, indice) => (
              <li key={`${ficha.id}-${indice}`} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
                  <div className="min-w-0">
                    <Link
                      href={`/fichas/${ficha.id}`}
                      className="text-[0.9375rem] text-tinta hover:text-oliva"
                    >
                      {ficha.nome}
                    </Link>
                    <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
                      {cliente.id === "" ? (
                        cliente.nomeFantasia
                      ) : (
                        <Link href={`/clientes/${cliente.id}`} className="hover:text-tinta">
                          {cliente.nomeFantasia}
                        </Link>
                      )}{" "}
                      ·{" "}
                      <span className="tabular">
                        {item.quantidade} {item.unidade}
                      </span>{" "}
                      · peso {ROTULO_ETAPA_CURTO[item.etapa]}
                    </span>
                  </div>
                  <div className="text-right">
                    {item.precoReferencia === null ? (
                      <span className="text-[0.875rem] text-[var(--tinta-fraca)]">sem preço</span>
                    ) : (
                      <span className="tabular text-[0.875rem] text-[var(--tinta-suave)]">
                        {valorEmReais(item.precoReferencia)}
                        <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                          preço de referência da ficha
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      {/* ═══ 4. PREÇO POR CLIENTE ══════════════════════════════════════════ */}
      <Secao
        rotulo="Por cliente"
        titulo="O preço deste insumo em cada cliente"
        descricao="O insumo é um só — a mesma compra, a mesma perda na limpeza. O preço muda de cliente para cliente, e fica guardado separado para que o custo de um prato nunca saia com o preço de outro."
      >
        {precosDeClientes.length === 0 ? (
          <p className="text-[0.875rem] leading-relaxed text-[var(--tinta-suave)]">
            {daSessao !== null
              ? "Este insumo acabou de ser cadastrado e ainda não tem preço de cliente. Enquanto for assim, as fichas usam o preço de referência da biblioteca."
              : "Nenhum cliente tem um preço próprio para este insumo. Enquanto for assim, as fichas usam o preço de referência da biblioteca."}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--linha)]">
            {precosDeClientes.map(({ cliente, registro }) => (
              <li
                key={cliente.id}
                className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="text-[0.9375rem] text-tinta hover:text-oliva"
                  >
                    {cliente.nomeFantasia}
                  </Link>
                  <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
                    {registro.fornecedor || "fornecedor não informado"} ·{" "}
                    {dataCurta(registro.atualizadoEm)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular text-[0.9375rem] text-tinta">
                    {registro.precoAtual === null
                      ? "sem preço"
                      : `${valorEmReais(registro.precoAtual)} / ${registro.unidade}`}
                  </span>
                  <EditorDePreco
                    ingrediente={ingrediente}
                    clienteId={cliente.id}
                    clienteNome={cliente.nomeFantasia}
                    precoVigente={registro.precoAtual}
                    unidadeVigente={registro.unidade}
                    fornecedorVigente={registro.fornecedor}
                    dataVigente={
                      registro.precoAtual === null ? null : registro.atualizadoEm
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        {/*
          A EXPLICAÇÃO DO QUE FALTA AQUI.

          A lista mostra só os clientes que já têm preço próprio. Dizer por que
          os outros não aparecem evita a leitura errada de que o insumo só é
          usado por esses — que é o tipo de conclusão que faz alguém cadastrar
          o mesmo insumo duas vezes.
        */}
        <p className="mt-4 text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
          Aparecem aqui só os clientes que já têm um preço próprio para este
          insumo. Os demais usam o preço de referência da biblioteca e não
          entram na lista — o que não quer dizer que não usem o insumo.
        </p>
      </Secao>

      {/* ═══ 5. HISTÓRICO, IDENTIFICAÇÃO E O QUE FALTA ═════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <Secao
          rotulo={`${historico.length} ${historico.length === 1 ? "registro" : "registros"}`}
          titulo="Histórico de preço da biblioteca"
          descricao="Do mais recente para o mais antigo. Cada linha é um preço que passou a valer numa data — não uma estimativa. É esta lista que a atualização de preço alimenta sem apagar nada."
        >
          {historico.length === 0 ? (
            <p className="text-[0.875rem] text-[var(--tinta-suave)]">
              Nenhum preço registrado para este insumo ainda.
            </p>
          ) : (
            <ul className="divide-y divide-[var(--linha)]">
              {historico.map((p, i) => {
                const anterior = historico[i + 1]?.valor ?? null;
                const variacao =
                  anterior !== null && anterior > 0
                    ? ((p.valor - anterior) / anterior) * 100
                    : null;
                return (
                  <li
                    key={p.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <span className="tabular text-[0.9375rem] text-tinta">
                        {valorEmReais(p.valor)} por {p.unidade}
                      </span>
                      <span className="mt-0.5 block text-[0.8125rem] text-[var(--tinta-fraca)]">
                        {dataCurta(p.em)} · {p.fornecedor || "fornecedor não informado"} ·{" "}
                        {ROTULO_ORIGEM[p.origem]}
                      </span>
                    </div>
                    <div className="text-right">
                      {i === 0 ? (
                        <Etiqueta tom="oliva">vigente</Etiqueta>
                      ) : variacao !== null && anterior !== null ? (
                        <span className="tabular text-[0.8125rem] text-[var(--tinta-suave)]">
                          {variacao > 0 ? "+" : ""}
                          {variacao.toFixed(1).replace(".", ",")}%
                          <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                            sobre {valorEmReais(anterior)}
                          </span>
                        </span>
                      ) : (
                        <span className="text-[0.75rem] text-[var(--tinta-fraca)]">
                          primeiro registro
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <p className="mt-5 max-w-[75ch] text-[0.75rem] leading-relaxed text-[var(--tinta-fraca)]">
            A variação ao lado de cada linha é uma subtração, não um alerta. Ela
            não indica se a alta é preocupante: um hortifrúti que sobe em julho e
            volta em agosto é sazonalidade, e quem lê isso é a consultora,
            olhando o cliente. O sistema não classifica o que é “muita” alta.
          </p>
        </Secao>

        <div className="space-y-6">
          <Painel>
            <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
              Identificação
            </p>
            <div className="mt-3">
              <ListaDados colunas={1}>
                <Dado rotulo="Categoria">{ingredienteComPesagens.categoria}</Dado>
                <Dado rotulo="Fornecedor">
                  {ingredienteComPesagens.fornecedor || "não informado"}
                </Dado>
                <Dado rotulo="Unidade">{ingredienteComPesagens.unidade}</Dado>
                <Dado rotulo="Usado em">
                  {usos.length === 0
                    ? "nenhuma ficha ainda"
                    : `${usos.length} ${usos.length === 1 ? "ficha" : "fichas"}`}
                </Dado>
                <Dado rotulo="Atualizado">
                  {desdeQuando(ingrediente.atualizadoEm)} ·{" "}
                  {dataCurta(ingrediente.atualizadoEm)}
                </Dado>
              </ListaDados>
            </div>
            {ingredienteComPesagens.observacoes ? (
              <p className="mt-4 border-t border-dashed border-[var(--linha-forte)] pt-3.5 text-[0.8125rem] leading-relaxed text-[var(--tinta-suave)]">
                <span className="font-medium text-tinta">Observações: </span>
                {ingredienteComPesagens.observacoes}
              </p>
            ) : null}
          </Painel>

          <Aviso tom="info" titulo="O que esta tela ainda não faz">
            <p>
              Preço de venda, CMV, markup e margem não aparecem aqui — nem como
              estimativa. Os quatro dependem de decisões de metodologia que ainda
              não foram tomadas, e um número inventado teria a aparência exata de
              um número certo.
            </p>
            <p className="mt-2.5">
              O que ela já faz é o que não depende de decisão nenhuma: registrar
              o preço com a data, guardar o anterior, calcular a perda e o
              rendimento a partir das pesagens, e mostrar onde o insumo entra.
            </p>
          </Aviso>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Peças da tela
// ---------------------------------------------------------------------------

function CompraDetalhada({
  compra,
  precoUnitario,
}: {
  compra: Compra;
  precoUnitario: number | null;
}) {
  return (
    <div className="rounded-[var(--raio)] border border-[var(--linha)] bg-[var(--superficie)] px-5 py-5">
      <ListaDados colunas={3}>
        <Dado rotulo="Quanto veio">
          <span className="tabular">
            {compra.quantidade.toString().replace(".", ",")} {compra.unidade}
          </span>
        </Dado>
        <Dado rotulo="Quanto custou">
          <span className="tabular">{valorEmReais(compra.valorTotal)}</span>
        </Dado>
        <Dado rotulo="Preço unitário">
          <span className="tabular">
            {precoUnitario === null
              ? "—"
              : `${valorEmReais(precoUnitario)} / ${compra.unidade}`}
          </span>
        </Dado>
      </ListaDados>
    </div>
  );
}

/**
 * Os três pesos medidos, um por linha.
 *
 * Cada linha diz em que momento da cozinha aquele número foi obtido. Sem isso,
 * "4,500 kg" não significa nada — o mesmo número pode ser a sacola que chegou
 * ou a panela que sobrou.
 *
 * A unidade vem do PRÓPRIO PESO, e não da biblioteca: quem pesou viu "4,5" na
 * balança e escolheu "kg". Mostrar a unidade da biblioteca no lugar da unidade
 * medida seria decidir, por conta própria, em que grandeza aquela medição foi
 * feita.
 */
function PesosDaEtapa({
  titulo,
  pesos,
}: {
  titulo: string;
  pesos: ReadonlyArray<{
    rotulo: string;
    quando: string;
    peso: Transformacao["bruto"];
  }>;
}) {
  return (
    <div>
      <p className="text-[0.6875rem] font-semibold tracking-[0.14em] text-[var(--tinta-fraca)] uppercase">
        {titulo}
      </p>
      <dl className="mt-3 space-y-3">
        {pesos.map((p) => (
          <div key={p.rotulo}>
            <dt className="text-[0.8125rem] leading-snug text-[var(--tinta-suave)]">
              {p.rotulo}
              <span className="mt-0.5 block text-[0.75rem] text-[var(--tinta-fraca)]">
                {p.quando}
              </span>
            </dt>
            <dd
              className={
                p.peso === null
                  ? "tabular mt-1 text-[1.0625rem] text-[var(--tinta-fraca)]"
                  : "tabular mt-1 font-display text-[1.0625rem] text-tinta"
              }
            >
              {peso(p.peso?.peso ?? null, p.peso?.unidade ?? null)}
              {p.peso === null ? (
                <span className="ml-2 text-[0.75rem] text-[var(--tinta-fraca)]">
                  não pesado
                </span>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Uma linha derivada — peso, percentual e a conta que a produziu.
 *
 * O `explica` não é decoração: os quatro indicadores são subtrações e divisões
 * diferentes, e sem dizer qual é qual a consultora não tem como conferir se o
 * sistema entendeu o mesmo que ela.
 */
function LinhaDerivada({
  rotulo,
  valorPeso,
  unidade,
  valorPct,
  explica,
}: {
  rotulo: string;
  valorPeso: number | null;
  unidade: string | null;
  valorPct: number | null;
  explica: string;
}) {
  const vazio = valorPeso === null && valorPct === null;

  return (
    <div>
      <dt className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <span className="text-[0.8125rem] text-[var(--tinta-suave)]">{rotulo}</span>
        <span
          className={
            vazio
              ? "tabular text-[0.9375rem] text-[var(--tinta-fraca)]"
              : "tabular text-[0.9375rem] text-tinta"
          }
        >
          {valorPeso !== null ? peso(valorPeso, unidade) : null}
          {valorPeso !== null && valorPct !== null ? " · " : null}
          {valorPct !== null ? percentual(valorPct) : null}
          {vazio ? "não medido" : null}
        </span>
      </dt>
      <dd className="mt-0.5 text-[0.75rem] leading-snug text-[var(--tinta-fraca)]">{explica}</dd>
    </div>
  );
}

/**
 * O CASO EM QUE O INSUMO NÃO EXISTE.
 *
 * Acontece com um endereço antigo ou digitado à mão. Não é `notFound()` do
 * Next porque este componente é de cliente — o 404 de verdade é decidido no
 * servidor, antes de chegar aqui. Este bloco é a rede de segurança para o dia
 * em que o insumo sumir entre a montagem da página e a pintura.
 */
/**
 * O INSUMO NÃO ESTÁ AQUI — e os dois motivos são diferentes.
 *
 * "Excluído" e "não encontrado" pedem ações diferentes de quem lê. No primeiro
 * caso houve um ato dela, e a tela confirma que ele valeu; no segundo, o
 * endereço é que está errado, e não há nada a confirmar. Dizer "não encontrado"
 * depois de uma exclusão faria ela duvidar se a exclusão funcionou.
 */
function NaoEncontrado({ excluido = false }: { excluido?: boolean }) {
  return (
    <div className="rounded-[var(--raio)] border border-dashed border-[var(--linha-forte)] bg-[rgba(242,236,226,0.45)] px-6 py-10">
      <p className="text-[0.6875rem] font-semibold tracking-[0.16em] text-[var(--tinta-fraca)] uppercase">
        {excluido ? "Insumo excluído" : "Insumo não encontrado"}
      </p>
      <p className="mt-2 max-w-[60ch] text-[0.9375rem] leading-relaxed text-[var(--tinta-suave)]">
        {excluido
          ? "Este insumo foi excluído da biblioteca nesta sessão. As fichas que o usavam continuam existindo — nenhuma delas foi apagada junto."
          : "Este insumo não está na biblioteca. Ele pode ter sido removido, ou o endereço pode estar incompleto."}
      </p>
      <Link
        href="/ingredientes"
        className="mt-4 inline-flex items-center gap-2 text-[0.875rem] text-oliva hover:text-tinta"
      >
        <span aria-hidden>←</span> Voltar para a biblioteca
      </Link>
    </div>
  );
}
