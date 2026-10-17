import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { linuxInventory } from '../scripts/browser-matrix.mjs';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const full = JSON.parse(fs.readFileSync(path.join(root, '.github/browser-compatibility.json')));
const linux = JSON.parse(fs.readFileSync(path.join(root, '.github/browser-compatibility-linux.json')));
const required = rows => rows.filter(row => row.tier === 'required');

test('self-hosted inventory is the exact bundled Linux subset without relabeling native targets', () => {
  assert.deepEqual(linux, linuxInventory(full));
  assert.equal(linux.length, 9);
  assert.equal(required(linux).length, 3);
  assert.deepEqual(required(linux).map(row => row.engine).sort(), ['chromium', 'firefox', 'webkit']);
  assert(linux.every(row => row.os === 'ubuntu-latest' && !row.channel));
  assert.equal(new Set(linux.map(row => row.id)).size, linux.length);
  for (const engine of ['chromium', 'firefox', 'webkit']) {
    assert.equal(new Set(linux.filter(row => row.engine === engine).map(row => row.playwright)).size, 3);
    assert.equal(new Set(linux.filter(row => row.engine === engine).map(row => row.browser_version)).size, 3);
  }
});

test('hosted inventory retains native OS coverage and branded channels', () => {
  assert.equal(full.length, 35);
  assert.equal(required(full).length, 5);
  assert.deepEqual(required(full).filter(row => row.os !== 'ubuntu-latest').map(row => [row.os, row.engine]), [
    ['windows-2022', 'chromium'], ['macos-15', 'webkit'],
  ]);
  assert.equal(full.filter(row => row.os !== 'ubuntu-latest').length, 22);
  assert.deepEqual(full.filter(row => row.os === 'ubuntu-latest' && row.channel).map(row => row.channel).sort(),
    ['chrome', 'chrome-beta', 'msedge', 'msedge-beta']);
});

test('every selected browser generation uses its exact isolated package and lock', () => {
  for (const row of full) {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, row.toolchain, 'package.json')));
    const lock = JSON.parse(fs.readFileSync(path.join(root, row.toolchain, 'package-lock.json')));
    assert.deepEqual(pkg.dependencies, { playwright: row.playwright });
    for (const name of ['playwright', 'playwright-core']) {
      assert.equal(lock.packages[`node_modules/${name}`].version, row.playwright);
    }
  }
});


test('Windows-style Git checkout preserves the strict generated inventory', () => {
  const checkout = fs.mkdtempSync(path.join(os.tmpdir(), 'speeddial-checkout-'));
  function command(file, args) {
    const result = spawnSync(file, args, { cwd: checkout, encoding: 'utf8' });
    assert.equal(result.status, 0, result.stderr || result.stdout || String(result.error));
  }
  try {
    command('git', ['init', '--quiet']);
    const files = ['.gitattributes', '.github/browser-compatibility.json',
      '.github/browser-compatibility-linux.json', 'scripts/browser-matrix.mjs'];
    for (const file of files) {
      fs.mkdirSync(path.dirname(path.join(checkout, file)), { recursive: true });
      fs.copyFileSync(path.join(root, file), path.join(checkout, file));
    }
    command('git', ['-c', 'core.autocrlf=false', 'add', '--', ...files]);
    for (const file of files) fs.unlinkSync(path.join(checkout, file));
    command('git', ['-c', 'core.autocrlf=true', 'checkout-index', '--all', '--force']);
    const inventory = fs.readFileSync(path.join(checkout, '.github/browser-compatibility-linux.json'), 'utf8');
    assert.equal(inventory.includes('\r'), false, 'Generated JSON must remain LF on Windows');
    command(process.execPath, ['scripts/browser-matrix.mjs']);
  } finally {
    fs.rmSync(checkout, { recursive: true, force: true });
  }
});
