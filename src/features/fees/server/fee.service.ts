import 'server-only';

import { ForbiddenError, NotFoundError } from '@/lib/errors';
import type { Viewer } from '@/lib/viewer';

import { computeFeeSummary } from '../fee-math';
import type { FeeDetail, PaymentEntry, StudentArrears } from '../types';
import { feeRepo, type FeeRow } from './fee.repo';

export const feeService = {
  /**
   * A student may read their own fees and nobody else's. The id is checked against the
   * cookie-derived viewer rather than trusted from the request.
   */
  async listForStudent(viewer: Viewer, studentId: string): Promise<FeeDetail[]> {
    if (viewer.role === 'STUDENT' && viewer.studentId !== studentId) {
      throw new ForbiddenError('You can only view your own fees.');
    }

    const rows = await feeRepo.findByStudent(studentId);
    return rows.map(toFeeDetail);
  },

  /**
   * Arrears for a set of students, keyed by student id.
   *
   * Staff only, and read through the same `computeFeeSummary` as every other balance in
   * the app — the publish screen must not develop its own opinion about what a student
   * owes.
   */
  async arrearsByStudent(
    viewer: Viewer,
    studentIds: string[],
  ): Promise<Map<string, StudentArrears>> {
    if (viewer.role !== 'STAFF') {
      throw new ForbiddenError('Only registry staff can read other students’ balances.');
    }

    const rows = await feeRepo.findByStudents(studentIds);
    const arrears = new Map<string, StudentArrears>();

    for (const row of rows) {
      const detail = toFeeDetail(row);
      const current = arrears.get(row.studentId) ?? {
        studentId: row.studentId,
        outstandingMinor: 0,
        isOverdue: false,
        daysOverdue: 0,
      };

      arrears.set(row.studentId, {
        studentId: row.studentId,
        outstandingMinor:
          current.outstandingMinor + Math.max(0, detail.outstandingMinor),
        isOverdue: current.isOverdue || detail.isOverdue,
        daysOverdue: Math.max(current.daysOverdue, detail.daysOverdue),
      });
    }

    return arrears;
  },

  async getById(viewer: Viewer, feeId: string): Promise<FeeDetail> {
    const row = await feeRepo.findById(feeId);
    if (!row) throw new NotFoundError('Fee');

    if (viewer.role === 'STUDENT' && viewer.studentId !== row.studentId) {
      throw new ForbiddenError('You can only view your own fees.');
    }

    return toFeeDetail(row);
  },
};

export function toFeeDetail(row: FeeRow): FeeDetail {
  // Only completed payments move the balance. A reversed payment and its counter-entry
  // cancel out, and both stay on the ledger.
  const completed = row.payments.filter((payment) => payment.status === 'COMPLETED');
  const reversedOriginalIds = new Set(
    row.payments
      .map((payment) => payment.reversalOf)
      .filter((id): id is string => Boolean(id)),
  );

  return {
    ...computeFeeSummary({
      id: row.id,
      description: row.description,
      amountMinor: row.amountMinor,
      waivedMinor: row.waivedMinor,
      dueDate: row.dueDate,
      payments: completed,
    }),
    studentId: row.studentId,
    payments: row.payments.map(
      (payment): PaymentEntry => ({
        id: payment.id,
        amountMinor: payment.amountMinor,
        paidAt: payment.paidAt.toISOString(),
        reference: payment.reference,
        status: payment.status,
        reversalOf: payment.reversalOf,
        note: payment.note,
        isReversed: reversedOriginalIds.has(payment.id),
      }),
    ),
  };
}
