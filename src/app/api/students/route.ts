import { studentFiltersSchema } from '@/features/students';
import { studentService } from '@/features/students/server';
import { fail, ok } from '@/lib/api-response';
import { getViewer } from '@/lib/viewer';

export async function GET(request: Request) {
  try {
    const viewer = await getViewer();
    const params = new URL(request.url).searchParams;

    const filters = studentFiltersSchema.parse({
      search: params.get('search') ?? undefined,
      programmeId: params.get('programmeId') ?? undefined,
      status: params.get('status') ?? undefined,
    });

    return ok(await studentService.list(viewer, filters));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await getViewer();
    const student = await studentService.create(viewer, await request.json());
    return ok(student, 201);
  } catch (error) {
    return fail(error);
  }
}
