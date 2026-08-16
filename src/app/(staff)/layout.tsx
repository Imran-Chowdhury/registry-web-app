import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { DemoBanner } from '@/components/shared/demo-banner';
import { NavTabs, type NavItem } from '@/components/shared/nav-tabs';
import { Toaster } from '@/components/ui';
import { listDemoStudents } from '@/lib/demo-students';
import { getViewer } from '@/lib/viewer';

/**
 * Four destinations, not five.
 *
 * Programmes are seeded rather than managed — the cut list in `docs/PLAN.md` says so —
 * and a nav entry leading to a screen that only explains its own absence is worse than
 * no entry at all. The fee-snapshot reasoning that screen would have carried lives in
 * the README instead, where it reads as a decision rather than a gap.
 */
const STAFF_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/students', label: 'Students' },
  { href: '/assessments', label: 'Assessments' },
  { href: '/payments', label: 'Payments' },
];

export default async function StaffLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();

  if (viewer.role === 'STUDENT') {
    redirect('/me');
  }

  const students = await listDemoStudents();

  return (
    <>
      <DemoBanner viewer={viewer} students={students} />
      <NavTabs items={STAFF_NAV} />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-6">{children}</main>
      <Toaster placement="right" />
    </>
  );
}
