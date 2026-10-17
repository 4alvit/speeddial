import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { validateBackup, sameRestoredContent, readBackup, saveBackup, prepareDirectory,
  downloadSnapshot, waitForExport, assertGitProtection, commitBackup } from '../scripts/browser-backup-lib.mjs';
import { syntheticPng } from './fixtures.mjs';

function fixture() {
  const image = randomUUID();
  return { format: 'speedial-local-backup', version: 1, createdAt: '2026-10-17T00:00:00Z', locale: 'en',
    board: { layout: { rows: 4, columns: 5 }, openLinksIn: 'same-window', tiles: [
      { id: randomUUID(), title: 'Synthetic', url: 'https://example.com/', image },
      { id: randomUUID(), title: 'Second', url: 'https://example.org/', image: null },
    ] }, images: [{ id: image, type: 'image/png', data: syntheticPng.toString('base64') }] };
}
const bytes = value => Buffer.from(JSON.stringify(value));
const summary = value => validateBackup(bytes(value)).summary;
async function workspace(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'speedial-backup-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return directory;
}

test('portable verification ignores regenerated IDs and JSON key order, preserves image bytes and ordered settings', () => {
  const original = fixture(); const imported = structuredClone(original);
  imported.createdAt = new Date().toISOString();
  imported.board.layout = { columns: 5, rows: 4 };
  imported.board.tiles.forEach(tile => { tile.id = randomUUID(); });
  imported.images[0].id = imported.board.tiles[0].image = randomUUID();
  assert.ok(sameRestoredContent(summary(original), summary(imported)));
  for (const change of [
    value => value.board.tiles.reverse(), value => { value.locale = 'ru'; },
    value => { value.board.layout.rows = 3; }, value => { value.board.openLinksIn = 'new-window'; },
    value => { value.board.tiles[0].title = 'Changed'; }, value => { value.board.tiles[0].url = 'https://example.net/'; },
    value => { const data = Buffer.from(syntheticPng); data[data.length - 1] ^= 1; value.images[0].data = data.toString('base64'); },
  ]) {
    const changed = structuredClone(imported); change(changed);
    assert.equal(sameRestoredContent(summary(original), summary(changed)), false);
  }
  delete original.locale;
  assert.ok(sameRestoredContent(summary(original), summary(imported)), 'legacy backup does not replace the destination language');
});

test('rejects missing image data, executable URLs, malformed base64 and raster disguises without printing data', () => {
  for (const change of [
    value => { value.images = []; }, value => { value.board.tiles[0].url = 'javascript:alert(1)'; },
    value => { value.images[0].data = 'AR=='; }, value => { value.images[0].data = Buffer.from('<svg>private</svg>').toString('base64'); },
  ]) {
    const value = fixture(); change(value);
    assert.throws(() => validateBackup(bytes(value)), error => !error.message.includes('private') && !error.message.includes('javascript:'));
  }
});

test('copies are complete, private, unique, read back, and never overwrite the source', async t => {
  const directory = await workspace(t); const source = path.join(directory, 'source.json');
  const data = bytes(fixture()); await fs.writeFile(source, data);
  const options = { directory: path.join(directory, 'backups') };
  const first = await saveBackup(source, options); const second = await saveBackup(source, options);
  assert.notEqual(first.file, second.file);
  assert.deepEqual(await fs.readFile(source), data);
  assert.deepEqual(await fs.readFile(first.file), data);
  assert.equal(first.tiles, 2); assert.equal(first.images, 1);
  assert.equal((await fs.readdir(options.directory)).length, 4);
  if (process.platform !== 'win32') {
    assert.equal((await fs.stat(first.file)).mode & 0o777, 0o600);
    assert.equal((await fs.stat(options.directory)).mode & 0o777, 0o700);
    const receipt = first.file.replace('.json', '.receipt.json');
    assert.equal((await fs.stat(receipt)).mode & 0o777, 0o600);
  }
});

test('invalid input leaves no output files and a symlink cannot redirect backup output', async t => {
  const directory = await workspace(t); const source = path.join(directory, 'bad.json');
  await fs.writeFile(source, '{"private":"invalid"}');
  const destination = path.join(directory, 'backup');
  await assert.rejects(saveBackup(source, { directory: destination }), /Invalid/);
  await assert.rejects(fs.stat(destination), { code: 'ENOENT' });
  if (process.platform !== 'win32') {
    await fs.symlink(directory, destination);
    await assert.rejects(prepareDirectory(destination), /symlink/);
    await assert.rejects(readBackup(destination), /regular|ELOOP/);
  }
});

test('watcher ignores old exports and waits for a completed collision-suffixed download', async t => {
  const directory = await workspace(t);
  await fs.writeFile(path.join(directory, 'speedial-backup-2026-10-17.json'), bytes(fixture()));
  const baseline = await downloadSnapshot(directory);
  const file = path.join(directory, 'speedial-backup-2026-10-17 (1).json');
  const partial = file + '.crdownload';
  await fs.writeFile(partial, 'partial');
  const waiting = waitForExport(directory, baseline, { timeoutMs: 1000, pollMs: 10 });
  await delay(30); await fs.writeFile(file, bytes(fixture()));
  await delay(30); await fs.unlink(partial);
  assert.equal(await waiting, file);
});

test('watcher detects overwrites but does not silently pick among several new exports', async t => {
  const directory = await workspace(t); const file = path.join(directory, 'speedial-backup-2026-10-17.json');
  await fs.writeFile(file, bytes(fixture())); const baseline = await downloadSnapshot(directory);
  await delay(10); await fs.writeFile(file, bytes(fixture()));
  assert.equal(await waitForExport(directory, baseline, { timeoutMs: 1000, pollMs: 10 }), file);
  await fs.writeFile(path.join(directory, 'speedial-backup-2026-10-17-1.json'), bytes(fixture()));
  await assert.rejects(waitForExport(directory, baseline, { timeoutMs: 100, pollMs: 10 }), /Several/);
});

test('watcher timeout never falls back to an old backup', async t => {
  const directory = await workspace(t);
  await fs.writeFile(path.join(directory, 'speedial-backup-2026-10-17.json'), bytes(fixture()));
  await assert.rejects(waitForExport(directory, await downloadSnapshot(directory), { timeoutMs: 25, pollMs: 10 }), /Timed out/);
});

test('repository ignores personal backups and never tracks them', () => { assertGitProtection(); });

test('unsupported hard links fall back to exclusive protected output without overwriting', async t => {
  const directory = await workspace(t); const temporary = path.join(directory, 'source.tmp');
  const file = path.join(directory, 'backup.json'); const data = bytes(fixture());
  await fs.writeFile(temporary, data);
  const io = { ...fs, link: async () => { throw Object.assign(new Error(), { code: 'ENOTSUP' }); } };
  await commitBackup(temporary, file, io);
  assert.deepEqual(await fs.readFile(file), data);
  await assert.rejects(commitBackup(temporary, file, io), { code: 'EEXIST' });
  assert.deepEqual(await fs.readFile(file), data);
  const failedFile = path.join(directory, 'failed.json');
  await assert.rejects(commitBackup(temporary, failedFile, { ...io, readFile: async () => { throw new Error('disk read failed'); } }), /disk read failed/);
  await assert.rejects(fs.stat(failedFile), { code: 'ENOENT' });
});

test('a disappearing download does not abort directory observation; access errors still fail', async () => {
  const entry = { name: 'speedial-backup-2026-10-17.json', isFile: () => true };
  const io = { readdir: async () => [entry], lstat: async () => { throw Object.assign(new Error(), { code: 'ENOENT' }); } };
  assert.equal((await downloadSnapshot('/synthetic', io)).size, 0);
  await assert.rejects(downloadSnapshot('/synthetic', { ...io, lstat: async () => { throw Object.assign(new Error(), { code: 'EACCES' }); } }), { code: 'EACCES' });
});
