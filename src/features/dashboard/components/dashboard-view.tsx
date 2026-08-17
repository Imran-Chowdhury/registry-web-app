import Link from 'next/link';

import { Money } from '@/components/shared/money';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui';
import { formatDateShort } from '@/lib/dates';
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

      <AccountsPanel summary={summary} />

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <LateWorkPanel summary={summary} />
        <ReadyToPublishPanel summary={summary} />
      </div>
    </>
  );
}

/**
 * Who owes money — the first of the three questions an admin opens this screen to answer.
 *
 * Two modes, because "no overdue accounts" is a dead panel on a screen whose job is to
 * name the next thing worth doing. With nothing overdue it falls back to the largest
 * balances still to collect, ranked by size rather than by age.
 *
 * The heading and the colour change with the mode. Red rows under a heading that says
 * "outstanding" would read as overdue at a glance, and on this screen a colour that lies
 * is worse than no colour.
 */
function AccountsPanel({ summary }: { summary: DashboardSummary }) {
  const overdue = summary.overdueAccounts.length > 0;
  const accounts = overdue ? summary.overdueAccounts : summary.topOutstanding;

  return (
    <section className="mt-8">
      <div className="mb-2 flex items-baseline justify-between gap-4">
        <h2 className="text-base font-semibold">
          {overdue ? 'Overdue accounts' : 'Largest outstanding balances'}
        </h2>
        {/* The panel shows the worst few; the link carries the filter so the rest are one
            click away rather than buried in an unfiltered list of the whole registry. */}
        <Link
          href={overdue ? '/students?overdue=true' : '/students'}
          className="text-xs underline underline-offset-2"
        >
          {overdue
            ? `View all ${summary.overdueCount} overdue →`
            : 'View all students →'}
        </Link>
      </div>

      {!overdue && accounts.length > 0 && (
        <p className="mb-2 text-xs text-muted">
          Nothing is overdue. These are the balances still to collect.
        </p>
      )}

      {accounts.length === 0 ? (
        <p className="rounded-card border border-rule bg-paper px-4 py-3 text-sm text-muted">
          Every fee is paid in full. Nothing is outstanding.
        </p>
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Code</TH>
              <TH>Name</TH>
              <TH>Programme</TH>
              <TH numeric>Outstanding</TH>
              <TH numeric>{overdue ? 'Overdue' : 'Due'}</TH>
            </TR>
          </THead>
          <TBody>
            {accounts.map((account) => (
              <TR
                key={account.studentId}
                flagged={account.isOverdue}
                tinted={!account.isOverdue}
              >
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
                  <Money alert={account.isOverdue} minor={account.outstandingMinor} />
                </TD>
                <TD
                  mono
                  numeric
                  className={account.isOverdue ? 'text-alert' : 'text-muted'}
                >
                  {account.isOverdue
                    ? `${account.daysOverdue} day${account.daysOverdue === 1 ? '' : 's'}`
                    : formatDateShort(account.dueDate)}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </section>
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
