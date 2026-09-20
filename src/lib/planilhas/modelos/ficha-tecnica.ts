/**
 * MODELO: FICHA TÉCNICA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTE MODELO NÃO RECALCULA NADA                               │
 * │                                                                      │
 * │ O sistema já sabe calcular o custo de uma ficha: `resolverItem`      │
 * │ resolve preço e unidade item a item, `somarFicha` soma o que entrou  │
 * │ e conta o que ficou de fora, `resumoDaFicha` divide pelo rendimento,  │
 * │ e `pesarFicha` soma os pesos quando eles são somáveis.               │
 * │                                                                      │
 * │ Este arquivo CHAMA essas quatro. Não repete uma linha de aritmética,  │
 * │ não arredonda por conta própria, não decide o que entra na soma. Se   │
 * │ ele recalculasse, existiriam dois custos do mesmo prato — o da tela   │
 * │ de ficha e o da planilha — e no dia em que divergissem ninguém        │
 * │ saberia qual dos dois é o certo.                                      │
 * │                                                                      │
 * │ A dependência é essa e não a inversa: o modelo depende do motor de    │
 * │ custo, e nunca o contrário.                                          │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ A COLUNA "CORREÇÃO" — E POR QUE ELA NÃO TEM NÚMERO                    │
 * │                                                                      │
 * │ A planilha de trabalho da Érika tem uma coluna CORREÇÃO ao lado de    │
 * │ PREÇO KG, e é natural supor que ela deva trazer um número. Ela não    │
 * │ traz, e a razão é a regra que governa o sistema inteiro:              │
 * │                                                                      │
 * │ O "fator de correção" clássico é um valor de TABELA — um número que   │
 * │ valeria ANTES de medir, porque alguém determinou que a batata rende    │
 * │ 1,25. O sistema não tem essa tabela, e não deve ter: o que ele tem é  │
 * │ a relação entre os pesos que ELA mediu, que sai em                │
 * │ `relacaoCompraPorUtilizavel` — e que só existe quando existe medição. │
 * │                                                                      │
 * │ Então a coluna existe e fica VAZIA onde não há pesagem, e é isso que  │
 * │ ela significa: "aqui entraria o número que só a balança produz".      │
 * │ Preenchê-la com um valor de referência seria inventar metodologia —   │
 * │ e uma planilha que parece pronta é pior que uma planilha que diz o    │
 * │ que falta.                                                            │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ "MARG. SEG %" FICA VAZIA — E ESSA É A RESPOSTA                       │
 * │                                                                      │
 * │ O campo existe na ficha (`parametros.margemSegurancaPct`) e o briefing│
 * │ é explícito: NÃO fixar margem de segurança em 5%.                    │
 * │                                                                      │
 * │ A coluna aparece, porque a planilha dela tem a coluna, e fica vazia   │
 * │ enquanto ela não informar o número. O sistema tem o campo e não tem   │
 * │ o número — e essa frase é literalmente o que a aba INFORMAÇÕES        │
 * │ registra como pendência dela.                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import type { Ficha, Ingrediente, ItemResolvido } from "@/lib/dados";
import {
  ACAO_DO_ESTADO_ITEM,
  ROTULO_ETAPA_PESO,
  ROTULO_ESTADO_ITEM,
  ROTULO_SITUACAO_FICHA,
  dataCurta,
  lerQuantidade,
  pesarFicha,
  resolverItem,
  resumoDaFicha,
} from "@/lib/dados";
import type { ContextoPlanilha } from "../tipos";
import { ABAS_FICHA } from "../modelos";
import { recorteDoCliente } from "../relatorio";
import { indexarInsumos } from "../insumos";
import type { IndiceDeInsumos } from "../insumos";
import type { ColunaGrade, FolhaGrade, GradeDaPlanilha, LinhaGrade } from "../grade";
import { campo, dados, nota, pendencia, pixels, secao } from "../grade";
import { LARGURA } from "../estilos";

/**
 * As colunas da aba FICHAS — a grade de ingredientes.
 *
 * A ordem é a da planilha de trabalho da Érika, e ela é a ordem da CONTA:
 * primeiro o que é (ingrediente), depois com quanto se trabalha (peso líquido),
 * depois quanto custa (preço por quilo), depois o ajuste de perda (correção e
 * peso bruto), e no fim o resultado (custo). Ler da esquerda para a direita é
 * refazer a conta mentalmente, que é exatamente como se confere uma planilha.
 */
const COLUNAS_ITENS: readonly ColunaGrade[] = [
  { chave: "ingrediente", titulo: "Ingrediente", formato: "texto", largura: LARGURA.larga, larguraMinima: pixels(LARGURA.larga) },
  { chave: "pesoLiq", titulo: "Peso Líq", formato: "peso", largura: LARGURA.estreita, larguraMinima: 96 },
  { chave: "unidade", titulo: "Un", formato: "texto", largura: 8, larguraMinima: 44 },
  { chave: "precoKg", titulo: "Preço Kg", formato: "moeda", largura: LARGURA.estreita, larguraMinima: 104 },
  { chave: "correcao", titulo: "Correção", formato: "numero", largura: LARGURA.estreita, larguraMinima: 90 },
  { chave: "pesoBruto", titulo: "Peso Br.", formato: "peso", largura: LARGURA.estreita, larguraMinima: 96 },
  { chave: "custo", titulo: "Custo", formato: "moeda", largura: LARGURA.estreita, larguraMinima: 104 },
  { chave: "etapa", titulo: "Etapa", formato: "texto", largura: LARGURA.media, larguraMinima: 120 },
  { chave: "situacao", titulo: "Situação", formato: "texto", largura: LARGURA.media, larguraMinima: 130 },
];

/** As colunas das abas de texto (INFORMAÇÕES, base). */
const COLUNAS_TEXTO: readonly ColunaGrade[] = [
  { chave: "a", titulo: "", formato: "texto", largura: LARGURA.larga },
  { chave: "b", titulo: "", formato: "texto", largura: LARGURA.muitoLarga },
  { chave: "c", titulo: "", formato: "texto", largura: LARGURA.larga },
];

/** As colunas da aba BASE — um insumo por linha, com preço e rendimento. */
const COLUNAS_BASE: readonly ColunaGrade[] = [
  { chave: "insumo", titulo: "Insumo", formato: "texto", largura: LARGURA.larga, larguraMinima: pixels(LARGURA.larga) },
  { chave: "categoria", titulo: "Categoria", formato: "texto", largura: LARGURA.media, larguraMinima: 130 },
  { chave: "unidade", titulo: "Unidade", formato: "texto", largura: LARGURA.estreita, larguraMinima: 80 },
  { chave: "preco", titulo: "Preço", formato: "moeda", largura: LARGURA.estreita, larguraMinima: 104 },
  { chave: "fornecedor", titulo: "Fornecedor", formato: "texto", largura: LARGURA.media, larguraMinima: 140 },
  { chave: "origem", titulo: "Origem do preço", formato: "texto", largura: LARGURA.media, larguraMinima: 140 },
  { chave: "pesoCompra", titulo: "Peso compra", formato: "peso", largura: LARGURA.estreita, larguraMinima: 100 },
  { chave: "pesoLimpo", titulo: "Peso limpo", formato: "peso", largura: LARGURA.estreita, larguraMinima: 100 },
  { chave: "pesoPreparado", titulo: "Peso preparado", formato: "peso", largura: LARGURA.estreita, larguraMinima: 110 },
  { chave: "rendimento", titulo: "Rendimento", formato: "percentual", largura: LARGURA.estreita, larguraMinima: 100 },
  { chave: "atualizado", titulo: "Atualizado em", formato: "data", largura: LARGURA.media, larguraMinima: 110 },
];

// ---------------------------------------------------------------------------
// A grade
// ---------------------------------------------------------------------------

export function montarGradeDaFichaTecnica(ctx: ContextoPlanilha): GradeDaPlanilha {
  const { fichas } = recorteDoCliente(ctx);
  const subtitulo = subtituloDaFicha(ctx);
  const indice = indexarInsumos(ctx);

  return {
    titulo: "FICHA TÉCNICA",
    subtitulo,
    folhas: [
      folhaFichas(fichas, indice, subtitulo, ctx, ABAS_FICHA[0]),
      folhaBase(ctx, ABAS_FICHA[1], indice),
      folhaInformacoesDaFicha(ctx, fichas, subtitulo, ABAS_FICHA[2]),
    ],
  };
}

function subtituloDaFicha(ctx: ContextoPlanilha): string {
  const partes = [ctx.cliente.nomeFantasia];
  if (ctx.consultoria) partes.push(ctx.consultoria.titulo);
  partes.push(`gerado em ${dataCurta(ctx.geradoEm)}`);
  return partes.join(" · ");
}

/**
 * O índice de insumos vem de `../insumos` — o mesmo que o modelo de custos
 * usa. Ele nasceu aqui dentro e mudou de casa quando o segundo modelo passou
 * a precisar da mesma tradução de id para nome e preço: duas cópias do
 * cruzamento divergem, e a que divergisse mostraria o preço de outro cliente
 * com a mesma cara de preço certo.
 */

// ---------------------------------------------------------------------------
// ABA 1 — FICHAS
// ---------------------------------------------------------------------------

/**
 * TODAS as fichas do cliente numa folha só, uma atrás da outra.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE TUDO NUMA ABA, E NÃO UMA ABA POR PRATO                       │
 * │                                                                      │
 * │ Uma aba por prato parece organizado, e é o pior dos dois mundos: com  │
 * │ dez pratos o arquivo abre com onze abas, e comparar o custo de duas   │
 * │ receitas — a pergunta que a ficha técnica existe para responder —     │
 * │ exige trocar de aba. No Excel, comparar é ter as duas à vista.        │
 * │                                                                      │
 * │ O que separa uma ficha da outra é a FAIXA DE BLOCO, que sobrevive à   │
 * │ rolagem e ao print. É a solução que a própria planilha de trabalho    │
 * │ usa: marcação de seção, não compartimentação.                         │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function folhaFichas(
  fichas: readonly Ficha[],
  indice: IndiceDeInsumos,
  subtitulo: string,
  ctx: ContextoPlanilha,
  nome: string
): FolhaGrade {
  const linhas: LinhaGrade[] = [];

  if (fichas.length === 0) {
    linhas.push(
      nota(
        "Nenhuma ficha técnica registrada para este cliente. A ficha nasce no sistema, na tela de " +
          "Fichas — ela não é criada aqui."
      )
    );
  } else {
    fichas.forEach((ficha, i) => {
      if (i > 0) linhas.push(nota(""));
      escreverBlocoDaFicha(linhas, ficha, indice);
    });
  }

  return {
    nome,
    titulo: "FICHA TÉCNICA",
    colunas: COLUNAS_ITENS,
    linhas,
    congelarLinhas: 3,
    mostrarCabecalho: false,
    assinatura:
      "O custo de cada linha é calculado a partir do preço do insumo para este cliente e dos pesos medidos na cozinha. Linha em que falta preço ou pesagem não entra na soma — e aparece com o motivo, em vez de entrar como zero.",
  };
}

/**
 * O bloco de UMA ficha: cabeçalho de campos, grade de ingredientes, total.
 *
 * A ordem é a da planilha de trabalho, e não uma ordem inventada: identifica o
 * prato, diz para quantas porções ele rende e quanto custa, e só então desce
 * para os ingredientes. Quem abre a folha sabe de que prato se trata antes de
 * ler a primeira linha de insumo.
 */
function escreverBlocoDaFicha(
  linhas: LinhaGrade[],
  ficha: Ficha,
  indice: IndiceDeInsumos
): void {
  // Os itens resolvidos VÊM do motor de custo — não são recalculados aqui.
  const resolvidos = ficha.itens.map((item) =>
    resolverItem(item, indice.porId(item.ingredienteId), indice.doCliente(item.ingredienteId))
  );

  const resumo = resumoDaFicha(resolvidos, ficha);
  const peso = pesarFicha(resolvidos);

  // ── A faixa que identifica o prato ────────────────────────────────────
  linhas.push(secao(`▸ ${ficha.nome}`));

  // ── O cabeçalho da ficha: prato, cliente, rendimento, custo ───────────
  linhas.push(campo("PRATO", ficha.nome));
  linhas.push(campo("CATEGORIA", ficha.categoria));
  linhas.push(campo("SITUAÇÃO", ROTULO_SITUACAO_FICHA[ficha.situacao]));
  linhas.push(campo("ATUALIZADA EM", ficha.atualizadaEm, "data"));

  linhas.push(campo("RENDIMENTO (PORÇÕES)", ficha.rendimentoPorcoes, "numero"));
  linhas.push(
    campo(
      "KG POR PORÇÃO",
      ficha.porcaoGramas !== null ? ficha.porcaoGramas / 1000 : null,
      "peso"
    )
  );

  /*
    O CUSTO TOTAL.

    `completo` é falso quando alguma linha ficou fora da soma. Nesse caso o
    número NÃO é o custo da receita — é um piso — e escrevê-lo como custo total
    seria o erro mais caro que esta planilha pode cometer. Por isso o valor só
    entra quando a soma está fechada; senão a célula fica vazia e a linha de
    observação ao lado diz o que falta.
  */
  linhas.push(campo("CUSTO TOTAL", resumo.completo ? resumo.custoTotal : null, "moeda"));
  linhas.push(campo("CUSTO POR PORÇÃO", resumo.custoPorPorcao, "moeda"));
  linhas.push(campo("UNI POR PORÇÃO", ficha.porcaoGramas, "numero"));

  /*
    A MARGEM DE SEGURANÇA — sem número, porque o número é dela.

    `margemSegurancaPct` existe no cadastro e está vazio por padrão. O sistema
    tem o campo e não tem o valor; é literalmente o que a aba INFORMAÇÕES lista
    como pendência. Preencher com 5% seria inventar metodologia.
  */
  linhas.push(
    campo(
      "MARG. SEG %",
      ficha.parametros?.margemSegurancaPct ?? null,
      "percentual"
    )
  );
  linhas.push(campo("PREÇO DE VENDA", ficha.precoVenda ?? null, "moeda"));

  // ── A grade de ingredientes ───────────────────────────────────────────
  linhas.push(secao("INGREDIENTES"));
  linhas.push({ tipo: "cabecalho" });

  if (resolvidos.length === 0) {
    linhas.push(nota("Esta ficha ainda não tem ingrediente cadastrado."));
  } else {
    for (const r of resolvidos) {
      linhas.push({
        tipo: "dados",
        celulas: {
          ingrediente: r.ingrediente?.nome ?? r.item.ingredienteId,
          pesoLiq: r.quantidade,
          unidade: r.item.unidade,
          /*
            O preço por quilo é o custo na etapa em que a quantidade foi pesada
            — e não o preço de compra. Mostrar o preço da compra ao lado de um
            peso preparado daria um custo que não bate com a multiplicação, e a
            planilha pareceria errada sem estar.
          */
          precoKg: precoDaEtapa(r),
          /*
            A CORREÇÃO FICA VAZIA QUANDO NÃO HÁ MEDIÇÃO.

            `relacaoCompraPorUtilizavel` é a relação entre dois pesos que ela
            informou — não o fator de correção de tabela. Quando os dois pesos
            existem, o número aparece; quando não, a célula fica vazia, e o
            vazio quer dizer "só a balança produz este número".
          */
          correcao: r.transformacao.indicadores.relacaoCompraPorUtilizavel,
          /*
            O PESO BRUTO: o peso de compra que corresponde à quantidade usada.
            É `quantidade × relação` — a mesma conta que a coluna ao lado
            descreve. Sem medição, fica vazio.
          */
          pesoBruto: pesoBrutoDaQuantidade(r),
          custo: r.custo,
          etapa: ROTULO_ETAPA_PESO[r.item.etapa],
          situacao:
            r.estado === "OK"
              ? ROTULO_ESTADO_ITEM.OK
              : `${ROTULO_ESTADO_ITEM[r.estado]} — ${ACAO_DO_ESTADO_ITEM[r.estado]}`,
        },
      });
    }

    /*
      A LINHA DE SUBTOTAL DO CUSTO.

      Existe mesmo quando há uma linha só, e existe SEPARADA do total do bloco:
      ela soma os INSUMOS, e o CUSTO TOTAL lá em cima é o custo da receita. Os
      dois números coincidem hoje — e continuarão coincidindo enquanto não
      houver custo que não venha de insumo. Ainda assim são duas linhas, porque
      no dia em que houver, ninguém vai ter de lembrar de separá-las.
    */
    linhas.push({
      tipo: "subtotal",
      rotulo: "Subtotal dos insumos",
      celulas: {
        ingrediente: "Subtotal dos insumos",
        custo: resumo.itensSomados > 0 ? resumo.custoTotal : null,
      },
    });

    /*
      O PESO DA RECEITA — e o motivo de ele não aparecer sempre.

      `pesarFicha` só devolve total quando todas as linhas somáveis estão na
      MESMA etapa e na MESMA unidade. Somar o peso de compra da mandioca com o
      peso preparado do frango daria um número que não corresponde a nada que
      exista na cozinha. Quando não dá, a planilha diz o que falta em vez de
      mostrar um total que não existe.
    */
    if (peso.total !== null) {
      linhas.push(campo("PESO DA RECEITA", peso.total, "peso"));
      linhas.push(
        nota(
          `Peso somado na etapa "${peso.etapa ? ROTULO_ETAPA_PESO[peso.etapa] : "—"}", a partir de ${peso.linhasSomadas} linha(s). Exclui as linhas sem quantidade numérica.`
        )
      );
    } else if (peso.etapasEncontradas.length > 1) {
      linhas.push(
        campo(
          "PESO DA RECEITA",
          `não somável — etapas distintas: ${peso.etapasEncontradas
            .map((e) => ROTULO_ETAPA_PESO[e])
            .join(", ")}`
        )
      );
    }

    /*
      O QUE FICOU FORA DA SOMA.

      Em vermelho, e não em nota de rodapé cinza. É a parte do arquivo que
      protege a Érika de mandar um documento que PARECE ter o custo da receita
      e tem apenas um piso.
    */
    if (resumo.itensFora > 0) {
      linhas.push(
        pendencia(
          `${resumo.itensFora} de ${resolvidos.length} linha(s) ficaram fora da soma do custo. São elas: ` +
            resumo.motivos
              .map((m) => `${m.quantidade}× ${ROTULO_ESTADO_ITEM[m.estado]}`)
              .join("; ") +
            ". O custo total acima é um PISO, e não o custo da receita, enquanto estas linhas não tiverem preço ou pesagem."
        )
      );
    } else {
      linhas.push(nota("Todas as linhas entraram na soma."));
    }
  }

  // ── O preparo ─────────────────────────────────────────────────────────
  if (ficha.modoPreparo.length > 0) {
    linhas.push(secao("MODO DE PREPARO"));
    ficha.modoPreparo.forEach((passo, i) => {
      linhas.push(nota(`${String(i + 1).padStart(2, "0")}   ${passo}`));
    });
  }
  if (ficha.finalizacao.length > 0) {
    linhas.push(secao("FINALIZAÇÃO"));
    ficha.finalizacao.forEach((passo, i) => {
      linhas.push(nota(`${String(i + 1).padStart(2, "0")}   ${passo}`));
    });
  }
  if (ficha.observacoes) {
    linhas.push(secao("OBSERVAÇÕES"));
    linhas.push(nota(ficha.observacoes));
  }
}

// ---------------------------------------------------------------------------
// Auxiliares de leitura do item resolvido
// ---------------------------------------------------------------------------

/**
 * O preço por unidade, na ETAPA em que a quantidade foi pesada.
 *
 * `custos` traz os três preços do mesmo insumo (compra, limpo, preparado). Usar
 * o da compra para uma quantidade pesada como preparada daria um número menor
 * que o real, com aparência perfeitamente normal.
 */
function precoDaEtapa(r: ItemResolvido): number | null {
  switch (r.item.etapa) {
    case "COMPRA":
      return r.custos.compra;
    case "LIMPO":
      return r.custos.limpo;
    case "PREPARADO":
      return r.custos.preparado;
  }
}

/**
 * O peso de compra correspondente à quantidade usada.
 *
 * É a coluna "Peso Br." da planilha de trabalho: quanto de compra foi preciso
 * para obter aquele peso utilizado. Só existe quando a relação entre os dois
 * pesos foi MEDIDA — sem pesagem, a célula fica vazia, e o vazio quer dizer
 * "só a balança produz este número".
 */
function pesoBrutoDaQuantidade(r: ItemResolvido): number | null {
  const relacao = r.transformacao.indicadores.relacaoCompraPorUtilizavel;
  const usado = r.quantidade ?? lerQuantidade(r.item.quantidade);
  if (relacao === null || usado === null) return null;
  return usado * relacao;
}

// ---------------------------------------------------------------------------
// ABA 2 — BASE DE INSUMOS
// ---------------------------------------------------------------------------

/**
 * Os insumos deste cliente, com preço, fornecedor e os pesos medidos.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA ABA É LEITURA, E NÃO UM LUGAR DE EDITAR PREÇO            │
 * │                                                                      │
 * │ A tentação é fazer dela uma planilha de preenchimento: ela digita o    │
 * │ preço, salva, e o sistema importa. Não.                                │
 * │                                                                      │
 * │ Preço tem UM lugar de escrita no sistema — a tela de ingrediente, onde │
 * │ existe data, histórico e fornecedor junto do número. Aceitar preço     │
 * │ vindo de arquivo criaria uma segunda porta para o mesmo dado, e a      │
 * │ segunda porta é a que não registra quem mudou o quê.                  │
 * │                                                                      │
 * │ Esta aba existe pelo outro motivo, e ele é bom: é a lista que dá para  │
 * │ levar para a feira, para o fornecedor ou para uma reunião — e é onde   │
 * │ ela vê, de uma vez, o que ainda está sem preço.                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
function folhaBase(ctx: ContextoPlanilha, nome: string, insumos: IndiceDeInsumos): FolhaGrade {
  const linhas: LinhaGrade[] = [];

  /*
    SÓ O QUE ESTE CLIENTE USA.

    `listarIngredientesDoCliente` devolve a biblioteca inteira, ordenada com os
    insumos usados primeiro. A biblioteca inteira é útil na tela (para escolher
    um insumo novo); numa planilha de um cliente, ela vira ruído — e o arquivo
    diria que o Empório usa trinta insumos quando ele usa seis.
  */
  const usados = insumos.emUso;

  if (usados.length === 0) {
    linhas.push(nota("Este cliente ainda não tem insumo cadastrado em nenhuma ficha."));
  } else {
    linhas.push({ tipo: "cabecalho" });
    for (const l of usados) {
      const t = l.ingrediente.transformacao;
      linhas.push(
        dados({
          insumo: l.ingrediente.nome,
          categoria: l.ingrediente.categoria,
          unidade: l.ingrediente.unidade,
          preco: l.precoAtual,
          fornecedor: l.fornecedor || "—",
          origem: l.origemDoPreco === "CLIENTE" ? "preço deste cliente" : "preço de referência",
          pesoCompra: t.bruto?.peso ?? null,
          pesoLimpo: t.limpo?.peso ?? null,
          pesoPreparado: t.preparado?.peso ?? null,
          // O rendimento vem do motor de custo: é o peso final sobre o peso de
          // compra, medido — não uma tabela de coeficientes.
          rendimento: rendimentoMedido(l.ingrediente),
          atualizado: l.atualizadoEm,
        })
      );
    }
  }

  return {
    nome,
    titulo: "BASE DE INSUMOS",
    colunas: COLUNAS_BASE,
    linhas,
    congelarLinhas: 3,
    mostrarCabecalho: true,
    assinatura:
      "Esta aba é para consulta e para levar à feira. Preço se altera na tela de Ingredientes do sistema, onde a mudança fica registrada com data e fornecedor.",
  };
}

/**
 * O rendimento medido de um insumo, em percentual.
 *
 * Delega para `derivarTransformacao` — a mesma função que a tela usa. A conta
 * não é feita aqui: se fosse, o número desta coluna poderia divergir do que a
 * calculadora do sistema mostra para o mesmo insumo.
 */
function rendimentoMedido(ingrediente: Ingrediente): number | null {
  const t = ingrediente.transformacao;
  const bruto = t.bruto?.peso ?? null;
  const final = t.preparado?.peso ?? t.limpo?.peso ?? null;
  if (bruto === null || final === null || bruto <= 0) return null;
  return (final / bruto) * 100;
}

// ---------------------------------------------------------------------------
// ABA 3 — INFORMAÇÕES
// ---------------------------------------------------------------------------

function folhaInformacoesDaFicha(
  ctx: ContextoPlanilha,
  fichas: readonly Ficha[],
  subtitulo: string,
  nome: string
): FolhaGrade {
  const linhas: LinhaGrade[] = [];
  const comPrecoDeVenda = fichas.filter((f) => (f.precoVenda ?? null) !== null).length;

  linhas.push(secao("DE ONDE VIERAM OS DADOS"));
  linhas.push(campo("Cliente", ctx.cliente.nomeFantasia));
  linhas.push(campo("Identificador do cliente", ctx.cliente.id));
  linhas.push(campo("Fichas incluídas", fichas.length, "numero"));
  linhas.push(campo("Insumos deste cliente", (ctx.ingredientesDoCliente ?? []).filter((l) => l.usosNoCliente > 0).length, "numero"));
  linhas.push(campo("Emitida em", ctx.geradoEm, "data"));

  linhas.push(secao("COMO O CUSTO É CALCULADO"));
  linhas.push(
    nota(
      "O custo de cada linha é a quantidade usada multiplicada pelo preço do insumo na etapa em " +
        "que essa quantidade foi pesada. O preço vem, nesta ordem: o preço deste cliente, o preço " +
        "de referência gravado na ficha no dia em que ela foi escrita, e o preço de referência da " +
        "biblioteca."
    )
  );
  linhas.push(
    nota(
      "O custo por porção só aparece quando TODAS as linhas entraram na soma E o rendimento foi " +
        "declarado. Dividir um piso por doze porções daria um número menor que o custo real da " +
        "porção — com a mesma cara de um custo verificado."
    )
  );
  linhas.push(
    nota(
      "O peso da receita só é somado quando todas as linhas pesáveis estão na MESMA etapa e na " +
        "MESMA unidade. Juntar peso de compra com peso preparado daria um número que não " +
        "corresponde a nada que exista na cozinha."
    )
  );

  linhas.push(secao("O QUE ESTA PLANILHA NÃO CALCULA"));
  linhas.push(
    pendencia(
      "\"MARG. SEG %\" fica vazia enquanto você não informar a margem. O sistema tem o campo e não " +
        "tem o número — nenhum valor de partida foi escolhido por você, e inventar um seria " +
        "inventar a sua metodologia."
    )
  );
  linhas.push(
    pendencia(
      "A coluna \"CORREÇÃO\" não traz um fator de tabela. Ela traz a relação entre o peso de compra " +
        "e o peso final que VOCÊ mediu — e fica vazia nos insumos que ainda não foram pesados. É " +
        "por isso que ela não pode ser preenchida à mão."
    )
  );
  linhas.push(
    nota(
      "CMV real, markup real e preço recomendado não aparecem nesta planilha. Eles existem na " +
        "planilha de Custos e precificação — e lá também só aparecem quando existe preço de venda " +
        "informado."
    )
  );

  linhas.push(secao("O QUE AINDA DEPENDE DE VOCÊ"));
  linhas.push(pendencia("Qual margem de segurança usar. Esta é a única que trava números nesta planilha."));
  linhas.push(
    pendencia(
      "Se a margem muda por tipo de prato ou de serviço. Enquanto não muda, um número só atende a " +
        "todos."
    )
  );

  linhas.push(secao("SITUAÇÃO DESTE CLIENTE"));
  linhas.push(campo("Fichas com preço de venda informado", comPrecoDeVenda, "numero"));
  linhas.push(
    nota(
      comPrecoDeVenda === 0
        ? "Nenhuma ficha deste cliente tem preço de venda informado. É o estado normal — e é o que faz a planilha de custos mostrar as colunas de CMV e markup vazias, em vez de zero."
        : "As fichas com preço de venda informado aparecem com CMV e markup preenchidos na planilha de custos."
    )
  );

  linhas.push(
    nota(
      "Esta planilha foi gerada pelo Sistema Érika Bruna. O arquivo é uma fotografia dos dados no " +
        "momento da emissão: alterações feitas no sistema depois disso não aparecem aqui."
    )
  );

  return {
    nome,
    titulo: "INFORMAÇÕES",
    colunas: COLUNAS_TEXTO,
    linhas,
    congelarLinhas: 0,
    mostrarCabecalho: false,
    assinatura: `Gerada pelo Sistema Érika Bruna · ${subtitulo}`,
  };
}
