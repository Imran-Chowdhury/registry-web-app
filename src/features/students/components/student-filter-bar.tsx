'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import type { ProgrammeOption } from '@/features/programmes';
import { Input, Select } from '@/components/ui';
import { cn } from '@/lib/utils';

import { ENROLMENT_STATUSES, type EnrolmentStatusValue } from '../schema';
import { useHasActiveFilters, useOverdueFilter, useStudentFilterStore } from '../store';
import { statusLabel } from './status-badge';

/**
 * Search and filters combine, and every active one is shown as a removable chip — so a
 * list that looks empty always explains why.
 */
export function StudentFilterBar({ programmes }: { programmes: ProgrammeOption[] }) {
  const search = useStudentFilterStore((state) => state.search);
  const programmeId = useStudentFilterStore((state) => state.programmeId);
  const status = useStudentFilterStore((state) => state.status);
  const setSearch = useStudentFilterStore((state) => state.setSearch);
  const setProgrammeId = useStudentFilterStore((state) => state.setProgrammeId);
  const setStatus = useStudentFilterStore((state) => state.setStatus);
  const setPage = useStudentFilterStore((state) => state.setPage);
  const clear = useStudentFilterStore((state) => state.clear);
  const hasFilters = useHasActiveFilters();

  const overdue = useOverdueFilter();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  /**
   * Writes the URL, not the store — the arrears filter is linkable, so the URL owns it.
   * `replace` rather than `push`: toggling a filter four times should not cost four
   * presses of the back button to escape.
   */
  function setOverdue(next: boolean) {
    // Page lives in the store, so it has to be reset alongside.
    setPage(1);

    const query = new URLSearchParams(params);
    if (next) query.set('overdue', 'true');
    else query.delete('overdue');

    const search = query.toString();
    router.replace(search ? `${pathname}?${search}` : pathname, { scroll: false });
  }

  // Typing should not fire a request per keystroke; the store drives the query key.
  const [draft, setDraft] = useState(search ?? '');
  useEffect(() => {
    const timer = setTimeout(() => setSearch(draft.trim()), 250);
    return () => clearTimeout(timer);
  }, [draft, setSearch]);

  const activeProgramme = programmes.find((programme) => programme.id === programmeId);

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search name, code, or email"
          aria-label="Search students"
          className="max-w-xs"
        />
        <Select
          aria-label="Filter by programme"
          value={programmeId ?? ''}
          onChange={(event) => setProgrammeId(event.target.value || undefined)}
          className="max-w-[12rem]"
        >
          <option value="">All programmes</option>
          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>
              {programme.name} ({programme.code})
            </option>
          ))}
        </Select>
        <Select
          aria-label="Filter by status"
          value={status ?? ''}
          onChange={(event) =>
            setStatus((event.target.value || undefined) as EnrolmentStatusValue | undefined)
          }
          className="max-w-[10rem]"
        >
          <option value="">All statuses</option>
          {ENROLMENT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {statusLabel(value)}
            </option>
          ))}
        </Select>

        {/* A toggle, not a fourth dropdown: it is the one question an admin asks this
            screen repeatedly, and it deserves to be one click rather than two. */}
        <label
          className={cn(
            'inline-flex h-9 cursor-pointer items-center gap-2 rounded-control border px-3 text-sm transition-control',
            overdue
              ? 'border-alert bg-alert/5 text-alert'
              : 'border-rule bg-paper hover:border-ink/40',
          )}
        >
          <input
            type="checkbox"
            checked={Boolean(overdue)}
            onChange={(event) => setOverdue(event.target.checked)}
            className="size-3.5 accent-current"
          />
          Overdue only
        </label>
      </div>

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {search && (
            <FilterChip
              label={`“${search}”`}
              onRemove={() => {
                setDraft('');
                setSearch('');
              }}
            />
          )}
          {activeProgramme && (
            <FilterChip
              label={activeProgramme.code}
              onRemove={() => setProgrammeId(undefined)}
            />
          )}
          {status && (
            <FilterChip label={statusLabel(status)} onRemove={() => setStatus(undefined)} />
          )}
          {overdue && <FilterChip label="Overdue" onRemove={() => setOverdue(false)} />}
          <button
            type="button"
            onClick={() => {
              setDraft('');
              clear();
              // The arrears filter lives in the URL, so clearing the store alone would
              // leave it on and the button would look broken.
              if (overdue) setOverdue(false);
            }}
            className="text-xs text-muted underline underline-offset-2 transition-control hover:text-ink"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-rule bg-paper px-2 py-0.5 text-xs">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter ${label}`}
        className="text-muted transition-control hover:text-ink"
      >
        ✕
      </button>
    </span>
  );
}
