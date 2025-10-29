/**
 * Simple in-memory rate limiter using Deno KV
 * For production, consider using Upstash Redis
 */

const kv = await Deno.openKv()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

/**
 * Check rate limit for a user
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number }> {
  const key = ['ratelimit', action, userId]
  const now = Date.now()
  const windowStart = now - config.windowMs

  // Get current count
  const entry = await kv.get<{ count: number; resetAt: number }>(key)

  if (!entry.value || entry.value.resetAt < now) {
    // New window - reset count
    await kv.set(key, { count: 1, resetAt: now + config.windowMs })
    return { allowed: true, remaining: config.maxRequests - 1 }
  }

  if (entry.value.count >= config.maxRequests) {
    // Rate limit exceeded
    return { allowed: false, remaining: 0 }
  }

  // Increment count
  await kv.set(key, {
    count: entry.value.count + 1,
    resetAt: entry.value.resetAt,
  })

  return {
    allowed: true,
    remaining: config.maxRequests - entry.value.count - 1,
  }
}

/**
 * Predefined rate limit configs
 */
export const RATE_LIMITS = {
  SUBMIT_PROMPT: { maxRequests: 1, windowMs: 60 * 60 * 1000 }, // 1 per hour
  GET_LEADERBOARD: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 per minute
  ADMIN_ACTION: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
}
