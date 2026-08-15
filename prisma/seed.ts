import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import { PrismaClient } from '../src/generated/prisma/client';

/**
 * Reference data only, for now.
 *
 * Programmes carry the fee amounts that every student's fee assignment is snapshotted
 * from, so nothing in the app works without them. Students, fees, payments,
 * submissions, and results are seeded in Phase 7, where the point is covering the edge
 * cases a reviewer needs to see.
 *
 * Idempotent: re-running upserts by natural key rather than duplicating.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const PROGRAMMES = [
  { code: 'CSE', name: 'Computer Science', feeMinor: 10_000, feeDueDays: 30 },
  { code: 'BBA', name: 'Business Administration', feeMinor: 5_000, feeDueDays: 30 },
];

const MODULES = [
  { code: 'CSE-101', name: 'Programming Fundamentals', programmes: ['CSE'] },
  { code: 'CSE-201', name: 'Data Structures', programmes: ['CSE'] },
  { code: 'BBA-110', name: 'Principles of Management', programmes: ['BBA'] },
  // Shared across both programmes — the reason Module has a many-to-many relation.
  { code: 'GEN-100', name: 'Academic Writing', programmes: ['CSE', 'BBA'] },
];

async function main() {
  for (const programme of PROGRAMMES) {
    await prisma.programme.upsert({
      where: { code: programme.code },
      create: programme,
      update: { name: programme.name, feeDueDays: programme.feeDueDays },
      // Note: feeMinor is intentionally not updated on re-seed. Existing students hold a
      // snapshot of it, and rewriting the source would make the two disagree silently.
    });
  }

  for (const entry of MODULES) {
    const programmes = entry.programmes.map((code) => ({ code }));
    await prisma.module.upsert({
      where: { code: entry.code },
      create: {
        code: entry.code,
        name: entry.name,
        programmes: { connect: programmes },
      },
      update: {
        name: entry.name,
        programmes: { set: programmes },
      },
    });
  }

  const [programmeCount, moduleCount] = await Promise.all([
    prisma.programme.count(),
    prisma.module.count(),
  ]);

  process.stdout.write(
    `Seeded ${programmeCount} programmes and ${moduleCount} modules.\n`,
  );
}

main()
  .catch((error) => {
    process.exitCode = 1;
    console.error(error);
  })
  .finally(() => prisma.$disconnect());
