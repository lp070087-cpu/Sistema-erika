/**
 * AS CONFERÊNCIAS DO CARDÁPIO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE                                                   │
 * │                                                                      │
 * │ O cardápio tem um risco que a precificação não tem: ele é a única     │
 * │ parte do sistema que VAI PARA A MESA DO CLIENTE. Um custo errado numa │
 * │ tela é um número errado; um preço errado num cardápio é um preço       │
 * │ errado sendo cobrado, e um prato anunciado que talvez não exista.      │
 * │                                                                      │
 * │ Três defeitos concretos, e os três são silenciosos:                    │
 * │                                                                      │
 * │   1. O ITEM VIRAR UM SEGUNDO CADASTRO. Se o cardápio guardasse nome,   │
 * │      preço e custo próprios, corrigir a ficha não corrigiria o         │
 * │      cardápio — e o preço antigo continuaria na mesa, com a mesma      │
 * │      aparência do novo.                                                │
 * │                                                                      │
 * │   2. A FICHA DE OUTRO CLIENTE ENTRAR. O insumo tem preço por cliente,  │
 * │      então a ficha de outro cliente custa outro valor. O custo sairia  │
 * │      plausível e seria de outro restaurante.                           │
 * │                                                                      │
 * │   3. A CÓPIA COMPARTILHAR AS SEÇÕES. Duplicar o cardápio e editar uma  │
 * │      seção na cópia mexeria na original, em silêncio.                  │
 * │                                                                      │
 * │ Há conferências para os três abaixo.                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO CONFERE — E O QUE ELE NÃO PODE CONFERIR            │
 * │                                                                      │
 * │ Confere ESTRUTURA: o item aponta para ficha, o custo sai da ficha, a   │
 * │ ordem das seções e dos itens, a pendência por item, a repetição do     │
 * │ mesmo prato em duas seções, a cópia com ids novos, o arquivamento sem  │
 * │ apagar, e a soma que NÃO é faturamento.                               │
 * │                                                                      │
 * │ Não confere METODOLOGIA, e não é omissão: não existe "cardápio         │
 * │ equilibrado", "quantidade ideal de opções por seção" nem nota. Essas   │
 * │ decisões não foram tomadas, e por isso não há o que conferir — o que   │
 * │ a bancada prova é que o módulo NÃO as inventou.                       │
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
const pasta = join(tmpdir(), `erika-cardapios-${process.pid}`);

/*
  OS MÓDULOS PUROS QUE O CARDÁPIO ATRAVESSA.

  A lista é fechada de propósito, como na precificação: se `cardapios.ts`
  passar a importar um arquivo novo, este script QUEBRA na compilação — e é o
  que se quer. Uma lista que acompanhasse sozinha estaria conferindo um módulo
  que talvez já não seja o que roda.

  `precificacao.ts` está aqui porque o cardápio NÃO recalcula nada: ele chama
  a mesma linha. Esta é a prova de que não há uma segunda conta de custo no
  sistema — se houvesse, ela moraria neste arquivo e não em `precificacao.ts`.
*/
const FONTES = [
  "cardapios.ts",
  /*
    `demonstracao.ts` está aqui porque é ELE que guarda o estado da sessão —
    criar, arquivar, excluir, duplicar. Uma bancada que só conferisse as
    funções puras de `cardapios.ts` deixaria de fora justamente a parte com
    risco: a sobreposição da sessão, o arquivamento e a cópia.

    A mesma decisão já vale em `conferir-arquivamento.mjs`, que também
    compila este arquivo. Ele é um módulo de navegador (`"use client"`), mas
    não tem nenhuma dependência de React: importa tipos e nada mais, então
    roda no Node sem andaime.
  */
  "demonstracao.ts",
  "precificacao.ts",
  "custos-ficha.ts",
  "custos.ts",
  "numeros.ts",
  "indicadores-comerciais.ts",
  "tipos-operacao.ts",
  /*
    `equipe.ts` entrou pelo mesmo caminho que `cardapios.ts` entrou: o store
    passou a importar os tipos de pessoa. E o mesmo estrago do outro caso
    aconteceria aqui — sem os TIPOS, todo `(p) =>` que percorre uma pessoa
    vira `any` implícito, e a compilação falha em quarenta linhas que apontam
    para o lugar errado em vez de falhar na que está faltando.
  */
  "equipe.ts",
  // E `biblioteca.ts` pelo mesmo caminho: o store importa os tipos de material.
  "biblioteca.ts",
  // `tipos-operacao.ts` arrasta os dois abaixo para os tipos do diagnóstico.
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
  const cardapios = await import(pathToFileURL(join(dados, "cardapios.js")).href);
  const sessao = await import(pathToFileURL(join(dados, "demonstracao.js")).href);
  const custosFicha = await import(pathToFileURL(join(dados, "custos-ficha.js")).href);
  const numeros = await import(pathToFileURL(join(dados, "numeros.js")).href);

  const {
    ACAO_DA_PENDENCIA_DO_CARDAPIO,
    ROTULO_SITUACAO_CARDAPIO,
    cardapiosVisiveis,
    contarItens,
    montarLinhasDoCardapio,
    pratosDistintos,
    resumirCardapio,
    somarPrecosDoCardapio,
  } = cardapios;

  const {
    acervoDeCardapios,
    acrescentarSecao,
    adicionarItem,
    alterarItemDoCardapio,
    arquivarCardapio,
    cardapioArquivado,
    cardapioDaSessaoNova,
    cardapioFoiExcluido,
    criarCardapio,
    definirSituacaoDoCardapio,
    desarquivarCardapio,
    duplicarCardapio,
    excluirCardapio,
    limparDemonstracao,
    moverItem,
    moverSecao,
    removerItem,
    removerSecao,
    renomearSecao,
    salvarCardapio,
    secoesDoCardapio,
    trocarItemDeSecao,
  } = sessao;

  const { resolverItem } = custosFicha;
  const { numeroFixo } = numeros;

  // ── Fábricas de fixture ────────────────────────────────────────────────
  //
  // Montadas aqui, e não importadas de `./mock`: a conferência precisa de
  // dados que ela mesma controla — inclusive do caso que o mock não tem, que
  // é a ficha de OUTRO cliente dentro do cardápio.

  let seq = 0;
  const id = (p) => `${p}_${++seq}`;

  function insumo(precos, opcoes = {}) {
    const atual = precos.at(-1) ?? null;
    return {
      id: opcoes.id ?? id("in"),
      nome: opcoes.nome ?? "Insumo",
      categoria: opcoes.categoria ?? "Geral",
      unidade: opcoes.unidade ?? "kg",
      compra: null,
      transformacao: { bruto: null, limpo: null, preparado: null, observacao: "" },
      observacoes: "",
      precoAtual: atual,
      atualizadoEm: new Date("2026-01-10T12:00:00Z"),
      fornecedor: "",
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

  function itemDeFicha(ingredienteId, quantidade, unidade, precoReferencia, etapa = "COMPRA") {
    return { ingredienteId, quantidade, unidade, precoReferencia, etapa, observacao: "" };
  }

  function ficha(campos = {}) {
    return {
      id: campos.id ?? id("fi"),
      clienteId: campos.clienteId ?? "cl_a",
      nome: campos.nome ?? "Prato",
      categoria: campos.categoria ?? "Pratos principais",
      rendimentoPorcoes:
        campos.rendimentoPorcoes === undefined ? 10 : campos.rendimentoPorcoes,
      porcaoGramas: campos.porcaoGramas ?? null,
      itens: campos.itens ?? [],
      modoPreparo: [],
      finalizacao: [],
      observacoes: "",
      situacao: "COMPLETA",
      situacaoCalculo: "DISPONIVEL",
      atualizadaEm: campos.atualizadaEm ?? new Date("2026-02-01T12:00:00Z"),
      historico: [],
      precoVenda: campos.precoVenda,
      parametros: campos.parametros,
    };
  }

  function secao(nome, ordem = null, campos = {}) {
    return { id: campos.id ?? id("sec"), nome, ordem, descricao: campos.descricao ?? "" };
  }

  function itemDeCardapio(fichaId, categoriaId, ordem = null, campos = {}) {
    return {
      id: campos.id ?? id("itc"),
      fichaId,
      categoriaId,
      ordem,
      nomeNoCardapio: campos.nomeNoCardapio ?? null,
      descricao: campos.descricao ?? "",
      destaque: campos.destaque ?? "",
    };
  }

  function cardapio(campos = {}) {
    return {
      id: campos.id ?? id("ca"),
      clienteId: campos.clienteId ?? "cl_a",
      consultoriaId: campos.consultoriaId ?? null,
      nome: campos.nome ?? "Cardápio",
      descricao: campos.descricao ?? "",
      situacao: campos.situacao ?? "RASCUNHO",
      categorias: campos.categorias ?? [],
      itens: campos.itens ?? [],
      criadoEm: campos.criadoEm ?? new Date("2026-02-10T12:00:00Z"),
      atualizadoEm: campos.atualizadoEm ?? new Date("2026-02-10T12:00:00Z"),
      historico: campos.historico ?? [],
    };
  }

  /*
    O RESOLVEDOR — o mesmo de produção, e não um atalho.

    `resolverItem` é quem decide a precedência entre o preço guardado na ficha,
    o preço do cliente e o preço da biblioteca. Montar as linhas resolvidas à
    mão aqui faria a bancada conferir um caminho que o sistema não percorre.
  */
  const mapaDeInsumos = new Map();
  const resolver = (f) => f.itens.map((i) => resolverItem(i, mapaDeInsumos.get(i.ingredienteId) ?? null, null));

  const batata = insumo([10], { nome: "Batata" });
  const carne = insumo([40], { nome: "Carne" });
  const queijo = insumo([55], { nome: "Queijo" });
  mapaDeInsumos.set(batata.id, batata);
  mapaDeInsumos.set(carne.id, carne);
  mapaDeInsumos.set(queijo.id, queijo);

  const escondidinho = ficha({
    nome: "Escondidinho",
    precoVenda: 27.99,
    itens: [itemDeFicha(batata.id, "0,8", "kg", 10)],
  });
  const costela = ficha({
    id: id("fi"),
    nome: "Costela",
    precoVenda: 89.9,
    rendimentoPorcoes: 4,
    itens: [itemDeFicha(carne.id, "1,000", "kg", 40)],
  });
  const semPreco = ficha({ id: id("fi"), nome: "Farofa", rendimentoPorcoes: 6, itens: [] });

  const entradas = secao("Entradas", 0);
  const principais = secao("Pratos principais", 1);

  // ── 1. O cardápio NÃO guarda o prato: guarda a ficha ──────────────────
  //
  // O teste central do módulo. O item tem ficha, seção e ordem — e NADA de
  // nome de prato, preço ou custo. Se algum desses aparecesse no item, esta
  // conferência reprovaria, porque é exatamente ela que separa "cardápio" de
  // "segundo cadastro do mesmo prato".

  const carteira = cardapio({
    nome: "Cardápio de verão",
    categorias: [entradas, principais],
    itens: [itemDeCardapio(costela.id, principais.id, 0)],
  });

  const camposDoItem = Object.keys(carteira.itens[0]).sort().join(",");
  conferirTexto(
    "o item guarda só ficha, seção, ordem e apresentação",
    camposDoItem,
    "categoriaId,descricao,destaque,fichaId,id,nomeNoCardapio,ordem"
  );

  const linhas = montarLinhasDoCardapio({
    cardapio: carteira,
    fichas: [escondidinho, costela, semPreco],
    resolver,
  });

  conferir("o cardápio monta uma linha por item", linhas.length, 1);
  conferirTexto("a linha aponta para a ficha", linhas[0].ficha.id, costela.id);
  conferirTexto("a linha sabe a seção", linhas[0].secao, "Pratos principais");

  // O custo da costela: 1 kg × R$ 40 = R$ 40,00. Rendimento 4 porções.
  conferir("o custo vem da ficha, calculado", numeroFixo(linhas[0].linha.custo.custoTotal, 2), "40,00");
  conferir("o custo por porção vem da ficha", numeroFixo(linhas[0].linha.custo.custoPorPorcao, 2), "10,00");
  conferir("o CMV é o da mesma linha da precificação", numeroFixo(linhas[0].linha.comercial.venda.cmvPct, 1), "44,5");
  conferirTexto("o estado comercial é o da precificação", linhas[0].estado, "CMV_ABAIXO_DO_CUSTO");

  // ── 2. O preço NÃO é copiado: mudar a ficha muda o cardápio ───────────
  //
  // A prova por EXECUÇÃO do defeito nº 1. A mesma ficha, com o preço
  // alterado, produz um cardápio diferente — sem que o cardápio tenha sido
  // tocado. Se o item guardasse o preço, este número não mudaria.

  const costelaMaisCara = ficha({
    ...costela,
    precoVenda: 99.9,
  });

  const linhasDepois = montarLinhasDoCardapio({
    cardapio: carteira,
    fichas: [escondidinho, costelaMaisCara, semPreco],
    resolver,
  });

  conferir(
    "o preço novo da ficha aparece no cardápio sem tocar no cardápio",
    numeroFixo(linhasDepois[0].linha.comercial.venda.cmvPct, 1),
    "40,0"
  );
  conferir(
    "o cardápio antigo continua com o preço antigo",
    numeroFixo(linhas[0].linha.comercial.venda.cmvPct, 1),
    "44,5"
  );

  // ── 3. A mesma ficha em duas seções: DOIS anúncios, UM prato ──────────

  const sugestoes = secao("Sugestões do chef", 2);
  const doisAnuncios = cardapio({
    nome: "Cardápio com repetição",
    categorias: [entradas, principais, sugestoes],
    itens: [
      itemDeCardapio(costela.id, principais.id, 0),
      itemDeCardapio(costela.id, sugestoes.id, 0, { nomeNoCardapio: "Costela da casa" }),
    ],
  });

  conferir("duas seções: dois itens", contarItens(doisAnuncios), 2);
  conferir("duas seções: UM prato distinto", pratosDistintos(doisAnuncios), 1);

  const linhasDois = montarLinhasDoCardapio({
    cardapio: doisAnuncios,
    fichas: [escondidinho, costela, semPreco],
    resolver,
  });

  conferir("o mesmo prato aparece nas duas seções", linhasDois.length, 2);
  conferirTexto("a primeira seção", linhasDois[0].secao, "Pratos principais");
  conferirTexto("a segunda seção", linhasDois[1].secao, "Sugestões do chef");
  conferirTexto("o nome do anúncio vence o nome da ficha", linhasDois[1].nome, "Costela da casa");
  conferirTexto("sem anúncio, o nome é o da ficha", linhasDois[0].nome, "Costela");
  conferir(
    "as duas linhas custam o mesmo, porque a ficha é uma só",
    numeroFixo(linhasDois[0].linha.custo.custoTotal, 2) === numeroFixo(linhasDois[1].linha.custo.custoTotal, 2),
    true
  );

  // ── 4. A ficha de OUTRO cliente é marcada, e não calculada ────────────
  //
  // O defeito nº 2. A ficha existe, o item aponta para ela, e o custo sairia
  // perfeitamente plausível — com o preço de insumo de outro restaurante.

  const fichaDeOutro = ficha({ id: id("fi"), clienteId: "cl_b", nome: "Prato do outro" });
  const misturado = cardapio({
    clienteId: "cl_a",
    categorias: [principais],
    itens: [itemDeCardapio(fichaDeOutro.id, principais.id, 0)],
  });

  const linhasMisturadas = montarLinhasDoCardapio({
    cardapio: misturado,
    fichas: [fichaDeOutro],
    resolver,
  });

  conferirTexto(
    "a ficha de outro cliente é acusada",
    linhasMisturadas[0].ajustes.includes("FICHA_DE_OUTRO_CLIENTE"),
    true
  );
  conferir(
    "e o custo dela NÃO é calculado",
    linhasMisturadas[0].linha,
    null
  );
  conferirTexto("o estado fica não calculável", linhasMisturadas[0].estado, "NAO_CALCULAVEL");

  // ── 5. A ficha que não existe mais ────────────────────────────────────
  //
  // O item continua na lista, com nome de reserva, e não some: um item que
  // desaparece sem explicação é pior do que um item marcado.

  const comFantasma = cardapio({
    categorias: [principais],
    itens: [itemDeCardapio("fi_que_nao_existe", principais.id, 0)],
  });

  const linhasFantasma = montarLinhasDoCardapio({
    cardapio: comFantasma,
    fichas: [costela],
    resolver,
  });

  conferir("a ficha inexistente vira linha, e não some", linhasFantasma.length, 1);
  conferirTexto("e é acusada", linhasFantasma[0].ajustes.includes("FICHA_INEXISTENTE"), true);
  conferirTexto("com nome de reserva", linhasFantasma[0].nome, "Prato removido");
  conferir("e sem custo nenhum", linhasFantasma[0].linha, null);

  // ── 6. O item numa seção que não existe ───────────────────────────────

  const orfao = cardapio({
    categorias: [principais],
    itens: [itemDeCardapio(costela.id, "sec_que_nao_existe", 0)],
  });

  const linhasOrfas = montarLinhasDoCardapio({
    cardapio: orfao,
    fichas: [costela],
    resolver,
  });

  conferirTexto("o item órfão é acusado", linhasOrfas[0].ajustes.includes("ITEM_ORFAO"), true);
  conferirTexto("e a seção dele é dita removida", linhasOrfas[0].secao, "Seção removida");

  /*
    A ordem importa: o item órfão vai para o FIM, e não para o começo.

    `null` é "ainda não decidi onde isto fica". Se ele valesse zero, o primeiro
    item de uma seção recém-criada pareceria posicionado de propósito — e a
    ordem da página seria uma decisão que ninguém tomou.
  */
  const ordemComOrfao = cardapio({
    categorias: [principais],
    itens: [
      itemDeCardapio(costela.id, "sec_que_nao_existe", 0),
      itemDeCardapio(escondidinho.id, principais.id, 0),
    ],
  });

  const linhasOrdem = montarLinhasDoCardapio({
    cardapio: ordemComOrfao,
    fichas: [costela, escondidinho],
    resolver,
  });

  conferirTexto("o item sem seção vai para o fim", linhasOrdem[0].ficha.id, escondidinho.id);
  conferirTexto("e o órfão fica por último", linhasOrdem[1].ficha.id, costela.id);

  // ── 7. A ordem das SEÇÕES: `ordem` manda, `null` vai para o fim ───────

  const foraDeOrdem = cardapio({
    categorias: [
      secao("Terceira", 2, { id: "s3" }),
      secao("Primeira", 0, { id: "s1" }),
      secao("Sem posição", null, { id: "sn" }),
      secao("Segunda", 1, { id: "s2" }),
    ],
    itens: [],
  });

  const linhasVazias = montarLinhasDoCardapio({
    cardapio: foraDeOrdem,
    fichas: [],
    resolver,
  });
  conferir("cardápio sem itens monta zero linhas", linhasVazias.length, 0);

  // A ordem das seções é observada pelos itens, que é quem a carrega.
  const comItensEmTodas = cardapio({
    categorias: foraDeOrdem.categorias,
    itens: [
      itemDeCardapio(costela.id, "s3", 0),
      itemDeCardapio(costela.id, "s1", 0),
      itemDeCardapio(costela.id, "sn", 0),
      itemDeCardapio(costela.id, "s2", 0),
    ],
  });

  const ordenadas = montarLinhasDoCardapio({
    cardapio: comItensEmTodas,
    fichas: [costela],
    resolver,
  });

  conferirTexto("seção de ordem 0 vem primeiro", ordenadas[0].secao, "Primeira");
  conferirTexto("seção de ordem 1 vem depois", ordenadas[1].secao, "Segunda");
  conferirTexto("seção de ordem 2 vem depois", ordenadas[2].secao, "Terceira");
  conferirTexto("seção sem posição vem por último", ordenadas[3].secao, "Sem posição");

  // ── 8. A ordem DENTRO da seção ────────────────────────────────────────

  const dentroDaSecao = cardapio({
    categorias: [principais],
    itens: [
      itemDeCardapio(escondidinho.id, principais.id, 2),
      itemDeCardapio(costela.id, principais.id, 0),
      itemDeCardapio(semPreco.id, principais.id, null),
      itemDeCardapio(semPreco.id, principais.id, 1),
    ],
  });

  const linhasDentro = montarLinhasDoCardapio({
    cardapio: dentroDaSecao,
    fichas: [escondidinho, costela, semPreco],
    resolver,
  });

  conferirTexto("ordem 0 primeiro", linhasDentro[0].ficha.id, costela.id);
  conferirTexto("ordem 1 depois", linhasDentro[1].ficha.id, semPreco.id);
  conferirTexto("ordem 2 depois", linhasDentro[2].ficha.id, escondidinho.id);
  conferirTexto("ordem nula por último", linhasDentro[3].ficha.id, semPreco.id);

  /*
    `ordem: 1` e `ordem: null` para a MESMA ficha, e as duas aparecem: são
    duas linhas, e a segunda é a que não foi posicionada. Isto é de propósito —
    a bancada prova que `null` e `0` não colapsam no mesmo valor.
  */

  // ── 9. Zero é uma posição decidida; nulo não é ────────────────────────
  //
  // A conferência que separa os dois, e ela é sobre a ORDEM e não sobre o
  // conteúdo: o mesmo item, com `0` e com `null`, ocupa lugares diferentes.

  const posicionado = cardapio({
    categorias: [principais],
    itens: [
      itemDeCardapio(semPreco.id, principais.id, null),
      itemDeCardapio(costela.id, principais.id, 0),
    ],
  });

  const linhasPosicao = montarLinhasDoCardapio({
    cardapio: posicionado,
    fichas: [costela, semPreco],
    resolver,
  });

  conferirTexto("o item com ordem 0 vem antes do sem ordem", linhasPosicao[0].ficha.id, costela.id);
  conferirTexto("o sem ordem fica depois", linhasPosicao[1].ficha.id, semPreco.id);

  // ── 10. As pendências — cada uma com o item que a causou ──────────────
  //
  // O defeito nº 3 do briefing é o oposto: pendência sem endereço não é
  // acionável. "3 itens sem preço" faz procurar quais; "Farofa sem preço" faz
  // abrir a ficha.

  const comProblemas = cardapio({
    categorias: [principais],
    itens: [
      itemDeCardapio(costela.id, principais.id, 0),
      itemDeCardapio(semPreco.id, principais.id, 1),
      itemDeCardapio("fi_fantasma", principais.id, 2),
    ],
  });

  const linhasProblemas = montarLinhasDoCardapio({
    cardapio: comProblemas,
    fichas: [costela, semPreco],
    resolver,
  });

  const resumoProblemas = resumirCardapio(comProblemas, linhasProblemas);
  const pendenciasDe = (p) => resumoProblemas.ocorrencias.filter((o) => o.pendencia === p);

  conferir("sem preço: o item é apontado", pendenciasDe("SEM_PRECO").length, 1);
  conferirTexto("sem preço: e é o item certo", pendenciasDe("SEM_PRECO")[0].onde, "Farofa");
  conferirTexto(
    "a pendência carrega o id da linha, para a tela poder agir",
    pendenciasDe("SEM_PRECO")[0].itemId,
    linhasProblemas[1].item.id
  );
  conferir("ficha inexistente: apontada", pendenciasDe("FICHA_INEXISTENTE").length, 1);
  conferirTexto(
    "ficha inexistente: com o nome de reserva",
    pendenciasDe("FICHA_INEXISTENTE")[0].onde,
    "Prato removido"
  );
  conferir("sem custo: a farofa não tem linha somável", pendenciasDe("SEM_CUSTO").length, 1);
  conferir("a costela não entra em nenhuma pendência", linhasProblemas[0].ajustes.length, 0);

  /*
    A pendência vem com AÇÃO, e a ação é uma frase — do mesmo mapa que a tela
    usa. Uma pendência sem ação seria uma constatação, e o módulo existe para
    que cada constatação tenha um próximo passo.
  */
  conferirTexto(
    "toda pendência tem uma ação escrita",
    typeof ACAO_DA_PENDENCIA_DO_CARDAPIO.SEM_PRECO,
    "string"
  );
  conferir(
    "todas as pendências têm ação",
    Object.values(ACAO_DA_PENDENCIA_DO_CARDAPIO).every((v) => typeof v === "string" && v.length > 0),
    true
  );

  // ── 11. O cardápio SEM itens e SEM seções ─────────────────────────────

  const vazio = cardapio({ nome: "Recém-criado" });
  const resumoVazio = resumirCardapio(vazio, []);

  conferir("cardápio vazio: zero itens", resumoVazio.itens, 0);
  conferir("cardápio vazio: zero seções", resumoVazio.secoes, 0);
  conferir("cardápio vazio: acusa a falta de seção", pendenciasDe2(resumoVazio, "SEM_CATEGORIA"), 1);
  conferir("cardápio vazio: acusa a falta de itens", pendenciasDe2(resumoVazio, "SEM_ITENS"), 1);

  function pendenciasDe2(resumo, p) {
    return resumo.ocorrencias.filter((o) => o.pendencia === p).length;
  }

  // ── 12. A soma dos preços — e o que ela NÃO é ─────────────────────────
  //
  // Soma de preço de venda de prato NÃO é faturamento: ninguém comeu nada.
  // A conferência prova que o módulo soma só o que está DECLARADO, e que ele
  // não inventa um item médio.

  const doisPrecos = cardapio({
    categorias: [principais],
    itens: [itemDeCardapio(costela.id, principais.id, 0), itemDeCardapio(escondidinho.id, principais.id, 1)],
  });

  const linhasDoisPrecos = montarLinhasDoCardapio({
    cardapio: doisPrecos,
    fichas: [costela, escondidinho],
    resolver,
  });

  // 89,90 + 27,99 = 117,89
  const soma = somarPrecosDoCardapio(linhasDoisPrecos);
  conferir("soma dos preços declarados", numeroFixo(soma.total, 2), "117,89");
  conferir("quantos entraram na soma", soma.itens, 2);

  const comSemPreco = cardapio({
    categorias: [principais],
    itens: [
      itemDeCardapio(costela.id, principais.id, 0),
      itemDeCardapio(semPreco.id, principais.id, 1),
    ],
  });

  const linhasComSemPreco = montarLinhasDoCardapio({
    cardapio: comSemPreco,
    fichas: [costela, semPreco],
    resolver,
  });

  const somaParcial = somarPrecosDoCardapio(linhasComSemPreco);
  conferir("o item sem preço fica FORA da soma, e não entra como zero", numeroFixo(somaParcial.total, 2), "89,90");
  conferir("e a contagem diz que só um entrou", somaParcial.itens, 1);
  conferir(
    "o total não foi dividido pelos que faltam — não há média",
    numeroFixo(somaParcial.total / linhasComSemPreco.length, 2) !== numeroFixo(somaParcial.total, 2),
    true
  );

  // ── 13. Arquivar NÃO é excluir ────────────────────────────────────────
  //
  // O mesmo vocabulário do insumo, e aqui com mais peso: um cardápio
  // publicado foi impresso e foi para a mesa. Arquivar tira das listas e
  // preserva o registro; excluir apaga.

  const rascunho = cardapio({ nome: "Rascunho", situacao: "RASCUNHO" });
  const publicado = cardapio({ nome: "Publicado", situacao: "PUBLICADO" });
  const arquivado = cardapio({ nome: "Arquivado", situacao: "ARQUIVADO" });

  const lista = [rascunho, publicado, arquivado];

  const visiveis = cardapiosVisiveis(lista);
  conferir("arquivado sai da lista", visiveis.length, 2);
  conferirTexto("e os dois que ficam são os certos", visiveis.map((c) => c.nome).sort().join("|"), "Publicado|Rascunho");

  const comArquivados = cardapiosVisiveis(lista, { incluirArquivados: true });
  conferir("o arquivado continua existindo e pode ser visto", comArquivados.length, 3);

  conferirTexto("o rótulo do arquivado não é 'excluído'", ROTULO_SITUACAO_CARDAPIO.ARQUIVADO, "Arquivado");
  conferirTexto("o rótulo do rascunho fala de montagem", ROTULO_SITUACAO_CARDAPIO.RASCUNHO, "Em montagem");

  // ── 14. A lista respeita a ordem de atualização ───────────────────────

  const antigo = cardapio({ nome: "Antigo", atualizadoEm: new Date("2026-01-01T12:00:00Z") });
  const recente = cardapio({ nome: "Recente", atualizadoEm: new Date("2026-03-01T12:00:00Z") });

  const ordenados = cardapiosVisiveis([antigo, recente]);
  conferirTexto("o mais recente vem primeiro", ordenados[0].nome, "Recente");
  conferirTexto("o mais antigo depois", ordenados[1].nome, "Antigo");

  // ── 15. O resumo conta o que a tela mostra, e nada além ───────────────

  const resumoDois = resumirCardapio(doisPrecos, linhasDoisPrecos);
  conferir("resumo: itens", resumoDois.itens, 2);
  conferir("resumo: pratos distintos", resumoDois.pratosDistintos, 2);
  conferir("resumo: seções", resumoDois.secoes, 1);
  conferir("resumo: com preço", resumoDois.comPreco, 2);
  conferir("resumo: sem preço", resumoDois.semPreco, 0);
  conferir("resumo: com custo fechado", resumoDois.comCustoFechado, 2);
  conferir("resumo: comercial calculável", resumoDois.comercialCalculavel, 2);
  conferir("resumo: nenhum abaixo do custo", resumoDois.abaixoDoCusto, 0);
  conferir("resumo: nenhuma ocorrência", resumoDois.ocorrencias.length, 0);
  conferir(
    "resumo: a soma é a mesma da função de soma",
    numeroFixo(resumoDois.somaDosPrecos, 2),
    numeroFixo(soma.total, 2)
  );

  /*
    A conferência que impede o "CMV médio" de aparecer por acidente.

    A lista é escrita À MÃO, e não derivada de `Object.keys(resumo)` — se ela
    fosse derivada, qualquer campo novo entraria sozinho e a conferência nunca
    reprovaria. É justamente o campo novo que se quer ver passar por aqui.

    Ordem alfabética, como o `sort()` produz.
  */
  const camposDoResumo = Object.keys(resumoDois).sort().join(",");
  conferirTexto(
    "o resumo não tem média, nem nota, nem veredito",
    camposDoResumo,
    "abaixoDoCusto,comCustoFechado,comPreco,comercialCalculavel,itens,itensSomados,ocorrencias,pratosDistintos,secoes,semCusto,semPreco,somaDosPrecos"
  );
  /*
    A outra metade da mesma conferência: nenhum dos campos acima pode ter nome
    que sugira média, nota ou veredito. O nome é onde a invenção entra primeiro
    — `cmvMedio` seria escrito antes de alguém calcular um.
  */
  conferir(
    "nenhum campo do resumo tem nome de média, alvo ou nota",
    /media|alvo|nota|score|indice|ideal|melhor|pior/i.test(camposDoResumo),
    false
  );

  // ── 16. Duplicar: seções com ids novos, e as MESMAS fichas ────────────
  //
  // O defeito nº 3. A cópia precisa de ids de seção próprios, ou editar uma
  // seção na cópia mexeria na original. E os itens precisam apontar para as
  // MESMAS fichas — é isso que faz corrigir o preço na ficha corrigir os dois
  // cardápios de uma vez.

  const original = cardapio({
    nome: "Verão",
    situacao: "PUBLICADO",
    categorias: [secao("Entradas", 0, { id: "sec_a" }), secao("Principais", 1, { id: "sec_b" })],
    itens: [
      itemDeCardapio(costela.id, "sec_a", 0, { id: "itc_x" }),
      itemDeCardapio(escondidinho.id, "sec_b", 0, { id: "itc_y" }),
    ],
    historico: [{ em: new Date("2026-02-01T12:00:00Z"), oQue: "Cardápio criado.", quem: "sessão" }],
  });

  /*
    A função de ids é INJETADA, e não inventada em `cardapios.ts`: os ids de
    seção também precisam do prefixo de demonstração, e a decisão de como um
    id de demonstração se parece mora num lugar só — `idDaSessao`. Aqui ela é
    substituída por um contador determinístico, porque a bancada precisa
    conferir VALOR, e não o formato do id.

    A ASSINATURA É `(especie, quantidade)`, e a espécie NÃO é decorativa: os
    ids que ela gera entram no `conferir` abaixo, e um contador que ignorasse
    a espécie deixaria de provar que seções e itens recebem ids de espécies
    diferentes. Foi assim que a bancada quebrou quando a injeção passou a
    levar a espécie — e o defeito, aqui, seria um falso verde.
  */
  let sequencia = 0;
  const montarIds = (especie, quantidade) =>
    Array.from({ length: quantidade }, () => `${especie}_nova_${++sequencia}`);

  const duplicado = duplicarCardapio(original, "ca_novo", montarIds);

  conferir("a cópia é um cardápio novo", duplicado.id, "ca_novo");
  conferirTexto("a cópia diz que é cópia", duplicado.nome, "Verão (cópia)");
  conferirTexto("a cópia nasce em rascunho, e não publicada", duplicado.situacao, "RASCUNHO");
  conferir("a cópia leva as duas seções", duplicado.categorias.length, 2);
  conferir("a cópia leva os dois itens", duplicado.itens.length, 2);

  conferir(
    "nenhuma seção da cópia tem id da original",
    duplicado.categorias.every((c) => c.id !== "sec_a" && c.id !== "sec_b"),
    true
  );
  conferir(
    "nenhum item da cópia tem id da original",
    duplicado.itens.every((i) => i.id !== "itc_x" && i.id !== "itc_y"),
    true
  );
  conferir(
    "os itens da cópia apontam para as seções NOVAS",
    duplicado.itens.every((i) => duplicado.categorias.some((c) => c.id === i.categoriaId)),
    true
  );
  conferir(
    "as seções da cópia têm os MESMOS nomes",
    duplicado.categorias.map((c) => c.nome).join("|"),
    "Entradas|Principais"
  );
  /*
    A ESPÉCIE CHEGA ATÉ A FUNÇÃO DE IDS. O `montarIds` acima prefixa pelo que
    recebe, então este `conferir` prova a assinatura inteira: se a injeção
    voltasse a passar só a quantidade, a espécie viria `undefined`, o prefixo
    sairia `undefined_nova_1`, e a conferência pegaria — em vez de a cópia
    nascer com ids vazios, que foi o que aconteceu quando a assinatura mudou.
  */
  conferir(
    "as seções da cópia receberam ids de espécie 'se'",
    duplicado.categorias.every((c) => c.id.startsWith("se_nova_")),
    true
  );
  conferir(
    "os itens da cópia receberam ids de espécie 'it'",
    duplicado.itens.every((i) => i.id.startsWith("it_nova_")),
    true
  );

  /*
    A prova por EXECUÇÃO do defeito nº 3: mexer na cópia não mexe na original.

    O array de seções da cópia é OUTRO array, com OUTROS objetos. Sem isto, um
    `categorias: origem.categorias` no spread bastaria para as duas listas
    compartilharem a mesma seção — e o `conferir` abaixo pegaria.
  */
  const originalIntacto = original.categorias.map((c) => c.nome).join("|");

  conferir(
    "o array de seções da cópia não é o mesmo objeto da original",
    duplicado.categorias === original.categorias,
    false
  );
  conferir(
    "nem a primeira seção é o mesmo objeto",
    duplicado.categorias[0] === original.categorias[0],
    false
  );

  duplicado.categorias[0].nome = "Mexido na cópia";
  conferir(
    "mexer na cópia não muda a original",
    original.categorias.map((c) => c.nome).join("|"),
    originalIntacto
  );

  /*
    As FICHAS são as mesmas — e isso é o oposto do que `duplicarFicha` faz com
    os itens dela. Duplicar uma ficha copia as linhas uma a uma, porque as
    duas vão divergir. Duplicar um cardápio NÃO copia prato nenhum: os dois
    cardápios anunciam o mesmo prato, e é por isso que corrigir o preço na
    ficha corrige os dois.
  */
  conferir(
    "os itens da cópia apontam para as MESMAS fichas",
    duplicado.itens.map((i) => i.fichaId).sort().join("|"),
    original.itens.map((i) => i.fichaId).sort().join("|")
  );

  conferir("a cópia NÃO herda o histórico da original", duplicado.historico.length, 1);
  conferirTexto(
    "a cópia diz de onde veio",
    duplicado.historico[0].oQue,
    'Criado como cópia de "Verão".'
  );

  // ── 17. O que o módulo NÃO decidiu ────────────────────────────────────
  //
  // A ausência é conferida como AUSÊNCIA. Se um dia aparecer um "índice de
  // equilíbrio" ou uma "nota do cardápio", estas duas linhas reprovam — e a
  // pergunta é feita antes de o número chegar à tela.

  const exportados = Object.keys(cardapios).sort().join(",");
  conferir(
    "não existe nota nem índice no módulo",
    /nota|indice|score|equilibrio|ideal/i.test(exportados),
    false
  );
  conferir(
    "não existe alvo de quantidade de itens por seção",
    /minimo|maximo|recomendad/i.test(exportados),
    false
  );

  // ── 18. O acervo da sessão: criar, arquivar, excluir ──────────────────
  //
  // Aqui a bancada sai das funções puras e exercita o ESTADO. É a parte com
  // risco real, porque é ela que decide o que a tela mostra — e um arquivado
  // que volta, ou um excluído que reaparece, são defeitos silenciosos: a lista
  // parece certa e não é.

  limparDemonstracao();

  const doCenario = cardapio({ id: "ca_cenario", nome: "Do cenário" });

  conferir("o acervo começa com o que veio do cenário", acervoDeCardapios([doCenario]).length, 1);

  const recemCriado = cardapio({ id: "ca_novo_1", nome: "Recém-criado" });
  criarCardapio(recemCriado);

  const acervo1 = acervoDeCardapios([doCenario]);
  conferir("o criado na sessão entra no acervo", acervo1.length, 2);
  conferir(
    "e é reconhecido como da sessão",
    cardapioDaSessaoNova("ca_novo_1"),
    true
  );
  conferir(
    "o do cenário NÃO é da sessão",
    cardapioDaSessaoNova("ca_cenario"),
    false
  );

  /*
    ┌────────────────────────────────────────────────────────────────────┐
    │ A SESSÃO NÃO GUARDA O QUE O CENÁRIO NÃO TEM                        │
    │                                                                    │
    │ `acervoDeCardapios` recebe a lista do CENÁRIO como argumento, e não │
    │ lê um repositório. É por isso que este teste pode passar `[doCenario]`│
    │ e obter exatamente dois: um do cenário, um da sessão. O acervo não   │
    │ é um segundo banco — é a sobreposição do que foi mexido.            │
    └────────────────────────────────────────────────────────────────────┘
  */

  // Arquivar tira das listas SEM apagar. As duas perguntas são diferentes.
  arquivarCardapio("ca_cenario");
  conferir("arquivado é reconhecido como arquivado", cardapioArquivado("ca_cenario"), true);
  conferir("e não foi excluído", cardapioFoiExcluido("ca_cenario"), false);
  conferirTexto(
    "o arquivado sai da situação original e vira ARQUIVADO",
    acervoDeCardapios([doCenario]).find((c) => c.id === "ca_cenario").situacao,
    "ARQUIVADO"
  );
  conferir(
    "o registro continua no acervo — arquivar não apaga",
    acervoDeCardapios([doCenario]).some((c) => c.id === "ca_cenario"),
    true
  );

  desarquivarCardapio("ca_cenario");
  conferir("desarquivado volta a circular", cardapioArquivado("ca_cenario"), false);
  conferirTexto(
    "e a situação original volta",
    acervoDeCardapios([doCenario]).find((c) => c.id === "ca_cenario").situacao,
    "RASCUNHO"
  );

  /*
    O caso que o desarquivamento por `Set` sozinho erraria: um cardápio do
    CENÁRIO que já estava arquivado no cenário. Tirá-lo do `Set` da sessão não
    pode "ressuscitar" algo que a sessão nunca arquivou.
  */
  const jaArquivadoNoCenario = cardapio({ id: "ca_ja_arquivado", nome: "Arquivado no cenário", situacao: "ARQUIVADO" });
  desarquivarCardapio("ca_ja_arquivado");
  conferirTexto(
    "desarquivar algo que a sessão não arquivou não o ressuscita",
    acervoDeCardapios([jaArquivadoNoCenario]).find((c) => c.id === "ca_ja_arquivado").situacao,
    "ARQUIVADO"
  );

  // Excluir tira do acervo — e é a única ação sem volta.
  excluirCardapio("ca_novo_1");
  conferir("excluído é reconhecido como excluído", cardapioFoiExcluido("ca_novo_1"), true);
  conferir(
    "e sai do acervo",
    acervoDeCardapios([doCenario]).some((c) => c.id === "ca_novo_1"),
    false
  );
  conferir("o acervo volta a ter só o do cenário", acervoDeCardapios([doCenario]).length, 1);

  /*
    Salvar um cardápio do CENÁRIO entra na sobreposição; salvar um da SESSÃO
    vai direto no registro. As duas rotas precisam funcionar, porque a tela
    usa as duas — e se a segunda gravasse na sobreposição, a exclusão
    procuraria no lugar errado e deixaria o cardápio para trás.
  */
  salvarCardapio("ca_cenario", { nome: "Renomeado na sessão" });
  conferirTexto(
    "salvar um do cenário aparece no acervo",
    acervoDeCardapios([doCenario]).find((c) => c.id === "ca_cenario").nome,
    "Renomeado na sessão"
  );
  conferirTexto(
    "e o cenário não é alterado — a sobreposição é só da leitura",
    doCenario.nome,
    "Do cenário"
  );

  const daSessaoParaEditar = cardapio({ id: "ca_novo_2", nome: "Editável" });
  criarCardapio(daSessaoParaEditar);
  salvarCardapio("ca_novo_2", { nome: "Editado na sessão" });
  conferirTexto(
    "salvar um da sessão grava no próprio registro",
    acervoDeCardapios([doCenario]).find((c) => c.id === "ca_novo_2").nome,
    "Editado na sessão"
  );
  excluirCardapio("ca_novo_2");
  conferir(
    "e a exclusão alcança o item editado",
    acervoDeCardapios([doCenario]).some((c) => c.id === "ca_novo_2"),
    false
  );

  // ── 19. O acervo é ordenado pelo mais recente ─────────────────────────

  limparDemonstracao();
  criarCardapio(cardapio({ id: "ca_velho", nome: "Velho", atualizadoEm: new Date("2026-01-01T12:00:00Z") }));
  criarCardapio(cardapio({ id: "ca_novo3", nome: "Novo", atualizadoEm: new Date("2026-03-01T12:00:00Z") }));

  const ordenado = acervoDeCardapios([]);
  conferirTexto("o mais recente primeiro no acervo", ordenado[0].nome, "Novo");
  conferirTexto("o mais antigo depois", ordenado[1].nome, "Velho");

  limparDemonstracao();

  // ── 20. A MONTAGEM: criar seção, pôr prato, mover, renomear, tirar ─────
  //
  // Estas funções existem para que a TELA não monte um `Partial<Cardapio>` à
  // mão. O que se prova aqui é o que a tela não teria como garantir sozinha:
  // que toda edição sobe `atualizadoEm`, escreve UMA linha de histórico, e
  // devolve `null` quando o clique não mudaria nada.

  const montagem = cardapio({
    id: "ca_mont",
    categorias: [],
    itens: [],
    historico: [{ em: new Date("2026-01-01T00:00:00Z"), oQue: "Cardápio criado.", quem: "x" }],
  });

  const historicoAntes = montagem.historico.length;

  /*
    ── A ORDEM VISÍVEL, E NÃO A DO ARRAY ─────────────────────────────────
    As funções de montagem escrevem `ordem`; elas NÃO reordenam o array
    `itens` e não devem — o array é a ordem de cadastro, e quem sabe a ordem
    da página é a leitura que a própria página faz. Uma conferência que
    olhasse `.itens.map(i => i.id)` estaria conferindo a ordem de cadastro e
    chamando isso de "a ordem depois de mover": verde sempre, inclusive com o
    botão quebrado.

    `visiveis` mostra o que o cliente veria — as fichas na ordem das linhas.
  */
  const ordemVisivel = (c, fichas) =>
    montarLinhasDoCardapio({ cardapio: c, fichas, resolver }).map((l) => l.item.fichaId);
  const fichasDe = (...ids) => ids.map((id) => ficha({ id }));

  /*
    SEÇÃO SEM NOME É RECUSADA — e `null` é a recusa.
    Uma seção em branco viraria um cabeçalho vazio no menu do cliente, e a
    validação de tela é a que some quando alguém chamar isto de outro lugar.
  */
  conferir("seção sem nome é recusada", acrescentarSecao(montagem, "se_1", "   ", ""), null);

  const comEntradas = aplicar(montagem, acrescentarSecao(montagem, "se_1", "Entradas", ""));
  conferir("a seção criada entra", comEntradas.categorias.length, 1);
  conferirTexto("com o nome que foi dado", comEntradas.categorias[0].nome, "Entradas");
  conferir(
    "toda edição sobe o atualizadoEm",
    comEntradas.atualizadoEm.getTime() > montagem.atualizadoEm.getTime(),
    true
  );
  conferir(
    "e acrescenta UMA linha ao histórico",
    comEntradas.historico.length,
    historicoAntes + 1
  );

  const comPratos = aplicar(
    comEntradas,
    acrescentarSecao(comEntradas, "se_2", "Pratos", "")
  );
  const comSeccoes = aplicar(comPratos, adicionarItem(comPratos, "it_1", "fi_a", "se_1"));
  conferir("o prato entra na seção pedida", comSeccoes.itens.length, 1);
  conferirTexto("apontando para a ficha que já existe", comSeccoes.itens[0].fichaId, "fi_a");

  /*
    ── A REGRA CENTRAL DO MÓDULO, PROVADA PELO QUE **NÃO** EXISTE ─────────
    `adicionarItem` não aceita nome, preço nem insumo: só um `fichaId`. A
    conferência abaixo trava o conjunto de chaves do item — acrescentar um
    `nome` ou um `preco` a `ItemDeCardapio` faria esta linha falhar, e com ela
    a possibilidade de o cardápio virar um segundo cadastro de prato.
  */
  conferir(
    "o item guarda só chaves de apresentação, nunca de cadastro",
    Object.keys(comSeccoes.itens[0]).sort(),
    ["categoriaId", "descricao", "destaque", "fichaId", "id", "nomeNoCardapio", "ordem"]
  );

  /* Item em seção que não existe é recusado — órfão não se cria de propósito. */
  conferir(
    "prato em seção inexistente é recusado",
    adicionarItem(comSeccoes, "it_x", "fi_a", "se_nao_existe"),
    null
  );

  /*
    A MESMA FICHA DUAS VEZES É USO LEGÍTIMO.
    O mesmo prato no almoço e no jantar é decisão comercial; recusá-la
    obrigaria a criar uma ficha duplicada só para anunciar duas vezes.
  */
  const duasVezes = aplicar(comSeccoes, adicionarItem(comSeccoes, "it_2", "fi_a", "se_2"));
  conferir("a mesma ficha pode entrar duas vezes", duasVezes.itens.length, 2);
  conferir(
    "— e são dois itens distintos",
    new Set(duasVezes.itens.map((i) => i.id)).size,
    2
  );

  // ── Mover seções, com `null` virando ordem decidida ────────────────────

  const tresSecoes = aplicar(
    duasVezes,
    acrescentarSecao(duasVezes, "se_3", "Sobremesas", "")
  );

  /*
    As três seções nascem com `ordem: null`? Não: `acrescentarSecao` grava a
    ordem explícita (0, 1, 2). O `null` vem do cenário, quando a seção foi
    criada por outro caminho. Os dois casos são montados aqui para que a
    ordenação seja conferida nos dois.
  */
  const mistas = {
    ...tresSecoes,
    categorias: tresSecoes.categorias.map((c, i) => (i === 0 ? { ...c, ordem: null } : c)),
  };

  conferir(
    "seção sem ordem vai para o fim da lista",
    secoesDoCardapio(mistas).map((c) => c.nome),
    ["Pratos", "Sobremesas", "Entradas"]
  );

  /*
    NA ORDEM DA PÁGINA, "Entradas" É A ÚLTIMA — porque é ela que não tem
    `ordem`. Então o que se pode mover é `se_3` para cima e `se_1`... nada:
    `se_1` já está na ponta de baixo, e `se_2` está na ponta de cima.
    As bordas são conferidas nessas duas, e não em "a primeira" e "a última"
    de um array que só existe depois de ordenado.
  */
  conferir("mover a seção do topo para cima não muda nada", moverSecao(mistas, "se_2", -1), null);
  conferir("mover a seção do fim para baixo não muda nada", moverSecao(mistas, "se_1", 1), null);

  const subiu = moverSecao(mistas, "se_3", -1);
  conferir(
    "mover uma seção troca as duas de lugar e renumera TODAS",
    secoesDoCardapio(subiu).map((c) => `${c.nome}:${c.ordem}`),
    ["Sobremesas:0", "Pratos:1", "Entradas:2"]
  );
  conferir(
    "a seção que tinha `null` passa a ter ordem decidida",
    subiu.categorias.every((c) => c.ordem !== null),
    true
  );

  /*
    A ORDEM DECIDIDA SOBREVIVE À EXIBIÇÃO. Este é o defeito que a renumeração
    evita: sem ela, a seção movida continuaria empatada em `Infinity` e o
    desempate pela criação a traria de volta ao lugar de sempre — o botão
    pareceria quebrado.

    UMA LINHA EM CADA SEÇÃO é o que torna a conferência capaz de falhar. Com
    linhas só na seção movida, a lista teria uma entrada só, e o teste passaria
    com ou sem o defeito: não haveria ordem relativa nenhuma para estar errada.
  */
  const depoisDeMover = aplicar(mistas, subiu);
  const umaEmCada = ["se_1", "se_2", "se_3"].reduce(
    (acc, secId) => aplicar(acc, adicionarItem(acc, `it_${secId}`, `fi_${secId}`, secId)),
    depoisDeMover
  );

  const exibidas = montarLinhasDoCardapio({
    cardapio: umaEmCada,
    fichas: fichasDe("fi_se_1", "fi_se_2", "fi_se_3"),
    resolver,
  });
  /*
    A ORDEM DAS SEÇÕES, e não uma linha por item: `mistas` já trazia um prato
    em "Entradas" e outro em "Pratos" antes daqui, então a lista tem cinco
    linhas e três seções. O que está em causa é a ORDEM das seções — então é
    ela que se lê, na primeira aparição de cada uma.
  */
  conferir(
    "e a ordem nova é a que a página mostra",
    [...new Set(exibidas.map((l) => l.secao))],
    ["Sobremesas", "Pratos", "Entradas"]
  );

  // ── Renomear, e a recusa do nome vazio ────────────────────────────────

  conferir("renomear para vazio é recusado", renomearSecao(mistas, "se_1", "  ", ""), null);
  conferir(
    "renomear para o mesmo nome não grava nada",
    renomearSecao(mistas, "se_1", "Entradas", ""),
    null
  );
  const renomeada = renomearSecao(mistas, "se_1", "Aperitivos", "Para começar");
  conferir(
    "renomear troca o nome e mantém o id",
    renomeada.categorias.find((c) => c.id === "se_1").nome,
    "Aperitivos"
  );

  // ── Remover seção NÃO apaga os pratos dela ────────────────────────────

  const semEntradas = aplicar(mistas, removerSecao(mistas, "se_1"));
  conferir("a seção sai", semEntradas.categorias.some((c) => c.id === "se_1"), false);
  conferir("os pratos dela ficam", semEntradas.itens.length, 2);
  conferir(
    "— e órfãos, apontando para a seção que sumiu",
    semEntradas.itens.filter((i) => i.categoriaId === "se_1").length,
    1
  );

  const linhasSemSecao = montarLinhasDoCardapio({
    cardapio: semEntradas,
    fichas: [ficha({ id: "fi_a" })],
    resolver,
  });
  conferir(
    "o item órfão é marcado, e não escondido",
    linhasSemSecao.some((l) => l.ajustes.includes("ITEM_ORFAO")),
    true
  );

  // ── Mover pratos dentro da seção ──────────────────────────────────────

  const secaoA = secao("Entradas", 0, { id: "se_1" });
  const secaoB = secao("Pratos", 1, { id: "se_2" });

  const tresPratos = ["it_a", "it_b", "it_c"].reduce(
    (acc, nome) => aplicar(acc, adicionarItem(acc, nome, `fi_${nome}`, "se_1")),
    cardapio({ id: "ca_mover", categorias: [secaoA, secaoB], itens: [] })
  );

  conferir(
    "numa seção que começa vazia, os pratos entram em ordem, do zero para cima",
    tresPratos.itens.map((i) => i.ordem),
    [0, 1, 2]
  );
  conferir(
    "e a página os mostra na ordem de cadastro",
    ordemVisivel(tresPratos, fichasDe("fi_it_a", "fi_it_b", "fi_it_c")),
    ["fi_it_a", "fi_it_b", "fi_it_c"]
  );

  const desceuPrimeiro = aplicar(tresPratos, moverItem(tresPratos, "it_a", 1));
  conferir(
    "descer o primeiro escreve a ordem explícita nos dois que trocaram",
    ["it_a", "it_b", "it_c"].map(
      (id) => desceuPrimeiro.itens.find((i) => i.id === id).ordem
    ),
    [1, 0, 2]
  );
  conferir(
    "e é essa a ordem que a página passa a mostrar",
    ordemVisivel(desceuPrimeiro, fichasDe("fi_it_a", "fi_it_b", "fi_it_c")),
    ["fi_it_b", "fi_it_a", "fi_it_c"]
  );

  conferir("subir o primeiro não muda nada", moverItem(tresPratos, "it_a", -1), null);
  conferir("descer o último não muda nada", moverItem(tresPratos, "it_c", 1), null);

  /*
    ── A RENUMERAÇÃO É SÓ DA SEÇÃO DO ITEM ────────────────────────────────
    Mover dentro de "Entradas" não pode renumerar "Pratos": as ordens de lá
    foram decididas por outra pessoa, em outro momento, e continuam valendo.

    O item da outra seção recebe uma ordem ESCOLHIDA (7, e não a de cadastro),
    para que a comparação tenha o que perder. Com tudo em `null`, comparar os
    dois lados passaria sem provar nada.
  */
  const comOutro = aplicar(tresPratos, adicionarItem(tresPratos, "it_outro", "fi_it_outro", "se_2"));
  const comOutroPosicionado = {
    ...comOutro,
    itens: comOutro.itens.map((i) => (i.id === "it_outro" ? { ...i, ordem: 7 } : i)),
  };

  const soNaSecao = aplicar(comOutroPosicionado, moverItem(comOutroPosicionado, "it_a", 1));
  conferir(
    "mover dentro de uma seção não toca nas ordens das outras",
    soNaSecao.itens.find((i) => i.id === "it_outro").ordem,
    7
  );

  // ── A SEÇÃO QUE VEIO DE FORA, COM ITENS SEM ORDEM ─────────────────────
  //
  // Aqui está o defeito que `itensDaSecao(...).length` produzia, e que só
  // aparece quando a seção NÃO tem ordens `0..n-1`. Uma seção copiada ou vinda
  // do cenário tem itens com `ordem: null`, e `null` é lido como `Infinity`:
  // uma ordem `0` recém-escrita é menor que isso, então o prato novo subia para
  // o TOPO da seção em vez de ficar no fim.
  //
  // Nenhum erro na tela, e a lista impressa para o cliente na ordem errada.

  const herdada = cardapio({
    id: "ca_herdada",
    categorias: [secao("Da casa", 0, { id: "se_h" })],
    itens: [
      itemDeCardapio("fi_h1", "se_h", null, { id: "it_h1" }),
      itemDeCardapio("fi_h2", "se_h", null, { id: "it_h2" }),
      itemDeCardapio("fi_h3", "se_h", null, { id: "it_h3" }),
    ],
  });

  const comNovoNaHerdada = aplicar(herdada, adicionarItem(herdada, "it_h4", "fi_h4", "se_h"));
  conferir(
    "prato novo numa seção sem nenhuma ordem decidida também fica sem ordem",
    comNovoNaHerdada.itens.find((i) => i.id === "it_h4").ordem,
    null
  );
  conferir(
    "e a página o mostra no FIM, e não no topo",
    ordemVisivel(comNovoNaHerdada, fichasDe("fi_h1", "fi_h2", "fi_h3", "fi_h4")),
    ["fi_h1", "fi_h2", "fi_h3", "fi_h4"]
  );

  // ── Trocar de seção põe no fim da seção de destino ────────────────────

  /*
    O ITEM DA SEÇÃO DE DESTINO TEM ORDEM 7 — de propósito.
    Trocar para uma seção cujas ordens não são `0..n-1` é onde `length` erra:
    o comprimento é 1, e o prato movido receberia ordem 1, ficando À FRENTE do
    que já estava lá (ordem 7). A conferência olha a ordem visível, que é a
    única que o cliente vê.
  */
  const trocado = aplicar(
    comOutroPosicionado,
    trocarItemDeSecao(comOutroPosicionado, "it_a", "se_2")
  );
  conferir(
    "o prato trocou de seção",
    trocado.itens.find((i) => i.id === "it_a").categoriaId,
    "se_2"
  );
  conferir(
    "e entra DEPOIS do que já estava na seção, e não na frente",
    ordemVisivel(trocado, fichasDe("fi_it_a", "fi_it_b", "fi_it_c", "fi_it_outro")).filter((id) =>
      id === "fi_it_a" || id === "fi_it_outro"
    ),
    ["fi_it_outro", "fi_it_a"]
  );
  conferir(
    "trocar para seção inexistente é recusado",
    trocarItemDeSecao(comOutroPosicionado, "it_a", "se_fantasma"),
    null
  );

  // ── Remover prato não apaga a ficha ───────────────────────────────────

  const semPrato = aplicar(tresPratos, removerItem(tresPratos, "it_b"));
  conferir("o prato sai do cardápio", semPrato.itens.some((i) => i.id === "it_b"), false);
  conferir("os outros ficam", semPrato.itens.length, 2);

  // ── O nome de anúncio: vazio devolve o nome da ficha ──────────────────

  const anunciado = aplicar(
    tresPratos,
    alterarItemDoCardapio(tresPratos, "it_a", {
      nomeNoCardapio: "  Costela ao madeira  ",
      descricao: "  com farofa  ",
      destaque: "  mais pedido  ",
    })
  );
  const itemAnunciado = anunciado.itens.find((i) => i.id === "it_a");
  conferirTexto("o nome de anúncio é gravado sem espaços nas pontas", itemAnunciado.nomeNoCardapio, "Costela ao madeira");
  conferirTexto("a descrição também", itemAnunciado.descricao, "com farofa");
  conferirTexto("e o destaque também", itemAnunciado.destaque, "mais pedido");

  /*
    ESVAZIAR O NOME NÃO É GRAVAR UM NOME EM BRANCO: é devolver a decisão.
    `null` faz a linha voltar a exibir o nome da ficha — e é isso que
    distingue "ainda não escolhi um nome de anúncio" de "escolhi anunciar sem
    nome", que não existe.
  */
  const semAnuncio = aplicar(anunciado, alterarItemDoCardapio(anunciado, "it_a", { nomeNoCardapio: "   " }));
  conferir("esvaziar o nome devolve `null`, e não string vazia", semAnuncio.itens.find((i) => i.id === "it_a").nomeNoCardapio, null);

  const linhasSemAnuncio = montarLinhasDoCardapio({
    cardapio: semAnuncio,
    fichas: [ficha({ id: "fi_it_a", nome: "Costela bovina 350g" })],
    resolver,
  });
  conferirTexto(
    "e a página volta a mostrar o nome da ficha",
    linhasSemAnuncio.find((l) => l.item.id === "it_a").nome,
    "Costela bovina 350g"
  );

  // ── Uma montagem inteira, do zero, sem perder nada pelo caminho ───────

  /*
    O CAMINHO COMPLETO, NUMA SEQUÊNCIA.
    Cada conferência acima provou uma peça. Esta prova que as peças compõem:
    criar seção, pôr três pratos, mover um, trocar outro de seção, e remover o
    terceiro — e no fim o cardápio tem as duas seções, os dois pratos, e nenhum
    nome de seção perdido. É o teste que pega uma função que devolve a lista
    certa e esquece o resto do cardápio.
  */
  const montado = [
    (c) => aplicar(c, acrescentarSecao(c, "se_x", "Da casa", "")),
    (c) => aplicar(c, acrescentarSecao(c, "se_y", "Do mar", "")),
    (c) => aplicar(c, adicionarItem(c, "it_1", "fi_1", "se_x")),
    (c) => aplicar(c, adicionarItem(c, "it_2", "fi_2", "se_x")),
    (c) => aplicar(c, adicionarItem(c, "it_3", "fi_3", "se_x")),
    (c) => aplicar(c, moverItem(c, "it_3", -1)),
    (c) => aplicar(c, trocarItemDeSecao(c, "it_1", "se_y")),
    (c) => aplicar(c, removerItem(c, "it_2")),
  ].reduce((c, passo) => passo(c), cardapio({ id: "ca_fluxo", nome: "Fluxo", categorias: [], itens: [] }));

  conferirTexto("o nome do cardápio sobreviveu à montagem inteira", montado.nome, "Fluxo");
  conferir(
    "as duas seções continuam lá",
    montado.categorias.map((c) => c.nome),
    ["Da casa", "Do mar"]
  );
  conferir(
    "e sobraram os dois pratos, um em cada seção",
    [montado.itens.find((i) => i.id === "it_1").categoriaId, montado.itens.find((i) => i.id === "it_3").categoriaId],
    ["se_y", "se_x"]
  );
  /*
    E A ORDEM VISÍVEL É A QUE SOBROU DA SEQUÊNCIA — calculada à mão, e não
    lida da função: `it_3` subiu um degrau (ficou antes de `it_2`), `it_2` foi
    removido, e `it_1` desceu para a seção de baixo. Lida de cima para baixo,
    com as seções na ordem em que foram criadas, a lista é `fi_3` e depois
    `fi_1`. Um erro de um degrau em qualquer um dos oito passos muda isto.
  */
  conferir(
    "e a ordem visível é a que a sequência produziu",
    ordemVisivel(montado, fichasDe("fi_1", "fi_3")),
    ["fi_3", "fi_1"]
  );

  // ── Publicar e voltar para montagem, com histórico ────────────────────
  //
  // A situação nova E a linha de histórico que diz o que mudou. Sem a segunda,
  // "publicado" seria um campo que alguém trocou sem que ficasse registro de
  // quando — e a consultora não teria como saber se o cardápio que ela abriu é
  // o que ela publicou.

  limparDemonstracao();

  /*
    O CARDÁPIO JÁ NASCE COM UMA LINHA DE HISTÓRICO — e é isso que dá o que
    perder. A fábrica `cardapio()` começa com `historico: []`, então conferir
    "não apagou o anterior" sobre ela seria conferir que uma lista vazia
    continua vazia. Quem cria um cardápio de verdade escreve "Cardápio
    criado." (é o que `cardapioVazio` faz), e é esse estado que se reproduz.
  */
  criarCardapio(
    cardapio({
      id: "ca_pub",
      situacao: "RASCUNHO",
      historico: [{ em: new Date("2026-02-01T09:00:00Z"), oQue: "Cardápio criado.", quem: "x" }],
    })
  );

  definirSituacaoDoCardapio("ca_pub", "PUBLICADO", "Cardápio publicado.");
  const publicadoAgora = acervoDeCardapios([])[0];
  conferirTexto("a situação vira publicada", publicadoAgora.situacao, "PUBLICADO");
  conferir(
    "e o histórico registra o que aconteceu",
    publicadoAgora.historico.at(-1).oQue,
    "Cardápio publicado."
  );
  conferir(
    "sem apagar o histórico anterior",
    publicadoAgora.historico.map((h) => h.oQue),
    ["Cardápio criado.", "Cardápio publicado."]
  );
  conferir(
    "e sem apagar o NOME do cardápio ao passar por `salvarCardapio`",
    publicadoAgora.nome,
    "Cardápio"
  );

  definirSituacaoDoCardapio("ca_pub", "RASCUNHO", "Cardápio voltou para montagem.");
  conferirTexto(
    "e voltar para montagem é uma edição como as outras",
    acervoDeCardapios([])[0].situacao,
    "RASCUNHO"
  );

  limparDemonstracao();
}

/**
 * Aplica uma alteração ao cardápio, como a tela faz — `salvarCardapio` mescla.
 *
 * Existe para que a conferência exercite o MESMO caminho da tela: se ela
 * aplicasse o `Partial` à mão, provaria que a função devolve o `Partial`
 * certo e não que o `Partial` produz o cardápio certo. As duas coisas são
 * verdade, mas só a segunda importa para quem usa a tela.
 */
function aplicar(cardapio, alteracao) {
  if (alteracao === null) return cardapio;
  return { ...cardapio, ...alteracao };
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
  console.log("Conferências do cardápio\n");
  for (const f of falhas) {
    console.log(`  FALHA  ${f.nome}`);
    console.log(`         obtido:   ${f.obtido}`);
    console.log(`         esperado: ${f.esperado}`);
  }
  console.log(`\n${passou}/${linhas} passaram — ${falhas.length} falha(s).\n`);
} else {
  console.log(
    `\n  ${passou}/${linhas} conferências do cardápio passaram` +
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
 * Medidos em 22/set/2026, sobre a versão que passava 168/168.
 *
 *   K1. O ARQUIVADO CONTINUA NA LISTA. Em `cardapiosVisiveis`, o filtro de
 *       `ARQUIVADO` é removido.
 *
 *       → 166/168 (2 falhas). "Arquivar" e "excluir" deixam de ser coisas
 *       diferentes, e o cardápio que ela tirou de circulação continua
 *       aparecendo como se estivesse em uso.
 *
 *   K2. A FICHA DE OUTRO CLIENTE PASSA A CALCULAR. Em `montarLinhasDoCardapio`,
 *       `ficha !== null && ficha.clienteId === cardapio.clienteId` vira só
 *       `ficha !== null`.
 *
 *       → 167/168 (1 falha). É o defeito mais perigoso do módulo. O insumo tem
 *       preço POR CLIENTE, então a ficha de outro restaurante custa outro
 *       valor: o custo sairia plausível e seria de outro cliente. Um número
 *       errado que ninguém tem como reconhecer como errado.
 *
 *   K3. `pratosDistintos` CONTA ITENS. O `new Set(...).size` vira
 *       `itens.length`.
 *
 *       → 167/168 (1 falha). "Costela" em duas seções passa a contar como dois
 *       pratos, e a tela diz que ela mantém mais fichas em dia do que mantém.
 *
 *   K4. O ITEM ÓRFÃO NÃO É MARCADO. O `ajustes.push("ITEM_ORFAO")` deixa de
 *       rodar.
 *
 *       → 166/168 (2 falhas). O item apontando para uma seção que não existe
 *       fica indistinguível de um item bom, e ele sai do cardápio sem
 *       explicação — a linha some e ninguém sabe por quê.
 *
 * Uma observação que vale registrar: K2 derruba SÓ UMA conferência, e é a de
 * escopo por cliente. Isso não é fragilidade da bancada — é a bancada mostrando
 * que aquele defeito tem exatamente um lugar onde seria notado. Se aquela
 * conferência não existisse, o defeito passaria inteiro.
 */
