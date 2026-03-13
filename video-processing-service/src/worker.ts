import { createLogger } from '@hls/shared'
import { QUEUES } from '@hls/shared'
import { connectMongo, disconnectMongo } from './lib/mongo.ts'
import { rabbit } from './lib/rabbit.ts'
import { handleVideoProcessMessage } from './consumers/video-process.consumer.ts'
import { startHealthServer } from './health.ts'
import { env } from './config/env.ts'

const log = createLogger({ module: 'worker', service: env.SERVICE_NAME })

async function bootstrap() {
  log.info({ env: env.NODE_ENV }, 'Starting Video Processing Worker')

  let healthServer: ReturnType<typeof Bun.serve> | null = null

  const shutdown = async (signal: string, error?: Error) => {
    log.info({ signal, err: error }, 'Worker shutting down')
    try {
      healthServer?.stop(true)
      await rabbit.stop()
      await disconnectMongo()
      log.info('Worker shutdown complete')
      process.exit(error ? 1 : 0)
    } catch (shutdownError) {
      log.fatal({ err: shutdownError }, 'Worker shutdown error')
      process.exit(1)
    }
  }

  rabbit.setPermanentFailureHandler((error) => shutdown('RABBITMQ_FAILURE', error))

  await connectMongo()
  await rabbit.start()

  await rabbit.consume(QUEUES.TRANSCODE, handleVideoProcessMessage)
  log.info({ queue: QUEUES.TRANSCODE }, 'Consumer registered')

  healthServer = startHealthServer(env.PORT)
  log.info({ port: env.PORT }, 'Health server listening')

  process.on('SIGTERM', () => void shutdown('SIGTERM'))
  process.on('SIGINT', () => void shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  console.error('Worker bootstrap failed:', err)
  process.exit(1)
})
