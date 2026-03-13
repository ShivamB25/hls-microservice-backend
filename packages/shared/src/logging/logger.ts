import pino, { type Logger } from 'pino'

const isDev = process.env['NODE_ENV'] !== 'production'
const level = process.env['LOG_LEVEL'] ?? (isDev ? 'debug' : 'info')
const service = process.env['SERVICE_NAME'] ?? 'hls-service'

const transport = isDev
  ? pino.transport({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
      },
    })
  : pino.transport({
      targets: [
        {
          level: 'info',
          target: 'pino/file',
          options: { destination: 1 }, // stdout
        },
        {
          level: 'error',
          target: 'pino/file',
          options: { destination: 2 }, // stderr
        },
      ],
    })

export const logger: Logger = pino(
  {
    level,
    base: {
      service,
      env: process.env['NODE_ENV'] ?? 'development',
    },
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        '*.password',
        '*.token',
        '*.mongoUri',
        '*.rabbitmqUrl',
      ],
      censor: '[REDACTED]',
    },
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  transport,
)

/**
 * Create a child logger with bound context fields.
 * Each service/request should use its own child — never mutate the root logger.
 */
export function createLogger(context: Record<string, unknown>): Logger {
  return logger.child(context)
}
