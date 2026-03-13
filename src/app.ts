import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { requestIdMiddleware } from './middleware/request-id.ts'
import { requestLoggerMiddleware } from './middleware/request-logger.ts'
import { globalErrorHandler } from './middleware/error-handler.ts'
import health from './routes/health.ts'
import videos from './routes/videos.ts'
import upload from './routes/upload.ts'
import { env } from './config/env.ts'

export type AppVariables = {
  reqId: string
  logger: import('pino').Logger
}

export type AppType = {
  Variables: AppVariables
}

export function buildApp() {
  const app = new Hono<AppType>()

  app.use('*', requestIdMiddleware)
  app.use('*', requestLoggerMiddleware)
  app.use('*', secureHeaders())
  app.use(
    '/api/*',
    cors({
      origin: env.CORS_ORIGINS === '*' ? '*' : env.CORS_ORIGINS.split(','),
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      credentials: env.CORS_ORIGINS !== '*',
      maxAge: 600,
    }),
  )

  app.route('/health', health)
  app.route('/api/videos', videos)
  app.route('/api/upload', upload)

  app.get('/', (c) => c.json({ service: 'hls-api-gateway', version: '2.0.0' }))

  app.notFound((c) =>
    c.json({ code: 'NOT_FOUND', message: `Route ${c.req.path} not found` }, 404),
  )
  app.onError(globalErrorHandler)

  return app
}
