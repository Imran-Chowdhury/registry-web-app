'use client';

import { useState } from 'react';

import { Button, Dialog, Field, Textarea } from '@/components/ui';

import { DEFAULT_WITHHOLD_REASON, withholdFormSchema } from '../schema';

/**
 * Withholding is two jobs in one control: holding a result back on purpose, and reopening
 * a published mark so its grade can be corrected.
 *
 * The reason is optional to type and never absent from what the student reads — the box
 * starts on a neutral default that suits a correction, and gets overwritten when the real
 * reason is arrears or misconduct. A student who sees "withheld" and nothing else has
 * learned no more than one who sees a blank row, which is the whole point of the state.
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
  const [reason, setReason] = useState(DEFAULT_WITHHOLD_REASON);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const parsed = withholdFormSchema.safeParse({ withheldReason: reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Keep the reason short.');
      return;
    }

    setError(null);
    // Left blank on purpose: the service substitutes the default rather than showing the
    // student a bare "withheld".
    onConfirm(parsed.data.withheldReason ?? '');
  }

  function close() {
    setReason(DEFAULT_WITHHOLD_REASON);
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
        hint={`Shown to the student on their marksheet. Leave it as it is for a correction, or state the cause and the next step. Blank falls back to “${DEFAULT_WITHHOLD_REASON}”`}
      >
        <Textarea
          id="withheld-reason"
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder={DEFAULT_WITHHOLD_REASON}
        />
      </Field>
    </Dialog>
  );
}
