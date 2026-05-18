import { VIA_ABBREVIATIONS } from "./normalizer.rules";
import { lookupStreet, correctViaType } from "./callejero";
import type { NormalizedAddress } from "@/types";

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

export function normalize(raw: string, comuna?: string): NormalizedAddress {
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
  const text = original.replace(/\s+/g, " ").trim();

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

  // Step 6: Callejero cross-reference (if comuna is known)
  let callejeroMatch: boolean | undefined;
  let callejeroCorrected: string | undefined;
  const suggestions: string[] = [];
  const warnings: string[] = [];

  if (comuna) {
    // First try correcting the via type (e.g., "Pasaje Ossa" → "Calle Ossa")
    const viaCorrected = correctViaType(normalized, comuna);
    if (viaCorrected !== normalized) {
      suggestions.push(viaCorrected);
    }

    // Then do fuzzy lookup
    const lookupResult = lookupStreet(normalized, comuna);
    if (lookupResult.found) {
      callejeroMatch = true;
      if (lookupResult.correctedName) {
        callejeroCorrected = lookupResult.correctedName;
        suggestions.push(lookupResult.correctedName);
      }
    } else if (lookupResult.suggestions.length > 0) {
      callejeroMatch = false;
      for (const s of lookupResult.suggestions) {
        if (s.name !== normalized) suggestions.push(s.name);
      }
      warnings.push("CALLE_NO_ENCONTRADA_EN_COMUNA");
    } else if (normalized.length > 3) {
      callejeroMatch = false;
      warnings.push("CALLE_NO_ENCONTRADA_EN_COMUNA");
    }
  }

  return {
    original,
    normalized,
    via: viaCapitalized,
    nombre: restCapitalized || undefined,
    warnings,
    suggestions: suggestions.slice(0, 5),
    isRural: false,
    isIntersection: false,
    callejeroMatch,
    callejeroCorrected,
  };
}

export function normalizeBatch(addresses: string[], comunas?: (string | undefined)[]): NormalizedAddress[] {
  return addresses.map((a, i) => normalize(a, comunas?.[i]));
}
