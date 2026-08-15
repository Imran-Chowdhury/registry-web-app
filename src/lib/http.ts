import type { ApiResponse } from './api-response';
import type { ErrorCode } from './errors';

/**
 * The client-side half of the API envelope. Every fetch goes through here so a failed
 * request arrives at the UI as a typed error with the server's own message, rather than
 * as a raw Response the caller has to remember to check.
 */
export class HttpError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string[]>;

  constructor(
    code: ErrorCode,
    message: string,
    status: number,
    fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    // A non-JSON body means something upstream of the route handler failed.
    throw new HttpError(
      'INTERNAL_ERROR',
      'The server returned an unreadable response.',
      response.status,
    );
  }

  if (!response.ok || payload === null || 'error' in payload) {
    const error = payload && 'error' in payload ? payload.error : null;
    throw new HttpError(
      error?.code ?? 'INTERNAL_ERROR',
      error?.message ?? 'Something went wrong. Please try again.',
      response.status,
      error?.fields,
    );
  }

  return payload.data;
}

export const http = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(url: string, body: unknown) =>
    request<T>(url, { method: 'PATCH', body: JSON.stringify(body) }),
};
