import type { FeeSummary } from '@/features/fees';

import type { EnrolmentStatusValue } from './schema';

/**
 * DTOs sent to the client. Prisma models never cross this line — dates are serialised as
 * ISO strings so they survive the server/client boundary intact.
 *
 * The balance shape comes from the fees feature through its public surface: one
 * definition of what a student owes, used by both the list and the fee panel.
 */
export type { FeeSummary };

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
