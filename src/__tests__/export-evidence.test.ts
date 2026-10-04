import { expect, it } from "vitest";
import { flattenRows, toGeoJSON } from "@/engine/exporter";
import { normalize } from "@/engine/normalizer";
import { resultFromCandidate } from "@/engine/geocoder";
import type { GeocodeCandidate } from "@/types";

it("exports uncertainty and method for downstream GIS consumers", () => {
  const candidate: GeocodeCandidate = { id: "x", lat: -33.4, lon: -70.6, method: "interpolated", score: 78,
    source: "IDE Chile 2022", label: "Matucana 501", warnings: ["No identifica una puerta"], evidence: ["Rango dirigido 401 → 599"], range: [401,599], side: "left" };
  const rows = [{ id: 1, original: {}, normalized: normalize("Matucana 501", "Santiago"), selected: true,
    geocode: resultFromCandidate(candidate, [candidate], []) }];
  expect(flattenRows(rows)[0]).toMatchObject({ metodo: "interpolated", revisar: true, advertencias: "No identifica una puerta", rango: "401 → 599" });
  expect(toGeoJSON(rows).features[0].geometry.coordinates).toEqual([-70.6,-33.4]);
  expect(toGeoJSON(rows).features[0].properties.evidencia).toContain("Rango dirigido");
});

it("marks fuzzy recorded street matches for review", () => {
  const candidate: GeocodeCandidate = { id: "x", lat: -33.4, lon: -70.6, method: "address", score: 90,
    source: "OSM", label: "Maipú 1", warnings: ["Nombre de calle aproximado; confirma la corrección"], evidence: [] };
  expect(resultFromCandidate(candidate, [candidate], []).needsReview).toBe(true);
});
