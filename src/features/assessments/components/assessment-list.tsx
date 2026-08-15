'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  TableCaption,
  buttonClasses,
} from '@/components/ui';
import { formatDateTime, relativeToNow } from '@/lib/dates';

import { useAssessments } from '../hooks/use-assessments';

/**
 * The deadline column carries a second line of relative time. An absolute date alone
 * does not tell an admin what is urgent.
 */
export function AssessmentList() {
  const router = useRouter();
  const { data, isPending, isError, error, refetch } = useAssessments();

  if (isPending) {
    return (
      <div className="rounded-card border border-rule bg-paper">
        <SkeletonTable columns={['w-40', 'w-20', 'w-32', 'w-16', 'w-16']} />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        tone="alert"
        title="Couldn't load assessments."
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
        title="No assessments yet."
        description="Create one to start collecting coursework."
        action={
          <Link href="/assessments/new" className={buttonClasses('primary', 'sm')}>
            New assessment
          </Link>
        }
      />
    );
  }

  return (
    <>
      <TableCaption>
        {data.length} assessment{data.length === 1 ? '' : 's'}
      </TableCaption>
      <Table>
        <THead>
          <TR>
            <TH>Title</TH>
            <TH>Module</TH>
            <TH>Deadline</TH>
            <TH numeric>Submitted</TH>
            <TH numeric>Marked</TH>
          </TR>
        </THead>
        <TBody>
          {data.map((assessment) => {
            // Closed with work still unmarked is the state that needs attention.
            const needsMarking =
              assessment.isClosed && assessment.markedCount < assessment.submittedCount;

            return (
              <TR
                key={assessment.id}
                clickable
                onClick={() => router.push(`/assessments/${assessment.id}`)}
              >
                <TD className="font-medium">
                  {assessment.title}
                  {assessment.lateCount > 0 && (
                    <span className="ml-2 text-xs text-alert">
                      {assessment.lateCount} late
                    </span>
                  )}
                </TD>
                <TD mono>{assessment.moduleCode}</TD>
                <TD mono className="py-1">
                  {formatDateTime(assessment.deadline)}
                  <span className="block font-sans text-xs text-muted">
                    {assessment.isClosed ? 'closed ' : ''}
                    {relativeToNow(assessment.deadline)}
                  </span>
                </TD>
                <TD mono numeric>
                  {assessment.submittedCount}/{assessment.expectedCount}
                </TD>
                <TD mono numeric className="py-1">
                  {assessment.markedCount}/{assessment.expectedCount}
                  {needsMarking && (
                    <Badge tone="deferred" className="ml-2 font-sans">
                      To mark
                    </Badge>
                  )}
                </TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </>
  );
}
