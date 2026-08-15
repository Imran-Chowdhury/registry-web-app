import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/ui';

export default function StudentsPage() {
  return (
    <>
      <PageHeader title="Students" description="Enrolment records, fees, and status." />
      <EmptyState
        title="Students arrive in Phase 2."
        description="The list, search, filters, and the create form are the vertical slice that proves the whole stack."
      />
    </>
  );
}
