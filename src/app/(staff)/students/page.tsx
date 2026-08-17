import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import Link from 'next/link';

import { PageHeader } from '@/components/shared/page-header';
import { buttonClasses } from '@/components/ui';
import { programmeService } from '@/features/programmes/server';
import { studentKeys, studentQuerySchema } from '@/features/students';
import { studentService } from '@/features/students/server';
import { StudentList } from '@/features/students/components/student-list';
import { makeQueryClient } from '@/lib/query-client';
import { getViewer } from '@/lib/viewer';

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ overdue?: string }>;
}) {
  const viewer = await getViewer();
  const programmes = await programmeService.list(viewer);

  // `?overdue=true` is the only deep-linkable filter, so the dashboard can send an admin
  // straight to the arrears it just counted. Parsed through the schema rather than read
  // raw — a query string is client input wherever it arrives from.
  const { overdue } = await searchParams;
  const initialQuery = studentQuerySchema.parse({ overdue: overdue ?? undefined });

  // Only the primary list is prefetched, so the first paint has rows rather than a
  // skeleton. The key must match what the client computes on its first render: store
  // defaults for the filters, and this same `overdue` value, which the client reads back
  // out of the URL rather than being handed.
  const queryClient = makeQueryClient();
  await queryClient.prefetchQuery({
    queryKey: studentKeys.list(initialQuery),
    queryFn: () => studentService.list(viewer, initialQuery),
  });

  return (
    <>
      <PageHeader
        title="Students"
        description="Enrollment records, fees, and status."
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
