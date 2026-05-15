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
}

export type PrecisionLevel = "excelente" | "bueno" | "regular" | "bajo" | "nulo";

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
}

export type WizardStep = "upload" | "preview" | "processing" | "results";
