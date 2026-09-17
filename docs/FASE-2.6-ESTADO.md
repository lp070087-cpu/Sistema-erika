# FASE 2.6 — CONECTAR SITE + SISTEMA + COMPLETAR DEMONSTRAÇÃO FUNCIONAL

Documento de estado da Fase 2.6 do Sistema Érika Bruna.

Regra deste arquivo, igual à das fases anteriores: **nada aqui pode afirmar mais
do que foi verificado.**

O objetivo desta fase não foi construir módulo novo. Foi deixar o sistema
**pronto para uma apresentação real**, com o fluxo inteiro navegável de ponta a
ponta, e dar à Érika acesso ao próprio link de divulgação dentro do sistema.

---

## 1. O que foi criado nesta fase

| Arquivo | O que é |
| --- | --- |
| `src/lib/configuracao-publica.ts` | Ponto único de configuração pública — endereços, envio do diagnóstico, marca e versão. |
| `src/components/ui/link-publico.tsx` | Copiar, abrir, compartilhar e exibir endereço público, com retorno visível. |
| `src/components/imprimir/botao-imprimir.tsx` | Botão de impressão, que só habilita depois da hidratação. |
| `src/app/imprimir/relatorio/[clienteId]/page.tsx` | Relatório do cliente, em folha, fora do menu do sistema. |
| `src/app/imprimir/layout.tsx` | Repete a exigência de sessão para a rota de impressão. |
| `src/app/(sistema)/meu-site/page.tsx` | Área "Meu site": link, divulgação, bio e diagnóstico. |
| `src/app/(sistema)/meu-site/bio.tsx` | Sugestão de bio do Instagram, com cópia. |
| `src/app/(sistema)/clientes/novo.tsx` | Formulário de novo cliente, com cadastro local. |
| `src/app/(sistema)/consultorias/nova.tsx` | Formulário de nova consultoria, sem valor nem duração. |
| `src/app/(sistema)/fichas/nova.tsx` | Formulário de nova ficha, com linhas de ingrediente. |
| `src/app/(sistema)/ingredientes/novo.tsx` | Formulário de novo insumo, com a única conta neutra do sistema. |
| `src/app/(sistema)/processos/novo.tsx` | Formulário de novo processo, com passos ordenáveis. |

Não foi criado nenhum arquivo de API, nenhuma migration e nenhuma tabela.

---

## 2. Rotas

### Novas

| Rota | Estado |
| --- | --- |
| `/meu-site` | FUNCIONAL — link real, cópia, compartilhamento e bio |
| `/imprimir/relatorio/[clienteId]` | FUNCIONAL — imprime e salva em PDF pelo navegador |

### Alteradas

| Rota | O que mudou |
| --- | --- |
| `/` (dashboard) | Atalho enxuto de "Meu site" na coluna de atividades |
| `/leads` | Origem com destaque para "Diagnóstico pelo site" e data de entrada |
| `/leads/[id]` | Blocos de Origem do lead, Diagnóstico relacionado e Histórico |
| `/clientes` | Botão "Novo cliente", no cabeçalho e no estado vazio |
| `/consultorias` | Botão "Nova consultoria" |
| `/fichas` | Botão "Nova ficha" |
| `/ingredientes` | Botão "Novo ingrediente" |
| `/processos` | Botão "Novo processo", no cabeçalho e no estado vazio |
| `/relatorios` | Botão que abre o relatório do cliente |
| `/configuracoes` | Reorganizada em Negócio, Metodologia, Divulgação e Sistema |
| `/diagnostico` | Texto de demonstração explícito, atrás de um sinalizador |

---

## 3. Ações que funcionam de verdade

Estas fazem algo real ao clique, sem depender de banco:

**Copiar o link do site.** Usa a área de transferência do navegador, com
alternativa para navegadores antigos. A confirmação aparece no próprio botão e
também na tela — em dois lugares, porque na apresentação ninguém está olhando
para o mesmo canto o tempo todo.

**Abrir o site.** Abre em aba nova, com `noopener,noreferrer`.

**Compartilhar.** Usa o compartilhamento do próprio celular quando existe. Onde
não existe, cai para a cópia. **Não foi montado link de WhatsApp**, porque isso
exigiria guardar um número pessoal no código — a §28 pede exatamente o
contrário.

**Imprimir e salvar em PDF.** Abre a impressão do navegador, onde a opção
"Salvar como PDF" já existe. Não foi usada biblioteca de PDF.

**Formulários de cadastro.** Cliente, consultoria, ficha, ingrediente e processo
funcionam com estado local: os campos respondem, as linhas podem ser
adicionadas, reordenadas e removidas, e a tela mostra como o registro ficaria
antes de confirmar.

**Filtros e busca.** Continuam na URL, e o link reabre a mesma visão.

**Conversão de lead em cliente.** A gaveta mostra o que vai ser aproveitado e o
que vai acontecer, e diz que nada foi gravado ao confirmar.

**Novo acompanhamento e nova tarefa.** Já existiam da Fase 2.5 e foram
mantidos como estavam.

---

## 4. O que continua sendo demonstração

Tudo. Nenhum dado sai do navegador.

Os cinco clientes, as cinco consultorias, os leads, as fichas, os ingredientes,
os processos, os acompanhamentos e o histórico são inventados e vivem em
`src/lib/dados/mock/`. Os formulários novos escrevem apenas em memória: ao
recarregar, o que foi digitado some — e cada formulário avisa isso **antes** do
clique, dentro do próprio painel.

O aviso de diagnóstico também é explícito: ao terminar, a tela diz "Esta é uma
demonstração do fluxo de diagnóstico" e explica que as respostas ficaram na aba
do navegador.

---

## 5. O que depende do backend

| Ação | O que falta |
| --- | --- |
| Gravar um cliente novo | Banco conectado e o cadastro completo (pontos 1, 2, 3 e 10) |
| Gravar consultoria, ficha, ingrediente, processo | Banco conectado e as tabelas de operação |
| Salvar observação interna no lead | Banco conectado |
| Receber o diagnóstico público | Envio real (§11) e a decisão do ponto 15 |
| Converter lead em cliente de verdade | Idem cadastro de cliente |
| Salvar e entregar relatório | Banco conectado; o arquivo não existe, a página é montada na hora |

O endereço público do formulário de diagnóstico é `null` de propósito: o
sistema não está publicado, e **nenhum endereço foi inventado**. Onde a cópia
não é possível, a tela mostra "Disponível após publicação do sistema" e oferece
"Ver o formulário" pelo próprio sistema.

---

## 6. Link público configurado

```
https://erikaconsultoria.vercel.app/
```

Vive num lugar só, em `src/lib/configuracao-publica.ts`, e é o único endereço
público do sistema. O endereço do formulário de diagnóstico é um segundo campo,
hoje nulo, para que publicar seja trocar uma linha.

---

## 7. Principais arquivos alterados

Navegação e acesso: `src/lib/navegacao.ts`, `src/lib/dados/index.ts`,
`src/lib/dados/tipos.ts`, `src/lib/dados/formato.ts`,
`src/components/layout/barra-lateral.tsx`, `src/app/(sistema)/page.tsx`.

Telas de entrada e resultado: `src/app/(sistema)/leads/page.tsx`,
`src/app/(sistema)/leads/[id]/page.tsx`, `src/app/(sistema)/relatorios/page.tsx`,
`src/app/diagnostico/conclusao.tsx`.

Áreas novas: os cinco formulários citados na Seção 1, `/meu-site`,
`/configuracoes` e a rota de impressão.

---

## 8. O que ficou pendente

**Decisões de metodologia, sem nenhuma alteração nesta fase.** Os pontos 4, 5,
6, 7, 9, 11 e 19 continuam abertos, e agora aparecem listados em
`/configuracoes` → Metodologia, como pauta de reunião. Nenhum deles ganhou
campo, valor padrão ou sugestão.

**A lacuna das perguntas.** O formulário continua com as 29 transcritas; o
relatório da Fase 0 registra 33. A diferença está declarada na tela de
Configurações e no detalhe do lead.

**O motor de cálculo.** Não existe, e não podia existir.

**Instalação do banco.** Não feita, por decisão desta fase.

**Fase 3.** Não iniciada.

---

## 9. Verificação

- `npx tsc --noEmit` — sem erros.
- `npx eslint .` — sem avisos e sem erros.
- `next build` — **não executado aqui**. O sandbox é Linux e o
  `node_modules` foi instalado no Windows; o binário do compilador para Linux
  não está presente. A validação de build precisa ser feita no Windows.

Nenhuma migração, nenhum `git` e nenhuma publicação foram executados. Nenhuma
pasta fora de `/sistema-erika` foi alterada.
