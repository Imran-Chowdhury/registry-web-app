import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import Link from 'next/link';

import { PageHeader } from '@/components/shared/page-header';
import { buttonClasses } from '@/components/ui';
import { programmeService } from '@/features/programmes';
import { studentKeys, studentService } from '@/features/students';
import { StudentList } from '@/features/students/components/student-list';
import { makeQueryClient } from '@/lib/query-client';
import { getViewer } from '@/lib/viewer';

export default async function StudentsPage() {
  const viewer = await getViewer();
  const programmes = await programmeService.list(viewer);

  // Only the primary list is prefetched, so the first paint has rows rather than a
  // skeleton. The key matches the client's initial filter state exactly, or the
  // hydrated data would be ignored and refetched.
  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery({
    queryKey: studentKeys.list({}),
    queryFn: () => studentService.list(viewer, {}),
  });

  return (
    <>
      <PageHeader
        title="Students"
        description="Enrolment records, fees, and status."
        action={
          <Link href="/students/new" className={buttonClasses('primary', 'md')}>
            + Add student
          </Link>
        }
      />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <StudentList programmes={programmes} />
      </HydrationBoundary>
    </>
  );
}
