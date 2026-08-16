'use client';

import { useState } from 'react';

import { Money } from '@/components/shared/money';
import { Button, Dialog, FormError } from '@/components/ui';

import { usePublishAll } from '../hooks/use-results';
import type { MarkingRow } from '../types';

/**
 * The bulk publish confirm.
 *
 * It names the count, and it lists the students in arrears rather than mentioning them
 * in passing — a registry withholds results for unpaid fees, and this dialog is the last
 * moment that decision can be made. The checkbox defaults to withholding them, which is
 * the cautious reading: a result released by accident cannot be unseen.
 */
export function PublishAllDialog({
  assessmentId,
  rows,
  open,
  onClose,
}: {
  assessmentId: string;
  rows: MarkingRow[];
  open: boolean;
  onClose: () => void;
}) {
  const [withholdArrears, setWithholdArrears] = useState(true);
  const publishAll = usePublishAll(assessmentId);

  const pending = rows.filter(
    (row) => row.result && row.result.grade !== null && row.result.status === 'DRAFT',
  );
  const inArrears = pending.filter((row) => row.arrears !== null);
  const releasing = withholdArrears ? pending.length - inArrears.length : pending.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Publish all marked results"
      description={
        pending.length === 0
          ? 'There is nothing marked and unpublished on this assessment.'
          : `${pending.length} marked result${pending.length === 1 ? '' : 's'} will become visible to students. A published result cannot be unseen — withhold instead if you are unsure.`
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={publishAll.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              publishAll.mutate(
                { assessmentId, withholdArrears },
                { onSuccess: onClose },
              )
            }
            disabled={pending.length === 0}
            pending={publishAll.isPending}
            pendingLabel="Publishing…"
          >
            {`Publish ${releasing} result${releasing === 1 ? '' : 's'}`}
          </Button>
        </>
      }
    >
      {publishAll.error && (
        <p className="mb-3">
          <FormError>{publishAll.error.message}</FormError>
        </p>
      )}

      {inArrears.length > 0 && (
        <div className="rounded-control border border-alert p-3">
          <p className="text-xs font-medium text-alert">
            ⚠ {inArrears.length} of these student{inArrears.length === 1 ? ' has' : 's have'}{' '}
            an overdue balance
          </p>

          <ul className="mt-2 flex flex-col gap-1">
            {inArrears.map((row) => (
              <li
                key={row.studentId}
                className="flex justify-between gap-3 font-mono text-xs tabular-nums"
              >
                <span>
                  {row.studentCode} {row.studentName}
                </span>
                <Money alert minor={row.arrears!.outstandingMinor} />
              </li>
            ))}
          </ul>

          <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={withholdArrears}
              onChange={(event) => setWithholdArrears(event.target.checked)}
            />
            <span>Withhold results for students in arrears</span>
          </label>

          <p className="mt-2 text-xs text-muted">
            {withholdArrears
              ? 'They will see that a result exists and that a balance is outstanding, rather than nothing at all.'
              : 'Their results will be published in full despite the outstanding balance.'}
          </p>
        </div>
      )}
    </Dialog>
  );
}
