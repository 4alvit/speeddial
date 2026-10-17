import { createFixture, syntheticPng } from './fixtures.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
const require = createRequire(import.meta.url);
const compatibility = Boolean(process.env.CI_PLAYWRIGHT_MODULE);
const playwright = compatibility ? require(process.env.CI_PLAYWRIGHT_MODULE) : await import('playwright-core');
const engine = process.env.CI_BROWSER_ENGINE || 'chromium';
const channel = process.env.CI_BROWSER_CHANNEL || '';
const diagnostics = process.env.CI_BROWSER_DIAGNOSTICS || process.env.SMOKE_ARTIFACT_DIR;
const runtime = compatibility ? JSON.parse(await fs.readFile(path.join(diagnostics, 'runtime.json'), 'utf8')) : null;
import '../public/i18n.js';

// Never touches a deployed board: source is copied to an isolated temporary
// server with synthetic bookmarks, its own database, and a screenshot adapter.
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'speeddial-browser-'));
const png = syntheticPng;
const fixture = createFixture(dir);
const i18n = globalThis.SpeedDialI18n;
let child, browser, context, page, base;
const scenarios = [], unexpected = [];
const passed = name => { scenarios.push(name); console.log(`PASS ${name}`); };
const errors = [];
let serverErrors = '';
try {
  await Promise.all(['server.mjs', 'safe-proxy.mjs', 'access.mjs', 'initial-state.mjs'].map(name => fs.copyFile(path.join(root, name), path.join(dir, name))));
  await fs.cp(path.join(root, 'public'), path.join(dir, 'public'), { recursive: true, dereference: false });
  await fs.writeFile(path.join(dir, 'screenshot.mjs'), `export async function capture() { return Buffer.from('${png.toString('base64')}', 'base64'); }\n`);
  child = spawn(process.execPath, [path.join(dir, 'server.mjs')], {
    env: { PORT: '0', ...fixture.env }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', value => { serverErrors += value.toString(); });
  base = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Fixture server startup timed out')), 10000);
    let stdout = '';
    child.on('error', error => { clearTimeout(timeout); reject(error); });
    child.on('exit', code => { clearTimeout(timeout); reject(new Error(`Fixture server exited ${code}: ${serverErrors}`)); });
    child.stdout.on('data', value => {
      stdout += value;
      const match = /listening on (\d+)/.exec(stdout);
      if (match) { clearTimeout(timeout); resolve(`http://127.0.0.1:${match[1]}`); }
    });
  });
  browser = await playwright[engine].launch(compatibility
    ? { headless: true, ...(channel ? { channel } : {}) }
    : { headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  if (compatibility) {
    assert.equal(browser.browserType().name(), runtime.engine);
    assert.equal(browser.version(), runtime.browserVersion);
    assert.equal(require(path.join(process.env.CI_PLAYWRIGHT_MODULE, 'package.json')).version, runtime.playwrightVersion);
  }
  context = await browser.newContext({ viewport: { width: 1200, height: 800 }, serviceWorkers: 'block' });
  const confine = async route => {
    if (new URL(route.request().url()).origin === base) return route.continue();
    unexpected.push(route.request().url());
    return route.abort();
  };
  await context.route('**/*', confine);
  if (diagnostics) {
    await fs.mkdir(diagnostics, { recursive: true });
    await context.tracing.start({ screenshots: true, snapshots: true });
  }
  page = await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  let settingsWrites = 0;
  page.on('request', request => { if (request.url() === `${base}/api/settings` && request.method() === 'PUT') settingsWrites++; });
  const entry = base + fixture.entryPath;
  const board = async () => page.evaluate(async () => (await fetch('/api/state')).json());
  const ids = async () => page.locator('#grid .tile').evaluateAll(nodes => nodes.map(node => node.dataset.id));
  const loaded = async () => page.waitForFunction(() => document.querySelectorAll('#grid .tile').length === 20);
  const openSettings = async () => {
    if (await page.locator('#header-panel').isHidden()) await page.locator('#header-toggle').click();
    await page.locator('#open-settings').click();
  };
  assert.equal((await context.request.get(base)).status(), 404);
  assert.equal((await context.request.get(`${base}/api/state`)).status(), 404);
  await page.goto(entry);
  await loaded();
  assert.equal(await page.locator('#home-link').getAttribute('href'), fixture.entryPath);
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  assert.equal(await page.locator('#header-panel').isHidden(), true);
  assert.equal(await page.locator('.tile-link').first().getAttribute('target'), '_self');
  const initialBoard = await board();
  for (const locale of ['ru', 'de', 'fr', 'es', 'en']) {
    await openSettings();
    await page.locator('#language').selectOption(locale);
    await page.locator('#save-settings').click();
    await page.waitForFunction(value => document.documentElement.lang === value, locale);
    assert.equal(await page.locator('#toast-message').textContent(), i18n.translate(locale, 'settingsSaved'));
    assert.equal(await page.locator('#open-settings').innerText(), i18n.translate(locale, 'settings'));
    await page.reload();
    await loaded();
    assert.equal(await page.locator('html').getAttribute('lang'), locale);
    assert.equal(await page.locator('#header-panel').isHidden(), true, 'controls stay collapsed on every reload');
    assert.equal(await page.locator('#header-toggle').getAttribute('aria-label'), i18n.translate(locale, 'showControls'));
  }
  assert.equal(settingsWrites, 0, 'language-only changes must never write shared settings');
  assert.equal((await board()).revision, initialBoard.revision, 'language-only changes preserve board revision');

  passed('five locales persist locally without changing the shared board');

  // Settings validation and translated server errors do not expose English API text.
  await openSettings();
  await page.locator('#language').selectOption('es');
  await page.locator('#save-settings').click();
  await openSettings();
  await page.locator('#layout-rows').fill('0');
  await page.locator('#save-settings').click();
  assert.equal(await page.locator('#settings-error').innerText(), i18n.translate('es', 'invalidDimensions'));
  await page.locator('#settings-dialog [data-close]').first().click();
  await page.locator('#add-tile').click();
  await page.locator('#save-tile').click();
  assert.equal(await page.locator('#editor-error').innerText(), i18n.translate('es', 'invalidUrl'));
  await page.route(`${base}/api/tiles`, route => route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ code: 'INVALID_URL', error: 'An untranslated backend message' }) }));
  await page.locator('#tile-url').fill('https://example.com/');
  await page.locator('#save-tile').click();
  await page.waitForFunction(expected => document.getElementById('editor-error').textContent === expected, i18n.translate('es', 'invalidUrl'));
  assert.equal((await page.locator('#editor-error').innerText()).includes('backend'), false);
  await page.unroute(`${base}/api/tiles`);
  await page.locator('#editor-dialog [data-close]').first().click();

  passed('settings and server errors use the selected language');

  // Moving the second tile to the second slot on row two swaps exactly two IDs.
  const before = await ids();
  const firstBox = await page.locator('.tile').nth(1).boundingBox();
  const secondBox = await page.locator('.tile').nth(6).boundingBox();
  const start = { x: firstBox.x + 40, y: firstBox.y + 60 };
  const drop = { x: secondBox.x + 55, y: secondBox.y + 70 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(drop.x, drop.y, { steps: 12 });
  const ghost = await page.locator('.drag-preview').boundingBox();
  assert.ok(ghost, 'thumbnail follows the pointer');
  assert.ok(Math.abs(ghost.x - (drop.x - 40)) < 2 && Math.abs(ghost.y - (drop.y - 60)) < 2, 'drag preview preserves pointer offset');
  assert.deepEqual(await ids(), before, 'all grid slots stay fixed during drag');
  const orderResponse = page.waitForResponse(response => response.url() === `${base}/api/order` && response.request().method() === 'PUT');
  await page.mouse.up();
  assert.equal((await orderResponse).status(), 200);
  await page.waitForFunction(id => document.querySelectorAll('#grid .tile')[6]?.dataset.id === id, before[1]);
  const expected = [...before];
  [expected[1], expected[6]] = [expected[6], expected[1]];
  assert.deepEqual(await ids(), expected);
  assert.equal(await page.locator('.drag-preview').count(), 0);
  assert.equal(page.url(), entry, 'dropping a dragged link never navigates');

  passed('pointer dragging previews and swaps exactly two tiles');

  // Keyboard swapping and Escape cancellation preserve the same pair-only model.
  const firstHandle = page.locator(`.tile[data-id="${expected[0]}"] .drag-handle`);
  await firstHandle.focus();
  const keyboardResponse = page.waitForResponse(response => response.url() === `${base}/api/order` && response.request().method() === 'PUT');
  await firstHandle.press('ArrowRight');
  await keyboardResponse;
  [expected[0], expected[1]] = [expected[1], expected[0]];
  await page.waitForFunction(id => document.querySelectorAll('#grid .tile')[1]?.dataset.id === id, expected[1]);
  assert.deepEqual(await ids(), expected);
  assert.match(await page.locator('#announcer').textContent(), /Posiciones intercambiadas/);
  const cancelBox = await page.locator('.tile').first().boundingBox();
  await page.mouse.move(cancelBox.x + 40, cancelBox.y + 50);
  await page.mouse.down();
  await page.mouse.move(cancelBox.x + 60, cancelBox.y + 70);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  assert.equal(await page.locator('.drag-preview').count(), 0);
  assert.deepEqual(await ids(), expected);

  passed('keyboard swapping and Escape preserve the pair-only model');

  // Shared settings paginate without deleting tiles; navigation target persists.
  await openSettings();
  await page.locator('#layout-rows').fill('2');
  await page.locator('#layout-columns').fill('3');
  await page.locator('#open-links-in').selectOption('new-window');
  await page.locator('#save-settings').click();
  await page.waitForFunction(() => document.querySelectorAll('#grid .tile').length === 6);
  assert.equal((await board()).tiles.length, 20);
  assert.equal(await page.locator('#page-status').textContent(), i18n.translate('es', 'pageStatus', { page: 1, total: 4 }));
  assert.equal(await page.locator('.tile-link').first().getAttribute('target'), '_blank');
  await page.locator('#next-page').click();
  assert.deepEqual(await ids(), expected.slice(6, 12));
  await page.reload();
  await page.waitForFunction(() => document.querySelectorAll('#grid .tile').length === 6);
  assert.equal(await page.locator('.tile-link').first().getAttribute('target'), '_blank');
  await openSettings();
  await page.locator('#layout-rows').fill('4');
  await page.locator('#layout-columns').fill('5');
  await page.locator('#open-links-in').selectOption('same-window');
  await page.locator('#save-settings').click();
  await loaded();

  passed('pagination and link targets persist without losing tiles');

  // Another browser may update the board while settings are open. Choosing a
  // language alone must neither reset its grid nor make a shared settings PUT.
  await openSettings();
  let concurrentBoard = await board();
  const externalLayout = await context.request.put(`${base}/api/settings`, { data: { rows: 2, columns: 4, openLinksIn: 'same-window', revision: concurrentBoard.revision } });
  assert.equal(externalLayout.status(), 200);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(() => document.querySelectorAll('#grid .tile').length === 8);
  const writesBeforeLanguage = settingsWrites;
  await page.locator('#language').selectOption('de');
  await page.locator('#save-settings').click();
  assert.equal(settingsWrites, writesBeforeLanguage);
  assert.deepEqual((await board()).layout, { rows: 2, columns: 4 });
  await openSettings();
  await page.locator('#layout-rows').fill('4');
  await page.locator('#layout-columns').fill('5');
  await page.locator('#save-settings').click();
  await loaded();

  passed('local language changes preserve concurrent board settings');

  // A real settings edit uses the form's captured revision, keeping a newer
  // external column change intact until the user explicitly retries.
  await openSettings();
  await page.locator('#layout-rows').fill('3');
  concurrentBoard = await board();
  assert.equal((await context.request.put(`${base}/api/settings`, { data: { rows: 4, columns: 4, revision: concurrentBoard.revision } })).status(), 200);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(() => document.querySelectorAll('#grid .tile').length === 16);
  const conflictResponse = page.waitForResponse(response => response.url() === `${base}/api/settings` && response.status() === 409);
  await page.locator('#save-settings').click();
  await conflictResponse;
  await page.waitForFunction(expectedText => document.getElementById('settings-error').textContent === expectedText, i18n.translate('de', 'formConflict'));
  assert.deepEqual((await board()).layout, { rows: 4, columns: 4 });
  assert.equal(await page.locator('#layout-rows').inputValue(), '3');
  assert.equal(await page.locator('#layout-columns').inputValue(), '4');
  await page.locator('#save-settings').click();
  await page.waitForFunction(() => document.querySelectorAll('#grid .tile').length === 12);
  assert.deepEqual((await board()).layout, { rows: 3, columns: 4 });
  await openSettings();
  await page.locator('#layout-rows').fill('4');
  await page.locator('#layout-columns').fill('5');
  await page.locator('#save-settings').click();
  await loaded();

  passed('settings conflicts require an explicit retry');

  // A delayed GET started during an in-flight PUT cannot roll the UI back
  // after the PUT returns. No arbitrary sleep is needed to order responses.
  const staleBoard = await board();
  let releasePut, releaseGet, sawPut, sawGet;
  const putReady = new Promise(resolve => { sawPut = resolve; });
  const getReady = new Promise(resolve => { sawGet = resolve; });
  const putGate = new Promise(resolve => { releasePut = resolve; });
  const getGate = new Promise(resolve => { releaseGet = resolve; });
  await page.route(`${base}/api/settings`, async route => { sawPut(); await putGate; await route.continue(); });
  await openSettings();
  await page.locator('#layout-rows').fill('2');
  const freshPut = page.waitForResponse(response => response.url() === `${base}/api/settings` && response.status() === 200);
  await page.locator('#save-settings').click();
  await putReady;
  await page.route(`${base}/api/state`, async route => { sawGet(); await getGate; await route.fulfill({ contentType: 'application/json', body: JSON.stringify(staleBoard) }); });
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await getReady;
  releasePut();
  await freshPut;
  await page.waitForFunction(() => document.querySelectorAll('#grid .tile').length === 10);
  const staleGet = page.waitForResponse(response => response.url() === `${base}/api/state`);
  releaseGet();
  const staleResponse = await staleGet;
  await staleResponse.finished();
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  assert.equal(await page.locator('#grid .tile').count(), 10);
  await page.unroute(`${base}/api/state`);
  await page.unroute(`${base}/api/settings`);
  await openSettings();
  await page.locator('#layout-rows').fill('4');
  await page.locator('#save-settings').click();
  await loaded();

  passed('late state reads cannot roll back a successful write');

  // Editing a title cannot silently restore a URL changed in another tab.
  const editedId = (await ids())[0];
  await page.locator('.tile').first().hover();
  await page.locator('.tile').first().locator('.tile-tools button').last().click();
  await page.locator('#tile-title').fill('Locally edited title');
  concurrentBoard = await board();
  const externalUrl = 'https://example.org/updated';
  assert.equal((await context.request.patch(`${base}/api/tiles/${editedId}`, { data: { url: externalUrl, revision: concurrentBoard.revision } })).status(), 200);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(url => document.querySelector('.tile-link').href === url, externalUrl);
  const editConflict = page.waitForResponse(response => response.url() === `${base}/api/tiles/${editedId}` && response.status() === 409);
  await page.locator('#save-tile').click();
  await editConflict;
  await page.waitForFunction(expectedText => document.getElementById('editor-error').textContent === expectedText, i18n.translate('de', 'formConflict'));
  assert.equal(await page.locator('#tile-url').inputValue(), externalUrl);
  assert.equal(await page.locator('#tile-title').inputValue(), 'Locally edited title');
  await page.locator('#save-tile').click();
  await page.waitForFunction(() => !document.getElementById('editor-dialog').open);
  const editedTile = (await board()).tiles.find(tile => tile.id === editedId);
  assert.equal(editedTile.url, externalUrl);
  assert.equal(editedTile.title, 'Locally edited title');

  passed('tile editing preserves concurrent URL changes');

  // Long translations fit mobile dialogs; fixed columns remain horizontally scrollable.
  await page.setViewportSize({ width: 360, height: 740 });
  for (const locale of ['de', 'fr', 'ru', 'es', 'en']) {
    await openSettings();
    await page.locator('#language').selectOption(locale);
    await page.locator('#save-settings').click();
    await openSettings();
    assert.equal(await page.locator('#settings-dialog').evaluate(node => node.scrollWidth <= node.clientWidth + 1), true, `${locale} mobile dialog fits`);
    assert.equal(await page.locator('#settings-title').textContent(), i18n.translate(locale, 'settings'));
    await page.locator('#settings-dialog [data-close]').first().click();
  }
  assert.equal(await page.locator('#grid-viewport').evaluate(node => node.scrollWidth > node.clientWidth), true);

  passed('five mobile translations fit while the board remains scrollable');

  // Unsupported storage and blocked storage recover without losing access.
  await page.evaluate(() => localStorage.setItem('speeddial.language', '{broken}'));
  await page.reload();
  await loaded();
  assert.equal(await page.locator('html').getAttribute('lang'), 'en');
  const blockedContext = await browser.newContext({ serviceWorkers: 'block' });
  await blockedContext.route('**/*', confine);
  await blockedContext.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
  const blockedPage = await blockedContext.newPage();
  blockedPage.on('pageerror', error => errors.push(error.message));
  await blockedPage.goto(entry);
  await blockedPage.waitForSelector('.tile');
  assert.equal(await blockedPage.locator('html').getAttribute('lang'), 'en');
  await blockedPage.locator('#header-toggle').click();
  await blockedPage.locator('#open-settings').click();
  await blockedPage.locator('#language').selectOption('fr');
  await blockedPage.locator('#save-settings').click();
  assert.equal(await blockedPage.locator('html').getAttribute('lang'), 'fr');
  assert.equal(await blockedPage.locator('#toast-message').textContent(), i18n.translate('fr', 'storageUnavailable'));
  await blockedContext.close();

  passed('invalid and unavailable storage retain usable controls');

  // An image upload advances the editor's own revision while retaining dirty
  // fields, so the following normal Save must not report a stale-form conflict.
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.locator('.tile').first().hover();
  await page.locator('.tile').first().locator('.tile-tools button').last().click();
  await page.locator('#tile-title').fill('Unsaved title before upload');
  const uploadResponse = page.waitForResponse(response => response.url().endsWith(`/api/tiles/${editedId}/image`) && response.request().method() === 'POST');
  await page.locator('#image-file').setInputFiles({ name: 'upload.png', mimeType: 'image/png', buffer: png });
  assert.equal((await uploadResponse).status(), 200);
  await page.waitForFunction(() => !document.getElementById('editor-form').hasAttribute('aria-busy'));
  assert.equal(await page.locator('#tile-title').inputValue(), 'Unsaved title before upload');
  await page.locator('#tile-title').fill('Title saved after upload');
  const saveAfterUpload = page.waitForResponse(response => response.url().endsWith(`/api/tiles/${editedId}`) && response.request().method() === 'PATCH');
  await page.locator('#save-tile').click();
  assert.equal((await saveAfterUpload).status(), 200, 'own image upload must not stale the edit form');
  await page.waitForFunction(() => !document.getElementById('editor-dialog').open);
  assert.equal((await board()).tiles.find(tile => tile.id === editedId).title, 'Title saved after upload');

  passed('image upload preserves unsaved fields and the current revision');

  // Untrusted titles are rendered as text in tooltips and accessible names.
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.locator('.tile').first().hover();
  await page.locator('.tile').first().locator('.tile-tools button').last().click();
  const unsafeName = '<img src=x onerror=alert(1)> {name}';
  await page.locator('#tile-title').fill(unsafeName);
  await page.locator('#save-tile').click();
  await page.waitForFunction(() => !document.getElementById('editor-dialog').open);
  assert.equal(await page.locator('img[src="x"]').count(), 0);
  assert.equal(await page.locator('.tile-link').first().getAttribute('aria-label'), i18n.translate('en', 'openSame', { name: unsafeName }));

  passed('untrusted titles remain text in labels and tooltips');

  // A normal click really stays in the same tab (the destination is intercepted).
  const destination = await page.locator('.tile-link').first().getAttribute('href');
  await page.route(destination, route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Local destination fixture</title>' }));
  const pagesBefore = context.pages().length;
  await page.locator('.tile-link').first().click({ position: { x: 40, y: 50 } });
  await page.waitForURL(destination);
  assert.equal(context.pages().length, pagesBefore);
  passed('ordinary tile clicks navigate in the same tab');
  assert.equal(scenarios.length, 14);
  assert.deepEqual(errors, [], 'no browser JavaScript errors');
  assert.deepEqual(unexpected, [], 'no unexpected outbound requests');
  if (compatibility) {
    const applicationFiles = Object.fromEntries(await Promise.all(['server.mjs', 'access.mjs', 'initial-state.mjs', 'public/index.html', 'public/app.js', 'public/i18n.js'].map(async name => [name, createHash('sha256').update(await fs.readFile(path.join(root, name))).digest('hex')])));
    await fs.writeFile(process.env.CI_BROWSER_EVIDENCE, JSON.stringify({ ...runtime, testsPassed: scenarios.length, testsFailed: 0, scenarios, applicationFiles }, null, 2) + '\n');
  }
  console.log('Frontend smoke passed: 5 locales, browser-only language persistence, translated validation, mobile layout, pair-only pointer/keyboard swap, drag preview, concurrent editing, stale-response protection, pagination, safe titles, and same-window links.');
} catch (error) {
  if (diagnostics && page) {
    await fs.mkdir(diagnostics, { recursive: true });
    await page.screenshot({ path: path.join(diagnostics, 'frontend-failure.png'), fullPage: true }).catch(() => {});
  }
  throw error;
} finally {
  if (context && diagnostics) await context.tracing.stop({ path: path.join(diagnostics, 'trace.zip') }).catch(() => {});
  await browser?.close();
  if (child && child.exitCode === null) { const exited = once(child, 'exit'); child.kill('SIGTERM'); await exited; }
  await fs.rm(dir, { recursive: true, force: true });
}
