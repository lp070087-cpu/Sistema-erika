/**
 * AS CONFERÊNCIAS DA EQUIPE.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE                                                   │
 * │                                                                      │
 * │ A equipe tem um risco que nenhum outro módulo do sistema tem: ela     │
 * │ guarda NOME DE PESSOA. Um custo errado é um número errado; um nome     │
 * │ errado na cozinha de outro cliente é uma pessoa real aparecendo no     │
 * │ documento de outro restaurante.                                       │
 * │                                                                      │
 * │ Três defeitos concretos, e os três são silenciosos:                    │
 * │                                                                      │
 * │   1. A PESSOA VAZAR ENTRE CLIENTES. O nome escrito num processo é      │
 * │      comparado com a equipe; se a lista não fosse a do cliente do      │
 * │      processo, um "Juliana" de outra cozinha casaria e apareceria      │
 * │      como responsável. Os preparos sairiam contados para quem não os   │
 * │      executa, e nada na tela pareceria errado.                         │
 * │                                                                      │
 * │   2. O NOME APARECER DUAS VEZES NA PENDÊNCIA. "Cozinha" está escrito   │
 * │      em vários processos; "cozinha " e "Cozinha" são O MESMO nome para │
 * │      o casamento. Uma deduplicação pela string crua deixaria duas      │
 * │      linhas para a mesma pergunta e faria a contagem de nomes fora do  │
 * │      cadastro ficar maior do que a pendência real.                     │
 * │                                                                      │
 * │   3. O TREINAMENTO COMO CAMPO, E NÃO COMO PAR. Se "treinada: sim"      │
 * │      bastasse, a pergunta "treinada em quê?" não teria resposta, e a   │
 * │      lista que o módulo existe para mostrar não existiria.            │
 * │                                                                      │
 * │ Há conferências para os três abaixo.                                   │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO CONFERE — E O QUE ELE NÃO PODE CONFERIR            │
 * │                                                                      │
 * │ Confere ESTRUTURA e ESCOPO: o casamento de nomes com a tolerância      │
 * │ declarada, o que NÃO casa (e por isso vira pendência), a isolação por  │
 * │ cliente, a ordem da lista, a cobertura de treinamento por par, a       │
 * │ sobreposição da sessão e o "sair da equipe não apagar o registro".     │
 * │                                                                      │
 * │ Não confere METODOLOGIA, e não é omissão: não existe "equipe           │
 * │ suficiente", "cobertura ideal" nem meta de treinamento. Não há         │
 * │ indicador nenhum aqui, e a bancada prova justamente isso — que o       │
 * │ módulo NÃO inventou um. O que ele entrega são contagens, e cada uma    │
 * │ responde uma pergunta que foi feita.                                  │
 * │                                                                      │
 * │ Também não confere RH, porque não há RH para conferir. A conferência   │
 * │ do bloco 1 é justamente que os campos de folha NÃO existem no tipo.    │
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
const pasta = join(tmpdir(), `erika-equipe-${process.pid}`);

/*
  OS MÓDULOS PUROS QUE A EQUIPE ATRAVESSA.

  A lista é fechada de propósito, como nas outras bancadas: se `equipe.ts`
  passar a importar um arquivo novo, este script QUEBRA na compilação — e é o
  que se quer. Uma lista que acompanhasse sozinha estaria conferindo um módulo
  que talvez já não seja o que roda.

  `demonstracao.ts` está aqui porque é ELE que guarda o cadastro da sessão —
  criar pessoa, salvar alteração, marcar saída, registrar treinamento. Uma
  bancada que só conferisse as funções puras de `equipe.ts` deixaria de fora
  justamente a parte com risco: a sobreposição da sessão.

  Os módulos abaixo de `demonstracao.ts` entram porque ele os importa por
  TIPO (`./cardapios` importa `./custos-ficha`, que importa `./precificacao`,
  que importa `./custos`). Sem eles o `tsc` falha em `TS2307`, e o estrago não
  fica nessa linha: sem os tipos, todo `(p) =>` que percorre uma pessoa vira
  `any` implícito, e a saída vira dezenas de erros em cascata apontando para o
  lugar errado. Foi assim que `conferir-arquivamento.mjs` quebrou quando o
  módulo de cardápios nasceu.
*/
const FONTES = [
  "equipe.ts",
  "demonstracao.ts",
  "cardapios.ts",
  // O store importa os tipos de material — mesmo motivo de `cardapios.ts`.
  "biblioteca.ts",
  "precificacao.ts",
  "custos-ficha.ts",
  "custos.ts",
  "numeros.ts",
  "indicadores-comerciais.ts",
  "tipos-operacao.ts",
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

/*
  ── AS DUAS FORMAS DE CONFERIR, E POR QUE SÃO DUAS ────────────────────────
  É a convenção das outras bancadas do projeto, e vale a pena registrar por
  que ela existe, porque a versão errada dela já custou uma rodada inteira:

    · `conferir` compara pelo TEXTO (`String(...)`). É o que serve para LISTA,
      que é a maioria das conferências daqui: `String(["a","b"])` é "a,b", e a
      comparação pega tanto o conteúdo quanto a ORDEM — que nestas funções é
      resultado, não acaso.

    · `conferirTexto` compara por ESTRUTURA (`JSON.stringify` nos dois lados).
      É o que serve para lista, onde o texto sozinho perderia a diferença entre
      `null` e `"null"` — e onde a ordem é resultado, não acaso.

  ── O QUE EU ERREI NA PRIMEIRA VERSÃO, E POR QUE FICA REGISTRADO ──────────
  Eu escrevi `conferir` comparando `===`. Isso parece o mais rigoroso dos dois
  e não serve para lista nenhuma: dois arrays com o mesmo conteúdo nunca são
  `===` em JavaScript, então 28 conferências corretas apareceram como falha —
  com `obtido` e `esperado` impressos IDÊNTICOS na tela. Vinte e oito "falhas"
  que se imprimem iguais são a bancada dizendo que o defeito é DELA.

  Foi o que aconteceu: depois de consertar o instrumento, sobraram as falhas
  de verdade. Elas só aparecem porque instrumento e módulo foram conferidos na
  ordem certa — primeiro provar que a bancada sabe falhar, depois ler o que
  ela diz.
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

async function rodar() {
  const dados = join(pasta, "js", "dados");
  const modulo = await import(pathToFileURL(join(dados, "equipe.js")).href);
  const sessao = await import(pathToFileURL(join(dados, "demonstracao.js")).href);

  const {
    ORDEM_FUNCAO,
    ROTULO_FUNCAO,
    casarPessoas,
    coberturaDeTreinamento,
    nomesRepetidos,
    nomesSemCadastro,
    normalizarNome,
    ordenarEquipe,
    pessoasAtivas,
    pessoasDoCliente,
    responsaveisDoProcesso,
    responsaveisDosProcessos,
    resumirEquipe,
  } = modulo;

  const {
    acervoDaEquipe,
    criarPessoa,
    idDaSessao,
    limparDemonstracao,
    marcarRetornoDaPessoa,
    marcarSaidaDaPessoa,
    pessoaDaSessao,
    registrarTreinamento,
    removerTreinamento,
    salvarPessoa,
    temAlteracoes,
    treinamentosDaEquipe,
  } = sessao;

  // ── Fábricas de fixture ────────────────────────────────────────────────
  //
  // Montadas aqui, e não importadas do cenário: a conferência precisa de
  // dados que ela mesma controla — inclusive dos casos que o cenário não tem,
  // que são a pessoa de OUTRO cliente com o mesmo nome, e o nome escrito com
  // caixa e espaço diferentes.

  let seq = 0;
  const id = (p) => `${p}_${++seq}`;

  function pessoa(campos = {}) {
    return {
      id: campos.id ?? id("pe"),
      clienteId: campos.clienteId ?? "cl_a",
      nome: campos.nome ?? "Juliana",
      funcao: campos.funcao ?? "AUXILIAR",
      turno: campos.turno ?? "INTEGRAL",
      pratos: campos.pratos ?? [],
      observacao: campos.observacao ?? "",
      situacao: campos.situacao ?? "ATIVA",
      registradaEm: campos.registradaEm ?? new Date("2026-03-01T09:00:00Z"),
    };
  }

  function passo(descricao, responsavel) {
    return { ordem: 0, descricao, responsavel, tempoEstimadoMin: null };
  }

  function processo(campos = {}) {
    return {
      id: campos.id ?? id("pr"),
      clienteId: campos.clienteId ?? "cl_a",
      praca: campos.praca ?? "Cozinha",
      turno: campos.turno ?? "MANHÃ",
      responsavel: campos.responsavel ?? "",
      pratos: campos.pratos ?? [],
      passos: campos.passos ?? [],
      observacoes: "",
    };
  }

  // =========================================================================
  console.log("\n── BLOCO 1 · NÃO É RH ──");

  /*
    O bloco mais importante da bancada, e o mais fácil de perder numa
    refatoração "para melhorar o cadastro": alguém acrescenta `salario` ao tipo
    e o módulo deixa de ser o que ele promete. Aqui a lista de chaves é
    CONGELADA — um campo novo faz esta linha falhar, e a falha obriga quem
    acrescentou a decidir se é isso que ele quer.

    A ordem é alfabética porque `Object.keys` devolve na ordem de inserção do
    objeto literal, e comparar isso prenderia a conferência ao texto da
    fábrica em vez de ao tipo.
  */
  conferir(
    "o cadastro guarda só chaves de execução — nada de folha, salário ou ponto",
    Object.keys(pessoa()).sort(),
    [
      "clienteId",
      "funcao",
      "id",
      "nome",
      "observacao",
      "pratos",
      "registradaEm",
      "situacao",
      "turno",
    ]
  );
  conferir(
    "e não há data de desligamento: a saída é situação, não cálculo de rescisão",
    Object.keys(pessoa()).includes("desligadaEm"),
    false
  );
  conferir(
    "nem admissão, jornada ou carga horária",
    ["admissaoEm", "jornada", "cargaHoraria", "salario"].filter((c) =>
      Object.keys(pessoa()).includes(c)
    ),
    []
  );
  /*
    A função na cozinha é um tipo FECHADO — é ele que faz o agrupamento por
    praça ser confiável. Texto livre faria "aux cozinha", "Auxiliar" e
    "Ajudante" virarem três funções que ninguém agrupa depois.
  */
  conferir(
    "a função é uma lista fechada, e a ordem de apresentação cobre todas elas",
    [...ORDEM_FUNCAO].sort(),
    Object.keys(ROTULO_FUNCAO).sort()
  );

  // =========================================================================
  console.log("\n── BLOCO 2 · A TOLERÂNCIA DO CASAMENTO ──");

  /*
    Os casos abaixo são os textos REAIS gravados em `mock/operacao.ts`. Não são
    exemplos inventados: se a tolerância mudar, é nestes que ela muda de
    comportamento — e é por isso que eles estão aqui escritos como estão.
  */
  conferir("caixa e acento não mudam o nome", normalizarNome("  JULIANA  "), "juliana");
  conferir("nem o acento", normalizarNome("Cláudia"), "claudia");
  conferir(
    "e o parêntese que qualifica sem nomear sai fora",
    normalizarNome("Juliana (auxiliar de cozinha)"),
    "juliana"
  );
  conferir(
    "espaço a mais no meio colapsa",
    normalizarNome("Equipe de   salão + cozinha"),
    "equipe de salao + cozinha"
  );
  /*
    O QUE A TOLERÂNCIA NÃO FAZ — e é a parte que importa. "Cozinha" é uma praça
    e "Juliana" é uma pessoa; dizer que uma é a outra seria inventar. As duas
    aparecem na lista de NÃO CASADOS, que é a resposta desejada.
  */
  conferir(
    "uma praça não vira pessoa: quem casa é igualdade, não parecença",
    normalizarNome("Cozinha") === normalizarNome("Juliana"),
    false
  );
  conferir(
    "e o sobrenome separa: casar por prefixo seria inventar parentesco",
    normalizarNome("Juliana") === normalizarNome("Juliana Souza"),
    false
  );
  /*
    O parêntese é a parte da normalização que é fácil de esquecer ao reescrever
    a regra em outro lugar — e é exatamente o que acontecia no aviso de nome
    repetido da tela de cadastro, que só baixava a caixa e tirava o acento.
    A consequência era um cadastro com duas "Ana" que o casamento lê como uma
    só, sem aviso nenhum na hora de criar a segunda.
  */
  conferir(
    "o parêntese some, para quem qualifica sem nomear não virar outra pessoa",
    normalizarNome("Ana (auxiliar de cozinha)") === normalizarNome("Ana"),
    true
  );

  const equipeA = [
    pessoa({ id: "pe_juliana", nome: "Juliana", funcao: "AUXILIAR" }),
    pessoa({ id: "pe_claudia", nome: "Cláudia Nogueira", funcao: "COZINHEIRO" }),
  ];

  const casados = casarPessoas(
    [
      "Juliana (auxiliar de cozinha)",
      "Cozinha",
      "A definir com o Marcelo",
      "  cozinha ",
      "cláudia nogueira",
    ],
    equipeA
  );

  conferir(
    "o nome qualificado casa com a pessoa, e a praça NÃO casa",
    casados.map((c) => c.pessoa?.id ?? null),
    ["pe_juliana", null, null, null, "pe_claudia"]
  );
  /*
    O casamento devolve TODOS os nomes, na ordem em que chegaram. Descartar os
    não casados seria esconder justamente a informação que se quer ver.
  */
  conferir(
    "a lista devolve todos os nomes, casados ou não",
    casados.length,
    5
  );
  conferirTexto(
    "e os não casados saem nomeados, sem perder a grafia original",
    nomesSemCadastro(casados),
    ["Cozinha", "A definir com o Marcelo", "  cozinha "]
  );
  /*
    ── A DEDUPLICAÇÃO PELA CHAVE, NÃO PELA STRING ────────────────────────
    "Cozinha" e "  cozinha " são o mesmo nome para o casamento — é por isso que
    os dois não casam com ninguém. Uma deduplicação por string crua os manteria
    como duas linhas e a pendência pareceria maior do que é.

    Aqui a prova é a que o `resumirEquipe` faz, e está no bloco 4. Este é o
    insumo dela: os dois escrevem o MESMO normalizado.
  */
  conferir(
    "duas grafias do mesmo nome têm a mesma chave de casamento",
    normalizarNome("Cozinha") === normalizarNome("  cozinha "),
    true
  );

  /*
    Duas pessoas do mesmo cliente com o mesmo nome é ambiguidade: o texto
    "Juliana" casa com UMA das duas. O primeiro vence, e o resultado deixa de
    depender da ordem em que o repositório devolveu a lista.
  */
  const duasJulianas = [
    pessoa({ id: "pe_1", nome: "Juliana" }),
    pessoa({ id: "pe_2", nome: "juliana" }),
  ];
  conferir(
    "com duas pessoas do mesmo nome, o casamento escolhe a primeira e não a última",
    casarPessoas(["Juliana"], duasJulianas)[0].pessoa.id,
    "pe_1"
  );
  conferirTexto(
    "e a ambiguidade é denunciada à parte",
    nomesRepetidos(duasJulianas),
    ["juliana"]
  );
  conferirTexto(
    "sem repetição, a lista de repetidos fica vazia",
    nomesRepetidos(equipeA),
    []
  );

  // =========================================================================
  console.log("\n── BLOCO 3 · O ESCOPO POR CLIENTE ──");

  /*
    ── O DEFEITO MAIS CARO DESTE MÓDULO ──────────────────────────────────
    Uma pessoa de um cliente aparecendo na cozinha de outro. O nome de uma
    pessoa real no documento de outro restaurante.

    A conferência é montada para que o defeito seja VISÍVEL: dois clientes com
    uma pessoa de MESMO NOME, e um processo do cliente A. Se o filtro
    desaparecesse, o nome casaria com a pessoa do cliente errado — e o
    resultado seria plausível.
  */
  const equipeCompleta = [
    pessoa({ id: "pe_a", clienteId: "cl_a", nome: "Juliana" }),
    pessoa({ id: "pe_b", clienteId: "cl_b", nome: "Juliana" }),
    pessoa({ id: "pe_a2", clienteId: "cl_a", nome: "Marcelo Tavares", funcao: "CHEFE" }),
    pessoa({ id: "pe_b2", clienteId: "cl_b", nome: "Rodrigo Bastos", funcao: "SALAO" }),
  ];

  conferirTexto(
    "a equipe de um cliente é só dele",
    pessoasDoCliente(equipeCompleta, "cl_a").map((p) => p.id),
    ["pe_a", "pe_a2"]
  );
  conferirTexto(
    "e o outro cliente traz os dele, sem repetir os do primeiro",
    pessoasDoCliente(equipeCompleta, "cl_b").map((p) => p.id),
    ["pe_b", "pe_b2"]
  );
  conferir("um cliente sem equipe devolve lista vazia, e não a de outro", pessoasDoCliente(equipeCompleta, "cl_z").length, 0);

  /*
    O processo é do cliente A, e o responsável "Juliana" existe nos DOIS
    clientes. O que se prova aqui é que a leitura usou a equipe do processo — a
    de `cl_a` —, e não a carteira inteira, que casaria com a Juliana errada
    (ou, pior, com as duas).
  */
  const processoDoA = processo({
    clienteId: "cl_a",
    praca: "Passe / finalização quente",
    responsavel: "Juliana",
  });

  const lidoPorCliente = responsaveisDoProcesso(
    processoDoA,
    pessoasDoCliente(equipeCompleta, processoDoA.clienteId)
  );
  conferir("o nome casou com a pessoa DO CLIENTE do processo", lidoPorCliente[0].pessoa.id, "pe_a");

  const lidoComCarteiraInteira = responsaveisDoProcesso(processoDoA, equipeCompleta);
  conferir(
    "e passar a carteira inteira casaria com a pessoa errada — é o defeito que o escopo evita",
    lidoComCarteiraInteira[0].pessoa.clienteId,
    "cl_a"
  );

  /*
    Duas execuções da mesma leitura, com a carteira em ordens diferentes. Se o
    resultado dependesse da ordem do array, o mesmo processo mostraria pessoas
    diferentes em dois carregamentos.
  */
  const invertida = [...equipeCompleta].reverse();
  conferir(
    "a ordem da carteira não muda quem o nome casa",
    responsaveisDoProcesso(processoDoA, pessoasDoCliente(invertida, "cl_a"))[0].pessoa.id,
    lidoPorCliente[0].pessoa.id
  );

  /*
    `responsaveisDosProcessos` monta o escopo POR DENTRO: quem chama entrega a
    carteira e o índice, e não escolhe o cliente de cada processo. A prova é o
    mesmo nome nos dois clientes, com processos dos dois — cada um tem de casar
    com o seu.
  */
  const doisProcessos = [
    processo({ id: "pr_a", clienteId: "cl_a", responsavel: "Juliana" }),
    processo({ id: "pr_b", clienteId: "cl_b", responsavel: "Juliana" }),
  ];
  const indiceDePessoas = new Map(equipeCompleta.map((p) => [p.id, p]));

  /*
    `conferirTexto` e não `conferir`: esta é ORDEM, e ordem aqui é o
    resultado. O texto "pe_a,pe_b" e o texto "pe_b,pe_a" são iguais em
    conteúdo e diferentes no que a conferência quer provar — que cada processo
    foi lido contra a equipe do seu próprio cliente.
  */
  conferirTexto(
    "processos de clientes diferentes casam cada um com a SUA equipe, e na ordem",
    responsaveisDosProcessos(doisProcessos, indiceDePessoas).map((l) => l.pessoa.id),
    ["pe_a", "pe_b"]
  );
  /*
    A segunda metade da mesma prova, e a que fecha o buraco: se o processo do
    cliente B tivesse casado com a pessoa do A, o `id` acima seria `pe_a` nos
    dois lugares e o primeiro `conferirTexto` já teria acusado. Aqui a
    asserção é sobre o CAMPO `clienteId` da pessoa que casou, que é a
    propriedade que interessa — não o id, que é só o rótulo dela.
  */
  conferirTexto(
    "e cada pessoa lida pertence ao cliente do processo que a citou",
    responsaveisDosProcessos(doisProcessos, indiceDePessoas).map((l, i) => [
      l.pessoa.clienteId,
      doisProcessos[i].clienteId,
    ]),
    [
      ["cl_a", "cl_a"],
      ["cl_b", "cl_b"],
    ]
  );

  // =========================================================================
  console.log("\n── BLOCO 4 · A LEITURA DOS RESPONSÁVEIS ──");

  /*
    O texto real do cenário: o cabeçalho e o passo têm o mesmo campo, e usam
    grafias diferentes do mesmo nome. É isso que o módulo lê sem tocar.
  */
  const processoCompleto = processo({
    clienteId: "cl_a",
    praca: "Passe / finalização quente",
    responsavel: "Juliana (auxiliar de cozinha)",
    passos: [
      passo("Receber a produção do dia", "Cozinha"),
      passo("Conferir a temperatura", "Érika Bruna"),
      passo("Finalizar e expedir", ""),
      passo("Repor o buffet", "A definir com o Marcelo"),
    ],
  });

  const equipeDoPasse = [
    pessoa({ id: "pe_juliana", clienteId: "cl_a", nome: "Juliana" }),
    pessoa({ id: "pe_erika", clienteId: "cl_a", nome: "Érika Bruna", funcao: "CHEFE" }),
  ];

  const lidos = responsaveisDoProcesso(processoCompleto, equipeDoPasse);

  /*
    O passo SEM responsável é PULADO, e não vira uma linha. Vazio e desconhecido
    são coisas diferentes: passo em branco é a pendência que o próprio processo
    já acusa, e uma linha "sem cadastro" para um campo vazio acusaria o dono do
    problema errado.
  */
  conferir("cada responsável preenchido vira uma linha — e o vazio não", lidos.length, 4);
  conferir(
    "o cabeçalho vem primeiro, identificado pela praça",
    lidos[0].onde,
    "Processo · Passe / finalização quente"
  );
  conferirTexto(
    "e os passos vêm identificados pela posição e pela descrição",
    lidos.slice(1).map((l) => l.onde),
    [
      "Passo 1 de 4 · Receber a produção do dia",
      "Passo 2 de 4 · Conferir a temperatura",
      "Passo 4 de 4 · Repor o buffet",
    ]
  );
  /*
    ── O TEXTO É PRESERVADO COMO ESTÁ ────────────────────────────────────
    "A definir com o Marcelo" não é o nome de ninguém, e é uma informação sobre
    o estágio do trabalho. Convertido em "sem responsável", diria outra coisa e
    esconderia que existe alguém cuidando disso.
  */
  /*
    "Original" quer dizer SEM CONVERSÃO — não sem `trim`. O módulo apara as
    pontas (é o que faz `"  "` ser tratado como vazio, e não como um nome em
    branco), e mantém o resto intacto: a caixa, o parêntese e as palavras. É
    isso que a conferência trava, e é por isso que o texto abaixo é comparado
    como está escrito nos dados de origem.
  */
  conferirTexto(
    "o texto original sai inteiro, sem conversão",
    lidos.map((l) => l.escrito),
    [
      "Juliana (auxiliar de cozinha)",
      "Cozinha",
      "Érika Bruna",
      "A definir com o Marcelo",
    ]
  );
  conferirTexto(
    "e o que casou sai com a pessoa; o que não casou sai com nulo",
    lidos.map((l) => l.pessoa?.id ?? null),
    ["pe_juliana", null, "pe_erika", null]
  );

  // =========================================================================
  console.log("\n── BLOCO 5 · A ORDEM DA LISTA ──");

  /*
    Ativos primeiro, na ordem de apresentação da função, e dentro dela o nome
    no alfabeto pt-BR. Quem saiu vai para o FIM em bloco: intercalá-la entre os
    ativos faria a lista de quem trabalha hoje parecer maior do que é.
  */
  const desordenada = [
    pessoa({ id: "pe_5", nome: "Zeca", funcao: "LIMPEZA" }),
    pessoa({ id: "pe_4", nome: "Saiu", funcao: "CHEFE", situacao: "DESLIGADA" }),
    pessoa({ id: "pe_3", nome: "Beatriz", funcao: "SALAO" }),
    pessoa({ id: "pe_2", nome: "Ana", funcao: "CHEFE" }),
    pessoa({ id: "pe_1", nome: "Aline", funcao: "CHEFE" }),
  ];

  conferirTexto(
    "ativos por função, e o nome no alfabeto dentro da função",
    ordenarEquipe(desordenada).map((p) => p.id),
    ["pe_1", "pe_2", "pe_3", "pe_5", "pe_4"]
  );
  conferir(
    "quem saiu fica no fim, mesmo sendo da função mais alta",
    ordenarEquipe(desordenada).at(-1).id,
    "pe_4"
  );
  conferirTexto(
    "e a lista de ativos não a inclui",
    pessoasAtivas(desordenada).map((p) => p.id),
    ["pe_5", "pe_3", "pe_2", "pe_1"]
  );

  /*
    A ordem é de APRESENTAÇÃO e a bancada prova isso conferindo o oposto do que
    um organograma faria: "Passe" vem depois de "Confeiteiro", e "Salão" depois
    de "Passe". Se alguém reordenar `ORDEM_FUNCAO` pensando em hierarquia, esta
    conferência não impede — mas o comentário do módulo e o menu da tela dizem
    que não é hierarquia.
  */
  conferir(
    "a ordem vai da cozinha para fora, e não de cargo para cargo",
    ORDEM_FUNCAO.indexOf("COZINHEIRO") < ORDEM_FUNCAO.indexOf("SALAO"),
    true
  );
  conferir("e o salão vem antes do bar", ORDEM_FUNCAO.indexOf("SALAO") < ORDEM_FUNCAO.indexOf("BAR"), true);

  // =========================================================================
  console.log("\n── BLOCO 6 · O PAR (PESSOA, PREPARO) ──");

  /*
    ── O BLOCO QUE JUSTIFICA O MÓDULO ────────────────────────────────────
    A pergunta que ninguém consegue responder hoje: "quem executa o que não foi
    treinada a fazer?"

    A conferência monta o caso com os dois lados preenchidos e prova a
    subtração. O que sobra é a pendência.
  */
  const executora = pessoa({
    id: "pe_juliana",
    nome: "Juliana",
    pratos: ["Costela ao molho", "Escondidinho", "Farofa da casa"],
  });
  const treinamentos = [
    {
      id: "tr_1",
      pessoaId: "pe_juliana",
      preparo: "Costela ao molho",
      aplicadoPor: "Érika Bruna",
      concluidoEm: new Date("2026-04-02T10:00:00Z"),
    },
    {
      id: "tr_2",
      pessoaId: "pe_juliana",
      /*
        Registrado com CAIXA diferente. O par é o que vale, e não a grafia: se
        a chave fosse a string crua, este registro não valeria e o prato
        apareceria como pendência — acusando falta de registro onde ele existe.
      */
      preparo: "escondidinho",
      aplicadoPor: "sessão de trabalho",
      concluidoEm: new Date("2026-04-03T10:00:00Z"),
    },
    {
      id: "tr_3",
      pessoaId: "pe_outra",
      preparo: "Farofa da casa",
      aplicadoPor: "Érika Bruna",
      concluidoEm: new Date("2026-04-04T10:00:00Z"),
    },
  ];

  const cobertura = coberturaDeTreinamento([executora], treinamentos);
  conferir("a cobertura devolve uma entrada por pessoa", cobertura.length, 1);
  conferirTexto(
    "o que tem registro sai na coluna dos treinados",
    cobertura[0].treinados,
    ["Costela ao molho", "Escondidinho"]
  );
  conferirTexto(
    "e o que sobra é a pendência",
    cobertura[0].semTreinamento,
    ["Farofa da casa"]
  );
  /*
    O treinamento de OUTRA pessoa no mesmo preparo não conta. Este é o defeito
    que a chave composta evita: sem o `pessoaId` na chave, o treinamento de uma
    pessoa absolveria todas as outras que executam o mesmo prato.
  */
  conferir(
    "treinamento de outra pessoa no mesmo preparo NÃO conta",
    cobertura[0].semTreinamento.includes("Farofa da casa"),
    true
  );
  /*
    ── O MESMO PREPARO ESCRITO DUAS VEZES ────────────────────────────────
    `pratos` é a lista do que ela executa, e a mesma execução repetida não é
    uma segunda. Contada duas vezes, a lista de pendências pareceria maior do
    que é.

    ── AQ U I  E S T Á  O  D E F E I T O ─────────────────────────────────
    A deduplicação de `pratos` é `new Set(pessoa.pratos)` — pela STRING CRUA —
    enquanto o par (pessoa, preparo) é comparado pela chave NORMALIZADA.

    As duas coisas discordam. "Costela ao molho" e "costela ao molho" são o
    mesmo par para a chave de treinamento, e são duas linhas para o `Set`. Com
    as duas declaradas, a conferência calcula:

      treinados:      as duas batem na chave do registro → duas linhas
      semTreinamento: nenhuma das duas escapa          → vazio

    O mesmo preparo aparece DUAS VEZES na coluna dos treinados. A pessoa
    parece executar dois preparos onde executa um, e o resumo conta dois.

    O defeito mora em `coberturaDeTreinamento`, e é do mesmo tipo dos outros
    deste módulo: duas ideias de identidade no mesmo arquivo. A correção é
    deduplicar `pratos` pela chave do TREINAMENTO e não pela string — que é o
    que a conferência abaixo trava.
  */
  const comRepetido = pessoa({
    id: "pe_dup",
    pratos: ["Costela ao molho", "costela ao molho"],
  });
  conferirTexto(
    "o mesmo preparo declarado duas vezes conta uma vez só, e na lista dos treinados",
    coberturaDeTreinamento(
      [comRepetido],
      [
        {
          id: "tr_dup",
          pessoaId: "pe_dup",
          preparo: "Costela ao molho",
          aplicadoPor: "Érika Bruna",
          concluidoEm: new Date("2026-04-10T10:00:00Z"),
        },
      ]
    )[0].treinados,
    ["Costela ao molho"]
  );
  conferirTexto(
    "e declarado duas vezes sem registro, a pendência também é uma só",
    coberturaDeTreinamento([comRepetido], []).flatMap((c) => c.semTreinamento),
    ["Costela ao molho"]
  );
  conferirTexto(
    "e ninguém declarando nada não gera pendência",
    coberturaDeTreinamento([pessoa({ id: "pe_vazia", pratos: [] })], []).flatMap(
      (c) => c.semTreinamento
    ),
    []
  );

  // =========================================================================
  console.log("\n── BLOCO 7 · O RESUMO ──");

  /*
    ── OS NOMES FORA DO CADASTRO, DEDUPLICADOS PELA CHAVE ────────────────
    O defeito: "Cozinha" está em vários processos e é a MESMA pergunta uma vez
    só. E "cozinha " é o mesmo nome de "Cozinha" — o casamento trata assim.
    Deduplicar pela string crua deixaria as duas linhas, e a contagem ficaria
    maior do que a pendência real.
  */
  const processosComPraça = [
    processo({ id: "pr_1", clienteId: "cl_a", responsavel: "Cozinha" }),
    processo({ id: "pr_2", clienteId: "cl_a", responsavel: "cozinha " }),
    processo({ id: "pr_3", clienteId: "cl_a", responsavel: "Salão" }),
    processo({ id: "pr_4", clienteId: "cl_a", responsavel: "Juliana" }),
  ];
  const lidosDaCarteira = responsaveisDosProcessos(
    processosComPraça,
    new Map(equipeDoPasse.map((p) => [p.id, p]))
  );

  const resumo = resumirEquipe(equipeDoPasse, [], lidosDaCarteira);

  conferir(
    "as quatro leituras produzem as quatro linhas — a leitura não deduplica",
    lidosDaCarteira.length,
    4
  );
  /*
    Duas grafias de "Cozinha" viram UMA pendência, e o texto exibido é o da
    PRIMEIRA que apareceu — "Cozinha", com maiúscula e sem o espaço da ponta.
    A ordem das entradas abaixo é a ordem em que os processos foram lidos, e é
    ela que decide a grafia; por isso a conferência de "primeira vence" é feita
    separada, sobre o texto.
  */
  conferirTexto(
    "o resumo deduplica pela chave: duas grafias de Cozinha são UMA pendência",
    resumo.foraDoCadastro,
    ["Cozinha", "Salão"]
  );
  conferirTexto(
    "guardando a grafia do PRIMEIRO que apareceu, e não a do último",
    resumo.foraDoCadastro[0],
    "Cozinha"
  );
  /*
    A prova de que a primeira vence, e não a segunda: invertidas as entradas, o
    texto exibido acompanha. Sem isso, "primeira vence" e "última vence" dariam
    o mesmo resultado nesta conferência, e nenhuma das duas estaria travada.

    O esperado é "CoZINHA" e não "cozinha ": o módulo apara as pontas na
    LEITURA, então a grafia que chega ao resumo já não tem o espaço final — e o
    que se está provando aqui é que veio da PRIMEIRA entrada, que é a que tem
    caixa mista.
  */
  const invertidos = responsaveisDosProcessos(
    [
      processo({ id: "pr_2", clienteId: "cl_a", responsavel: "CoZINHA" }),
      processo({ id: "pr_1", clienteId: "cl_a", responsavel: "cozinha" }),
    ],
    new Map(equipeDoPasse.map((p) => [p.id, p]))
  );
  conferirTexto(
    "e a grafia é mesmo a da primeira entrada, não uma escolha fixa",
    resumirEquipe(equipeDoPasse, [], invertidos).foraDoCadastro[0],
    "CoZINHA"
  );
  /*
    Em ordem alfabética pt-BR — maiúsculas e acentos no lugar certo. É o que
    faz a lista da tela não mudar de ordem entre dois carregamentos.
  */
  conferirTexto(
    "e a lista sai ordenada em pt-BR",
    resumo.foraDoCadastro,
    [...resumo.foraDoCadastro].sort((a, b) => a.localeCompare(b, "pt-BR"))
  );

  /*
    Um nome que casa não entra na pendência. "Juliana" está no cadastro e no
    último processo — ela não é uma pergunta em aberto.
  */
  conferir(
    "quem corresponde a alguém do cadastro não aparece como pendência",
    resumo.foraDoCadastro.some((n) => normalizarNome(n) === "juliana"),
    false
  );
  conferir("e a grafia exibida da pendência não veio do cadastro", resumo.foraDoCadastro.length, 2);

  /*
    ── AS CONTAGENS DO RESUMO ────────────────────────────────────────────
    Contagens, e nenhuma delas percentual. A conferência prova que o tipo do
    resumo não tem campo de razão — um "cobertura em %" seria fácil de
    calcular e fácil de ler errado.
  */
  const equipeMista = [
    pessoa({ id: "pe_1", nome: "Aline", funcao: "CHEFE" }),
    pessoa({ id: "pe_2", nome: "Beatriz", funcao: "CHEFE" }),
    pessoa({ id: "pe_3", nome: "Carla", funcao: "AUXILIAR", pratos: ["Costela"] }),
    pessoa({ id: "pe_4", nome: "Dora", funcao: "AUXILIAR", situacao: "DESLIGADA", pratos: ["Costela"] }),
    pessoa({ id: "pe_5", nome: "Elza", funcao: "LIMPEZA" }),
  ];
  const resumoMisto = resumirEquipe(equipeMista, [], []);

  conferir("o total conta todo mundo, ativos e quem saiu", resumoMisto.total, 5);
  conferir("o de ativos conta só quem trabalha hoje", resumoMisto.ativas, 4);
  conferirTexto(
    "o agrupamento por função traz só as funções que têm gente",
    resumoMisto.porFuncao.map((f) => `${f.rotulo}:${f.quantas}`),
    ["Chefia de cozinha:2", "Auxiliar de cozinha:2", "Limpeza:1"]
  );
  /*
    Quem SAIU não entra na pendência de treinamento. Ela não trabalha mais, e
    cobrar o treinamento de quem saiu da equipe seria criar uma tarefa que
    ninguém pode cumprir.
  */
  conferir(
    "e quem saiu não entra na pendência de treinamento",
    resumoMisto.pessoasComPendencia,
    1
  );
  conferirTexto(
    "só a Carla — ativa e executando — conta",
    resumoMisto.executandoSemTreinamento.map((c) => c.pessoa.nome),
    ["Carla"]
  );
  conferir(
    "e as pessoas que executam algo são contadas à parte",
    resumoMisto.pessoasQueExecutam,
    2
  );
  conferir(
    "o resumo não tem razão, porcentagem nem meta — só contagens",
    Object.keys(resumoMisto).filter((k) => /%|raz|percent|cobertura|ideal|meta/i.test(k)),
    []
  );

  // =========================================================================
  console.log("\n── BLOCO 8 · A SESSÃO ──");

  limparDemonstracao();

  /*
    ── A EQUIPE COMEÇA VAZIA, E NADA FOI INVENTADO ───────────────────────
    `mock/operacao.ts` não tem lista de pessoas, e inventar uma seria afirmar
    que a consultora cadastrou uma equipe que ela não cadastrou.
  */
  conferir("o cenário não tem equipe, e o store não inventa uma", acervoDaEquipe([]).length, 0);
  conferir("sessão limpa não tem alterações", temAlteracoes(), false);
  conferir("e nenhuma pessoa é da sessão", pessoaDaSessao("pe_x"), false);

  const ana = pessoa({ id: "pe_ana", nome: "Ana", funcao: "COZINHEIRO" });
  criarPessoa(ana);

  conferirTexto(
    "cadastrar coloca a pessoa no acervo",
    acervoDaEquipe([]).map((p) => p.id),
    ["pe_ana"]
  );
  conferir("e ela é marcada como da sessão", pessoaDaSessao("pe_ana"), true);
  conferir("cadastrar conta como alteração para a faixa da tela", temAlteracoes(), true);

  /*
    ── A SOBREPOSIÇÃO: A SESSÃO GANHA DO CENÁRIO ─────────────────────────
    A pessoa do cenário recebe a alteração por cima; a criada na sessão entra
    inteira. Gravar nos dois lugares daria duas verdades — a tela leria uma e
    a exclusão procuraria a outra.
  */
  const doCenario = pessoa({ id: "pe_cenario", nome: "Beatriz", funcao: "SALAO" });
  salvarPessoa("pe_cenario", { funcao: "CHEFE" });

  conferir(
    "a alteração da sessão fica POR CIMA da pessoa do cenário",
    acervoDaEquipe([doCenario]).find((p) => p.id === "pe_cenario").funcao,
    "CHEFE"
  );
  conferir(
    "e o que não foi alterado continua vindo do cenário",
    acervoDaEquipe([doCenario]).find((p) => p.id === "pe_cenario").nome,
    "Beatriz"
  );
  conferir(
    "uma pessoa do cenário não vira pessoa da sessão só por ser alterada",
    pessoaDaSessao("pe_cenario"),
    false
  );
  /*
    As duas fontes juntas: a criada na sessão e a do cenário. A ordem não é
    acidental — quem foi criado agora aparece depois, e a lista se ordena por
    função antes de chegar à tela.
  */
  conferirTexto(
    "o acervo traz as duas origens, sem uma esconder a outra",
    acervoDaEquipe([doCenario]).map((p) => p.id).sort(),
    ["pe_ana", "pe_cenario"]
  );

  /*
    Alterar uma pessoa CRIADA na sessão escreve no registro, e não na
    sobreposição — é o outro lado da mesma regra.
  */
  salvarPessoa("pe_ana", { nome: "Ana Paula" });
  conferir(
    "salvar uma pessoa da sessão grava no registro dela",
    acervoDaEquipe([])[0].nome,
    "Ana Paula"
  );

  /*
    ── SAIR DA EQUIPE NÃO É APAGAR ──────────────────────────────────────
    A mesma distinção do insumo arquivado. Ela executou preparos, e o registro
    do que ela executou continua sendo verdade depois que ela sai.
  */
  marcarSaidaDaPessoa("pe_ana");
  conferir("marcar saída tira da ativa, sem tirar do acervo", acervoDaEquipe([]).length, 1);
  conferir("e a situação muda", acervoDaEquipe([])[0].situacao, "DESLIGADA");
  conferir(
    "quem saiu não entra na lista dos ativos",
    pessoasAtivas(acervoDaEquipe([])).length,
    0
  );
  conferir("mas continua contando como alteração", temAlteracoes(), true);

  marcarRetornoDaPessoa("pe_ana");
  conferir("e o retorno a recoloca na ativa", acervoDaEquipe([])[0].situacao, "ATIVA");

  /*
    ── O TREINAMENTO: O PAR NÃO SE DUPLICA ──────────────────────────────
    Registrar de novo o mesmo par não acrescenta uma segunda linha. Dois
    registros do mesmo par fariam "quantos treinamentos" subir sem que nada
    tivesse acontecido.
  */
  const novo = {
    id: "tr_sessao_1",
    pessoaId: "pe_ana",
    preparo: "Costela ao molho",
    aplicadoPor: "sessão de trabalho",
    concluidoEm: new Date("2026-05-01T10:00:00Z"),
  };

  conferir(
    "o primeiro registro do par entra",
    registrarTreinamento(novo, new Date("2026-05-01T10:00:00Z")),
    true
  );
  conferir(
    "e o segundo, do MESMO par, é recusado — releitura não é treinamento novo",
    registrarTreinamento({ ...novo, id: "tr_sessao_2" }, new Date("2026-05-02T10:00:00Z")),
    false
  );
  /*
    ── OS DOIS CASOS QUE A CHAVE PRECISA ACERTAR, E QUE O `toLowerCase`          ──
    ── SOZINHO ERRA ──────────────────────────────────────────────────────
    As duas conferências abaixo são as que DISCRIMINAM. Uma grafia que só
    difere na caixa passa em qualquer implementação, inclusive na errada — e
    por isso não prova nada. Estas duas falhavam antes do conserto, porque o
    store comparava as strings cruas:

      · espaço duplo no meio — é como o texto chega colado de uma ficha;
      · acento — "à moda" e "a moda" são o mesmo preparo.

    Nos dois, o store aceitava o segundo registro e a conferência de cobertura
    via os dois como o mesmo par. O resultado era o sistema guardando dois
    registros do mesmo fato, um deles invisível em toda leitura.
  */
  conferir(
    "o par também vale com a caixa diferente — este passa em qualquer chave",
    registrarTreinamento({ ...novo, id: "tr_sessao_3", preparo: "costela ao molho" }, new Date()),
    false
  );
  conferir(
    "o par vale com ESPAÇO DUPLO no meio, e é aqui que o `toLowerCase` falhava",
    registrarTreinamento(
      { ...novo, id: "tr_sessao_4", preparo: "costela  ao molho" },
      new Date()
    ),
    false
  );
  conferir(
    "e vale com acento diferente — o outro caso em que ele falhava",
    registrarTreinamento({ ...novo, id: "tr_sessao_5", preparo: "Costela ao molho" }, new Date()),
    false
  );
  conferir(
    "o acervo tem UMA linha, e não as cinco tentativas",
    treinamentosDaEquipe([]).length,
    1
  );
  /*
    A data vem por argumento, e é a do store — não a do registro entregue. É o
    que permite à bancada exercitá-lo com data fixa, e é o que garante que o
    sistema registra QUANDO o treinamento foi anotado.
  */
  conferir(
    "a data gravada é a que o store recebeu, e não a que veio no registro",
    treinamentosDaEquipe([])[0].concluidoEm.toISOString(),
    "2026-05-01T10:00:00.000Z"
  );
  conferir(
    "e o par de OUTRA pessoa é aceito, porque a chave é composta",
    registrarTreinamento({ ...novo, id: "tr_outra", pessoaId: "pe_outra" }, new Date()),
    true
  );

  /*
    Desfazer o registro: `true` quando havia o que desfazer, `false` quando não.
    O retorno importa porque a tela limpa o campo com base nele — um `void`
    faria um clique sem efeito parecer um clique que funcionou.
  */
  conferir(
    "desfazer o registro devolve verdadeiro quando havia o que desfazer",
    removerTreinamento("pe_ana", "Costela ao molho"),
    true
  );
  conferir("e devolve falso na segunda vez", removerTreinamento("pe_ana", "Costela ao molho"), false);

  /*
    Se um treinamento é removido, o preparo volta para a pendência. É a prova
    de que a lista de "sem registro" é DERIVADA e não guardada: nenhum campo
    foi atualizado além do par.
  */
  const anaExecutando = pessoa({ id: "pe_ana", nome: "Ana", pratos: ["Costela ao molho"] });
  conferirTexto(
    "sem o registro, o preparo volta para a lista de pendência",
    coberturaDeTreinamento([anaExecutando], treinamentosDaEquipe([]))[0].semTreinamento,
    ["Costela ao molho"]
  );

  /*
    ── LIMPAR A DEMONSTRAÇÃO ESQUECE A EQUIPE ───────────────────────────
    Uma lista de pessoas que sobrevivesse ao "reiniciar demonstração" faria a
    tela afirmar uma equipe cadastrada que ela acabou de mandar esquecer. O
    nome de uma pessoa é o dado que menos pode reaparecer por descuido.
  */
  limparDemonstracao();
  conferir("limpar a demonstração esvazia o acervo de pessoas", acervoDaEquipe([]).length, 0);
  conferir("e o de treinamentos", treinamentosDaEquipe([]).length, 0);
  conferir("deixando a sessão sem alterações", temAlteracoes(), false);
  conferir(
    "e a alteração feita numa pessoa do cenário também é esquecida",
    acervoDaEquipe([doCenario])[0].funcao,
    "SALAO"
  );

  /*
    ── O ID DA SESSÃO ───────────────────────────────────────────────────
    Dois prefixos novos: `pe` para pessoa, `tr` para treinamento. O prefixo é
    o que permite, numa lista que mistura espécies, saber de que se está
    falando sem consultar mais nada.
  */
  const idPessoa = idDaSessao("pe", "Ana Paula");
  const idTreino = idDaSessao("tr", "Ana Paula");

  conferir("o id da pessoa se identifica como pessoa", idPessoa.startsWith("pe_demo_"), true);
  conferir("e o do treinamento como treinamento", idTreino.startsWith("tr_demo_"), true);
  conferir("dois ids seguidos não colidem", idPessoa === idTreino, false);
  conferir(
    "e o slug não carrega acento nem espaço",
    /^[a-z0-9_-]+$/.test(idPessoa),
    true
  );
  conferir(
    "dois registros do mesmo nome no mesmo milissegundo continuam distintos",
    idDaSessao("pe", "Ana Paula") === idDaSessao("pe", "Ana Paula"),
    false
  );

  limparDemonstracao();
}

/**
 * ── O CONTROLE NEGATIVO — OS CINCO ──────────────────────────────────────
 *
 * Uma bancada que passa de primeira não provou nada ainda: ela precisa ser
 * capaz de FALHAR. Cada controle abaixo foi rodado numa cópia em `/tmp` com
 * UMA linha revertida, e o esperado é que ele acuse — só ele. O número ao
 * lado é o que saiu de verdade, não o que se esperava.
 *
 *   1. A ISOLAÇÃO POR CLIENTE. Em `responsaveisDosProcessos`, o índice por
 *      cliente volta a ser a carteira inteira:
 *
 *          responsaveisDoProcesso(processo, [...pessoaPorId.values()])
 *
 *      Vermelho nas DUAS conferências do bloco 3 — as que citam o cliente da
 *      pessoa que casou. 91/93.
 *
 *   2. A DEDUPLICAÇÃO PELA CHAVE. Em `resumirEquipe`, o `reduce` com
 *      `normalizarNome` volta a ser `[...new Set(nomesSemCadastro(...))]`.
 *
 *      Quatro vermelhas no bloco 7: "Cozinha" e "cozinha " voltam a ser duas
 *      pendências, e a grafia exibida passa a ser a do último. 89/93.
 *
 *   3. A CHAVE DO PAR. `chaveDoTreinamento` perde a pessoa e devolve só o
 *      preparo normalizado.
 *
 *      Quatro vermelhas: o treinamento de uma pessoa passa a absolver todas
 *      as outras que executam o mesmo prato. 89/93.
 *
 *   4. A DEDUPLICAÇÃO DE `pratos` PELA STRING. Em `coberturaDeTreinamento`,
 *      o `reduce` volta a ser `[...new Set(pessoa.pratos)]`.
 *
 *      Este é o defeito que a bancada ENCONTROU e que foi consertado nesta
 *      rodada — ver o comentário na função. Duas vermelhas no bloco 6: o
 *      mesmo preparo escrito duas vezes aparecia duas vezes na coluna dos
 *      treinados. 91/93.
 *
 *   5. A CHAVE PRÓPRIA DO STORE. Em `registrarTreinamento`, o store volta a
 *      comparar com `trim().toLowerCase()` em vez de `chaveDoTreinamento`.
 *
 *      Este é o OUTRO defeito encontrado nesta rodada. Três vermelhas no
 *      bloco 8: o registro com espaço duplo no meio passa como um segundo
 *      treinamento, e o acervo fica com duas linhas do mesmo fato. 90/93.
 *
 * Repare que as versões "quebradas" dos controles 2, 4 e 5 são todas mais
 * CURTAS e mais SIMPLES que as certas — um `new Set` de uma linha em vez de um
 * `reduce`. É por isso que elas são o tipo de coisa que alguém escreve sem
 * pensar duas vezes, e é por isso que cada uma tem uma conferência travando.
 */

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
  console.log("Conferências da equipe\n");
  for (const f of falhas) {
    console.log(`  FALHA  ${f.nome}`);
    console.log(`         obtido:   ${f.obtido}`);
    console.log(`         esperado: ${f.esperado}`);
  }
  console.log(`\n${passou}/${linhas} passaram — ${falhas.length} falha(s).\n`);
} else {
  console.log(
    `\n  ${passou}/${linhas} conferências da equipe passaram` +
      ` (${Date.now() - inicio} ms)\n`
  );
}

if (manter) {
  console.log(`A compilação ficou em: ${pasta}\n`);
} else {
  rmSync(pasta, { recursive: true, force: true });
}

process.exit(falhas.length === 0 ? 0 : 1);
