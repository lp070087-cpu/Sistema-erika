/**
 * Acesso ao banco de dados.
 *
 * IMPORTANTE — estado desta fase:
 *
 *   O banco NÃO está configurado e nenhuma migration existe. Este módulo
 *   está pronto para ser usado, não em uso.
 *
 *   O import do cliente Prisma é DINÂMICO e só acontece na primeira
 *   chamada real. Motivo: `prisma generate` ainda não rodou, então
 *   `@/generated/prisma` não existe no disco. Um import estático no topo
 *   quebraria a verificação de tipos e o build antes de qualquer coisa
 *   rodar — inclusive antes de a consultora conseguir abrir a tela de
 *   login e ver o que falta configurar.
 *
 *   Para ativar: preencha DATABASE_URL e DIRECT_URL no .env e rode
 *   `npm run db:push`. A partir daí o acesso funciona normalmente.
 *
 * Nenhum modelo de ingrediente, ficha ou custo foi criado — eles
 * dependem das respostas da Seção 17 do relatório da Fase 0.
 */

type ClientePrisma = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
};

const globalParaPrisma = globalThis as unknown as {
  prisma: ClientePrisma | undefined;
};

export class BancoNaoConfigurado extends Error {
  constructor() {
    super(
      "O banco de dados ainda não foi configurado.\n" +
        "Preencha DATABASE_URL e DIRECT_URL no arquivo .env e rode: npm run db:push"
    );
    this.name = "BancoNaoConfigurado";
  }
}

/** O banco está configurado no ambiente? */
export function bancoConfigurado(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/**
 * Devolve o cliente Prisma.
 *
 * Lança `BancoNaoConfigurado` com instrução clara quando o ambiente
 * ainda não foi preparado — em vez de um erro obscuro de módulo
 * não encontrado.
 */
export async function obterBanco(): Promise<ClientePrisma> {
  if (!bancoConfigurado()) {
    throw new BancoNaoConfigurado();
  }

  if (globalParaPrisma.prisma) {
    return globalParaPrisma.prisma;
  }

  const { PrismaClient } = await import("@/generated/prisma");

  const cliente = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  }) as unknown as ClientePrisma;

  // O padrão `globalThis` evita abrir conexão nova a cada recarga em
  // desenvolvimento — sem ele, o hot reload esgota o pool do Neon.
  if (process.env.NODE_ENV !== "production") {
    globalParaPrisma.prisma = cliente;
  }

  return cliente;
}
