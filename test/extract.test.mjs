import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { syntheticPng } from './fixtures.mjs';

const script = fileURLToPath(new URL('../legacy/extract.py', import.meta.url));
function extract(html, output, extra = []) {
  return spawnSync('python3', [script, '--html', html, '--output', output, '--encoding', 'utf-8', ...extra], { encoding: 'utf8' });
}
function page(image) {
  return `<div id="dials"><div id="slot1" class="slot"><a class="link" href="https://example.com/" title="Example"><img src="${image}"></a></div><div id="closedTabsBar"></div>`;
}

test('legacy extractor uses explicit locations and produces portable nonpersonal imports', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speeddial-extract-'));
  try {
    const html = path.join(dir, 'input.html'), output = path.join(dir, 'converted');
    fs.writeFileSync(html, page('data:image/png;base64,' + syntheticPng.toString('base64')));
    const result = extract(html, output, ['--expected-count', '1']);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stdout), { tileCount: 1, imageCount: 1 });
    const state = JSON.parse(fs.readFileSync(path.join(output, 'seed.json'), 'utf8'));
    assert.deepEqual(state.tiles[0], { id: 'legacy-slot1', title: 'Example', url: 'https://example.com/', image: '/legacy/images/slot1.png' });
    assert.deepEqual(fs.readFileSync(path.join(output, 'legacy-images/slot1.png')), syntheticPng);
    const provenance = JSON.parse(fs.readFileSync(path.join(output, 'provenance.json'), 'utf8'));
    assert.equal(provenance.sourceUrl, undefined, 'no private source address is inferred');
    assert.equal(extract(html, output).status, 1, 'existing output must not be replaced');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('legacy extractor rejects image traversal and external URLs before writing output', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'speeddial-extract-'));
  try {
    const html = path.join(dir, 'input.html'), output = path.join(dir, 'converted');
    for (const source of ['../outside.png', '%2e%2e/outside.png', 'https://example.org/image.png']) {
      fs.writeFileSync(html, page(source));
      assert.equal(extract(html, output).status, 1);
      assert.equal(fs.existsSync(output), false);
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
