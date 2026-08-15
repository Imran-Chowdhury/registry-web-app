import { assessmentService } from '@/features/assessments/server';
import { fail, ok } from '@/lib/api-response';
import { getViewer } from '@/lib/viewer';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const viewer = await getViewer();
    const { id } = await params;
    return ok(await assessmentService.listSubmissions(viewer, id));
  } catch (error) {
    return fail(error);
  }
}
