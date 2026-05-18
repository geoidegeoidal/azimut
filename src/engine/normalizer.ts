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

  // Try multi-word matches first (up to 3 tokens), then single-word
  const maxPrefixLen = Math.min(tokens.length - 1, 3);
  for (let len = maxPrefixLen; len >= 1; len--) {
    const prefix = tokens.slice(0, len).join(" ").replace(/\.$/, "");
    const expanded = VIA_ABBREVIATIONS[prefix];
    if (expanded && tokens.length > len) {
      return { via: expanded, rest: tokens.slice(len).join(" ") };
    }
  }

  // Single-token without trailing dot
  const firstToken = tokens[0].replace(/\.$/, "");
  const expanded = VIA_ABBREVIATIONS[firstToken];
  if (expanded && tokens.length > 1) {
    return { via: expanded, rest: tokens.slice(1).join(" ") };
  }

  return { rest: text };
}

function extractNumber(text: string): { nombre: string; numero?: string; unidad?: string } {
  const trimmed = text.trim();
  if (!trimmed) return { nombre: trimmed };

  if (/^(km|kilometro|kilómetro)\b/i.test(trimmed)) {
    return { nombre: trimmed };
  }

  const numPrefixPattern = /\s+(N°|Nº|No|NO|Nro\.?|#|num\.?|Numero)\s*(\d+)(\s+(.+))?$/i;
  const numMatch = trimmed.match(numPrefixPattern);
  if (numMatch) {
    const nombre = trimmed.slice(0, numMatch.index!).trim();
    const numero = numMatch[2];
    const unidad = numMatch[4]?.trim() || undefined;
    return { nombre, numero, unidad };
  }

  const tokens = trimmed.split(/\s+/);

  if (tokens.length <= 1) return { nombre: trimmed };

  const viaKeywords = new Set(["avenida", "av", "calle", "pasaje", "pje", "camino", "ruta", "carretera"]);
  const firstLower = tokens[0].toLowerCase().replace(/\.$/, "");
  const secondIsSmallNum = tokens.length >= 2 && /^\d+$/.test(tokens[1]) && parseInt(tokens[1], 10) < 100;

  if (secondIsSmallNum) {
    if (tokens.length === 2 && viaKeywords.has(firstLower)) {
      return { nombre: trimmed };
    }
  }

  const unitKeywords = new Set(["dpto", "depto", "departamento", "of", "oficina", "piso", "torre", "casa", "local", "lote", "sitio", "parcela"]);

  for (let i = tokens.length - 1; i >= 0; i--) {
    if (unitKeywords.has(tokens[i].toLowerCase())) {
      if (i > 0 && /^\d+$/.test(tokens[i - 1])) {
        const unitRest = tokens.slice(i).join(" ");
        const beforeUnit = tokens.slice(0, i);
        for (let j = beforeUnit.length - 1; j >= 0; j--) {
          if (/^\d+$/.test(beforeUnit[j])) {
            const num = parseInt(beforeUnit[j], 10);
            if (j === 1 && viaKeywords.has(beforeUnit[0].toLowerCase().replace(/\.$/, "")) && num < 100) {
              continue;
            }
            const numero = beforeUnit[j];
            const nombre = beforeUnit.slice(0, j).join(" ");
            return { nombre, numero, unidad: unitRest };
          }
        }
        return { nombre: trimmed };
      }
    }
  }

  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (!/^\d+$/.test(t)) continue;

    const num = parseInt(t, 10);

    if (i === 0) {
      return { nombre: trimmed };
    }

    if (i === 1 && num < 1000 && tokens[0].length <= 3 && /^[a-zA-Z]+$/i.test(tokens[0])) {
      return { nombre: trimmed };
    }

    if (i === 1 && viaKeywords.has(tokens[0].toLowerCase().replace(/\.$/, "")) && num < 100) {
      return { nombre: trimmed };
    }

    if (i < tokens.length - 2 && tokens[i + 1] === "de" && num < 100) {
      continue;
    }

    if (num >= 100 || i === tokens.length - 1) {
      const numero = t;
      const nombre = tokens.slice(0, i).join(" ");
      if (nombre.trim()) {
        return { nombre: nombre.trim(), numero };
      }
    }

    if (num >= 100) {
      const numero = t;
      const nombre = tokens.slice(0, i).join(" ");
      return { nombre: nombre.trim(), numero };
    }
  }

  return { nombre: trimmed };
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
      comuna: comuna || undefined,
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

  // Step 3: Extract street number from the rest
  const { nombre: nombreRaw, numero, unidad } = extractNumber(rest);

  // Step 4: Remove accents
  const viaClean = via ? removeAccents(via) : undefined;
  const nombreClean = removeAccents(nombreRaw);

  // Step 5: Clean punctuation
  const nombreCleaned = cleanPunctuation(nombreClean);

  // Step 6: Capitalize
  const viaCapitalized = viaClean ? capitalize(viaClean) : undefined;
  const nombreCapitalized = capitalize(nombreCleaned);

  // Build the street name without number (for callejero lookup)
  let streetWithoutNumber: string;
  if (viaCapitalized && nombreCapitalized) {
    streetWithoutNumber = `${viaCapitalized} ${nombreCapitalized}`;
  } else if (viaCapitalized) {
    streetWithoutNumber = viaCapitalized;
  } else {
    streetWithoutNumber = nombreCapitalized;
  }

  // Step 7: Callejero cross-reference (if comuna is known)
  let callejeroMatch: boolean | undefined;
  let callejeroCorrected: string | undefined;
  const suggestions: string[] = [];
  const warnings: string[] = [];

  if (comuna && streetWithoutNumber.length > 3) {
    // First try correcting the via type
    const viaCorrected = correctViaType(streetWithoutNumber, comuna);
    if (viaCorrected !== streetWithoutNumber) {
      suggestions.push(viaCorrected);
    }

    // Then do fuzzy lookup using street name WITHOUT number
    const lookupInput = viaCorrected !== streetWithoutNumber ? viaCorrected : streetWithoutNumber;
    const lookupResult = lookupStreet(lookupInput, comuna);

    if (lookupResult.found) {
      callejeroMatch = true;
      if (lookupResult.correctedName && lookupResult.correctedName !== lookupInput) {
        // Store corrected name capitalized for display and query
        callejeroCorrected = capitalize(lookupResult.correctedName);
        suggestions.push(callejeroCorrected);
      }
    } else if (lookupResult.suggestions.length > 0) {
      callejeroMatch = false;
      for (const s of lookupResult.suggestions) {
        if (s.name !== lookupInput) suggestions.push(capitalize(s.name));
      }
      warnings.push("CALLE_NO_ENCONTRADA_EN_COMUNA");
    } else {
      callejeroMatch = false;
      warnings.push("CALLE_NO_ENCONTRADA_EN_COMUNA");
    }
  }

  // Step 8: Rebuild final normalized address
  // Use callejero-corrected name if available, otherwise keep original
  const finalName = callejeroCorrected || streetWithoutNumber;
  let normalized = finalName;
  if (numero) normalized += ` ${numero}`;
  if (unidad) normalized += ` ${capitalize(unidad)}`;

  return {
    original,
    normalized,
    via: viaCapitalized,
    nombre: nombreCapitalized || undefined,
    numero,
    unidad: unidad ? capitalize(unidad) : undefined,
    comuna: comuna || undefined,
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
