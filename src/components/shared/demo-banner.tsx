'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import type { DemoStudent } from '@/lib/demo-students';
import { setViewer } from '@/lib/viewer.actions';
import type { Viewer } from '@/lib/viewer.shared';
import { cn } from '@/lib/utils';

/**
 * The switcher that stands in for a login screen.
 *
 * Deliberately does not look like part of the product chrome — it reads as scaffolding,
 * which is the honest signal that identity here is stubbed. It is also how a reviewer
 * moves through the app, so it stays pinned to the top of every screen.
 */
export function DemoBanner({
  viewer,
  students,
}: {
  viewer: Viewer;
  /** Resolved server-side by the layout. */
  students: DemoStudent[];
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, startTransition] = useTransition();

  const activeStudentId = viewer.role === 'STUDENT' ? viewer.studentId : '';

  function switchTo(role: 'STAFF' | 'STUDENT', studentId?: string) {
    // Every cached query was fetched as somebody else. Without this the previous
    // student's marksheet flashes on screen during the transition and reads as a data
    // leak, even though the server would never have sent it.
    //
    // Cleared before the call, not after: a role switch makes the action redirect, and
    // work queued behind that await is not guaranteed to run before the navigation.
    queryClient.clear();

    startTransition(async () => {
      await setViewer({ role, studentId });
      router.refresh();
    });
  }

  return (
    <div className="bg-ink text-paper">
      <div
        className={cn(
          'mx-auto flex h-11 max-w-[1440px] items-center gap-3 px-6',
          pending && 'opacity-70',
        )}
      >
        <span className="font-mono text-xs tracking-widest text-paper/70 uppercase">
          Demo mode
        </span>

        <label className="flex items-center gap-2 text-xs text-paper/70">
          Viewing as
          <select
            aria-label="Viewer role"
            disabled={pending}
            value={viewer.role}
            onChange={(event) => {
              const role = event.target.value as 'STAFF' | 'STUDENT';
              // Switching to Student needs a subject; default to the first one so the
              // control never sits in a half-selected state.
              switchTo(role, role === 'STUDENT' ? students[0]?.id : undefined);
            }}
            className={selectClasses}
          >
            <option value="STAFF">Staff</option>
            <option value="STUDENT" disabled={students.length === 0}>
              Student
            </option>
          </select>
        </label>

        {viewer.role === 'STUDENT' && (
          <select
            aria-label="Viewing as student"
            disabled={pending}
            value={activeStudentId}
            onChange={(event) => switchTo('STUDENT', event.target.value)}
            className={cn(selectClasses, 'font-mono')}
          >
            {groupByProgramme(students).map(([programmeCode, group]) => (
              <optgroup key={programmeCode} label={programmeCode}>
                {group.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} · {student.studentCode}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        )}

        {pending && <span className="text-xs text-paper/50">Switching…</span>}
      </div>
    </div>
  );
}

const selectClasses =
  'h-7 rounded-control border border-paper/30 bg-transparent px-2 text-xs text-paper ' +
  'transition-control hover:border-paper/60 focus:border-paper focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-50 [&>*]:text-ink';

function groupByProgramme(students: DemoStudent[]): [string, DemoStudent[]][] {
  const groups = new Map<string, DemoStudent[]>();
  for (const student of students) {
    const group = groups.get(student.programmeCode) ?? [];
    group.push(student);
    groups.set(student.programmeCode, group);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));
}
