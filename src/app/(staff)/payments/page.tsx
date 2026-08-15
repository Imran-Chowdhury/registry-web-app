import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/ui';

export default function PaymentsPage() {
  return (
    <>
      <PageHeader title="Payments" description="Every payment recorded, newest first." />
      <EmptyState
        title="The payments ledger arrives in Phase 3."
        description="Payments are recorded from the student record; this screen collects them in one place."
      />
    </>
  );
}
