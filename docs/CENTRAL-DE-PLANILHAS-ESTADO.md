# Central de Planilhas — estado depois desta rodada

Documento do que foi feito na rodada "CORREÇÃO DA CENTRAL DE PLANILHAS /
TRANSFORMAR A PRÉVIA ATUAL EM UMA PLANILHA OPERACIONAL REAL".

Sem commit, sem push, sem deploy. Nada de banco foi tocado.

---

## 1. Arquivos criados

**Motor**

- `src/lib/planilhas/grade.ts` — o vocabulário da planilha. Tipos puros
  (`GradeDaPlanilha`, `FolhaGrade`, `ColunaGrade`, `LinhaGrade`, `FormatoGrade`),
  os construtores (`dados`, `campo`, `secao`, `nota`, `pendencia`) e a
  formatação (`textoDaCelula`, `valorOuTraco`). Não importa nada — nem React,
  nem ExcelJS, nem `server-only`. É o que permite os dois lados desenharem a
  mesma coisa.
- `src/lib/planilhas/escrever-grade.ts` — o lado servidor. Traduz a
  `GradeDaPlanilha` para XLSX com ExcelJS: cabeçalho, bordas, largura por
  coluna, painel congelado, autofiltro, moeda, percentual, data, linhas de
  total. Carrega `import "server-only"`.
- `src/lib/planilhas/insumos.ts` — `indexarInsumos`, o índice por id de
  ingrediente da base e do cliente. Funções, não mapas, porque
  `noUncheckedIndexedAccess` obriga `?? null` em cada acesso.
- `src/lib/planilhas/modelos/ficha-tecnica.ts` — `montarGradeDaFichaTecnica`.
- `src/lib/planilhas/modelos/custos-precificacao.ts` — `montarGradeDeCustos`.

**Tela**

- `src/app/(sistema)/planilhas/ambiente.tsx` — o ambiente da Central. Seletores
  compactos, carga no cliente, grade.
- `src/app/(sistema)/planilhas/seletor-modelo.tsx` — o seletor de planilha, com
  os modelos que ainda não saem desabilitados e o motivo no `title`.

## 2. Arquivos alterados

- `src/app/(sistema)/planilhas/page.tsx` — reescrita. Era 313 linhas de
  relatório; agora é uma casca de servidor que só lê os clientes.
- `src/components/ui/previa-tabular.tsx` — reescrita. Era uma tabela única;
  agora é o renderizador de folhas múltiplas com faixa de abas.
- `src/app/(sistema)/planilhas/seletor.tsx` — deixou de navegar por URL;
  passou a avisar o pai (`aoTrocar`).
- `src/app/(sistema)/planilhas/previa-relatorio.tsx` — **excluído**.
- `src/lib/planilhas/modelos.ts`, `tipos.ts`, `gerador.ts`, `estilos.ts`,
  `contexto.ts`, `modelos/relatorio-consultoria.ts` — os ajustes de encaixe:
  abas por modelo, `"ingredientes"` no `exige`, os três geradores no registro,
  e as assinaturas sem parâmetro morto.

`src/lib/auth/index.ts` aparece modificado no `git status`, mas é só diferença
de fim de linha (CRLF/LF). Não é desta rodada e não foi tocado.

## 3. Como ficou `/planilhas`

Seletores compactos no topo, barra de ações, faixa de abas, e uma grade grande
abaixo. Mais nada. Não há faixa explicando o que se está vendo, não há título de
seção por cima de cada tabela, não há cartão envolvendo a grade. O histórico
continua discreto no fim e a faixa verde continua no fim como sempre esteve.

O que saiu desta página e por quê: o catálogo de cards com um parágrafo
explicando o que falta em cada modelo. Era a resposta certa para uma tela que
era um catálogo e a resposta errada para uma barra de comando — empurrava a
grade para fora da tela em troca de informação que não se usa no momento de
gerar. Os modelos que não saem continuam no seletor, desabilitados, com o motivo
no `title`.

## 4. Como funcionam as abas estilo Excel

A faixa é `role="tablist"`, cada aba é um `role="tab"` com `aria-selected` e
`aria-controls` apontando para a grade. A aba acesa fica com fundo sólido e
cantos superiores arredondados, encostada na grade — o que faz a faixa parecer
um pé de folha, não um menu. Setas esquerda e direita movem entre abas.

Trocar de aba não toca no servidor e não recarrega nada: é o mesmo `Grade`
desenhando outra `FolhaGrade`. O estado que guarda a grade é o que evita
remontar tudo a cada clique.

## 5. Como ficou o Relatório de consultoria

Quatro folhas: **Resumo**, **Tarefas**, **Acompanhamentos**, **Informações**.
Ao clicar numa aba, o conteúdo da mesma área é trocado. Cada aba é uma grade de
verdade — Tarefas é uma tabela de tarefas, Acompanhamentos é uma tabela de
acompanhamentos, e não duas tabelas empilhadas na mesma página.

## 6. Como ficou a Ficha Técnica

Três folhas: **Fichas**, **Base**, **Informações**.

A folha Fichas é a que mais se aproxima da planilha operacional da Érika.
Todas as fichas do cliente ficam na MESMA folha, separadas por uma faixa de
seção com o nome do prato. Cada ficha é um bloco: PRATO, CATEGORIA, SITUAÇÃO,
ATUALIZADA EM, RENDIMENTO (PORÇÕES), KG POR PORÇÃO, CUSTO TOTAL, CUSTO POR
PORÇÃO, UNI POR PORÇÃO, MARG. SEG %, PREÇO DE VENDA; depois a seção INGREDIENTES
com o cabeçalho e uma linha por insumo — INGREDIENTE, PESO LIQ, UNIDADE,
PREÇO KG, CORREÇÃO, PESO BR., CUSTO, ETAPA, SITUAÇÃO — o subtotal dos insumos, o
peso da receita, as pendências, e o modo de preparo numerado.

A folha Base é a base de insumos, somente leitura. A folha Informações explica
de onde vieram os números.

## 7. Como ficou Custos e Precificação

Três folhas: **Custos**, **Composição**, **Informações**.

Custos tem PRATO, CATEGORIA, PORÇÕES, CUSTO REAL, CUSTO PORÇÃO, PREÇO DE VENDA,
CMV, MARKUP e SITUAÇÃO. Composição abre cada prato nos seus insumos, **em ordem
de custo decrescente** — o insumo que mais pesa no prato aparece primeiro.

## 8. Como os dados da calculadora alimentam a ficha

Não há segunda calculadora. A ficha e a planilha chamam as mesmas funções que a
tela de ficha já usava: `resolverItem` resolve cada item contra o insumo real,
`resumoDaFicha` soma o custo, `indicadoresDeVenda` produz CMV e markup. A
planilha é uma vista dessas funções, não uma segunda conta.

## 9. Como prévia e XLSX compartilham a mesma estrutura

Os três `montarGrade*` devolvem uma `GradeDaPlanilha`. Um único `gerador.ts`
despacha para eles, e o mesmo objeto vai para dois destinos: `escrever-grade.ts`
(servidor, XLSX) e o renderizador React (cliente, `<table>`). Não existe caminho
em que a tela mostre uma coisa e o arquivo saia com outra — é o mesmo dado, duas
pinturas.

Isso funciona porque `grade.ts` é puro. Se o renderizador precisasse de ExcelJS
ou de `server-only`, os dois lados não poderiam compartilhar nada.

## 10. Como ficou o scroll desktop/mobile

O scroll horizontal vive dentro do contêiner da grade e em nenhum outro lugar.
A sidebar não se move, o layout da página não se move. O cabeçalho fica preso no
topo da área rolável quando a folha pede; a primeira coluna fica presa quando a
folha tem mais de três colunas e soltar ganharia mais do que perderia.

No celular a grade continua sendo grade. Nenhuma consulta de mídia converte
linha em cartão — o que se faz é rolar de lado dentro da planilha, que é o que
se faz numa planilha.

## 11. Campos que continuam dependendo da metodologia da Érika

Estes não foram inventados nem preenchidos por padrão. Aparecem como `—`.

- **MARG. SEG %** — vem de `ficha.parametros?.margemSegurancaPct`. Se a ficha
  não traz o número, a planilha escreve `—`. Nunca 5%.
- **CMV alvo** e **markup alvo** — não existem no sistema, e a planilha diz isso
  na folha Informações em vez de fingir um alvo.
- **Correção** — é `relacaoCompraPorUtilizavel`, a relação real medida entre
  compra e parte utilizável. Quando não há medição, `—`. Nunca o fator 1.
- **Preço de venda** — campo da ficha. Enquanto estiver vazio, todo CMV e todo
  markup saem `—`, por desenho e não por falha.

## 12. Faixa verde

Intacta. `page.tsx` linhas 124–136, idênticas ao que estava: "Um arquivo de
verdade" / "Você baixa, abre no Excel e usa." / "Da cozinha para a planilha".
Não removida, não redesenhada, não reescrita.

## 13. Conferências da calculadora

```
npm run conferir:rendimento
→ 42/42 conferências da calculadora de rendimento passaram (2739 ms)
```

## 14. Lint

```
npm run lint   (eslint .)
→ exit 0, sem saída
```

## 15. Typecheck

```
npm run typecheck   (tsc --noEmit)
→ exit 0, sem saída
```

## 16. Build

```
npm run build   (prisma generate && next build)
→ Error: Failed to fetch sha256 checksum at
  https://binaries.prisma.sh/all_commits/c2990dca.../schema-engine.gz.sha256
  — 403 Forbidden
```

Falha de rede do ambiente, não do projeto. O sandbox não alcança
`binaries.prisma.sh`, e `node_modules/@next` aqui só tem o binário do Windows.
Pelo procedimento conhecido, **o build deve ser confirmado no Windows**:

```
npm run build
```

Não mexi em dependência nenhuma para tentar contornar isso.

## 17. Pendências reais

- **`Praça` não foi implementada.** Por isso `pratos-por-praca` continua sem
  gerar arquivo, e isso é dito no seletor em vez de escondido.
- **Custos que não vêm de insumo** — gás, energia, mão de obra, embalagem — não
  têm onde ser informados hoje. A folha Informações de Custos registra a
  ausência explicitamente, em vez de ratear um número inventado.
- **`precoVenda` está vazio nas fichas de demonstração.** Consequência: toda
  célula de CMV e markup sai `—`. É ausência honesta, não defeito.
- **Sem persistência.** O Neon não está ligado, então o histórico continua
  devolvendo lista vazia e editar numa tela não sobrevive ao recarregamento. A
  tela não promete o contrário.

---

Sem commit. Sem push. Sem deploy.
