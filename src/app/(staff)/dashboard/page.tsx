import { PageHeader } from '@/components/shared/page-header';
import { DashboardView } from '@/features/dashboard';
import { dashboardService } from '@/features/dashboard/server';
import { getViewer } from '@/lib/viewer';

export default async function DashboardPage() {
  const viewer = await getViewer();
  const summary = await dashboardService.summary(viewer);

  return (
    <>
      <PageHeader
        title="Registry"
        description="Outstanding fees, late work, and results waiting to be published."
      />
      <DashboardView summary={summary} />
    </>
  );
}
