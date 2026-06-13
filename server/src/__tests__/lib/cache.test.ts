/**
 * Cache Manager Unit Tests
 * Tests cache set/get, TTL expiration, LRU eviction
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { CacheManager } from '../../lib/cache.js';

describe('Cache Manager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({
      maxEntries: 5,
      defaultTTL: 1, // 1 second for faster testing
    });
  });

  describe('set and get', () => {
    it('should store and retrieve values', () => {
      cache.set('key1', 'value1');
      const result = cache.get('key1');

      expect(result).toBe('value1');
    });

    it('should store different data types', () => {
      cache.set('string', 'text');
      cache.set('number', 42);
      cache.set('boolean', true);
      cache.set('object', { foo: 'bar' });
      cache.set('array', [1, 2, 3]);

      expect(cache.get('string')).toBe('text');
      expect(cache.get('number')).toBe(42);
      expect(cache.get('boolean')).toBe(true);
      expect(cache.get('object')).toEqual({ foo: 'bar' });
      expect(cache.get('array')).toEqual([1, 2, 3]);
    });

    it('should return undefined for non-existent key', () => {
      const result = cache.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should overwrite existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');

      const result = cache.get('key1');
      expect(result).toBe('value2');
    });
  });

  describe('TTL expiration', () => {
    it('should expire entry after TTL', async () => {
      cache.set('key1', 'value1', 0.1); // 100ms TTL

      expect(cache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 150));

      const result = cache.get('key1');
      expect(result).toBeUndefined();
    });

    it('should use default TTL when not specified', async () => {
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');

      await new Promise((resolve) => setTimeout(resolve, 1100));

      const result = cache.get('key1');
      expect(result).toBeUndefined();
    });

    it('should support custom TTL per entry', () => {
      cache.set('short', 'value', 0.1);
      cache.set('long', 'value', 10);

      expect(cache.has('short')).toBe(true);
      expect(cache.has('long')).toBe(true);
    });

    it('should get remaining TTL', () => {
      cache.set('key1', 'value1', 10);

      const ttl = cache.ttl('key1');
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(10);
    });

    it('should return -1 for non-existent key TTL', () => {
      const ttl = cache.ttl('nonexistent');
      expect(ttl).toBe(-1);
    });

    it('should return -2 for expired key TTL', async () => {
      cache.set('key1', 'value1', 0.1);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const ttl = cache.ttl('key1');
      expect(ttl).toBe(-2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when at capacity', () => {
      // Fill cache to capacity (5 entries)
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Add 6th entry, should evict key1 (least recently used)
      cache.set('key6', 'value6');

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key6')).toBe('value6');
    });

    it('should update access order on get', async () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      // Access key1, making it most recently used
      cache.get('key1');

      // Add 6th entry, should evict key2 (now least recently used)
      cache.set('key6', 'value6');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should not evict when updating existing key', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4');
      cache.set('key5', 'value5');

      // Update existing key, should not trigger eviction
      cache.set('key3', 'updated_value3');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key3')).toBe('updated_value3');
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('key1', 'value1');
      const deleted = cache.delete('key1');

      expect(deleted).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
    });

    it('should return false when deleting non-existent key', () => {
      const deleted = cache.delete('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const cleared = cache.clear();

      expect(cleared).toBe(3);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBeUndefined();
      expect(cache.get('key3')).toBeUndefined();
    });

    it('should clear entries matching pattern', () => {
      cache.set('user:1', 'data1');
      cache.set('user:2', 'data2');
      cache.set('post:1', 'data3');
      cache.set('post:2', 'data4');

      const cleared = cache.clear('user:*');

      expect(cleared).toBe(2);
      expect(cache.get('user:1')).toBeUndefined();
      expect(cache.get('user:2')).toBeUndefined();
      expect(cache.get('post:1')).toBe('data3');
      expect(cache.get('post:2')).toBe('data4');
    });

    it('should support wildcard patterns', () => {
      cache.set('prefix:abc:suffix', 'data1');
      cache.set('prefix:def:suffix', 'data2');
      cache.set('other:ghi:suffix', 'data3');

      const cleared = cache.clear('prefix:*');

      expect(cleared).toBe(2);
      expect(cache.get('other:ghi:suffix')).toBe('data3');
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', async () => {
      cache.set('key1', 'value1', 0.1);

      expect(cache.has('key1')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys).toContain('key3');
      expect(keys).toHaveLength(3);
    });

    it('should filter keys by pattern', () => {
      cache.set('user:1', 'data1');
      cache.set('user:2', 'data2');
      cache.set('post:1', 'data3');

      const userKeys = cache.keys('user:*');
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');
    });

    it('should exclude expired keys', async () => {
      cache.set('key1', 'value1', 0.1);
      cache.set('key2', 'value2', 10);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const keys = cache.keys();
      expect(keys).toHaveLength(1);
      expect(keys).toContain('key2');
    });
  });

  describe('wrap', () => {
    it('should cache function result', async () => {
      const expensiveFn = jest.fn().mockResolvedValue('computed_value');

      const result1 = await cache.wrap('key1', expensiveFn);
      const result2 = await cache.wrap('key1', expensiveFn);

      expect(result1).toBe('computed_value');
      expect(result2).toBe('computed_value');
      expect(expensiveFn).toHaveBeenCalledTimes(1);
    });

    it('should execute function on cache miss', async () => {
      const expensiveFn = jest.fn().mockResolvedValue('new_value');

      const result = await cache.wrap('key1', expensiveFn);

      expect(result).toBe('new_value');
      expect(expensiveFn).toHaveBeenCalledTimes(1);
    });

    it('should support custom TTL', async () => {
      const fn = jest.fn().mockResolvedValue('value');

      await cache.wrap('key1', fn, 0.1);

      expect(cache.has('key1')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('wrapSync', () => {
    it('should cache synchronous function result', () => {
      const expensiveFn = jest.fn().mockReturnValue('computed_value');

      const result1 = cache.wrapSync('key1', expensiveFn);
      const result2 = cache.wrapSync('key1', expensiveFn);

      expect(result1).toBe('computed_value');
      expect(result2).toBe('computed_value');
      expect(expensiveFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('getStats', () => {
    it('should track cache hits and misses', () => {
      cache.set('key1', 'value1');

      cache.get('key1'); // hit
      cache.get('key2'); // miss
      cache.get('key1'); // hit

      const stats = cache.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should track entry count', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.getStats();

      expect(stats.entries).toBe(2);
    });

    it('should estimate memory usage', () => {
      cache.set('key1', 'a'.repeat(1000));
      cache.set('key2', 'b'.repeat(1000));

      const stats = cache.getStats();

      expect(stats.memoryUsageEstimate).toBeGreaterThan(0);
    });

    it('should calculate hitRate correctly', () => {
      cache.set('key1', 'value1');

      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('key2'); // miss

      const stats = cache.getStats();

      expect(stats.hitRate).toBe(75);
    });
  });

  describe('resetStats', () => {
    it('should reset statistics counters', () => {
      cache.set('key1', 'value1');
      cache.get('key1');
      cache.get('key2');

      cache.resetStats();

      const stats = cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });

    it('should not affect cached entries', () => {
      cache.set('key1', 'value1');
      cache.resetStats();

      expect(cache.get('key1')).toBe('value1');
    });
  });

  describe('cleanup', () => {
    it('should remove expired entries', async () => {
      cache.set('key1', 'value1', 0.1);
      cache.set('key2', 'value2', 10);
      cache.set('key3', 'value3', 0.1);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const cleaned = cache.cleanup();

      expect(cleaned).toBe(2);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBeUndefined();
    });

    it('should return 0 when no expired entries', () => {
      cache.set('key1', 'value1', 10);
      cache.set('key2', 'value2', 10);

      const cleaned = cache.cleanup();

      expect(cleaned).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined values', () => {
      cache.set('key1', undefined);
      const result = cache.get('key1');

      // Since undefined is the return value for cache miss,
      // we check with has() instead
      expect(cache.has('key1')).toBe(true);
    });

    it('should handle null values', () => {
      cache.set('key1', null);
      const result = cache.get('key1');

      expect(result).toBe(null);
    });

    it('should handle empty string keys', () => {
      cache.set('', 'value');
      const result = cache.get('');

      expect(result).toBe('value');
    });

    it('should handle very large objects', () => {
      const largeObject = {
        data: 'x'.repeat(100000),
      };

      cache.set('large', largeObject);
      const result = cache.get('large');

      expect(result).toEqual(largeObject);
    });

    it('should handle rapid sequential sets', () => {
      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, `value${i}`);
      }

      // Only last 5 should remain (maxEntries = 5)
      const stats = cache.getStats();
      expect(stats.entries).toBe(5);
    });
  });
});
