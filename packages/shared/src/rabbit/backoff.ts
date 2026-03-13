/**
 * Exponential backoff with full jitter.
 * Formula: min(cap, random(0, base * 2^attempt))
 *
 * @param attempt - zero-based attempt index
 * @param baseMs  - initial delay in ms (default 500)
 * @param maxMs   - maximum delay in ms (default 30_000)
 */
export function exponentialBackoff(
  attempt: number,
  baseMs = 500,
  maxMs = 30_000,
): number {
  const exponential = baseMs * Math.pow(2, attempt)
  const jitter = Math.random() * 1_000 // ±1s
  return Math.min(exponential + jitter, maxMs)
}

/** Returns a promise that resolves after `ms` milliseconds */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
