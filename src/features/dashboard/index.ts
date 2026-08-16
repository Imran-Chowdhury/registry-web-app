/**
 * The client-safe public surface of the dashboard feature. The service lives in
 * `./server`, because it is `server-only`.
 *
 * There are no hooks here: the dashboard is rendered on the server in one pass. It is a
 * read-only composite with nothing to mutate, so a client cache would add a loading
 * state and a stale window in exchange for nothing.
 */

export type {
  AccountBalance,
  DashboardSummary,
  LateWorkSummary,
  ReadyToPublish,
} from './types';

export { DashboardView } from './components/dashboard-view';
export { StatTile } from './components/stat-tile';
