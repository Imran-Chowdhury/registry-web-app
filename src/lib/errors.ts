/**
 * Domain errors thrown by the service layer. Route handlers never build a status code
 * themselves — they throw or propagate one of these and `fail()` maps it.
 */

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
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
    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.fields = fields;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The submitted data is invalid.', fields?: Record<string, string[]>) {
    super('VALIDATION_ERROR', message, 400, fields);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have access to this record.') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Record') {
    super('NOT_FOUND', `${resource} not found.`, 404);
  }
}

/** Duplicate email, duplicate payment reference, or a rule violated by existing state. */
export class ConflictError extends AppError {
  constructor(message = 'That change conflicts with an existing record.') {
    super('CONFLICT', message, 409);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
