import amqp from 'amqplib'
import { createLogger } from '../logging/logger.ts'
import { QueueConnectionError, QueuePublishError } from '../errors/index.ts'
import { exponentialBackoff, sleep } from './backoff.ts'
import { assertTopology } from './topology.ts'
import { EXCHANGES } from './contracts.ts'
import type {
  Channel,
  ChannelModel,
  ConsumeMessage,
  MessageHandler,
  RabbitConfig,
} from './types.ts'

const log = createLogger({ module: 'RabbitManager' })

export class RabbitManager {
  private connection: ChannelModel | null = null
  private channel: Channel | null = null
  private retryCount = 0
  private isShuttingDown = false
  private consumers = new Map<string, MessageHandler>()
  private reconnectPromise: Promise<void> | null = null

  private readonly config: Omit<Required<RabbitConfig>, 'onPermanentFailure'> &
    Pick<RabbitConfig, 'onPermanentFailure'>

  constructor(config: RabbitConfig) {
    this.config = {
      maxRetries: 10,
      initialDelayMs: 500,
      maxDelayMs: 30_000,
      prefetch: 10,
      ...config,
    }
  }

  async start(): Promise<void> {
    await this.connect()
  }

  async stop(): Promise<void> {
    this.isShuttingDown = true
    this.reconnectPromise = null
    try {
      await this.channel?.close()
      await this.connection?.close()
      log.info('RabbitMQ connection closed gracefully')
    } catch (err) {
      log.error({ err }, 'Error during RabbitMQ shutdown')
    } finally {
      this.channel = null
      this.connection = null
    }
  }

  async publish<T extends object>(
    routingKey: string,
    payload: T,
    options?: { correlationId?: string; persistent?: boolean },
  ): Promise<void> {
    if (!this.channel) {
      throw new QueuePublishError('Channel not available — not connected', {
        routingKey,
      })
    }

    const content = Buffer.from(JSON.stringify(payload))
    const ok = this.channel.publish(EXCHANGES.VIDEO, routingKey, content, {
      persistent: options?.persistent ?? true,
      contentType: 'application/json',
      correlationId: options?.correlationId,
      timestamp: Date.now(),
    })

    if (!ok) {
      throw new QueuePublishError(
        'Channel write buffer full — apply backpressure',
        { routingKey },
      )
    }
  }

  async consume(queue: string, handler: MessageHandler): Promise<void> {
    if (!this.channel) {
      throw new QueueConnectionError('Channel not available', { queue })
    }

    const existingHandler = this.consumers.get(queue)
    if (existingHandler) {
      if (existingHandler !== handler) {
        log.warn({ queue }, 'Consumer already registered with a different handler')
      } else {
        log.warn({ queue }, 'Consumer already registered; skipping duplicate registration')
      }
      return
    }

    this.consumers.set(queue, handler)

    await this.registerConsumer(queue, handler)

    log.info({ queue }, 'Consumer registered')
  }

  setPermanentFailureHandler(
    handler: (error: Error) => Promise<void> | void,
  ): void {
    this.config.onPermanentFailure = handler
  }

  isConnected(): boolean {
    return this.channel !== null && this.connection !== null
  }

  getChannel(): Channel {
    if (!this.channel) {
      throw new QueueConnectionError('Channel not available')
    }
    return this.channel
  }

  private async registerConsumer(
    queue: string,
    handler: MessageHandler,
  ): Promise<void> {
    const channel = this.channel
    if (!channel) {
      throw new QueueConnectionError('Channel not available', { queue })
    }

    await channel.consume(queue, async (msg) => {
      if (!msg) return // consumer cancelled

      try {
        await handler(msg, channel)
        this.safeAck(channel, msg)
      } catch (err) {
        log.error(
          { err, correlationId: msg.properties.correlationId },
          'Message handler failed — routing to DLQ',
        )
        this.safeNack(channel, msg)
      }
    })
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private async connect(): Promise<void> {
    if (this.isShuttingDown) {
      return
    }

    const { maxRetries, initialDelayMs, maxDelayMs, prefetch } = this.config

    while (this.retryCount <= maxRetries) {
      try {
        const attempt = this.retryCount + 1
        log.info({ attempt }, 'Connecting to RabbitMQ')
        const conn = await amqp.connect(this.config.url)
        const ch = await conn.createChannel()
        await ch.prefetch(prefetch)
        await assertTopology(ch)
        this.connection = conn
        this.channel = ch

        // Reset on success
        this.retryCount = 0
        log.info('RabbitMQ connected — topology ready')

        this.connection.on('error', (err: Error) => {
          log.error({ err }, 'RabbitMQ connection error')
        })
        this.connection.on('close', () => {
          if (!this.isShuttingDown) {
            log.warn('RabbitMQ connection closed unexpectedly — scheduling reconnect')
            this.connection = null
            this.channel = null
            void this.scheduleReconnect()
          }
        })
        this.channel.on('error', (err: Error) => {
          log.error({ err }, 'RabbitMQ channel error')
        })
        this.channel.on('close', () => {
          if (!this.isShuttingDown) {
            log.warn('RabbitMQ channel closed — scheduling reconnect')
            this.channel = null
            void this.scheduleReconnect()
          }
        })

        for (const [queue, handler] of this.consumers.entries()) {
          await this.registerConsumer(queue, handler)
          log.info({ queue }, 'Consumer re-registered after reconnect')
        }

        return
      } catch (err) {
        this.retryCount++
        if (this.retryCount > maxRetries) {
          throw new QueueConnectionError(
            `Failed to connect to RabbitMQ after ${maxRetries} attempts`,
            { cause: String(err) },
          )
        }
        const delay = exponentialBackoff(
          this.retryCount,
          initialDelayMs,
          maxDelayMs,
        )
        log.warn(
          { attempt: this.retryCount, delayMs: Math.round(delay) },
          'RabbitMQ connect failed, retrying',
        )
        await sleep(delay)
      }
    }
  }

  private async scheduleReconnect(): Promise<void> {
    if (this.isShuttingDown) {
      return
    }

    if (this.reconnectPromise) {
      return this.reconnectPromise
    }

    const delay = exponentialBackoff(
      this.retryCount,
      this.config.initialDelayMs,
      this.config.maxDelayMs,
    )
    this.reconnectPromise = (async () => {
      await sleep(delay)
      if (this.isShuttingDown) {
        return
      }
      try {
        await this.connect()
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(`RabbitMQ reconnect failed: ${String(err)}`)
        log.fatal({ err: error }, 'RabbitMQ reconnect failed permanently')
        this.isShuttingDown = true
        const onPermanentFailure = this.config.onPermanentFailure
        if (onPermanentFailure) {
          await onPermanentFailure(error)
        }
      } finally {
        this.reconnectPromise = null
      }
    })()

    await this.reconnectPromise
  }

  private safeAck(channel: Channel, msg: ConsumeMessage): void {
    try {
      channel.ack(msg)
    } catch (err) {
      log.warn({ err, correlationId: msg.properties.correlationId }, 'Ack failed')
    }
  }

  private safeNack(channel: Channel, msg: ConsumeMessage): void {
    try {
      channel.nack(msg, false, false)
    } catch (err) {
      log.warn({ err, correlationId: msg.properties.correlationId }, 'Nack failed')
    }
  }
}
