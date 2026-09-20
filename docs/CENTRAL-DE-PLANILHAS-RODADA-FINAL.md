# Central de Planilhas — relatório final da rodada

Documento da rodada **"FINALIZAR CENTRAL DE PLANILHAS"**, na sequência do commit
`96f6daa — Finaliza central de planilhas com fichas e custos`.

Sem commit, sem push, sem deploy. Nenhum banco foi tocado. Nenhuma dependência
foi adicionada. A calculadora de rendimento não foi refeita.

---

## 1. O problema que a rodada resolve

A tela `/planilhas` estava errada **conceitualmente**. Ela abria com seletores no
topo, um bloco "Escolha um cliente", uma área vazia, o histórico, e só depois —
em alguns estados — aparecia a planilha. Quatro seções de página com título e
descrição, e a planilha ocupando um terço da altura.

A tela era um **relatório sobre planilhas**. Agora é uma **ferramenta de
planilha**: uma barra de comando de uma linha, e abaixo dela a grade com as abas.

---

## 2. A planilha está sempre aberta (§1)

`AmbienteDaPlanilha` monta a grade **na primeira pintura**, sem cliente nenhum
escolhido. O modelo padrão do catálogo passou a ser a Planilha em Branco, que
declara `exige: []` — e é essa declaração que faz ela ser o padrão.

Três coisas tiveram de mudar para isso funcionar, e as três eram a mesma trava
em lugares diferentes:

- o `if (!clienteId) return` saiu do efeito de montagem; ele fazia o efeito sair
  na primeira linha justamente no caso em que não há cliente;
- `carregar` ganhou um ramo próprio para os modelos que montam sem cliente, que
  retorna **antes** do `montando` — uma grade de 30 linhas vazias não tem o que
  ir buscar no repositório, e o piscar de "carregando" seria mentira;
- o `EstadoVazio` "Escolha um cliente" saiu do caminho da grade, e virou uma
  frase **dentro** do ambiente, ao lado do seletor, que é onde ela aponta e onde
  a Érika pode agir.

A grade nunca mais desaparece: os modelos que dependem de cliente mostram a
folha em branco do sistema com o aviso **acima** dela, e não no lugar dela.

## 3. As funções foram para o topo (§2)

`Seletores` é uma faixa de comando: `Cliente` / `Planilha` / `Consultoria`,
depois `[Recarregar] [Importar PDF]` e o botão de gerar. Sem título, sem
descrição, sem moldura de cartão. Os modelos que ainda não saem continuam no
seletor de planilha, desabilitados, com o motivo no `title`.

O catálogo de cards que explicava cada modelo em um parágrafo saiu da tela.

## 4. Abas (§3)

A grade tem abas, e a aba ativa é **uma folha exibida**. Trocar de aba não
recarrega: a grade inteira já está no navegador, porque quem a monta são funções
puras. As abas da importação seguem `[FICHA] [BASE] [INFORMAÇÕES]` no modelo, e
`[FICHA]` na folha importada (ver §14 sobre por que não há abas vazias).

## 5. O formato visual da grade (§4)

Grade tradicional, como pedido: **faixa de letras** A, B, C… no topo, **coluna de
números** de linha à esquerda, divisões finas, linhas compactas, cabeçalhos de
seção, alinhamento tabular (`text-right` em moeda e número), seleção e edição
claras, largura por coluna declarada.

A página inteira **não** ganha scroll horizontal: o scroll é interno ao
contêiner da grade. As letras e os números ficam presos (`sticky`) enquanto o
conteúdo rola.

Nenhuma linha virou cartão. Nenhum cartão dentro de célula. Não é uma interface
de relatório.

## 6. Identidade Érika Bruna (§5)

Creme, off-white, verde escuro e oliva, todos vindos dos tokens que já existiam
em `src/styles/globals.css`. Tipografia e bordas do sistema.

Nenhum verde do Google Sheets foi copiado. As únicas cores "novas" no código
(`#991b1b` e `var(--color-dourado)`) já estavam no projeto — são os tons
`critico` e `dourado` de `estilos.ts` e `indicador.tsx`, reusados para a coluna
STATUS da conferência.

## 7. Criar planilha do zero (§6)

O modelo **Planilha em Branco** existe com 30 linhas × 12 colunas (A–L), e a
arquitetura de edição aceita texto, número e valor manualmente. Ela é o padrão da
tela.

**Sobre persistência, com todas as letras:** não há Neon nesta rodada, e o
sistema **não finge** que há. O que a Érika digita vive no estado da sessão do
navegador. Fechar a aba perde o que foi digitado, e isso está dito na tela.

## 8. Edição direta (§7)

Clique na célula → edita → **Enter** confirma → **Escape** cancela → **Tab**
avança. Nenhum formulário gigante.

A distinção entre **entrada manual** e **valor calculado** é estrutural, e não
decorativa: `FolhaGrade.calculadas` guarda os endereços das colunas de resultado,
e o componente não abre edição neles. Uma célula calculada não é "somente
leitura por estilo" — ela não tem caminho de escrita.

## 9. Importar PDF — arquitetura (§8, §17)

A interface é desacoplada, como pedido:

```
PDF → DocumentExtractor.extract(file) → DocumentoExtraido
    → normalizador → validador → domínio operacional
    → GradeDaPlanilha → prévia na tela / XLSX
```

`DocumentExtractor` é um **tipo** em `importacao/tipos.ts`, e o único arquivo que
o implementa é `importacao/leitor-local.ts`. Trocar de provedor é trocar esse
arquivo; a tela não muda uma linha.

**E o leitor de hoje não lê PDF.** Ele responde `INDISPONIVEL` com o motivo
escrito, e a tela diz isso claramente antes de tentar. Não há serviço de leitura
contratado nem modelo configurado — `.env.example` tem exatamente seis chaves
(`AUTH_SECRET`, `AUTH_URL`, `DATABASE_URL`, `DIRECT_URL`, `AUTH_EMAIL`,
`AUTH_PASSWORD_HASH`) e nenhuma delas é de IA.

Não há heurística de regex fingindo ser interpretação, porque ela acertaria em
três fichas e erraria na quarta **sem avisar**. O que existe é o fluxo inteiro
funcionando, com digitação manual na conferência — que é o caminho que funciona
sem leitor nenhum.

## 10. O fluxo do PDF (§9)

Quatro etapas, num trilho visível: **Arquivo → Leitura → Conferência → Prévia**.

A **ETAPA 3 (normalização)** converte o que não tem ambiguidade e **recusa o que
tem**, com prova de execução:

| texto | quantidade | dinheiro |
|---|---|---|
| `5 kg` | 5 kg | — |
| `5kg` | 5 kg | — |
| `3,5 kg` | 3,5 kg | — |
| `500 g` | 500 g | — |
| `1.234,56` | 1234,56 | 1234,56 |
| `1.500` | **AMBÍGUO** (1,5 / 1.500) | **AMBÍGUO** |
| `1,500` | **AMBÍGUO** | **AMBÍGUO** |
| `cinco quilos` | INVALIDO | INVALIDO |
| (vazio) | VAZIO | VAZIO |

Ambigüidade não é convertida em silêncio: vai para a conferência marcada para
revisão, com as duas leituras na tela.

A **ETAPA 4 (conferência)** é a grade `DADO NO DOCUMENTO | VALOR LIDO | STATUS |
O QUE FAZER`, com Confirmado / Atenção / Precisa revisar, correção manual campo a
campo, e a oferta de aplicar a mesma correção nas outras linhas que dizem o
mesmo texto.

## 11. Análise e cálculos (§10) — e um defeito encontrado e corrigido

Os cálculos **reusam o motor que já existia**: `resolverItem`, `resumoDaFicha`,
`custoPorEtapa`, `derivarTransformacao`. Não há segunda calculadora.

Durante a verificação end-to-end apareceu um **defeito real**, e ele era o
defeito mais caro possível nesta tela. `calcularImportacao` chamava:

```ts
resolverItem(itemDaLinha(linha, ingrediente), null, null)
```

`ingredienteDaLinha` existe para carregar os três pesos — o de compra, que veio
do documento, e o limpo e o preparado, que a Érika digita na conferência depois
de pesar na balança. `resolverItem` os lê de `ingrediente.transformacao`. Passando
`null` naquele argumento, **o motor via um insumo sem transformação nenhuma**, e
as pesagens da balança não chegavam a lugar nenhum.

As consequências, e nenhuma aparecia como erro:

- a coluna **CORREÇÃO** (`relacaoCompraPorUtilizavel`) saía **vazia em toda linha**;
- as pesagens eram inertes: a Érika media na balança, digitava, e a planilha
  ignorava.

O custo saía certo **por acidente**, e é isso que tornava o defeito difícil de
ver: o item nasce com `etapa: "COMPRA"`, e `custoDaQuantidade` multiplica pelo
custo da etapa pedida — que era COMPRA. O número plausível escondia a conta que
faltava.

O erro era o **argumento do meio** (o insumo da biblioteca), e não o das
pesagens. Os dois estavam como `null`, e é por isso que a chamada parecia
deliberada. A correção passa o ingrediente construído — mantendo o segundo
argumento em `null`, porque o insumo importado **não** está na biblioteca.

**Prova por execução** (mesmo documento, mesma entrada, só o argumento trocado):

```
ANTES   CORREÇÃO: null   | limpeza: null  | cocção: null | total: null
        custos: {"compra":10,"limpo":null,"preparado":null}

DEPOIS  CORREÇÃO: 1.25   | limpeza: 90    | cocção: 88.888… | total: 80
        custos: {"compra":10,"limpo":11.111…,"preparado":12.5}
```

E o vazamento de preço continua fechado — o insumo importado é passado ao motor
agora, e ele **não** pode ter preço próprio:

```
precoAtual do insumo importado : null   (precisa ser null)
fornecedor                     : ""     (precisa ser vazio)
origem do preço                : FICHA  (nunca BIBLIOTECA)
```

### Os sete números do exemplo validado — e uma inconsistência no briefing

| número | valor | fonte |
|---|---|---|
| preço de compra /kg | **R$ 10,00** | `item.precoReferencia` |
| perda de limpeza | **0,5 kg** | `perdaLimpeza` |
| rendimento de limpeza | **90%** | `rendimentoLimpezaPct` |
| fator de correção | **1,1111…** | `1 / 0,90` |
| rendimento de cocção | **88,888…%** | `rendimentoPreparoPct` |
| rendimento total | **80%** | `rendimentoFinalPct` |
| custo efetivo final /kg | **R$ 12,50** | `custos.preparado` |

Os seis primeiros conferem exatamente. O sétimo, **não** — e a razão está no
próprio exemplo, não no código:

> rendimento total 80% → fator = 1/0,80 = **1,25**
> custo efetivo R$ 12,50 = R$ 10,00 × **1,25**
> mas o briefing escreve fator de correção = **1,1111**

`1,1111` é `1/0,90` — o fator da **limpeza**. Com esse fator o custo final seria
R$ 11,11, e não os R$ 12,50 que o briefing também cita. Os dois não podem ser o
mesmo número.

O código expõe **os dois**, separados e nomeados: `rendimentoLimpezaPct = 90`
(donde sai 1,1111) e `relacaoCompraPorUtilizavel = 1,25` (a razão entre compra e
peso final, que é o que a coluna CORREÇÃO mostra). Nenhuma fórmula foi inventada
para forçar o número do exemplo a fechar.

## 12. Validação antes da entrega (§11)

O fluxo obrigatório é `PDF → EXTRAÇÃO → NORMALIZAÇÃO → CONFERÊNCIA → CÁLCULOS →
VALIDAÇÃO → PRÉVIA → GERAR/BAIXAR XLSX`, e as validações são objetivas: peso
ausente, preço ausente, unidade desconhecida, número inválido, peso zero, custo
impossível de calcular, ingrediente sem preço, informação contraditória. Cada uma
classifica em **OK / ATENÇÃO / PRECISA REVISAR**.

Nenhum julgamento gastronômico: o único teste numérico é de **plausibilidade** —
ele pergunta se o número é possível, não se ele é bom.

## 13. Geração automática (§12)

`[GERAR PLANILHA]` preenche PRATO, CATEGORIA, RENDIMENTO, PORÇÕES, INGREDIENTES,
PESO LÍQUIDO, UNIDADE, PREÇO, CORREÇÃO, PESO BRUTO, CUSTO e ETAPA. O que não
existe fica `—` ou vazio e editável. Nenhum valor inventado.

A linha que não passou na conferência entra na lista **sem nunca ter passado pelo
motor** — `custo: null` porque não foi calculado, e não porque foi anulado
depois. É isso que faz o custo total sair como `—` em vez de sair parcial e ser
lido como o custo da receita.

## 14. XLSX (§13)

Existe **uma** estrutura lógica. `gradeDaImportacao` devolve `GradeDaPlanilha`; o
componente `PreviaDaPlanilha` desenha uma, e o escritor ExcelJS escreve a outra.

```
GradeDaPlanilha → prévia React
GradeDaPlanilha → ExcelJS/XLSX
```

Não existe modelo de exportação paralelo. As colunas da planilha importada são
`COLUNAS_ITENS`, importadas do modelo de Ficha Técnica — a importação não inventa
um formato próprio.

## 15. Planilha em branco (§14)

30 linhas × 12 colunas (A–L), grade manual simples e profissional. **Nenhuma
fórmula** de Excel: sem `=SUM()`, `=IF()`, macros, scripts, gráficos ou tabelas
dinâmicas.

`+ CRIAR PLANILHA` cria uma aba nova na sessão, nomeada `Planilha N` (e não
`Planilha 1`, para não colidir com o nome que o Excel recusa quando há abas
duplicadas).

## 16. Histórico (§15)

O histórico **não** ocupa mais o centro da experiência. Virou um acordeão nativo
(`<details>` / `<summary>`) de uma linha: `Histórico — nenhuma planilha gerada
ainda`. Usa `details`/`summary` nativos de propósito — o navegador cuida do
teclado, e o conteúdo continua no HTML para a busca da página.

Ele vem **depois** da área de trabalho.

## 17. Faixa verde (§16)

A faixa "UM ARQUIVO DE VERDADE" / "Você baixa, abre no Excel e usa." / "Da
cozinha para a planilha" **permanece**, com a mesma identidade: mesmo verde,
mesma assinatura, mesmo texto.

O que mudou foi o que vem antes dela. Ela fecha a página, depois do trabalho e do
histórico — e assim deixa de competir com a grade pela atenção.

## 18. Segurança do upload (§18)

Só PDF. `importacao/seguranca.ts` valida MIME, extensão, tamanho máximo, arquivo
vazio e falha de leitura — e lê os **cinco primeiros bytes** para confirmar a
assinatura `%PDF-`, sem confiar no nome do arquivo.

O conteúdo do documento nunca é executado. O texto do PDF é **dado**, e dado não
se renderiza como markup: não há caminho em que HTML vindo do PDF chegue à
interface como HTML.

## 19. O que NÃO foi implementado, e por quê (§19)

Não foi implementado nada disto, exatamente como pedido: Neon; persistência
definitiva; cobrança; WhatsApp; estoque; compras; financeiro; IA inventada; OCR
fictício; fórmula gastronômica não confirmada; CMV alvo; markup alvo; preço
recomendado; margem ideal.

A ausência é **honesta e visível**: `null` vira `—`, nunca `0`.

---

## Validação (§23)

| comando | resultado |
|---|---|
| `npm run conferir:rendimento` | **42/42 conferências da calculadora de rendimento passaram** (3421 ms) |
| `npm run lint` | **0 problemas** — 0 erros, 0 avisos |
| `npm run typecheck` | **0 erros** (`NODE_OPTIONS=--max-old-space-size=750 npx tsc --noEmit`) |
| `npm run build` | **bloqueado pelo ambiente — ver abaixo** |

### O bloqueio do build, exatamente como ele aparece

```
> prisma generate && next build

Error: Failed to fetch sha256 checksum at
https://binaries.prisma.sh/all_commits/c2990dca591cba766e3b7ef5d9e8a84796e47ab7/debian-openssl-3.0.x/libquery_engine.so.node.gz.sha256
- 403 Forbidden
```

`prisma generate` não consegue baixar o engine: `binaries.prisma.sh` responde
**403 Forbidden** neste ambiente. É o bloqueio conhecido, e ele acontece **antes**
do Next.

Rodando só `npx next build`, o Next falha pelo segundo bloqueio do ambiente:

```
⨯ Failed to load SWC binary for linux/x64
```

`node_modules/@next` contém apenas `swc-win32-x64-msvc` — o binário do Windows,
que é a plataforma de desenvolvimento. **Este ambiente é Linux**, e o binário
nativo do Linux não está instalado.

Nenhuma dependência foi alterada para contornar o sandbox: `package.json` e
`package-lock.json` não foram tocados, e nenhuma variável de ambiente foi
introduzida com esse fim.

**O build precisa ser confirmado no Windows.**

### Os 12 arquivos rastreados alterados, e o que fazer com cada um

| arquivo | o que é |
|---|---|
| `src/app/(sistema)/planilhas/ambiente.tsx` | a barra de comando e a grade sempre visível |
| `src/app/(sistema)/planilhas/page.tsx` | ordem da tela: ambiente → histórico → faixa verde |
| `src/app/(sistema)/planilhas/historico.tsx` | acordeão de uma linha |
| `src/components/ui/previa-tabular.tsx` | a grade estilo planilha |
| `src/lib/planilhas/grade.ts` | vocabulário da grade + `linhasVazias` |
| `src/lib/planilhas/gerador.ts` | rota de download da planilha importada |
| `src/lib/planilhas/escrever-grade.ts` | fixação de linha por folha |
| `src/lib/planilhas/estilos.ts` | larguras e estilos |
| `src/lib/planilhas/modelos.ts` | catálogo + `MODELO_PADRAO` + `modeloDisponivel` |
| `src/lib/planilhas/modelos/ficha-tecnica.ts` | **só** o `export` de `COLUNAS_ITENS` |
| `src/lib/dados/tipos-operacao.ts` | o estado `AGUARDANDO_CONFERENCIA` |
| `eslint.config.mjs` | `argsIgnorePattern: "^_"` para o parâmetro de assinatura |
| `src/lib/auth/index.ts` | **NÃO É DESTA RODADA** — diff de CRLF apenas |

`git diff --ignore-all-space -- src/lib/auth/index.ts` sai vazio: a alteração é só
de fim de linha. Pode ficar de fora do commit.

### Arquivos novos (não rastreados — o git não pode verificá-los)

```
src/lib/planilhas/importacao/{tipos,seguranca,normalizar,validar,para-ficha,leitor-local}.ts
src/lib/planilhas/modelos/em-branco.ts
src/app/(sistema)/planilhas/importar/{page,janela,conferencia,envio}.tsx
src/app/api/planilhas/importada/route.ts
```

### Uma correção fora do escopo pedido, e por que ela entrou

`eslint.config.mjs` ganhou `@typescript-eslint/no-unused-vars` com
`argsIgnorePattern: "^_"`. Sem isso, o parâmetro `extract(arquivo: File)` do
leitor — que existe para cumprir a interface e não é usado, porque a
implementação responde `INDISPONIVEL` — era o único aviso de lint do repositório.
O `next/typescript` não configura `argsIgnorePattern`, então nenhum sublinhado
escapava. É configuração do lint, não regra desligada: a regra continua valendo.

---

**PARE AQUI.** Nada foi commitado, nada foi enviado, nada foi publicado.
