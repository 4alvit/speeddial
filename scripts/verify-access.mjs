#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

// Full publication cutover: the entry token AND old sessions must be revoked.
// --prepare proves old access before cutover; --execute checks the same inputs
// afterward. Default is dry-run. No URL, cookie or response body is printed.
const digest = value => createHash('sha256').update(value).digest('hex');
const cookiePattern = /^speeddial_view=\d{13}\.[A-Za-z0-9_-]{32}\.[A-Za-z0-9_-]{43}$/;
async function main() {
  const options = new Map();
  const flags = new Set(['--prepare', '--execute']);
  const names = new Set(['--origin', '--token-file', '--old-query-file', '--old-cookie-file', '--preflight-file']);
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (options.has(arg)) throw new Error('Duplicate option');
    if (flags.has(arg)) options.set(arg, true);
    else if (names.has(arg) && args[i + 1] && !args[i + 1].startsWith('--')) options.set(arg, args[++i]);
    else throw new Error('Invalid option');
  }
  for (const name of names) if (!options.has(name)) throw new Error('Missing required option');
  if (options.has('--prepare') && options.has('--execute')) throw new Error('Choose one operation');
  const origin = new URL(options.get('--origin'));
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || origin.search || origin.hash || origin.pathname !== '/')
    throw new Error('Origin must be a bare HTTP(S) origin');
  if (origin.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname))
    throw new Error('Remote verification requires HTTPS');
  const files = [...names].filter(name => name.endsWith('-file')).map(name => path.resolve(options.get(name)));
  if (new Set(files).size !== files.length) throw new Error('Input and output paths must be distinct');
  function read(name) {
    const filename = options.get(name);
    if (fs.statSync(filename).size > 4096) throw new Error('Private input is too large');
    return fs.readFileSync(filename, 'utf8').trim();
  }
  const token = read('--token-file'), oldQuery = read('--old-query-file');
  if (!/^[A-Za-z0-9_-]{32,256}$/.test(token)) throw new Error('Invalid token input');
  if (!oldQuery.startsWith('?') || /[\r\n#]/.test(oldQuery)) throw new Error('Old query file must contain only a query starting with ?');
  if (!options.has('--prepare') && !options.has('--execute')) {
    console.log(JSON.stringify({ mode: 'dry-run', configurationValid: true, networkRequests: 0, filesWritten: 0 })); return;
  }
  let requests = 0;
  async function request(route, expected, init = {}) {
    const url = new URL(route, origin);
    if (url.origin !== origin.origin) throw new Error('Cross-origin verification refused');
    requests++;
    const result = await fetch(url, { ...init, redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (result.status !== expected) throw new Error('Unexpected verification response');
    return result;
  }
  const hashes = { origin: digest(origin.origin), token: digest(token), oldQuery: digest(oldQuery) };
  if (options.has('--prepare')) {
    for (const name of ['--old-cookie-file', '--preflight-file']) if (fs.existsSync(options.get(name))) throw new Error('Refusing overwrite');
    const entry = await request('/' + oldQuery, 200);
    const cookie = (entry.headers.get('set-cookie') || '').split(';')[0];
    if (!cookiePattern.test(cookie)) throw new Error('Expected signed session');
    const state = await (await request('/api/state', 200, { headers: { cookie } })).json();
    if (state.authenticated !== true || !Array.isArray(state.tiles)) throw new Error('Old session did not authorize the board');
    if (state.tiles.some(tile => tile.screenshotStatus === 'pending')) throw new Error('Wait for captures before preflight');
    const board = await (await request('/api/export', 200, { headers: { cookie } })).text();
    const receipt = { format: 1, preparedAt: Date.now(), ...hashes, oldCookie: digest(cookie), board: digest(board) };
    let cookieWritten = false;
    try {
      fs.writeFileSync(options.get('--old-cookie-file'), cookie + '\n', { flag: 'wx', mode: 0o600 });
      cookieWritten = true;
      fs.writeFileSync(options.get('--preflight-file'), JSON.stringify(receipt) + '\n', { flag: 'wx', mode: 0o600 });
    } catch (error) { if (cookieWritten) fs.unlinkSync(options.get('--old-cookie-file')); throw error; }
    console.log(JSON.stringify({ mode: 'prepare', oldEntryAccepted: true, oldSessionAccepted: true, privateFilesWritten: 2, networkRequests: requests }));
    return;
  }
  const oldCookie = read('--old-cookie-file'), receipt = JSON.parse(read('--preflight-file'));
  if (!cookiePattern.test(oldCookie) || Number(oldCookie.split('=')[1].split('.')[0]) <= Date.now() + 60000)
    throw new Error('Old cookie must still be valid to prove revocation');
  if (receipt.format !== 1 || !Number.isSafeInteger(receipt.preparedAt) || receipt.preparedAt > Date.now() ||
      Date.now() - receipt.preparedAt > 8 * 3600000 || receipt.oldCookie !== digest(oldCookie) ||
      Object.entries(hashes).some(([name, value]) => receipt[name] !== value)) throw new Error('Preflight evidence does not match these inputs');
  await request('/', 404);
  await request('/' + oldQuery, 404);
  await request('/api/state', 404, { headers: { cookie: oldCookie } });
  // An empty settings body is invalid even if authorization regresses. It
  // cannot edit the board; the expected response is still unauthorized 404.
  await request('/api/settings', 404, { method: 'PUT', headers: { cookie: oldCookie, 'content-type': 'application/json' }, body: '{}' });
  const entry = await request('/?access=' + token, 200);
  const cookieHeader = entry.headers.get('set-cookie') || '';
  if (!cookieHeader.includes('HttpOnly') || !cookieHeader.includes('SameSite=Strict') ||
      (origin.protocol === 'https:' && !cookieHeader.includes('; Secure'))) throw new Error('Cookie policy verification failed');
  const headers = { cookie: cookieHeader.split(';')[0] };
  if (!cookiePattern.test(headers.cookie)) throw new Error('Expected new signed session');
  await request('/', 404, { headers });
  const first = await (await request('/api/export', 200, { headers })).text();
  if (digest(first) !== receipt.board) throw new Error('Board differs from preflight; inspect cutover state');
  const board = JSON.parse(first);
  if (!Array.isArray(board.tiles)) throw new Error('Invalid board response');
  let checkedImages = 0;
  for (const route of new Set(board.tiles.map(tile => tile.image).filter(Boolean))) {
    if (!/^\/(?:legacy\/)?images\/[A-Za-z0-9_-]+\.(?:png|jpe?g|gif|webp|svg)$/.test(route)) throw new Error('Unexpected image reference');
    const response = await request(route, 200, { headers });
    if (!(await response.arrayBuffer()).byteLength) throw new Error('Empty image');
    checkedImages++;
  }
  await request('/api/settings', 403, { method: 'PUT', headers: { ...headers, origin: 'https://different-origin.example', 'content-type': 'application/json' }, body: '{}' });
  const last = await (await request('/api/export', 200, { headers })).text();
  if (digest(first) !== digest(last)) throw new Error('Board changed during verification');
  console.log(JSON.stringify({ mode: 'execute', access: 'passed', oldEntry: 'revoked', oldSessions: 'rejected', preflightMatched: true, preflightBoardPreserved: true, boardUnchanged: true, checkedImages, networkRequests: requests }));
}
main().catch(() => { console.error('Access verification failed; check local inputs, credentials and expected responses. Sensitive details are suppressed.'); process.exitCode = 1; });
