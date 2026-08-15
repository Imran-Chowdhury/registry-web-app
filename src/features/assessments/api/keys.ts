export const assessmentKeys = {
  all: ['assessments'] as const,
  lists: () => [...assessmentKeys.all, 'list'] as const,
  detail: (id: string) => [...assessmentKeys.all, 'detail', id] as const,
  submissions: (id: string) => [...assessmentKeys.all, 'submissions', id] as const,
  /** Viewer-scoped: a student's own assessments. Cleared when the switcher changes. */
  mine: () => [...assessmentKeys.all, 'mine'] as const,
};
