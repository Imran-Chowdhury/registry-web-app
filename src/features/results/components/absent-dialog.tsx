'use client';

import { useState } from 'react';

import { Button, Dialog, Field, FormError, Input, Textarea } from '@/components/ui';

import { absentFormSchema } from '../schema';

const DEFAULT_REASON = 'Absent — no submission received.';

/**
 * Grading a student who did not submit.
 *
 * The inline grade box is disabled on those rows on purpose: marking work that was never
 * handed in is a different act from marking work that was, and it should not be reachable
 * by tabbing into the wrong row. Absence still has to be recordable — a student who never
 * submits would otherwise stay `Unmarked` forever and drop silently out of their own
 * average — so it gets a deliberate path instead of no path.
 */
export function AbsentDialog({
  open,
  studentName,
  pending,
  serverError,
  onClose,
  onConfirm,
}: {
  open: boolean;
  studentName: string;
  pending: boolean;
  /** The server's rejection, shown here because a toast cannot be seen behind a modal. */
  serverError?: string;
  onClose: () => void;
  onConfirm: (input: { grade: number; reason: string }) => void;
}) {
  const [grade, setGrade] = useState('0');
  const [reason, setReason] = useState(DEFAULT_REASON);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit() {
    const parsed = absentFormSchema.safeParse({ grade, reason });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        next[String(issue.path[0])] = issue.message;
      }
      setErrors(next);
      return;
    }

    setErrors({});
    onConfirm({ grade: parsed.data.grade, reason: parsed.data.reason });
  }

  function close() {
    setGrade('0');
    setReason(DEFAULT_REASON);
    setErrors({});
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Record a mark without a submission"
      description={`${studentName} has not submitted. The mark and the reason are both kept on the record.`}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={submit} pending={pending} pendingLabel="Recording…">
            Record mark
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        {serverError && <FormError>{serverError}</FormError>}

        <Field
          label="Grade"
          htmlFor="absent-grade"
          error={errors.grade}
          hint="Zero unless the registry has agreed otherwise."
          required
        >
          <Input
            id="absent-grade"
            mono
            inputMode="numeric"
            className="w-20 text-center"
            value={grade}
            invalid={Boolean(errors.grade)}
            onChange={(event) => setGrade(event.target.value)}
          />
        </Field>

        <Field
          label="Reason"
          htmlFor="absent-reason"
          error={errors.reason}
          hint="Kept on the student record for staff. Not shown on their marksheet."
          required
        >
          <Textarea
            id="absent-reason"
            rows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
      </div>
    </Dialog>
  );
}
