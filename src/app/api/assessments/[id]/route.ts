import { assessmentService } from '@/features/assessments/server';
import { closeSubmissionsSchema } from '@/features/assessments';
import { fail, ok } from '@/lib/api-response';
import { getViewer } from '@/lib/viewer';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const viewer = await getViewer();
    const { id } = await params;
    return ok(await assessmentService.getById(viewer, id));
  } catch (error) {
    return fail(error);
  }
}

/**
 * Opens or closes the assessment to late work. Its own concern rather than a general
 * assessment edit: the cutoff is a decision with a timestamp, not an attribute.
 */
export async function PATCH(request: Request, { params }: Context) {
  try {
    const viewer = await getViewer();
    const { id } = await params;
    const { closed } = closeSubmissionsSchema.parse(await request.json());

    return ok(await assessmentService.setSubmissionsClosed(viewer, id, closed));
  } catch (error) {
    return fail(error);
  }
}
