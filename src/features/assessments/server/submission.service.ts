import 'server-only';

import { studentService } from '@/features/students/server';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { storeSubmissionFile } from '@/lib/storage';
import type { Viewer } from '@/lib/viewer';

import type { StudentAssessmentCard, SubmissionAttempt } from '../types';
import { assessmentRepo } from './assessment.repo';
import { toAttempt } from './assessment.service';
import { submissionRepo } from './submission.repo';

export const submissionService = {
  /**
   * A student's own assessments — those attached to modules on their programme, with
   * whatever they have submitted so far.
   */
  async listForSelf(viewer: Viewer): Promise<StudentAssessmentCard[]> {
    if (viewer.role !== 'STUDENT') {
      throw new ForbiddenError('No student is selected.');
    }

    const student = await studentService.getSelf(viewer);
    const [assessments, submissions] = await Promise.all([
      assessmentRepo.findForProgramme(student.programmeId),
      submissionRepo.findForStudent(viewer.studentId),
    ]);

    return assessments.map((assessment) => {
      const attempts = submissions
        .filter((submission) => submission.assessmentId === assessment.id)
        .map((submission) => toAttempt(submission, assessment.deadline))
        .sort((a, b) => b.attempt - a.attempt);

      const [latest] = attempts;
      const block = blockedReason({
        studentStatus: student.status,
        deadline: assessment.deadline,
        maxAttempts: assessment.maxAttempts,
        attemptCount: attempts.length,
      });

      return {
        id: assessment.id,
        title: assessment.title,
        moduleCode: assessment.module.code,
        moduleName: assessment.module.name,
        deadline: assessment.deadline.toISOString(),
        isClosed: assessment.deadline.getTime() < Date.now(),
        maxAttempts: assessment.maxAttempts,
        latest: latest ?? null,
        attemptCount: attempts.length,
        canSubmit: block === null,
        blockedReason: block,
      };
    });
  },

  /**
   * Records a new attempt. Attempts are versioned rather than overwritten, so the
   * earlier files stay available for audit.
   */
  async submit(
    viewer: Viewer,
    input: { assessmentId: string; file: File },
  ): Promise<SubmissionAttempt> {
    if (viewer.role !== 'STUDENT') {
      throw new ForbiddenError('Only a student can submit their own work.');
    }

    const student = await studentService.getSelf(viewer);
    const assessment = await assessmentRepo.findById(input.assessmentId);
    if (!assessment) throw new NotFoundError('Assessment');

    // The assessment must belong to a module on the student's programme, or a student
    // could submit to any assessment whose id they happened to learn.
    const onProgramme = assessment.module.programmes.some(
      (programme) => programme.id === student.programmeId,
    );
    if (!onProgramme) {
      throw new ForbiddenError('That assessment is not on your programme.');
    }

    const attemptCount = await submissionRepo.countAttempts(
      viewer.studentId,
      input.assessmentId,
    );

    const block = blockedReason({
      studentStatus: student.status,
      deadline: assessment.deadline,
      maxAttempts: assessment.maxAttempts,
      attemptCount,
    });
    if (block) throw new ConflictError(block);

    const attempt = attemptCount + 1;
    const stored = await storeSubmissionFile({
      file: input.file,
      assessmentId: input.assessmentId,
      studentId: viewer.studentId,
      attempt,
    });

    const created = await submissionRepo.create({
      studentId: viewer.studentId,
      assessmentId: input.assessmentId,
      attempt,
      ...stored,
    });

    return toAttempt(created, assessment.deadline);
  },

  /**
   * The bytes behind a submission. A student may download only their own work; staff
   * may download any. The check happens here, not in the route.
   */
  async getFileForDownload(viewer: Viewer, submissionId: string) {
    const submission = await submissionRepo.findById(submissionId);
    if (!submission) throw new NotFoundError('Submission');

    if (viewer.role === 'STUDENT' && viewer.studentId !== submission.studentId) {
      throw new ForbiddenError('You can only download your own submissions.');
    }

    return {
      filePath: submission.filePath,
      fileName: submission.fileName,
      mimeType: submission.mimeType,
    };
  },
};

/**
 * Why a submission would be refused, or null if it would be accepted.
 *
 * The rules, in the order they are checked:
 *  - a withdrawn student cannot submit work at all;
 *  - a first submission after the deadline is accepted, and flagged late — work handed
 *    in late is still work, and the registry needs the record;
 *  - a *replacement* after the deadline is refused, because the brief allows resubmission
 *    only before it;
 *  - an attempt cap, when the assessment sets one, applies before the deadline too.
 */
function blockedReason(input: {
  studentStatus: string;
  deadline: Date;
  maxAttempts: number;
  attemptCount: number;
}): string | null {
  const { studentStatus, deadline, maxAttempts, attemptCount } = input;

  if (studentStatus === 'WITHDRAWN') {
    return 'Withdrawn students cannot submit work.';
  }
  if (studentStatus === 'COMPLETED') {
    return 'This programme is complete. Contact the Registry office.';
  }

  const closed = deadline.getTime() < Date.now();
  if (closed && attemptCount > 0) {
    return 'The deadline has passed. A submission can only be replaced before it.';
  }
  if (maxAttempts > 0 && attemptCount >= maxAttempts) {
    return `You have used all ${maxAttempts} attempt${maxAttempts === 1 ? '' : 's'}.`;
  }

  return null;
}
