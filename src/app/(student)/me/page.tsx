import { EmptyState } from '@/components/ui';
import { listDemoStudents } from '@/lib/demo-students';
import { getViewer } from '@/lib/viewer';

export default async function StudentOverviewPage() {
  const viewer = await getViewer();
  const students = await listDemoStudents();

  // Resolved from the cookie on the server, never from anything the client sent.
  const student =
    viewer.role === 'STUDENT' ? students.find((s) => s.id === viewer.studentId) : undefined;

  return (
    <>
      <header className="mb-8">
        <h1 className="text-xl">{student?.fullName ?? 'Student'}</h1>
        <p className="mt-1 font-mono text-sm text-muted">
          {student ? `${student.studentCode} · ${student.programmeCode}` : '—'}
        </p>
      </header>

      <EmptyState
        title="Your fees and coursework appear here."
        description="The fee panel arrives in Phase 3 and the assessment summary in Phase 4."
      />
    </>
  );
}
