import type { PaginateOptions } from 'mongoose'
import { Video, toVideoResponse } from '../../models/videoModel.ts'
import { NotFoundError } from '@hls/shared'
import type { VideoListQuery, VideoUpdateInput } from '../schemas/video.schema.ts'

export async function listVideos(query: VideoListQuery) {
  const { page, limit, status, sort } = query

  const filter = status ? { status } : {}

  const sortObj = sort.startsWith('-')
    ? { [sort.slice(1)]: -1 as const }
    : { [sort]: 1 as const }

  const options: PaginateOptions = {
    page,
    limit,
    sort: sortObj,
    lean: true,
    leanWithId: true,
    select: '-__v',
  }

  const result = await Video.paginate(filter, options)
  return {
    videos: result.docs.map((video) => toVideoResponse(video)),
    pagination: {
      total: result.totalDocs,
      page: result.page,
      totalPages: result.totalPages,
      hasNext: result.hasNextPage,
      hasPrev: result.hasPrevPage,
      limit: result.limit,
    },
  }
}

export async function getVideoById(id: string) {
  const video = await Video.findById(id).lean()
  if (!video) throw new NotFoundError(`Video ${id} not found`)
  return toVideoResponse(video)
}

export async function updateVideo(id: string, data: VideoUpdateInput) {
  const video = await Video.findByIdAndUpdate(
    id,
    { $set: data },
    { new: true, runValidators: true, lean: true },
  )
  if (!video) throw new NotFoundError(`Video ${id} not found`)
  return toVideoResponse(video)
}

export async function deleteVideo(id: string) {
  const video = await Video.findByIdAndDelete(id)
  if (!video) throw new NotFoundError(`Video ${id} not found`)
}
