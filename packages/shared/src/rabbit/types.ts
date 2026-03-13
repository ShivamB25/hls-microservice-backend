import type { Channel, ChannelModel, ConsumeMessage } from 'amqplib'

export type { Channel, ChannelModel, ConsumeMessage }

/** Message published when a video is ready to be transcoded */
export interface VideoJob {
  videoId: string
  filePath: string
  targetResolutions: ReadonlyArray<'360p' | '480p' | '720p' | '1080p' | '4k'>
  correlationId: string
}

export interface RabbitConfig {
  url: string
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  prefetch?: number
  onPermanentFailure?: (error: Error) => Promise<void> | void
}

export type MessageHandler = (
  msg: ConsumeMessage,
  channel: Channel,
) => Promise<void>
