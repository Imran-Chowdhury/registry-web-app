import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /**
     * Coursework upload goes through a Server Action, and Next caps a Server Action body
     * at 1 MB by default — well under the 10 MB file cap this project advertises.
     *
     * That limit is enforced by the framework before the action runs, so it cannot be
     * caught by `useActionState` and surfaces as an unhandled runtime error rather than
     * an inline message. The headroom above 10 MB covers multipart encoding overhead;
     * the real limit is `MAX_FILE_BYTES` in `lib/file-size.ts`, enforced server-side in
     * the storage adapter.
     */
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
};

export default nextConfig;
