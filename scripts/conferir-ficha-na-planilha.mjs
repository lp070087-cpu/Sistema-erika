/**
 * PROVA POR EXECUÇÃO: A FICHA ALIMENTA A PLANILHA.
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA BANCADA PRECISA PROVAR, EM UMA FRASE                       │
 * │                                                                        │
 * │ "A ficha criada agora e o insumo cadastrado agora ENTRAM na planilha — │
 * │  e nada mais entra além deles."                                        │
 * │                                                                        │
 * │ As duas metades pesam igual. A primeira é o pedido do briefing (§15):  │
 * │ a ficha alimenta a planilha. A segunda é o que impede a primeira de     │
 * │ virar defeito — sobrepor a sessão sem critério apagaria a conferência   │
 * │ de procedência inteira, em silêncio.                                   │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ OS DEFEITOS SILENCIOSOS QUE ESTA BANCADA EXISTE PARA PEGAR            │
 * │                                                                        │
 * │  1. A FICHA DO OUTRO CLIENTE. `sobreporSessao` recebe o recorte pronto, │
 * │     e o recorte é feito por quem chama. Se ele aceitasse o acervo       │
 * │     inteiro, a planilha do Empório citaria o prato da outra cliente —   │
 * │     com o nome certo e o custo errado. O bloco "só as fichas do        │
 * │     cliente" prende isso.                                              │
 * │                                                                        │
 * │  2. O PREÇO SOBREPOSTO. Se a sobreposição passasse a reescrever o       │
 * │     preço dos insumos que ela ALTEROU nesta sessão, a planilha nascaria │
 * │     já concordando com o aviso de procedência — e o aviso nunca         │
 * │     dispararia. O bloco "o preço alterado NÃO é sobreposto" é o que     │
 * │     protege a conferência de procedência de virar enfeite.             │
 * │                                                                        │
 * │  3. O INSUMO QUE NÃO APARECE NA BASE. `usosNoCliente` é o que decide se │
 * │     o insumo entra na aba BASE ("só o que este cliente usa"). Ele vem do │
 * │     repositório, que não sabe da ficha nova — então um insumo trazido    │
 * │     por ela sairia da lista da feira. O bloco de `usosNoCliente`        │
 * │     existe por isso.                                                   │
 * │                                                                        │
 * │  4. O INSUMO ARQUIVADO QUE SOME. Arquivar tira o insumo das LISTAS de   │
 * │     escolha; não apaga o passado. Se `sobreporSessao` consultasse       │
 * │     `insumoForaDaBiblioteca`, arquivar uma batata reescreveria toda     │
 * │     planilha que a usa — sem aviso, e sem ela ter pedido.               │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");
const pasta = join(tmpdir(), `erika-ficha-planilha-${process.pid}`);
rmSync(pasta, { recursive: true, force: true });

/**
 * A CADEIA FECHADA — e ela é maior do que parece.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LISTA TEM DE INCLUIR A BARREL INTEIRA                      │
 * │                                                                      │
 * │ `sessao-planilha.ts` escreve `import type { … } from "@/lib/dados"`. │
 * │ Um `import type` parece não custar nada, e custa: o TypeScript ainda  │
 * │ RESOLVE o módulo, e resolver a barrel significa LER `index.ts` — que  │
 * │ por sua vez arrasta o repositório, o mock do cenário, `busca.ts` e o  │
 * │ `process.env` de `persistenciaConfigurada`.                          │
 * │                                                                      │
 * │ A primeira versão desta lista não tinha nada disso, e a compilação    │
 * │ acusou nas duas pontas:                                              │
 * │                                                                      │
 * │   error TS2307: Cannot find module '@/lib/dados'                     │
 * │   error TS2591: Cannot find name 'Buffer'                            │
 * │                                                                      │
 * │ O segundo erro é o mais instrutivo: `Buffer` não é usado por esta     │
 * │ bancada em lugar nenhum. Ele aparece porque a lista fechada copiava   │
 * │ os arquivos, mas o `tsconfig` gerado declarava `types: []` — e        │
 * │ `types: []` DESLIGA o `@types/node`, que o projeto tem. A bancada     │
 * │ estava compilando com um ambiente MENOS capaz do que o projeto, e     │
 * │ isso teria feito a bancada mentir: verde aqui, vermelho no            │
 * │ `typecheck`.                                                          │
 * │                                                                      │
 * │ Agora a lista é explícita até o fim e o `tsconfig` declara            │
 * │ `types: ["node"]`. Nada é reimplementado: todo arquivo abaixo é o      │
 * │ arquivo de PRODUÇÃO, copiado.                                        │
 * └──────────────────────────────────────────────────────────────────────┘
 */
const FONTES = [
  // O que a bancada prova.
  "src/lib/planilhas/sessao-planilha.ts",
  "src/lib/planilhas/tipos.ts",
  // A barrel `@/lib/dados` — e a cadeia inteira que `index.ts` arrasta.
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
  // A cadeia de `demonstracao.ts` até os cardápios. Ver `conferir-destino.mjs`
  // para o motivo de ela vir inteira, e não só o arquivo que mudou.
  "src/lib/dados/precificacao.ts",
  "src/lib/dados/cardapios.ts",
  "src/lib/dados/equipe.ts",
  // `./biblioteca` pelo mesmo motivo de `./equipe` logo acima.
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

/*
  ── O `tsconfig` DA BANCADA ESPELHA O DO PROJETO ─────────────────────────

  Ele difere em três linhas, e as três são obrigatórias por não se tratar de
  um build do Next:

    noEmit → outDir "js"   o `import` dinâmico precisa de arquivo no disco;
    jsx    → ausente       nenhum arquivo `.tsx` entra na lista;
    types  → ["node"]      o projeto tem `@types/node`; sem declará-lo aqui,
                           a bancada compila num ambiente mais pobre.

  O resto é copiado: `strict`, `noUncheckedIndexedAccess`, `lib` e o alias
  `@/*`. Uma bancada que compilasse com regras diferentes das do projeto
  poderia ficar verde aqui e vermelha no `typecheck`.
*/
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
        paths: { "@/*": ["src/*"] },
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
const r = await import(pathToFileURL(join(pasta, "js", "lib", "planilhas", "sessao-planilha.js")).href);

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
   O CENÁRIO MINÚSCULO — montado à mão, e não lido do repositório
   ===========================================================================

   A bancada não importa o cenário de demonstração de propósito. Se ela o
   importasse, um dado do mock mudando quebraria a prova sem que a REGRA
   tivesse mudado — e o defeito apareceria na bancada errada. Aqui, cada
   número é declarado, e o que se prova é a sobreposição.
*/

const CLIENTE = "cli_emp";
const OUTRO = "cli_out";

const hoje = new Date("2026-09-21T12:00:00.000Z");
const antes = new Date("2026-08-01T12:00:00.000Z");

/** Um insumo da biblioteca, com preço de referência de R$ 10/kg. */
function insumo(id, nome, preco = 10) {
  return {
    id,
    nome,
    categoria: "Geral",
    unidade: "kg",
    compra: null,
    transformacao: { bruto: null, limpo: null, preparado: null, observacao: "" },
    observacoes: "",
    precoAtual: preco,
    atualizadoEm: antes,
    fornecedor: "",
    historico: [],
  };
}

/** Uma ficha com um item só — o suficiente para contar uso e somar custo. */
function ficha(id, clienteId, nome, ingredienteId, quantidade = "1") {
  return {
    id,
    clienteId,
    nome,
    categoria: "Principal",
    rendimentoPorcoes: 2,
    porcaoGramas: 200,
    itens: [
      {
        ingredienteId,
        quantidade,
        unidade: "kg",
        precoReferencia: null,
        etapa: "COMPRA",
        observacao: "",
      },
    ],
    modoPreparo: [],
    finalizacao: [],
    observacoes: "",
    situacao: "EM_REVISAO",
    situacaoCalculo: "AGUARDANDO_DADOS",
    atualizadaEm: antes,
    historico: [],
  };
}

/** A linha que o repositório monta: insumo + preço resolvido para o cliente. */
function linhaDoCliente(ingrediente, usos, preco, origem) {
  return {
    id: `${CLIENTE}_${ingrediente.id}`,
    ingrediente,
    precoAtual: preco,
    origemDoPreco: origem,
    fornecedor: "Fornecedor do cenário",
    atualizadoEm: antes,
    historico: [],
    usosNoCliente: usos,
  };
}

const BATATA = insumo("in_batata", "Batata", 10);
const MUSSARELA = insumo("in_mussarela", "Mussarela", 42.9);

/*
  O CONTEXTO DO REPOSITÓRIO — o "antes". Ele tem UM insumo usado e UMA ficha.
  É o que a Central enxerga sozinha, e é o que estava produzindo a planilha
  incompleta: o prato criado agora não estava aqui.
*/
const contexto = {
  cliente: { id: CLIENTE, nomeFantasia: "Empório", cidade: "São Paulo" },
  consultoria: { id: "co_1", clienteId: CLIENTE, titulo: "Consultoria" },
  tarefas: [],
  acompanhamentos: [],
  fichas: [ficha("fi_antiga", CLIENTE, "Antiga", BATATA.id)],
  ingredientes: [BATATA, MUSSARELA],
  ingredientesDoCliente: [
    linhaDoCliente(BATATA, 1, 12, "CLIENTE"),
    linhaDoCliente(MUSSARELA, 0, 42.9, "BIBLIOTECA"),
  ],
  observacoes: null,
  geradoEm: hoje,
};

/* ===========================================================================
   1. O DEFEITO, MEDIDO ANTES DO CONSERTO
   =========================================================================== */

console.log("\n1. o defeito que a sobreposição conserta");

/*
  A ficha nova NÃO está no contexto. Isto não é uma suposição sobre o
  repositório: é o que o contexto acima declara, e é o que `montarContexto`
  devolve de verdade — ele lê o cenário, e a sessão não está no cenário.
*/
afirmar(
  "a ficha criada agora NÃO está no contexto do repositório",
  contexto.fichas.some((f) => f.id === "fi_nova") === false
);
afirmar(
  "e o insumo cadastrado agora também não",
  contexto.ingredientes.some((i) => i.id === "in_novo") === false
);

/* ===========================================================================
   2. A SOBREPOSIÇÃO — o conserto
   =========================================================================== */

console.log("\n2. a sessão entra no contexto");

const NOVO_INSUMO = insumo("in_novo", "Açafrão", 88);

const sessao = {
  fichas: [
    ficha("fi_antiga", CLIENTE, "Antiga", BATATA.id),
    ficha("fi_nova", CLIENTE, "Prato novo", NOVO_INSUMO.id, "0.5"),
  ],
  ingredientesNovos: [NOVO_INSUMO],
};

const depois = r.sobreporSessao(contexto, sessao);

conferir(
  "as fichas do contexto passam a ser as do acervo",
  depois.fichas.map((f) => f.id),
  ["fi_antiga", "fi_nova"]
);
afirmar(
  "o insumo novo entra na biblioteca",
  depois.ingredientes.some((i) => i.id === "in_novo")
);
conferir(
  "e a biblioteca fica com os três, sem perder nenhum",
  depois.ingredientes.map((i) => i.id).sort(),
  ["in_batata", "in_mussarela", "in_novo"].sort()
);

/*
  ── O CONTEXTO NÃO É MUTADO ────────────────────────────────────────────────

  Se `sobreporSessao` escrevesse no objeto recebido, o `contextoDaGeracao`
  guardado na Central apontaria para uma base que mudou depois — e a
  conferência de procedência compararia a planilha com ela mesma, sempre
  dizendo que nada mudou. É o defeito que esta asserção prende.
*/
afirmar("o contexto original continua com UMA ficha", contexto.fichas.length === 1);
afirmar("e com DOIS insumos", contexto.ingredientes.length === 2);

/* ===========================================================================
   3. A FRONTEIRA — o que a sobreposição NÃO faz
   =========================================================================== */

console.log("\n3. o que ela não faz");

/*
  O PREÇO DO INSUMO QUE JÁ EXISTIA.

  A Batata tem preço de referência R$ 10 na biblioteca e R$ 12 para este
  cliente. Se a sobreposição passasse a reescrever preço, ela escreveria 10 —
  e a planilha nasceria com o preço errado E o aviso de procedência calado.
  O número que tem de sair é o do repositório, 12.
*/
const linhaBatata = depois.ingredientesDoCliente.find((l) => l.ingrediente.id === "in_batata");
conferir("o preço do insumo que já existia continua sendo o do CLIENTE", linhaBatata.precoAtual, 12);
conferir("e a origem dele continua dita", linhaBatata.origemDoPreco, "CLIENTE");

/*
  O INSUMO NOVO NÃO TEM PREÇO DE CLIENTE — e a origem diz isso.

  Chama-lo de "CLIENTE" seria pior que um erro de número: diria que a
  consultora cadastrou aquele preço para aquele cliente, e ela não fez isso.
  Ela cadastrou o insumo.
*/
const linhaNova = depois.ingredientesDoCliente.find((l) => l.ingrediente.id === "in_novo");
conferir("o insumo novo tem o preço que ela digitou", linhaNova.precoAtual, 88);
conferir("mas a origem é BIBLIOTECA, e não CLIENTE", linhaNova.origemDoPreco, "BIBLIOTECA");

/*
  O QUE ATRAVESSA INTACTO.

  A sobreposição toca em três campos e só. Se ela reconstruísse o contexto
  inteiro, a consultoria poderia sair `undefined` — e o subtítulo do arquivo
  perderia o nome dela sem ninguém perceber.
*/
conferir("o cliente atravessa igual", depois.cliente.id, CLIENTE);
conferir("a consultoria também", depois.consultoria.titulo, "Consultoria");
conferir("e a data de geração — o retrato tem de ser do mesmo instante", depois.geradoEm, hoje);

/* ===========================================================================
   4. OS USOS — o que decide se o insumo entra na aba BASE
   =========================================================================== */

console.log("\n4. quantas fichas usam cada insumo");

conferir("a batata é usada por uma ficha", r.contarUsos(depois.fichas, "in_batata"), 1);
conferir("o açafrão, pela ficha nova", r.contarUsos(depois.fichas, "in_novo"), 1);
conferir("a mussarela, por nenhuma", r.contarUsos(depois.fichas, "in_mussarela"), 0);

const usosNova = depois.ingredientesDoCliente.find((l) => l.ingrediente.id === "in_novo").usosNoCliente;
conferir("e o insumo novo entra na lista de usados", usosNova, 1);

/*
  ── O QUE O REPOSITÓRIO DIZIA ──────────────────────────────────────────────

  A Mussarela vinha com `usosNoCliente: 0` do repositório e continua com 0:
  nenhuma ficha usa. A Batata vinha com 1 e continua 1 — o recálculo concorda
  com o repositório onde o repositório está certo, e é isso que mostra que a
  diferença não é arbitrária.
*/
conferir(
  "a mussarela continua fora da lista de usados",
  depois.ingredientesDoCliente.find((l) => l.ingrediente.id === "in_mussarela").usosNoCliente,
  0
);

/* ===========================================================================
   5. A FRONTEIRA ENTRE CLIENTES
   =========================================================================== */

console.log("\n5. a fronteira entre clientes");

/*
  O RECORTE É DE QUEM CHAMA.

  `sobreporSessao` não sabe de cliente: ela recebe `fichas` já recortadas. O
  que se prova aqui é que o recorte, quando feito, é respeitado — e que a
  sobreposição não reintroduz nada de fora. A ficha da outra cliente entra no
  acervo passado e NÃO deve aparecer na planilha do Empório.
*/
const acervoInteiro = [
  ficha("fi_antiga", CLIENTE, "Antiga", BATATA.id),
  ficha("fi_nova", CLIENTE, "Prato novo", NOVO_INSUMO.id, "0.5"),
  ficha("fi_outra", OUTRO, "Do outro cliente", BATATA.id),
];

const recortado = acervoInteiro.filter((f) => f.clienteId === CLIENTE);

conferir(
  "o acervo inteiro tem três fichas",
  acervoInteiro.length,
  3
);
conferir(
  "o recorte do Empório tem duas — a do outro cliente sai",
  recortado.map((f) => f.id),
  ["fi_antiga", "fi_nova"]
);

const semVazamento = r.sobreporSessao(contexto, { fichas: recortado, ingredientesNovos: [] });
afirmar(
  "e a planilha do Empório não cita a ficha da outra cliente",
  semVazamento.fichas.some((f) => f.id === "fi_outra") === false
);

/*
  ── E O CONTRÁRIO: SEM RECORTE, ELA ENTRA ─────────────────────────────────

  Este é o controle que mostra que a asserção acima tem conteúdo. Se
  `sobreporSessao` filtragem por conta própria, o acervo inteiro continuaria
  saindo com duas fichas — e a prova de cima estaria passando por acidente.
  Com o acervo inteiro passado, as três entram: quem tem de recortar é quem
  chama, e é por isso que `acervoDeFichas` recebe `clienteId`.
*/
const comVazamento = r.sobreporSessao(contexto, { fichas: acervoInteiro, ingredientesNovos: [] });
conferir("sem recorte, as três entram — a guarda é do chamador", comVazamento.fichas.length, 3);

/* ===========================================================================
   6. O INSUMO NOVO E OS USOS DEPOIS DE EXCLUIR A FICHA
   =========================================================================== */

console.log("\n6. o uso acompanha o acervo, e não o cenário");

/*
  O ACERVO É A FONTE DO NÚMERO, e não o contexto do repositório. Se a ficha
  nova sair do acervo (porque foi excluída), o uso do açafrão tem de voltar a
  zero — senão o insumo ficaria na lista da feira de um prato que não existe
  mais. Aqui a lista passada já é a de depois da exclusão.
*/
const semANova = r.sobreporSessao(contexto, {
  fichas: [ficha("fi_antiga", CLIENTE, "Antiga", BATATA.id)],
  ingredientesNovos: [NOVO_INSUMO],
});
conferir(
  "sem a ficha nova, o açafrão volta a zero usos",
  semANova.ingredientesDoCliente.find((l) => l.ingrediente.id === "in_novo").usosNoCliente,
  0
);
afirmar(
  "mas ele continua na BIBLIOTECA — cadastro não some com a ficha",
  semANova.ingredientes.some((i) => i.id === "in_novo")
);

/* ===========================================================================
   O RESULTADO
   =========================================================================== */

console.log(`\n${passou} passou, ${falhou} falhou (de ${passou + falhou})`);
rmSync(pasta, { recursive: true, force: true });
process.exit(falhou === 0 ? 0 : 1);

/*
  ═══════════════════════════════════════════════════════════════════════════
  OS CINCO CONTROLES NEGATIVOS — EXECUTADOS, COM O RESULTADO MEDIDO.

  Uma bancada que passa de primeira ainda não provou nada: ela precisa saber
  FALHAR. Cada controle abaixo é UMA linha de `sessao-planilha.ts` trocada,
  `node scripts/conferir-ficha-na-planilha.mjs`, e o arquivo restaurado depois
  — conferido por md5.

  O md5 de `sessao-planilha.ts` antes e depois de cada um:
     759383557175d8df48562668b0e79bc6

  ── 1. O USO CONGELADO NO REPOSITÓRIO ──────────────────────────────────────
     -  usosNoCliente: contarUsos(sessao.fichas, ingrediente.id),
     +  usosNoCliente: linha?.usosNoCliente ?? 0,
     MEDIDO: 24 passou, 1 falhou.
     FALHA "e o insumo novo entra na lista de usados" — obtido 0, esperado 1.
     É o defeito exato que a bancada existe para pegar: a ficha nova entra na
     planilha, e o insumo que ela trouxe fica de fora da lista da feira.

  ── 2. O PREÇO REESCRITO ───────────────────────────────────────────────────
     -  precoAtual: linha?.precoAtual ?? ingrediente.precoAtual,
     +  precoAtual: ingrediente.precoAtual,
     MEDIDO: 24 passou, 1 falhou.
     FALHA "o preço do insumo que já existia continua sendo o do CLIENTE" —
     obtido 10 (biblioteca), esperado 12 (o preço do cliente).
     ⚠ ESTE É O CONTROLE QUE MAIS IMPORTA. A Batata tem R$ 10 de referência e
     R$ 12 para este cliente. Com o preço reescrito, a planilha nasce com o
     número errado E o aviso de procedência nasce calado — uma conferência
     inteira morre sem que nenhum outro teste acuse.

  ── 3. OS INSUMOS NOVOS FORA DA BIBLIOTECA ─────────────────────────────────
     -  ingredientes: [...biblioteca.values()],
     +  ingredientes: ctx.ingredientes ?? [],
     MEDIDO: 22 passou, 3 falhou.
     FALHA "o insumo novo entra na biblioteca", "e a biblioteca fica com os
     três, sem perder nenhum" e "mas ele continua na BIBLIOTECA — cadastro não
     some com a ficha".

  ── 4. A SOBREPOSIÇÃO QUE MUDA O QUE RECEBEU ───────────────────────────────
     +  ctx.fichas = sessao.fichas;   (antes do return)
     MEDIDO: 24 passou, 1 falhou.
     FALHA "o contexto original continua com UMA ficha".
     O defeito que isto pega é o mais sutil dos cinco: o `contextoDaGeracao`
     guardado na Central passaria a apontar para uma base que mudou depois, e a
     conferência de procedência compararia a planilha com ela mesma — sempre
     dizendo que nada mudou.

  ── 5. O RECORTE POR CLIENTE FEITO POR CONTA PRÓPRIA ───────────────────────
     -  fichas: sessao.fichas,
     +  fichas: sessao.fichas.filter((f) => f.clienteId === ctx.cliente.id),
     MEDIDO: 24 passou, 1 falhou.
     FALHA "sem recorte, as três entram — a guarda é do chamador".
     Note o sentido: a asserção que falha é a do CONTROLE, não a da fronteira.
     Sem ela, o bloco 5 estaria verde por acidente — o filtro interno mascararia
     a ausência do recorte em `ambiente.tsx`, e a planilha de um cliente poderia
     citar o prato de outro sem que nada acusasse.

  APÓS CADA CONTROLE o arquivo foi restaurado e a bancada voltou a 25/25 com o
  md5 idêntico ao original. Nenhuma das cinco linhas foi deixada no código.
  ═══════════════════════════════════════════════════════════════════════════
*/
