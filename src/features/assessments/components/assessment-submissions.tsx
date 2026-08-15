'use client';

import Link from 'next/link';
import { useState } from 'react';

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

import { useAssessmentSubmissions } from '../hooks/use-assessments';
import { submissionFilters, type SubmissionFilter } from '../schema';
import type { SubmissionRow } from '../types';

const FILTER_LABELS: Record<SubmissionFilter, string> = {
  ALL: 'All',
  LATE: 'Late',
  MISSING: 'Missing',
  UNMARKED: 'Unmarked',
};

/**
 * The submission queue. Missing submissions are rendered as rows rather than omitted —
 * a student who did not submit is exactly who the admin is looking for.
 */
export function AssessmentSubmissions({ assessmentId }: { assessmentId: string }) {
  const [filter, setFilter] = useState<SubmissionFilter>('ALL');
  const { data, isPending, isError, error, refetch } =
    useAssessmentSubmissions(assessmentId);

  if (isPending) {
    return (
      <div className="rounded-card border border-rule bg-paper">
        <SkeletonTable columns={['w-40', 'w-32', 'w-24', 'w-16']} />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        tone="alert"
        title="Couldn't load submissions."
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
  };

  const rows = data.filter((row) => matchesFilter(row, filter));

  return (
    <>
      <p className="mb-3 font-mono text-xs text-muted">
        {counts.submitted} submitted · {counts.missing} missing ·{' '}
        <span className={counts.late > 0 ? 'text-alert' : undefined}>
          {counts.late} late
        </span>
      </p>

      {/* The fast path to "who hasn't submitted" and "who was late". */}
      <div className="mb-3 flex flex-wrap gap-1">
        {submissionFilters.map((value) => (
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
              <TH numeric>Attempts</TH>
            </TR>
          </THead>
          <TBody>
            {rows.map((row) => (
              <TR
                key={row.studentId}
                flagged={row.latest?.isLate ?? false}
                dimmed={row.studentStatus === 'WITHDRAWN'}
              >
                <TD className="py-1">
                  <Link
                    href={`/students/${row.studentId}`}
                    className="font-mono underline underline-offset-2"
                  >
                    {row.studentCode}
                  </Link>
                  <span className="block text-xs text-muted">{row.studentName}</span>
                </TD>

                <TD className="py-1">
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
                    </>
                  ) : (
                    <Badge tone="alert">Not submitted</Badge>
                  )}
                </TD>

                <TD>
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

                <TD mono numeric>
                  {row.attemptCount > 1 ? (
                    <span title="Resubmitted before the deadline">
                      att. {row.attemptCount}
                    </span>
                  ) : (
                    row.attemptCount || '—'
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </>
  );
}

function matchesFilter(row: SubmissionRow, filter: SubmissionFilter): boolean {
  switch (filter) {
    case 'LATE':
      return Boolean(row.latest?.isLate);
    case 'MISSING':
      return !row.latest;
    case 'UNMARKED':
      // Grades arrive in Phase 5; until then everything submitted is unmarked.
      return Boolean(row.latest);
    default:
      return true;
  }
}

function emptyTitle(filter: SubmissionFilter): string {
  switch (filter) {
    case 'LATE':
      return 'No late submissions.';
    case 'MISSING':
      return 'Nothing missing.';
    case 'UNMARKED':
      return 'Nothing waiting to be marked.';
    default:
      return 'No students are expected to submit this.';
  }
}
