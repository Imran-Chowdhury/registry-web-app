import { paymentService } from '@/features/fees/server';
import { fail, ok } from '@/lib/api-response';
import { getViewer } from '@/lib/viewer';

export async function GET(request: Request) {
  try {
    const viewer = await getViewer();
    const search = new URL(request.url).searchParams.get('search') ?? undefined;
    return ok(await paymentService.listLedger(viewer, search || undefined));
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await getViewer();
    const fee = await paymentService.record(viewer, await request.json());
    return ok(fee, 201);
  } catch (error) {
    return fail(error);
  }
}
