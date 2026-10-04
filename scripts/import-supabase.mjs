import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');
const key = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const streetKey = s => key(s).replace(/^(avda|av|avenida|cl|calle|pje|psje|pasaje|camino|cmno)\s+/, '');
const args = process.argv.slice(2), dry = args.includes('--dry-run');
const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const comuna = option('--comuna');
if (!comuna) throw new Error('Use --comuna "Santiago". Import regionally and measure database size before expanding.');
const base = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!dry && (!base || !secret)) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');

async function send(functionName, rows) {
  let imported = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    if (!dry) {
      const response = await fetch(`${base}/rest/v1/rpc/${functionName}`, { method: 'POST',
        headers: { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_rows: batch }), signal: AbortSignal.timeout(45000) });
      if (!response.ok) throw new Error(`Import failed: HTTP ${response.status}. Resume safely; IDs are idempotent.`);
      imported += Number(await response.json());
    }
  }
  console.log(JSON.stringify({ function: functionName, dryRun: dry, candidates: rows.length, imported, payloadMB: +(Buffer.byteLength(JSON.stringify(rows)) / 1048576).toFixed(2) }));
}

const osmPath = option('--osm');
if (osmPath) {
  const data = JSON.parse(readFileSync(osmPath, 'utf8'));
  const features = (data.features || []).filter(f => f.geometry?.type === 'Point' && f.properties?.['addr:street'] && f.properties?.['addr:housenumber']);
  for (const feature of features) {
    const tags = feature.properties;
    const explicit = tags['addr:municipality'] || tags['addr:district'] || tags['addr:suburb'];
    const city = tags['addr:city'];
    const locality = explicit || (city && !['santiago', 'concepcion', 'valparaiso'].includes(key(city)) ? city : null);
    if (locality && key(locality) !== key(comuna)) throw new Error('OSM locality contradicts --comuna; clip the file to the correct municipal boundary');
    if (!locality && !args.includes('--comuna-scope-verified')) throw new Error('Missing municipal evidence. Clip the source to the comuna boundary and confirm with --comuna-scope-verified.');
  }
  const rows = features.map(f => ({
    id: `osm:${f.id || f.properties['@id']}`, comuna: key(comuna), street: f.properties['addr:street'], street_key: streetKey(f.properties['addr:street']),
    number: String(f.properties['addr:housenumber']), lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], source: 'OpenStreetMap · ODbL',
  }));
  if (rows.some(r => r.id === 'osm:undefined')) throw new Error('Every OSM feature needs its stable OSM ID');
  await send('import_addresses', rows);
} else {
  const data = JSON.parse(readFileSync(join('public', 'callejero', `${key(comuna)}.json`), 'utf8'));
  await send('import_segments', data.map((s, i) => ({ ...s, id: `ide2022:${s.c}:${s.id}:${i}`, street_key: streetKey(s.v), alias_keys: (s.a || []).map(streetKey) })));
}
