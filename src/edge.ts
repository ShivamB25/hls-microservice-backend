import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import {
  buildAppConfigFromBindings,
  type CloudflareBindings,
} from './config/app-config.ts'

type ExecutionContext = {
  props: unknown
  waitUntil(promise: Promise<unknown>): void
  passThroughOnException(): void
}

type EdgeEnv = CloudflareBindings

function buildEdgeApp(bindings: EdgeEnv = {}) {
  const config = buildAppConfigFromBindings(bindings)
  const app = new Hono()

  app.use('*', secureHeaders())
  app.use(
    '*',
    cors({
      origin:
        config.CORS_ORIGINS === '*' ? '*' : config.CORS_ORIGINS.split(','),
      allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      credentials: config.CORS_ORIGINS !== '*',
      maxAge: 600,
    }),
  )

  app.get('/', (c) =>
    c.json({
      service: config.SERVICE_NAME,
      version: '2.0.0',
      mode: 'edge-compatible',
      runtime: 'fetch',
    }),
  )

  app.get('/health/live', (c) =>
    c.json({ status: 'ok', mode: 'edge-compatible', ts: Date.now() }),
  )

  app.get('/health/ready', (c) =>
    c.json({
      status: 'degraded',
      message:
        'Edge mode does not connect directly to MongoDB, RabbitMQ, or ffmpeg services.',
    }),
  )

  app.all('/api/*', (c) =>
    c.json(
      {
        code: 'EDGE_MODE_LIMITED',
        message:
          'This edge-compatible entrypoint only provides lightweight health and gateway routes. Full upload, MongoDB, RabbitMQ, and transcoding flows require the Bun/container deployment mode.',
      },
      501,
    ),
  )

  return app
}

const app = buildEdgeApp()

export default {
  fetch(request: Request, env: EdgeEnv, ctx: ExecutionContext) {
    return buildEdgeApp(env).fetch(request, env, ctx)
  },
}

export { app, buildEdgeApp }
