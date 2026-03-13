import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { TooLargeError } from '@hls/shared'
import {
  VideoUploadFormSchema,
  VideoFileSchema,
} from '../schemas/video.schema.ts'
import type { AppType } from '../app.ts'
import type { AppConfig } from '../config/app-config.ts'
import { isBunRuntime } from '../config/app-config.ts'

export function createUploadRoutes(config: AppConfig) {
  const upload = new Hono<AppType>()

  upload.post(
    '/',
    bodyLimit({
      maxSize: config.MAX_UPLOAD_BYTES,
      onError: () => {
        throw new TooLargeError(
          `File exceeds maximum allowed size of ${config.MAX_UPLOAD_BYTES / 1024 / 1024}MB`,
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

      if (!isBunRuntime()) {
        return c.json(
          {
            code: 'RUNTIME_NOT_SUPPORTED',
            message:
              'Binary file ingestion is not available in edge mode. Use Bun/container runtime for uploads.',
          },
          501,
        )
      }

      const { mkdir } = await import('node:fs/promises')
      const [{ Video, toVideoResponse }, { rabbit }, { ROUTING_KEYS }] =
        await Promise.all([
          import('../../models/videoModel.ts'),
          import('../lib/rabbit.ts'),
          import('@hls/shared'),
        ])

      await mkdir(config.UPLOAD_DIR, { recursive: true })
      const filename = `${crypto.randomUUID()}.${ext}`
      const filePath = `${config.UPLOAD_DIR}/${filename}`
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

      const job = {
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

  return upload
}
