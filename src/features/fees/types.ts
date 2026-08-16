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

/**
 * A student's arrears rolled up across all their fee assignments.
 *
 * Exists so other features can ask "does this student owe money?" without reaching into
 * the fees tables themselves. The publish flow is the caller that matters: a registry
 * withholds results for arrears, so the marking screen has to know.
 */
export type StudentArrears = {
  studentId: string;
  /** Summed across every fee assignment. Never negative. */
  outstandingMinor: number;
  isOverdue: boolean;
  /** The worst of them — the oldest debt is the one worth naming. */
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
