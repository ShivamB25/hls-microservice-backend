import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { requestIdMiddleware } from './middleware/request-id.ts'
import { requestLoggerMiddleware } from './middleware/request-logger.ts'
import { globalErrorHandler } from './middleware/error-handler.ts'
import health from './routes/health.ts'
import videos from './routes/videos.ts'
import { createUploadRoutes } from './routes/upload.ts'
import type { AppConfig } from './config/app-config.ts'

export type AppVariables = {
  reqId: string
  logger: import('pino').Logger
  config: AppConfig
}

export type AppType = {
  Variables: AppVariables
}

export function buildApp(config: AppConfig) {
  const app = new Hono<AppType>()

  app.use('*', async (c, next) => {
    c.set('config', config)
    await next()
  })

  app.use('*', requestIdMiddleware)
  app.use('*', requestLoggerMiddleware)
  app.use('*', secureHeaders())
  app.use(
    '/api/*',
    cors({
      origin:
        config.CORS_ORIGINS === '*' ? '*' : config.CORS_ORIGINS.split(','),
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      credentials: config.CORS_ORIGINS !== '*',
      maxAge: 600,
    }),
  )

  app.route('/health', health)
  app.route('/api/videos', videos)
  app.route('/api/upload', createUploadRoutes(config))

  app.get('/', (c) =>
    c.json({ service: config.SERVICE_NAME, version: '2.0.0', runtime: 'hono' }),
  )

  app.notFound((c) =>
    c.json({ code: 'NOT_FOUND', message: `Route ${c.req.path} not found` }, 404),
  )
  app.onError(globalErrorHandler)

  return app
}
