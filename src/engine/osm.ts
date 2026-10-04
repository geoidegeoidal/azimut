import type { GeocodeCandidate, NormalizedAddress } from "@/types";
import { distanceMeters, interpolateLine, streetKey, streetSimilarity, textKey } from "./geometry";
import type { Coordinate } from "./geometry";
import { COMUNAS } from "@/data/comunas";
import { hasExactStreetIdentity } from "./callejero";

export function localityEvidence(tags: Record<string, string>, comuna?: string): { rejected: boolean; verified: boolean } {
  if (!comuna) return { rejected: false, verified: false };
  const district = tags["addr:district"] || tags["addr:suburb"];
  const explicit = tags["addr:municipality"] || (COMUNAS.some(c => textKey(c.nombre) === textKey(district || "")) ? district : undefined);
  if (explicit) return { rejected: textKey(explicit) !== textKey(comuna), verified: textKey(explicit) === textKey(comuna) };
  const city = tags["addr:city"];
  // Metropolitan city names cannot establish which municipal boundary contains a point.
  if (!city || ["santiago", "concepcion", "valparaiso"].includes(textKey(city))) return { rejected: false, verified: false };
  const municipality = COMUNAS.find(c => textKey(c.nombre) === textKey(city));
  return { rejected: Boolean(municipality && textKey(city) !== textKey(comuna)), verified: Boolean(municipality && textKey(city) === textKey(comuna)) };
}

export interface OSMElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  nodes?: number[];
  geometry?: { lat: number; lon: number }[];
  center?: { lat: number; lon: number };
}

/** Only recorded addresses or explicitly tagged interpolation ranges qualify. */
export function osmCandidates(elements: OSMElement[], address: NormalizedAddress): GeocodeCandidate[] {
  const street = address.inputStreet || [address.via, address.nombre].filter(Boolean).join(" ");
  const nodes = new Map(elements.filter(e => e.type === "node").map(e => [e.id, e]));
  const candidates: GeocodeCandidate[] = [];
  for (const element of elements) {
    const tags = element.tags || {};
    const start = element.nodes?.length ? nodes.get(element.nodes[0]) : undefined;
    const end = element.nodes?.length ? nodes.get(element.nodes[element.nodes.length - 1]) : undefined;
    const matchedStreet = tags["addr:street"] || start?.tags?.["addr:street"] || "";
    const similarity = streetSimilarity(street, matchedStreet);
    if (address.comuna && hasExactStreetIdentity(street, address.comuna) && streetKey(street) !== streetKey(matchedStreet)) continue;
    if (similarity < 0.87) continue;
    const locality = localityEvidence(tags, address.comuna);
    if (locality.rejected) continue;
    const line: Coordinate[] = (element.geometry || []).map(p => [p.lon, p.lat]);
    const rawNumber = tags["addr:housenumber"];
    if (rawNumber && address.numero && textKey(rawNumber) === textKey(address.numero)) {
      // Closed building outline: use its centroid as an approximate building position, not a door.
      const point: Coordinate | undefined = element.lat !== undefined && element.lon !== undefined
        ? [element.lon, element.lat] : element.center ? [element.center.lon, element.center.lat]
        : line.length ? [line.reduce((s, p) => s + p[0], 0) / line.length, line.reduce((s, p) => s + p[1], 0) / line.length] : undefined;
      if (!point || !point.every(Number.isFinite) || point[1] < -56.6 || point[1] > -17 || point[0] < -110 || point[0] > -66) continue;
      candidates.push({ id: `osm:${element.type}:${element.id}`, lon: point[0], lat: point[1], source: "OSM vectorial", method: "address",
        score: Math.round(similarity * (locality.verified ? element.type === "node" ? 96 : 92 : 79)), label: `${matchedStreet} ${rawNumber}`,
        evidence: ["Calle y número registrados en OSM", element.type === "node" ? "Nodo de dirección" : "Posición aproximada del edificio"],
        warnings: ["Dato cartografiado por colaboradores; no es un levantamiento certificado", ...(element.type !== "node" ? ["Posición aproximada del edificio; no identifica una puerta"] : []), ...(!locality.verified ? ["comuna no verificada por tags o límite administrativo"] : []),
          ...(similarity < 1 ? ["Nombre de calle aproximado; confirma la corrección"] : [])], osmId: element.id, osmType: element.type });
      continue;
    }
    const interpolation = tags["addr:interpolation"];
    if (!interpolation || !start || !end || !address.numero || !/^\d+$/.test(address.numero)) continue;
    const anchors = (element.nodes || []).map((id, index) => ({ node: nodes.get(id), index })).filter(a => /^\d+$/.test(a.node?.tags?.["addr:housenumber"] || ""));
    // Every interior recorded number is an anchor: use the containing subrange.
    const target = Number(address.numero);
    const pair = anchors.slice(1).map((anchor, i) => [anchors[i], anchor] as const).find(([a, b]) =>
      target >= Math.min(Number(a.node!.tags!["addr:housenumber"]), Number(b.node!.tags!["addr:housenumber"])) &&
      target <= Math.max(Number(a.node!.tags!["addr:housenumber"]), Number(b.node!.tags!["addr:housenumber"])));
    if (!pair || element.nodes?.length !== line.length) continue;
    const [a, b] = pair;
    if (localityEvidence(a.node!.tags || {}, address.comuna).rejected || localityEvidence(b.node!.tags || {}, address.comuna).rejected) continue;
    if ([a, b].some(anchor => streetSimilarity(matchedStreet, anchor.node!.tags?.["addr:street"] || matchedStreet) < 0.87)) continue;
    const first = a.node!.tags?.["addr:housenumber"], last = b.node!.tags?.["addr:housenumber"];
    if (!first || !last || !/^\d+$/.test(first) || !/^\d+$/.test(last)) continue;
    if (streetSimilarity(matchedStreet, end.tags?.["addr:street"] || matchedStreet) < 0.87) continue;
    const from = Number(first), to = Number(last), number = Number(address.numero);
    const step = interpolation === "odd" || interpolation === "even" ? 2 : interpolation === "all" ? 1 : Number(interpolation);
    if (!Number.isInteger(step) || step <= 0 || (number - from) % step !== 0) continue;
    if (interpolation === "odd" && (from % 2 !== 1 || to % 2 !== 1)) continue;
    if (interpolation === "even" && (from % 2 !== 0 || to % 2 !== 0)) continue;
    const subline = line.slice(a.index, b.index + 1);
    const point = interpolateLine(subline, from, to, number);
    if (!point) continue;
    candidates.push({ id: `osm:${element.type}:${element.id}:interpolation`, lon: point[0], lat: point[1], source: "OSM vectorial", method: "interpolated",
      score: Math.round(78 * similarity), label: `${matchedStreet} ${number}`, evidence: [`Rango OSM ${from} → ${to}`, `Secuencia: ${interpolation}`, "Interpolación sobre la geometría completa"],
      warnings: ["Ubicación estimada entre números registrados", ...(!locality.verified ? ["comuna no verificada por tags o límite administrativo"] : [])], geometry: subline, range: [from, to], osmId: element.id, osmType: element.type });
  }
  return deduplicateCandidates(candidates);
}

export function deduplicateCandidates(candidates: GeocodeCandidate[]): GeocodeCandidate[] {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  return sorted.filter((candidate, i) => !sorted.slice(0, i).some(prior => prior.source === candidate.source && prior.method === candidate.method &&
    distanceMeters([prior.lon, prior.lat], [candidate.lon, candidate.lat]) < 5));
}
