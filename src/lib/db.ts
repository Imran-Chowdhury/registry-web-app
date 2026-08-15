import 'server-only';

import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '@/generated/prisma/client';
import { env } from './env';

/**
 * Prisma 7 requires an explicit driver adapter for SQL providers — the query engine no
 * longer opens its own connection. Swapping Postgres hosts is a change to this file only.
 */
function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>;

// Next.js hot-reloads modules in development, which would otherwise open a new pool on
// every save until Postgres refuses connections.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
