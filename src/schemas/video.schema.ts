import { z } from 'zod'

export const ALLOWED_RESOLUTIONS = ['360p', '480p', '720p', '1080p', '4k'] as const
const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
] as const

export const TargetResolutionSchema = z.enum(ALLOWED_RESOLUTIONS)

export const VideoUploadFormSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().max(5_000).trim().optional(),
  targetResolutions: z.preprocess(
    (value) => {
      if (value === undefined || value === null || value === '') {
        return ['720p']
      }

      const values = Array.isArray(value) ? value : [value]

      return values
        .flatMap((entry) =>
          typeof entry === 'string' ? entry.split(',') : [entry],
        )
        .map((entry) => (typeof entry === 'string' ? entry.trim() : entry))
        .filter((entry) => entry !== '')
    },
    z
      .array(TargetResolutionSchema)
      .min(1)
      .max(5)
      .refine(
        (values) => new Set(values).size === values.length,
        'targetResolutions must be unique',
      ),
  ),
})

export type VideoUploadFormInput = z.infer<typeof VideoUploadFormSchema>

export const VideoUpdateSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  description: z.string().max(5_000).trim().optional(),
})

export type VideoUpdateInput = z.infer<typeof VideoUpdateSchema>

export const VideoListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum(['uploaded', 'processing', 'processed', 'failed'])
    .optional(),
  sort: z
    .enum(['createdAt', '-createdAt', 'title', '-title'])
    .default('-createdAt'),
})

export type VideoListQuery = z.infer<typeof VideoListQuerySchema>

export const VideoIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid MongoDB ObjectId'),
})

export type VideoIdParam = z.infer<typeof VideoIdParamSchema>

export const ALLOWED_MIME_TYPES = ALLOWED_VIDEO_TYPES

export const VideoFileSchema = z.custom<File>(
  (v) => v instanceof File,
  'Must be a file'
).refine((file) => file.size > 0, 'Uploaded file is empty')
.refine((file) => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  return ext && ['mp4', 'mkv', 'avi', 'webm', 'mov'].includes(ext);
}, 'Unsupported video extension. Allowed: mp4, mkv, avi, webm, mov')
.refine(
  (file) => ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number]),
  `Unsupported MIME type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
)
