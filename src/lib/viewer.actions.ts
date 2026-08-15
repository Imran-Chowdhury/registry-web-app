'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';

import { VIEWER_ROLE_COOKIE, VIEWER_STUDENT_COOKIE } from './viewer.shared';

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
}
