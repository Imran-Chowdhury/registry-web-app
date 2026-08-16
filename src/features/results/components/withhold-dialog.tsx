'use client';

import { useState } from 'react';

import { Button, Dialog, Field, Textarea } from '@/components/ui';

import { withholdFormSchema } from '../schema';

/**
 * Withholding always captures a reason, because the reason is the feature. A student who
 * sees "withheld" and nothing else has learned no more than one who sees a blank row.
 */
export function WithholdDialog({
  open,
  studentName,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  studentName: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = withholdFormSchema.safeParse({ withheldReason: reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Give a reason the student will see.');
      return;
    }

    setError(null);
    onConfirm(parsed.data.withheldReason);
  }

  function close() {
    setReason('');
    setError(null);
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Withhold this result"
      description={`${studentName} will see that a result exists and why it is being held, but not the mark.`}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} pending={pending} pendingLabel="Withholding…">
            Withhold result
          </Button>
        </>
      }
    >
      <Field
        label="Reason"
        htmlFor="withheld-reason"
        error={error ?? undefined}
        hint="Shown to the student on their marksheet. State the cause and the next step."
        required
      >
        <Textarea
          id="withheld-reason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Outstanding balance on your account. Contact the Registry office."
        />
      </Field>
    </Dialog>
  );
}
