import { z } from 'zod';

/**
 * The reason attached automatically when a bulk publish withholds a result for fee
 * arrears. Student-facing, so it states the cause and the next action and nothing else.
 */
export const ARREARS_WITHHOLD_REASON =
  'Outstanding balance on your account. Contact the Registry office.';

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

export const resultActions = ['PUBLISH', 'WITHHOLD'] as const;
export type ResultAction = (typeof resultActions)[number];

export const setResultStatusSchema = z
  .object({
    assessmentId: z.string().min(1, 'Select an assessment.'),
    studentId: z.string().min(1, 'Select a student.'),
    action: z.enum(resultActions),
    withheldReason: z.string().trim().max(280, 'Keep the reason short.').optional(),
  })
  // A withheld result the student cannot see the reason for is the blank screen the
  // feature exists to avoid.
  .refine((value) => value.action !== 'WITHHOLD' || Boolean(value.withheldReason), {
    error: 'Give a reason the student will see.',
    path: ['withheldReason'],
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

export const withholdFormSchema = z.object({
  withheldReason: z
    .string()
    .trim()
    .min(4, 'Give a reason the student will see.')
    .max(280, 'Keep the reason short.'),
});

export type WithholdFormValues = z.infer<typeof withholdFormSchema>;
