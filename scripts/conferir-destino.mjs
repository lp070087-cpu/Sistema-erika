/**
 * PROVA POR EXECUÇÃO: OS TRÊS DESTINOS DA IMPORTAÇÃO.
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA BANCADA PRECISA PROVAR, EM UMA FRASE                       │
 * │                                                                        │
 * │ "Depois da conferência, a mesma lista vira insumo, ficha ou grade —    │
 * │  e nenhum dos três CONSERTA uma linha que a conferência recusou."      │
 * │                                                                        │
 * │ As duas metades pesam igual, e a segunda é a que o briefing escreve com │
 * │ todas as letras: "preservar a conferência". Os três destinos são        │
 * │ TRADUÇÕES, não julgamentos novos. Se qualquer um deles "resolvesse" um  │
 * │ "1.500" escolhendo a leitura brasileira, o dado ambíguo viraria verdade  │
 * │ sem ela ver — que é exatamente o defeito proibido.                     │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ OS DEFEITOS SILENCIOSOS QUE ESTA BANCADA EXISTE PARA PEGAR             │
 * │                                                                        │
 * │  1. O BOTÃO APAGADO SEM EXPLICAÇÃO. `vereditoDoDestino` devolve       │
 * │     `{pode, motivo}` e não um booleano. Um `false` sozinho deixa a tela │
 * │     com um botão morto que ela não sabe como acender — a mesma          │
 * │     experiência de um botão quebrado. O bloco do veredito confere o      │
 * │     MOTIVO, e não só o "não pode".                                     │
 * │                                                                        │
 * │  2. A PLANILHA QUE PASSA A EXIGIR O QUE A FICHA EXIGE. A regra dos três │
 * │     não é a mesma, e é fácil "uniformizar" por engano: a Central aceita  │
 * │     uma grade com linha ambígua, e é justamente onde a Érika quer       │
 * │     olhar o número ao lado dos outros. Se a planilha passasse a exigir  │
 * │     `aceitos > 0`, a única saída de quem quer ver o conjunto antes de   │
 * │     decidir fecharia. Os dois lados deste contraste estão medidos.      │
 * │                                                                        │
 * │  3. A LINHA RECUSADA QUE SOME. `insumosDaLinha` devolve TODAS as        │
 * │     linhas — as aceitas e as recusadas, cada uma com o motivo. Devolver │
 * │     só os insumos produziria a pior tela: ela confere 38 linhas, clica, │
 * │     e entram 34. As outras quatro sumiram sem que nada fosse dito.      │
 * │                                                                        │
 * │  4. A QUANTIDADE AMBÍGUA RESOLVIDA CALADA. "1.500" pode ser mil e       │
 * │     quinhentos ou um vírgula cinco. `itemDaLinha` só aceita a leitura   │
 * │     quando o estado é OK — qualquer outro deixa a quantidade vazia. O    │
 * │     bloco da ambiguidade mede isso contra `calcularImportacao`, para    │
 * │     que a recusa não seja uma promessa num comentário.                  │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * O módulo copiado é o de PRODUÇÃO. Nada aqui é reimplementado.
 */

import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const pasta = join(tmpdir(), `erika-destino-${process.pid}`);
rmSync(pasta, { recursive: true, force: true });

/*
  ── A CADEIA FECHADA, E ELA É LONGA ──────────────────────────────────────

  `destino.ts` é o módulo mais acoplado dos quatro novos, e a lista diz por
  quê: ele importa `para-ficha.ts` (que importa `ficha-tecnica.ts`, que
  importa `insumos.ts`, `relatorio.ts` e `grade.ts`), e importa `validar.ts`
  (que importa `normalizar.ts`). É a esteira inteira.

  Duas notas sobre o `tsconfig` gerado:

    · `paths` tem um SEGUNDO mapeamento, `"*": [<node_modules do projeto>/*]`.
      Sem ele, `exceljs` e `server-only` — que entram pela cadeia de
      `para-ficha.ts` — não resolveriam, porque o `node_modules` NAÕ aparece
      dentro do tmpdir. A alternativa seria um symlink, e um symlink faz o
      `tsc` seguir para fora da pasta do teste; o mapeamento é mais estreito e
      vale só para a resolução.

    · `types: ["node"]` com `typeRoots` apontando para o projeto. O projeto
      tem `@types/node`; uma bancada que compilasse sem ele poderia ficar verde
      aqui e vermelha no `typecheck`.
*/
const FONTES = [
  "src/lib/planilhas/importacao/destino.ts",
  "src/lib/planilhas/importacao/normalizar.ts",
  "src/lib/planilhas/importacao/validar.ts",
  "src/lib/planilhas/importacao/para-ficha.ts",
  "src/lib/planilhas/importacao/tipos.ts",
  "src/lib/planilhas/tipos.ts",
  "src/lib/planilhas/grade.ts",
  "src/lib/planilhas/estilos.ts",
  "src/lib/planilhas/insumos.ts",
  "src/lib/planilhas/relatorio.ts",
  "src/lib/planilhas/modelos.ts",
  "src/lib/planilhas/modelos/ficha-tecnica.ts",
  // A barrel `@/lib/dados` e a cadeia que ela arrasta.
  "src/lib/dados/index.ts",
  "src/lib/dados/tipos.ts",
  "src/lib/dados/tipos-operacao.ts",
  "src/lib/dados/indicadores-comerciais.ts",
  "src/lib/dados/perguntas.ts",
  "src/lib/dados/etapas.ts",
  "src/lib/dados/derivacoes.ts",
  "src/lib/dados/formato.ts",
  "src/lib/dados/numeros.ts",
  "src/lib/dados/unidades.ts",
  "src/lib/dados/rendimento.ts",
  "src/lib/dados/custos.ts",
  "src/lib/dados/custos-ficha.ts",
  "src/lib/dados/busca.ts",
  "src/lib/dados/derivacoes-operacao.ts",
  "src/lib/dados/repositorio.ts",
  "src/lib/dados/repositorio-operacao.ts",
  "src/lib/dados/demonstracao.ts",
  // `demonstracao.ts` importa os tipos de cardápio, e `./cardapios` importa
  // `./precificacao` — a cadeia tem de vir inteira, ou o `tsc` para em
  // `TS2307` e os erros em cascata escondem a causa.
  "src/lib/dados/precificacao.ts",
  "src/lib/dados/cardapios.ts",
  // E `./equipe`, pela mesma causa: o store importa os tipos de pessoa.
  "src/lib/dados/equipe.ts",
  // E `./biblioteca`, pelo mesmo motivo uma quarta vez: o store importa os
  // tipos de material.
  "src/lib/dados/biblioteca.ts",
  "src/lib/dados/mock/repositorio-mock.ts",
  "src/lib/dados/mock/repositorio-operacao-mock.ts",
  "src/lib/dados/mock/dados.ts",
  "src/lib/dados/mock/contratos.ts",
  "src/lib/dados/mock/operacao.ts",
];

for (const origem of FONTES) {
  const de = join(raiz, origem);
  if (!existsSync(de)) throw new Error(`esperado no projeto: ${origem}`);
  const para = join(pasta, origem);
  mkdirSync(dirname(para), { recursive: true });
  cpSync(de, para);
}

writeFileSync(
  join(pasta, "tsconfig.json"),
  JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        lib: ["dom", "dom.iterable", "esnext"],
        module: "commonjs",
        moduleResolution: "node",
        strict: true,
        noUncheckedIndexedAccess: true,
        esModuleInterop: true,
        skipLibCheck: true,
        outDir: "js",
        rootDir: "src",
        baseUrl: ".",
        paths: {
          "@/*": ["src/*"],
          "*": [join(raiz, "node_modules", "*")],
        },
        types: ["node"],
        typeRoots: [join(raiz, "node_modules", "@types")],
      },
      include: ["src/**/*.ts"],
    },
    null,
    2
  )
);

/*
  ── O COMPILADOR É CHAMADO PELO NODE, E NUNCA PELO `.cmd` ──────────────────

  Aqui havia `join(raiz, "node_modules", ".bin", "tsc.cmd")` no Windows, e o
  `execFileSync` recusava com `spawnSync … tsc.cmd EINVAL`: desde a correção do
  CVE-2024-27980, o `child_process` não executa um `.cmd` sem shell. O
  `npm run typecheck` funciona porque o npm passa por um shell; a chamada
  direta não passa.

  Ligar o `shell: true` NÃO é a saída. O `.bin/tsc` do Windows é um gateway que
  reinterpreta os argumentos, e um caminho com espaço ou acento atravessaria
  uma camada de citação a mais.

  `require.resolve` acha o pacote pelo `package.json`, de dentro para fora —
  nenhum caminho escrito à mão. O comando vira:

      process.execPath  node_modules/typescript/bin/tsc  -p  <projeto>

  São caminhos de arquivo reais, então o `EINVAL` não acontece — e é o MESMO
  caminho no Windows e no Linux, sem ramo por plataforma para divergir depois.
  O `bin/tsc` não tem extensão nem shebang: começa com `require`, e por isso o
  Node o executa diretamente.

  Infraestrutura de bancada apenas: `npm run typecheck` e `npm run build` não
  passam por aqui.
*/
const TSC = join(
  dirname(createRequire(import.meta.url).resolve("typescript/package.json")),
  "bin",
  "tsc"
);
execFileSync(process.execPath, [TSC, "-p", join(pasta, "tsconfig.json")], { stdio: "inherit" });

/*
  ── O ALIAS `@/` VALE NO TSC, MAS NÃO NO NODE ─────────────────────────────

  O `paths` do tsconfig ensina o COMPILADOR a achar `@/lib/dados`; o
  JavaScript emitido sai com `require("@/lib/dados")` literal, e o Node não
  tem como resolver isso. Os bancos anteriores nunca tropeçaram nisto porque
  só usavam `import type` — que o `tsc` apaga inteiro. `destino.ts` importa
  `numeroEhValido` e `formato` por VALOR, então aqui a etapa existe.

  A correção é feita no EMITIDO, nunca no projeto: os `.ts` de produção
  continuam como estão, e a bancada reescreve o especificador para um caminho
  relativo dentro da própria pasta do teste. `js/lib/dados/index.js` por
  `js/lib/dados` reproduz o mesmo arredondamento que o `tsc` faria.

  Os `.mjs` copiados NÃO são tocados: reescrever um arquivo que veio do projeto
  faria a bancada provar uma versão diferente da que roda de verdade.
*/
function emitidosDaPasta(dir) {
  const achados = [];
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const caminho = join(dir, entrada.name);
    if (entrada.isDirectory()) achados.push(...emitidosDaPasta(caminho));
    else if (entrada.name.endsWith(".js")) achados.push(caminho);
  }
  return achados;
}

const saida = join(pasta, "js");
let reescritos = 0;

for (const arquivo of emitidosDaPasta(saida)) {
  const antes = readFileSync(arquivo, "utf8");
  const depois = antes.replace(
    /require\("@\/([^"]+)"\)/g,
    (_todo, alvo) => {
      let relativo = relative(dirname(arquivo), join(saida, alvo)).split("\\").join("/");
      if (!relativo.startsWith(".")) relativo = `./${relativo}`;
      return `require("${relativo}")`;
    }
  );
  if (depois !== antes) {
    reescritos += 1;
    writeFileSync(arquivo, depois);
  }
}

console.log(`       (alias @/ resolvido em ${reescritos} arquivo(s) emitido(s))`);

/*
  ── O CAMINHO DO `import()` VAI EMBRULHADO EM `pathToFileURL` ─────────────

  `await import(join(pasta, …))` recebe no Windows `C:\Users\…\Temp\…`, e o
  carregador ESM só aceita `file:`, `data:` e `node:` — ele lê `C:` como
  protocolo e recusa com ERR_UNSUPPORTED_ESM_URL_SCHEME. `pathToFileURL` é a
  conversão do próprio Node: no Linux devolve o mesmo `file:///…` de antes,
  então não há ramo por plataforma. Isto vale SÓ para `import()`: os caminhos
  de `fs`, do `execFileSync` e das reescritas de alias acima continuam
  caminhos de arquivo comuns.
*/
const d = await import(pathToFileURL(join(pasta, "js", "lib", "planilhas", "importacao", "destino.js")).href);

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
   AS LINHAS CONFERIDAS — construídas à mão, campo por campo
   ===========================================================================

   A bancada NÃO chama `conferirDocumento` para produzir as linhas. Ele é
   provado pela bancada da importação, e usá-lo aqui acoplaria esta prova à
   normalização: um número brasileiro mal lido quebraria a bancada do DESTINO,
   e o defeito apareceria na bancada errada.

   Cada `LinhaConferida` é declarada com o `nivel` e as `Leitura`s que a
   etapa 3 teria produzido. É o contrato da fronteira, escrito à mão.
*/

/** Uma leitura que deu certo. */
const ok = (valor) => ({ estado: "OK", valor });

/** Um trecho de texto que existe e não é número. */
const invalido = (motivo) => ({ estado: "INVALIDO", motivo });

/** Duas leituras materialmente diferentes. */
const ambiguo = (motivo) => ({ estado: "AMBIGUO", motivo, leituras: ["1500", "1,5"] });

/** Um aviso com a frase escrita PARA ELA — o campo é `mensagem`. */
function aviso(nivel, mensagem, campo = "valor") {
  return { codigo: "TESTE", nivel, campo, mensagem, acao: "" };
}

/**
 * Uma linha pronta para virar insumo.
 *
 * `nivel: "OK"` é o que `podeCalcular` aceita — e `podeCalcular` recusa só
 * `REVISAR`. Por isso uma linha com `nivel: "ATENCAO"` também passa: falta um
 * dado, mas ela pode ter digitado. Isso está medido no bloco 4.
 */
function linhaPronta(ordem, descricao, quantidade = "5", valor = "50") {
  return {
    ordem,
    descricao,
    quantidade,
    valor,
    leituraQuantidade: ok({ valor: Number(quantidade), unidade: "kg" }),
    leituraValor: ok({ valor: Number(valor) }),
    avisos: [],
    nivel: "OK",
  };
}

/** O cabeçalho conferido, com título e categoria legíveis. */
const CABECALHO = {
  titulo: "Risoto de cogumelos",
  categoria: "Principal",
  rendimento: ok(4),
  porcaoGramas: ok(250),
  avisos: [],
};

/** A conferência de uma lista de linhas, com o cabeçalho acima. */
function conferencia(linhas, cabecalho = CABECALHO) {
  return { cabecalho, linhas };
}

/* ===========================================================================
   1. A FRONTEIRA DA URL — `destinoDaUrl`
   =========================================================================== */

console.log("\n1. a fronteira de ?destino=");

/*
  O PARÂMETRO É TEXTO LIVRE QUE VEM DA URL.

  Qualquer coisa pode chegar aqui: o valor certo, a string vazia, nada (que o
  `searchParams` entrega como `undefined`), e qualquer lixo digitado à mão. A
  função valida ONDE ESTÁ A LISTA — se a página validasse, ela teria a própria
  cópia dos três ids e um destino novo nasceria em `DESTINOS` e não na
  validação.

  Devolver `undefined` — e não um padrão — é o contrato: quem chama decide o
  que fazer com a ausência. Aqui não se inventa destino.
*/
conferir("os três ids válidos passam", ["ingredientes", "ficha", "planilha"].map((v) => d.destinoDaUrl(v)), [
  "ingredientes",
  "ficha",
  "planilha",
]);
conferir("o parâmetro ausente devolve undefined", d.destinoDaUrl(undefined), undefined);
conferir("null também — é o que o Next entrega quando a chave não existe", d.destinoDaUrl(null), undefined);
conferir("a string vazia também", d.destinoDaUrl(""), undefined);
conferir("e qualquer lixo digitado à mão também", d.destinoDaUrl("planilhaX"), undefined);
conferir("maiúsculas não passam — os ids são minúsculos", d.destinoDaUrl("PLANILHA"), undefined);
conferir("e espaço sobrando não passa", d.destinoDaUrl(" planilha "), undefined);

/*
  ── O PADRÃO É DECISÃO DE QUEM CHAMA ──────────────────────────────────────

  `DESTINO_PADRAO` existe e é PLANILHA, mas `destinoDaUrl` não o usa. São duas
  coisas separadas de propósito: a URL responde "o que o link pediu", e o
  padrão responde "o que fazer quando o link não pediu nada". Fundi-las faria
  `destinoDaUrl(null)` devolver "planilha", e a página não teria como saber se
  aquele veio da URL ou foi inventado — a distinção que o bloco acima prende.
*/
conferir("o padrão é a planilha — o que esta esteira sempre fez", d.DESTINO_PADRAO, "planilha");

/*
  ── A LISTA TEM TRÊS, E A ORDEM É A DO CRESCIMENTO DO DADO ────────────────

  INGREDIENTES (a unidade) → FICHA (o conjunto) → PLANILHA (a forma). A ordem
  não é preferência: quem olha a tela lê de cima para baixo como "quanto mais
  eu quero fazer com isto".
*/
conferir(
  "são três destinos, nesta ordem",
  d.DESTINOS.map((x) => x.id),
  ["ingredientes", "ficha", "planilha"]
);
conferir(
  "e cada um diz por onde o contexto o pré-seleciona",
  d.DESTINOS.map((x) => x.contexto),
  ["/ingredientes", "/fichas", "/planilhas"]
);

/*
  ── O TIPO É DERIVADO DA LISTA, E A PROVA DISSO É O PRÓPRIO RETORNO ──────

  `IdDoDestino` é `(typeof DESTINOS)[number]["id"]`, como em `ETAPAS` e em
  `ORIGENS`. Acrescentar um destino exige mexer num lugar só.
*/
for (const entrada of d.DESTINOS) {
  conferir(`"${entrada.id}" volta de destinoDe com o mesmo objeto`, d.destinoDe(entrada.id)?.id, entrada.id);
}

/* ===========================================================================
   2. AS LINHAS VIRAM INSUMOS — e as recusadas dizem por quê
   =========================================================================== */

console.log("\n2. as linhas viram insumos, e as recusadas dizem por quê");

const mistas = [
  linhaPronta(1, "Batata inglesa", "5", "50"),
  /* Sem nome: nem a conferência conseguiu ler. */
  {
    ordem: 2,
    descricao: "   ",
    quantidade: "2",
    valor: "20",
    leituraQuantidade: ok({ valor: 2, unidade: "kg" }),
    leituraValor: ok({ valor: 20 }),
    avisos: [],
    nivel: "OK",
  },
  /* Ambígua: a leitura falhou, e o próprio motivo diz por quê. */
  {
    ordem: 3,
    descricao: "Farinha",
    quantidade: "1.500",
    valor: "8",
    leituraQuantidade: ambiguo("Há duas leituras possíveis: 1500 ou 1,5."),
    leituraValor: ok({ valor: 8 }),
    avisos: [],
    nivel: "REVISAR",
  },
  /* A revisar: tem nome e lê, mas a validação não fecha. */
  {
    ordem: 4,
    descricao: "Manteiga",
    quantidade: "2",
    valor: "30",
    leituraQuantidade: ok({ valor: 2, unidade: "kg" }),
    leituraValor: ok({ valor: 30 }),
    avisos: [aviso("REVISAR", "A unidade não foi informada — a compra não fecha sem ela.")],
    nivel: "REVISAR",
  },
  linhaPronta(5, "Queijo parmesão", "1", "90"),
];

const insumos = d.insumosDaLinha(conferencia(mistas));

/*
  ── TODAS AS LINHAS VOLTAM, E ISSO É O PONTO ──────────────────────────────

  Devolver só os insumos seria mais cômodo e produziria a pior tela possível:
  ela confere cinco linhas, clica em adicionar, e entram duas. As outras três
  sumiram sem que nada fosse dito. É a mesma decisão do `resumoDaFicha`, que
  conta os itens que ficaram FORA da soma em vez de somar os que sobraram em
  silêncio.
*/
conferir("volta uma entrada por linha, e não só as aceitas", insumos.length, 5);
conferir("as ordens saem na ordem do documento", insumos.map((i) => i.linha.ordem), [1, 2, 3, 4, 5]);

conferir("quantas viraram insumo, e quantas ficaram de fora", d.contarInsumos(insumos), {
  total: 5,
  aceitos: 2,
  recusados: 3,
});

/*
  ── OS TRÊS MOTIVOS DE RECUSA, UM A UM ────────────────────────────────────

  Os motivos são uma UNIÃO FECHADA, e não texto solto, porque a tela decide o
  que fazer com cada um — e "uma linha sem preço" e "uma linha ambígua" pedem
  coisas diferentes dela: a primeira ela resolve na biblioteca, a segunda na
  conferência.
*/
conferir(
  "a sem nome é recusada por SEM_NOME",
  insumos[1].recusa,
  { motivo: "SEM_NOME" }
);
conferir(
  "a ambígua é recusada por AMBIGUA, e o motivo vem da própria leitura",
  insumos[2].recusa,
  { motivo: "AMBIGUA", detalhe: "Há duas leituras possíveis: 1500 ou 1,5." }
);
conferir(
  "a que precisa revisar é recusada por A_REVISAR, com a FRASE escrita para ela",
  insumos[3].recusa,
  { motivo: "A_REVISAR", detalhe: "A unidade não foi informada — a compra não fecha sem ela." }
);

/*
  ── O CAMPO É `mensagem`, E NÃO `codigo` ──────────────────────────────────

  A tela mostra o texto escrito para ela, dizendo o que foi encontrado. O
  `codigo` ao lado é o nome INTERNO do teste — mostrá-lo seria mostrar o
  diagnóstico em vez do problema. A bancada prende isso conferindo que a frase
  visível é a `mensagem`.
*/
conferir(
  "e é a mensagem visível, não o código interno",
  insumos[3].recusa.detalhe,
  "A unidade não foi informada — a compra não fecha sem ela."
);

/*
  ── A ORDEM DAS RECUSAS: AMBÍGUA VEM ANTES DE A_REVISAR ───────────────────

  Não é detalhe de implementação: a causa é o dado, e o aviso de revisão é
  CONSEQUÊNCIA dela. Dizer "precisa revisar" quando se sabe exatamente o que
  está ambíguo seria obrigá-la a procurar o defeito numa linha de seis colunas.
  A linha 3 é ambígua E está com `nivel: "REVISAR"`; o que sai é AMBIGUA.
*/
afirmar(
  "a ambígua com nível REVISAR é reportada como AMBIGUA, e não como A_REVISAR",
  insumos[2].recusa?.motivo === "AMBIGUA"
);

/*
  ── `podeCalcular` É O MESMO JULGAMENTO DO MOTOR ──────────────────────────

  `A_REVISAR` não reimplementa a regra: ela pergunta a `podeCalcular`, que é o
  que o motor de custo usa. Uma segunda regra escrita aqui poderia discordar
  dele no dia em que a validação mudasse.
*/
conferir("o que passa na conferência vira insumo de verdade", insumos[0].ingrediente?.nome, "Batata inglesa");
conferir("e o preço de referência da biblioteca é NULO, e precisa ser", insumos[0].ingrediente?.precoAtual, null);

/*
  ── O ID CARREGA A ORDEM FÍSICA ───────────────────────────────────────────

  Duas linhas com o MESMO nome produzem dois insumos diferentes, porque o id
  inclui a ordem. Sem isso, "Queijo" na linha 4 e "Queijo" na linha 9
  colidiriam, e a segunda sobrescreveria a primeira na biblioteca.
*/
const duasIguais = d.insumosDaLinha(
  conferencia([linhaPronta(7, "Queijo"), linhaPronta(9, "Queijo")])
);
afirmar(
  "duas linhas de mesmo nome geram dois ids diferentes",
  duasIguais[0].ingrediente?.id !== duasIguais[1].ingrediente?.id,
  `ids: ${duasIguais[0].ingrediente?.id} e ${duasIguais[1].ingrediente?.id}`
);

/* ===========================================================================
   3. AS LINHAS VIRAM ITENS — sem inventar o que a conferência não leu
   =========================================================================== */

console.log("\n3. as linhas viram itens de ficha");

const itens = d.itensDaImportacao(insumos);
conferir("só as linhas aceitas viram item", itens.length, 2);
conferir(
  "com a quantidade QUE O DOCUMENTO DECLAROU, na etapa em que ela foi medida",
  itens[0].item,
  {
    ingredienteId: insumos[0].ingrediente.id,
    quantidade: "5",
    etapa: "COMPRA",
    unidade: "kg",
    precoReferencia: 10,
    observacao: "",
  }
);

/*
  ── A QUANTIDADE VAI COMO TEXTO, E COM A VÍRGULA BRASILEIRA ───────────────

  `ItemFicha.quantidade` é `string` porque a cozinha escreve "a gosto". Um
  valor que veio do documento é número, e passá-lo adiante como texto preserva
  a única porta de entrada do tipo — `lerQuantidade`, que a ficha digitada à
  mão também atravessa. Converter aqui para depois o motor converter de volta
  criaria duas conversões onde existe uma.
*/
const comMeio = d.itensDaImportacao(d.insumosDaLinha(conferencia([linhaPronta(1, "Açúcar", "1.5", "6")])));
conferir("um vírgula cinco sai como texto brasileiro", comMeio[0].item.quantidade, "1,5");

/* ===========================================================================
   4. O CABEÇALHO DA FICHA — o ajuste dela vence o documento
   =========================================================================== */

console.log("\n4. o cabeçalho da ficha");

conferir("o nome e a categoria vêm do documento", d.cabecalhoDaFicha(conferencia([])), {
  nome: "Risoto de cogumelos",
  categoria: "Principal",
  rendimentoPorcoes: 4,
  porcaoGramas: 250,
});

/*
  ── A MESMA PRECEDÊNCIA DE `calcularImportacao`: `ajuste ?? leitura` ──────

  O que ela corrigiu vence o que o documento dizia — foi digitado depois e à
  vista do resultado. E é de propósito que o destino FICHA e o destino
  PLANILHA escrevam isso IGUAL: se discordassem, o mesmo arquivo geraria um
  prato com um nome aqui e outro ali.
*/
conferir(
  "o ajuste dela vence o documento",
  d.cabecalhoDaFicha(conferencia([]), {
    titulo: "Risoto da casa",
    categoria: "Entrada",
    rendimentoPorcoes: 6,
    porcaoGramas: 180,
  }),
  { nome: "Risoto da casa", categoria: "Entrada", rendimentoPorcoes: 6, porcaoGramas: 180 }
);

/*
  ── APAGAR O CAMPO É `null`, E `null` DEVOLVE A VOZ AO DOCUMENTO ──────────
  O `??` cobre `undefined` E `null`, e isso importa porque a tela limpa um
  campo APAGANDO a chave — o resultado disso é voltar a valer o que o
  documento dizia. Não é esquecimento: é a mesma regra do motor.
*/
conferir(
  "apagar o ajuste devolve a voz ao documento",
  d.cabecalhoDaFicha(conferencia([]), { titulo: null, rendimentoPorcoes: null }),
  { nome: "Risoto de cogumelos", categoria: "Principal", rendimentoPorcoes: 4, porcaoGramas: 250 }
);

/*
  ── SEM TÍTULO NO DOCUMENTO E SEM AJUSTE, O NOME FICA VAZIO ───────────────

  "Ficha importada" é o rótulo do ARQUIVO de planilha. Usá-lo como nome de um
  prato que vai para a biblioteca do cliente seria gravar um nome que ninguém
  escolheu.
*/
conferir(
  "sem título e sem ajuste, o nome fica vazio — a tela pede",
  d.cabecalhoDaFicha(conferencia([], { ...CABECALHO, titulo: null })).nome,
  ""
);

/*
  ── O RENDIMENTO VEM LIDO, E NÃO É RELIDO DO TEXTO ────────────────────────

  `CabecalhoConferido.rendimento` é `Leitura<number>`, e não texto: a
  normalização já rodou na etapa 3. Reler um número a partir do texto cru aqui
  seria uma SEGUNDA conversão do mesmo dado, e a segunda pode discordar da
  primeira — exatamente o defeito que a esteira existe para não ter. Uma
  leitura que falhou vira `null`, e não zero.
*/
conferir(
  "uma leitura que falhou vira ausência, e não zero",
  d.cabecalhoDaFicha(conferencia([], { ...CABECALHO, rendimento: invalido("não é número") })).rendimentoPorcoes,
  null
);

/* ===========================================================================
   5. O VEREDITO — os três destinos têm pré-requisitos DIFERENTES
   =========================================================================== */

console.log("\n5. o que a tela precisa saber antes de deixar ela clicar");

const tresLinhas = d.insumosDaLinha(conferencia([linhaPronta(1, "Batata"), linhaPronta(2, "Farinha")]));

/*
  ── SEM LINHA NENHUMA, NENHUM DESTINO PASSA ───────────────────────────────
  E o motivo é o mesmo para os três, porque a falta é a mesma.
*/
const semLinha = d.insumosDaLinha(conferencia([]));
for (const id of ["ingredientes", "ficha", "planilha"]) {
  const v = d.vereditoDoDestino(id, {
    conferencia: conferencia([]),
    insumos: semLinha,
    nomeDaFicha: "Risoto",
  });
  conferir(`sem linha, "${id}" não pode`, { pode: v.pode, motivo: v.motivo }, {
    pode: false,
    motivo: "Acrescente ou digite pelo menos uma linha na tabela acima.",
  });
}

/*
  ── SEM NENHUMA LINHA ACEITA: INGREDIENTES E FICHA RECUSAM ────────────────

  O contraste com a PLANILHA logo abaixo é o ponto deste bloco. A planilha é o
  que já funcionava, e continua valendo a regra de antes: basta alguma linha.
*/
const soRecusadas = d.insumosDaLinha(
  conferencia([
    {
      ordem: 1,
      descricao: "Farinha",
      quantidade: "1.500",
      valor: "8",
      leituraQuantidade: ambiguo("duas leituras"),
      leituraValor: ok({ valor: 8 }),
      avisos: [],
      nivel: "REVISAR",
    },
  ])
);

for (const id of ["ingredientes", "ficha"]) {
  const v = d.vereditoDoDestino(id, {
    conferencia: conferencia([]),
    insumos: soRecusadas,
    nomeDaFicha: "Risoto",
  });
  conferir(`com zero aceitos, "${id}" não pode`, { pode: v.pode, motivo: v.motivo }, {
    pode: false,
    motivo:
      "Nenhuma linha está pronta: falta o nome do insumo, ou a quantidade ou o valor precisa de uma conferida.",
  });
}

/*
  ── E A PLANILHA PASSA — É DELIBERADO ─────────────────────────────────────

  ┌──────────────────────────────────────────────────────────────────────┐
  │ A PLANILHA CONTINUA ACEITANDO O QUE A FICHA RECUSA                    │
  │                                                                      │
  │ É o que a Central já faz hoje: uma grade com uma linha ambígua é       │
  │ justamente onde a Érika quer olhar o número ao lado das outras.        │
  │ Exigir aqui o que a conferência ainda está discutindo fecharia a única  │
  │ saída de quem quer ver o conjunto antes de decidir.                    │
  └──────────────────────────────────────────────────────────────────────┘
*/
const planilhaComAmbiguo = d.vereditoDoDestino("planilha", {
  conferencia: conferencia([]),
  insumos: soRecusadas,
  nomeDaFicha: "",
});
conferir(
  "mas a PLANILHA passa com a mesma lista — ela aceita o que a ficha recusa",
  planilhaComAmbiguo,
  { pode: true, motivo: null }
);

/*
  ── A FICHA PEDE UM NOME, E OS OUTROS DOIS NÃO ────────────────────────────

  Uma ficha sem nome apareceria na lista como "—" e não haveria como
  distingui-la de outra igual.
*/
const fichaSemNome = d.vereditoDoDestino("ficha", {
  conferencia: conferencia([]),
  insumos: tresLinhas,
  nomeDaFicha: "   ",
});
conferir("a ficha sem nome não pode", { pode: fichaSemNome.pode, motivo: fichaSemNome.motivo }, {
  pode: false,
  motivo: "Dê um nome ao prato — é por ele que a ficha vai aparecer na lista.",
});

conferir(
  "com nome, a ficha pode",
  d.vereditoDoDestino("ficha", { conferencia: conferencia([]), insumos: tresLinhas, nomeDaFicha: "Risoto" }),
  { pode: true, motivo: null }
);
conferir(
  "e ingredientes nem pergunta o nome — a biblioteca não tem prato",
  d.vereditoDoDestino("ingredientes", {
    conferencia: conferencia([]),
    insumos: tresLinhas,
    nomeDaFicha: "",
  }),
  { pode: true, motivo: null }
);

/*
  ── UM BOTÃO APAGADO SEM EXPLICAÇÃO É UM BOTÃO QUEBRADO ──────────────────

  A asserção é sobre a FORMA do retorno, e é o que impede o defeito de voltar:
  se alguém "simplificar" o veredito para um booleano, a tela perde a
  explicação e a bancada acusa.
*/
for (const id of ["ingredientes", "ficha", "planilha"]) {
  const v = d.vereditoDoDestino(id, { conferencia: conferencia([]), insumos: semLinha, nomeDaFicha: "" });
  afirmar(
    `o veredito de "${id}" traz o MOTIVO junto com o não`,
    typeof v.pode === "boolean" && typeof v.motivo === "string" && v.motivo.length > 0,
    `motivo: ${JSON.stringify(v.motivo)}`
  );
}

/* ===========================================================================
   O RESULTADO
   =========================================================================== */

console.log(`\n${passou} passou, ${falhou} falhou (de ${passou + falhou})`);
rmSync(pasta, { recursive: true, force: true });
process.exit(falhou === 0 ? 0 : 1);
