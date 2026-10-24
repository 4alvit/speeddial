import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fuzz as backup } from './backup.mjs';
import { fuzz as images } from './images.mjs';

let count = 0;
for (const [name, fuzz] of [['backup', backup], ['images', images]]) {
  const corpus = new URL(`./corpus/${name}/`, import.meta.url);
  const seeds = readdirSync(corpus).sort();
  assert(seeds.length > 0);
  for (const seed of seeds) { fuzz(readFileSync(new URL(seed, corpus))); count++; }
  for (const value of ['', '{', 'null', '[]', '__proto__', '\u0000']) { fuzz(Buffer.from(value)); count++; }
  for (let byte = 0; byte < 256; byte++) {
    fuzz(Buffer.alloc(byte % 48, byte));
    count++;
  }
}
console.log(`Replayed ${count} deterministic production-boundary cases; no timed mutation.`);
