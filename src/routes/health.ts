import { Hono } from 'hono'
import { isMongoConnected } from '../lib/mongo.ts'
import { rabbit } from '../lib/rabbit.ts'
import type { AppType } from '../app.ts'

const health = new Hono<AppType>()

health.get('/live', (c) => c.json({ status: 'ok', ts: Date.now() }))

health.get('/ready', (c) => {
  const mongoOk = isMongoConnected()
  const rabbitOk = rabbit.isConnected()

  if (!mongoOk || !rabbitOk) {
    return c.json(
      { status: 'not_ready', mongo: mongoOk, rabbit: rabbitOk },
      503,
    )
  }
  return c.json({ status: 'ready', mongo: true, rabbit: true })
})

export default health
