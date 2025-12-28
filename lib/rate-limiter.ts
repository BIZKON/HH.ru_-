/**
 * Simple in-memory rate limiter for API endpoints
 * Uses sliding window algorithm to track requests
 */

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests allowed in window
}

interface RateLimitEntry {
  requests: number[]
  resetTime: number
}

class RateLimiter {
  private store = new Map<string, RateLimitEntry>()
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000)
  }

  /**
   * Check if a request should be allowed
   * @param identifier - Unique identifier (e.g., user ID, IP address)
   * @returns Object with allowed status and remaining requests
   */
  check(identifier: string): {
    allowed: boolean
    remaining: number
    resetTime: number
    retryAfter?: number
  } {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry) {
      // First request from this identifier
      this.store.set(identifier, {
        requests: [now],
        resetTime: now + this.config.windowMs,
      })

      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      }
    }

    // Filter out requests outside the current window
    const windowStart = now - this.config.windowMs
    entry.requests = entry.requests.filter((time) => time > windowStart)

    // Check if limit exceeded
    if (entry.requests.length >= this.config.maxRequests) {
      const oldestRequest = Math.min(...entry.requests)
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000)

      return {
        allowed: false,
        remaining: 0,
        resetTime: oldestRequest + this.config.windowMs,
        retryAfter: Math.max(retryAfter, 1),
      }
    }

    // Add current request
    entry.requests.push(now)
    this.store.set(identifier, entry)

    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.requests.length,
      resetTime: entry.resetTime,
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  reset(identifier: string): void {
    this.store.delete(identifier)
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        expiredKeys.push(key)
      }
    }

    for (const key of expiredKeys) {
      this.store.delete(key)
    }

    if (expiredKeys.length > 0) {
      console.log(`[Rate Limiter] Cleaned up ${expiredKeys.length} expired entries`)
    }
  }

  /**
   * Get current stats
   */
  getStats(): { totalKeys: number; totalRequests: number } {
    let totalRequests = 0
    for (const entry of this.store.values()) {
      totalRequests += entry.requests.length
    }

    return {
      totalKeys: this.store.size,
      totalRequests,
    }
  }
}

// Export singleton instances for different endpoints
export const apiRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 60, // 60 requests per minute
})

export const resumeEnrichRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 30, // 30 requests per minute (more restrictive)
})

export const searchRateLimiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 20, // 20 searches per minute
})

/**
 * Helper function to get client identifier from request
 * Uses user ID if available, otherwise falls back to IP address
 */
export function getClientIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  // Try to get IP from various headers
  const forwarded = request.headers.get("x-forwarded-for")
  const realIp = request.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0].trim() || realIp || "unknown"

  return `ip:${ip}`
}
