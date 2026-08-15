import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/ui';

export default function ProgrammesPage() {
  return (
    <>
      <PageHeader title="Programmes" description="Codes, fees, and the fee due window." />
      <EmptyState
        title="Programmes are seeded rather than managed."
        description="A management screen is low on the cut list; the fee amounts that drive every fee assignment come from the seed."
      />
    </>
  );
}
