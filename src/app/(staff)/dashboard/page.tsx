import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/ui';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Registry"
        description="Outstanding fees, late work, and results waiting to be published."
      />
      <EmptyState
        title="The dashboard is assembled in Phase 6."
        description="It reads from the students, fees, submissions, and results features, so it is built once those exist."
      />
    </>
  );
}
