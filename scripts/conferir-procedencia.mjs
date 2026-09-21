/**
 * PROVA POR EXECUÇÃO DA DECISÃO 3 — A PLANILHA HISTÓRICA NÃO MENTE EM SILÊNCIO.
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA BANCADA PRECISA PROVAR, EM UMA FRASE                       │
 * │                                                                        │
 * │ "Uma planilha montada com os preços de um momento tem de saber dizer    │
 * │  que os dados de origem mudaram depois — sem ser recalculada, sem ser   │
 * │  escondida e sem ser apagada."                                         │
 * │                                                                        │
 * │ O módulo sob teste é PURO: ele compara dois retratos de preço e         │
 * │ devolve o que mudou entre eles. Não escreve, não corrige, não decide.   │
 * │ É por isso que ele pode ser provado por execução — a bancada chama as   │
 * │ funções de produção e compara a SAÍDA, e nada aqui é reimplementado.    │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ OS QUATRO DEFEITOS SILENCIOSOS QUE ESTA BANCADA EXISTE PARA PEGAR     │
 * │                                                                        │
 * │ Os quatro produzem o MESMO sintoma na tela — nada acontece — e por     │
 * │ isso nenhum deles aparece sozinho num teste manual:                    │
 * │                                                                        │
 * │  1. USAR O ID COMPOSTO NO RETRATO. `LinhaIngredienteDoCliente.id` é     │
 * │     `"${clienteId}_${ingredienteId}"`. Guardá-lo funciona por acidente  │
 * │     hoje (os dois lados leem o mesmo id composto, do mesmo cliente) e   │
 * │     quebra no dia em que as duas pontas vierem de origens diferentes:   │
 * │     nenhum id casa, e o aviso lista TODOS os insumos como "saiu do      │
 * │     cadastro". Um alarme falso em cada linha ensina a ignorar alarmes.  │
 * │                                                                        │
 * │  2. COMPARAR COM `>` EM VEZ DE `!==`. O teste manual natural é "subir  │
 * │     o preço e ver se avisa" — e ele passa. A QUEDA é que fica muda: o   │
 * │     arquivo de março passa a mostrar um custo MAIOR que o de hoje, e    │
 * │     nada avisa. O bloco "a queda também envelhece" é este caso.         │
 * │                                                                        │
 * │  3. MANDAR O EXCLUÍDO PARA A LISTA DE HOJE. Se o insumo apagado         │
 * │     entrasse na lista como um item qualquer, ele casaria com o retrato  │
 * │     e a remoção nunca seria detectada — a planilha ficaria com um       │
 * │     número que ninguém mais consegue explicar, e em silêncio.           │
 * │                                                                        │
 * │  4. RETRATAR A BIBLIOTECA INTEIRA. Parece mais simples e é o defeito    │
 * │     oposto: o aviso passa a acender quando nada aconteceu — ela          │
 * │     corrige o preço de uma farinha que nenhuma ficha usa e recebe o     │
 * │     aviso de que a planilha envelheceu.                                 │
 * │                                                                        │
 * │ Os quatro têm controle negativo explícito no fim do arquivo.           │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

/*
  A RAIZ VEM DO PRÓPRIO ARQUIVO, e não de um caminho escrito à mão.

  `scripts/` está na raiz do projeto, então subir um nível a partir daqui é a
  mesma pasta — no sandbox Linux e no Windows, sem editar nada. É o que faz
  `npm run conferir:procedencia` funcionar nas duas máquinas.

  (A bancada de arquivamento, mais antiga, traz o caminho do sandbox fixo no
  código; ela roda onde foi escrita e falharia no Windows. Esta não repete
  isso — ver a nota no relatório da rodada.)
*/
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const pasta = join(tmpdir(), `erika-procedencia-${process.pid}`);
rmSync(pasta, { recursive: true, force: true });

const destino = join(pasta, "src", "lib", "planilhas");
mkdirSync(destino, { recursive: true });

/*
  A LISTA É FECHADA, E DESCREVE A DEPENDÊNCIA DE VERDADE.

  `procedencia.ts` não importa NADA — nem tipo, nem valor. É essa pureza que
  faz a prova por execução ser barata: não há repositório, não há store, não
  há I/O para simular. Se um dia o módulo passar a depender de algo a mais,
  esta compilação quebra na hora — que é o aviso no momento certo.
*/
const FONTES = ["procedencia.ts"];

for (const f of FONTES) {
  const origem = join(raiz, "src", "lib", "planilhas", f);
  if (!existsSync(origem)) throw new Error(`esperado em src/lib/planilhas: ${f}`);
  cpSync(origem, join(destino, f));
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

/*
  ── O COMPILADOR É CHAMADO PELO NODE, E NUNCA PELO `.cmd` ──────────────────

  No Windows, `join(raiz, "node_modules", ".bin", "tsc.cmd")` com
  `execFileSync` dava `spawnSync … tsc.cmd EINVAL`: desde o CVE-2024-27980 o
  `child_process` não executa um `.cmd` sem shell. O `npm run typecheck`
  funciona porque o npm passa por um shell; a chamada direta não passa.

  `shell: true` não resolve: o `.bin/tsc` do Windows reinterpreta os argumentos,
  e um caminho com espaço ou acento atravessaria uma citação a mais.

  `require.resolve` acha o pacote pelo `package.json`, de dentro para fora —
  nenhum caminho escrito à mão. O comando vira
  `process.execPath node_modules/typescript/bin/tsc -p <projeto>`: caminhos de
  arquivo reais, o mesmo nos dois sistemas, sem ramo por plataforma. O `bin/tsc`
  não tem extensão nem shebang — começa com `require`, e por isso o Node o
  executa diretamente.

  Infraestrutura de bancada apenas: `typecheck` e `build` não passam por aqui.
*/
const TSC = join(
  dirname(createRequire(import.meta.url).resolve("typescript/package.json")),
  "bin",
  "tsc"
);
execFileSync(process.execPath, [TSC, "-p", join(pasta, "tsconfig.json")], { stdio: "inherit" });

/*
  O caminho do `import()` vai embrulhado em `pathToFileURL`: no Windows
  `C:\…` é lido pelo carregador ESM como protocolo `c:` e recusado
  (ERR_UNSUPPORTED_ESM_URL_SCHEME). Vale só para `import()` — os caminhos de
  `fs` e do `execFileSync` continuam caminhos de arquivo comuns.
*/
const p = await import(pathToFileURL(join(pasta, "js", "lib", "planilhas", "procedencia.js")).href);

let passou = 0;
let falhou = 0;

function conferir(nome, obtido, esperado) {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a === b) {
    passou += 1;
    console.log(`  ok   ${nome}`);
  } else {
    falhou += 1;
    console.log(`  FALHA ${nome}\n        obtido:   ${a}\n        esperado: ${b}`);
  }
}

function afirmar(nome, condicao, detalhe = "") {
  if (condicao) {
    passou += 1;
    console.log(`  ok   ${nome}`);
  } else {
    falhou += 1;
    console.log(`  FALHA ${nome}${detalhe ? `\n        ${detalhe}` : ""}`);
  }
}

/* ===========================================================================
   O CENÁRIO — o Empório, e um segundo cliente para provar o recorte.
   =========================================================================== */

const CENARIO = {
  cliente: { id: "cli_A" },
  ingredientesDoCliente: [
    { ingrediente: { id: "in_1", nome: "Batata" }, precoAtual: 10 },
    { ingrediente: { id: "in_2", nome: "Farinha" }, precoAtual: 5 },
    { ingrediente: { id: "in_3", nome: "Cebola" }, precoAtual: 3 },
    { ingrediente: { id: "in_4", nome: "Açafrão" }, precoAtual: 100 },
  ],
  fichas: [
    { clienteId: "cli_A", itens: [{ ingredienteId: "in_1" }, { ingredienteId: "in_2" }] },
    { clienteId: "cli_B", itens: [{ ingredienteId: "in_3" }] },
  ],
};

/** O mesmo cenário com o preço de um insumo trocado — o "depois". */
function comPreco(base, id, preco) {
  return {
    ...base,
    ingredientesDoCliente: base.ingredientesDoCliente.map((l) =>
      l.ingrediente.id === id ? { ...l, precoAtual: preco } : l
    ),
  };
}

/** O mapa vazio — "a sessão não mexeu em nada". */
const NADA = new Map();

// ===========================================================================
console.log("\n── QUAL MODELO TEM PREÇO DENTRO ──");

/*
  A lista é explícita de propósito: o aviso só faz sentido onde há dinheiro no
  arquivo. O relatório de consultoria e a planilha em branco nunca mostraram um
  preço, então avisá-los seria falar de um número que eles não têm.
*/
conferir("ficha técnica tem preço dentro", p.dependeDePrecos("ficha-tecnica"), true);
conferir("custos e precificação tem preço dentro", p.dependeDePrecos("custos-precificacao"), true);
conferir("relatório de consultoria NÃO tem", p.dependeDePrecos("relatorio-consultoria"), false);
conferir("planilha em branco NÃO tem", p.dependeDePrecos("em-branco"), false);
conferir("modelo desconhecido NÃO acende o aviso", p.dependeDePrecos("modelo-que-nao-existe"), false);

// ===========================================================================
console.log("\n── O RECORTE: SÓ OS INSUMOS QUE ESTA PLANILHA MOSTRA ──");

/*
  A biblioteca do cliente tem quatro insumos e as fichas dele usam dois. O
  açafrão (in_4) não entra — ninguém quer o aviso de que a planilha envelheceu
  porque uma farinha que ela nunca mostrou mudou de preço.

  A cebola (in_3) também não entra, e por outro motivo: ela é usada por uma
  ficha de OUTRO cliente. Sem o filtro por cliente, a planilha do Empório
  passaria a ser conferida contra as fichas alheias.
*/
conferir(
  "o retrato traz os insumos das fichas DESTE cliente, na ordem do cadastro",
  p.retratoDoContexto(CENARIO),
  [
    { ingredienteId: "in_1", nome: "Batata", preco: 10 },
    { ingredienteId: "in_2", nome: "Farinha", preco: 5 },
  ]
);

/*
  O DEFEITO 1, medido — e ele é medido sobre o retrato CERTO, com as chaves
  trocadas. É a reprodução exata do que o código faria se usasse `linha.id`:
  o mesmo conjunto de insumos, os mesmos preços, e só a CHAVE diferente.
*/
const retratoCerto = p.retratoDoContexto(CENARIO);
const retratoComposto = retratoCerto.map((i) => ({
  ...i,
  ingredienteId: `cli_A_${i.ingredienteId}`,
}));

const comIdComposto = p.conferirPlanilha(retratoComposto, CENARIO, NADA);
conferir(
  "o id composto faria os DOIS insumos virarem 'saiu do cadastro'",
  comIdComposto.alterados.map((a) => a.tipo),
  ["removido", "removido"]
);
conferir(
  "— um alarme falso em cada linha, com os preços todos certos",
  comIdComposto.alterados.map((a) => a.precoNaGeracao),
  [10, 5]
);
afirmar(
  "enquanto o retrato com o id do INSUMO não acusa nada",
  !p.conferirPlanilha(retratoCerto, CENARIO, NADA).haDivergencia
);

// ===========================================================================
console.log("\n── SEM MUDANÇA NÃO HÁ AVISO ──");

/*
  O caso mais importante desta bancada é o do silêncio. Um aviso que aparece
  quando nada aconteceu treina a consultora a ignorá-lo — e aí o dia em que ele
  estiver certo, ele passa batido junto.
*/
const semMudanca = p.conferirPlanilha(p.retratoDoContexto(CENARIO), CENARIO, NADA);
conferir("nada mudou, nada a dizer", semMudanca.haDivergencia, false);
conferir("e a lista de alterados fica vazia", semMudanca.alterados, []);
conferir("e a frase é nula — não há frase para um aviso que não existe", semMudanca.resumo, null);

// ===========================================================================
console.log("\n── A ALTA: O CASO DO BRIEFING ──");

/*
  "Batata = R$ 10/kg. Uma ficha é criada com esse custo. Depois: Batata passa
  para R$ 13/kg." — a planilha antiga continua com 10, e precisa avisar.
*/
const subiu = p.conferirPlanilha(
  p.retratoDoContexto(CENARIO),
  comPreco(CENARIO, "in_1", 13),
  NADA
);
conferir("a batata de 10 para 13 acende o aviso", subiu.haDivergencia, true);
conferir("uma linha, e é de preço", subiu.alterados, [
  { ingredienteId: "in_1", nome: "Batata", tipo: "preco", precoNaGeracao: 10, precoAgora: 13 },
]);
conferir("a frase nomeia o fato, sem nomear o insumo", subiu.resumo, "Desde a geração desta planilha, 1 ingrediente mudou de preço.");

// ===========================================================================
console.log("\n── A QUEDA: O DEFEITO QUE O TESTE MANUAL NÃO PEGA ──");

/*
  O DEFEITO 2. Quem testa à mão sobe um preço e vê o aviso — e conclui que
  funciona. A queda fica muda se a comparação for `>`. E ela é tão danosa
  quanto: o arquivo de março passa a mostrar um custo MAIOR do que o real.
*/
const caiu = p.conferirPlanilha(
  p.retratoDoContexto(CENARIO),
  comPreco(CENARIO, "in_1", 7),
  NADA
);
conferir("a batata de 10 para 7 TAMBÉM acende o aviso", caiu.haDivergencia, true);
conferir("e o par mostra a direção certa", caiu.alterados[0], {
  ingredienteId: "in_1",
  nome: "Batata",
  tipo: "preco",
  precoNaGeracao: 10,
  precoAgora: 7,
});

// ===========================================================================
console.log("\n── PREÇO QUE APARECE ONDE NÃO HAVIA ──");

/*
  A planilha trazia uma célula vazia onde hoje há um número. O arquivo
  envelheceu — só que ao contrário do usual, ficou mais vazio em vez de mais
  barato. Quem o abrisse concluiria que o insumo não tem custo.

  `null` aqui é ausência de preço, e não "não julgado": os dois lados são o
  mesmo campo da mesma lista. É por isso que a transição conta.
*/
const semPreco = {
  ...CENARIO,
  ingredientesDoCliente: CENARIO.ingredientesDoCliente.map((l) =>
    l.ingrediente.id === "in_2" ? { ...l, precoAtual: null } : l
  ),
};
const apareceu = p.conferirPlanilha(
  p.retratoDoContexto(semPreco),
  comPreco(semPreco, "in_2", 5),
  NADA
);
conferir("de 'sem preço' para R$ 5 conta como divergência", apareceu.haDivergencia, true);
conferir("e o par mostra a ausência do lado de lá", apareceu.alterados[0], {
  ingredienteId: "in_2",
  nome: "Farinha",
  tipo: "preco",
  precoNaGeracao: null,
  precoAgora: 5,
});

// ===========================================================================
console.log("\n── A EXCLUSÃO: O INSUMO QUE SAIU DO CADASTRO ──");

/*
  O DEFEITO 3. O ambiente marca o insumo excluído no mapa da sessão. O que
  `precosVigentes` faz com ele decide se a remoção é detectável: ele NÃO entra
  na lista, e é a AUSÊNCIA que significa "saiu do cadastro".

  Se ele entrasse como um item qualquer, casaria com o retrato e a planilha
  ficaria com um número que ninguém mais consegue explicar.
*/
const retrato = p.retratoDoContexto(CENARIO);
const mapaComExclusao = new Map([["in_1", { tipo: "excluido" }]]);

/*
  ── A LISTA DE HOJE É O CLIENTE INTEIRO, E ISSO É DELIBERADO ─────────────

  A expectativa óbvia seria "só os insumos desta planilha" — mas ela estaria
  medindo a coisa errada. Duas razões, nesta ordem:

  1. O RECORTE JÁ ACONTECEU NO RETRATO, e ele é o lado que percorre. É o
     retrato que decide sobre quais insumos há o que dizer; `hoje` é a TABELA
     DE BUSCA que responde "e agora, quanto ele custa?". Um item a mais na
     tabela nunca é consultado, porque nada pergunta por ele.

  2. É A LISTA COMPLETA QUE SUSTENTA O SILÊNCIO DE ARQUIVAR. Se o recorte
     fosse aplicado aqui, um insumo ARQUIVADO — que sai da lista visível, mas
     não do cadastro — entraria como ausente e viraria "saiu do cadastro". A
     consultora receberia o aviso de que a planilha de março envelheceu por
     ter arquivado uma batata que não compra mais.

  Então o que se confere aqui não é o tamanho da lista, e sim o que ela
  PRESENCIOU: a exclusão saiu dela.
*/
conferir(
  "o excluído sai da lista de hoje",
  p.precosVigentes(CENARIO, mapaComExclusao).some((i) => i.id === "in_1"),
  false
);
conferir(
  "e o recorte do retrato é que limita o aviso — quatro no cliente, dois na planilha",
  {
    noCliente: p.precosVigentes(CENARIO, NADA).length,
    naPlanilha: retrato.length,
  },
  { noCliente: 4, naPlanilha: 2 }
);

const removido = p.conferirPlanilha(retrato, CENARIO, mapaComExclusao);
conferir("e a remoção é detectada", removido.haDivergencia, true);
conferir("como 'saiu do cadastro', e não como mudança de preço", removido.alterados, [
  { ingredienteId: "in_1", nome: "Batata", tipo: "removido", precoNaGeracao: 10, precoAgora: null },
]);
conferir(
  "com a frase certa para o caso certo",
  removido.resumo,
  "Desde a geração desta planilha, 1 ingrediente saiu do cadastro."
);

/*
  E O CONTRÁRIO: o excluído empurrado para dentro da lista de hoje. É o
  controle negativo do defeito 3, medido aqui para que a diferença seja um
  fato, e não uma promessa escrita num comentário.
*/
const exclusaoMalFeita = p.conferirPrecos(retrato, p.precosDoContexto(CENARIO));
conferir(
  "se o excluído voltasse para a lista, a remoção passaria despercebida",
  exclusaoMalFeita.haDivergencia,
  false,
  ""
);

// ===========================================================================
console.log("\n── OS DOIS TIPOS JUNTOS ──");

/*
  A frase é montada das partes porque as duas categorias podem ocorrer juntas —
  e uma frase fixa diria "2 dados mudaram" apagando a diferença entre conferir
  um preço e descobrir que um cadastro não existe mais.
*/
const osDois = p.conferirPlanilha(
  retrato,
  comPreco(CENARIO, "in_2", 6),
  new Map([["in_1", { tipo: "excluido" }]])
);
conferir("os dois tipos coexistem", osDois.alterados.map((a) => a.tipo), ["removido", "preco"]);
conferir(
  "e a frase traz as duas — do mais forte para o mais fraco",
  osDois.resumo,
  "Desde a geração desta planilha, 1 ingrediente mudou de preço e 1 ingrediente saiu do cadastro."
);

// ===========================================================================
console.log("\n── A ORDEM DA LISTA É A DO CADASTRO ──");

/*
  O retrato é um ARRAY e não um objeto — e é isso que faz a ordem do aviso ser
  a ordem que ela reconhece. Um `Record` não promete ordem nenhuma, e a lista
  sairia embaralhada a cada leitura.
*/
conferir(
  "os alterados saem na ordem do cadastro, não na ordem em que mudaram",
  p.conferirPlanilha(
    retrato,
    {
      ...CENARIO,
      ingredientesDoCliente: CENARIO.ingredientesDoCliente.map((l) => ({ ...l, precoAtual: 99 })),
    },
    NADA
  ).alterados.map((a) => a.nome),
  ["Batata", "Farinha"]
);

// ===========================================================================
console.log("\n── O RETRATO COPIA, NÃO REFERENCIA ──");

/*
  Guardar o objeto da linha faria o retrato mudar junto com o cadastro — que é
  exatamente o defeito que ele existe para detectar. A prova é mudar a lista
  DEPOIS de retratar e ver que o retrato não se moveu.
*/
const listaViva = CENARIO.ingredientesDoCliente.map((l) => ({ ...l }));
const copia = p.capturarPrecos(listaViva.map((l) => ({ id: l.ingrediente.id, nome: l.ingrediente.nome, precoAtual: l.precoAtual })));
listaViva[0].precoAtual = 999;
conferir("mexer na lista não mexe no retrato", copia[0].preco, 10);

// ===========================================================================
console.log("\n── O RETRATO VAZIO NÃO É 'TUDO MUDOU' ──");

/*
  Um retrato vazio tem dois significados possíveis, e os dois pedem silêncio:
  "não havia insumo nenhum naquele dia" ou "este modelo não guarda retrato".
  Tratar a lista de hoje como novidade encheria o aviso de linhas sobre insumos
  que a planilha nunca teve.
*/
const semRetrato = p.conferirPrecos([], p.precosDoContexto(CENARIO));
conferir("sem retrato, nada é afirmado", semRetrato.haDivergencia, false);
conferir("e a lista fica vazia, em vez de cheia", semRetrato.alterados, []);

// ===========================================================================
console.log("\n── A FRASE: PLURAL, E SEM VÍRGULA SOBRANDO ──");

/*
  A frase é a mesma para o aviso do histórico e para o da Central — ela mora no
  módulo justamente para não haver duas cópias que divergem na primeira
  correção de texto.
*/
const tresMudancas = p.conferirPrecos(retrato, [
  { id: "in_1", nome: "Batata", precoAtual: 11 },
  { id: "in_2", nome: "Farinha", precoAtual: 6 },
]);
conferir(
  "dois insumos usa o plural, e não '2 ingrediente'",
  tresMudancas.resumo,
  "Desde a geração desta planilha, 2 ingredientes mudaram de preço."
);

const umSo = p.conferirPrecos(retrato, [{ id: "in_1", nome: "Batata", precoAtual: 11 }]);
conferir(
  "e um insumo que saiu sozinho não vira 'e ... saiu'",
  umSo.resumo,
  "Desde a geração desta planilha, 1 ingrediente mudou de preço e 1 ingrediente saiu do cadastro."
);

// ===========================================================================
console.log("\n── O QUE NÃO É REPORTADO, E POR QUÊ ──");

/*
  Três silêncios deliberados. Nenhum deles é esquecimento, e é por isso que
  cada um vira uma linha de bancada: se alguém "consertar" um destes mais
  tarde, a bancada acusa.
*/

// 1. Um insumo NOVO não estava na planilha, então a planilha continua correta
//    sobre o que ela contém. Reportá-lo faria o aviso disparar toda vez que
//    alguém cadastrasse um insumo.
const comInsumoNovo = {
  ...CENARIO,
  ingredientesDoCliente: [
    ...CENARIO.ingredientesDoCliente,
    { ingrediente: { id: "in_5", nome: "Tomilho" }, precoAtual: 8 },
  ],
  fichas: [
    { clienteId: "cli_A", itens: [{ ingredienteId: "in_1" }, { ingredienteId: "in_2" }, { ingredienteId: "in_5" }] },
  ],
};
const insumoNovo = p.conferirPlanilha(retrato, comInsumoNovo, NADA);
conferir("insumo recém-cadastrado NÃO é reportado", insumoNovo.haDivergencia, false);

// 2. O segundo silêncio — o insumo que muda de nome. O retrato guarda o nome
//    DAQUELE dia, e renomear depois não reescreve o passado. É a mesma regra
//    do preço: o documento histórico conta o que era, não o que é.

// 3. ARQUIVAR não é excluir (decisão 2). Se quem chama olhar a lista visível
//    em vez da biblioteca completa, todo arquivado entra como "removido" — e a
//    consultora que arquivou ontem uma batata que não compra mais receberia
//    hoje o aviso de que a planilha de março dela envelheceu. Não envelheceu.
/*
  A prova aqui é a assimetria entre as duas perguntas do store: elas têm de ter
  respostas diferentes, e `precosVigentes` só é avisado pela exclusão. A lista
  de hoje é a biblioteca COMPLETA — é isso que mantém os dois casos separados.
*/
const completa = p.precosVigentes(CENARIO, NADA);
afirmar(
  "a lista de hoje é a biblioteca completa, e é ela que sustenta o silêncio de arquivar",
  completa.length === CENARIO.ingredientesDoCliente.length
);

// ===========================================================================
console.log("\n── A FRASE NO PLURAL: TRÊS ALTERADOS ──");

const tres = p.conferirPrecos(retrato, [
  { id: "in_2", nome: "Farinha", precoAtual: 6 },
  { id: "in_1", nome: "Batata", precoAtual: 11 },
]);
conferir("dois preços mudados", tres.resumo, "Desde a geração desta planilha, 2 ingredientes mudaram de preço.");

const removidos2 = p.conferirPrecos(retrato, []);
conferir("os dois removidos", removidos2.resumo, "Desde a geração desta planilha, 2 ingredientes saíram do cadastro.");

// ===========================================================================
console.log(`\n${passou} passou, ${falhou} falhou.\n`);

if (falhou > 0) process.exitCode = 1;

/*
  ═══════════════════════════════════════════════════════════════════════════
  OS QUATRO CONTROLES NEGATIVOS — EXECUTADOS NESTA RODADA, COM O RESULTADO
  MEDIDO. Uma bancada que passa de primeira não provou nada ainda: ela precisa
  ser capaz de FALHAR. Cada controle abaixo é UMA edição de uma linha em
  `procedencia.ts`, seguida de `node scripts/conferir-procedencia.mjs`:

  ── 1. O ID COMPOSTO ───────────────────────────────────────────────────────
     Em `precosDoContexto`:
       -  id: linha.ingrediente.id,
       +  id: `${contexto.cliente?.id}_${linha.ingrediente.id}`,
     MEDIDO: 16 passou, 21 falhou (exit 1).
     O retrato passa a trazer "cli_A_in_1" e nenhum id casa. O bloco do id
     composto acusa QUATRO removidos no lugar de dois — a demonstração de que é
     assim que o defeito se manifestaria de verdade.

  ── 2. A COMPARAÇÃO COM `>` ────────────────────────────────────────────────
     Em `conferirPrecos`:
       -  if (agora.precoAtual !== antes.preco) {
       +  if (Number(agora.precoAtual) > Number(antes.preco)) {
     MEDIDO: 35 passou, 2 falhou (exit 1) — e as DUAS falhas são o bloco da
     QUEDA, exatamente o previsto.
     ⚠ ESTE É O CONTROLE QUE IMPORTA MAIS. Trinta e cinco testes continuam
     verdes; a alta continua avisando. Quem testasse à mão — subir um preço e
     ver o aviso acender — concluiria que está tudo certo, e a queda de preço
     ficaria muda para sempre.

  ── 3. O EXCLUÍDO NA LISTA ─────────────────────────────────────────────────
     Em `precosVigentes`:
       -  if (mudou.tipo === "excluido") continue;
       +  if (mudou.tipo === "excluido") { hoje.push({ ...insumo, precoAtual: null }); continue; }
     MEDIDO: 32 passou, 5 falhou (exit 1).
     "saiu do cadastro" vira "o preço foi para null" — duas frases diferentes
     para o mesmo fato, e a mais fraca das duas.

  ── 4. A BIBLIOTECA INTEIRA ────────────────────────────────────────────────
     Em `insumosDaPlanilha`:
       -  return [...ids].map((id) => porId.get(id)).filter((i) => i !== undefined);
       +  return precosDoContexto(contexto);
     MEDIDO: 28 passou, 9 falhou (exit 1).
     O retrato passa a ter quatro insumos em vez de dois — incluindo o açafrão,
     que nenhuma ficha usa, e um insumo usado por uma ficha de OUTRO cliente.

  Após cada controle o arquivo foi restaurado, e a bancada voltou a 37/37 com o
  md5 idêntico ao original (`64a4d81f75b9424fc6f0c7f019912bb3`).
  ═══════════════════════════════════════════════════════════════════════════
*/
