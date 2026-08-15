'use client';

import { useState } from 'react';

import { Money } from '@/components/shared/money';
import {
  Badge,
  Button,
  EmptyState,
  Skeleton,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from '@/components/ui';
import { formatDate, formatDateShort } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { useStudentFees } from '../hooks/use-fees';
import type { FeeDetail, PaymentEntry } from '../types';
import { RecordPaymentDialog } from './record-payment-dialog';
import { ReversePaymentDialog } from './reverse-payment-dialog';

/** The Fees tab on a student record: the fee, its ledger, and a running outstanding. */
export function FeePanel({ studentId }: { studentId: string }) {
  const { data: fees, isPending, isError, error, refetch } = useStudentFees(studentId);
  const [payingFee, setPayingFee] = useState<FeeDetail | null>(null);
  const [reversing, setReversing] = useState<PaymentEntry | null>(null);

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        tone="alert"
        title="Couldn't load fees."
        description={error.message}
        action={
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (fees.length === 0) {
    return <EmptyState title="No fee assigned to this student." />;
  }

  return (
    <div className="space-y-8">
      {fees.map((fee) => (
        <section key={fee.feeId}>
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-base font-semibold">Fee</h3>
            <Button size="sm" onClick={() => setPayingFee(fee)}>
              Record payment
            </Button>
          </div>

          <dl className="mt-3 max-w-md space-y-1 font-mono text-sm">
            <Line label={fee.description} value={fee.amountMinor} />
            {fee.waivedMinor > 0 && <Line label="Waived" value={-fee.waivedMinor} muted />}
            <Line label="Paid" value={-fee.paidMinor} muted />
            <div className="!mt-2 flex items-baseline justify-between border-t border-rule pt-2">
              <dt className="font-medium">Outstanding</dt>
              <dd className="text-right">
                <Money minor={fee.outstandingMinor} alert={fee.isOverdue} />
                <span className="block text-xs">
                  {fee.isOverdue ? (
                    <span className="text-alert">
                      {fee.daysOverdue} day{fee.daysOverdue === 1 ? '' : 's'} overdue
                    </span>
                  ) : fee.outstandingMinor <= 0 ? (
                    <span className="text-muted">Paid in full</span>
                  ) : (
                    <span className="text-muted">due {formatDate(fee.dueDate)}</span>
                  )}
                </span>
              </dd>
            </div>
          </dl>

          <h3 className="mt-6 mb-2 text-base font-semibold">Payments</h3>
          {fee.payments.length === 0 ? (
            <EmptyState title="No payments recorded against this fee." />
          ) : (
            <PaymentLedger
              payments={fee.payments}
              onReverse={(payment) => setReversing(payment)}
            />
          )}
        </section>
      ))}

      {payingFee && (
        <RecordPaymentDialog
          key={payingFee.feeId + payingFee.paidMinor}
          fee={payingFee}
          studentId={studentId}
          open
          onClose={() => setPayingFee(null)}
        />
      )}

      {reversing && (
        <ReversePaymentDialog
          key={reversing.id}
          payment={reversing}
          studentId={studentId}
          open
          onClose={() => setReversing(null)}
        />
      )}
    </div>
  );
}

function Line({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className={cn('flex items-baseline justify-between', muted && 'text-muted')}>
      <dt>{label}</dt>
      <dd>
        <Money minor={value} />
      </dd>
    </div>
  );
}

/**
 * Reversed rows are struck through and tagged, never removed — the ledger has to show
 * what was recorded as well as what stands.
 */
function PaymentLedger({
  payments,
  onReverse,
}: {
  payments: PaymentEntry[];
  onReverse: (payment: PaymentEntry) => void;
}) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Date</TH>
          <TH>Reference</TH>
          <TH numeric>Amount</TH>
          <TH>Status</TH>
          <TH />
        </TR>
      </THead>
      <TBody>
        {payments.map((payment) => {
          const struck = payment.isReversed || payment.status === 'REVERSED';

          return (
            <TR key={payment.id} className={cn(struck && 'text-muted')}>
              <TD mono>{formatDateShort(payment.paidAt)}</TD>
              <TD mono className={cn(struck && 'line-through')}>
                {payment.reference}
                {payment.note && (
                  <span className="block font-sans text-xs text-muted no-underline">
                    {payment.note}
                  </span>
                )}
              </TD>
              <TD mono numeric className={cn(struck && 'line-through')}>
                <Money minor={payment.amountMinor} />
              </TD>
              <TD>
                {payment.reversalOf ? (
                  <Badge tone="alert">Reversal</Badge>
                ) : payment.status === 'REVERSED' ? (
                  <Badge tone="alert">Reversed</Badge>
                ) : (
                  <Badge tone="enrolled">Completed</Badge>
                )}
              </TD>
              <TD numeric>
                {payment.status === 'COMPLETED' && !payment.reversalOf && (
                  <Button size="sm" variant="ghost" onClick={() => onReverse(payment)}>
                    Reverse
                  </Button>
                )}
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
