import { z } from 'zod';

/** Ten million dollars — a guard against a mistyped amount, not a business limit. */
const MAX_PAYMENT_MINOR = 1_000_000_00;

export const recordPaymentSchema = z.object({
  feeId: z.string().min(1, 'Select a fee.'),
  amountMinor: z
    .number()
    .int('Amounts are stored in whole cents.')
    .positive('Enter an amount greater than zero.')
    .max(MAX_PAYMENT_MINOR, 'That amount looks wrong — check the figure.'),
  paidAt: z.coerce.date({ error: 'Enter a valid payment date.' }),
  /**
   * The real-world double-entry guard. Unique across the registry, so re-submitting the
   * same bank reference is rejected rather than counted twice.
   */
  reference: z
    .string()
    .trim()
    .min(3, 'Enter the payment reference.')
    .max(64, 'That reference is too long.'),
  note: z
    .string()
    .trim()
    .max(280)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type RecordPaymentInput = z.input<typeof recordPaymentSchema>;

export const reversePaymentSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Give a reason for the reversal.')
    .max(280, 'Keep the reason under 280 characters.'),
});

export type ReversePaymentInput = z.infer<typeof reversePaymentSchema>;

/** The dialog holds dollars as typed; cents are what cross the wire. */
export const paymentFormSchema = z.object({
  amount: z
    .string()
    .min(1, 'Enter an amount.')
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), 'Enter an amount like 100.00.'),
  paidAt: z.string().min(1, 'Enter the payment date.'),
  reference: z.string().trim().min(3, 'Enter the payment reference.'),
  note: z.string().trim().max(280).optional(),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;
