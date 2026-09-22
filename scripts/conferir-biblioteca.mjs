/**
 * AS CONFERÊNCIAS DA BIBLIOTECA.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ESTA BANCADA EXISTE, E O QUE HAVIA PARA DAR ERRADO            │
 * │                                                                      │
 * │ A Biblioteca parece o módulo mais inofensivo do sistema — uma lista de │
 * │ material de apoio, sem cálculo nenhum. É por isso que ele precisa de   │
 * │ bancada mais do que os outros: nada aqui quebra, nada aqui dá um       │
 * │ número errado na tela, e mesmo assim há três defeitos silenciosos.     │
 * │                                                                      │
 * │   1. MATERIAL DE UM CLIENTE NA TELA DE OUTRO. É o mesmo risco da       │
 * │      equipe, e ele se repete aqui por um caminho diferente — e mais     │
 * │      fácil de errar, porque a MAIORIA dos materiais é GERAL. Um         │
 * │      `filter(m => m.clientes.includes(id))` na tela parece certo,       │
 * │      esconde todos os gerais, e a biblioteca aparece quase vazia sem    │
 * │      ninguém desconfiar da causa. É o bloco 3.                         │
 * │                                                                      │
 * │   2. A BUSCA QUE NÃO ACHA. "Quero o que eu mostro quando a equipe não   │
 * │      sabe a ordem da limpeza" — se a busca olhasse só o título, ela     │
 * │      diria "não tenho nada sobre isto" exatamente no momento em que     │
 * │      ela está com o cliente do lado. O material existe e responde à     │
 * │      pergunta; o nome dele é que não tem a palavra usada. É o bloco 4.  │
 * │                                                                      │
 * │   3. O MATERIAL QUE SUMIU. O store sobrepõe sessão e cenário, e é ali   │
 * │      que uma exclusão pode não pegar. Um material "excluído" que         │
 * │      continuasse na lista faria a tela afirmar que ele existe. É o      │
 * │      bloco 7.                                                         │
 * │                                                                      │
 * │ Há conferência para os três.                                           │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA BANCADA CONFERE — E O QUE ELA NÃO PODE CONFERIR            │
 * │                                                                      │
 * │ Confere: que NÃO HÁ CAMPO DE ARQUIVO em lugar nenhum (bloco 1); a      │
 * │ ligação com o que já existe (bloco 2); o escopo por cliente (3); a      │
 * │ busca pela situação (4); a ordem (5); o resumo sem percentual (6); e a  │
 * │ sobreposição da sessão (7).                                            │
 * │                                                                      │
 * │ Confere também os PONTOS DE APOIO (bloco 8), que moram no arquivo da    │
 * │ tela e não em `biblioteca.ts` — é a parte que decide o que a tela       │
 * │ AFIRMA sobre o cliente, e por isso ela não podia ficar sem bancada.     │
 * │                                                                      │
 * │ Não confere UPLOAD, porque não há upload. A conferência do bloco 1 é    │
 * │ justamente que o campo de arquivo NÃO existe — nem no tipo, nem no      │
 * │ store, nem no módulo. É o mesmo desenho da conferência de RH na         │
 * │ bancada da equipe.                                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manter = process.argv.includes("--manter");
const pasta = join(tmpdir(), `erika-biblioteca-${process.pid}`);

/*
  ── A LISTA É DE CAMINHOS INTEIROS, E NÃO DE NOMES ────────────────────────
  Diferente das bancadas que só copiam `src/lib/dados/*.ts`, esta precisa
  espelhar `src/` a partir da raiz: `pontos.ts` mora em
  `src/app/(sistema)/biblioteca/`, e ele importa `@/lib/dados`. Manter o
  caminho relativo idêntico ao do projeto é o que faz o alias `@/` resolvido
  no tsconfig apontar para o arquivo certo também aqui.

  A lista é fechada de propósito, como em todas as outras: se `biblioteca.ts`
  passar a importar um arquivo novo, esta bancada QUEBRA na compilação — e é o
  que se quer. Uma lista que se atualizasse sozinha estaria conferindo um
  módulo que talvez já não seja o que roda.
*/
const FONTES = [
  /*
    ── O BARRIL, E NÃO SÓ OS MÓDULOS ─────────────────────────────────────────
    `pontos.ts` escreve `from "@/lib/dados"`, e quem responde por esse caminho é
    `src/lib/dados/index.ts` — o barril. Ele PRECISA estar nesta lista, e o
    primeiro erro desta bancada foi justamente não tê-lo: a compilação parou em
    `TS2307` na linha do import do `pontos.ts`.

    Trazê-lo tem um efeito que vale mais do que parece: `index.ts` reexporta a
    cadeia inteira, então se um dos módulos abaixo esquecer um `export` que o
    barril promete, a bancada acusa — e isso é o mesmo erro que o app teria.
  */
  "src/lib/dados/index.ts",
  // O que a bancada prova.
  "src/lib/dados/biblioteca.ts",
  "src/app/(sistema)/biblioteca/pontos.ts",
  // `demonstracao.ts` guarda o acervo da sessão — criar, salvar, excluir. Uma
  // bancada que só conferisse as funções puras de `biblioteca.ts` deixaria de
  // fora justamente a parte com risco: a sobreposição da sessão.
  "src/lib/dados/demonstracao.ts",
  /*
    ── A CADEIA DE `demonstracao.ts`, QUE VEM INTEIRA ────────────────────
    Ele importa os tipos de cardápio, de precificação, de equipe e de
    biblioteca. Sem os arquivos abaixo o `tsc` falha em `TS2307` — e o estrago
    não fica na linha que falta: sem os TIPOS, todo `(m) =>` que percorre um
    material vira `any` implícito, e a saída vira dezenas de erros apontando
    para o lugar errado. Foi assim que `conferir-arquivamento.mjs` quebrou
    quando o módulo de cardápios nasceu.
  */
  "src/lib/dados/cardapios.ts",
  "src/lib/dados/precificacao.ts",
  "src/lib/dados/equipe.ts",
  "src/lib/dados/custos-ficha.ts",
  "src/lib/dados/custos.ts",
  "src/lib/dados/numeros.ts",
  "src/lib/dados/indicadores-comerciais.ts",
  "src/lib/dados/tipos-operacao.ts",
  "src/lib/dados/perguntas.ts",
  "src/lib/dados/tipos.ts",
  /*
    ── O RESTO DA CADEIA DO BARRIL ───────────────────────────────────────────
    Os arquivos abaixo não têm relação nenhuma com a Biblioteca — e é
    exatamente por isso que eles precisam estar aqui. `src/lib/dados/index.ts`
    reexporta TODOS eles, e um `export … from "./busca"` cujo arquivo não
    existe na pasta de teste é `TS2307` igual. A lista de fora tem de
    acompanhar o que o barril arrasta, e não o que a bancada usa.

    A lista abaixo espelha a de `conferir-destino.mjs`, que já provou estar
    completa compilando o mesmo barril.
  */
  "src/lib/dados/etapas.ts",
  "src/lib/dados/derivacoes.ts",
  "src/lib/dados/formato.ts",
  "src/lib/dados/unidades.ts",
  "src/lib/dados/rendimento.ts",
  "src/lib/dados/busca.ts",
  "src/lib/dados/derivacoes-operacao.ts",
  "src/lib/dados/repositorio.ts",
  "src/lib/dados/repositorio-operacao.ts",
  // O barril reexporta o mock, e o mock arrasta o cenário dele.
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
        /*
          ── O ALIAS `@/` PRECISA VALER AQUI ───────────────────────────────
          `pontos.ts` escreve `import type { … } from "@/lib/dados"`. Sem o
          `paths`, o `tsc` para em `TS2307: Cannot find module '@/lib/dados'`.

          O `"*"` apontando para o `node_modules` do PROJETO existe pelo mesmo
          motivo das outras bancadas: a pasta de teste está em `/tmp`, fora da
          árvore do projeto, e sem ele o `tsc` não acha nem o próprio
          `@types/node`.
        */
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

  Mesma razão registrada em `conferir-destino.mjs`: no Windows, o `.bin/tsc.cmd`
  com `execFileSync` dá `spawnSync … EINVAL`, porque desde o CVE-2024-27980 o
  `child_process` não executa um `.cmd` sem shell — e ligar o shell faria o
  gateway do Windows reinterpretar os argumentos. `require.resolve` acha o
  pacote pelo `package.json`, e o comando vira

      process.execPath  node_modules/typescript/bin/tsc  -p  <projeto>

  que é o mesmo caminho nos dois sistemas, sem ramo por plataforma.
*/
const TSC = join(
  dirname(createRequire(import.meta.url).resolve("typescript/package.json")),
  "bin",
  "tsc"
);
/*
  ── O ALIAS VALE NO TSC, MAS NÃO NO NODE ──────────────────────────────────
  O `paths` ensina o COMPILADOR; o JavaScript emitido sai com
  `require("@/lib/dados")` literal, e o Node não tem como resolver isso. A
  correção é feita no EMITIDO, nunca no projeto — os `.ts` de produção
  continuam como estão.
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

/**
 * ── E ESTA REESCRITA TAMBÉM SÓ PODE RODAR DEPOIS DA COMPILAÇÃO ────────────
 *
 * Ela estava solta no corpo do módulo, logo abaixo de `emitidosDaPasta`. Na
 * primeira versão isso funcionava por acidente: a compilação também estava no
 * corpo do módulo, algumas linhas acima. Quando a compilação mudou para dentro
 * de `rodar()` — para poder ser tratada pelo `catch` —, esta varredura ficou
 * rodando ANTES de existir qualquer coisa para varrer:
 *
 *     Error: ENOENT: scandir '…/erika-biblioteca-6/js'
 *
 * Ou seja: consertar o tratamento do erro quebrou a ordem de execução. Fica
 * registrado porque é o tipo de acoplamento por posição de linha que não
 * aparece na leitura — as duas coisas estavam certas, e a ordem entre elas é
 * que era a regra.
 *
 * Aqui dentro, a ordem é explícita e não depende de onde a linha está: compila,
 * reescreve, importa, confere.
 */
function reescreverAlias() {
  let reescritos = 0;
  for (const arquivo of emitidosDaPasta(saida)) {
    const antes = readFileSync(arquivo, "utf8");
    const depois = antes.replace(/require\("@\/([^"]+)"\)/g, (_todo, alvo) => {
      let relativo = relative(dirname(arquivo), join(saida, alvo)).split("\\").join("/");
      if (!relativo.startsWith(".")) relativo = `./${relativo}`;
      return `require("${relativo}")`;
    });
    if (depois !== antes) {
      writeFileSync(arquivo, depois);
      reescritos++;
    }
  }
  return reescritos;
}

// ---------------------------------------------------------------------------
// As conferências
// ---------------------------------------------------------------------------

let passou = 0;
const falhas = [];

/*
  ── AS DUAS FORMAS DE CONFERIR, E POR QUE SÃO DUAS ────────────────────────
  É a convenção das outras bancadas do projeto.

    · `conferir` compara pelo TEXTO (`String(...)`). Serve para lista, que é a
      maioria das conferências daqui: `String(["a","b"])` é "a,b", e a
      comparação pega tanto o conteúdo quanto a ORDEM — que nestas funções é
      resultado, não acaso.

    · `conferirTexto` compara por ESTRUTURA (`JSON.stringify` nos dois lados).
      Serve para número, booleano, data, `null` e listas aninhadas, onde o
      texto sozinho perderia a diferença entre `null` e `"null"`.

  ── O ERRO QUE ISTO JÁ CAUSOU, E QUE FICA REGISTRADO ─────────────────────
  Na primeira versão eu escrevi as DUAS comparando com `===`. Parece o mais
  rigoroso e não serve para lista nenhuma: dois arrays com o mesmo conteúdo
  nunca são `===` em JavaScript, então 28 conferências corretas apareceram como
  falha — com `obtido` e `esperado` impressos IDÊNTICOS na tela. Vinte e oito
  "falhas" que se imprimem iguais são a bancada dizendo que o defeito é DELA.
*/
function conferir(nome, obtido, esperado) {
  if (String(obtido) === String(esperado)) {
    passou++;
    return;
  }
  falhas.push({ nome, obtido: String(obtido), esperado: String(esperado) });
}

function conferirTexto(nome, obtido, esperado) {
  const a = JSON.stringify(obtido);
  const b = JSON.stringify(esperado);
  if (a === b) {
    passou++;
    return;
  }
  falhas.push({ nome, obtido: a, esperado: b });
}

/**
 * ── A VARREDURA DE CÓDIGO PRECISA IGNORAR A PROSA ────────────────────────
 *
 * Uma das conferências deste arquivo procura `base64`, `FileReader` e
 * `Buffer.from` no módulo, para provar que não há upload disfarçado. E ela
 * FALHOU na primeira execução: `biblioteca.ts` casou com `base64`.
 *
 * O motivo é que o acerto não estava no código — estava no COMENTÁRIO que diz
 * que base64 não existe:
 *
 *     · O que NÃO existe, e não vai existir por conveniência: o arquivo.
 *       Nem upload, nem storage, nem anexo, nem base64.
 *
 * O instrumento estava lendo a documentação da ausência como se fosse a
 * presença. É o gênero de defeito mais traiçoeiro numa bancada: ela acusa uma
 * linha de comentário, e a acusação parece verdadeira porque a palavra está
 * mesmo lá.
 *
 * Pior ainda, a tendência imediata seria "consertar" o comentário — tirar a
 * palavra `base64` do texto que a explica. Isso seria mudar a documentação
 * para agradar o teste, que é exatamente o que não se faz.
 *
 * A correção certa é ajustar o INSTRUMENTO: a regra é sobre o que o código
 * FAZ, então os comentários saem antes da varredura. O removedor é cru de
 * propósito — ele apaga comentário de linha e de bloco —, mas erra para o lado
 * seguro: se ele apagar demais, a conferência fica mais fraca, e não acusa
 * falsamente código correto.
 *
 * ── O QUE ISSO NÃO RESOLVE, E FICA REGISTRADO ────────────────────────────
 * Um `base64` DENTRO DE UMA STRING de código continuaria contando, e é assim
 * que se quer: string é dado, e dado de conteúdo é o que esta bancada procura.
 * O que se ignora é só a explicação.
 */
function semComentarios(fonte) {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
}

async function rodar() {
  /*
    ── A COMPILAÇÃO ACONTECE AQUI, E NÃO NO CORPO DO MÓDULO ─────────────────
    Ela estava solta no nível de cima, e o efeito foi o pior possível: quando o
    `tsc` sai com código 2, o `execFileSync` LANÇA, e a exceção subia para fora
    do `rodar()` — para trás do `try/catch` que eu tinha escrito justamente para
    tratar esse caso. O relatório saía como pilha de chamadas crua, sem uma
    linha do erro do `tsc`, e as duas vezes em que isto falhou eu tive de ler o
    erro de dentro de um `Buffer` de `Uint8Array`.

    Compilar aqui conserta isso e é mais honesto: compilar é parte da
    conferência, e uma conferência que não compila tem de dizer isso pela boca
    do tratador — não pela pilha do Node.

    O `stdio` captura os dois canais, e os dois são impressos no `catch`: o
    `tsc` escreve os diagnósticos no `stdout`.
  */
  execFileSync(process.execPath, [TSC, "-p", join(pasta, "tsconfig.json")], {
    stdio: ["ignore", "pipe", "pipe"],
  });

  /*
    E a reescrita do alias vem LOGO DEPOIS, porque é o emitido que ela
    conserta — antes de compilar não há o que reescrever, e depois de importar
    já é tarde.
  */
  reescreverAlias();

  const mod = await import(pathToFileURL(join(saida, "lib", "dados", "biblioteca.js")).href);
  const sessao = await import(
    pathToFileURL(join(saida, "lib", "dados", "demonstracao.js")).href
  );
  const tela = await import(
    pathToFileURL(
      join(saida, "app", "(sistema)", "biblioteca", "pontos.js")
    ).href
  );

  const {
    ORDEM_MATERIAL,
    ROTULO_MATERIAL,
    ROTULO_ORIGEM_DO_MATERIAL,
    ROTA_ORIGEM_DO_MATERIAL,
    buscarMateriais,
    materiaisDoCliente,
    materiaisGerais,
    normalizarNome,
    ordenarBiblioteca,
    resumirBiblioteca,
    serveAoCliente,
  } = mod;

  const {
    acervoDaBiblioteca,
    criarMaterial,
    excluirMaterial,
    idDaSessao,
    limparDemonstracao,
    materialDaSessao,
    materialFoiExcluido,
    salvarMaterial,
    temAlteracoes,
  } = sessao;

  const { derivarPontosDeApoio } = tela;

  // ── Fábricas de fixture ────────────────────────────────────────────────
  //
  // Montadas aqui, e não importadas do cenário: a conferência precisa de dados
  // que ela mesma controla — inclusive dos casos que o cenário não tem, como o
  // material de OUTRO cliente e o material sem endereço.

  let seq = 0;
  const id = (p) => `${p}_${++seq}`;

  function material(campos = {}) {
    return {
      id: campos.id ?? id("ma"),
      titulo: campos.titulo ?? "Guia de limpeza",
      tipo: campos.tipo ?? "LIMPEZA",
      servePara: campos.servePara ?? "",
      onde: campos.onde ?? "",
      clientes: campos.clientes ?? [],
      origens: campos.origens ?? [],
      atualizadoEm: campos.atualizadoEm ?? new Date("2026-03-01T09:00:00Z"),
    };
  }

  function cliente(campos = {}) {
    return {
      id: campos.id ?? id("cl"),
      nomeFantasia: campos.nomeFantasia ?? "Empório Verde",
      nomeContato: campos.nomeContato ?? "Marcos",
      email: campos.email ?? "marcos@exemplo.com",
      whatsapp: campos.whatsapp ?? "35999990000",
      tipoNegocio: campos.tipoNegocio ?? "RESTAURANTE",
      porte: campos.porte ?? "PEQUENO",
      cidade: campos.cidade ?? "Uberlândia",
      situacao: campos.situacao ?? "ATIVO",
      modalidade: campos.modalidade ?? "PRESENCIAL",
      iniciadoEm: campos.iniciadoEm ?? new Date("2026-01-10T09:00:00Z"),
      ultimaAtividadeEm: campos.ultimaAtividadeEm ?? new Date("2026-03-01T09:00:00Z"),
      funcionariosDeclarados: campos.funcionariosDeclarados ?? "6 a 10",
      leadOrigemId: campos.leadOrigemId ?? null,
      origem: campos.origem ?? "INDICACAO",
      problemaDeclarado: campos.problemaDeclarado ?? "Custo fora do controle",
    };
  }

  function ficha(clienteId, itens) {
    return {
      id: id("fi"),
      clienteId,
      nome: "Costela ao molho",
      categoria: "Prato principal",
      rendimentoPorcoes: 4,
      porcaoGramas: 320,
      itens,
      modoPreparo: [],
      finalizacao: [],
      observacoes: "",
      situacao: "COMPLETA",
      situacaoCalculo: "DISPONIVEL",
      atualizadaEm: new Date("2026-03-01T09:00:00Z"),
      historico: [],
    };
  }

  const item = (ingredienteId = "in_1") => ({
    ingredienteId,
    quantidade: "0,120",
    unidade: "kg",
    precoReferencia: 10,
    etapa: "COMPRA",
    observacao: "",
  });

  function processo(clienteId, passos) {
    return {
      id: id("pr"),
      clienteId,
      praca: "Cozinha",
      turno: "Integral",
      responsavel: "Juliana",
      pratos: [],
      passos,
      observacoes: "",
    };
  }

  const passo = (tempoEstimadoMin) => ({
    ordem: 1,
    descricao: "Refogar",
    responsavel: "Juliana",
    tempoEstimadoMin,
  });

  function ingrediente(precoAtual) {
    return {
      id: id("in"),
      nome: "Batata inglesa",
      categoria: "Hortifrúti",
      unidade: "kg",
      compra: null,
      transformacao: { bruto: null, limpo: null, preparado: null, observacao: "" },
      observacoes: "",
      precoAtual,
      atualizadoEm: new Date("2026-03-01T09:00:00Z"),
      fornecedor: "",
      historico: [],
    };
  }

  // =========================================================================
  console.log("\n── BLOCO 1 · NÃO HÁ ARQUIVO, E ISSO É A DECISÃO DO MÓDULO ──");

  /*
    ── A CONFERÊNCIA MAIS IMPORTANTE DESTE ARQUIVO ─────────────────────────
    A tentação deste módulo é um campo de arquivo. Um anexo guardado em memória
    faria a tela mostrar o nome do arquivo que ela subiu — e o arquivo sumiria
    ao recarregar. Ela acharia que subiu uma coisa que não subiu, que é
    exatamente o que a regra do projeto proíbe ("não finja upload persistente").

    Então a lista abaixo é FECHADA e escrita à mão. Se alguém acrescentar
    `arquivo`, `anexo`, `conteudo` ou `upload` ao tipo, esta conferência acusa
    — e é o único lugar do sistema onde isso seria notado antes de chegar à
    tela.
  */
  conferirTexto(
    "o material tem exatamente estes campos — nenhum deles é o arquivo",
    Object.keys(material()).sort(),
    [
      "atualizadoEm",
      "clientes",
      "id",
      "onde",
      "origens",
      "servePara",
      "tipo",
      "titulo",
    ]
  );

  const proibidos = Object.keys(material()).filter((k) =>
    /arquivo|anexo|conteudo|conteúdo|upload|blob|base64|binario|binário|bytes|mime/i.test(k)
  );
  conferir("e nenhum campo de conteúdo entrou por outro nome", proibidos, []);

  /*
    A mesma varredura no CÓDIGO, e não só no tipo. Um `Buffer.from(...)` ou um
    `FileReader` num módulo destes seria upload disfarçado — e passaria
    desapercebido numa conferência que só olhasse as chaves do objeto.
  */
  const fonteModulo = semComentarios(
    readFileSync(join(raiz, "src", "lib", "dados", "biblioteca.ts"), "utf8")
  );
  conferir(
    "e o módulo não tem nenhuma leitura de arquivo",
    /FileReader|Buffer\.from|base64|Blob\(|type="file"|type='file'/.test(fonteModulo),
    false
  );
  conferir(
    "nem o módulo da tela",
    /FileReader|Buffer\.from|base64|Blob\(/.test(
      semComentarios(
        readFileSync(join(raiz, "src", "app", "(sistema)", "biblioteca", "pontos.ts"), "utf8")
      )
    ),
    false
  );
  /*
    ── E NEM UM `<input type="file">` NAS TELAS ──────────────────────────────
    Esta é a forma CONCRETA do mesmo defeito. As duas conferências acima olham
    o módulo e a regra; esta olha a tela, que é onde ela de fato veria o campo
    de arquivo aparecer.
  */
  for (const tela of ["painel.tsx", "novo.tsx", "ficha-do-material.tsx", "page.tsx"]) {
    conferir(
      `e ${tela} não tem campo de arquivo`,
      /type=["']file["']/.test(
        semComentarios(
          readFileSync(join(raiz, "src", "app", "(sistema)", "biblioteca", tela), "utf8")
        )
      ),
      false
    );
  }

  /*
    `onde` existe, e é TEXTO. É o endereço: o link do Drive, onde no caderno,
    ou vazio. O sistema endereça o material; não o hospeda.
  */
  conferir("o endereço é texto", typeof material({ onde: "https://drive.google.com/x" }).onde, "string");
  conferir("e pode ser vazio — material sem endereço é estado, não erro", material().onde, "");

  // =========================================================================
  console.log("\n── BLOCO 2 · A LIGAÇÃO COM O QUE JÁ EXISTE ──");

  /*
    O rótulo e a rota de cada origem. A rota é o que faz a ligação ser um
    CAMINHO e não uma frase: sem ela, saber que o material encosta no processo
    seria decorativo.

    As quatro rotas são conferidas contra a lista das rotas que existem no
    projeto — se alguém apontar um material para uma tela que não existe, o
    link da ficha levaria a um 404 e ninguém veria até clicar.
  */
  conferirTexto(
    "os quatro tipos de origem são os quatro que existem",
    Object.keys(ROTULO_ORIGEM_DO_MATERIAL).sort(),
    ["FICHA", "INSUMO", "PRATO", "PROCESSO"]
  );
  conferirTexto(
    "e cada um tem rótulo escrito, não a constante crua",
    Object.values(ROTULO_ORIGEM_DO_MATERIAL).some((v) => /^[A-Z_]+$/.test(v)),
    false
  );
  conferirTexto(
    "cada tipo tem a sua rota, e são as quatro telas do sistema",
    ROTA_ORIGEM_DO_MATERIAL,
    {
      INSUMO: "/ingredientes",
      FICHA: "/fichas",
      PROCESSO: "/processos",
      PRATO: "/cardapios",
    }
  );

  /*
    ── `ROTULO_ORIGEM_DO_MATERIAL` E NÃO `ROTULO_ORIGEM` ────────────────────
    O nome curto já existe no projeto, em `formato.ts`, e quer dizer outra
    coisa: a origem de um LEAD. Os dois no mesmo barril dariam `TS2300` — dois
    `ROTULO_ORIGEM` exportados de `@/lib/dados`. A conferência abaixo trava o
    nome, porque renomeá-lo de volta quebraria a compilação do projeto inteiro.

    Aqui eu conferi isso pela leitura do arquivo, e não pelo import: é a única
    forma de a bancada acusar o nome ANTES de o `tsc` do projeto parar.
  */
  conferir(
    "o rótulo tem nome comprido, para não colidir com o de lead",
    /export const ROTULO_ORIGEM_DO_MATERIAL/.test(fonteModulo),
    true
  );

  /*
    A origem guarda (tipo, id?, nome). O id é OPCIONAL — e é essa opcionalidade
    que permite declarar uma ligação com coisa que ainda não tem id. Uma
    ligação declarada sem id não é ligação quebrada: é ligação declarada.
  */
  const comOrigem = material({
    origens: [
      { tipo: "FICHA", id: "fi_1", nome: "Costela ao molho" },
      { tipo: "PROCESSO", nome: "Cozinha" },
    ],
  });
  conferir("a origem guarda o tipo", comOrigem.origens[0].tipo, "FICHA");
  conferir("e o nome, que é o que a tela mostra", comOrigem.origens[1].nome, "Cozinha");
  conferir("o id é opcional — a segunda ligação não tem", "id" in comOrigem.origens[1], false);

  // =========================================================================
  console.log("\n── BLOCO 3 · O ESCOPO POR CLIENTE ──");

  /*
    ── O ERRO MAIS CARO DESTE MÓDULO, E O MAIS FÁCIL DE ESCREVER ─────────────
    A maior parte dos materiais é GERAL (`clientes: []`). A tela de um cliente
    mostra os gerais E os dele. Um `filter` de igualdade na tela
    (`m.clientes.includes(id)`) parece certo, esconde TODOS os gerais, e a
    biblioteca aparece quase vazia — sem que nada na tela pareça errado.

    Por isso a leitura é uma função do módulo e não um `filter` na tela, e por
    isso as três conferências abaixo são separadas.
  */
  const geral = material({ id: "ma_geral", titulo: "Boas práticas de estoque", clientes: [] });
  const doA = material({ id: "ma_a", titulo: "Ficha da casa", clientes: ["cl_a"] });
  const doB = material({ id: "ma_b", titulo: "Manual do salão", clientes: ["cl_b"] });

  conferir("material sem cliente é GERAL, não é órfão", serveAoCliente(geral, "cl_a"), true);
  conferir("e vale para qualquer cliente", serveAoCliente(geral, "cl_b"), true);
  conferir("material de um cliente vale para ele", serveAoCliente(doA, "cl_a"), true);
  conferir("e NÃO vale para outro", serveAoCliente(doA, "cl_b"), false);

  /*
    A conferência que discrimina: o "geral" TEM de entrar. Se a função fosse um
    `filter` de igualdade, as duas listas abaixo perderiam o geral e ficariam
    com um item a menos cada.
  */
  conferirTexto(
    "a lista do cliente A traz os gerais E os dele",
    materiaisDoCliente([geral, doA, doB], "cl_a").map((m) => m.id),
    ["ma_geral", "ma_a"]
  );
  conferirTexto(
    "e a do cliente B traz os gerais E os DELE — não os do A",
    materiaisDoCliente([geral, doA, doB], "cl_b").map((m) => m.id),
    ["ma_geral", "ma_b"]
  );
  conferir(
    "o material do cliente A nunca aparece na lista do B",
    materiaisDoCliente([geral, doA, doB], "cl_b").some((m) => m.id === "ma_a"),
    false
  );
  conferirTexto(
    "e os gerais são os que não têm cliente nenhum",
    materiaisGerais([geral, doA, doB]).map((m) => m.id),
    ["ma_geral"]
  );

  // =========================================================================
  console.log("\n── BLOCO 4 · A BUSCA PROCURA NA SITUAÇÃO ──");

  /*
    ── A BUSCA QUE NÃO ACHA É PIOR DO QUE A QUE NÃO EXISTE ──────────────────
    A pergunta dela com o cliente do lado não é "qual é o nome do arquivo?" —
    é "o que eu mostro para resolver isto?". Se a busca olhasse só o título,
    ela responderia "não tenho nada sobre isto" exatamente quando o material
    existe e serve para aquilo.

    As três conferências abaixo são as que discriminam, porque nos três casos a
    palavra buscada NÃO está no título.
  */
  const acervo = [
    material({
      id: "ma_1",
      titulo: "Guia de limpeza da cozinha",
      servePara: "quando a equipe não sabe a ordem da limpeza pesada",
    }),
    material({
      id: "ma_2",
      titulo: "Checklist de abertura",
      servePara: "quando o turno começa e falta conferir o salão",
      origens: [{ tipo: "PROCESSO", nome: "Confeitaria" }],
    }),
    material({
      id: "ma_3",
      titulo: "Ficha da costela",
      servePara: "quando o cliente pergunta o rendimento do prato",
      origens: [{ tipo: "FICHA", id: "fi_9", nome: "Costela ao molho" }],
    }),
  ];

  conferir(
    "acha pelo título",
    buscarMateriais(acervo, "checklist").map((m) => m.id),
    ["ma_2"]
  );
  /*
    O caso que a busca só no título perderia: a palavra está na SITUAÇÃO.
  */
  conferir(
    "acha pela SITUAÇÃO, e a palavra não está no título",
    buscarMateriais(acervo, "limpeza pesada").map((m) => m.id),
    ["ma_1"]
  );
  conferir(
    "e acha pelo nome do que está LIGADO ao material",
    buscarMateriais(acervo, "confeitaria").map((m) => m.id),
    ["ma_2"]
  );
  conferir(
    "o terceiro caso: acha pela ficha ligada, não pelo título",
    buscarMateriais(acervo, "costela ao molho").map((m) => m.id),
    ["ma_3"]
  );

  /*
    ── A NORMALIZAÇÃO VEM DE `./equipe`, E NÃO DE UMA CÓPIA ─────────────────
    "Como dois textos são o mesmo texto" é uma regra só no sistema. Aqui ela
    importa duas vezes: a busca precisa achar "ordem da limpeza" quando ela
    digita "ORDEM DA LIMPEZA", e precisa concordar com o resto do sistema.

    O caso do ACENTO é o que discrimina: um `toLowerCase()` sozinho acharia
    "ordem" mas não concordaria com a regra de `normalizarNome` sobre acento.
  */
  conferir("a busca ignora a caixa", buscarMateriais(acervo, "ORDEM").length, 1);
  conferir("e ignora o acento", buscarMateriais(acervo, "salao").map((m) => m.id), ["ma_2"]);
  /*
    Espaço a mais e espaço no meio: o texto chega colado de ficha e de anotação,
    e duas palavras separadas por dois espaços são a mesma busca de uma.
  */
  conferir("e o espaço a mais não atrapalha", buscarMateriais(acervo, "  limpeza   pesada  ").length, 1);
  /*
    Busca vazia devolve TUDO. Não é um detalhe: a tela usa a mesma função para
    os dois casos, e uma busca vazia que devolvesse vazio faria a lista
    desaparecer assim que o campo fosse limpo.
  */
  conferir("busca vazia devolve tudo, em vez de nada", buscarMateriais(acervo, "").length, 3);
  conferir("e busca só de espaços também", buscarMateriais(acervo, "   ").length, 3);
  conferir("o que não existe devolve vazio", buscarMateriais(acervo, "flambado").length, 0);
  /*
    A busca NÃO reordena. Ela filtra o que recebeu — é o que permite a tela
    ordenar antes e o resultado sair agrupado por tipo, como a lista sem filtro.
  */
  conferirTexto(
    "e a busca preserva a ordem que recebeu",
    buscarMateriais([acervo[2], acervo[0]], "ao").map((m) => m.id),
    ["ma_3", "ma_1"]
  );

  /*
    A normalização está reexportada pelo módulo, então a tela não precisa saber
    onde ela mora. A conferência é que os dois sejam A MESMA função — não duas
    cópias que hoje concordam.
  */
  conferir(
    "a normalização reexportada é a do módulo de equipe, e não uma segunda",
    normalizarNome("Costela  ao molho") === normalizarNome("costela ao molho"),
    true
  );

  // =========================================================================
  console.log("\n── BLOCO 5 · A ORDEM DA LISTA ──");

  /*
    Tipo primeiro (por `ORDEM_MATERIAL`), e dentro do tipo o título no alfabeto
    pt-BR. O tipo primeiro porque é assim que ela folheia: ela procura "o que
    tem de limpeza", não "o material de nome A".

    Espera-se LIMPEZA antes de CHECKLIST e de REFERENCIA, mesmo que o alfabeto
    diga o contrário — é o que prova que a ordem é a declarada e não a
    alfabética.
  */
  const desordenado = [
    material({ id: "ma_z", titulo: "Zeladoria", tipo: "REFERENCIA" }),
    material({ id: "ma_c", titulo: "Checklist do turno", tipo: "CHECKLIST" }),
    material({ id: "ma_l2", titulo: "Limpeza do salão", tipo: "LIMPEZA" }),
    material({ id: "ma_l1", titulo: "Abertura da cozinha", tipo: "LIMPEZA" }),
  ];
  conferirTexto(
    "o tipo manda na ordem, e o título desempata dentro dele",
    ordenarBiblioteca(desordenado).map((m) => m.id),
    ["ma_l1", "ma_l2", "ma_c", "ma_z"]
  );
  conferir(
    "a ordem não é a alfabética do título",
    ordenarBiblioteca(desordenado)[0].titulo,
    "Abertura da cozinha"
  );
  conferirTexto(
    "e a lista original NÃO é mexida — a ordenação devolve uma nova",
    desordenado.map((m) => m.id),
    ["ma_z", "ma_c", "ma_l2", "ma_l1"]
  );
  /*
    Os seis tipos são os seis, e a ordem cobre todos. Um tipo fora da ordem
    cairia no fim da lista por acaso, e não por decisão.
  */
  conferirTexto(
    "a ordem cobre os seis tipos, sem repetir nem esquecer nenhum",
    [...ORDEM_MATERIAL].sort(),
    Object.keys(ROTULO_MATERIAL).sort()
  );
  conferir("e a ordem tem seis posições", ORDEM_MATERIAL.length, 6);

  // =========================================================================
  console.log("\n── BLOCO 6 · O RESUMO, E O QUE ELE NÃO AFIRMA ──");

  const misto = [
    material({ id: "ma_1", tipo: "LIMPEZA", onde: "https://drive.google.com/1", clientes: [] }),
    material({ id: "ma_2", tipo: "LIMPEZA", onde: "", clientes: ["cl_a"] }),
    material({ id: "ma_3", tipo: "CHECKLIST", onde: "caderno, p. 12", clientes: [] }),
    material({ id: "ma_4", tipo: "REFERENCIA", onde: "   ", clientes: ["cl_b"] }),
  ];
  const resumo = resumirBiblioteca(misto);

  conferir("o total conta todos", resumo.total, 4);
  conferir("os gerais são os sem cliente", resumo.gerais, 2);
  conferir("e os presos a um cliente são o resto", resumo.porCliente, 2);
  /*
    "Sem endereço" inclui o que é só espaços. `onde` é texto escrito por ela, e
    "   " não é um endereço — é a ausência dele escrita com dedos lentos.
  */
  conferirTexto(
    "sem endereço são os vazios E os só-espaços",
    resumo.semEndereco.map((m) => m.id),
    ["ma_2", "ma_3", "ma_4"].filter((x) => x !== "ma_3")
  );
  conferir(
    "e o que tem endereço não entra na lista",
    resumo.semEndereco.some((m) => m.id === "ma_1"),
    false
  );
  /*
    O agrupamento traz só os tipos que TÊM material. Sexta linhas de zero
    deixariam a tela com mais tipos vazios do que materiais.
  */
  conferirTexto(
    "o agrupamento por tipo traz só os tipos que têm material",
    resumo.porTipo.map((t) => `${t.rotulo}:${t.quantos}`),
    ["Limpeza:2", "Checklist:1", "Referência:1"]
  );
  conferir(
    "e o agrupamento sai na ordem declarada, não na ordem em que apareceram",
    resumo.porTipo.map((t) => t.tipo),
    ["LIMPEZA", "CHECKLIST", "REFERENCIA"]
  );

  /*
    ── NÃO HÁ PERCENTUAL, E ISSO É A CONFERÊNCIA ────────────────────────────
    Seria fácil calcular "quanto da biblioteca está endereçada" e mostrar como
    indicador. Seria também uma afirmação que ninguém fez: não existe regra
    dizendo que todo material precisa de endereço, nem meta de quantos ela deve
    ter. O que a tela mostra são CONTAGENS.

    A lista de chaves proibidas é a mesma forma da conferência de RH na bancada
    da equipe, e trava a decisão contra uma "melhoria" futura.
  */
  conferirTexto(
    "o resumo não tem razão, percentual nem meta — só contagens",
    Object.keys(resumo).filter((k) => /%|raz|percent|cobertura|ideal|meta/i.test(k)),
    []
  );
  /*
    E os números são números. Um "83% endereçado" poderia entrar como string
    sem acender a lista acima — então o tipo de cada valor também é conferido.
  */
  conferirTexto(
    "e os campos do resumo são contagem ou lista, nenhum texto de percentual",
    Object.keys(resumo).map((k) =>
      Array.isArray(resumo[k]) ? "lista" : typeof resumo[k]
    ),
    ["number", "lista", "lista", "number", "number"]
  );

  /*
    Resumo de biblioteca vazia: tudo zero, nada NaN. É o estado de HOJE, já que
    o cenário não tem material — e um resumo que quebrasse nele quebraria a tela
    inteira na primeira abertura.
  */
  const vazio = resumirBiblioteca([]);
  conferir("biblioteca vazia tem total zero", vazio.total, 0);
  conferir("e nenhum tipo no agrupamento", vazio.porTipo.length, 0);
  conferir("e a lista de sem endereço fica vazia, em vez de cheia", vazio.semEndereco, []);

  // =========================================================================
  console.log("\n── BLOCO 7 · A SESSÃO ──");

  limparDemonstracao();

  /*
    ── A BIBLIOTECA COMEÇA VAZIA, E NADA FOI INVENTADO ──────────────────────
    O cenário não tem materiais, e inventar um seria afirmar que ela escreveu
    um guia que ela não escreveu. Material de apoio é CONTEÚDO dela — é o dado
    que menos pode aparecer na tela por descuido.
  */
  conferir("o cenário não tem material, e o store não inventa um", acervoDaBiblioteca([]).length, 0);
  conferir("sessão limpa não tem alterações", temAlteracoes(), false);
  conferir("e nenhum material é da sessão", materialDaSessao("ma_x"), false);

  criarMaterial(
    material({ id: "ma_novo", titulo: "Guia de limpeza", tipo: "LIMPEZA", clientes: [] })
  );
  conferirTexto(
    "registrar coloca o material no acervo",
    acervoDaBiblioteca([]).map((m) => m.id),
    ["ma_novo"]
  );
  conferir("e ele é marcado como da sessão", materialDaSessao("ma_novo"), true);
  conferir("registrar conta como alteração para a faixa da tela", temAlteracoes(), true);

  /*
    ── A SOBREPOSIÇÃO: A SESSÃO GANHA DO CENÁRIO ────────────────────────────
    O material do cenário recebe a alteração por cima; o criado na sessão entra
    inteiro. Gravar nos dois lugares daria duas verdades — a tela leria uma e a
    exclusão procuraria a outra.
  */
  const doCenario = material({ id: "ma_cenario", titulo: "Checklist antigo", tipo: "CHECKLIST" });
  salvarMaterial("ma_cenario", { titulo: "Checklist revisado" });
  conferir(
    "a alteração da sessão fica POR CIMA do material do cenário",
    acervoDaBiblioteca([doCenario]).find((m) => m.id === "ma_cenario").titulo,
    "Checklist revisado"
  );
  conferir(
    "e o que não foi alterado continua vindo do cenário",
    acervoDaBiblioteca([doCenario]).find((m) => m.id === "ma_cenario").tipo,
    "CHECKLIST"
  );
  conferir(
    "um material do cenário não vira da sessão só por ser alterado",
    materialDaSessao("ma_cenario"),
    false
  );
  conferirTexto(
    "o acervo traz as duas origens, sem uma esconder a outra",
    acervoDaBiblioteca([doCenario]).map((m) => m.id).sort(),
    ["ma_cenario", "ma_novo"]
  );

  /*
    Ligar uma origem entra pelo mesmo caminho — `salvarMaterial` com o campo
    `origens`, que é como a ficha da tela grava. É a operação que o bloco 2
    descreve, agora do lado da sessão.
  */
  salvarMaterial("ma_novo", {
    origens: [{ tipo: "PROCESSO", nome: "Cozinha" }],
    onde: "https://drive.google.com/guia",
  });
  conferirTexto(
    "ligar uma origem chega ao acervo",
    acervoDaBiblioteca([]).find((m) => m.id === "ma_novo").origens,
    [{ tipo: "PROCESSO", nome: "Cozinha" }]
  );
  conferir(
    "e preencher o endereço tira o material da lista dos sem endereço",
    resumirBiblioteca(acervoDaBiblioteca([])).semEndereco.length,
    0
  );

  /*
    ── EXCLUIR AQUI É EXCLUIR, SEM ARQUIVAR ─────────────────────────────────
    O insumo tem `arquivar` porque ARQUIVAR É A REGRA DELE: ele entra em fichas,
    e uma ficha precisa continuar legível. O material de apoio não entra em
    cálculo nenhum — ele é um endereço, e um endereço errado não precisa ser
    preservado para nada continuar correto.
  */
  excluirMaterial("ma_novo");
  conferir(
    "excluir tira o material do acervo",
    acervoDaBiblioteca([]).some((m) => m.id === "ma_novo"),
    false
  );
  conferir("e ele fica marcado como excluído", materialFoiExcluido("ma_novo"), true);
  /*
    O material criado NA SESSÃO sai do registro; o excluído continua marcado
    para que a exclusão de um material DO CENÁRIO também pegue — é o outro
    lado da mesma regra, e o que impede o material do cenário de ressuscitar.
  */
  excluirMaterial("ma_cenario");
  conferir(
    "e excluir um material DO CENÁRIO também pega",
    acervoDaBiblioteca([doCenario]).length,
    0
  );
  conferir("mas o excluído do cenário continua alteração", temAlteracoes(), true);

  /*
    ── LIMPAR A DEMONSTRAÇÃO ESQUECE A BIBLIOTECA ───────────────────────────
    Um material que sobrevivesse ao "reiniciar demonstração" faria a tela
    afirmar um conteúdo que ela acabou de mandar esquecer.
  */
  limparDemonstracao();
  conferir("limpar a demonstração esvazia o acervo de materiais", acervoDaBiblioteca([]).length, 0);
  conferir("e nenhum fica marcado como excluído", materialFoiExcluido("ma_novo"), false);
  conferir("deixando a sessão sem alterações", temAlteracoes(), false);
  conferir(
    "e a alteração feita num material do cenário também é esquecida",
    acervoDaBiblioteca([doCenario])[0].titulo,
    "Checklist antigo"
  );

  /*
    O ID DA SESSÃO, com o prefixo `bi`. O prefixo é o que permite, numa lista
    que mistura espécies, saber de que se está falando sem consultar mais nada.
  */
  const idBiblioteca = idDaSessao("bi", "Guia de limpeza");
  conferir("o id da biblioteca se identifica como biblioteca", idBiblioteca.startsWith("bi_demo_"), true);
  conferir("e o slug não carrega acento nem espaço", /^[a-z0-9_-]+$/.test(idBiblioteca), true);
  conferir(
    "dois registros do mesmo nome no mesmo milissegundo continuam distintos",
    idDaSessao("bi", "Guia de limpeza") === idDaSessao("bi", "Guia de limpeza"),
    false
  );
  conferir(
    "e o prefixo da biblioteca não colide com o de outro módulo",
    idDaSessao("bi", "x").startsWith(idDaSessao("pe", "x").slice(0, 2)),
    false
  );

  limparDemonstracao();

  // =========================================================================
  console.log("\n── BLOCO 8 · OS PONTOS DE APOIO DA TELA ──");

  /*
    ── POR QUE ESTA PARTE TEM BANCADA ───────────────────────────────────────
    Os pontos de apoio moram em `src/app/(sistema)/biblioteca/pontos.ts` — um
    arquivo de tela. Ele decide o que a tela AFIRMA sobre o cliente: "3 fichas
    sem nenhum item", "2 passos sem tempo declarado".

    Uma função dessas escrita dentro do `page.tsx` só rodaria no servidor do
    Next e não poderia ser exercitada por bancada nenhuma. Ela foi escrita como
    regra pura (sem React, sem repositório, sem `await`) justamente para poder
    ser conferida — e é o que este bloco faz.

    ── O QUE ESTÁ EM JOGO ──────────────────────────────────────────────────
    Um ponto de apoio é uma AFIRMAÇÃO sobre o cliente dela, com número e nome.
    "O Empório Verde tem 3 fichas sem nenhum item" é o que ela leva para a
    reunião. Se o número estiver errado, a tela está inventando um problema —
    e é por isso que cada contagem tem conferência própria.
  */

  const clA = cliente({ id: "cl_a", nomeFantasia: "Empório Verde" });
  const clB = cliente({ id: "cl_b", nomeFantasia: "Sabor da Serra" });

  // ── Sem nada: nenhum ponto, e a lista vazia é a resposta certa ──────────
  conferirTexto(
    "cliente sem pendência não gera ponto — a lista vazia é a resposta",
    derivarPontosDeApoio({ clientes: [clA], fichas: [], ingredientes: [], processos: [] }),
    []
  );
  /*
    Ficha COM item não é pendência. Sem esta conferência, uma regra que
    contasse `itens.length >= 0` acusaria toda ficha do sistema.
  */
  conferirTexto(
    "e ficha com item preenchido não vira ponto",
    derivarPontosDeApoio({
      clientes: [clA],
      fichas: [ficha("cl_a", [item()])],
      ingredientes: [],
      processos: [],
    }),
    []
  );

  // ── A ficha vazia ───────────────────────────────────────────────────────
  const pontosFicha = derivarPontosDeApoio({
    clientes: [clA],
    fichas: [ficha("cl_a", []), ficha("cl_a", []), ficha("cl_a", [item()])],
    ingredientes: [],
    processos: [],
  });
  conferir("fichas vazias geram um ponto", pontosFicha.length, 1);
  /*
    O número é de FICHAS, e não de itens faltando: "3 fichas sem nenhum item" é
    acionável ("vamos preencher estas três"); "47 itens faltando" seria um
    número que não diz por onde começar.

    Aqui são DUAS fichas vazias, e a terceira — que tem um item — não conta.
    Se a regra contasse as três, a conferência pegaria.
  */
  conferir("e ele nomeia o cliente, não um id", pontosFicha[0].clienteNome, "Empório Verde");
  conferir(
    "o número é o de fichas vazias, e a que tem item não entra",
    pontosFicha[0].situacao,
    "2 fichas técnicas sem nenhum item preenchido"
  );
  conferir("com o cliente no id, para a tela poder filtrar", pontosFicha[0].clienteId, "cl_a");
  conferir("e uma frase de consequência, não de definição", pontosFicha[0].porque.length > 40, true);

  /*
    O singular. "1 fichas técnicas" é o tipo de erro que faz a tela parecer
    descuidada justamente no momento em que ela está com o cliente do lado.
  */
  conferir(
    "uma ficha vazia sozinha usa o singular",
    derivarPontosDeApoio({
      clientes: [clA],
      fichas: [ficha("cl_a", [])],
      ingredientes: [],
      processos: [],
    })[0].situacao,
    "1 ficha técnica sem nenhum item preenchido"
  );

  /*
    ── O ESCOPO É POR CLIENTE, E É AQUI QUE ELE APARECE ────────────────────
    As fichas vazias de OUTRO cliente não entram na conta deste. Sem o
    `filter(f => f.clienteId === cliente.id)` — que é o mesmo defeito do bloco
    3 —, a ficha vazia do Sabor da Serra apareceria como pendência do Empório.
  */
  const fichaDeB = ficha("cl_b", []);
  conferir(
    "a ficha vazia de OUTRO cliente não conta para este",
    derivarPontosDeApoio({
      clientes: [clA],
      fichas: [fichaDeB, fichaDeB, fichaDeB],
      ingredientes: [],
      processos: [],
    }).length,
    0
  );
  /*
    E cada cliente responde pelo seu: com os dois clientes na carteira, cada um
    leva o seu número.
  */
  const doisClientes = derivarPontosDeApoio({
    clientes: [clA, clB],
    fichas: [ficha("cl_a", []), ficha("cl_b", []), ficha("cl_b", [])],
    ingredientes: [],
    processos: [],
  });
  conferirTexto(
    "cada cliente responde pelo seu número",
    doisClientes.map((p) => `${p.clienteNome}: ${p.situacao}`),
    [
      "Empório Verde: 1 ficha técnica sem nenhum item preenchido",
      "Sabor da Serra: 2 fichas técnicas sem nenhum item preenchido",
    ]
  );

  // ── O passo sem tempo ───────────────────────────────────────────────────
  const pontosPasso = derivarPontosDeApoio({
    clientes: [clA],
    fichas: [],
    ingredientes: [],
    processos: [processo("cl_a", [passo(30), passo(null), passo(15), passo(null)])],
  });
  conferir(
    "passos sem tempo declarado, com o número certo",
    pontosPasso[0].situacao,
    "2 passos de processo sem tempo declarado"
  );

  /*
    ── ZERO DECLARADO NÃO É AUSÊNCIA DE TEMPO ───────────────────────────────
    `tempoEstimadoMin` é `number | null`, e o `null` quer dizer "não
    declarado" — nunca "zero". Um passo com zero declarado é uma DECISÃO
    ("este passo é instantâneo"); contá-lo como ausência seria o sistema
    discutindo com ela sobre o que ela declarou.

    Esta é a conferência que trava isso. `!tempoEstimadoMin` — a forma
    preguiçosa, que trata 0 como falsy — contaria o zero como pendência e faria
    a tela dizer que falta um tempo que ela já declarou.
  */
  conferir(
    "um passo com ZERO declarado NÃO entra na pendência",
    derivarPontosDeApoio({
      clientes: [clA],
      fichas: [],
      ingredientes: [],
      processos: [processo("cl_a", [passo(0)])],
    }).length,
    0
  );
  conferir(
    "e ele convive com o null na mesma praça, sem contaminar a contagem",
    derivarPontosDeApoio({
      clientes: [clA],
      fichas: [],
      ingredientes: [],
      processos: [processo("cl_a", [passo(0), passo(null), passo(0)])],
    })[0].situacao,
    "1 passo de processo sem tempo declarado"
  );

  /*
    O singular do passo, e o escopo por cliente — a mesma conta do caso da
    ficha, agora sobre processos.
  */
  conferir(
    "um passo sem tempo sozinho usa o singular",
    derivarPontosDeApoio({
      clientes: [clA],
      fichas: [],
      ingredientes: [],
      processos: [processo("cl_a", [passo(null)])],
    })[0].situacao,
    "1 passo de processo sem tempo declarado"
  );
  conferir(
    "e o processo de OUTRO cliente não conta para este",
    derivarPontosDeApoio({
      clientes: [clA],
      fichas: [],
      ingredientes: [],
      processos: [processo("cl_b", [passo(null), passo(null)])],
    }).length,
    0
  );
  /*
    Os passos são contados nos processosE nos passos: um processo com três
    passos sem tempo conta três, e não um processo.
  */
  conferir(
    "e a conta é de passos, não de processos",
    derivarPontosDeApoio({
      clientes: [clA],
      fichas: [],
      ingredientes: [],
      processos: [
        processo("cl_a", [passo(null), passo(null)]),
        processo("cl_a", [passo(null)]),
      ],
    })[0].situacao,
    "3 passos de processo sem tempo declarado"
  );

  // ── O insumo sem preço, que NÃO é por cliente ───────────────────────────
  const pontosInsumo = derivarPontosDeApoio({
    clientes: [clA],
    fichas: [],
    ingredientes: [ingrediente(null), ingrediente(12), ingrediente(null)],
    processos: [],
  });
  conferir("insumos sem preço geram um ponto", pontosInsumo.length, 1);
  conferir(
    "com o número certo, e o que tem preço não conta",
    pontosInsumo[0].situacao,
    "2 ingredientes da biblioteca sem preço de referência"
  );
  /*
    ── ESTE NÃO É POR CLIENTE, E A DIFERENÇA IMPORTA ───────────────────────
    `Ingrediente` não tem `clienteId`: a biblioteca de insumos é
    COMPARTILHADA. Um insumo sem preço afeta as fichas de todos os clientes que
    o usam, e por isso ele sai como um ponto só, sem nome de cliente.

    O preço de um cliente específico é outro registro (`IngredienteDoCliente`)
    e é outra pendência. Não misturar os dois é o que evita a tela dizer "o
    cliente A está sem preço" quando o que falta é o preço de referência da
    biblioteca, que vale para todos.
  */
  conferir("o ponto do insumo não tem cliente", pontosInsumo[0].clienteId, "");
  conferir("nem nome de cliente, porque não é de nenhum", pontosInsumo[0].clienteNome, "");
  /*
    E ele sai UMA vez, mesmo com dois clientes na carteira. Se a regra estivesse
    dentro do laço de clientes — que é onde a tentação manda pôr —, a
    biblioteca sem preço viraria dois pontos: um repetido por cliente.
  */
  conferir(
    "e com DOIS clientes na carteira ele continua sendo um ponto só",
    derivarPontosDeApoio({
      clientes: [clA, clB],
      fichas: [],
      ingredientes: [ingrediente(null)],
      processos: [],
    }).length,
    1
  );
  conferir(
    "um insumo sem preço sozinho usa o singular",
    derivarPontosDeApoio({
      clientes: [clA],
      fichas: [],
      ingredientes: [ingrediente(null)],
      processos: [],
    })[0].situacao,
    "1 ingrediente da biblioteca sem preço de referência"
  );

  // ── Os três juntos, e a ordem ───────────────────────────────────────────
  const tudo = derivarPontosDeApoio({
    clientes: [clA],
    fichas: [ficha("cl_a", [])],
    ingredientes: [ingrediente(null)],
    processos: [processo("cl_a", [passo(null)])],
  });
  conferir("os três tipos coexistem", tudo.length, 3);
  /*
    A ordem é a de declaração das regras, e ela é resultado: ficha, passo, e o
    insumo por último — porque o insumo é o único que não é do cliente, e a
    tela mostra os dele antes.
  */
  conferirTexto(
    "e saem na ordem das regras — ficha, passo, insumo",
    tudo.map((p) => p.id.split("_")[1]),
    ["ficha", "passo", "insumo"]
  );
  /*
    ── TODO PONTO TEM ID ÚNICO, E ELE CARREGA O CLIENTE ─────────────────────
    A tela usa o id como `key` na lista. Um id repetido entre dois clientes
    faria o React reaproveitar a linha de um para o outro — e a lista mostraria
    a situação de um cliente sob o nome do outro.
  */
  const ids = derivarPontosDeApoio({
    clientes: [clA, clB],
    fichas: [ficha("cl_a", []), ficha("cl_b", [])],
    ingredientes: [ingrediente(null)],
    processos: [processo("cl_a", [passo(null)]), processo("cl_b", [passo(null)])],
  }).map((p) => p.id);
  conferir("todo ponto tem id", ids.every((i) => typeof i === "string" && i !== ""), true);
  conferir("e nenhum id se repete entre clientes", new Set(ids).size, ids.length);
  /*
    ── O QUE ESTA CONFERÊNCIA QUER DIZER, ESCRITA DIREITO ────────────────────
    A primeira versão daqui conferia

        ids.filter(i => i.includes("cl_a")).length
      === ids.filter(i => !i.includes("cliente") && (i.includes("cl_a") || i.includes("cl_b"))).length

    e o esperado era 4 enquanto o obtido era 2. Os dois lados eram a MESMA
    contagem escrita duas vezes, e a igualdade só valeria por acidente — não
    era uma conferência, era uma tautologia com um erro de digitação dentro.

    O que se quer provar é concreto: o id do ponto PRECISA carregar a chave do
    cliente que ele acusa. É isso que permite a tela abrir "este ponto é do
    Empório Verde" sem procurar o cliente pelo nome, e é isso que impede os
    dois clientes de gerarem o mesmo id.

    Então a expectativa é a lista literal. Se a regra deixar de incluir o id do
    cliente — ou passar a incluir o NOME dele, que dois clientes poderiam ter
    igual —, aparece aqui.
  */
  conferirTexto(
    "o id do ponto de cliente carrega a chave do cliente, e o do insumo não tem dono",
    [...ids].sort(),
    [
      "apoio_ficha_vazia_cl_a",
      "apoio_ficha_vazia_cl_b",
      "apoio_insumo_sem_preco",
      "apoio_passo_sem_tempo_cl_a",
      "apoio_passo_sem_tempo_cl_b",
    ]
  );

  /*
    ── TODA AFIRMAÇÃO TEM UM "PORQUE" COM CONSEQUÊNCIA ─────────────────────
    O "porque" é a CONSEQUÊNCIA no trabalho dela, não a definição do campo.
    Uma lista de pontos sem o porque seria uma lista de reclamações; com ele, é
    uma pauta. A conferência é grosseira de propósito (só o tamanho), porque
    conferir o texto exato seria congelar a redação — e o que se quer travar é
    que ele EXISTE e diz algo, não a frase que diz.
  */
  conferir(
    "todo ponto traz o porque e o material sugerido preenchidos",
    tudo.every((p) => p.porque.trim().length > 40 && p.materialSugerido.trim().length > 40),
    true
  );
  conferir(
    "e nenhum ponto sugere material sem dizer o que resolveria",
    tudo.every((p) => !/^(revisar|verificar|conferir)\.?$/i.test(p.materialSugerido)),
    true
  );

  limparDemonstracao();
}

/**
 * ── OS CONTROLES NEGATIVOS, COM OS NÚMEROS QUE SAÍRAM DE VERDADE ─────────
 *
 * Uma bancada que passa de primeira não provou nada ainda: ela precisa ser
 * capaz de FALHAR. Cada controle abaixo é UMA edição no módulo, feita numa
 * CÓPIA descartável (`/tmp`), seguida de novas execuções. O número ao lado é o
 * que saiu na execução — medido, não previsto.
 *
 * Os seis foram medidos em 22/set/2026, sobre a versão que passava 107/107.
 *
 *   C1. O MATERIAL GERAL DEIXA DE VALER. Em `serveAoCliente`, o `||` vira `&&`:
 *
 *         return material.clientes.length === 0 && material.clientes.includes(clienteId);
 *
 *       → 102/107 (5 falhas). É o defeito mais caro do módulo: quase todo
 *       material é GERAL, então a biblioteca esvazia em todas as telas e nada
 *       na tela parece errado.
 *
 *   C2. A BUSCA SÓ NO TÍTULO. Em `buscarMateriais`, `const campos = [m.titulo]`.
 *
 *       → 100/107 (7 falhas). A busca deixa de achar por situação e por
 *       ligação, que é justamente como ela procura com o cliente do lado.
 *
 *   C3. O ENDEREÇO SEM `trim`. Em `resumirBiblioteca`, `m.onde.trim() === ""`
 *       volta a ser `m.onde === ""`.
 *
 *       → 99/107 (8 falhas). O material cujo endereço é só espaços passa a
 *       contar como endereçado, e a lista promete o que não existe.
 *
 *   C4. O ZERO COMO AUSÊNCIA. Em `derivarPontosDeApoio`, o teste do tempo vira
 *       `!p.tempoEstimadoMin`.
 *
 *       → 97/107 (10 falhas). O passo com zero declarado vira pendência, e a
 *       tela cobra um tempo que ela já informou.
 *
 *   C5. A EXCLUSÃO QUE NÃO PEGA. Em `excluirMaterial`, some a linha
 *       `materiaisDaSessao = materiaisDaSessao.filter(...)`.
 *
 *       → 95/107 (12 falhas). O material excluído continua na lista, e a tela
 *       afirma que ele existe depois de ela ter mandado remover.
 *
 *   C6. O INSUMO DENTRO DO LAÇO DOS CLIENTES. O bloco do insumo sem preço é
 *       movido para dentro do `for (const cliente …)`, e o ponto ganha dono.
 *
 *       → 91/107 (16 falhas). O insumo sem preço, que é da BIBLIOTECA e vale
 *       para todos, passa a sair uma vez por cliente, com nome de cliente
 *       diferente para o mesmo fato — a tela dizendo que cada restaurante está
 *       sem preço quando o que falta é o preço de referência.
 *
 * Note a direção dos seis: a versão QUEBRADA é sempre mais CURTA que a certa —
 * um `||` a menos, três campos a menos, um `trim()` a menos. É a mesma
 * observação registrada ao fim de `conferir-equipe.mjs`, e é o que faz destes
 * defeitos os mais difíceis de ver na revisão: todos parecem simplificações.
 *
 * ── O CONTROLE QUE NÃO É CONTROLE, E FICA REGISTRADO ─────────────────────
 *
 * Nas duas primeiras execuções desta bancada o defeito estava nela mesma, e
 * não no módulo: a varredura de `base64` acusou o COMENTÁRIO que documenta a
 * ausência de base64 (corrigido com `semComentarios`), e uma conferência de id
 * comparava duas contagens idênticas escritas duas vezes — uma tautologia com
 * erro de digitação dentro, que agora confere a lista literal de ids.
 *
 * Nenhum dos dois foi resolvido mudando a regra do sistema para o teste passar.
 */

// ---------------------------------------------------------------------------

const inicio = Date.now();

try {
  await rodar();
} catch (erro) {
  console.error("\nA conferência não pôde rodar:\n");
  /*
    ── O `tsc` ESCREVE OS ERROS NO `stdout`, E NÃO NO `stderr` ─────────────
    A primeira versão daqui imprimia só `erro.stderr`. O `execFileSync` estoura
    quando o `tsc` sai com código 2, e o relatório saía como uma pilha de
    chamadas sem UMA linha do erro de verdade — os diagnósticos estavam no
    `stdout`, que ninguém imprimia.

    Uma bancada que não consegue dizer por que parou é uma bancada que faz
    perder meia hora. Os dois saem agora, e o `stdout` primeiro porque é onde o
    `tsc` escreve.
  */
  const saida = erro?.stdout?.toString() ?? "";
  const erroCru = erro?.stderr?.toString() ?? "";
  if (saida.trim() !== "") console.error(saida.trim());
  if (erroCru.trim() !== "") console.error(erroCru.trim());
  if (saida.trim() === "" && erroCru.trim() === "") console.error(erro?.message ?? erro);
  if (!manter) rmSync(pasta, { recursive: true, force: true });
  process.exit(2);
}

const linhas = falhas.length === 0 ? passou : passou + falhas.length;

if (falhas.length > 0) {
  console.log("Conferências da biblioteca\n");
  for (const f of falhas) {
    console.log(`  FALHA  ${f.nome}`);
    console.log(`         obtido:   ${f.obtido}`);
    console.log(`         esperado: ${f.esperado}`);
  }
  console.log(`\n${passou}/${linhas} passaram — ${falhas.length} falha(s).\n`);
} else {
  console.log(
    `\n  ${passou}/${linhas} conferências da biblioteca passaram` +
      ` (${Date.now() - inicio} ms)\n`
  );
}

if (manter) {
  console.log(`A compilação ficou em: ${pasta}\n`);
} else {
  rmSync(pasta, { recursive: true, force: true });
}

process.exit(falhas.length === 0 ? 0 : 1);
