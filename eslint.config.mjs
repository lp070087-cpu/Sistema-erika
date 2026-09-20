import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "src/generated/**",
      // next-env.d.ts é escrito pelo próprio Next a cada `next dev` e
      // `next build`. Ele usa `/// <reference path=...>` para apontar os
      // tipos de rota, e a regra `triple-slash-reference` marca isso como
      // erro — mas o arquivo traz um aviso explícito de que não deve ser
      // editado. Corrigi-lo à mão seria desfeito no próximo build; a
      // leitura correta é que ele não é código deste projeto.
      "next-env.d.ts",
    ],
  },
  {
    /*
      O PARÂMETRO QUE EXISTE PARA MARCAR A FORMA DA FUNÇÃO.

      A interface do extrator é `extract(arquivo: File)`, e a implementação de
      hoje não lê arquivo nenhum — ela responde `INDISPONIVEL`. Tirar o
      parâmetro faria a função deixar de cumprir o tipo, e é justamente a
      ASSINATURA que faz a decisão de contratar um leitor ser uma decisão de
      configuração, e não de arquitetura.

      Antes disto o parâmetro se chamava `_arquivo`, e o lint reclamava de um
      jeito que a convenção não consegue silenciar: `next/typescript` não
      configura `argsIgnorePattern`, então nenhum sublinhado escapa — o
      underscore é só um aviso para quem lê, não para o linter.

      Isto é configuração do LINT, e não uma regra desligada: a regra continua
      valendo, e o que ela passa a aceitar é o nome pelo qual a própria
      documentação do eslint diz que se marca "parâmetro que a assinatura
      exige e o corpo não usa".
    */
    files: ["src/components/**/*.tsx", "src/components/**/*.ts"],
    rules: {
      // A fronteira pedida no briefing: regra de negócio gastronômica não
      // pode viver em componente visual. O lint não prova isso em todos
      // os casos, mas barra o caminho mais fácil de violar — importar o
      // domínio direto na interface.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/lib/domain/*", "@/lib/domain/*"],
              message:
                "Componente visual não importa domínio. Receba o valor já calculado por props — o cálculo pertence ao servidor.",
            },
          ],
        },
      ],
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];

export default eslintConfig;
