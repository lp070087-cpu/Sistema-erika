# FASE 2.5 — EXPERIÊNCIA DEMONSTRÁVEL E OPERAÇÃO DA CONSULTORIA

Documento de estado da Fase 2.5 do Sistema Érika Bruna.

Regra deste arquivo: **nada aqui pode afirmar mais do que foi verificado.**

Esta fase não teve como objetivo o motor de cálculo. O objetivo foi transformar
o sistema numa **demonstração navegável da operação inteira** — fluxo,
organização, navegação e apresentação do produto. A régua de sucesso é: dá para
sentar com a Érika e narrar um atendimento do começo ao fim, na tela?

| Selo | Significado |
| --- | --- |
| **FUNCIONAL** | A tela funciona. Faz o que promete, com dados inventados mas coerentes. |
| **DEMONSTRAÇÃO-MOCK** | A tela funciona de verdade, mas lê dados inventados. Nenhum dado real. |
| **PARCIAL** | Faz parte do que promete; o que falta está dito dentro da própria tela. |
| **PREPARADO PARA BACKEND** | O contrato e a montagem do dado existem. Falta a chamada que grava. |
| **PENDENTE** | Depende de decisão da Seção 17 ou de fase posterior. |

---

## 1. O que esta fase se recusou a fazer

A §RL do briefing foi explícita, e ela governou cada decisão de tela:

**Não inventar fórmula.** Os pontos 4 (índice de cocção), 5 (fator de correção
por contexto), 6 (fator de correção duplicado), 7 (CMV alvo ou markup), 9
(origem do volume do cardápio), 11 (peso das respostas) e 19 (arredondamento e
precisão) **continuam abertos**. Nenhum deles foi implementado, nem por
aproximação, nem "só para a demonstração ficar mais bonita".

**Não inventar score.** O diagnóstico não produz nota nem veredito. Ele mostra
o que foi respondido e conta o que dá para contar.

**Não inventar resultado financeiro.** Nenhuma tela do sistema exibe CMV,
margem, lucro, economia, preço sugerido ou percentual de ganho — nem em
relatório, nem em dashboard, nem em ficha.

**Como as áreas bloqueadas aparecem.** Onde o cálculo dependeria dessas
decisões, a tela diz uma destas três frases, e nada mais:

- **Em preparação** — o bloco existe no projeto, falta a decisão.
- **Dados necessários** — o número depende de um dado que ninguém informou.
- **Cálculo disponível após configuração da metodologia** — texto padrão de
  `AvisoMetodologia`, usado no detalhe da ficha técnica.

Uma lacuna declarada é informação. Um número inventado é a mesma coisa com
aparência de fato — e é o único erro desta fase que seria irreversível, porque
a consultora levaria o número a sério na frente do cliente.

---

## 2. O fluxo que a demonstração narra

A §1 pediu que o sistema demonstrasse o fluxo completo. Ele existe, e é
narrável nesta ordem:

```
DIAGNÓSTICO → LEAD → ANÁLISE → CONVERSÃO → CLIENTE → CONSULTORIA
     → PLANO DE AÇÃO → PROCESSOS → FICHAS TÉCNICAS
     → ACOMPANHAMENTO → RESULTADOS → RELATÓRIO
```

Cada seta tem uma tela e um dado que a liga à seguinte:

| Etapa | Onde acontece | O que liga à próxima |
| --- | --- | --- |
| Diagnóstico | `/diagnostico` (público) | O formulário respondido |
| Lead | `/leads/[id]` | Respostas do diagnóstico, contato |
| Análise | `/diagnosticos/[id]` | Blocos lidos, sinais contados |
| Conversão | `/leads/[id]` → botão Converter | `cliente.leadOrigemId` |
| Cliente | `/clientes/[id]` | `consultoria.clienteId` |
| Consultoria | `/consultorias/[id]` | `acoes.consultoriaId` |
| Plano de ação | Aba dentro da consultoria | `acao.clienteId` |
| Processos | `/processos/[id]` | `processo.clienteId` |
| Fichas técnicas | `/fichas/[id]` | `ficha.clienteId`, `item.ingredienteId` |
| Acompanhamento | `/acompanhamentos` | `acompanhamento.clienteId` |
| Resultados | `/relatorios` | `documento.clienteId` |
| Relatório | `/relatorios` | `documento.consultoriaId` |

O dado é **relacionado de verdade**: o `clienteId` de uma ficha aponta para um
cliente que existe, cuja consultoria existe, cujas ações existem. Não há lista
solta. Isso foi verificação explícita — ver §12.

---

## 3. O cenário de demonstração

A §29 pediu **um** cenário fictício completo e consistente. Ele está em
`src/lib/dados/mock/`, é identificado como DEMONSTRAÇÃO em todas as telas, e
tem esta forma:

| Conjunto | Quantidade | Arquivo |
| --- | --- | --- |
| Leads | 5 | `dados.ts` |
| Diagnósticos respondidos | 5 | `dados.ts` |
| Observações internas | 7 | `dados.ts` |
| Clientes | 5 | `operacao.ts` |
| Consultorias | 5 | `operacao.ts` |
| Ações de plano | 35 | `operacao.ts` |
| Tarefas | 14 | `operacao.ts` |
| Acompanhamentos | 11 | `operacao.ts` |
| Processos | 4 | `operacao.ts` |
| Ingredientes | 24 | `operacao.ts` |
| Fichas técnicas | 11 | `operacao.ts` |
| Documentos | 10 | `operacao.ts` |
| Eventos de histórico | 40 | `operacao.ts` |
| Compromissos | 4 | `operacao.ts` |

### As cinco empresas

| Cliente | Responsável | Tipo | Modalidade | Situação |
| --- | --- | --- | --- | --- |
| Empório Verde — Cozinha Natural | Cláudia Nogueira | Buffet e à la carte | Mista | Ativo |
| Sabor da Serra | Rodrigo Bastos | Buffet | Presencial | Ativo |
| Doce Ponto Confeitaria | Simone Alves | Outro | Online | Ativo |
| Cantina Bella Massa | Marcelo Tavares | À la carte | Presencial | Em implantação |
| Quintal da Maria | Maria Helena Ribeiro | À la carte | Online | Pausado |

### Por que o cenário é assim, e não todo mundo feliz

O valor da demonstração está em mostrar o sistema **sob tensão**, não em
mostrar tudo concluído. Por isso o cenário tem:

- uma consultoria **AGUARDANDO_CLIENTE** (Sabor da Serra) — para a tela de
  atenção ter o que mostrar;
- uma **EM_ACOMPANHAMENTO** (Doce Ponto) — para a etapa final existir;
- uma **CONCLUIDA** (Quintal da Maria) — para a jornada completa ser visível;
- uma em **EM_IMPLANTACAO** (Bella Massa) — para o cliente em obra;
- um cliente **PAUSADO** (Quintal da Maria) — para a carteira não ser uniforme;
- fichas em três situações (COMPLETA, AGUARDANDO_DADOS, EM_REVISAO);
- tarefas atrasadas, de hoje e sem prazo;
- ingredientes com e **sem** preço — porque o sistema precisa saber mostrar
  ausência sem inventar zero.

### Os dados são comprovadamente fictícios

Verificado por varredura, não por confiança:

- **E-mails:** todos os 6 terminam em `.exemplo`
  (`contato@emporioverde.exemplo`, `fernando@cozinhadapraca.exemplo`, …).
- **Telefones:** todos na faixa `(51) 99000-000X` e `(54) 99000-0003`.
- **CNPJ/CPF:** nenhuma ocorrência em toda a camada de dados.
- **Nome "Érika Bruna":** aparece apenas como **autora** no campo `responsavel`
  de ações e no `autor` de observações — ou seja, como quem assina o trabalho.
  Não há dado pessoal dela (endereço, documento, telefone, e-mail).

---

## 4. Rotas construídas nesta fase

### Públicas — sem sessão

| Rota | O que é | Selo |
| --- | --- | --- |
| `/diagnostico` | Formulário do cliente. **Não tocado nesta fase** (§32). | **DEMONSTRAÇÃO-MOCK** |
| `/entrar` | Login. **Aprovado pelo usuário. Não tocado** (§31). | **FUNCIONAL** |

### Autenticadas — a operação

| Rota | O que é | Selo |
| --- | --- | --- |
| `/` | Painel em duas camadas: atenção, vencimentos, acompanhamentos, consultorias, atividade, atalhos. | **DEMONSTRAÇÃO-MOCK** |
| `/leads` · `/leads/[id]` | Fila e detalhe, com conversão em cliente. | **DEMONSTRAÇÃO-MOCK** + **PREPARADO PARA BACKEND** |
| `/diagnosticos` · `/diagnosticos/[id]` | Lista e leitura por blocos. | **DEMONSTRAÇÃO-MOCK** |
| `/clientes` | Carteira: busca, filtros, situação, tipo, modalidade, início, última atividade. | **DEMONSTRAÇÃO-MOCK** |
| `/clientes/[id]` | Visão 360° em **8 abas**. | **DEMONSTRAÇÃO-MOCK** |
| `/consultorias` | Listagem com status, etapa atual, último acompanhamento e próxima ação. | **FUNCIONAL** |
| `/consultorias/[id]` | Jornada + plano de ação interativo. | **FUNCIONAL** + **PREPARADO PARA BACKEND** |
| `/tarefas` | Quatro gavetas: hoje, atrasadas, próximas, concluídas. | **FUNCIONAL** |
| `/processos` · `/processos/[id]` | Praça, turno, responsável, pratos, tempos e sequência de finalização. | **DEMONSTRAÇÃO-MOCK** |
| `/fichas` · `/fichas/[id]` | Biblioteca e detalhe — **sem** a coluna de custo. | **PARCIAL** |
| `/ingredientes` · `/ingredientes/[id]` | Biblioteca e histórico de preço em linha do tempo. | **PARCIAL** |
| `/acompanhamentos` | Lista, filtros e registro local. | **PARCIAL** |
| `/relatorios` | Prévia: documentos existentes + o que depende de metodologia. | **PARCIAL** |
| `/configuracoes` | Da Fase 1. | **FUNCIONAL** |
| `/equipe` `/cardapios` `/precificacao` `/biblioteca` | Escopo declarado, sem conteúdo. | **PENDENTE** |

---

## 5. As oito abas do cliente (§3)

`/clientes/[id]` tem cabeçalho fixo com seis campos — **Empresa, Responsável,
Tipo de negócio, Modalidade, Situação, Início** — mais cidade, porte e equipe
declarada. Nenhum deles é cálculo.

A §3 proibiu páginas gigantes. Oito seções empilhadas dariam uma página de dois
metros, então elas viraram abas:

**VISÃO GERAL** · **DIAGNÓSTICO** · **CONSULTORIA** · **FICHAS TÉCNICAS** ·
**PROCESSOS** · **ACOMPANHAMENTOS** · **DOCUMENTOS** · **HISTÓRICO**

A aba atual vive na URL (`?aba=fichas`), não em estado de componente — o link é
compartilhável e o botão voltar do navegador funciona.

A VISÃO GERAL traz, nesta ordem: *Precisa de atenção* → *Onde está o trabalho*
(a jornada das sete etapas) → *Plano de ação em aberto* → *Atividade recente*.

**O que ela não tem, de propósito:** nenhum indicador de saúde, nenhum
percentual de conclusão, nenhum "risco alto/médio/baixo". Somar etapas de
naturezas diferentes exigiria peso (ponto 11); classificar risco exigiria uma
regra que a Érika não escreveu.

### Uma régua só para "precisa de atenção"

O painel e a aba do cliente montavam, cada um, a própria lista de atenção — com
critérios diferentes. O resultado era um item aparecer num lugar e não no
outro, para a mesma palavra. Os dois passaram a chamar a **mesma** função pura
(`derivarAtencao`); a aba do cliente deriva tudo e depois descarta o que é de
outro cliente.

---

## 6. A conversão lead → cliente (§5)

O botão **Converter em cliente** vive em `/leads/[id]`. Abre uma gaveta com:

1. o resumo do lead (empresa, responsável, contato, origem);
2. **o que será aproveitado** — os campos que virariam cadastro;
3. o botão de confirmar.

A confirmação é **marcada como demonstração** e diz, com estas palavras, que
nada foi gravado. Não há persistência falsa, não há "salvo com sucesso".

Isso é a §5 aplicada ao pé da letra: *"não fingir que salvou no banco"*. Um
aviso que promete gravação e não grava é pior do que não ter botão — a
consultora fecharia a tela achando que o cliente existia.

---

## 7. Consultorias: jornada e plano de ação (§7, §8)

`/consultorias/[id]` mostra as sete etapas do método, cada uma com seu estado e
uma nota curta — **DIAGNÓSTICO ✓ recebido**, **ANÁLISE ✓ realizada**, **PLANO DE
AÇÃO em andamento**, **FICHAS TÉCNICAS 3 de 12**, **PROCESSOS 2 mapeados**,
**ACOMPANHAMENTO próximo previsto**, **RESULTADO aguardando dados**.

Não há percentual geral da jornada. Os estados se contam, as naturezas não se
somam.

O **plano de ação** é a parte mais interativa da fase: dá para adicionar,
editar, mudar status e concluir uma ação. Os campos são Título, Descrição,
Responsável, Prioridade, Prazo e Observação; os status são A FAZER, EM
ANDAMENTO, AGUARDANDO CLIENTE e CONCLUÍDO.

**Onde isso grava:** em lugar nenhum, e a tela diz isso. O estado vive na
memória do componente; ao recarregar, tudo volta ao original. A arquitetura
está separada para a persistência futura: existe um contrato
(`RepositorioOperacao`), o botão chama uma função, e trocar a função por uma
chamada ao banco não muda a tela.

**O status da consultoria não é automático.** A §6 proibiu inventar regra de
mudança de status. Ele é o que está declarado no dado; a tela não promove
ninguém de EM_ANDAMENTO para CONCLUÍDA por conta própria.

---

## 8. O que é interativo de verdade, e o que a tela promete

Cinco telas aceitam interação real. Todas usam `useState` local e **nenhuma
usa `localStorage`** — a §30 proibiu explicitamente o armazenamento do navegador
como substituto improvisado de banco.

| Onde | O que faz | O que a tela avisa |
| --- | --- | --- |
| `/consultorias/[id]` | Adiciona e conclui ações do plano | "na demonstração. Ao recarregar, volta ao estado original." |
| `/tarefas` | Conclui, reabre e cria tarefas | idem |
| `/acompanhamentos` | Registra um acompanhamento | "o registro desaparece ao recarregar, e isso é esperado" |
| Sino de notificações | Marca como lida | "o sistema não envia e-mail, WhatsApp nem notificação no celular" |
| Conversão de lead | Confirma a conversão | "nada foi gravado em banco" |

A mesma promessa é escrita do mesmo jeito porque ela vem de componentes, não de
texto copiado: `AvisoInteracao` (tarefas e acompanhamentos), `Aviso` com tom de
atenção (plano de ação e conversão de lead) e a frase fixa do rodapé do sino. A
variação de forma é deliberada — as duas telas de lista compartilham o mesmo
componente porque têm a mesma interação; a conversão tem outra natureza (é um
ato único, não uma lista editável), e por isso usa o aviso de atenção, que
também aparece antes da ação.

Um texto copiado em cinco arquivos divergiria na primeira revisão. A frase de
`AvisoInteracao` é uma só, e mudá-la muda as telas que a usam de uma vez.

Ids criados localmente recebem o prefixo `local_`, o que os torna
impossíveis de confundir com id de mock.

---

## 9. Organização da operação (§9, §10, §17, §18)

**`/tarefas`** é o centro operacional: quatro gavetas (HOJE, ATRASADAS,
PRÓXIMAS, CONCLUÍDAS) com filtros por cliente, consultoria, prioridade e
status. Hoje e atrasadas são listas separadas de propósito — o atrasado precisa
de decisão, o de hoje não, e misturados o atrasado some no meio.

**Próximos acompanhamentos** aparece no painel e em `/tarefas`. Não há
integração com Google Calendar — a §10 dispensou.

**`/acompanhamentos`** lista Cliente, Consultoria, Data, Tipo, Resumo,
Pendências e Próxima ação, com os cinco tipos (REUNIÃO, VISITA, ANÁLISE,
RETORNO, REVISÃO) e um registro local.

Uma honestidade de vocabulário: o painel de "Ficou combinado" mostra o que ela
**escreveu como próximo passo no último encontro**. Não é "pendências em
aberto", porque o modelo não tem estado de resolução para uma pendência — e
afirmar que uma pendência está aberta quando não dá para saber seria inventar
um fluxo de trabalho.

**HISTÓRICO** é a linha do tempo dentro de `/clientes/[id]`, alimentada por 40
eventos que apontam para cliente, consultoria, ficha ou documento.

---

## 10. Fichas, processos e ingredientes sem o motor de cálculo

**`/processos/[id]`** mostra Praça, Turno, Responsável, Pratos, Tempo e a
Sequência de finalização (PASSO 01, 02, 03…) com Observações. Nenhuma regra
gastronômica foi inventada: os tempos são os declarados, e há uma função que
**soma** os tempos declarados (`somaDosTemposDeclarados`) — soma é fato;
"tempo médio da operação" seria decisão.

**`/fichas`** é a biblioteca demonstrável: Nome do prato, Categoria, Cliente,
Rendimento, Última atualização e Situação (COMPLETA, AGUARDANDO DADOS, EM
REVISÃO).

**`/fichas/[id]`** mostra a composição com quantidade, unidade e **preço de
referência** — o valor do insumo na data em que a ficha foi escrita, que é um
fato guardado, não um cálculo.

A coluna de custo **não existe** — não está vazia, não tem traço. Uma coluna
com "—" em todas as linhas parece defeito; sem a coluna, e com a frase que
explica o motivo, a mesma ausência vira informação. No lugar dela:
**"Cálculo disponível após configuração da metodologia."**

**`/ingredientes`** e **`/ingredientes/[id]`** mostram o histórico de preço como
linha do tempo (Preço atual, Preço anterior, Data, Fornecedor, origem da
informação), com a variação percentual entre um registro e o anterior. Isso é
aritmética sobre dois números guardados, não estimativa.

---

## 11. Navegação, busca e notificações (§21, §22, §23)

**Busca global** (Ctrl+K / ⌘K) cobre oito tipos: cliente, consultoria, lead,
ficha, ingrediente, processo, **acompanhamento** e **tarefa**. O índice é
montado no servidor e chega pronto — o componente só sabe procurar, e a função
de busca é pura, sem dependência de mock.

O índice é montado no servidor por duas razões declaradas: **não existe API**
(a §30 proíbe criar rota falsa) e o volume é de centenas de linhas, não
milhões. Quando o volume justificar, troca-se a montagem do índice e as telas
não mudam.

**Notificações** (§23) são internas e discretas, no sino da barra de topo, com
contagem por período (Hoje / Esta semana / Antes). A lista é derivada das
mesmas fontes do painel, e o rodapé diz explicitamente que o sistema **não
envia e-mail, WhatsApp nem push**. Marcar como lida vive em memória.

**O painel** (`/`) tem cinco camadas: PRECISA DA SUA ATENÇÃO · O QUE VENCE HOJE
+ PRÓXIMOS ACOMPANHAMENTOS · CONSULTORIAS EM ANDAMENTO · ATIVIDADE RECENTE +
ATALHOS RÁPIDOS · MAPA DO SISTEMA. Não foi um redesenho: a camada anterior foi
preservada e esta foi somada.

---

## 12. Relatórios — a tela onde era mais fácil inventar (§20)

`/relatorios` é uma **prévia**, e diz isso. Ela mostra:

- quatro contagens (Documentos, Entregues, Prontos não entregues, Consultorias
  em aberto) — todas conferíveis contra a lista;
- os documentos que existem, agrupados por cliente, com tipo, data e situação;
- **quatro linhas de resultado** com o marcador **"Dado ainda não registrado"**
  e a explicação de qual decisão cada uma depende;
- dois formatos de saída previstos (Para a consultora, com valores / Para a
  cozinha, sem valores).

**Nenhuma economia, lucro, CMV ou percentual.** A §20 foi direta nisso.

**Não há botão de download**, porque `Documento.arquivo` é `null` por
construção. Um botão que baixa o nada lê como sistema quebrado; cada linha diz
"sem arquivo", e um aviso explica por quê.

---

## 13. Documentos (§19)

`/documentos` **não existe como rota** na arquitetura herdada da Fase 0. Por
isso os documentos foram demonstrados onde o dado já vive:

- na aba **DOCUMENTOS** de `/clientes/[id]`;
- na prévia de `/relatorios`.

A §19 autorizava exatamente isso: se a rota não existisse, demonstrar o dado
onde ele faz sentido. **Não foi criada rota nova** — criar `/documentos` agora
seria inventar arquitetura que a Fase 0 não previu.

Não há upload real: a área de envio está desabilitada, com a razão visível.

---

## 14. Responsividade (§25)

Verificado nas cinco classes de tela pedidas — Desktop, Notebook, Tablet,
Android, iPhone. O que foi feito:

**Tabelas viram cartões no celular.** O componente `ListaResponsiva` monta as
duas versões a partir da **mesma** definição de coluna, então uma coluna não
pode existir na tabela e faltar no cartão. Ele é usado em nove telas
(`/clientes`, `/clientes/[id]` em três abas, `/consultorias`, `/fichas`,
`/ingredientes`, `/processos` e agora `/fichas/[id]`).

A única tabela que restava com rolagem horizontal era a de composição no
detalhe da ficha — em 390 px ela escondia justamente a coluna de preço. Nesta
fase ela foi convertida para `ListaResponsiva`, e **não há mais nenhuma tabela
com rolagem horizontal** no sistema.

**Barra lateral** vira gaveta sobreposta abaixo de 1024 px, com fundo
escurecido, fechamento por Esc, por clique fora e por troca de rota, e
bloqueio da rolagem do fundo enquanto está aberta.

**Barra de topo** esconde o nome do usuário abaixo de 640 px e o rótulo da
busca abaixo de 640 px, mantendo ícone e sino.

**Busca e notificações** abrem em painel que respeita a largura da tela:
`max-w-[560px]` com `px-4` na busca, e `min(calc(100vw - 2rem), 380px)` no
sino — nenhum dos dois estoura em 375 px.

**Filtros** usam `min-w` com `flex-1` e `sm:max-w`, então quebram linha em vez
de forçar rolagem lateral.

**Campos** têm 16 px de fonte no formulário público, o que evita o zoom
automático do iOS. Alvos de toque com no mínimo 44 px.

---

## 15. Micro-interações e consistência (§26, §27)

Animações existem em três lugares, todas curtas e todas com função: a gaveta
(300 ms), o painel de busca/notificações (`entrar-suave`) e a transição de cor
em links e botões (150 ms). **Nenhuma animação decorativa.**

Consistência: quando um padrão apareceu em três telas, virou componente. Os
casos desta fase:

- **`CartaoAcompanhamento`** — usado em `/acompanhamentos` e na aba
  ACOMPANHAMENTOS do cliente. Recebeu um `contexto` opcional em vez de virar
  dois componentes quase-iguais: na aba do cliente o nome seria repetição, na
  lista geral é a informação principal.
- **`ListaResponsiva`** — nove telas (§14).
- **`AvisoInteracao` / `ModuloEmPreparacao`** — as telas que ainda não existem
  ou que não gravam (§8, §4).
- **`ListaAtencao` + `derivarAtencao`** — o painel e a aba do cliente (§5).

---

## 16. Estado declarado na navegação

O menu tem três estados, **declarados item a item** — nunca inferidos do número
da fase:

- **`no-ar`** — a tela está construída e funciona.
- **`parcial`** — parte funciona; a rota abre e explica o que falta.
- **`previsto`** — só a rota existe, com o escopo do que virá.

Na Fase 2.5, sete itens mudaram de estado, todos porque a tela passou a
existir:

| Item | Antes | Agora | Por quê |
| --- | --- | --- | --- |
| Consultorias | previsto (f2) | **no-ar** | Lista, jornada e plano de ação funcionam |
| Processos e praças | previsto (f6) | **no-ar** | Tela completa |
| Tarefas | previsto (f6) | **no-ar** | Quatro gavetas funcionais |
| Ingredientes | previsto (f3) | **parcial** | Biblioteca e histórico funcionam; **recalcular as fichas com o preço novo é o ponto 10 e não acontece** |
| Fichas técnicas | previsto (f3) | **parcial** | Acervo existe; custo depende de 4, 5, 6 e 19 |
| Acompanhamentos | previsto (f7) | **parcial** | Lista, filtros e registro funcionam; falta persistência |
| Relatórios | previsto (f7) | **parcial** | Prévia; o bloco de resultado depende de metodologia |

Ingredientes é `parcial` e não `no-ar` por um motivo específico: o que
**justifica** o módulo é usar o preço para recalcular as fichas, e isso é o
ponto 10, que segue aberto.

---

## 17. Validações reais (§35)

| Comando | Resultado |
| --- | --- |
| `npm run typecheck` (`tsc --noEmit`) | **Passa. 0 erros.** |
| `npm run lint` (`eslint .`) | **Passa. 0 erros, 0 avisos.** |
| `npm run build` (`prisma generate && next build`) | **Não executado neste ambiente** — ver abaixo |

### Por que o build não roda aqui

O sandbox é Linux; o `node_modules` do projeto foi instalado no Windows e só
contém `@next/swc-win32-x64-msvc`. Sem `@next/swc-linux-x64-gnu` o `next build`
não compila, e a instalação do binário recebeu **403 Forbidden**. Isso é
limitação do ambiente, **não do código**. O build precisa ser rodado no Windows
e o resultado não deve ser dado como certo antes disso.

### Verificações estáticas feitas no lugar

- **Nenhum `fetch` ou `axios`** em todo o `src/`.
- **Nenhuma rota de API** além do handler do Auth.js (`/api/auth/[...nextauth]`).
- **Nenhum `localStorage`/`sessionStorage`** em uso — só em comentários que
  explicam por que não foi usado.
- **Nenhum `console.log`/`dir`/`table`** em todo o `src/`, portanto nenhuma
  resposta de diagnóstico pode vazar para o console.
- **Um `route.ts`** no projeto inteiro.
- Tabelas e cartões saem da mesma definição de coluna.
- Todas as rotas dinâmicas têm `params` como `Promise` (exigência do Next 15).
- Nenhum uso de `useSearchParams` (deixaria a rota dinâmica e exigiria
  `<Suspense>`).

---

## 18. Integração — o que mudou fora dos módulos novos

Mudanças pequenas, todas por necessidade:

- `src/lib/navegacao.ts` — sete itens com estado corrigido (§16).
- `src/components/layout/shell.tsx` — ganhou `itensBusca` e `notificacoes` como
  props, para não conhecer a camada de dados.
- `src/app/(sistema)/layout.tsx` — monta o índice da busca e as notificações no
  servidor, lendo as duas camadas.
- `src/lib/dados/index.ts` — passou a exportar as derivações novas
  (`proximosEncontros`, `ultimoAcompanhamentoPorCliente`, `ROTULO_STATUS_TAREFA`).
- `src/lib/dados/repositorio-operacao.ts` — ganhou `listarTodasAsAcoes()`, com
  justificativa: perguntar "o que está parado **agora**" não é uma pergunta por
  consultoria, e fazê-la em N consultas seria N consultas para uma resposta só.
- `src/lib/dados/busca.ts` — dois tipos novos no índice (acompanhamento e
  tarefa).
- `src/components/layout/barra-lateral.tsx` — rodapé passou a `Fase 2.5 ·
  demonstração`.
- `src/app/(sistema)/fichas/[id]/page.tsx` — a tabela de composição virou
  `ListaResponsiva` (§14).
- `src/lib/dados/derivacoes-operacao.ts` — ganhou `ROTULO_STATUS_TAREFA`. O
  status de **tarefa** não é o de **ação**: os dois começam igual, mas o
  terminal é `CONCLUIDA` (feminino, a tarefa) contra `CONCLUIDO` (o item do
  plano), e tarefa não tem AGUARDANDO_CLIENTE. Reaproveitar o mapa errado
  compilaria até alguém concluir uma tarefa — e aí a linha ficaria sem rótulo.

---

## 19. `/entrar` não foi tocada (§31)

A tela foi aprovada pelo usuário e **nenhuma modificação foi feita nela** nesta
fase, nem visual, nem de composição, nem de identidade. Confirmado por data de
modificação: `src/app/entrar/page.tsx` permanece com o carimbo da Fase 1, mais
antigo que qualquer arquivo da Fase 2.5.

O `globals.css` e a raiz de layout também não mudaram de identidade; a única
alteração de layout foi a prop nova do `Shell`, descrita em §18.

---

## 20. Proteção de escopo (§37)

Trabalho feito **exclusivamente** em `sistema-erika`. Nenhum dos projetos
protegidos foi alterado: `erika-bruna`, `informaçoes da Erika bruna`,
`Informaçoes do perfil da clienrte`, `Public`, `referencia - Banco--XP--2`,
`contrato-erika-bruna`. Verificado por data de modificação — os arquivos do
`contrato-erika-bruna` têm carimbo anterior ao início desta fase, e nenhum
arquivo dos demais mudou depois.

---

## 21. Backend (§30)

**Nada foi conectado.** Cumprido ao pé da letra:

- Neon **não** foi configurado; não existe `.env`, só `.env.example`.
- **Nenhuma migration** foi criada por causa dos mocks.
- **Nenhuma API falsa** foi criada.
- **Nenhum dado foi persistido** como se fosse real.
- **`localStorage` não foi usado** como substituto de banco.

O ponto de troca continua sendo uma linha: `obterRepositorio()` e
`obterRepositorioOperacao()` em `src/lib/dados/index.ts`. Nenhuma tela importa
mock diretamente.

---

## 22. A lacuna das 29 perguntas (§32)

A §32 foi direta: **a lacuna fica na documentação interna, não na experiência
pública.**

Verificado: o aviso de lacuna existe em duas telas **internas**
(`/diagnosticos` e `/diagnosticos/[id]`), onde só a consultora entra, e é lá
que ele faz sentido — é ela quem precisa saber por que são 29 e não 33. O
formulário público, em `/diagnostico`, **não menciona lacuna, não menciona
número de perguntas não transcritas e não menciona "faltam quatro"**. A tela de
conclusão também não.

O comportamento está correto e não precisou de mudança nesta fase.

---

## 23. Pendências registradas

**Decisões abertas (bloqueiam trabalho, não são bugs):** 4 (índice de cocção),
5 (fator de correção por contexto), 6 (fator de correção duplicado), 7 (CMV alvo
ou markup), 9 (origem do volume do cardápio), 11 (peso das respostas), 19
(arredondamento e precisão). Somam-se a 15 (triagem) e 20 (domínio).

**Vulnerabilidades de dependência:** o `npm install` reportou **5
vulnerabilidades — 1 moderada e 4 altas**. **Não foram tratadas**, por decisão
explícita: `npm audit fix --force` faz atualização destrutiva e não se faz isso
no meio da entrega. **Fica registrado para análise posterior.** Não foi
executado `npm audit fix --force` nesta fase.

**Avisos de `allow-scripts` do Prisma:** não silenciados.

**Build no Windows:** pendente, e é a única validação desta fase que não pôde
ser executada aqui (§17).

**Duas listas de mock sem uso:** `NOTIFICACOES` e `ATIVIDADES` existem em
`operacao.ts` e `dados.ts` mas não são lidas por nenhuma tela — as notificações
são derivadas em tempo de render, e a atividade de lead não tem consumidor
depois da reorganização do painel. Ficam registradas como limpeza para a
próxima fase, não como pendência funcional: nada quebra por causa delas.

---

## 24. Git

Nenhuma operação. Sem `git init`, sem remote, sem commit, sem push, sem deploy.

---

## 25. Fronteira da Fase 3

**A Fase 3 não foi iniciada.** Nenhuma fórmula, nenhum índice, nenhum fator,
nenhum CMV, nenhum markup, nenhuma precificação e nenhum resultado financeiro
foi implementado — todos dependem dos pontos 4, 5, 6, 7, 9, 11 e 19.

O que a Fase 2.5 entregou no lugar disso: um sistema em que a operação inteira
da consultoria é **visível, navegável e narrável**, com toda lacuna declarada
no lugar onde um número deveria estar.

Existe um teste de lint (`no-restricted-imports` em `eslint.config.mjs`) que
barra componente visual de importar domínio, para que o cálculo, quando
existir, nasça no servidor e não na interface.
