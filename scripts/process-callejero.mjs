import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'data');

// ── DBF Parser ────────────────────────────────────────

function readDBFFields(buf) {
  const headerLen = buf.readUInt16LE(8);
  const fields = [];
  let pos = 32;
  let fieldOffset = 1;
  while (pos < headerLen - 1) {
    const name = buf.toString('ascii', pos, pos + 11).replace(/\0/g, '');
    const type = String.fromCharCode(buf[pos + 11]);
    const length = buf[pos + 16];
    const decimal = buf[pos + 17];
    fields.push({ name, type, length, decimal, offset: fieldOffset });
    fieldOffset += length;
    pos += 32;
  }
  return { headerLen, recordCount: buf.readUInt32LE(4), recordLen: buf.readUInt16LE(10), fields };
}

function readDBFRecord(buf, meta, idx) {
  const { headerLen, recordLen, fields } = meta;
  const offset = headerLen + idx * recordLen;
  const obj = {};
  fields.forEach(f => {
    const start = offset + f.offset;
    const bytes = buf.slice(start, start + f.length);
    if (f.type === 'C') {
      obj[f.name] = bytes.toString('utf-8').replace(/\0+$/g, '').trim();
    } else {
      const str = bytes.toString('ascii').replace(/\0+$/g, '').trim();
      obj[f.name] = str ? parseFloat(str) : 0;
    }
  });
  return obj;
}

// ── SHP Index ─────────────────────────────────────────

function indexSHP(filePath) {
  const buf = readFileSync(filePath);
  const offsets = [];
  let pos = 100;
  while (pos < buf.length) {
    offsets.push(pos + 8);
    const recLen = buf.readInt32BE(pos + 4);
    pos += 8 + recLen * 2;
  }
  return { buf, offsets };
}

function getPolylineEndpoints(shpIndex, recordIdx) {
  const { buf, offsets } = shpIndex;
  if (recordIdx >= offsets.length) return null;
  const pos = offsets[recordIdx];
  const shapeType = buf.readInt32LE(pos);
  if (shapeType !== 3) return null;

  const numParts = buf.readInt32LE(pos + 36);
  const numPoints = buf.readInt32LE(pos + 40);
  if (numPoints < 2) return null;

  const pointsOffset = pos + 44 + numParts * 4;
  return {
    x1: buf.readDoubleLE(pointsOffset),
    y1: buf.readDoubleLE(pointsOffset + 8),
    x2: buf.readDoubleLE(pointsOffset + (numPoints - 1) * 16),
    y2: buf.readDoubleLE(pointsOffset + (numPoints - 1) * 16 + 8)
  };
}

// ── Helpers ───────────────────────────────────────────

function normalizeText(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function roundCoord(v) {
  return Math.round(v * 1e6) / 1e6;
}

// ── Main: single pass for both phases ─────────────────

console.log('Loading DBF...');
const dbfBuf = readFileSync(join(DATA_DIR, 'Maestro_de_Calles_2022.dbf'));
const dbfMeta = readDBFFields(dbfBuf);
console.log(`  ${dbfMeta.recordCount.toLocaleString()} records, ${dbfMeta.fields.length} fields`);

console.log('Loading SHP...');
const shpIndex = indexSHP(join(DATA_DIR, 'Maestro_de_Calles_2022.shp'));
console.log(`  ${shpIndex.offsets.length.toLocaleString()} records`);

console.log('\nProcessing records (single pass for both phases)...');

const streetMap = new Map();   // comuna -> Set of via names
const segments = [];           // geocodable segments

let withName = 0;
let withNumbering = 0;
let noGeom = 0;

for (let i = 0; i < dbfMeta.recordCount; i++) {
  if (i % 100000 === 0) process.stdout.write(`  ${i.toLocaleString()} / ${dbfMeta.recordCount.toLocaleString()}\n`);

  const rec = readDBFRecord(dbfBuf, dbfMeta, i);

  const nombre = rec['NOMBRE_MAE'];
  const tipo = rec['TIPO_VIA'];
  const comuna = rec['COMUNA'];
  const aux = rec['NOMBRE_AUX'];

  if (!nombre) continue;
  withName++;

  const comunaNorm = normalizeText(comuna);
  const tipoNorm = normalizeText(tipo);
  const nombreNorm = normalizeText(nombre);
  const viaCompleta = tipoNorm + ' ' + nombreNorm;

  // Phase 1: register street name
  if (!streetMap.has(comunaNorm)) {
    streetMap.set(comunaNorm, new Set());
  }
  streetMap.get(comunaNorm).add(viaCompleta);
  if (aux) {
    streetMap.get(comunaNorm).add(tipoNorm + ' ' + normalizeText(aux));
  }

  // Phase 2: register segment if it has numbering
  const iniIzq = rec['INI_IZQ'] || 0;
  const iniDer = rec['INI_DER'] || 0;
  const terIzq = rec['TER_IZQ'] || 0;
  const terDer = rec['TER_DER'] || 0;
  const values = [iniIzq, iniDer, terIzq, terDer].filter(v => v > 0);

  if (values.length === 0) continue;
  withNumbering++;

  const eps = getPolylineEndpoints(shpIndex, i);
  if (!eps) { noGeom++; continue; }

  segments.push({
    c: comunaNorm,
    v: viaCompleta,
    n: [Math.min(...values), Math.max(...values)],
    g: [
      [roundCoord(eps.x1), roundCoord(eps.y1)],
      [roundCoord(eps.x2), roundCoord(eps.y2)]
    ]
  });
}

// ── Finalize Phase 1 ──────────────────────────────────

const callejeroNames = {};
for (const [comuna, streets] of streetMap) {
  callejeroNames[comuna] = [...streets].sort();
}

// ── Finalize Phase 2 ──────────────────────────────────

const segmentsByComuna = {};
for (const seg of segments) {
  if (!segmentsByComuna[seg.c]) segmentsByComuna[seg.c] = [];
  segmentsByComuna[seg.c].push(seg);
}

// ── Write output ──────────────────────────────────────

const SRC_DATA = join(ROOT, 'src', 'data');
const PUBLIC = join(ROOT, 'public');
if (!existsSync(SRC_DATA)) mkdirSync(SRC_DATA, { recursive: true });
if (!existsSync(PUBLIC)) mkdirSync(PUBLIC, { recursive: true });

console.log('\nWriting files...');

const namesPath = join(SRC_DATA, 'callejero-names.json');
writeFileSync(namesPath, JSON.stringify(callejeroNames));
console.log(`  callejero-names.json: ${(Buffer.byteLength(JSON.stringify(callejeroNames)) / 1024 / 1024).toFixed(2)} MB`);

const segmentsPath = join(PUBLIC, 'callejero-segments.json');
writeFileSync(segmentsPath, JSON.stringify(segments));
console.log(`  callejero-segments.json: ${(Buffer.byteLength(JSON.stringify(segments)) / 1024 / 1024).toFixed(2)} MB`);

const indexPath = join(PUBLIC, 'callejero-segments-index.json');
writeFileSync(indexPath, JSON.stringify(segmentsByComuna));
console.log(`  callejero-segments-index.json: ${(Buffer.byteLength(JSON.stringify(segmentsByComuna)) / 1024 / 1024).toFixed(2)} MB`);

// ── Stats ─────────────────────────────────────────────

const totalStreets = Object.values(callejeroNames).reduce((sum, arr) => sum + arr.length, 0);
console.log(`\n=== Summary ===`);
console.log(`  Records total:       ${dbfMeta.recordCount.toLocaleString()}`);
console.log(`  With name:           ${withName.toLocaleString()}`);
console.log(`  With numbering:      ${withNumbering.toLocaleString()}`);
console.log(`  Unique streets:      ${totalStreets.toLocaleString()}`);
console.log(`  Comunas:             ${Object.keys(callejeroNames).length}`);
console.log(`  Geocodable segments: ${segments.length.toLocaleString()}`);
console.log(`  Skipped (no geom):   ${noGeom.toLocaleString()}`);
