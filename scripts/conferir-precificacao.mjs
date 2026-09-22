/**
 * AS CONFERÊNCIAS DA PRECIFICAÇÃO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE                                                   │
 * │                                                                      │
 * │ A precificação é o módulo com mais risco do sistema, porque é o único │
 * │ em que um número ERRADO tem cara de número CERTO. Um CMV de 29% e um  │
 * │ de 45% são ambos plausíveis na tela; ninguém olha para um deles e vê   │
 * │ um defeito.                                                            │
 * │                                                                      │
 * │ Os dois riscos concretos, e os dois são silenciosos:                  │
 * │                                                                      │
 * │   1. O CUSTO DE HOJE ENTRAR NA FICHA HISTÓRICA. A ficha guardou o      │
 * │      preço do dia em que foi escrita. Se o preço subir e a ficha       │
 * │      passar a custar o preço novo sem ninguém pedir, o documento       │
 * │      histórico passa a afirmar que sempre custou aquilo.               │
 * │                                                                      │
 * │   2. UM NÚMERO DE DECISÃO EMBUTIDO. Não existe "CMV bom" neste        │
 * │      sistema. Se existisse, a Érika veria um CMV aprovado na tela por  │
 * │      meses e concluiria numa auditoria que aquele alvo foi invenção.   │
 * │                                                                      │
 * │ Há conferências para os dois abaixo.                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO CONFERE — E O QUE ELE NÃO PODE CONFERIR            │
 * │                                                                      │
 * │ Confere ARITMÉTICA e AUSÊNCIA: custo com e sem margem, CMV, markup,   │
 * │ sobra, o caminho inverso do alvo, a linha abaixo do custo, a leitura   │
 * │ de preço que não existe, a contagem do conjunto.                      │
 * │                                                                      │
 * │ Não confere METODOLOGIA, e não é omissão: o sistema não tem CMV alvo  │
 * │ nem margem padrão. Toda decisão entra por parâmetro, e é por isso que  │
 * │ as conferências abaixo DECLARAM os alvos que usam — eles são exemplos  │
 * │ de quem chama, nunca padrões do sistema.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const TSC = join(
  dirname(createRequire(import.meta.url).resolve("typescript/package.json")),
  "bin",
  "tsc"
);
const manter = process.argv.includes("--manter");
const pasta = join(tmpdir(), `erika-precificacao-${process.pid}`);

/*
  OS MÓDULOS PUROS QUE A PRECIFICAÇÃO ATRAVESSA.

  A lista é fechada de propósito. Se `precificacao.ts` passar a importar um
  arquivo novo, este script QUEBRA na compilação — o que é o comportamento
  desejado: a lista de fora precisa acompanhar, ou a conferência estaria
  testando um módulo que já não é o que roda em produção.
*/
const FONTES = [
  "precificacao.ts",
  "custos-ficha.ts",
  "custos.ts",
  "numeros.ts",
  "indicadores-comerciais.ts",
  "tipos-operacao.ts",
  // `tipos-operacao.ts` importa os dois abaixo para os tipos das perguntas do
  // diagnóstico. Sem eles na lista, a compilação quebra — e é assim mesmo: a
  // lista de fora precisa acompanhar o que o módulo arrasta.
  "perguntas.ts",
  "tipos.ts",
];

function compilar() {
  const src = join(pasta, "src", "dados");
  mkdirSync(src, { recursive: true });
  for (const f of FONTES) {
    const origem = join(raiz, "src", "lib", "dados", f);
    if (!existsSync(origem)) {
      throw new Error(`Módulo esperado não existe: src/lib/dados/${f}`);
    }
    cpSync(origem, join(src, f));
  }

  writeFileSync(
    join(pasta, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2022",
          module: "commonjs",
          moduleResolution: "node",
          strict: true,
          skipLibCheck: true,
          outDir: "js",
          rootDir: "src",
          types: [],
        },
        include: ["src/**/*.ts"],
      },
      null,
      2
    )
  );

  execFileSync(process.execPath, [TSC, "-p", "tsconfig.json"], {
    cwd: pasta,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

// ---------------------------------------------------------------------------
// As conferências
// ---------------------------------------------------------------------------

let passou = 0;
const falhas = [];

function conferir(nome, obtido, esperado) {
  if (String(obtido) === String(esperado)) {
    passou++;
    return;
  }
  falhas.push({ nome, obtido: String(obtido), esperado: String(esperado) });
}

function conferirTexto(nome, obtido, esperado) {
  if (obtido === esperado) {
    passou++;
    return;
  }
  falhas.push({ nome, obtido: JSON.stringify(obtido), esperado: JSON.stringify(esperado) });
}

async function rodar() {
  const dados = join(pasta, "js", "dados");
  const precificacao = await import(pathToFileURL(join(dados, "precificacao.js")).href);
  const indicadores = await import(
    pathToFileURL(join(dados, "indicadores-comerciais.js")).href
  );
  const custosFicha = await import(pathToFileURL(join(dados, "custos-ficha.js")).href);
  const numeros = await import(pathToFileURL(join(dados, "numeros.js")).href);

  const {
    ACAO_DA_PENDENCIA,
    ROTULO_ESTADO_COMERCIAL,
    TOM_ESTADO_COMERCIAL,
    estadoComercial,
    linhaDePrecificacao,
    resumirPrecificacao,
    somarCustos,
    somarPrecos,
    temPreco,
  } = precificacao;
  const { indicadoresDeVenda, markupEmTexto, PARAMETROS_VAZIOS } = indicadores;
  const { resolverItem } = custosFicha;
  const { numeroFixo } = numeros;

  // ── Fábricas de fixture ────────────────────────────────────────────────
  //
  // Os objetos são montados AQUI, no script, e não importados de `./mock`:
  // `tipos-operacao.ts` é tipos apenas, e a conferência precisa de dados que
  // ela mesma controla — inclusive os que o mock não tem, como uma ficha com
  // preço de venda declarado.
  //
  // O `as` no fim de cada linha é o ponto em que o script deixa de conferir
  // o TIPO e passa a conferir o VALOR: o compilador continua checando o
  // corpo destas funções contra `Ficha` e `Ingrediente`, e o `as` só afrouxa
  // a inferência de literal do `estado`. Sem ele, `situacao: "COMPLETA"`
  // viraria `string` e não casaria com `SituacaoFicha`.

  let seq = 0;
  const id = (p) => `${p}_${++seq}`;

  function insumo(precos, opcoes = {}) {
    const atual = precos.at(-1) ?? null;
    return {
      id: opcoes.id ?? id("in"),
      nome: opcoes.nome ?? "Insumo",
      categoria: opcoes.categoria ?? "Geral",
      unidade: opcoes.unidade ?? "kg",
      compra: opcoes.compra ?? null,
      transformacao: opcoes.transformacao ?? {
        bruto: null,
        limpo: null,
        preparado: null,
        observacao: "",
      },
      observacoes: "",
      precoAtual: atual,
      atualizadoEm: opcoes.atualizadoEm ?? new Date("2026-01-10T12:00:00Z"),
      fornecedor: opcoes.fornecedor ?? "",
      historico: precos.map((valor, i) => ({
        id: id("pr"),
        em: new Date(2026, 0, i + 1, 12),
        valor,
        unidade: opcoes.unidade ?? "kg",
        fornecedor: "",
        origem: "CONSULTORA",
      })),
    };
  }

  function item(ingredienteId, quantidade, unidade, precoReferencia, etapa = "COMPRA") {
    return { ingredienteId, quantidade, unidade, precoReferencia, etapa, observacao: "" };
  }

  function ficha(campos = {}) {
    return {
      id: campos.id ?? id("fi"),
      clienteId: campos.clienteId ?? "cl_teste",
      nome: campos.nome ?? "Prato",
      categoria: campos.categoria ?? "Pratos principais",
      rendimentoPorcoes:
        campos.rendimentoPorcoes === undefined ? 10 : campos.rendimentoPorcoes,
      porcaoGramas: campos.porcaoGramas ?? null,
      itens: campos.itens ?? [],
      modoPreparo: [],
      finalizacao: [],
      observacoes: "",
      situacao: campos.situacao ?? "COMPLETA",
      situacaoCalculo: campos.situacaoCalculo ?? "DISPONIVEL",
      atualizadaEm: campos.atualizadaEm ?? new Date("2026-02-01T12:00:00Z"),
      historico: campos.historico ?? [],
      precoVenda: campos.precoVenda,
      parametros: campos.parametros,
    };
  }

  const linha = (f, resolvidos) => linhaDePrecificacao(f, resolvidos);

  // ── 1. O caso de referência — e a conta que o briefing citou ───────────
  //
  // Custo R$ 8,00 e preço R$ 27,99. O briefing dava CMV 29% e markup 3,49
  // para este par: é a mesma aritmética, e ela é conferida aqui porque é o
  // único jeito de o número da tela ter uma âncora independente do código.

  const batata = insumo([10]);
  const fichaRef = ficha({
    nome: "Escondidinho",
    rendimentoPorcoes: 10,
    precoVenda: 27.99,
    itens: [item(batata.id, "0,8", "kg", 10)],
  });
  const ref = linha(fichaRef, [resolverItem(fichaRef.itens[0], batata, null)]);

  conferir("referência: custo medido", numeroFixo(ref.custo.custoTotal, 2), "8,00");
  conferir("referência: soma completa", ref.custo.completo, true);
  conferir("referência: custo por porção", numeroFixo(ref.custo.custoPorPorcao, 2), "0,80");
  conferir("referência: CMV %", numeroFixo(ref.comercial.venda.cmvPct, 1), "28,6");
  conferir("referência: markup", numeroFixo(ref.comercial.venda.markup, 2), "3,50");
  conferirTexto("referência: markup em texto", markupEmTexto(ref.comercial.venda.markup), "×3,50");
  /*
    A ficha de referência NÃO tem parâmetros comerciais declarados, e por
    isso ela tem exatamente UMA pendência — `SEM_PARAMETROS`.

    Isto esteve escrito como "zero pendências" e a conferência reprovou, com
    razão. Custo e preço existem aqui, mas margem de segurança, CMV alvo e
    markup alvo não: o sistema não os inventa, e por isso não pode dizer que
    a linha está completa. Se esta pendência sumisse, significaria que algum
    padrão entrou no cálculo — que é o defeito que este arquivo existe para
    pegar.
  */
  conferir("referência: uma pendência, e é a de método", ref.pendencias.length, 1);
  conferirTexto("referência: a pendência é a declarada", ref.pendencias[0], "SEM_PARAMETROS");
  conferirTexto("referência: estado", ref.estado, "CMV_ABAIXO_DO_CUSTO");

  // ── 2. O custo NÃO é decimal: preso ao dia em que a ficha foi escrita ──
  //
  // A batata custava R$ 10 quando a ficha foi escrita, e hoje custa R$ 13.
  // A ficha continua valendo R$ 8. Este é o defeito mais caro da área, e a
  // conferência abaixo é a que impede a regressão dele.

  const batataHoje = insumo([10, 13]);
  const resolvidoHoje = resolverItem(fichaRef.itens[0], batataHoje, null);

  conferir("histórico: preço guardado vence o de hoje", resolvidoHoje.origemDoPreco, "FICHA");
  conferir("histórico: preço efetivo é o da ficha", numeroFixo(resolvidoHoje.precoEfetivo, 2), "10,00");
  conferir("histórico: o preço de hoje aparece à parte", numeroFixo(resolvidoHoje.precoAtual, 2), "13,00");
  conferir("histórico: a ficha sinaliza a mudança", resolvidoHoje.precoMudou, true);

  const refHoje = linha(fichaRef, [resolvidoHoje]);
  conferir("histórico: o custo NÃO seguiu o preço novo", numeroFixo(refHoje.custo.custoTotal, 2), "8,00");
  conferir("histórico: o custo de hoje é só informativo", numeroFixo(resolvidoHoje.custoAtual, 2), "10,40");

  // ── 3. O caminho inverso: o preço que o alvo exige ─────────────────────
  //
  // ATENÇÃO: 30% e ×3,5 abaixo são EXEMPLOS DE CHAMADA, não padrões do
  // sistema. Sem eles informados, o preço sugerido é `null` — conferido no
  // bloco 6.

  const comAlvo = linha(
    ficha({ ...fichaRef, parametros: { cmvAlvoPct: 30, margemSegurancaPct: 5 } }),
    [resolverItem(fichaRef.itens[0], batata, null)]
  );

  conferir("margem: custo com margem", numeroFixo(comAlvo.comercial.custoComMargem, 2), "8,40");
  conferir("margem: percentual aplicado", numeroFixo(comAlvo.comercial.margemAplicadaPct, 1), "5,0");
  conferir("margem: o CMV usa o custo COM margem", numeroFixo(comAlvo.custoDaVenda, 2), "8,40");
  conferir("margem: o CMV sobe com a margem", numeroFixo(comAlvo.comercial.venda.cmvPct, 1), "30,0");
  conferir("alvo: preço que 30% de CMV exige", numeroFixo(comAlvo.comercial.precosAlvo[0].valor, 2), "28,00");
  conferirTexto("alvo: a origem do preço é declarada", comAlvo.comercial.precosAlvo[0].origem, "CMV_ALVO");

  const comMarkup = linha(
    ficha({ ...fichaRef, parametros: { markupAlvo: 3.5, margemSegurancaPct: 5 } }),
    [resolverItem(fichaRef.itens[0], batata, null)]
  );
  conferir("markup alvo: preço exigido", numeroFixo(comMarkup.comercial.precosAlvo[0].valor, 2), "29,40");
  conferirTexto("markup alvo: origem", comMarkup.comercial.precosAlvo[0].origem, "MARKUP_ALVO");

  const dois = linha(
    ficha({
      ...fichaRef,
      parametros: { cmvAlvoPct: 30, markupAlvo: 3.5, margemSegurancaPct: 5 },
    }),
    [resolverItem(fichaRef.itens[0], batata, null)]
  );
  conferir("dois alvos: os dois preços aparecem", dois.comercial.precosAlvo.length, 2);
  conferir("dois alvos: a divergência é visível", numeroFixo(dois.comercial.precosAlvo[1].valor - dois.comercial.precosAlvo[0].valor, 2), "1,40");

  // ── 4. Preço abaixo do custo — constatação, não nota ───────────────────

  const abaixo = linha(
    ficha({ ...fichaRef, precoVenda: 6 }),
    [resolverItem(fichaRef.itens[0], batata, null)]
  );
  conferirTexto("abaixo do custo: o estado acusa", abaixo.estado, "CMV_ACIMA_DO_CUSTO");
  conferir("abaixo do custo: CMV acima de 100", abaixo.comercial.venda.cmvPct > 100, true);
  conferir("abaixo do custo: a sobra é negativa", abaixo.comercial.venda.sobraReais < 0, true);
  conferir(
    "abaixo do custo: continua calculável, não vira ausência",
    abaixo.comercial.venda !== null,
    true
  );

  const exato = linha(
    ficha({ ...fichaRef, precoVenda: 8 }),
    [resolverItem(fichaRef.itens[0], batata, null)]
  );
  conferirTexto("preço igual ao custo: o estado acusa", exato.estado, "CMV_IGUAL_AO_CUSTO");
  conferir("preço igual ao custo: a sobra é zero", exato.comercial.venda.sobraReais, 0);

  // ── 5. Ausência: nenhum número inventado em lugar nenhum ───────────────

  conferirTexto("ausência: sem custo e sem preço", estadoComercial(null, null), "NAO_CALCULAVEL");
  conferirTexto("ausência: só custo", estadoComercial(8, null), "NAO_CALCULAVEL");
  conferirTexto("ausência: só preço", estadoComercial(null, 28), "NAO_CALCULAVEL");
  conferirTexto("ausência: custo zero não é custo", estadoComercial(0, 28), "NAO_CALCULAVEL");
  conferirTexto("ausência: preço zero não é preço", estadoComercial(8, 0), "NAO_CALCULAVEL");
  conferirTexto("ausência: NaN não é número", estadoComercial(Number.NaN, 28), "NAO_CALCULAVEL");
  conferirTexto("ausência: string vazia não é número", estadoComercial(8, Number.NaN), "NAO_CALCULAVEL");
  conferir("ausência: indicadores recusam custo zero", indicadoresDeVenda(0, 28), null);
  conferir("ausência: indicadores recusam preço zero", indicadoresDeVenda(8, 0), null);
  conferir("ausência: indicadores recusam Infinity", indicadoresDeVenda(8, Number.POSITIVE_INFINITY), null);

  // ── 6. Sem alvo informado, o sistema NÃO sugere preço ──────────────────

  const semAlvo = linha(fichaRef, [resolverItem(fichaRef.itens[0], batata, null)]);
  conferir("sem alvo: nenhum preço sugerido", semAlvo.comercial.precosAlvo.length, 0);
  conferir("sem alvo: a pendência é nomeada", semAlvo.pendencias.includes("SEM_PARAMETROS"), true);
  conferir(
    "sem alvo: margem de segurança também falta",
    semAlvo.comercial.pendencias.includes("margem de segurança"),
    true
  );
  conferir("sem alvo: o custo com margem é nulo", semAlvo.comercial.custoComMargem, null);
  conferir("sem alvo: o CMV não foi inflado", numeroFixo(semAlvo.custoDaVenda, 2), "8,00");

  // ── 7. Custo parcial NÃO vira custo ────────────────────────────────────
  //
  // Uma ficha com linha fora da soma tem um PISO de custo, e o real é maior.
  // Comercializar o piso daria um CMV otimista — o número que ninguém
  // confere, porque é bom.

  const mista = ficha({
    nome: "Mista",
    precoVenda: 40,
    itens: [
      item("in_com_preco", "1", "kg", 10),
      item("in_sem_preco", "1", "kg", null),
    ],
  });
  const resolvidosMistos = mista.itens.map((i) =>
    resolverItem(i, i.ingredienteId === "in_com_preco" ? insumo([10], { id: "in_com_preco" }) : null, null)
  );
  const linhaMista = linha(mista, resolvidosMistos);

  conferir("parcial: a soma não fechou", linhaMista.custo.completo, false);
  conferir("parcial: uma linha ficou fora", linhaMista.custo.itensFora, 1);
  conferir("parcial: o piso existe", numeroFixo(linhaMista.custo.custoTotal, 2), "10,00");
  conferir("parcial: o CMV NÃO foi calculado sobre o piso", linhaMista.comercial.venda, null);
  conferir("parcial: o custo da venda é nulo", linhaMista.custoDaVenda, null);
  conferir("parcial: a pendência é nomeada", linhaMista.pendencias.includes("CUSTO_PARCIAL"), true);
  conferir("parcial: o estado não afirma nada", linhaMista.estado, "NAO_CALCULAVEL");

  // ── 8. A leitura de preço aceita o que a sessão pode entregar ──────────

  conferir("preço: número serve", temPreco(27.99), true);
  conferir("preço: zero não serve", temPreco(0), false);
  conferir("preço: null não serve", temPreco(null), false);
  conferir("preço: undefined não serve", temPreco(undefined), false);
  conferir("preço: negativo não serve", temPreco(-1), false);
  conferir("preço: NaN não serve", temPreco(Number.NaN), false);

  const semPreco = linha(ficha({ ...fichaRef, precoVenda: null }), [
    resolverItem(fichaRef.itens[0], batata, null),
  ]);
  conferir("preço ausente: o custo continua sendo mostrado", numeroFixo(semPreco.custo.custoTotal, 2), "8,00");
  conferir("preço ausente: nenhum CMV", semPreco.comercial.venda, null);
  conferir("preço ausente: a pendência é nomeada", semPreco.pendencias.includes("SEM_PRECO"), true);
  conferirTexto("preço ausente: o estado é o silêncio", semPreco.estado, "NAO_CALCULAVEL");

  // ── 9. O resumo do conjunto conta, mas não tira média ──────────────────

  const conjunto = [ref, abaixo, linhaMista, semPreco];
  const resumo = resumirPrecificacao(conjunto);

  conferir("resumo: pratos", resumo.pratos, 4);
  conferir("resumo: com custo fechado", resumo.comCusto, 3);
  conferir("resumo: com custo parcial", resumo.comCustoParcial, 1);
  conferir("resumo: sem custo nenhum", resumo.semCusto, 0);
  conferir("resumo: com preço declarado", resumo.comPreco, 3);
  conferir("resumo: sem preço declarado", resumo.semPreco, 1);
  /*
    Duas, e não três. `linhaMista` tem custo PARCIAL, então o CMV dela é
    `null` de propósito — calcular sobre um piso daria um CMV otimista.
    Quem conta é `comCusto` (três, porque o piso continua sendo um piso) e
    quem NÃO conta é o comercial: para vender, o custo precisa fechar.
  */
  conferir("resumo: comercial calculável", resumo.comercialCalculavel, 2);
  conferir("resumo: abaixo do custo", resumo.abaixoDoCusto, 1);
  conferir("resumo: sem rendimento declarado", resumo.semPorcoes, 0);
  conferir(
    "resumo: não existe campo de média",
    Object.keys(resumo).some((k) => /media|medio|mediaPct|cmvMedio/i.test(k)),
    false
  );
  conferir(
    "resumo: as pendências comuns vêm ordenadas por quantidade",
    resumo.pendenciasComuns.length > 0 &&
      resumo.pendenciasComuns.every(
        (p, i, arr) => i === 0 || arr[i - 1].pratos >= p.pratos
      ),
    true
  );

  // ── 10. As somas do conjunto, e o que elas NÃO são ─────────────────────

  const custos = somarCustos(conjunto);
  conferir("soma de custos: quantos entraram", custos.pratosSomados, 3);
  conferir("soma de custos: quantos ficaram fora", custos.pratosFora, 1);
  conferir("soma de custos: total dos fechados", numeroFixo(custos.total, 2), "24,00");

  const precos = somarPrecos(conjunto);
  conferir("soma de preços: quantos têm preço", precos.pratosComPreco, 3);
  conferir("soma de preços: quantos não têm", precos.pratosSemPreco, 1);
  conferir("soma de preços: total cadastrado", numeroFixo(precos.total, 2), "73,99");

  // ── 11. Zero é uma resposta; ausente é outra ───────────────────────────

  const zerada = linha(ficha({ ...fichaRef, rendimentoPorcoes: 0, precoVenda: 27.99 }), [
    resolverItem(fichaRef.itens[0], batata, null),
  ]);
  conferir("zero porções: o custo por porção não é inventado", zerada.custo.custoPorPorcao, null);
  conferir("zero porções: a pendência NÃO aparece (foi declarado)", zerada.pendencias.includes("SEM_PORCOES"), false);

  const semRendimento = linha(ficha({ ...fichaRef, rendimentoPorcoes: null }), [
    resolverItem(fichaRef.itens[0], batata, null),
  ]);
  conferir("sem rendimento: a pendência aparece", semRendimento.pendencias.includes("SEM_PORCOES"), true);

  // ── 12. Cada código de pendência tem uma ação escrita ──────────────────
  //
  // Uma pendência sem ação é um beco sem saída na tela: a consultora lê "sem
  // parâmetros" e não sabe o que fazer a respeito.

  const codigos = [
    "SEM_CUSTO",
    "CUSTO_PARCIAL",
    "SEM_PRECO",
    "SEM_INDICADORES",
    "SEM_PORCOES",
    "SEM_PARAMETROS",
  ];
  conferir("pendências: todo código tem ação", codigos.every((c) => typeof ACAO_DA_PENDENCIA[c] === "string" && ACAO_DA_PENDENCIA[c].length > 0), true);
  conferir("pendências: todo código tem rótulo de estado comercial", Object.keys(ROTULO_ESTADO_COMERCIAL).length, 4);
  conferir("pendências: todo estado tem tom", Object.keys(TOM_ESTADO_COMERCIAL).length, 4);
  conferir(
    "pendências: o tom de 'acima do custo' NÃO é verde nem vermelho de aprovação",
    TOM_ESTADO_COMERCIAL.CMV_ABAIXO_DO_CUSTO,
    "neutro"
  );

  // ── 13. Os parâmetros vazios não contaminam ────────────────────────────

  const vazio = linha(ficha({ ...fichaRef, parametros: PARAMETROS_VAZIOS }), [
    resolverItem(fichaRef.itens[0], batata, null),
  ]);
  conferir("parâmetros vazios: o custo é o medido", numeroFixo(vazio.custoDaVenda, 2), "8,00");
  conferir("parâmetros vazios: nenhuma margem aplicada", vazio.comercial.margemAplicadaPct, null);
  conferir("parâmetros vazios: nenhum preço sugerido", vazio.comercial.precosAlvo.length, 0);
}

// ---------------------------------------------------------------------------

const inicio = Date.now();

try {
  compilar();
  await rodar();
} catch (erro) {
  console.error("\nA conferência não pôde rodar:\n");
  console.error(erro?.stderr?.toString() || erro?.message || erro);
  if (!manter) rmSync(pasta, { recursive: true, force: true });
  process.exit(2);
}

const linhas = falhas.length === 0 ? passou : passou + falhas.length;

if (falhas.length > 0) {
  console.log("Conferências da precificação\n");
  for (const f of falhas) {
    console.log(`  FALHA  ${f.nome}`);
    console.log(`         obtido:   ${f.obtido}`);
    console.log(`         esperado: ${f.esperado}`);
  }
  console.log(`\n${passou}/${linhas} passaram — ${falhas.length} falha(s).\n`);
} else {
  console.log(
    `\n  ${passou}/${linhas} conferências da precificação passaram` +
      ` (${Date.now() - inicio} ms)\n`
  );
}

if (manter) {
  console.log(`A compilação ficou em: ${pasta}\n`);
} else {
  rmSync(pasta, { recursive: true, force: true });
}

process.exit(falhas.length === 0 ? 0 : 1);

/**
 * ── OS CONTROLES NEGATIVOS, COM OS NÚMEROS QUE SAÍRAM DE VERDADE ─────────
 *
 * Uma bancada que passa não provou nada sozinha: ela precisa ser capaz de
 * FALHAR. Cada controle é UMA edição no módulo, feita numa CÓPIA descartável
 * (`/tmp`), seguida de nova execução. O número é o que saiu na execução —
 * medido, não previsto.
 *
 * Medidos em 22/set/2026, sobre a versão que passava 90/90.
 *
 *   P1. A TOLERÂNCIA DO "IGUAL AO CUSTO" VIRA ZERO. Em `estadoComercial`,
 *       `Math.abs(diferenca) < 0.005` vira `< 0`.
 *
 *       → 89/90 (1 falha). Um custo e um preço que diferem por uma fração de
 *       centavo — o mesmo número arredondado duas vezes — passam a ser
 *       anunciados como preço ABAIXO do custo. Não é inofensivo: alerta falso
 *       treina quem lê a ignorar alerta, e é aí que o alerta verdadeiro passa.
 *
 *   P2. O TOTAL PARCIAL ENTRA NO CMV. Em `linhaDePrecificacao`,
 *       `custo.completo ? custo.custoTotal : null` vira `custo.custoTotal`.
 *
 *       → 86/90 (4 falhas). É o defeito mais grave dos três, e o mais
 *       silencioso: um total parcial é um PISO (o custo real é maior), então
 *       usá-lo dá um CMV OTIMISTA — o prato parece mais saudável do que é,
 *       com a mesma aparência de número certo.
 *
 *   P3. ZERO PASSA A SER PREÇO. Em `temPreco`, `precoVenda > 0` vira
 *       `>= 0`.
 *
 *       → 89/90 (1 falha). `precoVenda: 0` não é um prato de graça: é o campo
 *       que ninguém preencheu. Contá-lo como preço mistura "de graça" com
 *       "sem preço" na mesma soma.
 *
 * Note que o controle mais destrutivo (P2) é também o mais CURTO: sai uma
 * comparação inteira. É a mesma observação registrada em `conferir-equipe.mjs`
 * e em `conferir-biblioteca.mjs`, e é o que faz destes defeitos os mais difíceis
 * de ver na revisão — todos parecem simplificações.
 */
