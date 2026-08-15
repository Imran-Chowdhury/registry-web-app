import { EmptyState } from '@/components/ui';

export default function StudentAssessmentsPage() {
  return (
    <>
      <h1 className="mb-8 text-xl">Assessments</h1>
      <EmptyState
        title="Your assessments appear here."
        description="Deadlines, submission upload, and the replace-before-the-deadline rule arrive in Phase 4."
      />
    </>
  );
}
