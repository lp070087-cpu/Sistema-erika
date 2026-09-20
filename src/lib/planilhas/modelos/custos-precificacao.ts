/**
 * MODELO: CUSTOS E PRECIFICAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA PLANILHA CALCULA — E O QUE ELA SE RECUSA A CALCULAR       │
 * │                                                                      │
 * │ CALCULA, e são contas objetivas, com os dois números já informados:   │
 * │                                                                      │
 * │   CMV real    = (custo ÷ preço de venda) × 100                        │
 * │   Markup real = preço de venda ÷ custo                                │
 * │                                                                      │
 * │ As duas são DIVISÕES de fatos que existem: o custo da receita, que o  │
 * │ motor de custo já calcula, e o preço de venda, que alguém decidiu e   │
 * │ registrou. Não há escolha de método em nenhuma das duas — dividir um  │
 * │ número pelo outro não é uma decisão profissional.                     │
 * │                                                                      │
 * │ ┌────────────────────────────────────────────────────────────────────┐ │
 * │ │ NÃO CALCULA — e esta lista é a razão de a planilha existir         │ │
 * │ │                                                                    │ │
 * │ │   · CMV alvo            (qual CMV ela quer ter)                    │ │
 * │ │   · markup alvo         (quantas vezes o custo)                    │ │
 * │ │   · preço recomendado   (o preço que o alvo exigiria)              │ │
 * │ │   · preço ideal         (mesma coisa, outro nome)                  │ │
 * │ │   · margem ideal        (a margem que ela considera certa)         │ │
 * │ │   · margem de segurança (o acréscimo que cobre a queima)           │ │
 * │ │                                                                    │ │
 * │ │ Não é timidez: cada uma dessas depende de uma REGRA DELA, e nenhuma │ │
 * │ │ foi respondida. `recomendacaoDePreco` existe no motor de indicadores│ │
 * │ │ e devolve `null` quando o alvo é nulo — a planilha nem chama.       │ │
 * │ └────────────────────────────────────────────────────────────────────┘ │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O VAZIO NÃO É ZERO — E NESTA PLANILHA ISSO VALE DINHEIRO              │
 * │                                                                      │
 * │ CMV e markup ficam VAZIOS nos pratos que não têm preço de venda        │
 * │ informado. O preenchimento tentador seria `0%` e `×0,00`, e os dois    │
 * │ números seriam lidos como "este prato tem custo zero" e "o preço não   │
 * │ cobre o custo". São duas conclusões falsas tiradas de uma ausência.    │
 * │                                                                      │
 * │ O que a planilha mostra no lugar é o motivo, em texto: o que falta     │
 * │ informar para que o número apareça.                                    │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { EtapaPeso, Ficha } from "@/lib/dados";
import {
  ROTULO_ETAPA_PESO,
  ROTULO_SITUACAO_FICHA,
  dataCurta,
  indicadoresDeVenda,
  resolverItem,
  resumoDaFicha,
} from "@/lib/dados";
import type { ContextoPlanilha } from "../tipos";
import { ABAS_CUSTOS } from "../modelos";
import { recorteDoCliente } from "../relatorio";
import { indexarInsumos } from "../insumos";
import type { IndiceDeInsumos } from "../insumos";
import type { ColunaGrade, FolhaGrade, GradeDaPlanilha, LinhaGrade } from "../grade";
import { campo, dados, nota, pendencia, pixels, secao } from "../grade";
import { LARGURA } from "../estilos";

/**
 * A GRADE PRINCIPAL — as cinco colunas que o briefing pede, mais as que
 * tornam possível conferir as cinco.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A GRADE NÃO TEM SÓ CINCO COLUNAS                             │
 * │                                                                      │
 * │ PRATO · CUSTO REAL · PREÇO DE VENDA · CMV REAL · MARKUP REAL são as   │
 * │ cinco que respondem a pergunta. Sozinhas, elas mostram a resposta e   │
 * │ escondem a conta: quem recebe a planilha e desconfia do CMV não tem   │
 * │ onde conferir de onde veio o custo.                                   │
 * │                                                                      │
 * │ CATEGORIA, PORÇÕES e CUSTO POR PORÇÃO entram por isso — são os três   │
 * │ números que ligam a linha ao prato que existe na cozinha, e sem eles  │
 * │ duas fichas do mesmo nome em tamanhos diferentes viram a mesma linha. │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const COLUNAS_CUSTOS: readonly ColunaGrade[] = [
  { chave: "prato", titulo: "Prato", formato: "texto", largura: LARGURA.larga, larguraMinima: pixels(LARGURA.larga) },
  { chave: "categoria", titulo: "Categoria", formato: "texto", largura: LARGURA.media, larguraMinima: 130 },
  { chave: "porcoes", titulo: "Porções", formato: "numero", largura: LARGURA.estreita, larguraMinima: 80 },
  { chave: "custoReal", titulo: "Custo real", formato: "moeda", largura: LARGURA.estreita, larguraMinima: 110 },
  { chave: "custoPorcao", titulo: "Custo porção", formato: "moeda", largura: LARGURA.estreita, larguraMinima: 110 },
  { chave: "precoVenda", titulo: "Preço de venda", formato: "moeda", largura: LARGURA.estreita, larguraMinima: 120 },
  { chave: "cmv", titulo: "CMV real", formato: "percentual", largura: LARGURA.estreita, larguraMinima: 100 },
  { chave: "markup", titulo: "Markup real", formato: "numero", largura: LARGURA.estreita, larguraMinima: 110 },
  { chave: "pratoSituacao", titulo: "Situação do custo", formato: "texto", largura: LARGURA.media, larguraMinima: 170 },
];

/** As colunas da aba COMPOSIÇÃO — o que puxa o custo de cada prato. */
const COLUNAS_COMPOSICAO: readonly ColunaGrade[] = [
  { chave: "prato", titulo: "Prato", formato: "texto", largura: LARGURA.larga, larguraMinima: pixels(LARGURA.larga) },
  { chave: "insumo", titulo: "Insumo", formato: "texto", largura: LARGURA.larga, larguraMinima: pixels(LARGURA.larga) },
  { chave: "etapa", titulo: "Etapa", formato: "texto", largura: LARGURA.media, larguraMinima: 120 },
  { chave: "quantidade", titulo: "Quantidade", formato: "peso", largura: LARGURA.estreita, larguraMinima: 100 },
  { chave: "unidade", titulo: "Un", formato: "texto", largura: 8, larguraMinima: 44 },
  { chave: "precoUnitario", titulo: "Preço unit.", formato: "moeda", largura: LARGURA.estreita, larguraMinima: 110 },
  { chave: "custo", titulo: "Custo", formato: "moeda", largura: LARGURA.estreita, larguraMinima: 104 },
  { chave: "pesoNoPrato", titulo: "Peso no custo", formato: "percentual", largura: LARGURA.estreita, larguraMinima: 120 },
];

/** As colunas das abas de texto (INFORMAÇÕES). */
const COLUNAS_TEXTO: readonly ColunaGrade[] = [
  { chave: "a", titulo: "", formato: "texto", largura: LARGURA.larga },
  { chave: "b", titulo: "", formato: "texto", largura: LARGURA.muitoLarga },
  { chave: "c", titulo: "", formato: "texto", largura: LARGURA.larga },
];

/**
 * O QUE A PLANILHA DE CUSTO TEM A DIZER SOBRE UMA FICHA.
 *
 * É o resultado do motor de custo, guardado junto para as duas abas usarem o
 * MESMO custo. Recalcular na aba de composição para calcular o peso
 * percentual de cada insumo daria duas somas do mesmo prato, e um
 * arredondamento de diferença apareceria como um erro de planilha.
 */
type LinhaDeCusto = {
  ficha: Ficha;
  /** O custo que entra na coluna CUSTO REAL. `null` quando a soma não fechou. */
  custoReal: number | null;
  /** O piso: o que a soma conseguiu alcançar, mesmo incompleta. */
  custoParcial: number;
  porcoes: number | null;
  custoPorcao: number | null;
  precoVenda: number | null;
  cmv: number | null;
  markup: number | null;
  /** Por que o CMV e o markup não existem, quando não existem. */
  motivoDoVazio: string;
  /** As linhas que entraram na soma, para a aba de composição. */
  somados: readonly ItemSomado[];
  itensFora: number;
  itensTotal: number;
};

/** Uma linha que entrou na soma do custo de um prato. */
type ItemSomado = {
  nome: string;
  /** A etapa já vem tipada do `ItemFicha` — não é texto livre. */
  etapa: EtapaPeso;
  quantidade: number | null;
  unidade: string;
  preco: number | null;
  custo: number;
};

// ---------------------------------------------------------------------------
// A grade
// ---------------------------------------------------------------------------

export function montarGradeDeCustos(ctx: ContextoPlanilha): GradeDaPlanilha {
  const { fichas } = recorteDoCliente(ctx);
  const insumos = indexarInsumos(ctx);
  const linhas = fichas.map((ficha) => analisarFicha(ficha, insumos));
  const subtitulo = subtituloDeCustos(ctx);

  return {
    titulo: "CUSTOS E PRECIFICAÇÃO",
    subtitulo,
    folhas: [
      folhaCustos(linhas),
      folhaComposicao(linhas),
      folhaInformacoesDeCusto(ctx, linhas, subtitulo),
    ],
  };
}

function subtituloDeCustos(ctx: ContextoPlanilha): string {
  const partes = [ctx.cliente.nomeFantasia];
  if (ctx.consultoria) partes.push(ctx.consultoria.titulo);
  partes.push(`gerado em ${dataCurta(ctx.geradoEm)}`);
  return partes.join(" · ");
}

/**
 * LÊ UMA FICHA PELO MOTOR DE CUSTO — sem refazer nenhuma conta.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE `completo` MANDA AQUI, E NÃO O NÚMERO                        │
 * │                                                                      │
 * │ `resumoDaFicha` devolve dois custos: o que entrou na soma e se a soma  │
 * │ fechou. O segundo é o que decide. Um prato com doze ingredientes e um  │
 * │ sem preço tem um custo PARCIAL que parece perfeitamente normal — e     │
 * │ calcular CMV em cima dele produziria um CMV menor que o real, com a   │
 * │ mesma cara de um CMV conferido.                                        │
 * │                                                                      │
 * │ Por isso o custo real só existe quando a soma fecha. Quando não       │
 * │ fecha, o motivo é escrito na linha, e o número não aparece.            │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function analisarFicha(ficha: Ficha, insumos: IndiceDeInsumos): LinhaDeCusto {
  const resolvidos = ficha.itens.map((item) =>
    resolverItem(item, insumos.porId(item.ingredienteId), insumos.doCliente(item.ingredienteId))
  );

  const resumo = resumoDaFicha(resolvidos, ficha);
  const precoVenda = ficha.precoVenda ?? null;

  /*
    CMV e markup saem de `indicadoresDeVenda`, que é a MESMA função que a tela
    da ficha usa. Ela devolve `null` quando falta um dos dois lados — e essa
    é a resposta correta, não um erro a contornar com zero.
  */
  const custoReal = resumo.completo ? resumo.custoTotal : null;
  const indicadores = indicadoresDeVenda(custoReal, precoVenda);

  return {
    ficha,
    custoReal,
    custoParcial: resumo.custoTotal,
    porcoes: ficha.rendimentoPorcoes,
    custoPorcao: resumo.custoPorPorcao,
    precoVenda,
    cmv: indicadores?.cmvPct ?? null,
    markup: indicadores?.markup ?? null,
    motivoDoVazio: motivoDoVazio(resumo.completo, precoVenda),
    somados: resolvidos
      .filter((r) => r.custo !== null)
      .map((r) => ({
        nome: r.ingrediente?.nome ?? r.item.ingredienteId,
        etapa: r.item.etapa,
        quantidade: r.quantidade,
        unidade: r.item.unidade,
        preco: r.precoEfetivo,
        custo: r.custo as number,
      })),
    itensFora: resumo.itensFora,
    itensTotal: resolvidos.length,
  };
}

/**
 * A FRASE QUE EXPLICA UMA CÉLULA VAZIA.
 *
 * Existe porque "—" sozinho não diz se falta o preço de venda, se falta o
 * custo, ou se o prato não tem ingrediente nenhum. As três pedem coisas
 * diferentes dela, e a planilha tem o dever de dizer qual é a sua.
 */
function motivoDoVazio(custoCompleto: boolean, precoVenda: number | null): string {
  if (!custoCompleto && precoVenda === null) {
    return "falta fechar o custo e informar o preço de venda";
  }
  if (!custoCompleto) return "falta fechar o custo";
  if (precoVenda === null) return "falta informar o preço de venda";
  return "";
}

// ---------------------------------------------------------------------------
// ABA 1 — CUSTOS
// ---------------------------------------------------------------------------

function folhaCustos(linhas: readonly LinhaDeCusto[]): FolhaGrade {
  const conteudo: LinhaGrade[] = [];

  if (linhas.length === 0) {
    conteudo.push(
      nota(
        "Nenhuma ficha técnica cadastrada para este cliente. O custo nasce da ficha — ele não é " +
          "digitado aqui."
      )
    );
  } else {
    conteudo.push({ tipo: "cabecalho" });
    for (const l of linhas) {
      conteudo.push(
        dados({
          prato: l.ficha.nome,
          categoria: l.ficha.categoria,
          porcoes: l.porcoes,
          custoReal: l.custoReal,
          custoPorcao: l.custoPorcao,
          precoVenda: l.precoVenda,
          cmv: l.cmv,
          markup: l.markup,
          /*
            A SITUAÇÃO DO CUSTO — e não um total que não fechou.

            Quando a soma não fecha, a coluna do custo fica vazia e esta aqui
            diz por quê, com o número de linhas de fora. É o que impede a
            planilha de apresentar um piso como se fosse custo.
          */
          pratoSituacao:
            l.itensFora > 0
              ? `${l.itensFora} de ${l.itensTotal} linha(s) fora da soma`
              : ROTULO_SITUACAO_FICHA[l.ficha.situacao],
        })
      );
    }

    /*
      A LINHA DE FECHAMENTO.

      Soma só o que existe: as colunas de dinheiro somam os custos fechados, e
      as de percentual e markup ficam VAZIAS. Média de CMV entre pratos com
      preços diferentes não significa nada, e um CMV "total" na última linha
      seria lido como se significasse.
    */
    const custosFechados = linhas.filter((l) => l.custoReal !== null);
    conteudo.push({
      tipo: "total",
      rotulo:
        custosFechados.length === linhas.length
          ? "TOTAL"
          : `TOTAL de ${custosFechados.length} de ${linhas.length} prato(s)`,
      celulas: {
        prato:
          custosFechados.length === linhas.length
            ? "TOTAL"
            : `TOTAL de ${custosFechados.length} de ${linhas.length} prato(s)`,
        custoReal: custosFechados.reduce((s, l) => s + (l.custoReal as number), 0),
      },
    });

    if (custosFechados.length !== linhas.length) {
      conteudo.push(
        nota(
          "O total acima soma apenas os pratos cujo custo fechou. Os pratos com linha fora da soma " +
            "ficaram de fora do total — incluí-los somaria um piso, e o total seria menor que o custo real."
        )
      );
    }
  }

  return {
    nome: ABAS_CUSTOS[0],
    titulo: "CUSTOS E PRECIFICAÇÃO",
    colunas: COLUNAS_CUSTOS,
    linhas: conteudo,
    congelarLinhas: 3,
    mostrarCabecalho: true,
    assinatura:
      "CMV real = custo ÷ preço de venda. Markup real = preço de venda ÷ custo. As duas só aparecem quando o custo fechou E o preço de venda foi informado — nunca como zero.",
  };
}

// ---------------------------------------------------------------------------
// ABA 2 — COMPOSIÇÃO DO CUSTO
// ---------------------------------------------------------------------------

/**
 * O QUE PUXA O CUSTO DE CADA PRATO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA ABA NÃO É UMA CÓPIA DA FICHA TÉCNICA                    │
 * │                                                                      │
 * │ A ficha técnica mostra a receita: os ingredientes na ordem em que se  │
 * │ cozinha. Esta aba mostra a MESMA informação em outra ordem — do       │
 * │ insumo que mais pesa no custo para o que menos pesa — e com uma       │
 * │ coluna que a ficha não tem: quanto por cento do custo cada linha      │
 * │ representa.                                                            │
 * │                                                                      │
 * │ As duas saem do mesmo motor de custo e do mesmo recorte de cliente.   │
 * │ A diferença é a pergunta que respondem: a ficha responde "como se     │
 * │ faz", esta responde "o que torna este prato caro". A segunda é a       │
 * │ pergunta que se faz antes de mexer no preço.                          │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function folhaComposicao(linhas: readonly LinhaDeCusto[]): FolhaGrade {
  const conteudo: LinhaGrade[] = [];

  const comItens = linhas.filter((l) => l.somados.length > 0);

  if (comItens.length === 0) {
    conteudo.push(nota("Nenhum prato deste cliente tem insumo com custo calculado."));
  } else {
    for (const l of comItens) {
      const totalDoPrato = l.somados.reduce((s, i) => s + i.custo, 0);

      conteudo.push(secao(`▸ ${l.ficha.nome}`));
      conteudo.push({ tipo: "cabecalho" });

      /*
        A ORDEM É DO MAIOR PARA O MENOR.

        É a única ordenação desta planilha que não vem do cadastro, e vem da
        pergunta: numa lista ordenada por custo, a primeira linha responde
        "onde eu mexo para este prato ficar mais barato".
      */
      for (const i of [...l.somados].sort((a, b) => b.custo - a.custo)) {
        conteudo.push(
          dados({
            prato: l.ficha.nome,
            insumo: i.nome,
            etapa: ROTULO_ETAPA_PESO[i.etapa],
            quantidade: i.quantidade,
            unidade: i.unidade,
            precoUnitario: i.preco,
            custo: i.custo,
            pesoNoPrato: totalDoPrato > 0 ? (i.custo / totalDoPrato) * 100 : null,
          })
        );
      }

      conteudo.push({
        tipo: "subtotal",
        rotulo: "Subtotal dos insumos",
        celulas: {
          prato: "Subtotal dos insumos",
          custo: totalDoPrato,
          pesoNoPrato: totalDoPrato > 0 ? 100 : null,
        },
      });

      if (l.itensFora > 0) {
        conteudo.push(
          pendencia(
            `${l.itensFora} linha(s) desta ficha não entraram no subtotal. As porcentagens acima ` +
              "somam 100% do que FOI somado — e o que está fora pode ser a maior parte do custo real."
          )
        );
      }
    }
  }

  return {
    nome: ABAS_CUSTOS[1],
    titulo: "COMPOSIÇÃO DO CUSTO",
    colunas: COLUNAS_COMPOSICAO,
    linhas: conteudo,
    congelarLinhas: 3,
    mostrarCabecalho: true,
    assinatura:
      "Cada bloco traz os insumos de um prato, do que mais pesa no custo para o que menos pesa. A coluna \"Peso no custo\" reparte o subtotal do próprio prato.",
  };
}

// ---------------------------------------------------------------------------
// ABA 3 — INFORMAÇÕES
// ---------------------------------------------------------------------------

function folhaInformacoesDeCusto(
  ctx: ContextoPlanilha,
  linhas: readonly LinhaDeCusto[],
  subtitulo: string
): FolhaGrade {
  const conteudo: LinhaGrade[] = [];
  const comPreco = linhas.filter((l) => l.precoVenda !== null).length;
  const comCusto = linhas.filter((l) => l.custoReal !== null).length;
  const comIndicadores = linhas.filter((l) => l.cmv !== null).length;

  conteudo.push(secao("DE ONDE VIERAM OS DADOS"));
  conteudo.push(campo("Cliente", ctx.cliente.nomeFantasia));
  conteudo.push(campo("Identificador do cliente", ctx.cliente.id));
  conteudo.push(campo("Pratos nesta planilha", linhas.length, "numero"));
  conteudo.push(campo("Emitida em", ctx.geradoEm, "data"));

  conteudo.push(secao("COMO O CUSTO REAL É OBTIDO"));
  conteudo.push(
    nota(
      "O custo de cada prato é a soma dos insumos da ficha, na quantidade e na etapa em que ela " +
        "pesou cada um, multiplicada pelo preço do insumo para ESTE cliente. Não há custo fixo, " +
        "rateio, mão de obra ou embalagem nesta conta — porque a ficha não declarou nenhum deles."
    )
  );
  conteudo.push(
    pendencia(
      "Custo que não venha de insumo — gás, energia, mão de obra, embalagem, perda de balcão — " +
        "NÃO está somado aqui, e não tem onde ser informado ainda. Se algum deles tiver de entrar " +
        "no custo do prato, isto muda o número, e é uma decisão sua."
    )
  );

  conteudo.push(secao("O QUE É CALCULADO A PARTIR DE OUTROS DOIS"));
  conteudo.push(
    nota(
      "CMV real = (custo real ÷ preço de venda) × 100. Markup real = preço de venda ÷ custo real. " +
        "São divisões entre dois números já informados — não há escolha de método nas duas."
    )
  );
  conteudo.push(
    nota(
      "SOBRA = preço de venda − custo real. É a diferença entre o que se cobra e o que o prato " +
        "custa em insumo. Ela NÃO é lucro: nada além de insumo foi descontado."
    )
  );

  conteudo.push(secao("O QUE ESTA PLANILHA NÃO CALCULA"));
  conteudo.push(
    pendencia(
      "CMV alvo e markup alvo. O sistema tem os dois campos e nenhum valor de partida: escolher " +
        "um alvo por conta própria seria definir a sua política de preço."
    )
  );
  conteudo.push(
    pendencia(
      "Preço recomendado, preço ideal e margem ideal. Nenhum dos três aparece — nem como sugestão. " +
        "O sistema calcula o preço que um alvo EXIGIRIA, e não calcula nada enquanto o alvo " +
        "estiver vazio."
    )
  );
  conteudo.push(
    pendencia(
      "Margem de segurança. O campo existe na ficha e está vazio em todos os pratos. Enquanto " +
        "estiver vazio, o custo desta planilha é o custo medido, sem acréscimo nenhum — e é assim " +
        "que ele deve ser lido."
    )
  );

  conteudo.push(secao("SITUAÇÃO DESTE CLIENTE"));
  conteudo.push(campo("Pratos com custo fechado", comCusto, "numero"));
  conteudo.push(campo("Pratos com preço de venda informado", comPreco, "numero"));
  conteudo.push(campo("Pratos com CMV e markup calculados", comIndicadores, "numero"));

  /*
    A FRASE QUE FECHA A LEITURA.

    É o número que a Érika vai olhar primeiro ao abrir o arquivo, e ele
    precisa vir com a leitura certa colada nele. "Zero pratos com CMV" tem
    duas leituras possíveis — "o sistema não funciona" e "ainda não informei
    os preços" — e só uma delas é verdade.
  */
  conteudo.push(
    nota(
      comIndicadores === 0
        ? "Nenhum prato tem CMV ou markup calculado, porque nenhum tem preço de venda informado. O sistema não estimou preço para preencher a lacuna: preço é decisão sua. Informe o preço de venda de um prato na ficha e ele aparece calculado aqui na próxima geração."
        : `Estes ${comIndicadores} prato(s) têm CMV e markup calculados a partir do preço de venda informado.`
    )
  );

  if (linhas.some((l) => l.itensFora > 0)) {
    const afetados = linhas.filter((l) => l.itensFora > 0);
    conteudo.push(
      pendencia(
        `${afetados.length} prato(s) têm linha fora da soma do custo. Neles, o custo real, o CMV e o ` +
          "markup ficam vazios — porque o número que existe é um piso, e dividir um piso por doze " +
          "porções ou por um preço daria um indicador menor que o real, com a mesma aparência de um " +
          "indicador conferido."
      )
    );
  }

  conteudo.push(
    nota(
      "Esta planilha foi gerada pelo Sistema Érika Bruna. O arquivo é uma fotografia dos dados no " +
        "momento da emissão: alterações feitas no sistema depois disso não aparecem aqui."
    )
  );

  return {
    nome: ABAS_CUSTOS[2],
    titulo: "INFORMAÇÕES",
    colunas: COLUNAS_TEXTO,
    linhas: conteudo,
    congelarLinhas: 0,
    mostrarCabecalho: false,
    assinatura: `Gerada pelo Sistema Érika Bruna · ${subtitulo}`,
  };
}
