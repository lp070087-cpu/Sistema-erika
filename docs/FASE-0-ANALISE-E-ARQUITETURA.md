# SISTEMA ÉRIKA BRUNA — FASE 0
## Auditoria, análise da operação e arquitetura proposta

**Data:** 17 de setembro de 2026
**Escopo desta fase:** auditoria e planejamento. Nenhuma linha de código do sistema foi escrita.
**Estado do site `erika-bruna/`:** intocado.
**Estado dos materiais da cliente:** intocados.

---

## Sumário

1. [O que existe no workspace](#1-o-que-existe-no-workspace)
2. [O que foi encontrado nos materiais](#2-o-que-foi-encontrado-nos-materiais)
3. [Como a operação da Érika funciona hoje](#3-como-a-operação-da-érika-funciona-hoje)
4. [Trabalho manual que existe hoje](#4-trabalho-manual-que-existe-hoje)
5. [O que pode ser automatizado](#5-o-que-pode-ser-automatizado)
6. [Separando fato, inferência e desconhecido](#6-separando-fato-inferência-e-desconhecido)
7. [Arquitetura técnica recomendada](#7-arquitetura-técnica-recomendada)
8. [Módulos realmente necessários](#8-módulos-realmente-necessários)
9. [Fluxo completo do sistema](#9-fluxo-completo-do-sistema)
10. [Módulo de ficha técnica e custos](#10-módulo-de-ficha-técnica-e-custos)
11. [Modelo inicial de banco de dados](#11-modelo-inicial-de-banco-de-dados)
12. [Estrutura ADMIN (consultora)](#12-estrutura-admin-consultora)
13. [Estrutura CLIENTE](#13-estrutura-cliente)
14. [Integração futura com o site](#14-integração-futura-com-o-site)
15. [Integração futura com WhatsApp](#15-integração-futura-com-whatsapp)
16. [Fases recomendadas de construção](#16-fases-recomendadas-de-construção)
17. [Pontos que precisam de confirmação](#17-pontos-que-precisam-de-confirmação)

---

## 1. O QUE EXISTE NO WORKSPACE

A pasta `Economia/` contém cinco pastas com funções distintas:

| Pasta | Tamanho | Função | Ação nesta fase |
|---|---|---|---|
| `erika-bruna/` | 1,2 MB | Site/apresentação comercial pronta | Lido como referência. **Não alterado.** |
| `sistema-erika/` | vazio | Projeto novo | Nada criado além deste documento |
| `informaçoes da Erika bruna/` | 22 MB | 76 prints recentes (17/09) | Analisado. **Não alterado.** |
| `Informaçoes do perfil da clienrte/` | 20 MB | 24 prints (16/09) | Analisado. **Não alterado.** |
| `Public/` | 1,3 MB | 4 imagens usadas no site | Analisado. **Não alterado.** |
| `referencia  - Banco--XP--2/` | 2 MB | Projeto de **outro cliente** (landing XP) | Apenas identificado. Não é referência para este projeto. |

### 1.1 O site `erika-bruna/` — estrutura

Projeto estático puro, sem build, sem dependências:

```
erika-bruna/
  index.html          868 linhas  · 20 seções
  assets/estilo.css  2.495 linhas · 25 blocos numerados
  assets/app.js        350 linhas
  assets/*.jpg            11 imagens (logo, retrato, 3 fotos de trabalho, 6 cards de resultado)
  PUBLICAR.md             instruções de publicação
  .git/                   repositório próprio já inicializado
```

O `PUBLICAR.md` já documenta uma decisão correta que vale preservar: o repositório deve ser inicializado **dentro de `erika-bruna/`**, nunca em `Economia/`, porque os materiais internos da cliente (41 MB) e o projeto de outro cliente não devem subir. A mesma regra vale para `sistema-erika/`.

### 1.2 Sistema visual do site (extraído do CSS)

Este é o ativo mais valioso do projeto e deve ser a base do sistema — não um tema genérico.

**Paleta (tokens `:root`)**

| Grupo | Token | Hex | Uso |
|---|---|---|---|
| Verdes | `--v-noite` | `#071e14` | Fundos mais escuros |
| | `--v-profundo` | `#0b2a1c` | Seções escuras, botão primário |
| | `--v-escuro` | `#123a27` | Apoio |
| | `--v-medio` | `#1d5236` | Hover de botões |
| Olivas | `--oliva` | `#6b7a46` | Acento principal, rótulos |
| | `--oliva-claro` | `#9aa36b` | Acento sobre fundo escuro |
| | `--oliva-palha` | `#c3c193` | Acento sobre fundo escuro |
| Neutros quentes | `--creme` | `#e8dfd0` | Texto sobre escuro |
| | `--areia` | `#f2ece2` | Seção alternada |
| | `--off` | `#faf7f1` | Fundo padrão |
| Acento | `--dourado` | `#c9a54e` | Foco, detalhes |
| | `--dourado-claro` | `#e3c67f` | Barras, destaques |
| Tinta | `--tinta` | `#0e1a14` | Texto principal |

**Tipografia**

- Display: **Fraunces** (serifada variável, `opsz 9..144`, `wght 300..900`) — títulos, `font-weight: 500`, `line-height: 0.98`, `letter-spacing: -0.022em`
- Texto: **Instrument Sans** — corpo, `font-weight: 380`
- Assinatura: **Parisienne** (manuscrita) — usada em "Cozinha organizada gera lucro real"

**O que dá o caráter premium — e deve migrar para o sistema:**

1. **Escala tipográfica fluida** via `clamp()`. Títulos vão de `2.1rem` a `4.25rem`; nada tem tamanho fixo.
2. **`line-height: 0.98` nos títulos** — quase colados. É o detalhe que mais afasta o resultado de um SaaS comum.
3. **Rótulos de seção** (`.eb-rotulo`): caixa-alta, `0.6875rem`, `letter-spacing: 0.26em`, com um traço de 34px antes. Este é o componente-assinatura do projeto.
4. **Cantos quase retos**: `--raio: 4px`, botões com `2px`. Nada de cartão arredondado.
5. **Botões** com `padding: 1.05rem 1.9rem`, caixa-alta, `letter-spacing: 0.16em`, `font-size: 0.78rem`, e um preenchimento que sobe de baixo para cima no hover (`scaleY` de `0` a `1`, origem `bottom`).
6. **Marca-texto** (`.eb-marca`): `linear-gradient` cobrindo 42% inferiores da linha — é um eco direto dos posts dela no Instagram. Elemento de identidade, não decoração.
7. **Itálico com `font-variation-settings: "SOFT" 40, "WONK" 1`** — usa os eixos da Fraunces.
8. **Ritmo de seção generoso**: `padding-block: clamp(4.5rem, 9vw, 8.5rem)`.
9. **Container** `1240px` (texto `880px`), respiro lateral `clamp(1.25rem, 5vw, 3rem)`.
10. **Reveals** (`.rv`, `.rv-d1..d5`, `.rv-item`): fade + `translateY(26px)`, 0.9–1.1s, `cubic-bezier(0.22, 0.61, 0.36, 1)`, com cascata de 0.09s por nível.
11. **Easing** `--ease: cubic-bezier(0.22, 0.61, 0.36, 1)` — usado em tudo.
12. **Respeito a `prefers-reduced-motion`** e `:focus-visible` com contorno dourado. Acessibilidade já está feita; o sistema deve manter o mesmo padrão.

**Linguagem e tom** (para os textos do sistema)

Copy direta, técnica, sem hype. Primeira pessoa da consultora. Palavras-âncora que ela já usa: *organização, controle, lucro real, desperdício, padronização, ficha técnica, CMV, precificação, processo, acompanhamento, indicador, plano de ação, gargalo, retrabalho*. Anti-padrões que ela explicitamente evita: servir menos, cortar, estimativa, achismo, improviso, memória de quem está na operação, apagar incêndio.

Um exemplo de rótulo bem calibrado para o sistema, no tom dela: em vez de "Dashboard", usar **"Visão geral da operação"**. Em vez de "CRUD de receitas", **"Fichas técnicas"**. Em vez de "Alertas", **"Pontos de atenção"**.

---

## 2. O QUE FOI ENCONTRADO NOS MATERIAIS

Foram analisados **104 prints**. Eles caem em seis grupos bem distintos.

### Grupo A — As planilhas reais de ficha técnica *(o achado mais importante)*

Print `123618` mostra a planilha **"Ficha Técnica: Carreireito da casa (4 PESSOAS)"**, aberta no Google Sheets, arquivo **"Modelo de Ficha técnica - Consultoria Chef Érika Bruna.xlsx"**.

**Abas existentes** (visíveis na barra inferior): `INSUMOS`, `Lista de pratos`, `MODELO(COPIAR)`, `Cópia de MODELO(COPIAR)`, `Cópia de MODELO(COPIAR) (2)`, `EXEMPLO`, `EXEMPLO1` … `EXEMPLO4`.

**Cabeçalho da ficha:**

```
Custo Total    kg Porção    Custo Porção    UNI porção    Marg. Seg %    TOTAL
R$ 65,61       2,647        R$ 65,61        1             R$ 6,56        R$ 72,1...
```

**Corpo da ficha — colunas:**

```
Ingrediente | Peso Líq | Preço Kg | Correção | Peso Bruto | Custo
CARNE SECA OU CHARQUE | 0,5   | R$ 66,71 | 1,00 | 0,5   | R$ 33,36
PIMENTA DO REINO MOÍDA| 0,002 | R$ 67,00 | 1,00 | 0,002 | R$ 0,13
MILHO VERDE           | 0,01  | R$ 18,00 | 1,50 | 0,015 | R$ 0,27
MANTEIGA CLARIFICADA  | 0,04  | R$ 25,24 | 1,20 | 0,048 | R$ 1,21
CENOURA               | 0,06  | R$  2,99 | 1,50 | 0,09  | R$ 0,27
...
```

Print `123631` mostra **"Ficha Técnica: Mini hambúrguer com batata frita"** com a mesma estrutura.

**As fórmulas foram verificadas aritmeticamente. Estão confirmadas:**

| Relação | Verificação | Status |
|---|---|---|
| Peso Bruto = Peso Líquido × Correção | 0,01 × 1,50 = 0,015 ✓ (milho verde) | **Confirmado** |
| Custo = Peso Bruto × Preço Kg | 0,048 × 25,24 = 1,2115 → R$ 1,21 ✓ (manteiga) | **Confirmado** |
| Custo Total = Σ Custo das linhas | 1,95+2,18+8,40+5,21+3,92+0,46 = 22,12 ≈ R$ 22,11 ✓ (mini hambúrguer) | **Confirmado** |
| kg Porção = Σ Peso Líquido da receita | 0,15+0,145+0,24+0,15+0,08+0,05 = 0,815 ✓ (igual ao exibido) | **Confirmado** |
| Fator de correção varia por ingrediente | 1,00 a 1,60 na mesma ficha | **Confirmado** |

Print `190842` mostra a aba **"Controle geral"**:

```
Markup (CMV 30%)  |  Preço de venda  |  Markup real  |  CMV real
3,50              |  R$ 26,49        |  3,49         |  29%
                  |  R$ 39,00        |  3,25         |  31%
                  |  R$ 15,00        |  3,33         |  30%
                  |  R$ 13,50        |  3,38         |  30%
                  |  R$ 75,90        |  3,30         |  30%
```

Verifiquei: `26,49 ÷ 8,03 = 3,299` e `8,03 ÷ 26,49 = 30,3%`. **O CMV alvo é parâmetro (30%), o preço de venda é editável à mão, e a planilha mostra o markup e o CMV REAIS** — ou seja, ela sugere o preço e depois mede o desvio. Isso é exatamente o "3 – Preço de venda correto" que ela divulga.

Print `190834` mostra a aba **"LISTA DE INSUMOS"**:

```
CÓDIGO | PRODUTOS                      | EMBALAGEM
       |                               | UNID. | F.C. | VALOR
1      | FILE DE PEITO DE FRANGO       | KG    | 1,10 | R$ 18,78
2      | SUCO DE LARANJA PASTEURIZADO  | LT    | 1,00 | R$ 15,00
3      | CREME DE LEITE                | LT    | 1,00 | R$ 17,00
4      | REQUEIJÃO CREMOSO             | KG    | 1,00 | R$ 40,39
7      | FARINHA DE MANDIOCA           | KG    | 1,00 | R$  6,00
9      | ARROZ BRANCO                  | KG    | 1,00 | R$  3,56
       | MANTEIGA CLARIFICADA          | KG    | 1,20 | R$ 25,24
```

⚠️ **Observação técnica:** o `F.C.` aparece **em dois lugares** — na Lista de Insumos e na linha de cada ficha técnica. Isso cria risco de divergência (dois valores de correção para o mesmo ingrediente). **Precisa ser resolvido no sistema: um único lugar de verdade por ingrediente, com possibilidade de sobrescrever apenas no item da ficha, e o sistema deve sinalizar quando os dois divergirem.**

As anotações amarelas na planilha dizem: *"VALORES COM PREÇO… IMPORTANTE SEMPRE… DE ACORDO COM M…"*, *"CÓDIGO – Signific… construir as fichas… importante usar… Você pode criar…"*, *"LISTA DE IN… para comp… É feito…"*. São instruções de uso dela para o cliente.

### Grupo B — "Lista de Pratos por Praça" *(o segundo achado mais importante)*

Prints `122110` e `122151` mostram uma planilha **diferente** — desta vez em Excel/nuvem, com a estrutura:

```
LISTA DE PRATOS POR PRAÇA
Praça:         Finalização
Turno:         Almoço e Jantar
Responsável:   Auxiliar 3

Tipo              | Descrição           | Lista de Finalização
Entradas-15 MIN   | Torresmo crocante   | Torresmo de rolo, mandioca rústica, melado de cana, farofa de limão
Entradas-15 MIN   | Tulipa clínica      | Fritar tulipa de frango, aquecer molho de laranja
...               | ...                 | Cebola de...e crocante, cebolinha e maionese verde (4un)
```

Isto é um artefato **completamente diferente** da ficha técnica. Ele responde a outras perguntas: **quem** faz, **em qual praça**, **em qual turno**, **em quanto tempo** (a faixa "-15 MIN"), e **qual é a sequência de finalização** no momento do serviço.

É evidência de que a Érika não organiza apenas *custo* — ela organiza **produção**. E é, muito provavelmente, o que ela chama de "mapeamento de processos" na comunicação dela.

### Grupo C — O formulário de diagnóstico

Prints `124025`, `124107`–`124144` mostram o **Google Forms completo**, cujo link é `docs.google.com/forms/d/e/1FAIpQLSdmSnNxDE...`, criado na conta Google **lp070087@gmail.com**.

Título: **"Diagnóstico de Lucro e Operação da Cozinha"**
Subtítulo: *"Esse diagnóstico foi criado para identificar onde sua cozinha está perdendo tempo, dinheiro e eficiência. Se hoje você sente desorganização, sobrecarga ou o lucro não aparece como deveria, aqui você começa a entender o porquê."*

**Todas as 33 perguntas, transcritas literalmente:**

| # | Seção | Pergunta | Tipo |
|---|---|---|---|
| 1 | — | E-mail | Texto |
| 2 | — | Qual negócio de alimentação você possui? E qual a data da abertura? | Texto |
| 3 | — | Qual nome fantasia do seu negócio de alimentos? | Texto |
| 4 | — | Qual o tipo de serviço do seu negócio de alimentação? | Buffet / À la carte / Buffet e à la carte / Delivery / Outro |
| 5 | — | Qual a média do faturamento mensal da sua empresa? | Texto |
| 6 | Faturamento x lucro | Hoje você sente que o dinheiro sobra no final do mês? | Sim / Mais ou menos / Não |
| 7 | Estrutura | Sua cozinha foi planejada ou adaptada? | Planejada / Adaptada / Não sei dizer |
| 8 | Estrutura | Você sente que perde tempo na movimentação da cozinha? | Sim, bastante / Às vezes / Não |
| 9 | Estrutura | Se a demanda dobrar amanhã, sua cozinha dá conta? | Sim, bastante / Com dificuldade / Não |
| 10 | Produção | Você usa ficha técnica? | Sim, em todos os pratos / Em alguns / Não uso |
| 11 | Produção | Números de itens do cardápio | Texto |
| 12 | Tempo de produção | Qual etapa da produção mais te faz perder tempo hoje? | Texto |
| 13 | Retrabalho | Você costuma refazer produção por erro ou falta de padrão? | Sim / Às vezes / Não |
| 14 | Precificação | Como você define o preço dos seus produtos? | Baseado no custo / Baseado na concorrência / No "feeling" / Não sei exatamente |
| 15 | — | Já faltou insumo durante o serviço? | Sim, com frequência / Às vezes / Nunca |
| 16 | Controle de estoque | Você tem controle do que entra e sai de estoque? | Sim / Parcial / Não |
| 17 | Perda de insumo | Você percebe perda de alimentos no dia a dia? | *(corte do print)* |
| 18 | Compras | Com que frequência você faz compras de insumos? | Diariamente / 2 a 3 vezes por semana / Sem padrão definido |
| 19 | Equipe | Sua equipe depende de você o tempo todo? | Sim / Parcialmente / Não |
| 20 | Equipe | Turno de trabalho | Somente almoço / Somente jantar / Almoço e jantar / Café, almoço, lanche e jantar / Apenas delivery dia ou noite |
| 21 | Equipe | Número de funcionários? | 1 a 5 / 5 a 10 / Somente eu (dono) e mais 1 pessoa / Apenas eu (dono) / Outro |
| 22 | Clareza de processo | Hoje sua operação segue um padrão ou depende do improviso? | Padrão definido / Um pouco dos dois / Mais improviso |
| 23 | Treinamento da equipe | Sua equipe sabe exatamente como executar cada preparo? | Sim / Mais ou menos / Não |
| 24 | Custos | Você sabe o custo exato dos pratos? | Sim / Mais ou menos / Não |
| 25 | — | Qual é hoje o maior problema da sua cozinha? | Texto |
| 26 | — | Se esse problema fosse resolvido, o que mudaria no seu restaurante? | Texto |
| 27 | — | Sinta-se à vontade para me dizer o que desejar sobre seu estabelecimento, como consultora sou agente de soluções para seu negócio! | Texto |
| 28 | — | You analisar suas respostas e te dar um direcionamento. Me deixa seu WhatsApp pra te enviar o resultado do diagnóstico. | Texto |
| 29 | — | Você pretende melhorar sua operação nos próximos 30 dias? | Sim / Talvez / Não |

**Análise do instrumento:**

O questionário já tem uma **arquitetura de diagnóstico implícita**: agrupa perguntas em blocos que correspondem exatamente aos serviços que ela vende — Estrutura, Produção, Tempo, Retrabalho, Precificação, Estoque, Compras, Equipe, Clareza de processo, Treinamento, Custos.

Isso significa que **o "score" do diagnóstico não precisa ser inventado**: ele pode ser calculado a partir dos próprios blocos que ela já definiu. Proposta de leitura, por bloco:

| Bloco | Perguntas | O que mede |
|---|---|---|
| Lucratividade | 5, 6, 24 | O dinheiro sobra? Sabe o custo? Faturamento |
| Estrutura e capacidade | 7, 8, 9 | Cozinha dá conta do volume |
| Padronização | 10, 13, 22, 23 | Ficha técnica, retrabalho, improviso, treinamento |
| Precificação | 14 | Preço baseado em custo vs. feeling |
| Insumos | 15, 16, 17, 18 | Falta, estoque, perda, compras |
| Equipe | 19, 20, 21 | Dependência do dono, turnos, tamanho |
| Intenção | 29 | Prontidão para comprar |

⚠️ Duas perguntas obrigatórias são problemáticas para conversão e devem ser reconsideradas na versão premium: a pergunta 27 (obrigatória, mas é um convite aberto) e a 5 (faturamento mensal como resposta de texto livre — deveria ser faixa de valores).

### Grupo D — Os materiais de comunicação (não são sistema)

Prints do Instagram: carrosséis ("6 SINAIS DE QUE SUA COZINHA PRECISA DE UMA CONSULTORIA", "5 VERDADES QUE A FICHA TÉCNICA TE DÁ"), o catálogo do WhatsApp Business, post "Você me contratou e agora sabe: Custo, Preço de venda, Lucro do seu cardápio".

**O que aproveitar:** o layout dos carrosséis é a linguagem visual dela — verde escuro, caixa alta, ícones circulares creme, marca-texto oliva. É a mesma base do site. **O sistema deve parecer uma continuação disso**, não um produto separado.

### Grupo E — O catálogo de serviços dela

Do catálogo do WhatsApp Business, os produtos/serviços hoje cadastrados:

- Personal chef a partir de 2 pessoas *(valores a consultar)*
- Atendimento presencial e on-line
- Finger food *(consulte valores)*
- Serviço de Buffet para todos os tipos de eventos
- Buffet · Alimentos personalizados · Serviços de catering
- "Geramos uma Economia de 5.500 por semana para um cliente" *(bloco com valor R$ 0,00 — evidentemente usado como vitrine, não como produto)*

Do site institucional: **Ficha Técnica CMV — R$ 147** (planilha, entrega imediata, via WhatsApp/Instagram).

De um post: **"Ficha Técnica Lucrativa com Controle de CMV" — R$ 97** (com selo de desconto de 39%).

⚠️ **Inconsistência real encontrada:** o **mesmo produto digital aparece a R$ 147 (site) e a R$ 97 (post de Instagram)**. Precisa ser reconciliado antes de qualquer cobrança dentro do sistema.

### Grupo F — Resultados reais dela *(números verificados nos prints)*

| Caso | Antes | Depois | Resultado |
|---|---|---|---|
| Café profissional (196 refeições/semana) | R$ 4.448,57/semana | R$ 3.073,35/semana | Redução de **R$ 1.375,22/semana** |
| Cardápio | R$ 40.545,47 (custo no período) | R$ 38.187,78 | Economia de **R$ 2.357,69 (5,8%)** |
| Café da base | Leite 11 L/dia · Manteiga 3 potes/dia | Leite 7 L/dia · Manteiga ≈350 g/dia | Custo mantido, entrega melhorada |
| Buffet **(caso negativo)** | Buffet vendido a **R$ 90,00/kg** | Custo de produção **R$ 84,37/kg** | **Prejuízo** — o prato custava 94% do preço |

O último caso é o mais revelador do valor do sistema: **é um caso em que a ausência de ficha técnica produziu prejuízo direto**. `84,37 ÷ 90,00 = 93,7%` de CMV. Este é o argumento de venda mais forte que ela tem — e o sistema deveria ser capaz de **detectar isso automaticamente**.

### Grupo G — O perfil profissional dela

Do print `124527` e do site: formada em Gastronomia desde 2019 (tecnóloga); 3 anos gerenciando buffet de festas; chef profissional em diversos eventos; 5 anos como chef de cozinha no litoral de Santa Catarina; chef executiva por um período, com consultoria para implantação de 2 restaurantes; hoje consultora. **Atendimento on-line em todo o país, presencial em Santa Catarina** (base em Bombinhas).

Serviços que ela descreve: *"Cardápio mediterrâneo com influências mato-grossense seguindo a identidade criada por mim. Foi feito ficha técnica de todos os pratos, mapeamento de processos, treinamento da equipe, assessoria de compras e montagem da cozinha."*

Ou seja: **assessoria de compras e montagem de cozinha também são serviços prestados.** Isso é importante para a arquitetura — o escopo de uma consultoria é variável.

---

## 3. COMO A OPERAÇÃO DA ÉRIKA FUNCIONA HOJE

Reconstruído a partir das evidências. Onde há inferência, está marcado.

### 3.1 O ciclo comercial

```
1. Atração      → Instagram + site + catálogo do WhatsApp Business
2. Filtro       → "Diagnóstico de Lucro e Operação da Cozinha" (Google Forms)
3. Triagem      → Ela lê as respostas e devolve um direcionamento no WhatsApp
4. Conversão    → Consultoria on-line, presencial, ou venda da planilha Ficha Técnica CMV
5. Execução     → Diagnóstico presencial/on-line → plano de ação → ficha técnica → processos → treinamento
6. Acompanhamento → Indicadores, visitas, ajustes
```

O próprio site lista as cinco etapas do método dela: **Diagnóstico → Plano de ação → Implantação → Treinamento → Acompanhamento.**

### 3.2 O ciclo de trabalho técnico — o mais importante

```
Cliente informa os insumos e preços
    ↓
Ela monta a aba INSUMOS (código, produto, unidade, F.C., valor)
    ↓
Ela abre MODELO(COPIAR) e faz "Cópia de MODELO(COPIAR)"  ← um arquivo de ficha por prato
    ↓
Preenche ingrediente por ingrediente:
    Peso Líquido · Preço/Kg · Fator de Correção
    ↓
Peso Bruto e Custo se calculam (fórmulas já verificadas)
    ↓
Custo Total da receita
    ↓
Define o nº de porções, vê Custo por Porção
    ↓
Aba "Controle geral": vê preço sugerido para CMV 30%,
    edita o preço à mão, e confere Markup real e CMV real
    ↓
Se houver mais de um prato: repete tudo isso N vezes
    ↓
Monta a "Lista de Pratos por Praça": praça, turno, responsável,
    tempo de execução, sequência de finalização
    ↓
Entrega ao cliente + treina a equipe
```

### 3.3 Onde está o custo real do trabalho dela

O gargalo não é o cálculo — as fórmulas já estão prontas na planilha. **O gargalo é a entrada e a manutenção dos dados:**

1. **Digitação repetida de preço por kg.** Cada ficha pede o preço de cada ingrediente. Se o cliente tem 60 pratos × 12 ingredientes, são ~720 digitações.
2. **Replicação de planilha em vez de reaproveitamento.** `MODELO(COPIAR)`, `Cópia de MODELO(COPIAR)`, `Cópia de MODELO(COPIAR) (2)`, `EXEMPLO1..4` — ela duplica abas porque não existe um cadastro central. Duplicar aba duplica as fórmulas e os erros.
3. **Atualização de preço é manual e não propaga.** Quando o preço do frango muda, ela precisa abrir ficha por ficha.
4. **Resultados de erro aparecem na tela do cliente.** Os prints mostram `#DIV/0!` em várias células de "Preço de venda", "Markup real" e "CMV real". Isso é um vazamento de qualidade visível.
5. **Não existe histórico.** Um snapshot do custo de quatro semanas atrás não existe em lugar nenhum — e é exatamente isso que produz o número "R$ 5.500 em 4 semanas".
6. **A ponte entre custo e produção é manual.** A ficha técnica diz *quanto custa*; a Lista por Praça diz *quem faz e como finaliza*. Elas não conversam.
7. **O diagnóstico chega como resposta de formulário.** Ela lê e interpreta manualmente; não há triagem, priorização ou comparação entre leads.

---

## 4. TRABALHO MANUAL QUE EXISTE HOJE

| # | Tarefa manual | Frequência estimada | Evidência |
|---|---|---|---|
| 1 | Montar/atualizar a Lista de Insumos por cliente | Por cliente | Aba `INSUMOS` |
| 2 | Duplicar a aba-modelo para cada prato novo | Por prato | `MODELO(COPIAR)` + 3 cópias |
| 3 | Digitar preço/kg de cada ingrediente em cada ficha | Por prato | Corpo da ficha |
| 4 | Definir/ajustar o fator de correção | Por ingrediente | Coluna `Correção` |
| 5 | Conferir o preço sugerido x markup real x CMV real | Por prato | Aba "Controle geral" |
| 6 | Repassar os preços atualizados para todas as fichas | Mensal (preços de insumo oscilam) | Anotação *"Atualização simples dos custos dos insumos"* |
| 7 | Montar a Lista de Pratos por Praça (turno, responsável, tempo, finalização) | Por cardápio | Prints `122110`, `122151` |
| 8 | Ler e interpretar cada resposta do Google Forms | Por lead | Prints do Forms |
| 9 | Copiar/colar a lista de insumos para o cliente comprar | Por consultoria | Serviço "assessoria de compras" |
| 10 | Calcular a economia antes/depois | Por acompanhamento | Casos 1 e 2 do site |
| 11 | Redigir o material de entrega ao cliente | Por consultoria | Entrega de ficha técnica |
| 12 | Divulgar resultados nas redes | Contínuo | Posts com números |

---

## 5. O QUE PODE SER AUTOMATIZADO

### 5.1 Automação segura — cálculo determinístico

Nada aqui é opinião: são as fórmulas que ela já usa, verificadas nos prints.

| Cálculo | Fórmula | Ganho |
|---|---|---|
| Peso bruto | `pesoLiquido × fatorCorrecao` | Elimina digitação |
| Custo do ingrediente | `pesoBruto × precoPorKg` | Elimina digitação |
| Custo total da receita | `Σ custoDosIngredientes` | Elimina erro de soma |
| Peso da preparação | `Σ pesoLiquido` | Elimina erro |
| Custo por porção | `custoTotal ÷ nºPorções` | Elimina digitação |
| Preço sugerido | `custoPorção ÷ cmvAlvo` | Elimina digitação |
| CMV real | `custoPorção ÷ preçoPraticado` | Elimina digitação |
| Markup real | `preçoPraticado ÷ custoPorção` | Elimina digitação |
| Peso por unidade de compra | `precoEmbalagem ÷ conteúdoEmbalagem` | Elimina digitação |
| Custo de sub-preparação | custo da base ÷ rendimento, consumido na ficha pai | Recurso inexistente hoje |
| Propagação de preço | mudou o preço do ingrediente → todas as fichas atualizam | **O maior ganho do projeto** |

### 5.2 Automação segura — fluxo e organização

- **Cadastro único de ingrediente** reutilizável entre fichas e entre clientes (biblioteca da consultora).
- **Duplicar ficha** em um clique, com os ingredientes já preenchidos.
- **Autocomplete de ingrediente** com o último preço conhecido para aquele cliente.
- **Ranking automático de pratos** por CMV, do pior para o melhor — a tela que revela o "prejuízo do buffet" antes que ele aconteça.
- **Alerta de ponto de atenção**: CMV acima do alvo, ingrediente sem preço há mais de X dias, ficha com peso bruto zero, preço de venda abaixo do custo.
- **Fim dos `#DIV/0!`**: o sistema exibe estado vazio explícito, nunca erro de fórmula.
- **Cardápio como agrupador**: montar o cardápio escolhendo fichas já existentes.
- **Lista de compras** gerada a partir do cardápio × volume previsto.
- **Snapshot de custo datado** — o que permite calcular "R$ 5.500 em 4 semanas" automaticamente, em vez de reconstruir à mão.
- **Diagnóstico com triagem**: score por bloco, ordenação automática de leads por oportunidade.
- **Impressão/PDF da ficha** no padrão da marca, sem captura de tela.

### 5.3 O que NÃO deve ser automatizado

O pedido é explícito e está correto: o sistema **não substitui o julgamento da consultora**. Portanto ficam **fora** do escopo de automação:

- Definir o fator de correção. O sistema pode **sugerir** um valor padrão por categoria, mas o número é decisão técnica dela.
- Definir o CMV alvo. É parâmetro do cliente, informado por ela.
- Aprovar um preço de venda. O sistema sugere, ela decide.
- Diagnosticar a operação. O sistema agrupa e pontua; a leitura é dela.
- Elaborar o plano de ação e o conteúdo do treinamento.
- Concluir "esse prato deve sair do cardápio".

A regra de arquitetura que decorre disso: **todo campo calculado é somente-leitura, todo campo de decisão é editável, e o sistema sempre mostra o valor sugerido ao lado do valor praticado** — nunca substitui um pelo outro silenciosamente.

---

## 6. SEPARANDO FATO, INFERÊNCIA E DESCONHECIDO

### 6.1 Sabemos (evidência direta nos materiais)

- As fórmulas e a estrutura da ficha técnica, com verificação aritmética.
- Os campos da Lista de Insumos e o conceito de F.C. e código.
- A existência da aba "Controle geral" com CMV alvo de 30% e markup real.
- A estrutura de "Lista de Pratos por Praça" com praça, turno, responsável, tipo, tempo e finalização.
- As 33 perguntas do diagnóstico e seus blocos temáticos.
- O método de 5 etapas: diagnóstico, plano de ação, implantação, treinamento, acompanhamento.
- Os serviços prestados: consultoria on-line e presencial, ficha técnica, CMV, precificação, controle de desperdício, padronização, treinamento, mapeamento de processos, assessoria de compras, montagem de cozinha, personal chef, finger food, buffet.
- Os resultados reais publicados, incluindo o caso negativo do buffet.
- O produto digital e seus dois preços divergentes (R$ 147 e R$ 97).
- A identidade visual completa, com tokens, tipografia e comportamentos.
- Atendimento on-line em todo o país, presencial em Santa Catarina.
- O WhatsApp é o canal principal de conversão.

### 6.2 Inferimos com segurança (decorre logicamente da evidência)

- O CMV alvo de 30% é **configurável** — o cabeçalho diz "Markup (CMV 30%)", o que indica que 30 é um parâmetro, não uma constante.
- A planilha é entregue ao cliente para uso próprio — o site vende "acesso imediato" e a aba se chama `MODELO(COPIAR)`, o que sugere que ela copia o modelo por cliente.
- O gargalo principal é entrada e manutenção de dados, não cálculo.
- Ela presta serviços de escopo variável (de uma planilha avulsa até implantação completa de restaurante com obra).
- A mesma base de ingredientes se repete entre clientes do mesmo segmento.
- O fator de correção é o veículo pelo qual ela trata desperdício — o site diz que "o cálculo com fator de correção mostra as perdas no preparo".
- Um acompanhamento dura semanas (o caso publicado fala em 4 semanas), e portanto precisa de registro de indicadores ao longo do tempo.

### 6.3 Não sabemos (precisa ser perguntado)

Estão consolidados na [seção 17](#17-pontos-que-precisam-de-confirmação). Os mais críticos:

- Quantos clientes ativos ela tem hoje, e quantos pratos por cliente em média.
- Se ela mantém estoque real ou apenas lista de preços.
- Se ela registra compras ou só atualiza o preço do insumo.
- Se existe índice de cocção (IC) sendo usado, além do fator de correção (FC).
- Se um mesmo ingrediente pode ter fatores de correção diferentes em fichas diferentes (ex.: cenoura em salada vs. em sopa).
- Com que frequência ela entrega ao cliente e em qual formato (PDF, planilha, impresso).
- Se o cliente recebe a planilha editável ou só o resultado.
- Se ela quer que o cliente acesse o sistema (e o que ele veria).
- Como ela precifica a consultoria: por projeto, por hora, por mês.
- Se os preços de insumo vêm do cliente ou de pesquisa própria.

---

## 7. ARQUITETURA TÉCNICA RECOMENDADA

### 7.1 Stack

| Camada | Escolha | Justificativa |
|---|---|---|
| Framework | **Next.js 15 (App Router)** + **TypeScript** | Server Components reduzem JS no cliente — importante para usar em celular dentro de uma cozinha |
| Estilo | **Tailwind CSS** | Os tokens do site (`estilo.css`) migram direto para `@theme` |
| Banco | **PostgreSQL** (Neon) | Relacional é obrigatório: ficha técnica é intrinsecamente relacional |
| ORM | **Prisma** | Tipagem forte e migrations versionadas |
| Deploy | **Vercel** | Mesma conta do site, projeto separado |
| Repositório | **GitHub** — repositório próprio | Nunca no mesmo repo do site |
| Auth | **Auth.js (NextAuth)** com credenciais | Fase 4 |
| Gráficos | SVG artesanal | O site já usa SVG puro; mantém a identidade e o peso baixo |
| PDF | Geração no servidor | Ficha técnica e relatórios |

Sem Supabase, sem Lovable, sem serviço de terceiro desnecessário.

### 7.2 Decisões de arquitetura

**a) Multi-tenant desde o primeiro dia, com uma biblioteca compartilhada.**
Cada empresa-cliente é um tenant. Mas os ingredientes têm dois níveis: uma **biblioteca da consultora** (global, com nome canônico, categoria, unidade e FC sugerido) e uma **instância por cliente** (com preço, fornecedor e FC efetivo). Isso ataca diretamente o gargalo nº 1: o ingrediente é digitado uma vez, não uma vez por cliente.

**b) Cálculo sempre no servidor, sempre determinístico, sempre em `Decimal`.**
Nunca em `float`. Nunca no cliente. Uma única função de domínio calcula a ficha, e a interface só a exibe. Isso garante que ficha na tela, ficha impressa e relatório mostrem o mesmo número.

**c) Todo valor calculado é derivado, mas os snapshots são persistidos.**
O custo atual de uma ficha é sempre calculado ao vivo. Porém, ao fechar um acompanhamento, grava-se um registro datado do custo. É esse histórico que permite provar a economia — e é o que hoje não existe.

**d) O sistema funciona bem em celular, mas é desenhado primeiro para desktop.**
A produção do trabalho dela é em notebook. O celular serve para consultar durante uma visita presencial. Portanto: telas de cadastro ricas no desktop, fichas e indicadores legíveis no celular.

**e) Toda ação sobre ficha é uma etapa curta.**
O pedido é explícito: evitar telas com dezenas de campos. A ficha se monta em: (1) identificar prato → (2) adicionar ingredientes em linhas rápidas (só quantidade; o resto vem do cadastro) → (3) resultado aparece ao vivo. Preço, FC e unidade são "avançado", revelados sob demanda.

### 7.3 Estrutura de pastas proposta

```
sistema-erika/
  docs/
  prisma/
    schema.prisma
    seed.ts
  src/
    app/
      (auth)/
      (admin)/
        page.tsx                    Visão geral da operação
        leads/
        diagnosticos/
        clientes/
        consultorias/
        ingredientes/
        fichas/
        cardapios/
        processos/
        tarefas/
        acompanhamentos/
        relatorios/
        configuracoes/
      (cliente)/                    Portal do cliente — fase futura
      diagnostico/                  Formulário público — fase futura
    lib/
      domain/
        ficha/
          calcular.ts               Motor de cálculo — o coração do sistema
          unidades.ts               Conversão de medidas
          validar.ts
          ciclo.ts                  Detecção de ciclo em sub-fichas
        diagnostico/
          pontuar.ts                Score por bloco
        alertas/
          pontosDeAtencao.ts
      db.ts
      auth.ts
    components/
      ui/                           Design system da marca
        rotulo.tsx                  O rótulo de seção assinatura
        botao.tsx
        campo.tsx
        cartao.tsx
        tabela.tsx
        indicador.tsx
        estado-vazio.tsx
      ficha/
      layout/
    styles/
      tokens.css                    Extraído de erika-bruna/assets/estilo.css
```

---

## 8. MÓDULOS REALMENTE NECESSÁRIOS

A lista do briefing tinha 23 itens. Depois de cruzar com a evidência, ficam **13 módulos na versão 1**, 5 adiados e 5 descartados. Cada decisão está ancorada em evidência.

### 8.1 Construir na versão 1

| # | Módulo | Por que existe (evidência) |
|---|---|---|
| 1 | **Visão geral da operação** | Ela precisa de uma leitura de conjunto do próprio negócio |
| 2 | **Diagnósticos e Leads** *(módulo único)* | O Google Forms existe e é a porta de entrada. Lead e Diagnóstico são a mesma coisa vista de dois ângulos |
| 3 | **Clientes** | Há clientes com histórico e múltiplos acompanhamentos |
| 4 | **Consultorias (projetos)** | Escopo variável, com começo e fim — evidência: "Pré-Temporada 2026", "implantação de 2 restaurantes" |
| 5 | **Ingredientes** | Aba `INSUMOS` com código, unidade, F.C. e valor |
| 6 | **Fichas técnicas** | **O núcleo do sistema.** Fórmulas verificadas |
| 7 | **Sub-preparações** | Evidência: "Lista de Finalização" descreve preparos compostos consumidos por pratos |
| 8 | **Precificação e CMV** | Aba "Controle geral": CMV alvo, preço sugerido, markup real, CMV real |
| 9 | **Cardápios** | Evidência: "Cardápio Mediterrâneo", "análise estratégica de cardápio", "teste de cardápio" |
| 10 | **Processos e praças** | Evidência direta: "Lista de Pratos por Praça" com turno, responsável e tempo |
| 11 | **Tarefas e plano de ação** | Evidência: etapa 02 do método dela é "Plano de ação" |
| 12 | **Acompanhamentos e indicadores** | Evidência: etapa 05 é "Acompanhamento" com "indicadores e ajustes contínuos" |
| 13 | **Relatórios e configurações** | Impressão de ficha, comparação antes/depois, parâmetros (CMV alvo, unidades) |

### 8.2 Adiar (existe sinal, mas não há evidência de uso hoje)

| Módulo | Situação |
|---|---|
| **Lista de compras** | Precisa das fichas prontas primeiro. Fase 5 |
| **Equipe** | O diagnóstico pergunta sobre a equipe **do cliente**, não é ferramenta dela. Na v1 o "responsável" é um campo de texto no processo. Só vira módulo se ela quiser gerir pessoas |
| **Biblioteca de conhecimento** | Ela publica "lista de produtos de limpeza" e guias. Ótimo conteúdo, mas não é sistema. Pode virar uma seção simples depois |
| **Portal do cliente** | Depende de validar o núcleo antes |
| **Contratos e financeiro** | Ela vende por WhatsApp. Não há evidência de contrato formal no material analisado |

### 8.3 Descartar da v1

| Módulo | Motivo |
|---|---|
| **Estoque** | As perguntas sobre estoque estão no **formulário de diagnóstico do lead**, não descrevem a ferramenta dela. Ela não mantém inventário de cliente |
| **Compras como pedido** | Ela faz "assessoria de compras" = monta a lista. Não processa pedido |
| **Perdas e desperdícios** | O desperdício é **medido pelo fator de correção**, dentro da ficha. Um módulo separado duplicaria o conceito |
| **Produção (ordem de produção)** | Não há evidência de apontamento diário |
| **Financeiro / DRE** | O sistema calcula custo de prato, não o resultado contábil do restaurante |

**Resumo da decisão:** de 23 módulos cogitados, **13 na v1**. O sistema é essencialmente um **motor de ficha técnica com um CRM de lead leve em volta** — não um ERP.

---

## 9. FLUXO COMPLETO DO SISTEMA

```
┌──────────────────────────────────────────────────────────────────┐
│  1. ENTRADA                                                      │
│  Instagram · Site · WhatsApp · Catálogo                          │
│                          ↓                                       │
│  Cliente preenche o Diagnóstico de Lucro e Operação da Cozinha   │
│  (experiência premium dentro da marca, não Google Forms)         │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  2. LEAD                                                         │
│  Aparece automaticamente na fila, com:                           │
│   · score por bloco (lucratividade, estrutura, padronização,     │
│     precificação, insumos, equipe)                               │
│   · pontos de atenção destacados                                 │
│   · sinalizações: usa ficha técnica? sabe o custo? sobra dinheiro?│
│   · intenção declarada (pergunta 29)                             │
│  Ela filtra, prioriza e decide com quem falar primeiro.          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  3. ANÁLISE — a decisão é dela                                   │
│  Ela lê as respostas, escreve o direcionamento, marca o status:  │
│  quente · morno · frio · convertido · arquivado                  │
│  Registra a conversa e o próximo passo.                          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  4. CLIENTE                                                      │
│  Lead convertido vira Cliente, herdando o diagnóstico:           │
│   · tipo de serviço, turnos, nº de funcionários, porte           │
│   · gargalos declarados  → viram pontos de partida do trabalho   │
│   · parâmetros: CMV alvo, margem desejada                        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  5. CONSULTORIA (projeto)                                        │
│  Escopo escolhido: diagnóstico · ficha técnica · precificação ·  │
│  processos · treinamento · assessoria de compras · montagem ·    │
│  acompanhamento. Com prazo, responsáveis e status.               │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  6. EXECUÇÃO                                                     │
│                                                                  │
│  Ingredientes ──→ Fichas técnicas ──→ Cardápio                   │
│       ↑                  ↓                  ↓                    │
│  biblioteca         sub-preparações    Processos por praça       │
│  + preços                ↓                  ↓                    │
│                    Precificação/CMV    Tarefas do plano de ação  │
│                          ↓                                       │
│                   Pontos de atenção (pratos com CMV alto,        │
│                   preço abaixo do custo, preço desatualizado)   │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  7. ACOMPANHAMENTO                                               │
│  Registro datado de indicadores: custo total do cardápio,        │
│  CMV médio, nº de pratos com CMV acima do alvo, tickets abertos  │
│  Visitas: on-line · presencial · obra · vistoria                 │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  8. RESULTADO                                                    │
│  Comparação antes × depois, gerada pelo sistema:                 │
│   · variação de custo no período                                 │
│   · variação de CMV por prato e do cardápio                      │
│   · pratos corrigidos, pontos resolvidos                         │
│   · material pronto no padrão da marca para entregar ao cliente  │
│     e para publicar nas redes (é assim que ela vende hoje)       │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. MÓDULO DE FICHA TÉCNICA E CUSTOS

Esta é a peça central. Está descrita em detalhe porque é onde o sistema ganha ou perde.

### 10.1 Princípio

A ficha técnica tem **três camadas** que hoje estão misturadas numa planilha só:

| Camada | O que é | Onde vive no sistema |
|---|---|---|
| **Cadastro** | O ingrediente e seu preço | Módulo Ingredientes |
| **Receita** | O que compõe o prato e em que quantidade | Módulo Fichas técnicas |
| **Decisão** | Quanto vender, com qual margem | Módulo Precificação (aba "Controle geral") |

Separar essas camadas é o que resolve o gargalo. Mudar o preço do frango é uma edição em **um lugar**, e propaga para todas as fichas.

### 10.2 Cadastro de ingrediente

**Passo 1 — identificar o produto.** Nome, categoria, código (opcional; ela usa códigos numéricos na planilha).

**Passo 2 — como ele é comprado.** Unidade de compra (kg, L, unidade, pacote, caixa, dúzia), conteúdo da embalagem, preço pago.

**Passo 3 — o sistema calcula o preço por unidade canônica.**

```
precoPorUnidade = precoDaEmbalagem ÷ conteudoDaEmbalagem
```

Exemplo: peito de frango, embalagem de 5 kg, R$ 94,00 → `R$ 18,80/kg`. Esse valor é o que a ficha consome.

**Passo 4 — fator de correção (F.C.).** Informado pela consultora, com um valor padrão por categoria apenas como sugestão.

**Passo 5 — histórico de preço.** Toda alteração de preço vira um registro datado. Isso dá duas coisas de graça: a ficha sempre usa o preço vigente, e o sistema sabe *quando* um custo subiu.

### 10.3 O motor de cálculo

Fórmulas conforme a [seção 2, Grupo A](#grupo-a--as-planilhas-reais-de-ficha-técnica-o-achado-mais-importante) — todas verificadas aritmeticamente nos prints.

```
ENTRADAS POR INGREDIENTE NA FICHA
  quantidadeLiquida          ex.: 0,5 kg de carne seca
  unidadeLiquida             ex.: kg
  fatorCorrecao              ex.: 1,00 (herdado do cadastro)
  precoPorUnidadeCanonica    ex.: R$ 66,71/kg  (vindo do cadastro)

DERIVADOS
  pesoBruto        = quantidadeLiquida × fatorCorrecao
  custoDoItem      = pesoBruto × precoPorUnidadeCanonica

POR RECEITA
  custoTotal       = Σ custoDoItem           (todas as linhas)
  pesoTotal        = Σ quantidadeLiquida     (é o "kg Porção" da planilha)
  pesoBrutoTotal   = Σ pesoBruto
  custoPorPorcao   = custoTotal ÷ rendimentoPorcoes

FATOR DE CORREÇÃO REALIZADO  (o indicador de desperdício)
  fatorCorrecaoAplicado = pesoBrutoTotal ÷ pesoTotal
  perdaPercentual       = (1 − pesoTotal ÷ pesoBrutoTotal) × 100

PRECIFICAÇÃO
  precoSugerido    = custoPorPorcao ÷ cmvAlvoPct
  cmvReal          = custoPorPorcao ÷ precoPraticado
  markupReal       = precoPraticado ÷ custoPorPorcao
  margemRealPct    = (precoPraticado − custoPorPorcao) ÷ precoPraticado
  lucroPorPorcao   = precoPraticado − custoPorPorcao
  lucroTotal       = lucroPorPorcao × rendimentoPorcoes
```

**Verificação de sanidade com o caso do buffet publicado:**
custo/kg = R$ 84,37 · preço/kg = R$ 90,00 → `cmvReal = 93,7%`. O sistema dispararia um ponto de atenção crítico: *"CMV de 93,7% — o prato está praticamente no custo. Margem de R$ 5,63/kg."* É exatamente o alerta que ela precisava ter tido.

### 10.4 Regra de arredondamento e precisão

Cálculo em `Decimal` com precisão alta, arredondamento para 2 casas **apenas na exibição**. Nunca acumular arredondamento linha a linha — o Σ é calculado sobre valores completos, senão o total não fecha (é a origem do `22,11` vs. `22,12` que aparece nas planilhas dela).

### 10.5 Tratamento do F.C. duplicado ⚠️

O problema identificado na [seção 2](#grupo-a--as-planilhas-reais-de-ficha-técnica-o-achado-mais-importante) precisa de uma regra explícita:

- O F.C. vive **no ingrediente** (um valor por cliente).
- Na linha da ficha, o campo mostra o valor herdado e permite sobrescrever.
- Se sobrescrito, o sistema marca visualmente a linha e explica: *"usando F.C. 1,50 nesta ficha, diferente do padrão do ingrediente (1,20)"*.
- Um relatório de divergências permite revisar todos os casos.
- **Decisão a confirmar com ela** (item 17): se sobrescrever deve ser permitido sempre, ou só quando ela autorizar.

### 10.6 Sub-preparações

Um molho, uma farofa ou um mirepoix é preparado uma vez e consumido em vários pratos. O sistema trata isso como uma ficha que pode ser ingrediente de outra.

```
Custo do molho  = R$ 12,00
Rende            = 500 g (ou 10 porções)
Custo por grama  = R$ 0,024

Prato usa 40 g do molho → custo R$ 0,96
```

Com **detecção de ciclo** (uma ficha não pode, direta ou indiretamente, conter a si mesma) e propagação de custo em cascata.

O "Lista de Finalização" dos prints (`Torresmo de rolo, mandioca rústica, melado de cana, farofa de limão`) é a evidência de que ela pensa assim.

### 10.7 Como o custo do cardápio é calculado

O número que ela publica ("cardápio de R$ 40.545,47") não vem de uma ficha isolada. Vem de:

```
custoDoCardapio = Σ (custoPorPorcao × volumeVendidoNoPeriodo)
```

Isso exige um **volume** por prato no período. Duas formas de obter:

1. **Volume informado** — ela digita a quantidade produzida/vendida no acompanhamento.
2. **Volume estimado** — rateio do total de refeições pelo mix do cardápio.

**A forma 1 é a correta e a única que não inventa dado.** A forma 2 só deve existir se ela confirmar que usa esse critério. Este é um ponto de confirmação (item 17.9).

### 10.8 Experiência de uso da ficha

O pedido é claro: nada de telas com dezenas de campos. Proposta em três movimentos:

**1. Cabeçalho** — nome do prato, categoria, praça, turno, rendimento (em porções e em peso), tempo de execução. Nada mais.

**2. Ingredientes, linha a linha.** O usuário digita apenas a quantidade. O ingrediente vem por autocomplete, com o último preço já preenchido. Cada linha nova mostra o custo na hora. O total se move ao vivo. "Avançado" (unidade, F.C., preço pontual) fica atrás de um clique.

Ações rápidas em cada linha: duplicar, transformar em sub-preparação, marcar como opcional.

**3. Resultado.** Um painel lateral fixo com custo total, peso, custo por porção, preço sugerido, e um indicador de CMV que fica verde, âmbar ou vermelho conforme o alvo. O preço praticado aparece ao lado do sugerido — sempre os dois, nunca substituídos um pelo outro.

**Recursos de rapidez:** duplicar ficha, importar ingredientes de outra ficha, criar ingrediente sem sair da tela, colar uma lista de ingredientes de uma vez.

### 10.9 Impressão

A ficha precisa sair impressa para a cozinha. Ela deve conter: identificação, ingredientes com peso líquido e peso bruto (não o preço — a cozinha não precisa, e o preço não deve circular), modo de preparo, rendimento, porcionamento, e a assinatura visual da marca.

Versão **para a consultora e para o cliente** com os valores; versão **para a cozinha** só com as quantidades. Essa distinção é uma sugestão — deve ser validada com ela.

---

## 11. MODELO INICIAL DE BANCO DE DADOS

> Proposta. **Nenhuma migration criada.** Apenas desenho.

### 11.1 Convenções

Todos os modelos têm `id` (cuid), `createdAt`, `updatedAt`. Valores monetários em `Decimal(12,4)` — precisão interna alta, arredondamento só na exibição. Quantidades em `Decimal(12,4)`. Percentuais em `Decimal(5,2)`. Toda entidade de cliente é escopada por `clientId` para garantir isolamento entre tenants.

### 11.2 Entidades de acesso e contexto

```
User
  id, nome, email(único), senhaHash, papel(UserRole), ativo
  papel: ADMIN | CONSULTORA | CLIENTE | EQUIPE_CLIENTE

ClientSetting
  clientId, cmvAlvoPct, margemAlvoPct, markupAlvo,
  moeda, unidadesPreferidas[]

AuditLog
  userId, entidade, entidadeId, acao, valorAntes(Json), valorDepois(Json), em
```

### 11.3 Entrada: lead e diagnóstico

```
Lead
  id, nomeContato, email, whatsapp, origem, status(LeadStatus),
  clientId? (preenchido quando converte), consultoriaId?
  status: NOVO | EM_ANALISE | CONTATADO | QUENTE | MORNO | FRIO
        | CONVERTIDO | ARQUIVADO
  observacoes, proximoPasso, responsavelId, em

Diagnostic
  id, leadId(único)
  -- identificação
  negocioAlimentacao, dataAbertura, nomeFantasia,
  tipoServico(TipoServico), faturamentoMedioFaixa,
  -- lucratividade
  dinheiroSobraNoFimDoMes, sabeCustoExatoDosPratos,
  -- estrutura
  cozinhaPlanejadaOuAdaptada, perdeTempoNaMovimentacao, cozinhaAguentaVolumeDobrado,
  -- produção
  usaFichaTecnica, quantidadeItensCardapio, etapaQueMaisPerdeTempo,
  refazProducaoPorErro,
  -- precificação
  comoDefinePreco,
  -- insumos
  faltouInsumoDuranteServico, controleDeEstoque, percebePerdaDeAlimento,
  frequenciaDeCompras,
  -- equipe
  equipeDependeDoDono, turnosTrabalho[], numeroFuncionarios,
  -- processo
  operacaoSeguePadraoOuImproviso, equipeSabeExecutarCadaPreparo,
  -- aberto
  maiorProblemaCozinha, oQueMudariaSeResolvido,
  observacoesLivres, whatsappParaRetorno,
  pretendeMelhorarEm30Dias,
  -- derivados
  scoreTotalSmallint, scoreLucratividade, scoreEstrutura,
  scorePadronizacao, scorePrecificacao, scoreInsumos, scoreEquipe,
  respondidoEm

  14 enums espelhando as opções exatas do formulário atual,
  para que nenhuma resposta se perca na migração do Google Forms.
```

**Sobre o score:** calculado a partir dos blocos que ela mesma já definiu no formulário. Cada resposta recebe um peso por gravidade operacional, e o sistema apresenta o resultado como leitura, nunca como veredito — com o texto dela, e com os pontos de atenção escritos em linguagem de operação, não de nota. O peso de cada resposta é decisão dela e precisa ser validado (item 17.11).

### 11.4 Núcleo: clientes, projetos, equipe

```
Client
  id, nomeFantasia, razaoSocial, cnpj?, segmento, porte, cidade, uf,
  tipoServico, dataAbertura, faturamentoMedioFaixa, turnos[], numeroFuncionarios,
  contatoNome, contatoEmail, contatoWhatsapp,
  status: PROSPECT | ATIVO | PAUSADO | ENCERRADO
  origemLeadId?, diagnosticId?, observacoes, ativoDesde

Consultoria                       (o "projeto" — escopo variável)
  id, clientId, nome, tipo(ConsultoriaTipo),
  tipo: DIAGNOSTICO | FICHA_TECNICA | PRECIFICACAO | PROCESSOS
      | TREINAMENTO | ASSESSORIA_COMPRAS | MONTAGEM_COZINHA
      | ACOMPANHAMENTO | PRÉ_TEMPORADA | PERSONALIZADO
  status: PLANEJADA | ATIVA | PAUSADA | CONCLUIDA | CANCELADA
  inicioEm, fimPrevistoEm, fimEm,
  responsavelId, escopoJson, valorContratado?, observacoes

TeamMember                        (equipe DO CLIENTE — opcional na v1)
  id, clientId, nome, funcao, turno, ativo

Appointment                       (visita / atendimento)
  id, clientId, consultoriaId, tipo, data, duracaoMin,
  tipo: ONLINE | PRESENCIAL | VISITA_OBRA | VISTORIA | TREINAMENTO
  resumo, participantes[], anexos[]
```

### 11.5 Núcleo: ingredientes

```
MeasurementUnit
  id, codigo(KG|G|L|ML|UN|DZ|PCT|CX|FATIA|COLHER|XICARA|PITADA),
  nome, grandeza(MASSA|VOLUME|CONTAGEM), fatorParaCanonica

UnitConversion
  id, deUnitId, paraUnitId, fator, ingredienteId?   (null = regra geral)

Ingredient                        (biblioteca da consultora — global)
  id, nome, nomeNormalizado(para busca), codigo?, categoria,
  unidadeCompraId, conteudoEmbalagem, unidadeCanonicaId,
  fatorConversao,                 (embalagem → unidade canônica)
  fatorCorrecaoPadrao,            (o F.C. canônico do ingrediente)
  indiceCoccaoPadrao?,            (se ela usar IC — a confirmar)
  perecivel, validadeDias?, observacoes, criadoPorId, ativo

ClientIngredient                  (o ingrediente NAQUELE cliente, com preço)
  id, clientId, ingredientId,
  unidadeCompraId, conteudoEmbalagem, precoEmbalagem,
  precoPorUnidadeCanonica,        (derivado e persistido para auditoria)
  fatorCorrecao,                  (pode diferir do padrão)
  fornecedor?, observacoes, ativo
  @@unique([clientId, ingredientId])

IngredientPriceHistory
  id, clientIngredientId, precoEmbalagem, conteudoEmbalagem,
  precoPorUnidadeCanonica, fornecedor?, vigenteDesde, registradoPorId
```

**Por que `Ingredient` e `ClientIngredient` são separados:** o ingrediente é o mesmo entre clientes ("peito de frango"), mas o preço e o fornecedor não. Sem essa separação, a biblioteca não se reaproveita e o gargalo continua.

### 11.6 Núcleo: fichas técnicas

```
Recipe                            (a ficha técnica)
  id, clientId, nome, codigo?,
  tipo: PRATO_PRINCIPAL | ENTRADA | SOBREMESA | ACOMPANHAMENTO
      | BEBIDA | BASE | SUB_PREPARACAO | MOLHO
  -- organização de produção
  praca?, turno?, responsavelTeamMemberId?, tempoExecucaoMin?,
  -- rendimento
  rendimentoPorcoes, rendimentoUnidade,
  -- parâmetros de decisão
  cmvAlvoPct?, margemAlvoPct?, precoPraticado?,
  -- conteúdo
  modoPreparo?, observacoes, modoDeUso?,
  status: RASCUNHO | ATIVA | ARQUIVADA,
  versao, recipeOrigemId?          (de qual ficha foi duplicada)
  @@unique([clientId, nome, versao])

RecipeItem                        (linha da ficha)
  id, recipeId, ordem,
  ingredientId?,                   (ou...)
  subRecipeId?,                    (...uma sub-preparação — nunca os dois)
  quantidadeLiquida, unidadeLiquidaId,
  fatorCorrecao,                   (herdado, sobrescrevível)
  fatorCorrecaoSobrescrito Boolean,
  -- derivados persistidos para auditoria e consulta rápida
  pesoBruto, custoUnitario, custoTotal,
  opcional Boolean, observacao, grupo?   ("massa", "recheio", "finalização")

RecipeCostSnapshot                (o que permite provar economia)
  id, recipeId, consultoriaId?,
  custoTotal, pesoTotal, custoPorPorcao,
  precoPraticado, cmvReal, markupReal, lucroPorPorcao,
  motivo: MANUAL | FECHAMENTO_CONSULTORIA | MUDANCA_DE_PRECO,
  registradoEm
```

`RecipeCostSnapshot` é o que hoje não existe em lugar nenhum e que produz o número "R$ 5.500 em 4 semanas". Sem ele, o sistema só sabe o custo **de agora**.

### 11.7 Núcleo: cardápio, produção e tarefas

```
Menu
  id, clientId, nome, temporada?, vigenteDesde, vigenteAte?, status

MenuItem
  id, menuId, recipeId, praca, turno, ordem,
  precoVendaPraticado,
  listaDeFinalizacao?,             (a "Lista de Finalização" dos prints)
  ativo
  @@unique([menuId, recipeId, praca])

Process                           (mapeamento de processos)
  id, clientId, consultoriaId?, nome, praca?, turno?,
  responsavelTeamMemberId?, tempoTotalMin?,
  objetivo, status: MAPEADO | EM_IMPLANTACAO | IMPLANTADO,
  observacoes

ProcessStep
  id, processId, ordem, descricao,
  responsavelTeamMemberId?, tempoMin?, insumoObservacao?,
  pontoCritico Boolean

Task                              (plano de ação)
  id, clientId, consultoriaId?, titulo, descricao,
  categoria: CARDAPIO | FICHA_TECNICA | PRECIFICACAO | PROCESSO
           | TREINAMENTO | COMPRAS | ESTRUTURA | EQUIPE,
  responsavelTipo: CONSULTORA | CLIENTE | EQUIPE_CLIENTE,
  responsavelId?, prazo, status: ABERTA | EM_ANDAMENTO | CONCLUIDA | BLOQUEADA,
  prioridade: BAIXA | MEDIA | ALTA | CRITICA,
  evidenciaUrl?, concluidaEm, observacoes
```

### 11.8 Núcleo: acompanhamento e resultado

```
FollowUp
  id, clientId, consultoriaId, data, tipo,
  resumo, decisoesTomadas, proximosPassos, anexos[]

IndicatorReading                  (indicador datado)
  id, clientId, consultoriaId?, data,
  tipo: CUSTO_TOTAL_CARDAPIO | CMV_MEDIO | CMV_POR_PRECO_ALTO
      | FATURAMENTO | REFEICOES_PERIODO | PERDA_PERCENTUAL
      | ITENS_SEM_FICHA | TAREFAS_CONCLUIDAS,
  valor Decimal, unidade, referencia?, observacao
```

`IndicatorReading` é o que sustenta a etapa 05 do método dela ("indicadores e ajustes contínuos") e a comparação antes × depois.

### 11.9 Conhecimento e integrações

```
LibraryItem                       (biblioteca de conteúdo)
  id, categoria: LIMPEZA | BOAS_PRATICAS | TREINAMENTO | CHECKLIST,
  titulo, conteudoMarkdown, clientId?, publico Boolean

WhatsAppTemplate                  (fase futura)
  id, nome, chaveMeta, corpo, variaveis[], ativo

IntegrationCredential             (fase futura)
  id, provedor, chave, valorCifrado, expiraEm, ativo
```

### 11.10 Diagrama de relações

```
User ─┬─(cria)─ Ingredient
      └─(analisa)─ Lead ──── Diagnostic
                      ↓ (converte)
                   Client ─┬─ Consultoria ─┬─ Task
                           │               ├─ FollowUp
                           │               └─ IndicatorReading
                           ├─ ClientIngredient ── IngredientPriceHistory
                           ├─ Recipe ─┬─ RecipeItem ─┬─ Ingredient
                           │          │             └─ Recipe (sub)
                           │          └─ RecipeCostSnapshot
                           ├─ Menu ── MenuItem ── Recipe
                           ├─ Process ── ProcessStep
                           ├─ TeamMember
                           └─ IndicatorReading

Ingredient ── MeasurementUnit
```

### 11.11 Volume inicial estimado

Considerando ~10 clientes ativos, ~40 pratos por cliente e ~25 ingredientes por ficha:

| Entidade | Volume estimado |
|---|---|
| Ingredient (biblioteca) | 300–600 |
| ClientIngredient | 400–800 |
| Recipe | ~400 |
| RecipeItem | ~8.000 |
| RecipeCostSnapshot | ~2.000/ano |
| MenuItem | ~500 |
| Lead + Diagnostic | ~200/ano |

É um banco **pequeno**. O Neon no plano gratuito atende com folga na fase 1, e o gargalo de performance nunca vai ser volume de dados — vai ser o número de queries ao recalcular muitos itens de ficha. Daí a decisão de persistir derivados por linha e recalcular de forma controlada.

---

## 12. ESTRUTURA ADMIN (CONSULTORA)

### 12.1 Princípios

O sistema é **dela primeiro**. Uma única usuária no comando de tudo. A interface precisa ser rápida o suficiente para ela usar **durante** uma consultoria presencial, no notebook, com o cliente do lado. E precisa ser legível no celular, numa visita de obra.

Navegação em **seis grupos**, não em treze itens soltos:

| Grupo | Itens |
|---|---|
| **Entrada** | Leads · Diagnósticos |
| **Clientes** | Clientes · Consultorias · Equipe |
| **Técnico** | Ingredientes · Fichas técnicas · Cardápios · Precificação e CMV |
| **Operação** | Processos e praças · Tarefas |
| **Resultado** | Acompanhamentos · Relatórios |
| **Sistema** | Biblioteca · Configurações |

### 12.2 Visão geral da operação

Não é um dashboard de vaidade. Deve responder, em uma tela:

- **Leads novos** aguardando análise, com score e o maior problema declarado
- **Pontos de atenção** no que já está cadastrado: pratos com CMV acima do alvo, fichas com preço de ingrediente desatualizado há mais de 30 dias, fichas com peso bruto zero, itens sem preço de venda
- **Consultorias ativas** com prazo
- **Tarefas** em atraso e para esta semana
- **Últimos acompanhamentos** e a variação de custo no período

A frase-guia do painel, no tom dela: *"Onde a operação está perdendo dinheiro agora."*

### 12.3 Telas principais e o que resolvem

**Fichas técnicas — lista.** Ordenável e filtrável por: cliente, categoria, praça, CMV real, custo por porção, presença de preço de venda. É aqui que o prato problemático aparece. Busca por nome de prato **e de ingrediente** ("quais pratos usam carne seca?").

**Ficha técnica — editor.** Três movimentos, conforme [10.8](#108-experiência-de-uso-da-ficha). Painel lateral fixo com resultados ao vivo.

**Precificação e CMV.** A tela que generaliza a aba "Controle geral": todos os pratos de um cliente lado a lado, com custo, CMV alvo, preço sugerido, preço praticado, markup real, CMV real — e os piores casos no topo. Uma linha por prato, editável em linha.

**Ingredientes.** Lista com preço atual por unidade canônica, variação desde o último preço, e "usado em N fichas". Ação de atualizar preço, com histórico.

**Diagnósticos.** Fila de leads com score por bloco, os pontos de atenção já escritos em linguagem de operação, e o botão de converter em cliente.

**Impressão.** Ficha, cardápio, lista de compras e relatório, todos no padrão visual da marca.

### 12.4 Comportamento e detalhes que importam

- **Estado vazio explícito em tudo.** Nunca `#DIV/0!`, nunca tela em branco. O padrão é dizer o que falta e por quê.
- **Salvamento automático** no editor de ficha, com indicação discreta de "salvo".
- **`Cmd/Ctrl+K`** abrindo busca global de prato, ingrediente e cliente.
- **Filtros persistidos** na URL, para que ela possa favoritar uma visão.
- **Exportação CSV** de qualquer lista.
- **Nada de modal sobre modal.** Edições acontecem em painel lateral.
- **Confirmação só em ação destrutiva** — arquivar, excluir, reprocessar custo em massa.
- **Histórico visível**: quem mudou o quê e quando, em cada ficha.

---

## 13. ESTRUTURA CLIENTE

Não implementar agora. Desenhar agora.

### 13.1 O que o cliente pode ver, e o que não pode

**Pode ver:**

- As fichas técnicas dos **próprios** pratos, com custo e porcionamento — é o que ela entrega hoje
- O cardápio com preço de venda praticado
- A lista de compras do período
- O plano de ação: o que foi combinado, o que está pendente, o que já foi feito
- Os indicadores de evolução do **próprio** negócio
- Documentos e relatórios da consultoria
- Os processos e a lista de finalização por praça — é material de cozinha, precisa circular

**Não pode ver:**

- Preços de outros clientes
- A biblioteca de ingredientes da consultora (é o ativo dela)
- A margem alvo e o CMV alvo como parâmetro editável — vê o resultado, não ajusta a régua
- Diagnósticos de outros leads
- Notas internas dela

### 13.2 Estrutura

Três níveis, em ordem de esforço:

**Nível 1 — somente leitura, por link.** Ela gera um link de uma ficha ou de um relatório e envia no WhatsApp. Sem login, sem conta. Resolve 80% do caso hoje, com uma fração do esforço. **É por aqui que se deve começar.**

**Nível 2 — acesso autenticado de leitura.** O cliente entra com e-mail e vê suas fichas, seu cardápio, seu plano de ação e seus indicadores. Só leitura.

**Nível 3 — participação.** O cliente informa preços de insumo, aponta o que foi produzido, marca tarefas como concluídas, envia foto. É aqui que o sistema começa a se alimentar sozinho — e é onde o ganho de tempo dela se multiplica.

O nível 3 é o objetivo de longo prazo. Mas só faz sentido depois que o núcleo estiver validado, e depois de entender se o cliente dela **quer** fazer isso (item 17.12).

### 13.3 Papéis no banco

```
ADMIN          → Érika. Tudo.
CONSULTORA     → futura colaboradora dela. Tudo, exceto configurações e financeiro.
CLIENTE        → acesso de leitura ao próprio tenant + tarefas atribuídas a ele
EQUIPE_CLIENTE → acesso restrito à cozinha: fichas sem preço, processos, lista de finalização
```

O papel `EQUIPE_CLIENTE` é uma sugestão decorrente da [seção 10.9](#109-impressão): a cozinha precisa das quantidades, não dos custos. **A confirmar** (item 17.13).

---

## 14. INTEGRAÇÃO FUTURA COM O SITE

O site é estático e não será alterado nesta fase. A integração será feita por **ponto de contato**, não por reescrita.

### 14.1 Desenho do handoff

```
Site erika-bruna                       Sistema sistema-erika
     │                                        │
     │  Hoje: "Diagnóstico gratuito"          │
     │  aponta para o Google Forms            │
     │                                        │
     │  Amanhã: aponta para                   │
     │  → sistema.erika.../diagnostico    ────┤  rota pública, sem login
     │                                        │  mesma identidade visual
     │                                        │
     │                                        ↓
     │                                   grava Lead + Diagnostic
     │                                   calcula score
     │                                   aparece na fila da Érika
     │                                        │
     │                              ┌─────────┘
     │                              ↓
     │                        resultado do diagnóstico
     │                        (link de leitura no padrão da marca)
     │                              │
     │                              └── notifica a Érika e o lead
```

### 14.2 A decisão de domínio

Três opções, com prós e contras reais:

| Opção | Exemplo | Vantagem | Custo |
|---|---|---|---|
| **Subdomínio** | `sistema.erikabrunaconsultoria.com.br` | Simples, isolado, deploy independente | Uma configuração de DNS e uma conta de domínio |
| **Caminho no domínio do site** | `erikabrunaconsultoria.com.br/diagnostico` | Marca mais coesa | Exige rewrite na Vercel apontando para outro projeto — acopla os dois deploys |
| **Domínio próprio do sistema** | `app.erikabrunaconsultoria.com.br` | Deixa claro que é ferramenta | Nenhum custo real |

**Recomendação: subdomínio.** Mantém os projetos genuinamente independentes, que é o pedido — repositório, Vercel e banco próprios — sem acoplar deploy de site e deploy de sistema.

### 14.3 O que precisa mudar no site (quando autorizado)

Mudança mínima, em um único ponto: os dois links do botão "Diagnóstico gratuito" (hero e CTA final) e o link do rodapé. Nada de estrutura, nada de CSS, nada de conteúdo.

**Enquanto a Fase 2 não existir:** os dois podem conviver. O formulário no sistema entra em operação primeiro como ferramenta interna (a Érika lança as respostas que já recebe), e só depois o site aponta para ele. Assim o site nunca fica com um link quebrado.

### 14.4 O que o sistema precisa expor

- `POST /api/diagnostico` — recebe a submissão, com rate limiting e honeypot
- `GET /diagnostico` — a página pública, com a identidade visual do site (mesmos tokens)
- `GET /r/[token]` — link de leitura do resultado, para enviar no WhatsApp
- `GET /api/health` — para monitoramento

Nada além disso precisa ser público.

---

## 15. INTEGRAÇÃO FUTURA COM WHATSAPP

Não implementar nesta fase. A arquitetura apenas precisa não impedir.

### 15.1 Regra inegociável

Somente **WhatsApp Business Platform (Cloud API)**, oficial, via Meta. Não serão usados e não serão considerados: automação não oficial do WhatsApp Web, scraping, simulação de navegador, QR Code automatizado, ou qualquer biblioteca que opere sobre a sessão do aparelho. O risco de banimento da conta principal da cliente — que é o canal de vendas dela — é inaceitável.

### 15.2 O que a integração oficial habilita

- Envio de **templates aprovados** pela Meta (confirmação de diagnóstico recebido, envio do resultado, lembrete de acompanhamento)
- **Sessão de atendimento** de 24 horas após mensagem do cliente, para respostas livres
- Recebimento de mensagens, com o histórico vinculado ao lead ou ao cliente no sistema
- Notificação para a Érika quando um diagnóstico é respondido

### 15.3 O que a arquitetura precisa ter agora para permitir isso depois

1. **`Lead.whatsapp` como campo próprio e normalizado** (DDI + DDD + número, só dígitos). O formulário atual pede o WhatsApp como texto livre — normalizar desde já evita uma migração dolorosa.
2. **Um modelo `WhatsAppTemplate`** com chave da Meta, corpo e variáveis declaradas.
3. **Um modelo `IntegrationCredential`** com valor cifrado em repouso.
4. **Uma camada de notificação abstrata** (`lib/notifications/`), com uma interface única e implementações trocáveis. Hoje: e-mail e nada. Depois: WhatsApp oficial. Nenhum código de domínio chama um provedor diretamente.
5. **Um log de notificações enviadas** por lead e por cliente.
6. **Webhook idempotente** desde o desenho — a Meta reenvia eventos.

Nenhum desses itens exige a integração existir. São decisões de modelagem que custam quase nada agora e evitam retrabalho depois.

---

## 16. FASES RECOMENDADAS DE CONSTRUÇÃO

Cada fase termina entregando algo **usável na operação real**, não uma camada técnica.

### Fase 1 — Fundação e identidade
Next.js + TypeScript + Tailwind + Prisma + Neon + Vercel + repositório próprio. Design system derivado do site: tokens, tipografia, rótulo de seção, botões, campos, tabelas, cartões, estados vazios e de carregamento. Shell de navegação. Autenticação com um único usuário (a Érika).
**Entrega:** o sistema existe, tem a cara da marca, e ela consegue entrar.

### Fase 2 — Cliente, lead e diagnóstico
Cadastro de clientes. Modelo completo de Lead e Diagnostic. Formulário de diagnóstico em etapas, com a identidade da marca, replicando as 33 perguntas atuais. Cálculo de score por bloco. Fila de leads com os pontos de atenção. Importação manual das respostas que ela já tem no Google Forms.
**Entrega:** para de usar o Google Forms. Os leads ficam organizados e priorizados.

### Fase 3 — O núcleo: ingredientes, fichas e custos
Cadastro de ingredientes com conversão de unidade, preço por unidade canônica e fator de correção. Editor de ficha técnica com cálculo ao vivo, conforme a [seção 10](#10-módulo-de-ficha-técnica-e-custos). Sub-preparações. Duplicar ficha. Importação da lista de insumos. Impressão da ficha.
**Entrega:** **esta é a fase que muda o trabalho dela.** Elimina a planilha para o caso principal.

### Fase 4 — Precificação, CMV e controle geral
Tela de precificação lado a lado. CMV alvo e margem como parâmetros por cliente. Markup real, CMV real, lucro por porção. Pontos de atenção automáticos, incluindo o alerta de prato vendido abaixo ou perigosamente próximo do custo — o caso do buffet. Ranking de pratos por CMV.
**Entrega:** ela enxerga o cardápio inteiro de uma vez e sabe onde intervir.

### Fase 5 — Cardápios, listas e documentos
Cardápio como agrupador de fichas. Lista de compras a partir do cardápio × volume. Exportação e impressão profissional de cardápio, ficha, lista de compras e relatório.
**Entrega:** o material de entrega ao cliente sai pronto do sistema.

### Fase 6 — Processos, praças e plano de ação
Mapeamento de processos com etapas, responsável e tempo. A "Lista de Pratos por Praça" com praça, turno, tipo, tempo e lista de finalização. Tarefas e plano de ação com responsável e prazo.
**Entrega:** a ponte entre custo e produção existe. A etapa 02 e a 03 do método dela ficam dentro do sistema.

### Fase 7 — Acompanhamento, indicadores e resultado
Snapshots de custo. Registro de indicadores datados. Visitas e acompanhamentos. Comparação antes × depois gerada automaticamente — a origem do "R$ 5.500 em 4 semanas". Relatório de resultado no padrão da marca.
**Entrega:** ela para de reconstruir números à mão e ganha material de divulgação pronto.

### Fase 8 — Portal do cliente
Começa pelo nível 1 (link de leitura), evolui para o nível 2 (acesso autenticado de leitura) conforme a validação.
**Entrega:** o cliente passa a acompanhar dentro do sistema, não só por WhatsApp.

### Fase 9 — Integrações
WhatsApp Business Platform oficial. Notificações automáticas. Importação de preços. Eventualmente, o editor colaborativo para o cliente informar o que foi produzido.

**Ordem justificada:** a Fase 3 é o coração e deve vir o mais cedo possível. As fases 1 e 2 são pré-requisito porque o sistema precisa de clientes e de identidade para receber fichas. As fases 4 a 9 aumentam o valor, mas nenhuma delas é o motivo pelo qual o projeto existe.

---

## 17. PONTOS QUE PRECISAM DE CONFIRMAÇÃO

Nada abaixo deve ser decidido por inferência. Todos são perguntas para a Érika.

### Sobre o trabalho dela

1. **Volume real.** Quantos clientes ativos, quantos pratos por cardápio em média, e quantas vezes por mês os preços de insumo mudam?
2. **Estoque.** Ela controla estoque de fato, ou a aba de insumos é só uma lista de preços? Se controla, onde e como?
3. **Registro de compras.** Ela registra compras (nota, fornecedor, data) ou apenas atualiza o preço do insumo quando ele muda?
4. **Índice de cocção.** Além do fator de correção (peso bruto ÷ peso líquido), ela usa índice de cocção (peso cozido)? Os prints mostram apenas "Correção". Se usar, precisa de um campo a mais.
5. **Fator de correção por contexto.** O mesmo ingrediente pode ter FC diferente em fichas diferentes? Ex.: cenoura em salada (FC alto) versus em sopa (FC 1,00). A resposta define se o FC é do ingrediente ou da linha da ficha.
6. **O F.C. duplicado.** Por que ele aparece na Lista de Insumos **e** em cada linha da ficha? Qual é a fonte de verdade quando os dois divergem?
7. **Preço de venda.** Ela define o preço pelo CMV alvo (30% no print) ou pelo markup? O valor de 30% é padrão para todos os clientes ou varia?

### Sobre a entrega ao cliente

8. **Formato de entrega.** O que o cliente recebe: PDF, planilha editável, impresso, link? Com que frequência?
9. **Origem do volume.** Como ela chega ao "custo do cardápio de R$ 40.545,47" — o cliente informa quantos pratos vendeu, ou ela estima? **Este é o ponto que mais afeta o desenho do módulo de indicadores.**
10. **Quem fornece os preços.** Os preços de insumo vêm do cliente, de pesquisa dela, ou de notas fiscais?

### Sobre o diagnóstico

11. **Peso das respostas.** O score deve ser calculado com que peso por resposta? Ela concorda com a divisão em seis blocos (lucratividade, estrutura, padronização, precificação, insumos, equipe)?
12. **Faturamento.** Deve virar faixa de valores em vez de texto livre? Quais faixas?
13. **Pergunta obrigatória aberta.** As perguntas 27 e 28 são obrigatórias e podem reduzir a conversão. Elas permanecem obrigatórias?
14. **Dois preços.** A planilha Ficha Técnica CMV está a R$ 147 no site e a R$ 97 num post. Qual é o valor vigente? Haverá venda dentro do sistema?
15. **Triagem.** Quem responde o diagnóstico hoje: todos, ou ela filtra antes de devolver o direcionamento?

### Sobre o sistema

16. **Acesso do cliente.** O cliente dele quer fazer login? Ou a entrega por link/PDF/WhatsApp é suficiente? Isto decide se a Fase 8 existe ou não.
17. **Custo dentro da cozinha.** A ficha impressa que vai para a cozinha mostra preços ou apenas quantidades? Existe uma versão para a equipe do cliente?
18. **Retorno do cliente para a Érika.** Ela quer que o cliente informe preços, produção e conclusão de tarefas dentro do sistema, ou pretende continuar fazendo isso ela mesma? Isto define o esforço da Fase 8/9.
19. **Centavos de divergência.** A planilha dela mostra `22,11` onde a soma exata é `22,12`. O sistema deve arredondar por linha (reproduzindo o comportamento atual) ou calcular com precisão total e arredondar só na exibição (correto, mas vai divergir dos números antigos)?
20. **Domínio.** Confirma o subdomínio para o sistema? Qual será?
21. **Identidade.** O sistema deve ser visualmente idêntico ao site, ou um pouco mais contido — já que é usado todo dia e não é material de venda?
22. **Nome do sistema.** O sistema tem nome próprio ou é "área da consultora" / "painel"?

---

## Encerramento

O que este projeto tem de mais favorável é que **a lógica de negócio já está documentada, nas planilhas dela**. As fórmulas existem, foram verificadas aritmeticamente, e não precisam ser inventadas — este era o maior risco da fase 0, e ele está eliminado.

O que o sistema precisa fazer não é descobrir o cálculo. É **eliminar a digitação repetida, propagar os preços, impedir os erros de fórmula visíveis ao cliente, e guardar o histórico que hoje não existe** para que a economia conquistada possa ser provada.

O maior risco remanescente não é técnico: são as 22 perguntas da seção 17, em especial as de número 5, 6 e 9. **Recomendo responder essas três antes de escrever a primeira linha da Fase 3.**

**Aguardando autorização para iniciar a Fase 1. Nada foi implementado.**
