import mongoose from 'mongoose'
import { createLogger } from '@hls/shared'
import { env } from '../config/env.ts'

const log = createLogger({ module: 'MongoDB', service: env.SERVICE_NAME })

export async function connectMongo(): Promise<void> {
  await mongoose.connect(env.MONGO_URI, {
    maxPoolSize: 5,
    serverSelectionTimeoutMS: 5_000,
  })
  log.info('MongoDB connected')
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect()
  log.info('MongoDB disconnected')
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1
}
