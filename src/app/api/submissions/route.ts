import { submissionService } from '@/features/assessments/server';
import { fail, ok } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { getViewer } from '@/lib/viewer';

/** The signed-in student's own assessments. The viewer comes from the cookie. */
export async function GET() {
  try {
    const viewer = await getViewer();
    return ok(await submissionService.listForSelf(viewer));
  } catch (error) {
    return fail(error);
  }
}

/**
 * Multipart rather than JSON: the payload is a file. The Server Action in the student UI
 * calls the same service, so nothing is duplicated between the two entry points.
 */
export async function POST(request: Request) {
  try {
    const viewer = await getViewer();
    const form = await request.formData();

    const assessmentId = form.get('assessmentId');
    const file = form.get('file');

    if (typeof assessmentId !== 'string' || !assessmentId) {
      throw new ValidationError('Select an assessment.');
    }
    if (!(file instanceof File)) {
      throw new ValidationError('Choose a file to upload.');
    }

    return ok(await submissionService.submit(viewer, { assessmentId, file }), 201);
  } catch (error) {
    return fail(error);
  }
}
