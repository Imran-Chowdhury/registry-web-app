import 'server-only';

import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { formatMoney } from '@/lib/money';
import type { Viewer } from '@/lib/viewer';

import {
  recordPaymentSchema,
  reversePaymentSchema,
  type RecordPaymentInput,
  type ReversePaymentInput,
} from '../schema';
import type { FeeDetail, LedgerEntry } from '../types';
import { feeRepo } from './fee.repo';
import { toFeeDetail } from './fee.service';
import { paymentRepo } from './payment.repo';

export const paymentService = {
  /**
   * Recording money is staff-only. A student seeing their own balance is one thing;
   * writing to the ledger is another.
   */
  async record(viewer: Viewer, input: RecordPaymentInput): Promise<FeeDetail> {
    requireStaff(viewer);
    const data = recordPaymentSchema.parse(input);

    const fee = await feeRepo.findById(data.feeId);
    if (!fee) throw new NotFoundError('Fee');

    const current = toFeeDetail(fee);

    // Never silently allow a negative balance. The message names the figure so the
    // admin can correct the entry without hunting for it.
    if (data.amountMinor > current.outstandingMinor) {
      throw new ConflictError(
        current.outstandingMinor <= 0
          ? 'That fee is already settled in full.'
          : `That is more than the ${formatMoney(current.outstandingMinor)} outstanding on this fee.`,
      );
    }

    // Checked ahead of the insert so a repeated bank reference reads as a duplicate
    // rather than as a database constraint. The unique index is still the guarantee.
    const duplicate = await paymentRepo.findByReference(data.reference);
    if (duplicate) {
      throw new ConflictError(
        `Reference ${data.reference} has already been recorded. Payments are not entered twice.`,
      );
    }

    await paymentRepo.create({
      feeId: data.feeId,
      amountMinor: data.amountMinor,
      paidAt: data.paidAt,
      reference: data.reference,
      note: data.note,
    });

    return readFee(data.feeId);
  },

  /**
   * Corrections never delete. The original is marked reversed and a negative
   * counter-entry records when and why — an audit trail a registry can defend.
   */
  async reverse(
    viewer: Viewer,
    paymentId: string,
    input: ReversePaymentInput,
  ): Promise<FeeDetail> {
    requireStaff(viewer);
    const { reason } = reversePaymentSchema.parse(input);

    const payment = await paymentRepo.findById(paymentId);
    if (!payment) throw new NotFoundError('Payment');

    if (payment.status === 'REVERSED') {
      throw new ConflictError('That payment has already been reversed.');
    }
    if (payment.reversalOf) {
      throw new ConflictError('A reversal entry cannot itself be reversed.');
    }

    await paymentRepo.reverse({
      original: {
        id: payment.id,
        feeId: payment.feeId,
        amountMinor: payment.amountMinor,
        reference: payment.reference,
      },
      reason,
      reversedAt: new Date(),
    });

    return readFee(payment.feeId);
  },

  /** The all-students ledger. Staff only — it spans every student's record. */
  async listLedger(viewer: Viewer, search?: string): Promise<LedgerEntry[]> {
    requireStaff(viewer);

    const rows = await paymentRepo.findLedger(search);
    const reversedOriginalIds = new Set(
      rows.map((row) => row.reversalOf).filter((id): id is string => Boolean(id)),
    );

    return rows.map((row) => ({
      id: row.id,
      amountMinor: row.amountMinor,
      paidAt: row.paidAt.toISOString(),
      reference: row.reference,
      status: row.status,
      reversalOf: row.reversalOf,
      note: row.note,
      isReversed: reversedOriginalIds.has(row.id),
      studentId: row.fee.studentId,
      studentCode: row.fee.student.studentCode,
      studentName: row.fee.student.fullName,
    }));
  },
};

/** Re-reads the fee so the caller gets the balance as it now stands, not as it was. */
async function readFee(feeId: string): Promise<FeeDetail> {
  const fee = await feeRepo.findById(feeId);
  if (!fee) throw new NotFoundError('Fee');
  return toFeeDetail(fee);
}

function requireStaff(viewer: Viewer): void {
  if (viewer.role !== 'STAFF') {
    throw new ForbiddenError('Only registry staff can record payments.');
  }
}
