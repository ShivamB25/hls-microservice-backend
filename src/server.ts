import { createLogger } from '@hls/shared'
import { connectMongo, disconnectMongo } from './lib/mongo.ts'
import { rabbit } from './lib/rabbit.ts'
import { buildApp } from './app.ts'
import { env } from './config/env.ts'

const log = createLogger({ module: 'server', service: env.SERVICE_NAME })

async function bootstrap() {
  log.info({ port: env.PORT, env: env.NODE_ENV }, 'Starting API Gateway')

  let server: ReturnType<typeof Bun.serve> | null = null

  const shutdown = async (signal: string, error?: Error) => {
    log.info({ signal, err: error }, 'Shutting down gracefully')
    try {
      server?.stop(true)
      await rabbit.stop()
      await disconnectMongo()
      log.info('Clean shutdown complete')
      process.exit(error ? 1 : 0)
    } catch (shutdownError) {
      log.fatal({ err: shutdownError }, 'Shutdown error')
      process.exit(1)
    }
  }

  rabbit.setPermanentFailureHandler((error) => shutdown('RABBITMQ_FAILURE', error))

  await connectMongo()
  await rabbit.start()

  const app = buildApp()

  server = Bun.serve({
    port: env.PORT,
    fetch: app.fetch,
    maxRequestBodySize: env.MAX_UPLOAD_BYTES,
  })

  log.info({ port: env.PORT }, 'Server listening')

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err)
  process.exit(1)
})
