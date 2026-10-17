import { createFixture, syntheticPng, syntheticTiles } from './fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

test('review: keyed access alone permits editing; malformed and retired editor cookies cannot unlock access', async () => {
  const data = fs.mkdtempSync(path.join(os.tmpdir(), 'speeddial-gate-review-'));
  const fixture = createFixture(data);
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: new URL('..', import.meta.url),
    env: { PORT: '0', ...fixture.env, CHROMIUM_PATH: '/not-a-browser' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  try {
    const base = await new Promise((resolve, reject) => {
      child.stdout.on('data', data => { const m = /listening on (\d+)/.exec(data); if (m) resolve(`http://127.0.0.1:${m[1]}`); });
      child.once('error', reject);
      child.once('exit', code => reject(new Error(`Server exited ${code}`)));
    });
    const write = (route, cookie, payload = {}, method = 'POST', headers = {}) => fetch(base + route, {
      method, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers },
      body: JSON.stringify(payload),
    });
    const entry = await fetch(base + fixture.entryPath);
    assert.equal(entry.status, 200);
    const access = entry.headers.get('set-cookie').split(';')[0];
    const accessValue = access.slice('speeddial_view='.length);
    const initial = await (await fetch(base + '/api/state', { headers: { cookie: access } })).json();
    assert.equal(initial.authenticated, true, 'Keyed access immediately grants editing');
    const tileId = initial.tiles[0].id;

    for (const value of [accessValue, 'view:' + accessValue]) {
      const retiredEditor = 'speeddial_session=' + value;
      for (const route of ['/api/state', '/api/export', '/app.js', '/legacy/images/example.png']) {
        assert.equal((await fetch(base + route, { headers: { cookie: retiredEditor } })).status, 404,
          'Retired editor cookie alone cannot unlock ' + route);
      }
      assert.equal((await write('/api/tiles/' + tileId, retiredEditor, { title: 'Must not change' }, 'PATCH')).status, 404);
      const allowed = await fetch(base + '/api/state', { headers: { cookie: access + '; ' + retiredEditor } });
      assert.equal((await allowed.json()).authenticated, true, 'Retired editor cookie does not affect keyed access');
    }
    const [expiry, nonce, signature] = accessValue.split('.');
    const malformed = [
      '', 'undefined', 'null', accessValue + '.', accessValue + '.extra',
      `NaN.${nonce}.${signature}`, `Infinity.${nonce}.${signature}`,
      `view:${expiry}.${nonce}.${signature}`, `+${expiry}.${nonce}.${signature}`,
      `1e20.${nonce}.${signature}`, `0000000000000.${nonce}.${signature}`,
      `${expiry}.${nonce.slice(1)}.${signature}`, `${expiry}.${nonce}_.${signature}`,
      `${expiry}.${nonce}.${'é'.repeat(43)}`, `${expiry}.${nonce}.${signature.slice(1)}`,
      `${expiry}.${nonce}.${'A'.repeat(43)}`,
    ];
    for (const value of malformed) {
      const cookie = 'speeddial_view=' + value;
      const denied = await fetch(base + '/api/state', { headers: { cookie } });
      assert.equal(denied.status, 404, 'Malformed access token must reject cleanly');
      assert.equal((await write('/api/tiles/' + tileId, cookie, { title: 'Must not change' }, 'PATCH')).status, 404);
    }
    for (const method of ['GET', 'HEAD']) {
      for (const route of ['/', '/index.html', '/?wrong', '/?access=wrong']) {
        const response = await fetch(base + route, { method, headers: { cookie: access } });
        assert.equal(response.status, 404, method + ' ' + route);
        assert.match(response.headers.get('cache-control'), /no-store/);
      }
      const valid = await fetch(base + fixture.entryPath, { method });
      assert.equal(valid.status, 200);
    }
    for (const route of ['/api/login', '/api/logout'])
      assert.equal((await write(route, access)).status, 404, 'Retired authentication endpoint must not exist');
    assert.equal((await write('/api/tiles/' + tileId, undefined, { title: 'Must not change' }, 'PATCH')).status, 404);
    assert.equal((await write('/api/tiles/' + tileId + fixture.entryPath.slice(1), undefined, { title: 'Must not change' }, 'PATCH')).status, 404);
    for (const headers of [{ origin: 'https://attacker.invalid' }, { 'sec-fetch-site': 'cross-site' }])
      assert.equal((await write('/api/tiles/' + tileId, access, { title: 'Must not change' }, 'PATCH', headers)).status, 403);
    const update = await write('/api/tiles/' + tileId, access, { title: 'Updated with keyed access' }, 'PATCH');
    assert.equal(update.status, 200);
    const updated = await update.json();
    assert.equal(updated.authenticated, true);
    assert.equal(updated.tiles[0].title, 'Updated with keyed access');
    const exported = await fetch(base + '/api/export', { headers: { cookie: access } });
    assert.equal(exported.status, 200, 'Keyed access permits exporting without a password');
    assert.equal((await exported.json()).tiles[0].title, 'Updated with keyed access');
  } finally {
    const done = once(child, 'exit'); child.kill('SIGTERM'); await done;
    fs.rmSync(data, { recursive: true, force: true });
  }
});
