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
    orderBy: [{ paidAt: 'desc' as const }, { id: 'desc' as const }],
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
