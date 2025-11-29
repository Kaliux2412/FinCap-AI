/**
 * Rate Limiter using Token Bucket Algorithm
 * Prevents exceeding Gemini API quota limits
 */

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  private readonly refillInterval: number; // milliseconds

  /**
   * @param maxRequests Maximum number of requests allowed in the time window
   * @param windowMs Time window in milliseconds (default: 60000ms = 1 minute)
   */
  constructor(maxRequests: number = 15, windowMs: number = 60000) {
    this.maxTokens = maxRequests;
    this.tokens = maxRequests;
    this.refillRate = maxRequests / (windowMs / 1000); // tokens per second
    this.refillInterval = windowMs;
    this.lastRefill = Date.now();
  }

  /**
   * Refills tokens based on time elapsed
   */
  private refillTokens(): void {
    const now = Date.now();
    const timePassed = now - this.lastRefill;
    const tokensToAdd = (timePassed / 1000) * this.refillRate;

    this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Attempts to consume a token for an API call
   * @returns Object with success status and wait time if rate limited
   */
  public async tryConsume(): Promise<{ allowed: boolean; waitMs?: number }> {
    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return { allowed: true };
    }

    // Calculate wait time until next token is available
    const waitMs = Math.ceil((1 - this.tokens) / this.refillRate * 1000);
    return { allowed: false, waitMs };
  }

  /**
   * Gets the current number of available tokens
   */
  public getAvailableTokens(): number {
    this.refillTokens();
    return Math.floor(this.tokens);
  }

  /**
   * Resets the rate limiter (useful for testing)
   */
  public reset(): void {
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
  }
}

// Singleton instance for the entire app
// Gemini Free tier: 15 RPM (requests per minute)
// Adjust based on your API tier
export const geminiRateLimiter = new RateLimiter(15, 60000);
