import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  SERVICE_NAME: z.string().default('video-processor'),
  MONGO_URI: z
    .string()
    .url()
    .default('mongodb://localhost:27017/hls-microservice'),
  RABBITMQ_URL: z.string().default('amqp://localhost'),
  RABBITMQ_QUEUE: z.string().default('video.transcode'),
  UPLOAD_DIR: z.string().default('./uploads'),
  HLS_OUTPUT_DIR: z.string().default('./hls'),
  MAX_CONCURRENT_JOBS: z.coerce.number().int().min(1).max(20).default(4),
  FFMPEG_PATH: z.string().optional(),
})

const parsed = EnvSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten())
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
