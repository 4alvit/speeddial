import assert from 'node:assert/strict';
import '../local/storage.js';

const { validation, limits } = globalThis.SpeedialStorage;
const rejected = new Set(['INVALID_BACKUP', 'INVALID_URL', 'INVALID_TITLE', 'TITLE_TOO_LONG', 'INVALID_LAYOUT', 'INVALID_LINK_TARGET', 'BACKUP_TOO_LARGE']);

// Exercise the production import boundary, without opening IndexedDB or a browser.
export function fuzz(data) {
  if (data.length > 65536) return;
  const text = data.toString('utf8');
  let document;
  try { document = validation.parseBackupDocument(text); }
  catch (error) {
    assert(rejected.has(error.code), `unexpected import failure: ${error.stack}`);
    assert([400, 413].includes(error.status));
    return;
  }
  assert.deepEqual(validation.parseBackupDocument(JSON.stringify(document)), document);
  assert(document.board.tiles.length <= limits.tiles);
  assert(document.images.length <= limits.tiles);
  const ids = new Set();
  for (const tile of document.board.tiles) {
    assert(!ids.has(tile.id));
    ids.add(tile.id);
    const normalized = validation.fields(tile);
    const url = new URL(normalized.url);
    assert(['http:', 'https:'].includes(url.protocol));
    assert.equal(url.username, '');
    assert.equal(url.password, '');
    assert.deepEqual(validation.fields(normalized), normalized);
  }
  assert.equal(Object.getPrototypeOf(document), Object.prototype);
  assert(!Object.hasOwn(document, '__proto__'));
}
