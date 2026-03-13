import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  SERVICE_NAME: z.string().default('api-gateway'),
  MONGO_URI: z
    .string()
    .url()
    .default('mongodb://localhost:27017/hls-microservice'),
  RABBITMQ_URL: z.string().default('amqp://localhost'),
  RABBITMQ_QUEUE: z.string().default('video.transcode'),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_BYTES: z.coerce.number().default(500 * 1024 * 1024), // 500MB
  CORS_ORIGINS: z.string().default('*'),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten())
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
