import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { DemoBanner } from '@/components/shared/demo-banner';
import { NavTabs, type NavItem } from '@/components/shared/nav-tabs';
import { Toaster } from '@/components/ui';
import { listDemoStudents } from '@/lib/demo-students';
import { getViewer } from '@/lib/viewer';

const STUDENT_NAV: NavItem[] = [
  { href: '/me', label: 'Overview', exact: true },
  { href: '/me/assessments', label: 'Assessments' },
  { href: '/me/marksheet', label: 'Marksheet' },
];

/**
 * A different rhythm entirely: single column at 680px, 16px body, generous vertical
 * space. A student opens this to answer one question and leave.
 */
export default async function StudentLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();

  if (viewer.role === 'STAFF') {
    redirect('/dashboard');
  }

  const students = await listDemoStudents();

  return (
    <>
      <DemoBanner viewer={viewer} students={students} />
      <NavTabs items={STUDENT_NAV} align="center" />
      <main className="mx-auto w-full max-w-[680px] flex-1 px-6 py-10 text-lg">
        {children}
      </main>
      <Toaster placement="center" />
    </>
  );
}
