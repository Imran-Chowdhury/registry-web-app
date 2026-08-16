'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Money } from '@/components/shared/money';
import {
  Badge,
  Button,
  EmptyState,
  SkeletonTable,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from '@/components/ui';
import { formatDateTime } from '@/lib/dates';
import { formatBytes } from '@/lib/file-size';
import { cn } from '@/lib/utils';

import { useMarkingQueue, useSaveGrade, useSetResultStatus } from '../hooks/use-results';
import { markingFilters, type MarkingFilter } from '../schema';
import type { MarkingRow } from '../types';
import { GradeInput } from './grade-input';
import { PublishAllDialog } from './publish-all-dialog';
import { WithholdDialog } from './withhold-dialog';

const FILTER_LABELS: Record<MarkingFilter, string> = {
  ALL: 'All',
  LATE: 'Late',
  MISSING: 'Missing',
  UNMARKED: 'Unmarked',
  WITHHELD: 'Withheld',
};

/**
 * The marking screen: submission queue and grade entry in one view.
 *
 * Missing submissions are rows, not gaps — a student who did not submit is exactly who
 * the admin is looking for. Overdue balances sit in the row itself, next to the publish
 * control, because that is the moment the information changes a decision.
 */
export function MarkingQueue({ assessmentId }: { assessmentId: string }) {
  const [filter, setFilter] = useState<MarkingFilter>('ALL');
  const [withholding, setWithholding] = useState<MarkingRow | null>(null);
  const [publishAllOpen, setPublishAllOpen] = useState(false);

  const { data, isPending, isError, error, refetch } = useMarkingQueue(assessmentId);
  const saveGrade = useSaveGrade(assessmentId);
  const setStatus = useSetResultStatus(assessmentId);

  if (isPending) {
    return (
      <div className="rounded-card border border-rule bg-paper">
        <SkeletonTable columns={['w-40', 'w-32', 'w-24', 'w-16', 'w-24']} />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        tone="alert"
        title="Couldn't load the marking queue."
        description={error.message}
        action={
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  const counts = {
    submitted: data.filter((row) => row.latest).length,
    missing: data.filter((row) => !row.latest).length,
    late: data.filter((row) => row.latest?.isLate).length,
    marked: data.filter((row) => row.result?.grade !== null && row.result).length,
    published: data.filter((row) => row.result?.status === 'PUBLISHED').length,
  };

  const rows = data.filter((row) => matchesFilter(row, filter));

  return (
    <>
      <p className="mb-3 font-mono text-xs text-muted">
        {counts.submitted} submitted · {counts.missing} missing ·{' '}
        <span className={counts.late > 0 ? 'text-alert' : undefined}>
          {counts.late} late
        </span>{' '}
        · {counts.marked} marked · {counts.published} published
      </p>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        {/* The fast path to the three questions this screen exists to answer. */}
        <div className="flex flex-wrap gap-1">
          {markingFilters.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-control',
                filter === value
                  ? 'border-ink bg-ink text-paper'
                  : 'border-rule bg-paper text-muted hover:text-ink',
              )}
            >
              {FILTER_LABELS[value]}
            </button>
          ))}
        </div>

        <Button size="sm" onClick={() => setPublishAllOpen(true)}>
          Publish all marked
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title={emptyTitle(filter)}
          description={
            filter === 'MISSING'
              ? 'Every expected student has submitted.'
              : 'Try another filter.'
          }
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Student</TH>
              <TH>Submitted</TH>
              <TH>File</TH>
              <TH className="text-center">Grade</TH>
              <TH numeric>Result</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => {
              const withdrawn = row.studentStatus === 'WITHDRAWN';
              const result = row.result;

              return (
                <TR
                  key={row.studentId}
                  flagged={Boolean(row.latest?.isLate) || row.arrears !== null}
                  dimmed={withdrawn}
                >
                  <TD className="py-2">
                    <Link
                      href={`/students/${row.studentId}`}
                      className="font-mono underline underline-offset-2"
                    >
                      {row.studentCode}
                    </Link>
                    <span className="block text-xs text-muted">{row.studentName}</span>
                    {/*
                      The highest-value detail on the screen: fee arrears surfaced at the
                      moment of publishing, not on another page.
                    */}
                    {row.arrears && (
                      <span className="mt-0.5 block font-mono text-xs text-alert">
                        ⚠ <Money alert minor={row.arrears.outstandingMinor} /> overdue ·{' '}
                        {row.arrears.daysOverdue} days
                      </span>
                    )}
                  </TD>

                  <TD className="py-2">
                    {row.latest ? (
                      <>
                        <span className="font-mono">
                          {formatDateTime(row.latest.submittedAt)}
                        </span>
                        {row.latest.isLate && (
                          <span className="block text-xs text-alert">
                            ⚠ {row.latest.delay} late
                          </span>
                        )}
                        {row.attemptCount > 1 && (
                          <span
                            className="block text-xs text-muted"
                            title="Resubmitted before the deadline"
                          >
                            att. {row.attemptCount}
                          </span>
                        )}
                      </>
                    ) : (
                      <Badge tone="alert">Not submitted</Badge>
                    )}
                  </TD>

                  <TD className="py-2">
                    {row.latest ? (
                      <>
                        <a
                          href={`/api/submissions/${row.latest.id}/file`}
                          className="underline underline-offset-2"
                        >
                          {row.latest.fileName}
                        </a>
                        <span className="block font-mono text-xs text-muted">
                          {formatBytes(row.latest.fileSize)}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </TD>

                  {/*
                    Every cell in this row carries the same vertical padding. The grade
                    cell is taller than the 40px `h-10` the primitive assumes, so without
                    it a row with no arrears, late or attempt line collapses to the grade
                    cell's own height and the input sits flush against the row edge.
                  */}
                  <TD className="py-2 text-center">
                    <GradeInput
                      grade={result?.grade ?? null}
                      disabled={withdrawn}
                      disabledReason="Withdrawn students cannot be graded."
                      onCommit={(grade) =>
                        saveGrade.mutate({
                          assessmentId,
                          studentId: row.studentId,
                          grade,
                          // A grade against no submission needs a reason on record; the
                          // service rejects it otherwise.
                          note: row.latest ? undefined : 'Absent — no submission received.',
                        })
                      }
                    />
                  </TD>

                  <TD numeric className="py-2">
                    <ResultCell
                      row={row}
                      pending={setStatus.isPending}
                      onPublish={() =>
                        setStatus.mutate({
                          assessmentId,
                          studentId: row.studentId,
                          action: 'PUBLISH',
                        })
                      }
                      onWithhold={() => setWithholding(row)}
                    />
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <PublishAllDialog
        assessmentId={assessmentId}
        rows={data}
        open={publishAllOpen}
        onClose={() => setPublishAllOpen(false)}
      />

      <WithholdDialog
        open={withholding !== null}
        studentName={withholding?.studentName ?? ''}
        pending={setStatus.isPending}
        onClose={() => setWithholding(null)}
        onConfirm={(reason) => {
          if (!withholding) return;
          setStatus.mutate(
            {
              assessmentId,
              studentId: withholding.studentId,
              action: 'WITHHOLD',
              withheldReason: reason,
            },
            { onSuccess: () => setWithholding(null) },
          );
        }}
      />
    </>
  );
}

/** Publication state and the controls that move it. */
function ResultCell({
  row,
  pending,
  onPublish,
  onWithhold,
}: {
  row: MarkingRow;
  pending: boolean;
  onPublish: () => void;
  onWithhold: () => void;
}) {
  const result = row.result;

  if (!result || result.grade === null) {
    return <span className="text-xs text-muted">Unmarked</span>;
  }

  return (
    <div className="inline-flex flex-col items-end gap-1">
      <span className="flex items-center gap-1.5">
        {result.status === 'PUBLISHED' && (
          <Badge tone="enrolled">Published</Badge>
        )}
        {result.status === 'WITHHELD' && (
          // The reason is the point of withholding, so it is reachable on hover here and
          // stated in full on the student's own marksheet.
          <span title={result.withheldReason ?? undefined}>
            <Badge tone="alert">Withheld ⓘ</Badge>
          </span>
        )}
        {result.status === 'DRAFT' && <Badge>Draft</Badge>}
      </span>

      {/* §12: an edited published grade is re-flagged, because the student already saw it. */}
      {result.editedAfterPublish && (
        <span className="text-xs text-deferred">Edited after publishing</span>
      )}

      <span className="flex items-center gap-2">
        {result.status !== 'PUBLISHED' && (
          <Button size="sm" variant="secondary" onClick={onPublish} disabled={pending}>
            Publish
          </Button>
        )}
        {result.status !== 'WITHHELD' && (
          <button
            type="button"
            onClick={onWithhold}
            disabled={pending}
            className="text-xs text-muted underline underline-offset-2 hover:text-ink"
          >
            Withhold
          </button>
        )}
      </span>
    </div>
  );
}

function matchesFilter(row: MarkingRow, filter: MarkingFilter): boolean {
  switch (filter) {
    case 'LATE':
      return Boolean(row.latest?.isLate);
    case 'MISSING':
      return !row.latest;
    case 'UNMARKED':
      return row.result?.grade == null;
    case 'WITHHELD':
      return row.result?.status === 'WITHHELD';
    default:
      return true;
  }
}

function emptyTitle(filter: MarkingFilter): string {
  switch (filter) {
    case 'LATE':
      return 'No late submissions.';
    case 'MISSING':
      return 'Nothing missing.';
    case 'UNMARKED':
      return 'Everything expected has been marked.';
    case 'WITHHELD':
      return 'Nothing is being withheld.';
    default:
      return 'No students are expected to submit this.';
  }
}
