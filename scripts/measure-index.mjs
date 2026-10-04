// Imports the public dataset into the disposable PostGIS test container, NOT cloud.
import { spawn } from 'node:child_process';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
const container = process.env.POSTGIS_TEST_CONTAINER || 'azimut-postgis-check';
const key = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/['’]/g,'').replace(/[^a-z0-9]+/g,' ').trim().replace(/^(avenida|avda|av|calle|cl|pasaje|pje|psje|camino|cmno) /,'');
let count = 0;
const processSQL = spawn('docker', ['exec', '-i', container, 'psql', '-U', 'postgres', '-d', 'azimut', '-q', '-v', 'ON_ERROR_STOP=1', '-o', '/dev/null'], { stdio: ['pipe', 'ignore', 'inherit'] });
const completion = new Promise((resolve, reject) => processSQL.on('exit', code => code === 0 ? resolve() : reject(new Error(`SQL exit ${code}`))));
processSQL.stdin.on('error', error => console.error(error.message));
for (const file of (await readdir('public/callejero')).filter(f => f !== 'manifest.json')) {
  const rows = JSON.parse(await readFile(`public/callejero/${file}`, 'utf8'));
  for (let index = 0; index < rows.length; index += 500) {
    const batch = rows.slice(index,index+500).map(row => ({ ...row, id: `${row.c}:${row.id}`, street_key: key(row.v), alias_keys: (row.a || []).map(key) }));
    const sql = `select public.import_segments('${JSON.stringify(batch).replaceAll("'","''")}'::jsonb);\n`;
    if (!processSQL.stdin.write(sql)) await new Promise(resolve => processSQL.stdin.once('drain',resolve));
    count += batch.length;
  }
}
processSQL.stdin.end(); await completion;
const query = "select json_build_object('segments',(select count(*) from public.azimut_segments),'streets',(select count(*) from public.azimut_streets),'applicationTableAndIndexBytes',(select sum(pg_total_relation_size(oid)) from pg_class where relname like 'azimut_%' and relkind='r'),'databaseBytes',pg_database_size(current_database()));";
const statsProcess = spawn('docker', ['exec',container,'psql','-U','postgres','-d','azimut','-t','-A','-c',query]);
let output = ''; statsProcess.stdout.on('data',chunk => output += chunk);
await new Promise((resolve,reject) => statsProcess.on('exit',code => code===0 ? resolve() : reject(new Error(`Size query exit ${code}`))));
const stats = { measuredAt: new Date().toISOString(), engine: 'PostgreSQL 17 / PostGIS 3.5', importedRows: count, ...JSON.parse(output),
  limitation: 'Isolated local database, not a Supabase project. Cloud total includes platform tables and future OSM imports; measure again after deployment.' };
await mkdir('docs/verification',{recursive:true}); await writeFile('docs/verification/index-size.json',JSON.stringify(stats,null,2)); console.log(JSON.stringify(stats));
