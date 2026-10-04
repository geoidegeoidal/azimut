export type Coordinate = [number, number]; // longitude, latitude

export function distanceMeters(a: Coordinate, b: Coordinate): number {
  const rad = Math.PI / 180;
  const dLat = (b[1] - a[1]) * rad;
  const dLon = (b[0] - a[0]) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin(dLon / 2) ** 2;
  return 6371008.8 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function lineLength(line: Coordinate[]): number {
  return line.slice(1).reduce((sum, p, i) => sum + distanceMeters(line[i], p), 0);
}

/** Follow the actual line by distance, including bends and descending numbering. */
export function interpolateLine(line: Coordinate[], from: number, to: number, number: number): Coordinate | null {
  if (line.length < 2 || ![from, to, number].every(Number.isFinite) || from <= 0 || to <= 0) return null;
  if (number < Math.min(from, to) || number > Math.max(from, to)) return null;
  if (from === to) return null; // one number does not establish its position along a segment
  const fraction = (number - from) / (to - from);
  const lengths = line.slice(1).map((p, i) => distanceMeters(line[i], p));
  const total = lengths.reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  let remaining = total * fraction;
  for (let i = 0; i < lengths.length; i++) {
    if (remaining <= lengths[i] || i === lengths.length - 1) {
      const t = lengths[i] ? Math.max(0, Math.min(1, remaining / lengths[i])) : 0;
      return [line[i][0] + t * (line[i + 1][0] - line[i][0]), line[i][1] + t * (line[i + 1][1] - line[i][1])];
    }
    remaining -= lengths[i];
  }
  return null;
}

export function matchesParity(number: number, from: number, to: number): boolean {
  return from % 2 !== to % 2 || number % 2 === from % 2;
}

export function textKey(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

export function streetKey(text: string): string {
  return textKey(text).replace(/^(?:avda|av|avenida|cl|calle|pje|psje|pasaje|camino|cmno)\s+/, "");
}

export function streetSimilarity(a: string, b: string): number {
  a = streetKey(a); b = streetKey(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) next[j] = Math.min(next[j - 1] + 1, prev[j] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = next;
  }
  return 1 - prev[b.length] / Math.max(a.length, b.length);
}
