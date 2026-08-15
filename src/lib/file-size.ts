/**
 * Human-readable file sizes.
 *
 * Kept out of `storage.ts`, which is `server-only`: the submission tables display sizes
 * on the client, and importing them from the storage adapter would drag Node's fs into
 * the browser bundle.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
