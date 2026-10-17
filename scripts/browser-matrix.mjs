import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// A derived inventory keeps the Linux reserve honest: native OS and branded
// channel qualification remain in the full GitHub-hosted inventory.
export function linuxInventory(rows) {
  return rows.filter(row => row.os === 'ubuntu-latest' && !row.channel);
}

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = JSON.parse(fs.readFileSync(path.join(root, '.github/browser-compatibility.json')));
  const destination = path.join(root, '.github/browser-compatibility-linux.json');
  const expected = JSON.stringify(linuxInventory(source), null, 2) + '\n';
  if (process.argv.includes('--write')) fs.writeFileSync(destination, expected);
  else if (fs.readFileSync(destination, 'utf8') !== expected) {
    throw new Error('Linux browser inventory is stale; run node scripts/browser-matrix.mjs --write');
  }
}
