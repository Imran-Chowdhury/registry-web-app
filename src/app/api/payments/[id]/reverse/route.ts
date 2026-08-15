import { paymentService } from '@/features/fees/server';
import { fail, ok } from '@/lib/api-response';
import { getViewer } from '@/lib/viewer';

type Context = { params: Promise<{ id: string }> };

/**
 * A reversal is an insert, not a delete — hence POST to its own path rather than
 * DELETE on the payment.
 */
export async function POST(request: Request, { params }: Context) {
  try {
    const viewer = await getViewer();
    const { id } = await params;
    return ok(await paymentService.reverse(viewer, id, await request.json()));
  } catch (error) {
    return fail(error);
  }
}
