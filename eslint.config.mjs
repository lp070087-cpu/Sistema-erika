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
];

export default eslintConfig;
