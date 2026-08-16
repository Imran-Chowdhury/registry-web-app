import { StudentFeeSummary } from '@/features/fees';
import { feeService } from '@/features/fees/server';
import { RecentResults } from '@/features/results';
import { resultService } from '@/features/results/server';
import { studentService } from '@/features/students/server';
import { getViewer } from '@/lib/viewer';

export default async function StudentOverviewPage() {
  const viewer = await getViewer();
  // Scoped from the cookie-derived viewer. No id is accepted from the client, and the
  // services refuse anything that is not this student's own record.
  const student = await studentService.getSelf(viewer);
  const [fees, marksheet] = await Promise.all([
    feeService.listForStudent(viewer, student.id),
    resultService.marksheetForSelf(viewer),
  ]);

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
        <h2 className="mb-3 text-base font-semibold">Recent results</h2>
        <RecentResults marksheet={marksheet} />
      </section>
    </>
  );
}
