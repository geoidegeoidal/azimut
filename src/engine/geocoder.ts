import type { GeocodeResult, NormalizedAddress } from "@/types";
import { buildGeocodeResult } from "./scorer";
import { searchSegment, ensureSegmentsLoaded } from "./callejero";

const USER_AGENT = "Azimut/1.0 (geocodificador gratuito chileno - github.com/geoidegeoidal/azimut)";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const PHOTON_URL = "https://photon.komoot.io/api/";

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  osm_type: string;
  osm_id: number;
  importance: number;
}

interface PhotonResult {
  geometry: { coordinates: [number, number] };
  properties: {
    name: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    osm_type: string;
    osm_id: number;
    importance?: number;
    type: string;
  };
}

async function nominatimSearch(query: string, signal: AbortSignal): Promise<NominatimResult[]> {
  const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=es&countrycodes=cl`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal,
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json();
}

async function photonSearch(query: string, signal: AbortSignal): Promise<PhotonResult[]> {
  const pQuery = query.toLowerCase().includes("chile") ? query : `${query}, Chile`;
  const url = `${PHOTON_URL}?q=${encodeURIComponent(pQuery)}&limit=5&lang=es`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal,
  });
  if (!res.ok) throw new Error(`Photon ${res.status}`);
  const data = await res.json();
  return data.features || [];
}

export async function geocodeNominatim(
  address: string,
  signal: AbortSignal,
): Promise<GeocodeResult> {
  const results = await nominatimSearch(address, signal);

  if (results.length === 0) {
    return notFoundResult();
  }

  const best = results[0];
  return buildGeocodeResult(
    {
      lat: parseFloat(best.lat),
      lon: parseFloat(best.lon),
      displayName: best.display_name,
      osmType: best.osm_type,
      osmId: best.osm_id,
      importance: best.importance,
      resultCount: results.length,
    },
    address,
    "Nominatim",
  );
}

export async function geocodePhoton(
  address: string,
  signal: AbortSignal,
): Promise<GeocodeResult> {
  const results = await photonSearch(address, signal);

  if (results.length === 0) {
    return notFoundResult();
  }

  const best = results[0];
  const p = best.properties;
  const displayParts = [
    p.name || "",
    p.street ? `${p.street} ${p.housenumber || ""}` : "",
    p.city || "",
    p.state || "",
    p.country || "",
  ].filter(Boolean);

  return buildGeocodeResult(
    {
      lat: best.geometry.coordinates[1],
      lon: best.geometry.coordinates[0],
      displayName: displayParts.join(", "),
      osmType: p.osm_type || p.type,
      osmId: p.osm_id,
      importance: p.importance ?? 0.3,
      resultCount: results.length,
    },
    address,
    "Photon",
  );
}

/**
 * Try to geocode using the official Chilean callejero (IDE Chile).
 * Waits for segments to load if needed.
 * Returns null if callejero can't resolve this address (falls through to Nominatim/Photon).
 */
export async function geocodeCallejero(
  normalized: NormalizedAddress,
): Promise<GeocodeResult | null> {
  const comuna = normalized.comuna || "";
  const numStr = normalized.numero;

  // Callejero requires both comuna and street number
  if (!comuna || !numStr) return null;

  const numero = parseInt(numStr, 10);
  if (isNaN(numero) || numero <= 0) return null;

  // Build street name WITHOUT number for segment lookup
  const viaCompleta = normalized.callejeroCorrected
    || (normalized.via && normalized.nombre ? `${normalized.via} ${normalized.nombre}` : undefined)
    || normalized.normalized;

  // Ensure segments are loaded before searching (waits if loading in progress)
  const loaded = await ensureSegmentsLoaded();
  if (!loaded) return null;

  const result = searchSegment(viaCompleta, numero, comuna);
  if (!result.found || result.lat === undefined || result.lon === undefined) return null;

  const displayName = `${viaCompleta} ${numero}, ${comuna}, Chile`;

  return {
    lat: result.lat,
    lon: result.lon,
    score: 95,
    precision: "excelente",
    matchType: "callejero",
    importance: 0.9,
    api: "Callejero IDE Chile",
    displayName,
    found: true,
    osmType: "callejero",
    completeness: 95,
    uniqueness: 100,
    timestamp: Date.now(),
  };
}

export async function geocodeWithFallback(
  address: string,
  signal: AbortSignal,
  normalized?: NormalizedAddress,
): Promise<GeocodeResult> {
  // Layer 1: Callejero (if comuna and number are known)
  if (normalized) {
    try {
      const callejeroResult = await geocodeCallejero(normalized);
      if (callejeroResult) return callejeroResult;
    } catch {
      // Callejero failed, fall through to APIs
    }
  }

  // Layer 2: Nominatim
  try {
    const nominatimResult = await geocodeNominatim(address, signal);
    if (nominatimResult.found) return nominatimResult;
  } catch {
    // Nominatim failed, try Photon
  }

  // Layer 3: Photon
  try {
    return await geocodePhoton(address, signal);
  } catch {
    return notFoundResult();
  }
}

function notFoundResult(): GeocodeResult {
  return {
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
  };
}

export function geocodeAddress(
  address: string,
  signal: AbortSignal,
  normalized?: NormalizedAddress,
): Promise<GeocodeResult> {
  return geocodeWithFallback(address, signal, normalized);
}

export class RateLimiter {
  private lastCall = 0;
  private minInterval: number;

  constructor(requestsPerSecond: number) {
    this.minInterval = 1000 / requestsPerSecond;
  }

  async wait(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCall;
    if (elapsed < this.minInterval) {
      await new Promise((r) => setTimeout(r, this.minInterval - elapsed));
    }
    this.lastCall = Date.now();
  }
}

export async function geocodeWithRetry(
  address: string,
  signal: AbortSignal,
  rateLimiter: RateLimiter,
  maxRetries = 3,
  normalized?: NormalizedAddress,
): Promise<GeocodeResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await rateLimiter.wait();

      const controller = new AbortController();
      const linkedSignal = AbortSignal.any([signal, controller.signal]);
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const result = await geocodeAddress(address, linkedSignal, normalized);
        clearTimeout(timeoutId);
        return result;
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    } catch {
      if (attempt < maxRetries - 1) {
        const backoff = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }

  return notFoundResult();
}
