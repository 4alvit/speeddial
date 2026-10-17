import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { assets, buildLocal, projectRoot } from '../scripts/build-local.mjs';

test('public export only includes audited code assets, never seeds, secrets or repository history', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'speedial-build-'));
  try {
    const input = path.join(dir, 'input');
    for (const name of Object.values(assets)) {
      await fs.mkdir(path.dirname(path.join(input, name)), { recursive: true });
      try { await fs.copyFile(path.join(projectRoot, name), path.join(input, name)); }
      catch (error) { if (name !== 'local/local.css' || error.code !== 'ENOENT') throw error; }
    }
    for (const name of ['.env', '.git/config', 'data/state.sqlite', 'public/private-bookmarks.json', 'local/backup.json']) {
      await fs.mkdir(path.dirname(path.join(input, name)), { recursive: true });
      await fs.writeFile(path.join(input, name), 'SYNTHETIC_PRIVATE_CANARY');
    }
    const output = path.join(dir, 'output');
    const result = await buildLocal({ sourceRoot: input, outDir: output });
    assert.deepEqual((await fs.readdir(output)).sort(), result.map(a => a.path).sort());
    for (const name of await fs.readdir(output)) {
      assert.ok(Object.hasOwn(assets, name));
      assert.equal((await fs.readFile(path.join(output, name), 'utf8')).includes('SYNTHETIC_PRIVATE_CANARY'), false);
    }
    await fs.rm(path.join(input, 'local/storage.js'));
    await fs.symlink(path.join(input, '.env'), path.join(input, 'local/storage.js'));
    await assert.rejects(buildLocal({ sourceRoot: input, outDir: output }), /regular file/);
    assert.deepEqual((await fs.readdir(output)).sort(), result.map(a => a.path).sort(), 'invalid input preserves previous build');
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('build refuses a network-enabled local app', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'speedial-network-'));
  try {
    const input = path.join(dir, 'input');
    for (const name of Object.values(assets)) {
      await fs.mkdir(path.dirname(path.join(input, name)), { recursive: true });
      try { await fs.copyFile(path.join(projectRoot, name), path.join(input, name)); }
      catch (error) { if (name !== 'local/local.css' || error.code !== 'ENOENT') throw error; }
    }
    await fs.appendFile(path.join(input, 'local/app.js'), '\nfetch("https://example.test/");\n');
    await assert.rejects(buildLocal({ sourceRoot: input, outDir: path.join(dir, 'output') }), /Unexpected networking/);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});

test('build never replaces input directories, including aliases through symlinked parents', async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'speedial-output-'));
  try {
    const input = path.join(dir, 'input');
    const originals = new Map();
    for (const name of Object.values(assets)) {
      await fs.mkdir(path.dirname(path.join(input, name)), { recursive: true });
      const bytes = await fs.readFile(path.join(projectRoot, name));
      await fs.writeFile(path.join(input, name), bytes);
      originals.set(name, bytes);
    }
    await fs.symlink(input, path.join(dir, 'alias'), 'junction');
    for (const outDir of [input, path.join(input, 'public'), path.join(input, 'local'), path.join(dir, 'alias/public')]) {
      await assert.rejects(buildLocal({ sourceRoot: input, outDir }), /never a source directory/);
      for (const [name, bytes] of originals)
        assert.deepEqual(await fs.readFile(path.join(input, name)), bytes, `preserve ${name}`);
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
