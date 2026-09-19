/**
 * AS CONFERÊNCIAS DA CALCULADORA DE RENDIMENTO.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ POR QUE ISTO EXISTE, E POR QUE NÃO INSTALA NADA                       │
 * │                                                                      │
 * │ O sistema calcula o custo de um prato a partir de pesos que a         │
 * │ consultora mede na balança. Uma conta dessas não pode mudar de valor   │
 * │ sem ninguém perceber: um erro de sinal aqui diz a ela que a batata     │
 * │ perdeu peso quando ganhou, e o preço do prato sai errado com a mesma   │
 * │ aparência de certo.                                                   │
 * │                                                                      │
 * │ A regra desta fase foi: se não houver infraestrutura de teste, não     │
 * │ instalar um framework inteiro só para isso. Então não há framework.    │
 * │ Há este arquivo, e ele roda com `node` — sem Jest, sem Vitest, sem     │
 * │ dependência nova. As bibliotecas de tipo do TypeScript NÃO aparecem    │
 * │ aqui porque todo o cálculo já foi COMPILADO antes: o arquivo importa   │
 * │ o JavaScript gerado, não o fonte.                                      │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ COMO RODA                                                             │
 * │                                                                      │
 * │   npm run conferir:rendimento                                        │
 * │                                                                      │
 * │ O script compila os módulos puros de `src/lib/dados` com o `tsc` que   │
 * │ já está instalado, joga a saída num diretório temporário FORA do       │
 * │ projeto (nada é escrito em `src/` nem em `dist/`), e roda as           │
 * │ conferências contra o resultado. Ao terminar, apaga o temporário.      │
 * │                                                                      │
 * │ `--manter` pula a limpeza e imprime onde a compilação ficou, para quem │
 * │ quiser abrir o JavaScript gerado e olhar.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ O QUE ESTE ARQUIVO CONFERE — E O QUE ELE NÃO PODE CONFERIR            │
 * │                                                                      │
 * │ Confere o que é ARITMÉTICA: preço por quilo, perda, rendimento,        │
 * │ fator de correção, custo efetivo, ganho de peso, ausência de medição,  │
 * │ unidade incompatível e as recusas de compra inválida.                  │
 * │                                                                      │
 * │ Não confere METODOLOGIA, e não é omissão: o sistema não tem margem     │
 * │ alvo, CMV alvo nem markup embutidos. Não há o que conferir ali, e      │
 * │ inventar um número esperado para essas contas seria transformar uma    │
 * │ decisão da consultora num valor de teste.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */

import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manter = process.argv.includes("--manter");
const pasta = join(tmpdir(), `erika-rendimento-${process.pid}`);

/*
  OS MÓDULOS PUROS QUE O CÁLCULO ATRAVESSA.

  A lista é fechada de propósito, e não um glob. Se `rendimento.ts` passar a
  importar um arquivo novo, este script QUEBRA na compilação — o que é o
  comportamento desejado: a lista de fora precisa acompanhar.
*/
const FONTES = [
  "custos.ts",
  "numeros.ts",
  "rendimento.ts",
  "tipos-operacao.ts",
  "perguntas.ts",
  "indicadores-comerciais.ts",
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

  /*
    `tsc` é o compilador que já está em `node_modules`. `execFileSync` com o
    caminho absoluto do binário evita depender de PATH, e o `.cmd` é o que o
    Windows usa — por isso o `shell: true` fica desligado e o binário escolhido
    por plataforma.
  */
  const tsc = join(
    raiz,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "tsc.cmd" : "tsc"
  );

  execFileSync(tsc, ["-p", "tsconfig.json"], {
    cwd: pasta,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
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
  const custos = await import(pathToFileURL(join(pasta, "js", "dados", "custos.js")).href);
  const rendimento = await import(
    pathToFileURL(join(pasta, "js", "dados", "rendimento.js")).href
  );
  const numeros = await import(pathToFileURL(join(pasta, "js", "dados", "numeros.js")).href);

  const {
    derivarTransformacao,
    precoUnitarioDaCompra,
    recusaDaCompra,
    FRASE_DA_RECUSA,
  } = custos;
  const { calcularRendimento } = rendimento;
  const { numeroFixo } = numeros;

  // ── 1. O caso de referência: perda nas duas etapas ──────────────────────
  // 5 kg comprados por R$ 50,00 · limpeza 4,5 kg · preparo 4,0 kg
  const compra = { quantidade: 5, unidade: "kg", valorTotal: 50 };
  const medida = {
    bruto: { peso: 5, unidade: "kg" },
    limpo: { peso: 4.5, unidade: "kg" },
    preparado: { peso: 4, unidade: "kg" },
    observacao: "",
  };
  const ind = derivarTransformacao(medida).indicadores;
  const calc = calcularRendimento(compra, medida);

  conferir("preço do kg comprado", numeroFixo(precoUnitarioDaCompra(compra), 2), "10,00");
  conferir("perda na limpeza (kg)", numeroFixo(ind.perdaLimpeza, 3), "0,500");
  conferir("perda na limpeza (%)", numeroFixo(ind.perdaLimpezaPct, 1), "10,0");
  conferir("rendimento da limpeza (%)", numeroFixo(ind.rendimentoLimpezaPct, 1), "90,0");
  conferir("fator de correção medido", numeroFixo(ind.bruto / ind.limpo, 4), "1,1111");
  conferir("perda no preparo (kg)", numeroFixo(ind.perdaPreparo, 3), "0,500");
  conferir("rendimento do preparo (%)", numeroFixo(ind.rendimentoPreparoPct, 1), "88,9");
  conferir("rendimento total (%)", numeroFixo(ind.rendimentoFinalPct, 1), "80,0");
  conferir("custo efetivo final", numeroFixo(calc.custoEfetivo, 2), "12,50");
  conferirTexto(
    "texto do custo efetivo",
    calc.linhas.find((l) => l.chave === "custoEfetivo").valor,
    "R$ 12,50"
  );

  // ── 2. O GANHO de peso: arroz, 1 kg seco → 1,2 kg cozido ────────────────
  const arroz = {
    bruto: { peso: 1, unidade: "kg" },
    limpo: null,
    preparado: { peso: 1.2, unidade: "kg" },
    observacao: "",
  };
  const indArroz = derivarTransformacao(arroz).indicadores;
  const calcArroz = calcularRendimento({ quantidade: 1, unidade: "kg", valorTotal: 8 }, arroz);

  conferir("ganho: rendimento total (%)", numeroFixo(indArroz.rendimentoFinalPct, 1), "120,0");
  conferir("ganho: perda total é negativa", indArroz.perdaTotal < 0, true);
  conferir("ganho: perda total em módulo", numeroFixo(Math.abs(indArroz.perdaTotal), 3), "0,200");
  conferir("ganho: custo efetivo final", numeroFixo(calcArroz.custoEfetivo, 2), "6,67");
  conferir("ganho: a tela sinaliza", calcArroz.temGanho, true);

  const linhaTotal = calcArroz.linhas.find((l) => l.chave === "perdaTotal");
  conferirTexto("ganho: rótulo vira 'Ganho'", linhaTotal.rotulo, "Ganho total");
  conferirTexto("ganho: natureza = GANHO", linhaTotal.natureza, "GANHO");
  conferirTexto("ganho: valor sem sinal de menos", linhaTotal.valor, "0,200 kg");
  conferirTexto(
    "ganho: rendimento total marcado",
    calcArroz.linhas.find((l) => l.chave === "rendimentoTotal").natureza,
    "GANHO"
  );

  // ── 3. Ausência total: nada vira NaN, Infinity ou "undefined" ───────────
  const vazio = { bruto: null, limpo: null, preparado: null, observacao: "" };
  const indVazio = derivarTransformacao(vazio).indicadores;
  const linhasVazias = calcularRendimento(null, vazio).linhas;

  conferir(
    "ausência: nenhuma linha com NaN/Infinity",
    linhasVazias.filter((l) => /NaN|Infinity|undefined/.test(l.valor + l.detalhe)).length,
    0
  );
  conferir(
    "ausência: nenhum indicador não-finito",
    Object.values(indVazio).some((x) => typeof x === "number" && !Number.isFinite(x)),
    false
  );
  conferir("ausência: rendimento total nulo", indVazio.rendimentoFinalPct, null);
  conferir("ausência: zero etapas medidas", derivarTransformacao(vazio).etapasInformadas, 0);
  conferir(
    "ausência: todas as linhas com traço",
    linhasVazias.every((l) => l.valor === "—"),
    true
  );

  // ── 4. Peso zero: balança zerada ou campo vazio não divide por zero ─────
  const zerado = derivarTransformacao({
    bruto: { peso: 0, unidade: "kg" },
    limpo: { peso: 0, unidade: "kg" },
    preparado: null,
    observacao: "",
  });
  conferir("peso zero: zero etapas medidas", zerado.etapasInformadas, 0);
  conferir("peso zero: sem divisão por zero", zerado.indicadores.rendimentoFinalPct, null);
  conferir(
    "peso zero: sem NaN",
    Number.isFinite(zerado.indicadores.perdaLimpeza ?? 0),
    true
  );

  // ── 5. Unidades incompatíveis: massa com volume não vira número ─────────
  const misto = derivarTransformacao({
    bruto: { peso: 2, unidade: "kg" },
    limpo: { peso: 1.5, unidade: "L" },
    preparado: null,
    observacao: "",
  });
  conferir("unidades: sinaliza incompatibilidade", misto.unidadesIncompativeis, true);
  conferir("unidades: não inventa rendimento", misto.indicadores.rendimentoLimpezaPct, null);

  // ── 6. A recusa da compra inválida ──────────────────────────────────────
  conferirTexto(
    "recusa: quantidade não numérica",
    recusaDaCompra("cinco", null, "50", 50),
    "QUANTIDADE_NAO_E_NUMERO"
  );
  conferirTexto(
    "recusa: valor não numérico",
    recusaDaCompra("5", 5, "abc", null),
    "VALOR_NAO_E_NUMERO"
  );
  conferirTexto("recusa: falta o valor", recusaDaCompra("5", 5, "", null), "FALTA_VALOR");
  conferirTexto("recusa: falta a quantidade", recusaDaCompra("", null, "50", 50), "FALTA_QUANTIDADE");
  conferirTexto("recusa: compra completa passa", recusaDaCompra("5", 5, "50", 50), null);
  conferirTexto("recusa: compra vazia passa", recusaDaCompra("", null, "", null), null);
  conferir(
    "recusa: preço unitário recusa quantidade zero",
    precoUnitarioDaCompra({ quantidade: 0, unidade: "kg", valorTotal: 50 }),
    null
  );
  conferir(
    "recusa: preço unitário recusa valor negativo",
    precoUnitarioDaCompra({ quantidade: 5, unidade: "kg", valorTotal: -50 }),
    null
  );
  conferir(
    "recusa: todo código tem frase escrita",
    Object.keys(FRASE_DA_RECUSA).length,
    4
  );

  // ── 7. A balança em gramas com a compra em quilos ───────────────────────
  const gramas = derivarTransformacao({
    bruto: { peso: 5, unidade: "kg" },
    limpo: { peso: 4500, unidade: "g" },
    preparado: { peso: 4000, unidade: "g" },
    observacao: "",
  }).indicadores;

  conferir("unidades mistas: bruto normalizado", numeroFixo(gramas.bruto, 3), "5,000");
  conferir("unidades mistas: limpo normalizado", numeroFixo(gramas.limpo, 3), "4,500");
  conferir("unidades mistas: preparado normalizado", numeroFixo(gramas.preparado, 3), "4,000");
  conferir("unidades mistas: mesmo rendimento", numeroFixo(gramas.rendimentoFinalPct, 1), "80,0");
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
  console.log("Conferências da calculadora de rendimento\n");
  for (const f of falhas) {
    console.log(`  FALHA  ${f.nome}`);
    console.log(`         obtido:   ${f.obtido}`);
    console.log(`         esperado: ${f.esperado}`);
  }
  console.log(`\n${passou}/${linhas} passaram — ${falhas.length} falha(s).\n`);
} else {
  console.log(
    `\n  ${passou}/${linhas} conferências da calculadora de rendimento passaram` +
      ` (${Date.now() - inicio} ms)\n`
  );
}

if (manter) {
  console.log(`A compilação ficou em: ${pasta}\n`);
} else {
  rmSync(pasta, { recursive: true, force: true });
}

process.exit(falhas.length === 0 ? 0 : 1);
