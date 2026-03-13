import { createMiddleware } from 'hono/factory'

export const requestIdMiddleware = createMiddleware(async (c, next) => {
  const incoming = c.req.header('x-request-id')
  const reqId = incoming ?? crypto.randomUUID()
  c.set('reqId', reqId)
  c.header('x-request-id', reqId)
  await next()
})
