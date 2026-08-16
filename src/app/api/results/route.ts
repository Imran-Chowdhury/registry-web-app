import { resultService } from '@/features/results/server';
import { fail, ok } from '@/lib/api-response';
import { ValidationError } from '@/lib/errors';
import { getViewer } from '@/lib/viewer';

/** The marking queue for one assessment: submission, mark, and arrears per student. */
export async function GET(request: Request) {
  try {
    const viewer = await getViewer();
    const assessmentId = new URL(request.url).searchParams.get('assessmentId');
    if (!assessmentId) throw new ValidationError('Name an assessment.');

    return ok(await resultService.listMarkingQueue(viewer, assessmentId));
  } catch (error) {
    return fail(error);
  }
}

/** Record or change a mark. Publication state is not touched here. */
export async function POST(request: Request) {
  try {
    const viewer = await getViewer();
    return ok(await resultService.saveGrade(viewer, await request.json()));
  } catch (error) {
    return fail(error);
  }
}

/** Publish or withhold a single result. */
export async function PATCH(request: Request) {
  try {
    const viewer = await getViewer();
    return ok(await resultService.setStatus(viewer, await request.json()));
  } catch (error) {
    return fail(error);
  }
}
