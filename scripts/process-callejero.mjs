import { readFileSync, writeFileSync, mkdirSync, openSync, readSync, closeSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA = join(ROOT, 'data');
const key = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['’]/g, '').replace(/\s+/g, ' ').trim();
const round = n => Math.round(n * 1e6) / 1e6;
const fd = openSync(join(DATA, 'Maestro_de_Calles_2022.dbf'), 'r');
const header = Buffer.alloc(32);
readSync(fd, header, 0, 32, 0);
const count = header.readUInt32LE(4), headerLen = header.readUInt16LE(8), recordLen = header.readUInt16LE(10);
const fieldBuffer = Buffer.alloc(headerLen);
readSync(fd, fieldBuffer, 0, headerLen, 0);
const fields = [];
let offset = 1;
for (let p = 32; p < headerLen - 1; p += 32) {
  const name = fieldBuffer.toString('ascii', p, p + 11).replace(/\0/g, '');
  const length = fieldBuffer[p + 16];
  fields.push({ name, length, offset, type: String.fromCharCode(fieldBuffer[p + 11]) });
  offset += length;
}
const shp = readFileSync(join(DATA, 'Maestro_de_Calles_2022.shp'));
const shpOffsets = [];
for (let p = 100; p < shp.length;) { shpOffsets.push(p + 8); p += 8 + shp.readInt32BE(p + 4) * 2; }

function geometry(index) {
  const p = shpOffsets[index];
  if (p === undefined || shp.readInt32LE(p) !== 3) return null;
  const parts = shp.readInt32LE(p + 36), points = shp.readInt32LE(p + 40);
  // A disconnected multipart record cannot establish one continuous address range.
  if (parts !== 1 || points < 2) return null;
  const start = p + 44 + parts * 4;
  return Array.from({ length: points }, (_, i) => [round(shp.readDoubleLE(start + i * 16)), round(shp.readDoubleLE(start + i * 16 + 8))]);
}

const names = new Map(), byComuna = {}, chunkSize = 4096;
const chunk = Buffer.alloc(recordLen * chunkSize);
let skipped = 0, segments = 0;
for (let base = 0; base < count; base += chunkSize) {
  const size = Math.min(chunkSize, count - base);
  readSync(fd, chunk, 0, size * recordLen, headerLen + base * recordLen);
  for (let i = 0; i < size; i++) {
    if (chunk[i * recordLen] === 0x2a) continue;
    const rec = {};
    for (const f of fields) {
      const value = chunk.toString(f.type === 'C' ? 'utf8' : 'ascii', i * recordLen + f.offset, i * recordLen + f.offset + f.length).replace(/\0/g, '').trim();
      rec[f.name] = f.type === 'C' ? value : Number(value) || 0;
    }
    if (!rec.NOMBRE_MAE || !rec.COMUNA) continue;
    const c = key(rec.COMUNA), v = key(`${rec.TIPO_VIA} ${rec.NOMBRE_MAE}`);
    const aliases = rec.NOMBRE_AUX ? [key(`${rec.TIPO_VIA} ${rec.NOMBRE_AUX}`)] : [];
    if (!names.has(c)) names.set(c, new Set());
    for (const name of [v, ...aliases]) names.get(c).add(name);
    const l = [rec.INI_IZQ, rec.TER_IZQ], r = [rec.INI_DER, rec.TER_DER];
    const valid = range => range.every(n => n > 0) && range[0] !== range[1];
    if (!valid(l) && !valid(r)) continue;
    const g = geometry(base + i);
    if (!g) { skipped++; continue; }
    const nums = [...(valid(l) ? l : []), ...(valid(r) ? r : [])];
    (byComuna[c] ||= []).push({ id: `${rec.CODIGO || "segment"}:${base + i}`, c, v, a: aliases, n: [Math.min(...nums), Math.max(...nums)],
      ...(valid(l) ? { l } : {}), ...(valid(r) ? { r } : {}), g });
    segments++;
  }
  if (base % (chunkSize * 50) === 0) console.log(`${base}/${count}`);
}
closeSync(fd);
const dir = join(ROOT, 'public', 'callejero');
mkdirSync(dir, { recursive: true });
const manifest = { version: 2, source: 'IDE Chile · Maestro de Calles 2022', crs: 'SIRGAS 2000 (geographic)', segments, skippedMultipart: skipped,
  comunas: Object.fromEntries(Object.entries(byComuna).map(([c, rows]) => [c, { count: rows.length, bytes: Buffer.byteLength(JSON.stringify(rows)) }])) };
for (const [c, rows] of Object.entries(byComuna)) writeFileSync(join(dir, `${c}.json`), JSON.stringify(rows));
writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(ROOT, 'src', 'data', 'callejero-names.json'), JSON.stringify(Object.fromEntries([...names].map(([c, set]) => [c, [...set].sort()]))));
console.log(JSON.stringify({ records: count, segments, comunas: Object.keys(byComuna).length, skipped }, null, 2));
