import { z } from 'zod';

export const createAssessmentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, 'Give the assessment a title.')
    .max(140, 'That title is too long.'),
  moduleId: z.string().min(1, 'Select a module.'),
  deadline: z.coerce.date({ error: 'Enter a valid deadline.' }),
  /** 0 means unlimited attempts before the deadline — the default. */
  maxAttempts: z.coerce
    .number()
    .int()
    .min(0, 'Attempts cannot be negative.')
    .max(20, 'That many attempts is not a limit.')
    .default(0),
});

export type CreateAssessmentInput = z.input<typeof createAssessmentSchema>;

/** The form holds a `datetime-local` string, so no coercion here. */
export const assessmentFormSchema = z.object({
  title: z.string().trim().min(3, 'Give the assessment a title.').max(140),
  moduleId: z.string().min(1, 'Select a module.'),
  deadline: z
    .string()
    .min(1, 'Enter a deadline.')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid deadline.'),
  maxAttempts: z.number().int().min(0).max(20),
});

export type AssessmentFormValues = z.infer<typeof assessmentFormSchema>;

export const submissionFilters = ['ALL', 'LATE', 'MISSING', 'UNMARKED'] as const;
export type SubmissionFilter = (typeof submissionFilters)[number];
