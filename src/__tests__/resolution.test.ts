import { describe, expect, it } from "vitest";
import { interpolateLine, distanceMeters } from "../engine/geometry";
import { matchSegments } from "../engine/callejero";
import { osmCandidates } from "../engine/osm";
import { resultFromCandidate, validateProviderCandidate } from "../engine/geocoder";
import { normalize } from "../engine/normalizer";
import type { CallejeroSegment } from "../engine/callejero";
import type { GeocodeCandidate } from "../types";

describe("Directed full-line interpolation", () => {
  const segment: CallejeroSegment = { c: "santiago", v: "calle prueba", n: [100, 200], l: [101, 199], r: [200, 100],
    g: [[-70.67, -33.45], [-70.67, -33.449], [-70.669, -33.449]] };
  it("follows the bend instead of joining the two endpoints", () => {
    const point = interpolateLine(segment.g, 100, 200, 150)!;
    expect(distanceMeters(point, [-70.6695, -33.4495])).toBeGreaterThan(30);
    expect(point[0]).toBeCloseTo(-70.67, 4);
  });
  it("retains descending numbering", () => {
    const hit = matchSegments([segment], "Prueba", 180)[0];
    expect(hit.side).toBe("right");
    expect(hit.range).toEqual([200, 100]);
    expect(hit.lon).toBeCloseTo(-70.67, 5);
  });
  it("rejects the wrong parity", () => {
    expect(matchSegments([{ ...segment, r: undefined }], "Prueba", 150)).toEqual([]);
  });
  it("never clamps an out-of-range number", () => {
    expect(matchSegments([segment], "Prueba", 450)).toEqual([]);
    expect(interpolateLine(segment.g, 100, 200, 450)).toBeNull();
  });
  it("rejects legacy combined ranges and single-number ranges", () => {
    expect(matchSegments([{ ...segment, l: undefined, r: undefined }], "Prueba", 150)).toEqual([]);
    expect(interpolateLine(segment.g, 100, 100, 100)).toBeNull();
  });
  it("rejects a similarly named but different street", () => {
    expect(matchSegments([segment], "Prueba del Mar", 150)).toEqual([]);
  });
  it("never substitutes Santa Marta when Santa Maria exists without that number", () => {
    const exact: CallejeroSegment = { ...segment, v: "calle santa maria", l: [101, 199], r: undefined };
    const near: CallejeroSegment = { ...segment, v: "calle santa marta", l: [605, 639], r: undefined };
    expect(matchSegments([exact, near], "Santa Maria", 605)).toEqual([]);
    expect(matchSegments([near], "Santa Maria", 605, ["calle santa maria"])).toEqual([]);
  });
});

describe("Recorded OSM evidence", () => {
  it("prefers a recorded exact number and rejects another number", () => {
    const input = normalize("Matucana 501", "Santiago");
    const nodes = [501, 503].map((n, i) => ({ type: "node", id: i + 1, lat: -33.44, lon: -70.68, tags: { "addr:street": "Avenida Matucana", "addr:housenumber": String(n) } }));
    expect(osmCandidates(nodes, input)).toHaveLength(1);
    expect(osmCandidates(nodes, input)[0].method).toBe("address");
  });
  it("enforces odd/even ranges and refuses extrapolation", () => {
    const nodes = [{ type: "node", id: 1, tags: { "addr:street": "Prueba", "addr:housenumber": "101" } },
      { type: "node", id: 2, tags: { "addr:street": "Prueba", "addr:housenumber": "199" } }];
    const line = { type: "way", id: 3, nodes: [1, 2], tags: { "addr:interpolation": "odd" }, geometry: [{ lat: -33.45, lon: -70.67 }, { lat: -33.449, lon: -70.67 }] };
    expect(osmCandidates([...nodes, line], normalize("Prueba 151", "Santiago"))[0].method).toBe("interpolated");
    expect(osmCandidates([...nodes, line], normalize("Prueba 150", "Santiago"))).toEqual([]);
    expect(osmCandidates([...nodes, line], normalize("Prueba 301", "Santiago"))).toEqual([]);
  });
  it("honours every interior numbered OSM anchor", () => {
    const nodes = [101, 199, 299].map((n, i) => ({ type: "node", id: i + 1, tags: { "addr:street": "Prueba", "addr:housenumber": String(n) } }));
    const geometry = [-70.67, -70.669, -70.66].map(lon => ({ lat: -33.45, lon }));
    const line = { type: "way", id: 4, nodes: [1, 2, 3], tags: { "addr:interpolation": "odd" }, geometry };
    const result = osmCandidates([...nodes, line], normalize("Prueba 151", "Santiago"))[0];
    expect(result.range).toEqual([101, 199]);
    expect(result.lon).toBeCloseTo(-70.6694898, 6);
    expect(result.geometry).toHaveLength(2);
  });
  it("rejects a concrete OSM locality contradiction and flags missing comuna evidence", () => {
    const node = { type: "node", id: 1, lat: -33.44, lon: -70.68, tags: { "addr:street": "Matucana", "addr:housenumber": "501", "addr:city": "Providencia" } };
    const input = normalize("Matucana 501", "Santiago");
    expect(osmCandidates([node], input)).toEqual([]);
    const candidate = osmCandidates([{ ...node, tags: { ...node.tags, "addr:city": "Santiago" } }], input)[0];
    expect(candidate.score).toBeLessThan(85);
    expect(resultFromCandidate(candidate, [candidate], []).needsReview).toBe(true);
  });
});

describe("Provider and ambiguity validation", () => {
  const data = { id: "test", lat: -33.45, lon: -70.67, label: "Matucana 501", source: "Test", street: "Matucana", number: "501", comuna: "Santiago", country: "cl", type: "house" };
  const input = normalize("Matucana 501", "Santiago");
  it("rejects a mismatched comuna and a foreign country", () => {
    expect(validateProviderCandidate({ ...data, comuna: "Providencia" }, input)).toBeNull();
    expect(validateProviderCandidate({ ...data, country: "ar" }, input)).toBeNull();
  });
  it("a different number is only a coarse street result", () => {
    const candidate = validateProviderCandidate({ ...data, number: "999" }, input)!;
    expect(candidate.method).toBe("street");
    expect(candidate.score).toBeLessThan(60);
  });
  it("does not turn an OSM way/relation or popular centroid into a house", () => {
    expect(validateProviderCandidate({ ...data, street: undefined, type: "city" }, input)).toBeNull();
    expect(validateProviderCandidate({ ...data, type: "street" }, input)?.method).toBe("street");
  });
  it("distant equally plausible alternatives require review", () => {
    const candidate: GeocodeCandidate = { id: "a", lat: -33.45, lon: -70.67, score: 94, source: "OSM", method: "address", label: "Prueba", evidence: [], warnings: [] };
    const result = resultFromCandidate(candidate, [candidate, { ...candidate, id: "b", lon: -70.68 }], []);
    expect(result.needsReview).toBe(true);
    expect(result.score).toBeLessThan(85);
  });
  it("parses locality after a comma without dropping the number", () => {
    const address = normalize("Av. Providencia 1234, Providencia, Chile");
    expect(address.numero).toBe("1234");
    expect(address.comuna).toBe("Providencia");
    expect(address.inputStreet).toBe("Avenida Providencia");
  });
});
