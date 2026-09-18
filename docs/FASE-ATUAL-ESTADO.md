# FASE ATUAL — VISUAL PRÓXIMO DO PRODUTO FINAL + CONTRATOS + CENTRAL DE PLANILHAS

Documento de estado da fase corrente do Sistema Érika Bruna.

Mesma regra das fases anteriores: **nada aqui pode afirmar mais do que foi
verificado.** Toda linha deste arquivo foi escrita depois de olhar o arquivo que
ela descreve, e o que não foi executado está dito como não executado.

Esta fase não recomeçou nada. As Fases 0, 1 e 2 permanecem como estavam: nenhum
arquivo foi reescrito, nenhuma migration foi criada, nenhum banco foi conectado.

> **Nota de leitura.** Este documento foi escrito em duas passagens. As Seções 1
> a 6 descrevem o que a fase entregou antes da interrupção por erro de execução.
> A **Seção 7-A** descreve o refinamento concluído depois da retomada — linguagem
> interna fora da tela, microinterações e responsividade. A **Seção 9** foi
> reescrita na retomada, porque o ambiente de verificação mudou.

---

## 1. O que esta fase entregou

Três coisas, nesta ordem de importância:

**Um segundo módulo que gera arquivo de verdade.** A Central de Planilhas
produz um `.xlsx` real, montado no servidor com `exceljs`, com quatro abas,
cabeçalho congelado, filtro, formatos de moeda e data e uma aba que explica de
onde vieram os dados. Não é simulação de download: o navegador grava um arquivo
que abre no Excel.

**Contratos como módulo navegável.** Lista com filtros, busca e oito colunas, e
detalhe com resumo financeiro, cronograma de N parcelas, área de documento e
histórico. Servido pelos dados de demonstração, com as limitações ditas dentro
da tela.

**O Dashboard ajustado para abrir o dia.** Saudação pelo fuso dela, seis
contagens conferíveis, o bloco do que trava o trabalho, e contratos com parcelas
a vencer. Sem gráfico financeiro inventado.

A identidade visual não foi tocada: verde profundo, creme, oliva e dourado, a
tipografia editorial e a tela de login aprovada continuam exatamente como
estavam.

**Depois da retomada** — Seção 7-A — entraram três acabamentos: a varredura de
linguagem interna que ainda vazava para a tela, a microinteração dos cards de
valor e a revisão de responsividade. Nenhum módulo novo, nenhuma regra de
negócio nova.

---

## 2. Contratos — o que existe

### Rotas

| Rota | Estado |
| --- | --- |
| `/contratos` | FUNCIONAL sobre demonstração — lista, seis filtros, busca, oito colunas, ação "Novo contrato" |
| `/contratos/[id]` | FUNCIONAL sobre demonstração — resumo financeiro, cronograma, documento e histórico |

### O que é real na tela

A estrutura. Cabeçalho (cliente, empresa, serviço, valor total, data de criação,
status, aceite, próximo pagamento, mensalidade), resumo financeiro (valor do
projeto, valor pago, valor pendente, mensalidade), cronograma em linha do tempo,
área de documento com quatro estados e histórico com os eventos do contrato —
tudo isso existe como tipo, como derivação e como tela.

Os números do resumo são **somas das parcelas que estão listadas logo abaixo**.
Qualquer pessoa soma a coluna e chega ao mesmo valor. Não há receita prevista,
valor corrigido, juros, multa nem projeção: juros são cláusula, e nem todo
contrato tem; projeção é decisão, e ela não foi tomada.

### O cronograma aceita N parcelas

Esta é a decisão estrutural mais importante do módulo, e vale registrar o
motivo: **a estrutura não está fixada em quatro pagamentos.** O contrato tem um
número de parcelas que vem dos dados, e o cronograma desenha a lista inteira —
uma, quatro, doze, quantas houver.

Fixar "quatro" no domínio teria criado uma contradição impossível de resolver
depois: um contrato de doze meses não caberia, e a saída seria gambiarra no meio
do caminho. O estado de cada parcela é `PENDENTE`, `PAGO`, `ATRASADO` ou
`CANCELADO`, e "atrasada" é derivada da data de vencimento comparada com hoje,
não um campo que alguém precisa lembrar de atualizar.

### O que não existe, e a tela diz

Não há cobrança automática, não há gateway de pagamento e não há confirmação
bancária. O sistema registra o pagamento; não o provoca nem o descobre sozinho.

Na área de documento: a estrutura de visualizar, abrir e imprimir existe, e o
estado do documento é `NÃO ENVIADO`, `AGUARDANDO ACEITE` ou `ASSINADO`. O
arquivo do contrato em si mora em **outro projeto** — o projeto do contrato
externo —, e nenhum código dele foi copiado para dentro deste sistema. O que
existe aqui é o lugar onde o documento vai morar e o estado do aceite.

Não há assinatura jurídica definitiva. Um aceite que não tem validade jurídica
não pode aparecer na tela com a mesma aparência de um que tem.

---

## 3. Central de Planilhas — o que existe

### Rota

| Rota | Estado |
| --- | --- |
| `/planilhas` | FUNCIONAL — catálogo dos cinco modelos, seletor de cliente e geração real de arquivo |

### A arquitetura, e por que ela é assim

Tudo vive em `src/lib/planilhas/`, isolado:

| Arquivo | Papel |
| --- | --- |
| `tipos.ts` | Os tipos do domínio: `ContextoPlanilha`, `ModeloPlanilha`, `ArquivoGerado`, `EstadoModelo`. |
| `modelos.ts` | O catálogo dos cinco modelos. **Módulo puro**, sem importar biblioteca nenhuma — é o que permite a tela desenhar os cards sem arrastar o `exceljs` para o navegador. |
| `estado.ts` | Os três mapas de exibição (rótulo, tom, explicação) por estado de modelo. Puro, pelo mesmo motivo. |
| `estilos.ts` | A camada de estilo do Excel: cores, formatos, larguras, cabeçalho, tabela, congelamento. |
| `modelos/relatorio-consultoria.ts` | O único modelo que gera arquivo. Escreve as quatro abas. |
| `gerador.ts` | A ponte: valida, monta o `Workbook`, serializa o buffer, compõe o nome do arquivo. `import "server-only"`. |
| `contexto.ts` | Junta os dados do repositório num `ContextoPlanilha`. |

`gerador.ts` começa com `import "server-only"`. Isso não é enfeite: é uma trava
de compilação. No dia em que alguém importar o gerador dentro de um componente
de cliente, o build falha com um erro claro em vez de empacotar o `exceljs`
inteiro para o navegador e descobrir isso em produção.

### O modelo que funciona

**RELATÓRIO DE CONSULTORIA** — `DISPONIVEL`. Gera
`consultoria-[cliente]-[data].xlsx`, com nome sanitizado (acento removido,
espaço virando hífen, cortado em 60 caracteres). Quatro abas:

1. **RESUMO** — quem é o cliente, em que ponto está, e as contagens.
2. **TAREFAS** — as tarefas do cliente, concluídas por último, com a situação do
   prazo escrita em palavra ("vence amanhã", "vencida há 3 dias").
3. **ACOMPANHAMENTOS** — o histórico dos encontros.
4. **INFORMAÇÕES** — de onde vieram os dados, o que não foi calculado, e quais
   decisões estão esperando resposta.

As datas são escritas como data de verdade (não como texto), para que ordenar e
filtrar funcionem no Excel. O cabeçalho é congelado e tem filtro. A aba
INFORMAÇÕES lista em vermelho as quatro coisas que **não** são calculadas: CMV,
preço e markup, índice de cocção e fator de correção, margem. Se ela abrir o
arquivo e procurar o custo do prato, o arquivo responde onde ele está — e não
deixa um número inventado no lugar.

### Os quatro modelos que ainda não saem

| Modelo | Estado | Por quê |
| --- | --- | --- |
| Ficha técnica | Em preparação | Programação; depende dos pontos 4 e 5 |
| Lista de pratos por praça | Em preparação | Programação; depende do ponto 8 |
| Custos e precificação | **Aguardando definição** | Depende dos pontos 4, 5, 6, 7, 9, 11 e 19 |
| Plano de ação | Em preparação | Programação; depende do ponto 11 |

Cada card mostra o motivo escrito para ela, e o card que espera decisão dela é
visualmente distinto dos que esperam trabalho de programação — porque as duas
situações pedem coisas diferentes: numa, esperar; na outra, responder.

### O download confere o que recebeu

O botão não grava qualquer coisa que chegue. Ele confere o `Content-Type` da
resposta antes de criar o arquivo, e recusa o que não for planilha.

Parece excesso e não é: o middleware protege `/api/planilhas/...`, então uma
sessão expirada faz o `fetch` ser redirecionado para `/entrar` — e um
redirecionamento seguido termina em **200**, com HTML no corpo. Sem a
conferência, o navegador gravaria um `.xlsx` que é HTML por dentro; o Excel
abriria com erro de formato e a conclusão seria "a planilha está quebrada",
quando o problema é a sessão. Custa uma comparação de texto.

### A rota que entrega o arquivo

`GET /api/planilhas/[modelo]?cliente=...&consultoria=...`

`runtime = "nodejs"` (o exceljs precisa de APIs do Node) e `force-dynamic`.
Responde 400 sem cliente, 404 para modelo ou cliente inexistente, 409 com o
motivo escrito quando o modelo não está disponível, e 500 com mensagem genérica
quando a geração quebra — o erro inteiro vai para o log do servidor.

**Esta rota está protegida pelo middleware.** O matcher exclui `api/auth` e mais
nada dentro de `api/`, então `/api/planilhas/...` exige sessão. Conferido lendo
`src/middleware.ts`, não presumido.

---

## 4. As duas integrações

As duas reaproveitam **o mesmo componente** de geração. Nenhuma lógica de
geração foi duplicada — a regra "gerar planilha" mora num lugar só.

**`/clientes/[id]` → aba Documentos.** A seção "Documentos e planilhas" entrou no
topo da aba que já existia, e não como nona aba. A razão está no arquivo: as
duas coisas são a mesma família, o que as separa é o tempo verbal — a aba é o
passado (o que foi registrado), o cartão é o presente (o que sai agora).

**`/consultorias/[id]`.** A mesma seção no fim da página, já com o cliente e a
consultoria resolvidos no servidor — o botão não precisa descobrir de quem é o
arquivo.

---

## 5. Dashboard

O que mudou: a saudação ("Boa noite, Érika.") calculada pelo fuso dela, a frase
"Veja o que precisa da sua atenção hoje.", o resumo com as seis contagens
(diagnósticos novos, clientes ativos, consultorias em andamento, tarefas
pendentes, fichas aguardando dados, contratos aguardando aceite), o bloco do que
precisa de atenção e a atividade recente.

**Nenhum gráfico financeiro foi inventado.** A razão está escrita no arquivo e
vale repetir: os valores dos contratos existem, mas o que eles somam não é
medição de nada — são contratos de demonstração. Um gráfico bonito em cima disso
seria lido como o desempenho real da consultoria dela. O que aparece é o que se
confere: contagem por estado, soma das parcelas de cada contrato, próxima
parcela a vencer.

A saudação usa o fuso `America/Sao_Paulo` porque o servidor roda em UTC: às 21h
de São Paulo ele já está no dia seguinte, e cumprimentaria com "Bom dia" quem
está fechando a cozinha. A data entra como argumento para que o HTML do servidor
e o do navegador digam a mesma palavra.

---

## 6. O que permanece demonstrativo

Tudo o que é dado. Nenhum banco foi conectado.

Os clientes, consultorias, contratos, leads, fichas, ingredientes, processos,
acompanhamentos e tarefas continuam vivendo em `src/lib/dados/mock/`. A faixa de
demonstração aparece em todas as telas novas.

**A divisão honesta na Central de Planilhas:** o arquivo é real, os dados dentro
dele são de demonstração. É uma combinação que confunde se não for dita, e está
dita — na faixa do topo e no aviso do fim da tela.

O botão "Novo contrato" em `/contratos` é visual e preparatório: ele não finge
gravar. Um formulário que aceita o preenchimento e descarta em silêncio seria
pior do que não ter o botão.

---

## 7. Limitações conhecidas

**O `exceljs` não pôde ser instalado neste ambiente na primeira passagem.** O
sandbox onde este trabalho começou não tinha rede, então o `npm install` do
`exceljs` não rodou. A dependência foi adicionada ao `package.json` com a versão
`^4.4.0`, e a implementação foi escrita por completo.

Para conferir os tipos sem a biblioteca, foi criado um arquivo de declaração
**fora do projeto**, apontado por um `tsconfig.check.json` descartável. Isso
pegou dois erros reais que teriam aparecido só no Windows — a confusão entre os
dois tipos `Cliente` do projeto e uma união de tipos larga demais no catálogo.

Na retomada, o sandbox voltou com rede e com o `node_modules` já instalado. O
`exceljs` está **presente e resolvido**, e a checagem de tipos passou a rodar
contra a biblioteca real — ver a Seção 9. O `tsconfig.check.json` e o arquivo de
declaração descartável perderam a função e foram removidos.

**O build não foi executado neste sandbox.** O `node_modules` foi instalado no
Windows e o binário do compilador do Next para Linux não está presente. Isso não
é defeito do código desta fase — é o limite do ambiente, já registrado nos
documentos das fases anteriores. `lint` e `build` também excedem o limite de
tempo do shell desta sessão (ver Seção 9), e por isso precisam ser confirmados
no Windows.

**Os arquivos temporários foram removidos.** Na primeira passagem eles não
puderam ser apagados porque o ambiente não tinha permissão de exclusão na pasta
montada. Resolvido o acesso, saíram os quatro:

- `tsconfig.check.json` — o `extends` descartável do stub do `exceljs`.
- `src/_resolucao-teste.ts` — só um `export {}`.
- `src/app/(sistema)/planilhas/modelos.ts` — no-op. Foi a cópia local da lista de
  modelos, que passou a viver em `src/lib/planilhas/modelos.ts`.
- `src/app/(sistema)/contratos/novo.tsx` — o formulário antigo de contrato,
  substituído por `contratos/novo/formulario.tsx`. Ficou órfão desde que
  `/contratos` passou a apontar para o fluxo novo, e nada o importava.

A remoção dos dois últimos foi conferida por busca antes de apagar: nenhum
arquivo do projeto aponta para eles. Os três `novo.tsx` que **continuam** na
árvore — em `clientes/`, `ingredientes/` e `processos/` — são importados pelas
respectivas páginas e foram mantidos.

**Um detalhe de fim de linha.** Em `src/lib/auth/index.ts` o `git` registra o
arquivo como alterado sem que haja mudança de conteúdo — é fim de linha (CRLF
contra LF), não edição. A tela de login e o `src/app/entrar/` estão com o
carimbo de modificação do dia 17, anteriores a esta fase: não foram tocados.
Vale conferir com `git diff --ignore-all-space` antes de qualquer commit.

---

## 7-A. O refinamento de produto — o que mudou depois da retomada

Esta é a parte da fase que foi concluída **depois** da interrupção. Nada dela
recomeçou o que já existia: Dashboard, Contratos, Central de Planilhas, Cliente
360°, Consultorias, Fichas, Ingredientes, Processos e Relatórios continuam sendo
os mesmos módulos. O que entrou foram acabamento, responsividade e a limpeza da
linguagem interna que ainda vazava para a tela.

### 7-A.1 Linguagem interna fora da tela da cliente

Era o item mais visível e o mais fácil de deixar passar, porque cada ocorrência
isolada parecia inofensiva. Foi feita uma varredura de `Fase N`, de número de
ponto da Seção 17 e de códigos como `f4`/`prévia`/`parcial` em **texto
renderizado** — comentário de código não conta, ali a referência é útil.

O que saiu da tela:

| Onde | O que dizia | O que diz agora |
| --- | --- | --- |
| `ModuloPendente` (4 telas) | "Previsto para a Fase 4/5/6/9" | "Em preparação" |
| `/precificacao`, `/cardapios`, `/equipe`, `/biblioteca` | lista de números de ponto | ids de decisão com nome, ou nada quando o bloqueio não é metodológico |
| `/diagnosticos` | "pontuação por bloco que a Fase 0 previu" | "pontuação por bloco não está implementada" |
| `/diagnosticos` | "A Fase 0 previu importar as respostas" | "As respostas que você já recebeu ainda não podem ser importadas" |
| `/diagnosticos` | `<strong>11</strong>` solto no meio do texto | descrito como decisão, sem número |
| `/diagnosticos/[id]` | "O relatório da Fase 0 registra…" | "O formulário tem…" |
| `/diagnosticos/[id]` | "falta o peso de cada resposta, que é o ponto 11" | "Esse peso é critério seu, e ainda não foi definido" |
| `/configuracoes` | "da lista de pendências da Fase 0" | "da lista de definições em aberto" |
| `LACUNA.descricao` (lido em `/configuracoes`) | "O relatório da Fase 0 registra 33 perguntas" | "O formulário em uso tem mais perguntas do que as 29 que o sistema conhece" |

**A exceção deliberada.** Em `/configuracoes` o **número** da pergunta continua
("Pergunta 4", "Pergunta 19"). É a única tela onde ele fica: ela existe para ser
o índice das decisões abertas, e o número é o endereço da pergunta original. O
que saiu foi o nome do documento interno ao lado dele, não o número.

**Uma armadilha que quase deixou dois casos passarem.** A primeira varredura
procurou número de ponto dentro de JSX, e teria ficado por isso. Dois textos
vazavam por um caminho diferente: eram **strings de dado**, escritas no cenário de
demonstração e renderizadas depois —

- `mock/operacao.ts` — a etapa `RESULTADO` de uma consultoria vinha com
  `nota: "Depende do ponto 9"`.
- `mock/dados.ts` — o bloco de insumos de um diagnóstico vinha com
  `atencao: ["Caso clássico de produção por estimativa — depende do ponto 9."]`.

Nos dois, o número não estava no JSX: estava no dado, e o componente só o
imprimia. Os dois foram trocados por "Depende de como o volume do período é
apurado" e "depende da origem do volume". A lição vale para a próxima varredura:
buscar também em `mock/`, não só em `app/` e `components/`.

Dois campos guardam listas de números de ponto que **nunca foram renderizadas** —
`MODELOS[].pendencias` e `ItemNavegacao.pendencias`. Ficaram como estão: são
anotação de obra, irmãs do campo `fase`, que o próprio código já documentava como
"organiza a documentação, a tela não mostra". Convertê-las exigiria mapear
números como `8`, `12` e `13` para decisões que não existem em
`DECISOES_PENDENTES` — e inventar esse mapeamento seria pior do que deixar a
anotação quieta.

### 7-A.2 Microinterações nos cards de valor

Foi acrescentada uma classe de marca, `card-indicador`, em `globals.css`, mais um
sinalizador `emCard` no componente `Indicador` para as telas optarem por ela.

O que a microinteração faz: eleva o card em **2px** no hover, clareia a borda sem
trocar de cor, faz **aparecer** uma sombra (hoje não há nenhuma), escurece o valor
um tom e responde ao toque com `:active`.

Três decisões que valem registro:

- **É CSS, não JavaScript.** A alternativa era um componente de card com estado
  de hover, o que traria `useState` para dentro de telas hoje 100% renderizadas
  no servidor — custo pago em cada card de cada tela para animar o que só precisa
  de CSS.
- **A elevação é de 2px, não de 8px.** O sistema tem canto de 4px e sombras quase
  inexistentes; um card que sobe muito destoa da marca. E o valor **escurece** em
  vez de crescer: crescer mudaria a altura da linha e faria o texto ao lado pular.
- **`:active` existe porque hover não existe no celular.** O `@media (hover:
  hover)` separa os dois casos, de modo que o toque tem retorno próprio.

`prefers-reduced-motion` já é tratado globalmente no arquivo, então com a
preferência ligada a transição vira instantânea sem nada mais a fazer. A paleta
não foi alterada — nenhuma cor nova entrou.

O `emCard` é **opt-in** e não padrão: o indicador aparece em dois contextos. Numa
grade de números do Dashboard cada um é um bloco que merece virar card; dentro de
um `Painel` que já é uma caixa fechada, envolver cada um em outra caixa daria
card dentro de card, com duas bordas a 4px de distância. Quem sabe qual é o caso
é a tela.

Aplicado em: resumo de 6 números e par de contratos do Dashboard, três números da
Central de Planilhas, e os quatro números do detalhe do diagnóstico.

### 7-A.3 Responsividade

A revisão foi de auditoria e ajuste pontual, não de reconstrução — a estrutura
já era boa e mexer nela sem motivo quebraria o desktop.

- **Grades.** Toda grade de múltiplas colunas do sistema foi conferida: todas
  colapsam para uma coluna no celular (o prefixo `sm:`/`md:` está presente em
  todas). Nada a corrigir.
- **Filtros.** Os controles com largura mínima (130–200px) estão dentro de
  contêiner com `flex-wrap` e ficam abaixo da largura do celular mais estreito:
  eles quebram linha em vez de esticar a página.
- **Abas.** A faixa de abas ganhou alvo de toque maior (`py-3` no celular, `py-2.5`
  a partir de `sm:`) e o link passou a carregar a borda transparente que mantém a
  altura igual entre aba ativa e inativa. O traço da aba ativa saiu de `-bottom-px`
  para `bottom-0`, e com isso deixou de depender de a borda da `<ul>` coincidir
  pixel a pixel com a do item — que é o tipo de detalhe que quebra só numa
  densidade de tela.
- **Tabelas.** Já rolam dentro de `overflow-x-auto`, com estratégia de cartão
  (`ListaResponsiva`) onde a coluna não faz sentido no celular.
- **Gaps.** Os blocos de números passaram de `gap-5` para `gap-4` onde viraram
  card, para o respiro não dobrar com a borda nova.

O desktop não foi sacrificado em nenhum desses ajustes.

### 7-A.4 A pergunta que ficou aberta

`AvisoMetodologia`, em `components/ui/jornada.tsx`, ficou **sem nenhum uso**. Ele
era a "tarja de uma linha" que as telas usavam antes de `metodologia.tsx` existir;
o último consumidor (`/relatorios`) migrou para `DecisoesQueFaltam`.

O componente **não foi apagado**. A decisão está registrada em comentário no
próprio arquivo: apagar componente compartilhado é a faxina que quebra um arquivo
esquecido, e o custo de mantê-lo é uma função de quatro linhas. Com isso, toda
tela que fala de bloqueio de metodologia usa hoje **uma lista, um vocabulário e
um lugar só** para tirar um item quando a Érika responder.

---

## 8. Regras gastronômicas que continuam esperando resposta

Nenhuma fórmula foi implementada. Não existe CMV, markup, preço de venda, índice
de cocção, fator de correção nem margem em lugar nenhum do código — nem como
campo, nem como valor padrão, nem como sugestão.

| Ponto | O que falta |
| --- | --- |
| 4 | Como se calcula o custo de um prato a partir dos ingredientes |
| 5 | Fichas técnicas: rendimento, fator de correção e perda |
| 6 | Índice de cocção — o que entra e o que sai do cálculo |
| 7 | Critério de preço e markup: por prato, por praça ou por casa |
| 9 | Como o peso e a medida entram na conta, e com quantas casas |
| 11 | Peso de cada etapa da consultoria para medir andamento |
| 19 | Se custo é por porção, por quilo ou pelos dois |

Enquanto essas respostas não chegarem, os cards correspondentes ficam
"aguardando definição" e as planilhas que dependeriam delas listam em vermelho o
que não foi calculado. Nenhum número de aparência correta foi colocado no lugar.

---

## 9. Verificação

Executado neste ambiente, na retomada:

- `npx tsc --noEmit` — **exit 0, sem erros**. Agora contra o `node_modules` real,
  com o `exceljs` resolvido: não é mais a checagem com stub. Rodado depois de
  cada bloco de alteração, inclusive o último.
- Confirmação por busca, antes de apagar arquivo: nenhuma referência no projeto a
  `src/app/(sistema)/planilhas/modelos.ts` nem a
  `src/app/(sistema)/contratos/novo.tsx`.

**Validado no Windows pelo responsável, antes da interrupção:**

- `npm run lint` — **passou**
- `npm run typecheck` — **passou**
- `npm run build` (produção) — **passou**, Next.js 15.5.25, Prisma 6.19.3

Não executado *neste sandbox*, e por quê:

- `npm run lint` e `npm run build` — os dois excedem o limite de tempo do shell
  desta sessão (~3 min por comando) e estouram mesmo em um arquivo pequeno. **Não
  foram verificados aqui.** As alterações desta retomada são de texto em JSX,
  classes CSS e remoção de arquivos órfãos; nenhuma cria símbolo novo que o
  `tsc` não tenha visto. Ainda assim, pela regra de não afirmar o que não foi
  verificado, **lint e build precisam ser confirmados no Windows**.

Nenhuma migration, nenhum `git`, nenhum push e nenhum deploy foram executados.
Nenhuma pasta fora de `/sistema-erika` foi alterada.

---

## 10. Próximos pontos que dependem dela

1. **As sete regras gastronômicas acima.** É o que destrava os quatro modelos de
   planilha que faltam, o bloco de resultado da consultoria e o módulo de
   precificação inteiro.
2. **Onde o arquivo do contrato vai morar.** A área de documento existe e o
   estado do aceite também; o que falta é a decisão de onde o PDF fica guardado.
3. **Se o aceite precisa de validade jurídica.** A resposta muda o que a tela
   pode prometer no bloco de assinatura.
4. **Se a cobrança e o registro de pagamento são manuais.** Hoje o sistema
   registra o pagamento e não o provoca. Se ela quiser lembrete de vencimento,
   isso é uma decisão sobre notificação, não sobre cálculo.
5. **As quatro perguntas que faltam no diagnóstico** — a lacuna entre as 29
   transcritas e as 33 que o formulário tem, já declarada desde a Fase 2.6.
6. **Confirmar `npm run lint` e `npm run build` no Windows.** É a única coisa
   desta retomada que ficou sem verificação, pelo limite de tempo do shell. O
   `typecheck` passou aqui.
