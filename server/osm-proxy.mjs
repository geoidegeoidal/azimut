import { createServer } from 'node:http';
import { fetchOSM, overpassQuery } from './osm-query.mjs';
const cache = new Map();
let pending = Promise.resolve();
let cacheBytes = 0;
let activeMisses = 0;
let lastStart = 0;
function remove(key) { const entry = cache.get(key); if (entry) cacheBytes -= entry.bytes; cache.delete(key); }
createServer(async (req, res) => {
  if (['http://localhost:5173', 'http://127.0.0.1:5173'].includes(req.headers.origin)) res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method !== 'POST' || req.url !== '/api/osm') { res.writeHead(404); res.end('{}'); return; }
  try {
    let body = '';
    for await (const chunk of req) { body += chunk; if (body.length > 4096) throw new Error('Request too large'); }
    const input = JSON.parse(body), key = overpassQuery(input);
    if (cache.get(key)?.expires < Date.now()) remove(key);
    if (!cache.has(key)) {
      if (activeMisses >= 4) { res.writeHead(429); res.end('{"error":"Demasiadas consultas pendientes"}'); return; }
      activeMisses++;
      const task = pending.catch(() => {}).then(async () => {
        await new Promise(resolve => setTimeout(resolve, Math.max(0, 2000 - (Date.now() - lastStart))));
        lastStart = Date.now();
        return fetchOSM(input);
      });
      pending = task;
      const entry = { task, bytes: 0, expires: Date.now() + 86400000 };
      cache.set(key, entry);
      task.then(data => {
        if (cache.get(key) !== entry) return;
        entry.bytes = Buffer.byteLength(JSON.stringify(data)); cacheBytes += entry.bytes;
        while (cacheBytes > 20 * 1024 * 1024 || cache.size > 128) remove(cache.keys().next().value);
      }).catch(() => { if (cache.get(key) === entry) remove(key); }).finally(() => { activeMisses--; });
    }
    res.end(JSON.stringify(await cache.get(key).task));
  } catch (error) {
    res.writeHead(error.message.includes('inválid') || error.message.includes('grande') ? 400 : 502);
    res.end(JSON.stringify({ error: error.message }));
  }
}).listen(8787, '127.0.0.1', () => console.log('OSM vector proxy: http://127.0.0.1:8787/api/osm'));
