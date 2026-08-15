import 'server-only';

import { cookies } from 'next/headers';

import {
  VIEWER_ROLE_COOKIE,
  VIEWER_STUDENT_COOKIE,
  type Viewer,
} from './viewer.shared';

export { viewerKey, type Viewer, type ViewerRole } from './viewer.shared';

/**
 * Identity, deliberately without auth.
 *
 * The demo switcher replaces a login screen, but the identity it produces is still
 * resolved **server-side** from an httpOnly cookie the client cannot read or forge from
 * JavaScript. Every service takes the resulting `Viewer` as its first argument and
 * enforces its own rules, so the authorisation logic is real even though the
 * authentication is not.
 *
 * A `studentId` is never accepted from the client to decide what data to return.
 */
export async function getViewer(): Promise<Viewer> {
  const store = await cookies();
  const role = store.get(VIEWER_ROLE_COOKIE)?.value;
  const studentId = store.get(VIEWER_STUDENT_COOKIE)?.value;

  // A STUDENT role without an id is not a viewer we can scope data to, so it falls
  // back to staff rather than producing a half-identity.
  if (role === 'STUDENT' && studentId) {
    return { role: 'STUDENT', studentId };
  }

  return { role: 'STAFF' };
}
