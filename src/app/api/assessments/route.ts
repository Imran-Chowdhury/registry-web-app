import { assessmentService } from '@/features/assessments/server';
import { fail, ok } from '@/lib/api-response';
import { getViewer } from '@/lib/viewer';

export async function GET() {
  try {
    const viewer = await getViewer();
    return ok(await assessmentService.list(viewer));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await getViewer();
    const assessment = await assessmentService.create(viewer, await request.json());
    return ok(assessment, 201);
  } catch (error) {
    return fail(error);
  }
}
