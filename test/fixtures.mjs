import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

// Deliberately synthetic; tests must never read a personal board or credential.
export const syntheticPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64');
export const syntheticTiles = (count = 20) => Array.from({ length: count }, (_, i) => ({
  id: `test-${i + 1}`, title: `Example site ${i + 1}`,
  url: `https://${i % 2 ? 'example.org' : 'example.com'}/site/${i + 1}`,
  image: '/legacy/images/example.png',
}));
export function createFixture(directory, { dataDir = path.join(directory, 'data'), count = 20 } = {}) {
  fs.mkdirSync(directory, { recursive: true });
  fs.mkdirSync(path.join(dataDir, 'legacy-images'), { recursive: true });
  const accessToken = randomBytes(32).toString('base64url');
  const tokenFile = path.join(directory, 'test-access-token');
  const keyFile = path.join(directory, 'test-session-key');
  const initialStateFile = path.join(directory, 'test-initial-state.json');
  fs.writeFileSync(tokenFile, accessToken + '\n', { mode: 0o600 });
  fs.writeFileSync(keyFile, randomBytes(48), { mode: 0o600 });
  fs.writeFileSync(initialStateFile, JSON.stringify({ tiles: syntheticTiles(count) }));
  fs.writeFileSync(path.join(dataDir, 'legacy-images/example.png'), syntheticPng);
  return {
    accessToken, entryPath: '/?access=' + encodeURIComponent(accessToken),
    env: { ACCESS_TOKEN_FILE: tokenFile, SESSION_KEY_FILE: keyFile, INITIAL_STATE_FILE: initialStateFile, DATA_DIR: dataDir },
  };
}
