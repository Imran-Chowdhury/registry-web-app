'use client';

import { useState } from 'react';

import { Money } from '@/components/shared/money';
import { Button, Dialog, Field, FormError, Input, Textarea } from '@/components/ui';
import { formatMoney, toMinor } from '@/lib/money';

import { useRecordPayment } from '../hooks/use-fees';
import { paymentFormSchema } from '../schema';
import type { FeeDetail } from '../types';

/**
 * The outstanding balance sits above the amount field and a "remaining after this
 * payment" line updates as the admin types, so the consequence of the figure is visible
 * before it is committed. An overpayment is blocked inline rather than by a toast after
 * the fact.
 */
export function RecordPaymentDialog({
  fee,
  studentId,
  open,
  onClose,
}: {
  fee: FeeDetail;
  studentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const recordPayment = useRecordPayment(studentId);

  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  /*
    The server's rejection is shown here, not only in a toast. A duplicate reference is a
    field error and belongs under the field — and a toast cannot be seen behind a modal
    dialog at all, because `showModal()` puts the dialog in the browser's top layer.
  */
  const serverError = recordPayment.error;
  const referenceTaken =
    serverError?.code === 'CONFLICT' && /reference/i.test(serverError.message);

  function close() {
    // Clears a stale rejection so reopening the dialog does not show the last failure.
    recordPayment.reset();
    setErrors({});
    onClose();
  }

  const amountMinor = /^\d+(\.\d{1,2})?$/.test(amount) ? toMinor(Number(amount)) : null;
  const remainingMinor =
    amountMinor === null ? fee.outstandingMinor : fee.outstandingMinor - amountMinor;
  const overpaying = amountMinor !== null && amountMinor > fee.outstandingMinor;

  function submit() {
    const parsed = paymentFormSchema.safeParse({ amount, paidAt, reference, note });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      return;
    }
    if (overpaying) return;

    setErrors({});
    recordPayment.mutate(
      {
        feeId: fee.feeId,
        amountMinor: toMinor(Number(parsed.data.amount)),
        paidAt: parsed.data.paidAt,
        reference: parsed.data.reference,
        note: parsed.data.note,
      },
      { onSuccess: close },
    );
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Record payment"
      description={`${fee.description} · ${formatMoney(fee.outstandingMinor)} outstanding`}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={recordPayment.isPending}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={overpaying}
            pending={recordPayment.isPending}
            pendingLabel="Recording…"
          >
            Record payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {serverError && !referenceTaken && <FormError>{serverError.message}</FormError>}

        <div className="flex items-baseline justify-between rounded-control border border-rule bg-surface px-3 py-2 text-xs">
          <span className="text-muted">Outstanding</span>
          <Money minor={fee.outstandingMinor} alert={fee.isOverdue} />
        </div>

        <Field
          label="Amount (USD)"
          htmlFor="payment-amount"
          required
          error={errors.amount ?? (overpaying ? overpaymentMessage(fee) : undefined)}
          hint={
            !overpaying && amountMinor !== null ? (
              <>
                Remaining after this payment: <Money minor={remainingMinor} />
              </>
            ) : undefined
          }
        >
          <Input
            id="payment-amount"
            mono
            inputMode="decimal"
            placeholder="100.00"
            value={amount}
            invalid={Boolean(errors.amount) || overpaying}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>

        <Field
          label="Payment date"
          htmlFor="payment-date"
          required
          error={errors.paidAt}
        >
          <Input
            id="payment-date"
            type="date"
            mono
            value={paidAt}
            invalid={Boolean(errors.paidAt)}
            onChange={(event) => setPaidAt(event.target.value)}
          />
        </Field>

        <Field
          label="Reference"
          htmlFor="payment-reference"
          required
          error={errors.reference ?? (referenceTaken ? serverError.message : undefined)}
          hint="Must be unique. The same reference cannot be recorded twice."
        >
          <Input
            id="payment-reference"
            mono
            placeholder="BANK-2026-0412"
            value={reference}
            invalid={Boolean(errors.reference) || referenceTaken}
            onChange={(event) => setReference(event.target.value)}
          />
        </Field>

        <Field label="Note" htmlFor="payment-note">
          <Textarea
            id="payment-note"
            rows={2}
            value={note}
            placeholder="Optional"
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}

function overpaymentMessage(fee: FeeDetail): string {
  return fee.outstandingMinor <= 0
    ? 'This fee is already settled in full.'
    : `That is more than the ${formatMoney(fee.outstandingMinor)} outstanding.`;
}
