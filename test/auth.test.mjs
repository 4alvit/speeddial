import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { randomBytes, createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadAccess } from '../access.mjs';
import { initialState } from '../initial-state.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'speeddial-access-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const token = randomBytes(32).toString('base64url');
  const key = randomBytes(48);
  const env = { DATA_DIR: path.join(directory, 'data'), ACCESS_TOKEN_FILE: path.join(directory, 'token'), SESSION_KEY_FILE: path.join(directory, 'key') };
  fs.writeFileSync(env.ACCESS_TOKEN_FILE, token + '\n', { mode: 0o600 });
  fs.writeFileSync(env.SESSION_KEY_FILE, key, { mode: 0o600 });
  return { directory, token, key, env };
}
async function start(t, env) {
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: root, env: { ...process.env, INITIAL_STATE_FILE: '', PUBLIC_ORIGIN: '', AUTH_EPOCH: '', ...env, PORT: env.PORT || '0' }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', value => { stderr += value; });
  let stopped = false;
  const stop = async () => {
    if (stopped || child.exitCode !== null) return;
    stopped = true;
    const ended = once(child, 'exit'); child.kill('SIGTERM'); await ended;
  };
  t.after(stop);
  const base = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Startup timed out')); }, 10000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', () => { clearTimeout(timer); reject(new Error(`Server did not start: ${stderr}`)); });
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = /listening on (\d+)/.exec(output);
      if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
    });
  });
  return { base, stop };
}
async function enter(base, token) {
  const response = await fetch(`${base}/?access=${token}`);
  assert.equal(response.status, 200);
  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly; SameSite=Strict/);
  assert.match(cookie, /Max-Age=28800/);
  assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  return cookie.split(';')[0];
}

test('access configuration fails closed and never uses the old PVC signing key', async t => {
  const f = fixture(t);
  for (const name of ['ACCESS_TOKEN_FILE', 'SESSION_KEY_FILE']) {
    assert.throws(() => loadAccess({ ...f.env, [name]: '' }), new RegExp(name));
    assert.throws(() => loadAccess({ ...f.env, [name]: 'relative' }), new RegExp(name));
  }
  fs.writeFileSync(f.env.ACCESS_TOKEN_FILE, 'too-short');
  assert.throws(() => loadAccess(f.env), /32–256/);
  fs.writeFileSync(f.env.ACCESS_TOKEN_FILE, f.token);
  fs.writeFileSync(f.env.SESSION_KEY_FILE, Buffer.alloc(31));
  assert.throws(() => loadAccess(f.env), /at least 32 bytes/);
  fs.writeFileSync(f.env.SESSION_KEY_FILE, f.key);
  assert.throws(() => loadAccess({ ...f.env, AUTH_EPOCH: 'unsafe:epoch' }), /AUTH_EPOCH/);
  fs.mkdirSync(f.env.DATA_DIR);
  fs.writeFileSync(path.join(f.env.DATA_DIR, 'session.key'), f.key);
  const child = spawn(process.execPath, ['server.mjs'], { cwd: root,
    env: { ...process.env, ...f.env, ACCESS_TOKEN_FILE: '', SESSION_KEY_FILE: '', PORT: '0' }, stdio: 'ignore' });
  const [code] = await once(child, 'exit');
  assert.notEqual(code, 0);
  assert.equal(fs.existsSync(path.join(f.env.DATA_DIR, 'speeddial.sqlite')), false);
});

test('fresh installations contain no personal data and credentials are never served', async t => {
  const f = fixture(t), server = await start(t, f.env);
  assert.equal((await fetch(server.base + '/healthz')).status, 200);
  for (const suffix of ['/', '/index.html', '/?access=', '/?access=wrong', `/?access=${f.token}&access=${f.token}`])
    assert.equal((await fetch(server.base + suffix)).status, 404);
  const cookie = await enter(server.base, f.token), headers = { cookie };
  const state = await (await fetch(server.base + '/api/state', { headers })).json();
  assert.deepEqual(state.tiles, []);
  assert.deepEqual(state.layout, { rows: 4, columns: 5 });
  assert.equal(state.openLinksIn, 'same-window');
  assert.equal(state.revision, 1);
  assert.equal(fs.existsSync(path.join(f.env.DATA_DIR, 'session.key')), false);
  assert.equal((await fetch(server.base + '/', { headers })).status, 404);
  for (const suffix of ['/session.key', '/access.mjs', '/legacy/seed.json', '/run/secrets/speeddial/access-token'])
    assert.equal((await fetch(server.base + suffix, { headers })).status, 404);
  const html = await (await fetch(`${server.base}/?access=${f.token}`)).text();
  assert.equal(html.includes(f.token), false);
  assert.equal((await fetch(`${server.base}/?access=${f.token}`, { method: 'HEAD' })).status, 200);
});

test('token, key and epoch rotations revoke read/write sessions without changing board/history', async t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.env.DATA_DIR, 'legacy-images'), { recursive: true });
  const image = Buffer.from('89504e470d0a1a0a00000000', 'hex');
  fs.writeFileSync(path.join(f.env.DATA_DIR, 'legacy-images', 'example.png'), image);
  const seed = path.join(f.directory, 'seed.json');
  fs.writeFileSync(seed, JSON.stringify({ tiles: [{ id: 'example', title: 'Example', url: 'https://example.com/', image: '/legacy/images/example.png' }] }));
  const env = { ...f.env, INITIAL_STATE_FILE: seed };
  let server = await start(t, env), token = f.token;
  let cookie = await enter(server.base, token);
  assert.equal((await fetch(server.base + '/legacy/images/example.png')).status, 404);
  assert.deepEqual(Buffer.from(await (await fetch(server.base + '/legacy/images/example.png', { headers: { cookie } })).arrayBuffer()), image);
  const update = await fetch(server.base + '/api/settings', { method: 'PUT', headers: { cookie, 'content-type': 'application/json' }, body: JSON.stringify({ revision: 1, rows: 3, columns: 6 }) });
  assert.equal(update.status, 200);
  const expected = await update.json();
  await server.stop();
  const { DatabaseSync } = await import('node:sqlite');
  const snapshot = () => {
    const db = new DatabaseSync(path.join(f.env.DATA_DIR, 'speeddial.sqlite'), { readOnly: true });
    try { return db.prepare('SELECT value FROM board UNION ALL SELECT value FROM history ORDER BY value').all(); } finally { db.close(); }
  };
  const baseline = snapshot();
  for (const rotation of ['token', 'key', 'epoch']) {
    if (rotation === 'token') { token = randomBytes(32).toString('base64url'); fs.writeFileSync(f.env.ACCESS_TOKEN_FILE, token); }
    if (rotation === 'key') fs.writeFileSync(f.env.SESSION_KEY_FILE, randomBytes(48));
    if (rotation === 'epoch') env.AUTH_EPOCH = '2';
    server = await start(t, env);
    assert.equal((await fetch(`${server.base}/?access=${f.token}`)).status, 404);
    assert.equal((await fetch(server.base + '/api/state', { headers: { cookie } })).status, 404);
    assert.equal((await fetch(server.base + '/api/settings', { method: 'PUT', headers: { cookie, 'content-type': 'application/json' }, body: '{}' })).status, 404);
    // Even possession of an old v2 cookie signed with the previous PVC key
    // cannot bypass the new token/epoch-bound signature domain.
    const payload = `${Date.now() + 60000}.${randomBytes(24).toString('base64url')}`;
    const signature = createHmac('sha256', f.key).update('speeddial-access-v2:view:' + payload).digest('base64url');
    assert.equal((await fetch(server.base + '/api/state', { headers: { cookie: `speeddial_view=${payload}.${signature}` } })).status, 404);
    cookie = await enter(server.base, token);
    assert.deepEqual(await (await fetch(server.base + '/api/state', { headers: { cookie } })).json(), expected);
    assert.equal((await fetch(server.base + '/api/settings', { method: 'PUT', headers: { cookie, origin: 'https://other.example', 'content-type': 'application/json' }, body: '{}' })).status, 403);
    await server.stop();
    assert.deepEqual(snapshot(), baseline);
  }
});


test('cutover verifier proves old access before accepting revocation evidence', async t => {
  const f = fixture(t);
  let server = await start(t, f.env);
  const base = server.base;
  const run = args => promisify(execFile)(process.execPath, ['scripts/verify-access.mjs', ...args], { cwd: root });
  const oldQueryFile = path.join(f.directory, 'old-query');
  const oldCookieFile = path.join(f.directory, 'old-cookie');
  const receiptFile = path.join(f.directory, 'preflight.json');
  const newToken = randomBytes(32).toString('base64url');
  // The running process retains its old credentials until restarted.
  fs.writeFileSync(f.env.ACCESS_TOKEN_FILE, newToken);
  fs.writeFileSync(oldQueryFile, '?access=' + f.token, { mode: 0o600 });
  const args = ['--origin', base, '--token-file', f.env.ACCESS_TOKEN_FILE,
    '--old-query-file', oldQueryFile, '--old-cookie-file', oldCookieFile, '--preflight-file', receiptFile];
  const dry = await run(args);
  assert.equal(JSON.parse(dry.stdout).networkRequests, 0);
  assert.equal(fs.existsSync(receiptFile), false);
  const prepared = await run([...args, '--prepare']);
  assert.equal(JSON.parse(prepared.stdout).oldSessionAccepted, true);
  assert.equal(prepared.stdout.includes(f.token), false);
  await assert.rejects(run([...args, '--prepare']));
  const oldCookie = fs.readFileSync(oldCookieFile, 'utf8');
  await server.stop();
  fs.writeFileSync(f.env.SESSION_KEY_FILE, randomBytes(48));
  server = await start(t, { ...f.env, PORT: new URL(base).port });
  // A plausible but never-issued old cookie must not certify revocation.
  fs.writeFileSync(oldCookieFile, `speeddial_view=${Date.now() + 3600000}.${randomBytes(24).toString('base64url')}.${randomBytes(32).toString('base64url')}`);
  await assert.rejects(run([...args, '--execute']));
  fs.writeFileSync(oldCookieFile, oldCookie);
  fs.writeFileSync(oldQueryFile, '?not-an-actual-previous-query');
  await assert.rejects(run([...args, '--execute']));
  fs.writeFileSync(oldQueryFile, '?access=' + f.token);
  const verified = await run([...args, '--execute']);
  assert.equal(JSON.parse(verified.stdout).preflightMatched, true);
  assert.equal(JSON.parse(verified.stdout).oldEntry, 'revoked');
  assert.equal(verified.stdout.includes(newToken), false);
});


test('explicit seed imports support full-size valid boards and reject unsafe references', t => {
  const f = fixture(t), seed = path.join(f.directory, 'initial.json');
  const tiles = Array.from({ length: 500 }, (_, index) => ({
    id: `example-${index}`, title: 'Example', url: 'https://example.com/' + 'a'.repeat(3000), image: null,
  }));
  fs.writeFileSync(seed, JSON.stringify({ tiles }));
  assert.ok(fs.statSync(seed).size > 1024 * 1024);
  assert.equal(initialState(seed).tiles.length, 500);
  tiles[0].image = '/legacy/images/../../secret.png';
  fs.writeFileSync(seed, JSON.stringify({ tiles }));
  assert.throws(() => initialState(seed), /valid Speed Dial seed/);
});
