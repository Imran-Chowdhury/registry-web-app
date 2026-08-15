import Link from 'next/link';
import { notFound } from 'next/navigation';

import { programmeService } from '@/features/programmes';
import { studentService } from '@/features/students';
import { StudentDetailScreen } from '@/features/students/components/student-detail-screen';
import { isAppError } from '@/lib/errors';
import { getViewer } from '@/lib/viewer';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const viewer = await getViewer();

  // Resolved here so a bad id is a 404 page rather than an error state inside a
  // rendered shell.
  try {
    await studentService.getById(viewer, studentId);
  } catch (error) {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  }

  const programmes = await programmeService.list(viewer);

  return (
    <>
      <div className="mb-4">
        <Link href="/students" className="text-xs underline underline-offset-2">
          Back to students
        </Link>
      </div>
      <StudentDetailScreen studentId={studentId} programmes={programmes} />
    </>
  );
}
