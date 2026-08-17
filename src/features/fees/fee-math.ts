import { daysOverdue } from '@/lib/dates';

import type { FeeSummary } from './types';

/**
 * The single definition of what a student owes.
 *
 * Both the students feature and the fees feature read balances, so this lives in one
 * place rather than being reimplemented on each side — two copies of a money calculation
 * is how a list and a detail page start disagreeing about the same student.
 *
 * Deliberately not stored: a column would drift the moment a payment is reversed or a
 * waiver applied.
 */
/** The balance itself, for callers that need the number and not the whole summary. */
export function outstandingMinorOf(fee: {
  amountMinor: number;
  waivedMinor: number;
  payments: { amountMinor: number }[];
}): number {
  // Only COMPLETED payments are passed in — a reversed payment and its counter-entry
  // both leave the balance where it was before.
  const paidMinor = fee.payments.reduce((sum, payment) => sum + payment.amountMinor, 0);
  return fee.amountMinor - fee.waivedMinor - paidMinor;
}

/**
 * Both halves of the rule: money still owed **and** the date already gone.
 *
 * Exported so a caller counting arrears over thousands of rows does not have to build a
 * full `FeeSummary` per row — and, more to the point, does not write its own subtraction
 * and start disagreeing with the fee panel.
 */
export function isFeeOverdue(fee: {
  amountMinor: number;
  waivedMinor: number;
  dueDate: Date;
  payments: { amountMinor: number }[];
}): boolean {
  return outstandingMinorOf(fee) > 0 && daysOverdue(fee.dueDate) > 0;
}

export function computeFeeSummary(fee: {
  id: string;
  description: string;
  amountMinor: number;
  waivedMinor: number;
  dueDate: Date;
  payments: { amountMinor: number }[];
}): FeeSummary {
  const paidMinor = fee.payments.reduce((sum, payment) => sum + payment.amountMinor, 0);
  const outstandingMinor = outstandingMinorOf(fee);
  const overdueDays = daysOverdue(fee.dueDate);
  const isOutstanding = outstandingMinor > 0;

  return {
    feeId: fee.id,
    description: fee.description,
    amountMinor: fee.amountMinor,
    waivedMinor: fee.waivedMinor,
    paidMinor,
    outstandingMinor,
    dueDate: fee.dueDate.toISOString(),
    // Paid in full is never overdue, however far past the due date it is.
    isOverdue: isOutstanding && overdueDays > 0,
    daysOverdue: isOutstanding ? overdueDays : 0,
  };
}
