export type PrecisionLevel = "excelente" | "bueno" | "regular" | "bajo" | "nulo";

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
}

export interface GeocodeResult {
  lat: number;
  lon: number;
  score: number;
  precision: PrecisionLevel;
  matchType: string;
  importance: number;
  api: string;
  display_name: string;
}

export interface AddressRow {
  id: number;
  original: Record<string, string>;
  normalized: NormalizedAddress;
  geocode?: GeocodeResult;
  selected: boolean;
}

export type WizardStep = "upload" | "preview" | "processing" | "results";
