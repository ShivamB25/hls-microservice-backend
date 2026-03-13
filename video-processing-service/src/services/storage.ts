import { mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { env } from '../config/env.ts'

export interface StorageBackend {
  ensureOutputDir(videoId: string): Promise<string>
  getOutputPath(videoId: string): string
  getPlaylistPath(videoId: string): string
}

export class LocalStorage implements StorageBackend {
  private readonly baseDir: string

  constructor(baseDir: string = env.HLS_OUTPUT_DIR) {
    this.baseDir = baseDir
  }

  async ensureOutputDir(videoId: string): Promise<string> {
    const dir = this.getOutputPath(videoId)
    await rm(dir, { recursive: true, force: true })
    await mkdir(dir, { recursive: true })
    return dir
  }

  getOutputPath(videoId: string): string {
    return join(this.baseDir, videoId)
  }

  getPlaylistPath(videoId: string): string {
    return join(this.getOutputPath(videoId), 'index.m3u8')
  }
}

export const localStorage = new LocalStorage()
