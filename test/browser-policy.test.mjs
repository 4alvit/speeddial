import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
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
