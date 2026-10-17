import { createFixture, syntheticPng, syntheticTiles } from './fixtures.mjs';
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

// Prepare large request bytes before opening sockets: encoding must not stall
// this HTTP client's event loop long enough to reuse an expired keep-alive socket.
const oversizedImageBody = Buffer.from(JSON.stringify({ data: 'data:image/png;base64,' + Buffer.alloc(5 * 1024 * 1024 + 1).toString('base64') }));
const oversizedRequestBody = Buffer.from(JSON.stringify({ data: 'x'.repeat(8 * 1024 * 1024) }));

const data = fs.mkdtempSync(path.join(os.tmpdir(), 'speeddial-test-'));
const fixture = createFixture(data);
let child, base, accessCookie;
const cookies = (auth = true) => auth ? accessCookie || '' : '';
async function start() {
  child = spawn(process.execPath, ['server.mjs'], { cwd: new URL('..', import.meta.url),
    env: { PORT: '0', ...fixture.env, CHROMIUM_PATH: '/nonexistent-test-browser' }, stdio: ['ignore','pipe','pipe'] });
  base = await new Promise((resolve, reject) => {
    child.stdout.on('data', data => { const m = /listening on (\d+)/.exec(data); if (m) resolve(`http://127.0.0.1:${m[1]}`); });
    child.once('exit', code => reject(new Error(`server exited ${code}`)));
    child.once('error', reject);
  });
}
async function stop() { const done = once(child, 'exit'); child.kill('SIGTERM'); await done; }
async function request(route, method = 'GET', body, auth = true, headers = {}, { serializedBody } = {}) {
  try {
    const response = await fetch(base + route, { method, headers: { 'content-type':'application/json', cookie: cookies(auth), ...headers },
      ...(serializedBody !== undefined ? { body: serializedBody } : body ? { body: JSON.stringify(body) } : {}) });
    const content = await response.json(); return { response, content };
  } catch (error) {
    throw new Error(`${method} ${route.split('?')[0]} failed: ${error.message}`, { cause: error });
  }
}
before(start);
after(async () => { await stop(); fs.rmSync(data, { recursive: true, force: true }); });

test('entry query gates the page, API and images, including repeat visits and forged cookies', async () => {
  for (const route of ['/', '/index.html', '/?wrong', '/?access=wrong', '/?q=wrong',
    '/api/state', '/api/state?access=wrong', '/app.js', '/legacy/images/example.png']) {
    const response = await fetch(base + route);
    assert.equal(response.status, 404, route);
    assert.match(response.headers.get('cache-control'), /no-store/);
  }
  assert.equal((await fetch(base + '/api/state', { headers: { cookie: 'speeddial_view=9999999999999.fake.fake' } })).status, 404);
  const entry = await fetch(base + fixture.entryPath);
  assert.equal(entry.status, 200);
  assert.match(entry.headers.get('set-cookie'), /HttpOnly/);
  assert.match(entry.headers.get('cache-control'), /private, no-store/);
  accessCookie = entry.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(base + '/', { headers: { cookie: accessCookie } })).status, 404);
  assert.equal((await fetch(base + '/index.html', { headers: { cookie: accessCookie } })).status, 404);
  assert.equal((await fetch(base + '/api/state', { headers: { cookie: accessCookie } })).status, 200);
  assert.equal((await fetch(base + '/healthz')).status, 200);
});

test('imports synthetic example board; keyed access allows editing and rejects cross-site writes', async () => {
  let result = await request('/api/state');
  assert.equal(result.content.tiles.length, 20);
  assert.equal(result.content.authenticated, true);
  assert.equal((await fetch(base + result.content.tiles[0].image, { headers: { cookie: cookies() } })).status, 200);
  assert.equal((await fetch(base + '/legacy/source/speeddial.htm')).status, 404);
  assert.equal((await request('/api/tiles', 'POST', { url:'https://example.com' }, false)).response.status, 404);
  for (const endpoint of ['/api/login', '/api/logout'])
    assert.equal((await request(endpoint, 'POST', {})).response.status, 404, 'Retired authentication endpoints stay unavailable');
  assert.equal((await request('/api/state')).content.authenticated, true);
  assert.equal((await request('/api/tiles', 'POST', { url:'https://example.com' }, true, { Origin:'https://attacker.invalid' })).response.status, 403);
  assert.equal((await request('/api/tiles', 'POST', { url:'javascript:alert(1)' })).response.status, 400);
  assert.equal((await request('/api/tiles', 'POST', { url:'https://example.com' }, true, { 'Sec-Fetch-Site':'cross-site' })).response.status, 403);
  assert.equal((await request('/api/tiles', 'POST', { url:'https://example.com' }, true, { 'content-type':'text/plain' })).response.status, 415);
});

test('create, conflict, edit, image upload, full reorder, deletion and persistence', async () => {
  let result = await request('/api/tiles', 'POST', { title:'Example test', url:'https://example.com/' });
  assert.equal(result.response.status, 200);
  const created = result.content.tiles.at(-1);
  assert.equal(created.screenshotStatus, 'pending');
  const id = created.id;
  assert.equal((await request('/api/tiles/' + id, 'PATCH', { title:'bad revision', revision: -1 })).response.status, 409);
  result = await request('/api/tiles/' + id, 'PATCH', { title:'Updated test' });
  assert.equal(result.content.tiles.at(-1).title, 'Updated test');
  const image = syntheticPng;
  result = await request('/api/tiles/' + id + '/image', 'POST', { data:'data:image/png;base64,' + image.toString('base64') });
  const uploaded = result.content.tiles.at(-1);
  assert.equal(uploaded.screenshotStatus, 'ready');
  assert.equal((await fetch(base + uploaded.image, { headers: { cookie: cookies() } })).status, 200);
  assert.equal((await request('/api/tiles/' + id + '/image', 'POST', { data:'data:image/svg+xml;base64,' + Buffer.from('<svg/>').toString('base64') })).response.status, 400);
  let board = (await request('/api/state')).content;
  let ids = board.tiles.map(t => t.id).reverse();
  assert.equal((await request('/api/order', 'PUT', { ids: [id,id] })).response.status, 400);
  result = await request('/api/order', 'PUT', { ids, revision: board.revision });
  assert.equal(result.response.status, 200);
  assert.deepEqual(result.content.tiles.map(t => t.id), ids);
  await stop(); await start();
  board = (await request('/api/state')).content;
  assert.deepEqual(board.tiles.map(t => t.id), ids);
  assert.equal(board.authenticated, true, 'session survives restart');
  assert.equal(board.tiles[0].screenshotStatus, 'ready', 'uploaded image wins against pending capture');
  result = await request('/api/tiles/' + id, 'DELETE', { revision: board.revision });
  assert.equal(result.content.tiles.length, 20);
  assert.equal(result.content.tiles.some(t => t.id === id), false);
  assert.equal((await request('/api/export')).response.status, 200);
  assert.equal((await request('/api/logout', 'POST', {})).response.status, 404);
  assert.equal((await request('/api/state')).content.authenticated, true, 'Retired logout cannot revoke valid access');
});

test('API validation exposes stable translation codes and rejects oversized uploads without dropping the connection', async () => {
  const board = (await request('/api/state')).content;
  const id = board.tiles[0].id;
  const invalidRequests = [
    ['/api/tiles', 'POST', { url: 'file:///etc/passwd' }, 400, 'INVALID_URL'],
    ['/api/tiles', 'POST', { url: 'https://example.com', title: 123 }, 400, 'INVALID_TITLE'],
    ['/api/tiles', 'POST', { url: 'https://example.com', title: 'x'.repeat(301) }, 400, 'TITLE_TOO_LONG'],
    ['/api/settings', 'PUT', { rows: 0, columns: 5 }, 400, 'INVALID_LAYOUT'],
    ['/api/settings', 'PUT', { rows: 4, columns: 5, openLinksIn: '_blank' }, 400, 'INVALID_LINK_TARGET'],
    ['/api/order', 'PUT', { ids: [] }, 400, 'INVALID_ORDER'],
    ['/api/tiles/' + id, 'PATCH', { title: 'Old revision', revision: -1 }, 409, 'REVISION_CONFLICT'],
    ['/api/tiles/missing', 'DELETE', {}, 404, 'BOOKMARK_NOT_FOUND'],
    ['/api/tiles/' + id + '/image', 'POST', {}, 400, 'IMAGE_REQUIRED'],
    ['/api/tiles/' + id + '/image', 'POST', { data: 'data:image/svg+xml;base64,PHN2Zy8+' }, 400, 'IMAGE_TYPE_UNSUPPORTED'],
    ['/api/tiles/' + id + '/image', 'POST', { data: 'data:image/png;base64,AAAA' }, 400, 'INVALID_IMAGE_SIZE'],
    ['/api/tiles/' + id + '/image', 'POST', { data: 'data:image/png;base64,' + Buffer.alloc(16).toString('base64') }, 400, 'INVALID_IMAGE'],
    ['/api/tiles/' + id + '/image', 'POST', undefined, 413, 'IMAGE_TOO_LARGE', oversizedImageBody],
    ['/api/tiles/' + id + '/image', 'POST', undefined, 413, 'IMAGE_TOO_LARGE', oversizedRequestBody],
  ];
  for (const [route, method, payload, status, code, serializedBody] of invalidRequests) {
    const result = await request(route, method, payload, true, {}, { serializedBody });
    assert.equal(result.response.status, status, route + ': ' + code);
    assert.equal(result.content.code, code);
    assert.equal(typeof result.content.error, 'string', 'English error remains available to older clients');
  }
  const invalidType = await request('/api/settings', 'PUT', { rows: 4, columns: 5 }, true,
    { 'content-type': 'application/jsonp' });
  assert.equal(invalidType.response.status, 415);
  assert.equal(invalidType.content.code, 'JSON_REQUIRED');
  const invalidJSON = await fetch(base + '/api/settings', { method: 'PUT',
    headers: { cookie: cookies(), 'content-type': 'application/json; charset=utf-8' }, body: '{' });
  assert.equal(invalidJSON.status, 400);
  assert.equal((await invalidJSON.json()).code, 'INVALID_JSON');
  assert.deepEqual((await request('/api/state')).content, board, 'Rejected writes must not change the board');
});

test('HTML versions every referenced script and stylesheet while keeping assets private', async () => {
  const entry = await fetch(base + fixture.entryPath);
  const html = await entry.text();
  const assets = [...html.matchAll(/(?:src|href)="(\/[^"?]+\.(?:js|css))\?v=([a-f0-9]{16})"/g)];
  assert.ok(assets.length >= 2, 'The entry document must version script and stylesheet URLs');
  const { createHash } = await import('node:crypto');
  for (const [, asset, version] of assets) {
    const expected = createHash('sha256').update(fs.readFileSync(new URL('../public' + asset, import.meta.url))).digest('hex').slice(0, 16);
    assert.equal(version, expected, asset);
    assert.equal((await fetch(base + asset + '?v=' + version)).status, 404, 'Asset versions do not bypass the access cookie');
    const authorized = await fetch(base + asset + '?v=' + version, { headers: { cookie: cookies() } });
    assert.equal(authorized.status, 200);
    assert.match(authorized.headers.get('cache-control'), /private, no-store/);
  }
});
