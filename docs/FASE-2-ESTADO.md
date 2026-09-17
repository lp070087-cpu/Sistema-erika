# FASE 2 — ESTADO REAL

Documento de estado da Fase 2 do Sistema Érika Bruna.

Regra deste arquivo: **nada aqui pode afirmar mais do que foi verificado.** Cada
tela carrega um dos quatro selos abaixo, e o selo diz o que a tela é hoje — não
o que ela será.

| Selo | Significado |
| --- | --- |
| **FUNCIONAL** | A tela funciona. Faz o que promete, com os dados que existem. |
| **DEMONSTRAÇÃO-MOCK** | A tela funciona de verdade, mas lê dados inventados. Nenhum dado real. |
| **PREPARADO PARA BACKEND** | O contrato e a montagem do dado existem. Falta a chamada que grava. |
| **PENDENTE** | Depende de decisão da Seção 17 ou de fase posterior. |

---

## 1. Onde a Fase 2 parou

A Fase 2 foi **interrompida antes de produzir código**. A sessão anterior gastou
o orçamento lendo e auditando (Fase 0, 104 prints, dependências) e foi encerrada
por erro de API no instante em que ia começar a escrever.

Isso foi verificado por data de modificação dos arquivos, não por suposição: as
últimas escritas no projeto eram todas da Fase 1 — `senha.ts` (14:13:09) e o
`middleware.ts` (13:50:20). Nenhuma página da Fase 2 tinha sido criada; `/leads`
e `/diagnosticos` ainda eram o `ModuloPendente` genérico da Fase 1.

Consequência prática: **não havia o que retomar.** Esta sessão construiu a Fase 2
do zero sobre a fundação da Fase 1, que estava intacta.

---

## 2. O que já estava pronto (Fase 1, não refeito)

- Projeto Next.js 15.5.25 + React 19 + TypeScript 5.7 (`strict` +
  `noUncheckedIndexedAccess`), Tailwind v4.
- Design system: Fraunces / Instrument Sans / Parisienne, paleta e utilitários
  (`rotulo`, `assina`, `tabular`) em `src/styles/globals.css`.
- Autenticação Auth.js v5 com sessão JWT, provider de credenciais, hash de senha.
- Tela `/entrar` e layout protegido (grupo `(sistema)`).
- Prisma 6 no schema mínimo, `src/lib/db.ts`, `src/lib/env.ts`.
- 18 rotas de módulo, todas respondendo com escopo declarado.

Nada disso foi alterado, exceto o que a integração exigiu (ver §8).

---

## 3. O que foi construído nesta fase

A entrada inteira: a camada de dados, o dashboard, a fila de leads com detalhe e
observações internas, a lista e o detalhe de diagnósticos, e o formulário público
que o cliente responde.

O princípio que atravessou tudo: **o sistema organiza o que a pessoa declarou, e
não conclui nada por ela.** Não existe score, percentual de saúde, veredito
automático nem classificação de empresa como boa ou ruim. Os pontos 11 (peso das
respostas) e os pontos 4, 5, 6, 7, 9 e 19 (núcleo de cálculo) seguem abertos, e
implementá-los por suposição seria decidir pelo negócio dela.

---

## 4. Rotas da Fase 2

### Públicas — sem sessão

| Rota | O que é | Selo |
| --- | --- | --- |
| `/diagnostico` | O formulário que o cliente responde. 5 etapas, progresso sobre o total, validação de obrigatórias, volta sem validar, conclusão honesta. | **DEMONSTRAÇÃO-MOCK** (não grava) |

### Autenticadas — área da consultora

| Rota | O que é | Selo |
| --- | --- | --- |
| `/` | Dashboard: "Precisa da sua atenção", contadores, fila recente, atividade, mapa do sistema. | **DEMONSTRAÇÃO-MOCK** |
| `/leads` | Fila com filtro por status preservado na URL e cards no celular. | **DEMONSTRAÇÃO-MOCK** |
| `/leads/[id]` | Detalhe: sinais, respostas, contato, integridade, observações internas. | **DEMONSTRAÇÃO-MOCK** + **PREPARADO PARA BACKEND** |
| `/diagnosticos` | Lista com completude, lido/a-ler e sinais recorrentes (contagens verificáveis, sem severidade). | **DEMONSTRAÇÃO-MOCK** |
| `/diagnosticos/[id]` | Detalhe por bloco, contagens objetivas e respostas abertas. | **DEMONSTRAÇÃO-MOCK** |
| `/clientes` | Explica por que o cadastro está bloqueado e aponta o que já funciona. | **PENDENTE** (bloqueada pelos pontos 1, 2, 7 e 10) |
| `/configuracoes` | Da Fase 1. | **FUNCIONAL** |

Rotas dinâmicas com id inexistente chamam `notFound()` e caem em `not-found.tsx`.

---

## 5. O que é realmente funcional

Sem qualificação — funciona e faz o que promete:

- **O formulário público inteiro.** Navegação entre as 5 etapas, preservação das
  respostas ao voltar (estado em memória, nada se desmonta), validação das
  obrigatórias com foco na primeira pergunta com problema, progresso "N de 29",
  barra com `role="progressbar"`, mensagens de erro com `role="alert"`, e a tela
  de conclusão.
- **A proteção de rota.** Middleware e layout em duas camadas, regra de esfera
  única, `/diagnostico` e `/entrar` públicos, todo o resto fechado. Verificado
  com 15 casos, todos passando.
- **Filtro de leads por URL** (`/leads?status=NOVO`).
- **Acessibilidade:** `role="radiogroup"` com `<input type="radio">` real
  escondido (teclado e leitor de tela nativos), rótulos ligados por `htmlFor`,
  `aria-invalid` e `aria-describedby` nos campos com erro.
- **Responsividade** da área pública: cards de opção com 48 px de altura mínima
  (acima do mínimo de toque de 44 px), campos com 16 px de fonte (evita o zoom
  automático do iOS), navegação com `flex-wrap` que não estoura em 375 px.

---

## 6. O que ainda usa mocks

Tudo que mostra dado de lead, diagnóstico, observação ou atividade.

A camada é única e centralizada: `src/lib/dados/mock/dados.ts` é a **única**
fonte de dado fictício, e `repositorio-mock.ts` implementa o mesmo contrato que o
Prisma vai implementar, com a mesma ordenação e as mesmas contagens.

Toda tela que exibe dado de demonstração carrega a `FaixaDemonstracao` visível —
dashboard, `/leads`, `/leads/[id]`, `/diagnosticos`, `/diagnosticos/[id]`. Não
existe tela mostrando dado inventado sem avisar.

Os mocks **não contêm dado pessoal real**: e-mails em `*.exemplo` e telefones
`(51) 99000-000X`.

### A lacuna das perguntas

O relatório da Fase 0 afirma "33 perguntas" em quatro passagens, mas transcreve
**29**. A linha 17 está marcada com `*(corte do print)*` e as perguntas 30–33 não
aparecem em lugar nenhum.

Decisão: transcrever apenas as 29 confirmadas, reconstruir as opções da pergunta
17 pelo padrão de intensidade do próprio formulário, e **declarar a lacuna** em
`LACUNA` — que a interface exibe. Inventar quatro perguntas e apresentá-las como
as reais seria o único erro irreversível aqui: elas iriam para o formulário que a
cliente responde e voltariam como dado que a consultora levaria a sério.

As contagens exibidas na interface derivam de `TOTAL_PERGUNTAS`, não de um
número escrito à mão — fechar a lacuna faz o número acompanhar sozinho.

---

## 7. O que depende de backend / banco

| Dependência | Estado |
| --- | --- |
| `RepositorioEntrada` (contrato de leitura) | Pronto e usado |
| `RepositorioEntradaEscrita` (gravação) | **Declarado, não ligado** |
| Modelos Prisma `Lead`, `Diagnostic`, `DiagnosticAnswer`, `LeadNote` | **Não existem** |
| `DATABASE_URL` do Neon | **Não configurado** (não há `.env`, só `.env.example`) |
| Envio real do diagnóstico público | **Não ligado** |

O ponto de troca é uma linha: `obterRepositorio()` em `src/lib/dados/index.ts`.
Nenhuma tela importa o mock diretamente.

### Duas honestidades deliberadas

**A tela de conclusão não mente.** Ela diz, com estas palavras, que as respostas
*ainda não foram enviadas*. Seria fácil escrever a frase tranquilizadora, e seria
a única coisa do sistema que realmente prejudica alguém: a dona de restaurante
fecharia a aba achando que a consultora tinha os dados, e o diagnóstico não
existiria. Quando o envio entrar, é ali que a promessa muda.

**A caixa de observações internas está desabilitada**, com a razão visível.
Aceitar o texto e descartar em silêncio seria pior do que não aceitar.

### Por que não ligar o banco agora

Ligar produziria telas vazias, o que é pior do que telas claramente marcadas como
demonstração. E o `criarLead` depende do ponto 15 (triagem), que está aberto.

---

## 8. Integração — o que mudou na Fase 1

Mudanças pequenas, todas por necessidade:

- `src/app/layout.tsx` — passa a envolver os filhos em `EsferaPublica`, que decide
  a moldura pela rota. O Next permite um único layout raiz, então um grupo
  `(publico)` só poderia *somar* uma moldura, nunca substituir. Um componente de
  cliente com `usePathname()` resolve sem duas raízes.
- `src/lib/auth/config.ts` — a lista de rotas públicas estava duplicada; agora
  pergunta a `rotaPublica()`. Uma rota pública nova se declara em um lugar só.
- `src/middleware.ts` — reescrito. **Aqui houve um bug de segurança real, pego na
  leitura do código instalado do Auth.js:** passar uma função própria para
  `auth()` faz a biblioteca abandonar o próprio redirecionamento. A primeira
  versão — `auth((req) => NextResponse.next())` — parecia proteção e teria
  desligado a autenticação em silêncio. A decisão de acesso passou a ser
  explícita dentro do middleware, com o motivo documentado no arquivo.
- `src/lib/navegacao.ts` — ganhou o campo `estado`, e o menu passou a ler estado
  declarado em vez de deduzir "pronto" de `fase <= 2`. Ver §9.
- `src/components/layout/barra-lateral.tsx` e `src/app/(sistema)/page.tsx` —
  passaram a ler `estado`.
- `eslint.config.mjs` — `next-env.d.ts` entrou em `ignores`. É gerado pelo Next,
  traz aviso de que não deve ser editado, e a regra de `triple-slash-reference`
  o marcava como erro.
- Componentes públicos importam módulos-folha de `@/lib/dados` em vez do barril,
  que reexporta `obterRepositorio` — não faz sentido levar dados fictícios de
  leads para dentro do pacote que o visitante baixa.

### A tela `/entrar` não foi tocada

Aprovada pelo usuário. Nenhuma mudança visual, de composição ou de identidade.

---

## 9. Estado declarado, não inferido

O menu deduzia "está pronto" de `item.fase <= 2`. Como `/consultorias` é **da**
Fase 2 mas não foi construída (a página é um `ModuloPendente`), ela aparecia em
cor cheia, sem selo, igual a `/leads`. Numa tela de menu não há como ver a
diferença: o item parecia pronto e não estava.

Corrigido na raiz — `estado: "no-ar" | "parcial" | "previsto"` é declarado item a
item. Um módulo novo não pode entrar no menu "pronto por acidente": quem
escrever precisa dizer o que ele é.

---

## 10. Validações reais

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | **Passa. 0 erros.** |
| `npm run lint` (`eslint .`) | **Passa. 0 erros, 0 avisos.** |
| `npm run build` (`prisma generate && next build`) | **Não executado neste ambiente** — ver abaixo |

### Por que o build não rodou aqui

O sandbox de execução é Linux, e o `node_modules` do projeto foi instalado no
Windows: só existe `@next/swc-win32-x64-msvc`. Sem o binário
`@next/swc-linux-x64-gnu`, o `next build` não compila — e a tentativa de
instalar o binário recebeu **403 Forbidden** da política de registro deste
ambiente, não havendo caminho alternativo.

Isso é limitação do ambiente, **não do código**. O `typecheck` cobre os dois erros
de build que já apareceram neste projeto (o tipo do `middleware.ts` e o
estreitamento de tipo em `respostas.tsx`), e ambos estão corrigidos. Ainda assim,
**o build precisa ser rodado no Windows** e o resultado não deve ser dado como
certo antes disso.

Verificações estáticas feitas no lugar do build: nenhum uso de `useSearchParams`
(deixa a rota dinâmica, sem exigir `Suspense`), as duas rotas dinâmicas com
`params` como `Promise` (exigência do Next 15), nenhum import de servidor em
componente de cliente, e nenhum `generateStaticParams` faltando.

---

## 11. Pendências registradas

**Decisões abertas (bloqueiam trabalho, não são bugs):** 4 (índice de cocção),
5 (fator de correção por contexto), 6 (fator de correção duplicado), 7 (CMV alvo
ou markup), 9 (origem do volume do cardápio), 11 (peso das respostas), 15
(triagem), 19 (arredondamento e precisão), 20 (domínio).

**Vulnerabilidades de dependência:** o `npm install` reportou **5
vulnerabilidades — 1 moderada e 4 altas**. Não foram tratadas nesta fase, por
decisão explícita: `npm audit fix --force` faz atualização destrutiva e não se
faz isso no meio da entrega de uma fase. **Fica registrado para análise
posterior.**

**Avisos de `allow-scripts` envolvendo Prisma:** não silenciados. Não se mexe em
configuração de script de instalação só para limpar a saída do terminal.

**Importador do Google Forms:** deliberadamente não escrito. As respostas reais
da consultora não foram importadas, e um importador sem os pontos 12, 14 e 15
respondidos gravaria dados com o formato errado.

---

## 12. Git

Nenhuma operação. Sem `git init`, sem remote, sem commit, sem push, sem deploy.
O repositório "Sistema-erika" no GitHub segue aguardando o projeto, como estava.

---

## 13. Fronteira da Fase 3

A Fase 3 não foi iniciada, por instrução. Nada de ficha técnica, fator de
correção, índice de cocção, CMV, markup, precificação ou resultado financeiro foi
implementado — todos dependem dos pontos 4, 5, 6, 7, 9 e 19.

Existe um teste de lint que barra componente visual de importar domínio
(`no-restricted-imports` em `eslint.config.mjs`), para que o cálculo, quando
existir, nasça no servidor e não na interface.
