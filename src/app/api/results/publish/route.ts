import { resultService } from '@/features/results/server';
import { fail, ok } from '@/lib/api-response';
import { getViewer } from '@/lib/viewer';

/**
 * Its own endpoint rather than a flag on PATCH /results: releasing a whole assessment's
 * marks at once is a different act from moving one, and it is the one that needs the
 * arrears warning in front of it.
 */
export async function POST(request: Request) {
  try {
    const viewer = await getViewer();
    return ok(await resultService.publishAll(viewer, await request.json()));
  } catch (error) {
    return fail(error);
  }
}
