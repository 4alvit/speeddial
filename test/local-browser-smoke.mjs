import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// Exercise only synthetic data in fresh browser profiles. LOCAL_TEST_BASE_URL
// may point to the public static build: this suite never writes to a server.
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const compatibility = Boolean(process.env.CI_PLAYWRIGHT_MODULE);
const playwright = compatibility ? require(process.env.CI_PLAYWRIGHT_MODULE) : await import('playwright-core');
const engine = process.env.CI_BROWSER_ENGINE || 'chromium';
const channel = process.env.CI_BROWSER_CHANNEL || '';
const diagnostics = process.env.CI_BROWSER_DIAGNOSTICS || process.env.SMOKE_ARTIFACT_DIR;
const runtime = compatibility ? JSON.parse(await fs.readFile(path.join(diagnostics, 'runtime.json'), 'utf8')) : null;
const scenarios = [], errors = [], forbidden = [], requests = [], cspViolations = [];
const passed = name => { scenarios.push(`Local: ${name}`); console.log(`PASS Local: ${name}`); };
const files = ['index.html', 'app.js', 'storage.js', 'i18n.js', 'i18n-base.js', 'app.css', 'local.css', 'favicon.svg'];
const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
let browser, server, page, entry, origin, tracedContext, syntheticPng;

const loaded = target => target.waitForFunction(() => document.getElementById('loading')?.hidden && document.getElementById('load-error')?.hidden);
const ids = target => target.locator('#grid .tile').evaluateAll(nodes => nodes.map(node => node.dataset.id));
const read = target => target.evaluate(async () => {
  globalThis.acceptanceStore ||= await SpeedialStorage.createStore();
  return acceptanceStore.read();
});
const backup = target => target.evaluate(async () => {
  globalThis.acceptanceStore ||= await SpeedialStorage.createStore();
  return JSON.parse(await acceptanceStore.exportBackup());
});
const fingerprint = async target => {
  const state = await read(target);
  const document = await backup(target);
  delete document.createdAt;
  return { id: state.id, revision: state.revision, document };
};
const openControls = async target => {
  if (await target.locator('#header-panel').isHidden()) await target.locator('#header-toggle').click();
};
const openSettings = async target => { await openControls(target); await target.locator('#open-settings').click(); };
const waitClosed = (target, id) => target.waitForFunction(value => !document.getElementById(value).open, id);
const editTile = async (target, index = 0) => {
  const tile = target.locator('#grid .tile').nth(index);
  await tile.hover();
  await tile.locator('.tile-tools button').last().click();
};
const addSite = async (target, title, url, image) => {
  await openControls(target);
  await target.locator('#add-tile').click();
  await target.locator('#tile-url').fill(url);
  await target.locator('#tile-title').fill(title);
  if (image) {
    await target.locator('#image-file').setInputFiles({ name: 'synthetic.png', mimeType: 'image/png', buffer: image });
    await target.waitForFunction(() => !document.getElementById('editor-form').hasAttribute('aria-busy') && Boolean(document.querySelector('#editor-preview img')));
  }
  await target.locator('#save-tile').click();
  await waitClosed(target, 'editor-dialog');
};
const semanticBackup = document => {
  const images = new Map(document.images.map(image => [image.id, { type: image.type, data: image.data }]));
  return {
    layout: document.board.layout,
    openLinksIn: document.board.openLinksIn,
    tiles: document.board.tiles.map(({ title, url, image }) => ({ title, url, image: image ? images.get(image) : null })),
  };
};

try {
  await promisify(execFile)(process.execPath, ['scripts/build-local.mjs'], { cwd: root });
  if (process.env.LOCAL_TEST_BASE_URL) {
    const target = new URL(process.env.LOCAL_TEST_BASE_URL);
    assert.ok(['http:', 'https:'].includes(target.protocol), 'static test URL must use HTTP(S)');
    assert.equal(target.username + target.password, '', 'do not pass credentials in a static test URL');
    target.hash = '';
    entry = target.href;
  } else {
    server = http.createServer(async (request, response) => {
      try {
        const pathname = new URL(request.url, 'http://localhost').pathname;
        const name = pathname === '/' ? 'index.html' : pathname.slice(1);
        if (!files.includes(name) || !['GET', 'HEAD'].includes(request.method)) { response.writeHead(404); response.end(); return; }
        const body = await fs.readFile(path.join(root, 'dist/local', name));
        response.writeHead(200, {
          'Content-Type': contentTypes[path.extname(name)],
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'no-referrer',
        });
        response.end(request.method === 'HEAD' ? undefined : body);
      } catch { response.writeHead(404); response.end(); }
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    entry = `http://127.0.0.1:${server.address().port}/`;
  }
  origin = new URL(entry).origin;
  browser = await playwright[engine].launch(compatibility
    ? { headless: true, ...(channel ? { channel } : {}) }
    : { headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  if (compatibility) {
    assert.equal(browser.browserType().name(), runtime.engine);
    assert.equal(browser.version(), runtime.browserVersion);
    assert.equal(require(path.join(process.env.CI_PLAYWRIGHT_MODULE, 'package.json')).version, runtime.playwrightVersion);
  }
  const makeContext = async initScript => {
    const context = await browser.newContext({ viewport: { width: 1200, height: 800 }, serviceWorkers: 'block', acceptDownloads: true });
    await context.exposeBinding('reportAcceptanceCspViolation', (_source, violation) => { cspViolations.push(violation); });
    await context.addInitScript(() => {
      document.addEventListener('securitypolicyviolation', event => {
        globalThis.reportAcceptanceCspViolation({ directive: event.effectiveDirective, blocked: event.blockedURI }).catch(() => {});
      });
    });
    if (initScript) await context.addInitScript(initScript);
    context.on('page', target => {
      target.setDefaultTimeout(10000);
      target.on('pageerror', error => errors.push(error.message));
    });
    const isForbidden = raw => {
      const url = new URL(raw);
      if (!['http:', 'https:'].includes(url.protocol)) return false;
      const allowedPaths = new Set([new URL(entry).pathname, ...files.map(name => `/${name}`)]);
      return url.origin !== origin || !allowedPaths.has(url.pathname) || (url.search && url.href !== entry);
    };
    context.on('request', request => {
      requests.push({ url: request.url(), method: request.method() });
      if (isForbidden(request.url())) forbidden.push(request.url());
    });
    await context.route('**/*', route => isForbidden(route.request().url()) ? route.abort() : route.continue());
    return context;
  };

  const context = await makeContext();
  if (diagnostics) {
    await fs.mkdir(diagnostics, { recursive: true });
    await context.tracing.start({ screenshots: true, snapshots: true });
    tracedContext = context;
  }
  page = await context.newPage();
  const initialResponse = await page.goto(entry);
  assert.equal(initialResponse.status(), 200);
  await loaded(page);
  const initial = await read(page);
  assert.equal(initial.tiles.length, 0, 'a new profile never receives a personal seed board');
  assert.match(initial.id, /^[0-9a-f-]{36}$/i);
  assert.equal(await page.locator('#empty-state').isVisible(), true);
  assert.equal(await page.locator('#header-panel').isHidden(), true);
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  assert.match(csp, /connect-src\s+'none'/);
  assert.match(csp, /object-src\s+'none'/);
  assert.match(csp, /base-uri\s+'none'/);
  assert.match(csp, /form-action\s+'none'/);
  assert.equal(await page.locator('meta[name="referrer"]').getAttribute('content'), 'no-referrer');
  syntheticPng = Buffer.from(await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2; canvas.height = 2;
    const context = canvas.getContext('2d');
    context.fillStyle = '#f79052'; context.fillRect(0, 0, 2, 2);
    return canvas.toDataURL('image/png').split(',')[1];
  }), 'base64');
  passed('fresh profile starts empty with network-disabled CSP');

  for (let index = 1; index <= 8; index++) await addSite(page, `Synthetic site ${index}`, `https://example.com/local-test/${index}`, index === 1 ? syntheticPng : undefined);
  assert.equal((await read(page)).tiles.length, 8);
  assert.equal(await page.locator('.tile-link').first().getAttribute('target'), '_self');
  await page.waitForFunction(() => document.querySelector('.tile img')?.naturalWidth === 2);
  let document = await backup(page);
  assert.equal(document.images.length, 1);
  assert.equal(document.images[0].data, syntheticPng.toString('base64'), 'export preserves exact original image bytes');
  await page.reload();
  await loaded(page);
  await page.waitForFunction(() => document.querySelector('.tile img')?.naturalWidth === 2);
  assert.deepEqual(semanticBackup(await backup(page)), semanticBackup(document));
  if (diagnostics) {
    await page.screenshot({ path: path.join(diagnostics, 'local-board.png'), fullPage: true });
    await openSettings(page);
    await page.screenshot({ path: path.join(diagnostics, 'local-settings.png'), fullPage: true });
    await page.locator('#settings-dialog [data-close]').first().click();
  }
  passed('eight links and uploaded image bytes persist across reload');

  const rasterCodecs = await page.evaluate(async () => {
    const store = await SpeedialStorage.createStore({ databaseName: 'speedial-acceptance-codecs' });
    const accepted = [];
    try {
      for (const type of ['image/png', 'image/jpeg', 'image/webp']) {
        const canvas = document.createElement('canvas');
        canvas.width = 3; canvas.height = 2;
        canvas.getContext('2d').fillRect(0, 0, 3, 2);
        const data = canvas.toDataURL(type);
        if (!data.startsWith(`data:${type};`)) continue;
        const state = await store.read();
        await store.request('/api/tiles', { method: 'POST', body: { revision: state.revision, title: type, url: 'https://example.org/image-codec', image: data } });
        const exported = JSON.parse(await store.exportBackup());
        const image = exported.images.find(value => value.type === type);
        if (image?.data !== data.split(',')[1]) throw new Error(`Image bytes changed for ${type}`);
        accepted.push(type);
      }
      return accepted;
    } finally { store.close(); }
  });
  assert.ok(rasterCodecs.includes('image/png') && rasterCodecs.includes('image/jpeg'), 'standard browser raster encoders pass header and actual decode validation');
  passed(`browser-produced raster files round-trip exact bytes (${rasterCodecs.join(', ')})`);

  for (const locale of ['ru', 'de', 'fr', 'es', 'en']) {
    await openSettings(page);
    await page.locator('#language').selectOption(locale);
    await page.locator('#save-settings').click();
    await waitClosed(page, 'settings-dialog');
    await page.reload();
    await loaded(page);
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    assert.equal(await page.locator('#header-panel').isHidden(), true);
    const strings = await page.evaluate(language => ({
      expected: SpeedDialI18n.translate(language, 'showControls'),
      actual: document.getElementById('header-toggle').getAttribute('aria-label'),
    }), locale);
    assert.equal(strings.actual, strings.expected);
    assert.deepEqual(semanticBackup(await backup(page)), semanticBackup(document), 'changing language preserves links, screenshots and board settings');
  }
  passed('five languages persist without changing board data');

  await openSettings(page);
  await page.locator('#layout-rows').fill('2');
  await page.locator('#layout-columns').fill('3');
  await page.locator('#open-links-in').selectOption('new-window');
  await page.locator('#save-settings').click();
  await waitClosed(page, 'settings-dialog');
  assert.equal(await page.locator('#grid .tile').count(), 6);
  assert.equal((await read(page)).tiles.length, 8);
  assert.equal(await page.locator('.tile-link').first().getAttribute('target'), '_blank');
  await page.locator('#next-page').click();
  assert.equal(await page.locator('#grid .tile').count(), 2);
  await page.reload();
  await loaded(page);
  assert.equal(await page.locator('#grid .tile').count(), 6);
  assert.deepEqual((await read(page)).layout, { rows: 2, columns: 3 });
  await openSettings(page);
  await page.locator('#layout-rows').fill('4');
  await page.locator('#layout-columns').fill('5');
  await page.locator('#open-links-in').selectOption('same-window');
  await page.locator('#save-settings').click();
  await waitClosed(page, 'settings-dialog');
  passed('rows, columns and link target persist without discarding hidden tiles');

  const before = await ids(page);
  const source = await page.locator('.tile').nth(1).boundingBox();
  const destination = await page.locator('.tile').nth(6).boundingBox();
  const start = { x: source.x + 40, y: source.y + 60 };
  const drop = { x: destination.x + 55, y: destination.y + 70 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(drop.x, drop.y, { steps: 12 });
  const ghost = await page.locator('.drag-preview').boundingBox();
  assert.ok(ghost, 'drag preview follows the pointer');
  assert.ok(Math.abs(ghost.x - (drop.x - 40)) < 2 && Math.abs(ghost.y - (drop.y - 60)) < 2, 'preview keeps the pointer offset');
  assert.deepEqual(await ids(page), before, 'grid tiles stay fixed until the drop');
  await page.mouse.up();
  await page.waitForFunction(id => document.querySelectorAll('#grid .tile')[6]?.dataset.id === id, before[1]);
  const swapped = [...before];
  [swapped[1], swapped[6]] = [swapped[6], swapped[1]];
  assert.deepEqual(await ids(page), swapped, 'only source and target swap');
  assert.equal(await page.locator('.drag-preview').count(), 0);
  assert.equal(page.url(), entry, 'dragging a link does not navigate');
  await page.reload();
  await loaded(page);
  assert.deepEqual(await ids(page), swapped);
  passed('pointer preview and pair-only swapping persist across reload');

  const unsafeTitle = '<img src="https://example.org/leak" onerror="alert(1)"> {name}';
  await editTile(page);
  await page.locator('#tile-title').fill(unsafeTitle);
  await page.locator('#save-tile').click();
  await waitClosed(page, 'editor-dialog');
  assert.equal((await read(page)).tiles[0].title, unsafeTitle);
  assert.equal(await page.locator('img[src="https://example.org/leak"]').count(), 0);
  assert.ok((await page.locator('.tile-link').first().getAttribute('aria-label')).includes(unsafeTitle));
  const safeState = await fingerprint(page);
  for (const url of ['javascript:alert(1)', 'data:text/html,unsafe', 'https://user:password@example.org/', 'file:///etc/passwd']) {
    await editTile(page);
    await page.locator('#tile-url').fill(url);
    await page.locator('#save-tile').click();
    await page.locator('#editor-error').waitFor({ state: 'visible' });
    await page.locator('#editor-dialog [data-close]').first().click();
    assert.deepEqual(await fingerprint(page), safeState, `invalid URL cannot alter the board: ${url}`);
  }
  passed('untrusted titles remain text and unsafe URLs cannot change the board');

  const deletedId = (await read(page)).tiles[7].id;
  await editTile(page, 7);
  await page.locator('#delete-tile').click();
  await page.locator('#delete-form button[type="submit"]').click();
  await waitClosed(page, 'editor-dialog');
  assert.equal((await read(page)).tiles.some(tile => tile.id === deletedId), false);
  await addSite(page, 'Replacement synthetic site', 'https://example.org/replacement');
  assert.equal((await read(page)).tiles.length, 8);
  passed('editing, deletion and replacement keep the remaining tiles intact');

  const isolatedContext = await makeContext();
  const isolatedPage = await isolatedContext.newPage();
  const sharedLookingUrl = new URL(entry);
  sharedLookingUrl.hash = `board=${initial.id}`;
  await isolatedPage.goto(sharedLookingUrl.href);
  await loaded(isolatedPage);
  const isolated = await read(isolatedPage);
  assert.notEqual(isolated.id, initial.id, 'each browser profile creates its own ID');
  assert.equal(isolated.tiles.length, 0, 'copying another profile ID does not reveal its board');
  assert.equal((await backup(isolatedPage)).images.length, 0);
  const ownerImageUrl = (await read(page)).tiles.find(tile => tile.image).image;
  const foreignImageReadable = await isolatedPage.evaluate(async url => {
    const image = new Image();
    image.src = url;
    try { await image.decode(); return true; } catch { return false; }
  }, ownerImageUrl);
  assert.equal(foreignImageReadable, false, 'another browser profile cannot resolve an owner Blob URL either');
  await addSite(isolatedPage, 'Other visitor', 'https://example.net/other-visitor');
  assert.equal((await read(page)).tiles.some(tile => tile.title === 'Other visitor'), false);
  assert.equal((await read(isolatedPage)).tiles.length, 1);
  passed('independent browser profiles cannot read each other by URL or board ID');

  await openSettings(page);
  await page.locator('#language').selectOption('fr');
  await page.locator('#save-settings').click();
  await waitClosed(page, 'settings-dialog');
  await openControls(page);
  const downloadReady = page.waitForEvent('download');
  await page.locator('#export-data').click();
  const download = await downloadReady;
  assert.match(download.suggestedFilename(), /^speedial-backup-.*\.json$/);
  const exportedText = await fs.readFile(await download.path(), 'utf8');
  document = JSON.parse(exportedText);
  assert.equal(document.locale, 'fr', 'full backup includes the selected language');
  assert.equal(document.images[0].data, syntheticPng.toString('base64'));
  const importContext = await makeContext();
  const importPage = await importContext.newPage();
  await importPage.goto(entry);
  await loaded(importPage);
  const importedInitial = await read(importPage);
  await openControls(importPage);
  await importPage.locator('#backup-file').setInputFiles({ name: 'synthetic-backup.json', mimeType: 'application/json', buffer: Buffer.from(exportedText) });
  await importPage.locator('#import-dialog').waitFor({ state: 'visible' });
  assert.equal((await read(importPage)).tiles.length, 0, 'inspecting a backup does not import it yet');
  await importPage.locator('#confirm-import').click();
  await waitClosed(importPage, 'import-dialog');
  assert.equal(await importPage.locator('html').getAttribute('lang'), 'fr');
  await importPage.waitForFunction(() => document.querySelector('.tile img')?.naturalWidth === 2);
  assert.deepEqual(semanticBackup(await backup(importPage)), semanticBackup(document));
  assert.equal((await read(importPage)).id, importedInitial.id, 'import preserves the destination local identity');
  assert.ok((await read(importPage)).tiles.every(tile => !document.board.tiles.some(original => original.id === tile.id)), 'import regenerates tile identities');
  await importPage.reload();
  await loaded(importPage);
  assert.equal(await importPage.locator('html').getAttribute('lang'), 'fr', 'imported language survives reload');
  assert.deepEqual(semanticBackup(await backup(importPage)), semanticBackup(document));
  passed('full backup imports exact image bytes into a fresh profile after confirmation');

  const maliciousDocuments = [];
  const attack = (name, mutate) => { const value = structuredClone(document); mutate(value); maliciousDocuments.push([name, JSON.stringify(value)]); };
  maliciousDocuments.push(['truncated JSON', '{"format":']);
  attack('script URL', value => { value.board.tiles[0].url = 'javascript:alert(1)'; });
  attack('remote image URL', value => { value.board.tiles[0].image = 'https://example.org/leak.png'; });
  attack('SVG image', value => { value.images[0].type = 'image/svg+xml'; value.images[0].data = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>').toString('base64'); });
  attack('invalid raster bytes', value => { value.images[0].data = Buffer.from('not an image').toString('base64'); });
  attack('duplicate tile ID', value => { value.board.tiles[1].id = value.board.tiles[0].id; });
  attack('unsupported schema', value => { value.version = 999; });
  attack('unknown board key', value => { value.board.remote = 'https://example.org/'; });
  maliciousDocuments.push(['prototype key', exportedText.replace('"version":1', '"version":1,"__proto__":{"polluted":true}')]);
  const beforeAttacks = await fingerprint(importPage);
  for (const [name, text] of maliciousDocuments) {
    const result = await importPage.evaluate(async input => {
      try {
        const prepared = await acceptanceStore.inspectBackup(input);
        await acceptanceStore.importBackup(prepared, { revision: (await acceptanceStore.read()).revision, mode: 'replace' });
        return { accepted: true };
      } catch (error) { return { code: error.code, status: error.status }; }
    }, text);
    assert.deepEqual(result, { code: 'INVALID_BACKUP', status: 400 }, `${name} is rejected`);
    assert.deepEqual(await fingerprint(importPage), beforeAttacks, `${name} cannot partially replace the board`);
  }
  await openControls(importPage);
  await importPage.locator('#backup-file').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await importPage.waitForFunction(() => document.getElementById('toast').classList.contains('is-error') && !document.getElementById('toast').hidden);
  assert.equal(await importPage.locator('#import-dialog').isVisible(), false);
  assert.deepEqual(await fingerprint(importPage), beforeAttacks);
  passed('malformed, remote-image and executable backups are rejected atomically');

  const secondTab = await context.newPage();
  await secondTab.goto(entry);
  await loaded(secondTab);
  const beforeRace = await read(page);
  assert.equal((await read(secondTab)).id, beforeRace.id, 'tabs in one profile share the same local board');
  const race = (target, title) => target.evaluate(async input => {
    globalThis.acceptanceStore ||= await SpeedialStorage.createStore();
    try {
      await acceptanceStore.request('/api/tiles', { method: 'POST', body: { revision: input.revision, title: input.title, url: `https://example.net/${input.title}` } });
      return { winner: input.title };
    } catch (error) { return { code: error.code, status: error.status }; }
  }, { revision: beforeRace.revision, title });
  const raced = await Promise.all([race(page, 'race-first'), race(secondTab, 'race-second')]);
  const winners = raced.filter(result => result.winner);
  assert.equal(winners.length, 1);
  assert.deepEqual(raced.filter(result => !result.winner), [{ code: 'REVISION_CONFLICT', status: 409 }]);
  const afterRace = await read(page);
  assert.equal(afterRace.revision, beforeRace.revision + 1);
  assert.equal(afterRace.tiles.length, beforeRace.tiles.length + 1);
  assert.equal(afterRace.tiles.filter(tile => tile.title.startsWith('race-')).length, 1);
  await secondTab.waitForFunction(title => [...document.querySelectorAll('.tile-link')].some(link => link.getAttribute('aria-label').includes(title)), winners[0].winner);
  await page.waitForFunction(title => [...document.querySelectorAll('.tile-link')].some(link => link.getAttribute('aria-label').includes(title)), winners[0].winner);
  assert.deepEqual(semanticBackup(await backup(secondTab)), semanticBackup(await backup(page)));
  passed('concurrent tabs serialize writes and reject stale revisions without data loss');

  await openSettings(page);
  await page.locator('#layout-rows').fill('3');
  const concurrent = await read(secondTab);
  await secondTab.evaluate(async revision => acceptanceStore.request('/api/settings', { method: 'PUT', body: { revision, rows: 4, columns: 4, openLinksIn: 'same-window' } }), concurrent.revision);
  await page.waitForFunction(() => document.getElementById('grid').style.getPropertyValue('--columns') === '4' || getComputedStyle(document.getElementById('grid')).gridTemplateColumns.split(' ').length === 4);
  await page.locator('#save-settings').click();
  await page.locator('#settings-error').waitFor({ state: 'visible' });
  assert.deepEqual((await read(page)).layout, { rows: 4, columns: 4 });
  assert.equal(await page.locator('#layout-rows').inputValue(), '3');
  assert.equal(await page.locator('#layout-columns').inputValue(), '4');
  await page.locator('#save-settings').click();
  await waitClosed(page, 'settings-dialog');
  assert.deepEqual((await read(page)).layout, { rows: 3, columns: 4 });
  passed('stale settings require explicit retry while preserving another tab’s changes');

  const beforeQuota = await fingerprint(importPage);
  const quota = await importPage.evaluate(async () => {
    const prepared = await acceptanceStore.inspectBackup(await acceptanceStore.exportBackup());
    const state = await acceptanceStore.read();
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function () { throw new DOMException('Synthetic quota failure', 'QuotaExceededError'); };
    const attempt = async operation => {
      try { await operation(); return { accepted: true }; }
      catch (error) { return { code: error.code, status: error.status }; }
    };
    try {
      return {
        settings: await attempt(() => acceptanceStore.request('/api/settings', { method: 'PUT', body: { revision: state.revision, rows: 1, columns: 1, openLinksIn: 'same-window' } })),
        // Import clears the previous image records before writing replacements.
        // A failing replacement must roll back that clear in the same transaction.
        import: await attempt(() => acceptanceStore.importBackup(prepared, { revision: state.revision, mode: 'replace' })),
      };
    }
    finally { IDBObjectStore.prototype.put = original; }
  });
  assert.deepEqual(quota, { settings: { code: 'QUOTA_EXCEEDED', status: 507 }, import: { code: 'QUOTA_EXCEEDED', status: 507 } });
  assert.deepEqual(await fingerprint(importPage), beforeQuota);
  passed('quota failures roll back the write and preserve the prior board');

  const blockedContext = await makeContext(() => {
    Object.defineProperty(globalThis, 'indexedDB', { get() { throw new DOMException('Synthetic blocked storage', 'SecurityError'); } });
  });
  const blockedPage = await blockedContext.newPage();
  await blockedPage.goto(entry);
  await blockedPage.locator('#load-error').waitFor({ state: 'visible' });
  assert.equal(await blockedPage.locator('#grid .tile').count(), 0);
  assert.ok((await blockedPage.locator('#load-error-message').innerText()).trim());
  const unavailable = await blockedPage.evaluate(async () => {
    try { await SpeedialStorage.createStore(); return { accepted: true }; }
    catch (error) { return { code: error.code, status: error.status }; }
  });
  assert.deepEqual(unavailable, { code: 'STORAGE_UNAVAILABLE', status: 503 });
  passed('unavailable IndexedDB is reported instead of pretending data was saved');

  assert.deepEqual(errors, [], 'no uncaught browser JavaScript errors');
  assert.deepEqual(cspViolations, [], 'the real page CSP allows required app operations without exceptions');
  assert.deepEqual(forbidden, [], 'local data never triggers API or cross-origin requests');
  assert.ok(requests.length > 0, 'network observer actually saw the app load');
  assert.ok(requests.every(request => ['GET', 'HEAD'].includes(request.method)), 'the static app never uploads browser data');
  passed('all editing, images, import and export complete without network writes');

  const applicationFiles = Object.fromEntries(await Promise.all(files.map(async name => [`dist/local/${name}`, createHash('sha256').update(await fs.readFile(path.join(root, 'dist/local', name))).digest('hex')])));
  const evidence = { ...(runtime || {}), testsPassed: scenarios.length, testsFailed: 0, scenarios, applicationFiles, staticOrigin: origin, observedRequests: requests.length };
  if (compatibility) {
    let previous;
    try { previous = JSON.parse(await fs.readFile(process.env.CI_BROWSER_EVIDENCE, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const originalScenarios = previous?.scenarios.filter(name => !name.startsWith('Local:'));
    const combined = previous ? {
      ...previous,
      testsPassed: originalScenarios.length + scenarios.length,
      testsFailed: previous.testsFailed,
      scenarios: [...originalScenarios, ...scenarios],
      applicationFiles: { ...previous.applicationFiles, ...applicationFiles },
      localBrowser: evidence,
    } : evidence;
    await fs.writeFile(process.env.CI_BROWSER_EVIDENCE, JSON.stringify(combined, null, 2) + '\n');
  }
  if (diagnostics) await fs.writeFile(path.join(diagnostics, 'local-browser-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  console.log(`Local browser acceptance passed: ${scenarios.length} scenarios, ${engine}, isolated profiles, exact image backup, atomic conflicts and no uploads.`);
} catch (error) {
  if (diagnostics && page) {
    await fs.mkdir(diagnostics, { recursive: true });
    await page.screenshot({ path: path.join(diagnostics, 'local-frontend-failure.png'), fullPage: true }).catch(() => {});
  }
  throw error;
} finally {
  if (tracedContext) await tracedContext.tracing.stop({ path: path.join(diagnostics, 'local-trace.zip') }).catch(() => {});
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
