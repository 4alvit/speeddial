import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const script = fileURLToPath(new URL('../scripts/migrate-private-data.py', import.meta.url));
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const run = (...args) => {
  const result = spawnSync('python3', [script, ...args], { encoding: 'utf8' });
  assert.equal(result.stderr, '', 'Tool must not expose paths or data in a traceback');
  return { status: result.status, data: JSON.parse(result.stdout), output: result.stdout };
};
const privateMode = file => fs.statSync(file).mode & 0o777;

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'speeddial-migrate-test-'));
  const source = path.join(root, 'source'), legacy = path.join(root, 'legacy');
  fs.mkdirSync(path.join(source, 'images'), { recursive: true });
  fs.mkdirSync(legacy);
  fs.writeFileSync(path.join(source, 'images', 'current.png'), 'current synthetic image');
  fs.writeFileSync(path.join(source, 'images', 'history.png'), 'history-only synthetic image');
  fs.writeFileSync(path.join(source, 'images', 'unreferenced.png'), 'retained unreferenced image');
  fs.writeFileSync(path.join(legacy, 'original.png'), 'legacy synthetic image');
  fs.writeFileSync(path.join(source, 'session.key'), 'DO_NOT_COPY_OR_PRINT_THIS_SIGNING_KEY');
  const database = new DatabaseSync(path.join(source, 'speeddial.sqlite'));
  database.exec('CREATE TABLE board(id INTEGER PRIMARY KEY, value TEXT NOT NULL); CREATE TABLE history(id INTEGER PRIMARY KEY, created TEXT NOT NULL, value TEXT NOT NULL)');
  const board = '{ "revision" : 19, "tiles" : [{"id":"one","title":"DO_NOT_PRINT_PRIVATE_TITLE", "url":"https://private.invalid/", "image":"/legacy/images/original.png"},{"id":"two","image":"/images/current.png"}], "custom" : true }';
  const history = '{"revision": 18, "tiles": [{"id":"removed","image":"/images/history.png"}]}';
  database.prepare('INSERT INTO board VALUES (1,?)').run(board);
  database.prepare('INSERT INTO history VALUES (1,?,?)').run('synthetic timestamp', history);
  database.close();
  return { root, source, legacy, board, history, destination: path.join(root, 'prepared') };
}

function readValues(directory) {
  const database = new DatabaseSync(path.join(directory, 'speeddial.sqlite'), { readOnly: true });
  const result = {
    board: database.prepare('SELECT CAST(value AS BLOB) AS value FROM board').get().value,
    history: database.prepare('SELECT CAST(value AS BLOB) AS value FROM history').get().value,
  };
  database.close();
  return result;
}

function migrateArgs(data, extra = []) {
  return ['migrate', '--source-dir', data.source, '--legacy-images', data.legacy, '--destination', data.destination, ...extra];
}

test('offline migration defaults to dry-run and preserves exact DB values, every image, and source bytes', () => {
  const data = fixture();
  try {
    const sourceHash = hash(path.join(data.source, 'speeddial.sqlite'));
    const dry = run(...migrateArgs(data));
    assert.equal(dry.status, 0);
    assert.equal(dry.data.mode, 'dry-run');
    assert.equal(fs.existsSync(data.destination), false);
    assert.equal(dry.data.legacy_images, 1);
    assert.equal(dry.data.runtime_images, 3);
    assert.equal(dry.data.history_rows, 1);
    assert.equal(dry.data.referenced_images, 3);
    assert.doesNotMatch(dry.output, /DO_NOT_|private\.invalid|source|\.png|session\.key/);
    const result = run(...migrateArgs(data, ['--execute']));
    assert.equal(result.status, 0);
    assert.equal(result.data.board_history_unchanged, true);
    assert.equal(result.data.auth_files_copied, 0);
    assert.equal(fs.existsSync(path.join(data.destination, 'session.key')), false);
    assert.equal(privateMode(data.destination), 0o700);
    for (const name of ['speeddial.sqlite', 'migration-manifest.json', 'images/current.png', 'legacy-images/original.png'])
      assert.equal(privateMode(path.join(data.destination, name)), 0o600);
    const values = readValues(data.destination);
    assert.equal(Buffer.from(values.board).toString(), data.board);
    assert.equal(Buffer.from(values.history).toString(), data.history);
    for (const name of ['current.png', 'history.png', 'unreferenced.png'])
      assert.equal(hash(path.join(data.destination, 'images', name)), hash(path.join(data.source, 'images', name)));
    assert.equal(hash(path.join(data.destination, 'legacy-images/original.png')), hash(path.join(data.legacy, 'original.png')));
    assert.equal(hash(path.join(data.source, 'speeddial.sqlite')), sourceHash);
    assert.equal(run('verify', '--source-dir', data.destination).status, 0);
    assert.equal(run(...migrateArgs(data, ['--execute'])).data.code, 'DESTINATION_EXISTS');
  } finally { fs.rmSync(data.root, { recursive: true, force: true }); }
});

test('rollback produces a verified new data-only copy, refuses auth, and detects tampered images', () => {
  const data = fixture();
  try {
    assert.equal(run(...migrateArgs(data, ['--execute'])).status, 0);
    const restored = path.join(data.root, 'restored');
    const args = ['rollback', '--source-dir', data.destination, '--destination', restored];
    assert.equal(run(...args).data.mode, 'dry-run');
    assert.equal(fs.existsSync(restored), false);
    assert.equal(run(...args, '--execute').status, 0);
    assert.deepEqual(readValues(restored), readValues(data.destination));
    assert.equal(run('verify', '--source-dir', restored).status, 0);
    assert.equal(fs.existsSync(path.join(restored, 'session.key')), false);
    fs.writeFileSync(path.join(restored, 'session.key'), 'old signing secret');
    assert.equal(run('verify', '--source-dir', restored).data.code, 'AUTH_FILE_IN_SNAPSHOT');
    fs.writeFileSync(path.join(data.destination, 'images/history.png'), 'changed');
    assert.equal(run('verify', '--source-dir', data.destination).data.code, 'IMAGE_HASH_MISMATCH');
  } finally { fs.rmSync(data.root, { recursive: true, force: true }); }
});

test('migration validates historical image references, unsafe symlinks and archive traversal', () => {
  const data = fixture();
  try {
    fs.unlinkSync(path.join(data.source, 'images/history.png'));
    assert.equal(run(...migrateArgs(data)).data.code, 'REFERENCED_IMAGE_MISSING');
    fs.symlinkSync(path.join(data.source, 'session.key'), path.join(data.source, 'images/history.png'));
    assert.equal(run(...migrateArgs(data)).data.code, 'NON_REGULAR_FILE');
    const archive = path.join(data.root, 'unsafe.tar.gz');
    const creation = spawnSync('python3', ['-c', `import tarfile,io,sys\nwith tarfile.open(sys.argv[1],'w:gz') as t:\n m=tarfile.TarInfo('../escape');m.size=3;t.addfile(m,io.BytesIO(b'bad'))`, archive]);
    assert.equal(creation.status, 0);
    const response = run('migrate', '--source-archive', archive, '--legacy-images', data.legacy, '--destination', data.destination);
    assert.equal(response.data.code, 'UNSAFE_ARCHIVE_ENTRY');
    assert.equal(fs.existsSync(path.join(data.root, 'escape')), false);
  } finally { fs.rmSync(data.root, { recursive: true, force: true }); }
});

test('archive migration consolidates a committed WAL without changing snapshot originals', () => {
  const data = fixture();
  const database = new DatabaseSync(path.join(data.source, 'speeddial.sqlite'));
  try {
    database.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0');
    const updated = data.board.replace('19', '20');
    database.prepare('UPDATE board SET value=? WHERE id=1').run(updated);
    const archive = path.join(data.root, 'wal.tar.gz');
    const creation = spawnSync('python3', ['-c', `import tarfile,sys\nwith tarfile.open(sys.argv[1],'w:gz') as t:t.add(sys.argv[2],arcname='data')`, archive, data.source]);
    assert.equal(creation.status, 0);
    const before = hash(archive);
    const response = run('migrate', '--source-archive', archive, '--legacy-images', data.legacy, '--destination', data.destination, '--execute');
    assert.equal(response.status, 0);
    assert.equal(Buffer.from(readValues(data.destination).board).toString(), updated);
    assert.equal(hash(archive), before);
    assert.equal(fs.existsSync(path.join(data.destination, 'speeddial.sqlite-wal')), false);
    assert.equal(run('verify', '--source-dir', data.destination).status, 0);
  } finally { database.close(); fs.rmSync(data.root, { recursive: true, force: true }); }
});

test('credential preparation is explicit, private, exclusive and never prints credentials', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'speeddial-credentials-test-'));
  try {
    const destination = path.join(root, 'auth');
    const args = ['credentials', '--destination', destination];
    assert.equal(run(...args).data.mode, 'dry-run');
    assert.equal(fs.existsSync(destination), false);
    const result = run(...args, '--execute');
    assert.equal(result.status, 0);
    assert.equal(privateMode(destination), 0o700);
    const token = fs.readFileSync(path.join(destination, 'access-token'), 'utf8').trim();
    const key = fs.readFileSync(path.join(destination, 'session-key'));
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    assert.equal(key.length, 48);
    assert.equal(privateMode(path.join(destination, 'access-token')), 0o600);
    assert.equal(privateMode(path.join(destination, 'session-key')), 0o600);
    assert.equal(result.output.includes(token), false);
    assert.equal(result.output.includes(key.toString('base64')), false);
    assert.equal(run(...args, '--execute').data.code, 'DESTINATION_EXISTS');
    assert.equal(fs.readFileSync(path.join(destination, 'access-token'), 'utf8').trim(), token);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});
