import Link from 'next/link';

import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/ui';
import { NewAssessmentScreen } from '@/features/assessments';
import { assessmentService } from '@/features/assessments/server';
import { getViewer } from '@/lib/viewer';

export default async function NewAssessmentPage() {
  const viewer = await getViewer();
  const modules = await assessmentService.listModules(viewer);

  return (
    <>
      <PageHeader
        title="New assessment"
        description={
          <Link href="/assessments" className="underline underline-offset-2">
            Back to assessments
          </Link>
        }
      />

      {modules.length === 0 ? (
        <EmptyState
          title="No modules exist yet."
          description="An assessment belongs to a module. Run npm run db:seed to create them."
        />
      ) : (
        <NewAssessmentScreen modules={modules} />
      )}
    </>
  );
}
