import type { GeocodeResult } from "@/types";
import { buildGeocodeResult } from "./scorer";

const USER_AGENT = "Azimut/1.0 (geocodificador gratuito chileno — github.com/geoidegeoidal/azimut)";

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
  const url = `${NOMINATIM_URL}?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=es`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    signal,
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  return res.json();
}

async function photonSearch(query: string, signal: AbortSignal): Promise<PhotonResult[]> {
  const url = `${PHOTON_URL}?q=${encodeURIComponent(query)}&limit=5&lang=es`;
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

export async function geocodeWithFallback(
  address: string,
  signal: AbortSignal,
): Promise<GeocodeResult> {
  try {
    const nominatimResult = await geocodeNominatim(address, signal);
    if (nominatimResult.found) return nominatimResult;
  } catch {
    // Nominatim failed, try Photon
  }

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
): Promise<GeocodeResult> {
  return geocodeWithFallback(address, signal);
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
): Promise<GeocodeResult> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await rateLimiter.wait();

      const controller = new AbortController();
      const linkedSignal = AbortSignal.any([signal, controller.signal]);
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      try {
        const result = await geocodeAddress(address, linkedSignal);
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
