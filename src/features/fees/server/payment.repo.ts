import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';

/** Prisma calls only. Money rows are inserted, never updated away or deleted. */

const ledgerSelect = {
  id: true,
  amountMinor: true,
  paidAt: true,
  reference: true,
  status: true,
  reversalOf: true,
  note: true,
  fee: {
    select: {
      studentId: true,
      student: { select: { studentCode: true, fullName: true } },
    },
  },
} satisfies Prisma.PaymentSelect;

export type LedgerRow = Prisma.PaymentGetPayload<{ select: typeof ledgerSelect }>;

export const paymentRepo = {
  create(data: {
    feeId: string;
    amountMinor: number;
    paidAt: Date;
    reference: string;
    note?: string;
  }) {
    return db.payment.create({ data, select: { id: true } });
  },

  findById(id: string) {
    return db.payment.findUnique({
      where: { id },
      select: {
        id: true,
        feeId: true,
        amountMinor: true,
        reference: true,
        status: true,
        reversalOf: true,
      },
    });
  },

  findByReference(reference: string) {
    return db.payment.findUnique({ where: { reference }, select: { id: true } });
  },

  /**
   * Marks the original as reversed and writes its counter-entry in one transaction.
   * A half-applied reversal would leave the ledger claiming money that is not there.
   */
  reverse(input: {
    original: { id: string; feeId: string; amountMinor: number; reference: string };
    reason: string;
    reversedAt: Date;
  }) {
    const { original, reason, reversedAt } = input;

    return db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: original.id },
        data: { status: 'REVERSED' },
      });

      return tx.payment.create({
        data: {
          feeId: original.feeId,
          // Negative, so the ledger reads as double entry rather than as a second
          // payment that happens to be tagged.
          amountMinor: -original.amountMinor,
          paidAt: reversedAt,
          reference: `${original.reference}-REV`,
          status: 'REVERSED',
          reversalOf: original.id,
          note: reason,
        },
        select: { id: true },
      });
    });
  },

  findLedger(search?: string): Promise<LedgerRow[]> {
    return db.payment.findMany({
      where: search
        ? {
            OR: [
              { reference: { contains: search, mode: 'insensitive' } },
              { fee: { student: { fullName: { contains: search, mode: 'insensitive' } } } },
              {
                fee: {
                  student: { studentCode: { contains: search, mode: 'insensitive' } },
                },
              },
            ],
          }
        : undefined,
      select: ledgerSelect,
      orderBy: [{ paidAt: 'desc' }, { id: 'desc' }],
      take: 200,
    });
  },
};
