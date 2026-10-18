import fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import '../local/storage.js';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const backupDirectory = path.join(root, 'backups');
export const primaryUrl = 'https://speeddial.alvit.here.now/';
const { validation, limits } = globalThis.SpeedialStorage;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const browsers = Object.freeze({
  chrome: 'Google Chrome', firefox: 'Firefox', safari: 'Safari', edge: 'Microsoft Edge',
  brave: 'Brave Browser', arc: 'Arc', opera: 'Opera', vivaldi: 'Vivaldi',
  chromium: 'Chromium', orion: 'Orion', zen: 'Zen', librewolf: 'LibreWolf', waterfox: 'Waterfox',
});

// Reuse the app's schema and raster checks. Actual decoding still happens on import.
export function validateBackup(bytes) {
  if (bytes.byteLength > limits.backupBytes) throw new Error('Backup exceeds the 100 MiB limit.');
  let document;
  try { document = validation.parseBackupDocument(bytes.toString('utf8')); }
  catch { throw new Error('Invalid or unsupported Speed Dial backup. No data was saved or restored.'); }
  let imageBytes = 0;
  const images = new Map();
  try {
    for (const image of document.images) {
      const data = validation.base64Bytes(image.data);
      validation.imageDimensions(data, image.type);
      imageBytes += data.byteLength;
      if (imageBytes > limits.boardImageBytes) throw new Error();
      images.set(image.id, { type: image.type, sha256: hash(data) });
    }
  } catch { throw new Error('Invalid raster image or image size limit exceeded.'); }
  const content = {
    layout: { rows: document.board.layout.rows, columns: document.board.layout.columns }, openLinksIn: document.board.openLinksIn,
    tiles: document.board.tiles.map(tile => ({ ...validation.fields(tile), image: images.get(tile.image) ?? null })),
  };
  return { document, summary: {
    tiles: document.board.tiles.length, images: document.images.length, imageBytes,
    rows: document.board.layout.rows, columns: document.board.layout.columns,
    openLinksIn: document.board.openLinksIn, locale: document.locale ?? null,
    sha256: hash(bytes), contentSha256: hash(JSON.stringify(content)),
  } };
}

export async function readBackup(file) {
  const handle = await fs.open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limits.backupBytes) throw new Error('Expected a regular backup file under 100 MiB.');
    // Bounded read also protects against a file growing after stat().
    const bytes = Buffer.alloc(stat.size + 1);
    let length = 0;
    while (length < bytes.length) {
      const result = await handle.read(bytes, length, bytes.length - length, null);
      if (!result.bytesRead) break;
      length += result.bytesRead;
    }
    if (length !== stat.size) throw new Error('Backup changed while reading; export it again.');
    const data = bytes.subarray(0, length);
    return { bytes: data, ...validateBackup(data) };
  } finally { await handle.close(); }
}

export function sameRestoredContent(source, destination) {
  return source.contentSha256 === destination.contentSha256 && (source.locale === null || source.locale === destination.locale);
}

export async function prepareDirectory(directory = backupDirectory) {
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const stat = await fs.lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Backup directory must be a real local directory, not a symlink.');
  if (process.getuid && stat.uid !== process.getuid()) throw new Error('Backup directory must belong to the current user.');
  await fs.chmod(directory, 0o700);
  return directory;
}

export function assertGitProtection() {
  execFileSync('git', ['check-ignore', '-q', '--', 'backups/probe.json'], { cwd: root, stdio: 'ignore' });
  if (execFileSync('git', ['ls-files', '--', 'backups/'], { cwd: root, encoding: 'utf8' }).trim()) {
    throw new Error('Tracked files found in backups/. Untrack them before continuing.');
  }
}

export async function commitBackup(temporary, file, io = fs) {
  try { await io.link(temporary, file); }
  catch (error) {
    if (!['ENOTSUP', 'EOPNOTSUPP', 'EPERM', 'ENOSYS', 'EXDEV'].includes(error.code)) throw error;
    // Some local volumes do not support hard links. Exclusive creation still
    // prevents overwriting another backup; only our own partial output is removed.
    const destination = await io.open(file, 'wx', 0o600);
    try {
      await destination.writeFile(await io.readFile(temporary));
      await destination.sync();
      await destination.close();
    } catch (failure) {
      await destination.close().catch(() => {});
      await io.unlink(file).catch(() => {});
      throw failure;
    }
  }
}

export async function saveBackup(source, { directory = backupDirectory, label = 'backup' } = {}) {
  if (!/^[a-z0-9-]{1,64}$/.test(label)) throw new Error('Invalid backup label.');
  const validated = await readBackup(source);
  await prepareDirectory(directory);
  const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${label}-${randomUUID().slice(0, 8)}`;
  const file = path.join(directory, `${name}.json`);
  const temporary = path.join(directory, `.${name}.tmp`);
  const handle = await fs.open(temporary, 'wx', 0o600);
  try {
    try { await handle.writeFile(validated.bytes); await handle.sync(); }
    finally { await handle.close(); }
    await commitBackup(temporary, file);
  } finally { await fs.unlink(temporary); }
  const checked = await readBackup(file);
  if (checked.summary.sha256 !== validated.summary.sha256) throw new Error('Saved backup failed read-back verification.');
  const receipt = { format: 'speedial-local-receipt', version: 1, savedAt: new Date().toISOString(), ...checked.summary };
  await fs.writeFile(path.join(directory, `${name}.receipt.json`), JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
  return { file, ...checked.summary };
}

const downloadPattern = /^speedial-backup-\d{4}-\d{2}-\d{2}(?: ?\(\d+\)|[._-]\d+)?\.json$/i;
export async function downloadSnapshot(directory, io = fs) {
  const result = new Map();
  for (const entry of await io.readdir(directory, { withFileTypes: true })) {
    if (!entry.isFile() || !downloadPattern.test(entry.name)) continue;
    const file = path.join(directory, entry.name);
    try {
      const stat = await io.lstat(file, { bigint: true });
      if (stat.isFile()) result.set(file, `${stat.ino}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return result;
}

export async function waitForExport(directory, baseline, { timeoutMs = 600_000, pollMs = 500 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let previous = new Map();
  while (Date.now() < deadline) {
    const current = await downloadSnapshot(directory);
    const changed = [...current].filter(([file, stamp]) => baseline.get(file) !== stamp);
    if (changed.length > 1) throw new Error('Several new exports found. Retry with a dedicated download folder or use backup --file.');
    if (changed.length === 1) {
      const [file, stamp] = changed[0];
      const partial = await Promise.all(['.crdownload', '.part'].map(suffix => fs.access(file + suffix).then(() => true, () => false)));
      if (previous.get(file) === stamp && !partial.some(Boolean)) {
        await readBackup(file);
        await fs.chmod(file, 0o600);
        return file;
      }
    }
    previous = current;
    await delay(pollMs);
  }
  throw new Error('Timed out waiting for a fresh Speed Dial export. Existing files were not selected.');
}

export async function installedBrowsers() {
  const found = [];
  for (const [id, name] of Object.entries(browsers)) {
    for (const base of ['/Applications', path.join(os.homedir(), 'Applications'), '/System/Applications']) {
      const app = path.join(base, `${name}.app`);
      if (await fs.stat(app).then(s => s.isDirectory(), () => false)) { found.push({ id, app }); break; }
    }
  }
  return found;
}

export async function openBrowser({ browser = 'chrome', app, noOpen = false }) {
  if (noOpen) return;
  if (process.platform !== 'darwin') throw new Error('Automatic launch is macOS-only. Use --no-open and open the site in your browser.');
  if (!app) {
    if (!Object.hasOwn(browsers, browser)) throw new Error('Unknown browser. Use --list-browsers, --app, or --no-open.');
    app = (await installedBrowsers()).find(item => item.id === browser)?.app;
  }
  if (!app || !path.isAbsolute(app) || !app.endsWith('.app') || !(await fs.stat(app)).isDirectory()) {
    throw new Error('Browser not installed at a standard path. Use --app /absolute/Browser.app or --no-open.');
  }
  execFileSync('/usr/bin/open', ['-a', app, primaryUrl], { stdio: 'ignore' });
}
