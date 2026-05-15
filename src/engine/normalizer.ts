import {
  VIA_ABBREVIATIONS,
  UNIT_ABBREVIATIONS,
  NUMBER_PREFIXES,
  SINALNUMERO,
  COMUNA_ABBREVIATIONS,
  PHONE_REGEX,
  RUT_REGEX,
  EMAIL_REGEX,
  BUILDING_PREFIXES,
  INTERSECTION_KEYWORDS,
  KM_KEYWORDS,
} from "./normalizer.rules";
import {
  COMUNAS,
  normalizeComunaName,
  fuzzyMatchComuna,
} from "@/data/comunas";
import { REGIONS_MAP, normalizeRegionName } from "@/data/regiones";

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

function sanitize(raw: string): { text: string; warnings: string[] } {
  let text = raw.trim();
  const warnings: string[] = [];

  if (PHONE_REGEX.test(text)) {
    warnings.push("POSIBLE_TELEFONO_IGNORADO");
    text = text.replace(PHONE_REGEX, "").trim();
  }
  if (RUT_REGEX.test(text)) {
    warnings.push("POSIBLE_RUT_IGNORADO");
    text = text.replace(RUT_REGEX, "").trim();
  }
  if (EMAIL_REGEX.test(text)) {
    warnings.push("POSIBLE_EMAIL_IGNORADO");
    text = text.replace(EMAIL_REGEX, "").trim();
  }

  // Preserve apostrophes for O'Higgins
  text = text.replace(/[^\w\sáéíóúñÁÉÍÓÚÑüÜ.,#\/\\\-']/g, " ");
  
  // Pre-clean redundant administrative terms that confuse street name parsing
  text = text.replace(/,\s*(?:chile|santiago|rm|región metropolitana|region metropolitana)\b/gi, ",");

  text = text.replace(/\s+/g, " ").trim();
  text = text.replace(/[,]+/g, ",").replace(/,\s*,/g, ",").trim();
  if (text.endsWith(",")) text = text.slice(0, -1).trim();
  if (text.endsWith(".")) text = text.slice(0, -1).trim();

  return { text, warnings };
}

function tokenize(text: string): {
  tokens: string[];
  isRural: boolean;
  isIntersection: boolean;
  buildingName?: string;
  kmInfo?: { before: string; km: string };
} {
  const isRural = KM_KEYWORDS.some((kw) =>
    text.toLowerCase().includes(kw.toLowerCase()),
  );
  const isIntersection = INTERSECTION_KEYWORDS.some((kw) =>
    text.toLowerCase().includes(kw.toLowerCase()),
  );

  let buildingName: string | undefined;
  for (const prefix of BUILDING_PREFIXES) {
    const regex = new RegExp(`\\b${prefix}[.\\s]+([^,]+)`, "i");
    const match = text.match(regex);
    if (match) {
      buildingName = match[1].trim();
      break;
    }
  }

  let kmInfo: { before: string; km: string } | undefined;
  if (isRural) {
    const kmRegex = /(.+?)\s+km\s+(\d+)/i;
    const match = text.match(kmRegex);
    if (match) {
      kmInfo = { before: match[1].trim(), km: match[2] };
    }
  }

  // Split letter-digit boundaries for "todo pegado" cases
  let expanded = text;
  expanded = expanded.replace(/([a-zA-Záéíóúñü])(\d)/g, "$1 $2");
  expanded = expanded.replace(/(\d)([a-zA-Záéíóúñü])/g, "$1 $2");

  const tokens = expanded
    .replace(/[,]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 0);

  return { tokens, isRural, isIntersection, buildingName, kmInfo };
}

function classifyAndExpand(
  tokens: string[],
  _isRural: boolean,
  _isIntersection: boolean,
  kmInfo?: { before: string; km: string },
): {
  via?: string;
  nombre?: string;
  numero?: string;
  unidad?: string;
  comuna?: string;
  region?: string;
  reference?: string;
  warnings: string[];
  suggestions: string[];
} {
  const warnings: string[] = [];
  const suggestions: string[] = [];
  let via: string | undefined;
  let nombre: string | undefined;
  let numero: string | undefined;
  let unidad: string | undefined;
  let comuna: string | undefined;
  let region: string | undefined;
  let reference: string | undefined;

  let i = 0;
  const rawParts: string[] = [];

  // First pass: extract via, number, unit, and collect unmatched tokens
  while (i < tokens.length) {
    const token = tokens[i];
    const lowerToken = token.toLowerCase();

    // VIA detection (must be at the start)
    if (rawParts.length === 0 && VIA_ABBREVIATIONS[lowerToken]) {
      via = VIA_ABBREVIATIONS[lowerToken];
      i++;
      continue;
    }

    // Handle number prefixes (N°, #, etc.)
    if (token.startsWith("#")) {
      const clean = token.slice(1);
      if (/^\d+/.test(clean)) {
        numero = clean;
        i++;
        continue;
      }
    }

    const isNumberPrefix = NUMBER_PREFIXES.some((p) =>
      token.toLowerCase().startsWith(p.toLowerCase()),
    );
    if (isNumberPrefix) {
      const matchedPrefix = NUMBER_PREFIXES.find((p) => token.toLowerCase().startsWith(p.toLowerCase()))!;
      if (token.length > matchedPrefix.length) {
        numero = token.slice(matchedPrefix.length).trim();
      } else if (i + 1 < tokens.length && /^\d/.test(tokens[i + 1])) {
        i++;
        numero = tokens[i];
      }
      i++;
      continue;
    }

    // Sin Número
    if (SINALNUMERO.some((s) => s.toLowerCase() === lowerToken)) {
      numero = "Sin Número";
      warnings.push("SIN_NUMERO");
      i++;
      continue;
    }

    // Pure number (potential house number or continuation)
    // Skip if looks like part of a street name (followed by "de")
    if (/^\d+[A-Za-z]?$/.test(token)) {
      const nextToken = i + 1 < tokens.length ? tokens[i + 1]?.toLowerCase() : "";
      const isOrdinalStreet = nextToken === "de" || nextToken === "del" || nextToken === "de la";
      if (!isOrdinalStreet) {
        if (!numero && rawParts.length > 0) {
          numero = token;
        } else if (!unidad && i > 0) {
          const prevToken = tokens[i - 1]?.toLowerCase();
          if (UNIT_ABBREVIATIONS[prevToken]) {
            unidad = `${UNIT_ABBREVIATIONS[prevToken]} ${token}`;
          } else if (numero) {
            unidad = token;
          }
        }
        i++;
        continue;
      }
    }

    // Unit detection
    const unitMatch = UNIT_ABBREVIATIONS[lowerToken];
    if (unitMatch) {
      if (i + 1 < tokens.length && /^\d/.test(tokens[i + 1])) {
        unidad = `${unitMatch} ${tokens[i + 1]}`;
        i += 2;
      } else {
        unidad = unitMatch;
        i++;
      }
      continue;
    }

    // Collect unmatched tokens for second pass
    rawParts.push(token);
    i++;
  }

  // Second pass: process rawParts to find nombre and comuna
  // Comuna is usually at the END. Don't eat the nombre if via+numero already set and only 1 rawPart.
  const nameTokens: string[] = [];

  for (let j = rawParts.length - 1; j >= 0; j--) {
    // Try to extract comuna
    if (!comuna) {
      let matchedComuna: string | null = null;
      let tokensUsed = 1;

      // Try matching up to 4 tokens backwards to catch multi-word comunas like "San Bernardo" or "La Florida"
      for (let k = 4; k >= 1; k--) {
        if (j - k + 1 >= 0) {
          const combined = rawParts.slice(j - k + 1, j + 1).join(" ");
          const match = normalizeComunaName(combined);
          const abbrMatch = !match ? COMUNA_ABBREVIATIONS[combined.toLowerCase()] : undefined;
          
          if (match || abbrMatch) {
            const likelyStreetName = via && numero && rawParts.length === k;
            if (!likelyStreetName) {
              matchedComuna = match || abbrMatch || null;
              tokensUsed = k;
              break;
            }
          }
        }
      }

      if (matchedComuna) {
        comuna = matchedComuna;
        j -= (tokensUsed - 1); // skip the consumed tokens
        continue;
      }
    }

    nameTokens.unshift(rawParts[j]);
  }

  // If no comuna found yet, try fuzzy match as suggestion only
  if (!comuna && nameTokens.length > 0) {
    const last1 = nameTokens[nameTokens.length - 1];
    let fuzzy = fuzzyMatchComuna(last1, 1);
    
    if (!fuzzy && nameTokens.length > 1) {
      const last2 = nameTokens.slice(-2).join(" ");
      fuzzy = fuzzyMatchComuna(last2, 1);
    }

    if (fuzzy && nameTokens.length > 1) {
      suggestions.push(`¿Quisiste decir ${fuzzy}?`);
    }
  }

  if (nameTokens.length > 0) {
    nombre = nameTokens.join(" ");
  }

  // Rural km detection
  if (_isRural && kmInfo) {
    nombre = `${kmInfo.before} Kilómetro ${kmInfo.km}`;
    warnings.push("RURAL");
  }

  // Autocomplete region from comuna
  if (!region && comuna) {
    const found = COMUNAS.find((c) => c.nombre === comuna);
    if (found) {
      region = found.region;
    }
  }

  // Warnings
  if (!nombre && !numero) {
    warnings.push("DIRECCION_INCOMPLETA");
  }
  if (comuna && !nombre && !numero) {
    warnings.push("SOLO_COMUNA");
  }
  if (region && !comuna && !nombre && !numero) {
    warnings.push("SOLO_REGION");
  }

  return { via, nombre, numero, unidad, comuna, region, reference, warnings, suggestions };
}

function rebuild(parts: {
  via?: string;
  nombre?: string;
  numero?: string;
  unidad?: string;
  comuna?: string;
  region?: string;
}): string {
  const components: string[] = [];

  let addressLine = "";
  if (parts.via) addressLine += parts.via + " ";
  if (parts.nombre) addressLine += parts.nombre + " ";
  if (parts.numero) addressLine += parts.numero + " ";
  if (parts.unidad) addressLine += parts.unidad;

  addressLine = addressLine.trim();
  if (addressLine) components.push(addressLine);

  if (parts.comuna) components.push(parts.comuna);
  if (parts.region) components.push(parts.region);
  components.push("Chile");

  return components.join(", ");
}

function capitalizeProper(text: string): string {
  return text
    .split(" ")
    .map((word) => {
      if (word.length === 0) return word;
      const lower = word.toLowerCase();
      const exceptions = ["de", "del", "la", "el", "los", "las", "y", "con"];
      if (exceptions.includes(lower)) return lower;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function fixAccents(text: string): string {
  const accentMap: Record<string, string> = {
    "nunoa": "Ñuñoa",
    "penalolen": "Peñalolén",
    "conchali": "Conchalí",
    "concon": "Concón",
    "olmue": "Olmué",
    "quilpue": "Quilpué",
    "puchuncavi": "Puchuncaví",
    "vina del mar": "Viña del Mar",
    "vina": "Viña",
    "curico": "Curicó",
    "copiapo": "Copiapó",
    "chanaral": "Chañaral",
    "vicuna": "Vicuña",
    "combarbala": "Combarbalá",
    "hualane": "Hualañé",
    "licanten": "Licantén",
    "longavi": "Longaví",
    "maulli": "Maullín",
    "puqueldon": "Puqueldón",
    "quellon": "Quellón",
    "quilen": "Queilén",
    "traiguen": "Traiguén",
    "tolten": "Toltén",
    "vilcun": "Vilcún",
    "curacautin": "Curacautín",
    "pitrufquen": "Pitrufquén",
    "pucon": "Pucón",
    "puren": "Purén",
    "tirua": "Tirúa",
    "tome": "Tomé",
    "mulchen": "Mulchén",
    "canete": "Cañete",
    "hualpen": "Hualpén",
    "reina": "Reina",
    "macul": "Macul",
    "maipu": "Maipú",
    "curacavi": "Curacaví",
    "alhue": "Alhué",
    "penaflor": "Peñaflor",
    "san ramon": "San Ramón",
    "san joaquin": "San Joaquín",
    "san fabian": "San Fabián",
    "san nicolas": "San Nicolás",
    "chillan": "Chillán",
    "niquen": "Ñiquén",
    "ranquil": "Ránquil",
    "quillon": "Quillón",
    "mafil": "Máfil",
    "aysen": "Aysén",
    "coihaique": "Coihaique",
    "chaiten": "Chaitén",
    "futaleufu": "Futaleufú",
    "hualaihue": "Hualaihué",
    "cochamo": "Cochamó",
    "ollague": "Ollagüe",
    "donihue": "Doñihue",
    "requinoa": "Requínoa",
    "machali": "Machalí",
    "rio claro": "Río Claro",
    "rio hurtado": "Río Hurtado",
    "rio ibanez": "Río Ibáñez",
    "rio bueno": "Río Bueno",
    "rio negro": "Río Negro",
    "san pedro de la paz": "San Pedro de la Paz",
    "los alamos": "Los Álamos",
    "los angeles": "Los Ángeles",
    "santa barbara": "Santa Bárbara",
    "padre las casas": "Padre Las Casas",
    "la cruz": "La Cruz",
    "la higuera": "La Higuera",
    "la ligua": "La Ligua",
    "la reina": "La Reina",
    "la cisterna": "La Cisterna",
    "la florida": "La Florida",
    "la granja": "La Granja",
    "la pintana": "La Pintana",
    "la union": "La Unión",
    "los andes": "Los Andes",
    "los lagos": "Los Lagos",
    "los rios": "Los Ríos",
    "los muermos": "Los Muermos",
    "los sauces": "Los Sauces",
    "las condes": "Las Condes",
    "las cabras": "Las Cabras",
    "el bosque": "El Bosque",
    "el monte": "El Monte",
    "el quisco": "El Quisco",
    "el tabo": "El Tabo",
    "el carmen": "El Carmen",
    "o'higgins": "O'Higgins",
    "biobio": "Biobío",
    "araucania": "Araucanía",
    "valparaiso": "Valparaíso",
    "tarapaca": "Tarapacá",
    "antofagasta": "Antofagasta",
    "atacama": "Atacama",
    "coquimbo": "Coquimbo",
    "metropolitana": "Metropolitana",
    "libertador bernardo o'higgins": "Libertador Bernardo O'Higgins",
    "bernardo o'higgins": "Bernardo O'Higgins",
    "libertador b o'higgins": "Libertador Bernardo O'Higgins",
    "alameda": "Libertador Bernardo O'Higgins",
    "jose miguel carrera": "José Miguel Carrera",
    "gran avenida jose miguel carrera": "Gran Avenida José Miguel Carrera",
    "gran avenida": "Gran Avenida José Miguel Carrera",
    "presidente kennedy": "Presidente Kennedy",
    "pdte kennedy": "Presidente Kennedy",
    "pdte. kennedy": "Presidente Kennedy",
    "vicuna mackenna": "Vicuña Mackenna",
    "av. 11 de septiembre": "Avenida 11 de Septiembre",
    "11 de septiembre": "11 de Septiembre",
    "americo vespucio": "Américo Vespucio",
    "arturo pratt": "Arturo Pratt",
    "diego portales": "Diego Portales",
    "manuel rodriguez": "Manuel Rodríguez",
    "pedro de valdivia": "Pedro de Valdivia",
    "santa maria": "Santa María",
    "santa rosa": "Santa Rosa",
    "santa lucia": "Santa Lucía",
    "los libertadores": "Los Libertadores",
    "los dominicos": "Los Dominicos",
    "los leones": "Los Leones",
    "los alerces": "Los Alerces",
    "los nogales": "Los Nogales",
    "los cipreses": "Los Cipreses",
    "los aromos": "Los Aromos",
    "los peumos": "Los Peumos",
    "los boldos": "Los Boldos",
    "los arrayanes": "Los Arrayanes",
    "los molles": "Los Molles",
    "los quillayes": "Los Quillayes",
    "los lirios": "Los Lirios",
    "los claveles": "Los Claveles",
    "los rosales": "Los Rosales",
    "los jazmines": "Los Jazmines",
    "los olmos": "Los Olmos",
    "los almendros": "Los Almendros",
    "los castaños": "Los Castaños",
    "los robles": "Los Robles",
    "los laureles": "Los Laureles",
    "los espinos": "Los Espinos",
    "los maitenes": "Los Maitenes",
    "los quillay": "Los Quillay",
  };

  const lower = text.toLowerCase();

  for (const [key, value] of Object.entries(accentMap)) {
    if (lower === key) return value;
    if (lower.includes(key)) {
      text = text.replace(new RegExp(key, "gi"), value);
    }
  }

  return text;
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

  const { text: sanitized, warnings } = sanitize(original);

  if (!sanitized) {
    return {
      original,
      normalized: "",
      warnings: [...warnings, "DIRECCION_VACIA"],
      suggestions: [],
      isRural: false,
      isIntersection: false,
    };
  }

  const { tokens, isRural, isIntersection, buildingName, kmInfo } = tokenize(sanitized);

  const classified = classifyAndExpand(tokens, isRural, isIntersection, kmInfo);

  let fixedNombre = classified.nombre ? fixAccents(classified.nombre) : undefined;
  if (fixedNombre) fixedNombre = capitalizeProper(fixedNombre);

  const rebuilt = rebuild({
    via: classified.via,
    nombre: fixedNombre,
    numero: classified.numero,
    unidad: classified.unidad,
    comuna: classified.comuna,
    region: classified.region,
  });

  const allWarnings = [...warnings, ...classified.warnings];
  const allSuggestions = [...classified.suggestions];

  if (buildingName) {
    allSuggestions.push(`Edificio detectado: ${buildingName}`);
  }
  if (isIntersection) {
    allWarnings.push("INTERSECION");
  }

  return {
    original,
    normalized: rebuilt,
    via: classified.via,
    nombre: fixedNombre,
    numero: classified.numero,
    unidad: classified.unidad,
    comuna: classified.comuna,
    region: classified.region,
    warnings: allWarnings,
    suggestions: allSuggestions,
    buildingName,
    reference: classified.reference,
    isRural,
    isIntersection,
  };
}

export function normalizeBatch(addresses: string[]): NormalizedAddress[] {
  return addresses.map(normalize);
}
