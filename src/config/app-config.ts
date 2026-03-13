export type AppConfig = {
  NODE_ENV: 'development' | 'production' | 'test'
  SERVICE_NAME: string
  CORS_ORIGINS: string
  MAX_UPLOAD_BYTES: number
  UPLOAD_DIR: string
}

export type CloudflareBindings = {
  NODE_ENV?: string
  SERVICE_NAME?: string
  CORS_ORIGINS?: string
  MAX_UPLOAD_BYTES?: string | number
  UPLOAD_DIR?: string
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  NODE_ENV: 'development',
  SERVICE_NAME: 'api-gateway',
  CORS_ORIGINS: '*',
  MAX_UPLOAD_BYTES: 500 * 1024 * 1024,
  UPLOAD_DIR: './uploads',
}

export function buildAppConfigFromBindings(
  bindings: CloudflareBindings,
): AppConfig {
  const parsedMaxUpload = Number(bindings.MAX_UPLOAD_BYTES)

  return {
    NODE_ENV:
      bindings.NODE_ENV === 'production' ||
      bindings.NODE_ENV === 'test' ||
      bindings.NODE_ENV === 'development'
        ? bindings.NODE_ENV
        : DEFAULT_APP_CONFIG.NODE_ENV,
    SERVICE_NAME: bindings.SERVICE_NAME ?? DEFAULT_APP_CONFIG.SERVICE_NAME,
    CORS_ORIGINS: bindings.CORS_ORIGINS ?? DEFAULT_APP_CONFIG.CORS_ORIGINS,
    MAX_UPLOAD_BYTES: Number.isFinite(parsedMaxUpload)
      ? parsedMaxUpload
      : DEFAULT_APP_CONFIG.MAX_UPLOAD_BYTES,
    UPLOAD_DIR: bindings.UPLOAD_DIR ?? DEFAULT_APP_CONFIG.UPLOAD_DIR,
  }
}

export function isBunRuntime(): boolean {
  return typeof Bun !== 'undefined' && typeof Bun.write === 'function'
}
