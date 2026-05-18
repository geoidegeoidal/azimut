import callejeroData from "@/data/callejero-names.json";

const namesByComuna = new Map<string, Set<string>>();
const namesIndex = new Map<string, Map<string, string[]>>();

for (const [comuna, streets] of Object.entries(callejeroData as Record<string, string[]>)) {
  const set = new Set(streets);
  namesByComuna.set(comuna, set);

  const byLetter = new Map<string, string[]>();
  for (const street of streets) {
    const letter = street.charAt(0);
    if (!byLetter.has(letter)) byLetter.set(letter, []);
    byLetter.get(letter)!.push(street);
  }
  namesIndex.set(comuna, byLetter);
}

function normalizeCalle(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
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
  const candidates = byLetter?.get(normInput.charAt(0)) ?? [...set];

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

  const inputVia = parts[0];
  const inputRest = parts.slice(1).join(" ");

  for (const candidate of set) {
    const candParts = candidate.split(/\s+/);
    if (candParts.length < 2) continue;
    const candVia = candParts[0];
    const candRest = candParts.slice(1).join(" ");
    if (candRest === inputRest && candVia !== inputVia) {
      return `${candVia} ${candRest}`;
    }
  }

  return street;
}

// ── Segment-based local geocoding (Fase 2) ────────────

export interface CallejeroSegment {
  c: string; // comuna (normalized)
  v: string; // via completa (normalized)
  n: [number, number]; // number range: [min, max]
  g: [[number, number], [number, number]]; // geometry: start/end points
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
  // Remove trailing slash to avoid double slashes
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

export function searchSegment(
  viaCompleta: string,
  numero: number,
  comuna: string,
): { found: boolean; lat?: number; lon?: number; seg?: CallejeroSegment; correctedName?: string } {
  if (!segmentsLoaded) return { found: false };

  const normComuna = normalizeCalle(comuna);
  const segs = segmentsByComuna.get(normComuna);
  if (!segs) return { found: false };

  const normVia = normalizeCalle(viaCompleta);

  // Phase 1: Exact match
  for (const seg of segs) {
    if (seg.v !== normVia) continue;

    if (numero >= seg.n[0] && numero <= seg.n[1]) {
      const [lat, lon] = interpolatePoint(
        seg.g[0],
        seg.g[1],
        seg.n[0],
        seg.n[1],
        numero,
      );
      return { found: true, lat, lon, seg };
    }
  }

  // Fallback: check if number is close to any range (tolerance of 10)
  for (const seg of segs) {
    if (seg.v !== normVia) continue;

    const minNum = seg.n[0];
    const maxNum = seg.n[1];
    const tolerance = 10;

    if (numero >= minNum - tolerance && numero <= maxNum + tolerance) {
      const clamped = Math.min(maxNum, Math.max(minNum, numero));
      const [lat, lon] = interpolatePoint(
        seg.g[0],
        seg.g[1],
        minNum,
        maxNum,
        clamped,
      );
      return { found: true, lat, lon, seg };
    }
  }

  // Phase 2: Fuzzy match against unique street names in this comuna
  const uniqueNames = segmentNamesByComuna.get(normComuna);
  if (!uniqueNames) return { found: false };

  let bestMatch: string | null = null;
  let bestDist = Infinity;

  for (const name of uniqueNames) {
    const dist = levenshtein(normVia, name);
    // Dynamic threshold: longer names allow more distance
    const maxDist = Math.max(2, Math.floor(name.length / 8));
    if (dist <= maxDist && dist < bestDist) {
      bestDist = dist;
      bestMatch = name;
    }
  }

  if (!bestMatch) return { found: false };

  // Phase 3: Search segments with the corrected name
  for (const seg of segs) {
    if (seg.v !== bestMatch) continue;

    if (numero >= seg.n[0] && numero <= seg.n[1]) {
      const [lat, lon] = interpolatePoint(
        seg.g[0],
        seg.g[1],
        seg.n[0],
        seg.n[1],
        numero,
      );
      return { found: true, lat, lon, seg, correctedName: bestMatch };
    }
  }

  // Fallback with tolerance for corrected name
  for (const seg of segs) {
    if (seg.v !== bestMatch) continue;

    const minNum = seg.n[0];
    const maxNum = seg.n[1];
    const tolerance = 10;

    if (numero >= minNum - tolerance && numero <= maxNum + tolerance) {
      const clamped = Math.min(maxNum, Math.max(minNum, numero));
      const [lat, lon] = interpolatePoint(
        seg.g[0],
        seg.g[1],
        minNum,
        maxNum,
        clamped,
      );
      return { found: true, lat, lon, seg, correctedName: bestMatch };
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
