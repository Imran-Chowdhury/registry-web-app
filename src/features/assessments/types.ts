export type ModuleOption = {
  id: string;
  code: string;
  name: string;
};

export type AssessmentListItem = {
  id: string;
  title: string;
  moduleCode: string;
  moduleName: string;
  deadline: string;
  maxAttempts: number;
  /** Deadline has passed. Computed at read time, never stored. */
  isClosed: boolean;
  /** Students on the module's programmes who are expected to submit. */
  expectedCount: number;
  submittedCount: number;
  lateCount: number;
  markedCount: number;
  /**
   * Submitted but not yet graded. Not `submittedCount − markedCount`: a mark can be
   * recorded against a student who never submitted (absent), so the two would drift.
   */
  unmarkedCount: number;
  /**
   * Marked, still `DRAFT`, and therefore genuinely awaiting release.
   *
   * Not `marked − published`: that would count a withheld result as pending, and a
   * withhold is a decision someone already made. Bulk publish acts on drafts only, so
   * anything reporting "ready to publish" has to count the same set or the dashboard
   * promises work the marking screen refuses to do.
   */
  awaitingPublishCount: number;
};

export type AssessmentDetail = AssessmentListItem & {
  moduleId: string;
};

export type SubmissionAttempt = {
  id: string;
  attempt: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  submittedAt: string;
  /** submittedAt is after the deadline. Recomputed whenever the deadline moves. */
  isLate: boolean;
  /** "2d 4h" — empty when on time. */
  delay: string;
};

/**
 * One row per expected student, submitted or not. A student who did not submit is
 * exactly who the admin is looking for, so absence is a row rather than a gap.
 */
export type SubmissionRow = {
  studentId: string;
  studentCode: string;
  studentName: string;
  studentStatus: 'ENROLLED' | 'DEFERRED' | 'WITHDRAWN' | 'COMPLETED';
  /** The active attempt — the latest one. Null when nothing was submitted. */
  latest: SubmissionAttempt | null;
  attemptCount: number;
  /** Earlier attempts, newest first. Kept for audit. */
  history: SubmissionAttempt[];
};

/** What a student sees for one of their own assessments. */
export type StudentAssessmentCard = {
  id: string;
  title: string;
  moduleCode: string;
  moduleName: string;
  deadline: string;
  isClosed: boolean;
  maxAttempts: number;
  latest: SubmissionAttempt | null;
  attemptCount: number;
  /** Whether a new upload would be accepted, and why not when it would not. */
  canSubmit: boolean;
  blockedReason: string | null;
};
