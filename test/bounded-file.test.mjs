import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { readBoundedFile } from '../bounded-file.mjs';

function fixture(t, content = 'original') {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'speeddial-bounded-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const filename = path.join(directory, 'input');
  fs.writeFileSync(filename, content);
  return { directory, filename };
}

test('bounded reader accepts exact limit and empty files, rejects oversize before reading', t => {
  const { filename } = fixture(t);
  assert.equal(readBoundedFile(filename, 8).toString(), 'original');
  const read = t.mock.method(fs, 'readSync', () => { throw new Error('must not read'); });
  assert.throws(() => readBoundedFile(filename, 7), /byte limit/);
  assert.equal(read.mock.callCount(), 0);
  read.mock.restore();
  fs.writeFileSync(filename, '');
  assert.equal(readBoundedFile(filename, 0).length, 0);
});

test('growth after fstat reads at most limit plus one and always closes the descriptor', t => {
  const { filename } = fixture(t, 'a');
  const originalRead = fs.readSync, originalClose = fs.closeSync;
  let descriptor, requested = 0;
  t.mock.method(fs, 'readSync', (fd, buffer, offset, length, position) => {
    descriptor = fd; requested += length;
    fs.appendFileSync(filename, 'x'.repeat(1024));
    return originalRead(fd, buffer, offset, length, position);
  });
  const close = t.mock.method(fs, 'closeSync', fd => originalClose(fd));
  assert.throws(() => readBoundedFile(filename, 8), /byte limit|changed while reading/);
  assert.equal(requested, 2, 'allocation and read follow the smaller original size plus one');
  assert.ok(close.mock.calls.some(call => call.arguments[0] === descriptor));
  assert.throws(() => fs.fstatSync(descriptor), { code: 'EBADF' });
});

test('same-size content changes during reading are rejected', t => {
  const { filename } = fixture(t);
  const originalRead = fs.readSync;
  let changed = false;
  t.mock.method(fs, 'readSync', (...args) => {
    const count = originalRead(...args);
    if (!changed) {
      changed = true;
      fs.writeFileSync(filename, 'modified');
      fs.utimesSync(filename, new Date(1000), new Date(1000));
    }
    return count;
  });
  assert.throws(() => readBoundedFile(filename, 8), /changed while reading/);
});

test('pinned source rejects a replacement inode or final symlink; projected input symlinks still work', t => {
  const { directory, filename } = fixture(t);
  const expectedStat = fs.lstatSync(filename);
  const original = path.join(directory, 'old');
  fs.renameSync(filename, original);
  fs.writeFileSync(filename, 'foreign');
  assert.throws(() => readBoundedFile(filename, 8, { expectedStat }), /changed before reading/);
  fs.unlinkSync(filename);
  fs.symlinkSync(original, filename);
  assert.throws(() => readBoundedFile(filename, 8, { expectedStat }));
  assert.equal(readBoundedFile(filename, 8).toString(), 'original');
});

test('pinned source rejects a final symlink even if the platform ignores O_NOFOLLOW', t => {
  const { directory, filename } = fixture(t);
  const expectedStat = fs.lstatSync(filename, { bigint: true });
  const original = path.join(directory, 'old');
  fs.renameSync(filename, original);
  fs.symlinkSync(original, filename);
  const originalOpen = fs.openSync;
  t.mock.method(fs, 'openSync', (target, flags) => originalOpen(target, flags & ~(fs.constants.O_NOFOLLOW || 0)));
  assert.throws(() => readBoundedFile(filename, 8, { expectedStat }), /changed before reading/);
});

test('pinned source rejects path replacement after opening without reading foreign content', t => {
  const { filename } = fixture(t);
  const expectedStat = fs.lstatSync(filename, { bigint: true });
  const originalOpen = fs.openSync;
  t.mock.method(fs, 'openSync', (target, flags) => {
    const fd = originalOpen(target, flags);
    fs.renameSync(filename, filename + '.old');
    const replacement = originalOpen(filename, 'w');
    fs.writeSync(replacement, 'foreign');
    fs.closeSync(replacement);
    return fd;
  });
  const read = t.mock.method(fs, 'readSync', () => { throw new Error('must not read'); });
  assert.throws(() => readBoundedFile(filename, 8, { expectedStat }), /changed before reading/);
  assert.equal(read.mock.callCount(), 0);
});

test('directory is rejected as a nonregular input', t => {
  const { directory } = fixture(t);
  assert.throws(() => readBoundedFile(directory, 8), /regular file/);
});

test('FIFO is rejected without waiting for a writer', { skip: process.platform === 'win32' }, t => {
  const { directory } = fixture(t);
  const fifo = path.join(directory, 'fifo');
  assert.equal(spawnSync('mkfifo', [fifo]).status, 0);
  assert.throws(() => readBoundedFile(fifo, 8), /regular file/);
});

test('invalid limits fail before opening a file', () => {
  for (const limit of [-1, 0.5, Infinity, NaN, 16 * 1024 * 1024 + 1])
    assert.throws(() => readBoundedFile('/does-not-exist', limit), /Invalid file byte limit/);
});
