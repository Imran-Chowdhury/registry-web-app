import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { AppError, type ErrorCode, isAppError } from './errors';

/**
 * Every route handler returns one of exactly two shapes. An error is never returned
 * with a 200 status.
 */
export type ApiSuccess<T> = { data: T };
export type ApiFailure = {
  error: {
    code: ErrorCode;
    message: string;
    fields?: Record<string, string[]>;
  };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export function ok<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ data }, { status });
}

/**
 * Maps anything thrown below the transport layer onto the error envelope. Route
 * handlers should never construct a status code themselves.
 */
export function fail(error: unknown): NextResponse<ApiFailure> {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR' as const,
          message: 'The submitted data is invalid.',
          fields: fieldErrorsFrom(error),
        },
      },
      { status: 400 },
    );
  }

  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
        },
      },
      { status: error.status },
    );
  }

  const prismaConflict = conflictFromPrisma(error);
  if (prismaConflict) {
    return NextResponse.json(
      { error: { code: prismaConflict.code, message: prismaConflict.message } },
      { status: prismaConflict.status },
    );
  }

  // Genuinely unexpected: log the detail server-side, tell the client nothing useful
  // to an attacker.
  console.error('[api] unhandled error', error);
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR' as const,
        message: 'Something went wrong. Please try again.',
      },
    },
    { status: 500 },
  );
}

function fieldErrorsFrom(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_root';
    (fields[key] ??= []).push(issue.message);
  }
  return fields;
}

/**
 * Detected structurally rather than by importing the generated Prisma client, which
 * would pull the client into any bundle that imports this module.
 */
function conflictFromPrisma(error: unknown): AppError | null {
  if (typeof error !== 'object' || error === null) return null;
  const code = (error as { code?: unknown }).code;
  if (code === 'P2002') {
    const target = (error as { meta?: { target?: unknown } }).meta?.target;
    const field = Array.isArray(target) ? target.join(', ') : undefined;
    return new AppError(
      'CONFLICT',
      field ? `A record with that ${field} already exists.` : 'That record already exists.',
      409,
    );
  }
  if (code === 'P2025') {
    return new AppError('NOT_FOUND', 'Record not found.', 404);
  }
  return null;
}
