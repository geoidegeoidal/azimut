import { describe, it, expect } from "vitest";
import { normalize } from "../engine/normalizer";

describe("Normalizer - Basic cleanup", () => {
  it("trims whitespace", () => {
    const result = normalize("  hola   mundo  ");
    expect(result.normalized).toBe("Hola Mundo");
  });

  it("handles empty address", () => {
    const result = normalize("");
    expect(result.warnings).toContain("DIRECCION_VACIA");
  });

  it("handles whitespace-only address", () => {
    const result = normalize("   ");
    expect(result.warnings).toContain("DIRECCION_VACIA");
  });
});

describe("Normalizer - Accent removal", () => {
  it("removes accents from street names", () => {
    const result = normalize("José Miguel Carrera 1234");
    expect(result.normalized).toContain("Jose Miguel Carrera");
  });

  it("removes accents from comuna names", () => {
    const result = normalize("Ñuñoa");
    expect(result.normalized).toBe("Nunoa");
  });

  it("preserves ñ as n", () => {
    const result = normalize("Peñalolén");
    expect(result.normalized).toBe("Penalolen");
  });
});

describe("Normalizer - Via abbreviation expansion", () => {
  it("expands 'Av.' to 'Avenida'", () => {
    const result = normalize("Av. Providencia 1234");
    expect(result.via).toBe("Avenida");
    expect(result.normalized).toContain("Avenida");
    expect(result.normalized).toContain("Providencia");
  });

  it("expands 'Avda' to 'Avenida'", () => {
    const result = normalize("Avda Providencia 1234");
    expect(result.via).toBe("Avenida");
  });

  it("expands 'PSJE' to 'Pasaje'", () => {
    const result = normalize("PSJE Los Alerces 567");
    expect(result.via).toBe("Pasaje");
    expect(result.normalized).toContain("Pasaje");
  });

  it("expands 'Pje' to 'Pasaje'", () => {
    const result = normalize("Pje Los Alerces 567");
    expect(result.via).toBe("Pasaje");
  });

  it("expands 'PJ' to 'Pasaje'", () => {
    const result = normalize("PJ Los Alerces 567");
    expect(result.via).toBe("Pasaje");
  });

  it("expands 'Cl' to 'Calle'", () => {
    const result = normalize("Cl Los Alerces 567");
    expect(result.via).toBe("Calle");
  });

  it("does not expand single-token input as via", () => {
    const result = normalize("Av");
    expect(result.via).toBeUndefined();
    expect(result.normalized).toBe("Av");
  });
});

describe("Normalizer - Capitalization", () => {
  it("title-cases lowercase input", () => {
    const result = normalize("av providencia 1234");
    expect(result.normalized).toBe("Avenida Providencia 1234");
  });

  it("normalizes weird casing", () => {
    const result = normalize("aV pROvidenCIA 1234");
    expect(result.normalized).toBe("Avenida Providencia 1234");
  });

  it("preserves lowercase for prepositions", () => {
    const result = normalize("avenida pedro de valdivia");
    expect(result.normalized).toContain("Pedro de Valdivia");
  });
});

describe("Normalizer - Does NOT guess or classify", () => {
  it("does not extract comuna from street name", () => {
    const result = normalize("calle la florida");
    expect(result.via).toBe("Calle");
    expect(result.comuna).toBeUndefined();
    expect(result.region).toBeUndefined();
  });

  it("does not extract comuna even with number", () => {
    const result = normalize("calle la florida 123");
    expect(result.via).toBe("Calle");
    expect(result.comuna).toBeUndefined();
  });

  it("does not tokenize numbers from 'pio nono'", () => {
    const result = normalize("calle pio nono");
    expect(result.via).toBe("Calle");
    expect(result.normalized).toContain("Pio");
    expect(result.normalized).toContain("Nono");
    expect(result.numero).toBeUndefined();
  });

  it("preserves addresses starting with numbers", () => {
    const result = normalize("2 poniente");
    expect(result.normalized).toContain("2");
    expect(result.normalized).toContain("Poniente");
  });

  it("does not emit comuna/region warnings", () => {
    const result = normalize("Providencia");
    expect(result.warnings).toEqual([]);
  });
});

describe("Normalizer - Edge cases", () => {
  it("clean comma-separated address", () => {
    const result = normalize("Av. Providencia 1234, Las Condes");
    expect(result.via).toBe("Avenida");
    expect(result.normalized).toContain("Providencia");
    expect(result.normalized).toContain("Condes");
  });

  it("lowercase with dpto", () => {
    const result = normalize("av providencia 1234 dpto 502");
    expect(result.via).toBe("Avenida");
    expect(result.normalized).toContain("Providencia");
    expect(result.normalized).toContain("Dpto");
  });

  it("avenida with ordinal number", () => {
    const result = normalize("Av. 11 de Septiembre 1234");
    expect(result.via).toBe("Avenida");
    expect(result.normalized).toContain("11 de Septiembre");
  });

  it("rural address with km", () => {
    const result = normalize("Km 25 Camino a Melipilla");
    expect(result.normalized).toContain("Km");
    expect(result.normalized).toContain("Melipilla");
  });

  it("address with all uppercase", () => {
    const result = normalize("AVENIDA PROVIDENCIA 1234");
    expect(result.normalized).toBe("Avenida Providencia 1234");
  });

  it("preserves S/N format", () => {
    const result = normalize("Los Nogales S/N");
    expect(result.warnings).toEqual([]);
    expect(result.normalized).toContain("S/N");
  });
});
