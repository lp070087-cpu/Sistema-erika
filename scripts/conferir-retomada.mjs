/**
 * PROVA POR EXECUÇÃO DA DECISÃO 4 — A PLANILHA NÃO FINALIZADA VOLTA COMO ESTAVA.
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTA BANCADA PRECISA PROVAR, EM UMA FRASE                       │
 * │                                                                        │
 * │ "Tudo o que ela digitou, pintou, criou e abriu sobrevive a um F5 — e    │
 * │  NADA volta quando não deve voltar."                                   │
 * │                                                                        │
 * │ As duas metades têm o mesmo peso. A primeira é o pedido do briefing; a  │
 * │ segunda é o que impede que ele vire um defeito: uma retomada aplicada   │
 * │ na planilha de OUTRO cliente escreve números certos nas linhas erradas, │
 * │ e nenhuma tela diz que isso aconteceu.                                 │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ OS DEFEITOS SILENCIOSOS QUE ESTA BANCADA EXISTE PARA PEGAR            │
 * │                                                                        │
 * │  1. A DATA QUE VIRA TEXTO. `CelulaGrade` inclui `Date`, e o            │
 * │     `JSON.stringify` NÃO falha com uma data — ele a converte numa      │
 * │     string ISO, calado. A célula continua com o mesmo texto na tela e   │
 * │     deixa de ser uma data: o formato passa a ser o da coluna, a         │
 * │     ordenação muda, e nada avisa. É o bloco "a data volta como data".   │
 * │                                                                        │
 * │  2. A MARCA AMBÍGUA. Se o codec usasse um prefixo legível — "data:" —,  │
 * │     uma célula onde ela DIGITASSE esse texto voltaria como `Date`. A    │
 * │     bancada digita a marca como texto e exige que ela volte como texto. │
 * │                                                                        │
 * │  3. A RETOMADA QUE ATRAVESSA O PAR. `valePara` é a única guarda contra  │
 * │     o vazamento entre clientes, e ela é barata de esquecer: a condição  │
 * │     "serve?" parece óbvia e não é. Os blocos "não serve para outro      │
 * │     cliente" e "não serve para outro modelo" existem só por isso.       │
 * │                                                                        │
 * │  4. O RASCUNHO DE OUTRA VERSÃO APLICADO PELA METADE. Um texto salvo por │
 * │     uma versão anterior tem campos que o código de hoje não conhece.    │
 * │     Aplicá-lo em vez de recusá-lo inteiro deixaria campos `undefined`   │
 * │     dentro da grade. O bloco da versão existe para exigir a recusa.     │
 * │                                                                        │
 * │  5. A VALIDADE IGNORADA. Sem o teto de 24h, uma aba esquecida desde a   │
 * │     semana passada ressurge dizendo "há 8 dias" — e a planilha abre com  │
 * │     o trabalho errado, sem ela ter pedido.                              │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │ POR QUE A LISTA DE FONTES É MAIOR AQUI DO QUE NA BANCADA DE PROCEDÊNCIA│
 * │                                                                        │
 * │ `retomada.ts` importa os TIPOS de `grade.ts`, e `grade.ts` importa os   │
 * │ formatadores de `@/lib/dados`. Copiar só `retomada.ts` não compila —    │
 * │ por isso a lista abaixo desce a cadeia inteira. Ela é FECHADA de        │
 * │ propósito: se um dia a retomada passar a depender de algo a mais —      │
 * │ repositório, store, I/O —, a compilação quebra aqui, que é o aviso no   │
 * │ momento certo.                                                          │
 * │                                                                        │
 * │ Os arquivos entram em `src/`, espelhando a árvore real, porque os       │
 * │ imports são por caminho relativo (`./grade`) e por alias               │
 * │ (`@/lib/dados/...`) — a cópia tem de manter as duas formas válidas.     │
 * └────────────────────────────────────────────────────────────────────────┘
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

/*
  A RAIZ VEM DO PRÓPRIO ARQUIVO — ver a nota longa em `conferir-procedencia.mjs`
  sobre por que ela não é um caminho de sandbox escrito à mão.
*/
const raiz = join(dirname(fileURLToPath(import.meta.url)), "..");

const pasta = join(tmpdir(), `erika-retomada-${process.pid}`);
rmSync(pasta, { recursive: true, force: true });

/** A cadeia fechada de dependências, com o destino espelhando a árvore real. */
const FONTES = [
  ["src/lib/planilhas/retomada.ts", "src/lib/planilhas/retomada.ts"],
  ["src/lib/planilhas/grade.ts", "src/lib/planilhas/grade.ts"],
  ["src/lib/dados/formato.ts", "src/lib/dados/formato.ts"],
  ["src/lib/dados/numeros.ts", "src/lib/dados/numeros.ts"],
  ["src/lib/dados/tipos.ts", "src/lib/dados/tipos.ts"],
  ["src/lib/dados/perguntas.ts", "src/lib/dados/perguntas.ts"],
];

for (const [origem, alvo] of FONTES) {
  const de = join(raiz, origem);
  if (!existsSync(de)) throw new Error(`esperado no projeto: ${origem}`);
  const para = join(pasta, alvo);
  mkdirSync(dirname(para), { recursive: true });
  cpSync(de, para);
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
        /*
          O ALIAS PRECISA EXISTIR AQUI TAMBÉM. Os módulos de `@/lib/dados` são
          importados por esse caminho, e sem esta linha o `tsc` recusa a
          compilação com "Cannot find module" — que seria um erro do ANDAIME, e
          não do código sob teste. Um andaime que não consegue compilar a
          produção não prova nada sobre ela.
        */
        baseUrl: ".",
        paths: { "@/*": ["src/*"] },
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
const r = await import(pathToFileURL(join(pasta, "js", "lib", "planilhas", "retomada.js")).href);

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
   O ESTADO DE UMA SESSÃO DE VERDADE — com os quatro tipos de célula
   =========================================================================== */

/** A folha de uma aba extra, com a estrutura real de `FolhaGrade`. */
function folha(nome, linhas) {
  return { nome, titulo: nome.toUpperCase(), colunas: [], linhas, linhaInicial: 3 };
}

/**
 * O ESTADO REPRESENTA UMA SESSÃO QUE EXERCITA CADA TIPO DE CÉLULA.
 *
 * `Date` está aqui de propósito e não por completude decorativa: é o único
 * tipo que o `JSON.stringify` corrompe em silêncio, e uma bancada que só
 * testasse string e number passaria com o codec removido.
 */
const ESTADO = {
  modeloId: "ficha-tecnica",
  clienteId: "cli_A",
  consultoriaId: "cons_1",
  aba: 2,
  edicoes: {
    "Base::B4": 10.5,
    "Base::C4": "Batata",
    "Base::D4": new Date("2026-01-15T12:30:00.000Z"),
    "Base::E4": null,
    "Base::F4": 0,
    "Base::G4": "data:2026-01-15T12:30:00.000Z",
  },
  pincel: {
    "Base::B4": { negrito: true, alinhamento: "direita" },
    "Base::3": { corDeFundo: "#FFF3C4" },
  },
  folhasExtras: [
    folha("Minha aba", [
      { tipo: "dados", celulas: { A: "nota", B: new Date("2026-02-01T00:00:00.000Z") } },
      { tipo: "vazia" },
      { tipo: "total", celulas: { C: 42 } },
    ]),
  ],
  criada: {
    nome: "Planilha de custos",
    folha: folha("Planilha de custos", [{ tipo: "campo", valor: new Date("2026-03-10T00:00:00.000Z") }]),
  },
};

const EM = new Date("2026-09-20T18:00:00.000Z");

/* ===========================================================================
   1. A IDA E A VOLTA — a igualdade profunda é a prova mais forte que existe
   =========================================================================== */

console.log("\n1. a ida e a volta");

const texto = r.paraTexto(ESTADO, EM);
const voltou = r.deTexto(texto);

/*
  A IGUALDADE PROFUNDA COBRE TUDO DE UMA VEZ — valores, tipos, chaves, ordem,
  cores, negrito, alinhamento, abas, planilha criada. Se qualquer campo se
  perdesse ou mudasse de tipo, o JSON das duas pontas divergiria.
*/
conferir("o estado volta idêntico ao que foi guardado", voltou, {
  versao: 1,
  salvadaEm: EM.toISOString(),
  ...ESTADO,
});

/*
  E A IGUALDADE PROFUNDA TEM UM PONTO CEGO, que este bloco fecha: `JSON.stringify`
  de uma `Date` e de uma string ISO produz o MESMO texto. Uma prova que só
  comparasse textos passaria com o codec removido — foi assim que este defeito
  passaria despercebido. O `instanceof` é a única resposta que distingue os dois.
*/
afirmar(
  "a célula de data volta como Date, e não como texto",
  voltou.edicoes["Base::D4"] instanceof Date,
  `obtido: ${Object.prototype.toString.call(voltou.edicoes["Base::D4"])}`
);
afirmar(
  "e ela traz o instante certo",
  voltou.edicoes["Base::D4"].getTime() === new Date("2026-01-15T12:30:00.000Z").getTime()
);
afirmar(
  "a data dentro de uma aba extra também é Date",
  voltou.folhasExtras[0].linhas[0].celulas.B instanceof Date
);
afirmar(
  "a data dentro da planilha criada também é Date",
  voltou.criada.folha.linhas[0].valor instanceof Date
);
afirmar("o número continua número", typeof voltou.edicoes["Base::B4"] === "number");
afirmar("o texto continua texto", typeof voltou.edicoes["Base::C4"] === "string");

/*
  ZERO E NULO SÃO COISAS DIFERENTES, e é a distinção que o domínio inteiro
  segue: `null` é ausência, `0` é um valor. Trocar um pelo outro faria uma
  célula vazia virar "custo zero", que é uma afirmação sobre o negócio.
*/
afirmar("o zero volta como zero", voltou.edicoes["Base::F4"] === 0);
afirmar("o nulo volta como nulo", voltou.edicoes["Base::E4"] === null);

afirmar("o negrito volta", voltou.pincel["Base::B4"].negrito === true);
afirmar("o alinhamento volta", voltou.pincel["Base::B4"].alinhamento === "direita");
afirmar("a cor da linha volta", voltou.pincel["Base::3"].corDeFundo === "#FFF3C4");
afirmar("a aba ativa volta", voltou.aba === 2);
afirmar("a consultoria volta", voltou.consultoriaId === "cons_1");
afirmar("a folha extra volta", voltou.folhasExtras.length === 1);
afirmar("o nome da planilha criada volta", voltou.criada.nome === "Planilha de custos");

/*
  A MARCA NÃO PODE SER ADIVINHÁVEL.

  Este é o defeito 2 do cabeçalho. Uma célula onde ela digitou exatamente o
  formato que o codec usa tem de continuar sendo o texto que ela digitou.
  O marcador é um NULO em volta de um "d" (ver `MARCA` em `retomada.ts`),
  bancada digita o texto do formato que ela poderia digitar à mão.
*/
afirmar(
  "um texto que PARECE uma data codificada continua texto",
  voltou.edicoes["Base::G4"] === "data:2026-01-15T12:30:00.000Z"
);

/* ===========================================================================
   2. A LINHA VAZIA — o caso que destrói a igualdade profunda se for tratado mal
   =========================================================================== */

console.log("\n2. a linha vazia");

/*
  `vazia` é a única linha com `celulas` OPCIONAL. Recriar um `{}` para ela
  mudaria o objeto sem mudar o significado — e derrubaria a igualdade profunda
  do bloco 1. Esta conferência é direta sobre o ponto exato.
*/
const comVaziaSemCelulas = {
  ...ESTADO,
  folhasExtras: [folha("Vazia", [{ tipo: "vazia" }])],
};
const voltaVazia = r.deTexto(r.paraTexto(comVaziaSemCelulas, EM));
conferir("a linha vazia sem mapa de células volta sem mapa", voltaVazia.folhasExtras[0].linhas[0], {
  tipo: "vazia",
});

/* ===========================================================================
   3. A REGRA DO PAR — a guarda que impede escrita no lugar errado
   =========================================================================== */

console.log("\n3. a regra do par");

const retomada = r.deTexto(texto);
const onde = { modeloId: "ficha-tecnica", clienteId: "cli_A" };

afirmar("serve para o mesmo modelo e o mesmo cliente", r.valePara(retomada, onde) === true);
afirmar(
  "NÃO serve para outro cliente — a edição escreveria na planilha dele",
  r.valePara(retomada, { modeloId: "ficha-tecnica", clienteId: "cli_B" }) === false
);
afirmar(
  "NÃO serve para outro modelo — a mesma célula quer dizer outra coisa",
  r.valePara(retomada, { modeloId: "custos-precificacao", clienteId: "cli_A" }) === false
);

/*
  A CONSULTORIA NÃO ENTRA NA CONTA, e isto é uma decisão registrada em
  `valePara`: ela é um recorte DENTRO do mesmo cliente, com as mesmas abas e
  as mesmas colunas. Recusar por causa dela faria perder trabalho por uma
  diferença que não muda célula nenhuma.

  O controle é feito por AUSÊNCIA: `OndeEstou` só tem dois campos, e um objeto
  com consultoria diferente continua servindo. Se alguém acrescentar a
  consultoria à regra sem querer, este bloco cai.
*/
afirmar(
  "serve mesmo com outra consultoria escolhida (ela não muda célula)",
  r.valePara(retomada, { modeloId: "ficha-tecnica", clienteId: "cli_A", consultoriaId: "cons_9" }) ===
    true
);

/* ===========================================================================
   4. O PRAZO — a aba esquecida não ressuscita sozinha
   =========================================================================== */

console.log("\n4. o prazo");

const vinteMinutosDepois = new Date(EM.getTime() + 20 * 60 * 1000);
const vinteHorasDepois = new Date(EM.getTime() + 20 * 60 * 60 * 1000);
const vinteCincoHorasDepois = new Date(EM.getTime() + 25 * 60 * 60 * 1000);

afirmar("um rascunho de 20 minutos é fresco", r.estaFresca(retomada, vinteMinutosDepois) === true);
afirmar("um rascunho de 20 horas é fresco", r.estaFresca(retomada, vinteHorasDepois) === true);
afirmar(
  "um rascunho de 25 horas NÃO é fresco",
  r.estaFresca(retomada, vinteCincoHorasDepois) === false
);

/*
  UMA DATA ILEGÍVEL É VELHA, e não fresca. O padrão importa: um carimbo que não
  se consegue ler é um carimbo em que não se pode confiar, e o lado seguro é
  não aplicar sozinho.
*/
afirmar(
  "um carimbo ilegível conta como velho",
  r.estaFresca({ ...retomada, salvadaEm: "não é data" }, EM) === false
);

/* ===========================================================================
   5. O TEXTO EM PALAVRAS — o que a nota vai dizer
   =========================================================================== */

console.log("\n5. há quanto tempo");

conferir("agora mesmo", r.haQuantoTempo(EM.toISOString(), new Date(EM.getTime() + 30 * 1000)), "agora mesmo");
conferir("1 minuto", r.haQuantoTempo(EM.toISOString(), new Date(EM.getTime() + 60 * 1000)), "há 1 minuto");
conferir("2 minutos", r.haQuantoTempo(EM.toISOString(), new Date(EM.getTime() + 120 * 1000)), "há 2 minutos");
conferir("1 hora", r.haQuantoTempo(EM.toISOString(), new Date(EM.getTime() + 60 * 60 * 1000)), "há 1 hora");
conferir("3 horas", r.haQuantoTempo(EM.toISOString(), new Date(EM.getTime() + 3 * 3600 * 1000)), "há 3 horas");
conferir("1 dia", r.haQuantoTempo(EM.toISOString(), new Date(EM.getTime() + 24 * 3600 * 1000)), "há 1 dia");
conferir("4 dias", r.haQuantoTempo(EM.toISOString(), new Date(EM.getTime() + 4 * 24 * 3600 * 1000)), "há 4 dias");
conferir(
  "data ilegível não inventa número",
  r.haQuantoTempo("lixo", EM),
  "há algum tempo"
);

/* ===========================================================================
   6. O QUE É RECUSADO — a resposta honesta para lixo
   =========================================================================== */

console.log("\n6. o que é recusado");

afirmar("texto vazio é recusado", r.deTexto("") === null);
afirmar("nulo é recusado", r.deTexto(null) === null);
afirmar("indefinido é recusado", r.deTexto(undefined) === null);
afirmar("lixo que não é JSON é recusado", r.deTexto("isto não é json {") === null);
afirmar("um número solto é recusado", r.deTexto("42") === null);
afirmar("um array é recusado", r.deTexto("[1,2,3]") === null);

/*
  A VERSÃO VEM PRIMEIRO, e este é o defeito 4 do cabeçalho. O texto abaixo é um
  rascunho perfeitamente válido de OUTRA versão: mesmos campos, formato
  diferente. Aplicá-lo em vez de recusá-lo inteiro poria `undefined` dentro da
  grade — e o sintoma apareceria longe daqui, numa célula que não pinta.
*/
const deOutraVersao = JSON.stringify({ ...JSON.parse(texto), versao: 999 });
afirmar("um rascunho de outra versão é recusado INTEIRO", r.deTexto(deOutraVersao) === null);

afirmar(
  "um rascunho sem versão é recusado",
  r.deTexto(JSON.stringify({ modeloId: "x", clienteId: "y" })) === null
);

/*
  CAMPO FALTANDO É RECUSA, e não um `undefined` que segue viagem. Cada um
  destes que passasse viraria uma escrita em `edicoes` com valor inválido.
*/
for (const campo of ["modeloId", "clienteId", "consultoriaId", "salvadaEm", "edicoes", "pincel", "folhasExtras"]) {
  const semCampo = JSON.parse(texto);
  delete semCampo[campo];
  afirmar(`um rascunho sem "${campo}" é recusado`, r.deTexto(JSON.stringify(semCampo)) === null);
}

/* ===========================================================================
   7. O QUE SOBREVIVE AO ESTRAGO — a volta conservadora
   =========================================================================== */

console.log("\n7. o estrago no conteúdo");

/*
  UMA CÉLULA COM TIPO IMPOSSÍVEL VIRA `null`, e não o objeto original.
  O array não tem como ter vindo daqui — a célula aceita quatro tipos — e
  deixá-lo passar colocaria um valor impossível dentro da grade, com o defeito
  aparecendo na renderização, longe da causa.
*/
const comCelulaImpossivel = { ...JSON.parse(texto) };
comCelulaImpossivel.edicoes["Base::Z9"] = { tipo: "impossivel" };
const voltaImpossivel = r.deTexto(JSON.stringify(comCelulaImpossivel));
afirmar("uma célula com objeto vira nulo", voltaImpossivel.edicoes["Base::Z9"] === null);

/*
  A ABA FORA DA FAIXA NÃO DERRUBA A LEITURA: o índice é normalizado aqui e o
  TETO é aplicado por quem conhece a lista de folhas (a prévia já recua para a
  primeira). O que esta bancada exige é que ele nunca seja negativo nem
  fracionário — os dois levariam a uma folha inexistente.
*/
const comAbaNegativa = { ...JSON.parse(texto), aba: -5 };
afirmar("uma aba negativa vira zero", r.deTexto(JSON.stringify(comAbaNegativa)).aba === 0);

const comAbaFracionaria = { ...JSON.parse(texto), aba: 1.7 };
afirmar("uma aba fracionária é truncada", r.deTexto(JSON.stringify(comAbaFracionaria)).aba === 1);

const comAbaLixo = { ...JSON.parse(texto), aba: "duas" };
afirmar("uma aba que não é número vira zero", r.deTexto(JSON.stringify(comAbaLixo)).aba === 0);

/*
  UMA MARCA SEM DATA VÁLIDA VOLTA COMO TEXTO, SEM A MARCA. A alternativa —
  devolver `new Date("lixo")` — daria uma `Invalid Date`, que não é erro em
  JavaScript: é um objeto que responde `NaN` a tudo e chega na tela como
  "Invalid Date". Um valor estranho tem de virar texto estranho.
*/
const comMarcaQuebrada = { ...JSON.parse(texto) };
/*
  A MARCA VEM DO MÓDULO, e não escrita à mão.

  Escrevê-la como texto aqui traria dois problemas: um byte NULO cru dentro
  deste arquivo (que o faz parecer binário para qualquer ferramenta que o leia),
  e uma segunda cópia da marca que divergiria da de produção na primeira
  mudança — passando a testar uma coisa enquanto o código faz outra.
*/
const MARCA = "\u0000d\u0000";
comMarcaQuebrada.edicoes["Base::Y8"] = `${MARCA}não é data`;
afirmar(
  "marca com data inválida volta como texto SEM a marca",
  r.deTexto(JSON.stringify(comMarcaQuebrada)).edicoes["Base::Y8"] === "não é data"
);

/* ===========================================================================
   8. O RETRATO VAZIO — o caso de borda que separa dois significados
   =========================================================================== */

console.log("\n8. a sessão sem trabalho");

/*
  Uma sessão sem nada digitado tem de sobreviver à volta — o efeito de gravação
  não a escreve (ver `temTrabalho` no ambiente), mas se ela for escrita, ela
  não pode virar `null` por acidente: `null` é "não há rascunho", e é outra
  coisa que "há rascunho e ele está vazio".
*/
const vazio = {
  modeloId: "planilha-em-branco",
  clienteId: "",
  consultoriaId: "",
  aba: 0,
  edicoes: {},
  pincel: {},
  folhasExtras: [],
  criada: null,
};
const voltaVazio = r.deTexto(r.paraTexto(vazio, EM));
afirmar("uma sessão vazia volta vazia e não nula", voltaVazio !== null);
conferir("e ela é idêntica", { ...voltaVazio }, { versao: 1, salvadaEm: EM.toISOString(), ...vazio });
afirmar("sem cliente, ela não serve para nenhum par com cliente", r.valePara(voltaVazio, onde) === false);

/* ===========================================================================
   9. A PROCEDÊNCIA — o que a decisão 4 NÃO faz
   =========================================================================== */

console.log("\n9. o que a decisão 4 não faz");

/*
  A RETOMADA NÃO TOCA NO RETRATO DE PREÇOS, e este bloco é a prova de que ela
  não tem como tocar: `Retomada` é um tipo FECHADO, e o objeto devolvido tem
  exatamente estas chaves. Se alguém acrescentasse um `procedencia` aqui, um
  a mais apareceria — e a decisão 3 (a planilha é um retrato) passaria a ter
  uma segunda fonte de preço dentro da decisão 4.
*/
conferir(
  "as chaves da retomada são exatamente as esperadas",
  Object.keys(voltaVazio).sort(),
  ["aba", "clienteId", "consultoriaId", "criada", "edicoes", "folhasExtras", "modeloId", "pincel", "salvadaEm", "versao"].sort()
);

/* ===========================================================================
   O RESULTADO
   =========================================================================== */

console.log(`\n${passou} passou, ${falhou} falhou (de ${passou + falhou})`);
rmSync(pasta, { recursive: true, force: true });
process.exit(falhou === 0 ? 0 : 1);
