import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/shared/page-header';
import { assessmentService } from '@/features/assessments/server';
import { MarkingQueue } from '@/features/results';
import { formatDateTime, relativeToNow } from '@/lib/dates';
import { isAppError } from '@/lib/errors';
import { getViewer } from '@/lib/viewer';

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;
  const viewer = await getViewer();

  let assessment;
  try {
    assessment = await assessmentService.getById(viewer, assessmentId);
  } catch (error) {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  }

  return (
    <>
      <div className="mb-4">
        <Link href="/assessments" className="text-xs underline underline-offset-2">
          Back to assessments
        </Link>
      </div>

      <PageHeader
        title={assessment.title}
        description={
          <span className="font-mono">
            {assessment.moduleCode} {assessment.moduleName} · Deadline{' '}
            {formatDateTime(assessment.deadline)} ·{' '}
            {assessment.isClosed ? 'closed' : relativeToNow(assessment.deadline)}
          </span>
        }
      />

      <MarkingQueue assessmentId={assessment.id} />
    </>
  );
}
