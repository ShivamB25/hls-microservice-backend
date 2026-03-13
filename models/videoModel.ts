import mongoose, {
  Schema,
  model,
  type HydratedDocument,
  type Model,
  type PaginateModel,
  Types,
} from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'
import { ALLOWED_RESOLUTIONS } from '../src/schemas/video.schema.ts'

export interface IVideo {
  _id: Types.ObjectId
  title: string
  description?: string
  filePath: string
  hlsOutputPath?: string
  mimeType?: string
  fileSizeBytes?: number
  targetResolutions: string[]
  status: 'uploaded' | 'processing' | 'processed' | 'failed'
  processingJobId?: string
  errorMessage?: string
  createdAt: Date
  updatedAt: Date
}

export interface VideoResponse
  extends Omit<IVideo, '_id'> {
  id: string
}

type VideoLike = Pick<
  IVideo,
  '_id' | 'title' | 'filePath' | 'targetResolutions' | 'status' | 'createdAt' | 'updatedAt'
> &
  Partial<
    Pick<
      IVideo,
      | 'description'
      | 'hlsOutputPath'
      | 'mimeType'
      | 'fileSizeBytes'
      | 'processingJobId'
      | 'errorMessage'
    >
  >

interface IVideoMethods {
  markProcessing(jobId: string): Promise<HydratedDocument<IVideo, IVideoMethods>>
  markProcessed(outputPath: string): Promise<HydratedDocument<IVideo, IVideoMethods>>
  markFailed(reason: string): Promise<HydratedDocument<IVideo, IVideoMethods>>
}

type VideoModel = Model<IVideo, object, IVideoMethods> & PaginateModel<IVideo>

const videoSchema = new Schema<IVideo, VideoModel, IVideoMethods>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5_000 },
    filePath: { type: String, required: true },
    hlsOutputPath: { type: String },
    mimeType: { type: String },
    fileSizeBytes: { type: Number, min: 1 },
    targetResolutions: {
      type: [String],
      enum: ALLOWED_RESOLUTIONS,
      default: ['720p'],
      validate: [
        {
          validator: (values: string[]) => values.length > 0,
          message: 'targetResolutions must contain at least one value',
        },
        {
          validator: (values: string[]) => new Set(values).size === values.length,
          message: 'targetResolutions must be unique',
        },
      ],
    },
    status: {
      type: String,
      enum: ['uploaded', 'processing', 'processed', 'failed'],
      default: 'uploaded',
      index: true,
    },
    processingJobId: { type: String },
    errorMessage: { type: String },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, unknown>) => {
        ret['id'] = (ret['_id'] as { toString(): string } | undefined)?.toString()
        ret['_id'] = undefined
        return ret
      },
    },
  },
)

videoSchema.index({ createdAt: -1 })
videoSchema.index({ status: 1, createdAt: -1 })

videoSchema.methods.markProcessing = function (this: VideoDocument, jobId: string) {
  this.status = 'processing'
  this.processingJobId = jobId
  return this.save()
}

videoSchema.methods.markProcessed = function (this: VideoDocument, outputPath: string) {
  this.status = 'processed'
  this.hlsOutputPath = outputPath
  return this.save()
}

videoSchema.methods.markFailed = function (this: VideoDocument, reason: string) {
  this.status = 'failed'
  this.errorMessage = reason
  return this.save()
}

const paginatePlugin =
  mongoosePaginate as Parameters<typeof videoSchema.plugin>[0]
videoSchema.plugin(paginatePlugin)

export function toVideoResponse(video: VideoLike): VideoResponse {
  return {
    id: video._id.toString(),
    title: video.title,
    filePath: video.filePath,
    targetResolutions: video.targetResolutions,
    status: video.status,
    createdAt: video.createdAt,
    updatedAt: video.updatedAt,
    ...(video.description !== undefined ? { description: video.description } : {}),
    ...(video.hlsOutputPath !== undefined
      ? { hlsOutputPath: video.hlsOutputPath }
      : {}),
    ...(video.mimeType !== undefined ? { mimeType: video.mimeType } : {}),
    ...(video.fileSizeBytes !== undefined
      ? { fileSizeBytes: video.fileSizeBytes }
      : {}),
    ...(video.processingJobId !== undefined
      ? { processingJobId: video.processingJobId }
      : {}),
    ...(video.errorMessage !== undefined ? { errorMessage: video.errorMessage } : {}),
  }
}

export const Video = model<IVideo, VideoModel>('Video', videoSchema)
export type VideoDocument = HydratedDocument<IVideo, IVideoMethods>
