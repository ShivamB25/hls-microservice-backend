import { AppError } from './app-error.ts'

export class ValidationError extends AppError {
  readonly statusCode = 422
  readonly code = 'VALIDATION_ERROR'
  constructor(
    message: string,
    public readonly issues?: unknown[],
  ) {
    super(message, { issues })
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404
  readonly code = 'NOT_FOUND'
}

export class ConflictError extends AppError {
  readonly statusCode = 409
  readonly code = 'CONFLICT'
}

export class UnprocessableError extends AppError {
  readonly statusCode = 422
  readonly code = 'UNPROCESSABLE'
}

export class BadRequestError extends AppError {
  readonly statusCode = 400
  readonly code = 'BAD_REQUEST'
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401
  readonly code = 'UNAUTHORIZED'
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403
  readonly code = 'FORBIDDEN'
}

export class TooLargeError extends AppError {
  readonly statusCode = 413
  readonly code = 'PAYLOAD_TOO_LARGE'
}
