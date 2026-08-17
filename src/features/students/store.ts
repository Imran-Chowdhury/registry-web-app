'use client';

// The directive is required, not incidental: `useOverdueFilter` reads `useSearchParams`,
// and this module is re-exported through the feature barrel that Server Components
// import. Without it the router API leaks into an RSC module graph and the page 500s.

import { useSearchParams } from 'next/navigation';
import { create } from 'zustand';

import { DEFAULT_STUDENT_QUERY } from './schema';
import type { EnrolmentStatusValue, StudentQuery } from './schema';

/**
 * UI state only — what the admin has typed, chosen, and paged to. The students
 * themselves come from TanStack Query; copying them in here would give two sources of
 * truth.
 *
 * Page lives here rather than in the URL, per CLAUDE.md §9. The trade is real and worth
 * naming: `/students` does not reflect page 3, so the position cannot be bookmarked or
 * shared and the back button does not step through pages. Acceptable for a single-admin
 * demo; the fix is moving the whole query object to `searchParams`.
 *
 * `overdue` is the exception and lives in the URL — see `useStudentQuery`.
 */
type StudentFilterState = Omit<StudentQuery, 'overdue'> & {
  setSearch: (search: string) => void;
  setProgrammeId: (programmeId: string | undefined) => void;
  setStatus: (status: EnrolmentStatusValue | undefined) => void;
  setPage: (page: number) => void;
  clear: () => void;
};

export const useStudentFilterStore = create<StudentFilterState>((set) => ({
  search: undefined,
  programmeId: undefined,
  status: undefined,
  page: DEFAULT_STUDENT_QUERY.page,
  pageSize: DEFAULT_STUDENT_QUERY.pageSize,

  // Every filter resets to page 1. Narrowing to three results while on page six would
  // otherwise land on an empty screen that looks like a bug rather than a filter.
  setSearch: (search) => set({ search: search || undefined, page: 1 }),
  setProgrammeId: (programmeId) => set({ programmeId, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),

  setPage: (page) => set({ page }),
  clear: () =>
    set({ search: undefined, programmeId: undefined, status: undefined, page: 1 }),
}));

/**
 * The arrears filter, read from `?overdue=true`.
 *
 * The one filter kept in the URL rather than the store, because it is the one the
 * dashboard links to: `/students?overdue=true` has to arrive already filtered. Seeding
 * the store from the URL instead would mean mutating a module singleton during render —
 * which on the server is shared across requests, so the first render to touch it would
 * decide what every later one saw.
 *
 * Also the reason the value is compared to the literal `'true'`: a present-but-empty or
 * `?overdue=false` param must not read as on.
 */
export function useOverdueFilter(): boolean | undefined {
  return useSearchParams().get('overdue') === 'true' || undefined;
}

/** Stable object for the query key — selecting the fields separately would
 *  produce a new object on every render and refetch continuously. */
export function useStudentQuery(): StudentQuery {
  const search = useStudentFilterStore((state) => state.search);
  const programmeId = useStudentFilterStore((state) => state.programmeId);
  const status = useStudentFilterStore((state) => state.status);
  const page = useStudentFilterStore((state) => state.page);
  const pageSize = useStudentFilterStore((state) => state.pageSize);
  const overdue = useOverdueFilter();
  return { search, programmeId, status, overdue, page, pageSize };
}

export function useHasActiveFilters(): boolean {
  const overdue = useOverdueFilter();
  const stored = useStudentFilterStore((state) =>
    Boolean(state.search || state.programmeId || state.status),
  );
  return stored || Boolean(overdue);
}
