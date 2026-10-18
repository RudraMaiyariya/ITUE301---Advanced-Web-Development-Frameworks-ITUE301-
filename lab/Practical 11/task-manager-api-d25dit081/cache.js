import NodeCache from 'node-cache';

/**
 * Practical 9: In-Memory Caching using node-cache
 * 
 * - Default TTL: 60 seconds (stdTTL: 60)
 * - checkperiod: 120 seconds (cleans up expired entries)
 * - Custom hit/miss tracking for Supplementary Problem 2
 */
const DEFAULT_TTL = 60; // 60 seconds

const cache = new NodeCache({
    stdTTL: DEFAULT_TTL,
    checkperiod: 120,
    useClones: false // performance optimization: returns reference directly
});

// Cache performance metrics tracking for Supplementary Problem 2
export const cacheStats = {
    hits: 0,
    misses: 0,
    invalidations: 0,
    getHitRate() {
        const total = this.hits + this.misses;
        return total === 0 ? '0%' : `${((this.hits / total) * 100).toFixed(1)}%`;
    },
    reset() {
        this.hits = 0;
        this.misses = 0;
        this.invalidations = 0;
    }
};

/**
 * Helper to get item and record hit/miss stats
 */
export function getFromCache(key) {
    const value = cache.get(key);
    if (value !== undefined) {
        cacheStats.hits++;
        return { hit: true, data: value };
    }
    cacheStats.misses++;
    return { hit: false, data: null };
}

/**
 * Helper to store item in cache
 */
export function setInCache(key, data, ttl = DEFAULT_TTL) {
    return cache.set(key, data, ttl);
}

/**
 * Helper to invalidate single or multiple keys
 */
export function invalidateCache(keys) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    cacheStats.invalidations += keyArray.length;
    return cache.del(keyArray);
}

export { cache, DEFAULT_TTL };
export default cache;
