import { createFixture, syntheticPng, syntheticTiles } from './fixtures.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { DatabaseSync } from 'node:sqlite';

test('grid settings upgrade existing boards, validate dimensions and persist without changing tiles', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speeddial-layout-'));
  const fixture = createFixture(dir, { dataDir: dir });
  const seed = { tiles: syntheticTiles() };
  const original = { revision: 18, tiles: seed.tiles.map(tile => ({ ...tile, screenshotStatus: 'ready', screenshotError: null })) };
  const db = new DatabaseSync(path.join(dir, 'speeddial.sqlite'));
  db.exec('CREATE TABLE board (id INTEGER PRIMARY KEY, value TEXT NOT NULL)');
  db.prepare('INSERT INTO board VALUES (1, ?)').run(JSON.stringify(original));
  db.close();
  let child, base, cookie;
  async function start() {
    child = spawn(process.execPath, ['server.mjs'], {
      cwd: new URL('..', import.meta.url),
      env: { PORT: '0', ...fixture.env, CHROMIUM_PATH: '/unused-test-browser' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    base = await new Promise((resolve, reject) => {
      child.stdout.on('data', data => {
        const match = /listening on (\d+)/.exec(data);
        if (match) resolve(`http://127.0.0.1:${match[1]}`);
      });
      child.once('error', reject);
      child.once('exit', code => reject(new Error(`Server exited ${code}`)));
    });
  }
  async function stop() {
    const done = once(child, 'exit'); child.kill('SIGTERM'); await done;
  }
  async function call(route, payload) {
    const response = await fetch(base + route, {
      method: payload === undefined ? 'GET' : 'PUT',
      headers: { cookie, 'content-type': 'application/json' },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    return { status: response.status, data: await response.json() };
  }
  try {
    await start();
    const entry = await fetch(base + fixture.entryPath);
    cookie = entry.headers.get('set-cookie').split(';')[0];
    let result = await call('/api/state');
    assert.deepEqual(result.data.layout, { rows: 4, columns: 5 });
    assert.equal(result.data.openLinksIn, 'same-window');
    assert.equal(result.data.revision, original.revision, 'Reading legacy board must not write a migration');
    assert.deepEqual(result.data.tiles, original.tiles);

    result = await call('/api/settings', { rows: 2, columns: 4, openLinksIn: 'new-window', revision: 18 });
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.layout, { rows: 2, columns: 4 });
    assert.equal(result.data.openLinksIn, 'new-window');
    assert.deepEqual(result.data.tiles, original.tiles, 'Small grids must retain every bookmark');
    assert.equal(result.data.revision, 19);
    assert.equal((await call('/api/settings', { rows: 3, columns: 3, revision: 18 })).status, 409);
    for (const value of [0, -1, 13, 1.5, null, '4']) {
      for (const key of ['rows', 'columns']) {
        result = await call('/api/settings', { rows: 2, columns: 4, [key]: value, revision: 19 });
        assert.equal(result.status, 400, `Invalid ${key}: ${value}`);
      }
    }
    for (const openLinksIn of [null, true, '_blank', 'invalid'])
      assert.equal((await call('/api/settings', { rows: 2, columns: 4, openLinksIn, revision: 19 })).status, 400);
    assert.equal((await call('/api/state')).data.revision, 19, 'Rejected settings must not change the board');
    await stop(); await start();
    result = await call('/api/state');
    assert.deepEqual(result.data.layout, { rows: 2, columns: 4 });
    assert.equal(result.data.openLinksIn, 'new-window', 'Link target survives restart');
    assert.deepEqual(result.data.tiles, original.tiles);
    assert.deepEqual((await call('/api/export')).data.layout, result.data.layout);
    assert.equal((await call('/api/export')).data.openLinksIn, 'new-window');
    result = await call('/api/settings', { rows: 1, columns: 12, revision: 19 });
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.layout, { rows: 1, columns: 12 });
    assert.deepEqual(result.data.tiles, original.tiles);
    result = await call('/api/settings', { rows: 12, columns: 1, revision: 20 });
    assert.equal(result.status, 200);
    assert.deepEqual(result.data.layout, { rows: 12, columns: 1 });
    assert.deepEqual(result.data.tiles, original.tiles);
    assert.equal(result.data.openLinksIn, 'new-window', 'Older clients changing the grid preserve the link preference');
    result = await call('/api/settings', { rows: 12, columns: 1, openLinksIn: 'same-window', revision: 21 });
    assert.equal(result.status, 200);
    assert.equal(result.data.openLinksIn, 'same-window');
    assert.deepEqual(result.data.tiles, original.tiles);
  } finally {
    if (child && child.exitCode === null) await stop();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
