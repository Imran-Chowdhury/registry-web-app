import 'server-only';

import type { Prisma } from '@/generated/prisma/client';
import { db } from '@/lib/db';

/** Prisma calls only. */

const resultSelect = {
  id: true,
  studentId: true,
  assessmentId: true,
  grade: true,
  status: true,
  withheldReason: true,
  publishedAt: true,
  markedBy: true,
  note: true,
  updatedAt: true,
} satisfies Prisma.ResultSelect;

const resultWithAssessmentSelect = {
  ...resultSelect,
  assessment: {
    select: {
      title: true,
      deadline: true,
      module: { select: { code: true, name: true } },
    },
  },
} satisfies Prisma.ResultSelect;

export type ResultRow = Prisma.ResultGetPayload<{ select: typeof resultSelect }>;
export type ResultWithAssessmentRow = Prisma.ResultGetPayload<{
  select: typeof resultWithAssessmentSelect;
}>;

export const resultRepo = {
  findByAssessment(assessmentId: string): Promise<ResultRow[]> {
    return db.result.findMany({ where: { assessmentId }, select: resultSelect });
  },

  findByStudent(studentId: string): Promise<ResultWithAssessmentRow[]> {
    return db.result.findMany({
      where: { studentId },
      select: resultWithAssessmentSelect,
      orderBy: { assessment: { deadline: 'asc' } },
    });
  },

  findOne(studentId: string, assessmentId: string): Promise<ResultRow | null> {
    return db.result.findUnique({
      where: { studentId_assessmentId: { studentId, assessmentId } },
      select: resultSelect,
    });
  },

  /**
   * Marking is an upsert: the first grade creates the row, later edits move it. The
   * status is untouched here — publishing is a separate, deliberate act.
   */
  upsertGrade(input: {
    studentId: string;
    assessmentId: string;
    grade: number;
    note: string | null;
    markedBy: string;
  }): Promise<ResultRow> {
    const { studentId, assessmentId, grade, note, markedBy } = input;

    return db.result.upsert({
      where: { studentId_assessmentId: { studentId, assessmentId } },
      create: { studentId, assessmentId, grade, note, markedBy },
      update: { grade, note, markedBy },
      select: resultSelect,
    });
  },

  setStatus(input: {
    studentId: string;
    assessmentId: string;
    status: 'DRAFT' | 'PUBLISHED' | 'WITHHELD';
    withheldReason: string | null;
    publishedAt: Date | null;
  }): Promise<ResultRow> {
    const { studentId, assessmentId, ...data } = input;

    return db.result.update({
      where: { studentId_assessmentId: { studentId, assessmentId } },
      data,
      select: resultSelect,
    });
  },

  /**
   * Bulk publish, in one transaction. A partial bulk publish — some students released,
   * some not, because a write failed halfway — is the worst outcome available here.
   */
  setStatusMany(
    entries: {
      id: string;
      status: 'PUBLISHED' | 'WITHHELD';
      withheldReason: string | null;
      publishedAt: Date | null;
    }[],
  ): Promise<unknown> {
    return db.$transaction(
      entries.map((entry) =>
        db.result.update({
          where: { id: entry.id },
          data: {
            status: entry.status,
            withheldReason: entry.withheldReason,
            publishedAt: entry.publishedAt,
          },
          select: { id: true },
        }),
      ),
    );
  },
};
