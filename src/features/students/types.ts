import type { EnrolmentStatusValue } from './schema';

/**
 * DTOs sent to the client. Prisma models never cross this line — dates are serialised as
 * ISO strings so they survive the server/client boundary intact.
 */

/** Derived on every read, never stored. Storing a balance guarantees it goes stale. */
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

export type StudentListItem = {
  id: string;
  studentCode: string;
  fullName: string;
  email: string;
  programmeCode: string;
  programmeName: string;
  academicYear: number;
  status: EnrolmentStatusValue;
  fee: FeeSummary | null;
};

export type StatusChangeEntry = {
  id: string;
  fromStatus: EnrolmentStatusValue | null;
  toStatus: EnrolmentStatusValue;
  reason: string | null;
  changedAt: string;
};

export type StudentDetail = StudentListItem & {
  dateOfBirth: string;
  intakeYear: number;
  programmeId: string;
  createdAt: string;
  statusHistory: StatusChangeEntry[];
};

export type StudentListResult = {
  students: StudentListItem[];
  /** Total matching the current filters, for the result count line. */
  total: number;
  /** Of those, how many are overdue — the number an admin actually scans for. */
  overdueCount: number;
};

/** The switcher's options, resolved server-side. */
export type StudentPickerOption = {
  id: string;
  fullName: string;
  studentCode: string;
  programmeCode: string;
};
