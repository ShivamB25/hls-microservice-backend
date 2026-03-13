import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  VideoIdParamSchema,
  VideoListQuerySchema,
  VideoUpdateSchema,
} from '../schemas/video.schema.ts'
import {
  deleteVideo,
  getVideoById,
  listVideos,
  updateVideo,
} from '../services/video.service.ts'
import type { AppType } from '../app.ts'

const videos = new Hono<AppType>()

videos.get(
  '/',
  zValidator('query', VideoListQuerySchema),
  async (c) => {
    const query = c.req.valid('query')
    const result = await listVideos(query)
    return c.json(result)
  },
)

videos.get(
  '/:id',
  zValidator('param', VideoIdParamSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const video = await getVideoById(id)
    return c.json({ data: video })
  },
)

videos.patch(
  '/:id',
  zValidator('param', VideoIdParamSchema),
  zValidator('json', VideoUpdateSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const body = c.req.valid('json')
    const video = await updateVideo(id, body)
    return c.json({ data: video })
  },
)

videos.delete(
  '/:id',
  zValidator('param', VideoIdParamSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    await deleteVideo(id)
    return c.body(null, 204)
  },
)

export default videos
