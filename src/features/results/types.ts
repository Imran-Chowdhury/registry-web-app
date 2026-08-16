import type { SubmissionRow } from '@/features/assessments';
import type { StudentArrears } from '@/features/fees';

import type { Classification } from './classification';

export type ResultStatusValue = 'DRAFT' | 'PUBLISHED' | 'WITHHELD';

/**
 * A marked result as staff see it.
 *
 * `note` is on this DTO and deliberately absent from everything the student reads: it is
 * the registry's own record of why a mark was awarded — most often "absent" — and free
 * text written for internal use should not become student-facing by accident. The
 * student-facing channel is `withheldReason`.
 */
export type ResultEntry = {
  id: string;
  studentId: string;
  assessmentId: string;
  grade: number | null;
  /** Derived from the grade on every read. Never stored. */
  classification: Classification | null;
  status: ResultStatusValue;
  withheldReason: string | null;
  publishedAt: string | null;
  markedBy: string | null;
  /** Staff-only. Required when a grade is recorded against no submission. */
  note: string | null;
  updatedAt: string;
  /**
   * Changed after it was published. Surfaced so staff can see that a student may be
   * looking at a mark that has since moved.
   */
  editedAfterPublish: boolean;
};

/**
 * A row on the marking screen: the submission, the mark, and the money.
 *
 * The three are on one row deliberately. A registry withholds results for fee arrears,
 * so the moment before publishing is exactly when an overdue balance needs to be visible
 * — going to look it up on another screen is how it stops happening.
 */
export type MarkingRow = SubmissionRow & {
  result: ResultEntry | null;
  /** Present only when the balance is actually overdue, not merely unpaid. */
  arrears: StudentArrears | null;
};

/** A row in the staff Results tab on a student record. */
export type StudentResultRow = ResultEntry & {
  assessmentTitle: string;
  moduleCode: string;
  moduleName: string;
  deadline: string;
};

/**
 * What a student sees. No `note`, no `markedBy`, and nothing in `DRAFT` — an unmarked or
 * still-being-marked result is not listed at all.
 */
export type MarksheetEntry = {
  assessmentId: string;
  assessmentTitle: string;
  moduleCode: string;
  moduleName: string;
  /** Null on a withheld entry: the student learns a result exists, not what it is. */
  grade: number | null;
  classification: Classification | null;
  publishedAt: string | null;
  withheldReason: string | null;
};

export type Marksheet = {
  published: MarksheetEntry[];
  /**
   * Marked but held back, with the reason. Kept separate from `published` because the
   * distinction between "not marked yet" and "marked but withheld" is the entire point
   * of the withhold feature.
   */
  withheld: MarksheetEntry[];
  /** Across published results only, with the count stated so the number cannot mislead. */
  averageGrade: number | null;
  averageClassification: Classification | null;
  publishedCount: number;
};

/** The outcome of a bulk publish, for the toast. */
export type BulkPublishResult = {
  publishedCount: number;
  withheldCount: number;
};
