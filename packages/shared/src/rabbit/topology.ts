import type { Channel } from 'amqplib'
import { EXCHANGES, QUEUES, ROUTING_KEYS } from './contracts.ts'

/**
 * Declare all exchanges, queues, and bindings.
 * Safe to call on every reconnect — idempotent.
 */
export async function assertTopology(channel: Channel): Promise<void> {
  // ── Main topic exchange ────────────────────────────────────────────────────
  await channel.assertExchange(EXCHANGES.VIDEO, 'topic', { durable: true })

  // ── Dead-letter exchange (fanout — catches all nacked/expired) ─────────────
  await channel.assertExchange(EXCHANGES.VIDEO_DLX, 'fanout', {
    durable: true,
  })

  // ── DLQ — final resting place for poison messages ─────────────────────────
  await channel.assertQueue(QUEUES.TRANSCODE_DLQ, {
    durable: true,
    arguments: { 'x-queue-type': 'quorum' },
  })
  await channel.bindQueue(QUEUES.TRANSCODE_DLQ, EXCHANGES.VIDEO_DLX, '#')

  // ── Main work queue — failed messages → DLX ───────────────────────────────
  await channel.assertQueue(QUEUES.TRANSCODE, {
    durable: true,
    arguments: {
      'x-queue-type': 'quorum',
      'x-dead-letter-exchange': EXCHANGES.VIDEO_DLX,
      'x-message-ttl': 86_400_000, // 24h max age
    },
  })
  await channel.bindQueue(
    QUEUES.TRANSCODE,
    EXCHANGES.VIDEO,
    ROUTING_KEYS.TRANSCODE_REQUESTED,
  )
}
