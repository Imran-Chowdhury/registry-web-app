import { redirect } from 'next/navigation';

import { getViewer } from '@/lib/viewer';
import { homeFor } from '@/lib/viewer.shared';

/**
 * `/` has no screen of its own — where home is depends on who is looking. Staff land on
 * the dashboard, which answers "what needs my attention today"; a student lands on their
 * overview.
 */
export default async function RootPage() {
  const viewer = await getViewer();
  redirect(homeFor(viewer.role));
}
