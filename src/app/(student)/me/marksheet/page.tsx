import { MarksheetView } from '@/features/results';
import { resultService } from '@/features/results/server';
import { studentService } from '@/features/students/server';
import { getViewer } from '@/lib/viewer';

export default async function StudentMarksheetPage() {
  const viewer = await getViewer();
  // Scoped from the cookie-derived viewer. No student id is accepted from the request,
  // and the service refuses anything that is not the viewer's own record.
  const [student, marksheet] = await Promise.all([
    studentService.getSelf(viewer),
    resultService.marksheetForSelf(viewer),
  ]);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-xl">Marksheet</h1>
        <p className="mt-1 font-mono text-sm text-muted">
          {student.fullName} · {student.studentCode}
        </p>
      </header>

      <MarksheetView marksheet={marksheet} />
    </>
  );
}
