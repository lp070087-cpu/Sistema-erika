# FASE 1 — ESTADO REAL

**Data:** 17 de setembro de 2026
**Escopo autorizado:** fundação e identidade, exclusivamente.
**Escopo executado:** fundação e identidade, exclusivamente.

---

## 1. O que foi criado

O projeto passou de uma pasta vazia com um documento para um sistema Next.js
completo, ainda sem banco e sem regra de negócio.

**50 arquivos, 3.228 linhas** — assim distribuídos:

| Grupo | Arquivos | O que contém |
|---|---|---|
| Configuração | 8 | package.json, tsconfig, next.config, postcss, eslint, gitignore, env.example |
| Design system | 7 | tokens em CSS e sete componentes de interface |
| Estrutura da aplicação | 2 | barra lateral e shell |
| Marca | 1 | logotipo e monograma |
| Autenticação | 3 | configuração, provider e verificação de senha |
| Rotas e páginas | 17 | entrada, visão geral, configurações, 13 módulos, erro/carregando/404 |
| Camadas de apoio | 4 | banco, ambiente, navegação, utilitário |
| Scripts | 1 | gerador de hash de senha |
| Schema | 1 | Prisma, mínimo |
| Documentação | 3 | README, este documento, README do domínio |

---

## 2. Arquivos principais

| Arquivo | Papel |
|---|---|
| `src/styles/globals.css` | Os tokens da marca. Todo o visual deriva daqui. |
| `src/app/layout.tsx` | Carrega as três tipografias da marca. |
| `src/app/(sistema)/layout.tsx` | Portão de acesso da área autenticada. |
| `src/app/(sistema)/page.tsx` | Visão geral — a tela principal desta fase. |
| `src/components/layout/barra-lateral.tsx` | Navegação com os seis grupos. |
| `src/lib/navegacao.ts` | Os treze módulos, sua fase e suas pendências. |
| `src/lib/auth/index.ts` | Provider de credenciais. |
| `src/lib/auth/senha.ts` | scrypt, sem dependência externa. |
| `src/lib/db.ts` | Acesso ao banco, com import dinâmico. |
| `prisma/schema.prisma` | Schema mínimo — só acesso e auditoria. |

---

## 3. Estrutura criada

```
sistema-erika/
├── README.md
├── package.json · tsconfig.json · next.config.mjs
├── postcss.config.mjs · eslint.config.mjs · .gitignore · .env.example
├── docs/
│   ├── FASE-0-ANALISE-E-ARQUITETURA.md
│   └── FASE-1-ESTADO.md
├── prisma/schema.prisma
├── scripts/gerar-hash-senha.mjs
└── src/
    ├── app/
    │   ├── layout.tsx · error.tsx · loading.tsx · not-found.tsx
    │   ├── entrar/                  (page, formulario, acoes)
    │   ├── api/auth/[...nextauth]/route.ts
    │   └── (sistema)/
    │       ├── layout.tsx · page.tsx
    │       ├── configuracoes/       (page, botao-sair, acoes)
    │       ├── leads/ diagnosticos/ clientes/ consultorias/ equipe/
    │       ├── ingredientes/ fichas/ cardapios/ precificacao/
    │       └── processos/ tarefas/ acompanhamentos/ relatorios/ biblioteca/
    ├── components/
    │   ├── layout/  barra-lateral, shell
    │   ├── marca/   logotipo
    │   └── ui/      rotulo, botao, campo, tabela, indicador, superficie, modulo-pendente
    ├── lib/
    │   ├── auth/    config, index, senha
    │   ├── domain/  README (vazio — ver seção 6)
    │   ├── utils/   cn
    │   ├── db.ts · env.ts · navegacao.ts
    ├── styles/globals.css
    └── types/next-auth.d.ts
```

---

## 4. Decisões técnicas

**Tailwind CSS v4 com `@theme`.** Os tokens da marca vivem em
`src/styles/globals.css`, extraídos de `../erika-bruna/assets/estilo.css`.
A paleta é a mesma, sem alteração de valor. As três famílias tipográficas
foram preservadas.

*A adaptação para ferramenta:* a escala tipográfica do site vai de
`2.1rem` a `4.25rem`; aqui vai de `1.125rem` a `2.25rem`. O respiro de
seção caiu de `clamp(4.5rem, 9vw, 8.5rem)` para `clamp(1.5rem, 2.5vw, 2.5rem)`.
O corpo de texto subiu para `0.9375rem` e a entrelinha para `1.6`, porque
aqui se lê por muito mais tempo. Os cantos continuam quase retos (4px),
o rótulo de seção com traço de 34px continua sendo o elemento-assinatura,
e o marca-texto oliva continua existindo — mas só em destaque de leitura,
nunca em rótulo de interface.

**Componentes sem regra de negócio.** Nenhum componente em
`src/components/` calcula custo, CMV, margem ou arredondamento. O
componente `Indicador` recebe o valor já formatado *e o tom já decidido* —
de propósito. Uma função como `tomDoCmv()` seria regra de negócio, e essa
regra depende do ponto 7.

**scrypt em vez de bcrypt.** A senha usa o módulo `crypto` do próprio Node,
no formato autocontido `scrypt$salt$hash`. Evita uma dependência binária
só para isso.

**Import dinâmico do Prisma.** `src/lib/db.ts` importa `@/generated/prisma`
dentro da função, não no topo. Motivo: `prisma generate` ainda não rodou,
então o módulo não existe no disco. Um import estático quebraria a
verificação de tipos e o build antes de qualquer coisa funcionar — inclusive
antes de a consultora conseguir ver a tela que diz o que falta configurar.

**Guarda de ambiente no middleware.** O Auth.js lança `MissingSecret`
quando não há segredo, e na Fase 1 esse é o estado esperado — o que
derrubaria justamente a tela que deveria explicar o problema. Sem segredo
não existe sessão possível (`authorize()` recusa tudo), então deixar a
requisição passar não expõe nada. A guarda deixa de ter efeito assim que
as variáveis forem preenchidas.

**`noUncheckedIndexedAccess` ligado.** Acesso a índice devolve
`T | undefined`. Custa algum ruído agora e evita uma classe inteira de
erro quando o motor de cálculo da Fase 3 existir.

---

## 5. Componentes do design system

| Componente | O que é | Origem |
|---|---|---|
| `Rotulo` | Rótulo de seção: caixa alta, 0.6875rem, tracking 0.26em, traço de 34px | `.eb-rotulo` do site |
| `CabecalhoPagina` | Cabeçalho com rótulo, título, descrição e ações | adaptado |
| `Botao` / `BotaoLink` | Caixa alta, tracking 0.16em, canto 2px, quatro variantes | `.eb-btn` |
| `Campo` / `CampoSelecao` | Rótulo pequeno, borda fina, foco em oliva, mensagem de ajuda e erro | novo |
| `Tabela` | Tabela com números tabulares e alinhamento à direita | novo |
| `Indicador` | Valor com rótulo, unidade, contexto e tom | novo |
| `Etiqueta` | Estado em texto e borda, sem bolinha colorida | novo |
| `Secao` / `Painel` | Superfícies delimitadas por linha, não por sombra | novo |
| `EstadoVazio` | Ausência de dado explicada, nunca célula em branco | novo |
| `Aviso` | Quatro tons por nível de consequência | novo |
| `Trilha` | Etapas numeradas — o método de 5 etapas, ou o diagnóstico | novo |
| `ModuloPendente` | Módulo futuro: escopo, fase e de que decisões depende | novo |
| `Logotipo` / `Monograma` | Marca composta tipograficamente | novo |

Nenhum deles usa gradiente, sombra flutuante ou card genérico.

---

## 6. Rotas existentes

**Construídas (3):**

| Rota | Estado |
|---|---|
| `/entrar` | Funcional. Mostra o que falta no ambiente quando incompleto. |
| `/` (visão geral) | Funcional. Mapa do sistema e estado real da fundação. |
| `/configuracoes` | Funcional. Sessão, variáveis de ambiente, sair do sistema. |

**Com rota e escopo declarado, sem implementação (13):**

`/leads` · `/diagnosticos` · `/clientes` · `/consultorias` · `/equipe` ·
`/ingredientes` · `/fichas` · `/cardapios` · `/precificacao` ·
`/processos` · `/tarefas` · `/acompanhamentos` · `/relatorios` ·
`/biblioteca`

Cada uma diz o que vai fazer, em que fase entra e de quais pontos da
Seção 17 depende. Nenhuma devolve 404.

**Utilitárias:** `/api/auth/[...nextauth]` · `not-found` · `error` · `loading`

---

## 7. Resultado do lint

**Não executado.** O ambiente de trabalho não tem rede: `npm install`
devolve **403** através do proxy da sandbox e não há DNS. Sem
`node_modules`, o ESLint não roda.

O que foi verificado por análise estática:

- Nenhuma ocorrência de sintaxe de `!important` do Tailwind v3 (`!text-`,
  `!bg-`) — todas convertidas para o modificador de sufixo do v4.
- Nenhuma classe de duração fora da escala padrão.
- Nenhum componente cliente com `await auth()`.
- Nenhuma página de servidor usando hooks de cliente.
- Nenhuma string com escape suspeito.

## 8. Resultado do typecheck

**Não executado**, pelo mesmo motivo: `typescript` não está instalado.

Verificações que substituíram o `tsc`:

- Todos os imports `@/` resolvem para arquivo ou pasta existente.
- Todos os imports nomeados têm export correspondente nos módulos do
  projeto. *(O verificador apontou cinco falsos positivos em
  `@/lib/auth` — são o `export const { handlers, auth, signIn, signOut }`
  destruturado, que o padrão de busca não reconhece.)*
- `package.json` e `tsconfig.json` são JSON válido.
- Chaves, parênteses e colchetes balanceados em todos os arquivos.

## 9. Resultado do build

**Não executado.** `next build` exige `node_modules`.

O `npm run build` inclui `prisma generate` antes do `next build`, para que
o cliente Prisma exista quando o Next compilar o `src/lib/db.ts`.

---

## 10. Comandos para validar de verdade

Rodar em uma máquina com rede, dentro de `sistema-erika/`:

```bash
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

Depois, conferir no navegador:

1. `http://localhost:3000` sem sessão → deve redirecionar para `/entrar`.
2. `/entrar` sem `.env` configurado → deve listar as variáveis ausentes,
   não recusar em silêncio.
3. Preencher o `.env`, entrar, e confirmar a visão geral.
4. `/configuracoes` → conferir as variáveis e o botão de sair.
5. Redimensionar para 375px, 768px, 1024px e 1440px nas duas telas.
6. Navegar pelos treze módulos — nenhum deve dar 404.
7. Visitar uma rota inexistente → deve cair na página 404 da marca.

---

## 11. O que continua pendente

### Decisões da consultora — Seção 17

**Bloqueiam a Fase 3 (o núcleo):** 4, 5, 6 — o fator de correção — e 19.
**Bloqueiam a Fase 4:** 7 — a régua de preço.
**Bloqueiam o módulo de resultado:** 9 — a origem do volume.
**Bloqueiam a Fase 2:** 11, 12, 13, 15 — o diagnóstico.

As demais dez (1, 2, 3, 8, 10, 14, 16, 17, 18, 20, 21, 22) não impedem
o desenvolvimento desta fase nem da próxima.

### Técnico

| Pendência | Quando resolve |
|---|---|
| `npm install` e validação real de lint, tipos e build | Primeira execução em máquina com rede |
| Banco Neon | Antes da Fase 2 |
| Migration inicial | Junto com o banco |
| Repositório Git | Quando esta fase for revisada e aprovada |
| Projeto na Vercel | Quando houver o que publicar |
| Domínio / subdomínio | Antes do formulário público — ponto 20 |
| Identidade visual no banco real | Fase 3, ao renderizar dados |
| Testes automatizados | Não previstos para a Fase 1 |

### Não verificado por ausência de rede

- Comportamento visual real das duas telas.
- Responsividade em dispositivo físico.
- O fluxo de autenticação ponta a ponta, que exige o `.env` preenchido.
- Renderização das fontes da marca.

---

## 12. Confirmação de escopo

Nenhuma regra de negócio gastronômica foi implementada. Nenhum modelo de
ingrediente, ficha, custo, CMV, preço ou processo foi criado no banco.
Nenhuma fórmula foi escrita. Nenhuma pergunta da Seção 17 foi respondida
por suposição.

O site em `../erika-bruna/` não foi alterado. Nenhum repositório Git foi
iniciado. Nenhum serviço externo foi configurado.

**A Fase 2 não foi iniciada.**
