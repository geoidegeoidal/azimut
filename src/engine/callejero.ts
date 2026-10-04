import callejeroData from "@/data/callejero-names.json";
import { interpolateLine, matchesParity, streetSimilarity, streetKey, textKey } from "./geometry";
import type { Coordinate } from "./geometry";

// ── Known via types (for via-agnostic search) ──────────

const VIA_TYPES = new Set([
  "avenida", "calle", "pasaje", "camino", "carretera", "boulevard",
  "rotonda", "puente", "autopista", "diagonal", "circunvalacion",
  "costanera", "alameda", "plaza", "cerro", "subida", "bajada",
  "prolongacion", "acceso", "callejon", "sendero", "vereda",
  "ruta", "parcela", "loteo", "villa", "poblacion",
]);

// ── Public interfaces ───────────────────────────────────

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

export interface CallejeroSegment {
  c: string; // comuna (normalized)
  v: string; // via completa (normalized)
  n: [number, number]; // number range: [min, max]
  g: Coordinate[];
  l?: [number, number]; // left: initial/final, never sorted
  r?: [number, number]; // right: initial/final, never sorted
  a?: string[];
  id?: string;
}

export interface SmartSearchResult {
  name: string;
  score: number; // 0-100
  matchType: "exact" | "via-corrected" | "token" | "prefix" | "fuzzy";
}

export interface SegmentSearchResult {
  found: boolean;
  lat?: number;
  lon?: number;
  seg?: CallejeroSegment;
  correctedName?: string;
  /** Smart search confidence score (0-100) */
  matchScore?: number;
  /** True if the number was outside the segment range but close enough */
  numberApproximate?: boolean;
  range?: [number, number];
  side?: "left" | "right";
}

// ── Core indices (built synchronously at import) ────────

const namesByComuna = new Map<string, Set<string>>();
const namesIndex = new Map<string, Map<string, string[]>>();
const viaReverseIndex = new Map<string, Map<string, string>>();

/** Token inverted index: comuna → token → Set<streetName> */
const segTokenIndex = new Map<string, Map<string, Set<string>>>();
/** Via-stripped index: comuna → coreNameWithoutVia → fullStreetName[] */
const segViaStrippedIndex = new Map<string, Map<string, string[]>>();
/** Unique street names per comuna (mirrors namesByComuna) */
const segmentNamesByComuna = new Map<string, Set<string>>();

const segmentsByComuna: Map<string, CallejeroSegment[]> = new Map();

// ── Core utilities ──────────────────────────────────────

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

function getMaxFuzzyDistance(nameLength: number): number {
  if (nameLength <= 16) return 2;
  if (nameLength <= 24) return 3;
  if (nameLength <= 32) return 3;
  return 4;
}

/** Strip via type from the beginning of a normalized street name */
function stripVia(tokens: string[]): { via?: string; core: string[] } {
  if (tokens.length > 1 && VIA_TYPES.has(tokens[0])) {
    return { via: tokens[0], core: tokens.slice(1) };
  }
  // Handle "ruta 5", "ruta 5 norte" etc.
  if (tokens.length > 2 && tokens[0] === "ruta" && /^\d+$/.test(tokens[1])) {
    return { via: `${tokens[0]} ${tokens[1]}`, core: tokens.slice(2) };
  }
  return { core: tokens };
}

/** Check if all queryTokens appear within targetTokens in order (subsequence match) */
function tokensContainedInOrder(query: string[], target: string[]): boolean {
  let qi = 0;
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (target[ti] === query[qi] || target[ti].startsWith(query[qi])) {
      qi++;
    }
  }
  return qi === query.length;
}

function buildSmartIndices(comuna: string, streetNames: Set<string>): void {
  const tokenIdx = new Map<string, Set<string>>();
  const viaIdx = new Map<string, string[]>();

  for (const name of streetNames) {
    const tokens = name.split(/\s+/).filter(t => t.length > 0);

    // Token inverted index (skip tokens < 2 chars)
    for (const token of tokens) {
      if (token.length < 2) continue;
      if (!tokenIdx.has(token)) tokenIdx.set(token, new Set());
      tokenIdx.get(token)!.add(name);
    }

    // Via-stripped index: "providencia" → ["avenida providencia", "calle providencia"]
    const { core } = stripVia(tokens);
    if (core.length > 0 && core.join(" ") !== name) {
      const coreStr = core.join(" ");
      if (!viaIdx.has(coreStr)) viaIdx.set(coreStr, []);
      viaIdx.get(coreStr)!.push(name);
    }
  }

  segTokenIndex.set(comuna, tokenIdx);
  segViaStrippedIndex.set(comuna, viaIdx);
}

// ── Synchronous initialization loop ─────────────────────

for (const [comuna, streets] of Object.entries(callejeroData as Record<string, string[]>)) {
  const set = new Set(streets);
  namesByComuna.set(comuna, set);
  segmentNamesByComuna.set(comuna, set);

  // Build smart search indices synchronously at startup
  buildSmartIndices(comuna, set);

  const byLetter = new Map<string, string[]>();
  const byRest = new Map<string, string>();
  for (const street of streets) {
    const letter = street.charAt(0);
    if (!byLetter.has(letter)) byLetter.set(letter, []);
    byLetter.get(letter)!.push(street);

    const spaceIdx = street.indexOf(" ");
    if (spaceIdx > 0) {
      const rest = street.slice(spaceIdx + 1);
      if (!byRest.has(rest)) byRest.set(rest, street);
    }
  }
  namesIndex.set(comuna, byLetter);
  viaReverseIndex.set(comuna, byRest);
}

// ── Exported API ────────────────────────────────────────

export function getComunasDisponibles(): string[] {
  return [...namesByComuna.keys()];
}

export function streetExistsInComuna(street: string, comuna: string): boolean {
  const normComuna = normalizeCalle(comuna);
  const set = namesByComuna.get(normComuna);
  if (!set) return false;
  return set.has(normalizeCalle(street));
}

export function hasExactStreetIdentity(street: string, comuna: string): boolean {
  const identity = streetKey(street);
  return [...(namesByComuna.get(textKey(comuna)) || [])].some(name => streetKey(name) === identity);
}

export function lookupStreet(
  input: string,
  comuna?: string,
  maxDistance = 2,
): CallejeroResult {
  if (!comuna || !input.trim()) {
    return { found: false, exactMatch: false, suggestions: [] };
  }

  const normInput = normalizeCalle(input);
  const normComuna = normalizeCalle(comuna);
  const set = namesByComuna.get(normComuna);

  if (!set || normInput.length === 0) {
    return { found: false, exactMatch: false, suggestions: [] };
  }

  // Fast path: Exact set match
  if (set.has(normInput)) {
    return {
      found: true,
      exactMatch: true,
      suggestions: [{ name: normInput, distance: 0, exact: true }],
    };
  }

  // Cascading Multi-Signal Smart Search
  const results = smartSearch(normInput, comuna, 5);

  if (results.length === 0) {
    return { found: false, exactMatch: false, suggestions: [] };
  }

  const best = results[0];
  const exactMatch = best.score === 100;
  // Consider found if best match score meets quality threshold (40)
  const similarity = streetSimilarity(input, best.name);
  const ambiguous = results.some(r => r.name !== best.name && streetSimilarity(input, r.name) >= similarity - 0.02);
  const found = similarity >= Math.max(0.87, 1 - maxDistance / Math.max(1, input.length)) && !ambiguous;

  const suggestions: CallejeroMatch[] = results.map(r => ({
    name: r.name,
    distance: Math.round((100 - r.score) / 10), // Map score back to Levenshtein-like distance for legacy compatibility
    exact: r.score === 100,
  }));

  return {
    found,
    exactMatch,
    correctedName: found && !exactMatch ? best.name : undefined,
    suggestions,
  };
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

  const byRest = viaReverseIndex.get(normComuna);
  const match = byRest?.get(inputRest);
  if (match && match !== normInput) {
    return match;
  }

  return street;
}

const comunaLoads = new Map<string, Promise<boolean>>();
function waitForLoad(promise: Promise<boolean>, signal?: AbortSignal): Promise<boolean> {
  if (!signal) return promise;
  signal.throwIfAborted();
  return new Promise<boolean>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener("abort", onAbort));
  });
}
export async function loadComunaSegments(comuna: string, signal?: AbortSignal): Promise<boolean> {
  const key = textKey(comuna);
  if (segmentsByComuna.has(key)) return true;
  if (comunaLoads.has(key)) return waitForLoad(comunaLoads.get(key)!, signal);
  const promise = (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}callejero/${encodeURIComponent(key)}.json`, { signal: AbortSignal.timeout(12000) });
      if (res.status === 404) return false;
      if (!res.ok) throw new Error(`Callejero HTTP ${res.status}`);
      const data: CallejeroSegment[] = await res.json();
      segmentsByComuna.set(key, data);
      return true;
    } catch {
      comunaLoads.delete(key);
      return false;
    }
  })();
  comunaLoads.set(key, promise);
  return waitForLoad(promise, signal);
}

export function getStreetBounds(street: string, comuna: string): [number, number, number, number] | undefined {
  const points = (segmentsByComuna.get(textKey(comuna)) || [])
    .filter(s => streetSimilarity(street, s.v) >= 0.9 || s.a?.some(a => streetSimilarity(street, a) >= 0.9))
    .flatMap(s => s.g);
  if (!points.length) return undefined;
  return [Math.min(...points.map(p => p[0])) - 0.002, Math.min(...points.map(p => p[1])) - 0.002,
    Math.max(...points.map(p => p[0])) + 0.002, Math.max(...points.map(p => p[1])) + 0.002];
}

/**
 * Multi-signal scored street name search.
 * Cascading 5-phase approach for flexible matching like Google Maps.
 *
 * Phase 1: Exact full match                     → score 100
 * Phase 2: Via-agnostic exact match              → score 90-95
 * Phase 3: Token overlap + prefix matching       → score 50-85
 * Phase 4: Token-level Levenshtein               → score 40-70
 * Phase 5: Full-string Levenshtein (fallback)    → score 25-65
 */
export function smartSearch(
  input: string,
  comuna: string,
  maxResults = 5,
): SmartSearchResult[] {
  const normInput = normalizeCalle(input);
  const normComuna = normalizeCalle(comuna);
  const uniqueNames = segmentNamesByComuna.get(normComuna);
  if (!uniqueNames || normInput.length === 0) return [];

  // ── Phase 1: Exact full match ──────────────────────
  if (uniqueNames.has(normInput)) {
    return [{ name: normInput, score: 100, matchType: "exact" }];
  }

  const inputTokens = normInput.split(/\s+/).filter(t => t.length > 0);
  const { via: inputVia, core: coreTokens } = stripVia(inputTokens);
  const coreStr = coreTokens.join(" ");

  const scores = new Map<string, { score: number; matchType: SmartSearchResult["matchType"] }>();

  function updateScore(name: string, score: number, matchType: SmartSearchResult["matchType"]): void {
    const existing = scores.get(name);
    if (!existing || score > existing.score) {
      scores.set(name, { score, matchType });
    }
  }

  const tokenIdx = segTokenIndex.get(normComuna);
  const viaIdx = segViaStrippedIndex.get(normComuna);

  // ── Phase 2: Via-agnostic exact match ──────────────
  if (viaIdx && coreStr.length > 0) {
    const viaMatches = viaIdx.get(coreStr);
    if (viaMatches) {
      for (const match of viaMatches) {
        // Boost if user's via also matches
        const viaBonus = inputVia && match.startsWith(inputVia + " ") ? 5 : 0;
        updateScore(match, 90 + viaBonus, "via-corrected");
      }
    }

    // Also check partial core: "libertador ohiggins" matches "libertador bernardo ohiggins"
    if (coreTokens.length >= 2) {
      for (const [indexedCore, fullNames] of viaIdx) {
        const indexedTokens = indexedCore.split(/\s+/);
        // All core tokens must appear (in order) within the indexed core
        if (tokensContainedInOrder(coreTokens, indexedTokens)) {
          const coverage = coreTokens.length / indexedTokens.length;
          const score = Math.round(78 + coverage * 12); // 78-90
          for (const fn of fullNames) {
            updateScore(fn, score, "via-corrected");
          }
        }
      }
    }
  }

  // ── Phase 3: Token overlap + prefix matching ───────
  if (tokenIdx && coreTokens.length > 0) {
    const candidateHits = new Map<string, number>();

    for (const queryToken of coreTokens) {
      if (queryToken.length < 2) continue;

      // 3a: Exact token match
      const exactHits = tokenIdx.get(queryToken);
      if (exactHits) {
        for (const name of exactHits) {
          candidateHits.set(name, (candidateHits.get(name) || 0) + 1.0);
        }
      }

      // 3b: Prefix match (min 3 chars, "provid" → "providencia")
      if (queryToken.length >= 3) {
        for (const [idxToken, streets] of tokenIdx) {
          if (idxToken === queryToken) continue;
          if (idxToken.startsWith(queryToken)) {
            const ratio = queryToken.length / idxToken.length;
            if (ratio >= 0.4) {
              for (const name of streets) {
                candidateHits.set(name, (candidateHits.get(name) || 0) + ratio * 0.8);
              }
            }
          }
        }
      }

      // 3c: Token-level Levenshtein (≤1 for short tokens, ≤2 for long)
      if (queryToken.length >= 4) {
        const maxTokenDist = queryToken.length <= 6 ? 1 : 2;
        for (const [idxToken, streets] of tokenIdx) {
          if (Math.abs(idxToken.length - queryToken.length) > maxTokenDist) continue;
          const dist = levenshtein(queryToken, idxToken);
          if (dist > 0 && dist <= maxTokenDist) {
            const fuzzyWeight = 1 - dist / queryToken.length;
            for (const name of streets) {
              candidateHits.set(name, (candidateHits.get(name) || 0) + fuzzyWeight * 0.6);
            }
          }
        }
      }
    }

    // Convert hit counts to scores
    for (const [name, rawHits] of candidateHits) {
      if (scores.has(name) && scores.get(name)!.score >= 90) continue;

      const nameTokens = name.split(/\s+/).filter(t => !VIA_TYPES.has(t) && t.length > 1);
      const denominator = Math.max(coreTokens.length, nameTokens.length);
      const coverage = Math.min(1, rawHits / denominator);
      // Penalize if query is much shorter than candidate (prevents "san" matching everything)
      const lengthPenalty = Math.min(1, (coreTokens.length + 0.5) / Math.max(1, nameTokens.length));
      const score = Math.round(Math.min(85, coverage * lengthPenalty * 88));

      if (score >= 35) {
        const matchType: SmartSearchResult["matchType"] = coverage >= 0.9 ? "token" : "prefix";
        updateScore(name, score, matchType);
      }
    }
  }

  // ── Phase 4: Full-string Levenshtein (fallback) ────
  if (scores.size < maxResults) {
    for (const name of uniqueNames) {
      if (scores.has(name)) continue;
      const dist = levenshtein(normInput, name);
      const maxDist = getMaxFuzzyDistance(name.length);
      if (dist <= maxDist && dist > 0) {
        const score = Math.round(Math.max(25, 68 - dist * 12));
        updateScore(name, score, "fuzzy");
      }
    }
  }

  return [...scores.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, maxResults)
    .map(([name, data]) => ({
      name,
      score: data.score,
      matchType: data.matchType,
    }));
}

/**
 * Search for a street segment by name and number.
 * Uses smart multi-signal search for flexible matching.
 *
 * IMPORTANT: Segment geometry is stored as [lon, lat].
 * This function returns lat/lon correctly separated.
 */
export function searchSegment(street: string, numero: number, comuna: string): SegmentSearchResult {
  return searchSegments(street, numero, comuna)[0] || { found: false };
}

export function matchSegments(segs: CallejeroSegment[], street: string, numero: number, knownNames: Iterable<string> = []): SegmentSearchResult[] {
  const matches: SegmentSearchResult[] = [];
  const identity = streetKey(street);
  const hasExact = [...knownNames].some(name => streetKey(name) === identity) || segs.some(s => [s.v, ...(s.a || [])].some(name => streetKey(name) === identity));
  for (const seg of segs) {
    if (hasExact && ![seg.v, ...(seg.a || [])].some(name => streetKey(name) === identity)) continue;
    const similarity = Math.max(streetSimilarity(street, seg.v), ...(seg.a || []).map(a => streetSimilarity(street, a)));
    if (similarity < 0.87) continue;
    // Legacy min/max data cannot recover side or direction: never interpolate it.
    for (const [side, range] of [["left", seg.l], ["right", seg.r]] as const) {
      if (!range || !matchesParity(numero, range[0], range[1])) continue;
      const point = interpolateLine(seg.g, range[0], range[1], numero);
      if (!point) continue;
      matches.push({ found: true, lon: point[0], lat: point[1], seg, range, side,
        correctedName: similarity < 1 ? seg.v : undefined, matchScore: Math.round(similarity * 100) });
    }
  }
  return matches.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

export function searchSegments(street: string, numero: number, comuna: string): SegmentSearchResult[] {
  return matchSegments(segmentsByComuna.get(textKey(comuna)) || [], street, numero, namesByComuna.get(textKey(comuna)) || []);
}

export function isSegmentsLoaded(): boolean {
  return segmentsByComuna.size > 0;
}

export function getSegmentsCount(): number {
  return segmentsByComuna.size;
}
