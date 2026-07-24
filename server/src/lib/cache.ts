/**
 * In-memory LRU Cache implementation with TTL support
 * Provides cache-aside pattern and statistics tracking
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
  memoryUsageEstimate: number;
}

interface CacheConfig {
  maxEntries: number;
  defaultTTL: number; // in seconds
}

/**
 * LRU Cache Manager with TTL support
 * Memory-efficient implementation using Map for O(1) operations
 */
export class CacheManager {
  private cache: Map<string, CacheEntry<unknown>>;
  private accessOrder: Map<string, number>; // Track access time for LRU
  private hits: number = 0;
  private misses: number = 0;
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxEntries: config?.maxEntries ?? 1000,
      defaultTTL: config?.defaultTTL ?? 300, // 5 minutes default
    };
    this.cache = new Map();
    this.accessOrder = new Map();
  }

  /**
   * Get a value from cache
   * Returns undefined if not found or expired
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.misses++;
      return undefined;
    }

    // Update access order and hits
    entry.hits++;
    this.accessOrder.set(key, Date.now());
    this.hits++;

    return entry.value as T;
  }

  /**
   * Set a value in cache with optional TTL
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional, uses default if not provided)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.config.maxEntries && !this.cache.has(key)) {
      this.evictLRU();
    }

    const expiresAt = Date.now() + (ttl ?? this.config.defaultTTL) * 1000;

    this.cache.set(key, {
      value,
      expiresAt,
      hits: 0,
    });
    this.accessOrder.set(key, Date.now());
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  /**
   * Clear cache entries matching a pattern or all entries
   * @param pattern - Optional glob-like pattern (supports * wildcard)
   * @returns Number of entries cleared
   */
  clear(pattern?: string): number {
    if (!pattern) {
      const count = this.cache.size;
      this.cache.clear();
      this.accessOrder.clear();
      return count;
    }

    // Convert glob pattern to regex
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
    );

    let cleared = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Cache-aside pattern: get from cache or execute function and cache result
   * @param key - Cache key
   * @param fn - Function to execute if cache miss
   * @param ttl - Time to live in seconds (optional)
   */
  async wrap<T>(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    // Try to get from cache first
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * Synchronous version of wrap for non-async functions
   */
  wrapSync<T>(
    key: string,
    fn: () => T,
    ttl?: number
  ): T {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn();
    this.set(key, result, ttl);
    return result;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.hits + this.misses;

    // Estimate memory usage (rough approximation)
    let memoryEstimate = 0;
    for (const [key, entry] of this.cache.entries()) {
      memoryEstimate += key.length * 2; // String overhead
      memoryEstimate += JSON.stringify(entry.value).length * 2;
      memoryEstimate += 24; // Entry metadata overhead
    }

    return {
      hits: this.hits,
      misses: this.misses,
      entries: this.cache.size,
      hitRate: totalRequests > 0 ? (this.hits / totalRequests) * 100 : 0,
      memoryUsageEstimate: memoryEstimate,
    };
  }

  /**
   * Reset statistics counters
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get all keys matching a pattern
   */
  keys(pattern?: string): string[] {
    const keys: string[] = [];
    const regex = pattern
      ? new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
      : null;

    for (const key of this.cache.keys()) {
      const entry = this.cache.get(key)!;
      // Skip expired entries
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        continue;
      }
      if (!regex || regex.test(key)) {
        keys.push(key);
      }
    }

    return keys;
  }

  /**
   * Get remaining TTL for a key in seconds
   * Returns -1 if key doesn't exist, -2 if expired
   */
  ttl(key: string): number {
    const entry = this.cache.get(key);
    if (!entry) return -1;

    const remaining = entry.expiresAt - Date.now();
    if (remaining <= 0) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return -2;
    }

    return Math.floor(remaining / 1000);
  }

  /**
   * Evict the least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, time] of this.accessOrder.entries()) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  /**
   * Clean up expired entries (can be called periodically)
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.accessOrder.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}

// Singleton cache instance with default configuration
export const cache = new CacheManager({
  maxEntries: 1000,
  defaultTTL: 300, // 5 minutes
});

// Export type for external use
export type { CacheStats, CacheConfig };
