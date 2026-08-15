import { studentService } from '@/features/students/server';
import { fail, ok } from '@/lib/api-response';
import { getViewer } from '@/lib/viewer';

type Context = { params: Promise<{ id: string }> };

/**
 * Its own endpoint rather than a field on PATCH /students/[id]: a status change is an
 * audited event with a reason, not an attribute edit.
 */
export async function POST(request: Request, { params }: Context) {
  try {
    const viewer = await getViewer();
    const { id } = await params;
    return ok(await studentService.changeStatus(viewer, id, await request.json()));
  } catch (error) {
    return fail(error);
  }
}
