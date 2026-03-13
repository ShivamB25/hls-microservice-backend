import { z } from 'zod'
import type { ConsumeMessage, Channel } from 'amqplib'
import { createLogger } from '@hls/shared'
import { Video } from '../../../models/videoModel.ts'
import { transcodeToHLS } from '../services/transcoder.ts'
import { TargetResolutionSchema } from '../../../src/schemas/video.schema.ts'

const log = createLogger({ module: 'video-process.consumer' })

const VideoJobSchema = z.object({
  videoId: z.string().regex(/^[a-f\d]{24}$/i),
  filePath: z.string().min(1),
  targetResolutions: z.array(TargetResolutionSchema).min(1),
  correlationId: z.string(),
})

export async function handleVideoProcessMessage(
  msg: ConsumeMessage,
  _channel: Channel,
): Promise<void> {
  const raw = JSON.parse(msg.content.toString()) as unknown
  const parsed = VideoJobSchema.safeParse(raw)

  if (!parsed.success) {
    log.error({ issues: parsed.error.issues }, 'Invalid message schema — routing to DLQ')
    throw new Error('Invalid message schema')
  }

  const { videoId, filePath, targetResolutions, correlationId } = parsed.data
  const jobLog = log.child({ videoId, correlationId })

  jobLog.info('Processing video job')

  const video = await Video.findById(videoId)
  if (!video) {
    jobLog.error('Video not found in database — routing to DLQ')
    throw new Error(`Video ${videoId} not found`)
  }

  if (video.status === 'processed') {
    jobLog.warn('Video already processed — skipping')
    return
  }

  if (video.filePath !== filePath) {
    jobLog.warn(
      { messageFilePath: filePath, dbFilePath: video.filePath },
      'Job payload filePath mismatches DB record; using DB value',
    )
  }

  if (
    targetResolutions.length !== video.targetResolutions.length ||
    targetResolutions.some((value, index) => value !== video.targetResolutions[index])
  ) {
    jobLog.warn(
      {
        messageTargetResolutions: targetResolutions,
        dbTargetResolutions: video.targetResolutions,
      },
      'Job payload targetResolutions mismatch DB record; using DB values',
    )
  }

  const claimedVideo = await Video.findOneAndUpdate(
    {
      _id: videoId,
      status: { $in: ['uploaded', 'failed'] },
    },
    {
      $set: {
        status: 'processing',
        processingJobId: correlationId,
        errorMessage: undefined,
      },
    },
    { new: true },
  )

  if (!claimedVideo) {
    const latestVideo = await Video.findById(videoId).lean()
    jobLog.warn(
      { currentStatus: latestVideo?.status },
      'Video could not be claimed for processing; skipping duplicate delivery',
    )
    return
  }

  try {
    const { playlistPath } = await transcodeToHLS({
      videoId,
      inputPath: claimedVideo.filePath,
      targetResolutions: claimedVideo.targetResolutions,
    })

    await claimedVideo.markProcessed(playlistPath)
    jobLog.info({ playlistPath }, 'Video processed successfully')
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    await claimedVideo.markFailed(reason)
    jobLog.error({ err }, 'Video processing failed')
    throw err
  }
}
