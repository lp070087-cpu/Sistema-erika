# FASE ATUAL — VISUAL PRÓXIMO DO PRODUTO FINAL + CONTRATOS + CENTRAL DE PLANILHAS

Documento de estado da fase corrente do Sistema Érika Bruna.

Mesma regra das fases anteriores: **nada aqui pode afirmar mais do que foi
verificado.** Toda linha deste arquivo foi escrita depois de olhar o arquivo que
ela descreve, e o que não foi executado está dito como não executado.

Esta fase não recomeçou nada. As Fases 0, 1 e 2 permanecem como estavam: nenhum
arquivo foi reescrito, nenhuma migration foi criada, nenhum banco foi conectado.

> **Nota de leitura.** Este documento foi escrito em quatro passagens. As Seções 1
> a 6 descrevem o que a fase entregou antes da interrupção por erro de execução.
> A **Seção 7-A** descreve o refinamento concluído na primeira retomada — linguagem
> interna fora da tela, microinterações e responsividade. A **Seção 7-B** descreve
> o acabamento visual final: largura do sistema, contraste dos textos secundários,
> limpeza do Dashboard, desduplicação do aviso de demonstração e os ajustes de
> contêiner e de ponto de quebra. A **Seção 9** foi reescrita a cada retomada,
> porque o ambiente de verificação mudou.
>
> **Na quarta passagem — a fase funcional — duas seções foram reescritas, e não
> acrescentadas.** A **Seção 8** afirmava que nenhuma fórmula existia; com o motor
> de rendimento e o fator de correção medido, isso deixou de ser verdade, e agora
> ela separa o que passou a ser **calculado** (aritmética sobre peso e preço
> informados) do que continua **esperando resposta** (margem, CMV alvo, markup
> alvo, preço sugerido). A **Seção 9-A** é nova e registra as conferências da
> calculadora — inclusive as duas sabotagens que provaram que elas sabem falhar.
> A **Seção 9-B** registra a limpeza dos avisos do `eslint`, que deixou o projeto
> em zero erros e zero avisos, e o erro de tipo que essa limpeza quase introduziu.
> A Central de Planilhas ganhou uma prévia ligada ao mesmo código que escreve o
> arquivo, e o contexto de planilha passou a carregar as fichas técnicas.

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

**O que saiu do Dashboard depois — e por quê.** A tela ainda carregava elementos
que falavam do sistema para quem o construiu: a etiqueta e a faixa de
demonstração, o "Mapa do sistema" com os dezenove módulos e o estado de cada um,
o bloco "Como ler esta fase", os marcadores "No ar", "Em preparação" e "Em breve"
quando usados só como estado interno, e explicações de implementação. O critério
aplicado foi um só: *isto é linguagem de quem usa, ou de quem construiu?* Saiu
tudo que era o segundo caso. O que ficou — resumo, diagnósticos, clientes,
consultorias, tarefas, fichas, contratos, atenção, parcelas e vencimentos,
acompanhamentos, atividade recente e atalhos — está descrito em §7-B.3.

Nada de arquitetura ou rota foi apagado para esconder esses textos: o campo
`estado` continua em `navegacao.ts` decidindo o peso visual do item no menu.

---

## 6. O que permanece demonstrativo

Tudo o que é dado. Nenhum banco foi conectado.

Os clientes, consultorias, contratos, leads, fichas, ingredientes, processos,
acompanhamentos e tarefas continuam vivendo em `src/lib/dados/mock/`. O aviso de
demonstração aparece **uma vez**, no rodapé da casca — não mais repetido em cada
tela. O motivo da mudança está em §7-B.4.

**A divisão honesta na Central de Planilhas:** o arquivo é real, os dados dentro
dele são de demonstração. É uma combinação que confunde se não for dita, e está
dita — no rodapé da casca, que fecha dizendo que **as planilhas exportadas são
.xlsx de verdade gerados a partir deste cenário**. Era o ponto que só a faixa do
topo de `/planilhas` esclarecia; com a faixa fora, a ressalva passou para a frase
do rodapé, que agora distingue explicitamente o dado do arquivo.

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

## 7-B. O acabamento visual final

Esta é a terceira passagem pelo documento. As duas anteriores foram: a construção
das fases e a retomada que tirou a linguagem de obra do texto. Esta tratou de
**largura, contraste, densidade e o que ainda parecia bastidor**.

Nada de arquitetura foi tocado: nenhuma rota saiu, nenhum módulo foi
reconstruído, a identidade (creme, verde escuro, oliva, tipografia editorial,
sidebar) não foi redesenhada. As alterações são de token, de casca e de texto.

### 7-B.1 Largura — o container e a margem

O problema não era o tamanho do conteúdo, era o **teto** dele: `--largura-conteudo`
valia 1320px. Num monitor de 1920px isso deixava quase 350px vazios de cada lado,
e a sidebar já ocupa 252px à esquerda. O sistema parecia pequeno, flutuando no
meio da tela, enquanto as tabelas de ficha apertavam colunas com espaço sobrando
ao lado delas.

- `--largura-conteudo`: **1320px → 2000px**. É teto, não largura: em 1920 o
  container preenche o que existe depois da sidebar e das margens; a partir de
  ~2500px ele para de crescer e as margens viram a moldura da página. Sem teto
  nenhum, uma linha de texto em tela ultrawide passaria de 2500px — o mesmo
  defeito de antes, invertido.
- `--margem-conteudo`: token novo, `clamp(1rem, 1.2vw + 0.5rem, 2.75rem)`. Uma
  variável só, em vez de `px-4 sm:px-6 lg:px-8` repetido em cada casca.
- **A barra de topo passou a usar os mesmos dois tokens.** Ela tinha `px-4
  sm:px-6` fixos e a página abaixo usava `--margem-conteudo`; numa tela larga os
  dois desalinhavam, e o menu, o sino e o nome ficavam ~20px à esquerda da
  primeira palavra do título. Agora barra, conteúdo e rodapé leem o mesmo token
  e o mesmo teto — o alinhamento virou consequência de uma variável, não de três
  números combinados à mão.
- **Sem scroll horizontal global.** O `body` não ganhou overflow novo; o que
  cresceu foi o teto do container, e as tabelas continuam rolando dentro do
  próprio `overflow-x-auto`.

O teto de 2000px, porém, **não pode valer no papel**: uma folha A4 tem ~794px, e
um container de 2000px não encolhe sozinho dentro de um `article` de 820px — ele
divide o espaço com quem está ao lado e o texto vira uma coluna estreita no canto.
Por isso o `@media print` de `globals.css` neutraliza `--largura-conteudo` e
`--margem-conteudo`. A regressão foi encontrada antes de sair: o relatório
impresso continua saindo como o cliente o recebia.

### 7-B.2 Contraste — as duas tintas secundárias

Não era um texto específico, era leitura em bloco. Descrição de seção, rótulo de
campo, data, legenda de tabela e nota de rodapé usam as mesmas duas variáveis, e
todas puxavam para o claro demais sobre o creme. Numa tela com vinte dessas
linhas, o olho cansa antes do fim.

- `--tinta-suave`: **0.66 → 0.76** (≈5,3:1 → ≈7,4:1 contra `--superficie-solida`)
- `--tinta-fraca`: **0.42 → 0.58** (≈2,9:1 → ≈4,6:1)

A `fraca` era a que mais incomodava e é a que mais subiu: em 0.42 ela ficava
**abaixo de 4,5:1**, o mínimo para texto pequeno — rótulo de 11px em caixa alta
naquele tom não se lia, se adivinhava. As duas continuam distintas, com ~18
pontos de alfa entre elas: a hierarquia de três níveis permanece legível *como*
hierarquia. Escurecer a `fraca` até o nível da `suave` teria resolvido o
contraste e apagado a hierarquia — que é o outro jeito de uma tela ficar ilegível.

**As linhas não subiram.** `--linha` e `--linha-forte` delimitam área e não
carregam texto; aumentá-las junto só deixaria a tela mais gradeada. Nenhuma cor
da paleta da marca foi alterada.

### 7-B.3 O Dashboard, e o que saiu de dentro dele

O critério foi um só: **isto é linguagem de quem usa, ou de quem construiu?**
Saiu tudo que era o segundo caso.

Removidos da tela: a etiqueta `Demonstração`, a faixa de demonstração, o "Mapa do
sistema" com os 19 módulos e o estado de cada um, o bloco "Como ler esta fase", e
os marcadores de status interno "No ar", "Em preparação" e "Em breve" quando
usados só como estado de obra. Também saíram as explicações de implementação.

**Nada de arquitetura ou rota foi apagado para esconder esses textos.** O campo
`estado` continua em `navegacao.ts` decidindo o peso visual do item; o que saiu
foi a frase escrita na tela, não o dado.

Ficou, e continua organizado: resumo, diagnósticos, clientes, consultorias,
tarefas, fichas, contratos, itens que precisam de atenção, parcelas e
vencimentos, acompanhamentos, atividade recente e atalhos.

Duas coisas que merecem registro por serem decisões, não faxina:

- **A ressalva sobre "Variação de custo no período" ficou, em prosa.** O campo
  depende de definir o que entra na conta do custo, e por isso fica **fora da
  soma em vez de aparecer como zero**. Zero seria um número errado com aparência
  de certo — a mesma regra que o resto do sistema segue desde a Fase 2.
- **Seis descrições de seção foram encurtadas.** Elas eram justificativas
  ("Nenhuma delas é nota, média ou projeção — são coisas que se podem contar") e
  cabem no comentário do código, não ao lado de um número que a consultora já
  entende. Também foi trocado o atalho "1 modelo disponível" por "Exportar em
  Excel": o primeiro descreve o catálogo, o segundo diz o que o clique faz.

### 7-B.4 O aviso de demonstração, dito uma vez

Vinte e duas telas traziam a própria faixa dizendo, com outras palavras, que os
dados eram inventados. Lida no dia a dia, a repetição não informa — **ela apaga o
próprio aviso**: quem vê a mesma tarja na primeira e na vigésima tela para de ler
na terceira.

A informação foi concentrada numa linha discreta no rodapé da casca, em
`shell.tsx`. A honestidade não foi reduzida, foi **desduplicada**. É o lugar onde
ela continua verdadeira (clientes, contratos, fichas e diagnósticos são cenário
de exemplo; as planilhas, não — são .xlsx de verdade gerados a partir do cenário)
e continua encontrável por quem for avaliar o sistema com um cliente do lado.

Onde a remoção teria apagado informação real, ela não foi feita: as telas
mantêm os avisos do tipo "nada é gravado nesta sessão" e "volta ao estado inicial
ao recarregar". Esses são sobre **perda de dado**, não sobre a fase de construção
do programa.

`components/ui/faixa-demonstracao.tsx` ficou **sem nenhum consumidor** e **não foi
apagado**, pela mesma razão do `AvisoMetodologia` em 7-A.4: apagar componente
compartilhado é a faxina que quebra um arquivo esquecido, e o custo de mantê-lo é
uma função de poucas linhas.

### 7-B.5 Contêineres que escondiam o próprio botão

Dois contêineres flex de rolagem não tinham `min-h-0`. Sem ele, um filho flex se
recusa a encolher abaixo do próprio conteúdo — e o resultado não é um detalhe de
layout: **é o botão de salvar saindo da tela**.

- `components/ui/gaveta.tsx` — o corpo da gaveta: sem `min-h-0`, a gaveta de
  ficha empurrava o rodapé com a ação primária para fora do quadro.
- `components/layout/barra-lateral.tsx` — o menu de dezessete itens empurrava a
  assinatura do rodapé para fora numa janela de altura média.

É a mesma correção nos dois lugares, e é o tipo de defeito que não aparece em
tela grande nem em tela pequena: aparece só na altura intermediária.

### 7-B.6 A zona morta entre 1024px e 1280px

A tabela de composição da ficha tem **onze colunas** e só virava cartões a partir
de `xl` (1280px). Entre 1024px e 1280px — notebook de 13", justamente o modo de
trabalho descrito na Fase 0 — ela era uma tabela de onze colunas apertada numa
tela que não comporta. O ponto de quebra passou de `xl` para `lg`, que é o
breakpoint que o resto do sistema já usa. Três ocorrências.

### 7-B.7 Linguagem de bastidor, no texto que sobrou

Uma varredura de vocabulário trocou termos que descrevem **a construção do
programa** por termos que descrevem **o que a pessoa faz**, em 22 arquivos.
Exemplos: "sessão de trabalho" em vez de termos de implementação no lugar de
`QUEM`, e textos de rodapé que falavam de "modo de demonstração" reescritos para
o que a tela faz e não faz hoje.

Onde não havia o que trocar, o texto saiu — não foi substituído por sinônimo.

### 7-B.8 Auditoria de componentes, antes de mexer

O acabamento de cards foi conferido primeiro e refeito depois, e não o contrário:
os cards do sistema já compartilhavam **um raio, um token de borda, uma escala de
padding e um gap**. Não havia o que redesenhar.

A única intervenção foi um `min-w-0` no título de contrato do Dashboard que
trunca. Sem ele, um filho flex com `truncate` não encolhe abaixo do próprio
conteúdo, porque `min-width: auto` é o padrão — e o título empurrava a coluna ao
lado para fora. Uma linha de correção em vez de uma reforma.

---

## 8. Regras gastronômicas — o que passou a ser calculado, e o que continua esperando

> **Esta seção foi reescrita.** Ela dizia, até a fase funcional, que "nenhuma
> fórmula foi implementada" e que não existia "fator de correção em lugar nenhum
> do código". Isso deixou de ser verdade, e uma seção de limitações que
> subestima o que o sistema faz é tão perigosa quanto uma que exagera: ela faz
> alguém reimplementar o que já existe, ou duvidar de um número correto.

### 8-A. O que É calculado, e por que isto não é metodologia

Estas contas existem agora, e cada uma é aritmética sobre valores que a própria
Érika informou — não há tabela, nem valor de partida, nem alvo:

| Conta | Fórmula | Onde |
| --- | --- | --- |
| Preço do quilo comprado | `valorTotal ÷ quantidade` | `custos.ts` |
| Perda na limpeza (peso e %) | `bruto − limpo`; `÷ bruto × 100` | `custos.ts` |
| Rendimento da limpeza | `limpo ÷ bruto × 100` | `custos.ts` |
| Perda no preparo (peso e %) | `limpo − preparado`; `÷ limpo × 100` | `custos.ts` |
| Rendimento do preparo | `preparado ÷ limpo × 100` | `custos.ts` |
| Rendimento total | `peso final ÷ bruto × 100` | `custos.ts` |
| **Fator de correção medido** | `bruto ÷ limpo` | `rendimento.ts` |
| Custo do quilo limpo | `preço do quilo × fator` | `custos.ts` |
| **Custo efetivo final** | `valorTotal ÷ peso final` | `custos.ts` |
| Custo de uma quantidade da ficha | preço unitário × quantidade | `custos.ts` |

A distinção que sustenta a lista: **somar, subtrair, dividir dois pesos medidos e
multiplicar por um preço é aritmética.** O que continua **não** existindo é o
número que exigiria uma decisão profissional dela — e esses são os da seção 8-B.

Duas regras de método foram respeitadas deliberadamente:

**O ganho de peso não é erro.** Arroz, massa e legume seco ganham peso ao
cozinhar. Um peso final maior que o inicial aparece como "Ganho", com o valor em
módulo e sem sinal de menos — e o rendimento passa de 100%. O sistema não recusa
a medição nem a corrige.

**Ausência não vira zero.** Sem pesagem, o rendimento é traço, não "0%". Sem
compra declarada, o rendimento sai e o custo não. Unidade incompatível (kg com L)
para o cálculo e diz por quê, em vez de produzir um número que mistura massa e
volume.

### 8-B. O que continua esperando resposta

| Ponto | O que falta | Por que a aritmética não resolve |
| --- | --- | --- |
| 4 | O que entra no custo de um prato | Quais itens contam — e se algum não conta — é decisão dela |
| 6 | Índice de cocção como **índice de referência** | O medido já sai das pesagens; um valor de tabela seria metodologia |
| 7 | Critério de preço e markup: por prato, por praça ou por casa | Define a que agrupamento a margem se aplica |
| 9 | Com quantas casas arredondar **na apresentação** | O sistema arredonda só ao exibir; a regra de exibição é dela |
| 5 | Se a ficha traz custo por porção, por quilo, ou os dois | Muda a coluna da planilha |
| 11 | Peso de cada etapa da consultoria para medir andamento | Não é conta de cozinha |
| 19 | Idem ao 5, no nível do relatório | Idem |

**E as três que nunca foram propostas como cálculo e continuam fora:**

- **Margem de segurança** — não existe. Não há 5% em lugar nenhum do código, nem
  como padrão, nem como sugestão, nem como campo pré-preenchido.
- **CMV alvo, markup alvo e margem alvo** — os tipos aceitam os três como
  parâmetro informado, e nenhum traz valor de partida. Sem ela informar, ficam
  ausentes — e ausente é o estado normal, não ficha incompleta.
- **Preço de venda sugerido** — não existe. O dado é `precoVenda` **declarado**:
  o sistema registra o preço que ela decidiu, e calcula CMV e markup **a partir
  dele**. Nunca o contrário.

Enquanto as respostas de 8-B não chegarem, os cards correspondentes ficam
"aguardando definição" e a planilha de custos e precificação diz, no motivo do
card, que é a sua regra de margem que falta — e não o cálculo. Nenhum número de
aparência correta foi colocado no lugar.

---

## 9. Verificação

Executado neste ambiente, em cada retomada:

- `tsc --noEmit` — **exit 0, sem erros**, contra o `node_modules` real (com o
  `exceljs` resolvido, não mais a checagem com stub). Rodado ao fim de cada bloco
  de alteração, inclusive depois do último arquivo mexido no acabamento visual.
- `npm run lint` — **exit 0, 0 erros, 0 avisos** (verificado na fase funcional).
  Na retomada anterior sem cache o comando estourava o limite de tempo do shell e
  devolvia código 124 (tempo esgotado), que **não é falha de lint**; nesta rodada
  a execução completa do projeto coube dentro do limite. Então restavam 7 avisos
  `no-unused-vars`: 5 em código anterior (`fichas/[id]/detalhe.tsx` 1,
  `fichas/nova.tsx` 2, `painel-custo.tsx` 1, `mock/operacao.ts` 1) e 1
  `jsx-a11y/no-autofocus` com diretiva órfã em `edicao.tsx`. **Os seis foram
  resolvidos, porque esta fase abriu todos aqueles arquivos** — ver §9-B.
- Os avisos `no-unused-vars` **causados por esta fase** foram corrigidos na
  origem: a remoção das faixas deixou `Etiqueta` importada sem uso em quatro
  telas (`acompanhamentos`, `contratos/novo`, `fichas`, `processos`) e deixou
  `cn` importada sem uso em `shell.tsx`. Os cinco imports saíram.
- Confirmação por busca, antes de apagar arquivo: nenhuma referência no projeto a
  `src/app/(sistema)/planilhas/modelos.ts` nem a
  `src/app/(sistema)/contratos/novo.tsx`.
- Confirmação por busca, depois de tirar a faixa: **zero** ocorrências de
  `FaixaDemonstracao` fora do próprio arquivo do componente, e **zero** etiquetas
  `Demonstração` restantes em tela.

**Validado no Windows pelo responsável, antes da interrupção:**

- `npm run lint` — **passou**
- `npm run typecheck` — **passou**
- `npm run build` (produção) — **passou**, Next.js 15.5.25, Prisma 6.19.3

`npm run build` — **executado, exit 1**, e o motivo não está no código:

1. `prisma generate` (o primeiro passo do script) devolve **403 Forbidden** ao
   buscar o checksum do schema-engine em `binaries.prisma.sh`. É a saída de rede
   deste ambiente bloqueando o domínio, não uma falha de schema.
2. Rodando `next build` direto, o passo seguinte baixa o binário nativo do SWC
   para Linux — o `node_modules` deste projeto carrega só o
   `@next/swc-win32-x64-msvc` — e o download morre com `EAI_AGAIN`,
   `getaddrinfo registry.npmjs.org`. **Este sandbox não tem saída para o registro
   do npm.**

Ou seja: o build não chegou a compilar nada. Não houve erro de tipo, de módulo
ou de JSX para reportar — a execução parou antes. **É limitação de ambiente, não
resultado de código**, e o build **continua precisando ser confirmado no
Windows**, como nas fases anteriores.

### 9-A. As conferências da calculadora de rendimento

O briefing desta fase proibiu instalar um framework de teste só para esta
retomada. Em vez de um framework, existe um arquivo: **`scripts/conferir-rendimento.mjs`**,
rodado por `npm run conferir:rendimento`, **sem dependência nova**.

Ele compila os sete módulos puros do cálculo (`custos`, `numeros`, `rendimento`,
`tipos-operacao`, `perguntas`, `indicadores-comerciais`, `tipos`) com o `tsc` que
já está no projeto, num diretório **fora** do projeto, e roda as conferências
contra o JavaScript gerado. Nada é escrito em `src/` nem em `dist/`.

Resultado: **42/42 conferências passaram** (exit 0).

O que elas cobrem — e todas as conferências usam os valores que o briefing
declarou como esperados:

| Caso | Conferido |
| --- | --- |
| Perda nas duas etapas (5 kg, R$ 50 → 4,5 → 4,0) | preço R$ 10,00/kg · perda 0,500 kg (10,0%) · limpeza 90,0% · fator 1,1111 · preparo 88,9% · total 80,0% · **custo efetivo R$ 12,50/kg** |
| **Ganho de peso** (1 kg seco → 1,2 kg cozido) | total 120,0% · perda total negativa · custo R$ 6,67/kg · rótulo vira "Ganho total" · valor sem sinal de menos |
| Ausência total | nenhuma linha com NaN/Infinity/undefined · rendimento nulo · todas as linhas com traço |
| Peso zero | zero etapas medidas · nenhuma divisão por zero |
| Unidades incompatíveis (kg × L) | sinaliza · não inventa rendimento |
| Compra inválida | os quatro códigos de recusa, com frase escrita para cada |
| Balança em g, compra em kg | 4500 g → 4,500 kg · mesmo rendimento |

**A conferência foi provada capaz de falhar.** Um teste que nunca falhou não é
prova de nada, e este projeto já foi enganado por instrumento antes. Duas
sabotagens foram introduzidas de propósito no código de produção e desfeitas em
seguida:

1. `valorTotal / quantidade` trocado por `valorTotal * quantidade` → **3 falhas**:
   preço saiu 250,00 em vez de 10,00 e o custo efetivo 312,50 em vez de 12,50.
2. Detecção de ganho forçada para `false` → **2 falhas**: o rótulo saiu "Perda
   total" em vez de "Ganho total".

Com o código restaurado, **42/42 voltaram a passar**. Os três arquivos envolvidos
foram conferidos byte a byte depois do teste, por `diff`, contra as cópias
originais — **idênticos**. Nenhum resíduo da sabotagem ficou no projeto.

- `tsc --noEmit` — **exit 0**, ao fim de cada bloco de alteração.
- `eslint` (nos diretórios `planilhas`/`lib/planilhas` e no script novo) —
  **exit 0, 0 erros**.

> **Aviso pré-existente, não desta fase:** `src/app/(sistema)/fichas/[id]/detalhe.tsx`
> acusava `'indice' is defined but never used`. Era anterior a esta retomada, e na
> retomada anterior ficou de pé — corrigir aviso não é motivo para mexer em arquivo
> que a fase não precisou abrir. Ficou resolvido em §9-B, quando a fase funcional
> abriu esse arquivo de qualquer maneira.

### 9-B. A limpeza dos avisos — e o que ela quase estragou

Os seis avisos que sobravam do `eslint` foram resolvidos nesta fase. A regra da
fase anterior continua valendo ("não faça grandes refatorações só para corrigir
avisos"), e por isso nenhum deles virou refatoração: cada um foi uma linha, num
arquivo que a fase funcional **já havia aberto**.

| Arquivo | Aviso | O que era de fato |
| --- | --- | --- |
| `components/ui/edicao.tsx` | diretiva `eslint-disable` órfã | O `autoFocus` é deliberado e o ESLint **concorda** — a diretiva suprimia um aviso que a config do projeto não emite. A diretiva saiu e ficou um comentário explicando o foco. |
| `components/ui/painel-custo.tsx` | `'percentual' is defined but never used` | Função **morta**: uma linha de horário e nada mais. Removida. |
| `app/(sistema)/fichas/nova.tsx` | `'Dado'`, `'ListaDados'` | Import sem uso. Removido. |
| `lib/dados/mock/operacao.ts` | `'l' is assigned a value but never used` | Atalho de peso para litros que ninguém chamou. Removido. |
| `app/(sistema)/fichas/[id]/detalhe.tsx` | `'indice' is defined but never used` | **O caso que engana.** |

O último merece registro, porque quase virou defeito. O arquivo tem **dois**
componentes que recebem uma prop chamada `indice`: `Composicao` e
`AdicionarIngrediente`. No primeiro ela é código morto — sobrou de uma versão em
que a linha resolvia o ingrediente pelo mapa, e hoje isso já vem pronto em
`resolvidos`. No segundo ela é **viva**: a linha 1670 resolve o ingrediente
escolhido (`indice.get(escolhidoId)`), e sem ela a gaveta mostraria o id em vez
do nome.

O aviso aponta para uma posição, e a posição caiu no primeiro. Removê-la dos
**dois** é o atalho óbvio — e o `tsc` pegou na hora, com
`Cannot find name 'indice'` na linha 1670. A prop viva foi restaurada com um
comentário dizendo por que existe, e a morta saiu. **É o segundo motivo pelo qual
o `typecheck` roda depois de cada correção de aviso, e não só no fim.**

Resultado: `eslint .` — **exit 0, 0 erros, 0 avisos**; `tsc --noEmit` — **exit 0**.

Nenhuma migration, nenhum `git`, nenhum push e nenhum deploy foram executados.
Nenhuma pasta fora de `/sistema-erika` foi alterada.

---

## 10. Próximos pontos que dependem dela

1. **As regras de método de §8-B** (pontos 4, 5, 6, 7, 9, 11 e 19). É o que
   destrava os quatro modelos de planilha que faltam, o bloco de resultado da
   consultoria e o módulo de precificação inteiro. Note que o cálculo do custo já
   existe — o que falta é a regra de margem, que é dela.
2. **Onde o arquivo do contrato vai morar.** A área de documento existe e o
   estado do aceite também; o que falta é a decisão de onde o PDF fica guardado.
3. **Se o aceite precisa de validade jurídica.** A resposta muda o que a tela
   pode prometer no bloco de assinatura.
4. **Se a cobrança e o registro de pagamento são manuais.** Hoje o sistema
   registra o pagamento e não o provoca. Se ela quiser lembrete de vencimento,
   isso é uma decisão sobre notificação, não sobre cálculo.
5. **As quatro perguntas que faltam no diagnóstico** — a lacuna entre as 29
   transcritas e as 33 que o formulário tem, já declarada desde a Fase 2.6.
6. **Confirmar `npm run build` no Windows.** É a única coisa que ficou sem
   verificação. O motivo é ambiente — este sandbox não alcança
   `binaries.prisma.sh` nem `registry.npmjs.org` —, e não código. O `typecheck` e
   o `lint` passaram aqui (ver §9).

### 10-A. O caminho exato para ligar o Neon

A ordem abaixo é a ordem das dependências, e nenhum passo pode ser pulado: cada um
é pré-requisito verificável do seguinte.

1. **Criar o banco no Neon** e obter duas URLs — a com *pooling* (porta 6543, para
   o runtime) e a direta (porta 5432, para migrations).
2. **`DATABASE_URL` e `DIRECT_URL` no `.env.local`** — hoje o arquivo tem
   exatamente três chaves (`AUTH_SECRET`, `AUTH_EMAIL`, `AUTH_PASSWORD_HASH`) e
   nenhuma delas é de banco. Este passo é dela: não há credencial a inventar.
3. **Escrever os modelos no `prisma/schema.prisma`** para as entidades que a
   operação já usa (`Cliente`, `Consultoria`, `Tarefa`, `Acompanhamento`, `Ficha`,
   `ItemFicha`, `Ingrediente`, `IngredienteDoCliente`, `PrecoIngrediente`,
   `Compra`, `Transformacao`, `Processo`, `Contrato`, `ParcelaContrato`). Hoje o
   schema tem **só os modelos de autenticação** (`User`, `Account`, `Session`,
   `VerificationToken`, `AuditLog`, `AppSetting`) e **não existe a pasta
   `prisma/migrations/`**.
4. **Gerar a migration de forma ADITIVA** — `prisma migrate dev --create-only`,
   revisar o SQL e só então aplicar. Nunca `migrate reset`, nunca `db push`
   destrutivo: o schema de autenticação já pode estar em uso.
5. **Escrever `repositorioOperacaoPrisma`** implementando a interface
   `RepositorioOperacao` que já existe em `src/lib/dados/repositorio-operacao.ts`.
   Nenhuma tela precisa mudar: todas importam `obterRepositorioOperacao()`.
6. **Trocar uma linha** em `src/lib/dados/index.ts` — a que hoje devolve
   `repositorioOperacaoMock` — por uma escolha condicional, do mesmo jeito que
   `persistenciaConfigurada()` já está escrita para a entrada.
7. **Migrar a escrita.** Hoje o que ela edita em tela (preço, histórico de preço,
   cadastro de insumo, compra, transformação, cabeçalho de ficha, itens de ficha,
   cadastro de cliente) vive em `src/lib/dados/demonstracao.ts`, que é
   **memória de módulo**: some ao recarregar. É essa camada que precisa ganhar
   implementação de banco, e é aí que entra a interface
   `RepositorioOperacaoEscrita`, já declarada ao lado do repositório com os sete
   métodos que ela exige.

**Enquanto os sete passos não existirem juntos, ligar o banco produziria telas
vazias** — que é pior do que telas que dizem, em voz alta, que o dado vive nesta
sessão. É exatamente o motivo pelo qual o `demonstracao.ts` e as telas declaram
isso: não há promessa falsa a desfazer quando a ligação acontecer.

A persistência real segue sendo o passo que falta, e o parágrafo que aqui estava
("nenhuma fórmula de ... foi implementada") **deixou de ser verdade na fase
funcional** — ver §8-A. O que ele queria dizer continua valendo para a metade de
método: **CMV alvo, markup alvo, margem e preço sugerido continuam não existindo
em lugar nenhum do código**, porque dependem dos pontos 4 a 7 e 19. O que existe
agora é a aritmética sobre o que ela mede, que é a outra metade.
