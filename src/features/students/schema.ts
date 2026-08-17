import { z } from 'zod';

/**
 * One schema, both boundaries. The form validates against it in the browser for fast
 * feedback, and the route handler parses against it again on the server, because the
 * browser's copy is advice and the server's is the rule.
 */

export const ENROLMENT_STATUSES = [
  'ENROLLED',
  'DEFERRED',
  'WITHDRAWN',
  'COMPLETED',
] as const;

export const enrolmentStatusSchema = z.enum(ENROLMENT_STATUSES);
export type EnrolmentStatusValue = z.infer<typeof enrolmentStatusSchema>;

const MIN_AGE_YEARS = 15;
const MAX_AGE_YEARS = 100;

export const createStudentSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Enter the student’s full name.')
    .max(120, 'That name is too long.'),
  email: z.email('Enter a valid email address.').trim().toLowerCase(),
  dateOfBirth: z.coerce
    .date({ error: 'Enter a valid date of birth.' })
    .refine((date) => yearsSince(date) >= MIN_AGE_YEARS, {
      message: `Students must be at least ${MIN_AGE_YEARS} years old.`,
    })
    .refine((date) => yearsSince(date) <= MAX_AGE_YEARS, {
      message: 'Check the date of birth — that year looks wrong.',
    }),
  programmeId: z.string().min(1, 'Select a programme.'),
  academicYear: z.coerce
    .number()
    .int('Academic year must be a whole number.')
    .min(1, 'Academic year starts at 1.')
    .max(6, 'Academic year cannot be above 6.'),
  status: enrolmentStatusSchema.default('ENROLLED'),
});

export type CreateStudentInput = z.input<typeof createStudentSchema>;

/**
 * Status is absent on purpose. A status change is an audited event with its own reason,
 * not a field edit — see `changeStatusSchema`.
 */
export const updateStudentSchema = createStudentSchema
  .omit({ status: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Nothing to update.',
  });

/** `input`, not `infer`: callers send a date string, the schema coerces it to a Date. */
export type UpdateStudentInput = z.input<typeof updateStudentSchema>;

export const changeStatusSchema = z.object({
  status: enrolmentStatusSchema,
  reason: z
    .string()
    .trim()
    .max(500, 'Keep the reason under 500 characters.')
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type ChangeStatusInput = z.infer<typeof changeStatusSchema>;

/**
 * The form's view of the same rules.
 *
 * Every coercion is removed here so the schema's input and output types are identical —
 * react-hook-form holds exactly one shape, and `<input type="date">` genuinely does hand
 * back a `YYYY-MM-DD` string rather than a Date the form would only be pretending to
 * have. The server re-parses with `createStudentSchema`, which does the coercing.
 */
export const studentFormSchema = createStudentSchema.extend({
  academicYear: z
    .number()
    .int('Academic year must be a whole number.')
    .min(1, 'Academic year starts at 1.')
    .max(6, 'Academic year cannot be above 6.'),
  status: enrolmentStatusSchema,
  dateOfBirth: z
    .string()
    .min(1, 'Enter a date of birth.')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date of birth.')
    .refine(
      (value) => yearsSince(new Date(value)) >= MIN_AGE_YEARS,
      `Students must be at least ${MIN_AGE_YEARS} years old.`,
    )
    .refine(
      (value) => yearsSince(new Date(value)) <= MAX_AGE_YEARS,
      'Check the date of birth — that year looks wrong.',
    ),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;

export const studentFiltersSchema = z.object({
  /** Matches name, student code, or email. */
  search: z.string().trim().max(120).optional(),
  programmeId: z.string().min(1).optional(),
  status: enrolmentStatusSchema.optional(),
  /**
   * Arrears only. Unlike the others this is not a column — overdue is
   * `outstanding > 0 && dueDate < now`, computed from the fee and its payments — so the
   * service resolves it rather than the query. See `studentRepo.findOverdueCandidates`.
   *
   * A union rather than `z.coerce.boolean()`: coercion makes the string `"false"` true,
   * which would turn a link that says "not overdue" into one that says the opposite.
   */
  overdue: z.union([z.boolean(), z.stringbool()]).optional(),
});

export type StudentFilters = z.infer<typeof studentFiltersSchema>;

/**
 * A screenful. CLAUDE.md §13 puts the pagination threshold at 25 rows, so that is also
 * the page size — a registry admin scans a page rather than reading it.
 */
export const STUDENT_PAGE_SIZE = 25;

/**
 * Filters plus where in the results we are.
 *
 * Page is not a filter — it is a position — but it travels with the filters through the
 * URL, the query key, and the service, so one schema parses the lot. `pageSize` is
 * capped: it arrives from a query string, and an uncapped one is an invitation to ask
 * for the whole table in a single request.
 */
export const studentQuerySchema = studentFiltersSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(STUDENT_PAGE_SIZE),
});

export type StudentQuery = z.infer<typeof studentQuerySchema>;

/**
 * The query the list starts on.
 *
 * Both the server prefetch and the client store must produce this exact object, or the
 * two query keys differ, the hydrated page is discarded, and the list refetches on
 * mount. One constant, so they cannot drift.
 */
export const DEFAULT_STUDENT_QUERY: StudentQuery = studentQuerySchema.parse({});

function yearsSince(date: Date): number {
  const now = new Date();
  let years = now.getUTCFullYear() - date.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - date.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < date.getUTCDate())) {
    years -= 1;
  }
  return years;
}
