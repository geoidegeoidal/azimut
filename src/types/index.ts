export interface NormalizedAddress {
  original: string;
  normalized: string;
  via?: string;
  nombre?: string;
  numero?: string;
  unidad?: string;
  comuna?: string;
  region?: string;
  warnings: string[];
  suggestions: string[];
  buildingName?: string;
  reference?: string;
  isRural: boolean;
  isIntersection: boolean;
  callejeroMatch?: boolean;
  callejeroCorrected?: string;
  inputStreet?: string;
}

export type PrecisionLevel = "excelente" | "bueno" | "regular" | "bajo" | "nulo";

export type LocationMethod = "address" | "interpolated" | "provider" | "street" | "area" | "manual";

export interface GeocodeCandidate {
  id: string;
  lat: number;
  lon: number;
  score: number;
  source: string;
  method: LocationMethod;
  label: string;
  evidence: string[];
  warnings: string[];
  geometry?: [number, number][];
  range?: [number, number];
  side?: "left" | "right";
  osmId?: number;
  osmType?: string;
}

export interface SourceStatus {
  source: string;
  status: "ok" | "empty" | "unavailable" | "disabled";
  detail: string;
}

export interface GeocodeResult {
  lat: number;
  lon: number;
  score: number;
  precision: PrecisionLevel;
  matchType: string;
  importance: number;
  api: string;
  displayName: string;
  found: boolean;
  osmType?: string;
  osmId?: number;
  completeness: number;
  uniqueness: number;
  timestamp: number;
  method?: LocationMethod;
  evidence?: string[];
  warnings?: string[];
  candidates?: GeocodeCandidate[];
  sources?: SourceStatus[];
  geometry?: [number, number][];
  range?: [number, number];
  side?: "left" | "right";
  needsReview?: boolean;
}

export type WizardStep = "upload" | "preview" | "processing" | "results";
