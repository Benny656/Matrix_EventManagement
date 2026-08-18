"use client";

const CACHE_STORAGE_KEY = "matrix_swr_cache_v1";
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_DELAY_MS = 1000; // 1 second debounce for writes

interface CacheRecord {
  data: any;
  timestamp: number;
  ttl?: number;
}

// Patterns that must NEVER be persisted to localStorage (sensitive or live transient data)
const EXCLUDED_PATTERNS = [
  "scanner",
  "auth",
  "token",
  "password",
  "live-roster",
  "credential",
];

function shouldPersistKey(key: string): boolean {
  if (typeof key !== "string") return false;
  const lower = key.toLowerCase();
  return !EXCLUDED_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Creates an SWR cache provider backed by localStorage.
 * - Synchronously hydrates from localStorage before the first React render.
 * - Debounces writes back to localStorage.
 * - Evicts expired or sensitive cache entries.
 */
export function createPersistentCacheProvider() {
  if (typeof window === "undefined") {
    return new Map();
  }

  const map = new Map<string, any>();

  // 1. Synchronously hydrate from localStorage on initialization
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (raw) {
      const parsed: Record<string, CacheRecord> = JSON.parse(raw);
      const now = Date.now();

      for (const [key, record] of Object.entries(parsed)) {
        if (!shouldPersistKey(key)) continue;

        const maxAge = record.ttl || DEFAULT_TTL_MS;
        if (now - record.timestamp < maxAge && record.data !== undefined) {
          // Restore SWR cache format: { data, _k: timestamp }
          map.set(key, record.data);
        }
      }
    }
  } catch (err) {
    console.warn("Failed to hydrate SWR cache from localStorage:", err);
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch {}
  }

  // 2. Debounced persistence back to localStorage
  let writeTimeout: NodeJS.Timeout | null = null;

  const persistToStorage = () => {
    try {
      const now = Date.now();
      const exportObject: Record<string, CacheRecord> = {};

      for (const [key, value] of map.entries()) {
        if (!shouldPersistKey(key)) continue;
        if (value === undefined || value === null) continue;

        exportObject[key] = {
          data: value,
          timestamp: now,
          ttl: DEFAULT_TTL_MS,
        };
      }

      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(exportObject));
    } catch (err) {
      console.warn("Failed to persist SWR cache to localStorage:", err);
    }
  };

  const schedulePersist = () => {
    if (writeTimeout) clearTimeout(writeTimeout);
    writeTimeout = setTimeout(persistToStorage, DEBOUNCE_DELAY_MS);
  };

  // 3. Save on window unload
  window.addEventListener("beforeunload", persistToStorage);

  // 4. Wrap map to intercept mutations
  const originalSet = map.set.bind(map);
  const originalDelete = map.delete.bind(map);
  const originalClear = map.clear.bind(map);

  map.set = (key: string, value: any) => {
    const result = originalSet(key, value);
    if (shouldPersistKey(key)) {
      schedulePersist();
    }
    return result;
  };

  map.delete = (key: string) => {
    const result = originalDelete(key);
    if (shouldPersistKey(key)) {
      schedulePersist();
    }
    return result;
  };

  map.clear = () => {
    originalClear();
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch {}
  };

  return map;
}

/**
 * Explicitly clears the persisted SWR cache (e.g. on logout or user switch).
 */
export function clearPersistentCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CACHE_STORAGE_KEY);
  } catch (err) {
    console.warn("Failed to clear persistent cache:", err);
  }
}
