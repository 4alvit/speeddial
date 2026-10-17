import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import vm from 'node:vm';
import '../local/storage.js';
import { syntheticPng } from './fixtures.mjs';

const { validation, inspectBackup, limits } = globalThis.SpeedialStorage;
const tileId = '8d1d393b-8b7b-4a9b-bf83-3ca9c4ae5922';
const imageId = '93d13209-60fd-4960-91d1-778fa139e5a7';
const backup = () => ({
  format: 'speedial-local-backup', version: 1, createdAt: '2026-10-17T00:00:00.000Z',
  board: { layout: { rows: 4, columns: 5 }, openLinksIn: 'same-window', tiles: [] }, images: [],
});
const code = expected => error => error?.code === expected;

test('local navigation accepts HTTP(S), normalizes URLs, and rejects executable or credentialed URLs', () => {
  assert.deepEqual(validation.fields({ url: 'https://EXAMPLE.com/a', title: '  Example  ' }), { url: 'https://example.com/a', title: 'Example' });
  assert.equal(validation.fields({ url: 'http://localhost:8080' }).title, 'localhost');
  for (const url of ['javascript:alert(1)', 'data:text/html,x', 'file:///tmp/x', 'blob:https://example.com/x', '//example.com', 'https://user:secret@example.com', 'https://example.com/\nscript', 'https://example.com/' + 'x'.repeat(4096)]) {
    assert.throws(() => validation.fields({ url }), code('INVALID_URL'), url);
  }
  assert.throws(() => validation.fields({ url: 'https://example.com/' + 'é'.repeat(2000) }), code('INVALID_URL'));
  assert.throws(() => validation.fields({ url: 'https://example.com', title: {} }), code('INVALID_TITLE'));
  assert.throws(() => validation.fields({ url: 'https://example.com', title: 'x'.repeat(301) }), code('TITLE_TOO_LONG'));
});

test('layout and link targets have explicit bounds', () => {
  assert.deepEqual(validation.layout({ rows: 1, columns: 12 }), { rows: 1, columns: 12 });
  for (const value of [null, { rows: 0, columns: 2 }, { rows: 13, columns: 2 }, { rows: '4', columns: 5 }, { rows: 1.5, columns: 5 }]) assert.throws(() => validation.layout(value), code('INVALID_LAYOUT'));
  assert.equal(validation.linkTarget('same-window'), 'same-window');
  assert.equal(validation.linkTarget('new-window'), 'new-window');
  assert.throws(() => validation.linkTarget('_parent'), code('INVALID_LINK_TARGET'));
});

test('base64 decoding rejects malformed, noncanonical, and oversized content', () => {
  assert.deepEqual(validation.base64Bytes('AQID'), new Uint8Array([1, 2, 3]));
  for (const value of ['', 'A===', 'AQI', 'AQ=I', 'AQID\n', 'AR==', '<svg>']) assert.throws(() => validation.base64Bytes(value), code('INVALID_IMAGE'));
  assert.throws(() => validation.base64Bytes('AQID', 1), code('IMAGE_TOO_LARGE'));
  const bytes = new Uint8Array(limits.imageBytes);
  const large = Buffer.from(bytes).toString('base64');
  assert.equal(validation.base64Bytes(large).length, limits.imageBytes);
});

test('raster signatures and dimensions are checked before browser decoding', () => {
  assert.deepEqual(validation.imageDimensions(new Uint8Array(syntheticPng), 'image/png'), { width: 1, height: 1 });
  assert.throws(() => validation.imageDimensions(new Uint8Array(syntheticPng), 'image/jpeg'), code('INVALID_IMAGE'));
  assert.throws(() => validation.imageDimensions(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), 'image/png'), code('INVALID_IMAGE'));
  const enormous = new Uint8Array(syntheticPng);
  new DataView(enormous.buffer).setUint32(16, 20000);
  assert.throws(() => validation.imageDimensions(enormous, 'image/png'), code('INVALID_IMAGE_SIZE'));
  const zero = new Uint8Array(syntheticPng);
  new DataView(zero.buffer).setUint32(20, 0);
  assert.throws(() => validation.imageDimensions(zero, 'image/png'), code('INVALID_IMAGE_SIZE'));
});

test('unknown versions, extra fields, remote images, prototype keys, and duplicate IDs are rejected', () => {
  assert.deepEqual(validation.parseBackupDocument(JSON.stringify(backup())), backup());
  const cases = [];
  let value = backup(); value.version = 2; cases.push(value);
  value = backup(); value.token = 'not-a-real-token'; cases.push(value);
  value = backup(); value.board.layout.extra = true; cases.push(value);
  value = backup(); value.locale = 'unsupported'; cases.push(value);
  value = backup(); value.board.tiles.push({ id: tileId, url: 'https://example.com', title: 'Example', image: 'https://example.com/private.png' }); cases.push(value);
  value = backup(); value.board.tiles.push({ id: tileId, url: 'https://example.com', title: 'Example', image: null }, { id: tileId, url: 'https://example.org', title: 'Other', image: null }); cases.push(value);
  value = backup(); value.board.tiles.push({ id: [tileId], url: 'https://example.com', title: 'Example', image: null }); cases.push(value);
  value = backup(); value.images.push({ id: imageId, type: 'image/png', data: syntheticPng.toString('base64') }); cases.push(value);
  for (const invalid of cases) assert.throws(() => validation.parseBackupDocument(JSON.stringify(invalid)), code('INVALID_BACKUP'));
  for (const key of ['__proto__', 'constructor', 'prototype']) {
    const text = JSON.stringify(backup()).replace('"rows":4', `"rows":4,"${key}":{}`);
    assert.throws(() => validation.parseBackupDocument(text), code('INVALID_BACKUP'));
  }
  assert.equal({}.polluted, undefined);
});

test('backup image references must be complete and belong to exactly one tile', () => {
  const value = backup();
  value.board.tiles.push({ id: tileId, url: 'https://example.com', title: 'Example', image: imageId });
  assert.throws(() => validation.parseBackupDocument(JSON.stringify(value)), code('INVALID_BACKUP'));
  value.images.push({ id: imageId, type: 'image/png', data: syntheticPng.toString('base64') });
  assert.equal(validation.parseBackupDocument(JSON.stringify(value)).images.length, 1);
  value.board.tiles.push({ ...value.board.tiles[0], id: '72d0c78f-e850-446e-bf6f-e10f5b0227dd' });
  assert.throws(() => validation.parseBackupDocument(JSON.stringify(value)), code('INVALID_BACKUP'));
});

test('inspection is immutable, accepts the locale preference, and rejects corrupt/zip/oversized backups', async () => {
  const value = backup(); value.locale = 'ru';
  const prepared = await inspectBackup(new Blob([JSON.stringify(value)]));
  assert.deepEqual(prepared.summary, { tileCount: 0, imageCount: 0, imageBytes: 0, locale: 'ru' });
  assert.ok(Object.isFrozen(prepared)); assert.ok(Object.isFrozen(prepared.summary));
  await assert.rejects(inspectBackup('PK\x03\x04not-a-json-backup'), code('INVALID_BACKUP'));
  await assert.rejects(inspectBackup('{"version":1'), code('INVALID_BACKUP'));
  const oversized = new Blob([new Uint8Array(limits.backupBytes + 1)]);
  await assert.rejects(inspectBackup(oversized), code('BACKUP_TOO_LARGE'));
});

test('browser decoder failure rejects a valid-looking header and successful validation preserves bytes', async () => {
  const previous = globalThis.createImageBitmap;
  try {
    globalThis.createImageBitmap = async () => { throw new DOMException('Synthetic decoder rejection', 'InvalidStateError'); };
    await assert.rejects(validation.validateImage(new Blob([syntheticPng], { type: 'image/png' })), code('INVALID_IMAGE'));
    let closed = false;
    globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() { closed = true; } });
    const image = await validation.validateImage(new Blob([syntheticPng], { type: 'image/png' }));
    assert.deepEqual(Buffer.from(await image.arrayBuffer()), syntheticPng);
    assert.ok(closed);
    await assert.rejects(validation.validateImage(new Blob(['<svg></svg>'], { type: 'image/svg+xml' })), code('IMAGE_TYPE_UNSUPPORTED'));
  } finally { if (previous) globalThis.createImageBitmap = previous; else delete globalThis.createImageBitmap; }
});

test('unavailable or blocked IndexedDB is explicit and never silently becomes ephemeral', async () => {
  const source = fs.readFileSync(new URL('../local/storage.js', import.meta.url), 'utf8');
  for (const blocked of [false, true]) {
    const context = vm.createContext({ Blob, URL, crypto: globalThis.crypto });
    if (blocked) Object.defineProperty(context, 'indexedDB', { get() { throw new DOMException('Synthetic storage denial', 'SecurityError'); } });
    vm.runInContext(source, context);
    await assert.rejects(context.SpeedialStorage.createStore(), error => error.code === 'STORAGE_UNAVAILABLE' && error.status === 503);
  }
});
