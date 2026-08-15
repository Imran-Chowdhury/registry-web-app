import { create } from 'zustand';

import type { EnrolmentStatusValue, StudentFilters } from './schema';

/**
 * UI state only — what the admin has typed and chosen. The students themselves come
 * from TanStack Query; copying them in here would give two sources of truth.
 */
type StudentFilterState = StudentFilters & {
  setSearch: (search: string) => void;
  setProgrammeId: (programmeId: string | undefined) => void;
  setStatus: (status: EnrolmentStatusValue | undefined) => void;
  clear: () => void;
};

export const useStudentFilterStore = create<StudentFilterState>((set) => ({
  search: undefined,
  programmeId: undefined,
  status: undefined,
  setSearch: (search) => set({ search: search || undefined }),
  setProgrammeId: (programmeId) => set({ programmeId }),
  setStatus: (status) => set({ status }),
  clear: () => set({ search: undefined, programmeId: undefined, status: undefined }),
}));

/** Stable object for the query key — selecting the three fields separately would
 *  produce a new object on every render and refetch continuously. */
export function useStudentFilters(): StudentFilters {
  const search = useStudentFilterStore((state) => state.search);
  const programmeId = useStudentFilterStore((state) => state.programmeId);
  const status = useStudentFilterStore((state) => state.status);
  return { search, programmeId, status };
}

export function useHasActiveFilters(): boolean {
  return useStudentFilterStore(
    (state) => Boolean(state.search || state.programmeId || state.status),
  );
}
