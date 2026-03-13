import { createMiddleware } from 'hono/factory'
import { createLogger } from '@hls/shared'

export const requestLoggerMiddleware = createMiddleware(async (c, next) => {
  const reqId = c.get('reqId') as string | undefined
  const reqLog = createLogger({ reqId, module: 'http' })

  c.set('logger', reqLog)

  const start = Date.now()
  reqLog.info({ method: c.req.method, path: c.req.path }, 'incoming')

  await next()

  reqLog.info(
    { method: c.req.method, path: c.req.path, status: c.res.status, ms: Date.now() - start },
    'completed',
  )
})
