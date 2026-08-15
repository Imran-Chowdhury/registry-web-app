'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Money } from '@/components/shared/money';
import {
  Badge,
  Button,
  EmptyState,
  Input,
  SkeletonTable,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
  TableCaption,
} from '@/components/ui';
import { formatDateShort } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { usePaymentLedger } from '../hooks/use-fees';

/** Every payment across every student, newest first. Searchable by reference or name. */
export function PaymentLedgerScreen() {
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(draft.trim()), 250);
    return () => clearTimeout(timer);
  }, [draft]);

  const { data, isPending, isError, error, refetch } = usePaymentLedger(
    search || undefined,
  );

  return (
    <>
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Search reference, name, or code"
        aria-label="Search payments"
        className="mb-4 max-w-xs"
      />

      {isPending ? (
        <div className="rounded-card border border-rule bg-paper">
          <SkeletonTable columns={['w-20', 'w-40', 'w-32', 'w-16', 'w-20']} />
        </div>
      ) : isError ? (
        <EmptyState
          tone="alert"
          title="Couldn't load payments."
          description={error.message}
          action={
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : data.length === 0 ? (
        <EmptyState
          title={search ? `No payments match “${search}”.` : 'No payments recorded yet.'}
          description={
            search
              ? 'Check the reference, or clear the search.'
              : 'Payments are recorded from a student’s record, on the Fees tab.'
          }
          action={
            search ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setDraft('');
                  setSearch('');
                }}
              >
                Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <TableCaption>
            {data.length} payment{data.length === 1 ? '' : 's'}
          </TableCaption>
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Student</TH>
                <TH>Reference</TH>
                <TH numeric>Amount</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {data.map((entry) => {
                const struck = entry.isReversed || entry.status === 'REVERSED';

                return (
                  <TR key={entry.id} className={cn(struck && 'text-muted')}>
                    <TD mono>{formatDateShort(entry.paidAt)}</TD>
                    <TD>
                      <Link
                        href={`/students/${entry.studentId}`}
                        className="underline underline-offset-2"
                      >
                        {entry.studentName}
                      </Link>
                      <span className="block font-mono text-xs text-muted">
                        {entry.studentCode}
                      </span>
                    </TD>
                    <TD mono className={cn(struck && 'line-through')}>
                      {entry.reference}
                    </TD>
                    <TD mono numeric className={cn(struck && 'line-through')}>
                      <Money minor={entry.amountMinor} />
                    </TD>
                    <TD>
                      {entry.reversalOf ? (
                        <Badge tone="alert">Reversal</Badge>
                      ) : entry.status === 'REVERSED' ? (
                        <Badge tone="alert">Reversed</Badge>
                      ) : (
                        <Badge tone="enrolled">Completed</Badge>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </>
      )}
    </>
  );
}
