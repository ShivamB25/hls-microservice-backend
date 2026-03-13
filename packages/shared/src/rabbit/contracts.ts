/** Exchange names — topic exchange for flexible routing */
export const EXCHANGES = {
  VIDEO: 'video.events',
  VIDEO_DLX: 'video.events.dlx', // dead-letter exchange (fanout)
} as const

/** Queue names */
export const QUEUES = {
  TRANSCODE: 'video.transcode',
  TRANSCODE_DLQ: 'video.transcode.dlq', // poison messages
} as const

/** Routing keys */
export const ROUTING_KEYS = {
  TRANSCODE_REQUESTED: 'video.transcode.requested',
  TRANSCODE_COMPLETED: 'video.transcode.completed',
  TRANSCODE_FAILED: 'video.transcode.failed',
} as const

export type ExchangeName = (typeof EXCHANGES)[keyof typeof EXCHANGES]
export type QueueName = (typeof QUEUES)[keyof typeof QUEUES]
export type RoutingKey = (typeof ROUTING_KEYS)[keyof typeof ROUTING_KEYS]
