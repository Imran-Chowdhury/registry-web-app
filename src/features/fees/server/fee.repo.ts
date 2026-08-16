import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';

/** Prisma calls only. */

const feeSelect = {
  id: true,
  studentId: true,
  description: true,
  amountMinor: true,
  waivedMinor: true,
  dueDate: true,
  payments: {
    select: {
      id: true,
      amountMinor: true,
      paidAt: true,
      reference: true,
      status: true,
      reversalOf: true,
      note: true,
    },
    /*
      Ordered by when the entry was made, not by the date on it.

      `paidAt` is a banking date: recorded payments carry it at midnight from a date
      input, while a reversal carries the exact moment it was made. Sorting on it
      therefore floated every reversal above same-day payments regardless of what
      happened first. Sorting on `id` as a tie-break was no better — a cuid2 is
      deliberately not time-sortable, so same-day order was arbitrary.

      `createdAt` is the order the registry actually did things, which is what a ledger
      is for, and it keeps a reversal directly above the payment it reverses.
    */
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.FeeAssignmentSelect;

export type FeeRow = Prisma.FeeAssignmentGetPayload<{ select: typeof feeSelect }>;

export const feeRepo = {
  findByStudent(studentId: string): Promise<FeeRow[]> {
    return db.feeAssignment.findMany({
      where: { studentId },
      select: feeSelect,
      orderBy: { dueDate: 'asc' },
    });
  },

  /** One query for a set of students, rather than one query per row of a table. */
  findByStudents(studentIds: string[]): Promise<FeeRow[]> {
    if (studentIds.length === 0) return Promise.resolve([]);

    return db.feeAssignment.findMany({
      where: { studentId: { in: studentIds } },
      select: feeSelect,
      orderBy: { dueDate: 'asc' },
    });
  },

  findById(feeId: string): Promise<FeeRow | null> {
    return db.feeAssignment.findUnique({ where: { id: feeId }, select: feeSelect });
  },

  /** Every fee with an outstanding balance, for the dashboard and overdue reporting. */
  findAllWithPayments(): Promise<FeeRow[]> {
    return db.feeAssignment.findMany({ select: feeSelect, orderBy: { dueDate: 'asc' } });
  },
};
