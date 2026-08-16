'use client';

import { useState } from 'react';

import { Badge, Button, ConfirmDialog } from '@/components/ui';
import { formatDateTime } from '@/lib/dates';

import { useSetSubmissionsClosed } from '../hooks/use-assessments';

/**
 * The hard cutoff for late work.
 *
 * A deadline on its own never stops submission here — a first late submission is still
 * accepted and flagged, because a registry would rather have the work than a gap. That
 * leaves someone needing to say "that is everything" before marking can be finished, and
 * this is that control. Reopening is offered too: closing a day early is an easy mistake
 * and an expensive one to have no way back from.
 */
export function SubmissionCutoffControl({
  assessmentId,
  submissionsClosedAt,
  missingCount,
}: {
  assessmentId: string;
  submissionsClosedAt: string | null;
  /** Expected students with nothing submitted — who closing would leave with no work. */
  missingCount: number;
}) {
  const [confirming, setConfirming] = useState(false);
  const setClosed = useSetSubmissionsClosed(assessmentId);
  const closed = submissionsClosedAt !== null;

  return (
    <>
      <div className="flex items-center gap-3">
        {closed && (
          <Badge tone="withdrawn">
            Submissions closed {formatDateTime(submissionsClosedAt)}
          </Badge>
        )}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setConfirming(true)}
          disabled={setClosed.isPending}
        >
          {closed ? 'Reopen submissions' : 'Close submissions'}
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={closed ? 'Reopen submissions' : 'Close submissions'}
        description={
          closed
            ? 'Students will be able to submit again, and anything arriving after the deadline stays flagged as late.'
            : 'No further work will be accepted, including late work. The deadline itself does not move, so who was late does not change.'
        }
        confirmLabel={closed ? 'Reopen' : 'Close submissions'}
        pending={setClosed.isPending}
        onConfirm={() =>
          setClosed.mutate(!closed, { onSuccess: () => setConfirming(false) })
        }
      >
        {!closed && missingCount > 0 && (
          <p className="text-xs text-muted">
            {missingCount} expected {missingCount === 1 ? 'student has' : 'students have'}{' '}
            not submitted. Closing does not mark them — record each as absent from the
            queue below, so the reason is on the record.
          </p>
        )}
      </ConfirmDialog>
    </>
  );
}
