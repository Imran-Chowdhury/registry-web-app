'use client';

import { useState } from 'react';

import { Money } from '@/components/shared/money';
import { Button, Dialog, Field, FormError, Textarea } from '@/components/ui';

import { useReversePayment } from '../hooks/use-fees';
import type { PaymentEntry } from '../types';

/** Reversing writes a counter-entry. Nothing is removed, and the dialog says so. */
export function ReversePaymentDialog({
  payment,
  studentId,
  open,
  onClose,
}: {
  payment: PaymentEntry;
  studentId: string;
  open: boolean;
  onClose: () => void;
}) {
  const reversePayment = useReversePayment(studentId);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();

  function submit() {
    if (reason.trim().length < 3) {
      setError('Give a reason for the reversal.');
      return;
    }
    setError(undefined);
    reversePayment.mutate(
      { paymentId: payment.id, input: { reason: reason.trim() } },
      { onSuccess: close },
    );
  }

  function close() {
    reversePayment.reset();
    setError(undefined);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Reverse this payment?"
      description="The payment stays on the ledger and a counter-entry is added beside it. The balance goes back up."
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={reversePayment.isPending}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={submit}
            pending={reversePayment.isPending}
            pendingLabel="Reversing…"
          >
            Reverse payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {reversePayment.error && <FormError>{reversePayment.error.message}</FormError>}

        <div className="rounded-control border border-rule bg-surface px-3 py-2 text-xs">
          <p className="font-mono">{payment.reference}</p>
          <p className="mt-0.5">
            <Money minor={payment.amountMinor} />
          </p>
        </div>

        <Field label="Reason" htmlFor="reversal-reason" required error={error}>
          <Textarea
            id="reversal-reason"
            value={reason}
            invalid={Boolean(error)}
            placeholder="Recorded against the wrong student."
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}
