import type { Context } from 'hono'
import { ZodError } from 'zod'
import { AppError } from './app-error.ts'

export * from './app-error.ts'
export * from './http.ts'
export * from './queue.ts'

export function errorHandler(err: Error, c: Context): Response {
  // Operational errors: known, expected
  if (err instanceof AppError) {
    return c.json(
      {
        code: err.code,
        message: err.message,
        ...(err.context ? { context: err.context } : {}),
      },
      err.statusCode as Parameters<typeof c.json>[1],
    )
  }

  // Zod validation errors from manual throws
  if (err instanceof ZodError) {
    return c.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        issues: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
          code: i.code,
        })),
      },
      422,
    )
  }

  // Unknown — never leak internals in production
  const isDev = process.env['NODE_ENV'] !== 'production'
  return c.json(
    {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      ...(isDev ? { detail: err.message, stack: err.stack } : {}),
    },
    500,
  )
}
