/**
 * The parts of the viewer contract that both sides of the network boundary need: the
 * shape of an identity and the cookie names that carry it.
 *
 * Kept free of `server-only` and `next/headers` on purpose. The demo switcher is a
 * client component that calls the `setViewer` Server Action, so the action's import
 * graph is traced by the client compiler — pulling `server-only` into it through a
 * shared constant crashes the Turbopack build rather than producing a readable error.
 *
 * Nothing here reads or trusts a cookie. Resolution is server-side only, in `viewer.ts`.
 */
export type Viewer =
  | { role: 'STAFF' }
  | { role: 'STUDENT'; studentId: string };

export type ViewerRole = Viewer['role'];

export const VIEWER_ROLE_COOKIE = 'viewer_role';
export const VIEWER_STUDENT_COOKIE = 'viewer_student_id';

/** Query keys and caches are scoped by this, so a switch cannot serve stale data. */
export function viewerKey(viewer: Viewer): string {
  return viewer.role === 'STUDENT' ? `student:${viewer.studentId}` : 'staff';
}
