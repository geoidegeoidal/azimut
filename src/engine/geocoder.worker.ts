import type { GeocodeResult, NormalizedAddress } from "@/types";
import { geocodeWithRetry, RateLimiter } from "./geocoder";
import { openDB } from "idb";

const CACHE_DB = "azimut-cache";
const CACHE_STORE = "geocodes";
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

async function getCache() {
  return openDB(CACHE_DB, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        const store = db.createObjectStore(CACHE_STORE, { keyPath: "key" });
        store.createIndex("timestamp", "timestamp");
      }
    },
  });
}

async function cacheGet(key: string): Promise<GeocodeResult | null> {
  try {
    const db = await getCache();
    const entry = await db.get(CACHE_STORE, key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      await db.delete(CACHE_STORE, key);
      return null;
    }
    return entry.result as GeocodeResult;
  } catch {
    return null;
  }
}

async function cacheSet(key: string, result: GeocodeResult): Promise<void> {
  try {
    const db = await getCache();
    await db.put(CACHE_STORE, { key, result, timestamp: Date.now() });
  } catch {
    // Cache failures are silent
  }
}

export interface GeocodingProgress {
  current: number;
  total: number;
  elapsed: number;
  paused: boolean;
  cancelled: boolean;
}

let pauseFlag = false;
let cancelFlag = false;

export function pause() {
  pauseFlag = true;
}

export function resume() {
  pauseFlag = false;
}

export function cancel() {
  cancelFlag = true;
  pauseFlag = false;
}

function resetFlags() {
  pauseFlag = false;
  cancelFlag = false;
}

async function waitIfPaused(signal: AbortSignal): Promise<void> {
  while (pauseFlag && !cancelFlag && !signal.aborted) {
    await new Promise((r) => setTimeout(r, 100));
  }
}

export async function geocodeBatch(
  addresses: NormalizedAddress[],
  onProgress: (progress: GeocodingProgress) => void,
  signal: AbortSignal,
): Promise<GeocodeResult[]> {
  resetFlags();

  const results: GeocodeResult[] = [];
  const rateLimiter = new RateLimiter(1); // 1 req/sec for Nominatim compliance
  const total = addresses.length;
  let current = 0;
  const startTime = Date.now();

  for (const addr of addresses) {
    if (cancelFlag || signal.aborted) break;
    await waitIfPaused(signal);

    const query = addr.normalized || addr.original;
    const cacheKey = query.toLowerCase().trim();

    const cached = await cacheGet(cacheKey);
    if (cached) {
      results.push(cached);
      current++;
      onProgress({
        current,
        total,
        elapsed: Math.round((Date.now() - startTime) / 1000),
        paused: pauseFlag,
        cancelled: cancelFlag,
      });
      continue;
    }

    const result = await geocodeWithRetry(query, signal, rateLimiter);
    await cacheSet(cacheKey, result);
    results.push(result);

    current++;
    onProgress({
      current,
      total,
      elapsed: Math.round((Date.now() - startTime) / 1000),
      paused: pauseFlag,
      cancelled: cancelFlag,
    });
  }

  while (results.length < addresses.length) {
    results.push({
      lat: 0,
      lon: 0,
      score: 0,
      precision: "nulo",
      matchType: "",
      importance: 0,
      api: "",
      displayName: "",
      found: false,
      completeness: 0,
      uniqueness: 0,
      timestamp: Date.now(),
    });
  }

  return results;
}

export async function clearCache(): Promise<void> {
  try {
    const db = await getCache();
    await db.clear(CACHE_STORE);
  } catch {
    // silent
  }
}
