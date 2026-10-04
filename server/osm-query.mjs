export function overpassQuery(input) {
  const { street, bounds } = input || {};
  if (typeof street !== 'string' || street.length < 3 || street.length > 100 || !Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(Number.isFinite)) {
    throw new Error('Consulta de calle inválida');
  }
  const [west, south, east, north] = bounds;
  if (west < -110 || east > -66 || south < -56.6 || north > -17 || east <= west || north <= south || (east - west) * (north - south) > 0.01) {
    throw new Error('Área de consulta inválida o demasiado grande');
  }
  const core = street.replace(/^(avenida|avda\.?|av\.?|calle|cl\.?|pasaje|pje\.?|camino|cmno\.?)\s+/i, '').trim();
  if (core.length < 3) throw new Error('Indica el nombre de la calle');
  const escaped = core.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/[aeioun]/gi, ch => ({ a: '[aáàâä]', e: '[eéèêë]', i: '[iíìîï]', o: '[oóòôö]', u: '[uúùûü]', n: '[nñ]' })[ch.toLowerCase()]);
  const pattern = JSON.stringify(`^((Avenida|Av\\.?|Avda\\.?|Calle|Pasaje|Pje\\.?|Camino) )?${escaped}$`);
  const bbox = [south, west, north, east].map(n => n.toFixed(5)).join(',');
  // Interpolation endpoints are included with their address tags; geometry alone is insufficient.
  return `[out:json][timeout:20][maxsize:8388608];(nwr["addr:street"~${pattern},i](${bbox});way["addr:interpolation"](${bbox}););(._;>;);out body geom;`;
}

export async function fetchOSM(input, signal) {
  const query = overpassQuery(input);
  const response = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Azimut/2.0 (public address vector lookup)' },
    body: new URLSearchParams({ data: query }), signal: signal || AbortSignal.timeout(24000) });
  if (!response.ok) throw new Error(`OSM HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 4 * 1024 * 1024) throw new Error('OSM response exceeds the cache budget');
  const data = JSON.parse(text);
  if (data.remark || !Array.isArray(data.elements) || data.elements.length > 20000) throw new Error(data.remark || 'Invalid OSM response');
  return { elements: data.elements, attribution: '© OpenStreetMap contributors · ODbL', fetchedAt: new Date().toISOString() };
}
