// Optional Playwright runtime: set PLAYWRIGHT_MODULE to an installed package path.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE || 'playwright');
const out = process.env.UI_OUTPUT || 'docs/verification';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
const failures = [], checks = [];
let page;
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('503')) { failures.push(message.text()); console.log('Browser:', message.text()); } });
  // Test failure recovery and local interpolation deterministically, without API dependence.
  await page.route('https://photon.komoot.io/**', route => route.fulfill({ status: 503, body: '{}' }));
  await page.route('https://*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"segments":[],"addresses":[],"elements":[]}' }));
  await page.route('**/api/osm', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"elements":[]}' }));
  await page.goto(process.env.UI_URL || 'http://127.0.0.1:5173/azimut/');
  await page.locator('h1').waitFor(); await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(dimensions.scroll <= dimensions.width, `Page overflow at ${width}: ${dimensions.scroll}`);
    checks.push({ viewport: width, noPageOverflow: true });
    if ([1440,390].includes(width)) await page.screenshot({ path: `${out}/panel-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.getByRole('button', { name: /^Matucana 501/ }).click();
  await page.getByRole('button', { name: /LOCALIZAR DIRECCIÓN|Buscar en el mapa/ }).click();
  await page.getByText('Consulta terminada. Revisa el método y la evidencia.', { exact: true }).waitFor();
  assert.match(await page.locator('.evidence-body').innerText(), /Interpolación/i);
  if (!await page.locator('.source-details').evaluate(el => el.open)) await page.locator('.source-details summary').click();
  assert.match(await page.locator('.evidence-body').innerText(), /Photon/);
  await page.getByRole('button', { name: 'UBICAR MANUALMENTE' }).click();
  await page.getByLabel('LATITUD', { exact: true }).fill('-33.439731');
  await page.getByLabel('LONGITUD', { exact: true }).fill('-70.679488');
  await page.getByRole('button', { name: 'GUARDAR COORDENADAS' }).click();
  assert.match(await page.locator('.evidence-body').innerText(), /Ajuste manual/i);
  await page.locator('.design-comparison').click();
  assert.match(await page.locator('.evidence-body').innerText(), /Ajuste manual/i);
  await page.locator('.design-comparison').click();
  assert.match(await page.locator('.coordinate-readout').innerText(), /-33\.439731/);
  checks.push({ preservedManualCoordinatesWhenChangingDesign: true });
  for (const format of ['geojson', 'csv', 'xlsx', 'shp']) {
    console.log(`Checking export: ${format}`);
    await page.getByLabel('Formato de exportación').selectOption(format);
    const download = page.waitForEvent('download', { timeout: 60000 });
    await page.getByRole('button', { name: 'EXPORTAR (1)', exact: true }).click();
    const file = await download;
    assert.ok(file.suggestedFilename().endsWith(format === 'shp' ? '.zip' : `.${format}`));
    const saved = `${out}/sample.${format === 'shp' ? 'zip' : format}`;
    await file.saveAs(saved);
    checks.push({ export: format, saved: true });
  }
  await page.getByRole('button', { name: /Procesar lote|Procesar archivo/i }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'direcciones.csv', mimeType: 'text/csv', buffer: Buffer.from('dirección,comuna\nMatucana 501,Santiago\n"José Miguel de la Barra 650",Santiago\nMaipú 2359,Concepción') });
  await page.getByText(/Jos[eé] Miguel de la Barra/i).first().waitFor();
  await page.getByRole('button', { name: /PROCESAR.*3/i }).click();
  await page.getByText('Lote terminado. Puedes revisar y exportar los resultados.', { exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await page.locator('tbody tr').count(), 3);
  checks.push({ batch: 3, utf8Accents: true, completed: true });
  const initialDesign = await page.locator('.control-panel').getAttribute('class');
  await page.locator('.design-comparison').click();
  assert.notEqual(await page.locator('.control-panel').getAttribute('class'), initialDesign);
  assert.equal(await page.locator('tbody tr').count(), 3);
  assert.equal(await page.locator('tbody input[type=checkbox]:checked').count(), 3);
  assert.equal(await page.locator('.file-drop strong').innerText(), 'direcciones.csv');
  await page.locator('.design-comparison').click();
  assert.equal(await page.locator('tbody tr').count(), 3);
  checks.push({ designSwitch: true, preservedBatchAndSelection: true });
  await page.getByRole('button', { name: 'Todos', exact: false }).click();
  await page.screenshot({ path: `${out}/panel-results.png`, fullPage: true });
  await page.setViewportSize({ width: 720, height: 1000 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const animation = await page.locator('.mode-nav button').first().evaluate(el => getComputedStyle(el).transitionDuration);
  checks.push({ reflowEquivalentTo200PercentAt1440: true, reducedMotionTransition: animation });
  assert.deepEqual(failures, []);
  await writeFile(`${out}/browser-check.json`, JSON.stringify({ testedAt: new Date().toISOString(), checks, pageErrors: failures,
    network: 'Remote sources mocked unavailable/empty to verify local fallback. Map tiles real. Public-address benchmark runs separately against live OSM.' }, null, 2));
  console.log(JSON.stringify(checks));
} catch (error) {
  if (page) {
    await page.screenshot({ path: `${out}/failed-check.png`, fullPage: true });
    console.log('Failure state:', await page.locator('.status-message, .inline-error, .processing-state').allTextContents());
  }
  throw error;
} finally { await browser.close(); }
