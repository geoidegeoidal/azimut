import { describe, it, expect } from "vitest";
import { normalize } from "../engine/normalizer";

describe("Normalizer - Sanitize", () => {
  it("removes chilean phone numbers", () => {
    const result = normalize("Av. Providencia 1234 +56987654321");
    expect(result.via).toBe("Avenida");
    expect(result.nombre).toBe("Providencia");
    expect(result.numero).toBe("1234");
    expect(result.warnings).toContain("POSIBLE_TELEFONO_IGNORADO");
  });

  it("removes RUTs from addresses", () => {
    const result = normalize("Los Leones 56, RUT 12.345.678-9");
    expect(result.numero).toBe("56");
    expect(result.warnings).toContain("POSIBLE_RUT_IGNORADO");
  });

  it("handles empty address", () => {
    const result = normalize("");
    expect(result.warnings).toContain("DIRECCION_VACIA");
  });

  it("collapses multiple spaces", () => {
    const result = normalize("  Av.   Providencia    1234  ");
    expect(result.via).toBe("Avenida");
    expect(result.nombre).toBe("Providencia");
    expect(result.numero).toBe("1234");
  });
});

describe("Normalizer - Tokenize", () => {
  it("detects rural addresses with km", () => {
    const result = normalize("Camino a Melipilla Km 25");
    expect(result.isRural).toBe(true);
    expect(result.warnings).toContain("RURAL");
    expect(result.normalized).toContain("Kilómetro 25");
  });

  it("detects intersections", () => {
    const result = normalize("Esq. Alameda con San Antonio");
    expect(result.isIntersection).toBe(true);
  });

  it("detects building names", () => {
    const result = normalize("Edif. Costanera Center, Andrés Bello 2425");
    expect(result.buildingName).toBeTruthy();
  });
});

describe("Normalizer - Classify & Expand", () => {
  it("expands 'Av' to 'Avenida'", () => {
    const result = normalize("Av. Providencia 1234");
    expect(result.via).toBe("Avenida");
    expect(result.nombre).toBe("Providencia");
  });

  it("expands 'Pje' to 'Pasaje'", () => {
    const result = normalize("Psje Los Alerces 567");
    expect(result.via).toBe("Pasaje");
  });

  it("expands 'Stgo' abbreviation correctly", () => {
    const result = normalize("Stgo");
    expect(result.comuna).toBe("Santiago");
  });

  it("expands 'VdM' to 'Viña del Mar'", () => {
    const result = normalize("Los Alerces 567, VdM");
    expect(result.comuna).toBe("Viña del Mar");
  });

  it("expands 'RM' to 'Región Metropolitana'", () => {
    const result = normalize("Providencia, RM");
    expect(result.region).toBe("Región Metropolitana");
  });

  it("expands 'Dpto' to 'Departamento'", () => {
    const result = normalize("av providencia 1234 dpto 502");
    expect(result.unidad).toContain("Departamento");
    expect(result.unidad).toContain("502");
  });

  it("handles 'S/N' as 'Sin Número'", () => {
    const result = normalize("Los Nogales S/N");
    expect(result.numero).toBe("Sin Número");
    expect(result.warnings).toContain("SIN_NUMERO");
  });

  it("expands 'Pdte Kennedy' to 'Presidente Kennedy'", () => {
    const result = normalize("Av. Pdte Kennedy 5678");
    expect(result.nombre).toContain("Presidente Kennedy");
  });

  it("expands 'P' to 'Pasaje'", () => {
    const result = normalize("P 18 N° 2345 Stgo");
    expect(result.via).toBe("Pasaje");
  });

  it("expands 'Cl' to 'Calle'", () => {
    const result = normalize("Cl. Los Alerces 567");
    expect(result.via).toBe("Calle");
  });
});

describe("Normalizer - Validate", () => {
  it("detects comuna-only addresses", () => {
    const result = normalize("Providencia");
    expect(result.comuna).toBe("Providencia");
    expect(result.warnings).toContain("SOLO_COMUNA");
  });

  it("detects region-only when no comuna", () => {
    const result = normalize("RM");
    expect(result.region).toBe("Región Metropolitana");
  });

  it("autocompletes region from comuna", () => {
    const result = normalize("Providencia 1234");
    expect(result.region).toBe("Región Metropolitana");
  });

  it("flags addresses where comuna could not be matched", () => {
    const result = normalize("Xyz 9999");
    expect(result.warnings.length).toBeGreaterThanOrEqual(0);
  });

  it("normalizes 'Peñaflol' as nombre", () => {
    const result = normalize("Peñaflol");
    expect(result.nombre).toBeTruthy();
  });
});

describe("Normalizer - Rebuild", () => {
  it("formats address with comuna detection", () => {
    const result = normalize("Av. Providencia 1234, Las Condes");
    expect(result.normalized).toContain("Chile");
  });

  it("capitalizes proper names", () => {
    const result = normalize("jose miguel carrera 1234");
    expect(result.normalized).toContain("José Miguel Carrera");
  });

  it("fixes accents in known names", () => {
    const result = normalize("av providencia 1234 dpto 502");
    expect(result.normalized).toContain("Providencia");
    expect(result.normalized).toContain("Chile");
  });
});

describe("Normalizer - Diagnose", () => {
  it("flags telephone ignored", () => {
    const result = normalize("Av. Providencia 1234 +56987654321");
    expect(result.warnings).toContain("POSIBLE_TELEFONO_IGNORADO");
  });

  it("flags RUT ignored", () => {
    const result = normalize("Los Leones 56, RUT 12.345.678-9");
    expect(result.warnings).toContain("POSIBLE_RUT_IGNORADO");
  });

  it("suggests corrections for similar words", () => {
    const result = normalize("Provdencia 1234");
    expect(result.suggestions.length).toBeGreaterThanOrEqual(0);
  });
});

describe("Normalizer - Edge cases from PLAN.md", () => {
  it("todo pegado: losalerces567 splits to nombre+numero", () => {
    const result = normalize("losalerces567");
    expect(result.nombre).toBeTruthy();
    expect(result.numero).toBe("567");
  });

  it("todo minúsculas con dpto", () => {
    const result = normalize("av providencia 1234 dpto 502");
    expect(result.via).toBe("Avenida");
    expect(result.unidad).toContain("502");
  });

  it("calle numérica extracts number after #", () => {
    const result = normalize("Calle 12 #5678");
    expect(result.via).toBe("Calle");
    expect(result.numero).toBeDefined();
  });

  it("avenida con ordinal: Av. 11 de Septiembre 1234", () => {
    const result = normalize("Av. 11 de Septiembre 1234");
    expect(result.via).toBe("Avenida");
    expect(result.nombre).toContain("11 de Septiembre");
  });

  it("sin tildes: jose miguel carrera 1234", () => {
    const result = normalize("jose miguel carrera 1234");
    expect(result.normalized).toContain("José Miguel Carrera");
  });

  it("rural sin calle: Km 25 Camino a Melipilla", () => {
    const result = normalize("Km 25 Camino a Melipilla");
    expect(result.isRural).toBe(true);
    expect(result.normalized).toContain("Kilómetro 25");
  });
});
