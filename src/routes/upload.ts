import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { mkdir } from 'node:fs/promises'
import { Video, toVideoResponse } from '../../models/videoModel.ts'
import { rabbit } from '../lib/rabbit.ts'
import { ROUTING_KEYS } from '@hls/shared'
import { BadRequestError, TooLargeError } from '@hls/shared'
import { env } from '../config/env.ts'
import type { VideoJob } from '@hls/shared'
import {
  VideoUploadFormSchema,
  VideoFileSchema,
} from '../schemas/video.schema.ts'
import type { AppType } from '../app.ts'

const upload = new Hono<AppType>()

upload.post(
  '/',
  bodyLimit({
    maxSize: env.MAX_UPLOAD_BYTES,
    onError: () => {
      throw new TooLargeError(
        `File exceeds maximum allowed size of ${env.MAX_UPLOAD_BYTES / 1024 / 1024}MB`,
      )
    },
  }),
  async (c) => {
    const body = await c.req.parseBody()

    const fileResult = VideoFileSchema.safeParse(body['video'])
    if (!fileResult.success) {
      return c.json(
        {
          code: 'VALIDATION_ERROR',
          issues: fileResult.error.issues.map((i) => ({
            path: 'video',
            message: i.message,
          })),
        },
        422,
      )
    }
    const fileField = fileResult.data

    const ext = fileField.name.split('.').pop()?.toLowerCase() ?? 'mp4'

    const scalars = VideoUploadFormSchema.safeParse({
      title: body['title'],
      description: body['description'],
      targetResolutions: body['targetResolutions'],
    })
    if (!scalars.success) {
      return c.json(
        {
          code: 'VALIDATION_ERROR',
          issues: scalars.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        422,
      )
    }

    const { title, description, targetResolutions } = scalars.data

    await mkdir(env.UPLOAD_DIR, { recursive: true })
    const filename = `${crypto.randomUUID()}.${ext}`
    const filePath = `${env.UPLOAD_DIR}/${filename}`
    await Bun.write(filePath, fileField)

    const video = new Video({
      title,
      description,
      filePath,
      mimeType: fileField.type,
      fileSizeBytes: fileField.size,
      targetResolutions,
      status: 'uploaded',
    })
    await video.save()

    const job: VideoJob = {
      videoId: video._id.toString(),
      filePath,
      targetResolutions,
      correlationId: crypto.randomUUID(),
    }

    await rabbit.publish(ROUTING_KEYS.TRANSCODE_REQUESTED, job, {
      correlationId: job.correlationId,
    })

    return c.json({ data: toVideoResponse(video.toObject()) }, 201)
  },
)

export default upload
