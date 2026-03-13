import ffmpeg from 'fluent-ffmpeg'
import { createLogger } from '@hls/shared'
import { env } from '../config/env.ts'
import { localStorage } from './storage.ts'

const log = createLogger({ module: 'transcoder' })
const ffmpegBin = env.FFMPEG_PATH ?? 'ffmpeg'

export interface TranscodeOptions {
  videoId: string
  inputPath: string
  targetResolutions: ReadonlyArray<string>
}

export interface TranscodeResult {
  playlistPath: string
  outputDir: string
}

const RESOLUTION_MAP: Record<string, { scale: string; bitrate: string }> = {
  '360p': { scale: '640:360', bitrate: '800k' },
  '480p': { scale: '854:480', bitrate: '1400k' },
  '720p': { scale: '1280:720', bitrate: '2800k' },
  '1080p': { scale: '1920:1080', bitrate: '5000k' },
  '4k': { scale: '3840:2160', bitrate: '15000k' },
}

if (env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(env.FFMPEG_PATH)
}

export async function transcodeToHLS(
  opts: TranscodeOptions,
): Promise<TranscodeResult> {
  const { videoId, inputPath, targetResolutions } = opts
  const outputDir = await localStorage.ensureOutputDir(videoId)
  const playlistPath = localStorage.getPlaylistPath(videoId)

  if (targetResolutions.length > 1) {
    throw new Error(
      `Multi-resolution HLS is not implemented yet. Received: ${targetResolutions.join(', ')}`,
    )
  }

  const resolution = targetResolutions[0] ?? '720p'
  const resConfig = RESOLUTION_MAP[resolution] ?? RESOLUTION_MAP['720p']!

  log.info({ videoId, resolution, inputPath }, 'Starting HLS transcode')

  let fluentError: Error | null = null

  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-profile:v baseline',
          '-level 3.0',
          '-start_number 0',
          '-hls_time 6',
          '-hls_list_size 0',
          `-vf scale=${resConfig.scale}`,
          `-b:v ${resConfig.bitrate}`,
          '-codec:a aac',
          '-b:a 128k',
          '-f hls',
        ])
        .output(playlistPath)
        .on('start', (cmd: string) => {
          log.debug({ videoId, cmd }, 'ffmpeg started')
        })
        .on('progress', (progress: { percent?: number }) => {
          log.info(
            { videoId, percent: Math.round(progress.percent ?? 0) },
            'transcode progress',
          )
        })
        .on('end', () => {
          log.info({ videoId, playlistPath }, 'Transcode complete')
          resolve()
        })
        .on('error', (err: Error) => {
          reject(err)
        })
        .run()
    })
  } catch (err) {
    fluentError = err instanceof Error ? err : new Error(String(err))
    log.error({ err: fluentError, videoId }, 'ffmpeg error — falling back to Bun.spawn')

    try {
      await transcodeViaBunSpawn({ videoId, inputPath, playlistPath, resConfig })
    } catch (spawnError) {
      const combinedError = new AggregateError(
        [fluentError, spawnError],
        `All transcoding strategies failed for video ${videoId}`,
      )
      log.error({ err: combinedError, videoId }, 'All transcoding strategies failed')
      throw combinedError
    }
  }

  return { playlistPath, outputDir }
}

async function transcodeViaBunSpawn(opts: {
  videoId: string
  inputPath: string
  playlistPath: string
  resConfig: { scale: string; bitrate: string }
}): Promise<void> {
  const { videoId, inputPath, playlistPath, resConfig } = opts
  log.info({ videoId }, 'Using Bun.spawn fallback for ffmpeg')

  const proc = Bun.spawn(
    [
      ffmpegBin,
      '-i', inputPath,
      '-profile:v', 'baseline',
      '-level', '3.0',
      '-start_number', '0',
      '-hls_time', '6',
      '-hls_list_size', '0',
      '-vf', `scale=${resConfig.scale}`,
      '-b:v', resConfig.bitrate,
      '-codec:a', 'aac',
      '-b:a', '128k',
      '-f', 'hls',
      playlistPath,
    ],
    { stderr: 'pipe', stdout: 'ignore' },
  )

  const stderrTextPromise = proc.stderr
    ? new Response(proc.stderr).text()
    : Promise.resolve('')
  const exitCode = await proc.exited
  if (exitCode !== 0) {
    const stderr = await stderrTextPromise
    throw new Error(`ffmpeg exited with code ${exitCode}: ${stderr}`)
  }

  log.info({ videoId }, 'Bun.spawn transcode complete')
}
