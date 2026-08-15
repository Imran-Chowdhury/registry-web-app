import 'server-only';

import { formatDelay } from '@/lib/dates';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import type { Viewer } from '@/lib/viewer';

import { createAssessmentSchema, type CreateAssessmentInput } from '../schema';
import type {
  AssessmentDetail,
  AssessmentListItem,
  ModuleOption,
  SubmissionAttempt,
  SubmissionRow,
} from '../types';
import { assessmentRepo, type AssessmentRow } from './assessment.repo';

export const assessmentService = {
  async list(viewer: Viewer): Promise<AssessmentListItem[]> {
    requireStaff(viewer);

    const rows = await assessmentRepo.findMany();
    return Promise.all(rows.map((row) => toListItem(row)));
  },

  async getById(viewer: Viewer, id: string): Promise<AssessmentDetail> {
    requireStaff(viewer);

    const row = await assessmentRepo.findById(id);
    if (!row) throw new NotFoundError('Assessment');

    return { ...(await toListItem(row)), moduleId: row.moduleId };
  },

  /**
   * One row per expected student, whether or not they submitted. A gap in the table
   * would hide exactly the students an admin is looking for.
   */
  async listSubmissions(viewer: Viewer, assessmentId: string): Promise<SubmissionRow[]> {
    requireStaff(viewer);

    const row = await assessmentRepo.findById(assessmentId);
    if (!row) throw new NotFoundError('Assessment');

    const students = await assessmentRepo.findExpectedStudents(
      row.module.programmes.map((programme) => programme.id),
    );

    const byStudent = groupSubmissions(row, row.deadline);

    return students.map((student) => {
      const attempts = byStudent.get(student.id) ?? [];
      const [latest, ...history] = attempts;

      return {
        studentId: student.id,
        studentCode: student.studentCode,
        studentName: student.fullName,
        studentStatus: student.status,
        latest: latest ?? null,
        attemptCount: attempts.length,
        history,
      };
    });
  },

  async create(viewer: Viewer, input: CreateAssessmentInput): Promise<AssessmentDetail> {
    requireStaff(viewer);
    const data = createAssessmentSchema.parse(input);

    const created = await assessmentRepo.create({
      title: data.title,
      moduleId: data.moduleId,
      deadline: data.deadline,
      maxAttempts: data.maxAttempts,
    });

    return assessmentService.getById(viewer, created.id);
  },

  async listModules(viewer: Viewer): Promise<ModuleOption[]> {
    requireStaff(viewer);
    return assessmentRepo.findModules();
  },
};

function requireStaff(viewer: Viewer): void {
  if (viewer.role !== 'STAFF') {
    throw new ForbiddenError('That view is for registry staff.');
  }
}

/**
 * Lateness is derived from the deadline on every read, never persisted. Moving a
 * deadline therefore re-flags every submission correctly instead of leaving a stale
 * boolean behind.
 */
export function toAttempt(
  submission: { id: string; attempt: number; submittedAt: Date } & Partial<{
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>,
  deadline: Date,
): SubmissionAttempt {
  const isLate = submission.submittedAt.getTime() > deadline.getTime();

  return {
    id: submission.id,
    attempt: submission.attempt,
    fileName: submission.fileName ?? '',
    fileSize: submission.fileSize ?? 0,
    mimeType: submission.mimeType ?? '',
    submittedAt: submission.submittedAt.toISOString(),
    isLate,
    delay: isLate ? formatDelay(deadline, submission.submittedAt) : '',
  };
}

/** Attempts per student, newest first — the first entry is the active one. */
function groupSubmissions(
  row: AssessmentRow,
  deadline: Date,
): Map<string, SubmissionAttempt[]> {
  const byStudent = new Map<string, SubmissionAttempt[]>();

  for (const submission of row.submissions) {
    const attempts = byStudent.get(submission.studentId) ?? [];
    attempts.push(toAttempt(submission, deadline));
    byStudent.set(submission.studentId, attempts);
  }

  for (const attempts of byStudent.values()) {
    attempts.sort((a, b) => b.attempt - a.attempt);
  }

  return byStudent;
}

async function toListItem(row: AssessmentRow): Promise<AssessmentListItem> {
  const expected = await assessmentRepo.findExpectedStudents(
    row.module.programmes.map((programme) => programme.id),
  );
  const expectedIds = new Set(expected.map((student) => student.id));

  // Counted per student, not per row: three attempts from one student is one submission.
  // `submissions` arrives ordered by attempt descending, so the first row seen for a
  // student is their active attempt — the one lateness is judged on.
  const latestByStudent = new Map<string, Date>();
  for (const submission of row.submissions) {
    if (!expectedIds.has(submission.studentId)) continue;
    if (!latestByStudent.has(submission.studentId)) {
      latestByStudent.set(submission.studentId, submission.submittedAt);
    }
  }

  let lateCount = 0;
  for (const submittedAt of latestByStudent.values()) {
    if (submittedAt.getTime() > row.deadline.getTime()) lateCount += 1;
  }

  const markedCount = row.results.filter(
    (result) => result.grade !== null && expectedIds.has(result.studentId),
  ).length;

  return {
    id: row.id,
    title: row.title,
    moduleCode: row.module.code,
    moduleName: row.module.name,
    deadline: row.deadline.toISOString(),
    maxAttempts: row.maxAttempts,
    isClosed: row.deadline.getTime() < Date.now(),
    expectedCount: expected.length,
    submittedCount: latestByStudent.size,
    lateCount,
    markedCount,
  };
}
