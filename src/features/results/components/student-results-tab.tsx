'use client';

import Link from 'next/link';

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
import { formatDate } from '@/lib/dates';

import { useStudentResults } from '../hooks/use-results';

/**
 * The Results tab on a student record: every assessment they have a mark for, in
 * whatever state it is in. Publication is changed from the marking screen, where the
 * arrears warning lives — this tab is the per-student read of the same data.
 */
export function StudentResultsTab({ studentId }: { studentId: string }) {
  const { data, isPending, isError, error, refetch } = useStudentResults(studentId);

  if (isPending) {
    return (
      <div className="rounded-card border border-rule bg-paper">
        <SkeletonTable columns={['w-48', 'w-16', 'w-24', 'w-28']} />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        tone="alert"
        title="Couldn't load results."
        description={error.message}
        action={
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title="Nothing marked yet."
        description="Grades are entered on the assessment's marking screen."
      />
    );
  }

  return (
    <Table>
      <THead>
        <TR>
          <TH>Assessment</TH>
          <TH numeric>Grade</TH>
          <TH>Classification</TH>
          <TH numeric>Result</TH>
        </TR>
      </THead>
      <TBody>
        {data.map((result) => (
          <TR key={result.id}>
            <TD className="py-2">
              <Link
                href={`/assessments/${result.assessmentId}`}
                className="underline underline-offset-2"
              >
                {result.assessmentTitle}
              </Link>
              <span className="block font-mono text-xs text-muted">
                {result.moduleCode} {result.moduleName}
              </span>
              {/* Staff-only. Never sent to the student's own marksheet. */}
              {result.note && (
                <span className="block text-xs text-muted italic">{result.note}</span>
              )}
            </TD>

            <TD mono numeric>
              {result.grade ?? '—'}
            </TD>

            <TD>
              <span className="text-xs text-muted">{result.classification ?? '—'}</span>
            </TD>

            <TD numeric>
              <div className="inline-flex flex-col items-end gap-1">
                {result.status === 'PUBLISHED' && <Badge tone="enrolled">Published</Badge>}
                {result.status === 'WITHHELD' && <Badge tone="alert">Withheld</Badge>}
                {result.status === 'DRAFT' && <Badge>Draft</Badge>}

                {/*
                  `publishedAt` outlives an unpublish — it records that the student was
                  once shown this mark — so a date on a draft is labelled as history
                  rather than passed off as a current release.
                */}
                {result.publishedAt && (
                  <span className="font-mono text-xs text-muted">
                    {result.status === 'PUBLISHED' ? '' : 'previously published '}
                    {formatDate(result.publishedAt)}
                  </span>
                )}
                {result.status === 'WITHHELD' && result.withheldReason && (
                  <span className="max-w-64 text-xs text-wrap text-muted">
                    {result.withheldReason}
                  </span>
                )}
                {result.editedAfterPublish && (
                  <span className="text-xs text-deferred">Edited after publishing</span>
                )}
              </div>
            </TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
