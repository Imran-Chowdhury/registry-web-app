import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';

/** Prisma calls only. Attempts are inserted, never overwritten. */

const submissionSelect = {
  id: true,
  studentId: true,
  assessmentId: true,
  attempt: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  mimeType: true,
  submittedAt: true,
} satisfies Prisma.SubmissionSelect;

export type SubmissionRecord = Prisma.SubmissionGetPayload<{
  select: typeof submissionSelect;
}>;

export const submissionRepo = {
  findForAssessment(assessmentId: string): Promise<SubmissionRecord[]> {
    return db.submission.findMany({
      where: { assessmentId },
      select: submissionSelect,
      orderBy: [{ studentId: 'asc' }, { attempt: 'desc' }],
    });
  },

  findForStudent(studentId: string): Promise<SubmissionRecord[]> {
    return db.submission.findMany({
      where: { studentId },
      select: submissionSelect,
      orderBy: [{ assessmentId: 'asc' }, { attempt: 'desc' }],
    });
  },

  findById(id: string) {
    return db.submission.findUnique({
      where: { id },
      select: { ...submissionSelect, assessment: { select: { deadline: true } } },
    });
  },

  countAttempts(studentId: string, assessmentId: string) {
    return db.submission.count({ where: { studentId, assessmentId } });
  },

  create(data: {
    studentId: string;
    assessmentId: string;
    attempt: number;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
  }): Promise<SubmissionRecord> {
    return db.submission.create({ data, select: submissionSelect });
  },
};
