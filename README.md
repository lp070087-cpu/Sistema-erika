# Érika Bruna — Gestão de Consultoria

Sistema de gestão da consultoria gastronômica de Érika Bruna.

Este projeto é **independente do site** em `../erika-bruna/`: repositório,
hospedagem, banco e domínio próprios. O site não é alterado por nada daqui.

> **Nome provisório.** "Gestão de Consultoria" aparece em poucos lugares
> (título, barra lateral, documentação). Trocar o nome não exige mexer na
> arquitetura.

---

## Estado atual: Fase 1 — fundação

A fundação está construída. **Nenhuma regra de negócio gastronômica foi
implementada**, por decisão explícita: seis perguntas da Seção 17 do
relatório da Fase 0 ainda aguardam resposta da consultora.

Leia `docs/FASE-1-ESTADO.md` para o estado real e `docs/FASE-0-ANALISE-E-ARQUITETURA.md`
para a auditoria e o desenho do sistema completo.

---

## Como rodar

Requer Node.js 20 ou superior.

```bash
npm install
cp .env.example .env     # Windows: copy .env.example .env
```

Gere o segredo da sessão e o hash da senha:

```bash
openssl rand -base64 32                              # cole em AUTH_SECRET
npm run senha:hash -- "sua-senha"                    # cole em AUTH_PASSWORD_HASH
```

Preencha `AUTH_EMAIL` com o e-mail de acesso e suba o servidor:

```bash
npm run dev
```

Acesse `http://localhost:3000`. A tela de entrada informa, em tempo real,
qual variável ainda falta — não é preciso adivinhar.

### Banco de dados

**Ainda não é necessário.** A Fase 1 não grava nada.

Quando for (antes da Fase 2): crie o banco no Neon, preencha `DATABASE_URL`
e `DIRECT_URL` no `.env` e rode:

```bash
npm run db:push
```

### Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera o cliente Prisma e compila para produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | Verificação de tipos, sem emitir |
| `npm run senha:hash -- "..."` | Gera o hash da senha de acesso |
| `npm run db:push` | Aplica o schema no banco |
| `npm run db:studio` | Interface visual do banco |

---

## Estrutura

```
src/
  app/
    (sistema)/          Área autenticada — uma rota por módulo
    entrar/             Tela de entrada
    api/auth/           Rotas do Auth.js
    layout.tsx          Tipografia da marca, metadados
    error.tsx           Erro de execução
    loading.tsx         Carregamento
    not-found.tsx       Página não encontrada
  components/
    layout/             Barra lateral e estrutura da aplicação
    marca/              Logotipo e monograma
    ui/                 Design system reutilizável
  lib/
    auth/               Autenticação (config, provider, senha)
    domain/             REGRA DE NEGÓCIO — vazia nesta fase, ver README local
    utils/              Utilitários sem regra de negócio
    db.ts               Acesso ao banco
    env.ts              Verificação do ambiente
    navegacao.ts        Estrutura do menu
  styles/globals.css    Tokens da marca
  types/                Extensões de tipo
prisma/schema.prisma    Schema do banco
docs/                   Relatórios das fases
scripts/                Utilitários de linha de comando
```

### A fronteira que o código respeita

```
componente visual  →  recebe valores prontos por props. Não calcula, não consulta banco.
serviço            →  orquestra: lê dados, chama o domínio, entrega pronto.
domínio            →  função pura. Sem React, sem banco, sem I/O.
dados              →  acesso ao banco, sem regra de negócio.
```

O ESLint bloqueia import de `lib/domain` dentro de `components/`.

---

## Decisões técnicas

**Tailwind CSS v4.** Os tokens da marca ficam em `@theme` dentro de
`src/styles/globals.css`, extraídos de `../erika-bruna/assets/estilo.css`.
Mesma paleta, mesma tipografia, mesma linguagem — em escala de ferramenta.

**Autenticação.** Auth.js com usuário único. A senha usa `scrypt` do módulo
`crypto` do Node, no formato `scrypt$salt$hash`. Sem dependência de bcrypt
ou argon2 — scrypt é adequado para senha e já vem no Node.

**Acesso ao banco.** `src/lib/db.ts` importa o Prisma dinamicamente, na
primeira chamada real. Um import estático no topo quebraria a verificação
de tipos antes de `prisma generate` rodar.

**Sem fontes via CDN.** As três famílias (Fraunces, Instrument Sans,
Parisienne) são servidas por `next/font/google`, o que elimina requisição
externa em tempo de execução e o salto de layout.

---

## O que este sistema não faz — por decisão

- Não calcula CMV, markup ou preço sugerido (ponto 7 não respondido).
- Não implementa ficha técnica nem custo de ingrediente (pontos 4, 5, 6, 19).
- Não usa índice de cocção (ponto 4).
- Não calcula resultado por volume presumido (ponto 9).
- Não acessa WhatsApp por meio não oficial. Somente API oficial da Meta,
  na Fase 9 — nunca automação de WhatsApp Web, scraping ou QR automatizado.

Nada disso é lacuna: é escopo contido por decisão. Implementar qualquer um
desses itens agora significaria inventar regra gastronômica.
