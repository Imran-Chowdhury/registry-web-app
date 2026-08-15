/** Derived on every read, never stored. A stored balance goes stale silently. */
export type FeeSummary = {
  feeId: string;
  description: string;
  amountMinor: number;
  waivedMinor: number;
  paidMinor: number;
  /** amountMinor − waivedMinor − completed payments. */
  outstandingMinor: number;
  dueDate: string;
  /** outstanding > 0 and the due date has passed. */
  isOverdue: boolean;
  /** Whole days past due. Zero when not overdue — a boolean alone hides severity. */
  daysOverdue: number;
};

export type PaymentStatusValue = 'COMPLETED' | 'REVERSED';

export type PaymentEntry = {
  id: string;
  amountMinor: number;
  paidAt: string;
  reference: string;
  status: PaymentStatusValue;
  /** Set on the counter-entry that reverses another payment. */
  reversalOf: string | null;
  note: string | null;
  /** True when this payment has been reversed by a later counter-entry. */
  isReversed: boolean;
};

export type FeeDetail = FeeSummary & {
  studentId: string;
  payments: PaymentEntry[];
};

/** A row in the all-students payments ledger. */
export type LedgerEntry = PaymentEntry & {
  studentId: string;
  studentCode: string;
  studentName: string;
};
