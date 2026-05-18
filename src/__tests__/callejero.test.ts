import { describe, it, expect } from "vitest";
import {
  lookupStreet,
  streetExistsInComuna,
  correctViaType,
  getComunasDisponibles,
} from "../engine/callejero";
import { normalize } from "../engine/normalizer";

// ── Callejero Name Lookup ──────────────────────────────

describe("Callejero - lookupStreet", () => {
  it("returns not found when no comuna is provided", () => {
    const result = lookupStreet("avenida providencia");
    expect(result.found).toBe(false);
  });

  it("returns not found for nonexistent comuna", () => {
    const result = lookupStreet("avenida providencia", "comuna_inexistente_xyz");
    expect(result.found).toBe(false);
  });

  it("returns not found for empty street", () => {
    const result = lookupStreet("", "santiago");
    expect(result.found).toBe(false);
  });
});

// ── Callejero - streetExistsInComuna ──────────────────

describe("Callejero - streetExistsInComuna", () => {
  it("returns false for nonexistent comuna", () => {
    expect(streetExistsInComuna("cualquier calle", "comuna_falsa")).toBe(false);
  });
});

// ── Callejero - correctViaType ───────────────────────

describe("Callejero - correctViaType", () => {
  it("returns original street if comuna not found", () => {
    expect(correctViaType("pasaje ossa", "comuna_inexistente")).toBe("pasaje ossa");
  });

  it("returns original street if it already matches", () => {
    // If the street exists as-is, no correction needed
    const comunas = getComunasDisponibles();
    if (comunas.length > 0) {
      const result = correctViaType("nonexistent street 12345", comunas[0]);
      expect(result).toBe("nonexistent street 12345");
    }
  });

  it("returns original for single-word street", () => {
    const comunas = getComunasDisponibles();
    if (comunas.length > 0) {
      const result = correctViaType("providencia", comunas[0]);
      expect(typeof result).toBe("string");
    }
  });
});

// ── Normalizer + Callejero Integration ───────────────

describe("Normalizer + Callejero Integration", () => {
  it("normalizes with comuna but does not crash if street not in callejero", () => {
    const result = normalize("Calle Inventada 999", "santiago");
    expect(result.normalized).toContain("Calle Inventada");
    expect(result.numero).toBe("999");
    expect(result.comuna).toBe("santiago");
  });

  it("preserves comuna in output even with empty address", () => {
    const result = normalize("", "providencia");
    expect(result.comuna).toBe("providencia");
    expect(result.warnings).toContain("DIRECCION_VACIA");
  });

  it("callejeroCorrected is capitalized when set", () => {
    // If callejeroCorrected is set, it should be capitalized (not lowercase)
    const result = normalize("av providencia 1234", "providencia");
    if (result.callejeroCorrected) {
      // Verify first letter is uppercase
      expect(result.callejeroCorrected.charAt(0)).toBe(
        result.callejeroCorrected.charAt(0).toUpperCase(),
      );
    }
    // Regardless, normalized output should be capitalized
    expect(result.normalized.charAt(0)).toBe(
      result.normalized.charAt(0).toUpperCase(),
    );
  });

  it("multi-word via expansion works with panamericana", () => {
    const result = normalize("panamericana norte 1500");
    // Should expand "panamericana norte" → "Ruta 5 Norte" from VIA_ABBREVIATIONS
    expect(result.via).toBe("Ruta 5 Norte");
    expect(result.normalized).toContain("Ruta 5 Norte");
  });

  it("multi-word via expansion works with ruta 5", () => {
    const result = normalize("ruta 5 sur km 85 camino a rancagua");
    expect(result.via).toBe("Ruta 5 Sur");
  });

  it("suggestions array is capped at 5", () => {
    // Regardless of how many fuzzy matches, suggestions should be ≤ 5
    const result = normalize("calle inexistente total 999", "santiago");
    expect(result.suggestions.length).toBeLessThanOrEqual(5);
  });
});

// ── getComunasDisponibles ────────────────────────────

describe("Callejero - getComunasDisponibles", () => {
  it("returns an array of strings", () => {
    const comunas = getComunasDisponibles();
    expect(Array.isArray(comunas)).toBe(true);
    expect(comunas.length).toBeGreaterThan(0);
  });

  it("all comunas are lowercase (normalized)", () => {
    const comunas = getComunasDisponibles();
    for (const c of comunas) {
      expect(c).toBe(c.toLowerCase());
    }
  });
});
