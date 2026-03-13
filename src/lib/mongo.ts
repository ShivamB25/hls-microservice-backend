import mongoose from 'mongoose'
import { createLogger } from '@hls/shared'
import { env } from '../config/env.ts'

const log = createLogger({ module: 'MongoDB' })

export async function connectMongo(): Promise<void> {
  await mongoose.connect(env.MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5_000,
    socketTimeoutMS: 45_000,
  })
  log.info({ uri: env.MONGO_URI.replace(/\/\/.*@/, '//***@') }, 'MongoDB connected')
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect()
  log.info('MongoDB disconnected')
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1
}
