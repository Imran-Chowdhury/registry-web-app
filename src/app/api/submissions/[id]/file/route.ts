import { submissionService } from '@/features/assessments/server';
import { fail } from '@/lib/api-response';
import { readSubmissionFile } from '@/lib/storage';
import { getViewer } from '@/lib/viewer';

type Context = { params: Promise<{ id: string }> };

/**
 * Downloads go through here, never through a static path. The uploads directory is not
 * served: without this check a student could read another student's coursework by
 * guessing a URL.
 */
export async function GET(_request: Request, { params }: Context) {
  try {
    const viewer = await getViewer();
    const { id } = await params;

    const file = await submissionService.getFileForDownload(viewer, id);
    const bytes = await readSubmissionFile(file.filePath);

    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': file.mimeType,
        // `attachment` so a PDF cannot be rendered inline in the app's own origin.
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.fileName)}"`,
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    return fail(error);
  }
}
