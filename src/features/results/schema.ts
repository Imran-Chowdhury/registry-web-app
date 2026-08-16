import { z } from 'zod';

/**
 * The reason attached automatically when a bulk publish withholds a result for fee
 * arrears. Student-facing, so it states the cause and the next action and nothing else.
 */
export const ARREARS_WITHHOLD_REASON =
  'Outstanding balance on your account. Contact the Registry office.';

/**
 * Used when staff withhold without typing a reason.
 *
 * The reason field is optional for the person doing it, but a reason is never absent from
 * what the student reads: "withheld" with no explanation is the blank screen the withhold
 * feature exists to replace. This is also the copy a grade correction produces, since
 * withholding is how a published mark is reopened for editing.
 */
export const DEFAULT_WITHHOLD_REASON = 'Under review by the Registry.';

export const gradeSchema = z.coerce
  .number({ error: 'Enter a grade from 0 to 100.' })
  .int('Grades are whole numbers.')
  .min(0, 'The lowest grade is 0.')
  .max(100, 'The highest grade is 100.');

/**
 * Recording a mark. `note` is optional here and required by the service when there is no
 * submission behind the grade — a rule that needs the database to answer, so it cannot
 * live in the schema.
 */
export const saveGradeSchema = z.object({
  assessmentId: z.string().min(1, 'Select an assessment.'),
  studentId: z.string().min(1, 'Select a student.'),
  grade: gradeSchema,
  note: z.string().trim().max(280, 'Keep the note short.').optional(),
});

export type SaveGradeInput = z.input<typeof saveGradeSchema>;

/**
 * Two actions, not three.
 *
 * There is no `UNPUBLISH`: withholding is how a published mark is reopened for editing,
 * and it is the better of the two. Returning a result to `DRAFT` would make it vanish
 * from the student's marksheet with no explanation — the exact silence withholding
 * exists to replace.
 */
export const resultActions = ['PUBLISH', 'WITHHOLD'] as const;
export type ResultAction = (typeof resultActions)[number];

export const setResultStatusSchema = z.object({
  assessmentId: z.string().min(1, 'Select an assessment.'),
  studentId: z.string().min(1, 'Select a student.'),
  action: z.enum(resultActions),
  /** Optional here; the service falls back to `DEFAULT_WITHHOLD_REASON`. */
  withheldReason: z.string().trim().max(280, 'Keep the reason short.').optional(),
});

export type SetResultStatusInput = z.input<typeof setResultStatusSchema>;

export const bulkPublishSchema = z.object({
  assessmentId: z.string().min(1, 'Select an assessment.'),
  /**
   * Default true: the safe reading of the confirm dialog is that a student in arrears
   * does not get their result released by a bulk action.
   */
  withholdArrears: z.boolean().default(true),
});

export type BulkPublishInput = z.input<typeof bulkPublishSchema>;

/**
 * The marking screen's filter chips — the fast path to the three questions an admin
 * opens this screen to answer. `WITHHELD` joins the set here because it only becomes a
 * meaningful state once results exist.
 */
export const markingFilters = ['ALL', 'LATE', 'MISSING', 'UNMARKED', 'WITHHELD'] as const;
export type MarkingFilter = (typeof markingFilters)[number];

/**
 * Recording a mark for a student who never submitted.
 *
 * Deliberately a form of its own rather than an inline edit: marking work that does not
 * exist is the registry asserting an outcome, and it should take a decision to do it.
 * The reason is required for the same purpose — an unexplained zero against no
 * submission is indistinguishable from a mistake a year later.
 */
export const absentFormSchema = z.object({
  grade: gradeSchema,
  reason: z
    .string()
    .trim()
    .min(4, 'Record why a grade is being given without a submission.')
    .max(280, 'Keep the note short.'),
});

export type AbsentFormValues = z.infer<typeof absentFormSchema>;

export const withholdFormSchema = z.object({
  withheldReason: z.string().trim().max(280, 'Keep the reason short.').optional(),
});

export type WithholdFormValues = z.infer<typeof withholdFormSchema>;
