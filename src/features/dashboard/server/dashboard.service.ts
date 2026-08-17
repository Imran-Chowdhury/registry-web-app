import 'server-only';

import { assessmentService } from '@/features/assessments/server';
import { studentService } from '@/features/students/server';
import { ForbiddenError } from '@/lib/errors';
import type { Viewer } from '@/lib/viewer';

import type { AccountBalance, DashboardSummary, ReadyToPublish } from '../types';

/** How many rows the overdue panel shows before deferring to the students list. */
const OVERDUE_PREVIEW_LIMIT = 5;
const OUTSTANDING_PREVIEW_LIMIT = 3;
const READY_PREVIEW_LIMIT = 3;

export const dashboardService = {
  /**
   * Composed from the feature services rather than from its own queries.
   *
   * A dashboard that reads the database directly is a dashboard that drifts: it would
   * grow a second definition of "overdue" and a second definition of "unmarked", and
   * the first time one of them changed the summary would quietly contradict the screen
   * it links to. This has no repository for that reason.
   */
  async summary(viewer: Viewer): Promise<DashboardSummary> {
    if (viewer.role !== 'STAFF') {
      throw new ForbiddenError('The registry dashboard is for staff.');
    }

    // `listAll`, not `list`: the tiles total the registry and the panel ranks the biggest
    // balances in it. Handed a page, both would return confident nonsense.
    const [students, assessments] = await Promise.all([
      studentService.listAll(viewer, {}),
      assessmentService.list(viewer),
    ]);

    const owing: AccountBalance[] = students
      .filter((student) => (student.fee?.outstandingMinor ?? 0) > 0)
      .map((student) => ({
        studentId: student.id,
        studentCode: student.studentCode,
        fullName: student.fullName,
        programmeCode: student.programmeCode,
        outstandingMinor: student.fee!.outstandingMinor,
        dueDate: student.fee!.dueDate,
        isOverdue: student.fee!.isOverdue,
        daysOverdue: student.fee!.daysOverdue,
      }));

    // Overdue first, worst debt first within it: the oldest debt is the first call.
    const overdueAccounts = owing
      .filter((account) => account.isOverdue)
      .sort((a, b) => b.daysOverdue - a.daysOverdue);

    // The fallback when nothing is overdue, ranked by size rather than by age — with no
    // debt yet late, the largest balance is the one worth chasing first.
    const topOutstanding = [...owing]
      .sort((a, b) => b.outstandingMinor - a.outstandingMinor)
      .slice(0, OUTSTANDING_PREVIEW_LIMIT);

    // Withdrawn students keep their fee history but are not who the registry chases
    // today, so they are counted in the money and not in the enrolled headcount.
    const enrolledCount = students.filter(
      (student) => student.status === 'ENROLLED',
    ).length;

    const totalOutstandingMinor = students.reduce(
      (total, student) => total + Math.max(0, student.fee?.outstandingMinor ?? 0),
      0,
    );

    const lateAssessments = assessments.filter((assessment) => assessment.lateCount > 0);
    const worst = [...lateAssessments].sort((a, b) => b.lateCount - a.lateCount)[0];

    const readyToPublish: ReadyToPublish[] = assessments
      .map(
        (assessment): ReadyToPublish => ({
          assessmentId: assessment.id,
          title: assessment.title,
          moduleCode: assessment.moduleCode,
          markedCount: assessment.markedCount,
          expectedCount: assessment.expectedCount,
          unpublishedCount: assessment.awaitingPublishCount,
        }),
      )
      .filter((entry) => entry.unpublishedCount > 0)
      .sort((a, b) => b.unpublishedCount - a.unpublishedCount);

    return {
      enrolledCount,
      totalOutstandingMinor,
      overdueCount: overdueAccounts.length,
      awaitingMarkingCount: assessments.reduce(
        (total, assessment) => total + assessment.unmarkedCount,
        0,
      ),
      overdueAccounts: overdueAccounts.slice(0, OVERDUE_PREVIEW_LIMIT),
      topOutstanding,
      lateWork: {
        lateCount: assessments.reduce(
          (total, assessment) => total + assessment.lateCount,
          0,
        ),
        assessmentCount: lateAssessments.length,
        worstAssessmentId: worst?.id ?? null,
        worstAssessmentTitle: worst?.title ?? null,
      },
      readyToPublish: readyToPublish.slice(0, READY_PREVIEW_LIMIT),
    };
  },
};
