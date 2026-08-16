/**
 * File-size helpers and the upload cap.
 *
 * Kept out of `storage.ts`, which is `server-only`: the submission tables display sizes
 * on the client, and importing them from the storage adapter would drag Node's fs into
 * the browser bundle.
 *
 * The cap lives here rather than beside the storage adapter because both sides need it.
 * The server enforces it — the client copy exists only so an oversized file is refused
 * before it is uploaded, with a message naming the actual size.
 */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
