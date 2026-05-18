import type { GeocodeResult, PrecisionLevel } from "@/types";

const MATCH_TYPE_SCORES: Record<string, number> = {
  building: 100,
  house: 95,
  house_number: 95,
  residential: 90,
  amenity: 85,
  shop: 80,
  office: 80,
  street: 70,
  path: 65,
  footway: 60,
  pedestrian: 55,
  road: 50,
  neighbourhood: 45,
  quarter: 42,
  suburb: 40,
  village: 38,
  hamlet: 35,
  city: 25,
  town: 28,
  municipality: 30,
  county: 20,
  state: 10,
  region: 10,
  country: 5,
  administrative: 5,
};

export function getMatchTypeScore(osmType: string): number {
  const t = osmType?.toLowerCase().trim() || "";
  return MATCH_TYPE_SCORES[t] ?? 20;
}

function getPrecisionLevel(score: number): PrecisionLevel {
  if (score >= 85) return "excelente";
  if (score >= 60) return "bueno";
  if (score >= 35) return "regular";
  if (score > 0) return "bajo";
  return "nulo";
}

export function calculateScore(result: {
  osmType?: string;
  importance?: number;
  displayName?: string;
  normalizedAddress?: string;
  resultCount?: number;
}): { score: number; precision: PrecisionLevel; completeness: number; uniqueness: number } {
  const matchType = getMatchTypeScore(result.osmType || "");
  const importance = (result.importance ?? 0) * 100;

  let completeness = 0;
  if (result.normalizedAddress && result.displayName) {
    const norm = result.normalizedAddress.toLowerCase();
    const display = result.displayName.toLowerCase();
    const normTokens = new Set(norm.split(/[,\s]+/).filter(Boolean));
    const displayTokens = new Set(display.split(/[,\s]+/).filter(Boolean));
    let matches = 0;
    for (const t of normTokens) {
      for (const d of displayTokens) {
        if (d.includes(t) || t.includes(d)) {
          matches++;
          break;
        }
      }
    }
    completeness = normTokens.size > 0 ? Math.min(100, (matches / normTokens.size) * 100) : 50;
  }

  const count = result.resultCount ?? 1;
  let uniqueness: number;
  if (count === 1) uniqueness = 100;
  else if (count === 2) uniqueness = 80;
  else if (count === 3) uniqueness = 60;
  else if (count <= 5) uniqueness = 40;
  else uniqueness = 20;

  const score = Math.round(
    matchType * 0.4 + importance * 0.3 + completeness * 0.2 + uniqueness * 0.1,
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    precision: getPrecisionLevel(score),
    completeness,
    uniqueness,
  };
}

export function buildGeocodeResult(
  data: {
    lat: number;
    lon: number;
    displayName: string;
    osmType?: string;
    osmId?: number;
    importance?: number;
    resultCount?: number;
  },
  normalized: string,
  api: string,
): GeocodeResult {
  const scoring = calculateScore({
    osmType: data.osmType,
    importance: data.importance,
    displayName: data.displayName,
    normalizedAddress: normalized,
    resultCount: data.resultCount,
  });

  return {
    lat: data.lat,
    lon: data.lon,
    score: scoring.score,
    precision: scoring.precision,
    matchType: data.osmType || "",
    importance: data.importance ?? 0,
    api,
    displayName: data.displayName,
    found: true,
    osmType: data.osmType,
    osmId: data.osmId,
    completeness: scoring.completeness,
    uniqueness: scoring.uniqueness,
    timestamp: Date.now(),
  };
}
