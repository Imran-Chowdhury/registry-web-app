import { QueryClient } from '@tanstack/react-query';

/**
 * Registry data changes on a human timescale — a minute of staleness is invisible to
 * the user and saves a refetch on every tab focus, which is disruptive in a tool
 * someone keeps open all day.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
