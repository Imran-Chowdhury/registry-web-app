import 'server-only';

import { assessmentService } from '@/features/assessments/server';
import { feeService } from '@/features/fees/server';
import { studentService } from '@/features/students/server';
import { ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors';
import type { Viewer } from '@/lib/viewer';

import { averageGrade, classify } from '../classification';
import {
  ARREARS_WITHHOLD_REASON,
  bulkPublishSchema,
  saveGradeSchema,
  setResultStatusSchema,
  type BulkPublishInput,
  type SaveGradeInput,
  type SetResultStatusInput,
} from '../schema';
import type {
  BulkPublishResult,
  MarkingRow,
  Marksheet,
  MarksheetEntry,
  ResultEntry,
  StudentResultRow,
} from '../types';
import { resultRepo, type ResultRow, type ResultWithAssessmentRow } from './result.repo';

/**
 * There is no auth on this build, so every mark is attributed to the registry rather
 * than to a named user. Swapping in Auth.js replaces this constant with the signed-in
 * user and touches nothing else.
 */
const MARKED_BY = 'Registry staff';

export const resultService = {
  /**
   * The marking screen: one row per expected student, with their submission, their mark,
   * and their arrears.
   *
   * Composed here rather than in the assessments feature so the dependency runs one way
   * — results reads submissions and fees, and neither of them knows results exists.
   */
  async listMarkingQueue(viewer: Viewer, assessmentId: string): Promise<MarkingRow[]> {
    requireStaff(viewer);

    const submissions = await assessmentService.listSubmissions(viewer, assessmentId);
    const [results, arrears] = await Promise.all([
      resultRepo.findByAssessment(assessmentId),
      feeService.arrearsByStudent(
        viewer,
        submissions.map((row) => row.studentId),
      ),
    ]);

    const byStudent = new Map(results.map((result) => [result.studentId, result]));

    return submissions.map((row) => {
      const arrear = arrears.get(row.studentId) ?? null;

      return {
        ...row,
        result: toResultEntry(byStudent.get(row.studentId) ?? null),
        // Only surfaced when it is actually overdue: an unpaid fee that is not yet due
        // is not a reason to hesitate before publishing.
        arrears: arrear?.isOverdue ? arrear : null,
      };
    });
  },

  /**
   * Records a mark.
   *
   * Two rules the database has to answer, so they live here rather than in the Zod
   * schema:
   *  - a withdrawn student cannot be graded, the same way they cannot submit;
   *  - a grade against no submission needs a note. Marking an absent student zero is
   *    legitimate and expected, but it is the registry asserting an outcome rather than
   *    assessing work, and an unexplained zero is indistinguishable from a mistake a
   *    year later.
   */
  async saveGrade(viewer: Viewer, input: SaveGradeInput): Promise<ResultEntry> {
    requireStaff(viewer);
    const data = saveGradeSchema.parse(input);

    const student = await studentService.getById(viewer, data.studentId);
    if (student.status === 'WITHDRAWN') {
      throw new ForbiddenError('Withdrawn students cannot be graded.');
    }

    const submitted = await assessmentService.hasSubmitted(
      viewer,
      data.studentId,
      data.assessmentId,
    );

    const note = data.note?.trim() || null;
    if (!submitted && !note) {
      throw new ValidationError('The submitted data is invalid.', {
        note: ['There is no submission. Record why a grade is being given, e.g. "Absent".'],
      });
    }

    const row = await resultRepo.upsertGrade({
      studentId: data.studentId,
      assessmentId: data.assessmentId,
      grade: data.grade,
      note,
      markedBy: MARKED_BY,
    });

    return toResultEntry(row)!;
  },

  /**
   * Publish or withhold a single result.
   *
   * `WITHHELD` is not a quieter `DRAFT`: a draft is invisible to the student, while a
   * withheld result tells them a mark exists and why they cannot see it.
   */
  async setStatus(viewer: Viewer, input: SetResultStatusInput): Promise<ResultEntry> {
    requireStaff(viewer);
    const data = setResultStatusSchema.parse(input);

    const existing = await resultRepo.findOne(data.studentId, data.assessmentId);
    if (!existing) throw new NotFoundError('Result');
    if (existing.grade === null) {
      throw new ValidationError('Record a grade before publishing or withholding it.');
    }

    const publishing = data.action === 'PUBLISH';
    const row = await resultRepo.setStatus({
      studentId: data.studentId,
      assessmentId: data.assessmentId,
      status: publishing ? 'PUBLISHED' : 'WITHHELD',
      withheldReason: publishing ? null : data.withheldReason!.trim(),
      // The first publication timestamps it; re-publishing an edited mark keeps the
      // original date, which is what the student was told.
      publishedAt: publishing ? (existing.publishedAt ?? new Date()) : null,
    });

    return toResultEntry(row)!;
  },

  /**
   * Publish every marked-but-unpublished result on an assessment.
   *
   * With `withholdArrears` set — the default — students with an overdue balance are
   * withheld with a reason rather than skipped. Skipping would leave them in `DRAFT`,
   * which tells the student nothing at all; withholding tells them a result exists and
   * what to do about it.
   */
  async publishAll(viewer: Viewer, input: BulkPublishInput): Promise<BulkPublishResult> {
    requireStaff(viewer);
    const data = bulkPublishSchema.parse(input);

    const queue = await resultService.listMarkingQueue(viewer, data.assessmentId);

    /**
     * Drafts only. A withheld result is a decision someone already made with a reason
     * attached, and a bulk action should not quietly overwrite it — releasing one is a
     * deliberate, per-student act.
     */
    const pending = queue.filter(
      (row): row is MarkingRow & { result: ResultEntry } =>
        row.result !== null && row.result.grade !== null && row.result.status === 'DRAFT',
    );

    if (pending.length === 0) {
      throw new ValidationError('There is nothing marked and unpublished to release.');
    }

    const now = new Date();
    const entries = pending.map((row) => {
      const withhold = data.withholdArrears && row.arrears !== null;

      return {
        id: row.result.id,
        status: withhold ? ('WITHHELD' as const) : ('PUBLISHED' as const),
        withheldReason: withhold ? ARREARS_WITHHOLD_REASON : null,
        publishedAt: withhold ? null : now,
      };
    });

    await resultRepo.setStatusMany(entries);

    return {
      publishedCount: entries.filter((entry) => entry.status === 'PUBLISHED').length,
      withheldCount: entries.filter((entry) => entry.status === 'WITHHELD').length,
    };
  },

  /** Every result for one student, for the staff Results tab. Includes staff-only notes. */
  async listForStudent(viewer: Viewer, studentId: string): Promise<StudentResultRow[]> {
    requireStaff(viewer);

    const rows = await resultRepo.findByStudent(studentId);
    return rows.map(toStudentResultRow);
  },

  /**
   * The student's own marksheet. The id comes from the cookie-derived viewer and is
   * never accepted from the request.
   *
   * `DRAFT` rows are dropped entirely — not marked yet, so nothing to say. Withheld rows
   * are listed with their reason and without their grade.
   */
  async marksheetForSelf(viewer: Viewer): Promise<Marksheet> {
    if (viewer.role !== 'STUDENT') {
      throw new ForbiddenError('No student is selected.');
    }

    const rows = await resultRepo.findByStudent(viewer.studentId);

    const published: MarksheetEntry[] = [];
    const withheld: MarksheetEntry[] = [];

    for (const row of rows) {
      if (row.grade === null) continue;

      if (row.status === 'PUBLISHED') {
        published.push(toMarksheetEntry(row, { revealGrade: true }));
      } else if (row.status === 'WITHHELD') {
        withheld.push(toMarksheetEntry(row, { revealGrade: false }));
      }
    }

    const grades = published
      .map((entry) => entry.grade)
      .filter((grade): grade is number => grade !== null);
    const average = averageGrade(grades);

    return {
      published,
      withheld,
      averageGrade: average,
      averageClassification: classify(average),
      publishedCount: published.length,
    };
  },
};

function requireStaff(viewer: Viewer): void {
  if (viewer.role !== 'STAFF') {
    throw new ForbiddenError('That view is for registry staff.');
  }
}

function toResultEntry(row: ResultRow | null): ResultEntry | null {
  if (!row) return null;

  return {
    id: row.id,
    studentId: row.studentId,
    assessmentId: row.assessmentId,
    grade: row.grade,
    classification: classify(row.grade),
    status: row.status,
    withheldReason: row.withheldReason,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    markedBy: row.markedBy,
    note: row.note,
    updatedAt: row.updatedAt.toISOString(),
    // A second of slack: the publishing write itself moves `updatedAt`, and that is not
    // an edit anyone needs flagging.
    editedAfterPublish:
      row.publishedAt !== null &&
      row.updatedAt.getTime() - row.publishedAt.getTime() > 1_000,
  };
}

function toStudentResultRow(row: ResultWithAssessmentRow): StudentResultRow {
  return {
    ...toResultEntry(row)!,
    assessmentTitle: row.assessment.title,
    moduleCode: row.assessment.module.code,
    moduleName: row.assessment.module.name,
    deadline: row.assessment.deadline.toISOString(),
  };
}

function toMarksheetEntry(
  row: ResultWithAssessmentRow,
  options: { revealGrade: boolean },
): MarksheetEntry {
  return {
    assessmentId: row.assessmentId,
    assessmentTitle: row.assessment.title,
    moduleCode: row.assessment.module.code,
    moduleName: row.assessment.module.name,
    grade: options.revealGrade ? row.grade : null,
    classification: options.revealGrade ? classify(row.grade) : null,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    withheldReason: row.withheldReason,
  };
}
