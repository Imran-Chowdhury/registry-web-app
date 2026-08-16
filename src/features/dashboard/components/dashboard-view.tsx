import Link from 'next/link';

import { Money } from '@/components/shared/money';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui';
import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';

import type { DashboardSummary } from '../types';
import { StatTile } from './stat-tile';

/**
 * The dashboard, assembled last and deliberately: every pattern on it already exists
 * elsewhere, so building it here costs almost nothing and keeps it consistent with the
 * screens it links to.
 *
 * No charts. A registry admin has no use for a pie chart of enrolment status, and it
 * reads as padding on a screen whose whole job is to name today's exceptions.
 */
export function DashboardView({ summary }: { summary: DashboardSummary }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile value={summary.enrolledCount} label="students enrolled" />
        <StatTile
          value={formatMoney(summary.totalOutstandingMinor)}
          label="outstanding"
        />
        <StatTile
          value={summary.overdueCount}
          label="overdue students"
          alert={summary.overdueCount > 0}
        />
        <StatTile value={summary.awaitingMarkingCount} label="awaiting marking" />
      </div>

      <section className="mt-8">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-base font-semibold">Overdue accounts</h2>
          <Link href="/students" className="text-xs underline underline-offset-2">
            View all students →
          </Link>
        </div>

        {summary.overdueAccounts.length === 0 ? (
          <p className="rounded-card border border-rule bg-paper px-4 py-3 text-sm text-muted">
            No overdue accounts.{' '}
            {summary.nextDueDate
              ? `Next payment due ${formatDate(summary.nextDueDate)}.`
              : 'Nothing is outstanding.'}
          </p>
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Code</TH>
                <TH>Name</TH>
                <TH>Programme</TH>
                <TH numeric>Outstanding</TH>
                <TH numeric>Overdue</TH>
              </TR>
            </THead>
            <TBody>
              {/* Sorted by days overdue descending — the oldest debt is the first call. */}
              {summary.overdueAccounts.map((account) => (
                <TR key={account.studentId} flagged>
                  <TD mono>
                    <Link
                      href={`/students/${account.studentId}`}
                      className="underline underline-offset-2"
                    >
                      {account.studentCode}
                    </Link>
                  </TD>
                  <TD>{account.fullName}</TD>
                  <TD mono className="text-muted">
                    {account.programmeCode}
                  </TD>
                  <TD numeric>
                    <Money alert minor={account.outstandingMinor} />
                  </TD>
                  <TD mono numeric className="text-alert">
                    {account.daysOverdue} days
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </section>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <LateWorkPanel summary={summary} />
        <ReadyToPublishPanel summary={summary} />
      </div>
    </>
  );
}

function LateWorkPanel({ summary }: { summary: DashboardSummary }) {
  const { lateCount, assessmentCount, worstAssessmentId, worstAssessmentTitle } =
    summary.lateWork;

  return (
    <section>
      <h2 className="mb-2 text-base font-semibold">Late submissions</h2>
      <div className="rounded-card border border-rule bg-paper px-4 py-4">
        {lateCount === 0 ? (
          <p className="text-sm text-muted">
            No late submissions. Everything in so far arrived before its deadline.
          </p>
        ) : (
          <>
            <p className="font-mono text-xl tabular-nums text-alert">{lateCount}</p>
            <p className="mt-1 text-sm text-muted">
              submission{lateCount === 1 ? '' : 's'} flagged late across {assessmentCount}{' '}
              assessment{assessmentCount === 1 ? '' : 's'}
            </p>
            {worstAssessmentId && (
              <Link
                href={`/assessments/${worstAssessmentId}`}
                className="mt-3 inline-block text-xs underline underline-offset-2"
              >
                Review {worstAssessmentTitle} →
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ReadyToPublishPanel({ summary }: { summary: DashboardSummary }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold">Ready to publish</h2>
      <div className="rounded-card border border-rule bg-paper px-4 py-4">
        {summary.readyToPublish.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing marked is waiting for release.{' '}
            {summary.awaitingMarkingCount > 0
              ? `${summary.awaitingMarkingCount} submission${summary.awaitingMarkingCount === 1 ? '' : 's'} still to mark.`
              : 'All submitted work has been marked.'}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {summary.readyToPublish.map((entry) => (
              <li
                key={entry.assessmentId}
                className="flex items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-medium">{entry.title}</p>
                  <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
                    {entry.moduleCode} · {entry.markedCount} of {entry.expectedCount}{' '}
                    marked · {entry.unpublishedCount} unpublished
                  </p>
                </div>
                <Link
                  href={`/assessments/${entry.assessmentId}`}
                  className="text-xs whitespace-nowrap underline underline-offset-2"
                >
                  Review →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
