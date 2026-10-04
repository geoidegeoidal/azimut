import type { GeocodeCandidate, GeocodeResult, NormalizedAddress, SourceStatus } from "@/types";
import { getStreetBounds, hasExactStreetIdentity, loadComunaSegments, matchSegments, searchSegments } from "./callejero";
import type { SegmentSearchResult } from "./callejero";
import { distanceMeters, streetKey, streetSimilarity, textKey } from "./geometry";
import { deduplicateCandidates, localityEvidence, osmCandidates } from "./osm";
import { hasVectorBackend, isSupabaseConfigured, queryOSMVectors, querySpatialIndex } from "./supabase";
import { normalize } from "./normalizer";

export const METHOD_LABELS = { address: "Dirección registrada", interpolated: "Interpolación", provider: "Resultado de proveedor", street: "Sólo calle", area: "Sólo sector", manual: "Ajuste manual" };
const remoteCache = new Map<string, GeocodeCandidate[]>();

export function notFoundResult(sources: SourceStatus[] = []): GeocodeResult {
  return { lat: 0, lon: 0, score: 0, precision: "nulo", matchType: "", importance: 0, api: "", displayName: "", found: false,
    completeness: 0, uniqueness: 0, timestamp: Date.now(), candidates: [], sources, warnings: ["No hay evidencia suficiente para ubicar esta dirección"], needsReview: true };
}

export function resultFromCandidate(candidate: GeocodeCandidate, candidates: GeocodeCandidate[], sources: SourceStatus[]): GeocodeResult {
  const competing = candidates.some(c => c.id !== candidate.id && c.score >= candidate.score - 5 && distanceMeters([candidate.lon, candidate.lat], [c.lon, c.lat]) > 100);
  const score = competing ? Math.min(candidate.score, 69) : candidate.score;
  return { lat: candidate.lat, lon: candidate.lon, score, precision: score >= 85 ? "excelente" : score >= 60 ? "bueno" : score >= 35 ? "regular" : "bajo",
    matchType: candidate.method, importance: 0, api: candidate.source, displayName: candidate.label, found: true, completeness: score, uniqueness: competing ? 40 : 100,
    osmId: candidate.osmId, osmType: candidate.osmType, timestamp: Date.now(), method: candidate.method, evidence: candidate.evidence,
    warnings: [...candidate.warnings, ...(competing ? ["Hay candidatos similares a más de 100 m; revisa la ubicación"] : [])],
    candidates, sources, geometry: candidate.geometry, range: candidate.range, side: candidate.side,
    needsReview: competing || candidate.method !== "address" || candidate.warnings.some(w => /no verificada|aproximad[oa]|confirma/i.test(w)) };
}

function officialCandidates(matches: SegmentSearchResult[], address: NormalizedAddress): GeocodeCandidate[] {
  return matches.slice(0, 12).map((m, i) => ({ id: `ide:${m.seg?.id || i}:${m.side}`, lat: m.lat!, lon: m.lon!, score: Math.round((m.matchScore || 0) * 0.78),
    source: "IDE Chile 2022", method: "interpolated", label: `${m.seg?.v} ${address.numero}, ${address.comuna}`,
    evidence: ["Comuna y calle del maestro oficial", `Numeración ${m.range?.[0]} → ${m.range?.[1]} · lado ${m.side === "left" ? "izquierdo" : "derecho"}`,
      "Posición sobre el eje vial completo"], warnings: ["Estimación sobre el eje de la calle; no identifica una puerta", "Fuente oficial publicada en 2022"],
    geometry: m.seg?.g, range: m.range, side: m.side,
    ...(m.correctedName ? { warnings: ["Nombre de calle aproximado; confirma la corrección", "Estimación sobre el eje de la calle", "Fuente oficial publicada en 2022"] } : {}) }));
}

interface ProviderData {
  id: string; lat: number; lon: number; label: string; source: string; street?: string; number?: string;
  comuna?: string; city?: string; country?: string; type?: string; osmId?: number; osmType?: string;
}

/** Popularity and node/way/relation describe an OSM object, not positional accuracy. */
export function validateProviderCandidate(data: ProviderData, address: NormalizedAddress): GeocodeCandidate | null {
  if (![data.lat, data.lon].every(Number.isFinite) || data.lat < -56.6 || data.lat > -17 || data.lon < -110 || data.lon > -66) return null;
  if (data.country && !["cl", "chile"].includes(textKey(data.country))) return null;
  const locality = localityEvidence({ "addr:district": data.comuna || "", "addr:city": data.city || "" }, address.comuna);
  if (locality.rejected) return null;
  const expectedStreet = address.inputStreet || [address.via, address.nombre].filter(Boolean).join(" ");
  const similarity = streetSimilarity(expectedStreet, data.street || "");
  if (address.comuna && data.street && hasExactStreetIdentity(expectedStreet, address.comuna) && streetKey(expectedStreet) !== streetKey(data.street)) return null;
  if (data.street && similarity < 0.87) return null;
  if (!data.street) return null; // locality/POI centroids cannot resolve a street address
  const comunaVerified = locality.verified;
  const numberMatches = Boolean(address.numero && data.number && textKey(address.numero) === textKey(data.number));
  const recorded = numberMatches && !["road", "street", "administrative", "city"].includes(data.type || "");
  const score = Math.round((recorded ? comunaVerified ? 82 : 69 : 49) * similarity);
  return { id: data.id, lat: data.lat, lon: data.lon, score, source: data.source, method: recorded ? "provider" : "street", label: data.label,
    evidence: ["Nombre de calle compatible", ...(numberMatches ? ["Número de puerta coincide"] : []), ...(comunaVerified ? ["Comuna coincide"] : [])],
    warnings: [...(!comunaVerified ? ["comuna no verificada en la respuesta"] : []), ...(recorded ? ["El proveedor puede usar interpolación; origen del número sin verificar"] : []),
      ...(similarity < 1 ? ["Nombre de calle aproximado; confirma la corrección"] : []), ...(!numberMatches && address.numero ? ["El proveedor no resuelve el número solicitado"] : [])], osmId: data.osmId, osmType: data.osmType };
}

async function providerSearch(address: NormalizedAddress, signal: AbortSignal, provider: "Photon" | "Nominatim"): Promise<GeocodeCandidate[]> {
  const street = address.inputStreet || [address.via, address.nombre].filter(Boolean).join(" ") || address.normalized;
  const query = [street + (address.numero ? ` ${address.numero}` : ""), address.comuna, "Chile"].filter(Boolean).join(", ");
  const cacheKey = `${provider}:${query}`;
  if (remoteCache.has(cacheKey)) return remoteCache.get(cacheKey)!;
  await providerLimiter.wait(signal);
  signal.throwIfAborted();
  const parameters = new URLSearchParams(provider === "Photon" ? { q: query, limit: "8" } : { format: "jsonv2", q: query, limit: "8", addressdetails: "1", countrycodes: "cl" });
  const endpoint = provider === "Photon" ? (import.meta.env.VITE_PHOTON_URL || "https://photon.komoot.io/api/") : import.meta.env.VITE_NOMINATIM_URL;
  const response = await fetch(`${endpoint}${endpoint.includes("?") ? "&" : "?"}${parameters}`, { signal: AbortSignal.any([signal, AbortSignal.timeout(12000)]) });
  if (!response.ok) throw new Error(`${provider} HTTP ${response.status}`);
  const json = await response.json();
  const data: ProviderData[] = provider === "Photon" ? (json.features || []).map((f: { properties: Record<string, string>; geometry: { coordinates: number[] } }) => {
    const p = f.properties;
    return { id: `photon:${p.osm_type}:${p.osm_id}`, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], source: provider,
      street: p.street || (p.type === "street" ? p.name : undefined), number: p.housenumber, comuna: p.district, city: p.city, country: p.countrycode || p.country,
      label: [p.street ? `${p.street} ${p.housenumber || ""}` : p.name, p.district, p.city].filter(Boolean).join(", "), type: p.type, osmType: p.osm_type, osmId: Number(p.osm_id) };
  }) : json.map((p: { osm_type: string; osm_id: number; lat: string; lon: string; display_name: string; addresstype: string; type: string; address?: Record<string, string> }) => ({
    id: `nominatim:${p.osm_type}:${p.osm_id}`, lat: Number(p.lat), lon: Number(p.lon), label: p.display_name, source: provider,
    street: p.address?.road || p.address?.pedestrian, number: p.address?.house_number, comuna: p.address?.city_district || p.address?.municipality,
    city: p.address?.city || p.address?.town, country: p.address?.country_code, type: p.addresstype || p.type, osmId: p.osm_id, osmType: p.osm_type,
  }));
  const candidates = data.map(p => validateProviderCandidate(p, address)).filter((c): c is GeocodeCandidate => c !== null);
  if (remoteCache.size >= 500) remoteCache.delete(remoteCache.keys().next().value!);
  remoteCache.set(cacheKey, candidates);
  return candidates;
}

export async function geocodeWithFallback(raw: string, signal: AbortSignal, normalized?: NormalizedAddress): Promise<GeocodeResult> {
  const address = normalized || normalize(raw);
  if (!address.normalized || signal.aborted) { signal.throwIfAborted(); return notFoundResult(); }
  const street = address.inputStreet || [address.via, address.nombre].filter(Boolean).join(" ");
  const sources: SourceStatus[] = [];
  const candidates: GeocodeCandidate[] = [];
  if (address.comuna) {
    const loaded = await loadComunaSegments(address.comuna, signal);
    signal.throwIfAborted();
    const matches = address.numero && /^\d+$/.test(address.numero) ? searchSegments(street, Number(address.numero), address.comuna) : [];
    candidates.push(...officialCandidates(matches, address));
    sources.push({ source: "IDE Chile 2022", status: loaded ? matches.length ? "ok" : "empty" : "unavailable", detail: loaded ? `${matches.length} rangos compatibles` : "Sin datos locales para esta comuna o error de carga" });
  } else sources.push({ source: "IDE Chile 2022", status: "disabled", detail: "Indica una comuna para consultar rangos oficiales" });
  if (isSupabaseConfigured && address.comuna) {
    try {
      const data = await querySpatialIndex(street, address.comuna, address.numero || "", AbortSignal.any([signal, AbortSignal.timeout(12000)]));
      candidates.push(...officialCandidates(matchSegments(data.segments, street, Number(address.numero)), address), ...data.addresses);
      sources.push({ source: "Supabase / PostGIS", status: "ok", detail: `${data.segments.length} segmentos · ${data.addresses.length} direcciones` });
    } catch { signal.throwIfAborted(); sources.push({ source: "Supabase / PostGIS", status: "unavailable", detail: "No se pudo consultar el índice espacial" }); }
  } else sources.push({ source: "Supabase / PostGIS", status: "disabled", detail: isSupabaseConfigured ? "Indica una comuna para consultar el índice espacial" : "Backend sin configurar" });
  const providers: ("Photon" | "Nominatim")[] = ["Photon", ...(import.meta.env.VITE_NOMINATIM_URL ? ["Nominatim" as const] : [])];
  for (const provider of providers) {
    try {
      const found = await providerSearch(address, signal, provider);
      candidates.push(...found);
      sources.push({ source: provider, status: found.length ? "ok" : "empty", detail: `${found.length} candidatos compatibles` });
    } catch { signal.throwIfAborted(); sources.push({ source: provider, status: "unavailable", detail: "Servicio sin respuesta; se conservan las otras fuentes" }); }
  }
  let bounds = address.comuna ? getStreetBounds(street, address.comuna) : undefined;
  if (!bounds && candidates.length) {
    const anchor = candidates[0];
    bounds = [anchor.lon - 0.005, anchor.lat - 0.005, anchor.lon + 0.005, anchor.lat + 0.005];
  }
  if (hasVectorBackend && bounds) {
    try {
      const data = await queryOSMVectors(street, bounds, AbortSignal.any([signal, AbortSignal.timeout(25000)]));
      const found = osmCandidates(data, address);
      candidates.push(...found);
      sources.push({ source: "OSM vectorial", status: found.length ? "ok" : "empty", detail: `${found.length} direcciones o interpolaciones documentadas` });
    } catch { signal.throwIfAborted(); sources.push({ source: "OSM vectorial", status: "unavailable", detail: "No se pudo enriquecer con geometrías OSM" }); }
  } else sources.push({ source: "OSM vectorial", status: "disabled", detail: hasVectorBackend ? "Sin un área de búsqueda suficientemente localizada" : "Conecta el backend para consultar geometrías OSM" });
  signal.throwIfAborted();
  const ranked = deduplicateCandidates(candidates).slice(0, 8);
  return ranked.length ? resultFromCandidate(ranked[0], ranked, sources) : notFoundResult(sources);
}

export const geocodeAddress = geocodeWithFallback;

export class RateLimiter {
  private next = 0;
  private queue = Promise.resolve();
  constructor(private requestsPerSecond: number) {}
  async wait(signal?: AbortSignal): Promise<void> {
    const task = this.queue.catch(() => {}).then(async () => {
      signal?.throwIfAborted();
      const delay = Math.max(0, this.next - Date.now());
      if (delay) await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { signal?.removeEventListener("abort", abort); resolve(); }, delay);
        const abort = () => { clearTimeout(timer); reject(signal?.reason); };
        signal?.addEventListener("abort", abort, { once: true });
      });
      signal?.throwIfAborted();
      this.next = Date.now() + 1000 / this.requestsPerSecond;
    });
    this.queue = task;
    await task;
  }
}

const providerLimiter = new RateLimiter(1);

// The shared provider limiter handles every request; local interpolation has no artificial delay.
export async function geocodeWithRetry(address: string, signal: AbortSignal, _rateLimiter: RateLimiter, _maxRetries = 3, normalized?: NormalizedAddress): Promise<GeocodeResult> {
  return geocodeWithFallback(address, signal, normalized);
}
