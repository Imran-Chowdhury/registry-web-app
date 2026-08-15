import { EmptyState } from '@/components/ui';
import { studentService } from '@/features/students';
import { getViewer } from '@/lib/viewer';

export default async function StudentOverviewPage() {
  const viewer = await getViewer();
  // Scoped from the cookie-derived viewer. No id is accepted from the client, and the
  // service refuses anything that is not this student's own record.
  const student = await studentService.getSelf(viewer);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-xl">{student.fullName}</h1>
        <p className="mt-1 font-mono text-sm text-muted">
          {student.studentCode} · {student.programmeName} · Year {student.academicYear}
        </p>
      </header>

      <EmptyState
        title="Your fees and coursework appear here."
        description="The fee panel arrives in Phase 3 and the assessment summary in Phase 4."
      />
    </>
  );
}
