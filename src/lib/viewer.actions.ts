'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';

import { VIEWER_ROLE_COOKIE, VIEWER_STUDENT_COOKIE, homeFor } from './viewer.shared';

const setViewerSchema = z
  .object({
    role: z.enum(['STAFF', 'STUDENT']),
    studentId: z.string().min(1).optional(),
  })
  .refine((value) => value.role !== 'STUDENT' || Boolean(value.studentId), {
    message: 'Select a student to view as.',
    path: ['studentId'],
  });

export type SetViewerInput = z.infer<typeof setViewerSchema>;

/**
 * The demo switcher. Writes httpOnly cookies so the identity is only ever readable on
 * the server — swapping in Auth.js later replaces this action and `getViewer()`, and
 * touches nothing else.
 */
export async function setViewer(input: SetViewerInput): Promise<void> {
  const { role, studentId } = setViewerSchema.parse(input);
  const store = await cookies();

  // Read before writing. Mirrors `getViewer`'s fallback so an absent cookie counts as
  // staff rather than as a role change.
  const previousRole =
    store.get(VIEWER_ROLE_COOKIE)?.value === 'STUDENT' ? 'STUDENT' : 'STAFF';

  const options = {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
  } as const;

  store.set(VIEWER_ROLE_COOKIE, role, options);

  if (role === 'STUDENT' && studentId) {
    store.set(VIEWER_STUDENT_COOKIE, studentId, options);
  } else {
    store.delete(VIEWER_STUDENT_COOKIE);
  }

  revalidatePath('/', 'layout');

  // A role switch has to move the viewer, not just re-identify them.
  //
  // `revalidatePath` makes this action re-render the current route tree as part of its
  // own response, and it does so under the cookie just written — so switching to staff
  // while on `/me` renders the student overview as staff and the service throws. The
  // layout guards cannot catch it: Next renders layout and page in parallel, so the
  // page's query is already in flight when the layout redirects. Redirecting here
  // short-circuits that render instead of racing it.
  //
  // Swapping between students is not a role change, so it leaves the viewer where they
  // are — on the marksheet, say, rather than bouncing them to the overview.
  if (role !== previousRole) {
    redirect(homeFor(role));
  }
}
