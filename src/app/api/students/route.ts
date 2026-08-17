import { studentQuerySchema } from '@/features/students';
import { studentService } from '@/features/students/server';
import { fail, ok } from '@/lib/api-response';
import { getViewer } from '@/lib/viewer';

export async function GET(request: Request) {
  try {
    const viewer = await getViewer();
    const params = new URL(request.url).searchParams;

    // Absent page params fall back to the schema's defaults, so `GET /api/students`
    // still returns a sensible first page rather than nothing.
    const query = studentQuerySchema.parse({
      search: params.get('search') ?? undefined,
      programmeId: params.get('programmeId') ?? undefined,
      status: params.get('status') ?? undefined,
      overdue: params.get('overdue') ?? undefined,
      page: params.get('page') ?? undefined,
      pageSize: params.get('pageSize') ?? undefined,
    });

    return ok(await studentService.list(viewer, query));
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
