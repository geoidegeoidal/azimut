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
  const firstToken = tokens[0].replace(/\.$/, "");

  const expanded = VIA_ABBREVIATIONS[firstToken];
  if (expanded && tokens.length > 1) {
    return { via: expanded, rest: tokens.slice(1).join(" ") };
  }

  return { rest: text };
}

function extractNumber(text: string): { nombre: string; numero?: string; unidad?: string } {
  // Address patterns in Chile:
  // "Providencia 1234" → nombre=Providencia, numero=1234
  // "Providencia 1234 Depto 501" → nombre=Providencia, numero=1234, unidad=Depto 501
  // "Providencia N° 1234" → nombre=Providencia, numero=1234
  // "Km 25 Camino a Melipilla" → keep as-is (rural, no extraction)
  // "2 Poniente" → keep as-is (named streets starting with numbers)
  // "Ruta 5 Sur Km 85" → keep as-is

  const trimmed = text.trim();
  if (!trimmed) return { nombre: trimmed };

  // Don't extract from rural/km addresses
  if (/^(km|kilometro|kilómetro)\b/i.test(trimmed)) {
    return { nombre: trimmed };
  }

  // Try pattern: "... N° 1234 ..." or "... #1234 ..." or "... Nro 1234 ..."
  const numPrefixPattern = /\s+(N°|Nº|No|NO|Nro\.?|#|num\.?|Numero)\s*(\d+)(\s+(.+))?$/i;
  const numMatch = trimmed.match(numPrefixPattern);
  if (numMatch) {
    const nombre = trimmed.slice(0, numMatch.index!).trim();
    const numero = numMatch[2];
    const unidad = numMatch[4]?.trim() || undefined;
    return { nombre, numero, unidad };
  }

  const tokens = trimmed.split(/\s+/);

  // If only one token, don't extract
  if (tokens.length <= 1) return { nombre: trimmed };

  // Check if first token is a known via + the second is a small number (street name, not address number)
  const viaKeywords = new Set(["avenida", "av", "calle", "pasaje", "pje", "camino", "ruta", "carretera"]);
  const firstLower = tokens[0].toLowerCase().replace(/\.$/, "");
  const secondIsSmallNum = tokens.length >= 2 && /^\d+$/.test(tokens[1]) && parseInt(tokens[1], 10) < 100;

  if (secondIsSmallNum) {
    // "Calle 5" or "Pasaje 3" or "Avenida 11 de Septiembre" — keep as name
    if (tokens.length === 2 && viaKeywords.has(firstLower)) {
      return { nombre: trimmed };
    }
    // "Calle 21 de Mayo" → keep, but "Calle Los Leones 1234" → extract 1234
    // Only protect small numbers at position 1 if there are few tokens
  }

  // Find the last unit keyword and extract the number before it
  const unitKeywords = new Set(["dpto", "depto", "departamento", "of", "oficina", "piso", "torre", "casa", "local", "lote", "sitio", "parcela"]);

  for (let i = tokens.length - 1; i >= 0; i--) {
    if (unitKeywords.has(tokens[i].toLowerCase())) {
      if (i > 0 && /^\d+$/.test(tokens[i - 1])) {
        // Number found before unit keyword: "Providencia 1234 Depto 501"
        // But wait, the unit number itself is the last number ("501")
        // The street number is the number before "Depto"
        // Actually: "Providencia 1234 Depto 501" → street number = 1234, unit = Depto 501
        const unitRest = tokens.slice(i).join(" ");
        const beforeUnit = tokens.slice(0, i);
        // Find the last standalone number before the unit keyword
        for (let j = beforeUnit.length - 1; j >= 0; j--) {
          if (/^\d+$/.test(beforeUnit[j])) {
            const num = parseInt(beforeUnit[j], 10);
            // If it's a small number (< 100) at position 1 with via at 0, it's a street name
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

  // Find the last standalone number that looks like a street number (>= 100, or at end position)
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i];
    if (!/^\d+$/.test(t)) continue;

    const num = parseInt(t, 10);

    // If it's the first or second token, be conservative
    if (i === 0) {
      return { nombre: trimmed }; // "2 Poniente" → keep as-is
    }

    // "Km 25" type patterns (first token is non-numeric prefix)
    if (i === 1 && num < 1000 && tokens[0].length <= 3 && /^[a-zA-Z]+$/i.test(tokens[0])) {
      // Short prefix like "Km", "Ruta", etc. — keep as-is
      return { nombre: trimmed };
    }

    // "Calle 5" or "Pasaje 3" → keep as name
    if (i === 1 && viaKeywords.has(tokens[0].toLowerCase().replace(/\.$/, "")) && num < 100) {
      return { nombre: trimmed };
    }

    // "Avenida 11 de Septiembre" type (number followed by "de")
    if (i < tokens.length - 2 && tokens[i + 1] === "de" && num < 100) {
      continue;
    }

    // If the number is at the end and ≥ 100, it's likely a street number
    // Or if it's at end position and the only number
    if (num >= 100 || i === tokens.length - 1) {
      const numero = t;
      const nombre = tokens.slice(0, i).join(" ");
      // Verify nombre isn't empty
      if (nombre.trim()) {
        return { nombre: nombre.trim(), numero };
      }
    }

    // Number found but not at end position — could be "21 de Mayo 456"
    // Only extract if it's clearly a street number
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
        callejeroCorrected = lookupResult.correctedName;
        suggestions.push(lookupResult.correctedName);
      }
    } else if (lookupResult.suggestions.length > 0) {
      callejeroMatch = false;
      for (const s of lookupResult.suggestions) {
        if (s.name !== lookupInput) suggestions.push(s.name);
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
