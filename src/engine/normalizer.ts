import { VIA_ABBREVIATIONS } from "./normalizer.rules";

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

function removeAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function expandVia(text: string): { via?: string; rest: string } {
  const trimmed = text.trim();
  if (!trimmed) return { rest: text };

  const lower = trimmed.toLowerCase();
  const tokens = lower.split(/\s+/);
  const firstToken = tokens[0].replace(/\.$/, ""); // strip trailing period

  const expanded = VIA_ABBREVIATIONS[firstToken];
  if (expanded && tokens.length > 1) {
    return { via: expanded, rest: tokens.slice(1).join(" ") };
  }

  return { rest: text };
}

const NON_CAPITAL_WORDS = new Set([
  "de", "del", "la", "el", "los", "las", "y", "con", "en", "a", "por",
]);

function capitalize(text: string): string {
  return text
    .split(/\s+/)
    .map((word, i) => {
      if (!word) return word;
      const lower = word.toLowerCase();
      if (i > 0 && NON_CAPITAL_WORDS.has(lower)) return lower;
      // Preserve tokens with non-alphabetic chars (S/N, N°123, #5678)
      if (/[^a-zA-ZáéíóúñüÁÉÍÓÚÑÜ]/.test(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function cleanPunctuation(text: string): string {
  return text.replace(/[,.]+$/, "").replace(/\s+/g, " ").trim();
}

export function normalize(raw: string): NormalizedAddress {
  const original = raw.trim();

  if (!original) {
    return {
      original,
      normalized: "",
      warnings: ["DIRECCION_VACIA"],
      suggestions: [],
      isRural: false,
      isIntersection: false,
    };
  }

  // Step 1: Normalize whitespace & basic cleanup
  let text = original.replace(/\s+/g, " ").trim();

  // Step 2: Expand via abbreviation (first token)
  const { via, rest } = expandVia(text);

  // Step 3: Remove accents
  const viaClean = via ? removeAccents(via) : undefined;
  const restClean = removeAccents(rest);

  // Step 4: Clean punctuation
  const restCleaned = cleanPunctuation(restClean);

  // Step 5: Capitalize
  const viaCapitalized = viaClean ? capitalize(viaClean) : undefined;
  const restCapitalized = capitalize(restCleaned);

  // Rebuild
  let normalized: string;
  if (viaCapitalized && restCapitalized) {
    normalized = `${viaCapitalized} ${restCapitalized}`;
  } else if (viaCapitalized) {
    normalized = viaCapitalized;
  } else {
    normalized = restCapitalized;
  }

  return {
    original,
    normalized,
    via: viaCapitalized,
    nombre: restCapitalized || undefined,
    warnings: [],
    suggestions: [],
    isRural: false,
    isIntersection: false,
  };
}

export function normalizeBatch(addresses: string[]): NormalizedAddress[] {
  return addresses.map(normalize);
}
