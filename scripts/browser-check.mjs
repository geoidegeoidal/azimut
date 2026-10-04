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
async function capture(path) {
  await page.evaluate(async () => {
    await Promise.all(document.getAnimations().filter(animation => animation.effect?.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {})));
  });
  // The real map may fetch a new tile set after each responsive resize.
  await page.waitForFunction(() => {
    const map = document.querySelector('.workspace-map');
    if (!map) return true;
    const bounds = map.getBoundingClientRect();
    const tiles = [...map.querySelectorAll('img.leaflet-tile')].filter(tile => {
      const box = tile.getBoundingClientRect();
      return box.right > bounds.left && box.left < bounds.right && box.bottom > bounds.top && box.top < bounds.bottom;
    });
    return tiles.length > 0 && tiles.every(tile => tile.complete && tile.naturalWidth > 0);
  }, null, { timeout: 15000 });
  await page.screenshot({ path, fullPage: true });
}
try {
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', error => failures.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && !message.text().includes('503') && !message.text().includes('EXPECTED_EXPORT_FAILURE')) { failures.push(message.text()); console.log('Browser:', message.text()); } });
  // Test failure recovery and local interpolation deterministically, without API dependence.
  await page.route('https://photon.komoot.io/**', route => route.fulfill({ status: 503, body: '{}' }));
  await page.route('https://*.supabase.co/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"segments":[],"addresses":[],"elements":[]}' }));
  await page.route('**/api/osm', route => route.fulfill({ status: 200, contentType: 'application/json', body: '{"elements":[]}' }));
  await page.goto(process.env.UI_URL || 'http://127.0.0.1:5173/azimut/');
  await page.locator('h1').waitFor(); await page.evaluate(() => document.fonts.ready);
  if (await page.locator('.title-bearing').count()) {
    assert.equal(await page.getByRole('button', { name: 'Importar archivo', exact: true }).count(), 1);
    assert.equal(await page.locator('.ledger, .evidence-panel').count(), 0, 'Empty workspace must not duplicate import or evidence panels');
    assert.match(await page.locator('h1').evaluate(el => getComputedStyle(el).fontFamily), /Outfit/);
    assert.equal(await page.evaluate(() => document.fonts.check('500 32px Outfit')), true);
    const box = await page.locator('.file-drop').boundingBox();
    await page.mouse.move(box.x + 10, box.y + 15);
    const bearing = await page.locator('.file-drop').evaluate(el => el.style.getPropertyValue('--bearing'));
    assert.ok(bearing.endsWith('deg'), 'Import bearing must respond to the pointer');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.mouse.move(box.x + box.width - 10, box.y + box.height - 15);
    assert.equal(await page.locator('.file-drop').evaluate(el => el.style.getPropertyValue('--bearing')), bearing);
    assert.equal(await page.locator('.title-bearing .bearing-arc').evaluate(el => getComputedStyle(el).animationName), 'none');
    const headerNeedle = await page.locator('.brand .bearing-needle').evaluate(el => getComputedStyle(el).transform);
    await page.getByRole('link', { name: 'Azimut, inicio', exact: true }).hover();
    assert.equal(await page.locator('.brand .bearing-needle').evaluate(el => getComputedStyle(el).transform), headerNeedle, 'Reduced motion must keep the header needle steady on hover');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.mouse.move(10, 10);
    assert.equal(await page.locator('.file-drop').evaluate(el => el.style.getPropertyValue('--bearing')), '');
    checks.push({ singleImportAction: true, emptyWorkspaceConsolidated: true, localOutfitFontLoaded: true, pointerBearing: true, reducedMotionStopsBearingAndDraw: true, reducedMotionKeepsHeaderNeedleSteady: true });
  }
  const userWidth = Number(process.env.UI_USER_WIDTH || 649);
  for (const width of [...new Set([1440, 1024, 768, 390, 320, userWidth])]) {
    await page.setViewportSize({ width, height: width === userWidth ? Number(process.env.UI_USER_HEIGHT || 672) : 1000 });
    const dimensions = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert.ok(dimensions.scroll <= dimensions.width, `Page overflow at ${width}: ${dimensions.scroll}`);
    assert.equal(await page.locator('.query-panel').evaluate(el => el.scrollHeight <= el.clientHeight + 1), true, `Importer content must fit its panel at ${width}`);
    checks.push({ viewport: width, noPageOverflow: true });
    if ([1440,390,userWidth].includes(width)) await capture(`${out}/panel-${width}.png`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const extraColumns = Array.from({ length: 30 }, (_, i) => `campo_${i}`);
  await page.locator('input[type=file]').setInputFiles({ name: 'archivo-con-muchas-columnas.csv', mimeType: 'text/csv', buffer: Buffer.from(`dirección,comuna,${extraColumns.join(',')}\nMatucana 501,Santiago,${extraColumns.map(() => 'dato').join(',')}`) });
  await page.getByText('archivo-con-muchas-columnas.csv', { exact: true }).waitFor();
  for (const width of [1304,390]) {
    await page.setViewportSize({ width, height: 884 });
    for (const selector of ['.query-panel','.column-options']) assert.equal(await page.locator(selector).evaluate(el => el.scrollHeight <= el.clientHeight + 1), true, `${selector} must expose all columns at ${width}`);
    assert.equal(await page.locator('.query-panel').evaluate(el => {
      const panel = el.getBoundingClientRect();
      const note = el.querySelector('.data-note').getBoundingClientRect();
      return note.bottom <= panel.bottom;
    }), true);
    if (width === 1304) assert.ok(await page.locator('.map-panel').evaluate(el => el.getBoundingClientRect().height <= 641), 'Many input columns must not stretch the map indefinitely');
    await capture(`${out}/many-columns-${width}.png`);
  }
  checks.push({ importerUsesPageFlow: true, all32ColumnsVisibleWithoutInternalScroll: true, checkedAt: [1304,390] });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('input[type=file]').setInputFiles({ name: 'invalid.csv', mimeType: 'text/csv', buffer: Buffer.from('dirección,dirección\nMatucana,501') });
  await page.getByRole('alert').waitFor();
  assert.equal(await page.getByRole('alert').isVisible(), true, 'Input validation must remain visible before any rows exist');
  checks.push({ emptyImportValidationVisible: true });
  if (await page.getByRole('button', { name: 'Mapa claro', exact: true }).count()) {
    await page.getByRole('button', { name: 'Mapa claro', exact: true }).click();
    assert.equal(await page.locator('.map-light').count(), 1);
    assert.equal(await page.locator('.leaflet-tile-pane').evaluate(el => getComputedStyle(el).filter), 'none');
    await page.getByRole('button', { name: 'Mapa oscuro', exact: true }).click();
    assert.equal(await page.locator('.map-dark').count(), 1);
    checks.push({ mapToneSwitchPreservesOriginalTiles: true });
  }
  if (await page.getByRole('button', { name: 'Buscar dirección', exact: true }).count()) {
    assert.equal(await page.getByRole('button', { name: 'Lotes', exact: true }).getAttribute('aria-current'), 'page');
    checks.push({ batchFirst: true });
    await page.getByRole('button', { name: 'Buscar dirección', exact: true }).click();
  }
  await page.getByRole('button', { name: /^Matucana 501/ }).click();
  await page.getByRole('button', { name: /LOCALIZAR DIRECCIÓN|Buscar en el mapa/ }).click();
  await page.getByText('Consulta terminada. Revisa el método y la evidencia.', { exact: true }).waitFor();
  assert.match(await page.locator('.evidence-body').innerText(), /Interpolación/i);
  assert.equal(await page.locator('.street-evidence').getAttribute('pathLength'), '1');
  checks.push({ selectedStreetUsesFullGeometryWithNormalizedAnimation: true });
  if (await page.locator('.source-summary').count()) {
    assert.match(await page.locator('.source-summary').innerText(), /no disponible|sin coincidencias/i);
    checks.push({ closedSourceSummaryExposesDegradedSources: true });
  }
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
  await page.getByRole('button', { name: /Procesar lote|Procesar archivo|^Lotes$/i }).click();
  await page.locator('input[type=file]').setInputFiles({ name: 'direcciones.csv', mimeType: 'text/csv', buffer: Buffer.from('dirección,comuna\nMatucana 501,Santiago\n"José Miguel de la Barra 650",Santiago\nMaipú 2359,Concepción') });
  await page.getByText(/Jos[eé] Miguel de la Barra/i).first().waitFor();
  await page.getByRole('button', { name: /PROCESAR.*3/i }).click();
  await page.getByText('Lote terminado. Puedes revisar y exportar los resultados.', { exact: true }).waitFor({ timeout: 30000 });
  assert.equal(await page.locator('tbody tr').count(), 3);
  checks.push({ batch: 3, utf8Accents: true, completed: true });
  if (await page.getByLabel('Buscar dentro del lote').count()) {
    await page.getByRole('button', { name: 'UBICAR MANUALMENTE' }).click();
    await page.getByLabel('Buscar dentro del lote').fill('jose');
    assert.equal(await page.locator('tbody tr').count(), 1);
    assert.match(await page.locator('tbody').innerText(), /barra/i);
    assert.match(await page.locator('.inspector-heading h2, .evidence-body h3').innerText(), /barra/i);
    assert.equal(await page.locator('.manual-coordinates').count(), 0);
    await page.getByLabel('Buscar dentro del lote').fill('ninguna coincidencia');
    assert.equal(await page.locator('.evidence-body').count(), 0);
    await page.getByLabel('Buscar dentro del lote').fill('');
    await page.setViewportSize({ width: 1440, height: 400 });
    await page.getByRole('button', { name: 'Siguiente por revisar', exact: true }).click();
    assert.match(await page.locator('.evidence-reference').innerText(), /002/);
    assert.equal(await page.locator('.active-row .row-address').evaluate(el => el === document.activeElement), true);
    assert.equal(await page.locator('.active-row .row-address').evaluate(el => {
      const bounds = el.getBoundingClientRect();
      return bounds.top >= 0 && bounds.bottom <= innerHeight + 1;
    }), true, 'Next-review focus must scroll the row into view');
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.getByRole('button', { name: /^Registradas/ }).click();
    assert.match(await page.locator('.empty-table').innerText(), /No hay filas/);
    await page.getByRole('button', { name: /^Todos/ }).click();
    checks.push({ accentInsensitiveLotSearch: true, searchReconcilesSelectionAndClosesHiddenEdit: true, nextReviewKeyboardFocus: true, nextReviewScrollsIntoView: true, filterEmptyState: true });
  }
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
  await capture(`${out}/panel-results.png`);
  for (const width of [1440, 390, userWidth]) {
    await page.setViewportSize({ width, height: width === userWidth ? Number(process.env.UI_USER_HEIGHT || 672) : 1000 });
    if (width > 1040 && await page.locator('.destino-panel').count()) {
      const layout = await page.evaluate(() => ({
        mapHeight: document.querySelector('.map-panel').getBoundingClientRect().height,
        ledgerHeight: document.querySelector('.ledger').getBoundingClientRect().height,
        importerBottomGap: document.querySelector('.query-panel').getBoundingClientRect().bottom - document.querySelector('.data-note').getBoundingClientRect().bottom,
      }));
      assert.ok(layout.mapHeight <= 341, 'A short lot must not inflate the working map');
      assert.ok(layout.ledgerHeight < 600, 'A three-row ledger must remain compact');
      assert.ok(layout.importerBottomGap < 30, 'Importer must end after its content, without stretching to the review tracks');
      checks.push({ compactPopulatedLayoutAt: width, ...layout });
    }
    if (width <= 760 && await page.locator('.destino-panel').count()) {
      assert.equal(await page.locator('.entry-toggle').getAttribute('aria-expanded'), 'false');
      assert.equal(await page.locator('.query-body').isVisible(), false);
      assert.equal(await page.locator('.ledger-toolbar').evaluate(el => el.getBoundingClientRect().bottom < innerHeight), true);
      await page.getByRole('button', { name: /Archivo y columnas/ }).click();
      assert.equal(await page.locator('.query-body').isVisible(), true);
      await page.getByRole('button', { name: /Archivo y columnas/ }).click();
      checks.push({ compactProcessedEntryAt: width, mappingRemainsEditable: true, reviewInFirstViewport: true });
      if (width === 390) {
        // Break the browser's download primitive, then restore it to exercise recovery.
        await page.evaluate(() => {
          window.__azimutDownload = URL.createObjectURL;
          URL.createObjectURL = () => { throw new Error('EXPECTED_EXPORT_FAILURE'); };
        });
        await page.getByLabel('Formato de exportación').selectOption('csv');
        await page.getByRole('button', { name: 'EXPORTAR (1)', exact: true }).click();
        await page.getByRole('alert').waitFor();
        assert.equal(await page.getByRole('alert').isVisible(), true);
        assert.equal(await page.locator('.query-body').isVisible(), false);
        assert.equal(await page.locator('tbody input[type=checkbox]:checked').count(), 3);
        await capture(`${out}/mobile-export-error.png`);
        await page.evaluate(() => { URL.createObjectURL = window.__azimutDownload; delete window.__azimutDownload; });
        const retry = page.waitForEvent('download');
        await page.getByRole('button', { name: 'EXPORTAR (1)', exact: true }).click();
        await retry;
        assert.equal(await page.getByRole('alert').count(), 0);
        assert.equal(await page.getByText('1 ubicaciones exportadas.', { exact: true }).isVisible(), true);
        checks.push({ mobileExportErrorVisibleWithCollapsedEntry: true, exportRecoveryPreservesSelection: true });
      }
    }
    await capture(`${out}/results-${width}.png`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  if (await page.getByLabel('Buscar dentro del lote').count()) {
    const entries = Array.from({ length: 103 }, () => 'Matucana 501,Santiago').join('\n');
    await page.locator('input[type=file]').setInputFiles({ name: 'paginacion.csv', mimeType: 'text/csv', buffer: Buffer.from(`dirección,comuna\n${entries}`) });
    await page.getByRole('button', { name: /PROCESAR.*103/i }).click();
    await page.getByRole('button', { name: /DETENER/ }).click();
    await page.getByText('Lote detenido. Se conservaron las filas procesadas.', { exact: true }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 100);
    assert.ok(await page.locator('.table-scroll').evaluate(el => el.clientHeight <= 441 && el.scrollHeight > el.clientHeight), 'Large review tables must retain a bounded scroll body');
    await page.getByRole('button', { name: 'Página siguiente', exact: true }).click();
    assert.equal(await page.locator('tbody tr').count(), 3);
    assert.match(await page.locator('tbody').innerText(), /101/);
    await page.getByRole('button', { name: 'Página anterior', exact: true }).click();
    assert.equal(await page.locator('tbody tr').count(), 100);
    checks.push({ pagination: 103, visibleRowLimit: 100, cancellationPreservesPendingRows: true });
  }
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
