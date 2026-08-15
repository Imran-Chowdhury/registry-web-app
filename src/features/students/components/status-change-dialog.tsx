'use client';

import { useState } from 'react';

import { Dialog, Button, Field, Select, Textarea } from '@/components/ui';

import { ENROLMENT_STATUSES, type EnrolmentStatusValue } from '../schema';
import { useChangeStatus } from '../hooks/use-students';
import { statusLabel } from './status-badge';

/**
 * A status change is an audited event, so the dialog says so. Withdrawing a student is
 * how a record is "deleted" here — the row and its fee history stay.
 */
export function StatusChangeDialog({
  studentId,
  currentStatus,
  open,
  onClose,
}: {
  studentId: string;
  currentStatus: EnrolmentStatusValue;
  open: boolean;
  onClose: () => void;
}) {
  const changeStatus = useChangeStatus(studentId);
  // Reset on reopen is handled by the caller remounting this component with a new key,
  // rather than by an effect that would fire a second render every time it opens.
  const [status, setStatus] = useState<EnrolmentStatusValue>(currentStatus);
  const [reason, setReason] = useState('');

  const unchanged = status === currentStatus;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Change enrolment status"
      description="This change will be recorded in the student's history."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={changeStatus.isPending}>
            Cancel
          </Button>
          <Button
            variant={status === 'WITHDRAWN' ? 'danger' : 'primary'}
            disabled={unchanged}
            pending={changeStatus.isPending}
            pendingLabel="Changing…"
            onClick={() =>
              changeStatus.mutate(
                { status, reason: reason.trim() || undefined },
                { onSuccess: onClose },
              )
            }
          >
            Change status
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="New status" htmlFor="new-status">
          <Select
            id="new-status"
            value={status}
            onChange={(event) => setStatus(event.target.value as EnrolmentStatusValue)}
          >
            {ENROLMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
                {value === currentStatus ? ' (current)' : ''}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Reason"
          htmlFor="status-reason"
          hint="Optional, but it is what makes the history useful later."
        >
          <Textarea
            id="status-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Deferring for one academic year on medical grounds."
          />
        </Field>

        {status === 'WITHDRAWN' && (
          <p className="rounded-control border border-alert/30 bg-alert/5 px-3 py-2 text-xs text-alert">
            A withdrawn student keeps their record and fee history, and cannot submit work
            or be graded.
          </p>
        )}
      </div>
    </Dialog>
  );
}
