// No `server-only` guard here on purpose: the Prisma import below is type-only and so
// erased at build time, which lets the create-student form reuse `studentCodePlaceholder`
// for its disabled preview field. `nextStudentCode` is still only reachable with a
// transaction client, which a client component cannot obtain.
import type { Prisma } from '@/generated/prisma/client';

const CODE_PREFIX = 'SMS';
const SEQUENCE_WIDTH = 4;

/**
 * Generates the next `SMS-YYYY-NNNN` code for an intake year.
 *
 * Must be called inside the same transaction that creates the student. The counter row
 * is incremented atomically, so two concurrent creates cannot be handed the same number
 * — `count() + 1` can, and silently, which is exactly the sort of bug a registry only
 * discovers once two students share a code.
 */
export async function nextStudentCode(
  tx: Prisma.TransactionClient,
  intakeYear: number,
): Promise<string> {
  const counter = await tx.studentCodeCounter.upsert({
    where: { year: intakeYear },
    create: { year: intakeYear, lastValue: 1 },
    update: { lastValue: { increment: 1 } },
    select: { lastValue: true },
  });

  return formatStudentCode(intakeYear, counter.lastValue);
}

export function formatStudentCode(year: number, sequence: number): string {
  return `${CODE_PREFIX}-${year}-${String(sequence).padStart(SEQUENCE_WIDTH, '0')}`;
}

/** The disabled preview shown on the create form before the real code exists. */
export function studentCodePlaceholder(year: number): string {
  return `${CODE_PREFIX}-${year}-${'•'.repeat(SEQUENCE_WIDTH)}`;
}
