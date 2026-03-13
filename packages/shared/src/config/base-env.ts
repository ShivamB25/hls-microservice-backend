import { z } from 'zod'

export const BaseEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),
  SERVICE_NAME: z.string().default('hls-service'),
})

export type BaseEnv = z.infer<typeof BaseEnvSchema>
