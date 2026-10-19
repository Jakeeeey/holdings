// Cache utility for managing offline data storage with end-of-day expiration

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// In-memory cache fallback to handle large payloads without exceeding browser localStorage quota
const memoryCache = new Map<string, CacheEntry<unknown>>();

/**
 * Get end of day timestamp (23:59:59.999)
 */
export function getEndOfDayTimestamp(): number {
  const now = new Date();
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
  return endOfDay.getTime();
}

/**
 * Generate cache key from parameters
 */
export function generateCacheKey(
  prefix: string,
  params: Record<string, unknown>,
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(
      (key) =>
        `${key}=${String((params as Record<string, unknown>)[key] ?? "")}`,
    )
    .join("&");
  return `${prefix}:${sortedParams}`;
}

/**
 * Get data from cache (checks in-memory first, then localStorage)
 */
export function getCacheData<T>(key: string): T | null {
  try {
    // 1. Check in-memory cache first
    const memEntry = memoryCache.get(key);
    if (memEntry) {
      if (Date.now() > memEntry.expiresAt) {
        memoryCache.delete(key);
      } else {
        return memEntry.data as T;
      }
    }

    if (typeof window === "undefined") return null;

    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const entry: CacheEntry<T> = JSON.parse(cached);

    // Check if cache has expired
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key);
      return null;
    }

    // Populate in-memory cache
    memoryCache.set(key, entry as CacheEntry<unknown>);

    return entry.data;
  } catch (error) {
    console.warn("Error reading cache:", error);
    return null;
  }
}

/**
 * Set data in cache with end-of-day expiration
 */
export function setCacheData<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: getEndOfDayTimestamp(),
    };

    // Always store in memory cache for high performance & unlimited capacity
    memoryCache.set(key, entry as CacheEntry<unknown>);

    if (typeof window === "undefined") return;

    let serialized: string;
    try {
      serialized = JSON.stringify(entry);
    } catch {
      return;
    }

    // Skip localStorage for payloads over ~2MB to avoid browser QuotaExceededError
    if (serialized.length > 2 * 1024 * 1024) {
      return;
    }

    try {
      localStorage.setItem(key, serialized);
      return;
    } catch {
      // If quota exceeded, try clearing expired cache and evicting oldest entries
      try {
        clearExpiredCache();
        const prefix = key.split(":")[0];
        const candidates: { k: string; ts: number }[] = [];
        for (const k of Object.keys(localStorage)) {
          if (!k.startsWith(prefix + ":")) continue;
          try {
            const e = JSON.parse(
              localStorage.getItem(k) as string,
            ) as CacheEntry<unknown>;
            candidates.push({ k, ts: e.timestamp || 0 });
          } catch {
            localStorage.removeItem(k);
          }
        }
        candidates.sort((a, b) => a.ts - b.ts);
        for (let i = 0; i < Math.min(10, candidates.length); i++) {
          localStorage.removeItem(candidates[i].k);
        }
        // Attempt write once more after eviction
        localStorage.setItem(key, serialized);
      } catch {
        // Silently fall back to in-memory cache and IndexedDB without throwing QuotaExceededError
      }
    }
  } catch (error) {
    console.warn("Could not save to cache:", error);
  }
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  try {
    memoryCache.delete(key);
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  } catch (error) {
    console.warn("Error clearing cache:", error);
  }
}

/**
 * Clear all expired cache entries
 */
export function clearExpiredCache(prefix?: string): void {
  try {
    // Clear expired from in-memory cache
    const now = Date.now();
    for (const [k, v] of memoryCache.entries()) {
      if (prefix && !k.startsWith(prefix)) continue;
      if (v.expiresAt && now > v.expiresAt) {
        memoryCache.delete(k);
      }
    }

    if (typeof window === "undefined") return;

    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (prefix && !key.startsWith(prefix)) return;

      try {
        const cached = localStorage.getItem(key);
        if (!cached) return;

        const entry = JSON.parse(cached);
        if (entry.expiresAt && now > entry.expiresAt) {
          localStorage.removeItem(key);
        }
      } catch {
        // Invalid cache entry, remove it
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.warn("Error clearing expired cache:", error);
  }
}

