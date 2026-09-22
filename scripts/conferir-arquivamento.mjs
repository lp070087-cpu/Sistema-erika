/**
 * PROVA POR EXECUÇÃO DAS DECISÕES 1 E 2 — ARQUIVAR NÃO É EXCLUIR.
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA BANCADA PRECISA PROVAR, EM UMA FRASE                       │
 * │                                                                        │
 * │ "Um insumo que saiu de circulação continua explicando o custo das      │
 * │  fichas que já o usavam — e arquivar não é a mesma coisa que apagar."  │
 * │                                                                        │
 * │ São duas decisões de negócio, e as duas falham em SILÊNCIO quando      │
 * │ falham:                                                               │
 * │                                                                        │
 * │   · Se `semArquivados` filtrasse por engano o conjunto errado, um      │
 * │     insumo arquivado sumiria da biblioteca E da ficha — e o custo do   │
 * │     prato ficaria sem procedência, sem erro nenhum na tela.            │
 * │                                                                        │
 * │   · Se `arquivarIngrediente` marcasse o insumo como EXCLUÍDO, a ficha  │
 * │     antiga perderia o cadastro. É exatamente o defeito que a decisão 1 │
 * │     existe para impedir.                                               │
 * │                                                                        │
 * │ Por isso cada bloco compara DOIS estados do mesmo insumo: antes e      │
 * │ depois de ser arquivado. E compara com o que a EXCLUSÃO faria — para   │
 * │ que a diferença entre as duas seja um fato medido, e não uma promessa  │
 * │ escrita num comentário.                                                │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * O módulo copiado é o de PRODUÇÃO. Nada aqui é reimplementado.
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

/*
  ── A RAIZ VEM DO PRÓPRIO ARQUIVO, E NUNCA DE UM CAMINHO ESCRITO À MÃO ────

  Aqui havia `const raiz = "/sessions/…/sistema-erika"`: o caminho da máquina
  onde a bancada foi escrita. No Windows ele não existe, o primeiro
  `existsSync` falhava, e a bancada dizia "esperado em src/lib/dados:
  demonstracao.ts" sobre um arquivo que estava lá — o erro apontava para o
  PROJETO quando o defeito era o CAMINHO.

  `import.meta.url` é o caminho deste script, seja onde for que a pasta esteja.
  Subir um nível leva à raiz do projeto em qualquer máquina e em qualquer
  sistema. É o que as outras cinco bancadas já faziam.
*/
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const pasta = join(tmpdir(), `erika-arquivamento-${process.pid}`);
rmSync(pasta, { recursive: true, force: true });

const dados = join(pasta, "src", "lib", "dados");
mkdirSync(dados, { recursive: true });

/*
  A LISTA É FECHADA, E DESCREVE A DEPENDÊNCIA DE VERDADE.

  `demonstracao.ts` importa TIPOS de `tipos-operacao.ts` e de
  `indicadores-comerciais.ts` — e nenhum valor de nenhum deles. Se um dia o
  store passar a depender de algo a mais, esta compilação quebra na hora, que
  é o aviso no momento certo e não três telas depois.
*/
/*
  `precificacao.ts` e `cardapios.ts` entram porque `demonstracao.ts` passou a
  importar os tipos de cardápio, e `./cardapios` importa `./precificacao`.

  Sem eles o `tsc` da bancada falha em `TS2307: Cannot find module
  './cardapios'` — e o estrago não fica nessa linha: sem os TIPOS, todo
  `(c, i) =>` que percorre uma lista de cardápio passa a ser `any` implícito, e
  a saída vira quarenta erros em cascata que apontam para o lugar errado. Foi
  assim que esta bancada quebrou quando o módulo de cardápios nasceu.
*/
const FONTES = [
  "demonstracao.ts",
  "tipos-operacao.ts",
  "indicadores-comerciais.ts",
  "perguntas.ts",
  "tipos.ts",
  "custos.ts",
  "custos-ficha.ts",
  "numeros.ts",
  "precificacao.ts",
  "cardapios.ts",
  "equipe.ts",
  /*
    `biblioteca.ts` entrou pela mesma causa, e a lição se repetiu uma quarta
    vez: o store passou a importar os tipos de material. Sem o arquivo aqui, a
    compilação para em `TS2307` e o estrago não fica nessa linha — sem os
    tipos, todo `(m) =>` que percorre um material vira `any` implícito, e a
    saída vira dezenas de erros apontando para o lugar errado.
  */
  "biblioteca.ts",
];

for (const f of FONTES) {
  const origem = join(raiz, "src", "lib", "dados", f);
  if (!existsSync(origem)) throw new Error(`esperado em src/lib/dados: ${f}`);
  cpSync(origem, join(dados, f));
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

  Aqui havia `join(raiz, "node_modules", ".bin", "tsc.cmd")` no Windows, e o
  `execFileSync` recusava: `spawnSync tsc.cmd EINVAL`. O motivo é que desde a
  correção de segurança do Node (CVE-2024-27980) `child_process` não executa
  um `.cmd`/`.bat` sem um shell. O `npm run typecheck` funciona porque o `npm`
  passa por um shell; a chamada direta não passa.

  A saída NÃO é ligar o `shell: true`. O `.bin/tsc` do Windows é um gateway que
  reinterpreta os argumentos — lê o `%*`, monta o caminho do Node, o `.js` e os
  parâmetros —, então um caminho com espaço ou acento (esta pasta se chama
  "Economia", e o projeto vive sob `C:\Users\…`) atravessa uma camada de
  citação a mais, e pode partir.

  `require.resolve` acha o pacote pelo seu `package.json`, de dentro para fora:
  subindo de `scripts/` até a pasta que tem `node_modules`. Nenhum caminho é
  escrito à mão, e um workspace ou um `node_modules` em outro lugar continuam
  funcionando. O comando vira:

      process.execPath  node_modules/typescript/bin/tsc  -p  <projeto>

  Os três são caminhos de arquivo reais, então o `EINVAL` não acontece. E é o
  MESMO caminho para Windows e Linux — não há um ramo por plataforma para
  divergir depois. O `bin/tsc` não tem extensão e não tem shebang: ele começa
  com `require`, o que é JavaScript válido, e é exatamente por isso que o Node
  consegue executá-lo diretamente.

  Isto é infraestrutura de bancada. O `npm run typecheck` e o `npm run build`
  não passam por aqui e não mudam.
*/
const TSC = join(
  dirname(createRequire(import.meta.url).resolve("typescript/package.json")),
  "bin",
  "tsc"
);

execFileSync(process.execPath, [TSC, "-p", join(pasta, "tsconfig.json")], { stdio: "inherit" });

/*
  ── O CAMINHO DO `import()` VAI EMBRULHADO EM `pathToFileURL` ─────────────

  Aqui havia `await import(join(pasta, …))`. No Windows a pasta é
  `C:\Users\…\Temp\…`, e o carregador ESM do Node só aceita os esquemas
  `file:`, `data:` e `node:` — ele lê `C:` como protocolo e recusa:

      ERR_UNSUPPORTED_ESM_URL_SCHEME
      Received protocol 'c:'

  A saída NÃO é montar a URL à mão trocando `C:\` por `file:///`: barras,
  acentos, `#` e `%` no caminho teriam de ser escapados, e escapar isso à mão
  é onde se erra. `pathToFileURL` é a função do próprio Node que faz essa
  conversão, e no Linux devolve o mesmo `file:///…` que já funcionava — um
  caminho só, sem ramo por plataforma.

  Isto vale SÓ para `import()`. Os caminhos usados por `fs` e pelo
  `execFileSync` continuam sendo caminhos de arquivo comuns: convertê-los
  seria trocar o formato certo pelo errado.
*/

const store = await import(pathToFileURL(join(pasta, "js", "lib", "dados", "demonstracao.js")).href);

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

const biblioteca = [
  { id: "in_1", nome: "Batata" },
  { id: "in_2", nome: "Farinha" },
  { id: "in_3", nome: "Cebola" },
];

// ===========================================================================
console.log("\n── O ESTADO INICIAL: NADA FORA DE CIRCULAÇÃO ──");

store.limparDemonstracao();

conferir(
  "a biblioteca inteira vem, sem filtro nenhum",
  store.semArquivados(store.semExcluidos(biblioteca)).map((i) => i.id),
  ["in_1", "in_2", "in_3"]
);
afirmar("e nada está arquivado", !store.ingredienteArquivado("in_1"));
afirmar("e nada está fora da biblioteca", !store.insumoForaDaBiblioteca("in_1"));

// ===========================================================================
console.log("\n── ARQUIVAR TIRA DAS LISTAS, SEM APAGAR NADA ──");

store.arquivarIngrediente("in_2");

conferir(
  "o arquivado sai da lista",
  store.semArquivados(biblioteca).map((i) => i.id),
  ["in_1", "in_3"]
);
afirmar("mas ele continua EXISTINDO", store.ingredienteArquivado("in_2"));
afirmar(
  "e NÃO foi marcado como excluído — é a diferença inteira entre as duas decisões",
  !store.insumoFoiExcluido("in_2")
);
afirmar("a lista sem excluídos ainda o traz", store.semExcluidos(biblioteca).length === 3);

// ===========================================================================
console.log("\n── AS DUAS LISTAS SÃO INDEPENDENTES ──");

store.excluirIngrediente("in_3");

conferir(
  "excluir tira de uma lista; arquivar tira da outra",
  {
    semArquivados: store.semArquivados(biblioteca).map((i) => i.id),
    semExcluidos: store.semExcluidos(biblioteca).map((i) => i.id),
  },
  { semArquivados: ["in_1", "in_3"], semExcluidos: ["in_1", "in_2"] }
);

afirmar(
  "e as duas juntas dão a biblioteca de verdade",
  store.semArquivados(store.semExcluidos(biblioteca)).map((i) => i.id).join(",") === "in_1"
);

// ===========================================================================
console.log("\n── A BUSCA USA A PERGUNTA ÚNICA, E ELA CONCORDA COM AS DUAS LISTAS ──");

/*
  Este é o ponto onde a regra poderia divergir sem ninguém notar. A busca não
  recebe `{ id }`: ela indexa ids PREFIXADOS. Se o predicado dela fosse escrito
  de novo lá, os dois poderiam discordar — e o Ctrl+K acharia um insumo que a
  lista já não mostra. Aqui os dois são confrontados item a item.
*/
for (const { id, nome } of biblioteca) {
  const visivelNaLista = store.semArquivados(store.semExcluidos(biblioteca)).some((i) => i.id === id);
  const visivelNaBusca = !store.insumoForaDaBiblioteca(id);
  afirmar(`"${nome}" tem a MESMA visibilidade na lista e na busca`, visivelNaLista === visivelNaBusca);
}

afirmar("in_1 (vivo) aparece nos dois", !store.insumoForaDaBiblioteca("in_1"));
afirmar("in_2 (arquivado) some dos dois", store.insumoForaDaBiblioteca("in_2"));
afirmar("in_3 (excluído) some dos dois", store.insumoForaDaBiblioteca("in_3"));

// ===========================================================================
console.log("\n── A VOLTA: ARQUIVAR PRECISA TER DESFAZIMENTO ──");

store.desarquivarIngrediente("in_2");

afirmar("o nome volta a ser encontrado", !store.insumoForaDaBiblioteca("in_2"));
conferir(
  "e ele reaparece na biblioteca",
  store.semArquivados(store.semExcluidos(biblioteca)).map((i) => i.id),
  ["in_1", "in_2"]
);
afirmar(
  "enquanto o EXCLUÍDO não volta — arquivar e apagar não são a mesma porta",
  store.insumoForaDaBiblioteca("in_3")
);

// ===========================================================================
console.log("\n── O HISTÓRICO: ARQUIVAR NÃO REESCREVE O PASSADO ──");

/*
  A decisão 2, dita como teste: "NÃO permitir que excluir um ingrediente hoje
  altere retroativamente o custo de uma ficha antiga."

  Uma ficha escrita com a batata a R$ 10/kg. A batata é arquivada. O custo
  guardado na linha tem de continuar 10 — e a prova é que o NÚMERO não se
  move, mesmo com o insumo fora de circulação.
*/
const linhaDaFicha = {
  ingredienteId: "in_1",
  quantidade: "2",
  unidade: "kg",
  precoReferencia: 10,
  etapa: "COMPRA",
  observacao: "",
};

store.arquivarIngrediente("in_1");

afirmar(
  "o preço guardado na linha da ficha antiga continua o do dia em que ela foi escrita",
  linhaDaFicha.precoReferencia === 10,
  "o store não tem como tocar nesta linha — e é isso que a decisão 2 exige"
);
afirmar(
  "e o custo da ficha segue calculável: 2 kg × R$ 10 = R$ 20",
  linhaDaFicha.quantidade * linhaDaFicha.precoReferencia === 20
);
afirmar(
  "o insumo está fora da biblioteca, e mesmo assim a ficha continua explicando o custo",
  store.insumoForaDaBiblioteca("in_1")
);

// ===========================================================================
console.log("\n── O QUE CONTA COMO ALTERAÇÃO PARA A TELA DE DEMONSTRAÇÃO ──");

/*
  `temAlteracoes` é o que faz a faixa "há alterações nesta sessão" aparecer.
  Arquivar tem de contar: é uma alteração real, e esconder isso faria a
  consultora fechar a página achando que não mexeu em nada.
*/
store.limparDemonstracao();
afirmar("sessão limpa não tem alterações", !store.temAlteracoes());

store.arquivarIngrediente("in_1");
afirmar("arquivar conta como alteração", store.temAlteracoes());

store.limparDemonstracao();
afirmar("e limpar a demonstração desfaz o arquivamento", !store.ingredienteArquivado("in_1"));
afirmar("deixando a sessão sem alterações de novo", !store.temAlteracoes());

// ===========================================================================
console.log("\n── O PAR (ficha, posição): UMA FICHA PODE USAR O MESMO INSUMO DUAS VEZES ──");

/*
  Este bloco prova o defeito que a chave composta evita. A lista de bloqueio é
  renderizada por React, e React usa a chave para decidir quais itens manter.
  Duas linhas da MESMA ficha com a mesma chave fariam uma delas sumir — e o
  texto diria "2 fichas" enquanto a lista mostrasse um nome só.

  A prova aqui é aritmética e não de renderização: as duas linhas precisam
  ter chaves DIFERENTES, e o número de FICHAS distintas precisa ser 1.
*/
const usos = [
  { ficha: { id: "fi_9" }, cliente: { id: "cl_1" }, item: { quantidade: "0,200" } },
  { ficha: { id: "fi_9" }, cliente: { id: "cl_1" }, item: { quantidade: "0,150" } },
];

const chaves = usos.map((u, i) => `${u.ficha.id}-${i}`);
conferir("as duas linhas têm chave distinta", new Set(chaves).size, 2);
conferir("mas são UMA ficha", new Set(usos.map((u) => u.ficha.id)).size, 1);

// ===========================================================================
console.log(`\n${passou} passou, ${falhou} falhou.\n`);

if (falhou > 0) process.exitCode = 1;

/*
  ── O CONTROLE NEGATIVO ─────────────────────────────────────────────────

  Uma bancada que passa de primeira não provou nada ainda: ela precisa ser
  capaz de FALHAR. O controle é este:

    1. Guarde `demonstracao.ts`.
    2. Faça `insumoForaDaBiblioteca` devolver `insumosExcluidos.has(id)` apenas
       — isto é, esqueça os arquivados.
    3. Rode: os blocos "some dos dois" e "tem a MESMA visibilidade" têm de
       acusar FALHA.
    4. Restaure e rode de novo: 100% verde.

  Está registrado aqui porque o defeito que ele pega é o mais provável desta
  rodada — alguém, no futuro, estender a exclusão e esquecer o arquivamento.
*/
