import { Money } from '@/components/shared/money';
import { Card, CardBody, CardHeader } from '@/components/ui';
import { formatDate } from '@/lib/dates';

import type { FeeDetail } from '../types';

/**
 * The student's own view of what they owe. A different rhythm from the staff table:
 * one figure, one bar, and — if it applies — one clear next action.
 */
export function StudentFeeSummary({ fees }: { fees: FeeDetail[] }) {
  if (fees.length === 0) {
    return (
      <Card>
        <CardHeader title="Fees" />
        <CardBody>
          <p className="text-muted">No fees have been assigned to your account.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {fees.map((fee) => (
        <div key={fee.feeId} className="space-y-4">
          <Card>
            <CardHeader title="Fees" />
            <CardBody>
              <p className="font-mono">
                <Money minor={fee.paidMinor} /> paid of{' '}
                <Money minor={fee.amountMinor - fee.waivedMinor} />
              </p>
              <ProgressBar
                paidMinor={fee.paidMinor}
                totalMinor={fee.amountMinor - fee.waivedMinor}
                overdue={fee.isOverdue}
              />
              <p className="mt-2 text-xs text-muted">
                {fee.outstandingMinor <= 0
                  ? 'Paid in full.'
                  : `Due ${formatDate(fee.dueDate)}.`}
              </p>
            </CardBody>
          </Card>

          {/*
            A bordered block, not a toast: an overdue balance has to persist across
            visits. The copy states the facts and gives the next action — it never
            scolds, because the student may not be the one who pays.
          */}
          {fee.isOverdue && (
            <div className="rounded-card border border-alert bg-alert/5 px-4 py-3">
              <p className="font-medium text-alert">⚠ Payment overdue</p>
              <p className="mt-1">
                <Money minor={fee.outstandingMinor} alert /> was due{' '}
                {formatDate(fee.dueDate)}, {fee.daysOverdue} day
                {fee.daysOverdue === 1 ? '' : 's'} ago.
              </p>
              <p className="mt-1 text-muted">
                Contact the Registry office to arrange payment.
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ProgressBar({
  paidMinor,
  totalMinor,
  overdue,
}: {
  paidMinor: number;
  totalMinor: number;
  overdue: boolean;
}) {
  const percent = totalMinor <= 0 ? 100 : Math.min(100, (paidMinor / totalMinor) * 100);
  const settled = percent >= 100;

  return (
    <div
      className="mt-2 h-2 w-full overflow-hidden rounded-full bg-rule"
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Fees paid"
    >
      <div
        className={
          settled ? 'h-full bg-enrolled' : overdue ? 'h-full bg-alert' : 'h-full bg-ink'
        }
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
