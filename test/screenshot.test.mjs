import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, copyFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker } from 'node:worker_threads';
import { setTimeout as delay } from 'node:timers/promises';

async function fixture(t) {
  const dir = await mkdtemp(path.join(tmpdir(), 'speeddial-capture-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await Promise.all(['screenshot.mjs', 'screenshot-worker.mjs', 'safe-proxy.mjs'].map(name =>
    copyFile(new URL(`../${name}`, import.meta.url), path.join(dir, name))));
  return dir;
}
async function driver(dir, source) {
  const target = path.join(dir, 'node_modules/playwright-core');
  await mkdir(target, { recursive: true });
  await writeFile(path.join(target, 'package.json'), JSON.stringify({
    name: 'playwright-core', type: 'module', exports: './index.js',
  }));
  await writeFile(path.join(target, 'index.js'), source);
}
const workingDriver = `
  export const chromium = { launch: async () => ({
    newContext: async () => ({
      on() {},
      newPage: async () => ({ on() {}, goto: async () => ({ status: () => 200 }),
        waitForTimeout: async () => {}, screenshot: async () => Buffer.from('image') }),
    }),
    close: async () => {},
  }) };
`;
const loadCapture = async dir => (await import(pathToFileURL(path.join(dir, 'screenshot.mjs')))).capture;

test('screenshot module loads without Playwright and validates URLs before starting a worker', async t => {
  const dir = await fixture(t);
  const capture = await loadCapture(dir);
  await assert.rejects(capture('file:///tmp/example'), /https?:\/\//);
  await assert.rejects(capture('not a URL'), { code: 'ERR_INVALID_URL' });
  // Only a valid capture reaches the optional-at-startup browser dependency.
  await assert.rejects(capture('https://example.com'), error =>
    error.code === 'ERR_MODULE_NOT_FOUND' && /playwright-core/.test(error.message));
});

test('blocked browser-driver startup leaves the parent responsive and returns a Buffer', async t => {
  const dir = await fixture(t);
  const started = path.join(dir, 'driver-started');
  const released = path.join(dir, 'driver-released');
  await driver(dir, `
    import { writeFileSync, existsSync } from 'node:fs';
    writeFileSync(${JSON.stringify(started)}, 'started');
    const deadline = Date.now() + 10000;
    while (!existsSync(${JSON.stringify(released)}) && Date.now() < deadline) {}
    if (!existsSync(${JSON.stringify(released)})) throw new Error('Parent could not release blocked driver');
    ${workingDriver}
  `);
  const capture = await loadCapture(dir);
  const pending = capture('https://example.com');
  // Attach an early rejection handler so a broken implementation reports through
  // the assertions rather than producing an unrelated unhandled rejection.
  pending.catch(() => {});
  const deadline = Date.now() + 10000;
  while (!existsSync(started)) {
    assert(Date.now() < deadline, 'Driver did not start');
    await delay(5);
  }
  await delay(20);
  await writeFile(released, 'released by the parent event loop');
  const bytes = await pending;
  assert(Buffer.isBuffer(bytes));
  assert.equal(bytes.toString(), 'image');
});

test('browser errors propagate and the capture worker closes its proxy', async t => {
  const dir = await fixture(t);
  const closed = path.join(dir, 'proxy-closed');
  await driver(dir, `export const chromium = { launch: async () => {
    const error = new Error('Browser launch failed'); error.code = 'TEST_LAUNCH'; throw error;
  } };`);
  await writeFile(path.join(dir, 'safe-proxy.mjs'), `
    import { writeFileSync } from 'node:fs';
    export const parseWebURL = value => new URL(value);
    export const createSafeProxy = async () => ({ url: 'http://127.0.0.1:1',
      close() { writeFileSync(${JSON.stringify(closed)}, 'closed'); } });
  `);
  const capture = await loadCapture(dir);
  await assert.rejects(capture('https://example.com'), { message: 'Browser launch failed', code: 'TEST_LAUNCH' });
  await access(closed);
});

test('unexpected worker errors and exits reject instead of leaving capture pending', async t => {
  for (const [source, pattern] of [
    ["throw new Error('Unexpected worker failure');", /Unexpected worker failure/],
    ['process.exit(7);', /exited without a result \(code 7\)/],
  ]) {
    const dir = await fixture(t);
    await writeFile(path.join(dir, 'screenshot-worker.mjs'), source);
    const capture = await loadCapture(dir);
    await assert.rejects(capture('https://example.com'), pattern);
  }
});

test('capture can be imported and called from another worker', async t => {
  const dir = await fixture(t);
  await driver(dir, workingDriver);
  const worker = new Worker(`
    const { parentPort } = require('node:worker_threads');
    (async () => {
      // Importing the implementation here must not execute its worker entry.
      await import(${JSON.stringify(pathToFileURL(path.join(dir, 'screenshot-worker.mjs')).href)});
      const { capture } = await import(${JSON.stringify(pathToFileURL(path.join(dir, 'screenshot.mjs')).href)});
      const bytes = await capture('https://example.com');
      parentPort.postMessage({ buffer: Buffer.isBuffer(bytes), text: bytes.toString() });
      parentPort.close();
    })().catch(error => { throw error; });
  `, { eval: true, workerData: { url: 'https://example.org' } });
  t.after(() => worker.terminate());
  const result = await new Promise((resolve, reject) => {
    let received = false;
    worker.once('message', message => { received = true; resolve(message); });
    worker.once('error', reject);
    worker.once('exit', code => { if (!received) reject(new Error(`Caller worker exited without a result (${code})`)); });
  });
  assert.deepEqual(result, { buffer: true, text: 'image' });
});

test('screenshot cleanup closes its proxy even when a crashed browser rejects shutdown', async t => {
  const dir = await fixture(t);
  await driver(dir, workingDriver.replace('close: async () => {},', "close: async () => { throw new Error('Browser shutdown failed'); },"));
  await writeFile(path.join(dir, 'safe-proxy.mjs'), `
    export const state = { closed: false };
    export const parseWebURL = value => new URL(value);
    export const createSafeProxy = async () => ({ url: 'http://127.0.0.1:1',
      close() { state.closed = true; } });
  `);
  const { capturePage } = await import(pathToFileURL(path.join(dir, 'screenshot-worker.mjs')));
  const { state } = await import(pathToFileURL(path.join(dir, 'safe-proxy.mjs')));
  await assert.rejects(capturePage('https://example.com'), /Browser shutdown failed/);
  assert.equal(state.closed, true, 'A failing browser.close() must not leak the safe proxy');
});
