import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';

/** Prisma calls only. */

const assessmentSelect = {
  id: true,
  title: true,
  deadline: true,
  maxAttempts: true,
  moduleId: true,
  module: {
    select: {
      code: true,
      name: true,
      programmes: { select: { id: true } },
    },
  },
  submissions: {
    select: {
      id: true,
      studentId: true,
      attempt: true,
      submittedAt: true,
      // The marking queue links straight to the file, so the row needs enough to label
      // and size the link — without them the download renders as an empty anchor.
      fileName: true,
      fileSize: true,
      mimeType: true,
    },
    orderBy: { attempt: 'desc' as const },
  },
  results: {
    // `publishedAt` outlives an unpublish, so it is what tells the submission rules that
    // a student has been shown this mark at some point — see `submission.service.ts`.
    select: { studentId: true, grade: true, status: true, publishedAt: true },
  },
} satisfies Prisma.AssessmentSelect;

export type AssessmentRow = Prisma.AssessmentGetPayload<{
  select: typeof assessmentSelect;
}>;

export const assessmentRepo = {
  findMany(): Promise<AssessmentRow[]> {
    return db.assessment.findMany({
      select: assessmentSelect,
      orderBy: { deadline: 'asc' },
    });
  },

  findById(id: string): Promise<AssessmentRow | null> {
    return db.assessment.findUnique({ where: { id }, select: assessmentSelect });
  },

  /** Assessments on the modules attached to a student's programme. */
  findForProgramme(programmeId: string): Promise<AssessmentRow[]> {
    return db.assessment.findMany({
      where: { module: { programmes: { some: { id: programmeId } } } },
      select: assessmentSelect,
      orderBy: { deadline: 'asc' },
    });
  },

  create(data: {
    title: string;
    moduleId: string;
    deadline: Date;
    maxAttempts: number;
  }) {
    return db.assessment.create({ data, select: { id: true } });
  },

  /**
   * The students expected to submit: everyone on a programme the module belongs to,
   * excluding those who cannot submit or have already finished.
   */
  findExpectedStudents(programmeIds: string[]) {
    return db.student.findMany({
      where: {
        programmeId: { in: programmeIds },
        status: { in: ['ENROLLED', 'DEFERRED'] },
      },
      select: { id: true, studentCode: true, fullName: true, status: true },
      orderBy: { studentCode: 'asc' },
    });
  },

  findModules() {
    return db.module.findMany({
      select: { id: true, code: true, name: true },
      orderBy: { code: 'asc' },
    });
  },
};
