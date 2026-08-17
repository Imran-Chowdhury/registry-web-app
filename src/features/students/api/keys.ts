import type { StudentQuery } from '../schema';

/**
 * The only place a students query key is written. String literals scattered across hooks
 * are how an invalidation silently stops matching.
 */
export const studentKeys = {
  all: ['students'] as const,
  lists: () => [...studentKeys.all, 'list'] as const,
  /** Page is part of the key: each page is its own cache entry, not a replacement. */
  list: (query: StudentQuery) => [...studentKeys.lists(), query] as const,
  details: () => [...studentKeys.all, 'detail'] as const,
  detail: (id: string) => [...studentKeys.details(), id] as const,
};
