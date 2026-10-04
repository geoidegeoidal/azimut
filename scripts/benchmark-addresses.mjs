// Public institutional addresses. Coordinate comparisons use OSM as a reference,
// so they measure cross-source consistency, NOT independent surveyed accuracy.
import { createServer } from 'vite';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

const cases = [
  ['Matucana 501', 'Santiago', 'Museo de la Memoria', 'https://mmdh.cl/museo'],
  ['José Miguel de la Barra 650', 'Santiago', 'Museo Nacional de Bellas Artes', 'https://www.mnba.gob.cl/sites/www.mnba.gob.cl/files/2025-01/Programa%20actividades%20MNBA%20ene-feb%202025.pdf'],
  ['Maipú 2359', 'Concepción', 'Museo de Historia Natural', 'https://www.mhnconcepcion.gob.cl/espacios/museo-de-historia-natural-de-concepcion-maipu-2359-concepcion'],
  ['Ricardo de Ferrari 692', 'Valparaíso', 'La Sebastiana', 'https://fundacionneruda.org/informaciones/'],
  ['Fernando Márquez de la Plata 0192', 'Providencia', 'La Chascona', 'https://fundacionneruda.org/informaciones/'],
];
const originalFetch = globalThis.fetch;
let legacyData;
globalThis.fetch = async (input, options) => {
  const url = String(input);
  if (url.endsWith('/callejero-segments-index.json') && legacyData) return Response.json(legacyData);
  if (url.startsWith('/azimut/callejero/')) {
    try { return new Response(await readFile(`public/callejero/${decodeURIComponent(url.split('/').pop())}`)); }
    catch { return new Response('', { status: 404 }); }
  }
  return originalFetch(input, options);
};
const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const callejero = await vite.ssrLoadModule('/src/engine/callejero.ts');
  const { normalize } = await vite.ssrLoadModule('/src/engine/normalizer.ts');
  const { osmCandidates } = await vite.ssrLoadModule('/src/engine/osm.ts');
  const { distanceMeters } = await vite.ssrLoadModule('/src/engine/geometry.ts');
  const { geocodeAddress } = await vite.ssrLoadModule('/src/engine/geocoder.ts');
  const gitFile = path => execFileSync('git', ['show', `a480f49:${path}`], { maxBuffer: 80 * 1024 * 1024 }).toString();
  legacyData = JSON.parse(gitFile('public/callejero-segments-index.json'));
  const legacyNames = JSON.parse(gitFile('src/data/callejero-names.json'));
  const oldSource = gitFile('src/engine/callejero.ts').replaceAll('import.meta.env.BASE_URL', '"/azimut/"');
  const code = ts.transpileModule(oldSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
  const legacy = {};
  new Function('require', 'exports', code)(() => legacyNames, legacy);
  await legacy.loadSegments('/azimut/');
  const results = [];
  for (const [query, comuna, institution, source] of cases) {
    const input = normalize(query, comuna), street = input.inputStreet;
    await callejero.loadComunaSegments(comuna);
    const matches = callejero.searchSegments(street, Number(input.numero), comuna), old = legacy.searchSegment(street, Number(input.numero), comuna);
    const bounds = callejero.getStreetBounds(street, comuna);
    let reference = null, vectorStatus = bounds ? 'unavailable' : 'no street bounds', vectorCandidates = [];
    if (bounds) {
      try {
        const response = await originalFetch('http://127.0.0.1:8787/api/osm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ street, bounds }), signal: AbortSignal.timeout(30000) });
        if (!response.ok) throw new Error(`Vector proxy HTTP ${response.status}`);
        const raw = await response.json();
        vectorCandidates = osmCandidates(raw.elements, input);
        reference = vectorCandidates.find(c => c.method === 'address') || null;
        vectorStatus = reference ? 'recorded reference' : 'no recorded number';
      } catch (error) { vectorStatus = error.message; }
    }
    const measure = hit => hit?.found && reference ? Math.round(distanceMeters([hit.lon, hit.lat], [reference.lon, reference.lat])) : null;
    const resolved = await geocodeAddress(input.normalized, AbortSignal.timeout(45000), input);
    const result = { query, comuna, institution, addressSource: source, vectorStatus,
      osmReference: reference && { id: reference.id, lat: reference.lat, lon: reference.lon, warnings: reference.warnings },
      oldOfficial: { found: Boolean(old?.found), errorToOSMMetres: measure(old), range: old?.seg?.n },
      newOfficial: { found: Boolean(matches[0]?.found), errorToOSMMetres: measure(matches[0]), range: matches[0]?.range, side: matches[0]?.side },
      resolution: { found: resolved.found, method: resolved.method, source: resolved.api, score: resolved.score, needsReview: resolved.needsReview,
        lat: resolved.lat, lon: resolved.lon, distanceToOSMReferenceMetres: measure(resolved), warnings: resolved.warnings, sources: resolved.sources },
      availableRecordedCandidates: vectorCandidates.filter(c => c.method === 'address').length };
    results.push(result); console.log(JSON.stringify(result));
  }
  await mkdir('docs/benchmarks', { recursive: true });
  await writeFile('docs/benchmarks/public-addresses.json', JSON.stringify({ testedAt: new Date().toISOString(), baseline: 'a480f49',
    scope: 'Five institutional addresses chosen from public primary sources; cross-source consistency only. OSM is not independent survey truth. Null distance means no recorded reference or no valid interpolation.', results }, null, 2));
} finally { globalThis.fetch = originalFetch; await vite.close(); }
