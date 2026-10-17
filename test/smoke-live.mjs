// Explicit live smoke test: creates, edits, reorders, and removes one sample tile.
// Supply BASE_URL (origin only) and ACCESS_TOKEN_FILE; credentials are never logged.
import assert from 'node:assert/strict';
import fs from 'node:fs';

let stage = 'configuration';
async function main() {
  if (!process.env.BASE_URL || !process.env.ACCESS_TOKEN_FILE)
    throw new Error('BASE_URL and ACCESS_TOKEN_FILE are required');
  const address = new URL(process.env.BASE_URL);
  if (!['http:', 'https:'].includes(address.protocol) || address.username || address.password || address.search || address.hash || !['', '/'].includes(address.pathname))
    throw new Error('BASE_URL must be an HTTP(S) origin without credentials, query, or path');
  const token = fs.readFileSync(process.env.ACCESS_TOKEN_FILE, 'utf8').trim();
  if (!/^[A-Za-z0-9_-]{32,}$/.test(token)) throw new Error('Access token file has an invalid format');
  const base = address.origin;
  let cookie = '', id;
  async function fetchPath(route, options) {
    try { return await fetch(base + route, options); }
    catch { throw new Error('HTTP request failed'); }
  }
  stage = 'access gate';
  for (const route of ['/', '/?access=invalid', '/api/state', '/legacy/images/example.png'])
    assert.equal((await fetchPath(route)).status, 404, 'Unauthenticated access must be blocked');
  const entry = await fetchPath('/?access=' + encodeURIComponent(token));
  assert.equal(entry.status, 200, 'Authorized entry must succeed');
  cookie = entry.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetchPath('/', { headers: { cookie } })).status, 404, 'Repeat entry still requires its access query');
  async function call(route, method = 'GET', body) {
    const response = await fetchPath(route, { method,
      headers: { 'content-type': 'application/json', cookie },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json();
    assert.equal(response.status, 200, 'API request must succeed');
    return data;
  }
  stage = 'read baseline';
  const baseline = await call('/api/state');
  assert.equal(baseline.authenticated, true);
  for (const route of ['/api/login', '/api/logout'])
    assert.equal((await fetchPath(route, { method: 'POST', headers: { cookie, 'content-type': 'application/json' }, body: '{}' })).status, 404);
  try {
    stage = 'create sample';
    const created = await call('/api/tiles', 'POST', { title: 'Deployment smoke test', url: 'https://example.com/', revision: baseline.revision });
    id = created.tiles.find(tile => !baseline.tiles.some(original => original.id === tile.id))?.id;
    assert.ok(id, 'Sample tile must be identifiable');
    stage = 'capture sample';
    let tile, current;
    const deadline = Date.now() + 90000;
    do {
      await new Promise(resolve => setTimeout(resolve, 1500));
      current = await call('/api/state');
      tile = current.tiles.find(t => t.id === id);
    } while (tile?.screenshotStatus === 'pending' && Date.now() < deadline);
    assert.equal(tile?.screenshotStatus, 'ready', 'Screenshot must complete');
    const image = await fetchPath(tile.image, { headers: { cookie } });
    const bytes = new Uint8Array(await image.arrayBuffer());
    assert.equal(image.status, 200);
    assert.ok(bytes.length > 1000 && bytes[0] === 255 && bytes[1] === 216, 'Expected real JPEG');
    stage = 'edit sample';
    current = await call('/api/tiles/' + id, 'PATCH', { title: 'Deployment smoke test edited', revision: current.revision });
    assert.equal(JSON.stringify(current.tiles.filter(tile => tile.id !== id)) === JSON.stringify(baseline.tiles), true, 'Concurrent changes prevent reordering');
    stage = 'reorder sample';
    const order = [id, ...baseline.tiles.map(t => t.id)];
    const reordered = await call('/api/order', 'PUT', { ids: order, revision: current.revision });
    assert.equal(JSON.stringify(reordered.tiles.map(t => t.id)) === JSON.stringify(order), true, 'Order must match');
    console.log(JSON.stringify({ capture: 'ready', imageBytes: bytes.length, edit: 'ok', reorder: 'ok' }));
  } finally {
    if (id) {
      const previousStage = stage;
      stage = 'remove sample';
      const current = await call('/api/state');
      if (current.tiles.some(tile => tile.id === id)) await call('/api/tiles/' + id, 'DELETE', { revision: current.revision });
      stage = previousStage;
    }
  }
  stage = 'verify cleanup';
  const final = await call('/api/state');
  assert.equal(JSON.stringify(final.tiles) === JSON.stringify(baseline.tiles), true, 'Original board changed during smoke test');
  console.log(JSON.stringify({ originalTiles: final.tiles.length, originalBoardUnchanged: true, cleanup: 'ok' }));
}
main().catch(() => {
  // Do not print fetch URLs, response bodies, cookie values, or token paths.
  console.error(`Live smoke failed during ${stage}. Check configuration or service status; credentials were not logged.`);
  process.exitCode = 1;
});
