import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/ui';

export default function AssessmentsPage() {
  return (
    <>
      <PageHeader title="Assessments" description="Deadlines, submissions, and marking." />
      <EmptyState
        title="Assessments arrive in Phase 4."
        description="Submission upload and late flagging land with them; marking and publishing follow in Phase 5."
      />
    </>
  );
}
