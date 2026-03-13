import { RabbitManager } from '@hls/shared'
import { env } from '../config/env.ts'

export const rabbit = new RabbitManager({
  url: env.RABBITMQ_URL,
  maxRetries: 10,
  initialDelayMs: 500,
  maxDelayMs: 30_000,
  prefetch: 10,
})
