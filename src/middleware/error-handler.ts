import type { ErrorHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { errorHandler } from '@hls/shared'
import { createLogger } from '@hls/shared'
import type { AppType } from '../app.ts'

const fallbackLog = createLogger({ module: 'error-handler' })

export const globalErrorHandler: ErrorHandler<AppType> = (err, c) => {
  const log = c.get('logger') ?? fallbackLog

  if (err instanceof HTTPException) {
    log.warn({ status: err.status, message: err.message }, 'HTTPException')
    return err.getResponse()
  }

  log.error({ err }, 'Unhandled error')
  return errorHandler(err, c)
}
