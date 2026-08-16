/**
 * Query keys for the assessments feature.
 *
 * Nothing here is viewer-scoped: a student's own assessments and marksheet are rendered
 * on the server from the cookie-derived viewer, so they never enter the client cache.
 * The moment a viewer-scoped query does appear it must carry the viewer in its key —
 * `queryClient.clear()` on the switcher is the backstop, not the mechanism.
 */
export const assessmentKeys = {
  all: ['assessments'] as const,
  lists: () => [...assessmentKeys.all, 'list'] as const,
  detail: (id: string) => [...assessmentKeys.all, 'detail', id] as const,
};
