import callejeroData from "@/data/callejero-names.json";

const namesByComuna = new Map<string, Set<string>>();
const namesIndex = new Map<string, Map<string, string[]>>();
// Reverse index: comuna → (rest-of-name → full-street-name) for O(1) via-type correction
const viaReverseIndex = new Map<string, Map<string, string>>();

for (const [comuna, streets] of Object.entries(callejeroData as Record<string, string[]>)) {
  const set = new Set(streets);
  namesByComuna.set(comuna, set);

  const byLetter = new Map<string, string[]>();
  const byRest = new Map<string, string>();
  for (const street of streets) {
    const letter = street.charAt(0);
    if (!byLetter.has(letter)) byLetter.set(letter, []);
    byLetter.get(letter)!.push(street);

    // Build reverse index: "providencia" → "avenida providencia"
    const spaceIdx = street.indexOf(" ");
    if (spaceIdx > 0) {
      const rest = street.slice(spaceIdx + 1);
      // First entry wins (most common via type for that name)
      if (!byRest.has(rest)) byRest.set(rest, street);
    }
  }
  namesIndex.set(comuna, byLetter);
  viaReverseIndex.set(comuna, byRest);
}

function normalizeCalle(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/['']/g, "")
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + cost,
      );
    }
    const tmp = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[n];
}

/**
 * Dynamic Levenshtein threshold aligned with README spec.
 * Caps at 4 to prevent false positives on long street names.
 */
function getMaxFuzzyDistance(nameLength: number): number {
  if (nameLength <= 16) return 2;
  if (nameLength <= 24) return 3;
  if (nameLength <= 32) return 3;
  return 4;
}

export interface CallejeroMatch {
  name: string;
  distance: number;
  exact: boolean;
}

export interface CallejeroResult {
  found: boolean;
  exactMatch: boolean;
  correctedName?: string;
  suggestions: CallejeroMatch[];
}

export function getComunasDisponibles(): string[] {
  return [...namesByComuna.keys()];
}

export function streetExistsInComuna(street: string, comuna: string): boolean {
  const normComuna = normalizeCalle(comuna);
  const set = namesByComuna.get(normComuna);
  if (!set) return false;
  return set.has(normalizeCalle(street));
}

export function lookupStreet(
  input: string,
  comuna?: string,
  maxDistance = 2,
): CallejeroResult {
  const normInput = normalizeCalle(input);

  if (!comuna) {
    return { found: false, exactMatch: false, suggestions: [] };
  }

  const normComuna = normalizeCalle(comuna);
  const set = namesByComuna.get(normComuna);

  if (!set) {
    return { found: false, exactMatch: false, suggestions: [] };
  }

  if (set.has(normInput)) {
    return {
      found: true,
      exactMatch: true,
      suggestions: [{ name: normInput, distance: 0, exact: true }],
    };
  }

  const byLetter = namesIndex.get(normComuna);
  const letterCandidates = byLetter?.get(normInput.charAt(0));
  // BUG-01 fix: fallback to full set if first-letter bucket is empty or missing
  // This handles typos in the first character (e.g. "Bvenida" vs "Avenida")
  const candidates = letterCandidates && letterCandidates.length > 0 ? letterCandidates : [...set];

  const suggestions: CallejeroMatch[] = [];
  for (const candidate of candidates) {
    const dist = levenshtein(normInput, candidate);
    if (dist <= maxDistance) {
      suggestions.push({ name: candidate, distance: dist, exact: false });
    }
  }

  suggestions.sort((a, b) => a.distance - b.distance);

  if (suggestions.length > 0 && suggestions[0].distance <= maxDistance) {
    return {
      found: true,
      exactMatch: false,
      correctedName: suggestions[0].name,
      suggestions: suggestions.slice(0, 5),
    };
  }

  return { found: false, exactMatch: false, suggestions };
}

export function correctViaType(street: string, comuna: string): string {
  const normInput = normalizeCalle(street);
  const normComuna = normalizeCalle(comuna);
  const set = namesByComuna.get(normComuna);
  if (!set) return street;

  if (set.has(normInput)) return street;

  const parts = normInput.split(/\s+/);
  if (parts.length < 2) return street;

  const inputRest = parts.slice(1).join(" ");

  // O(1) lookup using reverse index instead of O(n) iteration
  const byRest = viaReverseIndex.get(normComuna);
  const match = byRest?.get(inputRest);
  if (match && match !== normInput) {
    return match;
  }

  return street;
}

// ── Segment-based local geocoding (Fase 2) ────────────

export interface CallejeroSegment {
  c: string; // comuna (normalized)
  v: string; // via completa (normalized)
  n: [number, number]; // number range: [min, max]
  g: [[number, number], [number, number]]; // geometry: [start, end] as [lon, lat]
}

let segmentsLoaded = false;
let segmentsLoadPromise: Promise<number> | null = null;
const segmentsByComuna: Map<string, CallejeroSegment[]> = new Map();

// Index: comuna -> unique street names found in segments (for fuzzy matching)
const segmentNamesByComuna: Map<string, Set<string>> = new Map();

export async function loadSegments(baseUrl?: string): Promise<number> {
  if (segmentsLoaded) return segmentsByComuna.size;
  if (segmentsLoadPromise) return segmentsLoadPromise;

  const resolvedBase = baseUrl ?? import.meta.env.BASE_URL ?? "";
  const cleanBase = resolvedBase.replace(/\/$/, "");
  const url = `${cleanBase}/callejero-segments-index.json`;

  segmentsLoadPromise = (async () => {
    try {
      console.log(`[Callejero] Loading segments from ${url}...`);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const data: Record<string, CallejeroSegment[]> = await res.json();

      for (const [comuna, segs] of Object.entries(data)) {
        segmentsByComuna.set(comuna, segs);

        // Build unique street name index for this comuna
        const names = new Set<string>();
        for (const seg of segs) {
          names.add(seg.v);
        }
        segmentNamesByComuna.set(comuna, names);
      }
      segmentsLoaded = true;
      const totalSegs = Object.values(data).reduce((sum, arr) => sum + arr.length, 0);
      console.log(`[Callejero] Loaded ${Object.keys(data).length} comunas, ${totalSegs.toLocaleString()} segments`);
      return segmentsByComuna.size;
    } catch (err) {
      console.error("[Callejero] Failed to load segments:", err);
      segmentsLoadPromise = null; // allow retry
      return 0;
    }
  })();

  return segmentsLoadPromise;
}

/** Ensure segments are loaded before searching. Waits if loading in progress. */
export async function ensureSegmentsLoaded(): Promise<boolean> {
  if (segmentsLoaded) return true;
  const count = await loadSegments();
  return count > 0;
}

/**
 * Interpolate a point along a line segment based on street number.
 * Input points are [lon, lat]. Returns [lon, lat].
 */
function interpolatePoint(
  start: [number, number],
  end: [number, number],
  startNum: number,
  endNum: number,
  targetNum: number,
): [number, number] {
  const totalNumRange = endNum - startNum;
  if (totalNumRange === 0) return start;

  const t = (targetNum - startNum) / totalNumRange;
  return [
    start[0] + t * (end[0] - start[0]),
    start[1] + t * (end[1] - start[1]),
  ];
}

/**
 * Find the best matching street name using fuzzy matching.
 * Returns the corrected name if a close match is found, or null.
 */
function fuzzyMatchStreetName(
  input: string,
  comuna: string,
): string | null {
  const normInput = normalizeCalle(input);
  const normComuna = normalizeCalle(comuna);
  const uniqueNames = segmentNamesByComuna.get(normComuna);
  if (!uniqueNames) return null;

  let bestMatch: string | null = null;
  let bestDist = Infinity;

  for (const name of uniqueNames) {
    const dist = levenshtein(normInput, name);
    // Dynamic threshold aligned with README documentation, capped at 4
    const maxDist = getMaxFuzzyDistance(name.length);
    if (dist <= maxDist && dist < bestDist) {
      bestDist = dist;
      bestMatch = name;
    }
  }

  return bestMatch;
}

export interface SegmentSearchResult {
  found: boolean;
  /** Latitude (correctly ordered) */
  lat?: number;
  /** Longitude (correctly ordered) */
  lon?: number;
  seg?: CallejeroSegment;
  correctedName?: string;
}

/**
 * Search for a street segment by name and number.
 * Uses 3-phase approach: exact match → fuzzy match → number interpolation.
 *
 * IMPORTANT: Segment geometry is stored as [lon, lat].
 * This function returns lat/lon correctly separated.
 */
export function searchSegment(
  viaCompleta: string,
  numero: number,
  comuna: string,
): SegmentSearchResult {
  if (!segmentsLoaded) return { found: false };

  const normComuna = normalizeCalle(comuna);
  const segs = segmentsByComuna.get(normComuna);
  if (!segs) return { found: false };

  const normVia = normalizeCalle(viaCompleta);

  // Phase 1: Exact match on street name
  for (const seg of segs) {
    if (seg.v !== normVia) continue;

    if (numero >= seg.n[0] && numero <= seg.n[1]) {
      // Geometry is [lon, lat]
      const [lon, lat] = interpolatePoint(
        seg.g[0],
        seg.g[1],
        seg.n[0],
        seg.n[1],
        numero,
      );
      return { found: true, lat, lon, seg };
    }
  }

  // Phase 2: Fuzzy match on street name
  const correctedName = fuzzyMatchStreetName(normVia, comuna);
  if (!correctedName) return { found: false };

  // Phase 3: Search segments with corrected name
  for (const seg of segs) {
    if (seg.v !== correctedName) continue;

    if (numero >= seg.n[0] && numero <= seg.n[1]) {
      // Geometry is [lon, lat]
      const [lon, lat] = interpolatePoint(
        seg.g[0],
        seg.g[1],
        seg.n[0],
        seg.n[1],
        numero,
      );
      return { found: true, lat, lon, seg, correctedName };
    }
  }

  return { found: false };
}

export function isSegmentsLoaded(): boolean {
  return segmentsLoaded;
}

export function getSegmentsCount(): number {
  return segmentsByComuna.size;
}
