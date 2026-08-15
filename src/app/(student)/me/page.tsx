import { EmptyState } from '@/components/ui';
import { StudentFeeSummary } from '@/features/fees';
import { feeService } from '@/features/fees/server';
import { studentService } from '@/features/students/server';
import { getViewer } from '@/lib/viewer';

export default async function StudentOverviewPage() {
  const viewer = await getViewer();
  // Scoped from the cookie-derived viewer. No id is accepted from the client, and the
  // services refuse anything that is not this student's own record.
  const student = await studentService.getSelf(viewer);
  const fees = await feeService.listForStudent(viewer, student.id);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-xl">{student.fullName}</h1>
        <p className="mt-1 font-mono text-sm text-muted">
          {student.studentCode} · {student.programmeName} · Year {student.academicYear}
        </p>
      </header>

      <StudentFeeSummary fees={fees} />

      <section className="mt-8">
        <h2 className="mb-3 text-base font-semibold">Coursework</h2>
        <EmptyState
          title="Your assessments appear here."
          description="Deadlines and submissions arrive in Phase 4; results in Phase 5."
        />
      </section>
    </>
  );
}
