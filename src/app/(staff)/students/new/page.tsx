import Link from 'next/link';

import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/ui';
import { programmeService } from '@/features/programmes';
import { NewStudentScreen } from '@/features/students/components/new-student-screen';
import { getViewer } from '@/lib/viewer';

export default async function NewStudentPage() {
  const viewer = await getViewer();
  const programmes = await programmeService.list(viewer);

  return (
    <>
      <PageHeader
        title="Add student"
        description={
          <Link href="/students" className="underline underline-offset-2">
            Back to students
          </Link>
        }
      />

      {programmes.length === 0 ? (
        <EmptyState
          title="No programmes exist yet."
          description="A student's fee comes from their programme, so at least one must exist first. Run npm run db:seed."
        />
      ) : (
        <NewStudentScreen programmes={programmes} />
      )}
    </>
  );
}
