import { Hono } from 'hono'
import { isMongoConnected } from './lib/mongo.ts'
import { rabbit } from './lib/rabbit.ts'

const healthApp = new Hono()

healthApp.get('/health', (c) =>
  c.json({ status: 'ok', ts: Date.now() }),
)

healthApp.get('/ready', (c) => {
  const mongoOk = isMongoConnected()
  const rabbitOk = rabbit.isConnected()

  if (!mongoOk || !rabbitOk) {
    return c.json({ status: 'not_ready', mongo: mongoOk, rabbit: rabbitOk }, 503)
  }
  return c.json({ status: 'ready', mongo: true, rabbit: true })
})

export function startHealthServer(port: number): ReturnType<typeof Bun.serve> {
  return Bun.serve({
    port,
    fetch: healthApp.fetch,
  })
}
