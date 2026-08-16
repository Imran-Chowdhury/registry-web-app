import { resultService } from '@/features/results/server';
import { fail, ok } from '@/lib/api-response';
import { getViewer } from '@/lib/viewer';

type Context = { params: Promise<{ id: string }> };

/** Every result for one student, for the staff Results tab. Staff only. */
export async function GET(_request: Request, { params }: Context) {
  try {
    const viewer = await getViewer();
    const { id } = await params;
    return ok(await resultService.listForStudent(viewer, id));
  } catch (error) {
    return fail(error);
  }
}
