import { describe, it, expect } from "vitest";
import { calculateScore, getMatchTypeScore } from "../engine/scorer";

describe("Scorer - Match Type Scores", () => {
  it("building = 100", () => {
    expect(getMatchTypeScore("building")).toBe(100);
  });

  it("house_number = 95", () => {
    expect(getMatchTypeScore("house_number")).toBe(95);
  });

  it("street = 70", () => {
    expect(getMatchTypeScore("street")).toBe(70);
  });

  it("city = 25", () => {
    expect(getMatchTypeScore("city")).toBe(25);
  });

  it("country = 5", () => {
    expect(getMatchTypeScore("country")).toBe(5);
  });

  it("unknown type = 20", () => {
    expect(getMatchTypeScore("unknown_type")).toBe(20);
  });
});

describe("Scorer - Calculate Score", () => {
  it("perfect building match with high importance", () => {
    const result = calculateScore({
      osmType: "building",
      importance: 0.9,
      displayName: "Avenida Providencia 1234, Providencia, Chile",
      normalizedAddress: "Avenida Providencia 1234, Providencia, Chile",
      resultCount: 1,
    });
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.precision).toBe("excelente");
  });

  it("street match with medium importance", () => {
    const result = calculateScore({
      osmType: "street",
      importance: 0.5,
      displayName: "Avenida Las Condes, Las Condes, Chile",
      normalizedAddress: "Avenida Las Condes 1234, Las Condes, Chile",
      resultCount: 1,
    });
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.precision).toBe("bueno");
  });

  it("city-only match", () => {
    const result = calculateScore({
      osmType: "city",
      importance: 0.4,
      displayName: "Santiago, Chile",
      normalizedAddress: "Santiago, Región Metropolitana, Chile",
      resultCount: 1,
    });
    expect(result.score).toBeGreaterThanOrEqual(35);
    expect(result.score).toBeLessThan(60);
    expect(result.precision).toBe("regular");
  });

  it("multiple results reduces uniqueness score", () => {
    const result = calculateScore({
      osmType: "street",
      importance: 0.5,
      displayName: "Providencia",
      normalizedAddress: "Providencia",
      resultCount: 5,
    });
    expect(result.uniqueness).toBe(40);
  });

  it("single result gets full uniqueness", () => {
    const result = calculateScore({
      osmType: "building",
      importance: 1.0,
      displayName: "Calle 12 5678",
      normalizedAddress: "Calle 12 5678",
      resultCount: 1,
    });
    expect(result.uniqueness).toBe(100);
  });

  it("score is capped at 100", () => {
    const result = calculateScore({
      osmType: "building",
      importance: 1.0,
      displayName: "Calle 12 5678, Santiago",
      normalizedAddress: "Calle 12 5678, Santiago",
      resultCount: 1,
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
