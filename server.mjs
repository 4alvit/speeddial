import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, randomUUID, createHash, timingSafeEqual } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { capture } from './screenshot.mjs';
import { parseWebURL } from './safe-proxy.mjs';
import { loadAccess } from './access.mjs';
import { initialState } from './initial-state.mjs';

const access = loadAccess();

const root = path.dirname(fileURLToPath(import.meta.url));
const assetVersions = Object.fromEntries(fs.readdirSync(path.join(root, 'public'))
  .filter(name => /\.(?:css|js)$/.test(name)).map(name => [name,
  createHash('sha256').update(fs.readFileSync(path.join(root, 'public', name))).digest('hex').slice(0, 16)]));
const dataDir = process.env.DATA_DIR || path.join(root, 'data');
fs.mkdirSync(path.join(dataDir, 'images'), { recursive: true, mode: 0o700 });
const db = new DatabaseSync(path.join(dataDir, 'speeddial.sqlite'));
const defaultLayout = { rows: 4, columns: 5 };
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS board (id INTEGER PRIMARY KEY CHECK (id=1), value TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS history (id INTEGER PRIMARY KEY, created TEXT NOT NULL, value TEXT NOT NULL);`);
if (!db.prepare('SELECT id FROM board').get()) {
  const initial = initialState(process.env.INITIAL_STATE_FILE);
  db.prepare('INSERT INTO board VALUES (1, ?)').run(JSON.stringify(initial));
}
const read = () => {
  const board = JSON.parse(db.prepare('SELECT value FROM board WHERE id=1').get().value);
  // Existing boards gain defaults without rewriting their bookmarks or revision.
  board.layout ??= { ...defaultLayout };
  board.openLinksIn ??= 'same-window';
  return board;
};
function save(board, backup = false) {
  db.exec('BEGIN IMMEDIATE');
  try {
    if (backup) {
      db.prepare('INSERT INTO history(created,value) SELECT ?,value FROM board WHERE id=1').run(new Date().toISOString());
      db.exec('DELETE FROM history WHERE id NOT IN (SELECT id FROM history ORDER BY id DESC LIMIT 100)');
    }
    board.revision++;
    db.prepare('UPDATE board SET value=? WHERE id=1').run(JSON.stringify(board));
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  pruneImages();
}

function pruneImages() {
  // Retain images referenced by the board or any of the last 100 saved edits.
  // Capture and upload writes are synchronous with save(), so no uncommitted
  // file can be removed by a concurrent operation in this single process.
  try {
    const retained = new Set();
    const values = db.prepare('SELECT value FROM board UNION ALL SELECT value FROM history').all();
    for (const { value } of values) for (const tile of JSON.parse(value).tiles)
      if (tile.image?.startsWith('/images/')) retained.add(tile.image.slice(8));
    for (const name of fs.readdirSync(path.join(dataDir, 'images')))
      if (!retained.has(name)) fs.unlinkSync(path.join(dataDir, 'images', name));
  } catch (error) { console.warn('Image cleanup failed', error.name); }
}
pruneImages();

const origin = process.env.PUBLIC_ORIGIN || '';
const secureCookie = origin.startsWith('https://');
const sign = access.sign;
function validCookie(req, name, scope = '') {
  const prefix = `${name}=`;
  const cookie = (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith(prefix));
  if (!cookie) return false;
  const parts = cookie.slice(prefix.length).split('.');
  if (parts.length !== 3) return false;
  const [expiry, nonce, signature] = parts;
  if (!/^\d{13}$/.test(expiry) || !/^[A-Za-z0-9_-]{32}$/.test(nonce) ||
      !/^[A-Za-z0-9_-]{43}$/.test(signature) || Number(expiry) < Date.now()) return false;
  const expected = sign(`${scope}${expiry}.${nonce}`);
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
function viewAuthorized(req) {
  return validCookie(req, 'speeddial_view', 'view:');
}
function viewCookie() {
  const value = `${Date.now() + 8 * 3600000}.${randomBytes(24).toString('base64url')}`;
  return `speeddial_view=${value}.${sign('view:' + value)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${secureCookie ? '; Secure' : ''}`;
}
const state = req => ({ ...read(), authenticated: viewAuthorized(req) });
class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
const fail = (status, message, code) => { throw new HttpError(status, message, code); };
function json(res, status, object, headers = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(JSON.stringify(object));
}
async function body(req) {
  if ((req.headers['content-type'] || '').split(';', 1)[0].trim().toLowerCase() !== 'application/json') fail(415, 'JSON content is required', 'JSON_REQUIRED');
  let size = 0; const chunks = [];
  // Leave the socket alive when rejecting an oversized body so clients receive
  // the JSON error instead of an unexplained connection reset.
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 8 * 1024 * 1024) {
      req.resume();
      fail(413, 'Image is too large (maximum 5 MB)', 'IMAGE_TOO_LARGE');
    }
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString());
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { fail(400, 'Invalid JSON', 'INVALID_JSON'); }
}
function fields(input) {
  let url;
  try { url = parseWebURL(input.url).href; } catch { fail(400, 'Enter a full http:// or https:// URL without credentials', 'INVALID_URL'); }
  if (input.title !== undefined && typeof input.title !== 'string') fail(400, 'Invalid title', 'INVALID_TITLE');
  const title = (input.title || '').trim() || new URL(url).hostname;
  if (title.length > 300) fail(400, 'Title must not exceed 300 characters', 'TITLE_TOO_LONG');
  return { title, url };
}
function checkRevision(board, input) {
  if (input.revision !== undefined && input.revision !== board.revision) fail(409, 'Bookmarks have changed. Refresh and try again.', 'REVISION_CONFLICT');
}
function imageInput(value) {
  if (typeof value !== 'string') fail(400, 'An image is required', 'IMAGE_REQUIRED');
  const match = /^data:image\/(png|jpeg|webp|gif);base64,([A-Za-z0-9+/=]+)$/.exec(value);
  if (!match) fail(400, 'PNG, JPEG, WebP and GIF are supported', 'IMAGE_TYPE_UNSUPPORTED');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 5 * 1024 * 1024) fail(413, 'Image is too large (maximum 5 MB)', 'IMAGE_TOO_LARGE');
  if (bytes.length < 12) fail(400, 'Invalid image size', 'INVALID_IMAGE_SIZE');
  const kind = match[1];
  const valid = kind === 'png' ? bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) :
    kind === 'jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 :
    kind === 'webp' ? bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP' :
    ['GIF87a', 'GIF89a'].includes(bytes.toString('ascii', 0, 6));
  if (!valid) fail(400, 'Image format does not match the file', 'INVALID_IMAGE');
  return { bytes, extension: kind === 'jpeg' ? 'jpg' : kind };
}

const jobs = new Map();
let working = false;
function enqueue(tile) { jobs.set(tile.id, { id: tile.id, url: tile.url, generation: tile.generation }); setImmediate(runJobs); }
async function runJobs() {
  if (working || !jobs.size) return;
  working = true;
  while (jobs.size) {
    const [id, job] = jobs.entries().next().value; jobs.delete(id);
    try {
      const bytes = await capture(job.url);
      const board = read(), tile = board.tiles.find(t => t.id === id);
      if (!tile || tile.generation !== job.generation || tile.url !== job.url) continue;
      const name = `${randomUUID()}.jpg`;
      fs.writeFileSync(path.join(dataDir, 'images', name), bytes, { mode: 0o600 });
      tile.image = `/images/${name}`; tile.screenshotStatus = 'ready'; tile.screenshotError = null; tile.screenshotErrorCode = null;
      save(board);
    } catch (error) {
      const board = read(), tile = board.tiles.find(t => t.id === id);
      if (tile && tile.generation === job.generation && tile.url === job.url) {
        tile.screenshotStatus = 'error';
        tile.screenshotErrorCode = 'SCREENSHOT_FAILED';
        tile.screenshotError = 'Could not capture this page. It may require sign-in or block screenshots. You can upload your own image.';
        save(board);
      }
      console.warn('Screenshot failed', id, error.name);
    }
  }
  working = false;
}
function pending(tile) { tile.generation = randomUUID(); tile.screenshotStatus = 'pending'; tile.screenshotError = null; tile.screenshotErrorCode = null; }
for (const tile of read().tiles) if (tile.screenshotStatus === 'pending') enqueue(tile);

const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8',
  '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.gif':'image/gif', '.webp':'image/webp', '.svg':'image/svg+xml', '.ico':'image/x-icon' };
function staticFile(res, base, name, immutable = false) {
  const target = path.resolve(base, name);
  if (!target.startsWith(path.resolve(base) + path.sep)) fail(404, 'Not found', 'NOT_FOUND');
  let stat;
  try { stat = fs.statSync(target); } catch { fail(404, 'Not found', 'NOT_FOUND'); }
  if (!stat.isFile()) fail(404, 'Not found', 'NOT_FOUND');
  const type = mime[path.extname(target)];
  if (!type) fail(404, 'Not found', 'NOT_FOUND');
  if (path.extname(target) === '.html') {
    // Different asset URLs prevent a previously open browser from mixing old
    // scripts/styles with the new HTML, even if its cache ignores revalidation.
    const html = fs.readFileSync(target, 'utf8').replace(/\/([a-zA-Z0-9_-]+\.(?:css|js))"/g,
      (match, name) => assetVersions[name] ? `/${name}?v=${assetVersions[name]}"` : match);
    res.writeHead(200, { 'content-type': type, 'content-length': Buffer.byteLength(html),
      'cache-control': 'private, no-store' });
    res.end(html); return;
  }
  res.writeHead(200, { 'content-type': type, 'content-length': stat.size,
    'cache-control': 'private, no-store' });
  const stream = fs.createReadStream(target); stream.on('error', () => res.destroy()); stream.pipe(res);
}

const server = http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Vary', 'Cookie');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  try {
    const requestUrl = new URL(req.url, 'http://localhost');
    const pathname = requestUrl.pathname;
    const method = req.method;
    if (method === 'GET' && pathname === '/healthz') return json(res, 200, { status: 'ok' });
    // The entry URL must carry the exact query key on every navigation, even
    // after an earlier visit. Its signed cookie grants access to subresources
    // and editing APIs without a separate password or editor session.
    if ((pathname === '/' || pathname === '/index.html') && ['GET', 'HEAD'].includes(method)) {
      if (!access.accepts(requestUrl.searchParams))
        fail(404, 'Not found', 'NOT_FOUND');
      res.setHeader('Set-Cookie', viewCookie());
    } else if (!viewAuthorized(req)) fail(404, 'Not found', 'NOT_FOUND');
    if (method === 'GET' && pathname === '/api/state') return json(res, 200, state(req));
    if (method === 'GET' && pathname === '/api/export') {
      return json(res, 200, read(), { 'content-disposition': 'attachment; filename="speeddial.json"' });
    }
    if (pathname.startsWith('/api/')) {
      if (pathname === '/api/login' || pathname === '/api/logout') fail(404, 'Not found', 'NOT_FOUND');
      if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) fail(405, 'Method not allowed', 'METHOD_NOT_ALLOWED');
      const expectedOrigin = origin || `http://${req.headers.host}`;
      if (req.headers.origin && req.headers.origin !== expectedOrigin) fail(403, 'Request origin is not allowed', 'ORIGIN_NOT_ALLOWED');
      if (req.headers['sec-fetch-site'] === 'cross-site') fail(403, 'Request origin is not allowed', 'ORIGIN_NOT_ALLOWED');
      const input = await body(req);
      const board = read(); checkRevision(board, input);
      let queued;
      if (pathname === '/api/tiles' && method === 'POST') {
        if (board.tiles.length >= 500) fail(400, 'The limit of 500 bookmarks has been reached', 'BOOKMARK_LIMIT');
        const tile = { id: randomUUID(), ...fields(input), image: null };
        pending(tile); board.tiles.push(tile); queued = tile;
      } else if (pathname === '/api/settings' && method === 'PUT') {
        const { rows, columns } = input;
        if (![rows, columns].every(value => Number.isInteger(value) && value >= 1 && value <= 12))
          fail(400, 'Rows and columns must be whole numbers from 1 to 12', 'INVALID_LAYOUT');
        const openLinksIn = input.openLinksIn === undefined ? board.openLinksIn : input.openLinksIn;
        if (!['same-window', 'new-window'].includes(openLinksIn))
          fail(400, 'Choose where links should open', 'INVALID_LINK_TARGET');
        board.layout = { rows, columns };
        board.openLinksIn = openLinksIn;
      } else if (pathname === '/api/order' && method === 'PUT') {
        const ids = input.ids;
        if (!Array.isArray(ids) || ids.length !== board.tiles.length || new Set(ids).size !== ids.length ||
            ids.some(id => !board.tiles.some(t => t.id === id))) fail(400, 'Invalid bookmark order', 'INVALID_ORDER');
        const byId = new Map(board.tiles.map(t => [t.id,t])); board.tiles = ids.map(id => byId.get(id));
      } else {
        const match = /^\/api\/tiles\/([a-zA-Z0-9-]+)(?:\/(image|screenshot))?$/.exec(pathname);
        if (!match) fail(404, 'Not found', 'NOT_FOUND');
        const tile = board.tiles.find(t => t.id === match[1]);
        if (!tile) fail(404, 'Bookmark not found', 'BOOKMARK_NOT_FOUND');
        if (!match[2] && method === 'DELETE') { board.tiles = board.tiles.filter(t => t.id !== tile.id); jobs.delete(tile.id); }
        else if (!match[2] && method === 'PATCH') {
          const updated = fields({ title: input.title ?? tile.title, url: input.url ?? tile.url });
          const changed = updated.url !== tile.url; Object.assign(tile, updated);
          if (changed) { tile.image = null; pending(tile); queued = tile; }
        } else if (match[2] === 'screenshot' && method === 'POST') {
          pending(tile); queued = tile;
        } else if (match[2] === 'image' && method === 'POST') {
          const image = imageInput(input.data), name = `${randomUUID()}.${image.extension}`;
          fs.writeFileSync(path.join(dataDir, 'images', name), image.bytes, { mode: 0o600 });
          tile.image = `/images/${name}`; tile.generation = randomUUID();
          tile.screenshotStatus = 'ready'; tile.screenshotError = null; tile.screenshotErrorCode = null; jobs.delete(tile.id);
        } else fail(405, 'Method not allowed', 'METHOD_NOT_ALLOWED');
      }
      save(board, true); if (queued) enqueue(queued);
      return json(res, 200, { ...board, authenticated: true });
    }
    if (!['GET', 'HEAD'].includes(method)) fail(405, 'Method not allowed', 'METHOD_NOT_ALLOWED');
    if (pathname.startsWith('/legacy/images/')) return staticFile(res, path.join(dataDir, 'legacy-images'), pathname.slice(15), true);
    if (pathname.startsWith('/images/')) return staticFile(res, path.join(dataDir, 'images'), pathname.slice(8), true);
    return staticFile(res, path.join(root, 'public'), pathname === '/' ? 'index.html' : pathname.slice(1));
  } catch (error) {
    if (res.headersSent) return res.destroy();
    if (!error.status) console.error('Request failed', error.name, error.message);
    json(res, error.status || 500, { error: error.status ? error.message : 'Server error', code: error.status ? error.code : 'SERVER_ERROR' });
  }
});
server.requestTimeout = 30000;
server.headersTimeout = 10000;
server.listen(Number(process.env.PORT || 3000), '0.0.0.0', () => console.log(`Speed Dial listening on ${server.address().port}`));
process.on('SIGTERM', () => { server.close(() => { db.close(); process.exit(0); }); });
