'use server';

import { revalidatePath } from 'next/cache';

import { isAppError } from '@/lib/errors';
import { getViewer } from '@/lib/viewer';

import { submissionService } from './submission.service';

export type UploadState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
};

/**
 * Upload as a Server Action rather than a fetch: the payload is a file, and this gives
 * progressive enhancement plus `revalidatePath` for free. It calls the same service the
 * route handler does — the rules live in one place.
 */
export async function uploadSubmission(
  _previous: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const assessmentId = formData.get('assessmentId');
  const file = formData.get('file');

  if (typeof assessmentId !== 'string' || !assessmentId) {
    return { status: 'error', message: 'Select an assessment.' };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'error', message: 'Choose a file to upload.' };
  }

  try {
    const viewer = await getViewer();
    const attempt = await submissionService.submit(viewer, { assessmentId, file });

    revalidatePath('/me/assessments');
    revalidatePath('/me');

    return {
      status: 'success',
      message: attempt.isLate
        ? `Submitted ${attempt.delay} after the deadline.`
        : 'Submission received.',
    };
  } catch (error) {
    // Domain errors carry copy written for the student; anything else must not leak.
    return {
      status: 'error',
      message: isAppError(error)
        ? error.message
        : 'That upload failed. Please try again.',
    };
  }
}
